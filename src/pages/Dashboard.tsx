import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LogOut, BarChart2, TrendingUp, DollarSign, Activity } from 'lucide-react';
import MyDealsList from '@/components/MyDealsList';
import Logo from '@/components/Logo';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-full bg-secondary text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center">
            <Logo className="h-8" />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-lg text-sm font-medium">
            <BarChart2 className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/campaigns/new" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:text-white">
            <TrendingUp className="w-5 h-5" />
            <span>Campaigns</span>
          </Link>
          <Link to="/deals" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:text-white">
            <DollarSign className="w-5 h-5" />
            <span>Deals</span>
          </Link>
          <Link to="/campaigns/analytics" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:text-white">
            <Activity className="w-5 h-5" />
            <span>Analytics</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.user_metadata?.business_name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-secondary">Dashboard</h1>
            <p className="text-gray-500">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-4">
             {/* Header actions */}
             <button 
                onClick={() => navigate('/campaigns/new')}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
             >
                New Campaign
             </button>
             <button 
                onClick={() => navigate('/inventory')}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
             >
                Browse Marketplace
             </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Spend', value: 'AED 45,230', change: '+12%', icon: DollarSign, color: 'text-primary' },
            { label: 'Active Campaigns', value: '12', change: '+2', icon: TrendingUp, color: 'text-green-500' },
            { label: 'Impressions', value: '2.4M', change: '+8%', icon: Activity, color: 'text-blue-500' },
            { label: 'Avg. CPM', value: 'AED 18.50', change: '-3%', icon: BarChart2, color: 'text-purple-500' },
          ].map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 bg-gray-50 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold text-secondary">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deals Section */}
          <MyDealsList />

          {/* Placeholder for other widgets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary mb-2">Campaign Performance</h3>
            <p className="text-gray-500 mb-6">Detailed analytics will appear here once campaigns are live.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
