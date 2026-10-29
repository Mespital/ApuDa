// 실제 일정 이관, 날짜별 조회, 가족 첫 받기 대기, 저장 실패와 알림 계획을 검증한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dist = new URL('../dist/', import.meta.url), read = f => fs.readFileSync(new URL(f, dist), 'utf8');
const A = 'fc_academy_v1', L = 'fc_life_v1', F = 'fc-schedule-20261026';
const old = [
  { id: 'seed-kor', name: '송림 국어 (채리)', subject: '국어', days: [3], start: '16:00', end: '19:00', from: '2026-10-21', progress: '독서', homework: '지문 요약' },
  { id: 'seed-math', name: '다원교육 대치', subject: '수학', days: [2, 4], start: '18:00', end: '22:00', from: '2026-10-15', book: '수학 교재' },
  { id: 'seed-eng', name: '송림본원 (반포)', subject: '영어', days: [0], start: '09:30', end: '13:00', from: '2026-10-25', addr: '이전 영어 학원 주소', tel: '02-1111-2222', lat: 37.5, lng: 127, note: '이전 강의실', book: '영어 교재', progress: '3과', homework: '단어', hwDone: true },
  { id: 'seed-sci', name: '탑클래스 서초', subject: '과학', days: [6], start: '19:00', end: '22:00', from: '2026-10-17', homework: '과학 메모' }
];
const oldLife = { custom: '보존', items: [{ id: 'seed-pt', title: 'PT', days: [5], start: '18:00', end: '19:00' }, { id: 'meal', title: '저녁', days: [0, 1, 2, 3, 4, 5, 6], start: '18:30', end: '19:00' }] };
function node() { return { innerHTML: '', textContent: '', style: {}, dataset: {}, children: [], classList: { toggle() {}, contains: () => false }, querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, appendChild() {}, insertAdjacentHTML() {}, remove() {} }; }
function fixture({ fresh = false, locked = false, waiting = false } = {}) {
  const store = new Map(), writes = [], events = {}, timers = [], content = node();
  let fail = '', release, pushes = 0, renders = 0;
  if (!fresh) { store.set(A, JSON.stringify(old)); store.set(L, JSON.stringify(oldLife)); }
  const core = { table: Array.from({ length: 5 }, () => []), tasks: [], dates: [], reviews: [], bags: [] };
  store.set('compass-study-v1', JSON.stringify(core));
  const ready = waiting ? new Promise(r => { release = r; }) : Promise.resolve();
  const c = { console, Date, Set, Event: class { constructor(type) { this.type = type; } }, state: core, tab: 'today', today: () => '2026-10-26', valid: d => /^\d{4}-\d\d-\d\d$/.test(d), esc: s => String(s || '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x])),
    location: { hash: '#today' }, PinGate: { who: () => 'child' }, navigator: {}, render() { renders++; },
    localStorage: { getItem: k => store.get(k) ?? null, setItem(k, v) { if (k === fail) { fail = ''; throw Error('quota'); } writes.push(k); store.set(k, String(v)); }, removeItem: k => store.delete(k) },
    FamilySync: { ready: () => ready, pushNow() { pushes++; return Promise.resolve(); } },
    setTimeout(fn, ms) { timers.push({ fn, ms }); }, setInterval() {}, clearTimeout() {}, addEventListener(k, fn) { (events[k] ||= []).push(fn); }, dispatchEvent() {}, scrollTo() {},
    document: { documentElement: { classList: { contains: () => locked } }, body: node(), head: node(), createElement: node, getElementById: k => k === 'content' ? content : null, querySelector: () => null, querySelectorAll: () => [], addEventListener(k, fn) { (events[k] ||= []).push(fn); } } };
  c.window = c; vm.createContext(c);
  for (const f of ['academy-occurrences.js', 'academy.js', 'study-log.js', 'today-view.js', 'app-ui.js', 'schedule-update.js']) vm.runInContext(read(f), c, { filename: f });
  return { c, store, writes, events, timers, content, api: c.FC_SCHEDULE_UPDATE, failOnce: key => { fail = key; }, release, pushes: () => pushes, renders: () => renders };
}
const app = fixture();
app.store.set('fc_academy_occurrences_v1', JSON.stringify([{id:'seed-math@future@2026-10-26',academyId:'seed-math',scope:'future',date:'2026-10-26',days:[0],start:'15:00',end:'17:00',updatedAt:1},{id:'seed-math@one@2026-10-27',academyId:'seed-math',scope:'one',date:'2026-10-27',moveTo:'2026-10-27',start:'17:00',end:'20:00',updatedAt:1}]));
assert.deepEqual({ ...app.api.apply() }, { ok: true, changed: true });
const list = app.c.FC_ACADEMY.list(), live = list.filter(x => !x.until), ids = rows => Array.from(rows, x => x.id);
assert.equal(live.length, 4);
assert.deepEqual(ids(app.c.FC_ACADEMY.forDay('2026-10-26')), ['seed-eng-saeum']);
assert.deepEqual(ids(app.c.FC_ACADEMY.forDay('2026-10-27')), ['seed-math-20261026']);
assert.deepEqual(ids(app.c.FC_ACADEMY.forDay('2026-10-28')), ['seed-kor-20261026']);
assert.deepEqual(ids(app.c.FC_ACADEMY.forDay('2026-10-29')), ['seed-math-20261026']);
assert.equal(app.c.FC_ACADEMY.forDay('2026-10-30').length, 0);
assert.deepEqual(ids(app.c.FC_ACADEMY.forDay('2026-10-31')), ['seed-kor-clinic']);
assert.equal(app.c.FC_ACADEMY.forDay('2026-11-01').length, 0);
assert.equal(app.c.FC_ACADEMY.forDay('2026-10-14').length, 0);
assert.equal(app.c.FC_ACADEMY.forDay('2026-10-15')[0].id, 'seed-math');
assert.equal(app.c.FC_ACADEMY.forDay('2026-10-21')[0].id, 'seed-kor');
assert.equal(app.c.FC_ACADEMY.forDay('2026-10-24')[0].id, 'seed-sci', 'past science remains available');
assert.equal(app.c.FC_ACADEMY.forDay('2026-10-25')[0].id, 'seed-eng', 'past Sunday English remains available');
const english = live.find(x => x.id === 'seed-eng-saeum'), clinic = live.find(x => x.id === 'seed-kor-clinic');
assert.equal(english.name, '반포새움'); assert.equal(english.start, '18:00'); assert.equal(english.end, '22:00');
assert.equal(english.progress, ''); assert.equal(english.homework, '');
assert.equal(list.find(x => x.id === 'seed-eng').progress, '3과'); assert.equal(list.find(x => x.id === 'seed-eng').homework, '단어');
assert.equal(english.addr, ''); assert.equal(english.tel, ''); assert.equal(english.lat, null); assert.equal(english.note, '');
assert.equal(clinic.end, ''); assert.match(app.c.FC_ACADEMY.when(clinic), /종료 시간 미정/);
assert.equal(live.find(x => x.id === 'seed-kor-20261026').homework, '지문 요약');
assert.match(app.c.FC_ACADEMY.panel(), /이전 학원 일정 기록 \(4개\)/);
const pt = app.c.FC_LIFE.forDay('2026-10-30').find(x => x.title === 'PT');
assert.equal(pt.start, '18:00'); assert.equal(pt.end, ''); assert.equal(pt.busy, false);
assert.equal(app.c.FC_LIFE.forDay('2026-10-23').find(x => x.title === 'PT').end, '19:00');
assert.equal(app.c.FC_LIFE.forDay('2026-10-30').filter(x => x.title === 'PT').length, 1);
assert.equal(JSON.parse(app.store.get(L)).custom, '보존');
assert.match(app.c.TodayView.render(app.c.TodayView.collect('2026-10-30')), /PT/);
assert.match(app.c.TodayView.render(app.c.TodayView.collect('2026-10-31')), /송림 국어 클리닉/);
assert.ok(!app.c.TodayView.collect('2026-10-31').academies.some(x => x.name.includes('탑클래스')));
assert.match(app.c.FC_WEEK.items('2026-10-31').find(x => x.k === 'ac').sub, /종료 시간 미정/);
assert.match(app.c.FC_WEEK.items('2026-10-30').find(x => x.k === 'lf' && x.title.includes('PT')).sub, /종료 시간 미정/);
const backup = JSON.parse(app.store.get(F + '-before'));
assert.deepEqual(JSON.parse(backup.academy), old); assert.deepEqual(JSON.parse(backup.life), oldLife);
const writes = app.writes.length; assert.equal(app.api.apply().changed, false); assert.equal(app.writes.length, writes);
// A newly joined device sees collection revisions from family sync and never resets later manual edits.
const edited = JSON.parse(app.store.get(A)); edited.find(x => x.id === 'seed-eng-saeum').end = '21:00';
app.store.set(A, JSON.stringify(edited)); app.store.delete(F);
assert.equal(app.api.apply().changed, false); assert.equal(app.c.FC_ACADEMY.forDay('2026-10-26')[0].end, '21:00');
assert.equal(app.store.get(F + '-before'), JSON.stringify(backup));
// Single-occurrence overrides cannot revive an ended series after the cut-off.
const resolver = app.c.FC_ACADEMY_OCCURRENCES, science = list.find(x => x.id === 'seed-sci');
const exception = resolver.cleanRecord({ academyId: science.id, scope: 'one', date: '2026-10-24', moveTo: '2026-10-31', start: '17:00', end: '19:00', updatedAt: 1 });
assert.equal(resolver.forDay([science], [exception], '2026-10-31').length, 0);
assert.equal(resolver.scheduleFor(science, [], '2026-10-31').isOccurrence, false);
assert.equal(resolver.nextDate(science, [], '2026-10-26'), '');
// Quota errors keep both stores and the completion flag unchanged; retry uses the original backup.
for (const key of [F + '-before', A, L, F]) {
  const f = fixture(), a = f.store.get(A), l = f.store.get(L); f.failOnce(key);
  assert.equal(f.api.apply().ok, false, 'failure on ' + key);
  assert.equal(f.store.get(A), a); assert.equal(f.store.get(L), l); assert.ok(!f.store.has(F));
  assert.equal(f.api.apply().ok, true); assert.equal(f.c.FC_ACADEMY.forDay('2026-10-26')[0].name, '반포새움');
}
const invalid = fixture(); invalid.store.set(A, '{broken'); assert.equal(invalid.api.apply().ok, false); assert.equal(invalid.store.get(A), '{broken');
const locked = fixture({ locked: true }); assert.equal(locked.api.apply().locked, true); assert.equal(locked.writes.length, 0);
const fresh = fixture({ fresh: true }); assert.equal(fresh.api.apply().ok, true); assert.equal(fresh.c.FC_ACADEMY.list().length, 4);
fresh.timers.find(x => x.ms === 3500).fn();
assert.equal(fresh.c.FC_ACADEMY.list().length, 4, 'legacy defaults never revive superseded schedules on a newly synced device');
assert.equal(fresh.c.FC_ACADEMY.forDay('2026-11-01').length, 0);
const delayed = fixture({ waiting: true }); delayed.api.run();
await Promise.resolve(); assert.ok(!delayed.store.has(F)); assert.equal(delayed.pushes(), 0);
const incoming = JSON.parse(delayed.store.get(A)); incoming[2].progress = '서버 최신 진도'; delayed.store.set(A, JSON.stringify(incoming)); delayed.release();
for (let i = 0; i < 8; i++) await Promise.resolve();
assert.equal(delayed.c.FC_ACADEMY.list().find(x => x.id === 'seed-eng').progress, '서버 최신 진도'); assert.equal(delayed.pushes(), 1);
// Another tab may have completed the shared local migration; redraw without another push.
const otherTab = fixture(); otherTab.api.apply(); const priorRenders = otherTab.renders(); otherTab.api.run();
for (let i = 0; i < 8; i++) await Promise.resolve();
assert.ok(otherTab.renders() > priorRenders); assert.equal(otherTab.pushes(), 0);
// The actual server pre-class planner consumes the same ended-series filter. No notification is sent.
const cron = fs.readFileSync(new URL('../netlify/functions/push-cron.mjs', import.meta.url), 'utf8');
const code = cron.slice(cron.indexOf('const pj ='), cron.indexOf('\nexport default')).replaceAll('export ', '');
const server = { console, globalThis: { FC_ACADEMY_OCCURRENCES: resolver } }; vm.createContext(server); vm.runInContext(code + '\nthis.testPlan = plan;', server);
const data = { [A]: { v: JSON.stringify(list) } };
const at = (date, time) => server.testPlan(data, { schedule: [], closures: [] }, Date.parse(date + 'T' + time + ':00+09:00'), null, {}).items.filter(x => x.kind === 'academy');
assert.ok(at('2026-10-26', '17:00').some(x => x.title.includes('반포새움')));
assert.ok(!at('2026-11-01', '08:30').some(x => x.title.includes('송림')));
assert.ok(at('2026-10-31', '18:00').some(x => x.title.includes('클리닉')));
assert.ok(!at('2026-10-31', '18:00').some(x => x.title.includes('탑클래스')));
for (const file of ['study.html', 'today.html']) assert.ok(read(file).includes('src="schedule-update.js"'));
console.log('PASS: 2026-10-26 full replacement, exact weekdays/start dates, preserved history/homework, no stale English address, unknown end times, existing/fresh/synced devices, once-only/manual-edit protection, rollback/retry, locked guard, awaited family pull, Today/week/life and server pre-class plans.');
