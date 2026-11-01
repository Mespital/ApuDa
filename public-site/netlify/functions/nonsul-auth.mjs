import {getUser,login,logout,refreshSession} from '@netlify/identity';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store, private'}});
export default async function(request){
 if(request.method==='GET'){try{await refreshSession();}catch{}const user=await getUser();return json({connected:!!user,user:user?{id:user.id,email:user.email}:null});}
 if(request.method!=='POST')return json({error:'허용되지 않은 요청이에요.'},405);
 const origin=request.headers.get('origin');if(request.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==new URL(request.url).origin))return json({error:'같은 사이트에서 요청해주세요.'},403);
 const raw=await request.text();if(new TextEncoder().encode(raw).length>4096)return json({error:'입력값을 확인해주세요.'},413);
 let body;try{body=JSON.parse(raw);}catch{return json({error:'입력값을 확인해주세요.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'입력값을 확인해주세요.'},400);
 try{if(body.action==='logout'){await logout();return json({ok:true});}
  if(body.action!=='login'||typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||!body.password||body.password.length>256)return json({error:'이메일과 비밀번호를 확인해주세요.'},400);
  const user=await login(body.email.trim(),body.password);return json({ok:true,userId:user.id});
 }catch{return json({error:'계정 연결을 완료하지 못했어요. 등록된 계정과 Netlify 인증 설정을 확인해주세요. 기기 저장은 계속 사용할 수 있어요.'},401);}
}

