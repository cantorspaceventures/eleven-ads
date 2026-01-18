import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowRight, ArrowLeft, Upload, CheckCircle, Target, Calendar, DollarSign, MapPin, Users, Activity, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Details
    name: '',
    objective: 'brand_awareness',
    description: '',
    media_types: {
      ooh: true,
      audio: false,
      video: true,
      app: false,
      web: false
    },
    start_date: '',
    end_date: '',
    
    // Step 2: Targeting
    locations: ['Dubai Marina', 'Business Bay', 'Downtown Dubai'],
    demographics: {
      age_min: 25,
      age_max: 45,
      gender: 'male', // all, male, female
      income: 'medium',
      languages: { english: true, arabic: true, hindi: false, urdu: false }
    },
    interests: ['Luxury Shopping', 'Fitness'],

    // Step 3: Creative (Existing)
    creatives: [] as any[],

    // Step 4: Budget & Bidding
    budget_type: 'daily', // daily, total
    budget_amount: 5000,
    optimization_goal: 'maximize_impressions',
    max_cpm_bid: 65,
    dynamic_pricing: {
      time_of_day: true,
      weather: false
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (category: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev] as any,
        [field]: !((prev[category as keyof typeof prev] as any)[field])
      }
    }));
  };

  const handleCreativeUpload = () => {
    // Mock upload
    const newCreative = {
      name: `Creative_Asset_${formData.creatives.length + 1}.jpg`,
      type: 'image',
      url: 'https://via.placeholder.com/1920x1080', 
      format: '1920x1080'
    };
    setFormData({ ...formData, creatives: [...formData.creatives, newCreative] });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (formData.creatives.length === 0) {
        toast.error('Please upload at least one creative asset.');
        setLoading(false);
        return;
      }

      if (!formData.start_date || !formData.end_date) {
        toast.error('Please select a start and end date.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiser_id: user.id,
          name: formData.name,
          objective: formData.objective,
          total_budget: Number(formData.budget_amount), // Simplified mapping
          start_date: formData.start_date,
          end_date: formData.end_date,
          creatives: formData.creatives,
          // Add other fields as JSON metadata in a real app
          max_cpm_bid: Number(formData.max_cpm_bid),
          targeting: {
            locations: formData.locations,
            demographics: formData.demographics,
            interests: formData.interests
          }
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Campaign launched successfully!');
      navigate('/dashboard?campaign_created=true');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Campaign Details' },
    { id: 2, name: 'Targeting' },
    { id: 3, name: 'Creative' },
    { id: 4, name: 'Budget & Bidding' },
    { id: 5, name: 'Review & Launch' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Wizard Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-2xl font-heading font-bold text-secondary mb-6">Advertiser - Campaign Creation Wizard</h1>
          
          <div className="flex justify-between relative">
            {/* Progress Bar Background */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>
            
            {/* Active Progress Bar (approximate width based on step) */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-0 -translate-y-1/2 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center bg-white px-2 cursor-pointer" onClick={() => step > s.id && setStep(s.id)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors border-2 ${
                  step === s.id ? 'bg-blue-600 border-blue-600 text-white' : 
                  step > s.id ? 'bg-blue-600 border-blue-600 text-white' : 
                  'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-xs font-medium ${step === s.id ? 'text-blue-600' : 'text-gray-500'}`}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[70vh]">
          
          {/* Step 1: Campaign Details */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Step 1: Campaign Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      placeholder="e.g., Summer Sale 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Objective*</label>
                    <select
                      name="objective"
                      value={formData.objective}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="brand_awareness">Brand Awareness</option>
                      <option value="traffic">Traffic / Clicks</option>
                      <option value="conversions">Conversions</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Media Type Preference</label>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(formData.media_types).map(([key, checked]) => (
                        <label key={key} className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          <input 
                            type="checkbox" 
                            checked={checked}
                            onChange={() => handleCheckboxChange('media_types', key)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className="capitalize text-sm font-medium">{key.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-24 resize-none"
                      placeholder="Describe your campaign goals and messaging..."
                    />
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
                <div className="mt-0.5"><div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-yellow-900">💡</div></div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Campaign Tips</h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Clear naming helps track performance across multiple campaigns</li>
                    <li>Choose objectives that align with your business goals</li>
                    <li>Longer campaigns (14+ days) perform better for awareness</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Targeting */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
               <h2 className="text-2xl font-bold text-blue-900">Audience Targeting & Geo-Selection</h2>

               <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                 <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                   <h3 className="text-lg font-bold text-gray-900">Geographic Targeting</h3>
                   <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                     <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-md">Emirates</button>
                     <button className="px-3 py-1 text-xs font-medium text-white bg-blue-600 shadow-sm rounded-md">Cities</button>
                     <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-md">Custom</button>
                   </div>
                 </div>

                 {/* Map Placeholder */}
                 <div className="bg-gray-100 h-48 rounded-lg flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer">
                    <MapPin className="w-8 h-8 mb-2 text-gray-300" />
                    <span className="text-sm font-medium">Interactive Map View</span>
                    <span className="text-xs">Click to select locations</span>
                    
                    {/* Fake Map Pins */}
                    <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-green-500 rounded-full ring-4 ring-white shadow-lg"></div>
                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-white shadow-lg"></div>
                    <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-green-500 rounded-full ring-4 ring-white shadow-lg"></div>
                 </div>

                 {/* Selected Locations Tags */}
                 <div className="flex flex-wrap gap-2">
                   {formData.locations.map(loc => (
                     <span key={loc} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                       {loc} <button className="ml-1.5 text-blue-400 hover:text-blue-600">×</button>
                     </span>
                   ))}
                   <button className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 border-dashed">
                     + Add Location
                   </button>
                 </div>
               </div>

               <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                 <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Demographics</h3>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                     <div className="flex items-center space-x-2">
                       <input type="number" value={formData.demographics.age_min} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                       <span className="text-gray-400">-</span>
                       <input type="number" value={formData.demographics.age_max} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                     <div className="flex space-x-4 pt-2">
                       {['All', 'Male', 'Female'].map(g => (
                         <label key={g} className="flex items-center space-x-2 cursor-pointer">
                           <input 
                              type="radio" 
                              name="gender" 
                              checked={g.toLowerCase() === (formData.demographics.gender === 'all' ? 'all' : formData.demographics.gender)}
                              className="text-blue-600 focus:ring-blue-500"
                           />
                           <span className="text-sm text-gray-700">{g}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Income Level</label>
                   <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                     <option>Medium (AED 15-30K/month)</option>
                     <option>High (AED 30-50K/month)</option>
                     <option>Very High (AED 50K+/month)</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                   <div className="flex space-x-6">
                     {Object.entries(formData.demographics.languages).map(([lang, checked]) => (
                       <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                         <input type="checkbox" checked={checked} className="rounded text-blue-600 focus:ring-blue-500" readOnly />
                         <span className="capitalize text-sm text-gray-700">{lang}</span>
                       </label>
                     ))}
                   </div>
                 </div>
               </div>
               
               {/* Reach Footer */}
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                 <div>
                    <h4 className="text-sm font-bold text-blue-900">Estimated Reach</h4>
                    <p className="text-xs text-blue-700">Based on current targeting criteria</p>
                 </div>
                 <div className="text-xl font-bold text-blue-600">1.2M - 1.8M</div>
               </div>
            </div>
          )}

          {/* Step 3: Creative (Reused) */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h2 className="text-lg font-bold text-secondary flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary" /> Upload Creatives
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleCreativeUpload}>
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Click to Upload Assets</h3>
                <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, MP4 (Max 50MB)</p>
              </div>
              {formData.creatives.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Uploaded Files:</h3>
                  {formData.creatives.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                           <img src={file.url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.format} • {file.type}</p>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Budget & Bidding */}
          {step === 4 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
               <h2 className="text-2xl font-bold text-blue-900">Budget & Bidding Strategy</h2>

               <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                 <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Budget Allocation</h3>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Budget Type</label>
                   <div className="flex space-x-6">
                     <label className="flex items-center space-x-3 cursor-pointer">
                       <input type="radio" name="budget_type" checked={formData.budget_type === 'daily'} onChange={() => setFormData({...formData, budget_type: 'daily'})} className="text-blue-600 focus:ring-blue-500" />
                       <div>
                         <span className="block text-sm font-medium text-gray-900">Daily Budget</span>
                         <span className="block text-xs text-gray-500">Spend evenly each day</span>
                       </div>
                     </label>
                     <label className="flex items-center space-x-3 cursor-pointer">
                       <input type="radio" name="budget_type" checked={formData.budget_type === 'total'} onChange={() => setFormData({...formData, budget_type: 'total'})} className="text-blue-600 focus:ring-blue-500" />
                       <div>
                         <span className="block text-sm font-medium text-gray-900">Total Budget</span>
                         <span className="block text-xs text-gray-500">Optimized pacing</span>
                       </div>
                     </label>
                   </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{formData.budget_type === 'daily' ? 'Daily' : 'Total'} Budget Amount (AED)</label>
                    <input
                      type="number"
                      name="budget_amount"
                      value={formData.budget_amount}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: AED 3,000 - 10,000 for your targeting</p>
                 </div>
               </div>

               {/* Budget Summary Card */}
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3">
                 <h4 className="text-sm font-bold text-blue-900 mb-2">Budget Summary</h4>
                 <div className="flex justify-between text-sm">
                   <span className="text-blue-800">Daily Budget:</span>
                   <span className="font-medium text-blue-900">AED {Number(formData.budget_amount).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm border-t border-blue-200 pt-2">
                   <span className="text-blue-800">Total Duration:</span>
                   <span className="font-medium text-blue-900">28 days</span>
                 </div>
                 <div className="flex justify-between text-base font-bold pt-2 border-t border-blue-200 mt-2">
                   <span className="text-blue-900">Total Investment:</span>
                   <span className="text-blue-600">AED {(Number(formData.budget_amount) * 28).toLocaleString()}</span>
                 </div>
               </div>

               <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                 <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Bidding Strategy</h3>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Optimization Goal</label>
                   <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                     <option>Maximize Impressions</option>
                     <option>Maximize Reach</option>
                     <option>Maximize Clicks</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Maximum CPM Bid (AED) (Optional)</label>
                   <input
                      type="number"
                      name="max_cpm_bid"
                      value={formData.max_cpm_bid}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                   />
                   <p className="text-xs text-gray-500 mt-1">Avg market CPM: AED 42 | Peak: AED 85</p>
                 </div>

                 {/* Bid Distribution Preview Chart Placeholder */}
                 <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 h-32 flex items-end justify-between space-x-1">
                    {[20, 35, 45, 60, 55, 40, 30].map((h, i) => (
                      <div key={i} className="bg-blue-500 w-full rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {/* Step 5: Review & Launch */}
          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h2 className="text-lg font-bold text-secondary flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" /> Review & Launch
              </h2>
              
              <div className="bg-gray-50 p-6 rounded-xl space-y-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Campaign Details</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between"><dt className="text-gray-500">Name:</dt><dd className="font-medium">{formData.name}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Objective:</dt><dd className="font-medium capitalize">{formData.objective.replace('_', ' ')}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Dates:</dt><dd className="font-medium">{formData.start_date} - {formData.end_date}</dd></div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Budget & Targeting</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between"><dt className="text-gray-500">Daily Budget:</dt><dd className="font-medium">AED {formData.budget_amount}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Locations:</dt><dd className="font-medium">{formData.locations.length} selected</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Est. Reach:</dt><dd className="font-medium text-green-600">1.2M - 1.8M</dd></div>
                    </dl>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500 uppercase">Creatives</span>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {formData.creatives.map((c, i) => (
                      <div key={i} className="aspect-video bg-gray-200 rounded-md overflow-hidden relative">
                        <img src={c.url} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate">{c.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-white flex justify-between items-center sticky bottom-0 z-10">
           <button 
             className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
           >
             Save Draft
           </button>

           <div className="flex space-x-3">
             {step > 1 && (
               <button 
                 onClick={() => setStep(step - 1)}
                 className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
               >
                 Back
               </button>
             )}
             
             {step < 5 ? (
               <button 
                 onClick={() => setStep(step + 1)}
                 className="bg-blue-600 text-white px-8 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center"
               >
                 Continue to {steps[step].name} <ArrowRight className="w-4 h-4 ml-2" />
               </button>
             ) : (
               <button 
                 onClick={handleSubmit}
                 disabled={loading}
                 className="bg-green-600 text-white px-8 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center disabled:opacity-70"
               >
                 {loading ? 'Launching...' : 'Launch Campaign'}
               </button>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
