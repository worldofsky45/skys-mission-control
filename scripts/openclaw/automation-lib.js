import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const DEFAULT_WORKSPACE = "/Users/sky/.openclaw/workspace";
export const DEFAULT_MISSION_CONTROL_ROOT = "/Users/sky/Documents/Codex/mission-control";

const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  TON: "the-open-network",
  PENGU: "pengu",
  ZEC: "zcash",
};

const REQUIRED_AUTOMATION_JOBS = [
  {
    id: "paper-trading-midday-check",
    name: "Paper Trading Midday Check",
    schedule: "Daily 12:00 PM CT",
    description: "Refresh active paper positions, balance, and target/stop alerts",
    cost_per_run: 0.15,
    runs_per_month: 30,
    monthly_cost: 4.5,
    last_run: null,
    next_run: null,
    status: "unknown",
  },
  {
    id: "paper-trading-evening-check",
    name: "Paper Trading Evening Check",
    schedule: "Daily 6:00 PM CT",
    description: "Refresh active paper positions, balance, and target/stop alerts",
    cost_per_run: 0.15,
    runs_per_month: 30,
    monthly_cost: 4.5,
    last_run: null,
    next_run: null,
    status: "unknown",
  },
  {
    id: "crypto-intel-scorecard-update",
    name: "Crypto Intel Scorecard Update",
    schedule: "Daily 11:00 PM CT",
    description: "Check scorecard targets/stops and append resolved signal updates",
    cost_per_run: 0.1,
    runs_per_month: 30,
    monthly_cost: 3,
    last_run: null,
    next_run: null,
    status: "unknown",
  },
  {
    id: "roi-daily-aggregation",
    name: "ROI Daily Aggregation",
    schedule: "Daily 11:05 PM CT",
    description: "Aggregate daily AI costs into ROI tracking and activity feed",
    cost_per_run: 0,
    runs_per_month: 30,
    monthly_cost: 0,
    last_run: null,
    next_run: null,
    status: "unknown",
  },
];

export function normalizeTradeEvents(events) {
  const tradesByKey = new Map();

  for (const event of events) {
    const key = tradeKey(event);
    const existing = tradesByKey.get(key);

    if (isPartialEvent(event)) {
      tradesByKey.set(key, normalizePartialTrade(event, existing));
      continue;
    }

    if (isClosedEvent(event)) {
      tradesByKey.set(key, normalizeClosedTrade(event, existing));
      continue;
    }

    const baseTrade = normalizeBaseTrade(event);
    const existingIsClosed = existing?.status === "closed";
    if (!existing || !existingIsClosed) {
      tradesByKey.set(key, baseTrade);
    }
  }

  return [...tradesByKey.values()];
}

export function buildPositionsSnapshot(trades, prices, now = new Date().toISOString()) {
  const positions = [];
  const alerts = [];

  for (const trade of trades.filter((candidate) => isActiveStatus(candidate.status))) {
    const asset = trade.asset.toUpperCase();
    const currentPrice = Number(prices[asset] ?? trade.current_price ?? trade.entry_price);
    const currentValue = roundMoney(currentPrice * trade.position_size);
    const unrealizedPnl = roundMoney(currentValue - trade.position_value);
    const pnlPct = trade.position_value === 0 ? 0 : roundPercent((unrealizedPnl / trade.position_value) * 100);
    const action = nextPositionAction(trade, currentPrice);

    const position = {
      id: trade.id,
      asset,
      signal: trade.signal,
      entry_price: trade.entry_price,
      current_price: currentPrice,
      quantity: trade.position_size,
      entry_value: roundMoney(trade.position_value),
      current_value: currentValue,
      unrealized_pnl: unrealizedPnl,
      pnl_pct: pnlPct,
      stop_loss: trade.stop_loss ?? null,
      target_1: trade.target_1 ?? null,
      target_2: trade.target_2 ?? null,
      target_3: trade.target_3 ?? null,
      next_action: action?.action ?? "hold",
      next_action_price: action?.target ?? null,
      checked_at: now,
    };

    positions.push(position);

    if (action) {
      alerts.push({
        asset,
        signal: trade.signal,
        action: action.action,
        current_price: currentPrice,
        target: action.target,
        checked_at: now,
      });
    }
  }

  positions.sort((a, b) => b.unrealized_pnl - a.unrealized_pnl);

  return {
    positions,
    alerts,
    last_updated: now,
  };
}

