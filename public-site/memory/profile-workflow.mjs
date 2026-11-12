/**
 * ApuDa Memory Phase 14 -- isolated integration contract for anonymous profiles.
 * This module is NOT imported by index.html. It has no storage, DOM, network
 * or automatic legacy-data migration. Patient separation is NOT authentication.
 */
import {
  emptyProfileVault,addAnonymousProfile,scopedRecords,appendScopedRecord,
  updateScopedRecord,removeScopedRecord,PROFILE_MAX_RECORDS
} from './profile-scope.mjs';
import {buildProfileSummary,buildProfileConsultText} from './profile-summary.mjs';

export const SCOPED_BACKUP_FORMAT='apuda-memory-scoped-backup-v1';
export const SCOPED_BACKUP_VERSION=1;
const RECORD_KEYS=new Set(['id','date','text','sleep','meal','medicationCheck','question']);
const pureCopy=x=>JSON.parse(JSON.stringify(x));
const canonical=o=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b))));
function existsDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T00:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function validateCandidate(record) {
  if(!record || typeof record!=='object'||Array.isArray(record)||
     Object.keys(record).some(k=>!RECORD_KEYS.has(k)))throw Error('허용하지 않은 기록 필드가 있습니다.');
  // Reuse the existing strict record validator without modifying source.
  const id='d5a713e9-1327-4d98-8cf9-acc359bdd1d4';
  const tmp=addAnonymousProfile(emptyProfileVault(),id);
  appendScopedRecord(tmp,id,record);
}
function profileIdExists(vault,profileId){
  // Mandatory explicit selection and full vault validation.
  scopedRecords(vault,profileId);
  return profileId.toLowerCase();
}
function findCurrent(vault,profileId,recordId){
  return scopedRecords(vault,profileId).find(r=>r.id===recordId);
}
function assertOriginal(current,expected){
  if(!current || !expected || canonical(current)!==canonical(expected))
    throw Error('원본 기록이 수정·삭제되었거나 선택 대상이 달라 변경을 중단했습니다.');
}
/** Search NEVER changes storage and cannot access a different profile. */
export function readProfileView(vault,profileId,{query='',from='',to='',periodDays=7,endDate}={}){
  profileId=profileIdExists(vault,profileId);
  if(typeof query!=='string'||query.length>100||typeof from!=='string'||typeof to!=='string'||
     (from&&!existsDate(from))||(to&&!existsDate(to))||(from&&to&&from>to))
    throw Error('검색어 또는 날짜 범위 오류');
  const terms=query.normalize('NFKC').toLocaleLowerCase('ko-KR').trim().split(/\s+/).filter(Boolean);
  const all=scopedRecords(vault,profileId);
  const filtered=all.filter(r=>{
    if(from&&r.date<from)return false;
    if(to&&r.date>to)return false;
    const words=[r.date,r.text,r.question||'',r.sleep||'',r.meal||'',r.medicationCheck||'']
      .join(' ').normalize('NFKC').toLocaleLowerCase('ko-KR');
    return terms.every(term=>words.includes(term));
  }).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  return {
    profileId,allCount:all.length,visibleCount:filtered.length,records:filtered,
    // Summary scope is same profile, but independent of list search filters.
    summary:buildProfileSummary(vault,profileId,periodDays,endDate)
  };
}
/** All changes return copies; caller must separately implement approved atomic persistence. */
export function createProfileRecord(vault,profileId,record){
  profileId=profileIdExists(vault,profileId);
  return appendScopedRecord(vault,profileId,record);
}
export function changeProfileRecord(vault,profileId,record,expectedOriginal){
  profileId=profileIdExists(vault,profileId);
  validateCandidate(record);
  assertOriginal(findCurrent(vault,profileId,record.id),expectedOriginal);
  return updateScopedRecord(vault,profileId,record);
}
export function deleteProfileRecord(vault,profileId,recordId,expectedOriginal){
  profileId=profileIdExists(vault,profileId);
  assertOriginal(findCurrent(vault,profileId,recordId),expectedOriginal);
  return removeScopedRecord(vault,profileId,recordId);
}
/** Dedicated format: deliberately NOT accepted by existing legacy JSON restore. */
export function exportProfileBackup(vault,profileId){
  profileId=profileIdExists(vault,profileId);
  const records=scopedRecords(vault,profileId);
  records.forEach(validateCandidate);
  return {format:SCOPED_BACKUP_FORMAT,version:SCOPED_BACKUP_VERSION,
    sourceProfileId:profileId,entries:records};
}
function validateBackup(backup,profileId){
  if(!backup||typeof backup!=='object'||Array.isArray(backup)||
    Object.keys(backup).sort().join(',')!=='entries,format,sourceProfileId,version'||
    backup.format!==SCOPED_BACKUP_FORMAT||backup.version!==SCOPED_BACKUP_VERSION||
    backup.sourceProfileId!==profileId||!Array.isArray(backup.entries)||
    backup.entries.length>PROFILE_MAX_RECORDS)throw Error('대상자 전용 백업 형식·프로필 ID가 일치하지 않습니다.');
  const seen=new Set();
  for(const r of backup.entries){
    validateCandidate(r);
    if(seen.has(r.id))throw Error('백업에 기록 ID가 중복됩니다.');
    seen.add(r.id);
  }
}
/**
 * Read-only preflight: only exports from the SAME explicit profile may be used.
 * Another profile or an unassigned record with the same ID blocks import.
 * Legacy unscoped V1/V2 backups NEVER enter this path.
 */
