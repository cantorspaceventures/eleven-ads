import { useState, useEffect } from 'react';
import { X, Upload, MapPin, Radio, Smartphone, Globe, MonitorPlay, FileText, Users, Activity, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInventoryModal({ isOpen, onClose }: AddInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    inventory_type: 'OOH',
    location_emirate: 'Dubai',
    address: '',
    format: '',
    dimensions: '',
    daily_impressions: '',
    base_price_aed: '',
    // Extended Fields
    station_format: '',
    video_quality: 'HD',
    ad_skippable: false,
    mau: '',
    bounce_rate: '',
    website_category: '',
    app_category: '',
    // Audio Specific Fields
    station_name: '',
    placement_type: ''
  });

  // Reset form when type changes to avoid carry-over of irrelevant data
  useEffect(() => {
    // Optional: clear specific fields if needed
  }, [formData.inventory_type]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Handle Checkbox/Toggle
    if (type === 'checkbox') {
        setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleToggle = (field: string) => {
      setFormData(prev => ({ ...prev, [field]: !(prev as any)[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build payload excluding empty optional number fields
      const { mau, bounce_rate, ...rest } = formData;
      const payload: any = {
        owner_id: user.id,
        ...rest,
        // Ensure location_data JSON structure is created if needed by backend, 
        // or just pass flattened fields if backend handles it. 
        // Assuming backend handles flattened or we map specific fields.
        // For now we pass all extended fields.
        daily_impressions: Number(formData.daily_impressions),
        base_price_aed: Number(formData.base_price_aed),
      };

      // Only include optional number fields if they have values
      if (mau) payload.mau = Number(mau);
      if (bounce_rate) payload.bounce_rate = Number(bounce_rate);

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Inventory listed successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDigitalFields = () => {
    switch(formData.inventory_type) {
        case 'streaming_radio':
            return (
                <div className="space-y-4 border-t border-gray-100 pt-4 animate-in fade-in">
                    <h3 className="font-bold text-gray-900 flex items-center text-sm"><Radio className="w-4 h-4 mr-2" /> Audio Specifics</h3>
                    
                    {/* New Fields for Streaming Audio */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Station / App Name</label>
                            <input 
                                type="text" 
                                name="station_name" 
                                value={formData.station_name} 
                                onChange={handleChange} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                placeholder="e.g. Spotify, Virgin Radio" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Placement Type</label>
                            <select 
                                name="placement_type" 
                                value={formData.placement_type} 
                                onChange={handleChange} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                            >
                                <option value="">Select Placement...</option>
                                <option value="Pre-roll">Pre-roll</option>
                                <option value="Mid-roll">Mid-roll</option>
                                <option value="Post-roll">Post-roll</option>
                                <option value="Banner Companion">Banner Companion</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Station Format</label>
                            <select name="station_format" value={formData.station_format} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                <option value="">Select Format...</option>
                                <option value="Pop">Pop / Top 40</option>
                                <option value="News">News / Talk</option>
                                <option value="Classical">Classical</option>
                                <option value="Rock">Rock</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Listener Gender Split</label>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                <span>50% Male</span>
                                <span className="text-gray-300">|</span>
                                <span>50% Female</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'streaming_video':
            return (
                <div className="space-y-4 border-t border-gray-100 pt-4 animate-in fade-in">
                     <h3 className="font-bold text-gray-900 flex items-center text-sm"><MonitorPlay className="w-4 h-4 mr-2" /> Video Specifics</h3>
                     
                     {/* New Fields for Streaming Video */}
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Station / App Name</label>
                             <input 
                                 type="text" 
                                 name="station_name" 
                                 value={formData.station_name} 
                                 onChange={handleChange} 
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                 placeholder="e.g. YouTube, Shahid, Netflix" 
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Placement Type</label>
                             <select 
                                 name="placement_type" 
                                 value={formData.placement_type} 
                                 onChange={handleChange} 
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                             >
                                 <option value="">Select Placement...</option>
                                 <option value="Pre-roll">Pre-roll</option>
                                 <option value="Mid-roll">Mid-roll</option>
                                 <option value="Post-roll">Post-roll</option>
                                 <option value="Overlay">Overlay</option>
                             </select>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Video Quality</label>
                            <select name="video_quality" value={formData.video_quality} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                <option value="4K">4K Ultra HD</option>
                                <option value="HD">1080p HD</option>
                                <option value="SD">720p SD</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                             <span className="text-sm font-medium text-gray-700">Skippable Ad?</span>
                             <button type="button" onClick={() => handleToggle('ad_skippable')} className="text-blue-600 focus:outline-none">
                                 {formData.ad_skippable ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                             </button>
                        </div>
                     </div>
                </div>
            );
        case 'app':
            return (
                <div className="space-y-4 border-t border-gray-100 pt-4 animate-in fade-in">
                    <h3 className="font-bold text-gray-900 flex items-center text-sm"><Smartphone className="w-4 h-4 mr-2" /> App Metrics</h3>
                    
                    {/* New Fields for Mobile App */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">App Name</label>
                            <input 
                                type="text" 
                                name="station_name" 
                                value={formData.station_name} 
                                onChange={handleChange} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                placeholder="e.g. Candy Crush, TikTok" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Placement Type</label>
                            <select 
                                name="placement_type" 
                                value={formData.placement_type} 
                                onChange={handleChange} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                            >
                                <option value="">Select Placement...</option>
                                <option value="Banner">Banner</option>
                                <option value="Interstitial">Interstitial</option>
                                <option value="Rewarded Video">Rewarded Video</option>
                                <option value="Native">Native</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">App Category</label>
                            <select name="app_category" value={formData.app_category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                <option value="">Select Category...</option>
                                <option value="Gaming">Gaming</option>
                                <option value="Social">Social</option>
                                <option value="Utility">Utility</option>
                                <option value="News">News</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Active Users (MAU)</label>
                            <input type="number" name="mau" value={formData.mau} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 500000" />
                        </div>
                    </div>
                </div>
            );
        case 'web':
             return (
                <div className="space-y-4 border-t border-gray-100 pt-4 animate-in fade-in">
                    <h3 className="font-bold text-gray-900 flex items-center text-sm"><Globe className="w-4 h-4 mr-2" /> Web Analytics</h3>
                    
                    {/* New Fields for Web Portal */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Website Name</label>
                            <input 
                                type="text" 
                                name="station_name" 
                                value={formData.station_name} 
                                onChange={handleChange} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                placeholder="e.g. Gulf News, Dubizzle" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Placement Type</label>
                            <select 
                                name="placement_type" 
                                value={formData.placement_type} 
                                onChange={handleChange} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                            >
                                <option value="">Select Placement...</option>
                                <option value="Leaderboard">Leaderboard (728x90)</option>
                                <option value="Rectangle">Rectangle (300x250)</option>
                                <option value="Skyscraper">Skyscraper (160x600)</option>
                                <option value="Billboard">Billboard (970x250)</option>
                                <option value="Skin">Skin / Wallpaper</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Website Category</label>
                            <select name="website_category" value={formData.website_category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                <option value="">Select Category...</option>
                                <option value="E-commerce">E-commerce</option>
                                <option value="News">News / Media</option>
                                <option value="Blog">Blog</option>
                                <option value="Corporate">Corporate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Bounce Rate (%)</label>
                            <input type="number" name="bounce_rate" value={formData.bounce_rate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 45" />
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-secondary mb-6 flex items-center">
            <Upload className="w-5 h-5 mr-2" /> List New Inventory
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
              <select
                name="inventory_type"
                value={formData.inventory_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium text-gray-900"
              >
                <option value="OOH">OOH Billboard</option>
                <option value="DOOH">Digital OOH</option>
                <option value="streaming_radio">Streaming Audio</option>
                <option value="streaming_video">Streaming Video</option>
                <option value="app">Mobile App</option>
                <option value="web">Web Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / Region</label>
              <select
                name="location_emirate"
                value={formData.location_emirate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Sharjah">Sharjah</option>
                <option value="Global">Global (Digital Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {['streaming_radio', 'streaming_video', 'app', 'web'].includes(formData.inventory_type) ? 'Placement Name' : 'Physical Address'}
            </label>
            <div className="relative">
              {['OOH', 'DOOH'].includes(formData.inventory_type) ? (
                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              ) : (
                 <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              )}
              <input
                type="text"
                name="address"
                required
                placeholder={['streaming_radio', 'streaming_video', 'app', 'web'].includes(formData.inventory_type) ? "e.g. Pre-roll Slot, Homepage Banner" : "e.g. Sheikh Zayed Road, Exit 42"}
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Dynamic Digital Fields */}
          {renderDigitalFields()}

          {/* Common Specs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Format</label>
              <input
                type="text"
                name="format"
                required
                placeholder="e.g. MP4, JPG, HTML5"
                value={formData.format}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions / Duration</label>
              <input
                type="text"
                name="dimensions"
                placeholder={formData.inventory_type.includes('streaming') ? "e.g. 15s / 30s" : "e.g. 1920x1080"}
                value={formData.dimensions}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Daily Impressions</label>
              <div className="relative">
                 <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                 <input
                    type="number"
                    name="daily_impressions"
                    required
                    min="0"
                    placeholder="0"
                    value={formData.daily_impressions}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (AED)</label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">AED</span>
                 <input
                    type="number"
                    name="base_price_aed"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.base_price_aed}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-gray-900"
                  />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-900/10"
            >
              {loading ? 'Listing...' : (
                <><Upload className="w-5 h-5 mr-2" /> List Inventory Asset</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
