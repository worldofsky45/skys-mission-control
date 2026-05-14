"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { EnrichedPolymarketSignal, PolymarketStats } from "@/lib/types";
import { formatCurrency, formatPercent } from "../format";

type PerformanceMetricsProps = {
  stats: PolymarketStats;
  signals: EnrichedPolymarketSignal[];
};

export function PerformanceMetrics({ stats, signals }: PerformanceMetricsProps) {
  const resolved = signals.filter((signal) => signal.resolved);
  const best = [...resolved].sort((a, b) => b.pnl - a.pnl)[0];
  const worst = [...resolved].sort((a, b) => a.pnl - b.pnl)[0];
  const chartData = [
    { name: "Won", value: stats.won },
    { name: "Lost", value: stats.lost },
  ];

  return (
    <section className="rounded-md border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-50">Polymarket Performance</h3>
          <p className="mt-1 text-sm text-slate-400">
            {stats.resolved === 0 ? "No outcomes logged yet" : `${stats.resolved} resolved markets`}
          </p>
        </div>
        <p className={stats.total_pnl >= 0 ? "text-lg font-semibold text-emerald-300" : "text-lg font-semibold text-red-300"}>
          {formatCurrency(stats.total_pnl, true)}
        </p>
      </div>

      {stats.resolved === 0 ? (
        <div className="mt-4 rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          Awaiting resolved signals
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58} stroke="none">
                  <Cell fill="#34d399" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Accuracy" value={formatPercent(stats.accuracy)} />
            <Metric label="Best" value={best?.market ?? "Not reported"} />
            <Metric label="Worst" value={worst?.market ?? "Not reported"} />
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/15 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
