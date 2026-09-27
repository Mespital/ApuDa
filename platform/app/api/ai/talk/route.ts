import { NextResponse } from "next/server";
import { generateTalkAnswer, type TalkContext } from "@/lib/ai/talk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const profileId = payload?.profileId;
  const question = typeof payload?.question === "string" ? payload.question.trim() : "";

  if (typeof profileId !== "string" || !question) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (question.length > 1500) {
    return NextResponse.json({ error: "question_too_long" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const externalProviderEnabled =
    (process.env.AI_PROVIDER ?? "mock") === "openai" &&
    Boolean(process.env.OPENAI_API_KEY) &&
    Boolean(process.env.OPENAI_MODEL);

  if (externalProviderEnabled) {
    const { data: consent } = await supabase
      .from("consents")
      .select("granted")
      .eq("profile_id", profileId)
      .eq("consent_type", "external_ai_processing")
      .order("granted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!consent?.granted) {
      return NextResponse.json({ error: "external_ai_consent_required" }, { status: 403 });
    }
  }

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const [conditions, treatments, medications, labs, symptoms, appointment, biomarkers, imaging] =
    await Promise.all([
      supabase
        .from("conditions")
        .select("name,diagnosed_on")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .limit(10),
      supabase
        .from("treatments")
        .select("name,cycle_label,treatment_type")
        .eq("profile_id", profileId)
        .order("started_on", { ascending: false })
        .limit(5),
      supabase
        .from("medications")
        .select("name,dose_text,frequency_text")
        .eq("profile_id", profileId)
        .eq("active", true)
        .limit(20),
      supabase
        .from("labs")
        .select("test_name,value_numeric,value_text,unit,measured_at")
        .eq("profile_id", profileId)
        .order("measured_at", { ascending: false })
        .limit(15),
      supabase
        .from("symptom_logs")
        .select("symptom_name,severity,recorded_at")
        .eq("profile_id", profileId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: false })
        .limit(30),
      supabase
        .from("appointments")
        .select("title,scheduled_at,department")
        .eq("profile_id", profileId)
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(1),
      supabase
        .from("biomarkers")
        .select("name,result_text,result_numeric,unit,tested_on")
        .eq("profile_id", profileId)
        .order("tested_on", { ascending: false, nullsFirst: false })
        .limit(10),
      supabase
        .from("imaging")
        .select("modality,body_part,study_date,summary,response_category")
        .eq("profile_id", profileId)
        .order("study_date", { ascending: false })
        .limit(5)
    ]);

  const context: TalkContext = {
    conditions: conditions.data ?? [],
    treatments: treatments.data ?? [],
    biomarkers: biomarkers.data ?? [],
    imaging: imaging.data ?? [],
    medications: medications.data ?? [],
    labs: labs.data ?? [],
    symptoms: symptoms.data ?? [],
    next_appointment: appointment.data?.[0] ?? null
  };

  try {
    const result = await generateTalkAnswer(context, question);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({ error: "ai_generation_failed" }, { status: 502 });
  }
}
