# Mission Control UI Redesign — Execution-Ready Handoff

**Created:** 2026-05-07  
**Scope:** Pure UI/UX enhancement of existing working app  
**Tech:** Next.js 16.2.5, React 19.2.4, Recharts 3.8.1 (already installed)

---

## ⚠️ Read This First

1. **Next.js 16.2.5 has breaking changes** — Read `node_modules/next/dist/docs/` before coding (per AGENTS.md)
2. **Local-only security** — No external API calls from browser, all data via existing API routes (per README.md line 43)
3. **Data contracts are frozen** — Do NOT change API schemas or file formats
4. **Recharts already installed** — No need to add chart libraries
5. **Use local assets only** — Initials/icons for asset logos, not external fetches

---

## Current State

**Working API routes:**
- `GET /api/health` ✅
- `GET /api/paper-trading/trades` ✅
- `GET /api/paper-trading/positions` ✅
- `GET /api/paper-trading/balance` ✅
- `GET /api/polymarket/signals` ✅
- `GET /api/ideas/list` ✅
- `GET /api/roi` ✅

**Current UI structure:**
- `OverviewPage.tsx` — Fetches all data, renders HeroCards + SystemHealth
- `PositionsTable.tsx` — Basic table with sort buttons
- `HeroCards.tsx` — Simple stat cards
- All pages use `AppShell` wrapper

**What works:** Data flows correctly, polling every 30s, API routes stable

**What needs polish:** Visual design is clinical, just numbers and tables

---

## Design Goal

**macOS-inspired aesthetic** without breaking existing data flow:
- Glass morphism cards (translucent backgrounds with backdrop blur)
- Smooth animations (subtle, not distracting)
- Clean typography (Inter or system fonts)
- Dark mode native (current palette is close)
- Visual data representations (charts, progress bars, indicators)

---

## Scope: UI Enhancement ONLY

### Phase 1: Visual Components (This Handoff)

**DO:**
- Replace tables with visual card layouts
- Add Recharts charts for equity curves, allocation, trends
- Add progress bars, badges, icons for visual hierarchy
- Improve spacing, shadows, hover states
- Add smooth transitions (CSS or Framer Motion)

**DO NOT:**
- Change API response schemas
- Add new API routes
- Modify data files or logging
- Add authentication
- Fetch external logos/images

### Phase 2: Data Enhancements (Nova's Task, After UI)
- Add cost tracking fields
- Add thesis/catalyst fields
- Add job logs
- (Not in scope for Codex)

---

## Page-by-Page Requirements

### 1. Overview Page (`/`)

**Current:** HeroCards with 4 numbers + SystemHealth bar

**Enhance:**

#### Top Section: Animated Metrics
Replace basic HeroCards with visual cards:
- **Portfolio Value** — Large number with 7-day sparkline (Recharts)
- **24h P&L** — Color-coded badge (green/red) with arrow icon
- **Win Rate** — Circular progress indicator or simple percentage with color
- **Active Positions** — Count with mini grid of asset initials

#### Middle Section: Equity Curve
Add full-width line chart showing `balance.equity_curve` over time:
- X-axis: timestamps (format as dates)
- Y-axis: portfolio value
- Smooth curve, gradient fill
- Tooltip on hover

**Data source:** `balanceState.data?.balance.equity_curve`

#### Bottom Section: Asset Allocation
Add donut/pie chart showing deployed capital by asset:
- Calculate from `tradesState.data` (group by asset, sum position_value)
- Show percentages
- Color-code by asset

**Alternative:** Horizontal stacked bar if pie chart is too cluttered

#### Optional: Recent Activity Timeline
If time permits, show last 5-10 trades/signals as a vertical timeline with icons

**Layout sketch:**
```
┌─────────────────────────────────────────────┐
│ [4 metric cards with sparkline/progress]    │
├─────────────────────────────────────────────┤
│ [Equity Curve Chart - full width]           │
├─────────────────────────────────────────────┤
│ [Asset Allocation] │ [Optional: Activity]  │
└─────────────────────────────────────────────┘
```

---

### 2. Paper Trading Page (`/paper-trading`)

**Current:** PositionsTable.tsx with basic table rows

**Enhance:**

#### Balance Card (Top)
Show balance breakdown visually:
- **Deployed vs Available** — Horizontal stacked bar
- **Realized vs Unrealized P&L** — Side-by-side cards with +/- indicators

**Data source:** `PaperBalanceResponse`

