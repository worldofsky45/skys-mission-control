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
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5 lg:min-w-[640px]">
          <Metric label="Jobs" value={formatNumber(jobs.summary.total_jobs)} />
          <Metric label="Healthy" value={formatNumber(jobs.summary.healthy_jobs)} tone="text-emerald-200" />
          <Metric label="Attention" value={formatNumber(jobs.summary.warning_jobs)} tone="text-amber-200" />
          <Metric label="Monthly Cost" value={formatCurrency(jobs.summary.monthly_cost)} />
          <Metric label="Last Run" value={formatDate(jobs.summary.last_run_at)} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {jobs.jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      <RecentRuns runs={jobs.recent_runs} />
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

function RecentRuns({ runs }: { runs: JobsResponse["recent_runs"] }) {
  return (
    <div className="mt-5 rounded-md border border-white/10 bg-black/15 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">Recent Runs</h3>
          <p className="text-xs text-slate-500">Latest automation ledger entries from job-runs.jsonl.</p>
        </div>
        <span className="text-xs text-slate-500">{formatNumber(runs.length)} shown</span>
      </div>

      {runs.length === 0 ? (
        <p className="mt-3 rounded border border-white/10 bg-white/[0.035] p-3 text-xs text-slate-500">
          No automation runs logged yet.
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {runs.slice(0, 5).map((run) => (
            <RunRow key={`${run.job_id}-${run.timestamp}`} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

function RunRow({ run }: { run: JobsResponse["recent_runs"][number] }) {
  const normalizedStatus = run.status.toLowerCase();
  const tone = statusTone[normalizedStatus as keyof typeof statusTone] ?? "border-white/10 text-slate-200";

  return (
    <article className="rounded border border-white/10 bg-white/[0.035] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{run.job_id}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(run.timestamp)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={clsx("rounded border px-2 py-1 font-semibold capitalize", tone)}>{run.status}</span>
          {typeof run.duration_seconds === "number" ? (
            <span className="rounded border border-white/10 px-2 py-1 text-slate-400">{run.duration_seconds}s</span>
          ) : null}
          {typeof run.cost === "number" ? (
            <span className="rounded border border-white/10 px-2 py-1 text-slate-400">{formatCurrency(run.cost)}</span>
          ) : null}
        </div>
      </div>
      {run.output_summary ? <p className="mt-2 text-sm text-slate-300">{run.output_summary}</p> : null}
    </article>
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
