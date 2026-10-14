// 실제 학원 일정·화면 요약·백업·알림 계획을 검사한다. 네트워크와 알림 발송은 호출하지 않는다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import '../dist/academy-occurrences.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const r = globalThis.FC_ACADEMY_OCCURRENCES;
const key = r.KEY;
const academy = { id: 'math', name: '수학 학원', subject: '수학', days: [2, 4], start: '18:00', end: '22:00', from: '2026-10-15', progress: '함수', homework: '문제 3개', hwDone: false };
const record = (scope, date, fields = {}) => r.cleanRecord({ academyId: academy.id, scope, date, days: [2, 4], start: '18:00', end: '22:00', updatedAt: 1, ...fields });
const at = (date, records = [], series = [academy]) => r.forDay(series, records, date);
const json = value => JSON.parse(JSON.stringify(value));

assert.equal(at('2026-10-13').length, 0);
assert.equal(at('2026-10-15')[0].start, '18:00');
assert.equal(at('2026-10-16').length, 0);
assert.equal(at('2026-10-20')[0].end, '22:00');
assert.equal(at('2026-02-30').length, 0);
assert.equal(r.nextDate(academy, [], '2026-10-13'), '2026-10-15');

const once = record('one', '2026-10-15', { start: '17:00', end: '21:00' });
assert.equal(at('2026-10-15', [once])[0].start, '17:00');
assert.equal(at('2026-10-20', [once])[0].start, '18:00');
assert.equal(at('2026-10-22', [once])[0].start, '18:00');
const future = record('future', '2026-10-22', { days: [3], start: '16:00', end: '18:00' });
assert.equal(at('2026-10-20', [future])[0].start, '18:00');
assert.equal(at('2026-10-22', [future]).length, 0);
assert.equal(at('2026-10-27', [future]).length, 0);
assert.equal(at('2026-10-28', [future])[0].start, '16:00');
const restoredPattern = record('future', '2026-10-29', { days: [2, 4], start: '17:30', end: '20:00' });
assert.equal(at('2026-10-28', [restoredPattern, future])[0].start, '16:00');
assert.equal(at('2026-10-29', [restoredPattern, future])[0].start, '17:30');
assert.equal(at('2026-11-03', [restoredPattern, future])[0].start, '17:30');
const exception = record('one', '2026-10-22', { start: '19:00', end: '21:00', updatedAt: 2 });
assert.equal(at('2026-10-22', [exception, future])[0].start, '19:00', 'a saved one-off survives a later pattern change');

const moved = record('one', '2026-10-15', { moveTo: '2026-10-16' });
assert.equal(at('2026-10-15', [moved]).length, 0);
assert.equal(at('2026-10-16', [moved]).length, 1);
assert.equal(at('2026-10-16', [moved])[0].originalDate, '2026-10-15');
assert.equal(at('2026-10-20', [moved]).length, 1);
assert.equal(at('2026-10-15', [record('one', '2026-10-15', { cancelled: true })]).length, 0);
assert.equal(at('2026-10-22', [record('future', '2026-10-22', { cancelled: true })]).length, 0);
assert.equal(at('2026-10-27', [record('future', '2026-10-22', { cancelled: true })]).length, 0);
assert.equal(at('2026-10-20', [record('future', '2026-10-22', { cancelled: true })]).length, 1);
assert.equal(at('2026-10-16', [record('one', '2026-10-15', { moveTo: '2026-10-16', cancelled: true })]).length, 0);
assert.equal(at('2026-10-13', [record('one', '2026-10-13')]).length, 0, 'overrides cannot precede the academy start');
assert.equal(at('2026-10-15', [{ ...once, academyId: 'missing' }])[0].start, '18:00');
assert.equal(at('2026-10-15', [once], []).length, 0);
assert.equal(at('2026-10-20', [record('one', '2026-10-15', { moveTo: '2026-10-20' })]).length, 1, 'even conflicting imported records never duplicate an academy event');
assert.equal(r.cleanRecord({ ...once, start: '24:00' }), null);
assert.equal(r.cleanRecord({ ...once, end: '16:00' }), null);
assert.equal(r.cleanRecord({ ...once, date: '2026-02-30' }), null);
assert.equal(r.cleanRecords([once, { ...once, updatedAt: 20, start: '16:00' }])[0].start, '16:00');
assert.equal(at('2026-10-15', [once], [academy, { ...academy, id: 'english', name: '영어 학원', start: '15:00' }])[0].id, 'english');

