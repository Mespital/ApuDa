import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const [
    conditions,
    treatments,
    medications,
    labs,
    symptoms,
    appointments,
    consents,
    visitQuestions,
    biomarkers
  ] = await Promise.all([
    supabase.from("conditions").select("*").eq("profile_id", profileId),
    supabase.from("treatments").select("*").eq("profile_id", profileId),
    supabase.from("medications").select("*").eq("profile_id", profileId),
    supabase.from("labs").select("*").eq("profile_id", profileId),
    supabase.from("symptom_logs").select("*").eq("profile_id", profileId),
    supabase.from("appointments").select("*").eq("profile_id", profileId),
    supabase.from("consents").select("*").eq("profile_id", profileId),
    supabase.from("visit_questions").select("*").eq("profile_id", profileId),
    supabase.from("biomarkers").select("*").eq("profile_id", profileId)
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    service: "ApuDa Health OS",
    profile,
    conditions: conditions.data ?? [],
    treatments: treatments.data ?? [],
    medications: medications.data ?? [],
    labs: labs.data ?? [],
    symptom_logs: symptoms.data ?? [],
    appointments: appointments.data ?? [],
    consents: consents.data ?? [],
    visit_questions: visitQuestions.data ?? [],
    biomarkers: biomarkers.data ?? []
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="apuda-profile-${profileId}.json"`,
      "Cache-Control": "no-store"
    }
  });
}
