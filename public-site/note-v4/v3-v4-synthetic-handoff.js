/* ApuDa V3 -> V4 shadow handoff: SYNTHETIC DATA ONLY.
 * NO production localStorage/Drive/network. NEVER activates a V4 record.
 * This does not stop legacy tabs or provide an atomic cross-database cutover.
 */
(function(global){
'use strict';
var PREFIX='apuda-v4-synthetic-handoff-',STORE='synthetic-handoff',KEY='synthetic-only',MAX_CHAT=2*1024*1024;
function dbGuard(db){
  if(!db||typeof db.name!=='string'||db.name.indexOf(PREFIX)!==0||typeof db.transaction!=='function')
    throw new Error('synthetic-db-only');
}
function sourceGuard(source){
  if(!source||source.kind!=='apuda.synthetic.v3.source'||typeof source.read!=='function')
    throw new Error('synthetic-source-required');
}
function snapshot(s){
  if(!s||typeof s.note!=='string'||(s.chat!==null&&typeof s.chat!=='string'))throw new Error('source-raw-required');
  var svc=global.ApuDaNoteStorage;
  if(!svc||typeof svc.unpack!=='function')throw new Error('v3-validation-required');
  if(new TextEncoder().encode(s.note).byteLength>svc.MAX_BYTES)throw new Error('source-too-large');
  svc.unpack(s.note);
  if(s.chat!==null){
    if(new TextEncoder().encode(s.chat).byteLength>MAX_CHAT)throw new Error('chat-too-large');
    var c=JSON.parse(s.chat);
    if(!Array.isArray(c)||c.length>60||!c.every(function(x){return x&&typeof x==='object'&&!Array.isArray(x);}))
      throw new Error('invalid-chat');
  }
  return Object.freeze({note:s.note,chat:s.chat});
}
function equal(a,b){return a.note===b.note&&a.chat===b.chat;}
async function observe(source){sourceGuard(source);return snapshot(await source.read());}
function read(db){
  dbGuard(db);return new Promise(function(resolve,reject){
    var tx=db.transaction(STORE,'readonly'),out=null;
    var req=tx.objectStore(STORE).get(KEY);
    req.onsuccess=function(){out=req.result||null;};
    tx.oncomplete=function(){resolve(out);};
    tx.onabort=function(){reject(tx.error||new Error('read-aborted'));};
  });
}
function transact(db,base,plan,expectedRevision,abortForTest){
  dbGuard(db);
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw new Error('revision-required');
  return new Promise(function(resolve,reject){
    var tx;
    try{tx=db.transaction(STORE,'readwrite');}catch(error){reject(error);return;}
    var result=null,aborted=false,req=tx.objectStore(STORE).get(KEY);
    req.onsuccess=function(){
      var prior=req.result||null,rev=prior?prior.revision:0;
      if(prior&&prior.sourceNote===base.note&&prior.sourceChat===base.chat&&
        prior.candidateRaw===plan.candidateV4.raw){
        result={status:'already-staged',revision:rev};return;
      }
      if(prior){result={status:'manual-conflict-review',revision:rev};return;}
      if(rev!==expectedRevision){result={status:'conflict',revision:rev};return;}
      var row={key:KEY,revision:rev+1,
        kind:'apuda.synthetic.v3-v4.handoff.v1',
        sourceNote:base.note,sourceChat:base.chat,
        sourceSha256:plan.originalV3.sha256,
        candidateRaw:plan.candidateV4.raw,candidateSha256:plan.candidateV4.sha256,
        readyForProduction:false,allowActivation:false,
        autoImportAllowed:false,autoCleanupAllowed:false,driveUploadAllowed:false,drivePruneAllowed:false};
      var put=tx.objectStore(STORE).put(row);
      put.onsuccess=function(){
        if(abortForTest){aborted=true;tx.abort();}
        else result={status:'staged',revision:row.revision};
      };
    };
    tx.oncomplete=function(){resolve(result||{status:'unconfirmed'});};
    tx.onabort=function(){if(aborted)resolve({status:'aborted'});else reject(tx.error||new Error('write-aborted'));};
  });
}
async function stage(db,source,expectedRevision,abortForTest){
  dbGuard(db);sourceGuard(source);
  var original=await observe(source);
  var migrator=global.ApuDaV4MigrationRehearsal;
  if(!migrator||typeof migrator.prepare!=='function'||typeof migrator.verify!=='function')
    throw new Error('migration-rehearsal-required');
  var plan=await migrator.prepare(original.note,null);
  var report=await migrator.verify(plan);
  if(!report.valid||report.canWriteToV4!==false||plan.readyForProduction!==false)
    throw new Error('untrusted-migration-plan');
  var beforeWrite=await observe(source);
  if(!equal(original,beforeWrite))return {status:'source-drift-before-stage',readyForProduction:false};
  var outcome=await transact(db,original,plan,expectedRevision,!!abortForTest);
  if(outcome.status!=='staged'&&outcome.status!=='already-staged')
    return Object.assign({readyForProduction:false},outcome);
  var afterWrite=await observe(source);
  if(!equal(original,afterWrite))
    return {status:'source-drift-after-stage',revision:outcome.revision,readyForProduction:false};
  return Object.assign({readyForProduction:false,sourceUnchanged:true},outcome);
}
global.ApuDaV4SyntheticHandoff=Object.freeze({PREFIX:PREFIX,STORE:STORE,read:read,stage:stage});
})(typeof window!=='undefined'?window:globalThis);
