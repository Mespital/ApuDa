import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {encryptArchive,decryptArchive,KDF_ITERATIONS} from '../../public-site/memory/secure-archive.mjs';

/**
 * Node-only synthetic benchmark. Never use real medical data.
 * Durations describe this host only, NOT Android/iOS performance.
 * No fixed performance threshold is asserted.
 */
const passphrase='가상 건강기록 성능검사 전용 2026. 실제 비밀번호 사용 금지!';
const opts={webCrypto:webcrypto};
const backup={format:'apuda-memory-care-diary',version:2,
  exportedAt:'2026-11-12T00:00:00.000Z',
  entries:Array.from({length:20},(_,i)=>({
    id:'synthetic-'+String(i+1).padStart(2,'0'),
    date:'2026-11-12',
    text:'합성 관찰 문장 '+i+' · 실존하지 않는 사용자',
    question:'가상 진료 질문 '+i+' · 실제 처방 아님',
    sleep:'보통',meal:'좋음',medicationCheck:'확인 필요'
  }))
};
assert.equal(KDF_ITERATIONS,600000);
const encryptMs=[],decryptMs=[];
for(let i=0;i<3;i++){
  const start=performance.now();
  const encrypted=await encryptArchive(backup,passphrase,opts);
  encryptMs.push(Math.round(performance.now()-start));
  assert.equal(encrypted.cipher,'AES-256-GCM');
  assert.ok(!JSON.stringify(encrypted).includes('합성 관찰 문장'));
  const readStart=performance.now();
  const readback=await decryptArchive(encrypted,passphrase,opts);
  decryptMs.push(Math.round(performance.now()-readStart));
  assert.deepEqual(readback,backup);
  await assert.rejects(decryptArchive(encrypted,'잘못된 합성 암호 문장입니다',opts),/암호가 틀리거나/);
  const tampered={...encrypted,
    ciphertext:(encrypted.ciphertext[0]==='A'?'B':'A')+encrypted.ciphertext.slice(1)};
  await assert.rejects(decryptArchive(tampered,passphrase,opts),/암호가 틀리거나/);
}
const median=values=>values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)];
console.log('PASS: synthetic 20-entry WebCrypto archive benchmark, roundtrip, wrong-passphrase and tamper detection');
console.log(JSON.stringify({engine:process.version,samples:3,recordsPerSample:20,
  encryptMsMedian:median(encryptMs),decryptMsMedian:median(decryptMs),
  minEncryptMs:Math.min(...encryptMs),minDecryptMs:Math.min(...decryptMs),
  timingScope:'Node host only; mobile device testing pending'}));
