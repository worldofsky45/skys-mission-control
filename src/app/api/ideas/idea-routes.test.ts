import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("idea API routes", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("lists ideas grouped by status and sorts pending by tier then stars", async () => {
    const { ideasPath, actionsPath } = await createIdeasFixture();
    process.env.IDEAS_STATE_PATH = ideasPath;
    process.env.IDEA_ACTIONS_PATH = actionsPath;

    const { GET } = await import("./list/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.counts).toEqual({ pending: 2, approved: 1, rejected: 0, queued: 0 });
    expect(body.pending.map((idea: { id: string }) => idea.id)).toEqual([
      "tier-one-five",
      "tier-two-five",
    ]);
  });

  it("approves a pending idea with atomic state update and audit log", async () => {
    const { ideasPath, actionsPath } = await createIdeasFixture();
    process.env.IDEAS_STATE_PATH = ideasPath;
    process.env.IDEA_ACTIONS_PATH = actionsPath;

    const { POST } = await import("./approve/route");
    const response = await POST(
      new Request("http://localhost/api/ideas/approve", {
        method: "POST",
        body: JSON.stringify({ id: "tier-one-five", note: "Start now" }),
      }),
    );
    const body = await response.json();
    const updatedState = JSON.parse(await readFile(ideasPath, "utf8"));
    const auditLines = (await readFile(actionsPath, "utf8")).trim().split("\n");

    expect(response.status).toBe(200);
    expect(body.idea).toMatchObject({ id: "tier-one-five", status: "active", week: 1 });
    expect(updatedState.pending.map((idea: { id: string }) => idea.id)).toEqual([
      "tier-two-five",
    ]);
    expect(updatedState.approved.map((idea: { id: string }) => idea.id)).toContain(
      "tier-one-five",
    );
    expect(JSON.parse(auditLines[0] ?? "{}")).toMatchObject({
      id: "tier-one-five",
      action: "approve",
      note: "Start now",
    });
  });

  it("rejects a pending idea and appends a reject audit event", async () => {
    const { ideasPath, actionsPath } = await createIdeasFixture();
    process.env.IDEAS_STATE_PATH = ideasPath;
    process.env.IDEA_ACTIONS_PATH = actionsPath;

    const { POST } = await import("./reject/route");
    const response = await POST(
      new Request("http://localhost/api/ideas/reject", {
        method: "POST",
        body: JSON.stringify({ id: "tier-two-five", note: "Not this sprint" }),
      }),
    );
    const body = await response.json();
    const updatedState = JSON.parse(await readFile(ideasPath, "utf8"));
    const auditLines = (await readFile(actionsPath, "utf8")).trim().split("\n");

    expect(response.status).toBe(200);
    expect(body.idea).toMatchObject({ id: "tier-two-five", status: "rejected" });
    expect(updatedState.rejected.map((idea: { id: string }) => idea.id)).toEqual([
      "tier-two-five",
    ]);
    expect(JSON.parse(auditLines[0] ?? "{}")).toMatchObject({
      id: "tier-two-five",
      action: "reject",
      note: "Not this sprint",
    });
  });

  it("rejects unknown or non-pending ideas without changing the state file", async () => {
    const { ideasPath, actionsPath } = await createIdeasFixture();
    process.env.IDEAS_STATE_PATH = ideasPath;
    process.env.IDEA_ACTIONS_PATH = actionsPath;
    const originalState = await readFile(ideasPath, "utf8");

    const approve = await import("./approve/route");
    const unknownResponse = await approve.POST(
      new Request("http://localhost/api/ideas/approve", {
        method: "POST",
        body: JSON.stringify({ id: "missing", note: "" }),
      }),
    );
    const nonPendingResponse = await approve.POST(
      new Request("http://localhost/api/ideas/approve", {
        method: "POST",
        body: JSON.stringify({ id: "already-approved", note: "" }),
      }),
    );

    expect(unknownResponse.status).toBe(404);
    expect(nonPendingResponse.status).toBe(400);
    await expect(readFile(ideasPath, "utf8")).resolves.toBe(originalState);
  });
});

async function createIdeasFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-ideas-"));
  const ideasPath = join(dir, "ideas-state.json");
  const actionsPath = join(dir, "idea-engine-actions.jsonl");

  await writeFile(
    ideasPath,
    JSON.stringify(
      {
        pending: [
          {
            id: "tier-two-five",
            name: "Tier Two",
            tier: 2,
            stars: 5,
            one_liner: "Second tier",
            roi_potential: "$1K",
            complexity: "Easy",
            capital_required: "$0",
            feedback_loop: "7 days",
          },
          {
            id: "tier-one-five",
            name: "Tier One",
            tier: 1,
            stars: 5,
            one_liner: "First tier",
            roi_potential: "$5K",
            complexity: "Easy",
            capital_required: "$0",
            feedback_loop: "48 hours",
          },
        ],
        approved: [
          {
            id: "already-approved",
            name: "Already Approved",
            approved: "2026-05-04",
            status: "active",
            week: 1,
            next_milestone: "2026-05-18",
          },
        ],
        rejected: [],
        queued: [],
      },
      null,
      2,
    ),
  );

  return { ideasPath, actionsPath };
}
