/* 1분 복습 녹음: 실제 음성 Blob을 기기에 보관하고, 연결한 Drive 폴더/과목에 저장한다.
   OAuth 토큰은 메모리에만 둔다. ChatGPT의 Drive 연결이나 가족 공유 토큰을 재사용하지 않는다. */
(function () {
  'use strict';
  var DB = 'fc-study-audio', PREF = 'fc-audio-drive-v1', SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var memory = new Map(), writes = new Map(), views = new Set(), jobs = new Map(), folders = new Map(), token = '', expires = 0, destination = null, active = null;
  var config = null, libraries = null, ready = false, driveMessage = 'Google Drive 연결 후 녹음이 끝나면 자동 저장해. 연결 전에는 이 기기에 남겨둘게.';
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safe(s, max) { return String(s || '').normalize('NFC').replace(/[\x00-\x1f\\/:*?"<>|]/g, ' ').trim().replace(/\s+/g, '-').slice(0, max); }
  function extension(type) { return /mp4|m4a/i.test(type) ? 'm4a' : /ogg/i.test(type) ? 'ogg' : /wav/i.test(type) ? 'wav' : /mpeg|mp3/i.test(type) ? 'mp3' : /webm/i.test(type) ? 'webm' : /flac/i.test(type) ? 'flac' : /aac/i.test(type) ? 'aac' : 'bin'; }
  function filename(subject, topic, at, type) { return safe(subject, 24) + '_' + safe(topic, 60) + '_' + new Date(at + 9 * 3600000).toISOString().slice(0, 23).replace('T', '_').replace(/:/g, '-') + '_KST.' + extension(type); }
  function idb() { return new Promise(function (ok, no) { var r = indexedDB.open(DB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('audio', { keyPath: 'id' }); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); }
  function transaction(mode, fn) { return idb().then(function (db) { return new Promise(function (ok, no) { var tx = db.transaction('audio', mode), request = fn(tx.objectStore('audio')); tx.oncomplete = function () { db.close(); ok(request.result); }; tx.onerror = tx.onabort = function () { db.close(); no(tx.error); }; }); }); }
  function store(r) {
    memory.set(r.id, r);
    var p = (writes.get(r.id) || Promise.resolve()).then(function () { return transaction('readwrite', function (s) { return s.put(r); }); }).then(function () { r.memoryOnly = false; return r; }).catch(function () { r.memoryOnly = true; return r; });
    writes.set(r.id, p); return p;
  }
  function get(id) { if (memory.has(id)) return Promise.resolve(memory.get(id)); return transaction('readonly', function (s) { return s.get(id); }).then(function (r) { if (r) { r.uploading = jobs.has(r.id); r.memoryOnly = false; memory.set(id, r); } return r; }).catch(function () { return null; }); }
  function all() { return transaction('readonly', function (s) { return s.getAll(); }).catch(function () { return []; }).then(function (rows) { rows.forEach(function (r) { if (!memory.has(r.id)) { r.uploading = jobs.has(r.id); r.memoryOnly = false; memory.set(r.id, r); } }); return Array.from(memory.values()).sort(function (a, b) { return b.at - a.at; }); }); }
  function remove(id) {
    memory.delete(id);
    return (writes.get(id) || Promise.resolve()).then(function () { return transaction('readwrite', function (s) { return s.delete(id); }); }).catch(function () {}).then(function () { window.dispatchEvent(new CustomEvent('fc-audio-removed', { detail: { id: id } })); renderAll(); });
  }
  function askRemove(id) { if (!confirm('이 기기의 녹음 원본을 지울까? 지우면 되돌릴 수 없어.\n(Drive에 저장된 파일은 그대로 있어. 노트를 지울 때 함께 지울 수 있어)')) return Promise.resolve(false); return remove(id).then(function () { if (typeof notice === 'function') notice('이 기기의 녹음을 지웠어.'); return true; }); }
  function metadata(r) { return { id: r.id, name: r.name, subject: r.subject, topic: r.topic, at: r.at, driveId: r.driveId || '', driveUrl: r.driveUrl || '' }; }
  function notify(r) { window.dispatchEvent(new CustomEvent('fc-audio-saved', { detail: metadata(r) })); renderAll(); }
  function connected() { return !!(token && expires > Date.now() && destination); }
  function api(url, options) {
    if (!token || expires <= Date.now()) return Promise.reject(new Error('connect'));
    var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 30000);
    return fetch(url, Object.assign({}, options || {}, { signal: controller.signal, headers: Object.assign({}, (options || {}).headers, { Authorization: 'Bearer ' + token }) })).then(function (r) {
      if (r.status === 401) { token = ''; throw new Error('connect'); }
      if (!r.ok) { var error = new Error('drive'); error.status = r.status; throw error; }
      return r.json();
    }).finally(function () { clearTimeout(timeout); });
  }
  var API = 'https://www.googleapis.com/drive/v3/files';
  function folder(parent, subject) {
    var key = parent + '/' + subject;
    if (folders.has(key)) return folders.get(key);
    var quote = function (x) { return String(x).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); };
    var q = "trashed=false and mimeType='application/vnd.google-apps.folder' and name='" + quote(subject) + "' and '" + quote(parent) + "' in parents";
    var p = api(API + '?q=' + encodeURIComponent(q) + '&fields=files(id)&pageSize=100').then(function (j) {
      return j.files && j.files.length ? j.files[0].id : api(API + '?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: subject, mimeType: 'application/vnd.google-apps.folder', parents: [parent] }) }).then(function (x) { return x.id; });
    }).catch(function (e) { folders.delete(key); throw e; });
    folders.set(key, p); return p;
  }
  function verify(r) {
    return api(API + '/' + encodeURIComponent(r.driveId) + '?fields=id,name,size,parents,webViewLink').then(function (j) {
      if (j.id !== r.driveId || j.name !== r.name || Number(j.size) !== r.blob.size || !j.parents || j.parents.indexOf(r.driveParent) < 0 || !/^https:\/\/drive\.google\.com\//.test(j.webViewLink || '')) throw new Error('verify');
      r.driveUrl = j.webViewLink; r.uploaded = true; r.error = ''; return store(r).then(function () { notify(r); return r; });
    });
  }
  function upload(r) {
    if (r.uploaded || r.partial) return Promise.resolve(r);
    if (jobs.has(r.id)) return jobs.get(r.id);
    if (!connected()) { r.error = 'Drive에 연결하면 다시 저장할 수 있어.'; notify(r); return Promise.resolve(r); }
    r.error = ''; r.uploading = true; renderAll();
    var parent = destination.id;
    var job = Promise.resolve().then(function () {
      if (r.driveId) return verify(r).then(function () { return true; }).catch(function (e) { if (e.status === 404) return false; throw e; });
      return false;
    }).then(function (already) {
      if (already) return r;
      var locate = r.driveParent ? Promise.resolve(r.driveParent) : folder(parent, r.subject);
      return locate.then(function (id) { r.driveParent = id; return r.driveId ? null : api(API + '/generateIds?count=1&space=drive&type=files').then(function (j) { if (!j.ids || !j.ids[0]) throw new Error('id'); r.driveId = j.ids[0]; }); }).then(function () {
        return store(r); // 생성할 파일 ID를 업로드 전에 보관해, 재시도 중 중복 파일 생성을 막는다.
      }).then(function () {
        var boundary = 'fc_audio_' + r.id, mime = (r.blob.type || 'audio/webm').split(';')[0];
        var body = new Blob(['--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ id: r.driveId, name: r.name, mimeType: mime, parents: [r.driveParent] }) + '\r\n--' + boundary + '\r\nContent-Type: ' + mime + '\r\n\r\n', r.blob, '\r\n--' + boundary + '--'], { type: 'multipart/related; boundary=' + boundary });
        return api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': body.type }, body: body }).catch(function (e) { if (e.status !== 409) throw e; }).then(function () { return verify(r); });
      });
    }).catch(function (e) { r.error = e.message === 'connect' ? 'Google 연결이 만료됐어. 다시 연결한 뒤 저장해줘.' : 'Drive 저장을 확인하지 못했어. 녹음은 남겨뒀어. 다시 저장을 눌러줘.'; return store(r); }).finally(function () { r.uploading = false; jobs.delete(r.id); return store(r).then(function () { notify(r); }); });
    jobs.set(r.id, job); return job;
  }
  function script(url, test) { if (test()) return Promise.resolve(); return new Promise(function (ok, no) { var s = document.createElement('script'), timeout = setTimeout(function () { s.remove(); no(new Error('load')); }, 12000); s.src = url; s.onload = function () { clearTimeout(timeout); test() ? ok() : no(new Error('load')); }; s.onerror = function () { clearTimeout(timeout); s.remove(); no(new Error('load')); }; document.head.appendChild(s); }); }
  function warm() {
    if (!config || !config.configured) return Promise.resolve();
    if (libraries) return libraries;
    libraries = Promise.all([
      script('https://accounts.google.com/gsi/client', function () { return !!(window.google && google.accounts && google.accounts.oauth2); }),
      script('https://apis.google.com/js/api.js', function () { return !!window.gapi; }).then(function () { return new Promise(function (ok, no) { gapi.load('picker', { callback: ok, onerror: no, timeout: 12000, ontimeout: no }); }); })
    ]).then(function () { ready = true; renderAll(); }).catch(function () { libraries = null; ready = false; driveMessage = 'Google 연결을 불러오지 못했어. 인터넷을 확인하고 다시 눌러줘.'; renderAll(); });
    return libraries;
  }
  function chooseFolder() {
    var view = new google.picker.DocsView(google.picker.ViewId.FOLDERS).setIncludeFolders(true).setSelectFolderEnabled(true);
    document.documentElement.classList.add('fc-drive-picker-open');
    new google.picker.PickerBuilder().setAppId(config.appId).setDeveloperKey(config.apiKey).setOAuthToken(token).setOrigin(location.origin).setTitle('승준 공부방 → 1분 복습 녹음 폴더 선택').addView(view).setCallback(function (data) {
      if (data.action !== google.picker.Action.PICKED && data.action !== google.picker.Action.CANCEL) return;
      document.documentElement.classList.remove('fc-drive-picker-open');
      if (data.action === google.picker.Action.CANCEL) { driveMessage = '폴더 선택을 취소했어. 녹음은 이 기기에 남아 있어.'; renderAll(); return; }
      var id = data.docs && data.docs[0] && data.docs[0].id;
      if (!id) return;
      api(API + '/' + encodeURIComponent(id) + '?fields=id,name,mimeType,webViewLink,capabilities(canAddChildren)').then(function (j) {
        if (j.mimeType !== 'application/vnd.google-apps.folder' || !j.capabilities || !j.capabilities.canAddChildren || !/^https:\/\/drive\.google\.com\//.test(j.webViewLink || '')) throw new Error('folder');
        destination = { id: j.id, name: j.name, url: j.webViewLink }; folders.clear();
        try { localStorage.setItem(PREF, JSON.stringify(destination)); } catch (e) {}
        driveMessage = '연결했어. 이 폴더 안에 과목별로 저장할게. 저장이 밀린 녹음도 다시 시도할게.'; renderAll();
        return all().then(function (rows) { return rows.filter(function (r) { return !r.uploaded && !r.partial; }).reduce(function (p, r) { return p.then(function () { return upload(r); }); }, Promise.resolve()); });
      }).catch(function () { destination = null; driveMessage = '이 폴더에 저장할 수 없어. 내가 쓸 수 있는 폴더를 다시 골라줘.'; renderAll(); });
    }).build().setVisible(true);
  }
  function connect() {
    if (!config || !config.configured) { driveMessage = '공부방의 Google 연결 설정이 아직 준비되지 않았어. 녹음은 이 기기에 보관하고 파일 받기로 꺼낼 수 있어.'; renderAll(); return; }
    if (!ready) { driveMessage = 'Google 연결 준비 중이야. 준비되면 연결 버튼을 한 번 더 눌러줘.'; renderAll(); warm(); return; }
    destination = null; token = ''; folders.clear();
    google.accounts.oauth2.initTokenClient({ client_id: config.clientId, scope: SCOPE, include_granted_scopes: false, callback: function (result) {
      if (result.error || !result.access_token || !google.accounts.oauth2.hasGrantedAllScopes(result, SCOPE)) { driveMessage = 'Google 연결이 완료되지 않았어. 녹음은 이 기기에 남아 있어.'; renderAll(); return; }
      token = result.access_token; expires = Date.now() + Math.max(0, Number(result.expires_in) - 30) * 1000;
      try { chooseFolder(); } catch (e) { document.documentElement.classList.remove('fc-drive-picker-open'); driveMessage = '폴더 선택을 열지 못했어. Google 연결을 다시 눌러줘.'; renderAll(); }
    }, error_callback: function () { driveMessage = 'Google 창을 열지 못했어. 팝업을 허용하고 연결을 다시 눌러줘.'; renderAll(); } }).requestAccessToken({ prompt: 'select_account' });
  }
  function stop() {
    if (!active) return Promise.resolve(null);
    var a = active;
    if (a.recorder && !a.stopping) { a.stopping = true; a.stoppedAt = Date.now(); try { if (a.recorder.state !== 'inactive') a.recorder.stop(); else setTimeout(a.finish, 0); } catch (e) { a.finish(); } }
    else if (!a.recorder) { active = null; a.cancelled = true; a.resolve(null); }
    return a.promise;
  }
  function start(v) {
    if (active) return;
    var subject = safe(v.hooks.subject(), 24), topic = safe(v.hooks.topic(), 60);
    if (!subject || !topic) { v.message = '과목과 주제를 먼저 적어줘. 예: 수학 / 함수의 뜻'; render(v); return; }
    if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { v.message = '이 브라우저에서 녹음을 시작할 수 없어. 아래에서 녹음 파일을 골라줘.'; render(v); return; }
    var a = { v: v, subject: subject, topic: topic, chunks: [], cancelled: false, started: 0, recorder: null, stream: null, interval: null };
    a.promise = new Promise(function (ok) { a.resolve = ok; }); active = a; v.message = '마이크 권한을 허용하면 1분 녹음을 시작해.'; render(v);
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false }).then(function (stream) {
      if (active !== a || a.cancelled || !v.root.isConnected) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      a.stream = stream;
      var type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(function (t) { return MediaRecorder.isTypeSupported(t); });
      a.recorder = new MediaRecorder(stream, Object.assign({ audioBitsPerSecond: 64000 }, type ? { mimeType: type } : {}));
      a.recorder.ondataavailable = function (e) {
        if (!e.data || !e.data.size) return;
        a.chunks.push(e.data);
        if (!a.started || a.finished) return;
        var partial = Object.assign({}, a.record, { blob: new Blob(a.chunks, { type: a.recorder.mimeType || e.data.type }), partial: true });
        v.current = partial.id;
        store(partial).then(function () { if (v.hooks.onRecord) v.hooks.onRecord(metadata(partial)); });
      };
      a.finish = function () {
        if (a.finished) return; a.finished = true; clearInterval(a.interval); stream.getTracks().forEach(function (t) { t.stop(); });
        if (active === a) active = null;
        if (v.hooks.onStop) v.hooks.onStop();
        var blob = new Blob(a.chunks, { type: a.recorder.mimeType || (a.chunks[0] || {}).type || 'audio/webm' });
        if (!blob.size) { v.message = '녹음 소리를 저장하지 못했어. 마이크를 확인하고 다시 녹음해줘.'; render(v); a.resolve(null); return; }
        var r = Object.assign({}, a.record, { blob: blob, partial: !!a.error, duration: Math.round(((a.stoppedAt || Date.now()) - a.started) / 1000) });
        v.current = r.id; v.message = a.error ? '녹음이 중간에 멈췄어. 남은 소리를 확인해줘.' : '녹음이 끝났어. 재생해서 소리가 들리는지 확인해줘.';
        store(r).then(function () { notify(r); if (v.hooks.onRecord) v.hooks.onRecord(metadata(r)); a.resolve(r); if (connected()) upload(r); if (v.hooks.onFinal && !r.partial) v.hooks.onFinal(metadata(r)); });
      };
      a.recorder.onstop = a.finish; a.recorder.onerror = function () { a.error = true; stop(); };
      a.recorder.start(1000); a.started = Date.now();
      a.record = { id: a.started.toString(36) + '-' + Math.random().toString(36).slice(2, 8), subject: subject, topic: topic, at: a.started, name: filename(subject, topic, a.started, a.recorder.mimeType || 'audio/webm') };
      stream.getTracks().forEach(function (t) { t.onended = function () { if (active === a) stop(); }; });
      if (v.hooks.onStart) v.hooks.onStart();
      a.interval = setInterval(function () { if (Date.now() - a.started >= 60000) stop(); else renderClock(v); }, 250); render(v);
    }).catch(function () { if (a.stream) a.stream.getTracks().forEach(function (t) { t.stop(); }); if (active === a) active = null; if (v.hooks.onStop) v.hooks.onStop(); v.message = '마이크를 사용할 수 없어. 브라우저 권한을 확인하거나 녹음 파일을 골라줘.'; render(v); a.resolve(null); });
  }
  function renderClock(v) { var c = v.root.querySelector('.av-clock'); if (c && active && active.v === v) { var n = active.started ? Math.max(0, 60 - Math.floor((Date.now() - active.started) / 1000)) : 60; c.textContent = Math.floor(n / 60) + ':' + ('0' + n % 60).slice(-2); } }
  function render(v) {
    if (!v.root.isConnected) return;
    var generation = (v.generation || 0) + 1; v.generation = generation;
    var historyOpen = v.root.querySelector('.av-history') && v.root.querySelector('.av-history').open, settingsOpen = v.root.querySelector('.av-settings') && v.root.querySelector('.av-settings').open;
    v.root.querySelectorAll('[data-blob-url]').forEach(function (el) { URL.revokeObjectURL(el.dataset.blobUrl); });
    var recording = active && active.v === v;
    v.root.innerHTML = '<div class="av-box"><b>🎙️ 녹음 원본 남기기</b><p class="small">과목·주제를 적고 녹음해줘. 파일 이름은 과목_주제_한국시간으로 붙여둘게.</p><div class="av-clock" role="timer" aria-label="남은 녹음 시간">1:00</div><button type="button" data-av-record aria-pressed="' + !!recording + '">' + (recording ? '■ 녹음 마치기' : '🎙️ 1분 녹음 시작') + '</button><p class="small" role="status">' + esc(v.message) + '</p><div class="av-current"></div><details class="av-settings"><summary>녹음 가져오기 · 직접 Drive 연결(선택)</summary><label class="av-import small">다른 녹음 파일 고르기<input type="file" data-av-file accept="audio/*"></label><p class="small av-drive-status" role="status">' + esc(driveMessage) + '</p><button type="button" data-av-connect>' + (connected() ? 'Google 저장 폴더 바꾸기' : 'Google Drive 연결') + '</button>' + (connected() ? '<a href="' + esc(destination.url) + '" target="_blank" rel="noopener">' + esc(destination.name) + ' 폴더 열기 ↗</a>' : '') + '</details><details class="av-history"><summary>이 기기의 녹음 보관함</summary><div class="av-records"></div></details></div>';
    renderClock(v);
    v.root.querySelector('.av-history').open = !!historyOpen; v.root.querySelector('.av-settings').open = !!settingsOpen;
    if (v.current) get(v.current).then(function (r) { if (r && v.root.isConnected && v.generation === generation) recordRow(v.root.querySelector('.av-current'), r); });
    all().then(function (rows) { if (!v.root.isConnected || v.generation !== generation) return; var box = v.root.querySelector('.av-records'); rows.slice(0, v.limit).forEach(function (r) { var row = document.createElement('div'); box.appendChild(row); recordRow(row, r); }); if (!rows.length) box.textContent = '아직 녹음 파일이 없어.'; if (rows.length > v.limit) { var b = document.createElement('button'); b.type = 'button'; b.dataset.avMore = '1'; b.textContent = '이전 녹음 더 보기'; box.appendChild(b); } });
  }
  function recordRow(box, r) {
    if (!box) return;
    box.classList.add('av-row'); box.dataset.recording = r.id;
    var url = URL.createObjectURL(r.blob); box.innerHTML = '<p class="small"><b>' + esc(r.name) + '</b></p><audio controls preload="none" aria-label="녹음 재생" src="' + url + '"></audio><p class="small" role="status">' + (r.uploaded ? '✅ Google Drive 저장 확인됨' : r.uploading ? 'Drive에 저장하는 중…' : r.memoryOnly ? '이 화면에만 있어. 파일 받기로 꼭 보관해줘.' : '이 기기에 보관 중 · Drive 저장 대기') + (r.error ? '<br>' + esc(r.error) : '') + '</p><div class="av-actions"><a href="' + url + '" download="' + esc(r.name) + '">파일 받기</a>' + (r.uploaded ? '<a href="' + esc(r.driveUrl) + '" target="_blank" rel="noopener">Drive에서 열기 ↗</a>' : '<button type="button" data-av-upload="' + esc(r.id) + '"' + (r.uploading ? ' disabled' : '') + '>Drive에 다시 저장</button>') + '</div>';
    if (r.partial) box.querySelector('[role=status]').textContent = '중간에 멈춘 녹음이야. 재생해서 소리를 확인한 뒤 저장해줘.';
    box.dataset.blobUrl = url;
    if (!(window.PinGate && PinGate.who && PinGate.who() === 'parent')) { var del = document.createElement('button'); del.type = 'button'; del.className = 'av-del'; del.dataset.avDel = r.id; del.textContent = '🗑 녹음 지우기'; box.appendChild(del); }
  }
  function renderAll() { views.forEach(function (v) { if (!v.root.isConnected) { views.delete(v); return; } render(v); }); }
  function mount(root, hooks) {
    var v = { root: root, hooks: hooks, current: '', limit: 5, message: '녹음은 이 폰에 먼저 저장돼.' }; views.add(v); render(v);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.avDel) { if (active && active.record && active.record.id === b.dataset.avDel) return; askRemove(b.dataset.avDel).then(function (ok) { if (ok && v.current === b.dataset.avDel) { v.current = ''; renderAll(); } }); return; }
      if (b.hasAttribute('data-av-record')) { active ? stop() : start(v); }
      if (b.hasAttribute('data-av-connect')) connect();
      if (b.hasAttribute('data-av-more')) { v.limit += 10; renderAll(); v.root.querySelector('.av-history').open = true; }
      if (b.dataset.avUpload) get(b.dataset.avUpload).then(function (r) { if (r) { if (r.partial) { if (!confirm('중간에 멈춘 녹음을 그대로 Drive에 저장할까?')) return; r.partial = false; store(r); } if (!connected()) connect(); else upload(r); } });
    });
    root.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0]; if (!e.target.hasAttribute('data-av-file') || !file) return;
      var subject = safe(hooks.subject(), 24), topic = safe(hooks.topic(), 60), at = Date.now();
      if (!subject || !topic || !/^audio\//.test(file.type) || file.size > 5 * 1024 * 1024) { v.message = '과목·주제를 적고 5MB 이하의 음성 파일을 골라줘.'; render(v); return; }
      var r = { id: at.toString(36) + '-' + Math.random().toString(36).slice(2, 8), subject: subject, topic: topic, at: at, blob: file, name: filename(subject, topic, at, file.type) };
      v.current = r.id; store(r).then(function () { notify(r); if (hooks.onRecord) hooks.onRecord(metadata(r)); if (connected()) upload(r); });
    });
    warm();
    return { stop: stop, active: function () { return !!active; }, last: function () { return v.current ? memory.get(v.current) || null : null; }, show: function (id) { v.current = id; renderAll(); }, detach: function () { views.delete(v); root.querySelectorAll('[data-blob-url]').forEach(function (el) { URL.revokeObjectURL(el.dataset.blobUrl); }); return stop(); } };
  }
  function open(id) {
    get(id).then(function (r) {
      if (!r) { if (typeof notice === 'function') notice('이 기기에는 녹음 원본이 없어. 노트의 Drive 녹음 링크를 확인해줘.'); return; }
      var previous = document.activeElement, dialog = document.createElement('div'); dialog.className = 'tn-sheet'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-label', '녹음 원본');
      dialog.innerHTML = '<div class="tn-panel"><button type="button" data-av-close>닫기</button><div class="av-preview"></div></div>'; document.body.appendChild(dialog); recordRow(dialog.querySelector('.av-preview'), r);
      function close() { var el = dialog.querySelector('[data-blob-url]'); if (el) URL.revokeObjectURL(el.dataset.blobUrl); window.removeEventListener('fc-audio-saved', update); dialog.remove(); if (previous && previous.isConnected) previous.focus(); }
      function update(e) { if (e.detail.id === id) { var el = dialog.querySelector('[data-blob-url]'); if (el) URL.revokeObjectURL(el.dataset.blobUrl); recordRow(dialog.querySelector('.av-preview'), memory.get(id)); } }
      window.addEventListener('fc-audio-saved', update);
      dialog.addEventListener('click', function (e) { if (e.target.closest('[data-av-close]')) close(); if (e.target.closest('[data-av-del]')) { askRemove(id).then(function (ok) { if (ok) close(); }); return; } if (e.target.closest('[data-av-upload]')) { if (r.partial) { if (!confirm('중간에 멈춘 녹음을 그대로 저장할까?')) return; r.partial = false; store(r); } connected() ? upload(r) : connect(); } });
      dialog.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }); dialog.querySelector('[data-av-close]').focus();
    });
  }
  function rememberDrive(id, f) {
    return get(id).then(function (r) {
      if (!r || !r.blob || r.blob.size !== f.size || !/^[\w-]{10,200}$/.test(f.id) || !/^https:\/\/drive\.google\.com\/file\/d\//.test(f.url || '')) return;
      return r.blob.arrayBuffer().then(function (b) { return crypto.subtle.digest('SHA-256', b); }).then(function (b) {
        var hash = Array.from(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); if (hash !== f.sha256) return;
        r.driveId = f.id; r.driveUrl = f.url; r.driveParent = f.parentId; r.name = f.name; r.uploaded = true; r.uploadedVia = 'chat'; r.error = '';
        return store(r).then(function () { notify(r); });
      });
    }).catch(function () {});
  }
  window.FC_AUDIO = { mount: mount, stop: stop, get: get, metadata: metadata, open: open, rememberDrive: rememberDrive, remove: remove };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState !== 'visible') stop(); });
  window.addEventListener('pagehide', stop);
  fetch('/.netlify/functions/recording-config', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { config = j; if (!j.configured) driveMessage = '채팅·Drive로 보내기를 이용하면 ChatGPT가 녹음 원본도 저장할 수 있어. 사이트의 직접 Drive 연결은 선택 기능이야.'; warm(); renderAll(); }).catch(function () { config = { configured: false }; driveMessage = 'Google 연결 설정을 불러오지 못했어. 녹음은 이 기기에 보관할게.'; renderAll(); });
  var style = document.createElement('style'); style.textContent = '.av-del{display:block;width:100%;margin-top:8px;min-height:var(--tap);background:transparent!important;border:1px solid var(--u-line)!important;color:var(--exam-ink)!important;font-weight:700;border-radius:12px!important}.av-box{padding:12px;border:1px solid var(--u-line);border-radius:var(--r-m);margin:10px 0;background:var(--u-soft)}.av-box p{line-height:1.6}.av-box button{min-height:var(--tap);width:100%;font-weight:700}.av-clock{font-size:var(--fs-3xl);font-weight:800;text-align:center;margin:8px 0;color:var(--accent)}.av-import{display:block!important;margin:8px 0!important}.av-import input{display:block;width:100%;box-sizing:border-box;font-size:var(--fs-s);padding:8px 0}.av-row{margin:10px 0;border-top:1px solid var(--u-line);padding-top:10px;overflow-wrap:anywhere}.av-row audio{display:block;width:100%;height:44px}.av-row p{margin:6px 0}.av-box a{display:flex;align-items:center;justify-content:center;min-height:var(--tap);font-size:var(--fs-s);color:var(--accent);padding:6px 10px;box-sizing:border-box}.av-actions{display:flex;gap:8px;flex-wrap:wrap}.av-actions>*{flex:1;min-width:100px}.av-settings>summary,.av-history>summary{min-height:var(--tap);font-size:var(--fs-s);cursor:pointer}.picker-dialog{z-index:1200!important}.picker-dialog-bg{z-index:1199!important}'; document.head.appendChild(style);
})();
