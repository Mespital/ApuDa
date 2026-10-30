// /risk/ 암검진 앱: 한국어 브라우저는 첫 진입 언어 선택 창을 건너뛴다 (2026-10-31 환자감수단 P0).
// 원본 앱 DOM을 모르는 상태에서 텍스트로 찾아 '사람이 누른 것처럼' 한국어 → 시작을 누른다.
// 창을 못 찾거나 구조가 다르면 아무것도 하지 않는다. 🌐 버튼으로 언제든 언어 변경 가능.
(function(){
  'use strict';
  var lang=(navigator.languages&&navigator.languages[0])||navigator.language||'';
  if(!/^ko\b/i.test(lang)) return;
  var tries=0;
  function visible(el){ if(!el) return false; var r=el.getBoundingClientRect(), cs=getComputedStyle(el);
    return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'; }
  function byText(root,sel,re){ var list=root.querySelectorAll(sel);
    for(var i=0;i<list.length;i++){ if(re.test((list[i].textContent||'').replace(/\s+/g,' ').trim())) return list[i]; } return null; }
  function run(){
    tries++;
    var heading=byText(document,'h1,h2,h3,b,strong,div,p',/^언어를 선택하세요$/);
    if(!heading||!visible(heading)){ if(tries<20) setTimeout(run,150); return; }
    var box=heading; for(var k=0;k<6&&box.parentElement;k++){ box=box.parentElement; if(byText(box,'button,a,[role=button]',/이 언어로 시작하기/)) break; }
    var ko=byText(box,'button,label,[role=radio],[role=button],li,a',/^한국어\s*Korean$|^한국어$/);
    var start=byText(box,'button,a,[role=button]',/이 언어로 시작하기/);
    if(!start) return;
    try{ if(ko) ko.click(); setTimeout(function(){ start.click(); },60); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
