/* 2022 개정 교육과정 고1 공통과목 단원 구조 (출판사와 무관하게 교육과정이 정한 단원).
   국어·영어는 서초고 채택 교과서(국어 미래엔 신유식, 영어 YBM 박준언) 목차를 넣었다(2학기: 메가스터디 강좌 목차·교과서 본문 자료로 교차 확인).
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
      2: { course: '공통수학2', extra: '학교 워크북·프린트 변형 문제가 시험에 나와', units: [
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
      2: { course: '통합과학2', extra: '학교 부교재(프린트)도 같이 봐', units: [
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
    // 서초고 채택 교과서(2026, 학교 시험 출제 작품·학원 분석 자료로 확인): 국어 미래엔(신유식), 영어 YBM(박준언)
    국어: {
      1: { course: '공통국어1', book: '미래엔 공통국어1 (신유식)', units: [], byPublisher: true },
      2: { course: '공통국어2', book: '미래엔 공통국어2 (신유식)', units: [
        U('1. 한국 문학의 길', ['(1) 옛 노래 감상하기: 제망매가·속미인곡', '(2) 고전 소설 감상하기: 춘향전', '(3) 현대 시 감상하기: 수라', '(4) 현대 소설 감상하기: 아홉 켤레의 구두로 남은 사내']),
        U('2. 문제 해결의 지혜', ['(1) 논증하는 글 쓰기', '(2) 지혜롭게 협상하기']),
        U('3. 국어의 어제와 오늘', ['(1) 변화하는 국어의 모습: 중세 국어', '(2) 한글 맞춤법과 오늘날의 국어생활']),
        U('4. 세상을 보는 눈', ['(1) 비판적으로 매체 읽기', '(2) 주제 통합적 읽기']),
        U('5. 소통하고 참여하라', ['(1) 매체 소통 문화와 공동 보고서 쓰기', '(2) 사회적 독서 활동 발표하기'])] }
    },
    영어: {
      1: { course: '공통영어1', book: 'YBM 공통영어1 (박준언) + EBS 올림포스', units: [], byPublisher: true },
      2: { course: '공통영어2', book: 'YBM 공통영어2 (박준언) + EBS 올림포스', extra: '올림포스 지문·고1 학평 지문도 시험에 나와', units: [
        U('Lesson 1. Be Digitally Smart!', ['Reading: Warning: Fake News Alert!', 'Further Reading: Breaking Out of the Echo Chamber']),
        U('Lesson 2. Urgent Call From Earth', ['Reading: Dry', 'Further Reading: Hunger Stones']),
        U('Lesson 3. Rise Above Challenges', ['Reading: Resilience: The Power to Overcome', 'Further Reading: Growth Mindset']),
        U('Lesson 4. Creative Ideas for a Better World', ['Reading: Science for All', 'Further Reading: Helping Hands'])] }
    }
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
    return { subject: b, course: d.course, book: d.book || '', extra: d.extra || '', units: d.units, flat: flat, byPublisher: !!d.byPublisher && !flat.length };
  }
  function nextAfter(name, current) {
    var c = lookup(name); if (!c || !current) return null;
    var cur = String(current).replace(/\s+/g, ''), i = -1;
    for (var k = 0; k < c.flat.length; k++) { var f = c.flat[k].replace(/\s+/g, ''); if (f === cur || f.split('›').pop() === cur) { i = k; break; } }
    return i >= 0 && i + 1 < c.flat.length ? c.flat[i + 1] : null;
  }
  g.FC_CURRICULUM = { lookup: lookup, nextAfter: nextAfter, baseOf: baseOf };
})(typeof window !== 'undefined' ? window : globalThis);
