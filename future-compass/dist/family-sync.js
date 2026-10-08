/* 가족 공유 동기화: 가족 비밀번호로 들어온 기기끼리 같은 기록을 쓴다.
   - 처음 들어오면 서버 기록을 먼저 받는다(빈 기기가 아이 기록을 덮어쓰지 않게).
   - 이후 이 기기에서 바뀐 키만 올리고, 다른 기기에서 바뀐 키는 받아서 화면을 새로 고친다.
   - 같은 키를 동시에 고치면 나중에 고친 쪽이 남는다. */
(function (g) {
  'use strict';
  var FAM = 'fc-family-v1', META = 'fc-family-meta-v1', API = '/api/family';
  var KEYS = ['compass-study-v1', 'compass-study-plus-v1', 'fc_academy_v1', 'fc_teachers_v1', 'fc_offdays_v1', 'fc_preview_v1',
    'fc_hub_posts', 'compass-know-me-v1', 'compass-career-lab', 'compass-career-depth', 'future-compass-v2', 'fc_school_class', 'fc_places_v1', 'fc_avatar_v1', 'fc_planner_v1', 'fc_notes_v1', 'fc_cheer_v1', 'fc_mom_v1', 'fc_kid_v1', 'fc_life_v1', 'fc_av_child_v1', 'fc_av_parent_v1'];
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function obj(k) { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36) + ':' + s.length; }
  function fam() { var f = obj(FAM); return f && f.token ? f : null; }
  function device() { return (get('fc-device-id') || '').slice(0, 8); }
  function api(body) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; j._ok = r.ok; return j; }); })
      .catch(function () { return { _ok: false, error: 'network' }; });
  }
  function toast(t, btn) {
    var el = document.createElement('div'); el.className = 'pin-toast'; el.setAttribute('role', 'status'); el.textContent = t;
    if (btn) { var b = document.createElement('button'); b.textContent = btn.label; b.style.cssText = 'margin-left:10px;border:0;border-radius:8px;padding:4px 10px;font-weight:700;cursor:pointer'; b.onclick = btn.fn; el.appendChild(b); }
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, btn ? 12000 : 4200);
  }
  function rejoin() {
    try { localStorage.removeItem(FAM); } catch (e) {}
    toast('가족 비밀번호가 바뀌었어. 잠금 화면의 "가족 공유"로 다시 들어와줘. 이 기기 기록은 그대로야.');
  }

  /* 바뀐 키 찾기 */
  function localChanges() {
    var meta = obj(META) || {}, out = {}, n = 0, now = Date.now();
    KEYS.forEach(function (k) {
      var v = get(k); if (v === null) return;
      var h = hash(v);
      if (!meta[k] || meta[k].h !== h) { meta[k] = { h: h, t: now }; out[k] = { v: v, t: now, by: device() }; n++; }
    });
    if (n) set(META, JSON.stringify(meta));
    return n ? out : null;
  }
  var pushing = false;
  function push() {
    var f = fam(); if (!f || pushing) return Promise.resolve();
    var ch = localChanges(); if (!ch) return Promise.resolve();
    pushing = true;
    return api({ action: 'push', token: f.token, changes: ch }).then(function (j) {
      pushing = false;
      if (j.error === 'rejoin') { rejoin(); return; }
      if (j._ok) liveNotify(Object.keys(ch));
      if (!j._ok) { var meta = obj(META) || {}; Object.keys(ch).forEach(function (k) { if (meta[k]) meta[k].h = 'retry'; }); set(META, JSON.stringify(meta)); }   // 다음에 다시 보냄
    });
  }
  function typing() { var a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox'; }
  function reloadSoon() {
    var last = 0; try { last = Number(sessionStorage.getItem('fc-family-reload') || 0); } catch (e) {}
    if (Date.now() - last < 8000) return;
    if (typing()) { toast('다른 가족 기기에서 바뀐 내용이 있어.', { label: '새로 보기', fn: function () { location.reload(); } }); return; }
    try { sessionStorage.setItem('fc-family-reload', String(Date.now())); } catch (e) {}
    location.reload();
  }
  function pull(first) {
    var f = fam(); if (!f) return Promise.resolve(0);
    return api({ action: 'pull', token: f.token }).then(function (j) {
      if (j.error === 'rejoin') { rejoin(); return 0; }
      if (j.live) setLive(j.live);
      if (!j._ok || !j.data) return 0;
      var meta = obj(META) || {}, applied = 0;
      Object.keys(j.data).forEach(function (k) {
        if (KEYS.indexOf(k) < 0) return;
        var s = j.data[k], cur = get(k);
        if (!s || typeof s.v !== 'string') return;
        if (cur === s.v) { meta[k] = { h: hash(cur), t: Math.max(s.t, meta[k] ? meta[k].t : 0) }; return; }
        // 처음 연결할 때: 이 기기 기록이 서버보다 훨씬 많으면(아이 폰) 빈 기록으로 덮어쓰지 않고 이 기기 것을 올린다
        if (first && cur !== null && cur.length > s.v.length * 1.3 + 200) { set('fc-family-server-' + k, s.v); delete meta[k]; return; }
        if (first || !meta[k] || s.t > meta[k].t) {
          if (first && cur !== null) set('fc-family-before-' + k, cur);    // 처음 합칠 때 이 기기 값은 따로 보관
          set(k, s.v); meta[k] = { h: hash(s.v), t: s.t }; applied++;
        }
      });
      set(META, JSON.stringify(meta));
      try { sessionStorage.setItem('fc-family-pulled', String(Date.now())); } catch (e) {}
      return applied;
    });
  }
  /* ── VPS 실시간: 다른 기기에서 바뀌면 바로 받아오기 (없으면 20초마다 확인) ── */
  var LIVE = null, es = null, esTry = 0;
  try { LIVE = JSON.parse(sessionStorage.getItem('fc-live') || 'null'); } catch (e) {}
  function setLive(l) {
    var was = LIVE && LIVE.url; LIVE = l && typeof l === 'object' ? l : null;
    try { sessionStorage.setItem('fc-live', JSON.stringify(LIVE)); } catch (e) {}
    if (LIVE && LIVE.url && !was) openLive();
  }
  function liveOk() { return !!(LIVE && LIVE.url && LIVE.t && Number(String(LIVE.t).split('.')[0]) > Date.now() + 60000); }
  function openLive() {
    if (!liveOk() || es || typeof EventSource === 'undefined' || document.visibilityState !== 'visible') return;
    try { es = new EventSource(LIVE.url + '/rt?t=' + encodeURIComponent(LIVE.t) + '&d=' + encodeURIComponent(device())); } catch (e) { es = null; return; }
    es.addEventListener('open', function () { esTry = 0; });
    es.addEventListener('changed', function (ev) {
      var d = {}; try { d = JSON.parse(ev.data); } catch (e) {}
      if (d.by && d.by === device()) return;
      pull(false).then(function (n) { if (n) reloadSoon(); });
    });
    es.addEventListener('error', function () { if (es && es.readyState === 2) { es = null; if (++esTry < 6) setTimeout(openLive, 5000 * esTry); } });
  }
  function closeLive() { if (es) { try { es.close(); } catch (e) {} es = null; } }
  function liveNotify(keys) {
    if (!liveOk()) return;
    try { fetch(LIVE.url + '/rt/notify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ t: LIVE.t, d: device(), keys: keys }), keepalive: true }).catch(function () {}); } catch (e) {}
  }
  var started = false;
  function start(first) {
    if (started || !fam()) return; started = true;
    var lastPull = 0; try { lastPull = Number(sessionStorage.getItem('fc-family-pulled') || 0); } catch (e) {}
    var p = first || Date.now() - lastPull > 20000 ? pull(first) : Promise.resolve(0);
    p.then(function (n) { return push().then(function () { if (n) reloadSoon(); }); });
    setInterval(push, 8000);
    openLive();
    setInterval(function () { if (document.visibilityState === 'visible' && !(es && es.readyState === 1)) pull(false).then(function (n) { if (n) reloadSoon(); }); }, 20000);
    setInterval(function () { if (document.visibilityState === 'visible' && es && es.readyState === 1) pull(false).then(function (n) { if (n) reloadSoon(); }); }, 120000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { push(); closeLive(); }
      else { pull(false).then(function (n) { if (n) reloadSoon(); }); openLive(); }
    });
  }

  /* 비밀번호 화면에서 쓰는 함수 */
  function join(pin) {
    return api({ action: 'join', pin: pin, device: device() }).then(function (j) {
      if (j._ok && j.token) { set(FAM, JSON.stringify({ token: j.token, pv: j.pv, joined: new Date().toISOString(), role: '' })); try { localStorage.removeItem(META); } catch (e) {} }
      return j;
    });
  }
  function init(pin) {
    return api({ action: 'init', pin: pin, device: device() }).then(function (j) {
      if (j._ok && j.token) { set(FAM, JSON.stringify({ token: j.token, pv: j.pv, joined: new Date().toISOString(), role: '' })); try { localStorage.removeItem(META); } catch (e) {} }
      return j;
    });
  }
  function setRole(role) {
    var f = fam(); if (!f) return; f.role = role; set(FAM, JSON.stringify(f));
    if (role === 'parent') set('fc-usage-optout', '1'); else { try { localStorage.removeItem('fc-usage-optout'); } catch (e) {} }
  }
  function status() { return api({ action: 'status' }); }

  function call(body) { var f = fam(); if (!f) return Promise.resolve({ _ok: false, error: 'not_joined' }); body.token = f.token; return api(body); }
  g.FamilySync = { call: call, join: join, init: init, setRole: setRole, status: status, start: start, joined: function () { return !!fam(); }, role: function () { var f = fam(); return f ? f.role : ''; }, pushNow: push, KEYS: KEYS, live: function () { return liveOk() ? { url: LIVE.url, t: LIVE.t, ai: !!LIVE.ai } : (LIVE ? { ai: !!LIVE.ai } : null); }, liveState: function () { return es ? es.readyState : -1; } };
  if (!document.documentElement.classList.contains('pin-locked')) start(false);
  window.addEventListener('pin-unlocked', function () { start(false); });
})(window);
