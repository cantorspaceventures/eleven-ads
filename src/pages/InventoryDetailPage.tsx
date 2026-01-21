import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Eye, DollarSign, ArrowLeft, Info, TrendingUp, Clock, CheckCircle, Shield, AlertTriangle, Calendar, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NegotiationModal from '@/components/NegotiationModal';
import CheckoutModal from '@/components/CheckoutModal';
import AIExplanationCard from '@/components/AIExplanationCard';

interface InventoryDetail {
  id: string;
  inventory_type: string;
  owner_id: string;
  location_emirate: string;
  location_data: {
    placement_name?: string; // Custom listing name (shown in header)
    address: string; // Placement type
    format: string;
    dimensions?: string;
    coordinates?: { lat: number; lng: number };
    // Context-specific identifiers
    physical_address?: string;
    app_name?: string;
    website_url?: string;
    platform_name?: string;
    // Extended Metadata
    station_format?: string;
    video_quality?: string;
    ad_skippable?: boolean;
    website_category?: string;
    app_category?: string;
  };
  audience_metrics: {
    daily_impressions: number;
    demographics: any;
    mau?: number;
    bounce_rate?: number;
  };
  base_price_aed: number;
  // CPM pricing for digital inventory
  min_spend_aed?: number;
  cost_per_impression_aed?: number;
  image_url?: string;
  premium_users: {
    business_name: string;
    verification_status: string;
  };
  dynamic_pricing: {
    final_price_aed: number;
    demand_multiplier: number;
    time_multiplier: number;
    availability_multiplier: number;
  }[];
}

// Helper to check if inventory is digital (uses CPM pricing)
const isDigitalType = (type: string) => 
  ['streaming_radio', 'streaming_video', 'app', 'web'].includes(type);

interface InventoryRules {
  access_mode: string;
  prohibited_categories: string[];
  brand_safety_level: string;
  additional_restrictions: string;
  deal_approval: {
    manualReviewFor?: {
      firstTimeBuyers?: boolean;
    };
  };
}

interface AvailabilitySettings {
  commitment_level: 'guaranteed' | 'best_effort' | 'remnant';
  min_booking_lead_time: string;
  campaign_approval_sla: string;
  block_out_periods: { id: string; fromDate: string; toDate: string; reason?: string }[];
}

const COMMITMENT_LABELS: Record<string, { label: string; color: string }> = {
  guaranteed: { label: 'Guaranteed Supply', color: 'bg-green-100 text-green-800' },
  best_effort: { label: 'Best Effort', color: 'bg-yellow-100 text-yellow-800' },
  remnant: { label: 'Remnant / Opportunistic', color: 'bg-gray-100 text-gray-700' },
};

const LEAD_TIME_LABELS: Record<string, string> = {
  no_lead: 'No minimum',
  '24_hours': '24 hours',
  '48_hours': '48 hours',
  '72_hours': '72 hours',
  '1_week': '1 week',
  '2_weeks': '2 weeks',
};

const SLA_LABELS: Record<string, string> = {
  auto_approve: 'Auto-approve',
  '1_business_hour': '1 business hour',
  '4_business_hours': '4 business hours',
  '24_hours': '24 hours',
  '48_hours': '48 hours',
};

