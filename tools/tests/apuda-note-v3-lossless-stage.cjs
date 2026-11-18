/* Synthetic-only V3 archival stage. Does not use actual patient data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const scope={crypto:webcrypto,TextEncoder};scope.window=scope;vm.createContext(scope);
['note/note-storage.js','note-v4/v3-compat-audit.js','note-v4/v3-lossless-stage.js'].forEach((p)=>vm.runInContext(read(p),scope));
const bridge=scope.ApuDaV3LosslessStage,api=scope.ApuDaNoteStorage;
const fixture={profile:{name:'합성환자',cancer:'폐암',hospital:'가상병원',devices:[],rxCombo:[],rxPlan:[]},
  logs:[{id:'a',date:'2026-11-10',temp:'36.8',tempReadings:[{value:'37.2',at:'2026-11-10T01:00:00Z'},{value:'36.8',at:'2026-11-10T12:00:00Z'}],pain:'0',meal:'0',note:'가상 메모',customField:'원문 보존'}],
  roadmap:[{date:'2026-11-11',title:'가상 진료'}],meds:[{name:'가상약',dose:'1정'}],
  labs:[{date:'2026-11-09',anc:5,units:{anc:'unknown'}}],
  questions:[{question:'질문1'},{question:'질문2'},{question:'질문3'},{question:'질문4'}],
  supports:[],distress:[],checks:{},triage:{items:[],at:0},meta:{lastFileRequested:'2026-11-10T00:00:00Z'},unknownTopField:{a:1}};
(async()=>{
  // Distinct whitespace and an envelope: the original text must survive byte-for-byte.
  const raw=JSON.stringify(api.envelope(fixture),null,2)+'\n';
  const snapshot=JSON.stringify(fixture),staged=await bridge.stage(raw);
  assert.equal(staged.status,'archived-not-migrated');
  assert.equal(staged.readyForV4,false);
  assert.equal(staged.audit.counts.questionsBeyondV4Limit,1);
  assert.equal(JSON.stringify(fixture),snapshot,'source input must not be mutated');
  assert.equal((await bridge.verify(staged)).valid,true);
  assert.equal(await bridge.originalJSON(staged),raw,'original JSON bytes (UTF-8) must round-trip unchanged');
  const restored=api.unpack(await bridge.originalJSON(staged));
  assert.deepEqual(JSON.parse(JSON.stringify(restored)),fixture,'every V3 field must remain semantically identical');
  const stateOnly=await bridge.stage(fixture);
  assert.deepEqual(JSON.parse(JSON.stringify(api.unpack(await bridge.originalJSON(stateOnly)))),fixture);
  const legacyV1=await bridge.stage({schemaVersion:1,appVersion:'2.0.0',state:fixture});
  assert.equal(JSON.parse(await bridge.originalJSON(legacyV1)).schemaVersion,1);

  // A valid but changed archive must fail integrity verification.
  const forged=JSON.parse(JSON.stringify(staged));
  forged.original.raw=forged.original.raw.replace('합성환자','다른가상');
  await assert.rejects(bridge.verify(forged),/archive-(hash|size)-mismatch/);
  const editedAudit=JSON.parse(JSON.stringify(staged));editedAudit.audit.counts.logs=999;
  await assert.rejects(bridge.verify(editedAudit),/archive-audit-mismatch/);
  await assert.rejects(bridge.stage('{broken'),/Unexpected token|JSON|invalid-backup/);
  await assert.rejects(bridge.stage({name:'not-a-care-note'}),/invalid-backup/);
  await assert.rejects(bridge.stage(' '.repeat(api.MAX_BYTES+1)),/backup-too-large/);

  const code=read('note-v4/v3-lossless-stage.js');
  assert.doesNotMatch(code,/\b(?:localStorage|sessionStorage)\s*\./,'archival stage cannot access live storage');
  assert.doesNotMatch(code,/\b(?:fetch|XMLHttpRequest)\s*\(/,'archival stage cannot upload data');
  assert.doesNotMatch(read('note-v4/index.html'),/v3-lossless-stage\.js/,'demo must not load archival stage');
  console.log('PASS: byte-for-byte V3 archival round-trip; all fields retained; v1/v2 envelopes; corruption, audit tampering, invalid and oversized data blocked; no live storage access');
})().catch((e)=>{console.error(e);process.exitCode=1;});
