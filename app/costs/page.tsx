'use client';
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface Subscription {
  name: string;
  cost: number;
  frequency: 'monthly' | 'annual';
  category: string;
  lastBilled?: string;
}

interface DailyCost {
  date: string;
  amount: number;
  category: string;
  description: string;
}

interface NovaSystemCost {
  cost: number;
  reason: string;
}

export default function CostsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [monthlyProjection, setMonthlyProjection] = useState(0);
  const [openRouterCost, setOpenRouterCost] = useState(0);
  const [novaSystemCosts, setNovaSystemCosts] = useState<Record<string, NovaSystemCost>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchCostData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchCostData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCostData = async () => {
    try {
      const response = await fetch('/api/costs');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setDailyCosts(data.dailyCosts || []);
      setMonthlyProjection(data.monthlyProjection || 0);
      setOpenRouterCost(data.openRouterCost || 0);
      setNovaSystemCosts(data.novaSystemCosts || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthSpend = dailyCosts
    .filter(cost => {
      const costDate = new Date(cost.date);
      const now = new Date();
      return costDate.getMonth() === now.getMonth() && costDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, cost) => sum + cost.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading cost data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f1a 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">💰 Cost Tracking</h1>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-sm text-slate-400">
              Live · Updated: {lastUpdated.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* OpenRouter Separate Card (Critical Infrastructure) */}
        <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)', border: '1px solid rgba(99,102,241,0.4)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <DollarSign className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="text-sm text-indigo-300 font-medium">OpenRouter AI (Critical)</div>
                <div className="text-xs text-slate-400">Usage-based · Nova's brain</div>
              </div>
            </div>
          </div>
          <div className="text-4xl font-bold text-white mt-3">${openRouterCost.toFixed(2)}<span className="text-lg text-slate-400">/mo</span></div>
          <div className="mt-2 text-xs text-slate-400">
            Optimized from $640/mo → ${openRouterCost.toFixed(2)}/mo (model tiers)
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">Current Month Spend</span>
            </div>
            <div className="text-3xl font-bold text-white">${(currentMonthSpend + openRouterCost).toFixed(2)}</div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-slate-400">Month Projection</span>
            </div>
            <div className="text-3xl font-bold text-white">${monthlyProjection.toFixed(2)}</div>
          </div>
        </div>

        {/* Nova System Breakdown */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold text-white mb-4">Spending by Category</h2>
          <div className="space-y-3">
            {Object.entries(novaSystemCosts)
              .sort(([, a], [, b]) => b.cost - a.cost)
              .map(([system, data]) => {
                const percentage = openRouterCost > 0 ? (data.cost / openRouterCost) * 100 : 0;
                const systemLabels: Record<string, string> = {
                  'crypto-intel': 'AI/API',
                  'paper-trading': 'AI/API',
                  'heartbeat': 'AI/API',
                  'edge-intel': 'AI/API',
                  'manual': 'AI/API',
                  'unknown': 'AI/API'
                };
                return (
                  <div key={system}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-300">{systemLabels[system] || system}</span>
                        <span className="text-xs text-slate-500">{data.reason}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">${data.cost.toFixed(2)}/mo</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(novaSystemCosts).length === 0 && (
              <div className="text-center py-8 text-slate-500">No system costs logged yet</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity (This Month)</h2>
          <div className="space-y-2">
            {dailyCosts
              .filter(cost => {
                const costDate = new Date(cost.date);
                const now = new Date();
                return costDate.getMonth() === now.getMonth() && costDate.getFullYear() === now.getFullYear();
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((cost, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40">
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{cost.description}</div>
                    <div className="text-xs text-slate-400">{cost.category} · {new Date(cost.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm font-semibold text-orange-400">${cost.amount.toFixed(2)}</div>
                </div>
              ))}
            {dailyCosts.length === 0 && (
              <div className="text-center py-8 text-slate-500">No activity recorded yet</div>
            )}
          </div>
        </div>

        {/* Cost-Cutting Opportunities */}
        {openRouterCost > 200 && (
          <div className="p-6 rounded-xl" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">💡 Cost Optimization Opportunities</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Monthly OpenRouter spend is ${openRouterCost.toFixed(2)} - Consider reviewing token usage by system</li>
                  {Object.entries(novaSystemCosts)
                    .filter(([, data]) => data.cost > 50)
                    .map(([system, data]) => (
                      <li key={system}>
                        • <strong>{system}</strong> is using ${data.cost.toFixed(2)}/mo - Review {data.reason.toLowerCase()} efficiency
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
