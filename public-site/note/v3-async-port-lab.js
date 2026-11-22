/* Synthetic two-connection async UI port browser exercise. */
(function(){
'use strict';
var api=window.ApuDaV3SyntheticAsyncPort,contract=window.ApuDaV3UnifiedContractSandbox,
  runBtn=document.getElementById('run'),summary=document.getElementById('summary'),
  results=document.getElementById('results');
function note(s){return JSON.stringify({profile:{name:'가상 '+s,cancer:'가상암종'},
  logs:[],meds:[],questions:[{question:'가상 질문'}],unknownTop:{preserve:true}});}
function chat(s){return JSON.stringify([{w:'me',h:'가상 '+s,c:'',at:1,key:'synthetic'}]);}
function open(name){return new Promise(function(resolve,reject){
  var request=indexedDB.open(name,1);
  request.onupgradeneeded=function(){request.result.createObjectStore(contract.STORE,{keyPath:'key'});};
  request.onsuccess=function(){resolve(request.result);};
  request.onerror=function(){reject(request.error||new Error('db-failed'));};
});}
function deleteDb(name){return new Promise(function(resolve){
  var req=indexedDB.deleteDatabase(name),done=false,timer=setTimeout(function(){finish(false);},6000);
  function finish(v){if(!done){done=true;clearTimeout(timer);resolve(v);}}
  req.onsuccess=function(){finish(true);};req.onerror=function(){finish(false);};
});}
function vault(){
  var rows=[];
  return {capture:function(kind,raw,why){rows.push({kind:kind,raw:raw,why:why});return true;},
    count:function(){return rows.length;},
    exportText:function(){return JSON.stringify({format:'apuda.note.unsaved-review',reviewOnly:true,items:rows});}};
}
async function execute(){
  runBtn.disabled=true;summary.textContent='가상 DB 동시 저장 시험 진행 중…';results.replaceChildren();
  var name=contract.PREFIX+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()),
      conns=[],checks=[];
  function check(label,ok){checks.push({label:label,ok:!!ok});}
  try{
    var left=await open(name),right=await open(name);conns.push(left,right);
    var vaultA=vault(),vaultB=window.ApuDaNoteUnsavedDraft;
    var a=api.make(left,vaultA),b=api.make(right,vaultB);
    var initA=await a.initialize(),initB=await b.initialize();
    check('두 탭의 초기 revision 0',initA.revision===0&&initB.revision===0);
    var initial=await a.saveNote(note('초기'));
    check('비동기 완료 후에만 성공 반환',initial.status==='saved'&&initial.revision===1);
    check('확인된 기록 원문과 확장 필드 보존',initial.note===note('초기')&&
      JSON.parse(initial.note).unknownTop.preserve===true);
    check('Drive 백업·정리 권한 없음',initial.backupUploadAllowed===false&&
      initial.backupPruneAllowed===false&&initial.readyForProduction===false);
    var stale=await b.saveNote(note('낡은 탭'));
    check('오래된 탭의 저장 충돌 차단',stale.status==='blocked-review-required'&&stale.held===true);
    check('저장 실패 원문은 검토용 사본으로 유지',vaultB.count()===1&&
      JSON.parse(JSON.parse(vaultB.exportText()).items[0].raw).profile.name==='가상 낡은 탭');
    var paused=await b.saveChat(chat('추가 쓰기'));
    check('충돌 후 추가 저장 자동 금지',paused.status==='blocked-review-required'&&
      b.view().paused===true);
    check('최신 원본 덮어쓰기 차단', (await contract.read(left)).note===note('초기'));
    var c=api.make(right,vault());await c.initialize();
    var savedChat=await c.saveChat(chat('최신 대화'));
    check('대화 저장 후 기록과 동일 revision 유지',savedChat.status==='saved'&&
      savedChat.revision===2&&savedChat.note===note('초기'));
    var withoutApproval=await c.restore(note('복원'),{userConfirmed:true});
    check('독립 백업 미확인 시 복원 금지',withoutApproval.status==='explicit-confirmation-and-backup-required'&&
      (await contract.read(right)).revision===2);
    var restored=await c.restore(note('복원'),{userConfirmed:true,independentBackupVerified:true});
    check('승인된 가상 복원은 체크포인트 함께 저장',restored.status==='saved'&&restored.revision===3&&
      (await contract.read(right)).checkpoint.beforeNote===note('초기'));
    var deniedRecover=await c.recover({userConfirmed:false});
    check('복원 취소도 명시적 승인 필요',deniedRecover.status==='explicit-confirmation-required');
    var recovered=await c.recover({userConfirmed:true});
    check('검증된 복원 취소는 기록·대화 동시 복구',recovered.status==='saved'&&
      recovered.revision===4&&recovered.note===note('초기')&&recovered.chat===chat('최신 대화'));
    var d=api.make(left,vault()),e=api.make(right,vault());await d.initialize();await e.initialize();
    var race=await Promise.all([d.saveNote(note('경쟁 탭 A')),e.saveChat(chat('경쟁 탭 B'))]);
    var saved=race.filter(function(x){return x.status==='saved';}),rejected=race.filter(function(x){return x.status==='blocked-review-required';});
    check('실제 IndexedDB 경합 1건만 커밋',saved.length===1&&rejected.length===1);
    check('경합 이후 최신 revision 5', (await contract.read(left)).revision===5);
    var latest=api.make(left,vault());await latest.initialize();
    var deniedDelete=await latest.removeAll({userConfirmed:false,independentBackupVerified:false});
    check('삭제 승인·독립 백업 확인 없이는 금지',deniedDelete.status==='explicit-confirmation-and-backup-required');
    var deleted=await latest.removeAll({userConfirmed:true,independentBackupVerified:true});
    check('삭제는 revision을 유지한 tombstone',deleted.status==='saved'&&deleted.deleted===true&&
      deleted.note===null&&deleted.chat===null&&deleted.revision===6);
    var undoDelete=await d.saveNote(note('삭제 전 탭 재저장'));
    check('이전 탭은 삭제된 내용을 자동 재생성 불가',undoDelete.status==='blocked-review-required'&&
      (await contract.read(left)).deleted===true);
    var again=api.make(right,vault());await again.initialize();
    var resurrect=await again.saveNote(note('삭제 후 복원 시도'));
    check('신규 탭도 삭제 표식 무시 불가',resurrect.status==='blocked-review-required');
    check('저장 어댑터의 운영 준비 여부는 항상 거짓',again.view().readyForProduction===false);
  }catch(error){check('실행 중 오류: '+(error&&error.message||error),false);}
  finally{
    conns.forEach(function(c){try{c.close();}catch(_){}});
    var cleaned=false;try{cleaned=await deleteDb(name);}catch(_){}
    check('무작위 합성 IndexedDB 삭제 확인',cleaned);
    checks.forEach(function(c){
      var item=document.createElement('li');item.className=c.ok?'pass':'fail';
      item.textContent=(c.ok?'통과 · ':'실패 · ')+c.label;results.appendChild(item);
    });
    var pass=checks.filter(function(c){return c.ok;}).length;
    summary.dataset.result=pass===21&&checks.length===21&&cleaned?'pass':'fail';
    summary.textContent=pass+'/'+checks.length+' 통과 · '+(checks.length-pass)+' 실패 · 임시 DB '+(cleaned?'삭제 확인':'삭제 실패');
    runBtn.disabled=false;
  }
}
runBtn.addEventListener('click',execute);
})();
