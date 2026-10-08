/* 4자리 비밀번호 잠금 (이 기기 전용)
   - 처음: 비밀번호 4자리 입력 → 한 번 더 입력 → 저장 후 바로 입장
   - 이후: 브라우저(앱)를 새로 열 때마다 비밀번호 입력
   - 비밀번호는 해시로만 저장. 이 기기 밖으로 보내지 않음
   ※ 화면 잠금용이며 서버 보안이 아님 (README 참고) */
(function () {
  'use strict';
  var PIN_KEY = 'fc-pin-v1', FAIL_KEY = 'fc-pin-fail-v1', SESSION_KEY = 'fc-unlocked-v1', QA_KEY = 'fc-pin-qa-v1', QA_FAIL = 'fc-pin-qa-fail-v1', WHO_KEY = 'fc-who-v1';
  var QUESTIONS = ['처음 키운 반려동물(또는 갖고 싶은 동물) 이름은?', '초등학교 때 가장 친한 친구 이름은?', '제일 좋아하는 음식은?', '내 별명은?'];
  var MAX_FAIL = 5, LOCK_MS = 30000;
  var root = document.documentElement;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  // 이미 이 창에서 열었으면 잠그지 않음
  if (ssGet(SESSION_KEY) === '1' && lsGet(PIN_KEY)) { exposeApi(); return addLockButtonWhenReady(); }
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
        '<div class="pin-hero" aria-hidden="true"></div>' +
        '<div class="pin-logo" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" stroke="#fff" stroke-width="2"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill="#f4c95d"/></svg></div>' +
        '<p class="pin-brand">승준 공부관리 방</p>' +
        '<h1 id="pin-title" class="pin-title"></h1>' +
        '<div class="pin-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<label class="pin-sr" for="pin-input">비밀번호 4자리</label>' +
        '<input id="pin-input" class="pin-input" type="password" inputmode="none" readonly tabindex="-1" maxlength="4" autocomplete="off" aria-hidden="true">' +
        '<p class="pin-msg" role="status" aria-live="polite"></p>' +
        '<div class="pin-pad">' +
          [1,2,3,4,5,6,7,8,9].map(function (n) { return '<button type="button" data-key="' + n + '">' + n + '</button>'; }).join('') +
          '<button type="button" data-key="back" aria-label="한 칸 지우기">←</button><button type="button" data-key="0">0</button><button type="button" data-key="clear" aria-label="모두 지우기">C</button>' +
        '</div>' +
        '<button type="button" class="pin-forgot">비밀번호를 잊었어요</button>' +
        '<button type="button" class="pin-family" hidden>👨‍👩‍👧 가족 비밀번호로 들어가기</button>' +
        '<div class="pin-role" hidden><div class="pin-who-row">' + ['child', 'parent'].map(function (r) { return '<button type="button" data-role="' + r + '">' + (window.FC_CHAR ? FC_CHAR.avatar(r, 92) : (r === 'parent' ? '👩' : '🧒')) + '<b>' + (r === 'parent' ? '엄마로 들어가기' : '승준으로 들어가기') + '</b></button>'; }).join('') + '</div></div>' +
        '<button type="button" class="pin-cancel-change" hidden>바꾸지 않고 돌아가기</button>' +
        '<div class="pin-qa-setup" hidden><p><b>비밀번호를 잊었을 때 쓸 질문을 정해둘래?</b><br>나만 아는 답이면 메일 없이도 바로 찾을 수 있어. (선택)</p>' +
          '<label>질문<select class="pin-qa-sel">' + QUESTIONS.map(function (q) { return '<option>' + q + '</option>'; }).join('') + '<option value="__custom">직접 적기</option></select></label>' +
          '<input class="pin-qa-custom" maxlength="60" placeholder="질문을 직접 적어줘" hidden>' +
          '<label>답<input class="pin-qa-ans" maxlength="40" autocomplete="off" placeholder="띄어쓰기·대소문자는 상관없어"></label>' +
          '<p class="pin-qa-msg" role="status"></p><div class="pin-confirm-row"><button type="button" class="pin-qa-skip">다음에</button><button type="button" class="pin-qa-save">저장</button></div></div>' +
        '<div class="pin-confirm pin-recover" hidden>' +
          '<p><b>어떤 방법으로 찾을까?</b><br>어느 쪽이든 새 비밀번호를 정하면 공부 기록은 그대로 남아.</p>' +
          '<div class="pin-rec-choices"><button type="button" class="pin-rec-qa-open">🙋 내가 정한 질문으로 찾기</button><button type="button" class="pin-rec-mail-open">📧 보호자 메일로 코드 받기</button></div>' +
          '<div class="pin-rec-qa" hidden><p class="pin-qa-q"></p><div class="pin-rec-code"><label class="pin-sr" for="pin-qa-input">답</label><input id="pin-qa-input" class="pin-qa-input" maxlength="40" autocomplete="off" placeholder="내가 정한 답"><button type="button" class="pin-qa-check">확인</button></div></div>' +
          '<div class="pin-rec-mail" hidden><button type="button" class="pin-rec-send">📧 복구 코드 보내기</button>' +
          '<div class="pin-rec-code" hidden><label class="pin-sr" for="pin-rec-input">복구 코드 6자리</label><input id="pin-rec-input" class="pin-rec-input" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="코드 6자리"><button type="button" class="pin-rec-check">확인</button></div></div>' +
          '<p class="pin-rec-status" role="status" aria-live="polite"></p>' +
          '<button type="button" class="pin-cancel">비밀번호 화면으로 돌아가기</button>' +
          '<details class="pin-last"><summary>메일을 받을 수 없을 때</summary>' +
            '<p>비밀번호와 이 기기의 기록(공부방·진로 탐색·계획)이 모두 지워져. 백업 파일이 있으면 다시 시작한 뒤 공부방 ⋯ 저장 → 백업 불러오기로 되살릴 수 있어.</p>' +
            '<button type="button" class="pin-reset">기록 지우고 처음부터</button>' +
          '</details>' +
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
      if (!gate.isConnected || document.activeElement === input || (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) || !confirmBox.hidden) return;
      if (/^[0-9]$/.test(e.key) && entered.length < 4 && !busy) { entered += e.key; sync(); if (entered.length === 4) submit(); }
      else if (e.key === 'Backspace') { entered = entered.slice(0, -1); sync(); }
    });
    forgotEl.addEventListener('click', function () { confirmBox.hidden = false; forgotEl.hidden = true; gate.querySelector('.pin-card').classList.add('pin-recovering'); titleEl.textContent = '비밀번호 찾기'; msgEl.textContent = ''; });
    gate.querySelector('.pin-cancel').addEventListener('click', function () { confirmBox.hidden = true; forgotEl.hidden = false; gate.querySelector('.pin-card').classList.remove('pin-recovering'); showMode(); });
    gate.querySelector('.pin-reset').addEventListener('click', function () { if (confirm('정말 이 기기의 기록을 모두 지울까? 되돌릴 수 없어.')) resetAll(); });
    gate.querySelector('.pin-rec-send').addEventListener('click', sendCode);
    gate.querySelector('.pin-family').addEventListener('click', function () { if (mode === 'family') { mode = familyBack && familyBack !== 'family' ? familyBack : (readStored() ? 'unlock' : 'setup1'); } else { familyBack = mode; mode = 'family'; } showMode(); });
    gate.querySelectorAll('.pin-role [data-role]').forEach(function (b) { b.addEventListener('click', function () {
      var r = b.getAttribute('data-role'); setWho(r);
      if (window.FamilySync && whoFamily) FamilySync.start(true);
      var n = (whoNotice ? whoNotice + ' ' : '') + (r === 'parent' ? '엄마로 들어왔어요 💜' : '승준, 오늘도 화이팅 🐾'); changing = false; recovering = false; whoNotice = ''; whoFamily = false; reallyUnlock(n);
    }); });
    gate.querySelector('.pin-rec-mail-open').addEventListener('click', function () { gate.querySelector('.pin-rec-mail').hidden = false; gate.querySelector('.pin-rec-qa').hidden = true; recStatus(''); });
    gate.querySelector('.pin-rec-qa-open').addEventListener('click', function () {
      var qa = readQA(); if (!qa) { recStatus('아직 질문을 정하지 않았어. 보호자 메일로 찾아줘.'); return; }
      gate.querySelector('.pin-rec-qa').hidden = false; gate.querySelector('.pin-rec-mail').hidden = true; gate.querySelector('.pin-qa-q').textContent = 'Q. ' + qa.q; recStatus('');
      setTimeout(function () { try { gate.querySelector('.pin-qa-input').focus(); } catch (e) {} }, 30);
    });
    gate.querySelector('.pin-qa-check').addEventListener('click', checkQA);
    gate.querySelector('.pin-qa-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkQA(); });
    gate.querySelector('.pin-qa-sel').addEventListener('change', function (e) { var c = gate.querySelector('.pin-qa-custom'); c.hidden = e.target.value !== '__custom'; if (!c.hidden) c.focus(); });
    gate.querySelector('.pin-qa-skip').addEventListener('click', function () { finishSetup(); });
    gate.querySelector('.pin-qa-save').addEventListener('click', saveQA);
    if (!readQA()) { var qb = gate.querySelector('.pin-rec-qa-open'); qb.classList.add('pin-off'); qb.textContent = '🙋 내가 정한 질문으로 찾기 (질문 없음)'; }
    gate.querySelector('.pin-rec-check').addEventListener('click', checkCode);
    gate.querySelector('.pin-rec-input').addEventListener('input', function (e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); if (e.target.value.length === 6) checkCode(); });

    gate.querySelector('.pin-cancel-change').addEventListener('click', function () { changing = false; gate.remove(); root.classList.remove('pin-locked'); });
    var st0 = readStored(), joined0 = window.FamilySync && FamilySync.joined();
    // 우리 가족 전용: 어느 기기든 같은 가족 비밀번호. 이 기기가 아직 가족에 연결 안 됐으면 가족 비밀번호부터
    // 이 폰에 번호가 있으면 그 번호로(맞으면 같은 번호로 가족 공유까지 자동 연결), 없으면 우리 가족 비밀번호부터
    mode = (typeof startMode === 'string' && startMode) || (st0 ? 'unlock' : window.FamilySync ? 'family' : 'setup1');
    if (mode === 'family' && !startMode) familyBack = 'setup1';
    if (mode === 'family' && window.FamilySync) FamilySync.status().then(function (j) { if (j && j._ok && j.enabled === false && mode === 'family' && !entered) { mode = 'init1'; showMode(); } });
    if (changing) gate.querySelector('.pin-cancel-change').hidden = false;
    showMode();
    if (mode === 'who') showWho('', false);
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}   // 폰 키보드가 뜨지 않게: 화면 숫자판만 사용
  }

  function sync() {
    for (var i = 0; i < 4; i++) dotsEl[i].classList.toggle('on', i < entered.length);
    var input = gate.querySelector('#pin-input'); if (input.value !== entered) input.value = entered;
  }
  var familyBack = '', oldPin = '';
  function showMode(extra) {
    entered = ''; sync();
    forgotEl.hidden = mode !== 'unlock';
    var fb = gate.querySelector('.pin-family');
    fb.hidden = !((mode === 'setup1' && !changing && !recovering) || (mode === 'unlock' && !changing && window.FamilySync && !FamilySync.joined()) || (mode === 'family' && readStored() && !(window.FamilySync && FamilySync.joined())));
    fb.textContent = mode === 'family' ? '← 이 기기만 쓰는 비밀번호로' : '👨‍👩‍👧 가족 비밀번호로 들어가기';
    if (mode === 'family') { titleEl.textContent = '우리 가족 비밀번호 4자리'; msgEl.textContent = extra || '어느 폰에서든 같은 번호야. 들어오면 시간표·기록·캐릭터가 모두 똑같이 맞춰져.'; checkLock(); return; }
    if (mode === 'init1') { fb.hidden = true; titleEl.textContent = '우리 가족 비밀번호를 정해줘'; msgEl.textContent = extra || '처음 한 번만 정하면 돼. 다른 폰에서도 이 번호로 들어와.'; return; }
    if (mode === 'init2') { fb.hidden = true; titleEl.textContent = '한 번 더 입력해줘'; msgEl.textContent = extra || '같은 숫자 4자리를 다시 눌러줘.'; return; }
    if (mode === 'setup1') { titleEl.textContent = '사용할 비밀번호 4자리를 정해줘'; msgEl.textContent = extra || '잊어버려도 보호자 메일로 되찾을 수 있어.'; }
    if (mode === 'setup2') { titleEl.textContent = '한 번 더 입력해줘'; msgEl.textContent = extra || '같은 숫자 4자리를 다시 눌러줘.'; }
    if (mode === 'unlock') { titleEl.textContent = changing ? '지금 쓰는 비밀번호를 입력해줘' : '비밀번호 4자리를 입력해줘'; msgEl.textContent = extra || (changing ? '확인되면 새 번호를 정할 수 있어.' : ''); }
    if (mode === 'setup1' && (changing || recovering)) titleEl.textContent = '새 비밀번호 4자리를 정해줘';
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
    if (mode === 'family') {
      if (!window.FamilySync) { shake('잠시 뒤 다시 해줘.'); return; }
      busy = true; msgEl.textContent = '확인하는 중…';
      FamilySync.join(pin).then(function (j) {
        busy = false;
        if (!j._ok) {
          var M = { wrong_pin: '가족 비밀번호가 달라.' + (j.left != null ? ' (남은 기회 ' + j.left + '번)' : ''), locked: '여러 번 틀려서 ' + (j.retryMin || 15) + '분 동안 막혔어.', not_enabled: '가족 공유가 아직 켜지지 않았어. 보호자 화면에서 가족 비밀번호를 먼저 정해줘.', network: '인터넷 연결을 확인해줘.' };
          shake(M[j.error] || '들어가지 못했어. 잠시 뒤 다시 해줘.'); return;
        }
        var salt = newSalt();
        hashPin(pin, salt).then(function (h) {
          lsSet(PIN_KEY, JSON.stringify({ salt: salt, hash: h, v: 1, family: true, at: new Date().toISOString() })); lsDel(FAIL_KEY);
          changing = false; showWho('가족 공유 연결 완료. 다음부터 이 비밀번호로 들어오면 돼.', true);
        });
      });
      return;
    }
    if (mode === 'init1') { firstPin = pin; mode = 'init2'; showMode(); return; }
    if (mode === 'init2') {
      if (pin !== firstPin) { mode = 'init1'; firstPin = ''; showMode('두 번 입력한 숫자가 달라. 처음부터 다시 정해줘.'); shake(msgEl.textContent); return; }
      busy = true; msgEl.textContent = '저장하는 중…';
      FamilySync.init(pin).then(function (j) {
        busy = false;
        if (j.error === 'exists') { mode = 'family'; showMode('이미 우리 가족 비밀번호가 있어. 그 번호를 입력해줘.'); return; }
        if (!j._ok) { mode = 'init1'; firstPin = ''; showMode(j.error === 'network' ? '인터넷 연결을 확인해줘.' : '저장하지 못했어. 잠시 뒤 다시 해줘.'); return; }
        var salt1 = newSalt();
        hashPin(pin, salt1).then(function (h) {
          lsSet(PIN_KEY, JSON.stringify({ salt: salt1, hash: h, v: 1, family: true, at: new Date().toISOString() })); lsDel(FAIL_KEY);
          showWho('우리 가족 비밀번호를 정했어. 다른 폰에서도 이 번호로 들어오면 돼.', true);
        });
      });
      return;
    }
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
        if (window.FamilySync && FamilySync.joined() && (changing || recovering)) {
          var body = { action: 'change', pin: pin }; if (oldPin) body.old = oldPin;
          FamilySync.call(body).then(function (j) { toast(j && j._ok ? '가족 모든 폰의 비밀번호가 새 번호로 바뀌었어.' : j && j.error === 'managed' ? '가족 번호는 보호자 설정(Netlify FC_FAMILY_PIN)으로 고정돼 있어. 거기서 바꿔줘.' : '이 폰만 바뀌었어. 인터넷 연결 후 다시 바꿔줘.'); });
          try { var st2 = readStored(); st2.family = true; lsSet(PIN_KEY, JSON.stringify(st2)); } catch (e) {}
        }
        oldPin = '';
        busy = false; var wasChanging = changing || recovering; pendingNotice = wasChanging ? '새 비밀번호로 바꿨어. 기록은 그대로야.' : '비밀번호를 저장했어. 다음부터 이 번호로 들어오면 돼.';
        if (recovering && readQA()) { finishSetup(); return; }
        showQASetup();
      });
      return;
    }
    if (mode === 'unlock') {
      if (checkLock()) return;
      var stored = readStored();
      if (!stored) { mode = 'setup1'; showMode(); return; }
      busy = true;
      var okPin = function () { lsDel(FAIL_KEY); autoLink(pin); if (changing) { oldPin = pin; mode = 'setup1'; showMode('기록은 그대로 두고 번호만 바꿔. 가족 모든 폰에 같이 적용돼.'); return; } unlock(); };
      if (window.FamilySync && FamilySync.joined()) {
        msgEl.textContent = '확인하는 중…';
        FamilySync.call({ action: 'verify', pin: pin }).then(function (j) {
          if (j && j._ok) {   // 가족 비밀번호가 다른 폰에서 바뀌었어도 새 번호로 들어오면 이 폰도 맞춰짐
            var salt2 = newSalt(); hashPin(pin, salt2).then(function (h2) { lsSet(PIN_KEY, JSON.stringify({ salt: salt2, hash: h2, v: 1, family: true, at: new Date().toISOString() })); busy = false; okPin(); }); return;
          }
          if (j && j.error === 'wrong_pin') { busy = false; shake('비밀번호가 달라.' + (j.left != null ? ' (남은 기회 ' + j.left + '번)' : '')); return; }
          if (j && j.error === 'locked') { busy = false; shake('여러 번 틀려서 ' + (j.retryMin || 15) + '분 동안 막혔어.'); return; }
          if (j && j.error === 'rejoin') { busy = false; try { localStorage.removeItem('fc-family-v1'); } catch (e) {} mode = 'family'; showMode('가족 비밀번호가 새로 정해졌어. 새 번호로 들어와줘.'); return; }
          localCheck();   // 인터넷이 안 되면 이 폰에 저장된 번호로
        });
        return;
      }
      localCheck();
      function localCheck() {
      hashPin(pin, stored.salt).then(function (h) {
        busy = false;
        if (h === stored.hash) { okPin(); return; }
        var f = failState(); f.n = (f.n || 0) + 1;
        if (f.n >= MAX_FAIL) { f = { n: 0, until: Date.now() + LOCK_MS }; lsSet(FAIL_KEY, JSON.stringify(f)); shake(''); checkLock(); return; }
        lsSet(FAIL_KEY, JSON.stringify(f));
        shake('비밀번호가 달라. (' + f.n + '/' + MAX_FAIL + ')');
      });
      }
    }
  }

  /* 이 폰 번호로 들어오면 같은 번호로 가족 공유 자동 연결 (가족 번호가 아직 없으면 이 번호로 정함) */
  function autoLink(pin) {
    if (!window.FamilySync || FamilySync.joined() || changing) return;
    FamilySync.join(pin).then(function (j) {
      if (j && j._ok) return j;
      if (j && j.error === 'not_enabled') return FamilySync.init(pin);
      return j;
    }).then(function (j) {
      if (j && j._ok) {
        try { var st = readStored(); st.family = true; lsSet(PIN_KEY, JSON.stringify(st)); } catch (e) {}
        var w = getWho(); if (w) FamilySync.setRole(w);
        whoFamily = true;
        if (!gate || !gate.isConnected) { FamilySync.start(true); toast('가족 공유 연결 완료 👨‍👩‍👧 이제 어느 폰에서든 이 번호로 똑같이 보여.'); }
      } else if (j && j.error === 'wrong_pin') toast('이 번호는 가족 비밀번호와 달라서 공유 연결은 안 됐어. ⚙️ 설정 → 가족 공유에서 가족 번호로 연결해줘.');
    });
  }

  /* ---------- 나만 아는 질문 ---------- */
  var pendingNotice = '';
  function readQA() { try { var v = JSON.parse(lsGet(QA_KEY) || 'null'); return v && v.q && v.salt && v.hash ? v : null; } catch (e) { return null; } }
  function normAns(a) { return String(a || '').toLowerCase().replace(/\s+/g, '').trim(); }
  function showQASetup() {
    var box = gate.querySelector('.pin-qa-setup'), cur = readQA();
    gate.querySelector('.pin-card').classList.add('pin-recovering'); box.hidden = false; forgotEl.hidden = true;
    titleEl.textContent = cur ? '복구 질문 바꾸기' : '복구 질문 정하기'; msgEl.textContent = '';
    if (cur) { box.querySelector('.pin-qa-skip').textContent = '지금 질문 그대로'; }
    setTimeout(function () { try { box.querySelector('.pin-qa-ans').focus(); } catch (e) {} }, 30);
  }
  function saveQA() {
    var box = gate.querySelector('.pin-qa-setup'), sel = box.querySelector('.pin-qa-sel').value;
    var q = sel === '__custom' ? box.querySelector('.pin-qa-custom').value.trim() : sel, a = normAns(box.querySelector('.pin-qa-ans').value);
    var m = box.querySelector('.pin-qa-msg');
    if (!q) { m.textContent = '질문을 적어줘.'; return; }
    if (a.length < 2) { m.textContent = '답은 두 글자 이상으로 정해줘.'; return; }
    var salt = newSalt();
    hashPin(a, salt).then(function (h) { lsSet(QA_KEY, JSON.stringify({ q: q.slice(0, 60), salt: salt, hash: h, at: new Date().toISOString() })); lsDel(QA_FAIL); pendingNotice += ' 복구 질문도 저장했어.'; finishSetup(); });
  }
  function finishSetup() { var was = changing; changing = false; recovering = false; var n = pendingNotice; pendingNotice = ''; if (was) reallyUnlock(n); else unlock(n); }
  function checkQA() {
    var qa = readQA(); if (!qa || busy) return;
    var f = (function () { try { return JSON.parse(lsGet(QA_FAIL) || '{"n":0,"until":0}'); } catch (e) { return { n: 0, until: 0 }; } })();
    if (f.until > Date.now()) { recStatus(Math.ceil((f.until - Date.now()) / 60000) + '분 뒤에 다시 해줘. 급하면 보호자 메일로 찾아줘.'); return; }
    var inp = gate.querySelector('.pin-qa-input'), a = normAns(inp.value);
    if (!a) { recStatus('답을 적어줘.'); return; }
    busy = true;
    hashPin(a, qa.salt).then(function (h) {
      busy = false;
      if (h === qa.hash) { lsDel(QA_FAIL); recoverOK(); return; }
      f.n = (f.n || 0) + 1; if (f.n >= 5) f = { n: 0, until: Date.now() + 5 * 60000 };
      lsSet(QA_FAIL, JSON.stringify(f)); inp.value = '';
      recStatus(f.until ? '5번 틀려서 5분 동안 막혔어. 보호자 메일로도 찾을 수 있어.' : '답이 달라. (' + f.n + '/5)');
    });
  }
  function recoverOK() {
    recovering = true; lsDel(FAIL_KEY);
    confirmBox.hidden = true; gate.querySelector('.pin-card').classList.remove('pin-recovering');
    mode = 'setup1'; showMode('확인됐어. 기록은 그대로야. 새 비밀번호를 정해줘.'); titleEl.textContent = '새 비밀번호 4자리를 정해줘';
  }

  /* ---------- 보호자 메일 복구 ---------- */
  var recovering = false;
  var REC_MSG = {
    not_configured: '메일 복구가 아직 연결되지 않았어. 보호자에게 말해줘.',
    too_many_hour: '코드를 너무 자주 요청했어. 1시간 뒤에 다시 해줘.',
    too_many_day: '오늘은 코드를 더 보낼 수 없어. 내일 다시 해줘.',
    mail_failed: '메일을 보내지 못했어. 잠시 뒤 다시 해줘.',
    expired: '코드가 없거나 시간이 지났어. 코드를 다시 받아줘.',
    locked: '여러 번 틀려서 코드가 막혔어. 코드를 다시 받아줘.',
    bad_code: '코드 6자리를 입력해줘.',
    network: '인터넷 연결을 확인하고 다시 해줘.'
  };
  function deviceId() {
    var id = lsGet('fc-device-id');
    if (!id || !/^[a-f0-9]{16,64}$/.test(id)) { id = newSalt() + newSalt(); if (!/^[a-f0-9]{16,64}$/.test(id)) id = fallbackHash(String(Math.random()) + Date.now()).replace(/[^a-f0-9]/g, '').padEnd(16, '0').slice(0, 32); lsSet('fc-device-id', id); }
    return id;
  }
  function recApi(payload) {
    return fetch('/api/pin-recovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._ok = r.ok; return j; }); })
      .catch(function () { return { _ok: false, error: 'network' }; });
  }
  function recStatus(t, ok) { var el = gate.querySelector('.pin-rec-status'); el.textContent = t; el.classList.toggle('ok', !!ok); }
  function sendCode() {
    var b = gate.querySelector('.pin-rec-send'); b.disabled = true; recStatus('보내는 중…');
    recApi({ action: 'send', device: deviceId() }).then(function (j) {
      b.disabled = false;
      if (!j._ok) { recStatus(REC_MSG[j.error] || '보내지 못했어. 잠시 뒤 다시 해줘.'); return; }
      b.textContent = '코드 다시 보내기';
      gate.querySelector('.pin-rec-code').hidden = false;
      recStatus((j.to ? j.to + '로 ' : '보호자 메일로 ') + '코드를 보냈어. ' + (j.minutes || 15) + '분 안에 입력해줘.', true);
      setTimeout(function () { try { gate.querySelector('.pin-rec-input').focus(); } catch (e) {} }, 30);
    });
  }
  function checkCode() {
    var inp = gate.querySelector('.pin-rec-input'), code = inp.value;
    if (!/^\d{6}$/.test(code)) { recStatus(REC_MSG.bad_code); return; }
    if (busy) return; busy = true; recStatus('확인하는 중…');
    recApi({ action: 'verify', device: deviceId(), code: code }).then(function (j) {
      busy = false;
      if (!j._ok) { inp.value = ''; recStatus(j.error === 'wrong_code' ? '코드가 달라. (남은 기회 ' + (j.left != null ? j.left : '?') + '번)' : (REC_MSG[j.error] || '확인하지 못했어.')); return; }
      recoverOK();
    });
  }

  /* ---------- 승준으로 / 엄마로 들어가기 ---------- */
  var whoNotice = '', whoFamily = false;
  function getWho() { var w = lsGet(WHO_KEY); if (w === 'child' || w === 'parent') return w; var f = window.FamilySync && FamilySync.role(); return f === 'child' || f === 'parent' ? f : ''; }
  function setWho(r) {
    lsSet(WHO_KEY, r);
    if (window.FamilySync && FamilySync.joined()) FamilySync.setRole(r);
    if (r === 'parent') lsSet('fc-usage-optout', '1'); else lsDel('fc-usage-optout');
  }
  function showWho(notice, family) {
    whoNotice = notice || ''; whoFamily = !!family;
    var card = gate.querySelector('.pin-card'); card.classList.add('pin-recovering', 'pin-who');
    ['.pin-forgot', '.pin-family', '.pin-qa-setup', '.pin-cancel-change', '.pin-confirm'].forEach(function (q) { var e = gate.querySelector(q); if (e) e.hidden = true; });
    titleEl.textContent = '승준 공부관리 방'; msgEl.textContent = notice || '';
    var box = gate.querySelector('.pin-role'); box.hidden = false;
    var last = getWho(); box.querySelectorAll('[data-role]').forEach(function (b) { b.classList.toggle('last', b.getAttribute('data-role') === last); });
  }
  function unlock(notice) { if (gate && gate.isConnected) { showWho(notice, false); return; } reallyUnlock(notice); }
  function reallyUnlock(notice) {
    ssSet(SESSION_KEY, '1');
    root.classList.remove('pin-locked');
    if (gate) gate.remove();
    var old = document.querySelector('.pin-tools'); if (old) old.remove();
    addLockButton();
    if (notice) toast(notice);
    try { window.dispatchEvent(new Event('pin-unlocked')); } catch (e) {}
  }
  function toast(text) {
    document.querySelectorAll('.pin-toast').forEach(function (x) { x.remove(); });
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
    try { window.dispatchEvent(new Event('pin-who')); } catch (e) {}
    if (window.FC_APPNAV || (document.body && document.body.classList.contains('app'))) return;   // 하단 메뉴(☰ 전체)·설정에서 처리
    if (document.querySelector('.pin-tools')) return;
    var who = getWho();
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pin-lock-btn'; b.setAttribute('aria-label', '미래 나침반 잠그기'); b.textContent = '🔒 잠그기';
    b.addEventListener('click', function () { ssDel(SESSION_KEY); location.reload(); });
    var c = document.createElement('button');
    c.type = 'button'; c.className = 'pin-lock-btn pin-change-btn'; c.setAttribute('aria-label', '비밀번호 바꾸기'); c.textContent = '🔑 번호 바꾸기';
    c.addEventListener('click', function () { if (document.getElementById('pin-gate')) return; changing = true; root.classList.add('pin-locked'); build('unlock'); });
    var wrap = document.createElement('span'); wrap.className = 'pin-tools'; wrap.appendChild(c); wrap.appendChild(b);
    if (who) {
      var w = document.createElement('button'); w.type = 'button'; w.className = 'pin-lock-btn pin-who-chip'; w.setAttribute('aria-label', (who === 'parent' ? '엄마' : '승준') + '로 쓰는 중. 누르면 바꾸기');
      w.innerHTML = (window.FC_CHAR ? FC_CHAR.avatar(who, 22) : '') + '<span>' + (who === 'parent' ? '엄마' : '승준') + '</span>';
      w.addEventListener('click', function () { if (document.getElementById('pin-gate')) return; root.classList.add('pin-locked'); build('who'); });
      wrap.insertBefore(w, wrap.firstChild);
    }
    if (window.FamilySync && !FamilySync.joined()) {
      var f = document.createElement('button'); f.type = 'button'; f.className = 'pin-lock-btn'; f.textContent = '👨‍👩‍👧 가족 공유'; f.setAttribute('aria-label', '가족 공유로 연결');
      f.addEventListener('click', function () { if (document.getElementById('pin-gate')) return; changing = true; root.classList.add('pin-locked'); build('family'); });
      wrap.insertBefore(f, c);
    }
    var host = document.querySelector('.hub-top') || document.querySelector('.sidebar') || document.querySelector('body > main > header') || document.querySelector('body > header') || document.querySelector('.wrap > header .brand');
    if (host) host.appendChild(wrap); else { wrap.classList.add('pin-lock-float'); document.body.appendChild(wrap); }
  }
  function addLockButtonWhenReady() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLockButton); else addLockButton();
  }

  exposeApi();
  function exposeApi() { window.PinGate = {
    who: function () { return getWho(); },
    lock: function () { ssDel(SESSION_KEY); location.reload(); },
    changePin: function () { if (document.getElementById('pin-gate')) return; changing = true; root.classList.add('pin-locked'); build('unlock'); },
    joinFamily: function () { if (document.getElementById('pin-gate')) return; changing = true; root.classList.add('pin-locked'); build('family'); },
    switchWho: function () { if (document.getElementById('pin-gate')) return; root.classList.add('pin-locked'); build('who'); }
  }; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { build(); }); else build();
})();
