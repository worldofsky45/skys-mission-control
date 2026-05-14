import { mkdir, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("paper trading API routes", () => {
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

  it("returns trade stats from the active paper trading JSONL file", async () => {
    const { paperDir } = await createPaperTradingFixture();
    process.env.PAPER_TRADING_PATH = paperDir;

    const { GET } = await import("./trades/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toMatchObject({
      total: 3,
      active: 1,
      closed: 2,
      winning: 1,
      losing: 1,
      win_rate: 50,
      avg_win: 60,
      avg_loss: -40,
      risk_reward: 1.5,
      largest_win: 60,
      largest_loss: -40,
    });
    expect(body.trades[0].id).toBe("active-btc");
  });

  it("returns active positions with live current prices", async () => {
    const { paperDir, priceCache } = await createPaperTradingFixture();
    process.env.PAPER_TRADING_PATH = paperDir;
    process.env.PRICE_CACHE_PATH = priceCache;
    global.fetch = vi.fn().mockResolvedValue(
      Response.json({
        bitcoin: { usd: 110 },
      }),
    );

    const { GET } = await import("./positions/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.positions).toHaveLength(1);
    expect(body.positions[0]).toMatchObject({
      asset: "BTC",
      current_price: 110,
      unrealized_pnl: 20,
      pnl_pct: 10,
      is_winning: true,
    });
    expect(body.total_unrealized_pnl).toBe(20);
  });

  it("normalizes OpenClaw exit and partial event rows into live dashboard data", async () => {
    const { paperDir, priceCache } = await createPaperTradingFixture({
      includeOpenClawEvents: true,
    });
    process.env.PAPER_TRADING_PATH = paperDir;
    process.env.PRICE_CACHE_PATH = priceCache;
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const tradesRoute = await import("./trades/route");
    const positionsRoute = await import("./positions/route");
    const balanceRoute = await import("./balance/route");

    const tradesResponse = await tradesRoute.GET();
    const positionsResponse = await positionsRoute.GET();
    const balanceResponse = await balanceRoute.GET();
    const tradesBody = await tradesResponse.json();
    const positionsBody = await positionsResponse.json();
    const balanceBody = await balanceResponse.json();

    expect(tradesResponse.status).toBe(200);
    expect(positionsResponse.status).toBe(200);
    expect(balanceResponse.status).toBe(200);
    expect(tradesBody.stats).toMatchObject({
      total: 3,
      active: 2,
      closed: 1,
      winning: 1,
    });
    expect(positionsBody.positions.map((position: { asset: string }) => position.asset)).toEqual([
      "TON",
      "BTC",
    ]);
    expect(positionsBody.positions.find((position: { asset: string }) => position.asset === "TON")).toMatchObject({
      quantity: 75,
      entry_value: 150,
      current_value: 225,
      unrealized_pnl: 75,
    });
    expect(balanceBody.balance).toMatchObject({
      realized_pnl: 60,
      unrealized_pnl: 95,
      total_pnl: 155,
      current_balance: 10155,
    });
  });

  it("returns balance using cached prices when CoinGecko fails", async () => {
    const { paperDir, priceCache } = await createPaperTradingFixture();
    process.env.PAPER_TRADING_PATH = paperDir;
    process.env.PRICE_CACHE_PATH = priceCache;
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const { GET } = await import("./balance/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.balance).toMatchObject({
      starting_balance: 10000,
      realized_pnl: 20,
      unrealized_pnl: 20,
      total_pnl: 40,
      current_balance: 10040,
    });
    expect(body.price_source).toBe("cache");
  });

  it("does not mark paper balance stale when trades updated within the last day", async () => {
    const { paperDir, priceCache, tradesPath } = await createPaperTradingFixture();
    process.env.PAPER_TRADING_PATH = paperDir;
    process.env.PRICE_CACHE_PATH = priceCache;
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    await utimes(tradesPath, sixHoursAgo, sixHoursAgo);

    const { GET } = await import("./balance/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.is_stale).toBe(false);
  });

  it("returns 503 when the active paper trading file is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-paper-"));
    process.env.PAPER_TRADING_PATH = dir;

    const { GET } = await import("./trades/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("not initialized");
  });
});

async function createPaperTradingFixture(options: { includeOpenClawEvents?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), "mission-control-paper-"));
  const paperDir = join(root, "paper-trading");
  const cacheDir = join(root, "cache");
  const priceCache = join(cacheDir, "prices-cache.json");

  await mkdir(paperDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });
  const trades = [
      JSON.stringify({
        id: "closed-win",
        date: "2026-05-05",
        signal: "BTC Closed Win",
        asset: "BTC",
        entry_price: 100,
        position_size: 2,
        position_value: 200,
        status: "closed",
        exit_price: 130,
        pnl: 60,
        pnl_pct: 30,
        created_at: "2026-05-05T12:00:00.000Z",
      }),
      JSON.stringify({
        id: "closed-loss",
        date: "2026-05-05",
        signal: "BTC Closed Loss",
        asset: "BTC",
        entry_price: 100,
        position_size: 2,
        position_value: 200,
        status: "closed",
        exit_price: 80,
        pnl: -40,
        pnl_pct: -20,
        created_at: "2026-05-05T13:00:00.000Z",
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
        pnl_pct: null,
        created_at: "2026-05-06T12:00:00.000Z",
      }),
  ];

  if (options.includeOpenClawEvents) {
    trades.length = 0;
    trades.push(
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
        pnl_pct: null,
        created_at: "2026-05-06T12:00:00.000Z",
      }),
      JSON.stringify({
        id: "zec-active-original",
        date: "2026-05-06",
        signal: "ZEC Privacy Rally",
        asset: "ZEC",
        entry_price: 100,
        position_size: 2,
        position_value: 200,
        status: "active",
        pnl: null,
        pnl_pct: null,
        created_at: "2026-05-06T12:00:00.000Z",
      }),
      JSON.stringify({
        id: "ton-active-original",
        date: "2026-05-06",
        signal: "TON Validator Announcement",
        asset: "TON",
        entry_price: 2,
        position_size: 100,
        position_value: 200,
        status: "active",
        pnl: null,
        pnl_pct: null,
        created_at: "2026-05-06T12:00:00.000Z",
      }),
      JSON.stringify({
        id: "zec-active-original-exit",
        date: "2026-05-07",
        signal: "ZEC Privacy Rally",
        asset: "ZEC",
        action: "stop_loss_exit",
        entry_price: 100,
        exit_price: 130,
        position_size: 2,
        position_value: 200,
        exit_value: 260,
        pnl: 60,
        pnl_pct: 30,
        status: "closed",
        outcome: "win_technical",
        closed_at: "2026-05-07T17:00:00.000Z",
      }),
      JSON.stringify({
        id: "ton-active-original-partial",
        date: "2026-05-07",
        signal: "TON Validator Announcement",
        asset: "TON",
        action: "partial_exit_t1",
        entry_price: 2,
        current_price: 3,
        position_size: 100,
        partial_exit_size: 25,
        partial_exit_value: 75,
        remaining_size: 75,
        pnl_on_partial: 25,
        status: "active_partial",
        updated_at: "2026-05-07T17:00:00.000Z",
      }),
    );
  }

  const tradesPath = join(paperDir, "trades.jsonl");
  await writeFile(
    tradesPath,
    trades.join("\n") + "\n",
  );
  await writeFile(
    priceCache,
    JSON.stringify({
      prices: {
        BTC: 110,
        TON: 3,
      },
      updated_at: "2026-05-06T12:00:00.000Z",
    }),
  );

  return { paperDir, priceCache, tradesPath };
}
