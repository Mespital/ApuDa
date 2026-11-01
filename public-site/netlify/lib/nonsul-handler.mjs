import {notebookSchema,newNotebook} from './nonsul-notebook.mjs';
const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store, private','Vary':'Cookie'}});
export function createStateHandler({userId,load,save}){
 return async request=>{
  if(!userId)return reply({error:'로그인이 필요해요.'},401);
  if(!['GET','PUT'].includes(request.method))return reply({error:'허용되지 않은 요청이에요.'},405);
  const view=async()=>{const row=await load(userId);return {data:row?notebookSchema.parse(typeof row.payload==='string'?JSON.parse(row.payload):row.payload):newNotebook(),revision:row?.revision??0,userKey:userId};};
  if(request.method==='GET')return reply(await view());
  const origin=request.headers.get('origin');if(request.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==new URL(request.url).origin))return reply({error:'같은 사이트에서 요청해주세요.'},403);
  const raw=await request.text();if(new TextEncoder().encode(raw).length>300000)return reply({error:'기록 크기가 너무 커요.'},413);
  let value;try{value=JSON.parse(raw);}catch{return reply({error:'기록 형식을 확인해주세요.'},400);}
  if(!value||typeof value!=='object'||Array.isArray(value))return reply({error:'기록 형식을 확인해주세요.'},400);
  const parsed=notebookSchema.safeParse(value.data);if(!parsed.success||!Number.isSafeInteger(value.revision)||value.revision<0)return reply({error:'기록 형식을 확인해주세요.'},400);
  const saved=await save(userId,value.revision,parsed.data);
  if(!saved)return reply({...await view(),error:'다른 기기에서 바뀐 기록이 있어요.'},409);
  return reply({revision:saved.revision,updatedAt:saved.updated_at});
 };
}

