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
function hydrateSynthetic(snapshot){
  if(!snapshot||!Number.isSafeInteger(snapshot.revision)||snapshot.revision<1)
    throw new Error('synthetic-snapshot-required');
  // A tombstone must NEVER reload the legacy localStorage record.
  if(snapshot.deleted){
    global.state=global.clone(global.defaultState);
    global.chat=[];
    global.noteWritesPaused=true;global.chatWritesPaused=true;
  }else{
    if(typeof snapshot.note!=='string'||typeof snapshot.chat!=='string')
      throw new Error('synthetic-snapshot-raw-required');
    const parsed=global.ApuDaNoteStorage.unpack(snapshot.note);
    const c=JSON.parse(snapshot.chat);
    if(!Array.isArray(c))throw new Error('invalid-synthetic-chat');
    global.state=Object.assign(global.clone(global.defaultState),parsed);
    global.state.profile=Object.assign(global.clone(global.defaultState.profile),parsed.profile||{});
    global.chat=c;
  }
  if(typeof global.renderAll==='function')global.renderAll();
  const thread=global.document&&global.document.querySelector('#thread');
  if(thread){
    thread.replaceChildren();
    global.chat.slice(-30).forEach(function(message){
      const el=global.addMsg(message.w,message.h,message.c,false);
      el.querySelectorAll('.undo,.qr button').forEach(function(button){button.remove();});
    });
    if(global.chat.length){
      const separator=global.document.createElement('div');
      separator.className='small muted';separator.style.textAlign='center';
      separator.textContent='— 이전 대화 —';thread.appendChild(separator);
    }
    if(typeof global.greet==='function')global.greet();
  }
}

async function install(db){
  assertTestEnvironment(db);
  if(global.__APUDA_V3_SYNTHETIC_BRIDGE_ACTIVE__)throw new Error('already-installed');
  const port=global.ApuDaV3SyntheticAsyncPort.make(db,global.ApuDaNoteUnsavedDraft);
  const snapshot=await port.initialize();
  const legacyNote=global.localStorage.getItem(NOTE);
  const legacyChat=global.localStorage.getItem(CHAT);
  if(typeof legacyNote!=='string'||typeof legacyChat!=='string')throw new Error('synthetic-seed-missing');
  const engine=global.ApuDaV3UnifiedContractSandbox;
  let legacyDrift=false,attempts=0;
  if(snapshot.revision===0){
    const seeded=await port.saveBundle(legacyNote,legacyChat);
    if(!seeded||seeded.status!=='saved')throw new Error('synthetic-stage-rejected');
    const source=await engine.read(db);
    if(!source||!source.legacyBaseline||source.legacyBaseline.note!==legacyNote||
      source.legacyBaseline.chat!==legacyChat)throw new Error('synthetic-baseline-unavailable');
  }else{
    const source=await engine.read(db);
    if(!source||source.revision!==snapshot.revision)throw new Error('synthetic-readback-mismatch');
    if(!source.deleted&&(!source.legacyBaseline||
      source.legacyBaseline.note!==legacyNote||source.legacyBaseline.chat!==legacyChat)){
      // Never fall through to legacy localStorage writer after resume fails.
      global.noteWritesPaused=true;global.chatWritesPaused=true;
      if(typeof global.holdUnsaved==='function')
        global.holdUnsaved('note',JSON.stringify(global.state),new Error('synthetic-baseline-drift'));
      throw new Error('synthetic-baseline-drift');
    }
    hydrateSynthetic(snapshot);
  }
  if(global.localStorage.getItem(NOTE)!==legacyNote||
     global.localStorage.getItem(CHAT)!==legacyChat){
    global.noteWritesPaused=true;global.chatWritesPaused=true;
    throw new Error('synthetic-baseline-drift-during-install');
  }
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
    if(global.localStorage.getItem(NOTE)!==legacyNote||
       global.localStorage.getItem(CHAT)!==legacyChat){
      protect('note',JSON.stringify(global.state),'legacy-localstorage-changed');
      return null;
    }
    if(value.paused||value.deleted||legacyDrift||global.noteWritesPaused||global.chatWritesPaused)
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
  // Synthetic explicit requests are NOT production UI controls and consent
  // flags are not a verification of a real independent patient backup.
  async function syntheticAction(kind,raw,confirm){
    const snap=safeSnapshot();
    if(!snap)return refuse('note',JSON.stringify(global.state),'write-paused');
    let result;
    if(kind==='restore')result=await port.restore(raw,confirm);
    else if(kind==='recover')result=await port.recover(confirm);
    else if(kind==='delete')result=await port.removeAll(confirm);
    else throw new Error('unknown-synthetic-action');
    if(result&&result.status==='saved')hydrateSynthetic(result);
    return result;
  }
  // Disable all existing V3 legacy localStorage restore/delete entry points
  // in this synthetic session, even if a UI button is accidentally pressed.
  ['resetAll','importData','recoverBeforeRestore'].forEach(function(name){
    if(typeof global[name]==='function')global[name]=function(){
      throw new Error('synthetic-legacy-mutation-forbidden');
    };
  });
  global.__APUDA_V3_SYNTHETIC_BRIDGE_ACTIVE__=true;
  return Object.freeze({
    current:()=>port.view(),
    restoreSynthetic:(raw,confirm)=>syntheticAction('restore',raw,confirm),
    recoverSynthetic:(confirm)=>syntheticAction('recover',null,confirm),
    deleteSynthetic:(confirm)=>syntheticAction('delete',null,confirm),
    diagnostics:()=>Object.freeze({syntheticOnly:true,legacyDrift,
      attemptedWrites:attempts,readyForProduction:false,
      backupUploadAllowed:false,backupPruneAllowed:false}),
  });
}
global.ApuDaV3SyntheticLiveBridge=Object.freeze({install,SENTINEL});
})(typeof window!=='undefined'?window:globalThis);
