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

    var h = '<section class="pv-head">' + who + '<div><h1>승준이 오늘</h1><p>' + (dt.getUTCMonth() + 1) + '월 ' + dt.getUTCDate() + '일 ' + DN[dt.getUTCDay()] + '요일' + (up ? ' · ' + ago(up) + ' 업데이트' : '') + '</p></div></section>';

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
    if (b.dataset.pvSeen) { try { localStorage.setItem('fc-cheer-seen', b.dataset.pvSeen); } catch (er) {} b.closest('.pv-cheer-line').remove(); }
  });

  var css = document.createElement('style');
  css.textContent =
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
