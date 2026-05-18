import type { CostDailyBreakdown } from "@/lib/types";
import { formatCurrency } from "../format";

type DailyBreakdownProps = {
  daily: CostDailyBreakdown[];
};

export function DailyBreakdown({ daily }: DailyBreakdownProps) {
  const maxAmount = Math.max(...daily.map((entry) => entry.amount), 0);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Daily Spend</h2>
          <p className="text-sm text-slate-400">Recent spend cadence with running totals.</p>
        </div>
        <span className="text-xs text-slate-500">{daily.length} tracked days</span>
      </div>

      {daily.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-white/10 bg-black/15 p-4 text-sm text-slate-400">
          No cost entries have been recorded yet.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {daily.slice(-14).map((entry) => (
            <div key={entry.date}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-300">{formatCostDate(entry.date)}</span>
                <span className="text-slate-400">
                  {formatCurrency(entry.amount)} / {formatCurrency(entry.running_total)} running
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${maxAmount === 0 ? 0 : (entry.amount / maxAmount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatCostDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
