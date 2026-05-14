import {
  calculatePaperTradingStats,
  loadPaperTrades,
  PaperTradingNotInitializedError,
  sortTradesNewestFirst,
} from "@/lib/paper-trading";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trades = await loadPaperTrades();

    return Response.json({
      trades: sortTradesNewestFirst(trades),
      stats: calculatePaperTradingStats(trades),
    });
  } catch (error) {
    if (error instanceof PaperTradingNotInitializedError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load paper trades", error);
    return Response.json({ error: "Failed to load paper trades" }, { status: 500 });
  }
}
