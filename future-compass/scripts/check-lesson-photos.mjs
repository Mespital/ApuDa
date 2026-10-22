// Actual note code in a VM + transactional IndexedDB fixture; no AI, camera or real Drive writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto, randomBytes } from 'node:crypto';
import { makeHandler } from '../netlify/lib/study-handoff-core.mjs';

const source = name => fs.readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8');
const plain = x => JSON.parse(JSON.stringify(x));
const tick = () => new Promise(resolve => setImmediate(resolve));
const image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2Q==';
const audio = { id: 'audio-fixture-1', name: '수학_함수_2026-10-21_KST.webm' };
const oldNote = { id: 'oldnote01', date: '2026-10-21', at: '2026-10-21T06:30:00Z', subject: '수학', topic: '함수', kind: 'talk', text: '내가 녹음으로 설명한 함수의 정의와 대응 관계이다.', sum: '직접 수정한 정리', audio, review: 'old-review' };
const today = () => '2026-10-22';

function field(value = '') { return { value, disabled: false, hidden: false, open: false, textContent: '', readOnly: false, classList: { add() {}, remove() {} }, setAttribute() {}, focus() {}, getClientRects: () => [{}] }; }
function makeSheet(kind, lesson = { date: '2026-10-21', purpose: 'last', page: 86 }) {
  const fields = {
    '.tn-text': field(kind === 'talk' ? oldNote.text : ''), '.tn-photo-text': kind === 'talk' ? field('사진 속 정의와 중요한 조건을 확인한다.') : null,
    '.tn-sub-other': field('수학'), '.tn-topic': field('함수'), '.tn-sum': field(''), '.tn-page': field(lesson.page == null ? '' : String(lesson.page)),
    '.tn-lesson-date': field(lesson.date), '.tn-purpose': field(lesson.purpose), '.tn-sum-box': field(), '.tn-panel': field(), '.tn-lesson-fields': field(),
    '.tn-prompt': field(), '.tn-transfer-status': field(), '[data-tn-gpt]': field(), '.tn-ocr-status': field(), '[data-tn-ocr]': field(),
    '[data-tn-save]': field(), '[data-tn-cloud-new]': field()
  };
  const days = [1, 3, 7].map(n => ({ checked: true, dataset: { tnDay: String(n) } }));
  return {
    fields, days, removed: false,
    querySelector: s => fields[s] || null,
    querySelectorAll(s) { if (s === '[data-tn-day]') return days; if (s === '[data-tn-save],[data-tn-cloud-new]') return [fields['[data-tn-save]'], fields['[data-tn-cloud-new]']]; if (s === 'button,input,select,textarea') return Object.values(fields).filter(Boolean); return []; },
    remove() { this.removed = true; }
  };
}

