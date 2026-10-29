// Regression checks for lost Watch notes, durable retries, private reads and KST review dates.
// Uses the actual browser scripts and an isolated local server. No real family/Drive/AI calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createVoice } from '../live/voice.mjs';
import { createWatch } from '../live/watch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-recovery-'));
const tick = () => new Promise(resolve => setImmediate(resolve));
const clone = x => JSON.parse(JSON.stringify(x));
const text = '함수는 두 집합 사이의 대응이고 각 원소에 하나의 값이 대응한다.';
const captured = '2026-10-21T14:59:00.000Z'; // 23:59 KST; imported on the next day.
const ext = { extId: 'a'.repeat(32), via: 'watch', subject: '공통수학2', text, at: captured, resultAt: Date.parse(captured) + 1000, outcome: 'failed', errors: ['drive'] };
const source = name => fs.readFileSync(path.join(root, 'dist', name), 'utf8');

function importer() {
  const storage = new Map(), P = { again: {} }, state = { reviews: [], table: [] };
  let fail = '', role = 'child', locked = false;
  const sandbox = {
    console, Date, render() {}, tab: 'fixture', state, today: () => '2026-10-22',
    notice() {}, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
    PinGate: { who: () => role }, FC_PLANNER: { KEY: 'planner-fixture', get: () => P },
    localStorage: {
      getItem: k => storage.get(k) ?? null,
      setItem(k, value) { if (k === fail) { fail = ''; throw Error('QuotaExceededError'); } storage.set(k, String(value)); },
      removeItem: k => storage.delete(k)
    },
    document: {
      documentElement: { classList: { contains: () => locked } },
      addEventListener() {}, querySelectorAll: () => [], getElementById: () => ({}),
      createElement: () => ({}), head: { appendChild() {} }
    },
    addEventListener() {}
  };
  sandbox.window = sandbox;
  sandbox.save = () => { try { sandbox.localStorage.setItem('compass-study-v1', JSON.stringify(state)); return true; } catch { return false; } };
  for (const [k, v] of [['compass-study-v1', state], ['planner-fixture', P], ['fc_notes_v1', []]]) storage.set(k, JSON.stringify(v));
  vm.createContext(sandbox);
  vm.runInContext(source('talk-note.js'), sandbox, { filename: 'talk-note.js' });
  return { api: sandbox.FC_NOTES, storage, state, P, fail: k => { fail = k; }, role: r => { role = r; }, lock: v => { locked = v; } };
}

async function importerChecks() {
  for (const key of ['compass-study-v1', 'planner-fixture', 'fc_notes_v1']) {
    const x = importer(), before = [...x.storage]; x.fail(key);
    assert.equal(x.api.addExternal(ext), false, key + ' failure must not confirm import');
    assert.deepEqual([...x.storage], before, 'all storage rolls back after ' + key);
    assert.deepEqual(clone(x.state.reviews), []); assert.deepEqual(clone(x.P.again), {});
    assert.equal(x.api.hasExternal(ext.extId, ext.resultAt), false);
    assert.equal(x.api.addExternal(ext), true, 'retained server note can be imported later');
    assert.equal(x.state.reviews.length, 1);
    assert.equal(x.api.addExternal(ext), false, 'repeated import adds no duplicate');
    assert.equal(x.api.hasExternal(ext.extId, ext.resultAt), true);
  }
  const x = importer(); assert.equal(x.api.addExternal(ext), true);
  const note = x.api.get('ext-' + ext.extId), reviewId = note.review;
  assert.equal(note.date, '2026-10-21');
  assert.equal(x.state.reviews[0].date, '2026-10-21');
  assert.deepEqual(clone(x.P.again[reviewId]), ['2026-10-22', '2026-10-24', '2026-10-28']);
  const edited = JSON.parse(x.storage.get('fc_notes_v1'));
  edited[0].text = '내가 수정한 원문'; edited[0].sum = '내가 수정한 정리';
  x.storage.set('fc_notes_v1', JSON.stringify(edited)); x.state.reviews[0].note = '직접 쓴 복습 메모';
  x.P.again[reviewId] = ['2026-10-30'];
  const update = { ...ext, resultAt: ext.resultAt + 2000, sum: '다시 처리한 정리', outcome: 'success', errors: [], files: [{ role: 'review', id: 'fixturefile1234', name: '복습정리.md', url: 'https://drive.google.com/file/d/fixturefile1234/view' }] };
  assert.equal(x.api.addExternal(update), true);
  const after = x.api.get(note.id);
  assert.equal(after.text, '내가 수정한 원문'); assert.equal(after.sum, '내가 수정한 정리');
  assert.equal(x.state.reviews[0].note, '직접 쓴 복습 메모');
  assert.deepEqual(clone(x.P.again[reviewId]), ['2026-10-30']);
  assert.equal(after.watchState, 'success'); assert.equal(after.cloud.files.length, 1);
  assert.equal(x.state.reviews.length, 1); assert.equal(JSON.parse(x.storage.get('fc_notes_v1')).length, 1);
  x.role('parent'); assert.equal(x.api.addExternal({ ...ext, extId: 'b'.repeat(32) }), false);
  x.role('child'); x.lock(true); assert.equal(x.api.addExternal({ ...ext, extId: 'b'.repeat(32) }), false);
}

