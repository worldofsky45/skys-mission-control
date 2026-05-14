import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("activity API route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T20:30:00.000Z"));
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
  });

  it("appends validated activity events with received_at metadata", async () => {
    const fixture = await createActivityFixture();
    process.env.ACTIVITY_LOG_PATH = fixture.activityLog;

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/activity", {
        method: "POST",
        body: JSON.stringify({
          type: "signal",
          system: "crypto-intel",
          title: "BTC breakout watch",
          summary: "Momentum improving into daily close.",
          timestamp: "2026-05-08T20:20:00.000Z",
          signals: [{ asset: "BTC", action: "watch", conviction: "medium", target: 69000 }],
        }),
      }),
    );
    const body = await response.json();
    const lines = (await readFile(fixture.activityLog, "utf8")).trim().split("\n");

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
      type: "signal",
      system: "crypto-intel",
      title: "BTC breakout watch",
      received_at: "2026-05-08T20:30:00.000Z",
    });
  });

  it("returns recent activity newest first and rejects invalid payloads", async () => {
    const fixture = await createActivityFixture();
    process.env.ACTIVITY_LOG_PATH = fixture.activityLog;
    await writeFile(
      fixture.activityLog,
      [
        JSON.stringify({
          type: "trade",
          system: "crypto-intel",
          title: "Paper trade closed",
          summary: "Closed SOL paper trade.",
          timestamp: "2026-05-08T18:00:00.000Z",
          received_at: "2026-05-08T18:00:10.000Z",
        }),
        JSON.stringify({
          type: "alert",
          system: "polymarket-intel",
          title: "Market edge moved",
          summary: "Odds moved outside target range.",
          timestamp: "2026-05-08T19:00:00.000Z",
          received_at: "2026-05-08T19:00:10.000Z",
        }),
      ].join("\n") + "\n",
    );

    const { GET, POST } = await import("./route");
    const response = await GET();
    const body = await response.json();
    const invalidResponse = await POST(
      new Request("http://localhost/api/activity", {
        method: "POST",
        body: JSON.stringify({ type: "signal", title: "" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(body.events.map((event: { title: string }) => event.title)).toEqual([
      "Market edge moved",
      "Paper trade closed",
    ]);
    expect(invalidResponse.status).toBe(400);
  });
});

async function createActivityFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-activity-"));
  const activityDir = join(dir, "mission-control");
  const activityLog = join(activityDir, "activity-feed.jsonl");

  await mkdir(activityDir, { recursive: true });

  return { activityLog };
}