function fixture() {
  const storage = new Map(), photos = new Map(), notices = [], ops = [], P = { again: {}, share: { review: false } };
  const state = { reviews: [], dates: [], table: Array(5).fill(['수학', '과학']), tasks: [], bags: [] };
  let failKey = '', failPicture = false, role = 'child', locked = false, held = false, releases = [];
  const db = {
    createObjectStore() {},
    transaction() {
      const tx = { error: null };
      const finish = action => {
        const run = () => queueMicrotask(() => { if (action()) { if (tx.oncomplete) tx.oncomplete(); } else { tx.error = Error('fixture quota'); if (tx.onerror) tx.onerror(); } });
        if (held) releases.push(run); else run();
      };
      tx.objectStore = () => ({
        put(data, id) { finish(() => { if (failPicture && /^photo/.test(id)) { failPicture = false; return false; } photos.set(id, data); ops.push('photo:' + id); return true; }); },
        get(id) { const q = {}; queueMicrotask(() => { q.result = photos.get(id); if (q.onsuccess) q.onsuccess(); }); return q; },
        delete(id) { finish(() => { photos.delete(id); return true; }); }
      });
      return tx;
    }
  };
  const sandbox = {
    console, Date, URL, Blob, FormData, TextEncoder, AbortController, AbortSignal, crypto: webcrypto,
    today, uid: () => 'review-' + randomBytes(4).toString('hex'), notice: s => notices.push(s), render() {}, tab: 'fixture', state,
    navigator: {}, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, addEventListener() {},
    MutationObserver: class { observe() {} disconnect() {} },
    PinGate: { who: () => role }, FC_PLANNER: { KEY: 'fc_planner_v1', get: () => P },
    localStorage: {
      getItem: k => storage.get(k) ?? null,
      setItem(k, v) { if (k === failKey) { failKey = ''; throw Error('fixture storage quota'); } storage.set(k, String(v)); ops.push('store:' + k); },
      removeItem: k => storage.delete(k)
    },
    indexedDB: { open() { const req = {}; queueMicrotask(() => { req.result = db; if (req.onsuccess) req.onsuccess(); }); return req; } },
    document: {
      documentElement: { classList: { contains: () => locked, add() {}, remove() {} } },
      visibilityState: 'visible', addEventListener() {}, getElementById: () => ({}), querySelectorAll: () => [], querySelector: () => null,
      createElement: () => ({}), head: { appendChild() {} }
    },
    fetch: async () => ({ ok: true, json: async () => null }),
    esc: s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])),
    gap: d => Math.round((Date.parse(d) - Date.parse(today())) / 86400000)
  };
  sandbox.window = sandbox;
  sandbox.save = () => { try { sandbox.localStorage.setItem('compass-study-v1', JSON.stringify(state)); return true; } catch { return false; } };
  for (const [k, v] of [['compass-study-v1', state], ['fc_planner_v1', P], ['fc_notes_v1', []]]) storage.set(k, JSON.stringify(v));
  vm.createContext(sandbox); vm.runInContext(source('lesson-context.js'), sandbox);
  // Export private closures in the test copy only; production source executes unchanged.
  const marker = '  window.FC_NOTES = {'; assert.equal(source('talk-note.js').split(marker).length, 2);
  const instrumented = source('talk-note.js').replace(marker, `  window.__noteFixture = {
    configure: function (x) { sheet=x.sheet; sheetKind=x.kind; photoData=x.photo || ''; currentAudio=x.audio || null; editingNoteId=x.edit ? x.edit.id : ''; editingBasis=x.edit ? JSON.stringify(x.edit) : ''; },
    save: saveNote, ocr: runOcr, closed: function () { return sheet === null; }
  };\n` + marker);
  vm.runInContext(instrumented, sandbox, { filename: 'talk-note.js' });
  vm.runInContext(source('study-chat-drive.js'), sandbox, { filename: 'study-chat-drive.js' });
  const marker2 = '  /* ---------- 이번 주 ---------- */'; assert.ok(source('study-week.js').includes(marker2));
  vm.runInContext(source('study-week.js').replace(marker2, '  window.__prepFixture = { items: prepItems, card: prepCard };\n' + marker2), sandbox);
  function seed(n) {
    storage.set('fc_notes_v1', JSON.stringify([n])); state.reviews.push({ id: n.review, title: '수학 함수', date: n.date, subject: n.subject, note: '학생이 직접 쓴 복습 메모' });
    P.again[n.review] = ['2026-10-25', '2026-11-01']; storage.set('compass-study-v1', JSON.stringify(state)); storage.set('fc_planner_v1', JSON.stringify(P));
  }
  return {
    sandbox, storage, photos, notices, ops, P, state, seed, api: sandbox.__noteFixture,
    role: r => { role = r; }, lock: b => { locked = b; }, fail: k => { failKey = k; }, failPhoto: () => { failPicture = true; },
    hold: () => { held = true; }, release: () => { held = false; const a = releases; releases = []; a.forEach(f => f()); }
  };
}
async function settle() { for (let n = 0; n < 20; n++) await tick(); }

