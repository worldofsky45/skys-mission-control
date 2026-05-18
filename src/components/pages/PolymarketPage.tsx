"use client";

import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { ArbitrageMonitor } from "@/components/Polymarket/ArbitrageMonitor";
import { PerformanceMetrics } from "@/components/Polymarket/PerformanceMetrics";
import { SignalsList } from "@/components/Polymarket/SignalsList";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { resolvePolymarketSignal, type PolymarketOutcomeRequest } from "@/lib/api";
import type { AggregatedROI, ArbitrageMonitorResponse, PolymarketSignalsResponse } from "@/lib/types";

export function PolymarketPageContent() {
  const polymarketState = useAutoRefresh<PolymarketSignalsResponse>({ endpoint: "/api/polymarket/signals" });
  const arbitrageState = useAutoRefresh<ArbitrageMonitorResponse>({ endpoint: "/api/polymarket/arbitrage" });
  const roiState = useAutoRefresh<AggregatedROI>({ endpoint: "/api/roi" });
  const refreshAll = () => {
    void Promise.all([polymarketState.refresh(), arbitrageState.refresh(), roiState.refresh()]);
  };

  async function handleResolvePolymarket(request: PolymarketOutcomeRequest) {
    await resolvePolymarketSignal(request);
    await refreshAll();
  }

  return (
    <AppShell
      active="polymarket"
      title="Polymarket"
      description="Use this page to review prediction signals and manually resolve outcomes through validated write-back."
      onRefresh={refreshAll}
    >
      <ErrorPanel title="Polymarket error" error={polymarketState.error} onRetry={polymarketState.refresh} />
      <ErrorPanel title="Arbitrage monitor error" error={arbitrageState.error} onRetry={arbitrageState.refresh} />
      <ArbitrageMonitor data={arbitrageState.data} loading={arbitrageState.loading} />
      <SignalsList signals={polymarketState.data?.signals ?? []} onResolved={handleResolvePolymarket} />
      <PerformanceMetrics
        signals={polymarketState.data?.signals ?? []}
        stats={
          polymarketState.data?.stats ?? {
            active: 0,
            resolved: 0,
            won: 0,
            lost: 0,
            accuracy: 0,
            total_pnl: 0,
          }
        }
      />
    </AppShell>
  );
}
