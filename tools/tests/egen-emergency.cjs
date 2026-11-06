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
  console.log('PASS: reject bad region, require key, decode encoded key, parse XML, distinguish 403 auth and 503 provider, hide secret');
})().catch(e=>{console.error(e);process.exitCode=1;});