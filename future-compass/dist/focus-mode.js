/* 집중 타이머 — 타이머 화면(전체 화면) + 어디서나 보이는 작은 타이머 + 화면 꺼도 끝나면 알림
   - 시간은 '끝나는 시각' 기준이라 화면을 꺼도, 앱을 닫아도 정확해.
   - 화면이 꺼져 있으면 휴대폰이 앱을 멈추니까, 끝나는 시각을 서버에 맡겨두고 그때 폰 알림을 보내.
   - 화면을 다시 켜면 타이머 화면이 바로 떠. (승준 화면에서만) */
(function () {
  'use strict';
  var PREF = 'fc-focus-mode-v1';
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function setLs(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function kid() { return typeof PinGate === 'undefined' || PinGate.who() !== 'parent'; }
  function locked() { return document.documentElement.classList.contains('pin-locked'); }
  function T() { return state.timer; }
  function running() { return T().end > Date.now(); }
  function left() { var t = T(); return t.end ? Math.max(0, Math.ceil((t.end - Date.now()) / 1000)) : t.remaining; }
  function mmss(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function hhmm(ms) { var d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function isBreak() { var t = T(); return t.brk === undefined ? t.duration === 300 : !!t.brk; }
  function taskTitle() {
    var id = ''; try { id = sessionStorage.getItem('fc-focus-task') || ''; } catch (e) {}
    var x = id && (state.tasks || []).find(function (t) { return t.id === id; });
    return x ? x.title : '';
  }
  function pushOn() { var p = ls('fc-push-v1', {}) || {}; return !!p.on && 'Notification' in window && Notification.permission === 'granted' && !(p.off || {}).timer; }
  function sw() { return 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistration() : Promise.resolve(null); }
  function endpoint() { return sw().then(function (r) { return r && r.pushManager ? r.pushManager.getSubscription() : null; }).then(function (s) { return s ? s.endpoint : ''; }).catch(function () { return ''; }); }
  function call(b) { return typeof FamilySync !== 'undefined' && FamilySync.joined() ? FamilySync.call(b).catch(function () {}) : Promise.resolve(); }

  /* ── 서버에 '끝나는 시각' 맡기기 (화면 꺼져도 알림) ── */
  function serverSet(end) {
    if (!kid() || !pushOn()) return;
    endpoint().then(function (ep) {
      var br = isBreak(), task = taskTitle();
      call({ action: 'timer-set', at: end, endpoint: ep, device: (localStorage.getItem('fc-device-id') || '').slice(0, 12),
        title: br ? '🌿 쉬는 시간 끝' : '⏱ 집중 끝! ' + Math.round(T().duration / 60) + '분 해냈어',
        body: br ? '다음 한 가지를 골라볼까?' : (task ? '「' + task.slice(0, 30) + '」 ' : '') + '잠깐 쉬어가자 🌱 눌러서 기록 남기기' });
    });
  }
  function serverClear() { if (kid() && pushOn()) call({ action: 'timer-clear', device: (localStorage.getItem('fc-device-id') || '').slice(0, 12) }); }
  function localNote(title, body, silent) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    sw().then(function (r) { if (r) r.showNotification(title, { body: body, tag: 'timer', silent: !!silent, renotify: !silent, icon: 'app-icon-192.png', badge: 'app-icon-192.png', data: { url: 'study.html#focus' } }); }).catch(function () {});
  }
  function clearLocalNote() { sw().then(function (r) { return r && r.getNotifications({ tag: 'timer' }); }).then(function (ns) { (ns || []).forEach(function (n) { n.close(); }); }).catch(function () {}); }

  /* ── 끝났을 때: 진동 + 짧은 소리 ── */
  var actx = null;
  function unlockAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {} }
  function chime() {
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]); } catch (e) {}
    try {
      if (!actx) return; var t0 = actx.currentTime;
      [659, 784, 1047].forEach(function (f, i) { var o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.setValueAtTime(0.0001, t0 + i * 0.22); g.gain.exponentialRampToValueAtTime(0.25, t0 + i * 0.22 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.22 + 0.5); o.connect(g); g.connect(actx.destination); o.start(t0 + i * 0.22); o.stop(t0 + i * 0.22 + 0.55); });
    } catch (e) {}
  }

  /* ── 화면 켜두기 (Wake Lock) ── */
  var wake = null;
  function wantWake() { return !!(ls(PREF, {}) || {}).wake; }
  function grabWake() {
    if (!('wakeLock' in navigator) || !wantWake() || !open || !running() || document.visibilityState !== 'visible' || wake) return;
    navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }).catch(function () {});
  }
  function dropWake() { if (wake) { try { wake.release(); } catch (e) {} wake = null; } }

  /* ── 진짜 타이머처럼: 남은 시간만큼 색 부채꼴이 줄어드는 다이얼 ── */
  var WR = 64;
  function scaleOf(d) { return d > 3600 ? 7200 : 3600; }
  function ticks(scale) {
    var h = '', step = scale === 3600 ? 5 : 10;
    for (var i = 0; i < 60; i++) {
      var a = i * 6 * Math.PI / 180, major = i % 5 === 0, r1 = 79, r2 = major ? 70 : 74, sn = Math.sin(a), cs = Math.cos(a);
      h += '<line x1="' + (100 + r1 * sn).toFixed(1) + '" y1="' + (100 - r1 * cs).toFixed(1) + '" x2="' + (100 + r2 * sn).toFixed(1) + '" y2="' + (100 - r2 * cs).toFixed(1) + '" class="' + (major ? 'tt-maj' : 'tt-min') + '"/>';
      if (major) h += '<text x="' + (100 + 89 * sn).toFixed(1) + '" y="' + (100 - 89 * cs + 3.6).toFixed(1) + '">' + (i / 5 * step) + '</text>';
    }
    return h;
  }
  function ttMarkup(cls) { return '<svg viewBox="0 0 200 200" class="tt ' + (cls || '') + '" aria-hidden="true"><circle class="tt-face" cx="100" cy="100" r="98"/><g class="tt-ticks" data-scale="3600">' + ticks(3600) + '</g><circle class="tt-well" cx="100" cy="100" r="' + WR + '"/><path class="tt-wedge"/><circle class="tt-knob" cx="100" cy="100" r="9"/></svg>'; }
  function wedge(svg, sec, scale) {
    if (!svg) return;
    var g = svg.querySelector('.tt-ticks'); if (g && g.getAttribute('data-scale') !== String(scale)) { g.innerHTML = ticks(scale); g.setAttribute('data-scale', scale); }
    var a = Math.max(0, Math.min(1, sec / scale)) * 360, d = '';
    if (a >= 359.9) d = 'M100 ' + (100 - WR) + 'A' + WR + ' ' + WR + ' 0 1 1 99.99 ' + (100 - WR) + 'Z';
    else if (a > 0.2) { var r = a * Math.PI / 180; d = 'M100 100L100 ' + (100 - WR) + 'A' + WR + ' ' + WR + ' 0 ' + (a > 180 ? 1 : 0) + ' 1 ' + (100 + WR * Math.sin(r)).toFixed(2) + ' ' + (100 - WR * Math.cos(r)).toFixed(2) + 'Z'; }
    svg.querySelector('.tt-wedge').setAttribute('d', d);
  }

  /* ── 타이머 화면 ── */
  var el = null, pill = null, open = false;
  function build() {
    if (el) return;
    el = document.createElement('div'); el.className = 'fm'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '집중 타이머');
    el.innerHTML = '<div class="fm-top"><span class="fm-label"></span><button type="button" class="fm-x" data-fm-min aria-label="작게 보기">작게 ⌄</button></div>' +
      '<div class="fm-mid"><div class="fm-dial" data-fm-dial>' + ttMarkup('dark') + '</div>' +
      '<div class="fm-face"><div class="fm-clock" aria-live="off"></div><div class="fm-sub"></div></div>' +
      '<div class="fm-oadj"><button type="button" class="fm-pm" data-fm-add="-5" aria-label="5분 줄이기">−5</button><div class="fm-ochips"></div><button type="button" class="fm-pm" data-fm-add="5" aria-label="5분 늘리기">+5</button></div>' +
      '<p class="fm-task"></p></div>' +
      '<div class="fm-btns"><button type="button" class="fm-main" data-fm-toggle></button><button type="button" data-fm-stop>처음부터</button></div>' +
      '<div class="fm-foot"><label class="fm-wake"><input type="checkbox" data-fm-wake> 화면 켜두기</label><span class="fm-hint"></span></div>';
    document.body.appendChild(el);
    pill = document.createElement('button'); pill.type = 'button'; pill.className = 'fm-pill'; pill.hidden = true; pill.setAttribute('data-fm-open', '');
    document.body.appendChild(pill);
  }
  function paint() {
    if (!el) return;
    if (open && (!kid() || locked())) { hide(); return; }
    var t = T(), s = dragging ? dragSec : left(), on = running(), br = isBreak();
    var showPill = kid() && !open && t.end && on && tab !== 'focus';
    if (tab === 'focus') paintCard();
    pill.hidden = !showPill; if (showPill) pill.textContent = (br ? '🌿 ' : '⏱ ') + mmss(s);
    if (!open) return;
    el.classList.toggle('fm-break', br); el.classList.toggle('fm-paused', !t.end); el.classList.toggle('fm-fresh', !t.end && (dragging || s === t.duration));
    el.querySelector('.fm-label').textContent = br ? '🌿 쉬는 시간' : '⏱ 집중 ' + Math.round(t.duration / 60) + '분';
    el.querySelector('.fm-clock').textContent = mmss(s);
    el.querySelector('.fm-sub').textContent = t.end ? hhmm(t.end) + '에 끝나' : dragging ? '손을 떼면 정해져' : (s === t.duration ? '원을 돌리거나 아래에서 시간을 바꿔' : '잠깐 멈춤');
    wedge(el.querySelector('.fm-dial svg'), s, dragging ? 3600 : scaleOf(t.duration));
    var oc = el.querySelector('.fm-ochips'), list = br ? CH.b : CH.f;
    if (oc.getAttribute('data-k') !== String(br)) { oc.innerHTML = list.map(function (m) { return '<button type="button" data-fm-min-set="' + m + '">' + m + '분</button>'; }).join(''); oc.setAttribute('data-k', String(br)); }
    [].forEach.call(oc.querySelectorAll('[data-fm-min-set]'), function (b) { b.classList.toggle('on', +b.dataset.fmMinSet * 60 === t.duration); });
    var task = taskTitle(); el.querySelector('.fm-task').textContent = br ? '물 한 잔, 스트레칭 한 번 🙆' : task ? '지금: ' + task : '한 가지에만 집중 🐾';
    el.querySelector('[data-fm-toggle]').textContent = t.end ? '잠깐 멈추기' : (s === t.duration ? '▶ 시작' : '▶ 이어하기');
    el.querySelector('[data-fm-wake]').checked = wantWake();
    el.querySelector('[data-fm-wake]').parentNode.hidden = !('wakeLock' in navigator);
    el.querySelector('.fm-hint').textContent = !t.end ? '' : pushOn() ? '화면 꺼도 끝나면 알림 🔔' : '⚙️에서 알림을 켜면 화면 꺼도 알려줘';
  }
  function show() {
    if (!kid() || locked()) return; build(); unlockAudio();
    open = true; el.hidden = false; document.documentElement.classList.add('fm-on'); paint(); grabWake();
  }
  function hide() { open = false; if (el) el.hidden = true; document.documentElement.classList.remove('fm-on'); dropWake(); paint(); }

  /* ── 시작·멈춤 (study.js 와 같은 규칙) ── */
  function toggle() {
    unlockAudio(); tick(); var t = T();
    if (t.end) t.end = 0; else { if (t.remaining === 0) t.remaining = t.duration; t.end = Date.now() + t.remaining * 1000; }
    save(); render(); watch(); paint();
  }
  /* 중간에 그만둬도 3분 넘게 했으면 기록 */
  function logPartial() {
    try { tick(); } catch (e) {} var t = T(); if (isBreak()) return;
    var done = t.duration - (t.end ? left() : t.remaining);
    if (done >= 180 && done < t.duration) try { window.dispatchEvent(new CustomEvent('fc-focus-done', { detail: { min: Math.round(done / 60), partial: true } })); } catch (e) {}
  }
  function stop() { logPartial(); var t = T(); t.remaining = t.duration; t.end = 0; save(); render(); watch(); hide(); }

  /* ── 상태 변화 감시: 어떤 버튼으로 시작/멈춤해도 여기서 한 번에 처리 ── */
  var lastEnd = 0, lastDur = 0, lastBrk = false, booted = false;
  function watch() {
    var t = T();
    if (!booted) { booted = true; lastEnd = t.end; lastDur = t.duration; return; }
    if (t.end === lastEnd) return;
    var was = lastEnd; lastEnd = t.end;
    if (t.end && !was) { serverSet(t.end); if (kid() && !open && document.visibilityState === 'visible' && tab !== 'focus') show(); }
    else if (t.end && was) { serverSet(t.end); }
    else if (!t.end && was) {
      serverClear(); clearLocalNote(); dropWake();
      if (t.remaining === 0 || was <= Date.now() + 1000) {   // 시간이 다 돼서 끝남
        if (kid()) { chime(); if (document.visibilityState !== 'visible') localNote(lastBrk ? '🌿 쉬는 시간 끝' : '⏱ 집중 끝!', '잠깐 쉬어가자 🌱'); }
        hide();
        if (kid()) {   // 끝나면 바로 다음 준비: 집중 끝 → 같은 시간 그대로, 쉬기 끝 → 다시 집중
          var pf = ls(PREF, {}) || {}, d = lastBrk ? (pf.lf || 1500) : t.duration;
          state.timer = { duration: d, remaining: d, end: 0, brk: false }; save(); setTimeout(render, 0);
        }
      }
    }
    lastDur = t.duration; lastBrk = isBreak();
  }

  setInterval(function () { watch(); paint(); }, 500);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      try { tick(); } catch (e) {} watch();
      if (kid() && running()) { clearLocalNote(); show(); }   // 화면 다시 켜면 타이머 화면
      grabWake(); paint();
    } else if (kid() && running()) {
      // 화면 끌 때: 잠금화면에 '집중 중' 표시 (끝나면 서버 알림이 이걸 바꿔)
      localNote('⏱ 집중 중 · ' + hhmm(T().end) + '에 끝나', (taskTitle() || '한 가지에만 집중') + ' — 화면 꺼도 시간은 흘러가', true);
    }
  });
  window.addEventListener('pin-who', function () { if (!kid()) hide(); else paint(); });
  window.addEventListener('pageshow', function () { try { tick(); } catch (e) {} });
  window.addEventListener('pin-unlocked', function () { setTimeout(function () { if (kid() && running()) show(); }, 300); });

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button,input'); if (!b) return;
    if (b.hasAttribute('data-fm-open')) { show(); return; }
    if (b.hasAttribute('data-fm-min')) { hide(); return; }
    if (b.hasAttribute('data-fm-toggle')) { toggle(); return; }
    if (b.hasAttribute('data-fm-stop')) { stop(); return; }
    if (b.hasAttribute('data-fm-wake')) { var p = ls(PREF, {}) || {}; p.wake = b.checked ? 1 : 0; setLs(PREF, p); if (b.checked) grabWake(); else dropWake(); return; }
    if (b.hasAttribute('data-timer') || b.hasAttribute('data-pl-play')) unlockAudio();
  }, true);
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-timer],[data-reset],[data-duration]'); if (b) setTimeout(function () { watch(); paint(); }, 0); });
  document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') hide(); });

  /* ── 집중 탭: 원을 돌려서 시간 정하는 타이머 ── */
  var CH = { f: [10, 25, 40], b: [5, 10, 15] };
  function card() {
    var br = isBreak(), today0 = (state.sessions || {})[today()] || 0;
    return '<section class="card fm-card' + (br ? ' fm-break' : '') + '">' +
      '<div class="fm-seg" role="tablist"><button type="button" data-fm-mode="f" class="' + (br ? '' : 'on') + '">📚 집중</button><button type="button" data-fm-mode="b" class="' + (br ? 'on' : '') + '">🌿 쉬기</button></div>' +
      '<div class="fm-dialwrap" data-fm-dial>' + ttMarkup('') + '</div>' +
      '<div class="fm-read"><b class="fm-read-big"></b><small class="fm-read-sub"></small></div>' +
      '<div class="fm-adj"><button type="button" class="fm-pm" data-fm-add="-5" aria-label="5분 줄이기">−5</button><div class="fm-chips">' + (br ? CH.b : CH.f).map(function (m) { return '<button type="button" data-fm-min-set="' + m + '">' + m + '분</button>'; }).join('') + '</div><button type="button" class="fm-pm" data-fm-add="5" aria-label="5분 늘리기">+5</button></div>' +
      '<div class="fm-ctl"><button type="button" class="fm-go" data-timer></button><button type="button" class="fm-ghost" data-fm-reset>처음부터</button><button type="button" class="fm-ghost" data-fm-open aria-label="크게 보기">⛶</button></div>' +
      '<p class="fm-today">' + (today0 ? '오늘 집중 ' + today0 + '번 해냈어 👏' : '조금씩 해도 괜찮아. 시작한 네가 멋져 🐾') + '</p></section>';
  }
  var dragging = false, dragSec = 0;
  function paintCard() {
    var c = document.querySelector('.fm-card'); if (!c) return;
    var t = T(), s = dragging ? dragSec : left(), on = !!t.end, br = isBreak(), fresh = !on && s === t.duration;
    c.classList.toggle('fm-run', on); c.classList.toggle('fm-break', br);
    wedge(c.querySelector('svg.tt'), s, dragging ? 3600 : scaleOf(t.duration));
    var big = c.querySelector('.fm-read-big'), sub = c.querySelector('.fm-read-sub');
    big.textContent = fresh || dragging ? Math.round(s / 60) + '분' : mmss(s);
    sub.textContent = on ? hhmm(t.end) + '에 끝나' : dragging ? '손을 떼면 정해져' : fresh ? '원을 돌려서 시간을 정해' : '잠깐 멈춤 · 이어서 할까?';
    var go = c.querySelector('.fm-go'); go.textContent = on ? '잠깐 멈추기' : fresh ? '▶ 시작' : '▶ 이어하기'; go.classList.toggle('pause', on);
    c.querySelector('[data-fm-reset]').hidden = fresh;
    [].forEach.call(c.querySelectorAll('[data-fm-min-set]'), function (b) { b.classList.toggle('on', +b.dataset.fmMinSet * 60 === t.duration); b.disabled = on; });
    [].forEach.call(c.querySelectorAll('.fm-pm,[data-fm-mode]'), function (b) { b.disabled = on; });
  }
  function setDur(sec, brk) {
    sec = Math.max(60, Math.min(7200, Math.round(sec / 60) * 60));
    if (brk === undefined) brk = isBreak();
    state.timer = { duration: sec, remaining: sec, end: 0, brk: brk };
    var p = ls(PREF, {}) || {}; p[brk ? 'lb' : 'lf'] = sec; setLs(PREF, p);
    save(); paintCard(); paint();
  }
  function angleSec(e, box) {
    var r = box.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    var a = Math.atan2(x, -y) * 180 / Math.PI; if (a < 0) a += 360;
    return Math.round(a / 6) * 60;
  }
  document.addEventListener('pointerdown', function (e) {
    var box = e.target.closest && e.target.closest('[data-fm-dial]'); if (!box || T().end) return;
    e.preventDefault(); dragging = true; dragSec = Math.max(60, angleSec(e, box)); try { box.setPointerCapture(e.pointerId); } catch (er) {} unlockAudio(); paintCard(); paint();
    function mv(ev) {
      var v = angleSec(ev, box);
      if (dragSec >= 2700 && v <= 900) v = 3600; else if (dragSec <= 900 && v >= 2700) v = 60;   // 12시를 넘어가지 않게
      v = Math.max(60, Math.min(3600, v));
      if (v !== dragSec) { dragSec = v; try { if (navigator.vibrate) navigator.vibrate(4); } catch (er) {} paintCard(); paint(); }
    }
    function up() { box.removeEventListener('pointermove', mv); box.removeEventListener('pointerup', up); box.removeEventListener('pointercancel', up); dragging = false; setDur(dragSec); }
    box.addEventListener('pointermove', mv); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b || !b.closest('.fm-card, .fm')) return;
    if (b.dataset.fmMinSet) { setDur(+b.dataset.fmMinSet * 60); return; }
    if (b.dataset.fmAdd) { var t = T(); setDur(t.duration + +b.dataset.fmAdd * 60); return; }
    if (b.dataset.fmMode) { var brk = b.dataset.fmMode === 'b', p = ls(PREF, {}) || {}; if (brk === isBreak()) return; setDur(brk ? (p.lb || 300) : (p.lf || 1500), brk); render(); return; }
    if (b.hasAttribute('data-fm-reset')) { logPartial(); var t2 = T(); t2.remaining = t2.duration; t2.end = 0; save(); render(); return; }
  });

  var prev = render;
  render = function () {
    prev();
    if (tab === 'focus' && kid()) {
      var old = document.getElementById('clock'), sec = old && old.closest('section');
      if (sec) { sec.outerHTML = card(); var fc = document.querySelector('.fm-card'), root = document.getElementById('content'), back = root.querySelector('.pl-back');
        if (back) back.insertAdjacentElement('afterend', fc); else root.insertAdjacentElement('afterbegin', fc);
        paintCard(); }
    }
    paint();
  };

  var css = document.createElement('style');
  css.textContent =
    '.fm{position:fixed;inset:0;z-index:900;display:flex;flex-direction:column;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top,0px)) 20px calc(18px + env(safe-area-inset-bottom,0px));background:radial-gradient(120% 80% at 50% 20%,#2f2a55 0%,#1b1930 60%,#141325 100%);color:#f4f2ff;font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;-webkit-user-select:none;user-select:none}' +
    '.fm[hidden]{display:none}.fm-break{background:radial-gradient(120% 80% at 50% 20%,#1f4a43 0%,#14302c 60%,#0f2420 100%)}.fm .tt-wedge{fill:#ff7a6b}.fm.fm-break .tt-wedge{fill:#4fd1a8}.fm.fm-break .tt-face{fill:#1c3a35}.fm.fm-break .tt-well{fill:#15302b}' +
    '.fm-top{display:flex;justify-content:space-between;align-items:center}.fm-label{font-size:15px;font-weight:600;opacity:.85}' +
    '.fm button{font:inherit;border-radius:999px;cursor:pointer}.fm .fm-x{background:rgba(255,255,255,.12)!important;border:0!important;color:#f4f2ff!important;padding:8px 14px!important;font-size:14px!important;min-height:40px!important;box-shadow:none!important}' +
    '.fm-mid{display:flex;flex-direction:column;align-items:center;gap:12px}.fm-dial{position:relative;width:min(74vw,40vh,330px);aspect-ratio:1}' +
    '.fm-dial svg{width:100%;height:100%;display:block}.fm-face{display:flex;flex-direction:column;align-items:center}' +
    '.tt{overflow:visible}.tt-face{fill:#fff;filter:drop-shadow(0 6px 18px rgba(60,40,140,.10))}.tt-well{fill:#f6f5fb}.tt-maj{stroke:#b9b5cc;stroke-width:1.6;stroke-linecap:round}.tt-min{stroke:#dcdae6;stroke-width:1;stroke-linecap:round}.tt text{font:600 10.5px Pretendard,system-ui,sans-serif;fill:#8f8ba5;text-anchor:middle}' +
    '.tt-wedge{fill:#ff6f61}.fm-break .tt-wedge{fill:#3fc49b}.tt-knob{fill:#fff;stroke:#ecebf3;stroke-width:1.5;filter:drop-shadow(0 1px 3px rgba(0,0,0,.18))}' +
    '.tt.dark .tt-face{fill:#25223f;filter:none}.tt.dark .tt-well{fill:#1d1b33}.tt.dark .tt-maj{stroke:rgba(255,255,255,.45)}.tt.dark .tt-min{stroke:rgba(255,255,255,.16)}.tt.dark text{fill:rgba(255,255,255,.55)}.tt.dark .tt-knob{fill:#f4f2ff;stroke:none}' +
    '.fm-oadj{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px}.fm:not(.fm-paused) .fm-oadj{display:none}.fm-ochips{display:flex;gap:6px}.fm .fm-oadj button{all:unset;cursor:pointer;min-height:38px;padding:0 13px;display:inline-flex;align-items:center;border-radius:999px;background:rgba(255,255,255,.1);color:#ecebff;font-size:14px;font-weight:600}.fm .fm-oadj .fm-pm{background:transparent;border:1.5px solid rgba(255,255,255,.25);padding:0 11px}.fm .fm-oadj button.on{background:#f4f2ff;color:#2a2550}.fm.fm-paused .fm-dial{touch-action:none;cursor:grab}' +
    '.fm-run .fm-adj{display:none}.fm-run .fm-seg{visibility:hidden}.fm-card{text-align:center;padding:18px 16px 16px!important}.fm-seg{display:inline-flex;background:#f1f0f7;border-radius:999px;padding:4px;gap:2px;margin-bottom:6px}.fm-card .fm-seg button{all:unset;cursor:pointer;padding:7px 16px;border-radius:999px;font-size:14px;font-weight:600;color:#7d7a92}.fm-card .fm-seg button.on{background:#fff;color:#2a2550;box-shadow:0 1px 4px rgba(40,30,90,.12)}.fm-card .fm-seg button:disabled{opacity:.5;cursor:default}' +
    '.fm-dialwrap{width:min(76vw,300px);margin:6px auto 0;touch-action:none;cursor:grab;-webkit-user-select:none;user-select:none}.fm-run .fm-dialwrap{cursor:default}.fm-dialwrap svg{width:100%;display:block}' +
    '.fm-read{margin:6px 0 12px;display:flex;flex-direction:column;align-items:center}.fm-read-big{font-size:42px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:#24213a;line-height:1.1}.fm-read-sub{font-size:13px;color:#8a879a;margin-top:4px}' +
    '.fm-adj{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px}.fm-chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.fm-card .fm-chips button,.fm-card .fm-pm{all:unset;cursor:pointer;min-height:36px;padding:0 13px;display:inline-flex;align-items:center;border-radius:999px;background:#f4f3f9;color:#4a4663;font-size:14px;font-weight:600}.fm-card .fm-pm{background:transparent;border:1.5px solid #e4e2ee;padding:0 11px}.fm-card .fm-chips button.on{background:#2a2550;color:#fff}.fm-card .fm-adj button:disabled{opacity:.35;cursor:default}' +
    '.fm-ctl{display:flex;gap:8px;justify-content:center;align-items:center}.fm-card .fm-go{all:unset;cursor:pointer;background:#ff6f61;color:#fff;font-size:17px;font-weight:700;border-radius:999px;padding:0 30px;min-height:52px;display:inline-flex;align-items:center;box-shadow:0 6px 16px rgba(255,111,97,.3)}.fm-break .fm-go{background:#3fc49b;box-shadow:0 6px 16px rgba(63,196,155,.3)}.fm-card .fm-go.pause{background:#2a2550;box-shadow:none}' +
    '.fm-card .fm-ghost{all:unset;cursor:pointer;min-height:52px;padding:0 16px;border-radius:999px;border:1.5px solid #e4e2ee;color:#5a5672;font-size:14.5px;font-weight:600;display:inline-flex;align-items:center}.fm-card .fm-ghost[hidden]{display:none}.fm-today{margin:14px 0 0;font-size:13px;color:#8a879a}' +
    '.fm-clock{font-size:clamp(48px,15vw,76px);font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}.fm-sub{margin-top:4px;font-size:15px;opacity:.7}' +
    '.fm-paused:not(.fm-fresh) .fm-clock{opacity:.55}.fm-task{margin:0;font-size:16px;text-align:center;max-width:32ch;opacity:.9;line-height:1.4}' +
    '.fm-btns{display:flex;gap:10px;justify-content:center}.fm .fm-main{background:#f4f2ff!important;color:#2a2550!important;border:0!important;padding:14px 28px!important;font-size:17px!important;font-weight:700!important;min-height:54px!important;min-width:150px;box-shadow:none!important}.fm-break .fm-main{color:#14302c!important}' +
    '.fm .fm-btns button:not(.fm-main){background:transparent!important;color:#e4e0ff!important;border:1px solid rgba(255,255,255,.3)!important;padding:12px 18px!important;font-size:15px!important;min-height:54px!important;box-shadow:none!important}' +
    '.fm-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12.5px;color:#cfcae8;min-height:24px}.fm-hint{text-align:right}.fm .fm-wake{display:flex!important;align-items:center;gap:6px;white-space:nowrap;color:#cfcae8!important;margin:0!important;font-weight:500!important;font-size:12.5px!important}.fm-wake[hidden]{display:none!important}.fm-wake input{width:18px;height:18px;min-height:0}' +
    'button.fm-pill{position:fixed;left:14px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:45;background:#2a2550!important;color:#fff!important;border:0!important;border-radius:999px!important;padding:9px 15px!important;font-size:15px!important;font-weight:700;font-variant-numeric:tabular-nums;box-shadow:0 6px 20px rgba(30,20,80,.3)!important;min-height:42px!important;width:auto!important}.fm-pill[hidden]{display:none}' +
    '.fm-big{display:block;margin:4px auto 10px;min-height:40px;font-size:14px}html.fm-on body{overflow:hidden}html.fm-on .appnav,html.fm-on .shiro-launch{visibility:hidden}' +
    '@media (min-width:700px){.fm-pill{bottom:96px;left:calc(50% - 300px)}}';
  document.head.appendChild(css);

  build(); watch();
  window.FC_FOCUS = { show: show, hide: hide, toggle: toggle };
  if (typeof render === 'function') render();
  // 앱을 열었는데 타이머가 돌고 있으면 바로 타이머 화면
  if (kid() && running() && !locked()) show();
})();
