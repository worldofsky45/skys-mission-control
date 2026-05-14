import { paths } from "./constants";
import { appendJsonl, readJsonFile, writeJsonAtomic } from "./file-store";
import { ideaActionRequestSchema, ideasStateSchema } from "./schemas";
import type { Idea, IdeaAction, IdeasState } from "./types";

export class IdeaStateError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "IdeaStateError";
  }
}

export async function listIdeas(): Promise<IdeasState & { counts: Record<string, number> }> {
  const state = await loadIdeasState();
  const sortedPending = [...state.pending].sort(comparePendingIdeas);

  return {
    ...state,
    pending: sortedPending,
    counts: {
      pending: state.pending.length,
      approved: state.approved.length,
      rejected: state.rejected.length,
      queued: state.queued.length,
    },
  };
}

export async function approveIdea(requestBody: unknown): Promise<Idea> {
  const request = ideaActionRequestSchema.parse(requestBody);
  const state = await loadIdeasState();
  const index = state.pending.findIndex((idea) => idea.id === request.id);

  assertPendingTarget(state, request.id, index);

  const now = new Date();
  const approvedIdea: Idea = {
    ...state.pending[index],
    status: "active",
    approved: now.toISOString().slice(0, 10),
    approved_date: now.toISOString(),
    week: 1,
    next_milestone: addDays(now, 14).toISOString(),
  };

  const nextState: IdeasState = {
    ...state,
    pending: state.pending.filter((idea) => idea.id !== request.id),
    approved: [...state.approved, approvedIdea],
    last_updated: now.toISOString(),
  };

  await writeJsonAtomic(paths.ideasState, nextState);
  await appendIdeaAction({
    timestamp: now.toISOString(),
    id: request.id,
    action: "approve",
    note: request.note,
  });

  return approvedIdea;
}

export async function rejectIdea(requestBody: unknown): Promise<Idea> {
  const request = ideaActionRequestSchema.parse(requestBody);
  const state = await loadIdeasState();
  const index = state.pending.findIndex((idea) => idea.id === request.id);

  assertPendingTarget(state, request.id, index);

  const now = new Date();
  const rejectedIdea: Idea = {
    ...state.pending[index],
    status: "rejected",
    rejected: now.toISOString().slice(0, 10),
    rejection_date: now.toISOString(),
  };

  const nextState: IdeasState = {
    ...state,
    pending: state.pending.filter((idea) => idea.id !== request.id),
    rejected: [...state.rejected, rejectedIdea],
    last_updated: now.toISOString(),
  };

  await writeJsonAtomic(paths.ideasState, nextState);
  await appendIdeaAction({
    timestamp: now.toISOString(),
    id: request.id,
    action: "reject",
    note: request.note,
  });

  return rejectedIdea;
}

async function loadIdeasState(): Promise<IdeasState> {
  const rawState = await readJsonFile(paths.ideasState);
  return ideasStateSchema.parse(rawState);
}

async function appendIdeaAction(action: IdeaAction): Promise<void> {
  await appendJsonl(paths.ideaActions, action);
}

function assertPendingTarget(state: IdeasState, id: string, pendingIndex: number): void {
  if (pendingIndex >= 0) {
    return;
  }

  const existsElsewhere = [...state.approved, ...state.rejected, ...state.queued].some(
    (idea) => idea.id === id,
  );

  if (existsElsewhere) {
    throw new IdeaStateError(`Idea ${id} is not pending`, 400);
  }

  throw new IdeaStateError(`Idea ${id} was not found`, 404);
}

function comparePendingIdeas(a: Idea, b: Idea): number {
  const tierDiff = (a.tier ?? Number.MAX_SAFE_INTEGER) - (b.tier ?? Number.MAX_SAFE_INTEGER);

  if (tierDiff !== 0) {
    return tierDiff;
  }

  return (b.stars ?? 0) - (a.stars ?? 0);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
