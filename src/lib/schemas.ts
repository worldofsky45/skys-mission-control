import { z } from "zod";

export const paperTradeSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  signal: z.string().min(1),
  asset: z.string().min(1),
  conviction: z.string().optional(),
  entry_price: z.coerce.number(),
  position_size: z.coerce.number(),
  position_value: z.coerce.number(),
  position_pct: z.coerce.number().optional(),
  stop_loss: z.coerce.number().nullable().optional(),
  target_1: z.coerce.number().nullable().optional(),
  target_2: z.coerce.number().nullable().optional(),
  target_3: z.coerce.number().nullable().optional(),
  status: z.enum(["active", "active_partial", "closed", "partial"]),
  outcome: z.string().nullable().optional(),
  exit_price: z.coerce.number().nullable().optional(),
  pnl: z.coerce.number().nullable().optional(),
  pnl_pct: z.coerce.number().nullable().optional(),
  notes: z.string().optional(),
  created_at: z.string().min(1),
});

export const paperPositionSchema = z.object({
  asset: z.string().min(1),
  signal: z.string().min(1),
  entry_price: z.coerce.number(),
  current_price: z.coerce.number(),
  quantity: z.coerce.number(),
  entry_value: z.coerce.number(),
  current_value: z.coerce.number(),
  unrealized_pnl: z.coerce.number(),
  pnl_pct: z.coerce.number(),
  side: z.enum(["long", "short"]),
  entry_date: z.string().min(1),
  is_winning: z.boolean(),
});

export const paperBalanceSchema = z.object({
  current_balance: z.coerce.number(),
  starting_balance: z.coerce.number(),
  total_pnl: z.coerce.number(),
  total_pnl_pct: z.coerce.number(),
  realized_pnl: z.coerce.number(),
  unrealized_pnl: z.coerce.number(),
  peak_balance: z.coerce.number(),
  max_drawdown: z.coerce.number(),
  equity_curve: z
    .array(
      z.object({
        timestamp: z.string().min(1),
        value: z.coerce.number(),
      }),
    )
    .default([]),
  last_updated: z.string().min(1),
});

export const polymarketSignalSchema = z
  .object({
    id: z.string().optional(),
    signal_id: z.string().optional(),
    timestamp: z.string().optional(),
    created_at: z.string().optional(),
    market: z.string().min(1),
    market_id: z.string().nullable().optional(),
    category: z.string().optional(),
    prediction: z.string().min(1),
    confidence: z.coerce.number().optional(),
    entry_odds: z.union([z.coerce.number(), z.string()]).optional(),
    current_odds: z.union([z.coerce.number(), z.string()]).nullable().optional(),
    entry_price: z.coerce.number().optional(),
    position_size: z.coerce.number().optional(),
    status: z.string().min(1),
    created_by: z.string().optional(),
  })
  .passthrough();

export const roiEntrySchema = z.object({
  timestamp: z.string().min(1),
  name: z.string().min(1),
  invested: z.coerce.number(),
  roi: z.coerce.number(),
  description: z.string().optional(),
  status: z.string().min(1),
});

export const costEntrySchema = z.object({
  date: z.string().min(1),
  amount: z.coerce.number(),
  category: z.string().min(1),
  description: z.string().min(1),
  project: z.string().optional(),
});

export const jobScheduleEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  schedule: z.string().min(1),
  description: z.string().min(1),
  cost_per_run: z.coerce.number(),
  runs_per_month: z.coerce.number(),
  monthly_cost: z.coerce.number(),
  last_run: z.string().nullable().optional().default(null),
  next_run: z.string().nullable().optional().default(null),
  status: z.string().min(1),
});

export const jobsScheduleSchema = z.object({
  jobs: z.array(jobScheduleEntrySchema).default([]),
  total_monthly_cost: z.coerce.number().optional(),
  last_updated: z.string().nullable().optional().default(null),
});

export const jobRunEntrySchema = z.object({
  timestamp: z.string().min(1),
  job_id: z.string().min(1),
  status: z.string().min(1),
  duration_seconds: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  tokens: z
    .object({
      input: z.coerce.number().optional(),
      output: z.coerce.number().optional(),
    })
    .optional(),
  output_summary: z.string().optional(),
});

export const activitySignalSchema = z.object({
  asset: z.string().optional(),
  action: z.string().optional(),
  conviction: z.string().optional(),
  target: z.coerce.number().optional(),
  stop: z.coerce.number().optional(),
});

