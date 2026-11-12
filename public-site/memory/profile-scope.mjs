/**
 * ApuDa Memory -- scoped record proof-of-concept (R02).
 * NO live UI import, localStorage access, server sync, or patient data migration.
 */
export const PROFILE_VAULT_FORMAT='apuda-memory-profile-v1';
export const PROFILE_VAULT_VERSION=1;
export const PROFILE_MAX_RECORDS=20; // Existing total cap remains until approved.
const ID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS=['id','date','text','sleep','meal','medicationCheck','question'];
const OPTIONS={sleep:['좋음','보통','나쁨'],meal:['좋음','보통','부족'],medicationCheck:['확인함','확인 필요','문의 사항 있음']};
const isPlain=x=>x&&typeof x==='object'&&!Array.isArray(x)
  &&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const clone=x=>JSON.parse(JSON.stringify(x));
function validateId(id) {
  if(typeof id!=='string'||!ID_PATTERN.test(id))throw Error('안전한 임의 프로필 ID가 필요합니다.');
  return id.toLowerCase();
}
function validateRecord(r,scoped=false) {
  if(!isPlain(r)||Object.keys(r).some(k=>!(scoped?[...FIELDS,'profileId']:FIELDS).includes(k)))
    throw Error('잘못된 기록 객체 또는 알 수 없는 필드');
  if(typeof r.id!=='string'||r.id.length<1||r.id.length>100
     ||typeof r.text!=='string'||!r.text.trim()||r.text.length>1000)
    throw Error('기록 ID/메모 형식 오류');
  if(typeof r.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))throw Error('날짜 오류');
  const date=new Date(r.date+'T00:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==r.date)throw Error('실제 달력에 없는 날짜');
  if('question' in r&&(typeof r.question!=='string'||!r.question.trim()||r.question.length>300))
    throw Error('질문 길이/형식 오류');
  for(const [key,values] of Object.entries(OPTIONS))
    if(key in r&&!values.includes(r[key]))throw Error('관찰 선택값 오류');
  if(scoped)validateId(r.profileId);
}
function validateVault(v) {
  if(!isPlain(v)||v.format!==PROFILE_VAULT_FORMAT||v.version!==PROFILE_VAULT_VERSION
    ||!Array.isArray(v.profiles)||!Array.isArray(v.records)||!Array.isArray(v.unassigned)
    ||v.records.length+v.unassigned.length>PROFILE_MAX_RECORDS)throw Error('볼트 스키마/전체 20건 한도 오류');
  const pids=new Set(),rids=new Set();
  for(let i=0;i<v.profiles.length;i++) {
    const p=v.profiles[i];
    if(!isPlain(p)||Object.keys(p).sort().join(',')!=='id,label')throw Error('프로필 형식 오류');
    const id=validateId(p.id);
    if(pids.has(id)||p.label!=='돌봄 대상 '+(i+1))throw Error('중복 프로필 또는 비식별 별칭 오류');
    pids.add(id);
  }
  for(const r of v.records) {
    validateRecord(r,true);
    if(!pids.has(r.profileId.toLowerCase())||rids.has(r.id))throw Error('잘못된 대상 연결 또는 중복 기록 ID');
    rids.add(r.id);
  }
  for(const r of v.unassigned) {
    validateRecord(r,false);
    if(rids.has(r.id))throw Error('미분류 기록 ID 중복');
    rids.add(r.id);
  }
}
function assertProfile(v,id) {
  id=validateId(id);
  if(!v.profiles.some(p=>p.id===id))throw Error('선택한 프로필을 찾을 수 없습니다.');
  return id;
}
/** Requires secure Web Crypto; no user name or health data as profile ID. */
export function newAnonymousProfileId(webCrypto=globalThis.crypto) {
  if(typeof webCrypto?.randomUUID!=='function')throw Error('보안 UUID 생성 기능이 없습니다.');
  return validateId(webCrypto.randomUUID());
}
export function emptyProfileVault() {
  return {format:PROFILE_VAULT_FORMAT,version:PROFILE_VAULT_VERSION,profiles:[],records:[],unassigned:[]};
}
export function addAnonymousProfile(source,id) {
  validateVault(source);id=validateId(id);
  if(source.profiles.some(p=>p.id===id)||source.profiles.length>=20)throw Error('프로필 중복 또는 수량 제한');
  const v=clone(source);v.profiles.push({id,label:'돌봄 대상 '+(v.profiles.length+1)});
  validateVault(v);return v;
}
/** No getAll(): caller MUST explicitly select an existing profile ID. */
export function scopedRecords(source,profileId) {
  validateVault(source);profileId=assertProfile(source,profileId);
  return clone(source.records.filter(r=>r.profileId===profileId)
    .map(({profileId:ignored,...r})=>r));
}
export function appendScopedRecord(source,profileId,record) {
  validateVault(source);profileId=assertProfile(source,profileId);validateRecord(record,false);
  if(source.records.length+source.unassigned.length>=PROFILE_MAX_RECORDS)throw Error('전체 20건 저장 한도');
  if([...source.records,...source.unassigned].some(r=>r.id===record.id))throw Error('기록 ID 중복, 기존 내용 유지');
  const v=clone(source);v.records.push({...clone(record),profileId});validateVault(v);return v;
}
export function updateScopedRecord(source,profileId,record) {
  validateVault(source);profileId=assertProfile(source,profileId);validateRecord(record,false);
  const previous=source.records.find(r=>r.id===record.id);
  if(!previous||previous.profileId!==profileId)throw Error('다른 대상자의 기록은 수정할 수 없습니다.');
  const v=clone(source),index=v.records.findIndex(r=>r.id===record.id);
  v.records[index]={...clone(record),profileId};validateVault(v);return v;
}
export function removeScopedRecord(source,profileId,recordId) {
  validateVault(source);profileId=assertProfile(source,profileId);
  const existing=source.records.find(r=>r.id===recordId);
  if(!existing||existing.profileId!==profileId)throw Error('다른 대상자의 기록은 삭제할 수 없습니다.');
  const v=clone(source);v.records=v.records.filter(r=>r.id!==recordId);validateVault(v);return v;
}
/** Read-only legacy preflight. Unknown patients stay UNASSIGNED, never auto-mapped. */
export function planUnassignedLegacy(source,backup) {
  validateVault(source);
  if(!isPlain(backup)||backup.format!=='apuda-memory-care-diary'||![1,2].includes(backup.version)
    ||!Array.isArray(backup.entries)||backup.entries.length>20)throw Error('이전 JSON 파일 형식 오류');
  const existing=new Set([...source.records,...source.unassigned].map(r=>r.id));
  const seen=new Set(),conflictIds=[],candidates=[];
  for(const r of backup.entries) {
    validateRecord(r,false);
    if(backup.version===1&&['sleep','meal','medicationCheck','question'].some(k=>k in r))
      throw Error('이전 V1 파일에 V2 전용 필드가 있습니다.');
    if(seen.has(r.id))throw Error('원본 JSON 기록 ID 중복');
    seen.add(r.id);
    if(existing.has(r.id))conflictIds.push(r.id);
    else candidates.push(clone(r));
  }
  const exceeds=source.records.length+source.unassigned.length+candidates.length>PROFILE_MAX_RECORDS;
  return {mode:'unassigned-review-only',requiresUserApproval:true,
    sourceCount:backup.entries.length,possibleAdd:candidates.length,
    exceedsCurrentCap:exceeds,conflictIds,ready:!exceeds&&conflictIds.length===0,candidates};
}
