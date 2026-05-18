import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";
import AgentsPage from "./agents/page";
import HealthPage from "./health/page";
import IdeasPage from "./ideas/page";
import MemoryPage from "./memory/page";
import PaperTradingPage from "./paper-trading/page";
import PolymarketPage from "./polymarket/page";
import ROIPage from "./roi/page";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type {
  AggregatedROI,
  ActivityResponse,
  AgentsResponse,
  HealthStatus,
  IdeasResponse,
  JobsResponse,
  MemoryResponse,
  PaperBalanceResponse,
  PaperPositionsResponse,
  PaperTradesResponse,
  PolymarketSignalsResponse,
} from "@/lib/types";

vi.mock("@/hooks/useAutoRefresh", () => ({
  useAutoRefresh: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  approveIdea: vi.fn(),
  rejectIdea: vi.fn(),
  resolvePolymarketSignal: vi.fn(),
}));

type HookState = {
  data: unknown;
  loading: boolean;
  error: Error | null;
  refresh: ReturnType<typeof vi.fn<() => Promise<void>>>;
  lastUpdated: Date | null;
};

const refreshFns = new Map<string, ReturnType<typeof vi.fn<() => Promise<void>>>>();
let endpointOverrides = new Map<string, Partial<HookState>>();

function makeHookState<T>(endpoint: string, data: T) {
  let refresh = refreshFns.get(endpoint);

  if (!refresh) {
    refresh = vi.fn<() => Promise<void>>(async () => undefined);
    refreshFns.set(endpoint, refresh);
  }

  return {
    data,
    loading: false,
    error: null,
    refresh,
    lastUpdated: new Date("2026-05-06T12:00:00.000Z"),
  };
}

const health: HealthStatus = {
  status: "healthy",
  message: "All systems reporting",
  timestamp: "2026-05-06T12:00:00.000Z",
  checks: [],
};

const jobs: JobsResponse = {
  summary: {
    total_jobs: 1,
    healthy_jobs: 1,
    warning_jobs: 0,
    monthly_cost: 13.5,
    recent_runs: 1,
    last_run_at: "2026-05-07T07:04:00-05:00",
  },
  jobs: [
    {
      id: "crypto-intel-brief",
      name: "Crypto Intel Daily Brief",
      schedule: "Daily 7:00 AM CT",
      description: "Market analysis + trade signals",
      cost_per_run: 0.45,
      runs_per_month: 30,
      monthly_cost: 13.5,
      last_run: "2026-05-07T07:04:00-05:00",
      next_run: "2026-05-08T07:00:00-05:00",
      status: "success",
      latest_run: null,
    },
  ],
  recent_runs: [],
  last_updated: "2026-05-07T07:04:00-05:00",
};

const memory: MemoryResponse = {
  memory_md: {
    path: "MEMORY.md",
    content: "# OpenClaw Memory\n\n## Active Projects\nMission Control Dashboard",
    last_updated: "2026-05-07T12:00:00.000Z",
    size_kb: 4.2,
    sections: ["Active Projects"],
  },
  memory_files: [
    {
      name: "project-memory.md",
      path: "memory/project-memory.md",
      last_updated: "2026-05-07T12:00:00.000Z",
      size_kb: 6.1,
    },
  ],
  graph_links: [{ from: "Mission Control", to: "Paper Trading", type: "integrates" }],
  stats: {
    total_files: 2,
    total_size_kb: 10.3,
    last_consolidated: "2026-05-07T12:00:00.000Z",
  },
};

const agents: AgentsResponse = {
  sessions: [
    {
      id: "019e09d9-0b8c-7013-93be-a348623da13a",
      type: "subagent",
      started_at: "2026-05-08T23:10:00.000Z",
      ended_at: null,
      duration_mins: 15,
      tokens_used: 1500,
      status: "active",
      agent: "explorer",
      model: "gpt-5.2",
    },
  ],
  stats: {
    total_sessions_today: 1,
    total_tokens_today: 1500,
    avg_session_mins: 15,
    active_sessions: 1,
    completed_sessions: 0,
    failed_sessions: 0,
  },
  current_model: "gpt-5.2",
  default_model: "gpt-5.2",
};

const activity: ActivityResponse = {
  events: [
    {
      type: "signal",
      system: "crypto-intel",
      title: "BTC breakout watch",
      summary: "Momentum improving into daily close.",
      timestamp: "2026-05-08T20:20:00.000Z",
      received_at: "2026-05-08T20:30:00.000Z",
      signals: [{ asset: "BTC", action: "watch", conviction: "medium", target: 69000 }],
    },
  ],
};

const balance: PaperBalanceResponse = {
  balance: {
    current_balance: 10500,
    starting_balance: 10000,
    total_pnl: 500,
    total_pnl_pct: 5,
    realized_pnl: 300,
    unrealized_pnl: 200,
    peak_balance: 11000,
    max_drawdown: 120,
    equity_curve: [
      { timestamp: "2026-05-01T00:00:00.000Z", value: 10000 },
      { timestamp: "2026-05-06T00:00:00.000Z", value: 10500 },
    ],
    last_updated: "2026-05-06T12:00:00.000Z",
  },
  is_stale: false,
  price_source: "live",
};

