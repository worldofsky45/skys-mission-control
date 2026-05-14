import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { paths } from "./constants";
import type { AgentSession, AgentSessionStatus, AgentSessionType, AgentsResponse } from "./types";

const SESSION_LIMIT = 40;
const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const DEFAULT_MODEL = "unknown";

type SessionDraft = {
  id: string;
  type: AgentSessionType;
  started_at: string;
  ended_at: string | null;
  last_event_at: string;
  tokens_used: number;
  status: AgentSessionStatus;
  agent?: string;
  model?: string;
};

export async function getAgents(): Promise<AgentsResponse> {
  return loadAgents(paths.codexSessions);
}

export async function loadAgents(
  sessionsRoot: string,
  now = new Date(),
): Promise<AgentsResponse> {
  const files = await listJsonlFiles(sessionsRoot);
  const sessions = (
    await Promise.all(files.slice(0, SESSION_LIMIT).map((file) => parseSessionFile(file, now)))
  )
    .filter((session): session is AgentSession => Boolean(session))
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
  const todayKey = dateKey(now);
  const sessionsToday = sessions.filter((session) => dateKey(new Date(session.started_at)) === todayKey);
  const totalTokensToday = sessionsToday.reduce((sum, session) => sum + session.tokens_used, 0);
  const completedSessions = sessionsToday.filter((session) => session.status === "completed").length;
  const activeSessions = sessionsToday.filter((session) => session.status === "active").length;
  const failedSessions = sessionsToday.filter((session) => session.status === "failed").length;
  const avgSessionMins =
    sessionsToday.length === 0
      ? 0
      : Math.round(sessionsToday.reduce((sum, session) => sum + session.duration_mins, 0) / sessionsToday.length);
  const currentModel = sessions[0]?.model ?? DEFAULT_MODEL;

  return {
    sessions,
    stats: {
      total_sessions_today: sessionsToday.length,
      total_tokens_today: totalTokensToday,
      avg_session_mins: avgSessionMins,
      active_sessions: activeSessions,
      completed_sessions: completedSessions,
      failed_sessions: failedSessions,
    },
    current_model: currentModel,
    default_model: currentModel,
  };
}

async function listJsonlFiles(root: string): Promise<string[]> {
  const files: Array<{ path: string; mtimeMs: number }> = [];

  async function visit(dir: string) {
    let entries: Dirent[];

    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (isMissingFile(error)) {
        return;
      }

      throw error;
    }

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await visit(entryPath);
          return;
        }

        if (!entry.isFile() || !entry.name.endsWith(".jsonl")) {
          return;
        }

        const fileStat = await stat(entryPath);
        files.push({ path: entryPath, mtimeMs: fileStat.mtimeMs });
      }),
    );
  }

  await visit(root);

  return files.sort((a, b) => b.mtimeMs - a.mtimeMs).map((file) => file.path);
}

async function parseSessionFile(file: string, now: Date): Promise<AgentSession | null> {
  const content = await readFile(file, "utf8");
  let draft: SessionDraft | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const event = safeParseJson(trimmed);

    if (!event || typeof event !== "object") {
      continue;
    }

    const timestamp = getString(event, "timestamp") ?? getString(event, "ts");
    const type = getString(event, "type");
    const payload = getObject(event, "payload");

    if (timestamp && draft) {
      draft.last_event_at = timestamp;
    }

    if (type === "session_meta" && payload) {
      const id = getString(payload, "id");
      const startedAt = getString(payload, "timestamp") ?? timestamp;

      if (!id || !startedAt) {
        continue;
      }

      const source = getObject(payload, "source");
      const subagent = source ? getObject(source, "subagent") : null;
      const agent = getSubagentName(subagent) ?? getString(payload, "originator") ?? "Codex";
      const threadSource = getString(payload, "thread_source");
      const model = getString(payload, "model") ?? getString(payload, "model_provider");
      draft = {
        id,
        type: subagent || threadSource === "subagent" ? "subagent" : "codex",
        started_at: startedAt,
        ended_at: null,
        last_event_at: timestamp ?? startedAt,
        tokens_used: 0,
        status: "active",
        agent,
        model,
      };
      continue;
    }

    if (!draft || !payload) {
      continue;
    }

    if (type === "event_msg") {
      const payloadType = getString(payload, "type");

      if (payloadType === "token_count") {
        draft.tokens_used = Math.max(draft.tokens_used, extractTokenCount(payload));
      }

      if (payloadType === "task_complete") {
        draft.status = "completed";
        draft.ended_at = timestamp ?? draft.last_event_at;
      }
    }

    if (type === "event_msg" && getString(payload, "type") === "task_failed") {
      draft.status = "failed";
      draft.ended_at = timestamp ?? draft.last_event_at;
    }
  }

  if (!draft) {
    return null;
  }

  if (draft.status === "active") {
    const lastEventMs = new Date(draft.last_event_at).getTime();

    if (!Number.isNaN(lastEventMs) && now.getTime() - lastEventMs > ACTIVE_WINDOW_MS) {
      draft.status = "completed";
      draft.ended_at = draft.last_event_at;
    }
  }

  return {
    id: draft.id,
    type: draft.type,
    started_at: draft.started_at,
    ended_at: draft.ended_at,
    duration_mins: durationMinutes(draft.started_at, draft.ended_at ?? draft.last_event_at),
    tokens_used: draft.tokens_used,
    status: draft.status,
    agent: draft.agent,
    model: draft.model,
  };
}

function extractTokenCount(payload: Record<string, unknown>): number {
  const info = getObject(payload, "info");
  const total = info ? getObject(info, "total_token_usage") : null;
  return total ? getNumber(total, "total_tokens") ?? 0 : 0;
}

function getSubagentName(value: Record<string, unknown> | null): string | undefined {
  if (!value) {
    return undefined;
  }

  for (const entry of Object.values(value)) {
    if (typeof entry === "string") {
      return entry;
    }
  }

  return "subagent";
}

function durationMinutes(start: string, end: string): number {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return 0;
  }

  return Math.round((endMs - startMs) / 60_000);
}

function dateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

function safeParseJson(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getObject(record: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
