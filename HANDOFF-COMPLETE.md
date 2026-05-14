# Mission Control UI Redesign — Handoff Complete ✅

**Date:** 2026-05-07  
**Status:** Ready for Codex  
**Location:** `docs/handoffs/`

---

## What Was Created

### 8 Split Handoff Files

All files are in: `/Users/sky/Documents/Codex/mission-control/docs/handoffs/`

1. **`00-ui-redesign-brief.md`** — Context, tech stack, constraints, phases
2. **`01-visual-foundation.md`** — Design system (colors, typography, components)
3. **`02-overview-redesign.md`** — Overview page (equity curve, asset allocation)
4. **`03-paper-trading-skytokens.md`** — Paper trading (position cards, Skytokens)
5. **`04-polymarket-education.md`** — Polymarket (signal cards, educational context)
6. **`05-idea-engine-details.md`** — Idea Engine (star ratings, detailed explanations)
7. **`06-health-jobs-costs.md`** — Health page (jobs schedule, cost tracking)
8. **`07-nova-data-contracts.md`** — Data fields Nova adds in Phase 2
9. **`README.md`** — Index with build order and testing checklist

---

## Key Corrections Applied (From Your Review)

### 1. Scope Separation ✅
- **Phase 1 (Codex):** Pure UI enhancement, no data changes
- **Phase 2 (Nova):** Data enrichment after UI is live
- Health jobs moved to Phase 2 (requires new read-only API route)

### 2. Data Constraints Fixed ✅
- Clarified: `PaperPosition` lacks targets/stops (live on `PaperTrade`)
- Phase 1: Skip target markers OR merge `/positions` + `/trades`
- Phase 2: Full merger for complete display

### 3. Metrics Naming Corrected ✅
- Changed "24h P&L" → "Total P&L" (no 24h delta yet)
- Fixed cost formula wording:
  - ✅ "Net P&L after AI cost" = `pnl - cost_to_generate`
  - ✅ "AI cost efficiency" = `pnl / cost_to_generate`
  - ❌ Removed incorrect "trade ROI" formula label

### 4. Tech Stack Accuracy ✅
- **Next.js 16.2.5** (not 14) — warns to read docs
- **React 19.2.4**
- **Recharts 3.8.1** (already installed)

---

## Build Order

### Phase 1: UI Enhancement (Codex, 6-9 hours)

**Sprint 1: Core Visuals (3-4h)**
1. Overview page — Equity curve, asset allocation, sparklines
2. Test responsive layout
3. Verify data flows correctly

**Sprint 2: Trading Pages (2-3h)**
4. Paper Trading — Position cards, balance breakdown
5. Polymarket — Signal cards, odds movement
6. Test both pages

**Sprint 3: Ideas & Polish (1-2h)**
7. Idea Engine — Star ratings, tier badges, expand/collapse
8. Final responsive testing
9. Sky reviews and approves

### Phase 2: Data Enrichment (Nova, 2-3 hours)

**After Phase 1 approval:**
10. Codex: Add `/api/health/jobs` route
11. Codex: Build Health jobs display
12. Nova: Add cost tracking to trades (`cost_to_generate`, `tokens_used`)
13. Nova: Add thesis/catalyst to Polymarket signals
14. Nova: Add detailed fields to ideas (`how_it_works`, `data_sources`, etc.)
15. Test enriched data display

---

## How to Use These Handoffs

### For Sky (Now):
1. Open Codex with `/Users/sky/Documents/Codex/mission-control`
2. Load `docs/handoffs/README.md` as context
3. Tell Codex: "Start with 02-overview-redesign.md"
4. Review each page as Codex builds it
5. Approve Phase 1 before moving to Phase 2

### For Codex:
1. Read `00-ui-redesign-brief.md` first (constraints)
2. Read `01-visual-foundation.md` (design system)
3. Pick a page handoff (start with `02-overview-redesign.md`)
4. Follow specs exactly
5. Test after each page
6. Move to next page

