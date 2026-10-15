/* 복습은 "🧠 기억 확인" 하나로 (2026-10-16 감수 반영)
   - 복습 탭 맨 위: 오늘 기억 확인할 것 + 다음 일정
   - 예전 "오늘 재도전" 카드는 빼고, "다시 보기 내일/3일/7일" 버튼 자리는 다음 확인 날짜·지난 결과 표시로 바꿈
   - 복습 목록의 "오늘 복습" 버튼은 바로 기억 확인 열기로
   날짜 조절은 review-recall.js(잘 앎/헷갈림/모름)가 한다. 기존 기록은 그대로 둔다. */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function P() { return window.FC_PLANNER ? FC_PLANNER.get() : {}; }
  function md(d) { var w = '일월화수목금토'[new Date(d + 'T12:00:00Z').getUTCDay()]; return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)) + '(' + w + ')'; }
  var RL = { good: '😀 잘 앎', meh: '🤔 헷갈림', bad: '😵 모름' };
  function nextOf(id) {
    var p = P(), t = today(), done = p.againDone || {};
    return (p.again && p.again[id] || []).filter(function (d) { return d > t && !done[id + '@' + d]; }).sort()[0] || '';
  }
  function lastOf(id) { var h = (P().recall || {})[id] || []; return h[h.length - 1] || null; }

  function hubCard() {
    var due = window.FC_PLANNER && FC_PLANNER.again ? FC_PLANNER.again() : [], t = today();
    var soon = state.reviews.filter(function (r) { return !r.done; }).map(function (r) { return { r: r, d: nextOf(r.id) }; })
      .filter(function (x) { return x.d && !due.some(function (a) { return a.r.id === x.r.id; }); }).sort(function (a, b) { return a.d.localeCompare(b.d); }).slice(0, 4);
    var h = '<section class="card rh-card" id="rh-today"><h2>🧠 오늘 기억 확인' + (due.length ? ' <small>' + due.length + '개</small>' : '') + '</h2>';
    h += due.length ? '<ul class="rh-list">' + due.map(function (a) {
      var l = lastOf(a.r.id);
      return '<li><div><b>' + esc(a.r.title) + '</b><small>' + esc([a.r.subject, l ? '지난번 ' + RL[l.r] : '처음 확인'].filter(Boolean).join(' · ')) + '</small></div><button type="button" class="primary" data-rc-open="' + esc(a.r.id) + '" data-d="' + a.date + '">확인하기</button></li>';
    }).join('') + '</ul>' : '<p class="muted small rh-empty">오늘 확인할 건 다 했어. 👍</p>';
    if (soon.length) h += '<p class="rh-next-h">다음 확인</p><ul class="rh-soon">' + soon.map(function (x) { return '<li><span>' + md(x.d) + '</span>' + esc(x.r.title) + (x.r.subject ? ' <small>' + esc(x.r.subject) + '</small>' : '') + '</li>'; }).join('') + '</ul>';
    h += '<p class="muted small rh-how">노트를 덮고 답해본 뒤 잘 앎·헷갈림·모름을 고르면, 다음 확인 날짜가 알아서 정해져. (잘 앎은 더 나중에, 모름은 내일)</p></section>';
    return h;
  }

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'review') return;
    var root = document.getElementById('content'); if (!root) return;
    // 예전 "오늘 재도전/○○ 복습" 카드(study-plus) 빼기
    root.querySelectorAll('details.card > summary').forEach(function (s) { if (/^🔁/.test(s.textContent.trim())) s.parentElement.remove(); });
    if (isParent()) return;
    // 다시 보기 날짜 버튼 → 다음 확인 표시
    root.querySelectorAll('.pl-again').forEach(function (el) {
      var b = el.querySelector('[data-pl-ag]'); var id = b && b.dataset.plAg; if (!id) { el.remove(); return; }
      var n = nextOf(id), l = lastOf(id), r = state.reviews.find(function (x) { return x.id === id; });
      el.className = 'rh-row';
      var dueNow = window.FC_PLANNER && FC_PLANNER.again && FC_PLANNER.again().some(function (a) { return a.r.id === id; });
      el.innerHTML = '<span>' + (dueNow ? '🧠 오늘 확인할 차례' : n ? '🧠 다음 확인 ' + md(n) : r && r.done ? '복습 끝' : '🧠 예정 없음') + (l ? ' · 지난번 ' + RL[l.r] : '') + '</span><button type="button" data-rc-open="' + esc(id) + '" data-d="' + today() + '">지금 확인</button>';
    });
    // 오늘 복습(할 일 만들기) 버튼 → 바로 기억 확인
    root.querySelectorAll('button[data-task]').forEach(function (b) {
      var id = b.dataset.task; if (!state.reviews.some(function (x) { return x.id === id; })) return;
      var nb = document.createElement('button'); nb.type = 'button'; nb.textContent = '🧠 확인'; nb.dataset.rcOpen = id; nb.dataset.d = today(); b.replaceWith(nb);
    });
    // 입력 카드 이름 정리
    root.querySelectorAll('h2').forEach(function (h) {
      if (/진짜 이해했는지 확인하기|내 말로 다시 설명하기/.test(h.textContent)) { h.textContent = '＋ 복습할 것 추가'; var p0 = h.nextElementSibling; if (p0 && p0.classList.contains('muted')) p0.textContent = '수업에서 헷갈린 걸 적어두면 내일·3일·7일 뒤에 🧠 기억 확인으로 나와.'; }
      if (/나의 복습 메모/.test(h.textContent)) h.textContent = '📚 복습 목록';
    });
    if (!root.querySelector('#rh-today')) root.insertAdjacentHTML('afterbegin', hubCard());
  };

  var css = document.createElement('style');
  css.textContent = '.rh-card h2 small{font-size:13px;color:var(--violet,#5b45d6);margin-left:4px}.rh-list{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px}.rh-list li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:#f5f3ff}.rh-list li>div{flex:1;min-width:0;display:grid}.rh-list b{font-size:15px;color:var(--night,#262150)}.rh-list small{font-size:12.5px;color:#6b6880}.rh-list button{min-height:40px!important;padding:6px 14px!important;border-radius:12px!important;flex:none}' +
    '.rh-empty{margin:8px 0 0}.rh-next-h{margin:12px 0 4px;font-size:13px;font-weight:700;color:#4f4b66}.rh-soon{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:14px}.rh-soon span{display:inline-block;min-width:64px;font-weight:700;color:var(--night,#262150);font-variant-numeric:tabular-nums}.rh-soon small{color:#6b6880}.rh-how{margin:10px 0 0}' +
    '.rh-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 0 10px 34px;font-size:12.5px;color:#4f4b66}.rh-row button{min-height:34px!important;padding:4px 12px!important;border-radius:999px!important;font-size:13px}';
  document.head.appendChild(css);
  render();
})();