async function transportChecks() {
  for (const mode of ['failure', 'accepted', 'duplicate', 'ack-loss', 'role-change']) {
    const acknowledgements = [], storage = new Map(); let role = 'child', imports = 0, stored = false, pulls = 0;
    const sandbox = {
      console, Date, render() {}, tab: 'fixture', state: { table: [] }, navigator: { userAgent: 'Fixture' },
      PinGate: { who: () => role }, FamilySync: { joined: () => true, live: () => ({ url: 'http://fixture.invalid', t: 'fixture-ticket' }) },
      FC_NOTES: {
        addExternal() { imports++; if (mode === 'failure' || mode === 'duplicate' || stored) return false; stored = true; return true; },
        hasExternal: () => stored || mode === 'duplicate'
      },
      localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
      setTimeout() {}, clearTimeout() {}, addEventListener() {},
      document: { documentElement: { classList: { contains: () => false } }, addEventListener() {}, visibilityState: 'visible' },
      fetch: async (url, options) => {
        if (url.includes('/watch/ack')) {
          acknowledgements.push(...JSON.parse(options.body).ids);
          if (mode === 'ack-loss' && acknowledgements.length === 1) throw Error('lost reply');
        }
        if (url.includes('/watch/inbox')) { pulls++; if (mode === 'role-change') role = 'parent'; }
        return { ok: true, json: async () => url.includes('/watch/inbox') ? { ok: true, pending: 0, items: [{ ...ext, id: ext.extId, state: 'done', transcript: text }] } : { ok: true } };
      }
    };
    sandbox.window = sandbox; vm.createContext(sandbox); vm.runInContext(source('watch-link.js'), sandbox);
    await sandbox.FC_WATCH.refresh(true);
    assert.equal(acknowledgements.length, ['failure', 'role-change'].includes(mode) ? 0 : 1, mode);
    if (mode === 'role-change') assert.equal(imports, 0, 'role changed during request');
    if (mode === 'ack-loss') { await sandbox.FC_WATCH.refresh(true); assert.equal(acknowledgements.length, 2); assert.equal(imports, 2); assert.equal(pulls, 2); }
  }
}

