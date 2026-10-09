/* 공부 흐름 보강
   ① 시험 D-day: 학교 학사일정·직접 넣은 시험을 최대 100일 앞까지 미리 보여줌(+ 시기별 한 줄 준비 팁)
   ② 수업 전 1분: 오늘(또는 다음 등교일) 수업 과목의 지난 수업 정리(사진·말하기 노트)를 훑어보기
   ③ 주말 복습·예습: 토·일엔 이번 주 수업 복습 + 다음 주(월요일 중심) 예습을 할 일로 바로 넣기 */
(function () {
  'use strict';
  var WK = ['일', '월', '화', '수', '목', '금', '토'];
  var EXAM_RE = /중간고사|기말고사|지필|정기고사|학력평가|모의고사|수행평가 ?주간|시험/;
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function dg(d) { return Math.round((Date.parse(d) - Date.parse(today())) / 86400000); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10)) + '(' + WK[wd(d)] + ')'; }
  function off(d) { return window.FC_CAL ? FC_CAL.offDay(d) : (wd(d) === 0 || wd(d) === 6 ? { weekend: true } : null); }
  function nowH() { return new Date(Date.now() + 9 * 3600000).getUTCHours(); }
  function rowOf(d) { var w = wd(d); if (w < 1 || w > 5 || off(d)) return []; var r = (state.table[w - 1] || []).map(function (x) { return String(x || '').trim(); }); var n = r.length; while (n && !r[n - 1]) n--; return r.slice(0, n).filter(Boolean); }
  var SKIP = /체육|음악|미술|창체|자율|동아리|진로|봉사|조회|종례|점심/;
  function subjOf(x) { return window.FC_PLANNER && FC_PLANNER.subjOf ? (FC_PLANNER.subjOf(x) || x) : x; }
  function notes() { var v = ls('fc_notes_v1', []); return Array.isArray(v) ? v : []; }

  /* ① 시험 D-day (최대 100일) */
  function exams() {
    var t = today(), seen = {}, out = [];
    for (var i = 0; i <= 100; i++) {
      var d = addD(t, i), ev = window.FC_CAL ? FC_CAL.schoolEvents(d) : [];
      ev.forEach(function (title) { if (EXAM_RE.test(title)) { var k = title.replace(/\(.*?\)/g, '').replace(/\s+/g, ''); if (seen[k] && dg(seen[k]) >= 0 && i - dg(seen[k]) < 6) return; seen[k] = d; out.push({ date: d, title: title, src: '학교' }); } });
    }
    (state.dates || []).forEach(function (x) { if (!x.done && x.kind === '시험' && dg(x.date) >= 0 && dg(x.date) <= 100 && !out.some(function (o) { return o.date === x.date; })) out.push({ date: x.date, title: x.title, src: '직접' }); });
    var P = window.FC_PLANNER ? FC_PLANNER.get() : {};
    Object.keys(P.examDays || {}).forEach(function (d) { if (dg(d) >= 0 && dg(d) <= 100 && (P.examDays[d] || []).length && !out.some(function (o) { return o.date === d; })) out.push({ date: d, title: '시험 (' + P.examDays[d].join('·') + ')', src: '직접' }); });
    return out.sort(function (a, b) { return a.date.localeCompare(b.date); });
  }
  function tip(n, title) {
    var mock = /학력평가|모의고사/.test(title);
    if (n === 0) return '오늘 시험! 아는 것부터 차분하게 🍀';
    if (n <= 3) return '새로운 것보다 본 것 다시 보기 · 잠 충분히';
    if (n <= 7) return mock ? '지난 모의고사 틀린 문제 다시 풀기' : '과목별 범위 1회독 마무리 · 오답 정리';
    if (n <= 14) return mock ? '국·수·영 하루 한 세트씩 시간 재고 풀기' : '시험 범위 확정 → 과목별 남은 쪽수 나눠 계획';
    if (n <= 30) return mock ? '취약 단원 하나씩 메우기' : '수업 노트·정리 모아 과목별 1회독 시작';
    if (n <= 60) return '수업 끝날 때마다 정리 남기기 — 시험 때 그대로 복습 자료가 돼';
    return '지금은 매일 수업 정리 습관만 — 미리 알고만 있어도 충분해';
  }
  function examCard() {
    var list = exams(); if (!list.length) return '';
    var first = list[0], n = dg(first.date);
    return '<section class="card bo-exam" id="bo-exam"><div class="pl-head"><h2>📝 다가오는 시험</h2><button type="button" class="pl-mini" data-go="dates">+ 시험</button></div>' +
      '<ul class="bo-ex">' + list.slice(0, 5).map(function (e) { var k = dg(e.date); return '<li class="' + (k <= 7 ? 'hot' : k <= 30 ? 'warm' : '') + '"><span class="bo-dday">' + (k === 0 ? 'D-DAY' : 'D-' + k) + '</span><span class="bo-t">' + esc(e.title) + '<small>' + md(e.date) + (e.src === '직접' ? ' · 직접 넣음' : '') + '</small></span></li>'; }).join('') + '</ul>' +
      '<p class="bo-tip">💡 ' + esc(tip(n, first.title)) + '</p></section>';
  }

  /* ② 수업 전 1분: 지난 수업 정리 훑어보기 */
  function targetDay() { var t = today(); if (!off(t) && nowH() < 15) return t; return window.FC_CAL ? FC_CAL.nextSchoolDay(t) : addD(t, 1); }
  function lastNote(subject) {
    var a = notes().filter(function (n) { return n.date <= today() && (subjOf(n.subject) === subject || n.subject === subject); });
    return a.length ? a[a.length - 1] : null;
  }
  function firstLines(n) {
    var src = n.sum || n.text || '';
    var lines = src.split('\n').map(function (x) { return x.trim(); }).filter(function (x) { return x && !/^(📌|🔑|❓|➡️)/.test(x); });
    return lines.slice(0, 3);
  }
  function preClassCard() {
    var d = targetDay(), subs = [], seen = {};
    rowOf(d).forEach(function (x) { if (SKIP.test(x)) return; var s = subjOf(x); if (!seen[s]) { seen[s] = 1; subs.push(s); } });
    var items = subs.map(function (s) { var n = lastNote(s); return n ? { s: s, n: n } : null; }).filter(Boolean);
    if (!items.length) return '';
    var label = d === today() ? '오늘' : md(d);
    return '<section class="card bo-pre" id="bo-pre"><div class="pl-head"><h2>📚 ' + label + ' 수업 전 1분</h2><button type="button" class="pl-mini" data-go="review">노트</button></div><p class="muted small">지난 수업 정리를 훑고 들어가면 수업이 훨씬 잘 들려.</p>' +
      items.slice(0, 5).map(function (x) { var L = firstLines(x.n); return '<details class="bo-note"><summary><b>' + esc(x.s) + '</b><small>' + md(x.n.date) + ' 정리' + (x.n.sum ? ' 🧠' : '') + '</small></summary>' + (L.length ? '<ul>' + L.map(function (l) { return '<li>' + esc(l.replace(/^-\s*/, '')) + '</li>'; }).join('') + '</ul>' : '') + (x.n.sum ? '<div class="bo-full">' + esc(x.n.sum).replace(/\n/g, '<br>') + '</div>' : '') + '</details>'; }).join('') + '</section>';
  }

  /* ③ 주말 복습·예습 */
  function weekendCard() {
    var t = today(), w = wd(t); if (w !== 0 && w !== 6) return '';
    var mon = addD(t, w === 6 ? -5 : -6), days = [0, 1, 2, 3, 4].map(function (i) { return addD(mon, i); });
    var cnt = {}, order = [];
    days.forEach(function (d) { rowOf(d).forEach(function (x) { if (SKIP.test(x)) return; var s = subjOf(x); if (!cnt[s]) { cnt[s] = 0; order.push(s); } cnt[s]++; }); });
    var wkNotes = notes().filter(function (n) { return n.date >= mon && n.date <= addD(mon, 6); });
    var nb = {}; wkNotes.forEach(function (n) { var s = subjOf(n.subject); nb[s] = (nb[s] || 0) + 1; });
    order.sort(function (a, b) { return cnt[b] - cnt[a]; });
    var nextMon = window.FC_CAL ? FC_CAL.nextSchoolDay(t) : addD(t, w === 6 ? 2 : 1), nextSubs = [];
    rowOf(nextMon).forEach(function (x) { if (SKIP.test(x)) return; var s = subjOf(x); if (nextSubs.indexOf(s) < 0) nextSubs.push(s); });
    if (!order.length && !nextSubs.length) return '';
    var have = {}; (state.tasks || []).forEach(function (k) { if (k.date === t) have[k.title] = 1; });
    var revT = function (s) { return '[주말 복습] ' + s + (nb[s] ? ' — 이번 주 노트 ' + nb[s] + '개 다시 보기' : ' — 이번 주 배운 곳 교과서 다시 읽기'); };
    var preT = '[예습] ' + md(nextMon) + ' ' + nextSubs.slice(0, 4).join('·') + ' 교과서 다음 쪽 훑어보기';
    return '<section class="card bo-wkend" id="bo-wkend"><div class="pl-head"><h2>🌿 주말 복습·예습</h2></div>' +
      '<p class="muted small">' + (w === 6 ? '토요일엔 이번 주 복습 위주로, ' : '일요일엔 가볍게 복습하고 ') + md(nextMon) + ' 수업 예습까지 하면 다음 주가 편해.</p>' +
      (order.length ? '<h3 class="bo-h">🔁 이번 주 복습 <small>' + md(mon) + '~' + md(days[4]) + '</small></h3><ul class="bo-list">' + order.slice(0, 6).map(function (s) {
        var title = revT(s); return '<li><span><b>' + esc(s) + '</b><small>수업 ' + cnt[s] + '시간' + (nb[s] ? ' · 노트 ' + nb[s] + '개' : ' · 노트 없음') + '</small></span>' + (have[title] ? '<em>넣음 ✓</em>' : '<button type="button" class="pl-mini" data-bo-add="' + esc(title) + '">+ 할 일</button>') + '</li>';
      }).join('') + '</ul>' : '') +
      (nextSubs.length ? '<h3 class="bo-h">➡️ ' + md(nextMon) + ' 예습</h3><ul class="bo-list"><li><span><b>' + nextSubs.map(esc).join(' · ') + '</b><small>교과서 다음 쪽 10분 훑기 + 지난 정리 1분</small></span>' + (have[preT] ? '<em>넣음 ✓</em>' : '<button type="button" class="pl-mini" data-bo-add="' + esc(preT) + '">+ 할 일</button>') + '</li></ul>' : '') +
      '<button type="button" class="primary bo-all" data-bo-all>추천대로 한 번에 넣기 (복습 3 + 예습 1)</button></section>';
  }
  function addTask(title) {
    if ((state.tasks || []).some(function (k) { return k.date === today() && k.title === title; })) return false;
    state.tasks.push({ id: uid(), title: title.slice(0, 120), date: today(), done: false }); return true;
  }

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'today') return;
    var root = document.getElementById('content'), parent = isParent();
    var hero = root.querySelector('.hero-heal') || root.querySelector('.pv-guide');
    var ex = examCard(); if (ex) { if (hero) hero.insertAdjacentHTML('afterend', ex); else root.insertAdjacentHTML('afterbegin', ex); }
    if (parent) return;
    var after = root.querySelector('#bo-exam') || hero;
    var wk = weekendCard(), pre = wk ? '' : preClassCard(), html = wk + pre;
    if (html) { if (after) after.insertAdjacentHTML('afterend', html); else root.insertAdjacentHTML('afterbegin', html); }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.dataset.boAdd) { if (addTask(b.dataset.boAdd)) { save(); notice('오늘 할 일에 넣었어 ✓'); } render(); return; }
    if (b.hasAttribute('data-bo-all')) {
      var box = b.closest('.bo-wkend'), n = 0;
      [].slice.call(box.querySelectorAll('[data-bo-add]')).slice(0, 3).forEach(function (x) { if (addTask(x.dataset.boAdd)) n++; });
      var pre = [].slice.call(box.querySelectorAll('[data-bo-add]')).filter(function (x) { return /^\[예습\]/.test(x.dataset.boAdd); })[0];
      if (pre && addTask(pre.dataset.boAdd)) n++;
      save(); notice(n ? n + '개를 오늘 할 일에 넣었어 ✓' : '이미 다 넣었어'); render(); return;
    }
  });

  var css = document.createElement('style');
  css.textContent =
    '.bo-ex{list-style:none;margin:0;padding:0;display:grid;gap:6px}.bo-ex li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:#f6f4fd}.bo-ex li.warm{background:#fff4e6}.bo-ex li.hot{background:#ffe9ec}' +
    '.bo-dday{flex:none;min-width:58px;text-align:center;font-weight:800;font-size:14px;color:#5b45d6;font-variant-numeric:tabular-nums}.bo-ex li.warm .bo-dday{color:#c46a00}.bo-ex li.hot .bo-dday{color:#c2324a}' +
    '.bo-t{display:flex;flex-direction:column;font-size:14.5px;font-weight:600;min-width:0}.bo-t small{font-weight:400;color:#8a879a;font-size:12px}.bo-tip{margin:10px 2px 0;font-size:13.5px;color:#4a4663}' +
    '.bo-note{border:1px solid #efedf5;border-radius:12px;padding:8px 12px;margin-top:8px}.bo-note summary{cursor:pointer;display:flex;gap:8px;align-items:baseline;list-style:none}.bo-note summary small{color:#8a879a;font-size:12px}' +
    '.bo-note ul{margin:6px 0 0;padding-left:1.2em;font-size:14px;line-height:1.6}.bo-full{margin-top:8px;font-size:13.5px;line-height:1.65;background:#f8f6ff;border-radius:10px;padding:8px 10px}' +
    '.bo-h{font-size:14.5px;margin:12px 0 6px}.bo-h small{font-weight:400;color:#8a879a;font-size:12px;margin-left:4px}.bo-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}.bo-list li{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0eff5}.bo-list li:last-child{border-bottom:0}' +
    '.bo-list li span{flex:1;display:flex;flex-direction:column;min-width:0}.bo-list small{color:#8a879a;font-size:12px}.bo-list em{font-style:normal;color:#1f7a55;font-size:12.5px;font-weight:700}.bo-all{width:100%;margin-top:12px;min-height:46px!important}';
  document.head.appendChild(css);
  window.FC_BOOST = { exams: exams };
  if (window.FC_CAL) FC_CAL.onUpdate(function () { if (typeof render === 'function' && tab === 'today') render(); });
  if (typeof render === 'function') render();
})();
