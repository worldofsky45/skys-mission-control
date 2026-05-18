import { describe, expect, it } from "vitest";
import {
  aggregateROI,
  calculateConfidenceAccuracy,
  calculateDrawdown,
  calculatePnL,
  calculatePositionSize,
  calculateROI,
  calculateRiskReward,
  calculateSharpeRatio,
  calculateUnrealizedPnL,
  calculateWinRate,
} from "./calculations";
import type { PaperTrade, ROIEntry } from "./types";

const closedWin: PaperTrade = {
  id: "win",
  date: "2026-05-05",
  signal: "BTC",
  asset: "BTC",
  entry_price: 100,
  exit_price: 130,
  position_size: 2,
  position_value: 200,
  status: "closed",
  pnl: 60,
  created_at: "2026-05-05T12:00:00.000Z",
};

const closedLoss: PaperTrade = {
  ...closedWin,
  id: "loss",
  exit_price: 80,
  pnl: -40,
};

describe("calculation engine", () => {
  it("calculates long and short P&L", () => {
    expect(calculatePnL(100, 130, 2, "long")).toBe(60);
    expect(calculatePnL(100, 80, 2, "short")).toBe(40);
  });

  it("calculates unrealized P&L", () => {
    expect(calculateUnrealizedPnL(100, 110, 3, "long")).toBe(30);
    expect(calculateUnrealizedPnL(100, 110, 3, "short")).toBe(-30);
  });

  it("calculates win rate and risk/reward from closed trades", () => {
    expect(calculateWinRate([closedWin, closedLoss])).toBe(50);
    expect(calculateWinRate([])).toBe(0);
    expect(calculateRiskReward([closedWin], [closedLoss])).toBe(1.5);
    expect(calculateRiskReward([closedWin], [])).toBe(0);
  });

  it("calculates ROI and aggregate ROI safely", () => {
    expect(calculateROI(1000, 1250)).toEqual({ amount: 250, percentage: 25 });
    expect(calculateROI(0, 250)).toEqual({ amount: 250, percentage: 0 });

    const entries: ROIEntry[] = [
      {
        timestamp: "2026-05-06T00:00:00.000Z",
        name: "Paper",
        invested: 1000,
        roi: 250,
        status: "active",
      },
      {
        timestamp: "2026-05-06T00:00:00.000Z",
        name: "Polymarket",
        invested: 500,
        roi: -50,
        status: "active",
      },
    ];

    expect(aggregateROI(entries)).toMatchObject({
      total_invested: 1500,
      total_roi: 200,
      roi_percentage: 13.333333333333334,
    });
  });

  it("calculates drawdown and Sharpe ratio", () => {
    expect(
      calculateDrawdown([
        { timestamp: "1", value: 1000 },
        { timestamp: "2", value: 1200 },
        { timestamp: "3", value: 900 },
        { timestamp: "4", value: 1100 },
      ]),
    ).toEqual({ max_drawdown: 300, max_drawdown_pct: 25 });

    expect(calculateSharpeRatio([0.01, 0.02, -0.01, 0.03])).toBeCloseTo(0.7319, 4);
    expect(calculateSharpeRatio([])).toBe(0);
  });

  it("groups confidence accuracy into stable buckets", () => {
    const result = calculateConfidenceAccuracy([
      { confidence: 45, status: "resolved", correct: true },
      { confidence: 65, status: "resolved", correct: false },
      { confidence: 80, status: "resolved", correct: true },
      { confidence: 95, status: "active", correct: false },
    ]);

    expect(result.avg_confidence).toBeCloseTo(63.3333, 4);
    expect(result.accuracy_by_confidence["0-49"]).toEqual({
      total: 1,
      correct: 1,
      accuracy: 100,
    });
    expect(result.accuracy_by_confidence["85-100"]).toEqual({
      total: 0,
      correct: 0,
      accuracy: 0,
    });
  });

  it("calculates position size from balance risk and stop distance", () => {
    expect(calculatePositionSize(10_000, 1, 5)).toBe(2000);
    expect(calculatePositionSize(10_000, 1, 0)).toBe(0);
  });
});
