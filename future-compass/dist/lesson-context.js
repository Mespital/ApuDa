/* A lesson's photos, spoken recall and confirmed page share one subject/date context.
   Reading text or an image never guesses a textbook page or the teacher's next lesson. */
(function (g) {
  'use strict';
  var KEY = 'fc_notes_v1';
  function read(k, fallback) { try { var x = JSON.parse(localStorage.getItem(k)); return x == null ? fallback : x; } catch (e) { return fallback; } }
  function dateOK(d) { return typeof d === 'string' && /^\d{4}-\d\d-\d\d$/.test(d) && Number.isFinite(Date.parse(d + 'T12:00:00Z')) && new Date(d + 'T12:00:00Z').toISOString().slice(0, 10) === d; }
  function pageOK(p) { return typeof p === 'number' && Number.isInteger(p) && p >= 1 && p <= 5000; }
  function metadata(x) {
    if (!x || !dateOK(x.date) || ['last', 'important'].indexOf(x.purpose) < 0 || x.page != null && !pageOK(x.page)) return null;
    return { version: 1, date: x.date, purpose: x.purpose, page: x.page == null ? null : x.page };
  }
  function allowed() {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('pin-locked')) return false;
    if (!g.PinGate || PinGate.who() !== 'parent') return true;
    return !!((read('fc_planner_v1', {}).share || {}).review);
  }
  function all() {
    if (!allowed()) return [];
    var a = read(KEY, []);
    return Array.isArray(a) ? a.filter(function (n) { return n && typeof n.id === 'string' && typeof n.subject === 'string' && dateOK(n.date); }).slice(-300) : [];
  }
  function stamp(n) { return Number(n.photoAt) || Date.parse(n.at || '') || Date.parse(n.date + 'T12:00:00Z'); }
  function cleanText(n) {
    var a = [];
    if (n.text) a.push(String(n.text).slice(0, 1500));
    if (n.photoText) a.push('[사진에서 읽은 글·메모]\n' + String(n.photoText).slice(0, 1500));
    return a.join('\n\n');
  }
  function scope(n) {
    var l = metadata(n && n.lesson);
    return l ? '수업일 ' + l.date + ' · ' + (l.purpose === 'last' ? '오늘 여기까지' : '중요한 부분') + (l.page ? ' · ' + l.page + '쪽' : ' · 쪽 번호 미입력') : '';
  }
  function context(subject, before, rows) {
    if (!dateOK(before)) return null;
    var a = (rows || all()).filter(function (n) { return n.subject === subject && n.date <= before; }).sort(function (a, b) { return a.date.localeCompare(b.date) || stamp(a) - stamp(b) || a.id.localeCompare(b.id); });
    if (!a.length) return null;
    var lastDate = a[a.length - 1].date, same = a.filter(function (n) { return n.date === lastDate; });
    var progress = a.filter(function (n) { var l = metadata(n.lesson); return l && l.date === n.date && l.purpose === 'last' && l.page; }).pop();
    return { subject: subject, date: lastDate, notes: same, photos: same.filter(function (n) { return n.photo; }), spoken: same.filter(function (n) { return n.audio || n.via === 'watch' || n.kind === 'talk' && String(n.text || '').trim(); }),
      progress: progress || null, page: progress ? progress.lesson.page : null, nextPage: progress ? progress.lesson.page + 1 : null,
      important: same.filter(function (n) { var l = metadata(n.lesson); return l && l.purpose === 'important'; }) };
  }
  function forReview(id) {
    var rows = all(), n = rows.find(function (x) { return x.review === id; });
    return n ? context(n.subject, n.date, rows.filter(function (x) { return x.date === n.date; })) : null;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function markup(c, prep) {
    if (!c) return '';
    var info = c.date + ' 수업 · 사진 ' + c.photos.length + '개 · 1분 기록 ' + c.spoken.length + '개';
    var last = c.progress ? '<p>' + esc(c.progress.date) + ' 확인한 진도: <b>' + c.page + '쪽까지</b>' + (prep ? ' · 다음 쪽부터 소제목 확인' : '') + '</p>' : '<p>쪽 번호가 없어 수업 진도는 바꾸지 않았어.</p>';
    var refs = c.photos.slice(-3);
    if (c.progress && c.progress.photo && !refs.some(function (n) { return n.id === c.progress.id; })) refs = [c.progress].concat(refs).slice(0, 3);
    var links = refs.map(function (n, i) { return '<button type="button" data-tn-view="' + esc(n.id) + '">' + (n.lesson && n.lesson.purpose === 'last' ? '마지막 쪽 사진' : '중요 부분 사진') + (refs.length > 1 ? ' ' + (i + 1) : '') + '</button>'; }).join('');
    links += c.spoken.filter(function (n) { return n.audio && n.audio.id; }).slice(-1).map(function (n) { return '<button type="button" data-tn-listen="' + esc(n.audio.id) + '">1분 녹음 듣기</button>'; }).join('');
    var memos = c.important.map(function (n) { return n.topic || (n.text || n.photoText || '').split('\n')[0].slice(0, 80); }).filter(Boolean).slice(-2);
    return '<div class="lesson-context"><b>수업 자료 연결</b><p>' + esc(info) + '</p>' + last + (memos.length ? '<p>다시 확인: ' + esc(memos.join(' · ')) + '</p>' : '') + (links ? '<div class="lesson-links">' + links + '</div>' : '') + (prep && c.page ? '<small>예습 시작 위치야. 다음 수업 범위는 선생님 안내로 확인해줘.</small>' : '') + '</div>';
  }
  g.FC_LESSON = { metadata: metadata, dateOK: dateOK, pageOK: pageOK, text: cleanText, scope: scope, forSubject: context, forReview: forReview, markup: markup };
})(window);
