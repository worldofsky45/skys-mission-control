# Idea Engine Page — Detailed Idea Cards

**Handoff:** 05  
**Page:** `/ideas`  
**Phase 1:** Visual idea cards with stars, tiers, expand/collapse  
**Phase 2:** Add detailed fields (after Nova adds data)

---

## Current State

**Component:** `src/app/ideas/page.tsx`

**What works:**
- Fetches ideas via `/api/ideas/list`
- Displays pending/approved/rejected ideas
- Approve/reject buttons POST to `/api/ideas/approve` or `/api/ideas/reject`

**What needs improvement:**
- Basic list, no visual hierarchy
- No star ratings, tier badges
- No expandable details

---

## Data Available

### Ideas State (`IdeasResponse`)
```typescript
{
  pending: Array<{
    id: string,
    name: string,
    tier?: number,
    stars?: number,
    one_liner?: string,
    roi_potential?: string,
    complexity?: string,
    capital_required?: string,
    feedback_loop?: string,
    status?: string,
    approved?: string,
    approved_date?: string,
    rejected?: string,
    rejection_date?: string,
    week?: number,
    next_milestone?: string
  }>,
  approved: Array<Idea>,
  rejected: Array<Idea>,
  queued: Array<Idea>,
  last_updated?: string
}
```

**Note:** Schema uses `.passthrough()` so extra fields won't break it.

---

## Phase 1: Visual Idea Cards (Existing Data)

### Pending Ideas Section

Replace basic list with cards:

```tsx
<section className="mb-8">
  <h2 className="mb-4 text-lg font-semibold text-slate-50">Pending Ideas</h2>
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {ideas.pending.map(idea => (
      <PendingIdeaCard key={idea.id} idea={idea} />
    ))}
  </div>
  {ideas.pending.length === 0 && (
    <div className="card text-center py-12">
      <p className="text-slate-400">No pending ideas.</p>
    </div>
  )}
</section>
```

### Pending Idea Card

```tsx
function PendingIdeaCard({ idea }: { idea: Idea }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove() {
    setIsSubmitting(true);
    try {
      await fetch("/api/ideas/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, note })
      });
      // Trigger refresh (via parent component callback)
    } catch (error) {
      console.error("Failed to approve idea:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    setIsSubmitting(true);
    try {
      await fetch("/api/ideas/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, note })
      });
      // Trigger refresh
    } catch (error) {
      console.error("Failed to reject idea:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      {/* Header: Stars + Tier */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Star Rating */}
          {idea.stars && (
            <div className="flex">
              {Array.from({ length: idea.stars }).map((_, i) => (
                <span key={i} className="text-yellow-400">⭐</span>
              ))}
            </div>
          )}
          {/* Tier Badge */}
          {idea.tier && (
            <span className={clsx(
              "rounded px-2 py-0.5 text-xs font-semibold",
              idea.tier === 1 && "bg-green-500/20 text-green-300",
              idea.tier === 2 && "bg-yellow-500/20 text-yellow-300",
              idea.tier === 3 && "bg-orange-500/20 text-orange-300"
            )}>
              Tier {idea.tier}
            </span>
          )}
        </div>
      </div>
      
      {/* Name + One-liner */}
      <h3 className="text-base font-semibold text-slate-50 mb-2">
        {idea.name}
      </h3>
      {idea.one_liner && (
        <p className="text-sm text-slate-300 mb-3">
          {idea.one_liner}
        </p>
      )}
      
      {/* ROI + Complexity */}
      <div className="flex gap-4 text-xs text-slate-400 mb-3">
        {idea.roi_potential && (
          <div>
            <span className="font-medium">ROI:</span> {idea.roi_potential}
          </div>
        )}
        {idea.complexity && (
          <div>
            <span className="font-medium">Complexity:</span> {idea.complexity}
          </div>
        )}
      </div>
      
      {/* Expandable Details */}
      {(idea.feedback_loop || idea.capital_required) && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mb-3 text-xs text-blue-400 hover:text-blue-300"
          >
            {isExpanded ? "Hide Details ▲" : "See Details ▼"}
          </button>
          
          {isExpanded && (
            <div className="mb-3 space-y-2 rounded bg-white/5 p-3 text-xs text-slate-300">
              {idea.feedback_loop && (
                <div>
                  <span className="font-medium text-slate-400">Feedback Loop:</span> {idea.feedback_loop}
                </div>
              )}
              {idea.capital_required && (
                <div>
                  <span className="font-medium text-slate-400">Capital Required:</span> {idea.capital_required}
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Optional Note Input */}
      <input
        type="text"
        placeholder="Optional note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-3 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
      />
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="flex-1 rounded bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Approve"}
        </button>
        <button
          onClick={handleReject}
          disabled={isSubmitting}
          className="flex-1 rounded border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
```

---

### Approved Ideas Section

Show active projects with progress:

