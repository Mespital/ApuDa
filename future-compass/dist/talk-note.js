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

  /* ---------- 오늘 탭 카드 ---------- */
  function todayCard() {
    if (isParent()) return '';
    var n = notes().filter(function (x) { return x.date === today(); });
    var hour = new Date(Date.now() + 9 * 3600000).getUTCHours();
    return '<section class="card tn-card' + (hour >= 15 && !n.length ? ' tn-hot' : '') + '"><div class="pl-head"><h2>📒 오늘 배운 것 남기기</h2>' + (n.length ? '<span class="pl-count">오늘 ' + n.length + '개</span>' : '') + '</div>' +
      '<p class="muted small">수업 끝나고 1분 — 교과서·필기 사진을 찍거나 말로 남기면 🧠 핵심·용어·확인 질문으로 정리해서 복습과 다음 수업 전에 보여줘.</p>' +
      '<div class="tn-btns"><button type="button" class="primary" data-tn-open="talk">🎙️ 1분 말하기</button><button type="button" data-tn-open="photo">📷 교과서·노트 사진</button></div></section>';
  }

  /* ---------- 시트(전체 화면) ---------- */
  var sheet = null, sub = '', rec = null, timer = null, left = 60, finalText = '', photoData = '';
  var sheetKind = 'photo';
  function closeSheet() { stopRec(); if (sheet) sheet.remove(); sheet = null; photoData = ''; finalText = ''; }
  function openSheet(kind) {
    closeSheet(); sub = subjects()[0] || ''; sheetKind = kind;
    sheet = document.createElement('div'); sheet.className = 'tn-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', kind === 'talk' ? '1분 말하기' : '노트 사진');
    sheet.innerHTML = '<div class="tn-panel"><div class="tn-top"><button type="button" class="tn-x" data-tn-close aria-label="닫기">✕</button><b>' + (kind === 'talk' ? '🎙️ 1분 말하기' : '📷 요약 노트 사진') + '</b><span></span></div>' +
      '<label class="tn-l">과목</label><div class="pl-chips tn-subs">' + subjects().map(function (x, i) { return '<button type="button" data-tn-sub="' + esc(x) + '" class="' + (i === 0 ? 'on' : '') + '">' + esc(x) + '</button>'; }).join('') + '<input class="tn-sub-other" maxlength="20" placeholder="다른 과목"></div>' +
      (kind === 'talk' ? talkBody() : photoBody()) +
      (kind === 'talk'
        ? '<label class="tn-l">📝 녹음 내용 <small class="muted">(선택 — 녹음기 앱의 글자 변환을 붙여넣으면 ChatGPT에 같이 들어가. 비워두면 ChatGPT에서 🎤로 말하면 돼)</small></label><textarea class="tn-text" rows="5" maxlength="1500" placeholder="녹음 텍스트 붙여넣기 (선택)"></textarea>'
        : '<label class="tn-l">메모 <small class="muted">(헷갈린 것·선생님 강조·시험 나올 것)</small></label><textarea class="tn-text" rows="5" maxlength="1500" placeholder="사진 속 핵심을 한두 줄 적거나, 글자 읽기를 눌러봐."></textarea>') +
      '<a class="tn-gpt-main" data-tn-gpt href="https://chatgpt.com/" target="_blank" rel="noopener">💬 ChatGPT에 보내기</a>' +
      '<ol class="tn-steps"><li>ChatGPT가 열리면 정리 규칙(채팅으로 답하기 포함)이 들어가 있어. ' + (kind === 'talk' ? '녹음 내용을 안 넣었으면 <b>🎤로 말하거나 붙여넣고</b> 보내기' : '그대로 <b>보내기</b>') + '</li><li>정리된 답을 <b>복사</b> → 여기로 돌아오면 자동으로 붙여넣기</li><li><b>저장</b> → 내일·3일·7일 복습</li></ol>' +
      '<div class="tn-sum-box"><label class="tn-l">🧠 정리 <small class="muted">(ChatGPT 정리를 붙여넣거나 직접 써. 저장하면 복습에 들어가)</small></label>' +
      '<p class="tn-paste-row"><button type="button" data-tn-paste>📋 복사한 정리 붙여넣기</button></p>' +
      '<textarea class="tn-sum" rows="8" maxlength="2000" placeholder="ChatGPT 답을 길게 눌러 복사 → 여기를 길게 눌러 붙여넣기 (또는 위 📋 버튼)"></textarea></div>' +
      '<div class="tn-again"><span>다시 보기</span><label><input type="checkbox" checked data-tn-day="1"> 내일</label><label><input type="checkbox" checked data-tn-day="3"> 3일 뒤</label><label><input type="checkbox" checked data-tn-day="7"> 7일 뒤</label></div>' +
      '<p class="tn-save-row"><button type="button" class="primary" data-tn-save="' + kind + '">저장</button></p></div>';
    document.body.appendChild(sheet);
    document.documentElement.classList.add('tn-open');
  }
  function talkBody() {
    // ChatGPT에 넣는 것만: 무엇을 말할지 안내 (받아쓰기·정리는 ChatGPT가)
    return '<div class="tn-rec"><p class="tn-l" style="margin:0 0 4px">이렇게 말해봐</p><ul class="tn-guide"><li>① 오늘 배운 핵심 한 가지</li><li>② 헷갈렸던 것</li><li>③ 시험에 나올 것 같은 것</li></ul></div>';
  }
  function photoBody() {
    return '<div class="tn-photo"><input type="file" accept="image/*" capture="environment" hidden data-tn-file>' +
      '<div class="tn-preview" data-tn-preview><button type="button" data-tn-pick>📷 찍기 / 사진 고르기</button></div>' +
      '<p class="tn-ocr-row" hidden><button type="button" data-tn-ocr>🔤 글자 읽기 (손글씨는 잘 안 될 수 있어)</button></p></div>';
  }
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function stopRec() { if (timer) { clearInterval(timer); timer = null; } if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } var b = sheet && sheet.querySelector('[data-tn-mic]'); if (b) { b.textContent = finalText ? '● 이어서 말하기' : '● 말하기 시작'; b.classList.remove('on'); } }
  /* 🎙️ 받아쓰기 정리 — 안드로이드 크롬은 연속 인식에서 앞 문장을 계속 다시 보내(누적) 같은 말이 반복되는 문제가 있어
     ① 결과는 매번 처음부터 다시 조립 ② 앞 문장을 포함한 새 문장은 '교체' ③ 연달아 반복된 어구는 하나로 */
  var isAndroid = /Android/i.test(navigator.userAgent || '');
  function nrm(x) { return String(x).replace(/\s+/g, '').toLowerCase(); }
  function mergeFinals(list) {
    var out = [];
    list.forEach(function (t) {
      t = String(t || '').trim(); if (!t) return;
      var last = out.length ? out[out.length - 1] : '';
      if (last && nrm(t).indexOf(nrm(last)) >= 0) out[out.length - 1] = t;         // 누적 결과(앞 문장을 품은 새 문장) → 바꿔치기
      else if (last && nrm(last).indexOf(nrm(t)) >= 0) return;                      // 이미 들어간 말 → 건너뛰기
      else out.push(t);
    });
    return out.join(' ');
  }
  function dedupeRuns(text) {
    var w = String(text).split(/\s+/).filter(Boolean), changed = true, guard = 0;
    while (changed && guard++ < 50) {
      changed = false;
      for (var n = Math.min(8, Math.floor(w.length / 2)); n >= 1 && !changed; n--) {
        for (var i = 0; i + 2 * n <= w.length; i++) {
          var same = true; for (var k = 0; k < n; k++) if (w[i + k] !== w[i + n + k]) { same = false; break; }
          if (same) { w.splice(i + n, n); changed = true; break; }
        }
      }
    }
    // 같은 문장이 통째로 두 번 들어간 경우(띄어쓰기 달라도)
    return w.join(' ');
  }
  function startRec() {
    var ta = sheet.querySelector('.tn-text'), live = sheet.querySelector('.tn-live'), clock = sheet.querySelector('.tn-clock'), b = sheet.querySelector('[data-tn-mic]');
    var committed = ta.value ? ta.value.trim() : '';
    finalText = committed;
    left = 60; clock.textContent = fmt(left);
    function begin() {
      try { rec = new SR(); } catch (e) { notice('마이크를 쓸 수 없어. 키보드의 🎤 음성 입력으로 말해줘.'); return false; }
      rec.lang = 'ko-KR'; rec.continuous = !isAndroid; rec.interimResults = true; rec.maxAlternatives = 1;   // 안드로이드는 한 문장씩 끊어서 받는 게 정확해
      rec.onresult = function (e) {
        var fin = [], interim = '';
        for (var i = 0; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) fin.push(r[0].transcript); else interim = r[0].transcript; }
        var sess = mergeFinals(fin);
        finalText = dedupeRuns(mergeFinals([committed, sess]));
        ta.value = finalText; live.textContent = interim;
      };
      rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { notice('마이크 권한이 꺼져 있어. 브라우저 설정에서 마이크를 허용해줘.'); stopRec(); } };
      rec.onend = function () {
        committed = ta.value.trim();   // 이번 문장까지 확정
        if (timer) { try { rec.start(); } catch (e) { setTimeout(function () { if (timer) begin() && rec.start(); }, 250); } }   // 폰에서 끊기면 이어서
      };
      return true;
    }
    if (!begin()) return;
    try { rec.start(); } catch (e) { notice('마이크를 시작하지 못했어.'); return; }
    b.textContent = '■ 그만'; b.classList.add('on');
    timer = setInterval(function () { left--; clock.textContent = fmt(Math.max(0, left)); if (left <= 0) { stopRec(); live.textContent = ''; notice('1분 끝! 내용 확인하고 저장해줘.'); } }, 1000);
  }
  /* 🧠 정리: AI(흰둥이 똑똑 모드)로 핵심·용어·확인 질문·다음 수업 전 볼 것. AI가 없으면 글에서 핵심 후보만 뽑기 */
  function localSum(text) {
    var lines = String(text).split(/\n|(?<=[.?!다])\s+/).map(function (x) { return x.replace(/^[\s•\-·*○●▶▷]+/, '').trim(); }).filter(function (x) { return x.length >= 6; });
    var key = lines.filter(function (x) { return /[:=]|이란|이다|란\s|뜻|정의|원리|법칙|특징/.test(x); }).concat(lines).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 4);
    var terms = []; lines.forEach(function (x) { var m = /^([가-힣A-Za-z0-9 ]{2,14})\s*[:=]\s*(.{4,60})/.exec(x); if (m && terms.length < 5) terms.push('- ' + m[1].trim() + ': ' + m[2].trim()); });
    return '📌 핵심 정리 (자동 추출 — 틀린 곳은 고쳐줘)\n' + key.map(function (x) { return '- ' + x.slice(0, 80); }).join('\n') + (terms.length ? '\n🔑 꼭 알아야 할 용어\n' + terms.join('\n') : '') +
      '\n❓ 스스로 확인 질문\n' + key.slice(0, 3).map(function (x) { var w = (/^([가-힣A-Za-z0-9]{2,12})/.exec(x) || ['', '이 내용'])[1]; return '- ' + w + '을(를) 내 말로 설명할 수 있어?'; }).join('\n') + '\n➡️ 다음 수업 전에 볼 것\n- 위 핵심 정리 1분 훑어보기';
  }
  /* 💬 ChatGPT 앱으로 정리 — 암기 과목에 맞춘 정리 요청. 이름·학교는 안 넣는다 */
  function gptPrompt(subject, text, kind) {
    var t = String(text || '').trim().slice(0, 1300);
    return '[수업 노트 정리]\n※ 일반 채팅(Chat)으로 답해줘. Work·Codex 같은 작업 모드나 에이전트로 문서·파일을 만들지 말고, 이 대화창에 글로만 답해줘.\n\n' +
      '나는 고등학교 1학년이야. ' + (subject || '수업') + ' 수업 내용을 정리하고 싶어. ' + (kind === 'photo' ? '아래는 교과서·필기 사진에서 옮긴 글이라 깨진 글자가 있을 수 있어.' : '아래는 녹음·받아쓰기라 용어가 틀릴 수 있으니 문맥에 맞게 이해해줘.') + '\n' +
      '내가 준 내용만 근거로 아래 형식 그대로 짧게 정리해줘. 틀렸거나 빠진 중요한 게 있으면 마지막 줄에 "⚠️ 확인할 것"으로만 따로 적어줘(본문에 섞지 마). 표·굵은 글씨 없이.\n\n' +
      '📌 핵심 정리\n- (3~5줄)\n🔑 꼭 외울 용어\n- 용어: 뜻 (최대 6개)\n🧩 헷갈리기 쉬운 것\n- (1~2줄)\n❓ 스스로 확인 질문\n- (3개, 답은 쓰지 마)\n🧠 외우기 팁\n- (1줄)\n\n' +
      '--- 수업 내용 ---\n' + (t || '(이어서 녹음 내용을 붙여넣거나 🎤로 말할게. 내용을 받기 전에는 "수업 내용을 보내줘 🎙️"라고만 답해줘.)');
  }
  /* 📋 ChatGPT에서 돌아오면: 복사해 온 정리를 붙여넣기 · 앱을 오가다 화면이 새로 열려도 쓰던 노트 되살리기 */
  var gptSent = '', DRAFT = 'fc-tn-draft';
  function saveDraft() {
    if (!sheet) return;
    try { localStorage.setItem(DRAFT, JSON.stringify({ at: Date.now(), kind: sheetKind, sub: sub, other: sheet.querySelector('.tn-sub-other').value, text: sheet.querySelector('.tn-text').value, sum: sheet.querySelector('.tn-sum').value, gpt: gptSent ? 1 : 0 })); } catch (e) {}
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) {} gptSent = ''; }
  function restoreDraft() {
    var d = null; try { d = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch (e) {}
    if (!d || Date.now() - d.at > 6 * 3600e3 || (!d.text && !d.sum) || sheet) return false;
    if (d.kind === 'photo') return false;   // 사진은 다시 찍어야 해서 글만 남은 경우는 말하기로
    openSheet('talk');
    if (d.sub) { sub = d.sub; sheet.querySelectorAll('[data-tn-sub]').forEach(function (x) { x.classList.toggle('on', x.dataset.tnSub === d.sub); }); }
    sheet.querySelector('.tn-sub-other').value = d.other || ''; sheet.querySelector('.tn-text').value = d.text || ''; sheet.querySelector('.tn-sum').value = d.sum || '';
    if (d.gpt) { gptSent = '1'; notice('쓰던 노트를 되살렸어. ChatGPT 정리를 복사해 왔으면 📋 붙여넣기를 눌러줘.'); }
    return true;
  }
  function pasteSum(manual) {
    if (!sheet) return;
    var out = sheet.querySelector('.tn-sum');
    if (!navigator.clipboard || !navigator.clipboard.readText) { if (manual) { out.focus(); notice('정리 칸을 길게 눌러 붙여넣기 해줘.'); } return; }
    navigator.clipboard.readText().then(function (t) {
      t = String(t || '').trim();
      if (!t || /^\[수업 노트 정리\]/.test(t)) { if (manual) notice('ChatGPT 답을 먼저 복사해 와줘. (지금 복사된 건 보낸 질문이야)'); return; }
      out.value = t.slice(0, 2000); saveDraft(); notice('붙여넣었어 📋 확인하고 저장해줘.');
      out.scrollIntoView({ block: 'center' });
    }).catch(function () { if (manual) { out.focus(); notice('붙여넣기 권한이 없어서, 정리 칸을 길게 눌러 붙여넣어 줘.'); } });
  }
  document.addEventListener('input', function (e) { if (sheet && e.target.closest && e.target.closest('.tn-sheet')) saveDraft(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') { saveDraft(); return; }
    if (sheet && gptSent && !sheet.querySelector('.tn-sum').value.trim()) setTimeout(function () { pasteSum(false); }, 400);   // ChatGPT에서 돌아오면 자동으로 붙여넣기 시도
  });
  setTimeout(function () { if (document.visibilityState === 'visible') restoreDraft(); }, 1800);
  function gptVoicePrompt(subject) {
    return '[수업 노트 정리] 나는 고등학교 1학년이야. 지금부터 ' + (subject || '수업') + ' 수업에서 배운 걸 말로(음성 입력) 할게. 받아쓰기라 과목 용어가 틀릴 수 있으니 문맥에 맞게 고쳐서 이해해줘.\n' +
      '내가 말을 다 하면, 내가 말한 내용만 근거로 아래 형식대로 짧게 정리해줘. 틀렸거나 빠진 중요한 게 있으면 마지막 줄에 "⚠️ 확인할 것"으로만 따로 적어줘. 표·굵은 글씨 없이.\n\n' +
      '📌 핵심 정리\n- (3~5줄)\n🔑 꼭 외울 용어\n- 용어: 뜻 (최대 6개)\n🧩 헷갈리기 쉬운 것\n- (1~2줄)\n❓ 스스로 확인 질문\n- (3개, 답은 쓰지 마)\n🧠 외우기 팁\n- (1줄)\n\n준비됐으면 "말해줘 🎙️" 한마디만 답해줘.';
  }
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
      if (sheet) { ta.value = (ta.value ? ta.value.trim() + '\n' : '') + txt.slice(0, 1400); b.textContent = '🔤 다시 읽기'; b.disabled = false; }
      notice(txt ? '읽은 글자를 넣었어. 💬 ChatGPT에 보내기를 눌러줘.' : '글자를 못 읽었어. 핵심만 직접 적어줘.');
    }).catch(function () { if (sheet) { b.disabled = false; b.textContent = '🔤 글자 읽기'; } notice('글자 읽기를 불러오지 못했어. 직접 적어줘.'); });
  }
  function saveNote(kind) {
    var ta = sheet.querySelector('.tn-text'), text = ta.value.trim().slice(0, 1500), other = sheet.querySelector('.tn-sub-other').value.trim().slice(0, 20), subject = other || sub || '기타';
    var sum0 = (sheet.querySelector('.tn-sum') || {}).value || '';
    if (kind === 'talk' && text.length < 5 && sum0.trim().length < 5) { notice('조금만 더 말하거나 적어줘. (ChatGPT 정리를 붙여넣어도 돼)'); return; }
    if (kind === 'photo' && !photoData) { notice('사진을 먼저 찍어줘.'); return; }
    stopRec();
    var id = nid(), t = today(), days = [].slice.call(sheet.querySelectorAll('[data-tn-day]')).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.dataset.tnDay); });
    var first = (text || sum0.replace(/^[^\n]*정리[^\n]*\n/, '').replace(/^[\s\-•]+/, '')).split('\n')[0].slice(0, 40);
    var title = subject + ' · ' + (kind === 'talk' ? '1분 말하기' : '요약 노트') + (first ? ' — ' + first : '');
    var sumEl = sheet.querySelector('.tn-sum'), sum = sumEl && !sheet.querySelector('.tn-sum-box').hidden ? sumEl.value.trim().slice(0, 2000) : '';
    var rv = { id: uid(), title: title.slice(0, 120), date: t, done: false, kind: '과제', subject: subject, note: (sum || text).slice(0, 800) };
    state.reviews.push(rv); save();
    if (window.FC_PLANNER) { var P = FC_PLANNER.get(); P.again[rv.id] = days.map(function (n) { return new Date(Date.parse(t + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }); try { localStorage.setItem(FC_PLANNER.KEY, JSON.stringify(P)); } catch (e) {} }
    var a = notes(); a.push({ id: id, date: t, at: new Date().toISOString(), kind: kind, subject: subject, text: text, sum: sum || undefined, photo: kind === 'photo', review: rv.id }); saveNotes(a);
    if (!sum && text.length >= 30 && canAI()) SHIRO_AI.organize(subject, text, kind, t).then(function (s2) { var b3 = notes(); b3.forEach(function (n) { if (n.id === id) n.sum = s2.slice(0, 2000); }); saveNotes(b3); if (typeof render === 'function') render(); }).catch(function () {});
    clearDraft();
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
        (n.sum ? '<div class="tn-sumv">' + esc(n.sum).replace(/\n/g, '<br>') + '</div>' + (n.text ? '<p class="tn-txt tn-raw">' + esc(n.text).replace(/\n/g, '<br>') + '</p><button type="button" class="linkish" data-tn-raw="1">원문 보기</button>' : '') : (n.text ? '<p class="tn-txt">' + esc(n.text).replace(/\n/g, '<br>') + '</p>' : '')) + '</li>';
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
    var gv = e.target.closest && e.target.closest('[data-tn-gpt-voice]');
    if (gv && sheet) {
      stopRec();
      var pv = gptVoicePrompt(sheet.querySelector('.tn-sub-other').value.trim() || sub || '수업'), A2 = window.SHIRO_AI;
      gv.href = A2 && A2.rawHref ? A2.rawHref(pv) : 'https://chatgpt.com/?q=' + encodeURIComponent(pv);
      if (A2 && A2.rawCopy) A2.rawCopy(pv, 'ChatGPT에서 "말해줘"라고 하면 🎤 누르고 말해. 정리된 답을 복사해서 돌아오면 붙여넣어 줄게.');
      gptSent = pv; saveDraft();
      return;
    }
    var g = e.target.closest && e.target.closest('[data-tn-gpt]');
    if (g && sheet) {
      var txt = sheet.querySelector('.tn-text').value.trim(), other = sheet.querySelector('.tn-sub-other').value.trim();
      if (sheetKind !== 'talk' && txt.length < 15) { e.preventDefault(); notice('정리할 글이 너무 짧아. 글자 읽기를 하거나 적어줘.'); return; }
      var pr = gptPrompt(other || sub || '수업', txt, sheetKind);
      var A = window.SHIRO_AI;
      g.href = A && A.rawHref ? A.rawHref(pr) : 'https://chatgpt.com/?q=' + encodeURIComponent(pr.slice(0, 1800));
      if (A && A.rawCopy) A.rawCopy(pr, '정리 규칙을 복사해 뒀어. ChatGPT 입력창이 비어 있으면 붙여넣기 해줘. 답을 복사해서 돌아오면 붙여넣어 줄게.');
      var box = sheet.querySelector('.tn-sum-box'); if (box) box.hidden = false;
      gptSent = pr; saveDraft();
      return;   // 링크 기본 동작으로 ChatGPT 앱 열기
    }
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (b.hasAttribute('data-tn-paste')) { pasteSum(true); return; }
    if (d.tnOpen) { openSheet(d.tnOpen); return; }
    if (b.hasAttribute('data-tn-close')) { if ((sheet.querySelector('.tn-text').value || photoData) && !confirm('저장하지 않고 닫을까?')) return; clearDraft(); closeSheet(); document.documentElement.classList.remove('tn-open'); return; }
    if (d.tnSub) { sub = d.tnSub; sheet.querySelectorAll('[data-tn-sub]').forEach(function (x) { x.classList.toggle('on', x === b); }); sheet.querySelector('.tn-sub-other').value = ''; return; }
    if (b.hasAttribute('data-tn-mic')) { if (timer) { stopRec(); sheet.querySelector('.tn-live').textContent = ''; } else startRec(); return; }
    if (b.hasAttribute('data-tn-pick')) { var f = sheet.querySelector('[data-tn-file]'); f.value = ''; f.click(); return; }
    if (b.hasAttribute('data-tn-ocr')) { runOcr(); return; }
    if (b.hasAttribute('data-tn-org')) { organizeSheet(false); return; }
    if (d.tnRaw) { var li = b.closest('li'); li.classList.toggle('tn-show-raw'); b.textContent = li.classList.contains('tn-show-raw') ? '정리 보기' : '원문 보기'; return; }
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
    '.tn-top{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;text-align:center;font-size:17px;margin-bottom:6px}.tn-x{min-height:40px!important;width:40px;padding:0!important;border:0!important;background:transparent!important;font-size:20px}' +
    '.tn-l{display:block;font-size:13.5px!important;margin:10px 0 4px!important}.tn-subs input{width:120px!important;min-height:32px!important;padding:4px 10px!important;border-radius:999px!important;font-size:13.5px}' +
    '.tn-rec{background:#f7f5ff;border-radius:16px;padding:12px;text-align:center;margin-top:8px}.tn-guide{list-style:none;margin:0 0 6px;padding:0;font-size:13.5px;color:#4a475c;display:grid;gap:2px;text-align:left}.tn-clock{font:800 42px/1 system-ui;color:#5b45d6;margin:6px 0}.tn-live{min-height:1.2em;margin:0}' +
    '.tn-mic{min-width:160px;min-height:52px!important;border-radius:999px!important;font-size:17px}.tn-mic.on{background:#e04a6a!important;border-color:#e04a6a!important;animation:tnPulse 1.2s infinite}@keyframes tnPulse{50%{box-shadow:0 0 0 8px rgba(224,74,106,.2)}}' +
    '.tn-text{width:100%;font-size:15px;line-height:1.6}.tn-again{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0;font-size:13.5px;color:#6b6880}.tn-again label{display:flex!important;gap:4px;align-items:center;margin:0!important;font-weight:500!important}.tn-again input{width:18px;min-height:18px}' +
    '.tn-save-row button{width:100%;min-height:50px!important;font-size:17px}' +
    '.tn-photo{margin-top:8px}.tn-preview{border:2px dashed #d9d3ee;border-radius:16px;min-height:140px;display:grid;place-items:center;gap:8px;padding:10px}.tn-preview img{max-width:100%;max-height:42dvh;border-radius:12px}.tn-ocr-row{margin:8px 0 0}' +
    '.tn-list ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}.tn-list li{border:1px solid #efedf5;border-radius:12px;padding:10px 12px}.tn-li-top{display:flex;align-items:center;gap:8px}.tn-li-top small{flex:1;color:#6b6880}.tn-tag{font-size:12.5px;font-weight:700;background:#f0edff;color:#5b45d6;border-radius:999px;padding:3px 9px}.tn-tag.photo{background:#e8f4ff;color:#2a6aa8}' +
    '.tn-thumb{display:block;width:100%;height:140px;margin:8px 0 0;border-radius:12px;background:#f4f3f8 center/cover no-repeat;border:0!important;font-size:12.5px;color:#6b6880}.tn-txt{margin:8px 0 0;font-size:15px;line-height:1.6;white-space:normal;max-height:9.6em;overflow:hidden}' +
    '.tn-gpt{display:block;margin-top:8px;padding:10px 12px;border:1px solid #d9d2f3;border-radius:12px;background:#fff;color:#4a33b8;font-weight:700;text-decoration:none;text-align:center;min-height:46px}.tn-gpt small{display:block;font-weight:500;color:#6b6880;font-size:12.5px}.tn-paste-row{margin:0 0 6px}.tn-gpt-main{display:block;margin:12px 0 8px;padding:14px;border-radius:999px;background:#5b3fd6;color:#fff!important;font-weight:800;font-size:17px;text-align:center;text-decoration:none;min-height:52px}.tn-steps{margin:0 0 8px;padding-left:20px;text-align:left;font-size:13.5px;line-height:1.6;color:#3d3a55}.tn-alt{margin-top:6px;text-align:left}.tn-alt summary{cursor:pointer;font-size:13.5px;color:#6b6880;padding:6px 0}.tn-alt .tn-clock{font-size:30px}.tn-better{margin-top:12px;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #ece8f8;text-align:left}.tn-better>b{font-size:13.5px}.tn-better .tn-gpt{margin:8px 0}.tn-warn{margin:8px 0 0;font-size:13.5px;color:#8a4b00;background:#fff4e0;border-radius:12px;padding:8px 10px;text-align:left}.tn-paste-row button{width:100%;min-height:44px!important;font-weight:700;background:#f4f1fd!important;border:1px dashed #b9ade8!important;color:#3c2fa8!important}.tn-sum{width:100%;font-size:15px;line-height:1.6;background:#fbfaff}.tn-sumv{margin:8px 0 0;font-size:15px;line-height:1.65;background:#f8f6ff;border-radius:12px;padding:10px 12px}.tn-raw{display:none}.tn-show-raw .tn-raw{display:block}.tn-show-raw .tn-sumv{display:none}' +
    '.tn-viewer img{max-width:100%;max-height:85dvh;border-radius:12px}.tn-viewer{flex-direction:column;gap:10px}';
  document.head.appendChild(css);
  if (typeof render === 'function') render();
})();
