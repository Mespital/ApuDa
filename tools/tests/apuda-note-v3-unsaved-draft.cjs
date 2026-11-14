/* Synthetic-only regression for in-memory unsaved edits. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/note-unsaved-draft.js'),'utf8');
const context={TextEncoder,Date};context.window=context;vm.createContext(context);vm.runInContext(src,context);
const v=context.ApuDaNoteUnsavedDraft,rawNote='{"profile":{"name":"가상 환자"},"logs":[]}',rawChat='[{"w":"me","h":"가상 대화"}]';
let cases=0;function check(n,fn){fn();console.log('PASS '+(++cases)+' '+n);}
check('initial empty',()=>{assert.equal(v.count(),0);assert.throws(()=>v.exportText(),/no-unsaved-draft/);});
check('note snapshot',()=>{assert.equal(v.capture('note',rawNote,'records-changed'),true);assert.equal(v.count(),1);});
check('chat snapshot',()=>{assert.equal(v.capture('chat',rawChat,'not-saved'),true);assert.equal(v.count(),2);});
check('preserve both exact source strings',()=>{const r=JSON.parse(v.exportText());assert.equal(r.items[0].raw,rawNote);assert.equal(r.items[1].raw,rawChat);});
check('export marked review-only, not normal import format',()=>{const r=JSON.parse(v.exportText());assert.equal(r.format,'apuda.note.unsaved-review');assert.equal(r.reviewOnly,true);assert.notEqual(r.format,'apuda.note.backup');});
check('known reason not user input',()=>{assert.equal(v.capture('note','{"x":1}', 'untrusted personal message'),true);const r=JSON.parse(v.exportText());assert.equal(r.items[2].reason,'write-failed');});
check('sequential identical capture deduplicated',()=>{const n=v.count();assert.equal(v.capture('note','{"x":1}', 'untrusted personal message'),true);assert.equal(v.count(),n);});
check('bad kind and payload rejected',()=>{assert.throws(()=>v.capture('other','a'),/invalid-draft-kind/);assert.throws(()=>v.capture('note',null),/raw-string-required/);});
check('oversized input refused without eviction',()=>{const n=v.count();assert.equal(v.capture('note','a'.repeat(16*1024*1024+1)),false);assert.equal(v.count(),n);});
check('vault not cleared on export',()=>{const n=v.count();v.exportText();assert.equal(v.count(),n);});
check('no persistence and no network',()=>{assert.doesNotMatch(src,/\b(?:localStorage|sessionStorage|indexedDB)\s*[.(]/);assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);});
check('bounded entry count',()=>{while(v.count()<8)assert.equal(v.capture('chat',String(v.count())),true);assert.equal(v.capture('note','new'),false);assert.equal(v.count(),8);});
console.log('PASS '+cases+'/'+cases+' isolated module cases');
