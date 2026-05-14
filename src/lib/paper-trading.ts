import { stat } from "node:fs/promises";
import { join } from "node:path";
import { paths, refresh } from "./constants";
import { calculateDrawdown, calculateRiskReward, calculateUnrealizedPnL, calculateWinRate } from "./calculations";
import { readJsonFile, readJsonlFile, statFileFreshness } from "./file-store";
import { fetchCurrentPrices } from "./prices";
import { paperTradeSchema } from "./schemas";
import type { PaperBalance, PaperPosition, PaperTrade, PaperTradingStats } from "./types";

export class PaperTradingNotInitializedError extends Error {
  constructor(message = "Paper trading is not initialized") {
    super(message);
    this.name = "PaperTradingNotInitializedError";
  }
}

interface OptionalBalanceFile {
  starting_balance?: number;
  current_balance?: number;
  peak_balance?: number;
  equity_curve?: Array<{ timestamp: string; value: number }>;
}

interface RawPaperTradeEvent {
  id?: unknown;
  date?: unknown;
  signal?: unknown;
  asset?: unknown;
  conviction?: unknown;
  action?: unknown;
  entry_price?: unknown;
  current_price?: unknown;
  position_size?: unknown;
  remaining_size?: unknown;
  position_value?: unknown;
  position_pct?: unknown;
  stop_loss?: unknown;
  target_1?: unknown;
  target_2?: unknown;
  target_3?: unknown;
  status?: unknown;
  outcome?: unknown;
  exit_price?: unknown;
  pnl?: unknown;
  pnl_pct?: unknown;
  notes?: unknown;
  created_at?: unknown;
  closed_at?: unknown;
  updated_at?: unknown;
}

export interface PaperPositionsResult {
  positions: PaperPosition[];
  total_unrealized_pnl: number;
  price_source: "live" | "cache" | "none";
}

export interface PaperBalanceResult {
  balance: PaperBalance;
  is_stale: boolean;
  price_source: "live" | "cache" | "none";
}

export async function loadPaperTrades(): Promise<PaperTrade[]> {
  const tradesPath = join(paths.paperTrading, "trades.jsonl");

  try {
    await stat(tradesPath);
    const records = await readJsonlFile<RawPaperTradeEvent>(tradesPath);
    return normalizePaperTradeEvents(records);
  } catch (error) {
    if (isMissingFile(error)) {
      throw new PaperTradingNotInitializedError(
        `Paper trading not initialized: ${tradesPath} is missing`,
      );
    }

    throw error;
  }
}

export function calculatePaperTradingStats(trades: PaperTrade[]): PaperTradingStats {
  const closedTrades = trades.filter((trade) => trade.status === "closed" || trade.status === "partial");
  const activeTrades = trades.filter((trade) => isActiveTrade(trade));
  const winningTrades = closedTrades.filter((trade) => (trade.pnl ?? 0) > 0);
  const losingTrades = closedTrades.filter((trade) => (trade.pnl ?? 0) < 0);
  const winPnl = winningTrades.map((trade) => trade.pnl ?? 0);
  const lossPnl = losingTrades.map((trade) => trade.pnl ?? 0);

  return {
    total: trades.length,
    active: activeTrades.length,
    closed: closedTrades.length,
    winning: winningTrades.length,
    losing: losingTrades.length,
    win_rate: calculateWinRate(closedTrades),
    avg_win: average(winPnl),
    avg_loss: average(lossPnl),
    risk_reward: calculateRiskReward(winningTrades, losingTrades),
    largest_win: winPnl.length > 0 ? Math.max(...winPnl) : 0,
    largest_loss: lossPnl.length > 0 ? Math.min(...lossPnl) : 0,
  };
}

