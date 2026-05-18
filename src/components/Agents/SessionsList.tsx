import clsx from "clsx";
import type { AgentSession, AgentSessionStatus, AgentSessionType } from "@/lib/types";
import { formatDate, formatNumber } from "../format";

type SessionsListProps = {
  sessions: AgentSession[];
};

const statusTone: Record<AgentSessionStatus, string> = {
  active: "border-cyan-300/30 text-cyan-200",
  completed: "border-emerald-400/25 text-emerald-200",
  failed: "border-red-400/30 text-red-200",
};

const typeTone: Record<AgentSessionType, string> = {
  codex: "text-slate-300",
  openclaw: "text-violet-200",
  subagent: "text-cyan-200",
};

export function SessionsList({ sessions }: SessionsListProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Recent Sessions</h2>
        <p className="mt-1 text-sm text-slate-400">
          Metadata-only session visibility from local Codex traces.
        </p>
      </div>
      {sessions.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-500">
                <th className="pb-2 font-semibold">Session</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Agent</th>
                <th className="pb-2 font-semibold">Started</th>
                <th className="pb-2 text-right font-semibold">Duration</th>
                <th className="pb-2 text-right font-semibold">Tokens</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="py-3 font-mono text-xs text-slate-200">{session.id.slice(0, 8)}</td>
                  <td className={clsx("py-3 font-medium capitalize", typeTone[session.type])}>{session.type}</td>
                  <td className="py-3 text-slate-300">{session.agent ?? "Unknown"}</td>
                  <td className="py-3 text-slate-400">{formatDate(session.started_at)}</td>
                  <td className="py-3 text-right text-slate-300">{formatNumber(session.duration_mins)}m</td>
                  <td className="py-3 text-right font-mono text-slate-100">{formatNumber(session.tokens_used)}</td>
                  <td className="py-3 text-right">
                    <span
                      className={clsx(
                        "inline-flex rounded border px-2 py-1 text-xs font-semibold capitalize",
                        statusTone[session.status],
                      )}
                    >
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-white/10 bg-black/15 p-4 text-sm text-slate-400">
          No local sessions found yet.
        </p>
      )}
    </section>
  );
}
