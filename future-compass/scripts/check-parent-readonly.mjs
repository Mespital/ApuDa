// Execute the real app scripts with storage, role events and a fixed clock.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, 'dist', name), 'utf8');
const day = '2026-10-13';
const epoch = Date.parse(day + 'T12:00:00Z');
const coreKey = 'compass-study-v1', plannerKey = 'fc_planner_v1';

function node() {
  return {
    innerHTML: '', textContent: '', style: {}, dataset: {}, children: [],
    classList: { contains: () => false, toggle() {}, add() {}, remove() {} },
    querySelector: () => null, querySelectorAll: () => [],
    insertAdjacentHTML(position, html) {
      this.innerHTML = position === 'afterbegin' ? html + this.innerHTML : this.innerHTML + html;
    },
    setAttribute() {}, appendChild() {}, remove() {}, addEventListener() {}
  };
}

function fixture({ role = 'parent', share, timerEnd = 0, boost = true } = {}) {
  let currentRole = role;
  const core = {
    table: Array.from({ length: 5 }, () => ['수학', '', '', '', '', '', '']),
    bags: Array(5).fill('학교 준비물'),
    tasks: [
      { id: 'task-done', title: 'private-done-task', date: day, done: true },
      { id: 'task-missing', title: 'private-open-task', date: day, done: false }
    ],
    dates: [
      { id: 'exam', title: 'private-exam-title', date: '2026-10-16', kind: '시험', subject: '수학', done: false },
      { id: 'due', title: 'private-deadline-title', date: '2026-10-14', kind: '과제', subject: '영어', done: false }
    ],
    reviews: [{ id: 'review', title: 'private-review-title', date: '2026-10-12', subject: '수학', done: false }],
    timer: { duration: 1500, remaining: 53, end: timerEnd }, sessions: { [day]: 2 }
  };
  const planner = {
    pri: { 'task-done': { p: 'A', st: '', min: 0, due: '2026-10-18' } },
    focus: [{ date: day, at: epoch - 3600000, min: 47, subject: '수학' }],
    days: { [day]: { good: 'private-reflection-text', a1: 'private-tomorrow-text' } },
    weeks: { '2026-10-12': { rocks: [{ id: 'rock', title: 'private-week-rock', st: 'done' }] } },
    again: { review: ['2026-10-10', '2026-10-11', '2026-10-12'] },
    dmeta: { exam: { p1: 20, p2: 80, prog: 43 } },
    examDays: { '2026-10-15': ['private-exam-subject'] },
    examPrep: { '2026-10-15@private-exam-subject': 1 },
    wiz: { done: 1, skip: {} }
  };
  if (share !== undefined) planner.share = share;
  const store = new Map([
    [coreKey, JSON.stringify(core)], [plannerKey, JSON.stringify(planner)],
    ['fc_notes_v1', JSON.stringify([{ id: 'note', date: day, subject: 'private-note-subject', text: 'private-note-text' }])],
    ['fc_kid_v1', JSON.stringify({ asks: [{ id: 'ask', at: epoch, msg: 'shared-child-message' }] })],
    ['fc_mom_v1', JSON.stringify({ items: [{ id: 'mom-item', title: 'parent-own-task', due: '2026-10-14', done: false }] })]
  ]);
  const writes = [], windowEvents = new Map(), documentEvents = new Map();
  const content = node(), nav = node(), notice = node(), clock = node(), progress = node();
  function add(map, type, listener) {
    const listeners = map.get(type) || []; listeners.push(listener); map.set(type, listeners);
  }
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [epoch])); }
    static now() { return epoch; }
  }
  class Event {
    constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
  }
  const document = {
    documentElement: { classList: { contains: () => false } },
    head: node(), body: node(), visibilityState: 'visible',
    getElementById: id => id === 'content' ? content : null,
    querySelector: selector => ({ '#content': content, 'nav.tabbar': nav, '#notice': notice, '#clock': clock, '#progress': progress }[selector] || null),
    querySelectorAll: () => [], createElement: node,
    addEventListener: (type, listener) => add(documentEvents, type, listener)
  };
  const context = {
    document, console, Date: FixedDate, Event, CustomEvent: Event,
    localStorage: {
      getItem: key => store.get(key) ?? null,
      setItem(key, value) { writes.push({ key, value: String(value) }); store.set(key, String(value)); },
      removeItem: key => store.delete(key)
    },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { hash: '', reload() {} },
    PinGate: { who: () => currentRole },
    FC_CAL: {
      onUpdate() {},
      offDay: () => null, nextSchoolDay: () => '2026-10-14',
      schoolEvents: date => date === '2026-10-15' ? ['학교시험-private-calendar'] : []
    },
    FC_ACADEMY: { forDay: () => [{ id: 'academy', name: 'academy-name', start: '18:00', end: '22:00', homework: 'private-academy-homework', progress: 'private-academy-progress', hwDone: false }] },
    FC_LIFE: { forDay: () => [{ title: 'family-life-event', icon: '📌', start: '16:00', end: '17:00', busy: true }] },
    FC_SCHOOL: { config: { periods: ['08:30'], classMinutes: 50 } },
    crypto: { randomUUID: () => 'generated-task-id' },
    setInterval() {}, setTimeout() { return 1; }, clearTimeout() {},
    addEventListener: (type, listener) => add(windowEvents, type, listener),
    dispatchEvent(event) { for (const listener of windowEvents.get(event.type) || []) listener(event); return true; },
    confirm: () => true, navigator: {},
    FamilySync: { pushNow() {} }, FC_PUSH: { notify() {} }
  };
  context.window = context;
  vm.createContext(context);
  for (const name of ['study.js', 'planner.js', 'parent-view.js', ...(boost ? ['study-boost.js'] : [])]) {
    vm.runInContext(read(name), context, { filename: name });
  }
  context.render();
  return {
    context, content, store, writes, windowEvents,
    run: code => vm.runInContext(code, context),
    toggle(next) { currentRole = next; context.dispatchEvent(new Event('pin-who')); },
    submit(form) {
      const event = { target: form, preventDefault() {} };
      for (const listener of documentEvents.get('submit') || []) listener(event);
    }
  };
}

