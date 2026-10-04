/* 오늘의 학교: 급식 · 내 반 시간표 · 내 학년 학사일정 (dist/school.json, 2시간마다 자동 수집)
   <section id="school-today"></section> 이 있는 화면이면 어디든 자동으로 채운다. */
(function () {
  'use strict';
  var CLASS_KEY = 'fc_school_class';
  var data = null, loading = null;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function todayKST() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function dayLabel(iso) {
    var d = new Date(iso + 'T12:00:00Z'); var w = '일월화수목금토'[d.getUTCDay()];
    return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '(' + w + ')';
  }
  function dday(iso) {
    var diff = Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(todayKST() + 'T00:00:00Z')) / 86400000);
    return diff === 0 ? '오늘' : diff > 0 ? 'D-' + diff : '';
  }
  function load() {
    if (loading) return loading;
    loading = fetch('school.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw Error('http'); return r.json(); })
      .then(function (d) { data = d; return d; }).catch(function () { data = null; return null; });
    return loading;
  }

  function render(box) {
    var info = window.FC_SCHOOL ? window.FC_SCHOOL.info() : { labelLong: '우리 학교', grade: 1, phase: 'school' };
    var cfg = window.FC_SCHOOL ? window.FC_SCHOOL.config : { homepage: 'https://seocho.sen.hs.kr/', shortName: '학교' };
    var today = todayKST();
    if (info.phase === 'graduated') {
      box.innerHTML = '<div class="st-head"><h2>🎓 졸업 축하해!</h2></div><p class="st-muted">고등학교 과정이 끝났어. 학교 정보 자동 수집은 멈췄어.</p>';
      return;
    }
    var CAL = window.FC_CAL;
    var off = CAL ? CAL.offDay(today) : null;
    var head = '<div class="st-head"><h2>🏫 오늘의 학교</h2><span class="st-badge">' + esc(info.labelLong) + '</span></div>' +
      (off ? '<p class="st-off">🌿 오늘은 <b>' + esc(off.name) + '</b>' + (off.weekend ? '' : '(' + esc(off.kind) + ')') + '이라 수업이 없어. 다음 등교일은 ' + esc(dayLabel(CAL.nextSchoolDay(today))) + '.</p>' : '');
    if (!data) {
      box.innerHTML = head + '<p class="st-muted">학교 정보를 불러오지 못했어. <a href="' + esc(cfg.homepage) + '" target="_blank" rel="noopener">학교 홈페이지에서 확인하기 ↗</a></p>';
      return;
    }
    // 급식
    var todayMeals = (data.meals || []).filter(function (m) { return m.date === today; });
    var nextMeal = todayMeals.length ? null : (data.meals || []).filter(function (m) { return m.date > today; })[0];
    var mealHtml = todayMeals.length
      ? todayMeals.map(function (m) { return '<div class="st-meal"><b>' + esc(m.kind) + '</b><span>' + m.dishes.map(esc).join(' · ') + '</span></div>'; }).join('')
      : nextMeal ? '<p class="st-muted">오늘은 급식이 없어. 다음 급식 ' + esc(dayLabel(nextMeal.date)) + ': ' + nextMeal.dishes.slice(0, 4).map(esc).join(' · ') + '</p>'
      : '<p class="st-muted">급식 정보가 아직 없어.</p>';
    // 시간표
    var classes = (data.timetable && data.timetable.classes) || {};
    var classNames = Object.keys(classes);
    var myClass = lsGet(CLASS_KEY) || '';
    if (myClass && classNames.indexOf(myClass) < 0) myClass = '';
    var ttHtml;
    if (!data.keyed) ttHtml = '<p class="st-muted">시간표는 나이스 인증키를 연결하면 반별로 보여. 지금은 공부방 시간표에 직접 적어 둬.</p>';
    else if (!classNames.length) ttHtml = '<p class="st-muted">이번 주 시간표가 아직 공개되지 않았어. 공부방 시간표에 직접 적어 둬도 돼.</p>';
    else {
      var sel = '<label class="st-class">반 <select data-st-class>' + '<option value="">선택</option>' + classNames.map(function (c) { return '<option ' + (c === myClass ? 'selected' : '') + ' value="' + esc(c) + '">' + esc(c) + '반</option>'; }).join('') + '</select></label>';
      if (!myClass) ttHtml = sel + '<p class="st-muted">내 반을 고르면 오늘 시간표가 보여. 한 번만 고르면 기억할게.</p>';
      else {
        var days = classes[myClass]; var periods = days[today];
        var dayKeys = Object.keys(days).filter(function (d) { return d >= today && (!CAL || CAL.isSchoolDay(d)); });
        var showDay = periods && !off ? today : dayKeys[0];
        var list = showDay ? days[showDay] : null;
        ttHtml = sel + (list ? '<p class="st-sub">' + (showDay === today ? '오늘' : esc(dayLabel(showDay))) + ' 시간표</p><ol class="st-tt">' + list.map(function (s) { return '<li>' + (esc(s) || '—') + '</li>'; }).join('') + '</ol>' : '<p class="st-muted">이번 주 남은 수업이 없어.</p>');
      }
    }
    // 학사일정
    var events = (data.schedule || []).filter(function (e) { return e.date >= today; }).slice(0, 6);
    var evHtml = events.length ? '<ul class="st-ev">' + events.map(function (e) {
        var o = CAL ? CAL.offDay(e.date) : null, isOff = e.off || /공휴일|휴업|방학|개교기념/.test(e.title);
        var clash = !isOff && o && !o.weekend;
        return '<li' + (isOff ? ' class="st-is-off"' : '') + '><b>' + esc(dayLabel(e.date)) + '</b> ' + (isOff ? '🌿 ' : '') + esc(e.title) + ' <span class="st-dday">' + dday(e.date) + '</span>' +
          (clash ? '<br><span class="st-clash">⚠ ' + esc(o.name) + '과 겹쳐. 실제 날짜는 학교 공지 확인</span>' : '') + '</li>';
      }).join('') + '</ul>' + (data.keyed ? '' : '<p class="st-muted">가까운 일정 일부만 보여. 전체는 학교 공지 확인.</p>')
      : '<p class="st-muted">앞으로 60일 안에 ' + esc(info.grade) + '학년 일정이 아직 없어.</p>';
    var rest = CAL ? CAL.upcoming(CAL.add(today, 1), 75).slice(0, 4) : [];
    if (rest.length) evHtml += '<p class="st-rest"><b>다가오는 쉬는 날</b> ' + rest.map(function (r) { return esc(dayLabel(r.date)) + ' ' + esc(r.name); }).join(' · ') + '</p>';
    var updated = data.last_success_at ? new Date(data.last_success_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    box.innerHTML = head +
      '<div class="st-grid">' +
        '<div class="st-col"><h3>🍚 급식</h3>' + mealHtml + '</div>' +
        '<div class="st-col"><h3>🗓️ 시간표</h3>' + ttHtml + '</div>' +
        '<div class="st-col"><h3>📌 ' + esc(info.grade) + '학년 학사일정</h3>' + evHtml + '</div>' +
      '</div>' +
      '<p class="st-foot">출처: 나이스 교육정보 개방포털' + (updated ? ' · ' + esc(updated) + ' 갱신' : '') + ' · 시험·행사는 <a href="' + esc(cfg.homepage) + '" target="_blank" rel="noopener">학교 공지</a>가 우선이야.</p>';
  }

  function mountAll() {
    var boxes = document.querySelectorAll('#school-today:not([data-st])');
    if (!boxes.length) return;
    boxes.forEach(function (b) { b.setAttribute('data-st', '1'); b.classList.add('st-card'); b.innerHTML = '<p class="st-muted">학교 정보를 불러오는 중…</p>'; });
    load().then(function () { document.querySelectorAll('#school-today[data-st]').forEach(render); });
  }
  document.addEventListener('change', function (e) {
    if (!e.target.matches || !e.target.matches('[data-st-class]')) return;
    lsSet(CLASS_KEY, e.target.value);
    document.querySelectorAll('#school-today[data-st]').forEach(render);
  });
  var css = document.createElement('style');
  css.textContent = '.st-card{background:#fff;border:1px solid #e4daf4;border-radius:22px;padding:20px 22px;margin:18px 0;color:#293152}' +
    '.st-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.st-head h2{margin:0;font-size:20px}' +
    '.st-badge{font-size:12.5px;font-weight:700;background:#efe8ff;color:#5b3fd6;padding:4px 10px;border-radius:999px}' +
    '.st-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:12px}.st-col{min-width:0}.st-col h3{margin:0 0 8px;font-size:15px}' +
    '.st-meal{display:grid;gap:2px;margin-bottom:8px;font-size:14px}.st-meal b{font-size:12px;color:#5b3fd6}' +
    '.st-tt{margin:4px 0 0;padding-left:1.4em;font-size:14px;display:grid;gap:2px}.st-sub{margin:6px 0 0;font-size:12.5px;color:#667085}' +
    '.st-ev{margin:0;padding:0;list-style:none;display:grid;gap:6px;font-size:14px}.st-ev b{color:#5b3fd6;margin-right:4px}.st-dday{font-size:12px;color:#b4475a;font-weight:700}' +
    '.st-class{font-size:13px;display:inline-flex;gap:6px;align-items:center}.st-class select{font:inherit;padding:4px 8px;border-radius:8px;border:1px solid #d9d0ee}' +
    '.st-muted{color:#667085;font-size:13.5px;margin:4px 0}.st-foot{margin:12px 0 0;font-size:12px;color:#8a839a}.st-card a::after{content:none!important}' +
    '.st-off{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:#eaf6ef;color:#1f5c40;font-size:14px}.st-is-off{color:#2f7a52}.st-clash{font-size:12px;color:#b4475a;font-weight:700}.st-rest{margin:10px 0 0;font-size:12.5px;color:#4a5568;line-height:1.6}.st-rest b{color:#2f7a52;margin-right:4px}' +
    '@media(max-width:760px){.st-grid{grid-template-columns:1fr}}' +
    '@media(prefers-color-scheme:dark){.st-card{background:#1c1a29;border-color:#2e2b41;color:#ecebf5}.st-off{background:#1f3329;color:#bfe6cf}.st-rest{color:#b9b4c9}}';
  document.head.appendChild(css);
  if (window.FC_CAL) window.FC_CAL.onUpdate(function () { document.querySelectorAll('#school-today[data-st]').forEach(function (b) { if (data) render(b); }); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
  new MutationObserver(mountAll).observe(document.documentElement, { childList: true, subtree: true });
})();
