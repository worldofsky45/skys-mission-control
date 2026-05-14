import type {
  AggregatedROI,
  ActivityResponse,
  AgentsResponse,
  CostsResponse,
  HealthStatus,
  Idea,
  IdeasResponse,
  PaperBalanceResponse,
  PaperPositionsResponse,
  PaperTradesResponse,
  ArbitrageMonitorResponse,
  PolymarketOutcome,
  PolymarketSignalsResponse,
} from "./types";

export type PolymarketOutcomeRequest = {
  signal_id: string;
  outcome: "won" | "lost";
  actual_odds: number;
  settled_date?: string;
};

async function getJson<T>(endpoint: string): Promise<T> {
  return requestJson<T>(endpoint, {
    cache: "no-store",
  });
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  return requestJson<T>(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function requestJson<T>(endpoint: string, init: RequestInit): Promise<T> {
  const response = await fetch(endpoint, init);
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

  return payload as T;
}

export function getPaperBalance(): Promise<PaperBalanceResponse> {
  return getJson("/api/paper-trading/balance");
}

export function getPaperTrades(): Promise<PaperTradesResponse> {
  return getJson("/api/paper-trading/trades");
}

export function getPaperPositions(): Promise<PaperPositionsResponse> {
  return getJson("/api/paper-trading/positions");
}

export function getPolymarketSignals(): Promise<PolymarketSignalsResponse> {
  return getJson("/api/polymarket/signals");
}

export function getPolymarketArbitrage(): Promise<ArbitrageMonitorResponse> {
  return getJson("/api/polymarket/arbitrage");
}

export function getIdeas(): Promise<IdeasResponse> {
  return getJson("/api/ideas/list");
}

export function approveIdea(id: string, note = ""): Promise<{ idea: Idea }> {
  return postJson("/api/ideas/approve", { id, note });
}

export function rejectIdea(id: string, note = ""): Promise<{ idea: Idea }> {
  return postJson("/api/ideas/reject", { id, note });
}

export function resolvePolymarketSignal(
  request: PolymarketOutcomeRequest,
): Promise<{ outcome: PolymarketOutcome }> {
  return postJson("/api/polymarket/outcomes", request);
}

export function getROI(): Promise<AggregatedROI> {
  return getJson("/api/roi");
}

export function getCosts(): Promise<CostsResponse> {
  return getJson("/api/costs");
}

export function getActivity(): Promise<ActivityResponse> {
  return getJson("/api/activity");
}

export function getAgents(): Promise<AgentsResponse> {
  return getJson("/api/agents");
}

export function getHealth(): Promise<HealthStatus> {
  return getJson("/api/health");
}
