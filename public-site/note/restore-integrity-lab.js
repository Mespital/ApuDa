/* DEV ONLY: synthetic Map tests, no user records, browser storage, or network APIs. */
(function () {
  'use strict';
  var api = window.ApuDaNoteStorage;
  var key = '__synthetic_restore_lab__', recovery = api.recoveryKey(key);
  var button = document.getElementById('run-tests');
  var board = document.getElementById('results');
  var summary = document.getElementById('summary');
  var cases = [
    ['V2 정상 복구', '이전 기록이 정확하게 돌아오고 체크포인트가 제거되는가?'],
    ['V2 사본 손상 차단', '복원 전 기록을 훼손하면 원본 기록과 사본을 보존하는가?'],
    ['V2 동일 길이 변조 탐지', '글자 수가 동일한 변조도 SHA-256 해시로 검출하는가?'],
    ['V1 자동 복구 차단', '구형 사본을 자동으로 적용하지 않고 기존 기록을 유지하는가?'],
    ['V1 사본 조회 유지', '구형 이전 기록을 수동 검토·다운로드용으로 조회할 수 있는가?'],
    ['저장 실패 후 사본 보존', '되돌리기 저장이 무시되어도 사본을 삭제하지 않는가?']
  ];
  function makeRecord(name) { return {profile:{name:name,cancer:'가상 암종'},logs:[],questions:[],meds:[]}; }
  function makeStorage(previous) {
    var data = new Map(previous === null ? [] : [[key,previous]]), intercept = null;
    return {
      getItem:function(k){return data.has(k)?data.get(k):null;},
      setItem:function(k,v){if(intercept && intercept('set',k)===false)return;data.set(k,String(v));},
      removeItem:function(k){if(intercept && intercept('remove',k)===false)return;data.delete(k);},
      block:function(fn){intercept=fn;}
    };
  }
  function requireCheck(condition, reason) { if(!condition)throw new Error(reason); }
  async function rejected(promise, message) {
    try { await promise; } catch(e) { requireCheck(e.message===message,'예상 오류 '+message+' 대신 '+e.message); return; }
    throw new Error('예상한 안전 차단이 발생하지 않았습니다.');
  }
  async function runCase(index) {
    var before=JSON.stringify(makeRecord('이전 가상 기록'));
    var next=makeRecord('새 가상 기록');
    var store=makeStorage(before);
    await api.replace(store,key,next,'synthetic-browser-check');
    var current=store.getItem(key);
    var checkpoint=JSON.parse(store.getItem(recovery));
    if(index===0){
      requireCheck(await api.recover(store,key),'복구 실패');
      requireCheck(store.getItem(key)===before && store.getItem(recovery)===null,'원본·체크포인트 불일치');
      return '원본 바이트 복구 · 사본 정리 확인';
    }
    if(index===1){
      checkpoint.before='{"broken":true}';
      store.setItem(recovery,JSON.stringify(checkpoint));
      await rejected(api.recover(store,key),'checkpoint-corrupted');
      requireCheck(store.getItem(key)===current && store.getItem(recovery)!==null,'원본 또는 체크포인트 손실');
      return '손상된 이전 기록 적용 차단 · 현재 기록 유지';
    }
    if(index===2){
      checkpoint.before=checkpoint.before.replace('이전 가상', '변조 가상');
      store.setItem(recovery,JSON.stringify(checkpoint));
      await rejected(api.recover(store,key),'checkpoint-corrupted');
      requireCheck(store.getItem(key)===current && store.getItem(recovery)!==null,'원본 또는 체크포인트 손실');
      return '같은 길이의 내용 변조도 감지';
    }
    if(index===3 || index===4){
      checkpoint.schemaVersion=1;
      delete checkpoint.beforeHash;
      delete checkpoint.beforeBytes;
      delete checkpoint.beforeExists;
      delete checkpoint.afterBytes;
      store.setItem(recovery,JSON.stringify(checkpoint));
      if(index===3){
        await rejected(api.recover(store,key),'legacy-checkpoint-review-required');
        requireCheck(store.getItem(key)===current && store.getItem(recovery)!==null,'V1 검증 차단 실패');
        return 'V1 자동 되돌리기 금지 · 기존 기록 보존';
      }
      requireCheck(api.checkpoint(store,key).before===before,'기존 사본 조회 실패');
      return 'V1 이전 기록을 수동 검토용으로 조회 가능';
    }
    store.block(function(operation,k){return !(operation==='set' && k===key);});
    await rejected(api.recover(store,key),'restore-not-saved');
    requireCheck(store.getItem(key)===current && store.getItem(recovery)!==null,'저장 실패 후 자료 손실');
    return '저장 무응답 감지 · 이전 기록 사본 보관';
  }
  function renderResults(results) {
    board.replaceChildren();
    results.forEach(function(result,i){
      var item=document.createElement('section'),head=document.createElement('h2'),desc=document.createElement('p'),status=document.createElement('p');
      item.className='case';head.textContent=String(i+1).padStart(2,'0')+' · '+cases[i][0];
      desc.textContent=cases[i][1];status.className='status '+(result.ok?'pass':'fail');
      status.textContent=(result.ok?'통과 — ':'실패 — ')+result.detail;
      item.append(head,desc,status);board.appendChild(item);
    });
  }
  button.addEventListener('click',async function(){
    button.disabled=true;
    summary.textContent='합성 데이터 6건을 검사하고 있습니다…';
    var results=[];
    for(var i=0;i<cases.length;i++){
      try{results.push({ok:true,detail:await runCase(i)});}
      catch(error){results.push({ok:false,detail:error.message||'알 수 없는 오류'});}
    }
    renderResults(results);
    var passed=results.filter(function(r){return r.ok;}).length;
    summary.textContent='합성 데이터 검사 결과: '+passed+' / '+cases.length+'건 통과 · '+(cases.length-passed)+'건 실패';
    button.disabled=false;
  });
})();
