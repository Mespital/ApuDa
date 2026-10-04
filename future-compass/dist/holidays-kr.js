/* 대한민국 공휴일·대체공휴일·선거일 (2026-09 ~ 2029-12) + 쉬는 날 계산 FC_CAL.
   기준: 관공서의 공휴일에 관한 규정(2027년부터 노동절·제헌절 포함, 대체공휴일 규칙 반영).
   임시공휴일은 미리 알 수 없어서 ① 학교 학사일정(나이스 휴업일) ② 공공데이터 특일정보(키 있을 때)
   ③ 직접 추가한 쉬는 날 로 보완한다. */
(function (g) {
  'use strict';
  var BASE = [["2026-09-24", "추석 전날"], ["2026-09-25", "추석"], ["2026-09-26", "추석 다음날"], ["2026-10-03", "개천절"], ["2026-10-05", "개천절 대체공휴일"], ["2026-10-09", "한글날"], ["2026-12-25", "성탄절"], ["2027-01-01", "신정"], ["2027-02-06", "설날 전날"], ["2027-02-07", "설날"], ["2027-02-08", "설날 다음날"], ["2027-02-09", "설날 대체공휴일"], ["2027-03-01", "삼일절"], ["2027-05-01", "노동절"], ["2027-05-03", "노동절 대체공휴일"], ["2027-05-05", "어린이날"], ["2027-05-13", "부처님오신날"], ["2027-06-06", "현충일"], ["2027-07-17", "제헌절"], ["2027-07-19", "제헌절 대체공휴일"], ["2027-08-15", "광복절"], ["2027-08-16", "광복절 대체공휴일"], ["2027-09-14", "추석 전날"], ["2027-09-15", "추석"], ["2027-09-16", "추석 다음날"], ["2027-10-03", "개천절"], ["2027-10-04", "개천절 대체공휴일"], ["2027-10-09", "한글날"], ["2027-10-11", "한글날 대체공휴일"], ["2027-12-25", "성탄절"], ["2027-12-27", "성탄절 대체공휴일"], ["2028-01-01", "신정"], ["2028-01-26", "설날 전날"], ["2028-01-27", "설날"], ["2028-01-28", "설날 다음날"], ["2028-03-01", "삼일절"], ["2028-04-12", "국회의원 선거일"], ["2028-05-01", "노동절"], ["2028-05-02", "부처님오신날"], ["2028-05-05", "어린이날"], ["2028-06-06", "현충일"], ["2028-07-17", "제헌절"], ["2028-08-15", "광복절"], ["2028-10-02", "추석 전날"], ["2028-10-03", "추석·개천절"], ["2028-10-04", "추석 다음날"], ["2028-10-05", "추석 대체공휴일"], ["2028-10-09", "한글날"], ["2028-12-25", "성탄절"], ["2029-01-01", "신정"], ["2029-02-12", "설날 전날"], ["2029-02-13", "설날"], ["2029-02-14", "설날 다음날"], ["2029-03-01", "삼일절"], ["2029-05-01", "노동절"], ["2029-05-05", "어린이날"], ["2029-05-07", "어린이날 대체공휴일"], ["2029-05-20", "부처님오신날"], ["2029-05-21", "부처님오신날 대체공휴일"], ["2029-06-06", "현충일"], ["2029-07-17", "제헌절"], ["2029-08-15", "광복절"], ["2029-09-21", "추석 전날"], ["2029-09-22", "추석"], ["2029-09-23", "추석 다음날"], ["2029-09-24", "추석 대체공휴일"], ["2029-10-03", "개천절"], ["2029-10-09", "한글날"], ["2029-12-25", "성탄절"]];
  var OWN_KEY = 'fc_offdays_v1';
  var map = {}, extra = {}, events = {}, listeners = [], loaded = false;
  BASE.forEach(function (r) { map[r[0]] = { name: r[1], kind: '공휴일', source: '법정' }; });
  function own() { try { var v = JSON.parse(localStorage.getItem(OWN_KEY) || '[]'); return Array.isArray(v) ? v.filter(function (x) { return x && /^\d{4}-\d{2}-\d{2}$/.test(x.date); }).slice(0, 200) : []; } catch (e) { return []; } }
  function saveOwn(list) { try { localStorage.setItem(OWN_KEY, JSON.stringify(list.slice(0, 200))); } catch (e) {} emit(); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function add(d, n) { return iso(Date.parse(d + 'T12:00:00Z') + n * 86400000); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }           // 0=일
  function today() { return iso(Date.now() + 9 * 3600000); }
  function offDay(d) {
    var o = own().filter(function (x) { return x.date === d; })[0];
    if (o) return { name: o.name || '쉬는 날', kind: '직접 추가', source: '직접', own: true };
    if (map[d]) return map[d];
    if (extra[d]) return extra[d];
    var w = wd(d); if (w === 0 || w === 6) return { name: w === 0 ? '일요일' : '토요일', kind: '주말', weekend: true };
    return null;
  }
  function isSchoolDay(d) { return !offDay(d); }
  function nextSchoolDay(d, inclusive) { var x = inclusive ? d : add(d, 1); for (var i = 0; i < 60 && !isSchoolDay(x); i++) x = add(x, 1); return x; }
  function weekDays(d) { var w = wd(d), mon = add(d, w === 0 ? 1 : w === 6 ? 2 : 1 - w); return [0, 1, 2, 3, 4].map(function (i) { return add(mon, i); }); }
  function upcoming(from, days) { var out = []; for (var i = 0; i <= days; i++) { var d = add(from, i), o = offDay(d); if (o && !o.weekend) out.push({ date: d, name: o.name, kind: o.kind }); } return out; }
  function emit() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
  function load() {
    if (typeof fetch !== 'function') return Promise.resolve();
    return fetch('school.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s) return;
      (s.closures || []).forEach(function (c) { if (c && c.date && !map[c.date]) extra[c.date] = { name: c.name, kind: c.kind || '휴업일', source: c.source || '학교' }; });
      (s.schedule || []).forEach(function (e) { (events[e.date] = events[e.date] || []).push(e.title); });
    }).catch(function () {}).then(function () { loaded = true; emit(); });
  }
  g.FC_CAL = {
    holidays: BASE, offDay: offDay, isSchoolDay: isSchoolDay, nextSchoolDay: nextSchoolDay, weekDays: weekDays, add: add, today: today,
    upcoming: upcoming, schoolEvents: function (d) { return events[d] || []; },
    ownList: own,
    addOwn: function (date, name) { var l = own().filter(function (x) { return x.date !== date; }); l.push({ date: date, name: String(name || '쉬는 날').slice(0, 30) }); l.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); saveOwn(l); },
    removeOwn: function (date) { saveOwn(own().filter(function (x) { return x.date !== date; })); },
    onUpdate: function (f) { listeners.push(f); if (loaded) f(); },
    ready: null
  };
  g.FC_CAL.ready = load();
})(typeof window !== 'undefined' ? window : globalThis);