export function buildBalanceSnapshot(trades, positions, existingBalance = {}, now = new Date().toISOString()) {
  const startingBalance = Number(existingBalance.starting_balance ?? 10000);
  const realizedPnl = roundMoney(
    trades.reduce((sum, trade) => sum + Number(trade.realized_pnl ?? trade.pnl ?? 0), 0),
  );
  const unrealizedPnl = roundMoney(
    positions.reduce((sum, position) => sum + Number(position.unrealized_pnl ?? 0), 0),
  );
  const totalPnl = roundMoney(realizedPnl + unrealizedPnl);
  const currentBalance = roundMoney(startingBalance + totalPnl);
  const previousCurve = Array.isArray(existingBalance.equity_curve) ? existingBalance.equity_curve : [];
  const equityCurve = [...previousCurve, { timestamp: now, value: currentBalance }].slice(-100);

  return {
    starting_balance: startingBalance,
    current_balance: currentBalance,
    peak_balance: Math.max(Number(existingBalance.peak_balance ?? startingBalance), currentBalance),
    realized_pnl: realizedPnl,
    unrealized_pnl: unrealizedPnl,
    total_pnl: totalPnl,
    total_pnl_pct: startingBalance === 0 ? 0 : roundPercent((totalPnl / startingBalance) * 100),
    equity_curve: equityCurve,
    last_updated: now,
  };
}

export function scoreScorecardSignals(records, prices, now = new Date().toISOString()) {
  const alreadyScored = new Set(
    records
      .filter((record) => record.type === "scorecard_update" && record.prediction_id)
      .map((record) => String(record.prediction_id)),
  );
  const updates = [];

  for (const record of records) {
    if (record.type !== "signal" || !record.id || alreadyScored.has(record.id)) {
      continue;
    }

    const asset = String(record.asset ?? "").toUpperCase();
    const currentPrice = Number(prices[asset]);
    if (!Number.isFinite(currentPrice)) {
      continue;
    }

    const target = firstTargetPrice(record.exit_strategy);
    const stop = Number(record.exit_strategy?.stop_loss?.price);
    const entryPrice = Number(record.entry_price ?? 0);
    const status = currentPrice >= target ? "target_hit" : currentPrice <= stop ? "stop_hit" : null;

    if (!status) {
      continue;
    }

    updates.push({
      id: `${record.id}-${status}-${now.slice(0, 10)}`,
      type: "scorecard_update",
      prediction_id: record.id,
      asset,
      status,
      current_price: currentPrice,
      entry_price: entryPrice,
      target_price: Number.isFinite(target) ? target : null,
      stop_loss: Number.isFinite(stop) ? stop : null,
      unrealized_gain_pct: entryPrice === 0 ? 0 : roundPercent(((currentPrice - entryPrice) / entryPrice) * 100),
      timestamp: now,
    });
  }

  return updates;
}

export function aggregateDailyCosts(records, date = todayIsoDate()) {
  const systems = {};
  let totalCost = 0;

  for (const record of records) {
    const timestamp = String(record.timestamp ?? record.date ?? "");
    if (!timestamp.startsWith(date)) {
      continue;
    }

    const system = String(record.system ?? record.project ?? "unknown");
    const cost = Number(record.cost ?? record.amount ?? 0);
    if (!Number.isFinite(cost)) {
      continue;
    }

    systems[system] = roundMoney((systems[system] ?? 0) + cost);
    totalCost = roundMoney(totalCost + cost);
  }

  return {
    timestamp: `${date}T23:00:00.000Z`,
    date,
    type: "daily_cost_summary",
    name: "Daily AI Cost",
    invested: totalCost,
    roi: -totalCost,
    description: `Daily AI spend aggregation for ${date}`,
    status: "active",
    total_cost: totalCost,
    systems,
  };
}

export function buildCronEntries(root = DEFAULT_MISSION_CONTROL_ROOT) {
  const scriptRoot = `${root}/scripts/openclaw`;
  const logRoot = `${DEFAULT_WORKSPACE}/logs`;

  return [
    `0 12 * * * JOB_ID=paper-trading-midday-check ${scriptRoot}/update-positions.js >> ${logRoot}/paper-trading-update.log 2>&1`,
    `0 18 * * * JOB_ID=paper-trading-evening-check ${scriptRoot}/update-positions.js >> ${logRoot}/paper-trading-update.log 2>&1`,
    `0 23 * * * JOB_ID=crypto-intel-scorecard-update ${scriptRoot}/update-scorecard.js >> ${logRoot}/scorecard-update.log 2>&1`,
    `5 23 * * * JOB_ID=roi-daily-aggregation ${scriptRoot}/aggregate-daily-roi.sh >> ${logRoot}/roi-aggregation.log 2>&1`,
  ].join("\n");
}

