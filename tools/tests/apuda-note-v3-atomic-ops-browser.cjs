/* Real Chromium smoke: a NEW isolated context + synthetic IndexedDB only.
 * Serves three local scripts and one lab page; never touches live patient data.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'../../public-site/note');
const files=new Map([
  ['/note/v3-atomic-ops-lab.html','text/html; charset=utf-8'],
  ['/note/v3-atomic-ops-lab.js','text/javascript; charset=utf-8'],
  ['/note/v3-atomic-ops-sandbox.js','text/javascript; charset=utf-8'],
  ['/note/note-storage.js','text/javascript; charset=utf-8']
]);
async function main(){
  const requests=[];
  const server=http.createServer((req,res)=>{
    if(!files.has(req.url)){requests.push(req.url);res.writeHead(404);res.end('not found');return;}
    const body=fs.readFileSync(path.join(dir,path.basename(req.url)));
    res.writeHead(200,{'Content-Type':files.get(req.url),'Cache-Control':'no-store'});res.end(body);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath:process.env.APUDA_TEST_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+'/note/v3-atomic-ops-lab.html';
    for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
      const context=await browser.newContext({viewport});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('request',req=>{
        if(!req.url().startsWith('http://127.0.0.1:'+server.address().port+'/'))errors.push('external-request: '+req.url());
      });
      // A third-party or future regression may not access any real storage.
      await page.addInitScript(()=>{
        Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('localStorage forbidden in synthetic lab');}});
        Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new Error('sessionStorage forbidden in synthetic lab');}});
      });
      await page.goto(url,{waitUntil:'load'});
      await page.locator('#run').click();
      await page.waitForFunction(()=>document.getElementById('summary')?.dataset.result==='pass',{timeout:10000});
      const summary=await page.locator('#summary').textContent();
      const failures=await page.locator('.fail').count();
      assert.equal(failures,0,'Browser UI must report no failures');
      assert.match(summary,/11\/11 통과 · 0 실패 · 합성 DB 삭제 확인/);
      assert.deepEqual(errors,[]);
      console.log('PASS: Chromium '+viewport.width+'x'+viewport.height+' — '+summary);
      await context.close();
    }
    assert.deepEqual(requests,[],'No unlisted local files may be requested');
    console.log('PASS: synthetic-only access guard; no external requests; isolated browser contexts');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
