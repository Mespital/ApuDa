// 흰둥이 똑똑 모드: 공부방 맥락 + 사용법 안내를 붙여 Claude에게 물어본다.
// Netlify(family.mjs)와 VPS(live/server.mjs)가 같은 규칙을 쓴다.
const MODEL = 'claude-haiku-4-5-20251001';
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);

const RULES_CHILD = `너는 '흰둥이'야. 승준(고등학교 1학년)의 공부방 앱에 사는 하얀 강아지 도우미.
말투: 친근한 반말, 짧게(보통 2~5문장). 이모지는 1~2개만. 잔소리·훈계 금지, 비교 금지.
할 일:
- 앱 사용법을 물으면 [앱 안내]를 근거로 정확히 알려줘. 안내에 없는 기능은 지어내지 말고 "아직 없어"라고 해.
- 오늘 뭐부터 할지·계획을 물으면 [오늘 정보](시간표·할 일 A/B/C·시험 D-day·학원·일정·공부 기록)를 보고 구체적으로 1~3개만 골라줘. 시간이 빠듯하면 줄여줘.
- 공부 내용을 물으면 개념을 쉽게 설명하고 힌트·풀이 방향을 줘. 숙제·수행평가·보고서를 통째로 대신 써주지 말고, 스스로 해볼 다음 한 걸음을 질문으로 제안해.
- 지치거나 속상해 보이면 먼저 공감하고, 오늘은 가볍게 해도 된다고 해줘. 마음이 많이 힘들거나 위험한 얘기면 엄마·아빠나 선생님께 바로 말하라고 하고, 청소년상담 1388(전화·문자)을 알려줘.
- 모르는 건 모른다고 해. 의료·법률 판단은 하지 마. 개인정보(주소·전화번호 등)는 묻지 마.
- 엄마가 지켜본다는 느낌의 말은 하지 마. 기록은 승준이를 위한 거야.`;

// 공부 질문일 때만 붙는 규칙 (개념·풀이·문법). 앱 말풍선은 글자만 보여서 수식·마크다운을 못 그린다
const RULES_STUDY = `
[공부 질문 답하는 법] 지금은 공부 질문이야. 꼭 필요한 정보만 적당히(보통 4~8줄). 길게 강의하지 마.
- 수준: 2022 개정 교육과정 고1 2학기 공통과목(공통수학2·통합과학2·통합사회2·한국사2·공통영어2·공통국어2). 교과서 용어를 그대로 써. 고1 범위를 넘는 내용이면 "고1 범위 밖이야" 한 줄 붙이고 짧게.
- 개념 질문 순서: ① 한 줄 핵심 ② 쉬운 설명(필요하면 비유 1개) ③ 짧은 예시 1개 ④ 마지막에 "확인 질문:" 1개(답은 쓰지 마). 시험 포인트는 꼭 필요할 때만 1줄.
- 문제 풀이 요청: 처음엔 (1) 무엇을 묻는지 (2) 쓸 개념·공식 (3) 첫 단계까지만 보여주고 "다음 단계 해볼래?"로 끝내. 승준이가 "답 알려줘·풀이 보여줘·막혔어"라고 하거나 같은 문제를 다시 물으면 전체 풀이를 단계마다 한 줄씩 쓰고, 마지막에 검산까지 해.
- 수학 표기: 앱이 수식을 못 그려. LaTeX·$·\\frac·\\sqrt 금지. x², x³, √3, π, ≤, ≥, ≠, ×, ÷ 같은 기호와 (a+b)/2 같은 괄호 분수로 써.
- 영어: 예문(영어) + 해석(한국어)을 같이. 문법 용어는 한국 교과서 용어(관계대명사·현재분사 등).
- 국어·사회·한국사: 핵심 개념을 교과서 단원과 연결하고, 연도·인물·사건은 확실한 것만. 애매하면 "(교과서로 확인해줘)".
- 형식: 마크다운 금지(#, **, 표, 코드블록). 줄바꿈과 ①②③, • 만 써.
- 정확성: 틀린 설명보다 짧은 설명이 나아. 확실하지 않은 수치·연도는 쓰지 마. [참고 자료]·[승준이 과목 맥락]과 다르게 말하지 마.
- 수행평가·보고서·글쓰기: 대신 써주지 마. 대신 구성 틀(개요), [학교 자료]의 만점 기준 체크리스트, 승준이가 쓴 글에 대한 피드백은 해줘.
- [승준이 과목 맥락]에 이번 달 진도가 있으면, 질문이 진도·시험 범위와 이어질 때 "지금 ○○ 단원이랑 이어져" 한 줄로 연결해.`;

