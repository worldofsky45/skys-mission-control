import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BalanceSummary } from "./BalanceSummary";
import { PositionsTable } from "./PositionsTable";
import { TradeHistory } from "./TradeHistory";
import type { PaperBalance, PaperPosition, PaperTrade } from "@/lib/types";

const balance: PaperBalance = {
  current_balance: 10500,
  starting_balance: 10000,
  total_pnl: 500,
  total_pnl_pct: 5,
  realized_pnl: 300,
  unrealized_pnl: 200,
  peak_balance: 11000,
  max_drawdown: 120,
  equity_curve: [
    { timestamp: "2026-05-01T00:00:00.000Z", value: 10000 },
    { timestamp: "2026-05-06T00:00:00.000Z", value: 10500 },
  ],
  last_updated: "2026-05-06T12:00:00.000Z",
};

const position: PaperPosition = {
  asset: "BTC",
  signal: "Momentum breakout",
  entry_price: 100000,
  current_price: 101000,
  quantity: 0.1,
  entry_value: 10000,
  current_value: 10100,
  unrealized_pnl: 100,
  pnl_pct: 1,
  side: "long",
  entry_date: "2026-05-05T10:00:00.000Z",
  is_winning: true,
};

const closedTrade: PaperTrade = {
  id: "trade-1",
  date: "2026-05-04",
  signal: "Mean reversion",
  asset: "ETH",
  entry_price: 3000,
  position_size: 1,
  position_value: 3000,
  status: "closed",
  outcome: "target",
  exit_price: 3300,
  pnl: 300,
  pnl_pct: 10,
  created_at: "2026-05-04T09:00:00.000Z",
};

describe("PaperTrading components", () => {
  it("renders balance metrics", () => {
    render(<BalanceSummary balance={balance} priceSource="live" />);

    expect(screen.getByText("$10,500.00")).toBeInTheDocument();
    expect(screen.getByText("+$300.00")).toBeInTheDocument();
    expect(screen.getByText("+$200.00")).toBeInTheDocument();
    expect(screen.getByText("$120.00")).toBeInTheDocument();
  });

  it("renders active positions and keeps close action disabled in v1", () => {
    render(<PositionsTable positions={[position]} />);

    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("Momentum breakout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close disabled/i })).toBeDisabled();
  });

  it("renders a real empty state when there are no closed trades", () => {
    render(<TradeHistory trades={[]} />);

    expect(screen.getByText("No closed trades yet")).toBeInTheDocument();
  });

  it("filters closed trades and exports CSV locally", () => {
    const createObjectURL = vi.fn(() => "blob:mission-control");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(<TradeHistory trades={[closedTrade]} />);

    expect(screen.getByText("ETH")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/filter closed trades/i), {
      target: { value: "btc" },
    });
    expect(screen.queryByText("ETH")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter closed trades/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
