import { useState } from 'react';
import { Calendar, Download, ChevronDown, BarChart2, TrendingUp, Users, DollarSign, Activity, MapPin } from 'lucide-react';

export default function CampaignAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30D');
  const [selectedCampaign, setSelectedCampaign] = useState('Summer Sale 2025 Campaign');

  // Mock Data
  const metrics = [
    { label: 'TOTAL IMPRESSIONS', value: '2.4M', change: '+12.3%', trend: 'up' },
    { label: 'REACH', value: '1.1M', change: '+8.7%', trend: 'up' },
    { label: 'AVG. FREQUENCY', value: '2.2', change: '-0.1', trend: 'down' },
    { label: 'SPEND', value: 'AED 87K', change: '62% of budget', trend: 'neutral' },
    { label: 'AVG. CPM', value: 'AED 36', change: '-AED 6 vs target', trend: 'good' },
  ];

  const mediaPerformance = [
    { type: 'OOH/DOOH', value: '1.2M', percentage: 50, color: 'bg-blue-600' },
    { type: 'Streaming Video', value: '840K', percentage: 35, color: 'bg-green-500' },
    { type: 'Mobile In-App', value: '360K', percentage: 15, color: 'bg-yellow-500' },
  ];

  const locations = [
    { name: 'Dubai Marina', impressions: '428K' },
    { name: 'Downtown Dubai', impressions: '385K' },
    { name: 'Business Bay', impressions: '312K' },
    { name: 'Jumeirah Lake Towers', impressions: '290K' },
    { name: 'Sheikh Zayed Road', impressions: '245K' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-secondary mb-2">Campaign Analytics Dashboard</h1>
            <div className="relative">
              <select 
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="appearance-none bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 p-2.5 pr-8 font-medium"
              >
                <option>Summer Sale 2025 Campaign</option>
                <option>Ramadan Special 2024</option>
                <option>New Brand Launch</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-white rounded-lg border border-gray-300 p-1">
              {['Today', '7D', '30D', 'Custom'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateRange === range ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{metric.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className={`text-xs font-medium ${
                metric.trend === 'up' || metric.trend === 'good' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {metric.change}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Performance Trend</h3>
            <div className="flex items-center space-x-4 text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked readOnly className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700">Impressions</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked readOnly className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700">Spend</span>
              </label>
            </div>
          </div>
          
          {/* Mock Line Chart */}
          <div className="h-64 w-full bg-gray-50 rounded-lg flex items-end justify-between px-4 pb-4 gap-2">
            {[40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 85, 95, 100, 90, 80].map((h, i) => (
              <div key={i} className="w-full bg-blue-500/20 rounded-t-sm relative group">
                <div className="absolute bottom-0 w-full bg-blue-600 rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Day {i + 1}: {h * 1000} Impr
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">[Line Chart: Daily impressions and spend over 30 days]</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Media Type Performance */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Media Type Performance</h3>
            <div className="space-y-6">
              {mediaPerformance.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-gray-700">{item.type}</span>
                    <span className="text-gray-900">{item.value} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Top Locations</h3>
            <div className="space-y-4">
              {locations.map((loc, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{loc.name}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{loc.impressions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Real-time analytics with customizable date ranges, export capabilities, and granular performance insights
        </p>

      </div>
    </div>
  );
}
