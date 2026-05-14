# Paper Trading Page — Skytokens & Visual P&L

**Handoff:** 03  
**Page:** `/paper-trading` (PaperTradingPage)  
**Phase 1:** Visual card layout (no cost tracking yet)  
**Phase 2:** Add Skytokens cost display (after Nova adds data)

---

## Current State

**Components:**
- `src/app/paper-trading/page.tsx`
- `src/components/PaperTrading/PositionsTable.tsx`

**What works:**
- Fetches balance via `/api/paper-trading/balance`
- Fetches positions via `/api/paper-trading/positions`
- Displays positions in sortable table

**What needs improvement:**
- Table is clinical, not visual
- No deployed vs available balance breakdown
- No target/stop-loss visualization

---

## Data Available

### Balance (`PaperBalanceResponse`)
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
    equity_curve: Array<{ timestamp: string, value: number }>,
    last_updated: string
  },
  is_stale: boolean,
  price_source: "live" | "cache" | "none"
}
```

### Positions (`PaperPositionsResult`)
```typescript
{
  positions: Array<{
    asset: string,
    signal: string,
    entry_price: number,
    current_price: number,
    quantity: number,
    entry_value: number,
    current_value: number,
    unrealized_pnl: number,
    pnl_pct: number,
    side: "long" | "short",
    entry_date: string,
    is_winning: boolean
  }>,
  total_unrealized_pnl: number,
  price_source: "live" | "cache" | "none"
}
```

**Note:** `PaperPosition` does NOT include `stop_loss`, `target_1`, `target_2`. Those live on `PaperTrade` in `/api/paper-trading/trades`.

---

## Phase 1: Visual Enhancement (No Trades Data)

### Top Section: Balance Breakdown Card

Replace simple balance display with visual breakdown:

```tsx
<div className="card">
  <h3 className="mb-4 text-base font-semibold text-slate-50">Portfolio Balance</h3>
  
  {/* Current Balance */}
  <div className="mb-6">
    <p className="text-xs text-slate-400">Current Balance</p>
    <p className="text-3xl font-semibold text-slate-50">
      ${balance.current_balance.toLocaleString()}
    </p>
    <p className={clsx(
      "text-sm",
      balance.total_pnl >= 0 ? "text-green-400" : "text-red-400"
    )}>
      {balance.total_pnl >= 0 ? "+" : ""}${balance.total_pnl.toLocaleString()} ({balance.total_pnl_pct.toFixed(2)}%)
    </p>
  </div>
  
  {/* Deployed vs Available */}
  <div className="mb-4">
    <div className="flex justify-between text-xs text-slate-400 mb-2">
      <span>Deployed</span>
      <span>Available</span>
    </div>
    <div className="h-8 w-full overflow-hidden rounded-lg bg-white/10 flex">
      <div 
        className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
        style={{ width: `${(deployed / balance.current_balance) * 100}%` }}
      >
        ${deployed.toLocaleString()}
      </div>
      <div 
        className="bg-slate-600 flex items-center justify-center text-xs font-medium text-white"
        style={{ width: `${(available / balance.current_balance) * 100}%` }}
      >
        ${available.toLocaleString()}
      </div>
    </div>
  </div>
  
  {/* Realized vs Unrealized */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-xs text-slate-400">Realized P&L</p>
      <p className={clsx(
        "text-lg font-semibold",
        balance.realized_pnl >= 0 ? "text-green-400" : "text-red-400"
      )}>
        {balance.realized_pnl >= 0 ? "+" : ""}${balance.realized_pnl.toLocaleString()}
      </p>
    </div>
    <div>
      <p className="text-xs text-slate-400">Unrealized P&L</p>
      <p className={clsx(
        "text-lg font-semibold",
        balance.unrealized_pnl >= 0 ? "text-green-400" : "text-red-400"
      )}>
        {balance.unrealized_pnl >= 0 ? "+" : ""}${balance.unrealized_pnl.toLocaleString()}
      </p>
    </div>
  </div>
</div>
```

**Calculate deployed/available:**
```typescript
const deployed = positions.reduce((sum, p) => sum + p.entry_value, 0);
const available = balance.current_balance - deployed;
```

---

### Middle Section: Position Cards (Replace Table)

Convert `PositionsTable` to card layout:

```tsx
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
  {sortedPositions.map(position => (
    <div key={position.asset} className="card">
      {/* Header: Asset + Signal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Asset Badge */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-300">
            {position.asset.slice(0, 3)}
          </div>
          <div>
            <p className="font-medium text-slate-50">{position.signal}</p>
            <p className="text-xs text-slate-400">{position.asset}</p>
          </div>
        </div>
        {/* P&L Badge */}
        <div className={clsx(
          "rounded px-2 py-1 text-sm font-semibold",
          position.is_winning ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
        )}>
          {position.unrealized_pnl >= 0 ? "+" : ""}${position.unrealized_pnl.toFixed(2)}
        </div>
      </div>
      
      {/* Price Movement */}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-slate-400">${position.entry_price.toLocaleString()}</span>
        <span className={position.is_winning ? "text-green-400" : "text-red-400"}>
          {position.is_winning ? "↗️" : "↘️"}
        </span>
        <span className="text-slate-50">${position.current_price.toLocaleString()}</span>
        <span className={clsx(
          "text-xs",
          position.is_winning ? "text-green-400" : "text-red-400"
        )}>
          ({position.pnl_pct >= 0 ? "+" : ""}{position.pnl_pct.toFixed(2)}%)
        </span>
      </div>
      
      {/* P&L Progress Bar */}
      <div className="mb-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div 
            className={clsx(
              "h-full rounded-full",
              position.is_winning ? "bg-green-500" : "bg-red-500"
            )}
            style={{ width: `${Math.min(Math.abs(position.pnl_pct), 100)}%` }}
          />
        </div>
      </div>
      
      {/* Metadata */}
      <div className="flex justify-between text-xs text-slate-400">
        <span>Qty: {position.quantity.toFixed(4)}</span>
        <span>Value: ${position.current_value.toLocaleString()}</span>
        <span>{new Date(position.entry_date).toLocaleDateString()}</span>
      </div>
    </div>
  ))}
</div>
```

**Empty state:**
```tsx
{positions.length === 0 && (
  <div className="card text-center py-12">
    <p className="text-slate-400">No active positions.</p>
  </div>
)}
```

---

## Phase 2: Add Target Markers (Requires Trades Data)

**Problem:** `PaperPosition` doesn't include `stop_loss`, `target_1`, `target_2`.

**Solution:** Either:
1. Fetch `/api/paper-trading/trades` separately and merge with positions, OR
2. Update `/api/paper-trading/positions` route to include targets from trades

**Recommendation for Phase 2:** Fetch both endpoints and merge client-side:

```typescript
const tradesState = useAutoRefresh<PaperTradesResponse>({ endpoint: "/api/paper-trading/trades" });

const positionsWithTargets = useMemo(() => {
  return positions.map(position => {
    const trade = tradesState.data?.find(t => 
      t.asset === position.asset && t.status === "active"
    );
    return {
      ...position,
      stop_loss: trade?.stop_loss ?? null,
      target_1: trade?.target_1 ?? null,
      target_2: trade?.target_2 ?? null,
      target_3: trade?.target_3 ?? null
    };
  });
}, [positions, tradesState.data]);
```

**Then add target markers:**
```tsx
{/* Target/Stop Markers */}
{(position.stop_loss || position.target_1) && (
  <div className="mt-3 flex gap-2 text-xs">
    {position.stop_loss && (
      <span className="rounded bg-red-500/20 px-2 py-1 text-red-300">
        Stop: ${position.stop_loss.toLocaleString()}
      </span>
    )}
    {position.target_1 && (
      <span className="rounded bg-green-500/20 px-2 py-1 text-green-300">
        T1: ${position.target_1.toLocaleString()}
      </span>
    )}
    {position.target_2 && (
      <span className="rounded bg-green-500/20 px-2 py-1 text-green-300">
        T2: ${position.target_2.toLocaleString()}
      </span>
    )}
  </div>
)}
```

**Or:** Add visual price ladder (advanced):
```tsx
<div className="relative h-16 border-l border-white/10 pl-2">
  {/* Stop Loss */}
  <div className="absolute left-0" style={{ top: calculatePosition(stop_loss) }}>
    <div className="flex items-center gap-1">
      <div className="h-0.5 w-2 bg-red-500" />
      <span className="text-xs text-red-400">${stop_loss}</span>
    </div>
  </div>
  
  {/* Current Price */}
  <div className="absolute left-0" style={{ top: "50%" }}>
    <div className="flex items-center gap-1">
      <div className="h-1 w-3 bg-blue-500" />
      <span className="text-xs font-semibold text-blue-300">${current_price}</span>
    </div>
  </div>
  
  {/* Target */}
  <div className="absolute left-0" style={{ top: calculatePosition(target_1) }}>
    <div className="flex items-center gap-1">
      <div className="h-0.5 w-2 bg-green-500" />
      <span className="text-xs text-green-400">${target_1}</span>
    </div>
  </div>
</div>
```

---

## Phase 3: Add Skytokens Cost (After Nova Adds Data)

**After Nova adds `cost_to_generate` field to trades:**

Display per position:
```tsx
{/* Cost Badge */}
{position.cost_to_generate && (
  <span className="text-xs text-slate-400">
    💎 ${position.cost_to_generate.toFixed(2)} AI cost
  </span>
)}
```

**Add summary card:**
```tsx
<div className="card">
  <h3 className="text-base font-semibold text-slate-50 mb-2">AI Cost Efficiency</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-xs text-slate-400">Total AI Cost</p>
      <p className="text-lg font-semibold text-slate-50">
        ${totalAICost.toFixed(2)}
      </p>
    </div>
    <div>
      <p className="text-xs text-slate-400">Net P&L After AI</p>
      <p className={clsx(
        "text-lg font-semibold",
        netPnlAfterAI >= 0 ? "text-green-400" : "text-red-400"
      )}>
        ${netPnlAfterAI.toFixed(2)}
      </p>
    </div>
  </div>
  <div className="mt-4">
    <p className="text-xs text-slate-400">AI Cost Efficiency</p>
    <p className="text-xl font-semibold text-blue-300">
      {aiEfficiency.toFixed(0)}x
    </p>
    <p className="text-xs text-slate-400">
      Every $1 of AI cost → ${aiEfficiency.toFixed(0)} profit
    </p>
  </div>
</div>
```

**Calculations:**
```typescript
const totalAICost = positions.reduce((sum, p) => sum + (p.cost_to_generate ?? 0), 0);
const netPnlAfterAI = totalPnl - totalAICost;
const aiEfficiency = totalAICost > 0 ? totalPnl / totalAICost : 0;
```

**Note:** Do NOT use `(pnl - cost) / cost * 100` — that's not the right metric. Use:
- **Net P&L after AI cost:** `pnl - cost_to_generate`
- **AI cost efficiency:** `pnl / cost_to_generate` (return per $ spent on AI)

---

## Layout

```tsx
<AppShell title="Paper Trading" active="paper-trading">
  {/* Balance Breakdown */}
  <BalanceCard />
  
  {/* Position Cards */}
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {positions.map(p => <PositionCard key={p.asset} position={p} />)}
  </div>
  
  {/* Phase 3: AI Cost Summary (after Nova adds data) */}
  {hasAICostData && <AICostSummaryCard />}
</AppShell>
```

---

## Implementation Steps

### Phase 1 (Now):
1. ✅ Create balance breakdown card (deployed/available bars)
2. ✅ Convert PositionsTable to position cards
3. ✅ Add asset badge (initials in circle)
4. ✅ Add P&L progress bar
5. ✅ Add price movement arrows
6. ✅ Test responsive layout

### Phase 2 (After testing):
1. ⏳ Fetch trades data alongside positions
2. ⏳ Merge trades with positions (add targets/stops)
3. ⏳ Add target/stop markers to cards

### Phase 3 (After Nova adds cost data):
1. ⏳ Display cost_to_generate per position
2. ⏳ Add AI cost summary card
3. ⏳ Calculate efficiency metrics

---

## Testing Checklist

**Phase 1:**
- [ ] Balance breakdown shows deployed/available correctly
- [ ] Position cards render with all fields
- [ ] P&L colors correct (green for wins, red for losses)
- [ ] Progress bars fill correctly
- [ ] Empty state handles no positions
- [ ] Responsive layout works on mobile

**Phase 2:**
- [ ] Targets/stops display when available
- [ ] Trade data merges correctly with positions

**Phase 3:**
- [ ] AI cost displays per position
- [ ] Net P&L after AI calculates correctly
- [ ] Efficiency metric shows proper ratio

---

## Files to Modify

**Phase 1:**
- `src/app/paper-trading/page.tsx` — Add balance card
- `src/components/PaperTrading/PositionsTable.tsx` → Rename to `PositionCards.tsx`

**Phase 2:**
- Add trades fetch to page.tsx
- Merge trades with positions

**Phase 3:**
- Add cost display to cards
- Add AI cost summary card

---

**Focus on Phase 1 first — make the cards beautiful.** ✨
