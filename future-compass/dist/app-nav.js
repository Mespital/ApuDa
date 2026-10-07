/* 모든 화면 공통 하단 내비게이션 (승준·엄마 메뉴가 다름) + ☰ 전체 메뉴
   - 공부방(study.html)에서는 탭 이동, 다른 화면에서는 공부방의 해당 탭으로 이동
   - pin-gate.js보다 먼저 불러와야 함(상단 잠그기 버튼 대신 ☰ 전체에 넣음) */
(function () {
  'use strict';
  window.FC_APPNAV = 1;
  function who() { try { return localStorage.getItem('fc-who-v1') === 'parent' ? 'parent' : 'child'; } catch (e) { return 'child'; } }
  var onStudy = /study\.html$/.test(location.pathname);
  var NAV = {
    child: [['today', '☀️', '오늘'], ['week', '📅', '주간'], ['table', '🗓️', '시간표'], ['dates', '📝', '시험'], ['review', '💡', '복습'], ['more', '☰', '전체']],
    parent: [['today', '📊', '현황'], ['stats', '📈', '통계'], ['week', '📅', '주간'], ['table', '🗓️', '시간표'], ['dates', '📝', '시험'], ['more', '☰', '전체']]
  };
  var MORE = {
    child: [['study.html#stats', '📈', '나의 기록'], ['study.html#focus', '⏱️', '집중 타이머'], ['today.html', '📋', '오늘 한눈에'], ['study.html#review', '📒', '수업 노트'], ['hub.html', '📚', '자료 허브'], ['./', '🧭', '진로 탐색'], ['future.html', '🔮', '미래 예측'], ['know-me.html', '✨', '나 알아보기'], ['study.html#settings', '⚙️', '설정'], ['#lock', '🔒', '잠그기']],
    parent: [['study.html#review', '💡', '복습'], ['today.html', '📋', '오늘 한눈에'], ['study.html#week', '🪨', '이번 주 큰 돌'], ['hub.html', '📚', '자료 허브'], ['./', '🧭', '승준 진로'], ['study.html#settings', '⚙️', '설정'], ['#who', '🔄', '승준으로 바꾸기'], ['#lock', '🔒', '잠그기']]
  };
  function current() { if (!onStudy) return 'more'; var h = location.hash.slice(1); return h || 'today'; }
  function draw() {
    var nav = document.querySelector('nav.appnav'); if (!nav) { nav = document.createElement('nav'); nav.className = 'appnav'; nav.setAttribute('aria-label', '메뉴'); document.body.appendChild(nav); }
    var cur = current(), list = NAV[who()], keys = list.map(function (x) { return x[0]; });
    nav.innerHTML = list.map(function (x) {
      var on = x[0] === cur || (x[0] === 'more' && keys.indexOf(cur) < 0);
      return '<button type="button" data-appnav="' + x[0] + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '><i aria-hidden="true">' + x[1] + '</i><span>' + x[2] + '</span></button>';
    }).join('');
  }
  function openMore() {
    var old = document.querySelector('.appnav-sheet'); if (old) { old.remove(); return; }
    var s = document.createElement('div'); s.className = 'appnav-sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', '전체 메뉴');
    s.innerHTML = '<div class="appnav-panel"><div class="appnav-grip"></div><p class="appnav-h">' + (who() === 'parent' ? '엄마 메뉴' : '전체 메뉴') + '</p><div class="appnav-grid">' +
      MORE[who()].map(function (x) { return '<a href="' + x[0] + '" data-more="' + x[0] + '"><i aria-hidden="true">' + x[1] + '</i><span>' + x[2] + '</span></a>'; }).join('') + '</div></div>';
    document.body.appendChild(s);
    s.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) { if (e.target === s) s.remove(); return; }
      var href = a.getAttribute('href');
      if (href === '#lock') { e.preventDefault(); s.remove(); if (window.PinGate) PinGate.lock(); return; }
      if (href === '#who') { e.preventDefault(); s.remove(); if (window.PinGate) PinGate.switchWho(); return; }
      if (onStudy && href.indexOf('study.html#') === 0) { e.preventDefault(); s.remove(); go(href.split('#')[1]); }
    });
  }
  function go(key) {
    if (!onStudy) { location.href = 'study.html#' + key; return; }
    if (location.hash === '#' + key) { if (typeof render === 'function') { try { tab = key; } catch (e) {} render(); } }
    else location.hash = key;
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-appnav]'); if (!b) return;
    var k = b.getAttribute('data-appnav');
    if (k === 'more') { openMore(); return; }
    var sh = document.querySelector('.appnav-sheet'); if (sh) sh.remove();
    go(k);
  });
  window.addEventListener('hashchange', function () { draw(); var sh = document.querySelector('.appnav-sheet'); if (sh) sh.remove(); });
  window.addEventListener('pin-unlocked', draw);
  window.addEventListener('pin-who', draw);
  function boot() { document.body.classList.add('has-appnav'); draw(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  var css = document.createElement('style');
  css.textContent =
    'body.has-appnav{padding-bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}' +
    'body.has-appnav .bottom-nav,body.has-appnav nav.tabbar{display:none!important}' +
    '.appnav{position:fixed!important;top:auto!important;left:0;right:0;bottom:0;height:auto!important;overflow:visible!important;gap:0!important;z-index:40;display:grid;grid-template-columns:repeat(6,1fr);padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));background:rgba(255,255,255,.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid #ecebf2;font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif}' +
    '.appnav button{all:unset;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:52px;border-radius:12px;color:#8d8a9c;font-size:11px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:center}' +
    '.appnav button i{font-style:normal;font-size:20px;line-height:1;filter:grayscale(1);opacity:.6}.appnav button.on{color:#5b45d6}.appnav button.on i{filter:none;opacity:1}.appnav button:focus-visible{outline:2px solid #5b45d6}' +
    '.appnav button span{white-space:nowrap}' +
    '@media(min-width:760px){.appnav{left:50%;right:auto;transform:translateX(-50%);width:620px;bottom:14px;border:1px solid #ecebf2;border-radius:20px;box-shadow:0 8px 30px rgba(40,30,90,.10)}}' +
    '.appnav-sheet{position:fixed;inset:0;z-index:60;background:rgba(20,16,50,.35);display:flex;align-items:flex-end;justify-content:center}' +
    '.appnav-panel{background:#fff;width:min(560px,100%);border-radius:22px 22px 0 0;padding:8px 16px calc(92px + env(safe-area-inset-bottom,0px))}.appnav-grip{width:40px;height:4px;border-radius:2px;background:#dcd8ea;margin:4px auto 10px}.appnav-h{margin:0 0 10px;font-weight:800;font-size:15px;color:#22202e}' +
    '.appnav-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.appnav-grid a{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px;border-radius:14px;background:#f7f6fb;color:#3d3a52;text-decoration:none;font-size:12px;font-weight:600;text-align:center}.appnav-grid i{font-style:normal;font-size:22px}' +
    '.shiro-launch{bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}.shiro-hint{bottom:calc(150px + env(safe-area-inset-bottom,0px))!important}#notice{bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}.pin-toast{bottom:calc(92px + env(safe-area-inset-bottom,0px))!important}';
  (document.head || document.documentElement).appendChild(css);
})();
