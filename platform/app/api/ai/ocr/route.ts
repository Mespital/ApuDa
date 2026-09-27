import { NextResponse } from "next/server";
import { forwardAIRequest } from "@/lib/ai/server";
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

  const form = new FormData();
  form.set("file", file, file.name || "lab-image");

  try {
    const upstream = await forwardAIRequest("/api/v1/ocr", {
      method: "POST",
      body: form
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" }
    });
  } catch {
    return NextResponse.json({ error: "ai_service_unavailable" }, { status: 503 });
  }
}
