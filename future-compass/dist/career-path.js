/* 🎯 진로 한 장 (study.html#path) — 2026-10-16 진로·미래 전문가 관점 분석 반영
   1) 지금 시기: 고1 2학기 = 고2 선택과목 고르는 때 → 신청 마감일을 시험·과제 D-day로
   2) 흩어진 진로 결과(나 알아보기·관심 탐색기·미래 예측 계획)를 한 곳에서 보고 희망 계열 최대 2개 고르기
   3) 계열별 고2 과목 후보(2022 개정 과목명) → 내 후보 바구니 + 순서(위계) 점검
   4) 이번 달 30분 진로 미션 → 오늘 할 일로 보내기
   5) 미래 신호판: 2025~2026 공식 발표·연구로 예측 점검
   6) 엄마: 승준이가 보여주기로 한 것만 보고, 엄마 생각 한 줄 남기기
   과목 지정 정보는 2025년 9월 말 기준 언론 정리 + 서울대 발표(2025.6.30). 대학 발표는 바뀔 수 있어 어디가·대학 공지로 다시 확인한다.
   적성검사·합격 예측이 아니다. 저장: fc_path_v1 (가족 동기화) */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof render !== 'function' || typeof tabs === 'undefined') return;
  var KEY = 'fc_path_v1', TASK_ID = 'cp-sugang';
  tabs.path = '🎯 진로';
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function md(d) { var w = '일월화수목금토'[new Date(d + 'T12:00:00Z').getUTCDay()]; return Number(d.slice(5, 7)) + '/' + Number(d.slice(8)) + '(' + w + ')'; }
  function dgap(d) { return Math.round((Date.parse(d + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) / 864e5); }

  /* 과목 유형 (2022 개정 교육과정) */
  var TYPE = {};
  [['일반', '화법과 언어,독서와 작문,문학,대수,미적분Ⅰ,확률과 통계,영어Ⅰ,영어Ⅱ,영어 독해와 작문,세계시민과 지리,세계사,사회와 문화,현대사회와 윤리,물리학,화학,생명과학,지구과학,정보,제2외국어'],
   ['진로', '주제 탐구 독서,문학과 영상,직무 의사소통,기하,미적분Ⅱ,경제 수학,인공지능 수학,영어 발표와 토론,심화 영어 독해와 작문,한국지리 탐구,도시의 미래 탐구,정치,법과 사회,경제,윤리와 사상,국제 관계의 이해,역학과 에너지,전자기와 양자,물질과 에너지,화학 반응의 세계,세포와 물질대사,생물의 유전,지구시스템과학,행성우주과학,로봇과 공학세계,인공지능 기초,데이터 과학,미술 창작,미술 감상과 비평,인간과 철학,교육의 이해,인간과 심리'],
   ['융합', '독서 토론과 글쓰기,매체 의사소통,수학과제 탐구,실용 통계,금융과 경제생활,사회문제 탐구,기후변화와 환경생태,융합과학 탐구,창의 공학 설계,소프트웨어와 생활,미술과 매체']
  ].forEach(function (r) { r[1].split(',').forEach(function (c) { TYPE[c] = r[0]; }); });
  var SUNEUNG = { '대수': 1, '미적분Ⅰ': 1, '확률과 통계': 1, '화법과 언어': 1, '독서와 작문': 1, '문학': 1 };
  /* 먼저 들어야 이해가 쉬운 과목 (진로선택 → 같은 계열 일반선택) */
  var BEFORE = { '미적분Ⅱ': '미적분Ⅰ', '기하': '대수', '인공지능 수학': '대수', '경제 수학': '대수', '역학과 에너지': '물리학', '전자기와 양자': '물리학', '물질과 에너지': '화학', '화학 반응의 세계': '화학', '세포와 물질대사': '생명과학', '생물의 유전': '생명과학', '지구시스템과학': '지구과학', '행성우주과학': '지구과학' };

  /* 희망 계열: core = 주요대가 많이 지정했거나 공부 순서상 꼭 필요, rec = 있으면 도움 */
  var G = {
    cs: { n: '컴퓨터·AI·소프트웨어', i: '💻', core: ['미적분Ⅱ', '기하'], rec: ['확률과 통계', '인공지능 수학', '물리학', '인공지능 기초', '데이터 과학'], note: '서울대 대부분 학과 기하·미적분Ⅱ 둘 다, 고려대 컴퓨터학과 둘 다, 한양대 자연계 둘 중 하나 이상 지정(2025.9 기준). 과학은 지정 없는 곳이 많아.',
      m: ['AI가 짜준 코드 10줄에 한 줄씩 내 말로 설명 달기 (모르는 줄은 ? 표시)', '우리 반 시간표로 "다음 수업 알려주는 규칙"을 종이에 순서도로 그리기', '커리어넷 학과정보에서 컴퓨터공학과 4년 과목표 읽고 끌리는 과목 2개 적기'] },
    ee: { n: '전기·전자·반도체', i: '🔌', core: ['미적분Ⅱ', '기하', '물리학', '전자기와 양자'], rec: ['역학과 에너지', '화학', '물질과 에너지', '확률과 통계'], note: '고려대 전기전자공학부는 역학과 에너지·전자기와 양자·물질과 에너지·화학 반응의 세계 중 2과목 이상 지정(2025.9 기준).',
      m: ['휴대폰 충전 속도를 같은 조건(밝기·앱)으로 2번 재서 표로 비교하기', '반도체가 "스위치"라는 말이 무슨 뜻인지 영상 1개 보고 3줄로 설명하기', '커리어넷에서 전자공학과·반도체공학과 과목표 비교하기'] },
    me: { n: '기계·로봇·모빌리티', i: '⚙️', core: ['미적분Ⅱ', '기하', '물리학', '역학과 에너지'], rec: ['전자기와 양자', '화학', '로봇과 공학세계', '창의 공학 설계'], note: '서울대 기계공학부는 물리학 지정 + 과학 진로선택 3과목 이상 권장(2025.9 기준).',
      m: ['집에 있는 경첩·볼펜 스프링 구조를 관찰해 힘이 어디로 가는지 그림 그리기', '물류 로봇·자율주행 영상 1개 보고 "사람이 아직 하는 일" 3가지 적기', '커리어넷에서 기계공학과·로봇공학과 과목표 비교하기'] },
    chem: { n: '화학·신소재·에너지', i: '🧪', core: ['미적분Ⅱ', '화학', '물질과 에너지', '화학 반응의 세계'], rec: ['물리학', '역학과 에너지', '기하', '확률과 통계'], note: '고려대 화공생명공학과는 기하·미적분Ⅱ 둘 다 + 과학 진로선택 2과목 이상 지정(2025.9 기준).',
      m: ['배터리 종류(리튬이온·전고체) 차이를 기사 2개로 비교해 표 만들기', '부엌에서 볼 수 있는 화학 반응 3가지 찾아 이름 붙이기', '커리어넷에서 화학공학과·신소재공학과 과목표 비교하기'] },
    bio: { n: '생명과학·바이오', i: '🧬', core: ['생명과학', '세포와 물질대사', '생물의 유전', '화학'], rec: ['미적분Ⅱ', '확률과 통계', '물질과 에너지'], note: '서울대 생명과학부는 생명과학 지정 + 과학 진로선택 3과목 이상 권장(2025.9 기준).',
      m: ['급식 식단표에서 단백질 많은 반찬 고르고 우리 몸에서 쓰이는 곳 찾기', '유전자 가위(크리스퍼) 설명 영상 1개 보고 "좋은 점·걱정되는 점" 2개씩', '커리어넷에서 생명과학과·생명공학과 과목표 비교하기'] },
    med: { n: '의약·보건·간호', i: '🩺', core: ['미적분Ⅱ', '생명과학', '세포와 물질대사', '생물의 유전', '화학'], rec: ['기하', '화학 반응의 세계', '물질과 에너지', '확률과 통계'], note: '서울대 의대 기하·미적분Ⅱ + 생명과학 + 과학 진로선택 3과목 이상, 고려대 의대 미적분Ⅱ + 과학 진로선택 2과목 이상(2025.9 기준). 간호는 서울대 기하·미적분Ⅱ 중 1과목. 대학마다 달라 꼭 다시 확인.',
      m: ['병원에서 일하는 직업 10개 적고 면허가 필요한 것 표시하기', '건강 뉴스 1개를 골라 "근거가 뭐였는지" 찾아보기', '커리어넷에서 의예과·간호학과·약학과 과목표 비교하기'] },
    math: { n: '수학·통계·데이터', i: '📊', core: ['미적분Ⅱ', '기하', '확률과 통계'], rec: ['인공지능 수학', '경제 수학', '수학과제 탐구', '데이터 과학', '실용 통계'], note: '수학·통계 계열은 기하·미적분Ⅱ를 함께 지정하는 곳이 많아(2025.9 기준).',
      m: ['우리 반 급식 만족도 5문항 설문 만들기 (질문이 한쪽으로 쏠리지 않게)', '뉴스 그래프 1개에서 "축이 몇부터 시작하는지" 확인하기', '커리어넷에서 통계학과·수학과 과목표 비교하기'] },
    biz: { n: '경영·경제·금융', i: '💼', core: [], rec: ['경제', '확률과 통계', '경제 수학', '미적분Ⅱ', '사회와 문화', '금융과 경제생활'], note: '인문·상경 계열은 대부분 지정 과목이 없어. 경제학과는 수학을 깊게 쓰니 미적분Ⅱ·경제 수학이 도움 돼. 서울대는 인문계열에 제2외국어·한문 1과목 이상 권장.',
      m: ['같은 물건 3곳 가격 비교하고 왜 다른지 이유 3가지 적기', '좋아하는 브랜드 1개가 돈을 버는 방법 그림으로 그리기', '커리어넷에서 경영학과·경제학과 과목표 비교하기'] },
    soc: { n: '법·행정·정치·국제', i: '⚖️', core: [], rec: ['정치', '법과 사회', '사회와 문화', '국제 관계의 이해', '세계사', '제2외국어'], note: '대부분 지정 과목이 없어. 서울대 인문계열은 제2외국어·한문 1과목 이상 권장(2025.9 기준).',
      m: ['학교 규칙 1개를 골라 "왜 생겼을까" 찬반 근거 2개씩 적기', '국회·정부 보도자료 1개 읽고 3줄 요약하기', '커리어넷에서 법학·행정학과·정치외교학과 과목표 비교하기'] },
    hum: { n: '인문·언어·미디어', i: '📚', core: [], rec: ['문학', '주제 탐구 독서', '독서 토론과 글쓰기', '세계사', '제2외국어', '영어 발표와 토론', '매체 의사소통'], note: '대부분 지정 과목이 없어. 서울대 인문계열은 제2외국어·한문 1과목 이상 권장(2025.9 기준).',
      m: ['같은 사건을 다룬 기사 2개를 비교해 표현이 다른 곳 찾기', '좋아하는 영상 1편을 3장면으로 나눠 이야기 구조 적기', '커리어넷에서 국문·미디어커뮤니케이션학과 과목표 비교하기'] },
    art: { n: '디자인·콘텐츠', i: '🎨', core: [], rec: ['미술 창작', '미술과 매체', '문학과 영상', '매체 의사소통', '인공지능 기초', '창의 공학 설계'], note: '실기 전형은 학교마다 따로 준비해야 해. 과목보다 포트폴리오·실기 일정이 중요할 수 있어.',
      m: ['자주 쓰는 앱 화면 1개를 캡처해 불편한 점 2개와 고친 그림 그리기', 'AI 이미지 도구로 만든 그림과 내가 그린 그림의 차이 3줄 적기', '커리어넷에서 시각디자인·산업디자인학과 과목표 비교하기'] },
    edu: { n: '교육·심리·복지', i: '🤝', core: [], rec: ['사회와 문화', '교육의 이해', '인간과 심리', '확률과 통계', '생명과학', '윤리와 사상'], note: '대부분 지정 과목이 없어. 사범대는 가르칠 과목(예: 수학교육과는 수학 진로선택)이 중요할 수 있어.',
      m: ['친구에게 어려운 개념 1개를 3분 동안 설명해보고 막힌 곳 적기', '공부 습관 관련 연구 기사 1개 읽고 내 공부에 쓸 점 1개 고르기', '커리어넷에서 교육학과·심리학과·사회복지학과 과목표 비교하기'] },
    env: { n: '환경·지구·도시', i: '🌿', core: ['지구과학', '지구시스템과학'], rec: ['기후변화와 환경생태', '화학', '생명과학', '세계시민과 지리', '도시의 미래 탐구', '확률과 통계'], note: '서울대 천문학 전공은 지구과학 지정(2025.9 기준). 환경공학은 공대라 수학·화학이 중요할 수 있어.',
      m: ['우리 동네 한 달 기온 기록을 기상청 자료로 찾아 그래프 그리기', '집 전기요금 고지서에서 사용량 추이 3개월 비교하기', '커리어넷에서 환경공학과·지구환경과학과·도시공학과 과목표 비교하기'] }
  };
  var ORDER = ['cs', 'ee', 'me', 'chem', 'bio', 'med', 'math', 'env', 'biz', 'soc', 'hum', 'art', 'edu'];

  var SIG = window.FC_SIGNALS || [];

  function load() {
    var o = null; try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (x) {}
    o = o && typeof o === 'object' ? o : {};
    o.groups = Array.isArray(o.groups) ? o.groups.filter(function (g) { return G[g]; }).slice(0, 2) : [];
    o.picks = o.picks && typeof o.picks === 'object' ? o.picks : {};
    o.talk = o.talk && typeof o.talk === 'object' ? o.talk : {};
    o.done = o.done && typeof o.done === 'object' ? o.done : {};
    if (o.share === undefined) o.share = true;
    return o;
  }
  function put(o) { o.upd = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (x) {} }
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (x) { return null; } }
  function picked(o) { return Object.keys(o.picks).filter(function (c) { return o.picks[c]; }); }

  /* 흩어진 진로 결과 → 계열 신호 */
  var FROM_EX = { ai: ['cs', 'math'], robots: ['ee', 'me'], health: ['med', 'bio'], energy: ['chem', 'env'], security: ['cs'], creative: ['art', 'hum'], business: ['biz'], education: ['edu'], city: ['env', 'me'], food: ['bio', 'chem'] };
  var FROM_FU = { ai: ['cs'], data: ['math'], med: ['med'], bio: ['bio'], mech: ['me', 'ee'], env: ['env', 'chem'], biz: ['biz'], design: ['art'], edu: ['edu'], law: ['soc'] };
  var KM_MAP = { ai: ['I', 'C'], robots: ['R', 'I'], health: ['I', 'S'], energy: ['R', 'I'], security: ['I', 'C'], creative: ['A', 'E'], business: ['E', 'C'], education: ['S', 'A'], city: ['R', 'E'], food: ['R', 'I'] };
  function knowMeTop() {
    var s = J('compass-know-me-v1'); if (!s || !Array.isArray(s.answers)) return [];
    var ax = 'RIASEC', sum = {}, cnt = {};
    s.answers.forEach(function (v, i) { if (typeof v !== 'number' || v < 1 || v > 5) return; var a = ax[i % 6]; sum[a] = (sum[a] || 0) + v; cnt[a] = (cnt[a] || 0) + 1; });
    if (!ax.split('').every(function (a) { return cnt[a] >= 3; })) return [];
    var mean = function (a) { return sum[a] / cnt[a]; };
    return Object.keys(KM_MAP).map(function (d) { return { d: d, s: (mean(KM_MAP[d][0]) + mean(KM_MAP[d][1])) / 2 }; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3).map(function (x) { return x.d; });
  }
  function signals() {
    var sc = {}, why = {};
    function add(list, src, w) { (list || []).forEach(function (g) { sc[g] = (sc[g] || 0) + w; (why[g] = why[g] || []).indexOf(src) < 0 && why[g].push(src); }); }
    knowMeTop().forEach(function (d) { add(FROM_EX[d], '나 알아보기', 1); });
    var lab = J('compass-career-lab'); (lab && Array.isArray(lab.topics) ? lab.topics : []).forEach(function (d) { add(FROM_EX[d], '관심 탐색기', 2); });
    var pl = J('fc_plan'); if (pl) { add(FROM_FU[pl.f1], '미래 예측 계획', 2); if (pl.f2 && pl.f2 !== 'none') add(FROM_FU[pl.f2], '미래 예측 계획', 1); }
    return Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a] || ORDER.indexOf(a) - ORDER.indexOf(b); }).slice(0, 3).map(function (g) { return { g: g, why: why[g] }; });
  }

  /* 학교 진로 행사 (school.json) */
  var school = null;
  fetch('school.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) { school = s; if (tab === 'path') render(); }).catch(function () {});
  function careerEvent() {
    var ev = (school && school.schedule || []).filter(function (x) { return x && /진로/.test(x.title || '') && x.date && dgap(x.date) >= -3 && dgap(x.date) <= 14; });
    return ev.sort(function (a, b) { return a.date.localeCompare(b.date); })[0] || null;
  }
  function sugang() { return state.dates.find(function (x) { return x.id === TASK_ID; }) || null; }

  function chip(c, o, ro, core) {
    var on = !!o.picks[c], t = TYPE[c] || '';
    return '<button type="button" class="cp-c' + (on ? ' on' : '') + (core ? ' core' : '') + '" data-cp-pick="' + e(c) + '" aria-pressed="' + on + '"' + (ro ? ' disabled' : '') + '>' + (on ? '✓ ' : '') + e(c) + (t ? '<small>' + t + '</small>' : '') + (SUNEUNG[c] ? '<small class="sn">수능</small>' : '') + '</button>';
  }
  function jo(w, a, b) { var ch = w.charAt(w.length - 1); if (ch === 'Ⅰ') return a; if (ch === 'Ⅱ') return b; var k = ch.charCodeAt(0) - 0xAC00; return k >= 0 && k <= 11171 && k % 28 ? a : b; }
  function checks(o) {
    var p = picked(o), out = [];
    p.forEach(function (c) { var b = BEFORE[c]; if (b && !o.picks[b]) out.push('<b>' + e(c) + '</b>' + jo(c, '은', '는') + ' <b>' + e(b) + '</b>' + jo(b, '을', '를') + ' 먼저(또는 같이) 들으면 이해가 쉬워.'); });
    var sci = o.groups.some(function (g) { return ['cs', 'ee', 'me', 'chem', 'math', 'med'].indexOf(g) >= 0; });
    if (sci && !(o.picks['미적분Ⅱ'] || o.picks['기하'])) out.push('이공·의약 계열인데 <b>미적분Ⅱ·기하</b>가 없어. 주요대 상당수가 지정해서 한 번 더 생각해봐.');
    if (o.groups.some(function (g) { return ['biz', 'soc', 'hum'].indexOf(g) >= 0; }) && !o.picks['제2외국어']) out.push('서울대 인문계열은 <b>제2외국어·한문</b> 1과목 이상을 권장해. 목표 대학에 따라 확인해봐.');
    return out;
  }

  function childView(o) {
    var s = sugang(), ev = careerEvent(), sig = signals(), p = picked(o), h = '';
    h += '<section class="card cp-now"><p class="cp-eye">지금 시기 · 고1 2학기</p><h2>고2 과목을 고르는 때야</h2><p>2학년 개설 과목은 지금 학년의 수요조사로 정해져. 학교에서 신청 안내를 받으면 마감일을 넣어줘. 시험·과제에 D-day로 뜨고 엄마 화면에도 보여.</p>' +
      '<label class="cp-date"><span>과목 신청 마감일</span><input type="date" data-cp-date value="' + (s ? e(s.date) : '') + '"' + (isParent() ? ' disabled' : '') + '></label>' +
      (s ? '<p class="cp-dd">' + (dgap(s.date) >= 0 ? 'D-' + dgap(s.date) : '지남') + ' · ' + md(s.date) + '</p>' : '<p class="muted small">날짜는 학교 공지·담임 선생님 안내가 기준이야.</p>') + '</section>';
    if (ev) {
      var g0 = dgap(ev.date), key = ev.date, tv = o.talk[key] || '';
      h += '<section class="card cp-talk"><h2>🎤 ' + e(ev.title) + ' <small>' + (g0 > 0 ? 'D-' + g0 : g0 === 0 ? '오늘' : '끝남') + ' · ' + md(ev.date) + '</small></h2><p class="muted small">' + (g0 >= 0 ? '물어보고 싶은 것 2개만 적어 가자. 듣고 나서 기억나는 것 3줄 적으면 끝.' : '들은 것 중 기억나는 것 3줄만 남겨두자.') + '</p><textarea data-cp-talk="' + e(key) + '" maxlength="400" rows="3" placeholder="' + (g0 >= 0 ? '예) 그 일을 하려면 고등학교 때 뭘 해두면 좋아요?' : '예) AI를 써도 사람이 확인하는 일은 남는다고 했다') + '"' + (isParent() ? ' disabled' : '') + '>' + e(tv) + '</textarea></section>';
    }
    h += '<section class="card"><h2>🧭 희망 계열 <small>최대 2개</small></h2>';
    if (sig.length) h += '<p class="cp-sig">지금까지 고른 것으로 보면: ' + sig.map(function (x) { return '<b>' + G[x.g].i + ' ' + e(G[x.g].n) + '</b><small>(' + e(x.why.join('·')) + ')</small>'; }).join(' ') + '</p>';
    else h += '<p class="muted small">아직 진로 질문을 안 했어도 괜찮아. 궁금한 계열을 골라보고 바꿔도 돼. <a href="know-me.html">✨ 나 알아보기</a></p>';
    h += '<div class="cp-groups" role="group" aria-label="희망 계열">' + ORDER.map(function (g) { var on = o.groups.indexOf(g) >= 0; return '<button type="button" data-cp-group="' + g + '" aria-pressed="' + on + '" class="' + (on ? 'on' : '') + '">' + G[g].i + ' ' + e(G[g].n) + '</button>'; }).join('') + '</div><p class="muted small">적성 검사나 합격 예측이 아니야. 지금 궁금한 쪽을 고르는 거야.</p></section>';
    if (o.groups.length) {
      h += '<section class="card"><h2>📚 고2 과목 후보 담기</h2><p class="muted small">눌러서 바구니에 담아. <b class="cp-k">진하게</b> = 주요대가 많이 지정했거나 순서상 필요한 과목.</p>';
      h += '<p class="cp-base">모두 공통: <b>대수 · 미적분Ⅰ · 확률과 통계</b>는 2029 수능 수학 범위라 대부분 학교에서 들어.</p>';
      o.groups.forEach(function (g) {
        var x = G[g];
        h += '<div class="cp-g"><h3>' + x.i + ' ' + e(x.n) + '</h3><div class="cp-chips">' + x.core.map(function (c) { return chip(c, o, isParent(), 1); }).join('') + x.rec.map(function (c) { return chip(c, o, isParent(), 0); }).join('') + '</div><p class="cp-note">' + e(x.note) + '</p></div>';
      });
      h += '</section>';
    }
    var ck = checks(o);
    h += '<section class="card cp-bag"><h2>🧺 내 후보 바구니 <small>' + p.length + '개</small></h2>' + (p.length ? '<ul>' + ['일반', '진로', '융합'].map(function (t) { var l = p.filter(function (c) { return TYPE[c] === t; }); return l.length ? '<li><span>' + t + '선택</span>' + l.map(e).join(' · ') + '</li>' : ''; }).join('') + (p.some(function (c) { return !TYPE[c]; }) ? '<li><span>기타</span>' + p.filter(function (c) { return !TYPE[c]; }).map(e).join(' · ') + '</li>' : '') + '</ul>' : '<p class="muted small">아직 비어 있어.</p>') +
      (ck.length ? '<div class="cp-warn"><b>순서 점검</b><ul>' + ck.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' : '') +
      '<details class="cp-ask"><summary>선생님·엄마랑 이야기할 것</summary><ol><li>우리 학교 2학년에 이 과목이 열리는지, 안 열리면 공동교육과정·온라인학교로 들을 수 있는지</li><li>과목을 많이 담았을 때 2학년 공부 시간이 버틸 만한지</li><li>목표 대학이 생기면 그 대학 「전공 연계 과목 안내」 다시 확인 (어디가·대학 입학처)</li></ol></details>' +
      (isParent() ? '' : '<label class="cp-share"><input type="checkbox" data-cp-share' + (o.share ? ' checked' : '') + '> 엄마 화면에 희망 계열·과목 후보 보여주기</label>') + '</section>';
    if (o.mom && o.mom.t) h += '<section class="card cp-momnote"><h2>💜 엄마 생각</h2><p>' + e(o.mom.t) + '</p></section>';
    var gs = o.groups.length ? o.groups : sig.map(function (x) { return x.g; }).slice(0, 1);
    if (gs.length && !isParent()) {
      var ms = []; gs.forEach(function (g) { G[g].m.forEach(function (m) { ms.push(m); }); });
      h += '<section class="card"><h2>⏱ 이번 달 30분 진로 미션</h2><p class="muted small">시험 기간엔 쉬어도 돼. 하나만 해도 충분해.</p><ul class="cp-ms">' + ms.slice(0, 4).map(function (m) { var d = o.done[m]; return '<li class="' + (d ? 'dn' : '') + '"><span>' + e(m) + '</span>' + (d ? '<small>✓ ' + md(d) + '</small>' : '<button type="button" data-cp-task="' + e(m) + '">오늘 할 일로</button>') + '</li>'; }).join('') + '</ul></section>';
    }
    h += sigCard();
    h += '<section class="card cp-links"><a href="know-me.html">✨ 나 알아보기</a><a href="./#career-lab">🧭 관심 탐색기</a><a href="future.html">🔮 미래 예측</a></section>';
    return h;
  }
  function sigCard() {
    return '<details class="card cp-sigs"><summary><b>📡 미래 신호판</b><small>2025~2026 새로 나온 공식 발표·연구 ' + SIG.length + '개</small></summary><ul>' + SIG.map(function (x) { return '<li><p class="cp-sd">' + e(x.d) + '</p><div><b>' + e(x.t) + '</b><p>' + e(x.f) + '</p><p class="cp-so">→ ' + e(x.so) + '</p><a href="' + e(x.u) + '" target="_blank" rel="noopener noreferrer">' + e(x.src) + '</a></div></li>'; }).join('') + '</ul><p class="muted small">숫자는 출처 기사·보고서 그대로야. 미래는 예측이 아니라 가능성이니까 새 자료가 나오면 다시 확인해. 다음 큰 자료: 2028년 3월 평가원 2029 수능 시행 기본계획.</p></details>';
  }
  function parentView(o) {
    var s = sugang(), p = picked(o), h = '<section class="card cp-now"><p class="cp-eye">지금 시기 · 고1 2학기</p><h2>승준이가 고2 과목을 고르는 때예요</h2><p>2학년 개설 과목은 1학년 수요조사로 정해져요. 과목 선택은 대학 지원 자격은 아니지만, 주요대가 전공 연계 과목을 서류 평가에 반영해요.</p>' +
      (s ? '<p class="cp-dd">과목 신청 마감 ' + (dgap(s.date) >= 0 ? 'D-' + dgap(s.date) : '지남') + ' · ' + md(s.date) + '</p>' : '<p class="muted small">마감일은 승준이가 학교 안내를 받으면 넣어요.</p>') + '</section>';
    if (o.share) {
      h += '<section class="card"><h2>🧭 승준이가 고른 희망 계열</h2>' + (o.groups.length ? '<p class="cp-pg">' + o.groups.map(function (g) { return G[g].i + ' ' + e(G[g].n); }).join(' · ') + '</p>' : '<p class="muted">아직 고르지 않았어요.</p>') +
        '<h3 class="cp-h3">🧺 과목 후보 ' + p.length + '개</h3>' + (p.length ? '<p>' + p.map(e).join(' · ') + '</p>' : '<p class="muted small">아직 비어 있어요.</p>') +
        (checks(o).length ? '<div class="cp-warn"><b>순서 점검</b><ul>' + checks(o).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' : '') + '</section>';
    } else h += '<section class="card"><p>승준이가 희망 계열·과목 후보는 아직 혼자 보고 있어요. 이야기 나눌 때 물어봐 주세요.</p></section>';
    h += '<section class="card"><h2>💜 엄마 생각 한 줄</h2><p class="muted small">결정을 대신하기보다 질문 하나를 남겨주세요. 승준이 진로 화면에 보여요.</p><textarea data-cp-mom maxlength="300" rows="3" placeholder="예) 과목 많이 담아도 2학년 시간 괜찮을지 같이 계산해보자">' + e(o.mom && o.mom.t || '') + '</textarea></section>';
    h += '<section class="card cp-ask2"><h2>🗣 대화할 때 도움 되는 질문</h2><ol><li>"요즘 수업 중에 시간 가는 줄 몰랐던 때가 언제야?"</li><li>"그 과목을 고르면 2학년 일주일이 어떻게 될 것 같아?"</li><li>"아직 모르겠으면 문을 넓게 열어두는 과목(수학·과학 일반선택)부터 담자"</li></ol></section>';
    h += sigCard();
    return h;
  }

  /* 엄마 오늘 화면 한 줄 */
  function momLine() {
    var o = load(), s = sugang(), bits = [];
    if (s && dgap(s.date) >= 0 && dgap(s.date) <= 30) bits.push('과목 신청 D-' + dgap(s.date));
    if (o.share && o.groups.length) bits.push(o.groups.map(function (g) { return G[g].n; }).join('·'));
    if (o.share && picked(o).length) bits.push('후보 ' + picked(o).length + '과목');
    if (!bits.length) return '';
    return '<button type="button" class="cp-mom" data-go="path"><span>🎯 승준 진로</span><b>' + e(bits.join(' · ')) + '</b><i aria-hidden="true">›</i></button>';
  }

  if (location.hash === '#path') tab = 'path';
  var prev = render;
  render = function () {
    prev();
    var root = document.getElementById('content'); if (!root) return;
    if (tab === 'path') {
      var o = load();
      root.innerHTML = '<div class="cp-wrap">' + (isParent() ? parentView(o) : childView(o)) + '</div>';
      document.querySelectorAll('nav.tabbar button').forEach(function (b) { b.classList.remove('active'); });
      return;
    }
    if (tab === 'today' && isParent() && !root.querySelector('.cp-mom')) {
      var ml = momLine(); if (!ml) return;
      var a = root.querySelector('.ms-row') || root.querySelector('.pv-head') || root.firstElementChild;
      if (a) a.insertAdjacentHTML('afterend', ml); else root.insertAdjacentHTML('afterbegin', ml);
    }
  };

  document.addEventListener('click', function (ev) {
    if (tab !== 'path' || isParent()) return;
    var b = ev.target.closest('button'); if (!b) return;
    var o = load();
    if (b.dataset.cpGroup) {
      var g = b.dataset.cpGroup, i = o.groups.indexOf(g);
      if (i >= 0) o.groups.splice(i, 1); else { o.groups.push(g); if (o.groups.length > 2) o.groups.shift(); }
      put(o); render(); return;
    }
    if (b.dataset.cpPick) { var c = b.dataset.cpPick; o.picks[c] = o.picks[c] ? 0 : 1; put(o); var y = window.scrollY; render(); window.scrollTo(0, y); return; }
    if (b.dataset.cpTask) {
      var m = b.dataset.cpTask, t = '🎯 ' + m;
      if (!state.tasks.some(function (x) { return x.date === today() && x.title === t; })) { state.tasks.push({ id: uid(), title: t.slice(0, 120), date: today(), done: false, kind: '과제', subject: '', note: '' }); save(); }
      o.done[m] = today(); put(o); render();
      if (typeof notice === 'function') notice('오늘 할 일에 넣었어. 30분이면 충분해.');
    }
  });
  document.addEventListener('change', function (ev) {
    if (tab !== 'path') return;
    var t = ev.target, o;
    if (t.matches('[data-cp-date]') && !isParent()) {
      var s = sugang(), v = t.value;
      if (!v) { if (s) state.dates = state.dates.filter(function (x) { return x.id !== TASK_ID; }); }
      else if (s) s.date = v;
      else state.dates.push({ id: TASK_ID, title: '고2 선택과목 신청 마감', subject: '', kind: '진로', date: v, done: false, note: '희망 계열·후보 과목은 🎯 진로에서' });
      save(); render(); if (typeof notice === 'function' && v) notice('시험·과제에 D-day로 넣었어.');
    }
    if (t.matches('[data-cp-share]')) { o = load(); o.share = t.checked; put(o); }
  });
  var tmr = 0;
  document.addEventListener('input', function (ev) {
    if (tab !== 'path') return;
    var t = ev.target;
    if (!t.matches('[data-cp-talk],[data-cp-mom]')) return;
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      var o = load();
      if (t.dataset.cpTalk && !isParent()) o.talk[t.dataset.cpTalk] = t.value.slice(0, 400);
      if (t.hasAttribute('data-cp-mom') && isParent()) o.mom = { t: t.value.slice(0, 300), at: Date.now() };
      put(o);
    }, 500);
  });

  window.FC_PATH = { load: load, groups: G, signals: SIG, momLine: momLine, type: TYPE, before: BEFORE, suneung: SUNEUNG };

  var css = document.createElement('style');
  css.textContent = '.cp-wrap h2 small{font-size:12.5px;font-weight:600;color:#6b6880;margin-left:4px}.cp-eye{margin:0 0 2px;font-size:12.5px;font-weight:700;color:#5b45d6;letter-spacing:.02em}' +
    '.cp-now{background:linear-gradient(135deg,#f1edff,#fff6e6)}.cp-now h2{margin:0 0 6px}.cp-now p{margin:0 0 10px;font-size:14.5px;color:#3b3758}.cp-date{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-weight:700;font-size:14px;color:#2a2550}.cp-date input{min-height:44px;padding:6px 10px;border-radius:12px;border:1.5px solid #d9d3f5;background:#fff;font:inherit}.cp-dd{margin:8px 0 0!important;font-size:18px!important;font-weight:800;color:#5b45d6!important}' +
    '.cp-talk textarea,.cp-wrap textarea{width:100%;box-sizing:border-box;border:1.5px solid #e1dcf5;border-radius:12px;padding:10px 12px;font:inherit;font-size:15px;resize:vertical;background:#fff}' +
    '.cp-sig{font-size:14px;line-height:1.7;margin:4px 0 10px}.cp-sig b{display:inline-block;margin-right:2px}.cp-sig small{color:#6b6880;margin-right:8px}' +
    '.cp-groups{display:flex;flex-wrap:wrap;gap:8px}.cp-groups button{min-height:40px!important;padding:6px 12px!important;border-radius:999px!important;border:1.5px solid #ddd7f3!important;background:#fff!important;color:#2a2550!important;font-size:14px;font-weight:600}.cp-groups button.on{background:#5b45d6!important;border-color:#5b45d6!important;color:#fff!important}' +
    '.cp-base{font-size:13.5px;background:#f5f3ff;border-radius:12px;padding:8px 12px;margin:6px 0 12px;color:#3b3758}.cp-g{margin:0 0 14px}.cp-g h3{font-size:15px;margin:0 0 8px;color:#2a2550}.cp-chips{display:flex;flex-wrap:wrap;gap:7px}' +
    '.cp-c{min-height:40px!important;padding:6px 11px!important;border-radius:12px!important;border:1.5px solid #e1dcf5!important;background:#fff!important;color:#3b3758!important;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:5px}.cp-c.core{font-weight:800;color:#2a2550!important;border-color:#bfb3f2!important}.cp-c small{font-size:12px;font-weight:700;color:#57546a;background:#efedf5;border-radius:6px;padding:1px 5px}.cp-c small.sn{background:#fff1d6;color:#7a4b00}.cp-c.on{background:#ece8fc!important;border-color:#5b45d6!important;color:#3a22b8!important}.cp-c[disabled]{opacity:1;cursor:default}' +
    '.cp-k{color:#2a2550}.cp-note{font-size:12.5px;color:#57546a;margin:8px 0 0;line-height:1.55}' +
    '.cp-bag ul{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:6px}.cp-bag li{font-size:14.5px;line-height:1.55}.cp-bag li span{display:inline-block;min-width:64px;font-size:12px;font-weight:800;color:#5b45d6}' +
    '.cp-warn{margin:12px 0 0;padding:10px 12px;border-radius:12px;background:#fff6e6;border:1px solid #f3dcae;font-size:13.5px;color:#4a3500}.cp-warn ul{margin:4px 0 0;padding-left:18px;display:block}.cp-warn li{font-size:13.5px}' +
    '.cp-ask{margin-top:12px}.cp-ask summary{cursor:pointer;font-weight:700;font-size:14px;min-height:40px;display:flex;align-items:center;color:#2a2550}.cp-ask ol{margin:4px 0 0;padding-left:20px;font-size:14px;line-height:1.6}.cp-ask2 ol{margin:4px 0 0;padding-left:20px;font-size:14.5px;line-height:1.7}.cp-share{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:14px;min-height:40px}.cp-share input{width:22px;height:22px}' +
    '.cp-momnote{background:#faf5ff}.cp-momnote p{margin:4px 0 0;font-size:15px}' +
    '.cp-ms{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.cp-ms li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:#f7f6fb;font-size:14px;line-height:1.5}.cp-ms li span{flex:1;min-width:0}.cp-ms li.dn span{color:#6b6880}.cp-ms button{flex:none;min-height:38px!important;padding:4px 12px!important;border-radius:999px!important;font-size:13px}.cp-ms small{flex:none;font-weight:700;color:#187a5c}' +
    '.cp-sigs>summary{list-style:none;cursor:pointer;display:flex;flex-direction:column;gap:2px;min-height:44px;justify-content:center}.cp-sigs>summary::-webkit-details-marker{display:none}.cp-sigs>summary b{font-size:16px;color:#2a2550}.cp-sigs>summary small{font-size:12.5px;color:#6b6880}.cp-sigs ul{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:12px}.cp-sigs li{display:grid;grid-template-columns:58px 1fr;gap:8px}.cp-sd{margin:2px 0 0;font-size:12.5px;font-weight:800;color:#5b45d6;font-variant-numeric:tabular-nums}.cp-sigs li b{font-size:14.5px}.cp-sigs li p{margin:2px 0;font-size:13.5px;line-height:1.55;color:#3b3758}.cp-sigs .cp-so{color:#2a2550;font-weight:600}.cp-sigs a{font-size:12.5px;color:#4b36c4;text-decoration:underline}' +
    '.cp-links{display:flex;flex-wrap:wrap;gap:8px}.cp-links a{flex:1 1 30%;min-width:96px;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#f5f3ff;color:#3a22b8;font-weight:700;font-size:14px;text-decoration:none}' +
    '.cp-pg{font-size:16px;font-weight:700;margin:4px 0 8px}.cp-h3{font-size:14px;margin:10px 0 4px}' +
    '.cp-mom{display:flex!important;align-items:center;gap:10px;width:100%;min-height:52px!important;margin:0 0 12px;padding:10px 14px!important;border-radius:16px!important;border:0!important;background:#f1edff!important;color:#2a2550!important;text-align:left;font-size:14px}.cp-mom span{flex:none;font-weight:700}.cp-mom b{flex:1;min-width:0;font-weight:600;color:#3b3758;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cp-mom i{font-style:normal;color:#5b45d6;font-size:20px}';
  document.head.appendChild(css);
  render();
})();
