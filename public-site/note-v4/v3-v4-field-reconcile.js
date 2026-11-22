/* ApuDa V3 -> V4 field-by-field inventory. Read-only preflight only.
 * No storage, imports, network, uploads, or destructive migration.
 */
(function (global) {
  'use strict';
  var MAX_PATHS=5000;
  var candidate={
    'logs[].date':['records[].date','날짜의 표기는 동일하지만 중복 기록 정책 검토 필요'],
    'logs[].author':['records[].author','본인/보호자 외 작성자는 별도 상태 필요']
  };
  var conditional={
    'logs[].temp':['records[].temperature','기존 다회 체온과 최신/최고 체온 구분을 유지해야 함'],
    'logs[].pain':['records[].pain','V4 0~10 정수 척도 충족 여부를 원문에서 확인해야 함'],
    'logs[].createdAt':['records[].createdAt','V3 시각 형식과 타임존 확인 필요'],
    'logs[].id':['records[].id','기존 ID와 새 ID 충돌을 방지해야 함']
  };
  var review={
    'logs[].painSite':['records[].painSite','기존 자유 서술 위치와 V4 선택지를 대조해야 함'],
    'logs[].meal':['records[].meal','V3 0~100%와 V4 4개 범주는 비가역적 변환 가능성'],
    'logs[].note':['records[].note','V4 메모 글자수/증상 유무 조건이 원문을 제한함'],
    'questions[].question':['questions[]','V4는 문자열 최대 3개, 각 120자 제한'],
    'logs[].tempReadings[].value':['없음','측정 시각과 함께 모든 체온값 보존 필요'],
    'logs[].tempReadings[].at':['없음','측정 시각과 날짜/타임존 유지 필요']
  };
  var kinds={candidate:'표현 후보',review:'추가 설계 필요',unsupported:'V4 구조 없음'};
  function present(value){
    if(value===undefined||value===null||value==='')return false;
    if(Array.isArray(value))return value.length>0;
    if(typeof value==='object')return Object.keys(value).length>0;
    return true;
  }
  function summarize(path,entry,context) {
    var status='unsupported',target='없음',reason='현재 V4 체험 데이터 구조에서 확인되지 않은 필드. 원본 보존 필수';
    if(Object.prototype.hasOwnProperty.call(candidate,path)){
      status='candidate';target=candidate[path][0];reason=candidate[path][1];
      if(path==='logs[].author' && (context.unknownAuthorDays>0||!entry.allAuthorKnown)){
        status='review';reason='본인·보호자 이외 값 또는 작성자 미확인 기록 포함';
      }
    } else if(Object.prototype.hasOwnProperty.call(conditional,path)){
      status='review';target=conditional[path][0];reason=conditional[path][1];
      if(path==='logs[].pain'&&entry.allIntegerPain) {status='candidate';reason='0~10 정수 범위 후보. 실제 전환 시 원본 0/미기록 구별 검증 필수';}
      if(path==='logs[].temp'&&entry.allValidTemperature&&!context.hasTempReadings){
        status='candidate';reason='단일 체온 표현 후보. 최신/최고·시각 별도 검증 필수';
      }
    } else if(Object.prototype.hasOwnProperty.call(review,path)){
      status='review';target=review[path][0];reason=review[path][1];
    }
    return {path:path,status:status,label:kinds[status],v4Field:target,reason:reason,
      occurrences:entry.occurrences,nonEmpty:entry.nonEmpty};
  }
  function compare(input){
    var storage=global.ApuDaNoteStorage,auditApi=global.ApuDaV3Compatibility;
    if(!storage||!storage.unpack||!auditApi||!auditApi.inspect)throw new Error('v3-check-required');
    var source=storage.unpack(input),check=auditApi.inspect(input);
    var inventory=Object.create(null),unique=0;
    function safeKey(parent,key){
      var simple=/^[A-Za-z_$][\w$]*$/.test(key);
      return simple?(parent?parent+'.'+key:key):(parent?parent:'')+'['+JSON.stringify(key)+']';
    }
    function visit(value,path,depth){
      if(depth>24)throw new Error('source-too-deep');
      if(Array.isArray(value)){
        if(!value.length) mark(path+'[]',value);
        value.forEach(function(row){visit(row,path+'[]',depth+1);});
      } else if(value!==null && typeof value==='object'){
        var keys=Object.keys(value);
        if(!keys.length && path)mark(path,value);
        keys.forEach(function(key){visit(value[key],safeKey(path,key),depth+1);});
      } else if(path)mark(path,value);
    }
    function mark(path,value){
      var item=inventory[path];
      if(!item){
        if(++unique>MAX_PATHS)throw new Error('too-many-distinct-fields');
        item=inventory[path]={occurrences:0,nonEmpty:0,allIntegerPain:true,allValidTemperature:true,allAuthorKnown:true};
      }
      item.occurrences++;
      if(present(value))item.nonEmpty++;
      if(path==='logs[].pain'&&present(value)){
        var p=Number(value);
        if(!Number.isInteger(p)||p<0||p>10)item.allIntegerPain=false;
      }
      if(path==='logs[].temp'&&present(value)){
        var t=Number(value);
        if(!Number.isFinite(t)||t<25||t>45)item.allValidTemperature=false;
      }
      if(path==='logs[].author'&&present(value)&&value!=='본인'&&value!=='보호자')item.allAuthorKnown=false;
    }
    visit(source,'',0);
    var context={unknownAuthorDays:check.counts.unknownAuthorDays,
      hasTempReadings:source.logs.some(function(d){return Array.isArray(d.tempReadings)&&d.tempReadings.length>0;})};
    var fields=Object.keys(inventory).map(function(path){return summarize(path,inventory[path],context);})
      .sort(function(a,b){return a.path.localeCompare(b.path);});
    var counts={candidate:0,review:0,unsupported:0};
    fields.forEach(function(field){counts[field.status]++;});
    return {mode:'read-only-field-reconciliation',readyForV4:false,sourceUnchanged:true,
      fieldPathCount:fields.length,counts:counts,fields:fields,
      groupCounts:{logs:source.logs.length,questions:(source.questions||[]).length,meds:(source.meds||[]).length,
        labs:(source.labs||[]).length,roadmap:(source.roadmap||[]).length},
      outsideBackupScope:check.outsideBackupScope,
      warning:'표현 후보는 자동 이전 승인이나 데이터 무손실을 의미하지 않습니다.'};
  }
  global.ApuDaV3V4FieldReconcile=Object.freeze({compare:compare});
})(typeof window!=='undefined'?window:globalThis);
