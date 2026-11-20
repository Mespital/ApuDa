/* 기출 학습 입구: 공부방 기록과 PIN 설정은 읽거나 변경하지 않습니다. */
(function () {
  'use strict';
  var KEY = 'gichul-lab-study-v1';
  function progress() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      var a = d && Array.isArray(d.attempts) ? d.attempts : [];
      return a.filter(function (x) { return !x.assisted; }).length;
    } catch (e) { return 0; }
  }
  function mount() {
    var old = document.getElementById('study-csat-entry');
    if (old) old.remove();
    var current = typeof tab === 'string' ? tab : location.hash.slice(1) || 'today';
    if (current !== 'today' && current !== 'review') return;
    var content = document.querySelector('#content');
    if (!content) return;
    var entry = document.createElement('section');
    entry.id = 'study-csat-entry';
    entry.className = 'card csat-entry';
    entry.setAttribute('data-keep-home', '');
    entry.setAttribute('aria-labelledby', 'csat-entry-title');
    var count = progress();
    entry.innerHTML = '<div class="csat-entry-top"><span class="csat-entry-icon" aria-hidden="true">📚</span><div><p class="csat-entry-eyebrow">수능 전 과목</p><h2 id="csat-entry-title">기출을 보고, 내 것으로 만들기</h2></div></div>' +
      '<p>국어·수학·영어·한국사부터 탐구·제2외국어·한문까지. 원문을 확인하고 개념과 풀이를 연결해 봐.</p>' +
      '<div class="csat-entry-links"><a href="gichul/index.html#archive"><b>기출 원문</b><span>학년도·과목별 공식 자료</span></a><a href="gichul/index.html#topics"><b>개념 정리</b><span>41개 학습 항목 · 148개 개념</span></a><a href="gichul/index.html#practice"><b>예상·연습문제</b><span>유형 변형 + 자체 구성 130문항</span></a></div>' +
      '<p class="csat-entry-note">상세 풀이를 제공하는 실제 기출은 현재 수학 10문항이야. 자체 구성 문제는 기본 개념 일부를 연습하며 실제 출제를 보장하지 않아.' + (count ? ' 이 기기에서 채점한 기록 ' + count + '회.' : '') + '</p>';
    var hero = content.querySelector('.hero-heal, .lt-head');
    if (hero) hero.insertAdjacentElement('afterend', entry);
    else content.insertAdjacentElement('afterbegin', entry);
  }
  if (typeof render === 'function') {
    var previous = render;
    render = function () { previous.apply(this, arguments); mount(); };
    render();
  } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  window.FC_CSAT_ENTRY = { refresh: mount, progress: progress };
}());
