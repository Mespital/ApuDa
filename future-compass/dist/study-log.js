/* 공부 일지 + 일상 일정
   - 공부 일지: 집중 타이머·직접 기록·끝낸 할 일·1분 말하기/노트·복습을 날짜별로 한 줄씩 모아 보여줌
   - 일상 일정: 기상·식사·운동·독서실·약속 같은 생활 일정 (오늘만 / 매일 / 평일 / 요일)
     끝나는 시간을 넣으면 '오늘 쓸 수 있는 공부 시간'에서 빼줌 */
(function () {
  'use strict';
  var LIFE = 'fc_life_v1', WK = ['일', '월', '화', '수', '목', '금', '토'];
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10)) + ' ' + WK[wd(d)]; }
  function hm(m) { return m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '') : m + '분'; }
  function okT(t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(t || '') ? t : ''; }

  /* ───────── 일상 일정 ───────── */
  function life() { var v = ls(LIFE, {}) || {}; v.items = Array.isArray(v.items) ? v.items.filter(function (x) { return x && x.id && x.title; }).slice(0, 60) : []; return v; }
  function saveLife(v) {
    var t = today(); v.items = v.items.filter(function (x) { return !x.date || x.date >= addD(t, -7); });
    try { localStorage.setItem(LIFE, JSON.stringify(v)); } catch (e) {}
    try { window.dispatchEvent(new StorageEvent('storage', { key: LIFE })); } catch (e) {}
  }
  function forDay(d) {
    var w = wd(d);
    return life().items.filter(function (x) { return x.date ? x.date === d : Array.isArray(x.days) && x.days.indexOf(w) >= 0; })
      .map(function (x) { return { id: x.id, title: x.title, icon: x.icon || '📌', start: okT(x.start), end: okT(x.end), busy: !!okT(x.end), rep: !x.date }; })
      .sort(function (a, b) { return (a.start || '99').localeCompare(b.start || '99'); });
  }
  function repLabel(x) {
    if (x.date) return x.date === today() ? '오늘만' : md(x.date);
    var d = (x.days || []).slice().sort();
    if (d.length === 7) return '매일'; if (d.join() === '1,2,3,4,5') return '평일'; if (d.join() === '0,6') return '주말';
    return d.map(function (i) { return WK[i]; }).join('·');
  }
  var PRESET = [['🌅', '기상', '07:00', ''], ['🍚', '저녁', '18:30', '19:20'], ['🏃', '운동', '20:00', '21:00'], ['📖', '독서실', '19:30', '22:00'], ['👥', '약속', '', ''], ['🎮', '쉬는 시간', '', ''], ['🛏', '취침', '23:30', '']];
  var form = { open: false, where: '', icon: '📌', title: '', start: '', end: '', rep: 'once', days: [] };
  function lifeForm() {
    var f = form;
    return '<div class="lg-form">' +
      '<div class="pl-chips lg-pre">' + PRESET.map(function (p) { return '<button type="button" data-lg-pre="' + p[1] + '" class="' + (f.title === p[1] ? 'on' : '') + '">' + p[0] + ' ' + p[1] + '</button>'; }).join('') + '</div>' +
      '<input class="lg-title" maxlength="24" placeholder="일정 이름 (예: 피아노, 동생 데리러)" value="' + esc(f.title) + '">' +
      '<div class="lg-times"><label>시작<input type="time" class="lg-start" value="' + esc(f.start) + '"></label><label>끝 (선택)<input type="time" class="lg-end" value="' + esc(f.end) + '"></label></div>' +
      '<div class="lg-rep">' + [['once', '오늘만'], ['daily', '매일'], ['week', '평일'], ['pick', '요일 고르기']].map(function (r) { return '<button type="button" data-lg-rep="' + r[0] + '" class="' + (f.rep === r[0] ? 'on' : '') + '">' + r[1] + '</button>'; }).join('') + '</div>' +
      (f.rep === 'pick' ? '<div class="lg-days">' + [1, 2, 3, 4, 5, 6, 0].map(function (i) { return '<button type="button" data-lg-day="' + i + '" class="' + (f.days.indexOf(i) >= 0 ? 'on' : '') + '">' + WK[i] + '</button>'; }).join('') + '</div>' : '') +
      '<p class="muted small">끝나는 시간을 넣으면 오늘 공부할 수 있는 시간에서 빼줘.</p>' +
      '<div class="lg-btns"><button type="button" class="primary" data-lg-save>추가</button><button type="button" data-lg-cancel>취소</button></div></div>';
  }
  function readForm(root) {
    var q = function (c) { var e = root.querySelector(c); return e ? e.value : ''; };
    form.title = q('.lg-title').trim(); form.start = q('.lg-start'); form.end = q('.lg-end');
  }
  function lifeRow(x, canDel) {
    return '<li><span class="lg-time">' + (x.start ? x.start + (x.end ? '<small>~' + x.end + '</small>' : '') : '<small>시간 미정</small>') + '</span><span class="lg-name">' + esc(x.icon || '📌') + ' ' + esc(x.title) + (x.rl ? '<small>' + esc(x.rl) + '</small>' : '') + '</span>' +
      (canDel && x.id ? '<button type="button" class="pl-x" data-lg-del="' + esc(x.id) + '" aria-label="지우기">×</button>' : '') + '</li>';
  }
  function todaySchedule() {
    var t = today(), rows = [];
    var row = window.FC_PLANNER ? FC_PLANNER.todayRow() : [], ex = window.FC_PLANNER && FC_PLANNER.examName ? FC_PLANNER.examName(t) : '';
    if (ex) rows.push({ start: '08:30', title: ex, icon: '📝' });
    else if (row.length) rows.push({ start: '08:30', title: '학교 ' + row.length + '교시', icon: '🏫' });
    (typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(t) : []).forEach(function (a) { rows.push({ start: okT(a.start), end: okT(a.end), title: a.name, icon: '🏃' }); });
    forDay(t).forEach(function (x) { x.rl = x.rep ? '' : '오늘만'; rows.push(x); });
    return rows.sort(function (a, b) { return (a.start || '99').localeCompare(b.start || '99'); });
  }
  function lifeCard() {
    var rows = todaySchedule(), now = new Date(Date.now() + 9 * 3600000), nm = String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0');
    return '<section class="card lg-card" id="lg-today"><div class="pl-head"><h2>🗓 오늘 일정</h2>' + (form.open && form.where === 'today' ? '' : '<button type="button" class="pl-mini" data-lg-add="today">+ 일정</button>') + '</div>' +
      (rows.length ? '<ul class="lg-list">' + rows.map(function (x) { var past = (x.end || x.start) && (x.end || x.start) < nm; return lifeRow(x, true).replace('<li>', '<li class="' + (past ? 'past' : '') + '">'); }).join('') + '</ul>' : '<p class="muted small">기상·운동·약속 같은 일정을 넣어두면 하루가 한눈에 보여.</p>') +
      (form.open && form.where === 'today' ? lifeForm() : '') + '</section>';
  }
  function lifeSettings() {
    var items = life().items.slice().sort(function (a, b) { return (a.start || '99').localeCompare(b.start || '99'); });
    return '<section class="card" id="set-life"><h2>🗓 일상 일정</h2><p class="muted small">매일·평일·요일마다 반복되는 생활 일정. 오늘 화면 "오늘 일정"에 같이 보여.</p>' +
      (items.length ? '<ul class="lg-list">' + items.map(function (x) { var y = { id: x.id, title: x.title, icon: x.icon, start: okT(x.start), end: okT(x.end), rl: repLabel(x) }; return lifeRow(y, true); }).join('') + '</ul>' : '<p class="muted small">아직 없어.</p>') +
      (form.open && form.where === 'set' ? lifeForm() : '<p><button type="button" data-lg-add="set">+ 일정 추가</button></p>') + '</section>';
  }

  /* ───────── 공부 일지 ───────── */
  function P() { return window.FC_PLANNER ? FC_PLANNER.get() : { focus: [], pri: {} }; }
  function dayItems(d, parent) {
    var out = [], p = P();
    p.focus.forEach(function (f, i) {
      if (f.date !== d) return;
      out.push({ at: f.at || 0, html: '<span class="sl-ic">⏱</span><span class="sl-tx"><b>' + hm(f.min) + '</b> ' + esc(f.subject || '공부') + (f.memo && !parent ? ' <small>· ' + esc(f.memo) + '</small>' : '') + (f.manual ? ' <em>직접</em>' : f.partial ? ' <em>중간까지</em>' : '') + (f.q ? ' <i class="sl-q">' + '●'.repeat(f.q) + '</i>' : '') + '</span>' + (parent ? '' : '<button type="button" class="pl-x" data-sl-del="' + i + '" aria-label="지우기">×</button>') });
    });
    state.tasks.forEach(function (x) { if (!x.done) return; var dd = (p.pri[x.id] && p.pri[x.id].doneAt) || x.date; if (dd === d) out.push({ at: 1, html: '<span class="sl-ic">✓</span><span class="sl-tx">' + esc(x.title) + '</span>' }); });
    if (!parent) ls('fc_notes_v1', []).forEach(function (n) { if (n && n.date === d) out.push({ at: Date.parse(n.at) || 2, html: '<span class="sl-ic">' + (n.kind === 'photo' ? '📷' : '🎙') + '</span><span class="sl-tx">' + esc((n.subject ? n.subject + ' · ' : '') + (n.kind === 'photo' ? '노트 사진' : '1분 말하기')) + (n.text ? ' <small>' + esc(String(n.text).slice(0, 40)) + '</small>' : '') + '</span>' }); });
    state.reviews.forEach(function (r) { if (r.date === d) out.push({ at: 3, html: '<span class="sl-ic">📝</span><span class="sl-tx">복습 · ' + esc(r.title) + '</span>' }); });
    return out.sort(function (a, b) { return a.at - b.at; });
  }
  function minsOn(d) { return P().focus.filter(function (f) { return f.date === d; }).reduce(function (s, f) { return s + (f.min || 0); }, 0); }
  function bySub(d) { var o = {}; P().focus.forEach(function (f) { if (f.date === d) { var k = f.subject || '기타'; o[k] = (o[k] || 0) + f.min; } }); return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).map(function (k) { return [k, o[k]]; }); }

  var rec = { open: false, s: '', m: 0 };
  function recForm() {
    var subs = window.FC_PLANNER && FC_PLANNER.subjects ? FC_PLANNER.subjects() : ['수학', '국어', '영어', '기타'];
    return '<div class="sl-form"><p class="pl-rec-h">무슨 과목?</p><div class="pl-chips">' + subs.map(function (x) { return '<button type="button" data-sl-s="' + esc(x) + '" class="' + (rec.s === x ? 'on' : '') + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<p class="pl-rec-h">얼마나?</p><div class="pl-chips">' + [10, 20, 30, 45, 60, 90, 120].map(function (m) { return '<button type="button" data-sl-m="' + m + '" class="' + (rec.m === m ? 'on' : '') + '">' + hm(m) + '</button>'; }).join('') + '</div>' +
      '<input class="sl-memo" maxlength="80" placeholder="뭐 했는지 한 줄 (선택) 예: 학원 숙제, 영단어 50개">' +
      '<div class="lg-btns"><button type="button" class="primary" data-sl-save>기록하기</button><button type="button" data-sl-cancel>취소</button></div></div>';
  }
  function todayLogCard() {
    var t = today(), m = minsOn(t), subs = bySub(t), items = dayItems(t, false);
    return '<section class="card sl-card" id="sl-today"><div class="pl-head"><h2>📒 오늘 공부 기록</h2><button type="button" class="pl-mini" data-go="stats">전체</button></div>' +
      (m || items.length ? '<p class="sl-sum"><b>' + hm(m) + '</b>' + (subs.length ? subs.slice(0, 4).map(function (s) { return '<span>' + esc(s[0]) + ' ' + s[1] + '분</span>'; }).join('') : '') + '</p><ul class="sl-list">' + items.slice(-4).map(function (x) { return '<li>' + x.html + '</li>'; }).join('') + '</ul>' + (items.length > 4 ? '<p class="muted small">외 ' + (items.length - 4) + '개 — 📈 기록에서 다 보여</p>' : '') : '<p class="muted small">⏱ 타이머로 공부하면 자동으로 쌓여. 학원·독서실에서 한 건 직접 남겨도 돼.</p>') +
      (rec.open ? recForm() : '<button type="button" class="sl-add" data-sl-open>+ 공부한 거 기록하기</button>') + '</section>';
  }
  var span = 7;
  function journal(parent) {
    var t = today(), days = [];
    for (var i = 0; i < span; i++) days.push(addD(t, -i));
    var body = days.map(function (d) {
      var items = dayItems(d, parent), m = minsOn(d);
      if (!items.length) return '<li class="sl-day empty"><div class="sl-dh"><b>' + md(d) + '</b><small>쉬어간 날</small></div></li>';
      return '<li class="sl-day"><div class="sl-dh"><b>' + (d === t ? '오늘' : md(d)) + '</b>' + (m ? '<small>집중 ' + hm(m) + '</small>' : '') + '</div><ul class="sl-list">' + items.map(function (x) { return '<li>' + x.html + '</li>'; }).join('') + '</ul></li>';
    }).join('');
    return '<section class="card sl-journal" id="sl-journal"><div class="pl-head"><h2>📒 ' + (parent ? '승준이 공부 일지' : '공부 일지') + '</h2>' + (parent ? '' : '<button type="button" class="pl-mini" data-sl-open-j>+ 기록</button>') + '</div>' +
      (rec.open && !parent ? recForm() : '') + '<ul class="sl-days">' + body + '</ul>' +
      (span < 56 ? '<button type="button" class="sl-more" data-sl-more>이전 7일 더 보기</button>' : '') + '</section>';
  }

  /* ───────── 화면 붙이기 ───────── */
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    var parent = isParent();
    if (tab === 'today' && !parent) {
      var anchor = root.querySelector('#kp-ask') || root.querySelector('.pl-close');
      var html = todayLogCard() + lifeCard();
      if (anchor) anchor.insertAdjacentHTML('beforebegin', html); else root.insertAdjacentHTML('beforeend', html);
    }
    if (tab === 'stats') {
      var P0 = P(); if (parent && P0.share && !P0.share.flow) return;
      var top = root.querySelector('.pl-stat-top');
      if (top) top.insertAdjacentHTML('afterend', journal(parent)); else root.insertAdjacentHTML('afterbegin', journal(parent));
    }
    if (tab === 'settings' && !parent) {
      var a2 = document.getElementById('set-push') || document.getElementById('set-profile') || document.getElementById('set-family');
      if (a2) a2.insertAdjacentHTML('beforebegin', lifeSettings()); else root.insertAdjacentHTML('beforeend', lifeSettings());
      var nav = document.querySelector('.set-jump'); if (nav && !nav.querySelector('[data-jump="set-life"]')) nav.insertAdjacentHTML('beforeend', '<a href="#set-life" data-jump="set-life">일상 일정</a>');
    }
  };
  function keep(id) { var y = window.scrollY; render(); window.scrollTo(0, y); var el = id && document.getElementById(id); return el; }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var d = b.dataset, box = b.closest('.lg-card, #set-life, .sl-card, .sl-journal');
    // 일상 일정
    if (d.lgAdd) { form = { open: true, where: d.lgAdd, icon: '📌', title: '', start: '', end: '', rep: d.lgAdd === 'today' ? 'once' : 'daily', days: [] }; keep(); var ti = document.querySelector('.lg-title'); if (ti) ti.focus({ preventScroll: true }); return; }
    if (d.lgPre) { var f0 = b.closest('.lg-form'); readForm(f0); var p = PRESET.filter(function (x) { return x[1] === d.lgPre; })[0]; form.icon = p[0]; form.title = p[1]; if (!form.start) form.start = p[2]; if (!form.end) form.end = p[3]; if (p[1] === '기상' || p[1] === '취침' || p[1] === '저녁') { if (form.rep === 'once') form.rep = 'daily'; } keep(); return; }
    if (d.lgRep) { readForm(b.closest('.lg-form')); form.rep = d.lgRep; keep(); return; }
    if (d.lgDay) { readForm(b.closest('.lg-form')); var n = Number(d.lgDay), i = form.days.indexOf(n); if (i >= 0) form.days.splice(i, 1); else form.days.push(n); keep(); return; }
    if (b.hasAttribute('data-lg-cancel')) { form.open = false; keep(); return; }
    if (b.hasAttribute('data-lg-save')) {
      readForm(b.closest('.lg-form'));
      if (!form.title) { notice('일정 이름을 적어줘.'); return; }
      var days = form.rep === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : form.rep === 'week' ? [1, 2, 3, 4, 5] : form.rep === 'pick' ? form.days.slice() : null;
      if (form.rep === 'pick' && !days.length) { notice('요일을 하나 이상 골라줘.'); return; }
      var icon = form.icon; if (icon === '📌') { var m0 = PRESET.filter(function (x) { return form.title.indexOf(x[1]) >= 0; })[0]; if (m0) icon = m0[0]; }
      var it = { id: uid(), title: form.title.slice(0, 24), icon: icon, start: okT(form.start), end: okT(form.end) };
      if (it.end && it.start && it.end <= it.start) it.end = '';
      if (days) it.days = days; else it.date = today();
      var v = life(); v.items.push(it); saveLife(v); form.open = false; notice('일정에 넣었어 🗓'); keep(); return;
    }
    if (d.lgDel) { var v2 = life(); v2.items = v2.items.filter(function (x) { return x.id !== d.lgDel; }); saveLife(v2); notice('일정을 지웠어.'); keep(); return; }
    // 공부 기록
    if (b.hasAttribute('data-sl-open') || b.hasAttribute('data-sl-open-j')) { rec = { open: true, s: '', m: 0 }; keep(); return; }
    if (d.slS) { rec.s = rec.s === d.slS ? '' : d.slS; [].forEach.call(box.querySelectorAll('[data-sl-s]'), function (x) { x.classList.toggle('on', x.dataset.slS === rec.s); }); return; }
    if (d.slM) { rec.m = Number(d.slM); [].forEach.call(box.querySelectorAll('[data-sl-m]'), function (x) { x.classList.toggle('on', x === b); }); return; }
    if (b.hasAttribute('data-sl-cancel')) { rec.open = false; keep(); return; }
    if (b.hasAttribute('data-sl-save')) {
      if (!rec.m) { notice('얼마나 했는지 골라줘.'); return; }
      var memo = (box.querySelector('.sl-memo') || {}).value || '';
      if (window.FC_PLANNER && FC_PLANNER.addFocus) FC_PLANNER.addFocus({ min: rec.m, subject: rec.s === '기타' ? '' : rec.s, memo: memo.trim() });
      rec.open = false; notice('기록했어 📒 ' + hm(rec.m) + ' 잘했어!'); keep(); return;
    }
    if (d.slDel != null && d.slDel !== '') {
      var P1 = P(), idx = Number(d.slDel), f = P1.focus[idx]; if (!f) return;
      if (!confirm(hm(f.min) + ' ' + (f.subject || '공부') + ' 기록을 지울까?')) return;
      P1.focus.splice(idx, 1); if (FC_PLANNER.save) FC_PLANNER.save(); keep(); return;
    }
    if (b.hasAttribute('data-sl-more')) { span = Math.min(56, span + 7); keep(); return; }
  });

  var css = document.createElement('style');
  css.textContent =
    '.lg-list,.sl-list,.sl-days{list-style:none;margin:0;padding:0}.lg-list{display:grid;gap:2px}.lg-list li{display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid #f0eff5;font-size:14.5px}.lg-list li:last-child{border-bottom:0}.lg-list li.past{opacity:.45}' +
    '.lg-time{flex:none;width:58px;font-weight:700;font-variant-numeric:tabular-nums;color:#2a2550;display:flex;flex-direction:column;line-height:1.2}.lg-time small{font-weight:500;color:#8a879a;font-size:11.5px}.lg-name{flex:1;min-width:0}.lg-name small{margin-left:6px;font-size:11.5px;color:#8a879a}' +
    '.lg-form,.sl-form{margin-top:10px;padding:12px;background:#f7f6fb;border-radius:14px;display:grid;gap:8px}.lg-form input,.sl-form input{width:100%;box-sizing:border-box}.lg-times{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lg-times label{display:grid;gap:4px;font-size:12.5px;color:#5a5672;margin:0!important}' +
    '.lg-rep,.lg-days{display:flex;gap:6px;flex-wrap:wrap}.lg-rep button,.lg-days button,.lg-pre button,.sl-form .pl-chips button{min-height:34px!important;padding:2px 12px!important;font-size:13.5px;border-radius:999px!important}.lg-days button{min-width:38px;padding:2px 0!important}' +
    '.lg-form button.on,.sl-form button.on{background:#2a2550!important;color:#fff!important;border-color:#2a2550!important}.lg-btns{display:flex;gap:8px}.lg-btns button{flex:1}' +
    '.sl-sum{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;margin:0 0 8px}.sl-sum b{font-size:22px;color:#2a2550;margin-right:4px}.sl-sum span{font-size:12.5px;background:#f1f0f7;border-radius:999px;padding:3px 9px;color:#4a4663}' +
    '.sl-list li{display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:14px;line-height:1.4}.sl-ic{flex:none;width:20px;text-align:center}.sl-tx{flex:1;min-width:0}.sl-tx small{color:#8a879a}.sl-tx em{font-style:normal;font-size:11px;color:#6a55e0;background:#efecff;border-radius:6px;padding:1px 5px;margin-left:4px}.sl-q{font-style:normal;font-size:9px;color:#ff8a7a;letter-spacing:1px;margin-left:4px}' +
    '.sl-add{width:100%;margin-top:8px;min-height:42px!important;border-style:dashed!important}.sl-day{padding:10px 0;border-bottom:1px solid #f0eff5}.sl-day:last-child{border-bottom:0}.sl-day.empty{padding:6px 0;opacity:.5}.sl-dh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}.sl-dh b{font-size:14.5px}.sl-dh small{font-size:12.5px;color:#6a55e0;font-weight:600}.sl-day.empty .sl-dh small{color:#8a879a;font-weight:400}.sl-more{width:100%;margin-top:8px}';
  document.head.appendChild(css);

  window.FC_LIFE = { forDay: forDay, KEY: LIFE };
  if (typeof render === 'function') render();
})();
