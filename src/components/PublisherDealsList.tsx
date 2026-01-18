import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle, XCircle, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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

export default function PublisherDealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleDealAction = async (dealId: string, status: 'accepted' | 'rejected') => {
    setActionLoading(dealId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/deals/${dealId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, seller_id: user.id })
      });

      const data = await res.json();

      if (data.success) {
        // Optimistic update
        setDeals(deals.map(d => d.id === dealId ? { ...d, status } : d));
        toast.success(`Deal ${status} successfully`);
      } else {
        toast.error('Failed to update deal: ' + data.error);
      }
    } catch (error: any) {
      console.error('Action error:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading incoming offers...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-secondary">Incoming Deal Requests</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
          {deals.filter(d => d.status === 'active').length} Pending
        </span>
      </div>

      {deals.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No incoming deals yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {deals.map((deal) => (
            <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">
                      PMP Offer
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(deal.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-secondary text-sm">
                    {deal.premium_inventory.location_data.address}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Offer Amount</p>
                  <p className="text-lg font-bold text-secondary">
                    {deal.buyer_offer_aed.toLocaleString()} <span className="text-xs font-normal text-gray-400">AED</span>
                  </p>
                </div>
              </div>

              {/* Actions Area */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                <div className="text-xs text-gray-500 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 text-gray-400" />
                  Status: <span className={`ml-1 font-medium capitalize ${
                    deal.status === 'active' ? 'text-blue-600' : 
                    deal.status === 'accepted' ? 'text-green-600' : 'text-red-600'
                  }`}>{deal.status}</span>
                </div>

                {deal.status === 'active' && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDealAction(deal.id, 'rejected')}
                      disabled={!!actionLoading}
                      className="flex items-center px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3 mr-1" /> Reject
                    </button>
                    <button 
                      onClick={() => handleDealAction(deal.id, 'accepted')}
                      disabled={!!actionLoading}
                      className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === deal.id ? 'Processing...' : (
                        <><Check className="w-3 h-3 mr-1" /> Accept Offer</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