### For Nova (Phase 2):
1. Wait for Sky's approval of Phase 1 UI
2. Read `07-nova-data-contracts.md`
3. Implement data fields in priority order
4. Test that Mission Control displays enriched data correctly

---

## What Changed from V2

Your Codex review identified 4 corrections:

1. **Scope contradiction** — Fixed: Health jobs explicitly Phase 2, marked as "tiny read-only data contract"
2. **Target markers data issue** — Fixed: Noted `PaperPosition` lacks targets, suggested merge with `/trades` in Phase 2
3. **24h P&L not available** — Fixed: Changed to "Total P&L" until Nova emits real 24h metric
4. **Cost formula wording** — Fixed: Clarified it's not wrong math, just wrong label; corrected terminology

All 8 handoff files incorporate these fixes.

---

## File Locations

**Handoffs:**
```
/Users/sky/Documents/Codex/mission-control/docs/handoffs/
├── README.md                          ← Start here
├── 00-ui-redesign-brief.md            ← Context
├── 01-visual-foundation.md            ← Design system
├── 02-overview-redesign.md            ← Overview page
├── 03-paper-trading-skytokens.md      ← Paper trading
├── 04-polymarket-education.md         ← Polymarket
├── 05-idea-engine-details.md          ← Idea Engine
├── 06-health-jobs-costs.md            ← Health (Phase 2)
└── 07-nova-data-contracts.md          ← Nova (Phase 2)
```

**Previous docs (reference only):**
```
/Users/sky/Documents/Codex/mission-control/
├── CODEX-UI-REDESIGN.md               ← Original (superseded)
└── CODEX-UI-REDESIGN-V2.md            ← V2 (superseded)
```

**Nova workspace:**
```
/Users/sky/.openclaw/workspace/
├── MISSION-CONTROL-CONFIG.md
├── NOVA-MISSION-CONTROL-INTEGRATION.md
├── NOVA-MISSION-CONTROL-TODO.md
├── READY-FOR-CODEX-UI.md
└── jobs-schedule.json                 ← Already created
```

---

## Testing Strategy

### After Each Page (Codex):
- [ ] Data flows from API routes
- [ ] Charts render correctly
- [ ] Empty states handle missing data
- [ ] Responsive layout works
- [ ] No console errors

### After Phase 1 (Sky):
- [ ] All pages visually stunning
- [ ] macOS aesthetic consistent
- [ ] Data still displaying correctly
- [ ] Performance smooth
- [ ] Approve for Phase 2

### After Phase 2 (Nova + Sky):
- [ ] Cost tracking visible per trade
- [ ] Polymarket shows educational context
- [ ] Ideas show detailed explanations
- [ ] Health shows job schedules with costs
- [ ] All data contracts fulfilled

---

## Success Criteria

**Phase 1 Complete:**
- ✨ Mission Control looks beautiful (glass morphism, charts, animations)
- ✅ All existing data flows correctly
- 📱 Responsive on mobile/tablet/desktop
- 🚀 No performance issues
- 👍 Sky approves

**Phase 2 Complete:**
- 💎 Skytokens displayed per operation
- 📚 Educational context (thesis, how it works, learning mechanics)
- 🤖 Nova's jobs visible (schedules, costs, status)
- 📊 Full cost transparency and ROI tracking
- ✅ All handoff specs implemented

---

## Next Steps

1. **Sky:** Open Codex, load `docs/handoffs/README.md`
2. **Codex:** Build Phase 1 (Overview → Paper Trading → Polymarket → Ideas)
3. **Sky:** Review and approve Phase 1
4. **Codex:** Add Health jobs route (Phase 2)
5. **Nova:** Add enriched data fields (Phase 2)
6. **Sky:** Final review and launch

---

## Summary

**Created:** 8 split handoff files + README + this summary  
**Fixed:** All 4 issues from your Codex review  
**Ready:** For immediate execution  
**Estimated time:** 6-9 hours Phase 1, 2-3 hours Phase 2  

**The handoffs are tightened, scoped correctly, and ready to build.** 🚀
