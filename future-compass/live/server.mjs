// 승준 공부관리 방 — VPS 실시간 중계 + 흰둥이 똑똑 모드
//  GET  /health
//  GET  /rt?t=<ticket>&d=<device>   : 가족 기기끼리 '바뀌었어' 신호 (Server-Sent Events, 기록 내용은 안 보냄)
//  POST /rt/notify {t,d,keys}       : 이 기기에서 바뀐 키를 다른 기기에 알림
//  POST /chat {t,role,q,history,ctx,guide} : Claude로 흰둥이 답 만들기
// 티켓은 Netlify(family.mjs)가 가족 기기 토큰을 확인한 뒤 FC_LIVE_SECRET 으로 서명해 줌(24시간).
// 의존성 없음 (Node 20+)
import http from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { buildPayload, askClaude, validQuestion } from './shiro.mjs';

const PORT = Number(process.env.PORT || 8093);
const SECRET = process.env.FC_LIVE_SECRET || '';
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.FC_CHAT_MODEL || '';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://future.apuda.app').split(',').map(s => s.trim()).filter(Boolean);
if (!SECRET || SECRET.length < 24) { console.error('FC_LIVE_SECRET (24자 이상) 필요'); process.exit(1); }

export function verifyTicket(t, secret = SECRET, now = Date.now()) {
  const m = /^(\d{10,14})\.([a-z]{1,8})\.([a-f0-9]{64})$/.exec(String(t || ''));
  if (!m || Number(m[1]) < now) return null;
  const want = createHmac('sha256', secret).update(m[1] + '.' + m[2]).digest();
  const got = Buffer.from(m[3], 'hex');
  return want.length === got.length && timingSafeEqual(want, got) ? { exp: Number(m[1]), role: m[2] } : null;
}

const clients = new Set();
const hits = new Map();   // 간단한 속도 제한
function limited(key, max, winMs) {
  const now = Date.now(), a = (hits.get(key) || []).filter(x => now - x < winMs);
  if (a.length >= max) { hits.set(key, a); return true; }
  a.push(now); hits.set(key, a); return false;
}
function cors(req, res) {
  const o = req.headers.origin;
  if (o && ORIGINS.includes(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Max-Age', '600');
}
function send(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req, max = 20000) {
  return new Promise((ok, no) => { let n = 0, b = ''; req.on('data', c => { n += c.length; if (n > max) { no(new Error('big')); req.destroy(); } else b += c; }); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { no(new Error('json')); } }); req.on('error', no); });
}

const server = http.createServer(async (req, res) => {
  cors(req, res);
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (url.pathname === '/health') return send(res, 200, { ok: true, clients: clients.size, ai: !!API_KEY });

  if (url.pathname === '/rt' && req.method === 'GET') {
    if (!verifyTicket(url.searchParams.get('t'))) return send(res, 401, { error: 'ticket' });
    if (clients.size > 40) return send(res, 503, { error: 'busy' });
    const dev = String(url.searchParams.get('d') || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12);
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
    res.write('retry: 5000\n\n');
    const c = { res, dev }; clients.add(c);
    const hb = setInterval(() => res.write(': hb\n\n'), 25000);
    req.on('close', () => { clearInterval(hb); clients.delete(c); });
    return;
  }

  if (url.pathname === '/rt/notify' && req.method === 'POST') {
    let b; try { b = await body(req); } catch { return send(res, 400, { error: 'bad' }); }
    if (!verifyTicket(b.t)) return send(res, 401, { error: 'ticket' });
    if (limited('n', 600, 3600000)) return send(res, 429, { error: 'rate' });
    const dev = String(b.d || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12);
    const keys = (Array.isArray(b.keys) ? b.keys : []).filter(k => /^[a-z0-9_-]{2,40}$/i.test(k)).slice(0, 30);
    const msg = 'event: changed\ndata: ' + JSON.stringify({ by: dev, keys, at: Date.now() }) + '\n\n';
    let n = 0; for (const c of clients) if (c.dev !== dev) { c.res.write(msg); n++; }
    return send(res, 200, { ok: true, sent: n });
  }

  if (url.pathname === '/chat' && req.method === 'POST') {
    let b; try { b = await body(req, 30000); } catch { return send(res, 400, { error: 'bad' }); }
    const tk = verifyTicket(b.t); if (!tk) return send(res, 401, { error: 'ticket' });
    if (!API_KEY) return send(res, 503, { error: 'no_ai' });
    if (!validQuestion(b.q)) return send(res, 400, { error: 'bad_q' });
    if (limited('c', 60, 3600000) || limited('cd', 300, 86400000)) return send(res, 429, { error: 'rate' });
    try {
      const text = await askClaude({ apiKey: API_KEY, model: MODEL, payload: buildPayload({ role: b.role === 'parent' ? 'parent' : 'child', q: b.q, history: b.history, ctx: b.ctx, guide: b.guide }) });
      return send(res, 200, { ok: true, text });
    } catch (e) { return send(res, 502, { error: 'ai', status: e.status || 0 }); }
  }
  send(res, 404, { error: 'not_found' });
});
server.listen(PORT, '0.0.0.0', () => console.log('live on', PORT));
