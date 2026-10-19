/* 🎞 모션 스타일 가이드 (2026-10-20)
   한 가지 규칙으로 움직임을 통일한다. (Jitter식 '스타일 등록 → 같은 톤으로 적용' 방식을 앱 UI에 맞춤)
   ┌ 시간  --mo-1 120ms(누름) · --mo-2 200ms(작은 변화) · --mo-3 320ms(화면 들어옴) · --mo-4 480ms(축하)
   ├ 곡선  --ease-out cubic-bezier(.2,.8,.2,1) 부드럽게 멈춤 · --ease-spring cubic-bezier(.34,1.56,.64,1) 살짝 튕김
   └ 거리  들어올 때 위로 8px · 시트는 아래에서 24px · 크기 변화 0.97~1.04
   쓰는 곳: 탭 바꿀 때 카드 차례로 등장(30ms 간격, 앞 8개) · 버튼 누름 · 할 일 체크 · 접기 펼침 · 아래 시트 · 알림 토스트
   '동작 줄이기'(기기 설정)면 전부 끈다. 다시 그리기(render)마다 움직이지 않고, 탭이 바뀔 때만 들어오는 움직임을 준다. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var css = document.createElement('style');
  css.textContent = [
    ':root{--mo-1:120ms;--mo-2:200ms;--mo-3:320ms;--mo-4:480ms;--ease-out:cubic-bezier(.2,.8,.2,1);--ease-spring:cubic-bezier(.34,1.56,.64,1)}',
    '@keyframes moRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '@keyframes moUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}',
    '@keyframes moPop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}',
    '@keyframes moFade{from{opacity:0}to{opacity:1}}',
    /* 알약 하나씩 톡톡 (Jitter Color Pills: Reveal) */
    '@keyframes moPill{0%{opacity:0;transform:scale(.6)}60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}',
    'html.mo-on .mo-pill{animation:moPill var(--mo-3) var(--ease-spring) both;animation-delay:calc(140ms + var(--mo-p,0) * 45ms)}',
    '@keyframes moToast{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}',
    /* 탭이 바뀔 때 카드가 차례로 */
    'html.mo-on #content>.mo-in{animation:moRise var(--mo-3) var(--ease-out) both;animation-delay:calc(var(--mo-i,0) * 30ms)}',
    /* 누를 때 살짝 눌림 */
    'html.mo-on body.app :is(button,.tn-gpt,.tn-gpt-main,.nx-map,.sl-today,.gd-entry,.appnav button):active{transform:scale(.97);transition:transform var(--mo-1) var(--ease-out)}',
    'html.mo-on body.app :is(button,.tn-gpt,.tn-gpt-main){transition:transform var(--mo-1) var(--ease-out),background-color var(--mo-2),color var(--mo-2),box-shadow var(--mo-2)}',
    /* 체크하면 톡 */
    'html.mo-on body.app #content input[type=checkbox]:checked{animation:moPop var(--mo-3) var(--ease-spring)}',
    'html.mo-on body.app #content .mo-done{transition:opacity var(--mo-3) var(--ease-out);opacity:.55}',
    /* 접기 펼치기 */
    'html.mo-on body.app details[open]>:not(summary){animation:moFade var(--mo-2) var(--ease-out)}',
    'html.mo-on body.app details>summary::after{transition:transform var(--mo-2) var(--ease-out)}',
    /* 아래에서 올라오는 시트 */
    'html.mo-on :is(.tn-sheet .tn-panel,.as-sheet,.rc-sheet,.appnav-sheet){animation:moUp var(--mo-3) var(--ease-spring)}',
    /* 알림 토스트 */
    'html.mo-on #notice[style*="block"],html.mo-on #notice.show{animation:moToast var(--mo-2) var(--ease-out)}'
  ].join('\n');
  document.head.appendChild(css);
  function sync() { root.classList.toggle('mo-on', !reduce.matches); }
  sync(); if (reduce.addEventListener) reduce.addEventListener('change', sync);

  /* 탭이 바뀔 때만 등장 움직임 */
  if (typeof render !== 'function') return;
  var last = null;
  var prev = render;
  render = function () {
    prev();
    var t = typeof tab !== 'undefined' ? tab : '';
    if (t === last) return;
    last = t;
    if (reduce.matches) return;
    var c = document.getElementById('content'); if (!c) return;
    var kids = [].slice.call(c.children).filter(function (x) { return x.offsetParent !== null; }).slice(0, 8);
    kids.forEach(function (k, i) { k.style.setProperty('--mo-i', i); k.classList.remove('mo-in'); void k.offsetWidth; k.classList.add('mo-in'); });
    setTimeout(function () { kids.forEach(function (k) { k.classList.remove('mo-in'); k.style.removeProperty('--mo-i'); }); }, 320 + 8 * 30 + 80);
    // 과목 알약·칩·날짜는 하나씩 톡톡 (첫 화면에 보이는 것 14개까지)
    var pills = [].slice.call(c.querySelectorAll('.sl-sub, .pl-chips > button, .seg2 > button, .wd-row > .wd, .sub-dot')).filter(function (x) { var r = x.getBoundingClientRect(); return x.offsetParent !== null && r.top < innerHeight; }).slice(0, 14);
    pills.forEach(function (p, i) { p.style.setProperty('--mo-p', i); p.classList.add('mo-pill'); });
    setTimeout(function () { pills.forEach(function (p) { p.classList.remove('mo-pill'); p.style.removeProperty('--mo-p'); }); }, 140 + 14 * 45 + 400);
  };
  /* 할 일 체크하면 줄이 살짝 흐려지게 (다시 그려지기 전 짧은 피드백) */
  document.addEventListener('change', function (e) {
    var cb = e.target; if (!cb || cb.type !== 'checkbox' || !cb.closest || !cb.closest('#content')) return;
    var row = cb.closest('.row,li,.pl-task,.task,label'); if (row && cb.checked) row.classList.add('mo-done');
  });
})();
