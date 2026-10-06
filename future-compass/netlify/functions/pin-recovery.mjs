// 비밀번호(PIN) 복구: 보호자 메일로 6자리 코드를 보내고 확인한다. 공부 기록은 서버로 오지 않는다.
// 환경변수(Netlify): RESEND_API_KEY(필수), RECOVERY_EMAIL(필수, 받는 보호자 메일),
//   RECOVERY_FROM(선택, 기본 onboarding@resend.dev → Resend 가입 메일로만 발송 가능), RECOVERY_SECRET(선택)
import { getStore } from '@netlify/blobs';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

const CODE_TTL = 15 * 60 * 1000, MAX_TRIES = 5, MAX_SENDS_HOUR = 3, MAX_SENDS_DAY = 8;
const env = k => (globalThis.Netlify?.env?.get(k) || process.env[k] || '').trim();
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const sha = s => createHash('sha256').update(s).digest('hex');
export const maskEmail = e => { const [u, d] = String(e).split('@'); return d ? u.slice(0, 2) + '***@' + d : ''; };
export const validDevice = d => typeof d === 'string' && /^[a-f0-9]{16,64}$/.test(d);

export function codeHash(secret, device, code) { return sha(secret + '|' + device + '|' + code); }
export function allowSend(times, now) {
  const recent = times.filter(t => now - t < 86400000);
  if (recent.filter(t => now - t < 3600000).length >= MAX_SENDS_HOUR) return { ok: false, recent, why: 'hour' };
  if (recent.length >= MAX_SENDS_DAY) return { ok: false, recent, why: 'day' };
  return { ok: true, recent };
}

async function sendMail({ key, from, to, code, ua }) {
  const when = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const text = `미래 나침반 비밀번호 복구 코드: ${code}\n\n15분 안에 비밀번호 화면에 입력하면 새 비밀번호를 정할 수 있어요. 공부 기록은 그대로 남아요.\n요청 시각: ${when}\n기기: ${ua}\n\n직접 요청한 게 아니라면 이 메일은 무시해도 됩니다.`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `[미래 나침반] 비밀번호 복구 코드 ${code}`, text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error('mail ' + r.status);
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const key = env('RESEND_API_KEY'), to = env('RECOVERY_EMAIL');
  if (!key || !to) return json({ error: 'not_configured' }, 503);
  const secret = env('RECOVERY_SECRET') || key;
  let body; try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  if (!validDevice(body.device)) return json({ error: 'bad_request' }, 400);
  const store = getStore({ name: 'pin-recovery', consistency: 'strong' });
  const now = Date.now();

  if (body.action === 'send') {
    const log = (await store.get('sends', { type: 'json' })) || [];
    const a = allowSend(Array.isArray(log) ? log : [], now);
    if (!a.ok) return json({ error: a.why === 'hour' ? 'too_many_hour' : 'too_many_day' }, 429);
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    await store.setJSON('code:' + body.device, { hash: codeHash(secret, body.device, code), exp: now + CODE_TTL, tries: 0 });
    await store.setJSON('sends', [...a.recent, now]);
    const ua = String(req.headers.get('user-agent') || '').replace(/[\r\n]/g, ' ').slice(0, 120);
    try { await sendMail({ key, from: env('RECOVERY_FROM') || 'Future Compass <onboarding@resend.dev>', to, code, ua }); }
    catch (e) { await store.delete('code:' + body.device); return json({ error: 'mail_failed' }, 502); }
    return json({ ok: true, to: maskEmail(to), minutes: CODE_TTL / 60000 });
  }

  if (body.action === 'verify') {
    const code = String(body.code || '');
    if (!/^\d{6}$/.test(code)) return json({ error: 'bad_code' }, 400);
    const rec = await store.get('code:' + body.device, { type: 'json' });
    if (!rec || rec.exp < now) return json({ error: 'expired' }, 400);
    if (rec.tries >= MAX_TRIES) { await store.delete('code:' + body.device); return json({ error: 'locked' }, 429); }
    const want = Buffer.from(rec.hash, 'hex'), got = Buffer.from(codeHash(secret, body.device, code), 'hex');
    if (want.length === got.length && timingSafeEqual(want, got)) { await store.delete('code:' + body.device); return json({ ok: true }); }
    await store.setJSON('code:' + body.device, { ...rec, tries: rec.tries + 1 });
    return json({ error: 'wrong_code', left: MAX_TRIES - rec.tries - 1 }, 400);
  }
  return json({ error: 'bad_request' }, 400);
};

export const config = { path: '/api/pin-recovery' };
