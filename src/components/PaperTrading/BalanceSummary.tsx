"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PaperBalance } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "../format";

type BalanceSummaryProps = {
  balance: PaperBalance;
  priceSource: "live" | "cache" | "none";
  deployedValue?: number;
};

export function BalanceSummary({ balance, priceSource, deployedValue = 0 }: BalanceSummaryProps) {
  const chartData = balance.equity_curve.slice(-30).map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: point.value,
  }));
  const availableValue = Math.max(balance.current_balance - deployedValue, 0);
  const deployedPct =
    balance.current_balance <= 0 ? 0 : Math.min(100, Math.max(0, (deployedValue / balance.current_balance) * 100));
  const availablePct = Math.max(0, 100 - deployedPct);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Account Balance</h2>
          <p className="text-sm text-slate-400">Prices: {priceSource}</p>
        </div>
        <p className="text-xs text-slate-500">Updated {formatDate(balance.last_updated)}</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Current Balance</p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{formatCurrency(balance.current_balance)}</p>
          <p className={balance.total_pnl >= 0 ? "mt-1 text-sm text-emerald-300" : "mt-1 text-sm text-red-300"}>
            {formatCurrency(balance.total_pnl, true)} ({formatPercent(balance.total_pnl_pct, 2)})
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Deployed {formatCurrency(deployedValue)}</span>
            <span>Available {formatCurrency(availableValue)}</span>
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg bg-white/10">
            <div
              className="flex items-center justify-center bg-[#0a84ff] text-xs font-semibold text-white"
              style={{ width: `${deployedPct}%` }}
            >
              {deployedPct >= 18 ? `${Math.round(deployedPct)}%` : ""}
            </div>
            <div
              className="flex items-center justify-center bg-slate-600/70 text-xs font-semibold text-slate-100"
              style={{ width: `${availablePct}%` }}
            >
              {availablePct >= 18 ? `${Math.round(availablePct)}%` : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Realized P&L" value={formatCurrency(balance.realized_pnl, true)} positive={balance.realized_pnl >= 0} />
        <Metric label="Unrealized P&L" value={formatCurrency(balance.unrealized_pnl, true)} positive={balance.unrealized_pnl >= 0} />
        <Metric label="Peak Balance" value={formatCurrency(balance.peak_balance)} />
        <Metric label="Max Drawdown" value={formatCurrency(balance.max_drawdown)} negative />
      </div>

      <div className="mt-4 h-48">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => `$${Number(value).toLocaleString("en-US")}`}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-white/10 text-sm text-slate-400">
            Equity curve will appear after closed trades.
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400">Return {formatPercent(balance.total_pnl_pct)}</p>
    </section>
  );
}

function Metric({
  label,
  value,
  positive,
  negative = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const tone = positive === undefined ? "text-slate-100" : positive ? "text-emerald-300" : "text-red-300";

  return (
    <div className="rounded border border-white/10 bg-black/15 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={negative ? "mt-2 text-base font-semibold text-amber-200" : `mt-2 text-base font-semibold ${tone}`}>
        {value}
      </p>
    </div>
  );
}
