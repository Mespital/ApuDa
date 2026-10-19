/* 📚 고2 과목 선택 도우미 (study.html#courses) — 2026-10-18
   근거: ① 서초고 학교알리미 평가계획 공시(2026 4월·9월)에서 뽑은 2학년 실제 개설 과목·학점·석차등급 여부·수행 비중 (school-live.json catalog)
        ② 고교학점제 기준 (교육부 2026.1 개선안: 선택과목은 출석률 2/3만, 공통과목은 출석 2/3 + 학업성취율 40%; 졸업 192학점 = 교과 174 + 창체 18)
        ③ 서초고 교육과정 구조: 2학년 국·수·영 지정 + 국·수·사·과 교과군 학기당 4과목 선택 (지역내일 2025.10 기사)
        ④ 🎯 진로 한 장의 희망 계열·핵심/추천 과목·위계
   저장: fc_path_v1.plan = { s1: [...], s2: [...] } (가족 동기화). 선택한 과목은 진로 탭 '후보 바구니'에도 담긴다. */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function' || typeof tabs === 'undefined' || !window.FC_PATH) return;
  tabs.courses = '📚 과목 선택';
  var KEY = 'fc_path_v1', P = window.FC_PATH, G = P.groups, TYPE = P.type || {}, BEFORE = P.before || {}, SUN = P.suneung || {};
  var sem = 1, open = {};
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').replace(/\s|·|ㆍ/g, '').replace(/Ⅰ/g, 'I').replace(/Ⅱ/g, 'II').replace(/\(.*?\)/g, ''); }
  function jo(w, a, b) { var ch = String(w).slice(-1); if (ch === 'Ⅰ') return a; if (ch === 'Ⅱ') return b; var k = ch.charCodeAt(0) - 0xAC00; return k >= 0 && k <= 11171 && k % 28 ? a : b; }
  function load() { var o = P.load(); o.plan = o.plan && typeof o.plan === 'object' ? o.plan : {}; o.plan.s1 = Array.isArray(o.plan.s1) ? o.plan.s1 : []; o.plan.s2 = Array.isArray(o.plan.s2) ? o.plan.s2 : []; return o; }
  function put(o) { o.upd = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (x) {} }
  function live() { return window.FC_SCHOOL_LIVE && FC_SCHOOL_LIVE.data(); }
  function gapDays(d) { return Math.round((Date.parse(d + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) / 864e5); }

  /* 교과군 */
  var AREAS = [['국어', /문학|독서|화법|작문|언어|매체 의사|논술|국어|주제 탐구/], ['수학', /수학|미적분|기하|확률|대수|통계/], ['영어', /영어/], ['사회', /지리|사회|윤리|정치|법|경제(?!수학)|역사|세계사|동아시아|도시|국제|금융/], ['과학', /물리|화학|생명|지구|역학|전자기|물질|세포|과학|환경|행성|기후/], ['제2외국어', /일본|중국|프랑스|독일|스페인|한문/], ['정보·교양', /인공지능|정보|프로그래밍|데이터|심리|철학|진로|생애/], ['예체능', /음악|미술|체육|스포츠/]];
  function areaOf(s) { if (/음악|미술|체육|스포츠|운동/.test(s)) return '예체능'; if (/일본|중국|프랑스|독일|스페인|한문/.test(s)) return '제2외국어'; if (/경제수학|수학과제/.test(s)) return '수학'; for (var i = 0; i < AREAS.length; i++) if (AREAS[i][1].test(s)) return AREAS[i][0]; return '기타'; }
  function typeOf(s) { var k = Object.keys(TYPE).find(function (t) { return norm(t) === norm(s); }); return k ? TYPE[k] : ''; }
  function catalog() { var d = live(); return d && d.eval && d.eval.catalog ? d.eval.catalog.filter(function (c) { return c.grade === 2; }) : []; }
  function bySem(s) { return catalog().filter(function (c) { return (c.semester || 2) === s; }); }
  function fixed(c) { return c.hours >= 4 && /국어|수학|영어/.test(areaOf(c.subject)); }   // 4학점 국·수·영 = 학교 지정 과목(추정)
  function fit(subject, groups) {
    var n = norm(subject), lv = 0;
    groups.forEach(function (g) { if (!G[g]) return; if (G[g].core.some(function (x) { return norm(x) === n; })) lv = 2; else if (lv < 1 && G[g].rec.some(function (x) { return norm(x) === n; })) lv = 1; });
    return lv;
  }

  /* 점검 */
  function checks(o, s) {
    var list = o.plan['s' + s], cat = bySem(s), out = [], groups = o.groups;
    var picked = cat.filter(function (c) { return list.indexOf(c.subject) >= 0; });
    var elect = picked.filter(function (c) { return !fixed(c) && /국어|수학|사회|과학/.test(areaOf(c.subject)); });
    var hours = picked.reduce(function (a, c) { return a + (c.hours || 0); }, 0) + cat.filter(fixed).filter(function (c) { return list.indexOf(c.subject) < 0; }).reduce(function (a, c) { return a + (c.hours || 0); }, 0);
    if (cat.length) {
      if (elect.length < 4) out.push(['warn', '국·수·사·과에서 <b>' + (4 - elect.length) + '과목 더</b> 골라야 해 (서초고는 학기당 4과목 선택, 2026 기준)']);
      else if (elect.length > 4) out.push(['warn', '국·수·사·과 선택이 <b>' + elect.length + '과목</b>이야. 학기당 4과목이 기준이라 ' + (elect.length - 4) + '개는 빼야 해']);
      else out.push(['ok', '국·수·사·과 선택 4과목 ✓']);
    }
    // 위계: 같은 학기·앞 학기에 먼저 들을 과목
    var fxOf = function (q) { return bySem(q).filter(fixed).map(function (c) { return c.subject; }); };
    var prevList = (s === 2 ? o.plan.s1.concat(fxOf(1)) : []).concat(fxOf(s));   // 학교 지정 과목은 이미 듣는 걸로
    list.forEach(function (x) {
      var b = Object.keys(BEFORE).find(function (k) { return norm(k) === norm(x); }); if (!b) return;
      var need = BEFORE[b], has = prevList.concat(list).some(function (y) { return norm(y) === norm(need); });
      if (!has) out.push(['warn', '<b>' + e(x) + '</b> 전에 <b>' + e(need) + '</b>' + jo(need, '을', '를') + ' 먼저 들으면 이해가 쉬워 (1학년·2학년 1학기에 열리는지 확인)']);
    });
    // 계열 핵심 과목
    if (groups.length) {
      var all = o.plan.s1.concat(o.plan.s2, bySem(1).filter(fixed).map(function (c) { return c.subject; }), bySem(2).filter(fixed).map(function (c) { return c.subject; })).map(norm), offeredAll = catalog().map(function (c) { return norm(c.subject); });
      groups.forEach(function (g) {
        if (!G[g]) return;
        var miss = G[g].core.filter(function (x) { return all.indexOf(norm(x)) < 0 && offeredAll.indexOf(norm(x)) >= 0; });
        if (miss.length) out.push(['info', G[g].i + ' ' + e(G[g].n) + ' 핵심 중 서초고 2학년에 열린 <b>' + miss.map(e).join(' · ') + '</b>' + jo(miss[miss.length - 1], '이', '가') + ' 아직 없어']);
        var none = G[g].core.filter(function (x) { return offeredAll.indexOf(norm(x)) < 0; });
        if (none.length && s === 2) out.push(['info', G[g].i + ' 핵심 과목 <b>' + none.map(e).join(' · ') + '</b>' + jo(none[none.length - 1], '은', '는') + ' 지금 서초고 2학년 공시 과목에 없어. 3학년 개설·공동교육과정·서울온라인학교 여부를 선생님께 물어봐']);
      });
    }
    var rk = picked.filter(function (c) { return c.grading && c.grading.rank; }).length, nt = picked.reduce(function (a, c) { return a + (c.nTasks || 0); }, 0);
    if (picked.length) out.push(['info', '석차등급 나오는 과목 ' + rk + '개 · 수행평가 약 ' + nt + '번 · 고른 과목 ' + picked.reduce(function (a, c) { return a + (c.hours || 0); }, 0) + '학점' + (nt >= 12 ? ' — 수행평가가 몰릴 수 있어, 학기 중 시간 계산해보자' : '')]);
    return { list: out, hours: hours, elect: elect.length };
  }

  /* 화면 */
  function courseCard(c, o, ro) {
    var on = o.plan['s' + sem].indexOf(c.subject) >= 0, lv = fit(c.subject, o.groups), ty = typeOf(c.subject), fx = fixed(c), key = sem + '|' + c.subject;
    var gr = c.grading ? (c.grading.rank ? '<span class="ch-b ch-rk">석차등급</span>' : c.grading.ach3 ? '<span class="ch-b">성취도 A·B·C</span>' : c.grading.pf ? '<span class="ch-b">P/F</span>' : c.grading.ach5 ? '<span class="ch-b">성취도만</span>' : '') : '';
    return '<li class="ch-c' + (on ? ' on' : '') + (fx ? ' fx' : '') + '"><div class="ch-top"><button type="button" class="ch-pick" data-ch-pick="' + e(c.subject) + '" aria-pressed="' + on + '"' + (ro || fx ? ' disabled' : '') + '><i aria-hidden="true">' + (fx ? '📌' : on ? '✓' : ro ? '·' : '＋') + '</i><b>' + e(c.subject) + '</b></button>' +
      (lv === 2 ? '<span class="ch-b ch-core">⭐ 계열 핵심</span>' : lv === 1 ? '<span class="ch-b ch-rec">계열 추천</span>' : '') + '</div>' +
      '<p class="ch-meta">' + [fx ? '학교 지정(추정)' : '', ty ? ty + '선택' : '', c.hours ? c.hours + '학점' : '', c.perf != null ? '수행 ' + c.perf + '%' : '', c.nTasks ? '수행 ' + c.nTasks + '번' : '', c.exam === 0 ? '지필 없음' : c.hasMid === false && c.exam ? '기말만' : '', SUN[c.subject] ? '수능 범위' : ''].filter(Boolean).map(e).join(' · ') + ' ' + gr + '</p>' +
      (c.tasks && c.tasks.length ? '<details' + (open[key] ? ' open' : '') + ' data-ch-open="' + e(key) + '"><summary>올해 수행평가 보기</summary><ul>' + c.tasks.map(function (t) { return '<li>' + e(t.when || '') + ' · ' + e(t.title) + (t.pct != null ? ' (' + t.pct + '%)' : '') + '</li>'; }).join('') + '</ul></details>' : '') + '</li>';
  }
  function view() {
    var o = load(), ro = isParent(), cat = bySem(sem), d = live();
    var s1n = bySem(1).length, s2n = bySem(2).length;
    if (!s1n && s2n && sem === 1) { sem = 2; cat = bySem(2); }
    var sug = state.dates.find(function (x) { return x.id === 'cp-sugang'; });
    var h = '<div class="ch-wrap"><div class="ch-head"><h1>📚 고2 과목 선택 도우미</h1><p>서초고가 공시한 지금 2학년 과목으로 내 2학년을 미리 짜보기</p>' +
      (sug ? '<p class="ch-dd">과목 신청 마감 ' + (gapDays(sug.date) >= 0 ? 'D-' + gapDays(sug.date) : '지남') + '</p>' : '<p class="muted small">신청 마감일은 🎯 진로 탭에서 넣을 수 있어.</p>') + '</div>';
    h += '<details class="card ch-rule"><summary><b>🎓 고교학점제, 이것만 알면 돼</b><small>졸업 학점 · 이수 기준 · 등급 나오는 과목</small></summary><ol>' +
      '<li><b>졸업: 3년간 192학점</b> (교과 174 + 창의적 체험활동 18). 1학점 = 50분 수업 16번, 그래서 <b>주당 수업 시간 = 학점</b>이야.</li>' +
      '<li><b>과목 이수 기준</b>: 공통과목(1학년)은 출석률 2/3 이상 + 학업성취율 40% 이상. <b>선택과목(2·3학년)은 출석률 2/3만</b> 넘으면 돼 (교육부 2026.1 개선안, 2026년 1·2학년부터).</li>' +
      '<li><b>석차등급(1~5등급)이 안 나오는 과목</b>: 사회·과학 융합선택 9과목, 과학탐구실험, 체육·예술, 교양. 아래 과목 카드에 서초고 문서의 표시를 그대로 붙였어.</li>' +
      '<li><b>과목 종류</b>: 공통(1학년) → 일반선택(기본) → 진로선택(심화) → 융합선택(교과 넘나들기). 진로선택은 같은 계열 일반선택을 먼저 들으면 쉬워.</li>' +
      '<li><b>서초고 구조</b>(2025.10 기사): 2학년은 국·수·영 지정 + 국·수·사·과 교과군에서 <b>학기당 4과목 선택</b>. 학교에 없는 과목은 서울온라인학교로.</li></ol></details>';
    var gs = o.groups;
    h += '<section class="card ch-g"><h2>① 내 희망 계열</h2>' + (gs.length ? '<p class="ch-pg">' + gs.map(function (g) { return G[g].i + ' ' + e(G[g].n); }).join(' · ') + '</p><p class="muted small">⭐ 계열 핵심 · 계열 추천 표시는 이 계열 기준이야.</p>' : '<p class="muted">아직 희망 계열이 없어. 계열을 고르면 맞는 과목에 ⭐가 붙어.</p>') + '<button type="button" class="ch-link" data-go="path">🎯 진로 한 장에서 ' + (gs.length ? '바꾸기' : '고르기') + '</button></section>';
    if (!d || !catalog().length) return h + '<section class="card"><p class="muted">서초고 과목 목록을 불러오는 중이야… (학교알리미 공시 기준, 2시간마다 갱신)</p></section></div>';
    h += '<section class="card ch-list"><h2>② 서초고 2학년 개설 과목</h2><p class="muted small">지금 2학년(2026)이 실제로 듣는 과목이야. 승준이의 2027년 개설 과목은 1학년 수요조사로 정해져서 조금 달라질 수 있어.</p>' +
      '<div class="ch-seg" role="group" aria-label="학기">' + [1, 2].map(function (s) { var n = bySem(s).length; return '<button type="button" data-ch-sem="' + s + '" aria-pressed="' + (sem === s) + '" class="' + (sem === s ? 'on' : '') + '"' + (n ? '' : ' disabled') + '>2학년 ' + s + '학기' + (n ? ' · ' + n + '과목' : ' · 자료 없음') + '</button>'; }).join('') + '</div>';
    var areas = {}; cat.forEach(function (c) { var a = areaOf(c.subject); (areas[a] = areas[a] || []).push(c); });
    AREAS.map(function (a) { return a[0]; }).concat(['기타']).forEach(function (a) {
      if (!areas[a]) return;
      var list = areas[a].sort(function (x, y) { return fit(y.subject, gs) - fit(x.subject, gs) || (fixed(y) - fixed(x)); });
      h += '<h3>' + e(a) + (/국어|수학|사회|과학/.test(a) ? ' <small>선택 교과군</small>' : '') + '</h3><ul class="ch-cl">' + list.map(function (c) { return courseCard(c, o, ro); }).join('') + '</ul>';
    });
    h += '</section>';
    // ③ 점검
    h += '<section class="card ch-chk"><h2>③ 내 2학년 점검</h2>';
    [1, 2].forEach(function (s) {
      if (!bySem(s).length) return;
      var ck = checks(o, s), list = o.plan['s' + s], fx = bySem(s).filter(fixed).map(function (c) { return c.subject; });
      h += '<div class="ch-sem"><h3>2학년 ' + s + '학기 <small>약 ' + ck.hours + '학점(예체능·창체 제외)</small></h3><p class="ch-pl">' + fx.map(function (x) { return '<span class="fx">📌 ' + e(x) + '</span>'; }).join('') + list.map(function (x) { return '<span>' + e(x) + '</span>'; }).join('') + (list.length ? '' : '<span class="muted">아직 고른 선택과목 없음</span>') + '</p><ul>' + ck.list.map(function (c) { return '<li class="ck-' + c[0] + '">' + (c[0] === 'ok' ? '✅ ' : c[0] === 'warn' ? '⚠️ ' : '💡 ') + c[1] + '</li>'; }).join('') + '</ul></div>';
    });
    h += '<details class="ch-ask"><summary>선생님·엄마랑 확인할 것</summary><ol><li>2027년 2학년 개설 예정 과목과 지정 과목이 올해와 같은지 (수요조사 안내문)</li><li>희망 과목이 수강 인원이 적어 폐강될 수 있는지, 그럴 때 대체 과목·서울온라인학교</li><li>목표 대학이 정해지면 그 대학 「전공 연계 권장 과목」(어디가·입학처)과 맞춰보기</li><li>수행평가가 많은 과목이 한 학기에 몰리지 않는지</li></ol></details>' +
      '<p class="muted small">고른 과목은 🎯 진로 탭 후보 바구니에도 담겨. 📌 = 4학점 국·수·영 과목이라 학교 지정 과목으로 추정했어. 출처: 서초고 학교알리미 공시(' + e((d.eval && d.eval.round) || '') + ' 등), 교육부 2026.1 고교학점제 개선안.</p></section></div>';
    return h;
  }

  function entry() {
    var o = load(), n = o.plan.s1.length + o.plan.s2.length;
    return '<button type="button" class="ch-entry" data-go="courses"><span>📚</span><span><b>고2 과목 선택 도우미</b><small>' + (n ? '2학년 과목 ' + n + '개 골랐어 · 점검 보기' : '서초고 실제 개설 과목·학점·등급 여부로 2학년 미리 짜기') + '</small></span><i aria-hidden="true">›</i></button>';
  }

  if (location.hash === '#courses') tab = 'courses';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'courses') { root.innerHTML = view(); document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); }); return; }
    if (tab === 'path') { var w = root.querySelector('.cp-wrap'); if (w && !w.querySelector('.ch-entry')) { var a = w.querySelector('.ce-entry'); if (a) a.insertAdjacentHTML('afterend', entry()); else w.insertAdjacentHTML('afterbegin', entry()); } }
  };
  function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  document.addEventListener('toggle', function (ev) { var t = ev.target; if (t && t.dataset && t.dataset.chOpen) open[t.dataset.chOpen] = t.open; }, true);
  document.addEventListener('click', function (ev) {
    if (tab !== 'courses') return;
    var b = ev.target.closest && ev.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.chSem) { sem = Number(b.dataset.chSem); rerender(); return; }
    if (b.dataset.chPick && !isParent()) {
      var o = load(), k = 's' + sem, s = b.dataset.chPick, i = o.plan[k].indexOf(s);
      if (i >= 0) o.plan[k].splice(i, 1); else { o.plan[k].push(s); o.picks[s] = 1; }
      put(o); rerender();
    }
  });
  window.FC_COURSES = { catalog: catalog, checks: function (s) { return checks(load(), s); } };

  var css = document.createElement('style');
  css.textContent = '.ch-head{padding:2px 2px 10px}.ch-head h1{margin:0;font-size:20px;color:#2a2550}.ch-head p{margin:4px 0 0;font-size:15px;color:#57546a}.ch-dd{font-size:17px!important;font-weight:800;color:#5b45d6!important}' +
    '.ch-rule>summary{list-style:none;cursor:pointer;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:2px}.ch-rule>summary::-webkit-details-marker{display:none}.ch-rule>summary b{font-size:17px;color:#2a2550}.ch-rule>summary small{font-size:12.5px;color:#6b6880}.ch-rule ol{margin:10px 0 0;padding-left:20px;display:grid;gap:8px;font-size:15px;line-height:1.6;color:#3b3758}' +
    '.ch-pg{font-size:17px;font-weight:700;margin:4px 0}.ch-link{min-height:42px!important;border-radius:999px!important;padding:6px 14px!important;font-size:13.5px;font-weight:700;margin-top:6px}' +
    '.ch-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 6px}.ch-seg button{min-height:44px!important;border-radius:12px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#2a2550!important;font-weight:700;font-size:15px}.ch-seg button.on{background:#2a2550!important;border-color:#2a2550!important;color:#fff!important}' +
    '.ch-list h3{font-size:15px;margin:16px 0 8px;color:#2a2550}.ch-list h3 small{font-size:12.5px;color:#5b45d6;font-weight:700}.ch-cl{list-style:none;margin:0;padding:0;display:grid;gap:8px}.ch-c{padding:10px 12px;border-radius:12px;border:1.5px solid #e6e2f5;background:#fff}.ch-c.on{border-color:#5b45d6;background:#f6f4ff}.ch-c.fx{background:#f8f7fc}' +
    '.ch-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ch-pick{display:flex!important;align-items:center;gap:8px;min-height:40px!important;padding:4px 12px 4px 4px!important;border-radius:999px!important;border:0!important;background:transparent!important;color:#2a2550!important;text-align:left}.ch-pick i{font-style:normal;width:32px;height:32px;border-radius:50%;background:#ece8fc;color:#3a22b8;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}.ch-c.on .ch-pick i{background:#5b45d6;color:#fff}.ch-pick b{font-size:15px}.ch-pick[disabled]{opacity:1}' +
    '.ch-b{display:inline-block;font-size:12.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:#efedf5;color:#4f4b66;vertical-align:middle}.ch-core{background:#fff1d6;color:#6b4500}.ch-rec{background:#e3f5ec;color:#145c43}.ch-rk{background:#ece8fc;color:#3a22b8}' +
    '.ch-meta{margin:4px 0 0 44px;font-size:12.5px;color:#4f4b66;line-height:1.6}.ch-c details{margin:4px 0 0 44px}.ch-c summary{cursor:pointer;font-size:12.5px;font-weight:700;color:#5b45d6;min-height:32px;display:flex;align-items:center}.ch-c details ul{margin:2px 0 4px;padding-left:16px;font-size:12.5px;line-height:1.55;color:#3b3758}' +
    '.ch-sem{margin:10px 0 14px}.ch-sem h3{font-size:15px;margin:0 0 6px;color:#2a2550}.ch-sem h3 small{font-size:12.5px;color:#6b6880;font-weight:600}.ch-pl{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.ch-pl span{font-size:13.5px;padding:4px 10px;border-radius:999px;background:#ece8fc;color:#3a22b8;font-weight:700}.ch-pl span.fx{background:#efedf5;color:#4f4b66}.ch-pl span.muted{background:none;color:#6b6880;font-weight:500}' +
    '.ch-sem ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}.ch-sem li{font-size:13.5px;line-height:1.55;padding:8px 10px;border-radius:12px}.ck-ok{background:#eef8f3;color:#145c43}.ck-warn{background:#fff6e6;color:#4a3500}.ck-info{background:#f5f3ff;color:#2a2550}' +
    '.ch-ask summary{cursor:pointer;min-height:42px;display:flex;align-items:center;font-weight:700;font-size:15px}.ch-ask ol{margin:4px 0 8px;padding-left:20px;font-size:15px;line-height:1.6}' +
    '.ch-entry{display:flex!important;align-items:center;gap:12px;width:100%;min-height:60px!important;margin:0 0 12px;padding:10px 14px!important;border-radius:16px!important;border:1.5px solid #cfc6f2!important;background:#fff!important;color:#2a2550!important;text-align:left}.ch-entry>span:first-child{font-size:24px;flex:none}.ch-entry>span:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column}.ch-entry b{font-size:17px}.ch-entry small{font-size:12.5px;color:#57546a}.ch-entry i{font-style:normal;font-size:20px;color:#5b45d6;flex:none}';
  document.head.appendChild(css);
})();
