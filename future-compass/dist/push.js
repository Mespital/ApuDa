/* 폰 알림(웹 푸시) — 설정 카드, 켜기/끄기·종류 선택, 테스트, 다른 가족에게 보내기
   - 가족 공유로 연결된 기기만(서버가 기록을 알아야 시간 맞춰 알려줌)
   - 아이폰은 '홈 화면에 추가'한 앱에서만 알림이 와요(iOS 16.4 이상) */
(function () {
  'use strict';
  var PREF = 'fc-push-v1';
  var KINDS = {
    child: [['morning', '07:30 오늘의 핵심'], ['afterclass', '15:30 수업 끝 1분 남기기'], ['academy', '학원 1시간 전'], ['exameve', '시험 전날 밤'], ['close', '21:00 하루 마무리'], ['cheer', '엄마 응원·확인 요청'], ['timer', '집중 타이머 끝']],
    parent: [['ask', '승준이 부탁·답장'], ['summary', '21:30 오늘 승준이 요약'], ['exameve', '시험 전날 밤']]
  };
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function who() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent' ? 'parent' : 'child'; }
  function st() { return ls(PREF, {}) || {}; }
  function setSt(v) { try { localStorage.setItem(PREF, JSON.stringify(v)); } catch (e) {} }
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = window.matchMedia && matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});

  function b64(s) { var p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
  function call(body) { return typeof FamilySync !== 'undefined' ? FamilySync.call(body) : Promise.resolve({ _ok: false, error: 'no_family' }); }
  function prefs() { var s = st(), o = {}; KINDS[who()].forEach(function (k) { o[k[0]] = !(s.off || {})[k[0]]; }); return o; }
  function currentSub() { return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }); }

  function enable() {
    if (!supported) { notice(ios && !standalone ? '아이폰은 공유 버튼 → "홈 화면에 추가" 후, 그 앱에서 알림을 켜줘.' : '이 브라우저는 알림을 지원하지 않아.'); return; }
    if (typeof FamilySync === 'undefined' || !FamilySync.joined()) { notice('가족 공유를 먼저 연결해줘. 그래야 시간 맞춰 알려줄 수 있어.'); return; }
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { notice('알림 권한이 꺼져 있어. 폰 설정 → 브라우저(또는 앱) → 알림에서 허용해줘.'); render(); return; }
      return call({ action: 'push-key' }).then(function (j) {
        if (!j.key) throw new Error('key');
        return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription().then(function (s) { return s || r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(j.key) }); }); });
      }).then(function (sub) { return save(sub).then(function (j) { if (!j._ok) throw new Error('save'); var s0 = st(); s0.on = 1; setSt(s0); notice('알림을 켰어 🔔 [테스트 알림]으로 확인해봐.'); render(); }); });
    }).catch(function () { notice('알림을 켜지 못했어. 잠시 뒤 다시 해줘.'); });
  }
  function save(sub) { var j = sub.toJSON ? sub.toJSON() : sub; return call({ action: 'push-sub', sub: j, role: who(), prefs: prefs(), device: (localStorage.getItem('fc-device-id') || '').slice(0, 8) }); }
  function disable() {
    currentSub().then(function (s) { if (!s) return; call({ action: 'push-unsub', endpoint: s.endpoint }); return s.unsubscribe(); }).finally(function () { var s0 = st(); s0.on = 0; setSt(s0); notice('이 폰 알림을 껐어.'); render(); });
  }
  function test() { currentSub().then(function (s) { if (!s) { notice('먼저 알림을 켜줘.'); return; } call({ action: 'push-test', endpoint: s.endpoint }).then(function (j) { notice(j.sent ? '테스트 알림을 보냈어. 곧 떠!' : '알림을 보내지 못했어. 다시 켜줘.'); }); }); }

  /* 다른 가족에게 보내기 (엄마 응원 → 승준, 승준 부탁 → 엄마) */
  function notify(to, kind, title, body, url) { if (typeof FamilySync === 'undefined' || !FamilySync.joined()) return; call({ action: 'push-send', to: to, kind: kind, title: title, body: body, url: url || 'study.html#today' }); }

  function card() {
    var s = st(), on = !!s.on && supported && Notification.permission === 'granted', role = who();
    var why = !supported ? (ios && !standalone ? '아이폰은 Safari 공유 버튼 → "홈 화면에 추가"로 설치한 앱에서만 알림이 와요.' : '이 브라우저는 알림을 지원하지 않아요.') : typeof FamilySync === 'undefined' || !FamilySync.joined() ? '가족 공유를 연결하면 켤 수 있어요.' : Notification.permission === 'denied' ? '알림 권한이 꺼져 있어요. 폰 설정에서 이 앱(브라우저)의 알림을 허용해 주세요.' : '';
    return '<section class="card" id="set-push"><h2>🔔 폰 알림</h2>' +
      '<p class="muted small">' + (on ? '이 폰에 알림이 켜져 있어.' : '앱처럼 정해진 시간에 폰으로 알려줘. 기기마다 따로 켜.') + '</p>' + (why ? '<p class="push-why">' + why + '</p>' : '') +
      '<div class="set-list">' + KINDS[role].map(function (k) { var off = (s.off || {})[k[0]]; return '<label class="push-row"><span>' + k[1] + '</span><input type="checkbox" data-push-kind="' + k[0] + '"' + (off ? '' : ' checked') + (on ? '' : ' disabled') + '></label>'; }).join('') + '</div>' +
      '<p class="push-btns">' + (on ? '<button type="button" data-push-test>테스트 알림</button><button type="button" data-push-off>이 폰 알림 끄기</button>' : '<button type="button" class="primary" data-push-on' + (why && !(ios && !standalone) && supported ? '' : '') + '>🔔 알림 켜기</button>') + '</p>' +
      '<p class="muted small">밤 10시 30분 ~ 아침 7시에는 보내지 않아. 같은 알림은 하루 한 번만.</p></section>';
  }
  function nudge() {
    var s = st(); if (s.on || s.nudged || !supported || Notification.permission !== 'default' || typeof FamilySync === 'undefined' || !FamilySync.joined()) return '';
    return '<div class="push-nudge"><span>🔔 알림을 켜면 ' + (who() === 'parent' ? '승준이 부탁·오늘 요약을' : '학원·마무리 시간을') + ' 폰으로 알려줘.</span><button type="button" class="primary" data-push-on>켜기</button><button type="button" data-push-later aria-label="나중에">✕</button></div>';
  }

  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content');
    if (tab === 'settings') { var anchor = document.getElementById('set-profile') || document.getElementById('set-family'); if (anchor) anchor.insertAdjacentHTML('beforebegin', card()); var nav = document.querySelector('.set-jump'); if (nav && !nav.querySelector('[data-jump="set-push"]')) nav.insertAdjacentHTML('beforeend', '<a href="#set-push" data-jump="set-push">알림</a>'); }
    if (tab === 'today') { var n = nudge(); if (n) { var first = root.querySelector('.hero-heal, .pv-guide'); if (first) first.insertAdjacentHTML('afterend', n); else root.insertAdjacentHTML('afterbegin', n); } }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-push-on')) { enable(); return; }
    if (b.hasAttribute('data-push-off')) { disable(); return; }
    if (b.hasAttribute('data-push-test')) { test(); return; }
    if (b.hasAttribute('data-push-later')) { var s = st(); s.nudged = 1; setSt(s); b.closest('.push-nudge').remove(); return; }
  });
  document.addEventListener('change', function (e) {
    var el = e.target; if (!el.dataset || !el.dataset.pushKind) return;
    var s = st(); s.off = s.off || {}; if (el.checked) delete s.off[el.dataset.pushKind]; else s.off[el.dataset.pushKind] = 1; setSt(s);
    currentSub().then(function (sub) { if (sub) save(sub); });
  });
  // 역할이 바뀌면(승준↔엄마) 구독 역할도 갱신
  window.addEventListener('pin-who', function () { if (!supported || !st().on) return; currentSub().then(function (sub) { if (sub) save(sub); }); });

  var css = document.createElement('style');
  css.textContent = '.push-row{display:flex!important;justify-content:space-between;align-items:center;min-height:50px;padding:10px 14px!important;margin:0!important;border-bottom:1px solid #ecebf2;background:#fff;font-weight:500!important;font-size:15px}.push-row:last-child{border-bottom:0}.push-row input{width:22px;min-height:22px}' +
    '.push-btns{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px}.push-why{background:#fff7e8;border-radius:10px;padding:8px 10px;font-size:13px;margin:6px 0 10px}' +
    '.push-nudge{display:flex;align-items:center;gap:8px;background:#f0edff;border-radius:14px;padding:10px 12px;margin:0 0 12px;font-size:13.5px}.push-nudge span{flex:1}.push-nudge button{min-height:36px!important;padding:4px 12px!important;font-size:13px}.push-nudge [data-push-later]{border:0!important;background:transparent!important;color:#8a879a!important;padding:4px!important}';
  document.head.appendChild(css);
  window.FC_PUSH = { notify: notify, enable: enable };
  if (typeof render === 'function') render();
})();
