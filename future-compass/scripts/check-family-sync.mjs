// 가족 동기화: 두 기기가 동시에(오프라인 포함) 고쳐도 서로 지우지 않는지 확인
import vm from 'node:vm'; import fs from 'node:fs'; import path from 'node:path'; import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fsrc = fs.readFileSync(path.join(root, 'netlify/functions/family.mjs'),'utf8');
const KEYS = ['compass-study-v1'], MAX_VALUE = 400000;
const mergeData = new Function('KEYS','MAX_VALUE', fsrc.slice(fsrc.indexOf('export function mergeData')).split('\nconst size')[0].replace('export ','') + '; return mergeData;')(KEYS, MAX_VALUE);
const src = fs.readFileSync(path.join(root, 'dist/family-sync.js'),'utf8');
let server = {}, online = true, clock = 1000;
function mkDevice(id) {
  const store = new Map([['fc-device-id', id], ['fc-family-v1', JSON.stringify({ token: 'x'.repeat(48) })]]);
  const ls = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const win = { localStorage: ls, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { documentElement: { classList: { contains: () => true } }, addEventListener() {}, createElement: () => ({ setAttribute() {}, appendChild() {}, remove() {} }), body: { appendChild() {} }, visibilityState: 'visible' },
    addEventListener() {}, setInterval() {}, setTimeout() {}, location: { reload() {} }, Date: { now: () => clock }, JSON, Math, Promise, Object, Array, String, Number,
    fetch: async (u, o) => { if (!online) throw new Error('off'); const b = JSON.parse(o.body); clock += 10;
      let r; if (b.action === 'push') { const m = mergeData(server, b.changes, clock); server = m.data; r = { applied: m.applied, conflicts: m.conflicts, ts: m.ts }; } else r = { data: server };
      return { ok: true, status: 200, json: async () => r }; } };
  win.window = win; vm.createContext(win);
  vm.runInContext('var localStorage=window.localStorage,sessionStorage=window.sessionStorage,document=window.document,fetch=window.fetch,location=window.location;' + src.replace('(window);', '(window);').replace(/Date\.now\(\)/g, 'window.Date.now()'), win);
  return { ls, FS: win.FamilySync };
}
const K = 'compass-study-v1';
const A = mkDevice('kidAAAAA'), B = mkDevice('momBBBBB');
A.ls.setItem(K, JSON.stringify({ tasks: [{ id: 't1', title: 'a' }] })); clock += 100; await A.FS.pushNow();
await B.FS.pullNow(); assert.equal(B.ls.getItem(K), A.ls.getItem(K));
// both edit offline
online = false;
A.ls.setItem(K, JSON.stringify({ tasks: [{ id: 't1', title: 'a', done: true }, { id: 't2', title: 'kid new' }] })); clock += 100; await A.FS.pushNow().catch(()=>{});
B.ls.setItem(K, JSON.stringify({ tasks: [{ id: 't1', title: 'a' }, { id: 't3', title: 'mom new' }] }));
online = true; clock += 100;
await B.FS.pushNow();
await A.FS.pushNow(); assert.deepEqual(JSON.parse(server[K].v).tasks.map(t => t.id), ['t1', 't2', 't3']); assert.equal(JSON.parse(server[K].v).tasks[0].done, true);
await B.FS.pullNow(); assert.equal(B.ls.getItem(K), server[K].v);
// pull-first case: A edits while offline, B pushes, A pulls before pushing
online=false; A.ls.setItem(K, JSON.stringify({ ...JSON.parse(A.ls.getItem(K)), tasks: [...JSON.parse(A.ls.getItem(K)).tasks, { id: 't4', title: 'kid2' }] })); await A.FS.pushNow().catch(()=>{}); online=true;
B.ls.setItem(K, JSON.stringify({ ...JSON.parse(B.ls.getItem(K)), tasks: [...JSON.parse(B.ls.getItem(K)).tasks, { id: 't5', title: 'mom2' }] })); clock+=50; await B.FS.pushNow();
await A.FS.pullNow(); await A.FS.pushNow(); await B.FS.pullNow();
for (const v of [A.ls.getItem(K), B.ls.getItem(K), server[K].v]) assert.equal(JSON.parse(v).tasks.map(t => t.id).join(','), 't1,t2,t3,t4,t5');
console.log('family sync merge ok');
