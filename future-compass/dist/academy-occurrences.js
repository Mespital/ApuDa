/* 학원 반복 일정 계산. 저장·화면·알림 없이 브라우저와 서버에서 같은 규칙을 쓴다. */
(function (g) {
  'use strict';
  var KEY = 'fc_academy_occurrences_v1', LIMIT = 600, TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
  function validDate(d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d + 'T12:00:00Z')) && new Date(d + 'T12:00:00Z').toISOString().slice(0, 10) === d; }
  function addDays(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function weekday(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function days(v) { return Array.isArray(v) ? v.filter(function (x, i) { return Number.isInteger(x) && x >= 0 && x <= 6 && v.indexOf(x) === i; }).sort() : []; }
  function idFor(academyId, scope, date) { return academyId + '@' + scope + '@' + date; }
  function cleanRecord(x) {
    if (!x || typeof x !== 'object' || Array.isArray(x) || typeof x.academyId !== 'string' || !x.academyId || x.academyId.length > 40 || !validDate(x.date) || ['one', 'future'].indexOf(x.scope) < 0) return null;
    if (x.start !== '' && !TIME.test(x.start) || x.end !== '' && !TIME.test(x.end)) return null;
    if (x.start && x.end && x.end <= x.start) return null;
    if (x.scope === 'future' && !Array.isArray(x.days)) return null;
    if (x.moveTo && !validDate(x.moveTo)) return null;
    return { id: idFor(x.academyId, x.scope, x.date), academyId: x.academyId, scope: x.scope, date: x.date,
      days: days(x.days), start: x.start, end: x.end, cancelled: x.cancelled === true,
      moveTo: x.scope === 'one' ? (x.moveTo || x.date) : '', updatedAt: Number.isFinite(x.updatedAt) && x.updatedAt >= 0 ? x.updatedAt : 0 };
  }
  function cleanRecords(value) {
    if (!Array.isArray(value)) return [];
    var byId = Object.create(null);
    value.slice(0, LIMIT * 2).forEach(function (x) { var r = cleanRecord(x); if (r && (!byId[r.id] || r.updatedAt > byId[r.id].updatedAt)) byId[r.id] = r; });
    return Object.keys(byId).sort().map(function (id) { return byId[id]; }).slice(0, LIMIT);
  }
  function ownRecords(a, records) {
    var from = validDate(a.from) ? a.from : '';
    return records.filter(function (x) { return x.academyId === a.id && (!from || x.date >= from && (!x.moveTo || x.moveTo >= from)); });
  }
  function schedule(a, records, date) {
    var found = records.filter(function (x) { return x.scope === 'future' && x.date <= date; }).sort(function (x, y) { return y.date.localeCompare(x.date) || y.updatedAt - x.updatedAt; })[0];
    return Object.assign({}, a, found ? { days: found.days.slice(), start: found.start, end: found.end, cancelled: found.cancelled, scheduleFrom: found.date, scheduleScope: 'future' } : { days: days(a.days), cancelled: false, scheduleFrom: a.from || '', scheduleScope: 'series' });
  }
  function scheduleFor(a, value, date) {
    if (!a || typeof a.id !== 'string' || !validDate(date)) return null;
    var records = ownRecords(a, cleanRecords(value)), current = schedule(a, records, date), one = records.filter(function (x) { return x.scope === 'one' && x.date === date; })[0];
    if (one) Object.assign(current, { start: one.start, end: one.end, cancelled: one.cancelled, moveTo: one.moveTo, occurrenceScope: 'one' });
    else Object.assign(current, { moveTo: date, occurrenceScope: current.scheduleScope });
    current.occurrenceDate = date;
    current.isOccurrence = (!a.from || !validDate(a.from) || date >= a.from) && (!!one || current.days.indexOf(weekday(date)) >= 0);
    return current;
  }
  function forDay(academies, value, date) {
    if (!Array.isArray(academies) || !validDate(date)) return [];
    var all = cleanRecords(value), w = weekday(date), out = [];
    academies.forEach(function (a) {
      if (!a || typeof a.id !== 'string' || !a.name || validDate(a.from) && date < a.from) return;
      var records = ownRecords(a, all), current = schedule(a, records, date);
      var source = records.filter(function (x) { return x.scope === 'one' && x.date === date; })[0];
      var exceptions = records.filter(function (x) { return x.scope === 'one' && !x.cancelled && x.moveTo === date; }).sort(function (x, y) { return y.updatedAt - x.updatedAt || x.id.localeCompare(y.id); });
      var chosen = exceptions[0];
      if (chosen) {
        current = schedule(a, records, chosen.date);
        Object.assign(current, { start: chosen.start, end: chosen.end, cancelled: false, occurrenceScope: 'one', originalDate: chosen.date });
      } else {
        if (source || current.cancelled || current.days.indexOf(w) < 0) return;
        Object.assign(current, { occurrenceScope: current.scheduleScope, originalDate: date });
      }
      current.occurrenceDate = date; out.push(current);
    });
    return out.sort(function (a, b) { return String(a.start || '99').localeCompare(String(b.start || '99')) || String(a.id).localeCompare(String(b.id)); });
  }
  function nextDate(a, value, from) {
    if (!validDate(from)) return '';
    var d = validDate(a.from) && a.from > from ? a.from : from;
    for (var i = 0; i < 370; i++, d = addDays(d, 1)) { var s = scheduleFor(a, value, d); if (s && s.isOccurrence) return d; }
    return validDate(a.from) && a.from > from ? a.from : from;
  }
  g.FC_ACADEMY_OCCURRENCES = { KEY: KEY, LIMIT: LIMIT, validDate: validDate, addDays: addDays, cleanRecord: cleanRecord,
    cleanRecords: cleanRecords, idFor: idFor, scheduleFor: scheduleFor, forDay: forDay, nextDate: nextDate };
})(globalThis);
