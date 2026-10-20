/* 📖 내 교과서 (study.html#books) — 2026-10-19
   교과서를 앱 안에서 실제 책처럼 펼쳐 보고, 펜·형광펜으로 쓰고, 메모·책갈피를 남긴다.
   - 넣는 방법: 교과서 PDF 파일 또는 교과서 쪽 사진(여러 장). 파일은 이 기기 안(IndexedDB)에만 저장 — 서버·가족 공유로 올리지 않음(용량·저작권).
   - 공식 디지털교과서(에듀넷 디지털교과서 웹 뷰어)는 학교 계정 로그인이 필요하고 외부 사이트라 이 앱 안에 띄우면 로그인이 유지되지 않아, 새 창으로 연다.
   - 태블릿 가로: 2쪽 펼침. 애플펜슬(펜)으로 쓰면 손가락은 넘기기·스크롤만 하도록 자동 전환.
   - 진도표 연결: 학교알리미 평가계획의 '이번 주 단원'을 책갈피 이름으로 바로 넣을 수 있다.
   - PDF 표시는 pdf.js(Apache-2.0, vendor/pdfjs)를 처음 열 때만 불러온다. */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function' || typeof tabs === 'undefined') return;
  tabs.books = '📖 내 교과서';
  var DB = 'fc-books-v1', db = null, books = [], loaded = false;
  var WEBDT = 'https://webdt.edunet.net/';
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uidb() { return 'bk' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- 저장소 ---------- */
  function open() {
    if (db) return Promise.resolve(db);
    return new Promise(function (ok, no) {
      try {
        var r = indexedDB.open(DB, 1);
        r.onupgradeneeded = function () { var d = r.result; ['books', 'files', 'ink'].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n); }); };
        r.onsuccess = function () { db = r.result; ok(db); }; r.onerror = function () { no(r.error); };
      } catch (x) { no(x); }
    });
  }
  function tx(store, mode, fn) { return open().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction(store, mode), s = t.objectStore(store), res; var q = fn(s); if (q) q.onsuccess = function () { res = q.result; }; t.oncomplete = function () { ok(res); }; t.onerror = function () { no(t.error); }; }); }); }
  function get(store, k) { return tx(store, 'readonly', function (s) { return s.get(k); }); }
  function put(store, k, v) { return tx(store, 'readwrite', function (s) { return s.put(v, k); }); }
  function del(store, k) { return tx(store, 'readwrite', function (s) { return s.delete(k); }); }
  function all() { return tx('books', 'readonly', function (s) { return s.getAll(); }); }
  function refresh() { return all().then(function (L) { books = (L || []).sort(function (a, b) { return (b.last || 0) - (a.last || 0); }); loaded = true; if (tab === 'books') render(); }).catch(function () { loaded = true; if (tab === 'books') render(); }); }

  function subjects() {
    var L = window.FC_GRADES && FC_GRADES.subjects ? FC_GRADES.subjects() : null, out = [];
    (L || []).forEach(function (s) { out.push(s.subject); });
    ['공통국어2', '공통수학2', '공통영어2', '한국사', '통합사회2', '통합과학2'].forEach(function (s) { if (out.indexOf(s) < 0) out.push(s); });
    return out;
  }
  function weekUnits(subject) {
    var D = window.FC_SCHOOL_LIVE ? FC_SCHOOL_LIVE.data() : null; if (!D || !D.eval) return [];
    var s = (D.eval.subjects || []).find(function (x) { return x.subject === subject; }); if (!s) return [];
    var k = new Date(Date.now() + 9 * 3600e3), m = k.getUTCMonth() + 1, w = Math.floor((k.getUTCDate() - 1) / 7) + 1;
    return (s.timeline || []).filter(function (x) { if (x.m !== m || x.exam) return false; var r = /(\d)\s*(?:[~\-]\s*(\d))?/.exec(String(x.w || '')); return !r || (w >= +r[1] && w <= +(r[2] || r[1])); }).map(function (x) { return String(x.unit).slice(0, 40); }).filter(function (u, i, a) { return a.indexOf(u) === i; });
  }

  /* ---------- 서재 화면 ---------- */
  var adding = false;
  function shelf() {
    var par = isParent();
    var h = '<div class="tbk-wrap"><section class="tbk-head"><h1>📖 내 교과서</h1><p>교과서를 앱 안에서 펼쳐 보고, 펜으로 쓰고, 메모·책갈피를 남겨. 파일은 이 기기 안에만 저장돼.</p></section>';
    if (par) h += '<section class="card"><p>교과서는 승준이 기기 안에만 저장돼서 엄마 화면에서는 보이지 않아요. 공식 디지털교과서는 아래에서 열 수 있어요.</p></section>';
    h += '<section class="card tbk-official"><h2>🌐 공식 디지털교과서</h2><p class="muted small">에듀넷 디지털교과서 웹 뷰어 — 학교에서 받은 계정(또는 에듀넷 계정)으로 로그인해. 외부 사이트라 로그인 유지를 위해 새 창으로 열어.</p><a class="tbk-btn primary" href="' + WEBDT + '" target="_blank" rel="noopener">디지털교과서 웹 뷰어 열기 ↗</a></section>';
    if (!par) {
      h += '<section class="card tbk-shelf"><div class="tbk-shelf-h"><h2>📚 내 책장</h2>' + (adding ? '' : '<button type="button" class="primary" data-tbk-add>＋ 교과서 넣기</button>') + '</div>';
      if (adding) h += addForm();
      if (!loaded) h += '<p class="muted">책장을 여는 중…</p>';
      else if (!books.length && !adding) h += '<div class="tbk-empty"><p><b>아직 넣은 교과서가 없어.</b></p><ol><li>교과서 PDF 파일이 있으면 그대로 넣어.</li><li>없으면 이번 시험 범위 쪽을 사진으로 찍어 넣어도 돼 (여러 장 한 번에).</li><li>넣은 뒤에는 펜·형광펜으로 쓰고, 책갈피로 단원을 표시해.</li></ol></div>';
      else h += '<ul class="tbk-books">' + books.map(function (b) {
        return '<li><button type="button" class="tbk-book" data-tbk-open="' + e(b.id) + '"><span class="tbk-spine" style="--c:' + color(b.subject) + '"></span><span class="tbk-bt"><b>' + e(b.title) + '</b><small>' + e(b.subject) + ' · ' + b.pages + '쪽' + (b.page ? ' · ' + b.page + '쪽에서 멈춤' : '') + '</small>' + ((b.marks || []).length ? '<small>🔖 ' + e(b.marks.slice(-2).map(function (m) { return m.label; }).join(' · ')) + '</small>' : '') + '</span></button><button type="button" class="tbk-del" data-tbk-del="' + e(b.id) + '" aria-label="' + e(b.title) + ' 책장에서 빼기">✕</button></li>';
      }).join('') + '</ul>';
      h += '<p class="muted small tbk-note">파일은 이 기기 브라우저 저장소에만 있어. 앱을 지우거나 브라우저 데이터를 지우면 함께 지워져. 교과서는 저작권이 있어서 친구에게 보내거나 올리지 마.</p></section>';
    }
    return h + '</div>';
  }
  var COLORS = ['#e4572e', '#2f6fdb', '#17a37a', '#a05a2c', '#8e44ad', '#d4a106', '#0f8b8d', '#c2185b'];
  function color(s) { var n = 0; for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 997; return COLORS[n % COLORS.length]; }
  function addForm() {
    return '<form class="tbk-form" data-tbk-form><label>과목<select name="subject">' + subjects().map(function (s) { return '<option>' + e(s) + '</option>'; }).join('') + '<option value="">기타</option></select></label>' +
      '<label>책 이름<input name="title" maxlength="40" placeholder="예: 통합과학2 교과서 (비상)"></label>' +
      '<label class="tbk-file">파일<input name="file" type="file" accept="application/pdf,image/*" multiple required><small>PDF 1개 또는 사진 여러 장</small></label>' +
      '<p class="tbk-btns"><button type="submit" class="primary">책장에 넣기</button><button type="button" data-tbk-cancel>취소</button></p><p class="tbk-prog" aria-live="polite"></p></form>';
  }
  function addBook(f) {
    var files = Array.prototype.slice.call(f.elements.file.files || []); if (!files.length) return;
    var pdf = files.find(function (x) { return /pdf$/i.test(x.type) || /\.pdf$/i.test(x.name); }), imgs = files.filter(function (x) { return /^image\//.test(x.type); }).sort(function (a, b) { return a.name.localeCompare(b.name, 'ko', { numeric: true }); });
    var subject = f.elements.subject.value || '기타', title = (f.elements.title.value.trim() || (subject + ' 교과서')).slice(0, 40), id = uidb(), prog = f.querySelector('.tbk-prog');
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    prog.textContent = '넣는 중…';
    var job;
    if (pdf) job = put('files', id, pdf).then(function () { return pdfPages(pdf); }).then(function (n) { return { kind: 'pdf', pages: n }; });
    else job = imgs.reduce(function (p, im, i) { return p.then(function () { return shrink(im).then(function (b) { prog.textContent = '사진 ' + (i + 1) + '/' + imgs.length; return put('files', id + '#' + i, b); }); }); }, Promise.resolve()).then(function () { return { kind: 'img', pages: imgs.length }; });
    job.then(function (r) { var b = { id: id, subject: subject, title: title, kind: r.kind, pages: r.pages, created: Date.now(), last: Date.now(), page: 1, marks: [] }; return put('books', id, b).then(function () { adding = false; notice('책장에 넣었어. 눌러서 펼쳐 봐.'); return refresh(); }); })
      .catch(function (x) { prog.textContent = '넣지 못했어: ' + (x && x.name === 'QuotaExceededError' ? '기기 저장 공간이 부족해.' : '파일을 확인해줘.'); });
  }
  /* 사진은 긴 변 2000px로 줄여 저장(용량) */
  function shrink(file) {
    return new Promise(function (ok) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () { var s = Math.min(1, 2000 / Math.max(img.width, img.height)); if (s >= 1 && file.size < 1.5e6) { URL.revokeObjectURL(u); ok(file); return; } var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(function (b) { ok(b || file); }, 'image/jpeg', 0.86); };
      img.onerror = function () { URL.revokeObjectURL(u); ok(file); };
      img.src = u;
    });
  }

  /* ---------- pdf.js ---------- */
  var pdfLib = null;
  function lib() {
    if (pdfLib) return pdfLib;
    pdfLib = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'vendor/pdfjs/pdf.min.js'; s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js'; ok(window.pdfjsLib); }; s.onerror = no; document.head.appendChild(s); });
    return pdfLib;
  }
  function loadPdf(blob) { return lib().then(function (L) { return blob.arrayBuffer().then(function (buf) { return L.getDocument({ data: buf, cMapUrl: 'vendor/pdfjs/cmaps/', cMapPacked: true }).promise; }); }); }
  function pdfPages(blob) { return loadPdf(blob).then(function (d) { var n = d.numPages; d.destroy(); return n; }); }

  /* ---------- 읽기 화면 ---------- */
  var R = null;   // {b, doc, page, spread, tool, color, ink:{}, undo:[], pencil}
  var TOOLS = [['hand', '✋', '넘기기'], ['pen', '✏️', '펜'], ['hl', '🖍', '형광펜'], ['erase', '🧽', '지우개'], ['note', '📝', '메모']];
  var PENC = ['#1f1b45', '#d9435d', '#2f6fdb'], HLC = ['rgba(255,214,0,.38)', 'rgba(120,230,160,.38)', 'rgba(255,150,200,.38)'];
  function wideSpread() { return window.innerWidth >= 1000 && window.innerWidth > window.innerHeight; }
  function openBook(id) {
    get('books', id).then(function (b) {
      if (!b) return;
      R = { b: b, page: Math.min(b.page || 1, b.pages), spread: wideSpread(), tool: 'hand', ci: 0, ink: {}, undo: [], pencil: false, zoom: 1 };
      b.last = Date.now(); put('books', b.id, b);
      var box = document.createElement('div'); box.className = 'tbk-reader'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', b.title + ' 읽기');
      document.body.appendChild(box); document.documentElement.classList.add('tbk-open'); R.box = box;
      var ready = b.kind === 'pdf' ? get('files', b.id).then(loadPdf).then(function (d) { R.doc = d; }) : Promise.resolve();
      box.innerHTML = '<p class="tbk-loading">책을 펼치는 중…</p>';
      ready.then(draw).catch(function () { box.innerHTML = '<div class="tbk-err"><p>책을 열지 못했어. 파일이 손상됐거나 기기 저장 공간이 지워졌을 수 있어.</p><button type="button" data-tbk-close>닫기</button></div>'; });
    });
  }
  function bar() {
    var b = R.b, n = R.spread ? 2 : 1;
    return '<div class="tbk-top"><button type="button" data-tbk-close aria-label="책장으로">← 책장</button><b class="tbk-title">' + e(b.title) + '</b>' +
      '<span class="tbk-pg"><button type="button" data-tbk-prev aria-label="앞쪽">◀</button><label><input type="number" min="1" max="' + b.pages + '" value="' + R.page + '" data-tbk-goto aria-label="쪽 번호"> / ' + b.pages + '</label><button type="button" data-tbk-next aria-label="다음 쪽">▶</button></span>' +
      '<span class="tbk-zoom"><button type="button" data-tbk-zoom="-1" aria-label="작게">－</button><button type="button" data-tbk-zoom="1" aria-label="크게">＋</button>' + (window.innerWidth >= 1000 ? '<button type="button" data-tbk-spread aria-pressed="' + R.spread + '">' + (R.spread ? '1쪽' : '2쪽') + '</button>' : '') + '</span></div>' +
      '<div class="tbk-tools" role="toolbar" aria-label="쓰기 도구">' + TOOLS.map(function (t) { return '<button type="button" data-tbk-tool="' + t[0] + '" aria-pressed="' + (R.tool === t[0]) + '" class="' + (R.tool === t[0] ? 'on' : '') + '"><i aria-hidden="true">' + t[1] + '</i><span>' + t[2] + '</span></button>'; }).join('') +
      '<span class="tbk-colors">' + (R.tool === 'hl' ? HLC : PENC).map(function (c, i) { return '<button type="button" data-tbk-color="' + i + '" class="' + (R.ci === i ? 'on' : '') + '" style="--c:' + c + '" aria-label="색 ' + (i + 1) + '"></button>'; }).join('') + '</span>' +
      '<button type="button" data-tbk-undo aria-label="되돌리기">↶</button><button type="button" data-tbk-mark aria-label="책갈피">🔖</button><button type="button" data-tbk-marks aria-label="책갈피 목록">📑</button>' +
      (R.pencil ? '<small class="tbk-pencil">✏️ 펜슬로만 쓰기</small>' : '') + '</div>';
  }
  function pagesNow() { var p = R.page, out = [p]; if (R.spread && p + 1 <= R.b.pages) out.push(p + 1); return out; }
  function draw() {
    if (!R) return;
    var box = R.box;
    box.innerHTML = bar() + '<div class="tbk-stage' + (R.spread ? ' spread' : '') + '" data-tbk-stage>' + pagesNow().map(function (p) { return '<div class="tbk-page" data-p="' + p + '"><div class="tbk-paper"><canvas class="tbk-pc"></canvas><canvas class="tbk-ink"></canvas><div class="tbk-notes"></div></div><small class="tbk-pno">' + p + '</small></div>'; }).join('') + '</div><div class="tbk-side" hidden></div>';
    var stage = box.querySelector('.tbk-stage');
    pagesNow().forEach(function (p) { paint(stage.querySelector('.tbk-page[data-p="' + p + '"]'), p); });
    R.b.page = R.page; put('books', R.b.id, R.b);
  }
  function fitWidth(stage) {
    var W = stage.clientWidth - 24, H = stage.clientHeight - 24;
    return { W: R.spread ? (W - 16) / 2 : W, H: H };
  }
  function paint(el, p) {
    var stage = R.box.querySelector('.tbk-stage'), fit = fitWidth(stage), pc = el.querySelector('.tbk-pc'), ink = el.querySelector('.tbk-ink'), dpr = Math.min(2, window.devicePixelRatio || 1);
    function size(w, h) {
      var s = Math.min(fit.W / w, (R.spread || window.innerWidth > window.innerHeight ? fit.H / h : Infinity)) * R.zoom;
      var cw = Math.round(w * s), ch = Math.round(h * s);
      [pc, ink].forEach(function (c) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); c.style.width = cw + 'px'; c.style.height = ch + 'px'; });
      el.querySelector('.tbk-paper').style.width = cw + 'px'; el.querySelector('.tbk-paper').style.height = ch + 'px';
      return s;
    }
    var done;
    if (R.b.kind === 'pdf') done = R.doc.getPage(p).then(function (pg) { var v = pg.getViewport({ scale: 1 }), s = size(v.width, v.height); return pg.render({ canvasContext: pc.getContext('2d'), viewport: pg.getViewport({ scale: s * dpr }) }).promise; });
    else done = get('files', R.b.id + '#' + (p - 1)).then(function (blob) { return new Promise(function (ok) { var img = new Image(), u = URL.createObjectURL(blob); img.onload = function () { size(img.width, img.height); pc.getContext('2d').drawImage(img, 0, 0, pc.width, pc.height); URL.revokeObjectURL(u); ok(); }; img.src = u; }); });
    done.then(function () { return loadInk(p); }).then(function () { redrawInk(el, p); notes(el, p); bindInk(el, p); });
  }
  function key(p) { return R.b.id + '#' + p; }
  function loadInk(p) { if (R.ink[p]) return Promise.resolve(); return get('ink', key(p)).then(function (v) { R.ink[p] = v || { s: [], n: [] }; }); }
  var saveT = {};
  function saveInk(p) { clearTimeout(saveT[p]); saveT[p] = setTimeout(function () { put('ink', key(p), R.ink[p]); }, 400); }
  function redrawInk(el, p) {
    var c = el.querySelector('.tbk-ink'), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    (R.ink[p].s || []).forEach(function (st) { stroke(g, c, st); });
  }
  function stroke(g, c, st) {
    if (!st.pts.length) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = st.c; g.fillStyle = st.c;
    var avg = st.pts.reduce(function (a, q) { return a + (q[2] || 0.5); }, 0) / st.pts.length;
    g.lineWidth = st.w * c.width * (st.hl ? 1 : (0.6 + avg));
    if (st.pts.length === 1) { var q = st.pts[0]; g.beginPath(); g.arc(q[0] * c.width, q[1] * c.height, g.lineWidth / 2, 0, 7); g.fill(); g.restore(); return; }
    g.beginPath(); g.moveTo(st.pts[0][0] * c.width, st.pts[0][1] * c.height);   // 한 번에 그려서 형광펜이 점점이 겹치지 않게
    for (var i = 1; i < st.pts.length; i++) g.lineTo(st.pts[i][0] * c.width, st.pts[i][1] * c.height);
    g.stroke(); g.restore();
  }
  function notes(el, p) {
    var box = el.querySelector('.tbk-notes');
    box.innerHTML = (R.ink[p].n || []).map(function (n, i) { return '<button type="button" class="tbk-sticky" data-tbk-note="' + p + ':' + i + '" style="left:' + (n.x * 100) + '%;top:' + (n.y * 100) + '%">' + e(n.t) + '</button>'; }).join('');
  }
  function bindInk(el, p) {
    var c = el.querySelector('.tbk-ink'), cur = null;
    function pos(ev) { var r = c.getBoundingClientRect(); return [Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)), ev.pressure || 0.5]; }
    function drawing(ev) { if (R.tool === 'hand' || R.tool === 'note') return false; if (ev.pointerType === 'pen' && !R.pencil) { R.pencil = true; setTimeout(function () { var t = R.box.querySelector('.tbk-tools'); if (t && !t.querySelector('.tbk-pencil')) t.insertAdjacentHTML('beforeend', '<small class="tbk-pencil">✏️ 펜슬로만 쓰기</small>'); }, 0); } return !(R.pencil && ev.pointerType === 'touch'); }
    c.style.touchAction = R.tool === 'hand' || R.tool === 'note' || R.pencil ? 'pan-x pan-y pinch-zoom' : 'none';
    c.addEventListener('pointerdown', function (ev) {
      if (R.tool === 'note') { var q = pos(ev), t = prompt('메모 내용'); if (t && t.trim()) { R.ink[p].n.push({ x: q[0], y: q[1], t: t.trim().slice(0, 200) }); R.undo.push({ p: p, k: 'n' }); saveInk(p); notes(el, p); } return; }
      if (!drawing(ev)) return;
      ev.preventDefault(); c.setPointerCapture(ev.pointerId);
      if (R.tool === 'erase') { cur = { erase: true }; eraseAt(pos(ev)); return; }
      cur = { c: R.tool === 'hl' ? HLC[R.ci] : PENC[R.ci], w: R.tool === 'hl' ? 0.022 : 0.0028, hl: R.tool === 'hl', pts: [pos(ev)] };
    });
    c.addEventListener('pointermove', function (ev) {
      if (!cur) return; ev.preventDefault();
      if (cur.erase) { eraseAt(pos(ev)); return; }
      var evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev]; evs.forEach(function (x) { cur.pts.push(pos(x)); });
      var g = c.getContext('2d'); if (cur.hl) { redrawInk(el, p); stroke(g, c, cur); } else stroke(g, c, { c: cur.c, w: cur.w, hl: false, pts: cur.pts.slice(-evs.length - 1) });
    });
    function end() { if (!cur) return; if (!cur.erase && cur.pts.length) { if (cur.hl) cur.pts = smoothHl(cur.pts); R.ink[p].s.push(cur); R.undo.push({ p: p, k: 's' }); redrawInk(el, p); saveInk(p); } cur = null; }
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    function eraseAt(q) { var S = R.ink[p].s, n = S.length; R.ink[p].s = S.filter(function (st) { return !st.pts.some(function (a) { return Math.abs(a[0] - q[0]) < 0.02 && Math.abs(a[1] - q[1]) < 0.02; }); }); if (R.ink[p].s.length !== n) { redrawInk(el, p); saveInk(p); } }
  }
  /* 형광펜은 가로로 곧게(글줄 따라) */
  function smoothHl(pts) { if (pts.length < 2) return pts; var a = pts[0], b = pts[pts.length - 1]; if (Math.abs(b[1] - a[1]) < 0.02) { var y = (a[1] + b[1]) / 2; return pts.map(function (q) { return [q[0], y, q[2]]; }); } return pts; }
  function go(n) { if (!R) return; var step = R.spread ? 2 : 1, p = Math.max(1, Math.min(R.b.pages, n)); if (R.spread && p % 2 === 0 && p > 1) p -= 1; if (p === R.page) return; R.page = p; draw(); }
  function closeR() { if (!R) return; if (R.doc) R.doc.destroy(); R.box.remove(); R = null; document.documentElement.classList.remove('tbk-open'); refresh(); }
  function markList() {
    var side = R.box.querySelector('.tbk-side'), m = R.b.marks || [];
    side.hidden = !side.hidden; if (side.hidden) return;
    side.innerHTML = '<h3>📑 책갈피</h3>' + (m.length ? '<ul>' + m.map(function (x, i) { return '<li><button type="button" data-tbk-jump="' + x.p + '">' + e(x.label) + ' <small>' + x.p + '쪽</small></button><button type="button" class="tbk-x" data-tbk-unmark="' + i + '" aria-label="책갈피 지우기">✕</button></li>'; }).join('') + '</ul>' : '<p class="muted small">🔖 버튼으로 지금 쪽에 책갈피를 남겨.</p>') + '<button type="button" data-tbk-sideclose>닫기</button>';
  }
  function addMark() {
    var units = weekUnits(R.b.subject), def = units[0] ? '이번 주: ' + units[0] : R.page + '쪽';
    var label = prompt('책갈피 이름' + (units.length ? '\n(이번 주 진도: ' + units.join(' / ') + ')' : ''), def); if (!label) return;
    R.b.marks = (R.b.marks || []).concat({ p: R.page, label: label.trim().slice(0, 50) }).slice(-60); put('books', R.b.id, R.b); notice('책갈피를 남겼어.');
  }

  /* ---------- 붙이기 ---------- */
  if (location.hash === '#books') tab = 'books';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root || tab !== 'books') return;
    if (!loaded) refresh();
    root.innerHTML = shelf();
    document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); });
  };
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.tbkAdd != null) { adding = true; render(); return; }
    if (d.tbkCancel != null) { adding = false; render(); return; }
    if (d.tbkOpen) { openBook(d.tbkOpen); return; }
    if (d.tbkDel) { var bk = books.find(function (x) { return x.id === d.tbkDel; }); if (!bk || !confirm('"' + bk.title + '"을 책장에서 뺄까? 쓴 내용도 함께 지워져.')) return; var ks = [del('books', bk.id), del('files', bk.id)]; for (var i = 0; i < bk.pages; i++) { ks.push(del('files', bk.id + '#' + i)); ks.push(del('ink', bk.id + '#' + (i + 1))); } Promise.all(ks).then(refresh); return; }
    if (!R) return;
    if (d.tbkClose != null) { closeR(); return; }
    if (d.tbkPrev != null) { go(R.page - (R.spread ? 2 : 1)); return; }
    if (d.tbkNext != null) { go(R.page + (R.spread ? 2 : 1)); return; }
    if (d.tbkSpread != null) { R.spread = !R.spread; draw(); return; }
    if (d.tbkZoom) { R.zoom = Math.max(0.6, Math.min(2.5, R.zoom + (+d.tbkZoom) * 0.2)); draw(); return; }
    if (d.tbkTool) { R.tool = d.tbkTool; R.ci = 0; draw(); return; }
    if (d.tbkColor) { R.ci = +d.tbkColor; draw(); return; }
    if (d.tbkUndo != null) { var u = R.undo.pop(); if (!u || !R.ink[u.p]) return; (u.k === 's' ? R.ink[u.p].s : R.ink[u.p].n).pop(); saveInk(u.p); draw(); return; }
    if (d.tbkMark != null) { addMark(); return; }
    if (d.tbkMarks != null || d.tbkSideclose != null) { markList(); return; }
    if (d.tbkJump) { go(+d.tbkJump); return; }
    if (d.tbkUnmark) { R.b.marks.splice(+d.tbkUnmark, 1); put('books', R.b.id, R.b); var s = R.box.querySelector('.tbk-side'); s.hidden = true; markList(); return; }
    if (d.tbkNote) { var pr = d.tbkNote.split(':'), pp = +pr[0], ni = +pr[1], n = R.ink[pp].n[ni], t = prompt('메모 고치기 (비우면 지워져)', n.t); if (t === null) return; if (!t.trim()) R.ink[pp].n.splice(ni, 1); else n.t = t.trim().slice(0, 200); saveInk(pp); draw(); return; }
  });
  document.addEventListener('change', function (ev) { if (R && ev.target.matches && ev.target.matches('[data-tbk-goto]')) go(+ev.target.value || 1); });
  document.addEventListener('submit', function (ev) { if (ev.target.matches && ev.target.matches('[data-tbk-form]')) { ev.preventDefault(); addBook(ev.target); } });
  document.addEventListener('keydown', function (ev) { if (!R || /INPUT|TEXTAREA|SELECT/.test((ev.target.tagName || ''))) return; if (ev.key === 'ArrowRight') go(R.page + (R.spread ? 2 : 1)); else if (ev.key === 'ArrowLeft') go(R.page - (R.spread ? 2 : 1)); else if (ev.key === 'Escape') closeR(); });
  /* 손가락으로 옆으로 밀어 넘기기 (넘기기 도구일 때) */
  var sx = null;
  document.addEventListener('touchstart', function (ev) { if (!R || R.tool !== 'hand' && !R.pencil) return; if (!ev.target.closest('.tbk-stage') || ev.touches.length > 1) { sx = null; return; } sx = [ev.touches[0].clientX, ev.touches[0].clientY]; }, { passive: true });
  document.addEventListener('touchend', function (ev) { if (!R || !sx) return; var t = ev.changedTouches[0], dx = t.clientX - sx[0], dy = t.clientY - sx[1]; sx = null; if (Math.abs(dx) > 70 && Math.abs(dy) < 60 && R.zoom <= 1) go(R.page + (dx < 0 ? 1 : -1) * (R.spread ? 2 : 1)); }, { passive: true });
  window.addEventListener('resize', function () { if (R) { clearTimeout(R.rt); R.rt = setTimeout(draw, 250); } });
  window.FC_BOOKS = { refresh: refresh, open: openBook };

  var css = document.createElement('style');
  css.textContent = '.tbk-head{padding:2px 2px 10px}.tbk-head h1{margin:0;font-size:24px;color:var(--ink)}.tbk-head p{margin:4px 0 0;font-size:13.5px;color:var(--ink-2);line-height:1.55}' +
    '.tbk-btn{display:inline-flex;align-items:center;min-height:46px;padding:6px 16px;border-radius:999px;font-weight:800;text-decoration:none;background:var(--accent);color:var(--u-on-solid)}.tbk-official p{margin:6px 0 10px}' +
    '.tbk-shelf-h{display:flex;align-items:center;justify-content:space-between;gap:8px}.tbk-shelf-h h2{margin:0}.tbk-empty{margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--u-soft);font-size:15px}.tbk-empty ol{margin:6px 0 0;padding-left:20px;line-height:1.7}' +
    '.tbk-books{list-style:none;margin:12px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.tbk-books li{position:relative}' +
    '.tbk-book{all:unset;box-sizing:border-box;cursor:pointer;display:flex;width:100%;min-height:190px;border-radius:6px 14px 14px 6px;background:var(--u-soft);border:1px solid var(--u-line);box-shadow:var(--sh-1);overflow:hidden}.tbk-book:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
    '.tbk-spine{width:16px;flex:none;background:var(--c);box-shadow:none;background-image:linear-gradient(to left,color-mix(in srgb,var(--u-solid) 12%,transparent) 3px,transparent 3px)}.tbk-bt{display:flex;flex-direction:column;gap:6px;padding:14px 12px}.tbk-bt b{font-size:15px;line-height:1.35;color:var(--ink)}.tbk-bt small{font-size:12.5px;color:var(--ink-2);line-height:1.4}' +
    '.tbk-del{position:absolute;top:6px;right:6px;min-height:36px!important;width:36px;padding:0!important;border:0!important;background:color-mix(in srgb,var(--u-surface) 80%,transparent)!important;border-radius:50%!important;color:var(--ink-3)!important}' +
    '.tbk-form{display:grid;gap:10px;margin-top:10px;padding:12px;border-radius:12px;background:var(--u-soft)}.tbk-form label{display:grid!important;gap:4px;margin:0!important;font-size:13.5px;font-weight:700!important}.tbk-form select,.tbk-form input{min-height:44px;font:inherit;font-size:17px;border-radius:12px;border:1.5px solid var(--u-line);padding:4px 10px;background:var(--u-surface)}.tbk-file small{font-weight:500;color:var(--ink-2)}.tbk-btns{display:flex;gap:8px;margin:0}.tbk-prog{margin:0;font-size:13.5px;color:var(--accent-ink)}.tbk-note{margin-top:12px}' +
    /* 읽기 화면 */
    'html.tbk-open,html.tbk-open body{overflow:hidden}.tbk-reader{position:fixed;inset:0;z-index:9000;background:var(--u-solid);display:flex;flex-direction:column;color:var(--u-on-solid)}' +
    '.tbk-top,.tbk-tools{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--u-solid);flex-wrap:wrap}.tbk-tools{background:var(--u-solid);padding-top:6px;padding-bottom:6px}' +
    '.tbk-reader button{all:unset;box-sizing:border-box;cursor:pointer;min-height:44px;min-width:44px;padding:4px 10px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;gap:4px;color:var(--u-on-solid);font-size:15px;font-weight:700}.tbk-reader button:hover{background:color-mix(in srgb,var(--u-surface) 10%,transparent)}.tbk-reader button:focus-visible{outline:2px solid var(--accent)}' +
    '.tbk-title{flex:1;min-width:120px;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbk-pg{display:flex;align-items:center;gap:2px}.tbk-pg label{font-size:15px}.tbk-pg input{width:58px;min-height:36px;border-radius:8px;border:0;text-align:center;font:inherit;font-size:17px}.tbk-zoom{display:flex}' +
    '.tbk-tools button.on{background:var(--u-current);color:var(--u-on-current)}.tbk-tools button i{font-style:normal;font-size:17px}.tbk-tools button span{font-size:12.5px}.tbk-colors{display:flex;gap:4px;margin-left:4px}.tbk-colors button{min-width:36px;min-height:36px;padding:0;border-radius:50%}.tbk-colors button::after{content:"";width:22px;height:22px;border-radius:50%;background:var(--c);border:2px solid color-mix(in srgb,var(--u-line) 70%,transparent)}.tbk-colors button.on::after{border-color:var(--u-line);box-shadow:none;outline:2px solid var(--u-line);outline-offset:0px}.tbk-pencil{font-size:12.5px;color:var(--warn-ink);margin-left:auto}' +
    '.tbk-stage{flex:1;overflow:auto;display:flex;align-items:flex-start;justify-content:center;gap:16px;padding:12px;-webkit-overflow-scrolling:touch}.tbk-stage.spread .tbk-page:first-child .tbk-paper{border-radius:6px 2px 2px 6px}.tbk-stage.spread .tbk-page:last-child .tbk-paper{border-radius:2px 6px 6px 2px}' +
    '.tbk-page{display:flex;flex-direction:column;align-items:center;gap:4px}.tbk-paper{position:relative;background:var(--u-surface);box-shadow:var(--sh-2);border-radius:8px}.tbk-paper canvas{position:absolute;inset:0;display:block}.tbk-pno{font-size:12.5px;color:var(--ink-3)}' +
    '.tbk-notes{position:absolute;inset:0;pointer-events:none}.tbk-sticky{pointer-events:auto;position:absolute;transform:translate(-4px,-4px);max-width:180px;min-height:32px!important;padding:6px 8px!important;background:var(--u-soft)!important;color:var(--warn-ink)!important;font-size:12.5px!important;font-weight:600!important;line-height:1.35;border-radius:8px!important;box-shadow:var(--sh-1);text-align:left;white-space:pre-wrap;justify-content:flex-start!important}' +
    '.tbk-side{position:absolute;right:0;top:0;bottom:0;width:min(320px,86vw);background:var(--u-solid);padding:16px;overflow:auto;box-shadow:var(--sh-2)}.tbk-side h3{margin:0 0 10px}.tbk-side ul{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:4px}.tbk-side li{display:flex;gap:4px}.tbk-side li button:first-child{flex:1;justify-content:flex-start!important;text-align:left;background:color-mix(in srgb,var(--u-surface) 6%,transparent)}.tbk-side small{color:var(--ink-3);font-weight:500}' +
    '.tbk-loading,.tbk-err{margin:auto;text-align:center;color:var(--u-on-solid)}.tbk-err button{background:var(--accent)!important;margin-top:10px}' +
    '.tbk-reader button,.tbk-reader label,.tbk-reader .tbk-title{color:var(--u-on-solid)!important}.tbk-reader button{background-color:transparent;border:0!important;box-shadow:none!important}.tbk-reader .tbk-tools>button.on{color:var(--u-on-current)!important;background:var(--u-current)!important}.tbk-reader .tbk-colors button.on{background:transparent!important}.tbk-reader .tbk-sticky{position:absolute!important;display:block!important;background:var(--u-soft)!important}.tbk-reader .tbk-pg input{color:var(--ink)!important;background:var(--u-surface)!important}.tbk-reader .tbk-sticky{color:var(--warn-ink)!important}.tbk-reader .tbk-err button{background:var(--accent)!important}' +
    '@media(max-width:600px){.tbk-tools button span{display:none}.tbk-title{order:-1;flex-basis:100%}}';
  document.head.appendChild(css);
})();
