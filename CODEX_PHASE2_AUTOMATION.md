# Mission Control Phase 2: Automation & Missing Screens

**Priority:** HIGH  
**Date:** 2026-05-07 18:05 CDT  
**Context:** Phase 1 UI redesign complete, now add missing functionality

---

## Scope Overview

Phase 2 adds:
1. **Missing Screens** (Costs, Memory, Agents)
2. **Cron Job Automation** (Paper trading checks, scorecard updates)
3. **Mission Control Integration** (Activity feed from crypto-intel/polymarket)
4. **Health Jobs Endpoint** (Track cron job status)

---

## Part 1: Missing Screens (from CODEX_HANDOFF_NEW_SCREENS.md)

Build 3 new dashboard screens:

### 1. Costs Screen (`/costs`)
**Purpose:** Track AI API spend for 15-day wealth sprint (May 4-18)

**Data source:** `~/.openclaw/workspace/costs.jsonl`

**Key features:**
- Total spend vs. $375 budget (15 days × $25/day)
- Daily average, days remaining, projected total
- Budget progress bar
- Spending by category (AI Services, etc.)
- Spending by project (crypto-intel, Mission Control, etc.)
- Recent expenses table

**API route:** `/api/costs/route.ts`

### 2. Memory Screen (`/memory`)
**Purpose:** View OpenClaw memory system (MEMORY.md + memory/*.md)

**Data sources:**
- `~/.openclaw/workspace/MEMORY.md`
- `~/.openclaw/workspace/memory/*.md`
- `~/.openclaw/workspace/memory/graph-links.json` (if exists)

**Key features:**
- MEMORY.md content display (with sections)
- List of memory/*.md files (name, size, last updated)
- Graph links visualization (simple list for Phase 2)
- Stats: total files, total size, last consolidated

**API route:** `/api/memory/route.ts`

### 3. Agents Screen (`/agents`)
**Purpose:** Monitor active sessions, sub-agents, token usage

**Data sources:**
- `~/.codex/sessions/` (Codex session JSONL files)
- OpenClaw session logs (if accessible)
- Token usage from session transcripts

**Key features:**
- Sessions today count
- Total tokens used today
- Average session duration
- Active sessions count
- Recent sessions table (ID, type, started, duration, tokens, status)
- Token usage trends

**API route:** `/api/agents/route.ts`

**See full specs:** `CODEX_HANDOFF_NEW_SCREENS.md`

---

## Part 2: Cron Job Automation (CRITICAL - Currently Missing)

### Problem
Paper trading position checks are NOT automated:
- ❌ No 6:00 PM evening check
- ❌ No 12:00 PM midday check  
- ❌ No 11:00 PM scorecard update
- ❌ Manual execution required

**Sky's feedback (2026-05-07 18:01):**
> "Is this expected behavior with Paper Trading Evening Check that is no new intel?"

**Answer:** NO - these should be automated via cron.

---

### Required Cron Jobs

#### 1. Paper Trading Midday Check
**Time:** 12:00 PM CT daily  
**Command:**
```bash
cd ~/.openclaw/workspace/crypto-intel/paper-trading && \
node update-positions.js >> update.log 2>&1
```

**What it does:**
- Fetches current prices for active positions
- Updates unrealized P&L
- Checks if targets/stops hit
- Sends Telegram alert if action needed
- Updates balance.json and positions.json

#### 2. Paper Trading Evening Check
**Time:** 6:00 PM CT daily  
**Command:**
```bash
cd ~/.openclaw/workspace/crypto-intel/paper-trading && \
node update-positions.js >> update.log 2>&1
```

**What it does:** Same as midday check

#### 3. Scorecard Update
**Time:** 11:00 PM CT daily  
**Command:**
```bash
cd ~/.openclaw/workspace/crypto-intel && \
node update-scorecard.js >> scorecard-update.log 2>&1
```

**What it does:**
- Updates crypto-intel/scorecard.jsonl with current prices
- Marks predictions as correct/wrong when targets/stops hit
- Calculates win rate, accuracy, P&L by asset
- Alerts if 5+ consecutive predictions wrong

#### 4. ROI Daily Aggregation
**Time:** 11:00 PM CT daily  
**Command:**
```bash
cd ~/.openclaw/workspace && \
~/.openclaw/workspace/lib/aggregate-daily-roi.sh >> roi-tracker/aggregation.log 2>&1
```

**What it does:**
- Reads today's cost-details.jsonl entries
- Sums costs by system (crypto-intel, polymarket-intel, etc.)
- Appends daily summary to roi-tracker/roi-log.jsonl
- Checks alert rules (3+ days negative spend)
- Posts to Mission Control /api/activity

---

### Scripts to Create/Verify

#### A. `crypto-intel/paper-trading/update-positions.js`
**Purpose:** Fetch current prices, update positions, check targets/stops

**Logic:**
1. Read trades.jsonl for active positions
2. Fetch current prices from CoinGecko
3. Calculate unrealized P&L for each position
4. Check if any targets hit (send "Take Profit" alert)
5. Check if any stops hit (send "Stop Loss" alert)
6. Update positions.json with current prices
7. Update balance.json with total current balance

**Example output:**
```
[2026-05-07 18:00] Updating 4 active positions...
BTC #1: $79,793 (+1.31%, +$26) - approaching T1 $82K
BTC #2: $79,793 (-2.26%, -$45) - below entry
TON: $2.45 (+23.64%, +$248) - T1 hit, riding to T2
PENGU: needs investigation (price error)
Updated balance: $10,906.89 (+9.07%)
```

#### B. `crypto-intel/update-scorecard.js`
**Purpose:** Update scorecard with current prices, mark predictions complete

**Logic:**
1. Read scorecard.jsonl for active predictions
2. Fetch current prices
3. Check if target hit → mark "correct"
4. Check if stop hit → mark "wrong"
5. Calculate accuracy by asset, conviction level
6. Append updates to scorecard.jsonl
7. Alert if win rate < 50% for 5+ predictions

#### C. `lib/aggregate-daily-roi.sh`
**Purpose:** Sum today's costs, append to roi-log.jsonl

**Logic:**
1. Read cost-details.jsonl entries from today (grep by date)
2. Sum by system: crypto-intel, polymarket-intel, etc.
3. Calculate daily total
4. Append summary to roi-log.jsonl
5. Check alert rules (3+ days negative)
6. POST to Mission Control /api/activity

---

### Crontab Entry Format

```bash
# Paper Trading Position Checks
0 12 * * * cd ~/.openclaw/workspace/crypto-intel/paper-trading && node update-positions.js >> update.log 2>&1
0 18 * * * cd ~/.openclaw/workspace/crypto-intel/paper-trading && node update-positions.js >> update.log 2>&1

# Scorecard Update (11 PM daily)
0 23 * * * cd ~/.openclaw/workspace/crypto-intel && node update-scorecard.js >> scorecard-update.log 2>&1

# ROI Daily Aggregation (11 PM daily)
0 23 * * * cd ~/.openclaw/workspace && ~/.openclaw/workspace/lib/aggregate-daily-roi.sh >> roi-tracker/aggregation.log 2>&1
```

**Note:** These should be added programmatically, not manually edited by user.

---

## Part 3: Mission Control Activity Feed Integration

### Background
Crypto-intel and polymarket-intel skills were updated on 2026-05-07 to POST signals to Mission Control:

**File:** `~/.openclaw/workspace/skills/crypto-intel/SKILL.md`  
**File:** `~/.openclaw/workspace/skills/polymarket-intel/SKILL.md`

Both now have "Mission Control Integration" section with curl commands to POST to `localhost:3001/api/activity`.

### Required API Endpoint

**File:** `src/app/api/activity/route.ts`

**Purpose:** Receive signal events from crypto-intel/polymarket-intel cron jobs

**Schema:**
```typescript
interface ActivityEvent {
  type: "signal" | "cost" | "trade" | "alert";
  system: "crypto-intel" | "polymarket-intel" | "nova";
  title: string;
  summary: string;
  timestamp: string;
  signals?: Array<{
    asset?: string;
    action?: string;
    conviction?: string;
    target?: number;
    stop?: number;
  }>;
  opportunities?: Array<{
    market: string;
    odds: string;
    conviction: string;
    edge: string;
  }>;
}
```

**Implementation:**
```typescript
// POST endpoint
export async function POST(request: Request) {
  const event = await request.json();
  
  // Append to activity feed log
  const activityLog = path.join(WORKSPACE_PATH, "mission-control/activity-feed.jsonl");
  await appendJsonlFile(activityLog, {
    ...event,
    received_at: new Date().toISOString()
  });
  
  return Response.json({ success: true });
}

// GET endpoint (for dashboard)
export async function GET() {
  const activityLog = path.join(WORKSPACE_PATH, "mission-control/activity-feed.jsonl");
  const events = await readJsonlFile(activityLog);
  
  // Return last 50 events, newest first
  return Response.json({
    events: events.slice(-50).reverse()
  });
}
```

### Activity Feed Component

**File:** `src/components/ActivityFeed.tsx`

**Purpose:** Display recent signal/cost/trade events in Overview

**Features:**
- Last 10-20 events
- Color-coded by type (signal=blue, cost=yellow, trade=green, alert=red)
- Timestamp, system, title, summary
- Expandable details for signals array

**Add to Overview page** in "Mission Snapshot" section or new "Activity Feed" section.

---

## Part 4: Health Jobs Endpoint

### Purpose
Track cron job execution status (last run, success/failure, next run)

**File:** `src/app/api/health/jobs/route.ts`

**Data source:** Parse cron job logs

**Schema:**
```typescript
interface CronJob {
  name: string;
  schedule: string; // "0 7 * * *" format
  last_run: string | null;
  last_status: "success" | "failure" | "running" | "unknown";
  next_run: string;
  log_file: string;
}
```

**Jobs to track:**
- Crypto-intel daily brief (7 AM)
- Polymarket-intel daily brief (8 AM)
- Paper trading midday check (12 PM)
- Paper trading evening check (6 PM)
- Scorecard update (11 PM)
- ROI aggregation (11 PM)

**Implementation:**
```typescript
export async function GET() {
  const jobs = [
    {
      name: "Crypto-Intel Daily Brief",
      schedule: "0 7 * * *",
      last_run: getLastRunFromLog("~/.openclaw/workspace/crypto-intel/brief.log"),
      last_status: getLastStatusFromLog("~/.openclaw/workspace/crypto-intel/brief.log"),
      next_run: calculateNextRun("0 7 * * *"),
      log_file: "~/.openclaw/workspace/crypto-intel/brief.log"
    },
    // ... other jobs
  ];
  
  return Response.json({ jobs });
}
```

**Add to Health page:** New "Cron Jobs" section showing job status table.

---

## Part 5: Update Navigation

**File:** `src/components/AppShell.tsx`

Add new nav items:

```typescript
const navItems = [
  { key: "overview", label: "Overview", href: "/", utility: "Daily command status" },
  { key: "paper", label: "Paper Trading", href: "/paper-trading", utility: "Positions and P&L" },
  { key: "polymarket", label: "Polymarket", href: "/polymarket", utility: "Prediction signals" },
  { key: "ideas", label: "Idea Engine", href: "/ideas", utility: "Approve and track" },
  { key: "roi", label: "ROI", href: "/roi", utility: "Returns by project" },
  { key: "costs", label: "Costs", href: "/costs", utility: "Budget tracking" },      // NEW
  { key: "memory", label: "Memory", href: "/memory", utility: "Context system" },    // NEW
  { key: "agents", label: "Agents", href: "/agents", utility: "Sessions & tokens" }, // NEW
  { key: "health", label: "Health", href: "/health", utility: "Pipeline checks" },
];

type NavKey = "overview" | "paper" | "polymarket" | "ideas" | "roi" | "costs" | "memory" | "agents" | "health";
```

**Adjust grid:** Change from `xl:grid-cols-6` to `xl:grid-cols-9` or stack for smaller screens.

---

## Testing Checklist

### Screens
- [ ] `/costs` loads with real cost data from costs.jsonl
- [ ] `/memory` loads with MEMORY.md content
- [ ] `/agents` loads with Codex session data
- [ ] All 3 new screens show in navigation
- [ ] Refresh button works on all 3 screens
- [ ] Mobile responsive layout works

### Automation
- [ ] Midday check cron job exists and runs at 12 PM
- [ ] Evening check cron job exists and runs at 6 PM
- [ ] Scorecard update cron job exists and runs at 11 PM
- [ ] ROI aggregation cron job exists and runs at 11 PM
- [ ] Logs are being written to expected locations
- [ ] Telegram alerts sent when targets/stops hit

### Integration
- [ ] `/api/activity` accepts POST from crypto-intel
- [ ] `/api/activity` accepts POST from polymarket-intel
- [ ] Activity feed displays in Overview
- [ ] Activity feed updates on page refresh
- [ ] `/api/health/jobs` returns cron job status
- [ ] Health page shows cron jobs section

### End-to-End
- [ ] Run paper trading check manually → positions update in dashboard
- [ ] Run crypto-intel brief → activity event appears in Overview
- [ ] Check `/api/health/jobs` → shows last run times
- [ ] Wait for cron job to run → verify it executes automatically

---

## Implementation Order

**Recommended sequence:**

1. **Build missing screens** (Costs, Memory, Agents)
   - Creates API routes
   - Creates page components
   - Updates navigation
   - **Time:** 2-3 hours

2. **Create automation scripts** (update-positions.js, update-scorecard.js, aggregate-daily-roi.sh)
   - Verifies logic before scheduling
   - Allows manual testing
   - **Time:** 1-2 hours

3. **Add cron jobs** (programmatically install to crontab)
   - Uses `crontab -l` to read existing
   - Appends new jobs
   - Uses `crontab -` to install
   - **Time:** 30 minutes

4. **Build activity feed** (/api/activity + ActivityFeed component)
   - Receives events from cron jobs
   - Displays in Overview
   - **Time:** 1 hour

5. **Build health jobs endpoint** (/api/health/jobs)
   - Parses cron logs
   - Shows job status
   - **Time:** 1 hour

**Total estimated time:** 5.5-7.5 hours

---

## Success Criteria

Phase 2 is complete when:

1. ✅ All 9 nav items present (Overview, Paper Trading, Polymarket, Ideas, ROI, Costs, Memory, Agents, Health)
2. ✅ Costs screen shows $XX spent of $375 budget
3. ✅ Memory screen shows MEMORY.md content + memory/*.md files
4. ✅ Agents screen shows Codex sessions + token usage
5. ✅ Cron jobs installed and running (12 PM, 6 PM, 11 PM checks)
6. ✅ Activity feed in Overview shows recent signals
7. ✅ Health page shows cron job status
8. ✅ Paper trading positions auto-update 2x daily (12 PM, 6 PM)
9. ✅ Scorecard auto-updates nightly (11 PM)
10. ✅ ROI aggregates daily costs (11 PM)

---

## Dependencies

**Node.js scripts need:**
- `node-fetch` or native `fetch` (Node 18+)
- `node-cron` (optional, for in-process scheduling)
- CoinGecko API access (already working)

**Bash scripts need:**
- `jq` for JSON parsing
- `curl` for HTTP requests
- `bc` for calculations (already used in log-session-cost.sh)

**Cron needs:**
- User has crontab access (verify with `crontab -l`)
- Scripts have execute permissions (`chmod +x`)
- Paths are absolute (no `~` in cron, use full `/Users/sky/...`)

---

## Related Files

**Created for Phase 2:**
- This file: `CODEX_PHASE2_AUTOMATION.md`

**Reference from Phase 1:**
- `CODEX_CRITICAL_FIX.md` (dashboard fixes - completed)
- `CODEX_HANDOFF_NEW_SCREENS.md` (screen specs)
- `CODEX_QUICK_START.md` (quick reference)
- `docs/handoffs/OPENCLAW-PHASE1-LOG.md` (Phase 1 completion log)

**Skills updated for Mission Control integration:**
- `~/.openclaw/workspace/skills/crypto-intel/SKILL.md`
- `~/.openclaw/workspace/skills/polymarket-intel/SKILL.md`
- `~/.openclaw/workspace/skills/roi-tracker/SKILL.md`

---

**Created:** 2026-05-07 18:05 CDT  
**Status:** Ready for Codex Phase 2 implementation  
**Priority:** HIGH - completes Mission Control functionality  
**Approved by:** Sky Thakkar
