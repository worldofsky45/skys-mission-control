import { ZodError } from "zod";
import { PolymarketStateError, resolvePolymarketSignal } from "@/lib/polymarket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const outcome = await resolvePolymarketSignal(await request.json());
    return Response.json({ outcome });
  } catch (error) {
    if (error instanceof PolymarketStateError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Invalid Polymarket outcome request" }, { status: 400 });
    }

    console.error("Failed to resolve Polymarket signal", error);
    return Response.json({ error: "Failed to resolve Polymarket signal" }, { status: 500 });
  }
}