export const activityOpportunitySchema = z.object({
  market: z.string().min(1),
  odds: z.string().min(1),
  conviction: z.string().min(1),
  edge: z.string().min(1),
});

export const activityEventSchema = z.object({
  type: z.enum(["signal", "cost", "trade", "alert"]),
  system: z.enum(["crypto-intel", "polymarket-intel", "nova"]),
  title: z.string().min(1),
  summary: z.string().min(1),
  timestamp: z.string().min(1),
  signals: z.array(activitySignalSchema).optional(),
  opportunities: z.array(activityOpportunitySchema).optional(),
});

export const activityEventRecordSchema = activityEventSchema.extend({
  received_at: z.string().min(1),
});

export const memoryGraphLinkSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  type: z.string().min(1),
});

export const memoryGraphLinksSchema = z.union([
  z.array(memoryGraphLinkSchema),
  z.object({ links: z.array(memoryGraphLinkSchema).default([]) }),
]);

export const ideaSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    tier: z.coerce.number().optional(),
    stars: z.coerce.number().optional(),
    one_liner: z.string().optional(),
    roi_potential: z.string().optional(),
    complexity: z.string().optional(),
    capital_required: z.string().optional(),
    feedback_loop: z.string().optional(),
    status: z.string().optional(),
    approved: z.string().optional(),
    approved_date: z.string().optional(),
    rejected: z.string().optional(),
    rejection_date: z.string().optional(),
    week: z.coerce.number().optional(),
    next_milestone: z.string().optional(),
  })
  .passthrough();

export const ideasStateSchema = z.object({
  pending: z.array(ideaSchema).default([]),
  approved: z.array(ideaSchema).default([]),
  rejected: z.array(ideaSchema).default([]),
  queued: z.array(ideaSchema).default([]),
  last_updated: z.string().optional(),
});

export const ideaActionRequestSchema = z.object({
  id: z.string().min(1),
  note: z.string().trim().max(1000).optional().default(""),
});

export const polymarketOutcomeRequestSchema = z.object({
  signal_id: z.string().min(1),
  outcome: z.enum(["won", "lost"]),
  actual_odds: z.coerce.number().min(0).max(1),
  settled_date: z.string().min(1).optional(),
});

export const arbitrageMarketSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  price: z.coerce.number(),
  volume_24h: z.coerce.number().optional(),
  url: z.string().optional(),
});

export const arbitrageOpportunitySchema = z.object({
  kalshi_market: arbitrageMarketSchema,
  polymarket_market: arbitrageMarketSchema,
  similarity_score: z.coerce.number().optional(),
  match_method: z.string().optional(),
  validation: z
    .object({
      entities: z
        .object({
          match: z.boolean().optional(),
          score: z.coerce.number().optional(),
          common: z.array(z.string()).optional(),
        })
        .optional(),
      dates: z
        .object({
          match: z.boolean().optional(),
          year: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  arbitrage: z.object({
    profit_pct: z.coerce.number(),
    strategy: z.string().min(1),
    kalshi_price: z.coerce.number(),
    polymarket_price: z.coerce.number(),
    spread: z.coerce.number(),
    net_profit: z.coerce.number().optional(),
  }),
});

export const arbitrageSnapshotSchema = z.object({
  timestamp: z.string().optional().nullable(),
  version: z.string().optional().nullable(),
  total_matches: z.coerce.number().default(0),
  profitable_count: z.coerce.number().default(0),
  min_profit_threshold: z.coerce.number().default(1),
  opportunities: z.array(arbitrageOpportunitySchema).default([]),
});

export type PaperTradeInput = z.infer<typeof paperTradeSchema>;
export type PolymarketSignalInput = z.infer<typeof polymarketSignalSchema>;
export type IdeasStateInput = z.infer<typeof ideasStateSchema>;
export type ROIEntryInput = z.infer<typeof roiEntrySchema>;
export type CostEntryInput = z.infer<typeof costEntrySchema>;
export type JobScheduleEntryInput = z.infer<typeof jobScheduleEntrySchema>;
export type JobsScheduleInput = z.infer<typeof jobsScheduleSchema>;
export type JobRunEntryInput = z.infer<typeof jobRunEntrySchema>;
export type ActivityEventInput = z.infer<typeof activityEventSchema>;
export type ActivityEventRecordInput = z.infer<typeof activityEventRecordSchema>;
export type MemoryGraphLinkInput = z.infer<typeof memoryGraphLinkSchema>;
export type ArbitrageSnapshotInput = z.infer<typeof arbitrageSnapshotSchema>;
