import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, MapPin, Eye, DollarSign, LogOut, BarChart2, List, Settings,
  Plus, ChevronLeft, ChevronRight, Loader, ArrowRight, Calendar, MoreHorizontal
} from 'lucide-react';
import Logo from '@/components/Logo';
import AddInventoryModal from '@/components/AddInventoryModal';

interface InventoryItem {
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
  };
  base_price_aed: number;
  is_available: boolean;
  created_at: string;
  image_url?: string;
  dynamic_pricing?: {
    final_price_aed: number;
  }[];
}

export default function MyInventoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEmirate, setSelectedEmirate] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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
        fetchInventory(user.id);
      }
    };
    checkUser();
  }, [navigate]);

  const fetchInventory = async (userId: string) => {
    try {
      const res = await fetch(`/api/inventory/publisher/${userId}`);
      const data = await res.json();

      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.location_data.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.inventory_type === selectedType;
    const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'active' && item.is_available) || 
                          (selectedStatus === 'inactive' && !item.is_available);
    const matchesEmirate = selectedEmirate === 'all' || item.location_emirate === selectedEmirate;
    
    return matchesSearch && matchesType && matchesStatus && matchesEmirate;
  });

  // Paginate
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique emirates from inventory
  const uniqueEmirates = [...new Set(inventory.map(i => i.location_emirate))];

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
      <AddInventoryModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          if (user) fetchInventory(user.id);
        }} 
      />
      
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
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-heading font-bold text-secondary mb-2">My Inventory</h1>
            <p className="text-gray-500">Manage all your ad inventory units in one place.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Inventory
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Units</p>
            <h3 className="text-2xl font-bold text-secondary">{inventory.length}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active</p>
            <h3 className="text-2xl font-bold text-green-600">{inventory.filter(i => i.is_available).length}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Inactive</p>
            <h3 className="text-2xl font-bold text-gray-400">{inventory.filter(i => !i.is_available).length}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Locations</p>
            <h3 className="text-2xl font-bold text-secondary">{uniqueEmirates.length}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by location or ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[140px]"
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

            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedEmirate}
                onChange={(e) => { setSelectedEmirate(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[140px]"
              >
                <option value="all">All Emirates</option>
                {uniqueEmirates.map(emirate => (
                  <option key={emirate} value={emirate}>{emirate}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : paginatedInventory.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedInventory.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                  onClick={() => navigate(`/publisher/inventory/${item.id}`)}
                >
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.location_data.address}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-gray-300">
                        {item.inventory_type.charAt(0)}
                      </span>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getTypeColor(item.inventory_type)}`}>
                        {item.inventory_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {item.is_available ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-secondary mb-1 line-clamp-1" title={item.location_data.address}>
                      {item.location_data.address}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center mb-4">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {item.location_emirate}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <Eye className="w-4 h-4 mr-1.5 text-gray-400" />
                        {item.audience_metrics.daily_impressions.toLocaleString()} / day
                      </div>
                      <div className="font-bold text-secondary flex items-center">
                        <DollarSign className="w-4 h-4" />
                        {item.base_price_aed.toLocaleString()} AED
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        ID: {item.id.substring(0, 8).toUpperCase()}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/publisher/inventory/${item.id}`);
                        }}
                        className="flex items-center text-primary font-medium text-sm hover:underline"
                      >
                        View Details <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of{' '}
                  <span className="font-medium">{filteredInventory.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  ).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                        page === currentPage 
                          ? 'bg-primary text-white border-primary' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <List className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">No inventory found</p>
            <p className="text-gray-400 text-sm mb-6">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedEmirate !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first inventory unit'}
            </p>
            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedEmirate !== 'all' ? (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                  setSelectedEmirate('all');
                }}
                className="text-primary font-medium hover:underline"
              >
                Clear all filters
              </button>
            ) : (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Add Your First Inventory
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
