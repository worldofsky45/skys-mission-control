import { getHealthStatus } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getHealthStatus());
  } catch (error) {
    console.error("Failed to calculate health", error);
    return Response.json({ error: "Failed to calculate health" }, { status: 500 });
  }
}
