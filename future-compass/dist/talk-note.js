/* 수업 노트: 🎙️ 1분 말하기 + 📷 요약 노트 사진
   - 말하기: ChatGPT 음성 입력으로 1분 회상 → 정리 복사 → 복습 저장. 이 화면의 받아쓰기는 선택
   - 사진: 이 기기(IndexedDB)에 저장, 가족 공유 중이면 가족 기기에서도 보이게 서버에 올림. 글자 읽기(OCR)는 선택
   - 저장하면 복습(내가 진짜 이해했는지 확인하기)에 들어가고 내일·3일·7일 다시 보기가 자동으로 잡힘
   - 옵시디언용 마크다운(zip)으로 내보내기 */
(function () {
  'use strict';
  var KEY = 'fc_notes_v1', DB = 'fc-notes-photos', J = 'https://cdn.jsdelivr.net/npm/';
  var OCR = { lib: J + 'tesseract.js@5.1.1/dist/tesseract.min.js', worker: J + 'tesseract.js@5.1.1/dist/worker.min.js', core: J + 'tesseract.js-core@5.1.1', lang: J + '@tesseract.js-data/kor@1.0.0/4.0.0_best_int' };
  var ZIP = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function notes() { var v = ls(KEY, []); return Array.isArray(v) ? v.filter(function (n) { return n && n.id && n.date; }).slice(-300) : []; }
  function saveNotes(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-300))); return true; } catch (e) { notice('저장 공간이 부족해. 오래된 노트를 지워줘.'); return false; } }
  function nid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10)); }
  function loadScript(src, test) { return new Promise(function (ok, no) { if (test()) return ok(); var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }

  /* ---------- 사진 저장소(IndexedDB) ---------- */
  function idb() { return new Promise(function (ok, no) { try { var r = indexedDB.open(DB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('p'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; } catch (e) { no(e); } }); }
  function putPhoto(id, data) { return idb().then(function (db) { return new Promise(function (ok, no) { var tx = db.transaction('p', 'readwrite'); tx.objectStore('p').put(data, id); tx.oncomplete = function () { ok(true); }; tx.onerror = function () { no(tx.error); }; }); }); }
  function getLocal(id) { return idb().then(function (db) { return new Promise(function (ok) { var q = db.transaction('p').objectStore('p').get(id); q.onsuccess = function () { ok(q.result || ''); }; q.onerror = function () { ok(''); }; }); }).catch(function () { return ''; }); }
  function delPhoto(id) { if (typeof FamilySync !== 'undefined' && FamilySync.joined()) FamilySync.call({ action: 'photo-del', id: id }).catch(function () {}); return idb().then(function (db) { db.transaction('p', 'readwrite').objectStore('p').delete(id); }).catch(function () {}); }   // 이 폰 + 가족 서버 사진 같이 지움
  function getPhoto(id) {
    return getLocal(id).then(function (d) {
      if (d || typeof FamilySync === 'undefined' || !FamilySync.joined()) return d;
      return FamilySync.call({ action: 'photo-get', id: id }).then(function (j) { if (j && j.data) { putPhoto(id, j.data).catch(function () {}); return j.data; } return ''; });
    });
  }
  function shrinkPhoto(file) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = 1400, out = '';
        for (var k = 0; k < 4; k++) {
          var r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL('image/jpeg', 0.78); if (out.length < 650000) break; max = Math.round(max * 0.8);
        }
        URL.revokeObjectURL(url); ok(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); no(new Error('img')); };
      img.src = url;
    });
  }

  /* ---------- 과목 고르기 ---------- */
  function subjects() {
    var t = today(), w = new Date(t + 'T12:00:00Z').getUTCDay(), seen = {}, out = [];
    var todayRow = w >= 1 && w <= 5 ? (state.table[w - 1] || []) : [];
    todayRow.concat([].concat.apply([], state.table)).forEach(function (x) { x = String(x || '').trim(); if (x && !seen[x] && !/체육|음악|미술|창체|자율|동아리|봉사/.test(x)) { seen[x] = 1; out.push(x); } });
    return out.slice(0, 14);
  }
  /* 오늘 수업(시간표 순서) + 남김 상태. 주말·휴업일이면 빈 배열 */
  var SKIP = /체육|음악|미술|창체|자율|동아리|봉사/;
  function toMin(hm) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '')); return m ? +m[1] * 60 + +m[2] : NaN; }
  function lessons() {
    var t = today(), w = new Date(t + 'T12:00:00Z').getUTCDay();
    if (w < 1 || w > 5 || (window.FC_CAL && FC_CAL.offDay && FC_CAL.offDay(t))) return [];
    var cfg = (window.FC_SCHOOL && FC_SCHOOL.config) || {}, per = cfg.periods || [], len = cfg.classMinutes || 50;
    var k = new Date(Date.now() + 9 * 3600000), now = k.getUTCHours() * 60 + k.getUTCMinutes(), done = {}, out = [];
    notes().forEach(function (n) { if (n.date === t) done[n.subject] = (done[n.subject] || 0) + 1; });
    (state.table[w - 1] || []).forEach(function (x, i) {
      x = String(x || '').trim(); if (!x || SKIP.test(x)) return;
      var st = toMin(per[i]), end = st + len, ok = done[x] > 0;
      if (ok) done[x]--;
      out.push({ sub: x, p: i + 1, time: per[i] || '', end: end, status: ok ? 'done' : isNaN(st) || now < st ? 'later' : now < end ? 'now' : 'past', fresh: now >= end && now - end <= 70 });
    });
    return out;
  }
  function pickLesson(L) {
    var past = L.filter(function (x) { return x.status === 'past'; });
    return past[past.length - 1] || L.find(function (x) { return x.status === 'now'; }) || L.find(function (x) { return x.status === 'later'; }) || L[0] || null;
  }
  function lessonTag(x) { return x.status === 'done' ? '✓ 남김' : x.status === 'now' ? '수업 중' : x.status === 'later' ? '예정' : x.fresh ? '방금 끝남' : '못 남김'; }
  function subjectPicker() {
    var L = lessons(), pick = pickLesson(L);
    if (!L.length) { sub = subjects()[0] || ''; return '<div class="pl-chips tn-subs">' + subjects().map(function (x, i) { return '<button type="button" data-tn-sub="' + esc(x) + '" aria-pressed="' + (i === 0) + '" class="' + (i === 0 ? 'on' : '') + '">' + esc(x) + '</button>'; }).join('') + '<input id="tn-subject" class="tn-sub-other" maxlength="20" placeholder="다른 과목"></div>'; }
    sub = pick.sub;
    var left = L.filter(function (x) { return x.status === 'past'; }).length, did = L.filter(function (x) { return x.status === 'done'; }).length;
    var mine = {}; L.forEach(function (x) { mine[x.sub] = 1; });
    var more = subjects().filter(function (x) { return !mine[x]; });
    return '<p class="tn-ls-sum small">오늘 수업 ' + L.length + '개 중 <b>' + did + '개 남김</b>' + (left ? ' · 아직 못 남긴 수업 ' + left + '개' : '') + '</p>' +
      '<div class="tn-lessons" role="group" aria-label="오늘 수업">' + L.map(function (x) { var on = x === pick; return '<button type="button" data-tn-sub="' + esc(x.sub) + '" aria-pressed="' + on + '" class="tn-ls st-' + x.status + (x.fresh && x.status === 'past' ? ' fresh' : '') + (on ? ' on' : '') + '"><small>' + x.p + '교시' + (x.time ? ' · ' + x.time : '') + '</small><b>' + esc(x.sub) + '</b><em>' + lessonTag(x) + '</em></button>'; }).join('') + '</div>' +
      '<button type="button" class="tn-more-btn" data-tn-more aria-expanded="false" aria-controls="tn-more">＋ 다른 과목 더 보기</button>' +
      '<div class="pl-chips tn-subs tn-more" id="tn-more" hidden>' + more.map(function (x) { return '<button type="button" data-tn-sub="' + esc(x) + '" aria-pressed="false">' + esc(x) + '</button>'; }).join('') + '<input id="tn-subject" class="tn-sub-other" maxlength="20" placeholder="다른 과목"></div>';
  }
  /* 🗑 노트 지우기: 노트 + (선택) 이 기기 녹음 원본 + (선택) Drive 파일(휴지통, 30일 안 복구 가능) */
  function driveFiles(n) {
    var a = (n.cloud && Array.isArray(n.cloud.files) ? n.cloud.files : []).filter(function (f) { return f && /^[\w-]{10,200}$/.test(f.id || '') && f.name; });
    if (n.audio && n.audio.driveId && !a.some(function (f) { return f.id === n.audio.driveId; })) a.push({ role: 'audio', id: n.audio.driveId, name: n.audio.name || '' });
    return a.filter(function (f) { return f.name; });
  }
  function askDelete(n) {
    var old = document.querySelector('.tn-delsheet'); if (old) old.remove();
    var files = driveFiles(n), el = document.createElement('div');
    el.className = 'tn-sheet tn-delsheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '노트 지우기'); el.dataset.note = n.id;
    el.innerHTML = '<div class="tn-panel"><b class="tn-del-title">🗑 이 노트를 지울까?</b><p class="small">' + esc(n.subject) + ' · ' + esc(n.topic || md(n.date)) + '</p>' +
      (n.audio ? '<label class="tn-auto"><input type="checkbox" data-del-audio checked> 이 기기의 녹음 원본도 지우기</label>' : '') +
      (files.length ? '<label class="tn-auto"><input type="checkbox" data-del-drive checked> Drive 파일 ' + files.length + '개도 휴지통으로 (30일 안에 Drive에서 되살릴 수 있어)</label>' : '') +
      '<p class="small muted">복습 목록의 메모는 남아. 지운 노트는 되돌릴 수 없어.</p><div class="tn-del-row"><button type="button" data-tn-delno>취소</button><button type="button" class="tn-del-go" data-tn-delgo>지우기</button></div></div>';
    el.addEventListener('click', function (e) { if (e.target === el) el.remove(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') el.remove(); });
    document.body.appendChild(el); el.querySelector('[data-tn-delno]').focus();
  }
  function doDelete(b) {
    var el = b.closest('.tn-delsheet'); if (!el) return;
    var n = notes().find(function (x) { return x.id === el.dataset.note; }); if (!n) { el.remove(); return; }
    var wantAudio = !!(el.querySelector('[data-del-audio]') || {}).checked, wantDrive = !!(el.querySelector('[data-del-drive]') || {}).checked, files = driveFiles(n);
    b.disabled = true;
    if (!saveNotes(notes().filter(function (x) { return x.id !== n.id; }))) { b.disabled = false; return; }
    if (n.photo) delPhoto(n.id);
    vsave(vjobs().filter(function (j) { return j.noteId !== n.id; }));
    if (wantAudio && n.audio && window.FC_AUDIO && FC_AUDIO.remove) FC_AUDIO.remove(n.audio.id);
    el.remove(); render();
    if (!wantDrive || !files.length) { notice('노트를 지웠어.'); return; }
    var l = liveInfo();
    if (!l || !l.url) { notice('노트를 지웠어. Drive 파일은 서버에 연결이 안 돼서 Drive에서 직접 지워줘.'); return; }
    fetch(l.url + '/voice/del', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ t: l.t, subject: n.subject, files: files.map(function (f) { return { id: f.id, name: f.name }; }) }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw Error(j.error || 'del'); return j.result || {}; }); })
      .then(function (res) { var ids = Object.keys(res), gone = ids.filter(function (k) { return res[k] === 'trashed' || res[k] === 'missing'; }).length; notice(gone === ids.length ? '노트와 Drive 파일 ' + gone + '개를 지웠어 (Drive 휴지통).' : '노트를 지웠어. Drive 파일 ' + (ids.length - gone) + '개는 못 지웠어. Drive에서 직접 지워줘.'); })
      .catch(function () { notice('노트를 지웠어. Drive 파일은 지우지 못했어. Drive에서 직접 지워줘.'); });
  }
  function autoTopic() { var x = lessons().find(function (y) { return y.sub === sub; }); return x ? x.p + '교시 수업' : '수업 복습'; }
  function autoOn() { try { return localStorage.getItem('fc-tn-auto') !== '0'; } catch (e) { return true; } }
  /* 🎙️ VPS 자동 처리: 녹음 → 받아쓰기(Whisper) → 정리 → Drive. 서버가 없거나 꺼져 있으면 ChatGPT 흐름으로 */
  var VKEY = 'fc-voice-v1', vcap = null, vtimer = null;
  function liveInfo() { return typeof FamilySync !== 'undefined' && FamilySync.joined() && FamilySync.live ? FamilySync.live() : null; }
  function voiceCap() {
    var l = liveInfo(); if (!l || !l.url || !l.t) return Promise.resolve(false);
    if (vcap && Date.now() - vcap.at < 300000) return Promise.resolve(vcap.ok);
    return fetch(l.url + '/health', { cache: 'no-store', signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined }).then(function (r) { return r.json(); })
      .then(function (j) { var v = j && j.voice; vcap = { at: Date.now(), ok: !!(v && (v.stt || v.drive)), drive: !!(v && v.drive) }; return vcap.ok; })
      .catch(function () { vcap = { at: Date.now(), ok: false }; return false; });
  }
  function vjobs() { var a = ls(VKEY, []); return Array.isArray(a) ? a.filter(function (j) { return j && /^[a-f0-9]{32}$/.test(j.id) && j.noteId && Date.now() - j.at < 48 * 3600e3; }).slice(-10) : []; }
  function vsave(a) { try { localStorage.setItem(VKEY, JSON.stringify(a)); } catch (e) {} }
  function hex(n) { return Array.from(crypto.getRandomValues(new Uint8Array(n)), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  function b64(blob) { return new Promise(function (ok, no) { var fr = new FileReader(); fr.onload = function () { ok(String(fr.result).split(',')[1] || ''); }; fr.onerror = no; fr.readAsDataURL(blob); }); }
  function startVoice(n) {
    var l = liveInfo(); if (!l || !n.audio || !window.FC_AUDIO) return;
    FC_AUDIO.get(n.audio.id).then(function (r) {
      if (!r || !r.blob || !r.blob.size) throw Error('audio');
      return b64(r.blob).then(function (data) {
        var j = { id: hex(16), noteId: n.id, basis: window.FC_CHAT_DRIVE ? FC_CHAT_DRIVE.basis(n) : '', at: Date.now() };
        var a = vjobs(); a.push(j); vsave(a);
        return fetch(l.url + '/voice', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ t: l.t, id: j.id, subject: n.subject, topic: n.topic || '', at: new Date(r.at || Date.now()).toISOString(), mime: r.blob.type || 'audio/webm', name: r.name || '', text: n.text || '', audio: data }) })
          .then(function (res) { return res.json().then(function (x) { if (!res.ok) throw Error(x.error || 'voice'); }); });
      });
    }).then(function () { notice('🎧 받아쓰기·정리·Drive 저장 중… 1~3분 걸려. 다른 거 해도 돼.'); vpoll(); if (typeof render === 'function') render(); })
      .catch(function (e) { vsave(vjobs().filter(function (j) { return j.noteId !== n.id; })); notice('자동 정리 서버에 보내지 못했어. 노트의 "채팅·Drive로 보내기"를 눌러줘.'); if (typeof render === 'function') render(); });
  }
  function vpoll() {
    clearTimeout(vtimer); var a = vjobs(), l = liveInfo(); if (!a.length || !l || document.visibilityState !== 'visible') return;
    Promise.all(a.map(function (j) {
      return fetch(l.url + '/voice?id=' + j.id + '&t=' + encodeURIComponent(l.t), { cache: 'no-store' }).then(function (r) { if (r.status === 404) return { gone: true }; return r.json(); }).then(function (x) {
        if (x.gone) { j.drop = true; return; }
        if (x.state !== 'done' || !x.result) return;
        var note = notes().find(function (y) { return y.id === j.noteId; });
        var res = FC_NOTES.applyCloud(j.noteId, j.basis, { at: x.result.at, value: { verified: true, summary: x.result.summary || '', transcript: x.result.transcript || '', files: x.result.files || [] } }, 'v-' + j.id, !(note && note.sum));
        j.drop = res !== 'failed';
        if (res === 'applied') notice((x.result.summary ? '🧠 정리 완료' : '📝 받아쓰기 완료') + ((x.result.files || []).length ? ' · Drive 저장' : '') + ((x.errors || []).length ? ' (일부 단계는 건너뜀)' : '') + '. 복습 탭에서 볼 수 있어.');
        if (res === 'conflict') notice('정리를 받았는데 그사이 노트를 고쳐서 반영을 멈췄어.');
      }).catch(function () {});
    })).then(function () { var rest = a.filter(function (j) { return !j.drop; }); vsave(rest); if (rest.length) vtimer = setTimeout(vpoll, 8000); if (typeof render === 'function' && a.length !== rest.length) render(); });
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') vpoll(); });
  window.addEventListener('fc-audio-removed', function (e) { if (currentAudio && e.detail && currentAudio.id === e.detail.id) { currentAudio = null; if (sheet) saveDraft(); } });
  setTimeout(vpoll, 2500);
  function showMore(on) { var m = sheet && sheet.querySelector('.tn-more'), b = sheet && sheet.querySelector('[data-tn-more]'); if (!m || !b) return; m.hidden = !on; b.setAttribute('aria-expanded', String(on)); b.textContent = on ? '－ 다른 과목 접기' : '＋ 다른 과목 더 보기'; }

  /* ---------- 오늘 탭 카드 ---------- */
  function todayCard() {
    if (isParent()) return '';
    var n = notes().filter(function (x) { return x.date === today(); });
    var hour = new Date(Date.now() + 9 * 3600000).getUTCHours();
    return '<section class="card tn-card' + (hour >= 15 && !n.length ? ' tn-hot' : '') + '"><div class="pl-head"><h2>📒 오늘 배운 것 남기기</h2>' + (n.length ? '<span class="pl-count">오늘 ' + n.length + '개</span>' : '') + '</div>' +
      (function () { var L = lessons(), x = pickLesson(L); if (!x || x.status === 'done' || x.status === 'later') return ''; var left = L.filter(function (y) { return y.status === 'past'; }).length; return '<p class="tn-next small"><b>' + (x.status === 'now' ? '지금 ' : x.fresh ? '방금 끝난 ' : '남길 차례: ') + x.p + '교시 ' + esc(x.sub) + '</b>' + (left > 1 ? ' · 못 남긴 수업 ' + left + '개' : '') + '</p>'; })() +
      '<p class="muted small">수업 끝나고 1분 — 교과서·필기 사진을 찍거나 말로 남기면 🧠 핵심·용어·확인 질문으로 정리해서 복습과 다음 수업 전에 보여줘.</p>' +
      '<div class="tn-btns"><button type="button" class="primary" data-tn-open="talk">🎙️ 1분 말하기</button><button type="button" data-tn-open="photo">📷 교과서·노트 사진</button></div></section>';
  }

  /* ---------- 시트(전체 화면) ---------- */
  var sheet = null, sub = '', rec = null, timer = null, restart = null, deadline = 0, photoData = '';
  var sheetKind = 'photo', preparedPrompt = '', returnFocus = null, audioSession = null, currentAudio = null;
  function closeSheet() {
    stopRec(); if (audioSession) audioSession.detach(); audioSession = null;
    if (sheet) sheet.remove(); sheet = null; photoData = ''; preparedPrompt = ''; currentAudio = null;
    document.documentElement.classList.remove('tn-open');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  }
  function openSheet(kind) {
    closeSheet(); returnFocus = document.activeElement; sheetKind = kind; gptSent = ''; var picker = subjectPicker();
    sheet = document.createElement('div'); sheet.className = 'tn-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', kind === 'talk' ? '1분 말하기' : '노트 사진');
    sheet.innerHTML = '<div class="tn-panel"><div class="tn-top"><button type="button" class="tn-x" data-tn-close aria-label="닫기">✕</button><b>' + (kind === 'talk' ? '🎙️ 1분 말하기' : '📷 요약 노트 사진') + '</b><span></span></div>' +
      '<span class="tn-l">과목</span>' + picker +
      (kind === 'talk' ? '<label class="tn-l" for="tn-topic">오늘의 주제</label><input id="tn-topic" class="tn-topic" maxlength="60" placeholder="비워두면 N교시 수업으로 적을게 · 예: 함수의 뜻">' : '') +
      (kind === 'talk' ? talkBody() : photoBody()) +
      (kind === 'talk' ? '' : '<label class="tn-l" for="tn-text">메모 <small class="muted">(사진에서 읽은 글·헷갈린 것)</small></label><textarea id="tn-text" class="tn-text" rows="5" maxlength="1500" placeholder="사진 속 핵심을 한두 줄 적거나, 글자 읽기를 눌러봐."></textarea>') +
      (window.FC_CHAT_DRIVE ? '<div class="tn-handoff"><b>채팅에서 정리하고 Drive에 보관</b><p class="small">지금 쓴 글과 녹음·사진 원본을 기기에 저장한 뒤 전달 자료로 준비해. 채팅에 요청을 보내면 정리와 Drive 파일 링크를 공부방으로 받을 수 있어.</p><p class="small muted">전달 자료는 사이트에 24시간 보관돼. Drive 저장은 채팅의 처리 결과를 받아야 확인돼.</p>' + (kind === 'talk' ? '<label class="tn-auto"><input type="checkbox" data-tn-auto' + (autoOn() ? ' checked' : '') + '> 녹음이 끝나면 자동으로 저장·정리·Drive 보관</label>' : '') + '<button type="button" class="primary" data-tn-cloud-new="' + kind + '">노트 저장 · 채팅·Drive로 보내기</button></div><details class="tn-alt tn-manual"><summary>글만 전달 · 정리 직접 붙여넣기</summary>' : '') +
      '<div class="tn-handoff"><b>💬 ChatGPT로 복습하기</b><p class="small">① 요청을 복사하고 ② ChatGPT를 열어줘. 입력창이 비어 있으면 붙여넣고 보내줘.' + (kind === 'talk' ? ' 수업 내용을 아직 안 적었다면, 그다음 입력창의 🎤 음성 입력으로 1분 말하고 보내면 돼.' : ' 사진 원본은 자동으로 전송되지 않아. 필요하면 ChatGPT에서 직접 첨부해줘.') + '</p>' +
      '<button type="button" data-tn-copy>① 복습 요청 복사</button><a class="tn-gpt-main" data-tn-gpt href="https://chatgpt.com/" target="_blank" rel="noopener">② 일반 Chat 새 대화 열기 ↗</a><p class="small">ChatGPT 상단에서 <b>Chat</b>을 확인하고 보내줘. Work로 열렸다면 Chat으로 바꿔줘.</p>' +
      '<p class="tn-transfer-status small" role="status" aria-live="polite">핵심 정리·확인할 것·복습 질문 3개를 부탁할게.</p>' +
      '<details class="tn-request"><summary>복사가 안 될 때 · 요청 직접 복사</summary><label class="tn-l" for="tn-prompt">아래 요청 전체를 복사해 ChatGPT에 붙여넣어줘.</label><textarea id="tn-prompt" class="tn-prompt" rows="6" readonly></textarea><button type="button" data-tn-select>요청 전체 선택</button></details></div>' +
      '<ol class="tn-steps"><li>ChatGPT의 <b>정리된 답 전체를 복사</b>해줘.</li><li>이 화면으로 돌아와 <b>아래 📋 버튼</b>으로 붙여넣고 확인해줘.</li><li><b>저장</b>하면 내일·3일·7일 뒤 기억 확인으로 이어져.</li></ol>' +
      '<div class="tn-sum-box"><label class="tn-l" for="tn-summary">🧠 ChatGPT 답 붙여넣기 <small class="muted">(직접 고쳐 써도 돼)</small></label>' +
      '<p class="tn-paste-row"><button type="button" data-tn-paste>📋 복사한 정리 붙여넣기</button></p>' +
      '<p class="tn-return small" role="status" aria-live="polite"></p><textarea id="tn-summary" class="tn-sum" rows="8" maxlength="2000" placeholder="ChatGPT 답을 복사한 뒤 📋 버튼을 눌러줘. 권한이 없으면 이 칸을 길게 눌러 붙여넣기."></textarea></div>' +
      (window.FC_CHAT_DRIVE ? '</details>' : '') + '<div class="tn-again"><span>다시 보기</span><label><input type="checkbox" checked data-tn-day="1"> 내일</label><label><input type="checkbox" checked data-tn-day="3"> 3일 뒤</label><label><input type="checkbox" checked data-tn-day="7"> 7일 뒤</label></div>' +
      '<p class="tn-save-row"><button type="button"' + (window.FC_CHAT_DRIVE ? '' : ' class="primary"') + ' data-tn-save="' + kind + '">' + (window.FC_CHAT_DRIVE ? '이 기기에만 저장' : '복습 노트 저장') + '</button></p></div>';
    document.body.appendChild(sheet);
    document.documentElement.classList.add('tn-open');
    if (kind === 'talk' && window.FC_AUDIO) {
      var current = sheet;
      audioSession = FC_AUDIO.mount(sheet.querySelector('[data-tn-audio]'), {
        subject: function () { return current.querySelector('.tn-sub-other').value.trim() || sub || '기타'; },
        topic: function () { var el = current.querySelector('.tn-topic'), t = el.value.trim(); if (!t) { t = autoTopic(); el.value = t; saveDraft(); } return t; },
        onFinal: function () {
          if (sheet !== current || !autoOn()) return;
          voiceCap().then(function (ok) {
            if (sheet !== current) return;
            if (ok) { if (saveNote('talk', function (n) { startVoice(n); }) === false) notice('녹음은 보관함에 저장했어. 노트 저장은 다시 눌러줘.'); return; }
            notice('녹음을 저장했어 🎙️ 정리·Drive 전달을 바로 준비할게.');
            setTimeout(function () { if (sheet !== current) return; var b = current.querySelector('[data-tn-cloud-new]'); if (b && !b.disabled) b.click(); }, 300);
          });
        },
        onStart: function () { if (sheet === current) { current.querySelectorAll('[data-tn-sub],.tn-sub-other,.tn-topic').forEach(function (x) { x.disabled = true; }); if (SR) startRec(); } },
        onStop: function () { if (sheet === current) { current.querySelectorAll('[data-tn-sub],.tn-sub-other,.tn-topic').forEach(function (x) { x.disabled = false; }); stopRec('녹음이 끝났어. 글자로 남은 내용을 확인해줘.'); } },
        onRecord: function (r) { if (sheet === current) { currentAudio = r; saveDraft(); } }
      });
    }
    updateHandoff(); sheet.querySelector('[data-tn-close]').focus({ preventScroll: true });
  }
  function talkBody() {
    return '<div class="tn-rec"><b>노트를 덮고, 기억나는 대로 1분</b><ul class="tn-guide"><li>0~20초 · 오늘 배운 핵심 한 가지</li><li>20~40초 · 왜 그런지, 예시 한 가지</li><li>40~60초 · 헷갈리거나 설명이 막힌 부분</li></ul><p class="small muted">모르는 건 모른다고 말해도 돼. ChatGPT와 확인할 부분을 찾는 시간이야.</p></div><div data-tn-audio></div>' +
      '<details class="tn-local"><summary>말한 글 확인 · 받아쓰기 · 직접 적기</summary><p class="small muted">지원되는 브라우저는 녹음과 함께 받아쓰기를 시도해. 잘못 인식된 용어는 고쳐줘. 음성 인식은 브라우저의 음성 서비스가 처리할 수 있어. 아래 버튼은 받아쓰기만 시작해.</p>' +
      (SR ? '<div class="tn-clock" role="timer" aria-label="남은 말하기 시간">1:00</div><button type="button" class="tn-mic" data-tn-mic aria-pressed="false">🎙️ 1분 말하기 시작</button><p class="tn-live small" role="status" aria-live="polite">마이크를 허용하면 시작해.</p>' : '<p class="small">이 브라우저는 받아쓰기를 지원하지 않아. ChatGPT의 🎤 또는 키보드 음성 입력을 써줘.</p>') +
      '<label class="tn-l" for="tn-text">📝 말한 내용·메모 (최대 1,500자)</label><textarea id="tn-text" class="tn-text" rows="5" maxlength="1500" placeholder="말한 글을 확인하고 잘못 인식된 용어를 고쳐줘. 다른 녹음 앱의 받아쓰기를 붙여넣어도 돼."></textarea></details>';
  }
  function photoBody() {
    return '<div class="tn-photo"><input type="file" accept="image/*" capture="environment" hidden data-tn-file>' +
      '<div class="tn-preview" data-tn-preview><button type="button" data-tn-pick>📷 찍기 / 사진 고르기</button></div>' +
      '<p class="tn-ocr-row" hidden><button type="button" data-tn-ocr>🔤 글자 읽기 (손글씨는 잘 안 될 수 있어)</button></p></div>';
  }
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function recStatus(message) { var el = sheet && sheet.querySelector('.tn-live'); if (el) el.textContent = message; }
  function stopRec(message) {
    clearInterval(timer); clearTimeout(restart); timer = restart = null; deadline = 0;
    var old = rec; rec = null;
    if (old) { old.onstart = old.onresult = old.onend = old.onerror = null; try { old.stop(); } catch (e) {} }
    if (!sheet) return;
    var b = sheet.querySelector('[data-tn-mic]'), ta = sheet.querySelector('.tn-text');
    if (b) { b.textContent = ta.value.trim() ? '🎙️ 이어서 1분 말하기' : '🎙️ 1분 말하기 시작'; b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
    ta.readOnly = false;
    if (message) recStatus(message);
    saveDraft();
  }
  // 같은 세션의 누적 결과만 합친다. 반복해서 말한 단어를 임의로 지우지 않는다.
  function mergeFinals(list) {
    var out = [];
    list.forEach(function (text) {
      var t = String(text || '').trim(), last = out[out.length - 1] || '';
      if (!t) return;
      if (last && t.replace(/\s/g, '').indexOf(last.replace(/\s/g, '')) === 0) out[out.length - 1] = t;
      else out.push(t);
    });
    return out.join(' ');
  }
  function startRec() {
    if (!sheet || !SR || rec || restart) return;
    var current = sheet, ta = sheet.querySelector('.tn-text'), clock = sheet.querySelector('.tn-clock'), b = sheet.querySelector('[data-tn-mic]');
    var committed = ta.value.trim(), emptyEnds = 0;
    if (committed.length >= 1500) { recStatus('1,500자까지 적을 수 있어. 내용을 다듬은 뒤 이어서 말해줘.'); return; }
    clock.textContent = '1:00';
    function tick() {
      var left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); clock.textContent = fmt(left);
      if (!left) stopRec('1분 끝! 인식된 글을 확인한 뒤 복습 요청을 복사해줘.');
    }
    function begin() {
      if (sheet !== current || document.visibilityState !== 'visible') return;
      restart = null;
      var engine;
      try { engine = new SR(); } catch (e) { stopRec('마이크를 시작하지 못했어. ChatGPT나 키보드의 🎤를 써줘.'); return; }
      rec = engine; engine.lang = 'ko-KR'; engine.continuous = !/Android/i.test(navigator.userAgent || ''); engine.interimResults = true; engine.maxAlternatives = 1;
      var received = false;
      engine.onstart = function () {
        if (rec !== engine || sheet !== current) return;
        if (!deadline) { deadline = Date.now() + 60000; timer = setInterval(tick, 250); }
        tick(); if (!rec) return;
        b.textContent = '■ 말하기 멈추기'; b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); ta.readOnly = true;
        recStatus('듣고 있어. 화면을 나가면 말하기를 멈추고 글을 남겨둘게.');
      };
      engine.onresult = function (e) {
        if (rec !== engine || sheet !== current) return;
        var fin = [], interim = [];
        for (var i = 0; i < e.results.length; i++) { var r = e.results[i]; (r.isFinal ? fin : interim).push(r[0].transcript); }
        var text = [committed, mergeFinals(fin.concat(interim))].filter(Boolean).join(' ');
        ta.value = text.slice(0, 1500); received = true; emptyEnds = 0; preparedPrompt = '';
        updateHandoff(); saveDraft();
        if (text.length >= 1500) stopRec('1,500자에 도달해서 멈췄어. 화면의 글을 확인해줘.');
      };
      engine.onerror = function (e) {
        if (rec !== engine) return;
        if (e.error === 'no-speech') { recStatus('말소리를 기다리고 있어. 핵심 한 가지부터 말해봐.'); return; }
        var messages = { 'not-allowed': '마이크 권한이 꺼져 있어. ChatGPT 또는 키보드의 🎤를 쓰거나 브라우저 설정에서 마이크를 허용해줘.', 'service-not-allowed': '이 브라우저에서 음성 인식을 사용할 수 없어. ChatGPT나 키보드의 🎤를 써줘.', 'audio-capture': '마이크를 찾지 못했어. 연결을 확인하거나 ChatGPT의 🎤를 써줘.', network: '음성 인식에 연결하지 못했어. 지금까지 나온 글은 남겼어. ChatGPT나 키보드의 🎤로 이어서 말해줘.' };
        stopRec(messages[e.error] || '말하기가 멈췄어. 지금까지 나온 글을 확인하거나 ChatGPT에서 이어서 말해줘.');
      };
      engine.onend = function () {
        if (rec !== engine || sheet !== current) return;
        rec = null; committed = ta.value.trim();
        if (!deadline || ++emptyEnds >= 3 && !received) { stopRec('말소리를 인식하지 못했어. 다시 시작하거나 ChatGPT의 🎤를 써줘.'); return; }
        if (Date.now() >= deadline) { tick(); return; }
        restart = setTimeout(begin, 250);
      };
      try { recStatus('마이크 연결 중… 권한 요청이 나오면 허용해줘.'); engine.start(); }
      catch (e) { stopRec('마이크를 시작하지 못했어. ChatGPT나 키보드의 🎤를 써줘.'); }
    }
    begin();
  }
  /* 🧠 정리: AI(흰둥이 똑똑 모드)로 핵심·용어·확인 질문·다음 수업 전 볼 것. AI가 없으면 글에서 핵심 후보만 뽑기 */
  function localSum(text) {
    var lines = String(text).split(/\n|(?<=[.?!다])\s+/).map(function (x) { return x.replace(/^[\s•\-·*○●▶▷]+/, '').trim(); }).filter(function (x) { return x.length >= 6; });
    var key = lines.filter(function (x) { return /[:=]|이란|이다|란\s|뜻|정의|원리|법칙|특징/.test(x); }).concat(lines).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 4);
    var terms = []; lines.forEach(function (x) { var m = /^([가-힣A-Za-z0-9 ]{2,14})\s*[:=]\s*(.{4,60})/.exec(x); if (m && terms.length < 5) terms.push('- ' + m[1].trim() + ': ' + m[2].trim()); });
    return '📌 핵심 정리 (자동 추출 — 틀린 곳은 고쳐줘)\n' + key.map(function (x) { return '- ' + x.slice(0, 80); }).join('\n') + (terms.length ? '\n🔑 꼭 알아야 할 용어\n' + terms.join('\n') : '') +
      '\n❓ 스스로 확인 질문\n' + key.slice(0, 3).map(function (x) { var w = (/^([가-힣A-Za-z0-9]{2,12})/.exec(x) || ['', '이 내용'])[1]; return '- ' + w + '을(를) 내 말로 설명할 수 있어?'; }).join('\n') + '\n➡️ 다음 수업 전에 볼 것\n- 위 핵심 정리 1분 훑어보기';
  }
  /* 💬 ChatGPT에 보낼 회상 복습 요청. 수업 내용은 1,500자 전부 포함한다. */
  function gptPrompt(subject, text, kind) {
    var t = String(text || '').trim();
    return '[수업 노트 정리]\n고등학교 1학년 ' + (subject || '수업') + '의 1분 회상 복습을 도와줘. 일반 채팅에 글로만 답해줘. 문서·파일을 만드는 작업은 필요 없어.\n' +
      (kind === 'photo' ? '사진에서 옮긴 글에는 오탈자가 있을 수 있어. ' : '음성 입력에는 잘못 인식된 용어가 있을 수 있어. ') +
      '내가 말한 내용과 확인이 필요한 부분을 구분해줘. 불분명한 용어를 추측해 확정하지 마. 틀린 개념은 그대로 외우게 하지 말고 ⚠️에 수정 이유와 함께 따로 적어줘. 수업에서 다룬 범위·선생님 강조·시험 출제는 지어내지 마. 자료가 부족하면 교과서에서 확인할 점을 알려줘.\n' +
      '수업 내용을 받은 뒤 아래 형식으로 전체 900자 이내, 표·굵은 글씨 없이 정리해줘.\n' +
      '📌 핵심 정리\n- 내가 설명한 핵심 최대 3개\n🔑 꼭 알아야 할 용어\n- 용어: 뜻 (최대 3개)\n⚠️ 확인할 것\n- 헷갈린 개념·인식이 불확실한 용어·자료로 확인할 점\n❓ 스스로 확인 질문\n- 핵심 설명, 이유, 적용을 묻는 질문 3개. 답은 쓰지 마.\n➡️ 다음 복습\n- 내일·3일·7일 뒤 노트를 덮고 질문에 답한 뒤 정리와 비교하기\n' +
      '이후 내가 질문에 답하면 맞은 점·보완할 점·힌트를 짧게 알려줘.\n\n--- 수업 내용 ---\n' +
      (t || '아직 수업 내용을 보내지 않았어. 지금은 "수업에서 배운 핵심·이유·헷갈린 점을 1분 동안 말해줘 🎙️"라고만 답하고, 다음 메시지로 내용을 받을 때까지 정리를 만들지 마.');
  }
  function currentPrompt() {
    var subject = sheet.querySelector('.tn-sub-other').value.trim() || sub || '수업', topic = sheet.querySelector('.tn-topic');
    return gptPrompt(subject + (topic && topic.value.trim() ? ' · ' + topic.value.trim() : ''), sheet.querySelector('.tn-text').value, sheetKind);
  }
  function noteHref(prompt) {
    var A = window.SHIRO_AI;
    if (A && A.chatHref) return A.chatHref(prompt);
    var u = 'https://chatgpt.com/?q=' + encodeURIComponent(prompt);
    return u.length <= 6000 ? u : 'https://chatgpt.com/';
  }
  function updateHandoff() {
    if (!sheet) return;
    var prompt = currentPrompt();
    sheet.querySelector('.tn-prompt').value = prompt; sheet.querySelector('[data-tn-gpt]').href = noteHref(prompt);
    if (preparedPrompt && preparedPrompt !== prompt) {
      preparedPrompt = '';
      sheet.querySelector('.tn-transfer-status').textContent = '과목이나 내용이 바뀌었어. ① 요청을 다시 복사해줘.';
    }
  }
  function preparePrompt() {
    if (audioSession && audioSession.active()) { var waiting = sheet; audioSession.stop().then(function () { if (sheet === waiting) preparePrompt(); }); return; }
    stopRec('말한 글을 확인해줘. 복습 요청에 함께 넣을게.');
    var current = sheet, text = sheet.querySelector('.tn-text').value.trim();
    if (sheetKind === 'photo' && text.length < 15) { notice('글자 읽기를 하거나 사진의 핵심을 조금 더 적어줘.'); return; }
    var prompt = currentPrompt(), b = sheet.querySelector('[data-tn-copy]'), A = window.SHIRO_AI;
    updateHandoff(); b.disabled = true;
    var copied = A && A.rawCopy ? A.rawCopy(prompt) : Promise.resolve(false);
    Promise.resolve(copied).then(function (ok) {
      if (sheet !== current) return;
      b.disabled = false;
      if (currentPrompt() !== prompt) { preparedPrompt = ''; sheet.querySelector('.tn-transfer-status').textContent = '내용이 바뀌었어. ① 요청을 다시 복사해줘.'; return; }
      preparedPrompt = prompt;
      sheet.querySelector('.tn-transfer-status').textContent = ok ? '요청 전체를 복사했어. ② ChatGPT를 열고, 입력창이 비어 있으면 붙여넣은 뒤 보내줘.' : '자동 복사를 못 했어. 아래 요청을 직접 복사한 뒤 ② ChatGPT를 열어줘.';
      if (!ok) { sheet.querySelector('.tn-request').open = true; sheet.querySelector('.tn-prompt').focus(); sheet.querySelector('.tn-prompt').select(); }
      saveDraft();
    }).catch(function () { if (sheet === current) { b.disabled = false; preparedPrompt = prompt; sheet.querySelector('.tn-request').open = true; sheet.querySelector('.tn-transfer-status').textContent = '요청을 직접 복사한 뒤 ② ChatGPT를 열어줘.'; } });
  }
  /* 📋 외부 앱에서 돌아오면 직접 붙여넣는다. 백그라운드에서 클립보드를 읽지 않는다. */
  var gptSent = '', DRAFT = 'fc-tn-draft';
  function saveDraft() {
    if (!sheet) return;
    try {
      localStorage.setItem(DRAFT, JSON.stringify({ at: Date.now(), kind: sheetKind, sub: sub, other: sheet.querySelector('.tn-sub-other').value, topic: (sheet.querySelector('.tn-topic') || {}).value || '', audioId: currentAudio && currentAudio.id || '', text: sheet.querySelector('.tn-text').value, sum: sheet.querySelector('.tn-sum').value, gpt: gptSent ? 1 : 0, days: [].slice.call(sheet.querySelectorAll('[data-tn-day]')).filter(function (x) { return x.checked; }).map(function (x) { return Number(x.dataset.tnDay); }) }));
      return true;
    } catch (e) { return false; }
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) {} gptSent = ''; }
  function restoreDraft() {
    if (sheet || isParent() || document.documentElement.classList.contains('pin-locked')) return false;
    var d = ls(DRAFT, null);
    if (!d || d.kind !== 'talk' || !Number.isFinite(d.at) || Date.now() - d.at > 24 * 3600e3 || d.at > Date.now() + 60000 || (!d.text && !d.sum && !d.gpt && !d.audioId)) return false;
    openSheet('talk');
    sub = String(d.sub || '').slice(0, 20);
    var first = null; sheet.querySelectorAll('[data-tn-sub]').forEach(function (x) { var on = !d.other && x.dataset.tnSub === sub && !first; if (on) first = x; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    if (d.other || first && first.closest('.tn-more')) showMore(true);
    sheet.querySelector('.tn-sub-other').value = String(d.other || '').slice(0, 20);
    sheet.querySelector('.tn-topic').value = String(d.topic || '').slice(0, 60);
    if (d.audioId && audioSession) { audioSession.show(d.audioId); var restored = sheet; FC_AUDIO.get(d.audioId).then(function (r) { if (r && sheet === restored) currentAudio = FC_AUDIO.metadata(r); }); }
    sheet.querySelector('.tn-text').value = String(d.text || '').slice(0, 1500); sheet.querySelector('.tn-sum').value = String(d.sum || '').slice(0, 2000);
    if (Array.isArray(d.days)) sheet.querySelectorAll('[data-tn-day]').forEach(function (x) { x.checked = d.days.indexOf(Number(x.dataset.tnDay)) >= 0; });
    if (d.text) sheet.querySelector('.tn-local').open = true;
    gptSent = d.gpt ? '1' : ''; updateHandoff();
    sheet.querySelector('.tn-return').textContent = '쓰던 노트를 되살렸어. ' + (gptSent ? 'ChatGPT 답을 복사해 왔으면 📋 붙여넣기를 눌러줘.' : '이어서 작성해줘.');
    return true;
  }
  function validSummary(text) {
    if (/^\s*\[수업 노트 정리\]/.test(text)) { notice('지금 복사한 건 보낸 요청이야. ChatGPT가 답한 정리를 복사해줘.'); return false; }
    if (text.length > 2000) { notice('정리가 2,000자를 넘었어. ChatGPT에 900자 이내로 줄여 달라고 한 뒤 다시 복사해줘.'); return false; }
    return true;
  }
  function pasteSum() {
    if (!sheet) return;
    var current = sheet, out = sheet.querySelector('.tn-sum'), before = out.value;
    if (!navigator.clipboard || !navigator.clipboard.readText) { out.focus(); notice('정리 칸을 길게 눌러 붙여넣기 해줘.'); return; }
    navigator.clipboard.readText().then(function (t) {
      if (sheet !== current) return;
      t = String(t || '').trim();
      if (!t) { notice('ChatGPT 답을 먼저 복사해 와줘.'); return; }
      if (!validSummary(t)) return;
      if (out.value !== before) { notice('작성 중인 정리는 그대로 뒀어. 붙여넣으려면 📋 버튼을 다시 눌러줘.'); return; }
      if (out.value.trim() && out.value.trim() !== t && !confirm('지금 적은 정리를 복사한 답으로 바꿀까?')) return;
      out.value = t; saveDraft(); sheet.querySelector('.tn-return').textContent = '붙여넣었어. 용어와 확인할 부분을 읽고 저장해줘.';
      out.scrollIntoView({ block: 'center' });
    }).catch(function () { if (sheet === current) { out.focus(); sheet.querySelector('.tn-return').textContent = '정리 칸을 길게 눌러 붙여넣어줘.'; notice('붙여넣기 권한이 없어. 정리 칸을 길게 눌러 붙여넣어줘.'); } });
  }
  document.addEventListener('paste', function (e) {
    if (!sheet || e.target !== sheet.querySelector('.tn-sum') || !e.clipboardData) return;
    var text = e.clipboardData.getData('text');
    if (!validSummary(text)) e.preventDefault();
  });
  document.addEventListener('change', function (e) { if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-tn-auto')) { try { localStorage.setItem('fc-tn-auto', e.target.checked ? '1' : '0'); } catch (x) {} } });
  document.addEventListener('input', function (e) { if (sheet && e.target.closest && e.target.closest('.tn-sheet')) { updateHandoff(); saveDraft(); } });
  function returnHint() {
    if (sheet && gptSent) sheet.querySelector('.tn-return').textContent = sheet.querySelector('.tn-sum').value.trim() ? '쓰던 정리가 남아 있어. 확인하고 저장해줘.' : 'ChatGPT 답을 복사해 왔으면 📋 붙여넣기를 눌러줘.';
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') { stopRec('다른 화면으로 이동해서 말하기를 멈췄어. 인식된 글은 남겨뒀어.'); saveDraft(); return; }
    if (!sheet) restoreDraft(); returnHint();
  });
  window.addEventListener('pagehide', function () { stopRec(); saveDraft(); });
  window.addEventListener('pageshow', returnHint); window.addEventListener('focus', returnHint);
  window.addEventListener('pin-unlocked', function () { setTimeout(restoreDraft, 100); });
  setTimeout(function () { if (document.visibilityState === 'visible') restoreDraft(); }, 1800);
  function canAI() { return window.SHIRO_AI && SHIRO_AI.on && SHIRO_AI.on() && SHIRO_AI.organize; }
  function organizeSheet(auto) {
    if (!sheet) return;
    var ta = sheet.querySelector('.tn-text'), text = ta.value.trim(), box = sheet.querySelector('.tn-sum-box'), out = sheet.querySelector('.tn-sum'), b = sheet.querySelector('[data-tn-org]');
    if (text.length < 15) { if (!auto) notice('정리할 글이 너무 짧아. 사진에서 글자를 먼저 읽거나 조금 더 적어줘.'); return; }
    box.hidden = false;
    if (!canAI()) { out.value = localSum(text); if (!auto) notice('흰둥이 AI가 연결 안 돼서 핵심 후보만 뽑았어. 고쳐서 저장해줘.'); return; }
    b.disabled = true; b.textContent = '🧠 정리하는 중… (최대 1~2분)'; out.value = '';
    SHIRO_AI.organize(sub || '기타', text, sheetKind, today()).then(function (sum) { if (!sheet) return; out.value = sum; notice('정리했어 🧠 고칠 곳 있으면 고쳐서 저장해.'); })
      .catch(function () { if (!sheet) return; out.value = localSum(text); notice('AI 정리가 안 돼서 핵심 후보만 뽑았어.'); })
      .then(function () { if (sheet) { b.disabled = false; b.textContent = '🧠 다시 정리'; } });
  }
  function runOcr() {
    var b = sheet.querySelector('[data-tn-ocr]'), ta = sheet.querySelector('.tn-text'); if (!photoData) return;
    b.disabled = true; b.textContent = '글자 읽는 중… (처음엔 30초쯤)';
    loadScript(OCR.lib, function () { return !!window.Tesseract; }).then(function () {
      return Tesseract.createWorker('kor', 1, { workerPath: OCR.worker, corePath: OCR.core, langPath: OCR.lang });
    }).then(function (w) {
      return w.recognize(photoData).then(function (r) { w.terminate(); return r.data.text || ''; });
    }).then(function (txt) {
      txt = txt.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (sheet) { ta.value = ((ta.value ? ta.value.trim() + '\n' : '') + txt).slice(0, 1500); b.textContent = '🔤 다시 읽기'; b.disabled = false; updateHandoff(); saveDraft(); }
      notice(txt ? '읽은 글자를 넣었어. ① 복습 요청 복사를 눌러줘.' : '글자를 못 읽었어. 핵심만 직접 적어줘.');
    }).catch(function () { if (sheet) { b.disabled = false; b.textContent = '🔤 글자 읽기'; } notice('글자 읽기를 불러오지 못했어. 직접 적어줘.'); });
  }
  function saveNote(kind, onDone) {
    if (audioSession && audioSession.active()) { var waiting = sheet; audioSession.stop().then(function () { if (sheet === waiting && saveNote(kind, onDone) === false) { var control = sheet.querySelector('[data-tn-cloud-new]'); if (control) control.disabled = false; } }); return true; }
    stopRec();
    var ta = sheet.querySelector('.tn-text'), text = ta.value.trim().slice(0, 1500), other = sheet.querySelector('.tn-sub-other').value.trim().slice(0, 20), subject = other || sub || '기타';
    var sum0 = (sheet.querySelector('.tn-sum') || {}).value || '';
    if (!validSummary(sum0.trim())) return false;
    if (kind === 'talk' && text.length < 5 && sum0.trim().length < 5 && !currentAudio) { notice('조금만 더 말하거나 적어줘. (ChatGPT 정리를 붙여넣어도 돼)'); return false; }
    if (kind === 'photo' && !photoData) { notice('사진을 먼저 찍어줘.'); return false; }
    var id = nid(), t = today(), days = [].slice.call(sheet.querySelectorAll('[data-tn-day]')).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.dataset.tnDay); });
    var topic = (sheet.querySelector('.tn-topic') || {}).value || '';
    var first = (topic || text || sum0.replace(/^[^\n]*정리[^\n]*\n/, '').replace(/^[\s\-•]+/, '')).split('\n')[0].slice(0, 40);
    var title = subject + ' · ' + (kind === 'talk' ? '1분 말하기' : '요약 노트') + (first ? ' — ' + first : '');
    var sumEl = sheet.querySelector('.tn-sum'), sum = sumEl && !sheet.querySelector('.tn-sum-box').hidden ? sumEl.value.trim().slice(0, 2000) : '';
    var rv = { id: uid(), title: title.slice(0, 120), date: t, done: false, kind: '과제', subject: subject, note: (sum || text).slice(0, 800) };
    var previousNotes = notes(), a = previousNotes.slice(), entry = { id: id, date: t, at: new Date().toISOString(), kind: kind, subject: subject, topic: topic || undefined, audio: currentAudio || undefined, text: text, sum: sum || undefined, photo: kind === 'photo', review: rv.id }; a.push(entry);
    if (!saveNotes(a)) return false;
    state.reviews.push(rv);
    if (save() === false) { state.reviews.pop(); saveNotes(previousNotes); return false; }
    if (window.FC_PLANNER) {
      var P = FC_PLANNER.get(); P.again[rv.id] = days.map(function (n) { return new Date(Date.parse(t + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); });
      try { localStorage.setItem(FC_PLANNER.KEY, JSON.stringify(P)); }
      catch (e) { delete P.again[rv.id]; state.reviews.pop(); save(); saveNotes(previousNotes); notice('복습 날짜를 저장하지 못했어. 쓰던 내용은 이 화면에 남겼어.'); return false; }
    }
    if (!onDone && !sum && text.length >= 30 && canAI()) SHIRO_AI.organize(subject, text, kind, t).then(function (s2) { var b3 = notes(); b3.forEach(function (n) { if (n.id === id) n.sum = s2.slice(0, 2000); }); saveNotes(b3); if (typeof render === 'function') render(); }).catch(function () {});
    var done = function () { closeSheet(); clearDraft(); notice('기기에 저장했어! ' + (days.length ? '다시 보기 ' + days.map(function (n) { return n === 1 ? '내일' : n + '일 뒤'; }).join('·') + ' 잡아뒀어 🧠' : '')); if (typeof render === 'function') render(); if (onDone) onDone(entry); };
    if (kind === 'photo') {
      var data = photoData;
      putPhoto(id, data).catch(function () { notice('사진을 이 기기에 저장하지 못했어.'); }).then(function () {
        if (typeof FamilySync !== 'undefined' && FamilySync.joined()) FamilySync.call({ action: 'photo-put', id: id, data: data }).then(function (j) { if (!j._ok) { var b2 = notes(); b2.forEach(function (n) { if (n.id === id) n.unsynced = 1; }); saveNotes(b2); } });
        done();
      });
    } else done();
    return true;
  }

  /* ---------- 복습 탭: 수업 노트 목록 ---------- */
  var showN = 6;
  function listCard() {
    var a = notes().slice().reverse();
    var h = '<section class="card tn-list" id="tn-list"><div class="pl-head"><h2>📒 수업 노트</h2>' + (a.length ? '<button type="button" class="pl-mini" data-tn-export>📤 옵시디언용 내보내기</button>' : '') + '</div>';
    if (!a.length) return h + '<p class="muted">아직 노트가 없어. 오늘 탭의 🎙️ 1분 말하기나 📷 노트 사진으로 첫 노트를 남겨봐.</p></section>';
    h += '<ul>' + a.slice(0, showN).map(function (n) {
      return '<li><div class="tn-li-top"><span class="tn-tag ' + n.kind + '">' + (n.kind === 'talk' ? '🎙️' : '📷') + ' ' + esc(n.subject) + '</span><small>' + md(n.date) + '</small>' + (isParent() ? '' : '<button type="button" class="pl-x" data-tn-del="' + esc(n.id) + '" aria-label="노트 지우기">×</button>') + '</div>' +
        (n.photo ? '<button type="button" class="tn-thumb" data-tn-view="' + esc(n.id) + '" data-tn-img="' + esc(n.id) + '" aria-label="사진 크게 보기"></button>' : '') +
        (vjobs().some(function (j) { return j.noteId === n.id; }) ? '<p class="tn-voice-wait small" role="status">🎧 받아쓰기·정리 중… 끝나면 여기에 나와.</p>' : '') +
        (n.cloud && Array.isArray(n.cloud.files) ? n.cloud.files.filter(function (f) { return f.role !== 'audio' && /^https:\/\/drive\.google\.com\//.test(f.url || ''); }).map(function (f) { return '<a class="tn-audio-link" href="' + esc(f.url) + '" target="_blank" rel="noopener">' + (f.role === 'review' ? 'Drive 복습 정리 ↗' : f.role === 'note' ? 'Drive 받아쓰기 ↗' : 'Drive 파일 ↗') + '</a>'; }).join('') : '') +
        (n.audio ? '<button type="button" class="tn-audio-link" data-tn-listen="' + esc(n.audio.id) + '">🎧 녹음 원본 듣기</button>' + (/^https:\/\/drive\.google\.com\//.test(n.audio.driveUrl || '') ? '<a class="tn-audio-link" href="' + esc(n.audio.driveUrl) + '" target="_blank" rel="noopener">Drive 녹음 열기 ↗</a>' : '') : '') +
        (n.sum ? '<div class="tn-sumv">' + esc(n.sum).replace(/\n/g, '<br>') + '</div>' + (n.text ? '<p class="tn-txt tn-raw">' + esc(n.text).replace(/\n/g, '<br>') + '</p><button type="button" class="linkish" data-tn-raw="1">원문 보기</button>' : '') : (n.text ? '<p class="tn-txt">' + esc(n.text).replace(/\n/g, '<br>') + '</p>' : '')) + (window.FC_CHAT_DRIVE ? '<button type="button" class="tn-audio-link" data-tn-cloud="' + esc(n.id) + '">채팅·Drive로 보내기</button>' : '') + '</li>';
    }).join('') + '</ul>' + (a.length > showN ? '<button type="button" class="linkish" data-tn-more>이전 노트 더 보기 (' + (a.length - showN) + ')</button>' : '') + '</section>';
    return h;
  }
  function fillThumbs() {
    document.querySelectorAll('[data-tn-img]').forEach(function (el) {
      var id = el.getAttribute('data-tn-img'); el.removeAttribute('data-tn-img');
      getPhoto(id).then(function (d) { if (d) el.style.backgroundImage = 'url("' + d + '")'; else el.textContent = '사진은 찍은 기기에 있어'; });
    });
  }

  /* ---------- 옵시디언 내보내기 (zip: 노트 .md + 사진) ---------- */
  function slug(s) { return String(s).replace(/[\\/:*?"<>|#^\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }
  function exportZip() {
    var a = notes(); if (!a.length) return;
    notice('내보낼 파일을 만드는 중…');
    loadScript(ZIP, function () { return !!window.JSZip; }).then(function () {
      var z = new JSZip(), jobs = [];
      a.forEach(function (n) {
        var base = n.date + '_' + slug(n.subject) + '_' + (n.kind === 'talk' ? '1분말하기' : '요약노트') + '_' + n.id.slice(0, 4);
        var body = '---\ndate: ' + n.date + '\nsubject: ' + n.subject + '\ntype: ' + (n.kind === 'talk' ? '1분 말하기' : '요약 노트 사진') + '\ntags: [수업노트, ' + slug(n.subject).replace(/\s/g, '') + ']\n---\n\n# ' + n.date + ' ' + n.subject + ' ' + (n.kind === 'talk' ? '1분 말하기' : '요약 노트') + '\n\n';
        if (n.photo) { body += '![[' + base + '.jpg]]\n\n'; jobs.push(getPhoto(n.id).then(function (d) { if (d) z.file('사진/' + base + '.jpg', d.split(',')[1], { base64: true }); })); }
        body += (n.sum ? '## 복습 정리\n\n' + n.sum + '\n\n' : '') + (n.text ? '## 원문\n\n' + n.text + '\n\n' : '') + (n.audio ? '## 녹음 원본\n\n' + n.audio.name + (/^https:\/\/drive\.google\.com\//.test(n.audio.driveUrl || '') ? '\n[Drive에서 열기](' + n.audio.driveUrl + ')' : '\n이 기기의 녹음 보관함에서 확인') + '\n\n' : '') + '## 다시 보기\n- [ ] 내일\n- [ ] 3일 뒤\n- [ ] 7일 뒤\n';
        z.file(slug(n.subject) + '/' + base + '.md', body);
      });
      return Promise.all(jobs).then(function () { return z.generateAsync({ type: 'blob' }); });
    }).then(function (blob) {
      var url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = today() + '_승준_수업노트.zip'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      notice('zip을 받았어. 압축을 풀어 옵시디언 보관함 폴더에 넣으면 돼.');
    }).catch(function () { notice('내보내기를 하지 못했어. 인터넷 연결을 확인해줘.'); });
  }

  window.FC_NOTES = {
    lessons: function () { try { return lessons(); } catch (e) { return []; } },
    get: function (id) { return notes().find(function (n) { return n.id === id; }); }, photo: getPhoto,
    applyCloud: function (id, original, result, jobId, force) {
      if (document.documentElement.classList.contains('pin-locked') || isParent() && window.FC_PLANNER && !FC_PLANNER.get().share.review) return 'failed';
      var a = notes(), pos = a.findIndex(function (n) { return n.id === id; }); if (pos < 0) return 'missing';
      var n = a[pos]; if (n.cloud && n.cloud.jobId === jobId) return 'applied';
      if (!force && JSON.stringify([n.subject || '', n.topic || '', n.text || '', n.sum || '']) !== original) return 'conflict';
      if (!result || !result.value || typeof result.value.summary !== 'string' || result.value.summary.length > 2000) return 'failed';
      var previousNotes = a.slice(), next = Object.assign({}, n, { sum: result.value.summary || n.sum || undefined, cloud: { jobId: jobId, files: result.value.files, at: result.at } });
      if (typeof result.value.transcript === 'string' && result.value.transcript && !n.text) next.text = result.value.transcript.slice(0, 1500);
      var audio = result.value.files.find(function (f) { return f.role === 'audio'; });
      if (audio && n.audio) next.audio = Object.assign({}, n.audio, { driveId: audio.id, driveUrl: audio.url, name: audio.name });
      a[pos] = next; var rv = state.reviews.find(function (x) { return x.id === n.review; }), old = rv && rv.note;
      if (!saveNotes(a)) return 'failed';
      if (rv && (next.sum || next.text)) { rv.note = (next.sum || next.text).slice(0, 800); if (save() === false) { rv.note = old; saveNotes(previousNotes); return 'failed'; } }
      if (audio && n.audio && window.FC_AUDIO && FC_AUDIO.rememberDrive) FC_AUDIO.rememberDrive(n.audio.id, audio);
      if (typeof render === 'function') render(); return 'applied';
    }
  };

  /* ---------- 화면에 끼우기 ---------- */
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content');
    if (tab === 'today') {
      var c = todayCard(); if (c) { var anchor = root.querySelector('.pl-tasks'); if (anchor) anchor.insertAdjacentHTML('afterend', c); else root.insertAdjacentHTML('afterbegin', c); }
    }
    if (tab === 'review' && !(isParent() && window.FC_PLANNER && !FC_PLANNER.get().share.review)) {
      root.insertAdjacentHTML('afterbegin', listCard()); fillThumbs();
    }
  };
  document.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('[data-tn-gpt]');
    if (g && sheet) {
      stopRec(); updateHandoff();
      if (preparedPrompt !== currentPrompt()) { e.preventDefault(); preparePrompt(); return; }
      gptSent = '1';
      if (!saveDraft()) notice('쓰던 내용을 임시 저장하지 못했어. 앱을 닫기 전에 원문을 따로 복사해줘.');
      return; // 사용자가 누른 링크의 기본 동작으로 앱/웹 열기
    }
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (b.hasAttribute('data-tn-copy')) { preparePrompt(); return; }
    if (b.hasAttribute('data-tn-select')) { var request = sheet.querySelector('.tn-prompt'); request.focus(); request.select(); request.setSelectionRange(0, request.value.length); return; }
    if (b.hasAttribute('data-tn-paste')) { pasteSum(); return; }
    if (d.tnOpen) { if (d.tnOpen !== 'talk' || !restoreDraft()) openSheet(d.tnOpen); return; }
    if (b.hasAttribute('data-tn-close')) {
      if ((sheet.querySelector('.tn-text').value || sheet.querySelector('.tn-sum').value || photoData || gptSent || currentAudio || audioSession && audioSession.active()) && !confirm('복습 노트를 저장하지 않고 닫을까? 녹음 원본은 녹음 보관함에 남아 있어.')) return;
      var closing = sheet; (audioSession ? audioSession.stop() : Promise.resolve()).then(function () { if (sheet === closing) { closeSheet(); clearDraft(); } }); return;
    }
    if (b.hasAttribute('data-tn-more')) { showMore(sheet.querySelector('.tn-more').hidden); return; }
    if (d.tnSub) { sub = d.tnSub; sheet.querySelectorAll('[data-tn-sub]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); sheet.querySelector('.tn-sub-other').value = ''; updateHandoff(); saveDraft(); return; }
    if (b.hasAttribute('data-tn-mic')) { if (rec || timer || restart) stopRec('말한 글을 확인하고 잘못 인식된 용어를 고쳐줘.'); else startRec(); return; }
    if (b.hasAttribute('data-tn-pick')) { var f = sheet.querySelector('[data-tn-file]'); f.value = ''; f.click(); return; }
    if (b.hasAttribute('data-tn-ocr')) { runOcr(); return; }
    if (b.hasAttribute('data-tn-org')) { organizeSheet(false); return; }
    if (d.tnRaw) { var li = b.closest('li'); li.classList.toggle('tn-show-raw'); b.textContent = li.classList.contains('tn-show-raw') ? '정리 보기' : '원문 보기'; return; }
    if (d.tnCloudNew && window.FC_CHAT_DRIVE) { b.disabled = true; if (saveNote(d.tnCloudNew, function (n) { FC_CHAT_DRIVE.sendNote(n); }) === false) b.disabled = false; return; }
    if (d.tnCloud && window.FC_CHAT_DRIVE) { var target = notes().find(function (n) { return n.id === d.tnCloud; }); if (target) FC_CHAT_DRIVE.sendNote(target); return; }
    if (d.tnSave) { saveNote(d.tnSave); return; }
    if (d.tnListen && window.FC_AUDIO) { FC_AUDIO.open(d.tnListen); return; }
    if (d.tnDel) { var n = notes().find(function (x) { return x.id === d.tnDel; }); if (n) askDelete(n); return; }
    if (b.hasAttribute('data-tn-delgo')) { doDelete(b); return; }
    if (b.hasAttribute('data-tn-delno')) { var ds = document.querySelector('.tn-delsheet'); if (ds) ds.remove(); return; }
    if (d.tnView) { getPhoto(d.tnView).then(function (src) { if (!src) return; var v = document.createElement('div'); v.className = 'pf-dlg tn-viewer'; v.innerHTML = '<img src="' + src + '" alt="노트 사진"><button type="button" class="pf-cancel">닫기</button>'; document.body.appendChild(v); v.addEventListener('click', function () { v.remove(); }); }); return; }
    if (b.hasAttribute('data-tn-more')) { showN += 10; render(); return; }
    if (b.hasAttribute('data-tn-export')) { exportZip(); return; }
  });
  document.addEventListener('change', function (e) {
    var f = e.target; if (!f.matches || !f.matches('[data-tn-file]') || !f.files[0]) return;
    shrinkPhoto(f.files[0]).then(function (data) {
      photoData = data;
      var pv = sheet.querySelector('[data-tn-preview]'); pv.innerHTML = '<img src="' + data + '" alt="노트 사진 미리보기"><button type="button" data-tn-pick>다시 찍기</button>';
      sheet.querySelector('.tn-ocr-row').hidden = false;
    }).catch(function () { notice('사진을 열지 못했어. 다시 찍어줘.'); });
  });
  document.addEventListener('input', function (e) { if (sheet && e.target.classList && e.target.classList.contains('tn-sub-other') && e.target.value) sheet.querySelectorAll('[data-tn-sub]').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); }); });
  document.addEventListener('change', function (e) { if (sheet && e.target.matches('[data-tn-day]')) saveDraft(); });
  window.addEventListener('fc-audio-saved', function (e) {
    var r = e.detail, changed = false, a = notes();
    a.forEach(function (n) { if (n.audio && n.audio.id === r.id) { n.audio = r; changed = true; } });
    if (changed) saveNotes(a);
    if (currentAudio && currentAudio.id === r.id) { currentAudio = r; saveDraft(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!sheet) return;
      if (document.documentElement.classList.contains('fc-drive-picker-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); sheet.querySelector('[data-tn-close]').click(); return; }
    if (e.key !== 'Tab') return;
    var focusable = [].slice.call(sheet.querySelectorAll('button:not(:disabled),a[href],input,textarea,summary')).filter(function (x) { return x.getClientRects().length; });
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !sheet.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });

  var css = document.createElement('style');
  css.textContent =
    '.tn-card.tn-hot{box-shadow:none!important;outline:2px solid var(--u-line)!important;outline-offset:0px!important}.tn-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.tn-btns button{min-height:50px!important;font-weight:700}' +
    'html.tn-open{overflow:hidden}.tn-sheet{position:fixed;inset:0;z-index:1100;background:color-mix(in srgb,var(--u-solid) 45%,transparent);display:flex;align-items:flex-end;justify-content:center}' +
    '.tn-panel{background:var(--u-surface);width:min(560px,100%);max-height:94dvh;overflow:auto;border-radius:22px 22px 0 0;padding:12px 16px calc(16px + env(safe-area-inset-bottom,0px))}' +
    '.tn-top{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;text-align:center;font-size:17px;margin-bottom:6px}.tn-x{min-height:40px!important;width:40px;padding:0!important;border:0!important;background:transparent!important;font-size:20px}' +
    '.tn-l{display:block;font-size:13.5px!important;margin:10px 0 4px!important}.tn-subs input{width:120px!important;min-height:32px!important;padding:4px 10px!important;border-radius:999px!important;font-size:13.5px}' +
    '.tn-rec{background:var(--u-soft);border-radius:16px;padding:12px;text-align:center;margin-top:8px}.tn-guide{list-style:none;margin:0 0 6px;padding:0;font-size:13.5px;color:var(--ink-2);display:grid;gap:2px;text-align:left}.tn-clock{font:800 42px/1 system-ui;color:var(--accent-ink);margin:6px 0}.tn-live{min-height:1.2em;margin:0}' +
    '.tn-mic{min-width:160px;min-height:52px!important;border-radius:999px!important;font-size:17px}.tn-mic.on{background:var(--exam)!important;border-color:var(--exam)!important;animation:tnPulse 1.2s infinite}@keyframes tnPulse{50%{box-shadow:none;outline:8px solid color-mix(in srgb,var(--exam) 20%,transparent);outline-offset:0px}}' +
    '.tn-text{width:100%;font-size:15px;line-height:1.6}.tn-again{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0;font-size:13.5px;color:var(--ink-3)}.tn-again label{display:flex!important;gap:4px;align-items:center;margin:0!important;font-weight:500!important}.tn-again input{width:18px;min-height:18px}' +
    '.tn-save-row button{width:100%;min-height:50px!important;font-size:17px}' +
    '.tn-photo{margin-top:8px}.tn-preview{border:2px dashed var(--u-line);border-radius:16px;min-height:140px;display:grid;place-items:center;gap:8px;padding:10px}.tn-preview img{max-width:100%;max-height:42dvh;border-radius:12px}.tn-ocr-row{margin:8px 0 0}' +
    '.tn-list ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}.tn-list li{border:1px solid var(--u-line);border-radius:12px;padding:10px 12px}.tn-li-top{display:flex;align-items:center;gap:8px}.tn-li-top small{flex:1;color:var(--ink-3)}.tn-tag{font-size:12.5px;font-weight:700;background:var(--u-soft);color:var(--accent-ink);border-radius:999px;padding:3px 9px}.tn-tag.photo{background:var(--u-soft);color:var(--accent-ink)}' +
    '.tn-thumb{display:block;width:100%;height:140px;margin:8px 0 0;border-radius:12px;background:var(--u-soft) center/cover no-repeat;border:0!important;font-size:12.5px;color:var(--ink-3)}.tn-txt{margin:8px 0 0;font-size:15px;line-height:1.6;white-space:normal;max-height:9.6em;overflow:hidden}' +
    '.tn-gpt{display:block;margin-top:8px;padding:10px 12px;border:1px solid var(--u-line);border-radius:12px;background:var(--u-surface);color:var(--accent-ink);font-weight:700;text-decoration:none;text-align:center;min-height:46px}.tn-gpt small{display:block;font-weight:500;color:var(--ink-3);font-size:12.5px}.tn-paste-row{margin:0 0 6px}.tn-gpt-main{display:block;margin:12px 0 8px;padding:14px;border-radius:999px;background:var(--accent);color:var(--u-on-solid)!important;font-weight:800;font-size:17px;text-align:center;text-decoration:none;min-height:52px}.tn-steps{margin:0 0 8px;padding-left:20px;text-align:left;font-size:13.5px;line-height:1.6;color:var(--ink)}.tn-alt{margin-top:6px;text-align:left}.tn-alt summary{cursor:pointer;font-size:13.5px;color:var(--ink-3);padding:6px 0}.tn-alt .tn-clock{font-size:30px}.tn-better{margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--u-surface);border:1px solid var(--u-line);text-align:left}.tn-better>b{font-size:13.5px}.tn-better .tn-gpt{margin:8px 0}.tn-warn{margin:8px 0 0;font-size:13.5px;color:var(--warn-ink);background:var(--u-soft);border-radius:12px;padding:8px 10px;text-align:left}.tn-paste-row button{width:100%;min-height:44px!important;font-weight:700;background:var(--u-soft)!important;border:1px dashed var(--u-line)!important;color:var(--accent-ink)!important}.tn-sum{width:100%;font-size:15px;line-height:1.6;background:var(--u-soft)}.tn-sumv{margin:8px 0 0;font-size:15px;line-height:1.65;background:var(--u-soft);border-radius:12px;padding:10px 12px}.tn-raw{display:none}.tn-show-raw .tn-raw{display:block}.tn-show-raw .tn-sumv{display:none}' +
    '.tn-viewer img{max-width:100%;max-height:85dvh;border-radius:12px}.tn-viewer{flex-direction:column;gap:10px}' +
    '.tn-panel{box-sizing:border-box;overscroll-behavior:contain}.tn-panel .tn-x{width:var(--tap);min-height:var(--tap)!important}.tn-top{grid-template-columns:var(--tap) 1fr var(--tap)}.tn-sheet .tn-subs input{min-height:var(--tap)!important}.tn-sheet button,.tn-sheet summary,.tn-sheet a{min-height:var(--tap)}.tn-sheet summary{cursor:pointer;display:flex;align-items:center;font-size:var(--fs-s);line-height:1.6}.tn-sheet :is(button,a,input,textarea,summary):focus-visible{outline:3px solid var(--accent);outline-offset:2px}' +
    '.tn-rec>b{font-size:var(--fs-m)}.tn-rec .tn-guide{margin:8px 0;line-height:1.6}.tn-rec p{margin-bottom:0}.tn-local{margin:10px 0}.tn-clock{font-size:var(--fs-3xl)}.tn-mic.on{color:var(--u-on-solid,#fff)!important}.tn-handoff{margin:12px 0;padding:12px;border:1px solid var(--u-line);border-radius:var(--r-m);background:var(--u-soft)}.tn-handoff>b{font-size:var(--fs-m)}.tn-handoff p{line-height:1.6}.tn-handoff [data-tn-copy]{width:100%;min-height:50px;font-weight:700}.tn-handoff .tn-gpt-main{margin-bottom:0;box-sizing:border-box}.tn-transfer-status{color:var(--ink-2);margin:8px 0 0}.tn-prompt{width:100%;box-sizing:border-box;font-size:var(--fs-s);line-height:1.6}.tn-return:empty{display:none}.tn-return{color:var(--ink-2);line-height:1.6}.tn-again label{min-height:var(--tap)}.tn-text,.tn-sum{box-sizing:border-box}.tn-sum{scroll-margin:16px}.tn-local .tn-mic{width:100%}.tn-topic{width:100%;min-height:var(--tap);box-sizing:border-box;font-size:var(--fs-m)}.tn-audio-link{display:flex;align-items:center;justify-content:center;min-height:var(--tap);margin-top:8px}' +
    '.tn-ls-sum{margin:0 0 8px;color:var(--ink-2)}.tn-lessons{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px}' +
    '.tn-ls{display:grid!important;gap:2px;justify-items:start;text-align:left;min-height:64px!important;padding:8px 10px!important;border:1px solid var(--u-line)!important;border-radius:12px!important;background:var(--u-surface)!important;color:var(--ink)!important;font-weight:500}' +
    '.tn-ls small{font-size:12.5px;color:var(--ink-3)}.tn-ls b{font-size:15px}.tn-ls em{font-style:normal;font-size:12.5px;font-weight:700;color:var(--ink-3)}' +
    '.tn-ls.st-past em{color:var(--warn-ink)}.tn-ls.fresh em,.tn-ls.st-now em{color:var(--accent-ink)}.tn-ls.st-done em{color:var(--ok-ink)}.tn-ls.st-done b{color:var(--ink-2)}' +
    '.tn-ls.on{border:2px solid var(--accent)!important;background:var(--u-soft)!important;padding:7px 9px!important}' +
    '.tn-more-btn{display:block;width:100%;margin:8px 0 0;min-height:var(--tap);border:1px dashed var(--u-line)!important;background:transparent!important;color:var(--accent-ink)!important;border-radius:12px!important;font-weight:700;font-size:13.5px}.tn-more{margin-top:8px}.tn-more[hidden]{display:none!important}' +
    '.tn-del-title{font-size:17px;display:block;margin:4px 0}.tn-del-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.tn-del-row button{min-height:var(--tap)}.tn-del-go{background:var(--exam)!important;border-color:var(--exam)!important;color:var(--u-on-solid,#fff)!important;font-weight:800}.tn-voice-wait{margin:8px 0 0;color:var(--accent-ink);font-weight:700}.tn-next{margin:4px 0 6px;color:var(--accent-ink)}.tn-auto{display:flex!important;align-items:center;gap:8px;min-height:var(--tap);margin:4px 0 8px!important;font-size:13.5px;font-weight:600!important;color:var(--ink-2)}.tn-auto input{width:22px;height:22px;min-height:22px}' +
    '@media(prefers-reduced-motion:reduce){.tn-mic.on{animation:none}}';
  document.head.appendChild(css);
  if (typeof render === 'function') render();
})();
