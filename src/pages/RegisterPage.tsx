import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { Upload, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Shared
    role: 'premium_publisher', // Defaulting to publisher for this demo flow
    email: '',
    password: '',
    business_name: '',
    phone: '',
    
    // Step 2 (Publisher)
    trade_license_no: '',
    tax_registration_no: '',
    accepted_terms: false,

    // Step 3 (Publisher)
    bank_name: '',
    iban: '',
    account_holder: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In a real app, we would send all this data
      // For now, we map to the existing API structure
      const response = await fetch('/api/auth/register-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          business_name: formData.business_name,
          trade_license: formData.trade_license_no, // Mapping fields
          media_license: 'N/A' // Placeholder
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Registration complete! Please log in.');
      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render steps for Publisher
  const renderPublisherSteps = () => (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Step {step}: {
          step === 1 ? 'Account Details' : 
          step === 2 ? 'Business Verification' : 'Payment Setup'
        }</h3>
      </div>

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        {/* Step 1: Account Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name*</label>
              <input name="business_name" value={formData.business_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Email*</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number*</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password*</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        )}

        {/* Step 2: Business Verification */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trade License*</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-600">Click to upload PDF or Image</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Registration</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-600">Click to upload PDF or Image</span>
              </div>
            </div>
            <div className="flex items-center">
              <input id="terms" name="accepted_terms" type="checkbox" checked={formData.accepted_terms} onChange={handleChange as any} required className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">Accept Terms & Conditions</label>
            </div>
          </div>
        )}

        {/* Step 3: Payment Setup */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div>
              <label className="block text-sm font-medium text-gray-700">Bank Name*</label>
              <select name="bank_name" value={formData.bank_name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="">Select Bank...</option>
                <option value="enbd">Emirates NBD</option>
                <option value="adcb">ADCB</option>
                <option value="mashreq">Mashreq Bank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IBAN*</label>
              <input name="iban" value={formData.iban} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Holder*</label>
              <input name="account_holder" value={formData.account_holder} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
           {step > 1 && (
             <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
               Back
             </button>
           )}
           <button type="submit" className={`ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${step === 3 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
             {step === 3 ? (loading ? 'Registering...' : 'Complete Registration') : 'Next Step'}
           </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center mb-6">
             <Logo />
          </Link>
          <h2 className="text-3xl font-heading font-bold text-secondary">
            {formData.role === 'premium_publisher' ? 'Publisher Registration' : 'Apply for Access'}
          </h2>
          
          {/* Role Switcher (Hidden in wizard mode to focus flow, but available initially) */}
          {step === 1 && (
            <div className="mt-4 flex justify-center space-x-4">
               <button 
                 onClick={() => setFormData({...formData, role: 'premium_publisher'})}
                 className={`px-4 py-2 text-sm font-medium rounded-full ${formData.role === 'premium_publisher' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
               >
                 Publisher
               </button>
               <button 
                 onClick={() => setFormData({...formData, role: 'premium_advertiser'})}
                 className={`px-4 py-2 text-sm font-medium rounded-full ${formData.role !== 'premium_publisher' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
               >
                 Advertiser
               </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {formData.role === 'premium_publisher' ? renderPublisherSteps() : (
          /* Simplified Advertiser Form */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option value="premium_advertiser">Premium Advertiser</option>
                  <option value="media_agency">Media Agency</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700">Business Name</label><input name="business_name" value={formData.business_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Business Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Password</label><input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700">UAE Trade License Number</label><input name="trade_license_no" value={formData.trade_license_no} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}

        <div className="text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
