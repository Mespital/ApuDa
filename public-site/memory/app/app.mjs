import {
 addProfile,addEntry,changeEntry,deleteEntry,profileEntries,getSummary,
 hasVault,createVault,unlockVault,commitVault,encryptedBackup,formatSummaryText
} from './vault.mjs';

const $=id=>document.getElementById(id);
let session=null,profileId=null,editingId=null,activeView='today',visibleCount=5,busy=false,downloadUrl=null;
const today=()=>{
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
};
function setStatus(id,message,error=false){
 const x=$(id);x.textContent=message;x.classList.toggle('error',error);
}
function show(id,visible){$(id).hidden=!visible}
function buttonBusy(value){
 busy=value;
 for(const id of ['createButton','unlockButton','addProfileButton','saveButton','backupButton','lockButton'])
  $(id).disabled=value;
}
function option(value,label){
 const o=document.createElement('option');o.value=value;o.textContent=label;return o;
}
function resetDiary(){
 editingId=null;
 $('diaryForm').reset();
 $('entryDate').value=today();
 $('entryDate').max=today();
 $('saveButton').textContent='기록 저장하기';
 show('cancelEdit',false);
 $('titleToday').textContent='오늘 기록하기';
}
function clearDownload(){
 if(downloadUrl){URL.revokeObjectURL(downloadUrl);downloadUrl=null}
}
function lock(message='기록을 잠갔습니다. 비밀번호를 입력하면 다시 열 수 있습니다.'){
 session=null;profileId=null;editingId=null;
 clearDownload();
 $('newPass').value='';$('repeatPass').value='';$('unlockPass').value='';
 $('profileSelect').replaceChildren();$('historyList').replaceChildren();
 $('summaryText').value='';$('printSheet').textContent='';
 resetDiary();
 show('app',false);show('setup',true);show('loading',false);
 show('createForm',false);show('unlockForm',true);
 setStatus('setupStatus',message);
}
function switchView(view,focus=true){
 if(!['today','history','doctor'].includes(view))return;
 activeView=view;
 for(const [v,id,tab] of [['today','viewToday','tabToday'],
                          ['history','viewHistory','tabHistory'],
                          ['doctor','viewDoctor','tabDoctor']]){
  show(id,view===v);
  $(tab).setAttribute('aria-pressed',String(view===v));
 }
 if(view==='history')renderHistory();
 if(view==='doctor')renderDoctor();
 if(focus)$('title'+view[0].toUpperCase()+view.slice(1)).focus();
}
function selectedEntries(){return session&&profileId?profileEntries(session.data,profileId):[]}
function showUnlocked(){
 show('setup',false);show('app',true);
 $('newPass').value='';$('repeatPass').value='';$('unlockPass').value='';
 if(!session.data.profiles.some(p=>p.id===profileId))profileId=session.data.profiles[0]?.id||null;
 resetDiary();
 renderAll();
 switchView('today');
}
function renderProfiles(){
 const el=$('profileSelect');
 el.replaceChildren();
 if(!session||!session.data.profiles.length){
  el.append(option('','대상자를 먼저 추가하세요'));profileId=null;return;
 }
 if(!session.data.profiles.some(p=>p.id===profileId))profileId=session.data.profiles[0].id;
 for(const p of session.data.profiles)el.append(option(p.id,p.label));
 el.value=profileId;
}
function el(tag,text,css=''){
 const elem=document.createElement(tag);if(text!==undefined)elem.textContent=text;
 if(css)elem.className=css;return elem;
}
function renderHistory(){
 const box=$('historyList');box.replaceChildren();
 const items=selectedEntries();$('historyCount').textContent='총 '+items.length+'건의 기록';
 if(!items.length){
  box.append(el('p','아직 기록이 없습니다. 오늘 기록부터 남겨 보세요.','empty'));
  show('moreRecords',false);return;
 }
 for(const record of items.slice(0,visibleCount)){
  const card=el('article',undefined,'record'),date=el('time',record.date);
  date.dateTime=record.date;card.append(date);
  const parts=[record.sleep&&'잠 '+record.sleep,record.meal&&'식사 '+record.meal,
    record.medicationCheck&&'약 관련 '+record.medicationCheck].filter(Boolean);
  if(parts.length)card.append(el('div',parts.join(' · '),'meta'));
  if(record.text.trim())card.append(el('p',record.text));
  if(record.question.trim())card.append(el('p','진료 질문: '+record.question));
  const actions=el('div',undefined,'actions');
  for(const [action,label] of [['edit','수정'],['delete','삭제']]){
   const b=el('button',label,'btn '+(action==='delete'?'danger':'secondary'));
   b.type='button';b.dataset.action=action;b.dataset.id=record.id;
   actions.append(b);
  }
  card.append(actions);box.append(card);
 }
 show('moreRecords',items.length>visibleCount);
}
function renderDoctor(){
 if(!session||!profileId){$('summaryText').value='대상을 추가하세요.';return}
 const n=$('period').value==='30'?30:7;
 const sum=getSummary(session.data,profileId,n,today());
 $('sumRecords').textContent=sum.recordCount;
 $('sumDays').textContent=sum.observedDays;
 $('sumQuestions').textContent=sum.questions.length;
 $('summaryText').value=formatSummaryText(session.data,profileId,n,today());
}
function renderAll(){
 renderProfiles();renderHistory();renderDoctor();
}
async function save(next,message,statusId='saveStatus'){
 if(!session||busy)return false;
 buttonBusy(true);
 try{
  await commitVault(session,next);
  renderAll();setStatus(statusId,message);return true;
 }catch(error){
  if(/다른 탭에서 기록이 변경/.test(error.message)){
   lock('다른 탭에서 기록이 바뀌었습니다. 비밀번호로 다시 열어 주세요.');
  }else setStatus(statusId,'저장하지 못했습니다: '+error.message,true);
  return false;
 }finally{buttonBusy(false)}
}
async function ensureFirstProfile(){
 if(session.data.profiles.length===0){
  const next=addProfile(session.data,'돌봄 대상 1');
  await commitVault(session,next);
 }
}
function recordInput(){
 const selected=name=>document.querySelector('input[name="'+name+'"]:checked')?.value||'';
 const date=$('entryDate').value;
 const sleep=selected('sleep'),meal=selected('meal'),medicationCheck=selected('medicationCheck');
 let text=$('entryMemo').value.trim(),question=$('entryQuestion').value.trim();
 if(!text&&!question&&(sleep||meal||medicationCheck))text='오늘의 돌봄 상태를 기록했습니다.';
 return {date,text,question,sleep,meal,medicationCheck};
}
async function initialize(){
 $('entryDate').value=today();$('entryDate').max=today();
 if(!globalThis.isSecureContext||!globalThis.crypto?.subtle||!globalThis.indexedDB){
  $('loading').textContent='이 브라우저에서는 보안 저장 기능을 사용할 수 없습니다.';
  setStatus('setupStatus','최신 Chrome 또는 Safari의 HTTPS 주소에서 열어 주세요.',true);return;
 }
 try{
  const exists=await hasVault();
  show('loading',false);show('createForm',!exists);show('unlockForm',exists);
  setStatus('setupStatus',exists?'비밀번호를 입력해 이전 기록을 여세요.':'처음 시작할 때만 비밀번호를 설정하세요.');
 }catch(error){
  $('loading').textContent='보관함을 열 수 없습니다.';
  setStatus('setupStatus',error.message,true);
 }
}
$('createForm').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 const pass=$('newPass').value;
 if(pass!==$('repeatPass').value){setStatus('setupStatus','비밀번호가 서로 다릅니다.',true);return}
 if(!$('safetyCheck').checked){setStatus('setupStatus','주의사항을 먼저 확인해 주세요.',true);return}
 buttonBusy(true);
 try{
  session=await createVault(pass);
  await ensureFirstProfile();
  showUnlocked();
 }catch(error){
  setStatus('setupStatus',error.message,true);
  if(session){lock('보관함이 만들어졌지만 초기 설정을 마치지 못했습니다. 비밀번호로 다시 열어 주세요.')}
 }finally{buttonBusy(false)}
});
$('unlockForm').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 buttonBusy(true);
 try{
  session=await unlockVault($('unlockPass').value);
  await ensureFirstProfile();
  showUnlocked();
 }catch(error){
  setStatus('setupStatus',error.message,true);
  session=null;
 }finally{buttonBusy(false)}
});
$('lockButton').addEventListener('click',()=>lock());
for(const tab of document.querySelectorAll('button[data-view]'))
 tab.addEventListener('click',()=>switchView(tab.dataset.view));
