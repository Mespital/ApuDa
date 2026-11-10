/* All records below are synthetic. This test never opens browser localStorage. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

const code = fs.readFileSync(path.resolve(__dirname, '../../public-site/note/note-storage.js'), 'utf8');
const ctx = {crypto: webcrypto, TextEncoder};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx);
const api = ctx.ApuDaNoteStorage;
const KEY = 'synthetic/patient-note';
const CP = api.recoveryKey(KEY);
const fixture = name => ({profile: {name, cancer: '가상 암종'}, logs: [], meds: [], questions: []});
const original = JSON.stringify(fixture('이전 기록'));
const restored = fixture('복원할 기록');
const fresh = JSON.stringify(fixture('이후 작성된 기록'));

class Storage {
  constructor(raw = original) {this.map = new Map(raw === null ? [] : [[KEY, raw]]); this.intercept = null;}
  getItem(key) {return this.map.has(key) ? this.map.get(key) : null;}
  setItem(key, val) {if (this.intercept?.('set', key, String(val)) === false) return; this.map.set(key, String(val));}
  removeItem(key) {if (this.intercept?.('remove', key) === false) return; this.map.delete(key);}
}
const cloneCheckpoint = st => JSON.parse(st.getItem(CP));
const changeCheckpoint = (st, fn) => {const data = cloneCheckpoint(st); fn(data); st.setItem(CP, JSON.stringify(data));};
const hash = async raw => Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))).map(v => v.toString(16).padStart(2, '0')).join('');

(async () => {
  const normal = new Storage();
  await api.replace(normal, KEY, restored, 'test');
  const checkpoint = api.checkpoint(normal, KEY);
  assert.equal(checkpoint.schemaVersion, 2);
  assert.equal(checkpoint.beforeHash, await hash(original));
  assert.equal(checkpoint.beforeBytes, new TextEncoder().encode(original).length);
  assert.equal(checkpoint.afterHash, await hash(normal.getItem(KEY)));
  assert.equal(checkpoint.beforeExists, true);
  assert.equal(await api.recover(normal, KEY), true);
  assert.equal(normal.getItem(KEY), original);
  assert.equal(normal.getItem(CP), null);

  const blank = new Storage(null);
  await api.replace(blank, KEY, restored);
  assert.equal(api.checkpoint(blank, KEY).beforeExists, false);
  assert.equal(await api.recover(blank, KEY), true);
  assert.equal(blank.getItem(KEY), null);
  assert.equal(blank.getItem(CP), null);

  const corrupted = new Storage();
  await api.replace(corrupted, KEY, restored);
  const newBytes = corrupted.getItem(KEY);
  changeCheckpoint(corrupted, c => {c.before = '{"broken":true}';});
  await assert.rejects(api.recover(corrupted, KEY), /checkpoint-corrupted/);
  assert.equal(corrupted.getItem(KEY), newBytes, 'damaged checkpoint cannot overwrite note');
  assert.ok(corrupted.getItem(CP), 'damaged checkpoint must not be deleted');

  const sameSizeCorrupt = new Storage();
  await api.replace(sameSizeCorrupt, KEY, restored);
  changeCheckpoint(sameSizeCorrupt, c => {c.before = c.before.replace('이전 기록', '다른 기록');});
  await assert.rejects(api.recover(sameSizeCorrupt, KEY), /checkpoint-corrupted/, 'same-length tampering is caught by SHA-256');

  const badAfter = new Storage();
  await api.replace(badAfter, KEY, restored);
  badAfter.setItem(KEY, fresh);
  await assert.rejects(api.recover(badAfter, KEY), /records-changed/);
  assert.equal(badAfter.getItem(KEY), fresh);
  assert.ok(badAfter.getItem(CP));

  const silentWrite = new Storage();
  await api.replace(silentWrite, KEY, restored);
  const current = silentWrite.getItem(KEY);
  silentWrite.intercept = (op, key) => !(op === 'set' && key === KEY);
  await assert.rejects(api.recover(silentWrite, KEY), /restore-not-saved/);
  assert.equal(silentWrite.getItem(KEY), current);
  assert.ok(silentWrite.getItem(CP), 'failed write must retain its checkpoint');

  const silentRemove = new Storage(null);
  await api.replace(silentRemove, KEY, restored);
  silentRemove.intercept = (op, key) => !(op === 'remove' && key === KEY);
  await assert.rejects(api.recover(silentRemove, KEY), /restore-not-saved/);
  assert.ok(silentRemove.getItem(KEY));
  assert.ok(silentRemove.getItem(CP));

  const silentClear = new Storage();
  await api.replace(silentClear, KEY, restored);
  silentClear.intercept = (op, key) => !(op === 'remove' && key === CP);
  await assert.rejects(api.recover(silentClear, KEY), /checkpoint-not-cleared/);
  assert.equal(silentClear.getItem(KEY), original, 'restore wrote original bytes');
  assert.ok(silentClear.getItem(CP), 'failed cleanup remains discoverable');

  const cpSilent = new Storage();
  cpSilent.intercept = (op, key) => !(op === 'set' && key === CP);
  await assert.rejects(api.replace(cpSilent, KEY, restored), /checkpoint-not-saved/);
  assert.equal(cpSilent.getItem(KEY), original, 'must not write candidate without checkpoint');

  const noteSilent = new Storage();
  noteSilent.intercept = (op, key) => !(op === 'set' && key === KEY);
  await assert.rejects(api.replace(noteSilent, KEY, restored), /restore-not-saved/);
  assert.equal(noteSilent.getItem(KEY), original);

  const legacy = new Storage();
  const target = JSON.stringify(restored);
  const legacyCheckpoint = {format: 'apuda.note.checkpoint', schemaVersion: 1, before: '{"broken":true}', afterHash: await hash(target)};
  legacy.setItem(KEY, target);
  legacy.setItem(CP, JSON.stringify(legacyCheckpoint));
  assert.equal(api.checkpoint(legacy, KEY).before, legacyCheckpoint.before, 'old snapshot remains visible for manual export');
  await assert.rejects(api.recover(legacy, KEY), /legacy-checkpoint-review-required/);
  assert.equal(legacy.getItem(KEY), target, 'v1 data must never be restored automatically');
  assert.equal(legacy.getItem(CP), JSON.stringify(legacyCheckpoint), 'legacy snapshot must remain intact');

  const repeat = new Storage();
  await api.replace(repeat, KEY, restored);
  await api.replace(repeat, KEY, fixture('다시 불러온 기록'));
  assert.equal(api.checkpoint(repeat, KEY).before, target, 'new explicit import updates most-recent undo point');
  await api.recover(repeat, KEY);
  assert.equal(repeat.getItem(KEY), target);

  console.log('PASS: V2 SHA-256 before/after; null snapshot; damaged and same-size tampering; later edits; ignored write/remove; cleanup failure; checkpoint failure; V1 fail-closed with manual export; repeat import compatibility (synthetic only)');
})().catch(err => {console.error(err); process.exitCode = 1;});
