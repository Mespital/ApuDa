const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=n=>fs.readFileSync(path.join(__dirname,'../dist',n),'utf8');
const memory=new Map();let calls=0,failAt=0;
const storage={getItem:k=>memory.get(k)??null,setItem(k,v){calls++;if(calls===failAt)throw Error('quota');memory.set(k,v)},removeItem:k=>memory.delete(k)};
const ctx=vm.createContext({localStorage:storage,window:{},tick(){},render(){},console});
vm.runInContext(read('study.js').split('let state;')[0],ctx);
const plus=read('study-plus.js');vm.runInContext(plus.slice(0,plus.indexOf('let plus;'))+'this.restoreExtra=restorePlus;})();',ctx);
vm.runInContext("state=restore(null);window.studyPlusBridge={restore:restoreExtra,snapshot:()=>restoreExtra(null),replace(){}};",ctx);
const device=read('study-device.js');vm.runInContext(device.slice(0,device.indexOf('const input=document.createElement'))+'this.api={inspectBackup,snapshot,atomicWrite,applyBackup};})();',ctx);
const a=ctx.api,backup=a.snapshot();assert.equal(a.inspectBackup(JSON.stringify(backup)).version,1);
backup.core.tasks.push({id:'task1',title:'수학 <조건> 복습',done:false,date:'2026-10-04'});backup.extra.courses['수학']={book:'교과서',unit:'함수',pages:'42'};
const restored=a.inspectBackup(JSON.stringify(backup));assert.equal(restored.core.tasks[0].title,'수학 <조건> 복습');assert.equal(restored.extra.courses['수학'].unit,'함수');assert.equal(restored.core.timer.end,0);
for(const mutate of [v=>v.version=99,v=>v.app='other',v=>v.core.table=[],v=>v.core.tasks[0].date='2026-02-30',v=>v.extra.exams={x:{steps:'bad',rubric:''}},v=>v.extra.logs=[{date:'bad'}]]){const b=JSON.parse(JSON.stringify(backup));mutate(b);assert.throws(()=>a.inspectBackup(JSON.stringify(b)))}
assert.throws(()=>a.inspectBackup('{bad'));assert.throws(()=>a.inspectBackup(' '.repeat(4*1024*1024+1)));
memory.set('compass-study-v1','old-core');memory.set('compass-study-plus-v1','old-extra');calls=0;failAt=2;assert.throws(()=>a.atomicWrite(restored.core,restored.extra));assert.equal(memory.get('compass-study-v1'),'old-core');assert.equal(memory.get('compass-study-plus-v1'),'old-extra');failAt=0;a.applyBackup(restored);assert.equal(JSON.parse(memory.get('compass-study-v1')).tasks[0].id,'task1');assert.equal(JSON.parse(memory.get('compass-study-restore-undo-v1')).app,'future-compass-study');
const next=read('study-next.js');const nextctx=vm.createContext({state:{},today:()=>'',gap:()=>0,valid:()=>true,esc:s=>String(s),Date});vm.runInContext(next.slice(0,next.indexOf('const priorRender=render;'))+'this.next={makePrompt,safeLink};})();',nextctx);assert.equal(nextctx.next.safeLink('javascript:alert(1)'),null);assert.equal(nextctx.next.safeLink('https://evil.test/'),null);assert(nextctx.next.makePrompt('수학','문제','내 풀이','개념').includes('첫 단계 힌트'));assert(!next.includes('fetch(\'https://chatgpt.com'));
console.log('PASS: portable backup round trip, format/date/size validation, paused timer, rollback on storage failure, undo snapshot, safe source links and student-controlled question preparation');
