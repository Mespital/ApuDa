// 사용 통계 수집·조회. 날짜(KST)별로 합산해 Netlify Blobs "usage"에 저장한다. 내용(할 일·메모)은 받지 않는다.
// POST /api/usage  {device, page, minutes, events:[{t:'session'|'view'|'act', n}]}
// GET  /api/usage?days=30  + Authorization: Bearer <FC_ADMIN_TOKEN>
import { getStore } from '@netlify/blobs';

const NAME = /^[a-z0-9_:\-가-힣]{1,40}$/i, PAGES = ['home', 'study', 'hub', 'future', 'know-me'];
const env = k => (globalThis.Netlify?.env?.get(k) || process.env[k] || '').trim();
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
export const kst = (t = Date.now()) => { const d = new Date(t + 9 * 3600000); return { day: d.toISOString().slice(0, 10), hour: d.getUTCHours() }; };

export function merge(day, input, now = Date.now()) {
  const d = day && typeof day === 'object' ? day : {};
  const bid = typeof input.id === 'string' && /^[a-z0-9]{6,24}$/.test(input.id) ? input.id : '';
  d.ids ||= [];
  if (bid && d.ids.includes(bid)) return d;                 // 같은 묶음 중복 전송 무시
  if (bid) d.ids = [...d.ids, bid].slice(-60);
  d.sessions ||= 0; d.minutes ||= 0; d.views ||= {}; d.acts ||= {}; d.hours ||= {}; d.devices ||= {}; d.pages ||= {};
  const { hour } = kst(now);
  const min = Math.max(0, Math.min(10, Number(input.minutes) || 0));
  d.minutes = Math.round((d.minutes + min) * 2) / 2;
  if (min > 0) d.hours[hour] = Math.round(((d.hours[hour] || 0) + min) * 2) / 2;
  if (PAGES.includes(input.page) && min > 0) d.pages[input.page] = Math.round(((d.pages[input.page] || 0) + min) * 2) / 2;
  for (const e of (Array.isArray(input.events) ? input.events : []).slice(0, 80)) {
    if (!e || !NAME.test(String(e.n || ''))) continue;
    if (e.t === 'session') d.sessions = Math.min(d.sessions + 1, 500);
    else if (e.t === 'view') d.views[e.n] = Math.min((d.views[e.n] || 0) + 1, 5000);
    else if (e.t === 'act') d.acts[e.n] = Math.min((d.acts[e.n] || 0) + 1, 5000);
  }
  if (typeof input.device === 'string' && /^[a-f0-9]{16,64}$/.test(input.device)) d.devices[input.device.slice(0, 8)] = new Date(now).toISOString();
  d.last = new Date(now).toISOString();
  if (Object.keys(d.views).length > 200 || Object.keys(d.acts).length > 300) return d; // 비정상 입력 방어
  return d;
}

export default async (req) => {
  const store = getStore({ name: 'usage', consistency: 'strong' });
  if (req.method === 'POST') {
    let body; try { body = JSON.parse(await req.text()); } catch { return json({ error: 'bad_request' }, 400); }
    if (!body || typeof body !== 'object') return json({ error: 'bad_request' }, 400);
    const { day } = kst();
    const cur = await store.get('day:' + day, { type: 'json' });
    await store.setJSON('day:' + day, merge(cur, body));
    return json({ ok: true });
  }
  if (req.method === 'GET') {
    const token = env('FC_ADMIN_TOKEN');
    if (!token) return json({ error: 'not_configured' }, 503);
    if ((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') !== token) return json({ error: 'unauthorized' }, 401);
    const n = Math.max(1, Math.min(120, Number(new URL(req.url).searchParams.get('days')) || 30));
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const { day } = kst(Date.now() - i * 86400000);
      const rec = (await store.get('day:' + day, { type: 'json' })) || {}; delete rec.ids;
      out.push({ day, ...rec });
    }
    return json({ days: out });
  }
  return json({ error: 'method' }, 405);
};

export const config = { path: '/api/usage' };
