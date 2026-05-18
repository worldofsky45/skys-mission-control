import { useState } from "react";
import type { Idea } from "@/lib/types";
import clsx from "clsx";

type IdeaCardProps = {
  idea: Idea;
  onApprove: (idea: Idea) => void;
  onReject: (idea: Idea) => void;
};

export function IdeaCard({ idea, onApprove, onReject }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(idea.feedback_loop || idea.capital_required);
  const stars = Math.max(0, Math.min(5, idea.stars ?? 0));

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/[0.065]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className="text-amber-300"
              aria-label={`${stars} stars`}
              title={`${stars} stars`}
            >
              {"*".repeat(stars).padEnd(5, "-")}
            </span>
            <span className="sr-only">{stars} stars</span>
            <span
              className={clsx(
                "rounded px-2 py-1 font-semibold",
                idea.tier === 1
                  ? "bg-emerald-500/20 text-emerald-200"
                  : idea.tier === 2
                    ? "bg-amber-500/20 text-amber-200"
                    : idea.tier === 3
                      ? "bg-orange-500/20 text-orange-200"
                      : "bg-slate-500/20 text-slate-200",
              )}
            >
              Tier {idea.tier ?? "n/a"}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-50">{idea.name}</h3>
          <p className="mt-2 text-sm text-slate-300">{idea.one_liner ?? "No one-liner provided by Nova."}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onApprove(idea)}
            aria-label={`Approve ${idea.id}`}
            className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-emerald-950"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(idea)}
            aria-label={`Reject ${idea.id}`}
            className="rounded border border-red-300/30 px-3 py-1.5 text-sm font-medium text-red-200"
          >
            Reject
          </button>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Field label="ROI" value={idea.roi_potential} />
        <Field label="Complexity" value={idea.complexity} />
        <Field label="Capital" value={idea.capital_required} />
        <Field label="Feedback" value={idea.feedback_loop} />
      </dl>

      {hasDetails ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded border border-white/10 px-3 py-1.5 text-xs font-medium text-sky-100 transition-colors hover:border-sky-300/40"
          >
            {expanded ? "Hide details" : "See details"}
          </button>

          {expanded ? (
            <div className="mt-3 space-y-2 rounded-md border border-white/10 bg-black/15 p-3 text-sm text-slate-300">
              {idea.feedback_loop ? <Detail label="Feedback Loop" value={idea.feedback_loop} /> : null}
              {idea.capital_required ? <Detail label="Capital Required" value={idea.capital_required} /> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/15 p-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-200">{value ?? "Not reported"}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-slate-400">{label}:</span> {value}
    </p>
  );
}
