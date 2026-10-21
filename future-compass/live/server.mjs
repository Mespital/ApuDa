// 승준 공부관리 방 — VPS 실시간 중계 + 흰둥이 똑똑 모드
//  GET  /health
//  GET  /rt?t=<ticket>&d=<device>   : 가족 기기끼리 '바뀌었어' 신호 (Server-Sent Events, 기록 내용은 안 보냄)
//  POST /rt/notify {t,d,keys}       : 이 기기에서 바뀐 키를 다른 기기에 알림
//  POST /chat {t,role,q,history,ctx,guide} : Claude로 흰둥이 답 만들기
// 티켓은 Netlify(family.mjs)가 가족 기기 토큰을 확인한 뒤 FC_LIVE_SECRET 으로 서명해 줌(24시간).
// 의존성 없음 (Node 20+)
import http from 'node:http';
import { createHmac, timingSafeEqual, createPublicKey, verify as edVerify } from 'node:crypto';
import { buildPayload, askAI, hasAI, validQuestion, organizePayload, providerOf } from './shiro.mjs';
import { listDocs, addDoc, delDoc, gatherRefs } from './rag.mjs';
import { createVoice, validVoice, sttClient, rcloneClient, trashFiles } from './voice.mjs';
import { createWatch, splitSubject } from './watch.mjs';
const WEB = (process.env.FC_WEB_SEARCH || 'on') !== 'off';

