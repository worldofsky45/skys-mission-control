import { getPaperPositions, PaperTradingNotInitializedError } from "@/lib/paper-trading";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getPaperPositions());
  } catch (error) {
    if (error instanceof PaperTradingNotInitializedError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load paper positions", error);
    return Response.json({ error: "Failed to load paper positions" }, { status: 500 });
  }
}
