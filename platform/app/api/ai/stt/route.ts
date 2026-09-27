import { NextResponse } from "next/server";
import { forwardAIRequest, getAIOwnerToken } from "@/lib/ai/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const incoming = await request.formData();
  const file = incoming.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const form = new FormData();
  form.set("file", file, file.name || "voice-note.webm");

  try {
    const upstream = await forwardAIRequest("/api/v1/stt", {
      method: "POST",
      headers: {
        "X-ApuDa-Owner": getAIOwnerToken(user.id)
      },
      body: form
    });

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
