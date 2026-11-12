const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page=read('public-site/memory/phase16-qa.html');
const js=page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(js,'browser QA module exists');
assert.match(page,/noindex/);
assert.doesNotMatch(js,/\blocalStorage\s*[.[\]]|\bsessionStorage\s*[.[\]]|\bfetch\s*\(/);
const script=js.replace(/^import .*;\s*$/gm,'');
new vm.Script(script);

// Reuse the synthetic serializable IDB queue from the isolated race test.
const raceSource=read('tests/memory/test_phase16_race_and_quota.mjs');
const start=raceSource.indexOf('function queuedFakeIDB(){');
const end=raceSource.indexOf('\nconst A=',start);
assert.ok(start>=0&&end>start);
const factorySource=raceSource.slice(start,end).replace(
  'return {open(name){',
  "return {deleteDatabase(name){const request={onsuccess:null,onerror:null,onblocked:null};queueMicrotask(()=>{dbs.delete(name);request.onsuccess?.({target:request})});return request},open(name){"
);
const fakeFactory=new Function('structuredClone','queueMicrotask',
  factorySource+'\nreturn queuedFakeIDB();')(
    x=>JSON.parse(JSON.stringify(x)),f=>Promise.resolve().then(f)
  );

class Element{
  constructor(){this.textContent='';this.disabled=true;this.events={};}
  addEventListener(event,fn){this.events[event]=fn}
}
async function setup(hostname){
  const elements=Object.fromEntries(
    [...page.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()])
  );
  const document={getElementById:id=>elements[id]||(elements[id]=new Element())};
  const scope=await import(pathToFileURL(path.join(root,'public-site/memory/profile-scope.mjs')).href);
  const stage=await import(pathToFileURL(path.join(root,'public-site/memory/legacy-staging.mjs')).href);
  const db=await import(pathToFileURL(path.join(root,'public-site/memory/profile-vault-idb-qa.mjs')).href);
  const phrase='가상 데이터 전용 긴 검사 암호 2026! Never use personal secrets.';
  let protectedData=null;
  const crypto={
    subtle:{},
    randomUUID:()=> 'ab8cf9cc-3c4c-4a91-bb37-888877776666'
  };
  const encryptArchive=async (data,p)=>{
    assert.equal(p,phrase);
    protectedData=JSON.parse(JSON.stringify(data));
    return {ciphertext:'VEVTVC1FTkNSWVBURUQ='};
  };
  const decryptArchive=async (encrypted,p)=>{
    if(p!==phrase||encrypted.ciphertext!=='VEVTVC1FTkNSWVBURUQ=')
      throw Error('암호 또는 무결성 검증 실패');
    return JSON.parse(JSON.stringify(protectedData));
  };
  let ticks=0;
  const context={
    document,location:{hostname},crypto,
    indexedDB:fakeFactory,
    isSecureContext:true,
    navigator:{userAgent:'Node synthetic browser QA',
      storage:{estimate:async()=>({quota:1048576})}},
    performance:{now:()=>ticks++*120},
    encryptArchive,decryptArchive,
    ...scope,...stage,...db
  };
  vm.createContext(context);
  new vm.Script(script).runInContext(context);
  return {elements};
}
(async()=>{
  const blocked=await setup('apuda.app');
  assert.equal(blocked.elements.run.disabled,true);
  assert.equal(blocked.elements.run.events.click,undefined);
  assert.match(blocked.elements.status.textContent,/개발 미리보기/);
  const qa=await setup('deploy-preview-293--apuda-total.netlify.app');
  assert.equal(qa.elements.run.disabled,false);
  await qa.elements.run.events.click();
  const result=JSON.parse(qa.elements.result.textContent);
  assert.equal(result.status,'PASS',result.error||'QA should pass');
  assert.equal(result.passCount,15);
  assert.equal(result.cleanup,'QA 임시 데이터베이스 삭제 완료');
  assert.equal(result.metrics.quotaBytesApprox,1048576);
  assert.equal(qa.elements.run.disabled,false);
  assert.match(qa.elements.status.textContent,/15항목 통과/);
  console.log('PASS: Phase16 synthetic UI two-connection competition, quota simulation, mocked crypto checks, preview host guard and cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
