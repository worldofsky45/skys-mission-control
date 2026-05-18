"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AggregatedROI } from "@/lib/types";
import { formatCurrency, formatPercent } from "../format";

type Range = "7d" | "30d" | "90d" | "all";

const ranges: Range[] = ["7d", "30d", "90d", "all"];

export function ROISummary({ roi }: { roi: AggregatedROI }) {
  const [range, setRange] = useState<Range>("30d");
  const filteredProjects = useMemo(() => filterProjects(roi, range), [roi, range]);
  const bestProject = [...roi.projects].sort((a, b) => b.roi_pct - a.roi_pct)[0];
  const chartData = filteredProjects.map((project) => ({
    name: project.name,
    roi: project.roi,
    roi_pct: project.roi_pct,
  }));

  function exportReport() {
    const blob = new Blob([JSON.stringify({ range, roi, projects: filteredProjects }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mission-control-roi-report.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (roi.total_invested === 0 && roi.projects.length === 0) {
    return (
      <section className="rounded-md border border-white/10 bg-white/[0.055] p-4">
        <h3 className="text-base font-semibold text-slate-50">ROI Tracker</h3>
        <p className="mt-4 rounded border border-dashed border-white/10 p-4 text-sm text-slate-400">
          No ROI entries yet
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-white/10 bg-white/[0.055] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-50">ROI Tracker</h3>
          <p className="mt-1 text-sm text-slate-400">Best project: {bestProject?.name ?? "Not reported"}</p>
        </div>
        <button
          type="button"
          onClick={exportReport}
          className="rounded border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-200"
        >
          Export report
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Invested" value={formatCurrency(roi.total_invested)} />
        <Metric label="ROI" value={formatCurrency(roi.total_roi, true)} positive={roi.total_roi >= 0} />
        <Metric label="Return" value={formatPercent(roi.roi_percentage)} positive={roi.roi_percentage >= 0} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ranges.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            className={clsx(
              "rounded border px-2.5 py-1 text-xs font-semibold",
              range === option ? "border-cyan-300/50 text-cyan-100" : "border-white/10 text-slate-300",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-4 h-52">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={64} />
              <Tooltip
                formatter={(value, name) =>
                  name === "roi" ? formatCurrency(Number(value), true) : formatPercent(Number(value))
                }
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <Bar dataKey="roi" fill="#22d3ee" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="roi_pct" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-white/10 text-sm text-slate-400">
            No projects in this range.
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {filteredProjects.map((project) => (
          <div key={project.name} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/15 p-3">
            <div>
              <p className="text-sm font-semibold text-slate-50">{project.name}</p>
              <p className="text-xs text-slate-500">{project.status}</p>
            </div>
            <p className={project.roi >= 0 ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-red-300"}>
              {formatCurrency(project.roi, true)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const tone = positive === undefined ? "text-slate-100" : positive ? "text-emerald-300" : "text-red-300";

  return (
    <div className="rounded border border-white/10 bg-black/15 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={clsx("mt-2 text-base font-semibold", tone)}>{value}</p>
    </div>
  );
}

function filterProjects(roi: AggregatedROI, range: Range) {
  if (range === "all") {
    return roi.projects;
  }

  const days = Number(range.replace("d", ""));
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return roi.projects.filter((project) => Date.parse(project.timestamp) >= cutoff);
}
