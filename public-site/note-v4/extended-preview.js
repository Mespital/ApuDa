/* ApuDa V4 extended read-only preview, SYNTHETIC DATA ONLY.
 * No patient import, browser storage, form submission or network operation.
 * Contents are never interpreted as clinical instructions.
 */
(function(global){
  'use strict';
  var document=global.document;
  var ids=['summary','day-items','question-items','med-items','lab-items','plan-items','other-items'];
  var sequence=0;
  function $(id){return document.getElementById(id);}
  function node(tag,className,text){
    var item=document.createElement(tag);
    if(className)item.className=className;
    if(text!==undefined)item.textContent=String(text);
    return item;
  }
  function add(parent,tag,className,text){var child=node(tag,className,text);parent.appendChild(child);return child;}
  function present(value){return value!==null&&value!==undefined&&value!=='';}
  function display(value){return present(value)?String(value):'기록 없음';}
  function json(value){return JSON.stringify(value,null,2);}
  function describe(value){
    if(!present(value))return '기록 없음';
    if(typeof value==='object')return json(value);
    return String(value);
  }
  function empty(target){add(target,'p','empty','표시할 가상 기록이 없습니다.');}
  function item(target,title){var element=add(target,'article','item');add(element,'h3','',title);return element;}
  function field(target,label,value,unit){
    var outer=add(target,'div','mini');
    add(outer,'span','',label);
    add(outer,'b','',present(value)?String(value)+(unit||''):'기록 없음');
  }
  function line(target,label,value,style){add(target,'p',style||'',label+' · '+describe(value));}
  function sampleState(){
    return {
      profile:{name:'가상 환자',cancer:'유방암',hospital:'가상 병원',stage:'미기입',devices:[],rxCombo:[],rxPlan:[]},
      logs:[
        {id:'syn-01',date:'2026-11-10',author:'본인',temp:'36.8',
          tempReadings:[{value:'37.2',at:'2026-11-10T01:00:00Z'},{value:'36.8',at:'2026-11-10T08:00:00Z'}],
          pain:'0',meal:'0',note:'가상 기록입니다. 실제 환자 증상이나 진료 자료가 아닙니다.',sleep:'7',extraSynthetic:'가상 미정의 필드'},
        {id:'syn-02',date:'2026-11-10',author:'보호자',temp:'',pain:'',meal:'',note:'같은 날짜에 별도로 작성된 가상의 보호자 메모입니다.'},
        {id:'syn-03',date:'2026-11-09',temp:'36.6',pain:'2',meal:'50',note:'작성자 미확인 예시'}
      ],
      questions:[
        {question:'가상 질문 1: 검사 결과를 어떻게 확인하나요?',priority:'high'},
        {question:'가상 질문 2: 다음 진료 때 무엇을 준비하나요?',answer:'가상 답변: 진료 기록 확인'},
        {question:'가상 질문 3: 기존 기록을 어떻게 열람하나요?'},
        {question:'가상 질문 4: 같은 날짜 기록을 각각 볼 수 있나요?',priority:'normal'}
      ],
      meds:[{name:'가상 약 A',dose:'처방전 확인 필요',memo:'가상 데이터: 실제 투약 정보 아님'}],
      labs:[{date:'2026-11-09',wbc:'5.0',units:{wbc:'unknown'},note:'검사 수치 및 단위는 전부 가상 값'}],
      roadmap:[{date:'2026-11-11',title:'가상 외래 방문',time:'10:00',status:'planned'}],
      supports:['가족의 도움(가상)'],distress:[],checks:{syn:'기록 있음(가상)'},
      triage:{items:[],at:0},meta:{source:'synthetic-only'},distressValue:0,
      unknownTop:{foo:'가상 확장 필드'}
    };
  }
  function renderSummary(view,report){
    var summary=$('summary');
    var counts=[['건강 기록',report.dayCount+'건'],['진료 질문',report.questionCount+'개'],
      ['약 기록',report.medicationCount+'건'],['검사 결과',report.labCount+'건']];
    counts.forEach(function(pair){var box=add(summary,'div','stat');add(box,'strong','',pair[1]);add(box,'span','',pair[0]);});
    $('check').textContent='가상 자료 원본 '+report.originalBytes+'바이트 · SHA-256 '+report.originalSha256.slice(0,12)+'… · 변형 없이 검증됨 · 실제 이전/저장 불가';
  }
  function renderDays(days){
    var target=$('day-items');
    if(!days.length)return empty(target);
    days.slice().sort(function(a,b){return b.date.localeCompare(a.date)||a.sourceIndex-b.sourceIndex;}).forEach(function(day){
      var card=item(target,day.date+' · 원본 기록 '+(day.sourceIndex+1));
      line(card,'작성자',day.authorStatus==='recorded'?day.author:'작성자 미확인','subtle');
      var grid=add(card,'div','mini-grid');
      field(grid,'체온 마지막 입력값',day.temperature.latest,'℃');
      field(grid,'최고 체온',day.temperature.maximum,'℃');
      field(grid,'통증 점수(원문)',day.pain.rawScore);
      field(grid,'식사량(원문)',day.meal.rawPercent,'%');
      if(day.temperature.readings.length){
        var readings=add(card,'div','measurements');
        add(readings,'p','', '원본 체온 측정 '+day.temperature.readings.length+'회 · 저장된 입력 순서');
        day.temperature.readings.forEach(function(r,i){
          add(readings,'p','',String(i+1)+'회: '+display(r.value)+'℃ · 측정시각 '+display(r.at));
        });
      }
      add(card,'p','subtle','별도 체온 마지막 입력 필드에는 측정시각이 없어 추정하지 않습니다.');
      if(present(day.note))line(card,'메모 원문',day.note,'note');
      var known=['id','date','author','temp','tempReadings','pain','painSite','meal','note'];
      var other=Object.keys(day.sourceRecord).filter(function(k){return known.indexOf(k)<0;});
      if(other.length){var extra=add(card,'div','measurements');add(extra,'p','', '그 밖의 원본 기록');
        other.forEach(function(k){line(extra,k,day.sourceRecord[k]);});}
    });
  }
  function renderQuestions(questions){
    var target=$('question-items');
    if(!questions.length)return empty(target);
    questions.forEach(function(question,i){
      var card=item(target,'질문 '+(i+1));
      line(card,'질문',question.question);
      Object.keys(question).filter(function(key){return key!=='question';}).forEach(function(key){line(card,key,question[key]);});
    });
  }
  function renderObjects(target,rows,primary){
    if(!rows.length)return empty(target);
    rows.forEach(function(row,i){
      var card=item(target,(row[primary]||'가상 기록')+' · '+(i+1));
      Object.keys(row).forEach(function(key){line(card,key,row[key]);});
    });
  }
  function renderOther(view){
    var target=$('other-items');
    var categories=[['지원·돌봄',view.support],['정서 기록',view.distress],
      ['약 복용 확인',view.medicationChecks],['응급 관련 원문 체크',view.emergencyChecks],
      ['원본 메타 정보',view.metadata],['기타 최상위 원문',view.extensions],
      ['프로필 전체',view.profile]];
    categories.forEach(function(pair){
      var card=item(target,pair[0]);
      add(card,'p','',describe(pair[1]));
    });
  }
  function clear(){
    sequence++;
    ids.forEach(function(id){$(id).replaceChildren();});
    $('check').textContent='';
    $('content').hidden=true;
    $('status').className='status';
    $('status').textContent='가상 자료 화면을 비웠습니다. 브라우저 저장소의 데이터는 읽거나 변경하지 않았습니다.';
  }
  async function load(){
    var ticket=++sequence;
    ids.forEach(function(id){$(id).replaceChildren();});
    $('check').textContent='';
    $('content').hidden=true;
    $('status').className='status';
    $('status').textContent='코드에 포함된 가상 환자 자료의 원본 무결성을 검증 중입니다…';
    try{
      var storage=global.ApuDaNoteStorage,api=global.ApuDaV4ExtendedDraft;
      if(!storage||!api)throw new Error('missing-demo-dependencies');
      var raw=JSON.stringify(storage.envelope(sampleState()));
      var draft=await api.build(raw);
      var report=await api.verify(draft);
      if(ticket!==sequence)return;
      if(!report.valid||report.canWriteToV4!==false)throw new Error('unsafe-demo-state');
      renderSummary(draft.view,report);
      renderDays(draft.view.days);
      renderQuestions(draft.view.questions);
      renderObjects($('med-items'),draft.view.medications,'name');
      renderObjects($('lab-items'),draft.view.laboratoryResults,'date');
      renderObjects($('plan-items'),draft.view.appointmentsAndCarePlan,'title');
      renderOther(draft.view);
      $('content').hidden=false;
      $('status').textContent='가상 기록 '+report.dayCount+'건, 질문 '+report.questionCount+'개를 손실 없이 표시했습니다. 실제 기록은 연결되지 않았습니다.';
    }catch(error){
      if(ticket!==sequence)return;
      ids.forEach(function(id){$(id).replaceChildren();});
      $('content').hidden=true;
      $('status').className='status error';
      $('status').textContent='가상 미리보기를 검증하지 못해 내용을 표시하지 않았습니다. 개발자가 코드를 확인해야 합니다.';
    }
  }
  $('load').addEventListener('click',load);
  $('clear').addEventListener('click',clear);
})(window);
