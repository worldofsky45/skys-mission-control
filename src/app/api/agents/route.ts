import { getAgents } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getAgents());
  } catch (error) {
    console.error("Failed to load agents", error);
    return Response.json({ error: "Failed to load agents" }, { status: 500 });
  }
}
