/* 예전 '미래의 변화' 화면 요청은 새 미래 예측 페이지(future.html)로 보낸다. */
(function(){
  'use strict';
  if (typeof render !== 'function') return;
  var prevRender = render;
  render = function(){
    if (page === 'future') { location.href = 'future.html'; return; }
    prevRender();
    // 메뉴 링크(a)는 data-page가 없으니 현재 화면 표시를 직접 정리
    document.querySelectorAll('.nav a.navlink, .bottom-nav a').forEach(function(a){ a.classList.remove('active'); });
  };
  if (location.hash === '#shiro-future' || location.hash === '#future') location.replace('future.html');
})();
