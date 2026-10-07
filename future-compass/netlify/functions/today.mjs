// '오늘 한눈에' 보호자 보기. 아이 기기가 오늘 요약을 올리고(POST), 보호자는 토큰으로 읽는다(GET).
// 저장: Netlify Blobs "today" — latest + 날짜별(최근 것만 덮어씀). 메모·복습 노트 내용은 클라이언트에서 보내지 않는다.
import { getStore } from '@netlify/blobs';

const env = k => (globalThis.Netlify?.env?.get(k) || process.env[k] || '').trim();
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const MAX = 40000;

export function validSnapshot(b) {
  if (!b || typeof b !== 'object') return null;
  const d = b.data;
  if (!d || typeof d !== 'object' || d.v !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) return null;
  for (const k of ['periods', 'academies', 'events', 'deadlines', 'academyHw', 'review', 'redo', 'tasks']) if (!Array.isArray(d[k]) || d[k].length > 40) return null;
  if (!d.prep || !Array.isArray(d.prep.items) || d.prep.items.length > 20) return null;
  return d;
}

export default async (req) => {
  const store = getStore({ name: 'today', consistency: 'strong' });
  if (req.method === 'POST') {
    const raw = await req.text();
    if (raw.length > MAX) return json({ error: 'too_large' }, 413);
    let b; try { b = JSON.parse(raw); } catch { return json({ error: 'bad_request' }, 400); }
    const d = validSnapshot(b);
    if (!d) return json({ error: 'bad_request' }, 400);
    const rec = { ...d, device: typeof b.device === 'string' ? b.device.slice(0, 8) : '', received: new Date().toISOString() };
    await store.setJSON('latest', rec);
    await store.setJSON('day:' + d.date, rec);
    return json({ ok: true });
  }
  if (req.method === 'GET') {
    const token = env('FC_ADMIN_TOKEN');
    if (!token) return json({ error: 'not_configured' }, 503);
    if ((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') !== token) return json({ error: 'unauthorized' }, 401);
    const day = new URL(req.url).searchParams.get('date');
    const rec = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? await store.get('day:' + day, { type: 'json' }) : await store.get('latest', { type: 'json' });
    return json({ today: rec || null });
  }
  return json({ error: 'method' }, 405);
};

export const config = { path: '/api/today' };
