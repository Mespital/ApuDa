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
const BACKUP_FORMAT='apuda.synthetic.note-file-review.v1';
const MAX_BACKUP_BYTES=32*1024*1024;
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
  let legacyDrift=false,attempts=0,verifiedBackup=null;
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
    verifiedBackup=null;
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
  /* This is a REVIEW-ONLY backup file for synthetic UI integration tests.
   * SHA-256 only checks byte integrity; it is NOT a signature, attestation of
   * independent durable storage, or a substitute for a genuine patient backup.
   */
  function backupPayload(snapshot){
    return {format:BACKUP_FORMAT,revision:snapshot.revision,
      note:snapshot.note,chat:snapshot.chat};
  }
  async function digest(payload){
    const buf=await global.crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(JSON.stringify(payload)));
    return Array.from(new Uint8Array(buf)).map(function(n){
      return n.toString(16).padStart(2,'0');
    }).join('');
  }
  async function downloadSyntheticBackup(){
    const snapshot=safeSnapshot();
    if(!snapshot||snapshot.deleted)throw new Error('synthetic-backup-unavailable');
    const payload=backupPayload(snapshot),checksum=await digest(payload);
    const check=safeSnapshot();
    if(!check||check.revision!==snapshot.revision||
      check.note!==snapshot.note||check.chat!==snapshot.chat)
      throw new Error('synthetic-backup-source-changed');
    const text=JSON.stringify({reviewOnly:true,readyForProduction:false,
      payload:payload,sha256:checksum},null,2);
    const blob=new Blob([text],{type:'application/json;charset=utf-8'});
    if(blob.size>MAX_BACKUP_BYTES)throw new Error('synthetic-backup-too-large');
    const url=global.URL.createObjectURL(blob);
    const link=global.document.createElement('a');
    link.href=url;link.download='APUDA_SYNTHETIC_REVIEW_ONLY_REV'+snapshot.revision+'.json';
    link.hidden=true;global.document.body.appendChild(link);link.click();link.remove();
    global.setTimeout(function(){global.URL.revokeObjectURL(url);},2000);
    return {status:'download-triggered',revision:snapshot.revision,bytes:blob.size,
      readyForProduction:false};
  }
  async function verifySyntheticBackupFile(file){
    verifiedBackup=null;
    if(!file||typeof file.text!=='function'||typeof file.size!=='number'||
       !file.name||!file.name.endsWith('.json')||
       file.size<1||file.size>MAX_BACKUP_BYTES)
      return {status:'review-json-file-required',readyForProduction:false};
    let parsed;
    try{parsed=JSON.parse(await file.text());}catch(_){
      return {status:'invalid-review-file',readyForProduction:false};
    }
    const p=parsed&&parsed.payload;
    if(!parsed||parsed.reviewOnly!==true||parsed.readyForProduction!==false||
       typeof parsed.sha256!=='string'||!p||
       p.format!==BACKUP_FORMAT||!Number.isSafeInteger(p.revision)||p.revision<1||
       typeof p.note!=='string'||typeof p.chat!=='string')
      return {status:'invalid-review-file',readyForProduction:false};
    try{
      global.ApuDaNoteStorage.unpack(p.note);
      const entries=JSON.parse(p.chat);
      if(!Array.isArray(entries)||entries.length>60)throw new Error('invalid-chat');
    }catch(_){return {status:'invalid-review-file',readyForProduction:false};}
    const checksum=await digest(p);
    if(checksum!==parsed.sha256)
      return {status:'integrity-mismatch',readyForProduction:false};
    const snap=safeSnapshot();
    if(!snap||snap.deleted||snap.revision!==p.revision||
       snap.note!==p.note||snap.chat!==p.chat)
      return {status:'snapshot-mismatch',readyForProduction:false};
    const fresh=await engine.read(db);
    if(!fresh||fresh.deleted||fresh.revision!==p.revision||
       fresh.note!==p.note||fresh.chat!==p.chat)
      return {status:'snapshot-mismatch',readyForProduction:false};
    verifiedBackup={revision:p.revision,sha256:checksum,note:p.note,chat:p.chat};
    return {status:'verified',revision:p.revision,sha256:checksum,
      readyForProduction:false,independentDurabilityProven:false};
  }
  function verifiedProofFor(snap){
    return !!verifiedBackup&&verifiedBackup.revision===snap.revision&&
      verifiedBackup.note===snap.note&&verifiedBackup.chat===snap.chat;
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
    verifiedBackup=null;
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
    verifiedBackup=null;
    return result;
  };
  // Synthetic explicit requests are NOT production UI controls and consent
  // flags are not a verification of a real independent patient backup.
  async function syntheticAction(kind,raw,confirm){
    const snap=safeSnapshot();
    if(!snap)return refuse('note',JSON.stringify(global.state),'write-paused');
    if(kind==='recover'){
      if(!confirm||confirm.userConfirmed!==true)
        return {status:'explicit-confirmation-required',readyForProduction:false};
    }else if(kind==='restore'||kind==='delete'){
      if(!confirm||confirm.userConfirmed!==true||
        confirm.independentBackupVerified!==true)
        return {status:'explicit-confirmation-and-backup-required',readyForProduction:false};
    }else throw new Error('unknown-synthetic-action');
    if(!verifiedProofFor(snap))
      return {status:'verified-review-file-required',readyForProduction:false};
    // Proof is single-use. IDB still checks the actual revision transactionally.
    verifiedBackup=null;
    let result;
    if(kind==='restore')result=await port.restore(raw,confirm);
    else if(kind==='recover')result=await port.recover(confirm);
    else result=await port.removeAll(confirm);
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
    downloadSyntheticBackup:downloadSyntheticBackup,
    verifySyntheticBackupFile:verifySyntheticBackupFile,
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
