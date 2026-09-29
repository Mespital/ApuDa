import { NextResponse } from "next/server";
import { forwardAIRequest, getAIOwnerToken } from "@/lib/ai/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { jobId } = await context.params;

  try {
    const upstream = await forwardAIRequest(
      `/api/v1/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: {
          "X-ApuDa-Owner": getAIOwnerToken(user.id)
        }
      }
    );

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json"
      }
    });
  } catch {
    return NextResponse.json(
      { error: "ai_service_unavailable" },
      { status: 503 }
    );
  }
}
