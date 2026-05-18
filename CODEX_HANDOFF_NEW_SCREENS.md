# Mission Control - New Screens Build (Costs, Memory, Agents)

**Date:** 2026-05-07  
**Build Context:** Adding 3 missing screens to existing Mission Control dashboard  
**Existing Codebase:** `/Users/sky/Documents/Codex/mission-control`

---

## 🎯 What You're Building

Add **3 new screens** to the existing Mission Control dashboard:

1. **Costs Screen** - Track AI API spend, budget progress, cost per project
2. **Memory Screen** - View/manage OpenClaw memory system (MEMORY.md, memory/*.md)
3. **Agents Screen** - Monitor active sessions, sub-agents, token usage

**CRITICAL:** Match the existing architecture, design patterns, and component structure exactly.

---

## 📦 Existing Architecture (DO NOT CHANGE)

### Project Structure
```
mission-control/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Overview (existing)
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Tailwind styles
│   │   ├── paper-trading/page.tsx      # ✅ Existing
│   │   ├── polymarket/page.tsx         # ✅ Existing
│   │   ├── ideas/page.tsx              # ✅ Existing
│   │   ├── roi/page.tsx                # ✅ Existing
│   │   ├── health/page.tsx             # ✅ Existing
│   │   ├── costs/page.tsx              # ⚠️ BUILD THIS
│   │   ├── memory/page.tsx             # ⚠️ BUILD THIS
│   │   ├── agents/page.tsx             # ⚠️ BUILD THIS
│   │   └── api/
│   │       ├── costs/route.ts          # ⚠️ BUILD THIS
│   │       ├── memory/route.ts         # ⚠️ BUILD THIS
│   │       └── agents/route.ts         # ⚠️ BUILD THIS
│   ├── components/
│   │   ├── AppShell.tsx                # ✅ Existing wrapper (update nav)
│   │   ├── ErrorPanel.tsx              # ✅ Existing error component
│   │   ├── SystemHealth.tsx            # ✅ Existing
│   │   ├── Costs/                      # ⚠️ BUILD THIS
│   │   │   ├── SpendSummary.tsx
│   │   │   ├── DailyBreakdown.tsx
│   │   │   └── BudgetProgress.tsx
│   │   ├── Memory/                     # ⚠️ BUILD THIS
│   │   │   ├── MemoryViewer.tsx
│   │   │   ├── GraphLinks.tsx
│   │   │   └── RecentUpdates.tsx
│   │   └── Agents/                     # ⚠️ BUILD THIS
│   │       ├── SessionsList.tsx
│   │       ├── TokenUsage.tsx
│   │       └── ActiveSubagents.tsx
│   ├── lib/
│   │   ├── api.ts                      # ✅ Existing API client
│   │   ├── types.ts                    # ✅ Existing types (add new types)
│   │   └── utils.ts                    # ✅ Existing utils
│   └── hooks/
│       └── useAutoRefresh.ts           # ✅ Existing polling hook
```

### Tech Stack (MUST USE)
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Data Fetching:** SWR with 30s polling
- **Component Pattern:** Server Components + Client Components with "use client"
- **Error Handling:** ErrorPanel component
- **Layout:** AppShell wrapper for all pages

### Design System (MATCH EXACTLY)

**Colors:**
```css
bg-[#0b1020]           /* Page background */
bg-white/[0.04]        /* Card background */
border-white/10        /* Card borders */
text-slate-50          /* Primary text */
text-slate-300         /* Secondary text */
text-cyan-200          /* Accent text */
text-cyan-50           /* Active links */
border-cyan-300/50     /* Active borders */
bg-cyan-300/10         /* Active background */
```

**Typography:**
```css
text-3xl md:text-4xl font-semibold   /* Page title */
text-sm font-semibold                /* Card title */
text-xs text-slate-400               /* Card subtitle */
text-sm leading-6 text-slate-300     /* Description */
```

**Cards:**
```tsx
<div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
  {/* Card content */}
</div>
```

**Buttons:**
```tsx
<button className="rounded border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:border-cyan-300/50">
  Button Text
</button>
```

---

## 🎨 Screen 1: Costs Screen

### Purpose
Track AI API spend across all projects, monitor budget progress, and analyze cost efficiency.

### Data Source
**Primary:** `/Users/sky/.openclaw/workspace/costs.jsonl`

**Schema:**
```json
{"date":"2026-05-03","amount":25.00,"category":"AI Services","description":"OpenRouter API - Initial crypto intel"}
```

**Additional Sources:**
- `/Users/sky/.openclaw/workspace/roi-tracker/cost-details.jsonl` (per-project breakdown)
- Calculate daily average from costs.jsonl
- 15-day sprint budget: $375 total ($25/day target)

### API Route: `/api/costs/route.ts`

```typescript
// GET endpoint
export async function GET() {
  // 1. Read costs.jsonl line by line
  // 2. Parse each entry as JSON
  // 3. Calculate aggregates:
  //    - Total spent to date
  //    - Daily average
  //    - Spending by category
  //    - Spending by project (if available)
  //    - Budget progress (15-day sprint: $375)
  //    - Days remaining in sprint (May 4-18)
  //    - Projected total at current rate
  // 4. Group entries by date for chart data
  // 5. Return structured response

  return NextResponse.json({
    summary: {
      total_spent: 60.00,
      daily_average: 20.00,
      days_elapsed: 3,
      days_remaining: 12,
      budget_total: 375.00,
      budget_used_pct: 16.00,
      projected_total: 300.00,
      on_track: true
    },
    by_category: [
      { category: "AI Services", amount: 60.00, pct: 100 }
    ],
    by_project: [
      { project: "Crypto Intel", amount: 35.00, pct: 58.33 },
      { project: "Mission Control", amount: 25.00, pct: 41.67 }
    ],
    daily_breakdown: [
      { date: "2026-05-03", amount: 25.00 },
      { date: "2026-05-04", amount: 15.00 },
      { date: "2026-05-05", amount: 20.00 }
    ],
    recent_expenses: [/* last 10 entries */]
  });
}
```

### Page: `/app/costs/page.tsx`

```tsx
"use client";

import { AppShell } from "@/components/AppShell";
import { SpendSummary } from "@/components/Costs/SpendSummary";
import { DailyBreakdown } from "@/components/Costs/DailyBreakdown";
import { BudgetProgress } from "@/components/Costs/BudgetProgress";
import { ErrorPanel } from "@/components/ErrorPanel";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getCosts } from "@/lib/api";

