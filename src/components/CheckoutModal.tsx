import { useState } from 'react';
import { X, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: any;
  price: number;
}

export default function CheckoutModal({ isOpen, onClose, inventory, price }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock dates for MVP
  const [startDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login to continue');

      const res = await fetch('/api/checkout/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_id: inventory.id,
          buyer_id: user.id,
          seller_id: inventory.owner_id,
          total_price: price,
          start_date: startDate,
          end_date: endDate
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Booking Confirmed! Your campaign is now scheduled.');
      onClose();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-secondary">Confirm Booking</h2>
          <p className="text-sm text-gray-500">Programmatic Guaranteed Deal</p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Inventory</span>
              <span className="font-medium text-secondary truncate max-w-[200px]">{inventory.location_data.address}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-secondary">30 Days</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="font-bold text-secondary">Total</span>
              <span className="font-bold text-primary">{price.toLocaleString()} AED</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
              <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-secondary">Credit Balance</p>
                <p className="text-xs text-gray-500">Use your prepaid account balance</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-secondary">Invoice (Net 30)</p>
                <p className="text-xs text-gray-500">For verified enterprise accounts</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm & Pay'}
          </button>
        </div>
      </div>
    </div>
  );
}
