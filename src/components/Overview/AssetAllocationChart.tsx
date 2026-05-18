"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { AllocationData } from "./overview-data";
import { formatCurrency, formatPercent } from "../format";

type AssetAllocationChartProps = {
  allocation: AllocationData;
};

export function AssetAllocationChart({ allocation }: AssetAllocationChartProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Asset Allocation</h2>
          <p className="text-sm text-slate-400">Active deployed capital by asset.</p>
        </div>
        <span className="text-xs text-slate-500">{formatCurrency(allocation.totalDeployed)} deployed</span>
      </div>

      {allocation.rows.length === 0 ? (
        <div className="mt-4 flex h-52 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/15 text-sm text-slate-400">
          No active positions to allocate yet.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="flex h-56 min-w-0 items-center justify-center overflow-hidden">
            <PieChart width={260} height={224}>
              <Pie
                data={allocation.rows}
                dataKey="value"
                nameKey="asset"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={86}
                paddingAngle={3}
                stroke="rgba(28,28,30,0.75)"
                strokeWidth={3}
              >
                {allocation.rows.map((row) => (
                  <Cell key={row.asset} fill={row.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Deployed"]}
                contentStyle={{
                  background: "rgba(28, 28, 30, 0.96)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
              />
            </PieChart>
          </div>

          <div className="space-y-3">
            {allocation.rows.map((row) => (
              <div key={row.asset}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 font-semibold text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.asset}
                  </span>
                  <span className="text-slate-400">
                    {formatCurrency(row.value)} / {formatPercent(row.share)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.share}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
