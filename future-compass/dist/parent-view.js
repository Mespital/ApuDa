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
    v.reqs = (v.reqs || []).filter(function (r) { return Date.now() - r.at < 10 * 86400000; }).slice(-20);
    try { localStorage.setItem(MOM, JSON.stringify(v)); } catch (e) {}
    if (typeof FamilySync !== 'undefined' && FamilySync.pushNow) FamilySync.pushNow();
  }
  function autoChecks() {
    var t = today(), FP = window.FC_PLANNER, P = FP ? FP.get() : {}, out = [], CAL = window.FC_CAL;
    var h = new Date(Date.now() + 9 * 3600000).getUTCHours();
    var nd = CAL ? CAL.nextSchoolDay(t) : addD(t, 1), w = new Date(nd + 'T12:00:00Z').getUTCDay();
    // 내일(다음 등교일) 준비물
    var bag = w >= 1 && w <= 5 ? String(state.bags[w - 1] || '').trim() : '';
    if (bag) out.push({ k: 'bag:' + nd, icon: '🎒', t: dl(nd) + ' 준비물 같이 챙기기: ' + bag, sub: '전날 저녁에 가볍게' });
    // 쉬는 날·학교 행사 (7일 안)
    for (var i = 1; i <= 7; i++) {
      var d = addD(t, i), off = CAL ? CAL.offDay(d) : null;
      if (off && !off.weekend) out.push({ k: 'off:' + d, icon: '🌿', t: dl(d) + ' ' + off.name + ' — 학교 일정 확인', sub: '학교 안 가는 날 · 돌봄·외출 계획' });
      (CAL && CAL.schoolEvents ? CAL.schoolEvents(d) : []).forEach(function (ev) {
        if (/고사|평가|시험|체험|수련|축제|상담|설명회|소풍|졸업|입학|방학|단축/.test(ev)) out.push({ k: 'ev:' + d + ':' + ev, icon: /고사|평가|시험/.test(ev) ? '📝' : '📌', t: dl(d) + ' ' + ev.replace(/\(\d학년\)/, ''), sub: /고사|평가|시험/.test(ev) ? '컨디션·수면 챙겨주기' : '가정통신문·준비물 확인해 주기' });
      });
    }
    // 시험 과목 미입력
    var nx = FP ? FP.nextExamDay(addD(t, -1)) : '';
    if (nx && gap(nx) <= 7 && !((P.examDays || {})[nx] || []).length) out.push({ k: 'exsub:' + nx, icon: '🗓️', t: (nx === t ? '오늘' : dl(nx)) + ' 시험 과목 확인 도와주기', sub: '시험 시간표가 나왔는지만 물어봐 주세요', req: { kind: 'subjects', ref: nx, label: dl(nx) + ' 시험 과목' } });
    // 학원 숙제·시간
    (typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(t) : []).forEach(function (a) {
      if (a.homework && !a.hwDone) out.push({ k: 'achw:' + a.id + ':' + t, icon: '📝', t: a.name + ' 숙제 시간 챙겨주기', sub: '숙제: ' + a.homework + ' · ' + (a.start ? a.start + ' 수업 전' : '오늘 수업 전') });
    });
    // 마감 임박 수행평가·과제
    state.dates.filter(function (x) { return !x.done && x.kind !== '시험' && gap(x.date) >= 0 && gap(x.date) <= 3; }).forEach(function (x) {
      out.push({ k: 'due:' + x.id, icon: '⏰', t: x.title + ' ' + (gap(x.date) === 0 ? '오늘' : 'D-' + gap(x.date)) + ' 마감', sub: x.kind + (x.subject ? ' · ' + x.subject : '') + ' — 필요한 준비물이 있는지 물어봐 주세요' });
    });
    // 다시 보기 밀림
    var late = 0; Object.keys(P.again || {}).forEach(function (id) { (P.again[id] || []).forEach(function (d) { if (d < t && d >= addD(t, -3) && !(P.againDone || {})[id + '@' + d]) late++; }); });
    if (late >= 3) out.push({ k: 'again:' + t, icon: '🔁', t: '복습할 조용한 시간 만들어주기', sub: '다시 볼 게 조금 쌓였어요 · "10분만 같이 앉아 있을까?"' });
    // 밤: 하루 마무리
    if (h >= 21 && !(P.days || {})[t]) out.push({ k: 'close:' + t, icon: '🌙', t: '잘 자라는 인사 건네기', sub: '하루 마무리는 승준이가 원할 때 — 재촉하지 않기' });
    return out;
  }
  function momCard() {
    var t = today(), v = mom(), ck = v.checks[t] || {}, auto = autoChecks();
    var items = v.items.filter(function (x) { return !x.done || x.doneAt === t; }).sort(function (a, b) { return (a.done - b.done) || String(a.due || '9').localeCompare(String(b.due || '9')); });
    var left = auto.filter(function (x) { return !ck[x.k]; }).length + items.filter(function (x) { return !x.done; }).length;
    var h = '<section class="card pv-sec pv-mom"><div class="pl-head"><h2>🤝 오늘 도와줄 것</h2><span class="pl-count">' + (left ? left + '개' : '다 챙겼어요 👏') + '</span></div>';
    h += (auto.length ? '<ul class="pv-mlist">' + auto.map(function (x) {
      var on = !!ck[x.k];
      return '<li class="' + (on ? 'done' : '') + '"><label><input type="checkbox" data-pv-ck="' + esc(x.k) + '"' + (on ? ' checked' : '') + '><span class="pv-mi">' + x.icon + '</span><span><b>' + esc(x.t) + '</b><small>' + esc(x.sub) + '</small></span></label>' + (x.req ? reqBtn(x.req) : '') + '</li>';
    }).join('') + '</ul>' : '<p class="muted small">오늘은 따로 도와줄 게 없어요. 기다려 주는 날이에요.</p>');
    h += '<p class="pv-rocks-h">엄마 할 일</p>' + (items.length ? '<ul class="pv-mlist">' + items.map(function (x) {
      return '<li class="' + (x.done ? 'done' : '') + '"><label><input type="checkbox" data-pv-item="' + esc(x.id) + '"' + (x.done ? ' checked' : '') + '><span class="pv-mi">📌</span><span><b>' + esc(x.title) + '</b>' + (x.due ? '<small>' + (gap(x.due) < 0 ? '기한 지남 · ' : gap(x.due) === 0 ? '오늘까지 · ' : 'D-' + gap(x.due) + ' · ') + dl(x.due) + '</small>' : '') + '</span></label><button type="button" class="pl-x" data-pv-del="' + esc(x.id) + '" aria-label="지우기">×</button></li>';
    }).join('') + '</ul>' : '') +
      '<form data-pv-add class="pv-add"><input name="t" maxlength="60" placeholder="예: 학원 상담 전화, 체험학습 신청서 제출" aria-label="엄마 할 일"><input name="d" type="date" aria-label="기한"><button class="primary">추가</button></form></section>';
    return h;
  }

  /* ---------- 확인 요청: 엄마가 직접 고치지 않고 승준이에게 부탁 ---------- */
  function reqs() { return (mom().reqs || []).filter(function (r) { return Date.now() - r.at < 10 * 86400000; }); }
  function reqOpen(r) {
    var P = window.FC_PLANNER ? FC_PLANNER.get() : {};
    if (r.kind === 'subjects') return !((P.examDays || {})[r.ref] || []).length && r.ref >= today();
    if (r.kind === 'range') { var x = state.dates.find(function (d) { return d.id === r.ref; }); var m = (P.dmeta || {})[r.ref] || {}; return x && !x.done && !(m.p1 && m.p2) && !(x.note || '').trim(); }
    return false;
  }
  function reqBtn(q) {
    var sent = reqs().some(function (r) { return r.kind === q.kind && r.ref === q.ref; });
    return '<button type="button" class="pv-req' + (sent ? ' sent' : '') + '" data-pv-req="' + esc(q.kind + '|' + q.ref + '|' + q.label) + '"' + (sent ? ' disabled' : '') + '>' + (sent ? '요청함' : '승준에게 확인 요청') + '</button>';
  }
  function childReqLines() {
    var seen = ls('fc-req-seen', {}) || {};
    return reqs().filter(function (r) { return reqOpen(r) && !seen[r.id]; }).map(function (r) {
      return '<div class="pv-req-line"><span>📮 엄마가 물어봤어: <b>' + esc(r.label) + (r.kind === 'range' ? ' 범위' : '') + '</b> 나왔어? 나왔으면 입력해둘까?</span><div>' +
        (r.kind === 'subjects' ? '<button type="button" class="primary" data-pl-ex-edit="' + esc(r.ref) + '">입력하기</button>' : '<button type="button" class="primary" data-go="dates">입력하러 가기</button>') +
        '<button type="button" data-pv-req-seen="' + esc(r.id) + '">나중에</button></div></div>';
    }).join('');
  }

  /* ---------- 오늘은 어떻게 도와줄까? (관찰·지원·격려 3단계, 빨간 경고 없음) ---------- */
  function guide() {
    var t = today(), FP = window.FC_PLANNER, P = FP ? FP.get() : {}, L = FP ? FP.todays() : [];
    var aDone = L.filter(function (x) { return x.q.p === 'A' && x.t.done; }).length, foc = (P.focus || []).filter(function (f) { return f.date === t; }).length;
    var nt = (ls('fc_notes_v1', []) || []).filter(function (n) { return n && n.date === t; }).length;
    var nx = FP ? FP.nextExamDay(addD(t, -1)) : '', exToday = FP ? FP.examName(t) : '';
    var tomorrowExam = (FP && FP.examName(addD(t, 1))) || state.dates.some(function (x) { return !x.done && x.kind === '시험' && gap(x.date) === 1; });
    var dueSoon = state.dates.filter(function (x) { return !x.done && x.kind !== '시험' && gap(x.date) >= 0 && gap(x.date) <= 1; })[0];
    if (tomorrowExam) return { lv: 'y', icon: '🟡', title: '가볍게 도와주면 좋은 날', msg: '내일 시험이에요. 공부량보다 수면·준비물이 더 중요해요.', one: '저녁 일정을 가볍게 하고, 준비물만 같이 확인해 주세요.', ask: '오늘은 새로운 것보다 본 것만 정리하고 일찍 자자.' };
    if (nx && nx !== t && gap(nx) <= 7 && !((P.examDays || {})[nx] || []).length) return { lv: 'y', icon: '🟡', title: '가볍게 확인해 주세요', msg: dl(nx) + ' 시험 과목이 아직 입력되지 않았어요. 공부 여부보다 시험 시간표가 나왔는지만 물어봐 주세요.', one: '시험 과목만 확인해 주세요.', ask: '시험 시간표 나왔어? 나오면 앱에 같이 넣어두자.' };
    if (dueSoon) return { lv: 'y', icon: '🟡', title: '가볍게 확인해 주세요', msg: dueSoon.title + ' 마감이 ' + (gap(dueSoon.date) ? '내일' : '오늘') + '이에요.', one: '필요한 준비물·출력물이 있는지만 물어봐 주세요.', ask: '내일 낼 거 준비할 거 있어? 필요한 거 있으면 말해.' };
    if (exToday) return { lv: 'b', icon: '🔵', title: '격려가 좋은 날', msg: '오늘은 ' + exToday + ' 보는 날이에요. 점수 이야기는 나중에 해도 돼요.', one: '결과보다 오늘 버틴 것을 인정해 주세요.', ask: '시험 보느라 고생했어. 오늘 제일 어려웠던 게 뭐였어?' };
    if (aDone || foc || nt) return { lv: 'b', icon: '🔵', title: '격려가 좋은 날', msg: (aDone ? '오늘 꼭 할 일(A)을 ' + aDone + '개 끝냈어요. ' : foc ? '오늘 집중을 ' + foc + '번 했어요. ' : '오늘 수업 노트를 남겼어요. ') + '결과보다 시작한 것을 인정해 주세요.', one: '구체적인 행동 하나를 칭찬해 주세요.', ask: aDone ? '하나 끝낸 거 좋다. 시작한 게 제일 어려운 건데.' : foc ? '집중했네. 잠깐 쉬어도 돼.' : '배운 걸 정리해둔 거 멋지다.' };
    return { lv: 'g', icon: '🟢', title: '기다려 주세요', msg: L.length ? '할 일이 정리되어 있고 승준이가 스스로 진행 중이에요.' : '오늘은 아직 기록이 없어요. 기록이 없다고 공부하지 않은 건 아니에요.', one: '오늘은 스스로 해볼 시간을 주세요.', ask: '오늘 하루 어땠어?' };
  }
  function guideCard() {
    var g = guide();
    return '<section class="pv-guide lv-' + g.lv + '"><p class="pv-g-h">오늘은 어떻게 도와줄까?</p><h2>' + g.icon + ' ' + esc(g.title) + '</h2><p>' + esc(g.msg) + '</p>' +
      '<div class="pv-g-one"><b>엄마가 할 한 가지</b>' + esc(g.one) + '</div>' +
      '<div class="pv-g-ask"><b>승준에게 이렇게 물어보기</b><q>' + esc(g.ask) + '</q><div class="pv-g-btns"><button type="button" data-pv-copy="' + esc(g.ask) + '">📋 복사</button><button type="button" data-pv-cheer="' + esc(g.ask) + '">💌 앱으로 보내기</button></div></div></section>';
  }

  /* ---------- 엄마에게 오늘 한 가지 ---------- */
  var TIPS = [
    ['"몇 시간 했어?"보다 "오늘 제일 어려웠던 게 뭐였어?"가 좋아요.', '공부시간을 물으면 평가로 느끼기 쉽고, 어려웠던 점을 물으면 대화가 시작돼요.'],
    ['지금 당장 하라고 하기보다 언제 시작할지 물어보세요.', '시작 시점을 스스로 정하면 실제로 시작할 가능성이 높아져요.'],
    ['기록이 없다고 공부하지 않은 것은 아니에요.', '앱 기록은 일부예요. 먼저 "오늘 어땠어?"로 물어봐 주세요.'],
    ['결과보다 행동을 칭찬하세요.', '"잘했어"보다 "끝까지 앉아 있던 거 좋더라"처럼 구체적인 행동이 다음 행동을 만들어요.'],
    ['계획을 못 지켰다면, 계획이 너무 컸는지 같이 봐 주세요.', '"왜 못했어?"보다 "내일은 하나만 정해볼까?"가 다시 시작하게 해요.'],
    ['미루기가 반복되면 할 일을 더 잘게 쪼개도록 도와주세요.', '"수학 공부"보다 "유형 3개 풀기"처럼 작을수록 시작이 쉬워요.'],
    ['공부 이야기를 하지 않는 시간도 필요해요.', '저녁 한 끼는 공부 질문 없이 보내 보세요. 신뢰가 쌓여야 대화가 쉬워져요.']
  ];
  function tipCard() {
    var t = today(), FP = window.FC_PLANNER, nx = FP ? FP.nextExamDay(addD(t, -1)) : '', ex = state.dates.filter(function (x) { return !x.done && x.kind === '시험' && gap(x.date) >= 0; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
    var dd = Math.min(nx ? gap(nx) : 99, ex ? gap(ex.date) : 99), tip;
    if (dd === 0) tip = ['시험날엔 점수보다 "어떤 문제가 어려웠어?"를 먼저 물어보세요.', '점수 이야기를 먼저 하면 방어적으로 느끼기 쉬워요.'];
    else if (dd === 1) tip = ['시험 전날엔 공부량보다 수면·준비물을 챙겨 주세요.', '새로운 것보다 본 것 정리가 점수에 더 남아요.'];
    else if (dd <= 7) tip = ['시험 일주일 전엔 새 계획보다 실행 여부를 가볍게 확인하세요.', '"다 했어?"보다 "범위 중에 남은 게 있어?"가 좋아요.'];
    else if (dd <= 14) tip = ['시험 2주 전에는 점수보다 범위를 확인해 주세요.', '"몇 점 받을 것 같아?"보다 "범위는 다 나왔어?"가 실제 준비에 도움이 돼요.'];
    else tip = TIPS[(Number(t.slice(8)) + Number(t.slice(5, 7))) % TIPS.length];
    return '<section class="card pv-sec pv-tip"><h2>🌷 엄마에게 오늘 한 가지</h2><p class="pv-tip-q">' + esc(tip[0]) + '</p><p class="muted small">' + esc(tip[1]) + '</p></section>';
  }

  /* ---------- 상황별 추천 응원 (왜 추천했는지 함께) ---------- */
  function recCheers() {
    var t = today(), FP = window.FC_PLANNER, P = FP ? FP.get() : {}, L = FP ? FP.todays() : [], out = [];
    var aDone = L.some(function (x) { return x.q.p === 'A' && x.t.done; }), foc = (P.focus || []).filter(function (f) { return f.date === t; });
    var nx = FP ? FP.nextExamDay(addD(t, -1)) : '', ex = state.dates.filter(function (x) { return !x.done && x.kind === '시험' && gap(x.date) >= 0; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
    var dd = Math.min(nx ? gap(nx) : 99, ex ? gap(ex.date) : 99), exToday = FP && FP.examName(t);
    if (exToday) out.push(['점수보다 오늘 시험에서 뭐가 어려웠는지가 더 궁금해.', '오늘 시험날이라 결과보다 과정을 묻는 말을 추천했어요.']);
    else if (dd === 1) out.push(['오늘은 새로운 것보다 본 것만 정리하고 일찍 자자.', '내일 시험이라 수면을 챙기는 말을 추천했어요.']);
    else if (dd <= 7) out.push(['일주일 남았네. 급하게 다 하려고 하지 말고 하나씩 하자.', '시험 D-' + dd + '라 부담을 줄이는 말을 추천했어요.']);
    else if (dd <= 14) out.push(['시험 아직 시간 있어. 오늘 하나씩만 하자.', '시험 D-' + dd + '라 차분하게 시작하는 말을 추천했어요.']);
    if (aDone) out.push(['하나 끝낸 거 좋다. 시작한 게 제일 어려운 건데.', '오늘 꼭 할 일(A)을 끝내서 행동을 인정하는 말을 추천했어요.']);
    else if (L.length >= 5) out.push(['오늘은 하나만 끝내도 충분해.', '오늘 등록된 할 일이 많아 부담을 줄이는 말을 추천했어요.']);
    else if (L.length && !L.some(function (x) { return x.t.done; })) out.push(['오늘 제일 중요한 거 하나만 먼저 해보자.', '아직 시작 전이라 첫걸음을 응원하는 말을 추천했어요.']);
    if (foc.length) out.push([foc[foc.length - 1].min + '분 집중했네. 잠깐 쉬어도 돼.', '집중 기록이 있어서 쉬어도 된다는 말을 추천했어요.']);
    if (!L.length && !foc.length) out.push(['오늘 하루 어땠어? 공부 얘기는 나중에 해도 돼.', '오늘 기록이 없어 공부보다 안부를 묻는 말을 추천했어요.']);
    out.push(['공부 끝나면 맛있는 거 먹자 🍗', '부담 없이 기분을 올려주는 말이에요.']);
    return out.slice(0, 3);
  }

  /* ---------- 부드럽게 바꾸기 ---------- */
  var SOFTEN = [
    [/몇\s*시간|얼마나\s*했|몇\s*분/, '오늘 공부하면서 제일 어려웠던 건 뭐였어?'],
    [/다\s*했어|준비\s*다|끝냈어\?/, '시험 범위 중에서 아직 남은 게 있어?'],
    [/왜\s*(또\s*)?안|또\s*안|왜\s*못/, '계획이 너무 많았던 걸까? 내일 하나만 다시 정해볼까?'],
    [/공부\s*(좀\s*)?해|빨리\s*해|당장/, '오늘 언제쯤 시작할 생각이야?'],
    [/폰\s*(그만|좀)|게임\s*(그만|좀)/, '폰은 몇 시까지 하고 시작할지 정해볼래?'],
    [/점수|등급|몇\s*점/, '이번에 제일 어려웠던 부분이 뭐였어?']
  ];
  function softer(msg) { for (var i = 0; i < SOFTEN.length; i++) if (SOFTEN[i][0].test(msg)) return SOFTEN[i][1]; return ''; }

  /* ---------- 엄마 코치: 오늘 뭐라고 말하지? ---------- */
  var COACH = [
    [/안\s*해|공부를?\s*안|놀기만|게을/, '공부 여부를 확인하기보다 시험 범위나 할 일이 정해졌는지 먼저 물어보는 게 좋아요.', '시험 범위 나왔어? 아직이면 나오면 같이 한번 보자.'],
    [/성적|점수|떨어|망쳤/, '점수 이야기를 먼저 하면 방어적으로 느낄 수 있어요. 어떤 문제가 어려웠는지부터요.', '이번 시험에서 제일 어려웠던 부분이 뭐였어?'],
    [/폰|게임|유튜브|휴대폰/, '빼앗기보다 시간을 스스로 정하게 하면 지키는 경우가 많아요.', '폰은 몇 시까지 하고 시작할지 네가 정해볼래?'],
    [/피곤|힘들|지쳐|스트레스|우울/, '오늘은 공부 이야기를 쉬어도 돼요. 컨디션이 먼저예요.', '오늘은 공부보다 네가 괜찮은지가 더 중요해.'],
    [/학원/, '학원 숙제·진도는 현황판에서 보이니, 대화는 힘든 점 위주로 해 보세요.', '요즘 학원에서 제일 힘든 게 뭐야?'],
    [/계획|못\s*지|미루/, '계획이 너무 컸을 수 있어요. 더 작게 쪼개도록 도와주세요.', '내일은 딱 하나만 정해볼까? 제일 작은 걸로.'],
    [/시험|중간|기말|학평/, '시험 2주 전엔 범위 확인, 1주 전엔 실행 확인, 전날엔 수면·준비물이에요.', '시험 준비하면서 도와줄 거 있으면 말해.'],
    [/칭찬|잘했|기특/, '결과보다 구체적인 행동을 칭찬하면 다음 행동으로 이어져요.', '끝까지 앉아서 한 거 진짜 좋더라.']
  ];
  function coach(q) {
    for (var i = 0; i < COACH.length; i++) if (COACH[i][0].test(q)) return COACH[i];
    return [null, '이럴 땐 판단보다 질문 하나로 시작해 보세요. 듣는 시간이 길수록 대화가 쉬워져요.', '요즘 공부하면서 제일 신경 쓰이는 게 뭐야?'];
  }
  var coachAns = null;
  function coachCard() {
    return '<section class="card pv-sec pv-coach"><h2>🐾 오늘 뭐라고 말하지?</h2><form data-pv-coach class="pv-add pv-cheer-form"><input name="q" maxlength="80" placeholder="예: 시험 12일 남았는데 공부를 안 하는 것 같아" aria-label="고민"><button class="primary">물어보기</button></form>' +
      (coachAns ? '<div class="pv-coach-a"><p>' + esc(coachAns[1]) + '</p><div class="pv-g-ask"><b>추천 문장</b><q>' + esc(coachAns[2]) + '</q><div class="pv-g-btns"><button type="button" data-pv-copy="' + esc(coachAns[2]) + '">📋 복사</button><button type="button" data-pv-cheer="' + esc(coachAns[2]) + '">💌 앱으로 보내기</button></div></div></div>' : '<p class="muted small">고민을 적으면 대화를 시작하기 좋은 말을 추천해 드려요. (미리 준비한 안내, 밖으로 보내지 않아요)</p>') + '</section>';
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

    var h = '<section class="pv-head">' + who + '<div><h1>승준이 오늘</h1><p>' + (dt.getUTCMonth() + 1) + '월 ' + dt.getUTCDate() + '일 ' + DN[dt.getUTCDay()] + '요일' + (up ? ' · ' + ago(up) + ' 업데이트' : '') + '</p></div></section><p class="pv-motto">승준의 공부는 승준이에게. 엄마에게는 오늘 어떻게 도와주면 좋을지만 알려드릴게요.</p>' + guideCard() + momCard();

    // 1. 오늘 진행
    var tiles = [
      ['✅', L.length ? done.length + '/' + L.length : '', '할 일', L.length ? bar(done.length, L.length) : '<small>아직 안 정했어요</small>'],
      ['🥇', aAll.length ? aDone.length + '/' + aAll.length : '', '꼭 할 일(A)', aAll.length ? bar(aDone.length, aAll.length, 'a') : '<small>아직 기록 없음</small>'],
      ['⏱', foc.length ? foc.length + '회 · ' + fmin + '분' : '', '집중', qs.length ? '<small>집중도 ' + (Math.round(qs.reduce(function (s, f) { return s + f.q; }, 0) / qs.length * 10) / 10) + '/5</small>' : foc.length ? '' : '<small>아직 기록 없음</small>'],
      ['🔁', agDue ? agDone + '/' + agDue : '', '다시 보기', agDue ? bar(agDone, agDue, 'g') : '<small>오늘 예정 없음</small>'],
      ['📒', notesToday.length ? notesToday.length + '개' : '', '수업 노트', notesToday.length ? '<small>' + notesToday.map(function (n) { return esc(n.subject); }).join('·') + '</small>' : '<small>아직 기록 없음</small>'],
      ['🌙', closed ? '✓' : '', '하루 마무리', closed ? '' : '<small>아직 기록 없음</small>']
    ];
    h += '<section class="card pv-sec"><h2>오늘 진행</h2><div class="pv-tiles">' + tiles.map(function (x) { return '<div class="pv-tile' + (x[1] ? '' : ' none') + '"><span>' + x[0] + '</span>' + (x[1] ? '<b>' + x[1] + '</b>' : '') + '<em>' + x[2] + '</em>' + x[3] + '</div>'; }).join('') + '</div><p class="pv-note">앱에 기록된 것만 보여요. 실제 공부량과 다를 수 있어요.</p>' +
      (L.length ? '<ul class="pv-tasks">' + L.map(function (x) { return '<li class="' + (x.t.done ? 'done' : '') + '"><span class="pv-chk">' + (x.t.done ? '✓' : '') + '</span><b class="pv-p p' + x.q.p + '">' + x.label + '</b>' + esc(x.t.title) + '</li>'; }).join('') + '</ul>' : '') +
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
      return '<li><div class="pv-ex-top"><span class="pv-dday' + (gap(x.date) <= 3 ? ' hot' : '') + '">' + (gap(x.date) === 0 ? '오늘' : 'D-' + gap(x.date)) + '</span><b>' + esc(x.title) + '</b><small>' + esc(x.kind) + '</small></div>' + prog + (x.kind === '시험' && !(m.p1 && m.p2) && !(x.note || '').trim() ? '<div class="pv-req-row"><small>범위가 아직 없어요</small>' + reqBtn({ kind: 'range', ref: x.id, label: x.title }) + '</div>' : '') + '</li>';
    }
    if (nx && !ups.some(function (x) { return x.date === nx; })) {
      var subs = (P.examDays || {})[nx] || [], prepDone = subs.filter(function (s) { return (P.examPrep || {})[nx + '@' + s]; }).length;
      exRows.push([gap(nx), '<li><div class="pv-ex-top"><span class="pv-dday hot">D-' + gap(nx) + '</span><b>' + dl(nx) + ' 시험</b><small>' + (subs.length ? subs.map(esc).join('·') : '과목 미정') + '</small></div>' + (subs.length ? bar(prepDone, subs.length, 'g') + '<small>시험 대비 ' + prepDone + '/' + subs.length + '과목</small>' : '<div class="pv-req-row"><small>시험 과목이 아직 없어요</small>' + reqBtn({ kind: 'subjects', ref: nx, label: dl(nx) + ' 시험 과목' }) + '</div>') + '</li>']);
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
      '<ul class="pv-week"><li><b>' + (dayN ? dayN + '일' : '–') + '</b>기록한 날</li><li><b>' + (planW.length ? doneW.length + '/' + planW.length : '–') + '</b>계획한 일</li><li><b>' + (fW.length ? fW.reduce(function (s, f) { return s + f.min; }, 0) + '분' : '–') + '</b>집중</li><li><b>' + (notes.filter(function (n) { return n.date >= wk; }).length || '–') + '</b>수업 노트</li></ul>' + (dayN || planW.length ? '' : '<p class="pv-note">이번 주는 아직 기록이 없어요. 기록이 없다고 공부하지 않은 건 아니에요.</p>') +
      (rocks.length ? '<p class="pv-rocks-h">이번 주 큰 돌</p><ul class="pv-list">' + rocks.map(function (r) { return '<li>' + (r.st === 'done' ? '✅' : r.st === 'no' ? '➖' : '⬜') + ' ' + esc(r.title) + '</li>'; }).join('') + '</ul>' : '') + '</section>';

    // 5. 최근 수업 노트
    var rn = notes.slice(-5).reverse();
    if (rn.length) h += '<section class="card pv-sec"><h2>최근 수업 노트</h2><ul class="pv-notes">' + rn.map(function (n) { return '<li><span>' + (n.kind === 'talk' ? '🎙️' : '📷') + ' ' + esc(n.subject) + '</span><small>' + dl(n.date) + '</small>' + (share.review && n.text ? '<p>' + esc(n.text.slice(0, 120)) + (n.text.length > 120 ? '…' : '') + '</p>' : '') + '</li>'; }).join('') + '</ul>' + (share.review ? '' : '<p class="muted small">노트 내용은 승준이가 공개하면 보여요. 과목·날짜만 표시 중.</p>') + '</section>';

    // 6. 응원
    var ch = (ls(CHEER, []) || []).slice(-1)[0], sentToday = (ls(CHEER, []) || []).filter(function (c) { return new Date(c.at + 9 * 3600000).toISOString().slice(0, 10) === t; }).length;
    var focusing = state.timer && state.timer.end > Date.now(), rc = recCheers();
    h += tipCard();
    h += '<section class="card pv-sec pv-cheer"><h2>👍 응원 보내기</h2>' +
      (focusing ? '<p class="pv-focusing">⏱ 지금 집중 중이에요 (약 ' + Math.ceil((state.timer.end - Date.now()) / 60000) + '분 남음). 보내면 집중이 끝난 뒤에 보여요.</p>' : '') +
      (sentToday >= 2 ? '<p class="pv-focusing">오늘은 이미 ' + sentToday + '번 보냈어요. 하루 1~2번이 부담 없이 좋아요.</p>' : '<p class="muted small">하루 1~2번이 좋아요. 승준이 오늘 화면 맨 위에 한 줄로 떠요.</p>') +
      '<p class="pv-rocks-h">오늘 추천</p><ul class="pv-rec">' + rc.map(function (r) { return '<li><button type="button" data-pv-cheer="' + esc(r[0]) + '">' + esc(r[0]) + '</button><small>' + esc(r[1]) + '</small></li>'; }).join('') + '</ul>' +
      '<p class="pv-rocks-h">자주 쓰는 말</p><div class="pl-chips">' +
      ['오늘도 화이팅! 💪', '시험 잘 봐 🍀', '오늘 정말 수고했어 🌙', '집중하는 모습 멋지다 👏', '간식 준비해둘게 🍓'].map(function (m) { return '<button type="button" data-pv-cheer="' + esc(m) + '">' + esc(m) + '</button>'; }).join('') + '</div>' +
      '<form data-pv-cheer-form class="pv-add pv-cheer-form"><input name="m" maxlength="40" placeholder="직접 써서 보내기 (예: 오늘 저녁 치킨이다 🍗)" aria-label="응원 메시지"><button class="primary">보내기</button></form>' +
      (ch ? '<p class="muted small">마지막 응원: ' + esc(ch.msg) + ' · ' + ago(ch.at) + '</p>' : '') + '</section>';
    h += coachCard();
    h += '<p class="pv-foot">숫자는 승준이 기록 기준이에요. 대화는 "했어?"보다 "오늘 어땠어?"가 더 좋아요.</p>';
    return h;
  }

  /* 승준 화면: 엄마 응원 한 줄 */
  function cheerLine() {
    var ch = (ls(CHEER, []) || []).slice(-1)[0];
    if (!ch || Date.now() - ch.at > 36 * 3600000 || ls('fc-cheer-seen', 0) >= ch.at || (ch.after && Date.now() < ch.after)) return '';
    return '<div class="pv-cheer-line"><span>💌 엄마: ' + esc(ch.msg) + '</span><button type="button" data-pv-seen="' + ch.at + '" aria-label="닫기">✕</button></div>';
  }

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'today') return;
    var root = document.getElementById('content');
    if (isParent()) {
      root.innerHTML = dashboard();
      // 엄마가 먼저 볼 순서: 오늘 진행(통계) → 이번 주 → 엄마 체크 → 일정·시험·노트·응원
      var secs = [].slice.call(root.querySelectorAll('.pv-sec')), find = function (t) { return secs.filter(function (x) { var h2 = x.querySelector('h2'); return h2 && h2.textContent.indexOf(t) >= 0; })[0]; };
      var today0 = find('오늘 진행'), week = find('이번 주'), mc = root.querySelector('.pv-mom');
      if (today0 && week) today0.insertAdjacentElement('afterend', week);
      if (week && mc) week.insertAdjacentElement('afterend', mc);
      return;
    }
    var c = cheerLine() + childReqLines(); if (c) root.insertAdjacentHTML('afterbegin', c);
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.dataset.pvCheer && b.closest('#content')) {
      sendCheer(b.dataset.pvCheer); return;
    }
    if (b.dataset.pvSoftUse) { sendCheer(b.dataset.pvSoftUse); return; }
    if (b.dataset.pvSoftKeep) { sendCheer(b.dataset.pvSoftKeep); return; }
    if (b.dataset.pvCopy) { try { navigator.clipboard.writeText(b.dataset.pvCopy).then(function () { notice('복사했어요. 말로 건네도 좋아요.'); }); } catch (er) { notice(b.dataset.pvCopy); } return; }
    if (b.dataset.pvReq) { var pr = b.dataset.pvReq.split('|'), v1 = mom(); v1.reqs = (v1.reqs || []).filter(function (r) { return Date.now() - r.at < 10 * 86400000; }); v1.reqs.push({ id: Math.random().toString(36).slice(2, 10), at: Date.now(), kind: pr[0], ref: pr[1], label: pr.slice(2).join('|') }); saveMom(v1); notice('승준이 화면에 확인 요청을 띄웠어요. 직접 고치지 않아도 돼요.'); render(); return; }
    if (b.dataset.pvReqSeen) { var sn = ls('fc-req-seen', {}) || {}; sn[b.dataset.pvReqSeen] = 1; try { localStorage.setItem('fc-req-seen', JSON.stringify(sn)); } catch (er) {} b.closest('.pv-req-line').remove(); return; }
    if (b.dataset.pvDel) { var v0 = mom(); v0.items = v0.items.filter(function (x) { return x.id !== b.dataset.pvDel; }); saveMom(v0); render(); return; }
    if (b.dataset.pvSeen) { try { localStorage.setItem('fc-cheer-seen', b.dataset.pvSeen); } catch (er) {} b.closest('.pv-cheer-line').remove(); }
  });

  document.addEventListener('change', function (e) {
    var el = e.target, v = mom(), t = today();
    if (el.dataset && el.dataset.pvCk) { var c = v.checks[t] || (v.checks[t] = {}); if (el.checked) c[el.dataset.pvCk] = 1; else delete c[el.dataset.pvCk]; saveMom(v); setTimeout(render, 250); }
    if (el.dataset && el.dataset.pvItem) { v.items.forEach(function (x) { if (x.id === el.dataset.pvItem) { x.done = el.checked; x.doneAt = el.checked ? t : ''; } }); saveMom(v); setTimeout(render, 250); }
  });
  function sendCheer(msg, typed) {
    msg = String(msg || '').trim().slice(0, 60); if (!msg) return;
    if (typed) { var sf = softer(msg); if (sf) { softBox(msg, sf); return; } }
    var a = ls(CHEER, []) || [], t = today(), n = a.filter(function (c) { return new Date(c.at + 9 * 3600000).toISOString().slice(0, 10) === t; }).length;
    if (n >= 2 && !confirm('오늘 이미 ' + n + '번 보냈어요. 그래도 보낼까요?')) return;
    var item = { at: Date.now(), msg: msg }, focusing = state.timer && state.timer.end > Date.now();
    if (focusing) item.after = state.timer.end;
    a.push(item);
    try { localStorage.setItem(CHEER, JSON.stringify(a.slice(-20))); } catch (er) {}
    if (typeof FamilySync !== 'undefined' && FamilySync.pushNow) FamilySync.pushNow();
    notice(focusing ? '집중이 끝나면 승준이 화면에 떠요 💌' : '응원을 보냈어요. 승준이 화면에 떠요 💌'); render();
  }
  function softBox(orig, sf) {
    var box = document.querySelector('.pv-soft'); if (box) box.remove();
    var f = document.querySelector('[data-pv-cheer-form]'); if (!f) return;
    f.insertAdjacentHTML('afterend', '<div class="pv-soft"><p>💡 조금 더 부드럽게 바꿔볼까요?</p><q>' + esc(sf) + '</q><div class="pv-g-btns"><button type="button" class="primary" data-pv-soft-use="' + esc(sf) + '">이걸로 보내기</button><button type="button" data-pv-soft-keep="' + esc(orig) + '">그대로 보내기</button></div></div>');
  }
  document.addEventListener('submit', function (e) {
    var f0 = e.target;
    if (f0.matches && f0.matches('[data-pv-cheer-form]')) { e.preventDefault(); sendCheer(f0.elements.m.value, true); }
    if (f0.matches && f0.matches('[data-pv-coach]')) { e.preventDefault(); var q = f0.elements.q.value.trim(); if (!q) return; coachAns = coach(q); render(); setTimeout(function () { var c = document.querySelector('.pv-coach'); if (c) c.scrollIntoView({ block: 'center' }); }, 50); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches || !f.matches('[data-pv-add]')) return; e.preventDefault();
    var title = f.elements.t.value.trim().slice(0, 60); if (!title) return;
    var v = mom(); v.items.push({ id: Math.random().toString(36).slice(2, 10), title: title, due: /^\d{4}-\d{2}-\d{2}$/.test(f.elements.d.value) ? f.elements.d.value : '', done: false }); saveMom(v); render();
  });
  var css = document.createElement('style');
  css.textContent =
    '.pv-motto{margin:-4px 2px 10px;font-size:13px;color:#7d7a8c}.pv-guide{border-radius:20px;padding:16px;margin:0 0 12px;background:#f2fbf6;box-shadow:0 0 0 1.5px #cdeedc}.pv-guide.lv-y{background:#fffaeb;box-shadow:0 0 0 1.5px #f3e2b0}.pv-guide.lv-b{background:#eef5ff;box-shadow:0 0 0 1.5px #c9dcfa}' +
    '.pv-g-h{margin:0;font-size:12.5px;font-weight:800;color:#6b6880}.pv-guide h2{font-size:19px!important;margin:4px 0 6px!important}.pv-guide>p{margin:0 0 10px;font-size:14px;line-height:1.55}.pv-g-one{background:#fff;border-radius:12px;padding:10px 12px;font-size:14.5px;font-weight:600;margin-bottom:8px}.pv-g-one b,.pv-g-ask b{display:block;font-size:11.5px;color:#8a879a;font-weight:700;margin-bottom:2px}' +
    '.pv-g-ask{background:#ffffffb3;border-radius:12px;padding:10px 12px}.pv-g-ask q{display:block;font-size:15px;font-weight:700;color:#3d3566;margin:2px 0 8px}.pv-g-btns{display:flex;gap:6px;flex-wrap:wrap}.pv-g-btns button{min-height:36px!important;padding:4px 12px!important;font-size:13px}' +
    '.pv-tile.none{background:#fafafa}.pv-tile.none em{font-size:13px;color:#4a475c;font-weight:700}.pv-note{font-size:11.5px;color:#a3a0b2;margin:8px 2px 0}' +
    '.pv-req{min-height:30px!important;padding:2px 10px!important;font-size:12px;border-radius:999px!important;flex:none;background:#fff!important}.pv-req.sent{color:#1f7a55!important;border-color:#bfe6d2!important}.pv-req-row{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px}' +
    '.pv-req-line{display:grid;gap:8px;background:#eef5ff;border-radius:14px;padding:10px 12px;margin:0 0 10px;font-size:14px}.pv-req-line div{display:flex;gap:6px}.pv-req-line button{min-height:36px!important;padding:4px 12px!important;font-size:13px}' +
    '.pv-tip{background:#fff7fb!important}.pv-tip-q{font-size:15px;font-weight:700;margin:0 0 4px;line-height:1.5}' +
    '.pv-rec{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:8px}.pv-rec li{display:grid;gap:3px}.pv-rec button{text-align:left;min-height:42px!important;font-weight:700;border-radius:12px!important;background:#fff!important}.pv-rec small{font-size:11.5px;color:#8a879a;padding-left:4px}' +
    '.pv-focusing{background:#fff7e8;border-radius:10px;padding:8px 10px;font-size:13px;margin:0 0 8px}.pv-soft{margin-top:8px;background:#f4f0ff;border-radius:12px;padding:10px 12px}.pv-soft p{margin:0 0 4px;font-size:13px}.pv-soft q{display:block;font-weight:700;margin-bottom:8px}' +
    '.pv-coach-a{margin-top:10px}.pv-coach-a>p{font-size:14px;margin:0 0 8px;line-height:1.55}' +
    '.pv-mom{background:linear-gradient(135deg,#fffaf0,#fff)!important;box-shadow:0 0 0 1.5px #f3dfb8!important}.pv-mlist{list-style:none;margin:0;padding:0;display:grid;gap:4px}.pv-mlist li{display:flex;align-items:center;gap:6px;border-bottom:1px solid #f3f0e8;padding:6px 0}.pv-mlist li:last-child{border-bottom:0}.pv-mlist label{flex:1;display:flex!important;align-items:center;gap:8px;margin:0!important;font-weight:500!important;cursor:pointer}.pv-mlist input{width:22px;min-height:22px;flex:none}.pv-mlist span:last-child{display:grid}.pv-mlist b{font-size:14.5px;font-weight:600}.pv-mlist small{font-size:12px;color:#8a879a}.pv-mlist li.done b{text-decoration:line-through;color:#a3a0b2}.pv-mi{flex:none;font-size:16px}.pv-add{display:grid;grid-template-columns:1fr 130px auto;gap:6px;margin-top:8px}.pv-cheer-form{grid-template-columns:1fr auto!important}.pv-add input{min-height:42px!important;font-size:14px}@media(max-width:420px){.pv-add{grid-template-columns:1fr 1fr}.pv-add button{grid-column:1/-1}}' +
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
