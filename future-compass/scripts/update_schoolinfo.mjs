#!/usr/bin/env node
/* 공식 출처 실시간 수집 → dist/school-live.json (2026-10-18)
   ① 학교알리미 「교과별(학년별) 교수·학습 및 평가계획」 (4월·9월 공시, 첨부 hwp/hwpx/zip)
      → 과목별 지필:수행 비율, 수행평가(시기·유형·과제·배점·반영비율·만점 기준), 월·주별 진도
      흐름은 schoolinfo-mcp(MIT, chrisryugj)를 참고해 순수 HTTP로 재현. 인증키 불필요.
      같은 공시 회차면 7일에 한 번만 다시 받는다(학교알리미 부담 줄이기).
   ② 서초고 홈페이지 첫 화면의 공지사항·가정통신문 최신 글
   ③ 서초구 교육지원센터 4개 센터 프로그램 중 모집중·모집예정 (고등학생·학부모 대상만)
   실패한 항목은 이전 값을 그대로 둔다. 개인정보(교사 실명 등)는 저장하지 않는다.
   사용: node update_schoolinfo.mjs [--fixtures DIR]   (DIR: 받아둔 원본으로 시험) */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import iconv from 'iconv-lite';
import { unzipSync } from 'fflate';
import { parse as kordoc } from 'kordoc';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'dist/school-live.json');
const FIX = (() => { const i = process.argv.indexOf('--fixtures'); return i > 0 ? process.argv[i + 1] : ''; })();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const SI = 'https://www.schoolinfo.go.kr';
const PARSER = 2;   // 해석 규칙을 고치면 올린다 → 같은 공시 회차라도 다시 받아 해석
const SCHOOL = { name: '서초고등학교', home: 'https://seocho.sen.hs.kr', entryYear: 2026 };
const KST = () => new Date(Date.now() + 9 * 3600e3);
const nowIso = () => new Date().toISOString();

async function http(url, opt = {}) {
  const r = await fetch(url, { ...opt, headers: { 'User-Agent': UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 60 * 1024 * 1024) throw new Error('too large');
  return { r, buf };
}
const fix = (name) => fs.readFile(path.join(FIX, name));
const strip = (s) => String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<sup>.*?<\/sup>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\\([~*_|])/g, '$1').replace(/\s+/g, ' ').trim();

/* ---------- 문서 → 블록(제목 줄 / 표) ---------- */
function blocks(md) {
  const out = []; const lines = md.split('\n'); let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*<table/i.test(l)) {
      let buf = l; while (!/<\/table>/i.test(buf) && i + 1 < lines.length) buf += '\n' + lines[++i];
      const rows = [...buf.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map((m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => strip(c[1])));
      out.push({ t: 'table', rows }); i++; continue;
    }
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        let row = lines[i].trim();
        while (!/\|\s*$/.test(row) && i + 1 < lines.length && !/^\s*\|/.test(lines[i + 1])) row += ' ' + lines[++i].trim();   // 칸 안 줄바꿈 이어 붙이기
        const r = row.replace(/^\||\|$/g, '').split('|').map(strip); if (!r.every((c) => /^-+$/.test(c))) rows.push(r); i++;
      }
      out.push({ t: 'table', rows }); continue;
    }
    const s = strip(l.replace(/^#+\s*/, '').replace(/\*\*/g, ''));
    if (s) out.push({ t: 'line', s });
    i++;
  }
  return out;
}
const pctNum = (s) => { const m = /(\d+(?:\.\d+)?)\s*%/.exec(s || ''); return m ? Number(m[1]) : null; };

