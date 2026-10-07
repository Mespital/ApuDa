/* 엄마 한눈에: 엄마로 들어오면 오늘 탭이 승준이 공부 현황판이 된다.
   - 진행 상황(개수·완료·D-day·진도)은 모두 보여주고, 승준이가 쓴 글(복습 메모·하루 마무리·다짐·노트 내용)은 승준이가 공개한 것만
   - 엄마는 기록을 고치지 않고 👍 응원만 보낼 수 있음(fc_cheer_v1) → 승준이 오늘 화면 맨 위에 보임 */
(function () {
  'use strict';
  var CHEER = 'fc_cheer_v1', DN = ['일', '월', '화', '수', '목', '금', '토'];
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function dl(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)) + '(' + DN[new Date(d + 'T12:00:00Z').getUTCDay()] + ')'; }
  function monday(d) { return addD(d, -((new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7)); }
  function bar(n, total, cls) { var p = total ? Math.round(n / total * 100) : 0; return '<div class="pv-bar ' + (cls || '') + '"><i style="width:' + p + '%"></i></div>'; }
  function ago(ms) { if (!ms) return ''; var m = Math.round((Date.now() - ms) / 60000); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; }
  function lastUpdate() {
    var meta = ls('fc-family-meta-v1', {}) || {}, t = 0;
    ['compass-study-v1', 'fc_planner_v1', 'fc_notes_v1', 'compass-study-plus-v1', 'fc_academy_v1'].forEach(function (k) { if (meta[k] && meta[k].t > t) t = meta[k].t; });
    return t;
  }

  /* ---------- 엄마 체크: 자동으로 챙길 것 + 엄마가 직접 적는 할 일 ---------- */
  var MOM = 'fc_mom_v1';
  function mom() { var v = ls(MOM, {}) || {}; v.checks = v.checks || {}; v.items = Array.isArray(v.items) ? v.items : []; return v; }
  function saveMom(v) {
    var cut = addD(today(), -14); Object.keys(v.checks).forEach(function (d) { if (d < cut) delete v.checks[d]; });
    v.items = v.items.filter(function (x) { return !x.done || !x.doneAt || x.doneAt >= cut; }).slice(-60);
    try { localStorage.setItem(MOM, JSON.stringify(v)); } catch (e) {}
    if (typeof FamilySync !== 'undefined' && FamilySync.pushNow) FamilySync.pushNow();
  }
  function autoChecks() {
    var t = today(), FP = window.FC_PLANNER, P = FP ? FP.get() : {}, out = [], CAL = window.FC_CAL;
    var h = new Date(Date.now() + 9 * 3600000).getUTCHours();
    var nd = CAL ? CAL.nextSchoolDay(t) : addD(t, 1), w = new Date(nd + 'T12:00:00Z').getUTCDay();
    // 내일(다음 등교일) 준비물
    var bag = w >= 1 && w <= 5 ? String(state.bags[w - 1] || '').trim() : '';
    if (bag) out.push({ k: 'bag:' + nd, icon: '🎒', t: dl(nd) + ' 준비물: ' + bag, sub: '전날 저녁에 같이 챙기기' });
    // 쉬는 날·학교 행사 (7일 안)
    for (var i = 1; i <= 7; i++) {
      var d = addD(t, i), off = CAL ? CAL.offDay(d) : null;
      if (off && !off.weekend) out.push({ k: 'off:' + d, icon: '🌿', t: dl(d) + ' ' + off.name + ' — 학교 안 감', sub: '돌봄·일정 확인' });
      (CAL && CAL.schoolEvents ? CAL.schoolEvents(d) : []).forEach(function (ev) {
        if (/고사|평가|시험|체험|수련|축제|상담|설명회|소풍|졸업|입학|방학|단축/.test(ev)) out.push({ k: 'ev:' + d + ':' + ev, icon: /고사|평가|시험/.test(ev) ? '📝' : '📌', t: dl(d) + ' ' + ev.replace(/\(\d학년\)/, ''), sub: /고사|평가|시험/.test(ev) ? '컨디션·수면 챙기기' : '가정통신문·준비물 확인' });
      });
    }
    // 시험 과목 미입력
    var nx = FP ? FP.nextExamDay(addD(t, -1)) : '';
    if (nx && gap(nx) <= 7 && !((P.examDays || {})[nx] || []).length) out.push({ k: 'exsub:' + nx, icon: '🗓️', t: (nx === t ? '오늘' : dl(nx)) + ' 시험 과목이 아직 안 들어갔어요', sub: '시험 시간표 같이 확인해서 넣기' });
    // 학원 숙제·시간
    (typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(t) : []).forEach(function (a) {
      if (a.homework && !a.hwDone) out.push({ k: 'achw:' + a.id + ':' + t, icon: '📝', t: a.name + ' 숙제 아직: ' + a.homework, sub: (a.start ? a.start + ' 수업 전' : '오늘 수업 전') + '까지' });
    });
    // 마감 임박 수행평가·과제
    state.dates.filter(function (x) { return !x.done && x.kind !== '시험' && gap(x.date) >= 0 && gap(x.date) <= 3; }).forEach(function (x) {
      out.push({ k: 'due:' + x.id, icon: '⏰', t: x.title + ' ' + (gap(x.date) === 0 ? '오늘' : 'D-' + gap(x.date)) + ' 마감', sub: x.kind + (x.subject ? ' · ' + x.subject : '') + ' — 제출 준비 됐는지' });
    });
    // 다시 보기 밀림
    var late = 0; Object.keys(P.again || {}).forEach(function (id) { (P.again[id] || []).forEach(function (d) { if (d < t && d >= addD(t, -3) && !(P.againDone || {})[id + '@' + d]) late++; }); });
    if (late >= 3) out.push({ k: 'again:' + t, icon: '🔁', t: '다시 보기 ' + late + '개 밀려 있어요', sub: '혼내기보다 "10분만 같이 하자"' });
    // 밤: 하루 마무리
    if (h >= 21 && !(P.days || {})[t]) out.push({ k: 'close:' + t, icon: '🌙', t: '하루 마무리 아직', sub: '잘 자라는 인사와 함께 살짝 알려주기' });
    return out;
  }
  function momCard() {
    var t = today(), v = mom(), ck = v.checks[t] || {}, auto = autoChecks();
    var items = v.items.filter(function (x) { return !x.done || x.doneAt === t; }).sort(function (a, b) { return (a.done - b.done) || String(a.due || '9').localeCompare(String(b.due || '9')); });
    var left = auto.filter(function (x) { return !ck[x.k]; }).length + items.filter(function (x) { return !x.done; }).length;
    var h = '<section class="card pv-sec pv-mom"><div class="pl-head"><h2>✔️ 엄마 체크</h2><span class="pl-count">' + (left ? left + '개 남음' : '다 챙겼어요 👏') + '</span></div>';
    h += (auto.length ? '<ul class="pv-mlist">' + auto.map(function (x) {
      var on = !!ck[x.k];
      return '<li class="' + (on ? 'done' : '') + '"><label><input type="checkbox" data-pv-ck="' + esc(x.k) + '"' + (on ? ' checked' : '') + '><span class="pv-mi">' + x.icon + '</span><span><b>' + esc(x.t) + '</b><small>' + esc(x.sub) + '</small></span></label></li>';
    }).join('') + '</ul>' : '<p class="muted small">오늘 자동으로 챙길 건 없어요.</p>');
    h += '<p class="pv-rocks-h">엄마 할 일</p>' + (items.length ? '<ul class="pv-mlist">' + items.map(function (x) {
      return '<li class="' + (x.done ? 'done' : '') + '"><label><input type="checkbox" data-pv-item="' + esc(x.id) + '"' + (x.done ? ' checked' : '') + '><span class="pv-mi">📌</span><span><b>' + esc(x.title) + '</b>' + (x.due ? '<small>' + (gap(x.due) < 0 ? '기한 지남 · ' : gap(x.due) === 0 ? '오늘까지 · ' : 'D-' + gap(x.due) + ' · ') + dl(x.due) + '</small>' : '') + '</span></label><button type="button" class="pl-x" data-pv-del="' + esc(x.id) + '" aria-label="지우기">×</button></li>';
    }).join('') + '</ul>' : '') +
      '<form data-pv-add class="pv-add"><input name="t" maxlength="60" placeholder="예: 학원 상담 전화, 체험학습 신청서 제출" aria-label="엄마 할 일"><input name="d" type="date" aria-label="기한"><button class="primary">추가</button></form></section>';
    return h;
  }

  function dashboard() {
    var t = today(), FP = window.FC_PLANNER, P = FP ? FP.get() : {}, share = P.share || {};
    var L = FP ? FP.todays() : [], done = L.filter(function (x) { return x.t.done; }), aAll = L.filter(function (x) { return x.q.p === 'A'; }), aDone = aAll.filter(function (x) { return x.t.done; });
    var foc = (P.focus || []).filter(function (f) { return f.date === t; }), fmin = foc.reduce(function (s, f) { return s + (f.min || 0); }, 0), qs = foc.filter(function (f) { return f.q; });
    var agDue = 0, agDone = 0; Object.keys(P.again || {}).forEach(function (id) { (P.again[id] || []).forEach(function (d) { if (d === t) { agDue++; if ((P.againDone || {})[id + '@' + d]) agDone++; } }); });
    var notes = (ls('fc_notes_v1', []) || []).filter(function (n) { return n && n.date; }), notesToday = notes.filter(function (n) { return n.date === t; });
    var closed = (P.days || {})[t], exN = FP ? FP.examName(t) : '', exSubs = (P.examDays || {})[t] || [];
    var acs = typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(t) : [], row = FP ? FP.todayRow() : [];
    var up = lastUpdate(), who = typeof FC_CHAR !== 'undefined' ? FC_CHAR.avatar('child', 56) : '';
    var dt = new Date(t + 'T12:00:00Z');

    var h = '<section class="pv-head">' + who + '<div><h1>승준이 오늘</h1><p>' + (dt.getUTCMonth() + 1) + '월 ' + dt.getUTCDate() + '일 ' + DN[dt.getUTCDay()] + '요일' + (up ? ' · ' + ago(up) + ' 업데이트' : '') + '</p></div></section>' + momCard();

    // 1. 오늘 진행
    var tiles = [
      ['✅', L.length ? done.length + '/' + L.length : '—', '할 일', L.length ? bar(done.length, L.length) : '<small>아직 안 정함</small>'],
      ['🥇', aAll.length ? aDone.length + '/' + aAll.length : '—', '꼭 할 일(A)', aAll.length ? bar(aDone.length, aAll.length, 'a') : ''],
      ['⏱', foc.length ? foc.length + '회 · ' + fmin + '분' : '—', '집중', qs.length ? '<small>집중도 ' + (Math.round(qs.reduce(function (s, f) { return s + f.q; }, 0) / qs.length * 10) / 10) + '/5</small>' : ''],
      ['🔁', agDue ? agDone + '/' + agDue : '—', '다시 보기', agDue ? bar(agDone, agDue, 'g') : '<small>오늘 없음</small>'],
      ['📒', notesToday.length ? notesToday.length + '개' : '—', '수업 노트', notesToday.length ? '<small>' + notesToday.map(function (n) { return esc(n.subject); }).join('·') + '</small>' : ''],
      ['🌙', closed ? '✓' : '아직', '하루 마무리', '']
    ];
    h += '<section class="card pv-sec"><h2>오늘 진행</h2><div class="pv-tiles">' + tiles.map(function (x) { return '<div class="pv-tile"><span>' + x[0] + '</span><b>' + x[1] + '</b><em>' + x[2] + '</em>' + x[3] + '</div>'; }).join('') + '</div>' +
      (L.length ? '<ul class="pv-tasks">' + L.map(function (x) { return '<li class="' + (x.t.done ? 'done' : '') + '"><span class="pv-chk">' + (x.t.done ? '✓' : '') + '</span><b class="pv-p p' + x.q.p + '">' + x.label + '</b>' + esc(x.t.title) + (x.q.min ? ' <small>' + x.q.min + '분 집중</small>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      (closed && share.reflect ? '<div class="pv-reflect">' + (closed.good ? '<p>👍 잘한 것: ' + esc(closed.good) + '</p>' : '') + (closed.a1 ? '<p>🥇 내일 먼저: ' + esc(closed.a1) + '</p>' : '') + '</div>' : '') + '</section>';

    // 2. 오늘 일정
    var sched = [];
    if (exN) sched.push('📝 <b>' + esc(exN) + '</b>' + (exSubs.length ? ' · ' + exSubs.map(function (s, i) { return (i + 1) + '교시 ' + esc(s); }).join(', ') : ''));
    else if (row.length) sched.push('🏫 수업 ' + row.length + '교시 · ' + row.map(esc).join(' · '));
    else sched.push('🌿 오늘은 수업 없음');
    acs.forEach(function (a) { sched.push('🏃 ' + esc((a.start ? a.start + (a.end ? '~' + a.end : '') + ' ' : '') + a.name) + (a.homework ? ' · 숙제 ' + (a.hwDone ? '<b class="ok">완료</b>' : '<b class="no">아직</b>') : '') + (a.progress ? '<br><small>진도 ' + esc(a.progress) + '</small>' : '')); });
    h += '<section class="card pv-sec"><h2>오늘 일정</h2><ul class="pv-list">' + sched.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></section>';

    // 3. 다가오는 시험·수행평가
    var ups = state.dates.filter(function (x) { return !x.done && gap(x.date) >= 0 && gap(x.date) <= 30; }).sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, 5);
    var nx = FP ? FP.nextExamDay(t) : '';
    var exRows = ups.map(function (x) { return [gap(x.date), exRow(x)]; });
    function exRow(x) {
      var m = (P.dmeta || {})[x.id] || {}, prog = '';
      if (m.p1 && m.p2) { var dn = Math.max(0, Math.min(m.p2, m.prog || m.p1 - 1) - m.p1 + 1), tot = m.p2 - m.p1 + 1; prog = bar(dn, tot) + '<small>범위 ' + dn + '/' + tot + '쪽</small>'; }
      if (x.kind === '수행평가') { var key = '[' + x.subject + ' 수행] ' + (x.title.length > 14 ? x.title.slice(0, 14) + '…' : x.title), st = state.tasks.filter(function (k) { return k.title.indexOf(key) === 0; }), sd = st.filter(function (k) { return k.done; }).length; if (st.length) prog = bar(sd, st.length, 'g') + '<small>단계 ' + sd + '/' + st.length + '</small>'; }
      return '<li><div class="pv-ex-top"><span class="pv-dday' + (gap(x.date) <= 3 ? ' hot' : '') + '">' + (gap(x.date) === 0 ? '오늘' : 'D-' + gap(x.date)) + '</span><b>' + esc(x.title) + '</b><small>' + esc(x.kind) + '</small></div>' + prog + '</li>';
    }
    if (nx && !ups.some(function (x) { return x.date === nx; })) {
      var subs = (P.examDays || {})[nx] || [], prepDone = subs.filter(function (s) { return (P.examPrep || {})[nx + '@' + s]; }).length;
      exRows.push([gap(nx), '<li><div class="pv-ex-top"><span class="pv-dday hot">D-' + gap(nx) + '</span><b>' + dl(nx) + ' 시험</b><small>' + (subs.length ? subs.map(esc).join('·') : '과목 미정') + '</small></div>' + (subs.length ? bar(prepDone, subs.length, 'g') + '<small>시험 대비 ' + prepDone + '/' + subs.length + '과목</small>' : '') + '</li>']);
    }
    exRows.sort(function (a, b) { return a[0] - b[0]; });
    h += '<section class="card pv-sec"><h2>다가오는 시험·수행평가</h2>' + (exRows.length ? '<ul class="pv-ex">' + exRows.map(function (x) { return x[1]; }).join('') + '</ul>' : '<p class="muted">한 달 안에 등록된 시험·수행평가가 없어요.</p>') + '</section>';

    // 4. 이번 주
    var wk = monday(t), we = addD(wk, 6), dots = '', dayN = 0;
    for (var i = 0; i < 7; i++) {
      var d = addD(wk, i), on = (P.focus || []).some(function (f) { return f.date === d; }) || state.tasks.some(function (k) { return k.done && ((P.pri || {})[k.id] && P.pri[k.id].doneAt || k.date) === d; }) || notes.some(function (n) { return n.date === d; }) || state.reviews.some(function (r) { return r.date === d; });
      if (on) dayN++;
      dots += '<span class="' + (on ? 'on' : '') + (d === t ? ' now' : '') + (d > t ? ' fut' : '') + '"><i></i>' + DN[new Date(d + 'T12:00:00Z').getUTCDay()] + '</span>';
    }
    var planW = state.tasks.filter(function (k) { return k.date >= wk && k.date <= we; }), doneW = planW.filter(function (k) { return k.done; });
    var fW = (P.focus || []).filter(function (f) { return f.date >= wk && f.date <= we; }), rocks = ((P.weeks || {})[wk] || {}).rocks || [];
    h += '<section class="card pv-sec"><h2>이번 주</h2><div class="pv-dots">' + dots + '</div>' +
      '<ul class="pv-week"><li><b>' + dayN + '일</b>공부한 날</li><li><b>' + doneW.length + '/' + planW.length + '</b>계획한 일</li><li><b>' + fW.reduce(function (s, f) { return s + f.min; }, 0) + '분</b>집중</li><li><b>' + notes.filter(function (n) { return n.date >= wk; }).length + '개</b>수업 노트</li></ul>' +
      (rocks.length ? '<p class="pv-rocks-h">이번 주 큰 돌</p><ul class="pv-list">' + rocks.map(function (r) { return '<li>' + (r.st === 'done' ? '✅' : r.st === 'no' ? '➖' : '⬜') + ' ' + esc(r.title) + '</li>'; }).join('') + '</ul>' : '') + '</section>';

    // 5. 최근 수업 노트
    var rn = notes.slice(-5).reverse();
    if (rn.length) h += '<section class="card pv-sec"><h2>최근 수업 노트</h2><ul class="pv-notes">' + rn.map(function (n) { return '<li><span>' + (n.kind === 'talk' ? '🎙️' : '📷') + ' ' + esc(n.subject) + '</span><small>' + dl(n.date) + '</small>' + (share.review && n.text ? '<p>' + esc(n.text.slice(0, 120)) + (n.text.length > 120 ? '…' : '') + '</p>' : '') + '</li>'; }).join('') + '</ul>' + (share.review ? '' : '<p class="muted small">노트 내용은 승준이가 공개하면 보여요. 과목·날짜만 표시 중.</p>') + '</section>';

    // 6. 응원
    var ch = (ls(CHEER, []) || []).slice(-1)[0];
    h += '<section class="card pv-sec pv-cheer"><h2>👍 응원 보내기</h2><p class="muted small">기록을 고치지 않고, 승준이 오늘 화면 맨 위에 한 줄로 떠요.</p><div class="pl-chips">' +
      ['오늘도 화이팅! 💪', '시험 잘 봐 🍀', '오늘 정말 수고했어 🌙', '집중하는 모습 멋지다 👏', '간식 준비해둘게 🍓'].map(function (m) { return '<button type="button" data-pv-cheer="' + esc(m) + '">' + esc(m) + '</button>'; }).join('') + '</div>' +
      (ch ? '<p class="muted small">마지막 응원: ' + esc(ch.msg) + ' · ' + ago(ch.at) + '</p>' : '') + '</section>';
    h += '<p class="pv-foot">숫자는 승준이 기록 기준이에요. 대화는 "했어?"보다 "오늘 어땠어?"가 더 좋아요.</p>';
    return h;
  }

  /* 승준 화면: 엄마 응원 한 줄 */
  function cheerLine() {
    var ch = (ls(CHEER, []) || []).slice(-1)[0];
    if (!ch || Date.now() - ch.at > 36 * 3600000 || ls('fc-cheer-seen', 0) >= ch.at) return '';
    return '<div class="pv-cheer-line"><span>💌 엄마: ' + esc(ch.msg) + '</span><button type="button" data-pv-seen="' + ch.at + '" aria-label="닫기">✕</button></div>';
  }

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'today') return;
    var root = document.getElementById('content');
    if (isParent()) { root.innerHTML = dashboard(); return; }
    var c = cheerLine(); if (c) root.insertAdjacentHTML('afterbegin', c);
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.dataset.pvCheer) {
      var a = ls(CHEER, []) || []; a.push({ at: Date.now(), msg: b.dataset.pvCheer.slice(0, 40) });
      try { localStorage.setItem(CHEER, JSON.stringify(a.slice(-20))); } catch (er) {}
      if (typeof FamilySync !== 'undefined' && FamilySync.pushNow) FamilySync.pushNow();
      notice('응원을 보냈어요. 승준이 화면에 떠요 💌'); render(); return;
    }
    if (b.dataset.pvDel) { var v0 = mom(); v0.items = v0.items.filter(function (x) { return x.id !== b.dataset.pvDel; }); saveMom(v0); render(); return; }
    if (b.dataset.pvSeen) { try { localStorage.setItem('fc-cheer-seen', b.dataset.pvSeen); } catch (er) {} b.closest('.pv-cheer-line').remove(); }
  });

  document.addEventListener('change', function (e) {
    var el = e.target, v = mom(), t = today();
    if (el.dataset && el.dataset.pvCk) { var c = v.checks[t] || (v.checks[t] = {}); if (el.checked) c[el.dataset.pvCk] = 1; else delete c[el.dataset.pvCk]; saveMom(v); setTimeout(render, 250); }
    if (el.dataset && el.dataset.pvItem) { v.items.forEach(function (x) { if (x.id === el.dataset.pvItem) { x.done = el.checked; x.doneAt = el.checked ? t : ''; } }); saveMom(v); setTimeout(render, 250); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches || !f.matches('[data-pv-add]')) return; e.preventDefault();
    var title = f.elements.t.value.trim().slice(0, 60); if (!title) return;
    var v = mom(); v.items.push({ id: Math.random().toString(36).slice(2, 10), title: title, due: /^\d{4}-\d{2}-\d{2}$/.test(f.elements.d.value) ? f.elements.d.value : '', done: false }); saveMom(v); render();
  });
  var css = document.createElement('style');
  css.textContent =
    '.pv-mom{background:linear-gradient(135deg,#fffaf0,#fff)!important;box-shadow:0 0 0 1.5px #f3dfb8!important}.pv-mlist{list-style:none;margin:0;padding:0;display:grid;gap:4px}.pv-mlist li{display:flex;align-items:center;gap:6px;border-bottom:1px solid #f3f0e8;padding:6px 0}.pv-mlist li:last-child{border-bottom:0}.pv-mlist label{flex:1;display:flex!important;align-items:center;gap:8px;margin:0!important;font-weight:500!important;cursor:pointer}.pv-mlist input{width:22px;min-height:22px;flex:none}.pv-mlist span:last-child{display:grid}.pv-mlist b{font-size:14.5px;font-weight:600}.pv-mlist small{font-size:12px;color:#8a879a}.pv-mlist li.done b{text-decoration:line-through;color:#a3a0b2}.pv-mi{flex:none;font-size:16px}.pv-add{display:grid;grid-template-columns:1fr 130px auto;gap:6px;margin-top:8px}.pv-add input{min-height:42px!important;font-size:14px}@media(max-width:420px){.pv-add{grid-template-columns:1fr 1fr}.pv-add button{grid-column:1/-1}}' +
    '.pv-head{display:flex;align-items:center;gap:12px;margin:4px 0 12px}.pv-head h1{font-size:23px;margin:0;font-weight:800}.pv-head p{margin:2px 0 0;color:#7d7a8c;font-size:13px}' +
    '.pv-sec h2{font-size:16px!important;margin:0 0 10px!important}.pv-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pv-tile{background:#f7f6fb;border-radius:14px;padding:10px 8px;display:grid;gap:2px;align-content:start;min-height:92px}.pv-tile span{font-size:16px}.pv-tile b{font-size:19px;font-weight:800}.pv-tile em{font-style:normal;font-size:12px;color:#6b6880}.pv-tile small{font-size:11px;color:#8a879a;line-height:1.3}' +
    '.pv-bar{height:6px;border-radius:4px;background:#e6e3ef;overflow:hidden;margin-top:4px}.pv-bar i{display:block;height:100%;background:#6a55e0;border-radius:4px}.pv-bar.a i{background:#e0556f}.pv-bar.g i{background:#2fa36b}' +
    '.pv-tasks{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px}.pv-tasks li{display:flex;align-items:center;gap:8px;font-size:14px}.pv-tasks li.done{color:#9a97ab;text-decoration:line-through}.pv-chk{flex:none;width:20px;height:20px;border-radius:6px;border:1.5px solid #cfc8ea;display:grid;place-items:center;font-size:12px;color:#fff}.pv-tasks li.done .pv-chk{background:#6a55e0;border-color:#6a55e0}' +
    '.pv-p{font-size:11px;padding:2px 6px;border-radius:6px;background:#eef0ff;color:#4a55c7}.pv-p.pA{background:#ffe4e4;color:#c0392b}.pv-p.pC{background:#f1f1f4;color:#888}.pv-tasks small{color:#8a879a;font-size:11.5px}' +
    '.pv-reflect{margin-top:10px;background:#fff7e8;border-radius:12px;padding:8px 12px;font-size:13.5px}.pv-reflect p{margin:2px 0}' +
    '.pv-list{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:14px;line-height:1.5}.pv-list .ok{color:#1f7a55}.pv-list .no{color:#c0392b}.pv-list small{color:#8a879a}' +
    '.pv-ex{list-style:none;margin:0;padding:0;display:grid;gap:10px}.pv-ex-top{display:flex;align-items:center;gap:8px;font-size:14px}.pv-ex-top small{color:#8a879a;margin-left:auto;font-size:12px}.pv-dday{font:800 12px/1 system-ui;background:#efe9ff;color:#5b45d6;border-radius:8px;padding:5px 7px;flex:none}.pv-dday.hot{background:#ffe4e4;color:#c0392b}.pv-ex small{font-size:11.5px;color:#8a879a}' +
    '.pv-dots{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:12px;color:#8a879a;gap:4px}.pv-dots i{display:block;width:24px;height:24px;margin:0 auto 4px;border-radius:50%;background:#efedf5}.pv-dots .on i{background:#6a55e0}.pv-dots .now{color:#5b45d6;font-weight:800}.pv-dots .fut i{background:#f7f6fa;border:1px dashed #dcd9e6}' +
    '.pv-week{list-style:none;margin:12px 0 0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center}.pv-week li{background:#f7f6fb;border-radius:12px;padding:8px 2px;font-size:11.5px;color:#6b6880}.pv-week b{display:block;font-size:17px;color:#22202e}.pv-rocks-h{font-size:13px;font-weight:700;margin:12px 0 6px}' +
    '.pv-notes{list-style:none;margin:0;padding:0;display:grid;gap:8px}.pv-notes li{border-bottom:1px solid #f0eff5;padding-bottom:8px;font-size:14px}.pv-notes small{color:#8a879a;margin-left:6px}.pv-notes p{margin:4px 0 0;font-size:13px;color:#4a475c}' +
    '.pv-cheer{background:linear-gradient(135deg,#fff3f6,#f4f0ff)!important}.pv-foot{font-size:12px;color:#a3a0b2;margin:4px 2px 10px}' +
    '.pv-cheer-line{display:flex;align-items:center;gap:8px;background:#fff0f4;border-radius:14px;padding:10px 12px;margin:0 0 10px;font-size:14.5px;font-weight:700;color:#b4475a}.pv-cheer-line span{flex:1}.pv-cheer-line button{min-height:30px!important;width:30px;padding:0!important;border:0!important;background:transparent!important;color:#b4475a!important}';
  document.head.appendChild(css);
  if (typeof render === 'function') render();
})();
