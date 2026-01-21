import { useState, useEffect, useRef } from 'react';
import { X, Upload, MapPin, Radio, Smartphone, Globe, MonitorPlay, FileText, Users, ToggleLeft, ToggleRight, ImagePlus, Link as LinkIcon, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Placement options by media type (merged from 11ADS Pricing Strategy + Industry Standards)
const PLACEMENTS_BY_TYPE: Record<string, string[]> = {
  'OOH': [
    'Highway Billboard',
    'Street Level Billboard',
    'Building Wrap',
    'Transit Shelter',
    'Bus Stop',
    'Mall Exterior',
    'Stadium Billboard',
  ],
  'DOOH': [
    'Digital Billboard',
    'Mall Digital Screen',
    'Transit Screen',
    'Airport Display',
    'Retail Digital Signage',
    'Elevator Screen',
    'Gas Station Display',
  ],
  'streaming_radio': [
    'Pre-roll Audio',
    'Mid-roll Audio',
    'Post-roll Audio',
    'Sponsored Segment',
    'Host-read Ad',
    'Podcast Sponsorship',
  ],
  'streaming_video': [
    'Pre-roll Video',
    'Mid-roll Video',
    'Post-roll Video',
    'Overlay Banner',
    'Companion Banner',
    'Branded Content',
    'CTV Home Screen',
  ],
  'app': [
    'Banner Ad',
    'Interstitial',
    'Rewarded Video',
    'Native Ad',
    'App Open Ad',
    'In-feed Ad',
    'Playable Ad',
  ],
  'web': [
    'Homepage Banner',
    'Leaderboard (728x90)',
    'Medium Rectangle (300x250)',
    'Skyscraper (160x600)',
    'In-article Ad',
    'Sticky Footer',
    'Native Content',
    'Video Player Ad',
  ],
};

// Ad formats available for each media type
const AD_FORMATS_BY_TYPE: Record<string, string[]> = {
  'OOH': ['JPG', 'PNG', 'PDF'],
  'DOOH': ['JPG', 'PNG', 'MP4', 'HTML5', 'GIF'],
  'streaming_radio': ['MP3', 'WAV', 'AAC', 'VAST'],
  'streaming_video': ['MP4', 'MOV', 'WebM', 'VAST', 'HTML5'],
  'app': ['JPG', 'PNG', 'GIF', 'HTML5', 'MP4', 'MRAID'],
  'web': ['JPG', 'PNG', 'GIF', 'HTML5', 'MP4', 'JavaScript Tag'],
};

export default function AddInventoryModal({ isOpen, onClose }: AddInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    inventory_type: 'OOH',
    location_emirate: 'Dubai',
    placement_name: '', // Custom name for the listing (shown in header)
    address: '', // Placement type (dropdown selection)
    format: '',
    dimensions: '',
    daily_impressions: '',
    base_price_aed: '',
    // CPM pricing for digital inventory
    min_spend_aed: '',
    cost_per_impression_aed: '',
    // Context-specific fields
    physical_address: '',
    app_name: '',
    website_url: '',
    platform_name: '',
    // Extended Fields
    station_format: '',
    video_quality: 'HD',
    ad_skippable: false,
    mau: '',
    bounce_rate: '',
    website_category: '',
    app_category: ''
  });

  // Helper to check if inventory type is digital (uses CPM pricing)
  const isDigitalInventory = ['streaming_radio', 'streaming_video', 'app', 'web'].includes(formData.inventory_type);

  // Reset format and placement when type changes since available options differ
  useEffect(() => {
    setFormData(prev => ({ ...prev, format: '', address: '' }));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (imageMode === 'url' && imageUrl) {
      return imageUrl;
    }
    
    if (imageMode === 'upload' && imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('inventory-images')
        .upload(fileName, imageFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(fileName);
      
      return publicUrl;
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload image if provided
      const uploadedImageUrl = await uploadImage(user.id);

      // Build payload excluding empty optional number fields
      const { mau, bounce_rate, min_spend_aed, cost_per_impression_aed, ...rest } = formData;
      const isDigital = ['streaming_radio', 'streaming_video', 'app', 'web'].includes(formData.inventory_type);
      
      const payload: any = {
        owner_id: user.id,
        ...rest,
        daily_impressions: Number(formData.daily_impressions),
        // For digital inventory, use min_spend as base_price (or 0 if not set)
        base_price_aed: isDigital ? (min_spend_aed ? Number(min_spend_aed) : 0) : Number(formData.base_price_aed),
      };

      // Add CPM fields for digital inventory
      if (isDigital) {
        if (min_spend_aed) payload.min_spend_aed = Number(min_spend_aed);
        if (cost_per_impression_aed) payload.cost_per_impression_aed = Number(cost_per_impression_aed);
      }

      // Add image URL if provided
      if (uploadedImageUrl) {
        payload.image_url = uploadedImageUrl;
      }

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
          {/* Placement Name - Shown in listing header */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placement Name *</label>
            <input
              type="text"
              name="placement_name"
              required
              placeholder="e.g. Homepage Banner, Pre-roll 30s, Mall Entrance Screen"
              value={formData.placement_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
            />
            <p className="text-xs text-gray-400 mt-1">This name will be displayed as the listing title</p>
          </div>

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
                <option value="Ajman">Ajman</option>
                <option value="Umm Al Quwain">Umm Al Quwain</option>
                <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                <option value="Fujairah">Fujairah</option>
                <option value="Global">Global (Digital Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {['streaming_radio', 'streaming_video', 'app', 'web'].includes(formData.inventory_type) ? 'Placement Type' : 'Placement Type'}
            </label>
            <div className="relative">
              {['OOH', 'DOOH'].includes(formData.inventory_type) ? (
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              ) : (
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              )}
              <select
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                <option value="">Select Placement...</option>
                {PLACEMENTS_BY_TYPE[formData.inventory_type]?.map((placement) => (
                  <option key={placement} value={placement}>{placement}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Context-specific identifier field */}
          {['OOH', 'DOOH'].includes(formData.inventory_type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="physical_address"
                  required
                  placeholder="e.g. Sheikh Zayed Road, Near Mall of Emirates"
                  value={formData.physical_address}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {formData.inventory_type === 'app' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="app_name"
                  required
                  placeholder="e.g. Careem, Noon, Talabat"
                  value={formData.app_name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {formData.inventory_type === 'web' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  name="website_url"
                  required
                  placeholder="e.g. https://khaleejtimes.com"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {['streaming_radio', 'streaming_video'].includes(formData.inventory_type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.inventory_type === 'streaming_radio' ? 'Station / Platform Name' : 'Channel / Platform Name'}
              </label>
              <div className="relative">
                {formData.inventory_type === 'streaming_radio' ? (
                  <Radio className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                ) : (
                  <MonitorPlay className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                )}
                <input
                  type="text"
                  name="platform_name"
                  required
                  placeholder={formData.inventory_type === 'streaming_radio' ? "e.g. ARN, Virgin Radio Dubai" : "e.g. Shahid, OSN, StarzPlay"}
                  value={formData.platform_name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ImagePlus className="w-4 h-4 mr-2" /> Inventory Image (Optional)
            </label>
            
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  imageMode === 'url' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <LinkIcon className="w-4 h-4" /> URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  imageMode === 'upload' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload
              </button>
            </div>

            {imageMode === 'url' ? (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus className="w-8 h-8 mb-2" />
                    <span className="text-sm">Click to upload image</span>
                    <span className="text-xs text-gray-400 mt-1">Max 5MB</span>
                  </button>
                )}
              </div>
            )}

            {/* URL Preview */}
            {imageMode === 'url' && imageUrl && (
              <div className="mt-3">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Dynamic Digital Fields */}
          {renderDigitalFields()}

          {/* Common Specs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Format</label>
              <select
                name="format"
                required
                value={formData.format}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                <option value="">Select Format...</option>
                {AD_FORMATS_BY_TYPE[formData.inventory_type]?.map((fmt) => (
                  <option key={fmt} value={fmt}>{fmt}</option>
                ))}
              </select>
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

          {/* Pricing Section - Different for OOH vs Digital */}
          {isDigitalInventory ? (
            // Digital Inventory: CPM Pricing
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-green-600" /> Per Impression Pricing
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Spend (AED)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">AED</span>
                    <input
                      type="number"
                      name="min_spend_aed"
                      required
                      min="0"
                      step="0.01"
                      placeholder="500.00"
                      value={formData.min_spend_aed}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Per Impression (AED)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">AED</span>
                  <input
                    type="number"
                    name="cost_per_impression_aed"
                    required
                    min="0"
                    step="0.000001"
                    placeholder="0.002"
                    value={formData.cost_per_impression_aed}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-gray-900 bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Price per single impression (e.g., 0.002 = AED 2 per 1000 impressions)</p>
              </div>
              {/* Live Price Preview */}
              {formData.cost_per_impression_aed && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-xs text-gray-500 mb-1">Buyers will see:</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-600">
                      AED {Number(formData.cost_per_impression_aed).toFixed(4)}
                    </span>
                    <span className="text-sm text-gray-500">per impression</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    = AED {(Number(formData.cost_per_impression_aed) * 1000).toFixed(2)} CPM (per 1000 impressions)
                  </p>
                </div>
              )}
            </div>
          ) : (
            // OOH/DOOH: Flat Rate Pricing
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (AED/Day)</label>
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
          )}

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
