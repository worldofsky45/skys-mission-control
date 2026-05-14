# Mission Control UI Redesign — Codex Handoff

**Created:** 2026-05-07  
**Owner:** Sky  
**Builder:** Codex  
**Design Goal:** macOS-inspired, fun, visual, detailed

---

## Current State

Mission Control v1 works but feels clinical — just numbers and tables. Sky wants it fun, visual, and educational.

**Current tech stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- API routes already working
- Data files populating correctly

**Current pages:**
- `/` — Overview (hero cards with metrics)
- `/paper-trading` — Positions and P&L
- `/polymarket` — Signals
- `/ideas` — Idea Engine queue
- `/roi` — Returns tracker
- `/health` — System status

---

## Design Direction

### Visual Inspiration: macOS
- **Glass morphism** — Translucent panels with backdrop blur
- **Smooth animations** — Framer Motion for transitions
- **SF Pro / Inter font** — Clean, readable
- **Depth with shadows** — Layered cards, subtle elevation
- **Dark mode native** — macOS Big Sur/Ventura aesthetic
- **Iconography** — SF Symbols style (Heroicons or Lucide)

### Color Palette
```css
/* Dark mode (primary) */
--bg-primary: #1c1c1e (macOS dark background)
--bg-secondary: #2c2c2e (card background)
--bg-tertiary: #3a3a3c (hover states)
--accent-blue: #0a84ff (macOS blue)
--accent-green: #30d158 (success/profit)
--accent-red: #ff453a (loss/risk)
--accent-yellow: #ffd60a (warnings)
--text-primary: #ffffff
--text-secondary: #98989d
```

---

## Page-by-Page Requirements

### 1. Overview Page (`/`)

**Current:** Basic hero cards with numbers  
**Requested:** Cool graphics to visualize data

#### Redesign Specs

**Hero Metrics (Top Section)**
- **Total Portfolio Value** — Large animated number with sparkline chart
- **24h P&L** — Color-coded (green/red) with percentage badge
- **Win Rate** — Circular progress indicator (like macOS Activity app)
- **Active Positions** — Animated counter with icon grid preview

