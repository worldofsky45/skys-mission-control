# Nova Data Contracts — Phase 2 Additions

**Handoff:** 07  
**Audience:** Nova  
**Phase:** 2 (After UI is built and tested)

---

## Overview

This document defines data fields Nova needs to add to workspace files after Phase 1 UI is complete.

**Principle:** Phase 1 built the UI with existing data. Phase 2 enriches the data to populate the new UI features.

---

## 1. Paper Trading Cost Tracking

### File: `crypto-intel/paper-trading/trades.jsonl`

**Add per trade:**
```jsonl
{
  "id": "1234567890123",
  "date": "2026-05-07",
  "signal": "BTC Signal",
  "asset": "BTC",
  "conviction": "A",
  "entry_price": 82000,
  "position_size": 0.024,
  "position_value": 2000,
  "position_pct": 20,
  "stop_loss": 79000,
  "target_1": 85000,
  "target_2": 88000,
  "target_3": null,
  "status": "active",
  "outcome": null,
  "exit_price": null,
  "pnl": null,
  "pnl_pct": null,
  "notes": "Entry note",
  "created_at": "2026-05-07T12:00:00.000Z",
  
  // NEW FIELDS:
  "cost_to_generate": 0.45,
  "tokens_used": {
    "input": 50000,
    "output": 20000
  }
}
```

**Implementation:**
- Track LLM API costs during `crypto-intel` brief generation
- Log token counts from Claude API response
- Append cost fields to each new trade entry

**Calculations:**
- Claude Sonnet 4.5: `(input_tokens × $0.000003) + (output_tokens × $0.000015)`
- Typical brief: ~50K input + 20K output = **$0.45/run**

**Where to log:**
- During trade entry creation in `crypto-intel` skill
- Use existing cost logging helper: `lib/log-cost-to-roi.sh`

---

## 2. Polymarket Educational Context

### File: `polymarket-signals.jsonl`

**Add per signal:**
```jsonl
{
  "timestamp": "2026-05-07T08:00:00-05:00",
  "market": "Biden Wins 2024 Election",
  "prediction": "YES",
  "confidence": 75,
  "entry_odds": "0.65",
  "position_size": 100,
  "status": "active",
  "created_by": "polymarket-intel",
  
  // NEW FIELDS:
  "thesis": "Polling averages stabilizing, incumbency advantage, economy improving",
  "catalyst": "November 5, 2024 election results",
  "resolution_date": "2024-11-05",
  "category": "politics"
}
```

**Field descriptions:**
- `thesis`: 1-2 sentence explanation of why this bet is good (extract from brief rationale)
- `catalyst`: What event resolves this market (from Polymarket market description)
- `resolution_date`: When the market resolves (from Polymarket API)
- `category`: politics, crypto, sports, business, pop-culture, etc. (infer from market tags or manually tag)

**Implementation:**
- `polymarket-intel` skill: Add these fields during signal generation
- Thesis already exists in brief analysis — extract and save
- Fetch resolution date from Polymarket API
- Category: parse from market metadata or use simple keyword matching

---

## 3. Idea Engine Detailed Explanations

### File: `skills/engine-ideation/ideas-state.json`

**Add per idea:**
```json
{
  "id": "newsletter-predictor-001",
  "name": "Newsletter Subscriber Predictor",
  "tier": 1,
  "stars": 5,
  "one_liner": "Predict which LinkedIn posts drive newsletter signups",
  "feedback_loop": "48 hours",
  "roi_potential": "$5K MRR",
  "complexity": "Easy (1-2 weeks)",
  "capital_required": "$0",
  "success_rate_needed": "30%+",
  "generated": "2026-05-05",
  "source_file": "ENGINE-IDEAS-BATCH-001.md#idea-1",
  
  // NEW FIELDS:
  "how_it_works": "Analyze LinkedIn post content, timing, and engagement patterns to predict which posts will drive newsletter signups within 48 hours of posting.",
  "data_sources": [
    "LinkedIn API (posts, engagement)",
    "ConvertKit API (new subscribers)",
    "Post metadata (time, hashtags, length)"
  ],
  "self_improvement": "Track prediction accuracy by post type, time of day, content theme. Monthly recalibration of confidence thresholds based on win rate.",
  "first_milestone": "Track 20 posts over 2 weeks, predict 5 with >50% confidence, validate model accuracy >60%"
}
```

**Field descriptions:**
- `how_it_works`: 2-3 sentence explanation of the engine's core mechanics
- `data_sources`: Array of APIs, feeds, or data sources used
- `self_improvement`: How this engine learns and improves over time
- `first_milestone`: MVP description — what needs to be validated first

**Implementation:**
- `engine-ideation` skill: Extend idea generation framework
- These fields already exist in the ideation templates — extract and structure them
- Parse from generated idea markdown files into JSON

---

