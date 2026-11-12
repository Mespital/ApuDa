/**
 * ApuDa Memory Phase 15 - QA-only atomic staging of synthetic profile vaults.
 * Requires explicitly named apuda-memory-qa-vault-* databases.
 * Never accesses localStorage, production database, live UI, or network.
 */
import {applyLegacyStaging} from './legacy-staging.mjs';

const NAME=/^apuda-memory-qa-vault-[a-z0-9-]{4,70}$/;
const clone=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function openProfileVaultQaDatabase(factory,name) {
  if(typeof name!=='string'||!NAME.test(name))throw Error('QA 전용 데이터베이스 이름만 허용됩니다.');
  if(!factory?.open)throw Error('IndexedDB 실행 환경이 없습니다.');
  return new Promise((resolve,reject)=>{
    const req=factory.open(name,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('vault'))db.createObjectStore('vault',{keyPath:'key'});
      if(!db.objectStoreNames.contains('audit'))db.createObjectStore('audit',{keyPath:'key'});
    };
    req.onerror=()=>reject(req.error||Error('QA 저장소 연결 실패'));
    req.onblocked=()=>reject(Error('다른 브라우저 탭에서 QA 저장소가 사용 중입니다.'));
    req.onsuccess=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('vault')||!db.objectStoreNames.contains('audit')){
        db.close();reject(Error('QA 저장소 구조를 확인할 수 없습니다.'));return;
      }
      db.onversionchange=()=>db.close();
      resolve(db);
    };
  });
}
export function readQaVault(db) {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['vault','audit'],'readonly');
    const doc=tx.objectStore('vault').get('current');
    const marker=tx.objectStore('audit').get('staged');
    let docValue=null,markValue=null;
    doc.onsuccess=()=>{docValue=doc.result?.snapshot??null};
    marker.onsuccess=()=>{markValue=marker.result??null};
    tx.oncomplete=()=>resolve({vault:clone(docValue),marker:clone(markValue)});
    tx.onabort=()=>reject(tx.error||Error('QA 조회 실패'));
  });
}
/**
 * A single readwrite transaction either creates BOTH vault snapshot and
 * verified marker or creates NEITHER; never overwrites an existing snapshot.
 * Returns only after tx.oncomplete, not on individual IDBRequest success.
 *
 * Injected failures are QA-only and must never be linked to the user UI.
 */
export function commitLegacyQaStage(db,sourceVault,legacyBackup,plan,{
  confirmed=false,forceAbort=false,injectDuplicate=false
}={}) {
  const staged=applyLegacyStaging(sourceVault,legacyBackup,plan,confirmed);
  const candidate=clone(staged.vault);
  const marker={
    key:'staged',verified:true,kind:'qa-legacy-unassigned-v1',
    sourceCount:legacyBackup.entries.length,
    unassignedCount:candidate.unassigned.length,
    classifiedCount:candidate.records.length,
    totalCount:candidate.records.length+candidate.unassigned.length
  };
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['vault','audit'],'readwrite');
    const vault=tx.objectStore('vault'),audit=tx.objectStore('audit');
    let outcome=null,why=null;
    const abort=message=>{why=Error(message);try{tx.abort()}catch{/* already aborted */}};
    tx.onabort=()=>reject(why||tx.error||Error('QA 트랜잭션 롤백'));
    tx.onerror=()=>{}; // Let request errors abort atomically.
    tx.oncomplete=()=>resolve(outcome);

    const current=vault.get('current');
    current.onsuccess=()=>{
      if(current.result){
        const existing=current.result.snapshot;
        const markerRequest=audit.get('staged');
        markerRequest.onsuccess=()=>{
          if(eq(existing,candidate)&&markerRequest.result?.verified===true){
            outcome={committed:false,reason:'already-staged',totalCount:marker.totalCount};
          }else abort('QA 저장소에 다른 기록이나 미검증 표시가 있어 덮어쓰지 않았습니다.');
        };
        return;
      }
      vault.add({key:'current',snapshot:candidate});
      if(injectDuplicate)vault.add({key:'current',snapshot:candidate});
      if(forceAbort){abort('QA 강제 중단으로 전체 롤백');return;}
      const verify=vault.get('current');
      verify.onsuccess=()=>{
        if(!verify.result||!eq(verify.result.snapshot,candidate)){
          abort('QA 기록 스냅샷 재검증 실패로 전체 롤백');
          return;
        }
        audit.add(marker);
        const check=audit.get('staged');
        check.onsuccess=()=>{
          if(!eq(check.result,marker)){
            abort('QA 검증 표시 오류로 전체 롤백');
            return;
          }
          outcome={
            committed:true,added:staged.added,totalCount:marker.totalCount,
            unassignedCount:marker.unassignedCount,verified:true
          };
        };
      };
    };
  });
}
