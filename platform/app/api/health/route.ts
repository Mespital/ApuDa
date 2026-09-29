import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkAIInputService } from "@/lib/ai/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ai = await checkAIInputService();
  const talkProvider = process.env.AI_PROVIDER ?? "mock";
  const externalTalkConfigured =
    talkProvider === "openai" &&
    Boolean(process.env.OPENAI_API_KEY) &&
    Boolean(process.env.OPENAI_MODEL);

  return NextResponse.json({
    status: "ok",
    supabase: isSupabaseConfigured() ? "configured" : "not_configured",
    ai,
    talk: externalTalkConfigured ? "external" : "mock"
  });
}
