// 웹 푸시 공통: VAPID 키(처음 한 번 자동 생성해 Blobs에만 보관), 구독 저장, 역할별 보내기
import webpush from 'web-push';

const env = k => (globalThis.Netlify?.env?.get(k) || process.env[k] || '').trim();

export async function vapid(store) {
  let k = await store.get('vapid', { type: 'json' });
  if (!k || !k.publicKey || !k.privateKey) { k = webpush.generateVAPIDKeys(); await store.setJSON('vapid', k); }
  return k;
}
export async function getSubs(store) { return (await store.get('push-subs', { type: 'json' })) || {}; }

const okSub = s => s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.endpoint.length < 1000 && s.keys && typeof s.keys.p256dh === 'string' && typeof s.keys.auth === 'string';
export function cleanSub(s) { return okSub(s) ? { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh.slice(0, 200), auth: s.keys.auth.slice(0, 100) } } : null; }
export function cleanPrefs(p) { const o = {}; if (p && typeof p === 'object') for (const [k, v] of Object.entries(p).slice(0, 20)) if (/^[a-z]{2,12}$/.test(k)) o[k] = !!v; return o; }

/** role('child'|'parent'|'all')에게 보내기. kind 알림을 끈 기기는 건너뜀. 만료된 구독은 정리 */
export async function sendTo(store, role, payload, kind, onlyEndpoint) {
  const k = await vapid(store);
  webpush.setVapidDetails('mailto:' + (env('RECOVERY_EMAIL') || 'noreply@apuda.app'), k.publicKey, k.privateKey);
  const subs = await getSubs(store); let changed = false, sent = 0;
  for (const [id, s] of Object.entries(subs)) {
    if (onlyEndpoint ? s.sub.endpoint !== onlyEndpoint : (role !== 'all' && s.role !== role)) continue;
    if (!onlyEndpoint && kind && s.prefs && s.prefs[kind] === false) continue;
    try { await webpush.sendNotification(s.sub, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal' }); sent++; }
    catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { delete subs[id]; changed = true; } }
  }
  if (changed) await store.setJSON('push-subs', subs);
  return sent;
}

/** 같은 시각 알림 묶음: 기기마다 끈 종류는 빼고, 남은 게 1개면 그대로, 2개 이상이면 한 알림으로 */
export async function sendBundle(store, role, parts) {
  const k = await vapid(store);
  webpush.setVapidDetails('mailto:' + (env('RECOVERY_EMAIL') || 'noreply@apuda.app'), k.publicKey, k.privateKey);
  const subs = await getSubs(store); let changed = false, sent = 0;
  for (const [id, s] of Object.entries(subs)) {
    if (s.role !== role) continue;
    const ok = parts.filter((p) => !(s.prefs && s.prefs[p.kind] === false)); if (!ok.length) continue;
    const payload = ok.length === 1 ? { title: ok[0].title, body: ok[0].body, url: ok[0].url, tag: ok[0].kind }
      : { title: '🔔 알림 ' + ok.length + '개', body: ok.map((p) => p.title).join('\n').slice(0, 300), url: ok[0].url, tag: 'bundle' };
    try { await webpush.sendNotification(s.sub, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal' }); sent++; }
    catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { delete subs[id]; changed = true; } }
  }
  if (changed) await store.setJSON('push-subs', subs);
  return sent;
}
