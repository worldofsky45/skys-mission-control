import { statfs } from "node:fs/promises";
import { join } from "node:path";
import { paths, refresh } from "./constants";
import { statFileFreshness } from "./file-store";
import type { HealthCheck, HealthLevel, HealthStatus } from "./types";

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkPath("Workspace", paths.workspace, true),
    checkPath("Paper Trading Data", join(paths.paperTrading, "trades.jsonl"), true),
    checkPath("Ideas State", paths.ideasState, true),
    checkPath("Polymarket Signals", paths.polymarketSignals, false),
    checkPath("ROI Tracker", paths.roiTracker, false),
    checkCoinGecko(),
    checkDiskSpace(),
  ]);
  const status = summarizeStatus(checks);

  return {
    status,
    message:
      status === "healthy"
        ? "All systems operational"
        : status === "warning"
          ? "Some checks need attention"
          : "One or more critical checks failed",
    checks,
    timestamp: new Date().toISOString(),
  };
}

async function checkPath(name: string, filepath: string, required: boolean): Promise<HealthCheck> {
  const freshness = await statFileFreshness(filepath, refresh.staleMs);

  if (!freshness.exists) {
    return {
      name,
      status: required ? "critical" : "warning",
      last_updated: null,
      details: `${filepath} is missing`,
    };
  }

  if (freshness.is_stale) {
    return {
      name,
      status: "warning",
      last_updated: freshness.last_updated,
      details: `${filepath} is older than 24 hours`,
    };
  }

  return {
    name,
    status: "healthy",
    last_updated: freshness.last_updated,
    details: `${filepath} is present`,
  };
}

async function checkCoinGecko(): Promise<HealthCheck> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    );

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    return {
      name: "CoinGecko API",
      status: "healthy",
      last_updated: new Date().toISOString(),
      details: "Bitcoin price check succeeded",
    };
  } catch {
    return {
      name: "CoinGecko API",
      status: "warning",
      last_updated: null,
      details: "CoinGecko price check failed",
    };
  }
}

async function checkDiskSpace(): Promise<HealthCheck> {
  try {
    const stats = await statfs(paths.workspace);
    const availableBytes = Number(stats.bavail) * Number(stats.bsize);
    const oneGb = 1024 * 1024 * 1024;

    return {
      name: "Disk Space",
      status: availableBytes > oneGb ? "healthy" : "warning",
      last_updated: new Date().toISOString(),
      details: `${Math.round(availableBytes / 1024 / 1024)} MB available`,
    };
  } catch {
    return {
      name: "Disk Space",
      status: "warning",
      last_updated: null,
      details: "Unable to read disk space",
    };
  }
}

function summarizeStatus(checks: HealthCheck[]): HealthLevel {
  if (checks.some((check) => check.status === "critical")) {
    return "critical";
  }

  if (checks.some((check) => check.status === "warning")) {
    return "warning";
  }

  return "healthy";
}
