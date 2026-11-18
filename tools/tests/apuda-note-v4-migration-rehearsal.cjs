/* V4 migration rehearsal test: synthetic V3 data only, no actual storage. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const context={crypto:webcrypto,TextEncoder};context.window=context;vm.createContext(context);
['note/note-storage.js','note-v4/v3-compat-audit.js','note-v4/v3-lossless-stage.js',
 'note-v4/v4-extended-draft.js','note-v4/v4-migration-rehearsal.js']
 .forEach((p)=>vm.runInContext(read(p),context));
const api=context.ApuDaV4MigrationRehearsal;
const state={
  profile:{name:'가상 환자',cancer:'유방암',devices:[],rxCombo:[],rxPlan:[]},
  logs:[
    {date:'2026-11-10',temp:'36.8',tempReadings:[{value:'37.2',at:'01:00'},{value:'36.8',at:'08:00'}],pain:'0',meal:'0',note:'가상 검사 메모 😷'},
    {date:'2026-11-10',temp:'',pain:'',meal:'',note:'합성 보호자 메모',unrecognizedField:'그대로'}
  ],
  questions:[{question:'질문 1'},{question:'질문 2',answer:'답변'},{question:'질문 3'},{question:'질문 4',priority:'high'}],
  meds:[{name:'가상약'}],labs:[{date:'2026-11-10',unit:'unknown'}],roadmap:[],supports:[],distress:[],checks:{},triage:{items:[]},meta:{},unknownTop:{keepMe:0}
};
const source='\n '+JSON.stringify(context.ApuDaNoteStorage.envelope(state),null,2)+'\n';
const previous=' \n {"records":[{"synthetic":true}]} \n ';
const rejects=async(promise,match)=>assert.rejects(promise,match);
(async()=>{
  const plan=await api.prepare(source,previous);
  const result=await api.verify(plan);
  assert.equal(result.valid,true);
  assert.equal(result.canWriteToV4,false);
  assert.equal(plan.readyForProduction,false);
  assert.equal(result.days,2);
  assert.equal(result.questions,4);
  assert.equal(result.previousTargetExists,true);
  assert.equal(plan.originalV3.raw,source,'original V3 whitespace/UTF-8 bytes must survive');
  assert.equal(plan.previousV4.raw,previous,'previous V4 whitespace must survive');
  const trial=JSON.parse(plan.candidateV4.raw);
  assert.equal(trial.canWriteToV4,false);
  assert.equal(trial.readyForProduction,false);
  assert.equal(trial.sourceArchive.original.raw,source);
  assert.equal(trial.view.days[0].temperature.maximum,37.2);
  assert.equal(trial.view.days[0].temperature.latest,36.8);
  assert.equal(trial.view.days[0].pain.rawScore,'0');
  assert.equal(trial.view.days[1].pain.rawScore,'');
  assert.equal(trial.view.questions.length,4);
  assert.equal(trial.view.days[1].sourceRecord.unrecognizedField,'그대로');
  assert.equal(trial.view.extensions.unknownTop.keepMe,0);

  const cancelled=await api.simulateCancel(plan,source,previous);
  assert.equal(cancelled.v3Raw,source);
  assert.equal(cancelled.v4Raw,previous);
  assert.equal(cancelled.productionWriteOccurred,false);
  const forward=await api.simulateForward(plan,source,previous);
  assert.equal(forward.v3Raw,source,'V3 must remain unchanged during a trial');
  assert.equal(forward.v4Raw,plan.candidateV4.raw);
  assert.equal(forward.productionWriteOccurred,false);
  const reversed=await api.simulateRollback(plan,forward.v3Raw,forward.v4Raw);
  assert.equal(reversed.v3Raw,source);
  assert.equal(reversed.v4Raw,previous,'rollback must restore previous V4 exact bytes');
  assert.equal(reversed.productionWriteOccurred,false);

  await rejects(api.simulateForward(plan,source+' ',previous),/conflict/);
  await rejects(api.simulateForward(plan,source,previous+' '),/conflict/);
  await rejects(api.simulateRollback(plan,source,previous),/conflict/);
  await rejects(api.simulateRollback(plan,source,forward.v4Raw+' '),/conflict/);
  await rejects(api.simulateCancel(plan,source,null),/conflict/);

  const noTarget=await api.prepare(source,null);
  assert.equal((await api.verify(noTarget)).previousTargetExists,false);
  const added=await api.simulateForward(noTarget,source,null);
  assert.equal((await api.simulateRollback(noTarget,source,added.v4Raw)).v4Raw,null,'rollback must restore missing key, not blank string');
  const blankTarget=await api.prepare(source,'');
  assert.equal((await api.simulateRollback(blankTarget,source,(await api.simulateForward(blankTarget,source,'')).v4Raw)).v4Raw,'');

  const changedSource=structuredClone(plan);
  changedSource.originalV3.raw+='!';
  await rejects(api.verify(changedSource),/snapshot-changed/);
  const changedPrev=structuredClone(plan);
  changedPrev.previousV4.raw+='!';
  await rejects(api.verify(changedPrev),/snapshot-changed/);
  const changedDraft=structuredClone(plan);
  changedDraft.candidateV4.raw=changedDraft.candidateV4.raw.replace('질문 4','없어진 질문');
  await rejects(api.verify(changedDraft),/snapshot-changed/);
  const changedMetadata=structuredClone(plan);
  changedMetadata.counts.questions=3;
  await rejects(api.verify(changedMetadata),/projection-changed/);
  const changedGate=structuredClone(plan);
  changedGate.canWriteToV4=true;
  await rejects(api.verify(changedGate),/invalid-rehearsal-plan/);

  await rejects(api.prepare('{broken',null));
  await rejects(api.prepare(source,undefined),/v4-baseline-required/);
  await rejects(api.prepare(source,{}),/rehearsal-strings-only/);
  await rejects(api.prepare(source,'X'.repeat(16*1024*1024+1)),/snapshot-too-large/);

  const src=read('note-v4/v4-migration-rehearsal.js');
  assert.doesNotMatch(src,/\b(?:localStorage|sessionStorage)\s*\./);
  assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
  assert.doesNotMatch(src,/\b(?:setItem|removeItem|indexedDB)\s*\(/);
  assert.doesNotMatch(read('note-v4/index.html'),/v4-migration-rehearsal\.js/);
  assert.doesNotMatch(read('note-v4/extended-preview.html'),/v4-migration-rehearsal\.js/);
  assert.doesNotMatch(read('note/note-app.js'),/ApuDaV4MigrationRehearsal/);
  console.log('PASS: synthetic in-memory prepare, digest verification, exact-byte forward/cancel/rollback, source/target conflict, tamper rejection, absent vs blank target, no storage or production integration');
})().catch((e)=>{console.error(e);process.exitCode=1;});
