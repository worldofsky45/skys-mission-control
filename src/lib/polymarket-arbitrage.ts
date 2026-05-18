import { paths } from "./constants";
import { readJsonFile } from "./file-store";
import { arbitrageSnapshotSchema } from "./schemas";
import type { ArbitrageMonitorResponse, ArbitrageMonitorStatus } from "./types";

const ARBITRAGE_STALE_MS = 60 * 60 * 1000;

export async function getPolymarketArbitrage(): Promise<ArbitrageMonitorResponse> {
  try {
    const snapshot = arbitrageSnapshotSchema.parse(await readJsonFile(paths.polymarketArbitrage));
    const status = getStatus(snapshot.timestamp ?? null, snapshot.profitable_count);

    return {
      timestamp: snapshot.timestamp ?? null,
      version: snapshot.version ?? null,
      total_matches: snapshot.total_matches,
      profitable_count: snapshot.profitable_count,
      min_profit_threshold: snapshot.min_profit_threshold,
      opportunities: snapshot.opportunities,
      status,
      message: getMessage(status, snapshot.profitable_count, snapshot.min_profit_threshold),
    };
  } catch (error) {
    if (isMissingFile(error)) {
      return missingResponse();
    }

    throw error;
  }
}

function getStatus(timestamp: string | null, profitableCount: number): ArbitrageMonitorStatus {
  if (!timestamp) {
    return "missing";
  }

  if (Date.now() - Date.parse(timestamp) > ARBITRAGE_STALE_MS) {
    return "stale";
  }

  return profitableCount > 0 ? "opportunities" : "monitoring";
}

function getMessage(status: ArbitrageMonitorStatus, profitableCount: number, threshold: number): string {
  if (status === "opportunities") {
    return `${profitableCount} ${profitableCount === 1 ? "opportunity" : "opportunities"} above the ${threshold}% threshold`;
  }

  if (status === "stale") {
    return "Arbitrage scan is stale; OpenClaw may need a refresh";
  }

  if (status === "missing") {
    return "Arbitrage monitor cache is not available yet";
  }

  return `No opportunities above the ${threshold}% threshold`;
}

function missingResponse(): ArbitrageMonitorResponse {
  return {
    timestamp: null,
    version: null,
    total_matches: 0,
    profitable_count: 0,
    min_profit_threshold: 1,
    opportunities: [],
    status: "missing",
    message: "Arbitrage monitor cache is not available yet",
  };
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