const tzProgram = 'import("./dist/academy-occurrences.js").then(()=>{const r=globalThis.FC_ACADEMY_OCCURRENCES; console.log(JSON.stringify([r.forDay(' + JSON.stringify([academy]) + ',' + JSON.stringify([moved, future]) + ',"2026-10-16"),r.forDay(' + JSON.stringify([academy]) + ',' + JSON.stringify([moved, future]) + ',"2026-10-28"),r.nextDate(' + JSON.stringify(academy) + ',[],"2026-10-13")]));});';
const tzResults = ['UTC', 'Asia/Seoul', 'America/Los_Angeles', 'Pacific/Auckland'].map(TZ => execFileSync(process.execPath, ['-e', tzProgram], { cwd: root, env: { ...process.env, TZ }, encoding: 'utf8' }).trim());
for (const output of tzResults) assert.equal(output, tzResults[0], 'dates and weekdays do not depend on device timezone');

function memoryStorage() {
  const memory = new Map(); let failKey = '';
  return { memory, failOnceOn(key) { failKey = key; }, getItem: k => memory.get(k) ?? null,
    setItem(k, v) { if (failKey === k) { failKey = ''; throw Error('quota'); } memory.set(k, String(v)); }, removeItem: k => memory.delete(k) };
}
const storage = memoryStorage();
storage.setItem('fc_academy_v1', JSON.stringify([academy]));
const handlers = {};
const ui = { localStorage: storage, today: () => '2026-10-13', tab: 'today', history: { replaceState() {} }, FormData: class {
  constructor(form) { this.values = form.values; } get(k) { return this.values[k] ?? null; } getAll(k) { const v = this.values[k]; return Array.isArray(v) ? v : v == null ? [] : [v]; }
}, render() {}, notice(t) { ui.lastNotice = t; }, setTimeout() {}, document: { addEventListener: (kind, fn) => (handlers[kind] ??= []).push(fn), createElement: () => ({}), head: { appendChild() {} }, querySelector: () => null }, console };
ui.window = ui;
vm.createContext(ui); vm.runInContext(read('dist/academy-occurrences.js'), ui); vm.runInContext(read('dist/academy.js'), ui);
handlers.click.forEach(fn => fn({ target: { closest: () => ({ dataset: { acEdit: 'math' }, hasAttribute: () => false }) } }));
assert.equal(ui.tab, 'settings');
assert.match(ui.FC_ACADEMY.panel(), /이번 한 번만/);
assert.match(ui.FC_ACADEMY.panel(), /이번부터 이후 일정 모두/);
assert.match(ui.FC_ACADEMY.panel(), /value="2026-10-15"/);
function submit(fields) {
  const values = { name: academy.name, subject: academy.subject, book: '', progress: academy.progress, homework: academy.homework, addr: '', from: academy.from, note: '', tel: '', ...fields };
  const f = { values, matches: s => s === '[data-ac-form]', getAttribute: () => academy.id };
  handlers.submit.forEach(fn => fn({ target: f, preventDefault() {} }));
}
submit({ scope: 'one', occurrenceDate: '2026-10-15', moveTo: '2026-10-15', start: '17:00', end: '21:00' });
assert.equal(JSON.parse(storage.getItem('fc_academy_v1'))[0].start, '18:00', 'scoped edits preserve historical series defaults');
assert.equal(ui.FC_ACADEMY.forDay('2026-10-15')[0].start, '17:00');
assert.equal(ui.FC_ACADEMY.forDay('2026-10-20')[0].start, '18:00');
submit({ scope: 'future', occurrenceDate: '2026-10-22', day: ['3'], start: '16:00', end: '18:00' });
assert.equal(ui.FC_ACADEMY.forDay('2026-10-22').length, 0);
assert.equal(ui.FC_ACADEMY.forDay('2026-10-28')[0].start, '16:00');
submit({ scope: 'one', occurrenceDate: '2026-10-20', moveTo: '2026-10-21', start: '18:00', end: '22:00' });
assert.equal(ui.FC_ACADEMY.forDay('2026-10-20').length, 0);
assert.equal(ui.FC_ACADEMY.forDay('2026-10-21')[0].originalDate, '2026-10-20');
let before = storage.getItem(key);
submit({ scope: 'one', occurrenceDate: '2026-10-20', moveTo: '2026-10-28', start: '18:00', end: '22:00' });
assert.equal(storage.getItem(key), before, 'moving onto another occurrence is refused');
submit({ scope: 'one', occurrenceDate: '2026-10-19', moveTo: '2026-10-19', start: '18:00', end: '22:00' });
assert.equal(storage.getItem(key), before, 'only-this edits need an actual source occurrence');
submit({ scope: 'one', occurrenceDate: '2026-10-15', moveTo: '2026-10-15', start: '18:00', end: '17:00' });
assert.equal(storage.getItem(key), before);
storage.failOnceOn('fc_academy_v1');
const beforeSeries = storage.getItem('fc_academy_v1');
submit({ scope: 'one', occurrenceDate: '2026-10-15', moveTo: '2026-10-15', start: '16:00', end: '18:00' });
assert.equal(storage.getItem(key), before, 'a failed metadata write rolls back the recurrence write');
assert.equal(storage.getItem('fc_academy_v1'), beforeSeries);
submit({ scope: 'one', occurrenceDate: '2026-10-15', cancelled: 'on' });
assert.equal(ui.FC_ACADEMY.forDay('2026-10-15').length, 0);
assert.equal(ui.FC_ACADEMY.forDay('2026-10-22').length, 0);
const storedScopedRecords = storage.getItem(key);
submit({ day: ['2', '4'], start: '18:30', end: '22:00' });
assert.equal(JSON.parse(storage.getItem('fc_academy_v1'))[0].start, '18:30', 'old forms can still edit the default series');
assert.equal(storage.getItem(key), storedScopedRecords, 'old forms do not erase scoped schedules');

