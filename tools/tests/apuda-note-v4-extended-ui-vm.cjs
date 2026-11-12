/* Synthetic-only deterministic V4 extended read-only UI test. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const base=path.resolve(__dirname,'../../public-site');
const read=(file)=>fs.readFileSync(path.join(base,file),'utf8');
class Element{
  constructor(tag='div'){
    this.tag=tag;this.className='';this.children=[];this.handlers={};this.hidden=false;this._content='';
  }
  get textContent(){return this._content+this.children.map((child)=>child.textContent).join('');}
  set textContent(value){this._content=String(value);this.children=[];}
  appendChild(child){this.children.push(child);return child;}
  replaceChildren(...children){this.children=children;this._content='';}
  addEventListener(name,callback){this.handlers[name]=callback;}
  dispatch(name){return this.handlers[name]({target:this});}
}
const ids=['load','clear','status','content','summary','check','day-items','question-items','med-items','lab-items','plan-items','other-items'];
const elements=Object.fromEntries(ids.map((id)=>[id,new Element()]));
const scope={crypto:webcrypto,TextEncoder,document:{getElementById:(id)=>elements[id],createElement:(tag)=>new Element(tag)}};
scope.window=scope;
vm.createContext(scope);
['note/note-storage.js','note-v4/v3-compat-audit.js','note-v4/v3-lossless-stage.js','note-v4/v4-extended-draft.js','note-v4/extended-preview.js']
  .forEach((file)=>vm.runInContext(read(file),scope));
const search=(root,test)=>[root,...root.children.flatMap((node)=>search(node,test))].filter(test);
const until=async(predicate)=>{
  for(let i=0;i<300;i++){
    if(predicate())return;
    await new Promise((resolve)=>setTimeout(resolve,10));
  }
  throw new Error('Extended preview did not finish');
};
(async()=>{
  assert.equal(elements.content.hidden,false,'fake element starts visible only because DOM sim does not parse HTML');
  elements.load.dispatch('click');
  await until(()=>elements.status.textContent.includes('손실 없이 표시'));
  assert.equal(elements.content.hidden,false);
  assert.match(elements.status.textContent,/기록 3건, 질문 4개/);
  assert.equal(elements['day-items'].children.length,3,'same-date logs must not merge');
  assert.equal(elements['question-items'].children.length,4,'fourth question must not disappear');
  assert.match(elements['day-items'].textContent,/2026-11-10 · 원본 기록 1/);
  assert.match(elements['day-items'].textContent,/2026-11-10 · 원본 기록 2/);
  assert.match(elements['day-items'].textContent,/37\.2℃/);
  assert.match(elements['day-items'].textContent,/36\.8℃/);
  assert.match(elements['day-items'].textContent,/통증 점수\(원문\)0/);
  assert.match(elements['day-items'].textContent,/식사량\(원문\)0%/);
  assert.match(elements['day-items'].textContent,/통증 점수\(원문\)기록 없음/);
  assert.match(elements['day-items'].textContent,/작성자 미확인/);
  assert.match(elements['day-items'].textContent,/가상 미정의 필드/);
  assert.match(elements['question-items'].textContent,/가상 질문 4/);
  assert.match(elements['question-items'].textContent,/priority · high/);
  assert.match(elements['question-items'].textContent,/answer · 가상 답변/);
  assert.match(elements['med-items'].textContent,/처방전 확인 필요/);
  assert.match(elements['lab-items'].textContent,/unknown/);
  assert.match(elements['plan-items'].textContent,/planned/);
  assert.match(elements['other-items'].textContent,/가상 확장 필드/);
  assert.match(elements['other-items'].textContent,/distressValue/);
  assert.match(elements.check.textContent,/SHA-256/);
  assert.match(elements.check.textContent,/실제 이전\/저장 불가/);
  assert.equal(search(elements['question-items'],(node)=>node.tag==='script').length,0);
  elements.clear.dispatch('click');
  assert.equal(elements.content.hidden,true);
  assert.equal(elements['day-items'].children.length,0);
  assert.equal(elements['question-items'].children.length,0);
  assert.match(elements.status.textContent,/화면을 비웠습니다/);
  elements.load.dispatch('click');
  elements.clear.dispatch('click');
  await new Promise((resolve)=>setTimeout(resolve,20));
  assert.equal(elements.content.hidden,true,'clear must invalidate an in-flight render');
  const html=read('note-v4/extended-preview.html');
  const js=read('note-v4/extended-preview.js');
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/noindex,nofollow,noarchive/);
  assert.match(html,/가상 기록/);
  assert.doesNotMatch(html,/(?:<input|<form|type="file")/i,'no actual data input may be exposed');
  assert.doesNotMatch(js,/\b(?:localStorage|sessionStorage)\s*\./,'no browser storage access');
  assert.doesNotMatch(js,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/,'no network operations');
  assert.doesNotMatch(js,/\binnerHTML\s*=/,'patient text must not be parsed as HTML');
  assert.doesNotMatch(read('note-v4/index.html'),/extended-preview\./,'normal V4 demo must remain independent');
  assert.doesNotMatch(read('note/note-app.js'),/extended-preview\./,'V3 app module must remain independent');
  console.log('PASS: isolated synthetic V4 UI, 3 logs, 4 questions, multiple temps, zero vs missing, unknown units, extensions, no storage/network, clear while loading');
})().catch((e)=>{console.error(e);process.exitCode=1;});
