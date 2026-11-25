# 기출 유형 연결 응용문항 검토 기록 · 2026-11-25

41개 현행 학습 과목에 각 2문항, 총 82문항을 추가했다. 아래는 분야별 개념·고유 정답·선택지·가정 확인 기록이다. 수치와 상황은 자체 구성했으며 원전·정부·공식 교육 자료는 개념 대조에 사용했다. 외부 전문가·원어민 전수 감수나 실제 수험생 난도 검증으로 표시하지 않는다.

통합 검토에서 중국어 행동 순서는 도서관을 나온 뒤 우체국으로 간다는 연결을 명시했다. 수학의 직렬화된 중복 백슬래시는 단일 KaTeX 명령으로 바로잡았고, 수치 33개 및 RNA 서열은 별도 검사로 재계산했다. 원본 기출 텍스트를 복제하지 않았다.


## 국어·수학·영어·한국사


작성일: 2026-11-22 (한국시간). 원문 기출의 복제가 아닌 자체 구성 18문항이다. `core.json`에 과목별 2문항을 저장했다. 기존 topicId와 실제 색인 문항이 있는 유형에 연결했으며, 실제 수능 난도나 출제 확률을 추정하지 않는다. 모든 정답은 0부터 세는 answerIndex로 저장한다. 표의 정답 번호는 사용자를 위한 1~5번 표기다.

### 문항별 판정

| 문항 ID 끝부분 | 과목·주제 | 정답 | 독립 확인·선택지 배제 근거 | 근거 자료 |
|---|---|---:|---|---|
| bike-access | 국어 공통·주장 적용 | 3 | 지문의 명시적 주장인 수량+실제 접근 조건을 함께 충족한다. 1·2·5는 범위 확대 또는 소외 계층 누락, 4는 보완을 폐기로 오독한다. 지문과 정책 상황은 창작이다. | R1 |
| lab-permission | 국어 공통·조건 추론 | 2 | 승인 P→교육 Q에서 ¬Q→¬P. 교육 이수 민재는 승인 확정 불가. 미승인 수민의 명단 등재 여부도 알 수 없도록 규칙의 역을 허용하지 않았다. | R2 |
| festival-cups | 화법과 작문·협상 | 4 | 판매 지속·대기 줄 감소와 쓰레기 감소를 동시에 충족하는 별도 반납대. 인력과 공간이 제시되어 새로운 조건을 추정하지 않는다. | R3 |
| sampling-comparison | 화법과 작문·표본 대표성 | 2 | 학년 비율에 맞춘 무작위 선정의 장점과 표본 오차의 존속을 함께 설명한다. 자발적 응답 240명이라는 수량만으로 대표성 우월을 주장할 수 없다. | R4 |
| word-function | 언어와 매체·품사 | 1 | 새가: 동물 이름인 명사+주격 조사. 새 계획: 체언을 수식하는 관형사. 매우: 형용사의 정도를 수식하는 부사. 필수적 부사어처럼 견해 차이가 개입할 수 있는 분류는 사용하지 않았다. | R5, R18, R19 |
| percentage-headline | 언어와 매체·통계 정보 검증 | 5 | 60−40=20%포인트, (60−40)/40=50%. 실제 인원 증가율은 각 연도의 전체 학생 수가 없어 확정할 수 없다. 데이터는 창작이며 실제 학교 수치가 아니다. | R6 |
| horizontal-coefficient | 수학 공통·미분계수 | 3 | 수평 접선→f′(1)=3−6+a=0→a=3→f(2)=4. 도함수 조건과 함수값을 나누어 확인했다. | R7 |
| partial-sums-reverse | 수학 공통·등차수열 | 4 | a+d=4, 6a+15d=42를 풀면 a=d=2. 실제 첫 3항 합 2+4+6=12, 첫 6항 합 42를 재검산, a8=16. | R8 |
| committee-composition | 확률과 통계·조합 | 3 | 학생 조합 6×교사 선택 3=18. Python의 7명 중 3명 조합 전수 열거 후 학생 2명 조건 필터도 18개다. 직책이 없다고 명시하여 순서 구분을 배제했다. | R9 |
| compare-standard-scores | 확률과 통계·표준화 | 4 | A의 z=(72−60)/8=1.5. B에서 100+12×1.5=118. 두 분포의 독립성은 계산에 필요하지 않으며 가정하지 않았다. | R10 |
| tank-net-change | 미적분·정적분 | 5 | 순변화량 적분은 12L, 초기량 20L를 더해 32L. 별도 검산으로 선형 변화율의 사다리꼴 넓이 (1+7)/2×3=12L를 사용했다. | R11 |
| bounce-total-distance | 미적분·무한등비급수 | 3 | 첫 낙하 6 + 반동 후 왕복 2×[4/(1−2/3)]=30m. Fraction으로 80회까지 부분합을 계산해 30에 수렴함을 검산했다. 무한 반복의 이상화된 조건을 명시했다. | R12 |
| perpendicular-sum | 기하·내적 | 4 | 2k−4=0→k=2, 합 (4,3)의 제곱 크기 25. 독립적으로 수직 벡터의 제곱 크기 합 5+20=25도 일치한다. | R13 |
| focal-distance-transfer | 기하·타원 | 2 | P에서 거리 5+5=10, Q에서 7+QF2=10→3. 주어진 Q의 존재도 x=10/3,y²=80/9를 구해 x²/25+y²/16=1로 확인했다. | R14 |
| accessible-exhibition | 영어·요지 | 4 | 설명문·전시물은 유지하고 음성·모형 경로를 추가하는 창작 사례. 한 경로 강제·기존 방식 전면 폐지는 본문과 모순된다. 전시 접근성을 설명하는 실제 연구 결과로 제시하지 않았다. | R1 (비판적 독해 원리만 참고) |
| workshop-checkin | 영어·안내문 조건 적용 | 2 | 수요일 18시까지 등록, 확인 메일, 토요일 9:45까지 본인 도착을 모두 충족. 노트북 제공이므로 미지참은 결격이 아니다. 안내문 일정과 규칙은 창작이다. 선택지까지 한국어 해석에 포함했다. | R1 (조건·근거 읽기 원리만 참고) |
| royal-power-mechanism | 한국사·광종 정책의 작용 | 3 | 노비안검법을 모든 노비 해방으로 확대하지 않는다. 호족의 기반 약화와 과거를 통한 새 인재 등용을 왕권 안정에 연결한다. 신라 골품·갑오개혁을 구분한다. | R15 |
| recruitment-comparison | 한국사·과거제 시행/폐지 비교 | 1 | 958년 광종의 과거제 시행과 1894년 갑오개혁의 폐지를 비교한다. 관리 등용 방식 변화라는 공통점만 인정하며 같은 기구·같은 시대·현실의 차별 완전 소멸로 확대하지 않는다. | R15, R16, R17 |