const RULES_PARENT = `너는 '흰둥이'야. 고등학교 1학년 승준이의 공부방 앱 도우미이고, 지금은 엄마와 이야기하고 있어.
말투: 부드러운 존댓말, 짧게(2~5문장).
할 일:
- 앱 사용법은 [앱 안내]를 근거로 알려드려. 없는 기능은 지어내지 마.
- 승준이를 어떻게 도와줄지 물으시면 [오늘 정보]를 보고 '감시·확인'보다 '도와주기·응원' 쪽으로 구체적인 한두 가지를 제안해. 점수·비교·잔소리 표현은 피하도록 권해.
- 공부·진로 일반 질문은 균형 있게 답하되 단정하지 마. 의료·법률 판단은 하지 마.`;

export function buildPayload({ role, q, history, ctx, guide, refs, study, studyCtx }) {
  const parent = role === 'parent';
  const sys = (parent ? RULES_PARENT : RULES_CHILD) + (study ? RULES_STUDY + (parent ? '\n(지금은 엄마가 물어보셨으니 존댓말로, 승준이에게 설명해 줄 수 있게 정리해 드려.)' : '') : '') +
    (studyCtx && studyCtx.subject ? '\n\n[승준이 과목 맥락] 과목: ' + studyCtx.subject + (studyCtx.units ? '\n교과서 단원: ' + clip(studyCtx.units, 900) : '') + (studyCtx.progress ? '\n이번 달·다음 달 진도(학교 평가계획):\n' + clip(studyCtx.progress, 600) : '') : '') +
    '\n\n[앱 안내]\n' + clip((Array.isArray(guide) ? guide : []).map(g => '- ' + clip(g, 700)).join('\n') || '(관련 안내 없음)', 3000) +
    '\n\n[오늘 정보]\n' + clip(typeof ctx === 'string' ? ctx : JSON.stringify(ctx || {}), 3500) +
    (Array.isArray(refs) && refs.length ? '\n\n[참고 자료]\n' + refs.map((r, i) => '(' + (i + 1) + ') [' + r.kind + '] ' + clip(r.title, 60) + '\n' + clip(r.text, 1300)).join('\n\n') +
      '\n\n[자료 사용 규칙] 공부 질문이면 위 참고 자료를 근거로 답해. 자료에 있는 내용과 다르게 말하지 마. 마지막 줄에 "📎 출처: 자료 제목"을 써(위키백과면 "위키백과: 제목"). [학교 자료]는 서초고 공식 자료(평가계획·가정통신문·나이스)를 자동으로 모은 거야: 날짜·범위·배점은 그대로 옮기고, "최종은 학교 공지와 선생님 말씀이 기준"이라고 한 번 덧붙여. 자료에 답이 없으면 "자료에는 없어"라고 먼저 말하고 아는 범위에서 조심스럽게 답해.' : '');
  const msgs = [];
  (Array.isArray(history) ? history : []).slice(-8).forEach(m => {
    if (!m || (m.r !== 'u' && m.r !== 'a')) return;
    const content = clip(m.t, 800).trim(); if (!content) return;
    const r = m.r === 'u' ? 'user' : 'assistant';
    if (msgs.length && msgs[msgs.length - 1].role === r) msgs[msgs.length - 1].content += '\n' + content; else msgs.push({ role: r, content });
  });
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  const question = clip(q, 500).trim();
  if (msgs.length && msgs[msgs.length - 1].role === 'user') msgs[msgs.length - 1].content += '\n' + question; else msgs.push({ role: 'user', content: question });
  return study ? { system: sys, messages: msgs, study: true, maxTokens: 750 } : { system: sys, messages: msgs };
}

