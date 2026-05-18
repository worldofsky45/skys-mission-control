import { getPolymarketArbitrage } from "@/lib/polymarket-arbitrage";

export async function GET() {
  try {
    return Response.json(await getPolymarketArbitrage());
  } catch (error) {
    console.error("Failed to load Polymarket arbitrage monitor", error);
    return Response.json({ error: "Failed to load Polymarket arbitrage monitor" }, { status: 500 });
  }
}
