"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/types";
import { formatCurrency } from "../format";
import { getSparklinePoints } from "./overview-data";

type EquityCurveChartProps = {
  equityCurve: EquityPoint[];
};

export function EquityCurveChart({ equityCurve }: EquityCurveChartProps) {
  const chartData = getSparklinePoints(equityCurve, 30);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Portfolio Growth</h2>
          <p className="text-sm text-slate-400">Equity curve from paper trading balance history.</p>
        </div>
        <span className="text-xs text-slate-500">{chartData.length} points</span>
      </div>

      <div className="mt-4 h-72">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#0a84ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.09)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#98989d", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={18}
              />
              <YAxis
                tick={{ fill: "#98989d", fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(Number(value)).replace(".00", "")}
                tickLine={false}
                axisLine={false}
                width={76}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Portfolio value"]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  background: "rgba(28, 28, 30, 0.96)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0a84ff"
                strokeWidth={2.5}
                fill="url(#equityFill)"
                dot={false}
                activeDot={{ r: 4, fill: "#64d2ff", stroke: "#0a84ff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/15 text-sm text-slate-400">
            Portfolio growth appears after at least two equity points.
          </div>
        )}
      </div>
    </section>
  );
}
