import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const profileId = body?.profileId;

  if (typeof profileId !== "string") {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("apuda_active_profile", profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}
