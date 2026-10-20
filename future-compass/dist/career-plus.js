/* 🎯 진로 한 장 보완 (2026-10-16 진로·AI·미래 전문가 리뷰 반영) — career-path.js 바로 뒤에 로드
   1) 🚪 열린 문: 바구니 과목으로 13개 계열 중 어디까지 문이 열려 있는지 (계열을 못 정해도 안심)
   2) 🔬 탐구 노트: 지금 배우는 고1 과목 × 희망 계열 탐구 질문 → 수행평가·발표 주제 제안용 기록
   3) 🤖 AI와 일하기: 계열별 AI가 돕는 일 / 사람이 맡는 일 / 지금 연습 + 공통 원칙
   4) 🔭 10년 뒤 이 계열: 공식 신호판 근거 + 추정 표시, 불확실한 점
   5) 🧪 해본 미션 돌아보기: 재미·다시 할 마음 → 계열 신호
   6) 📈 진로 변화 기록: 희망 계열 바뀐 날짜와 이유 한 줄 (면접·상담 때 설명 재료)
   저장: fc_path_v1 안의 notes/fb/hist (가족 동기화 그대로). 적성 판정·합격 예측이 아니다. */
(function () {
  'use strict';
  if (typeof render !== 'function' || !window.FC_PATH) return;
  var KEY = 'fc_path_v1', G = window.FC_PATH.groups, SIG = window.FC_SIGNALS || [];
  var ORDER = ['cs', 'ee', 'me', 'chem', 'bio', 'med', 'math', 'env', 'biz', 'soc', 'hum', 'art', 'edu'];
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function td() { return typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10); }
  function md(d) { return Number(d.slice(5, 7)) + '/' + Number(d.slice(8, 10)); }
  function load() { var o = window.FC_PATH.load(); o.notes = Array.isArray(o.notes) ? o.notes : []; o.fb = o.fb && typeof o.fb === 'object' ? o.fb : {}; o.hist = Array.isArray(o.hist) ? o.hist : []; return o; }
  function put(o) { o.upd = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (x) {} }
  function nid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* sg = 미래 신호판(FC_SIGNALS) 번호: 0 수능, 1 인력 수급, 2 신입 업무, 3 원인 여러 개, 4 미국, 5 바뀌는 능력 */
  var X = {
    cs: { ai: ['코드 초안·오류 찾기·문서 정리'], hu: ['무엇을 만들지 정하기', '결과가 맞는지 테스트로 검증', '보안·책임 판단'], pr: 'AI가 짠 코드에 한 줄씩 내 말로 설명 달고, 틀릴 만한 입력 3개로 시험해보기',
      fu: 'AI 도구로 개발 속도는 빨라지고, 신입이 하던 단순 코딩은 줄어드는 신호가 있어. 문제를 정의하고 검증하는 사람, 의료·금융 같은 다른 분야를 같이 아는 개발자가 유리할 전망이야(추정).', un: '자동화 속도가 회사·분야마다 달라. 몇 년 안에 다시 확인해야 해.', sg: [2, 4, 5],
      q: [['통합과학2', '센서 데이터를 컴퓨터는 어떻게 "판단"할까? 교실 온도 기록으로 에어컨 켜는 규칙 만들어보기'], ['공통수학2', '함수의 "입력→출력"과 프로그램의 입력→출력은 뭐가 같고 뭐가 다를까?']] },
    ee: { ai: ['회로 시뮬레이션', '측정 데이터 정리', '설계 자료 검색'], hu: ['실제 부품·공정 문제 해결', '안전 판단', '설계 결정'], pr: '측정값을 표로 정리하고 값이 매번 다른 이유(오차)를 설명해보기',
      fu: 'AI 반도체와 데이터센터 전력 수요가 커지는 흐름이라 반도체·전력 인력 수요는 이어질 전망이야(추정). 경기 따라 출렁임이 큰 산업이라, 전자기·회로 같은 기초가 오래 쓰여.', un: '반도체 경기는 몇 년 단위로 오르내려. 특정 회사·직무 하나에 기대지 않는 게 좋아.', sg: [1, 5],
      q: [['통합과학2', '전기 에너지는 어떻게 만들어져서 우리 집까지 올까? 발전 방식 2개의 장단점 비교'], ['공통수학2', '휴대폰 배터리 %가 줄어드는 모양을 그래프로 그리면 직선일까?']] },
    me: { ai: ['도면 초안', '시뮬레이션', '부품 검색'], hu: ['현장 조립·고장 원인 판단', '사람과 기계가 함께 일할 때 안전'], pr: '집에 있는 물건 하나를 관찰해서 힘이 어디로 전달되는지 그림으로 설명하기',
      fu: '로봇·자율주행은 공장·물류부터 들어오고 있어. 사람 옆에서 일하는 로봇을 설계·관리하는 역할이 늘 전망이야(추정).', un: '실제 확산 속도는 가격·안전 규제·사고 책임 문제에 달려 있어.', sg: [1, 5],
      q: [['통합과학2', '자동차 브레이크는 운동 에너지를 어디로 보낼까? 전기차 회생제동과 비교'], ['공통수학2', '로봇 팔이 닿는 범위를 원의 방정식으로 표현할 수 있을까?']] },
    chem: { ai: ['물질 후보 검색', '실험 데이터 정리', '논문 요약'], hu: ['실험 설계·안전 관리', '결과 해석과 재현 확인'], pr: '부엌에서 본 화학 반응 1개를 관찰 기록(조건·변화·이유)으로 남기기',
      fu: '배터리·탄소중립 소재가 중요해지면서 화학·소재 연구 수요는 이어질 전망이야(추정). AI가 신소재 후보를 빨리 찾아줄수록, 실험으로 확인하는 사람이 더 중요해져.', un: '에너지 정책·국제 경쟁에 따라 투자 규모가 바뀔 수 있어.', sg: [5],
      q: [['통합과학2', '산화·환원은 배터리 안에서 어떻게 일어날까? 충전과 방전을 그림으로'], ['통합과학2', '탄소중립을 위해 우리 집 물건 하나를 바꾼다면? 그 소재와 대체 소재 찾기']] },
    bio: { ai: ['유전체·단백질 구조 분석', '논문 요약'], hu: ['실험·연구 윤리 판단', '결과가 무슨 뜻인지 해석'], pr: 'AI 요약과 원문(기사·자료)을 비교해서 빠지거나 틀린 곳 찾기',
      fu: 'AI가 단백질 구조 예측 같은 분석을 빠르게 해줘서 바이오 연구 방식이 바뀌는 중이야. 생명과학과 데이터를 같이 다루는 사람이 유리할 전망이야(추정).', un: '연구직은 대학원까지 가는 경우가 많아. 공부 기간을 미리 알아두면 좋아.', sg: [5],
      q: [['통합과학2', '같은 음식을 먹어도 사람마다 몸 반응이 다른 이유는?'], ['통합사회2', '유전자 정보는 누가 볼 수 있어야 할까? 찬반 근거 2개씩']] },
    med: { ai: ['영상 판독 보조', '진료 기록 정리', '자료 검색'], hu: ['환자와 대화', '최종 진단과 책임', '돌봄'], pr: '건강 뉴스 1개를 골라 "근거가 된 연구가 뭐였는지" 끝까지 찾아보기',
      fu: '고령화로 돌봄·보건 인력이 더 필요해질 전망이야(고용정보원 인력수급 전망). AI는 판독·기록을 돕지만 면허와 책임은 사람에게 남아.', un: '의대 정원 같은 제도가 해마다 바뀔 수 있어. 지원할 해의 발표로 다시 확인해야 해.', sg: [1],
      q: [['통합과학2', '백신은 우리 몸의 어떤 반응을 이용할까?'], ['통합사회2', '동네마다 큰 병원까지 가는 시간이 다른 이유는?']] },
    math: { ai: ['계산', '코드로 분석', '그래프 그리기'], hu: ['어떤 질문을 할지 정하기', '데이터를 믿을 수 있는지 판단', '결과를 사람에게 설명'], pr: '뉴스 그래프 1개에서 축 시작점·표본 수 같은 함정 찾기',
      fu: '데이터는 거의 모든 분야에 쓰여서 통계·수학 기초는 오래 쓰이는 능력이야. 분석 자체는 AI가 빨라지니까, 결과를 검증하고 설명하는 힘이 더 중요해질 전망이야(추정).', un: '"데이터 분석가"라는 직무 이름은 바뀔 수 있어. 대신 수학·통계 기초는 어디로든 옮겨 가.', sg: [5],
      q: [['공통수학2', '급식 남은 양을 일주일 기록하면, 무엇이 남는 양을 바꿀까?'], ['통합사회2', '여론조사 결과가 조사마다 다른 이유는?']] },
    biz: { ai: ['보고서 초안', '자료 정리', '간단한 분석'], hu: ['사람 설득·협상', '책임 있는 결정', '고객 마음 읽기'], pr: '좋아하는 브랜드 1개가 돈 버는 구조를 그림 한 장으로 그리기',
      fu: 'AI가 자료 정리·보고서 초안을 대신하면서 신입 사무 업무가 바뀌는 신호가 있어. 데이터를 이해하면서 사람도 설득할 수 있는 사람이 유리할 전망이야(추정).', un: '청년 고용 감소에는 인구 감소 같은 다른 원인도 있어. AI 하나로만 보면 안 돼.', sg: [2, 3],
      q: [['통합사회2', '같은 물건 가격이 가게마다 다른 이유를 시장 구조로 설명하기'], ['공통수학2', '30% 할인 뒤 20% 추가 할인은 50% 할인과 같을까?']] },
    soc: { ai: ['판례·법령 검색', '문서 초안'], hu: ['사람 사정 듣기', '가치 판단', '책임지는 결정'], pr: '학교 규칙 1개를 골라 찬반 근거를 2개씩 적고, 내 결론 한 줄 쓰기',
      fu: 'AI가 판례 검색·문서 작성을 빠르게 해주고 있어. AI를 어떤 규칙으로 다룰지(AI 법·개인정보·저작권) 자체가 새 일거리가 되는 중이야(추정).', un: '법조·공무원은 시험·제도 변화의 영향을 많이 받아. 매년 공식 공고를 확인해.', sg: [2],
      q: [['통합사회2', 'AI가 만든 그림의 저작권은 누구에게 있어야 할까?'], ['한국사2', '지금 헌법의 기본권 하나가 생긴 역사적 배경 찾기']] },
    hum: { ai: ['번역', '요약', '글 초안'], hu: ['맥락 이해', '무엇이 좋은 글인지 판단', '문화 차이 읽기'], pr: '같은 사건을 다룬 기사 2개에서 단어 선택이 다른 곳 찾기',
      fu: '번역·요약은 AI가 잘하지만, 무엇을 왜 말할지 정하고 사람 마음을 움직이는 기획은 계속 사람 몫으로 남을 가능성이 커(추정). 언어에 기술·법·의료 같은 다른 분야를 더하면 강해.', un: '단순 번역·편집 일은 줄 수 있어. 전공 하나 더(복수전공) 계획도 같이 생각해.', sg: [2, 5],
      q: [['공통국어2', 'AI 번역과 사람 번역이 가장 다르게 나온 문장 1개 찾고 이유 설명하기'], ['한국사2', '같은 사건을 다르게 기록한 두 자료 비교하기']] },
    art: { ai: ['이미지 초안·변형', '반복 작업'], hu: ['콘셉트·취향 판단', '사용자 경험 이해', '저작권 판단'], pr: '자주 쓰는 앱 화면에서 불편한 점 2개 찾고 고친 그림 그리기',
      fu: 'AI 이미지 도구로 초안 만드는 시간이 크게 줄었어. 무엇을 만들지 정하는 기획·취향·사용자 이해가 더 중요해질 전망이야(추정).', un: '실기·포트폴리오 전형은 학교마다 달라. 일정과 요구 작품 수를 일찍 확인해.', sg: [5],
      q: [['공통국어2', '광고 문구 하나가 사람 마음을 움직이는 이유 분석하기'], ['통합사회2', 'AI 그림을 공모전에 내도 될까? 실제 공모전 규칙 찾아보기']] },
    edu: { ai: ['문제 만들기', '채점 보조', '자료 정리'], hu: ['학생 마음 읽기', '관계 맺기', '동기 부여'], pr: '친구에게 어려운 개념 1개를 3분 동안 설명하고, 막힌 곳 적기',
      fu: '학생 수는 줄지만 돌봄·상담·평생교육 수요는 늘 전망이야(고용정보원 인력수급 전망, 일부 추정). AI 튜터가 늘수록 사람과 관계 맺는 역할이 핵심이 돼.', un: '교사 임용은 학생 수 감소로 자리가 줄 수 있어. 교육 관련 다른 길도 같이 봐.', sg: [1],
      q: [['통합사회2', '저출생이 우리 동네 학교에 어떤 변화를 줄까?'], ['공통국어2', '어려운 개념 하나를 초등학생에게 설명하는 글 써보기']] },
    env: { ai: ['기후 데이터 분석', '예측 모델'], hu: ['현장 조사', '지역 사람들과 합의', '정책 판단'], pr: '기상청 자료로 우리 동네 한 달 기온 그래프 그리기',
      fu: '기후 대응·재난 대비·도시 재설계는 오래 걸리는 과제라 수요가 이어질 전망이야(추정). 데이터 분석에 정책·지역 이해를 합친 사람이 필요해.', un: '정부 정책과 예산에 따라 일자리 규모가 달라질 수 있어.', sg: [5],
      q: [['통합과학2', '열섬 현상: 공원 옆과 큰 도로 옆 온도는 얼마나 다를까?'], ['통합사회2', '기후 변화 피해가 사람마다 다르게 오는 이유는?']] }
  };
  var AREA = ['수행평가·세특', '동아리', '진로활동', '혼자 탐구'];

  /* 1) 열린 문 */
  function doors(o) {
    var p = window.FC_PATH.load().picks || {};
    var any = Object.keys(p).some(function (c) { return p[c]; });
    if (!any) return null;
    return ORDER.map(function (g) {
      var core = G[g].core; if (!core.length) return { g: g, s: 2, t: '지정 과목 적음' };
      var n = core.filter(function (c) { return p[c]; }).length, r = n / core.length;
      return { g: g, s: r === 1 ? 2 : r >= 0.5 ? 1 : 0, t: n + '/' + core.length, miss: core.filter(function (c) { return !p[c]; }) };
    });
  }
  function doorCard(o, ro) {
    var d = doors(o); if (!d) return '';
    var open = d.filter(function (x) { return x.s === 2; }), half = d.filter(function (x) { return x.s === 1; }), shut = d.filter(function (x) { return x.s === 0; });
    function li(x) { return '<li class="cx-d' + x.s + '"><b>' + G[x.g].i + ' ' + e(G[x.g].n) + '</b><small>' + e(x.t) + '</small>' + (x.miss && x.miss.length && x.s < 2 ? '<em>+ ' + x.miss.map(e).join(' · ') + '</em>' : '') + '</li>'; }
    return '<section class="card cx-doors"><h2>🚪 열린 문 <small>' + (ro ? '승준이 바구니 기준' : '내 바구니 기준') + '</small></h2><p class="muted small">계열마다 꼭 필요한 과목을 얼마나 담았는지야. 계열을 아직 못 정했으면, 문이 많이 열리는 과목부터 담아도 돼.</p>' +
      '<div class="cx-sum"><span class="cx-s2">활짝 ' + open.length + '</span><span class="cx-s1">반쯤 ' + half.length + '</span><span class="cx-s0">좁음 ' + shut.length + '</span></div>' +
      (half.length ? '<p class="cx-lab">조금만 더 담으면 열리는 계열</p><ul class="cx-dl">' + half.map(li).join('') + '</ul>' : '') +
      (shut.length ? '<details class="cx-more"><summary>좁은 계열 ' + shut.length + '개 보기</summary><ul class="cx-dl">' + shut.map(li).join('') + '</ul></details>' : '') +
      (open.length ? '<details class="cx-more"><summary>활짝 열린 계열 ' + open.length + '개 보기</summary><ul class="cx-dl">' + open.map(li).join('') + '</ul></details>' : '') +
      '<p class="muted small">"지정 과목 적음" 계열(인문·상경 등)은 과목보다 탐구 기록이 중요해. 대학 발표는 바뀔 수 있어.</p></section>';
  }

  /* 2) 탐구 노트 */
  function seedGroups(o) { var gs = o.groups.length ? o.groups : (window.FC_PATH.load().groups || []); return gs.length ? gs : ['cs', 'hum']; }
  function noteCard(o, ro) {
    var h = '<section class="card cx-notes"><h2>🔬 탐구 노트 <small>' + o.notes.length + '개</small></h2>';
    if (ro) {
      return h + (o.notes.length ? '<ul class="cx-nl">' + o.notes.slice(0, 6).map(function (n) { return '<li><b>' + e(n.q) + '</b><small>' + e(n.subj || '') + ' · ' + e(n.area || '') + (n.learn ? ' · 알게 된 것 있음' : '') + '</small></li>'; }).join('') + '</ul>' : '<p class="muted small">아직 담은 탐구 질문이 없어요.</p>') + '<p class="muted small">"그거 해보니까 뭐가 제일 의외였어?" 한 마디면 충분해요.</p></section>';
    }
    h += '<p class="muted small">지금 배우는 과목에서 내 진로랑 이어지는 질문을 하나 골라 봐. 수행평가·발표 주제로 선생님께 제안할 때 쓰면 돼. 학생부는 선생님이 실제 활동을 보고 쓰는 거니까, 노트는 진짜로 해본 것만 적어.</p>';
    var have = {}; o.notes.forEach(function (n) { have[n.q] = 1; });
    var seeds = []; seedGroups(o).forEach(function (g) { (X[g] ? X[g].q : []).forEach(function (q) { if (!have[q[1]]) seeds.push({ g: g, s: q[0], q: q[1] }); }); });
    if (seeds.length) h += '<p class="cx-lab">질문 씨앗' + (o.groups.length ? '' : ' <small>(계열을 고르면 맞춰서 바뀌어)</small>') + '</p><ul class="cx-seeds">' + seeds.slice(0, 4).map(function (x) { return '<li><span><small>' + G[x.g].i + ' ' + e(x.s) + '</small>' + e(x.q) + '</span><button type="button" data-cx-seed="' + e(x.g) + '|' + e(x.s) + '|' + e(x.q) + '">담기</button></li>'; }).join('') + '</ul>';
    h += '<button type="button" class="cx-new" data-cx-new>＋ 내 질문으로 새 노트</button>';
    if (o.notes.length) h += '<div class="cx-nlist">' + o.notes.map(function (n, i) {
      var st = n.learn ? '✓ 정리됨' : n.did ? '진행 중' : '시작 전';
      return '<details class="cx-n"' + (i === 0 && !n.learn ? ' open' : '') + '><summary><b>' + e(n.q || '새 질문') + '</b><small>' + e(n.subj || '과목 미정') + ' · ' + st + '</small></summary>' +
        '<label>질문<input data-cx-f="q" data-cx-id="' + e(n.id) + '" maxlength="120" value="' + e(n.q) + '" placeholder="궁금한 것을 질문으로"></label>' +
        '<label>어디서 해볼까<select data-cx-f="area" data-cx-id="' + e(n.id) + '">' + AREA.map(function (a) { return '<option' + (n.area === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></label>' +
        '<label>해본 것 (자료·실험·인터뷰)<textarea data-cx-f="did" data-cx-id="' + e(n.id) + '" maxlength="400" rows="2" placeholder="예) 기상청 자료 2주치 표로 정리">' + e(n.did || '') + '</textarea></label>' +
        '<label>알게 된 것<textarea data-cx-f="learn" data-cx-id="' + e(n.id) + '" maxlength="400" rows="2" placeholder="예상과 달랐던 점 위주로">' + e(n.learn || '') + '</textarea></label>' +
        '<label>다음 질문<input data-cx-f="next" data-cx-id="' + e(n.id) + '" maxlength="120" value="' + e(n.next || '') + '" placeholder="꼬리를 무는 질문 하나"></label>' +
        '<div class="cx-nb"><small>' + md(n.at) + ' 시작</small><button type="button" data-cx-del="' + e(n.id) + '">지우기</button></div></details>';
    }).join('') + '</div>';
    return h + '</section>';
  }

  /* 3) AI와 일하기  4) 10년 뒤 */
  function aiCard(o) {
    var gs = o.groups.length ? o.groups : [];
    var h = '<details class="card cx-ai"><summary><b>🤖 AI와 같이 일하기</b><small>' + (gs.length ? gs.map(function (g) { return G[g].n; }).map(e).join(' · ') + ' 기준' : 'AI 쓸 때 원칙') + '</small></summary>';
    gs.forEach(function (g) {
      var x = X[g];
      h += '<div class="cx-ag"><h3>' + G[g].i + ' ' + e(G[g].n) + '</h3><div class="cx-two"><div><p class="cx-t1">AI가 도와줄 일</p><p>' + x.ai.map(e).join(' · ') + '</p></div><div><p class="cx-t2">사람이 맡는 일</p><p>' + x.hu.map(e).join(' · ') + '</p></div></div><p class="cx-pr"><b>지금 연습</b> ' + e(x.pr) + '</p></div>';
    });
    h += '<div class="cx-rule"><p class="cx-lab">AI 쓸 때 4가지 원칙</p><ol><li>AI 답은 <b>초안</b>이야. 중요한 건 출처 2곳에서 확인해.</li><li>내 말로 다시 설명 못 하면 아직 내 것이 아니야.</li><li>이름·학교·사진 같은 <b>개인정보는 넣지 않기</b>.</li><li>수행평가는 <b>학교 AI 사용 규칙</b>을 먼저 확인해. 쓴 경우엔 어디에 썼는지 밝혀.</li></ol></div></details>';
    return h;
  }
  function futCard(o) {
    var gs = o.groups; if (!gs.length) return '';
    var h = '<details class="card cx-fu"><summary><b>🔭 10년 뒤 이 계열</b><small>공식 자료 + 추정 · 확정 예측 아님</small></summary>';
    gs.forEach(function (g) {
      var x = X[g];
      h += '<div class="cx-fg"><h3>' + G[g].i + ' ' + e(G[g].n) + '</h3><p>' + e(x.fu) + '</p><p class="cx-un"><b>불확실한 점</b> ' + e(x.un) + '</p>' +
        (x.sg.length ? '<p class="cx-src">근거: ' + x.sg.filter(function (i) { return SIG[i]; }).map(function (i) { return '<a href="' + e(SIG[i].u) + '" target="_blank" rel="noopener noreferrer">' + e(SIG[i].t) + '</a>'; }).join(' · ') + '</p>' : '') + '</div>';
    });
    return h + '<p class="muted small">"(추정)"은 공식 숫자가 아니라 흐름을 보고 한 해석이야. 1년에 한 번 새 자료로 다시 보자.</p></details>';
  }

  /* 5) 해본 미션 돌아보기 */
  var FB = [['up', '😀 재밌었어'], ['mid', '😐 보통'], ['down', '🙁 별로']];
  function missionGroup(m) { for (var i = 0; i < ORDER.length; i++) if (G[ORDER[i]].m.indexOf(m) >= 0) return ORDER[i]; return ''; }
  function fbCard(o, ro) {
    var done = Object.keys(o.done || {}).filter(function (m) { return o.done[m]; });
    if (!done.length) return '';
    var up = {}; done.forEach(function (m) { var f = o.fb[m]; if (f && f.f === 'up') { var g = missionGroup(m); if (g) up[g] = (up[g] || 0) + 1; } });
    var best = Object.keys(up).sort(function (a, b) { return up[b] - up[a]; });
    var h = '<section class="card cx-fb"><h2>🧪 해본 미션 돌아보기</h2>' + (best.length ? '<p class="cx-best">재밌었던 쪽: <b>' + best.map(function (g) { return G[g].i + ' ' + e(G[g].n); }).join(' · ') + '</b></p>' : '') + '<ul>';
    done.slice(-6).reverse().forEach(function (m) {
      var f = o.fb[m] || {};
      h += '<li><p>' + e(m) + '</p>' + (ro ? '<small>' + (f.f ? FB.filter(function (x) { return x[0] === f.f; })[0][1] : '아직 돌아보기 전') + (f.r ? ' · 다시 해볼래' : '') + '</small>' :
        '<div class="cx-fbb" role="group" aria-label="해보니 어땠어?">' + FB.map(function (x) { return '<button type="button" data-cx-fb="' + e(m) + '" data-v="' + x[0] + '" aria-pressed="' + (f.f === x[0]) + '" class="' + (f.f === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') +
        '<button type="button" data-cx-re="' + e(m) + '" aria-pressed="' + !!f.r + '" class="' + (f.r ? 'on' : '') + '">🔁 또 할래</button></div>') + '</li>';
    });
    return h + '</ul>' + (ro ? '' : '<p class="muted small">별로였어도 괜찮아. 그 계열을 바로 빼지 말고, 같은 계열의 다른 일도 한 번 구경해봐.</p>') + '</section>';
  }

  /* 6) 진로 변화 기록 */
  function track(o) {
    var last = o.hist.length ? o.hist[o.hist.length - 1].g.join(',') : null, now = o.groups.slice().sort().join(',');
    var cur = o.groups.slice().sort();
    if (last === now) return false;
    if (last === null && !cur.length) return false;
    var lt = o.hist.length ? o.hist[o.hist.length - 1] : null;
    if (lt && lt.at === td() && !lt.why) { lt.g = cur; if (o.hist.length > 1 && o.hist[o.hist.length - 2].g.join(',') === now) o.hist.pop(); return true; }
    o.hist.push({ id: nid(), at: td(), g: cur, why: '' });
    if (o.hist.length > 20) o.hist = o.hist.slice(-20);
    return true;
  }
  function histCard(o, ro) {
    if (!o.hist.length) return '';
    var list = o.hist.slice().reverse().slice(0, 6);
    return '<details class="card cx-hist"' + (ro ? '' : (list[0].why ? '' : ' open')) + '><summary><b>📈 진로 변화 기록</b><small>' + o.hist.length + '번 · 바뀌는 게 정상이야</small></summary><ol>' + list.map(function (x, i) {
      return '<li><p><span>' + md(x.at) + '</span>' + (x.g.length ? x.g.map(function (g) { return G[g] ? G[g].i + ' ' + e(G[g].n) : ''; }).join(' · ') : '<i>비워 둠</i>') + '</p>' +
        (ro ? (x.why ? '<small>' + e(x.why) + '</small>' : '') : '<input data-cx-why="' + e(x.id) + '" maxlength="120" value="' + e(x.why || '') + '" placeholder="' + (i === 0 ? '왜 이렇게 골랐어? 한 줄' : '이유 한 줄') + '">') + '</li>';
    }).join('') + '</ol><p class="muted small">면접이나 상담에서 "진로가 어떻게 바뀌었어?"라고 물으면 이 기록이 답이 돼.</p></details>';
  }

  /* 엄마 화면 대화 한 줄 */
  function momTalk(o) {
    var n = o.notes.filter(function (x) { return x.did || x.learn; })[0];
    var tips = [];
    if (n) tips.push('"' + n.q.slice(0, 40) + (n.q.length > 40 ? '…' : '') + '" 해보니까 뭐가 제일 의외였어?');
    if (o.hist.length > 1) tips.push('진로 생각이 바뀌었던데, 뭐가 계기였어?');
    return tips.length ? '<section class="card cx-mtalk"><h2>💬 오늘 물어볼 한 마디</h2><ul>' + tips.map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul></section>' : '';
  }

  var prev = render;
  render = function () {
    prev();
    if (typeof tab === 'undefined' || tab !== 'path') return;
    var wrap = document.querySelector('#content .cp-wrap'); if (!wrap || wrap.querySelector('.cx-doors,.cx-notes')) return;
    var ro = isParent(), o = load();
    if (!ro && track(o)) put(o);
    if (ro && !o.share) return;
    var bag = wrap.querySelector('.cp-bag') || wrap.querySelector('.cp-warn') && wrap.querySelector('.cp-warn').closest('.card');
    var anchor = wrap.querySelector('.cp-sigs');
    var after = doorCard(o, ro), rest = (ro ? momTalk(o) : '') + noteCard(o, ro) + fbCard(o, ro) + aiCard(o) + futCard(o) + histCard(o, ro);
    if (bag) bag.insertAdjacentHTML('afterend', after);
    else if (ro) { var c = wrap.querySelectorAll('.card')[1]; if (c) c.insertAdjacentHTML('afterend', after); }
    if (anchor) anchor.insertAdjacentHTML('beforebegin', rest); else wrap.insertAdjacentHTML('beforeend', rest);
  };

  function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  document.addEventListener('click', function (ev) {
    if (typeof tab === 'undefined' || tab !== 'path' || isParent()) return;
    var b = ev.target.closest('button'); if (!b) return;
    var o;
    if (b.dataset.cxSeed) {
      var p = b.dataset.cxSeed.split('|'); o = load();
      o.notes.unshift({ id: nid(), g: p[0], subj: p[1], q: p.slice(2).join('|'), area: AREA[0], did: '', learn: '', next: '', at: td() });
      put(o); rerender(); if (typeof notice === 'function') notice('탐구 노트에 담았어. 선생님께 주제로 말해봐.'); return;
    }
    if (b.hasAttribute('data-cx-new')) { o = load(); o.notes.unshift({ id: nid(), g: o.groups[0] || '', subj: '', q: '', area: AREA[3], did: '', learn: '', next: '', at: td() }); put(o); rerender(); var f = document.querySelector('.cx-n input[data-cx-f="q"]'); if (f) f.focus(); return; }
    if (b.dataset.cxDel) { if (!confirm('이 탐구 노트를 지울까?')) return; o = load(); o.notes = o.notes.filter(function (n) { return n.id !== b.dataset.cxDel; }); put(o); rerender(); return; }
    if (b.dataset.cxFb) { o = load(); var m = b.dataset.cxFb, cur = o.fb[m] || {}; cur.f = cur.f === b.dataset.v ? '' : b.dataset.v; o.fb[m] = cur; put(o); rerender(); return; }
    if (b.dataset.cxRe) { o = load(); var r = b.dataset.cxRe, c2 = o.fb[r] || {}; c2.r = !c2.r; o.fb[r] = c2; put(o); rerender(); }
  });
  var tmr = 0;
  function saveField(t) {
    var o = load();
    if (t.dataset.cxId) { var n = o.notes.filter(function (x) { return x.id === t.dataset.cxId; })[0]; if (n) n[t.dataset.cxF] = t.value.slice(0, 400); }
    if (t.dataset.cxWhy) { var hh = o.hist.filter(function (x) { return x.id === t.dataset.cxWhy; })[0]; if (hh) hh.why = t.value.slice(0, 120); }
    put(o);
  }
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (isParent() || !t.matches || !t.matches('[data-cx-id],[data-cx-why]')) return;
    clearTimeout(tmr); tmr = setTimeout(function () { saveField(t); }, 500);
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (isParent() || !t.matches || !t.matches('[data-cx-id],[data-cx-why]')) return;
    clearTimeout(tmr); saveField(t);
  });

  window.FC_PATH_PLUS = { extra: X, doors: doors };

  var css = document.createElement('style');
  css.textContent = '.cx-doors h2 small,.cx-notes h2 small{font-size:12.5px;font-weight:600;color:var(--ink-3);margin-left:4px}' +
    '.cx-sum{display:flex;gap:8px;margin:8px 0 10px}.cx-sum span{flex:1;text-align:center;padding:8px 4px;border-radius:12px;font-weight:800;font-size:15px}.cx-s2{background:var(--u-soft);color:var(--ok-ink)}.cx-s1{background:var(--u-soft);color:var(--warn-ink)}.cx-s0{background:var(--u-soft);color:var(--ink-2)}' +
    '.cx-dl{list-style:none;margin:0;padding:0;display:grid;gap:6px}.cx-dl li{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;padding:8px 10px;border-radius:12px;background:var(--u-soft);font-size:15px}.cx-dl li small{font-weight:700;color:var(--ink-2)}.cx-dl li em{flex-basis:100%;font-style:normal;font-size:13.5px;color:var(--ink-2)}.cx-d2{background:var(--u-soft)!important}.cx-d1 b::after{content:" · 반쯤";font-weight:600;color:var(--warn-ink)}.cx-d0 b::after{content:" · 좁음";font-weight:600;color:var(--ink-2)}' +
    '.cx-more{margin:8px 0 4px}.cx-more summary,.cx-n summary,.cx-ai>summary,.cx-fu>summary,.cx-hist>summary{cursor:pointer;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:2px}.cx-more summary{font-weight:700;font-size:15px;color:var(--ink)}' +
    '.cx-ai>summary,.cx-fu>summary,.cx-hist>summary{list-style:none}.cx-ai>summary::-webkit-details-marker,.cx-fu>summary::-webkit-details-marker,.cx-hist>summary::-webkit-details-marker{display:none}.cx-ai>summary b,.cx-fu>summary b,.cx-hist>summary b{font-size:17px;color:var(--ink)}.cx-ai>summary small,.cx-fu>summary small,.cx-hist>summary small{font-size:12.5px;color:var(--ink-3)}' +
    '.cx-lab{margin:10px 0 6px;font-size:13.5px;font-weight:800;color:var(--accent-ink)}.cx-lab small{font-weight:600;color:var(--ink-3)}' +
    '.cx-seeds{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:8px}.cx-seeds li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--u-soft)}.cx-seeds li span{flex:1;min-width:0;font-size:15px;line-height:1.5;color:var(--ink)}.cx-seeds li span small{display:block;font-size:12.5px;font-weight:700;color:var(--accent-ink)}.cx-seeds button{flex:none;min-height:38px!important;padding:4px 14px!important;border-radius:999px!important;font-size:13.5px}' +
    '.cx-new{width:100%;min-height:44px!important;border-radius:12px!important;border:1.5px dashed var(--u-line)!important;background:var(--u-surface)!important;color:var(--accent-ink)!important;font-weight:700}' +
    '.cx-nlist{display:grid;gap:8px;margin-top:10px}.cx-n{border:1.5px solid var(--u-line);border-radius:12px;padding:4px 12px 8px;background:var(--u-surface)}.cx-n summary b{font-size:15px;color:var(--ink)}.cx-n summary small{font-size:12.5px;color:var(--ink-3)}.cx-n label{display:block;margin:8px 0 0;font-size:12.5px;font-weight:700;color:var(--ink-2)}.cx-n input,.cx-n select,.cx-n textarea{display:block;width:100%;box-sizing:border-box;margin-top:4px;min-height:42px;border:1.5px solid var(--u-line);border-radius:12px;padding:8px 10px;font:inherit;font-size:15px;font-weight:400;background:var(--u-surface);color:var(--ink)}.cx-nb{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.cx-nb small{color:var(--ink-3)}.cx-nb button{min-height:36px!important;padding:2px 12px!important;border-radius:999px!important;background:var(--u-surface)!important;border:1px solid var(--u-line)!important;color:var(--exam-ink)!important;font-size:13.5px}' +
    '.cx-nl{list-style:none;margin:6px 0;padding:0;display:grid;gap:6px}.cx-nl li{padding:8px 10px;border-radius:12px;background:var(--u-soft);font-size:15px}.cx-nl li small{display:block;color:var(--ink-2);font-size:12.5px}' +
    '.cx-ag,.cx-fg{margin:12px 0 0;padding-top:10px;border-top:1px solid var(--u-line)}.cx-ag h3,.cx-fg h3{margin:0 0 6px;font-size:15px;color:var(--ink)}.cx-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cx-two>div{padding:8px 10px;border-radius:12px;background:var(--u-soft)}.cx-two p{margin:0;font-size:13.5px;line-height:1.5;color:var(--ink)}.cx-t1,.cx-t2{font-size:12.5px!important;font-weight:800;margin-bottom:2px!important}.cx-t1{color:var(--accent-ink)!important}.cx-t2{color:var(--ok-ink)!important}.cx-pr{margin:8px 0 0;font-size:13.5px;line-height:1.55;color:var(--ink)}.cx-pr b{color:var(--warn-ink);margin-right:4px}' +
    '.cx-rule{margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--u-soft)}.cx-rule .cx-lab{margin-top:0;color:var(--warn-ink)}.cx-rule ol{margin:0;padding-left:20px;font-size:15px;line-height:1.65;color:var(--ink)}' +
    '.cx-fg p{margin:0 0 6px;font-size:15px;line-height:1.6;color:var(--ink)}.cx-un{font-size:13.5px!important}.cx-un b{color:var(--warn-ink);margin-right:4px}.cx-src{font-size:12.5px!important}.cx-src a{color:var(--accent-ink);text-decoration:underline}' +
    '.cx-fb ul{list-style:none;margin:6px 0;padding:0;display:grid;gap:8px}.cx-fb li{padding:10px 12px;border-radius:12px;background:var(--u-soft)}.cx-fb li p{margin:0 0 6px;font-size:15px;line-height:1.5}.cx-fb li small{color:var(--ink-2);font-size:12.5px}.cx-best{font-size:15px;margin:4px 0 6px}.cx-fbb{display:flex;flex-wrap:wrap;gap:6px}.cx-fbb button{min-height:36px!important;padding:2px 10px!important;border-radius:999px!important;border:1.5px solid var(--u-line)!important;background:var(--u-surface)!important;color:var(--ink)!important;font-size:13.5px;font-weight:600}.cx-fbb button.on{background:var(--u-soft)!important;border-color:var(--accent)!important;color:var(--accent-ink)!important}' +
    '.cx-hist ol{list-style:none;margin:8px 0;padding:0;display:grid;gap:8px}.cx-hist li p{margin:0 0 4px;font-size:15px;font-weight:600;color:var(--ink)}.cx-hist li p span{display:inline-block;min-width:44px;font-size:12.5px;font-weight:800;color:var(--accent-ink)}.cx-hist li p i{font-style:normal;color:var(--ink-3)}.cx-hist li small{display:block;font-size:13.5px;color:var(--ink-2);padding-left:44px}.cx-hist input{width:100%;box-sizing:border-box;min-height:40px;border:1.5px solid var(--u-line);border-radius:12px;padding:6px 10px;font:inherit;font-size:15px}' +
    '.cx-mtalk{background:var(--u-soft)}.cx-mtalk ul{margin:4px 0 0;padding-left:18px;font-size:15px;line-height:1.7}' +
    '@media(max-width:380px){.cx-two{grid-template-columns:1fr}}';
  document.head.appendChild(css);
  render();
})();
