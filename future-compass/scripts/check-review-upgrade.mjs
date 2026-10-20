// Source-level integration tests: actual note/audio/Chat receiver modules, synthetic DOM/storage/HTTP.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto, createHash } from 'node:crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = f => fs.readFileSync(path.join(root, 'dist', f), 'utf8');
const basis = n => JSON.stringify([n.subject || '', n.topic || '', n.text || '', n.sum || '']);
const base = { id: 'synthetic-note', date: '2026-10-21', subject: '수학', topic: '함수', text: '함수는 입력에 출력을 대응하는 관계라고 배웠다.', sum: '', review: 'review-1' };
const hash = b => createHash('sha256').update(b).digest('hex');
const sourceBytes = Buffer.from('synthetic-audio-bytes');
const audioFile = { role: 'audio', id: 'fixtureaudio123456', parentId: 'fixturefolder123456', name: '수학_함수.webm', url: 'https://drive.google.com/file/d/fixtureaudio123456/view', size: sourceBytes.length, sha256: hash(sourceBytes), via: 'vps' };
const reviewFile = { ...audioFile, role: 'review', id: 'fixturereview12345', url: 'https://drive.google.com/file/d/fixturereview12345/view', name: '복습정리.md', size: 30, sha256: 'c'.repeat(64) };
const noteFile = { ...audioFile, role: 'note', id: 'fixturenote123456', url: 'https://drive.google.com/file/d/fixturenote123456/view', name: '받아쓰기.md' };
const result = (files = [], summary = '함수의 정의와 정의역을 확인하는 정리입니다.') => ({ verified: true, transcript: '함수에 관한 받아쓰기 내용입니다.', summary, files, at: Date.now() });
const done = (value, errors = []) => ({ state: 'done', result: value, errors });

function fixture(note = base, response = done(result()), options = {}) {
  const storage = new Map(), documentEvents = new Map(), windowEvents = new Map(), notices = [], requests = [], records = new Map();
  const controls = { locked: !!options.locked, parent: !!options.parent, share: options.share !== false, failNotes: false, failIDB: false, response };
  storage.set('fc_notes_v1', JSON.stringify([note]));
  storage.set('fc-voice-v1', JSON.stringify([{ id: 'a'.repeat(32), noteId: note.id, basis: basis(base), at: Date.now() }]));
  if (note.audio) records.set(note.audio.id, { ...note.audio, subject: note.subject, blob: new Blob([sourceBytes], { type: 'audio/webm' }), uploaded: false });
  const element = { html: '', style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild() {}, insertAdjacentHTML(where, html) { this.html = html; }, querySelector() { return null; } };
  const on = (map, k, fn) => { if (!map.has(k)) map.set(k, []); map.get(k).push(fn); };
  const db = { close() {}, transaction() {
    const tx = { objectStore() { return {
      get: k => query(() => records.get(k)), getAll: () => query(() => [...records.values()]),
      put: r => query(() => { records.set(r.id, r); return r.id; }), delete: k => query(() => records.delete(k))
    }; } };
    function query(fn) { const q = {}; queueMicrotask(() => { if (controls.failIDB) { tx.error = Error('quota'); tx.onerror?.(); } else { q.result = fn(); tx.oncomplete?.(); } }); return q; }
    return tx;
  } };
  const sandbox = {
    console, Date, JSON, Math, Promise, Set, Map, Uint8Array, URL, Blob, TextEncoder, AbortController, crypto: webcrypto,
    navigator: {}, location: { origin: 'https://unit.invalid', hash: '' }, confirm: () => true,
    localStorage: { getItem: k => storage.get(k) ?? null, setItem(k, v) { if (controls.failNotes && k === 'fc_notes_v1') throw Error('quota'); storage.set(k, v); }, removeItem: k => storage.delete(k) },
    indexedDB: { open() { const q = {}; queueMicrotask(() => { q.result = db; q.onsuccess?.(); }); return q; } },
    setTimeout: () => 1, clearTimeout() {},
    render() {}, tabs: {}, tab: 'review', esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    today: () => '2026-10-21', state: { table: [[], [], [], [], []], reviews: [{ id: 'review-1', note: '' }] }, save: () => true, uid: () => 'fixture-id', notice: t => notices.push(t),
    PinGate: { who: () => controls.parent ? 'parent' : 'child' },
    FC_PLANNER: { KEY: 'fc_planner_v1', get: () => ({ share: { review: controls.share }, again: {} }) },
    FC_CHAT_DRIVE: { basis },
    FamilySync: { joined: () => true, live: () => ({ url: 'https://unit.invalid', t: 'synthetic-ticket' }) },
    MutationObserver: class { observe() {} },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    addEventListener: (k, fn) => on(windowEvents, k, fn),
    dispatchEvent: e => (windowEvents.get(e.type) || []).forEach(fn => fn(e)),
    fetch: async (url, init) => {
      if (String(url).includes('recording-config')) return { ok: true, json: async () => ({ configured: false }) };
      requests.push({ url, init });
      if (controls.response instanceof Error) throw controls.response;
      return { status: 200, ok: true, json: async () => structuredClone(controls.response) };
    },
    document: {
      visibilityState: 'visible', documentElement: { classList: { contains: c => c === 'pin-locked' && controls.locked } },
      head: { appendChild() {} }, body: { appendChild() {} }, createElement: () => ({ ...element }),
      getElementById: () => element, querySelector: () => null, querySelectorAll: () => [],
      addEventListener: (k, fn) => on(documentEvents, k, fn)
    }
  };
  sandbox.window = sandbox; vm.createContext(sandbox);
  vm.runInContext(src('audio-vault.js'), sandbox, { filename: 'audio-vault.js' });
  vm.runInContext(src('talk-note.js').replace(/\}\)\(\);\s*$/, 'window.__review = { vpoll: vpoll, vjobs: vjobs, applyVoice: applyVoice, voiceStatus: voiceStatus };\n})();'), sandbox, { filename: 'talk-note.js' });
  const readNote = () => JSON.parse(storage.get('fc_notes_v1'))[0];
  return { sandbox, storage, controls, records, notices, requests, element, documentEvents, readNote };
}

