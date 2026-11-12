import assert from 'node:assert/strict';
import {addAnonymousProfile,emptyProfileVault,appendScopedRecord,
  scopedRecords,listUnassignedRecords} from '../../public-site/memory/profile-scope.mjs';
import {prepareLegacyStaging,applyLegacyStaging} from '../../public-site/memory/legacy-staging.mjs';

const A='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
const B='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
const record=(id,date='2026-11-12',text='가상 기록')=>({id,date,text});
const initial=addAnonymousProfile(addAnonymousProfile(emptyProfileVault(),A),B);
const scoped=appendScopedRecord(initial,A,record('A-1'));
const vault={...scoped,unassigned:[record('unclassified-1','2026-11-10')]};
const backup={format:'apuda-memory-care-diary',version:2,entries:[
  record('legacy-1','2026-11-11','미분류로 들어갈 가상 기록 1'),
  record('legacy-2','2026-11-09','미분류로 들어갈 가상 기록 2')]};
const originalVault=JSON.stringify(vault),originalBackup=JSON.stringify(backup);
const plan=prepareLegacyStaging(vault,backup);
assert.equal(plan.ready,true);
assert.equal(plan.requiresUserApproval,true);
assert.equal(plan.wouldAdd,2);
assert.equal(plan.existingUnassigned,1);
assert.equal(plan.existingScoped,1);
assert.equal(plan.totalAfter,4);
assert.deepEqual(plan.proposedVault.unassigned.map(x=>x.id),
  ['unclassified-1','legacy-1','legacy-2']);
assert.equal(plan.proposedVault.records.length,1);
assert.deepEqual(scopedRecords(plan.proposedVault,A),scopedRecords(vault,A));
assert.equal(scopedRecords(plan.proposedVault,B).length,0);
assert.throws(()=>applyLegacyStaging(vault,backup,plan),/명시적 확인/);
assert.throws(()=>applyLegacyStaging(vault,backup,plan,true===false),/명시적 확인/);
const applied=applyLegacyStaging(vault,backup,plan,true);
assert.equal(applied.persisted,false);
assert.equal(applied.added,2);
assert.equal(applied.unassignedAfter,3);
assert.equal(applied.scopedPreserved,1);
assert.equal(listUnassignedRecords(applied.vault).length,3);
assert.equal(scopedRecords(applied.vault,A).length,1);
assert.equal(scopedRecords(applied.vault,B).length,0);
assert.equal(JSON.stringify(vault),originalVault);
assert.equal(JSON.stringify(backup),originalBackup);
applied.vault.unassigned[1].text='외부 수정';
assert.equal(JSON.stringify(vault),originalVault);
assert.equal(JSON.stringify(backup),originalBackup);
assert.throws(()=>applyLegacyStaging(vault,
  {...backup,entries:[{...backup.entries[0],text:'after plan'}]},plan,true),/변경/);
assert.throws(()=>applyLegacyStaging({...vault,unassigned:[
  ...vault.unassigned,record('new-after-plan')]},backup,plan,true),/변경/);
const collision=prepareLegacyStaging(vault,{...backup,entries:[record('A-1')]});
assert.equal(collision.ready,false);
assert.equal(collision.reason,'CONFLICT');
assert.deepEqual(collision.conflictIds,['A-1']);
const unassignedCollision=prepareLegacyStaging(vault,{...backup,entries:[record('unclassified-1')]});
assert.equal(unassignedCollision.ready,false);
const full=appendScopedRecord(
  appendScopedRecord(initial,A,record('seed-1')),B,record('seed-2'));
let atCap=full;
for(let i=0;i<18;i++)atCap=appendScopedRecord(atCap,B,record('cap-'+i));
assert.equal(atCap.records.length,20);
const over=prepareLegacyStaging(atCap,backup);
assert.equal(over.ready,false);
assert.equal(over.reason,'CAPACITY');
assert.equal(over.overCapacity,true);
assert.throws(()=>applyLegacyStaging(atCap,backup,over,true),/사전검사/);
const v1={format:'apuda-memory-care-diary',version:1,entries:[record('legacy-v1')]};
assert.equal(prepareLegacyStaging(vault,v1).ready,true);
assert.throws(()=>prepareLegacyStaging(vault,{...v1,entries:[
  {...record('bad-v1'),sleep:'좋음'}]}),/V1/);
assert.throws(()=>prepareLegacyStaging(vault,{...backup,entries:[record('bad-date','2026-02-30')]}),/달력/);
assert.throws(()=>prepareLegacyStaging(vault,{...backup,entries:[
  {...record('unknown'),secret:'silent-loss'}]}),/알 수 없는/);
assert.throws(()=>prepareLegacyStaging(vault,{...backup,entries:[record('dupe'),record('dupe')]}),/ID 중복/);
console.log('PASS: legacy V1/V2 preserved as UNASSIGNED, no profile inference, no writes, exact content/count, explicit approval, stale and conflict/capacity rejection');
