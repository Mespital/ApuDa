(function (global) {
  'use strict';
  // 《암 진단 첫 30일》 암종 자료 선택 팝업 — 홈 2F 서재와 /library/first30/ 이 같은 팝업을 쓴다.
  // 의존: apuda-first30-catalog.js (필수), apuda-cancer-videos.js·apuda-video-dialog.js (선택)

  var INTRO = {
    breast: '유방암 진단 직후 꼭 알아야 할 ER·PR·HER2, 병기, 수술·약물치료 순서를 단계별로 확인하세요.',
    lung: '폐암 진단 직후 꼭 알아야 할 조직형, 유전자검사, 병기, 치료선택 흐름을 단계별로 확인하세요.',
    stomach: '위암 진단 직후 꼭 알아야 할 검사, 수술, 병리, 항암치료 정보를 단계별로 확인하세요.',
    colorectal: '대장암 진단 직후 꼭 알아야 할 병기, 수술, 항암치료 핵심을 단계별로 확인하세요.',
    thyroid: '갑상선암 진단 직후 꼭 알아야 할 수술 준비와 수술 후 추적관리 흐름을 단계별로 확인하세요.',
    kidney: '신장암 진단 직후 꼭 알아야 할 수술, 표적치료, 면역치료의 큰 그림을 단계별로 확인하세요.',
    prostate: '전립선암 진단 직후 꼭 알아야 할 PSA, 병기, 호르몬치료 정보를 단계별로 확인하세요.',
    pancreas: '췌장암 진단 직후 꼭 알아야 할 수술 가능성과 항암치료 순서를 단계별로 확인하세요.',
    biliary: '담도암 진단 직후 꼭 알아야 할 병기, 유전자검사, 전신치료 정보를 단계별로 확인하세요.',
    liver: '간암 진단 직후 꼭 알아야 할 간기능과 병기를 함께 보는 치료 흐름을 단계별로 확인하세요.',
    lymphoma: '림프종 진단 직후 꼭 알아야 할 조직형(아형), 병기, 항암치료 흐름을 단계별로 확인하세요.',
    cervical: '자궁경부암 진단 직후 꼭 알아야 할 병기, 수술, 방사선·항암치료 정보를 단계별로 확인하세요.'
  };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function catalog() { return (global.ApuDaFirst30Catalog && global.ApuDaFirst30Catalog.books) || []; }
  function find(key) {
    var books = catalog();
    if (typeof key === 'number') return books[key] || null;
    var c = global.ApuDaFirst30Catalog;
    return (c && c.get(key)) || null;
  }
  function hasVideo(slug) {
    return !!(global.ApuDaCancerVideos && global.ApuDaCancerVideos.items(slug).length);
  }
  // 카드·서재에 붙는 자료 태그 (모든 암종 동일 규칙)
  function tags(book) {
    var t = ['핵심안내'];
    if (book.hasMini) t.push('MINI');
    if (book.hasFaq) t.push('FAQ ' + book.faqCount);
    if (hasVideo(book.slug)) t.push('영상');
    return t;
  }

  function item(num, title, sub, actions, cls) {
    return '<div class="bc-item' + (cls ? ' ' + cls : '') + '"><span class="bc-num">' + num + '</span>' +
      '<span class="bc-copy"><b>' + title + '</b><small>' + sub + '</small></span>' +
      '<span class="bc-actions">' + actions + '</span></div>';
  }
  var SOON = '<span class="bc-soon">준비 중</span>';

  function build(book) {
    var slug = book.slug, name = esc(book.name), vol = String(book.vol).padStart(2, '0');
    var reviewed = book.vol <= 12;

    var guide = item('1', name + ' 진단 첫 30일 핵심안내',
      '6면 무료 열람 · A4 인쇄·PDF 저장 가능',
      '<a class="primary" href="' + esc(book.href) + '">📖 읽기</a>');

    var mini = book.hasMini
      ? item('2', name + ' 진단 첫 30일 MINI 책자', '앞부분 미리보기 · 전체 PDF 무료 다운로드',
          '<a href="/library/mini/?cancer=' + slug + '">미리보기</a><a href="/library/mini/?cancer=' + slug + '#download">⬇ 다운로드</a>')
      : item('2', name + ' 진단 첫 30일 MINI 책자', '제작 중입니다. 먼저 핵심안내를 읽어 보세요.', SOON, 'soon');

    var faq = book.hasFaq
      ? item('3', name + ' FAQ ' + book.faqCount + '문항',
          reviewed ? '환자·보호자가 진료실에서 자주 확인하는 질문' : '진료실에서 자주 확인하는 질문 · 일부 문항 전문의 검토 대기',
          '<a href="/library/faq/?cancer=' + slug + '">FAQ 보기</a>')
      : item('3', name + ' FAQ', '제작 중입니다.', SOON, 'soon');

    var full = item('4', name + ' 진단 첫 30일 완전판', '단행본 완전판은 준비 중입니다.',
      '<span class="bc-thumb" aria-hidden="true" style="--cover:url(\'' + esc(book.cover) + '\')"></span>' + SOON, 'soon');

    var video = hasVideo(slug) ? global.ApuDaCancerVideos.html(slug, { heading: 4 }) : '';

    var more = book.hasMini
      ? '<a href="/library/treatment-map/?cancer=' + slug + '">🗺️ 치료결정 지도</a>' +
        '<a href="/library/drugs/?cancer=' + slug + '">💊 관련 항암제</a>' +
        '<a href="/library/biomarkers/?cancer=' + slug + '">🧬 관련 바이오마커</a>' +
        '<a href="/library/regimens/?cancer=' + slug + '">💉 항암 요법 가이드</a>'
      : '<a href="/library/drugs/">💊 항암제 찾기</a><a href="/library/biomarkers/">🧬 바이오마커 찾기</a>';
    more += '<a href="/library/first30/">📚 30종 전체 보기</a>';

    return '<section class="bc-card" role="dialog" aria-modal="true" aria-labelledby="bcTitle">' +
      '<button class="bc-x" type="button" aria-label="닫기">×</button>' +
      '<div class="bc-head"><div class="bc-cover"><img src="' + esc(book.cover) + '" alt="' + name + ' 암 진단 첫 30일 표지" width="700" height="993"></div>' +
      '<div><span class="bc-kicker">ApuDa 암 진단 첫 30일 · Vol. ' + vol + '</span><h3 id="bcTitle">' + name + '</h3>' +
      '<p>' + esc(INTRO[slug] || (book.name + ' 진단 직후 확인할 검사·병기·치료 흐름과 진료실 질문을 단계별로 정리했습니다.')) + '</p>' +
      '<div class="bc-tags">' + tags(book).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div></div>' +
      '<div class="bc-list">' + guide + mini + faq + full + '</div>' + video +
      '<p class="bc-note">모든 자료는 무료이며 로그인 없이 이용할 수 있어요. 환자교육용 정보이며, 검사·치료 결정은 담당 의료진과 상의하세요.</p>' +
      '<div class="bc-more"><span>' + name + ' 더 알아보기</span>' + more + '</div></section>';
  }

  var current = null;
  function close() {
    if (!current) return;
    var c = current; current = null;
    c.root.remove();
    document.removeEventListener('keydown', c.onKey, true);
    document.documentElement.classList.remove('bc-open');
    if (c.opener && c.opener.focus) c.opener.focus({ preventScroll: true });
  }

  function open(key) {
    var book = find(key);
    if (!book) return false;
    close();
    var root = document.createElement('div');
    root.id = 'bookChoiceModal'; // 홈 키보드 핸들러가 이 id로 팝업 여부를 판단
    root.className = 'bc-backdrop';
    root.innerHTML = build(book);
    document.body.appendChild(root);
    document.documentElement.classList.add('bc-open');
    var opener = document.activeElement;
    function onKey(e) {
      // 영상 팝업(apuda-video-dialog)은 먼저 등록된 capture 리스너로 Esc를 가로챈다
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab' || !root.contains(document.activeElement)) return;
      var nodes = root.querySelectorAll('button:not([disabled]),a[href]'), first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    current = { root: root, onKey: onKey, opener: opener, slug: book.slug };
    root.querySelector('.bc-x').addEventListener('click', close);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', onKey, true);
    root.querySelector('.bc-x').focus({ preventScroll: true });
    return true;
  }

  global.ApuDaBookChoice = Object.freeze({ open: open, close: close, tags: tags, intro: INTRO });
})(window);
