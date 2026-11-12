/**
 * ApuDa Memory / unified caregiver app (preview release).
 * Independent encrypted local-first vault. Never opens or migrates legacy
 * "apuda-memory-care-diary-v1", never uses remote APIs or logging.
 * PBKDF2-HMAC-SHA256 600k + AES-256-GCM for AT-REST encrypted data.
 */
const DB_NAME='apuda-memory-secure-v3';
const DB_STORE='vault';
const FORMAT='apuda-memory-v3';
const DATA_FORMAT='apuda-memory-v3-data';
const BACKUP_FORMAT='apuda-memory-v3-encrypted-backup';
const KDF_ITERATIONS=600000;
const te=new TextEncoder(),td=new TextDecoder('utf-8',{fatal:true});
const CAP=1000,PROFILE_CAP=12;
export const MAX_ENTRIES=CAP;
export const DEMO_POLICY='The local app never imports the legacy storage key automatically';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const choices={sleep:['','좋음','보통','나쁨'],meal:['','좋음','보통','부족'],medicationCheck:['','확인함','확인 필요','문의 사항 있음']};
const clone=v=>JSON.parse(JSON.stringify(v));
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function assert(x,message){if(!x)throw Error(message)}
function b64(arr){let value='';for(const b of arr)value+=String.fromCharCode(b);return btoa(value)}
function from64(str,expected){
 assert(typeof str==='string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str),'보관 파일 Base64 형식 오류');
 const bytes=Uint8Array.from(atob(str),x=>x.charCodeAt(0));
 if(expected!==undefined)assert(bytes.length===expected,'보관 파일의 IV/salt 길이가 올바르지 않습니다');
 return bytes;
}
function checkDate(s){
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
}
function checkData(v){
 assert(isObj(v)&&v.format===DATA_FORMAT&&v.version===3
  &&Array.isArray(v.profiles)&&Array.isArray(v.entries),'데이터 보관 형식이 올바르지 않습니다');
 assert(v.profiles.length<=PROFILE_CAP&&v.entries.length<=CAP,'보관 한도 초과');
 const pids=new Set(),recordIds=new Set();
 for(const p of v.profiles){
  assert(isObj(p)&&Object.keys(p).sort().join(',')==='id,label'&&
    uuid.test(p.id)&&typeof p.label==='string'&&p.label.trim().length>0&&
    p.label.length<=30,'돌봄 대상 프로필 형식 오류');
  assert(!pids.has(p.id),'돌봄 대상 ID 중복');pids.add(p.id);
 }
 for(const e of v.entries){
  assert(isObj(e)&&Object.keys(e).sort().join(',')==='date,id,meal,medicationCheck,profileId,question,sleep,text','기록 필드 형식 오류');
  assert(uuid.test(e.id)&&uuid.test(e.profileId)&&pids.has(e.profileId),'기록 ID 또는 돌봄 대상 오류');
  assert(!recordIds.has(e.id),'기록 ID 중복');recordIds.add(e.id);
  assert(checkDate(e.date),'기록 날짜 오류');
  assert(typeof e.text==='string'&&e.text.length<=1500,'돌봄 메모 길이 오류');
  assert(typeof e.question==='string'&&e.question.length<=400,'진료 질문 글자 수 초과');
  assert(Boolean(e.text.trim()||e.question.trim()),'돌봄 메모 또는 진료 질문을 입력해 주세요');
  for(const [k,items] of Object.entries(choices))assert(items.includes(e[k]),'관찰 선택지 오류: '+k);
 }
 return true;
}
export function emptyData(){return {format:DATA_FORMAT,version:3,profiles:[],entries:[]}}
export function addProfile(data,label,id=crypto.randomUUID()){
 checkData(data);assert(uuid.test(id),'안전한 프로필 ID 필요');
 assert(data.profiles.length<PROFILE_CAP,'돌봄 대상은 최대 12명까지 등록할 수 있습니다');
 const name=label.trim();assert(name.length>0&&name.length<=30,'돌봄 대상 이름은 1~30자 사이로 적어 주세요');
 const result=clone(data);
 result.profiles.push({id,label:name});checkData(result);return result;
}
export function addEntry(data,profileId,record,id=crypto.randomUUID()){
 checkData(data);assert(data.profiles.some(p=>p.id===profileId),'대상자를 먼저 선택해 주세요');
 assert(data.entries.length<CAP,'최대 1,000건에 도달했습니다. 암호화 백업을 보관한 뒤 정리해 주세요');
 const entry={id,profileId,date:record.date||'',text:record.text||'',question:record.question||'',
  sleep:record.sleep||'',meal:record.meal||'',medicationCheck:record.medicationCheck||''};
 const out=clone(data);out.entries.push(entry);checkData(out);return out;
}
export function changeEntry(data,profileId,id,record){
 checkData(data);const current=data.entries.find(e=>e.id===id&&e.profileId===profileId);
 assert(current,'선택한 돌봄 대상자의 기록을 찾지 못했습니다');
 const next={...current,date:record.date,text:record.text,question:record.question||'',
  sleep:record.sleep||'',meal:record.meal||'',medicationCheck:record.medicationCheck||''};
 const out=clone(data);out.entries=out.entries.map(e=>e.id===id?next:e);
 checkData(out);return out;
}
export function deleteEntry(data,profileId,id){
 checkData(data);assert(data.entries.some(e=>e.id===id&&e.profileId===profileId),'다른 대상자의 기록은 지울 수 없습니다');
 const out=clone(data);out.entries=out.entries.filter(e=>e.id!==id);checkData(out);return out;
}
export function profileEntries(data,profileId){
 checkData(data);assert(data.profiles.some(p=>p.id===profileId),'대상자를 선택해 주세요');
 return clone(data.entries.filter(e=>e.profileId===profileId).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)));
}
export function getSummary(data,profileId,period=7,endDate){
 assert(period===7||period===30,'7일 또는 30일만 지원합니다');
 assert(checkDate(endDate),'오늘 날짜 형식 오류');
 const last=new Date(endDate+'T00:00:00Z');
 const dates=Array.from({length:period},(_,i)=>{
  const d=new Date(last);d.setUTCDate(d.getUTCDate()-i);return d.toISOString().slice(0,10)
 });
 const rows=profileEntries(data,profileId).filter(e=>dates.includes(e.date));
 const daily=dates.map(date=>{
  const entries=rows.filter(e=>e.date===date);
  return {date,recordCount:entries.length,
   sleep:[...new Set(entries.map(e=>e.sleep).filter(Boolean))],
   meal:[...new Set(entries.map(e=>e.meal).filter(Boolean))],
   medicationCheck:[...new Set(entries.map(e=>e.medicationCheck).filter(Boolean))],
   questions:entries.map(e=>e.question).filter(Boolean)
  };
 });
 return {period,startDate:dates[period-1],endDate,recordCount:rows.length,
  observedDays:daily.filter(d=>d.recordCount).length,
  missingDays:daily.filter(d=>!d.recordCount).length,
  questions:rows.filter(r=>r.question.trim()).map(r=>({date:r.date,text:r.question})),rows,daily};
}
function secretPolicy(pass){
 assert(typeof pass==='string'&&pass.length>=12&&te.encode(pass).length<=1024,'비밀번호는 12자 이상이어야 합니다');
}
function requireCrypto(){
 assert(globalThis.crypto?.subtle&&globalThis.crypto?.getRandomValues&&globalThis.crypto?.randomUUID,
 'HTTPS 환경의 Web Crypto가 필요합니다');
}
async function keyFrom(pass,salt){
 const material=await crypto.subtle.importKey('raw',te.encode(pass),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:KDF_ITERATIONS,hash:'SHA-256'},
 material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptData(data,key,iv){
 checkData(data);
 const bytes=te.encode(JSON.stringify(data));assert(bytes.length<=1024*1024,'암호화 보관 용량이 너무 큽니다');
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,tagLength:128,additionalData:te.encode(FORMAT)},key,bytes);
 return b64(new Uint8Array(ciphertext));
}
async function decryptData(doc,key){
 let plain;
 try {
  plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(doc.iv,12),tagLength:128,additionalData:te.encode(FORMAT)},
   key,from64(doc.ciphertext));
 }catch{throw Error('비밀번호가 다르거나 암호화 기록이 손상됐습니다. 기존 기록은 그대로 유지됩니다')}
 let parsed;
 try {parsed=JSON.parse(td.decode(plain));checkData(parsed)}catch{throw Error('복호화된 데이터 형식이 올바르지 않습니다')}
 return parsed;
}
function checkEnvelope(doc){
 assert(isObj(doc)&&doc.key==='primary'&&doc.format===FORMAT&&doc.version===3&&
 Number.isSafeInteger(doc.revision)&&doc.revision>=1&&doc.iterations===KDF_ITERATIONS&&
 doc.algorithm==='AES-256-GCM'&&typeof doc.ciphertext==='string'&&
 doc.ciphertext.length<1.7e6,'암호화 데이터 구조가 유효하지 않습니다');
 from64(doc.salt,16);from64(doc.iv,12);
}
async function getDb(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE,{keyPath:'key'})};
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db)};
  req.onerror=()=>reject(req.error||Error('기기 보관소를 열 수 없습니다'));
  req.onblocked=()=>reject(Error('다른 탭에서 보관소 변경을 막고 있습니다'));
 });
}
function dbRead(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(DB_STORE,'readonly');
  let doc=null;tx.objectStore(DB_STORE).get('primary').onsuccess=e=>{doc=e.target.result||null};
  tx.oncomplete=()=>resolve(doc);tx.onabort=()=>reject(tx.error||Error('보관소 조회 실패'));
 });
}
export async function hasVault(){
 const db=await getDb();try{return Boolean(await dbRead(db))}finally{db.close()}
}
export async function createVault(pass){
 requireCrypto();secretPolicy(pass);
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await keyFrom(pass,salt),data=emptyData();
 const doc={key:'primary',format:FORMAT,version:3,algorithm:'AES-256-GCM',
  iterations:KDF_ITERATIONS,revision:1,salt:b64(salt),iv:b64(iv),ciphertext:await encryptData(data,key,iv)};
 const db=await getDb();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(DB_STORE,'readwrite');
  tx.objectStore(DB_STORE).add(doc);tx.oncomplete=resolve;
  tx.onabort=()=>reject(tx.error||Error('기존 보관함이 있거나 생성에 실패했습니다'));
 });return {data,key,revision:1,document:doc};}
 finally{db.close()}
}
export async function unlockVault(pass){
 requireCrypto();secretPolicy(pass);
 const db=await getDb();let doc;
 try{doc=await dbRead(db)}finally{db.close()}
 assert(doc,'저장된 보관함이 없습니다. 먼저 만들어 주세요');
 checkEnvelope(doc);
 const key=await keyFrom(pass,from64(doc.salt,16)),data=await decryptData(doc,key);
 return {data,key,revision:doc.revision,document:doc};
}
export async function commitVault(session,nextData){
 assert(session?.key&&session?.revision>0,'보관함 잠금을 먼저 해제해 주세요');
 checkData(nextData);
 // Encrypt OUTSIDE transaction, compare-and-swap INSIDE IDB readwrite tx.
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await encryptData(nextData,session.key,iv);
 const replacement={...session.document,iv:b64(iv),ciphertext:encrypted,revision:session.revision+1};
 const db=await getDb();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(DB_STORE,'readwrite');
  const req=tx.objectStore(DB_STORE).get('primary');
  req.onsuccess=()=>{
   const prev=req.result;
   if(!prev||prev.revision!==session.revision || !eq(prev,session.document)){
    try{tx.abort()}catch{};return;
   }
   tx.objectStore(DB_STORE).put(replacement);
  };
  tx.oncomplete=resolve;tx.onabort=()=>reject(Error('다른 탭에서 기록이 변경됐거나 저장이 실패했습니다. 새로고침 후 다시 잠금을 해제해 주세요'));
 });session.data=clone(nextData);session.revision=replacement.revision;session.document=replacement;return session;}
 finally{db.close()}
}
export async function encryptedBackup(session){
 assert(session?.key,'보관함 잠금을 먼저 해제해 주세요');
 const db=await getDb();let current;
 try{current=await dbRead(db)}finally{db.close()}
 assert(current&&eq(current,session.document),'다른 탭의 변경이 감지되어 백업을 중단했습니다. 다시 잠금 해제해 주세요');
 checkEnvelope(current);
 // Only encrypted records; requires same passphrase for later recovery.
 return JSON.stringify({backupFormat:BACKUP_FORMAT,backupVersion:1,envelope:current},null,2);
}
export const formatSummaryText=(data,profileId,period,endDate)=>{
 const p=data.profiles.find(x=>x.id===profileId);
 const s=getSummary(data,profileId,period,endDate);
 const lines=['ApuDa Memory | 진료 준비 메모','대상: '+(p?.label||'선택된 대상자'),
  '기간: '+s.startDate+' ~ '+s.endDate+' ('+period+'일)',
  '기록한 날 '+s.observedDays+'일, 기록 '+s.recordCount+'건, 미기록 '+s.missingDays+'일',
  '※ 미기록 날짜를 정상으로 간주하지 마세요. 이 자료는 진단·처방 지시가 아닙니다.','',
  '의료진에게 물어볼 질문'];
 for(const q of s.questions)lines.push('• '+q.date+' '+q.text);
 if(!s.questions.length)lines.push('작성된 질문이 없습니다.');
 lines.push('','날짜별 관찰 기록');
 for(const r of s.rows)lines.push('['+r.date+'] '+r.text+
  (r.sleep?' | 수면: '+r.sleep:'')+(r.meal?' | 식사: '+r.meal:'')+
  (r.medicationCheck?' | 처방 확인: '+r.medicationCheck:''));
 return lines.join('\n');
};
