/* Synthetic-only: demonstrate how a legacy tab creates diverging branches.
 * No real browser storage and absolutely no Google Drive interactions.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/v3-mixed-version-guard-sandbox.js'),'utf8');
const context={};context.window=context;vm.createContext(context);vm.runInContext(source,context);
const guard=context.ApuDaV3MixedVersionGuardSandbox;
const old='{"profile":{"name":"가상 A"},"logs":[]}';
const oldTab='{"profile":{"name":"가상 A"},"logs":[{"date":"2026-11-11","temp":37.1}]}';
const newer='{"profile":{"name":"가상 A"},"logs":[{"date":"2026-11-11","temp":36.8}]}';
const invalidOld='{partial-or-corrupted';
const session=guard.make(old,old);
const stable=guard.inspect(session,old,old);
assert.equal(stable.status,'snapshot-stable');
assert.equal(stable.allowAutomaticMigration,false,'stable snapshot does not prove all old tabs are closed');

const legacyWrote=guard.inspect(session,oldTab,old);
assert.equal(legacyWrote.status,'manual-review');
assert.equal(legacyWrote.reason,'legacy-branch-changed');
assert.equal(legacyWrote.branches.legacy,oldTab);
assert.equal(legacyWrote.branches.newer,old);

const concurrent=guard.inspect(session,oldTab,newer);
assert.equal(concurrent.reason,'both-branches-changed');
assert.equal(concurrent.branches.legacy,oldTab);
assert.equal(concurrent.branches.newer,newer);
for(const k of ['allowAutomaticMigration','allowAutomaticBackupUpload','allowAutomaticDrivePrune'])assert.equal(concurrent[k],false);
assert.equal(concurrent.requireLegacyTabExit,true);

const broken=guard.inspect(session,invalidOld,newer);
assert.equal(broken.branches.legacy,invalidOld,'keep even invalid original bytes for manual export');
assert.equal(broken.branches.newer,newer);
assert.throws(()=>guard.inspect({},old,old),/synthetic-session-required/);
assert.throws(()=>guard.make(undefined,old),/raw-string-or-null-required/);
assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB)\s*[.(]/);
assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
assert.doesNotMatch(fs.readFileSync(path.resolve(__dirname,'../../public-site/note/note-app.js'),'utf8'),/ApuDaV3MixedVersionGuardSandbox/);
console.log('PASS: synthetic-only mixed-version divergence, two-branch preservation, no automatic migration/Drive pruning');
