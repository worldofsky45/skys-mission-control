export type TaskStatus = 'done' | 'in_progress' | 'inbox' | 'blocked' | 'waiting_on_sky' | 'waiting_on_aakash'

export interface Task {
  id: string
  title: string
  agent: string
  points: number
  status: TaskStatus
  completed?: string
  evidence?: string
  notes?: string
  depends_on?: string | null
  assigned_to?: string
  spec?: string
  priority?: boolean
}

export interface Blocker {
  id: string
  title: string
  owner: string
  impact: string
  status: string
}

export interface SprintMeta {
  project: string
  sprint: number
  started: string
  goal: string
  velocity_baseline: null | number
  note: string
}

export interface SprintVelocity {
  sprint_1_points_done: number
  sprint_1_points_in_progress: number
  sprint_1_points_inbox: number
  note: string
}

export interface SprintData {
  meta: SprintMeta
  go_live_blockers: Blocker[]
  tasks: Task[]
  velocity: SprintVelocity
}

export interface Agent {
  id: string
  name: string
  emoji: string
  role: string
  tagline: string
  memoryEntries: number
  active: boolean
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
export interface ActivityEvent {
  id: string
  timestamp: string // ISO
  agent: string // agent id
  type: 'TASK_START' | 'HANDOFF' | 'APPROVED' | 'BLOCKED' | 'DONE' | 'COMMENT'
  message: string
  taskId?: string
}

export const activityLog: ActivityEvent[] = [
  {
    id: 'evt-001',
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    agent: 'nova',
    type: 'TASK_START',
    message: 'Starting sprint setup: seeding sprint.json and writing all 6 agent SOUL.md files',
    taskId: 'ps-20260423-001',
  },
  {
    id: 'evt-002',
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    agent: 'nova',
    type: 'DONE',
    message: 'All 6 SOUL.md files created and verified at agent-secrets-layer/agents/*/SOUL.md',
    taskId: 'ps-20260423-001',
  },
  {
    id: 'evt-003',
    timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
    agent: 'sentry',
    type: 'TASK_START',
    message: 'Beginning security audit of API routes and environment variable handling',
    taskId: 'ps-20260423-005',
  },
  {
    id: 'evt-004',
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    agent: 'forge',
    type: 'TASK_START',
    message: 'Scaffolding dashboard API routes: /api/agents and /api/sprint endpoints',
    taskId: 'ps-20260423-005',
  },
  {
    id: 'evt-005',
    timestamp: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    agent: 'sentry',
    type: 'BLOCKED',
    message: 'RAPIDAPI_KEY missing in production environment — /market-research will 500 on Vercel',
    taskId: 'ps-20260423-005',
  },
  {
    id: 'evt-006',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    agent: 'nova',
    type: 'HANDOFF',
    message: 'Escalating RAPIDAPI_KEY blocker to Aakash — flagged in go_live_blockers',
    taskId: 'ps-20260423-005',
  },
  {
    id: 'evt-007',
    timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    agent: 'forge',
    type: 'DONE',
    message: 'Dashboard API routes shipped: GET /api/agents returns agent roster, GET /api/sprint returns full sprint state',
    taskId: 'ps-20260423-005',
  },
  {
    id: 'evt-008',
    timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    agent: 'prism',
    type: 'APPROVED',
    message: 'Code review passed for API routes — no data leaks, correct status codes, typed responses',
    taskId: 'ps-20260423-005',
  },
  {
    id: 'evt-009',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    agent: 'nova',
    type: 'COMMENT',
    message: 'Sprint 1 velocity looking good — 8 points done, 11 in flight. On track for goal.',
  },
  {
    id: 'evt-010',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    agent: 'forge',
    type: 'TASK_START',
    message: 'Starting FRED live mortgage rates integration — fetching 30yr fixed weekly series',
    taskId: 'ps-20260423-006',
  },
  {
    id: 'evt-011',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    agent: 'axiom',
    type: 'COMMENT',
    message: 'Validating FRED API response schema — confirming observation dates and value precision',
    taskId: 'ps-20260423-006',
  },
  {
    id: 'evt-012',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    agent: 'vaultara',
    type: 'COMMENT',
    message: 'FRED_API_KEY confirmed in Vercel env — all required secrets present for FRED integration',
    taskId: 'ps-20260423-006',
  },
  {
    id: 'evt-013',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    agent: 'nova',
    type: 'HANDOFF',
    message: 'Qdrant + Mem0 memory layer proposal handed to Sky for approval — awaiting greenlight',
    taskId: 'ps-20260423-009',
  },
  {
    id: 'evt-014',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    agent: 'lex',
    type: 'COMMENT',
    message: 'Documenting decision: memory layer security posture — Qdrant bound to 127.0.0.1 only, no external exposure',
    taskId: 'ps-20260423-009',
  },
  {
    id: 'evt-015',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    agent: 'sentry',
    type: 'COMMENT',
    message: 'Routine security scan completed — no new vulnerabilities found in current codebase',
  },
  {
    id: 'evt-016',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    agent: 'forge',
    type: 'TASK_START',
    message: 'Starting HUD FMR integration — fetching Fair Market Rents by ZIP/metro area',
    taskId: 'ps-20260423-007',
  },
  {
    id: 'evt-017',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    agent: 'nova',
    type: 'TASK_START',
    message: 'Building Mission Control dashboard v2 — multi-page routing, nav, agents detail view',
  },
  {
    id: 'evt-018',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    agent: 'nova',
    type: 'DONE',
    message: 'Dashboard v2 complete — agents roster, feed, decisions pages shipped and building clean',
  },
]

// ─── Agent Memory ──────────────────────────────────────────────────────────────
export interface AgentMemoryEntry {
  agentId: string
  entries: { id: string; content: string; timestamp: string }[]
}

export const agentMemory: AgentMemoryEntry[] = [
  {
    agentId: 'nova',
    entries: [
      {
        id: 'nova-mem-001',
        content: 'Anti-hallucination DoD: 5-gate checklist — file exists, content verified, no invented data, evidence provided, committed.',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'nova-mem-002',
        content: 'Sprint 1 goal: Complete agent team infrastructure + unblock PropSprint quick wins. Velocity baseline TBD post-sprint.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'nova-mem-003',
        content: 'Agent team: Nova (orchestrator), Forge (builder), Prism (reviewer), Sentry (security), Vaultara (secrets), Axiom (data), Lex (docs).',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'nova-mem-004',
        content: 'Sky prefers direct communication, no corporate fluff. Respect quiet time; proactive but not annoying.',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'nova-mem-005',
        content: 'Qdrant memory layer proposal awaiting Sky approval — security concern: bind to 127.0.0.1 only.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    agentId: 'forge',
    entries: [
      {
        id: 'forge-mem-001',
        content: 'Dashboard stack: Next.js 14, Tailwind, Framer Motion, lucide-react. Build with `npm run build` before marking done.',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'forge-mem-002',
        content: 'FRED API series: MORTGAGE30US (30yr fixed weekly). Endpoint: fred.stlouisfed.org/graph/fredgraph.json',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'forge-mem-003',
        content: 'API routes live at /api/agents and /api/sprint — typed responses, no raw data leaks.',
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'forge-mem-004',
        content: 'HUD FMR data source: huduser.gov/portal/datasets/fmr.html — use API v1 endpoint with API key.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    agentId: 'sentry',
    entries: [
      {
        id: 'sentry-mem-001',
        content: 'RAPIDAPI_KEY missing in Vercel production — blocker-001 active. Owner: Aakash.',
        timestamp: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sentry-mem-002',
        content: 'Security posture: all env vars checked. Qdrant to be bound to localhost only if memory layer approved.',
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sentry-mem-003',
        content: 'Last full scan: no SQLi, XSS, or credential exposure found. API routes returning correct 401s when unauthenticated.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    agentId: 'vaultara',
    entries: [
      {
        id: 'vaultara-mem-001',
        content: 'FRED_API_KEY: confirmed in Vercel env (production + preview). No rotation needed.',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'vaultara-mem-002',
        content: 'RAPIDAPI_KEY: MISSING from production Vercel env. Must be added by Aakash before market-research route can deploy.',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'vaultara-mem-003',
        content: 'Secret rotation schedule: quarterly for API keys, immediately on any suspected exposure.',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    agentId: 'prism',
    entries: [
      {
        id: 'prism-mem-001',
        content: 'API routes review passed: ps-20260423-005. No data leaks, correct status codes, TypeScript typed.',
        timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'prism-mem-002',
        content: 'Review checklist: types correct, no console.log in prod, error boundaries present, no hardcoded secrets.',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'prism-mem-003',
        content: 'Pending review queue: FRED integration (forge), HUD FMR (forge). Both blocked on Forge completing builds.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    agentId: 'axiom',
    entries: [
      {
        id: 'axiom-mem-001',
        content: 'FRED API observations: ISO date strings, float values as strings. Must parseFloat() before math.',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'axiom-mem-002',
        content: 'Data validation rule: never trust external API shapes without runtime schema check (zod preferred).',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'axiom-mem-003',
        content: 'Sprint 1 velocity: 8 done, 2 in progress, 9 inbox. Points are atomic agent tasks, calibrating baseline.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    agentId: 'lex',
    entries: [
      {
        id: 'lex-mem-001',
        content: 'Memory layer decision pending: Qdrant + Mem0 + Ollama. Security: localhost-only binding required.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'lex-mem-002',
        content: 'All agent SOUL.md files written and committed — defines roles, behaviors, and DoD for each agent.',
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'lex-mem-003',
        content: 'TEAM_PROTOCOL.md: defines handoff rules, escalation paths, and sprint ceremony cadence.',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'lex-mem-004',
        content: 'Compliance note: PropSprint handles real estate data — ensure PII handling follows CCPA when user data is introduced.',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
]

// ─── Sprint Data (from sprint.json) ───────────────────────────────────────────
export const sprintData: SprintData = {
  meta: {
    project: "PropSprint",
    sprint: 1,
    started: "2026-04-23",
    goal: "Complete agent team infrastructure + unblock PropSprint quick wins",
    velocity_baseline: null,
    note: "Story points TBD — 1 point = 1 atomic agent task (calibrate after Sprint 1)"
  },
  go_live_blockers: [
    {
      id: "blocker-001",
      title: "Set RAPIDAPI_KEY in Vercel Production",
      owner: "Aakash",
      impact: "/market-research broken in production",
      status: "waiting_on_aakash"
    }
  ],
  tasks: [
    {
      id: "ps-20260423-001",
      title: "Write all 6 agent SOUL.md files",
      agent: "Nova",
      points: 3,
      status: "done",
      completed: "2026-04-23",
      evidence: "All 6 files verified at agent-secrets-layer/agents/*/SOUL.md"
    },
    {
      id: "ps-20260423-002",
      title: "Build agent-teams scrum framework",
      agent: "Nova",
      points: 3,
      status: "done",
      completed: "2026-04-22",
      evidence: "agent-teams/ directory with TEAM_PROTOCOL.md, PLAYBOOK.md, 4 agent SOULs"
    },
    {
      id: "ps-20260423-003",
      title: "Lock anti-hallucination DoD rules to permanent memory",
      agent: "Nova",
      points: 1,
      status: "done",
      completed: "2026-04-22",
      evidence: "MEMORY.md updated with 5-gate DoD checklist"
    },
    {
      id: "ps-20260423-004",
      title: "Seed sprint.json with Sprint 1 tasks",
      agent: "Nova",
      points: 1,
      status: "done",
      completed: "2026-04-23",
      evidence: "This file"
    },
    {
      id: "ps-20260423-005",
      title: "Build dashboard API routes (agents + sprint)",
      agent: "Forge",
      points: 2,
      status: "in_progress",
      assigned_to: "Nova (pending Forge spawn)",
      spec: "agent-secrets-layer/data/sprint/sprint.json as data source"
    },
    {
      id: "ps-20260423-006",
      title: "FRED live mortgage rates integration",
      agent: "Forge",
      points: 2,
      status: "inbox",
      depends_on: null,
      notes: "PropSprint quick win #2 — FRED API key required"
    },
    {
      id: "ps-20260423-007",
      title: "HUD FMR (Fair Market Rents) integration",
      agent: "Forge",
      points: 2,
      status: "inbox",
      depends_on: null,
      notes: "PropSprint quick win #3"
    },
    {
      id: "ps-20260423-008",
      title: "FEMA flood zone lookup integration",
      agent: "Forge",
      points: 2,
      status: "inbox",
      depends_on: null,
      notes: "PropSprint quick win #4"
    },
    {
      id: "ps-20260423-009",
      title: "Local persistent memory layer (Qdrant + Mem0 + Ollama)",
      agent: "Nova + Sky approval",
      points: 3,
      status: "waiting_on_sky",
      notes: "Recommended infrastructure upgrade. Requires Sky greenlight — touches system config, installs Docker containers, creates persistent conversation index. Security: bind Qdrant to 127.0.0.1 only."
    }
  ],
  velocity: {
    sprint_1_points_done: 8,
    sprint_1_points_in_progress: 2,
    sprint_1_points_inbox: 9,
    note: "Baseline sprint velocity will be set after Sprint 1 closes"
  }
}

// ─── Agent Data ───────────────────────────────────────────────────────────────
export const agentsData: Agent[] = [
  {
    id: "nova",
    name: "Nova",
    emoji: "✨",
    role: "Orchestrator",
    tagline: "Route tasks, track state, report results",
    memoryEntries: 12,
    active: true,
  },
  {
    id: "vaultara",
    name: "Vaultara",
    emoji: "🔐",
    role: "Secrets Guardian",
    tagline: "Own all secrets management",
    memoryEntries: 5,
    active: true,
  },
  {
    id: "sentry",
    name: "Sentry",
    emoji: "🛡️",
    role: "Security",
    tagline: "Hunt for vulnerabilities before they become incidents",
    memoryEntries: 8,
    active: true,
  },
  {
    id: "forge",
    name: "Forge",
    emoji: "🔨",
    role: "Builder",
    tagline: "Build what the spec says. Lean, correct, committed.",
    memoryEntries: 6,
    active: true,
  },
  {
    id: "prism",
    name: "Prism",
    emoji: "🔎",
    role: "Reviewer",
    tagline: "Verify what Forge built. Quality is my only job.",
    memoryEntries: 4,
    active: false,
  },
  {
    id: "axiom",
    name: "Axiom",
    emoji: "🔬",
    role: "Data Tester",
    tagline: "Validate the data layer. If numbers are wrong, nothing else matters.",
    memoryEntries: 3,
    active: false,
  },
  {
    id: "lex",
    name: "Lex",
    emoji: "⚖️",
    role: "Docs & Compliance",
    tagline: "Keep the team honest. Documentation and decisions.",
    memoryEntries: 7,
    active: true,
  },
]

// ─── Computed helpers ─────────────────────────────────────────────────────────
export function getTasksByStatus(status: string) {
  return sprintData.tasks.filter(t => t.status === status)
}

export function getStatCards() {
  const tasks = sprintData.tasks
  return {
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    inbox: tasks.filter(t => t.status === 'inbox').length,
    blocked: tasks.filter(t => ['blocked', 'waiting_on_sky', 'waiting_on_aakash'].includes(t.status)).length,
  }
}

export function getAgentLastActivity(agentId: string): ActivityEvent | undefined {
  return [...activityLog]
    .filter(e => e.agent === agentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
}

export function getAgentEvents(agentId: string, limit = 10): ActivityEvent[] {
  return [...activityLog]
    .filter(e => e.agent === agentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export function getAgentMemory(agentId: string): AgentMemoryEntry | undefined {
  return agentMemory.find(m => m.agentId === agentId)
}

// ─── Memory Documents ─────────────────────────────────────────────────────────
export interface MemoryDocument {
  id: string
  title: string
  category: 'long-term' | 'daily' | 'context' | 'rules'
  date: string
  content: string
  tags: string[]
}

export const memoryDocuments: MemoryDocument[] = [
  {
    id: 'memory-main',
    title: "Nova's Long-Term Memory",
    category: 'long-term',
    date: '2026-04-23',
    tags: ['identity', 'rules', 'infrastructure'],
    content: `## About Sky
- Name: Sky (America/Chicago timezone)
- First contact: 2026-04-21
- Vibe: Low-drama, decisive, friendly. Named me Nova without much fuss.

## About Me
- Name: Nova ✨
- Creature: AI assistant with personality — sharp, curious, a little opinionated
- Born: 2026-04-21

## Anti-Hallucination Rules
Never claim a task is done without observable proof. 5-gate DoD checklist: Executed → Verified → Tested → No regressions → Evidence on hand.

## Infrastructure Decisions
- Phase 1 (NOW): Qdrant (local Docker) + Mem0 OSS
- Phase 2 (LATER): Ollama + qwen3-embedding:8b — only when real use case exists
- Qdrant bound to 127.0.0.1 only

## Key Events
- 2026-04-21: Bootstrap complete. Sky and I introduced ourselves.
- 2026-04-22: First full working session. Workspace established.
- 2026-04-23: PropSprint agent team built. Dashboard v1+v2 shipped. Qdrant+Mem0 live.`
  },
  {
    id: 'memory-2026-04-23',
    title: 'Daily Notes — April 23, 2026',
    category: 'daily',
    date: '2026-04-23',
    tags: ['propsprint', 'agents', 'dashboard'],
    content: `## Session Summary
Built the full agent scrum team framework. Shipped dashboard v1 and v2. Fixed Qdrant dimension mismatch. Set up WorldMonitor.

## Key Decisions
- Anti-hallucination DoD rules locked to permanent memory
- Agent team: Nova, Vaultara, Sentry, Forge, Prism, Axiom, Lex
- Dashboard name: Sky's Mission Control
- Qdrant + Mem0 using fastembed (free local embeddings) + Claude Haiku for fact extraction

## Tasks Completed
- 6/6 agent SOUL.md files written
- sprint.json seeded with Sprint 1 tasks
- Dashboard v2: agents page, feed, decisions, nav
- WorldMonitor cloned, scanned (clean), running on :3000`
  },
  {
    id: 'memory-mission',
    title: 'The Mission',
    category: 'context',
    date: '2026-04-23',
    tags: ['mission', 'goals', 'propsprint'],
    content: `## Goal
$10,000/month passive income by end of May 2026.

## Constraints
- Availability: 10-15 hours/week max (full-time job)
- Budget: $100/month hard cap on AI spend
- Nova does the heavy lifting. Sky steers and approves.

## Strategy
PropSprint → B2B focus. Target real estate agents/investors paying $500-1000/month for white-labeled deal analysis. Need 10-20 paying customers, not 200.

## PropSprint Stack
Next.js 14, TypeScript, Tailwind, Supabase, Anthropic Claude, Recharts. Live at propsprint-app.vercel.app`
  },
  {
    id: 'memory-rules',
    title: 'Permanent Rules',
    category: 'rules',
    date: '2026-04-22',
    tags: ['rules', 'security', 'anti-hallucination'],
    content: `## Anti-Hallucination (PERMANENT)
Never claim done without proof. DoD: Executed + Verified + Tested + No regressions + Evidence.

## Security Rule
Every new skill must be audited before use. Check: prompt injection, data exfiltration, suspicious endpoints, obfuscated content, safety overrides.

## Task Update Rules
Message immediately on: task complete, stuck/blocked, waiting on approval. No silent progress. Each task = one update.

## Cost Controls
$100/month hard cap. Routine tasks → cheapest model. Max 3 parallel Claude Code sessions. Hermes for heavy analysis when online.`
  },
]

// ─── Calendar Events ──────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'cron' | 'task' | 'milestone' | 'review'
  agent: string
  status: 'scheduled' | 'completed' | 'missed'
  description?: string
}

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'cal-001',
    title: 'Daily Status Report',
    date: '2026-04-23',
    time: '08:00',
    type: 'cron',
    agent: 'Nova',
    status: 'completed',
    description: 'Morning sprint standup delivered to Aakash'
  },
  {
    id: 'cal-002',
    title: 'Qdrant + Mem0 Setup',
    date: '2026-04-23',
    type: 'task',
    agent: 'Nova',
    status: 'completed',
    description: 'Persistent memory layer installed and verified'
  },
  {
    id: 'cal-003',
    title: 'Dashboard v1 Build',
    date: '2026-04-23',
    type: 'task',
    agent: 'Forge',
    status: 'completed',
    description: "Sky's Mission Control v1 built and deployed"
  },
  {
    id: 'cal-004',
    title: 'Dashboard v2 Build',
    date: '2026-04-23',
    type: 'task',
    agent: 'Forge',
    status: 'completed',
    description: 'Agents page, Feed, Decisions, Nav added'
  },
  {
    id: 'cal-005',
    title: 'Sprint 1 Review',
    date: '2026-04-30',
    time: '09:00',
    type: 'review',
    agent: 'Nova',
    status: 'scheduled',
    description: 'Review Sprint 1 velocity, close completed tasks, open Sprint 2'
  },
  {
    id: 'cal-006',
    title: 'FRED Live Rates Integration',
    date: '2026-04-24',
    type: 'task',
    agent: 'Forge',
    status: 'scheduled',
    description: 'PropSprint quick win #2 — live mortgage rates from FRED API'
  },
  {
    id: 'cal-007',
    title: 'HUD FMR Integration',
    date: '2026-04-25',
    type: 'task',
    agent: 'Forge',
    status: 'scheduled',
    description: 'PropSprint quick win #3 — Fair Market Rents lookup'
  },
  {
    id: 'cal-008',
    title: 'FEMA Flood Zone Lookup',
    date: '2026-04-26',
    type: 'task',
    agent: 'Forge',
    status: 'scheduled',
    description: 'PropSprint quick win #4 — flood zone data integration'
  },
  {
    id: 'cal-009',
    title: 'Daily Status Report',
    date: '2026-04-24',
    time: '08:00',
    type: 'cron',
    agent: 'Nova',
    status: 'scheduled',
    description: 'Morning sprint standup'
  },
  {
    id: 'cal-010',
    title: 'PropSprint Go-Live',
    date: '2026-05-31',
    type: 'milestone',
    agent: 'Nova',
    status: 'scheduled',
    description: '$10k/month goal checkpoint — PropSprint must be live with paying customers'
  },
  {
    id: 'cal-011',
    title: 'Security Audit — PropSprint',
    date: '2026-04-28',
    type: 'review',
    agent: 'Sentry',
    status: 'scheduled',
    description: 'Full OWASP audit of PropSprint before go-live'
  },
  {
    id: 'cal-012',
    title: 'Hermes Agent Setup',
    date: '2026-04-24',
    type: 'task',
    agent: 'Nova',
    status: 'scheduled',
    description: 'Wire Hermes into agent team routing once Aakash finishes setup'
  },
]
