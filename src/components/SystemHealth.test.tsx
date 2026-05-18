import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SystemHealth } from "./SystemHealth";
import type { HealthStatus } from "@/lib/types";

const baseHealth: HealthStatus = {
  status: "healthy",
  message: "All systems reporting",
  timestamp: "2026-05-06T12:00:00.000Z",
  checks: [
    {
      name: "Workspace",
      status: "healthy",
      last_updated: "2026-05-06T11:59:00.000Z",
      details: "Workspace exists",
    },
  ],
};

describe("SystemHealth", () => {
  it("renders healthy, warning, and critical severity classes", () => {
    const { rerender } = render(<SystemHealth health={baseHealth} onRetry={vi.fn()} />);
    expect(screen.getByText("All Systems Go")).toHaveClass("text-emerald-200");

    rerender(
      <SystemHealth
        health={{ ...baseHealth, status: "warning", message: "Some feeds stale" }}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText("Attention Needed")).toHaveClass("text-amber-200");

    rerender(
      <SystemHealth
        health={{ ...baseHealth, status: "critical", message: "Workspace unavailable" }}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText("Issues Detected")).toHaveClass("text-red-200");
  });

  it("expands health checks and exposes retry", () => {
    const onRetry = vi.fn();
    render(<SystemHealth health={baseHealth} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: /show health details/i }));
    expect(screen.getByText("Workspace exists")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
