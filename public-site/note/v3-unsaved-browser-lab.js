/* DEV ONLY: Chrome test of real V3 guard & unsaved draft modules with Map storage.
 * Never access localStorage, IndexedDB, real patient/essay data, or Drive.
 * This harness is not the full operational V3 application.
 */
(function(){
'use strict';
const KEY='synthetic-note',CHAT_KEY='synthetic-chat';
const note=JSON.stringify({profile:{name:'가상환자'},logs:[],questions:[{question:'가상 질문'}],test:true});
const chat=JSON.stringify([{w:'me',h:'가상 대화'}]);
let persisted=new Map([[KEY,note],[CHAT_KEY,chat]]);
let expectedNote=note,expectedChat=chat,paused=false,quota=false;
const fence=window.ApuDaNoteV3WriteFence,vault=window.ApuDaNoteUnsavedDraft;
const storage={
  getItem:key=>persisted.has(key)?persisted.get(key):null,
  setItem(key,value){if(quota)throw Error('QuotaExceededError');persisted.set(key,value);}
};
function output(message){
  document.getElementById('status').textContent=message;
  document.getElementById('details').textContent=JSON.stringify({
    originalPreserved:persisted.get(KEY),chatPreserved:persisted.get(CHAT_KEY),
    drafts:vault.count(),paused
  },null,2);
}
function hold(kind,raw,error){
  paused=true;
  const captured=vault.capture(kind,raw,error.message);
  document.getElementById('alert').hidden=false;
  document.getElementById('alert-summary').textContent='임시 보존 '+vault.count()+'건 · 저장 실패. '+(captured?'다운로드 파일을 확인하세요.':'메모리 제한으로 보존 실패');
}
function attempt(kind,next){
  try{
    if(paused)throw Error('writes-paused');
    if(kind==='note')expectedNote=fence.write(storage,KEY,expectedNote,next);
    else expectedChat=fence.write(storage,CHAT_KEY,expectedChat,next);
    output('잘못된 테스트: 쓰기 성공');
  }catch(error){hold(kind,next,error);output('저장 거부: '+error.message);}
}
function exportJSON(){
  const blob=new Blob([vault.exportText()],{type:'application/json'});
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download='ApuDa_저장실패_검토용_가상데이터.json';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  output('JSON 다운로드 요청. 실제 파일 검증으로 성공을 확인해야 합니다.');
}
document.getElementById('conflict').onclick=()=>{
  persisted.set(KEY,JSON.stringify({profile:{name:'다른 탭'},logs:[],questions:[{question:'최신'}]}));
  attempt('note',JSON.stringify({profile:{name:'가상환자 수정본'},logs:[],questions:[{question:'미저장'}]}));
};
document.getElementById('chat-conflict').onclick=()=>{
  persisted.set(CHAT_KEY,JSON.stringify([{w:'me',h:'다른 탭의 최신 대화'}]));
  attempt('chat',JSON.stringify([{w:'me',h:'이 탭의 미저장 대화'}]));
};
document.getElementById('quota').onclick=()=>{
  quota=true;attempt('note',JSON.stringify({profile:{name:'용량 오류 수정본'},logs:[],questions:[]}));
};
document.getElementById('export').onclick=exportJSON;
document.getElementById('reset-test').onclick=()=>location.reload();
window.addEventListener('beforeunload',event=>{if(vault.count()>0){event.preventDefault();event.returnValue='';}});
window.__labState=()=>({persistedNote:persisted.get(KEY),persistedChat:persisted.get(CHAT_KEY),
  drafts:vault.count(),paused,warning:!document.getElementById('alert').hidden});
output('가상 저장소 준비');
})();
