/* DEVELOPMENT ONLY. Unified V3 record/chat/restore/delete experiment.
 * ONLY an explicitly synthetic IndexedDB database is accepted. This script
 * does not touch production localStorage, Google Drive, or network APIs.
 * In particular, it cannot constrain an already open legacy V3 tab.
 */
(function(global){
  'use strict';
  var PREFIX='apuda-v3-synthetic-unified-',STORE='synthetic-bundle',KEY='synthetic-only';
  var MAX_CHAT_BYTES=2*1024*1024;

  function guard(db){
    if(!db||typeof db.name!=='string'||db.name.indexOf(PREFIX)!==0||typeof db.transaction!=='function')
      throw new Error('synthetic-database-required');
  }
  function revision(n){
    if(!Number.isSafeInteger(n)||n<0)throw new Error('invalid-revision');
  }
  function checkRaw(raw){
    if(raw!==null&&typeof raw!=='string')throw new Error('raw-string-or-null-required');
  }
  function verifyNote(raw){
    if(typeof raw!=='string')throw new Error('note-json-required');
    var validator=global.ApuDaNoteStorage;
    if(!validator||!validator.unpack||!Number.isSafeInteger(validator.MAX_BYTES))
      throw new Error('v3-validator-required');
    if(new TextEncoder().encode(raw).byteLength>validator.MAX_BYTES)throw new Error('note-too-large');
    validator.unpack(raw);
  }
  function verifyChat(raw){
    if(typeof raw!=='string')throw new Error('chat-json-required');
    if(new TextEncoder().encode(raw).byteLength>MAX_CHAT_BYTES)throw new Error('chat-too-large');
    var value=JSON.parse(raw);
    if(!Array.isArray(value)||value.length>60||!value.every(function(entry){
      return entry!==null&&typeof entry==='object'&&!Array.isArray(entry);
    }))throw new Error('invalid-chat');
  }
  function validateExpected(expected){
    if(!expected||typeof expected!=='object')throw new Error('expected-snapshot-required');
    revision(expected.revision);checkRaw(expected.note);checkRaw(expected.chat);
    if(expected.note!==null)verifyNote(expected.note);
    if(expected.chat!==null)verifyChat(expected.chat);
  }
  async function sha(raw){
    if(!global.crypto||!global.crypto.subtle)throw new Error('secure-context-required');
    var bytes=new TextEncoder().encode(raw===null?'':raw);
    var buf=await global.crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }
  function read(db){
    guard(db);
    return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,'readonly'),result=null;
      var request=tx.objectStore(STORE).get(KEY);
      request.onsuccess=function(){result=request.result||null;};
      tx.oncomplete=function(){resolve(result);};
      tx.onabort=function(){reject(tx.error||new Error('read-aborted'));};
      tx.onerror=function(){};
    });
  }
  // The entire record and chat share ONE revision and ONE IDB transaction.
  // There is deliberately no asynchronous operation inside the transaction.
  function commit(db,kind,expected,next,checkpoint,injectAbort){
    guard(db);validateExpected(expected);
    return new Promise(function(resolve,reject){
      var tx;
      try{tx=db.transaction(STORE,'readwrite');}catch(error){reject(error);return;}
      var outcome=null,abortedForTest=false;
      var request=tx.objectStore(STORE).get(KEY);
      request.onsuccess=function(){
        var prior=request.result||null;
        var prevRevision=prior?prior.revision:0;
        var prevNote=prior?prior.note:null;
        var prevChat=prior?prior.chat:null;
        if(prevRevision!==expected.revision||prevNote!==expected.note||prevChat!==expected.chat){
          outcome={status:'conflict',revision:prevRevision};return;
        }
        if(prior&&prior.deleted&&kind!=='delete'){
          outcome={status:'deleted-requires-manual-new-session',revision:prevRevision};return;
        }
        if(kind==='recover'&&(!prior||!prior.checkpoint||
          JSON.stringify(prior.checkpoint)!==JSON.stringify(checkpoint))){
          outcome={status:'conflict',revision:prevRevision};return;
        }
        // Keep the ORIGINAL synthetic legacy source as a stable migration
        // fence across reloads. Never replace it with later IDB revisions.
        // Tombstone intentionally wipes all source content including baseline.
        var baseline=kind==='delete'?null:(prior?prior.legacyBaseline||null:
          kind==='bundle-save'&&prevRevision===0?
            {note:next.note,chat:next.chat}:null);
        var nextRow={key:KEY,revision:prevRevision+1,note:next.note,chat:next.chat,
          deleted:kind==='delete',checkpoint:kind==='restore'?checkpoint:null,
          legacyBaseline:baseline,
          backupState:'frozen',lastMutation:kind,
          kind:'apuda.synthetic.v3.unified'};
        var put=tx.objectStore(STORE).put(nextRow);
        put.onsuccess=function(){
          if(injectAbort){abortedForTest=true;tx.abort();}
          else outcome={status:'saved',revision:nextRow.revision};
        };
      };
      tx.oncomplete=function(){resolve(outcome||{status:'unconfirmed'});};
      tx.onabort=function(){
        if(abortedForTest)resolve({status:'aborted'});
        else reject(tx.error||new Error('write-aborted'));
      };
      tx.onerror=function(){};
    });
  }
  function expectedState(rev,note,chat){
    revision(rev);checkRaw(note);checkRaw(chat);
    return {revision:rev,note:note,chat:chat};
  }
  async function saveNote(db,expected,nextNote,injectAbort){
    verifyNote(nextNote);
    return commit(db,'note-save',expected,{note:nextNote,chat:expected.chat},null,!!injectAbort);
  }
  async function saveChat(db,expected,nextChat,injectAbort){
    verifyChat(nextChat);
    return commit(db,'chat-save',expected,{note:expected.note,chat:nextChat},null,!!injectAbort);
  }
  /* Bundle save is a single ACID IDB transaction: note+chat either both
   * commit with the SAME revision, or neither changes.
   * IMPORTANT: synthetic DB ONLY — never wired into legacy V3 localStorage.
   */
  async function saveBundle(db,expected,nextNote,nextChat,injectAbort){
    verifyNote(nextNote);
    verifyChat(nextChat);
    return commit(db,'bundle-save',expected,
      {note:nextNote,chat:nextChat},null,!!injectAbort);
  }
  async function restore(db,expected,nextNote,injectAbort){
    verifyNote(nextNote);
    if(expected.note!==null)verifyNote(expected.note);
    var checkpoint={kind:'apuda.synthetic.v3.unified-checkpoint',schemaVersion:1,
      beforeNote:expected.note,beforeChat:expected.chat,afterNote:nextNote,
      beforeSha256:await sha(expected.note),afterSha256:await sha(nextNote)};
    return commit(db,'restore',expected,{note:nextNote,chat:expected.chat},checkpoint,!!injectAbort);
  }
  async function recover(db,expected,injectAbort){
    var prior=await read(db);
    if(!prior||prior.revision!==expected.revision||prior.note!==expected.note||prior.chat!==expected.chat)
      return {status:'conflict',revision:prior?prior.revision:0};
    var c=prior.checkpoint;
    if(!c||c.kind!=='apuda.synthetic.v3.unified-checkpoint'||c.schemaVersion!==1||
      c.afterNote!==prior.note||c.beforeChat!==prior.chat||
      (c.beforeNote!==null&&typeof c.beforeNote!=='string'))
      return {status:'no-verified-checkpoint',revision:prior.revision};
    if(c.beforeNote!==null)verifyNote(c.beforeNote);
    if(c.beforeChat!==null)verifyChat(c.beforeChat);
    if(await sha(c.beforeNote)!==c.beforeSha256||await sha(c.afterNote)!==c.afterSha256)
      return {status:'no-verified-checkpoint',revision:prior.revision};
    return commit(db,'recover',expected,{note:c.beforeNote,chat:c.beforeChat},c,!!injectAbort);
  }
  function removeAll(db,expected,injectAbort){
    // A tombstone retains a monotonically increasing revision, not user data.
    return commit(db,'delete',expected,{note:null,chat:null},null,!!injectAbort);
  }
  function planBackup(snapshot,options){
    if(!snapshot||snapshot.kind!=='apuda.synthetic.v3.unified')
      throw new Error('synthetic-snapshot-required');
    if(!options||!Number.isSafeInteger(options.expectedRevision))
      throw new Error('backup-revision-required');
    var reason=options.expectedRevision!==snapshot.revision?'stale-revision':
      snapshot.deleted?'deleted-note':
      options.legacyTabsClosed!==true?'legacy-tab-not-proven-closed':
      options.mixedVersionResolved!==true?'mixed-version-unresolved':
      options.userConfirmed!==true?'explicit-consent-required':
      'sandbox-only';
    // Pure planning API: it can never upload/prune files, even when all gates
    // are acknowledged. Legacy backup hooks are outside its control.
    return Object.freeze({status:'blocked',reason:reason,uploadAllowed:false,
      pruneAllowed:false,autoMigrationAllowed:false});
  }
  global.ApuDaV3UnifiedContractSandbox=Object.freeze({PREFIX:PREFIX,STORE:STORE,
    expectedState:expectedState,read:read,saveNote:saveNote,saveChat:saveChat,saveBundle:saveBundle,
    restore:restore,recover:recover,removeAll:removeAll,planBackup:planBackup});
})(typeof window!=='undefined'?window:globalThis);
