import { listPolymarketSignals } from "@/lib/polymarket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await listPolymarketSignals());
  } catch (error) {
    console.error("Failed to list Polymarket signals", error);
    return Response.json({ error: "Failed to list Polymarket signals" }, { status: 500 });
  }
}
