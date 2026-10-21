/* ⌚ 애플워치로 1분 복습 (2026-10-21)
   워치 '단축어'에서 말하면(받아쓰기) → VPS(live.apuda.app/watch/note)가 과목을 고르고 정리·Drive 저장 → 공부방이 열릴 때 노트로 가져옴.
   - 설정 → ⌚ 애플워치: 워치 키 만들기(이 기기에만 보관, 서버엔 해시만) + 단축어 만드는 순서
   - 공부방이 열릴 때마다 시간표를 VPS에 보내 '방금 끝난 수업'을 고를 수 있게 함
   알림은 아이폰 홈 화면 앱(공부방)의 알림이 워치로 그대로 이어진다(아이폰 잠금 상태일 때). */
(function () {
  'use strict';
  if (typeof render !== 'function') return;
  var KEY = 'fc-watch-key', esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function live() { return typeof FamilySync !== 'undefined' && FamilySync.joined() && FamilySync.live ? FamilySync.live() : null; }
  function key() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function post(path, body) { var l = live(); if (!l || !l.url) return Promise.reject(Error('live')); return fetch(l.url + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ t: l.t }, body)) }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw Error(j.error || 'err'); return j; }); }); }
  function tableBody() { var cfg = (window.FC_SCHOOL && FC_SCHOOL.config) || {}; return { table: (state.table || []).slice(0, 5), periods: cfg.periods || [], len: cfg.classMinutes || 50 }; }
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  /* ---------- 워치에서 온 노트 가져오기 ---------- */
  var busy = false, lastPull = 0;
  function pull(force) {
    var l = live(); if (busy || !l || !l.url || isParent() || (!force && Date.now() - lastPull < 60000) || document.documentElement.classList.contains('pin-locked')) return;
    busy = true; lastPull = Date.now();
    fetch(l.url + '/watch/inbox?t=' + encodeURIComponent(l.t), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok) return;
      var got = [], ids = [];
      (j.items || []).forEach(function (x) {
        ids.push(x.id);
        if (window.FC_NOTES && FC_NOTES.addExternal && FC_NOTES.addExternal({ extId: x.id, via: 'watch', subject: x.subject, topic: x.topic, text: x.transcript, sum: x.summary, at: x.at, files: x.files || [] })) got.push(x.subject);
      });
      if (ids.length) post('/watch/ack', { ids: ids }).catch(function () {});
      if (got.length && typeof notice === 'function') notice('⌚ 워치에서 남긴 노트 ' + got.length + '개를 가져왔어 (' + got.join('·') + ')');
      if (j.pending) setTimeout(function () { pull(true); }, 20000);
    }).catch(function () {}).then(function () { busy = false; });
  }
  function syncTable() { if (!key() || isParent()) return; post('/watch/table', tableBody()).catch(function () {}); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') pull(false); });
  window.addEventListener('pin-unlocked', function () { setTimeout(function () { pull(true); syncTable(); }, 1500); });
  setTimeout(function () { pull(true); syncTable(); }, 3000);

  /* ---------- 설정 카드 ---------- */
  function card() {
    var k = key(), l = live(), url = l && l.url ? l.url + '/watch/note' : 'https://live.apuda.app/watch/note';
    var h = '<section class="card wl-card" id="set-watch"><h2>⌚ 애플워치</h2>';
    h += '<p class="small"><b>알림</b> · 아이폰에서 공부방을 <b>홈 화면에 추가</b>한 앱으로 열고 알림을 켜면, 아이폰이 잠겨 있을 때 수업 끝·학원·시험 알림이 워치에 떠.' + (ios && !standalone ? ' <span class="wl-warn">지금은 사파리에서 열려 있어. 공유 버튼 → 홈 화면에 추가 → 그 아이콘으로 열어줘.</span>' : '') + '</p>';
    h += '<p class="small"><b>워치로 1분 복습</b> · 워치에서 말하면 방금 끝난 수업 노트로 들어가고, 정리·Drive 저장까지 돼. 맨 앞에 과목을 말하면("수학, 오늘은…") 그 과목으로 들어가.</p>';
    if (!l || !l.url) return h + '<p class="small muted">가족 연결이 켜져 있어야 써. (설정 → 가족 연결)</p></section>';
    if (!k) return h + '<button type="button" class="primary wl-btn" data-wl-make>워치 키 만들기</button></section>';
    h += '<ol class="wl-steps small">' +
      '<li>아이폰 <b>단축어</b> 앱 → ＋ → 이름 <b>1분 복습</b></li>' +
      '<li>동작 추가: <b>텍스트 받아쓰기</b> (언어: 한국어)</li>' +
      '<li>동작 추가: <b>URL의 콘텐츠 가져오기</b> → URL에 아래 주소, 방법 <b>POST</b>, 본문 <b>JSON</b> → 필드 2개: <code>key</code>(텍스트) = 아래 키, <code>text</code>(텍스트) = <b>받아쓴 텍스트</b> 변수</li>' +
      '<li>동작 추가: <b>결과 보기</b> (URL의 콘텐츠)</li>' +
      '<li>단축어 설정(ⓘ) → <b>Apple Watch에서 보기</b> 켜기 → 워치 페이스 컴플리케이션에 <b>단축어</b> 추가</li></ol>' +
      '<div class="wl-copy"><label>주소</label><input readonly value="' + esc(url) + '"><button type="button" data-wl-copy="' + esc(url) + '">복사</button></div>' +
      '<div class="wl-copy"><label>키</label><input readonly value="' + esc(k) + '"><button type="button" data-wl-copy="' + esc(k) + '">복사</button></div>' +
      '<p class="small muted">키는 이 단축어 전용이야. 남에게 보여주지 마. 잃어버리거나 새로 만들면 예전 키는 바로 못 써.</p>' +
      '<div class="wl-row"><button type="button" data-wl-test>지금 시험해 보기</button><button type="button" data-wl-make>키 새로 만들기</button><button type="button" data-wl-off>끄기</button></div></section>';
    return h;
  }
  function hex(n) { return Array.from(crypto.getRandomValues(new Uint8Array(n)), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-wl-make],[data-wl-off],[data-wl-copy],[data-wl-test]'); if (!b || isParent()) return;
    if (b.hasAttribute('data-wl-copy')) { var v = b.getAttribute('data-wl-copy'); (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { notice('복사했어'); }).catch(function () { var i = b.previousElementSibling; if (i) { i.focus(); i.select(); } notice('길게 눌러 복사해줘'); }); return; }
    if (b.hasAttribute('data-wl-make')) { if (key() && !confirm('새 키를 만들면 지금 단축어의 키를 바꿔 넣어야 해. 만들까?')) return; var k = hex(20); b.disabled = true; post('/watch/setup', Object.assign({ key: k }, tableBody())).then(function () { localStorage.setItem(KEY, k); notice('워치 키를 만들었어. 아래 순서대로 단축어를 만들어줘.'); render(); }).catch(function () { b.disabled = false; notice('서버에 연결하지 못했어. 잠시 뒤 다시 해줘.'); }); return; }
    if (b.hasAttribute('data-wl-off')) { if (!confirm('워치로 남기기를 끌까? 단축어는 더 이상 저장되지 않아.')) return; post('/watch/off', {}).then(function () { localStorage.removeItem(KEY); notice('껐어'); render(); }).catch(function () { notice('서버에 연결하지 못했어.'); }); return; }
    if (b.hasAttribute('data-wl-test')) { var l = live(); b.disabled = true; fetch(l.url + '/watch/note', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: key(), text: '시험 메모입니다. 워치 연결 확인용이야.', subject: '기타' }) }).then(function (r) { return r.text(); }).then(function (m) { notice('서버 답: ' + m + ' — 1~2분 뒤 복습 탭에 들어와'); setTimeout(function () { pull(true); }, 30000); }).catch(function () { notice('보내지 못했어'); }).then(function () { b.disabled = false; }); }
  });

  var prev = render;
  render = function () {
    prev();
    if (typeof tab === 'undefined' || tab !== 'settings' || isParent()) return;
    var root = document.getElementById('content'); if (!root || root.querySelector('#set-watch')) return;
    var anchor = root.querySelector('#set-family') || root.querySelector('#set-profile');
    if (anchor) anchor.insertAdjacentHTML('beforebegin', card()); else root.insertAdjacentHTML('beforeend', card());
  };
  var css = document.createElement('style');
  css.textContent = '.wl-card p{line-height:1.65}.wl-warn{color:var(--warn-ink);font-weight:700}.wl-steps{padding-left:20px;line-height:1.7;margin:8px 0}.wl-steps code{background:var(--u-soft);padding:1px 5px;border-radius:6px}' +
    '.wl-copy{display:grid;grid-template-columns:36px 1fr auto;gap:6px;align-items:center;margin:6px 0}.wl-copy label{font-size:13.5px;color:var(--ink-3)}.wl-copy input{min-height:var(--tap);font-size:13.5px;min-width:0}.wl-copy button{min-height:var(--tap)}' +
    '.wl-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.wl-row button,.wl-btn{min-height:var(--tap)}.wl-btn{width:100%}';
  document.head.appendChild(css);
})();
