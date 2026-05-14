import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoRefresh } from "./useAutoRefresh";

async function flushUpdates() {
  await act(async () => {
    await Promise.resolve();
  });
}

function Harness({
  endpoint,
  interval = 30_000,
  enabled = true,
  onError,
}: {
  endpoint: string;
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}) {
  const state = useAutoRefresh<{ value: string }>({
    endpoint,
    interval,
    enabled,
    onError,
  });

  return (
    <div>
      <p>{state.loading ? "loading" : "settled"}</p>
      <p>{state.data?.value ?? "none"}</p>
      <p>{state.error?.message ?? "no-error"}</p>
      <button type="button" onClick={() => void state.refresh()}>
        refresh
      </button>
    </div>
  );
}

describe("useAutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ value: "initial" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fetches immediately and then polls on the configured interval", async () => {
    render(<Harness endpoint="/api/demo" interval={30_000} />);

    await flushUpdates();
    expect(screen.getByText("initial")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ value: "next" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(screen.getByText("next")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("pauses polling while the tab is hidden", async () => {
    render(<Harness endpoint="/api/hidden" interval={30_000} />);

    await flushUpdates();
    expect(screen.getByText("initial")).toBeInTheDocument();
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("supports manual refresh without waiting for the interval", async () => {
    render(<Harness endpoint="/api/manual" interval={30_000} />);

    await flushUpdates();
    expect(screen.getByText("initial")).toBeInTheDocument();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ value: "manual" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await act(async () => {
      screen.getByRole("button", { name: /refresh/i }).click();
    });

    expect(screen.getByText("manual")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("aborts the in-flight request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    global.fetch = vi.fn((_input, init) => {
      capturedSignal = init?.signal as AbortSignal | undefined;
      return new Promise<Response>(() => undefined);
    });

    const { unmount } = render(<Harness endpoint="/api/abort" />);

    await flushUpdates();

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("reports errors and backs off after a failed request", async () => {
    const onError = vi.fn();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<Harness endpoint="/api/error" interval={30_000} onError={onError} />);

    await flushUpdates();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
