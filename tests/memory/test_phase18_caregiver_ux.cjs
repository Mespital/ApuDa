const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const doc=fs.readFileSync(path.join(root,'public-site/memory/phase18-caregiver-qa.html'),'utf8');
const script=doc.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'the phase18 controller must exist');
const source=script.replace(/^import .*;$/gm,'');
new vm.Script(source,{filename:'phase18-qa.js'});
assert.match(doc,/noindex,nofollow,noarchive/);
assert.match(doc,/실제 환자정보·개인 비밀번호를 입력하지 마세요/);
assert.match(doc,/role="status" aria-live="polite"/);
assert.match(doc,/min-height:52px/);
assert.match(doc,/button:focus-visible/);
assert.match(doc,/width:26px;height:26px/);
assert.match(doc,/다음|저장 확인은 다릅니다/);
assert.doesNotMatch(source,/\blocalStorage\s*[.[]|\bsessionStorage\s*[.[]|\bindexedDB\s*[.[]|\bfetch\s*\(|\bXMLHttpRequest\s*\(/);
class Element {
  constructor(id){
    this.id=id;this.disabled=id==='practice';this.textContent='';
    this.hidden=['resultSection','result','downloadArea'].includes(id);
    this.checked=false;this.href='#';this.listeners={};this.focused=false;
  }
  addEventListener(event,fn){this.listeners[event]=fn}
  removeAttribute(key){if(key==='href')this.href=''}
  focus(){this.focused=true}
}
async function boot(hostname,failEncrypt=false){
  const ids=[...doc.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  const downloadUrls=[],revoked=[];
  const pageListeners={};
  const A='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
  const B='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
  let ciphertextBackup=null,cipherCalls=0;
  const make=()=>{
    const a={format:'apuda-memory-profile-v1',profiles:[],records:[],unassigned:[]};
    return a;
  };
  const add=(v,id)=>({...v,profiles:[...v.profiles,{id}]});
  const append=(v,id,record)=>({...v,records:[...v.records,{...record,profileId:id}]});
  const backup=(v,id)=>({
    format:'apuda-memory-scoped-backup-v1',version:1,sourceProfileId:id,
    entries:v.records.filter(x=>x.profileId===id).map(({profileId,...r})=>r)
  });
  const encrypt=async(data,pass)=>{
    cipherCalls++;if(failEncrypt)throw Error('synthetic encryption failed');
    ciphertextBackup=JSON.parse(JSON.stringify(data));
    return {format:'qa-only',ciphertext:'VEVTVC1FTkNSWVBURUQ='};
  };
  const decrypt=async(encrypted,password,target)=>{
    if(target!==A || password!=='ApuDa synthetic-only demo passphrase 2026. Not a real password.'||
      encrypted.ciphertext!=='VEVTVC1FTkNSWVBURUQ=')throw Error('invalid test decrypt');
    return JSON.parse(JSON.stringify(ciphertextBackup));
  };
  const context={
    document:{getElementById:id=>elements[id]},
    location:{hostname},
    isSecureContext:true,
    crypto:{subtle:{},getRandomValues:()=>{}},
    URL:{
      createObjectURL:()=>{const url='blob:synthetic-only-'+(downloadUrls.length+1);downloadUrls.push(url);return url},
      revokeObjectURL:url=>revoked.push(url)
    },
    Blob:class{constructor(content,options){this.content=content;this.options=options}},
    performance:{now:(()=>{let counter=0;return()=>counter++*150})()},
    window:{addEventListener:(event,fn)=>{pageListeners[event]=fn}},
    emptyProfileVault:make,addAnonymousProfile:add,appendScopedRecord:append,
    exportProfileBackup:backup,encryptScopedBackup:encrypt,decryptScopedBackup:decrypt
  };
  vm.createContext(context);
  new vm.Script(source).runInContext(context);
  return {elements,pageListeners,downloadUrls,revoked,get cipherCalls(){return cipherCalls}};
}
async function click(app,id){
  const fn=app.elements[id].listeners.click;
  assert.equal(typeof fn,'function',id+' click handler');
  return fn({preventDefault:()=>{}});
}
(async()=>{
  const blocked=await boot('apuda.app');
  assert.equal(blocked.elements.practice.disabled,true);
  assert.equal(blocked.elements.practice.listeners.click,undefined,'production host must not attach event');
  const app=await boot('deploy-preview-293--apuda-total.netlify.app');
  assert.equal(app.elements.practice.disabled,true);
  assert.match(app.elements.status.textContent,/주의사항/);
  app.elements['risk-device'].checked=true;
  app.elements['risk-device'].listeners.change();
  assert.equal(app.elements.practice.disabled,true,'partial acknowledgement must not allow encryption');
  app.elements['risk-password'].checked=true;
  app.elements['risk-password'].listeners.change();
  assert.equal(app.elements.practice.disabled,true,'2 of 3 checks is insufficient');
  app.elements['risk-download'].checked=true;
  app.elements['risk-download'].listeners.change();
  assert.equal(app.elements.practice.disabled,false,'three checks permit practice');
  await click(app,'practice');
  const result=JSON.parse(app.elements.technical.textContent);
  assert.equal(result.status,'PASS',result.error);
  assert.equal(result.results.length,9);
  assert.equal(app.elements.downloadArea.hidden,false);
  assert.equal(app.elements.result.hidden,false);
  assert.equal(app.elements.step2.focused,true);
  assert.match(app.elements.result.textContent,/실제 기록은 변경되지 않았습니다/);
  assert.match(app.elements.downloadStatus.textContent,/아직 다운로드를 요청하지 않았습니다/);
  assert.equal(app.downloadUrls.length,1);
  await click(app,'sampleDownload');
  assert.match(app.elements.downloadStatus.textContent,/실제 저장 성공 여부는 확인되지 않았습니다/);
  await click(app,'practice');
  assert.equal(app.revoked.length,1,'rerun must revoke prior Blob URL');
  assert.equal(app.downloadUrls.length,2);
  app.pageListeners.pagehide();
  assert.equal(app.revoked.length,2,'leave page revokes active Blob URL');

  const fails=await boot('deploy-preview-293--apuda-total.netlify.app',true);
  for(const id of ['risk-device','risk-password','risk-download']){
    fails.elements[id].checked=true;fails.elements[id].listeners.change();
  }
  await click(fails,'practice');
  const failed=JSON.parse(fails.elements.technical.textContent);
  assert.equal(failed.status,'FAIL');
  assert.equal(fails.elements.downloadArea.hidden,true);
  assert.match(fails.elements.status.textContent,/검증 실패/);
  console.log('PASS: 3 acknowledgement gates, 9 synthetic-only checks, A/B isolation, download request vs saved distinction, accessible feedback and cleanup, failure refuses download');
})().catch(e=>{console.error(e);process.exitCode=1});
