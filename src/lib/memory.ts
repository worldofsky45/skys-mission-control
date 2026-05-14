import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { paths } from "./constants";
import { memoryGraphLinksSchema } from "./schemas";
import type { MemoryFile, MemoryGraphLink, MemoryResponse } from "./types";

export class MemoryNotInitializedError extends Error {
  constructor(message = "Memory is not initialized") {
    super(message);
    this.name = "MemoryNotInitializedError";
  }
}

export async function getMemory(): Promise<MemoryResponse> {
  return loadMemory(paths.memoryMd, paths.memoryDir, paths.memoryGraphLinks);
}

export async function loadMemory(
  memoryPath: string,
  memoryDir: string,
  graphLinksPath: string,
): Promise<MemoryResponse> {
  let memoryStat: Awaited<ReturnType<typeof stat>>;

  try {
    memoryStat = await stat(memoryPath);
  } catch (error) {
    if (isMissingFile(error)) {
      throw new MemoryNotInitializedError(`Memory not initialized: ${memoryPath} is missing`);
    }

    throw error;
  }

  const content = await readFile(memoryPath, "utf8");
  const memoryFiles = await listMemoryFiles(memoryDir);
  const graphLinks = await readGraphLinks(graphLinksPath);
  const mainSizeKb = sizeKb(memoryStat.size);
  const totalSizeKb = roundKb(
    mainSizeKb + memoryFiles.reduce((sum, file) => sum + file.size_kb, 0),
  );

  return {
    memory_md: {
      path: basename(memoryPath),
      content,
      last_updated: memoryStat.mtime.toISOString(),
      size_kb: mainSizeKb,
      sections: extractSections(content),
    },
    memory_files: memoryFiles,
    graph_links: graphLinks,
    stats: {
      total_files: memoryFiles.length + 1,
      total_size_kb: totalSizeKb,
      last_consolidated: memoryStat.mtime.toISOString(),
    },
  };
}

async function listMemoryFiles(memoryDir: string): Promise<MemoryFile[]> {
  let entries: string[];

  try {
    entries = await readdir(memoryDir);
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }

    throw error;
  }

  const files = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".md"))
      .map(async (entry) => {
        const filepath = join(memoryDir, entry);
        const fileStat = await stat(filepath);

        return {
          name: entry,
          path: `memory/${entry}`,
          last_updated: fileStat.mtime.toISOString(),
          size_kb: sizeKb(fileStat.size),
        };
      }),
  );

  return files.sort((a, b) => b.last_updated.localeCompare(a.last_updated) || a.name.localeCompare(b.name));
}

async function readGraphLinks(graphLinksPath: string): Promise<MemoryGraphLink[]> {
  let raw: string;

  try {
    raw = await readFile(graphLinksPath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }

    throw error;
  }

  const parsed = memoryGraphLinksSchema.parse(JSON.parse(raw));
  return Array.isArray(parsed) ? parsed : parsed.links;
}

function extractSections(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.match(/^##\s+(.+)$/)?.[1]?.trim())
    .filter((section): section is string => Boolean(section));
}

function sizeKb(sizeBytes: number): number {
  return roundKb(sizeBytes / 1024);
}

function roundKb(value: number): number {
  return Math.round(value * 10) / 10;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
