/* 이동 동선: 집 → 학교 → 학원 → 집. 지도(네이버 키가 있으면 네이버, 없으면 OpenStreetMap)와
   네이버 지도 대중교통 길찾기 버튼(앱에서 실시간 버스·지하철 도착 정보 확인).
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

  /* 카드 */
  function card(iso, opts) {
    opts = opts || {};
    var L = legs(iso), p = places();
    if (!L.length) return opts.quiet ? '' : '<section class="rt-card"><h2>🧭 오늘 이동</h2><p class="rt-muted">오늘은 학교·학원 이동이 없어.</p></section>';
    var missing = !has(p.home) || L.some(function (l) { return !has(l.to); });
    return '<section class="rt-card"><div class="rt-head"><h2>🧭 오늘 이동</h2><span class="rt-hint">버튼을 누르면 네이버 지도에서 버스·지하철 실시간 길찾기</span></div>' +
      '<div class="rt-map" id="rt-map-' + iso + '" aria-label="오늘 이동 지도"></div>' +
      '<ol class="rt-legs">' + L.map(function (l, i) {
        return '<li><span class="rt-when">' + esc(l.when) + '</span><b>' + esc(l.from.name) + ' → ' + esc(l.to.name) + '</b>' +
          '<span class="rt-btns"><button type="button" data-rt="' + i + '" data-rt-day="' + iso + '">길찾기</button><button type="button" data-rt="' + i + '" data-rt-day="' + iso + '" data-rt-here>지금 위치에서</button></span></li>';
      }).join('') + '</ol>' +
      (missing ? '<p class="rt-muted">📍 ' + (!has(p.home) ? '집 주소' : '학원 주소') + '를 ⚙️ 설정에서 넣으면 지도와 길찾기가 정확해져.</p>' : '') + '</section>';
  }
  function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function loadCss(href) { if (document.querySelector('link[href="' + href + '"]')) return; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
  function mount(iso) {
    var el = document.getElementById('rt-map-' + iso); if (!el || el.dataset.ready) return;
    var L = legs(iso), pts = []; if (!L.length) return;
    [L[0].from].concat(L.map(function (l) { return l.to; })).forEach(function (s, i, a) { if (has(s) && !(i === a.length - 1 && s.key === 'home' && has(a[0]))) pts.push(s); });
    if (pts.length < 1) { el.innerHTML = '<p class="rt-muted" style="padding:14px">주소를 넣으면 지도가 보여.</p>'; return; }
    el.dataset.ready = '1';
    var key = cfg().naverMapKeyId;
    if (key) {
      (g.naver && g.naver.maps ? Promise.resolve() : loadScript('https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' + encodeURIComponent(key))).then(function () {
        var nm = g.naver.maps, map = new nm.Map(el, { center: new nm.LatLng(pts[0].lat, pts[0].lng), zoom: 14 }), bounds = new nm.LatLngBounds();
        pts.forEach(function (s, i) { var ll = new nm.LatLng(s.lat, s.lng); bounds.extend(ll); new nm.Marker({ position: ll, map: map, title: s.name, icon: { content: '<div class="rt-pin">' + (i + 1) + ' ' + esc(s.name) + '</div>' } }); });
        new nm.Polyline({ map: map, path: pts.map(function (s) { return new nm.LatLng(s.lat, s.lng); }), strokeColor: '#5b3fd6', strokeStyle: 'shortdash', strokeWeight: 3 });
        if (pts.length > 1) map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
      }).catch(function () { el.dataset.ready = ''; osm(el, pts); });
    } else osm(el, pts);
  }
  function osm(el, pts) {
    var base = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
    loadCss(base + 'leaflet.min.css');
    (g.L ? Promise.resolve() : loadScript(base + 'leaflet.min.js')).then(function () {
      var map = g.L.map(el, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      g.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
      var ll = pts.map(function (s) { return [s.lat, s.lng]; });
      pts.forEach(function (s, i) { g.L.marker([s.lat, s.lng], { icon: g.L.divIcon({ className: '', html: '<div class="rt-pin">' + (i + 1) + ' ' + esc(s.name) + '</div>', iconSize: null }) }).addTo(map); });
      if (ll.length > 1) { g.L.polyline(ll, { color: '#5b3fd6', dashArray: '6 6', weight: 3 }).addTo(map); map.fitBounds(ll, { padding: [30, 30] }); } else map.setView(ll[0], 15);
    }).catch(function () { el.innerHTML = '<p class="rt-muted" style="padding:14px">지도를 불러오지 못했어. 길찾기 버튼은 그대로 쓸 수 있어.</p>'; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rt]'); if (!b) return;
    var l = legs(b.getAttribute('data-rt-day'))[Number(b.getAttribute('data-rt'))]; if (!l) return;
    open(b.hasAttribute('data-rt-here') ? null : l.from, l.to);
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
  css.textContent = '.rt-card{background:#fff;border:1px solid #ebe6f5;border-radius:18px;padding:14px 16px;margin:14px 0}.rt-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}.rt-head h2{font-size:16px;margin:0}.rt-hint{font-size:12px;color:#8a839a}' +
    '.rt-map{height:220px;border-radius:14px;overflow:hidden;margin:10px 0;background:#f1eef9;position:relative;z-index:0}.rt-pin{background:#5b3fd6;color:#fff;font:700 11.5px system-ui;padding:3px 7px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:translate(-50%,-120%);display:inline-block}' +
    '.rt-legs{list-style:none;margin:0;padding:0;display:grid;gap:8px}.rt-legs li{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:center;font-size:14px}.rt-when{font-size:12px;color:#8a839a;min-width:70px}.rt-btns{grid-column:1/-1;display:flex;gap:6px}' +
    '.rt-btns button{min-height:36px;padding:4px 12px;border-radius:10px;border:1px solid #d9d0ee;background:#fff;color:#3d3566;font:600 13px system-ui;cursor:pointer}.rt-btns button:first-child{background:#03c75a;border-color:#03c75a;color:#fff}.rt-muted{color:#8a839a;font-size:13px;margin:6px 0 0}' +
    '@media(prefers-color-scheme:dark){.rt-card{background:#1c1a29;border-color:#2e2b41}.rt-btns button{background:#1c1a29;color:#ecebf5}}';
  document.head.appendChild(css);
  g.FC_ROUTE = { places: places, legs: legs, card: card, mount: mount, ensure: ensure, geocode: geocode, settingsPanel: settingsPanel, appUrl: appUrl, webUrl: webUrl };
})(window);
