import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {emptyProfileVault,addAnonymousProfile,appendScopedRecord} from '../../public-site/memory/profile-scope.mjs';
import {exportProfileBackup,planProfileImport} from '../../public-site/memory/profile-workflow.mjs';
import {
  encryptScopedBackup,decryptScopedBackup,SCOPED_ENCRYPTED_FORMAT
} from '../../public-site/memory/scoped-secure-archive.mjs';
const A='e4ad61f3-4cf2-40a8-a38c-1d098c91d643';
const B='e3c55b7d-26ba-4d56-9c78-2875b04f9079';
const password='ApuDa 테스트 전용 긴 암호 2026! 실제 비밀번호 아님';
const options={webCrypto:webcrypto};
const record=(id,text,extra={})=>({id,date:'2026-11-12',text,...extra});
let vault=addAnonymousProfile(addAnonymousProfile(emptyProfileVault(),A),B);
for(let i=0;i<20;i++){
  vault=appendScopedRecord(vault,i===0?B:A,record(
    'qa-'+i,i===0?'비공개 가상 대상 B 기록':'대상 A의 합성 관찰 기록 '+i,
    {question:i===0?'B 가족 질문':'A 진료 질문 '+i,sleep:'보통',meal:'좋음'}
  ));
}
const backupA=exportProfileBackup(vault,A);
const original=JSON.stringify(vault);
const initial=JSON.stringify(backupA);
assert.equal(backupA.entries.length,19);
assert.ok(!initial.includes('비공개 가상 대상 B 기록'));
const start=performance.now();
const encrypted=await encryptScopedBackup(backupA,password,options);
const encryptMs=Math.round(performance.now()-start);
assert.equal(encrypted.format,SCOPED_ENCRYPTED_FORMAT);
assert.equal(encrypted.iterations,600000);
const cipherText=JSON.stringify(encrypted);
assert.ok(!cipherText.includes('대상 A의 합성'));
assert.ok(!cipherText.includes(A),'outer envelope does not reveal profileId');
assert.ok(!cipherText.includes('A 진료 질문'));
const decryptStart=performance.now();
const recovered=await decryptScopedBackup(encrypted,password,A,options);
const decryptMs=Math.round(performance.now()-decryptStart);
assert.deepEqual(recovered,backupA);
assert.equal(JSON.stringify(vault),original);
assert.equal(JSON.stringify(backupA),initial);
assert.equal(planProfileImport(vault,A,recovered).alreadyPresent,19);
assert.equal(planProfileImport(vault,A,recovered).wouldAdd,0);
assert.equal(recovered.entries.some(x=>x.text.includes('비공개 가상 대상 B 기록')),false);
await assert.rejects(decryptScopedBackup(encrypted,password,B,options),/백업의 대상자가/);
await assert.rejects(decryptScopedBackup(encrypted,password,undefined,options),/먼저 명시적/);
await assert.rejects(decryptScopedBackup(encrypted,'전혀다른테스트비밀번호!!',A,options),
  /암호가 틀리거나/);
const tampered={...encrypted,
  ciphertext:(encrypted.ciphertext[0]==='A'?'B':'A')+encrypted.ciphertext.slice(1)};
await assert.rejects(decryptScopedBackup(tampered,password,A,options),/암호가 틀리거나/);
const tamperedSalt={...encrypted,salt:'AAAAAAAAAAAAAAAAAAAAAA=='};
await assert.rejects(decryptScopedBackup(tamperedSalt,password,A,options),/암호가 틀리거나/);
const tamperedIv={...encrypted,iv:'AAAAAAAAAAAAAAAA'};
await assert.rejects(decryptScopedBackup(tamperedIv,password,A,options),/암호가 틀리거나/);
await assert.rejects(decryptScopedBackup({...encrypted,iterations:1000},password,A,options),/형식/);
await assert.rejects(decryptScopedBackup({...encrypted,kdf:'PBKDF2-SHA1'},password,A,options),/형식/);
await assert.rejects(decryptScopedBackup({...encrypted,sourceProfileId:A},password,A,options),/형식/);
await assert.rejects(decryptScopedBackup({...encrypted,salt:'not-base64!'},password,A,options),/Base64/);
await assert.rejects(encryptScopedBackup({format:'apuda-memory-care-diary',version:2,entries:[
  record('legacy','legacy cannot mix')
]},password,options),/전용 JSON/);
await assert.rejects(encryptScopedBackup({...backupA,entries:[
  {...backupA.entries[0],unknownMedicalField:'must not silently discard'}
]},password,options),/허용하지 않은/);
await assert.rejects(encryptScopedBackup({...backupA,entries:[
  backupA.entries[0],backupA.entries[0]
]},password,options),/중복/);
await assert.rejects(encryptScopedBackup(backupA,'short',options),/12자/);
const emptyProfile=addAnonymousProfile(emptyProfileVault(),A);
const emptyExport=exportProfileBackup(emptyProfile,A);
const emptyEnvelope=await encryptScopedBackup(emptyExport,password,options);
assert.deepEqual(await decryptScopedBackup(emptyEnvelope,password,A,options),emptyExport,
  'empty profile is supported and preserved, not mixed with B');
console.log('PASS: 19-row profile AES-256-GCM roundtrip, no plaintext/ID in envelope, exact-target check, tamper/wrong-password rejection, strict schema, empty backup, no mutation');
console.log(JSON.stringify({engine:process.version,syntheticOnly:true,records:19,
  encryptMs,decryptMs,performanceNotMobile:true}));
