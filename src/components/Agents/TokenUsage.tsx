import clsx from "clsx";
import type { AgentStats } from "@/lib/types";
import { formatNumber } from "../format";

type TokenUsageProps = {
  stats: AgentStats;
  currentModel: string;
};

export function TokenUsage({ stats, currentModel }: TokenUsageProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Token Usage</h2>
        <p className="mt-1 text-sm text-slate-400">Today&apos;s local token footprint by observed session metadata.</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric label="Current Model" value={currentModel} mono />
        <Metric label="Tokens Today" value={formatNumber(stats.total_tokens_today)} mono />
        <Metric label="Completed" value={formatNumber(stats.completed_sessions)} />
        <Metric label="Failed" value={formatNumber(stats.failed_sessions)} tone="text-red-200" />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  mono = false,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={clsx("mt-2 text-lg font-semibold", tone ?? "text-slate-50", mono && "font-mono")}>
        {value}
      </p>
    </div>
  );
}
