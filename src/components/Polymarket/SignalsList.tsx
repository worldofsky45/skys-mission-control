"use client";

import { useState } from "react";
import clsx from "clsx";
import type { EnrichedPolymarketSignal } from "@/lib/types";
import { resolvePolymarketSignal, type PolymarketOutcomeRequest } from "@/lib/api";
import { formatCurrency } from "../format";

type SignalsListProps = {
  signals: EnrichedPolymarketSignal[];
  onResolved?: (request: PolymarketOutcomeRequest) => Promise<void>;
};

export function SignalsList({ signals, onResolved = defaultResolve }: SignalsListProps) {
  const activeSignals = signals.filter((signal) => !signal.resolved);
  const [selected, setSelected] = useState<EnrichedPolymarketSignal | null>(null);
  const [actualOdds, setActualOdds] = useState("0.50");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(outcome: "won" | "lost") {
    if (!selected) {
      return;
    }

    const request = {
      signal_id: selected.id,
      outcome,
      actual_odds: Number(actualOdds),
    };

    setSubmitting(true);
    setError(null);

    try {
      await onResolved(request);
      setSelected(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to resolve signal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-50">Polymarket Signals</h3>
        <span className="text-xs text-slate-400">{activeSignals.length} active</span>
      </div>

      {activeSignals.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          No active Polymarket signals.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {activeSignals.map((signal) => {
            const confidence = Number(signal.confidence ?? 0);
            const oddsMove = getOddsMove(signal.entry_odds, signal.current_odds);
            const prediction = signal.prediction.toUpperCase();

            return (
              <article key={signal.id} className="rounded-lg border border-white/10 bg-black/15 p-4 transition-colors hover:border-white/20">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-semibold leading-6 text-slate-50">{signal.market}</p>
                      <span
                        className={clsx(
                          "rounded px-2 py-1 text-xs font-semibold",
                          signal.status === "active"
                            ? "bg-sky-500/20 text-sky-200"
                            : signal.status === "won"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : signal.status === "lost"
                                ? "bg-red-500/20 text-red-200"
                                : "bg-slate-500/20 text-slate-200",
                        )}
                      >
                        {signal.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={clsx(
                          "rounded-md px-3 py-1 font-semibold",
                          prediction === "YES"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : prediction === "NO"
                              ? "bg-red-500/20 text-red-200"
                              : "bg-slate-500/20 text-slate-200",
                        )}
                      >
                        {prediction}
                      </span>
                      <span
                        className={clsx(
                          "rounded-md border px-2 py-1 font-semibold",
                          confidence >= 70
                            ? "border-emerald-300/30 text-emerald-200"
                            : "border-amber-300/30 text-amber-200",
                        )}
                      >
                        {confidence}% confidence
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded border border-white/10 px-2 py-1 text-slate-300">
                        Entry {signal.entry_odds ?? "n/a"}
                      </span>
                      <span className="rounded border border-white/10 px-2 py-1 text-slate-300">
                        Current {signal.current_odds ?? "n/a"}
                      </span>
                      {oddsMove ? (
                        <span className={clsx("rounded border px-2 py-1 font-semibold", oddsMove.positive ? "border-emerald-300/30 text-emerald-200" : "border-red-300/30 text-red-200")}>
                          {oddsMove.positive ? "up" : "down"} {oddsMove.percent}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-xs text-slate-400">Potential P&L</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                      {formatCurrency(signal.potential_pnl)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(signal);
                        setActualOdds(String(signal.current_odds ?? signal.entry_odds ?? "0.50"));
                      }}
                      className="mt-3 rounded border border-cyan-300/30 px-3 py-1.5 text-sm font-medium text-cyan-100 hover:border-cyan-200"
                      aria-label={`Resolve ${signal.id}`}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-md border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-50">Resolve Signal</h4>
            <p className="mt-2 text-sm text-slate-300">{selected.market}</p>
            <label className="mt-4 block text-sm text-slate-300" htmlFor="actual-odds">
              Actual odds
            </label>
            <input
              id="actual-odds"
              value={actualOdds}
              onChange={(event) => setActualOdds(event.target.value)}
              className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300/60"
              inputMode="decimal"
            />
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit("won")}
                className="rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60"
              >
                Mark won
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit("lost")}
                className="rounded bg-red-400 px-3 py-2 text-sm font-semibold text-red-950 disabled:opacity-60"
              >
                Mark lost
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded border border-white/10 px-3 py-2 text-sm font-medium text-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getOddsMove(
  entry: number | string | undefined,
  current: number | string | null | undefined,
): { positive: boolean; percent: string } | null {
  const entryNumber = Number(entry);
  const currentNumber = Number(current);

  if (!Number.isFinite(entryNumber) || !Number.isFinite(currentNumber) || entryNumber === 0) {
    return null;
  }

  const change = ((currentNumber - entryNumber) / entryNumber) * 100;

  return {
    positive: change >= 0,
    percent: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
  };
}

async function defaultResolve(request: PolymarketOutcomeRequest): Promise<void> {
  await resolvePolymarketSignal(request);
}
