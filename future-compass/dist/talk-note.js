/* 수업 노트: 🎙️ 1분 말하기 + 📷 요약 노트 사진
   - 말하기: 폰 받아쓰기(Web Speech)로 글자로 바꿔 저장. 소리 파일은 저장하지 않음
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
  function delPhoto(id) { return idb().then(function (db) { db.transaction('p', 'readwrite').objectStore('p').delete(id); }).catch(function () {}); }
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

  /* ---------- 오늘 탭 카드 ---------- */
  function todayCard() {
    if (isParent()) return '';
    var n = notes().filter(function (x) { return x.date === today(); });
    var hour = new Date(Date.now() + 9 * 3600000).getUTCHours();
    return '<section class="card tn-card' + (hour >= 15 && !n.length ? ' tn-hot' : '') + '"><div class="pl-head"><h2>📒 오늘 배운 것 남기기</h2>' + (n.length ? '<span class="pl-count">오늘 ' + n.length + '개</span>' : '') + '</div>' +
      '<p class="muted small">수업 끝나고 1분 — 내 말로 말하거나 요약 노트를 찍어두면 내일·3일·7일 뒤에 다시 보여줘.</p>' +
      '<div class="tn-btns"><button type="button" class="primary" data-tn-open="talk">🎙️ 1분 말하기</button><button type="button" data-tn-open="photo">📷 노트 사진</button></div></section>';
  }

  /* ---------- 시트(전체 화면) ---------- */
  var sheet = null, sub = '', rec = null, timer = null, left = 60, finalText = '', photoData = '';
  function closeSheet() { stopRec(); if (sheet) sheet.remove(); sheet = null; photoData = ''; finalText = ''; }
  function openSheet(kind) {
    closeSheet(); sub = subjects()[0] || '';
    sheet = document.createElement('div'); sheet.className = 'tn-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', kind === 'talk' ? '1분 말하기' : '노트 사진');
    sheet.innerHTML = '<div class="tn-panel"><div class="tn-top"><button type="button" class="tn-x" data-tn-close aria-label="닫기">✕</button><b>' + (kind === 'talk' ? '🎙️ 1분 말하기' : '📷 요약 노트 사진') + '</b><span></span></div>' +
      '<label class="tn-l">과목</label><div class="pl-chips tn-subs">' + subjects().map(function (x, i) { return '<button type="button" data-tn-sub="' + esc(x) + '" class="' + (i === 0 ? 'on' : '') + '">' + esc(x) + '</button>'; }).join('') + '<input class="tn-sub-other" maxlength="20" placeholder="다른 과목"></div>' +
      (kind === 'talk' ? talkBody() : photoBody()) +
      '<label class="tn-l">메모 <small class="muted">(헷갈린 것·선생님 강조·시험 나올 것)</small></label><textarea class="tn-text" rows="5" maxlength="1500" placeholder="' + (kind === 'talk' ? '말한 내용이 여기 적혀. 틀린 글자는 고쳐도 돼.' : '사진 속 핵심을 한두 줄 적거나, 글자 읽기를 눌러봐.') + '"></textarea>' +
      '<div class="tn-again"><span>다시 보기</span><label><input type="checkbox" checked data-tn-day="1"> 내일</label><label><input type="checkbox" checked data-tn-day="3"> 3일 뒤</label><label><input type="checkbox" checked data-tn-day="7"> 7일 뒤</label></div>' +
      '<p class="tn-save-row"><button type="button" class="primary" data-tn-save="' + kind + '">저장</button></p></div>';
    document.body.appendChild(sheet);
    document.documentElement.classList.add('tn-open');
  }
  function talkBody() {
    if (!SR) return '<div class="tn-rec"><p class="muted">이 브라우저는 바로 받아쓰기가 안 돼. 아래 메모 칸을 누르고 <b>키보드의 🎤 마이크 버튼</b>으로 말해줘.</p><ul class="tn-guide"><li>① 오늘 배운 핵심 한 가지</li><li>② 헷갈렸던 것</li><li>③ 시험에 나올 것 같은 것</li></ul></div>';
    return '<div class="tn-rec"><ul class="tn-guide"><li>① 오늘 배운 핵심 한 가지</li><li>② 헷갈렸던 것</li><li>③ 시험에 나올 것 같은 것</li></ul>' +
      '<div class="tn-clock" aria-live="polite">1:00</div><p class="tn-live muted small"></p>' +
      '<p><button type="button" class="primary tn-mic" data-tn-mic>● 말하기 시작</button></p><p class="muted small">소리는 저장하지 않고 글자만 남겨.</p></div>';
  }
  function photoBody() {
    return '<div class="tn-photo"><input type="file" accept="image/*" capture="environment" hidden data-tn-file>' +
      '<div class="tn-preview" data-tn-preview><button type="button" data-tn-pick>📷 찍기 / 사진 고르기</button></div>' +
      '<p class="tn-ocr-row" hidden><button type="button" data-tn-ocr>🔤 글자 읽기 (손글씨는 잘 안 될 수 있어)</button></p></div>';
  }
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function stopRec() { if (timer) { clearInterval(timer); timer = null; } if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } var b = sheet && sheet.querySelector('[data-tn-mic]'); if (b) { b.textContent = finalText ? '● 이어서 말하기' : '● 말하기 시작'; b.classList.remove('on'); } }
  function startRec() {
    var ta = sheet.querySelector('.tn-text'), live = sheet.querySelector('.tn-live'), clock = sheet.querySelector('.tn-clock'), b = sheet.querySelector('[data-tn-mic]');
    finalText = ta.value ? ta.value.trim() + ' ' : '';
    left = 60; clock.textContent = fmt(left);
    try { rec = new SR(); } catch (e) { notice('마이크를 쓸 수 없어. 키보드 🎤로 말해줘.'); return; }
    rec.lang = 'ko-KR'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) finalText += r[0].transcript.trim() + ' '; else interim += r[0].transcript; }
      ta.value = finalText.trim(); live.textContent = interim;
    };
    rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { notice('마이크 권한이 꺼져 있어. 브라우저 설정에서 마이크를 허용해줘.'); stopRec(); } };
    rec.onend = function () { if (timer && rec) { try { rec.start(); } catch (e) {} } };   // 폰에서 중간에 끊기면 이어서
    try { rec.start(); } catch (e) { notice('마이크를 시작하지 못했어.'); return; }
    b.textContent = '■ 그만'; b.classList.add('on');
    timer = setInterval(function () { left--; clock.textContent = fmt(Math.max(0, left)); if (left <= 0) { stopRec(); live.textContent = ''; notice('1분 끝! 내용 확인하고 저장해줘.'); } }, 1000);
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
      if (sheet) { ta.value = (ta.value ? ta.value.trim() + '\n' : '') + txt.slice(0, 1400); b.textContent = '🔤 다시 읽기'; b.disabled = false; }
      notice(txt ? '읽은 글자를 메모에 넣었어. 틀린 건 고쳐줘.' : '글자를 못 읽었어. 핵심만 직접 적어줘.');
    }).catch(function () { if (sheet) { b.disabled = false; b.textContent = '🔤 글자 읽기'; } notice('글자 읽기를 불러오지 못했어. 직접 적어줘.'); });
  }
  function saveNote(kind) {
    var ta = sheet.querySelector('.tn-text'), text = ta.value.trim().slice(0, 1500), other = sheet.querySelector('.tn-sub-other').value.trim().slice(0, 20), subject = other || sub || '기타';
    if (kind === 'talk' && text.length < 5) { notice('조금만 더 말하거나 적어줘.'); return; }
    if (kind === 'photo' && !photoData) { notice('사진을 먼저 찍어줘.'); return; }
    stopRec();
    var id = nid(), t = today(), days = [].slice.call(sheet.querySelectorAll('[data-tn-day]')).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.dataset.tnDay); });
    var first = text.split('\n')[0].slice(0, 40);
    var title = subject + ' · ' + (kind === 'talk' ? '1분 말하기' : '요약 노트') + (first ? ' — ' + first : '');
    var rv = { id: uid(), title: title.slice(0, 120), date: t, done: false, kind: '과제', subject: subject, note: text.slice(0, 800) };
    state.reviews.push(rv); save();
    if (window.FC_PLANNER) { var P = FC_PLANNER.get(); P.again[rv.id] = days.map(function (n) { return new Date(Date.parse(t + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }); try { localStorage.setItem(FC_PLANNER.KEY, JSON.stringify(P)); } catch (e) {} }
    var a = notes(); a.push({ id: id, date: t, at: new Date().toISOString(), kind: kind, subject: subject, text: text, photo: kind === 'photo', review: rv.id }); saveNotes(a);
    var done = function () { closeSheet(); document.documentElement.classList.remove('tn-open'); notice('저장했어! ' + (days.length ? '다시 보기 ' + days.map(function (n) { return n === 1 ? '내일' : n + '일 뒤'; }).join('·') + ' 잡아뒀어 🧠' : '')); if (typeof render === 'function') render(); };
    if (kind === 'photo') {
      var data = photoData;
      putPhoto(id, data).catch(function () { notice('사진을 이 기기에 저장하지 못했어.'); }).then(function () {
        if (typeof FamilySync !== 'undefined' && FamilySync.joined()) FamilySync.call({ action: 'photo-put', id: id, data: data }).then(function (j) { if (!j._ok) { var b2 = notes(); b2.forEach(function (n) { if (n.id === id) n.unsynced = 1; }); saveNotes(b2); } });
        done();
      });
    } else done();
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
        (n.text ? '<p class="tn-txt">' + esc(n.text).replace(/\n/g, '<br>') + '</p>' : '') + '</li>';
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
        body += (n.text || '') + '\n\n## 다시 보기\n- [ ] 내일\n- [ ] 3일 뒤\n- [ ] 7일 뒤\n';
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
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.tnOpen) { openSheet(d.tnOpen); return; }
    if (b.hasAttribute('data-tn-close')) { if ((sheet.querySelector('.tn-text').value || photoData) && !confirm('저장하지 않고 닫을까?')) return; closeSheet(); document.documentElement.classList.remove('tn-open'); return; }
    if (d.tnSub) { sub = d.tnSub; sheet.querySelectorAll('[data-tn-sub]').forEach(function (x) { x.classList.toggle('on', x === b); }); sheet.querySelector('.tn-sub-other').value = ''; return; }
    if (b.hasAttribute('data-tn-mic')) { if (timer) { stopRec(); sheet.querySelector('.tn-live').textContent = ''; } else startRec(); return; }
    if (b.hasAttribute('data-tn-pick')) { var f = sheet.querySelector('[data-tn-file]'); f.value = ''; f.click(); return; }
    if (b.hasAttribute('data-tn-ocr')) { runOcr(); return; }
    if (d.tnSave) { saveNote(d.tnSave); return; }
    if (d.tnDel) { var n = notes().find(function (x) { return x.id === d.tnDel; }); if (n && confirm('이 노트를 지울까? (복습 메모는 남아)')) { saveNotes(notes().filter(function (x) { return x.id !== n.id; })); if (n.photo) delPhoto(n.id); render(); } return; }
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
  document.addEventListener('input', function (e) { if (e.target.classList && e.target.classList.contains('tn-sub-other') && e.target.value) sheet.querySelectorAll('[data-tn-sub]').forEach(function (x) { x.classList.remove('on'); }); });

  var css = document.createElement('style');
  css.textContent =
    '.tn-card.tn-hot{box-shadow:0 0 0 2px #cfc6ff!important}.tn-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.tn-btns button{min-height:50px!important;font-weight:700}' +
    'html.tn-open{overflow:hidden}.tn-sheet{position:fixed;inset:0;z-index:1100;background:rgba(20,16,50,.45);display:flex;align-items:flex-end;justify-content:center}' +
    '.tn-panel{background:#fff;width:min(560px,100%);max-height:94dvh;overflow:auto;border-radius:22px 22px 0 0;padding:12px 16px calc(16px + env(safe-area-inset-bottom,0px))}' +
    '.tn-top{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;text-align:center;font-size:16px;margin-bottom:6px}.tn-x{min-height:40px!important;width:40px;padding:0!important;border:0!important;background:transparent!important;font-size:18px}' +
    '.tn-l{display:block;font-size:13px!important;margin:10px 0 4px!important}.tn-subs input{width:120px!important;min-height:32px!important;padding:4px 10px!important;border-radius:999px!important;font-size:13px}' +
    '.tn-rec{background:#f7f5ff;border-radius:16px;padding:12px;text-align:center;margin-top:8px}.tn-guide{list-style:none;margin:0 0 6px;padding:0;font-size:13.5px;color:#4a475c;display:grid;gap:2px;text-align:left}.tn-clock{font:800 42px/1 system-ui;color:#5b45d6;margin:6px 0}.tn-live{min-height:1.2em;margin:0}' +
    '.tn-mic{min-width:160px;min-height:52px!important;border-radius:999px!important;font-size:16px}.tn-mic.on{background:#e04a6a!important;border-color:#e04a6a!important;animation:tnPulse 1.2s infinite}@keyframes tnPulse{50%{box-shadow:0 0 0 8px rgba(224,74,106,.2)}}' +
    '.tn-text{width:100%;font-size:15px;line-height:1.6}.tn-again{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0;font-size:13px;color:#6b6880}.tn-again label{display:flex!important;gap:4px;align-items:center;margin:0!important;font-weight:500!important}.tn-again input{width:18px;min-height:18px}' +
    '.tn-save-row button{width:100%;min-height:50px!important;font-size:16px}' +
    '.tn-photo{margin-top:8px}.tn-preview{border:2px dashed #d9d3ee;border-radius:16px;min-height:140px;display:grid;place-items:center;gap:8px;padding:10px}.tn-preview img{max-width:100%;max-height:42dvh;border-radius:10px}.tn-ocr-row{margin:8px 0 0}' +
    '.tn-list ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}.tn-list li{border:1px solid #efedf5;border-radius:14px;padding:10px 12px}.tn-li-top{display:flex;align-items:center;gap:8px}.tn-li-top small{flex:1;color:#8a879a}.tn-tag{font-size:12.5px;font-weight:700;background:#f0edff;color:#5b45d6;border-radius:999px;padding:3px 9px}.tn-tag.photo{background:#e8f4ff;color:#2a6aa8}' +
    '.tn-thumb{display:block;width:100%;height:140px;margin:8px 0 0;border-radius:10px;background:#f4f3f8 center/cover no-repeat;border:0!important;font-size:12px;color:#8a879a}.tn-txt{margin:8px 0 0;font-size:14px;line-height:1.6;white-space:normal;max-height:9.6em;overflow:hidden}' +
    '.tn-viewer img{max-width:100%;max-height:85dvh;border-radius:12px}.tn-viewer{flex-direction:column;gap:10px}';
  document.head.appendChild(css);
  if (typeof render === 'function') render();
})();
