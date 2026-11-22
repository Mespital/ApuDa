/* ApuDa V4 extended draft MODEL, not a migration or a live store.
 * Explicit input only. No local/session storage, network, import, upload or writes.
 * An intact V3 archival-stage envelope is the canonical source of truth.
 */
(function(global){
  'use strict';
  var FORMAT='apuda.note.v4.extended-draft', VERSION=1;
  var known=['profile','logs','questions','meds','labs','roadmap','supports','distress','checks','triage','meta'];
  function services(){
    var storage=global.ApuDaNoteStorage,audit=global.ApuDaV3Compatibility,archive=global.ApuDaV3LosslessStage;
    if(!storage||!storage.unpack||!audit||!audit.inspect||!archive||!archive.stage||!archive.verify||!archive.originalJSON)
      throw new Error('draft-services-required');
    return {storage:storage,audit:audit,archive:archive};
  }
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function has(obj,key){return Object.prototype.hasOwnProperty.call(obj,key);}
  function rawOrNull(obj,key){return has(obj,key)?clone(obj[key]):null;}
  function numbersEqual(left,right){return JSON.stringify(left)===JSON.stringify(right);}
  function createView(state,check){
    var extras={};
    Object.keys(state).forEach(function(key){if(known.indexOf(key)<0)extras[key]=clone(state[key]);});
    return {
      profile:clone(state.profile),
      days:state.logs.map(function(row,i){
        var day=check.days[i];
        var readings=Array.isArray(row.tempReadings)?clone(row.tempReadings):[];
        return {
          sourceIndex:i,legacyId:rawOrNull(row,'id'),date:row.date,
          author:row.author==='본인'||row.author==='보호자'?row.author:null,
          authorStatus:row.author==='본인'||row.author==='보호자'?'recorded':'unverified',
          temperature:{
            latest:day.latestTemperature,maximum:day.maximumTemperature,
            rawLastValue:rawOrNull(row,'temp'),readings:readings,
            // Never infer a measurement time for the separate V3 temp field.
            lastFieldTimeKnown:false
          },
          pain:{rawScore:rawOrNull(row,'pain'),rawSite:rawOrNull(row,'painSite')},
          meal:{rawPercent:rawOrNull(row,'meal'),mappedCategory:null},
          note:rawOrNull(row,'note'),
          // Full V3 record is an intentional non-lossy extension, including
          // unforeseen fields. Do not replace it with normalized selections.
          sourceRecord:clone(row)
        };
      }),
      questions:clone(state.questions||[]),
      medications:clone(state.meds||[]),
      laboratoryResults:clone(state.labs||[]),
      appointmentsAndCarePlan:clone(state.roadmap||[]),
      support:clone(state.supports||[]),
      distress:clone(state.distress||[]),
      medicationChecks:clone(state.checks||{}),
      emergencyChecks:clone(state.triage||{}),
      metadata:clone(state.meta||{}),
      extensions:extras
    };
  }
  async function build(input){
    var svc=services(),archive=await svc.archive.stage(input);
    // stage() validates V3. Verify before building even an ephemeral view.
    await svc.archive.verify(archive);
    var source=svc.storage.unpack(archive.original.raw),check=svc.audit.inspect(archive.original.raw);
    var draft={format:FORMAT,schemaVersion:VERSION,status:'proposal-not-imported',
      readyForProduction:false,canWriteToV4:false,
      sourceArchive:archive,view:createView(source,check)};
    return draft;
  }
  async function verify(draft){
    var svc=services();
    if(!draft||draft.format!==FORMAT||draft.schemaVersion!==VERSION||
       draft.status!=='proposal-not-imported'||draft.readyForProduction!==false||draft.canWriteToV4!==false||
       !draft.sourceArchive||!draft.view)throw new Error('invalid-v4-draft');
    var checked=await svc.archive.verify(draft.sourceArchive),raw=await svc.archive.originalJSON(draft.sourceArchive);
    var source=svc.storage.unpack(raw),audit=svc.audit.inspect(raw),expected=createView(source,audit);
    if(!numbersEqual(draft.view,expected))throw new Error('draft-view-changed');
    return {valid:true,readyForProduction:false,canWriteToV4:false,
      originalBytes:checked.byteLength,originalSha256:checked.sha256,
      dayCount:expected.days.length,questionCount:expected.questions.length,
      medicationCount:expected.medications.length,labCount:expected.laboratoryResults.length};
  }
  async function originalJSON(draft){
    await verify(draft);
    return services().archive.originalJSON(draft.sourceArchive);
  }
  global.ApuDaV4ExtendedDraft=Object.freeze({build:build,verify:verify,originalJSON:originalJSON});
})(typeof window!=='undefined'?window:globalThis);
