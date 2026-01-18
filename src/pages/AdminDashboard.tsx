import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LogOut, LayoutDashboard, Users, ShieldCheck, Activity, Search, MoreHorizontal, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, compliance
  
  // Mock Data for Admin
  const stats = {
    totalRevenue: 458900,
    activeCampaigns: 142,
    pendingApprovals: 8,
    systemHealth: '99.9% Uptime'
  };

  const pendingUsers = [
    { id: 1, name: 'Media Giant UAE', type: 'Publisher', email: 'contact@mediagiant.ae', date: '2025-01-18', status: 'Pending License Review' },
    { id: 2, name: 'Dubai Outdoor Ltd', type: 'Publisher', email: 'admin@dubaioutdoor.com', date: '2025-01-17', status: 'Pending Payment Setup' },
    { id: 3, name: 'Global Brands Agency', type: 'Media Agency', email: 'info@gba.com', date: '2025-01-16', status: 'Pending Verification' },
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // In a real app, strict role check here: if (user.role !== 'admin') ...
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

  const handleApprove = (id: number) => {
    toast.success(`User #${id} approved successfully`);
    // Logic to update DB would go here
  };

  const handleReject = (id: number) => {
    toast.error(`User #${id} rejected`);
    // Logic to update DB would go here
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Logo className="h-8" />
            <span className="text-xl font-heading font-bold text-white">Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Platform Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            <span>User Management</span>
          </button>
          <button 
            onClick={() => setActiveTab('compliance')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'compliance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Compliance</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <Activity className="w-5 h-5" />
            <span>System Health</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-4 py-3 bg-slate-800 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">System Admin</p>
              <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white flex items-center mt-0.5">
                <LogOut className="w-3 h-3 mr-1" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-secondary mb-2">
              {activeTab === 'overview' ? 'Platform Overview' : activeTab === 'users' ? 'User Management' : 'Compliance Monitoring'}
            </h1>
            <p className="text-gray-500">
              {activeTab === 'overview' ? 'Real-time platform insights and operational metrics.' : 'Manage user accounts, approvals, and permissions.'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-sm font-medium text-green-600 flex items-center">
               <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
               System Operational
             </div>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL PLATFORM REVENUE</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">AED {stats.totalRevenue.toLocaleString()}</h3>
                <p className="text-xs font-medium text-green-600">↑ 8.4% this month</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ACTIVE CAMPAIGNS</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.activeCampaigns}</h3>
                <p className="text-xs text-gray-500">Across 34 advertisers</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PENDING APPROVALS</p>
                <h3 className="text-2xl font-bold text-orange-600 mb-1">{stats.pendingApprovals}</h3>
                <p className="text-xs text-gray-500">Requires attention</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">SYSTEM UPTIME</p>
                <h3 className="text-2xl font-bold text-blue-600 mb-1">{stats.systemHealth}</h3>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>

            {/* Recent Activity / Pending Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="font-bold text-gray-900">Pending User Approvals</h3>
                   <button onClick={() => setActiveTab('users')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                 </div>
                 <div className="divide-y divide-gray-100">
                   {pendingUsers.map(u => (
                     <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                           {u.name[0]}
                         </div>
                         <div>
                           <p className="text-sm font-medium text-gray-900">{u.name}</p>
                           <p className="text-xs text-gray-500">{u.type} • {u.date}</p>
                         </div>
                       </div>
                       <div className="flex space-x-2">
                         <button onClick={() => handleApprove(u.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-5 h-5" /></button>
                         <button onClick={() => handleReject(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><XCircle className="w-5 h-5" /></button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-gray-100">
                   <h3 className="font-bold text-gray-900">System Alerts</h3>
                 </div>
                 <div className="p-4 space-y-3">
                   <div className="flex items-start p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                     <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                     <div>
                      <span className="font-bold block">High Latency Detected</span>
                      <span className="opacity-80">API response time &gt; 500ms in MENA region.</span>
                    </div>
                   </div>
                   <div className="flex items-start p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                     <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                     <div>
                       <span className="font-bold block">Compliance Flag</span>
                       <span className="opacity-80">Campaign #8821 contains sensitive keywords.</span>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search users by name, email, or ID..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="flex space-x-3">
                 <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                   <option>All Roles</option>
                   <option>Publisher</option>
                   <option>Advertiser</option>
                   <option>Agency</option>
                 </select>
                 <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                   <option>All Status</option>
                   <option>Active</option>
                   <option>Pending</option>
                   <option>Suspended</option>
                 </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User / Entity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Mock Pending Users */}
                  {pendingUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs mr-3">{u.name[0]}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleApprove(u.id)} className="text-green-600 hover:text-green-900 mr-3">Approve</button>
                        <button onClick={() => handleReject(u.id)} className="text-red-600 hover:text-red-900">Reject</button>
                      </td>
                    </tr>
                  ))}
                  {/* Mock Active Users */}
                  {[1, 2, 3, 4].map(i => (
                    <tr key={`active-${i}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">A</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Active Corp {i}</div>
                            <div className="text-xs text-gray-500">corp{i}@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Advertiser</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-12-01</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