const terminal = async (v, id) => {
  for (let n = 0; n < 100; n++) { const s = v.status(id); if (['done', 'interrupted'].includes(s?.state)) return s; await tick(); }
  throw Error('job did not settle: ' + id);
};
const watchJob = (id, at) => ({ id: id.repeat(32), source: 'watch', textOnly: true, subject: '공통수학2', topic: '워치 메모', at: new Date(at).toISOString(), text });
async function voiceChecks() {
  let now = Date.now();
  const dir = path.join(fixture, 'resume'), job = watchJob('b', now);
  const first = createVoice({ hasAI: true, organize: () => new Promise(() => {}) }, dir, () => now);
  first.start(job); await tick();
  const disk = JSON.parse(fs.readFileSync(path.join(dir, job.id + '.json')));
  assert.equal(disk.input.text, text); assert.equal(disk.state, 'working');
  assert.equal(disk.audio, undefined); assert.equal(disk.input.audio, undefined);
  const uploaded = [];
  const second = createVoice({ hasAI: true, organize: async () => '함수의 핵심 정리', drive: { upload: async (folder, name) => { uploaded.push({ folder, name }); return { id: 'fixturefile' + uploaded.length }; } } }, dir, () => ++now);
  const resumed = await terminal(second, job.id);
  assert.equal(resumed.outcome, 'success'); assert.equal(second.pending(), 0);
  assert.deepEqual(resumed.result.files.map(f => f.role), ['note', 'review']);
  assert.ok(uploaded.every(f => f.folder === '승준 공부방/1분 복습 녹음/공통수학2'));

  const partialDir = path.join(fixture, 'partial'), partJob = watchJob('c', now); let summaryCalls = 0;
  const partial = createVoice({ hasAI: true, organize: async () => { summaryCalls++; return '핵심 정리'; }, drive: { upload: async (folder, name) => { if (name.includes('복습정리')) throw Error('quota'); return { id: 'existingnote123' }; } } }, partialDir, () => ++now);
  partial.start(partJob); const incomplete = await terminal(partial, partJob.id);
  assert.equal(incomplete.outcome, 'partial'); assert.deepEqual(incomplete.errors, ['drive_review']);
  const retryUploads = [];
  const retry = createVoice({ hasAI: true, organize: async () => { throw Error('summary should be reused'); }, drive: { upload: async (folder, name) => { retryUploads.push(name); return { id: 'newreview12345' }; } } }, partialDir, () => ++now);
  assert.equal(retry.retry(partJob.id, 'watch').state, 'queued');
  const completed = await terminal(retry, partJob.id);
  assert.equal(completed.outcome, 'success'); assert.equal(retryUploads.length, 1);
  assert.match(retryUploads[0], /복습정리/); assert.equal(summaryCalls, 1);
  assert.equal(completed.result.files.find(f => f.role === 'note').id, 'existingnote123');

  // Simulate process loss after a note upload receipt was persisted but before review upload.
  const interrupted = JSON.parse(fs.readFileSync(path.join(partialDir, partJob.id + '.json')));
  interrupted.state = 'working'; interrupted.step = 'drive'; interrupted.result.files = interrupted.result.files.filter(f => f.role === 'note');
  fs.writeFileSync(path.join(partialDir, partJob.id + '.json'), JSON.stringify(interrupted)); retryUploads.length = 0;
  const again = createVoice({ hasAI: true, organize: async () => { throw Error('reuse summary'); }, drive: { upload: async (folder, name) => { retryUploads.push(name); return { id: 'resumedreview123' }; } } }, partialDir, () => ++now);
  assert.equal((await terminal(again, partJob.id)).outcome, 'success'); assert.equal(retryUploads.length, 1);

  const legacyDir = path.join(fixture, 'legacy'); fs.mkdirSync(legacyDir);
  const legacy = { id: 'd'.repeat(32), source: 'watch', createdAt: now, at: new Date(now).toISOString(), state: 'working', errors: [] };
  fs.writeFileSync(path.join(legacyDir, legacy.id + '.json'), JSON.stringify(legacy));
  const old = createVoice({}, legacyDir, () => now);
  assert.equal(old.status(legacy.id).outcome, 'interrupted'); assert.equal(old.pending(), 0);
  assert.equal(old.retry(legacy.id, 'watch').error, 'no_original');
  assert.equal(old.retry(legacy.id, 'other').error, 'not_found');

  const blocked = path.join(fixture, 'not-a-directory'); fs.writeFileSync(blocked, 'fixture');
  assert.equal(createVoice({}, blocked).start(watchJob('e', now)).error, 'persist', 'never receipt an unsaved input');
  const failDir = path.join(fixture, 'step-failure'); let release;
  const failed = createVoice({ hasAI: true, organize: () => new Promise(resolve => { release = resolve; }) }, failDir, () => now);
  const fjob = watchJob('f', now); failed.start(fjob); await tick();
  fs.rmSync(failDir, { recursive: true }); fs.writeFileSync(failDir, 'blocked'); release('정리');
  assert.equal((await terminal(failed, fjob.id)).state, 'interrupted', 'mid-step disk failure remains recoverable');
  assert.equal(failed.pending(), 0);

  const watchDir = path.join(fixture, 'watch-state'), W = createWatch(watchDir), key = 'a'.repeat(40);
  assert.equal(W.setKey(key), true); assert.equal(W.ack(['a'.repeat(32)]), true);
  fs.renameSync(watchDir, watchDir + '-backup'); fs.writeFileSync(watchDir, 'blocked');
  assert.equal(W.clearKey(), false); assert.equal(W.check(key), true);
  assert.equal(W.unack('a'.repeat(32)), false); assert.equal(W.acked('a'.repeat(32)), true);
}

