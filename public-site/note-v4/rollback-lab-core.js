/* ApuDa V4 rollback lab. Hard-coded synthetic fixtures, private in-memory Map.
 * No data imports, persistent storage adapters, network calls, or patient writes.
 */
(function(global){
  'use strict';
  var CASES=Object.freeze([
    {id:'normal',label:'정상 이전 후 원복',description:'체크포인트 저장 → 가상 후보 저장 → 원본 복구'},
    {id:'interruption',label:'저장 직후 중단',description:'후보 저장 직후 앱이 중단된 상황을 가정'},
    {id:'candidate-failure',label:'후보 저장 실패',description:'복구 정보 작성 후 두 번째 쓰기가 실패'},
    {id:'quota',label:'저장 공간 부족',description:'복구 정보도 저장할 공간이 없는 상황'},
    {id:'concurrent',label:'다른 탭에서 수정',description:'동시에 수정된 자료를 자동으로 덮어쓰지 않음'},
    {id:'corruption',label:'저장한 후보 손상',description:'저장 후 재조회값이 다르면 자동 복원 차단'}
  ]);
  var dataset={
    profile:{name:'가상 환자',cancer:'유방암',devices:[],rxCombo:[],rxPlan:[]},
    logs:[{date:'2026-11-10',temp:'36.8',tempReadings:[
      {value:'37.2',at:'2026-11-10T01:00:00Z'},
      {value:'36.8',at:'2026-11-10T08:00:00Z'}
    ],pain:'0',meal:'0',note:'가상 시험 자료입니다.'}],
    questions:[{question:'가상 질문 1'},{question:'가상 질문 2'},
      {question:'가상 질문 3'},{question:'가상 질문 4',priority:'high'}],
    meds:[{name:'가상 약 A',dose:'처방전 확인 필요'}],
    labs:[{date:'2026-11-09',wbc:'5.0',units:{wbc:'unknown'}}],
    roadmap:[],supports:[],distress:[],checks:{},triage:{items:[]},meta:{source:'synthetic-only'}
  };
  function services(){
    var migration=global.ApuDaV4MigrationRehearsal,checkpoint=global.ApuDaV4SandboxCheckpoint;
    if(!migration||!migration.prepare||!checkpoint||!checkpoint.create)
      throw new Error('sandbox-lab-services-required');
    return {migration:migration,checkpoint:checkpoint};
  }
  function code(error){
    return error&&typeof error.message==='string'?error.message:'sandbox-unknown-error';
  }
  function outcome(id,stageError,recoverError,staged,inspect){
    if(id==='normal'||id==='interruption'||id==='candidate-failure'){
      if(id==='normal'&&(stageError||!staged||staged.status!=='staged'))
        throw new Error('sandbox-unexpected-normal-stage');
      if(id==='interruption'&&(stageError||!staged||staged.status!=='interrupted'))
        throw new Error('sandbox-unexpected-interruption');
      if(id==='candidate-failure'&&stageError!=='sandbox-simulated-write-failure')
        throw new Error('sandbox-unexpected-write-failure');
      if(!inspect.targetMatchesBefore||recoverError)throw new Error('sandbox-unexpected-recovery-failure');
      return {kind:'restored',label:'가상 원본 복구 확인',description:'메모리 모의시험에서 이전 대상값으로 되돌아왔습니다.'};
    }
    if(id==='quota'){
      if(stageError!=='sandbox-simulated-quota-exceeded'||!inspect.targetMatchesBefore||inspect.checkpointExists)
        throw new Error('sandbox-unexpected-quota-result');
      return {kind:'blocked',label:'저장 전 차단',description:'복구 정보를 쓸 수 없어 후보값 저장을 시작하지 않았습니다.'};
    }
    var expectedStage=id==='concurrent'?'sandbox-concurrent-change':'sandbox-candidate-readback-mismatch';
    if(stageError!==expectedStage||recoverError!=='sandbox-target-conflict'||
       !inspect.checkpointVerified||inspect.targetMatchesBefore)
      throw new Error('sandbox-unexpected-conflict-result');
    return {kind:'manual',label:'자동 복원 보류',description:'다른 수정 또는 손상된 값을 덮어쓰지 않도록 차단했습니다. 실제 시스템이라면 별도 조사 절차가 필요합니다.'};
  }
  async function run(id){
    if(!CASES.some(function(item){return item.id===id;}))throw new Error('sandbox-unknown-scenario');
    var api=services(),source='\n'+JSON.stringify(dataset,null,2)+'\n';
    var prior=' {"prior":"가상 이전 V4 값"} ';
    var plan=await api.migration.prepare(source,prior),config={};
    if(id==='interruption')config.interruptAfterWrite=2;
    if(id==='candidate-failure')config.failWriteAt=2;
    if(id==='quota')config.maxBytes=64;
    if(id==='concurrent')config.injectConcurrentTarget='가상 다른 탭의 수정';
    if(id==='corruption')config.corruptWriteAt=2;
    var box=await api.checkpoint.create(plan,config),events=[];
    var stageError=null,recoverError=null,staged=null;
    try{staged=await box.stage();events.push({step:'후보 작성',kind:staged.status==='interrupted'?'interrupted':'ok',code:staged.status});}
    catch(error){stageError=code(error);events.push({step:'후보 작성',kind:'blocked',code:stageError});}
    if(id!=='quota'){
      try{var recovered=await box.recover();events.push({step:'복구 시도',kind:'ok',code:recovered.status});}
      catch(error){recoverError=code(error);events.push({step:'복구 시도',kind:'blocked',code:recoverError});}
    }else events.push({step:'복구 시도',kind:'skipped',code:'checkpoint-never-written'});
    var finalState=box.inspect();
    if(finalState.productionWriteOccurred!==false||finalState.v3OriginalUnchanged!==true)
      throw new Error('sandbox-source-safety-check-failed');
    return {
      scenario:id,syntheticOnly:true,productionWriteOccurred:false,
      sourceBytes:plan.originalV3.byteLength,questionCount:plan.counts.questions,
      state:{v3OriginalUnchanged:finalState.v3OriginalUnchanged,
        checkpointExists:finalState.checkpointExists,
        checkpointVerified:finalState.checkpointVerified,
        targetMatchesBefore:finalState.targetMatchesBefore,
        targetMatchesCandidate:finalState.targetMatchesCandidate,
        writeAttempts:finalState.writeAttempts},
      outcome:outcome(id,stageError,recoverError,staged,finalState),events:events
    };
  }
  global.ApuDaV4RollbackLab=Object.freeze({cases:CASES,run:run});
})(typeof window!=='undefined'?window:globalThis);
