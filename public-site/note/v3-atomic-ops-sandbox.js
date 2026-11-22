/* DEVELOPMENT-ONLY V3 operation serialization experiment.
 * Never loaded by the operating notebook. Accepts only DBs named with a
 * synthetic prefix, and uses a synthetic key. No localStorage or network.
 * This is NOT an automatic migration, nor a production-ready storage adapter.
 */
(function(global){
  'use strict';
  var PREFIX='apuda-v3-synthetic-ops-lab-',STORE='trial-records',KEY='synthetic-only';
  function guard(db){
    if(!db||typeof db.name!=='string'||db.name.indexOf(PREFIX)!==0||!db.transaction)
      throw new Error('synthetic-database-required');
  }
  function validate(raw){
    if(typeof raw!=='string')throw new Error('v3-json-required');
    var svc=global.ApuDaNoteStorage;
    if(!svc||!svc.unpack||!Number.isSafeInteger(svc.MAX_BYTES))throw new Error('v3-validator-required');
    if(new TextEncoder().encode(raw).byteLength>svc.MAX_BYTES)throw new Error('v3-too-large');
    svc.unpack(raw);
    return raw;
  }
  function rev(revision){
    if(!Number.isSafeInteger(revision)||revision<0)throw new Error('invalid-revision');
  }
  async function sha(raw){
    if(!global.crypto||!global.crypto.subtle)throw new Error('secure-context-required');
    var b=await global.crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw===null?'':raw));
    return Array.from(new Uint8Array(b)).map(function(v){return v.toString(16).padStart(2,'0');}).join('');
  }
  function read(db){
    guard(db);
    return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,'readonly'),value=null;
      var request=tx.objectStore(STORE).get(KEY);
      request.onsuccess=function(){value=request.result||null;};
      tx.oncomplete=function(){resolve(value);};
      tx.onabort=function(){reject(tx.error||new Error('read-aborted'));};
      tx.onerror=function(){};
    });
  }
  // Compare expected revision AND exact expected raw string in the SAME
  // readwrite transaction that creates the replacement/checkpoint/tombstone.
  // The two expected-source digests, when needed, are computed BEFORE the TX.
  function change(db,kind,expectedRevision,expectedRaw,nextRaw,checkpoint,abortAfterPut){
    guard(db);rev(expectedRevision);
    if(expectedRaw!==null&&typeof expectedRaw!=='string')throw new Error('invalid-expected-source');
    return new Promise(function(resolve,reject){
      var tx;
      try{tx=db.transaction(STORE,'readwrite');}catch(error){reject(error);return;}
      var outcome=null,injectedAbort=false;
      var request=tx.objectStore(STORE).get(KEY);
      request.onsuccess=function(){
        var prior=request.result||null;
        var version=prior?prior.revision:0;
        var raw=prior?prior.raw:null;
        if(version!==expectedRevision||raw!==expectedRaw){
          outcome={status:'conflict',revision:version};return;
        }
        if(kind==='recover'&&(!prior.checkpoint||
            JSON.stringify(prior.checkpoint)!==JSON.stringify(checkpoint))){
          outcome={status:'conflict',revision:version};return;
        }
        var next={key:KEY,revision:version+1,raw:nextRaw,
          deleted:kind==='delete',checkpoint:kind==='restore'?checkpoint:null,
          kind:'synthetic-v3-only'};
        var put=tx.objectStore(STORE).put(next);
        put.onsuccess=function(){
          if(abortAfterPut){injectedAbort=true;tx.abort();}
          else outcome={status:'saved',revision:next.revision};
        };
      };
      tx.oncomplete=function(){resolve(outcome||{status:'unconfirmed'});};
      tx.onabort=function(){
        if(injectedAbort)resolve({status:'aborted'});
        else reject(tx.error||new Error('write-aborted'));
      };
      tx.onerror=function(){};
    });
  }
  async function save(db,expectedRevision,expectedRaw,nextRaw,injectAbort){
    validate(nextRaw);
    return change(db,'save',expectedRevision,expectedRaw,nextRaw,null,!!injectAbort);
  }
  async function restore(db,expectedRevision,expectedRaw,nextRaw,injectAbort){
    validate(nextRaw);
    if(expectedRaw!==null)validate(expectedRaw);
    var checkpoint={format:'apuda.synthetic.v3.atomic-checkpoint',schemaVersion:1,
      before:expectedRaw,after:nextRaw,beforeSha256:await sha(expectedRaw),afterSha256:await sha(nextRaw)};
    return change(db,'restore',expectedRevision,expectedRaw,nextRaw,checkpoint,!!injectAbort);
  }
  async function recover(db,expectedRevision,expectedRaw,injectAbort){
    var current=await read(db);
    if(!current||current.revision!==expectedRevision||current.raw!==expectedRaw)
      return {status:'conflict',revision:current?current.revision:0};
    var checkpoint=current.checkpoint;
    if(!checkpoint||checkpoint.format!=='apuda.synthetic.v3.atomic-checkpoint'||
       checkpoint.schemaVersion!==1||checkpoint.after!==current.raw||
       (checkpoint.before!==null&&typeof checkpoint.before!=='string'))
      return {status:'no-verified-checkpoint',revision:current.revision};
    if(checkpoint.before!==null)validate(checkpoint.before);
    if(await sha(checkpoint.before)!==checkpoint.beforeSha256||
       await sha(checkpoint.after)!==checkpoint.afterSha256)
      return {status:'no-verified-checkpoint',revision:current.revision};
    return change(db,'recover',expectedRevision,expectedRaw,checkpoint.before,checkpoint,!!injectAbort);
  }
  async function remove(db,expectedRevision,expectedRaw,injectAbort){
    // Tombstone retains only revision; no old V3 bytes or recovery checkpoint.
    return change(db,'delete',expectedRevision,expectedRaw,null,null,!!injectAbort);
  }
  global.ApuDaV3AtomicOpsSandbox=Object.freeze({read:read,save:save,restore:restore,
    recover:recover,remove:remove,PREFIX:PREFIX,STORE:STORE});
})(typeof window!=='undefined'?window:globalThis);
