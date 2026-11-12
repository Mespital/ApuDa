import assert from 'node:assert/strict';
import {
  addAnonymousProfile,emptyProfileVault,appendScopedRecord,scopedRecords,
  listUnassignedRecords,assignReviewedUnassignedRecord,undoReviewedAssignment,
  updateScopedRecord
} from '../../public-site/memory/profile-scope.mjs';

const A='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
const B='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
const unassigned={id:'legacy-1',date:'2026-11-11',text:'가상 미분류 기록 1',question:'미분류 질문'};
const other={id:'legacy-2',date:'2026-11-10',text:'가상 미분류 기록 2'};
const starting=addAnonymousProfile(addAnonymousProfile(emptyProfileVault(),A),B);
const vault={...starting,unassigned:[unassigned,other]};
const unchanged=JSON.stringify(vault);
const preview=listUnassignedRecords(vault);
assert.equal(preview.length,2);
preview[0].text='수정 시도';
assert.equal(vault.unassigned[0].text,'가상 미분류 기록 1','preview is detached');
assert.throws(()=>assignReviewedUnassignedRecord(vault,A,unassigned.id,unassigned,false),/명시적 확인/);
assert.throws(()=>assignReviewedUnassignedRecord(vault,A,unassigned.id,{...unassigned,text:'구버전'},true),/변경/);
assert.throws(()=>assignReviewedUnassignedRecord(vault,B,other.id,unassigned,true),/일치하지/);
assert.throws(()=>assignReviewedUnassignedRecord(vault,undefined,unassigned.id,unassigned,true),/프로필 ID/);
assert.throws(()=>assignReviewedUnassignedRecord(vault,A,'unknown',unassigned,true),/일치하지/);
const {vault:assigned,undoToken}=assignReviewedUnassignedRecord(vault,A,unassigned.id,unassigned,true);
assert.equal(JSON.stringify(vault),unchanged,'original vault unmodified');
assert.equal(assigned.records.length,1);
assert.equal(assigned.unassigned.length,1);
assert.equal(assigned.unassigned[0].id,other.id);
assert.equal(scopedRecords(assigned,A)[0].id,unassigned.id);
assert.equal(scopedRecords(assigned,B).length,0);
assert.equal(assigned.records.length+assigned.unassigned.length,vault.records.length+vault.unassigned.length,'no record duplication/loss');
assert.throws(()=>assignReviewedUnassignedRecord(assigned,B,unassigned.id,unassigned,true),/이미 다른 대상으로/);
const restored=undoReviewedAssignment(assigned,undoToken);
assert.deepEqual(restored,vault,'undo restores exact vault ordering and source content');
assert.deepEqual(assigned.unassigned.map(r=>r.id),['legacy-2'],'undo leaves assigned version intact');
assert.throws(()=>undoReviewedAssignment(restored,undoToken),/변경되어|없거나/);
const edited=updateScopedRecord(assigned,A,{...unassigned,text:'배정 이후 수정'});
assert.throws(()=>undoReviewedAssignment(edited,undoToken),/배정 이후 기록이 변경/);
assert.equal(scopedRecords(edited,A)[0].text,'배정 이후 수정');
const tampered={...undoToken,profileId:B};
assert.throws(()=>undoReviewedAssignment(assigned,tampered),/일치하지/);
assert.equal(JSON.stringify(vault),unchanged);
let full=starting;
for(let i=0;i<20;i++) full=appendScopedRecord(full,A,{id:'known-'+i,date:'2026-11-12',text:'가상 기록'});
assert.throws(()=>assignReviewedUnassignedRecord({...full,unassigned:[unassigned]},A,unassigned.id,unassigned,true),/20건 한도/);
console.log('PASS: explicit approval, exact snapshot, A/B isolation, rollback, stale edit conflict, no auto-assignment, no mutation');
