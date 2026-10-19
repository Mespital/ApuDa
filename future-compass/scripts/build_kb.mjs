#!/usr/bin/env node
/* 흰둥이 지식 묶음 만들기 (2026-10-19) → dist/shiro-kb.json
   2시간마다 학교 자료 수집 뒤에 실행된다(.github/workflows/future-compass.yml).
   재료: school-live.json(평가계획·수행평가·채점 기준·진도·시험 범위·시간표·학교 소식·구청 프로그램)
        school.json(나이스 학사일정·급식·시간표) · curriculum-kr.js(교과 단원) · news.json(AI·미래 소식 제목)
   흰둥이(live/shiro.mjs)가 질문과 맞는 조각을 찾아 근거로 답한다. 개인 기록은 넣지 않는다(공개 학교 자료만). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => path.join(ROOT, 'dist', f);
const read = (f, d = null) => { try { return JSON.parse(fs.readFileSync(D(f), 'utf8')); } catch { return d; } };
const KST = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const md = (d) => Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10));
const out = [], add = (title, text, src, extra = {}) => { text = String(text || '').replace(/\s+\n/g, '\n').trim(); if (text.length >= 10) out.push({ title: String(title).slice(0, 80), text: text.slice(0, 1400), src, ...extra }); };

const live = read('school-live.json', {}), school = read('school.json', {}), news = read('news.json', {});
const today = KST();

/* ① 평가계획: 과목별 개요 · 수행평가 · 진도 */
for (const s of live.eval?.subjects || []) {
  const r = s.ratio || {}, g = s.grading || {}, cls = s.classes ? s.classes[0] + '~' + s.classes[1] + '반' : '전체 반';
  const scale = g.ach3 ? '성취도 3단계(A·B·C)' : g.ach5 ? '성취도 5단계(A~E)' : '';
  add(s.subject + ' 평가 방법(2학기)', `${s.subject} (${cls}) 학기 성적 반영: 수행평가 ${r.perf ?? '-'}%` + (r.exam ? ` · 지필 ${r.exam}%(중간 ${r.mid || 0} · 기말 ${r.fin || 0})` : ' · 지필 없음') +
    `. 성적: ${scale}${g.rank ? ' + 석차 등급(1~5)' : g.ach3 || g.ach5 ? ', 석차 등급 없음' : ''}` + (s.cut === 'est' ? '. 분할점수는 시험마다 학교가 정하는 추정 분할점수.' : s.cut === 'fixed' ? '. 분할점수는 고정 분할점수.' : '') + (s.note ? ' 참고: ' + s.note : ''), '평가계획', { subject: s.subject });
  for (const t of s.tasks || []) {
    add(`${s.subject} 수행평가: ${t.title}`, `${s.subject} 수행평가 "${t.title}" — 시기 ${t.when || '미정'} · ${t.type || ''} · ${t.pts || ''} · 학기 성적의 ${t.pct ?? '-'}%.\n방법: ${t.how || ''}` +
      ((t.rubric || []).length ? '\n만점 기준: ' + t.rubric.map((x) => `${x.el}${x.pts ? '(' + x.pts + ')' : ''}: ${x.top}`).join(' / ') : ''), '평가계획', { subject: s.subject });
  }
  const tl = (s.timeline || []).filter((x) => x.unit).map((x) => `${x.m}월 ${x.w}주${x.sec ? '(' + x.sec + ')' : ''}: ${x.unit}`);
  if (tl.length) add(`${s.subject} 2학기 진도표`, `${s.subject} 2학기 진도(평가계획 기준, 반·선생님마다 다를 수 있음)\n` + tl.join('\n'), '평가계획', { subject: s.subject });
}

/* ② 시험 범위·시간표(가정통신문) */
for (const [k, nm] of [['mid', '중간고사'], ['fin', '기말고사']]) {
  const E = live.exams?.[k];
  if (!E || !E.scope) { add(`2학기 ${nm} 시험 범위: 아직 안내 전`, `2학기 ${nm} 시험 범위·시간표 가정통신문은 아직 학교 홈페이지에 올라오지 않았어(${md(today)} 확인). 올라오면 2시간 안에 자동으로 반영돼. 지금은 평가계획 진도표로 범위를 짐작할 수 있지만 추정이야.`, '가정통신문'); if (!E) continue; }
  for (const [subj, v] of Object.entries(E.scope?.subjects || {}))
    add(`2학기 ${nm} 시험 범위: ${subj}`, `${subj} 2학기 ${nm} 시험 범위: ${v.text}` + (v.essay != null ? `\n배점: 서술형 ${v.essay} · 단답 ${v.short} · 선택 ${v.mc}` + (v.min ? ` · 시험 시간 ${v.min}분` : '') : '') + `\n(출처: ${E.scope.title}, ${E.scope.date})` + (k === 'mid' && !live.exams?.fin?.scope ? '\n※ 이건 중간고사 범위야. 기말고사 범위는 아직 안내 전이라 올라오면 자동 반영돼.' : ''), '가정통신문', { subject: subj });
  const days = Object.entries(E.days || {});
  if (days.length) add(`2학기 ${nm} 시간표(1학년)`, `1학년 2학기 ${nm} 날짜별 과목: ` + days.map(([d, a]) => `${md(d)} ${a.join('·')}`).join(' / ') + (E.tt ? `\n(출처: ${E.tt.title})` : ''), '가정통신문');
}

/* ③ 학교 소식·구청 프로그램 */
for (const b of live.news?.boards || []) add(`서초고 ${b.name} 최근 글`, `${b.name} 최근 글: ` + (b.items || []).map((i) => `${md(i.date)} ${i.title}`).join(' / '), '학교 홈페이지');
const progs = live.programs?.items || [];
if (progs.length) add('서초구 교육지원센터 모집 프로그램', progs.slice(0, 12).map((p) => `${p.title}(${p.center}·${p.status}·대상 ${p.target}${p.applyEnd ? '·신청 ~' + md(p.applyEnd) : ''})`).join(' / '), '서초구 교육지원센터');

