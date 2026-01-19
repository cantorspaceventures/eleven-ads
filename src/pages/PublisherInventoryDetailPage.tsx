import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, MapPin, Eye, DollarSign, Edit, Trash2, ToggleLeft, ToggleRight,
  LogOut, BarChart2, List, Settings, Clock, TrendingUp, Calendar, Save
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import InventoryAvailabilityCalendar from '@/components/InventoryAvailabilityCalendar';

interface InventoryDetail {
  id: string;
  inventory_type: string;
  location_emirate: string;
  location_data: {
    address: string;
    format: string;
    dimensions?: string;
    coordinates?: { lat: number; lng: number };
    station_format?: string;
    video_quality?: string;
    ad_skippable?: boolean;
    website_category?: string;
    app_category?: string;
  };
  audience_metrics: {
    daily_impressions: number;
    demographics?: any;
    mau?: number;
    bounce_rate?: number;
  };
  base_price_aed: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  dynamic_pricing?: {
    final_price_aed: number;
    demand_multiplier: number;
    time_multiplier: number;
    availability_multiplier: number;
  }[];
}

export default function PublisherInventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [item, setItem] = useState<InventoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(id || '');
  const [allInventory, setAllInventory] = useState<InventoryDetail[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        if (user.user_metadata?.role !== 'premium_publisher') {
          navigate('/dashboard');
        }
        setUser(user);
        fetchAllInventory(user.id);
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (selectedInventoryId) {
      fetchInventoryDetail();
    }
  }, [selectedInventoryId]);

  const fetchAllInventory = async (userId: string) => {
    try {
      const res = await fetch(`/api/inventory/publisher/${userId}`);
      const data = await res.json();
      if (data.success) {
        setAllInventory(data.data);
      }
    } catch (err) {
      console.error('Error fetching inventory list:', err);
    }
  };

  const fetchInventoryDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${selectedInventoryId}`);
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

  const handleToggleAvailability = async () => {
    if (!item || !user) return;
    
    try {
      // In a real app, you'd have an API endpoint for this
      toast.success(`Inventory ${item.is_available ? 'deactivated' : 'activated'} successfully`);
      setItem({ ...item, is_available: !item.is_available });
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  const handleDelete = async () => {
    if (!item || !user) return;
    
    if (!confirm('Are you sure you want to delete this inventory? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: user.id })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Inventory deleted successfully');
        navigate('/publisher/my-inventory');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete inventory');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'DOOH': return 'bg-blue-100 text-blue-800';
      case 'OOH': return 'bg-green-100 text-green-800';
      case 'streaming_audio': return 'bg-yellow-100 text-yellow-800';
      case 'streaming_video': return 'bg-pink-100 text-pink-800';
      case 'app': return 'bg-purple-100 text-purple-800';
      case 'web': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <Link to="/publisher-dashboard" className="flex items-center space-x-2">
            <Logo className="h-8" />
            <span className="text-xl font-heading font-bold text-secondary">Publisher</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/publisher-dashboard" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">
            <BarChart2 className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/publisher/my-inventory" className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
            <List className="w-5 h-5" />
            <span>My Inventory</span>
          </Link>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-gray-900">{user.user_metadata?.business_name || 'Publisher'}</p>
              <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-600 flex items-center mt-0.5">
                <LogOut className="w-3 h-3 mr-1" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Back Button */}
        <Link 
          to="/publisher/my-inventory" 
          className="inline-flex items-center text-gray-500 hover:text-secondary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Inventory
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error || !item ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-red-600 mb-4">{error || 'Inventory not found'}</p>
            <Link to="/publisher/my-inventory" className="text-primary hover:underline">
              Return to My Inventory
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getTypeColor(item.inventory_type)}`}>
                      {item.inventory_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.is_available ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-heading font-bold text-secondary mb-2">
                    {item.location_data.address}
                  </h1>
                  <p className="text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {item.location_emirate}, United Arab Emirates
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    ID: {item.id}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleToggleAvailability}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      item.is_available 
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {item.is_available ? (
                      <><ToggleRight className="w-5 h-5 mr-2" /> Deactivate</>
                    ) : (
                      <><ToggleLeft className="w-5 h-5 mr-2" /> Activate</>
                    )}
                  </button>
                  <button className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Specifications */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-4">Specifications</h2>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Format</span>
                    <p className="text-gray-700 font-medium">{item.location_data.format}</p>
                  </div>
                  {item.location_data.dimensions && (
                    <div>
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Dimensions</span>
                      <p className="text-gray-700 font-medium">{item.location_data.dimensions}</p>
                    </div>
                  )}
                  {item.location_data.video_quality && (
                    <div>
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Video Quality</span>
                      <p className="text-gray-700 font-medium">{item.location_data.video_quality}</p>
                    </div>
                  )}
                  {item.location_data.station_format && (
                    <div>
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Station Format</span>
                      <p className="text-gray-700 font-medium">{item.location_data.station_format}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Audience Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-4">Audience Metrics</h2>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Daily Impressions</span>
                    <p className="text-gray-700 font-medium flex items-center">
                      <Eye className="w-4 h-4 mr-2 text-gray-400" />
                      {item.audience_metrics.daily_impressions.toLocaleString()}
                    </p>
                  </div>
                  {item.audience_metrics.mau && (
                    <div>
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Monthly Active Users</span>
                      <p className="text-gray-700 font-medium">{item.audience_metrics.mau.toLocaleString()}</p>
                    </div>
                  )}
                  {item.audience_metrics.bounce_rate && (
                    <div>
                      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Bounce Rate</span>
                      <p className="text-gray-700 font-medium">{item.audience_metrics.bounce_rate}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-4">Pricing</h2>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Base Price</span>
                    <p className="text-2xl font-bold text-secondary flex items-center">
                      <DollarSign className="w-5 h-5" />
                      {item.base_price_aed.toLocaleString()} <span className="text-sm font-normal text-gray-400 ml-2">AED</span>
                    </p>
                  </div>
                  
                  {item.dynamic_pricing && item.dynamic_pricing[0] && (
                    <>
                      <div className="pt-3 border-t border-gray-100">
                        <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Current Dynamic Price</span>
                        <p className="text-2xl font-bold text-primary flex items-center">
                          <DollarSign className="w-5 h-5" />
                          {item.dynamic_pricing[0].final_price_aed.toLocaleString()} <span className="text-sm font-normal text-gray-400 ml-2">AED</span>
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> Demand
                          </span>
                          <span className="font-medium">x{item.dynamic_pricing[0].demand_multiplier}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> Time
                          </span>
                          <span className="font-medium">x{item.dynamic_pricing[0].time_multiplier}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Selector for Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Inventory Unit</label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => {
                    setSelectedInventoryId(e.target.value);
                    navigate(`/publisher/inventory/${e.target.value}`, { replace: true });
                  }}
                  className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {allInventory.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id.substring(0, 8).toUpperCase()} ({inv.location_data.address})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Availability Calendar */}
            <InventoryAvailabilityCalendar
              inventoryId={item.id}
              inventoryName={item.location_data.address}
              bookedDates={[]} // In a real app, fetch from deals/bookings
              onSettingsChange={(settings) => {
                console.log('Settings updated:', settings);
                // In a real app, save to backend
                toast.success('Availability settings updated');
              }}
            />

            {/* Timestamps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-secondary mb-4">Activity</h2>
              <div className="flex flex-wrap gap-8 text-sm text-gray-600">
                <div>
                  <span className="text-gray-400">Created:</span>{' '}
                  {new Date(item.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </div>
                <div>
                  <span className="text-gray-400">Last Updated:</span>{' '}
                  {new Date(item.updated_at).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
