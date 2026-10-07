/* 공부방 앱 껍데기: 상단바(프로필·날짜·설정), 프로필 그림 고르기 */
(function () {
  'use strict';
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function who() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent' ? 'parent' : 'child'; }
  function bar() {
    var b = document.querySelector('.ab-who'); if (!b) return;
    var w = who();
    b.innerHTML = typeof FC_CHAR !== 'undefined' ? FC_CHAR.avatar(w, 34) : '';
    b.setAttribute('aria-label', (w === 'parent' ? '엄마' : '승준') + '로 쓰는 중. 누르면 바꾸기');
    var d = new Date(Date.now() + 9 * 3600000), sub = document.getElementById('ab-sub');
    if (sub) sub.textContent = (d.getUTCMonth() + 1) + '월 ' + d.getUTCDate() + '일 ' + WD[d.getUTCDay()] + '요일 · ' + (w === 'parent' ? '엄마' : '승준');
  }
  bar();
  window.addEventListener('pin-who', bar);
  window.addEventListener('pin-unlocked', bar);
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-who]') && typeof PinGate !== 'undefined') PinGate.switchWho();
    var j = e.target.closest && e.target.closest('[data-jump]');
    if (j) { e.preventDefault(); var t = document.getElementById(j.getAttribute('data-jump')); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' }); }
  });

  /* 프로필 그림 */
  var pickFor = '';
  function done(role, url) {
    if (!FC_CHAR.setAvatar(role, url)) { notice('저장 공간이 부족해. 더 작은 그림으로 골라줘.'); return; }
    if (typeof FamilySync !== 'undefined' && FamilySync.pushNow) FamilySync.pushNow();
    notice(url ? (role === 'parent' ? '엄마' : '승준') + ' 그림을 바꿨어.' : '기본 캐릭터로 돌렸어.');
    bar(); if (typeof render === 'function') render();
  }
  function shrink(file, role) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var max = 240, out = '';
      for (var k = 0; k < 3; k++) {
        var r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * r)); c.height = Math.max(1, Math.round(img.naturalHeight * r));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL('image/webp', 0.86); if (out.indexOf('data:image/webp') !== 0) out = c.toDataURL('image/png');
        if (out.length < 170000) break; max = Math.round(max * 0.75);
      }
      URL.revokeObjectURL(url); done(role, out);
    };
    img.onerror = function () { URL.revokeObjectURL(url); notice('이 그림은 열 수 없어. 다른 그림으로 골라줘.'); };
    img.src = url;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.dataset.pfPick) { pickFor = b.dataset.pfPick; var f = document.querySelector('[data-pf-file]'); if (f) { f.value = ''; f.click(); } }
    if (b.dataset.pfReset && confirm('기본 캐릭터로 돌릴까?')) done(b.dataset.pfReset, null);
  });
  document.addEventListener('change', function (e) {
    var f = e.target; if (!f.matches || !f.matches('[data-pf-file]') || !f.files[0] || !pickFor) return;
    var file = f.files[0];
    if (!/^image\//.test(file.type)) { notice('그림 파일을 골라줘.'); return; }
    if (file.type === 'image/gif' && file.size <= 125000) {   // 작은 GIF는 움직이는 그대로
      var rd = new FileReader(); rd.onload = function () { done(pickFor, String(rd.result)); }; rd.readAsDataURL(file); return;
    }
    if (file.type === 'image/gif') notice('GIF가 커서 멈춘 그림으로 줄였어. 120KB 이하 GIF면 움직여.');
    shrink(file, pickFor);
  });
})();