// Backup code is exercised with the app's actual core/extra validators.
const backupStorage = memoryStorage();
backupStorage.setItem('fc_academy_v1', JSON.stringify([academy]));
backupStorage.setItem(key, JSON.stringify([moved, future]));
const backupCtx = vm.createContext({ localStorage: backupStorage, window: { FC_ACADEMY_OCCURRENCES: r }, tick() {}, render() {}, console });
vm.runInContext(read('dist/study.js').split('let state;')[0], backupCtx);
const plus = read('dist/study-plus.js');
vm.runInContext(plus.slice(0, plus.indexOf('let plus;')) + 'this.restoreExtra=restorePlus;})();', backupCtx);
vm.runInContext('state=restore(null);window.studyPlusBridge={restore:restoreExtra,snapshot:()=>restoreExtra(null),replace(){}};', backupCtx);
const device = read('dist/study-device.js');
vm.runInContext(device.slice(0, device.indexOf('const input=document.createElement')) + 'this.backupAPI={inspectBackup,snapshot,atomicWrite,applyBackup};})();', backupCtx);
const b = backupCtx.backupAPI, snapshot = b.snapshot(), restored = b.inspectBackup(JSON.stringify(snapshot));
assert.equal(restored.side[key], JSON.stringify([moved, future]));
backupStorage.setItem(key, '[]'); b.applyBackup(restored);
assert.deepEqual(json(JSON.parse(backupStorage.getItem(key))), [moved, future]);
const undo = b.inspectBackup(backupStorage.getItem('compass-study-restore-undo-v1')); b.applyBackup(undo, false);
assert.equal(backupStorage.getItem(key), '[]');
const oldBackup = json(snapshot); delete oldBackup.side[key];
assert.equal(b.inspectBackup(JSON.stringify(oldBackup)).side[key], '[]', 'old academy backups restore the original schedule without stale new exceptions');
const unsupported = json(snapshot); unsupported.side['unrelated-token'] = 'secret';
assert.equal(b.inspectBackup(JSON.stringify(unsupported)).side['unrelated-token'], undefined);
for (const invalid of ['{bad', JSON.stringify([{ ...moved, date: '2026-02-30' }]), JSON.stringify(Array(r.LIMIT + 1).fill(moved))]) {
  const badBackup = json(snapshot); badBackup.side[key] = invalid;
  assert.throws(() => b.inspectBackup(JSON.stringify(badBackup)));
}
for (const k of ['compass-study-v1', 'compass-study-plus-v1', 'fc_academy_v1', key]) backupStorage.setItem(k, 'before-' + k);
backupStorage.failOnceOn(key);
assert.throws(() => b.atomicWrite(restored.core, restored.extra, restored.side));
for (const k of ['compass-study-v1', 'compass-study-plus-v1', 'fc_academy_v1', key]) assert.equal(backupStorage.getItem(k), 'before-' + k, 'backup writes roll back every affected key');

