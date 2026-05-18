import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HealthJobs } from "./HealthJobs";
import type { JobsResponse } from "@/lib/types";

const jobs: JobsResponse = {
  summary: {
    total_jobs: 2,
    healthy_jobs: 1,
    warning_jobs: 1,
    monthly_cost: 24.9,
    recent_runs: 2,
    last_run_at: "2026-05-07T08:05:00-05:00",
  },
  jobs: [
    {
      id: "crypto-intel-brief",
      name: "Crypto Intel Daily Brief",
      schedule: "Daily 7:00 AM CT",
      description: "Market analysis + trade signals",
      cost_per_run: 0.45,
      runs_per_month: 30,
      monthly_cost: 13.5,
      last_run: "2026-05-07T07:04:00-05:00",
      next_run: "2026-05-08T07:00:00-05:00",
      status: "success",
      latest_run: {
        timestamp: "2026-05-07T07:04:00-05:00",
        job_id: "crypto-intel-brief",
        status: "success",
        duration_seconds: 154,
        cost: 0.45,
        output_summary: "3 signals generated",
      },
    },
    {
      id: "polymarket-intel-brief",
      name: "Polymarket Intel Brief",
      schedule: "Daily 8:00 AM CT",
      description: "Prediction market signals",
      cost_per_run: 0.38,
      runs_per_month: 30,
      monthly_cost: 11.4,
      last_run: "2026-05-07T08:05:00-05:00",
      next_run: "2026-05-08T08:00:00-05:00",
      status: "warning",
      latest_run: null,
    },
  ],
  recent_runs: [
    {
      timestamp: "2026-05-07T08:05:00-05:00",
      job_id: "polymarket-intel-brief",
      status: "failed",
      duration_seconds: 12,
      cost: 0,
      output_summary: "Missing market cache",
    },
    {
      timestamp: "2026-05-07T07:04:00-05:00",
      job_id: "crypto-intel-brief",
      status: "success",
      duration_seconds: 154,
      cost: 0.45,
      output_summary: "3 signals generated",
    },
  ],
  last_updated: "2026-05-07T08:05:00-05:00",
};

describe("HealthJobs", () => {
  it("summarizes job schedule health and latest run details", () => {
    render(<HealthJobs jobs={jobs} loading={false} />);

    expect(screen.getByRole("heading", { name: "Automation Jobs" })).toBeInTheDocument();
    expect(screen.getByText("$24.90")).toBeInTheDocument();
    expect(screen.getByText("Crypto Intel Daily Brief")).toBeInTheDocument();
    expect(screen.getAllByText("3 signals generated")).toHaveLength(2);
    expect(screen.getByText("Polymarket Intel Brief")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent Runs" })).toBeInTheDocument();
    expect(screen.getByText("polymarket-intel-brief")).toBeInTheDocument();
    expect(screen.getByText("Missing market cache")).toBeInTheDocument();
  });
});