### 직접 확인한 참고자료

참고자료는 개념·원리의 근거이며 자체 문제나 해설을 출제 기관이 작성·승인했다는 의미가 아니다. 웹 검색 결과를 확인한 뒤 주요 페이지를 직접 열어 해당 개념을 대조했다. 아래 원문을 장문 복제하지 않았다.

- R1 — OpenStax, Writing Guide 1.5, 주장·논리·증거에 근거한 비판적 읽기: https://openstax.org/books/writing-guide/pages/1-5-writing-process-thinking-critically-about-a-text
- R2 — Internet Encyclopedia of Philosophy, 명제논리와 modus tollens(대우에 따른 추론): https://iep.utm.edu/propositional-logic-sentential-logic/
- R3 — Harvard Law School Program on Negotiation, 입장보다 관심을 파악하는 협상: https://www.pon.harvard.edu/daily/negotiation-skills-daily/positional-bargaining-pitfalls/
- R4 — OpenStax, Introductory Statistics 1.2, 표본·모집단 및 층화 무작위 추출: https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling
- R5 — 국립국어원 온라인가나다, 관형사 새와 접두사 신-의 구분, 관형사의 체언 수식: https://www.korean.go.kr/front/onlineQna/onlineQnaView.do?mn_id=90&pageIndex=1&qna_seq=330488
- R6 — 영국 통계청 ONS, 백분율과 percentage points의 구분: https://service-manual.ons.gov.uk/content/numbers/percentages
- R7 — OpenStax Calculus Vol.1 3.3, 다항함수 미분 법칙: https://openstax.org/books/calculus-volume-1/pages/3-3-differentiation-rules
- R8 — OpenStax Precalculus 11.4, 등차수열 부분합: https://openstax.org/books/precalculus-2e/pages/11-4-series-and-their-notations
- R9 — OpenStax Precalculus 11.5, 순서가 없는 선택의 조합과 곱의 원리: https://openstax.org/books/precalculus-2e/pages/11-5-counting-principles
- R10 — OpenStax Introductory Statistics 6.1, z=(x−μ)/σ와 분포 간 비교: https://openstax.org/books/introductory-statistics-2e/pages/6-1-the-standard-normal-distribution
- R11 — OpenStax Calculus Vol.1 5.4, 변화율 적분과 순변화량: https://openstax.org/books/calculus-volume-1/pages/5-4-integration-formulas-and-the-net-change-theorem
- R12 — OpenStax Calculus Vol.2 5.2, 무한등비급수의 수렴과 합: https://openstax.org/books/calculus-volume-2/pages/5-2-infinite-series
- R13 — OpenStax Precalculus 8.8, 벡터 성분·크기·내적: https://openstax.org/books/precalculus-2e/pages/8-8-vectors
- R14 — OpenStax Precalculus 10.1, 타원의 두 초점까지 거리 합: https://openstax.org/books/precalculus-2e/pages/10-1-the-ellipse
- R15 — 국사편찬위원회 우리역사넷, 광종의 노비안검법·과거제와 왕권 안정: https://contents.history.go.kr/front/ta/view.do?levelId=ta_m71_0050_0010_0020_0010
- R16 — 국사편찬위원회 우리역사넷, 1894년 갑오개혁의 과거제 폐지·새 관리 임용 제도: https://contents.history.go.kr/front/ta/view.do?levelId=ta_m52_0040_0030
- R17 — 한국학중앙연구원 한국민족문화대백과사전 광종, 958년(광종 9) 과거제 시행의 연도 확인: https://encykorea.aks.ac.kr/Article/E0005220
- R18 — 국립국어원 한국어기초사전 새², 동물 이름의 품사가 명사임을 확인: https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=30197
- R19 — 국립국어원 새국어생활 2001년 겨울호, 매우의 부사성·형용사 수식(인쇄면 145쪽, PDF 5번째 쪽): https://www.korean.go.kr/nkview/nklife/2001_4/2001_0414.pdf

### 검토 범위와 한계

- 18문항은 출제 정답의 단일성·선택지 해석·기존 문항과의 중복·기존 topicId의 실제 연결 수를 확인했다. 학습자의 실제 응답 자료에 의한 난도·변별도 검증은 하지 않았다.
- 수학 8문항은 서술된 공식과 별도로 열거·좌표·부분합·도형 면적 등으로 재검산했다. 모든 수치는 JSON의 verification.expectedValue와 일치한다.
- 한국사 자료문은 사료의 직접 인용이 아니라 개념을 정리한 자체 문장임을 명시했다. 허구의 왕명·문헌명을 붙이지 않았다.
- 언어와 매체 품사 문항은 국립국어원 답변·사전·간행물 세 자료를 각각 열어 관형사 새·명사 새·부사 매우를 확인했다. 하나의 답변이 세 단어를 동시에 대조한 자료인 것으로 표시하지 않는다.
- 영어 두 문항의 지문·규칙·일정은 모두 창작이다. 참고자료는 논리·근거 읽기 원리에 관한 것으로, 실제 박물관 운영 효과나 특정 기관의 행사 규정을 증명하지 않는다.
- 교과 개념을 적용한 응용 연습이며 실제 수능 난도 수준이나 미래 출제 가능성을 보증하지 않는다.


## 사회탐구·직업탐구


범위: 현행 사회탐구 9과목·직업탐구 6과목, 각 2문항 총 30문항. 모든 지문·조건·선택지·힌트·풀이·오답 해석은 신규 자체 작성했다. 원문 기출 문항 또는 공식 해설이 아니다.
기출 연결은 기존 topicId 및 연결 유형을 그대로 사용했다. 공업 일반·상업 경제·수산·해운 산업 기초는 실제로 연결되는 한 개 유형 안에서 서로 다른 응용 사례 2개를 구성했다.
원문 사실과 개념은 아래 1차 자료·정부 공개 자료·공식 학술 교육자료에서 확인했다. 수치는 모두 문항 내 가정이며 실제 시장·인구·정책의 최신 통계로 표시하지 않는다. 전문가 전수 감수 완료를 의미하지 않는다.

