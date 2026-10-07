/* 이동 동선: 집 → 학교 → 학원 → 집. 구간별 네이버 지도 대중교통 길찾기 링크
   (실시간 버스·지하철 도착은 네이버 지도에서 확인).
   주소 → 좌표는 OpenStreetMap Nominatim으로 찾고 이 기기에 저장(가족 공유로 함께 씀). */
(function (g) {
  'use strict';
  var KEY = 'fc_places_v1', CACHE = 'fc_geo_cache_v1', APP = 'https://future.apuda.app';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var cfg = function () { return g.FC_SCHOOL ? g.FC_SCHOOL.config : {}; };
  function places() {
    var p = ls(KEY, {}) || {};
    p.home = p.home || { name: '집', addr: '' };
    p.school = p.school || { name: cfg().schoolName || '학교', addr: cfg().schoolQuery || '' };
    return p;
  }
  function savePlaces(p) { lsSet(KEY, p); }
  var lastGeo = 0;
  function geocode(q) {
    q = String(q || '').trim(); if (!q) return Promise.resolve(null);
    var cache = ls(CACHE, {}) || {}; if (cache[q]) return Promise.resolve(cache[q]);
    var wait = Math.max(0, 1100 - (Date.now() - lastGeo)); lastGeo = Date.now() + wait;   // 초당 1회 이하
    return new Promise(function (r) { setTimeout(r, wait); }).then(function () {
      return fetch('https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=1&accept-language=ko&q=' + encodeURIComponent(q));
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (a) {
      if (!a || !a[0]) return null;
      var p = { lat: +(+a[0].lat).toFixed(6), lng: +(+a[0].lon).toFixed(6) }; cache[q] = p; lsSet(CACHE, cache); return p;
    }).catch(function () { return null; });
  }
  function ensure() {   // 좌표 없는 장소 채우기
    var p = places(), jobs = [];
    ['home', 'school'].forEach(function (k) {
      if (p[k].addr && (p[k].lat == null || p[k].geoFor !== p[k].addr)) jobs.push(geocode(p[k].addr).then(function (c) { if (c) { p[k].lat = c.lat; p[k].lng = c.lng; p[k].geoFor = p[k].addr; } }));
    });
    return Promise.all(jobs).then(function () { savePlaces(p); return p; });
  }
  function addMin(t, m) { var a = t.split(':').map(Number), x = a[0] * 60 + a[1] + m; return ('0' + Math.floor(x / 60)).slice(-2) + ':' + ('0' + x % 60).slice(-2); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }

  /* 그날 이동 구간 */
  function legs(iso) {
    var p = places(), w = wd(iso), off = g.FC_CAL ? g.FC_CAL.offDay(iso) : (w === 0 || w === 6);
    var core = ls('compass-study-v1', {}), row = !off && w >= 1 && w <= 5 && core.table && core.table[w - 1] ? core.table[w - 1].filter(Boolean) : [];
    var times = cfg().periods || [], schoolDay = row.length > 0;
    var end = schoolDay && times[row.length - 1] ? addMin(times[row.length - 1], cfg().classMinutes || 50) : '';
    var acs = (g.FC_ACADEMY ? g.FC_ACADEMY.forDay(iso) : ls('fc_academy_v1', []).filter(function (a) { return a && Array.isArray(a.days) && a.days.indexOf(w) >= 0; }));
    var stops = [], out = [];
    if (schoolDay) stops.push({ key: 'school', name: p.school.name, lat: p.school.lat, lng: p.school.lng, at: times[0] ? addMin(times[0], -10) + ' 도착' : '', leave: end });
    acs.forEach(function (a) { stops.push({ key: 'ac', name: a.name, lat: a.lat, lng: a.lng, addr: a.addr, at: a.start, leave: a.end }); });
    if (!stops.length) return [];
    var prev = { key: 'home', name: '집', lat: p.home.lat, lng: p.home.lng, leave: '' };
    stops.forEach(function (s) { out.push({ from: prev, to: s, when: s.at || '' }); prev = s; });
    out.push({ from: prev, to: { key: 'home', name: '집', lat: p.home.lat, lng: p.home.lng }, when: prev.leave ? prev.leave + ' 출발' : '' });
    return out;
  }
  function has(x) { return x && x.lat != null && x.lng != null; }
  function appUrl(a, b) {
    var q = (has(a) ? 'slat=' + a.lat + '&slng=' + a.lng + '&sname=' + encodeURIComponent(a.name) + '&' : '') + 'dlat=' + b.lat + '&dlng=' + b.lng + '&dname=' + encodeURIComponent(b.name) + '&appname=' + encodeURIComponent(APP);
    return 'nmap://route/public?' + q;
  }
  function webUrl(a, b) {
    var s = has(a) ? a.lng + ',' + a.lat + ',' + encodeURIComponent(a.name) : '-';
    return 'https://map.naver.com/p/directions/' + s + '/' + b.lng + ',' + b.lat + ',' + encodeURIComponent(b.name) + '/-/transit';
  }
  function open(a, b) {
    if (!has(b)) { window.open('https://map.naver.com/p/search/' + encodeURIComponent(b.addr || b.name), '_blank'); return; }
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent), web = webUrl(a, b);
    if (!mobile) { window.open(web, '_blank'); return; }
    var t = setTimeout(function () { if (document.visibilityState === 'visible') location.href = web; }, 1600);   // 앱이 없으면 웹으로
    document.addEventListener('visibilitychange', function h() { if (document.visibilityState === 'hidden') { clearTimeout(t); document.removeEventListener('visibilitychange', h); } });
    location.href = appUrl(a, b);
  }

  /* 카드: 지도는 띄우지 않고, 구간별로 네이버 지도 길찾기 링크만 (공부 화면을 가리지 않게 접어 둠) */
  function card(iso, opts) {
    opts = opts || {};
    var L = legs(iso), p = places();
    if (!L.length) return opts.quiet ? '' : '<details class="rt-card"><summary>🧭 오늘 이동</summary><p class="rt-muted">오늘은 학교·학원 이동이 없어.</p></details>';
    var missing = !has(p.home) || L.some(function (l) { return !has(l.to); });
    return '<details class="rt-card"' + (opts.open ? ' open' : '') + '><summary>🧭 오늘 이동 <small>' + esc(L.map(function (l) { return l.to.name; }).slice(0, -1).join(' → ')) + '</small></summary>' +
      '<ol class="rt-legs">' + L.map(function (l, i) {
        return '<li><span class="rt-when">' + esc(l.when) + '</span><b>' + esc(l.from.name) + ' → ' + esc(l.to.name) + '</b>' +
          '<button type="button" data-rt="' + i + '" data-rt-day="' + iso + '">네이버 지도</button></li>';
      }).join('') + '</ol>' +
      '<p class="rt-muted">누르면 네이버 지도가 열려. 버스·지하철 실시간 도착은 거기서 봐.' + (missing ? ' 📍 ' + (!has(p.home) ? '집 주소' : '학원 주소') + '는 ⚙️ 설정에서 넣어줘.' : '') + '</p></details>';
  }
  function mount() {}
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rt]'); if (!b) return;
    var l = legs(b.getAttribute('data-rt-day'))[Number(b.getAttribute('data-rt'))]; if (!l) return;
    open(l.from, l.to);
  });

  /* 설정: 집·학교 위치 */
  function settingsPanel() {
    var p = places();
    return '<section class="card rt-set" id="route-settings"><h2>📍 이동 장소</h2><p class="muted">집과 학교 위치를 넣으면 오늘 이동(집 → 학교 → 학원 → 집)과 길찾기가 나와. 학원 주소는 학원 칸에서 넣어.</p>' +
      '<form data-rt-form><label>집 주소<input name="home" maxlength="120" value="' + esc(p.home.addr) + '" placeholder="예: 서울 서초구 ○○로 12"></label>' +
      '<label>학교 위치<input name="school" maxlength="120" value="' + esc(p.school.addr) + '"></label>' +
      '<p class="rt-status muted">' + (has(p.home) ? '✅ 집 위치 확인' : '집 위치 미확인') + ' · ' + (has(p.school) ? '✅ 학교 위치 확인' : '학교 위치 미확인') + '</p>' +
      '<button class="primary">위치 저장</button></form><p class="muted" style="font-size:12px">주소 → 위치 변환: OpenStreetMap. 길찾기·실시간 도착 정보: 네이버 지도.</p></section>';
  }
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches || !f.matches('[data-rt-form]')) return; e.preventDefault();
    var p = places(); p.home.addr = String(new FormData(f).get('home') || '').trim(); p.school.addr = String(new FormData(f).get('school') || '').trim();
    savePlaces(p); var st = f.querySelector('.rt-status'); st.textContent = '위치를 찾는 중…';
    ensure().then(function (q) {
      st.textContent = (has(q.home) ? '✅ 집 위치 확인' : '⚠ 집 위치를 못 찾았어. 도로명 주소로 적어줘') + ' · ' + (has(q.school) ? '✅ 학교 위치 확인' : '⚠ 학교 위치를 못 찾았어');
      if (typeof notice === 'function') notice('이동 장소를 저장했어.');
    });
  });

  var css = document.createElement('style');
  css.textContent = '.rt-card{background:#fff;border:1px solid #ebe6f5;border-radius:16px;padding:10px 14px;margin:14px 0}.rt-card summary{cursor:pointer;font-weight:700;font-size:15px}.rt-card summary small{font-weight:500;color:#8a839a;font-size:12.5px;margin-left:4px}' +
    '.rt-legs{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px}.rt-legs li{display:grid;grid-template-columns:70px 1fr auto;gap:8px;align-items:center;font-size:14px}.rt-when{font-size:12px;color:#8a839a}' +
    '.rt-legs button{min-height:36px;padding:4px 12px;border-radius:10px;border:0;background:#03c75a;color:#fff;font:600 13px system-ui;cursor:pointer;white-space:nowrap}.rt-muted{color:#8a839a;font-size:12.5px;margin:8px 0 0}' +
    '@media(max-width:420px){.rt-legs li{grid-template-columns:1fr auto}.rt-when{grid-column:1/-1}}@media(prefers-color-scheme:dark){.rt-card{background:#1c1a29;border-color:#2e2b41}}';
  document.head.appendChild(css);
  g.FC_ROUTE = { places: places, legs: legs, card: card, mount: mount, ensure: ensure, geocode: geocode, settingsPanel: settingsPanel, appUrl: appUrl, webUrl: webUrl };
})(window);
