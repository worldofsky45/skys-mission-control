export type TradeStatus = "active" | "active_partial" | "closed" | "partial";
export type PositionSide = "long" | "short";

export interface EquityPoint {
  timestamp: string;
  value: number;
}

export interface PaperTrade {
  id: string;
  date: string;
  signal: string;
  asset: string;
  conviction?: string;
  entry_price: number;
  position_size: number;
  position_value: number;
  position_pct?: number;
  stop_loss?: number | null;
  target_1?: number | null;
  target_2?: number | null;
  target_3?: number | null;
  status: TradeStatus;
  outcome?: string | null;
  exit_price?: number | null;
  pnl?: number | null;
  pnl_pct?: number | null;
  notes?: string;
  created_at: string;
}

export interface PaperPosition {
  asset: string;
  signal: string;
  entry_price: number;
  current_price: number;
  quantity: number;
  entry_value: number;
  current_value: number;
  unrealized_pnl: number;
  pnl_pct: number;
  side: PositionSide;
  entry_date: string;
  is_winning: boolean;
}

export interface PaperBalance {
  current_balance: number;
  starting_balance: number;
  total_pnl: number;
  total_pnl_pct: number;
  realized_pnl: number;
  unrealized_pnl: number;
  peak_balance: number;
  max_drawdown: number;
  equity_curve: EquityPoint[];
  last_updated: string;
}

export interface PaperTradingStats {
  total: number;
  active: number;
  closed: number;
  winning: number;
  losing: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  risk_reward: number;
  largest_win: number;
  largest_loss: number;
}

export interface PaperTradesResponse {
  trades: PaperTrade[];
  stats: PaperTradingStats;
}

export interface PaperPositionsResponse {
  positions: PaperPosition[];
  total_unrealized_pnl: number;
  price_source: "live" | "cache" | "none";
}

export interface PaperBalanceResponse {
  balance: PaperBalance;
  is_stale: boolean;
  price_source: "live" | "cache" | "none";
}

export interface PolymarketSignal {
  id?: string;
  signal_id?: string;
  timestamp?: string;
  created_at?: string;
  market: string;
  market_id?: string | null;
  category?: string;
  prediction: string;
  confidence?: number;
  entry_odds?: number | string;
  current_odds?: number | string | null;
  entry_price?: number;
  position_size?: number;
  status: "active" | "resolved" | "won" | "lost" | "pending" | string;
  created_by?: string;
  [key: string]: unknown;
}

export interface PolymarketOutcome {
  signal_id: string;
  market?: string;
  resolved: boolean;
  won: boolean;
  actual_outcome: "won" | "lost";
  actual_odds: number;
  pnl: number;
  roi: number;
  resolved_date: string;
}

export interface PolymarketStats {
  active: number;
  resolved: number;
  won: number;
  lost: number;
  accuracy: number;
  total_pnl: number;
}

export interface EnrichedPolymarketSignal extends PolymarketSignal {
  id: string;
  current_odds: number | string | null;
  odds_source: "file" | "not_available";
  potential_pnl: number;
  resolved: boolean;
  won: boolean | null;
  pnl: number;
}

export interface PolymarketSignalsResponse {
  signals: EnrichedPolymarketSignal[];
  stats: PolymarketStats;
}

export type ArbitrageMonitorStatus = "opportunities" | "monitoring" | "stale" | "missing";

export interface ArbitrageMarket {
  id?: string;
  title: string;
  price: number;
  volume_24h?: number;
  url?: string;
}

export interface ArbitrageOpportunity {
  kalshi_market: ArbitrageMarket;
  polymarket_market: ArbitrageMarket;
  similarity_score?: number;
  match_method?: string;
  validation?: {
    entities?: {
      match?: boolean;
      score?: number;
      common?: string[];
    };
    dates?: {
      match?: boolean;
      year?: string;
    };
  };
  arbitrage: {
    profit_pct: number;
    strategy: string;
    kalshi_price: number;
    polymarket_price: number;
    spread: number;
    net_profit?: number;
  };
}

export interface ArbitrageMonitorResponse {
  timestamp: string | null;
  version: string | null;
  total_matches: number;
  profitable_count: number;
  min_profit_threshold: number;
  opportunities: ArbitrageOpportunity[];
  status: ArbitrageMonitorStatus;
  message: string;
}

export interface Idea {
  id: string;
  name: string;
  tier?: number;
  stars?: number;
  one_liner?: string;
  roi_potential?: string;
  complexity?: string;
  capital_required?: string;
  feedback_loop?: string;
  status?: string;
  approved?: string;
  approved_date?: string;
  rejected?: string;
  rejection_date?: string;
  week?: number;
  next_milestone?: string;
  [key: string]: unknown;
}

export interface IdeasState {
  pending: Idea[];
  approved: Idea[];
  rejected: Idea[];
  queued: Idea[];
  last_updated?: string;
}

