/* 오늘 탭: 오늘 날짜의 할 일·복습·일정만. 주간 계획과 예습은 주간으로 이동한다. */
(function (g) {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function') return;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function planner() { return g.FC_PLANNER ? g.FC_PLANNER.get() : {}; }
  function can(kind, parent, p) {
    var share = p.share || {};
    return !parent || (kind === 'flow' || kind === 'exams' ? share[kind] !== false : share[kind] === true);
  }
  function addDay(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function nextMonday(d) { return addDay(d, 7 - ((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7)); }
  function model(opts) {
    opts = opts || {};
    var d = opts.date || today(), parent = opts.parent == null ? isParent() : opts.parent;
    var p = planner(), pri = p.pri || {}, rank = { A: 0, B: 1, C: 2 };
    var flow = can('flow', parent, p), exams = can('exams', parent, p), review = can('review', parent, p);
    var tasks = flow ? (state.tasks || []).filter(function (x) { return x.date === d && (pri[x.id] || {}).st !== 'no'; }).slice() : [];
    tasks.sort(function (a, b) { return Number(a.done) - Number(b.done) || (rank[(pri[a.id] || {}).p] ?? 1) - (rank[(pri[b.id] || {}).p] ?? 1); });
    var left = tasks.filter(function (x) { return !x.done; });
    var due = review ? (state.reviews || []).filter(function (r) { return !r.done && (p.again && p.again[r.id] || []).includes(d) && !(p.againDone || {})[r.id + '@' + d]; }) : [];
    var schedule = g.FC_WEEK ? g.FC_WEEK.items(d, { exams: exams, flow: flow }).filter(function (x) { return x.k !== 'tk' && (exams || x.k !== 'ex'); }) : [];
    // 다른 날 계획한 일이라도 제출일이 오늘이면 '오늘 마감'에 표시한다.
    if (flow && exams) (state.tasks || []).forEach(function (x) {
      var q = pri[x.id] || {};
      if (!x.done && q.st !== 'no' && q.due === d) schedule.push({ t: '종일', k: 'ex', title: x.title, sub: '오늘 마감' });
    });
    schedule.sort(function (a, b) { return String(a.t === '종일' ? '00:00' : a.t || '99:99').localeCompare(String(b.t === '종일' ? '00:00' : b.t || '99:99')); });
    return { date: d, parent: parent, flow: flow, review: review, tasks: tasks, left: left, due: due, schedule: schedule, nextMonday: nextMonday(d) };
  }
  function taskRows(list, parent) {
    return '<ul class="tf-tasks">' + list.map(function (x) {
      var title = '<span><b>' + esc(x.title) + '</b>' + (x.subject ? '<small>' + esc(x.subject) + '</small>' : '') + '</span>';
      return '<li class="' + (x.done ? 'is-done' : '') + '">' + (parent ? '<div class="tf-task"><span aria-label="' + (x.done ? '완료' : '미완료') + '">' + (x.done ? '✓' : '○') + '</span>' + title + '</div>' :
        '<label class="tf-task"><input type="checkbox" data-check="tasks" data-id="' + esc(x.id) + '"' + (x.done ? ' checked' : '') + '>' + title + '</label>') +
        (!parent && !x.done ? '<button type="button" class="tf-play" data-pl-play="' + esc(x.id) + '" aria-label="' + esc(x.title) + ' 집중 시작">▶</button>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function agendaRows(list) {
    return '<ul class="tf-agenda">' + list.map(function (x) {
      return '<li><time>' + esc(x.t || '종일') + '</time><span><b>' + esc(x.title) + '</b>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function tasksCard(m) {
    var h = '<section class="card tf-card tf-work" aria-labelledby="tf-work-title"><div class="tf-heading"><h2 id="tf-work-title">오늘 할 일</h2>' +
      (m.parent ? '' : '<button type="button" class="tf-link" data-as-add>＋ 추가</button>') + '</div>';
    if (!m.flow) h += '<p class="tf-empty">승준이가 공부 흐름을 공개하면 보여요.</p>';
    else {
      h += '<p class="tf-status">' + (m.left.length ? '<b>' + m.left.length + '개</b> 남음' : m.tasks.length ? '오늘 할 일 완료 ✓' : '오늘 정해 둔 할 일이 없어.') + '</p>';
      h += taskRows(m.left.slice(0, 3), m.parent);
      if (m.tasks.length > Math.min(3, m.left.length)) h += '<details class="tf-more" data-tf-more="tasks"' + (open.tasks ? ' open' : '') + '><summary>오늘 할 일 모두 보기 (' + m.tasks.length + '개)</summary>' + taskRows(m.tasks.slice(Math.min(3, m.left.length)), m.parent) + '</details>';
    }
    if (m.review) h += '<div class="tf-recall"><span>오늘 복습 <b>' + m.due.length + '개</b></span>' +
      (m.due.length && !m.parent ? '<button type="button" class="tf-link" data-rc-open="' + esc(m.due[0].id) + '" data-d="' + m.date + '">기억 확인 ›</button>' : '<small>' + (m.due.length ? '오늘 확인할 차례예요.' : '오늘 예정된 복습 완료') + '</small>') + '</div>';
    return h + '</section>';
  }
  function scheduleCard(m) {
    return '<section class="card tf-card tf-plan" aria-labelledby="tf-plan-title"><div class="tf-heading"><h2 id="tf-plan-title">오늘 일정</h2><span class="tf-count">' + m.schedule.length + '개</span></div>' +
      (m.schedule.length ? agendaRows(m.schedule.slice(0, 3)) + (m.schedule.length > 3 ? '<details class="tf-more" data-tf-more="schedule"' + (open.schedule ? ' open' : '') + '><summary>오늘 일정 ' + (m.schedule.length - 3) + '개 더 보기</summary>' + agendaRows(m.schedule.slice(3)) + '</details>' : '') : '<p class="tf-empty">등록된 오늘 일정이 없어. 여유롭게 보내자.</p>') + '</section>';
  }
  function recordCard(m) {
    if (m.parent) return '<section class="card tf-card tf-record"><div><h2>오늘 한마디</h2><p>오늘 수고한 승준이에게 응원을 보내요.</p></div><button type="button" class="tf-link" data-tf-cheer>응원 보내기 ›</button></section>';
    return '<section class="card tf-card tf-record"><div><h2>오늘 배운 것 남기기</h2><p>사진만, 녹음만, 둘 다 가능해.</p></div><div class="tf-record-actions"><button type="button" data-tn-open="talk">🎙️ 1분 말하기</button><button type="button" data-tn-open="photo">📷 사진 촬영·선택</button></div></section>';
  }
  var open = {}, openDate = '';
  var prev = render;
  render = function () {
    if (tab === 'family' && !isParent()) { tab = 'today'; history.replaceState(null, '', '#today'); }
    prev();
    var root = document.getElementById('content'); if (!root) return;
    root.classList.toggle('today-focused', tab === 'today');
    if (tab !== 'today') return;
    var m = model();
    if (openDate !== m.date) { open = {}; openDate = m.date; }
    var head = root.querySelector('.lt-head'), cheer = root.querySelector('.pv-cheer-line');
    root.innerHTML = '<div class="tf-layout">' + tasksCard(m) + scheduleCard(m) + recordCard(m) +
      '<footer class="tf-footer"><button type="button" class="tf-week" data-tf-next-week>다음 주 일정 보기 <span aria-hidden="true">→</span></button>' +
      '<div class="tf-footer-links"><button type="button" class="tf-link" data-go="week">주간 계획·예습</button><button type="button" class="tf-link" data-go="' + (m.parent ? 'family' : 'dash') + '">' + (m.parent ? '가족 공유·엄마 체크' : '한눈에 보기') + '</button></div></footer></div>';
    if (head) root.prepend(head);
    // 응원은 오늘 도착한 한 줄만 유지한다. 다른 안내·다음 날 카드는 넣지 않는다.
    if (cheer) {
      var close = cheer.querySelector('[data-pv-seen]'), at = close && Number(close.dataset.pvSeen);
      if (at && new Date(at + 9 * 3600000).toISOString().slice(0, 10) === m.date) root.querySelector('.tf-work').prepend(cheer);
    }
  };
  document.addEventListener('toggle', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.tfMore) open[el.dataset.tfMore] = el.open;
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tf-next-week],[data-tf-cheer]'); if (!b) return;
    if (b.hasAttribute('data-tf-next-week') && g.FC_WEEK) g.FC_WEEK.open(nextMonday(today()));
    if (b.hasAttribute('data-tf-cheer') && isParent()) g.dispatchEvent(new Event('fc-open-cheer'));
  });
  g.FC_TODAY_FOCUS = { model: model, nextMonday: nextMonday };
  render();
})(window);