export async function askClaude({ apiKey, model, payload, timeoutMs = 25000 }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: model || MODEL, max_tokens: payload.maxTokens || 600, temperature: payload.study ? 0.3 : 0.4, system: payload.system, messages: payload.messages }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('upstream'); e.status = r.status; e.detail = j && j.error && j.error.type; throw e; }
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
  return plain(clip(text, payload.study ? 2600 : 2000));
}

// 말풍선은 글자만 보여서, 혹시 섞인 마크다운·LaTeX를 읽기 쉬운 글자로 바꾼다
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', n: 'ⁿ', '-': '⁻' };
export function plain(t) {
  return String(t || '')
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/^```.*$/gm, '').replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$?([^$]+)\$\$?/g, '$1').replace(/\\\(|\\\)|\\\[|\\\]/g, '')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\le(q)?\b/g, '≤').replace(/\\ge(q)?\b/g, '≥').replace(/\\neq?\b/g, '≠').replace(/\\pi\b/g, 'π').replace(/\\pm/g, '±')
    .replace(/\^\{([0-9n-]{1,3})\}|\^([0-9n])/g, (m, a, b) => (a || b).split('').map(c => SUP[c] || c).join(''))
    .replace(/\\(left|right)/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

export function validQuestion(q) { return typeof q === 'string' && q.trim().length >= 1 && q.length <= 500; }

// ChatGPT(OpenAI)로 답하기 — OPENAI_API_KEY 가 있을 때. 모델은 FC_OPENAI_MODEL (기본 gpt-4o-mini)
export async function askOpenAI({ apiKey, model, payload, timeoutMs = 25000 }) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ model: model || 'gpt-4o-mini', max_tokens: payload.maxTokens || 600, temperature: 0.4, messages: [{ role: 'system', content: payload.system }, ...payload.messages] }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('upstream'); e.status = r.status; throw e; }
  return plain(clip(((j.choices || [])[0] || {}).message?.content || '', payload.study ? 3500 : 2000));
}
// 무료: VPS에 직접 띄운 오픈소스 모델(Ollama). OLLAMA_MODEL 이 있을 때. CPU라 느려서 답을 짧게
export async function askOllama({ base, model, payload, timeoutMs = 100000 }) {
  timeoutMs = payload.long || payload.study ? 240000 : timeoutMs;
  // 작은 무료 모델(CPU)은 긴 규칙을 잘 못 따라서, 공부 질문엔 짧은 규칙 + 짧은 답
  if (payload.study) payload = { ...payload, maxTokens: 520, system: payload.system.replace(/\[공부 질문 답하는 법\][\s\S]*?(?=\n\n\[|$)/, '[공부 질문] 고1 교과서 수준으로: 한 줄 핵심 → 쉬운 설명 → 예시 1개 → 확인 질문 1개. 문제는 첫 단계만 알려주고, "풀이 보여줘"라고 하면 단계별로 끝까지. 수식은 x², √3 같은 글자로. 확실하지 않으면 모른다고 해.') };
  const r = await fetch((base || 'http://ollama:11434').replace(/\/$/, '') + '/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: payload.maxTokens || 380, temperature: 0.4, messages: [{ role: 'system', content: payload.system + (payload.long ? '\n반드시 자연스러운 한국어로만 답해.' : payload.study ? '\n반드시 자연스러운 한국어로만, 8줄 이내로 답해.' : '\n반드시 자연스러운 한국어로만, 4문장 이내로 답해.') + ' 한자·중국어·일본어를 절대 섞지 마. 모르는 건 지어내지 말고 모른다고 해.' }, ...payload.messages] }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('upstream'); e.status = r.status; throw e; }
  return plain(clip(((j.choices || [])[0] || {}).message?.content || '', 2500).replace(/<think>[\s\S]*?<\/think>/g, ''));
}
// 지금 먼저 쓰는 AI 이름(설정 화면 안내용): claude | openai | ollama | ''
export function providerOf(env) {
  const prov = (env.FC_CHAT_PROVIDER || '').toLowerCase(), have = { claude: !!env.ANTHROPIC_API_KEY, openai: !!env.OPENAI_API_KEY, ollama: !!env.OLLAMA_MODEL };
  const order = prov === 'ollama' ? ['ollama', 'claude', 'openai'] : prov === 'openai' ? ['openai', 'claude', 'ollama'] : ['claude', 'openai', 'ollama'];
  return order.find(k => have[k]) || '';
}
// 어떤 AI를 쓸지: FC_CHAT_PROVIDER=ollama|openai|claude 로 고정 가능, 아니면 있는 것 순서대로 (Claude → ChatGPT → 무료 Ollama)
export async function askAI(env, payload, timeoutMs) {
  const prov = (env.FC_CHAT_PROVIDER || '').toLowerCase(), ak = env.ANTHROPIC_API_KEY, ok = env.OPENAI_API_KEY, lm = env.OLLAMA_MODEL;
  const order = prov === 'ollama' ? ['l', 'c', 'o'] : prov === 'openai' ? ['o', 'c', 'l'] : ['c', 'o', 'l'];
  let last;
  for (const w of order) {
    try {
      if (w === 'c' && ak) {
        const sm = payload.study && env.FC_STUDY_MODEL;   // 공부 질문은 더 똑똑한 모델(있으면), 안 되면 기본 모델로
        if (sm) { try { return await askClaude({ apiKey: ak, model: sm, payload, timeoutMs: Math.max(timeoutMs || 0, 45000) }); } catch (e) { last = e; } }
        return await askClaude({ apiKey: ak, model: env.FC_CHAT_MODEL, payload, timeoutMs });
      }
      if (w === 'o' && ok) return await askOpenAI({ apiKey: ok, model: env.FC_OPENAI_MODEL, payload, timeoutMs });
      if (w === 'l' && lm) return await askOllama({ base: env.OLLAMA_URL, model: lm, payload });
    } catch (e) { last = e; }
  }
  throw last || Object.assign(new Error('no_ai'), { status: 0 });
}
export const hasAI = env => !!(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY || env.OLLAMA_MODEL);

// 수업 사진·노트 정리 (복습·다음 수업 예습용)
export function organizePayload({ subject, text, kind }) {
  const sys = `너는 고등학교 1학년 승준이의 공부 정리 도우미야. 아래 글은 승준이가 ${kind === 'talk' ? '수업 끝나고 말로 정리한 내용' : '수업 후 찍은 교과서·필기 사진에서 글자 인식(OCR)으로 읽은 내용'}이야. OCR이면 오타·깨진 글자가 있을 수 있어.
아래 형식 그대로, 원문에 있는 내용만으로 정리해. 원문에 없는 내용은 지어내지 마. 읽기 어려운 부분은 "(사진 확인 필요)"라고 써.
📌 핵심 정리
- (3~5줄, 쉬운 말로)
🔑 꼭 알아야 할 용어
- 용어: 뜻 (최대 5개)
❓ 스스로 확인 질문
- (3개, 답은 쓰지 마)
➡️ 다음 수업 전에 볼 것
- (1~2줄)`;
  return { system: sys, messages: [{ role: 'user', content: '과목: ' + clip(subject, 20) + '\n\n' + clip(text, 3500) }], maxTokens: 900, long: true };
}
