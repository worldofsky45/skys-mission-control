import type { Idea } from "@/lib/types";
import { formatDate } from "../format";

export function ProgressTracker({ ideas }: { ideas: Idea[] }) {
  return (
    <section className="rounded-md border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-50">Approved Projects</h3>
        <span className="text-xs text-slate-400">{ideas.length} active</span>
      </div>

      {ideas.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          No approved projects yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {ideas.map((idea) => (
            <article key={idea.id} className="rounded border border-white/10 bg-black/15 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-50">{idea.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{idea.status ?? "active"}</p>
                </div>
                <span className="rounded border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100">
                  Week {idea.week ?? 1}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">Next milestone: {formatDate(idea.next_milestone)}</p>
              <p className="mt-2 text-sm text-slate-500">No metrics reported by Nova yet.</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
