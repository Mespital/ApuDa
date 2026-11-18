/* Synthetic fixture and scenario runner; no user record inputs. */
(function(global){
  'use strict';
  var SCENARIOS=Object.freeze([
    {id:'pass',label:'원본·용량 사전검사 통과'},
    {id:'source-changed',label:'V3 원본이 중간에 수정됨'},
    {id:'target-changed',label:'기존 V4 대상이 수정됨'},
    {id:'quota',label:'예상 여유 공간 부족'},
    {id:'unknown',label:'여유 공간을 확인할 수 없음'},
    {id:'tamper',label:'백업 목록(Manifest) 변조'}
  ]);
  var fixture={profile:{name:'가상 환자',cancer:'유방암'},
    logs:[{date:'2026-11-10',temp:'36.8',tempReadings:[{value:'37.2',at:'08:00'},
      {value:'36.8',at:'11:00'}],note:'가상 자료'}],
    questions:[{question:'가상 질문 1'},{question:'가상 질문 2'},
      {question:'가상 질문 3'},{question:'가상 질문 4'}],meds:[],labs:[],
    roadmap:[],supports:[],distress:[]};
  async function run(id){
    if(!SCENARIOS.some(function(item){return item.id===id;}))
      throw new Error('preflight-unknown-scenario');
    var migration=global.ApuDaV4MigrationRehearsal,preflight=global.ApuDaV4BackupPreflight;
    if(!migration||!preflight)throw new Error('preflight-demo-services-required');
    var plan=await migration.prepare(JSON.stringify(fixture),' {"old":"synthetic baseline"} ');
    var value=await preflight.manifest(plan);
    var observed={v3Raw:plan.originalV3.raw,v4Raw:plan.previousV4.raw,
      availableBytes:100*1024*1024};
    if(id==='source-changed')observed.v3Raw+='가상 동시 수정';
    if(id==='target-changed')observed.v4Raw='가상 다른 탭 수정';
    if(id==='quota')observed.availableBytes=64;
    if(id==='unknown')observed.availableBytes=null;
    if(id==='tamper')value.snapshots.originalV3.sha256='0'.repeat(64);
    var result;
    try{result=await preflight.assess(plan,value,observed);}
    catch(error){
      if(id!=='tamper'||error.message!=='preflight-manifest-mismatch')throw error;
      result={mode:'synthetic-dry-run',status:'blocked',reason:'manifest-mismatch',
        estimatedHeadroomBytes:null,availableBytes:observed.availableBytes,
        originalV3Unchanged:true,previousV4Unchanged:true,
        manifestVerified:false,productionWriteOccurred:false,readyForProduction:false};
    }
    return {scenario:id,questionCount:plan.counts.questions,syntheticOnly:true,
      manifestContainsPatientText:false,report:result};
  }
  global.ApuDaV4BackupPreflightDemo=Object.freeze({scenarios:SCENARIOS,run:run});
})(typeof window!=='undefined'?window:globalThis);
