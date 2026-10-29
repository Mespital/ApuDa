// Exercise the real core/planner/week renderer and the final Today renderer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
const dist = new URL('../dist/', import.meta.url);
const read = f => fs.readFileSync(new URL(f, dist), 'utf8');
let epoch = Date.parse('2026-10-23T16:00:00Z'), role = 'child';
const day = '2026-10-24', events = {}, timers = [], storage = new Map(), selectedWeeks = [];
function node() { return { innerHTML: '', style: {}, dataset: {}, textContent: '', children: [], classList: { toggle() {}, contains: () => false, add() {}, remove() {} },
  querySelector: () => null, querySelectorAll: () => [], appendChild() {}, prepend() {}, setAttribute() {}, remove() {}, addEventListener() {}, insertAdjacentElement() {},
  insertAdjacentHTML(pos, html) { this.innerHTML += html; } }; }
const content = node();
const core = { table: Array.from({ length: 5 }, () => ['수학', '영어']), bags: Array(5).fill(''),
  tasks: [
    ...['A', 'B', 'C', 'D'].map((x, i) => ({ id: x, title: '오늘 작업 ' + x, date: day, done: false, subject: '수학' })),
    { id: 'done', title: '오늘 완료', date: day, done: true },
    { id: 'old', title: '오늘 제출해야 할 이전 계획', date: '2026-10-23', done: false },
    { id: 'backlog', title: '어제 미완료', date: '2026-10-23', done: false },
    { id: 'future', title: '내일 할 일', date: '2026-10-25', done: false },
    { id: 'no', title: '오늘 안 할 일', date: day, done: false }],
  dates: [{ id: 'due', title: '오늘 제출', kind: '과제', date: day, done: false }, { id: 'ex', title: '미래 시험', kind: '시험', date: '2026-11-01', done: false }],
  reviews: [
    { id: 'r', title: '오늘 복습할 개념', date: '2026-10-23', done: false },
    { id: 'r2', title: '내일 복습할 개념', date: day, done: false },
    { id: 'r3', title: '지난 복습', date: '2026-10-22', done: false },
    { id: 'r4', title: '끝낸 복습', date: day, done: true }], timer: { duration: 1500, remaining: 1500, end: 0 }, sessions: {} };
storage.set('compass-study-v1', JSON.stringify(core));
storage.set('fc_planner_v1', JSON.stringify({ pri: { A: { p: 'B' }, B: { p: 'A' }, C: { p: 'C' }, D: { p: 'B', due: '2026-11-01' }, old: { due: day }, no: { st: 'no' } },
  again: { r: [day, day], r2: ['2026-10-25'], r3: ['2026-10-23'], r4: [day] }, wiz: { done: 1 }, share: { flow: true, exams: true, review: false } }));
class FixedDate extends Date { constructor(...a) { super(...(a.length ? a : [epoch])); } static now() { return epoch; } }
const doc = { head: node(), body: node(), getElementById: id => id === 'content' ? content : null,
  querySelector: s => s === '#content' ? content : node(), querySelectorAll: () => [], createElement: node,
  addEventListener(k, f) { (events[k] ||= []).push(f); } };
const c = { document: doc, console, Date: FixedDate, crypto: { randomUUID }, location: { hash: '#today' }, history: { replaceState(a, b, hash) { c.location.hash = hash; } },
  PinGate: { who: () => role }, navigator: {}, Event: class { constructor(type) { this.type = type; } },
  FC_CAL: { offDay: d => d === '2026-10-26' ? { name: '학교 휴업일' } : [0, 6].includes(new Date(d + 'T12:00Z').getUTCDay()) ? { weekend: true } : null, schoolEvents: d => d === day ? ['학교 행사', '비공개 시험 행사'] : [] },
  FC_SCHOOL: { config: { periods: ['08:20', '09:20'], classMinutes: 50 } },
  FC_STUDY_WEEK: { select: d => selectedWeeks.push(d) },
  FC_ACADEMY: { forDay: d => d === day ? [{ id: 'a', name: '오늘 학원', start: '17:00', end: '18:00', homework: '비공개 숙제' }] : [] }, FC_LIFE: { forDay: () => [] },
  localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) }, sessionStorage: { getItem: () => null, setItem() {} },
  setTimeout: fn => { timers.push(fn); }, clearTimeout() {}, setInterval() {}, addEventListener() {}, scrollTo() {}, dispatchEvent() {} };
