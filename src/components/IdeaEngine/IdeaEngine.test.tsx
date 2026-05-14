import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApprovalPanel } from "./ApprovalPanel";
import { IdeaCard } from "./IdeaCard";
import { ProgressTracker } from "./ProgressTracker";
import type { Idea } from "@/lib/types";

const idea: Idea = {
  id: "idea-1",
  name: "Crypto risk journal",
  tier: 1,
  stars: 4,
  one_liner: "A daily risk log for small crypto portfolios.",
  roi_potential: "Medium",
  complexity: "Low",
  capital_required: "$0",
  feedback_loop: "Daily journaling",
};

describe("IdeaEngine components", () => {
  it("renders idea details and action buttons", () => {
    render(<IdeaCard idea={idea} onApprove={vi.fn()} onReject={vi.fn()} />);

    expect(screen.getByText("Crypto risk journal")).toBeInTheDocument();
    expect(screen.getByText("Tier 1")).toBeInTheDocument();
    expect(screen.getByText("4 stars")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve idea-1/i })).toBeInTheDocument();
  });

  it("requires confirmation before submitting an approval", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ApprovalPanel idea={idea} action="approve" onSubmit={onSubmit} onCancel={vi.fn()} />);

    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/confirm/i));
    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: "Looks practical" } });
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("idea-1", "Looks practical"));
  });

  it("shows action errors and re-enables controls", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Write-back failed"));
    render(<ApprovalPanel idea={idea} action="reject" onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByLabelText(/confirm/i));
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    expect(await screen.findByText("Write-back failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).not.toBeDisabled();
  });

  it("renders approved project progress and missing metric message", () => {
    render(
      <ProgressTracker
        ideas={[
          {
            ...idea,
            status: "active",
            week: 2,
            next_milestone: "2026-05-20T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Week 2")).toBeInTheDocument();
    expect(screen.getByText("No metrics reported by Nova yet.")).toBeInTheDocument();
  });
});
