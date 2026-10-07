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
    p.share = p.share && typeof p.share === 'object' ? p.share : { mission: false, reflect: false };
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
  var openMore = '';
  function tasksCard() {
    var L = todays(), od = overdue(), doneN = L.filter(function (x) { return x.t.done; }).length;
    var html = '<div class="pl-head"><h2>오늘 할 일</h2><span class="pl-count">' + (L.length ? doneN + '/' + L.length : '') + '</span><button type="button" class="pl-mini" data-go="focus">⏱ 집중</button></div>';
    if (od.length) html += '<div class="pl-carry"><span>지난 할 일 ' + od.length + '개, 오늘로 가져올까?</span><button type="button" data-pl-carry="all">가져오기</button><button type="button" data-pl-carry="no">괜찮아</button></div>';
    html += L.length ? '<ul class="pl-list">' + L.map(function (x) {
      var id = esc(x.t.id), sub = subjOf(x.t.title), meta = [sub, x.q.min ? x.q.min + '분 집중' : ''].filter(Boolean).join(' · ');
      return '<li class="pl-item' + (x.t.done ? ' done' : '') + '"><button type="button" class="pl-pri p' + x.q.p + '" data-pl-pri="' + id + '" aria-label="우선순위 ' + x.q.p + ', 눌러서 바꾸기">' + x.label + '</button>' +
        '<label class="pl-main"><input type="checkbox" data-check="tasks" data-id="' + id + '" ' + (x.t.done ? 'checked' : '') + '><span><b>' + esc(x.t.title) + '</b>' + (meta ? '<small>' + esc(meta) + '</small>' : '') + '</span></label>' +
        (x.t.done ? '' : '<button type="button" class="pl-play" data-pl-play="' + id + '" aria-label="집중 시작">▶</button>') +
        '<button type="button" class="pl-more" data-pl-more="' + id + '" aria-label="더보기">⋯</button>' +
        (openMore === x.t.id ? '<div class="pl-acts"><button type="button" data-pl-later="' + id + '">내일로 →</button><button type="button" data-pl-no="' + id + '">안 함 ✕</button><button type="button" data-remove="tasks" data-id="' + id + '">지우기</button></div>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="muted">할 일을 적고, 제일 중요한 건 A로 바꿔줘.</p>';
    html += '<form data-form="tasks" class="pl-add"><input name="title" required maxlength="120" placeholder="할 일 추가 (예: 수학 유형 3~5)" aria-label="할 일"><button class="primary" aria-label="추가">추가</button></form>';
    html += '<p class="pl-legend">A 꼭 · B 하면 좋음 · C 여유 있으면 — 칩을 누르면 바뀌어</p>';
    return html;
  }
  /* 새 할 일: A가 없으면 A, 아니면 B */
  var lastIds = new Set(state.tasks.map(function (x) { return x.id; }));
  function tagNew() {
    var t = today(), hasA = state.tasks.some(function (x) { return x.date === t && P.pri[x.id] && P.pri[x.id].p === 'A' && !x.done; });
    state.tasks.forEach(function (x) { if (!lastIds.has(x.id)) { if (!P.pri[x.id]) P.pri[x.id] = { p: hasA ? 'B' : 'A', st: '', min: 0 }; hasA = true; } });
    lastIds = new Set(state.tasks.map(function (x) { return x.id; }));
  }

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
    var head = dayN ? '이번 주 <b>' + dayN + '일</b> 공부했어' + (dayN >= 5 ? ' 🔥' : dayN >= 3 ? ' 💪' : ' 👍') : '새 주 시작! 첫 기록을 남겨볼까';
    var html = '<div class="pl-stat-top"><h1>' + (parent ? '승준이 공부 기록' : '나의 공부 기록') + '</h1>' + missionLine() + '</div>' +
      '<section class="card"><p class="pl-big">' + head + '</p><div class="pl-dots">' + dots + '</div></section>' +
      '<div class="pl-tiles">' +
        tile('🎯', att.length ? alone + '개' : '—', att.length ? '오답 ' + att.length + '개 중 혼자 다시 맞힘' : '오답 재도전을 하면 여기 쌓여') +
        tile('🗣️', explain + '개', '내 말로 설명한 복습') +
        tile('🥇', aDone + '개', 'A 할 일 해냄 (전체 ' + doneW.length + '개)') +
        tile('⏱', fmin ? fmin + '분' : '—', fmin ? '집중 타이머로 공부' : '할 일 옆 ▶로 시작해봐') +
      '</div>';
    if (subs.length) html += '<section class="card"><h2>과목별 집중</h2>' + subs.map(function (k) { return '<div class="pl-bar"><span>' + esc(k) + '</span><i style="width:' + Math.max(6, Math.round(bySub[k] / maxS * 100)) + '%"></i><b>' + bySub[k] + '분</b></div>'; }).join('') + '</section>';
    html += '<section class="card"><h2>4주 흐름</h2><div class="pl-weeks">' + weeks.map(function (w) { return '<div><i style="height:' + Math.max(4, w.n / 7 * 64) + 'px"></i><b>' + w.n + '일</b><small>' + w.label + (w.m ? '<br>' + w.m + '분' : '') + '</small></div>'; }).join('') + '</div></section>';
    html += '<section class="card"><div class="pl-head"><h2>이번 학기 목표</h2>' + (parent ? '' : '<button type="button" class="pl-mini" data-pl-goals>설정</button>') + '</div>' + (P.goals.length ? '<ul class="pl-goals">' + P.goals.map(function (g) {
      return '<li class="' + (g.done ? 'done' : '') + '"><button type="button" class="pl-rock-st" data-pl-goal="' + esc(g.id) + '"' + (parent ? ' disabled' : '') + '>' + (g.done ? '✓' : '○') + '</button><span><b>' + esc(g.title) + '</b><small>' + esc([g.type, g.subject, g.measure, g.due ? '~' + md(g.due) : ''].filter(Boolean).join(' · ')) + '</small></span></li>';
    }).join('') + '</ul>' : '<p class="muted">' + (parent ? '아직 정한 목표가 없어.' : '⚙️ 설정 → 플래너에서 학기 목표를 3개까지 정할 수 있어.') + '</p>') + '</section>';
    if (!parent) {
      var nextHint = subs.length ? '' : '';
      html += '<p class="pl-foot">엄마도 이 기록을 같이 봐. 다짐·하루 마무리는 설정에서 \'엄마에게 보이기\'를 켠 것만 보여.' + nextHint + '</p>';
    }
    return html;
  }
  function tile(i, v, l) { return '<div class="pl-tile"><span>' + i + '</span><b>' + v + '</b><small>' + l + '</small></div>'; }

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
      '<label>엄마에게 보이기</label><div class="pl-switches"><label><input type="checkbox" name="shMission"' + (P.share.mission ? ' checked' : '') + '> 나의 다짐</label><label><input type="checkbox" name="shReflect"' + (P.share.reflect ? ' checked' : '') + '> 하루 마무리</label></div>' +
      '<p class="muted small">공부 기록(공부한 날·오답·집중 시간)은 엄마도 같이 봐.</p>' +
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
    if (tab === 'settings') {
      var fam = document.getElementById('set-profile'); if (fam) fam.insertAdjacentHTML('beforebegin', settingsCard());
      var nav = document.querySelector('.set-jump'); if (nav && !nav.querySelector('[data-jump="set-planner"]')) nav.insertAdjacentHTML('afterbegin', '<a href="#set-planner" data-jump="set-planner">플래너</a>');
      if (jumpTo) { var j = document.getElementById(jumpTo); jumpTo = ''; if (j) setTimeout(function () { window.scrollTo({ top: j.getBoundingClientRect().top + window.scrollY - 64 }); }, 30); }
    }
  };
  var jumpTo = '';
  function enhanceToday() {
    var root = document.getElementById('content');
    var form = root.querySelector('form[data-form="tasks"]'), card = form && form.closest('section');
    if (card) {
      card.className = 'card pl-tasks'; card.innerHTML = tasksCard();
      var strip = root.querySelector('#school-today'); if (strip) strip.insertAdjacentElement('afterend', card); else root.insertAdjacentElement('afterbegin', card);   // 할 일이 맨 위(중요한 것 먼저)
      var nc = root.querySelector('.next-card'); if (nc && todays().length) nc.remove();   // 할 일이 있으면 '오늘은 이 3개부터'는 겹쳐서 숨김
    }
    root.querySelectorAll('details').forEach(function (d) { var sm = d.querySelector('summary'); if (sm && /최근 7일/.test(sm.textContent)) d.remove(); });   // 기록 탭으로 옮김
    var m = missionLine(); if (m) root.insertAdjacentHTML('afterbegin', m);
    var rc = root.querySelector('.rt-card'), cc = closeCard();
    if (cc) { if (rc) rc.insertAdjacentHTML('beforebegin', cc); else root.insertAdjacentHTML('beforeend', cc); }
  }
  function enhanceFocus() {
    var c = cur && state.tasks.find(function (x) { return x.id === cur; });
    var root = document.getElementById('content');
    root.insertAdjacentHTML('afterbegin', '<div class="pl-focus-now">' + (c ? '지금 집중: <b>' + esc(c.title) + '</b> <button type="button" class="linkish" data-pl-unfocus>바꾸기</button>' : '오늘 할 일 옆 ▶를 누르면 그 일에 시간이 쌓여.') + '</div><button type="button" class="pl-back" data-go="today">← 오늘로</button>');
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
      P.mission = el.mission.value.trim().slice(0, 60); P.goals = goals; P.share = { mission: el.shMission.checked, reflect: el.shReflect.checked };
      put(); notice('플래너를 저장했어.'); return;
    }
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.check === 'tasks') { var q = pr(t.dataset.id); if (t.checked) q.doneAt = today(); else delete q.doneAt; put(); setTimeout(render, 0); }
  });
  window.addEventListener('fc-focus-done', function (e) {
    var min = (e.detail && e.detail.min) || 25, task = cur && state.tasks.find(function (x) { return x.id === cur; });
    P.focus.push({ date: today(), min: min, subject: task ? subjOf(task.title) : '', task: task ? task.id : '' });
    if (task) pr(task.id).min = (pr(task.id).min || 0) + min;
    put();
  });
  // 할 일 추가 후 우선순위 자동 지정(제출 처리 뒤)
  document.addEventListener('submit', function (e) { if (e.target.dataset && e.target.dataset.form === 'tasks') setTimeout(function () { tagNew(); put(); render(); }, 0); });

  var css = document.createElement('style');
  css.textContent =
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
  document.head.appendChild(css);
  window.FC_PLANNER = { get: function () { return P; }, KEY: KEY };
  render();   // 첫 화면에도 플래너 반영
})();
