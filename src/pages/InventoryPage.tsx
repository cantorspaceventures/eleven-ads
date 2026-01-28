import { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Eye, DollarSign, ArrowRight, Loader, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';

interface Inventory {
  id: string;
  inventory_type: string;
  location_emirate: string;
  location_data: {
    address: string;
    format: string;
    dimensions?: string;
  };
  audience_metrics: {
    daily_impressions: number;
    demographics: any;
  };
  base_price_aed: number;
  premium_users: {
    business_name: string;
  };
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEmirate, setSelectedEmirate] = useState('all');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUser();
    fetchInventory();
  }, [selectedType, selectedEmirate]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = '/api/inventory';
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedEmirate !== 'all') params.append('location', selectedEmirate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const address = item.location_data?.address || '';
    const businessName = item.premium_users?.business_name || '';
    
    return address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      businessName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getInventoryDisplayName = (item: Inventory) => {
    // For digital types, use station_name or app_name or platform if available
    // These might be nested in location_data depending on how the backend stores it
    // Based on seed data, it seems to be in location_data under different keys or we might need to adjust
    // For now, let's assume we store it in a consistent way or check multiple fields
    
    // We will use 'address' as the fallback for OOH/DOOH, but for others check extended props
    // Note: The interface needs to be updated if we want typescript to be happy with extended fields
    // casting to any for flexibility in this demo update
    const data = item.location_data as any;
    
    if (['streaming_radio', 'streaming_video', 'app', 'web'].includes(item.inventory_type)) {
       return data.station_name || data.app_name || data.platform || data.address;
    }
    return data.address;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
             <Logo />
          </Link>
          <div className="flex items-center space-x-4">
             <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
             <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center">
               <span className="text-sm font-bold">U</span>
             </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">Premium Inventory</h1>
          <p className="text-gray-500">Discover exclusive OOH, DOOH, and digital placements across the UAE.</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by location or publisher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[160px]"
              >
                <option value="all">All Types</option>
                <option value="OOH">OOH</option>
                <option value="DOOH">DOOH</option>
                <option value="streaming_video">Streaming Video</option>
                <option value="streaming_radio">Streaming Radio</option>
                <option value="app">App</option>
                <option value="web">Web</option>
              </select>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedEmirate}
                onChange={(e) => setSelectedEmirate(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[160px]"
              >
                <option value="all">All Emirates</option>
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Sharjah">Sharjah</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredInventory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-48 bg-gray-100 relative">
                  {/* Placeholder for Image */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200">
                    <span className="font-medium">{item.inventory_type} Preview</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-secondary shadow-sm">
                    {item.inventory_type.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-secondary line-clamp-1" title={getInventoryDisplayName(item)}>
                      {getInventoryDisplayName(item)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{item.premium_users.business_name}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      {item.location_emirate}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="w-4 h-4 mr-2 text-primary" />
                      {item.audience_metrics.daily_impressions.toLocaleString()} daily impressions
                    </div>
                    {item.location_data.format && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2 flex items-center justify-center font-bold text-primary text-[10px]">F</span>
                        {item.location_data.format}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Base Price</p>
                      {isLoggedIn ? (
                        <p className="text-lg font-bold text-secondary flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {item.base_price_aed.toLocaleString()} <span className="text-xs font-normal text-gray-400 ml-1">AED</span>
                        </p>
                      ) : (
                        <Link to="/login" className="text-sm font-medium text-primary flex items-center hover:underline mt-1">
                          <Lock className="w-3 h-3 mr-1" /> Login to view
                        </Link>
                      )}
                    </div>
                    {isLoggedIn ? (
                      <Link to={`/inventory/${item.id}`} className="bg-secondary text-white p-2 rounded-lg hover:bg-secondary/90 transition-colors group-hover:scale-105 transform duration-200">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    ) : (
                      <Link to="/login" className="bg-gray-100 text-gray-400 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 text-lg">No inventory found matching your criteria.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedType('all'); setSelectedEmirate('all');}}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