export function ensureAutomationJobsInSchedule(schedule) {
  const jobs = Array.isArray(schedule.jobs) ? [...schedule.jobs] : [];
  const existingIds = new Set(jobs.map((job) => job.id));

  for (const requiredJob of REQUIRED_AUTOMATION_JOBS) {
    if (!existingIds.has(requiredJob.id)) {
      jobs.push({ ...requiredJob });
    }
  }

  return {
    ...schedule,
    jobs,
    total_monthly_cost: roundMoney(
      jobs.reduce((sum, job) => sum + Number(job.monthly_cost ?? 0), 0),
    ),
  };
}

export function buildJobRun(jobId, status, startedAt, outputSummary, cost = 0) {
  return {
    timestamp: new Date().toISOString(),
    job_id: jobId,
    status,
    duration_seconds: Math.max(0, Math.round((Date.now() - Date.parse(startedAt)) / 1000)),
    cost,
    output_summary: outputSummary,
  };
}

export async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

export async function readJsonl(path) {
  try {
    const content = await readFile(path, "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(tempPath, path);
}

export async function appendJsonl(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}\n`, { flag: "a" });
}

export async function fetchPricesForAssets(assets, workspace = DEFAULT_WORKSPACE) {
  const uniqueAssets = [...new Set(assets.map((asset) => String(asset).toUpperCase()))];
  const ids = uniqueAssets.map((asset) => COINGECKO_IDS[asset]).filter(Boolean);
  const cachePath = join(workspace, "crypto-intel/cache/prices-cache.json");
  const cachedPrices = normalizeCoinGeckoPrices(await readJson(cachePath, {}));

  if (ids.length === 0) {
    return cachedPrices;
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }
    const payload = await response.json();
    await writeJsonAtomic(cachePath, payload);
    return normalizeCoinGeckoPrices(payload);
  } catch {
    return cachedPrices;
  }
}

export async function postActivity(baseUrl, event) {
  try {
    await fetch(`${baseUrl}/api/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Mission Control may be offline. The file outputs and job log remain the source of truth.
  }
}

export async function updateJobSchedule(schedulePath, jobId, status, now = new Date()) {
  const schedule = ensureAutomationJobsInSchedule(await readJson(schedulePath, { jobs: [] }));
  const jobs = schedule.jobs;

  for (const job of jobs) {
    if (job.id !== jobId) {
      continue;
    }

    job.last_run = now.toISOString();
    job.next_run = nextRunIso(job.schedule, now);
    job.status = status;
  }

  schedule.last_updated = now.toISOString();
  schedule.total_monthly_cost = roundMoney(
    jobs.reduce((sum, job) => sum + Number(job.monthly_cost ?? 0), 0),
  );

  await writeJsonAtomic(schedulePath, { ...schedule, jobs });
}

function normalizeBaseTrade(event) {
  const entryPrice = Number(event.entry_price ?? 0);
  const positionSize = Number(event.position_size ?? 0);

  return {
    ...event,
    id: String(event.id ?? ""),
    signal: String(event.signal ?? ""),
    asset: String(event.asset ?? "").toUpperCase(),
    entry_price: entryPrice,
    position_size: positionSize,
    position_value: Number(event.position_value ?? entryPrice * positionSize),
    stop_loss: nullableNumber(event.stop_loss),
    target_1: nullableNumber(event.target_1),
    target_2: nullableNumber(event.target_2),
    target_3: nullableNumber(event.target_3),
    status: "active",
    realized_pnl: Number(event.pnl ?? 0),
    created_at: eventTimestamp(event),
  };
}

