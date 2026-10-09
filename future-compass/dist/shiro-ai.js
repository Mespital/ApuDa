/* 흰둥이 똑똑 모드 — 준비된 안내로 못 답하는 질문(공부 내용·계획·고민)을 AI(Claude)로 답한다.
   - VPS 실시간 서버가 있으면 그쪽(/chat), 없으면 Netlify(가족 공유 API)로.
   - 보내는 것: 질문, 최근 대화 몇 줄, 오늘 정보 요약(시간표·할 일·시험·학원·일정·공부 시간). 메모·노트 내용·사진은 안 보냄.
   - ⚙️ 설정에서 끌 수 있음. 꺼져 있거나 연결이 안 되면 기존 안내 답으로. */
(function () {
  'use strict';
  var PREF = 'fc-shiro-ai', hist = [], down = 0;
  function on() { try { return localStorage.getItem(PREF) !== 'off'; } catch (e) { return true; } }
  function role() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent' ? 'parent' : 'child'; }
  function live() { return typeof FamilySync !== 'undefined' && FamilySync.joined() ? FamilySync.live() : null; }
  function ready() { var l = live(); return on() && !!l && !!(l.ai || l.url) && Date.now() > down; }
  function hm() { var d = new Date(Date.now() + 9 * 3600000); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }

  function ctx() {
    var o = {}, t = typeof today === 'function' ? today() : '';
    try {
      var W = ['일', '월', '화', '수', '목', '금', '토'];
      o.날짜 = t + ' (' + W[new Date(t + 'T12:00:00Z').getUTCDay()] + ') ' + hm();
      o.대화상대 = role() === 'parent' ? '엄마' : '승준';
      if (!window.FC_PLANNER) return o;
      var P = FC_PLANNER.get(), parent = role() === 'parent';
      var ex = FC_PLANNER.examName(t); if (ex) o.오늘시험 = ex;
      var row = FC_PLANNER.todayRow(); if (row.length) o.오늘시간표 = row.join(', ');
      o.할일 = FC_PLANNER.todays().slice(0, 12).map(function (x) { return (x.q.p || 'B') + (x.t.done ? ' ✓ ' : ' ○ ') + x.t.title; });
      o.다가오는시험과제 = FC_PLANNER.exams().slice(0, 4).map(function (x) { var g = Math.round((Date.parse(x.date) - Date.parse(t)) / 86400000); return x.title + ' D-' + g; });
      (state.dates || []).filter(function (x) { return !x.done && x.kind !== '시험' && x.date >= t; }).slice(0, 3).forEach(function (x) { o.다가오는시험과제.push(x.kind + ' ' + x.title + ' ' + x.date.slice(5)); });
      if (typeof FC_ACADEMY !== 'undefined') { var ac = FC_ACADEMY.forDay(t); if (ac.length) o.오늘학원 = ac.map(function (a) { return (a.start || '') + ' ' + a.name + (a.homework && !a.hwDone ? ' (숙제: ' + a.homework + ')' : ''); }); }
      if (typeof FC_LIFE !== 'undefined') { var lf = FC_LIFE.forDay(t); if (lf.length) o.오늘일정 = lf.map(function (x) { return (x.start || '') + (x.end ? '~' + x.end : '') + ' ' + x.title; }); }
      o.쓸수있는시간분 = FC_PLANNER.free(); o.오늘예상공부분 = FC_PLANNER.planned();
      if (!parent || (P.share && P.share.flow)) {
        var by = {}, week = {}; (P.focus || []).forEach(function (f) { if (f.date === t) by[f.subject || '기타'] = (by[f.subject || '기타'] || 0) + f.min; if (f.date >= addD(t, -6)) week[f.date] = (week[f.date] || 0) + f.min; });
        o.오늘공부분 = by; o.최근7일공부분 = week;
      }
      var kid = JSON.parse(localStorage.getItem('fc_kid_v1') || '{}'); if (kid.mood && kid.mood[t]) o.오늘컨디션 = { good: '좋음', ok: '보통', tired: '지침' }[kid.mood[t]] || kid.mood[t];
    } catch (e) {}
    return o;
  }
  function guide(q) {
    var S = window.SHIRO_STUDY; if (!S) return [];
    var n = String(q).toLowerCase().replace(/\s/g, '');
    return S.faqs.map(function (f) { var sc = 0; f.keys.forEach(function (k) { if (n.indexOf(k.toLowerCase().replace(/\s/g, '')) >= 0) sc += k.length; }); return [sc, f.text]; })
      .filter(function (x) { return x[0] > 0; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 3).map(function (x) { return x[1]; });
  }
  function post(url, body) {
    return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout ? AbortSignal.timeout(110000) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._ok = r.ok; return j; }); });
  }
  // 내 노트(1분 말하기·노트 사진 글자) 중 질문과 겹치는 것만 근거로 보냄
  function bg(s) { var t = String(s || '').toLowerCase().replace(/[^0-9a-z가-힣]/g, ''), o = {}; for (var i = 0; i < t.length - 1; i++) o[t.slice(i, i + 2)] = 1; return o; }
  function notes(q) {
    var qb = bg(q), keys = Object.keys(qb); if (keys.length < 2) return [];
    var arr = []; try { arr = JSON.parse(localStorage.getItem('fc_notes_v1') || '[]'); } catch (e) {}
    return (Array.isArray(arr) ? arr : []).filter(function (n) { return n && n.text && n.text.length > 15; }).map(function (n) {
      var nb = bg(n.subject + ' ' + n.text), hit = keys.filter(function (k) { return nb[k]; }).length; return { hit: hit / keys.length, n: n };
    }).filter(function (x) { return x.hit >= 0.35; }).sort(function (a, b) { return b.hit - a.hit; }).slice(0, 3)
      .map(function (x) { return { title: (x.n.subject || '') + ' 노트 ' + String(x.n.date || '').slice(5), text: String(x.n.text).slice(0, 1200) }; });
  }
  function ask(q) {
    var l = live() || {}, body = { role: role(), q: String(q).slice(0, 500), history: hist.slice(-8), ctx: ctx(), guide: guide(q), notes: notes(q) };
    var viaNetlify = function () { return FamilySync.call(Object.assign({ action: 'chat' }, body)); };
    var p = l.url ? post(l.url + '/chat', Object.assign({ t: l.t }, body)).then(function (j) { return j._ok ? j : (j.error === 'no_ai' || j.error === 'ticket' ? viaNetlify() : j); }).catch(viaNetlify) : viaNetlify();
    return p.then(function (j) {
      if (j && j._ok && j.text) { hist.push({ r: 'u', t: body.q }, { r: 'a', t: j.text }); if (hist.length > 16) hist = hist.slice(-16); return j.text; }
      if (j && (j.error === 'no_ai' || j.error === 'rate')) down = Date.now() + 10 * 60000;
      throw new Error((j && j.error) || 'ai');
    });
  }
  // 준비된 안내보다 AI가 나은 질문: 공부 내용·풀이·계획·마음
  function prefer(q) { return /왜|어떻게\s*(풀|해야|공부|외우)|설명|뜻|차이|개념|문제|공식|풀이|모르겠|추천|계획|짜줘|힘들|하기\s*싫|불안|걱정|스트레스|외우|암기|공부법|요약|정리해/.test(q); }

  /* 📚 공부 자료 (VPS에 저장, 흰둥이가 근거로 사용) */
  var DOCS = null, docsBusy = false;
  function vurl() { var l = live(); return l && l.url ? l : null; }
  function loadDocs() {
    var l = vurl(); if (!l || docsBusy) return; docsBusy = true;
    fetch(l.url + '/docs?t=' + encodeURIComponent(l.t)).then(function (r) { return r.json(); }).then(function (j) { DOCS = j.docs || []; }).catch(function () { DOCS = DOCS || []; }).then(function () { docsBusy = false; if (tab === 'settings') { var b = document.getElementById('ai-docs'); if (b) b.outerHTML = docsBox(true); } });
  }
  function docsBox(fresh) {
    if (!vurl()) return '<div id="ai-docs" class="ai-docs"><h3>📚 공부 자료</h3><p class="muted small">실시간 서버(VPS)가 연결되면 학습지·요약·교과서 정리를 넣어둘 수 있어.</p></div>';
    if (DOCS === null && !fresh) setTimeout(loadDocs, 0);
    var subs = ['국어', '수학', '영어', '통합사회', '통합과학', '한국사', '정보', '기타'];
    return '<div id="ai-docs" class="ai-docs"><h3>📚 공부 자료 <small>' + (DOCS ? DOCS.length + '개' : '불러오는 중…') + '</small></h3>' +
      (DOCS && DOCS.length ? '<ul class="lg-list">' + DOCS.slice().reverse().map(function (d) { return '<li><span class="lg-name">' + esc(d.title) + '<small>' + esc(d.subject || '') + ' · ' + (d.chars >= 1000 ? Math.round(d.chars / 100) / 10 + '천자' : d.chars + '자') + '</small></span><button type="button" class="pl-x" data-doc-del="' + esc(d.id) + '" aria-label="지우기">×</button></li>'; }).join('') + '</ul>' : '') +
      '<div class="lg-form"><input class="doc-title" maxlength="60" placeholder="제목 (예: 통합과학 2단원 정리)"><select class="doc-sub">' + subs.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>' +
      '<textarea class="doc-text" rows="5" placeholder="내용을 붙여넣거나 아래에서 파일(.txt .md .pdf)을 골라"></textarea>' +
      '<input type="file" class="doc-file" accept=".txt,.md,.pdf,text/plain,application/pdf">' +
      '<div class="lg-btns"><button type="button" class="primary" data-doc-add>자료 넣기</button></div><p class="muted small">사진 학습지는 오늘 탭 "노트 사진"으로 찍으면 글자를 읽어서 근거로 써.</p></div></div>';
  }
  function pdfText(file) {
    var V = '3.11.174', B = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + V + '/';
    var load = window.pdfjsLib ? Promise.resolve() : new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = B + 'pdf.min.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
    return load.then(function () { pdfjsLib.GlobalWorkerOptions.workerSrc = B + 'pdf.worker.min.js'; return file.arrayBuffer(); }).then(function (buf) { return pdfjsLib.getDocument({ data: buf }).promise; }).then(function (pdf) {
      var out = [], n = Math.min(pdf.numPages, 80), chain = Promise.resolve();
      for (var i = 1; i <= n; i++) (function (k) { chain = chain.then(function () { return pdf.getPage(k).then(function (pg) { return pg.getTextContent(); }).then(function (tc) { out.push(tc.items.map(function (it) { return it.str; }).join(' ')); }); }); })(i);
      return chain.then(function () { return out.join('\n\n'); });
    });
  }
  document.addEventListener('change', function (e) {
    var f = e.target; if (!f.classList || !f.classList.contains('doc-file') || !f.files[0]) return;
    var file = f.files[0], box = f.closest('.lg-form'), ta = box.querySelector('.doc-text'), ti = box.querySelector('.doc-title');
    if (!ti.value) ti.value = file.name.replace(/\.[^.]+$/, '').slice(0, 60);
    notice('파일 읽는 중…');
    (/\.pdf$/i.test(file.name) ? pdfText(file) : file.text()).then(function (t) { ta.value = String(t).slice(0, 400000); notice(t.trim().length > 20 ? '읽었어. [자료 넣기]를 눌러줘.' : '글자를 못 찾았어. 사진 PDF면 노트 사진으로 찍어줘.'); }).catch(function () { notice('파일을 읽지 못했어.'); });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var l = vurl();
    if (b.hasAttribute('data-doc-add') && l) {
      var box = b.closest('.lg-form'), text = box.querySelector('.doc-text').value.trim();
      if (text.length < 20) { notice('내용을 조금 더 넣어줘.'); return; }
      b.disabled = true;
      post(l.url + '/docs', { t: l.t, title: box.querySelector('.doc-title').value, subject: box.querySelector('.doc-sub').value, text: text, by: role() }).then(function (j) {
        b.disabled = false; if (!j._ok) { notice(j.error === 'full' ? '자료 공간이 가득 찼어. 안 쓰는 걸 지워줘.' : '넣지 못했어. 잠시 뒤 다시 해줘.'); return; }
        notice('자료를 넣었어 📚 이제 흰둥이가 이걸 근거로 답해.'); DOCS = null; loadDocs();
      }).catch(function () { b.disabled = false; notice('넣지 못했어.'); });
    }
    if (b.dataset.docDel && l) { if (!confirm('이 자료를 지울까?')) return; post(l.url + '/docs/del', { t: l.t, id: b.dataset.docDel }).then(function () { DOCS = null; loadDocs(); }); }
  });

  /* ⚙️ 설정 카드 */
  var prev = typeof render === 'function' ? render : null;
  if (prev) render = function () {
    prev();
    if (tab !== 'settings') return;
    var l = live(), st = !l ? '가족 공유에 연결하면 쓸 수 있어.' : !(l.ai || l.url) ? '아직 준비 중이야(보호자가 서버에 AI 키를 넣으면 켜져).' : l.url ? '연결됨 · 실시간 서버' : '연결됨';
    var html = '<section class="card" id="set-ai"><h2>🧠 흰둥이 똑똑 모드</h2><p class="muted small">준비된 안내로 답하기 어려운 질문(개념 설명, 공부 계획, 고민)을 AI가 답해줘. ' + st + '</p>' +
      '<label class="push-row"><span>똑똑 모드 쓰기</span><input type="checkbox" data-ai-on' + (on() ? ' checked' : '') + '></label>' +
      '<p class="muted small">보내는 것: 질문, 오늘 정보 요약(시간표·할 일·시험·학원·일정·공부 시간), 질문과 관련된 내 노트 글 몇 줄. 사진·메모는 안 보내. 아래 공부 자료에 있으면 그걸 근거로, 없으면 위키백과를 찾아보고 답해(출처 표시). 숙제를 대신 써주진 않고 힌트를 줘.</p>' + docsBox() + '</section>';
    var a = document.getElementById('set-push') || document.getElementById('set-profile');
    if (a) a.insertAdjacentHTML('beforebegin', html);
    var nav = document.querySelector('.set-jump'); if (nav && !nav.querySelector('[data-jump="set-ai"]')) nav.insertAdjacentHTML('beforeend', '<a href="#set-ai" data-jump="set-ai">흰둥이</a>');
  };
  document.addEventListener('change', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-ai-on')) { try { localStorage.setItem(PREF, e.target.checked ? 'on' : 'off'); } catch (er) {} notice(e.target.checked ? '흰둥이 똑똑 모드를 켰어 🧠' : '똑똑 모드를 껐어. 준비된 안내로만 답할게.'); } });

  var css = document.createElement('style'); css.textContent = '.ai-docs{margin-top:14px;border-top:1px solid #ecebf2;padding-top:12px}.ai-docs h3{font-size:15px;margin:0 0 8px}.ai-docs h3 small{font-weight:500;color:#8a879a;margin-left:4px}.ai-docs textarea,.ai-docs select{width:100%;box-sizing:border-box}.shiro-think{opacity:.7;animation:shiroThink 1.2s ease-in-out infinite}@keyframes shiroThink{50%{opacity:.4}}'; document.head.appendChild(css);
  // 수업 사진·노트 정리 (VPS → 안 되면 Netlify)
  function organize(subject, text, kind, date) {
    var l = live() || {}, body = { subject: subject, text: String(text).slice(0, 3500), kind: kind, date: date };
    var viaNetlify = function () { return FamilySync.call(Object.assign({ action: 'organize' }, body)); };
    var p = l.url ? post(l.url + '/organize', Object.assign({ t: l.t }, body)).then(function (j) { return j._ok ? j : (j.error === 'no_ai' || j.error === 'ticket' ? viaNetlify() : j); }).catch(viaNetlify) : viaNetlify();
    return p.then(function (j) { if (j && j._ok && j.sum) return j.sum; throw new Error((j && j.error) || 'ai'); });
  }
  window.SHIRO_AI = { on: ready, ask: ask, prefer: prefer, ctx: ctx, organize: organize };
  if (prev) render();
})();
