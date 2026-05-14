"use client";

import { useState } from "react";
import clsx from "clsx";
import type { HealthLevel, HealthStatus } from "@/lib/types";
import { formatDate } from "./format";

type SystemHealthProps = {
  health: HealthStatus | null;
  loading?: boolean;
  onRetry: () => void;
};

const severityLabel: Record<HealthLevel, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
};

const severityClasses: Record<HealthLevel, { text: string; dot: string; border: string }> = {
  healthy: {
    text: "text-emerald-200",
    dot: "bg-emerald-400",
    border: "border-emerald-400/30",
  },
  warning: {
    text: "text-amber-200",
    dot: "bg-amber-300",
    border: "border-amber-300/30",
  },
  critical: {
    text: "text-red-200",
    dot: "bg-red-400",
    border: "border-red-400/30",
  },
};

export function SystemHealth({ health, loading = false, onRetry }: SystemHealthProps) {
  const [expanded, setExpanded] = useState(false);
  const status = health?.status ?? "warning";
  const classes = severityClasses[status];
  const checks = health?.checks ?? [];
  const counts = checks.reduce(
    (accumulator, check) => ({
      ...accumulator,
      [check.status]: accumulator[check.status] + 1,
    }),
    { healthy: 0, warning: 0, critical: 0 } satisfies Record<HealthLevel, number>,
  );

  return (
    <section
      className={clsx(
        "rounded-lg border bg-white/[0.055] shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl",
        classes.border,
      )}
      aria-label="System health"
    >
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex min-w-0 items-center gap-4 text-left"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide health details" : "Show health details"}
        >
          <span className={clsx("h-4 w-4 shrink-0 animate-pulse rounded-full shadow-[0_0_24px_currentColor]", classes.dot)} />
          <span className="min-w-0">
            <span className={clsx("block text-lg font-semibold", classes.text)}>
              {status === "healthy" ? "All Systems Go" : status === "warning" ? "Attention Needed" : "Issues Detected"}
            </span>
            <span className="mt-1 block truncate text-sm text-slate-300">
              {loading ? "Checking workspace..." : health?.message ?? "Health not loaded yet"}
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 lg:justify-end">
          <HealthCount label="Healthy" value={counts.healthy} tone="text-emerald-200" />
          <HealthCount label="Warning" value={counts.warning} tone="text-amber-200" />
          <HealthCount label="Critical" value={counts.critical} tone="text-red-200" />
          <span className="w-full text-right text-slate-500 sm:w-auto">Updated {formatDate(health?.timestamp)}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded border border-white/10 px-2.5 py-1 font-medium text-slate-200 hover:border-white/30"
          >
            Retry
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="grid gap-2 md:grid-cols-2">
            {checks.map((check) => {
              const checkClasses = severityClasses[check.status];

              return (
                <div key={check.name} className="rounded border border-white/10 bg-black/15 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">{check.name}</p>
                    <span className={clsx("text-xs font-semibold", checkClasses.text)}>
                      {severityLabel[check.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{check.details}</p>
                  <p className="mt-2 text-xs text-slate-500">Updated {formatDate(check.last_updated)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function HealthCount({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className="rounded-md border border-white/10 bg-black/15 px-2.5 py-1">
      <span className={clsx("font-semibold", tone)}>{value}</span> {label}
    </span>
  );
}
