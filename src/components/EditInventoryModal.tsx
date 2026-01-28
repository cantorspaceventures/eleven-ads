import { useState, useEffect } from 'react';
import { X, Save, DollarSign, TrendingUp, Clock, Calculator, ImagePlus, Type } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryData {
  id: string;
  inventory_type: string;
  location_emirate: string;
  location_data: {
    placement_name?: string; // Custom listing name
    address: string; // Placement type
    format: string;
    dimensions?: string;
    physical_address?: string;
    app_name?: string;
    website_url?: string;
    platform_name?: string;
    station_format?: string;
    video_quality?: string;
    ad_skippable?: boolean;
    website_category?: string;
    app_category?: string;
  };
  audience_metrics: {
    daily_impressions: number;
    mau?: number;
    bounce_rate?: number;
    demographics?: any;
  };
  base_price_aed: number;
  // CPM pricing for digital inventory
  min_spend_aed?: number;
  cost_per_impression_aed?: number;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  dynamic_pricing?: {
    demand_multiplier: number;
    time_multiplier: number;
    availability_multiplier: number;
    final_price_aed: number;
  }[];
}

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryData;
  onSave: (updatedInventory: InventoryData) => void;
  userId: string;
}

export default function EditInventoryModal({ isOpen, onClose, inventory, onSave, userId }: EditInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Check if this is digital inventory (uses CPM pricing)
  const isDigitalInventory = ['streaming_radio', 'streaming_video', 'app', 'web'].includes(inventory.inventory_type);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    placement_name: inventory.location_data.placement_name || '',
    image_url: inventory.image_url || '',
    // Metrics
    base_price_aed: inventory.base_price_aed,
    daily_impressions: inventory.audience_metrics.daily_impressions,
    dimensions: inventory.location_data.dimensions || '',
    mau: inventory.audience_metrics.mau || '',
    bounce_rate: inventory.audience_metrics.bounce_rate || '',
    // CPM pricing fields
    min_spend_aed: inventory.min_spend_aed || '',
    cost_per_impression_aed: inventory.cost_per_impression_aed || '',
  });
  
  // Pricing multipliers
  const [demandMultiplier, setDemandMultiplier] = useState(
    inventory.dynamic_pricing?.[0]?.demand_multiplier || 1
  );
  const [timeMultiplier, setTimeMultiplier] = useState(
    inventory.dynamic_pricing?.[0]?.time_multiplier || 1
  );
  
  // Calculate dynamic price in real-time
  const dynamicPrice = formData.base_price_aed * demandMultiplier * timeMultiplier;

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        placement_name: inventory.location_data.placement_name || '',
        image_url: inventory.image_url || '',
        base_price_aed: inventory.base_price_aed,
        daily_impressions: inventory.audience_metrics.daily_impressions,
        dimensions: inventory.location_data.dimensions || '',
        mau: inventory.audience_metrics.mau || '',
        bounce_rate: inventory.audience_metrics.bounce_rate || '',
        min_spend_aed: inventory.min_spend_aed || '',
        cost_per_impression_aed: inventory.cost_per_impression_aed || '',
      });
      setDemandMultiplier(inventory.dynamic_pricing?.[0]?.demand_multiplier || 1);
      setTimeMultiplier(inventory.dynamic_pricing?.[0]?.time_multiplier || 1);
    }
  }, [isOpen, inventory]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        owner_id: userId,
        placement_name: formData.placement_name,
        image_url: formData.image_url || null,
        base_price_aed: Number(formData.base_price_aed),
        daily_impressions: Number(formData.daily_impressions),
        dimensions: formData.dimensions,
        mau: formData.mau ? Number(formData.mau) : null,
        bounce_rate: formData.bounce_rate ? Number(formData.bounce_rate) : null,
        demand_multiplier: demandMultiplier,
        time_multiplier: timeMultiplier,
        final_price_aed: dynamicPrice,
      };

      // Add CPM fields for digital inventory
      if (isDigitalInventory) {
        if (formData.min_spend_aed) payload.min_spend_aed = Number(formData.min_spend_aed);
        if (formData.cost_per_impression_aed) payload.cost_per_impression_aed = Number(formData.cost_per_impression_aed);
      }

      const res = await fetch(`/api/inventory/${inventory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Inventory updated successfully!');
      
      // Update parent with new data
      const updatedInventory: InventoryData = {
        ...inventory,
        base_price_aed: Number(formData.base_price_aed),
        min_spend_aed: formData.min_spend_aed ? Number(formData.min_spend_aed) : undefined,
        cost_per_impression_aed: formData.cost_per_impression_aed ? Number(formData.cost_per_impression_aed) : undefined,
        image_url: formData.image_url || undefined,
        audience_metrics: {
          ...inventory.audience_metrics,
          daily_impressions: Number(formData.daily_impressions),
          mau: formData.mau ? Number(formData.mau) : undefined,
          bounce_rate: formData.bounce_rate ? Number(formData.bounce_rate) : undefined,
        },
        location_data: {
          ...inventory.location_data,
          placement_name: formData.placement_name,
          dimensions: formData.dimensions,
        },
        dynamic_pricing: [{
          demand_multiplier: demandMultiplier,
          time_multiplier: timeMultiplier,
          availability_multiplier: inventory.dynamic_pricing?.[0]?.availability_multiplier || 1,
          final_price_aed: dynamicPrice,
        }],
        updated_at: new Date().toISOString(),
      };
      
      onSave(updatedInventory);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-secondary mb-6 flex items-center">
          Edit Inventory: {inventory.location_data.placement_name || inventory.location_data.address}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-secondary mb-4 flex items-center">
              <Type className="w-4 h-4 mr-2" /> Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placement Name</label>
                <input
                  type="text"
                  name="placement_name"
                  value={formData.placement_name}
                  onChange={handleChange}
                  placeholder="e.g. Homepage Banner, Pre-roll 30s"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <ImagePlus className="w-4 h-4 mr-1" /> Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="h-20 w-auto rounded-lg object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Price Preview */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-50 p-6 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-secondary flex items-center">
                <Calculator className="w-5 h-5 mr-2" /> Live Dynamic Price
              </h3>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  AED {dynamicPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  Base × Demand × Time = Final
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-500 mb-1">Base Price</p>
                <p className="font-bold text-secondary">AED {Number(formData.base_price_aed).toLocaleString()}</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-500 mb-1">Demand</p>
                <p className="font-bold text-green-600">×{demandMultiplier.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-500 mb-1">Time</p>
                <p className="font-bold text-blue-600">×{timeMultiplier.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-secondary mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" /> Pricing Configuration
            </h3>
            
            {isDigitalInventory ? (
              // Digital Inventory: CPM Pricing
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs font-bold text-green-700 uppercase mb-3">Per Impression Pricing</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Spend (AED)</label>
                      <input
                        type="number"
                        name="min_spend_aed"
                        value={formData.min_spend_aed}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="500.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Impression (AED)</label>
                      <input
                        type="number"
                        name="cost_per_impression_aed"
                        value={formData.cost_per_impression_aed}
                        onChange={handleChange}
                        min="0"
                        step="0.000001"
                        placeholder="0.002"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        = AED {(Number(formData.cost_per_impression_aed) * 1000).toFixed(2)} CPM
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> Demand Multiplier
                    </label>
                    <input
                      type="number"
                      value={demandMultiplier}
                      onChange={(e) => setDemandMultiplier(Number(e.target.value))}
                      min="0.1"
                      max="10"
                      step="0.1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Multiplies base CPM rate</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Time Multiplier
                    </label>
                    <input
                      type="number"
                      value={timeMultiplier}
                      onChange={(e) => setTimeMultiplier(Number(e.target.value))}
                      min="0.1"
                      max="10"
                      step="0.1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Peak hours, seasonality</p>
                  </div>
                </div>
              </div>
            ) : (
              // OOH/DOOH: Flat Rate Pricing
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (AED/Day)</label>
                  <input
                    type="number"
                    name="base_price_aed"
                    value={formData.base_price_aed}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Demand Multiplier
                  </label>
                  <input
                    type="number"
                    value={demandMultiplier}
                    onChange={(e) => setDemandMultiplier(Number(e.target.value))}
                    min="0.1"
                    max="10"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">0.1 - 10.0</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Time Multiplier
                  </label>
                  <input
                    type="number"
                    value={timeMultiplier}
                    onChange={(e) => setTimeMultiplier(Number(e.target.value))}
                    min="0.1"
                    max="10"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">0.1 - 10.0</p>
                </div>
              </div>
            )}
          </div>

          {/* Audience Metrics */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-secondary mb-4">Audience Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Impressions</label>
                <input
                  type="number"
                  name="daily_impressions"
                  value={formData.daily_impressions}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              
              {['app', 'web'].includes(inventory.inventory_type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Active Users</label>
                  <input
                    type="number"
                    name="mau"
                    value={formData.mau}
                    onChange={handleChange}
                    min="0"
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              )}
              
              {inventory.inventory_type === 'web' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bounce Rate (%)</label>
                  <input
                    type="number"
                    name="bounce_rate"
                    value={formData.bounce_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-secondary mb-4">Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions / Duration</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g. 1920x1080 or 30s"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? 'Saving...' : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
