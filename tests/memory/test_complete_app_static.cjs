const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page=read('public-site/memory/app/index.html');
const ui=read('public-site/memory/app/app.mjs');
const vault=read('public-site/memory/app/vault.mjs');
const original=read('public-site/memory/index.html');
const gates=JSON.parse(read('docs/qa/apuda-memory-release-gates.json'));

assert.match(page,/<html lang="ko">/);
assert.match(page,/ApuDa Memory|아프다 메모리/);
assert.match(page,/noindex,nofollow,noarchive/);
assert.match(page,/src="\.\/app\.mjs"/);
assert.match(ui,/from '\.\/vault\.mjs'/);
const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'HTML IDs must not duplicate');
for(const match of ui.matchAll(/\$\('([^']+)'\)/g))
  assert.ok(ids.includes(match[1]),'missing HTML element: '+match[1]);
for(const id of ['main','createForm','unlockForm','app','profileSelect',
 'tabToday','tabHistory','tabDoctor','viewToday','viewHistory','viewDoctor',
 'diaryForm','entryDate','entryMemo','entryQuestion','saveButton',
 'historyList','moreRecords','summaryText','period','copyButton',
 'printButton','backupButton','lockButton','printSheet'])
 assert.ok(ids.includes(id),'required caregiver function: '+id);
assert.equal([...page.matchAll(/data-view="(?:today|history|doctor)"/g)].length,3,
 'only 3 primary actions for caregivers');
assert.ok(!page.includes('id="observeChecks"'),'diagnostic checklist removed from primary flow');
assert.match(page,/tel:112/);
assert.match(page,/tel:119/);
assert.match(page,/tel:18999988/);
assert.match(page,/id="profileDetails"/);
assert.match(page,/id="settings"/);
assert.match(page,/role="status" aria-live="polite"/);
assert.match(page,/min-height:(?:52|53|55|59)px/);
assert.match(page,/기존 기록함의 자료는 이 앱으로 자동 이전되거나 삭제되지 않습니다/);
assert.match(page,/비밀번호 분실 시 복구할 수 없으며/);
assert.match(ui,/ensureFirstProfile/);
assert.match(ui,/addProfile\(session\.data,'돌봄 대상 1'\)/);
assert.match(ui,/commitVault\(session,next\)/);
assert.match(ui,/profileEntries\(session\.data,profileId\)/);
assert.match(ui,/formatSummaryText\(session\.data,profileId/);
assert.match(ui,/encryptedBackup\(session\)/);
assert.match(ui,/deleteEntry\(session\.data,profileId/);
assert.match(ui,/getSummary\(session\.data,profileId/);
assert.match(ui,/pagehide/);
assert.match(vault,/DB_NAME='apuda-memory-secure-v3'/);
assert.match(vault,/KDF_ITERATIONS=600000/);
assert.match(vault,/AES-GCM/);
assert.match(vault,/revision:session\.revision\+1/);
assert.match(vault,/tx\.abort\(\)/);
assert.doesNotMatch(vault,/\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(|\bXMLHttpRequest\b/);
assert.doesNotMatch(ui,/\blocalStorage\s*[.[]|\bsessionStorage\s*[.[]|\bfetch\s*\(|\bXMLHttpRequest\b/);
assert.doesNotMatch(ui,/\binnerHTML\s*=/);
assert.match(original,/const diaryKey = 'apuda-memory-care-diary-v1'/);
assert.ok(!original.includes('app/vault.mjs'),'legacy diary stays isolated');
assert.equal(gates.releaseDecision,'NO_GO');
assert.equal(gates.productionDeploymentAuthorized,false);
console.log('PASS: simplified 3-tab caregiver UI, accessible controls, encrypted storage, urgent contact actions, no legacy migration and release NO_GO');
