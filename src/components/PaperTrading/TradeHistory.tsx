"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { PaperTrade } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "../format";

export function TradeHistory({ trades }: { trades: PaperTrade[] }) {
  const [filter, setFilter] = useState("");
  const closedTrades = trades.filter((trade) => trade.status === "closed" || trade.status === "partial");
  const filteredTrades = useMemo(() => {
    const query = filter.trim().toLowerCase();

    if (!query) {
      return closedTrades;
    }

    return closedTrades.filter((trade) =>
      [trade.asset, trade.signal, trade.outcome ?? ""].some((value) => value.toLowerCase().includes(query)),
    );
  }, [closedTrades, filter]);

  function exportCsv() {
    const header = ["date", "asset", "signal", "outcome", "pnl", "pnl_pct"];
    const lines = filteredTrades.map((trade) =>
      [
        trade.date,
        trade.asset,
        trade.signal,
        trade.outcome ?? "",
        String(trade.pnl ?? 0),
        String(trade.pnl_pct ?? 0),
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mission-control-paper-trades.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-md border border-white/10 bg-white/[0.055] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-base font-semibold text-slate-50">Closed Trades</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="closed-trade-filter">
            Filter closed trades
          </label>
          <input
            id="closed-trade-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
            placeholder="Filter"
          />
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredTrades.length === 0}
            className="rounded border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-200 disabled:text-slate-600"
          >
            Export CSV
          </button>
        </div>
      </div>

      {closedTrades.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          No closed trades yet
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Asset</th>
                <th className="py-2 pr-4 font-medium">Result</th>
                <th className="py-2 pr-4 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {filteredTrades.map((trade) => (
                <tr key={trade.id}>
                  <td className="py-3 pr-4">{formatDate(trade.created_at)}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-50">{trade.asset}</td>
                  <td className="py-3 pr-4 text-slate-300">{trade.outcome ?? "closed"}</td>
                  <td className={clsx("py-3 pr-4 font-semibold", (trade.pnl ?? 0) >= 0 ? "text-emerald-300" : "text-red-300")}>
                    {formatCurrency(trade.pnl ?? 0, true)}
                    <span className="ml-2 text-xs text-slate-500">{formatPercent(trade.pnl_pct ?? 0)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTrades.length === 0 ? <p className="mt-3 text-sm text-slate-400">No matching trades.</p> : null}
        </div>
      )}
    </section>
  );
}
