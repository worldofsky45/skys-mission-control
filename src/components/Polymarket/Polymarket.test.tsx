import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { ArbitrageMonitor } from "./ArbitrageMonitor";
import { SignalsList } from "./SignalsList";
import type { ArbitrageMonitorResponse, EnrichedPolymarketSignal, PolymarketStats } from "@/lib/types";

const signal: EnrichedPolymarketSignal = {
  id: "signal-1",
  market: "Will BTC close above 100k?",
  prediction: "Yes",
  confidence: 72,
  entry_odds: 0.52,
  current_odds: 0.61,
  odds_source: "file",
  potential_pnl: 92.31,
  position_size: 100,
  status: "active",
  resolved: false,
  won: null,
  pnl: 0,
};

const stats: PolymarketStats = {
  active: 1,
  resolved: 0,
  won: 0,
  lost: 0,
  accuracy: 0,
  total_pnl: 0,
};

const arbitrage: ArbitrageMonitorResponse = {
  timestamp: "2026-05-14T21:30:52.569Z",
  version: "2.0",
  total_matches: 3,
  profitable_count: 1,
  min_profit_threshold: 1,
  status: "opportunities",
  message: "1 opportunity above the 1% threshold",
  opportunities: [
    {
      kalshi_market: {
        id: "kalshi-trump",
        title: "Will Trump win 2028?",
        price: 0.65,
        volume_24h: 145000,
        url: "https://kalshi.com/markets/trump",
      },
      polymarket_market: {
        id: "poly-trump",
        title: "Trump wins 2028 presidential election",
        price: 0.62,
        volume_24h: 2500000,
        url: "https://polymarket.com/event/trump",
      },
      similarity_score: 0.85,
      match_method: "combined",
      validation: {
        entities: { match: true, score: 0.8, common: ["trump", "2028"] },
        dates: { match: true, year: "2028" },
      },
      arbitrage: {
        profit_pct: 3.25,
        strategy: "buy_polymarket_sell_kalshi",
        kalshi_price: 0.65,
        polymarket_price: 0.62,
        spread: 0.03,
        net_profit: 0.0325,
      },
    },
  ],
};

describe("Polymarket components", () => {
  it("renders active signal details", () => {
    render(<SignalsList signals={[signal]} onResolved={vi.fn()} />);

    expect(screen.getByText("Will BTC close above 100k?")).toBeInTheDocument();
    expect(screen.getByText("72% confidence")).toBeInTheDocument();
    expect(screen.getByText("$92.31")).toBeInTheDocument();
  });

  it("submits manual resolution", async () => {
    const onResolved = vi.fn().mockResolvedValue(undefined);
    render(<SignalsList signals={[signal]} onResolved={onResolved} />);

    fireEvent.click(screen.getByRole("button", { name: /resolve signal-1/i }));
    fireEvent.change(screen.getByLabelText(/actual odds/i), { target: { value: "0.68" } });
    fireEvent.click(screen.getByRole("button", { name: /mark won/i }));

    await waitFor(() =>
      expect(onResolved).toHaveBeenCalledWith({
        signal_id: "signal-1",
        outcome: "won",
        actual_odds: 0.68,
      }),
    );
  });

  it("renders awaiting state when no signals are resolved", () => {
    render(<PerformanceMetrics stats={stats} signals={[signal]} />);

    expect(screen.getByText("Awaiting resolved signals")).toBeInTheDocument();
  });

  it("renders resolved metrics and best market", () => {
    render(
      <PerformanceMetrics
        stats={{ active: 0, resolved: 2, won: 1, lost: 1, accuracy: 50, total_pnl: 25 }}
        signals={[
          { ...signal, id: "won", resolved: true, won: true, pnl: 40, market: "Best market" },
          { ...signal, id: "lost", resolved: true, won: false, pnl: -15, market: "Worst market" },
        ]}
      />,
    );

    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getByText("Best market")).toBeInTheDocument();
    expect(screen.getByText("Worst market")).toBeInTheDocument();
  });

  it("renders arbitrage monitor opportunities", () => {
    render(<ArbitrageMonitor data={arbitrage} />);

    expect(screen.getByText("Arbitrage Monitor")).toBeInTheDocument();
    expect(screen.getByText("1 opportunity")).toBeInTheDocument();
    expect(screen.getByText("Will Trump win 2028?")).toBeInTheDocument();
    expect(screen.getByText("Buy Polymarket, sell Kalshi")).toBeInTheDocument();
    expect(screen.getByText("3.25%")).toBeInTheDocument();
  });
});
