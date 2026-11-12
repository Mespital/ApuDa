/**
 * ApuDa Memory Phase 15: pure, read-only preflight for legacy -> UNASSIGNED.
 * NOT imported by the real diary UI. No localStorage, network, browser DB,
 * file IO, health-data logging, and no automatic patient inference.
 */
import {planUnassignedLegacy,listUnassignedRecords,scopedRecords} from './profile-scope.mjs';

export const STAGING_KIND='apuda-memory-legacy-unassigned-qa-v1';
const copy=v=>JSON.parse(JSON.stringify(v));
function snapshot(v) {return JSON.stringify(v)}
/** Read-only plan. Existing records remain in their current buckets. */
export function prepareLegacyStaging(vault,legacyBackup) {
  const check=planUnassignedLegacy(vault,legacyBackup);
  if(!check.ready) {
    return {
      kind:STAGING_KIND,ready:false,
      reason:check.exceedsCurrentCap?'CAPACITY':'CONFLICT',
      conflictIds:[...check.conflictIds],overCapacity:check.exceedsCurrentCap,
      sourceCount:check.sourceCount,wouldAdd:check.possibleAdd,
      requiresUserApproval:true
    };
  }
  const original=snapshot(vault),input=snapshot(legacyBackup);
  const preview=copy(vault);
  preview.unassigned.push(...check.candidates.map(copy));
  // The existing scope validator is triggered for all known profiles.
  for(const p of preview.profiles)scopedRecords(preview,p.id);
  const held=listUnassignedRecords(preview);
  const added=check.candidates;
  if(held.length!==vault.unassigned.length+added.length ||
     preview.records.length!==vault.records.length ||
     preview.profiles.length!==vault.profiles.length ||
     snapshot(preview.records)!==snapshot(vault.records) ||
     snapshot(preview.profiles)!==snapshot(vault.profiles) ||
     added.some((r,i)=>snapshot(held[vault.unassigned.length+i])!==snapshot(r))) {
    throw Error('미분류 스테이징 건수·내용 검증에 실패했습니다.');
  }
  return {
    kind:STAGING_KIND,ready:true,requiresUserApproval:true,
    sourceCount:check.sourceCount,existingUnassigned:vault.unassigned.length,
    existingScoped:vault.records.length,wouldAdd:added.length,
    totalAfter:preview.records.length+preview.unassigned.length,
    // In-process snapshots only. Never persist these planning objects.
    expectedVault:original,expectedBackup:input,
    proposedVault:preview
  };
}
/** Apply to a NEW object only, after explicit approval; never persists. */
export function applyLegacyStaging(vault,legacyBackup,plan,confirmed=false) {
  if(confirmed!==true)throw Error('미분류 보존 전환에 대한 별도 명시적 확인이 필요합니다.');
  if(!plan||plan.kind!==STAGING_KIND||plan.ready!==true||
     plan.expectedVault!==snapshot(vault)||plan.expectedBackup!==snapshot(legacyBackup)) {
    throw Error('사전검사 이후 기존 기록 또는 백업이 변경되었습니다. 전환하지 않았습니다.');
  }
  const fresh=prepareLegacyStaging(vault,legacyBackup);
  if(!fresh.ready||snapshot(fresh.proposedVault)!==snapshot(plan.proposedVault))
    throw Error('사전검사 결과가 일치하지 않습니다. 전환하지 않았습니다.');
  return {
    vault:copy(fresh.proposedVault),added:fresh.wouldAdd,
    unassignedAfter:fresh.proposedVault.unassigned.length,
    scopedPreserved:fresh.proposedVault.records.length,
    // Caller must implement approved transactional persistence separately.
    persisted:false
  };
}
