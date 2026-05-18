import { mkdtemp, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  appendJsonl,
  readJsonFile,
  readJsonlFile,
  statFileFreshness,
  writeJsonAtomic,
} from "./file-store";

describe("file-store", () => {
  it("writes JSON atomically and reads it back", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-"));
    const file = join(dir, "state.json");

    await writeJsonAtomic(file, { pending: ["idea-1"] });

    await expect(readJsonFile(file)).resolves.toEqual({ pending: ["idea-1"] });
    await expect(stat(file)).resolves.toMatchObject({ isFile: expect.any(Function) });
  });

  it("appends and reads JSONL records", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-"));
    const file = join(dir, "events.jsonl");

    await appendJsonl(file, { id: "one" });
    await appendJsonl(file, { id: "two" });

    await expect(readJsonlFile(file)).resolves.toEqual([{ id: "one" }, { id: "two" }]);
    await expect(readFile(file, "utf8")).resolves.toBe('{"id":"one"}\n{"id":"two"}\n');
  });

  it("returns an empty array for a missing JSONL file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-"));
    const file = join(dir, "missing.jsonl");

    await expect(readJsonlFile(file)).resolves.toEqual([]);
  });

  it("reports freshness for existing and missing files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-"));
    const file = join(dir, "state.json");

    await writeJsonAtomic(file, { ok: true });

    await expect(statFileFreshness(file, 60_000)).resolves.toMatchObject({
      exists: true,
      is_stale: false,
    });
    await expect(statFileFreshness(join(dir, "none.json"), 60_000)).resolves.toMatchObject({
      exists: false,
      is_stale: true,
    });
  });
});
