import { describe, expect, it } from "vitest";
import {
  ideaActionRequestSchema,
  ideasStateSchema,
  paperTradeSchema,
  polymarketOutcomeRequestSchema,
  polymarketSignalSchema,
  roiEntrySchema,
} from "./schemas";

describe("Mission Control schemas", () => {
  it("accepts the active Nova paper trade shape", () => {
    const parsed = paperTradeSchema.parse({
      id: "1778014800001",
      date: "2026-05-05",
      signal: "BTC Markup $80K->$88K",
      asset: "BTC",
      conviction: "A",
      entry_price: 81636,
      position_size: 0.0245,
      position_value: 2000,
      position_pct: 20,
      stop_loss: 76500,
      target_1: 82000,
      target_2: 85000,
      target_3: 88000,
      status: "active",
      outcome: null,
      exit_price: null,
      pnl: null,
      pnl_pct: null,
      notes: "Entered at $81.6K",
      created_at: "2026-05-05T20:59:00.000Z",
    });

    expect(parsed.asset).toBe("BTC");
    expect(parsed.status).toBe("active");
  });

  it("accepts the current ideas-state file shape", () => {
    const parsed = ideasStateSchema.parse({
      pending: [
        {
          id: "newsletter-predictor-001",
          name: "Newsletter Subscriber Predictor",
          tier: 1,
          stars: 5,
          one_liner: "Predict which LinkedIn posts drive newsletter signups",
          feedback_loop: "48 hours",
          roi_potential: "$5K MRR",
          complexity: "Easy (1-2 weeks)",
          capital_required: "$0",
          success_rate_needed: "30%+",
          generated: "2026-05-05",
          source_file: "ENGINE-IDEAS-BATCH-001.md#idea-1",
        },
      ],
      approved: [
        {
          id: "crypto-intel",
          name: "Crypto Intel",
          approved: "2026-05-04",
          status: "active",
          week: 1,
          next_milestone: "2026-05-18",
          paper_trading_balance: 1003.33,
        },
      ],
      rejected: [],
      queued: [],
    });

    expect(parsed.pending).toHaveLength(1);
    expect(parsed.approved[0]?.id).toBe("crypto-intel");
  });

  it("validates write-back request bodies", () => {
    expect(
      ideaActionRequestSchema.parse({
        id: "newsletter-predictor-001",
        note: "Start this next",
      }),
    ).toEqual({
      id: "newsletter-predictor-001",
      note: "Start this next",
    });

    expect(() =>
      polymarketOutcomeRequestSchema.parse({
        signal_id: "signal-1",
        outcome: "maybe",
        actual_odds: 1.2,
      }),
    ).toThrow();
  });

  it("accepts current Polymarket and ROI records", () => {
    expect(
      polymarketSignalSchema.parse({
        timestamp: "2026-05-06T09:58:00-05:00",
        market: "Example Market",
        prediction: "YES",
        confidence: 75,
        entry_odds: "0.65",
        position_size: 100,
        status: "active",
        created_by: "mission_control",
      }),
    ).toMatchObject({ market: "Example Market", status: "active" });

    expect(
      roiEntrySchema.parse({
        timestamp: "2026-05-06T09:58:00-05:00",
        name: "Paper Trading System",
        invested: 0,
        roi: 0,
        description: "Crypto paper trading P&L",
        status: "active",
      }),
    ).toMatchObject({ name: "Paper Trading System", invested: 0 });
  });
});