```tsx
<section className="mb-8">
  <h2 className="mb-4 text-lg font-semibold text-slate-50">Approved Ideas</h2>
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
    {ideas.approved.map(idea => (
      <div key={idea.id} className="card">
        {/* Name */}
        <h3 className="text-base font-semibold text-slate-50 mb-2">
          {idea.name}
        </h3>
        
        {/* Status */}
        {idea.status && (
          <span className="inline-block rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300 mb-3">
            {idea.status}
          </span>
        )}
        
        {/* Progress */}
        {idea.week && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-1">
              Week {idea.week}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div 
                className="h-full bg-green-500"
                style={{ width: `${Math.min((idea.week / 15) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Next Milestone */}
        {idea.next_milestone && (
          <p className="text-xs text-slate-400">
            <span className="font-medium">Next:</span> {new Date(idea.next_milestone).toLocaleDateString()}
          </p>
        )}
      </div>
    ))}
  </div>
  {ideas.approved.length === 0 && (
    <p className="text-sm text-slate-400">No approved ideas yet.</p>
  )}
</section>
```

---

## Phase 2: Add Detailed Fields (After Nova Adds Data)

**After Nova adds these fields:**
- `how_it_works`: Explanation of the engine
- `data_sources`: Array of APIs/sources
- `self_improvement`: Learning mechanics
- `first_milestone`: MVP description

### Enhanced Expanded Section

```tsx
{isExpanded && (
  <div className="mb-3 space-y-3 rounded bg-white/5 p-3 text-xs">
    {/* Existing fields */}
    ...
    
    {/* NEW: How It Works */}
    {idea.how_it_works && (
      <div>
        <p className="font-medium text-blue-300 mb-1">💡 How It Works</p>
        <p className="text-slate-300">{idea.how_it_works}</p>
      </div>
    )}
    
    {/* NEW: Data Sources */}
    {idea.data_sources && idea.data_sources.length > 0 && (
      <div>
        <p className="font-medium text-slate-400 mb-1">📊 Data Sources</p>
        <ul className="list-disc list-inside text-slate-300 space-y-0.5">
          {idea.data_sources.map((source, i) => (
            <li key={i}>{source}</li>
          ))}
        </ul>
      </div>
    )}
    
    {/* NEW: Self-Improvement */}
    {idea.self_improvement && (
      <div>
        <p className="font-medium text-slate-400 mb-1">🔄 Learning Mechanics</p>
        <p className="text-slate-300">{idea.self_improvement}</p>
      </div>
    )}
    
    {/* NEW: First Milestone */}
    {idea.first_milestone && (
      <div>
        <p className="font-medium text-slate-400 mb-1">🏁 First Milestone</p>
        <p className="text-slate-300">{idea.first_milestone}</p>
      </div>
    )}
  </div>
)}
```

---

## Layout

```tsx
<AppShell title="Idea Engine" active="ideas">
  {/* Summary Stats (Optional) */}
  <div className="card mb-6">
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-slate-400">Pending</p>
        <p className="text-2xl font-semibold text-yellow-300">
          {ideas.pending.length}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Approved</p>
        <p className="text-2xl font-semibold text-green-300">
          {ideas.approved.length}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Rejected</p>
        <p className="text-2xl font-semibold text-red-300">
          {ideas.rejected.length}
        </p>
      </div>
    </div>
  </div>
  
  {/* Pending Ideas */}
  <PendingIdeasSection />
  
  {/* Approved Ideas */}
  <ApprovedIdeasSection />
  
  {/* Rejected Ideas (Collapsed by default) */}
  {ideas.rejected.length > 0 && (
    <details className="mt-8">
      <summary className="cursor-pointer text-lg font-semibold text-slate-50 mb-4">
        Rejected Ideas ({ideas.rejected.length})
      </summary>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ideas.rejected.map(idea => (
          <div key={idea.id} className="card opacity-50">
            <h3 className="text-base font-medium text-slate-50">{idea.name}</h3>
            {idea.rejection_date && (
              <p className="text-xs text-slate-400 mt-1">
                Rejected: {new Date(idea.rejection_date).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  )}
</AppShell>
```

---

## Implementation Steps

### Phase 1 (Now):
1. ✅ Create pending idea card component
2. ✅ Add star rating display (⭐×5)
3. ✅ Add tier badge (color-coded)
4. ✅ Add expand/collapse for basic details
5. ✅ Add approve/reject buttons with note input
6. ✅ Create approved idea cards with progress bars
7. ✅ Add summary stats card
8. ✅ Test responsive layout

### Phase 2 (After Nova adds data):
1. ⏳ Add "How It Works" section to expanded view
2. ⏳ Add data sources list
3. ⏳ Add self-improvement explanation
4. ⏳ Add first milestone description

---

## Testing Checklist

**Phase 1:**
- [ ] Star ratings display correctly
- [ ] Tier badges show correct colors
- [ ] Expand/collapse works smoothly
- [ ] Approve/reject buttons POST correctly
- [ ] Note input saves with action
- [ ] Approved ideas show progress bars
- [ ] Empty states display when no ideas
- [ ] Responsive layout works on mobile

**Phase 2:**
- [ ] Detailed fields display when available
- [ ] Data sources render as bulleted list
- [ ] All expanded sections format correctly

---

## Files to Modify

**Phase 1:**
- `src/app/ideas/page.tsx` — Add card layouts
- Create `src/components/IdeaEngine/PendingIdeaCard.tsx` (optional)
- Create `src/components/IdeaEngine/ApprovedIdeaCard.tsx` (optional)

**Phase 2:**
- Update expanded section to show detailed fields

---

**Make ideas exciting and easy to evaluate.** ✨
