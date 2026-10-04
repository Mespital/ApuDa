/* 학교·학년 설정. 날짜가 지나면 학년·학기가 자동으로 바뀐다.
   입학년도만 맞으면 2027년 3월부터 고2, 2028년 3월부터 고3으로 맞춰진다. */
(function (global) {
  'use strict';
  var CONFIG = {
    schoolName: '서초고등학교',
    shortName: '서초고',
    entryYear: 2026,          // 고1 입학년도
    atpt: 'B10',              // 서울특별시교육청
    schoolCode: '7010087',    // 나이스 학교코드
    homepage: 'https://seocho.sen.hs.kr/'
  };
  function kstNow(d) {
    var t = (d || new Date()).getTime() + 9 * 3600000;
    var k = new Date(t);
    return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() };
  }
  // 학년도: 3월~다음해 2월. 2학기: 8월~2월
  function info(date) {
    var n = kstNow(date);
    var schoolYear = n.m >= 3 ? n.y : n.y - 1;
    var grade = schoolYear - CONFIG.entryYear + 1;
    var sem = (n.m >= 3 && n.m <= 7) ? 1 : 2;
    var phase;
    if (grade < 1) phase = 'before';
    else if (grade > 3) phase = 'graduated';
    else phase = 'school';
    var g = Math.min(3, Math.max(1, grade));
    return {
      schoolYear: schoolYear, grade: g, rawGrade: grade, semester: sem, phase: phase,
      key: g + '-' + sem,
      label: CONFIG.shortName + ' ' + g + '학년',
      labelLong: CONFIG.shortName + ' ' + g + '학년 ' + sem + '학기',
      month: n.m
    };
  }
  global.FC_SCHOOL = { config: CONFIG, info: info };
})(typeof window !== 'undefined' ? window : globalThis);