// Defaults disclose the existing overview, while private written content remains hidden.
{
  const app = fixture();
  const share = JSON.parse(JSON.stringify(app.context.FC_PLANNER.get().share));
  assert.deepEqual(share, { flow: true, exams: true, review: false, questions: false, reflect: false, mission: false });
  for (const token of ['private-open-task', 'private-exam-title', 'private-deadline-title', 'private-academy-progress', 'private-note-subject', 'private-week-rock', '47분']) {
    assert.ok(app.content.innerHTML.includes(token), `default overview includes ${token}`);
  }
  for (const token of ['private-note-text', 'private-reflection-text', 'private-tomorrow-text']) {
    assert.ok(!app.content.innerHTML.includes(token), `written content remains private: ${token}`);
  }
  assert.equal(app.writes.length, 0, 'viewing does not persist normalized preferences');
  assert.equal(app.context.FC_PLANNER.get().pri['task-missing'], undefined, 'parent lookup does not create priority metadata');
}

// Hidden flags apply to counters, progress, support suggestions and the late-added exam card.
{
  const app = fixture({ share: { flow: false, exams: false }, timerEnd: epoch + 500000 });
  for (const token of ['private-open-task', 'private-done-task', 'private-exam-title', 'private-deadline-title', 'private-academy-homework', 'private-academy-progress', 'private-note-subject', 'private-week-rock', 'private-exam-subject', '학교시험-private-calendar', '47분', '복습할 조용한 시간', '지금 집중 중', 'id="bo-exam"']) {
    assert.ok(!app.content.innerHTML.includes(token), `hidden data is absent: ${token}`);
  }
  for (const token of ['academy-name', 'family-life-event', 'parent-own-task', 'shared-child-message', 'data-pv-add', 'data-pv-cheer-form', 'data-pv-coach']) {
    assert.ok(app.content.innerHTML.includes(token), `parent support remains available: ${token}`);
  }
  assert.equal(app.writes.length, 0);
  assert.equal(JSON.parse(app.store.get(plannerKey)).share.flow, false);
  assert.equal(JSON.parse(app.store.get(plannerKey)).share.exams, false);
}

// Grants remain independent: deadlines can be shared without revealing study progress,
// and an explicitly shared note/reflection remains available with flow hidden.
{
  const app = fixture({ share: { flow: false, exams: true, review: true, reflect: true } });
  assert.ok(app.content.innerHTML.includes('private-exam-title'));
  assert.ok(app.content.innerHTML.includes('범위 20~80쪽'));
  assert.ok(!app.content.innerHTML.includes('범위 24/61쪽'));
  assert.ok(!app.content.innerHTML.includes('시험 대비 1/1과목'));
  assert.ok(!app.content.innerHTML.includes('private-open-task'));
  assert.ok(!app.content.innerHTML.includes('private-academy-progress'));
  assert.ok(app.content.innerHTML.includes('private-note-text'));
  assert.ok(app.content.innerHTML.includes('private-reflection-text'));
  assert.equal(app.writes.length, 0);
}

