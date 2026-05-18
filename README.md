# Sky's Mission Control

Local-only Next.js control panel for Nova/OpenClaw data. The app lives at:

`/Users/sky/Documents/Codex/mission-control`

Workspace data stays in:

`/Users/sky/.openclaw/workspace`

## Setup

```bash
cd /Users/sky/Documents/Codex/mission-control
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Real-Time Strategy

Mission Control v1 uses 30-second polling. SSE is intentionally deferred until the API routes, write-back flows, and calculations are stable.

SSE can be added later after polling is stable, all API tests pass, and Nova emits reliable file-change or event notifications.

## Data Contracts

| Route | Source | Mutation |
| --- | --- | --- |
| `GET /api/paper-trading/trades` | `/Users/sky/.openclaw/workspace/crypto-intel/paper-trading/trades.jsonl` | none |
| `GET /api/paper-trading/positions` | active paper trades + price cache | none |
| `GET /api/paper-trading/balance` | paper trades, optional balance, price cache | none |
| `GET /api/polymarket/signals` | `/Users/sky/.openclaw/workspace/polymarket-signals.jsonl` | none |
| `POST /api/polymarket/outcomes` | Polymarket signals | appends outcome, scorecard, ROI JSONL |
| `GET /api/ideas/list` | `/Users/sky/.openclaw/workspace/skills/engine-ideation/ideas-state.json` | none |
| `POST /api/ideas/approve` | ideas state | atomic state update + append audit JSONL |
| `POST /api/ideas/reject` | ideas state | atomic state update + append audit JSONL |
| `GET /api/roi` | ROI JSONL + computed paper/Polymarket entries | none |
| `GET /api/costs` | `/Users/sky/.openclaw/workspace/costs.jsonl` | none |
| `GET /api/health` | workspace files, CoinGecko, disk status | none |

## Write-Back Safety

- Local-only in v1. Do not expose this app remotely without adding auth.
- Browser never reads or writes workspace files directly.
- API request bodies are schema validated with Zod.
- JSON state writes use temp-file then rename atomic writes.
- JSONL writes are append-only.
- Idea actions append to `/Users/sky/.openclaw/workspace/idea-engine-actions.jsonl`.
- Cron/launchd is never installed automatically. See `scripts/README.md`.

## API Bodies

Approve or reject an idea:

```json
{
  "id": "idea-id",
  "note": "optional operator note"
}
```

Resolve a Polymarket signal:

```json
{
  "signal_id": "signal-id",
  "outcome": "won",
  "actual_odds": 0.64,
  "settled_date": "2026-05-06T12:00:00.000Z"
}
```

`settled_date` is optional.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Local smoke check: open `http://localhost:3000` and verify hero cards, health bar, paper trading, Polymarket, Idea Engine, and ROI load real data or honest empty states.
