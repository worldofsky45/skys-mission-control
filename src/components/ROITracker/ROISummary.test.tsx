import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ROISummary } from "./ROISummary";
import type { AggregatedROI } from "@/lib/types";

const roi: AggregatedROI = {
  total_invested: 1000,
  total_roi: 250,
  roi_percentage: 25,
  projects: [
    {
      timestamp: "2026-05-06T00:00:00.000Z",
      name: "Paper Trading System",
      invested: 1000,
      roi: 250,
      current_value: 1250,
      roi_pct: 25,
      status: "active",
      last_updated: "2026-05-06T00:00:00.000Z",
    },
  ],
};

describe("ROISummary", () => {
  it("renders zero-invested state", () => {
    render(<ROISummary roi={{ total_invested: 0, total_roi: 0, roi_percentage: 0, projects: [] }} />);

    expect(screen.getByText("No ROI entries yet")).toBeInTheDocument();
  });

  it("renders positive ROI and best project", () => {
    render(<ROISummary roi={roi} />);

    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getAllByText("+$250.00")).toHaveLength(2);
    expect(screen.getByText("25.0%")).toBeInTheDocument();
    expect(screen.getByText("Paper Trading System")).toBeInTheDocument();
  });

  it("filters by time and exports JSON locally", () => {
    const createObjectURL = vi.fn(() => "blob:roi");
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(<ROISummary roi={roi} />);

    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    fireEvent.click(screen.getByRole("button", { name: /export report/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });
});
