/* 앱처럼 보이게 (2026-10-16 목업 반영)
   - 큰 제목 머리(날짜·제목·프로필) + 스크롤하면 위에 작은 제목
   - 오늘: 그림 배너 한 줄 요약 · 지금부터 3시간 시간 막대 · 할 일 그룹 목록(＋추가는 아래에서 올라오는 창) · 기억 확인 한 줄 · 시험 D-day 타일
   - 주간: 7일 날짜 줄 + 시간순 일정(토·일 포함), 기존 주간 계획은 접어서 아래
   - 엄마: 오늘의 승준에 숫자 3개, 💌 응원 버튼 → 아래에서 올라오는 응원 창
   기존 기능·데이터는 그대로 두고 화면 배치만 바꾼다. */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  var WK = ['일', '월', '화', '수', '목', '금', '토'];
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function gap(d) { return Math.round((Date.parse(d + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) / 86400000); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)); }
  function longDate(d) { return Number(d.slice(5, 7)) + '월 ' + Number(d.slice(8)) + '일 ' + WK[wd(d)] + '요일'; }
  function toMin(t) { var m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; }
  function hm(m) { m = ((m % 1440) + 1440) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function nowMin() { var k = new Date(Date.now() + 9 * 3600000); return k.getUTCHours() * 60 + k.getUTCMinutes(); }
  function dur(m) { m = Math.max(0, Math.round(m)); return m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + m % 60 + '분' : '') : m + '분'; }
  function shortExam(t) { t = String(t || ''); if (/학력평가|모의고사/.test(t)) return '학평'; return t.replace(/\(.*?\)/g, '').replace(/\s*\d학년/, '').trim().slice(0, 8); }
  function haptic() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
  function avatar(w) { return typeof FC_CHAR !== 'undefined' ? FC_CHAR.avatar(w, 40) : ''; }

  /* ---------- 큰 제목 ---------- */
  var TITLE = { today: ['오늘', '승준이 오늘'], week: ['이번 주', '이번 주 일정'], table: ['시간표', '시간표'], dates: ['시험·과제', '시험·과제'], review: ['복습', '복습'], stats: ['나의 기록', '흐름'], focus: ['집중', '집중'] };
  function sub(tb) {
    var t = today();
    if (tb === 'week') { var mon = addD(selDate, -((wd(selDate) + 6) % 7)); return md(mon) + ' ~ ' + md(addD(mon, 6)); }
    if (tb === 'review') { var n = window.FC_PLANNER && FC_PLANNER.again ? FC_PLANNER.again().length : 0; return n ? '오늘 기억 확인 ' + n + '개' : '오늘 확인할 건 다 했어'; }
    return longDate(t);
  }
  function headHTML(tb) {
    var p = isParent(), w = p ? 'parent' : 'child', ti = TITLE[tb][p ? 1 : 0];
    return '<header class="lt-head"><div class="lt-txt"><small>' + esc(sub(tb)) + '</small><h1>' + esc(ti) + '</h1></div><div class="lt-acts">' +
      (p ? '' : '<button type="button" class="lt-ic" data-kp-open-ask aria-label="엄마·아빠에게 보내기">💌</button>') +
      '<button type="button" class="lt-av" data-who aria-label="' + (p ? '엄마' : '승준') + '로 쓰는 중. 누르면 바꾸기">' + avatar(w) + '</button></div></header>';
  }
  var mini = null;
  function miniBar(title) {
    if (!mini) { mini = document.createElement('div'); mini.className = 'lt-mini'; mini.setAttribute('aria-hidden', 'true'); document.body.appendChild(mini); }
    mini.textContent = title;
  }
  window.addEventListener('scroll', function () { if (mini) mini.classList.toggle('on', window.scrollY > 70 && TITLE[tab]); }, { passive: true });

  /* ---------- 오늘: 그림 배너 ---------- */
  function banner(old) {
    var FP = window.FC_PLANNER, L = FP ? FP.todays() : [], undone = L.filter(function (x) { return !x.t.done; });
    var exN = FP && FP.examName ? FP.examName(today()) : '', ex = window.FC_BOOST ? FC_BOOST.exams()[0] : null, free = FP && FP.free ? FP.free() : 0;
    var h = Math.floor(nowMin() / 60), head;
    if (exN) head = '오늘 ' + exN + ' — 화이팅! 🍀';
    else if (undone.length) head = (h < 12 ? '좋은 아침! ' : h >= 15 && h < 19 ? '수업 끝! ' : '') + '오늘은 ' + undone.length + '개만 하면 돼';
    else if (L.length) head = '오늘 할 일 다 했어! 🎉';
    else head = '오늘 할 일 하나만 정해볼까?';
    var meta = [free ? '쓸 수 있는 시간 약 ' + dur(free) : '', ex ? shortExam(ex.title) + ' ' + (gap(ex.date) === 0 ? 'D-day' : 'D-' + gap(ex.date)) : ''].filter(Boolean).join(' · ');
    var img = old.querySelector('.hero-img'), mood = old.querySelector('.kp-mood');
    var s = document.createElement('section'); s.className = 'hero-heal hb' + (old.classList.contains('night') ? ' night' : '');
    s.innerHTML = '<div class="hb-img" role="img" aria-label="잠옷 입고 쉬는 그림"></div><div class="hb-txt"><b>' + esc(head) + '</b>' + (meta ? '<span>' + esc(meta) + '</span>' : '') + '</div>' +
      (!L.length && !exN ? '<button type="button" class="hb-add" data-as-add>＋ 할 일 적기</button>' : '');
    if (img) s.querySelector('.hb-img').style.backgroundImage = getComputedStyle(img).backgroundImage;
    if (mood) { mood.classList.add('hb-mood'); var lab = mood.querySelector('span'); if (lab && !lab.querySelector('*') && !lab.dataset.kpMood) lab.remove(); s.appendChild(mood); }
    old.replaceWith(s);
  }

  /* ---------- 오늘: 지금부터 3시간 (시간 막대) ---------- */
  function strip(card) {
    var list = card.querySelectorAll('.nx-tl > li:not(.nx-nowrow)'); var now = nowMin(), W = 180, items = [];
    list.forEach(function (li) {
      var t = li.querySelector('time'), b = li.querySelector('.nx-body b'), sub0 = li.querySelector('.nx-sub'); if (!t || !b) return;
      var s = toMin(t.textContent.trim()); if (s == null) return; if (s < now - 720) s += 1440;
      var endM = /(\d{2}:\d{2})까지/.exec(sub0 ? sub0.textContent : ''), e = endM ? toMin(endM[1]) : s + 50; if (e < s) e += 1440;
      items.push({ s: s, e: e, title: b.textContent.trim(), k: (li.className.match(/nx-(class|ac|life)/) || [])[1] || 'life', on: li.classList.contains('on') });
    });
    if (!items.length) return;
    var pos = function (m) { return Math.max(0, Math.min(100, (m - now) / W * 100)); };
    var ticks = ''; for (var m = Math.ceil((now + 1) / 60) * 60; m < now + W; m += 60) ticks += '<span class="sp-tick" style="left:' + pos(m) + '%">' + hm(m) + '</span>';
    var evs = items.map(function (x) { var l = pos(x.s), r = pos(x.e); return '<span class="sp-ev sp-' + x.k + '" style="left:' + l + '%;width:' + Math.max(9, r - l) + '%" title="' + esc(x.title) + '">' + esc(x.title) + '</span>'; }).join('');
    var html = '<div class="sp" aria-hidden="true"><div class="sp-rail"></div>' + evs + '<span class="sp-now"><em>지금 ' + hm(now) + '</em></span>' + ticks + '</div>';
    var tl = card.querySelector('.nx-tl'); tl.insertAdjacentHTML('beforebegin', html); tl.classList.add('nx-compact');
    var hd = card.querySelector('.nx-head h2'); if (hd) hd.textContent = '지금부터';
    var sm = card.querySelector('.nx-head small'); if (sm) sm.textContent = '3시간';
  }

  /* ---------- 오늘: 할 일 ---------- */
  var quickHTML = '';
  function tasks(root) {
    var card = root.querySelector('.pl-tasks'); if (!card) return;
    ['.pl-hero-top', '.pl-loadrow', '.pl-legend'].forEach(function (s) { var e = card.querySelector(s); if (e) e.remove(); });
    var h = card.querySelector('.pl-top-h'); if (h) h.outerHTML = '<div class="tk-h"><h2>오늘 할 일</h2><button type="button" class="tk-add" data-as-add>＋ 추가</button></div>';
    var again = [].slice.call(card.querySelectorAll('.pl-tag.again')).map(function (t) { return t.closest('li'); });
    if (again.length) {
      var first = again[0].querySelector('[data-rc-open]'), names = again.map(function (li) { var b = li.querySelector('b'); return b ? b.textContent : ''; }).filter(Boolean);
      var row = '<button type="button" class="tk-recall" data-rc-open="' + esc(first ? first.dataset.rcOpen : '') + '" data-d="' + esc(first ? first.dataset.d : today()) + '"><span class="tk-rn">' + again.length + '</span><span class="tk-rt"><b>🧠 기억 확인 ' + again.length + '개</b><small>' + esc(names.slice(0, 2).join(' · ') + (names.length > 2 ? ' 외' : '') + ' · 3분씩') + '</small></span><span class="tk-go">시작</span></button>';
      var ul = again[0].parentElement; again.forEach(function (li) { li.remove(); });
      if (ul && !ul.children.length) ul.remove();
      var anchorEl = card.querySelector('.pl-all') || card.querySelector('.pl-list:last-of-type') || card.querySelector('.tk-h');
      anchorEl.insertAdjacentHTML('afterend', row);
    }
    var form = root.querySelector('form.sb-quick, form[data-form="tasks"]');
    if (form) { quickHTML = form.outerHTML; var det = form.closest('details.tt-add'); (det || form).remove(); }
  }

  /* ---------- 오늘: 시험 타일 ---------- */
  function examTiles(root) {
    var box = root.querySelector('#bo-exam'); if (!box) return;
    var ex = window.FC_BOOST ? FC_BOOST.exams()[0] : null;
    var due = state.dates.filter(function (x) { return !x.done && x.kind !== '시험' && gap(x.date) >= 0; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
    if (!ex && !due) return;
    var tip = box.querySelector('.bo-tip, p:last-child'), tipTxt = tip ? tip.textContent.trim() : '';
    var tile = function (kind, n, title, d, hot) { return '<button type="button" class="et' + (hot ? ' hot' : '') + '" data-go="dates"><span class="et-k">' + kind + '</span><b class="et-n">' + (n === 0 ? 'D-day' : 'D-' + n) + '</b><span class="et-t">' + esc(title) + '</span><small>' + md(d) + ' ' + WK[wd(d)] + '</small></button>'; };
    box.innerHTML = '<div class="et-grid">' + (ex ? tile('시험', gap(ex.date), shortExam(ex.title) === '학평' ? '전국연합학력평가' : ex.title.replace(/\(.*?\)/g, ''), ex.date, gap(ex.date) <= 7) : '') +
      (due ? tile(due.kind || '마감', gap(due.date), due.title, due.date, gap(due.date) <= 2) : '') + '</div>' + (tipTxt && /^💡/.test(tipTxt) ? '<p class="et-tip">' + esc(tipTxt) + '</p>' : '');
    box.classList.add('et-box');
  }

  /* ---------- 아래에서 올라오는 창 ---------- */
  function sheet(html, cls, inContent) {
    closeSheet();
    var w = document.createElement('div'); w.className = 'as-wrap' + (cls ? ' ' + cls : ''); w.setAttribute('role', 'dialog');
    w.innerHTML = '<div class="as-sheet"><div class="as-grab"></div>' + html + '</div>';
    (inContent ? document.getElementById('content') : document.body).appendChild(w);
    w.addEventListener('click', function (e) { if (e.target === w || (e.target.closest && e.target.closest('[data-as-close]'))) closeSheet(); });
    var f = w.querySelector('input:not([type=date]),textarea'); if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
    return w;
  }
  function closeSheet() { document.querySelectorAll('.as-wrap').forEach(function (x) { x.remove(); }); }
  function addSheet() {
    if (!quickHTML) { var f = document.querySelector('form.sb-quick'); if (f) quickHTML = f.outerHTML; }
    sheet('<div class="as-top"><h2>할 일 추가</h2><button type="button" class="as-x" data-as-close aria-label="닫기">✕</button></div>' + (quickHTML || '<p class="muted">오늘 탭에서 다시 열어줘.</p>'), 'as-add');
  }
  document.addEventListener('submit', function (e) { if (e.target.closest && e.target.closest('.as-add')) setTimeout(closeSheet, 0); });
  function cheerSheet() {
    if (!isParent()) return;
    var recs = window.FC_RECALL && FC_RECALL.story ? FC_RECALL.story().recs : [];
    var often = ['오늘도 화이팅! 💪', '시험 잘 봐 🍀', '오늘 정말 수고했어 🌙', '간식 준비해둘게 🍓'];
    sheet('<div class="as-top"><h2>💌 응원 보내기</h2><button type="button" class="as-x" data-as-close aria-label="닫기">✕</button></div>' +
      (recs.length ? '<p class="as-sub">오늘 기록으로 고른 한마디</p><div class="as-chips">' + recs.map(function (r) { return '<button type="button" class="as-chip" data-pv-cheer="' + esc(r[0]) + '"><b>' + esc(r[0]) + '</b><small>' + esc(r[1]) + ' 추천했어요</small></button>'; }).join('') + '</div>' : '') +
      '<p class="as-sub">자주 쓰는 말</p><div class="as-pills">' + often.map(function (m) { return '<button type="button" data-pv-cheer="' + esc(m) + '">' + esc(m) + '</button>'; }).join('') + '</div>' +
      '<form data-pv-cheer-form class="as-form"><input name="m" maxlength="40" placeholder="직접 써서 보내기" aria-label="응원 메시지"><button class="primary">보내기</button></form>' +
      '<p class="as-note">하루 1~2번이 부담 없이 좋아요. 집중 중이면 끝난 뒤에 보여요.</p>', 'as-cheer', true);
  }
  window.addEventListener('fc-open-cheer', function () { setTimeout(cheerSheet, 120); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-as-add]'); if (b) { e.preventDefault(); addSheet(); return; }
    var c = e.target.closest && e.target.closest('.as-cheer [data-pv-cheer]'); if (c) setTimeout(closeSheet, 50);
  });
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('input[type=checkbox]')) haptic(); });
  /* ▶로 시작하면 바로 전체 화면 집중 (목업 ②) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pl-play]'); if (!b) return;
    setTimeout(function () { if (window.FC_FOCUS && state.timer && state.timer.end > Date.now()) FC_FOCUS.show(); }, 450);
  });

  /* ---------- 주간: 날짜 줄 + 일정 ---------- */
  var selDate = today();
  function dayItems(d) {
    var out = [], o = window.FC_CAL ? FC_CAL.offDay(d) : null, cfg = (window.FC_SCHOOL && FC_SCHOOL.config) || {}, per = cfg.periods || [];
    var row = (state.table[(wd(d) + 6) % 7] || []).slice(); while (row.length && !row[row.length - 1]) row.pop();
    var exS = (window.FC_PLANNER && FC_PLANNER.examDays ? FC_PLANNER.examDays()[d] : null) || [];
    if (!o && row.length && wd(d) >= 1 && wd(d) <= 5) {
      var last = toMin(per[row.length - 1]), end = last != null ? hm(last + (cfg.classMinutes || 50)) : '';
      out.push({ t: per[0] || '', k: 'cls', title: (exS.length ? '📝 시험 ' + exS.join('·') : row.filter(Boolean)[0] + ' 외 ' + (row.filter(Boolean).length - 1) + '교시'), sub: (end ? '~' + end : '') + ' · 수업 ' + row.length + '교시' });
    } else if (o && !o.weekend) out.push({ t: '종일', k: 'off', title: '🌿 ' + o.name, sub: '수업 없음' });
    (window.FC_CAL && FC_CAL.schoolEvents ? FC_CAL.schoolEvents(d) : []).forEach(function (ev) { out.push({ t: '종일', k: /고사|시험|평가/.test(ev) ? 'ex' : 'ev', title: '🏫 ' + ev, sub: '학교 일정' }); });
    state.dates.filter(function (x) { return !x.done && x.date === d; }).forEach(function (x) { out.push({ t: '종일', k: 'ex', title: '📝 ' + x.title + (x.kind === '시험' ? '' : ' 마감'), sub: [x.subject, x.kind, gap(d) >= 0 ? (gap(d) === 0 ? '오늘' : 'D-' + gap(d)) : ''].filter(Boolean).join(' · ') }); });
    (typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(d) : []).forEach(function (a) { if (a.cancelled) return; out.push({ t: a.start || '', k: 'ac', title: a.name + (a.subject ? ' · ' + a.subject : ''), sub: [a.end ? '~' + a.end : '', a.from === d ? '첫 수업' : '', a.homework && !a.hwDone ? '숙제 ' + a.homework : '', a.note || ''].filter(Boolean).join(' · '), id: a.id }); });
    (typeof FC_LIFE !== 'undefined' ? FC_LIFE.forDay(d) : []).forEach(function (x) { if (!x.start) return; out.push({ t: x.start, k: 'lf', title: (x.icon || '📌') + ' ' + x.title, sub: (x.end ? '~' + x.end + ' · ' : '') + '일상' }); });
    var tk = state.tasks.filter(function (x) { return !x.done && x.date === d; }).length;
    if (tk) out.push({ t: '', k: 'tk', title: '✅ 할 일 ' + tk + '개', sub: '' });
    var order = function (x) { return x.t === '종일' ? -1 : toMin(x.t) == null ? 9999 : toMin(x.t); };
    return out.sort(function (a, b) { return order(a) - order(b); });
  }
  function dots(d) {
    var it = dayItems(d), s = '';
    if (it.some(function (x) { return x.k === 'ac' || x.k === 'lf'; })) s += '<u></u>';
    if (it.some(function (x) { return x.k === 'ex'; })) s += '<u class="r"></u>';
    return s;
  }
  function agenda(d) {
    var it = dayItems(d), lab = (d === today() ? '오늘 · ' : gap(d) === 1 ? '내일 · ' : '') + longDate(d);
    return '<p class="ag-day">' + esc(lab) + '</p>' + (it.length ? it.map(function (x) {
      return '<div class="ag"><time>' + esc(x.t === '종일' ? '종일' : x.t || '') + '</time><div class="ag-e ag-' + x.k + '"><b>' + esc(x.title) + '</b>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '') +
        (x.k === 'ac' && x.id ? '<button type="button" class="nx-map ag-map" data-nx-map="' + esc(x.id) + '"><span class="nx-n" aria-hidden="true">N</span>네이버 지도 길찾기</button>' : '') + '</div></div>';
    }).join('') : '<p class="ag-none">일정 없음 · 🌿 쉬는 시간</p>');
  }
  function weekView(root) {
    var mon = addD(selDate, -((wd(selDate) + 6) % 7)), t = today();
    var days = [0, 1, 2, 3, 4, 5, 6].map(function (i) { var d = addD(mon, i); return '<button type="button" class="wd' + (d === selDate ? ' sel' : '') + (d === t ? ' now' : '') + (i >= 5 ? ' we' : '') + '" data-wk-day="' + d + '"><span>' + WK[wd(d)] + '</span><b>' + Number(d.slice(8)) + '</b><i>' + dots(d) + '</i></button>'; }).join('');
    var old = [].slice.call(root.children);
    var wrap = document.createElement('div'); wrap.className = 'wk-app';
    wrap.innerHTML = '<div class="wk-nav2"><button type="button" data-wk-shift="-7" aria-label="이전 주">‹</button><button type="button" data-wk-today' + (selDate === t ? ' disabled' : '') + '>오늘</button><button type="button" data-wk-shift="7" aria-label="다음 주">›</button></div>' +
      '<div class="wd-row">' + days + '</div><div class="seg2"><button type="button" class="on">일정</button><button type="button" data-go="table">시간표</button></div>' +
      '<div class="ag-list">' + agenda(selDate) + agenda(addD(selDate, 1)) + '</div>';
    root.insertAdjacentElement('afterbegin', wrap);
    if (old.length) {
      var det = document.createElement('details'); det.className = 'more-cards wk-old'; det.innerHTML = '<summary><b>📋 주간 계획 · 저녁 예습</b><small>요일별 수업·예습·이번 주 큰 돌</small></summary><div class="more-in"></div>';
      var box = det.querySelector('.more-in'); old.forEach(function (el) { box.appendChild(el); }); wrap.insertAdjacentElement('afterend', det);
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-wk-day],[data-wk-shift],[data-wk-today]'); if (!b) return;
    if (b.dataset.wkDay) selDate = b.dataset.wkDay; else if (b.dataset.wkShift) selDate = addD(selDate, Number(b.dataset.wkShift)); else selDate = today();
    haptic(); render();
  });

  /* ---------- 엄마: 오늘의 승준 숫자 ---------- */
  function momStats(root) {
    var st = root.querySelector('.pv-story'); if (!st || st.querySelector('.ms-row')) return;
    var FP = window.FC_PLANNER, P = FP ? FP.get() : {}, share = P.share || {}, L = FP ? FP.todays() : [], done = L.filter(function (x) { return x.t.done; }).length;
    var fmin = (P.focus || []).filter(function (f) { return f.date === today(); }).reduce(function (s, f) { return s + (f.min || 0); }, 0);
    var ex = window.FC_BOOST ? FC_BOOST.exams()[0] : null;
    var cells = [[L.length ? done + '/' + L.length : '–', '할 일'], [share.flow ? (fmin ? fmin + '분' : '–') : '비공개', '집중'], [ex ? (gap(ex.date) === 0 ? 'D-day' : 'D-' + gap(ex.date)) : '–', ex ? shortExam(ex.title) : '시험']];
    var ul = st.querySelector('.pv-story-l');
    (ul || st.querySelector('h2')).insertAdjacentHTML('afterend', '<div class="ms-row">' + cells.map(function (c) { return '<div><b>' + esc(c[0]) + '</b><small>' + esc(c[1]) + '</small></div>'; }).join('') + '</div>');
  }

  /* ---------- 시험·과제: 목록 먼저, 넣는 칸은 접기 ---------- */
  var datesOpen = false;
  function datesTidy(root) {
    var form = null, list = null;
    root.querySelectorAll('section.card, .card').forEach(function (c) { var h = c.querySelector('h2'); if (!h) return; if (!form && /시험·과제 넣기/.test(h.textContent)) form = c; if (!list && /다가오는 일정/.test(h.textContent)) list = c; });
    if (!form || form.closest('details.dt-add')) return;
    var has = state.dates.some(function (x) { return !x.done; });
    var d = document.createElement('details'); d.className = 'dt-add'; if (datesOpen || !has) d.open = true;
    d.innerHTML = '<summary>＋ 시험·과제 넣기</summary>';
    form.parentNode.insertBefore(d, form); d.appendChild(form);
    if (list) list.insertAdjacentElement('afterend', d);
    d.addEventListener('toggle', function () { datesOpen = d.open; });
  }

  /* ---------- 흰둥이 버튼: 내릴 때는 옆으로 비켜주기 ---------- */
  var lastY = 0;
  window.addEventListener('scroll', function () { var y = window.scrollY; document.body.classList.toggle('scroll-down', y > lastY + 4 && y > 120); if (y < lastY - 4) document.body.classList.remove('scroll-down'); lastY = y; }, { passive: true });

  /* ---------- 연결 ---------- */
  var prev = render;
  render = function () {
    prev();
    document.body.classList.toggle('is-parent', isParent());
    var root = document.getElementById('content'); if (!root || !TITLE[tab]) { if (mini) mini.classList.remove('on'); return; }
    if (tab === 'week') weekView(root);
    if (tab === 'today' && !isParent()) {
      var hero = root.querySelector('.hero-heal'); if (hero && !hero.classList.contains('hb')) banner(hero);
      var nx = root.querySelector('#nx-3h'); if (nx && !nx.querySelector('.sp')) strip(nx);
      tasks(root); examTiles(root);
      var br = root.querySelector('#study-brief'); if (br) br.remove();   // 마감은 시험 타일·할 일에 이미 보임
      var after = root.querySelector('#nx-3h') || root.querySelector('.hb');
      ['.pl-tasks', '#bo-exam'].forEach(function (sel) { var el = root.querySelector(sel); if (el && after) { after.insertAdjacentElement('afterend', el); after = el; } });
    }
    if (tab === 'stats') { var sh1 = root.querySelector('.pl-stat-top h1'); if (sh1) sh1.remove(); }
    if (tab === 'dates') datesTidy(root);
    if (tab === 'today' && isParent()) { var ph = root.querySelector('.pv-head'); if (ph) ph.remove(); momStats(root); }
    var old = root.querySelector('.lt-head'); if (old) old.remove();
    root.insertAdjacentHTML('afterbegin', headHTML(tab));
    miniBar(TITLE[tab][isParent() ? 1 : 0]);
  };

  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'app-ui.css'; document.head.appendChild(css);
  render();
})();
