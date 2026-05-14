# CRITICAL: Mission Control Dashboard Fix

**Priority:** 🚨 URGENT  
**Status:** Dashboard is broken, showing no data  
**Date:** 2026-05-07 17:30 CDT

---

## Problem Summary

Mission Control dashboard is running at `localhost:3000` but:
1. ❌ All API routes failing (showing skeleton states)
2. ❌ Paper trading data not loading despite files existing
3. ❌ Health checks marking everything "stale" (< 1 hour check too strict)
4. ❌ No actual data visible in UI

**Expected:** Live dashboard showing paper trades, P&L, positions  
**Reality:** Skeleton loading states, API errors, no data

---

## Critical Files Status

### Data Files (✅ EXIST, have data)
```bash
~/.openclaw/workspace/crypto-intel/paper-trading/trades.jsonl
~/.openclaw/workspace/crypto-intel/paper-trading/balance.json
~/.openclaw/workspace/crypto-intel/paper-trading/positions.json
```

**Example trade data:**
```json
{"id":"1714857600001","date":"2026-05-04","signal":"BTC Breakout Play","asset":"BTC","entry_price":78761,"position_size":0.0254,"status":"active",...}
```

### API Routes (❌ FAILING)
- `/api/paper-trading/balance` → `{"error": "Failed to load paper balance"}`
- `/api/paper-trading/trades` → failing
- `/api/paper-trading/positions` → failing

### Health Check (⚠️ TOO STRICT)
Shows 5 warnings because files are "older than 1 hour" - this is too aggressive. Files updated every 6-12 hours is normal.

---

## Root Causes

### Issue #1: API Route Errors
The `getPaperBalance()` function in `src/lib/paper-trading.ts` is failing to read data properly.

**Error symptoms:**
- Returns generic "Failed to load paper balance" error
- No specific error details in logs
- TypeScript/module imports may be broken

**Files to check:**
```
src/lib/paper-trading.ts
src/lib/constants.ts
src/lib/file-store.ts
src/app/api/paper-trading/balance/route.ts
```

### Issue #2: Health Check Too Strict
File: `src/lib/health.ts`

Current logic marks files "warning" if `last_modified < 1 hour ago`.

**Problem:** Crypto-intel runs at 7 AM daily, paper trading updates 4x/day. Files being 2-6 hours old is NORMAL.

**Fix needed:**
```typescript
// Change from:
const ONE_HOUR = 60 * 60 * 1000;
if (Date.now() - fileStats.mtimeMs > ONE_HOUR) {
  return "warning";
}

// To:
const ONE_DAY = 24 * 60 * 60 * 1000;
if (Date.now() - fileStats.mtimeMs > ONE_DAY) {
  return "warning";
}
```

### Issue #3: Environment Variables
Verify `.env.local` has correct paths:

```bash
WORKSPACE_PATH=/Users/sky/.openclaw/workspace
PAPER_TRADING_PATH=/Users/sky/.openclaw/workspace/crypto-intel/paper-trading
```

---

## Debugging Steps

### Step 1: Test Data Files Directly
```bash
# Verify files exist and have data
cat ~/.openclaw/workspace/crypto-intel/paper-trading/balance.json
head -5 ~/.openclaw/workspace/crypto-intel/paper-trading/trades.jsonl

# Check file permissions
ls -la ~/.openclaw/workspace/crypto-intel/paper-trading/
```

### Step 2: Test API Routes
```bash
# Start dev server
cd ~/Documents/Codex/mission-control
npm run dev

# In another terminal:
curl http://localhost:3000/api/health | jq '.'
curl http://localhost:3000/api/paper-trading/balance | jq '.'
curl http://localhost:3000/api/paper-trading/trades | jq '.'
```

### Step 3: Check TypeScript Compilation
```bash
cd ~/Documents/Codex/mission-control
npm run typecheck
# Should show no errors
```

### Step 4: Check Server Logs
Look for actual error messages in terminal running `npm run dev`.

---

## Required Fixes

### 🔴 Priority 1: Fix API Routes

**File:** `src/lib/paper-trading.ts`

**Problem:** `getPaperBalance()` failing to read/parse files

