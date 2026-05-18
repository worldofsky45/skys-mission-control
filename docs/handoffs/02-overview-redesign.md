# Overview Page Redesign

**Handoff:** 02  
**Page:** `/` (OverviewPage.tsx)  
**Phase:** 1 (Pure UI enhancement)

---

## Current State

**Component:** `src/components/pages/OverviewPage.tsx`

**What works:**
- Fetches all data via `useAutoRefresh` hooks
- Renders `HeroCards` (4 basic stat cards)
- Renders `SystemHealth` bar
- 30-second polling active

**What needs improvement:**
- Hero cards are just numbers (no sparklines, no progress indicators)
- No charts (equity curve, asset allocation)
- No visual hierarchy

---

## Data Available

```typescript
const healthState = useAutoRefresh<HealthStatus>({ endpoint: "/api/health" });
const balanceState = useAutoRefresh<PaperBalanceResponse>({ endpoint: "/api/paper-trading/balance" });
const tradesState = useAutoRefresh<PaperTradesResponse>({ endpoint: "/api/paper-trading/trades" });
const polymarketState = useAutoRefresh<PolymarketSignalsResponse>({ endpoint: "/api/polymarket/signals" });
const ideasState = useAutoRefresh<IdeasResponse>({ endpoint: "/api/ideas/list" });
const roiState = useAutoRefresh<AggregatedROI>({ endpoint: "/api/roi" });
```

**Key fields:**
- `balanceState.data.balance.current_balance` — Current portfolio value
- `balanceState.data.balance.total_pnl` — Total P&L (realized + unrealized)
- `balanceState.data.balance.equity_curve` — Array of `{ timestamp, value }`
- `tradesState.data` — Array of trades (can group by asset for allocation)

---

## Redesign Specs

### Top Section: Hero Metrics (4 Cards)

Replace basic HeroCards with visual cards:

#### 1. Portfolio Value Card
```tsx
<div className="card">
  <p className="text-xs text-slate-400">Portfolio Value</p>
  <p className="text-2xl font-semibold text-slate-50">
    ${balanceState.data?.balance.current_balance.toLocaleString()}
  </p>
  {/* Add sparkline chart here (last 7 days) */}
  <Sparkline data={last7Days} />
</div>
```

**Sparkline:** Use Recharts `LineChart` with minimal styling:
- No axes, no grid
- Small height (30-40px)
- Single line, no dots
- Color: `#0a84ff`

**Data source:** Slice last 7 points from `balance.equity_curve`

#### 2. Total P&L Card
```tsx
<div className="card">
  <p className="text-xs text-slate-400">Total P&L</p>
  <p className={clsx(
    "text-2xl font-semibold",
    totalPnl >= 0 ? "text-green-400" : "text-red-400"
  )}>
    {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}
  </p>
  <p className="text-xs text-slate-400">
    {totalPnlPct >= 0 ? "↗️" : "↘️"} {Math.abs(totalPnlPct).toFixed(2)}%
  </p>
</div>
```

