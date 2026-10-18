/* 🌙 밤 모드 (2026-10-18)
   모듈마다 색을 직접 박아 둔 구조라, 페이지의 스타일 규칙을 읽어 "밤용 색" 규칙을 자동으로 만든다.
   - 배경(밝은 색) → 어둡게, 글자(어두운 색) → 밝게. 색상(hue)은 유지, 진한 강조색 배경은 그대로 둬서 흰 글자 대비 유지
   - 모든 규칙은 html.fc-dark 아래에만 걸리니, 끄면 즉시 원래대로
   - 설정: fc-theme-v1 = 'auto'(기본: 기기 다크 설정이거나 밤 9시~아침 7시) | 'light' | 'dark'
   head에서 일찍 로드: 깜빡임 방지용 기본 배경을 먼저 깔고, 스타일이 추가될 때마다 이어서 변환한다. */
(function () {
  'use strict';
  var KEY = 'fc-theme-v1', root = document.documentElement;
  function pref() { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function kstHour() { return new Date(Date.now() + 9 * 3600000).getUTCHours(); }
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function wantDark() { var p = pref(); if (p === 'dark') return true; if (p === 'light') return false; var h = kstHour(); return (mq && mq.matches) || h >= 21 || h < 7; }
  var meta = null;
  function apply() {
    var d = wantDark();
    root.classList.toggle('fc-dark', d);
    if (!meta) meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { if (!meta.dataset.light) meta.dataset.light = meta.content; meta.content = d ? '#15131f' : meta.dataset.light; }
  }

  /* ---------- 색 변환 ---------- */
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
    if (mx !== mn) { var d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function rgb(h, s, l) {
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
  }
  function out(c, a) { c = c.map(function (x) { return Math.round(Math.max(0, Math.min(255, x))); }); return a < 1 ? 'rgba(' + c.join(', ') + ', ' + a + ')' : 'rgb(' + c.join(', ') + ')'; }
  function lum(c) { var f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
  function conv(r, g, b, a, kind) {
    var x = hsl(r, g, b), h = x[0], s = x[1], l = x[2], c;
    if (kind === 'fg') {
      var was = l;
      if (l < .5) l = 1 - l * .7;                     // 진한 글자 → 밝게
      else if (l < .74 && s > .25) l = .76;           // 중간 밝기 강조 글자 → 어두운 배경에서 읽히게
      s = Math.min(s, .85); c = rgb(h, s, l);
      if (was < .74) while (lum(c) < .36 && l < .97) { l += .02; c = rgb(h, s, l); }   // 보라·파랑처럼 어두워 보이는 색 보정
      return out(c, a);
    }
    if (kind === 'shadow') return 'rgba(0, 0, 0, ' + Math.min(.6, a + .15) + ')';
    if (kind === 'border') { if (l > .5) l = .2 + (1 - l) * .55; return out(rgb(h, s * .55, l), a); }
    // 배경
    if (l > .5) {
      l = .1 + (1 - l) * .62; s = s * (l < .2 ? .5 : .75); c = rgb(h, s, l);
      while (lum(c) > .04 && l > .06) { l -= .015; c = rgb(h, s, l); }                // 노랑처럼 밝아 보이는 배경 보정
      return out(c, a);
    }
    else if (l > .4) l = l * .78;
    return out(rgb(h, s, l), a);
  }
  var RX = /rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)|\b(white|black)\b|#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b/gi;
  function mapVal(v, kind) {
    return v.replace(RX, function (m, r, g, b, a, named, hex) {
      if (named) { var w = named.toLowerCase() === 'white'; r = g = b = w ? 255 : 0; a = 1; }
      if (hex) { if (hex.length === 3) hex = hex.replace(/./g, '$&$&'); r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16); a = hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1; }
      a = a == null ? 1 : Number(a);
      if (a === 0) return m;
      return conv(Number(r), Number(g), Number(b), a, kind);
    });
  }
  function kindOf(p) {
    if (p === 'color' || p === 'fill' || p === 'stroke' || p === 'caret-color' || p === 'text-decoration-color' || p === '-webkit-text-fill-color' || p === 'column-rule-color') return 'fg';
    if (p === 'box-shadow' || p === 'text-shadow') return 'shadow';
    if (p.indexOf('border') === 0 || p.indexOf('outline') === 0) return 'border';
    if (p.indexOf('background') === 0) return 'bg';
    return '';
  }
  function splitSel(s) { var o = [], d = 0, cur = ''; for (var i = 0; i < s.length; i++) { var c = s[i]; if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--; if (c === ',' && !d) { o.push(cur); cur = ''; } else cur += c; } o.push(cur); return o; }
  function scope(sel) {
    return splitSel(sel).map(function (x) {
      x = x.trim();
      if (/^html\b/.test(x)) return x.replace(/^html/, 'html.fc-dark');
      if (/^:root\b/.test(x)) return x.replace(/^:root/, ':root.fc-dark');
      return 'html.fc-dark ' + x;
    }).join(',');
  }
  /* CSS 변수: 이름으로 역할을 정함. 강조색(pri·violet·lamp 등)은 버튼 배경에도 쓰여서 값은 그대로 두고, 글자로 쓰일 때만 밝힘 */
  var VARS = {};
  function varKind(n) {
    if (/ink|night|sub|muted|text|fg|title/.test(n)) return 'fg';
    if (/line|border|stroke/.test(n)) return 'border';
    if (/bg|card|paper|soft|tint|surface|wash|cream/.test(n)) return 'bg';
    return 'accent';
  }
  function ruleCss(rule) {
    var st = rule.style, decl = '';
    for (var i = 0; i < st.length; i++) {
      var p = st[i], v0 = st.getPropertyValue(p), imp = st.getPropertyPriority(p) ? ' !important' : '';
      if (p.indexOf('--') === 0) {
        var vk = varKind(p); VARS[p] = v0.trim();
        RX.lastIndex = 0; if (vk === 'accent' || !RX.test(v0)) { RX.lastIndex = 0; continue; } RX.lastIndex = 0;
        decl += p + ':' + mapVal(v0, vk) + imp + ';'; continue;
      }
      var k = kindOf(p); if (!k) continue;
      var vm = /^\s*var\((--[\w-]+)\)\s*$/.exec(v0 || '');
      if (vm && k === 'fg' && varKind(vm[1]) === 'accent' && VARS[vm[1]]) { decl += p + ':' + mapVal(VARS[vm[1]], 'fg') + imp + ';'; continue; }
      var v = v0; if (!v || !RX.test(v)) { RX.lastIndex = 0; continue; } RX.lastIndex = 0;
      if (k === 'bg' && /url\(/.test(v) && !/gradient/.test(v)) continue;
      decl += p + ':' + mapVal(v, k) + imp + ';';
    }
    return decl ? scope(rule.selectorText) + '{' + decl + '}' : '';
  }
  function walk(rules) {
    var css = '';
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      try {
        if (r.type === 1) css += ruleCss(r);
        else if (r.type === 4) { var inner = walk(r.cssRules); if (inner) css += '@media ' + r.media.mediaText + '{' + inner + '}'; }
        else if (r.type === 12) { var in2 = walk(r.cssRules); if (in2) css += '@supports ' + r.conditionText + '{' + in2 + '}'; }
      } catch (e) {}
    }
    return css;
  }

  var done = typeof WeakSet === 'function' ? new WeakSet() : null, outEl = null, chunks = [];
  function ensureOut() { if (!outEl) { outEl = document.createElement('style'); outEl.id = 'fc-dark-css'; outEl.dataset.fcDark = '1'; } if (outEl.parentNode !== document.head || document.head.lastElementChild !== outEl) document.head.appendChild(outEl); }
  function sheetOf(n) { try { return n.sheet; } catch (e) { return null; } }
  function process(node) {
    if (!node || (node.dataset && node.dataset.fcDark)) return;
    var sh = sheetOf(node); if (!sh) return;
    if (done) { if (done.has(sh)) return; done.add(sh); }
    var rules; try { rules = sh.cssRules; } catch (e) { return; }
    var css = walk(rules); if (!css) return;
    chunks.push(css); ensureOut(); outEl.textContent = BASE + chunks.join('\n');
  }
  var BASE = 'html.fc-dark{color-scheme:dark;background:#15131f}html.fc-dark body{background:#15131f;color:#e8e6f2}' +
    'html.fc-dark img,html.fc-dark .hb-img,html.fc-dark .hero-img,html.fc-dark video{filter:brightness(.82) contrast(1.05)}' +
    'html.fc-dark ::placeholder{color:#8f8aa6}html.fc-dark a{color:#b9acff}html.fc-dark :is(p,li,small,span,dd,td)>a,html.fc-dark a:not([class]):not([role]){text-decoration:underline!important;text-underline-offset:2px}';
  function scan() { document.querySelectorAll('style,link[rel="stylesheet"]').forEach(function (n) { if (n.tagName === 'LINK' && !sheetOf(n)) n.addEventListener('load', function () { process(n); }, { once: true }); else process(n); }); }

  /* 깜빡임 방지: 변환 전에도 바탕은 어둡게 */
  var pre = document.createElement('style'); pre.dataset.fcDark = '1'; pre.textContent = 'html.fc-dark{background:#15131f;color-scheme:dark}html.fc-dark body{background:#15131f}';
  (document.head || root).appendChild(pre);
  apply();
  var obs = new MutationObserver(function (ms) {
    var hit = false;
    ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && (n.tagName === 'STYLE' || (n.tagName === 'LINK' && /stylesheet/.test(n.rel)))) hit = true; }); });
    if (hit) setTimeout(scan, 0);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.addEventListener('load', scan);
  if (mq && mq.addEventListener) mq.addEventListener('change', apply);
  setInterval(apply, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) apply(); });

  window.FC_THEME = {
    get: pref, isDark: function () { return root.classList.contains('fc-dark'); },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} apply(); }
  };
})();
