"use client";

import { AppShell } from "@/components/AppShell";
import { ErrorPanel } from "@/components/ErrorPanel";
import { GraphLinks } from "@/components/Memory/GraphLinks";
import { MemoryViewer } from "@/components/Memory/MemoryViewer";
import { RecentUpdates } from "@/components/Memory/RecentUpdates";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { MemoryResponse } from "@/lib/types";
import { formatDate } from "../format";

export function MemoryPageContent() {
  const memoryState = useAutoRefresh<MemoryResponse>({ endpoint: "/api/memory" });

  return (
    <AppShell
      active="memory"
      title="Memory System"
      description="OpenClaw's central context hub: MEMORY.md, memory markdown files, and graph relationships."
      onRefresh={memoryState.refresh}
    >
      <ErrorPanel title="Memory feed error" error={memoryState.error} onRetry={memoryState.refresh} />

      {memoryState.data ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Memory summary">
            <SummaryCard label="Total Files" value={memoryState.data.stats.total_files.toLocaleString("en-US")} />
            <SummaryCard label="Total Size" value={`${memoryState.data.stats.total_size_kb.toFixed(1)} KB`} />
            <SummaryCard label="Last Consolidated" value={formatDate(memoryState.data.stats.last_consolidated)} />
          </section>
          <MemoryViewer memory={memoryState.data.memory_md} />
          <RecentUpdates files={memoryState.data.memory_files} />
          <GraphLinks links={memoryState.data.graph_links} />
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
          Loading memory...
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}
