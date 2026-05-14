# Memory Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Memory screen so Mission Control can inspect OpenClaw's central `MEMORY.md`, memory markdown files, and optional graph links.

**Architecture:** Follow the existing Costs and Health Jobs pattern: filesystem parsing lives in `src/lib/memory.ts`, `/api/memory` is a dynamic Node route, and the client page polls through `useAutoRefresh`. The UI is read-only and does not mutate OpenClaw memory files.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Vitest, React Testing Library, Tailwind.

**Approval:** Sky approved this next slice on 2026-05-08 with: "Great plan the next tasks, get it approved and execute it".

---

### Task 1: Memory Loader And API

**Files:**
- Create: `src/lib/memory.ts`
- Create: `src/lib/memory.test.ts`
- Create: `src/app/api/memory/route.ts`
- Create: `src/app/api/memory/memory-route.test.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/schemas.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Write failing loader and route tests**

Create fixtures with `MEMORY.md`, two `memory/*.md` files, and optional `graph-links.json`. Assert section extraction, file metadata, stats, graph links, and 503 when `MEMORY.md` is missing.

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/lib/memory.test.ts src/app/api/memory/memory-route.test.ts`

Expected: FAIL because `src/lib/memory.ts` and `/api/memory/route.ts` do not exist.

- [ ] **Step 3: Implement minimal loader and route**

Read `MEMORY.md`, list `memory/*.md`, parse optional graph links, compute `total_files`, `total_size_kb`, and `last_consolidated`, then return `Response.json(await getMemory())`.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/lib/memory.test.ts src/app/api/memory/memory-route.test.ts`

Expected: PASS.

### Task 2: Memory Page UI

**Files:**
- Create: `src/app/memory/page.tsx`
- Create: `src/components/pages/MemoryPage.tsx`
- Create: `src/components/Memory/MemoryViewer.tsx`
- Create: `src/components/Memory/RecentUpdates.tsx`
- Create: `src/components/Memory/GraphLinks.tsx`
- Create: `src/components/Memory/MemoryViewer.test.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Assert the Memory page renders the heading, stats, `MEMORY.md` preview, recent files, and graph links from mocked `/api/memory` data.

- [ ] **Step 2: Run failing UI tests**

Run: `npm test -- src/components/Memory/MemoryViewer.test.tsx src/app/page.test.tsx`

Expected: FAIL because the Memory page/components and nav entry do not exist.

- [ ] **Step 3: Implement page and components**

Add a Memory nav entry, `/memory` route, `MemoryPageContent`, and compact read-only cards matching existing Mission Control styling.

- [ ] **Step 4: Run focused UI tests**

Run: `npm test -- src/components/Memory/MemoryViewer.test.tsx src/app/page.test.tsx`

Expected: PASS.

### Task 3: Verification And Handoff

**Files:**
- Modify: `docs/handoffs/OPENCLAW-PHASE1-LOG.md`

- [ ] **Step 1: Update handoff**

Record that the Memory screen slice was implemented, including files and verification commands.

- [ ] **Step 2: Run full verification**

Run:
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Expected: all pass. If the sandbox blocks Turbopack port binding during build, rerun `npm run build` outside the sandbox and record that in the final.

- [ ] **Step 3: Browser smoke**

Open `/memory` on a local server and verify visible `Memory System`, file count, `MEMORY.md`, and recent memory files.
