/* Deterministic UI logic test, with synthetic V3 records and no browser storage. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const base=path.resolve(__dirname,'../../public-site');
const read=(p)=>fs.readFileSync(path.join(base,p),'utf8');
class Element {
  constructor(tag='div'){this.tag=tag;this.className='';this.children=[];this.value='';this.files=[];this.handlers={};this.hidden=false;this._content='';this.classList={add:(value)=>{this.className=(this.className+' '+value).trim();}};}
  get textContent(){return this._content+this.children.map((c)=>c.textContent).join('');}
  set textContent(value){this._content=String(value);this.children=[];}
  appendChild(child){this.children.push(child);return child;}
  replaceChildren(...children){this.children=children;this._content='';}
  addEventListener(name,handler){this.handlers[name]=handler;}
  dispatch(name){return this.handlers[name]({target:this});}
}
const ids=['choose','screen','summary','fieldSummary','fields','daily','questions','meds','labs','plans','others','risks','integrity','status','sample','clear'];
const dom=Object.fromEntries(ids.map((id)=>[id,new Element()]));
const scope={crypto:webcrypto,TextEncoder,document:{getElementById:(id)=>dom[id],createElement:(tag)=>new Element(tag)}};
scope.window=scope;vm.createContext(scope);
['note/note-storage.js','note-v4/v3-compat-audit.js','note-v4/v3-lossless-stage.js','note-v4/v3-v4-field-reconcile.js','note-v4/legacy-preview.js'].forEach((p)=>vm.runInContext(read(p),scope));
const find=(root,predicate)=>[root,...root.children.flatMap((child)=>find(child,predicate))].filter(predicate);
const until=async(check)=>{for(let i=0;i<300;i++){if(check())return;await new Promise((resolve)=>setTimeout(resolve,10));}throw new Error('Timed out waiting for preview');};
(async()=>{
  dom.sample.dispatch('click');
  await until(()=>dom.status.textContent.includes('원본 검증 완료'));
  assert.match(dom.status.textContent,/건강기록 2건 · 질문 4건/);
  assert.equal(dom.questions.children.length,4,'question limit 3 must not truncate V3 questions');
  assert.match(dom.daily.textContent,/최근 체온: 36\.8℃ · 하루 최고: 37\.2℃/);
  assert.match(dom.daily.textContent,/통증: 0점/);
  assert.match(dom.daily.textContent,/식사량: 0%/);
  assert.match(dom.labs.textContent,/unknown/);
  assert.match(dom.risks.textContent,/QUESTIONS_OVER_THREE/);
  assert.equal(dom.screen.hidden,false);
  assert.match(dom.integrity.textContent,/SHA-256/);
  assert.match(dom.fieldSummary.textContent,/V4 구조 없음/);
  assert.match(dom.fields.textContent,/logs\[\]\.tempReadings\[\]\.at/);
  assert.match(dom.fields.textContent,/questions\[\]\.question/);

  const changed={profile:{name:'가상환자',cancer:'폐암'},logs:[],roadmap:[],meds:[],labs:[],questions:[{question:'<img src=x onerror=alert(1)>'}],supports:[],distress:[],checks:{},triage:{items:[]},meta:{},unknownThing:{retained:'기록값'},distressValue:0};
  dom.choose.files=[{size:JSON.stringify(changed).length,text:async()=>JSON.stringify(changed)}];
  await dom.choose.dispatch('change');
  await until(()=>dom.status.textContent.includes('원본 검증 완료'));
  assert.match(dom.questions.textContent,/<img src=x onerror=alert\(1\)>/);
  assert.equal(find(dom.questions,(n)=>n.tag==='img').length,0,'untrusted user data may not be parsed as HTML');
  assert.match(dom.others.textContent,/추가 기록 필드: unknownThing/);
  assert.match(dom.others.textContent,/마지막 정서 점수/);
  assert.match(dom.fields.textContent,/unknownThing\.retained/);
  dom.clear.dispatch('click');
  assert.equal(dom.screen.hidden,true);
  dom.choose.files=[{size:7,text:async()=>'{broken'}];
  await dom.choose.dispatch('change');
  await until(()=>dom.status.className.includes('error'));
  assert.equal(dom.screen.hidden,true,'broken JSON must not display old patient records');

  assert.match(read('note-v4/legacy-preview.html'),/connect-src 'none'/,'explicit no-upload policy is required');
  assert.match(read('note-v4/legacy-preview.html'),/robots" content="noindex,nofollow,noarchive"/);
  assert.doesNotMatch(read('note-v4/legacy-preview.js'),/\b(?:localStorage|sessionStorage)\s*\./,'preview may not access storage');
  assert.doesNotMatch(read('note-v4/legacy-preview.js'),/\b(?:fetch|XMLHttpRequest)\s*\(/,'preview may not upload');
  assert.doesNotMatch(read('note-v4/index.html'),/legacy-preview\./,'normal V4 demo must not load this pilot');
  console.log('PASS: synthetic V3 preview; four questions, dual temperatures, 0 vs empty, unknown fields, XSS-safe text, clear, invalid JSON, no storage or upload code');
})().catch((e)=>{console.error(e);process.exitCode=1;});
