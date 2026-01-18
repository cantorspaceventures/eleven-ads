import { useEffect, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Info, Shield, BarChart3 } from 'lucide-react';

interface AIExplanation {
  base_price: number;
  final_price: number;
  confidence_score: number;
  factors: {
    name: string;
    impact: string;
    description: string;
    score: number;
  }[];
  market_trends: {
    trend: string;
    percentage: number;
    context: string;
  };
  ai_reasoning: string;
}

export default function AIExplanationCard({ inventoryId }: { inventoryId: string }) {
  const [data, setData] = useState<AIExplanation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await fetch(`/api/ai/explain/${inventoryId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error('Failed to load AI explanation', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAI();
  }, [inventoryId]);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-secondary p-4 flex items-center justify-between">
        <div className="flex items-center text-white">
          <Brain className="w-5 h-5 mr-2 text-primary" />
          <h3 className="font-heading font-bold">AI Pricing Transparency</h3>
        </div>
        <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center">
          <Shield className="w-3 h-3 mr-1" />
          {Math.round(data.confidence_score * 100)}% Confidence
        </div>
      </div>

      <div className="p-6">
        <p className="text-gray-600 text-sm italic mb-6 border-l-4 border-primary pl-4 py-1">
          "{data.ai_reasoning}"
        </p>

        <h4 className="font-bold text-secondary text-sm mb-4 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" /> Key Pricing Factors
        </h4>

        <div className="space-y-4 mb-6">
          {data.factors.map((factor, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{factor.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  factor.impact === 'High' ? 'bg-orange-100 text-orange-700' :
                  factor.impact === 'Medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{factor.impact} Impact</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mb-1">
                <div 
                  className="bg-secondary h-1.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${factor.score}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400">{factor.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg flex items-start">
          {data.market_trends.trend === 'up' ? (
            <TrendingUp className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-bold text-secondary">
              Market Trend: {data.market_trends.percentage}% {data.market_trends.trend === 'up' ? 'Increase' : 'Decrease'}
            </p>
            <p className="text-xs text-gray-500">{data.market_trends.context}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
