import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ROI API route", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("aggregates ROI tracker entries with computed paper and Polymarket values", async () => {
    const fixture = await createRoiFixture();
    process.env.ROI_TRACKER_PATH = fixture.roiPath;
    process.env.PAPER_TRADING_PATH = fixture.paperDir;
    process.env.PRICE_CACHE_PATH = fixture.priceCache;
    process.env.POLYMARKET_TRADES_PATH = fixture.polymarketTradesPath;
    global.fetch = vi.fn().mockResolvedValue(Response.json({ bitcoin: { usd: 110 } }));

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total_invested).toBe(11100);
    expect(body.total_roi).toBe(370);
    expect(body.projects.map((project: { name: string }) => project.name)).toEqual([
      "Manual Project",
      "Paper Trading System",
      "Polymarket Signals",
    ]);
  });
});

async function createRoiFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-roi-"));
  const paperDir = join(dir, "paper");
  const cacheDir = join(dir, "cache");
  const roiPath = join(dir, "roi-tracker.jsonl");
  const priceCache = join(cacheDir, "prices-cache.json");
  const polymarketTradesPath = join(dir, "polymarket-trades.jsonl");

  await mkdir(paperDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });
  await writeFile(
    roiPath,
    JSON.stringify({
      timestamp: "2026-05-06T00:00:00.000Z",
      name: "Manual Project",
      invested: 1000,
      roi: 100,
      description: "Manual tracked project",
      status: "active",
    }) + "\n",
  );
  await writeFile(
    join(paperDir, "trades.jsonl"),
    [
      JSON.stringify({
        id: "closed-win",
        date: "2026-05-05",
        signal: "BTC Closed Win",
        asset: "BTC",
        entry_price: 100,
        position_size: 2,
        position_value: 200,
        status: "closed",
        pnl: 60,
        created_at: "2026-05-05T12:00:00.000Z",
      }),
      JSON.stringify({
        id: "active-btc",
        date: "2026-05-06",
        signal: "BTC Active",
        asset: "BTC",
        entry_price: 100,
        position_size: 2,
        position_value: 200,
        status: "active",
        pnl: null,
        created_at: "2026-05-06T12:00:00.000Z",
      }),
    ].join("\n") + "\n",
  );
  await writeFile(priceCache, JSON.stringify({ prices: { BTC: 110 } }));
  await writeFile(
    polymarketTradesPath,
    JSON.stringify({
      signal_id: "poly-1",
      resolved: true,
      won: true,
      position_size: 100,
      pnl: 190,
      roi: 190,
      resolved_date: "2026-05-06T12:00:00.000Z",
    }) + "\n",
  );

  return { paperDir, roiPath, priceCache, polymarketTradesPath };
}