### authored-extended-social-life-ethics-consent-purpose
- 유형: social-life-ethics-moral-theories
- 정답: 3번
- 근거 및 유일정답 검토: 칸트 원전의 인간성 정식 및 기만 약속 사례를 개념 근거로 삼았다. 인터뷰·광고 상황은 새로 작성한 가상 사례이다. 3번만 기만과 협력 일반을 구분한다.
- 출처: https://www.gutenberg.org/cache/epub/5682/pg5682-images.html

### authored-extended-social-life-ethics-veil-information
- 유형: social-life-ethics-distributive-justice
- 정답: 1번
- 근거 및 유일정답 검토: 롤스 원전 발췌의 특정 정보 배제와 일반 정보 허용 구분. 실제 원초적 입장의 모든 전제를 재현한 모형은 아님을 문구로 한정했다.
- 출처: https://liberalarts.tamu.edu/pols/wp-content/uploads/sites/20/2020/09/Rawls-A-Theory-of-Justice-136-161.pdf

### authored-extended-social-ethics-four-sprouts-pair
- 유형: social-ethics-early-confucianism
- 정답: 2번
- 근거 및 유일정답 검토: 맹자 공손추 상 원문/공개 고전 번역의 사단-인의예지 대응. 검색 반환 원문 확인, 직접 열기는 403으로 추가 열람 불가; 동일 구절은 학술 해설로도 교차 확인했다.
- 출처: https://ctext.org/mengzi/gong-sun-chou-i

### authored-extended-social-ethics-anger-context
- 유형: social-ethics-plato-aristotle
- 정답: 4번
- 근거 및 유일정답 검토: 니코마코스 윤리학 2권의 적절한 때·대상·목적·방식 및 분노/온화함 논의에 근거. 병의 행동을 모든 경우의 완전한 덕으로 단정하지 않고 취지에 가깝다고 한정.
- 출처: https://classics.mit.edu/Aristotle/nicomachaen.2.ii.html

### authored-extended-social-korea-geography-regional-denominators
- 유형: social-korea-geography-population
- 정답: 2번
- 근거 및 유일정답 검토: 가상 인구 합계 두 지역 모두 5,000명. A=50, B=25, 배수=2를 독립 계산했다.
- 출처: https://www.index.go.kr/unify/idx-info.do?idxCd=1430

### authored-extended-social-korea-geography-meander-materials
- 유형: social-korea-geography-river
- 정답: 3번
- 근거 및 유일정답 검토: USGS 원 연구의 곡류 하천 포인트바/범람원 퇴적을 개념 근거로 하되 사례는 가상 모형 기록. 실제 모든 굽이의 유속을 절대적으로 일반화하지 않는다.
- 출처: https://www.usgs.gov/publications/dynamic-relations-deposition-sediment-floodplains-and-point-bars-a-freely-meandering

### authored-extended-social-world-geography-growth-components
- 유형: social-world-geography-population
- 정답: 2번
- 근거 및 유일정답 검토: 미국 인구조사국 인구 변화 구성 정의. 수치는 가상이며 실제 국가·연도 통계가 아니다. -200+700=500 독립 검산.
- 출처: https://www.census.gov/programs-surveys/popest/about/glossary/national.html

### authored-extended-social-world-geography-midnight-local-time
- 유형: social-world-geography-maps-information
- 정답: 4번
- 근거 및 유일정답 검토: NOAA 경도 좌표 개념과 문항에 명시한 자전·시간 규칙을 사용. 실제 표준 시간대나 항해 운용 시각을 계산하는 문항이 아니다.
- 출처: https://oceanservice.noaa.gov/education/tutorial_nautical_charts/nautical_charts02_information_2b.html

### authored-extended-social-east-history-war-directions
- 유형: social-east-history-regional-wars
- 정답: 1번
- 근거 및 유일정답 검토: 국사편찬위원회 원의 일본 원정 해설 및 국가기록원 조선왕조실록 교육 자료로 시대·공격 방향·명의 참전을 대조. 전쟁 전체 원인이나 동맹의 자발성을 단정하지 않는다.
- 출처: https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_i200900
- 출처: https://theme.archives.go.kr/next/sillok/sub3_2.do

### authored-extended-social-east-history-domain-prefecture
- 유형: social-east-history-modern-reforms
- 정답: 3번
- 근거 및 유일정답 검토: 일본 아시아역사자료센터가 제공하는 1871년 폐번치현 조서 원문 메타데이터. 번 폐지·현 설치만 근거로 활용, 제도 전반의 평등 실현 등은 주장하지 않는다.
- 출처: https://www.jacar.archives.go.jp/das/meta-en/A15070001100

### authored-extended-social-world-history-rights-principles
- 유형: social-world-history-atlantic-revolutions
- 정답: 2번
- 근거 및 유일정답 검토: 프랑스 정부 법령 원문 3조 주권, 6조 법의 동일 적용. 자료는 직접 인용이 아닌 자체 토론 상황이며 역사적 적용 한계를 분명히 구분.
- 출처: https://www.legifrance.gouv.fr/Droit-francais/Constitution/Declaration-des-Droits-de-l-Homme-et-du-Citoyen-de-1789

### authored-extended-social-world-history-steam-production
- 유형: social-world-history-industry-nationalism
- 정답: 3번
- 근거 및 유일정답 검토: 영국 과학박물관 소장 뉴커먼 기관의 설명에서 풍력·수력·동물 동력과 다른 인공 동력 및 산업화 기여 확인. 문항은 실제 특정 공장 사건이 아닌 가상 전시 모형.
- 출처: https://collection.sciencemuseumgroup.org.uk/objects/co50900/newcomen-atmospheric-engine

### authored-extended-social-economics-trade-both-absolute
- 유형: social-economics-comparative-trade
- 정답: 4번
- 근거 및 유일정답 검토: 기존 문제와 달리 한 국가가 양 재화에 절대우위를 가지는 상황과 교역조건 범위를 결합했다. 6/3=2,12/4=3,2<2.5<3 검산.
- 출처: https://openstax.org/books/principles-economics-3e/pages/33-1-absolute-and-comparative-advantage

