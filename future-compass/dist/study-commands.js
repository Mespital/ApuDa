/* ⚡ 공부 명령어 (2026-11-19 추가)
   - 복습 탭 '막힌 문제' 아래에 카드 하나로 붙는다.
   - 주제를 적고 명령어를 고르면 → ChatGPT에 붙일 문장이 만들어지고 → 복사 + ChatGPT 앱 열기.
   - 명령어는 ChatGPT 공식 기능이 아니라 '이렇게 가르쳐 줘'라는 단어 지시다. 화면에도 그렇게 적는다.
   - 사이트 안에서 AI를 부르지 않는다. 보내기는 SHIRO_AI.rawHref/rawCopy(없으면 chatgpt.com)로만.
   - 저장: 마지막 과목·주제·명령어만 이 기기 localStorage에. */
(function () {
  'use strict';
  if (typeof render === 'undefined') return;
  var KEY = 'compass-study-cmd-v1';

  // [명령어, 쉬운 설명, 예시 주제, 이미지 생성 여부]
  var GROUPS = [
    { id: 'easy', name: '😊 쉽게 이해하기', items: [
      ['/handwritten', '손글씨 노트처럼 아주 쉽게 풀어줘', '광합성은 어떻게 일어나?', 1],
      ['ELI10', '10살한테 말하듯 쉽게 설명', '전기 저항'],
      ['/make-sticky-notes', '핵심을 메모지 한 장에 하나씩', '세포 호흡'],
      ['/STORYMODE', '배운 걸 이야기로 바꿔 기억하기', '조선 건국 과정'],
      ['/ANIME-EXPLAINER', '애니 장면처럼 바꿔 기억하기', '뉴턴 운동 법칙'],
      ['SPECIFICITY', '막연한 설명을 예시·숫자·행동으로', '함수의 증가와 감소']
    ] },
    { id: 'see', name: '🖼️ 그림으로 보기', items: [
      ['/visualizelearning', '그림 한 장으로 풀어 보기 (이름표 넣어 달라고 하면 좋아)', '미토콘드리아, 각 부분에 이름표를 붙여 줘', 1],
      ['/STUDYGUIDE', '단계별로 나눈 공부용 도식', '세포 분열', 1, '/STUDYGUIDE generate visual study image on {t}'],
      ['/VISUALCHEATSHEET', '한 장 요약표', '영어 관계대명사', 1],
      ['/MINDMAP', '개념끼리 어떻게 이어지는지 마인드맵', '고려 시대 정치 변화', 1],
      ['/TIMELINEVIEW', '시간순 연표', '임진왜란 전개', 1],
      ['/EXPLODEDVIEW', '부분별로 나눠 보여 주는 분해도', '원자의 구조', 1]
    ] },
    { id: 'exam', name: '📝 시험 대비', items: [
      ['/QUESTIONPREDICTOR', '나올 만한 문제 예측', '고1 통합과학 세포 호흡 중간고사'],
      ['/QUIZME', '한 문제씩, 내 답 보고 난이도 조절', '방금 예상 문제 범위'],
      ['SOCRATES', '질문만 던지면서 가르치기 (한 번에 하나)', '광합성', 0, 'SOCRATES {t} 나한테 질문하면서 가르쳐 줘. 한 번에 질문 하나만 해 줘.']
    ] },
    { id: 'deep', name: '🧩 더 깊이 생각하기', items: [
      ['FIRSTPRINCIPLES', '가장 기본 원리부터 쪼개 보기', '왜 물체는 떨어질까'],
      ['CONTRASTMODE', '비슷한 개념 차이를 날카롭게 비교', '광합성 vs 세포 호흡'],
      ['UNLEARN', '내가 잘못 알고 있는 오해 짚기', '무거운 물체가 더 빨리 떨어진다'],
      ['REDTEAM', '반대편에서 내 생각 반박해 단단하게', '내 논술 주장: 교복은 자율화해야 한다'],
      ['TRUTHMODE', '듣기 좋은 말 없이 솔직하게 평가 (내 답안·요약 붙여서)', '아래 내 요약을 평가해 줘: ']
    ] }
  ];
  var ROUTE = [
    ['1', '쉬운 설명 → 메모 카드', '/handwritten', '/make-sticky-notes'],
    ['2', '그림 한 장으로 구조 보기', '/visualizelearning'],
    ['3', '예상 문제 → 한 문제씩 풀기', '/QUESTIONPREDICTOR', '/QUIZME'],
    ['4', '질문에 답하면서 다시 꺼내기', 'SOCRATES']
  ];
  var FOLLOW = {
    SOCRATES: ['설명하지 말고 질문만 해 줘', '모르겠어, 힌트만 줘', '내가 틀렸거나 빠뜨린 부분만 정리해 줘', '더 어려운 질문으로 해 줘'],
    '/QUIZME': ['모르겠어, 힌트만 줘', '지금까지 틀린 것만 다시 내 줘', '내가 틀린 부분만 정리해 줘'],
    img: ['그림 속 글자는 줄이고 설명은 글로 따로 써 줘', '같은 내용을 글과 표로 정리해 줘'],
    '/handwritten': ['손글씨 노트 그림으로 그려 줘']
  };
  var ALL = []; GROUPS.forEach(function (g) { g.items.forEach(function (it) { ALL.push(it); }); });
  function find(c) { return ALL.find(function (x) { return x[0] === c; }); }

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load(); if (!S.cmd || !find(S.cmd)) S.cmd = '/handwritten'; if (S.lvl == null) S.lvl = true; if (!S.uses || typeof S.uses !== 'object') S.uses = {};
  function used(c) { S.uses[c] = (S.uses[c] || 0) + 1; save(S); }
  function top() { return Object.keys(S.uses).filter(function (c) { return find(c) && S.uses[c] > 0; }).sort(function (a, b) { return S.uses[b] - S.uses[a]; }).slice(0, 4); }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var SUBJ = (typeof subjectNames !== 'undefined' && subjectNames.length) ? subjectNames : ['국어', '영어', '수학', '한국사', '통합사회', '통합과학', '과학탐구실험', '정보'];

  function josa(w) { var c = w.charCodeAt(w.length - 1); if (c < 0xAC00 || c > 0xD7A3) return w + '을(를)'; return w + ((c - 0xAC00) % 28 ? '을' : '를'); }
  function build() {
    var it = find(S.cmd), t = (S.topic || '').trim() || it[2];
    var body = it[4] ? it[4].replace('{t}', it[0] === 'SOCRATES' ? josa(t) : t) : it[0] + ' ' + t;
    var tail = [];
    if (S.lvl) tail.push('나는 고등학교 1학년이야' + (S.subj ? '(과목: ' + S.subj + ')' : '') + '. 고1 교과서 수준으로 맞춰 줘');
    tail.push('확실하지 않은 내용은 확실하지 않다고 말해 줘');
    return body + '\n\n(' + tail.join('. ') + '.)';
  }
  function href(p) {
    var A = window.SHIRO_AI;
    if (A && A.rawHref) return A.rawHref(p);
    var u = 'https://chatgpt.com/?q=' + encodeURIComponent(p); return u.length <= 6000 ? u : 'https://chatgpt.com/';
  }
  function copy(p, msg) {
    var A = window.SHIRO_AI;
    if (A && A.rawCopy) return A.rawCopy(p, msg);
    try { navigator.clipboard.writeText(p); if (typeof notice === 'function') notice(msg); } catch (er) {}
  }

  function view() {
    var it = find(S.cmd), p = build();
    var h = '<details class="card sc-card" id="study-commands"' + (S.open ? ' open' : '') + '><summary>⚡ 공부 명령어 — ChatGPT한테 이렇게 가르쳐 달라고 하기</summary>';
    h += '<p class="small"><a href="studylab.html" class="button-link" style="display:inline-block;padding:8px 12px;margin:3px 0 10px;border:1px solid #7764ef;border-radius:10px;font-weight:800">AI 학습실에서 70개 프롬프트 찾아보기 →</a></p>';
    h += '<p class="small">주제 앞에 명령어 한 단어만 붙이면 ChatGPT가 쉬운 설명·그림·예상 문제·질문식 수업으로 바꿔서 가르쳐 줘. <span class="muted">(ChatGPT 공식 기능은 아니고, 단어 뜻을 읽고 그 방식으로 답하는 거야.)</span></p>';
    var fav = top();
    if (fav.length) h += '<div class="sc-fav"><p class="sc-gname">⭐ 내가 자주 쓰는 명령어</p><div class="sc-chips">' + fav.map(function (c) { return '<button type="button" class="sc-mini' + (c === S.cmd ? ' on' : '') + '" data-sc-cmd="' + e(c) + '">' + e(c) + ' <small>' + S.uses[c] + '회</small></button>'; }).join('') + '</div></div>';
    h += '<details class="sc-route-d"' + (fav.length ? '' : ' open') + '><summary>처음이면 이 순서로</summary><div class="sc-route"><ol>' + ROUTE.map(function (r) {
      return '<li><span>' + e(r[1]) + '</span>' + r.slice(2).map(function (c) { return '<button type="button" class="sc-mini" data-sc-cmd="' + e(c) + '">' + e(c) + '</button>'; }).join('') + '</li>';
    }).join('') + '</ol></div></details>';
    h += '<div class="sc-form"><label>과목<select data-sc-subj><option value="">선택 안 함</option>' + SUBJ.map(function (s) { return '<option' + (S.subj === s ? ' selected' : '') + '>' + e(s) + '</option>'; }).join('') + '</select></label>';
    h += '<label>오늘 공부할 주제<input type="text" data-sc-topic maxlength="300" value="' + e(S.topic || '') + '" placeholder="예: ' + e(it[2]) + '"></label></div>';
    h += GROUPS.map(function (g) {
      return '<div class="sc-group"><p class="sc-gname">' + g.name + '</p><div class="sc-chips">' + g.items.map(function (x) {
        return '<button type="button" class="sc-chip' + (x[0] === S.cmd ? ' on' : '') + '" data-sc-cmd="' + e(x[0]) + '" aria-pressed="' + (x[0] === S.cmd) + '"><b>' + e(x[0]) + (x[3] ? ' 🎨' : '') + '</b><small>' + e(x[1]) + '</small></button>';
      }).join('') + '</div></div>';
    }).join('');
    h += '<label class="sc-lvl"><input type="checkbox" data-sc-lvl' + (S.lvl ? ' checked' : '') + '> 고1 수준으로 맞춰 달라고 같이 보내기</label>';
    h += '<div class="sc-out"><p class="sc-gname">보낼 문장</p><textarea readonly rows="5" aria-label="ChatGPT에 보낼 문장" data-sc-out>' + e(p) + '</textarea>';
    h += '<div class="actions"><button type="button" data-sc-copy>📋 복사</button><a class="primary button-link" data-sc-go href="' + e(href(p)) + '" target="_blank" rel="noopener">💬 ChatGPT에서 열기 ↗</a></div>';
    h += '<p class="muted small">입력창이 비어 있으면 붙여넣고 보내줘. 한 메시지에 명령어 하나씩 써야 결과 비교가 쉬워.' + (it[3] ? ' 🎨는 그림을 만들어서, 무료 요금제는 하루 그림 횟수에 한도가 있어.' : '') + '</p></div>';
    var fl = (FOLLOW[S.cmd] || []).concat(it[3] ? FOLLOW.img : []);
    if (fl.length) h += '<div class="sc-follow"><p class="sc-gname">같은 채팅에 이어서 보낼 말 (누르면 복사)</p><div class="sc-chips">' + fl.map(function (f) { return '<button type="button" class="sc-mini" data-sc-f="' + e(f) + '">' + e(f) + '</button>'; }).join('') + '</div></div>';
    h += '<details class="sc-tips"><summary>잘 쓰는 법</summary><ul>' +
      '<li>❌ 명령어만 보내기 → ✅ <b>명령어 + 한 칸 + 주제</b> (예: /handwritten 광합성)</li>' +
      '<li>그림은 <b>꼭 넣을 것</b>(이름표, 순서 번호)까지 같이 적어야 장식 같은 그림이 안 나와.</li>' +
      '<li>예상 문제는 외우지 말고 <b>먼저 풀고</b>, 틀린 단원만 교과서로 다시 읽기.</li>' +
      '<li>SOCRATES는 정답 달라고 하지 말고 <b>내 말로 먼저 답</b>하고, 막힐 때만 힌트.</li>' +
      '<li>필기·교과서 사진을 같이 올리면 그 범위 안에서 문제를 뽑아줘. 친구 이름·연락처는 가리고 올려.</li>' +
      '<li>답이 맞는지는 교과서·선생님 해설로 꼭 확인해. 수행평가는 대신 써 달라고 하지 말기.</li>' +
      '</ul></details></details>';
    return h;
  }

  function refresh(root) {
    var el = root.querySelector('#study-commands'); if (!el) return;
    var open = el.open; el.outerHTML = view();
    var n = root.querySelector('#study-commands'); if (n) n.open = open;
  }
  function softUpdate(root) {
    var p = build(), o = root.querySelector('[data-sc-out]'), g = root.querySelector('[data-sc-go]');
    if (o) o.value = p; if (g) g.href = href(p);
  }

  var prev = render;
  render = function () {
    prev();
    if (typeof tab === 'undefined' || tab !== 'review') return;
    var root = document.getElementById('content'); if (!root || root.querySelector('#study-commands')) return;
    var anchor = root.querySelector('#study-question-builder');
    if (anchor) anchor.insertAdjacentHTML('afterend', view()); else root.insertAdjacentHTML('beforeend', view());
  };

  document.addEventListener('click', function (ev) {
    var root = document.getElementById('content'); if (!root) return;
    var t = ev.target.closest && ev.target.closest('#study-commands [data-sc-cmd],#study-commands [data-sc-copy],#study-commands [data-sc-go],#study-commands [data-sc-f]');
    if (!t) return;
    if (t.hasAttribute('data-sc-cmd')) { S.cmd = t.getAttribute('data-sc-cmd'); save(S); refresh(root); var c = root.querySelector('.sc-out'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (t.hasAttribute('data-sc-copy')) { used(S.cmd); copy(build(), '복사했어. ChatGPT에 붙여넣어 📋'); refresh(root); return; }
    if (t.hasAttribute('data-sc-go')) { used(S.cmd); setTimeout(function () { refresh(root); }, 800); copy(build(), 'ChatGPT를 열게. 입력창이 비어 있으면 붙여넣기 💬'); return; }
    if (t.hasAttribute('data-sc-f')) { copy(t.getAttribute('data-sc-f'), '복사했어. 같은 채팅에 붙여넣어 📋'); }
  });
  document.addEventListener('input', function (ev) {
    if (!ev.target.closest || !ev.target.closest('#study-commands')) return;
    if (ev.target.hasAttribute('data-sc-topic')) { S.topic = ev.target.value; save(S); softUpdate(document.getElementById('content')); }
  });
  document.addEventListener('change', function (ev) {
    if (!ev.target.closest || !ev.target.closest('#study-commands')) return;
    if (ev.target.hasAttribute('data-sc-subj')) S.subj = ev.target.value;
    else if (ev.target.hasAttribute('data-sc-lvl')) S.lvl = ev.target.checked;
    else return;
    save(S); softUpdate(document.getElementById('content'));
  });
  document.addEventListener('toggle', function (ev) {
    if (ev.target && ev.target.id === 'study-commands') { S.open = ev.target.open; save(S); }
  }, true);

  // 스타일은 이 파일 하나로 끝나게 주입 (기존 card/button 스타일 위에 최소한만)
  var css = '#study-commands .sc-route{background:rgba(119,100,239,.07);border-radius:12px;padding:10px 12px;margin:10px 0}' +
    '#study-commands .sc-route ol{margin:6px 0 0;padding-left:18px}#study-commands .sc-route li{margin:4px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '#study-commands .sc-route li span{flex:1 1 100%;font-size:.9em}' +
    '#study-commands .sc-form{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin:10px 0}@media(max-width:480px){#study-commands .sc-form{grid-template-columns:1fr}}' +
    '#study-commands .sc-form input,#study-commands .sc-form select{width:100%;box-sizing:border-box}' +
    '#study-commands .sc-gname{font-weight:700;margin:12px 0 6px;font-size:.92em}' +
    '#study-commands .sc-chips{display:flex;flex-wrap:wrap;gap:6px}' +
    '#study-commands .sc-chip{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:8px 10px;border-radius:12px;border:1px solid rgba(119,100,239,.25);background:transparent;max-width:100%;flex:1 1 140px;min-height:44px}' +
    '#study-commands .sc-chip b{font-size:.88em;word-break:break-all}#study-commands .sc-chip small{opacity:.75;font-size:.78em;margin-top:2px}' +
    '#study-commands .sc-chip.on{background:#7764ef;color:#fff;border-color:#7764ef}#study-commands .sc-chip.on small{opacity:.9}' +
    '#study-commands .sc-mini.on{background:#7764ef;color:#fff}#study-commands .sc-mini small{opacity:.7;font-size:.85em}#study-commands .sc-route-d{margin:10px 0}#study-commands .sc-route-d>summary{font-weight:700;cursor:pointer}#study-commands .sc-route-d .sc-route{margin-top:6px}' +
    '#study-commands .sc-mini{padding:4px 10px;border-radius:999px;font-size:.82em;min-height:32px}' +
    '#study-commands .sc-lvl{display:flex;gap:6px;align-items:center;margin:12px 0 0;font-size:.9em}' +
    '#study-commands .sc-out textarea{width:100%;box-sizing:border-box;font-size:.92em}' +
    '#study-commands .sc-out .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}' +
    '#study-commands .sc-tips{margin-top:12px}#study-commands .sc-tips ul{padding-left:18px;margin:6px 0}#study-commands .sc-tips li{margin:4px 0;font-size:.9em}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  window.FC_STUDY_CMD = { open: function (cmd) {
    if (cmd && find(cmd)) { S.cmd = cmd; }
    S.open = true; save(S);
    var root = document.getElementById('content'), el = root && root.querySelector('#study-commands');
    if (el) { refresh(root); el = root.querySelector('#study-commands'); el.open = true; var i = el.querySelector('[data-sc-topic]'); if (i && !i.value) setTimeout(function () { try { i.focus({ preventScroll: true }); } catch (er) {} }, 300); }
  } };

  if (typeof tab !== 'undefined' && tab === 'review') render();
})();
