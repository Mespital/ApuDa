// Check the real quick-add/core/planner integration without network or a browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, 'dist', name), 'utf8');
const day = '2026-10-14', epoch = Date.parse('2026-10-13T18:00:00Z');
const coreKey = 'compass-study-v1', plannerKey = 'fc_planner_v1';
function node() {
  return { innerHTML: '', textContent: '', style: {}, dataset: {},
    querySelector: () => null, querySelectorAll: () => [], setAttribute() {},
    appendChild() {}, remove() {}, addEventListener() {}, insertAdjacentElement() {},
    insertAdjacentHTML(pos, html) { this.innerHTML += html; } };
}
function fixture() {
  let role = 'child', failKey = '';
  const storage = new Map(), writes = [], events = new Map(), content = node(), timers = [];
  const core = { table: Array.from({ length: 5 }, () => ['수학', '영어']), bags: Array(5).fill(''),
    tasks: [{ id: 'a', title: '첫 번째', date: day, done: false }, { id: 'b', title: '완료한 일', date: day, done: true }, { id: 'c', title: '다음 할 일', date: day, done: false }, { id: 'd', title: '뒤의 할 일', date: day, done: false }],
    dates: [{ id: 'exam', title: '주말 시험', subject: '수학', kind: '시험', date: '2026-10-17', done: false }],
    reviews: [], timer: { duration: 1500, remaining: 1500, end: 0 }, sessions: {} };
  storage.set(coreKey, JSON.stringify(core));
  storage.set(plannerKey, JSON.stringify({ pri: { a: { p: 'A', st: '', min: 0 }, c: { p: 'B', st: '', min: 0 }, d: { p: 'C', st: '', min: 0 } }, wiz: { done: 1, skip: {} } }));
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [epoch])); } static now() { return epoch; } }
  const document = { head: node(), body: node(), visibilityState: 'visible',
    getElementById: id => id === 'content' ? content : null,
    querySelector: sel => sel === '#content' ? content : node(), querySelectorAll: () => [], createElement: node,
    addEventListener(type, fn) { const list = events.get(type) || []; list.push(fn); events.set(type, list); } };
  const context = { document, console, Date: FixedDate, crypto: { randomUUID },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem(k, v) { if (k === failKey) { failKey = ''; throw Error('quota'); } writes.push(k); storage.set(k, String(v)); } },
    location: { hash: '' }, PinGate: { who: () => role },
    FC_CAL: { offDay: d => ['2026-10-15'].includes(d) ? { name: '휴업일' } : [0, 6].includes(new Date(d + 'T12:00:00Z').getUTCDay()) ? { weekend: true } : null, schoolEvents: () => [] },
    FC_SCHOOL: { config: { periods: ['08:20', '09:20'], classMinutes: 50 } },
    FC_ACADEMY: { forDay: d => d === day ? [{ id: 'ac', name: '수학 학원', subject: '수학', start: '18:00', end: '22:00' }] : [] },
    FC_LIFE: { forDay: () => [] },
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {}, setInterval() {},
    addEventListener() {}, dispatchEvent() {}, confirm: () => true, navigator: {},
    FormData: class { constructor(form) { this.form = form; } get(k) { return this.form.values[k]; } } };
  context.window = context; vm.createContext(context);
  for (const name of ['study.js', 'planner.js', 'study-brief.js']) vm.runInContext(read(name), context, { filename: name });
  return { context, storage, writes, content, api: context.FC_STUDY_BRIEF,
    role: next => { role = next; }, failOnce: key => { failKey = key; }, run: s => vm.runInContext(s, context),
    fire(type, target) { for (const fn of events.get(type) || []) fn({ target, preventDefault() {} }); } };
}
const app = fixture();
assert.equal(app.run('today()'), day, 'quick-add uses the Korean day across a UTC date boundary');
assert.deepEqual(JSON.parse(JSON.stringify(app.api.model({ nowMinutes: 0 }).tasks.map(x => x.id))), ['a', 'c', 'd']);
assert.equal(app.api.model({ nowMinutes: 8 * 60 + 25 }).next.ongoing, true);
assert.equal(app.api.model({ nowMinutes: 8 * 60 + 25 }).next.kind, '1교시');
assert.equal(app.api.model({ nowMinutes: 16 * 60 }).next.time, '18:00');
assert.equal(app.api.model({ nowMinutes: 22 * 60 }).next.date, '2026-10-16', 'skip ended events and the next holiday');
assert.equal(app.api.model({ nowMinutes: 0 }).deadline.title, '주말 시험');
const before = app.run('JSON.stringify(state)');
assert.equal(app.api.addTask({ subject: '영어', title: '본문 읽기', due: '2026-02-30' }), false);
assert.equal(app.run('JSON.stringify(state)'), before);
const form = { dataset: {}, values: { subject: '영어', title: '본문 20문장 읽기', due: '2026-10-15' }, hasAttribute: k => k === 'data-sb-quick', matches: () => false };
app.fire('submit', form);
const saved = JSON.parse(app.storage.get(coreKey)).tasks.find(x => x.title === form.values.title);
assert.ok(saved); assert.equal(saved.subject, '영어'); assert.equal(saved.date, day);
assert.equal(JSON.parse(app.storage.get(plannerKey)).pri[saved.id].due, '2026-10-15');
assert.equal(app.api.model().deadline.id, saved.id);
assert.equal(app.api.model().tasks.length, 3, 'more tasks are retained, but the overview stays capped at three');
assert.ok(app.run('restore(localStorage.getItem(KEY)).tasks').some(x => x.id === saved.id && x.subject === '영어'));
app.fire('change', { dataset: { check: 'tasks', id: saved.id }, checked: true, matches: () => false });
assert.equal(JSON.parse(app.storage.get(coreKey)).tasks.find(x => x.id === saved.id).done, true);
assert.ok(!app.api.dueItems(day, false).some(x => x.id === saved.id), 'completion removes the associated task deadline');
const original = app.run('JSON.stringify(state)');
app.failOnce(plannerKey);
assert.equal(app.api.addTask({ subject: '국어', title: '저장 실패 검사', due: '2026-10-16' }), false);
assert.equal(app.run('JSON.stringify(state)'), original, 'quota failure does not leave a half-saved task');
assert.ok(!JSON.parse(app.storage.get(coreKey)).tasks.some(x => x.title === '저장 실패 검사'));
app.context.FC_PLANNER.get().share.flow = false; app.context.FC_PLANNER.get().share.exams = false;
app.role('parent');
const writes = app.writes.length, pm = app.api.model();
assert.equal(pm.total, 0); assert.equal(pm.tasks.length, 0); assert.equal(pm.deadline, null);
assert.doesNotMatch(app.api.summaryHTML(pm), /data-check|data-remove|<input|첫 번째|주말 시험/);
assert.equal(app.api.addTask(form.values), false); assert.equal(app.writes.length, writes, 'parent overview is read-only');
app.role('child');
app.context.FC_PLANNER.get().share.flow = true; app.context.FC_PLANNER.get().share.exams = true;
assert.equal(app.api.addTask({ subject: '영어', title: '<img src=x onerror=alert(1)>', due: day }), true);
assert.match(app.api.summaryHTML(app.api.model()), /&lt;img/);
assert.doesNotMatch(app.api.summaryHTML(app.api.model()), /<img src=x/);
assert.equal((app.api.quickHTML().match(/<input /g) || []).length, 3);
const html = read('study.html');
assert.ok(html.includes('study-brief.css') && html.includes('study-brief.js'));
assert.ok(html.indexOf('academy-occurrences.js') < html.indexOf('today-view.js'));
assert.ok(html.indexOf('home-simple.js') < html.indexOf('study-brief.js'));
for (const match of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) assert.ok(fs.existsSync(path.join(root, 'dist', match[1])), 'bound asset exists: ' + match[1]);
console.log('PASS: next-event/holiday/date rollover, three priorities, actual three-field submit, deadline persistence/completion, quota rollback, parent flags/read-only behavior, escaped titles, and HTML asset wiring.');
