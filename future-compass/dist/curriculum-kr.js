/* 2022 개정 교육과정 고1 공통과목 단원 구조 (출판사와 무관하게 교육과정이 정한 단원).
   국어·영어는 출판사마다 단원이 달라서 과목명만 제공한다.
   출처: 교육부 2022 개정 교육과정 성취기준 정리(나무위키 교육과정 문서), 학습 블로그·교재 소개(2026-10 확인).
   통합과학2 Ⅱ·Ⅲ의 중단원 이름은 교재 소개 키워드로 정리한 추정이다.
   학교 진도와 순서는 다를 수 있어서, 아이가 지금 배우는 단원을 고르면 그다음 단원을 예습 대상으로 보여준다. */
(function (g) {
  'use strict';
  var U = function (title, subs) { return { title: title, subs: subs || [] }; };
  var DATA = {
    수학: {
      1: { course: '공통수학1', units: [
        U('Ⅰ. 다항식', ['다항식의 연산', '나머지정리', '인수분해']),
        U('Ⅱ. 방정식과 부등식', ['복소수와 이차방정식', '이차방정식과 이차함수', '여러 가지 방정식과 부등식']),
        U('Ⅲ. 경우의 수', ['경우의 수와 순열', '조합']),
        U('Ⅳ. 행렬', ['행렬과 그 연산'])] },
      2: { course: '공통수학2', units: [
        U('Ⅰ. 도형의 방정식', ['평면좌표', '직선의 방정식', '원의 방정식', '도형의 이동']),
        U('Ⅱ. 집합과 명제', ['집합', '명제']),
        U('Ⅲ. 함수와 그래프', ['함수', '유리함수와 무리함수'])] }
    },
    통합사회: {
      1: { course: '통합사회1', units: [U('Ⅰ. 통합적 관점'), U('Ⅱ. 인간, 사회, 환경과 행복'), U('Ⅲ. 자연환경과 인간'), U('Ⅳ. 문화와 다양성'), U('Ⅴ. 생활공간과 사회')] },
      2: { course: '통합사회2', units: [U('Ⅵ. 인권 보장과 헌법'), U('Ⅶ. 사회 정의와 불평등'), U('Ⅷ. 시장 경제와 지속 가능 발전'), U('Ⅸ. 세계화와 평화'), U('Ⅹ. 미래와 지속 가능한 삶')] }
    },
    통합과학: {
      1: { course: '통합과학1', units: [
        U('Ⅰ. 과학의 기초', ['기본량과 단위', '측정과 어림', '정보와 신호']),
        U('Ⅱ. 물질과 규칙성', ['원소의 생성과 별의 진화', '원소의 주기성', '이온 결합과 공유 결합', '지각·생명체 구성 물질의 규칙성', '물질의 전기적 성질']),
        U('Ⅲ. 시스템과 상호작용', ['지구시스템과 판구조론', '중력장 내의 운동', '운동량과 충격량', '세포의 구조와 물질대사', '유전자와 단백질'])] },
      2: { course: '통합과학2', units: [
        U('Ⅰ. 변화와 다양성', ['지질시대와 생물다양성', '변이·자연선택과 진화', '산화와 환원', '산·염기와 중화 반응', '에너지 흡수·방출과 생활']),
        U('Ⅱ. 환경과 에너지', ['생태계와 환경', '기후 위기와 대응', '에너지 전환과 신재생 에너지']),
        U('Ⅲ. 과학과 미래 사회', ['과학 기술과 미래 사회(AI·빅데이터)', '과학 기술과 윤리'])] }
    },
    한국사: {
      1: { course: '한국사1', units: [U('Ⅰ. 근대 이전 한국사의 이해'), U('Ⅱ. 근대 이전 한국사의 탐구'), U('Ⅲ. 근대 국가 수립의 노력')] },
      2: { course: '한국사2', units: [U('Ⅰ. 일제 식민 통치와 민족 운동'), U('Ⅱ. 대한민국의 발전'), U('Ⅲ. 오늘날의 대한민국')] }
    },
    과학탐구실험: {
      1: { course: '과학탐구실험1', units: [U('역사 속 과학 탐구', ['갈릴레이·뉴턴·파스퇴르·멘델레예프·플레밍의 실험 따라 하기'])] },
      2: { course: '과학탐구실험2', units: [U('생활 속·첨단 과학 탐구 프로젝트', ['영화·놀이공원·요리 속 과학', '아두이노·우주 개발 프로젝트'])] }
    },
    국어: { 1: { course: '공통국어1', units: [], byPublisher: true }, 2: { course: '공통국어2', units: [], byPublisher: true } },
    영어: { 1: { course: '공통영어1', units: [], byPublisher: true }, 2: { course: '공통영어2', units: [], byPublisher: true } }
  };
  // 학교 줄임말 → 과목
  var ALIAS = { 공수: '수학', 수학: '수학', 공통수학: '수학', 통사: '통합사회', 통합사회: '통합사회', 통과: '통합과학', 통합과학: '통합과학',
    한사: '한국사', 한국사: '한국사', 과탐: '과학탐구실험', 과학탐구실험: '과학탐구실험', 공국: '국어', 국어: '국어', 공통국어: '국어', 공영: '영어', 영어: '영어', 공통영어: '영어' };
  function baseOf(name) {
    var n = String(name || '').replace(/\s+/g, '').replace(/[A-D]$/, '').replace(/[12]$/, '');
    return ALIAS[n] || null;
  }
  function lookup(name, grade, semester) {
    var info = g.FC_SCHOOL ? g.FC_SCHOOL.info() : { grade: 1, semester: 2 };
    var gr = grade || info.grade, sem = semester || info.semester;
    if (gr !== 1) return null;                       // 고2·고3은 선택과목이라 학교마다 달라서 제공하지 않음
    var b = baseOf(name); if (!b || !DATA[b]) return null;
    var d = DATA[b][sem]; if (!d) return null;
    var flat = [];
    d.units.forEach(function (u) { if (u.subs.length) u.subs.forEach(function (s) { flat.push(u.title + ' › ' + s); }); else flat.push(u.title); });
    return { subject: b, course: d.course, units: d.units, flat: flat, byPublisher: !!d.byPublisher };
  }
  function nextAfter(name, current) {
    var c = lookup(name); if (!c || !current) return null;
    var cur = String(current).replace(/\s+/g, ''), i = -1;
    for (var k = 0; k < c.flat.length; k++) { var f = c.flat[k].replace(/\s+/g, ''); if (f === cur || f.split('›').pop() === cur) { i = k; break; } }
    return i >= 0 && i + 1 < c.flat.length ? c.flat[i + 1] : null;
  }
  g.FC_CURRICULUM = { lookup: lookup, nextAfter: nextAfter, baseOf: baseOf };
})(typeof window !== 'undefined' ? window : globalThis);
