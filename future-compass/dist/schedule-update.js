/* 2026-10-26 사용자가 제공한 최종 시간표. 기존 기기의 기록도 한 번만 갱신한다. */
(function (g) {
  'use strict';
  var REV = '2026-10-26', LAST = '2026-10-25', FLAG = 'fc-schedule-20261026', BACKUP = FLAG + '-before';
  var ACADEMY = 'fc_academy_v1', LIFE = 'fc_life_v1';
  var definitions = [
    { id: 'seed-kor-20261026', name: '송림 국어 (체리)', subject: '국어', days: [3], start: '16:00', end: '19:00', from: '2026-10-21' },
    { id: 'seed-math-20261026', name: '다원교육 대치', subject: '수학', days: [2, 4], start: '18:00', end: '22:00', from: '2026-10-15' },
    { id: 'seed-eng-saeum', name: '반포새움', subject: '영어', days: [1], start: '18:00', end: '22:00', from: REV },
    { id: 'seed-kor-clinic', name: '송림 국어 클리닉', subject: '국어', days: [6], start: '19:00', end: '', from: REV }
  ];
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function dateOK(d) { return typeof d === 'string' && /^\d{4}-\d\d-\d\d$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d; }
  function norm(s) { return String(s || '').replace(/[\s()]/g, ''); }
  function matches(x, def) {
    if (x.id === def.id) return true;
    var n = norm(x.name);
    if (def.id === 'seed-kor-20261026') return x.id === 'seed-kor' || /^송림(?:본원)?국어(?:채리|체리)?$/.test(n);
    if (def.id === 'seed-math-20261026') return x.id === 'seed-math' || /^다원(?:교육)?(?:대치|수학)?$/.test(n);
    if (def.id === 'seed-eng-saeum') return /^반포새움(?:영어)?$/.test(n);
    return /^송림(?:국어)?클리닉$/.test(n);
  }
  function archive(x) {
    var y = copy(x);
    y.until = dateOK(y.until) && y.until < LAST ? y.until : LAST;
    y.scheduleRevision = REV;
    return y;
  }
  function build(academies, life) {
    if (!Array.isArray(academies) || !life || typeof life !== 'object' || Array.isArray(life) || life.items != null && !Array.isArray(life.items)) throw Error('invalid_schedule');
    var a = copy(academies), l = copy(life), used = new Set(), lifeDone = l.scheduleRevision === REV;
    var academyDone = a.some(function (x) { return x && x.scheduleRevision === REV; }) || !a.length && lifeDone;
    if (!academyDone) {
      var active = definitions.map(function (def) {
        var hit = a.find(function (x) { return x && x.id === def.id; }) || a.find(function (x) { return x && !used.has(x.id) && matches(x, def); });
        if (hit && hit.id === def.id) used.add(hit.id);
        var item = hit ? copy(hit) : copy(def);
        // 다른 학원의 정보·숙제는 이전 기록에 남기고 새 학원에 추정하여 넣지 않는다.
        // 새 시간표는 새 반복 일정으로 시작한다. 예전 날짜 변경은 이전 일정에 남는다.
        Object.assign(item, copy(def), { effectiveFrom: REV, scheduleRevision: REV });
        delete item.until;
        return item;
      });
      a = active.concat(a.filter(function (x) { return x && !used.has(x.id); }).map(archive));
    }
    if (!lifeDone) {
      var items = l.items || [], current = items.find(function (x) { return x && x.id === 'seed-pt-20261026'; });
      var pt = Object.assign({}, current || {}, { id: 'seed-pt-20261026', title: 'PT', icon: '💪', days: [5], start: '18:00', end: '', from: REV, scheduleRevision: REV });
      delete pt.date; delete pt.until;
      l.items = [pt].concat(items.filter(function (x) { return x && x.id !== pt.id; }).map(function (x) { return x.id === 'seed-pt' || /^PT$/i.test(String(x.title || '').trim()) ? archive(x) : x; }));
      l.scheduleRevision = REV;
    }
    return { academies: a, life: l, changed: !academyDone || !lifeDone };
  }
  function locked() { return document.documentElement.classList.contains('pin-locked'); }
  function apply() {
    if (locked()) return { ok: false, locked: true };
    var beforeA, beforeL, beforeFlag, started = false;
    try {
      beforeFlag = localStorage.getItem(FLAG);
      if (beforeFlag === REV) return { ok: true, changed: false };
      beforeA = localStorage.getItem(ACADEMY); beforeL = localStorage.getItem(LIFE);
      var next = build(beforeA === null ? [] : JSON.parse(beforeA), beforeL === null ? {} : JSON.parse(beforeL));
      if (next.changed) {
        if (localStorage.getItem(BACKUP) === null) localStorage.setItem(BACKUP, JSON.stringify({ academy: beforeA, life: beforeL }));
        started = true;
        localStorage.setItem(ACADEMY, JSON.stringify(next.academies));
        localStorage.setItem(LIFE, JSON.stringify(next.life));
      }
      localStorage.setItem(FLAG, REV);
      return { ok: true, changed: next.changed };
    } catch (e) {
      if (started) {
        try {
          if (beforeA === null) localStorage.removeItem(ACADEMY); else localStorage.setItem(ACADEMY, beforeA);
          if (beforeL === null) localStorage.removeItem(LIFE); else localStorage.setItem(LIFE, beforeL);
          if (beforeFlag === null) localStorage.removeItem(FLAG); else localStorage.setItem(FLAG, beforeFlag);
        } catch (ignore) {}
      }
      return { ok: false, error: e.message };
    }
  }
  var running = false;
  function run() {
    if (running || locked()) return;
    running = true;
    var wait = g.FamilySync && g.FamilySync.ready ? g.FamilySync.ready() : Promise.resolve();
    Promise.resolve(wait).then(function () {
      var result = apply();
      if (!result.ok) { if (!result.locked && typeof notice === 'function') notice('시간표를 갱신하지 못했어. 저장 공간을 확인한 뒤 다시 열어줘. 기존 기록은 유지했어.'); return; }
      if (typeof render === 'function') render();
      g.dispatchEvent(new Event('fc-schedule-updated'));
      if (result.changed && g.FamilySync && g.FamilySync.pushNow) g.FamilySync.pushNow();
    }).catch(function () {}).finally(function () { running = false; });
  }
  g.FC_SCHEDULE_UPDATE = { revision: REV, build: build, apply: apply, run: run };
  // 기존 기본 시간표(3.5초) 및 가족 공유의 첫 받기가 끝난 뒤 적용한다.
  setTimeout(run, 4000);
  g.addEventListener('pin-unlocked', function () { setTimeout(run, 4000); });
})(window);
