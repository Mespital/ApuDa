/* V4 backup preflight CONTRACT. Explicit in-memory values only.
 * It has no storage adapter, import/export, network, file, or patient-data path.
 * SHA-256 detects accidental changes; it is neither encryption nor an
 * authenticated signature. None of these results authorizes real writes.
 */
(function(global){
  'use strict';
  var FORMAT='apuda.note.v4.synthetic-backup-preflight',VERSION=1;
  function services(){
    var migration=global.ApuDaV4MigrationRehearsal;
    if(!migration||!migration.verify||!global.crypto||!global.crypto.subtle||
       typeof TextEncoder==='undefined')throw new Error('preflight-services-required');
    return migration;
  }
  function bytes(value){return new TextEncoder().encode(value).byteLength;}
  async function digest(value){
    var buf=await global.crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buf)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');
  }
  function canonical(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    return '{'+Object.keys(value).sort().map(function(key){
      return JSON.stringify(key)+':'+canonical(value[key]);
    }).join(',')+'}';
  }
  function info(snapshot){return {
    exists:snapshot.exists,byteLength:snapshot.byteLength,sha256:snapshot.sha256
  };}
  async function manifest(plan){
    await services().verify(plan);
    var body={format:FORMAT,schemaVersion:VERSION,mode:'synthetic-dry-run',
      readyForProduction:false,source:'explicit-memory-values',
      snapshots:{originalV3:info(plan.originalV3),previousV4:info(plan.previousV4),
        candidateV4:info(plan.candidateV4)},
      counts:{days:plan.counts.days,questions:plan.counts.questions,
        medications:plan.counts.medications,laboratoryResults:plan.counts.laboratoryResults}};
    return Object.assign(body,{manifestSha256:await digest(canonical(body))});
  }
  async function verify(plan,value){
    if(!value||typeof value!=='object'||Array.isArray(value))
      throw new Error('preflight-invalid-manifest');
    var expected=await manifest(plan);
    if(canonical(value)!==canonical(expected))throw new Error('preflight-manifest-mismatch');
    return {valid:true,sourceBytes:expected.snapshots.originalV3.byteLength,
      baselineExists:expected.snapshots.previousV4.exists,
      candidateBytes:expected.snapshots.candidateV4.byteLength,
      questions:expected.counts.questions,readyForProduction:false};
  }
  function estimatedHeadroom(plan){
    var cp=JSON.stringify({format:'apuda.note.v4.sandbox-checkpoint',schemaVersion:1,
      originalV3:plan.originalV3.raw,previousV4:plan.previousV4.raw,
      candidateV4:plan.candidateV4.raw,
      sourceSha256:plan.originalV3.sha256,beforeSha256:plan.previousV4.sha256,
      candidateSha256:plan.candidateV4.sha256});
    // A deliberately conservative synthetic estimate, NOT a browser quota guarantee.
    return 2*(bytes(cp)+bytes(plan.candidateV4.raw))+4096;
  }
  async function assess(plan,value,observed){
    await verify(plan,value);
    if(!observed||typeof observed!=='object'||
       typeof observed.v3Raw!=='string'||
       (observed.v4Raw!==null&&typeof observed.v4Raw!=='string')||
       !(Object.prototype.hasOwnProperty.call(observed,'availableBytes'))||
       (observed.availableBytes!==null&&
        (!Number.isSafeInteger(observed.availableBytes)||observed.availableBytes<0)))
      throw new Error('preflight-explicit-observation-required');
    var estimate=estimatedHeadroom(plan),code='pass';
    if(observed.v3Raw!==plan.originalV3.raw)code='v3-conflict';
    else if(observed.v4Raw!==plan.previousV4.raw)code='target-conflict';
    else if(observed.availableBytes===null)code='capacity-unknown';
    else if(observed.availableBytes<estimate)code='insufficient-capacity';
    return {mode:'synthetic-dry-run',status:code==='pass'?'simulated-pass':'blocked',
      reason:code,estimatedHeadroomBytes:estimate,availableBytes:observed.availableBytes,
      originalV3Unchanged:observed.v3Raw===plan.originalV3.raw,
      previousV4Unchanged:observed.v4Raw===plan.previousV4.raw,
      manifestVerified:true,productionWriteOccurred:false,readyForProduction:false};
  }
  global.ApuDaV4BackupPreflight=Object.freeze({manifest:manifest,verify:verify,assess:assess});
})(typeof window!=='undefined'?window:globalThis);
