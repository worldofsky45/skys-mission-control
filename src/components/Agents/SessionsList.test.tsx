import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionsList } from "./SessionsList";
import type { AgentSession } from "@/lib/types";

const sessions: AgentSession[] = [
  {
    id: "019e09d9-0b8c-7013-93be-a348623da13a",
    type: "subagent",
    started_at: "2026-05-08T23:10:00.000Z",
    ended_at: null,
    duration_mins: 15,
    tokens_used: 1500,
    status: "active",
    agent: "explorer",
    model: "gpt-5.2",
  },
  {
    id: "019e09cd-20b4-7cb2-af24-1996125415c1",
    type: "codex",
    started_at: "2026-05-08T20:00:00.000Z",
    ended_at: "2026-05-08T20:30:00.000Z",
    duration_mins: 30,
    tokens_used: 3000,
    status: "completed",
    agent: "Codex Desktop",
    model: "gpt-5.2",
  },
];

describe("SessionsList", () => {
  it("renders recent session metadata without transcript content", () => {
    render(<SessionsList sessions={sessions} />);

    expect(screen.getByRole("heading", { name: "Recent Sessions" })).toBeInTheDocument();
    expect(screen.getByText("019e09d9")).toBeInTheDocument();
    expect(screen.getByText("explorer")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.queryByText("sensitive transcript text")).not.toBeInTheDocument();
  });
});
