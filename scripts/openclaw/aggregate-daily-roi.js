#!/usr/bin/env node
import { join } from "node:path";
import {
  aggregateDailyCosts,
  appendJsonl,
  buildJobRun,
  DEFAULT_WORKSPACE,
  postActivity,
  readJsonl,
  updateJobSchedule,
} from "./automation-lib.js";

const workspace = process.env.WORKSPACE_PATH ?? DEFAULT_WORKSPACE;
const baseUrl = process.env.MISSION_CONTROL_URL ?? "http://localhost:3000";
const costDetailsPath = process.env.COST_DETAILS_PATH ?? join(workspace, "roi-tracker/cost-details.jsonl");
const roiTrackerPath = process.env.ROI_TRACKER_PATH ?? join(workspace, "roi-tracker.jsonl");
const startedAt = new Date().toISOString();
const date = process.env.ROI_DATE ?? new Date().toISOString().slice(0, 10);
const jobId = process.env.JOB_ID ?? "roi-daily-aggregation";

try {
  const records = await readJsonl(costDetailsPath);
  const summary = aggregateDailyCosts(records, date);

  await appendJsonl(roiTrackerPath, summary);
  await appendJsonl(join(workspace, "job-runs.jsonl"), buildJobRun(jobId, "success", startedAt, `Aggregated $${summary.total_cost} AI spend for ${date}`, 0));
  await updateJobSchedule(join(workspace, "jobs-schedule.json"), jobId, "success");
  await postActivity(baseUrl, {
    type: "cost",
    system: "nova",
    title: "Daily ROI cost aggregation",
    summary: `Aggregated $${summary.total_cost} AI spend for ${date}`,
    timestamp: new Date().toISOString(),
  });

  console.log(`Aggregated $${summary.total_cost} AI spend for ${date}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await appendJsonl(join(workspace, "job-runs.jsonl"), buildJobRun(jobId, "failed", startedAt, message, 0));
  await updateJobSchedule(join(workspace, "jobs-schedule.json"), jobId, "failed");
  console.error(message);
  process.exitCode = 1;
}
