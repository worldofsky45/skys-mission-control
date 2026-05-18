# Polymarket Page — Educational Signal Cards

**Handoff:** 04  
**Page:** `/polymarket`  
**Phase 1:** Visual signal cards (use existing data)  
**Phase 2:** Add thesis/catalyst fields (after Nova adds data)

---

## Current State

**Component:** `src/app/polymarket/page.tsx`

**What works:**
- Fetches signals via `/api/polymarket/signals`
- Displays signals in basic table

**What needs improvement:**
- Table is not visual
- No confidence display
- No odds movement indicators
- No educational context

---

## Data Available

### Polymarket Signals (`PolymarketSignal`)
```typescript
{
  id?: string,
  signal_id?: string,
  timestamp?: string,
  created_at?: string,
  market: string,
  market_id?: string,
  category?: string,
  prediction: string,  // "YES" or "NO"
  confidence?: number,
  entry_odds?: string | number,
  current_odds?: string | number,
  entry_price?: number,
  position_size?: number,
  status: string,  // "active", "won", "lost"
  created_by?: string
}
```

**Note:** Schema uses `.passthrough()` so extra fields won't break it.

---

## Phase 1: Visual Signal Cards (Existing Data Only)

### Signal Card Layout

Replace table with cards:

```tsx
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
  {signals.map(signal => (
    <div key={signal.id || signal.signal_id} className="card">
      {/* Header: Market Name + Status */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-slate-50">{signal.market}</h4>
        <span className={clsx(
          "rounded px-2 py-0.5 text-xs font-medium",
          signal.status === "active" && "bg-blue-500/20 text-blue-300",
          signal.status === "won" && "bg-green-500/20 text-green-300",
          signal.status === "lost" && "bg-red-500/20 text-red-300"
        )}>
          {signal.status}
        </span>
      </div>
      
      {/* Prediction + Confidence */}
      <div className="mb-3 flex items-center gap-2">
        <span className={clsx(
          "rounded px-3 py-1 text-sm font-semibold",
          signal.prediction === "YES" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
        )}>
          {signal.prediction}
        </span>
        {signal.confidence && (
          <span className="text-sm text-slate-400">
            {signal.confidence}% confident
          </span>
        )}
      </div>
      
      {/* Odds Movement */}
      {signal.entry_odds && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-slate-400">
            Entry: {formatOdds(signal.entry_odds)}
          </span>
          {signal.current_odds && (
            <>
              <span className={getOddsChangeColor(signal.entry_odds, signal.current_odds)}>
                {getOddsChangeArrow(signal.entry_odds, signal.current_odds)}
              </span>
              <span className="text-slate-50">
                Now: {formatOdds(signal.current_odds)}
              </span>
              <span className={clsx(
                "text-xs",
                getOddsChangeColor(signal.entry_odds, signal.current_odds)
              )}>
                ({calculateOddsChange(signal.entry_odds, signal.current_odds)}%)
              </span>
            </>
          )}
        </div>
      )}
      
      {/* Position Info */}
      {signal.position_size && (
        <div className="text-xs text-slate-400">
          Position: ${signal.position_size}
        </div>
      )}
      
      {/* Timestamp */}
      {signal.created_at && (
        <div className="mt-3 text-xs text-slate-400">
          Created: {new Date(signal.created_at).toLocaleDateString()}
        </div>
      )}
    </div>
  ))}
</div>
```

**Helper functions:**
```typescript
function formatOdds(odds: string | number): string {
  const num = typeof odds === "string" ? parseFloat(odds) : odds;
  return num.toFixed(2);
}

function calculateOddsChange(entry: string | number, current: string | number): string {
  const entryNum = typeof entry === "string" ? parseFloat(entry) : entry;
  const currentNum = typeof current === "string" ? parseFloat(current) : current;
  const change = ((currentNum - entryNum) / entryNum) * 100;
  return (change >= 0 ? "+" : "") + change.toFixed(1);
}

function getOddsChangeArrow(entry: string | number, current: string | number): string {
  const entryNum = typeof entry === "string" ? parseFloat(entry) : entry;
  const currentNum = typeof current === "string" ? parseFloat(current) : current;
  return currentNum > entryNum ? "↗️" : "↘️";
}

function getOddsChangeColor(entry: string | number, current: string | number): string {
  const entryNum = typeof entry === "string" ? parseFloat(entry) : entry;
  const currentNum = typeof current === "string" ? parseFloat(current) : current;
  return currentNum > entryNum ? "text-green-400" : "text-red-400";
}
```

---

### Filter Tabs (Optional)

Add filter by status:

```tsx
const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

const filteredSignals = useMemo(() => {
  if (filter === "active") return signals.filter(s => s.status === "active");
  if (filter === "resolved") return signals.filter(s => s.status === "won" || s.status === "lost");
  return signals;
}, [signals, filter]);

<div className="flex gap-2 mb-4">
  {(["all", "active", "resolved"] as const).map(f => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className={clsx(
        "rounded px-4 py-2 text-sm font-medium transition-colors",
        filter === f 
          ? "bg-blue-500 text-white" 
          : "bg-white/5 text-slate-400 hover:bg-white/10"
      )}
    >
      {f.charAt(0).toUpperCase() + f.slice(1)}
    </button>
  ))}
</div>
```

---

### Summary Card (Top)

Add overall stats:

