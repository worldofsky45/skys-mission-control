#!/usr/bin/env node
import { join } from "node:path";
import {
  appendJsonl,
  buildJobRun,
  DEFAULT_WORKSPACE,
  fetchPricesForAssets,
  postActivity,
  readJsonl,
  scoreScorecardSignals,
  updateJobSchedule,
} from "./automation-lib.js";

const workspace = process.env.WORKSPACE_PATH ?? DEFAULT_WORKSPACE;
const baseUrl = process.env.MISSION_CONTROL_URL ?? "http://localhost:3000";
const scorecardPath = process.env.SCORECARD_PATH ?? join(workspace, "crypto-intel/scorecard.jsonl");
const startedAt = new Date().toISOString();
const now = new Date().toISOString();
const jobId = process.env.JOB_ID ?? "crypto-intel-scorecard-update";

try {
  const records = await readJsonl(scorecardPath);
  const assets = records.map((record) => record.asset).filter(Boolean);
  const prices = await fetchPricesForAssets(assets, workspace);
  const updates = scoreScorecardSignals(records, prices, now);

  for (const update of updates) {
    await appendJsonl(scorecardPath, update);
  }

  const summary = `Scorecard checked ${assets.length} signal assets and appended ${updates.length} updates`;
  await appendJsonl(join(workspace, "job-runs.jsonl"), buildJobRun(jobId, "success", startedAt, summary, 0));
  await updateJobSchedule(join(workspace, "jobs-schedule.json"), jobId, "success");

  if (updates.length > 0) {
    await postActivity(baseUrl, {
      type: "signal",
      system: "crypto-intel",
      title: "Scorecard signal resolved",
      summary,
      timestamp: now,
      signals: updates.map((update) => ({
        asset: update.asset,
        action: update.status,
        target: update.target_price ?? undefined,
        stop: update.stop_loss ?? undefined,
      })),
    });
  }

  console.log(summary);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await appendJsonl(join(workspace, "job-runs.jsonl"), buildJobRun(jobId, "failed", startedAt, message, 0));
  await updateJobSchedule(join(workspace, "jobs-schedule.json"), jobId, "failed");
  console.error(message);
  process.exitCode = 1;
}
