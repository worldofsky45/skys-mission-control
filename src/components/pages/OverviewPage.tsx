"use client";

import { useMemo } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { HeroCards } from "@/components/HeroCards";
import { AssetAllocationChart } from "@/components/Overview/AssetAllocationChart";
import { EquityCurveChart } from "@/components/Overview/EquityCurveChart";
import { getActiveAssetBadges, getAssetAllocation } from "@/components/Overview/overview-data";
import { SystemHealth } from "@/components/SystemHealth";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type {
  AggregatedROI,
  ActivityResponse,
  HealthStatus,
  IdeasResponse,
  PaperBalanceResponse,
  PaperTradesResponse,
  PolymarketSignalsResponse,
} from "@/lib/types";
import { getCombinedWinRate } from "./page-utils";

export function OverviewPage() {
  const healthState = useAutoRefresh<HealthStatus>({ endpoint: "/api/health" });
  const activityState = useAutoRefresh<ActivityResponse>({ endpoint: "/api/activity" });
  const balanceState = useAutoRefresh<PaperBalanceResponse>({ endpoint: "/api/paper-trading/balance" });
  const tradesState = useAutoRefresh<PaperTradesResponse>({ endpoint: "/api/paper-trading/trades" });
  const polymarketState = useAutoRefresh<PolymarketSignalsResponse>({ endpoint: "/api/polymarket/signals" });
  const ideasState = useAutoRefresh<IdeasResponse>({ endpoint: "/api/ideas/list" });
  const roiState = useAutoRefresh<AggregatedROI>({ endpoint: "/api/roi" });
  const trades = useMemo(() => tradesState.data?.trades ?? [], [tradesState.data?.trades]);
  const allocation = useMemo(() => getAssetAllocation(trades), [trades]);
  const activeAssets = useMemo(() => getActiveAssetBadges(trades), [trades]);
  const refreshAll = () => {
    void Promise.all([
      healthState.refresh(),
      activityState.refresh(),
      balanceState.refresh(),
      tradesState.refresh(),
      polymarketState.refresh(),
      ideasState.refresh(),
      roiState.refresh(),
    ]);
  };

  return (
    <AppShell
      active="overview"
      title="Sky's Mission Control"
      description="Command overview for Nova workspace status, live calculations, and validated write-back surfaces."
      onRefresh={refreshAll}
    >
      <SystemHealth health={healthState.data} loading={healthState.loading} onRetry={healthState.refresh} />
      <ErrorPanel title="Health feed error" error={healthState.error} onRetry={healthState.refresh} />
      <ErrorPanel title="Activity feed error" error={activityState.error} onRetry={activityState.refresh} />
      <ErrorPanel title="Paper trading error" error={balanceState.error} onRetry={balanceState.refresh} />

      <HeroCards
        balance={balanceState.data?.balance.current_balance ?? 0}
        totalPnl={balanceState.data?.balance.total_pnl ?? 0}
        totalPnlPct={balanceState.data?.balance.total_pnl_pct ?? 0}
        activePositionCount={tradesState.data?.stats.active ?? 0}
        activeAssets={activeAssets}
        combinedWinRate={getCombinedWinRate(
          tradesState.data?.stats.win_rate ?? 0,
          polymarketState.data?.stats,
        )}
        equityCurve={balanceState.data?.balance.equity_curve ?? []}
        loading={balanceState.loading || tradesState.loading || ideasState.loading}
      />

      <EquityCurveChart equityCurve={balanceState.data?.balance.equity_curve ?? []} />

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <AssetAllocationChart allocation={allocation} />
        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Mission Snapshot</h2>
            <p className="text-sm text-slate-400">Cross-surface status from existing feeds.</p>
          </div>
          <div className="mt-4 grid gap-3">
            <SummaryCard label="Paper utility" value={`${tradesState.data?.stats.active ?? 0} active trades`} />
            <SummaryCard label="Polymarket utility" value={`${polymarketState.data?.stats.active ?? 0} active signals`} />
            <SummaryCard label="Idea queue" value={`${ideasState.data?.counts.pending ?? 0} awaiting review`} />
            <SummaryCard label="ROI utility" value={`${(roiState.data?.roi_percentage ?? 0).toFixed(1)}% total return`} />
          </div>
        </div>
      </section>

      <ActivityFeed events={activityState.data?.events ?? []} loading={activityState.loading} />
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 p-3 transition-colors hover:border-white/20">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-100">{value}</p>
    </div>
  );
}
