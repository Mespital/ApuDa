// 학교나침반 베타 대기자 신청. 저장: Netlify Blobs(store "school-compass-waitlist").
// 조회: GET /api/waitlist + Authorization: Bearer <WAITLIST_ADMIN_TOKEN> → CSV. 토큰 미설정이면 조회 불가.
import { getStore } from '@netlify/blobs';

const ROLES = ['학부모', '학원·공부방', '교사', '기타'];
const GRADES = ['중3', '고1', '고2', '고3', '기타'];
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);

export function validate(body) {
  if (!body || typeof body !== 'object') return { error: '잘못된 요청이에요.' };
  if (body.website) return { spam: true };                       // honeypot
  const email = clean(body.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: '이메일 주소를 다시 확인해 주세요.' };
  if (body.agree !== true) return { error: '개인정보 수집·이용에 동의해 주셔야 신청할 수 있어요.' };
  if (body.adult !== true) return { error: '보호자(만 19세 이상) 또는 교육기관만 신청할 수 있어요.' };
  const role = ROLES.includes(body.role) ? body.role : '기타';
  const grade = GRADES.includes(body.grade) ? body.grade : '기타';
  return { entry: { email, role, grade, school: clean(body.school, 40), schoolCode: clean(body.schoolCode, 20), wish: clean(body.wish, 300), at: new Date().toISOString() } };
}

const reply = (body, status = 200, extra = {}) => new Response(typeof body === 'string' ? body : JSON.stringify(body), {
  status, headers: { 'content-type': typeof body === 'string' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
});

export default async (req) => {
  const store = getStore({ name: 'school-compass-waitlist', consistency: 'strong' });
  if (req.method === 'POST') {
    let body; try { body = await req.json(); } catch { return reply({ error: '잘못된 요청이에요.' }, 400); }
    const v = validate(body);
    if (v.spam) return reply({ ok: true });
    if (v.error) return reply({ error: v.error }, 400);
    const id = encodeURIComponent(v.entry.email);                // 같은 이메일은 덮어씀(중복 방지)
    await store.setJSON(id, v.entry);
    return reply({ ok: true });
  }
  if (req.method === 'GET') {
    const token = (globalThis.Netlify?.env?.get('WAITLIST_ADMIN_TOKEN') || process.env.WAITLIST_ADMIN_TOKEN || '').trim();
    const auth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token || auth !== token) return reply({ error: 'unauthorized' }, 401);
    const { blobs } = await store.list();
    const rows = [];
    for (const b of blobs) { const e = await store.get(b.key, { type: 'json' }); if (e) rows.push(e); }
    rows.sort((a, b) => a.at.localeCompare(b.at));
    const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const csv = '﻿신청일시,이메일,구분,학년,학교,학교코드,바라는 점\n' + rows.map(r => [r.at, r.email, r.role, r.grade, r.school, r.schoolCode, r.wish].map(q).join(',')).join('\n');
    return reply(csv, 200, { 'content-disposition': 'attachment; filename="school-compass-waitlist.csv"' });
  }
  return reply({ error: 'method' }, 405);
};

export const config = { path: '/api/waitlist' };
