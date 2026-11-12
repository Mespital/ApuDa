/* Accessible display of synthetic-only preflight decisions. */
(function(global){
  'use strict';
  var doc=global.document,api=global.ApuDaV4BackupPreflightDemo;
  if(!doc||!api)return;
  var scenario=doc.getElementById('scenario'),status=doc.getElementById('status');
  var result=doc.getElementById('result'),outcome=doc.getElementById('outcome');
  var explanation=doc.getElementById('explanation'),indicators=doc.getElementById('indicators');
  var button=doc.getElementById('run');
  var reasons={pass:'원본·백업 목록·모의 용량 조건이 일치합니다. 이것은 실행 허가가 아닙니다.',
    'v3-conflict':'V3 원본이 변경되어 중단합니다. 현재 값을 자동으로 덮어쓰지 않습니다.',
    'target-conflict':'기존 V4 대상값이 바뀌어 중단합니다. 다른 탭의 변경을 보존합니다.',
    'insufficient-capacity':'모의 여유 공간이 부족합니다. 복구 정보부터 저장할 수 있어야 합니다.',
    'capacity-unknown':'저장 가능 공간을 확인하지 못하면 자동 진행을 허용하지 않습니다.',
    'manifest-mismatch':'백업 목록의 내용 또는 해시가 일치하지 않아 진행을 차단했습니다.'};
  function line(label,value){
    var node=doc.createElement('div'),name=doc.createElement('dt'),data=doc.createElement('dd');
    name.textContent=label;data.textContent=value;node.appendChild(name);node.appendChild(data);
    indicators.appendChild(node);
  }
  function reset(){result.hidden=true;indicators.replaceChildren();status.textContent='상황을 선택하고 검사를 시작해 주세요.';status.className='status';}
  function render(data){
    var r=data.report,passed=r.status==='simulated-pass';
    result.hidden=false;indicators.replaceChildren();outcome.className='outcome'+(passed?'':' blocked');
    outcome.textContent=passed?'가상 사전검사 조건 통과':'가상 사전검사 차단';
    explanation.textContent=reasons[r.reason];
    line('백업 목록 무결성',r.manifestVerified?'일치':'불일치');
    line('V3 원본 비교',r.originalV3Unchanged?'일치':'변경 감지');
    line('기존 V4 대상값 비교',r.previousV4Unchanged?'일치':'변경 감지');
    line('예상 필요 여유 공간',r.estimatedHeadroomBytes===null?'산정 전 차단':r.estimatedHeadroomBytes.toLocaleString('ko-KR')+'바이트 (모의)');
    line('가상 잔여 공간',r.availableBytes===null?'모름':r.availableBytes.toLocaleString('ko-KR')+'바이트');
    line('원본에 대한 실제 쓰기','0회');
    line('가상 질문 보존',data.questionCount+'개');
    line('운영 전환 가능 여부','불가');
    status.className='status';status.textContent=outcome.textContent+' · 실제 기록은 읽거나 쓰지 않았습니다.';
  }
  button.addEventListener('click',async function(){
    button.disabled=true;status.textContent='가상 자료를 검사하는 중입니다.';result.hidden=true;
    try{render(await api.run(scenario.value));}
    catch(error){status.className='status error';status.textContent='시험을 완료하지 못했습니다: '+(error&&error.message||'unknown');}
    finally{button.disabled=false;}
  });
  doc.getElementById('reset').addEventListener('click',reset);
})(typeof window!=='undefined'?window:globalThis);
