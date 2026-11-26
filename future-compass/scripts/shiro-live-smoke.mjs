#!/usr/bin/env node
// Public, non-personal production smoke test for Shiro. Never uses family credentials or API keys.
const base = 'https://future.apuda.app';
const out = [];
const row = (name, status, details='') => { const r={name,status,details};out.push(r);console.log(status.toUpperCase()+' '+name+' '+details); };
async function get(path,timeout=15000) { const t=Date.now(); const r=await fetch(base+path,{signal:AbortSignal.timeout(timeout),headers:{'cache-control':'no-cache'}});return {r,ms:Date.now()-t};}
try {
  const {r,ms}=await get('/sw.js');
  const s=await r.text();
  row('service-worker',r.ok&&s.includes('v149-final-exam-priority')?'pass':'fail','HTTP '+r.status+' / '+ms+'ms / V149 '+s.includes('v149-final-exam-priority'));
} catch(e){row('service-worker','fail',e.name+': '+e.message);}
try {
  const {r,ms}=await get('/shiro-help.js');const s=await r.text();
  const ok=r.ok&&s.includes("action:'chat-fast'")&&s.includes('function beginChat()')&&s.includes('function studyCodes(q)')&&s.includes('formatShiroReply(j.text)');
  row('shiro-client',ok?'pass':'fail','HTTP '+r.status+' / '+ms+'ms / Gemini routing '+ok);
} catch(e){row('shiro-client','fail',e.name+': '+e.message);}
try {
  const {r,ms}=await get('/shiro-help.css');
  const s=await r.text();
  const ok=r.ok&&s.includes('V147: fix legacy 590px cap')&&s.includes('height:calc(var(--shiro-view-height,100dvh) - 12px)');
  row('mobile-chat-height',ok?'pass':'fail','HTTP '+r.status+' / '+ms+'ms / fullscreen override '+ok);
} catch(e){row('mobile-chat-height','fail',e.name+': '+e.message);}
try {
  const {r,ms}=await get('/shiro-study.js');const s=await r.text();
  const ok=r.ok&&s.includes("function academyAnswer(text)")&&s.includes("var academy = academyAnswer(text)");
  row('academy-grounded-answers',ok?'pass':'fail','HTTP '+r.status+' / '+ms+'ms / schedule-first routing '+ok);
} catch(e){row('academy-grounded-answers','fail',e.name+': '+e.message);}
try {
  const {r,ms}=await get('/shiro-study.js');const s=await r.text();
  const ok=r.ok&&s.includes('function upcomingExamAnswer(text)')&&s.includes('학교 학사일정')&&s.includes('2026-12-09');
  row('current-final-exam-routing',ok?'pass':'fail','HTTP '+r.status+' / '+ms+'ms / forward-only final schedule '+ok);
} catch(e){row('current-final-exam-routing','fail',e.name+': '+e.message);}
try {
  const {r,ms}=await get('/shiro-ai.js');const s=await r.text();
  const ok=r.ok&&s.includes('function currentExamKB(q)')&&s.includes('중간고사 범위를 대신 보여주지 않을게');
  row('stale-midterm-filter',ok?'pass':'fail','HTTP '+r.status+' / '+ms+'ms / KB historic filtering '+ok);
} catch(e){row('stale-midterm-filter','fail',e.name+': '+e.message);}
try {
  const {r,ms}=await get('/study.html');const s=await r.text();
  row('study-page',r.ok&&s.includes('shiro-help.js')?'pass':'fail','HTTP '+r.status+' / '+ms+'ms / shiro loaded '+s.includes('shiro-help.js'));
} catch(e){row('study-page','fail',e.name+': '+e.message);}
let status=null;
try{
  const {r,ms}=await get('/write/api/feedback');status=await r.json();
  const label=status?.provider==='gemini'&&status?.ai===true?'pass':'warn';
  row('gemini-env-status',r.ok?label:'fail','HTTP '+r.status+' / '+ms+'ms / provider='+status?.provider+' / ai='+status?.ai+' / code_required='+status?.code_required);
}catch(e){row('gemini-env-status','fail',e.name+': '+e.message);}
if(status?.provider==='gemini'&&status?.ai===true&&!status?.code_required){
  const question={request_id:'shiro-smoke-20261126',mode:'draft',answer:'고려는 왕권을 강화하려고 중앙 정치 제도를 정비하고 지방에 관리들을 파견하였다. 하지만 귀족과 무신 세력이 정치에 영향을 주었다.',set:{question:'고려 시대 정치 변화의 핵심 원인을 설명하시오.',min:60,max:250,passages:[{label:'가',text:'고려는 통치 체제를 정비하는 과정에서 귀족 사회와 무신 정권을 거쳤다.'}],points:['왕권 강화','지배 세력의 변화']}};
  try{
    const t0=Date.now();const r=await fetch(base+'/write/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(question),signal:AbortSignal.timeout(55000)});
    const j=await r.json().catch(()=>({}));
    const good=r.ok&&j.ok===true&&j.feedback;
    row('real-gemini-answer',good?'pass':'fail','HTTP '+r.status+' / '+(Date.now()-t0)+'ms / received feedback='+!!j.feedback+' / error-code='+(j.code||'-'));
    if(good)row('sample-answer','info',JSON.stringify(j.feedback).slice(0,700));
  }catch(e){row('real-gemini-answer','fail',e.name+': '+e.message);}
}else row('real-gemini-answer','skip','Requires Gemini configured and public no-code test; did not bypass authentication.');
row('authenticated-shiro-chat','skip','Family token required; cannot send a real Shiro chat question without an authenticated session.');
const summary='## 흰둥이 실서비스 연결 점검\n\n'+out.map(x=>'| '+x.name+' | '+x.status+' | '+x.details.replaceAll('|','\\|').replaceAll('\n',' ')+' |').join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY){const fs=await import('node:fs');fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'|항목|상태|세부 결과|\n|---|---|---|\n'+summary.split('\n').slice(2).join('\n'));}
{const fs=await import('node:fs');fs.writeFileSync('shiro-smoke.md','# 흰둥이 실서비스 검사 결과\n\n'+new Date().toISOString()+'\n\n| 항목 | 상태 | 상세 결과 |\n|---|---|---|\n'+out.map(x=>'| '+x.name+' | '+x.status+' | '+x.details.replaceAll('|','/').replaceAll('\\n',' ')+' |').join('\\n')+'\\n');}
if(out.some(x=>x.status==='fail'))process.exitCode=1;
