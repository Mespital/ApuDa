/* 📊 한눈에 보기 (study.html#dash) — 2026-10-21
   오늘 진행 · 이번 주 공부 · 과목별 시간 · 오늘 수업 노트 · 다가오는 일정 · 복습 · 밀린 것을 한 화면에.
   새 데이터는 만들지 않고 기존 기록(compass-study-v1 · fc_planner_v1 · fc_notes_v1 · 학교 자료)만 읽는다.
   엄마 화면은 승준이가 공개한 범위(흐름·시험·복습)만 보인다. */
(function () {
  'use strict';
  if (typeof render !== 'function' || typeof tabs === 'undefined') return;
  tabs.dash = '📊 한눈에';
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (x) { return d; } }
  function T() { return today(); }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function gap(d) { return Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(T() + 'T00:00:00Z')) / 864e5); }
  function md(d) { var x = new Date(d + 'T12:00:00Z'); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate() + '(' + WD[x.getUTCDay()] + ')'; }
  function monday(d) { return addD(d, -((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7)); }
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function P() { return window.FC_PLANNER ? FC_PLANNER.get() : ls('fc_planner_v1', {}) || {}; }
  function can(kind) { if (!isParent()) return true; var sh = P().share || {}; return kind === 'flow' || kind === 'exams' ? sh[kind] !== false : !!sh[kind]; }
  function dday(n) { return n === 0 ? 'D-day' : n > 0 ? 'D-' + n : 'D+' + (-n); }
  function subKey(s) { return window.FC_SUBJECT_KEY ? FC_SUBJECT_KEY(s) : 'etc'; }
  function hidden(what) { return '<p class="db-lock small">🔒 승준이가 ' + what + '을(를) 공개하면 여기에 보여요.</p>'; }

  /* ---------- 숫자 모으기 ---------- */
  function focusByDay(from, to) {
    var out = {}; (P().focus || []).forEach(function (f) { if (f && f.date >= from && f.date <= to) out[f.date] = (out[f.date] || 0) + (Number(f.min) || 0); }); return out;
  }
  function focusBySubject(from, to) {
    var out = {}; (P().focus || []).forEach(function (f) { if (f && f.date >= from && f.date <= to && f.min) { var s = String(f.subject || '').trim() || '기타'; out[s] = (out[s] || 0) + Number(f.min); } });
    return Object.keys(out).map(function (k) { return { s: k, m: out[k] }; }).sort(function (a, b) { return b.m - a.m; });
  }
  function hm(m) { m = Math.round(m || 0); return m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '') : m + '분'; }
  function againCounts() {
    var t = T(), pl = P(), due = 0, week = 0, done = pl.againDone || {};
    (state.reviews || []).forEach(function (r) { ((pl.again || {})[r.id] || []).forEach(function (d) { if (done[r.id + '@' + d]) return; if (d <= t && d >= addD(t, -3)) due++; else if (d > t && d <= addD(t, 7)) week++; }); });
    return { due: due, week: week };
  }
  function upcoming() {
    var t = T(), end = addD(t, 14), out = [], seen = {};
    function push(x) { var k = x.date + '|' + x.title; if (seen[k]) return; seen[k] = 1; out.push(x); }
    (state.dates || []).forEach(function (x) { if (x.done || !x.date || x.date < t || x.date > end) return; if (x.kind === '시험' && !can('exams')) return; if (x.kind !== '시험' && !can('flow')) return; push({ date: x.date, title: x.title, kind: x.kind === '시험' ? 'exam' : x.kind === '수행' ? 'perf' : 'task', subject: x.subject || '' }); });
    // 학교 일정: 같은 이름이 며칠 이어지면 한 줄(12/9~12/11), 시험은 토·일 제외
    var runs = {};
    if (window.FC_CAL && FC_CAL.schoolEvents) for (var i = 0; i <= 14; i++) {
      var d = addD(t, i), w = new Date(d + 'T12:00:00Z').getUTCDay();
      FC_CAL.schoolEvents(d).forEach(function (ev) {
        var n = typeof ev === 'string' ? ev : ev && (ev.title || ev.name); if (!n) return;
        var exam = /고사|시험/.test(n); if (exam && (w === 0 || w === 6)) return;
        var r = runs[n]; if (r && gap(d) - gap(r.end) <= (exam ? 3 : 1)) { r.end = d; return; }
        runs[n] = r = { date: d, end: d, title: n, kind: exam ? 'exam' : 'school', subject: '' }; push(r);
      });
    }
    return out.sort(function (a, b) { return a.date.localeCompare(b.date) || (a.kind === 'exam' ? -1 : 1); });
  }
  function overdue() { var t = T(); return (state.tasks || []).filter(function (x) { return !x.done && x.date < t && x.date >= addD(t, -7); }); }
  function nextExam() {
    var t = T(), ex = (state.dates || []).filter(function (x) { return !x.done && x.kind === '시험' && x.date >= t; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
    if (ex) return { title: ex.title, n: gap(ex.date), date: ex.date };
    if (window.FC_CAL && FC_CAL.schoolEvents) for (var i = 0; i < 120; i++) { var d = addD(t, i), hit = FC_CAL.schoolEvents(d).map(function (v) { return typeof v === 'string' ? v : v && (v.title || v.name); }).find(function (n) { return /고사/.test(n || ''); }); if (hit) return { title: hit, n: i, date: d }; }
    return null;
  }

  /* ---------- 화면 ---------- */
  function kpis() {
    var L = window.FC_PLANNER ? FC_PLANNER.todays() : [], done = L.filter(function (x) { return x.t.done; }).length;
    var fm = focusByDay(T(), T())[T()] || 0, ag = againCounts(), ex = can('exams') ? nextExam() : null;
    var tile = function (k, v, sub, go, lock) { return '<button type="button" class="db-kpi" data-go="' + go + '"><small>' + k + '</small><b>' + (lock ? '🔒' : v) + '</b><span>' + (lock ? '비공개' : sub) + '</span></button>'; };
    return '<div class="db-kpis">' +
      tile('오늘 할 일', L.length ? done + '/' + L.length : '0', L.length ? (done === L.length ? '다 했어 🎉' : (L.length - done) + '개 남음') : '아직 없음', 'today', !can('flow')) +
      tile('오늘 집중', hm(fm), fm ? '잘하고 있어' : '0분', 'focus', !can('flow')) +
      tile('기억 확인', ag.due ? ag.due + '개' : '0', ag.due ? '오늘 할 차례' : '오늘 끝', 'review', !can('review') && isParent()) +
      tile('다음 시험', ex ? dday(ex.n) : '—', ex ? e(ex.title).slice(0, 14) : '예정 없음', 'dates', !can('exams')) + '</div>';
  }
  function weekCard() {
    if (!can('flow')) return '<section class="card db-card"><h2>이번 주 공부</h2>' + hidden('공부 흐름') + '</section>';
    var t = T(), mon = monday(t), sun = addD(mon, 6), fm = focusByDay(mon, sun), stud = window.FC_PLANNER && FC_PLANNER.studied ? FC_PLANNER.studied(mon, sun) : {};
    var pmon = addD(mon, -7), pfm = focusByDay(pmon, addD(pmon, 6)), tot = 0, ptot = 0, days = 0;
    Object.keys(fm).forEach(function (k) { tot += fm[k]; }); Object.keys(pfm).forEach(function (k) { ptot += pfm[k]; });
    var max = 30; for (var i = 0; i < 7; i++) { var dd = addD(mon, i); max = Math.max(max, fm[dd] || 0); if (stud[dd]) days++; }
    var bars = '';
    for (var j = 0; j < 7; j++) {
      var d = addD(mon, j), m = fm[d] || 0, h = Math.round(m / max * 100);
      bars += '<div class="db-bar' + (d === t ? ' now' : '') + (d > t ? ' future' : '') + '"><span class="db-bv">' + (m ? m : '') + '</span><i style="height:' + Math.max(m ? 6 : 0, h) + '%"></i><em>' + WD[(j + 1) % 7] + '</em>' + (stud[d] ? '<b aria-label="공부한 날">●</b>' : '<b class="off" aria-hidden="true">·</b>') + '</div>';
    }
    var diff = tot - ptot, cmp = ptot ? (diff >= 0 ? '지난주보다 ' + hm(diff) + ' 더' : '지난주보다 ' + hm(-diff) + ' 적게') : '지난주 기록 없음';
    return '<section class="card db-card"><div class="db-head"><h2>이번 주 공부</h2><small>' + md(mon) + ' ~ ' + md(sun) + '</small></div>' +
      '<p class="db-big"><b>' + hm(tot) + '</b> 집중 · 공부한 날 <b>' + days + '</b>/7</p><p class="small muted">' + cmp + '</p>' +
      '<div class="db-bars" role="img" aria-label="요일별 집중 시간(분)">' + bars + '</div><p class="small muted">막대는 집중 시간(분), ●는 할 일·복습·집중 중 하나라도 한 날</p></section>';
  }
  function subjectCard() {
    if (!can('flow')) return '';
    var t = T(), mon = monday(t), a = focusBySubject(mon, addD(mon, 6)); if (!a.length) return '<section class="card db-card"><h2>과목별 집중 (이번 주)</h2><p class="small muted">집중 타이머에서 과목을 고르고 시작하면 여기에 쌓여.</p></section>';
    var max = a[0].m;
    return '<section class="card db-card"><h2>과목별 집중 (이번 주)</h2><ul class="db-subs">' + a.slice(0, 8).map(function (x) {
      var k = subKey(x.s); return '<li><span class="db-sn">' + e(x.s) + '</span><span class="db-track"><i style="width:' + Math.max(6, Math.round(x.m / max * 100)) + '%;background:var(--sub-' + k + '-ink,var(--accent))"></i></span><b>' + hm(x.m) + '</b></li>';
    }).join('') + '</ul></section>';
  }
  function lessonCard() {
    var L = window.FC_NOTES && FC_NOTES.lessons ? FC_NOTES.lessons() : [];
    if (!L.length) return '';
    if (isParent() && !can('review')) return '<section class="card db-card"><h2>오늘 수업 노트</h2>' + hidden('복습') + '</section>';
    var did = L.filter(function (x) { return x.status === 'done'; }).length, left = L.filter(function (x) { return x.status === 'past'; }).length;
    var tag = { done: '✓', past: '!', now: '…', later: '' };
    return '<section class="card db-card"><div class="db-head"><h2>오늘 수업 노트</h2><small>' + did + '/' + L.length + ' 남김</small></div><div class="db-lessons">' + L.map(function (x) {
      return '<span class="db-ls st-' + x.status + '" title="' + x.p + '교시 ' + e(x.sub) + '"><small>' + x.p + '</small>' + e(x.sub.replace(/[0-9]+$/, '')) + '<i>' + tag[x.status] + '</i></span>';
    }).join('') + '</div>' + (left && !isParent() ? '<button type="button" class="db-act" data-tn-open="talk">🎙️ 못 남긴 수업 ' + left + '개 · 1분 말하기</button>' : '') + '</section>';
  }
  var showAll = false;
  function scheduleCard() {
    var a = upcoming(), list = showAll ? a : a.slice(0, 7);
    var ico = { exam: '📝', perf: '📌', task: '✅', school: '🏫' };
    return '<section class="card db-card"><div class="db-head"><h2>다가오는 2주</h2><small>' + a.length + '개</small></div>' +
      (a.length ? '<ul class="db-up">' + list.map(function (x) {
        var n = gap(x.date); return '<li class="k-' + x.kind + '"><span class="db-dd' + (n <= 3 ? ' hot' : '') + '">' + dday(n) + '</span><span class="db-ut">' + ico[x.kind] + ' ' + e(x.title) + '</span><small>' + md(x.date) + (x.end && x.end !== x.date ? '~' + md(x.end) : '') + '</small></li>';
      }).join('') + '</ul>' + (a.length > 7 ? '<button type="button" class="db-more" data-db-more>' + (showAll ? '접기 ▴' : '＋ ' + (a.length - 7) + '개 더 보기') + '</button>' : '') : '<p class="small muted">2주 안에 잡힌 시험·과제·학교 일정이 없어.</p>') +
      (can('exams') && !can('flow') ? '<p class="small muted">시험·학교 일정만 보여요. 과제는 승준이가 흐름을 공개하면 보여요.</p>' : '') + '</section>';
  }
  function reviewCard() {
    if (isParent() && !can('review')) return '<section class="card db-card"><h2>복습</h2>' + hidden('복습') + '</section>';
    var ag = againCounts(), mon = monday(T()), notes = (ls('fc_notes_v1', []) || []).filter(function (n) { return n && n.date >= mon; }).length;
    return '<section class="card db-card"><h2>복습</h2><div class="db-trio"><div><b>' + ag.due + '</b><small>오늘 기억 확인</small></div><div><b>' + ag.week + '</b><small>7일 안 예정</small></div><div><b>' + notes + '</b><small>이번 주 노트</small></div></div>' +
      (!isParent() && ag.due ? '<button type="button" class="db-act" data-go="review">🧠 지금 기억 확인하기</button>' : '') + '</section>';
  }
  function overdueCard() {
    if (!can('flow')) return '';
    var o = overdue(); if (!o.length) return '';
    return '<section class="card db-card"><div class="db-head"><h2>지난 7일 못 한 할 일</h2><small>' + o.length + '개</small></div><ul class="db-up">' + o.slice(0, 5).map(function (x) { return '<li><span class="db-dd">' + md(x.date) + '</span><span class="db-ut">' + e(x.title) + '</span></li>'; }).join('') + '</ul>' +
      (isParent() ? '<p class="small muted">잔소리보다 "하나만 같이 골라볼까?"가 좋아요.</p>' : '<button type="button" class="db-act" data-go="today">오늘로 가져오기 (오늘 화면)</button>') + '</section>';
  }
  function view() {
    var p = isParent();
    return '<section class="db-top"><h1>' + (p ? '승준이 한눈에' : '한눈에 보기') + '</h1><p class="small muted">' + md(T()) + ' · 기록은 이 기기와 가족 연결 기준</p></section>' +
      kpis() + '<div class="db-grid">' + weekCard() + scheduleCard() + subjectCard() + lessonCard() + reviewCard() + overdueCard() + '</div>';
  }

  if (location.hash === '#dash') tab = 'dash';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'dash') { root.innerHTML = view(); document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); }); return; }
    if (tab === 'today' && !root.querySelector('.db-entry')) root.insertAdjacentHTML('beforeend', '<button type="button" class="gd-entry db-entry" data-go="dash"><span>📊</span><span><b>' + (isParent() ? '승준이 한눈에' : '한눈에 보기') + '</b><small>이번 주 공부 · 과목별 시간 · 다가오는 2주 · 복습</small></span><span aria-hidden="true">›</span></button>');
  };
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-db-more]'); if (!b || tab !== 'dash') return;
    showAll = !showAll; render();
  });

  var css = document.createElement('style');
  css.textContent =
    '.db-top h1{font-size:24px;margin:4px 0 2px}.db-top{margin-bottom:10px}' +
    '.db-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}@media(min-width:720px){.db-kpis{grid-template-columns:repeat(4,1fr)}}' +
    '.db-kpi{display:grid!important;gap:2px;justify-items:start;text-align:left;min-height:84px!important;padding:10px 12px!important;border:1px solid var(--u-line)!important;border-radius:16px!important;background:var(--u-surface)!important;color:var(--ink)!important;box-shadow:var(--sh-1)}' +
    '.db-kpi small{font-size:12.5px;color:var(--ink-3);font-weight:600}.db-kpi b{font-size:24px;line-height:1.2;color:var(--accent-ink)}.db-kpi span{font-size:12.5px;color:var(--ink-2);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}' +
    '.db-grid{display:grid;gap:12px}@media(min-width:820px){.db-grid{grid-template-columns:1fr 1fr;align-items:start}}.db-card{margin:0!important}.db-card h2{font-size:17px;margin:0 0 8px}' +
    '.db-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.db-head small{color:var(--ink-3);font-size:12.5px}' +
    '.db-big{margin:0;font-size:15px}.db-big b{font-size:20px;color:var(--accent-ink)}' +
    '.db-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;height:150px;align-items:end;margin:10px 0 4px}' +
    '.db-bar{display:grid;grid-template-rows:16px 1fr 18px 14px;height:100%;justify-items:center;font-size:12.5px}.db-bar i{align-self:end;width:70%;max-width:28px;border-radius:8px 8px 3px 3px;background:var(--accent);min-height:0}' +
    '.db-bar.future i{opacity:.35}.db-bar.now em{font-weight:800;color:var(--accent-ink)}.db-bar em{font-style:normal;color:var(--ink-2)}.db-bv{color:var(--ink-3);font-size:12.5px}.db-bar b{color:var(--ok-ink);font-size:12.5px;line-height:1}.db-bar b.off{color:var(--ink-3)}' +
    '.db-subs{list-style:none;margin:0;padding:0;display:grid;gap:8px}.db-subs li{display:grid;grid-template-columns:minmax(72px,30%) 1fr auto;gap:8px;align-items:center;font-size:13.5px}.db-sn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.db-track{height:12px;border-radius:999px;background:var(--u-soft);overflow:hidden}.db-track i{display:block;height:100%;border-radius:999px}.db-subs b{font-size:13.5px;color:var(--ink-2)}' +
    '.db-lessons{display:flex;flex-wrap:wrap;gap:6px}.db-ls{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:999px;border:1px solid var(--u-line);font-size:13.5px;background:var(--u-surface)}' +
    '.db-ls small{font-size:12.5px;color:var(--ink-3)}.db-ls i{font-style:normal;font-weight:800}.db-ls.st-done{background:var(--u-soft)}.db-ls.st-done i{color:var(--ok-ink)}.db-ls.st-past i{color:var(--warn-ink)}.db-ls.st-now{border-color:var(--accent)}' +
    '.db-up{list-style:none;margin:0;padding:0;display:grid;gap:6px}.db-up li{display:grid;grid-template-columns:60px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:13.5px;min-height:32px}.db-ut{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.db-up small{color:var(--ink-3);font-size:12.5px}' +
    '.db-dd{font-weight:800;font-size:12.5px;text-align:center;padding:3px 0;border-radius:999px;background:var(--u-soft);color:var(--ink-2)}.db-dd.hot{color:var(--exam-ink)}.db-up li.k-exam .db-ut{font-weight:700}' +
    '.db-trio{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}.db-trio b{display:block;font-size:24px;color:var(--accent-ink)}.db-trio small{font-size:12.5px;color:var(--ink-3)}' +
    '.db-act,.db-more{display:block;width:100%;margin-top:10px;min-height:var(--tap);font-weight:700;font-size:13.5px}.db-more{border:1px dashed var(--u-line)!important;background:transparent!important;color:var(--accent-ink)!important;border-radius:12px!important}' +
    '.db-lock{margin:0;color:var(--ink-3)}.db-entry{margin-top:12px}';
  document.head.appendChild(css);
  if (tab === 'dash') render();
})();
