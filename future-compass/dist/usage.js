/* 사용 통계 (보호자 확인용). 어떤 화면을 몇 번·몇 분 봤는지, 어떤 기능을 눌렀는지만 모은다.
   할 일·메모·시간표 같은 내용은 보내지 않는다. 대시보드: /usage.html (관리자 토큰 필요).
   이 기기를 통계에서 빼려면 localStorage 'fc-usage-optout' = '1' (대시보드에서 자동 설정). */
(function () {
  'use strict';
  try { if (localStorage.getItem('fc-usage-optout') === '1') return; } catch (e) { return; }
  var ENDPOINT = '/api/usage', FLUSH_MS = 120000, TICK_MS = 30000, IDLE_MS = 120000;
  var path = location.pathname.replace(/\/+$/, '/');
  var PAGE = /study/.test(path) ? 'study' : /hub/.test(path) ? 'hub' : /future/.test(path) ? 'future' : /know-me/.test(path) ? 'know-me' : 'home';
  var queue = [], minutes = 0, lastInput = Date.now(), started = false, view = '';

  function device() {
    try {
      var id = localStorage.getItem('fc-device-id');
      if (!id || !/^[a-f0-9]{16,64}$/.test(id)) {
        var a = new Uint8Array(16); crypto.getRandomValues(a);
        id = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        localStorage.setItem('fc-device-id', id);
      }
      return id;
    } catch (e) { return ''; }
  }
  function unlocked() { return !document.documentElement.classList.contains('pin-locked'); }
  function push(type, name) {
    if (!name) return;
    queue.push({ t: type, n: String(name).slice(0, 40) });
    if (queue.length > 60) flush();
  }
  function flush(final) {
    if (!started || (!queue.length && minutes < 0.5)) return;
    var body = JSON.stringify({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), device: device(), page: PAGE, minutes: Math.round(minutes * 2) / 2, events: queue.splice(0, 80) });
    minutes = 0;
    try {
      fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: true }).catch(function () {
        if (final && navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      });
    } catch (e) {}
  }
  function setView(v) { if (v && v !== view) { view = v; push('view', PAGE + (v === PAGE ? '' : ':' + v)); } }
  function currentView() {
    var h = location.hash.replace('#', '');
    if (PAGE === 'study') return h || 'today';
    if (PAGE === 'hub') { var a = document.querySelector('.sh-tabs a[aria-selected="true"]'); return a ? a.getAttribute('href').replace('#sh-', '') : 'sites'; }
    if (PAGE === 'home') return h ? h.replace(/^shiro-/, '') : 'home';
    return PAGE;
  }
  function start() {
    if (started || !unlocked()) return;
    started = true; push('session', PAGE); setView(currentView());
  }

  // 무엇을 눌렀는지(내용 없이 기능 이름만)
  var CLICK = [
    ['nav button[data-go]', function (el) { return 'tab:' + el.getAttribute('data-go'); }],
    ['[data-go-course]', 'course_pick_open'], ['[data-tt-apply]', 'timetable_apply'], ['[data-tt-paste-open]', 'timetable_paste'],
    ['[data-tt-neis]', 'timetable_neis'], ['[data-week]', 'week_move'], ['[data-result]', function (el) { return 'review_' + el.getAttribute('data-result'); }],
    ['[data-timer]', 'timer'], ['[data-duration]', 'timer_set'], ['[data-carry]', 'task_carry'], ['[data-template]', 'exam_template'],
    ['a.sh-go', function (el) { var a = el.closest('.sh-site'); return 'site:' + (a ? a.id.replace('site-', '') : 'link'); }],
    ['.sh-tabs a', function (el) { return 'hub_tab:' + el.getAttribute('href').replace('#sh-', ''); }],
    ['.sh-more', 'hub_more'], ['#study-backup', 'backup'], ['#study-restore', 'restore'],
    ['.focus-study', 'home_to_study'], ['.focus-hub', 'home_to_hub'], ['.focus-paths a', function (el) { return 'home_path:' + (el.getAttribute('href') || '').replace(/[^a-z-]/g, ''); }],
    ['.pin-lock-btn', 'lock'], ['.pin-forgot', 'pin_forgot']
  ];
  document.addEventListener('click', function (e) {
    lastInput = Date.now(); start();
    for (var i = 0; i < CLICK.length; i++) {
      var el = e.target.closest && e.target.closest(CLICK[i][0]);
      if (el) { var n = CLICK[i][1]; push('act', typeof n === 'function' ? n(el) : n); break; }
    }
    setTimeout(function () { setView(currentView()); }, 50);
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-prep]')) push('act', t.checked ? 'prep_done' : 'prep_undo');
    else if (t.matches && t.matches('[data-check]')) push('act', t.checked ? 'check_' + t.getAttribute('data-check') : 'uncheck');
    else if (t.matches && t.matches('[data-tt-image]')) push('act', 'timetable_photo');
    else if (t.matches && t.matches('[data-st-class]')) push('act', 'class_pick');
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target, k = f.getAttribute('data-form') || f.getAttribute('data-plus') || (f.matches('[data-offday]') ? 'offday' : '') || (f.classList.contains('sh-form') ? 'hub_link' : '');
    if (k) push('act', 'save_' + k);
  }, true);
  ['keydown', 'scroll', 'touchstart', 'pointermove'].forEach(function (ev) { window.addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true }); });
  window.addEventListener('hashchange', function () { setView(currentView()); });
  window.addEventListener('pin-unlocked', start);

  setInterval(function () {
    if (!started) { start(); return; }
    if (document.visibilityState === 'visible' && Date.now() - lastInput < IDLE_MS) minutes += TICK_MS / 60000;
  }, TICK_MS);
  setInterval(function () { flush(false); }, FLUSH_MS);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
  window.addEventListener('pagehide', function () { flush(true); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
