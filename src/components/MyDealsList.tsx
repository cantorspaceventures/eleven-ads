import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface Deal {
  id: string;
  buyer_offer_aed: number;
  status: string;
  updated_at: string;
  premium_inventory: {
    inventory_type: string;
    location_data: {
      address: string;
    };
  };
  premium_users: {
    business_name: string;
  };
}

export default function MyDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/deals/my-deals/${user.id}`);
      const data = await res.json();

      if (data.success) {
        setDeals(data.data);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'accepted': return 'bg-green-50 text-green-700 border-green-100';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading deals...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-secondary">Recent Negotiations</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
          {deals.length} Active
        </span>
      </div>

      {deals.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No active negotiations found. Start browsing the marketplace!
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {deals.map((deal) => (
            <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-secondary text-sm mb-1">
                    {deal.premium_inventory.location_data.address}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Publisher: {deal.premium_users?.business_name || 'Unknown'}
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(deal.status)} capitalize flex items-center`}>
                  {deal.status === 'active' && <Clock className="w-3 h-3 mr-1" />}
                  {deal.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {deal.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                  {deal.status}
                </div>
              </div>

              <div className="flex justify-between items-end mt-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Your Offer</p>
                  <p className="text-lg font-bold text-secondary">
                    {deal.buyer_offer_aed.toLocaleString()} <span className="text-xs font-normal text-gray-400">AED</span>
                  </p>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Last updated {new Date(deal.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
