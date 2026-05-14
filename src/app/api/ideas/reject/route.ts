import { ZodError } from "zod";
import { IdeaStateError, rejectIdea } from "@/lib/ideas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const idea = await rejectIdea(await request.json());
    return Response.json({ idea });
  } catch (error) {
    if (error instanceof IdeaStateError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Invalid reject request" }, { status: 400 });
    }

    console.error("Failed to reject idea", error);
    return Response.json({ error: "Failed to reject idea" }, { status: 500 });
  }
}
