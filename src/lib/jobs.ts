import { stat } from "node:fs/promises";
import { paths } from "./constants";
import { readJsonFile, readJsonlFile } from "./file-store";
import { jobRunEntrySchema, jobsScheduleSchema } from "./schemas";
import type { JobRunEntry, JobScheduleEntry, JobsResponse } from "./types";

const RECENT_RUN_LIMIT = 10;

export class JobsNotInitializedError extends Error {
  constructor(message = "Job tracking is not initialized") {
    super(message);
    this.name = "JobsNotInitializedError";
  }
}

export async function getJobs(): Promise<JobsResponse> {
  return loadJobs(paths.jobsSchedule, paths.jobRuns);
}

export async function loadJobs(
  schedulePath: string,
  runsPath: string,
): Promise<JobsResponse> {
  try {
    await stat(schedulePath);
  } catch (error) {
    if (isMissingFile(error)) {
      throw new JobsNotInitializedError(`Job tracking not initialized: ${schedulePath} is missing`);
    }

    throw error;
  }

  const schedule = jobsScheduleSchema.parse(await readJsonFile(schedulePath));
  const runs = (await readJsonlFile<Record<string, unknown>>(runsPath)).map((record) =>
    jobRunEntrySchema.parse(record),
  );

  return aggregateJobs(schedule.jobs, runs, schedule.last_updated ?? null);
}

export function aggregateJobs(
  jobs: JobScheduleEntry[],
  runs: JobRunEntry[],
  lastUpdated: string | null,
): JobsResponse {
  const runsByJob = runs.reduce<Record<string, JobRunEntry[]>>((accumulator, run) => {
    accumulator[run.job_id] = [...(accumulator[run.job_id] ?? []), run];
    return accumulator;
  }, {});
  const jobsWithRuns = jobs.map((job) => ({
    ...job,
    latest_run: getLatestRun(runsByJob[job.id] ?? []),
  }));
  const recentRuns = [...runs]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, RECENT_RUN_LIMIT);
  const healthyJobs = jobsWithRuns.filter((job) => isHealthyStatus(job.status)).length;
  const monthlyCost = roundMoney(jobsWithRuns.reduce((sum, job) => sum + job.monthly_cost, 0));

  return {
    summary: {
      total_jobs: jobsWithRuns.length,
      healthy_jobs: healthyJobs,
      warning_jobs: jobsWithRuns.length - healthyJobs,
      monthly_cost: monthlyCost,
      recent_runs: runs.length,
      last_run_at: recentRuns[0]?.timestamp ?? null,
    },
    jobs: jobsWithRuns,
    recent_runs: recentRuns,
    last_updated: lastUpdated,
  };
}

function getLatestRun(runs: JobRunEntry[]): JobRunEntry | null {
  return [...runs].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ?? null;
}

function isHealthyStatus(status: string): boolean {
  return ["success", "healthy", "active"].includes(status.toLowerCase());
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
