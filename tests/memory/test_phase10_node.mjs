import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {encryptArchive,decryptArchive,planIndexedDbMigration} from '../../public-site/memory/secure-archive.mjs';

const raw={format:'apuda-memory-care-diary',version:2,entries:[
  {id:'alpha',date:'2026-11-12',text:'허구의 테스트 기록',question:'가상 상담 질문입니다',sleep:'보통'}
]};
const password='테스트 전용 암호, 실제 환자 데이터가 아님 2026';

const t=performance.now();
const encrypted=await encryptArchive(raw,password,{webCrypto:webcrypto});
const encryptionMs=Math.round(performance.now()-t);
const t2=performance.now();
const decrypted=await decryptArchive(encrypted,password,{webCrypto:webcrypto});
const decryptionMs=Math.round(performance.now()-t2);
assert.deepEqual(decrypted,raw);
assert.equal(encrypted.cipher,'AES-256-GCM');
assert.equal(encrypted.iterations,600000);
assert.ok(!JSON.stringify(encrypted).includes('허구의'));
await assert.rejects(decryptArchive(encrypted,'wrong-password-1234',{webCrypto:webcrypto}),/암호가 틀리거나/);
const changed={...encrypted,ciphertext:(encrypted.ciphertext[0]==='A'?'B':'A')+encrypted.ciphertext.slice(1)};
await assert.rejects(decryptArchive(changed,password,{webCrypto:webcrypto}),/암호가 틀리거나/);
assert.equal(planIndexedDbMigration(raw,[{...raw.entries[0]}]).ready,true);
assert.equal(planIndexedDbMigration(raw,[{...raw.entries[0],text:'충돌'}]).ready,false);
const badBackups=[null,{}, {...raw,version:3},
  {...raw,entries:[{...raw.entries[0],date:'2026-02-30'}]},
  {...raw,entries:[{...raw.entries[0],unrecognized:'lossy'}]}];
for(const bad of badBackups){
  await assert.rejects(encryptArchive(bad,password,{webCrypto:webcrypto}));
}
console.log('PASS: Phase 10 Node WebCrypto round-trip, tamper, password, schema, migration preflight');
console.log(JSON.stringify({engine:process.version,encryptionMs,decryptionMs,syntheticOnly:true}));
