/* Synthetic V3 localStorage stale-snapshot gate. This is NOT an atomic CAS. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const dir=path.resolve(__dirname,'../../public-site/note');
const script=fs.readFileSync(path.join(dir,'note-write-fence.js'),'utf8');
const app=fs.readFileSync(path.join(dir,'note-app.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const scope={};scope.window=scope;vm.createContext(scope);vm.runInContext(script,scope);
const fence=scope.ApuDaNoteV3WriteFence;
const note='apuda_cancer_care_v1',chat='apuda_note_chat_v1';
const fake=(initial={})=>{
  const map=new Map(Object.entries(initial));
  return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v)};
};
let passed=0;
function ok(name,fn){fn();passed++;console.log('PASS',name);}
ok('first note write and readback',()=>{const s=fake();assert.equal(fence.write(s,note,null,'A'),'A');assert.equal(s.getItem(note),'A');});
ok('sequential writes use new baseline',()=>{const s=fake();let v=null;v=fence.write(s,note,v,'A');v=fence.write(s,note,v,'B');assert.equal(s.getItem(note),'B');});
ok('stale note rejects',()=>{const s=fake({[note]:'new'});assert.throws(()=>fence.write(s,note,'old','bad'),/records-changed/);assert.equal(s.getItem(note),'new');});
ok('stale chat rejects',()=>{const s=fake({[chat]:'[1]'});assert.throws(()=>fence.write(s,chat,'[0]','[]'),/records-changed/);assert.equal(s.getItem(chat),'[1]');});
ok('silent write failure fails',()=>{assert.throws(()=>fence.write({getItem:()=>null,setItem:()=>{}},note,null,'A'),/not-saved/);});
ok('storage quota exception propagates',()=>{assert.throws(()=>fence.write({getItem:()=>null,setItem:()=>{throw Error('QuotaExceededError');}},note,null,'A'),/QuotaExceededError/);});
ok('invalid parameters rejected',()=>{const s=fake();assert.throws(()=>fence.write(s,'',null,'A'),/invalid-key/);assert.throws(()=>fence.write(s,note,undefined,'A'),/invalid-expected/);assert.throws(()=>fence.write(s,note,null,null),/invalid-next/);});
ok('no direct network or browser storage in helper',()=>{assert.doesNotMatch(script,/\b(?:localStorage|sessionStorage|indexedDB)\s*[.(]/);assert.doesNotMatch(script,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);});
ok('interleaving still risks overwrite (P0)',()=>{let raw='old';const s={getItem:()=>raw,setItem(k,v){raw='old-tab-updated';raw=v}};assert.equal(fence.write(s,note,'old','late'),'late');assert.equal(raw,'late');});
ok('real V3 note and chat calls use boundary',()=>{
  assert.match(app,/noteExpectedRaw=NOTE_WRITE_FENCE\.write\(localStorage,KEY,noteExpectedRaw,raw\)/);
  assert.match(app,/chatExpectedRaw=NOTE_WRITE_FENCE\.write\(localStorage,CHAT_KEY,chatExpectedRaw,JSON\.stringify\(chat\)\)/);
  assert.doesNotMatch(app,/localStorage\.setItem\(KEY\s*,/);
});
ok('SOS triage routes through save',()=>{assert.match(app,/if\(!silent\)\{state\.triage=\{items:items,at:items\.length\?Date\.now\(\):0\};save\(\)\}/);});
ok('helper loads before existing V3 application',()=>{
  assert.ok(html.indexOf('src="note-write-fence.js?v=20261112"')>=0);
  assert.ok(html.indexOf('src="note-write-fence.js?v=20261112"')<html.indexOf('src="note-app.js?v=20261019"'));
});
console.log('RESULT '+passed+'/'+passed+' PASS; existing V3 race remains a release blocker.');
