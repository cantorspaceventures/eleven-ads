import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: any;
  currentPrice: number;
}

export default function NegotiationModal({ isOpen, onClose, inventory, currentPrice }: NegotiationModalProps) {
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to negotiate.');
      }

      const response = await fetch('/api/deals/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_id: inventory.id,
          buyer_id: user.id,
          seller_id: inventory.owner_id,
          buyer_offer_aed: parseFloat(offerPrice),
          notes: notes
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Negotiation failed');
      }

      toast.success('Offer Sent! The publisher has been notified.');
      onClose();
      setOfferPrice('');
      setNotes('');

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
          <h2 className="text-xl font-bold text-secondary">Start Negotiation</h2>
          <p className="text-sm text-gray-500">Make an offer for {inventory.location_data.address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Current Ask Price</span>
              <span className="font-bold text-secondary">{currentPrice.toLocaleString()} AED</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Publisher Floor</span>
              <span className="font-medium text-gray-400">Hidden</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Offer (AED)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Enter amount..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Publisher</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              placeholder="E.g. We are looking for a 3-month commitment..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white py-3 rounded-lg font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending Offer...' : 'Submit Offer'}
          </button>
        </form>
      </div>
    </div>
  );
}
