/* ApuDa V4 isolated checkpoint PILOT. In-memory Map ONLY.
 * It cannot receive localStorage, IndexedDB, a file handle or an external
 * storage adapter. There is no production persistence or patient import.
 */
(function(global){
  'use strict';
  var FORMAT='apuda.note.v4.sandbox-checkpoint',VERSION=1;
  var TARGET='sandbox/v4-target',CHECKPOINT='sandbox/checkpoint';
  function byteLength(text){return new TextEncoder().encode(text).byteLength;}
  function controls(raw){
    var config=raw||{},out={};
    if(typeof config!=='object'||Array.isArray(config))throw new Error('invalid-sandbox-options');
    ['failWriteAt','corruptWriteAt','interruptAfterWrite'].forEach(function(k){
      if(config[k]!==undefined){if(!Number.isInteger(config[k])||config[k]<1)throw new Error('invalid-sandbox-fault');out[k]=config[k];}
    });
    out.maxBytes=config.maxBytes===undefined?64*1024*1024:config.maxBytes;
    if(!Number.isInteger(out.maxBytes)||out.maxBytes<1||out.maxBytes>256*1024*1024)
      throw new Error('invalid-sandbox-quota');
    out.injectConcurrentTarget=config.injectConcurrentTarget;
    if(out.injectConcurrentTarget!==undefined&&out.injectConcurrentTarget!==null&&
       typeof out.injectConcurrentTarget!=='string')throw new Error('invalid-sandbox-interference');
    return out;
  }
  async function create(plan,options){
    var api=global.ApuDaV4MigrationRehearsal;
    if(!api||!api.verify)throw new Error('rehearsal-required');
    await api.verify(plan);
    var config=controls(options),memory=new Map(),writes=0,status='ready';
    var source=plan.originalV3.raw,targetBefore=plan.previousV4.raw,candidate=plan.candidateV4.raw;
    var currentSource=source,checkpointExpected=null;
    if(targetBefore!==null)memory.set(TARGET,targetBefore);
    function read(key){return memory.has(key)?memory.get(key):null;}
    function measure(nextKey,nextValue,remove){
      var total=0;
      memory.forEach(function(value,key){if(key!==nextKey)total+=byteLength(key)+byteLength(value);});
      if(!remove)total+=byteLength(nextKey)+byteLength(nextValue);
      return total;
    }
    function put(key,value){
      if(typeof value!=='string')throw new Error('sandbox-strings-only');
      writes++;
      if(config.failWriteAt===writes)throw new Error('sandbox-simulated-write-failure');
      if(measure(key,value,false)>config.maxBytes)throw new Error('sandbox-simulated-quota-exceeded');
      memory.set(key,value);
      if(config.corruptWriteAt===writes)memory.set(key,value+'!');
    }
    function beforeMatches(){return currentSource===source&&read(TARGET)===targetBefore;}
    function checkpointValid(){return checkpointExpected!==null&&read(CHECKPOINT)===checkpointExpected;}
    function inspect(){
      var total=0;memory.forEach(function(value,key){total+=byteLength(key)+byteLength(value);});
      return {mode:'in-memory-sandbox',status:status,productionWriteOccurred:false,
        v3OriginalUnchanged:currentSource===source,targetMatchesBefore:read(TARGET)===targetBefore,
        targetMatchesCandidate:read(TARGET)===candidate,checkpointExists:read(CHECKPOINT)!==null,
        checkpointVerified:checkpointValid(),occupiedBytes:total,writeAttempts:writes};
    }
    async function stage(){
      if(status!=='ready')throw new Error('sandbox-stage-not-ready');
      await api.verify(plan);
      if(!beforeMatches())throw new Error('sandbox-concurrent-change');
      checkpointExpected=JSON.stringify({format:FORMAT,schemaVersion:VERSION,
        originalV3:source,previousV4:targetBefore,candidateV4:candidate,
        sourceSha256:plan.originalV3.sha256,beforeSha256:plan.previousV4.sha256,
        candidateSha256:plan.candidateV4.sha256});
      try{
        put(CHECKPOINT,checkpointExpected);
        if(!checkpointValid())throw new Error('sandbox-checkpoint-readback-mismatch');
        if(config.injectConcurrentTarget!==undefined){
          if(config.injectConcurrentTarget===null)memory.delete(TARGET);
          else memory.set(TARGET,config.injectConcurrentTarget);
        }
        if(!beforeMatches())throw new Error('sandbox-concurrent-change');
        put(TARGET,candidate);
        if(config.interruptAfterWrite===writes){status='interrupted';return inspect();}
        if(read(TARGET)!==candidate)throw new Error('sandbox-candidate-readback-mismatch');
        status='staged';
        return inspect();
      }catch(error){status='blocked';throw error;}
    }
    async function recover(){
      await api.verify(plan);
      if(!checkpointValid())throw new Error('sandbox-checkpoint-unverified');
      if(currentSource!==source)throw new Error('sandbox-v3-source-changed');
      var current=read(TARGET);
      if(current!==targetBefore&&current!==candidate)throw new Error('sandbox-target-conflict');
      if(current===candidate&&candidate!==targetBefore){
        if(targetBefore===null)memory.delete(TARGET);
        else put(TARGET,targetBefore);
      }
      if(read(TARGET)!==targetBefore)throw new Error('sandbox-rollback-readback-mismatch');
      status='recovered';
      return inspect();
    }
    // Synthetic fault-injection controls, scoped to this private Map.
    function simulateExternalTarget(value){
      if(value!==null&&typeof value!=='string')throw new Error('sandbox-strings-only');
      if(value===null)memory.delete(TARGET);else memory.set(TARGET,value);
    }
    function simulateExternalSource(value){
      if(typeof value!=='string')throw new Error('sandbox-strings-only');
      currentSource=value;
    }
    return Object.freeze({stage:stage,recover:recover,inspect:inspect,
      simulateExternalTarget:simulateExternalTarget,simulateExternalSource:simulateExternalSource});
  }
  global.ApuDaV4SandboxCheckpoint=Object.freeze({create:create});
})(typeof window!=='undefined'?window:globalThis);