export async function getPaperPositions(): Promise<PaperPositionsResult> {
  const trades = await loadPaperTrades();
  const activeTrades = trades.filter((trade) => isActiveTrade(trade));
  const priceResult = await fetchCurrentPrices(activeTrades.map((trade) => trade.asset));

  const positions = activeTrades
    .map((trade) => {
      const asset = trade.asset.toUpperCase();
      const currentPrice = priceResult.prices[asset] ?? trade.entry_price;
      const unrealizedPnl = calculateUnrealizedPnL(
        trade.entry_price,
        currentPrice,
        trade.position_size,
        "long",
      );
      const currentValue = currentPrice * trade.position_size;

      return {
        asset,
        signal: trade.signal,
        entry_price: trade.entry_price,
        current_price: currentPrice,
        quantity: trade.position_size,
        entry_value: trade.position_value,
        current_value: currentValue,
        unrealized_pnl: unrealizedPnl,
        pnl_pct: trade.entry_price === 0 ? 0 : ((currentPrice - trade.entry_price) / trade.entry_price) * 100,
        side: "long" as const,
        entry_date: trade.created_at,
        is_winning: unrealizedPnl >= 0,
      };
    })
    .sort((a, b) => b.unrealized_pnl - a.unrealized_pnl);

  return {
    positions,
    total_unrealized_pnl: positions.reduce((sum, position) => sum + position.unrealized_pnl, 0),
    price_source: priceResult.source,
  };
}

export async function getPaperBalance(): Promise<PaperBalanceResult> {
  const trades = await loadPaperTrades();
  const positions = await getPaperPositions();
  const realizedPnl = trades
    .filter((trade) => trade.status === "closed" || trade.status === "partial")
    .reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);
  const optionalBalance = await readOptionalBalance();
  const startingBalance = optionalBalance?.starting_balance ?? 10_000;
  const currentBalance = startingBalance + realizedPnl + positions.total_unrealized_pnl;
  const equityCurve =
    optionalBalance?.equity_curve ??
    trades
      .filter((trade) => trade.status === "closed" || trade.status === "partial")
      .map((trade) => ({
        timestamp: trade.created_at,
        value: startingBalance + (trade.pnl ?? 0),
      }));
  const drawdown = calculateDrawdown(equityCurve);
  const freshness = await statFileFreshness(join(paths.paperTrading, "trades.jsonl"), refresh.staleMs);

  return {
    balance: {
      current_balance: currentBalance,
      starting_balance: startingBalance,
      total_pnl: realizedPnl + positions.total_unrealized_pnl,
      total_pnl_pct: startingBalance === 0 ? 0 : ((realizedPnl + positions.total_unrealized_pnl) / startingBalance) * 100,
      realized_pnl: realizedPnl,
      unrealized_pnl: positions.total_unrealized_pnl,
      peak_balance: Math.max(optionalBalance?.peak_balance ?? startingBalance, currentBalance),
      max_drawdown: drawdown.max_drawdown,
      equity_curve: equityCurve,
      last_updated: freshness.last_updated ?? new Date().toISOString(),
    },
    is_stale: freshness.is_stale,
    price_source: positions.price_source,
  };
}

