/* 🎯 내신 목표 계산기 (study.html#grades) — 2026-10-19
   학교알리미 평가계획의 과목별 반영 비율(수행·중간·기말)로
   "목표 점수를 받으려면 기말에서 몇 점이 필요한지" 거꾸로 계산한다.
   - 수행평가 점수는 받은 것만 넣고, 아직 안 한 건 가정(만점/90%/80%)으로 채운다.
   - 성취도는 과목마다 다르다(학교알리미 평가계획 '분할점수 산출 방식'·'성적 산출'): 공통과목은 '추정 분할점수'(시험마다 기준점을 정함) → 성취도를 점수로 추정하지 않음,
     체육·예술·과학탐구실험은 '고정 분할점수 + 성취도 3단계(A·B·C)'. 등급(1~5)은 석차로 정해져 점수만으로 알 수 없다 → 참고 안내만. (2026-10-19 감수 ①-1 반영)
   - 기록은 fc_grades_v1 (가족 공유로 엄마 폰에서도 보임, 엄마 화면은 보기 전용) */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function' || typeof tabs === 'undefined') return;
  tabs.grades = '🎯 내신 계산기';
  var KEY = 'fc_grades_v1', open = {}, redraw = 0;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function G() { var v; try { v = JSON.parse(localStorage.getItem(KEY)); } catch (x) {} v = v && typeof v === 'object' ? v : {}; v.t = v.t || {}; v.p = v.p || {}; v.m = v.m || {}; v.f = v.f || {}; if (v.a == null) v.a = 0.9; v.log = Array.isArray(v.log) ? v.log : []; return v; }
  function put(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (x) {} }
  function num(x) { if (x === '' || x == null) return null; var n = Number(x); return isFinite(n) ? n : null; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function maxPts(t) { var m = /(\d+(?:\.\d+)?)/.exec(String(t.pts || '')); return m ? Number(m[1]) : (t.pct || 0); }
  function subs() { var L = window.FC_SCHOOL_LIVE; if (!L || !L.data()) return null; var ev = L.data().eval || {}; var c = myClass(); return (ev.subjects || []).filter(function (s) { return s.ratio && (!c || !s.classes || (c >= s.classes[0] && c <= s.classes[1])); }); }
  function myClass() { var c = (window.FC_SCHOOL && FC_SCHOOL.config && FC_SCHOOL.config.classNo) || ''; try { c = localStorage.getItem('fc_school_class') || c; } catch (x) {} return Number(String(c).replace(/\D/g, '')) || 0; }
  function finalExam() { var ex = window.FC_BOOST ? FC_BOOST.exams() : []; return ex.find(function (x) { return /기말/.test(x.title); }) || null; }
  function dday(d) { return Math.round((Date.parse(d + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) / 864e5); }
  /* 성취도 안내: 점수로 등급 글자를 추정하지 않고, 이 과목의 성적 산출 방식만 알려준다 */
  function scale(s) {
    var g = s.grading || {}, cut = s.cut;
    var steps = g.ach3 ? '성취도 3단계(A·B·C)' : g.ach5 ? '성취도 5단계(A~E)' : g.pf ? '이수 여부(P/F)' : '';
    var rank = g.rank ? ' + 석차 등급(1~5)' : g.ach3 || g.ach5 ? ' · 석차 등급 없음' : '';
    var how = cut === 'est' ? '기준점은 시험마다 학교가 성취수준별로 정해(추정 분할점수)' : cut === 'fixed' ? '기준점은 학교 성적관리규정에 미리 정해져 있어(고정 분할점수)' : '';
    return { steps: steps, rank: rank, how: how, line: steps ? steps + rank + (how ? ' · ' + how : '') : '성적 산출 방식은 평가계획 원문을 확인해줘' };
  }

  /* 계산: 수행 반영 점수(받은 것 + 가정), 중간 반영, 필요한 기말 */
  function calc(s, g) {
    var r = s.ratio, P = g.p[s.subject] || {}, got = 0, assumed = 0, done = 0, tasks = s.tasks || [];
    var tot = tasks.reduce(function (a, t) { return a + (t.pct || 0); }, 0), scale = tot && r.perf ? r.perf / tot : 1;
    tasks.forEach(function (t, i) { var w = (t.pct || 0) * scale, v = num(P[i]), mx = maxPts(t); if (v != null && mx) { got += Math.min(v, mx) / mx * w; done++; } else assumed += w * g.a; });
    if (!tasks.length && r.perf) assumed += r.perf * g.a;
    var perfC = got + assumed, target = num(g.t[s.subject]); if (target == null) target = 90;
    var mid = num(g.m[s.subject]), fin = num(g.f[s.subject]), midW = r.hasMid === false ? 0 : (r.mid || 0), finW = r.fin || (r.exam && !r.mid ? r.exam : 0);
    var out = { perfC: perfC, got: got, done: done, n: tasks.length, target: target, mid: mid, fin: fin, midW: midW, finW: finW, exam: r.exam || 0 };
    if (!r.exam) { out.kind = 'perf'; out.total = perfC; return out; }
    if (fin != null) { out.kind = 'done'; out.total = perfC + (mid || 0) * midW / 100 + fin * finW / 100; return out; }
    if (mid != null || !midW) { out.kind = 'fin'; out.need = (target - perfC - (mid || 0) * midW / 100) / (finW / 100); out.max = perfC + (mid || 0) * midW / 100 + finW; }
    else { out.kind = 'both'; out.need = (target - perfC) / (r.exam / 100); out.max = perfC + r.exam; }
    return out;
  }
  function needLine(c) {
    if (c.kind === 'perf') return '<p class="gd-res">수행평가만으로 성적이 나와. 지금 예상 <b>' + r1(c.total) + '점</b></p>';
    if (c.kind === 'done') return '<p class="gd-res">학기 점수 <b>' + r1(c.total) + '점</b></p>';
    var who = c.kind === 'fin' ? '기말고사' : '중간·기말 평균', n = Math.ceil(c.need * 10) / 10;
    if (c.need <= 0) return '<p class="gd-res ok">이미 목표 ' + c.target + '점을 넘었어. ' + who + '은 실수만 줄이면 돼 👍</p>';
    if (c.need > 100) return '<p class="gd-res hard">' + who + ' 100점이어도 최대 <b>' + r1(c.max) + '점</b>이야. 목표를 ' + Math.floor(c.max) + '점 이하로 잡거나, 남은 수행평가를 최대한 챙기자.</p>';
    return '<p class="gd-res">' + c.target + '점 받으려면 ' + who + ' <b>' + n + '점</b> 필요해' + (n >= 95 ? ' — 빡빡해, 수행평가부터 챙기자' : n <= 70 ? ' — 여유 있어' : '') + '</p>';
  }
  function subjCard(s, g, ro) {
    var c = calc(s, g), id = e(s.subject), r = s.ratio, dis = ro ? ' disabled' : '';
    var head = '<summary><span class="gd-sn">' + id + '</span><span class="gd-rt">' + (r.exam ? '수행 ' + r.perf + ' · ' + (c.midW ? '중간 ' + c.midW + ' · ' : '') + '기말 ' + c.finW : '수행 100') + '</span>' +
      '<span class="gd-need">' + (c.kind === 'perf' || c.kind === 'done' ? r1(c.total) + '점' : c.need <= 0 ? '목표 달성' : c.need > 100 ? '목표 조정' : (c.kind === 'fin' ? '기말 ' : '평균 ') + Math.ceil(c.need * 10) / 10 + '점') + '</span></summary>';
    var body = '<div class="gd-body"><label class="gd-in"><span>목표 학기 점수</span><input type="number" inputmode="decimal" min="0" max="100" step="1" data-gd="t" data-s="' + id + '" value="' + (num(g.t[s.subject]) != null ? g.t[s.subject] : '') + '" placeholder="90"' + dis + '></label>';
    if ((s.tasks || []).length) body += '<p class="gd-h">수행평가 <small>받은 점수만 넣어 · ' + c.done + '/' + c.n + '개 입력</small></p>' + s.tasks.map(function (t, i) { var mx = maxPts(t), v = (g.p[s.subject] || {})[i]; return '<label class="gd-in gd-t"><span>' + e(t.title.length > 34 ? t.title.slice(0, 34) + '…' : t.title) + ' <small>' + (t.pct != null ? t.pct + '%' : '') + '</small></span><span class="gd-of"><input type="number" inputmode="decimal" min="0" max="' + mx + '" step="0.5" data-gd="p" data-s="' + id + '" data-i="' + i + '" value="' + (v != null && v !== '' ? e(v) : '') + '" placeholder="-"' + dis + '>/' + mx + '</span></label>'; }).join('');
    if (r.exam) {
      if (c.midW) body += '<label class="gd-in"><span>중간고사 원점수</span><span class="gd-of"><input type="number" inputmode="decimal" min="0" max="100" step="0.5" data-gd="m" data-s="' + id + '" value="' + (c.mid != null ? c.mid : '') + '" placeholder="아직"' + dis + '>/100</span></label>';
      body += '<label class="gd-in"><span>기말고사 원점수 <small>시험 끝나면</small></span><span class="gd-of"><input type="number" inputmode="decimal" min="0" max="100" step="0.5" data-gd="f" data-s="' + id + '" value="' + (c.fin != null ? c.fin : '') + '" placeholder="아직"' + dis + '>/100</span></label>';
    }
    body += needLine(c) + '<p class="gd-scale">📏 ' + e(scale(s).line) + '</p><p class="gd-split">수행 반영 ' + r1(c.perfC) + ' / ' + (r.perf || 0) + (c.done < c.n ? ' <small>(안 한 수행 ' + Math.round(g.a * 100) + '% 가정 포함)</small>' : '') + (c.mid != null && c.midW ? ' · 중간 반영 ' + r1(c.mid * c.midW / 100) + ' / ' + c.midW : '') + '</p></div>';
    return '<details class="gd-s"' + (open[s.subject] ? ' open' : '') + ' data-gd-open="' + id + '">' + head + body + '</details>';
  }
  function shared() { var P = window.FC_PLANNER ? FC_PLANNER.get() : {}; return !!(P.share && P.share.grades); }
  function hidden() { return isParent() && !shared(); }   // 성적은 승준이가 공개를 켠 경우에만 엄마 화면에 (감수 ⑦-1)
  function view() {
    var L = subs(), g = G(), ro = isParent(), fe = finalExam();
    if (hidden()) return '<div class="gd-wrap"><section class="gd-head"><h1>🎯 내신 목표 계산기</h1></section><section class="card"><p class="pl-big">성적·내신 목표는 승준이가 공개한 경우에만 보여요.</p><p class="muted">승준이가 ⚙️ 설정 → 플래너 → 엄마에게 보이기에서 고를 수 있어요. 점수 대신 "요즘 어떤 과목이 제일 신경 쓰여?"처럼 물어봐 주세요.</p></section></div>';
    if (!L) return '<section class="card"><p class="muted">평가계획을 불러오는 중이야…</p></section>';
    var ex = L.filter(function (s) { return s.ratio.exam; }), pf = L.filter(function (s) { return !s.ratio.exam; });
    var h = '<div class="gd-wrap"><section class="gd-head"><h1>🎯 내신 목표 계산기</h1><p>목표 점수를 넣으면 남은 시험에서 몇 점이 필요한지 거꾸로 계산해.' + (fe ? '<br><b>' + e(fe.title.replace(/\(.*?\)/, '')) + ' D-' + dday(fe.date) + '</b> (' + Number(fe.date.slice(5, 7)) + '/' + Number(fe.date.slice(8)) + ' 시작)' : '') + '</p></section>';
    h += '<section class="card gd-opt"><label class="gd-in"><span>아직 안 한 수행평가는</span><select data-gd="a"' + (ro ? ' disabled' : '') + '>' + [[1, '만점 가정'], [0.9, '90% 가정'], [0.8, '80% 가정'], [0.7, '70% 가정']].map(function (o) { return '<option value="' + o[0] + '"' + (Number(g.a) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' + (ro ? '<p class="muted small">엄마 화면은 보기 전용이야. 점수는 승준이가 넣어.</p>' : '') + '</section>';
    h += '<section class="card"><h2>📝 지필 있는 과목 <small>' + ex.length + '</small></h2><div class="gd-list">' + ex.map(function (s) { return subjCard(s, g, ro); }).join('') + '</div></section>';
    if (pf.length) h += '<section class="card"><h2>🎨 수행평가만 있는 과목 <small>' + pf.length + '</small></h2><div class="gd-list">' + pf.map(function (s) { return subjCard(s, g, ro); }).join('') + '</div></section>';
    h += '<details class="card gd-info"><summary><b>ℹ️ 성취도·등급은 어떻게 정해져?</b></summary><ul>' +
      '<li><b>성취도</b>: 과목마다 방식이 달라. 서초고 평가계획 기준으로 공통국어2·공통수학2·공통영어2·한국사·통합사회2·통합과학2·생애 설계와 자립은 <b>추정 분할점수</b>라 기준점이 시험마다 정해져. 그래서 90점이 꼭 A라고 할 수 없어. 체육·음악·미술·과학탐구실험은 <b>A·B·C 3단계</b>야. 과목 카드의 📏 줄에서 확인해.</li>' +
      '<li><b>등급 1~5</b>(2025 고1부터 5등급제): 석차 기준 1등급 상위 10%, 2등급 34%까지, 3등급 66%까지, 4등급 90%까지, 5등급 나머지. 같은 점수라도 다른 친구들 점수에 따라 달라서 이 계산기로는 알 수 없어.</li>' +
      '<li>체육·예술·과학탐구실험은 석차 등급 없이 성취도만 나와.</li>' +
      '<li>반영 비율은 학교알리미 평가계획(2학기 공시) 기준이야. 선생님 안내가 바뀌면 그걸 따라.</li></ul></details></div>';
    return h;
  }

  /* 오늘 화면·학교 탭 진입 줄 */
  function entry() {
    var L = subs(); if (!L || hidden()) return '';
    var g = G(), fe = finalExam(), hard = 0, set = 0;
    L.forEach(function (s) { if (num(g.t[s.subject]) != null) set++; var c = calc(s, g); if (c.need > 95) hard++; });
    return '<button type="button" class="gd-entry" data-go="grades"><span>🎯</span><span><b>내신 목표 계산기</b><small>' + (set ? '목표 ' + set + '과목 · ' + (hard ? '빡빡한 과목 ' + hard + '개' : '기말 필요 점수 확인') : '목표 점수 넣으면 기말 필요 점수 계산') + (fe ? ' · 기말 D-' + dday(fe.date) : '') + '</small></span><i aria-hidden="true">›</i></button>';
  }

  if (location.hash === '#grades') tab = 'grades';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'grades') { root.innerHTML = view(); document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); }); return; }
    if (tab === 'school' && !root.querySelector('.gd-entry')) { var en = entry(), p = root.querySelector('#sl-perf'); if (en && p) p.insertAdjacentHTML('beforebegin', en); }
  };
  document.addEventListener('toggle', function (ev) { var d = ev.target; if (d && d.dataset && d.dataset.gdOpen) open[d.dataset.gdOpen] = d.open; }, true);
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (tab !== 'grades' || isParent() || !t.dataset || !t.dataset.gd) return;
    var g = G(), k = t.dataset.gd, s = t.dataset.s, v = t.value === '' ? null : Number(t.value);
    if (v != null && (!isFinite(v) || v < 0)) v = null;
    if (k === 'a') g.a = Number(t.value) || 0.9;
    else if (k === 'p') { g.p[s] = g.p[s] || {}; if (v == null) delete g.p[s][t.dataset.i]; else g.p[s][t.dataset.i] = Math.min(v, Number(t.max) || v); }
    else { var box = g[k]; if (v == null) delete box[s]; else box[s] = Math.min(v, 100); }
    put(g);
    var id = t.dataset.gd + (t.dataset.s || '') + (t.dataset.i || '');
    clearTimeout(redraw); redraw = setTimeout(function () {   // 입력칸이 blur되는 도중 다시 그리지 않게 한 박자 뒤에
      if (tab !== 'grades') return;
      var y = window.scrollY; render(); window.scrollTo(0, y);
      var back = Array.prototype.find.call(document.querySelectorAll('[data-gd]'), function (x) { return x.dataset.gd + (x.dataset.s || '') + (x.dataset.i || '') === id; }); if (back) back.focus({ preventScroll: true });
    }, 0);
  });
  window.addEventListener('storage', function (ev) { if (ev.key === KEY && tab === 'grades') render(); });
  window.FC_GRADES = { get: G, put: put, calc: calc, subjects: subs, hidden: hidden };

  var css = document.createElement('style');
  css.textContent = '.gd-head{padding:2px 2px 10px}.gd-head h1{margin:0;font-size:20px;color:#2a2550}.gd-head p{margin:4px 0 0;font-size:13.5px;color:#57546a;line-height:1.55}.gd-head b{color:#2a2550}' +
    '.gd-list{display:grid;gap:10px;margin-top:8px}.gd-s{border:1.5px solid #e6e2f5;border-radius:16px;background:#fff}.gd-s[open]{border-color:#bfb3f2;background:#faf9ff}' +
    '.gd-s>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:12px 14px;min-height:56px;align-items:center}.gd-s>summary::-webkit-details-marker{display:none}.gd-sn{font-weight:800;font-size:17px;color:#2a2550}.gd-rt{grid-column:1;font-size:12.5px;color:#57546a}.gd-need{grid-row:1/3;grid-column:2;font-weight:800;font-size:15px;color:#3a22b8;background:#efeafe;border-radius:999px;padding:6px 12px;white-space:nowrap}' +
    '.gd-body{padding:0 14px 14px;display:grid;gap:8px}.gd-h{margin:6px 0 0;font-weight:800;font-size:13.5px;color:#2a2550}.gd-h small{font-weight:600;color:#57546a}' +
    '.gd-in{display:flex!important;align-items:center;justify-content:space-between;gap:10px;margin:0!important;font-size:15px;font-weight:600!important;color:#2a2550}.gd-in>span:first-child{flex:1;min-width:0;line-height:1.4}.gd-in small{color:#57546a;font-weight:600}.gd-in input,.gd-in select{width:78px!important;min-height:44px;padding:4px 8px;border-radius:12px;border:1.5px solid #d9d3f0;font:inherit;font-size:17px;text-align:right;background:#fff}.gd-in select{width:auto!important;text-align:left}.gd-of{display:flex;align-items:center;gap:4px;font-size:13.5px;color:#57546a;flex:none}.gd-t{padding-left:8px;border-left:3px solid #ece8fc}' +
    '.gd-res{margin:6px 0 0;padding:10px 12px;border-radius:12px;background:#f1edff;font-size:15px;line-height:1.5;color:#2a2550}.gd-res b{font-size:17px;color:#3a22b8}.gd-res.ok{background:#e7f6ee;color:#14543d}.gd-res.hard{background:#fff3e2;color:#4a3500}.gd-split{margin:0;font-size:12.5px;color:#57546a}.gd-scale{margin:0;font-size:13.5px;line-height:1.5;color:#3b3758;padding:6px 10px;border-radius:12px;background:#f8f7fc}' +
    '.gd-opt{padding:12px 14px!important}.gd-info summary{cursor:pointer;min-height:44px;display:flex;align-items:center;list-style:none}.gd-info summary::-webkit-details-marker{display:none}.gd-info ul{margin:6px 0 0;padding-left:18px;font-size:13.5px;line-height:1.6;display:grid;gap:4px}' +
    '.gd-entry{display:flex!important;align-items:center;gap:10px;width:100%;min-height:56px!important;margin:0 0 12px;padding:10px 14px!important;border-radius:16px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#2a2550!important;text-align:left}.gd-entry>span:first-child{font-size:24px;flex:none}.gd-entry>span:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.gd-entry b{font-size:15px}.gd-entry small{font-size:12.5px;color:#57546a}.gd-entry i{font-style:normal;font-size:20px;color:#5b45d6;flex:none}';
  document.head.appendChild(css);
})();
