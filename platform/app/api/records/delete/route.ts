import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const tableByEntity = {
  condition: "conditions",
  treatment: "treatments",
  medication: "medications",
  lab: "labs",
  symptom: "symptom_logs",
  appointment: "appointments",
  biomarker: "biomarkers",
  imaging: "imaging",
  visit_question: "visit_questions"
} as const;

type Entity = keyof typeof tableByEntity;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entity = body?.entity as Entity | undefined;
  const id = body?.id;

  if (!entity || !(entity in tableByEntity) || typeof id !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const table = tableByEntity[entity];
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
