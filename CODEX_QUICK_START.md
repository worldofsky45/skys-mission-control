# Quick Start: Build Missing Screens

**Task:** Add 3 new screens to Mission Control: Costs, Memory, Agents  
**Full context:** See `CODEX_HANDOFF_NEW_SCREENS.md`

---

## Build Order (Recommended)

### 1️⃣ Costs Screen (PRIORITY)
**Why first:** Sky's 15-day sprint needs cost tracking ASAP

**Files to create:**
```
src/app/api/costs/route.ts           # Read costs.jsonl, calculate aggregates
src/app/costs/page.tsx                # Page component with AppShell
src/components/Costs/SpendSummary.tsx
src/components/Costs/BudgetProgress.tsx
src/components/Costs/DailyBreakdown.tsx
```

**Data source:** `~/.openclaw/workspace/costs.jsonl`

**Test with:**
```bash
curl http://localhost:3000/api/costs
```

---

### 2️⃣ Memory Screen
**Why second:** Useful for debugging context issues

**Files to create:**
```
src/app/api/memory/route.ts           # Read MEMORY.md + memory/*.md
src/app/memory/page.tsx                # Page component with AppShell
src/components/Memory/MemoryViewer.tsx
src/components/Memory/RecentUpdates.tsx
src/components/Memory/GraphLinks.tsx
```

**Data sources:**
- `~/.openclaw/workspace/MEMORY.md`
- `~/.openclaw/workspace/memory/*.md`

---

### 3️⃣ Agents Screen
**Why last:** More complex, less urgent

**Files to create:**
```
src/app/api/agents/route.ts           # Read Codex sessions
src/app/agents/page.tsx                # Page component with AppShell
src/components/Agents/SessionsList.tsx
src/components/Agents/TokenUsage.tsx
src/components/Agents/ActiveSubagents.tsx
```

**Data source:** `~/.codex/sessions/`

---

## After Building All Screens

### Update Navigation
Edit `src/components/AppShell.tsx`:

```typescript
// Add to navItems array:
{ key: "costs", label: "Costs", href: "/costs", utility: "Budget tracking" },
{ key: "memory", label: "Memory", href: "/memory", utility: "Context system" },
{ key: "agents", label: "Agents", href: "/agents", utility: "Sessions & tokens" },

// Update NavKey type:
type NavKey = "overview" | "paper" | "polymarket" | "ideas" | "roi" | "costs" | "memory" | "agents" | "health";
```

### Update API Client
Edit `src/lib/api.ts`:

```typescript
export async function getCosts(): Promise<CostsResponse> {
  const res = await fetch("/api/costs");
  if (!res.ok) throw new Error("Failed to fetch costs");
  return res.json();
}

export async function getMemory(): Promise<MemoryResponse> {
  const res = await fetch("/api/memory");
  if (!res.ok) throw new Error("Failed to fetch memory");
  return res.json();
}

export async function getAgents(): Promise<AgentsResponse> {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}
```

### Add Types
Edit `src/lib/types.ts` - Add all type definitions from handoff doc.

---

## Copy-Paste Starter (Costs API Route)

```typescript
// src/app/api/costs/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || "/Users/sky/.openclaw/workspace";
const COSTS_FILE = path.join(WORKSPACE_PATH, "costs.jsonl");

export async function GET() {
  try {
    // Check if file exists
    if (!fs.existsSync(COSTS_FILE)) {
      return NextResponse.json(
        { error: "Costs file not found" },
        { status: 503 }
      );
    }

    // Read and parse JSONL
    const raw = fs.readFileSync(COSTS_FILE, "utf-8");
    const lines = raw.split("\n").filter(line => line.trim());
    
    const entries: any[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        // Skip schema/comment lines
        if (entry._schema || entry._format) continue;
        entries.push(entry);
      } catch (e) {
        console.error("Failed to parse line:", line);
      }
    }

    // Calculate aggregates
    const totalSpent = entries.reduce((sum, e) => sum + e.amount, 0);
    const daysElapsed = 3; // TODO: Calculate from sprint start date
    const dailyAverage = totalSpent / daysElapsed;
    const daysRemaining = 12;
    const budgetTotal = 375.0;
    const budgetUsedPct = (totalSpent / budgetTotal) * 100;
    const projectedTotal = dailyAverage * (daysElapsed + daysRemaining);

    // Group by category
    const byCategory = entries.reduce((acc: any, e) => {
      const existing = acc.find((c: any) => c.category === e.category);
      if (existing) {
        existing.amount += e.amount;
      } else {
        acc.push({ category: e.category, amount: e.amount });
      }
      return acc;
    }, []);

    // Add percentages
    byCategory.forEach((c: any) => {
      c.pct = (c.amount / totalSpent) * 100;
    });

    // Group by date for daily breakdown
    const byDate = entries.reduce((acc: any, e) => {
      const existing = acc.find((d: any) => d.date === e.date);
      if (existing) {
        existing.amount += e.amount;
      } else {
        acc.push({ date: e.date, amount: e.amount });
      }
      return acc;
    }, []);

    return NextResponse.json({
      summary: {
        total_spent: totalSpent,
        daily_average: dailyAverage,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        budget_total: budgetTotal,
        budget_used_pct: budgetUsedPct,
        projected_total: projectedTotal,
        on_track: projectedTotal <= budgetTotal
      },
      by_category: byCategory,
      by_project: [], // TODO: Extract from description or separate field
      daily_breakdown: byDate.sort((a: any, b: any) => a.date.localeCompare(b.date)),
      recent_expenses: entries.slice(-10).reverse()
    });

  } catch (error) {
    console.error("Error reading costs:", error);
    return NextResponse.json(
      { error: "Failed to read costs" },
      { status: 500 }
    );
  }
}
```

---

## Testing Checklist

After each screen:
- [ ] API route returns data: `curl http://localhost:3000/api/<route>`
- [ ] Page loads without errors: `npm run dev` → visit page
- [ ] Refresh button works
- [ ] Error state works (rename data file temporarily)
- [ ] Design matches existing screens
- [ ] Navigation works
- [ ] Mobile responsive

---

## Need Help?

1. **Look at existing pages** - `/paper-trading/page.tsx` is a great reference
2. **Check existing API routes** - `/api/paper-trading/balance/route.ts`
3. **Review AppShell** - `src/components/AppShell.tsx` for patterns
4. **Check types** - `src/lib/types.ts` for existing type patterns

---

**Full handoff doc:** `CODEX_HANDOFF_NEW_SCREENS.md`  
**Estimated time:** 2-3 hours total  
**Last updated:** 2026-05-07
