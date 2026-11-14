/* Synthetic V4 migration lab deterministic transaction *mock*.
 * Tests the actual page script in a VM, not real IndexedDB/browser durability.
 * No browser profile, actual storage, patient data, filesystem writes or network.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site');
const source=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const databases=new Map();
const defer=(fn)=>setImmediate(fn);
const clone=(v)=>v==null?v:structuredClone(v);

// Serializes ALL transactions on a store: stronger than real read-only
// concurrency, but sufficient to cover revision conflict/rollback logic.
function makeConnection(state){
  return {
    closed:false,
    close(){this.closed=true;},
    createObjectStore(name){assert.equal(name,'trial-records');},
    transaction(name,mode){
      assert.equal(name,'trial-records');
      if(this.closed)throw new Error('connection-closed');
      const tx={mode,ops:[],staged:undefined,aborted:false,oncomplete:null,onabort:null,onerror:null,
        objectStore(store){
          assert.equal(store,'trial-records');
          return {
            get(key){
              assert.equal(key,'synthetic-only');
              const req={onsuccess:null,onerror:null,result:null};
              tx.ops.push(()=>{req.result=clone(tx.staged===undefined?state.row:tx.staged);req.onsuccess?.();});
              return req;
            },
            put(value){
              assert.equal(mode,'readwrite');
              const req={onsuccess:null,onerror:null};
              tx.ops.push(()=>{tx.staged=clone(value);req.onsuccess?.();});
              return req;
            }
          };
        },
        abort(){
          assert.equal(this.aborted,false);
          this.aborted=true;
        }
      };
      state.queue.push(tx);
      pump(state);
      return tx;
    }
  };
}
function pump(state){
  if(state.active||state.queue.length===0)return;
  state.active=state.queue.shift();
  function tick(){
    const tx=state.active;
    if(tx.aborted){
      state.active=null;
      tx.onabort?.();
      pump(state);
      return;
    }
    const op=tx.ops.shift();
    if(op){
      try{op();}catch(error){
        tx.aborted=true;
        tx.error=error;
      }
      defer(tick);
      return;
    }
    if(tx.staged!==undefined)state.row=clone(tx.staged);
    state.active=null;
    tx.oncomplete?.();
    pump(state);
  }
  defer(tick);
}
const indexedDB={
  open(name,version){
    assert.equal(version,1);
    const req={result:null,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};
    defer(()=>{
      const fresh=!databases.has(name);
      if(fresh)databases.set(name,{row:null,queue:[],active:null});
      req.result=makeConnection(databases.get(name));
      if(fresh)req.onupgradeneeded?.();
      req.onsuccess?.();
    });
    return req;
  },
  deleteDatabase(name){
    const req={onsuccess:null,onerror:null,onblocked:null};
    defer(()=>{databases.delete(name);req.onsuccess?.();});
    return req;
  }
};
function element(){return {children:[],textContent:'',className:'',disabled:false,
  appendChild(x){this.children.push(x);},replaceChildren(){this.children=[];},addEventListener(_,callback){this.listener=callback;}};}
const controls={run:element(),summary:element(),results:element()};
const context={crypto:webcrypto,TextEncoder,indexedDB,setTimeout,clearTimeout,
  document:{getElementById(id){assert.ok(id in controls);return controls[id];},
    createElement(){return element();},createTextNode(text){return {textContent:text};}}};
context.window=context;
vm.createContext(context);
for(const file of ['note/note-storage.js','note-v4/v3-compat-audit.js',
  'note-v4/v3-lossless-stage.js','note-v4/v4-extended-draft.js',
  'note-v4/v4-migration-rehearsal.js','note-v4/migration-atomic-lab.js']){
  vm.runInContext(source(file),context,{filename:file});
}
(async()=>{
  assert.equal(typeof controls.run.listener,'function');
  await controls.run.listener();
  assert.match(controls.summary.textContent,/8\/8건 통과 · 0건 실패 · 가상 DB 삭제 확인/);
  assert.equal(controls.results.children.length,8);
  assert.equal(databases.size,0);
  assert.equal(controls.run.disabled,false);
  console.log('PASS: 8/8 synthetic cases in deterministic IndexedDB transaction MOCK; cleanup confirmed in mock only');
})().catch((error)=>{console.error(error);process.exitCode=1;});
