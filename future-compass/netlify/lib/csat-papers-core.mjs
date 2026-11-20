import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const ZIP_LIMIT=64*1024*1024,PDF_LIMIT=19*1024*1024,CACHE_LIMIT=64*1024*1024;
const hosts=new Set(['www.suneung.re.kr','cdn2.kice.re.kr']);
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
export function crc32(b){let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function safeOfficialURL(s){try{const u=new URL(s);return u.protocol==='https:'&&hosts.has(u.hostname)&&!u.username&&!u.password&&!u.port?u.href:null}catch{return null}}
function fail(message,status=502){return Object.assign(new Error(message),{status});}
function nameOf(bytes,flags){if(flags&2048)return new TextDecoder().decode(bytes);try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{return new TextDecoder('euc-kr').decode(bytes)}}
export function zipPDFs(bytes,{answers=false}={}){
 const b=Buffer.from(bytes);let end=-1;
 for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--)if(b.readUInt32LE(p)===0x06054b50){end=p;break}
 if(end<0||b.readUInt16LE(end+4)||b.readUInt16LE(end+6))throw fail('압축 자료 형식을 확인할 수 없습니다.');
 const count=b.readUInt16LE(end+10),size=b.readUInt32LE(end+12),start=b.readUInt32LE(end+16);
 if(count>2000||start+size>end)throw fail('압축 자료의 목록이 올바르지 않습니다.');
 let p=start;const out=[];
 for(let i=0;i<count;i++){
  if(p+46>b.length||b.readUInt32LE(p)!==0x02014b50)throw fail('압축 자료 목록이 손상되었습니다.');
  const flags=b.readUInt16LE(p+8),method=b.readUInt16LE(p+10),crc=b.readUInt32LE(p+16),compressed=b.readUInt32LE(p+20),length=b.readUInt32LE(p+24),n=b.readUInt16LE(p+28),extra=b.readUInt16LE(p+30),comment=b.readUInt16LE(p+32),offset=b.readUInt32LE(p+42),next=p+46+n+extra+comment;
  if(next>b.length)throw fail('압축 파일 이름이 손상되었습니다.');
  const name=nameOf(b.subarray(p+46,p+46+n),flags),leaf=name.split(/[\\/]/).at(-1);p=next;
  if(!/\.pdf$/i.test(leaf)||!answers&&/정답|해설|음성|대본|듣기|answer|script/i.test(leaf))continue;
  if(flags&1||![0,8].includes(method)||length>PDF_LIMIT||offset+30>b.length||compressed>ZIP_LIMIT)continue;
  const id=createHash('sha256').update(name+'|'+crc+'|'+length).digest('hex').slice(0,24);
  out.push({id,name:leaf,bytes:length,offset,compressed,length,method,crc});
 }
 return out.sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}));
}
export function extractPDF(bytes,file){
 const b=Buffer.from(bytes),o=file.offset;
 if(b.readUInt32LE(o)!==0x04034b50)throw fail('압축 파일 내용이 올바르지 않습니다.');
 const start=o+30+b.readUInt16LE(o+26)+b.readUInt16LE(o+28),end=start+file.compressed;
 if(end>b.length)throw fail('압축 파일이 완전히 전달되지 않았습니다.');
 const data=file.method===0?b.subarray(start,end):inflateRawSync(b.subarray(start,end),{maxOutputLength:PDF_LIMIT});
 if(data.length!==file.length||crc32(data)!==file.crc||!data.subarray(0,5).equals(Buffer.from('%PDF-')))throw fail('시험지 PDF의 무결성을 확인하지 못했습니다.');
 return data;
}
async function fetchOfficial(url,fetcher){
 let target=safeOfficialURL(url);if(!target)throw fail('허용되지 않은 자료 주소입니다.',400);
 for(let i=0;i<4;i++){
  const res=await fetcher(target,{redirect:'manual',signal:AbortSignal.timeout(25000)});
  if([301,302,303,307,308].includes(res.status)){target=safeOfficialURL(new URL(res.headers.get('location')||'',target).href);if(!target)throw fail('공식 자료 주소를 확인할 수 없습니다.');continue}
  if(!res.ok)throw fail('공식 원문을 불러오지 못했습니다. 원문 링크를 이용해 주세요.');
  if(Number(res.headers.get('content-length'))>ZIP_LIMIT)throw fail('자료가 커서 원문 사이트에서 확인해야 합니다.',413);
  const chunks=[];let total=0;for await(const chunk of res.body){total+=chunk.length;if(total>ZIP_LIMIT)throw fail('자료가 커서 원문 사이트에서 확인해야 합니다.',413);chunks.push(chunk)}
  const b=Buffer.concat(chunks);if(!b.subarray(0,5).equals(Buffer.from('%PDF-'))&&!b.subarray(0,2).equals(Buffer.from('PK')))throw fail('원문 서버가 PDF 대신 안내 페이지를 반환했습니다. 원문 링크를 이용해 주세요.');
  return b;
 }
 throw fail('공식 자료 이동 경로를 확인할 수 없습니다.');
}
export function makePaperHandler(resources,{fetcher=fetch}={}){
 const registry=new Map(resources.filter(r=>['question','bundle','answer'].includes(r.type)).map(r=>[r.id,r])),cache=new Map();let cacheBytes=0;
 async function get(r){
  const hit=cache.get(r.id);if(hit&&Date.now()-hit.time<900000){cache.delete(r.id);cache.set(r.id,hit);return hit}
  if(hit){cacheBytes-=hit.bytes.length;cache.delete(r.id)}
  const bytes=await fetchOfficial(r.url,fetcher),isPDF=bytes.subarray(0,5).equals(Buffer.from('%PDF-'));
  if(isPDF&&bytes.length>PDF_LIMIT)throw fail('이 시험지는 원문 링크에서 크게 열어 주세요.',413);
  const files=isPDF?[{id:'paper',name:r.name.replace(/\.zip$/i,'.pdf'),bytes:bytes.length}]:zipPDFs(bytes,{answers:r.type==='answer'});
  if(!files.length)throw fail('이 묶음에는 바로 읽을 수 있는 PDF가 없습니다. 공식 원문을 열어 주세요.',422);
  const item={bytes,isPDF,files,time:Date.now()};while(cache.size&&cacheBytes+bytes.length>CACHE_LIMIT){const [key,old]=cache.entries().next().value;cache.delete(key);cacheBytes-=old.bytes.length}
  cache.set(r.id,item);cacheBytes+=bytes.length;return item;
 }
 return async req=>{
  const headers={'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
  if(!['GET','HEAD'].includes(req.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  try{
   const u=new URL(req.url),r=registry.get(u.searchParams.get('id'));if(!r)return new Response(JSON.stringify({error:'등록된 공식 자료를 선택해 주세요.'}),{status:404,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
   const item=await get(r),file=u.searchParams.get('file');
   if(!file){const value={resource:{id:r.id,year:r.year,domain:r.domain,name:r.name,type:r.type,officialUrl:r.url},files:item.files.map(({id,name,bytes})=>({id,name,bytes}))};return Response.json(value,{headers:{...headers,'Cache-Control':'public, max-age=3600'}})}
   const selected=item.files.find(f=>f.id===file);if(!selected)throw fail('이 시험지의 파일을 다시 선택해 주세요.',404);
   const pdf=item.isPDF?item.bytes:extractPDF(item.bytes,selected);if(req.method==='HEAD')return new Response(null,{headers:{...headers,'Content-Type':'application/pdf','Content-Length':String(pdf.length)}});
   const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(pdf));c.close()}});
   return new Response(stream,{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':"inline; filename*=UTF-8''"+encodeURIComponent(selected.name),'Cache-Control':'public, max-age=3600'}});
  }catch(err){return Response.json({error:err.status?err.message:'시험지를 불러오지 못했습니다. 잠시 후 다시 시도하거나 공식 원문을 열어 주세요.'},{status:err.status||502,headers})}
 };
}
