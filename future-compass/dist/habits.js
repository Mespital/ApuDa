/* P1 습관 장치 (2026-10-18, 공부 앱 30개 비교 반영) — app-ui.js 뒤에 로드
   ① 🔥 연속 기록: 공부한 날(집중·끝낸 할 일·복습·노트) 연속. 한 주(월~일)에 하루는 쉬어도 안 끊김. 끊겨도 탓하지 않음
   ② 📱 뒤집어서 집중: 폰을 화면이 바닥으로 가게 엎어 두면 집중 타이머 시작 (켜 둔 경우만)
   ③ 🃏 카드로 넘기기: 오늘 기억 확인을 카드 한 장씩 → 뒤집어 정리 보기 → 잘 앎/헷갈림/모름
   ④ 앱 아이콘 숫자: 홈 화면에 설치했을 때 오늘 남은 할 일 수
   ⑤ 🌙 화면 테마 설정 카드 (dark-mode.js) */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function') return;
  var PREF = 'fc-habits-v1';
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (x) { return d; } }
  function setLs(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) {} }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function monday(d) { return addD(d, -((wd(d) + 6) % 7)); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)); }
  var pref = ls(PREF, {}) || {};
  function savePref() { setLs(PREF, pref); }

  /* ---------- ① 연속 기록 ---------- */
  function studiedSet(from, to) { var FP = window.FC_PLANNER; return FP && FP.studied ? FP.studied(from, to) : {}; }
  function streak() {
    var t = today(), set = studiedSet(addD(t, -400), t), n = 0, rest = {}, marks = {};
    var d = set[t] ? t : addD(t, -1);
    for (var guard = 0; guard < 400; guard++) {
      if (set[d]) { n++; marks[d] = 's'; }
      else { var wk = monday(d); if (rest[wk]) break; rest[wk] = d; marks[d] = 'r'; }
      d = addD(d, -1);
    }
    // 가장 오래된 공부한 날보다 더 앞의 '쉬는 날'은 진짜 쉬는 날이 아니니 지움
    var oldest = Object.keys(marks).filter(function (k) { return marks[k] === 's'; }).sort()[0] || '9999';
    Object.keys(marks).forEach(function (k) { if (marks[k] === 'r' && k < oldest) delete marks[k]; });
    var wk0 = monday(t), used = Object.keys(marks).filter(function (k) { return marks[k] === 'r' && k >= wk0; })[0] || '';
    return { n: n, today: !!set[t], marks: marks, set: set, restUsed: used };
  }
  function streakLine(s) {
    if (!s.n) return '';
    return '🔥 ' + s.n + '일째';
  }
  function streakCard(s) {
    var t = today(), days = [];
    for (var i = 13; i >= 0; i--) days.push(addD(t, -i));
    var lab = s.n ? (s.today ? '오늘도 했어! ' : '오늘 하나만 하면 이어져 · ') + s.n + '일째' : '오늘 하나만 해도 1일째가 돼';
    return '<section class="card hb-streak" id="hb-streak"><h2>🔥 연속 기록 <small>' + e(lab) + '</small></h2>' +
      '<ol class="hb-dots" aria-label="최근 2주">' + days.map(function (d) {
        var m = s.set[d] ? 's' : s.marks[d] === 'r' ? 'r' : 'x';
        var txt = m === 's' ? '공부함' : m === 'r' ? '쉬는 날(안 끊김)' : '기록 없음';
        return '<li class="m-' + m + (d === t ? ' now' : '') + '" title="' + md(d) + ' ' + txt + '"><span>' + '일월화수목금토'[wd(d)] + '</span><i aria-label="' + md(d) + ' ' + txt + '">' + (m === 's' ? '●' : m === 'r' ? '◐' : '○') + '</i></li>';
      }).join('') + '</ol>' +
      '<p class="muted small">집중·할 일 끝내기·복습·수업 노트 중 하나만 해도 공부한 날이야. <b>한 주에 하루는 쉬어도 안 끊겨</b>' + (s.restUsed ? ' (이번 주 쉬는 날: ' + md(s.restUsed) + ')' : '') + '. 끊겨도 괜찮아, 다시 1일부터.</p></section>';
  }
  var MILE = [3, 7, 14, 30, 50, 100];
  function milestone(s) {
    if (!s.today || MILE.indexOf(s.n) < 0) return;
    var seen = pref.mile || {}; if (seen[s.n] === today()) return;
    seen[s.n] = today(); pref.mile = seen; savePref();
    if (typeof notice === 'function') notice('🔥 ' + s.n + '일 연속! 대단해. 오늘은 여기까지만 해도 충분해.');
  }

  /* ---------- ③ 카드로 넘기기 ---------- */
  var deck = null;
  function dueList() { var FP = window.FC_PLANNER; return FP && FP.again ? FP.again() : []; }
  function closeDeck() { if (deck) { deck.el.remove(); deck = null; document.body.classList.remove('hb-deck-on'); render(); } }
  function paintDeck() {
    var R = window.FC_RECALL, el = deck.el, i = deck.i, list = deck.list;
    if (i >= list.length) {
      var g = deck.res.good, m = deck.res.meh, b = deck.res.bad;
      el.querySelector('.hb-dk-body').innerHTML = '<div class="hb-dk-end"><p class="hb-dk-big">🎉</p><h2>' + list.length + '장 끝!</h2><p>잘 앎 ' + g + ' · 헷갈림 ' + m + ' · 모름 ' + b + '</p><p class="muted">헷갈리고 모른 건 다음 날짜에 다시 나와. 그게 기억이 붙는 방법이야.</p><button type="button" class="hb-dk-done" data-hb-deck-close>닫기</button></div>';
      el.querySelector('.hb-dk-n').textContent = list.length + '/' + list.length;
      return;
    }
    var a = list[i], r = a.r, q = R && R.questions ? R.questions(r) : [], ans = R && R.answer ? R.answer(r) : (r.note || ''), pv = R && R.preview ? R.preview(r.id, a.date) : {};
    el.querySelector('.hb-dk-n').textContent = (i + 1) + '/' + list.length;
    el.querySelector('.hb-dk-body').innerHTML =
      '<div class="hb-card' + (deck.flip ? ' flip' : '') + '"><div class="hb-face front"><small>' + e(r.subject || '복습') + '</small><h2>' + e(r.title) + '</h2><ol>' + q.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ol><p class="muted small">노트 보지 말고 머릿속으로(또는 소리 내서) 답해봐.</p></div>' +
      '<div class="hb-face back"><small>정리 보기</small><h2>' + e(r.title) + '</h2><pre>' + e(ans) + '</pre></div></div>' +
      (deck.flip ? '<div class="hb-rate" role="group" aria-label="얼마나 기억났어?"><button type="button" data-hb-rate="good"><b>😀 잘 앎</b><small>' + e(pv.good || '') + '</small></button><button type="button" data-hb-rate="meh"><b>🤔 헷갈림</b><small>' + e(pv.meh || '') + '</small></button><button type="button" data-hb-rate="bad"><b>😵 모름</b><small>' + e(pv.bad || '') + '</small></button></div>'
        : '<button type="button" class="hb-flip" data-hb-flip>🔄 뒤집어서 정리 보기</button>');
  }
  function openDeck() {
    var list = dueList(); if (!list.length) { if (typeof notice === 'function') notice('오늘 확인할 카드가 없어. 🎉'); return; }
    var el = document.createElement('div'); el.className = 'hb-deck'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '기억 확인 카드');
    el.innerHTML = '<div class="hb-dk-top"><b>🃏 기억 확인 카드</b><span class="hb-dk-n"></span><button type="button" class="hb-dk-x" data-hb-deck-close aria-label="닫기">✕</button></div><div class="hb-dk-body"></div>';
    document.body.appendChild(el); document.body.classList.add('hb-deck-on');
    deck = { el: el, list: list, i: 0, flip: false, res: { good: 0, meh: 0, bad: 0 } };
    paintDeck(); var x = el.querySelector('.hb-dk-x'); if (x) x.focus();
  }

  /* ---------- ② 뒤집어서 집중 ---------- */
  var flip = { on: false, down: 0, started: false, listening: false };
  function running() { return state.timer && state.timer.end > Date.now(); }
  function startTimer() {
    var t = state.timer; if (!t || t.end > Date.now()) return;
    if (t.remaining === 0) t.remaining = t.duration;
    t.end = Date.now() + t.remaining * 1000; save(); render();
    if (window.FC_FOCUS) FC_FOCUS.show();
    if (navigator.vibrate) navigator.vibrate(60);
    flip.started = true;
  }
  function onMotion(ev) {
    var g = ev.accelerationIncludingGravity; if (!g || g.z == null) return;
    var z = g.z, now = Date.now();
    // 화면이 바닥을 보면 z가 크게 음수(-9.8 근처). 기기마다 부호가 반대인 경우도 있어 두 번 확인
    var faceDown = pref.flipSign === -1 ? z > 8 : z < -8;
    if (faceDown) { if (!flip.down) flip.down = now; else if (now - flip.down > 1500 && !running()) startTimer(); }
    else flip.down = 0;
  }
  function listen(on) {
    if (on && !flip.listening) { window.addEventListener('devicemotion', onMotion); flip.listening = true; }
    if (!on && flip.listening) { window.removeEventListener('devicemotion', onMotion); flip.listening = false; }
  }
  function syncFlip() { listen(!!pref.flip && !isParent() && !document.hidden); }
  function enableFlip() {
    function ok() { pref.flip = true; savePref(); syncFlip(); render(); if (typeof notice === 'function') notice('켰어. 집중할 때 폰을 엎어 두면 1.5초 뒤 시작해.'); }
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(function (s) { if (s === 'granted') ok(); else if (typeof notice === 'function') notice('움직임 센서 권한이 필요해. 설정에서 허용해줘.'); }).catch(function () { if (typeof notice === 'function') notice('이 기기에서는 센서를 쓸 수 없어.'); });
    } else if (typeof DeviceMotionEvent === 'undefined') { if (typeof notice === 'function') notice('이 기기에서는 센서를 쓸 수 없어.'); }
    else ok();
  }
  function flipCard() {
    var on = !!pref.flip;
    return '<section class="card hb-flipcard"><div><b>📱 뒤집어서 집중 시작</b><small>' + (on ? '켜짐 · 폰을 화면이 바닥으로 가게 엎어 두면 타이머가 시작돼' : '폰을 엎어 두기만 하면 시작. 알림이 와도 안 보여서 덜 흔들려') + '</small></div>' +
      '<button type="button" class="' + (on ? 'on' : '') + '" data-hb-flipset aria-pressed="' + on + '">' + (on ? '끄기' : '켜기') + '</button></section>';
  }

  /* ---------- ④ 앱 아이콘 숫자 ---------- */
  function badge() {
    if (!('setAppBadge' in navigator)) return;
    try {
      if (isParent()) { navigator.clearAppBadge(); return; }
      var n = state.tasks.filter(function (x) { return x.date === today() && !x.done; }).length;
      if (n) navigator.setAppBadge(n); else navigator.clearAppBadge();
    } catch (x) {}
  }

  /* ---------- ⑤ 화면 테마 ---------- */
  function themeCard() {
    var T = window.FC_THEME; if (!T) return '';
    var v = T.get();
    return '<section class="card hb-theme" id="hb-theme"><h2>🌙 화면 테마</h2><div class="hb-seg" role="group" aria-label="화면 테마">' +
      [['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(function (x) { return '<button type="button" data-hb-theme="' + x[0] + '" aria-pressed="' + (v === x[0]) + '" class="' + (v === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') +
      '</div><p class="muted small">자동: 휴대폰이 다크 모드거나 밤 9시~아침 7시면 어둡게.</p></section>';
  }

  /* ---------- 화면에 붙이기 ---------- */
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content');
    badge();
    if (!root || deck) return;
    var kid = !isParent();
    if (tab === 'today' && kid) {
      var s = streak(), line = streakLine(s), tx = root.querySelector('.hb .hb-txt');
      if (tx && line && !tx.querySelector('.hb-sk')) {
        var sp = tx.querySelector('span');
        if (sp) sp.insertAdjacentHTML('afterbegin', '<em class="hb-sk">' + e(line) + '</em> · ');
        else tx.insertAdjacentHTML('beforeend', '<span><em class="hb-sk">' + e(line) + '</em></span>');
      }
      milestone(s);
    }
    if (tab === 'stats' && !root.querySelector('#hb-streak')) {
      var s2 = streak(), top = root.querySelector('.pl-stat-top') || root.firstElementChild;
      if (top) top.insertAdjacentHTML(top.classList && top.classList.contains('pl-stat-top') ? 'afterend' : 'beforebegin', streakCard(s2)); else root.insertAdjacentHTML('afterbegin', streakCard(s2));
    }
    if (tab === 'review' && kid) {
      var rh = root.querySelector('#rh-today'), n = dueList().length;
      if (rh && n && !rh.querySelector('.hb-deckbtn')) {
        var h2 = rh.querySelector('h2');
        (h2 || rh).insertAdjacentHTML('afterend', '<button type="button" class="hb-deckbtn" data-hb-deck>🃏 카드로 넘기기 <small>' + n + '장 · 한 장에 1분</small></button>');
      }
    }
    if (tab === 'focus' && kid && !root.querySelector('.hb-flipcard')) root.insertAdjacentHTML('beforeend', flipCard());
    if (tab === 'settings' && !root.querySelector('#hb-theme')) { var fc = root.querySelector('.card'); if (fc) fc.insertAdjacentHTML('beforebegin', themeCard()); else root.insertAdjacentHTML('beforeend', themeCard()); }
  };

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (b.hasAttribute('data-hb-deck')) { openDeck(); return; }
    if (b.hasAttribute('data-hb-deck-close')) { closeDeck(); return; }
    if (b.hasAttribute('data-hb-flip') && deck) { deck.flip = true; paintDeck(); var r0 = deck.el.querySelector('[data-hb-rate]'); if (r0) r0.focus(); return; }
    if (d.hbRate && deck) {
      var a = deck.list[deck.i];
      if (window.FC_RECALL && FC_RECALL.reschedule) FC_RECALL.reschedule(a.r.id, a.date, d.hbRate);
      deck.res[d.hbRate]++; deck.i++; deck.flip = false;
      if (navigator.vibrate) navigator.vibrate(20);
      paintDeck(); return;
    }
    if (b.hasAttribute('data-hb-flipset')) { if (pref.flip) { pref.flip = false; savePref(); syncFlip(); render(); } else enableFlip(); return; }
    if (d.hbTheme && window.FC_THEME) { FC_THEME.set(d.hbTheme); var y = window.scrollY; render(); window.scrollTo(0, y); }
  });
  document.addEventListener('keydown', function (ev) { if (deck && ev.key === 'Escape') closeDeck(); });
  document.addEventListener('visibilitychange', syncFlip);
  syncFlip();

  window.FC_HABITS = { streak: streak, openDeck: openDeck };

  var css = document.createElement('style');
  css.textContent = '.hb-sk{font-style:normal;font-weight:800}' +
    '.hb-streak h2 small{font-size:13.5px;font-weight:700;color:#5b45d6;margin-left:4px}.hb-dots{list-style:none;margin:8px 0 6px;padding:0;display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:2px}.hb-dots li{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}.hb-dots span{font-size:12.5px;color:#57546a}.hb-dots i{font-style:normal;font-size:17px;line-height:1;color:#c9c4dd}.hb-dots .m-s i{color:#e8590c}.hb-dots .m-r i{color:#b07b12}.hb-dots .now span{font-weight:800;color:#2a2550}' +
    '.hb-deckbtn{display:flex!important;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px!important;margin:4px 0 12px;border-radius:12px!important;border:0!important;background:#2a2550!important;color:#fff!important;font-weight:800;font-size:17px}.hb-deckbtn small{font-weight:600;opacity:.85;font-size:12.5px}' +
    '.hb-deck{position:fixed;inset:0;z-index:1300;background:#f5f3ff;display:flex;flex-direction:column;padding:max(12px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom))}.hb-dk-top{display:flex;align-items:center;gap:10px;min-height:48px}.hb-dk-top b{flex:1;font-size:17px;color:#2a2550}.hb-dk-n{font-weight:800;color:#5b45d6;font-variant-numeric:tabular-nums}.hb-dk-x{width:44px!important;min-height:44px!important;padding:0!important;border-radius:50%!important;border:0!important;background:#fff!important;color:#2a2550!important;font-size:17px}' +
    '.hb-dk-body{flex:1;display:flex;flex-direction:column;gap:14px;min-height:0;overflow:auto;padding-top:6px}.hb-card{position:relative;flex:1;min-height:300px;perspective:1200px}.hb-face{position:absolute;inset:0;padding:22px 20px;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(42,37,80,.12);overflow:auto;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .45s ease}.hb-face.back{transform:rotateY(180deg);background:#fffaf0}.hb-card.flip .front{transform:rotateY(-180deg)}.hb-card.flip .back{transform:rotateY(0)}' +
    '.hb-face small{font-size:12.5px;font-weight:800;color:#5b45d6}.hb-face h2{margin:6px 0 12px;font-size:20px;line-height:1.35;color:#2a2550}.hb-face ol{margin:0 0 12px;padding-left:20px;font-size:17px;line-height:1.65;color:#2a2550}.hb-face pre{margin:0;white-space:pre-wrap;font:inherit;font-size:17px;line-height:1.65;color:#2a2550}' +
    '.hb-flip{min-height:56px!important;border-radius:16px!important;border:0!important;background:#5b45d6!important;color:#fff!important;font-weight:800;font-size:17px}.hb-rate{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.hb-rate button{min-height:64px!important;border-radius:16px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#2a2550!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 4px!important}.hb-rate b{font-size:15px}.hb-rate small{font-size:12.5px;color:#57546a}' +
    '.hb-dk-end{margin:auto;text-align:center;max-width:320px}.hb-dk-big{font-size:56px;margin:0}.hb-dk-end h2{margin:4px 0 8px;color:#2a2550}.hb-dk-done{width:100%;min-height:52px!important;margin-top:12px;border-radius:12px!important;background:#5b45d6!important;color:#fff!important;border:0!important;font-weight:800}body.hb-deck-on{overflow:hidden}body.hb-deck-on .appnav,body.hb-deck-on .shiro-launch{display:none!important}' +
    '.hb-flipcard{display:flex;align-items:center;gap:12px}.hb-flipcard>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.hb-flipcard b{font-size:17px;color:#2a2550}.hb-flipcard small{font-size:13.5px;color:#57546a;line-height:1.45}.hb-flipcard button{flex:none;min-height:44px!important;padding:6px 16px!important;border-radius:999px!important;font-weight:800}.hb-flipcard button.on{background:#fff!important;color:#5b45d6!important;border:1.5px solid #5b45d6!important}' +
    '.hb-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.hb-seg button{min-height:44px!important;border-radius:12px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#2a2550!important;font-weight:700}.hb-seg button.on{background:#2a2550!important;border-color:#2a2550!important;color:#fff!important}';
  document.head.appendChild(css);
  render();
})();
