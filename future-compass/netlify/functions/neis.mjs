// 나이스 교육정보 개방포털 프록시: 인증키를 숨기고, 허용된 서비스·파라미터만 통과시킨다.
// 키(NEIS_API_KEY)가 없으면 키 없이 호출한다(샘플 5건 제한, 추정).
const ALLOW = {
  schoolInfo: ['SCHUL_NM', 'SCHUL_KND_SC_NM', 'ATPT_OFCDC_SC_CODE', 'SD_SCHUL_CODE'],
  SchoolSchedule: ['ATPT_OFCDC_SC_CODE', 'SD_SCHUL_CODE', 'AA_FROM_YMD', 'AA_TO_YMD'],
  mealServiceDietInfo: ['ATPT_OFCDC_SC_CODE', 'SD_SCHUL_CODE', 'MLSV_FROM_YMD', 'MLSV_TO_YMD'],
  hisTimetable: ['ATPT_OFCDC_SC_CODE', 'SD_SCHUL_CODE', 'AY', 'SEM', 'GRADE', 'CLASS_NM', 'TI_FROM_YMD', 'TI_TO_YMD'],
};
const TTL = { schoolInfo: 86400, SchoolSchedule: 3600, mealServiceDietInfo: 3600, hisTimetable: 3600 };
const OK_VALUE = /^[0-9A-Za-z가-힣 ._-]{1,40}$/;

export function buildUrl(params, key) {
  const svc = params.get('svc');
  if (!ALLOW[svc]) return { error: 'unknown service' };
  const q = new URLSearchParams({ Type: 'json', pIndex: '1', pSize: svc === 'schoolInfo' ? '30' : '400' });
  for (const name of ALLOW[svc]) {
    const v = params.get(name);
    if (v == null || v === '') continue;
    if (!OK_VALUE.test(v)) return { error: 'bad parameter ' + name };
    q.set(name, v);
  }
  if (svc === 'schoolInfo' && !q.get('SCHUL_NM') && !q.get('SD_SCHUL_CODE')) return { error: 'SCHUL_NM required' };
  if (svc !== 'schoolInfo' && (!q.get('ATPT_OFCDC_SC_CODE') || !q.get('SD_SCHUL_CODE'))) return { error: 'school required' };
  if (key) q.set('KEY', key);
  return { svc, url: 'https://open.neis.go.kr/hub/' + svc + '?' + q.toString() };
}

export function rowsOf(svc, data) {
  const blocks = data && data[svc];
  if (!blocks) {
    const code = data && data.RESULT && data.RESULT.CODE;
    if (code === 'INFO-200') return [];
    throw new Error(code || 'NEIS error');
  }
  const b = blocks.find(x => x.row);
  return b ? b.row : [];
}

const json = (body, status = 200, ttl = 0) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60',
    ...(ttl ? { 'netlify-cdn-cache-control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl}` } : {}),
  },
});

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  const params = new URL(req.url).searchParams;
  const key = (globalThis.Netlify?.env?.get('NEIS_API_KEY') || process.env.NEIS_API_KEY || '').trim();
  const built = buildUrl(params, key);
  if (built.error) return json({ error: built.error }, 400);
  try {
    const res = await fetch(built.url, { headers: { 'user-agent': 'SchoolCompass/0.1' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return json({ error: 'upstream ' + res.status }, 502);
    const rows = rowsOf(built.svc, await res.json());
    return json({ keyed: !!key, rows }, 200, TTL[built.svc]);
  } catch (e) {
    return json({ error: 'upstream', detail: String(e.message || e).slice(0, 80) }, 502);
  }
};

export const config = { path: '/api/neis' };
