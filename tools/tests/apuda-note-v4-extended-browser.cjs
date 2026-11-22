/* Optional REAL Chromium smoke test for the SYNTHETIC-only extended preview.
 * Never uses actual patient notes. Requires a browser-capable host and opt-in.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
if(process.env.APUDA_BROWSER_TEST!=='1'){
  console.log('SKIP: real browser needs APUDA_BROWSER_TEST=1 and Playwright Chromium');
  process.exit(0);
}
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../public-site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const full=path.resolve(root,'.'+pathname);
  if(!full.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
  fs.readFile(full,(err,buffer)=>{
    if(err){response.writeHead(404);response.end();return;}
    response.writeHead(200,{'content-type':(mime[path.extname(full)]||'text/plain')+'; charset=utf-8'});
    response.end(buffer);
  });
});
async function main(){
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  const address=`http://127.0.0.1:${server.address().port}/note-v4/extended-preview.html`;
  const opts={args:['--no-sandbox']};
  if(process.env.APUDA_CHROMIUM_PATH)opts.executablePath=process.env.APUDA_CHROMIUM_PATH;
  const browser=await chromium.launch(opts);
  try{
    for(const test of [{width:320,height:700,font:'100%'},{width:390,height:844,font:'200%'}]){
      const context=await browser.newContext({viewport:{width:test.width,height:test.height},deviceScaleFactor:1});
      const page=await context.newPage();
      const outbound=[],errors=[];
      page.on('request',(r)=>{if(!r.url().startsWith('http://127.0.0.1:'))outbound.push(r.url());});
      page.on('pageerror',(e)=>errors.push(String(e)));
      await page.goto(address,{waitUntil:'load'});
      await page.evaluate((font)=>{
        document.documentElement.style.fontSize=font;
        localStorage.setItem('apuda_cancer_care_v1','synthetic-unchanged-marker');
        sessionStorage.setItem('essay-private','synthetic-unchanged-marker');
      },test.font);
      await page.getByRole('button',{name:'가상 기록 화면 보기'}).click();
      await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('손실 없이 표시'));
      assert.equal(await page.locator('#day-items .item').count(),3);
      assert.equal(await page.locator('#question-items .item').count(),4);
      assert.match(await page.locator('#day-items').innerText(),/37\.2℃/);
      assert.match(await page.locator('#day-items').innerText(),/통증 점수\(원문\)/);
      assert.match(await page.locator('#lab-items').innerText(),/unknown/);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,
        `${test.width}px ${test.font} page must have no horizontal overflow`);
      assert.equal(await page.evaluate(()=>localStorage.getItem('apuda_cancer_care_v1')),'synthetic-unchanged-marker');
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('essay-private')),'synthetic-unchanged-marker');
      await page.getByRole('button',{name:'화면 비우기'}).click();
      assert.equal(await page.locator('#content').isHidden(),true);
      assert.equal(await page.evaluate(()=>localStorage.getItem('apuda_cancer_care_v1')),'synthetic-unchanged-marker');
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('essay-private')),'synthetic-unchanged-marker');
      assert.deepEqual(outbound,[]);
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS: real browser 320px/200% synthetic UI, no overflow, all fields and unchanged isolated storage markers');
  }finally{await browser.close();}
}
main().catch((err)=>{console.error(err);process.exitCode=1;}).finally(()=>server.close());
