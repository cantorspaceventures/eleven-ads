import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LogOut, BarChart2, List, Settings, Plus, Download, Eye, DollarSign, Upload, HelpCircle } from 'lucide-react';
import PublisherDealsList from '@/components/PublisherDealsList';
import PublisherInventoryList from '@/components/PublisherInventoryList';
import AddInventoryModal from '@/components/AddInventoryModal';
import Logo from '@/components/Logo';

export default function PublisherDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Stats state (mocked initial values to match design, will be overwritten by fetch)
  const [stats, setStats] = useState({ 
    inventoryCount: 247, 
    activeDeals: 12,
    revenue: 12450,
    fillRate: 87.3,
    avgCpm: 42
  });

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
        fetchStats(user.id);
      }
    };
    checkUser();
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    try {
      const [invRes, dealsRes] = await Promise.all([
        fetch(`/api/inventory/publisher/${userId}`),
        fetch(`/api/deals/my-deals/${userId}`)
      ]);

      const invData = await invRes.json();
      const dealsData = await dealsRes.json();

      // In a real app, we would calculate revenue/fill rate from DB
      // Here we preserve the design's mock values for visual fidelity while updating counts
      if (invData.success) {
        setStats(prev => ({ ...prev, inventoryCount: invData.data.length }));
      }
      if (dealsData.success) {
        setStats(prev => ({ ...prev, activeDeals: dealsData.data.filter((d: any) => d.status === 'active').length }));
      }

    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <AddInventoryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Logo className="h-8" />
            <span className="text-xl font-heading font-bold text-secondary">Publisher</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/publisher-dashboard" className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
            <BarChart2 className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/publisher/my-inventory" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">
            <List className="w-5 h-5" />
            <span>My Inventory</span>
          </Link>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </a>
          <Link to="/help" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </Link>
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
        <header className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">Publisher Dashboard</h1>
          <p className="text-gray-500">Welcome back, here's your performance overview.</p>
        </header>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">TODAY'S REVENUE</p>
            <h3 className="text-2xl font-bold text-blue-700 mb-1">AED {stats.revenue.toLocaleString()}</h3>
            <p className="text-xs font-medium text-green-600 flex items-center">
              ↑ 12.5% vs yesterday
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ACTIVE INVENTORY</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.inventoryCount} Units</h3>
            <p className="text-xs text-gray-500">Across 12 locations</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">FILL RATE</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.fillRate}%</h3>
            <p className="text-xs font-medium text-green-600">↑ 3.2% this week</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">AVG. CPM</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">AED {stats.avgCpm}</h3>
            <p className="text-xs font-medium text-red-500">↓ 1.8% this week</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Revenue Trend (30 Days)</h3>
            <div className="flex space-x-2">
              {['7D', '30D', '90D'].map((range) => (
                <button 
                  key={range}
                  className={`px-3 py-1 text-xs font-medium rounded border ${range === '30D' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          {/* Mock Line Chart */}
          <div className="h-64 w-full bg-gray-50 rounded-lg flex items-end justify-between px-4 pb-4 gap-2 relative">
             <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
               [Line Chart: Revenue over time]
             </div>
             {/* Simple visual bars as placeholder for line chart */}
             {[35, 42, 38, 55, 62, 58, 70, 75, 68, 82, 90, 85, 95, 100, 92].map((h, i) => (
               <div key={i} className="w-full bg-blue-100 rounded-t-sm" style={{ height: `${h}%` }}></div>
             ))}
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" /> Add New Inventory
              </button>
              <button 
                onClick={() => navigate('/publisher/bulk-upload')}
                className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" /> Bulk Upload Inventory
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                <Eye className="w-5 h-5 mr-2" /> View All Campaigns
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5 mr-2" /> Download Reports
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-bold text-yellow-800 mb-2 flex items-center">
              Alerts (2)
            </h3>
            <div className="space-y-2">
              <div className="text-xs text-yellow-800 bg-yellow-100/50 p-2 rounded">
                <span className="font-bold">Low Fill Rate:</span> Marina Mall OOH inventory at 42% today
              </div>
              <div className="text-xs text-yellow-800 bg-yellow-100/50 p-2 rounded">
                <span className="font-bold">Payment Due:</span> Invoice #1247 due in 3 days
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Lists */}
        <div className="space-y-8">
          <PublisherInventoryList onAddInventory={() => setIsAddModalOpen(true)} />
          <PublisherDealsList />
        </div>

      </main>
    </div>
  );
}
