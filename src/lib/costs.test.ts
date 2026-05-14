import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { aggregateCosts, loadCosts } from "./costs";

describe("cost tracking", () => {
  it("skips schema rows and aggregates 15-day sprint spend", async () => {
    const costsFile = await createCostsFixture();
    const response = await loadCosts(costsFile, new Date("2026-05-05T12:00:00.000Z"));

    expect(response.summary).toMatchObject({
      total_spent: 60,
      daily_average: 20,
      days_elapsed: 3,
      days_remaining: 12,
      budget_total: 375,
      budget_used_pct: 16,
      projected_total: 300,
      on_track: true,
    });
    expect(response.by_category).toEqual([{ category: "AI Services", amount: 60, pct: 100 }]);
    expect(response.by_project).toEqual([
      { project: "Crypto Intel", amount: 40, pct: 66.67 },
      { project: "Mission Control", amount: 20, pct: 33.33 },
    ]);
    expect(response.daily_breakdown).toEqual([
      { date: "2026-05-03", amount: 25, running_total: 25 },
      { date: "2026-05-04", amount: 15, running_total: 40 },
      { date: "2026-05-05", amount: 20, running_total: 60 },
    ]);
    expect(response.recent_expenses.map((entry) => entry.date)).toEqual([
      "2026-05-05",
      "2026-05-04",
      "2026-05-03",
    ]);
  });

  it("returns a safe empty response when there are no cost entries", () => {
    const response = aggregateCosts([], new Date("2026-05-07T12:00:00.000Z"));

    expect(response.summary).toMatchObject({
      total_spent: 0,
      daily_average: 0,
      days_elapsed: 0,
      days_remaining: 15,
      projected_total: 0,
      on_track: true,
    });
    expect(response.by_category).toEqual([]);
    expect(response.by_project).toEqual([]);
    expect(response.daily_breakdown).toEqual([]);
  });
});

async function createCostsFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-costs-"));
  const costsFile = join(dir, "costs.jsonl");

  await mkdir(dir, { recursive: true });
  await writeFile(
    costsFile,
    [
      JSON.stringify({
        _schema: "Daily cost tracking. Each line = one expense entry.",
        _format: "JSONL - one JSON object per line",
      }),
      JSON.stringify({
        date: "2026-05-03",
        amount: 25,
        category: "AI Services",
        description: "OpenRouter API - Initial crypto intel + paper trading build",
      }),
      JSON.stringify({
        date: "2026-05-04",
        amount: 15,
        category: "AI Services",
        description: "OpenRouter API - Paper trading execution + refinements",
      }),
      JSON.stringify({
        date: "2026-05-05",
        amount: 20,
        category: "AI Services",
        description: "OpenRouter API - Mission Control integration + debugging",
      }),
    ].join("\n") + "\n",
  );

  return costsFile;
}
