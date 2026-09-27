export function getAIInputConfig() {
  const baseUrl = process.env.AI_API_BASE_URL;
  const apiKey = process.env.AI_INPUT_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("ApuDa AI Input API is not configured.");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey
  };
}
