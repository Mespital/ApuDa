/**
 * ApuDa Memory Phase 9 - isolated QA IndexedDB migration prototype.
 * Never imports into the live UI, never reads or mutates localStorage.
 * Only explicitly named apuda-memory-qa-* databases are allowed.
 */
import {planIndexedDbMigration} from './secure-archive.mjs';

const qaName = name => typeof name === 'string' &&
  /^apuda-memory-qa-[a-z0-9-]{4,70}$/.test(name);
const canonical = record => JSON.stringify(record, Object.keys(record).sort());
const identical = (a,b) => a && b && canonical(a) === canonical(b);

export function openQaDatabase(factory,name) {
  if (!qaName(name)) throw new Error('QA 전용 데이터베이스 이름만 허용됩니다.');
  if (!factory || typeof factory.open !== 'function')
    throw new Error('IndexedDB를 지원하지 않는 환경입니다.');
  return new Promise((resolve,reject)=>{
    const request=factory.open(name,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if (!db.objectStoreNames.contains('records')) {
        const records=db.createObjectStore('records',{keyPath:'id'});
        records.createIndex('byDate','date',{unique:false});
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata',{keyPath:'key'});
      }
    };
    request.onerror=()=>reject(request.error || new Error('QA 저장소 연결 실패'));
    request.onblocked=()=>reject(new Error('다른 탭에서 QA 저장소를 사용 중입니다.'));
    request.onsuccess=()=>{
      const db=request.result;
      if (!db.objectStoreNames.contains('records') || !db.objectStoreNames.contains('metadata')) {
        db.close();reject(new Error('QA 저장소 구조가 올바르지 않습니다.'));return;
      }
      db.onversionchange=()=>db.close();
      resolve(db);
    };
  });
}

/** Read-only: contains no storage mutations. */
export function readQaRecords(db) {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['records'],'readonly');
    const req=tx.objectStore('records').getAll();
    let rows;
    req.onsuccess=()=>{rows=req.result};
    tx.oncomplete=()=>resolve(rows);
    tx.onabort=()=>reject(tx.error || new Error('QA 조회 트랜잭션 중단'));
  });
}
export function readQaMarker(db) {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['metadata'],'readonly');
    const req=tx.objectStore('metadata').get('lastMigration');
    let value;
    req.onsuccess=()=>{value=req.result ?? null};
    tx.oncomplete=()=>resolve(value);
    tx.onabort=()=>reject(tx.error || new Error('QA 검증표시 조회 중단'));
  });
}

/**
 * Additive atomic import of a supplied backup snapshot; no localStorage read.
 * Do not await promises inside active IDB callbacks: requests run in the same
 * readwrite transaction. A failed add, verification or forced abort rolls back.
 * Fault flags are for negative tests ONLY, never production UI.
 */
export function migrateQaSnapshot(db,legacyBackup,{
  forceAbortAfterQueue=false,injectConstraintError=false
}={}) {
  const preflight=planIndexedDbMigration(legacyBackup,[]);
  if (!preflight.ready) throw new Error('원본 백업 형식이 올바르지 않습니다.');
  const input=JSON.parse(JSON.stringify(legacyBackup));
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['records','metadata'],'readwrite');
    const records=tx.objectStore('records');
    const metadata=tx.objectStore('metadata');
    let failure=null, result=null;
    const abort=message=>{
      failure=new Error(message);
      try {tx.abort()}catch {/* already aborted */}
    };
    tx.oncomplete=()=>resolve(result);
    tx.onabort=()=>reject(failure || tx.error || new Error('QA 이전 트랜잭션 중단'));
    // Do not preventDefault on request errors; the whole transaction must abort.
    tx.onerror=()=>{};

    const read=records.getAll();
    read.onsuccess=()=>{
      try {
        const before=read.result;
        const plan=planIndexedDbMigration(input,before);
        if (!plan.ready) {
          abort('동일 기록 ID의 내용이 달라 이전을 중단했습니다.');
          return;
        }
        if (plan.wouldAdd === 0) {
          result={committed:false,added:0,alreadyPresent:plan.alreadyPresent,
            existingCount:before.length,reason:'already-present'};
          return;
        }
        for (const row of plan.copyCandidates) records.add(row);
        if (injectConstraintError) records.add(plan.copyCandidates[0]);
        if (forceAbortAfterQueue) {
          abort('QA 의도적 오류 주입: 롤백 검사');
          return;
        }
        const check=records.getAll(); // queued after add requests
        check.onsuccess=()=>{
          try {
            const after=check.result;
            const expected=new Map(before.map(row=>[row.id,row]));
            for (const row of plan.copyCandidates) expected.set(row.id,row);
            if (after.length !== expected.size ||
                after.some(row=>!identical(row,expected.get(row.id)))) {
              abort('이전 직후 데이터 검증 실패: 전부 롤백합니다.');
              return;
            }
            metadata.put({
              key:'lastMigration',version:1,sourceCount:input.entries.length,
              alreadyPresent:plan.alreadyPresent,added:plan.wouldAdd,verified:true
            });
            result={committed:true,added:plan.wouldAdd,
              alreadyPresent:plan.alreadyPresent,existingCount:before.length,
              resultCount:after.length,verified:true};
          } catch(e) {abort('검증 단계 실패: '+e.message)}
        };
      } catch(e) {abort('이전 사전검사 실패: '+e.message)}
    };
  });
}