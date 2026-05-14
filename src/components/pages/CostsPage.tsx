"use client";

import { AppShell } from "@/components/AppShell";
import { BudgetProgress } from "@/components/Costs/BudgetProgress";
import { DailyBreakdown } from "@/components/Costs/DailyBreakdown";
import { SpendSummary } from "@/components/Costs/SpendSummary";
import { ErrorPanel } from "@/components/ErrorPanel";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { CostsResponse } from "@/lib/types";
import { formatCurrency, formatPercent } from "../format";

export function CostsPageContent() {
  const costsState = useAutoRefresh<CostsResponse>({ endpoint: "/api/costs" });

  return (
    <AppShell
      active="costs"
      title="Costs"
      description="AI API spend tracking for the 15-day sprint budget and project-level cost discipline."
      onRefresh={costsState.refresh}
    >
      <ErrorPanel title="Costs error" error={costsState.error} onRetry={costsState.refresh} />

      {costsState.data ? (
        <div className="space-y-5">
          <SpendSummary summary={costsState.data.summary} />
          <BudgetProgress summary={costsState.data.summary} />
          <DailyBreakdown daily={costsState.data.daily_breakdown} />

          <section className="grid gap-4 lg:grid-cols-2">
            <BreakdownCard
              title="By Category"
              rows={costsState.data.by_category.map((row) => ({
                label: row.category,
                value: `${formatCurrency(row.amount)} / ${formatPercent(row.pct, 1)}`,
              }))}
            />
            <BreakdownCard
              title="By Project"
              rows={costsState.data.by_project.map((row) => ({
                label: row.project,
                value: `${formatCurrency(row.amount)} / ${formatPercent(row.pct, 1)}`,
              }))}
            />
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Recent Expenses</h2>
              <p className="text-sm text-slate-400">Last recorded cost entries from OpenClaw workspace.</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-500">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Description</th>
                    <th className="pb-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {costsState.data.recent_expenses.map((expense) => (
                    <tr key={`${expense.date}-${expense.description}`}>
                      <td className="py-3 text-slate-300">{expense.date}</td>
                      <td className="py-3 text-slate-300">{expense.description}</td>
                      <td className="py-3 text-right font-semibold text-slate-50">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
          Loading costs...
        </div>
      )}
    </AppShell>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No spend recorded yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/15 p-3">
              <span className="text-sm text-slate-300">{row.label}</span>
              <span className="text-sm font-semibold text-slate-50">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
