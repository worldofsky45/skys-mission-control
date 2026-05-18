"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { ApprovalPanel } from "@/components/IdeaEngine/ApprovalPanel";
import { IdeaCard } from "@/components/IdeaEngine/IdeaCard";
import { ProgressTracker } from "@/components/IdeaEngine/ProgressTracker";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { approveIdea, rejectIdea } from "@/lib/api";
import type { Idea, IdeasResponse } from "@/lib/types";

type PendingIdeaAction = {
  idea: Idea;
  action: "approve" | "reject";
};

export function IdeasPageContent() {
  const ideasState = useAutoRefresh<IdeasResponse>({ endpoint: "/api/ideas/list" });
  const [pendingIdeaAction, setPendingIdeaAction] = useState<PendingIdeaAction | null>(null);

  async function handleIdeaAction(id: string, note: string) {
    if (!pendingIdeaAction) {
      return;
    }

    if (pendingIdeaAction.action === "approve") {
      await approveIdea(id, note);
    } else {
      await rejectIdea(id, note);
    }

    await ideasState.refresh();
    setPendingIdeaAction(null);
  }

  return (
    <AppShell
      active="ideas"
      title="Idea Engine"
      description="Use this page to approve, reject, and track Nova-generated opportunities."
      onRefresh={ideasState.refresh}
    >
      <ErrorPanel title="Idea Engine error" error={ideasState.error} onRetry={ideasState.refresh} />
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-50">Pending Decisions</h2>
          <span className="text-xs text-slate-400">{ideasState.data?.counts.pending ?? 0} pending</span>
        </div>
        {(ideasState.data?.pending ?? []).length > 0 ? (
          ideasState.data?.pending.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onApprove={(nextIdea) => setPendingIdeaAction({ idea: nextIdea, action: "approve" })}
              onReject={(nextIdea) => setPendingIdeaAction({ idea: nextIdea, action: "reject" })}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-white/10 p-4 text-sm text-slate-400">
            No pending ideas.
          </p>
        )}
      </section>

      {pendingIdeaAction ? (
        <ApprovalPanel
          idea={pendingIdeaAction.idea}
          action={pendingIdeaAction.action}
          onSubmit={handleIdeaAction}
          onCancel={() => setPendingIdeaAction(null)}
        />
      ) : null}

      <ProgressTracker ideas={ideasState.data?.approved ?? []} />
    </AppShell>
  );
}
