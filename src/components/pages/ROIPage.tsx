"use client";

import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { ROISummary } from "@/components/ROITracker/ROISummary";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { AggregatedROI } from "@/lib/types";

const emptyROI: AggregatedROI = {
  total_invested: 0,
  total_roi: 0,
  roi_percentage: 0,
  projects: [],
};

export function ROIPageContent() {
  const roiState = useAutoRefresh<AggregatedROI>({ endpoint: "/api/roi" });

  return (
    <AppShell
      active="roi"
      title="ROI"
      description="Use this page to compare project returns and export a local ROI report."
      onRefresh={roiState.refresh}
    >
      <ErrorPanel title="ROI error" error={roiState.error} onRetry={roiState.refresh} />
      <ROISummary roi={roiState.data ?? emptyROI} />
    </AppShell>
  );
}
