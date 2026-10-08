// 가족 공유: 가족 비밀번호로 들어온 기기끼리 같은 기록을 쓴다.
// - setup(관리 토큰 필요): 가족 비밀번호 설정/변경 → 버전(pv) 증가, 기존 기기 토큰 무효
// - join: 가족 비밀번호 확인 → 기기 토큰 발급 (실패 10번/15분이면 15분 잠금)
// - pull / push: 키별로 더 최근(t) 값이 이긴다. 허용된 키만, 크기 제한
// 저장: Netlify Blobs "family" (secret: FAMILY 비밀번호는 scrypt 해시만 저장)
import { getStore } from '@netlify/blobs';
import { scryptSync, randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export const KEYS = ['compass-study-v1', 'compass-study-plus-v1', 'fc_academy_v1', 'fc_teachers_v1', 'fc_offdays_v1', 'fc_preview_v1',
  'fc_hub_posts', 'compass-know-me-v1', 'compass-career-lab', 'compass-career-depth', 'future-compass-v2', 'fc_school_class', 'fc_places_v1', 'fc_avatar_v1', 'fc_planner_v1', 'fc_notes_v1', 'fc_cheer_v1', 'fc_mom_v1', 'fc_kid_v1'];
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
  const cfg = (await store.get('config', { type: 'json' })) || null;
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

  if (!cfg) return json({ error: 'not_enabled' }, 404);

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

  if (b.action === 'pull') return json({ data, pv: cfg.pv });

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
