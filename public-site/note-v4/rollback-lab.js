/* UI-only adapter for the synthetic-only rollback laboratory. */
(function(global){
  'use strict';
  var doc=global.document,api=global.ApuDaV4RollbackLab;
  if(!doc||!api)return;
  var scenario=doc.getElementById('scenario'),status=doc.getElementById('status');
  var result=doc.getElementById('result'),outcome=doc.getElementById('outcome');
  var explanation=doc.getElementById('explanation'),events=doc.getElementById('events');
  var indicators=doc.getElementById('indicators'),button=doc.getElementById('run');
  function add(parent,tag,text,className){
    var node=doc.createElement(tag);node.textContent=text;
    if(className)node.className=className;
    parent.appendChild(node);return node;
  }
  function reset(){
    result.hidden=true;events.replaceChildren();indicators.replaceChildren();
    status.className='status';status.textContent='상황을 선택하고 시험 실행 버튼을 눌러 주세요.';
  }
  function describe(data){
    var o=data.outcome,s=data.state;
    result.hidden=false;events.replaceChildren();indicators.replaceChildren();
    outcome.className='outcome '+(o.kind==='restored'?'':o.kind);
    outcome.textContent=o.label;explanation.textContent=o.description;
    data.events.forEach(function(e){
      var words=e.kind==='ok'?'확인':e.kind==='interrupted'?'중단 가정':e.kind==='skipped'?'미실행':'차단';
      add(events,'li',e.step+' · '+words+' ('+e.code+')');
    });
    [
      ['기존 V3 원본','변경하지 않음'],
      ['운영 데이터 쓰기','0회'],
      ['가상 기존 대상값',s.targetMatchesBefore?'원래 상태':'다른 값 보존·자동 덮어쓰기 차단'],
      ['복구 체크포인트',s.checkpointExists?(s.checkpointVerified?'검증됨':'불일치'):'저장되지 않음'],
      ['가상 쓰기 시도',s.writeAttempts+'회'],
      ['가상 질문',data.questionCount+'개 (잘라내지 않음)']
    ].forEach(function(pair){var box=doc.createElement('div');add(box,'dt',pair[0]);add(box,'dd',pair[1]);indicators.appendChild(box);});
    status.className='status';status.textContent=o.label+' · 가상 데이터만 사용했고 운영 기록에는 접근하지 않았습니다.';
  }
  button.addEventListener('click',async function(){
    button.disabled=true;status.className='status';status.textContent='가상 시나리오를 검사하는 중입니다.';
    result.hidden=true;
    try{describe(await api.run(scenario.value));}
    catch(error){status.className='status error';status.textContent='시험 자체가 완료되지 않았습니다. 오류를 확인해 주세요: '+(error&&error.message||'unknown');}
    finally{button.disabled=false;}
  });
  doc.getElementById('reset').addEventListener('click',reset);
})(typeof window!=='undefined'?window:globalThis);