async function serverChecks() {
  const allocator = net.createServer(); await new Promise(resolve => allocator.listen(0, '127.0.0.1', resolve));
  const port = allocator.address().port; await new Promise(resolve => allocator.close(resolve));
  const dir = path.join(fixture, 'http'); fs.mkdirSync(dir); fs.mkdirSync(path.join(dir, 'voice'));
  // More than one inbox page of old interrupted jobs must not starve a new completed note.
  for (let n = 0; n < 21; n++) {
    const id = n.toString(16).padStart(32, '0');
    fs.writeFileSync(path.join(dir, 'voice', id + '.json'), JSON.stringify({ id, source: 'watch', createdAt: Date.now() - 10000 - n, at: new Date().toISOString(), state: 'working', errors: [] }));
  }
  const secret = 'local-watch-test-secret-at-least-24-characters';
  const server = spawn(process.execPath, ['live/server.mjs'], {
    cwd: root, env: { PATH: process.env.PATH, PORT: String(port), FC_DATA_DIR: dir, FC_LIVE_SECRET: secret, FC_KEY_URL: `http://127.0.0.1:${port}/health`, FC_WEB_SEARCH: 'off' }, stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = ''; server.stderr.on('data', b => { stderr += b; });
  const base = `http://127.0.0.1:${port}`;
  const ticket = role => { const s = `${Date.now() + 600000}.${role}`; return s + '.' + createHmac('sha256', secret).update(s).digest('hex'); };
  const post = (route, b) => fetch(base + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  try {
    let ready = false;
    for (let n = 0; n < 80; n++) { try { ready = (await fetch(base + '/health')).ok; if (ready) break; } catch {} await new Promise(r => setTimeout(r, 25)); }
    assert.ok(ready, stderr);
    const key = 'b'.repeat(40), t = ticket('child');
    for (const role of ['parent', 'other']) {
      const denied = ticket(role);
      for (const route of ['setup', 'table', 'check', 'off', 'ack', 'retry']) assert.equal((await post('/watch/' + route, { t: denied, key, table: [], periods: [], ids: [] })).status, 403, role + ':' + route);
      assert.equal((await fetch(base + '/watch/inbox?t=' + encodeURIComponent(denied))).status, 403);
    }
    assert.equal((await fetch(base + '/watch/inbox')).status, 401);
    assert.equal((await post('/watch/note', { key, text })).status, 401);
    assert.equal((await post('/watch/setup', { t, key, table: [], periods: [] })).status, 200);
    assert.ok(!fs.readFileSync(path.join(dir, 'watch.json'), 'utf8').includes(key));
    assert.equal((await post('/watch/check', { t, key })).status, 200);
    assert.equal((await post('/watch/check', { t, key: 'c'.repeat(40) })).status, 401);
    assert.equal(fs.readdirSync(path.join(dir, 'voice')).length, 21, 'connection check creates no dummy job');
    const receipt = await post('/watch/note', { key, text, subject: '수학' });
    assert.equal(receipt.status, 200); const msg = await receipt.text();
    assert.match(msg, /수학 접수\n정리·Drive 보관 중\n완료는 공부방에서 확인/);
    assert.doesNotMatch(msg, /저장 완료/);
    let inbox;
    for (let n = 0; n < 60; n++) { inbox = await (await fetch(base + '/watch/inbox?t=' + encodeURIComponent(t))).json(); if (inbox.items.some(j => j.state === 'done')) break; await tick(); }
    const done = inbox.items[0]; assert.equal(done.state, 'done', 'completed item comes before interrupted legacy jobs');
    assert.equal(done.transcript, text); assert.equal(done.outcome, 'failed');
    assert.deepEqual(done.errors, ['summary', 'drive']); assert.equal(inbox.more, true);
    assert.equal((await fetch(base + '/voice?t=' + encodeURIComponent(ticket('parent')) + '&id=' + done.id)).status, 403, 'generic voice route must not bypass watch privacy');
    assert.equal((await post('/watch/ack', { t, ids: [done.id] })).status, 200);
    assert.ok(!(await (await fetch(base + '/watch/inbox?t=' + encodeURIComponent(t))).json()).items.some(j => j.id === done.id));
    assert.equal((await post('/watch/retry', { t, id: done.id })).status, 200);
    for (let n = 0; n < 60; n++) { inbox = await (await fetch(base + '/watch/inbox?t=' + encodeURIComponent(t))).json(); if (inbox.items.some(j => j.id === done.id)) break; await tick(); }
    assert.ok(inbox.items.some(j => j.id === done.id), 'retry makes updated result importable');
    assert.equal((await post('/watch/retry', { t, id: '0'.repeat(32) })).status, 409, 'legacy job has no durable original');
    assert.equal((await post('/watch/off', { t })).status, 200);
    assert.equal((await post('/watch/note', { key, text })).status, 401);
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const closed = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGTERM'); await closed;
    }
  }
}

try {
  await importerChecks(); await transportChecks(); await voiceChecks(); await serverChecks();
  console.log('PASS: watch recovery — three-store rollback, ACK after durable import, duplicate/ACK-loss recovery, role-switch guard, KST 1/3/7 dates, edit-preserving retries, restart/resume, partial Drive retry, legacy interruption, disk failures, child-only HTTP routes, safe receipt and paginated inbox');
} finally { fs.rmSync(fixture, { recursive: true, force: true }); }
