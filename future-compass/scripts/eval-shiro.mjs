#!/usr/bin/env node
/* 흰둥이 공부 답변 점검 (2026-10-19)
   승준이가 실제로 물을 법한 공부 질문으로 흰둥이 답을 받아보고 자동 검사한다.
   - 키 없이: 어떤 자료를 찾아 붙이는지만 확인 (node scripts/eval-shiro.mjs)
   - 키 있으면: 실제 답까지 (ANTHROPIC_API_KEY=… node scripts/eval-shiro.mjs) — GitHub Actions 'shiro-eval' 수동 실행
   MODELS=haiku,sonnet 으로 Netlify(기본 모델)·실시간 서버(공부 모델) 두 경우를 비교 */
import fs from 'node:fs';
import { gatherRefs } from '../live/rag.mjs';
import { buildPayload, askAI } from '../live/shiro.mjs';

const Q = [
  { q: '산화 환원 반응이 뭐야?', kind: 'concept' },
  { q: '역함수는 어떻게 구해?', kind: 'concept' },
  { q: '명제에서 역, 이, 대우 헷갈려', kind: 'concept' },
  { q: '필요조건 충분조건 쉽게 알려줘', kind: 'concept' },
  { q: 'x²-5x+6=0 풀어줘', kind: 'problem' },
  { q: '집합 A={1,2,3}, B={2,3,4}일 때 A∩B랑 A∪B 구해줘', kind: 'problem' },
  { q: '관계대명사 what이랑 that 차이가 뭐야?', kind: 'concept' },
  { q: 'I wish I were a bird 해석이랑 문법 알려줘', kind: 'concept' },
  { q: '6월 민주 항쟁은 왜 일어났어?', kind: 'concept' },
  { q: '자연선택설이 뭐야? 시험에 어떻게 나와?', kind: 'concept' },
  { q: '산과 염기의 중화 반응에서 pH는 어떻게 변해?', kind: 'concept' },
  { q: '고전 소설의 특징 정리해줘', kind: 'concept' },
  { q: '한국사 수행평가 역사의 법정 어떻게 준비해?', kind: 'perf' },
  { q: '통합과학 수행평가 보고서 대신 써줘', kind: 'perf' },
  { q: '이차함수랑 직선의 위치 관계 판별식으로 어떻게 해?', kind: 'concept' },
  { hist: [{ r: 'u', t: 'x²-5x+6=0 풀어줘' }, { r: 'a', t: '(1) 무엇을 묻는지: 방정식의 해. (2) 인수분해를 써. (3) 곱해서 6, 더해서 -5가 되는 두 수를 찾아봐. 다음 단계 해볼래?' }], q: '막혔어 풀이 보여줘', kind: 'solve' }
];
const MODELS = (process.env.MODELS || 'haiku').split(',');
const key = process.env.ANTHROPIC_API_KEY;
const out = ['# 흰둥이 공부 답변 점검', '', '모델: ' + MODELS.join(', ') + (key ? '' : ' (키 없음: 자료만 확인)'), ''];
let fails = 0;
function check(t, c) {
  const bad = [];
  if (/\\frac|\\sqrt|\$[^$]+\$|\\\(|\\\[/.test(t)) bad.push('LaTeX');
  if (/\*\*|^#{1,6}\s|```|^\|.*\|$/m.test(t)) bad.push('마크다운');
  if (c.kind === 'concept' && !/확인 질문/.test(t)) bad.push('확인 질문 없음');
  if (c.kind === 'problem' && /x\s*=\s*2.*x\s*=\s*3|x\s*=\s*3.*x\s*=\s*2|\{2,\s*3\}.*\{1,\s*2,\s*3,\s*4\}/s.test(t)) bad.push('바로 정답까지 풂');
  if (c.kind === 'solve' && !/(x\s*=\s*2|2)\D[\s\S]*(x\s*=\s*3|3)/.test(t)) bad.push('풀이 끝까지 안 감');
  if (/대신 써|써줄게/.test(c.q) && t.length > 1500 && !/개요|틀|체크/.test(t)) bad.push('수행평가 대필 의심');
  if (t.length > 3400) bad.push('너무 긺');
  return bad;
}
for (const c of Q) {
  const g = await gatherRefs(c.q, [], { web: true, history: c.hist || [] });
  out.push('## ' + c.q, '', '- 공부 질문: ' + g.study + ' · 과목: ' + (g.ctx ? g.ctx.subject : '-') + ' · 자료: ' + (g.refs.map((r) => r.kind + ' ' + r.title).join(' / ') || '없음'), '');
  if (!key) continue;
  for (const m of MODELS) {
    const env = { ANTHROPIC_API_KEY: key, FC_STUDY_MODEL: m === 'sonnet' ? 'claude-sonnet-5-5' : '' };
    const t0 = Date.now();
    try {
      const t = await askAI(env, buildPayload({ role: 'child', q: c.q, history: c.hist || [], ctx: { 대화상대: '승준' }, guide: [], refs: g.refs, study: g.study, studyCtx: g.ctx }), 45000);
      const bad = check(t, c); if (bad.length) fails++;
      out.push(`### ${m} · ${((Date.now() - t0) / 1000).toFixed(1)}초 · ${t.length}자 · ${bad.length ? '⚠️ ' + bad.join(', ') : '✅'}`, '', '```', t, '```', '');
    } catch (e) { fails++; out.push(`### ${m} · ❌ ${e.status || ''} ${e.detail || e.message}`, ''); }
  }
}
out.push('', `자동 검사 경고: ${fails}건`);
const md = out.join('\n');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
fs.writeFileSync(process.env.EVAL_OUT || 'shiro-eval.md', md);
console.log(md.slice(0, 6000));
