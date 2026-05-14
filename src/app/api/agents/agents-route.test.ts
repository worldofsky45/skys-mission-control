import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("agents API route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns aggregated session metadata from configured Codex sessions", async () => {
    const fixture = await createAgentsFixture();
    process.env.CODEX_SESSIONS_PATH = fixture.sessionsDir;

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats.total_sessions_today).toBe(1);
    expect(body.stats.total_tokens_today).toBe(2000);
    expect(body.sessions[0].id).toBe("api-session");
  });

  it("returns an empty response when the sessions directory is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-agents-"));
    process.env.CODEX_SESSIONS_PATH = join(dir, "missing-sessions");

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessions).toEqual([]);
    expect(body.stats.total_sessions_today).toBe(0);
  });
});

async function createAgentsFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-agents-"));
  const sessionsDir = join(dir, "sessions");

  await mkdir(sessionsDir, { recursive: true });
  await writeFile(
    join(sessionsDir, "rollout-api.jsonl"),
    [
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: "session_meta",
        payload: {
          id: "api-session",
          timestamp: new Date().toISOString(),
          originator: "Codex Desktop",
          model: "gpt-5.2",
        },
      }),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              total_tokens: 2000,
            },
          },
        },
      }),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: "event_msg",
        payload: { type: "task_complete" },
      }),
    ].join("\n") + "\n",
  );

  return { sessionsDir };
}
