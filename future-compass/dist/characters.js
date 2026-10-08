/* 우리집 캐릭터 (직접 그린 오리지널, 움직이는 SVG)
   - child: 승준 — 안경 쓴 남학생, 남색 후드티, 손 흔들기
   - parent: 엄마 — 긴 머리에 별 핀, 보라 가디건, 하트가 떠오름
   FC_CHAR.svg('child'|'parent', 크기px) / FC_CHAR.name(role) */
(function (g) {
  'use strict';
  var STYLE = '<style>' +
    '.fcc-bob{animation:fccBob 2.4s ease-in-out infinite;transform-origin:60px 140px}' +
    '.fcc-sway{animation:fccSway 3s ease-in-out infinite;transform-origin:60px 140px}' +
    '.fcc-blink{animation:fccBlink 4s infinite;transform-box:fill-box;transform-origin:center}' +
    '.fcc-wave{animation:fccWave 1.2s ease-in-out infinite;transform-origin:86px 108px}' +
    '.fcc-heart{animation:fccHeart 2.6s ease-out infinite;transform-box:fill-box;transform-origin:center}' +
    '.fcc-heart.h2{animation-delay:1.3s}' +
    '.fcc-pencil{animation:fccTap 1.6s ease-in-out infinite;transform-origin:36px 118px}' +
    '@keyframes fccBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}' +
    '@keyframes fccSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}' +
    '@keyframes fccBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
    '@keyframes fccWave{0%,100%{transform:rotate(0)}25%{transform:rotate(-18deg)}75%{transform:rotate(10deg)}}' +
    '@keyframes fccHeart{0%{opacity:0;transform:translateY(6px) scale(.6)}25%{opacity:1}100%{opacity:0;transform:translateY(-26px) scale(1.1)}}' +
    '@keyframes fccTap{0%,100%{transform:rotate(0)}50%{transform:rotate(8deg)}}' +
    '@media (prefers-reduced-motion:reduce){.fcc-bob,.fcc-sway,.fcc-blink,.fcc-wave,.fcc-heart,.fcc-pencil{animation:none}}' +
    '</style>';

  function child() {
    return STYLE +
      '<g class="fcc-bob">' +
        // 몸(후드티)
        '<path d="M26 140 Q28 100 60 97 Q92 100 94 140 Z" fill="#34407e"/>' +
        '<path d="M44 100 Q60 112 76 100" fill="none" stroke="#25305f" stroke-width="3" stroke-linecap="round"/>' +
        '<line x1="55" y1="106" x2="54" y2="118" stroke="#e9ecff" stroke-width="2" stroke-linecap="round"/><line x1="65" y1="106" x2="66" y2="118" stroke="#e9ecff" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="74" cy="125" r="6" fill="#f4c95d"/><path d="M76.5 122.5l-1.4 3.6-3.6 1.4 1.4-3.6z" fill="#34407e"/>' +
        // 연필 든 손
        '<g class="fcc-pencil"><path d="M34 118 L22 104" stroke="#f4c95d" stroke-width="4" stroke-linecap="round"/><path d="M22 104 l-2.5 -3" stroke="#3a2a22" stroke-width="2" stroke-linecap="round"/><circle cx="34" cy="119" r="6" fill="#ffdcc2"/></g>' +
        // 손 흔들기
        '<g class="fcc-wave"><path d="M86 108 Q96 100 100 88" fill="none" stroke="#34407e" stroke-width="9" stroke-linecap="round"/><circle cx="101" cy="84" r="6.5" fill="#ffdcc2"/></g>' +
        // 머리
        '<circle cx="31" cy="66" r="6" fill="#f7cbaa"/><circle cx="89" cy="66" r="6" fill="#f7cbaa"/>' +
        '<ellipse cx="60" cy="63" rx="29" ry="31" fill="#ffdcc2"/>' +
        '<path d="M31 62 Q28 30 60 29 Q93 30 89 62 Q88 50 80 44 Q70 52 54 46 Q42 47 31 62 Z" fill="#2f2420"/>' +
        '<path d="M58 30 Q62 21 71 23" fill="none" stroke="#2f2420" stroke-width="3.5" stroke-linecap="round"/>' +
        // 안경
        '<circle cx="48" cy="67" r="9.5" fill="#ffffff" fill-opacity=".25" stroke="#2b2b3a" stroke-width="2.4"/><circle cx="72" cy="67" r="9.5" fill="#ffffff" fill-opacity=".25" stroke="#2b2b3a" stroke-width="2.4"/>' +
        '<path d="M57.5 66 Q60 64 62.5 66" fill="none" stroke="#2b2b3a" stroke-width="2.2"/>' +
        '<ellipse class="fcc-blink" cx="48" cy="68" rx="2.6" ry="3.4" fill="#2b2b3a"/><ellipse class="fcc-blink" cx="72" cy="68" rx="2.6" ry="3.4" fill="#2b2b3a"/>' +
        '<ellipse cx="40" cy="80" rx="4.5" ry="2.6" fill="#ff9fa8" opacity=".55"/><ellipse cx="80" cy="80" rx="4.5" ry="2.6" fill="#ff9fa8" opacity=".55"/>' +
        '<path d="M53 82 Q60 88 67 82" fill="none" stroke="#9a4a3a" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g>';
  }
  function heart(x, y, s, cls) {
    return '<path class="fcc-heart' + (cls ? ' ' + cls : '') + '" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 -3 C-3 -8 -10 -6 -10 -1 C-10 4 -3 8 0 11 C3 8 10 4 10 -1 C10 -6 3 -8 0 -3 Z" fill="#ff6f91"/>';
  }
  function parent() {
    return STYLE +
      heart(98, 52, .7) + heart(22, 60, .55, 'h2') +
      '<g class="fcc-sway">' +
        // 뒷머리(긴 머리)
        '<path d="M29 60 Q26 26 60 25 Q94 26 91 60 L93 110 Q84 116 76 108 L44 108 Q36 116 27 110 Z" fill="#5b3a2c"/>' +
        // 몸(가디건)
        '<path d="M26 140 Q28 100 60 97 Q92 100 94 140 Z" fill="#b6a1f0"/>' +
        '<path d="M50 99 L60 120 L70 99 Z" fill="#fff7f0"/>' +
        '<line x1="60" y1="120" x2="60" y2="140" stroke="#9a84de" stroke-width="2"/><circle cx="63" cy="127" r="1.6" fill="#fff"/><circle cx="63" cy="135" r="1.6" fill="#fff"/>' +
        // 두 손으로 든 하트
        '<path d="M60 124 C55 116 44 118 44 126 C44 133 54 137 60 142 C66 137 76 133 76 126 C76 118 65 116 60 124 Z" fill="#ff6f91"/>' +
        '<circle cx="45" cy="128" r="5.5" fill="#ffdcc2"/><circle cx="75" cy="128" r="5.5" fill="#ffdcc2"/>' +
        // 얼굴
        '<ellipse cx="60" cy="63" rx="28" ry="30" fill="#ffdcc2"/>' +
        '<path d="M31 64 Q32 30 62 30 Q90 32 89 60 Q80 46 64 45 Q48 48 31 64 Z" fill="#5b3a2c"/>' +
        '<path d="M80 39 l1.6 3.4 3.7 .4 -2.8 2.5 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.8 -2.5 3.7 -.4 z" fill="#f4c95d"/>' +
        '<circle cx="33" cy="76" r="1.8" fill="#f4c95d"/><circle cx="87" cy="76" r="1.8" fill="#f4c95d"/>' +
        '<ellipse class="fcc-blink" cx="49" cy="66" rx="2.6" ry="3.4" fill="#3a2a2a"/><ellipse class="fcc-blink" cx="71" cy="66" rx="2.6" ry="3.4" fill="#3a2a2a"/>' +
        '<path d="M44 61.5 l-2.5 -2 M76 61.5 l2.5 -2" stroke="#3a2a2a" stroke-width="1.6" stroke-linecap="round"/>' +
        '<ellipse cx="41" cy="76" rx="4.5" ry="2.6" fill="#ff9fa8" opacity=".6"/><ellipse cx="79" cy="76" rx="4.5" ry="2.6" fill="#ff9fa8" opacity=".6"/>' +
        '<path d="M53 79 Q60 85 67 79" fill="none" stroke="#c2525e" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g>';
  }
  function svg(role, size, raw) {
    size = size || 96;
    if (!raw && custom(role)) return avatar(role, size);
    var label = role === 'parent' ? '엄마 캐릭터' : '승준 캐릭터';
    return '<svg class="fc-char" width="' + size + '" height="' + Math.round(size * 140 / 120) + '" viewBox="0 0 120 140" role="img" aria-label="' + label + '">' + (role === 'parent' ? parent() : child()) + '</svg>';
  }
  /* 프로필 그림: 설정에서 고른 그림(이 기기 + 가족 공유)이 있으면 그걸, 없으면 기본 캐릭터 */
  /* 승준·엄마 그림을 따로 저장 → 가족 공유로 각 그림이 따로 맞춰져서, 다른 폰에서 바꿔도 서로 덮어쓰지 않아 */
  var AV = 'fc_avatar_v1', RK = { child: 'fc_av_child_v1', parent: 'fc_av_parent_v1' };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function oldMap() { try { var v = JSON.parse(lsGet(AV) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function okUrl(u) { return typeof u === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,/.test(u) ? u : ''; }
  (function migrate() { var m = oldMap(); ['child', 'parent'].forEach(function (r) { if (lsGet(RK[r]) === null && okUrl(m[r])) { try { localStorage.setItem(RK[r], m[r]); } catch (e) {} } }); })();
  function custom(role) { var r = role === 'parent' ? 'parent' : 'child', v = lsGet(RK[r]); if (v !== null) return okUrl(v); return okUrl(oldMap()[r]); }
  /* 고른 그림을 움직이는 SVG로 감싸기: 콩콩 뛰기 + 살짝 흔들기 + 그림자 (+ 엄마는 하트, 승준은 반짝이) */
  var AV_STYLE = '<style>' +
    '.fca-hop{animation:fcaHop 1.9s cubic-bezier(.3,.7,.4,1) infinite;transform-origin:60px 134px}' +
    '.fca-sway{animation:fcaSway 3.8s ease-in-out infinite;transform-origin:60px 134px}' +
    '.fca-shadow{animation:fcaShadow 1.9s cubic-bezier(.3,.7,.4,1) infinite;transform-origin:60px 135px}' +
    '.fca-spark{animation:fcaSpark 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.fca-spark.s2{animation-delay:1.1s}' +
    '@keyframes fcaHop{0%,100%{transform:translateY(0) scale(1,1)}30%{transform:translateY(-7px) scale(.98,1.02)}52%{transform:translateY(0) scale(1.03,.97)}64%{transform:translateY(0) scale(1,1)}}' +
    '@keyframes fcaSway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}' +
    '@keyframes fcaShadow{0%,100%{transform:scaleX(1);opacity:.18}30%{transform:scaleX(.8);opacity:.1}52%{transform:scaleX(1.05);opacity:.2}}' +
    '@keyframes fcaSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}' +
    '@media (prefers-reduced-motion:reduce){.fca-hop,.fca-sway,.fca-shadow,.fca-spark{animation:none}}</style>';
  function avatar(role, size, opts) {
    size = size || 96; var u = custom(role);
    if (!u) return svg(role, size);
    var small = size < 40 || (opts && opts.still), h = Math.round(size * 140 / 120), label = role === 'parent' ? '엄마' : '승준';
    var deco = small ? '' : role === 'parent'
      ? heart(102, 30, .6) + heart(18, 44, .45, 'h2')
      : '<path class="fca-spark" d="M104 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f4c95d"/><path class="fca-spark s2" d="M16 40l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#8fd3ff"/>';
    return '<svg class="fc-char fc-av" width="' + size + '" height="' + h + '" viewBox="0 0 120 140" role="img" aria-label="' + label + '">' + (small ? '' : AV_STYLE + STYLE) +
      (small ? '' : '<ellipse class="fca-shadow" cx="60" cy="135" rx="30" ry="4" fill="#2a2060"/>') + deco +
      '<g class="' + (small ? '' : 'fca-sway') + '"><g class="' + (small ? '' : 'fca-hop') + '"><image href="' + u + '" x="4" y="4" width="112" height="130" preserveAspectRatio="xMidYMax meet"/></g></g></svg>';
  }
  function setAvatar(role, url) {
    var r = role === 'parent' ? 'parent' : 'child';
    try { localStorage.setItem(RK[r], url ? url : 'none'); } catch (e) { return false; }   // 'none' = 기본 캐릭터 (지운 것도 다른 폰에 전달)
    try { var m = oldMap(); if (m[r]) { delete m[r]; localStorage.setItem(AV, JSON.stringify(m)); } } catch (e) {}
    return true;
  }
  g.FC_CHAR = { svg: svg, avatar: avatar, custom: custom, setAvatar: setAvatar, KEY: AV, KEYS: [RK.child, RK.parent], name: function (r) { return r === 'parent' ? '엄마' : '승준'; } };
})(window);
