"use client";

import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { HealthJobs } from "@/components/HealthJobs";
import { SystemHealth } from "@/components/SystemHealth";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { HealthStatus, JobsResponse } from "@/lib/types";

export function HealthPageContent() {
  const healthState = useAutoRefresh<HealthStatus>({ endpoint: "/api/health" });
  const jobsState = useAutoRefresh<JobsResponse>({ endpoint: "/api/health/jobs" });
  const refresh = () => {
    void healthState.refresh();
    void jobsState.refresh();
  };

  return (
    <AppShell
      active="health"
      title="System Health"
      description="Use this page to check workspace files, automation jobs, data freshness, CoinGecko access, and disk state."
      onRefresh={refresh}
    >
      <ErrorPanel title="Health feed error" error={healthState.error} onRetry={healthState.refresh} />
      <ErrorPanel title="Jobs feed error" error={jobsState.error} onRetry={jobsState.refresh} />
      <div className="space-y-5">
        <SystemHealth health={healthState.data} loading={healthState.loading} onRetry={healthState.refresh} />
        <HealthJobs jobs={jobsState.data} loading={jobsState.loading} />
      </div>
    </AppShell>
  );
}
