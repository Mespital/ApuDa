"use strict";
const SNAPSHOT_URL = "https://apuda.app/hospital-information/data/verified-specialists.json";
const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};
const VALID_ROLES = new Set(["diagnosis","surgery","medical_oncology","radiation","endoscopy","transplant","car_t"]);
function response(statusCode, payload) {
  return {statusCode, headers:HEADERS, body:JSON.stringify(payload)};
}
function eligible(d) {
  if (!d || d.status!=="ACTIVE" || !d.doctor_name || !d.hospital_name || !d.verified_at) return false;
  let u;
  try {u=new URL(d.profile_url);}catch(_){return false;}
  if (u.protocol!=="https:" || u.username || u.password) return false;
  const age=Date.now()-Date.parse(d.verified_at);
  if (!Number.isFinite(age) || age< -86400000 || age>180*86400000) return false;
  return Array.isArray(d.cancers) && d.cancers.some(c=>c && c.code && VALID_ROLES.has(c.role));
}
exports.handler = async function(event) {
  if (event.httpMethod!=="GET") return response(405,{code:"METHOD_NOT_ALLOWED"});
  const p=event.queryStringParameters||{};
  const cancer=String(p.cancer||"").toUpperCase();
  if (!/^[A-Z_]{2,24}$/.test(cancer)) return response(400,{code:"INVALID_CANCER"});
  const role=p.role ? String(p.role) : "";
  if (role && !VALID_ROLES.has(role)) return response(400,{code:"INVALID_ROLE"});
  const region=String(p.region||"");
  if (region && (region.length>24 || !/^[가-힣a-zA-Z ]+$/.test(region))) return response(400,{code:"INVALID_REGION"});
  const search=String(p.q||"").trim().toLowerCase().slice(0,100);
  const limit=Math.min(50,Math.max(1,Number.parseInt(p.limit,10)||30));
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try {
    const upstream=await fetch(SNAPSHOT_URL,{signal:controller.signal,headers:{"Accept":"application/json"}});
    if (!upstream.ok) return response(503,{code:"SNAPSHOT_UNAVAILABLE",results:[]});
    const data=await upstream.json();
    if (!data || !Array.isArray(data.results)) return response(503,{code:"SNAPSHOT_INVALID",results:[]});
    const results=data.results.filter(eligible)
      .filter(d=>d.cancers.some(c=>c.code===cancer && (!role || c.role===role)))
      .filter(d=>!region || d.region===region)
      .filter(d=>!search || (d.doctor_name+" "+d.hospital_name).toLowerCase().includes(search))
      .slice(0,limit).map(d=>({
        doctor_name:d.doctor_name, hospital_name:d.hospital_name, region:d.region||"",
        department:d.department||"", specialty_text:d.specialty_text||"",
        profile_url:d.profile_url, verified_at:d.verified_at, status:"ACTIVE",
        cancers:d.cancers.filter(c=>c.code===cancer && (!role || c.role===role))
      }));
    return response(200,{cancer,count:results.length,results,generated_at:data.generated_at||null,
      notice:"공식 근거를 확인하고 공개 승인한 의료진 정보만 제공하며 치료 성적 순위가 아닙니다."});
  }catch(_){return response(503,{code:"SNAPSHOT_UNAVAILABLE",results:[]});}
  finally{clearTimeout(timer);}
};
