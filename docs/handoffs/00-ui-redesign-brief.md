# Mission Control UI Redesign — Brief

**Created:** 2026-05-07  
**Audience:** Codex (AI coding agent)  
**Goal:** Transform Mission Control from clinical tables to visual, macOS-inspired dashboard

---

## Context

Mission Control is a working Next.js app that displays Nova's workspace data:
- Paper trading positions and P&L
- Polymarket prediction signals
- Idea Engine queue
- ROI tracking
- System health

**Current state:** All API routes work, data flows correctly, but UI is just numbers and tables.

**Goal:** Add visual polish (charts, cards, animations, macOS aesthetic) without breaking data flow.

---

## Tech Stack

- **Next.js:** 16.2.5 (⚠️ breaking changes from earlier versions — read docs)
- **React:** 19.2.4
- **Tailwind CSS:** 4.x
- **Charts:** Recharts 3.8.1 (already installed)
- **State:** Client-side with `useAutoRefresh` hook (30s polling)

---

## Design Direction

**macOS Big Sur/Ventura aesthetic:**
- Glass morphism (translucent cards with backdrop blur)
- Dark mode native
- Smooth animations (subtle, not distracting)
- Clean typography (Inter/system fonts)
- Visual hierarchy with depth/shadows

**Color Palette:**
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

---

## Constraints

### Must Not Change
- ❌ API response schemas (frozen)
- ❌ Data file formats (frozen)
- ❌ Existing API routes (read-only use)
- ❌ Authentication (local-only v1)
- ❌ External image fetching (use local assets only)

### Must Maintain
- ✅ All data via API routes (browser → API → workspace)
- ✅ 30-second polling pattern
- ✅ AppShell wrapper structure
- ✅ Error boundaries and loading states
- ✅ Responsive layout (mobile/tablet/desktop)

---

## Implementation Phases

### Phase 1: Pure UI Enhancement (This Handoff)
**Goal:** Make it beautiful without changing data contracts

**Pages to redesign:**
1. Overview — Add charts, visual metrics
2. Paper Trading — Card layout with visual indicators
3. Polymarket — Signal cards
4. Idea Engine — Visual idea cards
5. Health — Visual status (skip jobs for now)

**Out of scope for Phase 1:**
- New API routes
- Cost tracking fields (Nova adds later)
- Educational content fields (Nova adds later)

### Phase 2: Data Enhancements (Nova's Task)
**After UI is live:**
- Add cost_to_generate fields
- Add thesis/catalyst fields for Polymarket
- Add detailed explanations for ideas
- Add job execution logging

---

## File Structure

Handoffs are split by concern:

```
docs/handoffs/
├── 00-ui-redesign-brief.md          ← This file (overview)
├── 01-visual-foundation.md          ← Design system, components
├── 02-overview-redesign.md          ← Overview page specs
├── 03-paper-trading-skytokens.md    ← Paper trading page (Phase 1 + Phase 2)
├── 04-polymarket-education.md       ← Polymarket page (Phase 1 + Phase 2)
├── 05-idea-engine-details.md        ← Idea Engine page (Phase 1 + Phase 2)
├── 06-health-jobs-costs.md          ← Health page (Phase 2: jobs/costs)
└── 07-nova-data-contracts.md        ← Data changes for Nova (Phase 2)
```

**Read order:**
1. This brief (context)
2. `01-visual-foundation.md` (design system)
3. Pick a page handoff (start with `02-overview-redesign.md`)

---

## Success Criteria

After Phase 1 completion:
- ✅ Overview shows equity curve chart and asset allocation
- ✅ Paper Trading uses card layout with visual P&L indicators
- ✅ Polymarket shows signal cards with odds movement
- ✅ Idea Engine shows visual star ratings and tier badges
- ✅ Health shows status indicators
- ✅ All data still flows correctly from API routes
- ✅ No console errors, no performance issues
- ✅ Responsive on mobile/tablet/desktop

---

## Next Steps

1. Read `01-visual-foundation.md` for design system
2. Start with `02-overview-redesign.md`
3. Implement page by page
4. Test each page after completion
5. Sky reviews and approves

---

**Let's make Mission Control beautiful.** ✨
