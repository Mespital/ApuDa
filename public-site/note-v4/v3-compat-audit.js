/* ApuDa V3 -> V4 compatibility preflight. Read-only; NOT a migration.
 * Intentionally not loaded by the V4 demonstration or the production note.
 * Explicit JSON input only; this module never accesses browser storage.
 */
(function (global) {
  'use strict';

  function numberOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function hasValue(value) {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).some(function (k) { return hasValue(value[k]); });
    return true;
  }

  function inspect(input) {
    var storage = global.ApuDaNoteStorage;
    if (!storage || typeof storage.unpack !== 'function') throw new Error('v3-validator-required');
    // unpack validates and clones; no reference to the caller's object escapes.
    var old = storage.unpack(input);
    var logs = old.logs || [];
    var issues = [];
    function flag(code, priority, count, message) {
      if (count > 0) issues.push({code:code, priority:priority, count:count, message:message});
    }

    var extraNames = ['weight','water','steps','bowel','bp','waist','numb','sleep','rt','diarrhea','vomit'];
    var standardLogNames = ['id','date','temp','tempReadings','pain','painSite','meal','note','createdAt','author'].concat(extraNames);
    var standardTopNames = ['profile','logs','roadmap','meds','labs','questions','supports','distress','checks','triage','meta','distressValue'];
    var multiTemp = 0, invalidTemp = 0, mealPercentCount = 0, noteCount = 0, extraCount = 0, authorUnknown = 0, unknownLogFields = 0;
    var days = logs.map(function (row) {
      var readings = Array.isArray(row.tempReadings) && row.tempReadings.length ? row.tempReadings.map(function (r) {
        return numberOrNull(r.value);
      }).filter(function (n) { return n !== null; }) : [];
      var latest = numberOrNull(row.temp);
      if (latest === null && readings.length) latest = readings[readings.length - 1];
      // Match V3 SAFETY.temps(): when a readings array exists, it is the
      // source of truth for the daily maximum, not the last temp field.
      var validSeries = readings.length ? readings : (latest === null ? [] : [latest]);
      var max = validSeries.length ? Math.max.apply(null,validSeries) : null;
      if (readings.length > 1) multiTemp++;
      if (validSeries.some(function (n) { return n < 25 || n > 45; }) ||
          (latest !== null && (latest < 25 || latest > 45))) invalidTemp++;
      if (hasValue(row.meal)) mealPercentCount++;
      if (hasValue(row.note)) noteCount++;
      if (extraNames.some(function (k) { return hasValue(row[k]); })) extraCount++;
      if (Object.keys(row).some(function (k) { return standardLogNames.indexOf(k) < 0 && hasValue(row[k]); })) unknownLogFields++;
      if (row.author !== '본인' && row.author !== '보호자') authorUnknown++;
      return {
        date:row.date,
        latestTemperature:latest,
        maximumTemperature:max,
        temperatureReadingCount:validSeries.length,
        pain:numberOrNull(row.pain),
        mealPercent:numberOrNull(row.meal),
        hasFreeText:hasValue(row.note),
        authorKnown:row.author === '본인' || row.author === '보호자'
      };
    });

    var profileCount = Object.keys(old.profile || {}).filter(function (k) { return hasValue(old.profile[k]); }).length;
    var checksCount = Object.keys(old.checks || {}).filter(function (k) { return hasValue(old.checks[k]); }).length;
    var questions = (old.questions || []).length;
    issues.push({code:'V4_SYNTHETIC_DEMO',priority:'P0',count:1,message:'현재 V4는 실제 환자 데이터 저장·복원 기능이 없는 독립 체험판입니다.'});
    flag('MULTIPLE_TEMPERATURES', 'P0', multiTemp, '하루 여러 체온값과 최고 체온을 V4 단일 체온 필드로 표현할 수 없습니다.');
    flag('OUT_OF_V4_TEMPERATURE_RANGE', 'P1', invalidTemp, 'V3 수치를 임의 수정하지 말고 입력 범위와 원본 단위를 확인해야 합니다.');
    flag('MEAL_PERCENT_SCALE', 'P1', mealPercentCount, 'V3 식사량 0~100%와 V4 네 범주는 일대일 대응이 아닙니다.');
    flag('UNSTRUCTURED_SYMPTOMS', 'P1', noteCount, 'V3 자유 메모의 증상을 자동으로 V4 선택 항목으로 분류하면 의미가 달라질 수 있습니다.');
    flag('OTHER_DAILY_FIELDS', 'P1', extraCount, '체중·수면·설사 횟수 등 V4에 없는 일일 측정 항목이 있습니다.');
    flag('UNKNOWN_DAILY_FIELDS', 'P1', unknownLogFields, '현재 매핑표에 없는 기록 항목이 있으므로 별도 확인과 원본 보존이 필요합니다.');
    flag('AUTHOR_NOT_RECORDED', 'P1', authorUnknown, 'V3 작성자를 V4에서 임의로 본인으로 표시하면 안 됩니다.');
    flag('QUESTIONS_OBJECTS', 'P1', questions, 'V3 진료 질문은 답변·우선순위 등이 있는 객체이며 V4는 문자열만 받습니다.');
    flag('QUESTIONS_OVER_THREE', 'P0', Math.max(0, questions - 3), 'V4 최대 3개 제한 때문에 나머지 질문이 노출되지 않습니다.');
    [['PROFILE',profileCount],['CARE_TIMELINE',(old.roadmap||[]).length],['MEDICATIONS',(old.meds||[]).length],
      ['LAB_RESULTS',(old.labs||[]).length],['MEDICATION_CHECKS',checksCount],
      ['DISTRESS',(old.distress||[]).length],['SUPPORTS',(old.supports||[]).length],
      ['EMERGENCY_CHECKS',hasValue(old.triage && old.triage.items)?1:0],
      ['DISTRESS_LAST_VALUE',old.distressValue!==0&&hasValue(old.distressValue)?1:0],
      ['BACKUP_METADATA',hasValue(old.meta)?1:0],
      ['UNKNOWN_TOP_LEVEL',Object.keys(old).filter(function (k) { return standardTopNames.indexOf(k)<0 && hasValue(old[k]); }).length]].forEach(function (pair) {
      flag('UNSUPPORTED_'+pair[0], 'P1', pair[1], 'V4 데이터 모델에 대응하는 보존 필드가 아직 없습니다.');
    });

    return {
      mode:'read-only-compatibility-audit',
      migrationReady:false,
      sourceUnchanged:true,
      counts:{logs:logs.length,questions:questions,questionsBeyondV4Limit:Math.max(0,questions-3),
        multiTemperatureDays:multiTemp,mealPercentDays:mealPercentCount,unknownAuthorDays:authorUnknown},
      outsideBackupScope:['apuda_note_chat_v1','apuda_note_font'],
      days:days,
      issues:issues
    };
  }

  global.ApuDaV3Compatibility = Object.freeze({inspect:inspect});
})(typeof window !== 'undefined' ? window : globalThis);
