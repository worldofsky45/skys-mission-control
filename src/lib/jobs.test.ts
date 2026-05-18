import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadJobs } from "./jobs";

describe("health jobs", () => {
  it("loads scheduled jobs and recent runs from OpenClaw files", async () => {
    const fixture = await createJobsFixture();
    const response = await loadJobs(fixture.schedulePath, fixture.runsPath);

    expect(response.summary).toMatchObject({
      total_jobs: 2,
      healthy_jobs: 1,
      warning_jobs: 1,
      monthly_cost: 24.9,
      recent_runs: 2,
    });
    expect(response.summary.last_run_at).toBe("2026-05-07T08:05:00-05:00");
    expect(response.jobs.map((job) => job.id)).toEqual([
      "crypto-intel-brief",
      "polymarket-intel-brief",
    ]);
    expect(response.jobs[0]).toMatchObject({
      id: "crypto-intel-brief",
      latest_run: {
        status: "success",
        cost: 0.45,
      },
    });
    expect(response.recent_runs.map((run) => run.job_id)).toEqual([
      "polymarket-intel-brief",
      "crypto-intel-brief",
    ]);
  });

  it("returns scheduled jobs when the run log is missing", async () => {
    const fixture = await createJobsFixture();
    const response = await loadJobs(fixture.schedulePath, join(fixture.dir, "missing-runs.jsonl"));

    expect(response.summary.recent_runs).toBe(0);
    expect(response.jobs[0].latest_run).toBeNull();
    expect(response.recent_runs).toEqual([]);
  });
});

async function createJobsFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-jobs-"));
  const schedulePath = join(dir, "jobs-schedule.json");
  const runsPath = join(dir, "job-runs.jsonl");

  await mkdir(dir, { recursive: true });
  await writeFile(
    schedulePath,
    JSON.stringify({
      jobs: [
        {
          id: "crypto-intel-brief",
          name: "Crypto Intel Daily Brief",
          schedule: "Daily 7:00 AM CT",
          description: "Market analysis + trade signals",
          cost_per_run: 0.45,
          runs_per_month: 30,
          monthly_cost: 13.5,
          last_run: "2026-05-07T07:04:00-05:00",
          next_run: "2026-05-08T07:00:00-05:00",
          status: "success",
        },
        {
          id: "polymarket-intel-brief",
          name: "Polymarket Intel Brief",
          schedule: "Daily 8:00 AM CT",
          description: "Prediction market signals",
          cost_per_run: 0.38,
          runs_per_month: 30,
          monthly_cost: 11.4,
          last_run: "2026-05-07T08:05:00-05:00",
          next_run: "2026-05-08T08:00:00-05:00",
          status: "warning",
        },
      ],
      total_monthly_cost: 24.9,
      last_updated: "2026-05-07T08:05:00-05:00",
    }),
  );
  await writeFile(
    runsPath,
    [
      JSON.stringify({
        timestamp: "2026-05-07T07:04:00-05:00",
        job_id: "crypto-intel-brief",
        status: "success",
        duration_seconds: 154,
        cost: 0.45,
        tokens: { input: 50000, output: 20000 },
        output_summary: "3 signals generated",
      }),
      JSON.stringify({
        timestamp: "2026-05-07T08:05:00-05:00",
        job_id: "polymarket-intel-brief",
        status: "warning",
        duration_seconds: 98,
        cost: 0.38,
        tokens: { input: 42000, output: 15000 },
        output_summary: "2 signals logged",
      }),
    ].join("\n") + "\n",
  );

  return { dir, schedulePath, runsPath };
}
