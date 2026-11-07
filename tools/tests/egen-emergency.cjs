// Offline contract check for the E-Gen gateway; does not call the public API.
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const file=path.resolve(__dirname,'../../public-site/netlify/functions/egen-emergency.mjs');
  const {default:handle}=await import(pathToFileURL(file).href);
  const request=(region,district)=>new Request('https://apuda.app/.netlify/functions/egen-emergency?'+new URLSearchParams({stage1:region,stage2:district}));
  const invalid=await handle(request('INVALID','강남구'));
  assert.equal(invalid.status,400);
  const saved=process.env.EGEN_API_KEY;
  delete process.env.EGEN_API_KEY;
  const unconfigured=await handle(request('서울특별시','강남구'));
  assert.equal(unconfigured.status,503);
  process.env.EGEN_API_KEY='test+secret/=';
  const oldFetch=global.fetch;
  let called;
  global.fetch=async function(url){
    called=new URL(String(url));
    return new Response('<response><header><resultCode>00</resultCode></header><body><totalCount>1</totalCount><items><item><hpid>A001</hpid><dutyName>예시&amp;병원</dutyName><dutyTel3>02-1234-5678</dutyTel3><hvec>3</hvec><hvidate>2026-11-05 09:00</hvidate><hvctayn>Y</hvctayn></item></items></body></response>',{status:200});
  };
  try{
    const response=await handle(request('서울특별시','강남구'));
    assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.hospitals.length,1);
    assert.equal(data.hospitals[0].name,'예시&병원');
    assert.equal(data.hospitals[0].emergencyBeds,3);
    assert.equal(called.searchParams.get('serviceKey'),'test+secret/=');
    assert.equal(called.searchParams.get('STAGE2'),'강남구');
    // A copied 'Encoding' key must be decoded once and re-encoded by URLSearchParams.
    process.env.EGEN_API_KEY='test%2Bsecret%2F%3D';
    const encoded=await handle(request('서울특별시','서초구'));
    assert.equal(encoded.status,200);
    assert.equal(called.searchParams.get('serviceKey'),'test+secret/=');
    process.env.EGEN_API_KEY='test+secret/=';
    // Gateway sometimes returns authentication errors as XML with HTTP 403.
    global.fetch=async function(){
      return new Response('<OpenAPI_ServiceResponse><cmmMsgHeader><returnReasonCode>30</returnReasonCode><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>',{status:403});
    };
    const denied=await handle(request('서울특별시','송파구'));
    assert.equal(denied.status,502);
    const reason=await denied.json();
    assert.equal(reason.error,'api_key_invalid');
    assert.equal(reason.diagnostic,'UPSTREAM_HTTP_403_CODE_30');
    assert(!JSON.stringify(reason).includes('test+secret'),'never expose the API key');
    // Distinguish a provider outage from a credential problem.
    global.fetch=async function(){return new Response('temporarily unavailable',{status:503});};
    const offline=await handle(request('서울특별시','강동구'));
    assert.equal(offline.status,502);
    assert.equal((await offline.json()).error,'provider_unavailable');
  }finally{
    global.fetch=oldFetch;
    if(saved===undefined)delete process.env.EGEN_API_KEY;else process.env.EGEN_API_KEY=saved;
  }
  // 주변 조회: 좌표 검증·반올림, 거리순 정렬, 병상 합치기, 좌표 비노출
  {
    const savedKey=process.env.EGEN_API_KEY, savedFetch=global.fetch;
    process.env.EGEN_API_KEY='test+secret/=';
    const nreq=(lat,lon)=>new Request('https://apuda.app/.netlify/functions/egen-emergency?'+new URLSearchParams({mode:'nearby',lat:String(lat),lon:String(lon)}));
    assert.equal((await handle(nreq(48.85,2.35))).status,400,'outside Korea rejected');
    assert.equal((await handle(nreq('abc','x'))).status,400,'non-numeric rejected');
    const seen=[];
    global.fetch=async function(url){
      const u=new URL(String(url)); seen.push(u);
      if(u.pathname.endsWith('getEgytLcinfoInqire'))
        return new Response('<response><header><resultCode>00</resultCode></header><body><items>'+
          '<item><hpid>FAR</hpid><dutyName>먼병원</dutyName><dutyAddr>서울특별시 관악구 어딘가</dutyAddr><dutyTel3>02-111-1111</dutyTel3><dutyEmclsName>지역응급의료기관</dutyEmclsName><latitude>37.60</latitude><longitude>127.10</longitude></item>'+
          '<item><hpid>NEAR</hpid><dutyName>가까운병원</dutyName><dutyAddr>서울특별시 관악구 관악로</dutyAddr><dutyTel3>02-222-2222</dutyTel3><dutyEmclsName>권역응급의료센터</dutyEmclsName><latitude>37.4911</latitude><longitude>127.0902</longitude></item>'+
          '</items></body></response>',{status:200});
      return new Response('<response><header><resultCode>00</resultCode></header><body><items><item><hpid>NEAR</hpid><dutyName>가까운병원</dutyName><hvec>7</hvec><hvidate>20261107120000</hvidate></item></items></body></response>',{status:200});
    };
    const r=await handle(nreq(37.48812345,127.08598765));
    assert.equal(r.status,200);
    const d=await r.json();
    assert.equal(d.mode,'nearby');
    assert.deepEqual(d.hospitals.map(h=>h.id),['NEAR','FAR'],'sorted by distance');
    assert.equal(d.hospitals[0].emergencyBeds,7,'beds merged by hpid');
    assert.equal(d.hospitals[1].emergencyBeds,null);
    assert.ok(d.hospitals[0].distanceKm<1);
    const loc=seen.find(u=>u.pathname.endsWith('getEgytLcinfoInqire'));
    assert.equal(loc.searchParams.get('WGS84_LAT'),'37.488','latitude rounded before upstream');
    assert.equal(loc.searchParams.get('WGS84_LON'),'127.086');
    const stage=seen.find(u=>u.pathname.endsWith('getEmrrmRltmUsefulSckbdInfoInqire'));
    assert.equal(stage.searchParams.get('STAGE1'),'서울특별시'); assert.equal(stage.searchParams.get('STAGE2'),'관악구');
    const body=JSON.stringify(d);
    assert.ok(!body.includes('37.488') && !body.includes('127.086') && !body.includes('serviceKey'),'user coordinates and key not echoed');
    global.fetch=savedFetch;
    if(savedKey===undefined)delete process.env.EGEN_API_KEY;else process.env.EGEN_API_KEY=savedKey;
  }
  console.log('PASS: reject bad region, require key, decode encoded key, parse XML, distinguish 403 auth and 503 provider, hide secret, nearby sorted/merged/rounded');
})().catch(e=>{console.error(e);process.exitCode=1;});