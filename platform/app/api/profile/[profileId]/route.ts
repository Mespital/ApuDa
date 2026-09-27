import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { profileId } = await context.params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,display_name")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("apuda_active_profile");
  return response;
}
