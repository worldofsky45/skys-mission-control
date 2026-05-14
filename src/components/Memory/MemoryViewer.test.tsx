import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryViewer } from "./MemoryViewer";
import type { MemoryMd } from "@/lib/types";

const memory: MemoryMd = {
  path: "MEMORY.md",
  content: "# OpenClaw Memory\n\n## Active Projects\nMission Control Dashboard\n\n## Core Principles\nShip daily.",
  last_updated: "2026-05-07T12:00:00.000Z",
  size_kb: 4.2,
  sections: ["Active Projects", "Core Principles"],
};

describe("MemoryViewer", () => {
  it("renders MEMORY.md metadata, sections, and content preview", () => {
    render(<MemoryViewer memory={memory} />);

    expect(screen.getByRole("heading", { name: "MEMORY.md" })).toBeInTheDocument();
    expect(screen.getByText("Active Projects")).toBeInTheDocument();
    expect(screen.getByText("Core Principles")).toBeInTheDocument();
    expect(screen.getByText(/Mission Control Dashboard/)).toBeInTheDocument();
  });
});