const todayStorage = memoryStorage(), uploads = [];
todayStorage.setItem('fc_academy_v1', JSON.stringify([academy]));
todayStorage.setItem(key, JSON.stringify([moved, future]));
todayStorage.setItem('compass-study-v1', JSON.stringify({ table: Array.from({ length: 5 }, () => ['수학', '', '', '', '', '', '']), tasks: [{ id: 'new', title: '문제 풀기', subject: '수학', date: '2026-10-16', done: false }, { id: 'old', title: '지난 과제', date: '2026-10-15', done: false }], dates: [{ id: 'exam', title: '영어 시험', date: '2026-10-17', kind: '시험', done: false }], reviews: [] }));
const todayCtx = { window: { FC_ACADEMY_OCCURRENCES: r }, localStorage: todayStorage, document: { createElement: () => ({}), head: { appendChild() {} }, documentElement: { classList: { contains: () => false } } }, fetch: async (url, options) => {
  if (url === '/api/today') { uploads.push(JSON.parse(options.body)); return { ok: true }; }
  return { ok: true, json: async () => ({ meals: [], schedule: [{ date: '2026-10-17', title: '중간고사' }] }) };
}, console };
vm.createContext(todayCtx); vm.runInContext(read('dist/today-view.js'), todayCtx);
const tv = todayCtx.window.TodayView;
todayStorage.setItem('fc_planner_v1', JSON.stringify({ share: { flow: true, exams: true }, pri: { new: { due: '2026-10-17' }, old: { due: '2026-10-15' } } }));
await tv.loadSchool();
let d = tv.collect('2026-10-16', { parent: true });
assert.equal(d.academies[0].start, '18:00');
assert.equal(d.academies.length, 1);
assert.equal(d.academyHw.length, 1);
assert.equal(d.deadlines[0].title, '지난 과제');
assert.equal(d.deadlines[0].dday, -1);
assert.equal(d.deadlines.filter(x => x.kind === '할 일').length, 2);
assert.match(tv.render(d, { parent: true }), /보호자 보기/);
assert.match(tv.render(d, { parent: true }), /1일 지남/);
assert.doesNotMatch(tv.render(d, { parent: true }), /<(button|input)\b/);
todayStorage.setItem('fc_planner_v1', JSON.stringify({ share: { flow: false, exams: false }, pri: { new: { due: '2026-10-17' } }, examDays: { '2026-10-17': ['영어'] } }));
d = tv.collect('2026-10-16', { shared: true });
assert.equal(d.tasks.length, 0); assert.equal(d.deadlines.length, 0); assert.equal(d.redo.length, 0); assert.equal(d.review.length, 0); assert.equal(d.prep.items.length, 0); assert.equal(d.academyHw.length, 0);
assert.equal(d.academies[0].progress, '');
assert.equal(d.academies[0].homework, '');
assert.equal(d.events.length, 0);
assert.equal(d.periods.length, 1, 'school and academy schedules remain visible');
assert.doesNotMatch(tv.render(d, { parent: true }), /영어|문제 풀기|지난 과제|문제 3개/);
assert.equal(tv.collect('2026-10-16').tasks.length, 2, 'the student local view is independent of sharing flags');
assert.equal(tv.collect('2026-10-16').deadlines.filter(x => x.kind === '할 일').length, 1);
await tv.sync();
assert.equal(uploads.length, 1);
assert.equal(uploads[0].data.tasks.length, 0);
assert.equal(uploads[0].data.deadlines.length, 0);

// Test the actual exported push-plan body; never load or call its notification sender.
const pushSource = read('netlify/functions/push-cron.mjs').replace(/^import .*;\n/gm, '').split('export default async')[0].replace('export function plan', 'function plan');
const pushCtx = vm.createContext({ FC_ACADEMY_OCCURRENCES: r }); vm.runInContext(pushSource + ';this.pushPlan=plan;', pushCtx);
const serverData = { fc_academy_v1: { v: JSON.stringify([academy]) }, [key]: { v: JSON.stringify([moved, future]) } };
const planned = (date, utcTime) => pushCtx.pushPlan(serverData, {}, Date.parse(date + 'T' + utcTime + ':00Z')).items.filter(x => x.kind === 'academy');
assert.equal(planned('2026-10-15', '08:00').length, 0);
assert.equal(planned('2026-10-16', '08:00').length, 1);
assert.equal(planned('2026-10-22', '08:00').length, 0);
assert.equal(planned('2026-10-28', '06:00').length, 1);
assert.match(planned('2026-10-28', '06:00')[0].title, /16:00/);
serverData[key].v = JSON.stringify([moved, record('future', '2026-10-22', { cancelled: true })]);
assert.equal(planned('2026-10-27', '08:00').length, 0);
assert.equal(planned('2026-10-28', '06:00').length, 0);

console.log('PASS: academy one/future schedules, moves, cancellations, inclusive boundaries, historical defaults, orphan/invalid records, no duplicate events, four timezones, actual form saves and rollback, side backup round trip/undo/old-backup compatibility, shared summary flags/task deadlines, and server pre-class notification plans (no sends).');
