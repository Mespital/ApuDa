/**
 * ApuDa Memory - profile-scoped 7/30 day consultation summary (QA prototype).
 * Pure functions, no browser storage/network/DOM access, no automatic migration.
 * Every read requires an explicit anonymous profile ID.
 */
import {scopedRecords} from './profile-scope.mjs';

const labels={
  sleep:{'좋음':'평소와 비슷함','보통':'약간 달라짐','나쁨':'평소보다 어려움'},
  meal:{'좋음':'평소와 비슷함','보통':'약간 달라짐','부족':'식사량이 줄었음'},
  medicationCheck:{'확인함':'처방 내용 확인함','확인 필요':'확인이 필요함','문의 사항 있음':'의료진에게 질문 있음'}
};
export const FIELD_TITLES=Object.freeze({sleep:'수면',meal:'식사',medicationCheck:'처방·복약 확인'});
function checkDate(date){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('요약 기준 날짜 형식 오류');
  const value=new Date(date+'T00:00:00Z');
  if(!Number.isFinite(value.getTime())||value.toISOString().slice(0,10)!==date)throw Error('실제 달력에 없는 기준 날짜');
  return value;
}
function shiftDate(date,days){
  const d=checkDate(date);
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
function dailyField(records,field){
  if(records.length===0)return {kind:'day-missing',label:'날짜 기록 없음',values:[],unselected:0};
  const values=[...new Set(records.map(row=>row[field]).filter(value=>labels[field][value]))];
  const unselected=records.length-records.filter(row=>labels[field][row[field]]).length;
  if(!values.length)return {kind:'field-missing',label:'항목 미기록',values:[],unselected};
  const descriptions=values.map(value=>labels[field][value]);
  const kind=values.length>1?'multiple':unselected?'partial':'observed';
  const label=(values.length>1?'복수 관찰: ':'')+descriptions.join(' / ')+
    (unselected?' · '+unselected+'건 항목 미기록':'');
  return {kind,label,values,unselected};
}
/**
 * Returns only records belonging to exactly one selected profile.
 * "No record" is unknown, NEVER a normal/healthy observation.
 * The existing 20-record total cap may make 30-day summaries incomplete.
 */
export function buildProfileSummary(vault,profileId,periodDays,endDate){
  if(periodDays!==7&&periodDays!==30)throw Error('7일 또는 30일만 지원합니다.');
  checkDate(endDate);
  const selected=scopedRecords(vault,profileId);
  const person=vault.profiles.find(p=>p.id===profileId.toLowerCase());
  const startDate=shiftDate(endDate,1-periodDays);
  const records=selected.filter(row=>row.date>=startDate&&row.date<=endDate)
    .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  const buckets=new Map();
  for(const row of records){
    if(!buckets.has(row.date))buckets.set(row.date,[]);
    buckets.get(row.date).push(row);
  }
  const daily=Array.from({length:periodDays},(_,i)=>{
    const date=shiftDate(endDate,-i),items=buckets.get(date)||[];
    const fields={};
    for(const field of Object.keys(FIELD_TITLES))fields[field]=dailyField(items,field);
    return {date,recordCount:items.length,fields,
      questions:items.filter(row=>typeof row.question==='string'&&row.question.trim()).map(row=>row.question)};
  });
  const questions=records.filter(row=>typeof row.question==='string'&&row.question.trim())
    .map(row=>({date:row.date,text:row.question}));
  const countDays=daily.filter(day=>day.recordCount>0).length;
  return {
    profileId,profileLabel:person.label,periodDays,startDate,endDate,
    storedCount:records.length,allStoredForProfile:selected.length,
    observedDays:countDays,missingDays:periodDays-countDays,
    questionCount:questions.length,questions,
    totals:Object.fromEntries(Object.keys(FIELD_TITLES).map(field=>[
      field,records.filter(row=>labels[field][row[field]]).length
    ])),
    daily,records
  };
}
/** Copyable text only includes the selected anonymous profile. */
export function buildProfileConsultText(vault,profileId,periodDays,endDate){
  const s=buildProfileSummary(vault,profileId,periodDays,endDate);
  const parts=[
    'ApuDa Memory | 가상 대상자별 진료 준비 요약',
    '대상: '+s.profileLabel+' (테스트용 비식별 프로필)',
    '기간: '+s.startDate+' ~ '+s.endDate+' ('+s.periodDays+'일)',
    '기록일 '+s.observedDays+'일 / 보관된 기록 '+s.storedCount+
      '건 / 날짜 기록 없음 '+s.missingDays+'일',
    '※ 기록이 없는 날짜의 건강 상태는 알 수 없습니다. 진단·복약 지시 자료가 아닙니다.',
    '※ 전체 기록 보관 한도 20건이므로 기간 중 실제 관찰을 모두 포함하지 못할 수 있습니다.',
    '',
    '의료진에게 물어볼 질문'
  ];
  if(s.questions.length)for(const q of s.questions)parts.push('- '+q.date+': '+q.text);
  else parts.push('작성된 질문 없음');
  parts.push('','선택한 대상자의 기록');
  if(s.records.length)for(const record of s.records){
    parts.push('['+record.date+']');
    for(const [field,title] of Object.entries(FIELD_TITLES))
      if(labels[field][record[field]])parts.push('- '+title+': '+labels[field][record[field]]);
    parts.push('- 메모: '+record.text);
    if(record.question)parts.push('- 질문: '+record.question);
  }else parts.push('선택한 기간에 저장된 기록 없음');
  parts.push('','※ 이 파일은 가상 데이터만 포함합니다. 실제 환자 기록을 사용하지 마세요.');
  return parts.join('\n');
}
