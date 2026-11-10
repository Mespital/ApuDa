/* Browser-level, synthetic-only verification for the V3 read-only preview.
 * No patient records or production storage are used.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
// Explicit opt-in: the default Linux sandbox blocks Chromium's process sockets.
// Run with APUDA_BROWSER_TEST=1 in a browser-capable CI/desktop environment.
if(process.env.APUDA_BROWSER_TEST!=='1'){
  console.log('SKIP: browser smoke test requires APUDA_BROWSER_TEST=1 and Playwright Chromium');
  process.exit(0);
}
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../public-site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const full=path.resolve(root,'.'+pathname);
  if(!full.startsWith(root+path.sep)) {response.writeHead(403);response.end();return;}
  fs.readFile(full,(err,buffer)=>{
    if(err){response.writeHead(404);response.end();return;}
    response.writeHead(200,{'content-type':(mime[path.extname(full)]||'text/plain')+'; charset=utf-8'});
    response.end(buffer);
  });
});
async function main(){
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  const address=`http://127.0.0.1:${server.address().port}/note-v4/legacy-preview.html`;
  const launchOptions={args:['--no-sandbox']};
  if(process.env.APUDA_CHROMIUM_PATH)launchOptions.executablePath=process.env.APUDA_CHROMIUM_PATH;
  const browser=await chromium.launch(launchOptions);
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
    const page=await context.newPage();
    const outbound=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:'))outbound.push(r.url());});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(address,{waitUntil:'load'});
    await page.evaluate(()=>{localStorage.setItem('apuda_note_v3','synthetic-unchanged-marker');sessionStorage.setItem('essay-private','synthetic-unchanged-marker');});
    await page.getByRole('button',{name:'가상 기록 미리보기'}).click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('원본 검증 완료'));
    assert.match(await page.locator('#status').innerText(),/건강기록 2건 · 질문 4건/);
    assert.equal(await page.locator('#questions .entry').count(),4,'4th V3 question must be visible');
    assert.match(await page.locator('#daily').innerText(),/최근 체온: 36\.8℃ · 하루 최고: 37\.2℃/);
    assert.match(await page.locator('#daily').innerText(),/통증: 0점/);
    assert.match(await page.locator('#daily').innerText(),/식사량: 0%/);
    assert.match(await page.locator('#labs').innerText(),/단위 미상|unknown/);
    assert.match(await page.locator('#risks').innerText(),/QUESTIONS_OVER_THREE/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('apuda_note_v3')),'synthetic-unchanged-marker');
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('essay-private')),'synthetic-unchanged-marker');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile must not overflow horizontally');
    await page.locator('#choose').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({
      profile:{name:'가상환자',cancer:'폐암'},logs:[],questions:[{question:'<img src=x onerror=alert(1)>'}],
      roadmap:[],meds:[],labs:[],supports:[],distress:[],checks:{},triage:{items:[]},meta:{},unknownThing:{retained:'기록값'}
    }))});
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('원본 검증 완료'));
    assert.equal(await page.locator('#questions img').count(),0,'untrusted text must not become HTML');
    assert.match(await page.locator('#questions').innerText(),/<img src=x onerror=alert\(1\)>/);
    assert.match(await page.locator('#others').innerText(),/추가 기록 필드: unknownThing/);
    await page.getByRole('button',{name:'화면 비우기'}).click();
    assert.equal(await page.locator('#screen').isHidden(),true);
    await page.locator('#choose').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
    await page.waitForFunction(()=>document.querySelector('#status').classList.contains('error'));
    assert.equal(await page.locator('#screen').isHidden(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('apuda_note_v3')),'synthetic-unchanged-marker');
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('essay-private')),'synthetic-unchanged-marker');
    assert.deepEqual(outbound,[],'preview must not create outbound requests');
    assert.deepEqual(errors,[],'page must not encounter runtime errors');
    await context.close();
    console.log('PASS: mobile browser preview, 4 questions, 0 vs empty, latest vs highest temperature, unknown values, XSS text, clear, invalid JSON, unchanged storage, no outbound requests');
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
