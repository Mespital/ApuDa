import assert from 'node:assert/strict';
import {emptyProfileVault,addAnonymousProfile,appendScopedRecord,scopedRecords} from '../../public-site/memory/profile-scope.mjs';
import {prepareLegacyStaging} from '../../public-site/memory/legacy-staging.mjs';
import {openProfileVaultQaDatabase,readQaVault,commitLegacyQaStage} from '../../public-site/memory/profile-vault-idb-qa.mjs';

/** Test-only asynchronous IndexedDB simulator; not a substitute for real browser QA. */
function fakeIndexedDB() {
  const databases=new Map();
  const clone=value=>value===undefined?undefined:structuredClone(value);
  class FakeDB {
    constructor(data) {
      this.data=data;this.objectStoreNames={contains:key=>data.stores.has(key)};
      this.onversionchange=null;
    }
    createObjectStore(name,{keyPath}) {
      this.data.stores.set(name,{keyPath,rows:new Map(),indexes:new Set()});
      return {createIndex:index=>this.data.stores.get(name).indexes.add(index)};
    }
    close() {}
    transaction(names,mode='readonly') {
      const staging=new Map(names.map(name=>[name,
        new Map([...this.data.stores.get(name).rows].map(([k,v])=>[k,clone(v)]))]));
      const requests=[];
      const data=this.data;
      let finished=false,started=false;
      const tx={oncomplete:null,onabort:null,onerror:null,error:null,
        abort(){if(finished)return;finished=true;queueMicrotask(()=>tx.onabort?.({target:tx}))},
        objectStore(name) {
          const info=data.stores.get(name),rows=staging.get(name);
          const enqueue=(operation,value)=>{
            const r={result:undefined,error:null,onsuccess:null,onerror:null};
            requests.push({r,operation,value,rows,info});
            if(!started){started=true;queueMicrotask(next)}
            return r;
          };
          return {
            getAll:()=>enqueue('getAll'),get:key=>enqueue('get',key),
            add:row=>enqueue('add',row),put:row=>enqueue('put',row)
          };
        }
      };
      function next(){
        if(finished)return;
        const item=requests.shift();
        if(!item){
          finished=true;
          if(mode==='readwrite')for(const [key,rows] of staging)data.stores.get(key).rows=rows;
          tx.oncomplete?.({target:tx});return;
        }
        const {r,operation,value,rows,info}=item;
        try {
          if(operation==='getAll')r.result=[...rows.values()].map(clone);
          else if(operation==='get')r.result=clone(rows.get(value));
          else {
            if(mode!=='readwrite')throw Error('ReadOnlyError');
            const id=value[info.keyPath];
            if(operation==='add' && rows.has(id))throw Error('ConstraintError');
            rows.set(id,clone(value));r.result=id;
          }
          r.onsuccess?.({target:r});
        }catch(error){
          r.error=error;tx.error=error;
          r.onerror?.({target:r});tx.onerror?.({target:tx});
          tx.abort();
        }
        queueMicrotask(next);
      }
      return tx;
    }
  }
  return {open(name,version) {
    const req={result:null,error:null,onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null};
    queueMicrotask(()=>{
      let data=databases.get(name);
      if(!data){
        data={stores:new Map()};databases.set(name,data);
        req.result=new FakeDB(data);req.onupgradeneeded?.({target:req});
      }else req.result=new FakeDB(data);
      req.onsuccess?.({target:req});
    });
    return req;
  }};
}


const A='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
const B='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
const syntheticRecord=(id,text='가상 기록')=>({id,date:'2026-11-12',text});
const factory=fakeIndexedDB();
assert.throws(()=>openProfileVaultQaDatabase(factory,'apuda-memory-v2'),/QA 전용/);
assert.throws(()=>openProfileVaultQaDatabase(factory,'apuda-memory-qa-unittest-001'),/QA 전용/);
const empty=addAnonymousProfile(addAnonymousProfile(emptyProfileVault(),A),B);
const scoped=appendScopedRecord(empty,A,syntheticRecord('classified-a'));
const original={...scoped,unassigned:[syntheticRecord('old-unassigned')]};
const backup={format:'apuda-memory-care-diary',version:2,entries:[
  syntheticRecord('legacy-new-1'),syntheticRecord('legacy-new-2')
]};
const plan=prepareLegacyStaging(original,backup);
const savedSource=JSON.stringify(original),savedBackup=JSON.stringify(backup);
assert.equal(plan.ready,true);
const db=await openProfileVaultQaDatabase(factory,'apuda-memory-qa-vault-test0001');
assert.deepEqual(await readQaVault(db),{vault:null,marker:null});
assert.throws(()=>commitLegacyQaStage(db,original,backup,plan),
  /별도 명시적 확인/);
assert.deepEqual(await readQaVault(db),{vault:null,marker:null},
  'missing approval never starts a write');
await assert.rejects(commitLegacyQaStage(db,original,backup,plan,
  {confirmed:true,forceAbort:true}),/강제 중단/);
assert.deepEqual(await readQaVault(db),{vault:null,marker:null},
  'abort rolls back both snapshot and marker');
await assert.rejects(commitLegacyQaStage(db,original,backup,plan,
  {confirmed:true,injectDuplicate:true}),/ConstraintError/);
assert.deepEqual(await readQaVault(db),{vault:null,marker:null},
  'constraint error also rolls back both stores');

const successful=await commitLegacyQaStage(db,original,backup,plan,{confirmed:true});
assert.equal(successful.committed,true);
assert.equal(successful.added,2);
assert.equal(successful.totalCount,4);
assert.equal(successful.unassignedCount,3);
assert.equal(successful.verified,true);
const checked=await readQaVault(db);
assert.equal(checked.marker.verified,true);
assert.equal(checked.marker.sourceCount,2);
assert.equal(checked.marker.classifiedCount,1);
assert.equal(checked.marker.unassignedCount,3);
assert.deepEqual(checked.vault.unassigned.map(x=>x.id),
  ['old-unassigned','legacy-new-1','legacy-new-2']);
assert.equal(scopedRecords(checked.vault,A)[0].id,'classified-a');
assert.equal(scopedRecords(checked.vault,B).length,0);
assert.equal(JSON.stringify(original),savedSource,'original source not mutated');
assert.equal(JSON.stringify(backup),savedBackup,'input backup not mutated');
const duplicate=await commitLegacyQaStage(db,original,backup,plan,{confirmed:true});
assert.equal(duplicate.committed,false);
assert.equal(duplicate.reason,'already-staged');
assert.deepEqual(await readQaVault(db),checked,'idempotent replay makes no writes');
const newBackup={...backup,entries:[syntheticRecord('different-candidate')]};
const planNew=prepareLegacyStaging(original,newBackup);
await assert.rejects(commitLegacyQaStage(db,original,newBackup,planNew,{confirmed:true}),
  /다른 기록이나 미검증 표시/);
assert.deepEqual(await readQaVault(db),checked,'conflicting re-stage leaves DB intact');
const tampered={...backup,entries:[syntheticRecord('legacy-new-1','변경된 기록')]};
assert.throws(()=>commitLegacyQaStage(db,original,tampered,plan,{confirmed:true}),
  /사전검사 이후/);
assert.deepEqual(await readQaVault(db),checked);
db.close();
console.log('PASS: QA-only DB, explicit approval, legacy UNASSIGNED scope, atomic commit/marker, forced abort and constraint rollback, replay, conflicting restage protection and original preservation');
