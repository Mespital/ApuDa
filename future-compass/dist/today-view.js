/* 오늘 한눈에: 학교 수업 → 점심 → 학원 → 저녁 공부(숙제·마감·복습·예습·할 일)를 시간 순서로 한 장에.
   아이 기기: 이 기기 기록으로 만들고, 보호자 보기용 요약을 /api/today 로 올린다(메모·복습 노트 내용은 안 보냄).
   보호자: usage.html 에서 토큰으로 같은 화면을 읽기 전용으로 본다. */
(function (g) {
  'use strict';
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var NO_PREP = /체육|음악|미술|창체|창의|자율|동아리|봉사|진로|스포츠/;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function todayISO() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function add(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function label(d) { var x = new Date(d + 'T12:00:00Z'); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate() + '(' + WD[x.getUTCDay()] + ')'; }
  function gap(d, from) { return Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse((from || todayISO()) + 'T00:00:00Z')) / 864e5); }
  function addMin(t, m) { var p = t.split(':').map(Number), x = p[0] * 60 + p[1] + m; return ('0' + Math.floor(x / 60)).slice(-2) + ':' + ('0' + x % 60).slice(-2); }
  var CAL = function () { return g.FC_CAL || null; };
  function offDay(d) { return CAL() ? CAL().offDay(d) : ([0, 6].indexOf(wd(d)) >= 0 ? { name: '주말', weekend: true } : null); }
  function nextSchool(d) { if (CAL()) return CAL().nextSchoolDay(d); var x = add(d, 1); while ([0, 6].indexOf(wd(x)) >= 0) x = add(x, 1); return x; }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }

  var schoolData = null;
  function loadSchool() { return fetch('school.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { schoolData = d; return d; }).catch(function () { return null; }); }

  /* ---------- 이 기기 기록으로 오늘 만들기 ---------- */
  function collect(date) {
    date = date || todayISO();
    var core = ls('compass-study-v1', {}), plus = ls('compass-study-plus-v1', {}), teachers = ls('fc_teachers_v1', {}) || {};
    var table = Array.isArray(core.table) ? core.table : [], courses = plus.courses || {}, cfg = g.FC_SCHOOL ? g.FC_SCHOOL.config : {};
    var times = cfg.periods || [], len = cfg.classMinutes || 50, off = offDay(date), w = wd(date);
    var row = !off && w >= 1 && w <= 5 && table[w - 1] ? table[w - 1].slice() : [];
    while (row.length && !row[row.length - 1]) row.pop();
    var periods = row.map(function (s, i) { return { n: i + 1, time: times[i] || '', subject: s || '', teacher: teachers[s] || '' }; });
    var acs = ls('fc_academy_v1', []).filter(function (a) { return a && Array.isArray(a.days) && a.days.indexOf(w) >= 0 && (!a.from || date >= a.from); }).sort(function (a, b) { return String(a.start || '99').localeCompare(String(b.start || '99')); })
      .map(function (a) { return { name: a.name, subject: a.subject || '', start: a.start || '', end: a.end || '', progress: a.progress || '', homework: a.homework || '', hwDone: !!a.hwDone }; });
    var meal = null, events = [], examToday = '';
    if (schoolData) {
      var ms = (schoolData.meals || []).filter(function (m) { return m.date === date; });
      if (ms.length) meal = ms[0].dishes.slice(0, 6);
      examToday = ((schoolData.schedule || []).filter(function (e) { return e.date === date && /고사|시험|평가/.test(e.title); })[0] || {}).title || '';
      events = (schoolData.schedule || []).filter(function (e) { return e.date >= date && gap(e.date, date) <= 14; }).slice(0, 4).map(function (e) { return { date: e.date, title: e.title, off: !!e.off }; });
    }
    // 저녁 공부
    var tasks = (core.tasks || []).filter(function (t) { return t.date === date || (!t.done && t.date < date); }).slice(0, 12).map(function (t) { return { title: t.title, done: !!t.done, carried: t.date < date }; });
    var deadlines = (core.dates || []).filter(function (x) { return !x.done && gap(x.date, date) >= 0 && gap(x.date, date) <= 7; }).sort(function (a, b) { return a.date.localeCompare(b.date); })
      .map(function (x) { return { title: x.title, kind: x.kind || '', subject: x.subject || '', dday: gap(x.date, date), date: x.date }; });
    var rmeta = plus.reviews || {};
    var redo = (core.reviews || []).filter(function (x) { return !x.done && (rmeta[x.id] ? rmeta[x.id].due : x.date) <= date; }).slice(0, 6).map(function (x) { return { subject: x.subject || '복습' }; });   // 복습 노트 제목·내용은 보내지 않음
    var learned = uniq(row).filter(function (s) { return !NO_PREP.test(s); }).slice(0, 4);
    var nd = nextSchool(date), nw = wd(nd), nrow = table[nw - 1] ? uniq(table[nw - 1]) : [];
    var prepDone = (ls('fc_preview_v1', {}) || {})[nd] || [];
    var exams = schoolData ? (schoolData.schedule || []).filter(function (e) { return e.date === nd && /고사|시험|평가/.test(e.title); }).map(function (e) { return e.title; }) : [];
    var prep = nrow.filter(function (s) { return !NO_PREP.test(s); }).map(function (s) {
      var c = courses[s] || {}, cur = g.FC_CURRICULUM ? g.FC_CURRICULUM.lookup(s, null, null, { book: c.book }) : null;
      var nx = cur && c.unit ? g.FC_CURRICULUM.nextAfter(s, c.unit, c.book) : null;
      return { subject: s, teacher: teachers[s] || '', target: nx ? nx.split(' › ').pop() : (c.unit ? c.unit.split(' › ').pop() : ''), done: prepDone.indexOf(s) >= 0 };
    });
    var tomorrowAc = ls('fc_academy_v1', []).filter(function (a) { return a && a.homework && !a.hwDone && Array.isArray(a.days) && (a.days.indexOf(wd(add(date, 1))) >= 0 || a.days.indexOf(w) >= 0); })
      .map(function (a) { return { name: a.name, homework: a.homework }; });
    var endTime = periods.length && periods[periods.length - 1].time ? addMin(periods[periods.length - 1].time, len) : '';
    return { v: 1, date: date, generated: new Date().toISOString(), off: off ? { name: off.name, weekend: !!off.weekend } : null, periods: periods, endTime: endTime, lunch: cfg.lunch || '',
      meal: meal, examToday: examToday, academies: acs, events: events, deadlines: deadlines, academyHw: tomorrowAc, review: learned, redo: redo,
      prep: { date: nd, label: label(nd), exam: exams[0] || '', items: prep }, tasks: tasks, school: cfg.shortName || '' };
  }

  /* ---------- 그리기 ---------- */
  function render(d, opts) {
    opts = opts || {};
    if (!d || !d.date) return '<p class="tv-empty">아직 오늘 기록이 없어.</p>';
    var ro = !!opts.parent, h = '';
    var minutes = (d.examToday ? 0 : d.review.length * 10) + d.redo.length * 10 + (d.prep.exam ? 0 : d.prep.items.length * 10) + d.academyHw.length * 30;
    var chips = d.deadlines.filter(function (x) { return x.dday <= 7; }).map(function (x) { return '<span class="tv-chip' + (x.dday <= 1 ? ' hot' : '') + '">' + (x.dday === 0 ? '오늘' : 'D-' + x.dday) + ' ' + esc(x.title) + '</span>'; }).join('');
    h += '<header class="tv-head"><div><h1>' + esc(label(d.date)) + ' 오늘 한눈에</h1>' +
      '<p class="tv-sub">' + (d.off ? '🌿 ' + esc(d.off.name) + (d.off.weekend ? '' : ' · 수업 없음') : d.examToday ? '📝 시험날' : '수업 ' + d.periods.filter(function (p) { return p.subject; }).length + '교시' + (d.endTime ? ' · ' + esc(d.endTime) + ' 끝' : '')) +
      (d.academies.length ? ' · 학원 ' + d.academies.length : '') + (minutes ? ' · 저녁 공부 약 ' + Math.min(180, minutes) + '분' : '') + '</p></div>' +
      (ro ? '<span class="tv-ro">보호자 보기 · ' + esc(ago(d.generated)) + ' 기준</span>' : '') + '</header>' + (chips ? '<div class="tv-chips">' + chips + '</div>' : '');
    // 학교
    h += '<section class="tv-block"><h2><span class="tv-time">' + esc(d.periods[0] && d.periods[0].time || '') + '</span>🏫 학교</h2>';
    var exSubs = (ls('fc_planner_v1', {}).examDays || {})[d.date] || [];
    if (d.examToday && !d.off) h += '<p class="tv-exam">📝 오늘 ' + esc(d.examToday.replace(/\(\d학년\)/, '')) + ' — 시험 화이팅! 💪' + (exSubs.length ? '<br><b>' + exSubs.map(function (x, i) { return (i + 1) + '교시 ' + esc(x); }).join(' · ') + '</b>' : '<br>시험 과목은 공부방 오늘 탭에서 넣을 수 있어.') + '</p>';
    if (d.examToday && !d.off) { /* 시험날엔 평소 시간표를 숨김 */ }
    else if (d.off) h += '<p class="tv-muted">' + esc(d.off.name) + '라 수업이 없어.</p>';
    else if (!d.periods.length) h += '<p class="tv-muted">공부방 시간표 탭에서 시간표를 올리면 여기 수업이 나와.</p>';
    else h += '<ol class="tv-periods">' + d.periods.map(function (p) { return '<li><span class="tv-t">' + esc(p.time) + '</span><b>' + p.n + '</b> ' + esc(p.subject || '—') + (p.teacher ? ' <small>' + esc(p.teacher) + '</small>' : '') + '</li>'; }).join('') + '</ol>';
    if (d.meal) h += '<p class="tv-meal">🍚 ' + (d.lunch ? esc(d.lunch) + ' ' : '') + d.meal.map(esc).join(' · ') + '</p>';
    h += '</section>';
    // 학원
    if (d.academies.length) h += '<section class="tv-block"><h2><span class="tv-time">' + esc(d.academies[0].start) + '</span>🏃 학원</h2><ul class="tv-list">' + d.academies.map(function (a) {
      return '<li><b>' + esc((a.start ? a.start + (a.end ? '~' + a.end : '') + ' ' : '') + a.name) + '</b>' + (a.subject ? ' <small>' + esc(a.subject) + '</small>' : '') + (a.progress ? '<br><span class="tv-muted">진도 ' + esc(a.progress) + '</span>' : '') + '</li>'; }).join('') + '</ul></section>';
    // 저녁 공부
    var ev = '';
    if (d.academyHw.length) ev += grp('📝 학원 숙제', d.academyHw.map(function (a) { return li(a.name + ' · ' + a.homework, false, ro); }));
    var hot = d.deadlines.filter(function (x) { return x.dday <= 2; });
    if (hot.length) ev += grp('⏰ 마감 임박', hot.map(function (x) { return li((x.dday === 0 ? '오늘 ' : 'D-' + x.dday + ' ') + (x.kind ? x.kind + ' · ' : '') + x.title, false, ro); }));
    if (d.prep.exam) ev += grp('🧩 내일 시험 마무리', [li('내일 볼 과목 오답·핵심 개념 다시 보기', false, ro), li('일찍 자기 — 시험 기간엔 잠이 점수야', false, ro)]);
    var prepSubs = d.prep.exam ? [] : d.prep.items.map(function (p) { return p.subject; });   // 오늘 복습·내일 예습 과목이 겹치면 한 줄로 (중복처럼 보이지 않게)
    var revOnly = d.examToday ? [] : d.review.filter(function (s) { return prepSubs.indexOf(s) < 0; });
    var exDays = ls('fc_planner_v1', {}).examDays || {}, nxEx = Object.keys(exDays).filter(function (k) { return k > d.date && exDays[k].length && gap(k, d.date) <= 4; }).sort()[0];
    if (nxEx) ev += grp('📚 ' + label(nxEx) + ' 시험 대비 (과목당 30분)', exDays[nxEx].map(function (x) { return li(x + ' · 오답·자주 틀린 개념 다시 보기', !!(ls('fc_planner_v1', {}).examPrep || {})[nxEx + '@' + x], ro); }));
    if (revOnly.length && !d.off && !d.examToday) ev += grp('🔁 오늘 배운 것 복습 (과목당 10분)', revOnly.map(function (s) { return li(s + ' · 오늘 필기 다시 보고 핵심 3줄 정리', false, ro); }));
    if (d.redo.length) ev += grp('💡 다시 풀 문제 ' + d.redo.length + '개', Object.entries(d.redo.reduce(function (a, r) { a[r.subject] = (a[r.subject] || 0) + 1; return a; }, {})).map(function (e) { return li(e[0] + ' · ' + e[1] + '개 (복습 탭)', false, ro); }));
    if (d.prep.items.length && !nxEx) ev += grp('📘 ' + (gap(d.prep.date, d.date) === 1 ? '내일' : d.prep.label) + (!d.examToday && revOnly.length < d.review.length ? ' 예습 (오늘 복습 같이)' : ' 예습') + (d.prep.exam ? ' — ' + d.prep.exam + ' 날이라 시험 과목 마무리가 먼저' : ''),
      d.prep.exam ? [] : d.prep.items.map(function (p) { var both = !d.off && !d.examToday && d.review.indexOf(p.subject) >= 0; return li(p.subject + (both ? ' · 오늘 복습 + ' : ' · ') + (p.target || '예습') + (p.teacher ? ' (' + p.teacher + ')' : ''), p.done, ro); }));
    if (d.tasks.length) ev += grp('✅ 할 일', d.tasks.map(function (t) { return li((t.carried ? '(지난) ' : '') + t.title, t.done, ro); }));
    h += '<section class="tv-block"><h2><span class="tv-time">' + esc(d.endTime ? '저녁' : '') + '</span>🌙 오늘 공부</h2>' + (ev || '<p class="tv-muted">오늘은 따로 챙길 게 없어. 쉬어도 돼 🌿</p>') + '</section>';
    // 다가오는 학교 일정
    if (d.events.length) h += '<section class="tv-block tv-small"><h2>📌 다가오는 학교 일정</h2><ul class="tv-list">' + d.events.map(function (e) { return '<li>' + esc(label(e.date)) + ' ' + (e.off ? '🌿 ' : '') + esc(e.title) + '</li>'; }).join('') + '</ul></section>';
    return h;
  }
  function grp(title, items) { return '<div class="tv-grp"><h3>' + esc(title) + '</h3>' + (items.length ? '<ul class="tv-check">' + items.join('') + '</ul>' : '') + '</div>'; }
  function li(text, done, ro) { return '<li class="' + (done ? 'done' : '') + '"><span class="tv-box" aria-hidden="true">' + (done ? '✓' : '') + '</span>' + esc(text) + '</li>'; }
  function ago(iso) { var m = Math.round((Date.now() - Date.parse(iso)) / 60000); return !iso ? '' : m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; }

  /* ---------- 보호자 보기용 올리기 ---------- */
  var lastSent = '';
  function canSync() {
    try { if (localStorage.getItem('fc-usage-optout') === '1') return false; } catch (e) { return false; }
    var core = ls('compass-study-v1', {}); return Array.isArray(core.table) && core.table.some(function (r) { return Array.isArray(r) && r.some(Boolean); });
  }
  function sync() {
    if (!canSync() || document.documentElement.classList.contains('pin-locked')) return Promise.resolve(false);
    return (schoolData ? Promise.resolve() : loadSchool()).then(function () {
      var d = collect();
      d.periods.forEach(function (p) { p.teacher = ''; }); d.prep.items.forEach(function (p) { p.teacher = ''; });   // 선생님 이름은 이 기기에만
      var body = JSON.stringify({ device: ls('fc-device-id', '') || (localStorage.getItem('fc-device-id') || ''), data: d });
      var sig = body.replace(/"generated":"[^"]*"/, '');
      if (sig === lastSent) return false; lastSent = sig;
      return fetch('/api/today', { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: true }).then(function () { return true; }).catch(function () { return false; });
    });
  }

  var css = document.createElement('style');
  css.textContent = '.tv-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}.tv-head h1{font-size:22px;margin:0}.tv-sub{margin:4px 0 0;color:#6f6a85;font-size:14px}.tv-ro{font-size:12px;background:#efe9ff;color:#5b3fd6;border-radius:999px;padding:4px 10px}' +
    '.tv-chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}.tv-chip{font-size:12.5px;font-weight:700;background:#f3efff;color:#5b3fd6;border-radius:999px;padding:4px 10px}.tv-chip.hot{background:#fdecef;color:#b4475a}' +
    '.tv-block{position:relative;margin:16px 0 0;padding:14px 16px 14px 18px;background:#fff;border:1px solid #ebe6f5;border-radius:18px;border-left:5px solid #c9bff8}.tv-block h2{font-size:16px;margin:0 0 8px;display:flex;gap:8px;align-items:baseline}.tv-time{font-size:12px;color:#8a839a;font-weight:600;min-width:38px}' +
    '.tv-periods{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:14.5px}.tv-periods li{display:flex;gap:8px;align-items:baseline}.tv-t{font-size:12px;color:#8a839a;min-width:40px}.tv-periods b{color:#7764ef;font-size:12px;min-width:12px}.tv-periods small,.tv-list small{color:#8a839a}' +
    '.tv-exam{margin:0 0 8px;padding:8px 10px;border-radius:10px;background:#fff6e5;font-size:13.5px}.tv-meal{margin:10px 0 0;font-size:13.5px;color:#4a5568}.tv-list{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:14.5px}.tv-muted{color:#8a839a;font-size:13.5px;margin:0}' +
    '.tv-grp{margin:10px 0 0}.tv-grp h3{font-size:14px;margin:0 0 6px;color:#3d3566}.tv-check{list-style:none;margin:0;padding:0;display:grid;gap:5px;font-size:14px}.tv-check li{display:flex;gap:8px;align-items:flex-start}.tv-box{flex:0 0 18px;height:18px;border:1.5px solid #c9bff8;border-radius:5px;font-size:12px;line-height:16px;text-align:center;color:#fff;margin-top:1px}.tv-check li.done{color:#9a95ad;text-decoration:line-through}.tv-check li.done .tv-box{background:#7764ef;border-color:#7764ef}' +
    '.tv-small{border-left-color:#e4e0ef}.tv-empty{color:#8a839a}@media(prefers-color-scheme:dark){.tv-block{background:#1c1a29;border-color:#2e2b41}.tv-grp h3{color:#d9d3f5}}' +
    '@media print{.tv-block{break-inside:avoid;border-color:#ccc}.tv-ro{display:none}}';
  document.head.appendChild(css);
  g.TodayView = { collect: collect, render: render, sync: sync, loadSchool: loadSchool };
})(window);
