/* 학원 일정·진도 (이 기기 저장, 백업 포함). 시간표 탭에서 입력 → 오늘·이번 주·오늘 한눈에에 반영 */
(function (g) {
  'use strict';
  var KEY = 'fc_academy_v1', WD = ['일', '월', '화', '수', '목', '금', '토'], OCC = g.FC_ACADEMY_OCCURRENCES;
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
      from: /^\d{4}-\d{2}-\d{2}$/.test(x.from || '') ? x.from : '', note: String(x.note || '').trim().slice(0, 80), tel: String(x.tel || '').replace(/[^\d-]/g, '').slice(0, 15),
      addr: String(x.addr || '').slice(0, 120), lat: Number.isFinite(+x.lat) && x.lat !== '' && x.lat != null ? +x.lat : null, lng: Number.isFinite(+x.lng) && x.lng !== '' && x.lng != null ? +x.lng : null
    };
  }
  function list() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.map(clean).filter(function (x) { return x && x.name; }).slice(0, 20) : []; } catch (e) { return []; } }
  function save(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 20))); return true; } catch (e) { return false; } }
  function occurrences() { try { return OCC ? OCC.cleanRecords(JSON.parse(localStorage.getItem(OCC.KEY) || '[]')) : []; } catch (e) { return []; } }
  function forDay(iso) { if (OCC) return OCC.forDay(list(), occurrences(), iso); var w = new Date(iso + 'T12:00:00Z').getUTCDay(); return list().filter(function (a) { return a.days.indexOf(w) >= 0 && (!a.from || iso >= a.from); }).sort(function (a, b) { return (a.start || '99').localeCompare(b.start || '99'); }); }
  function when(a) { return a.days.map(function (d) { return WD[d]; }).join('·') + (a.start ? ' ' + a.start + (a.end ? '~' + a.end : '') : '') + (a.from && a.from > today0() ? ' (' + Number(a.from.slice(5, 7)) + '/' + Number(a.from.slice(8)) + '부터)' : ''); }
  function today0() { return typeof today === 'function' ? today() : new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  var editing = null, editDate = '', editScope = 'one';

  function saveChange(arr, records) {
    if (!records || !OCC) return save(arr);
    var before, beforeRecords;
    try {
      before = localStorage.getItem(KEY); beforeRecords = localStorage.getItem(OCC.KEY);
      localStorage.setItem(OCC.KEY, JSON.stringify(records)); localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 20))); return true;
    } catch (e) {
      try { if (beforeRecords === null) localStorage.removeItem(OCC.KEY); else if (beforeRecords !== undefined) localStorage.setItem(OCC.KEY, beforeRecords);
        if (before === null) localStorage.removeItem(KEY); else if (before !== undefined) localStorage.setItem(KEY, before); } catch (ignore) {}
      return false;
    }
  }
  function scopeFields() {
    var f = document.querySelector('[data-ac-form][data-id]'); if (!f) return;
    var scope = f.querySelector('[name=scope]:checked'), one = !scope || scope.value === 'one', cancel = f.querySelector('[name=cancelled]');
    f.querySelectorAll('[name=day]').forEach(function (x) { x.disabled = one; });
    var move = f.querySelector('[data-ac-move]'); if (move) move.hidden = !one;
    var hint = f.querySelector('[data-ac-day-hint]'); if (hint) hint.textContent = one ? '이번 한 번은 아래 날짜·시간만 바뀌어요.' : '선택한 날부터 반복 요일·시간이 바뀌어요. 이전 일정과 따로 바꾼 한 번의 일정은 유지돼요.';
    f.querySelectorAll('[name=start],[name=end],[name=moveTo]').forEach(function (x) { x.disabled = !!(cancel && cancel.checked); });
  }
  function setDateFields(f) {
    if (!OCC) return;
    var a = list().filter(function (x) { return x.id === f.getAttribute('data-id'); })[0], date = f.querySelector('[name=occurrenceDate]');
    if (!a || !date || !OCC.validDate(date.value)) return;
    var s = OCC.scheduleFor(a, occurrences(), date.value); if (!s) return;
    editDate = date.value;
    ['start', 'end', 'moveTo'].forEach(function (k) { var el = f.querySelector('[name=' + k + ']'); if (el) el.value = s[k] || (k === 'moveTo' ? date.value : ''); });
    f.querySelectorAll('[name=day]').forEach(function (x) { x.checked = s.days.indexOf(Number(x.value)) >= 0; });
    var c = f.querySelector('[name=cancelled]'); if (c) c.checked = !!s.cancelled;
    scopeFields();
  }

  function panel() {
    var arr = list(), base = editing ? (arr.filter(function (a) { return a.id === editing; })[0] || {}) : {}, e = base;
    if (editing && OCC && base.id) { if (!editDate) editDate = OCC.nextDate(base, occurrences(), today0()); e = OCC.scheduleFor(base, occurrences(), editDate) || base; }
    return '<section class="card ac-card" id="academy-panel"><div class="section-title"><h2>🏫 학원</h2><span class="badge">' + (arr.length ? arr.length + '곳' : '정해지면 입력') + '</span></div>' +
      (arr.length ? '<ul class="ac-list">' + arr.map(function (a) {
        return '<li><div><b>' + esc(a.name) + '</b>' + (a.subject ? ' <small>' + esc(a.subject) + '</small>' : '') + '<br><span class="muted">' + esc(when(a)) + '</span>' +
          (a.addr ? '<br>📍 ' + esc(a.addr) : '') + (a.tel ? '<br>☎️ <a href="tel:' + esc(a.tel) + '">' + esc(a.tel) + '</a>' : '') + (a.note ? '<br>📝 ' + esc(a.note) : '') + (a.progress ? '<br>📖 ' + esc(a.progress) + (a.book ? ' <small class="muted">(' + esc(a.book) + ')</small>' : '') : '') +
          (a.homework ? '<br><label class="ac-hw"><input type="checkbox" data-ac-hw="' + esc(a.id) + '" ' + (a.hwDone ? 'checked' : '') + '> 숙제: ' + esc(a.homework) + '</label>' : '') +
          (OCC && occurrences().some(function (x) { return x.academyId === a.id; }) ? '<br><small class="muted">바꾼 수업 일정은 오늘·주간 화면에 반영돼요.</small>' : '') +
          '</div><div class="ac-btns"><button data-ac-edit="' + esc(a.id) + '">고치기</button><button class="delete" data-ac-del="' + esc(a.id) + '" aria-label="' + esc(a.name) + ' 삭제">×</button></div></li>';
      }).join('') + '</ul>' : '<p class="muted">학원이 정해지면 여기에 넣어줘. 요일·시간을 넣으면 오늘·이번 주·오늘 한눈에 화면에 같이 나와.</p>') +
      '<details class="ac-form-wrap"' + (editing || !arr.length ? ' open' : '') + '><summary>' + (editing ? '✏️ ' + esc(e.name) + ' 고치기' : '+ 학원 추가') + '</summary>' +
      '<form data-ac-form' + (editing ? ' data-id="' + esc(editing) + '"' : '') + '>' +
        '<div class="ac-row"><label>학원 이름<input name="name" required maxlength="30" value="' + esc(e.name) + '" placeholder="예: ○○수학"></label><label>과목<input name="subject" maxlength="20" value="' + esc(e.subject) + '" placeholder="예: 수학"></label></div>' +
        (editing && OCC ? '<fieldset class="ac-days"><legend>수업 일정을 바꾸는 범위</legend><label><input type="radio" name="scope" value="one" ' + (editScope === 'one' ? 'checked' : '') + '>이번 한 번만</label><label><input type="radio" name="scope" value="future" ' + (editScope === 'future' ? 'checked' : '') + '>이번부터 이후 일정 모두</label></fieldset>' +
          '<label>바꿀 수업 날짜<input type="date" name="occurrenceDate" data-ac-occ-date required min="' + esc(base.from) + '" value="' + esc(editDate) + '"></label><p class="muted" data-ac-day-hint>' + (editScope === 'one' ? '이번 한 번은 아래 날짜·시간만 바뀌어요.' : '선택한 날부터 반복 요일·시간이 바뀌어요. 이전 일정과 따로 바꾼 한 번의 일정은 유지돼요.') + '</p>' +
          '<label data-ac-move' + (editScope === 'future' ? ' hidden' : '') + '>이번 수업을 하는 날<input type="date" name="moveTo" min="' + esc(base.from) + '" value="' + esc(e.moveTo || editDate) + '"></label><label class="ac-hw"><input type="checkbox" name="cancelled" ' + (e.cancelled ? 'checked' : '') + '>선택한 범위의 수업 쉬기</label>' : '') +
        '<fieldset class="ac-days"><legend>' + (editing && OCC ? '반복 요일 (이후 일정 모두에 적용)' : '요일') + '</legend>' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<label><input type="checkbox" name="day" value="' + d + '" ' + ((e.days || []).indexOf(d) >= 0 ? 'checked' : '') + (editing && OCC && editScope === 'one' ? ' disabled' : '') + '>' + WD[d] + '</label>'; }).join('') + '</fieldset>' +
        '<div class="ac-row"><label>시작<input type="time" name="start" value="' + esc(e.start) + '"></label><label>끝<input type="time" name="end" value="' + esc(e.end) + '"></label></div>' +
        '<div class="ac-row"><label>' + (editing && OCC ? '처음 시작한 날' : '시작하는 날 <small class="muted">(이 날부터 표시)</small>') + '<input type="date" name="from" value="' + esc(base.from) + '"' + (editing && OCC ? ' readonly' : '') + '></label><label>전화<input name="tel" inputmode="tel" maxlength="15" value="' + esc(e.tel) + '" placeholder="02-000-0000"></label></div><div class="ac-row"><label>메모<input name="note" maxlength="80" value="' + esc(e.note) + '" placeholder="예: 결제해야 함"></label></div>' +
        '<label>학원 주소 <small class="muted">(이동 동선·길찾기용)</small><input name="addr" maxlength="120" value="' + esc(e.addr) + '" placeholder="예: 서울 서초구 서초대로 ○○"></label>' +
        '<label>교재<input name="book" maxlength="60" value="' + esc(e.book) + '" placeholder="예: 쎈 공통수학2"></label>' +
        '<label>지금 진도<input name="progress" maxlength="80" value="' + esc(e.progress) + '" placeholder="예: 원의 방정식 p.120까지"></label>' +
        '<label>다음 수업까지 숙제<input name="homework" maxlength="120" value="' + esc(e.homework) + '" placeholder="예: 유형 3~5 풀기"></label>' +
        (editing && OCC ? '<p class="muted">학원 이름·과목·주소·진도·숙제는 학원 정보로 저장돼요. 날짜·요일·시간은 선택한 범위에 적용돼요.</p>' : '') +
        '<p><button class="primary">' + (editing ? '고친 내용 저장' : '학원 저장') + '</button>' + (editing ? ' <button type="button" data-ac-cancel>취소</button>' : '') + '</p>' +
      '</form></details></section>';
  }
  function rerender() { if (typeof render === 'function') render(); }
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f.matches || !f.matches('[data-ac-form]')) return; ev.preventDefault();
    var d = new FormData(f), arr = list(), id = f.getAttribute('data-id');
    var prev = id ? arr.filter(function (x) { return x.id === id; })[0] : null, addr = String(d.get('addr') || '').trim(), records = null;
    if (id && !prev) return;
    var scope = String(d.get('scope') || ''), scoped = id && OCC && ['one', 'future'].indexOf(scope) >= 0;
    var selected = scoped ? String(d.get('occurrenceDate') || '') : '', prior = scoped ? OCC.scheduleFor(prev, occurrences(), selected) : null;
    if (scoped) {
      if (!prior || prev.from && selected < prev.from) { if (typeof notice === 'function') notice('처음 시작한 날 이후의 수업 날짜를 골라줘.'); return; }
      if (scope === 'one' && !prior.isOccurrence) { if (typeof notice === 'function') notice('반복 요일에 있는 수업 날짜를 골라줘. 요일을 바꾸려면 이후 일정 모두를 선택해줘.'); return; }
      var cancelled = d.get('cancelled') === 'on', target = scope === 'one' ? String(d.get('moveTo') || selected) : '';
      if (scope === 'one' && (!OCC.validDate(target) || prev.from && target < prev.from)) { if (typeof notice === 'function') notice('이번 수업을 하는 날짜를 확인해줘.'); return; }
      var record = OCC.cleanRecord({ academyId: id, scope: scope, date: selected, days: scope === 'one' ? prior.days : d.getAll('day').map(Number),
        start: cancelled ? prior.start : String(d.get('start') || ''), end: cancelled ? prior.end : String(d.get('end') || ''), cancelled: cancelled, moveTo: target, updatedAt: Date.now() });
      if (!record || !cancelled && scope === 'future' && !record.days.length) { if (typeof notice === 'function') notice('반복 요일과 시작·끝 시간을 확인해줘. 끝 시간은 시작 시간보다 늦어야 해.'); return; }
      records = occurrences().filter(function (x) { return x.id !== record.id; });
      if (!cancelled && scope === 'one' && target !== selected && OCC.forDay([prev], records, target).length) { if (typeof notice === 'function') notice('그날에도 같은 학원 일정이 있어. 다른 날짜를 골라줘.'); return; }
      if (records.length >= OCC.LIMIT) { if (typeof notice === 'function') notice('바꾼 일정이 많아 더 저장할 수 없어. 기록을 백업한 뒤 정리해줘.'); return; }
      records.push(record);
    }
    var item = clean({ id: id || '', name: d.get('name'), subject: d.get('subject'), days: d.getAll('day').map(Number), start: d.get('start'), end: d.get('end'), book: d.get('book'), progress: d.get('progress'), homework: d.get('homework'), addr: addr, from: d.get('from'), note: d.get('note'), tel: d.get('tel'),
      lat: prev && prev.addr === addr ? prev.lat : null, lng: prev && prev.addr === addr ? prev.lng : null });
    if (scoped) { item.days = prev.days.slice(); item.start = prev.start; item.end = prev.end; item.from = prev.from; }
    if (!item.name) return;
    if (!item.days.length && typeof notice === 'function') notice('요일을 하나 이상 골라줘. 오늘·이번 주 화면에 나오려면 필요해.');
    if (id) { arr = arr.map(function (a) { if (a.id !== id) return a; item.hwDone = a.homework === item.homework ? a.hwDone : false; return item; }); } else arr.push(item);
    if (saveChange(arr, records)) {
      editing = null; editDate = ''; editScope = 'one'; if (typeof notice === 'function') notice(scoped ? (scope === 'one' ? '이번 한 번의 수업을 저장했어 🐾' : '이 날부터 이후 수업 일정을 저장했어 🐾') : '학원 정보를 저장했어 🐾'); rerender();
      if (item.addr && item.lat == null && g.FC_ROUTE) g.FC_ROUTE.geocode(item.addr).then(function (p) {
        if (!p) { if (typeof notice === 'function') notice('주소로 위치를 못 찾았어. 도로명 주소로 다시 적어줘.'); return; }
        save(list().map(function (x) { if (x.id === item.id) { x.lat = p.lat; x.lng = p.lng; } return x; })); rerender();
      });
    } else if (typeof notice === 'function') notice('저장 공간을 확인해줘. 입력한 내용은 이 화면에 남아 있어.');
  });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button'); if (!b) return;
    if (b.dataset.acEdit) { editing = b.dataset.acEdit; editDate = b.dataset.acDate || ''; editScope = 'one'; if (typeof tab !== 'undefined' && tab !== 'settings') { tab = 'settings'; history.replaceState(null, '', '#settings'); } rerender(); setTimeout(function () { var p = document.getElementById('academy-panel'); if (p) p.scrollIntoView({ block: 'start' }); }, 30); }
    if (b.dataset.acDel) { var a = list().filter(function (x) { return x.id === b.dataset.acDel; })[0]; if (a && confirm(a.name + ' 정보를 지울까?')) { save(list().filter(function (x) { return x.id !== a.id; })); rerender(); } }
    if (b.hasAttribute('data-ac-cancel')) { editing = null; editDate = ''; editScope = 'one'; rerender(); }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, f = t.closest && t.closest('[data-ac-form][data-id]');
    if (f && t.name === 'scope') { editScope = t.value; scopeFields(); return; }
    if (f && t.name === 'occurrenceDate') { setDateFields(f); return; }
    if (f && t.name === 'cancelled') { scopeFields(); return; }
    if (!t.dataset || !t.dataset.acHw) return;
    save(list().map(function (a) { if (a.id === t.dataset.acHw) a.hwDone = t.checked; return a; }));
  });
  var css = document.createElement('style');
  css.textContent = '.ac-list{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:10px}.ac-list li{display:flex;justify-content:space-between;gap:10px;border:1px solid #ebe6f5;border-radius:12px;padding:10px 12px;font-size:15px}.ac-btns{display:flex;gap:6px;align-items:flex-start}.ac-btns button{min-height:36px;padding:4px 10px}' +
    '.ac-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ac-days{border:0;padding:0;margin:10px 0 0;display:flex;flex-wrap:wrap;gap:6px}.ac-days legend{font-size:15px;margin-bottom:6px}.ac-days label{display:inline-flex;align-items:center;gap:4px;margin:0;border:1px solid #dad5ec;border-radius:12px;padding:6px 10px;font-size:15px}.ac-days input{width:18px;min-height:18px}' +
    '.ac-hw{display:inline-flex;gap:6px;align-items:center;margin:4px 0 0;font-size:13.5px}.ac-hw input{width:18px;min-height:18px}.ac-form-wrap summary{cursor:pointer;font-weight:700;color:#6250ce;margin:6px 0}';
  document.head.appendChild(css);
  g.FC_ACADEMY = { list: list, forDay: forDay, when: when, panel: panel, occurrences: occurrences, KEY: KEY };

  /* 2026-10 학원 시간표(엄마가 준 표) 한 번만 넣기 — 같은 id·이름이 있으면 건너뜀. 가족 공유로 다른 폰과 합쳐짐 */
  var SEED_FLAG = 'fc-ac-seed-20261010';
  var SEED = [
    { id: 'seed-kor', name: '송림 국어 (채리)', subject: '국어', days: [3], start: '16:00', end: '19:00', from: '2026-10-21' },
    { id: 'seed-math', name: '다원교육 대치', subject: '수학', days: [2, 4], start: '18:00', end: '22:00', from: '2026-10-15' },
    { id: 'seed-eng', name: '송림본원 (반포)', subject: '영어', days: [0], start: '09:30', end: '13:00', from: '2026-10-25' },
    { id: 'seed-sci', name: '탑클래스 서초', subject: '과학', days: [6], start: '19:00', end: '22:00', from: '2026-10-17', note: '결제해야 함' }
  ];
  function seed() {
    try { if (localStorage.getItem(SEED_FLAG)) return; } catch (e) { return; }
    var arr = list(), n = 0;
    var nm = function (v) { return v.replace(/[\s()]/g, ''); };
    SEED.forEach(function (x) {
      var hit = arr.filter(function (a) { return a.id === x.id || nm(a.name) === nm(x.name); })[0];
      if (!hit) { arr.push(clean(x)); n++; return; }
      ['subject', 'start', 'end', 'from', 'note'].forEach(function (k) { if (x[k]) hit[k] = x[k]; }); hit.days = x.days.slice(); n++;   // 표 기준으로 요일·시간 맞춤(진도·숙제·주소는 그대로)
    });
    if (n) save(arr);
    try {   // PT: 금 18:00 (끝 시간은 1시간으로 추정) → 일상 일정
      var L = JSON.parse(localStorage.getItem('fc_life_v1') || '{}') || {}; L.items = Array.isArray(L.items) ? L.items : [];
      if (!L.items.some(function (x) { return x.id === 'seed-pt' || x.title === 'PT'; })) { L.items.push({ id: 'seed-pt', title: 'PT', icon: '💪', start: '18:00', end: '19:00', days: [5] }); localStorage.setItem('fc_life_v1', JSON.stringify(L)); n++; }
      localStorage.setItem(SEED_FLAG, '1');
    } catch (e) {}
    if (n && typeof render === 'function') render();
  }
  /* 학원 주소·전화 (엄마가 알려준 것). 비어 있을 때만 채움 */
  var INFO_FLAG = 'fc-ac-info-20261010';
  var INFO = [
    { id: 'seed-math', name: '다원교육 대치', tel: '02-3454-1162' },
    { id: 'seed-eng', name: '송림본원 (반포)', addr: '서울 서초구 반포대로 300-3', tel: '02-508-1245', note: '3~4층' },
    { id: 'seed-sci', name: '탑클래스 서초', addr: '서울 서초구 명달로9길 6', note: '제중빌딩 3층 · 서울고 사거리 인근' },
    { id: 'seed-kor', name: '송림 국어 (채리)', tel: '02-508-1245', note: '강의 장소 확인 필요: 본관(반포대로 300-3, 3~4층) 또는 서초관(명달로9길 4, 3층)' }
  ];
  function info() {
    try { if (localStorage.getItem(INFO_FLAG) || !localStorage.getItem(SEED_FLAG)) return; } catch (e) { return; }
    var arr = list(), nm = function (v) { return v.replace(/[\s()]/g, ''); }, geo = [];
    INFO.forEach(function (x) {
      var a = arr.filter(function (y) { return y.id === x.id || nm(y.name) === nm(x.name); })[0]; if (!a) return;
      if (x.addr && !a.addr) { a.addr = x.addr; a.lat = null; a.lng = null; geo.push(a.id); }
      if (x.tel && !a.tel) a.tel = x.tel;
      if (x.note && (a.note || '').indexOf(x.note) < 0) a.note = ((a.note ? a.note + ' · ' : '') + x.note).slice(0, 80);
    });
    save(arr); try { localStorage.setItem(INFO_FLAG, '1'); } catch (e) {}
    if (typeof render === 'function') render();
    if (g.FC_ROUTE && g.FC_ROUTE.geocode) geo.forEach(function (id) {   // 길찾기용 좌표(찾으면 저장)
      var a0 = list().filter(function (y) { return y.id === id; })[0]; if (!a0) return;
      g.FC_ROUTE.geocode(a0.addr).then(function (p) { if (!p) return; var arr2 = list(); arr2.forEach(function (y) { if (y.id === id) { y.lat = p.lat; y.lng = p.lng; } }); save(arr2); });
    });
  }
  /* 2차: 수학 주소, 국어는 본관으로 (엄마 확인) */
  var INFO2_FLAG = 'fc-ac-info-20261010b';
  function info2() {
    try { if (localStorage.getItem(INFO2_FLAG) || !localStorage.getItem(INFO_FLAG)) return; } catch (e) { return; }
    var arr = list(), nm = function (v) { return v.replace(/[\s()]/g, ''); }, geo = [];
    var get = function (id, name) { return arr.filter(function (y) { return y.id === id || nm(y.name) === nm(name); })[0]; };
    var m = get('seed-math', '다원교육 대치');
    if (m) { if (!m.addr) { m.addr = '서울 강남구 도곡로 501'; m.lat = null; m.lng = null; geo.push(m.id); } if ((m.note || '').indexOf('고등관') < 0) m.note = ((m.note ? m.note + ' · ' : '') + '고등관 2층').slice(0, 80); }
    var k = get('seed-kor', '송림 국어 (채리)');
    if (k) { if (!k.addr) { k.addr = '서울 서초구 반포대로 300-3'; k.lat = null; k.lng = null; geo.push(k.id); } k.note = (k.note || '').replace(/강의 장소 확인 필요:[^·]*/, '').replace(/^[\s·]+|[\s·]+$/g, ''); if (k.note.indexOf('본관') < 0) k.note = ((k.note ? k.note + ' · ' : '') + '본관 3~4층').slice(0, 80); }
    save(arr); try { localStorage.setItem(INFO2_FLAG, '1'); } catch (e) {}
    if (typeof render === 'function') render();
    if (g.FC_ROUTE && g.FC_ROUTE.geocode) geo.forEach(function (id) {
      var a0 = list().filter(function (y) { return y.id === id; })[0]; if (!a0) return;
      g.FC_ROUTE.geocode(a0.addr).then(function (p) { if (!p) return; var arr2 = list(); arr2.forEach(function (y) { if (y.id === id) { y.lat = p.lat; y.lng = p.lng; } }); save(arr2); });
    });
  }
  setTimeout(function () { seed(); info(); info2(); }, 3500);   // 가족 동기화 첫 받기가 끝난 뒤
})(window);
