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
