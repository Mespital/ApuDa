/* Synthetic-only V3/V4 per-field inventory; never examines actual records. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../public-site');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const scope={};scope.window=scope;vm.createContext(scope);
['note/note-storage.js','note-v4/v3-compat-audit.js','note-v4/v3-v4-field-reconcile.js'].forEach((p)=>vm.runInContext(read(p),scope));
const api=scope.ApuDaNoteStorage,compare=scope.ApuDaV3V4FieldReconcile.compare;
const fixture={profile:{name:'가상 검진',cancer:'유방암',unknownNested:{'a.b':'비밀가상값'}},
  logs:[{date:'2026-11-10',id:'1',temp:'36.8',tempReadings:[{value:'37.2',at:'2026-11-10T01:00:00Z'},{value:'36.8',at:'2026-11-10T11:00:00Z'}],pain:'0',meal:'0',note:'환자 가상 메모',author:'본인'},
    {date:'2026-11-09',id:'2',temp:'',pain:'8',meal:'',author:'보호자',additionalField:'보존'}],
  questions:[{question:'가상 질문1',priority:'high'},{question:'가상 질문2'},{question:'가상 질문3'},{question:'가상 질문4'}],
  roadmap:[],meds:[{name:'가상약'}],labs:[{date:'2026-11-08',anc:'5.0',units:{anc:'unknown'}}],
  supports:[],distress:[],checks:{},triage:{items:[]},meta:{},distressValue:0};
const original=JSON.stringify(fixture),report=compare(JSON.stringify(api.envelope(fixture)));
function field(path){const row=report.fields.find((r)=>r.path===path);assert.ok(row,'missing path: '+path);return row;}
assert.equal(report.mode,'read-only-field-reconciliation');
assert.equal(report.readyForV4,false);
assert.equal(report.sourceUnchanged,true);
assert.equal(JSON.stringify(fixture),original,'source must not be mutated');
assert.equal(report.fieldPathCount,report.counts.candidate+report.counts.review+report.counts.unsupported);
assert.equal(field('logs[].date').status,'candidate');
assert.equal(field('logs[].pain').status,'candidate','valid 0 and 8 should be distinguished from missing');
assert.equal(field('logs[].temp').status,'review','even one time-stamped reading blocks automatic mapping');
assert.equal(field('logs[].tempReadings[].value').status,'review');
assert.equal(field('logs[].tempReadings[].at').status,'review');
assert.equal(field('logs[].meal').status,'review','numeric meal percent must never become one of 4 labels automatically');
assert.equal(field('logs[].note').status,'review');
assert.equal(field('questions[].question').status,'review');
assert.equal(field('questions[].priority').status,'unsupported');
assert.equal(field('profile.cancer').status,'unsupported');
assert.equal(field('meds[].name').status,'unsupported');
assert.equal(field('labs[].units.anc').status,'unsupported');
assert.equal(field('logs[].date').occurrences,2,'same path from 2 records should aggregate, not duplicate');
assert.equal(field('logs[].meal').nonEmpty,1,'blank and 0 percent must not be conflated');
assert.equal(field('profile.unknownNested["a.b"]').status,'unsupported','dots in unknown keys must not collide with path syntax');
assert.equal(report.groupCounts.questions,4);
assert.equal(report.outsideBackupScope.includes('apuda_note_chat_v1'),true);
assert.doesNotMatch(JSON.stringify(report),/가상약|가상 검진|환자 가상 메모|비밀가상값/,'report must not expose record values');

const single={...fixture,logs:[{date:'2026-11-10',temp:'36.8',pain:'',author:'본인'}]};
assert.equal(compare(single).fields.find((r)=>r.path==='logs[].temp').status,'candidate');
assert.equal(compare(single).fields.find((r)=>r.path==='logs[].pain').status,'candidate','blank pain remains candidate but is not a zero');
const unknown={...fixture,logs:[{date:'2026-11-10',author:'보호자'},{date:'2026-11-09'}]};
assert.equal(compare(unknown).fields.find((r)=>r.path==='logs[].author').status,'review','unknown author days block auto-assignment');
const invalid={...fixture,logs:[{date:'2026-11-10',pain:'99'}]};
assert.equal(compare(invalid).fields.find((r)=>r.path==='logs[].pain').status,'review');
assert.throws(()=>compare('{broken'),/SyntaxError|JSON|Unexpected/);
assert.throws(()=>compare({foo:'not care note'}),/invalid-backup/);
const moduleSource=read('note-v4/v3-v4-field-reconcile.js');
assert.doesNotMatch(moduleSource,/\b(?:localStorage|sessionStorage)\s*\./);
assert.doesNotMatch(moduleSource,/\b(?:fetch|XMLHttpRequest)\s*\(/);
assert.doesNotMatch(read('note-v4/index.html'),/v3-v4-field-reconcile\.js/,'normal V4 demo must not load this tool');
console.log('PASS: V3→V4 1:1 candidate/review/unsupported field inventory; original unchanged; all questions and time-stamped values detected; 0 vs blank; unknown keys escaped; no record values in report or storage/network code');
