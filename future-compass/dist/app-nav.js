/* 모든 화면 공통 하단 내비게이션 (승준·엄마 메뉴가 다름) + ☰ 전체 메뉴
   - 공부방(study.html)에서는 탭 이동, 다른 화면에서는 공부방의 해당 탭으로 이동
   - pin-gate.js보다 먼저 불러와야 함(상단 잠그기 버튼 대신 ☰ 전체에 넣음) */
(function () {
  'use strict';
  window.FC_APPNAV = 1;
  function who() { try { return localStorage.getItem('fc-who-v1') === 'parent' ? 'parent' : 'child'; } catch (e) { return 'child'; } }
  var onStudy = /study\.html$/.test(location.pathname);
  var NAV = {
    child: [['today', '☀️', '오늘'], ['week', '📅', '주간'], ['focus', '⏱', '집중', 1], ['review', '🧠', '복습'], ['more', '☰', '더보기']],
    parent: [['today', '💜', '오늘'], ['stats', '📈', '흐름'], ['cheer', '💌', '응원', 1], ['week', '📅', '일정'], ['more', '☰', '더보기']]
  };
  var MORE = {
    // 묶음 제목은 ['#group', '', '이름'] (승준 리뷰 6: 17개를 4묶음으로, 아이콘·이름 겹침 정리)
    child: [['#group', '', '공부'], ['study.html#dash', '📊', '한눈에 보기'], ['study.html#books', '📖', '내 교과서'], ['study.html#dates', '📝', '시험·과제'], ['study.html#table', '🗓️', '시간표'], ['study.html#grades', '🧮', '내신 계산기'], ['study.html#examplan', '📅', '기말 플랜'], ['study.html#stats', '📈', '나의 기록'],
      ['#group', '', '학교'], ['study.html#school', '🏫', '학교 소식·평가'], ['today.html', '📋', '오늘 한눈에'],
      ['#group', '', '진로'], ['study.html#path', '🎯', '진로 한 장'], ['study.html#career', '🧭', '진로 탐색기'], ['study.html#courses', '📚', '과목 선택 도우미'],
      ['#group', '', '더 보기'], ['hub.html', '🔗', '자료 허브'], ['./', '🌐', '미래 나침반'], ['future.html', '🔮', '미래 예측'], ['know-me.html', '✨', '나 알아보기'], ['study.html#settings', '⚙️', '설정'], ['#lock', '🔒', '잠그기']],
    parent: [['#group', '', '승준이 공부'], ['study.html#dash', '📊', '승준이 한눈에'], ['study.html#dates', '📝', '시험'], ['study.html#table', '🗓️', '시간표'], ['study.html#review', '💡', '복습'], ['study.html#grades', '🧮', '내신 계산기'], ['study.html#examplan', '📅', '기말 플랜'], ['study.html#week', '🪨', '이번 주 큰 돌'],
      ['#group', '', '학교'], ['study.html#school', '🏫', '학교 소식·평가'], ['today.html', '📋', '오늘 한눈에'],
      ['#group', '', '진로'], ['study.html#path', '🎯', '승준 진로'], ['study.html#career', '🧭', '진로 탐색기'], ['study.html#courses', '📚', '과목 선택 도우미'],
      ['#group', '', '더 보기'], ['hub.html', '🔗', '자료 허브'], ['./', '🌐', '미래 나침반'], ['study.html#settings', '⚙️', '설정'], ['#who', '🔄', '승준으로 바꾸기'], ['#lock', '🔒', '잠그기']]
  };
  function current() { if (!onStudy) return 'more'; var h = location.hash.slice(1); return h || 'today'; }
  function draw() {
    var nav = document.querySelector('nav.appnav'); if (!nav) { nav = document.createElement('nav'); nav.className = 'appnav'; nav.setAttribute('aria-label', '메뉴'); document.body.appendChild(nav); }
    var cur = current(), list = NAV[who()], keys = list.map(function (x) { return x[0]; });
    nav.innerHTML = list.map(function (x) {
      var on = x[0] === cur || (x[0] === 'more' && keys.indexOf(cur) < 0);
      if (x[3]) return '<button type="button" data-appnav="' + x[0] + '" class="appnav-fab' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + ' aria-label="' + x[2] + '"><i aria-hidden="true">' + x[1] + '</i><span>' + x[2] + '</span></button>';
      return '<button type="button" data-appnav="' + x[0] + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '><i aria-hidden="true">' + x[1] + '</i><span>' + x[2] + '</span></button>';
    }).join('');
  }
  function openMore() {
    var old = document.querySelector('.appnav-sheet'); if (old) { old.remove(); return; }
    var s = document.createElement('div'); s.className = 'appnav-sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', '전체 메뉴');
    s.innerHTML = '<div class="appnav-panel"><div class="appnav-grip"></div><p class="appnav-h">' + (who() === 'parent' ? '엄마 메뉴' : '전체 메뉴') + '</p><p class="appnav-g">' + MORE[who()][0][2] + '</p><div class="appnav-grid">' +
      MORE[who()].map(function (x) { return x[0] === '#group' ? '</div><p class="appnav-g">' + x[2] + '</p><div class="appnav-grid">' : '<a href="' + x[0] + '" data-more="' + x[0] + '"><i aria-hidden="true">' + x[1] + '</i><span>' + x[2] + '</span></a>'; }).join('').replace(/^<\/div><p class="appnav-g">([^<]*)<\/p><div class="appnav-grid">/, '') + '</div></div>';
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
    if (k === 'focus' && onStudy && window.FC_FOCUS && typeof state !== 'undefined' && state.timer && state.timer.end > Date.now()) { FC_FOCUS.show(); return; }   // 타이머가 돌고 있으면 바로 전체 화면
    if (k === 'cheer') { var sh0 = document.querySelector('.appnav-sheet'); if (sh0) sh0.remove(); if (!onStudy) { location.href = 'study.html#today'; return; } go('today'); setTimeout(function () { window.dispatchEvent(new Event('fc-open-cheer')); }, 250); return; }
    var sh = document.querySelector('.appnav-sheet'); if (sh) sh.remove();
    go(k);
  });
  window.addEventListener('hashchange', function () { draw(); var sh = document.querySelector('.appnav-sheet'); if (sh) sh.remove(); });
  window.addEventListener('pin-unlocked', draw);
  window.addEventListener('pin-who', draw);
  window.FC_APPNAV = { NAV: NAV, MORE: MORE, who: who, go: go, current: current, redraw: draw };   // 태블릿 옆 메뉴(tablet.js)가 같은 목록을 씀
  function boot() { document.body.classList.add('has-appnav'); draw(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  var css = document.createElement('style');
  css.textContent =
    'body.has-appnav{padding-bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}' +
    'body.has-appnav .bottom-nav,body.has-appnav nav.tabbar{display:none!important}' +
    '.appnav{position:fixed!important;top:auto!important;left:0;right:0;bottom:0;height:auto!important;overflow:visible!important;gap:0!important;z-index:40;display:grid;grid-template-columns:repeat(5,1fr);padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--u-surface) 97%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--u-line);font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif}' +
    '.appnav button{all:unset;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:52px;border-radius:12px;color:var(--ink-3);font-size:12.5px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:center}' +
    '.appnav button i{font-style:normal;font-size:20px;line-height:1;filter:grayscale(1);opacity:.6}.appnav button.on{color:var(--accent-ink)}.appnav button.on i{filter:none;opacity:1}.appnav button:focus-visible{outline:2px solid var(--accent)}' +
    '.appnav button span{white-space:nowrap}' +
    '.appnav button.appnav-fab{justify-content:flex-end;padding-bottom:2px}.appnav button.appnav-fab i{filter:none;opacity:1;width:58px;height:58px;margin-top:-30px;border-radius:50%;background:var(--u-solid);color:var(--u-on-solid);display:grid;place-items:center;font-size:24px;box-shadow:var(--sh-2);outline:5px solid var(--u-line);outline-offset:0px}.appnav button.appnav-fab span{color:var(--ink)}body.is-parent .appnav button.appnav-fab i{background:var(--accent)}' +
    '@media(min-width:760px){.appnav{left:50%;right:auto;transform:translateX(-50%);width:620px;bottom:14px;border:1px solid var(--u-line);border-radius:16px;box-shadow:var(--sh-2)}}' +
    '.appnav-sheet{position:fixed;inset:0;z-index:60;background:color-mix(in srgb,var(--u-solid) 35%,transparent);display:flex;align-items:flex-end;justify-content:center}' +
    '.appnav-panel{background:var(--u-surface);width:min(560px,100%);border-radius:22px 22px 0 0;padding:8px 16px calc(92px + env(safe-area-inset-bottom,0px))}.appnav-grip{width:40px;height:4px;border-radius:8px;background:var(--u-soft);margin:4px auto 10px}.appnav-h{margin:0 0 10px;font-weight:800;font-size:15px;color:var(--ink)}' +
    '.appnav-g{margin:12px 2px 6px;font-size:12.5px;font-weight:800;color:var(--ink-3);letter-spacing:.04em}.appnav-panel{max-height:82vh;overflow-y:auto}' +
    '.appnav-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.appnav-grid a{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px;border-radius:12px;background:var(--u-soft);color:var(--ink);text-decoration:none;font-size:12.5px;font-weight:600;text-align:center}.appnav-grid i{font-style:normal;font-size:24px}' +
    '.shiro-launch{bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}.shiro-hint{bottom:calc(150px + env(safe-area-inset-bottom,0px))!important}#notice{bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}.pin-toast{bottom:calc(92px + env(safe-area-inset-bottom,0px))!important}';
  (document.head || document.documentElement).appendChild(css);
})();
