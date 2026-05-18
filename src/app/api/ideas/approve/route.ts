import { ZodError } from "zod";
import { approveIdea, IdeaStateError } from "@/lib/ideas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const idea = await approveIdea(await request.json());
    return Response.json({ idea });
  } catch (error) {
    if (error instanceof IdeaStateError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Invalid approve request" }, { status: 400 });
    }

    console.error("Failed to approve idea", error);
    return Response.json({ error: "Failed to approve idea" }, { status: 500 });
  }
}