**What to check:**
1. Are file paths resolving correctly? (`paths.paperTrading` from constants)
2. Is JSON parsing working? (balance.json is valid JSON)
3. Are errors being caught and logged properly?
4. Is the function returning proper structure?

**Expected return:**
```typescript
{
  balance: {
    current_balance: number,
    starting_balance: number,
    total_pnl: number,
    total_pnl_pct: number,
    realized_pnl: number,
    unrealized_pnl: number,
    peak_balance: number,
    max_drawdown: number,
    equity_curve: [],
    last_updated: string
  },
  is_stale: boolean,
  price_source: "live" | "cache" | "none"
}
```

### 🟡 Priority 2: Fix Health Checks

**File:** `src/lib/health.ts`

**Change:**
```typescript
// Line ~20-30 (check freshness logic)
const ONE_DAY = 24 * 60 * 60 * 1000; // was ONE_HOUR
```

**Reason:** Files updated 1x-4x daily is normal. Only warn if >24 hours stale.

### 🟢 Priority 3: Add Better Error Logging

**File:** `src/app/api/paper-trading/balance/route.ts`

```typescript
export async function GET() {
  try {
    return Response.json(await getPaperBalance());
  } catch (error) {
    // Add detailed logging
    console.error("Failed to load paper balance:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      paths: process.env.PAPER_TRADING_PATH
    });
    
    if (error instanceof PaperTradingNotInitializedError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    
    return Response.json({ 
      error: "Failed to load paper balance",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
```

---

## Testing Checklist

After fixes:

- [ ] `curl http://localhost:3000/api/health` returns "healthy" status
- [ ] `curl http://localhost:3000/api/paper-trading/balance` returns balance data (not error)
- [ ] `curl http://localhost:3000/api/paper-trading/trades` returns trades array
- [ ] `curl http://localhost:3000/api/paper-trading/positions` returns positions array
- [ ] Dashboard UI at `http://localhost:3000/` shows real data (not skeletons)
- [ ] Paper Trading page shows 4-5 active trades
- [ ] Hero cards show: $8,800 balance, -$863 P&L, 4 active positions
- [ ] Health section shows "healthy" or max 2 warnings (not 5)

---

## Expected Data to Display

Based on actual trades.jsonl:

**Active Positions:**
1. BTC #1 (May 4) - $79,793 / entry $78,761 (+$26)
2. BTC #2 (May 5) - $79,793 / entry $81,636 (-$45)
3. TON (75% remaining) - $2.45 / entry $1.98 (+$248)
4. PENGU - needs investigation (data error)

**Closed Trades:**
1. ZEC - closed +37.92% (+$569) on May 7

**Portfolio Stats:**
- Starting: $10,000
- Current: ~$8,800-9,000 (depends on PENGU resolution)
- P&L: -$863 to -$1,000
- Active: 4 positions
- Closed: 1 trade

---

## Success Criteria

Dashboard is fixed when:
1. ✅ All API routes return data (no errors)
2. ✅ Dashboard shows 4 active positions
3. ✅ P&L numbers match paper trading summary
4. ✅ Health checks show max 2 warnings (not 5)
5. ✅ Refresh button updates data successfully
6. ✅ No skeleton loading states (real data loads)

---

## Additional Context

**Sky's feedback (2026-05-07 17:09):**
> "Why is the dashboard not showing any data? It shows 5 health warnings with the jobs? This was supposed to be stable, automated and live?"

**Root cause:** Dashboard structure built by Codex on May 6, but integration with actual workspace data is broken. Marked "complete" prematurely without end-to-end verification.

**Time to fix:** 1-2 hours
**Priority:** URGENT - blocks all other Mission Control work

---

## Related Files

**After fixing broken dashboard, also need to:**
1. Build missing screens (Costs, Memory, Agents) - see `CODEX_HANDOFF_NEW_SCREENS.md`
2. Integrate Mission Control with crypto-intel/polymarket cron jobs (POST to /api/activity)
3. Test automated updates (30-second polling)

**But fix the core dashboard FIRST** - no point building new screens if base dashboard doesn't work.

---

**Created:** 2026-05-07 17:30 CDT  
**Status:** URGENT FIX NEEDED  
**Owner:** Codex (next session)  
**Est. time:** 1-2 hours
