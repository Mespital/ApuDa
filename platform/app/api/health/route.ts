import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { forwardAIRequest } from "@/lib/ai/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let ai: "configured" | "healthy" | "unavailable" | "not_configured" =
    process.env.AI_API_BASE_URL && process.env.APUDA_AI_API_KEY
      ? "configured"
      : "not_configured";

  if (ai === "configured") {
    try {
      const response = await forwardAIRequest("/health", { method: "GET" });
      ai = response.ok ? "healthy" : "unavailable";
    } catch {
      ai = "unavailable";
    }
  }

  return NextResponse.json({
    status: "ok",
    supabase: isSupabaseConfigured() ? "configured" : "not_configured",
    ai
  });
}
