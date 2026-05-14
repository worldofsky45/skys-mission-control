import type { EquityPoint, PaperTrade } from "@/lib/types";

export const ASSET_COLORS = ["#0a84ff", "#bf5af2", "#30d158", "#ffd60a", "#ff453a", "#64d2ff"];

export type ChartPoint = {
  timestamp: string;
  label: string;
  value: number;
};

export type AllocationRow = {
  asset: string;
  value: number;
  share: number;
  color: string;
};

export type AllocationData = {
  rows: AllocationRow[];
  totalDeployed: number;
};

export function getSparklinePoints(points: EquityPoint[], limit = 7): ChartPoint[] {
  return points.slice(-limit).map((point) => ({
    timestamp: point.timestamp,
    label: formatShortDate(point.timestamp),
    value: point.value,
  }));
}

export function getAssetAllocation(trades: PaperTrade[]): AllocationData {
  const grouped = trades
    .filter(isActivePaperTrade)
    .reduce<Record<string, number>>((accumulator, trade) => {
      const asset = trade.asset.toUpperCase();
      accumulator[asset] = (accumulator[asset] ?? 0) + trade.position_value;
      return accumulator;
    }, {});
  const totalDeployed = Object.values(grouped).reduce((sum, value) => sum + value, 0);
  const rows = Object.entries(grouped)
    .sort(([aAsset, aValue], [bAsset, bValue]) => bValue - aValue || aAsset.localeCompare(bAsset))
    .map(([asset, value], index) => ({
      asset,
      value: Math.round(value),
      share: totalDeployed === 0 ? 0 : Math.round((value / totalDeployed) * 1000) / 10,
      color: ASSET_COLORS[index % ASSET_COLORS.length],
    }));

  return {
    rows,
    totalDeployed: Math.round(totalDeployed),
  };
}

export function getActiveAssetBadges(trades: PaperTrade[], limit = 5): string[] {
  const seen = new Set<string>();
  const assets: string[] = [];
  const activeTrades = trades
    .filter(isActivePaperTrade)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  for (const trade of activeTrades) {
    const asset = trade.asset.toUpperCase();

    if (!seen.has(asset)) {
      seen.add(asset);
      assets.push(asset);
    }

    if (assets.length >= limit) {
      break;
    }
  }

  return assets;
}

function isActivePaperTrade(trade: PaperTrade): boolean {
  return trade.status === "active" || trade.status === "active_partial";
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
