/* 플래너(프랭클린식, 고1용으로 줄임) + 나의 공부 기록
   - 나의 다짐·학기 목표(설정에서 한 번), 이번 주 큰 돌 3개, 오늘 할 일 A/B/C, 하루 마무리
   - 기록 탭: 공부한 날·오답 다시 맞힘·A 해낸 개수·집중 시간·학기 목표·4주 흐름 (칭찬 중심, 비교 없음)
   - 감수: AI가 교사·학습 컨설턴트·청소년 상담·UX·플래너 관점으로 검토한 의견 반영(실제 전문가 감수 아님) */
(function () {
  'use strict';
  var KEY = 'fc_planner_v1', PLUS = 'compass-study-plus-v1';
  var SUBJ = [['수학', /수학|공수|수1|수2|미적|확통|기하/], ['국어', /국어|공국|문학|독서|화작|언매/], ['영어', /영어|공영|영단어|올림포스/], ['통합사회', /통사|통합사회|사회/], ['통합과학', /통과|통합과학|과학|과탐/], ['한국사', /한국사|한사|역사/], ['정보', /정보|코딩/]];
  var WD = ['월', '화', '수', '목', '금', '토', '일'];
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function load() {
    var p = ls(KEY, {}) || {};
    p.mission = String(p.mission || '').slice(0, 60);
    p.goals = Array.isArray(p.goals) ? p.goals.slice(0, 3) : [];
    p.weeks = p.weeks && typeof p.weeks === 'object' ? p.weeks : {};
    p.pri = p.pri && typeof p.pri === 'object' ? p.pri : {};
    p.days = p.days && typeof p.days === 'object' ? p.days : {};
    p.focus = Array.isArray(p.focus) ? p.focus.slice(-400) : [];
    var sh = p.share && typeof p.share === 'object' ? p.share : {};
    p.share = { flow: sh.flow !== false, exams: sh.exams !== false, review: !!sh.review, questions: !!sh.questions, reflect: !!sh.reflect, mission: !!sh.mission };   // 엄마에게 보이기(승준이 고름)
    p.again = p.again && typeof p.again === 'object' ? p.again : {};          // 복습 다시 보기 날짜 {reviewId:[날짜]}
    p.againDone = p.againDone && typeof p.againDone === 'object' ? p.againDone : {};
    p.dmeta = p.dmeta && typeof p.dmeta === 'object' ? p.dmeta : {};          // 시험·과제 추가 정보 {id:{imp,est,p1,p2,prog,steps}}
    p.wiz = p.wiz && typeof p.wiz === 'object' ? p.wiz : { skip: {} };
    p.wiz.skip = p.wiz.skip || {};
    p.examDays = p.examDays && typeof p.examDays === 'object' ? p.examDays : {};   // {날짜:[시험 과목 순서대로]}
    p.examPrep = p.examPrep && typeof p.examPrep === 'object' ? p.examPrep : {};
    return p;
  }
  var P = load();
  function put() {
    // 오래된 기록 정리(16주)
    var cut = addD(today(), -112);
    Object.keys(P.days).forEach(function (d) { if (d < cut) delete P.days[d]; });
    Object.keys(P.weeks).forEach(function (d) { if (d < cut) delete P.weeks[d]; });
    P.focus = P.focus.filter(function (f) { return f.date >= cut; });
    var ids = {}; state.tasks.forEach(function (t) { ids[t.id] = 1; }); Object.keys(P.pri).forEach(function (k) { if (!ids[k]) delete P.pri[k]; });
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { notice('저장 공간을 확인해줘.'); }
  }
  window.addEventListener('storage', function (e) { if (e.key === KEY) P = load(); });
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function monday(d) { var w = (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7; return addD(d, -w); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10)); }
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function subjOf(t) { t = String(t || ''); for (var i = 0; i < SUBJ.length; i++) if (SUBJ[i][1].test(t)) return SUBJ[i][0]; return ''; }
  function pr(id) { return P.pri[id] || (P.pri[id] = { p: 'B', st: '', min: 0 }); }

  /* ---------- 오늘 할 일 ---------- */
  function todays() {
    var t = today(), list = state.tasks.filter(function (x) { return x.date === t && pr(x.id).st !== 'no'; });
    var rank = { A: 0, B: 1, C: 2 };
    list.sort(function (a, b) { return (a.done - b.done) || (rank[pr(a.id).p] - rank[pr(b.id).p]); });
    var n = { A: 0, B: 0, C: 0 };
    return list.map(function (x) { var q = pr(x.id); n[q.p]++; return { t: x, q: q, label: q.p + n[q.p] }; });
  }
  function overdue() { var t = today(); return state.tasks.filter(function (x) { return !x.done && x.date < t && x.date >= addD(t, -7) && pr(x.id).st !== 'no'; }); }
  var openMore = '', openAll = false;
  var KDAY = ['일', '월', '화', '수', '목', '금', '토'];
  function est(q) { return q && q.est ? q.est : 25; }
  function toMin(t) { var a = String(t || '').split(':').map(Number); return a.length === 2 && !isNaN(a[0]) ? a[0] * 60 + a[1] : null; }
  function nowMin() { var d = new Date(Date.now() + 9 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  function todayRow() {
    var t = today(), w = new Date(t + 'T12:00:00Z').getUTCDay(), off = typeof FC_CAL !== 'undefined' ? FC_CAL.offDay(t) : (w === 0 || w === 6);
    if (off || w < 1 || w > 5) return [];
    var r = state.table[w - 1] || [], n = r.length; while (n && !r[n - 1]) n--; return r.slice(0, n);
  }
  /* ---------- 시험날: 학교 학사일정(나이스) + 직접 넣은 시험 시간표 ---------- */
  var EXAM_RE = /중간고사|기말고사|지필|정기고사|학력평가|모의고사/;
  function examName(d) {
    var ev = typeof FC_CAL !== 'undefined' && FC_CAL.schoolEvents ? FC_CAL.schoolEvents(d) : [];
    var t = ev.filter(function (x) { return EXAM_RE.test(x); })[0];
    if (t) return t.replace(/\(\d학년\)/, '').trim();
    return P.examDays[d] ? '시험' : '';
  }
  function nextExamDay(after) {
    var keys = Object.keys(P.examDays).filter(function (d) { return d > after && P.examDays[d].length; }).sort();
    var neis = '';
    for (var i = 1; i <= 14; i++) { var d = addD(after, i); if (examName(d)) { neis = d; break; } }
    var cand = [keys[0], neis].filter(Boolean).sort()[0];
    return cand || '';
  }
  function allSubjects() {
    var seen = {}, out = [];
    state.table.forEach(function (r) { r.forEach(function (x) { x = String(x || '').trim(); if (x && !seen[x] && !/체육|음악|미술|창체|자율|동아리|진로|봉사/.test(x)) { seen[x] = 1; out.push(x); } }); });
    return out;
  }
  var exEdit = '', exSel = [];
  function dlabel(d) { var w = new Date(d + 'T12:00:00Z').getUTCDay(); return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)) + '(' + KDAY[w] + ')'; }
  function examPicker(d) {
    var subs = allSubjects();
    return '<div class="pl-ex-pick"><p class="muted small">' + dlabel(d) + ' 시험 과목을 <b>시험 보는 순서대로</b> 눌러줘.</p><div class="pl-chips">' +
      subs.map(function (x) { var i = exSel.indexOf(x); return '<button type="button" data-pl-exs="' + esc(x) + '" class="' + (i >= 0 ? 'on' : '') + '">' + (i >= 0 ? (i + 1) + '교시 ' : '') + esc(x) + '</button>'; }).join('') + '</div>' +
      '<div class="pl-row"><input data-pl-ex-other maxlength="20" placeholder="목록에 없는 과목"><button type="button" data-pl-ex-add>추가</button></div>' +
      '<p class="pl-wiz-btns"><button type="button" class="primary" data-pl-ex-save="' + d + '">저장</button><button type="button" data-pl-ex-cancel>취소</button></p></div>';
  }
  function examDayCard() {
    var t = today(), name = examName(t); if (!name) return '';
    var subs = P.examDays[t] || [], nx = nextExamDay(t), nxSubs = nx ? (P.examDays[nx] || []) : [];
    var h = '<section class="card pl-examday"><span class="pl-ex-badge">📝 오늘 ' + esc(name) + '</span><h2>시험 화이팅! 💪</h2>';
    if (exEdit === t) h += examPicker(t);
    else if (subs.length) h += '<ol class="pl-ex-list">' + subs.map(function (x, i) { return '<li><b>' + (i + 1) + '교시</b> ' + esc(x) + '</li>'; }).join('') + '</ol>';
    else h += '<p class="muted">오늘 시험 과목을 넣으면 순서대로 보여줘. 학교에서 받은 시험 시간표대로 눌러줘.</p><p><button type="button" class="primary" data-pl-ex-edit="' + t + '">오늘 시험 과목 넣기</button></p>';
    h += '<ul class="pl-ex-tips"><li>✏️ 컴퓨터용 사인펜 · 수정테이프 · 시계</li><li>⏱ 시작 전 5분: 자주 틀린 것만 훑기</li><li>🧘 끝난 과목은 잊고 다음 과목에 집중</li><li>🌙 오늘은 일찍 자기 — 잠이 점수야</li></ul>';
    if (nx) {
      h += '<div class="pl-ex-next"><b>다음 시험 ' + dlabel(nx) + '</b> ' + (exEdit === nx ? '' : nxSubs.length ? nxSubs.map(esc).join(' · ') : '<span class="muted">과목 미정</span>') + '</div>';
      if (exEdit === nx) h += examPicker(nx);
    }
    if (exEdit !== t && exEdit !== nx) h += '<p class="pl-ex-btns">' + (subs.length ? '<button type="button" data-pl-ex-edit="' + t + '">오늘 과목 고치기</button>' : '') + (nx ? '<button type="button" data-pl-ex-edit="' + nx + '">' + dlabel(nx) + ' 과목 ' + (nxSubs.length ? '고치기' : '넣기') + '</button>' : '') + '<button type="button" data-pl-ex-newday>+ 다른 시험일 넣기</button></p>';
    if (exEdit && exEdit !== t && exEdit !== nx) h += '<div class="pl-ex-next"><b>' + dlabel(exEdit) + ' 시험</b></div>' + examPicker(exEdit);
    return h + '</section>';
  }
  /* 다음 시험 대비(시험 기간): 다음 시험 과목별 마무리 체크 */
  function examPrepCard() {
    var t = today(), nx = nextExamDay(t); if (!nx || gap(nx) > 4) return '';
    var subs = P.examDays[nx] || [];
    var h = '<section class="card pl-exprep"><h2>📚 ' + dlabel(nx) + ' 시험 대비</h2>';
    if (!subs.length) return h + '<p class="muted">다음 시험 과목을 넣으면 과목별로 마무리할 것을 정리해줄게.</p><p><button type="button" data-pl-ex-edit="' + nx + '">' + dlabel(nx) + ' 시험 과목 넣기</button></p></section>';
    return h + '<ul class="pl-list">' + subs.map(function (x) {
      var k = nx + '@' + x, on = !!P.examPrep[k];
      return '<li class="pl-item' + (on ? ' done' : '') + '"><label class="pl-main"><input type="checkbox" data-pl-exprep="' + esc(k) + '"' + (on ? ' checked' : '') + '><span><b>' + esc(x) + '</b><small>오답·자주 틀린 개념 다시 보기 → 핵심 요약 한 번 · 약 30분</small></span></label><button type="button" class="pl-play" data-pl-play-ex="' + esc(x) + '" aria-label="집중 시작">▶</button></li>';
    }).join('') + '</ul><p class="muted small">새 내용보다 이미 한 것을 다시 보는 게 점수에 더 남아.</p></section>';
  }
  function upcomingExams() { return state.dates.filter(function (x) { return !x.done && x.kind === '시험' && gap(x.date) >= 0; }).sort(function (a, b) { return a.date.localeCompare(b.date); }); }
  /* 시험 범위 하루 분량: 남은 쪽 ÷ 시험 전날까지 남은 날 */
  function examPortions() {
    var out = [];
    upcomingExams().forEach(function (x) {
      var m = P.dmeta[x.id]; if (!m || !m.p1 || !m.p2 || m.p2 < m.p1 || gap(x.date) < 1) return;
      if (m.doneOn === today() && m.dFrom) { out.push({ id: x.id, title: x.title, subject: x.subject, dday: gap(x.date), from: m.dFrom, to: m.dTo, per: m.dTo - m.dFrom + 1, unit: m.unit || 'p.', done: true }); return; }
      var from = Math.max(m.p1, (m.prog || m.p1 - 1) + 1); if (from > m.p2) return;
      var days = Math.max(1, gap(x.date)), left = m.p2 - from + 1, per = Math.ceil(left / days);
      out.push({ id: x.id, title: x.title, subject: x.subject, dday: gap(x.date), from: from, to: Math.min(m.p2, from + per - 1), per: per, unit: m.unit || 'p.', done: m.doneOn === today() });
    });
    return out;
  }
  function dueAgain() {
    var t = today(), out = [];
    state.reviews.forEach(function (r) {
      (P.again[r.id] || []).forEach(function (d) { if (d <= t && d >= addD(t, -3) && !P.againDone[r.id + '@' + d]) out.push({ r: r, date: d }); });
    });
    return out;
  }
  /* 지금부터 쓸 수 있는 시간(추정): 학교 끝 + 이동 40분 → 22:30, 학원은 앞뒤 30분 이동 포함, 저녁 60분 */
  function freeTime() {
    var row = todayRow(), per = (typeof FC_SCHOOL !== 'undefined' && FC_SCHOOL.config.periods) || [], start = 9 * 60;
    if (row.length && per[row.length - 1]) start = toMin(per[row.length - 1]) + ((typeof FC_SCHOOL !== 'undefined' && FC_SCHOOL.config.classMinutes) || 50) + 40;
    if (examName(today())) start = 13 * 60 + 30;   // 시험날은 보통 낮에 끝나 (추정)
    start = Math.max(start, nowMin()); var end = 22 * 60 + 30; if (start >= end) return 0;
    var busy = (typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(today()) : []).map(function (a) { var s0 = toMin(a.start), e0 = toMin(a.end) || (s0 != null ? s0 + 90 : null); return s0 == null ? null : [s0 - 30, e0 + 30]; }).filter(Boolean);
    if (typeof FC_LIFE !== 'undefined') FC_LIFE.forDay(today()).forEach(function (x) { var s0 = toMin(x.start), e0 = toMin(x.end) || (s0 != null ? s0 + 60 : null); if (s0 != null && x.busy) busy.push([s0, e0]); });
    if (start < 19 * 60 && end > 19 * 60 + 30) busy.push([18 * 60 + 30, 19 * 60 + 30]);
    var free = 0; for (var m = start; m < end; m += 5) { if (!busy.some(function (b) { return m >= b[0] && m < b[1]; })) free += 5; }
    return free;
  }
  function planned() {
    var mins = todays().filter(function (x) { return !x.t.done; }).reduce(function (s0, x) { return s0 + est(x.q); }, 0);
    mins += dueAgain().length * 10 + examPortions().filter(function (e) { return !e.done; }).length * 30;
    var nx = nextExamDay(today()); if (nx && gap(nx) <= 4) mins += (P.examDays[nx] || []).filter(function (x) { return !P.examPrep[nx + '@' + x]; }).length * 30;
    return mins;
  }
  function loadLevel(plan, free) {
    if (!plan) return { dots: 0, label: '가벼움' };
    if (!free) return { dots: 5, label: '오늘은 시간이 거의 없어' };
    var r = plan / free; return r < 0.4 ? { dots: 1, label: '여유' } : r < 0.7 ? { dots: 2, label: '여유' } : r < 0.9 ? { dots: 3, label: '보통' } : r < 1.15 ? { dots: 4, label: '빠듯' } : { dots: 5, label: '많아 — C는 내일로' };
  }
  function itemHtml(x) {
    var id = esc(x.t.id), sub = subjOf(x.t.title), meta = [sub, est(x.q) + '분', x.q.min ? x.q.min + '분 집중' : ''].filter(Boolean).join(' · ');
    return '<li class="pl-item' + (x.t.done ? ' done' : '') + '"><button type="button" class="pl-pri p' + x.q.p + '" data-pl-pri="' + id + '" aria-label="우선순위 ' + x.q.p + ', 눌러서 바꾸기">' + x.label + '</button>' +
      '<label class="pl-main"><input type="checkbox" data-check="tasks" data-id="' + id + '" ' + (x.t.done ? 'checked' : '') + '><span><b>' + esc(x.t.title) + '</b><small>' + esc(meta) + '</small></span></label>' +
      (x.t.done ? '' : '<button type="button" class="pl-play" data-pl-play="' + id + '" aria-label="집중 시작">▶</button>') +
      '<button type="button" class="pl-more" data-pl-more="' + id + '" aria-label="더보기">⋯</button>' +
      (openMore === x.t.id ? '<div class="pl-acts"><span>예상</span>' + [15, 25, 40, 60].map(function (n) { return '<button type="button" data-pl-est="' + id + '" data-n="' + n + '"' + (est(x.q) === n ? ' class="on"' : '') + '>' + n + '분</button>'; }).join('') +
        '<br><button type="button" data-pl-later="' + id + '">내일로 →</button><button type="button" data-pl-no="' + id + '">안 함 ✕</button><button type="button" data-remove="tasks" data-id="' + id + '">지우기</button></div>' : '') + '</li>';
  }
  function tasksCard() {
    var L = todays(), od = overdue(), t = today(), dt = new Date(t + 'T12:00:00Z');
    var undone = L.filter(function (x) { return !x.t.done; }), top = undone.slice(0, 3), rest = L.filter(function (x) { return top.indexOf(x) < 0; });
    var row = todayRow(), ex = upcomingExams()[0], acs = typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(t) : [];
    var plan = planned(), free = freeTime(), lv = loadLevel(plan, free);
    var exN = examName(t);
    var meta = [exN ? '📝 ' + exN : row.length ? '수업 ' + row.length + '교시' : '수업 없음', ex ? (ex.title.length > 10 ? '시험' : ex.title) + ' D-' + gap(ex.date) : '', acs.length ? '학원 ' + acs.length : ''].filter(Boolean).join(' · ');
    var html = '<div class="pl-hero-top"><div><b>' + (dt.getUTCMonth() + 1) + '월 ' + dt.getUTCDate() + '일 ' + KDAY[dt.getUTCDay()] + '요일</b><small>' + esc(meta) + '</small></div><button type="button" class="pl-mini" data-go="focus">⏱ 집중</button></div>';
    html += '<div class="pl-loadrow"><span>오늘 공부 예상 <b>' + plan + '분</b></span><span>쓸 수 있는 시간 약 <b>' + free + '분</b><small>(추정)</small></span><span class="pl-lv" aria-label="부담도 ' + lv.dots + '/5">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= lv.dots ? 'on' : '') + '"></i>'; }).join('') + ' ' + lv.label + '</span></div>';
    if (od.length) html += '<div class="pl-carry"><span>지난 할 일 ' + od.length + '개, 오늘로 가져올까?</span><button type="button" data-pl-carry="all">가져오기</button><button type="button" data-pl-carry="no">괜찮아</button></div>';
    html += '<h2 class="pl-top-h">' + (undone.length ? '오늘 이것만 하면 돼' : L.length ? '오늘 할 일 끝! 🎉' : '오늘 할 일') + '</h2>';
    html += top.length ? '<ul class="pl-list">' + top.map(itemHtml).join('') + '</ul>' : (L.length ? '' : '<p class="muted">할 일을 적어줘. 위에서부터 3개가 "오늘 이것만"이 돼.</p>');
    var ag = dueAgain(), eps = examPortions();
    if (ag.length || eps.length) {
      html += '<ul class="pl-list pl-auto">' +
        eps.map(function (e) { return '<li class="pl-item' + (e.done ? ' done' : '') + '"><span class="pl-tag">시험</span><label class="pl-main"><input type="checkbox" data-pl-exam="' + esc(e.id) + '" data-to="' + e.to + '"' + (e.done ? ' checked' : '') + '><span><b>' + esc((e.subject ? e.subject + ' ' : '') + e.unit + e.from + '~' + e.to) + '</b><small>' + esc(e.title) + ' D-' + e.dday + ' · 하루 ' + e.per + (e.unit === 'p.' ? '쪽' : '') + '</small></span></label></li>'; }).join('') +
        ag.map(function (a) { return '<li class="pl-item"><span class="pl-tag again">다시</span><label class="pl-main"><input type="checkbox" data-pl-again="' + esc(a.r.id) + '" data-d="' + a.date + '"><span><b>' + esc(a.r.title) + '</b><small>' + esc((a.r.subject ? a.r.subject + ' · ' : '') + '답 안 보고 다시 설명해보기 · 10분') + '</small></span></label></li>'; }).join('') + '</ul>';
    }
    if (rest.length) html += '<details class="pl-all"' + (openAll ? ' open' : '') + '><summary data-pl-all>전체 할 일 보기 (' + rest.length + ')</summary><ul class="pl-list">' + rest.map(itemHtml).join('') + '</ul></details>';
    html += '<form data-form="tasks" class="pl-add"><input name="title" required maxlength="120" placeholder="할 일 추가 (예: 수학 유형 3~5)" aria-label="할 일"><button class="primary" aria-label="추가">추가</button></form>';
    html += '<p class="pl-legend">A 오늘 반드시 · B 가능하면 오늘 · C 시간 남으면 — 칩을 누르면 바뀌어. 앱이 정리해도 고르는 건 너야.</p>';
    return html;
  }
  /* 새 할 일: A가 없으면 A, 아니면 B */
  var lastIds = new Set(state.tasks.map(function (x) { return x.id; }));
  function tagNew() {
    var t = today(), hasA = state.tasks.some(function (x) { return x.date === t && P.pri[x.id] && P.pri[x.id].p === 'A' && !x.done; });
    state.tasks.forEach(function (x) { if (!lastIds.has(x.id)) { if (!P.pri[x.id]) P.pri[x.id] = { p: hasA ? 'B' : 'A', st: '', min: 0 }; hasA = true; } });
    lastIds = new Set(state.tasks.map(function (x) { return x.id; }));
    state.reviews.forEach(function (r) { if (!lastRev.has(r.id) && !P.again[r.id]) P.again[r.id] = [1, 3, 7].map(function (n) { return addD(r.date || today(), n); }); });   // 새 복습: 내일·3일·7일 뒤 다시 보기
    lastRev = new Set(state.reviews.map(function (r) { return r.id; }));
  }
  var lastRev = new Set(state.reviews.map(function (r) { return r.id; }));

  /* ---------- 하루 마무리 ---------- */
  function closeCard() {
    var t = today(), d = P.days[t], parent = isParent(), late = new Date(Date.now() + 9 * 3600000).getUTCHours() >= 20;
    if (parent) {
      if (!P.share.reflect || !d) return '';
      return '<section class="card pl-close"><h2>승준이 하루 마무리</h2>' + summary(d) + '</section>';
    }
    if (d && openClose !== t) return '<section class="card pl-close"><div class="pl-head"><h2>하루 마무리 ✓</h2><button type="button" class="pl-mini" data-pl-close-edit>고치기</button></div>' + summary(d) + '</section>';
    var doneT = state.tasks.filter(function (x) { return x.date === t && x.done; }), undone = todays().filter(function (x) { return !x.t.done; });
    d = d || {};
    return '<section class="card pl-close' + (late ? ' late' : '') + '"><h2>하루 마무리 <small>30초 · 안 써도 괜찮아</small></h2><form data-pl-close>' +
      '<label>오늘 잘한 것</label>' + (doneT.length ? '<div class="pl-chips">' + doneT.slice(0, 6).map(function (x) { return '<button type="button" data-pl-good="' + esc(x.title) + '"' + (d.good === x.title ? ' class="on"' : '') + '>' + esc(x.title) + '</button>'; }).join('') + '</div>' : '') +
      '<input name="good" maxlength="60" value="' + esc(d.good || '') + '" placeholder="직접 적어도 돼">' +
      '<label>내일 바꿀 한 가지</label><input name="change" maxlength="40" value="' + esc(d.change || '') + '" placeholder="예: 학원 가기 전에 숙제 먼저">' +
      '<label>내일 제일 먼저 할 것 (A1)</label>' + (undone.length ? '<div class="pl-chips">' + undone.slice(0, 4).map(function (x) { return '<button type="button" data-pl-a1="' + esc(x.t.title) + '"' + (d.a1 === x.t.title ? ' class="on"' : '') + '>' + esc(x.t.title) + '</button>'; }).join('') + '</div>' : '') +
      '<input name="a1" maxlength="80" value="' + esc(d.a1 || '') + '" placeholder="예: 영어 L2 본문 읽기">' +
      '<p><button class="primary">마무리 저장</button></p></form></section>';
  }
  var openClose = '';
  function summary(d) {
    return '<ul class="pl-sum">' + (d.good ? '<li>👍 <b>잘한 것</b> ' + esc(d.good) + '</li>' : '') + (d.change ? '<li>🔁 <b>내일 바꿀 것</b> ' + esc(d.change) + '</li>' : '') + (d.a1 ? '<li>🥇 <b>내일 A1</b> ' + esc(d.a1) + '</li>' : '') + '</ul>';
  }

  /* ---------- 다짐 한 줄 ---------- */
  function missionLine() {
    if (!P.mission || (isParent() && !P.share.mission)) return '';
    return '<p class="pl-mission">🧭 ' + esc(P.mission) + '</p>';
  }

  /* ---------- 이번 주 큰 돌 ---------- */
  function rocksCard() {
    var wk = monday(today()), w = P.weeks[wk] || { rocks: [] }, prev = P.weeks[addD(wk, -7)], dow = (new Date(today() + 'T12:00:00Z').getUTCDay() + 6) % 7;
    var hour = new Date(Date.now() + 9 * 3600000).getUTCHours();
    var html = '<section class="card pl-rocks"><div class="pl-head"><h2>이번 주 큰 돌</h2><span class="pl-count">' + md(wk) + '~' + md(addD(wk, 6)) + '</span></div>';
    // 지난주 점검: 월요일(또는 일요일 저녁 이후) 지난주 큰 돌 결과가 비었을 때
    if (prev && prev.rocks.length && prev.rocks.some(function (r) { return !r.st; }) && dow <= 1) {
      html += '<div class="pl-review"><b>지난주 점검</b> 했으면 ✓, 못 했으면 ✕를 눌러줘.<ul class="pl-rock-list">' + prev.rocks.map(function (r) {
        return '<li><span>' + esc(r.title) + '</span><button type="button" data-pl-prev="' + esc(r.id) + '" data-v="done"' + (r.st === 'done' ? ' class="on"' : '') + '>✓</button><button type="button" data-pl-prev="' + esc(r.id) + '" data-v="no"' + (r.st === 'no' ? ' class="on"' : '') + '>✕</button></li>';
      }).join('') + '</ul></div>';
    }
    if (dow === 6 && hour >= 18 && !(P.weeks[addD(wk, 7)] || {}).rocks) html += '<p class="pl-hint">일요일 3분 점검: 이번 주 큰 돌을 체크하고, 다음 주 큰 돌을 정해두자.</p>';
    html += w.rocks.length ? '<ul class="pl-rock-list">' + w.rocks.map(function (r) {
      return '<li class="' + (r.st || '') + '"><button type="button" class="pl-rock-st" data-pl-rock="' + esc(r.id) + '" aria-label="상태 바꾸기">' + (r.st === 'done' ? '✓' : r.st === 'no' ? '✕' : '○') + '</button><span>' + esc(r.title) + '</span>' + (isParent() ? '' : '<button type="button" class="pl-x" data-pl-rock-del="' + esc(r.id) + '" aria-label="지우기">×</button>') + '</li>';
    }).join('') + '</ul>' : '<p class="muted">이번 주에 꼭 해낼 큰 일 3개만 정해줘. 하루 할 일은 이걸 쪼갠 거야.</p>';
    if (w.rocks.length < 3) {
      var sug = suggestions().filter(function (s) { return !w.rocks.some(function (r) { return r.title === s; }); }).slice(0, 4);
      if (sug.length) html += '<div class="pl-chips">' + sug.map(function (s) { return '<button type="button" data-pl-rock-add="' + esc(s) + '">+ ' + esc(s) + '</button>'; }).join('') + '</div>';
      html += '<form data-pl-rock-form class="pl-add"><input name="t" maxlength="60" placeholder="큰 돌 추가 (예: 통과 수행 보고서 초안)" aria-label="큰 돌"><button class="primary">추가</button></form>';
    }
    return html + '</section>';
  }
  function suggestions() {
    var out = [];
    state.dates.filter(function (x) { return !x.done && gap(x.date) >= 0 && gap(x.date) <= 28; }).sort(function (a, b) { return a.date.localeCompare(b.date); })
      .forEach(function (x) { out.push((x.kind === '시험' ? x.title + ' 범위 1회독' : x.title + ' 준비')); });
    P.goals.filter(function (g) { return !g.done && g.title; }).forEach(function (g) { out.push(g.title + ' — 이번 주 한 걸음'); });
    return out;
  }

  /* ---------- 기록(통계) ---------- */
  function studiedDays(from, to) {
    var set = {};
    function add(d) { if (d >= from && d <= to) set[d] = 1; }
    P.focus.forEach(function (f) { add(f.date); });
    state.tasks.forEach(function (x) { if (x.done) add((P.pri[x.id] && P.pri[x.id].doneAt) || x.date); });
    Object.keys(state.sessions || {}).forEach(function (d) { if (state.sessions[d] > 0) add(d); });
    var plus = ls(PLUS, {}) || {};
    Object.values(plus.reviews || {}).forEach(function (r) { (r.attempts || []).forEach(function (a) { add(a.date); }); });
    (plus.logs || []).forEach(function (l) { add(l.date); });
    state.reviews.forEach(function (r) { add(r.date); });
    return set;
  }
  function statsView() {
    var t = today(), wk = monday(t), we = addD(wk, 6), parent = isParent();
    var days = studiedDays(wk, we), dayN = Object.keys(days).length;
    var dots = WD.map(function (n, i) { var d = addD(wk, i); return '<span class="pl-dot' + (days[d] ? ' on' : '') + (d === t ? ' now' : '') + (d > t ? ' future' : '') + '"><i></i>' + n + '</span>'; }).join('');
    var plus = ls(PLUS, {}) || {}, att = [];
    Object.values(plus.reviews || {}).forEach(function (r) { (r.attempts || []).forEach(function (a) { if (a.date >= wk && a.date <= we) att.push(a); }); });
    var alone = att.filter(function (a) { return a.result === 'alone'; }).length;
    var explain = state.reviews.filter(function (r) { return r.date >= wk && r.date <= we; }).length;
    var doneW = state.tasks.filter(function (x) { var d = (P.pri[x.id] && P.pri[x.id].doneAt) || x.date; return x.done && d >= wk && d <= we; });
    var aDone = doneW.filter(function (x) { return P.pri[x.id] && P.pri[x.id].p === 'A'; }).length;
    var fw = P.focus.filter(function (f) { return f.date >= wk && f.date <= we; }), fmin = fw.reduce(function (s, f) { return s + (f.min || 0); }, 0);
    var bySub = {}; fw.forEach(function (f) { var k = f.subject || '기타'; bySub[k] = (bySub[k] || 0) + f.min; });
    var subs = Object.keys(bySub).sort(function (a, b) { return bySub[b] - bySub[a]; }), maxS = subs.length ? bySub[subs[0]] : 1;
    var weeks = [3, 2, 1, 0].map(function (k) {
      var s = addD(wk, -7 * k), e = addD(s, 6), n = Object.keys(studiedDays(s, e)).length, m = P.focus.filter(function (f) { return f.date >= s && f.date <= e; }).reduce(function (a, f) { return a + f.min; }, 0);
      return { label: k ? md(s) : '이번 주', n: n, m: m };
    });
    var planW = state.tasks.filter(function (x) { return x.date >= wk && x.date <= we && pr(x.id).st !== 'no'; });
    var qs = fw.filter(function (f) { return f.q; }), qAvg = qs.length ? Math.round(qs.reduce(function (a2, f) { return a2 + f.q; }, 0) / qs.length * 10) / 10 : 0;
    var ex = upcomingExams()[0];
    if (parent && !P.share.flow) {
      return '<div class="pl-stat-top"><h1>승준이 공부 기록</h1></div><section class="card"><p class="pl-big">승준이가 주간 흐름은 아직 공개하지 않았어.</p><p class="muted">공개 범위는 승준이가 ⚙️ 설정 → 플래너에서 정해.' + (ex && P.share.exams ? '<br>다가오는 시험: ' + esc(ex.title) + ' D-' + gap(ex.date) : '') + '</p></section>';
    }
    var head = dayN ? '이번 주 <b>' + dayN + '일</b> 공부했어' + (dayN >= 5 ? ' 🔥' : dayN >= 3 ? ' 💪' : ' 👍') : '새 주 시작! 첫 기록을 남겨볼까';
    if (parent) {   // 엄마: 감시가 아니라 흐름 요약
      head = dayN ? '이번 주 <b>' + dayN + '일</b> 공부했어요' : '이번 주는 아직 기록이 없어요';
      var tip = aDone ? '이번 주 A 할 일을 ' + aDone + '개 해냈어요. 스스로 고른 중요한 일을 끝낸 횟수예요.' : planW.length ? '이번 주 계획을 ' + planW.length + '개 세웠어요. 계획을 세우는 습관이 시작됐어요.' : '이번 주는 아직 기록이 적어요. 잔소리보다 "오늘 A 하나만"이 효과적이에요.';
      return '<div class="pl-stat-top"><h1>이번 주 승준</h1>' + missionLine() + '</div>' +
        '<section class="card"><p class="pl-big">' + head + '</p><div class="pl-dots">' + dots + '</div></section>' +
        '<section class="card pl-parent"><ul><li><b>' + doneW.length + '/' + planW.length + '</b> 계획한 일</li><li><b>' + fw.length + '회</b> 집중' + (fmin ? ' · ' + fmin + '분' : '') + '</li><li><b>' + (explain + att.length) + '회</b> 복습</li>' + (ex && P.share.exams ? '<li><b>D-' + gap(ex.date) + '</b> ' + esc(ex.title) + '</li>' : '') + '</ul>' +
        '<p class="pl-tip">💡 ' + esc(tip) + '</p><p class="muted small">시간·점수 비교 대신 습관의 변화만 보여줘요. 자세한 기록은 승준이가 공개한 것만 보여요.</p></section>';
    }
    var html = '<div class="pl-stat-top"><h1>나의 공부 기록</h1>' + missionLine() + '</div>' +
      '<section class="card"><p class="pl-big">' + head + '</p><div class="pl-dots">' + dots + '</div></section>' +
      '<div class="pl-tiles">' +
        tile('✅', planW.length ? doneW.length + ' / ' + planW.length : '', planW.length ? '이번 주 계획한 일 중 해낸 것' : '오늘 탭에서 할 일을 적으면 여기 쌓여', planW.length ? '' : '<button type="button" class="pl-mini" data-go="today">할 일 적기</button>') +
        tile('⏱', fw.length ? fw.length + '회 · ' + fmin + '분' : '', fw.length ? '집중' + (qAvg ? ' · 집중도 평균 ' + qAvg + '/5' : '') : '할 일 옆 ▶로 첫 집중을 해봐', fw.length ? '' : '<button type="button" class="pl-mini" data-go="today">집중 시작</button>') +
        tile('🔁', explain ? explain + '개' : '', explain ? '내가 진짜 이해했는지 확인한 복습' : '첫 복습을 해보면 여기 기록돼', explain ? '' : '<button type="button" class="pl-mini" data-go="review">복습 시작</button>') +
        tile('🎯', att.length ? alone + ' / ' + att.length : '', att.length ? '오답 다시 도전 · 혼자 맞힘' : '틀린 문제를 다시 풀면 여기 쌓여', att.length ? '' : '<button type="button" class="pl-mini" data-go="review">오답 넣기</button>') +
      '</div>';
    if (subs.length) html += '<section class="card"><h2>과목별 집중</h2>' + subs.map(function (k) { return '<div class="pl-bar"><span>' + esc(k) + '</span><i style="width:' + Math.max(6, Math.round(bySub[k] / maxS * 100)) + '%"></i><b>' + bySub[k] + '분</b></div>'; }).join('') + '</section>';
    html += '<section class="card"><h2>4주 흐름</h2><div class="pl-weeks">' + weeks.map(function (w) { return '<div><i style="height:' + Math.max(4, w.n / 7 * 64) + 'px"></i><b>' + w.n + '일</b><small>' + w.label + (w.m ? '<br>' + w.m + '분' : '') + '</small></div>'; }).join('') + '</div></section>';
    html += '<section class="card"><div class="pl-head"><h2>이번 학기 목표</h2>' + (parent ? '' : '<button type="button" class="pl-mini" data-pl-goals>설정</button>') + '</div>' + (P.goals.length ? '<ul class="pl-goals">' + P.goals.map(function (g) {
      return '<li class="' + (g.done ? 'done' : '') + '"><button type="button" class="pl-rock-st" data-pl-goal="' + esc(g.id) + '"' + (parent ? ' disabled' : '') + '>' + (g.done ? '✓' : '○') + '</button><span><b>' + esc(g.title) + '</b><small>' + esc([g.type, g.subject, g.measure, g.due ? '~' + md(g.due) : ''].filter(Boolean).join(' · ')) + '</small></span></li>';
    }).join('') + '</ul>' : '<p class="muted">' + (parent ? '아직 정한 목표가 없어.' : '⚙️ 설정 → 플래너에서 학기 목표를 3개까지 정할 수 있어.') + '</p>') + '</section>';
    return html;
  }
  function tile(i, v, l, btn) { return '<div class="pl-tile' + (v ? '' : ' empty') + '"><span>' + i + '</span>' + (v ? '<b>' + v + '</b>' : '') + '<small>' + l + '</small>' + (btn || '') + '</div>'; }

  /* ---------- 설정: 플래너 ---------- */
  function settingsCard() {
    var g = P.goals.slice(); while (g.length < 3) g.push({});
    var subjects = ['', '국어', '수학', '영어', '통합사회', '통합과학', '한국사', '과탐실험', '정보', '전체'];
    return '<section class="card" id="set-planner"><h2>플래너</h2><form data-pl-set>' +
      '<label>나의 다짐 <small class="muted">(한 줄, 오늘 화면 위에 보여)</small></label><input name="mission" maxlength="60" value="' + esc(P.mission) + '" placeholder="나는 ___한 사람이 되고 싶다">' +
      '<label>이번 학기 목표 <small class="muted">(3개까지, 과정·습관 목표가 더 잘 지켜져)</small></label>' +
      g.map(function (x, i) {
        return '<div class="pl-goal-form"><div class="pl-row"><select name="g' + i + 'type" aria-label="종류">' + ['과정', '습관', '성적'].map(function (k) { return '<option' + (x.type === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' +
          '<select name="g' + i + 'subject" aria-label="과목">' + subjects.map(function (k) { return '<option value="' + k + '"' + (x.subject === k ? ' selected' : '') + '>' + (k || '과목') + '</option>'; }).join('') + '</select></div>' +
          '<input name="g' + i + 'title" maxlength="50" value="' + esc(x.title || '') + '" placeholder="' + ['예: 수행평가 기한 안에 모두 제출', '예: 매일 영단어 20개', '예: 기말 수학 범위 문제집 2회독'][i] + '">' +
          '<div class="pl-row"><input name="g' + i + 'measure" maxlength="30" value="' + esc(x.measure || '') + '" placeholder="기준 (예: 주 5일)"><input name="g' + i + 'due" type="date" value="' + esc(x.due || '') + '" aria-label="기한"></div></div>';
      }).join('') +
      '<label>엄마랑 같이 볼 것 <small class="muted">(내가 정해)</small></label><div class="pl-switches">' +
        [['flow', '이번 주 공부 흐름'], ['exams', '시험·과제 일정'], ['review', '복습 메모'], ['questions', '내가 쓴 질문'], ['reflect', '하루 마무리'], ['mission', '나의 다짐']].map(function (k) { return '<label><input type="checkbox" name="sh_' + k[0] + '"' + (P.share[k[0]] ? ' checked' : '') + '> ' + k[1] + '</label>'; }).join('') + '</div>' +
      '<p class="muted small">켠 것만 엄마랑 나눠. 엄마는 도와줄 게 있는지 보는 용도야.</p>' +
      '<p><button class="primary">플래너 저장</button></p></form></section>';
  }

  /* ---------- 화면에 끼우기 ---------- */
  var prevRender = render;
  render = function () {
    tagNew();
    prevRender();
    if (tab === 'today') enhanceToday();
    if (tab === 'week') { var r = document.getElementById('content'); r.insertAdjacentHTML('afterbegin', rocksCard()); }
    if (tab === 'stats') { document.getElementById('content').innerHTML = statsView(); document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.toggle('active', b.dataset.go === 'stats'); }); }
    if (tab === 'focus') enhanceFocus();
    if (tab === 'review') enhanceReview();
    if (tab === 'dates') enhanceDates();
    if (tab === 'settings') {
      var fam = document.getElementById('set-profile'); if (fam) fam.insertAdjacentHTML('beforebegin', settingsCard());
      var nav = document.querySelector('.set-jump'); if (nav && !nav.querySelector('[data-jump="set-planner"]')) nav.insertAdjacentHTML('afterbegin', '<a href="#set-planner" data-jump="set-planner">플래너</a>');
      if (jumpTo) { var j = document.getElementById(jumpTo); jumpTo = ''; if (j) setTimeout(function () { window.scrollTo({ top: j.getBoundingClientRect().top + window.scrollY - 64 }); }, 30); }
    }
  };
  var jumpTo = '';
  /* ---------- 시작 화면: 힐링 그림 + 오늘의 핵심만 ---------- */
  var SOFT = ['아직 몰라도 괜찮아. 네 속도로 하나씩.', '오늘은 A 하나만 해도 충분해.', '쉬는 것도 계획이야. 대신 시작은 10분만.', '어제보다 한 걸음이면 돼.', '모르는 걸 찾은 날이 제일 많이 배운 날이야.', '천천히 해도 결국 다 쌓여.', '잘하고 있어. 오늘도 조금만.'];
  function heroCard() {
    var t = today(), h = new Date(Date.now() + 9 * 3600000).getUTCHours(), parent = isParent(), name = parent ? '승준이' : '승준아';
    var exN = examName(t), L = todays(), undone = L.filter(function (x) { return !x.t.done; }), doneN = L.length - undone.length;
    var hello = parent ? (h < 12 ? '좋은 아침이에요, 엄마 ☀️' : h < 21 ? '승준이 오늘 이렇게 해요' : '오늘도 수고 많았어요 🌙')
      : h >= 21 || h < 5 ? '잠옷 입을 시간 🌙 오늘도 수고했어' : h < 11 ? '좋은 아침, ' + name + ' ☀️' : h < 17 ? '오후도 힘내, ' + name : '저녁이야, 하나씩 해볼까';
    var core = [];
    if (exN) core.push('📝 오늘 ' + exN + ' — 시험 화이팅!');
    if (undone[0]) core.push('🥇 ' + undone[0].label + ' ' + undone[0].t.title);
    else if (L.length) core.push('✅ 오늘 할 일 ' + L.length + '개 다 해냈어!');
    else if (!exN) core.push('✏️ 오늘 할 일 하나만 정해볼까?');
    var now = h * 60 + new Date(Date.now() + 9 * 3600000).getUTCMinutes();
    var ac = (typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(t) : []).filter(function (a) { var m = toMin(a.start); return m == null || m > now; })[0];
    if (ac) core.push('🏫 ' + (ac.start ? ac.start + ' ' : '') + ac.name + (ac.homework && !ac.hwDone ? ' · 숙제 체크' : ''));
    var ex = upcomingExams().filter(function (x) { return x.date > t; })[0], nx = nextExamDay(t);
    if (core.length < 3 && nx && gap(nx) <= 7) core.push('📚 다음 시험 ' + dlabel(nx) + (P.examDays[nx] && P.examDays[nx].length ? ' · ' + P.examDays[nx].join('·') : ''));
    else if (core.length < 3 && ex) core.push('📝 ' + ex.title + ' D-' + gap(ex.date));
    var ag = dueAgain().length; if (core.length < 3 && ag) core.push('🔁 다시 보기 ' + ag + '개 (10분씩)');
    var night = h >= 21 || h < 5, closed = !!P.days[t];
    var btn = parent ? '' : undone[0] && !night ? '<button type="button" class="primary hero-go" data-pl-play="' + esc(undone[0].t.id) + '">▶ ' + esc(undone[0].label) + ' 바로 시작</button>'
      : night && !closed ? '<button type="button" class="primary hero-go" data-hero-close>🌙 하루 마무리 30초</button>'
      : !L.length && !exN ? '<button type="button" class="primary hero-go" data-hero-add>할 일 적기</button>' : '';
    var soft = P.mission && (!parent || P.share.mission) ? '🧭 ' + P.mission : SOFT[(Number(t.slice(8)) + Number(t.slice(5, 7))) % SOFT.length];
    return '<section class="hero-heal' + (night ? ' night' : '') + '"><div class="hero-img" role="img" aria-label="잠옷 입고 쉬는 그림"></div><div class="hero-body">' +
      '<span class="hero-tag">🌱 ' + esc(hello) + '</span><h1 class="hero-title">오늘의 핵심' + (L.length ? ' <small>' + doneN + '/' + L.length + '</small>' : '') + '</h1>' +
      '<ul class="hero-core">' + core.slice(0, 3).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' +
      '<p class="hero-soft">' + esc(soft) + '</p>' + btn + '</div></section>';
  }
  function enhanceToday() {
    var root = document.getElementById('content');
    var form = root.querySelector('form[data-form="tasks"]'), card = form && form.closest('section');
    if (card) {
      card.className = 'card pl-tasks'; card.innerHTML = tasksCard();
      root.insertAdjacentElement('afterbegin', card);   // '오늘 이것만 하면 돼'가 맨 위(학교 정보는 그 아래)
      var nc = root.querySelector('.next-card'); if (nc && todays().length) nc.remove();   // 할 일이 있으면 '오늘은 이 3개부터'는 겹쳐서 숨김
    }
    root.querySelectorAll('details').forEach(function (d) { var sm = d.querySelector('summary'); if (sm && /최근 7일/.test(sm.textContent)) d.remove(); });   // 기록 탭으로 옮김
    var ec = examDayCard();
    if (ec) {   // 시험날: 수업 칩 대신 시험 카드, '오늘은 이 3개부터'·예습은 시험 대비로
      var lesson = [].slice.call(root.querySelectorAll('section.card')).filter(function (c) { var h2 = c.querySelector('h2'); return h2 && /오늘 수업/.test(h2.textContent); })[0];
      if (lesson) lesson.outerHTML = ec; else root.insertAdjacentHTML('afterbegin', ec);
      var nc2 = root.querySelector('.next-card'); if (nc2) nc2.remove();
      var ep = examPrepCard(), pc = root.querySelector('.wk-prep'); if (ep) { if (pc) pc.outerHTML = ep; else root.querySelector('.pl-examday').insertAdjacentHTML('afterend', ep); }
      var ex1 = root.querySelector('.pl-examday'), tk = root.querySelector('.pl-tasks'); if (ex1 && tk) tk.insertAdjacentElement('beforebegin', ex1);   // 시험 카드를 맨 위로
    } else {
      var ep2 = examPrepCard(), pc2 = root.querySelector('.wk-prep'); if (ep2 && pc2) pc2.insertAdjacentHTML('beforebegin', ep2);   // 시험 전 며칠은 예습 위에 시험 대비
    }
    if (exEdit && !root.querySelector('.pl-examday')) root.insertAdjacentHTML('afterbegin', '<section class="card pl-examday"><span class="pl-ex-badge">📝 시험 과목 넣기</span><h2>' + dlabel(exEdit) + ' 시험</h2>' + examPicker(exEdit) + '</section>');   // 엄마 확인 요청 등에서 연 경우
    var wz = wizardCard(); if (wz) root.insertAdjacentHTML('afterbegin', wz);
    root.insertAdjacentHTML('afterbegin', heroCard());   // 맨 위: 힐링 그림 + 오늘의 핵심 (다짐은 여기 한 줄로)
    var rc = root.querySelector('.rt-card'), cc = closeCard();
    if (cc) { if (rc) rc.insertAdjacentHTML('beforebegin', cc); else root.insertAdjacentHTML('beforeend', cc); }
  }
  function enhanceFocus() {
    var c = cur && state.tasks.find(function (x) { return x.id === cur; });
    var root = document.getElementById('content');
    root.insertAdjacentHTML('afterbegin', '<div class="pl-focus-now">' + (c ? '지금 집중: <b>' + esc(c.title) + '</b> <button type="button" class="linkish" data-pl-unfocus>바꾸기</button>' : '오늘 할 일 옆 ▶를 누르면 그 일에 시간이 쌓여.') + '</div><button type="button" class="pl-back" data-go="today">← 오늘로</button>');
  }

  /* ---------- 처음 설정 4단계 ---------- */
  function wizSteps() {
    var plus = ls(PLUS, {}) || {}, courses = plus.courses || {};
    return [
      { k: 'tt', t: '학교 시간표 사진 올리기', go: 'set-tt', ok: state.table.some(function (r) { return r.some(Boolean); }) },
      { k: 'book', t: '교과서 고르기 (과목만 골라도 돼)', go: 'course-panel', ok: Object.keys(courses).some(function (k) { return courses[k] && (courses[k].book || courses[k].unit); }) },
      { k: 'ac', t: '학원 넣기 (없으면 건너뛰기)', go: 'academy-panel', ok: typeof FC_ACADEMY !== 'undefined' && FC_ACADEMY.list().length > 0 },
      { k: 'goal', t: '이번 학기 목표 최대 3개', go: 'set-planner', ok: P.goals.length > 0 }
    ];
  }
  function wizardCard() {
    if (isParent() || P.wiz.done) return '';
    var st = wizSteps(), i = st.findIndex(function (x) { return !x.ok && !P.wiz.skip[x.k]; });
    if (i < 0) { P.wiz.done = 1; put(); setTimeout(function () { notice('처음 설정 완료! 이제 오늘 탭만 보면 돼 🎉'); }, 300); return ''; }
    return '<section class="card pl-wiz"><div class="pl-wiz-n">처음 설정 ' + (i + 1) + '/4</div><div class="pl-wiz-bar">' + st.map(function (x, j) { return '<i class="' + (x.ok || P.wiz.skip[x.k] ? 'on' : j === i ? 'now' : '') + '"></i>'; }).join('') + '</div>' +
      '<p><b>' + esc(st[i].t) + '</b></p><div class="pl-wiz-btns"><button type="button" class="primary" data-pl-wiz-go="' + st[i].go + '">하러 가기</button><button type="button" data-pl-wiz-skip="' + st[i].k + '">건너뛰기</button></div></section>';
  }

  /* ---------- 복습: 다시 보기 날짜 · 이름 바꾸기 · 질문카드 ---------- */
  function enhanceReview() {
    var root = document.getElementById('content');
    if (isParent() && !P.share.review) {
      root.innerHTML = '<section class="card"><h2>💡 복습</h2><p class="muted">복습 메모는 승준이가 공개한 경우에만 보여. 승준이가 솔직하게 적을 수 있게 비워둔 공간이야.</p></section>'; return;
    }
    root.querySelectorAll('h2').forEach(function (h) { if (/내 말로 다시 설명하기/.test(h.textContent)) { h.textContent = '💡 내가 진짜 이해했는지 확인하기'; var p0 = h.nextElementSibling; if (p0 && p0.classList.contains('muted')) p0.textContent = '답을 안 보고 2~3문장으로 설명해봐. 틀린 이유와 다음에 확인할 것도 하나.'; } });
    var ex = upcomingExams()[0];
    root.querySelectorAll('input[data-check="reviews"]').forEach(function (inp) {
      var id = inp.dataset.id, r = state.reviews.find(function (x) { return x.id === id; }), row = inp.closest('.row'); if (!r || !row) return;
      var ds = P.again[id] || [], base = r.date || today();
      var opts = [['내일', addD(base, 1)], ['3일 뒤', addD(base, 3)], ['7일 뒤', addD(base, 7)]]; if (ex && ex.date > today()) opts.push(['시험 전날', addD(ex.date, -1)]);
      row.insertAdjacentHTML('afterend', '<div class="pl-again"><span>다시 보기</span>' + opts.map(function (o) { var on = ds.indexOf(o[1]) >= 0, dn = P.againDone[id + '@' + o[1]]; return '<button type="button" data-pl-ag="' + esc(id) + '" data-d="' + o[1] + '" class="' + (on ? 'on' : '') + (dn ? ' dn' : '') + '">' + (dn ? '✓ ' : '') + o[0] + '</button>'; }).join('') + '</div>');
    });
    var qp = root.querySelector('#questions');
    if (qp && isParent() && !P.share.questions) qp.remove();
    else if (qp) qp.querySelectorAll('details.subcard').forEach(function (d, i) {
      var q = (ls(PLUS, {}) || {}).questions || [], x = q[i]; if (!x) return;
      d.querySelector('form').insertAdjacentHTML('beforebegin', '<div class="pl-qcard-btns"><button type="button" data-pl-qcopy="' + i + '">📋 질문카드 복사</button><button type="button" data-pl-qshow="' + i + '">🔍 크게 보여주기</button></div>');
    });
  }
  function qText(i) { var x = ((ls(PLUS, {}) || {}).questions || [])[i]; return x ? '선생님, 질문이 있어요.\n\n' + x.title + '\n\n— 1학년 1반 승준' : ''; }

  /* ---------- 시험·과제: 종류별 입력 · 범위 나누기 · 수행 단계 ---------- */
  var dkind = '시험';
  function datesForm() {
    var t = today(), k = dkind, subs = ['국어', '수학', '영어', '통합사회', '통합과학', '한국사', '과탐실험', '정보', '기타'];
    var f = '<form data-pl-dform class="pl-dform"><div class="pl-seg">' + ['시험', '수행평가', '과제'].map(function (x) { return '<button type="button" data-pl-dk="' + x + '" class="' + (x === k ? 'on' : '') + '">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="pl-row"><label>' + (k === '시험' ? '시험일' : '마감일') + '<input type="date" name="date" required value="' + t + '"></label><label>과목<select name="subject">' + subs.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></label></div>' +
      '<label>' + (k === '시험' ? '시험 이름' : k === '수행평가' ? '수행평가 이름 · 제출물' : '해야 할 것') + '<input name="title" required maxlength="80" placeholder="' + (k === '시험' ? '예: 2학기 중간고사 수학' : k === '수행평가' ? '예: 통과 탐구 보고서 (A4 2장)' : '예: 영어 L2 워크북 p.20~25') + '"></label>';
    if (k === '시험') f += '<label>시험 범위 쪽수 <small class="muted">(넣으면 하루 분량을 나눠줘)</small></label><div class="pl-row"><input name="p1" type="number" min="1" max="2000" inputmode="numeric" placeholder="시작 쪽 (예: 32)"><input name="p2" type="number" min="1" max="2000" inputmode="numeric" placeholder="끝 쪽 (예: 78)"></div><input name="note" maxlength="200" placeholder="범위 메모 (예: 교과서 p.32~78, 자이스토리 3단원)">';
    if (k === '수행평가') f += '<input name="prep" maxlength="80" placeholder="준비물 (예: 자료 출력, 색연필)"><p class="muted small">자료 조사 → 초안 → 수정 → 제출 확인 단계를 마감일까지 할 일로 나눠서 넣어줘.</p>';
    f += '<div class="pl-row"><label>중요도<select name="imp"><option>보통</option><option>중요</option><option>매우 중요</option></select></label>' + (k === '시험' ? '' : '<label>예상 시간<select name="est"><option value="20">20분</option><option value="40" selected>40분</option><option value="60">1시간</option><option value="90">1시간 반</option></select></label>') + '</div>' +
      '<p><button class="primary">저장</button></p></form>';
    return f;
  }
  function enhanceDates() {
    var root = document.getElementById('content');
    if (isParent() && !P.share.exams) { root.innerHTML = '<section class="card"><h2>📝 시험·과제</h2><p class="muted">시험·과제 일정은 승준이가 공개한 경우에만 보여.</p></section>'; return; }
    var old = root.querySelector('form[data-form="dates"]'); if (old) { var h = old.closest('section').querySelector('h2'); if (h) h.textContent = '📝 시험·과제 넣기'; old.outerHTML = datesForm(); }
    root.querySelectorAll('input[data-check="dates"]').forEach(function (inp) {
      var m = P.dmeta[inp.dataset.id], row = inp.closest('.row'); if (!m || !row) return;
      var bits = [m.imp && m.imp !== '보통' ? '⭐ ' + m.imp : '', m.est ? '약 ' + m.est + '분' : '', m.p1 && m.p2 ? 'p.' + m.p1 + '~' + m.p2 + (m.prog >= m.p1 ? ' (' + (m.prog - m.p1 + 1) + '/' + (m.p2 - m.p1 + 1) + '쪽 함)' : '') : '', m.steps ? '단계 ' + m.steps + '개 → 할 일' : ''].filter(Boolean);
      var ep = examPortions().find(function (e) { return e.id === inp.dataset.id; });
      if (ep) bits.push('오늘 ' + ep.unit + ep.from + '~' + ep.to);
      if (bits.length) row.insertAdjacentHTML('afterend', '<p class="pl-dmeta">' + bits.map(esc).join(' · ') + '</p>');
    });
  }

  /* ---------- 집중 끝: 집중도 ---------- */
  function subjList() {
    var a = []; todayRow().forEach(function (x) { var k = subjOf(x) || String(x || '').trim(); if (k && a.indexOf(k) < 0) a.push(k); });
    SUBJ.forEach(function (x) { if (a.indexOf(x[0]) < 0) a.push(x[0]); });
    return a.slice(0, 10).concat(['기타']);
  }
  function askQuality() {
    if (document.querySelector('.pl-q-dlg')) return;
    var last = P.focus[P.focus.length - 1]; if (!last) return;
    var sel = { s: last.subject || '', q: 0 };
    var d = document.createElement('div'); d.className = 'pf-dlg pl-q-dlg';
    d.innerHTML = '<div class="pf-dlg-card pl-rec"><h3>' + (last.partial ? '⏱ ' + last.min + '분 기록할게' : '👏 ' + last.min + '분 해냈어!') + '</h3><p class="muted small">공부한 거 남겨두면 📈 기록에 쌓여.</p>' +
      '<p class="pl-rec-h">무슨 과목?</p><div class="pl-rec-subs">' + subjList().map(function (x) { return '<button type="button" data-rs="' + esc(x) + '" class="' + (x === sel.s ? 'on' : '') + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<p class="pl-rec-h">얼마나 집중했어?</p><div class="pl-q5">' + ['거의 못함', '조금 함', '보통', '잘함', '완전 집중'].map(function (t, i) { return '<button type="button" data-q="' + (i + 1) + '"><b>' + (i + 1) + '</b><small>' + t + '</small></button>'; }).join('') + '</div>' +
      '<input class="pl-rec-memo" maxlength="80" placeholder="뭐 했는지 한 줄 (선택) 예: 2단원 문제 10개">' +
      '<div class="pl-rec-btns"><button type="button" class="primary" data-rec-save>기록하기</button><button type="button" class="pf-cancel">건너뛰기</button></div></div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.rs) { sel.s = sel.s === b.dataset.rs ? '' : b.dataset.rs; [].forEach.call(d.querySelectorAll('[data-rs]'), function (x) { x.classList.toggle('on', x.dataset.rs === sel.s); }); return; }
      if (b.dataset.q) { sel.q = Number(b.dataset.q); [].forEach.call(d.querySelectorAll('[data-q]'), function (x) { x.classList.toggle('on', x === b); }); return; }
      if (b.hasAttribute('data-rec-save')) {
        if (sel.s) last.subject = sel.s === '기타' ? '' : sel.s;
        if (sel.q) last.q = sel.q;
        var m = d.querySelector('.pl-rec-memo').value.trim(); if (m) last.memo = m.slice(0, 80);
        put(); notice(sel.q && sel.q <= 2 ? '기록했어. 다음엔 10분부터 가볍게 해보자 🌱' : '기록했어 📒 잘했어!'); d.remove(); render(); return;
      }
      if (b.classList.contains('pf-cancel')) { d.remove(); }
    });
  }
  function addFocus(f) {
    var min = Math.max(1, Math.min(600, Math.round(Number(f.min) || 0))); if (!min) return null;
    var e = { date: f.date || today(), at: Date.now(), min: min, subject: String(f.subject || '').slice(0, 20), task: '', manual: 1 };
    if (f.memo) e.memo = String(f.memo).slice(0, 80);
    P.focus.push(e); put(); return e;
  }

  /* ---------- 동작 ---------- */
  var cur = '';
  try { cur = sessionStorage.getItem('fc-focus-task') || ''; } catch (e) {}
  function rerender() { put(); render(); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.plPri) {
      var q = pr(d.plPri), nx = q.p === 'A' ? 'B' : q.p === 'B' ? 'C' : 'A';
      if (nx === 'A' && todays().filter(function (x) { return x.q.p === 'A' && !x.t.done; }).length >= 3) { notice('A는 3개까지! 진짜 중요한 것만'); nx = 'B'; if (q.p === 'C') nx = 'B'; }
      q.p = nx; rerender(); return;
    }
    if (d.plMore) { openMore = openMore === d.plMore ? '' : d.plMore; render(); return; }
    if (b.hasAttribute('data-hero-close')) { var cc0 = document.querySelector('.pl-close'); if (cc0) { cc0.scrollIntoView({ behavior: 'smooth', block: 'start' }); var i0 = cc0.querySelector('input'); if (i0) setTimeout(function () { i0.focus({ preventScroll: true }); }, 400); } return; }
    if (b.hasAttribute('data-hero-add')) { var ai = document.querySelector('.pl-add input'); if (ai) { ai.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { ai.focus({ preventScroll: true }); }, 400); } return; }
    if (d.plExEdit) { exEdit = d.plExEdit; exSel = (P.examDays[exEdit] || []).slice(); render(); return; }
    if (d.plExs) { var ix2 = exSel.indexOf(d.plExs); if (ix2 >= 0) exSel.splice(ix2, 1); else exSel.push(d.plExs); render(); return; }
    if (b.hasAttribute('data-pl-ex-add')) { var oi = document.querySelector('[data-pl-ex-other]'), ov = oi && oi.value.trim().slice(0, 20); if (ov && exSel.indexOf(ov) < 0) exSel.push(ov); render(); return; }
    if (d.plExSave) { if (exSel.length) P.examDays[d.plExSave] = exSel.slice(0, 6); else delete P.examDays[d.plExSave]; exEdit = ''; exSel = []; notice('시험 과목을 저장했어. 시험 화이팅!'); rerender(); return; }
    if (b.hasAttribute('data-pl-ex-cancel')) { exEdit = ''; exSel = []; render(); return; }
    if (b.hasAttribute('data-pl-ex-newday')) { var nd0 = prompt('시험 날짜를 적어줘 (예: ' + addD(today(), 3) + ')', addD(today(), 1)); if (nd0 && /^\d{4}-\d{2}-\d{2}$/.test(nd0.trim())) { exEdit = nd0.trim(); exSel = (P.examDays[exEdit] || []).slice(); render(); } return; }
    if (d.plPlayEx) { var tt0 = '[시험 대비] ' + d.plPlayEx + ' 오답·핵심 다시 보기', ex0 = state.tasks.find(function (x) { return x.date === today() && x.title === tt0; }); if (!ex0) { ex0 = { id: uid(), title: tt0, date: today(), done: false, kind: '과제', subject: '', note: '' }; state.tasks.push(ex0); lastIds.add(ex0.id); P.pri[ex0.id] = { p: 'A', st: '', min: 0, est: 30 }; save(); put(); } b.dataset.plPlay = ex0.id; }
    if (d.plEst) { pr(d.plEst).est = Number(d.n); openMore = ''; rerender(); return; }
    if (d.plAg) { var arr = P.again[d.plAg] || (P.again[d.plAg] = []), ix = arr.indexOf(d.d); if (ix >= 0) arr.splice(ix, 1); else arr.push(d.d); arr.sort(); rerender(); return; }
    if (d.plWizGo) { jumpTo = d.plWizGo; tab = 'settings'; location.hash = 'settings'; return; }
    if (d.plWizSkip) { P.wiz.skip[d.plWizSkip] = 1; rerender(); return; }
    if (d.plDk) { dkind = d.plDk; var df = document.querySelector('[data-pl-dform]'); if (df) df.outerHTML = datesForm(); return; }
    if (d.plQcopy !== undefined) { var txt = qText(Number(d.plQcopy)); try { navigator.clipboard.writeText(txt).then(function () { notice('질문카드를 복사했어.'); }, function () { notice('복사가 안 돼. 크게 보여주기를 써줘.'); }); } catch (er) { notice('복사가 안 돼. 크게 보여주기를 써줘.'); } return; }
    if (d.plQshow !== undefined) { var qd = document.createElement('div'); qd.className = 'pf-dlg'; qd.innerHTML = '<div class="pf-dlg-card pl-qbig"><p>' + esc(qText(Number(d.plQshow))).replace(/\n/g, '<br>') + '</p><button type="button" class="pf-cancel">닫기</button></div>'; document.body.appendChild(qd); qd.addEventListener('click', function (ev) { if (ev.target === qd || ev.target.closest('.pf-cancel')) qd.remove(); }); return; }
    if (d.plLater) { var x = state.tasks.find(function (t) { return t.id === d.plLater; }); if (x) { x.date = addD(today(), 1); save(); openMore = ''; notice('내일 할 일로 옮겼어.'); rerender(); } return; }
    if (d.plNo) { pr(d.plNo).st = 'no'; openMore = ''; notice('오늘은 안 하기로 했어.'); rerender(); return; }
    if (d.plCarry) {
      var od = overdue();
      if (d.plCarry === 'all') { od.forEach(function (t) { t.date = today(); }); save(); notice(od.length + '개를 오늘로 가져왔어.'); }
      else od.forEach(function (t) { pr(t.id).st = 'no'; });
      rerender(); return;
    }
    if (d.plPlay) {
      cur = d.plPlay; try { sessionStorage.setItem('fc-focus-task', cur); } catch (er) {}
      tab = 'focus'; if (location.hash !== '#focus') location.hash = 'focus'; else render();
      setTimeout(function () { if (!state.timer.end) { var s = document.querySelector('[data-timer]'); if (s) s.click(); } }, 60);
      return;
    }
    if (b.hasAttribute('data-pl-unfocus')) { cur = ''; try { sessionStorage.removeItem('fc-focus-task'); } catch (er) {} tab = 'today'; location.hash = 'today'; return; }
    if (d.plGood !== undefined || d.plA1 !== undefined) {
      var f = b.closest('form'), name = d.plGood !== undefined ? 'good' : 'a1', val = d.plGood !== undefined ? d.plGood : d.plA1;
      f.elements[name].value = val; b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); return;
    }
    if (b.hasAttribute('data-pl-close-edit')) { openClose = today(); render(); return; }
    if (d.plRock) { var w = P.weeks[monday(today())], r = w && w.rocks.find(function (x) { return x.id === d.plRock; }); if (r && !isParent()) { r.st = r.st === '' || !r.st ? 'done' : r.st === 'done' ? 'no' : ''; rerender(); } return; }
    if (d.plRockDel) { var w2 = P.weeks[monday(today())]; if (w2) { w2.rocks = w2.rocks.filter(function (x) { return x.id !== d.plRockDel; }); rerender(); } return; }
    if (d.plRockAdd) { addRock(d.plRockAdd); return; }
    if (d.plPrev) { var pw = P.weeks[addD(monday(today()), -7)], pr2 = pw && pw.rocks.find(function (x) { return x.id === d.plPrev; }); if (pr2) { pr2.st = d.v; rerender(); } return; }
    if (d.plGoal) { var g = P.goals.find(function (x) { return x.id === d.plGoal; }); if (g) { g.done = !g.done; if (g.done) notice('목표 하나 달성! 🎉'); rerender(); } return; }
    if (b.hasAttribute('data-pl-goals')) { jumpTo = 'set-planner'; tab = 'settings'; location.hash = 'settings'; return; }
  });
  function addRock(title) {
    title = String(title || '').trim().slice(0, 60); if (!title) return;
    var wk = monday(today()), w = P.weeks[wk] || (P.weeks[wk] = { rocks: [] });
    if (w.rocks.length >= 3) { notice('큰 돌은 3개까지야.'); return; }
    w.rocks.push({ id: Math.random().toString(36).slice(2, 10), title: title, st: '' }); rerender();
  }
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches('[data-pl-rock-form]')) { e.preventDefault(); addRock(f.elements.t.value); return; }
    if (f.matches('[data-pl-dform]')) {
      e.preventDefault();
      var el0 = f.elements, date = el0.date.value, title0 = el0.title.value.trim().slice(0, 80), subj = el0.subject.value;
      if (!title0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      var id0 = uid(), note = [el0.note ? el0.note.value.trim() : '', el0.prep && el0.prep.value.trim() ? '준비물: ' + el0.prep.value.trim() : ''].filter(Boolean).join(' / ').slice(0, 800);
      state.dates.push({ id: id0, title: title0, date: date, done: false, kind: dkind, subject: subj, note: note });
      var meta = { imp: el0.imp.value }; if (el0.est) meta.est = Number(el0.est.value);
      if (dkind === '시험' && el0.p1 && Number(el0.p1.value) && Number(el0.p2.value) >= Number(el0.p1.value)) { meta.p1 = Number(el0.p1.value); meta.p2 = Number(el0.p2.value); meta.unit = 'p.'; }
      var add0 = function (t0, d0, p0, e0) { var x0 = { id: uid(), title: t0, date: d0, done: false, kind: '과제', subject: subj, note: '' }; state.tasks.push(x0); lastIds.add(x0.id); P.pri[x0.id] = { p: p0, st: '', min: 0, est: e0 }; };
      var t0 = today(), span = Math.max(0, gap(date)), short = title0.length > 14 ? title0.slice(0, 14) + '…' : title0;
      if (dkind === '수행평가') {
        var steps = [['자료 조사', 0.15], ['초안', 0.45], ['수정', 0.75], ['제출 확인', 1]];
        steps.forEach(function (st) { var dd = addD(t0, Math.min(span, Math.round(span * st[1]))); if (st[0] === '제출 확인') dd = span >= 1 ? addD(date, -1) : date; add0('[' + subj + ' 수행] ' + short + ' — ' + st[0], dd, st[0] === '제출 확인' || meta.imp === '매우 중요' ? 'A' : 'B', meta.est || 40); });
        meta.steps = 4;
      }
      if (dkind === '과제') add0('[' + subj + ' 과제] ' + short, span >= 1 ? addD(date, -1) : date, meta.imp === '보통' ? 'B' : 'A', meta.est || 40);
      P.dmeta[id0] = meta; save(); put();
      notice(dkind === '시험' ? (meta.p1 ? '시험 범위를 하루 분량으로 나눠서 오늘 탭에 넣었어.' : '시험을 넣었어. 범위 쪽수를 넣으면 하루 분량을 나눠줘.') : dkind === '수행평가' ? '수행평가를 4단계 할 일로 나눠서 넣었어.' : '과제를 마감 전날 할 일로 넣었어.');
      render(); return;
    }
    if (f.matches('[data-pl-close]')) {
      e.preventDefault();
      var t = today(), v = { good: f.elements.good.value.trim().slice(0, 60), change: f.elements.change.value.trim().slice(0, 40), a1: f.elements.a1.value.trim().slice(0, 80) };
      P.days[t] = v; openClose = '';
      if (v.a1) {   // 내일 A1으로 등록
        var tm = addD(t, 1), ex = state.tasks.find(function (x) { return x.date === tm && x.title === v.a1; }) || state.tasks.find(function (x) { return !x.done && x.title === v.a1 && x.date <= t; });
        if (ex) ex.date = tm; else { ex = { id: uid(), title: v.a1, date: tm, done: false, kind: '과제', subject: '', note: '' }; state.tasks.push(ex); lastIds.add(ex.id); }
        P.pri[ex.id] = { p: 'A', st: '', min: (P.pri[ex.id] && P.pri[ex.id].min) || 0, first: 1 };
        save();
      }
      notice('오늘 마무리 끝! 푹 쉬어 🌙'); rerender(); return;
    }
    if (f.matches('[data-pl-set]')) {
      e.preventDefault();
      var el = f.elements, goals = [];
      for (var i = 0; i < 3; i++) {
        var title = el['g' + i + 'title'].value.trim(); if (!title) continue;
        var old = P.goals[i] || {};
        goals.push({ id: old.id || Math.random().toString(36).slice(2, 10), type: el['g' + i + 'type'].value, subject: el['g' + i + 'subject'].value, title: title.slice(0, 50), measure: el['g' + i + 'measure'].value.trim().slice(0, 30), due: el['g' + i + 'due'].value, done: old.title === title ? !!old.done : false });
      }
      P.mission = el.mission.value.trim().slice(0, 60); P.goals = goals; ['flow', 'exams', 'review', 'questions', 'reflect', 'mission'].forEach(function (k) { P.share[k] = !!(el['sh_' + k] && el['sh_' + k].checked); });
      put(); notice('플래너를 저장했어.'); return;
    }
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.check === 'tasks') { var q = pr(t.dataset.id); if (t.checked) q.doneAt = today(); else delete q.doneAt; put(); setTimeout(render, 0); }
    if (t.dataset && t.dataset.plExprep) { if (t.checked) P.examPrep[t.dataset.plExprep] = 1; else delete P.examPrep[t.dataset.plExprep]; put(); if (t.checked) notice('한 과목 마무리 끝! 👍'); setTimeout(render, 300); }
    if (t.dataset && t.dataset.plAgain) { var k = t.dataset.plAgain + '@' + t.dataset.d; if (t.checked) P.againDone[k] = 1; else delete P.againDone[k]; put(); if (t.checked) notice('다시 보기 끝! 기억이 더 오래가 🧠'); setTimeout(render, 300); }
    if (t.dataset && t.dataset.plExam) { var m = P.dmeta[t.dataset.plExam]; if (m) { if (t.checked) { m.prevProg = m.prog || m.p1 - 1; m.dFrom = m.prevProg + 1; m.dTo = Number(t.dataset.to); m.prog = m.dTo; m.doneOn = today(); notice('오늘 시험 분량 끝! 내일 이어서 나와.'); } else { m.prog = m.prevProg; delete m.doneOn; } put(); setTimeout(render, 300); } }
  });
  window.addEventListener('fc-focus-done', function (e) {
    var min = (e.detail && e.detail.min) || 25, task = cur && state.tasks.find(function (x) { return x.id === cur; });
    var fe = { date: today(), at: Date.now(), min: min, subject: task ? subjOf(task.title) : '', task: task ? task.id : '' }; if (e.detail && e.detail.partial) fe.partial = 1; P.focus.push(fe);
    if (task) pr(task.id).min = (pr(task.id).min || 0) + min;
    setTimeout(askQuality, 400);
    put();
  });
  // 할 일 추가 후 우선순위 자동 지정(제출 처리 뒤)
  document.addEventListener('submit', function (e) { if (e.target.dataset && e.target.dataset.form === 'tasks') setTimeout(function () { tagNew(); put(); render(); }, 0); });

  var css = document.createElement('style');
  css.textContent =
    '.pl-rec{max-height:86vh;overflow:auto}.pl-rec-h{margin:12px 0 6px;font-size:13px;font-weight:700;color:#5a5672}.pl-rec-subs{display:flex;flex-wrap:wrap;gap:6px}.pl-rec-subs button{min-height:36px!important;padding:4px 12px!important;font-size:14px;border-radius:999px!important}.pl-rec-subs button.on,.pl-q5 button.on{background:#2a2550!important;color:#fff!important;border-color:#2a2550!important}.pl-rec-memo{width:100%;margin-top:12px;box-sizing:border-box}.pl-rec-btns{display:flex;gap:8px;margin-top:12px}.pl-rec-btns button{flex:1}' +
    '.pl-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}.pl-head h2{margin:0!important;flex:1}.pl-count{font-size:13px;color:#8a879a;font-weight:600}' +
    '.pl-mini{min-height:34px!important;padding:4px 12px!important;font-size:13px;border-radius:999px!important;background:#f0edff!important;border:0!important;color:#5b45d6!important;font-weight:700}' +
    '.pl-list{list-style:none;margin:0;padding:0;display:grid;gap:2px}.pl-item{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0eff5}.pl-item:last-child{border-bottom:0}' +
    '.pl-pri{min-height:30px!important;min-width:40px;padding:2px 0!important;border-radius:9px!important;border:0!important;font:800 13px/1 system-ui;flex:none}.pl-pri.pA{background:#ffe4e4!important;color:#c0392b!important}.pl-pri.pB{background:#eef0ff!important;color:#4a55c7!important}.pl-pri.pC{background:#f1f1f4!important;color:#888!important}' +
    '.pl-main{flex:1;min-width:0;display:flex!important;align-items:center;gap:10px;margin:0!important;font-weight:500!important;cursor:pointer}.pl-main span{display:grid;min-width:0}.pl-main b{font-weight:600;font-size:15px;overflow-wrap:anywhere}.pl-main small{font-size:12px;color:#8a879a}.pl-main input{width:22px;min-height:22px;flex:none}' +
    '.pl-item.done .pl-main b{text-decoration:line-through;color:#aaa}.pl-item.done .pl-pri{opacity:.45}' +
    '.pl-play,.pl-more{min-height:34px!important;width:34px;padding:0!important;border-radius:50%!important;border:0!important;background:#f4f3f8!important;color:#5b45d6!important;flex:none;font-size:13px}.pl-more{color:#888!important}' +
    '.pl-acts{flex-basis:100%;display:flex;gap:6px;padding-left:48px}.pl-acts button{min-height:34px!important;padding:4px 10px!important;font-size:13px}' +
    '.pl-add{display:flex;gap:8px;margin-top:12px}.pl-add input{flex:1}.pl-add button{flex:none}.pl-legend{margin:8px 0 0;font-size:11.5px;color:#a3a0b2}' +
    '.pl-carry{display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#fff7e8;border-radius:12px;padding:8px 10px;margin-bottom:8px;font-size:13.5px}.pl-carry span{flex:1}.pl-carry button{min-height:32px!important;padding:2px 10px!important;font-size:13px}' +
    '.pl-mission{margin:0 0 10px;padding:10px 14px;border-radius:14px;background:#fff;font-size:14px;font-weight:600;color:#4a3fa0;box-shadow:0 1px 2px rgba(20,16,50,.04)}' +
    '.pl-close h2 small{font-size:12px;color:#a3a0b2;font-weight:500;margin-left:6px}.pl-close.late{box-shadow:0 0 0 2px #cfc6ff!important}.pl-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}.pl-chips button{min-height:32px!important;padding:4px 10px!important;font-size:13px;border-radius:999px!important}.pl-chips button.on{background:#5b45d6!important;color:#fff!important;border-color:#5b45d6!important}' +
    '.pl-sum{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:14px}.pl-sum b{color:#6b6880;font-weight:600;margin-right:4px}' +
    '.pl-rock-list{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:6px}.pl-rock-list li{display:flex;align-items:center;gap:10px;font-size:15px}.pl-rock-list li span{flex:1}.pl-rock-list li.done span{text-decoration:line-through;color:#999}.pl-rock-list li.no span{color:#aaa}' +
    '.pl-rock-st{min-height:32px!important;width:32px;padding:0!important;border-radius:50%!important;font-weight:800;flex:none}.pl-x{min-height:30px!important;width:30px;padding:0!important;border:0!important;background:transparent!important;color:#aaa!important}' +
    '.pl-review{background:#f6f4ff;border-radius:12px;padding:10px 12px;margin-bottom:10px;font-size:13.5px}.pl-review ul{margin-top:8px}.pl-review button{min-height:30px!important;width:34px;padding:0!important}.pl-review button.on{background:#5b45d6!important;color:#fff!important}.pl-hint{font-size:13px;color:#5b45d6;margin:0 0 8px}' +
    '.pl-stat-top h1{font-size:22px;margin:2px 0 10px;font-weight:800}.pl-big{font-size:18px;margin:0 0 12px}.pl-dots{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:12px;color:#8a879a}.pl-dot i{display:block;width:26px;height:26px;margin:0 auto 4px;border-radius:50%;background:#efedf5}.pl-dot.on i{background:#6a55e0}.pl-dot.now{color:#5b45d6;font-weight:800}.pl-dot.future i{background:#f7f6fa;border:1px dashed #dcd9e6}' +
    '.pl-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.pl-tile{background:#fff;border-radius:16px;padding:14px;display:grid;gap:2px;box-shadow:0 1px 2px rgba(20,16,50,.04)}.pl-tile span{font-size:18px}.pl-tile b{font-size:22px;font-weight:800}.pl-tile small{font-size:12px;color:#8a879a;line-height:1.4}' +
    '.pl-bar{display:grid;grid-template-columns:64px 1fr 48px;gap:8px;align-items:center;font-size:13px;margin:6px 0}.pl-bar i{height:10px;border-radius:6px;background:#8b7bf0}.pl-bar b{text-align:right;font-weight:600}' +
    '.pl-weeks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;align-items:end;text-align:center;height:120px}.pl-weeks div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px}.pl-weeks i{width:28px;border-radius:8px 8px 3px 3px;background:#c9c0ff}.pl-weeks div:last-child i{background:#6a55e0}.pl-weeks b{font-size:13px}.pl-weeks small{font-size:11px;color:#8a879a;line-height:1.3}' +
    '.pl-goals{list-style:none;margin:0;padding:0;display:grid;gap:8px}.pl-goals li{display:flex;gap:10px;align-items:center}.pl-goals span{display:grid}.pl-goals small{font-size:12px;color:#8a879a}.pl-goals li.done b{text-decoration:line-through;color:#999}' +
    '.pl-foot{font-size:12px;color:#a3a0b2;margin:4px 2px 0}' +
    '.pl-goal-form{border:1px solid #efedf5;border-radius:14px;padding:10px;margin:6px 0;display:grid;gap:6px}.pl-row{display:grid;grid-template-columns:1fr 1fr;gap:6px}.pl-switches{display:flex;gap:16px}.pl-switches label{display:flex!important;align-items:center;gap:6px;font-weight:500!important}.pl-switches input{width:20px;min-height:20px}' +
    '.pl-focus-now{background:#fff;border-radius:14px;padding:10px 14px;margin-bottom:10px;font-size:14px}.pl-back{min-height:36px!important;padding:4px 12px!important;margin-bottom:10px;font-size:13px}';
  css.textContent +=
    '.pl-hero-top{display:flex;align-items:center;gap:8px}.pl-hero-top div{flex:1;display:grid}.pl-hero-top b{font-size:17px;font-weight:800}.pl-hero-top small{font-size:12.5px;color:#7d7a8c}' +
    '.pl-loadrow{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;margin:10px 0 4px;padding:8px 10px;border-radius:12px;background:#f7f6fb;font-size:13px;color:#4a475c}.pl-loadrow small{color:#a3a0b2;margin-left:2px}.pl-lv{display:inline-flex;align-items:center;gap:2px;font-weight:700;color:#5b45d6}.pl-lv i{width:8px;height:8px;border-radius:50%;background:#dcd8ea;display:inline-block}.pl-lv i.on{background:#6a55e0}' +
    '.pl-top-h{font-size:18px!important;margin:14px 0 4px!important}.pl-auto{margin-top:6px;border-top:1px dashed #e6e3ef}.pl-tag{flex:none;min-width:40px;text-align:center;font:800 11.5px/1 system-ui;padding:8px 0;border-radius:9px;background:#fff1dc;color:#b06a00}.pl-tag.again{background:#e6f6ee;color:#1f7a55}' +
    '.pl-all{margin-top:8px}.pl-all>summary{font-size:14px!important;color:#5b45d6;min-height:36px!important;padding:6px 0!important}' +
    '.pl-acts span{font-size:12px;color:#8a879a;margin-right:2px}.pl-acts button.on{background:#5b45d6!important;color:#fff!important;border-color:#5b45d6!important}.pl-acts{flex-wrap:wrap;align-items:center}' +
    '.pl-wiz{background:linear-gradient(135deg,#f0edff,#eef7ff)!important}.pl-wiz-n{font-size:12.5px;font-weight:800;color:#5b45d6}.pl-wiz-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:6px 0 8px}.pl-wiz-bar i{height:5px;border-radius:3px;background:#dcd8ea}.pl-wiz-bar i.on{background:#6a55e0}.pl-wiz-bar i.now{background:#b7aaf5}.pl-wiz p{margin:0 0 10px}.pl-wiz-btns{display:flex;gap:8px}' +
    '.pl-again{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:-4px 0 10px 34px;font-size:12.5px;color:#8a879a}.pl-again button{min-height:30px!important;padding:2px 10px!important;font-size:12.5px;border-radius:999px!important}.pl-again button.on{background:#e6f6ee!important;color:#1f7a55!important;border-color:#bfe6d2!important}.pl-again button.dn{text-decoration:line-through}' +
    '.pl-qcard-btns{display:flex;gap:6px;margin:6px 0}.pl-qcard-btns button{min-height:34px!important;padding:4px 10px!important;font-size:13px}.pl-qbig p{font-size:22px;line-height:1.6;font-weight:700;margin:0 0 8px}' +
    '.pl-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#f1eff7;border-radius:12px;padding:4px;margin-bottom:6px}.pl-seg button{min-height:38px!important;border:0!important;background:transparent!important;font-weight:700}.pl-seg button.on{background:#fff!important;color:#5b45d6!important;box-shadow:0 1px 3px rgba(0,0,0,.08)}.pl-dform .pl-row label{margin-top:8px}' +
    '.pl-dmeta{margin:-6px 0 10px 34px;font-size:12.5px;color:#6b6880}' +
    '.pl-q5{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.pl-q5 button{display:grid;gap:2px;padding:8px 2px!important;min-height:0!important;border-radius:12px!important}.pl-q5 b{font-size:18px}.pl-q5 small{font-size:10.5px;color:#7d7a8c}' +
    '.pl-tile.empty{align-content:start}.pl-tile.empty small{font-size:12.5px;color:#6b6880}.pl-tile .pl-mini{justify-self:start;margin-top:6px}' +
    '.pl-parent ul{list-style:none;margin:0 0 10px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}.pl-parent li{background:#f7f6fb;border-radius:12px;padding:10px;font-size:13px;color:#6b6880}.pl-parent li b{display:block;font-size:20px;color:#22202e}.pl-tip{background:#fff7e8;border-radius:12px;padding:10px 12px;margin:0 0 6px;font-size:14px}';
  css.textContent += '.pl-examday{background:linear-gradient(135deg,#fff3e0,#ffe9ef)!important}.pl-ex-badge{display:inline-block;font-size:12.5px;font-weight:800;color:#b4475a;background:#fff;border-radius:999px;padding:4px 10px}.pl-examday h2{font-size:24px!important;margin:8px 0 10px!important}' +
    '.pl-ex-list{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px}.pl-ex-list li{background:#fff;border-radius:12px;padding:10px 12px;font-size:16px;font-weight:600}.pl-ex-list b{color:#b4475a;margin-right:6px;font-size:13px}' +
    '.pl-ex-tips{list-style:none;margin:6px 0 8px;padding:0;display:grid;gap:4px;font-size:13.5px;color:#5a4a55}.pl-ex-next{margin-top:8px;padding:10px 12px;background:#ffffffb3;border-radius:12px;font-size:14px}.pl-ex-btns{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}.pl-ex-btns button{min-height:36px!important;padding:4px 12px!important;font-size:13px}.pl-ex-pick{margin:8px 0}';
  css.textContent += '.hero-heal{border-radius:24px;overflow:hidden;background:linear-gradient(160deg,#f7f1ff,#fff6ee);margin:2px 0 14px;box-shadow:0 2px 10px rgba(60,40,120,.06)}' +
    '.hero-img{aspect-ratio:16/8.2;background:#e9e2ff url(cozy-study-sm.webp) center 35%/cover no-repeat}.hero-heal.night .hero-img{filter:saturate(.95) brightness(.92)}' +
    '.hero-body{padding:14px 18px 18px}.hero-tag{display:inline-block;font-size:13px;font-weight:700;color:#6a55c9;background:#efe9ff;border-radius:10px;padding:5px 10px}' +
    '.hero-title{font-size:24px;font-weight:800;margin:10px 0 8px;letter-spacing:-.02em}.hero-title small{font-size:14px;color:#8a879a;font-weight:700;margin-left:4px}' +
    '.hero-core{list-style:none;margin:0;padding:0;display:grid;gap:6px}.hero-core li{background:#ffffffc9;border-radius:12px;padding:9px 12px;font-size:15px;font-weight:600;line-height:1.4}' +
    '.hero-soft{margin:10px 2px 0;font-size:14px;color:#6b6880}.hero-go{width:100%;margin-top:12px;min-height:48px!important;font-size:15.5px;border-radius:14px!important}';
  document.head.appendChild(css);
  window.FC_PLANNER = { get: function () { return P; }, KEY: KEY, todays: todays, exams: upcomingExams, portions: examPortions, again: dueAgain, free: freeTime, planned: planned, examName: examName, examDays: function () { return P.examDays; }, nextExamDay: nextExamDay, est: function (id) { return est(P.pri[id]); }, subjOf: subjOf, todayRow: todayRow, addFocus: addFocus, save: put, subjects: subjList, ask: askQuality };
  render();   // 첫 화면에도 플래너 반영
})();
