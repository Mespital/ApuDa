/* Isolated V4 backup preflight tests. No browser/user storage access. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const base=path.resolve(__dirname,'../../public-site');
const read=(name)=>fs.readFileSync(path.join(base,name),'utf8');
const ctx={crypto:webcrypto,TextEncoder};ctx.window=ctx;vm.createContext(ctx);
[
  'note/note-storage.js','note-v4/v3-compat-audit.js',
  'note-v4/v3-lossless-stage.js','note-v4/v4-extended-draft.js',
  'note-v4/v4-migration-rehearsal.js','note-v4/v4-backup-preflight.js',
  'note-v4/backup-preflight-demo.js'
].forEach((name)=>vm.runInContext(read(name),ctx,{filename:name}));
const baseData={profile:{name:'가상 😷',cancer:'유방암'},
  logs:[{date:'2026-11-10',temp:'36.8',note:'원본 유지',tempReadings:
    [{value:'37.2',at:'08:00'},{value:'36.8',at:'11:00'}]}],
  questions:[{question:'질문1'},{question:'질문2'},{question:'질문3'},{question:'질문4'}],
  meds:[],labs:[],roadmap:[],supports:[],distress:[]};

(async()=>{
  const migration=ctx.ApuDaV4MigrationRehearsal,api=ctx.ApuDaV4BackupPreflight;
  const raw='\n'+JSON.stringify(baseData,null,2)+'\n';
  const plan=await migration.prepare(raw,'');
  const manifest=await api.manifest(plan);
  assert.equal(manifest.format,'apuda.note.v4.synthetic-backup-preflight');
  assert.equal(manifest.readyForProduction,false);
  assert.equal(manifest.snapshots.previousV4.exists,true,'empty string differs from missing key');
  assert.equal(manifest.counts.questions,4);
  assert.equal(JSON.stringify(manifest).includes('가상'),false,'no patient text in manifest');
  assert.equal((await api.verify(plan,manifest)).valid,true);
  const required= (await api.assess(plan,manifest,{v3Raw:raw,v4Raw:'',availableBytes:100*1024*1024})).estimatedHeadroomBytes;
  assert.ok(required>plan.candidateV4.byteLength,'checkpoint room should exceed candidate');
  const pass=await api.assess(plan,manifest,{v3Raw:raw,v4Raw:'',availableBytes:required});
  assert.equal(pass.status,'simulated-pass');
  assert.equal(pass.productionWriteOccurred,false);
  assert.equal(pass.readyForProduction,false);

  const tests=[
    [{v3Raw:raw+'다른 탭',v4Raw:'',availableBytes:required},'v3-conflict'],
    [{v3Raw:raw,v4Raw:'가상 수정',availableBytes:required},'target-conflict'],
    [{v3Raw:raw,v4Raw:'',availableBytes:required-1},'insufficient-capacity'],
    [{v3Raw:raw,v4Raw:'',availableBytes:null},'capacity-unknown']
  ];
  for(const [input,expected] of tests){
    const result=await api.assess(plan,manifest,input);
    assert.equal(result.status,'blocked');assert.equal(result.reason,expected);
    assert.equal(result.productionWriteOccurred,false);
  }
  await assert.rejects(api.assess(plan,manifest,{v3Raw:raw,v4Raw:''}),/explicit-observation-required/);
  await assert.rejects(api.assess(plan,manifest,{v3Raw:raw,v4Raw:'',availableBytes:-1}),/explicit-observation-required/);
  const tampered=JSON.parse(JSON.stringify(manifest));tampered.counts.questions=3;
  await assert.rejects(api.verify(plan,tampered),/manifest-mismatch/);
  const hashTampered=JSON.parse(JSON.stringify(manifest));hashTampered.manifestSha256='0'.repeat(64);
  await assert.rejects(api.verify(plan,hashTampered),/manifest-mismatch/);
  const fieldsTampered=JSON.parse(JSON.stringify(manifest));fieldsTampered.snapshots.originalV3.byteLength++;
  await assert.rejects(api.verify(plan,fieldsTampered),/manifest-mismatch/);
  const absentPlan=await migration.prepare(raw,null);
  const absentManifest=await api.manifest(absentPlan);
  assert.equal(absentManifest.snapshots.previousV4.exists,false);
  assert.equal((await api.assess(absentPlan,absentManifest,{v3Raw:raw,v4Raw:null,availableBytes:100*1024*1024})).status,'simulated-pass');
  assert.equal((await api.assess(absentPlan,absentManifest,{v3Raw:raw,v4Raw:'',availableBytes:100*1024*1024})).reason,'target-conflict');

  const runner=ctx.ApuDaV4BackupPreflightDemo;
  assert.equal(runner.scenarios.length,6);
  const decisions={pass:'pass','source-changed':'v3-conflict',
    'target-changed':'target-conflict',quota:'insufficient-capacity',
    unknown:'capacity-unknown',tamper:'manifest-mismatch'};
  for(const [id,reason] of Object.entries(decisions)){
    const result=await runner.run(id);
    assert.equal(result.syntheticOnly,true);
    assert.equal(result.manifestContainsPatientText,false);
    assert.equal(result.questionCount,4);
    assert.equal(result.report.reason,reason);
    assert.equal(result.report.productionWriteOccurred,false);
    assert.equal(result.report.readyForProduction,false);
    assert.equal(JSON.stringify(result).includes('가상 환자'),false);
  }
  await assert.rejects(runner.run('other'),/unknown-scenario/);

  const html=read('note-v4/backup-preflight.html');
  assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/해시\(SHA-256\)는 손상 확인용이며 암호화·전자서명이 아닙니다/);
  assert.equal((html.match(/<option value=/g)||[]).length,6);
  assert.doesNotMatch(html,/<input[^>]*type=["']file/i);
  for(const file of ['note-v4/v4-backup-preflight.js',
    'note-v4/backup-preflight-demo.js','note-v4/backup-preflight-ui.js']){
    assert.doesNotMatch(read(file),/\b(?:indexedDB|localStorage|sessionStorage|fetch|XMLHttpRequest|WebSocket)\b/);
  }
  assert.doesNotMatch(read('note-v4/index.html'),/v4-backup-preflight\.js/);
  assert.doesNotMatch(read('note/note-app.js'),/ApuDaV4BackupPreflight/);
  console.log('PASS: synthetic backup manifest, SHA/byte counts, exact-source conflict, conservative capacity blocks, null vs empty, no production writes');
})().catch(error=>{console.error(error);process.exitCode=1;});