export function sortTradesNewestFirst(trades: PaperTrade[]): PaperTrade[] {
  return [...trades].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

async function readOptionalBalance(): Promise<OptionalBalanceFile | null> {
  try {
    return await readJsonFile<OptionalBalanceFile>(join(paths.paperTrading, "balance.json"));
  } catch {
    return null;
  }
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizePaperTradeEvents(events: RawPaperTradeEvent[]): PaperTrade[] {
  const tradesByKey = new Map<string, PaperTrade>();

  for (const event of events) {
    const key = tradeEventKey(event);
    const existingTrade = tradesByKey.get(key);

    if (isActivePartialEvent(event)) {
      tradesByKey.set(key, normalizeActivePartialEvent(event, existingTrade));
      continue;
    }

    if (isClosedEvent(event)) {
      tradesByKey.set(key, normalizeClosedEvent(event, existingTrade));
      continue;
    }

    const trade = normalizeBaseTradeEvent(event);
    const existingIsClosed = existingTrade?.status === "closed" || existingTrade?.status === "partial";

    if (!existingTrade || !existingIsClosed) {
      tradesByKey.set(key, trade);
    }
  }

  return [...tradesByKey.values()];
}

function normalizeBaseTradeEvent(event: RawPaperTradeEvent): PaperTrade {
  const positionSize = toNumber(event.position_size);
  const entryPrice = toNumber(event.entry_price);

  return paperTradeSchema.parse({
    ...event,
    id: toStringValue(event.id),
    date: toStringValue(event.date),
    signal: toStringValue(event.signal),
    asset: toStringValue(event.asset),
    entry_price: entryPrice,
    position_size: positionSize,
    position_value: toOptionalNumber(event.position_value) ?? entryPrice * positionSize,
    status: normalizeStatus(event.status),
    created_at: eventTimestamp(event),
  });
}

function normalizeActivePartialEvent(
  event: RawPaperTradeEvent,
  existingTrade: PaperTrade | undefined,
): PaperTrade {
  const entryPrice = toOptionalNumber(event.entry_price) ?? existingTrade?.entry_price ?? 0;
  const remainingSize =
    toOptionalNumber(event.remaining_size) ??
    existingTrade?.position_size ??
    toOptionalNumber(event.position_size) ??
    0;

  return paperTradeSchema.parse({
    ...existingTrade,
    ...event,
    id: existingTrade?.id ?? toStringValue(event.id),
    date: existingTrade?.date ?? toStringValue(event.date),
    signal: existingTrade?.signal ?? toStringValue(event.signal),
    asset: existingTrade?.asset ?? toStringValue(event.asset),
    entry_price: entryPrice,
    position_size: remainingSize,
    position_value: entryPrice * remainingSize,
    status: "active_partial",
    created_at: existingTrade?.created_at ?? eventTimestamp(event),
  });
}

function normalizeClosedEvent(
  event: RawPaperTradeEvent,
  existingTrade: PaperTrade | undefined,
): PaperTrade {
  const entryPrice = toOptionalNumber(event.entry_price) ?? existingTrade?.entry_price ?? 0;
  const positionSize = toOptionalNumber(event.position_size) ?? existingTrade?.position_size ?? 0;

  return paperTradeSchema.parse({
    ...existingTrade,
    ...event,
    id: toStringValue(event.id) || existingTrade?.id,
    date: toStringValue(event.date) || existingTrade?.date,
    signal: toStringValue(event.signal) || existingTrade?.signal,
    asset: toStringValue(event.asset) || existingTrade?.asset,
    entry_price: entryPrice,
    position_size: positionSize,
    position_value:
      toOptionalNumber(event.position_value) ?? existingTrade?.position_value ?? entryPrice * positionSize,
    status: "closed",
    created_at: eventTimestamp(event),
  });
}

function tradeEventKey(event: RawPaperTradeEvent): string {
  return `${toStringValue(event.asset).toUpperCase()}::${toStringValue(event.signal).toLowerCase()}`;
}

function isActiveTrade(trade: PaperTrade): boolean {
  return trade.status === "active" || trade.status === "active_partial";
}

function isActivePartialEvent(event: RawPaperTradeEvent): boolean {
  return event.status === "active_partial" || toStringValue(event.action).startsWith("partial_exit");
}

function isClosedEvent(event: RawPaperTradeEvent): boolean {
  return event.status === "closed" || toStringValue(event.action).endsWith("_exit");
}

function normalizeStatus(status: unknown): PaperTrade["status"] {
  if (status === "active_partial" || status === "closed" || status === "partial") {
    return status;
  }

  return "active";
}

function eventTimestamp(event: RawPaperTradeEvent): string {
  const timestamp = event.created_at ?? event.closed_at ?? event.updated_at;

  if (typeof timestamp === "string" && timestamp.length > 0) {
    return timestamp;
  }

  return `${toStringValue(event.date)}T00:00:00.000Z`;
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toOptionalNumber(value: unknown): number | undefined {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
