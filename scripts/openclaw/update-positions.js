#!/usr/bin/env node
import { join } from "node:path";
import {
  appendJsonl,
  buildBalanceSnapshot,
  buildJobRun,
  buildPositionsSnapshot,
  DEFAULT_WORKSPACE,
  fetchPricesForAssets,
  normalizeTradeEvents,
  postActivity,
  readJson,
  readJsonl,
  updateJobSchedule,
  writeJsonAtomic,
} from "./automation-lib.js";

const workspace = process.env.WORKSPACE_PATH ?? DEFAULT_WORKSPACE;
const baseUrl = process.env.MISSION_CONTROL_URL ?? "http://localhost:3000";
const paperDir = process.env.PAPER_TRADING_PATH ?? join(workspace, "crypto-intel/paper-trading");
const startedAt = new Date().toISOString();
const now = new Date().toISOString();
const jobId = process.env.JOB_ID ?? "paper-trading-position-check";

try {
  const events = await readJsonl(join(paperDir, "trades.jsonl"));
  const trades = normalizeTradeEvents(events);
  const prices = await fetchPricesForAssets(trades.map((trade) => trade.asset), workspace);
  const positions = buildPositionsSnapshot(trades, prices, now);
  const existingBalance = await readJson(join(paperDir, "balance.json"), {});
  const balance = buildBalanceSnapshot(trades, positions.positions, existingBalance, now);

  await writeJsonAtomic(join(paperDir, "positions.json"), positions);
  await writeJsonAtomic(join(paperDir, "balance.json"), balance);

  const summary = `Updated ${positions.positions.length} active positions with ${positions.alerts.length} action alerts`;
  await appendJsonl(join(workspace, "job-runs.jsonl"), buildJobRun(jobId, "success", startedAt, summary, 0));
  await updateJobSchedule(join(workspace, "jobs-schedule.json"), jobId, "success");

  if (positions.alerts.length > 0) {
    await postActivity(baseUrl, {
      type: "alert",
      system: "crypto-intel",
      title: "Paper trading action needed",
      summary,
      timestamp: now,
      signals: positions.alerts.map((alert) => ({
        asset: alert.asset,
        action: alert.action,
        target: alert.target,
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
