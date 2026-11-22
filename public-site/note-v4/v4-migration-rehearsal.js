/* ApuDa V3 -> V4 extended migration REHEARSAL ONLY.
 * All input and output are explicit in-memory strings. No storage adapter,
 * persistent backup, network, file IO, production writes or real migration.
 * A successful rehearsal is NOT permission to write an actual patient record.
 */
(function(global){
  'use strict';
  var FORMAT='apuda.note.v4.migration-rehearsal',VERSION=1;
  function services(){
    var draft=global.ApuDaV4ExtendedDraft,storage=global.ApuDaNoteStorage;
    if(!draft||!draft.build||!draft.verify||!draft.originalJSON||
      !storage||!Number.isInteger(storage.MAX_BYTES)||!global.crypto||!global.crypto.subtle||
      typeof TextEncoder==='undefined')throw new Error('rehearsal-services-required');
    return {draft:draft,storage:storage};
  }
  function bytes(raw){return new TextEncoder().encode(raw);}
  async function sha(raw){
    var hash=new Uint8Array(await global.crypto.subtle.digest('SHA-256',bytes(raw)));
    return Array.from(hash).map(function(n){return n.toString(16).padStart(2,'0');}).join('');
  }
  async function capture(raw,maxBytes){
    if(raw!==null&&typeof raw!=='string')throw new Error('rehearsal-strings-only');
    var value=raw===null?'':raw,byteLength=bytes(value).byteLength;
    if(byteLength>maxBytes)throw new Error('rehearsal-snapshot-too-large');
    return {raw:raw,exists:raw!==null,byteLength:byteLength,sha256:await sha(value)};
  }
  async function validateSnapshot(snapshot,maxBytes){
    if(!snapshot||typeof snapshot!=='object'||snapshot.exists!==(snapshot.raw!==null)||
      typeof snapshot.sha256!=='string'||typeof snapshot.byteLength!=='number')
      throw new Error('invalid-rehearsal-snapshot');
    var reconstructed=await capture(snapshot.raw,maxBytes);
    if(snapshot.byteLength!==reconstructed.byteLength||snapshot.sha256!==reconstructed.sha256)
      throw new Error('rehearsal-snapshot-changed');
    return reconstructed;
  }
  async function prepare(v3Raw,previousV4Raw){
    var svc=services();
    if(typeof v3Raw!=='string')throw new Error('v3-text-explicitly-required');
    if(previousV4Raw===undefined)throw new Error('v4-baseline-required');
    var originalV3=await capture(v3Raw,svc.storage.MAX_BYTES);
    var previousV4=await capture(previousV4Raw,svc.storage.MAX_BYTES);
    var extendedDraft=await svc.draft.build(v3Raw),report=await svc.draft.verify(extendedDraft);
    if(!report.valid||report.canWriteToV4!==false||report.originalSha256!==originalV3.sha256)
      throw new Error('source-audit-failed');
    // Deliberately retain the draft's non-production format and flags.
    // The candidate is NOT a valid operating V4 patient record.
    var candidate=await capture(JSON.stringify(extendedDraft),svc.storage.MAX_BYTES*2);
    return {
      format:FORMAT,schemaVersion:VERSION,status:'in-memory-only',
      readyForProduction:false,canWriteToV4:false,
      originalV3:originalV3,previousV4:previousV4,candidateV4:candidate,
      counts:{days:report.dayCount,questions:report.questionCount,
        medications:report.medicationCount,laboratoryResults:report.labCount}
    };
  }
  async function verify(plan){
    var svc=services();
    if(!plan||plan.format!==FORMAT||plan.schemaVersion!==VERSION||
      plan.status!=='in-memory-only'||plan.readyForProduction!==false||
      plan.canWriteToV4!==false)throw new Error('invalid-rehearsal-plan');
    var v3=await validateSnapshot(plan.originalV3,svc.storage.MAX_BYTES);
    var prior=await validateSnapshot(plan.previousV4,svc.storage.MAX_BYTES);
    var candidate=await validateSnapshot(plan.candidateV4,svc.storage.MAX_BYTES*2);
    if(!v3.exists||!candidate.exists)throw new Error('missing-rehearsal-data');
    var draft=await svc.draft.build(v3.raw),report=await svc.draft.verify(draft);
    if(report.originalSha256!==v3.sha256||JSON.stringify(draft)!==candidate.raw||
      JSON.stringify(plan.counts)!==JSON.stringify({days:report.dayCount,questions:report.questionCount,
        medications:report.medicationCount,laboratoryResults:report.labCount}))
      throw new Error('rehearsal-projection-changed');
    return {valid:true,status:'in-memory-only',canWriteToV4:false,
      sourceBytes:v3.byteLength,previousTargetExists:prior.exists,
      projectedBytes:candidate.byteLength,days:report.dayCount,questions:report.questionCount};
  }
  async function ensureObserved(plan,v3Raw,v4Raw,expectedV4){
    await verify(plan);
    if(typeof v3Raw!=='string'||(v4Raw!==null&&typeof v4Raw!=='string')||
      v3Raw!==plan.originalV3.raw||v4Raw!==expectedV4)
      throw new Error('rehearsal-conflict-current-record-changed');
  }
  async function simulateForward(plan,observedV3Raw,observedV4Raw){
    await ensureObserved(plan,observedV3Raw,observedV4Raw,plan.previousV4.raw);
    return {status:'simulated-only',productionWriteOccurred:false,
      v3Raw:observedV3Raw,v4Raw:plan.candidateV4.raw};
  }
  async function simulateRollback(plan,observedV3Raw,observedV4Raw){
    await ensureObserved(plan,observedV3Raw,observedV4Raw,plan.candidateV4.raw);
    return {status:'simulated-rollback-only',productionWriteOccurred:false,
      v3Raw:observedV3Raw,v4Raw:plan.previousV4.raw};
  }
  async function simulateCancel(plan,observedV3Raw,observedV4Raw){
    await ensureObserved(plan,observedV3Raw,observedV4Raw,plan.previousV4.raw);
    return {status:'simulated-cancel-only',productionWriteOccurred:false,
      v3Raw:observedV3Raw,v4Raw:observedV4Raw};
  }
  global.ApuDaV4MigrationRehearsal=Object.freeze({
    prepare:prepare,verify:verify,simulateForward:simulateForward,
    simulateRollback:simulateRollback,simulateCancel:simulateCancel
  });
})(typeof window!=='undefined'?window:globalThis);
