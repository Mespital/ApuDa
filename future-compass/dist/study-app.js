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
    notice(url ? (role === 'parent' ? '엄마' : '승준') + ' 캐릭터를 바꿨어. 들어가기 화면·상단·오늘 한눈에 모두 이 캐릭터로 나와.' : '기본 캐릭터로 돌렸어.');
    bar(); if (typeof render === 'function') render();
  }
  /* 그림 자르기(전체·왼쪽·오른쪽) → 투명 여백 자동 정리 → 240px로 줄이기 */
  function cropTrim(img, part) {
    var W = img.naturalWidth, H = img.naturalHeight, sx = part === 'right' ? Math.floor(W / 2) : 0, sw = part === 'all' ? W : Math.ceil(W / 2);
    var c = document.createElement('canvas'); c.width = sw; c.height = H; var x = c.getContext('2d'); x.drawImage(img, sx, 0, sw, H, 0, 0, sw, H);
    var box = [0, 0, sw, H];
    try {
      var d = x.getImageData(0, 0, sw, H).data, minX = sw, minY = H, maxX = -1, maxY = -1, step = Math.max(1, Math.floor(Math.max(sw, H) / 600));
      for (var yy = 0; yy < H; yy += step) for (var xx = 0; xx < sw; xx += step) if (d[(yy * sw + xx) * 4 + 3] > 16) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; }
      if (maxX > minX && maxY > minY) { var pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.03); box = [Math.max(0, minX - pad), Math.max(0, minY - pad), Math.min(sw, maxX + pad + step) - Math.max(0, minX - pad), Math.min(H, maxY + pad + step) - Math.max(0, minY - pad)]; }
    } catch (e) {}
    var max = 260, out = '';
    for (var k = 0; k < 3; k++) {
      var r = Math.min(1, max / Math.max(box[2], box[3])), o = document.createElement('canvas');
      o.width = Math.max(1, Math.round(box[2] * r)); o.height = Math.max(1, Math.round(box[3] * r));
      o.getContext('2d').drawImage(c, box[0], box[1], box[2], box[3], 0, 0, o.width, o.height);
      out = o.toDataURL('image/webp', 0.88); if (out.indexOf('data:image/webp') !== 0) out = o.toDataURL('image/png');
      if (out.length < 170000) break; max = Math.round(max * 0.75);
    }
    return out;
  }
  function chooser(file, role) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var opts = [['all', '전체'], ['left', '왼쪽 절반'], ['right', '오른쪽 절반']].map(function (o) { return { k: o[0], label: o[1], url: cropTrim(img, o[0]) }; });
      URL.revokeObjectURL(url);
      var dlg = document.createElement('div'); dlg.className = 'pf-dlg';
      dlg.innerHTML = '<div class="pf-dlg-card"><h3>' + (role === 'parent' ? '엄마' : '승준') + ' 그림으로 쓸 부분을 골라줘</h3><p class="muted small">여백은 자동으로 잘라. 고르면 바로 움직이는 캐릭터로 바뀌어.</p><div class="pf-opts">' +
        opts.map(function (o, i) { return '<button type="button" data-i="' + i + '"><img src="' + o.url + '" alt=""><span>' + o.label + '</span></button>'; }).join('') +
        '</div><button type="button" class="pf-cancel">취소</button></div>';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) { if (e.target === dlg) dlg.remove(); return; }
        if (b.classList.contains('pf-cancel')) { dlg.remove(); return; }
        dlg.remove(); done(role, opts[Number(b.dataset.i)].url);
      });
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
    if (file.type === 'image/gif') notice('GIF가 커서 멈춘 그림으로 바꾸고, 대신 움직이게 만들었어.');
    chooser(file, pickFor);
  });
})();