$('profileSelect').addEventListener('change',event=>{
 if(!session||busy)return;
 profileId=event.target.value;
 visibleCount=5;resetDiary();renderAll();switchView(activeView,false);
});
$('addProfileForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!session||busy)return;
 try{
  const next=addProfile(session.data,$('profileName').value.trim());
  const addedId=next.profiles.at(-1).id;
  if(await save(next,'새 돌봄 대상을 추가했습니다.','saveStatus')){
   profileId=addedId;visibleCount=5;resetDiary();renderAll();
   $('profileName').value='';$('profileDetails').open=false;
   $('profileSelect').focus();
  }
 }catch(error){setStatus('saveStatus',error.message,true)}
});
$('diaryForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!session||!profileId||busy)return;
 const record=recordInput();
 if(record.date>today()){setStatus('saveStatus','미래 날짜는 기록할 수 없습니다.',true);return}
 if(!record.text&&!record.question){
  setStatus('saveStatus','잠·식사·약 확인 중 하나를 선택하거나 메모를 적어 주세요.',true);
  return;
 }
 try{
  const next=editingId?
   changeEntry(session.data,profileId,editingId,record):
   addEntry(session.data,profileId,record);
  const msg=editingId?'수정한 기록이 저장됐습니다.':'기록이 저장됐습니다.';
  if(await save(next,msg)){resetDiary();visibleCount=5;renderHistory();}
 }catch(error){setStatus('saveStatus',error.message,true)}
});
$('cancelEdit').addEventListener('click',()=>{resetDiary();setStatus('saveStatus','수정을 취소했습니다.')});
$('historyList').addEventListener('click',async event=>{
 const button=event.target.closest('button[data-action]');
 if(!button||!session||!profileId||busy)return;
 const rec=selectedEntries().find(r=>r.id===button.dataset.id);
 if(!rec)return;
 if(button.dataset.action==='edit'){
  editingId=rec.id;resetDiary();editingId=rec.id;
  $('titleToday').textContent='기록 수정하기';
  $('saveButton').textContent='수정 내용 저장하기';show('cancelEdit',true);
  $('entryDate').value=rec.date;
  $('entryMemo').value=rec.text==='오늘의 돌봄 상태를 기록했습니다.'?'':rec.text;
  $('entryQuestion').value=rec.question;
  for(const name of ['sleep','meal','medicationCheck']){
   const radio=[...document.querySelectorAll('input[name="'+name+'"]')].find(x=>x.value===rec[name]);
   if(radio)radio.checked=true;
  }
  switchView('today');$('entryMemo').focus();
 }else if(button.dataset.action==='delete'){
  if(!confirm(rec.date+' 기록 1건을 삭제할까요?\n삭제 후 되돌릴 수 없습니다.'))return;
  try{
   const next=deleteEntry(session.data,profileId,rec.id);
   await save(next,'기록 1건을 삭제했습니다.','historyStatus');
  }catch(error){setStatus('historyStatus',error.message,true)}
 }
});
$('moreRecords').addEventListener('click',()=>{visibleCount+=10;renderHistory()});
$('period').addEventListener('change',renderDoctor);
$('copyButton').addEventListener('click',async()=>{
 if(!session||!profileId)return;
 try{
  await navigator.clipboard.writeText($('summaryText').value);
  setStatus('doctorStatus','진료 메모를 복사했습니다. 공유 상대를 확인하세요.');
 }catch{
  $('summaryText').focus();$('summaryText').select();
  setStatus('doctorStatus','자동 복사가 안 됩니다. 선택된 글을 길게 눌러 직접 복사하세요.',true);
 }
});
$('printButton').addEventListener('click',()=>{
 if(!session||!profileId)return;
 $('printSheet').textContent=$('summaryText').value;
 window.print();
 setStatus('doctorStatus','인쇄 또는 PDF 저장을 요청했습니다. 기기에서 저장 여부를 확인하세요.');
});
window.addEventListener('afterprint',()=>{$('printSheet').textContent=''});
$('backupButton').addEventListener('click',async()=>{
 if(!session||busy)return;
 buttonBusy(true);
 try{
  const contents=await encryptedBackup(session);
  clearDownload();
  downloadUrl=URL.createObjectURL(new Blob([contents],{type:'application/json'}));
  const link=document.createElement('a');link.href=downloadUrl;
  link.download='apuda-memory-encrypted-'+today()+'.json';
  document.body.append(link);link.click();link.remove();
  setStatus('backupStatus','암호화 백업 다운로드를 요청했습니다. 기기 파일 목록을 확인하세요.');
 }catch(error){setStatus('backupStatus',error.message,true)}
 finally{buttonBusy(false)}
});
// Optional dementia-service hub: public information can be viewed without unlocking.
// Checklists are temporary. They are NEVER silently imported into encrypted records.
for(const id of ['servicesNav','servicesShortcut']){
 $(id).addEventListener('click',()=>{
  $('allServices').open=true;
 });
}
function checkedServices(group){
 return [...$(group).querySelectorAll('input[type="checkbox"]:checked')].map(node=>node.value);
}
function moveToDiary(label,items){
 if(!items.length){
  setStatus('serviceStatus','옮길 내용을 먼저 선택해 주세요.',true);
  return;
 }
 if(!session||!profileId){
  setStatus('serviceStatus','일지에 남기려면 먼저 위에서 가족 보관함을 열어 주세요.',true);
  $('setup').scrollIntoView({block:'start'});
  return;
 }
 if(editingId){
  if(!confirm('현재 다른 기록을 수정 중입니다. 수정을 취소하고 새로운 일지를 시작할까요?'))return;
  resetDiary();
 }
 const memo='['+label+']\n'+items.map(x=>'• '+x).join('\n');
 const existing=$('entryMemo').value.trim();
 const appended=existing?existing+'\n\n'+memo:memo;
 if(appended.length>1500){
  setStatus('serviceStatus','메모가 1,500자를 초과합니다. 일지를 먼저 저장하거나 내용을 줄여 주세요.',true);
  return;
 }
 $('entryMemo').value=appended;
 switchView('today',false);
 $('viewToday').scrollIntoView({block:'start'});
 $('titleToday').focus();
 setStatus('saveStatus','선택한 내용을 일지에 옮겼습니다. 아래 ‘기록 저장하기’를 눌러야 저장됩니다.');
 setStatus('serviceStatus','일지 입력란으로 옮겼습니다. 아직 저장되지는 않았습니다.');
}
$('memoryReview').addEventListener('click',()=>{
 const items=checkedServices('memoryChecks');
 show('memoryResult',true);
 $('memoryResult').textContent=items.length?
  '관찰된 변화 '+items.length+'개를 선택했습니다. 개수는 치매 위험 점수가 아닙니다.\n' +
  '변화가 언제부터, 얼마나 자주 일어났는지 기록하여 의료진이나 치매안심센터에 상담하세요.':
  '선택한 항목이 없더라도 치매를 배제할 수 없습니다. 생활에 영향을 주는 변화가 있다면 상담하세요.';
 setStatus('serviceStatus','관찰 안내를 확인했습니다.');
});
$('memoryToDiary').addEventListener('click',()=>{
 moveToDiary('기억·행동 변화 관찰',checkedServices('memoryChecks'));
});
$('routineToDiary').addEventListener('click',()=>{
 moveToDiary('하루 생활 점검',checkedServices('routineChecks'));
});
$('safetyToDiary').addEventListener('click',()=>{
 moveToDiary('생활·실종 예방 안전 점검',checkedServices('safetyChecks'));
});
const activities={
 album:{label:'가족 사진 보며 이야기하기',guide:'사진을 한 장 골라 “이때 어디에 있었나요?”처럼 편안하게 이야기해 보세요. 답을 맞히도록 압박하지 않습니다.'},
 music:{label:'좋아하는 음악 듣기',guide:'익숙하고 편안한 음악을 함께 듣거나 가볍게 흥얼거려 보세요. 불편해하면 즉시 멈춥니다.'},
 objects:{label:'익숙한 물건 이야기하기',guide:'평소 쓰던 물건 한 가지를 함께 보고 사용했던 추억을 편안하게 이야기해 보세요.'},
 walk:{label:'안전하게 짧은 산책하기',guide:'현재 몸 상태와 의료진 안내를 확인하고, 넘어짐·길 잃음 위험이 없도록 동행하며 짧게 걸어 보세요.'}
};
$('activitySelect').addEventListener('change',()=>{
 $('activityGuide').textContent=activities[$('activitySelect').value].guide;
});
$('activityToDiary').addEventListener('click',()=>{
 const activity=activities[$('activitySelect').value];
 moveToDiary('인지·대화 활동',[activity.label+' (함께 해볼 활동)']);
});
window.addEventListener('pagehide',()=>{
 clearDownload();
 if(session)lock('앱을 나가 보관함을 잠갔습니다.');
});
initialize();
