import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("memory API route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns OpenClaw memory data from configured files", async () => {
    const fixture = await createMemoryFixture();
    process.env.MEMORY_MD_PATH = fixture.memoryPath;
    process.env.MEMORY_DIR_PATH = fixture.memoryDir;
    process.env.MEMORY_GRAPH_LINKS_PATH = fixture.graphPath;

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.memory_md.sections).toContain("Active Projects");
    expect(body.memory_files).toHaveLength(1);
    expect(body.stats.total_files).toBe(2);
  });

  it("returns 503 when MEMORY.md has not been initialized", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mission-control-memory-"));
    process.env.MEMORY_MD_PATH = join(dir, "missing-memory.md");
    process.env.MEMORY_DIR_PATH = join(dir, "memory");

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("not initialized");
  });
});

async function createMemoryFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-memory-"));
  const memoryDir = join(dir, "memory");
  const memoryPath = join(dir, "MEMORY.md");
  const graphPath = join(memoryDir, "graph-links.json");

  await mkdir(memoryDir, { recursive: true });
  await writeFile(memoryPath, "# OpenClaw Memory\n\n## Active Projects\nMission Control.\n");
  await writeFile(join(memoryDir, "project-memory.md"), "# Project Memory\nStable context.\n");
  await writeFile(graphPath, JSON.stringify([]));

  return { memoryDir, memoryPath, graphPath };
}
