import { useState, useEffect } from 'react';
import { Activity, Play, Pause, RefreshCw, Server, Globe, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RTBSimulatorPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ requests: 0, wins: 0, spend: 0, avgCPM: 0 });

  // Mock Traffic Generator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(async () => {
        await generateBidRequest();
      }, 2000); // 1 request every 2 seconds
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const generateBidRequest = async () => {
    const locations = ['Dubai', 'Abu Dhabi', 'Sharjah'];
    const randomCity = locations[Math.floor(Math.random() * locations.length)];
    
    const bidRequest = {
      id: crypto.randomUUID(),
      at: 2, // Second Price Auction
      tmax: 500,
      imp: [{
        id: "1",
        banner: { w: 300, h: 250 },
        bidfloor: 5 + Math.random() * 10 // Random floor between 5-15 AED
      }],
      device: {
        geo: { city: randomCity, country: "ARE" },
        ip: "192.168.1.1"
      }
    };

    try {
      const startTime = Date.now();
      const res = await fetch('/api/rtb/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidRequest)
      });

      const latency = Date.now() - startTime;
      const status = res.status;
      let result = null;

      if (status === 200) {
        result = await res.json();
        setStats(prev => ({
          requests: prev.requests + 1,
          wins: prev.wins + 1,
          spend: prev.spend + result.seatbid[0].bid[0].price,
          avgCPM: ((prev.spend + result.seatbid[0].bid[0].price) / (prev.wins + 1))
        }));
      } else {
        setStats(prev => ({ ...prev, requests: prev.requests + 1 }));
      }

      addLog({
        id: bidRequest.id,
        timestamp: new Date().toLocaleTimeString(),
        city: randomCity,
        floor: bidRequest.imp[0].bidfloor?.toFixed(2),
        status: status === 200 ? 'WON' : 'NO BID',
        price: result ? result.seatbid[0].bid[0].price.toFixed(2) : '-',
        source: result ? (result.seatbid[0].seat || 'Internal') : '-',
        latency
      });

    } catch (error) {
      console.error(error);
    }
  };

  const addLog = (log: any) => {
    setLogs(prev => [log, ...prev].slice(0, 20)); // Keep last 20 logs
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-blue-400">
              <Server className="w-6 h-6 mr-3" /> RTB Auction Simulator
            </h1>
            <p className="text-slate-400 text-sm mt-1">OpenRTB 2.6 / Second-Price Auction Engine</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-xs font-bold ${isRunning ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-slate-800 text-slate-400'}`}>
              <Activity className={`w-3 h-3 mr-2 ${isRunning ? 'animate-pulse' : ''}`} />
              {isRunning ? 'LIVE TRAFFIC' : 'PAUSED'}
            </div>
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center px-6 py-2 rounded-lg font-bold transition-colors ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isRunning ? <><Pause className="w-4 h-4 mr-2" /> Stop Simulation</> : <><Play className="w-4 h-4 mr-2" /> Start Simulation</>}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Bid Requests</p>
            <h3 className="text-3xl font-bold text-white">{stats.requests}</h3>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Auctions Won</p>
            <h3 className="text-3xl font-bold text-green-400">{stats.wins}</h3>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Total Spend (AED)</p>
            <h3 className="text-3xl font-bold text-blue-400">{stats.spend.toFixed(2)}</h3>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Avg. Win CPM</p>
            <h3 className="text-3xl font-bold text-purple-400">{stats.avgCPM.toFixed(2)}</h3>
          </div>
        </div>

        {/* Live Logs */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-300">Live Auction Stream</h3>
            <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-white flex items-center">
              <RefreshCw className="w-3 h-3 mr-1" /> Clear Logs
            </button>
          </div>
          <div className="p-4 h-[400px] overflow-y-auto space-y-2">
            {logs.length === 0 && (
              <div className="text-center text-slate-600 py-20 italic">Waiting for bid requests...</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-center text-xs p-2 rounded hover:bg-slate-800/50 transition-colors border-l-2 border-transparent hover:border-blue-500">
                <span className="w-24 text-slate-500">{log.timestamp}</span>
                <span className="w-32 flex items-center text-slate-300"><Globe className="w-3 h-3 mr-1 text-slate-600" /> {log.city}</span>
                <span className="w-24 text-slate-400">Floor: {log.floor}</span>
                <span className={`w-24 font-bold ${log.status === 'WON' ? 'text-green-400' : 'text-slate-600'}`}>{log.status}</span>
                <span className="w-32 flex items-center text-white"><DollarSign className="w-3 h-3 mr-1 text-slate-600" /> {log.price}</span>
                <span className="w-32 text-xs text-blue-300 truncate pl-2">{log.source}</span>
                <span className="w-24 text-right text-slate-500">{log.latency}ms</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
