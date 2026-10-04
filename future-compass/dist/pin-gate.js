/* 4자리 비밀번호 잠금 (이 기기 전용)
   - 처음: 비밀번호 4자리 입력 → 한 번 더 입력 → 저장 후 바로 입장
   - 이후: 브라우저(앱)를 새로 열 때마다 비밀번호 입력
   - 비밀번호는 해시로만 저장. 이 기기 밖으로 보내지 않음
   ※ 화면 잠금용이며 서버 보안이 아님 (README 참고) */
(function () {
  'use strict';
  var PIN_KEY = 'fc-pin-v1', FAIL_KEY = 'fc-pin-fail-v1', SESSION_KEY = 'fc-unlocked-v1';
  var MAX_FAIL = 5, LOCK_MS = 30000;
  var root = document.documentElement;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  // 이미 이 창에서 열었으면 잠그지 않음
  if (ssGet(SESSION_KEY) === '1' && lsGet(PIN_KEY)) return addLockButtonWhenReady();
  root.classList.add('pin-locked');

  /* ---------- 해시 (crypto.subtle 없으면 대체 해시) ---------- */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function fallbackHash(s) { // FNV-1a 64bit 근사 (보안용 아님, subtle 미지원 환경 대비)
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var i = 0; i < s.length; i++) { h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 16777619) >>> 0; h2 ^= h1; h2 = Math.imul(h2, 2246822507) >>> 0; }
    return 'f' + h1.toString(16) + h2.toString(16);
  }
  function hashPin(pin, salt) {
    var text = salt + ':' + pin + ':future-compass';
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(hex).catch(function () { return fallbackHash(text); });
      }
    } catch (e) {}
    return Promise.resolve(fallbackHash(text));
  }
  function newSalt() {
    try { var a = new Uint8Array(8); crypto.getRandomValues(a); return hex(a.buffer); } catch (e) { return String(Date.now()) + Math.random().toString(16).slice(2); }
  }
  function readStored() { try { var v = JSON.parse(lsGet(PIN_KEY) || 'null'); return v && v.salt && v.hash ? v : null; } catch (e) { return null; } }

  /* ---------- 화면 ---------- */
  var gate, titleEl, msgEl, dotsEl, padEl, forgotEl, confirmBox;
  var mode, entered = '', firstPin = '', busy = false, changing = false;

  function build(startMode) {
    gate = document.createElement('div');
    gate.id = 'pin-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'pin-title');
    gate.innerHTML =
      '<div class="pin-card">' +
        '<div class="pin-logo" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" stroke="#fff" stroke-width="2"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill="#f4c95d"/></svg></div>' +
        '<p class="pin-brand">미래 나침반</p>' +
        '<h1 id="pin-title" class="pin-title"></h1>' +
        '<div class="pin-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<label class="pin-sr" for="pin-input">비밀번호 4자리</label>' +
        '<input id="pin-input" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" autofocus>' +
        '<p class="pin-msg" role="status" aria-live="polite"></p>' +
        '<div class="pin-pad">' +
          [1,2,3,4,5,6,7,8,9].map(function (n) { return '<button type="button" data-key="' + n + '">' + n + '</button>'; }).join('') +
          '<button type="button" data-key="back" aria-label="한 칸 지우기">←</button><button type="button" data-key="0">0</button><button type="button" data-key="clear" aria-label="모두 지우기">C</button>' +
        '</div>' +
        '<button type="button" class="pin-forgot">비밀번호를 잊었어요</button>' +
        '<button type="button" class="pin-cancel-change" hidden>바꾸지 않고 돌아가기</button>' +
        '<div class="pin-confirm" hidden>' +
          '<p><b>처음부터 다시 시작할까?</b><br>비밀번호와 이 기기에 저장된 미래 나침반 기록(공부방·진로 탐색·계획)이 모두 지워져.</p>' +
          '<div class="pin-confirm-row"><button type="button" class="pin-cancel">취소</button><button type="button" class="pin-reset">기록 지우고 다시 시작</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(gate);
    titleEl = gate.querySelector('.pin-title');
    msgEl = gate.querySelector('.pin-msg');
    dotsEl = gate.querySelectorAll('.pin-dots i');
    padEl = gate.querySelector('.pin-pad');
    forgotEl = gate.querySelector('.pin-forgot');
    confirmBox = gate.querySelector('.pin-confirm');
    var input = gate.querySelector('#pin-input');

    padEl.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || busy) return;
      var k = b.getAttribute('data-key');
      if (k === 'back') entered = entered.slice(0, -1);
      else if (k === 'clear') entered = '';
      else if (entered.length < 4) entered += k;
      sync(); if (entered.length === 4) submit();
    });
    input.addEventListener('input', function () {
      if (busy) { input.value = entered; return; }
      entered = input.value.replace(/\D/g, '').slice(0, 4);
      sync(); if (entered.length === 4) submit();
    });
    document.addEventListener('keydown', function (e) {
      if (!gate.isConnected || document.activeElement === input) return;
      if (/^[0-9]$/.test(e.key) && entered.length < 4 && !busy) { entered += e.key; sync(); if (entered.length === 4) submit(); }
      else if (e.key === 'Backspace') { entered = entered.slice(0, -1); sync(); }
    });
    forgotEl.addEventListener('click', function () { confirmBox.hidden = false; forgotEl.hidden = true; });
    gate.querySelector('.pin-cancel').addEventListener('click', function () { confirmBox.hidden = true; forgotEl.hidden = false; });
    gate.querySelector('.pin-reset').addEventListener('click', resetAll);

    gate.querySelector('.pin-cancel-change').addEventListener('click', function () { changing = false; gate.remove(); root.classList.remove('pin-locked'); });
    mode = (typeof startMode === 'string' && startMode) || (readStored() ? 'unlock' : 'setup1');
    if (changing) gate.querySelector('.pin-cancel-change').hidden = false;
    showMode();
    setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }

  function sync() {
    for (var i = 0; i < 4; i++) dotsEl[i].classList.toggle('on', i < entered.length);
    var input = gate.querySelector('#pin-input'); if (input.value !== entered) input.value = entered;
  }
  function showMode(extra) {
    entered = ''; sync();
    forgotEl.hidden = mode !== 'unlock';
    if (mode === 'setup1') { titleEl.textContent = '사용할 비밀번호 4자리를 정해줘'; msgEl.textContent = extra || '이 기기에서만 쓰는 비밀번호야.'; }
    if (mode === 'setup2') { titleEl.textContent = '한 번 더 입력해줘'; msgEl.textContent = extra || '같은 숫자 4자리를 다시 눌러줘.'; }
    if (mode === 'unlock') { titleEl.textContent = changing ? '지금 쓰는 비밀번호를 입력해줘' : '비밀번호 4자리를 입력해줘'; msgEl.textContent = extra || (changing ? '확인되면 새 번호를 정할 수 있어.' : ''); }
    if (mode === 'setup1' && changing) titleEl.textContent = '새 비밀번호 4자리를 정해줘';
    if (changing) forgotEl.hidden = true;
    checkLock();
  }
  function failState() { try { return JSON.parse(lsGet(FAIL_KEY) || '{"n":0,"until":0}'); } catch (e) { return { n: 0, until: 0 }; } }
  function checkLock() {
    if (mode !== 'unlock') return false;
    var f = failState(), left = f.until - Date.now();
    if (left > 0) {
      busy = true; gate.classList.add('pin-wait');
      msgEl.textContent = Math.ceil(left / 1000) + '초 뒤에 다시 입력할 수 있어.';
      setTimeout(checkLock, 1000);
      return true;
    }
    if (busy && gate.classList.contains('pin-wait')) { busy = false; gate.classList.remove('pin-wait'); msgEl.textContent = ''; }
    return false;
  }
  function shake(text) {
    gate.querySelector('.pin-card').classList.remove('pin-shake'); void gate.offsetWidth;
    gate.querySelector('.pin-card').classList.add('pin-shake');
    entered = ''; sync(); msgEl.textContent = text;
  }

  function submit() {
    if (busy) return;
    var pin = entered;
    if (mode === 'setup1') { firstPin = pin; mode = 'setup2'; showMode(); return; }
    if (mode === 'setup2') {
      if (pin !== firstPin) { mode = 'setup1'; firstPin = ''; showMode('두 번 입력한 숫자가 달라. 처음부터 다시 정해줘.'); shake(msgEl.textContent); return; }
      busy = true; msgEl.textContent = '저장하는 중…';
      var salt = newSalt();
      hashPin(pin, salt).then(function (h) {
        if (!lsSet(PIN_KEY, JSON.stringify({ salt: salt, hash: h, v: 1, at: new Date().toISOString() }))) {
          busy = false; mode = 'setup1'; showMode('저장하지 못했어. 브라우저의 사이트 데이터 저장이 꺼져 있는지 확인해줘.'); return;
        }
        lsDel(FAIL_KEY);
        busy = false; var wasChanging = changing; changing = false; unlock(wasChanging ? '새 비밀번호로 바꿨어.' : '비밀번호를 저장했어. 다음부터 이 번호로 들어오면 돼.');
      });
      return;
    }
    if (mode === 'unlock') {
      if (checkLock()) return;
      var stored = readStored();
      if (!stored) { mode = 'setup1'; showMode(); return; }
      busy = true;
      hashPin(pin, stored.salt).then(function (h) {
        busy = false;
        if (h === stored.hash) { lsDel(FAIL_KEY); if (changing) { mode = 'setup1'; showMode('기록은 그대로 두고 번호만 바꿔.'); return; } unlock(); return; }
        var f = failState(); f.n = (f.n || 0) + 1;
        if (f.n >= MAX_FAIL) { f = { n: 0, until: Date.now() + LOCK_MS }; lsSet(FAIL_KEY, JSON.stringify(f)); shake(''); checkLock(); return; }
        lsSet(FAIL_KEY, JSON.stringify(f));
        shake('비밀번호가 달라. (' + f.n + '/' + MAX_FAIL + ')');
      });
    }
  }

  function unlock(notice) {
    ssSet(SESSION_KEY, '1');
    root.classList.remove('pin-locked');
    if (gate) gate.remove();
    addLockButton();
    if (notice) toast(notice);
    try { window.dispatchEvent(new Event('pin-unlocked')); } catch (e) {}
  }
  function toast(text) {
    var t = document.createElement('div'); t.className = 'pin-toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4200);
  }
  function resetAll() {
    var keys = [];
    try { for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch (e) {}
    keys.forEach(function (k) { if (/^(fc[-_]|compass-|future-compass)/.test(k)) lsDel(k); });
    ssDel(SESSION_KEY);
    location.reload();
  }

  /* ---------- 잠그기 버튼 ---------- */
  function addLockButton() {
    if (document.querySelector('.pin-tools')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pin-lock-btn'; b.setAttribute('aria-label', '미래 나침반 잠그기'); b.textContent = '🔒 잠그기';
    b.addEventListener('click', function () { ssDel(SESSION_KEY); location.reload(); });
    var c = document.createElement('button');
    c.type = 'button'; c.className = 'pin-lock-btn pin-change-btn'; c.setAttribute('aria-label', '비밀번호 바꾸기'); c.textContent = '🔑 번호 바꾸기';
    c.addEventListener('click', function () { if (document.getElementById('pin-gate')) return; changing = true; root.classList.add('pin-locked'); build('unlock'); });
    var wrap = document.createElement('span'); wrap.className = 'pin-tools'; wrap.appendChild(c); wrap.appendChild(b);
    var host = document.querySelector('.sidebar') || document.querySelector('body > main > header') || document.querySelector('body > header') || document.querySelector('.wrap > header .brand');
    if (host) host.appendChild(wrap); else { wrap.classList.add('pin-lock-float'); document.body.appendChild(wrap); }
  }
  function addLockButtonWhenReady() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLockButton); else addLockButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { build(); }); else build();
})();
