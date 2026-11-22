/* DEVELOPMENT ONLY. Explicit synthetic async UI boundary for V3 IndexedDB contract.
 * Not loaded by note-app.js, never reads localStorage, never uses Drive/network.
 * The V3 UI must be refactored to await commits before it can use this.
 */
(function(global){
'use strict';
function make(db,vault){
  var engine=global.ApuDaV3UnifiedContractSandbox;
  if(!engine||!vault||typeof vault.capture!=='function'||typeof vault.exportText!=='function')
    throw new Error('sandbox-services-required');
  if(!db||typeof db.name!=='string'||db.name.indexOf(engine.PREFIX)!==0)
    throw new Error('synthetic-db-required');
  var current=null,paused=false,initialized=false,attempts=0;
  function view(){
    if(!initialized)throw new Error('initialize-required');
    return Object.freeze({revision:current.revision,note:current.note,chat:current.chat,
      deleted:!!current.deleted,paused:paused,unsavedCount:vault.count(),
      readyForProduction:false,backupUploadAllowed:false,backupPruneAllowed:false});
  }
  async function initialize(){
    if(initialized)throw new Error('already-initialized');
    var row=await engine.read(db);
    current=row||{revision:0,note:null,chat:null,deleted:false};
    initialized=true;
    return view();
  }
  function mustReady(){
    if(!initialized)throw new Error('initialize-required');
    if(paused)return false;
    return true;
  }
  function hold(kind,raw,message){
    paused=true;
    var held=false;
    try{if(typeof raw==='string')held=vault.capture(kind,raw,message);}catch(_){}
    return {status:'blocked-review-required',held:held,revision:current.revision,
      readyForProduction:false};
  }
  async function commit(kind,raw,config){
    if(!mustReady())return {status:'blocked-review-required',held:vault.count()>0,
      revision:current.revision,readyForProduction:false};
    var confirm=config||{};
    if((kind==='restore'||kind==='delete')&&
       (confirm.userConfirmed!==true||confirm.independentBackupVerified!==true))
      return {status:'explicit-confirmation-and-backup-required',readyForProduction:false};
    if(kind==='recover'&&confirm.userConfirmed!==true)
      return {status:'explicit-confirmation-required',readyForProduction:false};
    var expected=engine.expectedState(current.revision,current.note,current.chat);
    var result;
    try{
      if(kind==='note')result=await engine.saveNote(db,expected,raw,!!confirm.injectAbort);
      else if(kind==='chat')result=await engine.saveChat(db,expected,raw,!!confirm.injectAbort);
      else if(kind==='restore')result=await engine.restore(db,expected,raw,!!confirm.injectAbort);
      else if(kind==='recover')result=await engine.recover(db,expected,!!confirm.injectAbort);
      else if(kind==='delete')result=await engine.removeAll(db,expected,!!confirm.injectAbort);
      else throw new Error('unknown-operation');
    }catch(error){return hold(kind==='chat'?'chat':'note',raw,error&&error.message);}
    if(!result||result.status!=='saved')
      return hold(kind==='chat'?'chat':'note',raw,result&&result.status==='conflict'?'records-changed':'not-saved');
    var observed;
    try{observed=await engine.read(db);}
    catch(error){return hold(kind==='chat'?'chat':'note',raw,'readback-failed');}
    // Other approved tabs might save again immediately. Never claim that
    // the UI's committed snapshot still matches what was just written.
    if(!observed||observed.revision!==result.revision)
      return hold(kind==='chat'?'chat':'note',raw,'records-changed');
    current=observed;attempts++;
    return Object.freeze({status:'saved',revision:current.revision,
      note:current.note,chat:current.chat,deleted:!!current.deleted,
      readyForProduction:false,backupUploadAllowed:false,backupPruneAllowed:false});
  }
  function diagnostics(){return {successfulCommits:attempts,paused:paused,revision:current&&current.revision,
    readyForProduction:false};}
  return Object.freeze({
    initialize:initialize,view:view,diagnostics:diagnostics,
    saveNote:function(raw,opt){return commit('note',raw,opt);},
    saveChat:function(raw,opt){return commit('chat',raw,opt);},
    restore:function(raw,opt){return commit('restore',raw,opt);},
    recover:function(opt){return commit('recover',null,opt);},
    removeAll:function(opt){return commit('delete',null,opt);}
  });
}
global.ApuDaV3SyntheticAsyncPort=Object.freeze({make:make});
})(typeof window!=='undefined'?window:globalThis);
