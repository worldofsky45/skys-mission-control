import { CostsNotInitializedError, getCosts } from "@/lib/costs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getCosts());
  } catch (error) {
    if (error instanceof CostsNotInitializedError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load costs", error);
    return Response.json({ error: "Failed to load costs" }, { status: 500 });
  }
}