function parsePlan(md, filename) {
  const B = blocks(md);
  const doc = { subject: '', grade: null, semester: null, file: filename };
  const head = B.find((b) => b.t === 'table' && b.rows[0] && b.rows[0].includes('학년'));
  if (head && head.rows[1]) {
    const h = head.rows[0], v = head.rows[1];
    doc.grade = Number((v[h.indexOf('학년')] || '').replace(/\D/g, '')) || null;
    doc.semester = Number((v[h.indexOf('학기')] || '').replace(/\D/g, '')) || null;
    doc.subject = v[h.indexOf('과목')] || '';
    const cls = (v[h.indexOf('학급')] || '').match(/\d+/g);
    if (cls && cls.length) doc.classes = [Number(cls[0]), Number(cls[cls.length - 1])];
  }
  if (!doc.subject) { const m = /\(\s*([^()]+?)\s*\)\s*과/.exec(filename) || /2학기\s+(.+?)과?\s*교수/.exec(filename); doc.subject = m ? m[1].trim() : filename; }
  if (!doc.grade) { const m = /(?<![0-9])([1-3])학년/.exec(filename); doc.grade = m ? Number(m[1]) : null; }
  // 진도(교수학습 운영계획 표들)
  doc.timeline = []; let label = '';
  B.forEach((b, i) => {
    if (b.t === 'line' && /교수학습 운영\s*계획/.test(b.s)) label = (b.s.match(/\(([A-Z가-힣])\)/) || [])[1] || '';
    if (b.t !== 'table' || !b.rows[0] || !b.rows[0].some((c) => /단원/.test(c))) return;
    let month = null;
    b.rows.slice(1).forEach((r) => {
      let c = r.slice();
      if (/^\d{1,2}$/.test(c[0]) && Number(c[0]) <= 12) { month = Number(c[0]); c = c.slice(1); }
      if (!month || !c.length) return;
      const wk = (c[0] || '').replace(/\(.*?\)/g, '').trim(), unit = c[1] || '';
      if (!unit || /^월$|^주/.test(unit) || !/[가-힣A-Za-z]{2,}/.test(unit.replace(/\d|\(|\)/g, ''))) return;
      const exam = /중간고사|기말고사|지필/.test(unit) && c.length <= 3;
      doc.timeline.push({ sec: label, m: month, w: wk, unit: unit.slice(0, 120), exam: exam || undefined });
    });
  });
  // 반영 비율
  const ratioT = B.find((b) => b.t === 'table' && b.rows.some((r) => r.some((c) => /반영\s*비율/.test(c))) && b.rows.some((r) => r.some((c) => /정기시험|지필/.test(c))));
  if (ratioT) {
    const ri = ratioT.rows.findIndex((r) => r.some((c) => /반영\s*비율/.test(c)));
    const next = ratioT.rows[ri + 1] || [];
    const exams = next.map(pctNum).filter((x) => x != null);
    const row = ratioT.rows[ri].map(pctNum).filter((x) => x != null);
    if (exams.length) doc.ratio = { exam: exams.reduce((a, b) => a + b, 0), mid: exams.length > 1 ? exams[0] : null, fin: exams.length > 1 ? exams[1] : exams[0] };
    else if (row.length) doc.ratio = { exam: null };
    const hasMid = ratioT.rows.some((r) => r.some((c) => /중간/.test(c)));
    if (doc.ratio) doc.ratio.hasMid = hasMid;
  }
  // 수행평가 개요
  const oi = B.findIndex((b) => b.t === 'line' && /수행평가\s*개요/.test(b.s));
  const ovT = B.slice(oi >= 0 ? oi : 0).find((b) => b.t === 'table' && b.rows[0] && b.rows[0].some((c) => /과제|영역/.test(c)) && b.rows[0].some((c) => /배점|비율/.test(c)));
  doc.tasks = [];
  if (ovT) {
    const h = ovT.rows[0].map((c) => c.replace(/\s/g, ''));
    const col = (re) => h.findIndex((c) => re.test(c));
    const ci = { when: col(/시기/), type: col(/유형/), title: col(/과제명|영역|과제/), how: col(/방법/), pts: col(/배점/), pct: col(/비율/) };
    ovT.rows.slice(1).forEach((r) => {
      if (r.length < h.length - 1) {   // 한 과제 아래 세부 줄(실기·발표 등) → 앞 과제에 합침
        const prev = doc.tasks[doc.tasks.length - 1], pc = pctNum(r[r.length - 1]);
        if (prev && pc != null) { (prev.parts = prev.parts || [{ type: prev.type, pct: prev.pct }]).push({ type: r[0].slice(0, 30), how: (r[1] || '').slice(0, 160), pct: pc }); prev.pct = (prev.pct || 0) + pc; }
        return;
      }
      const g = (k) => (ci[k] >= 0 ? r[ci[k]] || '' : '');
      if (!g('title') || /^(합계|소계|계|총계)$/.test(g('title').replace(/\s/g, ''))) return;
      doc.tasks.push({ when: g('when'), type: g('type'), title: g('title').slice(0, 120), how: g('how').slice(0, 220), pts: g('pts'), pct: pctNum(g('pct')) });
    });
  }
  // 세부 평가 계획 → 채점요소별 만점 기준
  const di = B.findIndex((b) => b.t === 'line' && /수행평가\s*세부/.test(b.s));
  if (di >= 0) {
    let cur = null;
    for (let i = di + 1; i < B.length; i++) {
      const b = B[i];
      if (b.t === 'line' && /결시자|미응시자|개별학습반/.test(b.s)) break;
      if (b.t === 'line') { const m = /^[가-하]\.\s*(.{2,80}?)\s*(?:\((\d+)\s*점[^)]*\))?\s*$/.exec(b.s); if (m && !/^(세부|평가|활동지|탐구)/.test(m[1])) { cur = { title: m[1], max: m[2] ? Number(m[2]) : null, items: [] }; (doc._rub = doc._rub || []).push(cur); } continue; }
      if (b.t === 'table' && cur && b.rows[0] && b.rows[0].some((c) => /채점/.test(c))) {
        b.rows.slice(1).forEach((r) => {
          if (r.length >= 4) { const n = r.length; const el = r[n - 4].split('※')[0].trim(), top = r[n - 3], sc = r[n - 1]; if (el && !cur.items.some((x) => x.el === el)) cur.items.push({ el: el.slice(0, 80), top: top.slice(0, 240), pts: sc }); }
        });
      }
    }
  }
  (doc._rub || []).forEach((rb) => {
    const key = rb.title.replace(/\s/g, '').slice(0, 10);
    const t = doc.tasks.find((x) => x.title.replace(/\s/g, '').indexOf(key) >= 0) || doc.tasks[doc._rub.indexOf(rb)];
    if (t) t.rubric = rb.items.slice(0, 6);
  });
  delete doc._rub;
  // 2학기 문서인데 1학기 달(3~7월)만 적힌 과제는 빼고 표시 (학교 문서 오기 가능성)
  if (doc.semester === 2) {
    const before = doc.tasks.length;
    doc.tasks = doc.tasks.filter((x) => { const ms = [...(x.when || '').matchAll(/(\d{1,2})\s*월/g)].map((m) => Number(m[1])); return !ms.length || ms.some((n) => n >= 8 || n <= 2); });
    if (before && !doc.tasks.length) doc.taskNote = '공시 문서의 수행평가 시기가 1학기로 적혀 있어. 원문을 확인해줘.';
  }
  if (doc.tasks.length && !doc.ratio) doc.ratio = {};
  if (doc.ratio) doc.ratio.perf = doc.ratio.exam != null ? 100 - doc.ratio.exam : doc.tasks.reduce((a, t) => a + (t.pct || 0), 0) || null;
  return doc;
}

