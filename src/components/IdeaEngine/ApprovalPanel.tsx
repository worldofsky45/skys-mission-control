"use client";

import { useState } from "react";
import type { Idea } from "@/lib/types";

type ApprovalPanelProps = {
  idea: Idea;
  action: "approve" | "reject";
  onSubmit: (id: string, note: string) => Promise<void>;
  onCancel: () => void;
};

export function ApprovalPanel({ idea, action, onSubmit, onCancel }: ApprovalPanelProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const label = action === "approve" ? "Approve" : "Reject";

  async function submit() {
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(idea.id, note);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-white/10 bg-slate-950 p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-50">
            {label} {idea.name}
          </h3>
          <p className="mt-1 text-sm text-slate-400">This writes through a validated API route.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded border border-white/10 px-2 py-1 text-sm text-slate-300">
          Cancel
        </button>
      </div>

      <label className="mt-4 block text-sm text-slate-300" htmlFor="idea-note">
        Note
      </label>
      <textarea
        id="idea-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-2 min-h-24 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
      />

      <label className="mt-3 flex items-start gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span>Confirm this {action} write-back for Nova&apos;s idea state.</span>
      </label>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <button
        type="button"
        disabled={!confirmed || submitting}
        onClick={() => void submit()}
        className="mt-4 rounded bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
