import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityFeed } from "./ActivityFeed";
import type { ActivityEventRecord } from "@/lib/types";

const events: ActivityEventRecord[] = [
  {
    type: "signal",
    system: "crypto-intel",
    title: "BTC breakout watch",
    summary: "Momentum improving into daily close.",
    timestamp: "2026-05-08T20:20:00.000Z",
    received_at: "2026-05-08T20:30:00.000Z",
    signals: [{ asset: "BTC", action: "watch", conviction: "medium", target: 69000 }],
  },
  {
    type: "alert",
    system: "polymarket-intel",
    title: "Market edge moved",
    summary: "Odds moved outside target range.",
    timestamp: "2026-05-08T19:00:00.000Z",
    received_at: "2026-05-08T19:00:10.000Z",
    opportunities: [{ market: "Fed cut by June", odds: "42%", conviction: "high", edge: "+8%" }],
  },
];

describe("ActivityFeed", () => {
  it("renders recent events and expands structured signal details", () => {
    render(<ActivityFeed events={events} loading={false} />);

    expect(screen.getByRole("heading", { name: "Activity Feed" })).toBeInTheDocument();
    expect(screen.getByText("BTC breakout watch")).toBeInTheDocument();
    expect(screen.getByText("crypto-intel")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show details for btc breakout watch/i }));

    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("watch")).toBeInTheDocument();
    expect(screen.getByText("69,000")).toBeInTheDocument();
  });
});
