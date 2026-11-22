/* ApuDa synthetic-only V3 -> V4 IndexedDB transaction rehearsal.
 * Never reads localStorage, real note keys, user files, credentials or network.
 * NOT a V4 patient data store, automatic import, or approved migration.
 */
(function(){
  'use strict';
  var PREFIX='apuda-v4-synthetic-migration-lab-',STORE='trial-records',KEY='synthetic-only';
  var run=document.getElementById('run'),summary=document.getElementById('summary'),results=document.getElementById('results');
  function fixture(tag){
    return {
      profile:{name:'가상 시험 기록 '+tag,cancer:'가상 암종',devices:[],rxCombo:[],rxPlan:[]},
      logs:[
        {date:'2026-11-11',temp:'36.8',tempReadings:[{value:'37.3',at:'08:00'},{value:'36.8',at:'18:00'}],pain:'0',meal:'0',note:'합성 메모 😀',unmappedMeasurement:{value:12,unit:'unknown'}},
        {date:'2026-11-11',temp:'',pain:'',meal:'',note:'두 번째 가상 기록',otherField:[0,false,'']}
      ],
      questions:[{question:'가상 질문 1'},{question:'가상 질문 2'},{question:'가상 질문 3'},{question:'가상 질문 4',priority:'high',answer:'가상 답변'}],
      meds:[{name:'가상 약제'}],labs:[{date:'2026-11-11',unit:'unknown'}],roadmap:[],supports:[],distress:[],checks:{},triage:{items:[]},meta:{},unknownTop:{keepMe:0}
    };
  }
  function rawFixture(tag){
    return '\r\n '+JSON.stringify(ApuDaNoteStorage.envelope(fixture(tag)),null,2)+'\r\n';
  }
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
      var tx=db.transaction(STORE,'readonly'),value=null;
      var req=tx.objectStore(STORE).get(KEY);
      req.onsuccess=function(){value=req.result||null;};
      tx.oncomplete=function(){resolve(value);};
      tx.onabort=function(){reject(tx.error||new Error('read-aborted'));};
      tx.onerror=function(){};
    });
  }
  // A verification plan is read-only until it has passed its original digest,
  // source audit, and generated projection checks. Nothing here writes V3.
  async function importSynthetic(db,plan,expectedRevision,abortAfterPut){
    await ApuDaV4MigrationRehearsal.verify(plan);
    if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw new Error('invalid-revision');
    return new Promise(function(resolve,reject){
      var tx;
      try{tx=db.transaction(STORE,'readwrite');}catch(error){reject(error);return;}
      var outcome=null,deliberateAbort=false;
      var req=tx.objectStore(STORE).get(KEY);
      req.onsuccess=function(){
        var old=req.result||null,revision=old?old.revision:0;
        if(old&&old.originalSha256===plan.originalV3.sha256&&
           old.originalRaw===plan.originalV3.raw&&old.candidateRaw===plan.candidateV4.raw){
          outcome={status:'already-applied',revision:revision};return;
        }
        if(revision!==expectedRevision){outcome={status:'conflict',revision:revision};return;}
        // The full, raw V3 source AND V4 read-only proposal are committed or
        // rolled back together in ONE transaction. No V3 deletion occurs.
        var record={key:KEY,revision:revision+1,kind:'synthetic-rehearsal-only',
          originalRaw:plan.originalV3.raw,originalSha256:plan.originalV3.sha256,
          originalBytes:plan.originalV3.byteLength,candidateRaw:plan.candidateV4.raw,
          candidateSha256:plan.candidateV4.sha256,readyForProduction:false};
        var put=tx.objectStore(STORE).put(record);
        put.onsuccess=function(){
          if(abortAfterPut){deliberateAbort=true;tx.abort();}
          else outcome={status:'staged',revision:record.revision};
        };
      };
      tx.oncomplete=function(){resolve(outcome||{status:'unconfirmed'});};
      tx.onabort=function(){
        if(deliberateAbort)resolve({status:'aborted'});
        else reject(tx.error||new Error('transaction-aborted'));
      };
      tx.onerror=function(){};
    });
  }
  function removeSyntheticDb(name){
    return new Promise(function(resolve){
      var settled=false,req=indexedDB.deleteDatabase(name);
      var timer=setTimeout(function(){done(false);},4000);
      function done(ok){if(!settled){settled=true;clearTimeout(timer);resolve(ok);}}
      req.onsuccess=function(){done(true);};
      req.onerror=function(){done(false);};
      req.onblocked=function(){};
    });
  }
  function showCase(number,item){
    var article=document.createElement('section');article.className='case';
    var heading=document.createElement('h2');heading.textContent=number+' · '+item.label;
    var p=document.createElement('p'),indicator=document.createElement('span');
    indicator.className=item.ok?'pass':'fail';indicator.textContent=item.ok?'통과':'실패';
    p.appendChild(indicator);p.appendChild(document.createTextNode(' — '+item.detail));
    article.appendChild(heading);article.appendChild(p);results.appendChild(article);
  }
  async function execute(){
    run.disabled=true;results.replaceChildren();summary.textContent='격리된 가상 이전 시험 진행 중…';
    var id=PREFIX+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2));
    var dbA=null,dbB=null,checks=[];
    function check(label,ok,detail){checks.push({label:label,ok:ok,detail:detail});}
    try{
      if(!('indexedDB' in window))throw new Error('IndexedDB-unsupported');
      var source=rawFixture('원본'),sourceMap=new Map([['synthetic-V3-source',source]]);
      var plan=await ApuDaV4MigrationRehearsal.prepare(source,null);
      var report=await ApuDaV4MigrationRehearsal.verify(plan);
      check('원문 바이트·변환 초안 검증',report.valid&&report.days===2&&report.questions===4&&
        plan.originalV3.raw===source&&plan.readyForProduction===false,
        'CRLF·한글·이모지 포함 V3 원문과 4개 질문이 그대로 유지됨');

      dbA=await openDb(id);dbB=await openDb(id);
      var initial=await importSynthetic(dbA,plan,0,false),record=await read(dbB);
      check('원문과 V4 초안 원자적 저장',initial.status==='staged'&&!!record&&record.revision===1&&
        record.originalRaw===source&&record.candidateRaw===plan.candidateV4.raw&&
        record.readyForProduction===false,
        '하나의 IndexedDB 트랜잭션에서 원문·초안을 함께 저장');

      var duplicate=await importSynthetic(dbB,plan,0,false),afterDuplicate=await read(dbA);
      check('중복 이전 멱등성',duplicate.status==='already-applied'&&duplicate.revision===1&&
        JSON.stringify(afterDuplicate)===JSON.stringify(record),
        '동일 요청 재시도 시 복제하지 않고 리비전 1 유지');

      var sourceA=rawFixture('다른 탭 A'),sourceB=rawFixture('다른 탭 B');
      var planA=await ApuDaV4MigrationRehearsal.prepare(sourceA,null);
      var planB=await ApuDaV4MigrationRehearsal.prepare(sourceB,null);
      var race=await Promise.all([importSynthetic(dbA,planA,1,false),importSynthetic(dbB,planB,1,false)]);
      var current=await read(dbA);
      check('두 연결 동시 이전 충돌',race.filter(function(x){return x.status==='staged';}).length===1&&
        race.filter(function(x){return x.status==='conflict';}).length===1&&current.revision===2&&
        current.originalRaw===(race[0].status==='staged'?sourceA:sourceB),
        '리비전 1 동시 요청 중 한 건만 성공하고 다른 요청 차단');

      var stale=await importSynthetic(dbB,plan,1,false),afterStale=await read(dbA);
      check('구버전 재이전 차단',stale.status==='conflict'&&
        JSON.stringify(afterStale)===JSON.stringify(current),
        '과거 원본으로 최신 기록을 덮어쓰지 않음');

      var tampered=JSON.parse(JSON.stringify(planA));tampered.originalV3.raw+='!';
      var rejected=false;
      try{await importSynthetic(dbA,tampered,2,false);}catch(error){rejected=/snapshot-changed|invalid|changed/.test(error.message);}
      var afterTamper=await read(dbB);
      check('변조된 원문 거부',rejected&&JSON.stringify(afterTamper)===JSON.stringify(current),
        'SHA-256 검증 실패 시 쓰기 전에 중단');

      var aborted=await importSynthetic(dbA,plan,2,true),afterAbort=await read(dbB);
      check('중간 실패 시 전체 롤백',aborted.status==='aborted'&&
        JSON.stringify(afterAbort)===JSON.stringify(current),
        '저장 직후 트랜잭션 강제 중단으로 원문·초안 모두 이전 상태 유지');

      var retry=await importSynthetic(dbB,plan,2,false),afterRetry=await read(dbA);
      check('정상 재시도·원천 보존',retry.status==='staged'&&afterRetry.revision===3&&
        afterRetry.originalRaw===source&&sourceMap.get('synthetic-V3-source')===source&&
        JSON.parse(afterRetry.candidateRaw).view.days[0].sourceRecord.unmappedMeasurement.unit==='unknown'&&
        JSON.parse(afterRetry.candidateRaw).view.extensions.unknownTop.keepMe===0,
        '재시도 성공·V3 합성 원천 불변·미지 필드 원문 보존');
    }catch(error){check('시험 실행 오류',false,error&&error.message?error.message:String(error));}
    finally{
      if(dbA)dbA.close();if(dbB)dbB.close();
      var cleaned=false;
      try{if('indexedDB' in window)cleaned=await removeSyntheticDb(id);}catch(error){}
      checks.forEach(function(item,i){showCase(String(i+1).padStart(2,'0'),item);});
      var passed=checks.filter(function(x){return x.ok;}).length;
      summary.textContent='시험 결과: '+passed+'/'+checks.length+'건 통과 · '+(checks.length-passed)+'건 실패 · 가상 DB '+(cleaned?'삭제 확인':'삭제 미확인(브라우저 저장소 확인 필요)');
      run.disabled=false;
    }
  }
  run.addEventListener('click',execute);
})();