**Note:** Use "Total P&L" not "24h P&L" (we don't have 24h data yet).

#### 3. Win Rate Card
```tsx
<div className="card">
  <p className="text-xs text-slate-400">Win Rate</p>
  <p className="text-2xl font-semibold text-slate-50">
    {winRate.toFixed(1)}%
  </p>
  {/* Optional: circular progress indicator */}
  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
    <div 
      className="h-full bg-green-500"
      style={{ width: `${winRate}%` }}
    />
  </div>
</div>
```

**Data source:** `getCombinedWinRate()` (already computed in OverviewPage)

#### 4. Active Positions Card
```tsx
<div className="card">
  <p className="text-xs text-slate-400">Active Positions</p>
  <p className="text-2xl font-semibold text-slate-50">
    {activePositionCount}
  </p>
  {/* Optional: mini grid of asset initials */}
  <div className="mt-2 flex gap-1">
    {topAssets.map(asset => (
      <div key={asset} className="h-6 w-6 rounded-full bg-blue-500/20 text-xs flex items-center justify-center text-blue-300">
        {asset.slice(0, 2)}
      </div>
    ))}
  </div>
</div>
```

**Data source:** Count active trades from `tradesState.data`

---

### Middle Section: Equity Curve Chart

Add full-width line chart showing portfolio value over time.

```tsx
<div className="card">
  <h3 className="mb-4 text-base font-semibold text-slate-50">Portfolio Growth</h3>
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={balanceState.data?.balance.equity_curve}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
      <XAxis 
        dataKey="timestamp" 
        stroke="#98989d" 
        fontSize={12}
        tickFormatter={(value) => new Date(value).toLocaleDateString()}
      />
      <YAxis 
        stroke="#98989d" 
        fontSize={12}
        tickFormatter={(value) => `$${value.toLocaleString()}`}
      />
      <Tooltip 
        contentStyle={{
          background: "rgba(44, 44, 46, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "0.5rem"
        }}
        formatter={(value) => [`$${value.toLocaleString()}`, "Value"]}
        labelFormatter={(label) => new Date(label).toLocaleString()}
      />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke="#0a84ff" 
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

**Data source:** `balanceState.data.balance.equity_curve`

**Handle empty state:**
```tsx
{equityCurve.length === 0 ? (
  <p className="text-sm text-slate-400">No equity curve data yet.</p>
) : (
  <ResponsiveContainer>...</ResponsiveContainer>
)}
```

---

### Bottom Section: Asset Allocation

Add donut/pie chart showing deployed capital by asset.

**Data preparation:**
```typescript
const allocationData = useMemo(() => {
  const activeTradesOnly = tradesState.data?.filter(t => t.status === "active") ?? [];
  const grouped = activeTradesOnly.reduce((acc, trade) => {
    const asset = trade.asset.toUpperCase();
    acc[asset] = (acc[asset] || 0) + trade.position_value;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(grouped).map(([asset, value]) => ({
    asset,
    value: Math.round(value)
  }));
}, [tradesState.data]);
```

**Chart:**
```tsx
<div className="card">
  <h3 className="mb-4 text-base font-semibold text-slate-50">Asset Allocation</h3>
  {allocationData.length === 0 ? (
    <p className="text-sm text-slate-400">No active positions.</p>
  ) : (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={allocationData}
          dataKey="value"
          nameKey="asset"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(entry) => `${entry.asset} (${((entry.value / totalDeployed) * 100).toFixed(0)}%)`}
        >
          {allocationData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => `$${value.toLocaleString()}`}
        />
      </PieChart>
    </ResponsiveContainer>
  )}
</div>

const ASSET_COLORS = ["#0a84ff", "#bf5af2", "#30d158", "#ffd60a", "#ff453a"];
```

**Alternative:** Horizontal stacked bar if pie is too cluttered:
```tsx
<div className="space-y-2">
  {allocationData.map((item, index) => (
    <div key={item.asset}>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{item.asset}</span>
        <span>${item.value.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div 
          className="h-full rounded-full"
          style={{ 
            width: `${(item.value / totalDeployed) * 100}%`,
            backgroundColor: ASSET_COLORS[index % ASSET_COLORS.length]
          }}
        />
      </div>
    </div>
  ))}
</div>
```

---

## Layout

```tsx
<AppShell {...props}>
  <SystemHealth {...healthState} />
  
  {/* Hero Metrics */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <PortfolioValueCard />
    <TotalPnLCard />
    <WinRateCard />
    <ActivePositionsCard />
  </div>
  
  {/* Equity Curve */}
  <EquityCurveChart />
  
  {/* Asset Allocation */}
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <AssetAllocationChart />
    {/* Future: Recent Activity Timeline */}
  </div>
</AppShell>
```

---

## Implementation Steps

1. ✅ Extract current HeroCards into separate components
2. ✅ Add sparkline to Portfolio Value card (Recharts mini chart)
3. ✅ Add progress bar to Win Rate card
4. ✅ Add mini asset badges to Active Positions card
5. ✅ Add full-width equity curve chart below hero cards
6. ✅ Add asset allocation chart (pie or horizontal bars)
7. ✅ Test responsive layout (mobile/tablet/desktop)
8. ✅ Verify data still loads correctly

---

## Testing Checklist

- [ ] Portfolio Value sparkline renders correctly
- [ ] Total P&L shows correct color (green for positive, red for negative)
- [ ] Win Rate progress bar fills correctly
- [ ] Equity curve chart shows all data points
- [ ] Asset allocation chart groups trades correctly
- [ ] Empty states handle missing data gracefully
- [ ] Responsive layout works on mobile
- [ ] 30-second polling still active
- [ ] No console errors

---

## Files to Modify

**Primary:**
- `src/components/pages/OverviewPage.tsx` — Add new chart components

**New components (optional):**
- `src/components/Overview/PortfolioValueCard.tsx`
- `src/components/Overview/EquityCurveChart.tsx`
- `src/components/Overview/AssetAllocationChart.tsx`

**Or:** Keep all in OverviewPage.tsx if complexity is low

---

**This is the showcase page — make it stunning.** ✨
