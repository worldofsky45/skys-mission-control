import { stat } from "node:fs/promises";
import { paths } from "./constants";
import { readJsonlFile } from "./file-store";
import { costEntrySchema } from "./schemas";
import type { CostEntry, CostProject, CostsResponse } from "./types";

const SPRINT_BUDGET = 375;
const SPRINT_DAYS = 15;
const RECENT_EXPENSE_LIMIT = 10;

export class CostsNotInitializedError extends Error {
  constructor(message = "Cost tracking is not initialized") {
    super(message);
    this.name = "CostsNotInitializedError";
  }
}

export async function getCosts(): Promise<CostsResponse> {
  return loadCosts(paths.costs);
}

export async function loadCosts(
  costsPath: string,
  now = new Date(),
): Promise<CostsResponse> {
  try {
    await stat(costsPath);
  } catch (error) {
    if (isMissingFile(error)) {
      throw new CostsNotInitializedError(`Cost tracking not initialized: ${costsPath} is missing`);
    }

    throw error;
  }

  const records = await readJsonlFile<Record<string, unknown>>(costsPath);
  const entries = records
    .filter((record) => !("_schema" in record) && !("_format" in record))
    .map((record) => costEntrySchema.parse(record));

  return aggregateCosts(entries, now);
}

export function aggregateCosts(entries: CostEntry[], now = new Date()): CostsResponse {
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const totalSpent = roundMoney(sortedEntries.reduce((sum, entry) => sum + entry.amount, 0));
  const sprintStart = getSprintStart(sortedEntries);
  const daysElapsed = sprintStart ? getElapsedDays(sprintStart, now) : 0;
  const daysRemaining = Math.max(0, SPRINT_DAYS - daysElapsed);
  const dailyAverage = daysElapsed === 0 ? 0 : roundMoney(totalSpent / daysElapsed);
  const projectedTotal = roundMoney(dailyAverage * SPRINT_DAYS);

  return {
    summary: {
      total_spent: totalSpent,
      daily_average: dailyAverage,
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
      budget_total: SPRINT_BUDGET,
      budget_used_pct: percentage(totalSpent, SPRINT_BUDGET),
      projected_total: projectedTotal,
      on_track: projectedTotal <= SPRINT_BUDGET,
    },
    by_category: groupByKey(sortedEntries, "category").map(({ key, amount }) => ({
      category: key,
      amount,
      pct: percentage(amount, totalSpent),
    })),
    by_project: groupByProject(sortedEntries, totalSpent),
    daily_breakdown: getDailyBreakdown(sortedEntries),
    recent_expenses: [...sortedEntries].reverse().slice(0, RECENT_EXPENSE_LIMIT),
  };
}

function getSprintStart(entries: CostEntry[]): Date | null {
  const firstDate = entries[0]?.date;

  if (!firstDate) {
    return null;
  }

  return new Date(`${firstDate}T00:00:00.000Z`);
}

function getElapsedDays(start: Date, now: Date): number {
  const nowDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const elapsedMs = nowDate.getTime() - startDate.getTime();

  return Math.min(SPRINT_DAYS, Math.max(1, Math.floor(elapsedMs / 86_400_000) + 1));
}

function groupByKey(entries: CostEntry[], key: "category") {
  const grouped = entries.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry[key]] = (accumulator[entry[key]] ?? 0) + entry.amount;
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([entryKey, amount]) => ({ key: entryKey, amount: roundMoney(amount) }))
    .sort((a, b) => b.amount - a.amount || a.key.localeCompare(b.key));
}

function groupByProject(entries: CostEntry[], totalSpent: number): CostProject[] {
  const grouped = entries.reduce<Record<string, number>>((accumulator, entry) => {
    const project = entry.project ?? inferProject(entry.description);
    accumulator[project] = (accumulator[project] ?? 0) + entry.amount;
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([project, amount]) => ({
      project,
      amount: roundMoney(amount),
      pct: percentage(amount, totalSpent),
    }))
    .sort((a, b) => a.project.localeCompare(b.project));
}

function getDailyBreakdown(entries: CostEntry[]) {
  const grouped = entries.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.date] = (accumulator[entry.date] ?? 0) + entry.amount;
    return accumulator;
  }, {});
  let runningTotal = 0;

  return Object.entries(grouped)
    .sort(([aDate], [bDate]) => aDate.localeCompare(bDate))
    .map(([date, amount]) => {
      runningTotal = roundMoney(runningTotal + amount);

      return {
        date,
        amount: roundMoney(amount),
        running_total: runningTotal,
      };
    });
}

function inferProject(description: string): string {
  const normalized = description.toLowerCase();

  if (normalized.includes("mission control")) {
    return "Mission Control";
  }

  if (
    normalized.includes("crypto") ||
    normalized.includes("paper trading") ||
    normalized.includes("trading")
  ) {
    return "Crypto Intel";
  }

  return "Unassigned";
}

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 10_000) / 100;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
