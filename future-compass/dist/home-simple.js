/* 승준 홈 간단히: 핵심만 위에, 나머지는 "더 보기"로 접기 (기능은 그대로)
   위에 남는 것: 오늘의 핵심(hero) · 시험 D-day · 수업 전 1분/주말 복습 · 오늘 할 일(+기억 확인) · 오늘 배운 것 남기기 · 엄마 응원/부탁 줄 · 하루 마무리(저녁 8시 이후) */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  var KEEP = '.hero-heal,#bo-exam,#bo-pre,#bo-wkend,.pl-tasks,.tn-card,.pl-wiz,.pv-cheer-line,.pv-req-line,.pv-req,.kp-reply,.more-cards,[data-keep-home]';
  var OPEN = 'fc-home-more';
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function hourKST() { return new Date(Date.now() + 9 * 3600000).getUTCHours(); }
  function isOpen() { try { return localStorage.getItem(OPEN) === '1'; } catch (e) { return false; } }

  /* 접힌 카드 안으로 이동할 때 먼저 펼치기 */
  window.FC_REVEAL = function (el) {
    for (var e = el && el.parentElement; e; e = e.parentElement) if (e.tagName === 'DETAILS' && !e.open) e.open = true;
  };

  function fold() {
    var root = document.getElementById('content'); if (!root || root.querySelector('.more-cards')) return;
    var late = hourKST() >= 20, kids = [].slice.call(root.children), out = [], close = null;
    kids.forEach(function (el) {
      if (el.matches(KEEP)) return;
      if (el.matches('.pl-close')) { if (late) { close = el; return; } out.push(el); return; }
      if (el.matches('section,details,a.wk-glance,.card')) out.push(el);
    });
    if (out.length < 2) return;
    var LBL = [['#lg-today', '일정'], ['#sl-today', '공부 기록'], ['#school-today', '급식·학교'], ['#kp-ask', '엄마·아빠에게'], ['.wk-fold', '이번 주'], ['.pl-close', '하루 마무리']];
    var names = LBL.filter(function (x) { return out.some(function (el) { return el.matches(x[0]); }); }).map(function (x) { return x[1]; });
    if (out.some(function (el) { return /오늘 수업/.test((el.querySelector('h2') || {}).textContent || ''); })) names.unshift('시간표');
    var d = document.createElement('details'); d.className = 'more-cards'; if (isOpen()) d.open = true;
    d.innerHTML = '<summary><b>📂 더 보기</b><small>' + esc(names.slice(0, 4).join(' · ') || '수업·일정·기록') + (names.length > 4 ? ' 등' : '') + '</small></summary><div class="more-in"></div>';
    var anchor = root.querySelector('.tn-card') || root.querySelector('.pl-tasks') || root.lastElementChild;
    anchor.insertAdjacentElement('afterend', d);
    var box = d.querySelector('.more-in'); out.forEach(function (el) { box.appendChild(el); });
    if (close) d.insertAdjacentElement('afterend', close);
    d.addEventListener('toggle', function () { try { localStorage.setItem(OPEN, d.open ? '1' : '0'); } catch (e) {} });
  }

  var prev = render;
  render = function () { prev(); if (tab === 'today' && !isParent()) fold(); };

  var css = document.createElement('style');
  css.textContent = '.more-cards{margin:0 0 14px;border-radius:18px;background:#f6f4fd;box-shadow:0 0 0 1.5px #e6e1fa}.more-cards>summary{list-style:none;cursor:pointer;padding:14px 16px;display:flex;align-items:center;gap:8px;min-height:48px;box-sizing:border-box}.more-cards>summary::-webkit-details-marker{display:none}.more-cards>summary b{font-size:15px;color:#2a2550;white-space:nowrap}.more-cards>summary small{flex:1;min-width:0;color:#7d7a8c;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.more-cards>summary::after{content:"▾";color:#7764ef;font-size:14px}.more-cards[open]>summary::after{content:"▴"}.more-in{padding:0 8px 4px}.more-in>*{margin-top:0}';
  document.head.appendChild(css);
  render();
})();
