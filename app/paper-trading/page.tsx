'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2, XCircle, Clock, Activity, DollarSign } from 'lucide-react';

interface Trade {
  id: string;
  date: string;
  signal: string;
  asset: string;
  conviction: string;
  entry_price: number;
  position_size: number;
  position_value: number;
  position_pct: number;
  stop_loss: number;
  target_1: number;
  target_2: number | null;
  target_3: number | null;
  status: 'active' | 'closed' | 'partial';
  outcome: string | null;
  exit_price: number | null;
  pnl: number | null;
  pnl_pct: number | null;
  notes: string;
  created_at: string;
}

interface LivePrice {
  asset: string;
  price: number;
  change24h: number;
}

interface Stats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  riskReward: number;
  totalPnL: number;
  totalPnLPct: number;
  maxDrawdown: number;
  convictionBreakdown: Record<string, {
    count: number;
    winRate: number;
    avgPnL: number;
  }>;
}

export default function PaperTradingPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTrades();
    fetchLivePrices();
    const tradesInterval = setInterval(fetchTrades, 60000); // Refresh trades every 60s
    const pricesInterval = setInterval(fetchLivePrices, 30000); // Refresh prices every 30s
    return () => {
      clearInterval(tradesInterval);
      clearInterval(pricesInterval);
    };
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/paper-trading');
      const data = await response.json();
      setTrades(data.trades || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    try {
      const activeAssets = trades.filter(t => t.status === 'active').map(t => t.asset);
      const assets = Array.from(new Set(activeAssets));
      if (assets.length === 0) return;

      const coinIds: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'XRP': 'ripple',
        'TON': 'the-open-network',
        'PENGU': 'pengu',
        'ZEC': 'zcash',
        'ADA': 'cardano'
      };

      const ids = assets.map(a => coinIds[a]).filter(Boolean).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();

      const prices: Record<string, LivePrice> = {};
      for (const [asset, coinId] of Object.entries(coinIds)) {
        if (data[coinId]) {
          prices[asset] = {
            asset,
            price: data[coinId].usd,
            change24h: data[coinId].usd_24h_change || 0
          };
        }
      }

      setLivePrices(prices);
      setLastPriceUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch live prices:', error);
    }
  };

  const activeTrades = trades.filter(t => t.status === 'active');
  const closedTrades = trades.filter(t => t.status === 'closed' || t.status === 'partial');

  // Calculate total unrealized P&L for active trades
  const totalUnrealizedPnL = activeTrades.reduce((sum, trade) => {
    const currentPrice = livePrices[trade.asset]?.price || trade.entry_price;
    const unrealizedPnL = (currentPrice - trade.entry_price) * trade.position_size;
    return sum + unrealizedPnL;
  }, 0);

  // Sprint progress
  const SPRINT_START = new Date('2026-05-04T00:00:00-05:00');
  const SPRINT_END = new Date('2026-05-18T23:59:59-05:00');
  const now = new Date();
  const totalDuration = SPRINT_END.getTime() - SPRINT_START.getTime();
  const elapsed = now.getTime() - SPRINT_START.getTime();
  const daysRemaining = Math.ceil((SPRINT_END.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const sprintProgress = Math.min(100, (elapsed / totalDuration) * 100);

  const readinessChecks = stats ? [
    { name: 'Minimum trades (30+)', pass: stats.total >= 30, value: stats.total, required: 30 },
    { name: 'Win rate (>50%)', pass: stats.winRate > 50, value: `${stats.winRate.toFixed(1)}%`, required: '50%' },
    { name: 'Risk/reward (>2:1)', pass: stats.riskReward > 2, value: `${stats.riskReward.toFixed(2)}:1`, required: '2:1' },
    { name: 'Max drawdown (<20%)', pass: stats.maxDrawdown < 20, value: `${stats.maxDrawdown.toFixed(1)}%`, required: '20%' }
  ] : [];

  const allChecksPass = readinessChecks.every(c => c.pass);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading paper trading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f1a 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white">📊 Paper Trading Dashboard</h1>
            <div className="flex items-center gap-3">
              {lastPriceUpdate && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Prices: {lastPriceUpdate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              )}
              <div className="text-sm text-slate-400">
                Updated: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          {/* Sprint Progress Bar */}
          <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-cyan-400">🚀 15-Day Sprint Progress</span>
              <span className="text-sm text-slate-400">{daysRemaining} days remaining (ends May 18)</span>
            </div>
            <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-500"
                style={{ 
                  width: `${sprintProgress}%`,
                  background: 'linear-gradient(90deg, #6366f1 0%, #22d3ee 100%)'
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Day 1</span>
              <span>Day 5</span>
              <span>Day 10</span>
              <span>Day 15</span>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-slate-400">Win Rate</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-1">{stats.wins}W / {stats.losses}L</div>
            </div>

            <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">Total P&L</span>
              </div>
              <div className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${stats.totalPnL.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stats.totalPnLPct.toFixed(2)}% return</div>
            </div>

            <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-slate-400">Risk/Reward</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.riskReward.toFixed(2)}:1</div>
              <div className="text-xs text-slate-500 mt-1">
                Avg Win: ${stats.avgWin.toFixed(2)} | Avg Loss: ${stats.avgLoss.toFixed(2)}
              </div>
            </div>

            <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Total Trades</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-slate-500 mt-1">Max DD: {stats.maxDrawdown.toFixed(1)}%</div>
            </div>

            <div className="p-6 rounded-xl" style={{ 
              background: totalUnrealizedPnL >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
              border: `1px solid ${totalUnrealizedPnL >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` 
            }}>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className={`w-5 h-5 ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className="text-sm text-slate-400">Unrealized P&L</span>
              </div>
              <div className={`text-3xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${totalUnrealizedPnL.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{activeTrades.length} open position{activeTrades.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        )}

        {/* Readiness Check */}
        <div className={`p-6 rounded-xl ${allChecksPass ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`} style={{ border: '1px solid' }}>
          <div className="flex items-start gap-3 mb-4">
            {allChecksPass ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-400 mt-1" />
            )}
            <div>
              <h2 className={`text-xl font-bold ${allChecksPass ? 'text-emerald-400' : 'text-orange-400'} mb-1`}>
                {allChecksPass ? '🎉 Ready for Real Money!' : '⏳ Keep Paper Trading'}
              </h2>
              <p className="text-sm text-slate-400">
                {allChecksPass 
                  ? 'All checks passed. Start with $100-500 (1-2% of portfolio)' 
                  : 'Fix failing checks before deploying real capital'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readinessChecks.map((check, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40">
                <div className="flex items-center gap-3">
                  {check.pass ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-sm text-slate-300">{check.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${check.pass ? 'text-emerald-400' : 'text-red-400'}`}>
                    {check.value}
                  </span>
                  <span className="text-xs text-slate-500">/ {check.required}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conviction Score Breakdown */}
        {stats && Object.keys(stats.convictionBreakdown).length > 0 && (
          <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-xl font-bold text-white mb-4">🎯 Conviction Score Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.convictionBreakdown)
                .sort(([a], [b]) => {
                  const order = ['A+', 'A', 'A-', 'B+', 'B', 'C'];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([conv, data]) => (
                  <div key={conv} className="p-4 rounded-lg bg-slate-900/40 text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">{conv}</div>
                    <div className="text-sm text-slate-400 mb-2">{data.count} trades</div>
                    <div className={`text-lg font-semibold ${data.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {data.winRate.toFixed(0)}%
                    </div>
                    <div className={`text-xs ${data.avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${data.avgPnL.toFixed(2)} avg
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Active Trades */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold text-white mb-4">⏳ Active Positions ({activeTrades.length})</h2>
          {activeTrades.length > 0 ? (
            <div className="space-y-3">
              {activeTrades.map(trade => {
                const livePrice = livePrices[trade.asset]?.price || trade.entry_price;
                const unrealizedPnL = (livePrice - trade.entry_price) * trade.position_size;
                const unrealizedPnLPct = ((livePrice - trade.entry_price) / trade.entry_price) * 100;
                const isWinning = unrealizedPnL >= 0;
                const distanceToStop = ((livePrice - trade.stop_loss) / trade.entry_price) * 100;
                const distanceToTarget = ((trade.target_1 - livePrice) / trade.entry_price) * 100;
                
                return (
                  <div 
                    key={trade.id} 
                    className="p-4 rounded-lg border transition-all"
                    style={{
                      background: isWinning ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                      borderColor: isWinning ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-lg font-bold text-white">{trade.signal}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>{trade.asset}</span>
                          <span>·</span>
                          <span>Entered {new Date(trade.created_at).toLocaleDateString()}</span>
                          {livePrices[trade.asset] && (
                            <>
                              <span>·</span>
                              <span className={livePrices[trade.asset].change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {livePrices[trade.asset].change24h >= 0 ? '+' : ''}{livePrices[trade.asset].change24h.toFixed(2)}% (24h)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        trade.conviction.startsWith('A') ? 'bg-emerald-500/20 text-emerald-400' :
                        trade.conviction.startsWith('B') ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {trade.conviction}
                      </div>
                    </div>
                    
                    {/* Live P&L Banner */}
                    <div 
                      className="mb-3 p-3 rounded-lg flex items-center justify-between"
                      style={{ background: 'rgba(0,0,0,0.3)' }}
                    >
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Unrealized P&L</div>
                        <div className={`text-2xl font-bold ${isWinning ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isWinning ? '+' : ''}${unrealizedPnL.toFixed(2)}
                          <span className="text-lg ml-2">({unrealizedPnLPct >= 0 ? '+' : ''}{unrealizedPnLPct.toFixed(2)}%)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-1">Current Price</div>
                        <div className="text-xl font-bold text-white">${livePrice.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-slate-500">Entry</div>
                        <div className="text-white font-semibold">${trade.entry_price.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Position</div>
                        <div className="text-white font-semibold">${trade.position_value.toLocaleString()} ({trade.position_pct}%)</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Stop Loss</div>
                        <div className="text-red-400 font-semibold">
                          ${trade.stop_loss.toLocaleString()}
                          <span className="text-xs ml-1">({distanceToStop.toFixed(1)}% away)</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Target 1</div>
                        <div className="text-emerald-400 font-semibold">
                          ${trade.target_1.toLocaleString()}
                          <span className="text-xs ml-1">({distanceToTarget.toFixed(1)}% away)</span>
                        </div>
                      </div>
                    </div>
                    
                    {(trade.target_2 || trade.target_3) && (
                      <div className="text-xs text-slate-500 mb-3">
                        Additional targets: 
                        {trade.target_2 && ` T2: $${trade.target_2.toLocaleString()}`}
                        {trade.target_3 && ` T3: $${trade.target_3.toLocaleString()}`}
                      </div>
                    )}
                    
                    {trade.notes && (
                      <div className="pt-3 border-t border-slate-800/50 text-sm text-slate-400">
                        {trade.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">No active positions</div>
          )}
        </div>

        {/* Trade History */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(12,12,20,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold text-white mb-4">📜 Trade History ({closedTrades.length})</h2>
          {closedTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-800">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Signal</th>
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Conv.</th>
                    <th className="pb-3 text-right">Entry</th>
                    <th className="pb-3 text-right">Exit</th>
                    <th className="pb-3 text-right">P&L</th>
                    <th className="pb-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(trade => (
                      <tr key={trade.id} className="border-b border-slate-800/50">
                        <td className="py-3 text-slate-400">{new Date(trade.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-white">{trade.signal}</td>
                        <td className="py-3 text-slate-400">{trade.asset}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.conviction.startsWith('A') ? 'bg-emerald-500/20 text-emerald-400' :
                            trade.conviction.startsWith('B') ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {trade.conviction}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-400">${trade.entry_price.toLocaleString()}</td>
                        <td className="py-3 text-right text-slate-400">${trade.exit_price?.toLocaleString() || '-'}</td>
                        <td className={`py-3 text-right font-semibold ${(trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ${trade.pnl?.toFixed(2) || '0.00'}
                        </td>
                        <td className={`py-3 text-right font-semibold ${(trade.pnl_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.pnl_pct?.toFixed(1) || '0.0'}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">No closed trades yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