// R01: list pagination and subject expansion are separate actions.
{
  const f = fixture(); f.storage.set('fc_notes_v1', JSON.stringify(Array.from({ length: 17 }, (_, i) => ({ ...base, id: 'note-' + i }))));
  f.sandbox.render(); assert.ok(f.element.html.includes('이전 노트 더 보기 (11)'));
  const b = { dataset: {}, hasAttribute: k => k === 'data-tn-more' }, event = { target: { closest: s => s === 'button' ? b : null } };
  for (const fn of f.documentEvents.get('click')) fn(event);
  assert.ok(f.element.html.includes('이전 노트 더 보기 (1)'));
  assert.equal((f.element.html.match(/data-tn-del=/g) || []).length, 16);
}
// R02: a completely failed attempt stays retryable and never announces completion.
{
  const f = fixture(base, done({ transcript: '', summary: '', files: [], at: Date.now() }, ['stt', 'short', 'drive_audio']));
  await f.sandbox.__review.vpoll(); const [job] = f.sandbox.__review.vjobs();
  assert.equal(job.phase, 'failed'); assert.equal(f.readNote().cloud, undefined);
  assert.ok(!f.notices.some(t => /완료/.test(t))); assert.ok(f.sandbox.__review.voiceStatus(base).includes('다시 처리'));
}
// R03: editing any source field blocks automatic replacement, even when summary is empty.
for (const patch of [{ sum: '내가 고친 정리' }, { subject: '영어' }, { topic: '새 주제' }, { text: '새로 고친 원문입니다.' }]) {
  const f = fixture({ ...base, ...patch }); await f.sandbox.__review.vpoll(); const [job] = f.sandbox.__review.vjobs();
  assert.equal(job.phase, 'conflict'); assert.ok(job.result.summary);
  for (const [k, v] of Object.entries(patch)) assert.equal(f.readNote()[k], v);
  const restored = fixture(f.readNote()); restored.storage.set('fc-voice-v1', f.storage.get('fc-voice-v1'));
  assert.equal(restored.sandbox.__review.vjobs()[0].result.summary, job.result.summary);
  await f.sandbox.__review.applyVoice(job, true); assert.equal(f.readNote().sum, job.result.summary);
}
// R04/R05: interruption/missing result stops polling and keeps an explicit retry path.
{
  const f = fixture(base, { state: 'interrupted' }); await f.sandbox.__review.vpoll(); assert.equal(f.sandbox.__review.vjobs()[0].phase, 'interrupted');
  const missing = fixture(); missing.sandbox.fetch = async () => ({ status: 404, ok: false }); await missing.sandbox.__review.vpoll(); assert.equal(missing.sandbox.__review.vjobs()[0].phase, 'failed');
}
// R07: actual audio vault + note + review receive the same SHA-256-checked receipt, across re-open.
{
  const n = { ...base, audio: { id: 'local-audio', name: audioFile.name, at: Date.now() } }, f = fixture(n, done(result([audioFile, noteFile, reviewFile])));
  await f.sandbox.__review.vpoll();
  assert.equal(f.sandbox.__review.vjobs().length, 0); assert.equal(f.readNote().audio.driveId, audioFile.id);
  assert.equal(f.records.get('local-audio').uploaded, true); assert.equal(f.records.get('local-audio').uploadedVia, 'vps');
  assert.equal(f.sandbox.state.reviews[0].note, f.readNote().sum.slice(0, 800));
  const r = await f.sandbox.FC_AUDIO.get('local-audio'); assert.equal(hash(Buffer.from(await r.blob.arrayBuffer())), audioFile.sha256);
  const again = fixture(f.readNote()); again.records.set('local-audio', f.records.get('local-audio'));
  assert.equal((await again.sandbox.FC_AUDIO.get('local-audio')).driveId, again.readNote().audio.driveId);
  // A later retry may add verified files without overwriting a user edit after the prior apply.
  const old = again.readNote(), value = { at: Date.now(), value: result([audioFile, noteFile, reviewFile]) };
  assert.equal(await again.sandbox.FC_NOTES.applyCloud(old.id, basis(base), value, 'v-' + 'a'.repeat(32)), 'applied');
  const edited = again.readNote(); edited.topic = '사용자가 바꾼 주제'; again.storage.set('fc_notes_v1', JSON.stringify([edited]));
  assert.equal(await again.sandbox.FC_NOTES.applyCloud(old.id, basis(base), value, 'v-' + 'a'.repeat(32)), 'conflict');
}
// Hash mismatch, metadata persistence failure, and missing local raw audio are different cases.
{
  const n = { ...base, audio: { id: 'local-audio' } }, f = fixture(n, done(result([{ ...audioFile, sha256: '0'.repeat(64) }])));
  await f.sandbox.__review.vpoll(); assert.equal(f.sandbox.__review.vjobs()[0].phase, 'apply-failed'); assert.equal(f.readNote().cloud, undefined); assert.equal(f.records.get('local-audio').uploaded, false);
  const quota = fixture(n, done(result([audioFile]))); await quota.sandbox.FC_AUDIO.get('local-audio'); quota.controls.failIDB = true; await quota.sandbox.__review.vpoll(); assert.equal(quota.sandbox.__review.vjobs()[0].phase, 'apply-failed');
  assert.equal((await quota.sandbox.FC_AUDIO.get('local-audio')).uploaded, false);
  const partial = fixture(base, done(result([], ''))); await partial.sandbox.__review.vpoll(); assert.equal(partial.sandbox.__review.vjobs()[0].phase, 'partial'); assert.ok(partial.readNote().cloud); assert.ok(!partial.notices.some(t => /Drive.*저장.*확인/.test(t)));
}
// Storage failures retain the result; retrying the apply repairs it without re-uploading.
{
  const f = fixture(); f.controls.failNotes = true; await f.sandbox.__review.vpoll();
  assert.equal(f.sandbox.__review.vjobs()[0].phase, 'apply-failed'); f.controls.failNotes = false;
  await f.sandbox.__review.applyVoice(f.sandbox.__review.vjobs()[0], false); assert.ok(f.readNote().sum);
}
// Parent privacy/PIN are enforced before network or writes. A deleted note never reappears.
for (const options of [{ locked: true }, { parent: true, share: false }]) {
  const f = fixture(base, done(result()), options); await f.sandbox.__review.vpoll(); assert.equal(f.requests.length, 0); assert.equal(f.readNote().cloud, undefined);
}
{
  const f = fixture(); f.storage.set('fc_notes_v1', '[]'); await f.sandbox.__review.vpoll(); assert.equal(JSON.parse(f.storage.get('fc_notes_v1')).length, 0); assert.equal(f.sandbox.__review.vjobs().length, 0);
}
// Network failures retain a pending task; invalid receipts never mutate a note.
{
  const f = fixture(base, Error('offline')); await f.sandbox.__review.vpoll(); assert.equal(f.sandbox.__review.vjobs().length, 1);
  const bad = fixture(base, done(result([{ ...audioFile, url: 'javascript:alert(1)' }]))); await bad.sandbox.__review.vpoll(); assert.equal(bad.sandbox.__review.vjobs()[0].phase, 'failed'); assert.equal(bad.readNote().cloud, undefined);
}
// An edit made while audio verification is awaiting must not be overwritten.
{
  const f = fixture({ ...base, audio: { id: 'local-audio' } });
  let release, began;
  const started = new Promise(r => { began = r; });
  f.sandbox.FC_AUDIO.rememberDrive = async () => { began(); return new Promise(r => { release = r; }); };
  const pending = f.sandbox.FC_NOTES.applyCloud(base.id, basis(base), { at: Date.now(), value: result([audioFile]) }, 'delayed-job');
  await started;
  f.storage.set('fc_notes_v1', JSON.stringify([{ ...f.readNote(), text: '검증을 기다리다 수정한 원문' }]));
  release(true); assert.equal(await pending, 'conflict'); assert.equal(f.readNote().text, '검증을 기다리다 수정한 원문');
}
// Existing Chat/MCP receiver waits for the asynchronous apply and keeps manual recovery.
{
  const f = fixture(); f.storage.set('fc-voice-v1', '[]');
  vm.runInContext(src('study-chat-drive.js').replace(/\}\)\(\);\s*$/, 'window.__chatReview = { check: check, row: row };\n})();'), f.sandbox);
  const j = { id: 'b'.repeat(32), ownerKey: 'c'.repeat(64), noteId: base.id, kind: 'note', basis: basis(base), expiresAt: Date.now() + 60000 };
  f.controls.response = { ok: true, result: { at: Date.now(), value: result() } };
  await f.sandbox.__chatReview.check(j, true); assert.equal(j.applied, true); assert.ok(f.readNote().sum);
  j.applied = false; j.error = 'retry'; assert.ok(f.sandbox.__chatReview.row(j).includes('data-cd-apply'));
}
console.log('PASS: review upgrade client — list pagination, no false success, 4 field conflicts/result retention/explicit apply, interruption/retry state, real audio-vault SHA256 + IDB persistence/re-open, quota/hash failure recovery, privacy/PIN/deleted-note guards, network/invalid-receipt handling, async Chat/MCP compatibility.');

