import clsx from "clsx";
import type { ArbitrageMonitorResponse, ArbitrageOpportunity } from "@/lib/types";
import { formatDate, formatNumber } from "../format";

type ArbitrageMonitorProps = {
  data: ArbitrageMonitorResponse | null;
  loading?: boolean;
};

const statusTone = {
  opportunities: "border-emerald-300/30 text-emerald-200",
  monitoring: "border-sky-300/30 text-sky-200",
  stale: "border-amber-300/30 text-amber-200",
  missing: "border-slate-300/20 text-slate-300",
};

export function ArbitrageMonitor({ data, loading = false }: ArbitrageMonitorProps) {
  const opportunities = data?.opportunities ?? [];
  const status = data?.status ?? "missing";

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-50">Arbitrage Monitor</h3>
          <p className="mt-1 text-sm text-slate-400">
            {loading ? "Checking cross-market cache..." : data?.message ?? "Arbitrage monitor not loaded yet"}
          </p>
        </div>
        <span className={clsx("w-fit rounded border px-2 py-1 text-xs font-semibold", statusTone[status])}>
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Opportunities" value={`${formatNumber(data?.profitable_count ?? 0)} ${data?.profitable_count === 1 ? "opportunity" : "opportunities"}`} />
        <Metric label="Matches Scanned" value={formatNumber(data?.total_matches ?? 0)} />
        <Metric label="Last Scan" value={formatDate(data?.timestamp)} />
      </div>

      {opportunities.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {opportunities.slice(0, 3).map((opportunity) => (
            <OpportunityRow key={`${opportunity.kalshi_market.id ?? opportunity.kalshi_market.title}-${opportunity.polymarket_market.id ?? opportunity.polymarket_market.title}`} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          No current opportunities above threshold.
        </p>
      )}
    </section>
  );
}

function OpportunityRow({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/15 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-6 text-slate-50">{opportunity.kalshi_market.title}</p>
          <p className="mt-1 text-sm text-slate-400">{opportunity.polymarket_market.title}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded border border-white/10 px-2 py-1">{strategyLabel(opportunity.arbitrage.strategy)}</span>
            <span className="rounded border border-white/10 px-2 py-1">
              Spread {(opportunity.arbitrage.spread * 100).toFixed(2)}%
            </span>
            {typeof opportunity.similarity_score === "number" ? (
              <span className="rounded border border-white/10 px-2 py-1">
                Match {(opportunity.similarity_score * 100).toFixed(0)}%
              </span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-left lg:text-right">
          <p className="text-xs text-slate-400">Profit</p>
          <p className="mt-1 text-xl font-semibold text-emerald-300">
            {opportunity.arbitrage.profit_pct.toFixed(2)}%
          </p>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/15 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function statusLabel(status: ArbitrageMonitorResponse["status"]): string {
  if (status === "opportunities") {
    return "Opportunities";
  }

  if (status === "stale") {
    return "Stale";
  }

  if (status === "missing") {
    return "Missing";
  }

  return "Monitoring";
}

function strategyLabel(strategy: string): string {
  if (strategy === "buy_polymarket_sell_kalshi") {
    return "Buy Polymarket, sell Kalshi";
  }

  if (strategy === "buy_kalshi_sell_polymarket") {
    return "Buy Kalshi, sell Polymarket";
  }

  return strategy.replaceAll("_", " ");
}
