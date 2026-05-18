#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${WORKSPACE_PATH:-/Users/sky/.openclaw/workspace}"
LOG_FILE="$WORKSPACE/logs/health-check.log"
URL="${MISSION_CONTROL_HEALTH_URL:-http://localhost:3000/api/health}"

mkdir -p "$(dirname "$LOG_FILE")"

payload="$(curl --fail --silent --show-error "$URL")"
status="$(printf '%s' "$payload" | node -e 'let input=""; process.stdin.on("data", d => input += d); process.stdin.on("end", () => { const json = JSON.parse(input); console.log(json.status || "unknown"); });')"
message="$(printf '%s' "$payload" | node -e 'let input=""; process.stdin.on("data", d => input += d); process.stdin.on("end", () => { const json = JSON.parse(input); console.log(json.message || ""); });')"

printf '%s status=%s message=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$status" "$message" >> "$LOG_FILE"

if [[ "$status" == "warning" || "$status" == "critical" ]]; then
  printf 'Mission Control health %s: %s\n' "$status" "$message"
fi
