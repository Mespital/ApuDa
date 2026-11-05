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
  }finally{
    global.fetch=oldFetch;
    if(saved===undefined)delete process.env.EGEN_API_KEY;else process.env.EGEN_API_KEY=saved;
  }
  console.log('PASS: reject bad region, require server key, parse official XML, preserve encoded service key');
})().catch(e=>{console.error(e);process.exitCode=1;});