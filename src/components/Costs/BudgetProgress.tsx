import type { CostSummary } from "@/lib/types";
import { formatCurrency, formatPercent } from "../format";

type BudgetProgressProps = {
  summary: CostSummary;
};

export function BudgetProgress({ summary }: BudgetProgressProps) {
  const spentPct = clamp(summary.budget_used_pct);
  const projectedPct = clamp((summary.projected_total / summary.budget_total) * 100);
  const remainingProjectionPct = Math.max(0, projectedPct - spentPct);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Sprint Budget</h2>
          <p className="text-sm text-slate-400">15-day budget target with current run-rate projection.</p>
        </div>
        <span className="text-xs text-slate-500">
          {formatCurrency(summary.total_spent)} of {formatCurrency(summary.budget_total)}
        </span>
      </div>

      <div className="mt-4 h-4 overflow-hidden rounded-full border border-white/10 bg-black/25">
        <div className="flex h-full">
          <div className="bg-cyan-300" style={{ width: `${spentPct}%` }} />
          <div className="bg-slate-500/55" style={{ width: `${remainingProjectionPct}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <Metric label="Spent" value={formatPercent(summary.budget_used_pct, 1)} />
        <Metric label="Projected" value={formatCurrency(summary.projected_total)} />
        <Metric label="Pace" value={summary.on_track ? "On track" : "Over pace"} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