// Photo only, simultaneous photo+audio, and attachment to an existing spoken note.
for (const kind of ['photo', 'talk']) {
  const x = fixture(), sheet = makeSheet(kind); x.api.configure({ sheet, kind, photo: image, audio: kind === 'talk' ? audio : null });
  assert.equal(x.api.save(kind), true); assert.equal(x.api.save(kind), false, 'double submit is blocked'); await settle();
  const notes = JSON.parse(x.storage.get('fc_notes_v1')); assert.equal(notes.length, 1); const n = notes[0];
  assert.equal(n.date, '2026-10-21'); assert.equal(n.photo, true); assert.equal(n.lesson.page, 86); assert.match(n.photoRef, /^[a-z0-9]{8,40}$/);
  assert.equal(x.photos.get(n.photoRef), image); assert.equal(await x.sandbox.FC_NOTES.photo(n.id), image);
  assert.equal(x.state.reviews.length, 1); assert.deepEqual(plain(x.P.again[n.review]), ['2026-10-22', '2026-10-24', '2026-10-28']);
  assert.equal(x.api.closed(), true); assert.ok(x.ops.indexOf('photo:' + n.photoRef) < x.ops.lastIndexOf('store:fc_notes_v1'));
  if (kind === 'talk') { assert.deepEqual(n.audio, audio); assert.equal(n.text, oldNote.text); assert.match(n.photoText, /사진/); }
  else assert.match(x.state.reviews[0].note, /86쪽|86/);
}
{
  const x = fixture(); x.seed(oldNote); const sheet = makeSheet('photo'); sheet.fields['.tn-text'].value = '사진 속 중요한 조건';
  x.storage.set('fc-tn-draft', '{"text":"따로 쓰던 1분 메모"}');
  x.api.configure({ sheet, kind: 'photo', photo: image, edit: oldNote }); assert.equal(x.api.save('photo'), true); await settle();
  const n = JSON.parse(x.storage.get('fc_notes_v1'))[0];
  assert.equal(n.id, oldNote.id); assert.equal(n.text, oldNote.text); assert.equal(n.sum, oldNote.sum); assert.deepEqual(n.audio, oldNote.audio);
  assert.equal(n.photoText, '사진 속 중요한 조건'); assert.equal(x.state.reviews.length, 1);
  assert.equal(x.state.reviews[0].note, '학생이 직접 쓴 복습 메모'); assert.deepEqual(plain(x.P.again[n.review]), ['2026-10-25', '2026-11-01']);
  assert.equal(x.storage.get('fc-tn-draft'), '{"text":"따로 쓰던 1분 메모"}', 'attaching to a saved note keeps an unrelated draft');
}

// Fail each persistence boundary: no phantom note, review or changed old photo.
for (const failure of ['picture', 'compass-study-v1', 'fc_planner_v1', 'fc_notes_v1']) {
  const x = fixture(), before = ['compass-study-v1', 'fc_planner_v1', 'fc_notes_v1'].map(k => [k, x.storage.get(k)]);
  if (failure === 'picture') x.failPhoto(); else x.fail(failure);
  const sheet = makeSheet('photo'); x.api.configure({ sheet, kind: 'photo', photo: image }); x.api.save('photo'); await settle();
  for (const [k, v] of before) assert.equal(x.storage.get(k), v, failure + ': ' + k);
  assert.equal(x.state.reviews.length, 0); assert.deepEqual(plain(x.P.again), {}); assert.equal(x.api.closed(), false);
  assert.ok(![...x.photos.keys()].some(k => /^photo/.test(k)), failure + ' leaves no committed asset');
  assert.equal(sheet.fields['[data-tn-cloud-new]'].disabled, false);
}
{
  const x = fixture(), n = { ...oldNote, photo: true, photoRef: 'oldphoto001' }; x.seed(n); x.photos.set(n.photoRef, 'original image'); x.fail('fc_notes_v1');
  x.api.configure({ sheet: makeSheet('photo'), kind: 'photo', photo: image, edit: n }); x.api.save('photo'); await settle();
  assert.equal(x.photos.get(n.photoRef), 'original image'); assert.deepEqual(JSON.parse(x.storage.get('fc_notes_v1'))[0], n);
}
for (const change of ['role', 'concurrent edit']) {
  const x = fixture(); x.seed(oldNote); x.hold(); x.api.configure({ sheet: makeSheet('photo'), kind: 'photo', photo: image, edit: oldNote });
  x.api.save('photo'); await tick();
  if (change === 'role') x.role('parent'); else x.storage.set('fc_notes_v1', JSON.stringify([{ ...oldNote, text: '다른 탭에서 수정한 글' }]));
  x.release(); await settle(); assert.equal(x.api.closed(), false); assert.ok(![...x.photos.keys()].some(k => /^photo/.test(k)));
  if (change === 'concurrent edit') assert.equal(JSON.parse(x.storage.get('fc_notes_v1'))[0].text, '다른 탭에서 수정한 글');
}
for (const lesson of [{ date: '2026-02-30', purpose: 'last', page: 86 }, { date: '2026-10-23', purpose: 'last', page: 86 }, { date: '2026-10-21', purpose: 'last', page: -1 }]) {
  const x = fixture(); x.api.configure({ sheet: makeSheet('photo', lesson), kind: 'photo', photo: image }); assert.equal(x.api.save('photo'), false);
}

