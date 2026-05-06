import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

function calculateStats(trades: Trade[]) {
  const closedTrades = trades.filter(t => t.status === 'closed' || t.status === 'partial');
  
  if (closedTrades.length === 0) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      riskReward: 0,
      totalPnL: 0,
      totalPnLPct: 0,
      maxDrawdown: 0,
      convictionBreakdown: {}
    };
  }
  
  const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length) : 0;
  
  // Calculate drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;
  
  closedTrades.forEach(t => {
    cumulative += (t.pnl || 0);
    if (cumulative > peak) peak = cumulative;
    const drawdown = ((peak - cumulative) / 10000) * 100; // Assuming $10K portfolio
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  // Conviction breakdown
  const convictionBreakdown: Record<string, { count: number; winRate: number; avgPnL: number }> = {};
  
  ['A+', 'A', 'A-', 'B+', 'B', 'C'].forEach(conv => {
    const convTrades = closedTrades.filter(t => t.conviction === conv);
    if (convTrades.length > 0) {
      const convWins = convTrades.filter(t => (t.pnl || 0) > 0).length;
      convictionBreakdown[conv] = {
        count: convTrades.length,
        winRate: (convWins / convTrades.length) * 100,
        avgPnL: convTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / convTrades.length
      };
    }
  });
  
  return {
    total: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: (wins.length / closedTrades.length) * 100,
    avgWin,
    avgLoss,
    riskReward: avgLoss > 0 ? avgWin / avgLoss : 0,
    totalPnL,
    totalPnLPct: (totalPnL / 10000) * 100,
    maxDrawdown,
    convictionBreakdown
  };
}

export async function GET() {
  try {
    const workspacePath = process.env.HOME + '/.openclaw/workspace';
    const tradesFile = join(workspacePath, 'crypto-intel/paper-trading/trades.jsonl');

    let trades: Trade[] = [];

    if (existsSync(tradesFile)) {
      const lines = readFileSync(tradesFile, 'utf-8')
        .split('\n')
        .filter(line => line.trim());
      
      trades = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean) as Trade[];
    }

    const stats = calculateStats(trades);

    return NextResponse.json({
      trades,
      stats
    });
  } catch (error) {
    console.error('Error fetching paper trading data:', error);
    return NextResponse.json({
      trades: [],
      stats: null
    });
  }
}
