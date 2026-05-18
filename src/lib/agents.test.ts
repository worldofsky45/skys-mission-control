import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadAgents } from "./agents";

describe("agents loader", () => {
  it("summarizes Codex session metadata and token usage without transcript text", async () => {
    const fixture = await createAgentsFixture();
    const response = await loadAgents(fixture.sessionsDir, new Date("2026-05-08T23:25:00.000Z"));

    expect(response.stats).toMatchObject({
      total_sessions_today: 2,
      total_tokens_today: 4500,
      avg_session_mins: 20,
      active_sessions: 1,
      completed_sessions: 1,
    });
    expect(response.current_model).toBe("gpt-5.2");
    expect(response.default_model).toBe("gpt-5.2");
    expect(response.sessions.map((session) => session.id)).toEqual(["session-active", "session-complete"]);
    expect(response.sessions[0]).toMatchObject({
      type: "subagent",
      status: "active",
      tokens_used: 1500,
      agent: "explorer",
    });
    expect(JSON.stringify(response)).not.toContain("sensitive transcript text");
  });
});

async function createAgentsFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-agents-"));
  const sessionsDir = join(dir, "sessions", "2026", "05", "08");

  await mkdir(sessionsDir, { recursive: true });
  await writeFile(
    join(sessionsDir, "rollout-active.jsonl"),
    [
      JSON.stringify({
        timestamp: "2026-05-08T23:10:00.000Z",
        type: "session_meta",
        payload: {
          id: "session-active",
          timestamp: "2026-05-08T23:10:00.000Z",
          source: { subagent: { other: "explorer" } },
          thread_source: "subagent",
          model: "gpt-5.2",
        },
      }),
      JSON.stringify({
        timestamp: "2026-05-08T23:20:00.000Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              total_tokens: 1500,
            },
          },
        },
      }),
      JSON.stringify({
        timestamp: "2026-05-08T23:20:00.000Z",
        type: "response_item",
        payload: { type: "message", content: [{ type: "output_text", text: "sensitive transcript text" }] },
      }),
    ].join("\n") + "\n",
  );
  await writeFile(
    join(sessionsDir, "rollout-complete.jsonl"),
    [
      JSON.stringify({
        timestamp: "2026-05-08T20:00:00.000Z",
        type: "session_meta",
        payload: {
          id: "session-complete",
          timestamp: "2026-05-08T20:00:00.000Z",
          originator: "Codex Desktop",
          model: "gpt-5.2",
        },
      }),
      JSON.stringify({
        timestamp: "2026-05-08T20:30:00.000Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              total_tokens: 3000,
            },
          },
        },
      }),
      JSON.stringify({
        timestamp: "2026-05-08T20:30:00.000Z",
        type: "event_msg",
        payload: { type: "task_complete" },
      }),
    ].join("\n") + "\n",
  );

  return { sessionsDir: join(dir, "sessions") };
}
