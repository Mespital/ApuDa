/* ApuDa 홈 길찾기(v27)
   - 상황 선택(data-qs)을 누르면 페이지를 떠나지 않고 맞는 층을 열고 안내 배너를 띄운다.
   - 상황 시트(모바일)에 엘리베이터 줄, 시트·데스크톱 안내에 머릿돌을 붙인다.
   - 건물 왼쪽 아래 비상구 표지 → 바로 진료가 필요한 신호 안내.
   층 열기는 index.html의 기존 #floor-N 해시 처리를 그대로 쓴다. 2F 서재·책 데이터는 건드리지 않는다. */
(function () {
  'use strict';
  if (!document.getElementById('frame')) return;

  var SITUATION = {
    screening: { floor: 1, text: '1층에서 위험도·검진부터' },
    diagnosed: { floor: 2, text: '2층 서재에서 내 암종 고르기' },
    treatment: { floor: 4, text: '4층에서 치료 기록 챙기기' },
    caregiver: { floor: 3, text: '3층에서 받을 지원 확인', link: { href: '/about/#caregiver', label: '보호자 안내' } }
  };

  function track(name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} }

  function openFloor(f) {
    var h = '#floor-' + f;
    if (location.hash === h) history.replaceState(null, '', location.pathname);
    location.hash = h;
  }

  /* ── 추천 배너 ── */
  var reco = document.createElement('div');
  reco.id = 'wfReco';
  reco.setAttribute('role', 'status');
  reco.setAttribute('aria-live', 'polite');
  document.body.appendChild(reco);
  var recoTimer = null;
  function hideReco() { reco.classList.remove('on'); }
  function showReco(s) {
    reco.innerHTML = '';
    var t = document.createElement('span'); t.textContent = s.text; reco.appendChild(t);
    if (s.link) { var a = document.createElement('a'); a.href = s.link.href; a.textContent = s.link.label; reco.appendChild(a); }
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', '안내 닫기'); x.textContent = '×';
    x.addEventListener('click', hideReco); reco.appendChild(x);
    clearTimeout(recoTimer);
    requestAnimationFrame(function () { reco.classList.add('on'); });
    recoTimer = setTimeout(hideReco, 7000);
  }
  /* 층 패널이 닫히면 배너도 닫는다 */
  new MutationObserver(function () { if (!document.body.classList.contains('open')) hideReco(); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ── 상황 선택 → 층 점등 ── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-qs]'), function (a) {
    var s = SITUATION[a.dataset.qs];
    if (!s) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // 새 탭 열기는 원래 링크대로
      e.preventDefault();
      openFloor(s.floor);
      setTimeout(function () { showReco(s); }, 500);
      track('home_situation_floor', { situation: a.dataset.qs, floor: s.floor });
    });
  });

  /* ── 머릿돌 ── */
  var STONE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5670" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/></svg>' +
    '<span><b>머릿돌</b> · 모든 정보에 출처 표기 · 지원 정보 매월 갱신<br>아프다는 정보 제공 서비스예요. 진단·처방은 의료진과 상의하세요.</span>';
  function addStone(parent) {
    if (!parent || parent.querySelector('.wf-stone')) return;
    var p = document.createElement('p'); p.className = 'wf-stone'; p.innerHTML = STONE; parent.appendChild(p);
  }
  addStone(document.getElementById('desktopGuide'));

  /* ── 상황 시트: 엘리베이터 줄 + 머릿돌 ── */
  var card = document.querySelector('#qsSheet .qs-card');
  if (card) {
    var lift = document.createElement('div');
    lift.className = 'wf-lift';
    lift.setAttribute('role', 'group');
    lift.setAttribute('aria-label', '엘리베이터 — 층 바로 가기');
    lift.innerHTML = '<span class="wf-lift-label">엘리베이터</span><span class="wf-lift-btns">' +
      [1, 2, 3, 4, 5].map(function (f) { return '<button type="button" data-wf-floor="' + f + '" aria-label="' + f + '층으로">' + f + 'F</button>'; }).join('') +
      '</span>';
    var foot = card.querySelector('.qs-foot');
    card.insertBefore(lift, foot || null);
    var mini = document.createElement('p'); mini.className = 'wf-stone wf-stone-mini';
    mini.innerHTML = '<b>머릿돌</b>&nbsp;출처 표기 · 매월 갱신 · 진단·처방은 의료진과 상의';
    card.appendChild(mini);
    lift.addEventListener('click', function (e) {
      var b = e.target.closest('[data-wf-floor]');
      if (!b) return;
      var x = document.getElementById('qsDismissX');
      if (x) x.click();
      openFloor(+b.dataset.wfFloor);
      track('home_elevator', { floor: +b.dataset.wfFloor, from: 'sheet' });
    });
  }

  /* ── 비상구 ── */
  var frame = document.getElementById('frame');
  var exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'wf-exit';
  exitBtn.setAttribute('aria-haspopup', 'dialog');
  exitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4" r="2"/><path d="M10 21l2-6 3 3v3M7 12l3-3 4 1 3 3M12 15l-2-3"/></svg><span>비상구</span>';
  frame.appendChild(exitBtn);

  var pop = document.createElement('div');
  pop.id = 'wfExitPop';
  pop.hidden = true;
  pop.innerHTML =
    '<div class="wf-back" data-wf-close></div>' +
    '<div class="wf-box" role="dialog" aria-modal="true" aria-labelledby="wfExitTitle">' +
      '<div class="wf-head"><h2 id="wfExitTitle">비상구 · 지금 바로 진료가 필요할 때</h2>' +
      '<button type="button" data-wf-close aria-label="닫기">×</button></div>' +
      '<div class="wf-body">' +
        '<p>아래 같은 증상이 있으면 정보를 찾기보다 먼저 119에 전화하거나 응급실로 가세요.</p>' +
        '<ul><li>숨이 몹시 차거나 가슴이 아플 때</li><li>피를 토하거나 검은 변·피 섞인 변을 볼 때</li>' +
        '<li>갑자기 한쪽 팔다리에 힘이 빠지거나 말이 어눌할 때</li><li>항암 치료 중 38℃ 이상 열이 날 때</li>' +
        '<li>의식이 흐려지거나 경련이 있을 때</li></ul>' +
        '<div class="wf-acts"><a class="wf-call" href="tel:119">119 전화</a>' +
        '<a class="wf-er" href="https://www.e-gen.or.kr/egen/search_emergency_room.do" target="_blank" rel="noopener">응급실 찾기</a></div>' +
        '<small>응급실 찾기는 중앙응급의료센터 응급의료포털(E-Gen)로 연결됩니다. 치료 중이라면 담당 병원이 안내한 연락처를 먼저 확인하세요. 이 안내는 일반 정보이며 진료를 대신하지 않습니다.</small>' +
      '</div>' +
    '</div>';
  document.body.appendChild(pop);

  var lastFocus = null;
  function openExit() {
    lastFocus = document.activeElement;
    pop.hidden = false;
    document.body.classList.add('wf-exit-on');
    exitBtn.setAttribute('aria-expanded', 'true');
    var c = pop.querySelector('.wf-head button'); if (c) c.focus();
    track('home_exit_open');
  }
  function closeExit() {
    pop.hidden = true;
    document.body.classList.remove('wf-exit-on');
    exitBtn.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  exitBtn.addEventListener('click', function (e) { e.stopPropagation(); openExit(); });
  pop.addEventListener('click', function (e) { if (e.target.closest('[data-wf-close]')) closeExit(); });
  pop.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeExit(); return; }
    if (e.key !== 'Tab') return;
    var f = pop.querySelectorAll('button, a[href]'); var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) {
    exitBtn.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true });
  });
})();
