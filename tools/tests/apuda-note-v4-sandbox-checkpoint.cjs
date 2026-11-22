/* Synthetic-only fault-injection suite for a PRIVATE in-memory checkpoint. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const base=path.resolve(__dirname,'../../public-site');
const read=(p)=>fs.readFileSync(path.join(base,p),'utf8');
const scope={crypto:webcrypto,TextEncoder};scope.window=scope;vm.createContext(scope);
['note/note-storage.js','note-v4/v3-compat-audit.js','note-v4/v3-lossless-stage.js',
 'note-v4/v4-extended-draft.js','note-v4/v4-migration-rehearsal.js','note-v4/v4-sandbox-checkpoint.js']
  .forEach((p)=>vm.runInContext(read(p),scope));
const dataset={profile:{name:'가상 환자',cancer:'유방암'},
  logs:[{date:'2026-11-10',temp:'36.8',tempReadings:[{value:'37.2',at:'01:00'},{value:'36.8',at:'08:00'}],pain:'0',meal:'0',note:'가상 😷'}],
  questions:[{question:'가상 질문 1'},{question:'가상 질문 2'},{question:'가상 질문 3'},{question:'가상 질문 4'}],
  meds:[],labs:[],roadmap:[],supports:[],distress:[]};
const source='\n'+JSON.stringify(dataset,null,2)+'\n',prior=' \n {"prior":"가상 V4"} \n';
const prepare=(before=prior)=>scope.ApuDaV4MigrationRehearsal.prepare(source,before);
const create=(plan,options)=>scope.ApuDaV4SandboxCheckpoint.create(plan,options);
const reject=async(p,pattern)=>assert.rejects(p,pattern);
(async()=>{
  const plan=await prepare();
  const sandbox=await create(plan);
  assert.equal(sandbox.inspect().targetMatchesBefore,true);
  const staged=await sandbox.stage();
  assert.equal(staged.mode,'in-memory-sandbox');
  assert.equal(staged.productionWriteOccurred,false);
  assert.equal(staged.v3OriginalUnchanged,true);
  assert.equal(staged.checkpointVerified,true);
  assert.equal(staged.targetMatchesCandidate,true);
  assert.equal(staged.writeAttempts,2,'checkpoint must be written before V4 candidate');
  await reject(sandbox.stage(),/not-ready/,'duplicate staging may not overwrite checkpoint');
  const restored=await sandbox.recover();
  assert.equal(restored.status,'recovered');
  assert.equal(restored.targetMatchesBefore,true);
  assert.equal(restored.v3OriginalUnchanged,true);
  assert.equal(restored.checkpointVerified,true);
  assert.equal((await sandbox.recover()).targetMatchesBefore,true,'recovery is idempotent');

  const absent=await create(await prepare(null));
  assert.equal(absent.inspect().targetMatchesBefore,true);
  assert.equal((await absent.stage()).targetMatchesCandidate,true);
  assert.equal((await absent.recover()).targetMatchesBefore,true,'absent key must be absent again');
  const blank=await create(await prepare(''));
  await blank.stage();
  assert.equal((await blank.recover()).targetMatchesBefore,true,'blank key must be restored as blank');

  const quota=await create(plan,{maxBytes:64});
  await reject(quota.stage(),/quota-exceeded/);
  assert.equal(quota.inspect().targetMatchesBefore,true);
  assert.equal(quota.inspect().checkpointExists,false);
  const targetQuota=await create(plan,{maxBytes:restored.occupiedBytes+128});
  await reject(targetQuota.stage(),/quota-exceeded/);
  assert.equal(targetQuota.inspect().targetMatchesBefore,true,'target quota failure may not replace baseline');
  assert.equal(targetQuota.inspect().checkpointVerified,true,'checkpoint must survive target quota failure');
  assert.equal((await targetQuota.recover()).targetMatchesBefore,true);
  const cpFailure=await create(plan,{failWriteAt:1});
  await reject(cpFailure.stage(),/write-failure/);
  assert.equal(cpFailure.inspect().targetMatchesBefore,true);
  assert.equal(cpFailure.inspect().checkpointExists,false);
  const candidateFailure=await create(plan,{failWriteAt:2});
  await reject(candidateFailure.stage(),/write-failure/);
  assert.equal(candidateFailure.inspect().targetMatchesBefore,true);
  assert.equal(candidateFailure.inspect().checkpointVerified,true);
  assert.equal((await candidateFailure.recover()).targetMatchesBefore,true);
  const corruptCheckpoint=await create(plan,{corruptWriteAt:1});
  await reject(corruptCheckpoint.stage(),/checkpoint-readback-mismatch/);
  assert.equal(corruptCheckpoint.inspect().targetMatchesBefore,true);
  await reject(corruptCheckpoint.recover(),/checkpoint-unverified/);
  const corruptCandidate=await create(plan,{corruptWriteAt:2});
  await reject(corruptCandidate.stage(),/candidate-readback-mismatch/);
  assert.equal(corruptCandidate.inspect().checkpointVerified,true);
  await reject(corruptCandidate.recover(),/target-conflict/,'unknown target must never be silently overwritten');

  const interrupted=await create(plan,{interruptAfterWrite:2});
  assert.equal((await interrupted.stage()).status,'interrupted');
  assert.equal((await interrupted.recover()).targetMatchesBefore,true);
  const restoreFailure=await create(plan,{failWriteAt:3});
  await restoreFailure.stage();
  await reject(restoreFailure.recover(),/write-failure/);
  assert.equal(restoreFailure.inspect().targetMatchesCandidate,true);
  assert.equal((await restoreFailure.recover()).targetMatchesBefore,true,'checkpoint survives and recovery may retry');

  const concurrent=await create(plan,{injectConcurrentTarget:'다른 탭에서 변경한 가상값'});
  await reject(concurrent.stage(),/concurrent-change/);
  assert.equal(concurrent.inspect().checkpointVerified,true);
  await reject(concurrent.recover(),/target-conflict/);
  const external=await create(plan);
  external.simulateExternalTarget('별도 변경');
  await reject(external.stage(),/concurrent-change/);
  assert.equal(external.inspect().checkpointExists,false);
  const changedV3=await create(plan);
  changedV3.simulateExternalSource(source+'변경');
  await reject(changedV3.stage(),/concurrent-change/);
  assert.equal(changedV3.inspect().checkpointExists,false);
  const changedAfterStage=await create(plan);
  await changedAfterStage.stage();
  changedAfterStage.simulateExternalTarget('외부에서 변경한 가상값');
  await reject(changedAfterStage.recover(),/target-conflict/,'rollback cannot overwrite later edits');
  assert.equal(changedAfterStage.inspect().checkpointVerified,true);
  const changedSourceAfterStage=await create(plan);
  await changedSourceAfterStage.stage();
  changedSourceAfterStage.simulateExternalSource(source+'나중에 변경');
  await reject(changedSourceAfterStage.recover(),/v3-source-changed/);

  const tampered=structuredClone(plan);
  tampered.originalV3.raw+='!';
  await reject(create(tampered),/snapshot-changed/);
  await reject(create(plan,{maxBytes:-1}),/invalid-sandbox-quota/);
  await reject(create(plan,{failWriteAt:0}),/invalid-sandbox-fault/);
  const src=read('note-v4/v4-sandbox-checkpoint.js');
  assert.match(src,/new Map\(/);
  assert.doesNotMatch(src,/\b(?:localStorage|sessionStorage)\s*\./);
  assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|indexedDB|WebSocket)\b/);
  assert.doesNotMatch(read('note-v4/index.html'),/v4-sandbox-checkpoint\.js/);
  assert.doesNotMatch(read('note-v4/extended-preview.html'),/v4-sandbox-checkpoint\.js/);
  assert.doesNotMatch(read('note/note-app.js'),/ApuDaV4SandboxCheckpoint/);
  console.log('PASS: isolated Map checkpoint, staged readback and rollback, quota/write/corruption/crash/concurrency faults, absent-vs-blank, unchanged V3, no production storage');
})().catch((e)=>{console.error(e);process.exitCode=1;});
