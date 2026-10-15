/* 오늘 화면 정리 (2026-10-16 점검): 카드가 겹쳐 보이는 것만 정리, 기능은 그대로
   - 승준: "오늘 한눈에"는 ⏰ 앞으로 3시간 아래로, 다음 일정 칸은 3시간 카드와 겹쳐 숨김(마감·완료만)
   - 승준: 3칸 할 일 추가 폼은 "＋ 할 일 추가"로 접기(할 일이 없으면 펼침)
   - 엄마: 시험 카드가 두 번 나오지 않게 승준용 "다가오는 시험" 카드는 뺌 */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  var openAdd = false;
  var prev = render;
  render = function () {
    prev();
    if (tab !== 'today') return;
    var root = document.getElementById('content'); if (!root) return;
    if (isParent()) { var be = root.querySelector('#bo-exam'); if (be && root.querySelector('.pv-ex, .pv-sec')) be.remove(); return; }
    var brief = root.querySelector('#study-brief'), nx = root.querySelector('#nx-3h'), hero = root.querySelector('.hero-heal');
    if (brief && nx) { brief.classList.add('sb-has-3h'); nx.insertAdjacentElement('afterend', brief); }
    else if (brief && hero) hero.insertAdjacentElement('afterend', brief);
    var form = root.querySelector('form.sb-quick');
    if (form && !form.closest('details')) {
      var hasTasks = state.tasks.some(function (x) { return x.date === today(); });
      var d = document.createElement('details'); d.className = 'tt-add'; if (openAdd || !hasTasks) d.open = true;
      d.innerHTML = '<summary>＋ 할 일 추가</summary>';
      form.parentNode.insertBefore(d, form); d.appendChild(form);
      d.addEventListener('toggle', function () { openAdd = d.open; });
    }
  };
  var css = document.createElement('style');
  css.textContent = '#study-brief.sb-has-3h .sb-summary-grid>.sb-cell:first-child{display:none}#study-brief.sb-has-3h .sb-summary-grid{grid-template-columns:1fr!important}' +
    '.tt-add{margin-top:10px;border-top:1.5px dashed var(--line,#e6e3f2);padding-top:8px}.tt-add>summary{cursor:pointer;list-style:none;font-weight:700;color:var(--violet,#5b45d6);padding:8px 2px;min-height:40px;display:flex;align-items:center}.tt-add>summary::-webkit-details-marker{display:none}.tt-add[open]>summary{color:#6b6880}';
  document.head.appendChild(css);
  render();
})();