export default function CostsPage() {
  const { data, error, refresh } = useAutoRefresh(getCosts, 30000);

  if (error) {
    return (
      <AppShell active="costs" title="Costs" description="..." onRefresh={refresh}>
        <ErrorPanel error={error} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell active="costs" title="Costs" description="..." onRefresh={refresh}>
        <div className="text-slate-400">Loading costs...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="costs"
      title="Costs Tracker"
      description="AI API spend tracking for 15-day sprint (May 4-18). Target: $375 total, $25/day average."
      onRefresh={refresh}
    >
      <div className="space-y-5">
        <SpendSummary summary={data.summary} />
        <BudgetProgress summary={data.summary} />
        <DailyBreakdown daily={data.daily_breakdown} />
        
        {/* Category Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-sm font-semibold text-slate-50">By Category</h2>
            <ul className="mt-3 space-y-2">
              {data.by_category.map(c => (
                <li key={c.category} className="flex justify-between text-sm">
                  <span className="text-slate-300">{c.category}</span>
                  <span className="text-slate-50">${c.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-sm font-semibold text-slate-50">By Project</h2>
            <ul className="mt-3 space-y-2">
              {data.by_project.map(p => (
                <li key={p.project} className="flex justify-between text-sm">
                  <span className="text-slate-300">{p.project}</span>
                  <span className="text-slate-50">${p.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-sm font-semibold text-slate-50">Recent Expenses</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.recent_expenses.map((exp, i) => (
                  <tr key={i}>
                    <td className="py-2 text-slate-300">{exp.date}</td>
                    <td className="py-2 text-slate-300">{exp.description}</td>
                    <td className="py-2 text-right text-slate-50">${exp.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
```

### Components

**SpendSummary.tsx:**
```tsx
// Hero cards showing:
// - Total Spent ($60.00)
// - Daily Average ($20.00)
// - Days Remaining (12)
// - Budget Used (16%)
// Use 2x2 grid on desktop, stack on mobile
// Green if under budget, yellow if at 90%, red if over
```

**BudgetProgress.tsx:**
```tsx
// Visual progress bar:
// - Total budget: $375
// - Current spend: $60
// - Projected spend: $300
// - Show bar with sections (spent, projected, remaining)
// Color: cyan for spent, slate for projected, transparent for remaining
```

**DailyBreakdown.tsx:**
```tsx
// Simple bar chart or list of daily spend
// Last 7-14 days
// Show date, amount, running total
```

### Types to Add (src/lib/types.ts)

```typescript
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

export interface CostsResponse {
  summary: CostSummary;
  by_category: CostCategory[];
  by_project: CostProject[];
  daily_breakdown: Array<{ date: string; amount: number }>;
  recent_expenses: CostEntry[];
}
```

---

## 🧠 Screen 2: Memory Screen

### Purpose
View and manage OpenClaw's memory system (MEMORY.md, memory/*.md files, graph links).

### Data Sources
- **Primary:** `/Users/sky/.openclaw/workspace/MEMORY.md`
- **Secondary:** `/Users/sky/.openclaw/workspace/memory/*.md`
- **Graph:** `/Users/sky/.openclaw/workspace/memory/graph-links.json` (if exists)

### API Route: `/api/memory/route.ts`

```typescript
// GET endpoint
export async function GET() {
  // 1. Read MEMORY.md (full content)
  // 2. List all files in memory/ directory
  // 3. Read graph-links.json if exists
  // 4. Get file stats (last modified, size)
  // 5. Extract key sections from MEMORY.md:
  //    - Active Projects
  //    - Core Principles
  //    - Recent Decisions
  //    - Quick Reference
  // 6. Return structured data

  return NextResponse.json({
    memory_md: {
      path: "MEMORY.md",
      content: "...",
      last_updated: "2026-05-06T04:00:00Z",
      size_kb: 12.5,
      sections: ["Active Projects", "Core Principles", "Recent Decisions", ...]
    },
    memory_files: [
      {
        name: "sky-skills-portfolio.md",
        path: "memory/sky-skills-portfolio.md",
        last_updated: "2026-05-07T00:10:00Z",
        size_kb: 13.0
      }
    ],
    graph_links: [
      { from: "Mission Control", to: "Paper Trading", type: "integrates" },
      { from: "PropSprint", to: "Next.js", type: "uses" }
    ],
    stats: {
      total_files: 5,
      total_size_kb: 150.0,
      last_consolidated: "2026-05-06T23:00:00Z"
    }
  });
}
```

### Page: `/app/memory/page.tsx`

```tsx
"use client";

import { AppShell } from "@/components/AppShell";
import { MemoryViewer } from "@/components/Memory/MemoryViewer";
import { GraphLinks } from "@/components/Memory/GraphLinks";
import { RecentUpdates } from "@/components/Memory/RecentUpdates";
import { ErrorPanel } from "@/components/ErrorPanel";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getMemory } from "@/lib/api";

export default function MemoryPage() {
  const { data, error, refresh } = useAutoRefresh(getMemory, 30000);

  if (error) {
    return (
      <AppShell active="memory" title="Memory" description="..." onRefresh={refresh}>
        <ErrorPanel error={error} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell active="memory" title="Memory" description="..." onRefresh={refresh}>
        <div className="text-slate-400">Loading memory...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="memory"
      title="Memory System"
      description="OpenClaw's central context hub: MEMORY.md + memory/*.md files."
      onRefresh={refresh}
    >
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Total Files</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{data.stats.total_files}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Total Size</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{data.stats.total_size_kb.toFixed(1)} KB</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Last Consolidated</p>
            <p className="mt-1 text-sm text-slate-300">{new Date(data.stats.last_consolidated).toLocaleString()}</p>
          </div>
        </div>

        {/* MEMORY.md Preview */}
        <MemoryViewer memory={data.memory_md} />

        {/* Memory Files List */}
        <RecentUpdates files={data.memory_files} />

        {/* Graph Links (if available) */}
        {data.graph_links && data.graph_links.length > 0 && (
          <GraphLinks links={data.graph_links} />
        )}
      </div>
    </AppShell>
  );
}
```

### Components

**MemoryViewer.tsx:**
```tsx
// Display MEMORY.md content
// Show key sections in expandable cards
// Use markdown rendering if possible, or plain text
// Truncate long sections with "Show more" button
```

**RecentUpdates.tsx:**
```tsx
// List memory/*.md files
// Show name, last updated, size
// Link to download or view (optional phase 2)
```

**GraphLinks.tsx:**
```tsx
// Visual representation of memory graph
// Simple list of relationships for Phase 1
// Could be interactive graph in Phase 2
```

### Types to Add

```typescript
export interface MemoryFile {
  name: string;
  path: string;
  last_updated: string;
  size_kb: number;
}

export interface MemoryMD {
  path: string;
  content: string;
  last_updated: string;
  size_kb: number;
  sections: string[];
}

export interface GraphLink {
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
  memory_md: MemoryMD;
  memory_files: MemoryFile[];
  graph_links?: GraphLink[];
  stats: MemoryStats;
}
```

---

## 🤖 Screen 3: Agents Screen

### Purpose
Monitor active OpenClaw sessions, sub-agents, token usage, and session history.

### Data Sources
- **Sessions:** `~/.codex/sessions/` (Codex sessions JSONL files)
- **OpenClaw sessions:** Query via `sessions_list` if available, or read logs
- **Token usage:** Parse from session transcripts or API logs
- **Active processes:** System health checks

### API Route: `/api/agents/route.ts`

```typescript
// GET endpoint
export async function GET() {
  // 1. List recent Codex sessions from ~/.codex/sessions/
  // 2. Parse session JSONL files for metadata:
  //    - Session ID
  //    - Start time
  //    - Duration
  //    - Token usage (if available)
  //    - Status (active/completed)
  // 3. Get OpenClaw session info (if accessible)
  // 4. Calculate aggregate stats:
  //    - Total sessions today
  //    - Total tokens used today
  //    - Average session duration
  //    - Active vs completed
  // 5. Return structured data

  return NextResponse.json({
    sessions: [
      {
        id: "019ddb67-85ed-7702-a0a4-6d86d867db82",
        type: "codex",
        started_at: "2026-04-29T17:41:28Z",
        duration_mins: 45,
        tokens_used: 12500,
        status: "completed",
        agent: "DeepSeek V3"
      }
    ],
    stats: {
      total_sessions_today: 3,
      total_tokens_today: 45000,
      avg_session_mins: 35,
      active_sessions: 1,
      completed_sessions: 2
    },
    current_model: "anthropic/claude-sonnet-4.5",
    default_model: "anthropic/claude-sonnet-4.5"
  });
}
```

### Page: `/app/agents/page.tsx`

```tsx
"use client";

import { AppShell } from "@/components/AppShell";
import { SessionsList } from "@/components/Agents/SessionsList";
import { TokenUsage } from "@/components/Agents/TokenUsage";
import { ActiveSubagents } from "@/components/Agents/ActiveSubagents";
import { ErrorPanel } from "@/components/ErrorPanel";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getAgents } from "@/lib/api";

