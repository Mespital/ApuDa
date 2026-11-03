import {getUser,refreshSession} from '@netlify/identity';
import {getDatabase} from '@netlify/database';
import {createStateHandler} from '../lib/nonsul-handler.mjs';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store, private'}});
export default async function(request){
 try{try{await refreshSession();}catch{}const user=await getUser();if(!user)return json({error:'계정 연결이 필요해요.'},401);
  const db=getDatabase();
  const load=async id=>{const rows=await db.sql`SELECT revision,payload,updated_at FROM nonsul_notebooks WHERE user_id=${id}`;return rows[0]??null;};
  const save=async(id,revision,data)=>{const payload=JSON.stringify(data);const rows=revision===0?await db.sql`INSERT INTO nonsul_notebooks (user_id,revision,payload) VALUES (${id},1,${payload}::jsonb) ON CONFLICT (user_id) DO NOTHING RETURNING revision,updated_at`:await db.sql`UPDATE nonsul_notebooks SET payload=${payload}::jsonb,revision=revision+1,updated_at=NOW() WHERE user_id=${id} AND revision=${revision} RETURNING revision,updated_at`;return rows[0]??null;};
  return await createStateHandler({userId:user.id,load,save})(request);
 }catch{return json({error:'계정 저장 연결이 준비되지 않았어요. 기기 기록과 백업 파일을 이용해주세요.'},503);}
}