c.window = c; vm.createContext(c);
for (const f of ['study.js', 'planner.js', 'app-ui.js', 'today-focus.js']) vm.runInContext(read(f), c, { filename: f });
const run = s => vm.runInContext(s, c), api = c.FC_TODAY_FOCUS;
const ids = list => Array.from(list, x => x.id);
assert.equal(run('today()'), day, 'Korean date across the UTC boundary');
assert.deepEqual(ids(api.model().left), ['B', 'A', 'D', 'C']);
assert.deepEqual(ids(api.model().due), ['r'], 'only today schedules, unique notes, no completed/future/old review');
assert.match(content.innerHTML, /data-tn-open="talk"/);
assert.match(content.innerHTML, /data-tn-open="photo"/);
assert.doesNotMatch(content.innerHTML, /어제 미완료|내일 할 일|미래 시험|오늘 안 할 일|내일 복습할 개념/);
assert.match(content.innerHTML, /오늘 마감/);
assert.equal((content.innerHTML.split('<details')[0].match(/data-check="tasks"/g) || []).length, 3);
const before = JSON.stringify([...storage]); api.model(); api.model();
assert.equal(JSON.stringify([...storage]), before, 'collecting the focused view does not mutate storage');
function fire(k, target) { for (const fn of events[k] || []) fn({ target, preventDefault() {} }); }
fire('change', { dataset: { check: 'tasks', id: 'B' }, checked: true, matches: () => false });
assert.equal(JSON.parse(storage.get('compass-study-v1')).tasks.find(x => x.id === 'B').done, true);
assert.ok(!ids(api.model().left).includes('B'));
run("FC_PLANNER.get().againDone['r@2026-10-24']=1");
assert.equal(api.model().due.length, 0);
// Calendar weeks, including Sunday/Monday and a year boundary (not today + 7).
for (const [date, next] of [['2026-10-24','2026-10-26'],['2026-10-25','2026-10-26'],['2026-10-26','2026-11-02'],['2026-12-31','2027-01-04']]) assert.equal(api.nextMonday(date), next);
assert.equal(c.FC_WEEK.open('2026-02-30'), false);
assert.equal(c.FC_WEEK.open('2026-10-26'), true);
assert.equal(c.location.hash, 'week');
assert.equal(selectedWeeks.at(-1), '2026-10-26');
run('render()');
const selections = selectedWeeks.length;
run('render()');
assert.equal(selectedWeeks.length, selections, 'a redraw does not reset independent weekly-plan navigation');
assert.ok(c.FC_WEEK.items('2026-10-26').some(x => x.title.includes('학교 휴업일')));
assert.ok(!c.FC_WEEK.items('2026-10-26').some(x => x.k === 'cls'));
assert.ok(!c.FC_WEEK.items('2026-10-24').some(x => x.k === 'cls'), 'no classes on a weekend');
assert.ok(!c.FC_WEEK.items(day, { exams: false, flow: false }).some(x => x.k === 'ex' || x.k === 'tk'));
role = 'parent'; run('FC_PLANNER.get().share={flow:false,exams:false,review:false};tab="today";render()');
assert.equal(api.model().tasks.length, 0); assert.equal(api.model().due.length, 0);
assert.doesNotMatch(content.innerHTML, /오늘 작업|오늘 제출|비공개 시험 행사|비공개 숙제|data-check|data-pl-play|data-as-add|data-tn-open|data-rc-open/);
assert.match(content.innerHTML, /오늘 학원/);
assert.match(content.innerHTML, /가족 공유·엄마 체크/);
assert.ok(!c.FC_WEEK.items(day).some(x => x.k === 'ex' || x.k === 'tk'));
run("FC_PLANNER.get().share.review=true;FC_PLANNER.get().againDone={}");
assert.equal(api.model().due.length, 1, 'explicit review sharing remains independent of flow');
role = 'child'; run('tab="today";state.tasks[0].title="<img src=x onerror=1>";render()');
assert.match(content.innerHTML, /&lt;img/); assert.doesNotMatch(content.innerHTML, /<img src=x/);
epoch = Date.parse('2026-10-24T16:00:00Z');
assert.equal(api.model().date, '2026-10-25'); assert.deepEqual(ids(api.model().left), ['future']);
run('tab="family";render()'); assert.equal(c.location.hash, '#today', 'child profile cannot keep the parent-only route');
const html = read('study.html');
assert.ok(html.indexOf('today-focus.js') > html.indexOf('tablet.js'));
assert.ok(html.includes('today-focus.css'));
console.log('PASS: focused Today exact-day tasks/reviews/deadlines, three-row limit, persisted completion, readonly collection, KST rollover, calendar next-week navigation, holiday/weekend, parent privacy and escaped content.');
