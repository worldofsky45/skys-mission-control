import { mkdir, utimes, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("health API route", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    global.fetch = vi.fn().mockResolvedValue(Response.json({ bitcoin: { usd: 100 } }));
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns healthy when required files are present", async () => {
    const fixture = await createHealthFixture();
    setHealthEnv(fixture);

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.map((check: { name: string }) => check.name)).toContain("Ideas State");
  });

  it("returns critical when ideas state is missing", async () => {
    const fixture = await createHealthFixture();
    setHealthEnv({ ...fixture, ideasPath: join(fixture.dir, "missing-ideas.json") });

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("critical");
    expect(body.message).toContain("critical");
  });

  it("returns warning when CoinGecko check fails", async () => {
    const fixture = await createHealthFixture();
    setHealthEnv(fixture);
    global.fetch = vi.fn().mockRejectedValue(new Error("offline"));

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("warning");
  });

  it("does not warn for workspace files updated within the last day", async () => {
    const fixture = await createHealthFixture();
    setHealthEnv(fixture);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    await Promise.all([
      utimes(join(fixture.paperDir, "trades.jsonl"), sixHoursAgo, sixHoursAgo),
      utimes(fixture.ideasPath, sixHoursAgo, sixHoursAgo),
      utimes(fixture.polySignalsPath, sixHoursAgo, sixHoursAgo),
      utimes(fixture.roiPath, sixHoursAgo, sixHoursAgo),
    ]);

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.find((check: { name: string }) => check.name === "Paper Trading Data")).toMatchObject({
      status: "healthy",
    });
  });
});

async function createHealthFixture() {
  const dir = await mkdtemp(join(tmpdir(), "mission-control-health-"));
  const paperDir = join(dir, "paper");
  const ideasPath = join(dir, "ideas-state.json");
  const polySignalsPath = join(dir, "polymarket-signals.jsonl");
  const roiPath = join(dir, "roi.jsonl");

  await mkdir(paperDir, { recursive: true });
  await writeFile(join(paperDir, "trades.jsonl"), "");
  await writeFile(
    ideasPath,
    JSON.stringify({ pending: [], approved: [], rejected: [], queued: [] }),
  );
  await writeFile(polySignalsPath, "");
  await writeFile(roiPath, "");

  return { dir, paperDir, ideasPath, polySignalsPath, roiPath };
}

function setHealthEnv(fixture: {
  dir: string;
  paperDir: string;
  ideasPath: string;
  polySignalsPath: string;
  roiPath: string;
}) {
  process.env.WORKSPACE_PATH = fixture.dir;
  process.env.PAPER_TRADING_PATH = fixture.paperDir;
  process.env.IDEAS_STATE_PATH = fixture.ideasPath;
  process.env.POLYMARKET_SIGNALS_PATH = fixture.polySignalsPath;
  process.env.ROI_TRACKER_PATH = fixture.roiPath;
}
