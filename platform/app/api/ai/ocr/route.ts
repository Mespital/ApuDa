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
  const profileId = incoming.get("profileId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (typeof profileId !== "string") {
    return NextResponse.json({ error: "profile_required" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const { data: consent } = await supabase
    .from("consents")
    .select("granted")
    .eq("profile_id", profileId)
    .eq("consent_type", "ai_assisted_processing")
    .eq("granted", true)
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!consent?.granted) {
    return NextResponse.json({ error: "ai_consent_required" }, { status: 403 });
  }

  const form = new FormData();
  form.set("file", file, file.name || "lab-image");

  try {
    const upstream = await forwardAIRequest("/api/v1/ocr", {
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
        "Content-Type": upstream.headers.get("content-type") ?? "application/json"
      }
    });
  } catch {
    return NextResponse.json({ error: "ai_service_unavailable" }, { status: 503 });
  }
}