function normalizePartialTrade(event, existing) {
  const entryPrice = Number(event.entry_price ?? existing?.entry_price ?? 0);
  const remainingSize = Number(event.remaining_size ?? existing?.position_size ?? event.position_size ?? 0);

  return {
    ...existing,
    ...event,
    id: existing?.id ?? String(event.id ?? ""),
    signal: existing?.signal ?? String(event.signal ?? ""),
    asset: String(event.asset ?? existing?.asset ?? "").toUpperCase(),
    entry_price: entryPrice,
    current_price: Number(event.current_price ?? existing?.current_price ?? entryPrice),
    position_size: remainingSize,
    position_value: roundMoney(entryPrice * remainingSize),
    stop_loss: nullableNumber(event.stop_loss ?? existing?.stop_loss),
    target_1: nullableNumber(event.target_1 ?? existing?.target_1),
    target_2: nullableNumber(event.target_2 ?? existing?.target_2),
    target_3: nullableNumber(event.target_3 ?? existing?.target_3),
    target_hit: event.target_hit ?? existing?.target_hit ?? null,
    status: "active_partial",
    realized_pnl: roundMoney(Number(existing?.realized_pnl ?? 0) + Number(event.pnl_on_partial ?? 0)),
    created_at: existing?.created_at ?? eventTimestamp(event),
  };
}

function normalizeClosedTrade(event, existing) {
  const entryPrice = Number(event.entry_price ?? existing?.entry_price ?? 0);
  const positionSize = Number(event.position_size ?? existing?.position_size ?? 0);

  return {
    ...existing,
    ...event,
    id: String(event.id ?? existing?.id ?? ""),
    signal: String(event.signal ?? existing?.signal ?? ""),
    asset: String(event.asset ?? existing?.asset ?? "").toUpperCase(),
    entry_price: entryPrice,
    position_size: positionSize,
    position_value: Number(event.position_value ?? existing?.position_value ?? entryPrice * positionSize),
    status: "closed",
    realized_pnl: roundMoney(Number(existing?.realized_pnl ?? 0) + Number(event.pnl ?? 0)),
    created_at: eventTimestamp(event),
  };
}

function nextPositionAction(trade, currentPrice) {
  const stop = Number(trade.stop_loss);
  if (Number.isFinite(stop) && stop > 0 && currentPrice <= stop) {
    return { action: "stop_loss_hit", target: stop };
  }

  const targetValues = [trade.target_1, trade.target_2, trade.target_3].map(Number);
  const targetStartIndex = targetHitIndex(trade.target_hit) + 1;

  for (const target of targetValues.slice(targetStartIndex)) {
    if (Number.isFinite(target) && target > 0 && currentPrice >= target) {
      return { action: "target_hit", target };
    }
  }

  return null;
}

function targetHitIndex(targetHit) {
  const normalized = String(targetHit ?? "").toUpperCase();

  if (normalized === "T1") {
    return 0;
  }

  if (normalized === "T2") {
    return 1;
  }

  if (normalized === "T3") {
    return 2;
  }

  return -1;
}

function firstTargetPrice(exitStrategy) {
  const targets = [exitStrategy?.target_1?.price, exitStrategy?.target_2?.price, exitStrategy?.target_3?.price]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);

  return targets.length > 0 ? Math.min(...targets) : Number.POSITIVE_INFINITY;
}

function normalizeCoinGeckoPrices(payload) {
  const prices = {};

  for (const [asset, id] of Object.entries(COINGECKO_IDS)) {
    const price = Number(payload?.[id]?.usd);
    if (Number.isFinite(price)) {
      prices[asset] = price;
    }
  }

  return prices;
}

function nextRunIso(schedule, now) {
  const lower = String(schedule).toLowerCase();
  const match = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3] === "pm" && hour !== 12) {
    hour += 12;
  }
  if (match[3] === "am" && hour === 12) {
    hour = 0;
  }

  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}

function isActiveStatus(status) {
  return status === "active" || status === "active_partial";
}

function isPartialEvent(event) {
  return event.status === "active_partial" || String(event.action ?? "").startsWith("partial_exit");
}

function isClosedEvent(event) {
  return event.status === "closed" || String(event.action ?? "").endsWith("_exit");
}

function tradeKey(event) {
  return `${String(event.asset ?? "").toUpperCase()}::${String(event.signal ?? "").toLowerCase()}`;
}

function eventTimestamp(event) {
  return String(event.created_at ?? event.closed_at ?? event.updated_at ?? `${event.date}T00:00:00.000Z`);
}

function nullableNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function roundPercent(value) {
  return Math.round(Number(value) * 100) / 100;
}
