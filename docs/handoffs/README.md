# Mission Control UI Redesign — Handoff Index

**Created:** 2026-05-07  
**Status:** Ready for execution  
**Builder:** Codex (AI coding agent)

---

## Quick Start

1. **Read:** `00-ui-redesign-brief.md` (context + constraints)
2. **Read:** `01-visual-foundation.md` (design system)
3. **Pick a page:** Start with `02-overview-redesign.md`
4. **Build:** Follow specs, test, repeat
5. **Phase 2:** Nova adds data fields per `07-nova-data-contracts.md`

---

## Handoff Files

### Phase 1: UI Enhancement (Build Now)

| File | Page | Purpose |
|------|------|---------|
| `00-ui-redesign-brief.md` | Overview | Context, tech stack, constraints, phases |
| `01-visual-foundation.md` | Design System | Colors, typography, components, patterns |
| `02-overview-redesign.md` | `/` | Equity curve, asset allocation, sparklines |
| `03-paper-trading-skytokens.md` | `/paper-trading` | Position cards, balance breakdown (Phase 1 + 2) |
| `04-polymarket-education.md` | `/polymarket` | Signal cards, odds movement (Phase 1 + 2) |
| `05-idea-engine-details.md` | `/ideas` | Star ratings, tier badges, expand/collapse (Phase 1 + 2) |

### Phase 2: Data Enrichment (After UI Launch)

| File | Scope | Purpose |
|------|-------|---------|
| `06-health-jobs-costs.md` | `/health` | Jobs schedule, cost tracking (requires new API route) |
| `07-nova-data-contracts.md` | Nova | Data fields to add after UI is complete |

---

## Recommended Build Order

### Sprint 1: Core Visuals (3-4 hours)
1. ✅ Read brief + foundation docs
2. ✅ Implement `02-overview-redesign.md` (showcase page)
3. ✅ Test responsive layout
4. ✅ Verify data still flows correctly

### Sprint 2: Trading Pages (2-3 hours)
5. ✅ Implement `03-paper-trading-skytokens.md` (Phase 1 only)
6. ✅ Implement `04-polymarket-education.md` (Phase 1 only)
7. ✅ Test both pages

### Sprint 3: Ideas & Polish (1-2 hours)
8. ✅ Implement `05-idea-engine-details.md` (Phase 1 only)
9. ✅ Final responsive testing
10. ✅ Sky reviews and approves

### Sprint 4: Data Enrichment (Nova, 2-3 hours)
11. ⏳ Implement `06-health-jobs-costs.md` (Codex + Nova)
12. ⏳ Nova adds Phase 2 data fields per `07-nova-data-contracts.md`
13. ⏳ Test enriched data display

---

## Key Corrections (from Sky's Review)

### 1. Scope Clarity
- **Phase 1:** Pure UI enhancement (no new data fields)
- **Phase 2:** Data enrichment (after UI is stable)
- Health jobs section moved to Phase 2 (requires new read-only API route)

### 2. Data Constraints
- `PaperPosition` does NOT include targets/stops (those live on `PaperTrade`)
- Phase 1: Skip target markers OR fetch both `/positions` and `/trades`
- Phase 2: Merge trades with positions for full display

### 3. Metrics Naming
- Use "Total P&L" not "24h P&L" (we don't have 24h delta yet)
- Cost metrics:
  - ✅ "Net P&L after AI cost" = `pnl - cost_to_generate`
  - ✅ "AI cost efficiency" = `pnl / cost_to_generate`
  - ❌ Do NOT call `(pnl - cost) / cost * 100` "trade ROI" (wrong label)

### 4. Tech Stack Accuracy
- Next.js **16.2.5** (not 14) — breaking changes, read docs first
- React 19.2.4
- Recharts 3.8.1 (already installed)

---

## Testing Checklist

### After Each Page:
- [ ] Data flows from API routes correctly
- [ ] Charts render without errors
- [ ] Empty states handle missing data gracefully
- [ ] Responsive layout works (mobile/tablet/desktop)
- [ ] No console errors or warnings
- [ ] Performance is smooth (no lag)

### Phase 1 Complete:
- [ ] All 5 pages redesigned (Overview, Paper Trading, Polymarket, Ideas, Health)
- [ ] Visual design consistent (glass morphism, colors, typography)
- [ ] All data still displaying correctly
- [ ] Sky approves for Phase 2

### Phase 2 Complete:
- [ ] Cost tracking displays per trade
- [ ] Polymarket shows thesis/catalyst
- [ ] Ideas show detailed fields
- [ ] Health shows job schedule with costs
- [ ] Nova's data contracts fully implemented

---

## Success Criteria

**Phase 1 Success:**
- Mission Control looks stunning (macOS-inspired aesthetic)
- All existing data displays correctly
- Charts and visual indicators work
- Responsive on all devices
- No breaking changes to data flow

**Phase 2 Success:**
- Cost transparency (Skytokens per operation)
- Educational context (thesis, how it works)
- Job visibility (schedules, costs, status)
- Nova's automation fully documented

---

## Files Modified

**New Phase 1 files:**
- `docs/handoffs/*.md` (8 handoff documents)

**Phase 2 planned files:**
- `src/app/api/health/jobs/route.ts` (Phase 2)

**Modified files:**
- `src/components/pages/OverviewPage.tsx`
- `src/components/PaperTrading/PositionsTable.tsx` → `PositionCards.tsx`
- `src/app/paper-trading/page.tsx`
- `src/app/polymarket/page.tsx`
- `src/app/ideas/page.tsx`
- `src/app/health/page.tsx` (Phase 2)

**Optional new components:**
- `src/components/Overview/EquityCurveChart.tsx`
- `src/components/Overview/AssetAllocationChart.tsx`
- `src/components/PaperTrading/BalanceCard.tsx`
- `src/components/Polymarket/SignalCard.tsx`
- `src/components/IdeaEngine/PendingIdeaCard.tsx`
- `src/components/Health/JobCard.tsx`

---

## Support

**Questions about:**
- Design system → `01-visual-foundation.md`
- Specific page → See page's handoff doc
- Data contracts → `07-nova-data-contracts.md`
- Constraints → `00-ui-redesign-brief.md`

**If stuck:**
- Check AGENTS.md for Next.js 16 guidance
- Check README.md for API contracts
- Test with existing data first
- Ask Sky for clarification

---

**Let's build something beautiful.** ✨
