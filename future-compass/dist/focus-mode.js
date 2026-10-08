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
  function isBreak() { return T().duration === 300; }
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

  /* ── 타이머 화면 ── */
  var el = null, pill = null, open = false, R = 118, C = 2 * Math.PI * R;
  function build() {
    if (el) return;
    el = document.createElement('div'); el.className = 'fm'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '집중 타이머');
    el.innerHTML = '<div class="fm-top"><span class="fm-label"></span><button type="button" class="fm-x" data-fm-min aria-label="작게 보기">작게 ⌄</button></div>' +
      '<div class="fm-mid"><div class="fm-dial"><svg viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="' + R + '" class="fm-track"/><circle cx="130" cy="130" r="' + R + '" class="fm-bar" stroke-dasharray="' + C.toFixed(1) + '" transform="rotate(-90 130 130)"/></svg>' +
      '<div class="fm-face"><div class="fm-clock" aria-live="off"></div><div class="fm-sub"></div></div></div>' +
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
    var t = T(), s = left(), on = running(), br = isBreak();
    var showPill = kid() && !open && t.end && on && tab !== 'focus';
    pill.hidden = !showPill; if (showPill) pill.textContent = (br ? '🌿 ' : '⏱ ') + mmss(s);
    if (!open) return;
    el.classList.toggle('fm-break', br); el.classList.toggle('fm-paused', !t.end);
    el.querySelector('.fm-label').textContent = br ? '🌿 쉬는 시간' : '⏱ 집중 ' + Math.round(t.duration / 60) + '분';
    el.querySelector('.fm-clock').textContent = mmss(s);
    el.querySelector('.fm-sub').textContent = t.end ? hhmm(t.end) + '에 끝나' : (s === t.duration ? '준비됐어?' : '잠깐 멈춤');
    el.querySelector('.fm-bar').style.strokeDashoffset = (C * (s / t.duration)).toFixed(1);
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
  function stop() { var t = T(); t.remaining = t.duration; t.end = 0; save(); render(); watch(); hide(); }

  /* ── 상태 변화 감시: 어떤 버튼으로 시작/멈춤해도 여기서 한 번에 처리 ── */
  var lastEnd = 0, lastDur = 0, booted = false;
  function watch() {
    var t = T();
    if (!booted) { booted = true; lastEnd = t.end; lastDur = t.duration; return; }
    if (t.end === lastEnd) return;
    var was = lastEnd; lastEnd = t.end;
    if (t.end && !was) { serverSet(t.end); if (kid() && !open && document.visibilityState === 'visible') show(); }
    else if (t.end && was) { serverSet(t.end); }
    else if (!t.end && was) {
      serverClear(); clearLocalNote(); dropWake();
      if (t.remaining === 0 || was <= Date.now() + 1000) {   // 시간이 다 돼서 끝남
        if (kid()) { chime(); if (document.visibilityState !== 'visible') localNote(lastDur === 300 ? '🌿 쉬는 시간 끝' : '⏱ 집중 끝!', '잠깐 쉬어가자 🌱'); }
        hide();
      }
    }
    lastDur = t.duration;
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
  document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') hide(); });

  /* 집중 탭에 '크게 보기' 버튼 */
  var prev = render;
  render = function () {
    prev();
    if (tab === 'focus' && kid()) {
      var c = document.getElementById('clock');
      if (c && !document.querySelector('[data-fm-open].fm-big')) c.insertAdjacentHTML('afterend', '<button type="button" class="fm-big" data-fm-open>⛶ 타이머 화면으로 크게 보기</button>');
    }
    paint();
  };

  var css = document.createElement('style');
  css.textContent =
    '.fm{position:fixed;inset:0;z-index:900;display:flex;flex-direction:column;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top,0px)) 20px calc(18px + env(safe-area-inset-bottom,0px));background:radial-gradient(120% 80% at 50% 20%,#2f2a55 0%,#1b1930 60%,#141325 100%);color:#f4f2ff;font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;-webkit-user-select:none;user-select:none}' +
    '.fm[hidden]{display:none}.fm-break{background:radial-gradient(120% 80% at 50% 20%,#1f4a43 0%,#14302c 60%,#0f2420 100%)}' +
    '.fm-top{display:flex;justify-content:space-between;align-items:center}.fm-label{font-size:15px;font-weight:600;opacity:.85}' +
    '.fm button{font:inherit;border-radius:999px;cursor:pointer}.fm .fm-x{background:rgba(255,255,255,.12)!important;border:0!important;color:#f4f2ff!important;padding:8px 14px!important;font-size:14px!important;min-height:40px!important;box-shadow:none!important}' +
    '.fm-mid{display:flex;flex-direction:column;align-items:center;gap:14px}.fm-dial{position:relative;width:min(78vw,46vh,340px);aspect-ratio:1}' +
    '.fm-dial svg{width:100%;height:100%}.fm-track{fill:none;stroke:rgba(255,255,255,.1);stroke-width:12}.fm-bar{fill:none;stroke:#a89bff;stroke-width:12;stroke-linecap:round;transition:stroke-dashoffset .5s linear}.fm-break .fm-bar{stroke:#7fe0c4}' +
    '.fm-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}' +
    '.fm-clock{font-size:clamp(56px,19vw,92px);font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}.fm-sub{margin-top:8px;font-size:15px;opacity:.7}' +
    '.fm-paused .fm-clock{opacity:.55}.fm-task{margin:0;font-size:16px;text-align:center;max-width:32ch;opacity:.9;line-height:1.4}' +
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
