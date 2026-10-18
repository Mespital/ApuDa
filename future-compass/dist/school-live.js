/* 🏫 학교 소식·평가 (study.html#school) — 2026-10-18
   공식 출처를 2시간마다 자동 수집한 school-live.json을 보여준다 (수집: scripts/update_schoolinfo.mjs)
   ① 학교알리미 교과별 평가계획 → 이번 달·다음 달 수행평가, 만점 기준, 과목별 반영 비율, 이번 주 배우는 단원
   ② 서초고 홈페이지 공지·가정통신문 최신 글   ③ 서초구 교육지원센터 모집 중 프로그램(고등·학부모)
   ④ 오늘 화면 요약 한 줄, 🎯 진로 탭에 "서초고 개설 과목" 표시
   공시 문서는 학교 사정에 따라 바뀔 수 있어 원문 링크를 같이 준다. */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function' || typeof tabs === 'undefined') return;
  tabs.school = '🏫 학교 소식';
  var D = null, opened = {};
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kst() { return new Date(Date.now() + 9 * 3600e3); }
  function curM() { return kst().getUTCMonth() + 1; }
  function curW() { return Math.floor((kst().getUTCDate() - 1) / 7) + 1; }
  function gapDays(d) { return Math.round((Date.parse(d + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) / 864e5); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10)); }
  function ago(iso) { if (!iso) return ''; var m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; }
  function load() {
    fetch('school-live.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j) { D = j; if (tab === 'school' || tab === 'today' || tab === 'path' || tab === 'courses' || tab === 'grades' || tab === 'examplan') render(); } }).catch(function () {});
  }

  /* ---------- 시기 해석 ---------- */
  function months(s) {
    var out = [];
    String(s || '').replace(/((?:\d{1,2}\s*(?:월)?\s*[,~\-]\s*)*\d{1,2})\s*월/g, function (m, g) {
      var nums = g.match(/\d{1,2}/g).map(Number), rng = /[~\-]/.test(g);
      if (rng && nums.length === 2) { for (var k = nums[0]; k !== nums[1] % 12 + 1 && out.length < 12; k = k % 12 + 1) out.push(k); }
      else nums.forEach(function (n) { out.push(n); });
      return m;
    });
    var r2 = /(\d{1,2})\s*월[^~]*~\s*(\d{1,2})\s*월/.exec(s || ''); if (r2) for (var k = Number(r2[1]); k !== Number(r2[2]) % 12 + 1; k = k % 12 + 1) out.push(k);
    out = out.filter(function (n, i) { return n >= 1 && n <= 12 && out.indexOf(n) === i; });
    return out.sort(function (a, b) { return order(a) - order(b); });
  }
  function order(m) { return m >= 8 ? m - 8 : m >= 3 ? m + 4 : m + 4 + 12; }   // 2학기 순서: 8,9,...,12,1,2
  function weekOf(s) { var m = /(\d)\s*(?:[~\-]\s*(\d))?\s*주/.exec(s || ''); return m ? [Number(m[1]), Number(m[2] || m[1])] : null; }
  function wkRange(s) { var m = /(\d)\s*(?:[~\-]\s*(\d))?/.exec(String(s || '')); return m ? [Number(m[1]), Number(m[2] || m[1])] : null; }
  function taskStatus(t) {
    if (/상시/.test(t.when)) return { k: 'always', label: '상시' };
    var ms = months(t.when); if (!ms.length) return { k: 'unknown', label: t.when || '시기 미정' };
    var cm = curM(), last = ms[ms.length - 1], first = ms[0];
    if (order(last) < order(cm)) return { k: 'past', label: t.when };
    if (ms.indexOf(cm) >= 0) { var w = weekOf(t.when); if (w && first === cm && w[0] > curW() + 0) return { k: 'soon', label: t.when }; if (w && last === cm && w[1] < curW()) return { k: 'past', label: t.when }; return { k: 'now', label: t.when }; }
    if (order(first) === order(cm) + 1) return { k: 'next', label: t.when };
    return { k: 'later', label: t.when };
  }
  /* 우리 반 과목만 (평가계획 표지의 대상 반 → 1~5반 음악·생애 설계, 6~10반 미술·스포츠 문화 등) */
  function myClass() { var c = (window.FC_SCHOOL && FC_SCHOOL.config && FC_SCHOOL.config.classNo) || ''; try { c = localStorage.getItem('fc_school_class') || c; } catch (x) {} return Number(String(c).replace(/\D/g, '')) || 0; }
  function inClass(s) { var c = myClass(); return !c || !s.classes || (c >= s.classes[0] && c <= s.classes[1]); }
  function mySubjects() { var ev = D && D.eval; return ev && ev.subjects ? ev.subjects.filter(inClass) : []; }
  function otherSubjects() { var ev = D && D.eval; return ev && ev.subjects ? ev.subjects.filter(function (s) { return !inClass(s); }) : []; }
  function allTasks() {
    var out = [];
    mySubjects().forEach(function (s) { (s.tasks || []).forEach(function (t, i) { out.push({ s: s, t: t, id: s.subject + '#' + i, st: taskStatus(t) }); }); });
    var rank = { now: 0, soon: 1, always: 2, next: 3, later: 4, unknown: 5, past: 6 };
    return out.sort(function (a, b) { return rank[a.st.k] - rank[b.st.k] || (months(a.t.when)[0] ? order(months(a.t.when)[0]) : 99) - (months(b.t.when)[0] ? order(months(b.t.when)[0]) : 99); });
  }
  function added(x) { var ti = '[수행] ' + x.s.subject + ' · ' + x.t.title.slice(0, 40); return state.dates.find(function (d) { return d.title === ti; }); }

  /* ---------- 화면 ---------- */
  function taskRow(x, ro) {
    var t = x.t, a = added(x), id = e(x.id), k = x.st.k;
    var tag = { now: '이번 달', soon: '곧', always: '상시', next: '다음 달', later: '', unknown: '', past: '지남' }[k];
    var h = '<li class="sl-t sl-' + k + '"><details' + (opened[x.id] ? ' open' : '') + ' data-sl-rub="' + id + '"><summary><div class="sl-th"><span class="sl-sub">' + e(x.s.subject) + '</span>' + (tag ? '<span class="sl-tag">' + tag + '</span>' : '') + '<small>' + e(t.when || '') + '</small>' + (a ? '<em class="sl-done">📅 ' + md(a.date) + '</em>' : '') + '</div>' +
      '<b>' + e(t.title) + '</b><p class="sl-meta">' + e([t.type, t.pts && t.pts + (/점/.test(t.pts) ? '' : '점'), t.pct != null ? '학기 성적의 ' + t.pct + '%' : ''].filter(Boolean).join(' · ')) + '</p></summary>' +
      (t.how ? '<p class="sl-how">' + e(t.how) + '</p>' : '') +
      (t.parts && t.parts.length > 1 ? '<p class="sl-how">구성: ' + t.parts.map(function (q) { return e(q.type) + ' ' + q.pct + '%'; }).join(' + ') + '</p>' : '');
    if (t.rubric && t.rubric.length) h += '<div class="sl-rub"><p class="sl-rh">🎯 만점 받으려면 (채점 기준 ' + t.rubric.length + '개)</p><ol>' + t.rubric.map(function (r) { return '<li><b>' + e(r.el) + '</b>' + (r.pts ? ' <small>' + e(String(r.pts).replace(/점$/, '')) + '점</small>' : '') + '<p>' + e(r.top) + '</p></li>'; }).join('') + '</ol></div>';
    if (!ro && k !== 'past') h += '<div class="sl-act">' + (a ? '<span class="sl-done">📅 ' + md(a.date) + ' 시험·과제에 있음</span>' : '<label class="sl-date"><span>날짜 정해지면</span><input type="date" data-sl-date="' + id + '" aria-label="' + e(t.title) + ' 날짜"></label>') + '<button type="button" data-sl-prep="' + id + '">＋ 오늘 준비 할 일</button></div>';
    return h + '</details></li>';
  }
  function perfCard(ro) {
    var list = allTasks(); if (!list.length) return '';
    var main = list.filter(function (x) { return x.st.k !== 'past' && x.st.k !== 'later' && x.st.k !== 'unknown'; }), rest = list.filter(function (x) { return main.indexOf(x) < 0; });
    return '<section class="card sl-card" id="sl-perf"><h2>📝 이번 달·다음 달 수행평가 <small>' + main.length + '개</small></h2>' +
      '<p class="muted small">서초고가 학교알리미에 공시한 2학기 평가계획 기준이야. 눌러서 만점 기준·날짜 넣기. 정확한 날짜는 선생님 안내로 확정돼.</p>' +
      (main.length ? '<ul class="sl-tl">' + main.map(function (x) { return taskRow(x, ro); }).join('') + '</ul>' : '<p class="muted">이번 달·다음 달 수행평가가 없어.</p>') +
      (rest.length ? '<details class="sl-more"><summary>나머지 ' + rest.length + '개 (지난 것·시기 미정)</summary><ul class="sl-tl">' + rest.map(function (x) { return taskRow(x, ro); }).join('') + '</ul></details>' : '') +
      classNote() + '</section>';
  }
  function classNote() {
    var c = myClass(), oth = otherSubjects(), notes = mySubjects().filter(function (s) { return s.note; });
    return (notes.length ? '<p class="sl-warn">⚠️ ' + notes.map(function (s) { return '<b>' + e(s.subject) + '</b>: ' + e(s.note); }).join('<br>') + '</p>' : '') +
      (c ? '<p class="muted small">1학년 ' + c + '반 기준이야.' + (oth.length ? ' ' + oth.map(function (s) { return e(s.subject) + '(' + s.classes[0] + '~' + s.classes[1] + '반)'; }).join(' · ') + '은 다른 반 과목이라 뺐어.' : '') + '</p>' : '');
  }
  function joinLines(t) { var o = []; String(t).split('\n').forEach(function (ln) { if (!o.length || /^[^:：\s]{1,10}\s*[:：]/.test(ln)) o.push(ln); else o[o.length - 1] += ' ' + ln; }); return o; }
  /* 📨 시험 범위·시간표 (가정통신문 첨부를 자동으로 읽은 것) */
  function scopeCard() {
    var X = D && D.exams; if (!X) return '';
    var k = X.fin && (X.fin.scope || X.fin.days) ? 'fin' : X.mid && X.mid.scope ? 'mid' : ''; if (!k) return '';
    var E = X[k], label = k === 'fin' ? '기말고사' : '중간고사', S = (E.scope && E.scope.subjects) || {}, days = E.days || {};
    var dayOf = {}, orig = {}; Object.keys(days).forEach(function (d) { days[d].forEach(function (x) { dayOf[x.replace(/\s/g, '')] = d; orig[x.replace(/\s/g, '')] = x; }); });
    var names = Object.keys(S); Object.keys(dayOf).forEach(function (x) { if (!names.some(function (n) { return n.replace(/\s/g, '') === x; })) names.push(orig[x]); });
    names.sort(function (a, b) { return (dayOf[a.replace(/\s/g, '')] || '9').localeCompare(dayOf[b.replace(/\s/g, '')] || '9'); });
    return '<details class="card sl-card sl-scope"' + (k === 'fin' ? ' open' : '') + '><summary><b>📨 ' + (k === 'fin' ? '' : '지난 ') + label + ' 시험 범위' + (Object.keys(days).length ? '·시간표' : '') + '</b><small>' + (k === 'fin' ? '가정통신문 첨부를 자동으로 읽었어' : '기말 범위 공지가 나오면 여기 바로 바뀌어 · 서술형 비중 참고용') + '</small></summary><ul>' +
      names.map(function (n) { var v = S[n] || {}, d = dayOf[n.replace(/\s/g, '')]; return '<li><div class="sl-sch"><b>' + e(n) + '</b>' + (d ? '<span>' + md(d) + '</span>' : '') + (v.essay != null ? '<small>서술형 ' + v.essay + ' · 단답 ' + v.short + ' · 선택 ' + v.mc + (v.min ? ' · ' + v.min + '분' : '') + '</small>' : '') + '</div>' + (v.text ? '<p>' + joinLines(v.text).map(e).join('<br>') + '</p>' : '') + '</li>'; }).join('') +
      '</ul><p class="muted small">' + e((E.scope || E.tt || {}).title || '') + ' · 원문은 <a href="' + e((D.links || {}).letters || '#') + '" target="_blank" rel="noopener noreferrer">가정통신문 게시판</a></p></details>';
  }
  function ratioCard() {
    var ev = D && D.eval; if (!ev || !ev.subjects) return '';
    var rows = mySubjects().filter(function (s) { return s.ratio; });
    return '<details class="card sl-card sl-ratio"><summary><b>⚖️ 과목별 성적 반영</b><small>수행평가 vs 지필(중간·기말)</small></summary><table><thead><tr><th>과목</th><th>수행</th><th>지필</th></tr></thead><tbody>' +
      rows.map(function (s) { var r = s.ratio, ex = r.exam; return '<tr><td>' + e(s.subject) + '</td><td><span class="sl-bar"><i style="width:' + (r.perf || 0) + '%"></i></span>' + (r.perf != null ? r.perf + '%' : '-') + '</td><td>' + (ex ? ex + '%' + (r.mid ? '<small>중간 ' + r.mid + ' · 기말 ' + r.fin + '</small>' : r.fin ? '<small>기말만</small>' : '') : '없음') + '</td></tr>'; }).join('') +
      '</tbody></table><p class="muted small">수행평가 비중이 큰 과목은 과제 하나가 시험 한 번만큼 중요해.' + (rows.some(function (s) { return s.note; }) ? ' ' + rows.filter(function (s) { return s.note; }).map(function (s) { return e(s.subject) + ': ' + e(s.note); }).join(' ') : '') + '</p></details>';
  }
  function weekCard() {
    var ev = D && D.eval; if (!ev || !ev.subjects) return '';
    var m = curM(), w = curW(), rows = [];
    mySubjects().forEach(function (s) {
      var hit = (s.timeline || []).filter(function (x) { if (x.m !== m || x.exam) return false; var r = wkRange(x.w); return !r || (w >= r[0] && w <= r[1]); });
      var secs = {}; hit.forEach(function (x) { if (!secs[x.sec || '']) secs[x.sec || ''] = x; });
      Object.keys(secs).forEach(function (k) { rows.push({ s: s.subject, sec: k, u: secs[k].unit }); });
    });
    if (!rows.length) return '';
    return '<details class="card sl-card sl-week"><summary><b>📖 이번 주(' + m + '월 ' + w + '주) 배우는 단원</b><small>예습·복습 범위 · 평가계획의 진도표 기준</small></summary><ul>' +
      rows.map(function (r) { return '<li><span>' + e(r.s) + (r.sec ? ' <small>' + e(r.sec) + '</small>' : '') + '</span><p>' + e(r.u) + '</p></li>'; }).join('') +
      '</ul><p class="muted small">주차는 날짜로 계산한 추정이야. 반·선생님마다 진도가 조금 다를 수 있어.</p></details>';
  }
  function newsCard() {
    var n = D && D.news; if (!n || !n.boards) return '';
    return '<section class="card sl-card sl-news"><h2>📰 학교 소식</h2>' + n.boards.map(function (b) {
      return '<h3>' + e(b.name) + '</h3><ul>' + b.items.slice(0, 4).map(function (it) { var g = -gapDays(it.date); return '<li><a href="' + e(b.url) + '" target="_blank" rel="noopener noreferrer">' + (g <= 3 ? '<span class="sl-new">NEW</span>' : '') + e(it.title) + '</a><small>' + md(it.date) + '</small></li>'; }).join('') + '</ul>';
    }).join('') + '<p class="muted small">제목을 누르면 학교 홈페이지 게시판이 열려. 첨부 파일(시험 범위 등)은 거기서 확인해.</p></section>';
  }
  function progCard() {
    var p = D && D.programs; if (!p || !p.items || !p.items.length) return '';
    return '<section class="card sl-card sl-prog"><h2>🧭 서초구 교육지원센터 <small>모집 중·예정</small></h2><ul>' + p.items.slice(0, 6).map(function (it) {
      var g = it.applyEnd ? gapDays(it.applyEnd) : null;
      return '<li><a href="' + e(it.url) + '" target="_blank" rel="noopener noreferrer"><b>' + e(it.title) + '</b><small>' + e(it.center) + ' · ' + e(it.target) + '</small><small>' + e(it.status) + (it.applyEnd ? ' · 신청 ~' + md(it.applyEnd) + (g != null && g >= 0 ? ' (D-' + g + ')' : '') : '') + '</small></a></li>';
    }).join('') + '</ul><p class="muted small">서초구민 학생·학부모 대상 무료 프로그램이야. 신청은 센터 홈페이지 회원가입 후 가능해.</p></section>';
  }
  function linksCard() {
    var L = (D && D.links) || {};
    var items = [[L.letters, '📨 가정통신문'], [L.evalBoard, '📋 학업 평가계획 게시판'], ['https://www.schoolinfo.go.kr/ei/ss/pneiss_a03_s0.do', '🏫 학교알리미 (서초고 검색 → 4-가)'], [L.center, '🧭 서초구 교육지원센터'], [L.office, '📚 강남서초교육지원청 진로·진학자료'], ['https://enews.sen.go.kr/news/view.do?bbsSn=188344&step1=3&step2=1', '💻 서울온라인학교 안내']];
    return '<section class="card sl-card sl-links"><h2>🔗 공식 바로가기</h2><div>' + items.filter(function (x) { return x[0]; }).map(function (x) { return '<a href="' + e(x[0]) + '" target="_blank" rel="noopener noreferrer">' + e(x[1]) + '</a>'; }).join('') + '</div></section>';
  }
  function view() {
    var ro = isParent();
    if (!D) return '<section class="card"><p class="muted">공식 자료를 불러오는 중이야…</p></section>';
    var ev = D.eval || {};
    return '<div class="sl-wrap"><section class="sl-head"><h1>🏫 서초고 공식 자료</h1><p>학교알리미 평가계획 ' + e(ev.round || '') + ' · 학교 홈페이지 · 서초구 교육지원센터<br><small>2시간마다 자동 확인 · 마지막 확인 ' + e(ago(D.updated)) + '</small></p></section>' +
      perfCard(ro) + scopeCard() + weekCard() + ratioCard() + newsCard() + progCard() + linksCard() + '</div>';
  }

  /* 오늘 화면 요약 줄 */
  function todayLine() {
    if (!D) return '';
    var list = allTasks().filter(function (x) { return x.st.k === 'now' || x.st.k === 'soon'; });
    var newL = 0; ((D.news && D.news.boards) || []).forEach(function (b) { b.items.forEach(function (it) { if (-gapDays(it.date) <= 3) newL++; }); });
    var prog = ((D.programs && D.programs.items) || []).filter(function (it) { return it.applyEnd && gapDays(it.applyEnd) >= 0 && gapDays(it.applyEnd) <= 7; }).length;
    var bits = [];
    if (list.length) bits.push('수행평가 ' + list.length + '개 이번 달');
    if (newL) bits.push('새 학교 소식 ' + newL);
    if (prog) bits.push('신청 마감 임박 ' + prog);
    if (!bits.length) return '';
    var first = list[0];
    return '<button type="button" class="sl-today" data-go="school"><span>🏫</span><span><b>' + e(bits.join(' · ')) + '</b>' + (first ? '<small>가까운 것: ' + e(first.s.subject) + ' · ' + e(first.t.title.slice(0, 26)) + (first.t.title.length > 26 ? '…' : '') + ' (' + e(first.t.when) + ')</small>' : '') + '</span><i aria-hidden="true">›</i></button>';
  }

  /* 진로 탭: 서초고 개설 과목 */
  function norm(s) { return String(s || '').replace(/\s|·|ㆍ/g, '').replace(/Ⅰ/g, 'I').replace(/Ⅱ/g, 'II').replace(/\(.*?\)/g, ''); }
  function pathCard() {
    var ev = D && D.eval; if (!ev || !ev.offered) return '';
    var g2 = ev.offered['2'] || [], g3 = ev.offered['3'] || [];
    if (!g2.length) return '';
    return '<section class="card sl-card sl-offer" id="sl-offer"><h2>🏫 서초고에서 지금 열린 선택과목 <small>2026 2학기 공시</small></h2>' +
      '<p class="muted small">지금 2학년이 듣는 과목이야. 승준이 학년의 2027년 개설 과목은 학교 수요조사로 정해지니 참고로 봐. 과목 칩에 <b>서초고 개설</b> 표시가 붙어.</p>' +
      '<h3>2학년</h3><div class="sl-chips">' + g2.map(function (s) { return '<span>' + e(s) + '</span>'; }).join('') + '</div>' +
      '<details><summary>3학년 ' + g3.length + '과목</summary><div class="sl-chips">' + g3.map(function (s) { return '<span>' + e(s) + '</span>'; }).join('') + '</div></details>' +
      '<div class="sl-fact"><b>서초고 교육과정 구조</b><ul><li>2학년: 국어·수학·영어 지정 + 국어·수학·사회·과학 교과군에서 학기당 4과목 선택</li><li>3학년: 같은 교과군에서 학기당 6과목까지 선택, 2학기 융합 과목</li><li>제2외국어 일본어·중국어·프랑스어, 인공지능 기초·정보·데이터과학</li></ul><small>지역내일 2025.10.22 「2026 고교 선택 – 서초고등학교」 기준. 2027 편성은 학교 안내로 확인.</small></div>' +
      '<p class="muted small">학교에 없는 과목은 <b>서울온라인학교 주문형 과정</b>으로 들을 수 있어. 학교가 8~9월에 신청하고 12월에 시간표가 확정돼(2027학년도, 서울시교육청 2026.5 발표). 담임 선생님께 물어봐.</p></section>';
  }
  function markChips(root) {
    var ev = D && D.eval; if (!ev || !ev.offered) return;
    var set = {}; ['2', '3'].forEach(function (g) { (ev.offered[g] || []).forEach(function (s) { set[norm(s)] = 1; }); });
    root.querySelectorAll('.cp-c[data-cp-pick]').forEach(function (b) { if (b.querySelector('.sl-ok')) return; if (set[norm(b.dataset.cpPick)]) b.insertAdjacentHTML('beforeend', '<small class="sl-ok">서초고 개설</small>'); });
  }

  if (location.hash === '#school') tab = 'school';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'school') {
      root.innerHTML = view();
      document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); });
      return;
    }
    if (tab === 'today' && !root.querySelector('.sl-today')) {
      var tl = todayLine(); if (!tl) return;
      var a = root.querySelector('#bo-exam') || root.querySelector('.pl-tasks') || root.querySelector('#nx-3h') || root.querySelector('.ms-row');
      if (a) a.insertAdjacentHTML('afterend', tl); else root.insertAdjacentHTML('beforeend', tl);
    }
    if (tab === 'path') {
      var w = root.querySelector('.cp-wrap'); if (!w) return;
      markChips(w);
      if (!w.querySelector('#sl-offer')) { var pc = pathCard(); if (pc) { var bag = w.querySelector('.cp-bag'); if (bag) bag.insertAdjacentHTML('afterend', pc); } }
    }
  };

  function find(id) { return allTasks().find(function (x) { return x.id === id; }); }
  document.addEventListener('toggle', function (ev) { var d = ev.target; if (d && d.dataset && d.dataset.slRub) opened[d.dataset.slRub] = d.open; }, true);
  document.addEventListener('click', function (ev) {
    if (tab !== 'school' || isParent()) return;
    var b = ev.target.closest && ev.target.closest('button[data-sl-prep]'); if (!b) return;
    var x = find(b.dataset.slPrep); if (!x) return;
    var t = '📝 [수행 준비] ' + x.s.subject + ' · ' + x.t.title.slice(0, 50);
    if (!state.tasks.some(function (z) { return z.date === today() && z.title === t; })) { state.tasks.push({ id: uid(), title: t.slice(0, 120), date: today(), done: false, kind: '과제', subject: x.s.subject, note: (x.t.how || '').slice(0, 300) }); save(); }
    if (typeof notice === 'function') notice('오늘 할 일에 넣었어. 만점 기준부터 읽어보자.');
  });
  document.addEventListener('change', function (ev) {
    if (tab !== 'school' || isParent()) return;
    var t = ev.target; if (!t.matches || !t.matches('[data-sl-date]') || !t.value) return;
    var x = find(t.dataset.slDate); if (!x) return;
    state.dates.push({ id: uid(), title: '[수행] ' + x.s.subject + ' · ' + x.t.title.slice(0, 40), subject: x.s.subject, kind: '수행', date: t.value, done: false, note: [x.t.type, x.t.pct != null ? x.t.pct + '%' : '', x.t.how].filter(Boolean).join(' · ').slice(0, 300) });
    save(); var y = window.scrollY; render(); window.scrollTo(0, y);
    if (typeof notice === 'function') notice('시험·과제에 D-day로 넣었어.');
  });

  window.FC_SCHOOL_LIVE = { data: function () { return D; }, tasks: allTasks, reload: load };
  load();
  setInterval(load, 30 * 60000);

  var css = document.createElement('style');
  css.textContent = '.sl-head{padding:2px 2px 10px}.sl-head h1{margin:0;font-size:21px;color:#2a2550}.sl-head p{margin:4px 0 0;font-size:13.5px;color:#57546a;line-height:1.5}.sl-head small{font-size:12.5px;color:#6b6880}' +
    '.sl-card h2 small{font-size:13px;color:#6b6880;margin-left:4px}.sl-tl{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:10px}.sl-t{padding:12px;border-radius:16px;border:1.5px solid #e6e2f5;background:#fff}.sl-t.sl-now,.sl-t.sl-soon{border-color:#bfb3f2;background:#faf9ff}.sl-t.sl-past{border-style:dashed;background:#fbfbfd}' +
    '.sl-th{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px}.sl-sub{font-size:12.5px;font-weight:800;color:#fff;background:#5b45d6;border-radius:999px;padding:2px 9px}.sl-tag{font-size:12px;font-weight:800;color:#7a4b00;background:#fff1d6;border-radius:999px;padding:2px 8px}.sl-th small{font-size:12.5px;color:#57546a;font-weight:700}' +
    '.sl-t summary>b{display:block;font-size:15.5px;line-height:1.4;color:#2a2550}.sl-meta{margin:4px 0 0;font-size:13px;color:#4f4b66;font-weight:600}.sl-how{margin:6px 0 0;font-size:13.5px;line-height:1.55;color:#3b3758}' +
    '.sl-t>details>summary{list-style:none;cursor:pointer}.sl-t>details>summary::-webkit-details-marker{display:none}.sl-t>details>summary::after{content:"자세히 ▾";display:block;margin-top:4px;font-size:12px;font-weight:700;color:#5b45d6}.sl-t>details[open]>summary::after{content:"접기 ▴"}.sl-th em{font-style:normal;margin-left:auto}.sl-rub{margin-top:8px;border-radius:12px;background:#f5f3ff;padding:8px 10px}.sl-rh{margin:0 0 6px;font-weight:800;font-size:13.5px;color:#3a22b8}.sl-rub ol{margin:0;padding-left:18px;display:grid;gap:6px}.sl-rub li{font-size:13.5px;line-height:1.5}.sl-rub li small{color:#5b45d6;font-weight:800}.sl-rub li p{margin:2px 0 0;color:#3b3758}' +
    '.sl-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px}.sl-act button{min-height:42px!important;padding:6px 12px!important;border-radius:999px!important;font-size:13.5px;font-weight:700}.sl-date{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#4f4b66;margin:0}.sl-date input{min-height:42px;width:auto!important;padding:4px 8px;border-radius:10px;border:1.5px solid #e1dcf5;font:inherit;font-size:14px}.sl-done{font-size:13px;font-weight:700;color:#187a5c}' +
    '.sl-more{margin-top:10px}.sl-warn{margin:12px 0 0;padding:10px 12px;border-radius:12px;background:#fff6e6;color:#4a3500;font-size:13.5px;line-height:1.55}.sl-more summary,.sl-ratio>summary,.sl-week>summary{cursor:pointer;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:2px}.sl-ratio>summary,.sl-week>summary{list-style:none}.sl-ratio>summary::-webkit-details-marker,.sl-week>summary::-webkit-details-marker{display:none}.sl-ratio>summary b,.sl-week>summary b{font-size:16px;color:#2a2550}.sl-ratio>summary small,.sl-week>summary small{font-size:12.5px;color:#6b6880}.sl-more summary{font-weight:700;font-size:14px;color:#2a2550}' +
    '.sl-ratio table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}.sl-ratio th{text-align:left;font-size:12.5px;color:#4f4b66;padding:6px 4px;border-bottom:1.5px solid #e6e2f5}.sl-ratio td{padding:8px 4px;border-bottom:1px solid #f0eef7;vertical-align:middle}.sl-ratio td small{display:block;font-size:11.5px;color:#57546a}.sl-bar{display:inline-block;width:46px;height:8px;border-radius:999px;background:#ece8fc;margin-right:6px;vertical-align:middle;overflow:hidden}.sl-bar i{display:block;height:100%;background:#5b45d6}' +
    '.sl-week ul{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.sl-week li{padding:10px 12px;border-radius:12px;background:#f8f7fc}.sl-week li span{font-size:13px;font-weight:800;color:#5b45d6}.sl-week li span small{color:#57546a}.sl-week li p{margin:3px 0 0;font-size:14px;line-height:1.5;color:#2a2550}' +
    '.sl-news h3{font-size:14px;margin:12px 0 6px;color:#2a2550}.sl-news ul,.sl-prog ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}.sl-news li{display:flex;align-items:baseline;gap:8px}.sl-news li a{flex:1;min-width:0;font-size:14px;color:#2a2550;text-decoration:underline;text-underline-offset:3px;line-height:1.5}.sl-news li small{flex:none;font-size:12.5px;color:#57546a}.sl-new{display:inline-block;margin-right:6px;font-size:11px;font-weight:800;color:#fff;background:#c2410c;border-radius:6px;padding:1px 5px;text-decoration:none}' +
    '.sl-prog li a{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:14px;background:#f8f7fc;text-decoration:none;color:#2a2550}.sl-prog li b{font-size:14.5px;text-decoration:underline;text-underline-offset:3px}.sl-prog li small{font-size:12.5px;color:#4f4b66}' +
    '.sl-links div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sl-links a{min-height:48px;display:flex;align-items:center;padding:6px 10px;border-radius:12px;background:#f5f3ff;color:#3a22b8;font-weight:700;font-size:13.5px;text-decoration:none;line-height:1.35}' +
    '.sl-today{display:flex!important;align-items:center;gap:10px;width:100%;min-height:56px!important;margin:0 0 12px;padding:10px 14px!important;border-radius:16px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#2a2550!important;text-align:left}.sl-today>span:first-child{font-size:22px;flex:none}.sl-today>span:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.sl-today b{font-size:14.5px}.sl-today small{font-size:12.5px;color:#57546a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-today i{font-style:normal;font-size:20px;color:#5b45d6;flex:none}' +
    '.sl-offer h3{font-size:14px;margin:10px 0 6px}.sl-chips{display:flex;flex-wrap:wrap;gap:6px}.sl-chips span{font-size:13px;padding:4px 10px;border-radius:999px;background:#eef8f3;color:#145c43;font-weight:600}.sl-offer details{margin-top:8px}.sl-offer summary{cursor:pointer;min-height:40px;display:flex;align-items:center;font-weight:700;font-size:14px}.sl-fact{margin:12px 0 0;padding:10px 12px;border-radius:12px;background:#f8f7fc;font-size:13.5px}.sl-fact ul{margin:4px 0;padding-left:18px;line-height:1.6}.sl-fact small{font-size:12px;color:#57546a}' +
    '.sl-scope>summary{cursor:pointer;list-style:none;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:2px}.sl-scope>summary::-webkit-details-marker{display:none}.sl-scope>summary b{font-size:16px;color:#2a2550}.sl-scope>summary small{font-size:12.5px;color:#6b6880}.sl-scope ul{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.sl-scope li{padding:10px 12px;border-radius:12px;background:#f8f7fc}.sl-sch{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px}.sl-sch b{font-size:14.5px;color:#2a2550}.sl-sch span{font-size:12.5px;font-weight:800;color:#fff;background:#5b45d6;border-radius:999px;padding:1px 8px}.sl-sch small{font-size:12px;color:#4f4b66;flex-basis:100%}.sl-scope li p{margin:4px 0 0;font-size:13.5px;line-height:1.55;color:#3b3758}.sl-scope a{color:#3a22b8}' +
    '.cp-c small.sl-ok{background:#e3f5ec!important;color:#145c43!important}' +
    '@media(max-width:360px){.sl-links div{grid-template-columns:1fr}}';
  document.head.appendChild(css);
})();
