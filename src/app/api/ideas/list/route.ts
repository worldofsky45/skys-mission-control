import { listIdeas } from "@/lib/ideas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await listIdeas());
  } catch (error) {
    console.error("Failed to list ideas", error);
    return Response.json({ error: "Failed to list ideas" }, { status: 500 });
  }
}
