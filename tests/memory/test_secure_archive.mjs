import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {encryptArchive,decryptArchive,planIndexedDbMigration,KDF_ITERATIONS} from '../../public-site/memory/secure-archive.mjs';

const options={webCrypto:webcrypto};
const passphrase='이것은 실존하지 않는 테스트용 긴 암호입니다 2026!';
const backup={format:'apuda-memory-care-diary',version:2,exportedAt:'2026-11-12T00:00:00.000Z',entries:[
  {id:'id-1',date:'2026-11-11',text:'가상의 테스트 문장 📝',sleep:'보통',question:'진료 질문은?'},
  {id:'id-2',date:'2026-11-12',text:'실제 환자정보 아님',medicationCheck:'확인 필요'}]};
const encrypted=await encryptArchive(backup,passphrase,options);
assert.equal(encrypted.cipher,'AES-256-GCM');
assert.equal(encrypted.iterations,KDF_ITERATIONS);
assert.equal(encrypted.format,'apuda-memory-encrypted-archive');
assert.ok(!JSON.stringify(encrypted).includes('가상의 테스트 문장'));
const restored=await decryptArchive(encrypted,passphrase,options);
assert.deepEqual(restored,backup);
await assert.rejects(decryptArchive(encrypted,'wrong passphrase but long',options),/암호가 틀리거나/);
const tampered={...encrypted,ciphertext:'A'+encrypted.ciphertext.slice(1)};
await assert.rejects(decryptArchive(tampered,passphrase,options),/암호가 틀리거나/);
const badHeader={...encrypted,iterations:10000};
await assert.rejects(decryptArchive(badHeader,passphrase,options),/지원하지 않거나/);
await assert.rejects(encryptArchive(backup,'short',options),/12자 이상/);
await assert.rejects(encryptArchive({...backup,entries:[{...backup.entries[0],date:'2026-02-30'}]},passphrase,options),/날짜/);
await assert.rejects(encryptArchive({...backup,entries:[{...backup.entries[0],rogue:'lose me'}]},passphrase,options),/지원하지 않는/);
const encryptedAgain=await encryptArchive(backup,passphrase,options);
assert.notEqual(encrypted.iv,encryptedAgain.iv,'unique nonce per new key');
assert.notEqual(encrypted.salt,encryptedAgain.salt,'unique random salt');
const migratable=planIndexedDbMigration(backup,[{...backup.entries[0]}]);
assert.equal(migratable.ready,true);
assert.equal(migratable.wouldAdd,1);
assert.equal(migratable.alreadyPresent,1);
assert.equal(migratable.copyCandidates[0].id,'id-2');
assert.equal(planIndexedDbMigration(backup,[{...backup.entries[0],text:'conflict'}]).ready,false);
assert.equal(planIndexedDbMigration(backup,[{...backup.entries[0],text:'conflict'}]).conflictCount,1);
assert.deepEqual(backup.entries.map(x=>x.id),['id-1','id-2'],'original records unmodified');
console.log('PASS: Web Crypto roundtrip, wrong passphrase, authenticated tamper protection, header rejection, schema validation, salt/iv uniqueness, migration dry-run conflict detection');
