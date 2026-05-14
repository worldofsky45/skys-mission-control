import { paths } from "./constants";
import { appendJsonl, readJsonlFile } from "./file-store";
import { activityEventRecordSchema, activityEventSchema } from "./schemas";
import type { ActivityEventRecord, ActivityResponse } from "./types";

const RECENT_ACTIVITY_LIMIT = 50;

export class ActivityValidationError extends Error {
  constructor(message = "Invalid activity event") {
    super(message);
    this.name = "ActivityValidationError";
  }
}

export async function getActivity(): Promise<ActivityResponse> {
  return loadActivity(paths.activityLog);
}

export async function loadActivity(
  activityLog: string,
  limit = RECENT_ACTIVITY_LIMIT,
): Promise<ActivityResponse> {
  const records = await readJsonlFile<Record<string, unknown>>(activityLog);
  const events = records
    .map((record) => activityEventRecordSchema.safeParse(record))
    .filter((result) => result.success)
    .map((result) => result.data as ActivityEventRecord);

  return {
    events: events.slice(-limit).reverse(),
  };
}

export async function recordActivity(
  input: unknown,
  activityLog = paths.activityLog,
  now = new Date(),
): Promise<ActivityEventRecord> {
  const parsed = activityEventSchema.safeParse(input);

  if (!parsed.success) {
    throw new ActivityValidationError();
  }

  const record = {
    ...parsed.data,
    received_at: now.toISOString(),
  };

  await appendJsonl(activityLog, record);

  return record;
}