/* ④ 나이스: 학사일정(앞으로 90일)·급식(앞으로 7일)·시간표 */
const sched = (school.schedule || []).filter((e) => e.date >= today).slice(0, 80);
const byM = {}; sched.forEach((e) => { const m = Number(e.date.slice(5, 7)); (byM[m] = byM[m] || []).push(`${md(e.date)} ${e.title}`); });
for (const [m, a] of Object.entries(byM)) add(`서초고 ${m}월 학사일정`, `서초고 ${m}월 학사일정(나이스): ` + [...new Set(a)].join(' / '), '나이스');
const tmr = new Date(Date.parse(today) + 864e5).toISOString().slice(0, 10), rel = (d) => d === today ? ' 오늘' : d === tmr ? ' 내일' : '', wd = (d) => '일월화수목금토'[new Date(d).getUTCDay()] + '요일';
for (const m of (school.meals || []).filter((x) => x.date >= today).slice(0, 7)) add(`${md(m.date)}(${wd(m.date)}${rel(m.date)}) 급식`, `${md(m.date)} ${wd(m.date)}${rel(m.date)} ${m.kind || '급식'}: ${(m.dishes || []).join(', ')}${m.kcal ? ' (' + m.kcal + ')' : ''}`, '나이스');
const tt = school.timetable?.classes?.['1'];
if (tt) add('1학년 1반 이번 주 시간표', '1학년 1반 이번 주 시간표(나이스): ' + Object.entries(tt).map(([d, a]) => `${md(d)} ${a.map((x, i) => i + 1 + '교시 ' + x).join(', ')}`).join(' / '), '나이스');

/* ⑤ 교과 단원(교육과정) */
try {
  const g = {}; const src = fs.readFileSync(D('curriculum-kr.js'), 'utf8').replace('g.FC_CURRICULUM = {', 'g.__DATA = DATA; g.FC_CURRICULUM = {');
  vm.runInNewContext(src, { window: g, globalThis: g, self: g, console });
  const DATA = g.__DATA || {};
  for (const [subj, sems] of Object.entries(DATA)) for (const [sem, v] of Object.entries(sems)) {
    if (!v || !v.units) continue;
    add(`${v.course} 단원 구성`, `${v.course}${v.book ? ' (' + v.book + ')' : ''} 단원: ` + v.units.map((u) => u.title + (u.subs && u.subs.length ? '(' + u.subs.join(', ') + ')' : '')).join(' / ') + (v.extra ? '\n' + v.extra : ''), '교육과정', { subject: v.course });
  }
} catch (e) { console.error('curriculum skip', e.message); }

/* ⑥ 고교학점제·서초고 과목 구조 (공식 자료 기준 요약) */
const cat = live.eval?.catalog || [];
if (cat.length) add('서초고 2학년 개설 과목(2026 공시)', '서초고 지금 2학년 개설 과목: ' + [...new Set(cat.filter((c) => c.grade === 2).map((c) => c.subject))].join(', ') + '\n(2027 편성은 학교 수요조사로 정해짐)', '평가계획');
add('고교학점제 기본', '졸업: 3년간 192학점(교과 174 + 창의적 체험활동 18). 1학점 = 50분 수업 16회. 공통과목(1학년)은 출석률 2/3 이상 + 학업성취율 40% 이상이면 이수, 선택과목은 출석률 2/3 이상(2026.1 교육부 개선안). 내신은 2025 고1부터 5등급 상대평가(1등급 10%, 2등급 누적 34%, 3등급 66%, 4등급 90%). 체육·예술·과학탐구실험·교양과 사회·과학 융합선택은 석차 등급 없음.', '교육부');

/* ⑦ AI·미래 소식 (진로 대화용 제목) */
const arts = (news.articles || []).slice(0, 12);
if (arts.length) add('최근 AI·미래 소식', '최근 AI·미래 관련 공식 소식: ' + arts.map((a) => `${(a.published_at || '').slice(5, 10)} ${a.source}: ${a.title}`).join(' / '), 'AI 소식');

/* ⑧ 흰둥이가 스스로 공부한 개념 사전(scripts/build_learn.mjs, 매시간) */
const learnF = read('shiro-learn.json', {});
const schoolN = out.length;
for (const c of learnF.concepts || []) out.push({ title: c.title, text: `[${c.subject} · ${c.unit}] ` + c.text, src: '위키백과', subject: c.subject, url: c.url });
const today24 = (learnF.log || []).filter((x) => Date.now() - Date.parse(x.at) < 864e5).reduce((n, x) => n + x.n, 0);
const learn = { total: (learnF.concepts || []).length, today: today24, queue: learnF.queue || 0, last: (learnF.log || [])[0] || null };

/* 내용이 그대로면 시각도 그대로 둬서 2시간마다 빈 커밋이 생기지 않게 */
const prev = read('shiro-kb.json', {});
const same = prev.chunks && JSON.stringify(prev.chunks) === JSON.stringify(out);
const kb = { updated: same && prev.updated ? prev.updated : new Date().toISOString(), count: out.length, school: schoolN, learn, sources: [...new Set(out.map((x) => x.src))], chunks: out };
fs.writeFileSync(D('shiro-kb.json'), JSON.stringify(kb) + '\n');
console.log('shiro-kb', out.length, 'school', schoolN, 'learned', learn.total, 'chunks', kb.sources.join(', '), Math.round(JSON.stringify(kb).length / 1024) + 'KB');