**Visual Components:**
- **Equity Curve Chart** — Line chart showing portfolio value over time (Recharts or Chart.js)
- **Asset Allocation Donut** — Pie chart of deployed capital by asset
- **Recent Activity Feed** — Timeline of last 10 trades/signals/ideas with icons
- **Performance Heatmap** — Calendar grid showing daily P&L (green/red tiles)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Portfolio: $10,247  ↑ $247 (2.47%)            │
│  [Sparkline chart last 7 days]                  │
├─────────────────────────────────────────────────┤
│ [Win Rate Circle]  [Active Positions Grid]      │
├─────────────────────────────────────────────────┤
│ [Equity Curve Chart - full width]               │
├─────────────────────────────────────────────────┤
│ [Asset Allocation] │ [Recent Activity Timeline] │
└─────────────────────────────────────────────────┘
```

---

### 2. Paper Trading Page (`/paper-trading`)

**Current:** Basic table, no cost tracking  
**Requested:** Show Skytokens (LLM cost) per trade, better visuals

#### Redesign Specs

**Add Cost Tracking:**
- Each trade should show: `cost_to_generate` field (in $)
- Display as "Skytokens" badge (e.g., "💎 $0.45")
- Add column: **ROI (after costs)** = `(pnl - cost_to_generate) / cost_to_generate * 100`

**Visual Improvements:**
- **Position Cards** instead of table rows
  - Asset icon/logo (crypto logos from CoinGecko or local assets)
  - Entry price → Current price with animated arrow
  - P&L bar (horizontal progress, green/red fill)
  - Stop-loss and targets as markers on price ladder
- **Portfolio Balance Card** (top)
  - Deployed vs Available (stacked bar)
  - Realized vs Unrealized P&L (split display)
- **Closed Trades Section** (expandable)
  - Win/loss tags with reason (target_hit, stopped_out)
  - Total Skytokens spent on closed trades
  - Average cost per trade

**Example Position Card:**
```
┌────────────────────────────────────┐
│ 💎 BTC — Breakout Play         [A] │
│ Entry: $81,636 → Now: $82,450  ↗️  │
│ P&L: +$19.98 (+2.0%) 💎 $0.45      │
│ ▓▓▓▓▓▓░░░░ 60% to T1               │
│ Stop: $79K │ T1: $84K │ T2: $87K   │
└────────────────────────────────────┘
```

**Data Changes Needed:**
- Add `cost_to_generate` field to each trade in `trades.jsonl`
- Nova should log LLM costs when creating trades

---

### 3. Polymarket Page (`/polymarket`)

**Current:** Just signals table  
**Requested:** More details, educational (Sky is learning from it)

#### Redesign Specs

**Signal Detail Cards:**
- **Market Title** (prominent)
- **Prediction:** YES/NO with confidence badge (e.g., "75% confident")
- **Entry Odds** vs **Current Odds** (movement indicator)
- **Why This Signal?** — Brief thesis (1-2 sentences)
- **Catalyst/Timing** — What event resolves this? When?
- **Category Badge** (Politics, Crypto, Sports, etc.)
- **Arbitrage Indicator** — If odds differ from other platforms, show spread

**Active Bets Section:**
- Timeline view of pending resolutions
- Days until resolution countdown
- Current P&L preview (if odds moved)

**Resolved Markets Section:**
- Win/Loss badges
- Before/After odds comparison
- Lessons learned (optional notes field)

**Educational Explainers:**
- Tooltip on hover: "Why 65% odds is a good bet at 0.60 entry"
- Brier score explainer: "How we measure prediction accuracy"
- Arbitrage explainer: "When odds differ across platforms"

**Example Signal Card:**
```
┌─────────────────────────────────────────────┐
│ 🗳️ Biden Wins 2024 Election          [Politics] │
│ Prediction: YES (75% confident)               │
│ Entry: 0.65 → Now: 0.68 ↗️ (+4.6%)            │
│                                               │
│ 💡 Why: Polling averages stabilizing,        │
│    incumbency advantage, economy improving   │
│                                               │
│ 📅 Resolves: Nov 5, 2024 (182 days)          │
│ 💰 Position: $100 @ 0.65                     │
│ 📊 Potential: +$53 if correct (+53% ROI)     │
└─────────────────────────────────────────────┘
```

**Data Changes Needed:**
- Add `thesis` field to signals (brief explanation)
- Add `catalyst` and `resolution_date` fields
- Add `category` field (politics, crypto, sports, etc.)

---

### 4. Idea Engine Page (`/ideas`)

**Current:** Basic list, minimal details  
**Requested:** More fun UI, detailed explanations per idea

#### Redesign Specs

**Idea Cards (Pending Queue):**
- **Star Rating** — Visual stars (⭐⭐⭐⭐⭐)
- **Tier Badge** — Color-coded (Tier 1: Green, Tier 2: Yellow, Tier 3: Orange)
- **One-liner** (prominent headline)
- **Expandable Details** — Click to reveal full breakdown:
  - **How It Works** (brief explanation)
  - **Feedback Loop** (how we measure success)
  - **Data Sources** (what APIs/feeds)
  - **Self-Improvement Mechanics** (how it learns)
  - **ROI Potential** (best/base/worst case)
  - **Complexity** (time estimate)
  - **Capital Required** (starting budget)
  - **First Milestone** (MVP goal)
- **Approve/Reject Buttons** (inline, with optional note input)

**Approved Ideas Section:**
- **Progress Timeline** (Week 1/15, next milestone date)
- **Current Metrics** (if active, show performance)
- **Quick Actions** (View Dashboard, Pause, Archive)

**Idea Generation Stats:**
- Total ideas generated
- Approval rate
- Average time from idea → approval → launch
- Success rate of approved ideas

**Example Idea Card (Collapsed):**
```
┌────────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ [Tier 1]                          │
│ Newsletter Subscriber Predictor             │
│ Predict which LinkedIn posts drive signups  │
│                                             │
│ ROI: $5K MRR │ Complexity: Easy (1-2 weeks) │
│ [Approve] [Reject] [See Details ▼]         │
└────────────────────────────────────────────┘
```

**Example Idea Card (Expanded):**
```
┌────────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ [Tier 1]                          │
│ Newsletter Subscriber Predictor             │
│                                             │
│ 💡 How It Works:                           │
│ Analyze LinkedIn post content, timing,     │
│ engagement patterns. Predict which posts   │
│ drive newsletter signups within 48 hours.  │
│                                             │
│ 🔄 Feedback Loop: 48 hours                 │
│ Track post → signup conversions            │
│                                             │
│ 📊 Data Sources:                           │
│ - LinkedIn API (posts, engagement)         │
│ - ConvertKit API (new subscribers)         │
│                                             │
│ 🎯 ROI Potential: $5K MRR                  │
│ Capital: $0 │ Success Rate: 30%+           │
│                                             │
│ 🏁 First Milestone:                        │
│ Track 20 posts, predict 5, validate model  │
│                                             │
│ [Approve with Note] [Reject]               │
└────────────────────────────────────────────┘
```

**Data Changes Needed:**
- Add `how_it_works` field (brief explanation)
- Add `data_sources` array
- Add `self_improvement` field (learning mechanics)
- Add `first_milestone` field (MVP description)

---

### 5. Health Page (`/health`)

**Current:** Basic status indicators  
**Requested:** List all Nova's jobs and cost per run

#### Redesign Specs

**System Health Dashboard:**
- **Overall Status** — Big indicator (All Systems Go / Issues Detected)
- **File Freshness** — Table of data files with "last updated" timestamps
- **API Status** — CoinGecko, Polymarket, etc. (green/yellow/red)
- **Disk Usage** — Progress bar (used/total)

**Nova's Job Schedule:**
Table or timeline showing:
- **Job Name** (e.g., "Crypto Intel Daily Brief")
- **Schedule** (e.g., "Daily 7:00 AM CT")
- **Last Run** (timestamp)
- **Next Run** (countdown)
- **Status** (Success / Failed / Running)
- **Cost per Run** (Skytokens in $)
- **Monthly Cost Estimate** (cost_per_run × runs_per_month)

**Recent Job Logs:**
- Last 10 job executions
- Duration, tokens used, status
- Click to view logs (if available)

**Cost Summary Card:**
- Total Skytokens spent today/week/month
- Top 3 most expensive jobs
- Cost per insight ($ per trade signal, prediction, idea)

**Example Job Entry:**
```
┌─────────────────────────────────────────────────┐
│ 📊 Crypto Intel Daily Brief                     │
│ Schedule: Daily 7:00 AM CT                       │
│ Last Run: Today 7:04 AM (Success) ⏱️ 2m 34s     │
│ Next Run: Tomorrow 7:00 AM (in 9h 56m)          │
│ Cost: 💎 $0.45/run (~$13.50/month)               │
│ Output: 3 signals, 5 positions                   │
└─────────────────────────────────────────────────┘
```

**Data Changes Needed:**
- Create `jobs-schedule.json` with all Nova's tasks
- Log execution to `job-runs.jsonl` (timestamp, job, status, cost, duration, output)
- Add API endpoint: `GET /api/health/jobs`

---

## Technical Implementation Notes

### UI Component Library
Suggest using **shadcn/ui** for macOS-inspired components:
- Cards with glass morphism
- Animated progress bars
- Tooltips
- Badges
- Buttons with hover states

### Animation Library
Use **Framer Motion** for:
- Page transitions
- Number count-ups
- Card entrance animations
- Hover interactions

### Charts Library
Use **Recharts** for:
- Equity curve (line chart)
- Asset allocation (pie/donut)
- Performance heatmap (custom grid)
- Sparklines

### Icons
Use **Lucide Icons** (macOS SF Symbols aesthetic):
- `TrendingUp` / `TrendingDown` for P&L
- `Target` for trade targets
- `AlertCircle` for warnings
- `CheckCircle` for success
- `Clock` for timing
- `DollarSign` for costs

---

## Data Schema Updates for Nova

### trades.jsonl (add fields):
```jsonl
{
  "cost_to_generate": 0.45,
  "tokens_used": {"input": 50000, "output": 20000}
}
```

### polymarket-signals.jsonl (add fields):
```jsonl
{
  "thesis": "Brief explanation of why this is a good bet",
  "catalyst": "Event that resolves this market",
  "resolution_date": "2024-11-05",
  "category": "politics"
}
```

### ideas-state.json (add fields per idea):
```json
{
  "how_it_works": "Brief explanation",
  "data_sources": ["API 1", "API 2"],
  "self_improvement": "How it learns",
  "first_milestone": "MVP description"
}
```

### New file: jobs-schedule.json
```json
{
  "jobs": [
    {
      "id": "crypto-intel-brief",
      "name": "Crypto Intel Daily Brief",
      "schedule": "Daily 7:00 AM CT",
      "cost_per_run": 0.45,
      "runs_per_month": 30,
      "monthly_cost": 13.50,
      "output_description": "Market analysis + trade signals"
    }
  ]
}
```

### New file: job-runs.jsonl
```jsonl
{"timestamp":"2026-05-07T07:04:00-05:00","job_id":"crypto-intel-brief","status":"success","duration_seconds":154,"cost":0.45,"tokens":{"input":50000,"output":20000},"output_summary":"3 signals generated"}
```

---

## Prompt for Codex

**Start with this:**

```
I'm redesigning Mission Control's UI to be more visual, fun, and macOS-inspired.

