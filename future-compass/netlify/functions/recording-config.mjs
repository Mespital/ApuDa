// Only public browser credentials. Never return client secrets, refresh tokens or access tokens.
export default async () => {
  const value = key => (globalThis.Netlify?.env?.get(key) || process.env[key] || '').trim();
  const clientId = value('GOOGLE_DRIVE_CLIENT_ID'), apiKey = value('GOOGLE_DRIVE_API_KEY'), appId = value('GOOGLE_DRIVE_PROJECT_NUMBER');
  return new Response(JSON.stringify({ configured: !!(clientId && apiKey && appId), clientId, apiKey, appId }), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
};
