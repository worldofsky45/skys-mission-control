# Visual Foundation — Design System

**Handoff:** 01  
**Purpose:** Shared design system for all Mission Control pages

---

## Typography

**Font Stack:**
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

**Sizes:**
- `text-xs` (0.75rem) — Labels, metadata
- `text-sm` (0.875rem) — Body text, card content
- `text-base` (1rem) — Card headings
- `text-lg` (1.125rem) — Section headings
- `text-xl` (1.25rem) — Page titles
- `text-2xl` (1.5rem) — Hero numbers

**Weights:**
- `font-normal` (400) — Body text
- `font-medium` (500) — Emphasized text
- `font-semibold` (600) — Headings

---

## Color System

### Background
```css
--bg-primary: #1c1c1e;     /* Page background */
--bg-card: #2c2c2e;        /* Card background */
--bg-hover: #3a3a3c;       /* Hover states */
--bg-overlay: rgba(255, 255, 255, 0.055); /* Glass morphism */
```

### Accents
```css
--accent-blue: #0a84ff;    /* Primary actions, links */
--accent-green: #30d158;   /* Success, profit, wins */
--accent-red: #ff453a;     /* Errors, losses */
--accent-yellow: #ffd60a;  /* Warnings, pending */
--accent-purple: #bf5af2;  /* Special highlights */
```

### Text
```css
--text-primary: #ffffff;   /* Main text */
--text-secondary: #98989d; /* Subtext, metadata */
--text-tertiary: #6e6e73;  /* Disabled, placeholder */
```

### Borders
```css
--border-default: rgba(255, 255, 255, 0.1);
--border-hover: rgba(255, 255, 255, 0.2);
```

---

## Card Styles

### Glass Morphism Card
```css
.card {
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  padding: 1rem;
  transition: all 150ms ease-in-out;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.065);
}
```

### Tailwind Classes
```tsx
className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.065]"
```

---

## Badges

### Status Badge
```tsx
<span className={clsx(
  "rounded px-2 py-0.5 text-xs font-medium",
  status === "active" && "bg-green-500/20 text-green-300",
  status === "closed" && "bg-slate-500/20 text-slate-300",
  status === "error" && "bg-red-500/20 text-red-300"
)}>
  {status}
</span>
```

### Tier Badge
```tsx
<span className={clsx(
  "rounded px-2 py-0.5 text-xs font-semibold",
  tier === 1 && "bg-green-500/20 text-green-300",
  tier === 2 && "bg-yellow-500/20 text-yellow-300",
  tier === 3 && "bg-orange-500/20 text-orange-300"
)}>
  Tier {tier}
</span>
```

---

## Buttons

### Primary Button
```tsx
<button className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600">
  Action
</button>
```

### Secondary Button
```tsx
<button className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">
  Cancel
</button>
```

---

## Progress Bars

### Horizontal Progress
```tsx
<div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
  <div 
    className={clsx(
      "h-full rounded-full transition-all",
      isPositive ? "bg-green-500" : "bg-red-500"
    )}
    style={{ width: `${percentage}%` }}
  />
</div>
```

### With Label
```tsx
<div>
  <div className="mb-1 flex justify-between text-xs text-slate-400">
    <span>Progress to T1</span>
    <span>{percentage}%</span>
  </div>
  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
    <div className="h-full rounded-full bg-green-500" style={{ width: `${percentage}%` }} />
  </div>
</div>
```

---

## Icons & Indicators

### Arrow Indicators (Price Movement)
```tsx
{priceChange > 0 ? (
  <span className="text-green-400">↗️</span>
) : (
  <span className="text-red-400">↘️</span>
)}
```

### Asset Badge (Initials)
```tsx
<div className={clsx(
  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
  "bg-blue-500/20 text-blue-300" // Color by asset
)}>
  {asset.slice(0, 3).toUpperCase()}
</div>
```

**Asset colors:**
- BTC: blue
- ETH: purple
- SOL: gradient (cyan to purple)
- Others: slate

---

## Chart Styling (Recharts)

### Line Chart (Equity Curve)
```tsx
<ResponsiveContainer width="100%" height={200}>
  <LineChart data={equityCurve}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
    <XAxis 
      dataKey="timestamp" 
      stroke="#98989d" 
      fontSize={12}
      tickFormatter={(value) => formatDate(value)}
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
```

### Pie Chart (Asset Allocation)
```tsx
<ResponsiveContainer width="100%" height={200}>
  <PieChart>
    <Pie
      data={allocationData}
      dataKey="value"
      nameKey="asset"
      cx="50%"
      cy="50%"
      outerRadius={80}
      label
    >
      {allocationData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>

const COLORS = ["#0a84ff", "#bf5af2", "#30d158", "#ffd60a", "#ff453a"];
```

---

## Animations

### Hover Transitions
```css
transition: all 150ms ease-in-out;
```

### Number Count-Up (Optional)
Use Recharts built-in animations or simple CSS transitions on number changes.

### Card Entrance (Optional with Framer Motion)
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Card content */}
</motion.div>
```

**Note:** Framer Motion is optional. Use only if Sky approves extra dependency.

---

## Responsive Layout

### Mobile-First Grid
```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Cards */}
</div>
```

### Breakpoints
- `md:` — 768px and up (tablets)
- `lg:` — 1024px and up (desktops)
- `xl:` — 1280px and up (large desktops)

---

## Utility Components

### Section Heading
```tsx
<h2 className="mb-4 text-lg font-semibold text-slate-50">
  Section Title
</h2>
```

### Empty State
```tsx
<div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
  <p className="text-sm text-slate-400">
    No data available yet.
  </p>
</div>
```

### Loading Spinner
```tsx
<div className="flex items-center justify-center p-8">
  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
</div>
```

---

## Testing Checklist

After applying this design system:
- ✅ Check contrast ratios (text should be readable)
- ✅ Test hover states on all interactive elements
- ✅ Verify responsive breakpoints (mobile/tablet/desktop)
- ✅ Confirm backdrop-blur works (Safari/Chrome)
- ✅ Check dark mode appearance

---

**Use this foundation across all pages for consistency.** ✨