Current state: Basic Next.js app with working API routes. Data is populating correctly.

Design goals:
- macOS Big Sur/Ventura aesthetic (glass morphism, dark mode, smooth animations)
- More visual: charts, progress bars, cards instead of tables
- Educational: explain why signals are good, show learning process
- Cost transparency: show LLM costs per operation

Pages to redesign (priority order):
1. Overview — Add equity curve chart, asset allocation donut, activity timeline
2. Paper Trading — Position cards with price ladders, show Skytokens cost per trade
3. Polymarket — Signal cards with thesis, catalyst, educational tooltips
4. Idea Engine — Expandable idea cards with full details
5. Health — Job schedule table with cost per run

Tech stack to add:
- shadcn/ui for components
- Framer Motion for animations
- Recharts for charts
- Lucide Icons

Refer to CODEX-UI-REDESIGN.md for detailed specs, mockups, and data schema changes.

Start with the Overview page. Let's make it stunning.
```

---

## File Location

This file: `/Users/sky/Documents/Codex/mission-control/CODEX-UI-REDESIGN.md`

---

## Next Steps

1. Sky opens this file in Codex
2. Codex starts with Overview page redesign
3. Nova updates data schemas to include new fields (cost_to_generate, thesis, etc.)
4. Iterate page by page
5. Sky reviews and provides feedback

---

**Let's make Mission Control beautiful.** ✨
