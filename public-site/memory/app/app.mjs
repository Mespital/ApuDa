import {
 emptyData,addProfile,addEntry,changeEntry,deleteEntry,profileEntries,getSummary,
 hasVault,createVault,unlockVault,commitVault,encryptedBackup,formatSummaryText
} from './vault.mjs';

const $=id=>document.getElementById(id);
let session=null,profileId=null,editId=null,allRecords=false,busy=false,downloadLink=null;
function localToday(){
 const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function status(id,message,error=false){
 const node=$(id);node.textContent=message;node.classList.toggle('error',error);
}
function toggle(id,visible){$(id).hidden=!visible}
function setBusy(working){busy=working;for(const id of ['saveRecord','exportBackup','lockButton'])if($(id))$(id).disabled=working}
function stopEditing(){
 editId=null;$('recordTitle').textContent='오늘의 기록 남기기';
 $('saveRecord').textContent='암호화하여 저장';toggle('cancelEdit',false);
 $('recordForm').reset();$('recordDate').value=localToday();
}
function lock(message='보관함을 잠갔습니다.'){
 session=null;profileId=null;editId=null;
 if(downloadLink){URL.revokeObjectURL(downloadLink);downloadLink=null}
 $('newPassword').value='';$('confirmPassword').value='';
 $('unlockPassword').value='';
 toggle('vault-open',false);toggle('vault-create',false);toggle('vault-unlock',true);
 toggle('diary-locked',true);toggle('diary-app',false);
 toggle('consult-locked',true);toggle('consult-app',false);
 toggle('backup-locked',true);toggle('backup-open',false);
 for(const id of ['recordList','timeline','profileSelect'])$(id).replaceChildren();
 $('summaryText').value='';stopEditing();renderStats();
 status('vaultStatus',message);
}
function showUnlocked(){
 toggle('vault-create',false);toggle('vault-unlock',false);toggle('vault-open',true);
 toggle('diary-locked',false);toggle('diary-app',true);
 toggle('consult-locked',false);toggle('consult-app',true);
 toggle('backup-locked',false);toggle('backup-open',true);
 $('newPassword').value='';$('confirmPassword').value='';$('unlockPassword').value='';
 profileId=session.data.profiles.some(p=>p.id===profileId)?profileId:session.data.profiles[0]?.id||null;
 stopEditing();renderAll();
 status('vaultStatus','기기에 암호화된 돌봄 기록을 안전하게 열었습니다.');
}
async function update(next,success,targetStatus='recordStatus'){
 if(busy)return false;
 setBusy(true);
 try{
  await commitVault(session,next);
  renderAll();status(targetStatus,success);return true;
 }catch(error){
  status(targetStatus,error.message,true);
  if(/다른 탭에서 기록이 변경/.test(error.message))lock('다른 탭의 변경이 확인돼 잠갔습니다. 새로고침 후 다시 열어 주세요.');
  return false;
 }finally{setBusy(false)}
}
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o}
function renderProfiles(){
 const list=$('profileSelect');list.replaceChildren();
 if(!session)return;
 if(session.data.profiles.length===0){
  list.append(option('','먼저 돌봄 대상을 추가해 주세요'));profileId=null;
 }else {
  if(!session.data.profiles.some(p=>p.id===profileId))profileId=session.data.profiles[0].id;
  for(const p of session.data.profiles)list.append(option(p.id,p.label));
  list.value=profileId;
 }
 $('recordForm').querySelectorAll('input,textarea,select,button').forEach(x=>x.disabled=!profileId||busy);
 $('summaryPeriod').disabled=!profileId;
 $('copySummary').disabled=!profileId;
 $('printSummary').disabled=!profileId;
}
function renderStats(){
 const data=session?.data;
 const profile=data?.profiles.find(p=>p.id===profileId);
 $('statProfiles').textContent=(data?.profiles.length||0)+'명';
 if(!profile){
  $('statToday').textContent='0건';$('statWeek').textContent='0일';$('statQuestions').textContent='0개';return;
 }
 const selected=profileEntries(data,profileId),today=localToday();
 const summary=getSummary(data,profileId,7,today);
 $('statToday').textContent=selected.filter(x=>x.date===today).length+'건';
 $('statWeek').textContent=summary.observedDays+'일';
 $('statQuestions').textContent=summary.questions.length+'개';
}
function node(tag,text,cls){
 const elem=document.createElement(tag);
 if(text!==undefined&&text!==null)elem.textContent=text;
 if(cls)elem.className=cls;
 return elem;
}
function renderRecords(){
 const list=$('recordList');list.replaceChildren();
 if(!session||!profileId){
  list.append(node('p','돌봄 대상을 추가하면 날짜별 기록이 표시됩니다.','empty'));toggle('showAllRecords',false);return;
 }
 const search=$('searchRecords').value.trim().toLocaleLowerCase('ko-KR');
 const entries=profileEntries(session.data,profileId).filter(r=>
  [r.text,r.question,r.date,r.sleep,r.meal,r.medicationCheck]
   .join(' ').toLocaleLowerCase('ko-KR').includes(search));
 if(!entries.length){list.append(node('p',search?'검색 결과가 없습니다.':'기록이 없습니다. 첫 돌봄 메모를 남겨 보세요.','empty'));toggle('showAllRecords',false);return}
 for(const rec of allRecords?entries:entries.slice(0,5)){
  const card=node('article',null,'entry');
  const head=node('div',null,'entry-head'),date=node('time',rec.date);
  date.dateTime=rec.date;
  const meta=node('span',[rec.sleep&&'수면 '+rec.sleep,rec.meal&&'식사 '+rec.meal,rec.medicationCheck&&'처방 '+rec.medicationCheck].filter(Boolean).join(' · '),'entry-meta');
  head.append(date);card.append(head);
  if(rec.text.trim())card.append(node('p',rec.text));
  if(rec.question.trim())card.append(node('p','진료 질문: '+rec.question,'entry-meta'));
  if(meta.textContent)card.append(meta);
  const actions=node('div',null,'actions');
  const edit=node('button','수정','small-btn'),remove=node('button','삭제','small-btn warn-btn');
  edit.type='button';remove.type='button';edit.dataset.action='edit';remove.dataset.action='remove';
  edit.dataset.id=rec.id;remove.dataset.id=rec.id;actions.append(edit,remove);card.append(actions);
  list.append(card);
 }
 toggle('showAllRecords',entries.length>5&&!allRecords);
}
function renderSummary(){
 const title=$('consultProfile'),timeline=$('timeline');
 timeline.replaceChildren();
 if(!session||!profileId){title.textContent='돌봄 대상 미등록';$('summaryText').value='대상자를 먼저 추가하세요';for(const id of ['sumCount','sumDays','sumQuestions'])$(id).textContent='0';$('sumMissing').textContent='0';return}
 const profile=session.data.profiles.find(p=>p.id===profileId);
 const period=Number($('summaryPeriod').value)===30?30:7;
 const s=getSummary(session.data,profileId,period,localToday());
 title.textContent=profile.label+' · 최근 '+period+'일';
 $('sumCount').textContent=s.recordCount;$('sumDays').textContent=s.observedDays;
 $('sumMissing').textContent=s.missingDays;$('sumQuestions').textContent=s.questions.length;
 $('summaryText').value=formatSummaryText(session.data,profileId,period,localToday());
 const addDay=(day,target)=>{
  const card=node('div',null,'day'+(day.recordCount?'':' missing'));
  card.append(node('time',day.date+' — '+(day.recordCount?day.recordCount+'건 기록':'기록이 없는 날짜')));
  if(day.recordCount){
   const field=[day.sleep.length&&'수면 '+day.sleep.join('/'),day.meal.length&&'식사 '+day.meal.join('/'),day.medicationCheck.length&&'처방 확인 '+day.medicationCheck.join('/')].filter(Boolean);
   card.append(node('div',field.length?field.join(' · '):'관찰 항목은 선택되지 않았습니다.','note'));
  }else card.append(node('div','건강 상태를 알 수 없습니다.','note'));
  target.append(card);
 };
 s.daily.slice(0,7).forEach(d=>addDay(d,timeline));
 if(period===30){
  const details=node('details'),summary=node('summary','이전 23일 보기');
  details.append(summary);
  const older=node('div',null,'day-list');s.daily.slice(7).forEach(d=>addDay(d,older));details.append(older);timeline.append(details);
 }
}
function renderAll(){if(!session){renderStats();return}renderProfiles();renderStats();renderRecords();renderSummary()}
function collectRecord(){
 return {date:$('recordDate').value,text:$('recordText').value.trim(),
  question:$('recordQuestion').value.trim(),sleep:$('sleep').value,meal:$('meal').value,
  medicationCheck:$('medicationCheck').value};
}
async function init(){
 $('recordDate').value=localToday();
 if(!globalThis.isSecureContext || !crypto?.subtle || !globalThis.indexedDB){
  status('vaultStatus','이 브라우저에서 보안 저장 기능이 지원되지 않습니다. HTTPS 환경의 최신 브라우저를 사용해 주세요.',true);
  $('vault-loading').textContent='암호화 저장소를 이용할 수 없습니다.';
  return;
 }
 try{
  const exists=await hasVault();
  toggle('vault-loading',false);toggle('vault-create',!exists);toggle('vault-unlock',exists);
  status('vaultStatus',exists?'저장된 암호화 보관함이 있습니다. 암호로 열어 주세요.':'새 보관함을 만들면 기록을 암호화하여 이 기기에 보관합니다.');
 }catch(e){status('vaultStatus','보관함 초기화에 실패했습니다: '+e.message,true)}
}
$('vault-create').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const pass=$('newPassword').value;
 if(pass!==$('confirmPassword').value){status('vaultStatus','비밀번호가 일치하지 않습니다.',true);return}
 if(!$('vaultConsent').checked){status('vaultStatus','보관 위험을 먼저 확인해 주세요.',true);return}
 setBusy(true);
 try{session=await createVault(pass);profileId=null;showUnlocked();
  $('profileName').focus();status('vaultStatus','새 암호화 보관함이 만들어졌습니다. 돌봄 대상의 별칭을 추가해 주세요.');
 }catch(error){status('vaultStatus',error.message,true)}finally{setBusy(false)}
});
$('vault-unlock').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 setBusy(true);
 try{session=await unlockVault($('unlockPassword').value);showUnlocked();}
 catch(error){status('vaultStatus',error.message,true)}
 finally{setBusy(false)}
});
$('lockButton').addEventListener('click',()=>{lock();location.hash='#unlock-area'});
$('profileForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!session||busy)return;
 const label=$('profileName').value.trim();
 try{
  const next=addProfile(session.data,label);
  const newId=next.profiles.at(-1).id;
  if(await update(next,'돌봄 대상이 추가되었습니다.','recordStatus')){
   profileId=newId;$('profileName').value='';stopEditing();renderAll();$('profileSelect').focus();
  }
 }catch(error){status('recordStatus',error.message,true)}
});
$('profileSelect').addEventListener('change',e=>{
 if(!session)return;profileId=e.target.value||null;allRecords=false;stopEditing();renderAll();
 status('recordStatus','현재 돌봄 대상을 변경했습니다.');
});
$('recordForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!session||!profileId||busy)return;
 const record=collectRecord();
 if(!record.text&&!record.question){status('recordStatus','돌봄 메모 또는 진료 질문을 입력하세요.',true);return}
 try{
  const next=editId?
   changeEntry(session.data,profileId,editId,record):
   addEntry(session.data,profileId,record);
  if(await update(next,editId?'기록을 수정·암호화하여 저장했습니다.':'새 기록을 암호화하여 저장했습니다.')){
   stopEditing();$('recordTitle').focus();
  }
 }catch(error){status('recordStatus',error.message,true)}
});
$('recordList').addEventListener('click',async e=>{
 const button=e.target.closest('button[data-action]');if(!button||!session||!profileId||busy)return;
 const rec=profileEntries(session.data,profileId).find(x=>x.id===button.dataset.id);
 if(!rec)return;
 if(button.dataset.action==='edit'){
  editId=rec.id;
  $('recordTitle').textContent='기존 기록 수정';$('recordTitle').tabIndex=-1;
  $('saveRecord').textContent='수정 후 암호화 저장';toggle('cancelEdit',true);
  for(const [id,value] of Object.entries({recordDate:rec.date,recordText:rec.text,recordQuestion:rec.question,
   sleep:rec.sleep,meal:rec.meal,medicationCheck:rec.medicationCheck}))$(id).value=value;
  location.hash='#diary';$('recordTitle').focus();
 }else if(button.dataset.action==='remove'){
  if(!confirm(rec.date+'의 선택한 대상자 기록 1건을 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다.'))return;
  try{
   const next=deleteEntry(session.data,profileId,rec.id);
   await update(next,'선택한 돌봄 대상의 기록 1건을 삭제했습니다.');
  }catch(error){status('recordStatus',error.message,true)}
 }
});
$('cancelEdit').addEventListener('click',stopEditing);
$('searchRecords').addEventListener('input',()=>{allRecords=false;renderRecords()});
$('showAllRecords').addEventListener('click',()=>{allRecords=true;renderRecords()});
$('summaryPeriod').addEventListener('change',renderSummary);
$('copySummary').addEventListener('click',async()=>{
 const value=$('summaryText').value;
 if(!value){status('consultStatus','복사할 기록이 없습니다.',true);return}
 try{await navigator.clipboard.writeText(value);status('consultStatus','선택한 대상자의 진료 메모를 복사했습니다. 공유 대상을 확인하세요.')}
 catch{$('summaryText').focus();$('summaryText').select();status('consultStatus','자동 복사가 차단됐습니다. 선택된 내용을 길게 눌러 직접 복사하세요.',true)}
});
$('printSummary').addEventListener('click',()=>{
 if(!session||!profileId)return;
 const style=document.createElement('style');style.id='temporary-print-style';
 style.textContent='@media print{body *{visibility:hidden!important}#summaryText,#summaryText *{visibility:visible!important}#summaryText{position:absolute!important;left:0;top:0;width:100%;height:auto;min-height:90vh;overflow:visible!important;border:0!important;color:#111!important}}';
 document.head.append(style);
 window.print();setTimeout(()=>style.remove(),1200);
 status('consultStatus','인쇄 또는 PDF 저장을 요청했습니다. 저장 성공 여부는 기기에서 직접 확인하세요.');
});
$('exportBackup').addEventListener('click',async()=>{
 if(!session||busy)return;
 setBusy(true);
 try{
  const text=await encryptedBackup(session);
  if(downloadLink)URL.revokeObjectURL(downloadLink);
  downloadLink=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const link=document.createElement('a');link.href=downloadLink;
  link.download='apuda-memory-encrypted-'+localToday()+'.json';
  document.body.append(link);link.click();link.remove();
  status('backupStatus','암호화 백업 파일 다운로드를 요청했습니다. 파일 목록에서 실제 저장 여부를 확인하세요.');
 }catch(e){status('backupStatus',e.message,true)}
 finally{setBusy(false)}
});
$('observeButton').addEventListener('click',()=>{
 const values=[...$('observeChecks').querySelectorAll('input:checked')].map(x=>x.value);
 toggle('observeResult',true);
 $('observeResult').textContent=values.length?
  '변화 '+values.length+'개를 선택했습니다. 이 숫자는 치매 진단 점수가 아닙니다. 관찰된 변화가 지속·악화되거나 생활에 영향을 준다면 의료진 또는 치매안심센터에 상담하세요. 진료 시에는 언제부터 어떤 변화가 있었는지 구체적으로 설명하는 것이 좋습니다.':
  '선택한 변화가 없더라도 치매를 배제할 수는 없습니다. 걱정되는 증상이 있다면 전문 상담을 받아 보세요.';
});
$('observeClear').addEventListener('click',()=>{
 for(const box of $('observeChecks').querySelectorAll('input'))box.checked=false;
 toggle('observeResult',false);
});
window.addEventListener('pagehide',()=>{
 if(downloadLink){URL.revokeObjectURL(downloadLink);downloadLink=null}
});
init();
