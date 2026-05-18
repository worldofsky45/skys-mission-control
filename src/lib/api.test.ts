import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveIdea,
  getCosts,
  getHealth,
  getIdeas,
  getPaperBalance,
  rejectIdea,
  resolvePolymarketSignal,
} from "./api";

describe("api client", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads typed GET endpoints", async () => {
    await getHealth();
    await getPaperBalance();
    await getIdeas();
    await getCosts();

    expect(fetch).toHaveBeenNthCalledWith(1, "/api/health", {
      cache: "no-store",
    });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/paper-trading/balance", {
      cache: "no-store",
    });
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/ideas/list", {
      cache: "no-store",
    });
    expect(fetch).toHaveBeenNthCalledWith(4, "/api/costs", {
      cache: "no-store",
    });
  });

  it("posts validated write-back actions as JSON", async () => {
    await approveIdea("idea-1", "approved");
    await rejectIdea("idea-2");
    await resolvePolymarketSignal({
      signal_id: "signal-1",
      outcome: "won",
      actual_odds: 0.64,
    });

    expect(fetch).toHaveBeenNthCalledWith(1, "/api/ideas/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "idea-1", note: "approved" }),
    });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/ideas/reject", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "idea-2", note: "" }),
    });
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/polymarket/outcomes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        signal_id: "signal-1",
        outcome: "won",
        actual_odds: 0.64,
      }),
    });
  });

  it("throws route error messages", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "No data yet" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(getHealth()).rejects.toThrow("No data yet");
  });
});
