/* 📓 태블릿 화면 (2026-10-19) — 노션처럼 왼쪽 메뉴 + 넓은 본문 + 다이어리 느낌
   - 폰(768px 미만)에서는 아무것도 바꾸지 않는다.
   - 768~1099px(아이패드 세로): 아이콘 줄 메뉴(접힌 사이드바) + 가운데 넓은 한 단
   - 1100px 이상(아이패드 가로·노트북): 펼친 사이드바 + 오늘·학교·내신·기록·진로 화면은 2단 카드 배치
   - 사이드바 접기/펼치기는 기기별로 기억(fc-side-v1)
   - 메뉴 목록은 app-nav.js(FC_APPNAV)의 하단 메뉴·전체 메뉴를 그대로 써서 승준·엄마 메뉴가 같이 바뀐다 */
(function () {
  'use strict';
  var root = document.documentElement, KEY = 'fc-side-v1';
  var mq = window.matchMedia ? matchMedia('(min-width: 768px)') : null, wideMq = window.matchMedia ? matchMedia('(min-width: 1100px)') : null;
  function ls(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var onStudy = /study\.html$/.test(location.pathname);
  var TWO = { today: 1, school: 1, grades: 1, stats: 1, path: 1, review: 1, week: 0 };

  function groups(who) {
    var A = window.FC_APPNAV; if (!A || !A.NAV) return [];
    var main = A.NAV[who].filter(function (x) { return x[0] !== 'more'; }).map(function (x) { return [x[0] === 'cheer' ? 'study.html#today' : 'study.html#' + x[0], x[1], x[2], x[0] === 'cheer' ? 'cheer' : '']; });
    var more = A.MORE[who], study = [], career = [], etc = [];
    more.forEach(function (x) {
      var h = x[0]; if (h === '#group') return;
      if (main.some(function (m) { return m[0] === h; })) return;
      if (/#(path|career|courses|school|grades|examplan)$/.test(h) || /^\.\/$|future|know-me/.test(h)) career.push(x);
      else if (/^study\.html#/.test(h) && !/#settings$/.test(h)) study.push(x);
      else etc.push(x);
    });
    return [['공부', main.concat(study)], ['진로·학교', career], ['더 보기', etc]];
  }
  function active(href) {
    if (!onStudy) return href.indexOf(location.pathname.split('/').pop()) === 0 && href.indexOf('#') < 0;
    var h = href.split('#')[1]; return href.indexOf('study.html#') === 0 && (location.hash.slice(1) || 'today') === h;
  }
  function today() { var d = new Date(Date.now() + 9 * 3600e3); return d.getUTCMonth() + 1 + '월 ' + d.getUTCDate() + '일 ' + '일월화수목금토'[d.getUTCDay()] + '요일'; }
  function side() {
    var who = window.FC_APPNAV && FC_APPNAV.who ? FC_APPNAV.who() : 'child';
    var html = '<div class="tb-top"><button type="button" class="tb-fold" data-tb-fold aria-label="' + (root.classList.contains('tb-rail') ? '메뉴 펼치기' : '메뉴 접기') + '">' + (root.classList.contains('tb-rail') ? '»' : '«') + '</button><div class="tb-brand"><b>' + (who === 'parent' ? '승준이 다이어리' : '승준 공부 다이어리') + '</b><small>' + e(today()) + '</small></div></div>';
    groups(who).forEach(function (g) {
      if (!g[1].length) return;
      html += '<p class="tb-h">' + e(g[0]) + '</p><ul>' + g[1].map(function (x) {
        var on = active(x[0]);
        return '<li><a href="' + e(x[0]) + '" class="tb-a' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + (x[3] ? ' data-tb-cheer' : '') + ' title="' + e(x[2]) + '"><i aria-hidden="true">' + x[1] + '</i><span>' + e(x[2]) + '</span></a></li>';
      }).join('') + '</ul>';
    });
    return html;
  }
  var nav = null;   // <nav> 태그에는 공부방 공통 스타일(가로 줄·sticky)이 걸려 있어 div + role=navigation 으로 만든다
  function draw() {
    var on = mq && mq.matches;
    root.classList.toggle('tb', !!on);
    if (!on) { if (nav) { nav.remove(); nav = null; } return; }
    var rail = !wideMq.matches ? ls(KEY, 'rail') !== 'open' : ls(KEY, 'open') === 'rail';
    root.classList.toggle('tb-rail', rail);
    if (!nav) { nav = document.createElement('div'); nav.className = 'tb-side'; nav.setAttribute('role', 'navigation'); nav.setAttribute('aria-label', '전체 메뉴'); document.body.appendChild(nav); }
    nav.innerHTML = side();
    layout();
  }
  /* 본문 2단: 넓은 화면 + 해당 탭에서만 */
  function layout() {
    var t = onStudy ? (location.hash.slice(1) || 'today') : '';
    var two = !!(mq && mq.matches && wideMq.matches && TWO[t]);
    root.classList.toggle('tb-two', two);
    root.setAttribute('data-tb-tab', t);
    var c = document.getElementById('content'); if (!c) return;
    document.querySelectorAll('.tb-grid').forEach(function (x) { x.classList.remove('tb-grid'); });
    if (!two) return;
    var kids = Array.prototype.filter.call(c.children, function (x) { return x.offsetParent !== null || x.tagName === 'DETAILS'; });
    var box = kids.length <= 2 && kids[kids.length - 1] && kids[kids.length - 1].children.length > 3 && /^(DIV|SECTION)$/.test(kids[kids.length - 1].tagName) && !kids[kids.length - 1].classList.contains('card') ? kids[kids.length - 1] : c;   // .sl-wrap 같은 감싸개가 있으면 그 안을 2단으로
    box.classList.add('tb-grid');
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('.tb-side a, .tb-side [data-tb-fold]'); if (!a) return;
    if (a.hasAttribute('data-tb-fold')) { var r = !root.classList.contains('tb-rail'); lset(KEY, r ? 'rail' : 'open'); draw(); return; }
    var href = a.getAttribute('href');
    if (href === '#lock') { ev.preventDefault(); if (window.PinGate) PinGate.lock(); return; }
    if (href === '#who') { ev.preventDefault(); if (window.PinGate) PinGate.switchWho(); return; }
    if (a.hasAttribute('data-tb-cheer')) { ev.preventDefault(); if (!onStudy) { location.href = 'study.html#today'; return; } if (window.FC_APPNAV) FC_APPNAV.go('today'); setTimeout(function () { window.dispatchEvent(new Event('fc-open-cheer')); }, 250); return; }
    if (onStudy && href.indexOf('study.html#') === 0) { ev.preventDefault(); if (window.FC_APPNAV) FC_APPNAV.go(href.split('#')[1]); }
  });
  ['hashchange', 'pin-unlocked', 'pin-who', 'resize'].forEach(function (n) { window.addEventListener(n, function () { setTimeout(draw, 0); }); });
  if (mq && mq.addEventListener) { mq.addEventListener('change', draw); wideMq.addEventListener('change', draw); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
  /* 공부방 화면이 다시 그려질 때 2단 여부 갱신 */
  if (onStudy && typeof render === 'function') { var prev = render; render = function () { prev(); layout(); }; }
  else document.addEventListener('DOMContentLoaded', function () { if (onStudy && typeof render === 'function') { var p2 = render; render = function () { p2(); layout(); }; } });
  window.FC_TABLET = { redraw: draw };
})();
