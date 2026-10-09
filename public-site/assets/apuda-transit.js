/* ApuDa 이동 화면 — 같은 탭에서 다른 앱·페이지로 넘어갈 때 "ApuDa 아프지만, 다행이다 · 이동 중입니다"를 보여 준다.
 * 사용: <script src="/assets/apuda-transit.js" defer></script>  (apuda-bot.js가 있으면 자동으로 함께 불러옴)
 * 수동: ApudaTransit.go('/note/')  ·  링크에서 빼려면 data-no-transit */
(function(){
'use strict';
if(window.ApudaTransit)return;
var css='#apdTransit{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(244,247,252,.94);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .18s ease;font-family:-apple-system,BlinkMacSystemFont,"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif}'+
'#apdTransit.on{opacity:1;pointer-events:auto}'+
'#apdTransit .bx{display:flex;flex-direction:column;align-items:center;gap:14px;padding:28px 30px;border-radius:24px;background:#fff;box-shadow:0 18px 50px rgba(15,23,42,.14);border:1px solid #e2e8f2;min-width:240px;max-width:86vw;text-align:center;transform:translateY(8px);transition:transform .25s ease}'+
'#apdTransit.on .bx{transform:none}'+
'#apdTransit .lg{width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;font-weight:900;font-size:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(37,99,235,.3);animation:apdPulse 1.2s ease-in-out infinite}'+
'#apdTransit .br{font-size:20px;font-weight:900;letter-spacing:-.03em;color:#0f1d33;line-height:1.35}#apdTransit .br b{color:#1d4ed8}'+
'#apdTransit .sl{font-size:15px;font-weight:800;color:#1f3350}'+
'#apdTransit .dt{display:flex;gap:6px}#apdTransit .dt i{width:8px;height:8px;border-radius:50%;background:#3b82f6;animation:apdDot 1s ease-in-out infinite}#apdTransit .dt i:nth-child(2){animation-delay:.15s}#apdTransit .dt i:nth-child(3){animation-delay:.3s}'+
'#apdTransit .to{font-size:13px;color:#4a5a70;font-weight:700;margin-top:-4px}'+
'@keyframes apdPulse{50%{transform:scale(1.06)}}@keyframes apdDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}'+
'@media (prefers-reduced-motion:reduce){#apdTransit .lg,#apdTransit .dt i{animation:none}}';
var el=null,timer=null;
function build(){if(el)return el;var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  el=document.createElement('div');el.id='apdTransit';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML='<div class="bx"><div class="lg" aria-hidden="true">A</div><div class="br"><b>ApuDa</b> 아프지만, 다행이다</div><div class="sl">이동 중입니다</div><div class="dt" aria-hidden="true"><i></i><i></i><i></i></div><div class="to" id="apdTransitTo"></div></div>';
  document.body.appendChild(el);return el}
function show(label){var e=build();var t=e.querySelector('#apdTransitTo');t.textContent=label?'→ '+label:'';t.hidden=!label;
  void e.offsetWidth;e.classList.add('on');clearTimeout(timer);timer=setTimeout(hide,12000)}
function hide(){if(el)el.classList.remove('on');clearTimeout(timer)}
function labelOf(a){var t=(a&&(a.getAttribute('data-transit-label')||a.getAttribute('aria-label')||a.textContent)||'').replace(/\s+/g,' ').trim();
  t=t.replace(/[→›»]/g,'').trim();if(t.length>18)t=t.slice(0,18).trim()+'…';return t}
function sameDoc(u){return u.origin===location.origin&&u.pathname===location.pathname&&u.search===location.search}
function go(url,label){var u;try{u=new URL(url,location.href)}catch(e){location.href=url;return}
  if(sameDoc(u)&&u.hash){location.href=u.href;return}
  show(label||'');setTimeout(function(){location.href=u.href},60)}
document.addEventListener('click',function(ev){
  if(ev.defaultPrevented||ev.button!==0||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;
  var a=ev.target.closest&&ev.target.closest('a[href]');if(!a)return;
  if(a.hasAttribute('download')||a.hasAttribute('data-no-transit'))return;
  var tg=(a.getAttribute('target')||'').toLowerCase();if(tg&&tg!=='_self')return;
  var href=a.getAttribute('href');if(!href||href.charAt(0)==='#'||/^(tel|mailto|sms|javascript|blob|data):/i.test(href))return;
  var u;try{u=new URL(a.href)}catch(e){return}
  if(!/^https?:$/.test(u.protocol))return;
  if(sameDoc(u))return;
  ev.preventDefault();go(u.href,labelOf(a));
},false);
window.addEventListener('pageshow',hide);
window.addEventListener('pagehide',function(){setTimeout(hide,400)});
window.ApudaTransit={go:go,show:show,hide:hide};
})();
