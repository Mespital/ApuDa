/* 🎨 과목 색 알약 (2026-10-20, 디자인 점검표 P2-7 · Jitter 'Color Pills: Reveal' 톤)
   같은 과목은 어느 화면에서나 같은 색. 색만으로 구분하지 않게 과목 이름 글자는 그대로 둔다.
   적용: 학교 소식 과목 라벨(.sl-sub) · 기말 플랜 과목 이름 · 시간표 칸 · 주간 일정 수업 줄
   밤 화면은 dark-mode.js 가 이 색도 남색 톤으로 바꾼다. */
(function () {
  'use strict';
  if (typeof render !== 'function') return;
  var MAP = [
    ['kor', /국어|문학|화법|작문|언어/], ['math', /수학/], ['eng', /영어|영A|영B/],
    ['his', /한국사|역사/], ['sci', /과학|통과|물리|화학|생명|지구/], ['soc', /사회|통사|경제|정치|윤리|지리/],
    ['art', /음악|미술|체육|스포츠|예술/]
  ];
  function key(t) { t = String(t || ''); for (var i = 0; i < MAP.length; i++) if (MAP[i][1].test(t)) return MAP[i][0]; return 'etc'; }
  window.FC_SUBJECT_KEY = key;
  function paint(root) {
    root.querySelectorAll('.sl-sub').forEach(function (el) { el.dataset.sub = key(el.textContent); el.classList.add('pill'); });
    root.querySelectorAll('.ep-day li b').forEach(function (el) { if (!el.dataset.sub) { el.dataset.sub = key(el.textContent); el.classList.add('sub-dot'); } });
    root.querySelectorAll('table.tt tr:not(.ac) td').forEach(function (el) { var t = el.textContent.trim(); if (t && !el.dataset.sub) el.dataset.sub = key(t); });
  }
  var prev = render;
  render = function () { prev(); var c = document.getElementById('content'); if (c) try { paint(c); } catch (e) {} };

  var C = { kor: ['#ffe4e1', '#9b2c2c'], math: ['#e0ecff', '#1e4fa3'], eng: ['#e3f6e8', '#1f6b3a'], soc: ['#fff1d6', '#8a5a00'],
    sci: ['#e1f5f5', '#11676b'], his: ['#f1e6ff', '#5b2a9e'], art: ['#ffe6f3', '#9b2463'], etc: ['#eef0f4', '#4a5160'] };
  var css = ':root{' + Object.keys(C).map(function (k) { return '--sub-' + k + ':' + C[k][0] + ';--sub-' + k + '-ink:' + C[k][1]; }).join(';') + '}';
  Object.keys(C).forEach(function (k) {
    css += 'body.app .sl-sub[data-sub=' + k + ']{background:var(--sub-' + k + ')!important;color:var(--sub-' + k + '-ink)!important}';
    css += 'body.app .sub-dot[data-sub=' + k + ']::before{background:var(--sub-' + k + '-ink)}';
    css += 'body.app table.tt td[data-sub=' + k + ']:not(.now){background:color-mix(in srgb,var(--sub-' + k + ') 55%,transparent)!important}';
    css += 'body.app table.tt td[data-sub=' + k + '].now{box-shadow:inset 0 0 0 999px color-mix(in srgb,var(--sub-' + k + ') 70%,transparent)}';
    // 밤 화면: 진한 바탕 + 밝은 글자 (밝은 알약이 그대로 남아 글자가 안 보이던 문제 방지)
    css += 'html.fc-dark body.app .sl-sub[data-sub=' + k + ']{background:color-mix(in srgb,var(--sub-' + k + '-ink) 55%,#0f1229)!important;color:#fff!important}';
    css += 'html.fc-dark body.app table.tt td[data-sub=' + k + ']:not(.now){background:color-mix(in srgb,var(--sub-' + k + '-ink) 28%,transparent)!important}';
    css += 'html.fc-dark body.app table.tt td[data-sub=' + k + '].now{box-shadow:inset 0 0 0 999px color-mix(in srgb,var(--sub-' + k + '-ink) 45%,transparent)}';
    css += 'html.fc-dark body.app .sub-dot[data-sub=' + k + ']::before{background:color-mix(in srgb,var(--sub-' + k + '-ink) 50%,#fff)}';
  });
  css += 'body.app .sl-sub.pill{border-radius:999px!important;padding:3px 10px!important;font-weight:800}' +
    'body.app .sub-dot::before{content:"";display:inline-block;width:8px;height:8px;border-radius:999px;margin:0 5px 1px 0;vertical-align:middle}' +
    'body.app table.tt td[data-sub]{border-radius:8px}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
})();
