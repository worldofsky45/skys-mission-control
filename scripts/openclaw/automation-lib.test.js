import { describe, expect, test } from "vitest";
import {
  aggregateDailyCosts,
  buildBalanceSnapshot,
  buildCronEntries,
  buildPositionsSnapshot,
  ensureAutomationJobsInSchedule,
  normalizeTradeEvents,
  scoreScorecardSignals,
} from "./automation-lib";

describe("OpenClaw automation helpers", () => {
  test("normalizes active, partial, and closed paper trade events into current positions", () => {
    const trades = normalizeTradeEvents([
      {
        id: "btc-1",
        date: "2026-05-04",
        signal: "BTC Breakout",
        asset: "BTC",
        entry_price: 80000,
        position_size: 0.1,
        position_value: 8000,
        stop_loss: 76000,
        target_1: 82000,
        target_2: 85000,
        status: "active",
        created_at: "2026-05-04T12:00:00.000Z",
      },
      {
        id: "btc-1-partial",
        date: "2026-05-05",
        signal: "BTC Breakout",
        asset: "BTC",
        action: "partial_exit_t1",
        entry_price: 80000,
        remaining_size: 0.075,
        target_hit: "T1",
        pnl_on_partial: 50,
        status: "active_partial",
        updated_at: "2026-05-05T12:00:00.000Z",
      },
      {
        id: "zec-exit",
        date: "2026-05-05",
        signal: "ZEC Stop",
        asset: "ZEC",
        action: "stop_loss_exit",
        entry_price: 400,
        position_size: 2,
        pnl: -40,
        status: "closed",
        closed_at: "2026-05-05T13:00:00.000Z",
      },
    ]);

    expect(trades).toHaveLength(2);
    expect(trades.find((trade) => trade.asset === "BTC")).toMatchObject({
      status: "active_partial",
      position_size: 0.075,
      realized_pnl: 50,
    });
    expect(trades.find((trade) => trade.asset === "ZEC")).toMatchObject({
      status: "closed",
      realized_pnl: -40,
    });
  });

  test("builds position and balance snapshots with stop/target alerts", () => {
    const trades = normalizeTradeEvents([
      {
        id: "btc-1",
        date: "2026-05-04",
        signal: "BTC Breakout",
        asset: "BTC",
        entry_price: 80000,
        position_size: 0.1,
        position_value: 8000,
        stop_loss: 76000,
        target_1: 82000,
        target_2: 85000,
        status: "active",
        created_at: "2026-05-04T12:00:00.000Z",
      },
    ]);

    const positions = buildPositionsSnapshot(trades, { BTC: 82500 }, "2026-05-06T12:00:00.000Z");
    const balance = buildBalanceSnapshot(trades, positions.positions, {
      starting_balance: 10000,
      peak_balance: 10000,
    }, "2026-05-06T12:00:00.000Z");

    expect(positions.positions[0]).toMatchObject({
      asset: "BTC",
      current_price: 82500,
      unrealized_pnl: 250,
      next_action: "target_hit",
    });
    expect(positions.alerts[0]).toMatchObject({
      asset: "BTC",
      action: "target_hit",
      target: 82000,
    });
    expect(balance).toMatchObject({
      current_balance: 10250,
      unrealized_pnl: 250,
      realized_pnl: 0,
      total_pnl: 250,
    });
  });

  test("partial positions advance to the next target instead of repeating the hit target", () => {
    const trades = normalizeTradeEvents([
      {
        id: "ton-1",
        date: "2026-05-04",
        signal: "TON Momentum",
        asset: "TON",
        entry_price: 2,
        position_size: 100,
        position_value: 200,
        target_1: 2.3,
        target_2: 2.7,
        status: "active",
        created_at: "2026-05-04T12:00:00.000Z",
      },
      {
        id: "ton-1-partial",
        date: "2026-05-05",
        signal: "TON Momentum",
        asset: "TON",
        action: "partial_exit_t1",
        entry_price: 2,
        remaining_size: 75,
        target_hit: "T1",
        status: "active_partial",
        updated_at: "2026-05-05T12:00:00.000Z",
      },
    ]);

    const positions = buildPositionsSnapshot(trades, { TON: 2.4 }, "2026-05-06T12:00:00.000Z");

    expect(positions.positions[0]).toMatchObject({
      next_action: "hold",
      next_action_price: null,
    });
    expect(positions.alerts).toHaveLength(0);
  });

  test("scores active scorecard signals without duplicating existing outcomes", () => {
    const updates = scoreScorecardSignals(
      [
        {
          id: "signal-btc",
          type: "signal",
          asset: "BTC",
          status: "active",
          entry_price: 80000,
          exit_strategy: {
            target_1: { price: 82000 },
            stop_loss: { price: 76000 },
          },
        },
        {
          type: "scorecard_update",
          prediction_id: "signal-zec",
          status: "target_hit",
        },
        {
          id: "signal-zec",
          type: "signal",
          asset: "ZEC",
          status: "active",
          entry_price: 400,
          exit_strategy: {
            target_1: { price: 450 },
            stop_loss: { price: 380 },
          },
        },
      ],
      { BTC: 83000, ZEC: 460 },
      "2026-05-06T23:00:00.000Z",
    );

    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      type: "scorecard_update",
      prediction_id: "signal-btc",
      status: "target_hit",
      current_price: 83000,
    });
  });

  test("aggregates today's ROI costs by system and creates stable cron entries", () => {
    const summary = aggregateDailyCosts(
      [
        { timestamp: "2026-05-07T12:00:00Z", system: "crypto-intel", cost: 0.45 },
        { timestamp: "2026-05-07T13:00:00Z", system: "polymarket-intel", cost: 0.2 },
        { timestamp: "2026-05-06T13:00:00Z", system: "crypto-intel", cost: 0.99 },
      ],
      "2026-05-07",
    );

    expect(summary).toMatchObject({
      date: "2026-05-07",
      total_cost: 0.65,
      systems: {
        "crypto-intel": 0.45,
        "polymarket-intel": 0.2,
      },
    });

    expect(buildCronEntries("/Users/sky/Documents/Codex/mission-control")).toContain(
      "JOB_ID=paper-trading-midday-check /Users/sky/Documents/Codex/mission-control/scripts/openclaw/update-positions.js",
    );
    expect(buildCronEntries("/Users/sky/Documents/Codex/mission-control")).toContain(
      "0 23 * * * JOB_ID=crypto-intel-scorecard-update",
    );
    expect(buildCronEntries("/Users/sky/Documents/Codex/mission-control")).toContain(
      "5 23 * * * JOB_ID=roi-daily-aggregation",
    );
  });

  test("ensures automation jobs exist without removing existing schedule entries", () => {
    const schedule = ensureAutomationJobsInSchedule({
      jobs: [
        {
          id: "crypto-intel-brief",
          name: "Crypto Intel Daily Brief",
          schedule: "Daily 7:00 AM CT",
          description: "Existing job",
          cost_per_run: 0.45,
          runs_per_month: 30,
          monthly_cost: 13.5,
          last_run: null,
          next_run: null,
          status: "success",
        },
      ],
      last_updated: "2026-05-07T00:00:00.000Z",
    });

    expect(schedule.jobs.map((job) => job.id)).toEqual([
      "crypto-intel-brief",
      "paper-trading-midday-check",
      "paper-trading-evening-check",
      "crypto-intel-scorecard-update",
      "roi-daily-aggregation",
    ]);
    expect(schedule.total_monthly_cost).toBe(25.5);
  });
});
