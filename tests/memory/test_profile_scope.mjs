import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {
  newAnonymousProfileId,emptyProfileVault,addAnonymousProfile,
  scopedRecords,appendScopedRecord,updateScopedRecord,removeScopedRecord,
  planUnassignedLegacy,PROFILE_MAX_RECORDS
} from '../../public-site/memory/profile-scope.mjs';

const alpha='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
const beta='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
assert.match(newAnonymousProfileId(webcrypto),/^[0-9a-f-]{36}$/);
assert.notEqual(newAnonymousProfileId(webcrypto),newAnonymousProfileId(webcrypto));
const virgin=emptyProfileVault();
const a=addAnonymousProfile(virgin,alpha);
const b=addAnonymousProfile(a,beta);
assert.equal(a.profiles.length,1);
assert.equal(b.profiles.length,2);
assert.equal(virgin.profiles.length,0,'pure profile builder leaves the source unchanged');
assert.deepEqual(b.profiles.map(p=>p.label),['돌봄 대상 1','돌봄 대상 2']);
assert.ok(!JSON.stringify(b).includes('patientName'));
const item=(id,date='2026-11-12',text='합성 관찰 기록')=>({id,date,text,question:'가상 질문'});
const withA=appendScopedRecord(b,alpha,item('alpha-1'));
const withBoth=appendScopedRecord(withA,beta,item('beta-1'));
assert.equal(scopedRecords(withBoth,alpha).length,1);
assert.equal(scopedRecords(withBoth,beta).length,1);
assert.equal(scopedRecords(withBoth,alpha)[0].id,'alpha-1');
assert.equal(scopedRecords(withBoth,beta)[0].id,'beta-1');
assert.ok(!scopedRecords(withBoth,alpha).some(r=>r.id==='beta-1'));
assert.ok(!scopedRecords(withBoth,beta).some(r=>r.id==='alpha-1'));
assert.throws(()=>scopedRecords(withBoth),/임의 프로필 ID/);
assert.throws(()=>scopedRecords(withBoth,'e4ad61f3-4cf2-40a8-a38c-1d098c91d644'),/프로필을 찾을 수 없습니다/);
assert.throws(()=>updateScopedRecord(withBoth,alpha,item('beta-1')),/다른 대상자/);
assert.throws(()=>removeScopedRecord(withBoth,alpha,'beta-1'),/다른 대상자/);
assert.throws(()=>appendScopedRecord(withBoth,alpha,item('beta-1')),/기록 ID 중복/);
const updated=updateScopedRecord(withBoth,alpha,item('alpha-1','2026-11-12','수정된 가상 기록'));
assert.equal(scopedRecords(updated,alpha)[0].text,'수정된 가상 기록');
assert.equal(scopedRecords(withBoth,alpha)[0].text,'합성 관찰 기록');
assert.equal(scopedRecords(updated,beta)[0].text,'합성 관찰 기록');
const removed=removeScopedRecord(updated,alpha,'alpha-1');
assert.equal(scopedRecords(removed,alpha).length,0);
assert.equal(scopedRecords(removed,beta).length,1);
assert.equal(scopedRecords(updated,alpha).length,1);
const extracted=scopedRecords(withBoth,alpha);
extracted[0].text='외부 변조';
assert.equal(scopedRecords(withBoth,alpha)[0].text,'합성 관찰 기록','read results are deep copies');
assert.throws(()=>addAnonymousProfile(withBoth,alpha),/프로필 중복/);
assert.throws(()=>appendScopedRecord(withBoth,beta,{...item('bad'),date:'2026-02-30'}),/달력/);
assert.throws(()=>appendScopedRecord(withBoth,beta,{...item('bad'),rogue:'unknown'}),/알 수 없는/);
assert.throws(()=>appendScopedRecord(withBoth,beta,{...item('bad'),sleep:'판정'}),/선택값/);
let nearLimit=withBoth;
for(let k=0;k<PROFILE_MAX_RECORDS-2;k++)nearLimit=appendScopedRecord(nearLimit,alpha,item('added-'+k));
assert.equal(nearLimit.records.length,20);
assert.throws(()=>appendScopedRecord(nearLimit,beta,item('over-limit')),/전체 20건/);
const old={format:'apuda-memory-care-diary',version:2,entries:[
  {id:'old-1',date:'2026-11-09',text:'과거 가상 기록',sleep:'나쁨'},
  {id:'old-2',date:'2026-11-10',text:'과거 가상 질문',question:'예시 질문'}
]};
const oldSnapshot=JSON.stringify(old),vaultSnapshot=JSON.stringify(withBoth);
const plan=planUnassignedLegacy(withBoth,old);
assert.equal(plan.mode,'unassigned-review-only');
assert.equal(plan.requiresUserApproval,true);
assert.equal(plan.ready,true);
assert.equal(plan.possibleAdd,2);
assert.deepEqual(plan.conflictIds,[]);
assert.equal(withBoth.unassigned.length,0);
assert.equal(scopedRecords(withBoth,alpha).length,1,'legacy entries were never auto-assigned to profile A');
assert.equal(scopedRecords(withBoth,beta).length,1,'legacy entries were never auto-assigned to profile B');
plan.candidates[0].text='changed';
assert.equal(JSON.stringify(old),oldSnapshot,'plan never modifies old backup');
assert.equal(JSON.stringify(withBoth),vaultSnapshot,'plan never modifies scoped vault');
assert.equal(planUnassignedLegacy(nearLimit,old).ready,false,'global cap still enforced');
assert.deepEqual(planUnassignedLegacy(withBoth,{...old,entries:[{...old.entries[0],id:'alpha-1'}]}).conflictIds,['alpha-1']);
assert.throws(()=>planUnassignedLegacy(withBoth,{...old,version:1}),/V1/);
assert.throws(()=>planUnassignedLegacy(withBoth,{...old,entries:[old.entries[0],old.entries[0]]}),/ID 중복/);
assert.throws(()=>planUnassignedLegacy(withBoth,{...old,entries:[{...old.entries[0],rogue:'drop-me'}]}),/알 수 없는/);
console.log('PASS: 2 anonymous profiles, enforced scope, cross-profile read/update/delete denial, source immutability, record validation, 20-entry global cap, legacy review-only nonmigration');
