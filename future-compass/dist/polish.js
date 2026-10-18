/* ✨ 3차 다듬기 (2026-10-19)
   ① 큰 글씨 모드 (설정 → 화면 테마 카드, 기기별 fc-font-v1)
   ② 오늘 할 일 다 끝내면 흰둥이 축하 한 장면 (하루 한 번)
   ③ 수행평가 "단계로 쪼개기": 만점 기준(채점 요소)을 3~4단계 할 일로 나눠 마감 전까지 배치
   ④ 이번 주 리포트 카드 (기록 탭 · 엄마 오늘 화면 일요일) — 공부한 날·끝낸 일·수행평가·다음 주 큰 일·대화 질문
   ⑤ 📊 성적 기록 (내신 계산기 탭): 학평·지필 점수 기록 → 과목별 흐름 그래프 */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function') return;
  var root = document.documentElement;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (x) { return d; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (x) {} }
  function addDay(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)); }
  function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y); }

  /* ---------- ① 큰 글씨 ---------- */
  function applyFont() { if (ls('fc-font-v1', '') === 'big') root.setAttribute('data-font', 'big'); else root.removeAttribute('data-font'); }
  applyFont();
  function fontRow() {
    var big = ls('fc-font-v1', '') === 'big';
    return '<div class="po-font"><span>🔠 글자 크기</span><div class="hb-seg" role="group" aria-label="글자 크기"><button type="button" data-po-font="" aria-pressed="' + !big + '" class="' + (big ? '' : 'on') + '">보통</button><button type="button" data-po-font="big" aria-pressed="' + big + '" class="' + (big ? 'on' : '') + '">크게</button></div></div>';
  }

  /* ---------- ② 축하 ---------- */
  function celebrate() {
    if (isParent() || tab !== 'today') return;
    var FP = window.FC_PLANNER, L = FP ? FP.todays() : []; if (L.length < 2 || L.some(function (x) { return !x.t.done; })) return;
    var k = 'fc-cele-' + today(); if (ls(k, '')) return; lset(k, '1');
    var n = L.length, streak = window.FC_PLANNER && FC_PLANNER.studied ? Object.keys(FC_PLANNER.studied(addDay(today(), -30), today()) || {}).length : 0;
    var lines = ['오늘 할 일 ' + n + '개 전부 끝! 멋지다 승준아 🎉', '다 했어! 오늘은 푹 쉬어도 돼 🌙', n + '개 완료 — 이게 진짜 실력이야 💪'];
    var box = document.createElement('div'); box.className = 'po-cele'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '오늘 할 일 완료 축하');
    box.innerHTML = '<div class="po-cele-in"><div class="po-burst" aria-hidden="true">' + Array.from({ length: 14 }, function (_, i) { return '<i style="--a:' + (i * 360 / 14) + 'deg;--c:' + ['#ffd166', '#7ee0b5', '#a8b8ff', '#ff9eb5'][i % 4] + '"></i>'; }).join('') + '</div><img src="shiro-letter.jpg" alt="흰둥이가 편지를 물고 왔어" width="150" height="150"><b>' + e(lines[new Date().getDate() % 3]) + '</b>' + (streak > 1 ? '<small>최근 30일 중 ' + streak + '일 공부했어</small>' : '') + '<button type="button" class="primary" data-po-cele>고마워 흰둥아</button></div>';
    document.body.appendChild(box);
    setTimeout(function () { var b = box.querySelector('button'); if (b) b.focus(); }, 50);
    if (navigator.vibrate) try { navigator.vibrate([30, 40, 30]); } catch (x) {}
  }

  /* ---------- ③ 수행평가 단계 쪼개기 ---------- */
  function steps(t) {
    var r = (t.rubric || []).map(function (x) { return x.el; }).filter(Boolean), out = ['만점 기준 읽고 주제·자료 정하기'];
    if (r.length >= 3) { out.push(r[0] + ' 준비'); out.push(r.slice(1, -1).join('·') + ' 준비'); }
    else if (r.length) r.forEach(function (x) { out.push(x + ' 준비'); });
    else out.push('초안 만들기');
    out.push('기준표로 스스로 점검 · 마무리');
    return out.slice(0, 4).map(function (x) { return x.length > 46 ? x.slice(0, 46) + '…' : x; });
  }
  function splitTask(id) {
    var L = window.FC_SCHOOL_LIVE; if (!L) return;
    var x = L.tasks().find(function (z) { return z.id === id; }); if (!x) return;
    var ti = '[수행] ' + x.s.subject + ' · ' + x.t.title.slice(0, 40), due = (state.dates.find(function (d) { return d.title === ti; }) || {}).date;
    var st = steps(x.t), t0 = today(), end = due && due > t0 ? addDay(due, -1) : addDay(t0, 6), span = Math.max(0, Math.round((Date.parse(end) - Date.parse(t0)) / 864e5)), n = 0;
    st.forEach(function (s, i) {
      var d = addDay(t0, st.length > 1 ? Math.round(i * span / (st.length - 1)) : 0), title = ('🪜 ' + x.s.subject + ' ' + (i + 1) + '/' + st.length + ' · ' + s).slice(0, 120);
      if (state.tasks.some(function (z) { return z.title === title; })) return;
      state.tasks.push({ id: uid(), title: title, date: d, done: false, kind: '과제', subject: x.s.subject, note: ('수행평가: ' + x.t.title).slice(0, 300) }); n++;
    });
    save(); notice(n ? st.length + '단계로 나눠 ' + md(t0) + '~' + md(end) + ' 할 일에 넣었어.' + (due ? '' : ' (날짜를 넣으면 마감에 맞춰 다시 쪼갤 수 있어)') : '이미 단계로 나눠 넣었어.');
  }

  /* ---------- ④ 이번 주 리포트 ---------- */
  var QS = ['이번 주에 제일 재밌었던 수업은 뭐였어?', '요즘 제일 신경 쓰이는 과목은?', '이번 주에 잘한 것 하나만 말해줄래?', '다음 주에 엄마가 도와줄 거 있어?', '수행평가 중에 해보고 싶은 주제 있어?', '요즘 친구들이랑은 어때?'];
  function weekData() {
    var t = today(), from = addDay(t, -((wd(t) + 6) % 7)), to = addDay(from, 6), FP = window.FC_PLANNER;
    var studied = FP && FP.studied ? Object.keys(FP.studied(from, to) || {}).length : 0;
    var tasks = state.tasks.filter(function (x) { return x.date >= from && x.date <= to; }), done = tasks.filter(function (x) { return x.done; }).length;
    var ses = 0; for (var d = from; d <= to; d = addDay(d, 1)) ses += (state.sessions || {})[d] || 0;
    var perfDone = state.dates.filter(function (x) { return x.done && /^\[수행\]/.test(x.title) && x.date >= from && x.date <= addDay(to, 7); }).length;
    var nf = addDay(to, 1), nt = addDay(to, 7);
    var next = state.dates.filter(function (x) { return !x.done && x.date >= nf && x.date <= nt; }).map(function (x) { return md(x.date) + ' ' + x.title.replace(/^\[수행\]\s*/, '수행 · '); });
    var ex = window.FC_BOOST ? FC_BOOST.exams().filter(function (x) { return x.date >= nf && x.date <= nt; }) : []; ex.forEach(function (x) { next.push(md(x.date) + ' ' + x.title); });
    var wk = Math.floor(Date.parse(from) / 6048e5);
    return { from: from, to: to, studied: studied, tasks: tasks.length, done: done, ses: ses, perfDone: perfDone, next: next.slice(0, 5), q: QS[wk % QS.length] };
  }
  function weekCard() {
    var w = weekData(), par = isParent();
    return '<section class="card po-week" id="po-week"><h2>🗓 이번 주 리포트 <small>' + md(w.from) + '~' + md(w.to) + '</small></h2><div class="po-kpi">' +
      [[w.studied + '일', '공부한 날'], [w.done + '/' + w.tasks, '끝낸 할 일'], [w.ses + '회', '집중 타이머']].map(function (k) { return '<div><b>' + k[0] + '</b><small>' + k[1] + '</small></div>'; }).join('') + '</div>' +
      (w.next.length ? '<p class="po-h">다음 주 큰 일</p><ul>' + w.next.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul>' : '<p class="muted small">다음 주에 잡힌 시험·과제는 아직 없어.</p>') +
      '<p class="po-q">💬 ' + (par ? '이번 주 대화 한 마디: ' : '엄마가 물어볼지도? ') + '<b>' + e(w.q) + '</b></p>' +
      (par ? '<p class="muted small">숫자는 칭찬거리를 찾는 용도로만 봐 주세요. 일요일 밤 9시에 폰 알림으로도 보내드려요.</p>' : '') + '</section>';
  }

  /* ---------- ⑤ 성적 기록 ---------- */
  var SUBJ = ['국어', '수학', '영어', '한국사', '사회', '과학'];
  var COL = { 국어: '#e4572e', 수학: '#2f6fdb', 영어: '#17a37a', 한국사: '#a05a2c', 사회: '#8e44ad', 과학: '#d4a106' };
  var editing = false;
  function G() { return window.FC_GRADES ? FC_GRADES.get() : null; }
  function chart(log) {
    var pts = log.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }); if (pts.length < 1) return '';
    var W = 320, H = 150, pl = 28, pr = 10, pt = 10, pb = 24, n = pts.length, x = function (i) { return pl + (n === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1)); }, y = function (v) { return pt + (100 - v) * (H - pt - pb) / 100; };
    var grid = [100, 75, 50, 25].map(function (v) { return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e6e2f5" stroke-width="1"/><text x="' + (pl - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="10" fill="#57546a">' + v + '</text>'; }).join('');
    var lines = SUBJ.map(function (s) {
      var p = pts.map(function (r, i) { var v = r.s && r.s[s]; return v != null ? [x(i), y(v), v] : null; }).filter(Boolean); if (!p.length) return '';
      return '<polyline fill="none" stroke="' + COL[s] + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="' + p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '"/>' + p.map(function (q) { return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.5" fill="' + COL[s] + '"><title>' + s + ' ' + q[2] + '</title></circle>'; }).join('');
    }).join('');
    var labels = pts.map(function (r, i) { return '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="#57546a">' + e(r.name.slice(0, 6)) + '</text>'; }).join('');
    var used = SUBJ.filter(function (s) { return pts.some(function (r) { return r.s && r.s[s] != null; }); });
    var desc = used.map(function (s) { return s + ' ' + pts.filter(function (r) { return r.s && r.s[s] != null; }).map(function (r) { return r.s[s]; }).join('→'); }).join(', ');
    return '<figure class="po-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="과목별 점수 흐름: ' + e(desc) + '">' + grid + lines + labels + '</svg><figcaption>' + used.map(function (s) { return '<span><i style="background:' + COL[s] + '"></i>' + s + '</span>'; }).join('') + '</figcaption></figure>';
  }
  function scoreCard() {
    var g = G(); if (!g) return '';
    var log = g.log || [], ro = isParent();
    var h = '<section class="card po-score" id="po-score"><h2>📊 성적 기록 <small>학평·지필 점수 흐름</small></h2>';
    h += log.length ? chart(log) + '<ul class="po-log">' + log.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).map(function (r) { return '<li><b>' + e(r.name) + '</b><small>' + md(r.date) + '</small><span>' + SUBJ.filter(function (s) { return r.s && r.s[s] != null; }).map(function (s) { return s + ' ' + r.s[s] + (r.g && r.g[s] ? '<em>(' + r.g[s] + '등급)</em>' : ''); }).join(' · ') + '</span>' + (ro ? '' : '<button type="button" class="po-del" data-po-del="' + e(r.id) + '" aria-label="' + e(r.name) + ' 기록 지우기">✕</button>') + '</li>'; }).join('') + '</ul>' : '<p class="muted small">학평(10/20)이나 시험 점수를 넣으면 과목별 흐름을 보여줘. 원점수(100점 기준)로 넣어.</p>';
    if (!ro) h += editing ? '<form class="po-form" data-po-form><div class="po-f1"><label>이름<input name="name" maxlength="20" required placeholder="10월 학평" value="' + (today() <= '2026-10-25' ? '10월 학평' : '') + '"></label><label>날짜<input name="date" type="date" required value="' + today() + '"></label></div><div class="po-f2">' + SUBJ.map(function (s) { return '<label>' + s + '<input name="s_' + s + '" type="number" inputmode="decimal" min="0" max="100" step="0.5" placeholder="-"><select name="g_' + s + '" aria-label="' + s + ' 등급"><option value="">등급</option>' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<option>' + n + '</option>'; }).join('') + '</select></label>'; }).join('') + '</div><p class="muted small">학평은 9등급, 내신은 5등급이야. 등급은 알면만 넣어. 한국사 학평은 50점 만점이면 ×2 해서 넣어.</p><p class="po-btns"><button type="submit" class="primary">저장</button><button type="button" data-po-cancel>취소</button></p></form>' : '<button type="button" data-po-new>＋ 점수 기록하기</button>';
    return h + '</section>';
  }

  /* ---------- 붙이기 ---------- */
  var prev = render;
  render = function () {
    prev(); applyFont();
    var c = document.getElementById('content'); if (!c) return;
    if (tab === 'settings') { var th = c.querySelector('#hb-theme'); if (th && !th.querySelector('.po-font')) th.insertAdjacentHTML('beforeend', fontRow()); }
    if (tab === 'stats' && !c.querySelector('#po-week')) { var a = c.querySelector('#hb-streak') || c.querySelector('.card'); if (a) a.insertAdjacentHTML('afterend', weekCard()); }
    if (tab === 'today' && isParent() && wd(today()) === 0 && !c.querySelector('#po-week')) c.insertAdjacentHTML('beforeend', weekCard());
    if (tab === 'grades' && !c.querySelector('#po-score')) { var gl = c.querySelectorAll('.gd-wrap>section.card'); var at = gl[gl.length - 1]; if (at) at.insertAdjacentHTML('afterend', scoreCard()); }
    if (tab === 'school' && !isParent()) c.querySelectorAll('.sl-act').forEach(function (b) { if (b.querySelector('[data-po-split]')) return; var p = b.querySelector('[data-sl-prep]'); if (p) p.insertAdjacentHTML('afterend', '<button type="button" data-po-split="' + e(p.dataset.slPrep) + '">🪜 단계로 쪼개기</button>'); });
    if (tab === 'today') setTimeout(celebrate, 400);
  };
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-po-font')) { lset('fc-font-v1', b.dataset.poFont); applyFont(); rerender(); }
    else if (b.hasAttribute('data-po-cele')) { var bx = b.closest('.po-cele'); if (bx) bx.remove(); }
    else if (b.hasAttribute('data-po-split')) { splitTask(b.dataset.poSplit); }
    else if (b.hasAttribute('data-po-new')) { editing = true; rerender(); var f = document.querySelector('[data-po-form] input[name="name"]'); if (f) f.focus(); }
    else if (b.hasAttribute('data-po-cancel')) { editing = false; rerender(); }
    else if (b.hasAttribute('data-po-del')) { var g = G(); if (!g) return; var r = g.log.find(function (x) { return x.id === b.dataset.poDel; }); if (!r || !confirm(r.name + ' 기록을 지울까?')) return; g.log = g.log.filter(function (x) { return x !== r; }); FC_GRADES.put(g); rerender(); }
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { var bx = document.querySelector('.po-cele'); if (bx) bx.remove(); } });
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f.matches || !f.matches('[data-po-form]')) return; ev.preventDefault();
    var g = G(); if (!g) return;
    var r = { id: 'sc' + Date.now().toString(36), name: f.elements['name'].value.trim().slice(0, 20), date: f.elements['date'].value, s: {}, g: {} }, any = false;
    SUBJ.forEach(function (s) { var v = f.elements['s_' + s].value, gr = f.elements['g_' + s].value; if (v !== '' && isFinite(+v)) { r.s[s] = Math.max(0, Math.min(100, +v)); any = true; } if (gr) r.g[s] = +gr; });
    if (!r.name || !r.date || !any) { notice('이름·날짜와 점수 하나 이상 넣어줘.'); return; }
    g.log = (g.log || []).concat(r).slice(-40); FC_GRADES.put(g); editing = false; notice('기록했어. 흐름 그래프에 반영됐어.'); rerender();
  });
  window.FC_POLISH = { week: weekData, steps: steps };
})();
