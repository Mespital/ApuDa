/* Drive is mocked; no account is connected and no real backup is changed. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),src=read('note/apuda-backup.js'),KEY='apuda_cancer_care_v1';
const fixture=name=>({profile:{name,cancer:'담도암'},logs:[{date:'2026-10-19',note:'가상 기록'}],roadmap:[],questions:[],meds:[],supports:[],distress:[],labs:[],meta:{},triage:{items:[]}});
function setup({uploadError=false,uploadMissingId=false,cancel=false,invalid=false,race=false}={}){
  const original=JSON.stringify(fixture('현재 가상환자')),incoming=fixture('복원 가상환자'),map=new Map([[KEY,original]]),calls=[];
  const c={crypto:webcrypto,TextEncoder,KEY,KEEP:7,console,Date,JSON,Math,localStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)},meta:{set(){}},prune(){},toast(){},location:{reload(){}},setTimeout(){},getToken:async()=>'synthetic',fetch:async()=>{if(race)c.localStorage.setItem(KEY,JSON.stringify(fixture('다른 창의 새 기록')));return {ok:true,text:async()=>JSON.stringify(invalid?{logs:[null]}:incoming)};},api:async(p,o)=>{calls.push({p,o});if(uploadError)throw Error('network');return uploadMissingId?{}:{id:'synthetic-safety-copy'};},confirmNoteRestore:()=>!cancel};c.window=c;vm.createContext(c);
  vm.runInContext(read('note/note-storage.js'),c);
  vm.runInContext(src.slice(src.indexOf('  function currentState()'),src.indexOf('  /* ------------------------------------------------------- 인증'))+'\n'+src.slice(src.indexOf('  async function uploadBackup()'),src.indexOf('  async function prune()'))+'\n'+src.slice(src.indexOf('  let restoring = false;'),src.indexOf('  async function deleteAll()')),c);
  return {c,map,calls,original,incoming};
}
(async()=>{
  for(const option of [{uploadError:true},{uploadMissingId:true},{invalid:true},{race:true}]){const s=setup(option);await assert.rejects(s.c.restore('synthetic-backup'));if(!option.race)assert.equal(s.map.get(KEY),s.original);else assert(JSON.parse(s.map.get(KEY)).profile.name.includes('다른 창'));assert.equal(s.c.ApuDaNoteStorage.checkpoint(s.c.localStorage,KEY),null);}
  const cancelled=setup({cancel:true});assert.equal(await cancelled.c.restore('synthetic-backup'),false);assert.equal(cancelled.map.get(KEY),cancelled.original);assert.equal(cancelled.calls.length,0);
  const ok=setup();assert.equal(await ok.c.restore('synthetic-backup'),true);assert.equal(JSON.parse(ok.map.get(KEY)).profile.name,'복원 가상환자');assert.equal(ok.c.ApuDaNoteStorage.checkpoint(ok.c.localStorage,KEY).before,ok.original);assert.equal(ok.calls.length,1);assert(ok.calls[0].o.body.includes('apuda.note.backup'));
  console.log('PASS: Drive restore aborts on safety-upload error/missing ID, invalid input, cancellation and concurrent edits; success preserves the exact prior local copy');
})().catch(e=>{console.error(e);process.exitCode=1;});
