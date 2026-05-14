"use client";

import { ActiveSubagents } from "@/components/Agents/ActiveSubagents";
import { SessionsList } from "@/components/Agents/SessionsList";
import { TokenUsage } from "@/components/Agents/TokenUsage";
import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { AgentsResponse } from "@/lib/types";
import { formatNumber } from "../format";

export function AgentsPageContent() {
  const agentsState = useAutoRefresh<AgentsResponse>({ endpoint: "/api/agents" });
  const activeSubagents =
    agentsState.data?.sessions.filter((session) => session.type === "subagent" && session.status === "active") ?? [];

  return (
    <AppShell
      active="agents"
      title="Agents & Sessions"
      description="Local session, sub-agent, and token visibility across Codex and OpenClaw-facing traces."
      onRefresh={agentsState.refresh}
    >
      <ErrorPanel title="Agents feed error" error={agentsState.error} onRetry={agentsState.refresh} />

      {agentsState.data ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Agents summary">
            <SummaryCard label="Sessions Today" value={formatNumber(agentsState.data.stats.total_sessions_today)} />
            <SummaryCard label="Tokens Today" value={formatNumber(agentsState.data.stats.total_tokens_today)} />
            <SummaryCard label="Avg Duration" value={`${formatNumber(agentsState.data.stats.avg_session_mins)}m`} />
            <SummaryCard label="Active Now" value={formatNumber(agentsState.data.stats.active_sessions)} />
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <TokenUsage stats={agentsState.data.stats} currentModel={agentsState.data.current_model} />
            <ActiveSubagents sessions={activeSubagents} />
          </div>

          <SessionsList sessions={agentsState.data.sessions} />
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
          Loading agents...
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}