// OCR stays in the photo memo, preserves speech and a manually confirmed page,
// and late recognition cannot modify a different sheet/photo.
{
  const x = fixture(), sheet = makeSheet('talk'); let terminated = 0;
  x.sandbox.Tesseract = { createWorker: async () => ({ recognize: async () => ({ data: { text: '사진에서 읽은 새 조건' } }), terminate: async () => { terminated++; } }) };
  x.api.configure({ sheet, kind: 'talk', photo: image, audio }); x.api.ocr(); await settle();
  assert.equal(sheet.fields['.tn-text'].value, oldNote.text); assert.match(sheet.fields['.tn-photo-text'].value, /읽은 새 조건/); assert.equal(sheet.fields['.tn-page'].value, '86');
  x.api.ocr(); await settle(); assert.equal(sheet.fields['.tn-photo-text'].value.split('사진에서 읽은 새 조건').length, 2); assert.equal(terminated, 2);
  let release; x.sandbox.Tesseract.createWorker = async () => ({ recognize: () => new Promise(resolve => { release = resolve; }), terminate: async () => { terminated++; } });
  x.api.ocr(); await tick(); const next = makeSheet('photo'); x.api.configure({ sheet: next, kind: 'photo', photo: image + 'different' });
  release({ data: { text: '이전 사진의 늦은 결과' } }); await settle();
  assert.equal(next.fields['.tn-text'].value, ''); assert.equal(terminated, 3);
}

// Important photos never advance progress, next-day prep uses the last confirmed page,
// and parent sharing hides all private photo-derived context.
{
  const x = fixture();
  const rows = [
    { ...oldNote, id: 'lastpage01', photo: true, lesson: { date: '2026-10-21', purpose: 'last', page: 86 } },
    { ...oldNote, id: 'important01', date: '2026-10-22', photo: true, topic: '<img src=x onerror=alert(1)>', lesson: { date: '2026-10-22', purpose: 'important', page: 999 } },
    { ...oldNote, id: 'future01', date: '2026-10-24', lesson: { date: '2026-10-24', purpose: 'last', page: 200 } },
    { ...oldNote, id: 'other01', subject: '경제수학', lesson: { date: '2026-10-21', purpose: 'last', page: 300 } }
  ];
  x.storage.set('fc_notes_v1', JSON.stringify(rows));
  const c = x.sandbox.FC_LESSON.forSubject('수학', '2026-10-23'); assert.equal(c.page, 86); assert.equal(c.nextPage, 87); assert.equal(c.date, '2026-10-22');
  const markup = x.sandbox.FC_LESSON.markup(c, true); assert.match(markup, /&lt;img/); assert.doesNotMatch(markup, /<img/); assert.match(markup, /lastpage01/);
  assert.equal(x.sandbox.__prepFixture.items('2026-10-23')[0].lesson.nextPage, 87); assert.match(x.sandbox.__prepFixture.card(), /예습 출발: 87쪽/);
  vm.runInContext(source('today-view.js'), x.sandbox); const tv = x.sandbox.TodayView;
  assert.match(tv.collect('2026-10-22').prep.items[0].target, /87쪽/);
  assert.doesNotMatch(JSON.stringify(tv.collect('2026-10-22', { shared: true })), /87쪽|important01|lastpage01|onerror/);
  x.role('parent'); assert.equal(x.sandbox.FC_LESSON.forSubject('수학', '2026-10-23'), null);
  x.P.share.review = true; x.storage.set('fc_planner_v1', JSON.stringify(x.P)); assert.equal(x.sandbox.FC_LESSON.forSubject('수학', '2026-10-23').page, 86);
  x.lock(true); assert.equal(x.sandbox.FC_LESSON.forSubject('수학', '2026-10-23'), null);
}

