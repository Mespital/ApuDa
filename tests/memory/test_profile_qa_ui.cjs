const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const page=fs.readFileSync(path.join(root,'public-site/memory/profile-qa.html'),'utf8');
const scope=fs.readFileSync(path.join(root,'public-site/memory/profile-scope.mjs'),'utf8');
const summary=fs.readFileSync(path.join(root,'public-site/memory/profile-summary.mjs'),'utf8');
const htmlScript=page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(htmlScript,'QA page has module script');
assert.doesNotMatch(htmlScript,/\b(?:localStorage|sessionStorage|indexedDB|XMLHttpRequest|sendBeacon)\b|\bfetch\s*\(/,'QA UI must not access storage or network');
assert.match(htmlScript,/allowedHost=.*apuda-total/,'preview-only host gate exists');
for(const id of ['choose-a','choose-b','period-7','period-30','qa-status','qa-controls','qa-results','summary-title','observed-days','record-count','missing-days','question-count','question-list','recent-days','older-days','older-days-wrap','unassigned-count','report','copy-report','copy-status','print-report']){
  assert.match(page,new RegExp('id="'+id+'"'),id+' exists');
}
assert.match(page,/aria-pressed="true"/,'selection state announced');
assert.match(page,/meta name="robots" content="noindex/,'QA should not be indexed');
const program=scope.replace(/^export /gm,'')
  +'\n'+summary.replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')
  +'\n'+htmlScript.replace(/^import .*;\s*$/gm,'');
new vm.Script(program,{filename:'synthetic-profile-qa.js'});

class Element {
  constructor(tag='div'){
    this.tag=tag;this.textContent='';this.hidden=false;this.open=false;this.attrs={};
    this.children=[];this.handlers={};this.className='';this.focused=false;
  }
  replaceChildren(...c){this.children=c}
  append(...c){this.children.push(...c)}
  setAttribute(k,v){this.attrs[k]=v}
  addEventListener(k,v){this.handlers[k]=v}
  focus(){this.focused=true}
}
function boot(hostname){
  const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  const els=Object.fromEntries(ids.map(id=>[id,new Element()]));
  els['qa-controls'].hidden=true;els['qa-results'].hidden=true;
  const copied=[],printer={count:0},confirmState={accepted:true};
  const document={
    getElementById:id=>els[id] || (()=>{throw Error('Missing UI element '+id)})(),
    createElement:tag=>new Element(tag)
  };
  const ctx={document,location:{hostname},navigator:{clipboard:{writeText:async s=>{copied.push(s)}}},
    window:{print:()=>printer.count++,confirm:()=>confirmState.accepted},Date,console};
  vm.createContext(ctx);
  new vm.Script(program).runInContext(ctx);
  return {els,copied,printer,ctx,confirmState};
}
function click(app,id){
  assert.equal(typeof app.els[id].handlers.click,'function',id+' has click event');
  return app.els[id].handlers.click();
}
function textContentOfList(el){return el.children.map(c=>c.textContent).join(' | ')}
(async()=>{
  const bad=boot('apuda.app');
  assert.equal(bad.els['qa-controls'].hidden,true,'production-like host has no live demo controls');
  assert.equal(bad.els['qa-results'].hidden,true,'production-like host has no fake clinical summary');
  assert.match(bad.els['qa-status'].textContent,/개발 미리보기/);
  const app=boot('deploy-preview-293--apuda-total.netlify.app');
  assert.equal(app.els['qa-controls'].hidden,false);
  assert.equal(app.els['qa-results'].hidden,false);
  assert.equal(app.els['unassigned-count'].textContent,'1건');
  assert.equal(app.els['record-count'].textContent,'3건','A7 count');
  assert.equal(app.els['missing-days'].textContent,'5일','A7 missing');
  assert.match(textContentOfList(app.els['question-list']),/가상 A 질문/);
  assert.doesNotMatch(app.els['report'].textContent,/가상 B 질문|B의 가상 활동|미분류 가상 기록/);
  assert.equal(app.els['recent-days'].children.length,7);
  assert.equal(app.els['older-days-wrap'].hidden,true);
  assert.equal(app.els['recent-days'].children[0].children[1].children[0].children[1].textContent.includes('복수 관찰'),true);
  click(app,'choose-b');
  assert.equal(app.els['record-count'].textContent,'1건','B7 count');
  assert.equal(app.els['missing-days'].textContent,'6일','B7 missing');
  assert.match(textContentOfList(app.els['question-list']),/가상 B 질문/);
  assert.doesNotMatch(app.els['report'].textContent,/가상 A 질문|A의 가상 수면/);
  assert.equal(app.els['choose-b'].attrs['aria-pressed'],'true');
  assert.equal(app.els['choose-a'].attrs['aria-pressed'],'false');
  click(app,'period-30');
  assert.equal(app.els['record-count'].textContent,'2건','B30 count');
  assert.equal(app.els['missing-days'].textContent,'28일','B30 missing');
  assert.equal(app.els['older-days-wrap'].hidden,false);
  assert.equal(app.els['older-days'].children.length,23);
  assert.equal(app.els['period-30'].attrs['aria-pressed'],'true');
  assert.doesNotMatch(app.els['report'].textContent,/가상 A 질문|A의 가상 수면|미분류 가상 기록/);
  await click(app,'copy-report');
  assert.equal(app.copied.length,1);
  assert.match(app.copied[0],/가상 B 질문/);
  assert.doesNotMatch(app.copied[0],/가상 A 질문/);
  click(app,'choose-a');
  assert.equal(app.els['record-count'].textContent,'4건','A30 count');
  assert.equal(app.els['missing-days'].textContent,'27일');
  assert.match(textContentOfList(app.els['question-list']),/가상 A 질문/);
  assert.doesNotMatch(app.els['report'].textContent,/가상 B 질문|B의 가상 활동/);
  assert.equal(app.els['summary-title'].focused,true,'summary heading focus on switch');
  click(app,'period-7');
  assert.equal(app.els['record-count'].textContent,'3건');
  assert.equal(app.els['older-days-wrap'].hidden,true);
  click(app,'print-report');
  assert.equal(app.printer.count,1);
  const assignCurrent=()=>app.els['unassigned-list'].children[0].children.at(-1).handlers.click();
  assert.equal(app.els['unassigned-list'].children.length,1,'one unassigned demo record');
  assignCurrent();
  assert.equal(app.els['unassigned-count'].textContent,'1건','no assignment without consent');
  assert.match(app.els['assignment-status'].textContent,/확인란/);
  app.els['assignment-consent'].checked=true;
  app.confirmState.accepted=false;
  assignCurrent();
  assert.equal(app.els['record-count'].textContent,'3건','confirm cancel preserves A records');
  assert.equal(app.els['unassigned-count'].textContent,'1건','confirm cancel preserves unassigned record');
  app.confirmState.accepted=true;
  assignCurrent();
  assert.equal(app.els['record-count'].textContent,'4건','A7 includes explicitly assigned record');
  assert.equal(app.els['unassigned-count'].textContent,'0건','unassigned goes down');
  assert.equal(app.els['assignment-consent'].checked,false,'checkbox reset after assignment');
  assert.equal(app.els['assignment-undo'].hidden,false,'undo available');
  assert.match(app.els['report'].textContent,/미분류 가상 기록/,'new assigned record shown for A');
  click(app,'choose-b');
  assert.equal(app.els['record-count'].textContent,'1건','B unchanged after A assignment');
  assert.doesNotMatch(app.els['report'].textContent,/미분류 가상 기록/,'new assigned A record never appears for B');
  assert.equal(app.els['assignment-consent'].checked,false,'switch resets consent');
  click(app,'choose-a');
  click(app,'assignment-undo');
  assert.equal(app.els['record-count'].textContent,'3건','undo restores A7 to previous count');
  assert.equal(app.els['unassigned-count'].textContent,'1건','undo restores exact unassigned item');
  assert.equal(app.els['assignment-undo'].hidden,true,'undo is one-use');
  assert.doesNotMatch(app.els['report'].textContent,/미분류 가상 기록/,'undo removes previously assigned record from summary');
  app.els['assignment-consent'].checked=true;
  click(app,'assignment-reset');
  assert.equal(app.els['assignment-consent'].checked,false,'reset cancels pending consent');
  assert.equal(app.els['record-count'].textContent,'3건','reset restores demo state');
  assert.equal(app.els['unassigned-count'].textContent,'1건','reset keeps unassigned sample');
  assert.equal(app.els['assignment-undo'].hidden,true);
  console.log('PASS: synthetic A/B UI, 7/30 day isolation, explicit assignment/confirm cancel/undo/reset, no cross-person copying');
})().catch(e=>{console.error(e);process.exitCode=1});