### authored-extended-social-economics-market-shortage
- 유형: social-economics-demand-supply
- 정답: 3번
- 근거 및 유일정답 검토: OpenStax 수요·공급·초과 수요 개념. 가상 함수의 Qd=72,Qs=32,차이40. 실제 가격 규제 법률이나 정책 효과를 설명하는 문항이 아니다.
- 출처: https://openstax.org/books/principles-economics-3e/pages/3-1-demand-supply-and-equilibrium-in-markets-for-goods-and-services

### authored-extended-social-politics-cooperation-checks
- 유형: social-politics-constitutional-bodies
- 정답: 3번
- 근거 및 유일정답 검토: 헌법 40·66·101조의 기능 분담을 일반 개념 참고로 사용. 가상 국가의 기관과 협력 구조는 자체 제시하며 실제 사건의 합헌성이나 개별 법적 권한을 판단하지 않는다.
- 출처: https://www.law.go.kr/lsInfoP.do?efYd=19880225&lsiSeq=61603

### authored-extended-social-politics-valid-vote-denominator
- 유형: social-politics-elections
- 정답: 1번
- 근거 및 유일정답 검토: 헌법의 비례대표제 언급은 과목 범위 참고일 뿐, 배분식은 문항 자체의 가상 규칙. 유효표900,6×450/900=3,2,1 독립 검산.
- 출처: https://www.law.go.kr/lsInfoP.do?efYd=19880225&lsiSeq=61603

### authored-extended-social-culture-sample-selection
- 유형: social-culture-research-design
- 정답: 3번
- 근거 및 유일정답 검토: OpenStax 무작위 표본·모집단 개념. 사례는 전원 응답 조건으로 비응답 편향을 제외, 표본 선정 편향만 비교한다.
- 출처: https://openstax.org/books/introduction-sociology-3e/pages/2-2-research-methods

### authored-extended-social-culture-two-generations-career
- 유형: social-culture-mobility
- 정답: 2번
- 근거 및 유일정답 검토: OpenStax 세대 간/세대 내 이동 정의. 가상 계층 위계를 명시하여 직업명만으로 계층을 추정하지 않는다.
- 출처: https://openstax.org/books/introduction-sociology-3e/pages/9-2-social-stratification-and-mobility-in-the-united-states

### authored-extended-vocation-career-conflicting-orders
- 유형: vocation-career-competencies
- 정답: 3번
- 근거 및 유일정답 검토: 한국산업인력공단 NCS 경청·명확한 표현·피드백 개념만 참고. 주문 사례와 모든 선택지·해설은 신규 자체 작성이며 자료의 문항을 개작하지 않았다.
- 출처: https://www.ncs.go.kr/unity/th03/TH0309.do?jobCd=01

### authored-extended-vocation-career-dependent-schedule
- 유형: vocation-career-competencies
- 정답: 3번
- 근거 및 유일정답 검토: NCS 시간자원 파악·할당의 일반 개념. 자체 작업 시간과 선후 조건의 스케줄을 독립 검산했다. 작업 중단/재개 가능 조건을 명시해 점심 전후 B 분할을 허용.
- 출처: https://ncs.go.kr/th03/TH0302List.do?dirSeq=125

### authored-extended-vocation-agriculture-carbon-tracer
- 유형: vocation-agriculture-crop-structure
- 정답: 4번
- 근거 및 유일정답 검토: OpenStax 광합성 탄소 고정의 개념을 자체 가상 표지 실험으로 적용. 방사선 취급 절차·실험 시행 지침은 제공하지 않는다. 원자 보존과 에너지/물질 공급원을 구분.
- 출처: https://openstax.org/books/biology-2e/pages/8-3-using-light-energy-to-make-organic-molecules

### authored-extended-vocation-agriculture-equal-ph-different-soil
- 유형: vocation-agriculture-soil-fertilizer
- 정답: 2번
- 근거 및 유일정답 검토: USDA NRCS 토양 평가의 화학·생물·물리 복수 지표와 전기전도도·pH·유기물 관련 항목. 실제 시비·석회 처리량을 권고하지 않고 지표 해석만 다룸.
- 출처: https://www.nrcs.usda.gov/conservation-basics/soil/soil-health/soil-health-assessment

### authored-extended-vocation-industry-serial-efficiency
- 유형: vocation-industry-technology
- 정답: 3번
- 근거 및 유일정답 검토: 유용 출력/입력 에너지 정의를 2단계에 적용. 1000×.8×.75=600,전체60% 독립 검산.
- 출처: https://openstax.org/books/college-physics-2e/pages/7-6-conservation-of-energy

### authored-extended-vocation-industry-efficiency-percentage-points
- 유형: vocation-industry-technology
- 정답: 1번
- 근거 및 유일정답 검토: 새로운 에너지 예산 비교와 %/%포인트 혼동을 결합. 900/1500=.6,900/1200=.75,차15%p,상대증가25% 검산.
- 출처: https://openstax.org/books/college-physics-2e/pages/7-6-conservation-of-energy

### authored-extended-vocation-commerce-buyer-purpose
- 유형: vocation-commerce-distribution
- 정답: 4번
- 근거 및 유일정답 검토: OpenStax의 소매 최종 소비자 판매와 도매 재판매·사업 구매자 정의. 사업체의 법적 업종 등록이 아니라 제시된 개별 거래 성격만 분류.
- 출처: https://openstax.org/books/principles-marketing/pages/18-1-retailing-and-the-role-of-retailers-in-the-distribution-channel
- 출처: https://openstax.org/books/principles-marketing/pages/18-5-wholesaling

### authored-extended-vocation-commerce-channel-change
- 유형: vocation-commerce-distribution
- 정답: 2번
- 근거 및 유일정답 검토: OpenStax 생산자→소매상→소비자 경로와 도매 경로를 개념 근거로 한 자체 가상 변경 사례. 경로 단축의 실제 비용·가격 효과를 단정하지 않는다.
- 출처: https://openstax.org/books/principles-marketing/pages/18-1-retailing-and-the-role-of-retailers-in-the-distribution-channel

### authored-extended-vocation-marine-hemisphere-change
- 유형: vocation-marine-navigation
- 정답: 3번
- 근거 및 유일정답 검토: NOAA 위·경도 좌표와 반구 정의. 실제 대권 항로·해상 거리의 방향으로 오해하지 않도록 좌표값 변화만 비교한다고 명시.
- 출처: https://oceanservice.noaa.gov/education/tutorial_nautical_charts/nautical_charts02_information_2b.html

