import type { PolymarketSignalsResponse } from "@/lib/types";

export function firstError(...errors: Array<Error | null>): Error | null {
  return errors.find((error): error is Error => Boolean(error)) ?? null;
}

export function getCombinedWinRate(
  paperWinRate: number,
  polymarketStats?: PolymarketSignalsResponse["stats"],
) {
  const rates = [paperWinRate];

  if (polymarketStats && polymarketStats.resolved > 0) {
    rates.push(polymarketStats.accuracy);
  }

  return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
}