#### Position Cards (Replace Table)
Convert table rows to cards, each showing:
- Asset badge (initials in circle, e.g., "BTC" in colored circle)
- Signal name (headline)
- Entry → Current price with arrow icon (↗️ or ↘️)
- P&L amount and percentage with color-coded background
- Progress bar showing distance to target_1 (if applicable)
- Stop-loss and targets as labeled markers

**Example card layout:**
```
┌─────────────────────────────────────────┐
│ [BTC] Breakout Play              [A]    │
│ $81,636 → $82,450 ↗️                    │
│ +$19.98 (+2.0%)  [green background]     │
│ ▓▓▓▓▓▓░░░░ 60% to T1                    │
│ Stop: $79K  T1: $84K  T2: $87K          │
└─────────────────────────────────────────┘
```

**Data source:** `PaperPosition[]` from `/api/paper-trading/positions`

**Note:** Do NOT add cost_to_generate field yet (Phase 2). Just use existing position data.

---

### 3. Polymarket Page (`/polymarket`)

**Current:** Basic signals table

**Enhance:**

#### Signal Cards
Replace table with cards showing:
- Market title (prominent)
- Prediction side (YES/NO) with confidence badge
- Entry odds → Current odds with movement indicator
- Status badge (active/resolved)
- Position size

**Optional enhancements (if time):**
- Category badge (parse from market name or default to "General")
- Days until resolution (if created_at + estimated duration)

**Example card layout:**
```
┌──────────────────────────────────────────┐
│ Biden Wins 2024 Election        [Active] │
│ Prediction: YES (75% confident)          │
│ Entry: 0.65 → Now: 0.68 ↗️ (+4.6%)       │
│ Position: $100                           │
└──────────────────────────────────────────┘
```

**Data source:** `PolymarketSignal[]` from `/api/polymarket/signals`

**Note:** Do NOT add thesis/catalyst fields yet (Phase 2). Use existing signal data only.

---

### 4. Idea Engine Page (`/ideas`)

**Current:** Basic list

**Enhance:**

#### Pending Ideas Section
Show cards with:
- Star rating (visual stars ⭐⭐⭐⭐⭐)
- Tier badge (color-coded: Tier 1 green, Tier 2 yellow, Tier 3 orange)
- Name and one-liner (headline)
- ROI potential and complexity (subtext)
- Approve/Reject buttons (keep existing POST handlers)

**Optional:** Expandable details (click to reveal more fields if they exist in data)

**Example card layout:**
```
┌────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ [Tier 1]                     │
│ Newsletter Subscriber Predictor         │
│ Predict which posts drive signups       │
│                                         │
│ ROI: $5K MRR │ Easy (1-2 weeks)         │
│ [Approve] [Reject]                      │
└────────────────────────────────────────┘
```

#### Approved Ideas Section
Show active projects with:
- Week counter (e.g., "Week 1/15")
- Next milestone date
- Progress indicator if applicable

**Data source:** `IdeasResponse` from `/api/ideas/list`

---

### 5. Health Page (`/health`)

**Current:** SystemHealth component with status bar

**Enhance:**

#### System Status Dashboard
- Overall status indicator (large badge: "All Systems Go" / "Issues Detected")
- File freshness table (keep existing, add visual indicators)
- API status cards (green/yellow/red circles)

#### Job Schedule Section (NEW)
**Data source:** `GET /api/health/jobs` (you need to create this route)

**Route implementation:**
```typescript
// src/app/api/health/jobs/route.ts
import { readJsonFile } from "@/lib/file-store";
import { paths } from "@/lib/constants";
import { join } from "node:path";

export async function GET() {
  try {
    const schedule = await readJsonFile(join(paths.workspace, "jobs-schedule.json"));
    return Response.json(schedule);
  } catch {
    return Response.json({ jobs: [], total_monthly_cost: 0 }, { status: 200 });
  }
}
```

**UI:** Display jobs as cards with:
- Job name
- Schedule (e.g., "Daily 7:00 AM CT")
- Last run timestamp (relative time)
- Next run countdown
- Cost per run (format as currency)

**Example job card:**
```
┌──────────────────────────────────────────┐
│ 📊 Crypto Intel Daily Brief              │
│ Daily 7:00 AM CT                          │
│ Last: Today 7:04 AM ✅                    │
│ Next: Tomorrow 7:00 AM (in 9h 56m)       │
│ Cost: $0.45/run (~$13.50/month)          │
└──────────────────────────────────────────┘
```

**Cost summary card:**
- Total monthly cost (from jobs-schedule.json)
- Top 3 most expensive jobs

---

## Visual Design System

