import clsx from "clsx";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { EquityPoint } from "@/lib/types";
import { clampPercent, getSparklinePoints } from "./Overview/overview-data";
import { formatCurrency, formatNumber, formatPercent } from "./format";

type HeroCardsProps = {
  balance: number;
  totalPnl: number;
  totalPnlPct: number;
  activePositionCount: number;
  activeAssets: string[];
  combinedWinRate: number;
  equityCurve: EquityPoint[];
  loading?: boolean;
};

export function HeroCards({
  balance,
  totalPnl,
  totalPnlPct,
  activePositionCount,
  activeAssets,
  combinedWinRate,
  equityCurve,
  loading = false,
}: HeroCardsProps) {
  const sparklinePoints = getSparklinePoints(equityCurve);
  const winRate = clampPercent(combinedWinRate);
  const pnlIsPositive = totalPnl >= 0;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Mission metrics">
      <MetricCard loading={loading}>
        <p className="text-xs font-semibold uppercase text-slate-400">Portfolio Value</p>
        <p className="mt-3 text-2xl font-semibold text-slate-50">{formatCurrency(balance)}</p>
        <div className="mt-3 h-12" aria-label="Portfolio value sparkline">
          {sparklinePoints.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklinePoints} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
                <Line type="monotone" dataKey="value" stroke="#0a84ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center text-xs text-slate-500">Sparkline appears after more data.</div>
          )}
        </div>
      </MetricCard>

      <MetricCard loading={loading}>
        <p className="text-xs font-semibold uppercase text-slate-400">Total P&L</p>
        <p className={clsx("mt-3 text-2xl font-semibold", pnlIsPositive ? "text-emerald-300" : "text-red-300")}>
          {formatCurrency(totalPnl, true)}
        </p>
        <p className="mt-2 text-xs text-slate-400">{formatPercent(totalPnlPct, 2)} total return</p>
      </MetricCard>

      <MetricCard loading={loading}>
        <p className="text-xs font-semibold uppercase text-slate-400">Win Rate</p>
        <p className={clsx("mt-3 text-2xl font-semibold", winRate >= 50 ? "text-emerald-300" : "text-amber-200")}>
          {formatPercent(winRate)}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-label="Win rate progress">
          <div
            className={clsx("h-full rounded-full", winRate >= 50 ? "bg-emerald-400" : "bg-amber-300")}
            style={{ width: `${winRate}%` }}
          />
        </div>
      </MetricCard>

      <MetricCard loading={loading}>
        <p className="text-xs font-semibold uppercase text-slate-400">Active Positions</p>
        <p className="mt-3 text-2xl font-semibold text-cyan-100">{formatNumber(activePositionCount)}</p>
        <div className="mt-3 flex min-h-7 flex-wrap gap-1.5" aria-label="Active asset badges">
          {activeAssets.length > 0 ? (
            activeAssets.map((asset) => (
              <span
                key={asset}
                className="flex h-7 min-w-7 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/15 px-1.5 text-[0.68rem] font-semibold text-sky-100"
              >
                {asset.slice(0, 3)}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">No active assets yet.</span>
          )}
        </div>
      </MetricCard>
    </section>
  );
}

function MetricCard({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.065]">
      {loading ? (
        <div data-testid="hero-card-skeleton" className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-8 w-32 animate-pulse rounded bg-white/15" />
          <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
