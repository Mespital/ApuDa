// ApuDa E-Gen emergency-room status gateway.
// Source: NMC official API (data.go.kr/data/15000563/openapi.do).
// Configure EGEN_API_KEY in the Netlify site's environment variables, never in git.
const REGION = new Set(['서울특별시','부산광역시','대구광역시','인천광역시','광주광역시','대전광역시','울산광역시','세종특별자치시','경기도','강원특별자치도','강원도','충청북도','충청남도','전북특별자치도','전라북도','전라남도','경상북도','경상남도','제주특별자치도']);
const API_URL = 'https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire';
const cache = new Map();
const TTL_MS = 30000;
function xmlValue(xml, tag) {
  const match = xml.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'));
  return match ? match[1].replace(/&(?:amp|lt|gt|quot|apos|#(\d+));/g, (v, num) => num ? String.fromCodePoint(Number(num)) : ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"})[v] || v).trim() : '';
}
function json(value, status=200) {
  return new Response(JSON.stringify(value), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
function normalizeServiceKey(raw) {
  // Netlify accepts the decoded key; repair a pasted "Encoding" key once.
  const value=String(raw||'').trim();
  if (!/%[0-9a-f]{2}/i.test(value)) return value;
  try { return decodeURIComponent(value); } catch(_e) { return null; }
}
function upstreamFailure(status, body) {
  // Never return raw gateway responses, request URLs or credentials to browsers.
  const code=xmlValue(body,'returnReasonCode') || xmlValue(body,'resultCode');
  const auth=xmlValue(body,'returnAuthMsg') || xmlValue(body,'resultMsg') || '';
  const diagnostic='UPSTREAM_HTTP_'+status+(/^\d{1,3}$/.test(code)?'_CODE_'+code:'');
  if(code==='29' || /BLACKLIST_IP_ACCESS_ERROR/.test(auth))
    return {error:'provider_ip_blocked',diagnostic,message:'공공데이터 서비스가 서버 IP의 접근을 차단했습니다. 공공데이터포털 운영기관에 확인이 필요합니다.'};
  if(code==='30'||/SERVICE_KEY_IS_NOT_REGISTERED_ERROR/.test(auth))
    return {error:'api_key_invalid',diagnostic,message:'공공데이터 인증키가 인식되지 않았습니다. 활용신청 승인과 Netlify 일반 인증키(Decoding)를 확인해 주세요.'};
  if(code==='20'||status===401||status===403||/SERVICE_ACCESS_DENIED_ERROR|PERMISSION_DENIED/.test(auth))
    return {error:'api_permission_denied',diagnostic,message:'공공데이터 API의 사용 권한이 거부되었습니다. 활용신청 승인 상태와 인증키를 확인해 주세요.'};
  if(code==='22'||code==='23'||status===429)
    return {error:'api_rate_limited',diagnostic,message:'공공데이터 호출 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.'};
  if(code==='10')
    return {error:'invalid_api_parameters',diagnostic,message:'공공데이터 요청 지역을 처리하지 못했습니다. 시·도/시·군·구를 확인해 주세요.'};
  if(status>=500||code==='01'||code==='05')
    return {error:'provider_unavailable',diagnostic,message:'공공데이터 서버에서 장애 또는 지연이 발생했습니다. 잠시 후 다시 시도해 주세요.'};
  return {error:'upstream_unavailable',diagnostic,message:'공공데이터 응답을 확인할 수 없습니다. 잠시 후 다시 시도하거나 공식 E-Gen을 이용해 주세요.'};
}
export default async function handler(request) {
  if(request.method !== 'GET') return json({error:'method_not_allowed'},405);
  const params = new URL(request.url).searchParams;
  const stage1 = (params.get('stage1') || '').trim();
  const stage2 = (params.get('stage2') || '').trim();
  if(!REGION.has(stage1) || !/^[가-힣0-9\s-]{1,40}$/.test(stage2)) {
    return json({error:'invalid_region',message:'시·도와 시·군·구를 정확히 입력하세요.'},400);
  }
  const key = normalizeServiceKey(process.env.EGEN_API_KEY);
  if(key===null) return json({error:'invalid_key_format',message:'Netlify 인증키 형식에 오류가 있습니다. 공공데이터포털의 일반 인증키(Decoding)를 다시 등록해 주세요.'},503);
  if(!key) return json({error:'not_configured',message:'API 인증키가 아직 등록되지 않았습니다. E-Gen 공식 사이트를 이용해 주세요.'},503);
  const cacheKey = stage1+'|'+stage2;
  const cached = cache.get(cacheKey);
  if(cached && Date.now()-cached.time<TTL_MS) return json(cached.data);
  const upstream = new URL(API_URL);
  upstream.searchParams.set('serviceKey', key);
  upstream.searchParams.set('STAGE1',stage1);
  upstream.searchParams.set('STAGE2',stage2);
  upstream.searchParams.set('pageNo','1');
  upstream.searchParams.set('numOfRows','100');
  try {
    const response = await fetch(upstream,{method:'GET',signal:AbortSignal.timeout(9000),headers:{accept:'application/xml,text/xml'}});
    // HTTP errors often contain an XML authentication code; read it safely.
    const raw = await response.text();
    if(raw.length>1200000) return json({error:'upstream_invalid',message:'공공데이터 응답 크기가 올바르지 않습니다.'},502);
    if(!response.ok) return json(upstreamFailure(response.status,raw),502);
    if(xmlValue(raw,'resultCode')!=='00') return json(upstreamFailure(response.status,raw),502);
    const hospitals = [...raw.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,100).map(m => {
      const item=m[1];
      const bedsRaw=xmlValue(item,'hvec');
      return {
        id:xmlValue(item,'hpid'),
        name:xmlValue(item,'dutyname')||xmlValue(item,'dutyName'),
        telephone:xmlValue(item,'dutytel3')||xmlValue(item,'dutyTel3'),
        emergencyBeds:/^\d+$/.test(bedsRaw)?Number(bedsRaw):null,
        reportedAt:xmlValue(item,'hvidate'),
        ct:xmlValue(item,'hvctayn'),
        mri:xmlValue(item,'hvmriayn')
      };
    }).filter(h=>h.name);
    const data={
      stage1,stage2,source:'국립중앙의료원 전국 응급의료기관 정보 조회 서비스',
      fetchedAt:new Date().toISOString(),total:Number(xmlValue(raw,'totalCount'))||hospitals.length,
      hospitals,notice:'표시된 병상 수는 환자 수용 확정 정보가 아닙니다. 위급하면 119에 먼저 신고하세요.'
    };
    if(cache.size>30) cache.clear();
    cache.set(cacheKey,{data,time:Date.now()});
    return json(data);
  }catch(_error) {
    return json({error:'upstream_timeout',message:'공공데이터 조회가 지연되고 있습니다. 119 또는 E-Gen 공식 사이트를 이용해 주세요.'},502);
  }
}
