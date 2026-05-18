"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { BalanceSummary } from "@/components/PaperTrading/BalanceSummary";
import { PositionsTable } from "@/components/PaperTrading/PositionsTable";
import { TradeHistory } from "@/components/PaperTrading/TradeHistory";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { PaperBalanceResponse, PaperPositionsResponse, PaperTradesResponse } from "@/lib/types";
import { firstError } from "./page-utils";

export function PaperTradingPageContent() {
  const balanceState = useAutoRefresh<PaperBalanceResponse>({ endpoint: "/api/paper-trading/balance" });
  const tradesState = useAutoRefresh<PaperTradesResponse>({ endpoint: "/api/paper-trading/trades" });
  const positionsState = useAutoRefresh<PaperPositionsResponse>({ endpoint: "/api/paper-trading/positions" });
  const deployedValue = useMemo(
    () => (positionsState.data?.positions ?? []).reduce((sum, position) => sum + position.entry_value, 0),
    [positionsState.data?.positions],
  );
  const refreshAll = () => {
    void Promise.all([balanceState.refresh(), tradesState.refresh(), positionsState.refresh()]);
  };

  return (
    <AppShell
      active="paper"
      title="Paper Trading"
      description="Use this page for active paper positions, account balance, closed trades, and CSV export."
      onRefresh={refreshAll}
    >
      <ErrorPanel
        title="Paper trading error"
        error={firstError(balanceState.error, positionsState.error, tradesState.error)}
        onRetry={refreshAll}
      />
      {balanceState.data ? (
        <BalanceSummary
          balance={balanceState.data.balance}
          priceSource={balanceState.data.price_source}
          deployedValue={deployedValue}
        />
      ) : null}
      <PositionsTable positions={positionsState.data?.positions ?? []} />
      <TradeHistory trades={tradesState.data?.trades ?? []} />
    </AppShell>
  );
}
