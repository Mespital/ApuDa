/* ⏰ 앞으로 3시간 (승준 오늘 화면, 오늘의 핵심 바로 아래)
   - 수업(교시) · 학원 · 일상 일정 중 지금부터 3시간 안에 시작하거나 지금 진행 중인 것
   - 학원은 [🗺 네이버 지도] → 지금 위치에서 길찾기(앱 있으면 앱, 없으면 웹). 좌표가 없으면 주소 검색 */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  var WIN = 180;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function nowMin() { var k = new Date(Date.now() + 9 * 3600000); return k.getUTCHours() * 60 + k.getUTCMinutes(); }
  function toMin(t) { var m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; }
  function hm(m) { m = ((m % 1440) + 1440) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function inMin(m) { return m < 60 ? m + '분 뒤' : Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + m % 60 + '분' : '') + ' 뒤'; }

  function items() {
    var t = today(), now = nowMin(), out = [];
    var add = function (day, off) {   // off: 내일이면 +1440
      var cfg = (typeof FC_SCHOOL !== 'undefined' && FC_SCHOOL.config) || {}, per = cfg.periods || [], cm = cfg.classMinutes || 50;
      if (!off && window.FC_PLANNER && FC_PLANNER.todayRow) FC_PLANNER.todayRow().forEach(function (s, i) {
        var st = toMin(per[i]); if (!s || st == null) return; out.push({ k: 'class', icon: '🏫', title: (i + 1) + '교시 ' + s, s: st, e: st + cm });
      });
      if (typeof FC_ACADEMY !== 'undefined') FC_ACADEMY.forDay(day).forEach(function (a) {
        var st = toMin(a.start); if (st == null) return; out.push({ k: 'ac', icon: '🏃', title: a.name, s: st + off, e: (toMin(a.end) || st + 90) + off, ac: a, hw: a.homework && !a.hwDone ? a.homework : '' });
      });
      if (typeof FC_LIFE !== 'undefined') FC_LIFE.forDay(day).forEach(function (x) {
        var st = toMin(x.start); if (st == null) return; out.push({ k: 'life', icon: x.icon || '📌', title: x.title, s: st + off, e: (toMin(x.end) || st) + off });
      });
    };
    add(t, 0); if (now + WIN >= 1440) add(addD(t, 1), 1440);
    return out.filter(function (x) { return (x.s >= now && x.s <= now + WIN) || (x.s < now && x.e > now); })
      .sort(function (a, b) { return a.s - b.s; }).slice(0, 5);
  }

  function card() {
    var L = items(), now = nowMin();
    var h = '<section class="card nx-card" id="nx-3h" data-keep-home><div class="nx-head"><h2>⏰ 앞으로 3시간</h2><small>' + hm(now) + ' ~ ' + hm(now + WIN) + '</small></div>';
    if (!L.length) return h + '<p class="nx-empty"><b>' + hm(now) + '</b> 지금부터 3시간은 비어 있어. 집중하기 좋은 시간이야.</p></section>';
    var nowRow = '<li class="nx-nowrow" aria-hidden="true"><time>' + hm(now) + '</time><i></i><span>지금</span></li>', placed = false;
    h += '<ol class="nx-tl">' + L.map(function (x) {
      var on = x.s <= now, pre = '';
      if (!on && !placed) { pre = nowRow; placed = true; }
      var leave = x.k === 'ac' && !on ? x.s - 40 : null;   // 학원은 40분 전 출발 (추정)
      return pre + '<li class="nx-' + x.k + (on ? ' on' : '') + '"><time>' + hm(x.s) + '</time><i class="nx-dot"></i><div class="nx-body">' +
        '<b>' + esc(x.icon) + ' ' + esc(x.title) + '</b>' +
        '<small class="nx-sub">' + (on ? '진행 중 · ' + hm(x.e) + '까지' : inMin(x.s - now) + (x.e > x.s ? ' · ' + hm(x.e) + '까지' : '')) + '</small>' +
        (leave != null ? '<small class="nx-sub nx-leave">' + (leave <= now ? '🚶 지금 출발하면 좋아' : '🚶 ' + hm(leave) + '쯤 출발 (추정)') + '</small>' : '') +
        (x.hw ? '<small class="nx-sub">📚 숙제: ' + esc(x.hw) + '</small>' : '') +
        (x.k === 'ac' ? '<button type="button" class="nx-map" data-nx-map="' + esc(x.ac.id) + '"><span class="nx-n" aria-hidden="true">N</span>네이버 지도 길찾기</button>' : '') + '</div></li>';
    }).join('') + '</ol></section>';
    return h;
  }

  function openMap(a) {
    if (!a) return;
    var dest = { name: a.name, lat: a.lat, lng: a.lng, addr: a.addr };
    if (dest.lat == null || dest.lng == null || !window.FC_ROUTE) { window.open('https://map.naver.com/p/search/' + encodeURIComponent(a.addr || a.name), '_blank'); return; }
    var web = FC_ROUTE.webUrl({}, dest), mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!mobile) { window.open(web, '_blank'); return; }
    var t = setTimeout(function () { if (document.visibilityState === 'visible') location.href = web; }, 1600);   // 앱이 없으면 웹으로
    document.addEventListener('visibilitychange', function h() { if (document.visibilityState === 'hidden') { clearTimeout(t); document.removeEventListener('visibilitychange', h); } });
    location.href = FC_ROUTE.appUrl({}, dest);   // 출발지 비우면 지금 위치에서
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-nx-map]'); if (!b) return;
    var a = typeof FC_ACADEMY !== 'undefined' && FC_ACADEMY.list().filter(function (x) { return x.id === b.dataset.nxMap; })[0];
    openMap(a);
  });

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'today' || isParent()) return;
    var root = document.getElementById('content'); if (root.querySelector('#nx-3h')) return;
    var hero = root.querySelector('.hero-heal');
    if (hero) hero.insertAdjacentHTML('afterend', card()); else root.insertAdjacentHTML('afterbegin', card());
  };
  setInterval(function () { if (tab === 'today' && !isParent() && document.visibilityState === 'visible') { var c = document.getElementById('nx-3h'); if (c && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) c.outerHTML = card(); } }, 60000);

  var css = document.createElement('style');
  css.textContent = '.nx-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.nx-head h2{margin:0!important}.nx-head small{color:var(--sub,#7d7a8c);font-size:12.5px;font-variant-numeric:tabular-nums}' +
    '.nx-empty{margin:10px 0 0;font-size:14px;color:#4f4b66}.nx-empty b{font-variant-numeric:tabular-nums;color:var(--night,#262150);margin-right:4px}' +
    '.nx-tl{list-style:none;margin:12px 0 0;padding:0;position:relative}.nx-tl::before{content:"";position:absolute;left:61px;top:10px;bottom:10px;width:2px;background:var(--line,#e6e3f2);border-radius:2px}' +
    '.nx-tl>li{display:grid;grid-template-columns:52px 20px 1fr;align-items:start;column-gap:2px;padding:6px 0}' +
    '.nx-tl time{font-size:15px;font-weight:700;color:var(--night,#262150);font-variant-numeric:tabular-nums;padding-top:1px}' +
    '.nx-dot{width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2.5px #b9b0ec;margin:4px 0 0 4px;position:relative;z-index:1}' +
    '.nx-ac .nx-dot{box-shadow:inset 0 0 0 2.5px var(--violet,#5b45d6)}.nx-tl li.on .nx-dot{background:var(--lamp,#f0a92b);box-shadow:0 0 0 4px var(--lamp-soft,#fff1d1)}' +
    '.nx-body{display:grid;gap:2px;min-width:0}.nx-body b{font-size:15px;font-weight:650;color:var(--night,#262150);overflow-wrap:anywhere}.nx-sub{font-size:12.5px;color:#6b6880}.nx-leave{color:#9a5b00}' +
    '.nx-nowrow{align-items:center!important;padding:2px 0!important}.nx-nowrow time{font-size:12px!important;font-weight:600!important;color:#b07100!important}.nx-nowrow i{width:8px;height:8px;border-radius:50%;background:var(--lamp,#f0a92b);margin-left:6px;position:relative;z-index:1}.nx-nowrow span{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#b07100}.nx-nowrow span::after{content:"";flex:1;border-top:1.5px dashed #f3c46a}' +
    '.nx-map{justify-self:start;margin-top:6px;display:inline-flex;align-items:center;gap:6px;min-height:36px!important;padding:5px 14px 5px 6px!important;border-radius:999px!important;background:#03c75a!important;border:0!important;color:#fff!important;font-weight:700;font-size:13.5px}.nx-n{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#fff;color:#03c75a;font-weight:900;font-size:13px}';
  document.head.appendChild(css);
  render();
})();