const trades: PaperTradesResponse = {
  trades: [],
  stats: {
    total: 0,
    active: 0,
    closed: 0,
    winning: 0,
    losing: 0,
    win_rate: 60,
    avg_win: 0,
    avg_loss: 0,
    risk_reward: 0,
    largest_win: 0,
    largest_loss: 0,
  },
};

const positions: PaperPositionsResponse = {
  positions: [],
  total_unrealized_pnl: 0,
  price_source: "live",
};

const polymarket: PolymarketSignalsResponse = {
  signals: [],
  stats: {
    active: 0,
    resolved: 0,
    won: 0,
    lost: 0,
    accuracy: 0,
    total_pnl: 0,
  },
};

const ideas: IdeasResponse = {
  pending: [
    {
      id: "idea-1",
      name: "Crypto risk journal",
      one_liner: "Daily risk log",
    },
  ],
  approved: [],
  rejected: [],
  queued: [],
  counts: { pending: 1, approved: 0, rejected: 0, queued: 0 },
};

const roi: AggregatedROI = {
  total_invested: 0,
  total_roi: 0,
  roi_percentage: 0,
  projects: [],
};

describe("Mission Control page", () => {
  beforeEach(() => {
    refreshFns.clear();
    endpointOverrides = new Map();
    vi.mocked(useAutoRefresh).mockImplementation(({ endpoint }) => {
      const stateByEndpoint = {
        "/api/health": makeHookState(endpoint, health),
        "/api/activity": makeHookState(endpoint, activity),
        "/api/health/jobs": makeHookState(endpoint, jobs),
        "/api/memory": makeHookState(endpoint, memory),
        "/api/agents": makeHookState(endpoint, agents),
        "/api/paper-trading/balance": makeHookState(endpoint, balance),
        "/api/paper-trading/trades": makeHookState(endpoint, trades),
        "/api/paper-trading/positions": makeHookState(endpoint, positions),
        "/api/polymarket/signals": makeHookState(endpoint, polymarket),
        "/api/ideas/list": makeHookState(endpoint, ideas),
        "/api/roi": makeHookState(endpoint, roi),
      } as Record<string, ReturnType<typeof makeHookState>>;

      return {
        ...stateByEndpoint[endpoint],
        ...endpointOverrides.get(endpoint),
      };
    });
  });

  it("assembles the dashboard from independent data sections", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Sky's Mission Control" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Activity Feed" })).toBeInTheDocument();
    expect(screen.getByText("BTC breakout watch")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /paper trading/i })).toHaveAttribute(
      "href",
      "/paper-trading",
    );
    expect(screen.getByRole("link", { name: /polymarket/i })).toHaveAttribute(
      "href",
      "/polymarket",
    );
    expect(screen.queryByText("Crypto risk journal")).not.toBeInTheDocument();
  });

  it("keeps other sections visible when one section errors", () => {
    endpointOverrides.set("/api/paper-trading/balance", {
      error: new Error("Paper trading not initialized"),
    });

    render(<Home />);

    expect(screen.getByText("Paper trading not initialized")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /idea engine/i })).toBeInTheDocument();
  });

  it("renders dedicated utility pages", () => {
    const { unmount } = render(<PaperTradingPage />);
    expect(screen.getByRole("heading", { name: "Paper Trading" })).toBeInTheDocument();
    expect(screen.getByText("Active Positions")).toBeInTheDocument();
    unmount();

    const polymarketRender = render(<PolymarketPage />);
    expect(screen.getByRole("heading", { name: "Polymarket" })).toBeInTheDocument();
    expect(screen.getByText("Polymarket Signals")).toBeInTheDocument();
    polymarketRender.unmount();

    const ideasRender = render(<IdeasPage />);
    expect(screen.getByRole("heading", { name: "Idea Engine" })).toBeInTheDocument();
    expect(screen.getByText("Crypto risk journal")).toBeInTheDocument();
    ideasRender.unmount();

    const roiRender = render(<ROIPage />);
    expect(screen.getByRole("heading", { name: "ROI Tracker" })).toBeInTheDocument();
    roiRender.unmount();

    const memoryRender = render(<MemoryPage />);
    expect(screen.getByRole("heading", { name: "Memory System" })).toBeInTheDocument();
    expect(screen.getByText("project-memory.md")).toBeInTheDocument();
    memoryRender.unmount();

    const agentsRender = render(<AgentsPage />);
    expect(screen.getByRole("heading", { name: "Agents & Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent Sessions" })).toBeInTheDocument();
    agentsRender.unmount();

    render(<HealthPage />);
    expect(screen.getByRole("heading", { name: "System Health" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Automation Jobs" })).toBeInTheDocument();
  });

  it("refreshes all sections with R and opens shortcuts with question mark", async () => {
    render(<Home />);
    await act(async () => {
      await Promise.resolve();
    });
    const refreshes = [...refreshFns.values()];

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    await waitFor(() => {
      expect(refreshes.every((refresh) => refresh.mock.calls.length >= 1)).toBe(true);
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });
});