const CATEGORY_LABELS: Record<string, string> = {
  alcohol_tobacco: 'Alcohol & Tobacco',
  gambling: 'Gambling & Betting',
  political: 'Political Campaigns',
  weight_loss: 'Weight Loss / Health Supplements',
  dating: 'Dating Services',
  adult: 'Adult Content',
  cryptocurrency: 'Cryptocurrency',
  firearms: 'Firearms & Weapons',
};

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<InventoryDetail | null>(null);
  const [rules, setRules] = useState<InventoryRules | null>(null);
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [priceUpdating, setPriceUpdating] = useState(false);

  useEffect(() => {
    fetchInventoryDetail();
    fetchInventoryRules();
    fetchAvailabilitySettings();

    // Subscribe to real-time price updates
    console.log('[Real-time] Setting up subscription for inventory:', id);
    const channel = supabase
      .channel(`dynamic_pricing_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'dynamic_pricing',
          filter: `inventory_id=eq.${id}`,
        },
        (payload) => {
          console.log('[Real-time] Received payload:', payload);
          
          // Animate price update
          setPriceUpdating(true);
          
          // Update item with new pricing
          const newData = payload.new as any;
          setItem((prev) => {
            if (!prev) return prev;
            console.log('[Real-time] Updating price from', prev.dynamic_pricing?.[0]?.final_price_aed, 'to', newData.final_price_aed);
            return {
              ...prev,
              dynamic_pricing: [{
                final_price_aed: newData.final_price_aed,
                demand_multiplier: newData.demand_multiplier,
                time_multiplier: newData.time_multiplier,
                availability_multiplier: newData.availability_multiplier,
              }],
            };
          });
          
          // Reset animation after delay
          setTimeout(() => setPriceUpdating(false), 1500);
        }
      )
      .subscribe((status, err) => {
        console.log('[Real-time] Subscription status:', status);
        if (err) console.error('[Real-time] Subscription error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchInventoryDetail = async () => {
    try {
      const res = await fetch(`/api/inventory/${id}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load inventory');
      }
      setItem(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryRules = async () => {
    try {
      const res = await fetch(`/api/inventory/${id}/rules`);
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    }
  };

  const fetchAvailabilitySettings = async () => {
    try {
      const res = await fetch(`/api/inventory/${id}/availability-settings`);
      const data = await res.json();
      if (data.success) {
        setAvailabilitySettings(data.data);
      }
    } catch (err) {
      console.error('Error fetching availability settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || 'Inventory not found'}</p>
        <Link to="/inventory" className="text-primary hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
        </Link>
      </div>
    );
  }

  const pricing = item.dynamic_pricing?.[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NegotiationModal 
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        inventory={item}
        currentPrice={pricing?.final_price_aed || item.base_price_aed}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        inventory={item}
        price={pricing?.final_price_aed || item.base_price_aed}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/inventory" className="flex items-center text-gray-500 hover:text-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back to Marketplace</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Inventory ID:</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{item.id.slice(0, 8)}...</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hero Image */}
            {item.image_url && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <img 
                  src={item.image_url} 
                  alt={item.location_data.placement_name || item.location_data.address}
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>
            )}

            {/* Title Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wide">
                      {item.inventory_type.replace('_', ' ')}
                    </span>
                    {item.premium_users.verification_status === 'verified' && (
                      <span className="flex items-center text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified Publisher
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-heading font-bold text-secondary mb-2">
                    {item.location_data.placement_name || item.location_data.address}
                  </h1>
                  {item.location_data.placement_name && (
                    <p className="text-sm text-gray-500 mb-2">Placement Type: {item.location_data.address}</p>
                  )}
                  <p className="text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {item.location_emirate}, United Arab Emirates
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-secondary mb-6">Inventory Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Ad Format</span>
                    <p className="text-gray-700 font-medium">{item.location_data.format}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Dimensions / Duration</span>
                    <p className="text-gray-700 font-medium">{item.location_data.dimensions || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Publisher</span>
                    <p className="text-gray-700 font-medium">{item.premium_users.business_name}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Daily Impressions</span>
                    <p className="text-gray-700 font-medium flex items-center">
                      <Eye className="w-4 h-4 mr-2 text-gray-400" />
                      {item.audience_metrics.daily_impressions.toLocaleString()}
                    </p>
                  </div>
                  {/* MAU for app/web */}
                  {item.audience_metrics.mau && (
                    <div>
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Monthly Active Users (MAU)</span>
                      <p className="text-gray-700 font-medium">{item.audience_metrics.mau.toLocaleString()}</p>
                    </div>
                  )}
                  {/* Bounce Rate for web */}
                  {item.audience_metrics.bounce_rate && (
                    <div>
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Bounce Rate</span>
                      <p className="text-gray-700 font-medium">{item.audience_metrics.bounce_rate}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital-Specific Details */}
              {isDigitalType(item.inventory_type) && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                    {item.inventory_type === 'streaming_radio' ? 'Audio Details' :
                     item.inventory_type === 'streaming_video' ? 'Video Details' :
                     item.inventory_type === 'app' ? 'App Details' : 'Website Details'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Platform/App/Website Name */}
                    {item.location_data.platform_name && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
                          {item.inventory_type.includes('streaming') ? 'Platform' : 'Source'}
                        </span>
                        <p className="text-gray-700 font-medium">{item.location_data.platform_name}</p>
                      </div>
                    )}
                    {item.location_data.app_name && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">App Name</span>
                        <p className="text-gray-700 font-medium">{item.location_data.app_name}</p>
                      </div>
                    )}
                    {item.location_data.website_url && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Website</span>
                        <a href={item.location_data.website_url} target="_blank" rel="noopener noreferrer" 
                           className="text-primary hover:underline font-medium truncate block">
                          {item.location_data.website_url}
                        </a>
                      </div>
                    )}
                    {/* Category */}
                    {item.location_data.app_category && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">App Category</span>
                        <p className="text-gray-700 font-medium">{item.location_data.app_category}</p>
                      </div>
                    )}
                    {item.location_data.website_category && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Website Category</span>
                        <p className="text-gray-700 font-medium">{item.location_data.website_category}</p>
                      </div>
                    )}
                    {/* Audio specific */}
                    {item.location_data.station_format && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Station Format</span>
                        <p className="text-gray-700 font-medium">{item.location_data.station_format}</p>
                      </div>
                    )}
                    {/* Video specific */}
                    {item.location_data.video_quality && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Video Quality</span>
                        <p className="text-gray-700 font-medium">{item.location_data.video_quality}</p>
                      </div>
                    )}
                    {item.location_data.ad_skippable !== undefined && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Skippable</span>
                        <p className={`font-medium ${item.location_data.ad_skippable ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.location_data.ad_skippable ? 'Yes (User can skip)' : 'No (Non-skippable)'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OOH/DOOH Physical Address */}
              {['OOH', 'DOOH'].includes(item.inventory_type) && item.location_data.physical_address && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Physical Location</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Address</span>
                    <p className="text-gray-700 font-medium">{item.location_data.physical_address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Availability & Booking Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-secondary mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                Availability & Booking
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Commitment Level */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm font-medium text-gray-700">Supply Commitment</span>
                  </div>
                  {availabilitySettings?.commitment_level ? (
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${COMMITMENT_LABELS[availabilitySettings.commitment_level]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {COMMITMENT_LABELS[availabilitySettings.commitment_level]?.label || availabilitySettings.commitment_level}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                      Guaranteed Supply
                    </span>
                  )}
                </div>

                {/* Minimum Lead Time */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Min. Booking Lead Time</span>
                  </div>
                  <span className="text-lg font-bold text-secondary">
                    {availabilitySettings?.min_booking_lead_time 
                      ? LEAD_TIME_LABELS[availabilitySettings.min_booking_lead_time] || availabilitySettings.min_booking_lead_time
                      : '24 hours'}
                  </span>
                </div>

                {/* Approval SLA */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Campaign Approval</span>
                  </div>
                  <span className="text-lg font-bold text-secondary">
                    {availabilitySettings?.campaign_approval_sla 
                      ? SLA_LABELS[availabilitySettings.campaign_approval_sla] || availabilitySettings.campaign_approval_sla
                      : '4 business hours'}
                  </span>
                </div>
              </div>

              {/* Block Out Dates */}
              {availabilitySettings?.block_out_periods && availabilitySettings.block_out_periods.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Blocked Dates (Unavailable)</h3>
                  <div className="space-y-2">
                    {availabilitySettings.block_out_periods.map((period) => (
                      <div 
                        key={period.id}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                      >
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-red-800">
                            {new Date(period.fromDate).toLocaleDateString()} - {new Date(period.toDate).toLocaleDateString()}
                          </span>
                          {period.reason && (
                            <span className="text-xs text-red-600 ml-3">({period.reason})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Explanation Section */}
            <AIExplanationCard inventoryId={item.id} />

            {/* Content Guidelines & Restrictions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-secondary mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-gray-400" />
                Content Guidelines & Restrictions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Prohibited Content Categories</h3>
                  <div className="space-y-2">
                    {rules?.prohibited_categories && rules.prohibited_categories.length > 0 ? (
                      rules.prohibited_categories.map((categoryId) => (
                        <div key={categoryId} className="flex items-center text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {CATEGORY_LABELS[categoryId] || categoryId}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No specific content restrictions</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Brand Safety</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Safety Level</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        rules?.brand_safety_level === 'strict' ? 'bg-red-100 text-red-800' :
                        rules?.brand_safety_level === 'relaxed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rules?.brand_safety_level ? 
                          rules.brand_safety_level.charAt(0).toUpperCase() + rules.brand_safety_level.slice(1) : 
                          'Standard'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Content Review</span>
                      <span className="text-sm text-gray-700 font-medium">
                        {rules?.deal_approval?.manualReviewFor?.firstTimeBuyers ? 
                          'Required for first-time buyers' : 
                          'Standard review'}
                      </span>
                    </div>
                    {rules?.access_mode && rules.access_mode !== 'open' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Access</span>
                        <span className="text-sm text-gray-700 font-medium">
                          {rules.access_mode === 'whitelist_only' ? 'Whitelist Only' : 'Invite Only'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {rules?.additional_restrictions && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Restrictions</h3>
                  <p className="text-sm text-gray-600">{rules.additional_restrictions}</p>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> All creatives must comply with UAE advertising regulations and this inventory's content guidelines. Submissions may require publisher approval.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column - Pricing */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-primary/20 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-secondary flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-primary" />
                  {isDigitalType(item.inventory_type) ? 'Per Impression Pricing' : 'Dynamic Pricing'}
                </h2>
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  LIVE
                </span>
              </div>
              
              {/* Different pricing display for digital vs OOH */}
              {isDigitalType(item.inventory_type) && item.cost_per_impression_aed ? (
                // Digital Inventory: CPM Pricing
                <>
                  <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Cost Per Impression</p>
                    <div className={`text-4xl font-heading font-bold flex items-baseline transition-all duration-500 ${
                      priceUpdating ? 'text-emerald-500 scale-105' : 'text-green-600'
                    }`}>
                      {priceUpdating && <RefreshCw className="w-6 h-6 mr-2 animate-spin text-green-500" />}
                      AED {item.cost_per_impression_aed.toFixed(4)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      = AED {(item.cost_per_impression_aed * 1000).toFixed(2)} per 1,000 impressions (CPM)
                    </p>
                    {priceUpdating && (
                      <p className="text-xs text-green-600 mt-1 animate-pulse">Price just updated!</p>
                    )}
                  </div>

                  {/* CPM Pricing Details */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Minimum Spend</span>
                      <span className="font-medium">AED {(item.min_spend_aed || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Daily Impressions Available</span>
                      <span className="font-medium">{item.audience_metrics.daily_impressions.toLocaleString()}</span>
                    </div>
                    {pricing && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-primary" /> Demand Multiplier
                          </span>
                          <span className="font-medium text-orange-600">x{pricing.demand_multiplier}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-blue-500" /> Time Multiplier
                          </span>
                          <span className="font-medium text-blue-600">x{pricing.time_multiplier}</span>
                        </div>
                      </>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Effective CPM after multipliers</p>
                      <p className="font-bold text-secondary text-lg">
                        AED {((item.cost_per_impression_aed * 1000) * (pricing?.demand_multiplier || 1) * (pricing?.time_multiplier || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // OOH/DOOH: Flat Rate Pricing
                <>
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">Total Price (Estimate)</p>
                    <div className={`text-4xl font-heading font-bold flex items-baseline transition-all duration-500 ${
                      priceUpdating ? 'text-green-600 scale-105' : 'text-secondary'
                    }`}>
                      {priceUpdating && <RefreshCw className="w-6 h-6 mr-2 animate-spin text-green-500" />}
                      {pricing?.final_price_aed.toLocaleString()}
                      <span className="text-lg text-gray-400 font-normal ml-2">AED</span>
                    </div>
                    {priceUpdating && (
                      <p className="text-xs text-green-600 mt-1 animate-pulse">Price just updated!</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Prices are updated in real-time based on demand.</p>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Price</span>
                      <span className="font-medium">{item.base_price_aed.toLocaleString()} AED</span>
                    </div>
                    
                    {pricing && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-primary" /> Demand Multiplier
                          </span>
                          <span className="font-medium text-orange-600">x{pricing.demand_multiplier}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-blue-500" /> Time Multiplier
                          </span>
                          <span className="font-medium text-blue-600">x{pricing.time_multiplier}</span>
                        </div>
                      </>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-secondary">
                      <span>Final Rate</span>
                      <span>{pricing?.final_price_aed.toLocaleString()} AED</span>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <button 
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Request to Book
                </button>
                <button  
                  onClick={() => setIsNegotiationOpen(true)}
                  className="w-full bg-white border border-secondary text-secondary py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Negotiate Deal (PMP)
                </button>
              </div>

              <div className="mt-6 flex items-start p-3 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>AI Pricing Transparency:</strong> This price is 10% higher than average due to high seasonal demand in {item.location_emirate}.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
