// 승준 공부관리 방 — VPS 실시간 중계 + 흰둥이 똑똑 모드
//  GET  /health
//  GET  /rt?t=<ticket>&d=<device>   : 가족 기기끼리 '바뀌었어' 신호 (Server-Sent Events, 기록 내용은 안 보냄)
//  POST /rt/notify {t,d,keys}       : 이 기기에서 바뀐 키를 다른 기기에 알림
//  POST /chat {t,role,q,history,ctx,guide} : Claude로 흰둥이 답 만들기
// 티켓은 Netlify(family.mjs)가 가족 기기 토큰을 확인한 뒤 FC_LIVE_SECRET 으로 서명해 줌(24시간).
// 의존성 없음 (Node 20+)
import http from 'node:http';
import { createHmac, timingSafeEqual, createPublicKey, verify as edVerify } from 'node:crypto';
import { buildPayload, askAI, hasAI, validQuestion, organizePayload } from './shiro.mjs';
import { listDocs, addDoc, delDoc, searchDocs, searchWiki, knowledgeQ } from './rag.mjs';
const WEB = (process.env.FC_WEB_SEARCH || 'on') !== 'off';

const PORT = Number(process.env.PORT || 8093);
const SECRET = process.env.FC_LIVE_SECRET || '';
const API_KEY = hasAI(process.env);
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://future.apuda.app').split(',').map(s => s.trim()).filter(Boolean);
// 티켓 확인: ① FC_LIVE_SECRET(선택, HMAC) 또는 ② Netlify가 만든 ed25519 공개키(자동으로 가져옴 → 비밀값 필요 없음)
const KEY_URL = process.env.FC_KEY_URL || 'https://future.apuda.app/api/family';
let PUB = null;
async function loadPub() {
  try {
    const r = await fetch(KEY_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"action":"live-pub"}', signal: AbortSignal.timeout(8000) });
    const j = await r.json(); if (j && typeof j.pub === 'string' && j.pub.includes('PUBLIC KEY')) { PUB = createPublicKey(j.pub); console.log('ticket key loaded'); }
  } catch (e) { console.error('key load failed', e.message); }
}
loadPub(); setInterval(loadPub, PUB ? 3600000 : 600000);
setInterval(() => { if (!PUB) loadPub(); }, 60000);

export function verifyTicket(t, secret = SECRET, now = Date.now()) {
  const m = /^(\d{10,14})\.([a-z]{1,8})\.([a-f0-9]{64}|[a-f0-9]{128})$/.exec(String(t || ''));
  if (!m || Number(m[1]) < now || Number(m[1]) > now + 2 * 86400000) return null;
  const data = m[1] + '.' + m[2], got = Buffer.from(m[3], 'hex');
  if (got.length === 32) {
    if (!secret || secret.length < 24) return null;
    const want = createHmac('sha256', secret).update(data).digest();
    return timingSafeEqual(want, got) ? { exp: Number(m[1]), role: m[2] } : null;
  }
  try { return PUB && edVerify(null, Buffer.from(data), PUB, got) ? { exp: Number(m[1]), role: m[2] } : null; } catch { return null; }
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
  if (url.pathname === '/health') return send(res, 200, { ok: true, keyed: !!(PUB || SECRET.length >= 24), clients: clients.size, ai: !!API_KEY, docs: listDocs().length, web: WEB });

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
      let refs = searchDocs(b.q, 3, b.notes);
      if (!refs.length && WEB && knowledgeQ(b.q)) refs = await searchWiki(b.q);
      let text = await askAI(process.env, buildPayload({ role: b.role === 'parent' ? 'parent' : 'child', q: b.q, history: b.history, ctx: b.ctx, guide: b.guide, refs }));
      const src = [...new Map(refs.map(r => [r.kind + r.title, { kind: r.kind, title: r.title, url: r.url || '' }])).values()];
      if (src.length && !/📎/.test(text)) text += '\n📎 출처: ' + src.map(r => (r.kind === '위키백과' ? '위키백과 ' : '') + r.title).join(', ');
      return send(res, 200, { ok: true, text, sources: src });
    } catch (e) { return send(res, 502, { error: 'ai', status: e.status || 0 }); }
  }
  // 수업 사진·노트 정리 → 자료로도 저장(흰둥이 근거)
  if (url.pathname === '/organize' && req.method === 'POST') {
    let b; try { b = await body(req, 60000); } catch { return send(res, 400, { error: 'bad' }); }
    if (!verifyTicket(b.t)) return send(res, 401, { error: 'ticket' });
    if (!API_KEY) return send(res, 503, { error: 'no_ai' });
    const text = String(b.text || '').trim(); if (text.length < 15) return send(res, 400, { error: 'short' });
    if (limited('o', 40, 3600000)) return send(res, 429, { error: 'rate' });
    try {
      const sum = await askAI(process.env, organizePayload({ subject: b.subject, text, kind: b.kind }));
      if (b.save !== false && sum) addDoc({ title: String(b.subject || '수업') + ' ' + String(b.date || '').slice(5) + ' 수업 정리', subject: b.subject, text: sum + '\n\n[원문]\n' + text, by: 'child' });
      return send(res, 200, { ok: true, sum });
    } catch (e) { return send(res, 502, { error: 'ai' }); }
  }
  // 공부 자료 (가족 기기 티켓 필요)
  if (url.pathname === '/docs' && req.method === 'GET') {
    if (!verifyTicket(url.searchParams.get('t'))) return send(res, 401, { error: 'ticket' });
    return send(res, 200, { ok: true, docs: listDocs() });
  }
  if ((url.pathname === '/docs' || url.pathname === '/docs/del') && req.method === 'POST') {
    let b; try { b = await body(req, 900000); } catch { return send(res, 400, { error: 'bad' }); }
    if (!verifyTicket(b.t)) return send(res, 401, { error: 'ticket' });
    if (limited('d', 120, 3600000)) return send(res, 429, { error: 'rate' });
    const r = url.pathname === '/docs/del' ? delDoc(String(b.id || '')) : addDoc(b);
    return send(res, r.error ? 400 : 200, r);
  }
  send(res, 404, { error: 'not_found' });
});
server.listen(PORT, '0.0.0.0', () => console.log('live on', PORT));