## 4. Job Schedule & Execution Logs

### File: `jobs-schedule.json` (workspace root)

**Already created** ✅ at `/Users/sky/.openclaw/workspace/jobs-schedule.json`

**Schema:**
```json
{
  "jobs": [
    {
      "id": "crypto-intel-brief",
      "name": "Crypto Intel Daily Brief",
      "schedule": "Daily 7:00 AM CT",
      "description": "Market analysis + trade signals",
      "cost_per_run": 0.45,
      "runs_per_month": 30,
      "monthly_cost": 13.50,
      "last_run": "2026-05-07T07:04:00-05:00",
      "next_run": "2026-05-08T07:00:00-05:00",
      "status": "success"
    }
  ],
  "total_monthly_cost": 34.80,
  "last_updated": "2026-05-07T07:04:00-05:00"
}
```

**Maintenance:**
- Update `last_run` timestamp after each job execution
- Update `status` (success/failed/running)
- Recalculate `next_run` based on schedule

---

### File: `job-runs.jsonl` (workspace root)

**Already created** ✅ at `/Users/sky/.openclaw/workspace/job-runs.jsonl`

**Append after each job execution:**
```jsonl
{"timestamp":"2026-05-07T07:04:00-05:00","job_id":"crypto-intel-brief","status":"success","duration_seconds":154,"cost":0.45,"tokens":{"input":50000,"output":20000},"output_summary":"3 signals generated, 5 active positions"}
```

**Implementation:**
- Each skill: append to `job-runs.jsonl` after completing work
- Log timestamp, status, duration, cost, tokens, brief output summary

---

## Implementation Priority

### Phase 2a: High Priority (After UI Launch)
1. ✅ Paper trading cost tracking (`cost_to_generate`, `tokens_used`)
2. ✅ Polymarket thesis field (extract from existing brief analysis)
3. ✅ Job schedule updates (maintain `last_run`, `next_run`, `status`)

### Phase 2b: Medium Priority
4. ⏳ Polymarket catalyst/resolution_date (fetch from Polymarket API)
5. ⏳ Job runs logging (`job-runs.jsonl`)
6. ⏳ Idea Engine detailed fields (extract from markdown)

### Phase 2c: Polish
7. ⏳ Polymarket category tagging (keyword matching)
8. ⏳ Historical cost analysis
9. ⏳ Execution failure alerts

---

## Cost Tracking Best Practices

### What to Track
- **Per operation:** Input tokens, output tokens, cost in USD
- **Per job:** Total cost, duration, output summary
- **Per trade/signal/idea:** Cost to generate that specific output

### What to Display
1. **Net P&L after AI cost:** `pnl - cost_to_generate`  
   (Shows actual profit after subtracting AI expenses)

2. **AI cost efficiency:** `pnl / cost_to_generate`  
   (Shows return per dollar spent on AI, e.g., "222x" means $1 of AI → $222 profit)

### What NOT to Do
❌ Do NOT call `(pnl - cost) / cost * 100` "trade ROI"  
✅ This is AI cost efficiency, not trade ROI

**Correct labels:**
- "Net P&L after AI cost" = `pnl - cost`
- "AI cost efficiency" = `pnl / cost`

---

## Testing After Phase 2 Implementation

### Paper Trading
- [ ] New trades include `cost_to_generate` field
- [ ] Mission Control displays AI cost per position
- [ ] Net P&L after AI calculates correctly
- [ ] AI efficiency ratio displays correctly

### Polymarket
- [ ] New signals include `thesis` field
- [ ] Thesis displays in signal cards
- [ ] Catalyst/resolution_date populate when available

### Idea Engine
- [ ] New ideas include detailed fields
- [ ] Expanded view shows how_it_works, data_sources, etc.

### Health
- [ ] `jobs-schedule.json` updates after each run
- [ ] Health page shows accurate last/next run times
- [ ] Cost summary calculates correctly

---

## File Locations Summary

**Data files Nova maintains:**
```
/Users/sky/.openclaw/workspace/

crypto-intel/paper-trading/
  trades.jsonl                    ← Add cost_to_generate

polymarket-signals.jsonl          ← Add thesis, catalyst, etc.

skills/engine-ideation/
  ideas-state.json                ← Add how_it_works, data_sources, etc.

jobs-schedule.json                ← Update after each job run
job-runs.jsonl                    ← Append after each execution
```

**Mission Control reads via:**
- `/api/paper-trading/trades`
- `/api/polymarket/signals`
- `/api/ideas/list`
- `/api/health/jobs`

---

## Next Steps

1. Sky approves Phase 1 UI redesign
2. Nova implements Phase 2a (cost tracking, thesis)
3. Sky tests enriched data in Mission Control
4. Nova implements Phase 2b/2c (polish)

---

**Data enrichment happens AFTER UI is stable and approved.** ✨