// Switching profiles redraws the final render chain; parent renders do not tag new
// tasks/reviews, while child rendering retains its automatic planning behavior.
{
  const app = fixture({ role: 'child', share: { flow: false, exams: false } });
  assert.ok(app.content.innerHTML.includes('private-open-task'));
  app.toggle('parent');
  assert.ok(app.content.innerHTML.includes('승준이 오늘'));
  assert.ok(!app.content.innerHTML.includes('private-open-task'));
  assert.ok(!app.content.innerHTML.includes('data-check="tasks"'));
  app.run(`state.tasks.push({id:'new-task',title:'new-parent-task',date:today(),done:false});state.reviews.push({id:'new-review',title:'new-review',date:today()});render();`);
  assert.equal(app.context.FC_PLANNER.get().pri['new-task'], undefined);
  assert.equal(app.context.FC_PLANNER.get().again['new-review'], undefined);
  assert.equal(app.writes.length, 0);
  app.toggle('child');
  assert.ok(app.content.innerHTML.includes('new-parent-task'));
  assert.ok(app.content.innerHTML.includes('data-check="tasks"'));
  assert.ok(app.context.FC_PLANNER.get().pri['new-task']);
  assert.equal(app.context.FC_PLANNER.get().again['new-review'].length, 3);
  assert.equal(app.context.FC_PLANNER.get().pri['task-done'].due, '2026-10-18');
}

// Parent expiry leaves timer/core/planner untouched, including a directly delivered
// focus completion event. The same timer records once after switching to the child.
{
  const app = fixture({ timerEnd: epoch - 1000 });
  const coreBefore = app.run('JSON.stringify(state)'), plannerBefore = JSON.stringify(app.context.FC_PLANNER.get());
  app.run(`tick();tick();window.dispatchEvent(new CustomEvent('fc-focus-done',{detail:{min:25}}));render();`);
  assert.equal(app.run('JSON.stringify(state)'), coreBefore);
  assert.equal(JSON.stringify(app.context.FC_PLANNER.get()), plannerBefore);
  assert.equal(app.writes.length, 0);
  app.toggle('child');
  app.run('tick();tick();');
  assert.equal(app.run('state.sessions[today()]'), 3);
  assert.equal(app.run('state.timer.end'), 0);
  assert.equal(app.context.FC_PLANNER.get().focus.length, 2);
  assert.equal(app.context.FC_PLANNER.get().focus[1].min, 25);
  assert.equal(app.writes.filter(x => x.key === coreKey).length, 1);
  assert.equal(app.writes.filter(x => x.key === plannerKey).length, 1);
  app.toggle('parent');
  app.run('tick();');
  assert.equal(app.context.FC_PLANNER.get().focus.length, 2);
}

// A fresh child session still records an expired timer exactly once.
{
  const app = fixture({ role: 'child', timerEnd: epoch - 1000 });
  app.run('tick();tick();');
  assert.equal(app.run('state.sessions[today()]'), 3);
  assert.equal(app.context.FC_PLANNER.get().focus.length, 2);
  assert.equal(app.writes.filter(x => x.key === coreKey).length, 1);
  assert.equal(app.writes.filter(x => x.key === plannerKey).length, 1);
}

// Turning an existing task into tomorrow's A1 preserves the quick-add deadline
// and other metadata. Intentional settings saves remain available to the parent.
{
  const app = fixture({ role: 'child' });
  app.run(`state.tasks.push({id:'due-task',title:'keep-quick-add-due',date:today(),done:false});FC_PLANNER.get().pri['due-task']={p:'B',st:'',min:5,est:40,due:'2026-10-20'};`);
  app.submit({
    dataset: {}, matches: selector => selector === '[data-pl-close]',
    elements: { good: { value: 'done' }, change: { value: '' }, a1: { value: 'keep-quick-add-due' } }
  });
  assert.equal(app.context.FC_PLANNER.get().pri['due-task'].due, '2026-10-20');
  assert.equal(app.context.FC_PLANNER.get().pri['due-task'].est, 40);
  assert.equal(app.context.FC_PLANNER.get().pri['due-task'].p, 'A');
  app.toggle('parent');
  const elements = { mission: { value: 'intentional-parent-settings' } };
  for (let i = 0; i < 3; i++) elements['g' + i + 'title'] = { value: '' };
  for (const name of ['flow', 'exams', 'review', 'questions', 'reflect', 'mission']) elements['sh_' + name] = { checked: name === 'flow' || name === 'exams' };
  app.submit({ dataset: {}, matches: selector => selector === '[data-pl-set]', elements });
  assert.equal(JSON.parse(app.store.get(plannerKey)).mission, 'intentional-parent-settings');
}

console.log('PASS: parent sharing flags, preserved support/settings, role redraws, read-only metadata/timer/focus events, child completion once, and quick-add deadline preservation');
