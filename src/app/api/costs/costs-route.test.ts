import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("costs API route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns aggregated cost data from the configured costs JSONL file", async () => {
    const costsPath = await createCostsFixture();
    process.env.COSTS_PATH = costsPath;

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.total_spent).toBe(60);
    expect(body.by_category).toEqual([{ category: "AI Services", amount: 60, pct: 100 }]);
    expect(body.recent_expenses).toHaveLength(3);
  });

  it("returns 503 when cost tracking has not been initialized", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-costs-"));
    process.env.COSTS_PATH = join(dir, "missing-costs.jsonl");

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("not initialized");
  });
});

async function createCostsFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-costs-"));
  const costsPath = join(dir, "costs.jsonl");

  await mkdir(dir, { recursive: true });
  await writeFile(
    costsPath,
    [
      JSON.stringify({ _schema: "Cost tracking" }),
      JSON.stringify({
        date: "2026-05-03",
        amount: 25,
        category: "AI Services",
        description: "OpenRouter API - Initial crypto intel",
      }),
      JSON.stringify({
        date: "2026-05-04",
        amount: 15,
        category: "AI Services",
        description: "OpenRouter API - Paper trading",
      }),
      JSON.stringify({
        date: "2026-05-05",
        amount: 20,
        category: "AI Services",
        description: "OpenRouter API - Mission Control",
      }),
    ].join("\n") + "\n",
  );

  return costsPath;
}
