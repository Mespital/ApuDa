/* Apple Watch companion: durable imports, concise Shortcuts receipts, three-step setup. */
(function () {
  'use strict';
  if (typeof render !== 'function') return;
  var KEY = 'fc-watch-key', RECEIPTS = 'fc-watch-receipts-v1';
  var busy = false, lastPull = 0, timer = null, verified = false, reveal = false, watchOpen = false, message = '';
  var recent = read(RECEIPTS, []);
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  function read(k, fallback) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function child() { return !(typeof PinGate !== 'undefined' && PinGate.who() === 'parent') && !document.documentElement.classList.contains('pin-locked'); }
  function live() { return typeof FamilySync !== 'undefined' && FamilySync.joined() && FamilySync.live ? FamilySync.live() : null; }
  function key() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function sameSession(l) { var current = live(); return child() && current && current.t === l.t && current.url === l.url; }
  function tell(s) { message = s; if (typeof notice === 'function') notice(s); refreshCard(); }
  function post(path, body) {
    var l = live(); if (!child() || !l || !l.url) return Promise.reject(Error('connection'));
    return fetch(l.url + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ t: l.t }, body)) }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) { var e = Error(j.error || 'connection'); e.status = r.status; throw e; } return j; });
    });
  }
  function tableBody() { var cfg = window.FC_SCHOOL && FC_SCHOOL.config || {}; return { table: (state.table || []).slice(0, 5), periods: cfg.periods || [], len: cfg.classMinutes || 50 }; }
  function remember(x, status) {
    if (!Array.isArray(recent)) recent = [];
    var row = { id: x.id, at: x.at, subject: String(x.subject || '수업').slice(0, 30), status: status, errors: (x.errors || []).slice(0, 8) };
    recent = recent.filter(function (a) { return a.id !== x.id; }).concat([row]).slice(-8);
    try { localStorage.setItem(RECEIPTS, JSON.stringify(recent)); } catch (e) { /* Only a display cache; note persistence decides ACK. */ }
  }
  function schedule(ms) { if (timer) clearTimeout(timer); timer = setTimeout(function () { timer = null; if (document.visibilityState !== 'hidden') pull(true); }, ms); }
  function pull(force) {
    var l = live();
    if (busy || !child() || !l || !l.url || (!force && Date.now() - lastPull < 60000)) return Promise.resolve();
    busy = true; lastPull = Date.now();
    return fetch(l.url + '/watch/inbox?t=' + encodeURIComponent(l.t), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw Error('connection'); return r.json(); }).then(function (j) {
      if (!j || !j.ok || !sameSession(l)) return;
      var ids = [], added = 0, failed = false;
      (j.items || []).forEach(function (x) {
        if (!sameSession(l) || !x || !/^[a-f0-9]{32}$/.test(x.id || '')) return;
        var outcome = x.outcome || ((x.errors || []).length ? ((x.files || []).length ? 'partial' : 'failed') : 'success');
        var notes = window.FC_NOTES, accepted = false;
        if (notes && typeof notes.addExternal === 'function') {
          accepted = notes.addExternal({ extId: x.id, via: 'watch', subject: x.subject, topic: x.topic, text: x.transcript, sum: x.summary, at: x.at, files: x.files || [], errors: x.errors || [], outcome: outcome, resultAt: x.resultAt });
          var exists = typeof notes.hasExternal === 'function' && notes.hasExternal(x.id, x.resultAt);
          if ((accepted || exists) && x.state !== 'interrupted') ids.push(x.id);
          if (accepted) added++;
          if (!accepted && !exists && x.transcript) failed = true;
          remember(x, accepted || exists ? outcome : x.transcript ? 'local' : 'interrupted');
        } else { failed = true; remember(x, 'local'); }
      });
      var ack = ids.length && sameSession(l) ? post('/watch/ack', { ids: ids }) : Promise.resolve();
      return ack.catch(function () { message = '노트는 기기에 저장했어. 수신 확인은 다음에 다시 보낼게.'; }).then(function () {
        if (!sameSession(l)) return;
        if (failed) message = '기기에 저장하지 못한 메모가 있어. 저장 공간을 확인하고 다시 가져와줘.';
        else if (added) message = '워치 메모 ' + added + '개와 복습 날짜를 공부방에 저장했어.';
        if (j.pending || (j.more && ids.length && !failed)) schedule(j.pending ? 20000 : 500);
        refreshCard();
      });
    }).catch(function () { if (child()) { message = '워치 메모를 확인하지 못했어. 연결 후 다시 가져와줘.'; refreshCard(); } }).then(function () { busy = false; });
  }
  function syncTable() { if (key() && child()) return post('/watch/table', tableBody()).catch(function () {}); return Promise.resolve(); }
  function boot() { if (child()) { pull(true); syncTable(); } }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { pull(false); syncTable(); } else if (timer) { clearTimeout(timer); timer = null; } });
  document.addEventListener('toggle', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-wl-settings')) watchOpen = e.target.open; }, true);
  window.addEventListener('pin-unlocked', function () { setTimeout(boot, 1500); });
  window.addEventListener('pin-who', function () { verified = false; reveal = false; watchOpen = false; message = ''; if (timer) clearTimeout(timer); timer = null; if (child()) setTimeout(boot, 1500); });
  setTimeout(boot, 3000);

  var LABEL = { success: '정리·Drive 보관 완료', partial: '일부 처리 확인 필요', failed: '다시 처리 필요', interrupted: '처리가 중단됐어', local: '기기에 저장하지 못했어', pending: '정리·Drive 보관 중' };
  function errorsText(errors) {
    var a = [];
    if (errors.indexOf('summary') >= 0) a.push('복습 정리를 만들지 못했어.');
    if (errors.some(function (e) { return /^drive(?:_|$)/.test(e); })) a.push('Drive 보관을 마치지 못했어.');
    if (errors.indexOf('short') >= 0) a.push('내용이 짧아 정리를 건너뛰었어. 워치에서 조금 더 말해줘.');
    return a.join(' ');
  }
  function receiptList() {
    if (!Array.isArray(recent) || !recent.length) return '<p class="wl-empty">아직 가져온 워치 메모가 없어. 워치에서 첫 수업 이야기를 남겨봐.</p>';
    return '<ul class="wl-receipts">' + recent.slice().reverse().map(function (r) {
      var retry = ['partial', 'failed', 'interrupted'].indexOf(r.status) >= 0;
      var expired = Date.now() - Date.parse(r.at) > 48 * 3600000;
      var reason = retry ? errorsText(Array.isArray(r.errors) ? r.errors : []) : '';
      return '<li><div><b>' + esc(r.subject) + '</b><span class="wl-state ' + (r.status === 'success' ? 'is-ok' : 'is-warn') + '">' + esc(LABEL[r.status] || LABEL.pending) + '</span>' + (reason ? '<small>' + esc(reason) + '</small>' : '') + (retry && expired ? '<small>처리 기한이 지났어. 워치에서 다시 남겨줘.</small>' : '') + '</div>' +
        (r.status === 'local' ? '<button type="button" data-wl-pull>다시 가져오기</button>' : retry && !expired ? '<button type="button" data-wl-retry="' + esc(r.id) + '">다시 처리</button>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function guide(url, k) {
    return '<details class="wl-guide"' + (!verified ? ' open' : '') + '><summary>단축어 만들기 · 주소와 키</summary><div class="wl-guide-in">' +
      '<p>아이폰의 단축어 앱에서 한 번만 준비해줘.</p><ol class="wl-steps">' +
      '<li>새 단축어 이름을 <b>1분 복습</b>으로 정해.</li>' +
      '<li><b>텍스트 받아쓰기</b>를 넣고 언어는 한국어로 골라.</li>' +
      '<li><b>URL의 콘텐츠 가져오기</b>를 넣어. 아래 주소, 방법 <b>POST</b>, 요청 본문 <b>JSON</b>을 선택해.</li>' +
      '<li>텍스트 필드 두 개를 넣어. <code>key</code>에는 아래 키, <code>text</code>에는 <b>받아쓴 텍스트</b> 변수를 연결해. 마지막에 <b>결과 보기</b>를 추가해.</li>' +
      '<li>단축어 세부사항에서 <b>Apple Watch에서 보기</b>를 켜고, 워치 페이스의 단축어에 추가해.</li></ol>' +
      '<div class="wl-copy"><label for="wl-url">보낼 주소</label><div><input id="wl-url" type="url" readonly value="' + esc(url) + '"><button type="button" data-wl-copy="url">주소 복사</button></div></div>' +
      '<div class="wl-copy"><label for="wl-key">단축어 전용 키</label><div><input id="wl-key" type="' + (reveal ? 'text' : 'password') + '" autocomplete="off" spellcheck="false" readonly value="' + esc(k) + '"><button type="button" data-wl-copy="key">키 복사</button></div><button type="button" class="wl-text" data-wl-reveal aria-pressed="' + reveal + '">' + (reveal ? '키 가리기' : '키 보기') + '</button></div>' +
      '<p class="wl-sub">키는 이 단축어에서만 사용해. 새 키를 만들면 기존 단축어의 키도 바꿔줘.</p></div></details>';
  }
  function card() {
    var k = key(), l = live(), url = l && l.url ? l.url + '/watch/note' : 'https://live.apuda.app/watch/note';
    return '<section class="card wl-card" id="set-watch" aria-labelledby="wl-title">' +
      '<header class="wl-head"><span class="wl-icon" aria-hidden="true">⌚</span><div><h2 id="wl-title">손목에서 1분 복습</h2><p>말한 수업 이야기를 공부방에 차곡차곡.</p></div></header>' +
      '<ol class="wl-progress" aria-label="워치 연결 순서"><li' + (k ? ' class="is-done"' : '') + '><span>1</span>키 준비</li><li><span>2</span>단축어 만들기</li><li' + (verified ? ' class="is-done"' : '') + '><span>3</span>연결 확인</li></ol>' +
      '<div class="wl-main"><div class="wl-watch-demo" aria-label="단축어 결과 보기의 접수 안내 예시"><span>1분 복습</span><b>✓ 수학 접수</b><p>정리·Drive 보관 중</p><small>완료는 공부방에서 확인</small></div><div class="wl-intro"><b>누르고, 말하고, 확인해요.</b><p>“수학, 오늘 배운 함수는…”<br>과목을 먼저 말하면 더 정확해.</p><small>단축어의 결과 보기 예시야. 실제 화면 모양은 워치가 정해.</small></div></div>' +
      (!l || !l.url ? '<p class="wl-message">먼저 가족 공유를 연결해줘.</p><a class="wl-jump" href="#set-family" data-jump="set-family">가족·잠금 설정 열기</a>' : !k ? '<button type="button" class="primary wl-primary" data-wl-make>워치 연결 시작</button>' :
        '<div class="wl-connection"><span class="wl-state ' + (verified ? 'is-ok' : '') + '">' + (verified ? '연결 확인 완료' : '단축어에 넣을 키 준비됨') + '</span><button type="button" class="primary" data-wl-test>연결 확인</button></div>' + guide(url, k)) +
      '<p class="wl-message" role="status" aria-live="polite">' + esc(message || (k ? '연결 확인은 시험 노트를 만들지 않아.' : '주소와 키를 준비한 뒤 단축어를 만들어줘.')) + '</p>' +
      '<details class="wl-section"><summary>최근 메모와 저장 상태</summary><div class="wl-section-in">' + receiptList() + '<button type="button" data-wl-pull>워치 메모 다시 확인</button></div></details>' +
      '<details class="wl-section"><summary>워치 알림 받기</summary><div class="wl-section-in"><p>아이폰의 공부방을 홈 화면에 추가하고 그 아이콘으로 열어줘. 가족 공유를 연결한 뒤 폰 알림을 켜면 돼.</p>' +
      (ios && !standalone ? '<p class="wl-message">지금은 브라우저에서 열렸어. 공유 → 홈 화면에 추가 후 다시 열어줘.</p>' : '') +
      '<p class="wl-sub">아이폰이 잠겨 있고 워치는 잠금 해제된 상태에서 확인해. 워치 알림 미러링과 집중 모드 설정도 확인해줘.</p><a class="wl-jump" href="#set-push" data-jump="set-push">폰 알림 설정 열기</a></div></details>' +
      '<p class="wl-boundary">워치는 받아쓴 글과 정리를 보관해. <b>음성 원본도 남기려면 아이폰의 1분 녹음</b>을 이용해줘.</p>' +
      (k ? '<details class="wl-section"><summary>키 바꾸기·연결 끄기</summary><div class="wl-section-in wl-actions"><button type="button" data-wl-make>키 새로 만들기</button><button type="button" data-wl-off>워치 연결 끄기</button></div></details>' : '') + '</section>';
  }
  function refreshCard() {
    if (!child() || typeof tab === 'undefined' || tab !== 'settings') return;
    var old = document.getElementById('set-watch');
    if (!old) return;
    var active = document.activeElement, focus = old.contains(active) ? active : null;
    var focusAttr = focus && Array.prototype.find.call(focus.attributes, function (a) { return /^data-wl-/.test(a.name); });
    var focusId = focus && focus.id, summary = focus && focus.tagName === 'SUMMARY' ? focus.textContent : '';
    var opened = {};
    old.querySelectorAll('details').forEach(function (d) { opened[d.querySelector('summary').textContent] = d.open; });
    var holder = document.createElement('div'); holder.innerHTML = card(); var next = holder.firstElementChild;
    if (!next) return;
    next.querySelectorAll('details').forEach(function (d) { var s = d.querySelector('summary').textContent; if (Object.prototype.hasOwnProperty.call(opened, s)) d.open = opened[s]; });
    old.replaceWith(next);
    var target = focusId ? next.querySelector('#' + focusId) : focusAttr ? Array.prototype.find.call(next.querySelectorAll('[' + focusAttr.name + ']'), function (el) { return el.getAttribute(focusAttr.name) === focusAttr.value; }) : summary ? Array.prototype.find.call(next.querySelectorAll('summary'), function (el) { return el.textContent === summary; }) : null;
    if (focus && !target && focus.hasAttribute('data-wl-make')) target = next.querySelector('[data-wl-test]');
    if (target) target.focus({ preventScroll: true });
  }
  function hex(n) { return Array.from(crypto.getRandomValues(new Uint8Array(n)), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-wl-make],[data-wl-off],[data-wl-copy],[data-wl-test],[data-wl-pull],[data-wl-reveal],[data-wl-retry]');
    if (!b || !child()) return;
    if (b.hasAttribute('data-wl-copy')) {
      var l = live(), which = b.getAttribute('data-wl-copy'), value = which === 'key' ? key() : l && l.url ? l.url + '/watch/note' : '';
      (value && navigator.clipboard ? navigator.clipboard.writeText(value) : Promise.reject()).then(function () { tell(which === 'key' ? '키를 복사했어.' : '주소를 복사했어.'); }).catch(function () { var i = document.getElementById(which === 'key' ? 'wl-key' : 'wl-url'); if (i) { if (which === 'key') { i.type = 'text'; reveal = true; } i.focus(); i.select(); } if (typeof notice === 'function') notice('입력칸을 길게 눌러 복사해줘.'); }); return;
    }
    if (b.hasAttribute('data-wl-reveal')) { reveal = !reveal; refreshCard(); return; }
    if (b.hasAttribute('data-wl-pull')) { b.disabled = true; pull(true).then(function () { if (b.isConnected) b.disabled = false; }); return; }
    if (b.hasAttribute('data-wl-make')) {
      if (key() && !confirm('새 키를 만들면 단축어의 키도 바꿔야 해. 바꿀까?')) return;
      var k = hex(20);
      try { localStorage.setItem(KEY, k); } catch (error) { tell('키를 기기에 저장하지 못했어. 저장 공간을 확인해줘.'); return; }
      verified = false; b.disabled = true;
      post('/watch/setup', Object.assign({ key: k }, tableBody())).then(function () { tell('키를 준비했어. 단축어에 주소와 키를 넣어줘.'); }).catch(function () { tell('연결 여부를 확인하지 못했어. 연결 확인을 누르거나 다시 연결해줘.'); }).then(function () { refreshCard(); }); return;
    }
    if (b.hasAttribute('data-wl-off')) {
      if (!confirm('워치로 메모 보내기를 끌까? 저장된 노트는 남아 있어.')) return;
      b.disabled = true;
      post('/watch/off', {}).then(function () { try { localStorage.removeItem(KEY); } catch (error) {} verified = false; reveal = false; tell('워치 연결을 껐어.'); }).catch(function () { b.disabled = false; tell('연결을 끄지 못했어. 다시 시도해줘.'); }); return;
    }
    if (b.hasAttribute('data-wl-test')) {
      b.disabled = true;
      post('/watch/check', { key: key() }).then(function () { verified = true; tell('키와 서버 연결을 확인했어. 이제 워치에서 한 번 말해봐.'); }).catch(function (error) { verified = false; tell(error.message === 'watch_key' ? '단축어의 키가 맞는지 확인하거나 새 키로 다시 연결해줘.' : '서버 연결을 확인하지 못했어. 잠시 뒤 다시 해줘.'); }).then(refreshCard); return;
    }
    if (b.hasAttribute('data-wl-retry')) {
      b.disabled = true; var id = b.getAttribute('data-wl-retry');
      post('/watch/retry', { id: id }).then(function () { recent.forEach(function (r) { if (r.id === id) r.status = 'pending'; }); tell('보관된 원문으로 다시 처리하고 있어.'); schedule(2000); }).catch(function (error) { b.disabled = false; tell(error.message === 'no_original' ? '다시 처리할 원문이 없어. 워치에서 다시 말해줘.' : '다시 처리하지 못했어. 원문은 보관돼 있으니 잠시 뒤 확인해줘.'); });
    }
  });
  var previous = render;
  render = function () {
    previous(); if (typeof tab === 'undefined' || tab !== 'settings' || !child()) return;
    var root = document.getElementById('content'); if (!root || root.querySelector('#set-watch')) return;
    var anchor = root.querySelector('#set-family') || root.querySelector('#set-profile');
    // Family settings may already be folded by design-tidy. Keep Watch as its own section.
    if (anchor) anchor = anchor.closest('details.dt-fold') || anchor;
    var section = '<details class="card wl-settings" data-wl-settings' + (watchOpen ? ' open' : '') + '><summary>⌚ 애플워치 · 1분 복습</summary>' + card() + '</details>';
    if (anchor) anchor.insertAdjacentHTML('beforebegin', section); else root.insertAdjacentHTML('beforeend', section);
    var jumps = root.querySelector('.set-jump'); if (jumps && !jumps.querySelector('[data-jump="set-watch"]')) jumps.insertAdjacentHTML('beforeend', '<a href="#set-watch" data-jump="set-watch">애플워치</a>');
  };
  window.FC_WATCH = { refresh: pull, view: card };
})();
