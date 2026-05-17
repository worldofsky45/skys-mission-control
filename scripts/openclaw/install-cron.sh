#!/usr/bin/env bash
set -euo pipefail

MISSION_CONTROL_ROOT="${MISSION_CONTROL_ROOT:-/Users/sky/Documents/Codex/mission-control}"
MARKER_BEGIN="# BEGIN Mission Control OpenClaw automation"
MARKER_END="# END Mission Control OpenClaw automation"

entries="$("$MISSION_CONTROL_ROOT/scripts/openclaw/print-cron.js")"

if [[ "${1:-}" == "--install" ]]; then
  existing="$(crontab -l 2>/dev/null || true)"
  filtered="$(printf '%s\n' "$existing" | sed "/$MARKER_BEGIN/,/$MARKER_END/d")"
  {
    printf '%s\n' "$filtered"
    printf '%s\n' "$MARKER_BEGIN"
    printf '%s\n' "$entries"
    printf '%s\n' "$MARKER_END"
  } | crontab -
  printf 'Installed Mission Control OpenClaw cron entries.\n'
  exit 0
fi

printf '%s\n%s\n%s\n' "$MARKER_BEGIN" "$entries" "$MARKER_END"
printf '\nPreview only. Re-run with --install after review to update crontab.\n'
