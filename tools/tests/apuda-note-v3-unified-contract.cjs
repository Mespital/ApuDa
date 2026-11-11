/* Synthetic-only V3 contract test. Shared fake IDB queue for 2 tabs.
 * Never reads localStorage, patient records, or a Drive account.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const ctx={crypto:webcrypto,TextEncoder};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['note-storage.js','v3-unified-contract-sandbox.js']){
  const source=fs.readFileSync(path.resolve(__dirname,'../../public-site/note',file),'utf8');
  vm.runInContext(source,ctx);
}
const api=ctx.ApuDaV3UnifiedContractSandbox;
const note=(label)=>JSON.stringify({profile:{name:label,cancer:'가상 암종'},logs:[],
  meds:[],questions:[{question:'테스트 전용'}],unknownSchemaField:{keep:'exact'}});
const chat=(label)=>JSON.stringify([{role:'user',text:label,synthetic:true}]);
const A=note('가상 원본'),B=note('탭 A'),C=note('탭 B'),R=note('복원 파일');

const state={row:null,queue:[],active:null};
function pump(){
  if(state.active||!state.queue.length)return;
  state.active=state.queue.shift();
  function tick(){
    const tx=state.active;
    if(tx.aborted){state.active=null;tx.onabort?.();pump();return;}
    const job=tx.jobs.shift();
    if(job){try{job();}catch(e){tx.error=e;tx.aborted=true;}setImmediate(tick);return;}
    if(tx.staged!==undefined)state.row=structuredClone(tx.staged);
    state.active=null;tx.oncomplete?.();pump();
  }
  setImmediate(tick);
}
function connect(){
  return {name:api.PREFIX+'mock-case',transaction(store,mode){
    assert.equal(store,api.STORE);
    const tx={jobs:[],staged:undefined,aborted:false,oncomplete:null,onabort:null,onerror:null,
      abort(){this.aborted=true;},
      objectStore(name){assert.equal(name,api.STORE);return {
        get(key){assert.equal(key,'synthetic-only');const req={result:null,onsuccess:null};
          tx.jobs.push(()=>{req.result=structuredClone(tx.staged===undefined?state.row:tx.staged);req.onsuccess?.();});return req;},
        put(value){assert.equal(mode,'readwrite');const req={onsuccess:null};
          tx.jobs.push(()=>{tx.staged=structuredClone(value);req.onsuccess?.();});return req;}
      };}
    };
    state.queue.push(tx);pump();return tx;
  }};
}
const dbA=connect(),dbB=connect();
const expect=(row)=>api.expectedState(row.revision,row.note,row.chat);
const unchanged=async(row)=>assert.deepEqual(await api.read(dbA),row);

(async()=>{
  // Initialization and simultaneous note/chat operations share one revision.
  const first=await api.saveNote(dbA,api.expectedState(0,null,null),A);
  assert.equal(first.status,'saved');assert.equal(first.revision,1);
  const afterSeed=await api.read(dbA);
  assert.equal(afterSeed.note,A);assert.equal(afterSeed.chat,null);
  assert.equal(afterSeed.backupState,'frozen');
  const chatSaved=await api.saveChat(dbB,expect(afterSeed),chat('첫 대화'));
  assert.equal(chatSaved.status,'saved');
  const initial=await api.read(dbA);
  assert.equal(initial.revision,2);assert.equal(initial.chat,chat('첫 대화'));

  const race=await Promise.all([
    api.saveNote(dbA,expect(initial),B),
    api.saveChat(dbB,expect(initial),chat('다른 탭 대화'))
  ]);
  assert.equal(race.filter(x=>x.status==='saved').length,1);
  assert.equal(race.filter(x=>x.status==='conflict').length,1);
  const winner=await api.read(dbA);
  assert.equal(winner.revision,3);
  assert.equal(winner.note===B||winner.chat===chat('다른 탭 대화'),true);
  assert.equal(JSON.parse(winner.note).unknownSchemaField.keep,'exact');

  const synced=await api.saveChat(dbB,expect(winner),chat('수정된 대화'));
  assert.equal(synced.status,'saved');
  const beforeRestore=await api.read(dbA);
  assert.equal(beforeRestore.revision,4);
  assert.equal(beforeRestore.chat,chat('수정된 대화'));

  const tooOld=await api.restore(dbA,expect(initial),R);
  assert.equal(tooOld.status,'conflict');await unchanged(beforeRestore);
  const restored=await api.restore(dbB,expect(beforeRestore),R);
  assert.equal(restored.status,'saved');
  const afterRestore=await api.read(dbB);
  assert.equal(afterRestore.revision,5);
  assert.equal(afterRestore.checkpoint.beforeNote,beforeRestore.note);
  assert.equal(afterRestore.checkpoint.beforeChat,beforeRestore.chat);
  assert.match(afterRestore.checkpoint.beforeSha256,/^[a-f0-9]{64}$/);

  // A late tab cannot save over a restore checkpoint or chat changes.
  assert.equal((await api.saveNote(dbA,expect(beforeRestore),C)).status,'conflict');
  await unchanged(afterRestore);
  assert.equal((await api.recover(dbA,expect(beforeRestore))).status,'conflict');

  // Abort preserves note, chat, and recovery information in the same TX.
  assert.equal((await api.saveChat(dbA,expect(afterRestore),chat('중간 종료'),true)).status,'aborted');
  await unchanged(afterRestore);
  const recovered=await api.recover(dbB,expect(afterRestore));
  assert.equal(recovered.status,'saved');
  const afterRecover=await api.read(dbA);
  assert.equal(afterRecover.revision,6);
  assert.equal(afterRecover.note,beforeRestore.note);
  assert.equal(afterRecover.chat,beforeRestore.chat);
  assert.equal(afterRecover.checkpoint,null);

  // Changing chat after restore invalidates recovery rather than losing chat.
  assert.equal((await api.restore(dbA,expect(afterRecover),R)).status,'saved');
  const restoreAgain=await api.read(dbB);
  assert.equal((await api.saveChat(dbB,expect(restoreAgain),chat('복원 이후 대화'))).status,'saved');
  const chatAfterRestore=await api.read(dbA);
  assert.equal(chatAfterRestore.checkpoint,null);
  assert.equal((await api.recover(dbB,expect(chatAfterRestore))).status,'no-verified-checkpoint');
  await unchanged(chatAfterRestore);

  // Both classes of personal content disappear in one tombstone transaction.
  assert.equal((await api.removeAll(dbA,expect(chatAfterRestore))).status,'saved');
  const deleted=await api.read(dbB);
  assert.equal(deleted.note,null);assert.equal(deleted.chat,null);
  assert.equal(deleted.checkpoint,null);assert.equal(deleted.deleted,true);
  assert.equal(deleted.backupState,'frozen');
  assert.equal((await api.saveNote(dbA,expect(chatAfterRestore),C)).status,'conflict');
  assert.equal((await api.saveNote(dbA,expect(deleted),C)).status,'deleted-requires-manual-new-session');
  await unchanged(deleted);

  // All synthetic backup gates are fail closed: NO uploader or prune call.
  for(const options of [
    {expectedRevision:deleted.revision-1},
    {expectedRevision:deleted.revision},
    {expectedRevision:deleted.revision,legacyTabsClosed:true,mixedVersionResolved:true,userConfirmed:true}
  ]){
    const plan=api.planBackup(deleted,options);
    assert.equal(plan.status,'blocked');assert.equal(plan.uploadAllowed,false);
    assert.equal(plan.pruneAllowed,false);assert.equal(plan.autoMigrationAllowed,false);
  }
  const backupPlan=api.planBackup(afterRecover,{expectedRevision:afterRecover.revision,
    legacyTabsClosed:true,mixedVersionResolved:true,userConfirmed:true});
  assert.equal(backupPlan.reason,'sandbox-only');
  assert.equal(backupPlan.uploadAllowed,false);

  await assert.rejects(api.saveNote(dbA,expect(deleted),'{invalid json'),/SyntaxError|invalid-backup|Expected property name/);
  await assert.rejects(api.saveChat(dbA,expect(deleted),'{}'),/invalid-chat/);
  await assert.rejects(api.saveChat(dbA,expect(deleted),'not-json'),/SyntaxError/);
  await assert.rejects(api.saveNote({name:'real-v3',transaction:dbA.transaction},expect(deleted),C),/synthetic-database-required/);
  await unchanged(deleted);
  const source=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/v3-unified-contract-sandbox.js'),'utf8');
  assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB)\s*[.(]/);
  assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
  const production=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/note-app.js'),'utf8');
  assert.doesNotMatch(production,/ApuDaV3UnifiedContractSandbox/);
  console.log('PASS: synthetic unified note/chat race, stale restore, checkpoint, atomic abort, recover, delete tombstone, no resurrection, no Drive uploads/prune');
})().catch(error=>{console.error(error);process.exitCode=1;});
