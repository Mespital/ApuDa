import { createHmac } from "node:crypto";

export function getAIServiceConfig() {
  const baseUrl = process.env.AI_API_BASE_URL;
  const apiKey = process.env.APUDA_AI_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("ApuDa AI input service is not configured.");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey
  };
}

export function getAIOwnerToken(userId: string) {
  const { apiKey } = getAIServiceConfig();

  return createHmac("sha256", apiKey)
    .update(`apuda-ai-owner:v1:${userId}`)
    .digest("hex");
}

export async function forwardAIRequest(
  path: string,
  init: RequestInit = {}
) {
  const { baseUrl, apiKey } = getAIServiceConfig();

  const headers = new Headers(init.headers);
  headers.set("X-ApuDa-AI-Key", apiKey);

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}


export async function checkAIInputService() {
  if (!process.env.AI_API_BASE_URL || !process.env.APUDA_AI_API_KEY) {
    return "not_configured" as const;
  }

  try {
    const response = await forwardAIRequest("/health", {
      method: "GET",
      signal: AbortSignal.timeout(4000)
    });
    return response.ok ? ("healthy" as const) : ("unavailable" as const);
  } catch {
    return "unavailable" as const;
  }
}
