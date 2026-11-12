/* Actual V3 atomic sandbox script, deterministic fake IndexedDB execution.
 * ALL patient-like strings synthetic; no real browser stores or network.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const files=['note/note-storage.js','note/v3-atomic-ops-sandbox.js'];
const context={crypto:webcrypto,TextEncoder};context.window=context;vm.createContext(context);
for(const file of files)vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../public-site',file),'utf8'),context);
const api=context.ApuDaV3AtomicOpsSandbox;
const source=name=>JSON.stringify({profile:{name:name,cancer:'가상 암종'},
  logs:[{date:'2026-11-11',tempReadings:[{value:37.2},{value:36.8}],unmapped:{unit:'unknown'}}],
  meds:[],questions:[{question:'가상 질문'}],unknownTop:{keepMe:0}});
const rawA=source('초기 가상 기록'),rawB=source('별도 탭 A'),rawC=source('별도 탭 B'),rawR=source('파일 복원');
const state={value:null,queue:[],active:null};
function pump(){
  if(state.active||state.queue.length===0)return;
  state.active=state.queue.shift();
  function tick(){
    const tx=state.active;
    if(tx.aborted){state.active=null;tx.onabort?.();pump();return;}
    const job=tx.jobs.shift();
    if(job){try{job();}catch(error){tx.error=error;tx.aborted=true;}setImmediate(tick);return;}
    if(tx.written!==undefined)state.value=structuredClone(tx.written);
    state.active=null;tx.oncomplete?.();pump();
  }
  setImmediate(tick);
}
function connect(){
  return {name:api.PREFIX+'unit-case',transaction(store,mode){
    assert.equal(store,api.STORE);
    const tx={jobs:[],written:undefined,aborted:false,oncomplete:null,onabort:null,onerror:null,
      abort(){this.aborted=true;},
      objectStore(label){
        assert.equal(label,api.STORE);
        return {
          get(key){assert.equal(key,'synthetic-only');const req={result:null,onsuccess:null};
            tx.jobs.push(()=>{req.result=structuredClone(tx.written===undefined?state.value:tx.written);req.onsuccess?.();});return req;},
          put(row){assert.equal(mode,'readwrite');const req={onsuccess:null};
            tx.jobs.push(()=>{tx.written=structuredClone(row);req.onsuccess?.();});return req;}
        };
      }
    };
    state.queue.push(tx);pump();return tx;
  }};
}
const a=connect(),b=connect();
(async()=>{
  const saved=await api.save(a,0,null,rawA);
  assert.equal(saved.status,'saved');assert.equal(saved.revision,1);
  assert.equal((await api.read(b)).raw,rawA);

  const race=await Promise.all([api.save(a,1,rawA,rawB),api.save(b,1,rawA,rawC)]);
  assert.equal(race.filter(x=>x.status==='saved').length,1);
  assert.equal(race.filter(x=>x.status==='conflict').length,1);
  const current=await api.read(a);
  assert.equal(current.revision,2);
  assert.equal(current.raw,race[0].status==='saved'?rawB:rawC);

  const stale=await api.restore(b,1,rawA,rawR);
  assert.equal(stale.status,'conflict');
  assert.deepEqual(await api.read(b),current);

  const restored=await api.restore(a,2,current.raw,rawR);
  assert.equal(restored.status,'saved');assert.equal(restored.revision,3);
  const restoreRow=await api.read(b);
  assert.equal(restoreRow.checkpoint.before,current.raw);
  assert.equal(restoreRow.checkpoint.after,rawR);

  const staleRecovery=await api.recover(b,2,rawR);
  assert.equal(staleRecovery.status,'conflict');
  const recovery=await api.recover(b,3,rawR);
  assert.equal(recovery.status,'saved');assert.equal(recovery.revision,4);
  const recovered=await api.read(a);
  assert.equal(recovered.raw,current.raw);assert.equal(recovered.checkpoint,null);

  const aborted=await api.save(b,4,recovered.raw,rawA,true);
  assert.equal(aborted.status,'aborted');
  assert.deepEqual(await api.read(a),recovered);

  const removed=await api.remove(a,4,recovered.raw);
  assert.equal(removed.status,'saved');assert.equal(removed.revision,5);
  const tombstone=await api.read(b);
  assert.equal(tombstone.deleted,true);assert.equal(tombstone.raw,null);
  assert.equal(tombstone.checkpoint,null);
  const afterRemoval=await api.save(b,4,recovered.raw,rawB);
  assert.equal(afterRemoval.status,'conflict');
  assert.deepEqual(await api.read(a),tombstone);

  await assert.rejects(api.save(a,5,null,'{bad'),/SyntaxError|Unexpected|Expected property name|invalid-backup/);
  await assert.rejects(api.save({name:'real-existing-db',transaction:a.transaction},0,null,rawA),/synthetic-database-required/);
  const src=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/v3-atomic-ops-sandbox.js'),'utf8');
  assert.doesNotMatch(src,/\b(?:localStorage|sessionStorage)\s*\./);
  assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
  const app=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/note-app.js'),'utf8');
  assert.doesNotMatch(app,/ApuDaV3AtomicOpsSandbox/);
  console.log('PASS: synthetic V3 atomic save/race/stale restore/verified recovery/abort/tombstone/stale writer/invalid input/isolation (mock IndexedDB only)');
})().catch(error=>{console.error(error);process.exitCode=1;});
