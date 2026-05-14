import type { AgentSession } from "@/lib/types";
import { formatNumber } from "../format";

type ActiveSubagentsProps = {
  sessions: AgentSession[];
};

export function ActiveSubagents({ sessions }: ActiveSubagentsProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Active Subagents</h2>
          <p className="mt-1 text-sm text-slate-400">Open child-agent work detected in recent local sessions.</p>
        </div>
        <span className="rounded border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-200">
          {formatNumber(sessions.length)}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <article key={session.id} className="rounded-md border border-white/10 bg-black/15 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-50">{session.agent ?? "subagent"}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">{session.id.slice(0, 8)}</p>
                </div>
                <span className="shrink-0 rounded border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-200">
                  active
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                <span>{formatNumber(session.duration_mins)}m observed</span>
                <span>{formatNumber(session.tokens_used)} tokens</span>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-md border border-white/10 bg-black/15 p-4 text-sm text-slate-400">
            No active subagents detected.
          </p>
        )}
      </div>
    </section>
  );
}
