/* 승준 화면 보강 (부모 화면 감수 내용을 승준 쪽에도)
   - 오늘 컨디션 한 번 누르기: 지친 날이면 'A 하나만' 모드 + 엄마에게는 '쉬어가는 날'로만 알림
   - 엄마 응원에 답장(😊 고마워 등), 엄마에게 부탁하기(준비물·간식·태워다 줘…)
   - 할 일이 많으면 'C는 내일로' 한 번에, 💌 엄마·아빠에게 바로 보내기(위쪽 버튼)
   - 예습 카드는 낮에는 접어두기(오후 3시 이후 펼침)
   데이터: fc_kid_v1 (승준만 씀, 엄마는 읽기만) */
(function () {
  'use strict';
  var KID = 'fc_kid_v1';
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function kid() { var v = ls(KID, {}) || {}; v.mood = v.mood || {}; v.asks = Array.isArray(v.asks) ? v.asks : []; v.replies = Array.isArray(v.replies) ? v.replies : []; return v; }
  function saveKid(v) {
    var cut = new Date(Date.now() + 9 * 3600000 - 14 * 86400000).toISOString().slice(0, 10);
    Object.keys(v.mood).forEach(function (d) { if (d < cut) delete v.mood[d]; });
    v.asks = v.asks.filter(function (a) { return Date.now() - a.at < 14 * 86400000; }).slice(-30);
    v.replies = v.replies.slice(-20);
    try { localStorage.setItem(KID, JSON.stringify(v)); } catch (e) {}
    if (typeof FamilySync !== 'undefined' && FamilySync.pushNow) FamilySync.pushNow();
  }
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  var MOODS = [['good', '😊', '좋음'], ['ok', '🙂', '보통'], ['tired', '😮‍💨', '지침']];

  function moodRow() {
    var m = kid().mood[today()];
    return '<div class="kp-mood"><span>오늘 컨디션</span>' + MOODS.map(function (x) { return '<button type="button" data-kp-mood="' + x[0] + '" class="' + (m === x[0] ? 'on' : '') + '" aria-label="' + x[2] + '">' + x[1] + '<small>' + x[2] + '</small></button>'; }).join('') + '</div>' +
      (m === 'tired' ? '<div class="kp-tired"><b>오늘은 A 하나만 해도 충분해 🌙</b><span>나머지는 내일로 옮겨도 괜찮아. 엄마에게는 "쉬어가는 날"이라고만 알려줄게.</span><button type="button" data-kp-light>B·C는 내일로 옮기기</button></div>' : '');
  }
  function privacyLine() {
    var P = window.FC_PLANNER ? FC_PLANNER.get() : {}, sh = P.share || {};
    var on = [['flow', '이번 주 흐름'], ['exams', '시험 일정'], ['review', '복습 메모'], ['questions', '질문'], ['reflect', '하루 마무리'], ['mission', '다짐']].filter(function (k) { return sh[k[0]]; }).map(function (k) { return k[1]; });
    return '<p class="kp-privacy">🔒 엄마에게 보이는 것: 진도·개수' + (on.length ? ', ' + on.join('·') : '') + ' <button type="button" class="linkish" data-kp-share>바꾸기</button></p>';
  }
  function askCard() {
    var v = kid(), m = ls('fc_mom_v1', {}) || {}, done = m.asksDone || {};
    var open = v.asks.filter(function (a) { return !a.hide && Date.now() - a.at < 7 * 86400000; }).slice(-4).reverse();
    return '<section class="card kp-ask" id="kp-ask"><div class="pl-head"><h2>💌 엄마·아빠에게</h2></div><p class="muted small kp-ask-sub">부탁이든 불편한 거든 편하게 보내. 바로 엄마 폰으로 가.</p>' +
      (open.length ? '<ul class="kp-asks">' + open.map(function (a) { var ok = done[a.id]; return '<li class="' + (ok ? 'ok' : '') + '"><span>' + esc(a.msg) + '</span><small>' + (ok ? '엄마가 봤어 💜' : '보냈어') + '</small><button type="button" class="pl-x" data-kp-ask-hide="' + esc(a.id) + '" aria-label="지우기">×</button></li>'; }).join('') + '</ul>' : '') +
      '<div class="pl-chips">' + ['준비물 사야 해 🛒', '간식 부탁해 🍙', '태워다 줄 수 있어? 🚗', '같이 계획 짜줘 📅', '오늘은 조용히 공부하고 싶어 🤫', '오늘 좀 쉬고 싶어 😮‍💨', '이거 좀 불편해 — 얘기하고 싶어 💬'].map(function (x) { return '<button type="button" data-kp-ask="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<form data-kp-ask-form class="pl-add"><input name="m" maxlength="60" placeholder="직접 쓰기 (예: 리코더 사야 해 / 알림이 너무 많아)" aria-label="엄마·아빠에게 보내기"><button class="primary">보내기</button></form></section>';
  }

  var prev = render;
  function abBtn() {
    var bar = document.querySelector('.appbar'); if (!bar) return;
    var b = bar.querySelector('[data-kp-open-ask]');
    if (!b) { var set = bar.querySelector('[data-go="settings"]'); bar.insertAdjacentHTML(set ? 'beforeend' : 'beforeend', '<button type="button" class="ab-icon" data-kp-open-ask aria-label="엄마·아빠에게 보내기">💌</button>'); b = bar.querySelector('[data-kp-open-ask]'); if (set) bar.insertBefore(b, set); }
    b.hidden = isParent();
  }
  function openAsk() {
    var go = function () { var c = document.getElementById('kp-ask'); if (!c) return; c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.classList.add('kp-flash'); setTimeout(function () { c.classList.remove('kp-flash'); }, 1200); };
    if (tab !== 'today') { location.hash = 'today'; setTimeout(go, 250); } else go();
  }
  render = function () {
    prev();
    abBtn();
    if (tab !== 'today' || isParent()) return;
    var root = document.getElementById('content'), hero = root.querySelector('.hero-heal');
    if (hero) { var body = hero.querySelector('.hero-body'); if (body) { body.insertAdjacentHTML('beforeend', moodRow()); } }
    // 엄마 응원에 답장 버튼
    var cl = root.querySelector('.pv-cheer-line');
    if (cl) { var ch = (ls('fc_cheer_v1', []) || []).slice(-1)[0], replied = ch && kid().replies.some(function (r) { return r.to === ch.at; }); if (ch && !replied) cl.insertAdjacentHTML('beforeend', '<div class="kp-reply">' + ['😊 고마워', '👍', '🙏 이따 볼게', '❤️'].map(function (x) { return '<button type="button" data-kp-reply="' + esc(x) + '" data-to="' + ch.at + '">' + esc(x) + '</button>'; }).join('') + '</div>'); }
    // 할 일 많으면 C는 내일로
    var lr = root.querySelector('.pl-loadrow');
    if (lr && window.FC_PLANNER) {
      var free = FC_PLANNER.free(), plan = FC_PLANNER.planned(), cs = FC_PLANNER.todays().filter(function (x) { return !x.t.done && x.q.p === 'C'; });
      if (cs.length && free && plan / free >= 0.9) lr.insertAdjacentHTML('afterend', '<button type="button" class="kp-c-later" data-kp-clater>오늘 빠듯해 — C ' + cs.length + '개는 내일로 옮기기</button>');
    }
    // 예습 카드: 낮에는 접어두기
    var prep = root.querySelector('.wk-prep'), h = new Date(Date.now() + 9 * 3600000).getUTCHours();
    if (prep && h < 15 && !prep.dataset.open) { prep.classList.add('kp-fold'); var h2 = prep.querySelector('h2'); if (h2) h2.setAttribute('data-kp-unfold', ''); }
    // 엄마에게 부탁하기: 하루 마무리 위
    var anchor = root.querySelector('.pl-close') || root.querySelector('.rt-card');
    if (anchor) anchor.insertAdjacentHTML('beforebegin', askCard()); else root.insertAdjacentHTML('beforeend', askCard());
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, [data-kp-unfold]'); if (!b) return;
    var d = b.dataset || {};
    if (d.kpMood) { var v = kid(), t = today(); if (v.mood[t] === d.kpMood) delete v.mood[t]; else v.mood[t] = d.kpMood; saveKid(v); if (v.mood[t] === 'tired') notice('알려줘서 고마워. 오늘은 가볍게 가자 🌙'); render(); return; }
    if (b.hasAttribute('data-kp-light')) {
      if (!window.FC_PLANNER) return;
      var mv = FC_PLANNER.todays().filter(function (x) { return !x.t.done && x.q.p !== 'A'; });
      mv.forEach(function (x) { x.t.date = addD(today(), 1); }); save(); notice(mv.length ? mv.length + '개를 내일로 옮겼어. 오늘은 A만!' : '옮길 게 없어. 지금도 충분히 가벼워.'); render(); return;
    }
    if (b.hasAttribute('data-kp-clater')) {
      var cs = FC_PLANNER.todays().filter(function (x) { return !x.t.done && x.q.p === 'C'; });
      cs.forEach(function (x) { x.t.date = addD(today(), 1); }); save(); notice('C ' + cs.length + '개를 내일로 옮겼어.'); render(); return;
    }
    if (b.hasAttribute('data-kp-open-ask')) { openAsk(); return; }
    if (b.hasAttribute('data-kp-share')) { if (typeof tab !== 'undefined') { location.hash = 'settings'; setTimeout(function () { var s = document.getElementById('set-planner'); if (s) s.scrollIntoView({ block: 'start' }); }, 200); } return; }
    if (d.kpReply) { var v2 = kid(); v2.replies.push({ at: Date.now(), to: Number(d.to), msg: d.kpReply }); saveKid(v2); if (window.FC_PUSH) FC_PUSH.notify('parent', 'ask', '💌 승준이 답장', d.kpReply); notice('엄마에게 답장했어 💌'); render(); return; }
    if (d.kpAsk) { addAsk(d.kpAsk); return; }
    if (d.kpAskHide) { var v3 = kid(); v3.asks.forEach(function (a) { if (a.id === d.kpAskHide) a.hide = 1; }); saveKid(v3); render(); return; }
    if (b.hasAttribute('data-kp-unfold')) { var p = b.closest('.wk-prep'); if (p) { p.classList.toggle('kp-fold'); p.dataset.open = p.classList.contains('kp-fold') ? '' : '1'; } return; }
  });
  function addAsk(msg) {
    msg = String(msg || '').trim().slice(0, 60); if (!msg) return;
    var v = kid(); v.asks.push({ id: Math.random().toString(36).slice(2, 10), at: Date.now(), msg: msg }); saveKid(v);
    if (window.FC_PUSH) FC_PUSH.notify('parent', 'ask', '💌 승준이', msg);
    notice('엄마한테 보냈어 💌'); render();
  }
  document.addEventListener('submit', function (e) { var f = e.target; if (f.matches && f.matches('[data-kp-ask-form]')) { e.preventDefault(); addAsk(f.elements.m.value); } });

  var css = document.createElement('style');
  css.textContent =
    '.kp-mood{display:flex;align-items:center;gap:6px;margin-top:12px;font-size:13px;color:#6b6880;font-weight:600}.kp-mood span{margin-right:2px}.kp-mood button{display:flex;flex-direction:column;align-items:center;gap:1px;min-height:44px!important;padding:4px 10px!important;border-radius:12px!important;background:#ffffffc9!important;font-size:18px;line-height:1}.kp-mood button small{font-size:10.5px;color:#7d7a8c}.kp-mood button.on{background:#5b45d6!important;border-color:#5b45d6!important}.kp-mood button.on small{color:#fff}' +
    '.kp-tired{margin-top:10px;background:#f0f6ff;border-radius:12px;padding:10px 12px;display:grid;gap:4px;font-size:13.5px}.kp-tired span{color:#4a475c}.kp-tired button{justify-self:start;margin-top:4px;min-height:38px!important;padding:4px 12px!important;font-size:13px}' +
    '.kp-ask-sub{margin:-4px 0 10px}.kp-flash{box-shadow:0 0 0 3px #b9adff!important;transition:box-shadow .3s}.appbar [data-kp-open-ask][hidden]{display:none}.kp-privacy{margin:10px 2px 0;font-size:11.5px;color:#8a879a}.kp-privacy .linkish{font-size:11.5px}' +
    '.kp-reply{display:flex;gap:6px;flex-basis:100%;margin-top:8px}.pv-cheer-line{flex-wrap:wrap}.kp-reply button{min-height:32px!important;padding:2px 10px!important;font-size:13px;border-radius:999px!important;background:#fff!important}' +
    '.kp-c-later{width:100%;margin:6px 0 2px;min-height:38px!important;font-size:13px;background:#fff7e8!important;border-color:#f3dfb8!important;color:#8a5a00!important}' +
    '.wk-prep.kp-fold>*:not(.section-title):not(h2){display:none!important}.wk-prep.kp-fold .section-title,.wk-prep.kp-fold h2{cursor:pointer}.wk-prep.kp-fold h2::after{content:" ›";color:#8a879a}' +
    '.kp-asks{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:6px}.kp-asks li{display:flex;align-items:center;gap:8px;background:#f7f6fb;border-radius:12px;padding:8px 10px;font-size:14px}.kp-asks li span{flex:1}.kp-asks li small{font-size:11.5px;color:#8a879a}.kp-asks li.ok small{color:#1f7a55;font-weight:700}';
  document.head.appendChild(css);
  if (typeof render === 'function') render();
})();
