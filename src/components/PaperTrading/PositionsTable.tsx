"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { PaperPosition } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "../format";

type SortKey = "asset" | "unrealized_pnl" | "entry_date";

export function PositionsTable({ positions }: { positions: PaperPosition[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("unrealized_pnl");
  const sorted = useMemo(() => {
    return [...positions].sort((a, b) => {
      if (sortKey === "asset") {
        return a.asset.localeCompare(b.asset);
      }
      if (sortKey === "entry_date") {
        return Date.parse(b.entry_date) - Date.parse(a.entry_date);
      }
      return b.unrealized_pnl - a.unrealized_pnl;
    });
  }, [positions, sortKey]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-base font-semibold text-slate-50">Active Positions</h3>
        <div className="flex gap-2">
          {(["asset", "unrealized_pnl", "entry_date"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key)}
              className={clsx(
                "rounded border px-2.5 py-1 text-xs font-medium",
                sortKey === key ? "border-cyan-300/50 text-cyan-100" : "border-white/10 text-slate-300",
              )}
            >
              {key === "unrealized_pnl" ? "P&L" : key === "entry_date" ? "Date" : "Asset"}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          No active positions reported by Nova yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {sorted.map((position) => {
            const pnlProgress = Math.min(Math.abs(position.pnl_pct), 100);

            return (
              <article key={`${position.asset}-${position.entry_date}`} className="rounded-lg border border-white/10 bg-black/15 p-4 transition-colors hover:border-white/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/15 text-sm font-semibold text-sky-100">
                      {position.asset.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-50">{position.signal}</h4>
                      <p className="mt-1 text-xs text-slate-400">{position.asset} / {position.side.toUpperCase()}</p>
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "shrink-0 rounded-md px-2.5 py-1 text-sm font-semibold",
                      position.is_winning ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200",
                    )}
                  >
                    {formatCurrency(position.unrealized_pnl, true)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-400">{formatCurrency(position.entry_price)}</span>
                  <span className={position.is_winning ? "text-emerald-300" : "text-red-300"}>
                    {position.is_winning ? "up" : "down"}
                  </span>
                  <span className="font-medium text-slate-100">{formatCurrency(position.current_price)}</span>
                  <span className={position.is_winning ? "text-xs text-emerald-300" : "text-xs text-red-300"}>
                    {formatPercent(position.pnl_pct, 2)}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>P&L move</span>
                    <span>{formatPercent(Math.abs(position.pnl_pct), 2)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={clsx("h-full rounded-full", position.is_winning ? "bg-emerald-400" : "bg-red-400")}
                      style={{ width: `${pnlProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <Meta label="Qty" value={position.quantity.toFixed(4)} />
                  <Meta label="Value" value={formatCurrency(position.current_value)} />
                  <Meta label="Entry" value={formatDate(position.entry_date)} />
                </div>

                <button
                  type="button"
                  disabled
                  aria-label="Close disabled until close-position API is validated"
                  className="mt-4 rounded border border-white/10 px-2.5 py-1 text-xs text-slate-500"
                >
                  Close
                </button>
              </article>
            );
          })}
          <p className="mt-3 text-xs text-slate-500">Newest entry: {formatDate(sorted[0]?.entry_date)}</p>
        </div>
      )}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-2">
      <p className="text-[0.68rem] uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate font-medium text-slate-200">{value}</p>
    </div>
  );
}
