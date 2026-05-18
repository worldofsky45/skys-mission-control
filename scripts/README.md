# Mission Control Scripts

These scripts are generated for review and manual installation only. They do not modify cron or launchd.

## Price Updates

Runs a CoinGecko refresh for active paper-trading assets and writes the price cache atomically.

```cron
*/15 * * * * /Users/sky/Documents/Codex/mission-control/scripts/update-prices.sh
```

## Health Check

Calls the local health endpoint and logs status to the OpenClaw workspace.

```cron
*/5 * * * * /Users/sky/Documents/Codex/mission-control/scripts/health-check.sh
```

## Daily Summary

Calls the local Mission Control APIs and writes a Markdown report into the workspace.

```cron
0 0 * * * /Users/sky/Documents/Codex/mission-control/scripts/daily-summary.sh
```

Review the script bodies before installing any schedule with `crontab -e` or launchd.

## OpenClaw Automation Loop

These scripts are the reviewed automation commands for the Phase 2 loop. They update local OpenClaw files only and never install scheduling by themselves.

```bash
/Users/sky/Documents/Codex/mission-control/scripts/openclaw/update-positions.js
/Users/sky/Documents/Codex/mission-control/scripts/openclaw/update-scorecard.js
/Users/sky/Documents/Codex/mission-control/scripts/openclaw/aggregate-daily-roi.sh
```

Preview the recommended crontab block:

```bash
/Users/sky/Documents/Codex/mission-control/scripts/openclaw/install-cron.sh
```

Install only after review:

```bash
/Users/sky/Documents/Codex/mission-control/scripts/openclaw/install-cron.sh --install
```

The cron entries run paper-trading position checks at 12:00 PM and 6:00 PM CT, scorecard updates at 11:00 PM CT, and ROI cost aggregation at 11:05 PM CT.
