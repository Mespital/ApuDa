// 가족 공유: 가족 비밀번호로 들어온 기기끼리 같은 기록을 쓴다.
// - setup(관리 토큰 필요): 가족 비밀번호 설정/변경 → 버전(pv) 증가, 기존 기기 토큰 무효
// - join: 가족 비밀번호 확인 → 기기 토큰 발급 (실패 10번/15분이면 15분 잠금)
// - pull / push: 키별로 더 최근(t) 값이 이긴다. 허용된 키만, 크기 제한
// 저장: Netlify Blobs "family" (secret: FAMILY 비밀번호는 scrypt 해시만 저장)
import { getStore } from '@netlify/blobs';
import { scryptSync, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { vapid, getSubs, cleanSub, cleanPrefs, sendTo } from '../lib/push-core.mjs';
import { createHmac, generateKeyPairSync, createPrivateKey, sign as edSign } from 'node:crypto';

// VPS 실시간 서버용 서명 키(ed25519): 처음 한 번 자동 생성해 Blobs에만 보관. VPS는 공개키만 가져가서 티켓을 확인한다(공유 비밀값 불필요)
async function liveKey(store) {
  let k = await store.get('live-key', { type: 'json' });
  if (!k || !k.priv) { const p = generateKeyPairSync('ed25519'); k = { pub: p.publicKey.export({ type: 'spki', format: 'pem' }), priv: p.privateKey.export({ type: 'pkcs8', format: 'pem' }) }; await store.setJSON('live-key', k); }
  return k;
}
// VPS가 살아 있는지 5분마다 확인(죽어 있으면 앱은 Netlify만으로 동작)
async function liveHealth(store, url) {
  const h = await store.get('live-health', { type: 'json' });
  if (h && h.url === url && Date.now() - h.at < 300000) return h;
  let ok = false, ai = false;
  try { const r = await fetch(url + '/health', { signal: AbortSignal.timeout(2500) }); const j = await r.json(); ok = r.ok && j.ok === true && j.keyed !== false; ai = !!j.ai; } catch {}
  const n = { url, ok, ai, at: Date.now() }; await store.setJSON('live-health', n); return n;
}
import { buildPayload, askAI, validQuestion, organizePayload } from '../../live/shiro.mjs';
import { searchDocs, searchWiki, knowledgeQ } from '../../live/rag.mjs';

export const KEYS = ['compass-study-v1', 'compass-study-plus-v1', 'fc_academy_v1', 'fc_teachers_v1', 'fc_offdays_v1', 'fc_preview_v1',
  'fc_hub_posts', 'compass-know-me-v1', 'compass-career-lab', 'compass-career-depth', 'future-compass-v2', 'fc_school_class', 'fc_places_v1', 'fc_avatar_v1', 'fc_planner_v1', 'fc_notes_v1', 'fc_cheer_v1', 'fc_mom_v1', 'fc_kid_v1', 'fc_life_v1', 'fc_av_child_v1', 'fc_av_parent_v1'];
const MAX_VALUE = 400000, MAX_TOTAL = 3000000, FAIL_LIMIT = 10, FAIL_WINDOW = 15 * 60000;
const env = k => (globalThis.Netlify?.env?.get(k) || process.env[k] || '').trim();
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const sha = s => createHash('sha256').update(s).digest('hex');
export const pinOk = p => typeof p === 'string' && /^\d{4,6}$/.test(p);
export const hashPin = (pin, salt) => scryptSync(pin + ':family', salt, 32).toString('hex');

export function mergeData(server, changes, now = Date.now()) {
  const out = { ...(server || {}) }, applied = [];
  for (const [k, c] of Object.entries(changes || {})) {
    if (!KEYS.includes(k) || !c || typeof c !== 'object') continue;
    if (typeof c.v !== 'string' || c.v.length > MAX_VALUE) continue;
    const t = Math.min(Number(c.t) || 0, now + 60000);
    if (!out[k] || t > out[k].t) { out[k] = { v: c.v, t, by: String(c.by || '').slice(0, 8) }; applied.push(k); }
  }
  return { data: out, applied };
}
const size = d => Object.values(d).reduce((n, x) => n + (x.v ? x.v.length : 0), 0);

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const store = getStore({ name: 'family', consistency: 'strong' });
  let b; try { b = JSON.parse(await req.text()); } catch { return json({ error: 'bad_request' }, 400); }
  let cfg = (await store.get('config', { type: 'json' })) || null;
  // Netlify 환경변수 FC_FAMILY_PIN 이 있으면 그 번호가 우리 가족 비밀번호 (기기 연결은 유지)
  const envPin = env('FC_FAMILY_PIN');
  if (pinOk(envPin) && (!cfg || hashPin(envPin, cfg.salt) !== cfg.hash)) {
    const salt = randomBytes(16).toString('hex');
    cfg = { ...(cfg || { pv: 1 }), salt, hash: hashPin(envPin, salt), at: new Date().toISOString(), by: 'env' };
    await store.setJSON('config', cfg);
  }
  const now = Date.now();

  if (b.action === 'status') return json({ enabled: !!cfg, pv: cfg ? cfg.pv : 0 });

  if (b.action === 'setup') {
    const token = env('FC_ADMIN_TOKEN');
    if (!token) return json({ error: 'not_configured' }, 503);
    if ((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') !== token) return json({ error: 'unauthorized' }, 401);
    if (!pinOk(b.pin)) return json({ error: 'bad_pin' }, 400);
    const salt = randomBytes(16).toString('hex');
    const next = { salt, hash: hashPin(b.pin, salt), pv: (cfg ? cfg.pv : 0) + 1, at: new Date(now).toISOString() };
    await store.setJSON('config', next);
    return json({ ok: true, pv: next.pv });
  }

  if (b.action === 'push-key') { const k = await vapid(store); return json({ key: k.publicKey }); }   // 공개키만
  if (b.action === 'live-pub') { const k = await liveKey(store); return json({ pub: k.pub }); }       // VPS 실시간 서버가 티켓 확인용으로 가져가는 공개키

  // 처음 한 번: 가족 비밀번호가 아직 없으면 첫 기기에서 바로 정한다(우리 가족 전용). 이미 있으면 거절
  if (b.action === 'init') {
    if (cfg) return json({ error: 'exists' }, 409);
    if (!pinOk(b.pin)) return json({ error: 'bad_pin' }, 400);
    const salt = randomBytes(16).toString('hex');
    const next = { salt, hash: hashPin(b.pin, salt), pv: 1, at: new Date(now).toISOString(), by: 'init' };
    await store.setJSON('config', next);
    const tok = randomBytes(24).toString('hex');
    await store.setJSON('tok:' + sha(tok), { pv: 1, device: String(b.device || '').slice(0, 8), at: new Date(now).toISOString() });
    return json({ ok: true, token: tok, pv: 1 });
  }

  if (!cfg) return json({ error: 'not_enabled' }, 404);
  const pinMatch = p => { const want = Buffer.from(cfg.hash, 'hex'), got = Buffer.from(hashPin(p, cfg.salt), 'hex'); return want.length === got.length && timingSafeEqual(want, got); };

  if (b.action === 'join') {
    const fails = ((await store.get('fails', { type: 'json' })) || []).filter(t => now - t < FAIL_WINDOW);
    if (fails.length >= FAIL_LIMIT) return json({ error: 'locked', retryMin: Math.ceil((FAIL_WINDOW - (now - fails[0])) / 60000) }, 429);
    if (!pinOk(b.pin)) return json({ error: 'bad_pin' }, 400);
    const want = Buffer.from(cfg.hash, 'hex'), got = Buffer.from(hashPin(b.pin, cfg.salt), 'hex');
    if (!(want.length === got.length && timingSafeEqual(want, got))) {
      await store.setJSON('fails', [...fails, now]);
      return json({ error: 'wrong_pin', left: FAIL_LIMIT - fails.length - 1 }, 401);
    }
    await store.setJSON('fails', []);
    const tok = randomBytes(24).toString('hex');
    await store.setJSON('tok:' + sha(tok), { pv: cfg.pv, device: String(b.device || '').slice(0, 8), at: new Date(now).toISOString() });
    return json({ ok: true, token: tok, pv: cfg.pv });
  }

  // pull / push: 기기 토큰 확인
  const rec = typeof b.token === 'string' && /^[a-f0-9]{48}$/.test(b.token) ? await store.get('tok:' + sha(b.token), { type: 'json' }) : null;
  if (!rec || rec.pv !== cfg.pv) return json({ error: 'rejoin', pv: cfg.pv }, 401);
  const data = (await store.get('data', { type: 'json' })) || {};

  // VPS 실시간 중계 티켓(24시간) + 흰둥이 똑똑 모드 사용 가능 여부
  const live = async () => {
    const url = (env('FC_LIVE_URL') || 'https://live.apuda.app').replace(/\/$/, ''), sec = env('FC_LIVE_SECRET');
    const out = { ai: !!(env('ANTHROPIC_API_KEY') || env('OPENAI_API_KEY')) };
    if (!/^https:\/\//.test(url) || env('FC_LIVE_OFF')) return out;
    const h = await liveHealth(store, url); if (!h.ok) return out;
    const exp = now + 86400000; out.url = url; out.ai = out.ai || h.ai;
    if (sec.length >= 24) out.t = exp + '.fam.' + createHmac('sha256', sec).update(exp + '.fam').digest('hex');
    else { const k = await liveKey(store); out.t = exp + '.fam.' + edSign(null, Buffer.from(exp + '.fam'), createPrivateKey(k.priv)).toString('hex'); }
    return out;
  };
  if (b.action === 'pull') return json({ data, pv: cfg.pv, live: await live() });
  if (b.action === 'live') return json({ ok: true, live: await live() });

  if (b.action === 'organize') {
    if (!env('ANTHROPIC_API_KEY') && !env('OPENAI_API_KEY')) return json({ error: 'no_ai' }, 503);
    const text = String(b.text || '').trim(); if (text.length < 15) return json({ error: 'short' }, 400);
    try { const E = k => env(k); const sum = await askAI({ ANTHROPIC_API_KEY: E('ANTHROPIC_API_KEY'), OPENAI_API_KEY: E('OPENAI_API_KEY'), FC_CHAT_PROVIDER: E('FC_CHAT_PROVIDER'), FC_CHAT_MODEL: E('FC_CHAT_MODEL'), FC_OPENAI_MODEL: E('FC_OPENAI_MODEL') }, organizePayload({ subject: b.subject, text, kind: b.kind }), 20000); return json({ ok: true, sum }); }
    catch (e) { return json({ error: 'ai' }, 502); }
  }
  // 흰둥이 똑똑 모드 (Netlify에서 바로: ANTHROPIC_API_KEY 가 Netlify 환경변수에 있을 때)
  if (b.action === 'chat') {
    if (!env('ANTHROPIC_API_KEY') && !env('OPENAI_API_KEY')) return json({ error: 'no_ai' }, 503);
    if (!validQuestion(b.q)) return json({ error: 'bad_q' }, 400);
    const log = ((await store.get('chat-rate', { type: 'json' })) || []).filter(t => now - t < 86400000);
    if (log.filter(t => now - t < 3600000).length >= 60 || log.length >= 300) return json({ error: 'rate' }, 429);
    await store.setJSON('chat-rate', [...log, now]);
    try {
      let refs = searchDocs(b.q, 3, b.notes); if (!refs.length && env('FC_WEB_SEARCH') !== 'off' && knowledgeQ(b.q)) refs = await searchWiki(b.q);
      const E = k => env(k); let text = await askAI({ ANTHROPIC_API_KEY: E('ANTHROPIC_API_KEY'), OPENAI_API_KEY: E('OPENAI_API_KEY'), FC_CHAT_PROVIDER: E('FC_CHAT_PROVIDER'), FC_CHAT_MODEL: E('FC_CHAT_MODEL'), FC_OPENAI_MODEL: E('FC_OPENAI_MODEL') }, buildPayload({ role: b.role === 'parent' ? 'parent' : 'child', q: b.q, history: b.history, ctx: b.ctx, guide: b.guide, refs }), 20000);
      if (refs.length && !/📎/.test(text)) text += '\n📎 출처: ' + [...new Set(refs.map(r => (r.kind === '위키백과' ? '위키백과 ' : '') + r.title))].join(', ');
      return json({ ok: true, text });
    } catch (e) { return json({ error: 'ai', status: e.status || 0 }, 502); }
  }

  // 가족 비밀번호 확인(어느 기기든 같은 번호) · 바꾸기(한 번 바꾸면 모든 기기에 적용, 기기 연결은 유지)
  if (b.action === 'verify' || b.action === 'change') {
    const fails = ((await store.get('fails', { type: 'json' })) || []).filter(t => now - t < FAIL_WINDOW);
    if (fails.length >= FAIL_LIMIT) return json({ error: 'locked', retryMin: Math.ceil((FAIL_WINDOW - (now - fails[0])) / 60000) }, 429);
    const check = b.action === 'verify' ? b.pin : b.old;
    if (check != null || b.action === 'verify') {
      if (!pinOk(check)) return json({ error: 'bad_pin' }, 400);
      if (!pinMatch(check)) { await store.setJSON('fails', [...fails, now]); return json({ error: 'wrong_pin', left: FAIL_LIMIT - fails.length - 1 }, 401); }
      if (fails.length) await store.setJSON('fails', []);
    }
    if (b.action === 'verify') return json({ ok: true });
    if (pinOk(envPin)) return json({ error: 'managed' }, 409);   // 번호는 Netlify 환경변수로 관리 중
    if (!pinOk(b.pin)) return json({ error: 'bad_pin' }, 400);
    const salt = randomBytes(16).toString('hex');
    await store.setJSON('config', { ...cfg, salt, hash: hashPin(b.pin, salt), at: new Date(now).toISOString(), by: 'change' });
    return json({ ok: true });
  }

  // 폰 알림(웹 푸시): 구독 저장·해제, 다른 가족에게 보내기(시간당 20회 제한), 테스트
  if (b.action === 'push-sub' || b.action === 'push-unsub' || b.action === 'push-send' || b.action === 'push-test') {
    const subs = await getSubs(store);
    if (b.action === 'push-sub') {
      const sub = cleanSub(b.sub); if (!sub) return json({ error: 'bad_sub' }, 400);
      const id = sha(sub.endpoint).slice(0, 24);
      subs[id] = { sub, role: b.role === 'parent' ? 'parent' : 'child', prefs: cleanPrefs(b.prefs), device: String(b.device || '').slice(0, 8), at: now };
      if (Object.keys(subs).length > 12) { const old = Object.entries(subs).sort((x, y) => x[1].at - y[1].at)[0]; delete subs[old[0]]; }
      await store.setJSON('push-subs', subs); return json({ ok: true });
    }
    if (b.action === 'push-unsub') { const id = sha(String(b.endpoint || '')).slice(0, 24); delete subs[id]; await store.setJSON('push-subs', subs); return json({ ok: true }); }
    if (b.action === 'push-test') { const n = await sendTo(store, 'all', { title: '🔔 알림 테스트', body: '이 폰에 알림이 잘 와요!', url: 'study.html', tag: 'test' }, null, String(b.endpoint || '')); return json({ ok: true, sent: n }); }
    const kh = new Date(now + 9 * 3600000), km = kh.getUTCHours() * 60 + kh.getUTCMinutes();
    if (km >= 22 * 60 + 30 || km < 7 * 60) return json({ ok: true, sent: 0, quiet: true });   // 밤에는 폰 알림 안 보냄(앱 안에는 보임)
    const log = ((await store.get('push-rate', { type: 'json' })) || []).filter(t => now - t < 3600000);
    if (log.length >= 20) return json({ error: 'rate' }, 429);
    await store.setJSON('push-rate', [...log, now]);
    const to = b.to === 'parent' ? 'parent' : 'child', kind = /^[a-z]{2,12}$/.test(b.kind || '') ? b.kind : 'cheer';
    const n = await sendTo(store, to, { title: String(b.title || '').slice(0, 40) || '승준 공부관리 방', body: String(b.body || '').slice(0, 120), url: /^[a-z\-]+\.html(#[a-z]+)?$/.test(b.url || '') ? b.url : 'study.html', tag: kind }, kind);
    return json({ ok: true, sent: n });
  }

  // 집중 타이머: 끝나는 시각을 맡겨두면 화면이 꺼져 있어도 timer-cron 이 그때 폰 알림을 보냄
  if (b.action === 'timer-set' || b.action === 'timer-clear') {
    const timers = (await store.get('timers', { type: 'json' })) || {};
    const dev = String(b.device || rec.device || 'x').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12) || 'x';
    for (const [k, v] of Object.entries(timers)) if (!v || v.at < now - 3600000) delete timers[k];
    if (b.action === 'timer-clear') delete timers[dev];
    else {
      const at = Number(b.at);
      if (!(at > now - 5000 && at < now + 3 * 3600000)) return json({ error: 'bad_time' }, 400);
      const ep = typeof b.endpoint === 'string' && /^https:\/\//.test(b.endpoint) && b.endpoint.length < 1000 ? b.endpoint : '';
      timers[dev] = { at, ep, title: String(b.title || '⏱ 집중 끝!').slice(0, 40), body: String(b.body || '').slice(0, 120), set: now };
      if (Object.keys(timers).length > 6) { const old = Object.entries(timers).sort((x, y) => x[1].set - y[1].set)[0]; delete timers[old[0]]; }
    }
    await store.setJSON('timers', timers); return json({ ok: true });
  }

  // 수업 노트 사진: 가족 기기끼리 같이 보기 (기기 토큰 필요)
  if (b.action === 'photo-put' || b.action === 'photo-get') {
    if (typeof b.id !== 'string' || !/^[a-z0-9]{8,40}$/.test(b.id)) return json({ error: 'bad_id' }, 400);
    if (b.action === 'photo-get') { const v = await store.get('photo:' + b.id); return v ? json({ ok: true, data: v }) : json({ error: 'not_found' }, 404); }
    if (typeof b.data !== 'string' || !/^data:image\/(jpeg|webp|png);base64,/.test(b.data) || b.data.length > 900000) return json({ error: 'bad_photo' }, 400);
    await store.set('photo:' + b.id, b.data);
    return json({ ok: true });
  }

  if (b.action === 'push') {
    const m = mergeData(data, b.changes, now);
    if (size(m.data) > MAX_TOTAL) return json({ error: 'too_large' }, 413);
    if (m.applied.length) await store.setJSON('data', m.data);
    return json({ ok: true, applied: m.applied, pv: cfg.pv });
  }
  return json({ error: 'bad_request' }, 400);
};

export const config = { path: '/api/family' };
