/**
 * ApuDa Memory phase 11: read-only release-gate checker.
 *
 * This check deliberately never upgrades a PENDING/DEFERRED gate to PASS,
 * merges PRs, touches real browser storage or deploys the site.
 * A failed gate still allows this read-only audit to exit successfully;
 * use --require-go to obtain a nonzero exit status for an attempted release.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const repoRoot=path.resolve(__dirname,'../..');
const manifestPath=path.join(repoRoot,'docs/qa/apuda-memory-release-gates.json');
const pagePath=path.join(repoRoot,'public-site/memory/index.html');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const html=fs.readFileSync(pagePath,'utf8');

assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.project,'ApuDa Memory');
assert.equal(manifest.pullRequest,293);
assert.equal(manifest.environment,'preview-only');
assert.equal(manifest.productionDeploymentAuthorized,false,'release authorization must remain false');
assert.ok(['NO_GO','GO'].includes(manifest.releaseDecision));
assert.ok(Array.isArray(manifest.tests)&&manifest.tests.length>=10);
const ids=new Set();
for(const gate of manifest.tests) {
  assert.match(gate.id,/^[a-z][a-z0-9-]+$/);
  assert.ok(!ids.has(gate.id),'duplicate release criterion id');
  ids.add(gate.id);
  assert.ok(['PASS','PENDING','DEFERRED','FAIL'].includes(gate.status),'unknown gate status');
  assert.equal(gate.blocking,true,'phase 11 required release criterion cannot be optional');
  if(gate.status==='PASS') assert.ok(
    typeof gate.evidence==='string' && gate.evidence.trim().length>=15,
    'a PASS requires concrete evidence, '+gate.id);
}
assert.ok(ids.has('explicit-approval'));
assert.ok(ids.has('cross-device-restore'));
assert.ok(ids.has('android-chrome'));
assert.ok(ids.has('ios-safari'));
assert.ok(ids.has('privacy-review'));
assert.ok(ids.has('real-idb'));
const blocked=manifest.tests.filter(gate=>gate.blocking&&gate.status!=='PASS');
const ready=blocked.length===0 && manifest.productionDeploymentAuthorized===true;
assert.equal(manifest.releaseDecision,ready?'GO':'NO_GO',
  'release decision must match all blocking evidence and explicit authorization');

assert.ok(html.includes("const diaryKey = 'apuda-memory-care-diary-v1'"),'legacy browser key retained');
assert.ok(!html.includes('secure-archive.mjs'),'prototype encryption must remain disconnected');
assert.ok(!html.includes('indexeddb-migration.mjs'),'prototype database must remain disconnected');
assert.ok(html.includes('기록은 <strong>현재 기기의 브라우저 저장소(localStorage)'),
  'plain localStorage privacy explanation is still shown');
assert.ok(html.includes('다른 기기와 동기화되지 않습니다.'),
  'the interface does not overclaim cloud sync');

console.log('PASS: release manifest integrity and live-page isolation');
console.log('RELEASE:',manifest.releaseDecision);
console.log('BLOCKING ITEMS:',blocked.length,'/',manifest.tests.length);
blocked.forEach(item=>console.log(' -',item.id, item.status));
if(process.argv.includes('--require-go') && !ready) {
  console.error('RELEASE BLOCKED: independent device, privacy, restore and explicit approval gates not met');
  process.exitCode=2;
}