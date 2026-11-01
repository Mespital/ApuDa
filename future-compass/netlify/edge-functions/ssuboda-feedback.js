// 써보다(논술 20분 루틴) Netlify Edge Function — POST /write/api/feedback
// 환경변수: GEMINI_API_KEY(필수, Google AI Studio 키), SSUBODA_MODEL(선택, 기본 gemini-3.8-flash),
//          SSUBODA_ACCESS_CODE(선택: 설정 시 앱 접속 코드 필수), AI_PROVIDER(선택: claude로 바꾸면 ANTHROPIC_API_KEY 사용)
import { runFeedback } from "../lib/ssuboda-feedback-core.js";

const provider = () => (Netlify.env.get("AI_PROVIDER") === "claude" ? "claude" : "gemini");
const aiKey = () => (provider() === "claude" ? Netlify.env.get("ANTHROPIC_API_KEY") : Netlify.env.get("GEMINI_API_KEY"));

const seen = new Map(); // request_id → 응답 (인스턴스 단위 중복 제출 방지, best-effort)
const hits = new Map(); // ip → [timestamps]

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default async (request, context) => {
  if (request.method === "GET") return json(200, { ok: true, service: "ssuboda-feedback", ai: !!aiKey(), provider: provider(), code_required: !!Netlify.env.get("SSUBODA_ACCESS_CODE") });
  if (request.method !== "POST") return json(405, { ok: false, error: "POST만 가능해요." });

  const code = Netlify.env.get("SSUBODA_ACCESS_CODE");
  if (code && request.headers.get("x-app-code") !== code) return json(401, { ok: false, error: "접속 코드가 맞지 않아요. 설정에서 코드를 확인해 주세요.", code: "AUTH" });

  const ip = context.ip || "x";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (list.length >= 30) return json(429, { ok: false, error: "1시간 호출 한도(30회)를 넘었어요. 잠시 뒤 다시 해 주세요.", code: "RATE" });
  list.push(now); hits.set(ip, list);

  let body;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: "요청을 읽지 못했어요." }); }
  const rid = String(body.request_id || "");
  if (rid && seen.has(rid)) return json(200, seen.get(rid));

  const r = await runFeedback(body, { apiKey: aiKey(), provider: provider(), model: Netlify.env.get("SSUBODA_MODEL") || "" });
  if (r.status === 200 && rid) { seen.set(rid, r.json); if (seen.size > 500) seen.delete(seen.keys().next().value); }
  return json(r.status, r.json);
};

export const config = { path: "/write/api/feedback" };
