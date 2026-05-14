# Health Page — Jobs & Cost Tracking

**Handoff:** 06  
**Page:** `/health`  
**Phase:** 2 (Add after Phase 1 UI is complete)  
**Scope:** Read-only data contract + visual display

---

## Context

This is a **Phase 2 addition** — it requires a new read-only API route and visual display of Nova's job schedule.

**Purpose:** Show Sky all of Nova's automated tasks, their schedules, costs, and execution status.

---

## Current State

**Component:** `src/app/health/page.tsx`

**What works:**
- Fetches health data via `/api/health`
- Displays SystemHealth component
- Shows file freshness, API status

**What to add:**
- Nova's job schedule (daily, weekly tasks)
- Cost per run and monthly estimates
- Last run status and next run countdown

---

## New API Route Required

### GET /api/health/jobs

**File:** `src/app/api/health/jobs/route.ts`

```typescript
import { readJsonFile } from "@/lib/file-store";
import { paths } from "@/lib/constants";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const schedule = await readJsonFile<JobsSchedule>(
      join(paths.workspace, "jobs-schedule.json")
    );
    return Response.json(schedule);
  } catch (error) {
    // Return empty schedule if file doesn't exist yet
    return Response.json({ 
      jobs: [], 
      total_monthly_cost: 0,
      last_updated: new Date().toISOString()
    }, { status: 200 });
  }
}

interface JobsSchedule {
  jobs: Array<{
    id: string;
    name: string;
    schedule: string;
    description: string;
    cost_per_run: number;
    runs_per_month: number;
    monthly_cost: number;
    last_run: string;
    next_run: string;
    status: "success" | "failed" | "running";
  }>;
  total_monthly_cost: number;
  last_updated: string;
}
```

**Data source:** `/Users/sky/.openclaw/workspace/jobs-schedule.json`

**Note:** This is a **read-only contract** — Nova maintains the file, API just reads it.

---

## Page Layout

### Top: System Health (Keep Existing)

Keep the current SystemHealth component.

### Middle: Job Schedule Cards

Add job cards showing Nova's automation:

```tsx
<section className="mt-8">
  <h2 className="mb-4 text-lg font-semibold text-slate-50">Nova's Jobs</h2>
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {jobs.map(job => (
      <div key={job.id} className="card">
        {/* Header: Job Name + Status */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-slate-50">{job.name}</h3>
          <span className={clsx(
            "rounded px-2 py-0.5 text-xs font-medium",
            job.status === "success" && "bg-green-500/20 text-green-300",
            job.status === "failed" && "bg-red-500/20 text-red-300",
            job.status === "running" && "bg-blue-500/20 text-blue-300"
          )}>
            {job.status === "success" ? "✅" : job.status === "failed" ? "❌" : "⏳"}
          </span>
        </div>
        
        {/* Schedule */}
        <p className="text-sm text-slate-300 mb-3">{job.schedule}</p>
        <p className="text-xs text-slate-400 mb-4">{job.description}</p>
        
        {/* Last Run */}
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">Last Run:</span>
          <span className="text-slate-50">
            {formatRelativeTime(job.last_run)}
          </span>
        </div>
        
        {/* Next Run */}
        <div className="mb-4 flex items-center justify-between text-xs">
          <span className="text-slate-400">Next Run:</span>
          <span className="text-blue-300">
            {formatCountdown(job.next_run)}
          </span>
        </div>
        
        {/* Cost */}
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Cost per run</p>
              <p className="text-sm font-semibold text-slate-50">
                ${job.cost_per_run.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Monthly est.</p>
              <p className="text-sm font-semibold text-blue-300">
                ${job.monthly_cost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>
```

