// 정해진 시간 폰 알림 (30분마다 실행, 한국 시간 기준)
//  승준: 07:30 오늘의 핵심 · 15:30 수업 끝 1분 말하기 · 학원 1시간 전 · 20:30 내일 시험 · 21:00 하루 마무리
//  엄마: 21:30 오늘 요약(개수만, 칭찬·도와줄 것 중심)
// 가족 공유로 서버에 올라온 기록만 사용. 같은 알림은 하루 한 번.
import { getStore } from '@netlify/blobs';
import { sendTo, getSubs } from '../lib/push-core.mjs';

const pj = (v, d) => { try { return JSON.parse(v); } catch { return d; } };
const addD = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const gap = (d, t) => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(t + 'T00:00:00Z')) / 86400000);
const toMin = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };

export function plan(data, school, nowMs) {
  const k = new Date(nowMs + 9 * 3600000), t = k.toISOString().slice(0, 10), mins = k.getUTCHours() * 60 + k.getUTCMinutes(), wd = k.getUTCDay();
  const v = key => pj(data[key]?.v, null);
  const st = v('compass-study-v1') || {}, P = v('fc_planner_v1') || {}, acs = v('fc_academy_v1') || [], kid = v('fc_kid_v1') || {};
  const tasks = (st.tasks || []).filter(x => x.date === t && !(P.pri?.[x.id]?.st === 'no'));
  const rank = { A: 0, B: 1, C: 2 }, pr = id => P.pri?.[id]?.p || 'B';
  const undone = tasks.filter(x => !x.done).sort((a, b) => rank[pr(a.id)] - rank[pr(b.id)]);
  const closures = new Set((school?.closures || []).map(c => c.date || c));
  const evs = (d) => (school?.schedule || []).filter(e => e.date === d).map(e => e.title);
  const examOn = d => evs(d).some(x => /중간고사|기말고사|지필|학력평가|모의고사/.test(x)) || (P.examDays?.[d] || []).length > 0 || (st.dates || []).some(x => !x.done && x.kind === '시험' && x.date === d);
  const isSchool = wd >= 1 && wd <= 5 && !closures.has(t);
  const nextExam = (st.dates || []).filter(x => !x.done && x.kind === '시험' && gap(x.date, t) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
  const out = [], at = (h, m) => mins >= h * 60 + m && mins < h * 60 + m + 30;
  const tired = kid.mood?.[t] === 'tired';

  if (at(7, 30)) {
    const bits = [];
    if (examOn(t)) bits.push('📝 오늘 시험 — 화이팅!');
    if (undone[0]) bits.push('🥇 ' + pr(undone[0].id) + '1 ' + undone[0].title);
    if (nextExam && !examOn(t)) bits.push('📝 ' + nextExam.title + ' D-' + gap(nextExam.date, t));
    out.push({ key: 'morning', to: 'child', kind: 'morning', title: '☀️ 좋은 아침, 승준아', body: bits.length ? bits.join(' · ') : '오늘 할 일 하나만 정해볼까?', url: 'study.html#today' });
  }
  if (at(7, 30)) {   // 시험 D-100·60·30·14·7·3 미리 알림 (학교 학사일정 + 직접 넣은 시험)
    const MARK = [100, 60, 30, 14, 7, 3], seen = new Set();
    const list = [...(school?.schedule || []).filter(e => /중간고사|기말고사|지필|정기고사|학력평가|모의고사/.test(e.title)).map(e => ({ date: e.date, title: e.title })),
      ...(st.dates || []).filter(x => !x.done && x.kind === '시험').map(x => ({ date: x.date, title: x.title }))];
    for (const e of list) {
      const n = gap(e.date, t), k = e.title.replace(/\(.*?\)/g, '').replace(/\s+/g, '');
      if (!MARK.includes(n) || seen.has(k)) continue; seen.add(k);
      const tipx = n >= 60 ? '지금은 매일 수업 정리 습관만 챙기면 돼' : n >= 30 ? '수업 노트·정리 모아 과목별 1회독 시작해볼까?' : n >= 14 ? '시험 범위 확정하고 과목별 계획 세울 때야' : n >= 7 ? '범위 1회독 마무리·오답 정리' : '새로운 것보다 본 것 다시 보기, 잠 충분히';
      out.push({ key: 'exd:' + e.date + ':' + n, to: 'all', kind: 'examdday', title: '📝 ' + e.title + ' D-' + n, body: tipx, url: 'study.html#today' });
    }
  }
  if (at(15, 30) && isSchool && !examOn(t)) out.push({ key: 'afterclass', to: 'child', kind: 'afterclass', title: '📒 수업 끝! 1분만', body: '오늘 배운 거 1분 말하기나 노트 사진 하나 남겨둘까?', url: 'study.html#today' });
  for (const a of acs) {
    if (!Array.isArray(a.days) || a.days.indexOf(wd) < 0 || (a.from && t < a.from)) continue;
    const s = toMin(a.start); if (s == null) continue;
    if (s - mins >= 45 && s - mins < 75) out.push({ key: 'ac:' + a.id, to: 'child', kind: 'academy', title: '🏫 ' + a.start + ' ' + a.name, body: a.homework && !a.hwDone ? '숙제 체크: ' + a.homework : '출발 준비할 시간이야', url: 'study.html#today' });
  }
  if (at(20, 30) && examOn(addD(t, 1)) && !tired) out.push({ key: 'exameve', to: 'all', kind: 'exameve', title: '📝 내일 시험', body: '오늘은 새로운 것보다 본 것만 정리하고 일찍 자자 🌙', url: 'study.html#today' });
  if (at(21, 0) && !(P.days || {})[t] && !tired) out.push({ key: 'close', to: 'child', kind: 'close', title: '🌙 하루 마무리 30초', body: '잘한 것 하나, 내일 제일 먼저 할 것 하나만 고르면 끝!', url: 'study.html#today' });
  if (at(21, 30)) {
    const done = tasks.filter(x => x.done).length, aDone = tasks.filter(x => x.done && pr(x.id) === 'A').length;
    const asks = (kid.asks || []).filter(a => !a.hide && nowMs - a.at < 86400000).length;
    const body = tired ? '오늘은 승준이가 쉬어가는 날이래요. 공부 이야기는 쉬어도 괜찮아요.'
      : tasks.length ? '할 일 ' + done + '/' + tasks.length + (aDone ? ' · 꼭 할 일 ' + aDone + '개 해냄 👏' : '') + (asks ? ' · 승준이 부탁 ' + asks + '개' : '') : '오늘은 기록이 없어요. "오늘 어땠어?" 한마디면 충분해요.';
    out.push({ key: 'summary', to: 'parent', kind: 'summary', title: '📊 오늘 승준이', body, url: 'study.html#today' });
  }
  return { today: t, items: out };
}

export default async () => {
  const store = getStore({ name: 'family', consistency: 'strong' });
  const subs = await getSubs(store); if (!Object.keys(subs).length) return;
  const data = (await store.get('data', { type: 'json' })) || {};
  let school = null;
  try { const base = (process.env.URL || 'https://future.apuda.app').replace(/\/$/, ''); const r = await fetch(base + '/school.json', { signal: AbortSignal.timeout(5000) }); if (r.ok) school = await r.json(); } catch {}
  const { today, items } = plan(data, school, Date.now());
  if (!items.length) return;
  const log = (await store.get('push-log', { type: 'json' })) || {};
  for (const d of Object.keys(log)) if (d < addD(today, -3)) delete log[d];
  const sent = log[today] || (log[today] = {});
  for (const it of items) {
    if (sent[it.key]) continue;
    await sendTo(store, it.to, { title: it.title, body: it.body, url: it.url, tag: it.kind }, it.kind);
    sent[it.key] = Date.now();
  }
  await store.setJSON('push-log', log);
};

export const config = { schedule: '*/30 * * * *' };