### authored-extended-vocation-marine-same-coordinate
- 유형: vocation-marine-navigation
- 정답: 1번
- 근거 및 유일정답 검토: NOAA 경선·위선·방향 기호 설명. 같은 경도의 반대쪽 경선이나 위치 동일성을 혼동하지 않도록 방향까지 명시.
- 출처: https://oceanservice.noaa.gov/education/tutorial_nautical_charts/nautical_charts02_information_2b.html

### authored-extended-vocation-development-schema-two-stages
- 유형: vocation-development-cognitive
- 정답: 4번
- 근거 및 유일정답 검토: 피아제 동화/조절 개념만 참고. 참고 자료의 개·양 사례를 사용하지 않고 컵 도식의 연속 2단계 사례를 새로 작성했다. 아동의 연령·발달 지연을 판단하지 않는다.
- 출처: https://openstax.org/books/psychology-2e/pages/9-2-lifespan-theories

### authored-extended-vocation-development-direction-individual-pace
- 유형: vocation-development-principles
- 정답: 3번
- 근거 및 유일정답 검토: OpenStax 영아 신체 발달의 두미 방향과 개별 발달 시점 차이. 임상적 월령 기준이나 진단·치료 정보는 포함하지 않는다.
- 출처: https://openstax.org/books/lifespan-development/pages/3-2-physical-development-in-infants-and-toddlers



## 과학탐구


검토일: 2026-11-22 (한국시간). 범위는 물리학Ⅰ·Ⅱ, 화학Ⅰ·Ⅱ, 생명과학Ⅰ·Ⅱ, 지구과학Ⅰ·Ⅱ 각각 2문항, 총 16문항이다. 문항·선택지·힌트·풀이·오답 해석은 새로 작성했다. 기존 24개 과학 개념 문항과 동일 발문은 없다. 모든 topicId는 기존 앱 목록에 있고 원문 기출의 대응 유형 수가 1건 이상임을 확인했다. 수능 원문·공식 해설 또는 다음 시험 출제 예측으로 표시하지 않는다.

각 문항에는 답 1개, 서로 다른 선택지 5개, 풀이 4단계, 오개념 2개, 선택지별 해석 5개를 넣었다. 아래 검토는 자체 계산과 자료 대조이며 독립된 인간 교사 감수를 뜻하지 않는다.

| 문항 ID 끝부분 | 정답(1부터) | 독립 유도·검토 | 명시한 가정·단일 정답의 근거 |
|---|---:|---|---|
| science-physics1-opposite-carts | 3 | p=2×4+3×(−1)=5, m=5이므로 v=+1m/s. Ki=16+1.5=17.5J, Kf=2.5J, 차이 15J. | 같은 직선, 충돌 후 붙음, 수평 외부 총충격량 0. 방향과 에너지 감소를 함께 만족하는 선택지는 3뿐이다. |
| science-physics1-fixed-frequency-boundary | 5 | λA=24/40=0.60m, λB=16/40=0.40m. fB=40Hz. | 진동원·경계·관찰자 정지, 주파수 보존 조건을 직접 제시. 반사·진폭 정보 불필요. |
| science-chemistry1-mix-then-dilute | 2 | n합=.3×.2+.6×.1=.12mol. 혼합 농도=.12/.3=.4mol/L. 150mL에는 .06mol, 최종 .3L에서 .2mol/L. | 같은 용질, 반응·증발 없음, 부피 가산, 충분한 혼합, 최종 부피 명시. |
| science-chemistry1-atoms-in-two-samples | 4 | A는 CO₂ .5mol×3=원자1.5mol. B는 H₂O1mol×3=원자3mol. NB/NA=2. | 순수 분자 물질, 몰질량 문제에 제공, 전체 원자 개수와 원자 종류 수 구분. |
| science-biology1-dominant-offspring-condition | 1 | (Aa 비율1/2)/(AA+Aa 비율3/4)=2/3. | 상염색체 단일 유전자, 완전 우성, 생식세포 균등, 수정·생존 편향 없음, 이론적 확률. |
| science-biology1-unequal-transfer-efficiency | 3 | 600/4000=.15, 600/40000=.015. 10%×15%=1.5%로 교차 확인. | 같은 면적·기간의 단일 먹이 경로, 다른 경로 에너지 유입 없음. 실제 자연의 효율을 10%로 고정하지 않음. |
| science-earth1-parent-daughter-ratio | 5 | 초기X=현재X+현재Y=8단위, 잔존비1/8, 반감기3회×2억=6억 년. | 초기Y=0, X1개→안정Y1개, X·Y 유출입 및 타 Y 생성 없음. |
| science-earth1-brightness-temperature-radius | 2 | 같은 F, 거리비2이므로 LA/LB=4. 반지름비²=4/(2⁴)=1/4, 양의 반지름비1/2. | 구형 흑체, 모든 파장 합산 겉보기 밝기, 성간흡수 무시, 두 관계식 제공. |
| science-physics2-isolated-capacitor-dielectric | 4 | Q=4×6=24μC 일정. V=24/8=3V, U=QV/2=36μJ. U초기=4×6²/2=72μJ와 비교해 절반. | 전원 완전 분리, 전하 누설 없음. 전체 계 에너지 대신 축전기 저장 전기 에너지를 물음. |
| science-physics2-decreasing-outward-field | 1 | ΔΦ=.02×(.40−.10)=.006Wb/회로. ε=50×.006/.30=1V. 바깥 선속 감소를 보충하는 바깥 자기장은 반시계 전류. | 코일면 수직 균일 외부B, 50회 모두 같은 선속, 유한 양의 저항, 자체 유도 무시, 보는 방향 명시. |
| science-chemistry2-compression-reaction-quotient | 5 | K=.4²/(.2²×.1)=40. 압축 후 Q=.8²/(.4²×.2)=20. Q<K→정반응. 계수 변화로는 Q/K=2²/2³=1/2. | 온도 일정, 부피1/2, 이상 기체 혼합물, 압축 직후 화학반응 전, 유출입 없음. 단순 농도 수치식 비교라고 명시. |
| science-chemistry2-reverse-and-scale-path | 2 | −R1+R2의 엔탈피=+150−260=−110kJ, 목표는2배이므로 −220kJ. 반응식 원자 보존: 4XY+2Y₂→4XY₂. | 가상의 원소 및 제시한 기체 반응값, 동일 온도·압력·상태. 실제 표준 생성열 수치를 인용한 문제가 아님. |
| science-biology2-reverse-template-direction | 3 | DNA 주형5′-GCTTAC-3′ ↔ RNA3′-CGAAUG-5′를 역순으로 읽어5′-GUAAGC-3′. 문자열 역상보 변환으로도 검증. | 주형 여부 확정, 전사 영역 내부6염기, 가공·번역·시작/종결 조건 불요. |
| science-biology2-dominant-carrier-frequency | 4 | q=√.16=.4, p=.6, 2pq=.48. 우성 표현형 비율 .84이므로 .48/.84=4/7. | 매우 큰 이배체·상염색체·A완전우성·하디바인베르크 평형·생존율 차이 없음. |
| science-earth2-six-month-displacement | 2 | 관측 전체 위치차 .080=2p이므로 p=.040초각. d=1/.040=25pc. | 원형1AU 지구 궤도, 정확히 반대지점6개월, 황도북극 방향, 고유운동·배경시차 제거, 소각근사. |
| science-earth2-elliptic-apsides | 5 | a=(r최소+r최대)/2=(2+16)/2=9AU. P²=9³=729, P=27년. | 태양초점 타원, 작은 천체 질량·타천체 영향 무시. AU·년 단위의 식 제공. |

