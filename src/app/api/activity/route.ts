import { ActivityValidationError, getActivity, recordActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getActivity());
  } catch (error) {
    console.error("Failed to load activity", error);
    return Response.json({ error: "Failed to load activity" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const event = await recordActivity(payload);

    return Response.json({ success: true, event });
  } catch (error) {
    if (error instanceof ActivityValidationError || error instanceof SyntaxError) {
      return Response.json({ error: "Invalid activity event" }, { status: 400 });
    }

    console.error("Failed to record activity", error);
    return Response.json({ error: "Failed to record activity" }, { status: 500 });
  }
}
