import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("health jobs API route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns scheduled job health from configured OpenClaw files", async () => {
    const fixture = await createJobsFixture();
    process.env.JOBS_SCHEDULE_PATH = fixture.schedulePath;
    process.env.JOB_RUNS_PATH = fixture.runsPath;

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.total_jobs).toBe(1);
    expect(body.summary.monthly_cost).toBe(13.5);
    expect(body.jobs[0].latest_run.status).toBe("success");
  });

  it("returns 503 when the jobs schedule has not been initialized", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-jobs-"));
    process.env.JOBS_SCHEDULE_PATH = join(dir, "missing-jobs-schedule.json");
    process.env.JOB_RUNS_PATH = join(dir, "job-runs.jsonl");

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("not initialized");
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
      ],
      total_monthly_cost: 13.5,
      last_updated: "2026-05-07T07:04:00-05:00",
    }),
  );
  await writeFile(
    runsPath,
    JSON.stringify({
      timestamp: "2026-05-07T07:04:00-05:00",
      job_id: "crypto-intel-brief",
      status: "success",
      duration_seconds: 154,
      cost: 0.45,
      tokens: { input: 50000, output: 20000 },
      output_summary: "3 signals generated",
    }) + "\n",
  );

  return { schedulePath, runsPath };
}
