const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'public-site/memory/app/index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'public-site/memory/app/app.mjs'),'utf8')
 .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*/g,'');
new vm.Script(source,{filename:'app.mjs (imports substituted)'});
let idCounter=0,docModel;
class Element{
 constructor(id='',tag='div'){
  this.id=id;this.tagName=tag;this.children=[];this.handlers={};this.dataset={};this.value='';
  this.textContent='';this.checked=false;this.hidden=false;this.disabled=false;this.open=false;
  this.classList={toggle(){}};
 }
 addEventListener(type,cb){this.handlers[type]=cb}
 querySelectorAll(selector){return selector==='input[type="checkbox"]:checked'?(this.checkedNodes||[]):[]}
 scrollIntoView(){this.scrolled=true}
 replaceChildren(...children){this.children=children}
 append(...children){this.children.push(...children)}
 setAttribute(name,value){this[name]=value}
 focus(){this.focused=true}
 remove(){this.removed=true}
 click(){this.clicked=true}
 closest(){return this}
 reset(){for(const id of ['entryMemo','entryQuestion','entryDate'])docModel[id].value='';
  for(const radio of docModel.radios)radio.checked=false;
 }
}
(async()=>{
 const imported=await import(pathToFileURL(path.join(root,'public-site/memory/app/vault.mjs')).href);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
 const radios=[...html.matchAll(/<input[^>]*type="radio"[^>]*name="([^"]+)"[^>]*value="([^"]+)"/g)]
  .map(([,name,value])=>{const r=new Element();r.name=name;r.value=value;return r});
 docModel={...elements,radios};
 const buttons=[['tabToday','today'],['tabHistory','history'],['tabDoctor','doctor']]
  .map(([id,view])=>{elements[id].dataset.view=view;return elements[id]});
 const document={
  getElementById:id=>elements[id],
  createElement:tag=>new Element('',tag),
  querySelectorAll:selector=>selector==='button[data-view]'?buttons:
   selector.startsWith('input[name=')?radios.filter(x=>x.name===selector.match(/name="([^"]+)"/)[1]):[],
  querySelector:selector=>{
   const name=selector.match(/name="([^"]+)"/)?.[1];
   return radios.find(x=>x.name===name&&x.checked)||null;
  },
  body:{append(){}}
 };
 const crypto={subtle:{},randomUUID:()=>{
  const id='d5a713e9-1327-4d98-8cf9-'+String(++idCounter).padStart(12,'0');return id;
 }};
 const notices=[],winHandlers={};let saved=null,printed=false;
 const context={
  document,crypto,indexedDB:{},isSecureContext:true,
  window:{addEventListener:(type,fn)=>winHandlers[type]=fn,print:()=>{printed=true}},
  navigator:{clipboard:{writeText:async text=>notices.push(text)}},
  location:{hash:''},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
  Blob:class{constructor(parts){this.parts=parts}},
  confirm:()=>true,
  hasVault:async()=>Boolean(saved),
  createVault:async()=>{assert.equal(saved,null);return saved={data:imported.emptyData(),revision:1,key:'QA'}},
  unlockVault:async()=>structuredClone(saved),
  commitVault:async(session,next)=>{
   if(session.revision!==saved.revision)throw Error('다른 탭에서 기록이 변경됐습니다');
   session.data=structuredClone(next);session.revision++;saved=structuredClone(session);
   return session;
  },
  encryptedBackup:async()=>JSON.stringify({encrypted:'synthetic-only'}),
  ...Object.fromEntries(['addProfile','addEntry','changeEntry','deleteEntry','profileEntries','getSummary','formatSummaryText']
   .map(n=>[n,imported[n]]))
 };
 vm.createContext(context);
 new vm.Script(source).runInContext(context);
 const event={preventDefault(){}};
 const execute=async(id,type='submit',payload=event)=>{
  const handler=elements[id].handlers[type];assert.equal(typeof handler,'function',id+' must be wired');
  return handler(payload);
 };
 for(let i=0;i<12;i++)await Promise.resolve();
 assert.equal(elements.createForm.hidden,false,'new family should see a simple start screen');
 elements.newPass.value='synthetic-password-2026';
 elements.repeatPass.value='synthetic-password-2026';
 elements.safetyCheck.checked=true;
 await execute('createForm');
 assert.equal(elements.app.hidden,false,'one click after password setup opens app');
 assert.equal(saved.data.profiles.length,1,'new user gets one automatic profile');
 assert.equal(saved.data.profiles[0].label,'돌봄 대상 1');
 assert.equal(elements.viewToday.hidden,false,'today view is the default');
 assert.equal(elements.viewDoctor.hidden,true,'doctor details stay hidden until chosen');

 const checked=(name,value)=>{
  const radio=radios.find(r=>r.name===name&&r.value===value);assert.ok(radio);radio.checked=true;
 };
 checked('sleep','보통');checked('meal','좋음');
 await execute('diaryForm');
 assert.equal(saved.data.entries.length,1);
 assert.match(saved.data.entries[0].text,/돌봄 상태/);
 assert.equal(saved.data.entries[0].sleep,'보통');
 assert.match(elements.saveStatus.textContent,/기록이 저장/);

 await execute('tabHistory','click');
 assert.equal(elements.viewHistory.hidden,false);
 assert.equal(elements.viewToday.hidden,true);
 assert.equal(elements.historyList.children.length,1);
 let card=elements.historyList.children[0];
 let editButton=card.children.at(-1).children[0];
 assert.equal(editButton.dataset.action,'edit');
 await execute('historyList','click',{target:editButton});
 assert.equal(elements.viewToday.hidden,false);
 elements.entryMemo.value='오전 산책을 즐겁게 했습니다.';
 await execute('diaryForm');
 assert.equal(saved.data.entries.length,1);
 assert.match(saved.data.entries[0].text,/산책/);

 await execute('tabDoctor','click');
 assert.equal(elements.viewDoctor.hidden,false);
 assert.match(elements.summaryText.value,/산책/);
 assert.equal(elements.sumRecords.textContent,1);
 await execute('copyButton','click');
 assert.ok(notices[0].includes('산책'));
 await execute('printButton','click');
 assert.equal(printed,true);
 assert.match(elements.printSheet.textContent,/산책/);
 winHandlers.afterprint();
 assert.equal(elements.printSheet.textContent,'');

 elements.profileName.value='돌봄 대상 2';
 await execute('addProfileForm');
 assert.equal(saved.data.profiles.length,2);
 assert.equal(saved.data.entries.length,1);
 assert.match(elements.historyCount.textContent,/0건/);
 assert.doesNotMatch(elements.summaryText.value,/산책/);
 await execute('tabToday','click');
 elements.entryMemo.value='두 번째 가족의 기록';
 await execute('diaryForm');
 assert.equal(saved.data.entries.length,2);
 assert.equal(imported.profileEntries(saved.data,saved.data.profiles[0].id).length,1);
 assert.equal(imported.profileEntries(saved.data,saved.data.profiles[1].id).length,1);
 await execute('tabHistory','click');
 card=elements.historyList.children[0];
 const deleteButton=card.children.at(-1).children[1];
 assert.equal(deleteButton.dataset.action,'delete');
 await execute('historyList','click',{target:deleteButton});
 assert.equal(saved.data.entries.length,1,'delete only current profile');
 assert.match(saved.data.entries[0].text,/산책/);
 await execute('lockButton','click');
 assert.equal(elements.app.hidden,true);
 assert.equal(elements.summaryText.value,'');
 assert.equal(elements.unlockForm.hidden,false);
 elements.unlockPass.value='synthetic-password-2026';
 await execute('unlockForm');
 assert.equal(elements.app.hidden,false);
 assert.equal(saved.data.entries.length,1);
 // All dementia care services are reachable in one place, even when locked.
 await execute('servicesShortcut','click');
 assert.equal(elements.allServices.open,true);
 elements.memoryChecks.checkedNodes=[{value:'최근 대화를 반복해서 잊음'}];
 await execute('memoryReview','click');
 assert.match(elements.memoryResult.textContent,/치매 위험 점수가 아닙니다/);
 const savedBeforeTransfer=saved.data.entries.length;
 await execute('memoryToDiary','click');
 assert.equal(elements.viewToday.hidden,false);
 assert.match(elements.entryMemo.value,/최근 대화를 반복해서 잊음/);
 assert.equal(saved.data.entries.length,savedBeforeTransfer,'checklist must not silently save');
 await execute('diaryForm');
 assert.equal(saved.data.entries.length,savedBeforeTransfer+1);
 assert.equal(imported.profileEntries(saved.data,saved.data.profiles[0].id).length,2);
 assert.equal(imported.profileEntries(saved.data,saved.data.profiles[1].id).length,0);
 elements.routineChecks.checkedNodes=[{value:'수면과 휴식 관찰'}];
 await execute('routineToDiary','click');
 assert.match(elements.entryMemo.value,/수면과 휴식 관찰/);
 elements.safetyChecks.checkedNodes=[{value:'실내 조명·화장실 동선 확인'}];
 await execute('safetyToDiary','click');
 assert.match(elements.entryMemo.value,/실내 조명·화장실 동선 확인/);
 assert.equal(saved.data.entries.length,savedBeforeTransfer+1,'routine and safety are not automatically persisted');
 elements.activitySelect.value='music';
 await execute('activitySelect','change');
 assert.match(elements.activityGuide.textContent,/편안한 음악/);
 await execute('activityToDiary','click');
 assert.match(elements.entryMemo.value,/좋아하는 음악 듣기/);
 assert.equal(saved.data.entries.length,savedBeforeTransfer+1,'activity is not silently saved');
 console.log('PASS: easy onboarding, automatic first profile, diary CRUD, clinic summary, 6 unified services, checklist-to-diary explicit save, profile isolation and lock/unlock');
})().catch(error=>{console.error(error);process.exitCode=1});
