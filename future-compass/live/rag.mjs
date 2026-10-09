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

// 질문과 가장 맞는 자료 조각 (점수 낮으면 없음)
export function searchDocs(q, k = 3, extra = []) {
  const qg = [...grams(q)].filter(g => !STOP.has(g)); if (!qg.length) return [];
  const pool = [];
  DOCS.forEach(d => d.chunks.forEach((c, i) => pool.push({ title: d.title, subject: d.subject, text: c, kind: '자료', key: d.id + ':' + i })));
  (Array.isArray(extra) ? extra : []).slice(0, 40).forEach((n, i) => { if (n && n.text) pool.push({ title: String(n.title || '내 노트').slice(0, 40), text: String(n.text).slice(0, 1200), kind: '내 노트', key: 'n' + i }); });
  if (!pool.length) return [];
  const df = new Map(); const gs = pool.map(p => { const g = grams(p.title + ' ' + p.text); g.forEach(x => df.set(x, (df.get(x) || 0) + 1)); return g; });
  const N = pool.length, maxScore = qg.reduce((s, g) => s + Math.log(1 + N / (1 + (df.get(g) || 0))), 0) || 1;
  const scored = pool.map((p, i) => { let s = 0; for (const g of qg) if (gs[i].has(g)) s += Math.log(1 + N / (df.get(g) || 1)); return { ...p, score: s / maxScore }; })
    .filter(x => x.score >= 0.34).sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
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
