/* Synthetic records only: failed imports and undo must never target another save. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site');
const c={crypto:webcrypto,TextEncoder};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'note/note-storage.js'),'utf8'),c);
const api=c.ApuDaNoteStorage,KEY='apuda_cancer_care_v1';
const fixture=(name='가상환자')=>({profile:{name,cancer:'유방암',devices:[],rxCombo:[],rxPlan:[]},logs:[{id:'log',date:'2026-10-19',temp:'37.2',tempReadings:[{value:'37.2',at:'2026-10-19T00:00:00Z'}]}],roadmap:[],meds:[],questions:[],supports:[],distress:[],labs:[],checks:{},meta:{},triage:{items:[],at:0}});
class Storage{constructor(raw){this.map=new Map(raw==null?[]:[[KEY,raw]]);this.fail=null;}getItem(k){return this.map.get(k)??null;}setItem(k,v){if(this.fail&&this.fail(k,v))throw Error('quota');this.map.set(k,String(v));}removeItem(k){this.map.delete(k);}}
(async()=>{
  const s=fixture(),raw=JSON.stringify(s);
  for(const invalid of [{},{other:'not-a-note'},{logs:[null]},{profile:{},logs:[null],roadmap:[]},{...s,logs:[{date:'2026-02-30'}]},{...s,logs:'text'},{...s,triage:{items:[null]}},{...s,profile:{name:123}},{format:'other',schemaVersion:2,state:s},{format:'apuda.note.backup',schemaVersion:99,state:s},JSON.parse('{"profile":{},"logs":[],"roadmap":[],"__proto__":{"bad":true}}')])assert.throws(()=>api.unpack(invalid));
  assert.throws(()=>api.unpack('{broken'));
  assert.equal(api.unpack(raw).profile.name,s.profile.name);assert.equal(api.unpack(api.envelope(s)).logs.length,1);
  assert.equal(api.unpack({schemaVersion:1,appVersion:'2.0.0',state:s}).profile.cancer,'유방암');
  const store=new Storage(raw),next=fixture('다른가상환자');await api.replace(store,KEY,next,'test');
  assert.equal(JSON.parse(store.getItem(KEY)).profile.name,'다른가상환자');assert.equal(api.checkpoint(store,KEY).before,raw);
  await api.recover(store,KEY);assert.equal(store.getItem(KEY),raw);assert.equal(api.checkpoint(store,KEY),null);
  const quota=new Storage(raw);quota.fail=k=>k!==KEY;await assert.rejects(api.replace(quota,KEY,next));assert.equal(quota.getItem(KEY),raw,'checkpoint failure preserves original bytes');
  const writeFail=new Storage(raw);writeFail.fail=k=>k===KEY;await assert.rejects(api.replace(writeFail,KEY,next));assert.equal(writeFail.getItem(KEY),raw);
  const later=new Storage(raw);await api.replace(later,KEY,next);const changed=JSON.stringify(fixture('복원후새기록'));later.setItem(KEY,changed);await assert.rejects(api.recover(later,KEY),/records-changed/);assert.equal(later.getItem(KEY),changed);
  const blank=new Storage(null);await api.replace(blank,KEY,next);await api.recover(blank,KEY);assert.equal(blank.getItem(KEY),null);
  const race=new Storage(raw),pending=api.replace(race,KEY,next);race.setItem(KEY,changed);await assert.rejects(pending,/records-changed/);assert.equal(race.getItem(KEY),changed);
  const undo=api.createUndo(),a=JSON.stringify({a:1}),b=JSON.stringify({a:2}),d=JSON.stringify({a:3});
  const old=undo.arm(a,b),latest=undo.arm(b,d);assert.equal(undo.take(old,d,d),null,'an old message cannot undo a newer save');assert.equal(undo.take(latest,d,d),b);assert.equal(undo.take(latest,d,d),null,'one use only');
  const token=undo.arm(a,b);assert.equal(undo.take(token,b,d),null,'cross-tab changes block undo');undo.invalidate();assert.equal(undo.take(token,b,b),null);
  const bad=new Storage('{broken-original'),app={localStorage:bad,NOTE_KB:{TOPICS:[]},ApuDaNoteStorage:api,toast(){},console};app.window=app;vm.createContext(app);const appSrc=fs.readFileSync(path.join(root,'note/note-app.js'),'utf8');vm.runInContext(appSrc.slice(0,appSrc.indexOf('/* ── 화면 전환')),app);app.toast=function(){};assert.equal(app.noteLoadError,true);assert.throws(()=>app.save(),/unreadable-local-note/);assert.equal(bad.getItem(KEY),'{broken-original','unreadable existing local notes cannot be overwritten by a new empty note');
  console.log('PASS: real legacy/modern backups; malformed, foreign, future, null rows and dates rejected; verified checkpoint; quota/race abort; recovery blocks later edits; exact last-save undo');
})().catch(e=>{console.error(e);process.exitCode=1;});
