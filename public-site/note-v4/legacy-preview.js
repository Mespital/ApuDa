/* ApuDa V3 read-only preview. Explicit synthetic data only in this pilot.
 * Never accesses localStorage/sessionStorage or performs network requests.
 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const dataApi = window.ApuDaNoteStorage;
  const auditApi = window.ApuDaV3Compatibility;
  const archiveApi = window.ApuDaV3LosslessStage;
  let requestId = 0;

  function node(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = String(content);
    return element;
  }
  function entry(parent, heading, lines, original) {
    const article = node('article','entry');
    article.appendChild(node('strong','',heading));
    lines.filter((line) => line !== null && line !== undefined && line !== '').forEach((line) => {
      article.appendChild(node('p','',line));
    });
    if (original !== undefined) {
      const details = node('details','');
      details.appendChild(node('summary','', '원본 항목 확인'));
      const raw = JSON.stringify(original,null,2);
      const clipped = raw.length > 4000 ? raw.slice(0,4000)+'\n…(미리보기 제한. 전체 원문은 원본 JSON에 보존)' : raw;
      details.appendChild(node('pre','',clipped));
      article.appendChild(details);
    }
    parent.appendChild(article);
  }
  function empty(parent, message='기록 없음') { parent.appendChild(node('p','empty',message)); }
  function reset() {
    requestId++;
    $('choose').value='';
    $('screen').hidden=true;
    ['summary','daily','questions','meds','labs','plans','others','risks'].forEach((id) => $(id).replaceChildren());
    $('integrity').textContent='';
    $('status').className='status';
    $('status').textContent='가상 기록 버튼을 눌러 시작하세요.';
  }
  function status(text, failure=false) {
    $('status').className='status'+(failure?' error':'');
    $('status').textContent=text;
  }
  function text(value, unknown='미기록') {
    return value === null || value === undefined || value === '' ? unknown : String(value);
  }
  function date(value) {
    const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match?`${Number(match[2])}월 ${Number(match[3])}일 (${match[1]})`:text(value);
  }
  function temp(value) { return typeof value==='number' && Number.isFinite(value)?`${value.toFixed(1)}℃`:'미측정'; }
  function sampleState() {
    return {
      profile:{name:'가상환자',cancer:'유방암',hospital:'가상병원',devices:[],rxCombo:[],rxPlan:[]},
      logs:[
        {id:'synthetic-1',date:'2026-11-10',temp:'36.8',tempReadings:[{value:'37.2',at:'2026-11-10T00:30:00Z'},{value:'36.8',at:'2026-11-10T06:00:00Z'}],pain:'0',meal:'0',note:'가상 환자의 피로 메모입니다.',weight:'58.5'},
        {id:'synthetic-2',date:'2026-11-09',temp:'',pain:'',meal:'50',note:''}
      ],
      roadmap:[{id:'synthetic-plan',date:'2026-11-12',title:'가상 외래 진료',time:'10:00',status:'planned'}],
      meds:[{id:'synthetic-med',name:'가상약',dose:'처방전 확인 필요',active:'yes'}],
      labs:[{id:'synthetic-lab',date:'2026-11-08',anc:'5.0',units:{anc:'unknown'}}],
      questions:[{question:'가상 질문 1'},{question:'가상 질문 2'},{question:'가상 질문 3'},{question:'가상 질문 4',priority:'high'}],
      supports:[],distress:[],checks:{},triage:{items:[],at:0},meta:{}
    };
  }
  function summary(state, check, integrity) {
    const quantities=[['건강기록',state.logs.length],['진료 질문',state.questions.length],['등록된 약',state.meds.length],['진료·치료 일정',state.roadmap.length],['검사 결과',state.labs.length],['그 밖의 기록',(state.supports||[]).length+(state.distress||[]).length]];
    quantities.forEach(([label,count])=>{
      const box=node('div','stat');box.appendChild(node('b','',count+'건'));box.appendChild(node('small','',label));$('summary').appendChild(box);
    });
    $('integrity').textContent=`검증된 원본 크기: ${integrity.byteLength.toLocaleString('ko-KR')}바이트 · SHA-256: ${integrity.sha256.slice(0,16)}… · V4 이전은 실행되지 않았습니다.`;
  }
  function daily(state,check) {
    const list=state.logs.map((record,i)=>({record,audit:check.days[i]})).sort((a,b)=>b.record.date.localeCompare(a.record.date));
    if(!list.length)return empty($('daily'));
    const shown=list.slice(0,60);
    shown.forEach(({record,audit})=>{
      const readings=(record.tempReadings||[]).map((r)=>`${text(r.value)}℃ (${text(r.at,'측정 시각 미상')})`);
      entry($('daily'),date(record.date),[
        `최근 체온: ${temp(audit.latestTemperature)} · 하루 최고: ${temp(audit.maximumTemperature)} · 측정 ${audit.temperatureReadingCount}회`,
        `통증: ${audit.pain===null?'미기록':audit.pain+'점 / 10점'}${record.painSite?' · 위치: '+record.painSite:''}`,
        `식사량: ${audit.mealPercent===null?'미기록':audit.mealPercent+'% (평소 대비)'}`,
        readings.length?'측정별 체온: '+readings.join(' / '):'',
        record.note?'기존 메모: '+record.note:'',
        `작성자: ${audit.authorKnown?record.author:'기존 기록 · 작성자 미확인'}`
      ],record);
    });
    if(list.length>shown.length)empty($('daily'),`전체 ${list.length}건 중 최근 ${shown.length}건을 표시합니다. 나머지 원문도 보관 대상입니다.`);
  }
  function simpleList(id,rows,label,formatter) {
    const host=$(id);if(!rows.length)return empty(host);
    rows.forEach((row,i)=>entry(host,label(row,i),formatter(row),row));
  }
  function render(state,check,integrity) {
    summary(state,check,integrity);daily(state,check);
    simpleList('questions',state.questions,(q,i)=>`${i+1}번 질문`,(q)=>[
      text(q.question),q.priority?'우선순위: '+q.priority:'',q.answer?'기존 답변: '+q.answer:''
    ]);
    simpleList('meds',state.meds,(r,i)=>text(r.name,`약 ${i+1}`),(r)=>[
      r.dose?'기존 용량 기록: '+r.dose:'',r.schedule?'기존 복용 일정: '+r.schedule:'',r.memo?'메모: '+r.memo:''
    ]);
    simpleList('labs',state.labs,(r)=>date(r.date),(r)=>{
      const keys=['anc','wbc','plt','hb'];const lines=keys.filter((key)=>r[key]!==undefined&&r[key]!==null&&r[key]!=='').map((key)=>{
        const unit=r.units&&r.units[key];return `${key.toUpperCase()}: ${text(r[key])} (${text(unit,'단위 미상')})`;
      });return lines.length?lines:['검사 결과 원문을 확인해 주세요.'];
    });
    simpleList('plans',state.roadmap,(r)=>date(r.date),(r)=>[
      text(r.title),r.time?'기록된 시간: '+r.time:'',r.status?'기록된 상태: '+r.status:''
    ]);
    const other=[['기본 정보',state.profile],['복약 확인',state.checks],['정서 기록',state.distress],['돌봄·지원',state.supports],['응급 체크 기록',state.triage],['백업 메타정보',state.meta]];
    if(Object.hasOwn(state,'distressValue'))other.push(['마지막 정서 점수',state.distressValue]);
    const known=['profile','logs','roadmap','meds','labs','questions','supports','distress','checks','triage','meta','distressValue'];
    Object.keys(state).filter((key)=>!known.includes(key)).forEach((key)=>other.push([`추가 기록 필드: ${key}`,state[key]]));
    other.forEach(([label,value])=>entry($('others'),label,[(Array.isArray(value)?value.length+'건':Object.keys(value||{}).length+'개 필드')+' · 원본 내용 유지'],value));
    if(!check.issues.length)empty($('risks'),'차단 사유 없음');
    else check.issues.forEach((issue)=>entry($('risks'),`${issue.priority} · ${issue.code}`,[issue.message]));
    $('screen').hidden=false;
  }
  async function preview(raw,serial) {
    try {
      if(typeof raw!=='string')throw new Error('invalid-input');
      const archive=await archiveApi.stage(raw);
      const integrity=await archiveApi.verify(archive);
      if(serial!==requestId)return;
      const state=dataApi.unpack(raw),check=auditApi.inspect(raw);
      render(state,check,integrity);
      status(`원본 검증 완료 · 건강기록 ${state.logs.length}건 · 질문 ${state.questions.length}건 · V4로 이전하지 않았습니다.`);
    } catch(_) {
      if(serial!==requestId)return;
      $('screen').hidden=true;
      status('파일을 읽거나 검증하지 못했습니다. 이 화면은 기존 기록을 변경하지 않았습니다.',true);
    }
  }
  $('sample').addEventListener('click',()=>{
    reset();const serial=requestId;status('가상 기록을 확인하고 있습니다…');
    preview(JSON.stringify(dataApi.envelope(sampleState())),serial);
  });
  $('choose').addEventListener('change',async(e)=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;
    reset();const serial=requestId;
    if(file.size>dataApi.MAX_BYTES){status('파일이 16MiB를 초과했습니다. 다른 가상 시험 파일을 선택해 주세요.',true);return;}
    status('선택한 시험 JSON 파일을 기기 안에서 검사하고 있습니다…');
    try{const raw=await file.text();if(serial===requestId)await preview(raw,serial);}
    catch(_){if(serial===requestId)status('파일을 읽지 못했습니다. 기존 수첩은 변경되지 않았습니다.',true);}
  });
  $('clear').addEventListener('click',reset);
})();
