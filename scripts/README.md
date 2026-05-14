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