export default function AgentsPage() {
  const { data, error, refresh } = useAutoRefresh(getAgents, 30000);

  if (error) {
    return (
      <AppShell active="agents" title="Agents" description="..." onRefresh={refresh}>
        <ErrorPanel error={error} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell active="agents" title="Agents" description="..." onRefresh={refresh}>
        <div className="text-slate-400">Loading agents...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="agents"
      title="Agents & Sessions"
      description="Active sessions, sub-agents, and token usage across OpenClaw and Codex."
      onRefresh={refresh}
    >
      <div className="space-y-5">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Sessions Today</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{data.stats.total_sessions_today}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Tokens Today</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{(data.stats.total_tokens_today / 1000).toFixed(1)}K</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Avg Duration</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{data.stats.avg_session_mins} min</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Active Now</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-200">{data.stats.active_sessions}</p>
          </div>
        </div>

        {/* Token Usage */}
        <TokenUsage stats={data.stats} currentModel={data.current_model} />

        {/* Active Subagents */}
        {data.stats.active_sessions > 0 && (
          <ActiveSubagents sessions={data.sessions.filter(s => s.status === "active")} />
        )}

        {/* Recent Sessions */}
        <SessionsList sessions={data.sessions} />
      </div>
    </AppShell>
  );
}
```

### Components

**SessionsList.tsx:**
```tsx
// Table of recent sessions
// Columns: ID (truncated), Type, Started, Duration, Tokens, Status
// Color code status: cyan for active, slate for completed
```

**TokenUsage.tsx:**
```tsx
// Card showing token consumption trends
// Today's usage vs yesterday
// Current model info
// Simple bar chart or text summary
```

**ActiveSubagents.tsx:**
```tsx
// List active sessions with real-time indicator
// Show session ID, start time, duration (live updating)
// Action buttons if applicable (view logs, etc.)
```

### Types to Add

```typescript
export interface AgentSession {
  id: string;
  type: "codex" | "openclaw" | "subagent";
  started_at: string;
  duration_mins?: number;
  tokens_used?: number;
  status: "active" | "completed" | "failed";
  agent?: string;
}

export interface AgentStats {
  total_sessions_today: number;
  total_tokens_today: number;
  avg_session_mins: number;
  active_sessions: number;
  completed_sessions: number;
}

export interface AgentsResponse {
  sessions: AgentSession[];
  stats: AgentStats;
  current_model: string;
  default_model: string;
}
```

---

## 🔧 Step 3: Update AppShell Navigation

Update `src/components/AppShell.tsx` to include the new nav items:

```typescript
const navItems: Array<{ key: NavKey; label: string; href: string; utility: string }> = [
  { key: "overview", label: "Overview", href: "/", utility: "Daily command status" },
  { key: "paper", label: "Paper Trading", href: "/paper-trading", utility: "Positions and P&L" },
  { key: "polymarket", label: "Polymarket", href: "/polymarket", utility: "Prediction signals" },
  { key: "ideas", label: "Idea Engine", href: "/ideas", utility: "Approve and track" },
  { key: "roi", label: "ROI", href: "/roi", utility: "Returns by project" },
  { key: "costs", label: "Costs", href: "/costs", utility: "Budget tracking" },
  { key: "memory", label: "Memory", href: "/memory", utility: "Context system" },
  { key: "agents", label: "Agents", href: "/agents", utility: "Sessions & tokens" },
  { key: "health", label: "Health", href: "/health", utility: "Pipeline checks" },
];

type NavKey = "overview" | "paper" | "polymarket" | "ideas" | "roi" | "costs" | "memory" | "agents" | "health";
```

**IMPORTANT:** Adjust grid from `xl:grid-cols-6` to `xl:grid-cols-9` (or keep stacked layout).

---

## 🔧 Step 4: Update API Client

Update `src/lib/api.ts` to add new API functions:

```typescript
export async function getCosts(): Promise<CostsResponse> {
  const res = await fetch("/api/costs");
  if (!res.ok) throw new Error("Failed to fetch costs");
  return res.json();
}

export async function getMemory(): Promise<MemoryResponse> {
  const res = await fetch("/api/memory");
  if (!res.ok) throw new Error("Failed to fetch memory");
  return res.json();
}

export async function getAgents(): Promise<AgentsResponse> {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}
```

---

## ✅ Build Checklist

### Backend (API Routes)
- [ ] `/api/costs/route.ts` - Read costs.jsonl, calculate aggregates, return structured data
- [ ] `/api/memory/route.ts` - Read MEMORY.md + memory/*.md, return content + stats
- [ ] `/api/agents/route.ts` - List Codex sessions, calculate token usage, return active sessions

### Frontend (Pages)
- [ ] `/app/costs/page.tsx` - Costs screen with AppShell wrapper
- [ ] `/app/memory/page.tsx` - Memory screen with AppShell wrapper
- [ ] `/app/agents/page.tsx` - Agents screen with AppShell wrapper

### Components
- [ ] `Costs/SpendSummary.tsx` - Hero cards for costs
- [ ] `Costs/BudgetProgress.tsx` - Progress bar
- [ ] `Costs/DailyBreakdown.tsx` - Daily chart/list
- [ ] `Memory/MemoryViewer.tsx` - MEMORY.md content display
- [ ] `Memory/RecentUpdates.tsx` - Memory files list
- [ ] `Memory/GraphLinks.tsx` - Graph links display
- [ ] `Agents/SessionsList.tsx` - Sessions table
- [ ] `Agents/TokenUsage.tsx` - Token usage card
- [ ] `Agents/ActiveSubagents.tsx` - Active sessions list

### Types
- [ ] Add all new types to `src/lib/types.ts`
- [ ] Export all new types

### Navigation
- [ ] Update `AppShell.tsx` navItems array
- [ ] Update NavKey type
- [ ] Adjust grid layout for 9 items

### API Client
- [ ] Add `getCosts()` to `lib/api.ts`
- [ ] Add `getMemory()` to `lib/api.ts`
- [ ] Add `getAgents()` to `lib/api.ts`

### Testing
- [ ] Test `/costs` page loads without errors
- [ ] Test `/memory` page loads without errors
- [ ] Test `/agents` page loads without errors
- [ ] Test navigation between all pages
- [ ] Test refresh button on each page
- [ ] Test error states (missing data files)
- [ ] Test responsive layout (mobile/tablet/desktop)

---

## 🚨 Critical Requirements

1. **Match existing architecture exactly** - Use same patterns as existing pages
2. **Use AppShell wrapper** - All pages must use AppShell component
3. **Use useAutoRefresh hook** - 30-second polling for all pages
4. **Use ErrorPanel component** - For error states
5. **Match design system** - Colors, typography, spacing must match exactly
6. **TypeScript strict mode** - No `any` types, proper type definitions
7. **Real data from day one** - No mocks, read actual files
8. **Atomic file operations** - Safe reads, no partial writes
9. **Error handling** - Graceful fallbacks for missing data
10. **Responsive design** - Mobile-first, works on all screen sizes

---

## 📝 File Reading Patterns (Reference Existing Code)

Look at existing API routes for patterns:

1. **File reading:** Use `fs.readFileSync()` with try/catch
2. **JSONL parsing:** Read line by line, skip comment lines (starting with `{"`_schema`)
3. **Error responses:** Return 503 if files missing, 500 if parse fails, 200 with data
4. **Timestamps:** ISO 8601 format (`2026-05-06T12:00:00Z`)
5. **Numbers:** Round currency to 2 decimals, percentages to 1 decimal

---

## 🎯 Success Criteria

When complete:
- ✅ All 3 new screens accessible from navigation
- ✅ Each screen shows real data from workspace files
- ✅ Design matches existing screens exactly
- ✅ Refresh works on all pages
- ✅ No console errors
- ✅ Responsive on mobile/tablet/desktop
- ✅ Error states handled gracefully
- ✅ Types are comprehensive and strict

---

**Ready to build?** Start with the Costs screen (most urgent), then Memory, then Agents.

**Questions?** Refer to existing pages (`/paper-trading`, `/polymarket`, `/ideas`, `/roi`, `/health`) for patterns.

**Last Updated:** 2026-05-07  
**Status:** Ready for Codex build  
**Estimated Time:** 2-3 hours for all 3 screens
