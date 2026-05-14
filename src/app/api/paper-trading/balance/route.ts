import { getPaperBalance, PaperTradingNotInitializedError } from "@/lib/paper-trading";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getPaperBalance());
  } catch (error) {
    if (error instanceof PaperTradingNotInitializedError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load paper balance", error);
    return Response.json({ error: "Failed to load paper balance" }, { status: 500 });
  }
}
