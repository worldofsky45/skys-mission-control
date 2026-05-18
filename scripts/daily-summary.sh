#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${WORKSPACE_PATH:-/Users/sky/.openclaw/workspace}"
BASE_URL="${MISSION_CONTROL_URL:-http://localhost:3000}"
REPORT_DIR="$WORKSPACE/daily-reports"
REPORT_DATE="$(date '+%Y-%m-%d')"
REPORT_FILE="$REPORT_DIR/$REPORT_DATE.md"

mkdir -p "$REPORT_DIR"

fetch() {
  curl --fail --silent --show-error "$BASE_URL$1"
}

balance="$(fetch /api/paper-trading/balance)"
positions="$(fetch /api/paper-trading/positions)"
trades="$(fetch /api/paper-trading/trades)"
polymarket="$(fetch /api/polymarket/signals)"
ideas="$(fetch /api/ideas/list)"
roi="$(fetch /api/roi)"
health="$(fetch /api/health)"

node - "$REPORT_FILE" "$balance" "$positions" "$trades" "$polymarket" "$ideas" "$roi" "$health" <<'NODE'
const fs = require("node:fs");

const [reportFile, balanceRaw, positionsRaw, tradesRaw, polymarketRaw, ideasRaw, roiRaw, healthRaw] = process.argv.slice(2);
const balance = JSON.parse(balanceRaw);
const positions = JSON.parse(positionsRaw);
const trades = JSON.parse(tradesRaw);
const polymarket = JSON.parse(polymarketRaw);
const ideas = JSON.parse(ideasRaw);
const roi = JSON.parse(roiRaw);
const health = JSON.parse(healthRaw);
const today = new Date().toISOString().slice(0, 10);
const activePositions = positions.positions || [];
const resolvedSignals = (polymarket.signals || []).filter((signal) => signal.resolved);
const closedTrades = (trades.trades || []).filter((trade) => trade.status === "closed" || trade.status === "partial");

const lines = [
  `# Sky's Mission Control Daily Summary - ${today}`,
  "",
  "## Paper Trading",
  `- Daily P&L snapshot: ${balance.balance?.total_pnl ?? 0}`,
  `- Current balance: ${balance.balance?.current_balance ?? 0}`,
  `- Active paper positions: ${activePositions.length}`,
  ...activePositions.map((position) => `  - ${position.asset}: P&L ${position.unrealized_pnl}`),
  `- Closed trades tracked: ${closedTrades.length}`,
  "",
  "## Polymarket",
  `- Active signals: ${polymarket.stats?.active ?? 0}`,
  `- Resolved signals: ${resolvedSignals.length}`,
  ...resolvedSignals.map((signal) => `  - ${signal.market}: ${signal.won ? "won" : "lost"} (${signal.pnl})`),
  "",
  "## Ideas",
  `- Pending: ${ideas.counts?.pending ?? 0}`,
  `- Approved: ${ideas.counts?.approved ?? 0}`,
  `- Rejected: ${ideas.counts?.rejected ?? 0}`,
  "",
  "## ROI",
  `- Total invested: ${roi.total_invested ?? 0}`,
  `- Total ROI: ${roi.total_roi ?? 0}`,
  `- ROI percentage: ${roi.roi_percentage ?? 0}%`,
  "",
  "## Health",
  `- Status: ${health.status}`,
  `- Message: ${health.message}`,
  "",
];

fs.writeFileSync(reportFile, lines.join("\n"));
NODE

printf 'Wrote %s\n' "$REPORT_FILE"
