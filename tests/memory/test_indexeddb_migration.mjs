import assert from 'node:assert/strict';
import {openQaDatabase,readQaRecords,readQaMarker,migrateQaSnapshot} from '../../public-site/memory/indexeddb-migration.mjs';

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

const factory=fakeIndexedDB();
assert.throws(()=>openQaDatabase(factory,'apuda-memory-v2'),/QA 전용/);
const db=await openQaDatabase(factory,'apuda-memory-qa-unittest-0001');
assert.deepEqual(await readQaRecords(db),[]);
assert.equal(await readQaMarker(db),null);
const example={format:'apuda-memory-care-diary',version:2,entries:[
  {id:'a',date:'2026-11-11',text:'가상 관찰 기록',sleep:'좋음'},
  {id:'b',date:'2026-11-12',text:'가상 질문',question:'문의 사항'}]};
const first=await migrateQaSnapshot(db,example);
assert.equal(first.committed,true);
assert.equal(first.added,2);
assert.equal(first.resultCount,2);
assert.deepEqual((await readQaRecords(db)).map(row=>row.id),['a','b']);
assert.equal((await readQaMarker(db)).verified,true);
const repeat=await migrateQaSnapshot(db,example);
assert.equal(repeat.committed,false);
assert.equal(repeat.reason,'already-present');
await assert.rejects(migrateQaSnapshot(db,{...example,entries:[
  {...example.entries[0],text:'충돌'}]}),/동일 기록 ID/);
assert.equal((await readQaRecords(db)).length,2);

const newEntry={format:'apuda-memory-care-diary',version:2,
  entries:[{id:'c',date:'2026-11-12',text:'추가되면 안 되는 기록'}]};
await assert.rejects(migrateQaSnapshot(db,newEntry,{forceAbortAfterQueue:true}),/롤백 검사/);
assert.equal((await readQaRecords(db)).length,2);
await assert.rejects(migrateQaSnapshot(db,newEntry,{injectConstraintError:true}),/ConstraintError/);
assert.equal((await readQaRecords(db)).length,2);
assert.equal((await readQaMarker(db)).sourceCount,2);
assert.equal((await migrateQaSnapshot(db,newEntry)).added,1);
assert.equal((await readQaRecords(db)).length,3);
assert.equal((await readQaMarker(db)).sourceCount,1);
assert.throws(()=>migrateQaSnapshot(db,{...example,version:3}),/형식/);
assert.equal((await readQaRecords(db)).length,3);
assert.throws(()=>migrateQaSnapshot(db,{...example,entries:[
  {...example.entries[0],id:'same'},
  {...example.entries[1],id:'same'}]}),/중복|형식|오류/);
assert.equal((await readQaRecords(db)).length,3);
db.close();
console.log('PASS: isolated QA namespace; additive atomic migration; idempotence; ID collision rejection; explicit/constraint abort rollback; verified marker; malformed input rejection');
