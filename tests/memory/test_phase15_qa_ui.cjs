const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'public-site/memory/phase15-qa.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
assert.match(html,/noindex/);
assert.doesNotMatch(script,/\b(?:localStorage|sessionStorage|XMLHttpRequest|sendBeacon)\b|\bfetch\s*\(/);
const runnable=script.replace(/^import .*;\s*$/gm,'');
new vm.Script(runnable);
class Element {
  constructor(){this.textContent='';this.disabled=true;this.events={};}
  addEventListener(name,handler){this.events[name]=handler}
}
async function boot(hostname){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
 const document={getElementById:id=>elements[id]||(elements[id]=new Element())};
 const factory=fakeIndexedDB();
 const scope=await import(pathToFileURL(path.join(root,'public-site/memory/profile-scope.mjs')).href);
 const legacy=await import(pathToFileURL(path.join(root,'public-site/memory/legacy-staging.mjs')).href);
 const idb=await import(pathToFileURL(path.join(root,'public-site/memory/profile-vault-idb-qa.mjs')).href);
 const ctx={document,location:{hostname},indexedDB:factory,
   crypto:{randomUUID:()=> 'aabbee12-1122-4abc-8c2e-ffffffffffff'},...scope,...legacy,...idb};
 vm.createContext(ctx);
 new vm.Script(runnable).runInContext(ctx);
 return {elements,factory};
}
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
  return {deleteDatabase(name) { const request={onsuccess:null,onerror:null,onblocked:null}; queueMicrotask(()=>{databases.delete(name);request.onsuccess?.({target:request})});return request; }, open(name,version) {
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


(async()=>{
 const notPreview=await boot('apuda.app');
 assert.equal(notPreview.elements.start.disabled,true);
 assert.equal(notPreview.elements.start.events.click,undefined);
 assert.match(notPreview.elements.status.textContent,/개발 미리보기/);
 const demo=await boot('deploy-preview-293--apuda-total.netlify.app');
 assert.equal(demo.elements.start.disabled,false);
 await demo.elements.start.events.click();
 const output=JSON.parse(demo.elements.out.textContent);
 assert.equal(output.status,'PASS');
 assert.equal(output.cleanup,'QA DB 삭제 완료');
 assert.equal(output.checks.length,13);
 assert.equal(output.passCount,13);
 assert.equal(demo.elements.start.disabled,false);
 assert.match(demo.elements.status.textContent,/13항목 통과/);
 console.log('PASS: preview-only QA UI runs synthetic atomic staging/rollback and cleans temporary QA DB; non-preview host stays disabled');
})().catch(error=>{console.error(error);process.exitCode=1});
