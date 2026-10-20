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
  function prefer(q) {
    if (/왜|어떻게\s*(풀|해야|공부|외우)|설명|뜻|차이|개념|문제|공식|풀이|모르겠|추천|계획|짜줘|힘들|하기\s*싫|불안|걱정|스트레스|외우|암기|공부법|요약|정리해/.test(q)) return true;
    // 공부 질문(과목·개념·문법·계산)은 앱 안내보다 AI가 낫다. 앱 사용 질문은 안내로
    if (/앱|설정|알림|버튼|화면|메뉴|로그인|비밀번호|동기화|백업|어디\s*있/.test(q)) return false;
    return /뭐야|뭐지|뭔지|무엇|알려줘|가르쳐|헷갈|이해가?\s*안|구해|구하|계산|증명|해석|번역|영작|예문|문법|맞아\?|틀렸|수학|과학|사회|한국사|역사|영어|국어|문학|함수|방정식|부등식|집합|명제|산화|환원|염기|진화|관계대명사|분사|가정법|소설|\d\s*[x+\-×*=]/.test(q);
  }

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

  /* 📚 흰둥이가 자동으로 읽는 학교 자료(shiro-kb.json, 매일 아침 갱신) */
  var KBI = null;
  function kbLine() {
    function ago(t) { var h = Math.max(0, Math.round((Date.now() - Date.parse(t)) / 36e5)); return h < 1 ? '방금' : h < 48 ? h + '시간 전' : Math.round(h / 24) + '일 전'; }
    function put() { var el = document.getElementById('ai-kb'); if (!el || !KBI) return; var L = KBI.learn || {};
      el.innerHTML = '📚 학교 자료 자동 읽기: 평가계획·수행평가 기준·시험 범위·학사일정·급식·교과 단원 ' + (KBI.school || KBI.count) + '조각<br>🧠 개념 사전: 위키백과 개념 ' + (L.total || 0) + '개' + (L.last ? ' · 최근 「' + esc((L.last.titles || []).slice(0, 3).join(', ')) + '」' : '') + '<br>매일 아침 6시쯤 새로 반영돼 (' + ago(KBI.updated) + ' 업데이트)'; }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    if (KBI) return put();
    function get(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
    get('https://raw.githubusercontent.com/Mespital/ApuDa/main/future-compass/dist/shiro-kb.json').catch(function () { return get('shiro-kb.json'); })
      .then(function (d) { if (d && d.updated) { KBI = d; put(); } }).catch(function () { var el = document.getElementById('ai-kb'); if (el) el.textContent = '📚 학교 자료 자동 읽기: 아직 준비 중'; });
  }
  /* ⚙️ 설정 카드 */
  var prev = typeof render === 'function' ? render : null;
  if (prev) render = function () {
    prev();
    if (tab !== 'settings') return;
    var l = live(), st = !l ? '가족 공유에 연결하면 쓸 수 있어.' : !(l.ai || l.url) ? '아직 준비 중이야(보호자가 서버에 AI 키를 넣으면 켜져).' : l.url ? '연결됨 · 실시간 서버' : '연결됨';
    var html = '<section class="card" id="set-ai"><h2>🧠 흰둥이 똑똑 모드</h2><p class="muted small">준비된 안내로 답하기 어려운 질문(개념 설명, 공부 계획, 고민)을 AI가 답해줘. ' + st + '</p>' +
      '<label class="push-row"><span>똑똑 모드 쓰기</span><input type="checkbox" data-ai-on' + (on() ? ' checked' : '') + '></label>' +
      '<label class="small" style="display:block;margin:10px 0 4px">💬 ChatGPT 연결 (공부 질문의 \'ChatGPT에 자세히 물어보기\' 버튼) — 엄마가 만든 GPT 주소를 넣으면 그 GPT로, 비우면 기본 ChatGPT로 열려</label><input type="url" data-gpt-url placeholder="https://chatgpt.com/g/g-…" value="' + (function () { try { return (localStorage.getItem(GPT_KEY) || '').replace(/"/g, ''); } catch (e) { return ''; } })() + '" style="width:100%;box-sizing:border-box"><p class="muted small">ChatGPT는 만 13세 이상, 18세 미만은 보호자 동의가 필요해. 승준이 계정은 ChatGPT 보호자 연결(자녀 보호 설정)을 같이 켜두길 권해.</p>' +
      '<p class="muted small">보내는 것: 질문, 오늘 정보 요약(시간표·할 일·시험·학원·일정·공부 시간), 질문과 관련된 내 노트 글 몇 줄. 사진·메모는 안 보내. 아래 공부 자료에 있으면 그걸 근거로, 없으면 위키백과를 찾아보고 답해(출처 표시). 숙제를 대신 써주진 않고 힌트를 줘.</p><p class="muted small" id="ai-kb">📚 학교 자료 자동 읽기: 확인 중…</p>' + docsBox() + '</section>';
    var a = document.getElementById('set-push') || document.getElementById('set-profile');
    if (a) a.insertAdjacentHTML('beforebegin', html);
    kbLine();
    var nav = document.querySelector('.set-jump'); if (nav && !nav.querySelector('[data-jump="set-ai"]')) nav.insertAdjacentHTML('beforeend', '<a href="#set-ai" data-jump="set-ai">흰둥이</a>');
  };
  document.addEventListener('change', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-gpt-url')) { var v = e.target.value.trim(); if (v && !/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(v)) { notice('chatgpt.com 주소만 넣을 수 있어'); return; } try { v ? localStorage.setItem(GPT_KEY, v) : localStorage.removeItem(GPT_KEY); } catch (er) {} notice(v ? 'ChatGPT 연결을 저장했어 💬' : '기본 ChatGPT로 열게'); return; } if (e.target.hasAttribute && e.target.hasAttribute('data-ai-on')) { try { localStorage.setItem(PREF, e.target.checked ? 'on' : 'off'); } catch (er) {} notice(e.target.checked ? '흰둥이 똑똑 모드를 켰어 🧠' : '똑똑 모드를 껐어. 준비된 안내로만 답할게.'); } });

  var css = document.createElement('style'); css.textContent = '.ai-docs{margin-top:14px;border-top:1px solid var(--u-line);padding-top:12px}.ai-docs h3{font-size:15px;margin:0 0 8px}.ai-docs h3 small{font-weight:500;color:var(--ink-3);margin-left:4px}.ai-docs textarea,.ai-docs select{width:100%;box-sizing:border-box}.shiro-think{opacity:.7;animation:shiroThink 1.2s ease-in-out infinite}@keyframes shiroThink{50%{opacity:.4}}'; document.head.appendChild(css);
  // 수업 사진·노트 정리 (VPS → 안 되면 Netlify)
  function organize(subject, text, kind, date) {
    var l = live() || {}, body = { subject: subject, text: String(text).slice(0, 3500), kind: kind, date: date };
    var viaNetlify = function () { return FamilySync.call(Object.assign({ action: 'organize' }, body)); };
    var p = l.url ? post(l.url + '/organize', Object.assign({ t: l.t }, body)).then(function (j) { return j._ok ? j : (j.error === 'no_ai' || j.error === 'ticket' ? viaNetlify() : j); }).catch(viaNetlify) : viaNetlify();
    return p.then(function (j) { if (j && j._ok && j.sum) return j.sum; throw new Error((j && j.error) || 'ai'); });
  }
  /* 📚 학교 자료 바로 답하기 (AI 없이) — 시험 범위·급식·학사일정·수행평가 기준처럼 '모인 자료 그대로'면 되는 질문은
     매일 아침 갱신되는 shiro-kb.json에서 바로 찾아 보여준다. 틀린 말을 지어낼 일이 없고, AI·VPS가 없어도 된다 */
  var KBC = null, KBU = '';
  function loadKB() {
    if (KBC) return;
    KBC = [];
    function get(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
    get('https://raw.githubusercontent.com/Mespital/ApuDa/main/future-compass/dist/shiro-kb.json').catch(function () { return get('shiro-kb.json'); })
      .then(function (d) { if (d && d.chunks) { KBC = d.chunks.filter(function (c) { return c.src !== '위키백과' && c.src !== 'AI 소식'; }).map(function (c) { return { c: c, g: bg(c.title + ' ' + c.text), t: bg(c.title) }; }); KBU = d.updated || ''; } })
      .catch(function () { KBC = null; });
  }
  var FACT = /범위|시험|고사|급식|점심|메뉴|학사|행사|방학|수행|배점|만점|기준|채점|진도|며칠|몇\s*월|몇\s*일|언제|프로그램|모집|공지|가정통신문|평가\s*방법|비율|반영/;
  var NOTFACT = /왜|설명|뜻|개념|차이|원리|어떻게\s*(풀|공부|외우|준비)|도와|알림|설정|앱|화면|버튼|힘들|싫/;
  // 질문 종류별로 찾을 자료를 먼저 좁힌다 (급식은 급식에서, 범위는 시험 범위에서 …)
  var KIND = [
    [/급식|점심|메뉴|밥\s*뭐/, /급식/],
    [/범위|배점|서술형/, /시험 범위/],
    [/시험\s*(날|시간표|일정|언제)|고사\s*(언제|날|시간표)|무슨\s*과목/, /시간표\(1학년\)|학사일정/],
    [/수행/, /수행평가:/],
    [/진도/, /진도표/],
    [/평가\s*방법|비율|반영|성적/, /평가 방법/],
    [/프로그램|모집|구청|교육지원/, /교육지원센터/],
    [/공지|가정통신문|게시판|소식/, /최근 글/],
    [/학사|일정|행사|방학|휴업|언제|며칠|몇\s*월|몇\s*일/, /학사일정|시간표\(1학년\)/]
  ];
  function score(pool, q) {
    var qb = Object.keys(bg(q)).filter(function (k) { return !/뭐야|알려|려줘|언제|이야|있어|해줘|이번|번주/.test(k); }); if (!qb.length) return [];
    var df = {}; pool.forEach(function (x) { qb.forEach(function (k) { if (x.g[k]) df[k] = (df[k] || 0) + 1; }); });
    var N = pool.length, max = qb.reduce(function (s, k) { return s + Math.log(1 + N / (1 + (df[k] || 0))); }, 0) || 1;
    return pool.map(function (x) { var sc = 0; qb.forEach(function (k) { if (x.g[k]) sc += Math.log(1 + N / (df[k] || 1)) * (x.t[k] ? 1.5 : 1); }); return { sc: sc / max, c: x.c }; }).sort(function (a, b) { return b.sc - a.sc; });
  }
  function foot(src) { var d = KBU ? new Date(Date.parse(KBU) + 9 * 3600e3) : null; return '\n\n최종은 학교 공지와 선생님 말씀이 기준이야.\n📎 출처: ' + src + (d ? ' (' + (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + ' 아침 기준)' : ''); }
  function kbAnswer(q) {
    if (!KBC || !KBC.length || !FACT.test(q) || NOTFACT.test(q)) return null;
    var k = KIND.find(function (x) { return x[0].test(q); }); if (!k) return null;
    var pool = KBC.filter(function (x) { return k[1].test(x.c.title); }); if (!pool.length) return null;
    // 이번 주 급식 → 전부, 오늘·내일·요일이면 그날 것
    if (/급식/.test(k[1].source)) {
      var day = /오늘/.test(q) ? '오늘' : /내일/.test(q) ? '내일' : (q.match(/[월화수목금]요일/) || [])[0];
      var ms = day ? pool.filter(function (x) { return x.c.title.indexOf(day) >= 0; }) : pool;
      if (!ms.length) return null;
      return '📚 ' + (day ? '' : '이번 주 ') + '급식\n' + ms.map(function (x) { return x.c.text; }).join('\n') + foot(ms[0].c.src);
    }
    var r = score(pool, q), top = r[0];
    // 수행평가인데 과목만 물었으면(제목까지 콕 집지 않았으면) 그 과목 수행평가 목록
    if (/수행평가:/.test(k[1].source) && top) {
      var subj = top.c.subject, same = r.filter(function (x) { return x.c.subject === subj && x.sc > 0.3; });
      if (same.length > 1 && !/만점|기준|채점|방법/.test(q)) return '📚 ' + subj + ' 수행평가\n' + same.map(function (x) { var m = x.c.text.match(/시기 ([^·]+)·[^·]*·\s*([^·]+)·\s*학기 성적의 ([^%.]+%)/); return '• ' + x.c.title.replace(/^.*수행평가:\s*/, '') + (m ? ' — ' + m[1].trim() + ' · ' + m[2].trim() + ' · ' + m[3] : ''); }).join('\n') + '\n(하나 골라 "만점 기준"을 물으면 자세히 알려줄게)' + foot(top.c.src);
    }
    if (!top || top.sc < (pool.length <= 3 ? 0.3 : 0.55)) return null;
    return '📚 ' + top.c.title + '\n' + top.c.text + foot(top.c.src);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadKB); else setTimeout(loadKB, 1500);

  /* 💬 ChatGPT로 이어 묻기 — AI가 필요한 공부 질문(개념·풀이·문법)은 ChatGPT(또는 엄마가 만든 GPT)로 넘긴다.
     질문 앞에 '고1 수준·힌트 먼저·수행평가 대필 금지' 규칙을 붙여 보낸다. 이름·학교·개인 기록은 안 붙인다 */
  var GPT_KEY = 'fc-gpt-url';
  function gptBase() {
    try { var u = new URL(localStorage.getItem(GPT_KEY) || 'https://chatgpt.com/'); if (u.protocol === 'https:' && /^(chatgpt\.com|chat\.openai\.com)$/.test(u.hostname) && !u.username && !u.password) { u.search = ''; u.hash = ''; return u.href; } } catch (e) {}
    return 'https://chatgpt.com/';
  }
  var SUBJ = [['공통수학2', /수학|함수|방정식|부등식|도형|직선|좌표|집합|명제|필요조건|충분조건|역함수|합성함수|유리함수|무리함수|그래프|기울기|이차|일차|\d\s*[x×*+\-=]/], ['통합과학2', /과학|산화|환원|염기|중화|pH|진화|자연선택|변이|생물\s*다양성|지질|화석|생태계|에너지|발전기|기후|광합성|세포|유전/], ['통합사회2', /사회|인권|헌법|시장|금융|경제|정의|문화|세계화|지속\s*가능|인구|자원|불평등|복지/], ['한국사2', /한국사|역사|광복|분단|6[.·]25|민주화|산업화|유신|4[.·]19|5[.·]18|냉전|외환\s*위기/], ['공통영어2', /영어|관계(대명사|부사)|분사|가정법|부정사|동명사|수동태|시제|영작|[A-Za-z]{4,}/], ['공통국어2', /국어|문학|시의|소설|수필|화자|서술자|갈래|비유|운율|음운|형태소|품사|문장\s*성분|화법|작문|매체/]];
  function gptPrompt(q) {
    var sj = SUBJ.find(function (x) { return x[1].test(q); });
    return '[공부 도우미 규칙] 나는 고등학교 1학년이야(2022 개정 교육과정' + (sj ? ', 과목: ' + sj[0] : '') + '). 고1 교과서 수준으로 쉽게 설명해줘. 개념이면 한 줄 핵심 → 쉬운 설명 → 예시 1개 → 마지막에 확인 질문 1개. 문제면 바로 답 말고 핵심 개념과 첫 단계만 알려주고, 내가 "풀이 보여줘"라고 하면 끝까지 풀고 검산해줘. 수행평가·보고서는 대신 쓰지 말고 개요와 피드백만. 확실하지 않은 사실은 확실하지 않다고 말해줘.\n\n질문: ' + String(q).slice(0, 400);
  }
  function gptLink(q) { return gptBase() + '?q=' + encodeURIComponent(gptPrompt(q)); }
  /* 📱 폰의 ChatGPT 앱으로 열기
     - 안드로이드: intent 주소로 ChatGPT 앱(com.openai.chatgpt)을 바로 열고, 앱이 없으면 웹으로
     - 아이폰: chatgpt.com 링크(앱이 깔려 있으면 앱이 받음). 앱에서 질문이 안 채워질 때를 대비해 질문을 미리 복사해 둔다 */
  var isAndroid = /Android/i.test(navigator.userAgent || '');
  function gptHref(q) {
    var web = gptLink(q);
    if (!isAndroid) return web;
    return 'intent://' + web.replace(/^https:\/\//, '') + '#Intent;scheme=https;package=com.openai.chatgpt;S.browser_fallback_url=' + encodeURIComponent(web) + ';end';
  }
  // 긴 요청은 전체 복사로 전달한다. URL에는 일부만 넣지 않는다.
  function rawHref(p) {
    var base = gptBase(), web = base + '?q=' + encodeURIComponent(String(p));
    if (web.length > 6000) web = base;
    return isAndroid ? 'intent://' + web.replace(/^https:\/\//, '') + '#Intent;scheme=https;package=com.openai.chatgpt;S.browser_fallback_url=' + encodeURIComponent(web) + ';end' : web;
  }
  // 1분 복습은 일반 Chat의 새 대화로. 사용자 지정 GPT·Android 앱 intent를 거치지 않는다.
  // Chat/Work 전환은 ChatGPT에서 확인한다. 프롬프트로 앱의 모드를 바꿀 수 있다고 약속하지 않는다.
  function chatHref(p) { var u = 'https://chatgpt.com/?q=' + encodeURIComponent(String(p)); return u.length <= 6000 ? u : 'https://chatgpt.com/'; }
  function legacyCopy(text) {
    var ta = document.createElement('textarea'), previous = document.activeElement, ok = false;
    ta.value = text; ta.readOnly = true; ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(ta);
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, text.length); ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); if (previous && previous.isConnected) previous.focus({ preventScroll: true });
    return !!ok;
  }
  function rawCopy(p, msg) {
    var text = String(p), copied;
    try { copied = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); }) : Promise.resolve(legacyCopy(text)); }
    catch (e) { copied = Promise.resolve(legacyCopy(text)); }
    return copied.then(function (ok) {
      if (msg && typeof notice === 'function') notice(ok ? msg : '자동 복사를 못 했어. 요청을 직접 선택해 복사해줘.');
      return ok;
    });
  }
  function gptCopy(q) {
    return rawCopy(gptPrompt(q), '질문을 복사했어. ChatGPT 입력창이 비어 있으면 붙여넣기 해 📋');
  }
  function studyQ(q) { return !/앱|설정|알림|버튼|화면|메뉴|로그인|비밀번호|급식|시간표|학원|엄마|아빠|힘들|싫어|우울|짜증|불안/.test(q) && (prefer(q) && !/추천|계획|짜줘|하기\s*싫|걱정|스트레스/.test(q)); }

  window.SHIRO_AI = { on: ready, ask: ask, prefer: prefer, ctx: ctx, organize: organize, kb: kbAnswer, gpt: gptLink, gptHref: gptHref, gptCopy: gptCopy, rawHref: rawHref, rawCopy: rawCopy, chatHref: chatHref, study: studyQ };
  if (prev) render();
})();
