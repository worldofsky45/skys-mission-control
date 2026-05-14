#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${WORKSPACE_PATH:-/Users/sky/.openclaw/workspace}"
TRADES_FILE="${PAPER_TRADING_TRADES_PATH:-$WORKSPACE/crypto-intel/paper-trading/trades.jsonl}"
CACHE_FILE="${PRICE_CACHE_PATH:-$WORKSPACE/crypto-intel/cache/prices-cache.json}"
LOG_FILE="$WORKSPACE/logs/price-updates.log"
COINGECKO_URL="https://api.coingecko.com/api/v3/simple/price"

mkdir -p "$(dirname "$CACHE_FILE")" "$(dirname "$LOG_FILE")"

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" >> "$LOG_FILE"
}

if [[ ! -f "$TRADES_FILE" ]]; then
  log "trades file missing: $TRADES_FILE"
  exit 0
fi

ASSETS="$(awk -F'"' '/"status"[[:space:]]*:[[:space:]]*"active"/ { for (i=1; i<=NF; i++) if ($i == "asset") print $(i+2) }' "$TRADES_FILE" | tr '[:lower:]' '[:upper:]' | sort -u | paste -sd, -)"

if [[ -z "$ASSETS" ]]; then
  log "no active assets found"
  exit 0
fi

ids=""
IFS=',' read -r -a asset_list <<< "$ASSETS"
for asset in "${asset_list[@]}"; do
  case "$asset" in
    BTC) id="bitcoin" ;;
    ETH) id="ethereum" ;;
    SOL) id="solana" ;;
    XRP) id="ripple" ;;
    TON) id="the-open-network" ;;
    PENGU) id="pudgy-penguins" ;;
    ZEC) id="zcash" ;;
    *) id="" ;;
  esac

  if [[ -n "$id" ]]; then
    ids="${ids:+$ids,}$id"
  fi
done

if [[ -z "$ids" ]]; then
  log "active assets not mapped for CoinGecko: $ASSETS"
  exit 0
fi

tmp_file="$CACHE_FILE.tmp-$$-$(date +%s)"
query="$COINGECKO_URL?ids=$ids&vs_currencies=usd"

for attempt in 1 2 3; do
  if curl --fail --silent --show-error "$query" -o "$tmp_file"; then
    mv "$tmp_file" "$CACHE_FILE"
    log "updated cache for assets=$ASSETS"
    exit 0
  fi

  log "price update attempt $attempt failed for assets=$ASSETS"
  sleep 2
done

rm -f "$tmp_file"
log "price update failed after 3 attempts; existing cache left in place"
exit 1