// Dashboard: compare the same elapsed weekdays, supply readable values, preserve parent sharing.
for (const parent of [false, true]) {
  const f = fixture(base, done(result()), { parent, share: !parent });
  const pl = { share: { flow: !parent, review: !parent, exams: !parent }, again: {}, againDone: {}, focus: [
    { date: '2026-10-19', subject: '수학', min: 30 }, { date: '2026-10-20', subject: '영어', min: 45 },
    { date: '2026-10-12', subject: '수학', min: 20 }, { date: '2026-10-13', subject: '영어', min: 30 },
    { date: '2026-10-17', subject: '과학', min: 1000 }
  ] };
  f.sandbox.FC_PLANNER = { get: () => pl, todays: () => [], studied: () => ({ '2026-10-19': true }) };
  f.sandbox.state.dates = [{ date: '2026-10-23', kind: '시험', title: '비공개 시험 제목' }];
  f.sandbox.state.tasks = [];
  f.sandbox.location.hash = '#dash';
  vm.runInContext(src('dashboard.js'), f.sandbox);
  const html = f.element.innerHTML;
  if (parent) { assert.ok(!html.includes('비공개 시험 제목')); assert.ok(!html.includes('1시간 15분')); }
  else {
    assert.ok(html.includes('1시간 15분')); assert.ok(html.includes('지난주 같은 요일까지보다 25분 더'));
    assert.ok(html.includes('월요일 30분')); assert.ok(html.includes('화요일 45분'));
    assert.ok(html.includes('<th scope="row">')); assert.ok(html.includes('요일별 숫자를 표로 보기'));
  }
}
console.log('PASS: dashboard — elapsed-weekday comparison, 7-day accessible values/table, parent privacy.');
