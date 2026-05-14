import { getJobs, JobsNotInitializedError } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getJobs());
  } catch (error) {
    if (error instanceof JobsNotInitializedError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to load health jobs", error);
    return Response.json({ error: "Failed to load health jobs" }, { status: 500 });
  }
}
