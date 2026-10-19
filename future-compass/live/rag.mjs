// 공부 자료 근거 답변(RAG) + 없으면 위키백과 검색
// - 자료: 가족이 올린 텍스트(학습지·요약·교과서 정리 등)를 조각으로 나눠 VPS 디스크에 저장
// - 찾기: 한글 2글자 묶음(바이그램) 점수 — 별도 모델 없이 CPU 부담 거의 0
// - 없으면: 한국어 위키백과 요약(무료·공개 API)
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DIR = process.env.FC_DATA_DIR || '/data';
const FILE = path.join(DIR, 'docs.json');
const MAX_TOTAL = 6 * 1024 * 1024, MAX_DOC = 400000, CHUNK = 600;
let DOCS = [];
try { DOCS = JSON.parse(fs.readFileSync(FILE, 'utf8')); if (!Array.isArray(DOCS)) DOCS = []; } catch { DOCS = []; }
function persist() { try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(FILE + '.tmp', JSON.stringify(DOCS)); fs.renameSync(FILE + '.tmp', FILE); } catch (e) { console.error('docs save failed', e.message); } }

const norm = s => String(s || '').toLowerCase().replace(/[^0-9a-z가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim();
export function grams(s) {
  const out = new Set(), t = norm(s);
  for (const w of t.split(' ')) { if (!w) continue; if (w.length === 1) out.add(w); for (let i = 0; i < w.length - 1; i++) out.add(w.slice(i, i + 2)); }
  return out;
}
const STOP = new Set(['뭐야', '설명', '명해', '해줘', '알려', '려줘', '어떻', '떻게', '이란', '란뭐', '대해', '무엇', '엇인', '인가', '인지', '하는', '있어', '나요', '해요', '주세', '세요']);
function chunk(text) {
  const parts = String(text).replace(/\r/g, '').split(/\n{2,}|(?<=[.?!。])\s+/), out = []; let cur = '';
  for (const p of parts) { if ((cur + ' ' + p).length > CHUNK && cur) { out.push(cur.trim()); cur = ''; } cur += (cur ? ' ' : '') + p; while (cur.length > CHUNK * 1.6) { out.push(cur.slice(0, CHUNK)); cur = cur.slice(CHUNK); } }
  if (cur.trim()) out.push(cur.trim());
  return out.slice(0, 1200);
}
const total = () => DOCS.reduce((n, d) => n + d.chars, 0);

export function listDocs() { return DOCS.map(d => ({ id: d.id, title: d.title, subject: d.subject, chars: d.chars, at: d.at, by: d.by })); }
export function addDoc({ title, subject, text, by }) {
  text = String(text || '').replace(/\u0000/g, '').slice(0, MAX_DOC).trim();
  title = String(title || '').trim().slice(0, 60) || text.slice(0, 20);
  if (text.length < 20) return { error: 'short' };
  if (total() + text.length > MAX_TOTAL) return { error: 'full' };
  if (DOCS.length >= 300) return { error: 'many' };
  const d = { id: randomUUID().slice(0, 8), title, subject: String(subject || '').slice(0, 12), by: by === 'parent' ? 'parent' : 'child', at: Date.now(), chars: text.length, chunks: chunk(text) };
  DOCS.push(d); persist(); return { ok: true, id: d.id, chunks: d.chunks.length };
}
export function delDoc(id) { const n = DOCS.length; DOCS = DOCS.filter(d => d.id !== id); if (DOCS.length !== n) persist(); return { ok: true }; }

// 흰둥이 지식 묶음(dist/shiro-kb.json) — 학교 자료 + 위키백과 개념, 매일 아침 갱신. 30분 캐시
let KB = { at: 0, data: { chunks: [] } };
const GC = new WeakMap();   // 지식 조각별 2글자 묶음 캐시(매 질문마다 다시 안 셈)
export async function loadKB() {
  if (Date.now() - KB.at < 30 * 60e3) return KB.data;
  let data = null;
  // 매일 아침 GitHub에 올라가는 최신본 → 사이트 배포본 → 서버에 있는 파일 순서
  const urls = [process.env.FC_KB_URL, 'https://raw.githubusercontent.com/Mespital/ApuDa/main/future-compass/dist/shiro-kb.json', (process.env.URL || 'https://future.apuda.app').replace(/\/$/, '') + '/shiro-kb.json'].filter(Boolean);
  for (const u of urls) { try { const r = await fetch(u, { signal: AbortSignal.timeout(4000) }); if (r.ok) { const d = await r.json(); if (d && Array.isArray(d.chunks)) { data = d; break; } } } catch {} }
  if (!data) try { data = JSON.parse(fs.readFileSync(new URL('../dist/shiro-kb.json', import.meta.url), 'utf8')); } catch {}
  if (data && Array.isArray(data.chunks)) KB = { at: Date.now(), data }; else KB.at = Date.now() - 25 * 60e3;   // 실패하면 5분 뒤 다시
  return KB.data;
}

// 질문과 가장 맞는 자료 조각 (점수 낮으면 없음)
export function searchDocs(q, k = 3, extra = [], kb = []) {
  const qg = [...grams(q)].filter(g => !STOP.has(g)); if (!qg.length) return [];
  const pool = [];
  DOCS.forEach(d => d.chunks.forEach((c, i) => pool.push({ title: d.title, subject: d.subject, text: c, kind: '자료', key: d.id + ':' + i })));
  (Array.isArray(extra) ? extra : []).slice(0, 40).forEach((n, i) => { if (n && n.text) pool.push({ title: String(n.title || '내 노트').slice(0, 40), text: String(n.text).slice(0, 1200), kind: '내 노트', key: 'n' + i }); });
  (Array.isArray(kb) ? kb : []).forEach((c, i) => { if (c && c.text) pool.push({ title: String(c.title || '학교 자료').slice(0, 80), subject: c.subject, text: String(c.text).slice(0, 1400), kind: c.src === '위키백과' ? '위키백과' : '학교 자료', src: c.src, url: c.url, ref: c, key: 'kb' + i }); });
  if (!pool.length) return [];
  const df = new Map(); const gs = pool.map(p => { let g = p.ref && GC.get(p.ref); if (!g) { g = grams(p.title + ' ' + p.text); if (p.ref) GC.set(p.ref, g); } g.forEach(x => df.set(x, (df.get(x) || 0) + 1)); return g; });
  const N = pool.length, maxScore = qg.reduce((s, g) => s + Math.log(1 + N / (1 + (df.get(g) || 0))), 0) || 1;
  const scored = pool.map((p, i) => { let s = 0; for (const g of qg) if (gs[i].has(g)) s += Math.log(1 + N / (df.get(g) || 1)); const { ref, ...q2 } = p; return { ...q2, score: s / maxScore }; })
    .filter(x => x.score >= (x.kind === '위키백과' ? 0.42 : 0.34) && (x.src !== 'AI 소식' || /AI|인공지능|뉴스|소식|미래/.test(q))).sort((a, b) => b.score - a.score);
  const top = scored.slice(0, k);
  // 학교 자료가 위를 다 차지해도, 잘 맞는 개념 사전(위키백과) 한 조각은 끼워 준다
  const wk = scored.find(x => x.kind === '위키백과' && x.score >= 0.5);
  if (wk && !top.includes(wk) && top.length >= k) top[k - 1] = wk;
  return top;
}

// 한국어 위키백과 요약 (공부 개념용)
const QW = new Set(['뭐야', '뭐지', '뭔가요', '무엇', '무엇인가요', '무엇이야', '설명해줘', '설명', '알려줘', '알려', '해줘', '좀', '대해', '대해서', '어떻게', '왜', '뜻', '개념', '정의', '쉽게', '간단히', '자세히', '공부', '어떤', '건가요', '인가요', '거야', '인지', '궁금해', '이게', '그게', '뭐', '말해줘', '가르쳐줘', '있어', '돼', '되는', '하는', '해']);
export function wikiQuery(q) {
  const toks = norm(q).split(' ').filter(Boolean).map(w => QW.has(w) ? '' : w.replace(/(이란|이랑|에서|으로|에게|이야|란|이|가|은|는|을|를|의|에|와|과|로|도)$/, '')).filter(w => w && !QW.has(w) && w.length >= 1);
  return toks.join(' ').slice(0, 60);
}
export async function searchWiki(q) {
  const term = wikiQuery(q); if (term.length < 2) return [];
  const UA = { 'user-agent': 'future-compass-study/1.0 (family study app; https://future.apuda.app)' };
  try {
    const s = await (await fetch('https://ko.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=2&srsearch=' + encodeURIComponent(term), { headers: UA, signal: AbortSignal.timeout(5000) })).json();
    const titles = (s.query?.search || []).map(x => x.title).slice(0, 2); if (!titles.length) return [];
    const e = await (await fetch('https://ko.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&titles=' + encodeURIComponent(titles.join('|')), { headers: UA, signal: AbortSignal.timeout(5000) })).json();
    return Object.values(e.query?.pages || {}).filter(p => p.extract && p.extract.length > 40)
      .map(p => ({ title: p.title, text: p.extract.slice(0, 1300), kind: '위키백과', url: 'https://ko.wikipedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_')) }));
  } catch { return []; }
}
// 개념·지식 질문인지(계획·감정·앱 사용 질문엔 검색 안 함)
export const knowledgeQ = q => /뭐야|뭐지|무엇|뜻|개념|정의|설명|차이|원리|이란|란\?|누구|언제|어디|왜|공식|법칙|사건|전쟁|조약|작품|작가|현상|구조|기능|특징/.test(q) && !/오늘|내일|계획|뭐부터|힘들|싫|앱|설정|시간표|알림|엄마/.test(q);

