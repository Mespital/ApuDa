/* 오늘의 다음 일정과 가까운 마감. 기존 공부 기록·공유 설정을 그대로 사용한다. */
(function (g) {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function') return;
  var CORE = 'compass-study-v1', PLANNER = 'fc_planner_v1';
  var DAY = 86400000;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function planner() { return g.FC_PLANNER && g.FC_PLANNER.get ? g.FC_PLANNER.get() : { pri: {}, share: {} }; }
  function addDay(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * DAY).toISOString().slice(0, 10); }
  function delta(d, ref) { return Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(ref + 'T00:00:00Z')) / DAY); }
  function minutes(t) { var m = /^(\d{2}):(\d{2})$/.exec(String(t || '')); return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null; }
  function nowMinutes() { var d = new Date(Date.now() + 9 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  function dateLabel(d, ref) { var n = delta(d, ref); return n === 0 ? '오늘' : n === 1 ? '내일' : Number(d.slice(5, 7)) + '/' + Number(d.slice(8)); }
  function dueLabel(d, ref) { var n = delta(d, ref); return n === 0 ? '오늘 마감' : n < 0 ? Math.abs(n) + '일 지남' : 'D-' + n; }

  function eventsForDay(d) {
    var out = [], cfg = g.FC_SCHOOL && g.FC_SCHOOL.config || {}, dow = (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7;
    var off = g.FC_CAL && g.FC_CAL.offDay ? g.FC_CAL.offDay(d) : false;
    if (dow < 5 && !off) (state.table[dow] || []).forEach(function (name, i) {
      var start = minutes((cfg.periods || [])[i]);
      if (!name || start === null) return;
      out.push({ date: d, title: String(name), kind: (i + 1) + '교시', start: start, end: start + (Number(cfg.classMinutes) || 50), time: cfg.periods[i] });
    });
    function append(list, kind) { (list || []).forEach(function (x) {
      var start = minutes(x.start), end = minutes(x.end);
      if (start === null) return;
      out.push({ date: d, title: String(x.subject || x.name || x.title || kind), kind: kind, start: start, end: end !== null && end > start ? end : start + (kind === '학원' ? 90 : 60), time: x.start });
    }); }
    if (g.FC_ACADEMY && g.FC_ACADEMY.forDay) append(g.FC_ACADEMY.forDay(d), '학원');
    if (g.FC_LIFE && g.FC_LIFE.forDay) append(g.FC_LIFE.forDay(d), '일정');
    return out.sort(function (a, b) { return a.start - b.start || a.title.localeCompare(b.title); });
  }
  function nextEvent(ref, now) {
    for (var i = 0; i < 7; i++) {
      var d = addDay(ref, i), list = eventsForDay(d).filter(function (x) { return i > 0 || x.end > now; });
      if (list.length) { var x = list[0]; return Object.assign({}, x, { ongoing: i === 0 && x.start <= now }); }
    }
    return null;
  }
  function dueItems(ref, parent) {
    var p = planner(), share = p.share || {}, pri = p.pri || {}, out = [];
    if (parent && share.exams === false) return out;
    (state.dates || []).forEach(function (x) { if (!x.done && valid(x.date)) out.push({ id: x.id, title: x.title, subject: x.subject || '', date: x.date, kind: x.kind || '과제', task: false }); });
    if (!parent || share.flow !== false) (state.tasks || []).forEach(function (x) {
      var m = pri[x.id] || {};
      if (!x.done && m.st !== 'no' && valid(m.due)) out.push({ id: x.id, title: x.title, subject: x.subject || '', date: m.due, kind: '할 일', task: true });
    });
    return out.sort(function (a, b) { var da = delta(a.date, ref), db = delta(b.date, ref); return Math.abs(da) - Math.abs(db) || da - db || String(a.id).localeCompare(String(b.id)); });
  }
  function model(opts) {
    opts = opts || {};
    var ref = opts.date || today(), parent = opts.parent == null ? isParent() : !!opts.parent, p = planner(), share = p.share || {}, pri = p.pri || {};
    var allowed = !parent || share.flow !== false, rank = { A: 0, B: 1, C: 2 };
    var tasks = allowed ? (state.tasks || []).filter(function (x) { return x.date === ref && (pri[x.id] || {}).st !== 'no'; }) : [];
    var top = tasks.filter(function (x) { return !x.done; }).slice().sort(function (a, b) {
      var pa = (pri[a.id] || {}).p || 'B', pb = (pri[b.id] || {}).p || 'B';
      return (rank[pa] == null ? 1 : rank[pa]) - (rank[pb] == null ? 1 : rank[pb]);
    }).slice(0, 3);
    var deadlines = dueItems(ref, parent);
    return { date: ref, parent: parent, flowShared: allowed, examsShared: !parent || share.exams !== false, tasks: top, completed: tasks.filter(function (x) { return x.done; }).length, total: tasks.length, next: nextEvent(ref, opts.nowMinutes == null ? nowMinutes() : opts.nowMinutes), deadline: deadlines[0] || null };
  }
  function summaryHTML(m) {
    var next = m.next, due = m.deadline;
    var h = '<div class="sb-heading"><h2>' + (m.parent ? '승준이 오늘 한눈에' : '오늘 한눈에') + '</h2><span class="sb-count">' + (m.flowShared ? '완료 ' + m.completed + '/' + m.total : '공부 흐름 공유 꺼짐') + '</span></div><div class="sb-summary-grid">';
    h += '<div class="sb-cell"><span class="sb-label">' + (next && next.ongoing ? '지금 일정' : '다음 일정') + '</span><strong>' + (next ? esc(next.title) : '등록된 다음 일정 없음') + '</strong><small>' + (next ? dateLabel(next.date, m.date) + ' ' + esc(next.time) + ' · ' + esc(next.kind) : '일정은 이번 주에서 확인할 수 있어요.') + '</small></div>';
    h += '<div class="sb-cell' + (due && delta(due.date, m.date) < 0 ? ' sb-overdue' : '') + '"><span class="sb-label">가까운 마감</span><strong>' + (!m.examsShared ? '시험·과제 공유 꺼짐' : due ? esc(due.title) : '남은 마감 없음') + '</strong><small>' + (due ? esc([due.subject, due.kind, dueLabel(due.date, m.date)].filter(Boolean).join(' · ')) : '') + '</small></div></div>';
    if (m.parent && m.flowShared && m.tasks.length) h += '<ul class="sb-parent-tasks">' + m.tasks.map(function (x) { return '<li><span aria-hidden="true">○</span> ' + esc(x.title) + '</li>'; }).join('') + '</ul>';
    return h;
  }
  function quickHTML() {
    var subjects = Array.from(new Set((state.table || []).reduce(function (out, row) { return out.concat(row || []); }, []).filter(Boolean).concat(['국어', '영어', '수학', '통합사회', '통합과학', '한국사'])));
    return '<form data-sb-quick class="pl-add sb-quick"><label for="sb-subject">과목<input id="sb-subject" name="subject" list="sb-subjects" required maxlength="40" placeholder="예: 영어" autocomplete="off"></label>' +
      '<datalist id="sb-subjects">' + subjects.map(function (s) { return '<option value="' + esc(s) + '"></option>'; }).join('') + '</datalist>' +
      '<label for="sb-title" class="sb-title-field">할 일<input id="sb-title" name="title" required maxlength="120" placeholder="예: 본문 20문장 읽기"></label>' +
      '<label for="sb-due">마감일<input id="sb-due" name="due" type="date" required value="' + today() + '"></label><button class="primary" type="submit">할 일 추가</button><p class="sb-form-hint">오늘 할 일에 넣고, 마감일도 함께 기억해요.</p></form>';
  }
  function addTask(input) {
    if (isParent()) return false;
    var subject = String(input.subject || '').trim(), title = String(input.title || '').trim(), due = String(input.due || '');
    if (!subject || subject.length > 40 || !title || title.length > 120 || !valid(due)) { notice('과목·할 일·마감일을 확인해줘.'); return false; }
    if (state.tasks.length >= 200) { notice('기록이 200개야. 지난 기록을 정리한 뒤 추가해줘.'); return false; }
    var p = planner(); if (!g.FC_PLANNER || !g.FC_PLANNER.save || !p.pri) { notice('공부방을 새로 열고 다시 추가해줘.'); return false; }
    var id = uid(), hasA = state.tasks.some(function (x) { return x.date === today() && !x.done && (p.pri[x.id] || {}).p === 'A'; });
    state.tasks.push({ id: id, title: title, subject: subject, date: today(), done: false, kind: '과제', note: '' });
    p.pri[id] = { p: hasA ? 'B' : 'A', st: '', min: 0, due: due };
    var saved = save();
    if (saved) { g.FC_PLANNER.save(); try { var stored = JSON.parse(localStorage.getItem(PLANNER)); saved = !!(stored && stored.pri && stored.pri[id] && stored.pri[id].due === due); } catch (e) { saved = false; } }
    if (!saved) { state.tasks = state.tasks.filter(function (x) { return x.id !== id; }); delete p.pri[id]; save(); g.FC_PLANNER.save(); notice('저장 공간을 확인한 뒤 다시 추가해줘.'); return false; }
    render(); notice('오늘 할 일과 마감일을 저장했어.'); return true;
  }
  function taskDeadlinesHTML(parent) {
    var list = dueItems(today(), parent).filter(function (x) { return x.task; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (!list.length) return '';
    return '<h2>할 일 마감</h2><div class="sb-due-list">' + list.map(function (x) {
      return '<div class="sb-due-row">' + (parent ? '<span class="sb-static-status" aria-label="미완료">○</span>' : '<input type="checkbox" data-check="tasks" data-id="' + esc(x.id) + '" aria-label="' + esc(x.title) + ' 완료">') + '<div><strong>' + esc(x.title) + '</strong><small>' + esc([x.subject, x.date, dueLabel(x.date, today())].filter(Boolean).join(' · ')) + '</small></div></div>';
    }).join('') + '</div>';
  }
  function decorate() {
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'today') {
      var section = document.createElement('section'); section.id = 'study-brief'; section.className = 'card sb-summary'; section.setAttribute('data-keep-home', ''); section.innerHTML = summaryHTML(model());
      var motto = isParent() && root.querySelector('.pv-motto');
      if (motto) motto.insertAdjacentElement('afterend', section); else root.insertAdjacentElement('afterbegin', section);
      if (!isParent()) { var form = root.querySelector('form.pl-add[data-form="tasks"]'); if (form) form.outerHTML = quickHTML(); }
      var pri = planner().pri || {};
      root.querySelectorAll('.pl-tasks input[data-check="tasks"]').forEach(function (el) {
        var m = pri[el.dataset.id] || {}, row = el.closest('.pl-item'), meta = row && row.querySelector('.pl-main small');
        var task = state.tasks.find(function (x) { return x.id === el.dataset.id; });
        if (meta && task && task.subject && meta.textContent.indexOf(task.subject) < 0) meta.textContent = task.subject + ' · ' + meta.textContent;
        if (meta && valid(m.due)) meta.textContent += ' · ' + dueLabel(m.due, today());
      });
    }
    if (tab === 'dates') { var html = taskDeadlinesHTML(isParent()); if (html) { var card = document.createElement('section'); card.id = 'study-task-deadlines'; card.className = 'card'; card.innerHTML = html; root.insertAdjacentElement('afterbegin', card); } }
  }
  var previous = render;
  render = function () { previous(); decorate(); };
  document.addEventListener('submit', function (e) {
    if (!e.target.hasAttribute || !e.target.hasAttribute('data-sb-quick')) return;
    e.preventDefault(); var data = new FormData(e.target);
    addTask({ subject: data.get('subject'), title: data.get('title'), due: data.get('due') });
  });
  document.addEventListener('change', function (e) { if (e.target.dataset && e.target.dataset.check === 'tasks' && !isParent()) setTimeout(function () { render(); }, 0); });
  g.addEventListener('pin-unlocked', function () { render(); });
  var lastDate = today();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && today() !== lastDate) { lastDate = today(); render(); } });
  g.FC_STUDY_BRIEF = { model: model, dueItems: dueItems, nextEvent: nextEvent, addTask: addTask, summaryHTML: summaryHTML, quickHTML: quickHTML, taskDeadlinesHTML: taskDeadlinesHTML };
  render();
})(window);