### 확인한 1차 교육 자료

모든 아래 URL을 웹 도구로 직접 열고 해당 개념을 대조했다. URL은 새 문항의 정답을 제공하는 공식 해설 링크가 아니라 원리 참고 자료다. 긴 직접 인용이나 외부 문항을 재사용하지 않았다.

- [OpenStax Physics §8.3](https://openstax.org/books/physics/pages/8-3-elastic-and-inelastic-collisions): 외력/외부 충격량이 없을 때 총운동량 보존, 붙는 비탄성 충돌에서 운동 에너지 변화.
- [OpenStax Physics §13.2](https://openstax.org/books/physics/pages/13-2-wave-properties-speed-amplitude-frequency-and-period): v=fλ.
- [OpenStax Physics §16.2](https://openstax.org/books/physics/pages/16-2-refraction): 매질 경계 통과 시 진동수 유지. 새 파동 문항에서는 이를 조건으로도 명시.
- [OpenStax Chemistry 2e §3.3](https://openstax.org/books/chemistry-2e/pages/3-3-molarity): 몰 농도, 혼합물의 균일성, 희석의 용질 몰수 보존.
- [OpenStax Chemistry 2e §3.1](https://openstax.org/books/chemistry-2e/pages/3-1-formula-mass-and-the-mole-concept): 질량→몰수→분자/원자 개수 전환.
- [OpenStax Biology 2e §12.3](https://openstax.org/books/biology-2e/pages/12-3-laws-of-inheritance): 대립유전자 분리, 단성 교배1:2:1와 완전 우성 표현형3:1.
- [OpenStax Biology 2e §46.2](https://openstax.org/books/biology-2e/pages/46-2-energy-flow-through-ecosystems): 영양 단계별 에너지 흐름과 전달 효율, 호흡·열로의 에너지 전환.
- [OpenStax Astronomy §7.3](https://openstax.org/books/astronomy/pages/7-3-dating-planetary-surfaces): 모원소·자원소 비율에 따른 방사성 연대 측정. 새 문항은 초기값과 닫힌 계를 별도로 명시.
- [OpenStax Astronomy 2e §5.1](https://openstax.org/books/astronomy-2e/pages/5-1-the-behavior-of-light): 겉보기 밝기의 거리 역제곱 법칙.
- [OpenStax Astronomy 2e §5.2](https://openstax.org/books/astronomy-2e/pages/5-2-the-electromagnetic-spectrum): 구형 흑체의 L∝R²T⁴.
- [OpenStax University Physics Vol.2 §8.4](https://openstax.org/books/university-physics-volume-2/pages/8-4-capacitor-with-a-dielectric): 전원 분리 후 Q 일정, 유전체에 따른 C 증가 및 V 감소.
- [OpenStax University Physics Vol.2 §8.3](https://openstax.org/books/university-physics-volume-2/pages/8-3-energy-stored-in-a-capacitor): U=CV²/2=Q²/(2C)=QV/2.
- [OpenStax University Physics Vol.2 §13.2](https://openstax.org/books/university-physics-volume-2/pages/13-2-lenzs-law): 감소하는 바깥 방향 선속에 대한 반시계 유도 전류와 오른손 법칙.
- [OpenStax College Physics 2e §23.2](https://openstax.org/books/college-physics-2e/pages/23-2-faradays-law-of-induction-lenzs-law): N회 코일의 유도 기전력 크기 N|ΔΦ|/Δt.
- [OpenStax Chemistry 2e §13.2](https://openstax.org/books/chemistry-2e/pages/13-2-equilibrium-constants): 반응계수에 따른 농도 지수와 Q/K 비교.
- [OpenStax Chemistry: Atoms First 2e §13.3](https://openstax.org/books/chemistry-atoms-first-2e/pages/13-3-shifting-equilibria-le-chateliers-principle): 부피·농도 변화 후 Q<K일 때 정반응 우세.
- [OpenStax Chemistry 2e §5.3](https://openstax.org/books/chemistry-2e/pages/5-3-enthalpy): 반응 역전 시 ΔH 부호 반전, 계수 배수에 따른 ΔH 배수, 헤스 법칙.
- [OpenStax Biology 2e §15.2](https://openstax.org/books/biology-2e/pages/15-2-prokaryotic-transcription): 주형과 RNA 역평행·상보성 및5′→3′합성, T/U 구분.
- [OpenStax Biology 2e §19.1](https://openstax.org/books/biology-2e/pages/19-1-population-evolution): 평형 대립유전자와 유전자형 빈도 p²:2pq:q².
- [OpenStax Astronomy 2e §19.2](https://openstax.org/books/astronomy-2e/pages/19-2-surveying-the-stars): 1AU에 대한 연주 시차 정의와 d(pc)=1/p(초각).
- [NASA Orbits and Kepler's Laws](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/): 태양이 타원의 초점에 놓임과 P²∝a³.
- [OpenStax Astronomy 2e §3.1](https://openstax.org/books/astronomy-2e/pages/3-1-the-laws-of-planetary-motion): 긴반지름과 궤도 공전 주기의 관계 및 AU·년 단위 사용.

### 검증 결과와 한계

- JSON 파싱, 정확히16문항/8과목각2문항, ID 중복 없음, 기존 topicId와 동일 과목, 모든 선택 topic에 실제 기출 유형 레코드 존재, 기존 발문과 중복 없음, 5개 선택지·5개 해석, 4단계 풀이·2개 오개념 검사를 통과했다.
- 숫자형15문항은 생성 함수와 별개 수식으로 expectedValue를 재계산해 일치했다. 복합 정답의 운동 에너지 변화15J·축전기36μJ·에너지 전달15%도 추가 검산했다. 전사 문항은 문자열 역상보 계산으로 확인했다.
- 실험·관측 자료는 학습을 위해 자체 정한 자료 또는 모형 조건이다. 실제 관측 데이터나 시험 출제 통계로 표시하면 안 된다.
- 단원·문항 난도는 자체 응용 학습 분류이며, 전체 교육과정·실제 수능 난도를 대표하지 않는다.


## 제2외국어·한문


작성 기준: 9개 현행 학습 과목에 2개씩 추가한 자체 연습문제다. 실제 기출·공식 예상문제·공식 해설이 아니다. 교과 전체 범위 또는 실제 수능 난도 분포를 대표하지 않는다. 원어민·교사 전수 감수를 받았다고 표시하지 않는다.

검사: 기존 topicId 및 실제 기출 유형 연결 수>0, 5개 구별되는 선택지, 고유 정답, 3단계 이상 풀이, 선택지 해석 5개, 전체 한국어 해석, 핵심 어휘 3개 이상을 확인했다. 아랍어는 RTL 표시다. 출처는 언어 개념 참고이며 자체 지문·보기의 출처를 뜻하지 않는다.

모든 일정·운영 시간·시설 위치·인물 대화는 이 문제를 위해 부여한 가정이다. 실제 기관의 현재 운영 정보를 나타내지 않는다.

### authored-extended-language-german-uninterrupted-study

- 정답: 1번 — 10:00 Uhr
- 단독 정답·출처 범위: Goethe A1 glossary에서 Öffnungszeit·geschlossen·von…bis 및 시각 표현을 확인했다. 연속 이용 가능 시간은 문제에 부여한 자체 시간표에서 계산했다: 10:00+90분=11:30≤12:00; 나머지 후보는 중간 휴관 또는 17:00 폐관에 걸린다.
- 확인 URL: https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18.pdf
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-german-speaker-change

- 정답: 4번 — lernen
- 단독 정답·출처 범위: Goethe A1 glossary의 ich/wir/ihr 및 주어에 맞춘 현재형 사용을 기초 범위로 참고했다. 응답 주어 Wir는 1인칭 복수여서 lernen만 해당하고, lernten은 과거형이다. 질문의 ihr와 응답의 Wir를 의도적으로 구분했다.
- 확인 URL: https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18.pdf
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-french-changed-workshop

- 정답: 3번 — 15 h 00
- 단독 정답·출처 범위: TV5MONDE A1 Dire l’heure에서 24시간 표기 및 시간 전후 표현을 확인했다. 문제의 변경 시각은 자체 구성. 15:10−10분=15:00으로 유일하다.
- 확인 URL: https://apprendre.tv5monde.com/fr/aides/grammaire-dire-lheure
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-french-two-drink-constraints

- 정답: 5번 — Je voudrais un café sans lait et un verre d’eau, s’il vous plaît.
- 단독 정답·출처 범위: TV5MONDE 문법 안내와 s’il vous plaît 사전 항목을 정중한 요청의 기초 참고로 사용했다. 정답은 커피 1잔·우유 없음·물 1잔 세 조건을 모두 만족한다. 나머지 보기는 모두 문법상 가능한 주문이지만 한 가지 이상의 주문 조건이 다르다.
- 확인 URL: https://apprendre.tv5monde.com/fr/aides/grammaire ; https://langue-francaise.tv5monde.com/decouvrir/dictionnaire/s/s%27il%20vous%20pla%C3%AEt
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-spanish-rescheduled-meeting

- 정답: 4번 — 목요일 오후 6시
- 단독 정답·출처 범위: RAE-ASALE 문법의 ahora·시간 지시 부사 범위를 확인했다. 메시지에 제공한 요일·시각은 자체 가정이다. 현재 계획 jueves/seis de la tarde 둘을 조합하는 보기만 맞다. Cervantes 검색 인덱스에서는 A1–A2 범위를 확인했으나 직접 페이지는 유지보수로 리디렉션되어 최종 sourceRefs에서는 제외했다.
- 확인 URL: https://temporalweb.asale.org/gram%C3%A1tica/sintaxis/adverbios-de-tiempo-i-adverbios-referenciales-y-de-duraci%C3%B3n
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-spanish-landmark-matching

- 정답: 2번 — 호텔은 은행과 약국 사이에 있고, 도서관은 호텔 맞은편에 있다.
- 단독 정답·출처 범위: RAE-ASALE DPD entre에서 두 기준물 사이의 위치, KOCW 부산외국어대 강의 PDF에서 entre 및 enfrente de 위치 표현을 확인했다. 호텔=은행과 약국 사이, 도서관=호텔 맞은편이라는 두 제공 사실로 정답을 결정한다.
- 확인 URL: https://temporalweb.asale.org/dpd/entre ; https://contents2.kocw.or.kr/KOCW/document/2018/bufs/rosa271/13.pdf
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-chinese-two-object-classifiers

- 정답: 4번 — 本 · 张
- 단독 정답·출처 범위: 대만 교육부 사전 本의 책 양사 용법 및 張의 평면 물품 양사 용법을 직접 열어 확인했다. 本·张만 주어진 두 명사에 모두 맞는다. 사전은 번체 표기이나 앱 문항은 중국어Ⅰ 학습용 간체 书·张·纸로 구성했다.
- 확인 URL: https://dict.revised.moe.edu.tw/dictView.jsp?ID=269&la=0&powerMode=0 ; https://dict.concised.moe.edu.tw/dictView.jsp?ID=30132&la=0&powerMode=0
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-chinese-before-return-errand

- 정답: 2번 — 서점 → 도서관 → 우체국 → 집
- 단독 정답·출처 범위: 부모 독립 검토 제안을 반영하여 从图书馆出来以后를 추가했다. 이제 서점→10시 도서관→도서관에서 나온 뒤 우체국→然后 11시30분 귀가가 명시적 순서다. 대만 교육부 以後 항목에서 ~뒤 의미를 확인했다. 以前 관련 근거는 최종 데이터에서 제거했다.
- 확인 URL: https://dict.revised.moe.edu.tw/dictView.jsp?ID=150771
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-japanese-time-and-place

- 정답: 5번 — に · で
- 단독 정답·출처 범위: 일본국제교류기금 Irodori Grammar_all.pdf의 날짜·시각 に / 행사·동작 장소 で를 참고했다. 三時に/図書館で가 제시된 선택지 중 유일하게 적절하다. 회화에서 시간 に를 생략하는 가능성을 시험하지 않는다. 생략 선택지가 없으며 전부 조사 두 개를 채우는 문제다.
- 확인 URL: https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-japanese-exceptional-opening

- 정답: 3번 — 다음 주 목요일에 특별히 오전 10시부터 오후 3시까지 열기 때문이다.
- 단독 정답·출처 범위: Irodori 초급 시간·요일·から/まで 학습 범위를 참고했다. 휴관 예외와 시간 구간은 자체 안내문이다. 다음 주 목요일 특별 10~15시 개관, 14시는 그 안에 포함되므로 정답 하나다.
- 확인 URL: https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-russian-speaker-and-number

- 정답: 3번 — читаем
- 단독 정답·출처 범위: russky.info 교재 발행자의 동사 문법에서 현재형 читаю/читаем과 인칭·수 변화를 직접 확인했다. Gramota 검색 인덱스도 일치했으나 직접 열기는 403이어서 최종 sourceRefs를 접근 가능한 교재로 바꿨다. 응답 주어 Мы에 читаем만 맞는다.
- 확인 URL: https://russky.info/grammar/verbs?hl=ru
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-russian-continuous-workshop

- 정답: 1번 — 10:00
- 단독 정답·출처 범위: 탐보프 국립기술대 러시아어 교육 PDF의 с…до 시간 경계 표현을 직접 확인했다(문서의 시간 전치사 부분). 자체 시간표에서 10~12시만 제시된 후보 중 2시간이 연속으로 확보된다. 다른 쪽의 역사·일반상식 내용은 문항 근거로 사용하지 않았다.
- 확인 URL: https://tstu.ru/book/elib1/pdf/2024/barkova.pdf
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-arabic-changed-library-day

- 정답: 4번 — 화요일
- 단독 정답·출처 범위: Aljazeera Arabic의 الاثنين 요일 표기 설명과 월·화요일 표현이 나오는 학습 읽기 자료를 직접 확인했다. 사실 사건·라마단 날짜를 이 문제로 옮기지 않았다. 매주 월요일/이번 주 화요일의 자체 도서관 일정 대비다.
- 확인 URL: https://learning.aljazeera.net/ar/asktheteacher/pages/21966 ; https://learning.aljazeera.net/ar/node/20037
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-arabic-meeting-landmarks

- 정답: 1번 — 도서관 옆이면서 학교 앞인 카페
- 단독 정답·출처 범위: Aljazeera Arabic 의문 도구 설명에서 أين가 장소를 묻는 말임을 직접 확인했다. 만남의 장소와 두 위치 조건은 자체 대화다. 카페이며 도서관 옆·학교 앞 두 관계를 모두 충족해야 한다.
- 확인 URL: https://learning.aljazeera.net/ar/node/19484?Level=1
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-vietnamese-completed-versus-pending

- 정답: 5번 — Tôi đã trả sách rồi.
- 단독 정답·출처 범위: VOV 한국어 베트남어 강의 51회에서 Đã…chưa 및 긍정 응답 rồi/부정 응답 chưa를 직접 확인했다. 오늘 아침 반납했다는 자체 후속 문장이 완료 긍정을 강제하므로 다섯 보기 중 đã trả sách rồi만 맞는다. đã를 모든 과거 문장의 필수 표지로 일반화하지 않았다.
- 확인 URL: https://vov.vn/ko-KR/ibe-chagchag-butneun-beteunameo/51hoe-da-chua-haessseubnikka-2356804.vov
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-vietnamese-two-day-switch

- 정답: 4번 — 공부 화요일 · 배드민턴 토요일
- 단독 정답·출처 범위: VOV 중국어 베트남어 강의가 제시한 thứ hai~chủ nhật와 월~일 대응을 직접 확인했다. 평소 월·금에서 다음 주 화·토로 바꾼 자체 일정이며 두 요일을 모두 바꿔야 정답이다.
- 확인 URL: https://vov.vn/zh-CN/tingyouluntan/yuenanyujiangzuohen-gapyuehui-1493269.vov
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-hanmun-agent-patient-comparison

- 정답: 2번 — ㉠은 형이 아우를, ㉡은 아우가 형을 가르친다.
- 단독 정답·출처 범위: 한문과 교육과정 원문 PDF(교과서 출판사 제공)의 [12한문Ⅰ02-01/02]에서 문장 성분·주술목 구조·기본 술목 어순을 확인했다. 자체 평서문이며 기본 어순임을 명시해 도치/사동 해석 논란을 제한했다. 각 글자 뜻을 문제에 제공해 외부 인물 지식에 의존하지 않는다.
- 확인 URL: https://textbook-miraen.cdn.x-cdn.com/textbook/newbook/curriculum/%EB%B3%84%EC%B1%8517_%ED%95%9C%EB%AC%B8%EA%B3%BC%20%EA%B5%90%EC%9C%A1%EA%B3%BC%EC%A0%95.pdf
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.

### authored-extended-language-hanmun-apply-review-insight

- 정답: 4번 — 서연: 과거 실험에서 틀린 이유를 다시 검토하여 새 실험의 조건을 개선한다.
- 단독 정답·출처 범위: 대만 교육부 간편국어사전 溫故知新 항목에서 기존 학습의 복습을 통해 새로운 지식·깨달음을 얻는 뜻을 확인했다. 4번만 이전 기록 재검토와 새 실험 개선을 모두 포함한다. 고전의 문장이나 일화를 현대 상황으로 둔갑시킨 것이 아닌 자체 적용 사례다.
- 확인 URL: https://dict.concised.moe.edu.tw/dictView.jsp?ID=43818&la=0&powerMode=0
- 한계: 자체 작성 및 내부 언어·조건 대조이며 외부 원어민 감수는 미실시.
