/* Real Chromium smoke for the isolated synthetic V3 unified contract lab.
 * No production storage; local origin hosts ONLY four allowlisted files.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'../../public-site/note');
const allow=new Map([
  ['/note/v3-unified-contract-lab.html','text/html; charset=utf-8'],
  ['/note/v3-unified-contract-lab.js','text/javascript; charset=utf-8'],
  ['/note/v3-unified-contract-sandbox.js','text/javascript; charset=utf-8'],
  ['/note/note-storage.js','text/javascript; charset=utf-8']
]);
async function main(){
  const unexpected=[];
  const server=http.createServer((req,res)=>{
    if(!allow.has(req.url)){unexpected.push(req.url);res.writeHead(404);res.end('not found');return;}
    res.writeHead(200,{'Content-Type':allow.get(req.url),'Cache-Control':'no-store'});
    res.end(fs.readFileSync(path.join(dir,path.basename(req.url))));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,
      executablePath:process.env.APUDA_TEST_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
    for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
      const context=await browser.newContext({viewport});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',req=>{
        if(!req.url().startsWith('http://127.0.0.1:'+server.address().port+'/'))
          errors.push('external-request:'+req.url());
      });
      await page.addInitScript(()=>{
        Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('forbidden-localStorage');}});
        Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new Error('forbidden-sessionStorage');}});
      });
      await page.goto('http://127.0.0.1:'+server.address().port+'/note/v3-unified-contract-lab.html');
      await page.locator('#run').click();
      await page.waitForFunction(()=>document.querySelector('#summary')?.dataset.result==='pass',{timeout:15000});
      const result=await page.locator('#summary').textContent();
      assert.match(result,/12\/12 통과 · 0 실패 · 가상 DB 삭제 확인/);
      assert.equal(await page.locator('.fail').count(),0);
      assert.deepEqual(errors,[]);
      console.log('PASS: Chromium '+viewport.width+'x'+viewport.height+' '+result);
      await context.close();
    }
    assert.deepEqual(unexpected,[]);
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
