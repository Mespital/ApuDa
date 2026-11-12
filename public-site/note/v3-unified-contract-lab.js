/* Browser test — ONLY synthetic IndexedDB, no production storage or network. */
(function(){
  'use strict';
  var api=window.ApuDaV3UnifiedContractSandbox;
  var button=document.getElementById('run'),summary=document.getElementById('summary');
  var results=document.getElementById('results');
  var expected=function(row){return api.expectedState(row.revision,row.note,row.chat);};
  var note=function(label){return JSON.stringify({profile:{name:label,cancer:'가상 암종'},
    logs:[],meds:[],questions:[{question:'가상 기록'}],unknownTop:{mustRemain:true}});};
  var chat=function(label){return JSON.stringify([{role:'user',text:label}]);};
  function open(name){return new Promise(function(resolve,reject){
    var req=indexedDB.open(name,1);
    req.onupgradeneeded=function(){req.result.createObjectStore(api.STORE,{keyPath:'key'});};
    req.onsuccess=function(){resolve(req.result);};
    req.onerror=function(){reject(req.error||new Error('db-open-failed'));};
    req.onblocked=function(){reject(new Error('db-open-blocked'));};
  });}
  function remove(name){return new Promise(function(resolve){
    var done=false,req=indexedDB.deleteDatabase(name),timer=setTimeout(function(){finish(false);},4000);
    function finish(ok){if(!done){done=true;clearTimeout(timer);resolve(ok);}}
    req.onsuccess=function(){finish(true);};req.onerror=function(){finish(false);};req.onblocked=function(){};
  });}
  function display(label,ok,detail,i){
    var section=document.createElement('section'),title=document.createElement('h2');
    var p=document.createElement('p'),mark=document.createElement('span');section.className='case';
    title.textContent=String(i).padStart(2,'0')+' · '+label;
    mark.className=ok?'pass':'fail';mark.textContent=ok?'통과':'실패';
    p.appendChild(mark);p.appendChild(document.createTextNode(' — '+detail));
    section.appendChild(title);section.appendChild(p);results.appendChild(section);
  }
  async function run(){
    button.disabled=true;results.replaceChildren();summary.textContent='가상 DB 실행 중…';
    var name=api.PREFIX+(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2));
    var left=null,right=null,checks=[];
    function check(label,ok,description){checks.push({label:label,ok:!!ok,description:description});}
    try{
      left=await open(name);right=await open(name);
      var a=note('초기 기록'),b=note('탭 A'),r=note('백업 복원');
      var first=await api.saveNote(left,api.expectedState(0,null,null),a);
      check('초기 기본 기록',first.status==='saved'&&first.revision===1,'revision 1');
      var row=await api.read(left);
      var c=await api.saveChat(right,expected(row),chat('첫 대화'));
      row=await api.read(left);
      check('대화 저장과 같은 수정번호',c.status==='saved'&&row.revision===2&&row.chat===chat('첫 대화'),'기록과 대화 모두 하나의 revision');

      var race=await Promise.all([
        api.saveNote(left,expected(row),b),
        api.saveChat(right,expected(row),chat('다른 탭'))
      ]);
      var afterRace=await api.read(left);
      check('서로 다른 탭의 동시 저장',race.filter(function(x){return x.status==='saved';}).length===1&&
        race.filter(function(x){return x.status==='conflict';}).length===1&&afterRace.revision===3,
        '기록/대화 중 하나만 성공');
      check('기존 알 수 없는 필드 보존',JSON.parse(afterRace.note).unknownTop.mustRemain===true,
        '확장 필드를 임의로 제거하지 않음');

      var stale=await api.restore(right,expected(row),r);
      check('오래된 탭의 복원 금지',stale.status==='conflict'&&
        (await api.read(left)).revision===3,'복원 파일이 최신 기록을 덮어쓰지 않음');
      var restored=await api.restore(left,expected(afterRace),r),cp=await api.read(right);
      check('원자적 체크포인트',restored.status==='saved'&&cp.revision===4&&
        cp.checkpoint.beforeNote===afterRace.note&&cp.checkpoint.beforeChat===afterRace.chat&&
        /^[a-f0-9]{64}$/.test(cp.checkpoint.beforeSha256),'원본 기록·대화·지문 함께 보관');

      var abort=await api.saveChat(left,expected(cp),chat('중단된 저장'),true);
      check('저장 중단 시 묶음 롤백',abort.status==='aborted'&&
        JSON.stringify(await api.read(right))===JSON.stringify(cp),'기록과 대화 및 복원 지점 모두 불변');

      var undo=await api.recover(right,expected(cp)),afterUndo=await api.read(left);
      check('검증된 복원 취소',undo.status==='saved'&&afterUndo.revision===5&&
        afterUndo.note===afterRace.note&&afterUndo.chat===afterRace.chat&&afterUndo.checkpoint===null,
        '이전 기록과 대화가 함께 복구됨');

      var del=await api.removeAll(left,expected(afterUndo)),deleted=await api.read(right);
      check('모든 의료 기록 원자적 삭제',del.status==='saved'&&deleted.deleted&&
        deleted.note===null&&deleted.chat===null&&deleted.checkpoint===null,'삭제 표식만 남김');
      var resurrect=await api.saveNote(right,expected(deleted),b);
      check('삭제 후 자동 재생성 금지',resurrect.status==='deleted-requires-manual-new-session',
        '이전 탭의 늦은 저장 금지');

      var plan=api.planBackup(deleted,{expectedRevision:deleted.revision,
        legacyTabsClosed:true,mixedVersionResolved:true,userConfirmed:true});
      check('Drive 업로드·정리 금지',plan.status==='blocked'&&!plan.uploadAllowed&&
        !plan.pruneAllowed,'동의 여부와 무관하게 개발용에서는 항상 차단');
      var isolation=false;
      try{await api.saveNote({name:'patient-note',transaction:left.transaction.bind(left)},expected(deleted),b);}
      catch(error){isolation=error.message==='synthetic-database-required';}
      check('실사용 저장소 격리',isolation&&deleted.revision===(await api.read(right)).revision,
        '가상 DB 접두사 외 접근 거절');
    }catch(error){check('브라우저 실행 중 오류',false,error&&error.message?error.message:String(error));}
    finally{
      if(left)left.close();if(right)right.close();
      var removed=false;try{removed=await remove(name);}catch(error){}
      checks.forEach(function(c,i){display(c.label,c.ok,c.description,i+1);});
      var passing=checks.filter(function(c){return c.ok;}).length;
      summary.textContent='결과: '+passing+'/'+checks.length+' 통과 · '+(checks.length-passing)+' 실패 · 가상 DB '+(removed?'삭제 확인':'삭제 미확인');
      summary.dataset.result=passing===12&&checks.length===12&&removed?'pass':'fail';
      button.disabled=false;
    }
  }
  button.addEventListener('click',run);
})();
