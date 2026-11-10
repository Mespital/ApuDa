/* ApuDa V4 development-only IndexedDB concurrency experiment.
 * All values are synthetic. No access to existing V3 storage or network.
 * This is NOT wired into the patient notebook or its migration flow.
 */
(function(){
  'use strict';
  var PREFIX='apuda-v4-synthetic-atomic-lab-';
  var STORE='synthetic-notes', KEY='synthetic-only';
  var run=document.getElementById('run');
  var summary=document.getElementById('summary');
  var results=document.getElementById('results');
  var synthetic=function(name){return {profile:{name:name,cancer:'가상 암종'},logs:[],meds:[],questions:[],unknownV3Field:{a:[1,2,3]},tempReadings:[{value:37.2,unit:'C'},{value:36.8,unit:'C'}]};};
  function openDb(name){
    return new Promise(function(resolve,reject){
      var request=indexedDB.open(name,1);
      request.onupgradeneeded=function(){request.result.createObjectStore(STORE,{keyPath:'key'});};
      request.onsuccess=function(){resolve(request.result);};
      request.onerror=function(){reject(request.error||new Error('open-failed'));};
      request.onblocked=function(){reject(new Error('open-blocked'));};
    });
  }
  function read(db){
    return new Promise(function(resolve,reject){
      var transaction=db.transaction(STORE,'readonly');
      var value=null;
      var request=transaction.objectStore(STORE).get(KEY);
      request.onsuccess=function(){value=request.result||null;};
      request.onerror=function(){reject(request.error||new Error('read-failed'));};
      transaction.oncomplete=function(){resolve(value);};
      transaction.onabort=function(){reject(transaction.error||new Error('read-aborted'));};
    });
  }
  // Version verification and the write belong to one readwrite transaction.
  // Overlapping readwrite transactions are serialized by the browser engine.
  function write(db,expectedRevision,value,abortAfterWrite){
    return new Promise(function(resolve,reject){
      var transaction;
      try{transaction=db.transaction(STORE,'readwrite');}catch(error){reject(error);return;}
      var outcome=null,deliberateAbort=false;
      var request=transaction.objectStore(STORE).get(KEY);
      request.onsuccess=function(){
        var prior=request.result||null;
        var revision=prior?prior.revision:0;
        if(revision!==expectedRevision){outcome={status:'conflict',revision:revision};return;}
        var next={key:KEY,revision:revision+1,value:value};
        var put=transaction.objectStore(STORE).put(next);
        put.onsuccess=function(){
          if(abortAfterWrite){deliberateAbort=true;transaction.abort();}
          else outcome={status:'saved',revision:next.revision};
        };
      };
      transaction.oncomplete=function(){resolve(outcome||{status:'unconfirmed'});};
      transaction.onabort=function(){
        if(deliberateAbort)resolve({status:'aborted'});
        else reject(transaction.error||new Error('write-aborted'));
      };
      transaction.onerror=function(){};
    });
  }
  function deleteDb(name){
    return new Promise(function(resolve){
      var request=indexedDB.deleteDatabase(name),settled=false;
      var timer=setTimeout(function(){done(false);},4000);
      function done(ok){if(!settled){settled=true;clearTimeout(timer);resolve(ok);}}
      request.onsuccess=function(){done(true);};
      request.onerror=function(){done(false);};
      // `blocked` is not necessarily terminal: a closing read transaction
      // may release its connection and allow deletion moments later.
      request.onblocked=function(){};
    });
  }
  function showCase(number,label,ok,detail){
    var article=document.createElement('section');article.className='case';
    var heading=document.createElement('h2');heading.textContent=number+' · '+label;
    var paragraph=document.createElement('p');
    var status=document.createElement('span');status.className=ok?'pass':'fail';status.textContent=ok?'통과':'실패';
    paragraph.appendChild(status);paragraph.appendChild(document.createTextNode(' — '+detail));
    article.appendChild(heading);article.appendChild(paragraph);results.appendChild(article);
  }
  async function execute(){
    run.disabled=true;results.replaceChildren();summary.textContent='합성 데이터베이스 시험 진행 중…';
    var id=PREFIX+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2));
    var dbA=null,dbB=null,checks=[];
    function check(label,ok,detail){checks.push({label:label,ok:ok,detail:detail});}
    try{
      if(!('indexedDB' in window))throw new Error('이 브라우저에서는 IndexedDB를 사용할 수 없습니다.');
      dbA=await openDb(id);dbB=await openDb(id);
      var first=synthetic('첫 가상 기록');
      var seeded=await write(dbA,0,first,false);
      check('초기 원자적 저장',seeded.status==='saved'&&seeded.revision===1,'신규 기록 리비전 1 생성');

      var left=synthetic('탭 A 가상 수정'),right=synthetic('탭 B 가상 수정');
      var responses=await Promise.all([write(dbA,1,left,false),write(dbB,1,right,false)]);
      var winners=responses.filter(function(x){return x.status==='saved';});
      var conflicts=responses.filter(function(x){return x.status==='conflict';});
      check('두 연결 동시 저장 충돌',winners.length===1&&conflicts.length===1,'한 연결만 저장하고 다른 연결은 충돌로 중단');

      var current=await read(dbA);
      var winningValue=responses[0].status==='saved'?left:right;
      check('다른 탭 수정 보존',!!current&&current.revision===2&&JSON.stringify(current.value)===JSON.stringify(winningValue),'최신 변경이 덮어써지지 않고 리비전 2 유지');

      var stale=await write(dbB,1,synthetic('오래된 사본으로 되돌리기'),false);
      var afterStale=await read(dbA);
      check('구버전 복구 차단',stale.status==='conflict'&&JSON.stringify(afterStale)===JSON.stringify(current),'오래된 리비전 1의 복구 요청을 거부');

      var aborted=await write(dbB,2,synthetic('실패를 주입한 저장'),true);
      var afterAbort=await read(dbA);
      check('실패한 트랜잭션 롤백',aborted.status==='aborted'&&JSON.stringify(afterAbort)===JSON.stringify(current),'쓰기 요청 후 강제 중단해도 원본 보존');

      var changed=await write(dbA,2,first,false);
      var verified=await read(dbB);
      check('가상 원문 필드 보존',changed.status==='saved'&&!!verified&&verified.revision===3&&JSON.stringify(verified.value)===JSON.stringify(first),'알 수 없는 필드와 복수 체온 항목 포함 원문 유지');
    }catch(error){check('시험 환경 오류',false,error&&error.message?error.message:String(error));}
    finally{
      if(dbA)dbA.close();if(dbB)dbB.close();
      var cleaned=false;
      try{if('indexedDB' in window)cleaned=await deleteDb(id);}catch(e){}
      checks.forEach(function(c,i){showCase(String(i+1).padStart(2,'0'),c.label,c.ok,c.detail);});
      var pass=checks.filter(function(c){return c.ok;}).length;
      summary.textContent='시험 결과: '+pass+'/'+checks.length+'건 통과 · '+(checks.length-pass)+'건 실패 · 가상 DB '+(cleaned?'삭제 확인':'삭제 미확인(브라우저 저장소를 확인해 주세요)');
      run.disabled=false;
    }
  }
  run.addEventListener('click',execute);
})();
