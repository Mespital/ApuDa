import assert from 'node:assert/strict';
import {
  emptyProfileVault,addAnonymousProfile,appendScopedRecord,scopedRecords
} from '../../public-site/memory/profile-scope.mjs';
import {prepareLegacyStaging} from '../../public-site/memory/legacy-staging.mjs';
import {
  openProfileVaultQaDatabase,readQaVault,commitLegacyQaStage
} from '../../public-site/memory/profile-vault-idb-qa.mjs';

/** Synthetic IDB: asynchronous and serializes transactions per DB to model
 * the spec's overlapping readwrite transaction scheduling. NOT a browser E2E. */
function queuedFakeIDB(){
  const dbs=new Map(),copy=x=>x===undefined?undefined:structuredClone(x);
  class FakeDB{
    constructor(data){this.data=data;this.objectStoreNames={contains:n=>data.stores.has(n)};}
    createObjectStore(name,{keyPath}){
      this.data.stores.set(name,{keyPath,rows:new Map()});
      return {createIndex:()=>{}};
    }
    close(){}
    transaction(storeNames,mode='readonly'){
      const data=this.data;
      let release;
      const prev=data.tail;
      data.tail=new Promise(r=>{release=r});
      const requests=[];
      let active=false,finished=false,staging=null;
      const tx={
        oncomplete:null,onabort:null,onerror:null,error:null,
        abort(){
          if(finished)return;
          finished=true;
          queueMicrotask(()=>{tx.onabort?.({target:tx});release()});
        },
        objectStore(name){
          if(!data.stores.has(name)||!storeNames.includes(name))throw Error('NotFoundError');
          const store=data.stores.get(name);
          const queue=(kind,value)=>{
            const req={result:undefined,error:null,onsuccess:null,onerror:null};
            requests.push({req,name,kind,value,store});
            return req;
          };
          return {
            get:key=>queue('get',key),
            getAll:()=>queue('all'),
            add:row=>queue('add',row),
            put:row=>queue('put',row)
          };
        }
      };
      Promise.resolve(prev).then(()=>{
        if(finished)return;
        staging=new Map(storeNames.map(name=>[
          name,new Map([...data.stores.get(name).rows].map(([k,v])=>[k,copy(v)]))
        ]));
        active=true;queueMicrotask(next);
      });
      function next(){
        if(!active||finished)return;
        const item=requests.shift();
        if(!item){
          finished=true;
          if(mode==='readwrite'){
            for(const [name,rows] of staging)data.stores.get(name).rows=rows;
          }
          tx.oncomplete?.({target:tx});
          release();
          return;
        }
        const {req,name,kind,value,store}=item;
        const rows=staging.get(name);
        try{
          if(kind==='all')req.result=[...rows.values()].map(copy);
          else if(kind==='get')req.result=copy(rows.get(value));
          else{
            if(mode!=='readwrite')throw Error('ReadOnlyError');
            const id=value[store.keyPath];
            if(kind==='add'&&rows.has(id))throw Error('ConstraintError');
            rows.set(id,copy(value));req.result=id;
          }
          req.onsuccess?.({target:req});
        }catch(error){
          req.error=error;tx.error=error;
          req.onerror?.({target:req});tx.onerror?.({target:tx});
          tx.abort();
        }
        queueMicrotask(next);
      }
      return tx;
    }
  }
  return {open(name){
    const request={result:null,error:null,onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null};
    queueMicrotask(()=>{
      let data=dbs.get(name),first=false;
      if(!data){data={stores:new Map(),tail:Promise.resolve()};dbs.set(name,data);first=true;}
      request.result=new FakeDB(data);
      if(first)request.onupgradeneeded?.({target:request});
      request.onsuccess?.({target:request});
    });
    return request;
  }};
}
const A='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
const B='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
const entry=(id)=>({id,date:'2026-11-12',text:'가상 기록 '+id});
let base=addAnonymousProfile(addAnonymousProfile(emptyProfileVault(),A),B);
base=appendScopedRecord(base,A,entry('protected-a'));
base={...base,unassigned:[entry('original-unassigned')]};
const original=JSON.stringify(base);
const factory=queuedFakeIDB();

for(let n=0;n<25;n++){
  const name='apuda-memory-qa-vault-race-'+String(n).padStart(4,'0');
  const db1=await openProfileVaultQaDatabase(factory,name);
  const db2=await openProfileVaultQaDatabase(factory,name);
  const one={format:'apuda-memory-care-diary',version:2,entries:[entry('candidate-one-'+n)]};
  const two={format:'apuda-memory-care-diary',version:2,entries:[entry('candidate-two-'+n)]};
  const plan1=prepareLegacyStaging(base,one),plan2=prepareLegacyStaging(base,two);
  if(n===0){
    const quota=await commitLegacyQaStage(db1,base,one,plan1,{
      confirmed:true,injectQuotaAbort:true
    }).then(()=>null,e=>e);
    assert.equal(quota?.name,'QuotaExceededError');
    assert.deepEqual(await readQaVault(db2),{vault:null,marker:null});
    const fail=await commitLegacyQaStage(db1,base,one,plan1,{
      confirmed:true,forceAbort:true
    }).then(()=>null,e=>e);
    assert.match(fail?.message||'',/강제 중단/);
    assert.deepEqual(await readQaVault(db1),{vault:null,marker:null});
  }
  const concurrent=await Promise.allSettled([
    commitLegacyQaStage(db1,base,one,plan1,{confirmed:true}),
    commitLegacyQaStage(db2,base,two,plan2,{confirmed:true})
  ]);
  const wins=concurrent.map((x,i)=>x.status==='fulfilled'?i:-1).filter(i=>i!==-1);
  const losses=concurrent.filter(x=>x.status==='rejected');
  assert.equal(wins.length,1,'exactly one candidate should win');
  assert.equal(losses.length,1,'the other must fail without overwrite');
  assert.match(losses[0].reason.message,/다른 기록이나 미검증 표시/);
  const winner=wins[0]===0?one:two;
  const winnerPlan=wins[0]===0?plan1:plan2;
  const losing=wins[0]===0?two:one;
  const state=await readQaVault(db1);
  assert.equal(state.marker?.verified,true);
  assert.equal(state.marker?.sourceCount,1);
  assert.equal(state.vault?.unassigned.length,2);
  assert.equal(scopedRecords(state.vault,A)[0].id,'protected-a');
  assert.equal(scopedRecords(state.vault,B).length,0);
  assert.ok(state.vault.unassigned.some(x=>x.id===winner.entries[0].id));
  assert.ok(!state.vault.unassigned.some(x=>x.id===losing.entries[0].id));
  const again=await commitLegacyQaStage(db2,base,winner,winnerPlan,{confirmed:true});
  assert.equal(again.committed,false);
  assert.equal(again.reason,'already-staged');
  assert.deepEqual(await readQaVault(db2),state);
  db1.close();db2.close();
}
assert.equal(JSON.stringify(base),original,'all tests use unchanged synthetic source');
console.log('PASS: 25 synthetic two-connection races (one winner/one fail), no lost update, quota abort, forced abort, marker integrity, retry idempotence and original immutability');
