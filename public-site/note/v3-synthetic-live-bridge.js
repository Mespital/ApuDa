/* ApuDa V3 real-UI synthetic IndexedDB bridge — DEV TEST ONLY.
 * NEVER load this from note/index.html or a production deployment.
 * Explicitly requires loopback hostname, test opt-in flag, synthetic fixture
 * sentinel and synthetic-named IndexedDB. Cannot block old V3 localStorage
 * writes, so it fails closed if it detects legacy storage activity.
 */
(function(global){
'use strict';
const NOTE='apuda_cancer_care_v1',CHAT='apuda_note_chat_v1';
const SENTINEL='__apuda_v3_idb_bridge_fixture_only__';
function assertTestEnvironment(db){
  if(!global.location||global.location.hostname!=='127.0.0.1'||
    global.__APUDA_V3_SYNTHETIC_BRIDGE_OPT_IN__!==true||
    !global.localStorage||global.localStorage.getItem(SENTINEL)!=='synthetic-only')
    throw new Error('synthetic-loopback-opt-in-required');
  const engine=global.ApuDaV3UnifiedContractSandbox;
  if(!engine||!db||typeof db.name!=='string'||db.name.indexOf(engine.PREFIX)!==0)
    throw new Error('synthetic-indexeddb-required');
  if(!global.ApuDaV3SyntheticAsyncPort||!global.ApuDaNoteUnsavedDraft||
    typeof global.state==='undefined'||typeof global.chat==='undefined'||
    typeof global.save!=='function'||typeof global.commitChatRaw!=='function')
    throw new Error('v3-not-ready');
}
async function install(db){
  assertTestEnvironment(db);
  if(global.__APUDA_V3_SYNTHETIC_BRIDGE_ACTIVE__)throw new Error('already-installed');
  const port=global.ApuDaV3SyntheticAsyncPort.make(db,global.ApuDaNoteUnsavedDraft);
  const snapshot=await port.initialize();
  const legacyNote=global.localStorage.getItem(NOTE);
  const legacyChat=global.localStorage.getItem(CHAT);
  if(typeof legacyNote!=='string'||typeof legacyChat!=='string')throw new Error('synthetic-seed-missing');
  if(snapshot.revision===0){
    const seeded=await port.saveBundle(legacyNote,legacyChat);
    if(!seeded||seeded.status!=='saved')throw new Error('synthetic-stage-rejected');
  }else if(snapshot.note!==legacyNote||snapshot.chat!==legacyChat){
    throw new Error('synthetic-baseline-drift');
  }
  let legacyDrift=false,attempts=0;
  function protect(kind,raw,reason){
    legacyDrift=true;
    global.noteWritesPaused=true;global.chatWritesPaused=true;
    try{
      if(typeof global.holdUnsaved==='function')
        global.holdUnsaved(kind,raw,new Error(reason));
    }catch(_){}
  }
  function onStorage(event){
    if(event.key!==NOTE&&event.key!==CHAT)return;
    // Legacy tabs are not cooperating with IDB and CAN write. We cannot
    // claim to prevent that write; the bridge must stop its own writes.
    protect(event.key===CHAT?'chat':'note',
      event.key===CHAT?JSON.stringify(global.chat):JSON.stringify(global.state),
      'legacy-localstorage-changed');
    if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
  }
  global.addEventListener('storage',onStorage,true);
  function safeSnapshot(){
    const value=port.view();
    if(value.paused||legacyDrift||global.noteWritesPaused||global.chatWritesPaused)
      return null;
    return value;
  }
  function refuse(kind,raw,reason){
    protect(kind,raw,reason);
    return {status:'blocked-review-required',readyForProduction:false};
  }
  // The actual V3 form handlers call global save() and await its Promise.
  // We DO NOT mirror writes to the original localStorage keys.
  global.save=async function(){
    const raw=JSON.stringify(global.state);
    const snap=safeSnapshot();
    if(!snap)return refuse('note',raw,'write-paused');
    attempts++;
    const result=await port.saveBundle(raw,snap.chat);
    if(result.status!=='saved')return refuse('note',raw,result.status);
    if(typeof global.renderAll==='function')global.renderAll();
    return result;
  };
  // Existing serialized chat queue calls this and awaits its result.
  global.commitChatRaw=async function(raw){
    const snap=safeSnapshot();
    if(!snap)return refuse('chat',raw,'write-paused');
    attempts++;
    const result=await port.saveBundle(snap.note,raw);
    if(result.status!=='saved')return refuse('chat',raw,result.status);
    return result;
  };
  // Prevent accidental use of the old direct storage deletion path during
  // a synthetic bridge demonstration. Explicit user approval is NOT a
  // substitute for the real future migration/backup gate.
  if(typeof global.resetAll==='function')global.resetAll=function(){
    throw new Error('synthetic-live-reset-forbidden');
  };
  global.__APUDA_V3_SYNTHETIC_BRIDGE_ACTIVE__=true;
  return Object.freeze({
    current:()=>port.view(),
    diagnostics:()=>Object.freeze({syntheticOnly:true,legacyDrift,
      attemptedWrites:attempts,readyForProduction:false,
      backupUploadAllowed:false,backupPruneAllowed:false}),
  });
}
global.ApuDaV3SyntheticLiveBridge=Object.freeze({install,SENTINEL});
})(typeof window!=='undefined'?window:globalThis);
