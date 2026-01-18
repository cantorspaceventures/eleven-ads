import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Eye, DollarSign, ArrowLeft, Info, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import NegotiationModal from '@/components/NegotiationModal';
import CheckoutModal from '@/components/CheckoutModal';
import AIExplanationCard from '@/components/AIExplanationCard';

interface InventoryDetail {
  id: string;
  inventory_type: string;
  owner_id: string;
  location_emirate: string;
  location_data: {
    address: string;
    format: string;
    dimensions?: string;
    coordinates?: { lat: number; lng: number };
  };
  audience_metrics: {
    daily_impressions: number;
    demographics: any;
  };
  base_price_aed: number;
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

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<InventoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    fetchInventoryDetail();
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
                    {item.location_data.address}
                  </h1>
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
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Format</span>
                    <p className="text-gray-700 font-medium">{item.location_data.format}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Dimensions</span>
                    <p className="text-gray-700 font-medium">{item.location_data.dimensions || 'N/A'}</p>
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
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Publisher</span>
                    <p className="text-gray-700 font-medium">{item.premium_users.business_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation Section */}
            <AIExplanationCard inventoryId={item.id} />

            {/* Map Placeholder */}
            <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center text-gray-400 border border-gray-300">
              <div className="text-center">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Interactive Map View Coming Soon</p>
                {item.location_data.coordinates && (
                  <p className="text-xs mt-2 font-mono">
                    {item.location_data.coordinates.lat}, {item.location_data.coordinates.lng}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column - Pricing */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-primary/20 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-secondary mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                Dynamic Pricing
              </h2>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Total Price (Estimate)</p>
                <div className="text-4xl font-heading font-bold text-secondary flex items-baseline">
                  {pricing?.final_price_aed.toLocaleString()}
                  <span className="text-lg text-gray-400 font-normal ml-2">AED</span>
                </div>
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
