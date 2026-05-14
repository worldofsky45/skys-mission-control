import { coingeckoIds, paths } from "./constants";
import { readJsonFile, writeJsonAtomic } from "./file-store";

export interface PriceResult {
  prices: Record<string, number>;
  source: "live" | "cache" | "none";
  updated_at: string | null;
}

interface PriceCache {
  prices: Record<string, number>;
  updated_at?: string;
}

export async function fetchCurrentPrices(assets: string[]): Promise<PriceResult> {
  const symbols = [...new Set(assets.map((asset) => asset.toUpperCase()))];
  const ids = symbols.map((asset) => coingeckoIds[asset]).filter(Boolean);

  if (ids.length === 0) {
    return { prices: {}, source: "none", updated_at: null };
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`,
    );

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    const data = (await response.json()) as Record<string, { usd?: number }>;
    const prices: Record<string, number> = {};

    for (const symbol of symbols) {
      const id = coingeckoIds[symbol];
      const value = id ? data[id]?.usd : undefined;
      if (typeof value === "number") {
        prices[symbol] = value;
      }
    }

    const updatedAt = new Date().toISOString();
    await writeJsonAtomic(paths.priceCache, { prices, updated_at: updatedAt });

    return { prices, source: "live", updated_at: updatedAt };
  } catch {
    return readCachedPrices();
  }
}

async function readCachedPrices(): Promise<PriceResult> {
  try {
    const cache = await readJsonFile<PriceCache>(paths.priceCache);
    return {
      prices: cache.prices ?? {},
      source: "cache",
      updated_at: cache.updated_at ?? null,
    };
  } catch {
    return { prices: {}, source: "none", updated_at: null };
  }
}
