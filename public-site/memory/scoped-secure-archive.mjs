/**
 * ApuDa Memory Phase 17 -- password-protected ANONYMOUS PROFILE archive.
 * QA prototype only: not imported by /memory/index.html and never persists.
 * Uses Web Crypto (PBKDF2-SHA256 x 600k -> AES-256-GCM, 128-bit tag).
 *
 * Outer envelope contains NO patient name/notes/profileId; the profile ID is
 * only inside authenticated ciphertext. It remains a pseudonym, not anonymity.
 * Requires explicit intended profileId on decrypt; never auto-assigns records.
 * The in-browser localStorage diary itself remains PLAINTEXT.
 */
import {KDF_ITERATIONS} from './secure-archive.mjs';
import {emptyProfileVault,addAnonymousProfile} from './profile-scope.mjs';
import {planProfileImport,SCOPED_BACKUP_FORMAT} from './profile-workflow.mjs';

export const SCOPED_ENCRYPTED_FORMAT='apuda-memory-scoped-encrypted-archive';
export const SCOPED_ENCRYPTED_VERSION=1;
const LABEL='APUDA-MEMORY-SCOPED-ARCHIVE-V1';
const CIPHER='AES-256-GCM';
const KDF='PBKDF2-HMAC-SHA-256';
const encoder=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
const MAX_PLAINTEXT_BYTES=256*1024;
const MAX_ENVELOPE_BYTES=384*1024;
const FIELDS='cipher,ciphertext,format,iterations,iv,kdf,salt,version';

function verifyPassphrase(password) {
  if(typeof password!=='string' || password.length<12 ||
    encoder.encode(password).byteLength>1024)
    throw Error('암호는 12자 이상, 1024바이트 이하의 문자열이어야 합니다.');
}
function requireCrypto(webCrypto) {
  if(!webCrypto?.subtle?.importKey || !webCrypto?.subtle?.deriveKey ||
     !webCrypto?.subtle?.encrypt || !webCrypto?.subtle?.decrypt ||
     typeof webCrypto.getRandomValues!=='function')
    throw Error('HTTPS Web Crypto 암호화 기능을 사용할 수 없습니다.');
}
function toB64(bytes) {
  let binary='';
  for(const value of bytes)binary+=String.fromCharCode(value);
  return btoa(binary);
}
function fromB64(encoded,exactBytes) {
  if(typeof encoded!=='string' ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))
    throw Error('지원하지 않는 백업의 Base64 형식입니다.');
  const bytes=Uint8Array.from(atob(encoded),x=>x.charCodeAt(0));
  if(exactBytes!==undefined&&bytes.length!==exactBytes)
    throw Error('백업의 salt/IV 길이가 올바르지 않습니다.');
  return bytes;
}
function assertProfileBackup(backup) {
  if(!backup || typeof backup!=='object' || Array.isArray(backup) ||
    backup.format!==SCOPED_BACKUP_FORMAT ||
    typeof backup.sourceProfileId!=='string')
    throw Error('대상자별 전용 JSON만 암호화할 수 있습니다.');
  // The existing planner rejects unknown fields, bad dates, duplicate IDs,
  // unsupported schema, and the legacy unscoped V1/V2 format.
  const scratch=addAnonymousProfile(emptyProfileVault(),backup.sourceProfileId);
  const check=planProfileImport(scratch,backup.sourceProfileId,backup);
  if(!check.ready || check.wouldAdd!==backup.entries.length)
    throw Error('대상자별 백업의 무결성 검사에 실패했습니다.');
  const plain=JSON.stringify(backup);
  if(encoder.encode(plain).byteLength>MAX_PLAINTEXT_BYTES)
    throw Error('백업 용량이 지원 범위를 초과했습니다.');
  return plain;
}
function validateEnvelope(data) {
  if(!data || typeof data!=='object' || Array.isArray(data) ||
    JSON.stringify(data).length>MAX_ENVELOPE_BYTES ||
    Object.keys(data).sort().join(',')!==FIELDS ||
    data.format!==SCOPED_ENCRYPTED_FORMAT ||
    data.version!==SCOPED_ENCRYPTED_VERSION ||
    data.kdf!==KDF || data.iterations!==KDF_ITERATIONS || data.cipher!==CIPHER)
    throw Error('대상자별 암호화 백업의 형식이 올바르지 않습니다.');
}
async function derive(password,salt,webCrypto){
  const raw=await webCrypto.subtle.importKey(
    'raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return webCrypto.subtle.deriveKey(
    {name:'PBKDF2',hash:'SHA-256',iterations:KDF_ITERATIONS,salt},
    raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
/** Encrypt selected profile's validated export, memory-only, zero storage writes. */
export async function encryptScopedBackup(backup,password,{webCrypto=globalThis.crypto}={}){
  requireCrypto(webCrypto);
  verifyPassphrase(password);
  const plain=assertProfileBackup(backup);
  const salt=webCrypto.getRandomValues(new Uint8Array(16));
  const iv=webCrypto.getRandomValues(new Uint8Array(12));
  const key=await derive(password,salt,webCrypto);
  const bytes=await webCrypto.subtle.encrypt(
    {name:'AES-GCM',iv,tagLength:128,additionalData:encoder.encode(LABEL)},
    key,encoder.encode(plain));
  return {
    format:SCOPED_ENCRYPTED_FORMAT,version:SCOPED_ENCRYPTED_VERSION,
    kdf:KDF,iterations:KDF_ITERATIONS,cipher:CIPHER,
    salt:toB64(salt),iv:toB64(iv),ciphertext:toB64(new Uint8Array(bytes))
  };
}
/**
 * Decrypt to a NEW object and REQUIRE the exact pre-existing selected profile.
 * Mismatched IDs are rejected; no data is assigned, persisted or downloaded.
 * Wrong password & tampering deliberately share the same external error.
 */
export async function decryptScopedBackup(envelope,password,expectedProfileId,
  {webCrypto=globalThis.crypto}={}){
  requireCrypto(webCrypto);
  verifyPassphrase(password);
  if(typeof expectedProfileId!=='string' || !expectedProfileId.trim())
    throw Error('복원할 대상자를 먼저 명시적으로 선택해야 합니다.');
  validateEnvelope(envelope);
  const salt=fromB64(envelope.salt,16),iv=fromB64(envelope.iv,12);
  const encrypted=fromB64(envelope.ciphertext);
  if(encrypted.length<17 || encrypted.length>MAX_PLAINTEXT_BYTES+16)
    throw Error('암호문의 길이가 허용 범위를 벗어났습니다.');
  const key=await derive(password,salt,webCrypto);
  let plain;
  try{
    plain=await webCrypto.subtle.decrypt(
      {name:'AES-GCM',iv,tagLength:128,additionalData:encoder.encode(LABEL)},key,encrypted);
  }catch{
    throw Error('암호가 틀리거나 백업 파일이 변조되었습니다. 기존 기록은 변경되지 않았습니다.');
  }
  let output;
  try{
    output=JSON.parse(decoder.decode(plain));
    assertProfileBackup(output);
  }catch{
    throw Error('복호화된 대상자별 기록 형식이 올바르지 않습니다.');
  }
  if(output.sourceProfileId!==expectedProfileId)
    throw Error('백업의 대상자가 현재 선택한 대상자와 다릅니다. 자동 배정하지 않았습니다.');
  return output;
}
