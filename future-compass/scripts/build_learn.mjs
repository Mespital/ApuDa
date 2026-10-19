#!/usr/bin/env node
/* 🧠 흰둥이 스스로 공부 (2026-10-19) → dist/shiro-learn.json
   매시간(.github/workflows/shiro-learn.yml) 공부할 주제를 몇 개씩 골라 한국어 위키백과에서 읽고 개념 사전에 쌓는다.
   주제 순서: ① 이번 달·다음 달 진도(평가계획) ② 교과 단원·소단원(교육과정) ③ 진로 탐색기 직업 ④ 이미 배운 개념에 연결된 문서(넓혀 읽기)
   30일 지난 개념은 다시 읽어 고친다. 질문 기록·개인 정보는 쓰지 않는다(공개 저장소에 올라가는 파일이라서).
   위키백과 글은 CC BY-SA 4.0 — 흰둥이가 답할 때 "위키백과: 제목"으로 출처를 밝힌다. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => path.join(ROOT, 'dist', f);
const read = (f, d = null) => { try { return JSON.parse(fs.readFileSync(D(f), 'utf8')); } catch { return d; } };
const PER_RUN = Number(process.env.LEARN_PER_RUN || 12), MAX = 1200, STALE = 30 * 864e5, RETRY = 14 * 864e5;
const UA = { 'user-agent': 'future-compass-study/1.0 (family study app; https://future.apuda.app)' };
const now = Date.now(), iso = new Date(now).toISOString();
const kstMonth = new Date(now + 9 * 3600e3).getUTCMonth() + 1;

const L = read('shiro-learn.json', null) || { concepts: [], tried: {}, log: [] };
L.concepts = L.concepts || []; L.tried = L.tried || {}; L.log = L.log || [];
const have = new Map(L.concepts.map((c) => [c.title, c]));

/* 2글자 묶음으로 비슷한지 보기 (검색 결과가 엉뚱한 문서인지 거르기) */
const grams = (s) => { const t = String(s).replace(/[^가-힣A-Za-z0-9]/g, ''); const g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); if (t.length === 1) g.add(t); return g; };
const BADT = /\((?:[^)]*(나라|왕조|왕|인물|가수|드라마|영화|노래|음반|앨범|축구|야구|배우|기업|회사|프로그램|방송|잡지|게임|\d))[^)]*\)|기금|재단|협회|위원회|주식회사|목록|동음이의/;
const cover = (a, b) => { const A = grams(a), B = grams(b); if (!A.size) return 0; let n = 0; A.forEach((x) => { if (B.has(x)) n++; }); return n / A.size; };
/* 검색 결과가 주제와 맞는지: 제목이 주제를 다 품고(길이 비슷) 있거나, 서로 대부분 겹치면 OK */
const ok = (x, q) => { if (BADT.test(x)) return false; const t = x.replace(/\s*\(.*\)$/, ''), qn = q.replace(/(와|과|및|의)(?=\s)/g, ''); const tl = t.replace(/\s/g, '').length, ql = qn.replace(/\s/g, '').length;
  return (cover(qn, t) >= 0.8 && tl <= ql + 4) || (cover(t, qn) >= 0.75 && cover(qn, t) >= 0.6); };
const fit = (title, q) => { const a = grams(title.replace(/\s*\(.*\)$/, '')), b = grams(q); if (!a.size) return 0; let n = 0; a.forEach((x) => { if (b.has(x)) n++; }); return n / a.size; };
const clean = (s) => String(s).replace(/^[\s\dⅠ-Ⅻ.()·-]+/, '').replace(/\(\d+\)/g, ' ').replace(/(알아보기|탐구하기|이해하기|설명하기|분석하기|비교하기|조사하기|발표하기|인식하기|고안|하기)/g, ' ').replace(/\s+/g, ' ').trim();