```tsx
<div className="card mb-6">
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    <div>
      <p className="text-xs text-slate-400">Total Signals</p>
      <p className="text-2xl font-semibold text-slate-50">{signals.length}</p>
    </div>
    <div>
      <p className="text-xs text-slate-400">Active</p>
      <p className="text-2xl font-semibold text-blue-300">
        {signals.filter(s => s.status === "active").length}
      </p>
    </div>
    <div>
      <p className="text-xs text-slate-400">Won</p>
      <p className="text-2xl font-semibold text-green-300">
        {signals.filter(s => s.status === "won").length}
      </p>
    </div>
    <div>
      <p className="text-xs text-slate-400">Lost</p>
      <p className="text-2xl font-semibold text-red-300">
        {signals.filter(s => s.status === "lost").length}
      </p>
    </div>
  </div>
</div>
```

---

## Phase 2: Add Educational Context (After Nova Adds Data)

**After Nova adds these fields to `polymarket-signals.jsonl`:**
- `thesis`: Brief 1-2 sentence explanation
- `catalyst`: What event resolves this
- `resolution_date`: When it resolves
- `category`: politics, crypto, sports, etc.

### Enhanced Signal Card

```tsx
<div className="card">
  {/* Existing header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      {signal.category && (
        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
          {signal.category}
        </span>
      )}
      <h4 className="font-medium text-slate-50">{signal.market}</h4>
    </div>
    <span className={statusBadgeClass}>{signal.status}</span>
  </div>
  
  {/* Existing prediction + odds */}
  ...
  
  {/* NEW: Thesis (Why This Signal?) */}
  {signal.thesis && (
    <div className="my-3 rounded bg-blue-500/10 p-3">
      <p className="text-xs font-medium text-blue-300 mb-1">💡 Why This Signal?</p>
      <p className="text-sm text-slate-300">{signal.thesis}</p>
    </div>
  )}
  
  {/* NEW: Catalyst & Resolution */}
  {(signal.catalyst || signal.resolution_date) && (
    <div className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
      {signal.catalyst && (
        <div>📅 <span className="font-medium">Resolves:</span> {signal.catalyst}</div>
      )}
      {signal.resolution_date && (
        <div>
          🕒 <span className="font-medium">Date:</span> {new Date(signal.resolution_date).toLocaleDateString()}
          {signal.status === "active" && (
            <span className="ml-2 text-yellow-400">
              ({calculateDaysUntil(signal.resolution_date)} days)
            </span>
          )}
        </div>
      )}
    </div>
  )}
  
  {/* Existing position + timestamp */}
  ...
</div>
```

**Helper:**
```typescript
function calculateDaysUntil(dateString: string): number {
  const now = new Date();
  const future = new Date(dateString);
  const diff = future.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
```

---

### Educational Tooltips (Optional)

Add info icons with hover tooltips explaining concepts:

```tsx
<div className="flex items-center gap-1">
  <span className="text-xs text-slate-400">Confidence</span>
  <button
    type="button"
    className="text-slate-500 hover:text-slate-300"
    title="How certain Nova is about this prediction based on historical patterns"
  >
    ℹ️
  </button>
</div>
```

For better tooltips, consider adding a library like `@radix-ui/react-tooltip` or Tailwind CSS tooltip utilities.

---

## Layout

```tsx
<AppShell title="Polymarket Signals" active="polymarket">
  {/* Summary Stats */}
  <SummaryCard />
  
  {/* Filter Tabs */}
  <FilterTabs />
  
  {/* Signal Cards */}
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {filteredSignals.map(signal => (
      <SignalCard key={signal.id} signal={signal} />
    ))}
  </div>
  
  {/* Empty State */}
  {filteredSignals.length === 0 && (
    <div className="card text-center py-12">
      <p className="text-slate-400">No {filter} signals yet.</p>
    </div>
  )}
</AppShell>
```

---

## Implementation Steps

### Phase 1 (Now):
1. ✅ Create signal card component
2. ✅ Add prediction badge (YES/NO with colors)
3. ✅ Add confidence display
4. ✅ Add odds movement indicator (arrow + percentage)
5. ✅ Add status badges
6. ✅ Add summary stats card
7. ✅ Add filter tabs (all/active/resolved)
8. ✅ Test responsive layout

### Phase 2 (After Nova adds data):
1. ⏳ Add category badge
2. ⏳ Add thesis display (why this signal)
3. ⏳ Add catalyst/resolution date
4. ⏳ Add days-until countdown for active signals
5. ⏳ Optional: Add educational tooltips

---

## Testing Checklist

**Phase 1:**
- [ ] Signal cards render with all fields
- [ ] Prediction badges show correct colors (green for YES, red for NO)
- [ ] Odds movement shows arrow and percentage correctly
- [ ] Status badges show correct colors
- [ ] Summary stats calculate correctly
- [ ] Filter tabs work (all/active/resolved)
- [ ] Empty state displays when no signals match filter
- [ ] Responsive layout works on mobile

**Phase 2:**
- [ ] Category badges display when available
- [ ] Thesis text renders in highlighted box
- [ ] Catalyst/resolution date display correctly
- [ ] Days-until countdown calculates correctly

---

## Files to Modify

**Phase 1:**
- `src/app/polymarket/page.tsx` — Add card layout
- Create `src/components/Polymarket/SignalCard.tsx` (optional)

**Phase 2:**
- Update SignalCard to show thesis, catalyst, resolution_date

---

**Make prediction markets educational — Sky wants to learn from them.** ✨
