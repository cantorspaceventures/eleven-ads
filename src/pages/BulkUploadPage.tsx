import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Download as DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkUploadPage() {
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState('OOH/DOOH Billboards');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    // Mock upload process
    setTimeout(() => {
      setUploading(false);
      toast.success('Inventory uploaded successfully!');
      navigate('/publisher-dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/publisher-dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
             <h1 className="text-2xl font-heading font-bold text-secondary">Inventory Management - Bulk Upload</h1>
             <p className="text-gray-500">Add multiple inventory units efficiently via CSV.</p>
          </div>
        </div>

        {/* Upload Process Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">
           <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-4">Upload Process</h3>
           
           <div className="space-y-6">
             {/* Step 1 */}
             <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
               <div className="flex-1 space-y-2">
                 <label className="font-medium text-gray-900 block">Select Media Type</label>
                 <select 
                   value={mediaType}
                   onChange={(e) => setMediaType(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                 >
                   <option>OOH/DOOH Billboards</option>
                   <option>Streaming Audio/Video</option>
                   <option>Mobile App Inventory</option>
                 </select>
               </div>
             </div>

             {/* Step 2 */}
             <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold shrink-0">2</div>
               <div className="flex-1 space-y-2">
                 <label className="font-medium text-gray-900 block">Download Template</label>
                 <button className="w-full flex items-center justify-center px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                   <DownloadIcon className="w-4 h-4 mr-2" /> Download CSV Template
                 </button>
               </div>
             </div>

             {/* Step 3 */}
             <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold shrink-0">3</div>
               <div className="flex-1">
                 <label className="font-medium text-gray-900 block">Fill Template</label>
                 <p className="text-sm text-gray-500 mt-1">Complete all required fields per media type specifications.</p>
               </div>
             </div>

             {/* Step 4 */}
             <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold shrink-0">4</div>
               <div className="flex-1 space-y-2">
                 <label className="font-medium text-gray-900 block">Upload & Validate</label>
                 
                 <div 
                   className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                   onDragEnter={handleDrag}
                   onDragLeave={handleDrag}
                   onDragOver={handleDrag}
                   onDrop={handleDrop}
                 >
                    {!file ? (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 font-medium">Drag & drop or click to upload</p>
                        <input type="file" className="hidden" id="file-upload" onChange={handleChange} accept=".csv" />
                        <label htmlFor="file-upload" className="mt-2 inline-block text-xs text-blue-600 hover:underline cursor-pointer">Browse files</label>
                      </>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                        <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 ml-4">×</button>
                      </div>
                    )}
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Guidelines Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
           <h4 className="font-bold text-blue-900 flex items-center mb-2">
             <span className="mr-2">💡</span> Template Includes:
           </h4>
           <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-6">
             <li>Pre-validated field formats</li>
             <li>Dropdown options for specs</li>
             <li>Location coordinates helper</li>
             <li>Pricing guidance</li>
           </ul>
        </div>

        {/* Example Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
             <h4 className="font-bold text-gray-900">Required Fields - OOH/DOOH Example</h4>
           </div>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 text-sm">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left font-medium text-gray-500">Field Name</th>
                   <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                   <th className="px-6 py-3 text-left font-medium text-gray-500">Example</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 <tr><td className="px-6 py-3 font-mono text-xs">inventory_id*</td><td className="px-6 py-3">Text</td><td className="px-6 py-3 text-gray-500">OOH-SZR-001</td></tr>
                 <tr><td className="px-6 py-3 font-mono text-xs">location_name*</td><td className="px-6 py-3">Text</td><td className="px-6 py-3 text-gray-500">Sheikh Zayed Road - Exit 41</td></tr>
                 <tr><td className="px-6 py-3 font-mono text-xs">latitude*</td><td className="px-6 py-3">Decimal</td><td className="px-6 py-3 text-gray-500">25.2048</td></tr>
                 <tr><td className="px-6 py-3 font-mono text-xs">base_price_cpm*</td><td className="px-6 py-3">Decimal</td><td className="px-6 py-3 text-gray-500">45.00</td></tr>
               </tbody>
             </table>
           </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Validating & Uploading...' : 'Upload CSV'}
        </button>
        
        <p className="text-center text-xs text-gray-400">
          Bulk upload supports 5 media types with auto-validation and error reporting | Max 1000 rows per upload
        </p>

      </div>
    </div>
  );
}
