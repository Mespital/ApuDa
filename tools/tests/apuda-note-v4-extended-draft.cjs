/* Synthetic V4 extension proposal, checked against an immutable V3 source.
 * No live patient data or storage is used.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const context={crypto:webcrypto,TextEncoder};context.window=context;vm.createContext(context);
['note/note-storage.js','note-v4/v3-compat-audit.js','note-v4/v3-lossless-stage.js','note-v4/v4-extended-draft.js']
  .forEach((p)=>vm.runInContext(read(p),context));
const v3=context.ApuDaNoteStorage,api=context.ApuDaV4ExtendedDraft;
const longNote='가상 메모 '.repeat(50); // longer than V4's 200-character note limit
const fixture={
  profile:{name:'가상 환자',cancer:'유방암',hospital:'가상 병원',rxCombo:['합성 요법'],devices:[],rxPlan:[],custom:{a:1}},
  logs:[
    {id:'legacy-a',date:'2026-11-10',temp:'36.8',tempReadings:[{value:'37.2',at:'2026-11-10T01:00:00Z'},{value:'36.8',at:'2026-11-10T08:00:00Z'}],pain:'0',painSite:'',meal:'0',note:longNote,unknownSymptom:'가상 증상'},
    {id:'legacy-b',date:'2026-11-10',temp:'',pain:'',meal:'',note:'',author:'보호자'}
  ],
  questions:[{question:'합성 질문1',answer:'가상 답변1'},{question:'합성 질문2'},{question:'합성 질문3'},{question:'합성 질문4',priority:'high'}],
  meds:[{name:'가상약',dose:'처방 확인 필요',memo:'원문 유지'}],
  labs:[{date:'2026-11-09',wbc:'5.0',units:{wbc:'unknown'}}],
  roadmap:[{date:'2026-11-11',title:'가상 외래 예약',time:'10:00'}],
  supports:['가족 도움'],distress:[{date:'2026-11-09',score:3}],checks:{m1:true},
  triage:{items:[],at:0},meta:{lastBackup:'2026-11-10'},distressValue:0,
  unknownTop:{nested:{'a.b':'가상'}}
};
(async()=>{
  const original=JSON.stringify(v3.envelope(fixture),null,2)+'\n';
  const before=JSON.stringify(fixture);
  const draft=await api.build(original);
  assert.equal(draft.format,'apuda.note.v4.extended-draft');
  assert.equal(draft.status,'proposal-not-imported');
  assert.equal(draft.readyForProduction,false);
  assert.equal(draft.canWriteToV4,false);
  assert.equal(JSON.stringify(fixture),before,'must not mutate input');
  const check=await api.verify(draft);
  assert.equal(check.valid,true);
  assert.equal(check.dayCount,2);
  assert.equal(check.questionCount,4);
  assert.equal(check.medicationCount,1);
  assert.equal(check.labCount,1);
  assert.equal(await api.originalJSON(draft),original,'UTF-8 source must be returned exactly');
  assert.equal(draft.view.days[0].temperature.latest,36.8);
  assert.equal(draft.view.days[0].temperature.maximum,37.2);
  assert.equal(draft.view.days[0].temperature.readings.length,2);
  assert.equal(draft.view.days[0].temperature.readings[0].at,'2026-11-10T01:00:00Z');
  assert.equal(draft.view.days[0].pain.rawScore,'0');
  assert.equal(draft.view.days[1].pain.rawScore,'','blank must differ from pain 0');
  assert.equal(draft.view.days[0].meal.rawPercent,'0');
  assert.equal(draft.view.days[0].meal.mappedCategory,null,'no invented meal category');
  assert.equal(draft.view.days[0].note,longNote,'no 200-char truncation');
  assert.equal(draft.view.days[0].author,null,'unrecorded author must not become self');
  assert.equal(draft.view.days[1].author,'보호자');
  assert.equal(draft.view.days[0].sourceRecord.unknownSymptom,'가상 증상');
  assert.equal(draft.view.questions[3].priority,'high');
  assert.equal(draft.view.laboratoryResults[0].units.wbc,'unknown','no unit inference');
  assert.equal(draft.view.medications[0].memo,'원문 유지');
  assert.equal(draft.view.extensions.distressValue,0);
  assert.equal(draft.view.extensions.unknownTop.nested['a.b'],'가상');

  const altered=JSON.parse(JSON.stringify(draft));altered.view.questions.pop();
  await assert.rejects(api.verify(altered),/draft-view-changed/);
  const editedTemp=JSON.parse(JSON.stringify(draft));editedTemp.view.days[0].temperature.maximum=36.8;
  await assert.rejects(api.verify(editedTemp),/draft-view-changed/);
  const editedRaw=JSON.parse(JSON.stringify(draft));editedRaw.sourceArchive.original.raw=editedRaw.sourceArchive.original.raw.replace('가상 환자','실제 환자');
  await assert.rejects(api.verify(editedRaw),/archive-(hash|size)-mismatch/);
  const enabled=JSON.parse(JSON.stringify(draft));enabled.canWriteToV4=true;
  await assert.rejects(api.verify(enabled),/invalid-v4-draft/);
  const legacy=await api.build({schemaVersion:1,appVersion:'2.0.0',state:fixture});
  assert.equal((await api.verify(legacy)).valid,true);
  assert.deepEqual(JSON.parse(JSON.stringify(v3.unpack(await api.originalJSON(legacy)))),fixture);
  await assert.rejects(api.build('{broken'),/JSON|Unexpected|invalid-backup/);
  await assert.rejects(api.build(' '.repeat(v3.MAX_BYTES+1)),/backup-too-large/);
  const code=read('note-v4/v4-extended-draft.js');
  assert.doesNotMatch(code,/\b(?:localStorage|sessionStorage)\s*\./);
  assert.doesNotMatch(code,/\b(?:fetch|XMLHttpRequest)\s*\(/);
  assert.doesNotMatch(read('note-v4/index.html'),/v4-extended-draft\.js/,'V4 runtime must not load draft');
  assert.doesNotMatch(read('note-v4/legacy-preview.html'),/v4-extended-draft\.js/,'read-only UI must not load draft implicitly');
  console.log('PASS: source-preserving V4 extended draft; 2 same-day logs, all temperatures, full questions and notes, zero vs empty, unknown lab units, unknown fields, original UTF-8, tamper/oversize rejection, no storage/network or runtime loading');
})().catch((e)=>{console.error(e);process.exitCode=1;});
