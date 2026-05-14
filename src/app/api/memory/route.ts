import { getMemory, MemoryNotInitializedError } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getMemory());
  } catch (error) {
    if (error instanceof MemoryNotInitializedError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load memory", error);
    return Response.json({ error: "Failed to load memory" }, { status: 500 });
  }
}
