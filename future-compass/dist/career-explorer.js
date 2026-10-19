/* 🧭 현실 진로 탐색기 (study.html#career) — 2026-10-16 진로·직업심리·노동시장·AI·미래 전문가 브레인스토밍 반영
   흐름: ① 싫은 것 지우기 → ② 궁금한 직업 3개 → ③ 현실 카드(하루·돈·가는 길·AI·흔히 듣는 이야기) → ④ 1시간 맛보기 → ⑤ 정리
   원칙: 순위 없음 · 임금 숫자는 지어내지 않고 직접 공식 자료(커리어넷·고용24)에서 찾아 적게 함 · 해석은 (추정) 표기 · 적성 판정 아님
   저장: fc_path_v1.ex (가족 동기화) */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function' || typeof tabs === 'undefined' || !window.FC_PATH) return;
  var KEY = 'fc_path_v1', G = window.FC_PATH.groups;
  tabs.career = '🧭 진로 탐색기';
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function td() { return typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10); }

  var ENV = [
    ['night', '🌙 밤·교대 근무'], ['people', '🗣 하루 종일 사람 상대'], ['desk', '🖥 하루 종일 앉아서 화면'], ['body', '💪 몸을 많이 쓰는 일'],
    ['move', '🚗 현장 이동·출장 잦음'], ['exam', '📝 큰 국가시험 통과'], ['long', '⏳ 준비 기간 7년 이상'], ['pressure', '⚠️ 실수하면 크게 위험'],
    ['irregular', '🕰 퇴근 시간이 들쭉날쭉'], ['alone', '🎧 혼자 오래 집중'], ['sell', '📈 실적 압박']
  ];
  var K = { c: '핵심 업무', p: '사람과', b: '반복·서류' };

  /* 직업 데이터: 공식 직업정보의 업무 설명과 널리 알려진 자격·학제 기준. 임금 숫자는 일부러 넣지 않음 */
  var J = [
    { id: 'sw', n: '소프트웨어 개발자', i: '💻', g: 'cs', env: ['desk', 'alone', 'irregular'],
      day: [['9:30', '오늘 할 일 짧은 회의', 'p'], ['10:00', '기능 코드 작성 (AI 도구로 초안)', 'c'], ['13:30', '다른 사람 코드 검토', 'c'], ['15:00', '버그 원인 찾기 — 재현하고 기록 읽기', 'b'], ['17:00', '테스트·문서 정리', 'b']],
      bo: '새 기능 만드는 시간보다 버그 찾기·테스트·회의가 더 길 때가 많아.',
      mo: { s: '월급형(회사) · 프리랜서·창업도 가능', sp: '큼 — 회사 규모·실력에 따라 차이가 커', st: '20대 중반 (경로에 따라 더 빨리도)', c: '자격증 필수 아님. 직접 만든 결과물(포트폴리오)이 중요' },
      pa: [['4년제 컴퓨터공학·소프트웨어', '대학 4년 → 인턴·프로젝트 → 신입 채용'], ['특성화고·마이스터고·전문대', '실무 과정 → 취업 → 경력으로 이동'], ['다른 전공 + 교육과정', '다른 전공 → 개발 교육과정 → 포트폴리오로 취업']],
      pb: ['데이터 분석가', 'UX·UI 디자이너', 'IT 서비스 기획자'],
      ai: [['반복 코드 작성', '간단한 오류 찾기', '문서 초안'], ['무엇을 만들지 정하기', '코드가 맞는지 검증', '보안·장애 책임']],
      tk: 'AI 도구가 퍼지면서 신입 채용이 까다로워졌다는 신호가 있어(한국은행 2025.10). 직접 만든 결과물의 무게가 커졌어.',
      q: ['버그 찾기 1시간', ['엔트리·스크래치·파이썬 중 하나로 "1~100에서 3의 배수 더하기" 만들기', 'AI에게 일부러 틀린 코드를 받아서 틀린 곳 찾기', '찾은 방법을 3줄로 적기']] },
    { id: 'data', n: '데이터 분석가', i: '📊', g: 'math', env: ['desk', 'alone'],
      day: [['10:00', '요청 받기 — "이번 달 판매가 왜 줄었지?"', 'p'], ['10:30', '데이터 꺼내서 정리 (빠진 값·이상한 값)', 'b'], ['13:30', '분석하고 그래프 만들기', 'c'], ['16:00', '결과를 비전문가에게 설명', 'p']],
      bo: '분석보다 지저분한 표를 고치는 데이터 정리가 시간을 더 많이 먹어.',
      mo: { s: '월급형', sp: '중간~큼', st: '20대 중반 (대학원을 거치면 후반)', c: '통계·코딩 실력과 분석 결과물. 대학원 진학도 흔한 편(추정)' },
      pa: [['통계·수학·컴퓨터·산업공학', '4년 → 분석 프로젝트 → 취업'], ['다른 전공 + 데이터', '경영·사회과학 전공 → 통계·코딩 추가 → 그 분야 데이터 담당'], ['대학원', '석사 → 고급 분석·연구']],
      pb: ['소프트웨어 개발자', '마케터', '연구원'],
      ai: [['코드·쿼리 초안', '그래프 생성', '간단한 요약'], ['좋은 질문 고르기', '데이터를 믿을 수 있는지 판단', '결론의 한계 설명']],
      tk: '"데이터 분석가" 이름보다 마케팅·의료·금융처럼 분야 지식이 있는 분석가를 찾는 경우가 많다는 이야기가 많아.',
      q: ['급식 데이터 분석', ['이번 달 급식표 반찬을 종류별 표로 (튀김·국·채소 등)', '가장 많이 나온 종류와 요일 패턴 찾기', '그래프 1개 + "그래서 뭐?" 한 줄']] },
    { id: 'semi', n: '반도체 공정 엔지니어', i: '🔌', g: 'ee', env: ['pressure', 'irregular'],
      day: [['8:00', '밤사이 공정 데이터·불량률 확인', 'c'], ['9:00', '회의 — 문제 생긴 웨이퍼 원인 논의', 'p'], ['10:30', '방진복 입고 클린룸에서 장비 점검', 'c'], ['14:00', '조건 바꿔 실험 계획', 'c'], ['17:00', '보고서 작성', 'b']],
      bo: '불량 원인 하나를 찾으려고 같은 데이터를 며칠씩 볼 때가 있어.',
      mo: { s: '월급형 + 회사 성과급', sp: '중간 — 회사·경기에 따라 성과급 차이가 커', st: '20대 중후반 (석사 후 입사도 많음)', c: '전자·재료·화학공학 전공. 연구개발은 대학원 비중이 큰 편(추정)' },
      pa: [['4년제 전자·재료·화학공학', '4년 → 채용 → 공정·설비 엔지니어'], ['대학원', '석사·박사 → 연구개발'], ['마이스터고·전문대', '장비·설비 → 생산 현장 기술직']],
      pb: ['전기 기술자', '화학공학 기술자', '반도체 장비 회사 엔지니어'],
      ai: [['불량 패턴 찾기', '공정 데이터 감시'], ['원인 가설 세우기', '장비 현장 판단', '안전 관리']],
      tk: '반도체 경기는 몇 년마다 오르내려서, 같은 회사라도 시기별 분위기가 달라.',
      q: ['변수 하나씩 바꾸기', ['같은 방법으로 종이비행기 5개 접어 날리고 거리 기록', '접는 법이나 종이 하나만 바꿔 5개 더', '무엇이 결과를 바꿨는지 표로 — 공정 엔지니어가 매일 하는 방식']] },
    { id: 'car', n: '자동차·모빌리티 엔지니어', i: '🚗', g: 'me', env: ['move', 'pressure'],
      day: [['9:00', '설계 회의', 'p'], ['10:00', '설계 프로그램(CAD)으로 부품 수정', 'c'], ['13:30', '시험장에서 시제품 테스트', 'c'], ['16:00', '부품 회사와 일정 조율', 'p']],
      bo: '설계 하나 바꾸면 비용·일정·안전 검토 서류가 따라와.',
      mo: { s: '월급형', sp: '중간', st: '20대 중후반', c: '기계·전기·컴퓨터 전공' },
      pa: [['4년제 기계·자동차공학', '설계·연구 엔지니어'], ['특성화고·전문대 자동차과', '정비·생산 기술 → 자동차정비 자격'], ['컴퓨터·전자 전공', '자율주행·차량 소프트웨어']],
      pb: ['로봇 엔지니어', '자동차 정비사', '배터리 엔지니어'],
      ai: [['설계 시뮬레이션', '자료 검색'], ['실제 시험 판단', '안전 결정', '협업 조율']],
      tk: '전기차·자율주행 때문에 기계 전공자도 소프트웨어를 같이 할 줄 알아야 한다는 말이 많아.',
      q: ['제동 거리 실험', ['장난감 차나 공을 경사면에서 굴려 멈춘 거리 3번 재기', '바닥(이불·나무·종이) 바꿔 다시', '표 + "진짜 차라면?" 한 줄']] },
    { id: 'chem', n: '화학공학 기술자 (배터리·소재)', i: '🧪', g: 'chem', env: ['pressure'],
      day: [['9:00', '실험·생산 데이터 확인', 'c'], ['10:00', '실험실에서 시료 만들고 측정', 'c'], ['14:00', '안전 점검·기록', 'b'], ['16:00', '결과 회의', 'p']],
      bo: '같은 조건으로 여러 번 반복해야 믿을 수 있어. 기록이 일의 절반이야.',
      mo: { s: '월급형', sp: '중간', st: '20대 중후반', c: '화학·화학공학·신소재 전공. 연구직은 대학원이 흔해' },
      pa: [['4년제 화학공학·신소재', '생산·공정 엔지니어'], ['대학원', '소재 연구원'], ['특성화고·전문대 화공', '품질 분석·생산 기술직']],
      pb: ['반도체 공정 엔지니어', '환경공학 기술자', '품질 관리 담당'],
      ai: [['소재 후보 찾기', '데이터 정리'], ['실험 설계', '안전 판단', '결과 재현 확인']],
      tk: '유해 물질을 다루는 곳은 안전 규칙이 아주 엄격해.',
      q: ['부엌 화학 실험 노트', ['베이킹소다 + 식초: 양을 3가지로 바꿔 거품 높이 비교 (보호자와, 눈 보호)', '조건·결과·이유를 실험 노트 양식으로', '다음에 바꿔볼 조건 1개']] },
    { id: 'bio', n: '생명과학 연구원', i: '🧬', g: 'bio', env: ['alone', 'long', 'irregular'],
      day: [['9:00', '키우는 세포 상태 확인', 'c'], ['10:00', '실험 — 같은 과정을 정확히 반복', 'b'], ['14:00', '논문 읽기', 'c'], ['16:00', '연구실 회의·결과 발표', 'p']],
      bo: '실험이 실패하는 날이 성공하는 날보다 많을 수 있어. 세포는 주말에도 돌봐야 할 때가 있어.',
      mo: { s: '월급형 (연구소·기업·대학)', sp: '중간', st: '20대 후반~30대 (대학원 기간 포함)', c: '석사·박사 진학이 흔해' },
      pa: [['생명과학 4년 + 대학원', '석사 → 기업 연구원 / 박사 → 연구책임자'], ['4년제 졸업 후 취업', '바이오 기업 품질·생산·영업'], ['보건 계열 전문대', '임상병리 등 검사·분석 기술직']],
      pb: ['제약 회사 품질 관리', '바이오 데이터 분석가', '임상병리사'],
      ai: [['단백질 구조 예측', '논문 요약', '데이터 분석'], ['실험 아이디어', '결과 의미 해석', '연구 윤리']],
      tk: 'AI로 분석이 빨라져서 생명과학과 코딩을 같이 하는 연구자가 늘고 있어.',
      q: ['콩나물 관찰 1주 (첫 1시간)', ['컵 2개에 콩 넣고 하나만 햇빛에 두기', '오늘 길이 재고 표 만들기 (매일 같은 시간)', '1주 뒤 결과 예상 한 줄']] },
    { id: 'nurse', n: '간호사', i: '🩺', g: 'med', env: ['night', 'people', 'body', 'pressure', 'exam'],
      day: [['7:00', '인수인계 — 밤 근무자에게 환자 상태 듣기', 'p'], ['8:00', '투약·혈압·체온 측정', 'c'], ['10:00', '처치·회진 보조', 'c'], ['13:00', '간호 기록 입력', 'b'], ['14:30', '다음 근무자에게 인계', 'p']],
      bo: '돌봄 못지않게 기록·인수인계가 많아. 병원은 낮·저녁·밤 교대 근무가 흔해.',
      mo: { s: '월급형 + 야간·교대 수당', sp: '중간', st: '20대 초중반 (졸업 후 바로)', c: '간호학과 4년 → 간호사 국가시험' },
      pa: [['간호학과 4년', '국가시험 → 병원·보건소·학교·기업'], ['경력 후 전문간호사·보건직', '대학원·시험'], ['해외 간호사', '언어·자격 추가']],
      pb: ['보건교사', '임상병리사', '의료기기 회사'],
      ai: [['기록 정리', '투약 알림'], ['환자 변화 알아차리기', '돌봄', '응급 판단']],
      tk: '고령화로 돌봄·보건 인력은 더 필요해질 전망이야(고용정보원 인력수급 전망). 교대 근무가 몸에 맞는지가 오래 일할지를 크게 좌우한다는 이야기가 많아.',
      q: ['인수인계 메모 (SBAR)', ['가족 한 명의 오늘 컨디션(잠·식사·기분) 관찰', '상황-배경-판단-요청 4줄로 적기', '다른 사람이 읽고 바로 이해했는지 확인']] },
    { id: 'doctor', n: '의사', i: '👩‍⚕️', g: 'med', env: ['night', 'people', 'pressure', 'exam', 'long', 'irregular'],
      day: [['7:30', '회진 — 입원 환자 확인', 'p'], ['9:00', '외래 진료', 'p'], ['13:00', '수술·시술 또는 검사 판독', 'c'], ['16:00', '진료 기록·처방', 'b'], ['18:00', '당직이면 밤에도 응급 대응', 'c']],
      bo: '진료만큼 기록·서류 시간이 길어. 전공의(수련) 기간엔 근무 시간이 길다는 이야기가 많아.',
      mo: { s: '월급형(병원) 또는 개원', sp: '큼 — 전공·근무 형태에 따라 차이가 커', st: '20대 후반~30대 중반 (전문의까지면)', c: '의대 6년 → 의사 국가시험 → (전문의) 인턴 1년 + 레지던트 3~4년. 정원 등 제도는 해마다 확인' },
      pa: [['의예·의학 6년', '국가시험 → 일반의 또는 수련 → 전문의'], ['의사 후 다른 길', '연구·제약·의료 AI·보건 행정'], ['비슷한 관심의 다른 길', '약학·간호·의공학']],
      pb: ['약사', '간호사', '의공학 연구원'],
      ai: [['영상 판독 보조', '기록 정리'], ['최종 진단과 책임', '환자와 대화', '수술 판단']],
      tk: '공부 기간이 가장 긴 직업 중 하나야. "의사가 되고 싶다"와 "그 수련을 버틸 수 있다"는 다른 질문이야.',
      q: ['문진 연습', ['가족에게 가벼운 불편(피곤함 등)을 "어디·어떻게·언제부터" 질문 5개로 묻기', '답을 진료 기록처럼 정리', '진단은 하지 말고 "더 물어볼 것" 2개 적기']] },
    { id: 'pharm', n: '약사', i: '💊', g: 'med', env: ['people', 'exam', 'pressure'],
      day: [['9:00', '처방전 확인', 'c'], ['9:30', '조제 — 약 중복·같이 먹으면 안 되는 약 확인', 'c'], ['12:00', '복약 지도 — 먹는 법 설명', 'p'], ['15:00', '재고·보험 청구', 'b']],
      bo: '같은 확인 절차를 하루 수십 번 반복해. 실수 하나가 위험해서 꼼꼼함이 핵심이야.',
      mo: { s: '월급형(약국·병원·제약) 또는 개국', sp: '중간~큼', st: '20대 중후반', c: '약학대학 6년 → 약사 국가시험' },
      pa: [['약학대학 6년', '국가시험 → 약국·병원'], ['제약 회사', '연구·품질·허가 업무'], ['공직', '보건 분야 공무원']],
      pb: ['제약 회사 연구원', '간호사', '화학공학 기술자'],
      ai: [['처방 중복 검사', '재고 관리'], ['환자에게 설명', '이상 반응 판단', '책임']],
      tk: '자동 조제 기계가 늘어도, 약을 설명하고 확인하는 사람의 책임은 남아.',
      q: ['약 설명서 읽기', ['집 상비약 설명서 1장 읽기 (먹지 말고 읽기만)', '"언제·얼마나·같이 먹으면 안 되는 것"을 초등학생용 3줄로', '어려운 단어 3개 뜻 찾기']] },
    { id: 'pt', n: '물리치료사', i: '🦴', g: 'med', env: ['people', 'body', 'exam'],
      day: [['9:00', '환자 상태 평가', 'p'], ['10:00', '1:1 운동치료 (30분 단위 반복)', 'c'], ['13:30', '기구·전기 치료', 'c'], ['16:00', '치료 기록', 'b']],
      bo: '하루 종일 몸을 써서 환자를 도와야 해서 체력이 중요해.',
      mo: { s: '월급형 · 경력 후 센터 운영도', sp: '중간', st: '20대 초중반', c: '물리치료학과(3·4년제) → 국가시험' },
      pa: [['물리치료학과 3·4년제', '국가시험 → 병원·재활센터'], ['스포츠 재활', '팀·센터, 추가 교육'], ['대학원', '연구·교육']],
      pb: ['작업치료사', '운동 지도자', '간호사'],
      ai: [['동작 분석', '기록'], ['손으로 하는 치료', '동기 부여', '상태 판단']],
      tk: '고령화와 재활 수요로 일자리는 있는 편이라는 이야기가 많아(추정). 몸 쓰는 일이라 자기 몸 관리가 필수야.',
      q: ['스트레칭 코치', ['목·어깨 스트레칭 3가지를 공식 기관 영상으로 배우기', '가족에게 설명하며 같이 해보기', '어려워한 동작과 설명을 고친 점 적기']] },
    { id: 'acct', n: '회계사', i: '🧾', g: 'biz', env: ['desk', 'exam', 'pressure', 'irregular'],
      day: [['9:00', '회사 장부 검토', 'c'], ['11:00', '숫자가 안 맞는 곳 찾기', 'b'], ['14:00', '담당자 인터뷰·증빙 요청', 'p'], ['17:00', '감사 문서 작성', 'b']],
      bo: '결산·감사 시즌(연초)에 야근이 몰린다는 이야기가 많아.',
      mo: { s: '월급형(회계법인·기업) → 경력 후 개업', sp: '큼', st: '20대 중후반', c: '공인회계사 시험(1·2차) + 실무 수습. 응시에 필요한 학점 요건이 있어' },
      pa: [['경영·경제 등 + 회계사 시험', '회계법인 → 기업·금융'], ['세무사 시험', '세금 전문'], ['기업 재무팀', '시험 없이 회계·재무 담당']],
      pb: ['세무사', '기업 재무 담당', '데이터 분석가'],
      ai: [['장부 대조', '이상 거래 찾기', '보고서 초안'], ['판단·의견 내기', '고객 설득', '책임 있는 서명']],
      tk: '단순 장부 정리는 자동화가 빨라서, 판단·자문하는 역할로 무게가 옮겨가는 중이라는 말이 많아(추정).',
      q: ['용돈 장부 감사', ['지난 한 달 쓴 돈을 표로 (영수증·기억)', '카드·통장 기록과 대조해서 안 맞는 곳 찾기', '"왜 안 맞았나" 한 줄']] },
    { id: 'mkt', n: '마케터', i: '📣', g: 'biz', env: ['people', 'sell', 'irregular'],
      day: [['9:30', '어제 광고·SNS 반응 숫자 확인', 'c'], ['10:30', '기획 회의', 'p'], ['13:30', '콘텐츠·문구 만들기', 'c'], ['16:00', '디자이너·협력사 조율', 'p']],
      bo: '아이디어만큼 숫자 확인과 보고가 많아. 반응이 없으면 빨리 바꿔야 해.',
      mo: { s: '월급형 + 성과', sp: '중간~큼', st: '20대 중반', c: '학과 무관(경영·광고·심리 등). 실무 경험이 중요' },
      pa: [['경영·광고홍보·심리', '인턴 → 기업 마케팅'], ['콘텐츠·SNS 운영부터', '작은 채널 운영 경험 → 브랜드'], ['데이터 마케팅', '통계·분석 추가']],
      pb: ['서비스 기획자', '콘텐츠 PD', '데이터 분석가'],
      ai: [['문구·이미지 초안', '반응 분석'], ['무엇이 고객 마음에 닿을지 판단', '브랜드 책임', '협업']],
      tk: 'AI로 콘텐츠 만드는 속도가 빨라져서 "많이 만들기"보다 "뭘 만들지 고르기"가 중요해졌어.',
      q: ['광고 A/B 테스트', ['좋아하는 물건 하나로 홍보 문구 2개', '가족·친구 5명에게 어느 쪽이 더 사고 싶은지 묻기', '이긴 쪽 이유 추측 한 줄']] },
    { id: 'law', n: '변호사', i: '⚖️', g: 'soc', env: ['desk', 'people', 'exam', 'long', 'pressure', 'irregular'],
      day: [['9:00', '사건 기록 읽기', 'c'], ['11:00', '의뢰인 상담', 'p'], ['14:00', '법원 재판 출석', 'p'], ['16:00', '주장 문서(서면) 작성', 'c']],
      bo: '법정보다 문서를 읽고 쓰는 시간이 훨씬 길어.',
      mo: { s: '월급형(로펌·기업) 또는 개업', sp: '큼', st: '20대 후반~30대 초', c: '4년제 학부(전공 무관) → 법학전문대학원 3년 → 변호사시험' },
      pa: [['학부 → 로스쿨 3년', '변호사시험 → 로펌·기업·공공'], ['공무원·기업 법무', '법 지식을 쓰는 다른 길'], ['다른 법률 자격', '노무사·법무사 등']],
      pb: ['노무사', '행정 공무원', '기업 법무팀'],
      ai: [['판례 검색', '서면 초안'], ['의뢰인 사정 듣기', '전략 판단', '법정 변론']],
      tk: 'AI가 판례 검색을 빠르게 해줘도, 결과 책임은 변호사에게 있어.',
      q: ['학교 규칙 변론', ['학교 규칙 1개 고르기', '"바꿔야 한다 / 그대로 둬야 한다" 근거 3개씩', '판사 입장에서 결론과 이유 쓰기']] },
    { id: 'civil', n: '행정 공무원', i: '🏛', g: 'soc', env: ['desk', 'exam', 'people'],
      day: [['9:00', '민원 처리·문서 결재', 'p'], ['10:30', '사업 계획 서류 작성', 'b'], ['14:00', '관계 기관 회의', 'p'], ['16:00', '예산·통계 정리', 'b']],
      bo: '정해진 절차와 서류가 많아. 대신 근무 시간과 고용이 안정적인 편이야.',
      mo: { s: '월급형(공무원 보수표)', sp: '작음 — 정해진 호봉표', st: '20대 초중반부터 가능', c: '공무원 시험 (9·7·5급 공채). 9급은 학력 제한이 없어' },
      pa: [['9급 공채', '학력 무관 → 근무하며 승진'], ['7급·5급 공채', '더 높은 직급 시험'], ['기술직·지역인재', '전공·학교 추천 등 다른 경로']],
      pb: ['공기업 직원', '사회복지사', '교사'],
      ai: [['민원 분류', '문서 초안'], ['주민 사정 판단', '정책 조율', '책임 있는 결정']],
      tk: '민원 응대가 힘들다는 이야기가 많고, 몇 년마다 부서를 옮겨.',
      q: ['우리 동네 민원 해결', ['동네 불편한 점 1개 찾기 (가로등·횡단보도 등)', '구청 홈페이지에서 담당 부서 찾기', '예의 있는 민원 글 5줄 써보기 (보내지는 말기)']] },
    { id: 'reporter', n: '기자', i: '📰', g: 'hum', env: ['irregular', 'move', 'people', 'pressure'],
      day: [['8:00', '아침 회의 — 오늘 기사 정하기', 'p'], ['10:00', '현장 취재·인터뷰', 'p'], ['14:00', '자료 확인 (팩트체크)', 'c'], ['16:00', '마감 맞춰 기사 쓰기', 'c']],
      bo: '마감 압박이 매일 있어. 사건이 생기면 밤·주말에도 움직여.',
      mo: { s: '월급형', sp: '중간', st: '20대 중후반', c: '학과 무관. 언론사 채용(필기·실무·면접)' },
      pa: [['언론사 공채', '신문·방송·통신사'], ['전문 매체', '경제·과학·IT 전문지'], ['영상·뉴스레터', '개인·소규모 미디어']],
      pb: ['PD', '홍보 담당', '작가'],
      ai: [['받아쓰기', '자료 요약', '초안'], ['현장 확인', '사실 검증', '무엇이 뉴스인지 판단']],
      tk: 'AI 요약이 늘수록 직접 확인한 정보의 가치가 커진다는 말이 많아(추정).',
      q: ['팩트체크 기자', ['SNS·영상에서 본 "놀라운 사실" 1개 고르기', '공식 출처 2곳으로 확인', '맞음 / 틀림 / 일부 맞음 + 근거로 짧은 기사']] },
    { id: 'ux', n: 'UX·UI 디자이너', i: '🎨', g: 'art', env: ['desk', 'people'],
      day: [['9:30', '사용자 불편 기록·인터뷰 보기', 'c'], ['11:00', '화면 설계 (와이어프레임)', 'c'], ['14:00', '개발자·기획자와 회의', 'p'], ['16:00', '시안 수정', 'b']],
      bo: '예쁜 그림보다 "사용자가 왜 여기서 헤매는지" 찾는 일이 더 커. 수정 요청이 계속 와.',
      mo: { s: '월급형 · 프리랜서', sp: '중간~큼', st: '20대 중반', c: '디자인·HCI 전공 또는 비전공 포트폴리오' },
      pa: [['시각·산업디자인', '포트폴리오 → IT 회사'], ['다른 전공 + 교육과정', '심리·경영 전공 → 포트폴리오'], ['디자인 특성화고·전문대', '실무 → 경력']],
      pb: ['서비스 기획자', '마케터', '영상 디자이너'],
      ai: [['시안 초안', '이미지 생성'], ['사용자 이해', '무엇이 좋은지 판단', '팀 설득']],
      tk: 'AI로 시안이 빨라져서 "왜 이렇게 설계했는지" 설명하는 힘이 더 중요해졌어.',
      q: ['앱 화면 고치기', ['자주 쓰는 앱에서 헤맸던 순간 떠올리기', '가족 1명에게 그 앱으로 일 하나 시키고 말없이 관찰', '고친 화면을 종이에 그리기']] },
    { id: 'teacher', n: '중·고등학교 교사', i: '🍎', g: 'edu', env: ['people', 'exam'],
      day: [['8:20', '조회·출결 확인', 'p'], ['9:00', '수업 4~5시간', 'p'], ['13:00', '상담·생활지도', 'p'], ['15:00', '수업 준비·평가·행정 업무', 'b']],
      bo: '수업 외에 행정 업무와 생활지도가 많다는 이야기가 많아.',
      mo: { s: '월급형(교육공무원 호봉)', sp: '작음', st: '20대 중후반 (임용 합격 시점에 따라)', c: '사범대 4년 또는 교직이수·교육대학원 → 임용시험' },
      pa: [['사범대학', '교원자격 → 임용시험 → 공립'], ['일반학과 + 교직이수', '자격 → 임용·사립'], ['교육 관련 다른 길', '에듀테크·교육 콘텐츠·학원']],
      pb: ['에듀테크 기획자', '상담 전문가', '학원 강사'],
      ai: [['문제 출제', '채점 보조', '자료 준비'], ['학생과 관계', '동기 부여', '생활지도']],
      tk: '학생 수가 줄어서 교사 선발 인원이 줄 수 있어. 매년 발표를 확인해야 해.',
      q: ['3분 수업', ['요즘 배운 개념 1개 고르기', '가족에게 그림 1장으로 3분 설명', '상대가 이해했는지 질문 2개로 확인']] },
    { id: 'counsel', n: '상담심리 전문가', i: '🤝', g: 'edu', env: ['people', 'long'],
      day: [['10:00', '상담 1회 (50분)', 'p'], ['11:00', '상담 기록', 'b'], ['14:00', '상담 2~3회', 'p'], ['17:00', '선배 상담가에게 피드백 받기', 'c']],
      bo: '남의 힘든 이야기를 하루 종일 듣는 일이라, 상담가 자신의 마음 관리가 중요해.',
      mo: { s: '월급형(센터·학교·기업) · 개업', sp: '중간~큼', st: '20대 후반~30대 (대학원·수련 포함)', c: '심리학 등 학부 → 대학원 석사 → 수련 → 학회·국가 자격' },
      pa: [['심리학 → 대학원', '수련 → 상담심리 자격'], ['임상심리', '대학원 + 병원 수련 → 국가 자격'], ['교육·복지', '전문상담교사·사회복지']],
      pb: ['사회복지사', '교사', '인사(HR) 담당'],
      ai: [['기록 정리', '심리 교육 자료'], ['공감과 관계', '위기 판단', '윤리']],
      tk: '자격 종류가 여러 개라 공식 학회·국가 자격인지 꼭 확인해야 해.',
      q: ['듣기 연습', ['가족·친구에게 요즘 즐거운 일 10분 듣기', '중간에 내 이야기 하지 않고, 들은 말을 정리해서 돌려주기', '상대가 "잘 들어줬다" 느꼈는지 물어보기']] },
    { id: 'envr', n: '환경공학 기술자', i: '🌿', g: 'env', env: ['move'],
      day: [['9:00', '측정 장비 데이터 확인', 'c'], ['10:30', '현장에서 물·공기·흙 시료 채취', 'c'], ['14:00', '분석·보고서', 'b'], ['16:00', '법 기준에 맞는지 검토', 'c']],
      bo: '현장 측정과 보고서·법 기준 서류가 반복돼.',
      mo: { s: '월급형', sp: '중간', st: '20대 중반', c: '환경공학 등 → 환경 분야 기사 자격이 도움' },
      pa: [['환경공학 4년', '기업 환경안전·컨설팅·공기업'], ['환경직 공무원', '공무원 시험'], ['특성화고·전문대', '측정·분석 기술직']],
      pb: ['화학공학 기술자', '도시계획가', '환경직 공무원'],
      ai: [['측정 데이터 분석', '오염 예측'], ['현장 조사', '이해관계 조정', '기준 판단']],
      tk: '탄소중립 정책으로 기업마다 환경 담당이 생기고 있지만, 정책에 따라 규모가 달라질 수 있어(추정).',
      q: ['우리 집 에너지 측정', ['전기·가스 사용량을 고지서나 앱에서 3개월치 찾기', '추이 그래프 그리기', '줄일 수 있는 것 2개와 예상 효과']] },
    { id: 'elec', n: '전기 기술자', i: '⚡', g: 'ee', env: ['body', 'move', 'pressure'],
      day: [['8:00', '안전 교육·작업 계획', 'p'], ['9:00', '현장 설비 점검·배선', 'c'], ['13:00', '고장 원인 찾기', 'c'], ['16:00', '점검 기록', 'b']],
      bo: '감전 위험이 있어서 안전 절차를 하나도 빼먹으면 안 돼.',
      mo: { s: '월급형 · 경력 후 자영업', sp: '중간', st: '20대 초반부터 가능', c: '전기기능사 → 산업기사 → 기사 자격 단계' },
      pa: [['특성화고·마이스터고 전기과', '자격 → 현장 취업 → 경력'], ['전문대·4년제 전기공학', '설계·감리·공기업'], ['일하면서 자격 올리기', '기능사 → 산업기사 → 기사']],
      pb: ['반도체 설비 엔지니어', '신재생에너지 기술자', '건물 설비 관리'],
      ai: [['설비 이상 감지', '점검 기록'], ['현장 작업', '안전 판단', '고장 수리']],
      tk: '현장 기술직은 사람이 직접 해야 하는 일이 많아서 AI 영향이 상대적으로 적다는 분석이 많아(추정).',
      q: ['우리 집 전기 지도', ['분전반(두꺼비집) 위치 찾기 — 만지지 말고 보기만', '방마다 콘센트·전등 개수 지도 그리기', '멀티탭을 너무 많이 꽂은 곳 1곳 찾기']] },
    { id: 'chef', n: '조리사·셰프', i: '🍳', g: '', env: ['body', 'irregular', 'pressure'],
      day: [['10:00', '재료 손질 (준비)', 'b'], ['11:30', '점심 손님 몰리는 시간', 'c'], ['15:00', '쉬는 시간·저녁 준비', 'b'], ['17:30', '저녁 서비스', 'c'], ['22:00', '마감 청소', 'b']],
      bo: '요리하는 시간보다 준비·청소가 길어. 남들 쉬는 저녁·주말이 가장 바빠.',
      mo: { s: '월급형 → 경력 후 창업', sp: '큼', st: '10대 후반~20대 초', c: '조리 특성화고·전문대·현장 → 조리기능사 등 자격' },
      pa: [['조리 특성화고·전문대', '현장 취업'], ['4년제 외식경영·식품', '메뉴 개발·외식 기획'], ['현장부터', '보조 → 경력 → 창업']],
      pb: ['식품 회사 메뉴 개발', '외식 마케터', '영양사'],
      ai: [['재고·주문 관리', '레시피 아이디어'], ['맛 판단', '손기술', '주방 팀워크']],
      tk: '창업은 요리 실력만큼 가게 운영(재료비·임대료)이 중요하다는 이야기가 많아.',
      q: ['30분 한 끼 + 원가', ['간단한 한 끼 요리 (보호자와, 불 조심)', '재료값으로 1인분 원가 계산', '판다면 얼마를 받을지 이유와 함께']] }
  ];
  var BY = {}; J.forEach(function (j) { BY[j.id] = j; });
  var STEPS = ['지우기', '고르기', '현실 카드', '맛보기', '정리'];
  var RX = [['up', '😀 괜찮아'], ['mid', '😐 글쎄'], ['down', '🙁 별로']];
  var KEEP = [['keep', '남기기'], ['maybe', '보류'], ['drop', '빼기']];

  function base() { return window.FC_PATH.load(); }
  function load() {
    var o = base(), x = o.ex && typeof o.ex === 'object' ? o.ex : {};
    x.no = Array.isArray(x.no) ? x.no.filter(function (k) { return ENV.some(function (v) { return v[0] === k; }); }) : [];
    x.pick = Array.isArray(x.pick) ? x.pick.filter(function (k) { return BY[k]; }).slice(0, 3) : [];
    ['day', 'wage', 'q', 'keep', 'why'].forEach(function (k) { x[k] = x[k] && typeof x[k] === 'object' ? x[k] : {}; });
    x.step = Math.max(0, Math.min(4, Number(x.step) || 0));
    x.cur = BY[x.cur] && x.pick.indexOf(x.cur) >= 0 ? x.cur : x.pick[0] || '';
    o.ex = x; return o;
  }
  function put(o) { o.upd = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (z) {} }
  function left(x) { return J.filter(function (j) { return !j.env.some(function (v) { return x.no.indexOf(v) >= 0; }); }); }
  function hits(j, x) { return j.env.filter(function (v) { return x.no.indexOf(v) >= 0; }); }
  function envName(k) { var f = ENV.filter(function (v) { return v[0] === k; })[0]; return f ? f[1].replace(/^\S+\s/, '') : k; }

  function stepper(x) {
    return '<div class="ce-steps" role="group" aria-label="탐색 단계">' + STEPS.map(function (s, i) {
      var dis = i >= 2 && !x.pick.length;
      return '<button type="button" data-ce-step="' + i + '"' + (i === x.step ? ' aria-current="step" class="on"' : '') + (dis ? ' disabled' : '') + '><b>' + (i + 1) + '</b>' + s + '</button>';
    }).join('') + '</div>';
  }
  function nav(x, nextLabel) {
    return '<div class="ce-nav">' + (x.step > 0 ? '<button type="button" class="ce-prev" data-ce-step="' + (x.step - 1) + '">← 이전</button>' : '<span></span>') +
      (x.step < 4 ? '<button type="button" class="ce-next" data-ce-step="' + (x.step + 1) + '"' + (x.step >= 1 && !x.pick.length ? ' disabled' : '') + '>' + (nextLabel || '다음 →') + '</button>' : '') + '</div>';
  }
  function jobTabs(x) {
    return '<div class="ce-jt" role="tablist">' + x.pick.map(function (id) { var j = BY[id]; return '<button type="button" role="tab" data-ce-cur="' + id + '" aria-selected="' + (x.cur === id) + '" class="' + (x.cur === id ? 'on' : '') + '">' + j.i + ' ' + e(j.n) + '</button>'; }).join('') + '</div>';
  }

  function s0(x) {
    var l = left(x).length;
    return '<section class="card"><p class="ce-eye">1단계 · 지우기</p><h2>이건 정말 싫다, 싶은 걸 골라봐</h2><p class="muted small">좋아하는 것보다 싫은 걸 더 정확히 아는 경우가 많아. 없으면 그냥 넘어가도 돼.</p>' +
      '<div class="ce-env" role="group" aria-label="싫은 근무 조건">' + ENV.map(function (v) { var on = x.no.indexOf(v[0]) >= 0; return '<button type="button" data-ce-no="' + v[0] + '" aria-pressed="' + on + '" class="' + (on ? 'on' : '') + '">' + (on ? '✕ ' : '') + v[1] + '</button>'; }).join('') + '</div>' +
      '<p class="ce-left" role="status">직업 <b>' + J.length + '개</b> 중 <b>' + l + '개</b> 남았어</p>' +
      '<div class="ce-mini">' + J.map(function (j) { var h = hits(j, x).length; return '<span class="' + (h ? 'out' : '') + '" title="' + e(h ? '지운 조건: ' + hits(j, x).map(envName).join(', ') : '') + '">' + j.i + ' ' + e(j.n) + '</span>'; }).join('') + '</div>' +
      (l < 3 ? '<p class="ce-warn">너무 많이 지웠어. 조건 하나만 풀어볼까? "조금 싫음"과 "절대 싫음"은 달라.</p>' : '') + '</section>' + nav(x);
  }
  function s1(x) {
    var o = base(), wish = o.groups || [], l = left(x), out = J.filter(function (j) { return l.indexOf(j) < 0; });
    function card(j, gone) {
      var on = x.pick.indexOf(j.id) >= 0, star = j.g && wish.indexOf(j.g) >= 0;
      return '<button type="button" class="ce-job' + (on ? ' on' : '') + (gone ? ' gone' : '') + '" data-ce-pick="' + j.id + '" aria-pressed="' + on + '"><span class="ce-ji">' + j.i + '</span><b>' + e(j.n) + '</b><small>' + (j.g && G[j.g] ? e(G[j.g].n) : '외식·식품') + (star ? ' · ⭐ 내 희망 계열' : '') + '</small>' + (gone ? '<em>지운 조건: ' + hits(j, x).map(envName).map(e).join(', ') + '</em>' : '') + (on ? '<i>✓</i>' : '') + '</button>';
    }
    return '<section class="card"><p class="ce-eye">2단계 · 고르기</p><h2>궁금한 직업 3개까지 <small>' + x.pick.length + '/3</small></h2><p class="muted small">잘 맞을 것 같은 것보다 "궁금한 것"을 골라. 하나는 의외의 직업을 넣어보는 것도 좋아.</p>' +
      '<div class="ce-jobs">' + l.map(function (j) { return card(j, false); }).join('') + '</div>' +
      (out.length ? '<details class="ce-out"><summary>지운 조건 때문에 빠진 직업 ' + out.length + '개도 보기</summary><div class="ce-jobs">' + out.map(function (j) { return card(j, true); }).join('') + '</div></details>' : '') + '</section>' + nav(x, '현실 카드 보기 →');
  }
  function s2(x) {
    var j = BY[x.cur]; if (!j) return s1(x);
    var w = x.wage[j.id] || {}, rx = x.day[j.id] || '';
    var h = '<section class="card ce-real"><p class="ce-eye">3단계 · 현실 카드</p>' + jobTabs(x) + '<h2>' + j.i + ' ' + e(j.n) + '</h2>';
    h += '<h3>⏰ 하루 (예시)</h3><ol class="ce-day">' + j.day.map(function (d) { return '<li class="ck-' + d[2] + '"><span>' + e(d[0]) + '</span><p>' + e(d[1]) + '<small>' + K[d[2]] + '</small></p></li>'; }).join('') + '</ol>';
    var cnt = { c: 0, p: 0, b: 0 }; j.day.forEach(function (d) { cnt[d[2]]++; });
    h += '<div class="ce-bar" aria-label="하루 구성">' + ['c', 'p', 'b'].map(function (k) { return cnt[k] ? '<span class="ck-' + k + '" style="flex:' + cnt[k] + '">' + K[k] + '</span>' : ''; }).join('') + '</div><p class="ce-bo">😮‍💨 ' + e(j.bo) + '</p>';
    h += '<div class="ce-rx" role="group" aria-label="이 하루 어때?"><span>이 하루, 매일 할 수 있을 것 같아?</span>' + RX.map(function (r) { return '<button type="button" data-ce-day="' + j.id + '" data-v="' + r[0] + '" aria-pressed="' + (rx === r[0]) + '" class="' + (rx === r[0] ? 'on' : '') + '">' + r[1] + '</button>'; }).join('') + '</div>';
    h += '<h3>💰 돈의 현실</h3><dl class="ce-mo"><dt>버는 방식</dt><dd>' + e(j.mo.s) + '</dd><dt>사람마다 차이</dt><dd>' + e(j.mo.sp) + '</dd><dt>첫 수입 시기</dt><dd>' + e(j.mo.st) + '</dd><dt>들어가는 조건</dt><dd>' + e(j.mo.c) + '</dd></dl>';
    h += '<div class="ce-wage"><p><b>🔎 현실 체크: 임금은 직접 찾아 적기</b><br><span class="muted small">커리어넷·고용24 직업정보에서 "' + e(j.n) + '"을 검색하면 재직자 조사 임금이 나와. 평균 하나보다 아래·가운데·위 범위를 봐.</span></p>' +
      '<div class="ce-wf">' + [['lo', '하위 25%'], ['mid', '중간'], ['hi', '상위 25%']].map(function (f) { return '<label>' + f[1] + '<span><input inputmode="numeric" maxlength="6" data-ce-wage="' + j.id + '" data-f="' + f[0] + '" value="' + e(w[f[0]] || '') + '" placeholder="-">만원</span></label>'; }).join('') +
      '<label>조사 연도<span><input inputmode="numeric" maxlength="4" data-ce-wage="' + j.id + '" data-f="yr" value="' + e(w.yr || '') + '" placeholder="20__"></span></label></div>' +
      '<div class="ce-links"><a href="https://www.career.go.kr" target="_blank" rel="noopener noreferrer">커리어넷</a><a href="https://www.work24.go.kr" target="_blank" rel="noopener noreferrer">고용24</a></div></div>';
    h += '<h3>🛣 가는 길</h3><ul class="ce-pa">' + j.pa.map(function (p, i) { return '<li><b>길 ' + (i + 1) + ' · ' + e(p[0]) + '</b><span>' + e(p[1]) + '</span></li>'; }).join('') + '</ul>' +
      '<p class="ce-pb"><b>막히면 옆길</b> ' + j.pb.map(e).join(' · ') + '</p>';
    h += '<h3>🤖 AI가 바꾸는 부분</h3><div class="ce-ai"><div><p>AI가 도와줄 과제</p><ul>' + j.ai[0].map(function (a) { return '<li>' + e(a) + '</li>'; }).join('') + '</ul></div><div><p>사람이 맡는 과제</p><ul>' + j.ai[1].map(function (a) { return '<li>' + e(a) + '</li>'; }).join('') + '</ul></div></div>';
    h += '<h3>💬 흔히 듣는 이야기</h3><p class="ce-tk">' + e(j.tk) + '</p>';
    var i = x.pick.indexOf(j.id), nx = x.pick[i + 1];
    h += '</section>' + (nx ? '<div class="ce-nav"><span></span><button type="button" class="ce-next" data-ce-cur="' + nx + '">다음 직업: ' + BY[nx].i + ' ' + e(BY[nx].n) + ' →</button></div>' : nav(x, '맛보기로 →'));
    return h;
  }
  function s3(x) {
    var h = '<section class="card"><p class="ce-eye">4단계 · 맛보기</p><h2>1시간만 그 일을 해보자</h2><p class="muted small">진짜 업무를 작게 줄인 과제야. 시험 기간엔 하나만, 주말에 해도 돼.</p><div class="ce-qs">';
    x.pick.forEach(function (id) {
      var j = BY[id], q = x.q[id] || {};
      h += '<article class="ce-q"><h3>' + j.i + ' ' + e(j.n) + ' <small>' + e(j.q[0]) + '</small></h3><ol>' + j.q[1].map(function (s) { return '<li>' + e(s) + '</li>'; }).join('') + '</ol>';
      if (!q.at) h += '<button type="button" class="ce-todo" data-ce-qtask="' + id + '">오늘 할 일로 넣기</button>';
      else h += '<p class="ce-qd">✓ ' + Number(q.at.slice(5, 7)) + '/' + Number(q.at.slice(8, 10)) + ' 할 일에 넣음 · 해보니 어땠어?</p><div class="ce-rx" role="group" aria-label="해보니 어땠어?">' +
        [['fun', '😀 재밌었어'], ['meh', '😐 보통'], ['bore', '🥱 지루했어']].map(function (r) { return '<button type="button" data-ce-qf="' + id + '" data-v="' + r[0] + '" aria-pressed="' + (q.f === r[0]) + '" class="' + (q.f === r[0] ? 'on' : '') + '">' + r[1] + '</button>'; }).join('') +
        '<button type="button" data-ce-qr="' + id + '" aria-pressed="' + !!q.r + '" class="' + (q.r ? 'on' : '') + '">🔁 또 할래</button></div>' +
        '<label class="ce-note">해보고 알게 된 것<textarea data-ce-qn="' + id + '" maxlength="300" rows="2" placeholder="예상과 달랐던 점">' + e(q.n || '') + '</textarea></label>';
      h += '</article>';
    });
    return h + '</div></section>' + nav(x, '정리하기 →');
  }
  function lab(list, v) { var f = list.filter(function (r) { return r[0] === v; })[0]; return f ? f[1] : '—'; }
  function s4(x) {
    var o = base(), kept = x.pick.filter(function (id) { return x.keep[id] === 'keep'; });
    var h = '<section class="card"><p class="ce-eye">5단계 · 정리</p><h2>남길 직업, 뺄 직업</h2><p class="muted small">빼도 괜찮아. "아니다"를 알게 된 것도 진로 탐색의 결과야.</p><div class="ce-sum">';
    x.pick.forEach(function (id) {
      var j = BY[id], q = x.q[id] || {}, w = x.wage[id] || {};
      h += '<article><h3>' + j.i + ' ' + e(j.n) + '</h3><p class="ce-chips"><span>하루: ' + lab(RX, x.day[id]) + '</span><span>맛보기: ' + (q.f ? lab([['fun', '😀 재밌었어'], ['meh', '😐 보통'], ['bore', '🥱 지루했어']], q.f) : '아직') + (q.r ? ' · 🔁' : '') + '</span>' + (w.mid ? '<span>임금 중간 ' + e(w.mid) + '만원' + (w.yr ? ' (' + e(w.yr) + ')' : '') + '</span>' : '') + '</p>' +
        '<div class="ce-keep" role="group" aria-label="이 직업 어떻게 할까?">' + KEEP.map(function (k) { return '<button type="button" data-ce-keep="' + id + '" data-v="' + k[0] + '" aria-pressed="' + (x.keep[id] === k[0]) + '" class="' + (x.keep[id] === k[0] ? 'on k-' + k[0] : '') + '">' + k[1] + '</button>'; }).join('') + '</div>' +
        '<input data-ce-why="' + id + '" maxlength="120" value="' + e(x.why[id] || '') + '" placeholder="이유 한 줄 (예: 하루는 좋은데 시험이 너무 길어)"></article>';
    });
    h += '</div>';
    var gs = []; kept.forEach(function (id) { var g = BY[id].g; if (g && gs.indexOf(g) < 0) gs.push(g); });
    if (gs.length) {
      var already = gs.every(function (g) { return (o.groups || []).indexOf(g) >= 0; });
      h += '<div class="ce-next2"><p>남긴 직업 계열: <b>' + gs.map(function (g) { return G[g].i + ' ' + e(G[g].n); }).join(' · ') + '</b></p>' + (already ? '<p class="muted small">이미 🎯 진로 한 장의 희망 계열에 있어.</p><button type="button" data-go="path">🎯 고2 과목 바구니 보러 가기</button>' : '<button type="button" data-ce-send>🎯 희망 계열에 담고 고2 과목 보기</button>') + '</div>';
    }
    h += '<div class="ce-again"><button type="button" data-ce-step="1">다른 직업도 탐색하기</button></div>';
    h += '<p class="muted small">이 탐색기는 적성 판정이나 합격 예측이 아니야. 직업 정보는 예시라서 회사·지역마다 달라. 3개월쯤 뒤에 한 번 더 해보면 생각이 어떻게 바뀌었는지 보여.</p></section>';
    return h;
  }

  function childView() { var o = load(), x = o.ex; return '<div class="ce-wrap"><div class="ce-head"><h1>🧭 현실 진로 탐색기</h1><p>꿈 대신, 그 직업으로 사는 하루를 먼저 살아보자.</p></div>' + stepper(x) + [s0, s1, s2, s3, s4][x.step](x) + '</div>'; }
  function parentView() {
    var o = load(), x = o.ex;
    var h = '<div class="ce-wrap"><div class="ce-head"><h1>🧭 승준이 진로 탐색</h1><p>승준이가 직업의 하루·돈·가는 길을 보고, 1시간 맛보기를 해보는 곳이에요.</p></div>';
    if (!o.share) return h + '<section class="card"><p>승준이가 진로 기록은 아직 혼자 보고 있어요. 이야기 나눌 때 물어봐 주세요.</p></section></div>';
    if (!x.pick.length) return h + '<section class="card"><p class="muted">아직 고른 직업이 없어요.</p></section></div>';
    h += '<section class="card"><h2>고른 직업 ' + x.pick.length + '개</h2><div class="ce-sum">' + x.pick.map(function (id) {
      var j = BY[id], q = x.q[id] || {};
      return '<article><h3>' + j.i + ' ' + e(j.n) + (x.keep[id] ? ' <small class="k-' + x.keep[id] + '">' + lab(KEEP, x.keep[id]) + '</small>' : '') + '</h3><p class="ce-chips"><span>하루: ' + lab(RX, x.day[id]) + '</span><span>맛보기: ' + (q.f ? lab([['fun', '😀 재밌었어'], ['meh', '😐 보통'], ['bore', '🥱 지루했어']], q.f) : '아직') + '</span></p>' + (x.why[id] ? '<p class="ce-why">"' + e(x.why[id]) + '"</p>' : '') + '</article>';
    }).join('') + '</div></section>';
    var j0 = BY[x.pick.filter(function (id) { return x.keep[id] !== 'drop'; })[0] || x.pick[0]];
    h += '<section class="card ce-talk"><h2>💬 대화 카드 · ' + j0.i + ' ' + e(j0.n) + '</h2><ol><li>"그 직업 하루 중에 제일 기대되는 시간이 언제야?"</li><li>"가는 길 ' + j0.pa.length + '개 중에 어느 쪽이 끌려? 왜?"</li><li>"막히면 옆길로 ' + e(j0.pb[0]) + '도 있던데, 그건 어때?"</li></ol><p class="muted small">정답을 알려주기보다 승준이 말을 한 번 더 정리해서 돌려주면 충분해요.</p></section>';
    if (x.no.length) h += '<section class="card"><h2>승준이가 지운 조건</h2><p>' + x.no.map(envName).map(e).join(' · ') + '</p><p class="muted small">"정말 싫은 건지, 해본 적이 없어서인지" 물어보면 좋아요.</p></section>';
    return h + '</div>';
  }

  function entry() {
    var x = load().ex, n = x.pick.length;
    return '<button type="button" class="ce-entry" data-go="career"><span class="ce-ei">🧭</span><span><b>현실 진로 탐색기</b><small>' + (n ? x.pick.map(function (id) { return BY[id].n; }).map(e).join(' · ') + ' 탐색 중 · ' + (x.step + 1) + '/5단계' : '싫은 것 지우기 → 직업 하루·돈·가는 길 → 1시간 맛보기') + '</small></span><i aria-hidden="true">›</i></button>';
  }

  if (location.hash === '#career') tab = 'career';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'career') {
      root.innerHTML = isParent() ? parentView() : childView();
      document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); });
      return;
    }
    if (tab === 'path') {
      var w = root.querySelector('.cp-wrap'); if (w && !w.querySelector('.ce-entry')) w.insertAdjacentHTML('afterbegin', entry());
    }
  };

  function mut(fn, keepScroll) { var o = load(); fn(o.ex, o); put(o); var y = window.scrollY; render(); if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0); }
  document.addEventListener('click', function (ev) {
    if (tab !== 'career' || isParent()) return;
    var b = ev.target.closest('button'); if (!b || b.disabled) return;
    var d = b.dataset;
    if (d.ceStep != null) { mut(function (x) { x.step = Number(d.ceStep); }); return; }
    if (d.ceNo) { mut(function (x) { var i = x.no.indexOf(d.ceNo); if (i >= 0) x.no.splice(i, 1); else x.no.push(d.ceNo); }, 1); return; }
    if (d.cePick) {
      mut(function (x) { var i = x.pick.indexOf(d.cePick); if (i >= 0) x.pick.splice(i, 1); else { if (x.pick.length >= 3) { if (typeof notice === 'function') notice('3개까지야. 하나 빼고 골라줘.'); return; } x.pick.push(d.cePick); } }, 1); return;
    }
    if (d.ceCur) { mut(function (x) { x.cur = d.ceCur; x.step = 2; }); return; }
    if (d.ceDay) { mut(function (x) { x.day[d.ceDay] = x.day[d.ceDay] === d.v ? '' : d.v; }, 1); return; }
    if (d.ceQtask) {
      var j = BY[d.ceQtask], t = '🧭 맛보기: ' + j.n + ' — ' + j.q[0];
      if (!state.tasks.some(function (z) { return z.date === td() && z.title === t; })) { state.tasks.push({ id: uid(), title: t.slice(0, 120), date: td(), done: false, kind: '과제', subject: '', note: j.q[1].join(' / ').slice(0, 300) }); save(); }
      mut(function (x) { x.q[d.ceQtask] = x.q[d.ceQtask] || {}; x.q[d.ceQtask].at = td(); }, 1);
      if (typeof notice === 'function') notice('오늘 할 일에 넣었어. 1시간이면 충분해.'); return;
    }
    if (d.ceQf) { mut(function (x) { var q = x.q[d.ceQf] = x.q[d.ceQf] || {}; q.f = q.f === d.v ? '' : d.v; }, 1); return; }
    if (d.ceQr) { mut(function (x) { var q = x.q[d.ceQr] = x.q[d.ceQr] || {}; q.r = !q.r; }, 1); return; }
    if (d.ceKeep) { mut(function (x) { x.keep[d.ceKeep] = x.keep[d.ceKeep] === d.v ? '' : d.v; }, 1); return; }
    if (b.hasAttribute('data-ce-send')) {
      var o = load(), gs = [];
      o.ex.pick.forEach(function (id) { if (o.ex.keep[id] === 'keep' && BY[id].g && gs.indexOf(BY[id].g) < 0) gs.push(BY[id].g); });
      gs.forEach(function (g) { if (o.groups.indexOf(g) < 0) { o.groups.push(g); if (o.groups.length > 2) o.groups.shift(); } });
      put(o); if (typeof notice === 'function') notice('희망 계열에 담았어. 이제 고2 과목을 골라보자.');
      tab = 'path'; location.hash = 'path'; render(); window.scrollTo(0, 0);
    }
  });
  var tmr = 0;
  function saveInput(t) {
    var o = load(), x = o.ex;
    if (t.dataset.ceWage) { var w = x.wage[t.dataset.ceWage] = x.wage[t.dataset.ceWage] || {}; w[t.dataset.f] = t.value.replace(/[^0-9]/g, '').slice(0, 6); }
    else if (t.dataset.ceQn) { var q = x.q[t.dataset.ceQn] = x.q[t.dataset.ceQn] || {}; q.n = t.value.slice(0, 300); }
    else if (t.dataset.ceWhy) x.why[t.dataset.ceWhy] = t.value.slice(0, 120);
    else return;
    put(o);
  }
  document.addEventListener('input', function (ev) {
    if (tab !== 'career' || isParent()) return; var t = ev.target;
    if (!t.matches || !t.matches('[data-ce-wage],[data-ce-qn],[data-ce-why]')) return;
    clearTimeout(tmr); tmr = setTimeout(function () { saveInput(t); }, 400);
  });
  document.addEventListener('change', function (ev) {
    if (tab !== 'career' || isParent()) return; var t = ev.target;
    if (t.matches && t.matches('[data-ce-wage],[data-ce-qn],[data-ce-why]')) { clearTimeout(tmr); saveInput(t); }
  });

  window.FC_EXPLORER = { jobs: J, env: ENV, load: load };

  var css = document.createElement('style');
  css.textContent = '.ce-head{display:block;padding:4px 2px 10px}.ce-head h1{margin:0;font-size:24px;color:#2a2550}.ce-head p{margin:4px 0 0;font-size:15px;color:#57546a}' +
    '.ce-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:0 0 12px}.ce-steps button{min-height:52px!important;padding:4px 2px!important;border-radius:12px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#4f4b66!important;font-size:12.5px;font-weight:700;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ce-steps button b{font-size:15px;color:#5b45d6}.ce-steps button.on{background:#5b45d6!important;border-color:#5b45d6!important;color:#fff!important}.ce-steps button.on b{color:#fff}.ce-steps button[disabled]{opacity:.55}' +
    '.ce-eye{margin:0 0 2px;font-size:12.5px;font-weight:800;color:#5b45d6}.ce-wrap h2 small{font-size:13.5px;color:#6b6880;margin-left:4px}.ce-wrap h3{font-size:17px;margin:18px 0 8px;color:#2a2550}' +
    '.ce-env{display:flex;flex-wrap:wrap;gap:8px}.ce-env button{min-height:42px!important;padding:6px 12px!important;border-radius:999px!important;border:1.5px solid #ddd7f3!important;background:#fff!important;color:#2a2550!important;font-size:15px;font-weight:600}.ce-env button.on{background:#3b3758!important;border-color:#3b3758!important;color:#fff!important}' +
    '.ce-left{margin:14px 0 8px;font-size:15px}.ce-left b{color:#5b45d6;font-size:17px}.ce-mini{display:flex;flex-wrap:wrap;gap:6px}.ce-mini span{font-size:13.5px;padding:4px 9px;border-radius:999px;background:#f1edff;color:#2a2550;transition:opacity .2s}.ce-mini span.out{background:#f1eff6;color:#6b6880;text-decoration:line-through}' +
    '.ce-warn{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:#fff6e6;color:#4a3500;font-size:15px}' +
    '.ce-jobs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.ce-job{position:relative;display:flex!important;flex-direction:column;align-items:flex-start;gap:2px;min-height:96px!important;padding:12px!important;border-radius:16px!important;border:1.5px solid #e6e2f5!important;background:#fff!important;color:#2a2550!important;text-align:left}.ce-job .ce-ji{font-size:24px}.ce-job b{font-size:15px;line-height:1.3}.ce-job small{font-size:12.5px;color:#57546a}.ce-job em{font-style:normal;font-size:12.5px;color:#7a4b00}.ce-job i{position:absolute;top:8px;right:10px;font-style:normal;font-weight:800;color:#5b45d6}.ce-job.on{border-color:#5b45d6!important;background:#f3f0ff!important}.ce-job.gone{background:#faf9fc!important}' +
    '.ce-out{margin-top:12px}.ce-out summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700;font-size:15px;color:#2a2550}' +
    '.ce-nav{display:flex;justify-content:space-between;gap:10px;margin:4px 0 16px}.ce-nav button{min-height:48px!important;padding:8px 16px!important;border-radius:12px!important;font-weight:700;font-size:15px}.ce-next{flex:1;background:#5b45d6!important;color:#fff!important;border:0!important}.ce-next[disabled]{background:#b9b2d8!important}.ce-prev{background:#fff!important;border:1.5px solid #e1dcf5!important;color:#2a2550!important}' +
    '.ce-jt{display:flex;gap:6px;overflow-x:auto;margin:6px 0 10px;padding-bottom:2px}.ce-jt button{flex:none;min-height:40px!important;padding:4px 12px!important;border-radius:999px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#2a2550!important;font-size:13.5px;font-weight:700}.ce-jt button.on{background:#2a2550!important;border-color:#2a2550!important;color:#fff!important}' +
    '.ce-day{list-style:none;margin:0;padding:0;display:grid;gap:6px}.ce-day li{display:grid;grid-template-columns:50px 1fr;gap:8px;align-items:start}.ce-day li span{font-size:13.5px;font-weight:800;color:#4f4b66;font-variant-numeric:tabular-nums;padding-top:9px}.ce-day li p{margin:0;padding:8px 12px;border-radius:12px;font-size:15px;line-height:1.45;border-left:4px solid}.ce-day li p small{display:block;font-size:12.5px;font-weight:700;margin-top:2px}' +
    '.ck-c p,.ce-bar .ck-c{background:#efebff;border-color:#5b45d6}.ck-c small{color:#3a22b8}.ck-p p,.ce-bar .ck-p{background:#e6f6ee;border-color:#187a5c}.ck-p small{color:#145c43}.ck-b p,.ce-bar .ck-b{background:#f1eff6;border-color:#8f8aa6}.ck-b small{color:#4f4b66}' +
    '.ce-bar{display:flex;height:28px;border-radius:999px;overflow:hidden;margin:10px 0 6px}.ce-bar span{display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:800;color:#2a2550;min-width:0;overflow:hidden;white-space:nowrap}' +
    '.ce-bo{margin:6px 0 10px;padding:10px 12px;border-radius:12px;background:#fff8ea;font-size:15px;line-height:1.55;color:#3b3020}' +
    '.ce-rx{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.ce-rx span{flex-basis:100%;font-size:13.5px;font-weight:700;color:#2a2550}.ce-rx button{min-height:40px!important;padding:4px 12px!important;border-radius:999px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#3b3758!important;font-size:13.5px;font-weight:600}.ce-rx button.on{background:#ece8fc!important;border-color:#5b45d6!important;color:#3a22b8!important}' +
    '.ce-mo{display:grid;grid-template-columns:96px 1fr;gap:6px 10px;margin:0;font-size:15px;line-height:1.5}.ce-mo dt{font-weight:800;color:#4f4b66;font-size:13.5px;padding-top:1px}.ce-mo dd{margin:0;color:#2a2550}' +
    '.ce-wage{margin:12px 0 0;padding:12px;border-radius:12px;border:1.5px dashed #cfc6f2;background:#fbfaff}.ce-wage p{margin:0 0 8px;font-size:15px;line-height:1.5}.ce-wf{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.ce-wf label{font-size:12.5px;font-weight:700;color:#4f4b66;min-width:0}.ce-wf label span{display:flex;align-items:center;gap:2px;margin-top:3px;font-size:12.5px;color:#57546a}.ce-wf input{width:100%;min-width:0;min-height:40px;box-sizing:border-box;border:1.5px solid #e1dcf5;border-radius:12px;padding:4px 6px;font:inherit;font-size:15px;text-align:right;background:#fff}' +
    '.ce-links{display:flex;gap:8px;margin-top:10px}.ce-links a{flex:1;min-height:42px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#ece8fc;color:#3a22b8;font-weight:700;font-size:15px;text-decoration:none}' +
    '.ce-pa{list-style:none;margin:0;padding:0;display:grid;gap:6px;counter-reset:p}.ce-pa li{padding:10px 12px;border-radius:12px;background:#f8f7fc;font-size:15px;line-height:1.5}.ce-pa li b{display:block;color:#2a2550;font-size:15px}.ce-pa li span{color:#3b3758}.ce-pb{margin:8px 0 0;font-size:15px;line-height:1.55}.ce-pb b{color:#7a4b00;margin-right:4px}' +
    '.ce-ai{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ce-ai>div{padding:10px 12px;border-radius:12px;background:#f8f7fc}.ce-ai p{margin:0 0 4px;font-size:12.5px;font-weight:800;color:#5b45d6}.ce-ai>div+div p{color:#145c43}.ce-ai ul{margin:0;padding-left:16px;font-size:13.5px;line-height:1.55;color:#2a2550}' +
    '.ce-tk{margin:0;font-size:15px;line-height:1.6;color:#3b3758;padding:10px 12px;border-radius:12px;background:#f5f3ff}' +
    '.ce-qs{display:grid;gap:12px;margin-top:8px}.ce-q{padding:12px;border-radius:16px;border:1.5px solid #e6e2f5}.ce-q h3{margin:0 0 6px!important}.ce-q h3 small{display:block;font-size:12.5px;color:#5b45d6;font-weight:700;margin-top:2px}.ce-q ol{margin:0 0 10px;padding-left:20px;font-size:15px;line-height:1.6}.ce-todo{width:100%;min-height:44px!important;border-radius:12px!important}.ce-qd{margin:0;font-size:13.5px;font-weight:700;color:#187a5c}.ce-note{display:block;margin-top:10px;font-size:12.5px;font-weight:700;color:#4f4b66}.ce-note textarea,.ce-sum input{display:block;width:100%;box-sizing:border-box;margin-top:4px;border:1.5px solid #e1dcf5;border-radius:12px;padding:8px 10px;font:inherit;font-size:15px;background:#fff}' +
    '.ce-sum{display:grid;gap:10px;margin-top:8px}.ce-sum article{padding:12px;border-radius:16px;background:#f8f7fc}.ce-sum h3{margin:0 0 6px!important}.ce-sum h3 small{font-size:12.5px;padding:2px 8px;border-radius:999px;margin-left:4px}.ce-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.ce-chips span{font-size:12.5px;padding:3px 9px;border-radius:999px;background:#fff;color:#3b3758;border:1px solid #e6e2f5}' +
    '.ce-keep{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}.ce-keep button{min-height:42px!important;border-radius:12px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#3b3758!important;font-weight:700;font-size:15px}.ce-keep button.k-keep,small.k-keep{background:#187a5c!important;border-color:#187a5c!important;color:#fff!important}.ce-keep button.k-maybe,small.k-maybe{background:#fff1d6!important;border-color:#e9c27a!important;color:#6b4500!important}.ce-keep button.k-drop,small.k-drop{background:#57546a!important;border-color:#57546a!important;color:#fff!important}' +
    '.ce-why{margin:0;font-size:15px;color:#3b3758}.ce-next2{margin:14px 0 0;padding:12px;border-radius:12px;background:#f1edff}.ce-next2 p{margin:0 0 8px;font-size:15px}.ce-next2 button{width:100%;min-height:46px!important;border-radius:12px!important;background:#5b45d6!important;color:#fff!important;border:0!important;font-weight:700}.ce-again{margin:12px 0}.ce-again button{width:100%;min-height:44px!important;border-radius:12px!important;background:#fff!important;border:1.5px solid #e1dcf5!important;color:#2a2550!important;font-weight:700}' +
    '.ce-talk ol{margin:4px 0 6px;padding-left:20px;font-size:15px;line-height:1.7}' +
    '.ce-entry{display:flex!important;align-items:center;gap:12px;width:100%;min-height:64px!important;margin:0 0 12px;padding:12px 14px!important;border-radius:16px!important;border:0!important;background:linear-gradient(135deg,#2a2550,#5b45d6)!important;color:#fff!important;text-align:left}.ce-entry .ce-ei{font-size:30px;flex:none}.ce-entry span{display:flex;flex-direction:column;flex:1;min-width:0}.ce-entry b{font-size:17px}.ce-entry small{font-size:12.5px;opacity:.92;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ce-entry i{font-style:normal;font-size:24px;flex:none}' +
    '@media(max-width:360px){.ce-wf{grid-template-columns:repeat(2,1fr)}.ce-ai{grid-template-columns:1fr}.ce-jobs{grid-template-columns:1fr}}';
  document.head.appendChild(css);
  render();
})();
