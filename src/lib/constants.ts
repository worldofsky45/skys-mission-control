export const paths = {
  workspace: process.env.WORKSPACE_PATH ?? "/Users/sky/.openclaw/workspace",
  paperTrading:
    process.env.PAPER_TRADING_PATH ?? "/Users/sky/.openclaw/workspace/crypto-intel/paper-trading",
  polymarketSignals:
    process.env.POLYMARKET_SIGNALS_PATH ??
    "/Users/sky/.openclaw/workspace/polymarket-signals.jsonl",
  polymarketTrades:
    process.env.POLYMARKET_TRADES_PATH ??
    "/Users/sky/.openclaw/workspace/polymarket-intel/trades.jsonl",
  polymarketScorecard:
    process.env.POLYMARKET_SCORECARD_PATH ??
    "/Users/sky/.openclaw/workspace/polymarket-intel/scorecard.jsonl",
  polymarketArbitrage:
    process.env.POLYMARKET_ARBITRAGE_PATH ??
    "/Users/sky/.openclaw/workspace/polymarket-intel/cache/arbitrage-opportunities.json",
  ideasState:
    process.env.IDEAS_STATE_PATH ??
    "/Users/sky/.openclaw/workspace/skills/engine-ideation/ideas-state.json",
  ideaActions:
    process.env.IDEA_ACTIONS_PATH ?? "/Users/sky/.openclaw/workspace/idea-engine-actions.jsonl",
  roiTracker:
    process.env.ROI_TRACKER_PATH ?? "/Users/sky/.openclaw/workspace/roi-tracker.jsonl",
  costs:
    process.env.COSTS_PATH ?? "/Users/sky/.openclaw/workspace/costs.jsonl",
  jobsSchedule:
    process.env.JOBS_SCHEDULE_PATH ?? "/Users/sky/.openclaw/workspace/jobs-schedule.json",
  jobRuns:
    process.env.JOB_RUNS_PATH ?? "/Users/sky/.openclaw/workspace/job-runs.jsonl",
  activityLog:
    process.env.ACTIVITY_LOG_PATH ??
    "/Users/sky/.openclaw/workspace/mission-control/activity-feed.jsonl",
  memoryMd:
    process.env.MEMORY_MD_PATH ?? "/Users/sky/.openclaw/workspace/MEMORY.md",
  memoryDir:
    process.env.MEMORY_DIR_PATH ?? "/Users/sky/.openclaw/workspace/memory",
  memoryGraphLinks:
    process.env.MEMORY_GRAPH_LINKS_PATH ?? "/Users/sky/.openclaw/workspace/memory/graph-links.json",
  codexSessions:
    process.env.CODEX_SESSIONS_PATH ?? "/Users/sky/.codex/sessions",
  priceCache:
    process.env.PRICE_CACHE_PATH ??
    "/Users/sky/.openclaw/workspace/crypto-intel/cache/prices-cache.json",
} as const;

export const refresh = {
  pollingMs: 30_000,
  cacheMs: 5_000,
  staleMs: 24 * 60 * 60 * 1000,
} as const;

export const coingeckoIds: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  TON: "the-open-network",
  PENGU: "pengu",
  ZEC: "zcash",
};
