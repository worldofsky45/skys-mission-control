"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { refresh as refreshConfig } from "@/lib/constants";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
};

type UseAutoRefreshOptions = {
  endpoint: string;
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
};

type CacheEntry = {
  timestamp: number;
  data: unknown;
};

type InflightEntry = {
  promise: Promise<unknown>;
  controller: AbortController;
};

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, InflightEntry>();

async function fetchEndpoint<T>(endpoint: string, force = false): Promise<{ data: T; fresh: boolean }> {
  const now = Date.now();
  const cached = responseCache.get(endpoint);

  if (!force && cached && now - cached.timestamp < refreshConfig.cacheMs) {
    return { data: cached.data as T, fresh: false };
  }

  const existing = inflightRequests.get(endpoint);
  if (existing) {
    return { data: (await existing.promise) as T, fresh: true };
  }

  const controller = new AbortController();
  const promise = fetch(endpoint, {
    cache: "no-store",
    signal: controller.signal,
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : `Request failed with ${response.status}`;
      throw new Error(message);
    }

    responseCache.set(endpoint, {
      timestamp: Date.now(),
      data: payload,
    });

    return payload;
  });

  inflightRequests.set(endpoint, { promise, controller });

  try {
    return { data: (await promise) as T, fresh: true };
  } finally {
    inflightRequests.delete(endpoint);
  }
}

export function useAutoRefresh<T>({
  endpoint,
  interval = refreshConfig.pollingMs,
  enabled = true,
  onError,
}: UseAutoRefreshOptions): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const dataRef = useRef<T | null>(null);
  const mounted = useRef(false);

  const load = useCallback(
    async (force = false) => {
      if (!enabled || document.hidden) {
        return;
      }

      if (!dataRef.current) {
        setLoading(true);
      }

      try {
        const result = await fetchEndpoint<T>(endpoint, force);

        if (!mounted.current) {
          return;
        }

        dataRef.current = result.data;
        setData(result.data);
        setError(null);
        setLastUpdated(new Date());
        setFailureCount(0);
      } catch (caught) {
        if (!mounted.current) {
          return;
        }

        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        const nextError = caught instanceof Error ? caught : new Error("Request failed");
        setFailureCount((count) => count + 1);
        setError(nextError);
        onError?.(nextError);
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [enabled, endpoint, onError],
  );

  const manualRefresh = useCallback(async () => {
    await load(true);
  }, [load]);

  useEffect(() => {
    mounted.current = true;

    queueMicrotask(() => {
      if (enabled) {
        void load();
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      inflightRequests.get(endpoint)?.controller.abort();
    };
  }, [enabled, endpoint, load]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const backoff = Math.min(4, Math.max(1, 2 ** failureCount));
      timeout = setTimeout(async () => {
        if (!document.hidden) {
          await load();
        }
        schedule();
      }, interval * backoff);
    };

    schedule();

    return () => {
      clearTimeout(timeout);
    };
  }, [enabled, failureCount, interval, load]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        void load();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, load]);

  return {
    data,
    loading,
    error,
    refresh: manualRefresh,
    lastUpdated,
  };
}