export function planProfileImport(vault,profileId,backup) {
  profileId=profileIdExists(vault,profileId);
  validateBackup(backup,profileId);
  const all=new Map([...vault.records,...vault.unassigned].map(r=>[r.id,r]));
  const sameProfile=new Map(scopedRecords(vault,profileId).map(r=>[r.id,r]));
  const additions=[],alreadyPresent=[],conflictIds=[];
  for(const r of backup.entries){
    const old=all.get(r.id);
    if(!old)additions.push(pureCopy(r));
    else if(sameProfile.has(r.id)&&canonical(sameProfile.get(r.id))===canonical(r))
      alreadyPresent.push(r.id);
    else conflictIds.push(r.id);
  }
  const capExceeded=vault.records.length+vault.unassigned.length+additions.length>PROFILE_MAX_RECORDS;
  return {
    targetProfileId:profileId,sourceCount:backup.entries.length,
    wouldAdd:additions.length,alreadyPresent:alreadyPresent.length,
    conflictIds,capExceeded,ready:!conflictIds.length&&!capExceeded,
    // In-memory stale-state checks; NEVER persist or send these snapshots.
    expectedVault:JSON.stringify(vault),
    expectedBackup:JSON.stringify(backup)
  };
}
/**
 * Must be called only after explicit user confirmation and actual file checks.
 * No persistence: caller must still use one verified transaction + rollback.
 */
export function commitProfileImport(vault,profileId,backup,plan,confirmed=false){
  if(confirmed!==true)throw Error('대상자별 복원 명시적 확인이 필요합니다.');
  if(!plan||typeof plan!=='object'||!plan.ready||
     plan.expectedVault!==JSON.stringify(vault)||plan.expectedBackup!==JSON.stringify(backup))
    throw Error('원본 상태나 백업이 사전검사 이후 변경되어 복원을 중단합니다.');
  const current=planProfileImport(vault,profileId,backup);
  if(!current.ready||current.targetProfileId!==plan.targetProfileId)
    throw Error('현재 복원 대상을 안전하게 검증할 수 없습니다.');
  let out=vault,added=0;
  for(const r of backup.entries){
    const already=scopedRecords(out,profileId).find(old=>old.id===r.id);
    if(already)continue;
    out=appendScopedRecord(out,profileId,r);
    added+=1;
  }
  return {vault:out,added,skipped:current.alreadyPresent};
}
export function createProfileConsultText(vault,profileId,periodDays,endDate){
  profileId=profileIdExists(vault,profileId);
  return buildProfileConsultText(vault,profileId,periodDays,endDate);
}
