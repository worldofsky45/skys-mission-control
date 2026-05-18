import type { AggregatedROI, EquityPoint, PaperTrade, PositionSide, ROIEntry } from "./types";

export interface ROIResult {
  amount: number;
  percentage: number;
}

export interface DrawdownResult {
  max_drawdown: number;
  max_drawdown_pct: number;
}

export interface ConfidenceBucket {
  total: number;
  correct: number;
  accuracy: number;
}

export interface ConfidenceAccuracyResult {
  avg_confidence: number;
  accuracy_by_confidence: Record<string, ConfidenceBucket>;
}

export interface ConfidenceSignal {
  confidence?: number;
  status?: string;
  correct?: boolean;
}

export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  side: PositionSide = "long",
): number {
  return side === "short"
    ? roundCurrency((entryPrice - exitPrice) * quantity)
    : roundCurrency((exitPrice - entryPrice) * quantity);
}

export function calculateUnrealizedPnL(
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  side: PositionSide = "long",
): number {
  return calculatePnL(entryPrice, currentPrice, quantity, side);
}

export function calculateWinRate(trades: PaperTrade[]): number {
  if (trades.length === 0) {
    return 0;
  }

  const wins = trades.filter((trade) => (trade.pnl ?? 0) > 0).length;
  return (wins / trades.length) * 100;
}

export function calculateRiskReward(winningTrades: PaperTrade[], losingTrades: PaperTrade[]): number {
  if (winningTrades.length === 0 || losingTrades.length === 0) {
    return 0;
  }

  const avgWin =
    winningTrades.reduce((sum, trade) => sum + Math.max(trade.pnl ?? 0, 0), 0) /
    winningTrades.length;
  const avgLoss =
    Math.abs(losingTrades.reduce((sum, trade) => sum + Math.min(trade.pnl ?? 0, 0), 0)) /
    losingTrades.length;

  return avgLoss === 0 ? 0 : avgWin / avgLoss;
}

export function calculateROI(invested: number, currentValue: number): ROIResult {
  const amount = currentValue - invested;
  return {
    amount,
    percentage: invested === 0 ? 0 : (amount / invested) * 100,
  };
}

export function calculateDrawdown(equityCurve: EquityPoint[]): DrawdownResult {
  let peak = equityCurve[0]?.value ?? 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  for (const point of equityCurve) {
    peak = Math.max(peak, point.value);
    const drawdown = peak - point.value;
    const drawdownPct = peak === 0 ? 0 : (drawdown / peak) * 100;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPct = drawdownPct;
    }
  }

  return {
    max_drawdown: maxDrawdown,
    max_drawdown_pct: maxDrawdownPct,
  };
}

export function calculateSharpeRatio(returns: number[], riskFreeRate = 0): number {
  if (returns.length < 2) {
    return 0;
  }

  const excessReturns = returns.map((value) => value - riskFreeRate);
  const mean = excessReturns.reduce((sum, value) => sum + value, 0) / excessReturns.length;
  const variance =
    excessReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (excessReturns.length - 1);
  const standardDeviation = Math.sqrt(variance);

  return standardDeviation === 0 ? 0 : mean / standardDeviation;
}

export function aggregateROI(projects: ROIEntry[]): AggregatedROI {
  const totalInvested = projects.reduce((sum, project) => sum + project.invested, 0);
  const totalROI = projects.reduce((sum, project) => sum + project.roi, 0);

  return {
    total_invested: totalInvested,
    total_roi: totalROI,
    roi_percentage: totalInvested === 0 ? 0 : (totalROI / totalInvested) * 100,
    projects: projects.map((project) => ({
      ...project,
      current_value: project.invested + project.roi,
      roi_pct: project.invested === 0 ? 0 : (project.roi / project.invested) * 100,
      last_updated: project.timestamp,
    })),
  };
}

export function calculateConfidenceAccuracy(
  signals: ConfidenceSignal[],
): ConfidenceAccuracyResult {
  const resolved = signals.filter(
    (signal) => signal.status === "resolved" && typeof signal.confidence === "number",
  );
  const buckets = createConfidenceBuckets();

  for (const signal of resolved) {
    const bucketName = getConfidenceBucket(signal.confidence ?? 0);
    const bucket = buckets[bucketName];

    bucket.total += 1;
    if (signal.correct === true) {
      bucket.correct += 1;
    }
    bucket.accuracy = bucket.total === 0 ? 0 : (bucket.correct / bucket.total) * 100;
  }

  return {
    avg_confidence:
      resolved.length === 0
        ? 0
        : resolved.reduce((sum, signal) => sum + (signal.confidence ?? 0), 0) / resolved.length,
    accuracy_by_confidence: buckets,
  };
}

export function calculatePositionSize(
  balance: number,
  riskPct: number,
  stopLossPct: number,
): number {
  if (stopLossPct <= 0) {
    return 0;
  }

  return (balance * (riskPct / 100)) / (stopLossPct / 100);
}

function createConfidenceBuckets(): Record<string, ConfidenceBucket> {
  return {
    "0-49": { total: 0, correct: 0, accuracy: 0 },
    "50-69": { total: 0, correct: 0, accuracy: 0 },
    "70-84": { total: 0, correct: 0, accuracy: 0 },
    "85-100": { total: 0, correct: 0, accuracy: 0 },
  };
}

function getConfidenceBucket(confidence: number): string {
  if (confidence < 50) {
    return "0-49";
  }

  if (confidence < 70) {
    return "50-69";
  }

  if (confidence < 85) {
    return "70-84";
  }

  return "85-100";
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
