/* 학원 일정·진도 (이 기기 저장, 백업 포함). 시간표 탭에서 입력 → 오늘·이번 주·오늘 한눈에에 반영 */
(function (g) {
  'use strict';
  var KEY = 'fc_academy_v1', WD = ['일', '월', '화', '수', '목', '금', '토'];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var T = /^([01]\d|2[0-3]):[0-5]\d$/;
  function clean(x) {
    if (!x || typeof x !== 'object') return null;
    var days = Array.isArray(x.days) ? x.days.filter(function (d) { return Number.isInteger(d) && d >= 0 && d <= 6; }) : [];
    return {
      id: String(x.id || '').slice(0, 40) || Math.random().toString(36).slice(2, 10),
      name: String(x.name || '').trim().slice(0, 30), subject: String(x.subject || '').trim().slice(0, 20),
      days: days.filter(function (d, i) { return days.indexOf(d) === i; }).sort(),
      start: T.test(x.start) ? x.start : '', end: T.test(x.end) ? x.end : '',
      book: String(x.book || '').slice(0, 60), progress: String(x.progress || '').slice(0, 80), homework: String(x.homework || '').slice(0, 120),
      hwDone: !!x.hwDone,
      addr: String(x.addr || '').slice(0, 120), lat: Number.isFinite(+x.lat) && x.lat !== '' && x.lat != null ? +x.lat : null, lng: Number.isFinite(+x.lng) && x.lng !== '' && x.lng != null ? +x.lng : null
    };
  }
  function list() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.map(clean).filter(function (x) { return x && x.name; }).slice(0, 20) : []; } catch (e) { return []; } }
  function save(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 20))); return true; } catch (e) { return false; } }
  function forDay(iso) { var w = new Date(iso + 'T12:00:00Z').getUTCDay(); return list().filter(function (a) { return a.days.indexOf(w) >= 0; }).sort(function (a, b) { return (a.start || '99').localeCompare(b.start || '99'); }); }
  function when(a) { return a.days.map(function (d) { return WD[d]; }).join('·') + (a.start ? ' ' + a.start + (a.end ? '~' + a.end : '') : ''); }
  var editing = null;

  function panel() {
    var arr = list(), e = editing ? (arr.filter(function (a) { return a.id === editing; })[0] || {}) : {};
    return '<section class="card ac-card" id="academy-panel"><div class="section-title"><h2>🏫 학원</h2><span class="badge">' + (arr.length ? arr.length + '곳' : '정해지면 입력') + '</span></div>' +
      (arr.length ? '<ul class="ac-list">' + arr.map(function (a) {
        return '<li><div><b>' + esc(a.name) + '</b>' + (a.subject ? ' <small>' + esc(a.subject) + '</small>' : '') + '<br><span class="muted">' + esc(when(a)) + '</span>' +
          (a.progress ? '<br>📖 ' + esc(a.progress) + (a.book ? ' <small class="muted">(' + esc(a.book) + ')</small>' : '') : '') +
          (a.homework ? '<br><label class="ac-hw"><input type="checkbox" data-ac-hw="' + esc(a.id) + '" ' + (a.hwDone ? 'checked' : '') + '> 숙제: ' + esc(a.homework) + '</label>' : '') +
          '</div><div class="ac-btns"><button data-ac-edit="' + esc(a.id) + '">고치기</button><button class="delete" data-ac-del="' + esc(a.id) + '" aria-label="' + esc(a.name) + ' 삭제">×</button></div></li>';
      }).join('') + '</ul>' : '<p class="muted">학원이 정해지면 여기에 넣어줘. 요일·시간을 넣으면 오늘·이번 주·오늘 한눈에 화면에 같이 나와.</p>') +
      '<details class="ac-form-wrap"' + (editing || !arr.length ? ' open' : '') + '><summary>' + (editing ? '✏️ ' + esc(e.name) + ' 고치기' : '+ 학원 추가') + '</summary>' +
      '<form data-ac-form' + (editing ? ' data-id="' + esc(editing) + '"' : '') + '>' +
        '<div class="ac-row"><label>학원 이름<input name="name" required maxlength="30" value="' + esc(e.name) + '" placeholder="예: ○○수학"></label><label>과목<input name="subject" maxlength="20" value="' + esc(e.subject) + '" placeholder="예: 수학"></label></div>' +
        '<fieldset class="ac-days"><legend>요일</legend>' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<label><input type="checkbox" name="day" value="' + d + '" ' + ((e.days || []).indexOf(d) >= 0 ? 'checked' : '') + '>' + WD[d] + '</label>'; }).join('') + '</fieldset>' +
        '<div class="ac-row"><label>시작<input type="time" name="start" value="' + esc(e.start) + '"></label><label>끝<input type="time" name="end" value="' + esc(e.end) + '"></label></div>' +
        '<label>학원 주소 <small class="muted">(이동 동선·길찾기용)</small><input name="addr" maxlength="120" value="' + esc(e.addr) + '" placeholder="예: 서울 서초구 서초대로 ○○"></label>' +
        '<label>교재<input name="book" maxlength="60" value="' + esc(e.book) + '" placeholder="예: 쎈 공통수학2"></label>' +
        '<label>지금 진도<input name="progress" maxlength="80" value="' + esc(e.progress) + '" placeholder="예: 원의 방정식 p.120까지"></label>' +
        '<label>다음 수업까지 숙제<input name="homework" maxlength="120" value="' + esc(e.homework) + '" placeholder="예: 유형 3~5 풀기"></label>' +
        '<p><button class="primary">' + (editing ? '고친 내용 저장' : '학원 저장') + '</button>' + (editing ? ' <button type="button" data-ac-cancel>취소</button>' : '') + '</p>' +
      '</form></details></section>';
  }
  function rerender() { if (typeof render === 'function') render(); }
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f.matches || !f.matches('[data-ac-form]')) return; ev.preventDefault();
    var d = new FormData(f), arr = list(), id = f.getAttribute('data-id');
    var prev = id ? list().filter(function (x) { return x.id === id; })[0] : null, addr = String(d.get('addr') || '').trim();
    var item = clean({ id: id || '', name: d.get('name'), subject: d.get('subject'), days: d.getAll('day').map(Number), start: d.get('start'), end: d.get('end'), book: d.get('book'), progress: d.get('progress'), homework: d.get('homework'), addr: addr,
      lat: prev && prev.addr === addr ? prev.lat : null, lng: prev && prev.addr === addr ? prev.lng : null });
    if (!item.name) return;
    if (!item.days.length && typeof notice === 'function') notice('요일을 하나 이상 골라줘. 오늘·이번 주 화면에 나오려면 필요해.');
    if (id) { arr = arr.map(function (a) { if (a.id !== id) return a; item.hwDone = a.homework === item.homework ? a.hwDone : false; return item; }); } else arr.push(item);
    if (save(arr)) {
      editing = null; if (typeof notice === 'function') notice('학원 정보를 저장했어 🐾'); rerender();
      if (item.addr && item.lat == null && g.FC_ROUTE) g.FC_ROUTE.geocode(item.addr).then(function (p) {
        if (!p) { if (typeof notice === 'function') notice('주소로 위치를 못 찾았어. 도로명 주소로 다시 적어줘.'); return; }
        save(list().map(function (x) { if (x.id === item.id) { x.lat = p.lat; x.lng = p.lng; } return x; })); rerender();
      });
    }
  });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button'); if (!b) return;
    if (b.dataset.acEdit) { editing = b.dataset.acEdit; rerender(); setTimeout(function () { var p = document.getElementById('academy-panel'); if (p) p.scrollIntoView({ block: 'start' }); }, 30); }
    if (b.dataset.acDel) { var a = list().filter(function (x) { return x.id === b.dataset.acDel; })[0]; if (a && confirm(a.name + ' 정보를 지울까?')) { save(list().filter(function (x) { return x.id !== a.id; })); rerender(); } }
    if (b.hasAttribute('data-ac-cancel')) { editing = null; rerender(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t.dataset || !t.dataset.acHw) return;
    save(list().map(function (a) { if (a.id === t.dataset.acHw) a.hwDone = t.checked; return a; }));
  });
  var css = document.createElement('style');
  css.textContent = '.ac-list{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:10px}.ac-list li{display:flex;justify-content:space-between;gap:10px;border:1px solid #ebe6f5;border-radius:14px;padding:10px 12px;font-size:14px}.ac-btns{display:flex;gap:6px;align-items:flex-start}.ac-btns button{min-height:36px;padding:4px 10px}' +
    '.ac-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ac-days{border:0;padding:0;margin:10px 0 0;display:flex;flex-wrap:wrap;gap:6px}.ac-days legend{font-size:14px;margin-bottom:6px}.ac-days label{display:inline-flex;align-items:center;gap:4px;margin:0;border:1px solid #dad5ec;border-radius:10px;padding:6px 10px;font-size:14px}.ac-days input{width:18px;min-height:18px}' +
    '.ac-hw{display:inline-flex;gap:6px;align-items:center;margin:4px 0 0;font-size:13.5px}.ac-hw input{width:18px;min-height:18px}.ac-form-wrap summary{cursor:pointer;font-weight:700;color:#6250ce;margin:6px 0}';
  document.head.appendChild(css);
  g.FC_ACADEMY = { list: list, forDay: forDay, when: when, panel: panel, KEY: KEY };
})(window);