// Replacing a page or image after handing off a note must not accept an older result silently.
{
  const x = fixture(), n = { ...oldNote, photo: true, photoRef: 'phototest001', photoNeedsReview: true, photoText: '사진 글', lesson: { date: oldNote.date, purpose: 'last', page: 86 } }; x.seed(n);
  const basis = x.sandbox.FC_CHAT_DRIVE.basis(n); n.lesson.page = 90; x.storage.set('fc_notes_v1', JSON.stringify([n]));
  const result = { at: Date.now(), value: { summary: '사진과 말한 글을 함께 정리했다.', files: [] } };
  assert.equal(x.sandbox.FC_NOTES.applyCloud(n.id, basis, result, 'job-old', false), 'conflict');
  assert.equal(x.sandbox.FC_NOTES.applyCloud(n.id, basis, result, 'job-old', true), 'applied');
  assert.equal(x.sandbox.FC_NOTES.get(n.id).photoNeedsReview, true, 'forced old result is not a new image review');
  const current = x.sandbox.FC_NOTES.get(n.id);
  assert.equal(x.sandbox.FC_NOTES.applyCloud(n.id, x.sandbox.FC_CHAT_DRIVE.basis(current), result, 'job-new', false), 'applied');
  assert.equal(x.sandbox.FC_NOTES.get(n.id).photoNeedsReview, false);
}

// Actual server manifest retains separate photo text and confirmed scope with audio + JPEG.
{
  const rows = new Map(), store = { get: async k => rows.get(k), getMetadata: async k => rows.has(k) ? { metadata: {} } : null, setJSON: async (k, v) => { rows.set(k, v); return { modified: true }; }, delete: async k => rows.delete(k) };
  const now = Date.parse('2026-10-22T01:00:00Z'), handler = makeHandler(() => store, () => now), endpoint = 'https://fixture.example/.netlify/functions/study-handoff';
  const send = async patch => {
    const form = new FormData(), id = randomBytes(16).toString('hex');
    form.set('packet', JSON.stringify({ version: 1, id, ownerKey: randomBytes(32).toString('hex'), kind: 'note', source: { noteId: 'fixture-note', at: new Date(now).toISOString(), subject: '수학', topic: '함수', text: oldNote.text, photoText: '사진에서 읽은 함수의 조건', sum: '', review: 'fixture-review', reviewDates: ['2026-10-23'], lesson: { date: '2026-10-22', purpose: 'last', page: 86 }, ...patch } }));
    form.set('audio', new Blob([Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1, 2])], { type: 'audio/webm' }), 'voice.webm');
    form.set('photo', new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2])], { type: 'image/jpeg' }), 'photo.jpg');
    return handler(new Request(endpoint + '?mode=create', { method: 'POST', headers: { origin: 'https://fixture.example' }, body: form }));
  };
  const response = await send({}); assert.equal(response.status, 200); const created = await response.json();
  const manifest = await (await handler(new Request(created.url))).json();
  assert.equal(manifest.source.photoText, '사진에서 읽은 함수의 조건'); assert.equal(manifest.source.lesson.page, 86);
  assert.deepEqual(manifest.files.map(f => f.role), ['note', 'source', 'audio', 'photo']);
  const md = await (await handler(new Request(manifest.files[0].url))).text(); assert.match(md, /수업 범위/); assert.match(md, /照片|사진에서 읽은/); assert.match(md, /86/);
  for (const lesson of [{ date: '2026-10-23', purpose: 'last', page: 86 }, { date: '2026-10-22', purpose: 'important', page: '86' }, { date: '2026-10-22', purpose: 'last', page: 0 }]) assert.equal((await send({ lesson })).status, 400);
  assert.equal((await send({ photoText: 'x'.repeat(1501) })).status, 400);
}
console.log('PASS: lesson photos — photo-only/audio+photo/attach, atomic assets+3 stores, quota rollback, double-submit/role/edit guards, KST review dates, confirmed-page prep, important-photo isolation, private sharing, stale-result conflicts, and combined Drive manifest');
