// Netlify Legacy Free has no Netlify Database entitlement (createSiteDatabase 403).
// Do not mutate records here. The legacy essay UI stores drafts in the user's
// browser and supports explicit JSON export/import for backup and recovery.
// Original cloud-sync implementation and unchanged SQL schema are preserved in
// apps/nonsul/db-schema/ for reversible future migration.
import {getUser,refreshSession} from '@netlify/identity';

const json=(value,status=200)=>Response.json(value,{
  status,
  headers:{'Cache-Control':'no-store, private'}
});

export default async function(){
  try{
    try{await refreshSession();}catch{}
    const user=await getUser();
    if(!user)return json({error:'계정 연결이 필요해요.'},401);
  }catch{
    // The server-side identity API may be unavailable on this plan.
    // Still do not modify browser-held drafts.
  }
  return json({
    error:'계정 저장 연결이 준비되지 않았어요. 기기 기록과 백업 파일을 이용해주세요.',
    code:'CLOUD_SYNC_UNAVAILABLE_ON_FREE_PLAN'
  },503);
}
