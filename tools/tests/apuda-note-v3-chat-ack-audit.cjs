/* CI release-blocker inventory: chat rendering still precedes confirmed storage.
 * This test DOES NOT mark chat async migration as finished.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/note-app.js'),'utf8');
const occurrences=(app.match(/\bsaveChat\(\)/g)||[]).length;
assert.equal(occurrences,3,'review and update the chat caller inventory');
assert.match(app,/function saveChat\(\)/,'chat writer should remain explicitly synchronous until callers await it');
assert.match(app,/function addMsg\([^)]*\)\{[\s\S]{0,550}\bsaveChat\(\)/,'addMsg still persists after rendering');
assert.match(app,/row\.h=msg\.innerHTML;saveChat\(\)/,'undo message update still persists without awaiting');
assert.match(app,/if\(store!==false\)\{[^\n]*chat\.push/,'message shown before save outcome');
console.log('PASS: chat audit — 2 sync call sites, 1 writer definition');
console.log('RELEASE BLOCKER: addMsg and undo must await chat write before claiming durable success.');
console.log('P0 remains unresolved: legacy localStorage, old tabs, cached SW and Drive restore.');
