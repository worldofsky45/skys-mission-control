import clsx from "clsx";
import type { JobWithLatestRun, JobsResponse } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "./format";

type HealthJobsProps = {
  jobs: JobsResponse | null;
  loading?: boolean;
};

const statusTone = {
  success: "border-emerald-400/30 text-emerald-200",
  healthy: "border-emerald-400/30 text-emerald-200",
  active: "border-emerald-400/30 text-emerald-200",
  warning: "border-amber-300/30 text-amber-200",
  failed: "border-red-400/30 text-red-200",
  error: "border-red-400/30 text-red-200",
};

export function HealthJobs({ jobs, loading = false }: HealthJobsProps) {
  if (!jobs) {
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
        {loading ? "Loading automation jobs..." : "Automation jobs not loaded."}
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl"
      aria-label="Automation jobs"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Automation Jobs</h2>
          <p className="mt-1 text-sm text-slate-400">
            OpenClaw schedules, run cost, and the latest recorded execution.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[520px]">
          <Metric label="Jobs" value={formatNumber(jobs.summary.total_jobs)} />
          <Metric label="Healthy" value={formatNumber(jobs.summary.healthy_jobs)} tone="text-emerald-200" />
          <Metric label="Attention" value={formatNumber(jobs.summary.warning_jobs)} tone="text-amber-200" />
          <Metric label="Monthly Cost" value={formatCurrency(jobs.summary.monthly_cost)} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {jobs.jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={clsx("mt-2 text-lg font-semibold text-slate-50", tone)}>{value}</p>
    </div>
  );
}

function JobCard({ job }: { job: JobWithLatestRun }) {
  const normalizedStatus = job.status.toLowerCase();
  const tone = statusTone[normalizedStatus as keyof typeof statusTone] ?? "border-white/10 text-slate-200";

  return (
    <article className="rounded-md border border-white/10 bg-black/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-50">{job.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{job.schedule}</p>
        </div>
        <span className={clsx("shrink-0 rounded border px-2 py-1 text-xs font-semibold capitalize", tone)}>
          {job.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300">{job.description}</p>
      <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
        <span>Run: {formatCurrency(job.cost_per_run)}</span>
        <span>Monthly: {formatCurrency(job.monthly_cost)}</span>
        <span>Next: {formatDate(job.next_run)}</span>
      </div>
      {job.latest_run ? (
        <div className="mt-3 rounded border border-white/10 bg-white/[0.035] p-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Latest run {formatDate(job.latest_run.timestamp)}</span>
            <span className="font-semibold text-slate-200">{job.latest_run.status}</span>
          </div>
          {job.latest_run.output_summary ? (
            <p className="mt-2 text-sm text-slate-300">{job.latest_run.output_summary}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 rounded border border-white/10 bg-white/[0.035] p-3 text-xs text-slate-500">
          No run logged yet.
        </p>
      )}
    </article>
  );
}