**Helper functions:**
```typescript
function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatCountdown(isoString: string): string {
  const now = new Date();
  const future = new Date(isoString);
  const diffMs = future.getTime() - now.getTime();
  
  if (diffMs < 0) return "Overdue";
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h ${diffMins % 60}m`;
  return `in ${diffDays}d ${diffHours % 24}h`;
}
```

---

### Bottom: Cost Summary Card

Add overall cost tracking:

```tsx
<div className="card mt-8">
  <h3 className="mb-4 text-lg font-semibold text-slate-50">Cost Summary</h3>
  
  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
    {/* Total Monthly Cost */}
    <div>
      <p className="text-xs text-slate-400 mb-1">Total Monthly Cost</p>
      <p className="text-3xl font-semibold text-blue-300">
        ${totalMonthlyCost.toFixed(2)}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        ~${(totalMonthlyCost / 30).toFixed(2)}/day
      </p>
    </div>
    
    {/* Most Expensive Job */}
    <div>
      <p className="text-xs text-slate-400 mb-1">Most Expensive</p>
      <p className="text-base font-semibold text-slate-50">
        {mostExpensiveJob?.name}
      </p>
      <p className="text-sm text-slate-400">
        ${mostExpensiveJob?.monthly_cost.toFixed(2)}/mo
      </p>
    </div>
    
    {/* Total Runs This Month */}
    <div>
      <p className="text-xs text-slate-400 mb-1">Est. Runs/Month</p>
      <p className="text-3xl font-semibold text-slate-50">
        {totalRunsPerMonth}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Across {jobs.length} jobs
      </p>
    </div>
  </div>
  
  {/* Top 3 Most Expensive (Optional) */}
  <div className="mt-6">
    <p className="text-xs font-medium text-slate-400 mb-2">Top 3 Most Expensive</p>
    <div className="space-y-2">
      {top3Jobs.map(job => (
        <div key={job.id} className="flex items-center justify-between text-sm">
          <span className="text-slate-300">{job.name}</span>
          <span className="text-slate-400">${job.monthly_cost.toFixed(2)}/mo</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Calculate summary:**
```typescript
const totalMonthlyCost = jobs.reduce((sum, job) => sum + job.monthly_cost, 0);
const totalRunsPerMonth = jobs.reduce((sum, job) => sum + job.runs_per_month, 0);
const mostExpensiveJob = jobs.sort((a, b) => b.monthly_cost - a.monthly_cost)[0];
const top3Jobs = jobs.sort((a, b) => b.monthly_cost - a.monthly_cost).slice(0, 3);
```

---

## Empty State

If `jobs-schedule.json` doesn't exist yet:

```tsx
{jobs.length === 0 && (
  <div className="card text-center py-12">
    <p className="text-slate-400 mb-2">No job schedule configured yet.</p>
    <p className="text-xs text-slate-500">
      Nova will populate this once automated tasks are active.
    </p>
  </div>
)}
```

---

## Implementation Steps

1. ✅ Create `/api/health/jobs` route
2. ✅ Add `useAutoRefresh` hook to fetch jobs data
3. ✅ Create job cards with schedule, status, costs
4. ✅ Add relative time formatting (last run)
5. ✅ Add countdown formatting (next run)
6. ✅ Add cost summary card
7. ✅ Test empty state (when jobs-schedule.json missing)
8. ✅ Test responsive layout

---

## Testing Checklist

- [ ] `/api/health/jobs` returns jobs-schedule.json correctly
- [ ] Empty state displays when file is missing
- [ ] Job cards show all fields correctly
- [ ] Status badges show correct colors
- [ ] Relative time formats correctly (e.g., "2h ago")
- [ ] Countdown formats correctly (e.g., "in 9h 56m")
- [ ] Cost summary calculates totals correctly
- [ ] Most expensive job identified correctly
- [ ] Responsive layout works on mobile

---

## Files to Create/Modify

**New API route:**
- `src/app/api/health/jobs/route.ts`

**Modify:**
- `src/app/health/page.tsx` — Add jobs section

**Optional components:**
- `src/components/Health/JobCard.tsx`
- `src/components/Health/CostSummary.tsx`

---

## Data Contract

Nova maintains `/Users/sky/.openclaw/workspace/jobs-schedule.json`:

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

Mission Control reads this file via the new API route.

---

**This is Phase 2 — implement after Phase 1 UI is stable.** ✨