const PORT = Number(process.env.PORT || 8093);
const SECRET = process.env.FC_LIVE_SECRET || '';
const API_KEY = hasAI(process.env);
const STT = sttClient(process.env.FC_STT_URL || ''), DRIVE = rcloneClient(process.env.FC_RCLONE_URL || '', process.env.FC_RCLONE_REMOTE || 'gdrive:');
const CAP = { stt: false, drive: false };
async function probe() {
  try { CAP.stt = !!(process.env.FC_STT_URL && (await fetch(process.env.FC_STT_URL.replace(/\/$/, '') + '/health', { signal: AbortSignal.timeout(4000) })).ok); } catch { CAP.stt = false; }
  CAP.drive = DRIVE ? await DRIVE.ok() : false;
}
probe(); setInterval(probe, 300000); setInterval(() => { if (!CAP.stt || !CAP.drive) probe(); }, 60000);
const VOICE = createVoice({ stt: STT, hasAI: hasAI(process.env), organize: (subject, text) => askAI(process.env, organizePayload({ subject, text, kind: 'voice' })), drive: () => DRIVE });   // 상태 확인이 잠깐 실패해도 업로드는 시도 (실패하면 단계 오류로 기록)
const WATCH = createWatch();
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
  if (url.pathname === '/health') return send(res, 200, { ok: true, keyed: !!(PUB || SECRET.length >= 24), clients: clients.size, ai: !!API_KEY, prov: providerOf(process.env), docs: listDocs().length, web: WEB, voice: { stt: CAP.stt, drive: CAP.drive, ai: !!API_KEY, queue: VOICE.pending() } });

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
      const { refs, study, ctx: studyCtx } = await gatherRefs(b.q, b.notes, { web: WEB, history: b.history });
      let text = await askAI(process.env, buildPayload({ role: b.role === 'parent' ? 'parent' : 'child', q: b.q, history: b.history, ctx: b.ctx, guide: b.guide, refs, study, studyCtx }));
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
  // 🎙️ 1분 녹음 → 받아쓰기·정리·Drive (가족 기기 티켓 필요). 시작은 바로 답하고, 결과는 GET 으로 확인
  if (url.pathname === '/voice' && req.method === 'POST') {
    let b; try { b = await body(req, 8600000); } catch { return send(res, 400, { error: 'bad' }); }
    if (!verifyTicket(b.t)) return send(res, 401, { error: 'ticket' });
    const bad = validVoice(b); if (bad) return send(res, 400, { error: bad });
    if (!VOICE.status(b.id) && (limited('v', 30, 3600000) || VOICE.pending() > 6)) return send(res, 429, { error: 'rate' });
    const r = VOICE.start(b); return send(res, r.error ? 400 : 200, r);
  }
  if (url.pathname === '/voice/del' && req.method === 'POST') {
    let b; try { b = await body(req, 20000); } catch { return send(res, 400, { error: 'bad' }); }
    const tk = verifyTicket(b.t); if (!tk) return send(res, 401, { error: 'ticket' });
    if (tk.role === 'parent') return send(res, 403, { error: 'role' });
    if (limited('vd', 60, 3600000)) return send(res, 429, { error: 'rate' });
    const r = await trashFiles(DRIVE, b.subject, b.files); return send(res, r.error ? 400 : 200, r);
  }
  if (url.pathname === '/voice' && req.method === 'GET') {
    const tk = verifyTicket(url.searchParams.get('t')); if (!tk) return send(res, 401, { error: 'ticket' });
    const r = VOICE.status(url.searchParams.get('id'));
    if (r?.source === 'watch' && tk.role !== 'child') return send(res, 403, { error: 'role' });
    return r ? send(res, 200, r) : send(res, 404, { error: 'not_found' });
  }
  // ⌚ 애플워치 단축어 → 1분 복습 (워치 키). 응답은 워치 화면에 그대로 보일 짧은 글
  if (url.pathname === '/watch/note' && req.method === 'POST') {
    const txt = (code, m) => { res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }); res.end(m); };
    let b; try { b = await body(req, 20000); } catch { return txt(400, '보낸 내용을 읽지 못했어'); }
    if (!WATCH.check(b.key)) return txt(401, '워치 키가 맞지 않아. 공부방 설정에서 다시 만들어줘');
    if (limited('w', 30, 3600000)) return txt(429, '잠깐 쉬었다가 다시 보내줘');
    let text = String(b.text || '').trim().slice(0, 1500); if (text.length < 2) return txt(400, '말한 내용이 비어 있어');
    const sp = splitSubject(text, (WATCH.subjects && WATCH.subjects()) || []);
    const at = WATCH.subjectAt(Date.now());
    let subject = String(b.subject || '').trim().slice(0, 30) || sp.subject || at.sub || '기타'; if (sp.subject) text = sp.text;
    const r = VOICE.start({ id: WATCH.newId(), subject, topic: at.p && subject === at.sub ? at.p + '교시 수업' : '워치 메모', at: new Date().toISOString(), text, textOnly: true, source: 'watch' });
    return r.error ? txt(503, '접수하지 못했어\n잠시 뒤 다시 보내줘') : txt(200, '✓ ' + subject + ' 접수\n정리·Drive 보관 중\n완료는 공부방에서 확인');
  }
  if (url.pathname.startsWith('/watch/') && req.method === 'POST') {
    let b; try { b = await body(req, 20000); } catch { return send(res, 400, { error: 'bad' }); }
    const tk = verifyTicket(b.t); if (!tk) return send(res, 401, { error: 'ticket' });
    if (tk.role === 'parent') return send(res, 403, { error: 'role' });
    if (tk.role !== 'child') return send(res, 403, { error: 'role' });
    if (url.pathname === '/watch/check') return WATCH.check(b.key) ? send(res, 200, { ok: true }) : send(res, 401, { error: 'watch_key' });
    if (url.pathname === '/watch/table') { if (!WATCH.setTable(b.table, b.periods, b.len)) return send(res, 503, { error: 'persist' }); return send(res, 200, { ok: true, key: WATCH.hasKey() }); }
    if (url.pathname === '/watch/setup') {
      if (!/^[a-f0-9]{40}$/.test(String(b.key || ''))) return send(res, 400, { error: 'bad_key' });
      if (!WATCH.setTable(b.table, b.periods, b.len) || !WATCH.setKey(b.key)) return send(res, 503, { error: 'persist' });
      return send(res, 200, { ok: true });
    }
    if (url.pathname === '/watch/off') { if (!WATCH.clearKey()) return send(res, 503, { error: 'persist' }); return send(res, 200, { ok: true }); }
    if (url.pathname === '/watch/ack') {
      const available = new Set(VOICE.list('watch').filter((j) => j.state === 'done' && j.result?.transcript).map((j) => j.id));
      const ids = (Array.isArray(b.ids) ? b.ids.slice(0, 50) : []).filter((id) => available.has(id));
      if (!WATCH.ack(ids)) return send(res, 503, { error: 'persist' });
      return send(res, 200, { ok: true });
    }
    if (url.pathname === '/watch/retry') {
      if (limited('wr', 20, 3600000)) return send(res, 429, { error: 'rate' });
      const result = VOICE.retry(b.id, 'watch');
      if (result.error) return send(res, result.error === 'not_found' ? 404 : result.error === 'persist' ? 503 : 409, result);
      if (!WATCH.unack(b.id)) return send(res, 503, { error: 'persist' });
      return send(res, 200, result);
    }
  }
  if (url.pathname === '/watch/inbox' && req.method === 'GET') {
    const tk = verifyTicket(url.searchParams.get('t')); if (!tk) return send(res, 401, { error: 'ticket' });
    if (tk.role !== 'child') return send(res, 403, { error: 'role' });
    const jobs = VOICE.list('watch');
    // Deliver completed notes first so legacy interrupted jobs cannot block later imports.
    const available = jobs.filter((j) => ['done', 'interrupted'].includes(j.state) && !WATCH.acked(j.id)).sort((a, b) => Number(a.state === 'interrupted') - Number(b.state === 'interrupted'));
    const items = available.slice(0, 20).map((j) => ({ id: j.id, at: j.at, subject: j.subject, topic: j.topic, state: j.state, outcome: VOICE.status(j.id).outcome, resultAt: j.result?.at || j.createdAt, transcript: j.result?.transcript || j.input?.text || '', summary: j.result?.summary || '', files: j.result?.files || [], errors: j.errors }));
    return send(res, 200, { ok: true, key: WATCH.hasKey(), pending: jobs.filter((j) => ['queued', 'working'].includes(j.state)).length, more: available.length > items.length, items });
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
