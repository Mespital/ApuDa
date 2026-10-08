// 집중 타이머 끝 알림 (1분마다). 화면이 꺼져 앱이 멈춰 있어도 끝나는 시각에 폰 알림.
// 밤 시간 제한 없음(공부하다 끝난 걸 알려주는 거라). 맡겨진 타이머가 없으면 바로 끝.
import { getStore } from '@netlify/blobs';
import { sendTo } from '../lib/push-core.mjs';

export function due(timers, now) {
  const send = [], keep = {};
  for (const [k, v] of Object.entries(timers || {})) {
    if (!v || !Number.isFinite(v.at)) continue;
    if (v.at <= now + 20000) { if (v.at > now - 15 * 60000) send.push(v); }   // 15분 넘게 지난 건 버림
    else keep[k] = v;
  }
  return { send, keep };
}

export default async () => {
  const store = getStore({ name: 'family', consistency: 'strong' });
  const timers = await store.get('timers', { type: 'json' });
  if (!timers || !Object.keys(timers).length) return;
  const { send, keep } = due(timers, Date.now());
  if (!send.length) return;
  await store.setJSON('timers', keep);   // 먼저 지워서 두 번 안 보내게
  for (const v of send) {
    const payload = { title: v.title || '⏱ 집중 끝!', body: v.body || '잠깐 쉬어가자 🌱', url: 'study.html#focus', tag: 'timer' };
    let n = 0;
    if (v.ep) n = await sendTo(store, 'child', payload, 'timer', v.ep);
    if (!n) await sendTo(store, 'child', payload, 'timer');
  }
};

export const config = { schedule: '* * * * *' };
