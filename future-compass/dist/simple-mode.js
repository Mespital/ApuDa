/* ✨ 간단하게 (2026-10-21, 승준 "쓰기 복잡해")
   1) 1분 말하기: 과목 고르고 → 큰 녹음 버튼 하나. 주제·보관함·받아쓰기·전달 방법·저장 옵션은 "다른 방법 · 설정" 안으로
      (녹음이 끝나면 자동으로 저장·정리·Drive. 자동을 끈 사람에게는 처음부터 전체 화면)
   2) 오늘: 배너 → 오늘 배운 것 남기기 → 앞으로 3시간 → 할 일 → 시험. 수행평가·수업 전 1분·한눈에는 "더 보기" 안으로
   기능은 그대로, 보이는 순서와 양만 바꾼다. */
(function () {
  'use strict';
  if (typeof render !== 'function') return;
  var FULL = 'fc-tn-full';
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function pref() { try { return localStorage.getItem(FULL) === '1'; } catch (e) { return false; } }
  function autoOn() { try { return localStorage.getItem('fc-tn-auto') !== '0'; } catch (e) { return true; } }

  /* ---------- 1분 말하기 시트 ---------- */
  function simplify(sheet) {
    if (!sheet || sheet.dataset.simple || sheet.getAttribute('aria-label') !== '1분 말하기') return;
    sheet.dataset.simple = '1';
    var panel = sheet.querySelector('.tn-panel'); if (!panel) return;
    var rec = panel.querySelector('.tn-rec > b');
    if (rec && !panel.querySelector('.tn-hint')) rec.insertAdjacentHTML('afterend', '<p class="tn-hint">핵심 하나 → 왜·예시 → 헷갈린 것, 이 순서로 말해봐.<br>끝나면 정리랑 Drive 저장은 알아서 해줄게.</p>');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'tn-full-btn'; panel.appendChild(b);
    function set(full) { sheet.classList.toggle('tn-simple', !full); b.textContent = full ? '▴ 간단하게 보기' : '⚙️ 다른 방법 · 주제 적기 · 저장 옵션'; b.setAttribute('aria-expanded', String(full)); }
    set(pref() || !autoOn());
    b.addEventListener('click', function () { var full = sheet.classList.contains('tn-simple'); set(full); try { localStorage.setItem(FULL, full ? '1' : '0'); } catch (e) {} if (full) setTimeout(function () { b.scrollIntoView({ block: 'nearest' }); }, 50); });
  }
  new MutationObserver(function (list) {
    list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList.contains('tn-sheet')) simplify(n); }); });
  }).observe(document.body, { childList: true });

  /* ---------- 오늘 화면 ---------- */
  var prev = render;
  render = function () {
    prev();
    if (typeof tab === 'undefined' || tab !== 'today' || isParent()) return;
    var root = document.getElementById('content'); if (!root) return;
    var hero = root.querySelector('.hero-heal'), tn = root.querySelector(':scope > .tn-card');
    if (hero && tn) hero.insertAdjacentElement('afterend', tn);
    var more = root.querySelector('.more-cards'), box = more && more.querySelector('.more-in');
    if (box) {
      var moved = [];
      [['.db-entry', '한눈에'], ['.sl-today', '수행평가'], ['#bo-pre', '수업 전 1분']].reverse().forEach(function (x) {
        var el = root.querySelector(':scope > ' + x[0]); if (el) { box.insertAdjacentElement('afterbegin', el); moved.unshift(x[1]); }
      });
      var sm = more.querySelector('summary small');
      if (sm && moved.length && !sm.dataset.simple) { sm.dataset.simple = '1'; sm.textContent = moved.concat(sm.textContent.split(' · ')).slice(0, 4).join(' · ') + ' 등'; }
    }
  };

  var css = document.createElement('style');
  css.textContent =
    /* 시트: 간단 모드에서 숨기는 것 */
    '.tn-simple :is(label[for=tn-topic],.tn-topic,.tn-rec .tn-guide,.tn-rec>p:not(.tn-hint),.tn-local,.av-box>b,.av-box>p.small:not([role=status]),.av-settings,.av-history,.tn-handoff,.tn-manual,.tn-again,.tn-save-row,.tn-ls-sum){display:none!important}' +
    '.tn-sheet:not(.tn-simple) .tn-hint{display:none}' +
    '.tn-simple .tn-rec{background:transparent;padding:4px 0 0;margin-top:12px}.tn-simple .tn-rec>b{font-size:17px}' +
    '.tn-hint{margin:6px 0 0;font-size:13.5px;line-height:1.6;color:var(--ink-2)}' +
    '.tn-simple .av-box{border:0;background:transparent;padding:4px 0;margin:4px 0 0;text-align:center}' +
    '.tn-simple .av-clock{font-size:44px!important;margin:6px 0 10px}' +
    '.tn-simple [data-av-record]{width:100%;min-height:68px!important;border-radius:999px!important;font-size:20px!important;font-weight:800;background:var(--accent)!important;border-color:var(--accent)!important;color:var(--u-on-solid,#fff)!important;box-shadow:var(--sh-2)}' +
    '.tn-simple [data-av-record][aria-pressed=true]{background:var(--exam)!important;border-color:var(--exam)!important}' +
    '.tn-simple .tn-lessons{grid-template-columns:repeat(3,1fr)}.tn-simple .tn-ls{min-height:56px!important}' +
    '.tn-full-btn{display:block;width:100%;margin:16px 0 4px;min-height:var(--tap);background:transparent!important;border:0!important;color:var(--ink-3)!important;font-size:13.5px;font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
    /* 오늘: 설명 줄 줄이기 */
    'body.app #content>.tn-card>p.muted{display:none}body.app #bo-exam .et-tip{display:none}';
  document.head.appendChild(css);
})();
