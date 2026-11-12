const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const live=file('public-site/memory/index.html');
const stage=file('public-site/memory/legacy-staging.mjs');
const vault=file('public-site/memory/profile-vault-idb-qa.mjs');
const qa=file('public-site/memory/phase15-qa.html');
const manifest=JSON.parse(file('docs/qa/apuda-memory-release-gates.json'));

for(const fileName of ['legacy-staging.mjs','profile-vault-idb-qa.mjs','phase15-qa.html']) {
  assert.ok(!live.includes(fileName),'phase 15 prototype must not connect to live diary: '+fileName);
}
assert.match(live,/const diaryKey = 'apuda-memory-care-diary-v1'/);
assert.equal(manifest.releaseDecision,'NO_GO');
assert.equal(manifest.productionDeploymentAuthorized,false);
assert.ok(manifest.tests.some(t=>t.id==='cross-device-restore'&&t.status==='DEFERRED'));
for(const source of [stage,vault]) {
  assert.doesNotMatch(source,/\blocalStorage\s*[.\[]|\bsessionStorage\s*[.\[]|\bfetch\s*\(|\bXMLHttpRequest\s*\(/);
}
assert.match(stage,/planUnassignedLegacy/);
assert.match(stage,/requiresUserApproval:true/);
assert.match(vault,/apuda-memory-qa-vault-/);
assert.match(vault,/tx\.oncomplete/);
assert.match(vault,/tx\.abort/);
assert.doesNotMatch(vault,/objectStore\('vault'\)\.put/);
const script=qa.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'QA page script must exist');
assert.doesNotMatch(script,/\blocalStorage\s*[.\[]|\bsessionStorage\s*[.\[]|\bfetch\s*\(|\bXMLHttpRequest\s*\(/);
assert.match(script,/^const allowed=\/\^deploy-preview-/m);
assert.match(qa,/noindex,nofollow/);
assert.match(qa,/실제 환자 정보를 입력하지 마세요/);
assert.match(script,/indexedDB\.deleteDatabase\(label\)/);
console.log('PASS: Phase15 live diary isolated; QA-only IndexedDB, no private data storage reads, explicit release NO_GO and cleanup gate');
