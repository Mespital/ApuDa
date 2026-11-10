/* Six-scenario synthetic-only rollback laboratory regression test. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const scope={crypto:webcrypto,TextEncoder};
scope.window=scope;
vm.createContext(scope);
[
  'note/note-storage.js',
  'note-v4/v3-compat-audit.js',
  'note-v4/v3-lossless-stage.js',
  'note-v4/v4-extended-draft.js',
  'note-v4/v4-migration-rehearsal.js',
  'note-v4/v4-sandbox-checkpoint.js',
  'note-v4/rollback-lab-core.js'
].forEach((name)=>vm.runInContext(read(name),scope,{filename:name}));

(async()=>{
  const api=scope.ApuDaV4RollbackLab;
  assert.equal(api.cases.length,6);
  const expected={
    normal:{kind:'restored',matches:true,writes:3,checkpoint:true,events:['staged','recovered']},
    interruption:{kind:'restored',matches:true,writes:3,checkpoint:true,events:['interrupted','recovered']},
    'candidate-failure':{kind:'restored',matches:true,writes:2,checkpoint:true,events:['sandbox-simulated-write-failure','recovered']},
    quota:{kind:'blocked',matches:true,writes:1,checkpoint:false,events:['sandbox-simulated-quota-exceeded','checkpoint-never-written']},
    concurrent:{kind:'manual',matches:false,writes:1,checkpoint:true,events:['sandbox-concurrent-change','sandbox-target-conflict']},
    corruption:{kind:'manual',matches:false,writes:2,checkpoint:true,events:['sandbox-candidate-readback-mismatch','sandbox-target-conflict']}
  };
  for(const [id,want] of Object.entries(expected)){
    const data=await api.run(id);
    assert.equal(data.scenario,id);
    assert.equal(data.syntheticOnly,true,`${id}: should never import real data`);
    assert.equal(data.productionWriteOccurred,false,`${id}: production write`);
    assert.equal(data.state.v3OriginalUnchanged,true,`${id}: V3 must survive`);
    assert.equal(data.questionCount,4,`${id}: no question truncation`);
    assert.equal(data.outcome.kind,want.kind,`${id}: wrong outcome`);
    assert.equal(data.state.targetMatchesBefore,want.matches,`${id}: rollback state`);
    assert.equal(data.state.checkpointExists,want.checkpoint,`${id}: checkpoint state`);
    assert.equal(data.state.writeAttempts,want.writes,`${id}: write count`);
    assert.deepEqual(Array.from(data.events,e=>e.code),want.events,`${id}: expected event trace`);
    assert.ok(data.sourceBytes>0,`${id}: synthetic source size`);
    assert.equal(JSON.stringify(data).includes('가상 환자'),false,`${id}: no source payload in result`);
  }
  await assert.rejects(api.run('unknown'),/sandbox-unknown-scenario/);
  const html=read('note-v4/rollback-lab.html');
  assert.match(html,/<html lang="ko">/);
  assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/form-action 'none'/);
  assert.match(html,/가상 기록 100%/);
  assert.match(html,/시험 성공이 실제 복원 안전성을 보증하지 않습니다/);
  assert.equal((html.match(/<option value=/g)||[]).length,6);
  assert.doesNotMatch(html,/<input[^>]*type=["']file/i);
  const core=read('note-v4/rollback-lab-core.js');
  const ui=read('note-v4/rollback-lab.js');
  for(const [name,source] of [['core',core],['ui',ui]]){
    assert.doesNotMatch(source,/\b(?:indexedDB|localStorage|sessionStorage|fetch|XMLHttpRequest|WebSocket)\b/,`${name}: forbidden persistent/network API`);
  }
  assert.doesNotMatch(read('note-v4/index.html'),/rollback-lab(-core)?\.js/);
  assert.doesNotMatch(read('note/note-app.js'),/ApuDaV4RollbackLab/);
  console.log('PASS: six synthetic rollback outcomes, 4 questions intact, V3 untouched, no patient/network/persistent-storage path');
})().catch((error)=>{console.error(error);process.exitCode=1;});
