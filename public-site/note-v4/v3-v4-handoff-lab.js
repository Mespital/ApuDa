/* Browser-only synthetic V3/V4 handoff tests.
 * No real localStorage, user files, credentials, network or Drive.
 */
(function(){
'use strict';
var api=window.ApuDaV4SyntheticHandoff,button=document.getElementById('run'),
  summary=document.getElementById('summary'),list=document.getElementById('results');
function fixture(tag){
  return JSON.stringify({profile:{name:'가상 '+tag,cancer:'가상암종',devices:[],rxCombo:[],rxPlan:[]},
    logs:[{date:'2026-11-11',temp:'37.2',tempReadings:[{value:'37.2',at:'08:00'},{value:'36.8',at:'17:00'}],
      pain:'2',meal:'50',note:'가상 한글 메모',otherField:{unmapped:true}}],
    meds:[{name:'가상 약제'}],questions:[{question:'가상 질문 1'},{question:'가상 질문 2'}],
    roadmap:[],labs:[],supports:[],distress:[],checks:{},triage:{items:[]},meta:{},
    outsideV4:{mustKeep:'원문 보존'}});
}
var chat=JSON.stringify([{w:'me',h:'가상 대화',c:'',at:1,key:'synthetic'}]);
function source(note,chatRaw){var value={note:note,chat:chatRaw};
  return {kind:'apuda.synthetic.v3.source',
    read:function(){return {note:value.note,chat:value.chat};},
    set:function(newNote,newChat){value.note=newNote;value.chat=newChat;},
    peek:function(){return {note:value.note,chat:value.chat};}};
}
function open(name){return new Promise(function(resolve,reject){
  var req=indexedDB.open(name,1);
  req.onupgradeneeded=function(){req.result.createObjectStore(api.STORE,{keyPath:'key'});};
  req.onsuccess=function(){resolve(req.result);};
  req.onerror=function(){reject(req.error||new Error('open-failed'));};
});}
function remove(name){return new Promise(function(resolve){
  var done=false,req=indexedDB.deleteDatabase(name);
  var timer=setTimeout(function(){finish(false);},5000);
  function finish(ok){if(!done){done=true;clearTimeout(timer);resolve(ok);}}
  req.onsuccess=function(){finish(true);};
  req.onerror=function(){finish(false);};
  req.onblocked=function(){};
});}
async function run(){
  button.disabled=true;list.replaceChildren();summary.textContent='가상 인계 시험 실행 중…';
  var suffix=crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2),
    names=[0,1,2].map(function(n){return api.PREFIX+suffix+'-'+n;}),
    dbs=[],cases=[],cleaned=false;
  function check(name,ok){cases.push({name:name,ok:!!ok});}
  try{
    dbs=await Promise.all(names.map(open));
    var a=dbs[0],b=await open(names[0]);dbs.push(b);
    var original=source(fixture('원본'),chat),before=original.peek();
    var first=await api.stage(a,original,0,false),row=await api.read(b);
    check('가상 V3 원문을 IndexedDB에 원자적 인계',first.status==='staged'&&first.revision===1);
    check('V3 건강기록의 UTF-8 원문 보존',row&&row.sourceNote===before.note);
    check('V3 대화 원문 보존',row&&row.sourceChat===before.chat);
    var candidate=JSON.parse(row.candidateRaw);
    check('V4 초안과 원본 해시 저장',/^[a-f0-9]{64}$/.test(row.sourceSha256)&&
      candidate.format==='apuda.note.v4.extended-draft'&&candidate.sourceArchive.original.raw===before.note);
    check('자동 이전·활성화·Drive 정리 영구 차단',row.readyForProduction===false&&
      row.allowActivation===false&&row.autoImportAllowed===false&&
      row.autoCleanupAllowed===false&&row.driveUploadAllowed===false&&row.drivePruneAllowed===false);
    var again=await api.stage(b,original,0,false),afterAgain=await api.read(a);
    check('동일 요청 재실행은 중복 저장하지 않음',again.status==='already-staged'&&
      afterAgain.revision===1&&JSON.stringify(afterAgain)===JSON.stringify(row));
    var alternate=source(fixture('다른 창'),chat);
    var clash=await api.stage(b,alternate,1,false),afterClash=await api.read(a);
    check('서로 다른 V3 원문으로 기존 초안 덮어쓰기 차단',
      clash.status==='manual-conflict-review'&&JSON.stringify(afterClash)===JSON.stringify(row));
    var originalBefore=original.peek();
    check('기존 가상 V3 원문은 수정하지 않음',
      originalBefore.note===before.note&&originalBefore.chat===before.chat);
    var driftReads=0,driftBefore={kind:'apuda.synthetic.v3.source',read:function(){
      driftReads++;return {note:driftReads===1?fixture('초기'):fixture('중간 수정'),chat:chat};
    }};
    var d=await api.stage(dbs[1],driftBefore,0,false);
    check('인계 직전 구형 탭 변경 감지',d.status==='source-drift-before-stage'&&
      (await api.read(dbs[1]))===null);
    var afterReads=0,driftAfter={kind:'apuda.synthetic.v3.source',read:function(){
      afterReads++;return {note:afterReads<=2?fixture('같음'):fixture('인계 직후 수정'),chat:chat};
    }};
    var e=await api.stage(dbs[1],driftAfter,0,false),staged=await api.read(dbs[1]);
    check('인계 직후 구형 탭 변경 감지·활성화 금지',e.status==='source-drift-after-stage'&&
      staged.readyForProduction===false&&staged.allowActivation===false);
    var f=await api.stage(dbs[2],source(fixture('강제 취소'),chat),0,true);
    check('트랜잭션 강제 중단 시 전체 원문 롤백',f.status==='aborted'&&(await api.read(dbs[2]))===null);
    var bad=false;try{await api.stage(dbs[2],source('{"bad":1}',chat),0,false);}catch(_){bad=true;}
    check('유효하지 않은 V3 기록 거부',bad&&(await api.read(dbs[2]))===null);
    var badChat=false;try{await api.stage(dbs[2],source(fixture('정상'),'{"not":"array"}'),0,false);}catch(_){badChat=true;}
    check('잘못된 대화 형식 거부',badChat&&(await api.read(dbs[2]))===null);
    var isolation=false;try{await api.read({name:'apuda_cancer_care_v1',transaction:function(){}});}catch(e){isolation=e.message==='synthetic-db-only';}
    check('실제 저장소 핸들 사용 거부',isolation);
  }catch(error){check('시험 실행 오류: '+(error&&error.message||error),false);}
  finally{
    dbs.forEach(function(db){try{db.close();}catch(e){}});
    var cleanedFlags=await Promise.all(names.map(remove));cleaned=cleanedFlags.every(Boolean);
    check('시험용 IndexedDB 3개 모두 삭제 확인',cleaned);
    cases.forEach(function(c){
      var li=document.createElement('li');li.className=c.ok?'pass':'fail';
      li.textContent=(c.ok?'통과 · ':'실패 · ')+c.name;list.appendChild(li);
    });
    var count=cases.filter(function(c){return c.ok;}).length;
    summary.textContent='결과 '+count+'/'+cases.length+' 통과 · '+(cases.length-count)+' 실패 · 임시 DB '+(cleaned?'삭제 확인':'삭제 미확인');
    summary.dataset.result=count===15&&cases.length===15&&cleaned?'pass':'fail';
    button.disabled=false;
  }
}
button.addEventListener('click',run);
})();
