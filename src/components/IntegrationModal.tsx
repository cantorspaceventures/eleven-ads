import { useState } from 'react';
import { X, Copy, Code, Zap, CheckCircle, Server } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
  inventoryName: string;
  inventoryType: string;
}

export default function IntegrationModal({ isOpen, onClose, inventoryId, inventoryName, inventoryType }: IntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<'tag' | 'test'>('tag');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const generateAdTag = () => {
    const script = `<script>
  (function() {
    const config = {
      id: "${inventoryId}",
      type: "${inventoryType}",
      elementId: "ad-slot-${inventoryId.slice(0, 8)}"
    };
    
    // ElevenAds Programmatic Loader
    window.elevenAds = window.elevenAds || [];
    window.elevenAds.push(config);
    
    const s = document.createElement('script');
    s.src = "https://cdn.elevenads.com/sdk/loader.js";
    s.async = true;
    document.head.appendChild(s);
  })();
</script>

<div id="ad-slot-${inventoryId.slice(0, 8)}"></div>`;
    return script;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateAdTag());
    toast.success('Ad tag copied to clipboard');
  };

  const runTestSignal = async () => {
    setIsTestRunning(true);
    setTestResult(null);
    
    try {
      // Simulate a bid request for this specific inventory
      const bidRequest = {
        id: crypto.randomUUID(),
        at: 2,
        tmax: 500,
        imp: [{
          id: inventoryId,
          banner: { w: 300, h: 250 }, // Should ideally come from inventory props
          bidfloor: 5
        }],
        device: {
          geo: { city: "Dubai", country: "ARE" },
          ip: "127.0.0.1"
        }
      };

      const startTime = Date.now();
      const res = await fetch('/api/rtb/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidRequest)
      });
      
      const latency = Date.now() - startTime;
      const status = res.status;
      let data = null;
      
      if (status === 200) {
        data = await res.json();
      }

      setTestResult({
        status: status === 200 ? 'SUCCESS' : 'NO_BID',
        latency,
        data,
        timestamp: new Date().toLocaleTimeString()
      });

      if (status === 200) {
        toast.success('Test signal received successful bid!');
      } else {
        toast.info('Test signal sent (No active bids matched)');
      }
      
    } catch (error) {
      toast.error('Failed to send test signal');
      console.error(error);
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-secondary flex items-center">
              <Code className="w-5 h-5 mr-2 text-primary" /> Integration & Live Signal
            </h2>
            <p className="text-sm text-gray-500 mt-1">Setup programmatic access for <span className="font-medium text-gray-700">{inventoryName}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('tag')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tag' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Get Ad Tag
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'test' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Test Live Signal
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          
          {activeTab === 'tag' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800">Ready to Broadcast</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    Copy the code snippet below and place it in your website or app where you want the ad to appear. 
                    This will automatically signal availability to the ElevenAds exchange.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute right-2 top-2">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium transition-colors border border-white/20"
                  >
                    <Copy className="w-3 h-3 mr-1.5" /> Copy Code
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-slate-800">
                  {generateAdTag()}
                </pre>
              </div>

              <div className="text-xs text-gray-400 text-center">
                Inventory ID: <span className="font-mono text-gray-600">{inventoryId}</span>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto relative">
                  <Server className={`w-8 h-8 ${isTestRunning ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                  {isTestRunning && (
                    <span className="absolute -right-1 -top-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Simulate Bid Request</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    This will fire a real programmatic bid request to the ElevenAds Exchange for this inventory unit to verify connectivity.
                  </p>
                </div>
                <button
                  onClick={runTestSignal}
                  disabled={isTestRunning}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {isTestRunning ? 'Sending Signal...' : 'Send Test Signal'}
                </button>
              </div>

              {testResult && (
                <div className={`mt-6 rounded-lg border p-4 animate-in slide-in-from-bottom-2 ${testResult.status === 'SUCCESS' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      {testResult.status === 'SUCCESS' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      ) : (
                        <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                      )}
                      <span className={`font-bold ${testResult.status === 'SUCCESS' ? 'text-green-800' : 'text-yellow-800'}`}>
                        {testResult.status === 'SUCCESS' ? 'Bid Received' : 'No Bid Returned'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">{testResult.latency}ms</span>
                  </div>
                  
                  {testResult.data && (
                    <div className="mt-2 text-xs font-mono bg-white/50 p-2 rounded border border-black/5 text-gray-700">
                      Price: {testResult.data.seatbid[0].bid[0].price} AED<br/>
                      Buyer: {testResult.data.seatbid[0].seat}<br/>
                      Creative: {testResult.data.seatbid[0].bid[0].crid}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-400 text-right">
                    Timestamp: {testResult.timestamp}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
