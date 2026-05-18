"use client";

import { useState } from "react";
import clsx from "clsx";
import type { ActivityEventRecord, ActivityEventType } from "@/lib/types";
import { formatDate, formatNumber } from "./format";

type ActivityFeedProps = {
  events: ActivityEventRecord[];
  loading?: boolean;
};

const typeTone: Record<ActivityEventType, string> = {
  signal: "border-cyan-300/30 text-cyan-200",
  cost: "border-amber-300/30 text-amber-200",
  trade: "border-emerald-400/25 text-emerald-200",
  alert: "border-red-400/30 text-red-200",
};

export function ActivityFeed({ events, loading = false }: ActivityFeedProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const visibleEvents = events.slice(0, 20);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Activity Feed</h2>
          <p className="mt-1 text-sm text-slate-400">Recent signals, trades, costs, and alerts from local agents.</p>
        </div>
        <span className="rounded border border-white/10 px-2 py-1 text-xs font-semibold text-slate-300">
          {formatNumber(visibleEvents.length)}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => {
            const isExpanded = expanded === event.received_at;
            const hasDetails = Boolean(event.signals?.length || event.opportunities?.length);

            return (
              <article key={`${event.received_at}-${event.title}`} className="rounded-md border border-white/10 bg-black/15 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={clsx("rounded border px-2 py-1 text-xs font-semibold", typeTone[event.type])}>
                        {event.type}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{event.system}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-50">{event.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{event.summary}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(event.timestamp)}</p>
                  </div>

                  {hasDetails ? (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Hide" : "Show"} details for ${event.title}`}
                      onClick={() => setExpanded(isExpanded ? null : event.received_at)}
                      className="shrink-0 rounded border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-white/30"
                    >
                      Details
                    </button>
                  ) : null}
                </div>

                {isExpanded ? <ActivityDetails event={event} /> : null}
              </article>
            );
          })
        ) : (
          <p className="rounded-md border border-white/10 bg-black/15 p-4 text-sm text-slate-400">
            {loading ? "Loading activity..." : "No activity events logged yet."}
          </p>
        )}
      </div>
    </section>
  );
}

function ActivityDetails({ event }: { event: ActivityEventRecord }) {
  return (
    <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 text-sm">
      {event.signals?.map((signal, index) => (
        <div key={`${signal.asset ?? "signal"}-${index}`} className="grid gap-2 rounded border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-5">
          <Detail label="Asset" value={signal.asset} />
          <Detail label="Action" value={signal.action} />
          <Detail label="Conviction" value={signal.conviction} />
          <Detail label="Target" value={signal.target != null ? formatNumber(signal.target) : undefined} />
          <Detail label="Stop" value={signal.stop != null ? formatNumber(signal.stop) : undefined} />
        </div>
      ))}
      {event.opportunities?.map((opportunity) => (
        <div key={opportunity.market} className="grid gap-2 rounded border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-4">
          <Detail label="Market" value={opportunity.market} />
          <Detail label="Odds" value={opportunity.odds} />
          <Detail label="Conviction" value={opportunity.conviction} />
          <Detail label="Edge" value={opportunity.edge} />
        </div>
      ))}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value ?? "Not reported"}</p>
    </div>
  );
}
