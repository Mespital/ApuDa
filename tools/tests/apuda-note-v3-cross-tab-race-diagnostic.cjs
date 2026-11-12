/*
 * ApuDa V3 late cross-tab race diagnostic.
 * ALL records and storage below are synthetic and held only in a JS Map.
 * This script does not open localStorage, use a network, or touch patient data.
 * A reproduced risk is intentionally reported, not asserted as a desired API contract.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

const KEY = 'synthetic/note/cross-tab-race';
const context = {crypto: webcrypto, TextEncoder};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../../public-site/note/note-storage.js'), 'utf8'), context);
const api = context.ApuDaNoteStorage;
const fixture = label => ({profile: {name: label, cancer: '합성 데이터'}, logs: [], meds: [], questions: []});
const rawBefore = JSON.stringify(fixture('복구 전'));
const rawImport = JSON.stringify(fixture('파일 복원 대상'));
const rawOtherTab = JSON.stringify(fixture('다른 탭의 새 변경'));

class MemoryStorage {
  constructor() {this.map = new Map([[KEY, rawBefore]]); this.beforeSet = null;}
  getItem(key) {return this.map.has(key) ? this.map.get(key) : null;}
  setItem(key, value) {
    if (this.beforeSet) this.beforeSet(key);
    this.map.set(key, String(value));
  }
  removeItem(key) {this.map.delete(key);}
}

async function examine(label, operation) {
  const storage = new MemoryStorage();
  if (label === 'recover') await api.replace(storage, KEY, fixture('파일 복원 대상'));
  let injected = false;
  storage.beforeSet = key => {
    if (key !== KEY || injected) return;
    injected = true;
    // An independent tab's write lands after the final read and immediately
    // before the operation's write. A Map hook simulates this interleaving.
    storage.map.set(KEY, rawOtherTab);
  };
  let error = null;
  try {await operation(storage);} catch (e) {error = e.message;}
  const finalRaw = storage.getItem(KEY);
  const lostOtherTab = injected && finalRaw !== rawOtherTab;
  return {operation: label, injected, lostOtherTab, error, checkpointPreserved: storage.getItem(api.recoveryKey(KEY)) !== null};
}

(async () => {
  const results = [
    await examine('replace', storage => api.replace(storage, KEY, fixture('파일 복원 대상'))),
    await examine('recover', storage => api.recover(storage, KEY))
  ];
  for (const result of results) {
    console.log(`${result.lostOtherTab ? 'RISK_REPRODUCED' : 'RISK_NOT_REPRODUCED'} ${JSON.stringify(result)}`);
  }
  if (results.some(r => r.lostOtherTab)) {
    console.log('REVIEW_GATE: concurrent write may be overwritten in a controlled late-interleaving; isolate until atomic-write architecture / coordinated-writer protocol is verified.');
  }
})().catch(e => {console.error(e); process.exitCode = 1;});
