import clsx from "clsx";
import type { CostSummary } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "../format";

type SpendSummaryProps = {
  summary: CostSummary;
};

export function SpendSummary({ summary }: SpendSummaryProps) {
  const budgetTone =
    summary.budget_used_pct >= 100
      ? "text-red-300"
      : summary.budget_used_pct >= 90
        ? "text-amber-200"
        : "text-emerald-300";

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Cost summary">
      <SummaryCard label="Total Spent" value={formatCurrency(summary.total_spent)} />
      <SummaryCard label="Daily Average" value={formatCurrency(summary.daily_average)} />
      <SummaryCard label="Days Remaining" value={formatNumber(summary.days_remaining)} />
      <SummaryCard
        label="Budget Used"
        value={formatPercent(summary.budget_used_pct, 1)}
        valueClassName={budgetTone}
        helper={summary.on_track ? "Projected within budget" : "Projected over budget"}
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  valueClassName,
}: {
  label: string;
  value: string;
  helper?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className={clsx("mt-3 text-2xl font-semibold text-slate-50", valueClassName)}>{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}
