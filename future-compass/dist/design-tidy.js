/* 🧹 긴 화면 줄이기 (2026-10-20, docs/design-checklist.md P1-4)
   - 설정: 화면 테마만 펼치고 나머지 섹션은 접기. 바로가기를 누르면 그 섹션을 펼치고 이동. 펼친 섹션은 이번 접속 동안 기억
   - 학교 소식: 공지·가정통신문은 3개씩, 나머지는 '더 보기'. 구청 프로그램·공식 바로가기는 접기
   - 기말 플랜: 날짜별 계획은 앞 5일만, 나머지는 '더 보기'
   다른 모듈이 화면을 다 그린 뒤(렌더 맨 끝)에 모양만 바꾼다. 내용·기능은 그대로 */
(function () {
  'use strict';
  if (typeof render !== 'function') return;
  var KEY = 'fc-fold-open';
  function opened() { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function remember(id, on) { var a = opened().filter(function (x) { return x !== id; }); if (on) a.push(id); try { sessionStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function fold(el, id, title, startOpen) {
    if (!el || el.closest('details.dt-fold')) return null;
    var d = document.createElement('details'); d.className = 'card dt-fold'; d.dataset.fold = id;
    var s = document.createElement('summary'); s.innerHTML = title; d.appendChild(s);
    el.parentNode.insertBefore(d, el); d.appendChild(el); el.classList.add('dt-fold-in');
    if (startOpen || opened().indexOf(id) >= 0) d.open = true;
    d.addEventListener('toggle', function () { remember(id, d.open); });
    return d;
  }
  function headOf(el) { return el.querySelector(':scope > h2, :scope > .section-title > h2, :scope > header h2'); }
  function moreList(list, keep, label, id) {
    var items = [].slice.call(list.children).filter(function (x) { return x.tagName === 'LI'; });
    if (items.length <= keep + 1 || list.dataset.dtMore) return;
    list.dataset.dtMore = '1';
    var on = opened().indexOf(id) >= 0;
    items.slice(keep).forEach(function (li) { li.classList.add('dt-extra'); li.hidden = !on; });
    var b = document.createElement('button'); b.type = 'button'; b.className = 'dt-more';
    var set = function () { b.textContent = on ? '접기 ▴' : label + ' ' + (items.length - keep) + '개 더 보기 ▾'; };
    set();
    b.addEventListener('click', function () { on = !on; items.slice(keep).forEach(function (li) { li.hidden = !on; }); remember(id, on); set(); });
    list.insertAdjacentElement('afterend', b);
  }

  function tidySettings(root) {
    [].slice.call(root.children).forEach(function (el) {
      if (!/^(SECTION|DIV)$/.test(el.tagName) || el.id === 'set-tt' || /set-top|set-jump/.test(el.className)) return;
      var h = headOf(el); if (!h) return;
      var id = el.id || h.textContent.trim().slice(0, 12);
      if (fold(el, 's:' + id, h.innerHTML)) h.classList.add('dt-fold-h');
    });
  }
  function tidySchool(root) {
    var cards = [].slice.call(root.querySelectorAll('.sl-card'));
    cards.forEach(function (c) {
      var h = headOf(c); if (!h) return; var t = h.textContent;
      if (/학교 소식/.test(t)) [].slice.call(c.querySelectorAll('ul')).forEach(function (ul, i) { moreList(ul, 3, '글', 'news' + i); });
      if (/교육지원센터|공식 바로가기/.test(t) && c.tagName === 'SECTION' && fold(c, 'sl:' + t.slice(0, 10), h.innerHTML)) h.classList.add('dt-fold-h');
    });
  }
  function tidyPlan(root) { var ol = root.querySelector('.ep-days .ep-list'); if (ol) moreList(ol, 5, '날짜', 'ep-days'); }

  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    try {
      if (tab === 'settings') tidySettings(root);
      else if (tab === 'school') tidySchool(root);
      else if (tab === 'examplan') tidyPlan(root);
    } catch (e) { /* 모양 정리 실패해도 화면은 그대로 */ }
  };
  /* 설정 바로가기: 접힌 섹션이면 먼저 펼치기 (스크롤은 기존 처리) */
  document.addEventListener('click', function (e) {
    var j = e.target.closest && e.target.closest('[data-jump]'); if (!j) return;
    var t = document.getElementById(j.getAttribute('data-jump')); var d = t && t.closest('details');
    if (d && !d.open) d.open = true;
  }, true);

  var css = document.createElement('style');
  css.textContent = 'details.dt-fold{padding:0!important;overflow:hidden}' +
    'details.dt-fold>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:56px;padding:12px 16px;font-size:17px;font-weight:800;color:var(--ink,#1f1b45)}' +
    'details.dt-fold>summary::-webkit-details-marker{display:none}' +
    'details.dt-fold>summary::after{content:"▾";margin-left:auto;font-size:15px;color:var(--ink-3,#6b6880);transition:transform .15s}' +
    'details.dt-fold[open]>summary::after{transform:rotate(180deg)}' +
    'details.dt-fold>summary small{font-size:12.5px;font-weight:600;color:var(--ink-3,#6b6880);margin-left:4px}' +
    '.dt-fold-in{margin:0!important;border:0!important;box-shadow:none!important;border-radius:0!important;background:transparent!important;padding-top:0!important}' +
    '.dt-fold-in .dt-fold-h,.dt-fold-in>.section-title:has(>.dt-fold-h:only-child){display:none}' +
    '.dt-fold-in>.section-title>.dt-fold-h{visibility:hidden;width:0;overflow:hidden}' +
    '.dt-more{display:block;width:100%;margin:6px 0 4px;min-height:44px;border:1px dashed var(--u-line,#e6e2f5)!important;background:transparent!important;border-radius:12px!important;color:var(--accent,#5b3fd6)!important;font-weight:700;font-size:13.5px}' +
    '.dt-extra[hidden]{display:none!important}@media (prefers-reduced-motion:reduce){details.dt-fold>summary::after{transition:none}}';
  document.head.appendChild(css);
})();
