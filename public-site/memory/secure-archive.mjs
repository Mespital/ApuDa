/**
 * ApuDa Memory prototype: password-protected archive, NOT wired to the production UI.
 * No storage, network, logging, or document side effects.
 * Version 1 envelope uses PBKDF2-HMAC-SHA-256 (600k) + AES-256-GCM, 128-bit tag.
 */
export const ARCHIVE_FORMAT = 'apuda-memory-encrypted-archive';
export const ARCHIVE_VERSION = 1;
export const KDF_ITERATIONS = 600000;
const MAX_PLAINTEXT_BYTES = 256 * 1024;
const MAX_ENVELOPE_BYTES = 384 * 1024;
const LABEL = 'APUDA-MEMORY-ENCRYPTED-ARCHIVE-V1';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const validDates = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isFinite(d.valueOf()) && d.toISOString().slice(0,10) === s;
};
const allowed = {
  sleep: ['좋음','보통','나쁨'],
  meal: ['좋음','보통','부족'],
  medicationCheck: ['확인함','확인 필요','문의 사항 있음']
};
function checkPlain(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)
      || backup.format !== 'apuda-memory-care-diary'
      || ![1,2].includes(backup.version) || !Array.isArray(backup.entries)
      || backup.entries.length === 0 || backup.entries.length > 20) throw new Error('잘못된 돌봄 기록 백업 형식입니다.');
  const seen = new Set();
  for (const r of backup.entries) {
    if (!r || typeof r !== 'object' || Array.isArray(r)
        || typeof r.id !== 'string' || r.id.length < 1 || r.id.length > 100 || seen.has(r.id)
        || !validDates(r.date) || typeof r.text !== 'string' || !r.text.trim() || r.text.length > 1000) {
      throw new Error('기록에 날짜, ID 또는 메모 오류가 있습니다.');
    }
    const keys = Object.keys(r);
    if (keys.some(k => !['id','date','text','sleep','meal','medicationCheck','question'].includes(k))) {
      throw new Error('지원하지 않는 기록 필드가 있습니다. 기록 손실을 방지하기 위해 중단했습니다.');
    }
    if (backup.version === 1 && keys.some(k => !['id','date','text'].includes(k))) {
      throw new Error('V1 기록에 V2 전용 필드가 있습니다.');
    }
    for (const [field,options] of Object.entries(allowed)) {
      if (field in r && !options.includes(r[field])) throw new Error('관찰 항목이 유효하지 않습니다.');
    }
    if ('question' in r && (typeof r.question !== 'string' || !r.question.trim() || r.question.length > 300)) {
      throw new Error('의료진 질문이 유효하지 않습니다.');
    }
    seen.add(r.id);
  }
  const plain = JSON.stringify(backup);
  if (encoder.encode(plain).byteLength > MAX_PLAINTEXT_BYTES) throw new Error('백업 데이터가 제한 용량을 초과했습니다.');
  return plain;
}
function b64(bytes) {
  let s=''; for(const byte of bytes) s+=String.fromCharCode(byte);
  return btoa(s);
}
function decodeB64(value, expectedLength) {
  if (typeof value !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('암호화 파일의 형식이 올바르지 않습니다.');
  }
  const raw=atob(value);
  if (expectedLength !== undefined && raw.length !== expectedLength) throw new Error('암호화 파일의 길이가 올바르지 않습니다.');
  return Uint8Array.from(raw,ch=>ch.charCodeAt(0));
}
function checkPassword(passphrase) {
  if (typeof passphrase !== 'string' || passphrase.length < 12 || encoder.encode(passphrase).length > 1024) {
    throw new Error('암호는 12자 이상 1,024바이트 이하로 입력해야 합니다.');
  }
}
async function keyFor(passphrase,salt,iterations,webCrypto) {
  const raw=await webCrypto.subtle.importKey('raw',encoder.encode(passphrase),'PBKDF2',false,['deriveKey']);
  return webCrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},raw,
    {name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
function requireCrypto(webCrypto) {
  if (!webCrypto?.subtle?.deriveKey || !webCrypto?.getRandomValues) throw new Error('HTTPS Web Crypto 기능을 사용할 수 없습니다.');
}
/** Encrypt validated V1/V2 JSON records; encrypted output is NOT yet a supported restore input. */
export async function encryptArchive(backup,passphrase,{ webCrypto=globalThis.crypto }={}) {
  requireCrypto(webCrypto);
  checkPassword(passphrase);
  const cleartext=checkPlain(backup);
  const salt=webCrypto.getRandomValues(new Uint8Array(16));
  const iv=webCrypto.getRandomValues(new Uint8Array(12));
  const key=await keyFor(passphrase,salt,KDF_ITERATIONS,webCrypto);
  const ciphertext=await webCrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(LABEL),tagLength:128},key,encoder.encode(cleartext));
  return {format:ARCHIVE_FORMAT,version:ARCHIVE_VERSION,kdf:'PBKDF2-HMAC-SHA-256',iterations:KDF_ITERATIONS,
    cipher:'AES-256-GCM',salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))};
}
/** Decrypt but NEVER persist. Caller must separately verify and confirm any import. */
export async function decryptArchive(envelope,passphrase,{ webCrypto=globalThis.crypto }={}) {
  requireCrypto(webCrypto);
  checkPassword(passphrase);
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)
      || envelope.format !== ARCHIVE_FORMAT || envelope.version !== ARCHIVE_VERSION
      || envelope.kdf !== 'PBKDF2-HMAC-SHA-256' || envelope.cipher !== 'AES-256-GCM'
      || envelope.iterations !== KDF_ITERATIONS || JSON.stringify(envelope).length > MAX_ENVELOPE_BYTES
      || Object.keys(envelope).sort().join(',') !== 'cipher,ciphertext,format,iterations,iv,kdf,salt,version') {
    throw new Error('지원하지 않거나 손상된 암호화 백업 형식입니다.');
  }
  const salt=decodeB64(envelope.salt,16),iv=decodeB64(envelope.iv,12),ciphertext=decodeB64(envelope.ciphertext);
  if (ciphertext.length < 17 || ciphertext.length > MAX_PLAINTEXT_BYTES+16) throw new Error('백업 암호문 용량이 올바르지 않습니다.');
  const key=await keyFor(passphrase,salt,KDF_ITERATIONS,webCrypto);
  let plaintext;
  try {
    plaintext=await webCrypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(LABEL),tagLength:128},key,ciphertext);
  } catch {
    throw new Error('암호가 틀리거나 파일이 변경되었습니다. 기존 기록은 변경되지 않았습니다.');
  }
  let parsed;
  try { parsed=JSON.parse(decoder.decode(plaintext)); checkPlain(parsed); }
  catch { throw new Error('복호화된 파일의 돌봄 기록 형식이 올바르지 않습니다.'); }
  return parsed;
}
/** Read-only preflight for a future IndexedDB migration; never opens or writes a database. */
export function planIndexedDbMigration(legacyBackup, targetRecords=[]) {
  checkPlain(legacyBackup);
  if (!Array.isArray(targetRecords)) throw new Error('대상 기록 정보가 올바르지 않습니다.');
  const targets=new Map();
  for (const r of targetRecords) {
    if (!r || typeof r.id !== 'string' || targets.has(r.id)) throw new Error('대상 기록 ID가 중복되거나 올바르지 않습니다.');
    targets.set(r.id,r);
  }
  const added=[], existing=[], conflicts=[];
  for (const record of legacyBackup.entries) {
    const inTarget=targets.get(record.id);
    if (!inTarget) added.push({...record});
    else if (JSON.stringify(Object.fromEntries(Object.entries(inTarget).sort()))
      ===JSON.stringify(Object.fromEntries(Object.entries(record).sort()))) existing.push(record.id);
    else conflicts.push(record.id);
  }
  return {sourceCount:legacyBackup.entries.length,targetCount:targetRecords.length,
    wouldAdd:added.length,alreadyPresent:existing.length,conflictCount:conflicts.length,
    conflictIds:conflicts,ready:conflicts.length===0,copyCandidates:added};
}
