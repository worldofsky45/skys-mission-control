import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Polymarket API routes", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("lists signals with resolved outcome stats", async () => {
    const paths = await createPolymarketFixture();
    setPolymarketEnv(paths);

    const { GET } = await import("./signals/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toMatchObject({
      active: 1,
      resolved: 1,
      won: 1,
      lost: 0,
      accuracy: 100,
      total_pnl: 50,
    });
    expect(body.signals.find((signal: { id: string }) => signal.id === "signal-active")).toMatchObject({
      current_odds: null,
      odds_source: "not_available",
      resolved: false,
    });
  });

  it("resolves a signal and appends outcome, scorecard, and ROI records", async () => {
    const paths = await createPolymarketFixture();
    setPolymarketEnv(paths);

    const { POST } = await import("./outcomes/route");
    const response = await POST(
      new Request("http://localhost/api/polymarket/outcomes", {
        method: "POST",
        body: JSON.stringify({
          signal_id: "signal-active",
          outcome: "won",
          actual_odds: 0.75,
          settled_date: "2026-05-06T12:00:00.000Z",
        }),
      }),
    );
    const body = await response.json();
    const trades = (await readFile(paths.tradesPath, "utf8")).trim().split("\n");
    const scorecard = (await readFile(paths.scorecardPath, "utf8")).trim().split("\n");
    const roi = (await readFile(paths.roiPath, "utf8")).trim().split("\n");

    expect(response.status).toBe(200);
    expect(body.outcome).toMatchObject({
      signal_id: "signal-active",
      actual_outcome: "won",
      pnl: 50,
      roi: 50,
    });
    expect(JSON.parse(trades.at(-1) ?? "{}")).toMatchObject({ signal_id: "signal-active" });
    expect(JSON.parse(scorecard.at(-1) ?? "{}")).toMatchObject({
      type: "outcome",
      signal_id: "signal-active",
    });
    expect(JSON.parse(roi.at(-1) ?? "{}")).toMatchObject({
      name: "Polymarket Signals",
      roi: 50,
    });
  });

  it("rejects missing, duplicate, and invalid outcome requests", async () => {
    const paths = await createPolymarketFixture();
    setPolymarketEnv(paths);

    const { POST } = await import("./outcomes/route");
    const missing = await POST(
      new Request("http://localhost/api/polymarket/outcomes", {
        method: "POST",
        body: JSON.stringify({ signal_id: "missing", outcome: "won", actual_odds: 0.7 }),
      }),
    );
    const duplicate = await POST(
      new Request("http://localhost/api/polymarket/outcomes", {
        method: "POST",
        body: JSON.stringify({ signal_id: "signal-resolved", outcome: "won", actual_odds: 0.7 }),
      }),
    );
    const invalid = await POST(
      new Request("http://localhost/api/polymarket/outcomes", {
        method: "POST",
        body: JSON.stringify({ signal_id: "signal-active", outcome: "won", actual_odds: 2 }),
      }),
    );

    expect(missing.status).toBe(404);
    expect(duplicate.status).toBe(400);
    expect(invalid.status).toBe(400);
  });

  it("returns current arbitrage monitor data from the OpenClaw cache", async () => {
    const paths = await createPolymarketFixture();
    setPolymarketEnv(paths);

    const { GET } = await import("./arbitrage/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "opportunities",
      profitable_count: 1,
      total_matches: 3,
      min_profit_threshold: 1,
    });
    expect(body.opportunities[0]).toMatchObject({
      kalshi_market: {
        title: "Will Trump win 2028?",
        url: "https://kalshi.com/markets/trump",
      },
      polymarket_market: {
        title: "Trump wins 2028 presidential election",
      },
      arbitrage: {
        profit_pct: 3.25,
        strategy: "buy_polymarket_sell_kalshi",
      },
    });
  });
});

async function createPolymarketFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-poly-"));
  const signalsPath = join(dir, "polymarket-signals.jsonl");
  const tradesPath = join(dir, "trades.jsonl");
  const scorecardPath = join(dir, "scorecard.jsonl");
  const roiPath = join(dir, "roi-tracker.jsonl");
  const arbitragePath = join(dir, "arbitrage-opportunities.json");

  await writeFile(
    signalsPath,
    [
      JSON.stringify({
        id: "signal-active",
        timestamp: "2026-05-06T09:58:00-05:00",
        market: "BTC reaches 100k",
        prediction: "YES",
        confidence: 75,
        entry_odds: 0.6666666667,
        position_size: 100,
        status: "active",
      }),
      JSON.stringify({
        id: "signal-resolved",
        timestamp: "2026-05-05T09:58:00-05:00",
        market: "ETH reaches 5k",
        prediction: "YES",
        confidence: 80,
        entry_odds: 0.6,
        position_size: 100,
        status: "resolved",
      }),
    ].join("\n") + "\n",
  );
  await writeFile(
    tradesPath,
    JSON.stringify({
      signal_id: "signal-resolved",
      market: "ETH reaches 5k",
      resolved: true,
      won: true,
      actual_outcome: "won",
      actual_odds: 0.8,
      pnl: 50,
      roi: 50,
      resolved_date: "2026-05-06T00:00:00.000Z",
    }) + "\n",
  );
  await writeFile(scorecardPath, "");
  await writeFile(roiPath, "");
  await writeFile(
    arbitragePath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      version: "2.0",
      total_matches: 3,
      profitable_count: 1,
      min_profit_threshold: 1,
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
    }),
  );

  return { signalsPath, tradesPath, scorecardPath, roiPath, arbitragePath };
}

function setPolymarketEnv(paths: {
  signalsPath: string;
  tradesPath: string;
  scorecardPath: string;
  roiPath: string;
  arbitragePath: string;
}) {
  process.env.POLYMARKET_SIGNALS_PATH = paths.signalsPath;
  process.env.POLYMARKET_TRADES_PATH = paths.tradesPath;
  process.env.POLYMARKET_SCORECARD_PATH = paths.scorecardPath;
  process.env.ROI_TRACKER_PATH = paths.roiPath;
  process.env.POLYMARKET_ARBITRAGE_PATH = paths.arbitragePath;
}