/* ── 공부할 주제 모으기 ── */
const topics = [];   // {q, subject, unit, from, pri}
const push = (q, o) => { q = clean(q); if (/고사|평가|수행|방학|복습|발표회|오리엔테이션/.test(q)) return; if (q.length >= 2 && q.length <= 40) topics.push({ q, ...o }); };
const live = read('school-live.json', {});
for (const s of live.eval?.subjects || []) for (const t of s.timeline || []) {
  if (!t.unit || !(t.m === kstMonth || t.m === kstMonth + 1 || (kstMonth === 12 && t.m === 1))) continue;
  String(t.unit).split(/\(\d+\)|\d+\.|·|,|\//).forEach((p) => push(p, { subject: s.subject, unit: '이번 진도', from: '진도', pri: 1 }));
}
try {
  const g = {}; vm.runInNewContext(fs.readFileSync(D('curriculum-kr.js'), 'utf8').replace('g.FC_CURRICULUM = {', 'g.__DATA = DATA; g.FC_CURRICULUM = {'), { window: g, globalThis: g, self: g, console });
  for (const sems of Object.values(g.__DATA || {})) for (const v of Object.values(sems)) {
    if (!v || !v.units) continue;
    for (const u of v.units) { (u.subs || []).forEach((x) => String(x).split(/·/).forEach((p) => push(p, { subject: v.course, unit: clean(u.title), from: '교육과정', pri: 2 }))); }
  }
} catch (e) { console.error('curriculum skip', e.message); }
try {
  const src = fs.readFileSync(D('career-explorer.js'), 'utf8');
  for (const m of src.matchAll(/\bn: '([^']{2,20})'/g)) push(m[1], { subject: '진로', unit: '직업', from: '진로', pri: 3 });
} catch {}
/* 넓혀 읽기: 진도·교과 개념에 연결된 문서 (연도·목록 같은 건 뺌) */
for (const c of L.concepts) if (c.pri <= 2) for (const t of c.links || []) if (!/^\d|목록|연표|년$|일$|월$|:/.test(t)) topics.push({ q: t, exact: 1, subject: c.subject, unit: c.title + ' 관련', from: '넓혀 읽기', pri: 4 });

const seen = new Set(), due = [];
for (const t of topics.sort((a, b) => a.pri - b.pri)) {
  const key = t.q; if (seen.has(key)) continue; seen.add(key);
  const tr = L.tried[key];
  if (tr && tr.title && have.has(tr.title) && now - Date.parse(have.get(tr.title).at) < STALE) continue;   // 이미 배웠고 아직 새것
  if (tr && !tr.title && tr.v === 2 && now - Date.parse(tr.at) < RETRY) continue;                                     // 못 찾은 주제는 2주 뒤 다시
  if (have.has(t.q) && now - Date.parse(have.get(t.q).at) < STALE) continue;
  due.push(t);
}
const pick = due.slice(0, PER_RUN);

async function j(url) { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
const API = 'https://ko.wikipedia.org/w/api.php?format=json&formatversion=2&';
/* 긴 진도 문장은 위키백과 검색이 안 맞아서 → 핵심어 후보로 쪼개서 차례로 찾는다 */
const STOPW = /^(활용|감상|탐구|원리|이해|방법|사례|생활|우리|주변|다양한|관련|대한|위한|통한|중심|바탕|과정|문제|해결|방안|제안|활동|자료|교과서|단원|프로젝트|미래|첨단|과학적|학교)$/;
const strip = (w) => w.replace(/(으로|에서|에게|하여|하고|하는|활용한|적용된|이용한|을|를|의|에|와|과|한|된|및|로)$/, '');
function cands(q) {
  const ws = q.split(/\s+/).map(strip).filter((w) => w.length >= 2);
  const out = [q];
  for (let i = 0; i < ws.length - 1; i++) if (!STOPW.test(ws[i]) && !STOPW.test(ws[i + 1])) out.push(ws[i] + ' ' + ws[i + 1]);
  ws.filter((w) => w.length >= 4 && !STOPW.test(w)).sort((a, b) => b.length - a.length).forEach((w) => out.push(w));
  return [...new Set(out)].slice(0, 5);
}
async function page(title, t) {
  const e = await j(API + 'action=query&prop=extracts|links|info&inprop=url&exintro=1&explaintext=1&redirects=1&pllimit=40&plnamespace=0&titles=' + encodeURIComponent(title));
  const p = (e.query?.pages || [])[0]; if (!p || p.missing || !p.extract || p.extract.length < 60 || /동음이의/.test(p.extract.slice(0, 80))) return null;
  const text = p.extract.replace(/\n{2,}/g, '\n').slice(0, 900);
  return { title: p.title, subject: t.subject, unit: t.unit, from: t.from, pri: t.pri, text, url: p.fullurl || 'https://ko.wikipedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_')), links: (p.links || []).map((x) => x.title).slice(0, 12), at: iso };
}
async function learn(t) {   // 주제 하나에서 개념 최대 2개
  if (t.exact) { const c = await page(t.q, t); return c ? [c] : []; }
  const res = [], titles = new Set();
  for (const q of cands(t.q)) {
    if (res.length >= 2) break;
    const s = await j(API + 'action=query&list=search&srlimit=3&srsearch=' + encodeURIComponent(q));
    const hit = (s.query?.search || []).map((x) => x.title).find((x) => ok(x, q) && !titles.has(x));
    if (!hit) continue;
    const c = await page(hit, t); if (c && !titles.has(c.title)) { titles.add(c.title); res.push(c); }
  }
  return res;
}

const got = [];
for (const t of pick) {
  try {
    const cs = await learn(t);
    L.tried[t.q] = { at: iso, title: cs[0] ? cs[0].title : '', v: 2 };
    for (const c of cs) { const old = have.get(c.title); if (old && old.pri < c.pri) { c.pri = old.pri; c.subject = old.subject; c.unit = old.unit; c.from = old.from; } have.set(c.title, c); got.push(c.title); }
  } catch (e) { console.error('skip', t.q, e.message); }
  await new Promise((r) => setTimeout(r, 300));   // 위키백과에 부담 주지 않게
}
/* 너무 많아지면 넓혀 읽기·오래된 것부터 정리 */
let all = [...have.values()].filter((c) => c.from === '교육과정' || c.title.replace(/\s/g, '').length > 2 && !/^(사회|과학|운동|에너지|효율|오염|건축물|사회과학|온실)$/.test(c.title) && !BADT.test(c.title)).sort((a, b) => a.pri - b.pri || Date.parse(b.at) - Date.parse(a.at));
if (all.length > MAX) all = all.slice(0, MAX);
const keepTried = Object.entries(L.tried).sort((a, b) => Date.parse(b[1].at) - Date.parse(a[1].at)).slice(0, 3000);
const out = { updated: got.length ? iso : (L.updated || iso), total: all.length, queue: Math.max(0, due.length - pick.length),
  log: (got.length ? [{ at: iso, n: got.length, titles: got.slice(0, 12) }] : []).concat(L.log).slice(0, 72),
  concepts: all, tried: Object.fromEntries(keepTried) };
fs.writeFileSync(D('shiro-learn.json'), JSON.stringify(out) + '\n');
console.log('shiro-learn +' + got.length, 'total', all.length, 'queue', out.queue, got.join(', '));
