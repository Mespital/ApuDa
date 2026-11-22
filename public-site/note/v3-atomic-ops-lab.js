/* Development-only browser exercising synthetic V3 atomic operations. */
(function(){
  'use strict';
  var run=document.getElementById('run'),summary=document.getElementById('summary');
  var results=document.getElementById('results');
  var api=window.ApuDaV3AtomicOpsSandbox;
  var raw=function(name){return JSON.stringify({profile:{name:name,cancer:'가상 암종'},
    logs:[{date:'2026-11-11',tempReadings:[{value:37.2},{value:36.8}],unknownLog:{unit:'synthetic'}}],
    meds:[],questions:[{question:'가상 질문'}],unknownTop:{preserveMe:true}});};
  function openDb(name){
    return new Promise(function(resolve,reject){
      var req=indexedDB.open(name,1);
      req.onupgradeneeded=function(){req.result.createObjectStore(api.STORE,{keyPath:'key'});};
      req.onsuccess=function(){resolve(req.result);};
      req.onerror=function(){reject(req.error||new Error('db-open-failed'));};
      req.onblocked=function(){reject(new Error('db-open-blocked'));};
    });
  }
  function deleteDb(name){
    return new Promise(function(resolve){
      var done=false,req=indexedDB.deleteDatabase(name);
      var timeout=setTimeout(function(){finish(false);},4000);
      function finish(ok){if(!done){done=true;clearTimeout(timeout);resolve(ok);}}
      req.onsuccess=function(){finish(true);};
      req.onerror=function(){finish(false);};
      req.onblocked=function(){};
    });
  }
  function render(label,ok,detail,index){
    var box=document.createElement('section'),heading=document.createElement('h2');
    var line=document.createElement('p'),state=document.createElement('span');
    box.className='case';heading.textContent=String(index).padStart(2,'0')+' · '+label;
    state.className=ok?'pass':'fail';state.textContent=ok?'통과':'실패';
    line.appendChild(state);line.appendChild(document.createTextNode(' — '+detail));
    box.appendChild(heading);box.appendChild(line);results.appendChild(box);
  }
  async function execute(){
    run.disabled=true;results.replaceChildren();summary.textContent='합성 데이터 테스트 실행 중…';
    var id=api.PREFIX+(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));
    var dbA=null,dbB=null,checks=[];
    function check(label,ok,detail){checks.push({label:label,ok:!!ok,detail:detail});}
    try{
      dbA=await openDb(id);dbB=await openDb(id);
      var a=raw('첫 합성 기록'),b=raw('탭 A 작성'),c=raw('탭 B 작성'),restored=raw('백업 복원 합성 기록');
      var seed=await api.save(dbA,0,null,a);
      check('초기 기록 생성',seed.status==='saved'&&seed.revision===1,'가상 revision 1');

      var race=await Promise.all([api.save(dbA,1,a,b),api.save(dbB,1,a,c)]);
      check('동시 저장 경합',race.filter(function(x){return x.status==='saved';}).length===1&&
        race.filter(function(x){return x.status==='conflict';}).length===1,'정확히 하나만 성공하고 나머지는 충돌 감지');
      var winner=race[0].status==='saved'?b:c,current=await api.read(dbA);
      check('최신 기록 및 확장 필드 보존',current&&current.revision===2&&current.raw===winner&&
        JSON.parse(current.raw).unknownTop.preserveMe,'원문과 아직 정의되지 않은 필드 보존');

      var staleRestore=await api.restore(dbB,1,a,restored);
      check('구버전 복원 거부',staleRestore.status==='conflict'&&
        (await api.read(dbA)).raw===winner,'이미 바뀐 기록을 덮어쓰지 않음');

      var restoredResult=await api.restore(dbA,2,winner,restored);
      var checkpoint=await api.read(dbB);
      check('복원 체크포인트 보존',restoredResult.status==='saved'&&checkpoint.revision===3&&
        checkpoint.raw===restored&&checkpoint.checkpoint.before===winner&&
        /^[a-f0-9]{64}$/.test(checkpoint.checkpoint.beforeSha256),'원문 및 SHA-256 지문 기록');

      var staleRecovery=await api.recover(dbB,2,restored);
      check('구버전 복원취소 거부',staleRecovery.status==='conflict'&&
        (await api.read(dbA)).raw===restored,'오래된 탭의 복원 취소 거절');

      var recovery=await api.recover(dbB,3,restored),afterRecovery=await api.read(dbA);
      check('검증된 복원취소',recovery.status==='saved'&&afterRecovery.revision===4&&
        afterRecovery.raw===winner&&afterRecovery.checkpoint===null,'지문 검증 후 이전 상태로 원자적 복구');

      var aborted=await api.save(dbA,4,winner,a,true);
      check('중단된 트랜잭션 롤백',aborted.status==='aborted'&&
        JSON.stringify(await api.read(dbB))===JSON.stringify(afterRecovery),'강제 abort 후 기존 원문 유지');

      var deleted=await api.remove(dbB,4,winner),tombstone=await api.read(dbA);
      check('삭제 표시와 본문 소거',deleted.status==='saved'&&tombstone.revision===5&&
        tombstone.deleted===true&&tombstone.raw===null&&tombstone.checkpoint===null,'개인정보 바이트 없는 tombstone 저장');

      var staleSave=await api.save(dbA,4,winner,b);
      check('삭제 이후 오래된 저장 거부',staleSave.status==='conflict'&&
        JSON.stringify(await api.read(dbB))===JSON.stringify(tombstone),'삭제 이전 revision으로 새 기록 덮어쓰기 불가');

      var rejected=false;
      try{await api.save({name:'not-synthetic',transaction:dbA.transaction.bind(dbA)},0,null,a);}catch(error){rejected=error.message==='synthetic-database-required';}
      var invalid=false;
      try{await api.save(dbA,5,null,'{bad json');}catch(error){invalid=true;}
      check('격리 경계와 입력 검증',rejected&&invalid,'일반 DB명과 무효 JSON 접근 모두 차단');
    }catch(error){check('브라우저 실험 오류',false,error&&error.message?error.message:String(error));}
    finally{
      if(dbA)dbA.close();if(dbB)dbB.close();
      var deletedOk=false;
      try{deletedOk=await deleteDb(id);}catch(error){}
      checks.forEach(function(c,i){render(c.label,c.ok,c.detail,i+1);});
      var passing=checks.filter(function(c){return c.ok;}).length;
      summary.textContent='결과: '+passing+'/'+checks.length+' 통과 · '+(checks.length-passing)+' 실패 · 합성 DB '+(deletedOk?'삭제 확인':'삭제 미확인');
      summary.dataset.result=passing===11&&checks.length===11&&deletedOk?'pass':'fail';
      run.disabled=false;
    }
  }
  run.addEventListener('click',execute);
})();