### Colors (Dark Mode)
```css
--bg-primary: #1c1c1e      /* macOS dark background */
--bg-card: #2c2c2e         /* card background */
--bg-hover: #3a3a3c        /* hover states */
--accent-blue: #0a84ff     /* links, primary actions */
--accent-green: #30d158    /* profit, success */
--accent-red: #ff453a      /* loss, errors */
--accent-yellow: #ffd60a   /* warnings, pending */
--text-primary: #ffffff
--text-secondary: #98989d
--border: rgba(255,255,255,0.1)
```

### Typography
- Headings: `font-semibold`
- Body: `font-normal`
- Sizes: `text-xs` (labels), `text-sm` (body), `text-base` (cards), `text-lg` (headings)

### Cards
```css
.card {
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  backdrop-filter: blur(20px);
  padding: 1rem;
}
```

### Animations
Use CSS transitions for hover states:
```css
transition: all 150ms ease-in-out;
```

For numbers/charts, use Recharts built-in animations or simple CSS keyframes.

---

## Implementation Checklist

### Phase 1a: Overview Page
- [ ] Add sparkline to portfolio value card (Recharts)
- [ ] Add circular progress or colored percentage for win rate
- [ ] Add full-width equity curve chart (line chart)
- [ ] Add asset allocation donut/pie chart
- [ ] Improve card styling (glass morphism, shadows)

### Phase 1b: Paper Trading Page
- [ ] Create balance breakdown card (deployed/available bars)
- [ ] Convert PositionsTable to position cards
- [ ] Add asset initials badges (local circles, not images)
- [ ] Add progress bar showing distance to targets
- [ ] Add price arrow indicators (↗️↘️)

### Phase 1c: Polymarket Page
- [ ] Convert signals table to cards
- [ ] Add prediction side badges (YES/NO)
- [ ] Add confidence percentage display
- [ ] Add odds movement indicator (↗️↘️)

### Phase 1d: Idea Engine Page
- [ ] Convert ideas list to cards
- [ ] Add visual star rating (⭐ components)
- [ ] Add tier badges (color-coded)
- [ ] Style Approve/Reject buttons

### Phase 1e: Health Page
- [ ] Add `/api/health/jobs` route
- [ ] Create job schedule cards
- [ ] Add cost summary card
- [ ] Add relative time formatting (e.g., "9h 56m")

---

## Out of Scope (Don't Do)

❌ Add authentication  
❌ Change API schemas  
❌ Modify data files  
❌ Fetch external images/logos  
❌ Add WebSocket/SSE  
❌ Add new POST/PUT routes (except `/api/health/jobs` GET)  
❌ Add Nova cost logging (Phase 2)  
❌ Add thesis/catalyst fields (Phase 2)  
❌ Add how_it_works details (Phase 2)  

---

## Cost Tracking Clarification (For Phase 2)

When cost fields are added later:

**Two metrics to show:**
1. **Net P&L after AI cost:** `pnl - cost_to_generate` (actual profit)
2. **AI cost efficiency:** `pnl / cost_to_generate` (return per $ spent on AI)

Do NOT use `(pnl - cost) / cost * 100` — that's mathematically wrong.

**Example:**
- Trade P&L: $100
- AI cost: $0.45
- Net P&L: $99.55
- AI efficiency: 222x (every $1 of AI cost → $222 profit)

---

## Testing Checklist

After each page:
1. ✅ Verify data still flows from API routes
2. ✅ Check responsive layout (mobile/tablet/desktop)
3. ✅ Confirm no console errors
4. ✅ Test dark mode appearance
5. ✅ Verify performance (no lag with charts)

---

## Starter Prompt for Codex

```
I'm enhancing Mission Control's UI to be more visual and macOS-inspired.

Tech stack: Next.js 16.2.5, React 19.2.4, Recharts 3.8.1 (already installed)

Current state: API routes work, data flows correctly, but UI is clinical (just tables/numbers).

Design goal: Glass morphism cards, charts, progress bars, smooth animations, dark mode.

Constraints:
- Do NOT change API schemas or data files
- Do NOT fetch external images (use local initials/icons)
- Read Next.js 16 docs first (breaking changes from previous versions)
- All data via existing API routes (local-only security)

Start with Overview page:
1. Add sparkline to portfolio card (Recharts)
2. Add equity curve chart (full-width line chart)
3. Add asset allocation donut/pie chart
4. Improve card styling (glass morphism, backdrop blur)

Refer to CODEX-UI-REDESIGN-V2.md for detailed specs.

Let's make the Overview page stunning first, then move to other pages.
```

---

## File Location

`/Users/sky/Documents/Codex/mission-control/CODEX-UI-REDESIGN-V2.md`

---

**Scope: Pure UI enhancement. Data contracts frozen. Focus on visual polish.** ✨
