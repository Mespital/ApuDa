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

const RULES_PARENT = `너는 '흰둥이'야. 고등학교 1학년 승준이의 공부방 앱 도우미이고, 지금은 엄마와 이야기하고 있어.
말투: 부드러운 존댓말, 짧게(2~5문장).
할 일:
- 앱 사용법은 [앱 안내]를 근거로 알려드려. 없는 기능은 지어내지 마.
- 승준이를 어떻게 도와줄지 물으시면 [오늘 정보]를 보고 '감시·확인'보다 '도와주기·응원' 쪽으로 구체적인 한두 가지를 제안해. 점수·비교·잔소리 표현은 피하도록 권해.
- 공부·진로 일반 질문은 균형 있게 답하되 단정하지 마. 의료·법률 판단은 하지 마.`;

export function buildPayload({ role, q, history, ctx, guide, refs }) {
  const parent = role === 'parent';
  const sys = (parent ? RULES_PARENT : RULES_CHILD) +
    '\n\n[앱 안내]\n' + clip((Array.isArray(guide) ? guide : []).map(g => '- ' + clip(g, 700)).join('\n') || '(관련 안내 없음)', 3000) +
    '\n\n[오늘 정보]\n' + clip(typeof ctx === 'string' ? ctx : JSON.stringify(ctx || {}), 3500) +
    (Array.isArray(refs) && refs.length ? '\n\n[참고 자료]\n' + refs.map((r, i) => '(' + (i + 1) + ') [' + r.kind + '] ' + clip(r.title, 60) + '\n' + clip(r.text, 1300)).join('\n\n') +
      '\n\n[자료 사용 규칙] 공부 질문이면 위 참고 자료를 근거로 답해. 자료에 있는 내용과 다르게 말하지 마. 마지막 줄에 "📎 출처: 자료 제목"을 써(위키백과면 "위키백과: 제목"). 자료에 답이 없으면 "자료에는 없어"라고 먼저 말하고 아는 범위에서 조심스럽게 답해.' : '');
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
  return { system: sys, messages: msgs };
}

export async function askClaude({ apiKey, model, payload, timeoutMs = 25000 }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: model || MODEL, max_tokens: 600, temperature: 0.4, system: payload.system, messages: payload.messages }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('upstream'); e.status = r.status; e.detail = j && j.error && j.error.type; throw e; }
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
  return clip(text, 2000);
}

export function validQuestion(q) { return typeof q === 'string' && q.trim().length >= 1 && q.length <= 500; }

// ChatGPT(OpenAI)로 답하기 — OPENAI_API_KEY 가 있을 때. 모델은 FC_OPENAI_MODEL (기본 gpt-4o-mini)
export async function askOpenAI({ apiKey, model, payload, timeoutMs = 25000 }) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ model: model || 'gpt-4o-mini', max_tokens: 600, temperature: 0.4, messages: [{ role: 'system', content: payload.system }, ...payload.messages] }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('upstream'); e.status = r.status; throw e; }
  return clip(((j.choices || [])[0] || {}).message?.content || '', 2000).trim();
}
// 무료: VPS에 직접 띄운 오픈소스 모델(Ollama). OLLAMA_MODEL 이 있을 때. CPU라 느려서 답을 짧게
export async function askOllama({ base, model, payload, timeoutMs = 100000 }) {
  const r = await fetch((base || 'http://ollama:11434').replace(/\/$/, '') + '/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 380, temperature: 0.4, messages: [{ role: 'system', content: payload.system + '\n반드시 자연스러운 한국어로만, 4문장 이내로 답해. 한자·중국어·일본어를 절대 섞지 마. 모르는 건 지어내지 말고 모른다고 해.' }, ...payload.messages] }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('upstream'); e.status = r.status; throw e; }
  return clip(((j.choices || [])[0] || {}).message?.content || '', 2000).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}
// 어떤 AI를 쓸지: FC_CHAT_PROVIDER=ollama|openai|claude 로 고정 가능, 아니면 있는 것 순서대로 (Claude → ChatGPT → 무료 Ollama)
export async function askAI(env, payload, timeoutMs) {
  const prov = (env.FC_CHAT_PROVIDER || '').toLowerCase(), ak = env.ANTHROPIC_API_KEY, ok = env.OPENAI_API_KEY, lm = env.OLLAMA_MODEL;
  const order = prov === 'ollama' ? ['l', 'c', 'o'] : prov === 'openai' ? ['o', 'c', 'l'] : ['c', 'o', 'l'];
  let last;
  for (const w of order) {
    try {
      if (w === 'c' && ak) return await askClaude({ apiKey: ak, model: env.FC_CHAT_MODEL, payload, timeoutMs });
      if (w === 'o' && ok) return await askOpenAI({ apiKey: ok, model: env.FC_OPENAI_MODEL, payload, timeoutMs });
      if (w === 'l' && lm) return await askOllama({ base: env.OLLAMA_URL, model: lm, payload });
    } catch (e) { last = e; }
  }
  throw last || Object.assign(new Error('no_ai'), { status: 0 });
}
export const hasAI = env => !!(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY || env.OLLAMA_MODEL);