/* ── 공부 질문 잘 답하기 (2026-10-19) ──
   studyQ: 개념·풀이·문법 같은 공부 질문인지
   subjectOf: 질문이 어느 과목인지(2학기 공통과목 기준)
   gatherRefs: 지식 묶음 + 내 노트 + (개념 자료가 없으면) 위키백과, 그리고 그 과목의 교과서 단원·이번 달 진도 */
const APP_Q = /앱|설정|알림|버튼|화면|메뉴|로그인|비밀번호|동기화|백업|탭|급식|시간표|학원|일정|엄마|아빠|힘들|싫어|우울|짜증|불안/;
export const studyQ = q => !APP_Q.test(q) && (!!subjectOf(q) && /\?|어떻게|뭐|알려|정리|준비|차이|해줘|풀|구해|해석/.test(q) || /수행평가|보고서|발표\s*준비|어떻게\s*(변|되|돼|달라|일어나|작동|생겨|나와)|뭐야|뭐지|뭔지|무엇|뜻|개념|정의|설명|차이|원리|이유|왜|어떻게\s*(풀|구해|계산|증명|외우|해석)|풀어|풀이|구해|구하|계산|증명|공식|법칙|문법|해석|번역|영작|예문|요약|정리해|이해가?\s*안|모르겠|헷갈|알려줘|가르쳐|문제|답이|맞아\?|틀렸/.test(q));
const SUBJ = [
  ['공통수학2', '공통수학2', /수학|함수|방정식|부등식|도형|직선|좌표|원의|평행이동|대칭이동|집합|원소|명제|필요조건|충분조건|대우|역함수|합성함수|유리함수|무리함수|그래프|기울기|절댓값|이차|일차|\d\s*[x×*+\-=]/],
  ['통합과학2', '통합과학2', /통합과학|과학|산화|환원|산과|염기|중화|pH|진화|자연선택|변이|생물\s*다양성|지질\s*시대|화석|생태계|먹이|에너지|발전기|전자기|태양|기후|온난화|엘니뇨|광합성|세포|유전/],
  ['통합사회2', '통합사회2', /통합사회|사회|인권|헌법|시장|금융|경제|정의|문화|세계화|지속\s*가능|인구|자원|불평등|복지|국제|민주주의/],
  ['한국사2', '한국사', /한국사|역사|광복|해방|분단|6[.·]25|전쟁|민주화|산업화|유신|4[.·]19|5[.·]18|6월\s*민주|정부\s*수립|냉전|이승만|박정희|외환\s*위기|통일/],
  ['공통영어2', '공통영어2', /영어|관계(대명사|부사)|분사|가정법|부정사|동명사|수동태|시제|to\s|영작|영단어|단어\s*뜻|[A-Za-z]{4,}/],
  ['공통국어2', '공통국어2', /국어|문학|시의|시에서|소설|수필|화자|서술자|갈래|표현\s*방법|비유|운율|음운|형태소|품사|문장\s*성분|화법|작문|매체|논설|토론/]
];
export function subjectOf(q) {
  let best = null, n = 0;
  for (const s of SUBJ) { const m = String(q).match(new RegExp(s[2].source, 'g')); const c = m ? m.length : 0; if (c > n) { n = c; best = s; } }
  return best ? { course: best[0], evalName: best[1] } : null;
}
export async function gatherRefs(q0, notes, { web = true, history = [] } = {}) {
  // "막혔어", "더 쉽게" 같은 짧은 후속 질문은 바로 앞 질문과 합쳐서 찾는다
  const prevU = (Array.isArray(history) ? history : []).filter(m => m && m.r === 'u').map(m => String(m.t || '')).pop() || '';
  const q = String(q0).length < 15 && prevU ? prevU + ' ' + q0 : String(q0);
  const kb = await loadKB(), chunks = kb.chunks || [], study = studyQ(q) || (!!prevU && studyQ(prevU) && /막혔|모르|풀이|답|다시|쉽게|예시|더|왜/.test(q0));
  let refs = searchDocs(q, study ? 10 : 3, notes, chunks);
  const sj0 = study ? subjectOf(q) : null;
  if (sj0) { const base = sj0.course.replace(/\d$/, ''); refs = refs.filter(r => r.kind !== '학교 자료' || !r.subject || r.subject.replace(/\d$/, '') === base || r.subject === sj0.evalName); }   // 다른 과목 학교 자료는 빼기
  refs = refs.slice(0, study ? 4 : 3);
  const concept = refs.some(r => r.kind !== '학교 자료');
  if (web && (study || knowledgeQ(q)) && !concept) { const w = await searchWiki(q); if (w.length) refs = w.slice(0, 1).concat(refs).slice(0, 4); }
  if (!refs.length && web && knowledgeQ(q)) refs = await searchWiki(q);
  let ctx = null;
  const sj = study ? subjectOf(q) : null;
  if (sj) {
    const unit = chunks.find(c => c.title === sj.course + ' 단원 구성');
    const prog = chunks.find(c => c.title === sj.evalName + ' 2학기 진도표');
    const m = new Date(Date.now() + 9 * 3600e3).getUTCMonth() + 1;
    const now = prog ? String(prog.text).split('\n').filter(l => new RegExp('^(' + m + '|' + (m % 12 + 1) + ')월').test(l)).join('\n') : '';
    ctx = { subject: sj.course, units: unit ? String(unit.text).slice(0, 900) : '', progress: now.slice(0, 600) };
  }
  return { refs, study, ctx };
}
