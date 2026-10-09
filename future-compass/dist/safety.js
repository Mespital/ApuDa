/* 설정: 🔐 엄마 확인 번호(엄마만) + 🔒 내 자료는 어디에? (모두)
   엄마 확인 번호 = 승준 폰에서 "엄마로 들어가기"를 누를 때 한 번 더 묻는 번호. 가족 공유로 모든 폰에 같이 적용. */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function G() { return typeof PinGate !== 'undefined' && PinGate.guard; }

  function guardCard() {
    var g = G(); if (!g) return '';
    var on = g.on();
    return '<section class="card" id="set-guard"><h2>🔐 엄마 확인 번호</h2>' +
      '<p class="muted small">켜면 승준 폰에서 "엄마로 들어가기"를 누를 때 이 번호를 한 번 더 물어봐요. 가족 비밀번호와 다른 4~6자리로 정해 주세요. 가족 모든 폰에 같이 적용돼요.</p>' +
      '<p class="sf-st">' + (on ? '✅ 켜져 있어요' : '꺼져 있어요') + '</p>' +
      '<form data-sf-guard class="sf-form"><input name="a" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="새 번호 (4~6자리)" aria-label="새 엄마 확인 번호"><input name="b" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="한 번 더" aria-label="번호 확인"><button class="primary">' + (on ? '바꾸기' : '켜기') + '</button></form>' +
      (on ? '<button type="button" data-sf-guard-off>끄기</button>' : '') +
      '<p class="muted small">가족끼리 쓰는 앱의 "잠금장치" 수준이에요. 폰을 직접 만지는 걸 막는 정도이고, 전문적인 해킹 방어는 아니에요.</p></section>';
  }

  function provText() {
    var l = (typeof FamilySync !== 'undefined' && FamilySync.live && FamilySync.live()) || null, p = l && l.prov;
    if (!l) return '가족 공유에 연결하면 확인할 수 있어.';
    if (p === 'ollama') return '지금은 <b>우리 서버 안의 무료 AI</b>를 써. 질문·노트 글이 다른 회사로 나가지 않아.';
    if (p === 'claude') return '지금은 <b>Claude(Anthropic)</b>를 써. 질문·노트 글이 Anthropic으로 보내져서 답을 만들어.';
    if (p === 'openai') return '지금은 <b>ChatGPT(OpenAI)</b>를 써. 질문·노트 글이 OpenAI로 보내져서 답을 만들어.';
    return l.ai ? 'AI가 켜져 있어 (종류 확인 중).' : 'AI가 아직 꺼져 있어. 준비된 안내로만 답해.';
  }
  function dataCard() {
    var rows = [
      ['📱 이 폰', '할 일·시험·노트·사진·타이머 기록은 먼저 이 폰(브라우저)에 저장돼. 인터넷이 끊겨도 쓸 수 있고, 연결되면 가족 서버로 올라가.'],
      ['👨‍👩‍👦 가족 서버', '가족 공유를 켜면 기록과 수업 사진 복사본이 우리 가족 전용 공간(Netlify)에 올라가. 가족 비밀번호로 연결한 기기만 읽을 수 있어.'],
      ['⚡ 실시간 서버', '다른 폰에 "바뀌었어" 신호만 보내고 기록 내용은 저장하지 않아. 흰둥이 설정에 넣은 공부 자료(PDF 글)는 여기 저장돼.'],
      ['📷 사진 글자 읽기', '폰 안에서 처리해. 사진 자체는 AI로 보내지 않아. 읽기 어려운 곳은 지어내지 않고 "(사진 확인 필요)"로 표시하게 했지만, 틀릴 수 있으니 "원문 보기"로 확인해줘.'],
      ['🧠 AI 정리·질문', '보내는 건 글뿐(질문, 사진에서 읽은 글, 오늘 요약). ' + provText()],
      ['🗑 지우는 법', '노트는 복습 탭에서 × (이 폰 + 가족 서버 사진 같이 지워져, 다른 폰에 이미 받아둔 사진은 그 폰에 남을 수 있어) · 공부 자료는 흰둥이 설정에서 × · 이 폰 전체는 잠금 화면 "비밀번호 찾기 → 이 기기 기록 모두 지우기" · 가족 서버 전체 삭제는 보호자가 관리 화면에서.'],
      ['🔄 두 폰에서 동시에 고치면', '목록(할 일·시험·노트)은 양쪽 것을 합쳐서 남기고, 같은 항목을 둘 다 고쳤으면 나중에 올린 폰 것이 남아.'],
      ['🔑 비밀번호', '가족 비밀번호는 15분에 10번, 하루에 30번 틀리면 막혀(하루 한도면 24시간 + 엄마 폰 알림). 번호를 바꾸면 다른 폰도 다음에 열 때 새 번호가 필요해.']
    ];
    return '<section class="card" id="set-data"><h2>🔒 내 자료는 어디에?</h2><ul class="sf-list">' + rows.map(function (r) { return '<li><b>' + r[0] + '</b><span>' + r[1] + '</span></li>'; }).join('') + '</ul></section>';
  }

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'settings') return;
    var root = document.getElementById('content'), anchor = document.getElementById('set-family') || document.getElementById('set-links');
    var html = (isParent() ? guardCard() : '') + dataCard();
    if (anchor) anchor.insertAdjacentHTML('afterend', html); else root.insertAdjacentHTML('beforeend', html);
    var nav = document.querySelector('.set-jump');
    if (nav && !nav.querySelector('[data-jump="set-data"]')) nav.insertAdjacentHTML('beforeend', (isParent() ? '<a href="#set-guard" data-jump="set-guard">엄마 확인</a>' : '') + '<a href="#set-data" data-jump="set-data">내 자료</a>');
  };

  function push() { if (typeof FamilySync !== 'undefined' && FamilySync.pushNow) FamilySync.pushNow(); }
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.matches || !f.matches('[data-sf-guard]')) return;
    e.preventDefault(); e.stopPropagation();
    var a = f.elements.a.value.replace(/\D/g, ''), b = f.elements.b.value.replace(/\D/g, '');
    if (a.length < 4) { notice('4~6자리 숫자로 정해 주세요.'); return; }
    if (a !== b) { notice('두 번호가 달라요. 다시 넣어 주세요.'); return; }
    var go = function () { G().set(a).then(function () { push(); notice('엄마 확인 번호를 저장했어요. 가족 모든 폰에 적용돼요 🔐'); render(); }); };
    if (G().on()) G().ask(go); else go();
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sf-guard-off]'); if (!b) return;
    G().ask(function () { if (!confirm('엄마 확인 번호를 끌까요? 승준 폰에서도 바로 엄마 화면을 열 수 있게 돼요.')) return; G().set('').then(function () { push(); notice('엄마 확인 번호를 껐어요.'); render(); }); });
  });

  var css = document.createElement('style');
  css.textContent = '.sf-st{margin:6px 0;font-weight:700;color:#2a2550}.sf-form{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;margin:6px 0}.sf-form input{min-width:0}#set-guard>button{margin-top:4px}' +
    '.sf-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}.sf-list li{display:grid;gap:2px;font-size:14px;line-height:1.5}.sf-list b{font-size:14px;color:#2a2550}.sf-list span{color:#4f4b66}';
  document.head.appendChild(css);
  render();
})();
