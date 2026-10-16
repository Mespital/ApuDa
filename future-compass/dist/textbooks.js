/* 서초고 1학년 2학기 교과서 확정(2026-10-16 보호자 확인) → 시간표 과목마다 한 번 연결. 가족 공유로 다른 폰과 합쳐짐.
   진도(단원)는 그대로 두고 교과서만 맞춘다. */
(function () {
  'use strict';
  var FLAG = 'fc-books-20261016';
  var BOOK = { 국어: '미래엔 · 신유식', 수학: '천재교과서 · 홍진곤', 영어: 'YBM · 박준언', 통합사회: '미래엔 · 정창우', 통합과학: '미래엔 · 오현선', 한국사: '동아출판 · 노대환' };
  function apply() {
    try { if (localStorage.getItem(FLAG)) return; } catch (e) { return; }
    if (!window.studyPlusBridge || typeof FC_CURRICULUM === 'undefined' || typeof state === 'undefined') return;
    var x = studyPlusBridge.snapshot(); x.courses = x.courses || {};
    var names = {}; (state.table || []).forEach(function (r) { (r || []).forEach(function (n) { if (n) names[n] = 1; }); }); Object.keys(x.courses).forEach(function (n) { names[n] = 1; });
    var n = 0;
    Object.keys(names).forEach(function (name) {
      var b = FC_CURRICULUM.baseOf(name); if (!b || !BOOK[b]) return;
      var c = x.courses[name] || { book: '', unit: '', pages: '' };
      if (c.book !== BOOK[b]) { c.book = BOOK[b]; x.courses[name] = c; n++; }
    });
    if (n) { studyPlusBridge.replace(x); try { localStorage.setItem('compass-study-plus-v1', JSON.stringify(studyPlusBridge.snapshot())); } catch (e) { return; } if (typeof render === 'function') render(); }
    try { localStorage.setItem(FLAG, '1'); } catch (e) {}
  }
  /* 과학탐구실험2도 미래엔(오현선) (2026-10-16 보호자 확인) */
  function applySci() {
    try { if (localStorage.getItem(FLAG + 'b')) return; } catch (e) { return; }
    if (!window.studyPlusBridge || typeof FC_CURRICULUM === 'undefined' || typeof state === 'undefined') return;
    var x = studyPlusBridge.snapshot(), n = 0; x.courses = x.courses || {};
    (state.table || []).forEach(function (r) { (r || []).forEach(function (name) { if (name && FC_CURRICULUM.baseOf(name) === '과학탐구실험') { var c = x.courses[name] || { book: '', unit: '', pages: '' }; if (c.book !== '미래엔 · 오현선') { c.book = '미래엔 · 오현선'; x.courses[name] = c; n++; } } }); });
    if (n) { studyPlusBridge.replace(x); try { localStorage.setItem('compass-study-plus-v1', JSON.stringify(studyPlusBridge.snapshot())); } catch (e) { return; } if (typeof render === 'function') render(); }
    try { localStorage.setItem(FLAG + 'b', '1'); } catch (e) {}
  }
  setTimeout(function () { apply(); applySci(); }, 3800);   // 가족 동기화 첫 받기 뒤
})();
