import { paths } from "./constants";
import { appendJsonl, readJsonlFile } from "./file-store";
import { polymarketOutcomeRequestSchema, polymarketSignalSchema } from "./schemas";
import type { PolymarketOutcome, PolymarketSignal, PolymarketStats, ROIEntry } from "./types";

export class PolymarketStateError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PolymarketStateError";
  }
}

export interface EnrichedPolymarketSignal extends PolymarketSignal {
  id: string;
  current_odds: number | string | null;
  odds_source: "file" | "not_available";
  potential_pnl: number;
  resolved: boolean;
  won: boolean | null;
  pnl: number;
}

export interface PolymarketSignalsResult {
  signals: EnrichedPolymarketSignal[];
  stats: PolymarketStats;
}

export async function listPolymarketSignals(): Promise<PolymarketSignalsResult> {
  const signals = await loadSignals();
  const outcomes = await loadOutcomes();
  const enriched = signals.map((signal) => enrichSignal(signal, outcomes));
  const resolved = enriched.filter((signal) => signal.resolved);
  const won = resolved.filter((signal) => signal.won === true);
  const lost = resolved.filter((signal) => signal.won === false);

  return {
    signals: enriched,
    stats: {
      active: enriched.filter((signal) => !signal.resolved).length,
      resolved: resolved.length,
      won: won.length,
      lost: lost.length,
      accuracy: resolved.length === 0 ? 0 : (won.length / resolved.length) * 100,
      total_pnl: resolved.reduce((sum, signal) => sum + signal.pnl, 0),
    },
  };
}

export async function resolvePolymarketSignal(requestBody: unknown): Promise<PolymarketOutcome> {
  const request = polymarketOutcomeRequestSchema.parse(requestBody);
  const signals = await loadSignals();
  const outcomes = await loadOutcomes();
  const signal = signals.find((candidate) => getSignalId(candidate) === request.signal_id);

  if (!signal) {
    throw new PolymarketStateError(`Signal ${request.signal_id} was not found`, 404);
  }

  if (outcomes.some((outcome) => outcome.signal_id === request.signal_id)) {
    throw new PolymarketStateError(`Signal ${request.signal_id} is already resolved`, 400);
  }

  const positionSize = Number(signal.position_size ?? 0);
  const entryOdds = getEntryOdds(signal);
  const pnl =
    request.outcome === "won" ? roundCurrency(positionSize * (1 / entryOdds - 1)) : -positionSize;
  const outcome: PolymarketOutcome = {
    signal_id: request.signal_id,
    market: signal.market,
    resolved: true,
    won: request.outcome === "won",
    actual_outcome: request.outcome,
    actual_odds: request.actual_odds,
    pnl,
    roi: positionSize === 0 ? 0 : (pnl / positionSize) * 100,
    resolved_date: request.settled_date ?? new Date().toISOString(),
  };

  await appendJsonl(paths.polymarketTrades, outcome);
  await appendJsonl(paths.polymarketScorecard, {
    type: "outcome",
    signal_id: outcome.signal_id,
    market: outcome.market,
    won: outcome.won,
    pnl: outcome.pnl,
    resolved_date: outcome.resolved_date,
  });
  await appendJsonl<ROIEntry>(paths.roiTracker, {
    timestamp: outcome.resolved_date,
    name: "Polymarket Signals",
    invested: positionSize,
    roi: pnl,
    description: `Resolved ${signal.market}`,
    status: "active",
  });

  return outcome;
}

async function loadSignals(): Promise<PolymarketSignal[]> {
  const records = await readJsonlFile(paths.polymarketSignals);
  return records.map((record) => polymarketSignalSchema.parse(record));
}

async function loadOutcomes(): Promise<PolymarketOutcome[]> {
  const records = await readJsonlFile(paths.polymarketTrades);

  return records
    .filter((record): record is Record<string, unknown> => typeof record === "object" && record !== null)
    .filter((record) => typeof record.signal_id === "string")
    .map((record) => ({
      signal_id: String(record.signal_id),
      market: typeof record.market === "string" ? record.market : undefined,
      resolved: Boolean(record.resolved),
      won: Boolean(record.won),
      actual_outcome: record.actual_outcome === "lost" ? "lost" : "won",
      actual_odds: Number(record.actual_odds ?? 0),
      pnl: Number(record.pnl ?? 0),
      roi: Number(record.roi ?? 0),
      resolved_date: String(record.resolved_date ?? record.timestamp ?? record.date ?? ""),
    }));
}

function enrichSignal(
  signal: PolymarketSignal,
  outcomes: PolymarketOutcome[],
): EnrichedPolymarketSignal {
  const id = getSignalId(signal);
  const outcome = outcomes.find((candidate) => candidate.signal_id === id || candidate.market === signal.market);
  const entryOdds = getEntryOdds(signal);
  const positionSize = Number(signal.position_size ?? 0);
  const currentOdds =
    signal.current_odds === undefined || signal.current_odds === "N/A" ? null : signal.current_odds;

  return {
    ...signal,
    id,
    current_odds: currentOdds,
    odds_source: currentOdds === null ? "not_available" : "file",
    potential_pnl: entryOdds === 0 ? 0 : roundCurrency(positionSize * (1 / entryOdds - 1)),
    resolved: Boolean(outcome),
    won: outcome ? outcome.won : null,
    pnl: outcome?.pnl ?? 0,
  };
}

function getSignalId(signal: PolymarketSignal): string {
  return signal.id ?? signal.signal_id ?? signal.market;
}

function getEntryOdds(signal: PolymarketSignal): number {
  const rawOdds = signal.entry_odds ?? signal.entry_price ?? 0;
  const odds = Number(rawOdds);
  return Number.isFinite(odds) && odds > 0 ? odds : 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
