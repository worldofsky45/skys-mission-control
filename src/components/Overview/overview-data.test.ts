import { describe, expect, it } from "vitest";
import type { EquityPoint, PaperTrade } from "@/lib/types";
import {
  clampPercent,
  getActiveAssetBadges,
  getAssetAllocation,
  getSparklinePoints,
} from "./overview-data";

function makeTrade(overrides: Partial<PaperTrade>): PaperTrade {
  return {
    id: overrides.id ?? "trade-1",
    date: "2026-05-01",
    signal: "Breakout",
    asset: "BTC",
    entry_price: 100,
    position_size: 1,
    position_value: 100,
    status: "active",
    created_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("overview data helpers", () => {
  it("uses the most recent equity points for sparklines", () => {
    const points: EquityPoint[] = Array.from({ length: 9 }, (_, index) => ({
      timestamp: `2026-05-0${index + 1}T00:00:00.000Z`,
      value: 10_000 + index * 100,
    }));

    expect(getSparklinePoints(points)).toEqual([
      { timestamp: "2026-05-03T00:00:00.000Z", label: "May 3", value: 10200 },
      { timestamp: "2026-05-04T00:00:00.000Z", label: "May 4", value: 10300 },
      { timestamp: "2026-05-05T00:00:00.000Z", label: "May 5", value: 10400 },
      { timestamp: "2026-05-06T00:00:00.000Z", label: "May 6", value: 10500 },
      { timestamp: "2026-05-07T00:00:00.000Z", label: "May 7", value: 10600 },
      { timestamp: "2026-05-08T00:00:00.000Z", label: "May 8", value: 10700 },
      { timestamp: "2026-05-09T00:00:00.000Z", label: "May 9", value: 10800 },
    ]);
  });

  it("groups active trades into sorted allocation rows", () => {
    const allocation = getAssetAllocation([
      makeTrade({ id: "btc-1", asset: "btc", position_value: 100 }),
      makeTrade({ id: "eth-1", asset: "ETH", position_value: 300 }),
      makeTrade({ id: "ton-partial", asset: "TON", position_value: 150, status: "active_partial" }),
      makeTrade({ id: "btc-2", asset: "BTC", position_value: 200 }),
      makeTrade({ id: "closed-sol", asset: "SOL", position_value: 900, status: "closed" }),
    ]);

    expect(allocation.totalDeployed).toBe(750);
    expect(allocation.rows.map(({ asset, value, share }) => ({ asset, value, share }))).toEqual([
      { asset: "BTC", value: 300, share: 40 },
      { asset: "ETH", value: 300, share: 40 },
      { asset: "TON", value: 150, share: 20 },
    ]);
  });

  it("returns unique active asset badges in newest order", () => {
    expect(
      getActiveAssetBadges([
        makeTrade({ id: "old-btc", asset: "BTC", created_at: "2026-05-01T00:00:00.000Z" }),
        makeTrade({ id: "closed-eth", asset: "ETH", status: "closed", created_at: "2026-05-07T00:00:00.000Z" }),
        makeTrade({ id: "new-sol", asset: "SOL", created_at: "2026-05-08T00:00:00.000Z" }),
        makeTrade({ id: "partial-ton", asset: "TON", status: "active_partial", created_at: "2026-05-08T12:00:00.000Z" }),
        makeTrade({ id: "new-btc", asset: "BTC", created_at: "2026-05-09T00:00:00.000Z" }),
      ]),
    ).toEqual(["BTC", "TON", "SOL"]);
  });

  it("clamps percentages to chart-safe bounds", () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(42.42)).toBe(42.42);
    expect(clampPercent(120)).toBe(100);
  });
});