export interface IdeasResponse extends IdeasState {
  counts: Record<string, number>;
}

export interface IdeaAction {
  timestamp: string;
  id: string;
  action: "approve" | "reject";
  note: string;
}

export interface ROIEntry {
  timestamp: string;
  name: string;
  invested: number;
  roi: number;
  description?: string;
  status: "active" | "completed" | "paused" | string;
}

export interface ROIProject extends ROIEntry {
  current_value: number;
  roi_pct: number;
  last_updated: string;
}

export interface AggregatedROI {
  total_invested: number;
  total_roi: number;
  roi_percentage: number;
  projects: ROIProject[];
}

export interface CostEntry {
  date: string;
  amount: number;
  category: string;
  description: string;
  project?: string;
}

export interface CostSummary {
  total_spent: number;
  daily_average: number;
  days_elapsed: number;
  days_remaining: number;
  budget_total: number;
  budget_used_pct: number;
  projected_total: number;
  on_track: boolean;
}

export interface CostCategory {
  category: string;
  amount: number;
  pct: number;
}

export interface CostProject {
  project: string;
  amount: number;
  pct: number;
}

export interface CostDailyBreakdown {
  date: string;
  amount: number;
  running_total: number;
}

export interface CostsResponse {
  summary: CostSummary;
  by_category: CostCategory[];
  by_project: CostProject[];
  daily_breakdown: CostDailyBreakdown[];
  recent_expenses: CostEntry[];
}

export interface JobScheduleEntry {
  id: string;
  name: string;
  schedule: string;
  description: string;
  cost_per_run: number;
  runs_per_month: number;
  monthly_cost: number;
  last_run: string | null;
  next_run: string | null;
  status: string;
}

export interface JobRunEntry {
  timestamp: string;
  job_id: string;
  status: string;
  duration_seconds?: number;
  cost?: number;
  tokens?: {
    input?: number;
    output?: number;
  };
  output_summary?: string;
}

export interface JobWithLatestRun extends JobScheduleEntry {
  latest_run: JobRunEntry | null;
}

export interface JobsSummary {
  total_jobs: number;
  healthy_jobs: number;
  warning_jobs: number;
  monthly_cost: number;
  recent_runs: number;
  last_run_at: string | null;
}

export interface JobsResponse {
  summary: JobsSummary;
  jobs: JobWithLatestRun[];
  recent_runs: JobRunEntry[];
  last_updated: string | null;
}

export type ActivityEventType = "signal" | "cost" | "trade" | "alert";
export type ActivitySystem = "crypto-intel" | "polymarket-intel" | "nova";

export interface ActivitySignal {
  asset?: string;
  action?: string;
  conviction?: string;
  target?: number;
  stop?: number;
}

export interface ActivityOpportunity {
  market: string;
  odds: string;
  conviction: string;
  edge: string;
}

export interface ActivityEvent {
  type: ActivityEventType;
  system: ActivitySystem;
  title: string;
  summary: string;
  timestamp: string;
  signals?: ActivitySignal[];
  opportunities?: ActivityOpportunity[];
}

export interface ActivityEventRecord extends ActivityEvent {
  received_at: string;
}

export interface ActivityResponse {
  events: ActivityEventRecord[];
}

export interface MemoryMd {
  path: string;
  content: string;
  last_updated: string;
  size_kb: number;
  sections: string[];
}

export interface MemoryFile {
  name: string;
  path: string;
  last_updated: string;
  size_kb: number;
}

export interface MemoryGraphLink {
  from: string;
  to: string;
  type: string;
}

export interface MemoryStats {
  total_files: number;
  total_size_kb: number;
  last_consolidated: string;
}

export interface MemoryResponse {
  memory_md: MemoryMd;
  memory_files: MemoryFile[];
  graph_links: MemoryGraphLink[];
  stats: MemoryStats;
}

export type AgentSessionType = "codex" | "openclaw" | "subagent";
export type AgentSessionStatus = "active" | "completed" | "failed";

export interface AgentSession {
  id: string;
  type: AgentSessionType;
  started_at: string;
  ended_at?: string | null;
  duration_mins: number;
  tokens_used: number;
  status: AgentSessionStatus;
  agent?: string;
  model?: string;
}

export interface AgentStats {
  total_sessions_today: number;
  total_tokens_today: number;
  avg_session_mins: number;
  active_sessions: number;
  completed_sessions: number;
  failed_sessions: number;
}

export interface AgentsResponse {
  sessions: AgentSession[];
  stats: AgentStats;
  current_model: string;
  default_model: string;
}

export type HealthLevel = "healthy" | "warning" | "critical";

export interface HealthCheck {
  name: string;
  status: HealthLevel;
  last_updated?: string | null;
  details: string;
}

export interface HealthStatus {
  status: HealthLevel;
  message: string;
  checks: HealthCheck[];
  timestamp: string;
}
