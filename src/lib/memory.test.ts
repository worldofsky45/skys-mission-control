import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadMemory } from "./memory";

describe("memory loader", () => {
  it("loads MEMORY.md, memory files, graph links, and aggregate stats", async () => {
    const fixture = await createMemoryFixture();
    const response = await loadMemory(fixture.memoryPath, fixture.memoryDir, fixture.graphPath);

    expect(response.memory_md.path).toBe("MEMORY.md");
    expect(response.memory_md.content).toContain("Mission Control Dashboard");
    expect(response.memory_md.sections).toEqual(["Active Projects", "Core Principles"]);
    expect(response.memory_files.map((file) => file.name)).toEqual([
      "2026-05-07-trading-performance.md",
      "project-memory.md",
    ]);
    expect(response.graph_links).toEqual([
      { from: "Mission Control", to: "Paper Trading", type: "integrates" },
    ]);
    expect(response.stats.total_files).toBe(3);
    expect(response.stats.total_size_kb).toBeGreaterThan(0);
    expect(response.stats.last_consolidated).toBe(response.memory_md.last_updated);
  });

  it("treats graph links as optional", async () => {
    const fixture = await createMemoryFixture();
    const response = await loadMemory(fixture.memoryPath, fixture.memoryDir, join(fixture.dir, "missing-graph.json"));

    expect(response.graph_links).toEqual([]);
  });
});

async function createMemoryFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-memory-"));
  const memoryDir = join(dir, "memory");
  const memoryPath = join(dir, "MEMORY.md");
  const graphPath = join(memoryDir, "graph-links.json");

  await mkdir(memoryDir, { recursive: true });
  await writeFile(
    memoryPath,
    [
      "# OpenClaw Memory",
      "",
      "## Active Projects",
      "### Mission Control Dashboard",
      "Unified dashboard.",
      "",
      "## Core Principles",
      "Ship daily, optimize weekly.",
    ].join("\n"),
  );
  await writeFile(join(memoryDir, "project-memory.md"), "# Project Memory\nStable context.\n");
  await writeFile(
    join(memoryDir, "2026-05-07-trading-performance.md"),
    "# Trading Performance\nZEC and TON exceeded T1.\n",
  );
  await writeFile(
    graphPath,
    JSON.stringify({
      links: [{ from: "Mission Control", to: "Paper Trading", type: "integrates" }],
    }),
  );

  return { dir, memoryDir, memoryPath, graphPath };
}
