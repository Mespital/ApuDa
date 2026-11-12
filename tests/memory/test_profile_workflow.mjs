import assert from 'node:assert/strict';
import {
  emptyProfileVault,addAnonymousProfile,appendScopedRecord,scopedRecords
} from '../../public-site/memory/profile-scope.mjs';
import {
  SCOPED_BACKUP_FORMAT,readProfileView,createProfileRecord,
  changeProfileRecord,deleteProfileRecord,exportProfileBackup,
  planProfileImport,commitProfileImport,createProfileConsultText
} from '../../public-site/memory/profile-workflow.mjs';
const A='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
const B='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
const date='2026-11-12';
const entry=(id,text,extra={})=>({id,date,text,...extra});
const empty=addAnonymousProfile(addAnonymousProfile(emptyProfileVault(),A),B);
const withA=createProfileRecord(empty,A,entry('A-1','A 전용 수면 관찰',{sleep:'나쁨',question:'A 가족 질문'}));
const withBoth=createProfileRecord(withA,B,entry('B-1','B 전용 식사 관찰',{meal:'부족',question:'B 보호자 질문'}));
const vault={...withBoth,unassigned:[entry('U-1','미분류 기록')]};// synthetic legacy holding area
const original=JSON.stringify(vault);

const aView=readProfileView(vault,A,{query:'수면',periodDays:7,endDate:date});
assert.equal(aView.allCount,1);
assert.equal(aView.visibleCount,1);
assert.equal(aView.summary.observedDays,1);
assert.equal(aView.summary.questionCount,1);
assert.match(JSON.stringify(aView),/A 가족 질문/);
assert.doesNotMatch(JSON.stringify(aView),/B 보호자 질문|미분류 기록/);
const noMatch=readProfileView(vault,A,{query:'식사',periodDays:30,endDate:date});
assert.equal(noMatch.visibleCount,0);
assert.equal(noMatch.summary.storedCount,1,'list search must not filter consultation summary');
const bView=readProfileView(vault,B,{periodDays:7,endDate:date});
assert.equal(bView.visibleCount,1);
assert.doesNotMatch(JSON.stringify(bView),/A 가족 질문|미분류 기록/);
assert.throws(()=>readProfileView(vault,undefined,{periodDays:7,endDate:date}),/프로필 ID/);
assert.throws(()=>readProfileView(vault,A,{from:'2026-11-13',to:'2026-11-11',endDate:date}),/날짜/);
assert.throws(()=>readProfileView(vault,A,{query:'x'.repeat(101),endDate:date}),/검색어/);

assert.throws(()=>createProfileRecord(vault,A,entry('B-1','duplicate')),/기록 ID 중복/);
assert.throws(()=>changeProfileRecord(vault,A,entry('B-1','wrong'),entry('B-1','wrong')),/원본 기록/);
assert.throws(()=>deleteProfileRecord(vault,A,'B-1',entry('B-1','wrong')),/원본 기록/);
const updated=changeProfileRecord(vault,A,entry('A-1','A 변경된 기록',{sleep:'보통'}),entry('A-1','A 전용 수면 관찰',{sleep:'나쁨',question:'A 가족 질문'}));
assert.equal(scopedRecords(updated,A)[0].text,'A 변경된 기록');
assert.equal(scopedRecords(updated,B)[0].text,'B 전용 식사 관찰');
assert.equal(vault.records.length,2);
assert.throws(()=>changeProfileRecord(updated,A,entry('A-1','stale'),scopedRecords(vault,A)[0]),/원본 기록/);
const deleted=deleteProfileRecord(updated,A,'A-1',scopedRecords(updated,A)[0]);
assert.equal(scopedRecords(deleted,A).length,0);
assert.equal(scopedRecords(deleted,B).length,1);
assert.equal(deleted.unassigned.length,1);
assert.equal(JSON.stringify(vault),original,'all operations must return copies');

const aBackup=exportProfileBackup(vault,A);
assert.equal(aBackup.format,SCOPED_BACKUP_FORMAT);
assert.equal(aBackup.sourceProfileId,A);
assert.equal(aBackup.entries.length,1);
assert.match(JSON.stringify(aBackup),/A 가족 질문/);
assert.doesNotMatch(JSON.stringify(aBackup),/B 보호자 질문|미분류 기록/);
const bBackup=exportProfileBackup(vault,B);
assert.throws(()=>planProfileImport(vault,A,bBackup),/프로필 ID/);
assert.throws(()=>planProfileImport(vault,A,{format:'apuda-memory-care-diary',version:2,entries:[entry('old','legacy')]}),/백업 형식/);
const same=planProfileImport(vault,A,aBackup);
assert.equal(same.ready,true);
assert.equal(same.wouldAdd,0);
assert.equal(same.alreadyPresent,1);
assert.throws(()=>commitProfileImport(vault,A,aBackup,same,false),/명시적 확인/);
const noop=commitProfileImport(vault,A,aBackup,same,true);
assert.equal(noop.added,0);
assert.equal(noop.skipped,1);
assert.equal(JSON.stringify(noop.vault),original);

const dest=appendScopedRecord(empty,B,entry('B-dest','다른 대상자의 데이터'));
const plan=planProfileImport(dest,A,aBackup);
assert.equal(plan.ready,true);
assert.equal(plan.wouldAdd,1);
assert.equal(plan.conflictIds.length,0);
const committed=commitProfileImport(dest,A,aBackup,plan,true);
assert.equal(committed.added,1);
assert.equal(committed.skipped,0);
assert.equal(scopedRecords(committed.vault,A)[0].id,'A-1');
assert.equal(scopedRecords(committed.vault,B)[0].id,'B-dest');
assert.equal(scopedRecords(dest,A).length,0,'original destination unchanged');
assert.throws(()=>commitProfileImport(
  appendScopedRecord(dest,B,entry('changed-after-plan','unrelated edit')),
  A,aBackup,plan,true),/사전검사 이후 변경/);
assert.throws(()=>commitProfileImport(dest,A,{...aBackup,entries:[]},plan,true),/사전검사 이후 변경/);
const conflict=planProfileImport({...dest,unassigned:[entry('A-1','기존 미분류 ID')]},A,aBackup);
assert.equal(conflict.ready,false);
assert.deepEqual(conflict.conflictIds,['A-1']);
const otherConflict=planProfileImport(
  appendScopedRecord(dest,B,entry('A-1','B 소속 동일 ID')),A,aBackup);
assert.equal(otherConflict.ready,false,'cannot import record already owned by B');
assert.throws(()=>planProfileImport(dest,A,{...aBackup,entries:[{...aBackup.entries[0],rogue:'must-not-drop'}]}),/허용하지 않은/);
assert.throws(()=>planProfileImport(dest,A,{...aBackup,entries:[...aBackup.entries,...aBackup.entries]}),/중복/);
assert.throws(()=>planProfileImport(dest,A,{...aBackup,entries:[{...aBackup.entries[0],date:'2026-02-30'}]}),/달력/);
const textA=createProfileConsultText(vault,A,7,date),textB=createProfileConsultText(vault,B,7,date);
assert.match(textA,/A 가족 질문/);
assert.doesNotMatch(textA,/B 보호자 질문|미분류 기록/);
assert.match(textB,/B 보호자 질문/);
assert.doesNotMatch(textB,/A 가족 질문/);
console.log('PASS: scoped search, 7/30 summary, guarded CRUD, exact-target export, strict import, duplicate/conflict/stale-state refusal and original data preservation');