async function toMarkdown(buf) {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const r = await kordoc(ab);
  return (r && r.markdown) || '';
}
function zipEntries(buf) {
  const files = unzipSync(new Uint8Array(buf));
  return Object.entries(files).filter(([n, d]) => d.length && /\.(hwpx?|pdf)$/i.test(n)).map(([n, d]) => {
    let name = n;
    if (!/[가-힣]/.test(n)) { try { name = iconv.decode(Buffer.from(n, 'binary'), 'cp949'); } catch (e) {} }
    return { name: name.split('/').pop(), buf: Buffer.from(d) };
  });
}

/* ---------- ① 학교알리미 ---------- */
async function schoolinfo(prev) {
  const year = KST().getUTCFullYear(), grade = Math.min(3, Math.max(1, (KST().getUTCMonth() >= 2 ? year : year - 1) - SCHOOL.entryYear + 1));
  let html, shl = prev && prev.shl;
  if (FIX) html = (await fix('si-b43.html')).toString('utf-8');
  else {
    if (!shl) {
      const { buf } = await http(SI + '/ei/ss/pneiss_a04_s0/getSchoolList.do', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Referer: SI + '/ei/ss/pneiss_a03_s0.do' }, body: new URLSearchParams({ SEARCH_WORD: SCHOOL.name }) });
      const hit = JSON.parse(buf.toString('utf-8')).find((x) => x.SHL_NM === SCHOOL.name && /서울/.test(x.LCTN_NM || '') && /서초구/.test(x.USER_DFN_CODE_VALUE_02 || ''));
      if (!hit) throw new Error('school not found'); shl = hit.SHL_IDF_CD;
    }
    const body = new URLSearchParams({ GS_HANGMOK_CD: '43', GS_HANGMOK_NO: '4-가', GS_HANGMOK_NM: '교과별(학년별) 교수ㆍ학습 및 평가계획에 관한 사항', GS_BURYU_CD: 'JG110', JG_BURYU_CD: 'JG040', JG_HANGMOK_CD: '14', JG_GUBUN: '1', HG_NM: SCHOOL.name, SHL_IDF_CD: shl, GS_TYPE: 'Y', JG_YEAR: String(year), SORT: 'BR', CHOSEN_JG_YEAR: String(year), PRE_JG_YEAR: String(year), LOAD_TYPE: 'single' });
    const { buf } = await http(SI + '/ei/pp/Pneipp_b43_s0p.do', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded', Referer: SI + '/ei/ss/Pneiss_b01_s0.do' }, body });
    html = iconv.decode(buf, 'euc-kr');
  }
  const sel = /<option\s+value="(\d{4})(\d+)"\s*selected\s*>\s*([^<]*)<\/option>/i.exec(html);
  const round = sel ? sel[3].trim() : '';
  const fresh = prev && prev.round === round && prev.parser === PARSER && prev.fetched && Date.now() - Date.parse(prev.fetched) < 7 * 864e5 && !FIX;
  if (fresh) return { ...prev, checked: nowIso() };
  const fi = html.indexOf('eiFileDownForm'), seg = html.slice(fi, html.indexOf('</form>', fi));
  const params = {}; for (const m of seg.matchAll(/name="([A-Za-z_]\w*)"[^>]*?value="([^"]*)"/g)) if (!(m[1] in params) && /^[\w.\-]*$/.test(m[2])) params[m[1]] = m[2];
  const files = [...html.matchAll(/getEiFile\d*\(\s*['"]?(\d+)['"]?\s*\)[^>]*>\s*([^<]*?\.(?:hwpx|hwp|pdf|zip))/gi)].map((m) => ({ seq: m[1], name: m[2].trim() })).filter((f) => !/학업성적관리/.test(f.name));
  const docs = [];
  for (const f of files.slice(0, 6)) {
    const buf = FIX ? await fix('si-file-' + f.seq + '.' + f.name.split('.').pop()) : (await http(SI + '/servlets/EiFileDownLoad.do?' + new URLSearchParams({ ...params, FILE_SEQ: f.seq }), { headers: { Referer: SI + '/ei/pp/Pneipp_b43_s0p.do' } })).buf;
    const entries = /\.zip$/i.test(f.name) ? zipEntries(buf) : [{ name: f.name, buf }];
    for (const e of entries.slice(0, 160)) {
      try { const md = await toMarkdown(e.buf); if (md.length > 200) docs.push(parsePlan(md, e.name)); else docs.push({ subject: e.name, file: e.name, unreadable: true }); }
      catch (err) { docs.push({ subject: e.name, file: e.name, unreadable: true }); }
    }
  }
  const mine = docs.filter((d) => d.grade === grade && !d.unreadable);
  const offered = { 1: [], 2: [], 3: [] };
  docs.forEach((d) => { const s = String(d.subject || '').replace(/\s*\([A-Z,\s]+\)\s*$/, '').trim(); if (d.grade && offered[d.grade] && s && !/교과목|과목명/.test(s) && offered[d.grade].indexOf(s) < 0) offered[d.grade].push(s); });
  return {
    checked: nowIso(), fetched: nowIso(), shl, round, year, grade,
    source: SI + '/ei/ss/pneiss_a03_s0.do',
    parser: PARSER,
    subjects: mine.map((d) => ({ subject: d.subject, semester: d.semester, classes: d.classes || null, ratio: d.ratio || null, tasks: d.tasks, timeline: d.timeline, note: d.taskNote })),
    offered, unreadable: docs.filter((d) => d.unreadable).map((d) => d.file),
  };
}

/* ---------- ② 학교 홈페이지 ---------- */
async function schoolNews() {
  const html = FIX ? (await fix('school-home.html')).toString('utf-8') : (await http(SCHOOL.home + '/')).buf.toString('utf-8');
  const boards = [];
  for (const m of html.matchAll(/<h3>([^<]+)<\/h3>/g)) {
    const seg = html.slice(m.index, m.index + 30000).split('</ul>')[0];
    const items = [...seg.matchAll(/fnBoardPage_\d+\('([^']+)',\s*'(\d+)',\s*'(\d+)'\);">\s*<div class="ellipsis">([\s\S]*?)<\/div><\/a>\s*<p class="date"\s*>([^<]+)/g)]
      .map((x) => ({ title: strip(x[4]), date: x[5].trim(), menu: x[3], id: x[2] }));
    if (items.length) boards.push({ name: strip(m[1]), url: SCHOOL.home + '/' + items[0].menu + '/subMenu.do', items: items.slice(0, 6) });
  }
  if (!boards.length) throw new Error('no boards');
  return { checked: nowIso(), boards };
}

/* ---------- ③ 서초구 교육지원센터 ---------- */
const CENTERS = { yangjae: '양재내곡', bangbae: '방배', banpo: '반포잠원', seocho: '서초' };
async function programs() {
  const out = [];
  for (const [c, nm] of Object.entries(CENTERS)) {
    for (const st of ['ing', 'schedule']) {
      let html;
      try { html = FIX ? (await fix('c-' + c + '-' + (st === 'ing' ? 'ing' : 'all') + '.html')).toString('utf-8') : (await http('https://seochoedu.or.kr/user/prgrm/' + c + '/BD_selectPrgrmList.do?rctmSttsSeCd=' + st)).buf.toString('utf-8'); }
      catch (e) { continue; }
      for (const m of html.matchAll(/<span class="(\w+)">[^<]*<\/span>[\s\S]*?opMove\('(P\d+)'\)">([\s\S]*?)<\/a>[\s\S]*?<dt>모집대상<\/dt><dd>([\s\S]*?)<\/dd>[\s\S]*?<dt>교육기간<\/dt>\s*<dd>([\s\S]*?)<\/dd>[\s\S]*?<dt>모집기간<\/dt><dd>([\s\S]*?)<\/dd>/g)) {
        const [, status, id, title, target, period, apply] = m;
        if (status === 'deadline') continue;
        const tg = strip(target);
        if (!/고등|중고|중,\s*고|청소년|학부모|누구나|전체|구민/.test(tg) || /^(초등|초·중학교 학부모)/.test(tg) && !/고/.test(tg)) continue;
        if (out.some((x) => x.id === id)) continue;
        const ap = strip(apply), pe = strip(period);
        out.push({ id, center: nm, status: status === 'ing' ? '모집중' : '모집예정', title: strip(title).replace(/\s*신청페이지.*$/, '').slice(0, 100), target: tg, period: pe, apply: ap,
          applyEnd: (/~\s*(\d{4}-\d{2}-\d{2})/.exec(ap) || [])[1] || '', url: 'https://seochoedu.or.kr/user/prgrm/' + c + '/BD_selectPrgrm.do?q_prgrmId=' + id });
      }
    }
  }
  out.sort((a, b) => (a.applyEnd || '9').localeCompare(b.applyEnd || '9'));
  return { checked: nowIso(), items: out.slice(0, 20) };
}

async function parseDir(dir) {
  const out = [];
  for (const f of (await fs.readdir(dir)).filter((x) => /\.(hwpx?|pdf)$/i.test(x))) {
    const md = await toMarkdown(await fs.readFile(path.join(dir, f))); if (md.length > 200) out.push(parsePlan(md, f));
  }
  if (process.argv.includes('--write')) {   // 받아둔 원본으로 dist 데이터 다시 만들기 (공시 회차 정보는 기존 값 유지)
    const cur = JSON.parse(await fs.readFile(DEST, 'utf-8'));
    cur.eval.subjects = out.filter((d) => d.grade === cur.eval.grade).map((d) => ({ subject: d.subject, semester: d.semester, classes: d.classes || null, ratio: d.ratio || null, tasks: d.tasks, timeline: d.timeline, note: d.taskNote }));
    cur.eval.parser = PARSER; await fs.writeFile(DEST, JSON.stringify(cur, null, 1) + '\n'); console.log('written', cur.eval.subjects.length);
  }
  console.log(JSON.stringify(out.filter((d) => d.grade === 1).map((d) => ({ s: d.subject, cls: d.classes, r: d.ratio, t: d.tasks.map((x) => [x.when, x.title.slice(0, 24), x.pct, (x.parts || []).length, (x.rubric || []).length]) })), null, 0));
}
async function main() {
  const pd = process.argv.indexOf('--parse-dir'); if (pd > 0) return parseDir(process.argv[pd + 1]);
  let prev = {}; try { prev = JSON.parse(await fs.readFile(DEST, 'utf-8')); } catch (e) {}
  const out = { ...prev, school: SCHOOL.name, updated: nowIso() }, log = [];
  for (const [k, fn] of [['eval', () => schoolinfo(prev.eval)], ['news', schoolNews], ['programs', programs]]) {
    try { out[k] = await fn(); log.push(k + ' ok'); } catch (e) { log.push(k + ' fail: ' + e.message); if (prev[k]) out[k] = prev[k]; }
  }
  out.links = {
    schoolinfo: out.eval && out.eval.source || SI,
    home: SCHOOL.home + '/',
    letters: SCHOOL.home + '/75977/subMenu.do', notice: SCHOOL.home + '/75976/subMenu.do', evalBoard: SCHOOL.home + '/129842/subMenu.do', events: SCHOOL.home + '/129833/subMenu.do',
    center: 'https://www.seochoedu.or.kr/index.do', office: 'https://gnscedu.sen.go.kr/CMS/about/about03/index.html',
  };
  await fs.writeFile(DEST, JSON.stringify(out, null, 1) + '\n');
  console.log(log.join('\n'));
  const e = out.eval || {};
  console.log('eval round', e.round, 'subjects', (e.subjects || []).map((s) => s.subject + ':' + (s.tasks || []).length + 't/' + (s.timeline || []).length + 'w').join(', '));
}
main().catch((e) => { console.error(e); process.exit(0); });
