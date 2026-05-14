# Agents Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Agents screen that shows recent Codex/OpenClaw session metadata, sub-agent activity, and token usage without exposing transcript contents.

**Architecture:** Follow the existing Costs, Health Jobs, and Memory pattern. `src/lib/agents.ts` reads session JSONL files and extracts only metadata/token counts, `/api/agents` returns aggregated JSON, and `/agents` renders polling UI cards and tables.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Vitest, React Testing Library, Tailwind.

**Approval:** Sky explicitly selected this next task: "Next task: build the Agents screen for session/sub-agent/token visibility."

---

### Task 1: Agents Loader And API

**Files:**
- Create: `src/lib/agents.ts`
- Create: `src/lib/agents.test.ts`
- Create: `src/app/api/agents/route.ts`
- Create: `src/app/api/agents/agents-route.test.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Write failing loader and route tests**

Create fixture Codex session JSONL files with `session_meta`, `event_msg` token counts, and `task_complete`. Assert sessions today, token totals, average duration, active/completed counts, and subagent classification.

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/lib/agents.test.ts src/app/api/agents/agents-route.test.ts`

Expected: FAIL because `src/lib/agents.ts` and `/api/agents/route.ts` do not exist.

- [ ] **Step 3: Implement minimal loader and route**

Recursively scan recent `.jsonl` files, parse JSON safely, extract metadata only, calculate stats, and return `Response.json(await getAgents())`.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/lib/agents.test.ts src/app/api/agents/agents-route.test.ts`

Expected: PASS.

### Task 2: Agents Page UI

**Files:**
- Create: `src/app/agents/page.tsx`
- Create: `src/components/pages/AgentsPage.tsx`
- Create: `src/components/Agents/SessionsList.tsx`
- Create: `src/components/Agents/TokenUsage.tsx`
- Create: `src/components/Agents/ActiveSubagents.tsx`
- Create: `src/components/Agents/SessionsList.test.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Assert the Agents page renders summary stats, current model, active subagents, and recent session rows from mocked `/api/agents` data.

- [ ] **Step 2: Run failing UI tests**

Run: `npm test -- src/components/Agents/SessionsList.test.tsx src/app/page.test.tsx`

Expected: FAIL because the Agents page/components and nav entry do not exist.

- [ ] **Step 3: Implement page and components**

Add the Agents nav entry, `/agents` route, and compact read-only UI cards matching the existing Mission Control design.

- [ ] **Step 4: Run focused UI tests**

Run: `npm test -- src/components/Agents/SessionsList.test.tsx src/app/page.test.tsx`

Expected: PASS.

### Task 3: Verification And Handoff

**Files:**
- Modify: `docs/handoffs/OPENCLAW-PHASE1-LOG.md`

- [ ] **Step 1: Update handoff**

Record the Agents screen implementation and focused verification commands.

- [ ] **Step 2: Run full verification**

Run:
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Expected: all pass. If sandbox blocks Turbopack port binding during build, rerun `npm run build` outside the sandbox and record that in the final.

- [ ] **Step 3: Browser smoke**

Open `/agents` on a local server and verify visible `Agents & Sessions`, session count, token usage, and recent session rows.
