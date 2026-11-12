import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {
 emptyData,addProfile,addEntry,changeEntry,deleteEntry,profileEntries,getSummary,
 hasVault,createVault,unlockVault,commitVault,encryptedBackup,formatSummaryText
} from '../../public-site/memory/app/vault.mjs';

Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true,writable:true});
globalThis.indexedDB=queuedFakeIDB();

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
const pass='2026년 합성 데이터 보관함 긴 비밀번호! never use your own';
const record=(text='',question='')=>({date:'2026-11-12',text,question,sleep:'보통',meal:'좋음',medicationCheck:''});
const original=emptyData();
assert.equal(original.entries.length,0);
assert.equal(await hasVault(),false);
let session=await createVault(pass);
assert.equal(await hasVault(),true);
assert.equal(session.revision,1);
await assert.rejects(createVault(pass),/기존 보관함/);
assert.equal(session.revision,1);
const profiles=addProfile(addProfile(original,'돌봄 대상 A',A),'돌봄 대상 B',B);
assert.equal(profiles.profiles.length,2);
assert.equal(original.profiles.length,0);
await commitVault(session,profiles);
assert.equal(session.revision,2);
let mixed=addEntry(session.data,A,record('가상 A 메모','가상 A 질문'),
  'bad1f7ae-8caf-4e44-9a12-a54bf7abbeba');
mixed=addEntry(mixed,B,record('가상 B 비공개 메모','가상 B 질문'),
  'bad1f7ae-8caf-4e44-9a12-a54bf7abbebb');
mixed=addEntry(mixed,A,record('','진료 질문만 기록하는 새 기능'),
  'bad1f7ae-8caf-4e44-9a12-a54bf7abbebc');
await commitVault(session,mixed);
assert.equal(session.revision,3);
assert.equal(profileEntries(session.data,A).length,2);
assert.equal(profileEntries(session.data,B).length,1);
assert.throws(()=>addEntry(session.data,A,record('x',''),
  'bad1f7ae-8caf-4e44-9a12-a54bf7abbeba'),/ID 중복/);
assert.throws(()=>deleteEntry(session.data,A,'bad1f7ae-8caf-4e44-9a12-a54bf7abbebb'),/다른 대상자/);
const aSummary=getSummary(session.data,A,7,'2026-11-12');
assert.equal(aSummary.recordCount,2);
assert.equal(aSummary.observedDays,1);
assert.equal(aSummary.missingDays,6);
assert.equal(aSummary.questions.length,2);
const asText=formatSummaryText(session.data,A,7,'2026-11-12');
assert.match(asText,/가상 A 질문/);
assert.doesNotMatch(asText,/가상 B 비공개 메모|가상 B 질문/);
const thirty=getSummary(session.data,B,30,'2026-11-12');
assert.equal(thirty.recordCount,1);
assert.equal(thirty.missingDays,29);
const edited=changeEntry(session.data,A,'bad1f7ae-8caf-4e44-9a12-a54bf7abbeba',
  record('수정된 A 메모','질문 수정'));
await commitVault(session,edited);
assert.match(formatSummaryText(session.data,A,7,'2026-11-12'),/수정된 A 메모/);
assert.doesNotMatch(formatSummaryText(session.data,B,7,'2026-11-12'),/수정된 A 메모/);
const removed=deleteEntry(session.data,A,'bad1f7ae-8caf-4e44-9a12-a54bf7abbeba');
await commitVault(session,removed);
assert.equal(profileEntries(session.data,A).length,1);
assert.equal(profileEntries(session.data,B).length,1);

const archive=await encryptedBackup(session);
const envelope=JSON.parse(archive);
assert.equal(envelope.backupFormat,'apuda-memory-v3-encrypted-backup');
assert.equal(envelope.envelope.algorithm,'AES-256-GCM');
assert.equal(envelope.envelope.iterations,600000);
assert.ok(!archive.includes('가상 B 비공개 메모'));
assert.ok(!archive.includes('진료 질문만 기록'));
assert.ok(!archive.includes(A));
assert.ok(!archive.includes(B));
await assert.rejects(unlockVault('incorrect synthetic password 2026'),/비밀번호/);
const restored=await unlockVault(pass);
assert.deepEqual(restored.data,session.data);
assert.equal(restored.revision,session.revision);
const simultaneous=await unlockVault(pass);
await commitVault(restored,addEntry(restored.data,B,record('다른 탭 신규 메모',''),
 'bad1f7ae-8caf-4e44-9a12-a54bf7abbebd'));
const oldData=JSON.stringify(simultaneous.data);
await assert.rejects(commitVault(simultaneous,
 addEntry(simultaneous.data,A,record('다른 탭에서 변경을 덮어쓰지 않아야 함',''),
  'bad1f7ae-8caf-4e44-9a12-a54bf7abbebe')),/다른 탭에서 기록이 변경/);
assert.equal(JSON.stringify(simultaneous.data),oldData,'rejected save does not mutate session data');
await assert.rejects(encryptedBackup(simultaneous),/다른 탭의 변경/);
const current=await unlockVault(pass);
assert.equal(profileEntries(current.data,B).length,2);
assert.equal(profileEntries(current.data,A).length,1);
assert.doesNotMatch(JSON.stringify(current.data),/덮어쓰지 않아야 함/);
console.log('PASS: real Node WebCrypto AES-256-GCM PBKDF2, encrypted IndexedDB, no plaintext backup, profile isolation, question-only entry, CRUD, 7/30 days, wrong password, stale-tab write refusal');
