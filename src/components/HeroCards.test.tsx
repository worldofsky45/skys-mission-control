import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroCards } from "./HeroCards";

describe("HeroCards", () => {
  it("renders positive P&L and count formatting", () => {
    render(
      <HeroCards
        balance={12543.5}
        totalPnl={2543.5}
        totalPnlPct={20.3}
        activePositionCount={3}
        activeAssets={["BTC", "ETH"]}
        combinedWinRate={67.4}
        equityCurve={[
          { timestamp: "2026-05-01T00:00:00.000Z", value: 10000 },
          { timestamp: "2026-05-02T00:00:00.000Z", value: 12543.5 },
        ]}
      />,
    );

    expect(screen.getByText("$12,543.50")).toBeInTheDocument();
    expect(screen.getByText("+$2,543.50")).toBeInTheDocument();
    expect(screen.getByText("20.30% total return")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("67.4%")).toBeInTheDocument();
  });

  it("renders negative P&L with a loss marker", () => {
    render(
      <HeroCards
        balance={9100}
        totalPnl={-900}
        totalPnlPct={-9}
        activePositionCount={1}
        activeAssets={[]}
        combinedWinRate={33}
        equityCurve={[]}
      />,
    );

    expect(screen.getByText("-$900.00")).toHaveClass("text-red-300");
    expect(screen.getByText("33.0%")).toHaveClass("text-amber-200");
  });

  it("renders loading skeletons", () => {
    render(
      <HeroCards
        balance={0}
        totalPnl={0}
        totalPnlPct={0}
        activePositionCount={0}
        activeAssets={[]}
        combinedWinRate={0}
        equityCurve={[]}
        loading
      />,
    );

    expect(screen.getAllByTestId("hero-card-skeleton")).toHaveLength(4);
  });
});
