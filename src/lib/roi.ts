import { paths } from "./constants";
import { aggregateROI } from "./calculations";
import { readJsonlFile } from "./file-store";
import { getPaperBalance, PaperTradingNotInitializedError } from "./paper-trading";
import { roiEntrySchema } from "./schemas";
import type { AggregatedROI, ROIEntry } from "./types";

export async function getAggregatedROI(): Promise<AggregatedROI> {
  const entries = await loadManualROIEntries();
  const computedEntries = await loadComputedEntries();
  const byName = new Map<string, ROIEntry>();

  for (const entry of [...entries, ...computedEntries]) {
    byName.set(entry.name, entry);
  }

  return aggregateROI([...byName.values()]);
}

async function loadManualROIEntries(): Promise<ROIEntry[]> {
  const records = await readJsonlFile(paths.roiTracker);
  return records.map((record) => roiEntrySchema.parse(record));
}

async function loadComputedEntries(): Promise<ROIEntry[]> {
  const entries: ROIEntry[] = [];
  const paperEntry = await loadPaperROIEntry();
  const polymarketEntry = await loadPolymarketROIEntry();

  if (paperEntry) {
    entries.push(paperEntry);
  }

  if (polymarketEntry) {
    entries.push(polymarketEntry);
  }

  return entries;
}

async function loadPaperROIEntry(): Promise<ROIEntry | null> {
  try {
    const { balance } = await getPaperBalance();
    return {
      timestamp: balance.last_updated,
      name: "Paper Trading System",
      invested: balance.starting_balance,
      roi: balance.total_pnl,
      description: "Computed from active paper trading data",
      status: "active",
    };
  } catch (error) {
    if (error instanceof PaperTradingNotInitializedError) {
      return null;
    }

    throw error;
  }
}

async function loadPolymarketROIEntry(): Promise<ROIEntry | null> {
  const records = await readJsonlFile<Record<string, unknown>>(paths.polymarketTrades);
  const resolvedRecords = records.filter((record) => typeof record.signal_id === "string");

  if (resolvedRecords.length === 0) {
    return null;
  }

  const invested = resolvedRecords.reduce(
    (sum, record) =>
      sum + Number(record.position_size ?? record.invested ?? Math.abs(Number(record.pnl ?? 0))),
    0,
  );
  const roi = resolvedRecords.reduce((sum, record) => sum + Number(record.pnl ?? 0), 0);
  const latest = resolvedRecords
    .map((record) => String(record.resolved_date ?? record.timestamp ?? record.date ?? ""))
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    timestamp: latest ?? new Date().toISOString(),
    name: "Polymarket Signals",
    invested,
    roi,
    description: "Computed from resolved Polymarket outcomes",
    status: "active",
  };
}
