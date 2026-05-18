import { appendFile, mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface FileFreshness {
  exists: boolean;
  is_stale: boolean;
  last_updated: string | null;
  age_ms: number | null;
}

export async function readJsonFile<T = unknown>(filepath: string): Promise<T> {
  const content = await readFile(filepath, "utf8");
  return JSON.parse(content) as T;
}

export async function readJsonlFile<T = unknown>(filepath: string): Promise<T[]> {
  let content: string;

  try {
    content = await readFile(filepath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

export async function writeJsonAtomic<T>(filepath: string, data: T): Promise<void> {
  await mkdir(dirname(filepath), { recursive: true });
  const tempPath = `${filepath}.tmp-${process.pid}-${Date.now()}`;

  try {
    await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(tempPath, filepath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {
      // Best-effort cleanup only; preserve the original error.
    }

    throw error;
  }
}

export async function appendJsonl<T>(filepath: string, entry: T): Promise<void> {
  await mkdir(dirname(filepath), { recursive: true });
  await appendFile(filepath, `${JSON.stringify(entry)}\n`, "utf8");
}

export async function statFileFreshness(
  filepath: string,
  staleAfterMs: number,
  now = Date.now(),
): Promise<FileFreshness> {
  try {
    const fileStat = await stat(filepath);
    const ageMs = now - fileStat.mtimeMs;

    return {
      exists: true,
      is_stale: ageMs > staleAfterMs,
      last_updated: fileStat.mtime.toISOString(),
      age_ms: ageMs,
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {
        exists: false,
        is_stale: true,
        last_updated: null,
        age_ms: null,
      };
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
