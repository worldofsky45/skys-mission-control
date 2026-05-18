import { getAggregatedROI } from "@/lib/roi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getAggregatedROI());
  } catch (error) {
    console.error("Failed to aggregate ROI", error);
    return Response.json({ error: "Failed to aggregate ROI" }, { status: 500 });
  }
}
