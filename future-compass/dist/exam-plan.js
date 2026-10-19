/* 📅 기말 플랜 자동 생성 (study.html#examplan) — 2026-10-19
   재료: 나이스 학사일정(기말 시작일) · 학교알리미 평가계획(지필 과목·반영 비율·진도표) · 가정통신문 시험 범위(있으면 우선)
        · 내신 계산기 목표(필요 점수가 높은 과목에 한 칸 더) · 시험 기간 과목 순서(플래너에 넣은 경우)
   방식: 시험 N주 전부터 하루 가능한 칸(평일/주말) 안에서
        ① 범위 1회독(단원별) → ② 문제 풀이 → ③ 오답·요약 순서로, 과목을 번갈아 배치(같은 날 같은 과목은 2칸까지)
        시험 전날에는 다음 날 시험 과목 마무리.
   결과는 [할 일로 넣기]로 날짜별 오늘 할 일에 들어간다. 범위는 진도표로 추정한 것이라 공지가 나오면 다시 짠다. */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function' || typeof tabs === 'undefined') return;
  tabs.examplan = '📅 기말 플랜';
  var TAG = '📚 기말 · ';
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function addDay(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function dd(d) { return Math.round((Date.parse(d + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) / 864e5); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)) + '(' + '일월화수목금토'[wd(d)] + ')'; }
  function GR() { return window.FC_GRADES ? FC_GRADES.get() : { ep: {} }; }
  function opts() { var g = GR(), o = g.ep || {}; return { weeks: o.weeks || 2, wd: o.wd || 2, we: o.we || 4 }; }
  function setOpt(k, v) { if (!window.FC_GRADES) return; var g = FC_GRADES.get(); g.ep = g.ep || {}; g.ep[k] = v; FC_GRADES.put(g); }
  function live() { return window.FC_SCHOOL_LIVE ? FC_SCHOOL_LIVE.data() : null; }
  function finalDays() {
    var ex = window.FC_BOOST ? FC_BOOST.exams() : [], f = ex.find(function (x) { return /기말/.test(x.title); }); if (!f) return null;
    var days = [], d = f.date; for (var i = 0; i < 10; i++) { var t = addDay(f.date, i), ev = window.FC_CAL ? FC_CAL.schoolEvents(t) : []; if (ev.some(function (x) { return /기말/.test(x); })) { if (wd(t) !== 0 && wd(t) !== 6) days.push(t); d = t; } else if (i > 0) break; }
    return { start: f.date, end: d, days: days, title: f.title.replace(/\(.*?\)/, '') };
  }

  /* ---------- 과목별 기말 범위 (공지 > 진도표 추정) ---------- */
  function order(m) { return m >= 8 ? m - 8 : m + 4; }
  function wk(s) { var m = /(\d)/.exec(String(s || '')); return m ? Number(m[1]) : 1; }
  var JUNK = /고사|연휴|오리엔테이션|복습|종합 ?정리|정리 및|수행평가|체험|축제/;
  function clean(u) { return String(u || '').replace(/\s+/g, ' ').replace(/^[ⅠⅡⅢⅣⅤIVX]+\.\s*[^0-9(]*?(?=\s\d+\.|\s\(\d)/, '').trim().slice(0, 44); }
  function scopeOf(s) {
    var off = officialScope(s.subject);
    if (off) { var segs0 = []; off.text.split('\n').forEach(function (ln) { if (!segs0.length || /^[^:：]{1,10}[:：]/.test(ln)) segs0.push(ln); else segs0[segs0.length - 1] += ' ' + ln; }); return { src: 'notice', units: segs0.map(function (x) { return x.slice(0, 60); }).slice(0, 8), text: off.text, off: off }; }
    var tl = s.timeline || [], segs = [], cur = [];
    tl.forEach(function (x, i) { if (i && order(x.m) < order(tl[i - 1].m)) { segs.push(cur); cur = []; } cur.push(x); }); if (cur.length) segs.push(cur);
    var units = [];
    segs.forEach(function (sg) {
      var mi = -1, fi = sg.length; sg.forEach(function (x, i) { if (x.exam && /중간/.test(x.unit) && mi < 0) mi = i; if (x.exam && /기말/.test(x.unit) && fi === sg.length) fi = i; });
      sg.forEach(function (x, i) {
        if (x.exam || JUNK.test(x.unit) || i >= fi) return;
        var after = mi >= 0 ? i > mi : (order(x.m) > order(10) || (x.m === 10 && wk(x.w) >= 3));
        var before = order(x.m) < order(12) || (x.m === 12 && wk(x.w) <= 1);
        if (after && before) { var u = clean(x.unit); if (u && units.indexOf(u) < 0) units.push(u); }
      });
    });
    return { src: 'plan', units: units.slice(0, 8) };
  }
  function nm(x) { return String(x || '').replace(/\s/g, '').replace(/\d$/, ''); }
  function finInfo() { var D = live(); return D && D.exams && D.exams.fin ? D.exams.fin : null; }
  function officialScope(name) { var f = finInfo(), S = f && f.scope && f.scope.subjects; if (!S) return null; var k = Object.keys(S).find(function (x) { return nm(x) === nm(name); }); return k ? S[k] : null; }
  function subjects() {
    var L = window.FC_GRADES ? FC_GRADES.subjects() : null; if (!L) return null;
    return L.filter(function (s) { return s.ratio && s.ratio.exam; }).map(function (s) {
      var g = window.FC_GRADES.get(), c = FC_GRADES.calc(s, g), sc = scopeOf(s);
      return { s: s, name: s.subject, w: s.ratio.fin || s.ratio.exam, need: c.need, scope: sc };
    });
  }

  /* ---------- 계획 짜기 ---------- */
  function build() {
    var F = finalDays(), S = subjects(), o = opts(); if (!F || !S || !S.length) return null;
    var P = window.FC_PLANNER ? FC_PLANNER.get() : {}, exOrder = {};   // 시험 과목 순서 (플래너에 넣었으면)
    var fi = finInfo(); if (fi && fi.days) Object.keys(fi.days).forEach(function (d) { fi.days[d].forEach(function (x) { S.forEach(function (q) { if (nm(q.name) === nm(x)) exOrder[q.name] = d; }); }); });   // 학교 시험 시간표 가정통신문
    Object.keys(P.examDays || {}).forEach(function (d) { (P.examDays[d] || []).forEach(function (x) { S.forEach(function (q) { if (x && (q.name.indexOf(x) >= 0 || x.indexOf(q.name.replace(/\d$/, '')) >= 0)) exOrder[q.name] = d; }); }); });
    var start = addDay(F.start, -7 * o.weeks); if (start < today()) start = today();
    var days = []; for (var d = start; d < F.start; d = addDay(d, 1)) days.push(d);
    /* 과목별 할 일 큐: 1회독(단원) + 문제 + 오답·요약 (+ 필요 점수 높으면 문제 1칸 더) */
    function chunk(u, k) { var out = [], n = u.length; for (var i = 0; i < k; i++) { var g = u.slice(Math.round(i * n / k), Math.round((i + 1) * n / k)); if (g.length) out.push(g.length > 1 ? g[0] + ' 외 ' + (g.length - 1) + '단원' : g[0]); } return out; }
    var Q = S.map(function (q) {
      var u = q.scope.units.length ? q.scope.units : ['교과서·노트 전체'], extra = [{ k: '문제', t: '기출·학습지 문제 풀기' }];
      if (q.need > 85 || q.w >= 50) extra.push({ k: '문제', t: '어려운 단원 문제 한 번 더' });
      extra.push({ k: '오답', t: '오답·핵심 요약 정리' });
      return { q: q, u: u, k: u.length, extra: extra, used: 0 };
    });
    function mk(x) { x.list = chunk(x.u, x.k).map(function (t) { return { k: '1회독', t: t }; }).concat(x.extra); }
    Q.forEach(mk);
    /* 학원 가는 날은 1칸 덜 (감수 ②-1) */
    var acad = 0, cap = days.map(function (d) { var we = wd(d) === 0 || wd(d) === 6, n = we ? o.we : o.wd; var ac = typeof FC_ACADEMY !== 'undefined' && FC_ACADEMY.forDay ? FC_ACADEMY.forDay(d).length : 0; if (ac && n > 1) { n -= 1; acad++; } return n; }), totalCap = cap.reduce(function (a, b) { return a + b; }, 0);
    var need = Q.reduce(function (a, x) { return a + x.list.length; }, 0), merged = false;
    /* 칸이 모자라면 단원이 많은 과목부터 1회독 단원을 묶는다 */
    while (need > totalCap) {
      var big = Q.filter(function (x) { return x.k > 1; }).sort(function (a, b) { return b.k - a.k; })[0]; if (!big) break;
      big.k--; mk(big); merged = true; need = Q.reduce(function (a, x) { return a + x.list.length; }, 0);
    }
    var plan = days.map(function (d, i) { return { d: d, cap: cap[i], items: [] }; });
    /* 시험 전날: 다음 날 첫 시험 과목 마무리 칸 예약 */
    var last = plan[plan.length - 1];
    plan.forEach(function (p, i) {
      var left = plan.length - i;
      while (p.items.length < p.cap) {
        var pick = null, best = -1;
        Q.forEach(function (x) {
          if (x.used >= x.list.length) return;
          var today_n = p.items.filter(function (it) { return it.s === x.q.name; }).length; if (today_n >= 2) return;
          var rem = x.list.length - x.used, score = rem / left + (today_n ? -0.6 : 0) + (exOrder[x.q.name] === F.start ? 0.15 : 0);
          if (p === last && exOrder[x.q.name] && exOrder[x.q.name] !== F.start) score -= 0.5;
          if (score > best) { best = score; pick = x; }
        });
        if (!pick) break;
        var it = pick.list[pick.used++]; p.items.push({ s: pick.q.name, k: it.k, t: it.t });
      }
    });
    if (last) { var first = S.filter(function (q) { return exOrder[q.name] === F.start; }); if (first.length && last.items.length < last.cap + 1) last.items.push({ s: first.map(function (q) { return q.name; }).join('·'), k: '마무리', t: '첫날 시험 과목 훑어보기 · 일찍 자기' }); }
    /* 시험 기간: 시험 사이 날에는 다음 시험 과목 */
    var mid = [];
    F.days.forEach(function (d, i) { var nx = F.days[i + 1]; if (!nx) return; var subs = S.filter(function (q) { return exOrder[q.name] === nx; }); if (subs.length) mid.push({ d: d, cap: 3, items: subs.map(function (q) { return { s: q.name, k: '마무리', t: '오답·요약 다시 보기 (시험 끝나고)' }; }) }); });
    var left = Q.filter(function (x) { return x.used < x.list.length; }).map(function (x) { return x.q.name + ' ' + (x.list.length - x.used) + '칸'; });
    return { F: F, S: S, plan: plan, mid: mid, merged: merged, acad: acad, left: left, start: start, cap: totalCap, need: need, exOrder: Object.keys(exOrder).length };
  }
  function added() { return state.tasks.filter(function (t) { return t.title.indexOf(TAG) === 0; }); }
  function title(it) { return (TAG + it.s + ' · ' + it.t + ' (' + it.k + ')').slice(0, 120); }

  /* ---------- 화면 ---------- */
  function view() {
    var B = build(), ro = isParent(), o = opts(), have = added();
    if (!B) return '<section class="card"><p class="muted">기말고사 날짜나 평가계획을 불러오는 중이야… (학교 학사일정에 기말고사가 있어야 짜져)</p></section>';
    var dn = dd(B.F.start), first = dd(B.start);
    var h = '<div class="ep-wrap"><section class="ep-head"><h1>📅 ' + e(B.F.title) + ' 플랜</h1><p><b>' + md(B.F.start) + ' 시작 · D-' + dn + '</b><br>시험 ' + o.weeks + '주 전(' + md(B.start) + ')부터 하루 평일 ' + o.wd + '칸 · 주말 ' + o.we + '칸(1칸 = 약 50분)으로 짰어.' + (first > 0 ? ' 시작까지 ' + first + '일 남았어.' : '') + '</p></section>';
    h += '<section class="card ep-opt"><div class="ep-row"><label>시작<select data-ep="weeks"' + (ro ? ' disabled' : '') + '>' + [2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (o.weeks === n ? ' selected' : '') + '>' + n + '주 전</option>'; }).join('') + '</select></label>' +
      '<label>평일<select data-ep="wd"' + (ro ? ' disabled' : '') + '>' + [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (o.wd === n ? ' selected' : '') + '>' + n + '칸</option>'; }).join('') + '</select></label>' +
      '<label>주말<select data-ep="we"' + (ro ? ' disabled' : '') + '>' + [2, 3, 4, 5, 6].map(function (n) { return '<option value="' + n + '"' + (o.we === n ? ' selected' : '') + '>' + n + '칸</option>'; }).join('') + '</select></label></div>' +
      '<p class="muted small">' + (B.acad ? '학원 가는 날 ' + B.acad + '일은 자동으로 1칸씩 줄였어. ' : '') + '필요한 칸 ' + B.need + ' · 가능한 칸 ' + B.cap + (B.merged ? ' · 칸이 모자라 단원을 묶었어' : '') + '</p></section>';
    /* 범위 */
    h += '<details class="card ep-scope"><summary><b>📖 과목별 기말 범위</b><small>' + (B.S.some(function (q) { return q.scope.src === 'notice'; }) ? '가정통신문 시험 범위 반영' : '평가계획 진도표로 추정 — 범위 공지 나오면 자동 반영') + '</small></summary><ul>' +
      B.S.map(function (q) { return '<li><b>' + e(q.name) + '</b> <small>기말 ' + q.w + '%' + (q.need != null && q.need > 0 && q.need <= 100 && !(window.FC_GRADES.hidden && FC_GRADES.hidden()) ? ' · 필요 ' + Math.ceil(q.need) + '점' : '') + (q.scope.src === 'notice' ? ' · 📨 공지' : ' · 추정') + '</small><p>' + (q.scope.units.length ? q.scope.units.map(e).join(' / ') : '진도표에서 범위를 못 찾았어 — 수업 노트 기준') + '</p></li>'; }).join('') + '</ul></details>';
    /* 날짜별 */
    h += '<section class="card ep-days"><h2>🗓 날짜별 계획 <small>' + B.plan.length + '일</small></h2>';
    if (!ro) h += '<div class="ep-act">' + (have.length ? '<button type="button" data-ep-sync>🔄 다시 짜서 할 일 바꾸기</button><button type="button" data-ep-clear>할 일에서 빼기 (' + have.filter(function (t) { return !t.done; }).length + ')</button>' : '<button type="button" class="primary" data-ep-add>＋ 날짜별 할 일로 넣기</button>') + '</div>';
    h += '<ol class="ep-list">' + B.plan.concat(B.mid).sort(function (a, b) { return a.d.localeCompare(b.d); }).map(function (p) {
      var isEx = B.F.days.indexOf(p.d) >= 0;
      return '<li class="ep-day' + (p.d === today() ? ' now' : '') + '"><div class="ep-d"><b>' + md(p.d) + '</b><small>' + (isEx ? '시험 기간' : 'D-' + Math.round((Date.parse(B.F.start) - Date.parse(p.d)) / 864e5)) + '</small></div><ul>' + (p.items.length ? p.items.map(function (it) { var done = state.tasks.some(function (t) { return t.date === p.d && t.title === title(it) && t.done; }); return '<li class="ep-k-' + (it.k === '1회독' ? 'r' : it.k === '문제' ? 'q' : 'w') + (done ? ' done' : '') + '"><span>' + e(it.k) + '</span><b>' + e(it.s) + '</b> ' + e(it.t) + '</li>'; }).join('') : '<li class="ep-free">쉬는 칸 · 밀린 것 하기</li>') + '</ul></li>';
    }).join('') + '</ol>';
    h += (B.left.length ? '<p class="sl-warn">⚠️ 칸이 모자라 못 넣은 것: ' + e(B.left.join(', ')) + ' — 칸을 늘리거나 시작을 앞당겨.</p>' : '') +
      (!B.exOrder ? '<p class="muted small">시험 시간표(과목 순서)가 나오면 오늘 화면 시험 카드에서 과목 순서를 넣어줘. 그러면 시험 전날·시험 사이 날 계획도 맞춰줄게.</p>' : '') + '</section>';
    h += '<section class="card ep-how"><h2>💡 이렇게 쓰면 좋아</h2><ul><li><b>1회독</b>: 교과서·노트로 단원 개념 정리 (개념을 내 말로 설명할 수 있으면 끝)</li><li><b>문제</b>: 학습지·기출 풀고 틀린 것 표시</li><li><b>오답</b>: 틀린 것만 다시 풀고 한 장 요약</li><li>못 한 칸은 다음 주말 빈 칸으로 미뤄도 괜찮아. 계획보다 꾸준함이 중요해.</li></ul></section></div>';
    return h;
  }
  function entry() {
    var F = finalDays(); if (!F) return '';
    var n = added().length, dn = dd(F.start);
    if (dn > 40 && !n) return '';
    return '<button type="button" class="gd-entry ep-entry" data-go="examplan"><span>📅</span><span><b>' + e(F.title) + ' 플랜 ' + (n ? '진행 중' : '짜기') + '</b><small>D-' + dn + ' · ' + (n ? '할 일 ' + added().filter(function (t) { return t.done; }).length + '/' + n + ' 완료' : '범위·평가 비율로 날짜별 계획 자동 생성') + '</small></span><i aria-hidden="true">›</i></button>';
  }
  function addAll(replace) {
    var B = build(); if (!B) return 0;
    if (replace) state.tasks = state.tasks.filter(function (t) { return !(t.title.indexOf(TAG) === 0 && !t.done && t.date >= today()); });
    var n = 0;
    B.plan.concat(B.mid).forEach(function (p) { p.items.forEach(function (it) { var ti = title(it); if (state.tasks.some(function (t) { return t.date === p.d && t.title === ti; })) return; state.tasks.push({ id: uid(), title: ti, date: p.d, done: false, kind: '과제', subject: it.s.slice(0, 40), note: '기말 플랜 · ' + it.k }); n++; }); });
    save(); return n;
  }

  if (location.hash === '#examplan') tab = 'examplan';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'examplan') { root.innerHTML = view(); document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); }); return; }
    if (tab === 'today' && !isParent()) {   // 시험 21일 전부터 오늘 화면 시험 카드에 바로가기 (승준 리뷰 5)
      var F0 = finalDays(), bx = root.querySelector('#bo-exam');
      if (F0 && bx && !bx.querySelector('.ep-today')) { var d0 = dd(F0.start); if (d0 >= 0 && d0 <= 21) { var n0 = added().length; bx.insertAdjacentHTML('beforeend', '<button type="button" class="ep-today" data-go="examplan">📅 ' + e(F0.title) + ' 플랜 ' + (n0 ? '보기 · ' + added().filter(function (t) { return t.done; }).length + '/' + n0 + ' 완료' : '짜기 — 날짜별 할 일 자동') + ' <i aria-hidden="true">›</i></button>'); } }
    }
    if ((tab === 'grades' || tab === 'school' || tab === 'dates') && !root.querySelector('.ep-entry')) {
      var en = entry(); if (!en) return;
      var a = root.querySelector('.gd-entry') || root.querySelector('.gd-head') || root.querySelector('.card');
      if (a) a.insertAdjacentHTML(a.classList.contains('gd-entry') ? 'afterend' : 'afterend', en);
    }
  };
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (tab !== 'examplan' || isParent() || !t.dataset || !t.dataset.ep) return;
    setOpt(t.dataset.ep, Number(t.value)); setTimeout(function () { var y = window.scrollY; render(); window.scrollTo(0, y); }, 0);
  });
  document.addEventListener('click', function (ev) {
    if (tab !== 'examplan' || isParent()) return;
    var b = ev.target.closest && ev.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-ep-add')) { var n = addAll(false); notice(n + '개를 날짜별 할 일에 넣었어. 그날 오늘 화면에 떠.'); render(); }
    else if (b.hasAttribute('data-ep-sync')) { var m = addAll(true); notice('계획을 다시 짜서 앞으로 할 일 ' + m + '개로 바꿨어. 끝낸 건 그대로야.'); render(); }
    else if (b.hasAttribute('data-ep-clear')) { var k = state.tasks.length; state.tasks = state.tasks.filter(function (t) { return !(t.title.indexOf(TAG) === 0 && !t.done); }); save(); notice((k - state.tasks.length) + '개를 할 일에서 뺐어. 끝낸 건 남겨뒀어.'); render(); }
  });
  window.FC_EXAMPLAN = { build: build, scope: scopeOf, official: officialScope };

  var css = document.createElement('style');
  css.textContent = '.ep-head{padding:2px 2px 10px}.ep-head h1{margin:0;font-size:20px;color:#2a2550}.ep-head p{margin:4px 0 0;font-size:13.5px;color:#57546a;line-height:1.55}.ep-head b{color:#2a2550}' +
    '.ep-row{display:flex;gap:8px;flex-wrap:wrap}.ep-row label{display:flex!important;flex-direction:column;gap:4px;margin:0!important;font-size:12.5px;font-weight:700!important;color:#4f4b66;flex:1;min-width:90px}.ep-row select{min-height:44px;border-radius:12px;border:1.5px solid #d9d3f0;padding:4px 8px;font:inherit;font-size:15px;background:#fff}' +
    '.ep-scope>summary{cursor:pointer;list-style:none;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:2px}.ep-scope>summary::-webkit-details-marker{display:none}.ep-scope>summary b{font-size:17px;color:#2a2550}.ep-scope>summary small{font-size:12.5px;color:#57546a}.ep-scope ul{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.ep-scope li{padding:10px 12px;border-radius:12px;background:#f8f7fc;font-size:15px}.ep-scope li small{color:#57546a}.ep-scope li p{margin:3px 0 0;font-size:13.5px;line-height:1.5;color:#3b3758}' +
    '.ep-act{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}.ep-act button{min-height:44px!important;border-radius:999px!important;padding:6px 14px!important;font-weight:700}' +
    '.ep-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.ep-day{display:grid;grid-template-columns:62px 1fr;gap:10px;padding:10px 12px;border-radius:12px;border:1.5px solid #ece8fc;background:#fff}.ep-day.now{border-color:#7764ef;background:#faf9ff}.ep-d b{display:block;font-size:15px;color:#2a2550}.ep-d small{font-size:12.5px;color:#57546a}' +
    '.ep-day ul{list-style:none;margin:0;padding:0;display:grid;gap:5px}.ep-day li{font-size:13.5px;line-height:1.45;color:#3b3758}.ep-day li b{color:#2a2550}.ep-day li span{display:inline-block;min-width:38px;margin-right:6px;font-size:12.5px;font-weight:800;border-radius:8px;padding:1px 5px;text-align:center}.ep-k-r span{background:#e6f0ff;color:#1d4ea8}.ep-k-q span{background:#fff0d9;color:#7a4b00}.ep-k-w span{background:#e7f6ee;color:#14543d}.ep-day li.done{text-decoration:line-through;color:#6b6880}.ep-free{color:#6b6880!important}' +
    '.ep-today{display:flex!important;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:48px!important;margin-top:10px;padding:8px 14px!important;border-radius:12px!important;border:0!important;background:#5b45d6!important;color:#fff!important;font-weight:800;font-size:15px;text-align:left}.ep-today i{font-style:normal;font-size:20px}' +
    '.ep-how ul{margin:4px 0 0;padding-left:18px;font-size:13.5px;line-height:1.6}';
  document.head.appendChild(css);
})();
