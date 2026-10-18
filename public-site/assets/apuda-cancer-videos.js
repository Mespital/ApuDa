(function (global) {
  'use strict';
  // User-provided ApuDa video list, 2026-10-13. Biliary pages link to the supplied cholangiocarcinoma video.
  var catalog = {
    breast: [{ name: '유방암', id: 'CLpKUrsdqwE' }],
    lung: [{ name: '폐암', id: 'RkS8stwpToo' }],
    stomach: [{ name: '위암', id: 'mynn9ffOZ6I' }],
    colorectal: [{ name: '대장암', id: 'ZQQ5KgjjeNg' }],
    thyroid: [{ name: '갑상선암', id: '3EVVz_A5-IA' }],
    kidney: [{ name: '신장암', id: '1D6v3xzonkI' }],
    prostate: [{ name: '전립선암', id: 'iD1Nq_kwWpw' }],
    pancreas: [{ name: '췌장암', id: '8OXEsyMIzQ4' }],
    biliary: [{ name: '담관암', id: '8ugvUyiv93U' }],
    liver: [{ name: '간암', id: '-W704eKSUNI' }],
    lymphoma: [{ name: '림프종', id: 'UJe95LBjXgQ' }, { name: '림프종 아형 구분', id: 'C-U62IjZgXQ' }],
    cervical: [{ name: '자궁경부암', id: 'gccIZhC4LW4' }]
  };
  Object.keys(catalog).forEach(function (slug) {
    catalog[slug].forEach(Object.freeze);
    Object.freeze(catalog[slug]);
  });
  Object.freeze(catalog);
  function normalize(value) {
    var slug = String(value || '').trim().toLowerCase();
    if (slug === 'pancreatic') slug = 'pancreas';
    return Object.prototype.hasOwnProperty.call(catalog, slug) ? slug : null;
  }
  function items(value) {
    var slug = normalize(value);
    return slug ? catalog[slug].slice() : [];
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function html(value, options) {
    var slug=normalize(value);if(!slug)return '';var heading=options&&options.heading;if([2,3,4].indexOf(heading)<0)heading=2;
    var list=items(slug),play='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5.5v13l10-6.5z" fill="currentColor"/></svg>';
    return '<section class="apuda-videos" aria-label="'+esc(list[0].name)+' 유튜브 영상"><div class="apuda-videos-head"><span class="apuda-video-eyebrow">영상으로 이해하기</span><h'+heading+'>ApuDa 암종별 영상</h'+heading+'></div><div class="apuda-video-list">'+list.map(function(video){return '<a class="apuda-video-link" href="/watch/?cancer='+slug+'&amp;v='+video.id+'" data-apuda-video="'+slug+'" data-video-id="'+video.id+'" aria-haspopup="dialog" aria-label="'+esc(video.name)+' 영상과 자료 팝업 열기"><span class="apuda-video-play">'+play+'</span><span class="apuda-video-copy"><b>'+esc(video.name)+' 영상 보기</b><small>이 창에서 영상 · 책자 · FAQ</small></span><span class="apuda-video-external" aria-hidden="true">▶</span></a>';}).join('')+'</div><p class="apuda-video-note">'+(slug==='biliary'?'담도암 자료와 함께 볼 수 있는 담관암 영상입니다. ':'')+'사이트 안에서 시청하고, 아래에서 같은 암종의 자료를 확인하세요.</p></section>';
  }
  global.ApuDaCancerVideos = Object.freeze({ catalog: catalog, normalize: normalize, items: items, html: html });
})(window);


