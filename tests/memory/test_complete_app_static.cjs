const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('public-site/memory/app/index.html');
const ui=read('public-site/memory/app/app.mjs');
const vault=read('public-site/memory/app/vault.mjs');
const legacy=read('public-site/memory/index.html');
const gates=JSON.parse(read('docs/qa/apuda-memory-release-gates.json'));

assert.match(html,/lang="ko"/);
assert.match(html,/아프다 <span>메모리<\/span>/);
assert.match(html,/noindex,nofollow,noarchive/);
assert.match(html,/src="\.\/app\.mjs"/);
assert.match(ui,/from '\.\/vault\.mjs'/);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'IDs must be unique');
for(const [,id] of ui.matchAll(/\$\('([^']+)'\)/g))
 assert.ok(ids.includes(id),'missing UI element '+id);
for(const [,id] of html.matchAll(/href="#([^"]+)"/g))
 assert.ok(ids.includes(id),'broken in-page anchor '+id);

for(const view of ['Today','History','Doctor']){
 assert.ok(ids.includes('view'+view),'missing simple tab '+view);
 assert.ok(ids.includes('tab'+view),'missing navigation button '+view);
}
assert.equal([...html.matchAll(/\bdata-view="(?:today|history|doctor)"/g)].length,3,
 'Only the three most important tabs should be visible');
assert.ok(!ids.includes('observeChecks') && !ids.includes('living-title') &&
 !ids.includes('timeline'),'Old complex medical/learning UI should be removed');
for(const field of ['setup','createForm','unlockForm','profileSelect','diaryForm',
 'entryDate','entryMemo','entryQuestion','saveStatus','historyList','summaryText',
 'copyButton','printButton','backupButton','lockButton','printSheet']){
 assert.ok(ids.includes(field),'missing essential caregiver task: '+field);
}
assert.match(html,/잠은 어떠셨나요/);
assert.match(html,/식사는 어떠셨나요/);
assert.match(html,/처방·약 관련 확인/);
assert.match(html,/약 ‘확인함’은 복용 완료를 뜻하지 않습니다/);
assert.match(html,/href="tel:18999988"/);
assert.match(html,/tel:112/);
assert.match(html,/119/);
assert.match(html,/기존 기록함의 자료는 이 앱으로 자동 이전되거나 삭제되지 않습니다/);
assert.match(html,/중요한 환자 기록의 유일한 보관 수단으로 사용하지 마세요/);
assert.match(html,/min-height:55px/);
assert.match(html,/aria-live="polite"/);
assert.match(ui,/await commitVault\(session,next\)/);
assert.match(ui,/selectedEntries\(\)/);
assert.match(ui,/profileEntries\(session\.data,profileId\)/);
assert.match(ui,/formatSummaryText\(session\.data,profileId/);
assert.match(ui,/encryptedBackup\(session\)/);
assert.match(ui,/deleteEntry\(session\.data,profileId/);
assert.match(ui,/clearDownload\(\)/);
assert.match(ui,/window\.addEventListener\('pagehide'/);
assert.doesNotMatch(ui,/\binnerHTML\s*=/);
assert.doesNotMatch(ui,/\blocalStorage\s*[.[]|\bsessionStorage\s*[.[]|\bfetch\s*\(|\bXMLHttpRequest\s*\(/);
assert.match(vault,/DB_NAME='apuda-memory-secure-v3'/);
assert.match(vault,/KDF_ITERATIONS=600000/);
assert.match(vault,/AES-GCM/);
assert.match(vault,/new Uint8Array\(12\)/);
assert.match(vault,/tx\.abort\(\)/);
assert.match(vault,/tx\.oncomplete=resolve/);
assert.doesNotMatch(vault,/\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(/);
assert.match(legacy,/const diaryKey = 'apuda-memory-care-diary-v1'/);
assert.ok(!legacy.includes('app/vault.mjs'));
assert.equal(gates.releaseDecision,'NO_GO');
assert.equal(gates.productionDeploymentAuthorized,false);

console.log('PASS: simple dementia caregiver 3-tab UI, encrypted vault unchanged, old records untouched, accessible labels, safety warnings and release boundary');
