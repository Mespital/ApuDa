import {APPLIED_QUESTIONS} from './applied-content.mjs';
// 자체 구성 기본 연습. 원문 기출과 구분합니다.
export const EXTRA_TOPICS=[
  {
    "id": "korean-common-poetic-personification",
    "courseId": "korean-common",
    "label": "시적 표현과 의인",
    "description": "앉는 행동을 누가 하고 있는지 보세요.",
    "concept": "의인(personification)은 사람이 아닌 대상에 사람의 행동이나 성질을 부여하는 표현입니다. 표현의 효과는 실제 시구를 근거로 해석합니다.",
    "formula": ""
  },
  {
    "id": "korean-common-narrator",
    "courseId": "korean-common",
    "label": "서술자와 시점",
    "description": "나가 이야기의 중심인지, 남을 지켜보는 인물인지 구분하세요.",
    "concept": "1인칭 주인공 시점은 이야기의 중심인 내가 자신의 경험과 내면을 직접 서술합니다. 등장인물을 관찰만 하는 1인칭 관찰자와 구분합니다.",
    "formula": ""
  },
  {
    "id": "korean-speech-audience",
    "courseId": "korean-speech",
    "label": "청중을 고려한 발표",
    "description": "발표 목표와 청중의 배경지식을 함께 보세요.",
    "concept": "발표는 청중의 배경지식과 관심, 상황에 맞게 용어와 사례를 조정해야 합니다. 전문 용어가 꼭 필요하면 쉬운 설명을 함께 제공합니다.",
    "formula": ""
  },
  {
    "id": "korean-speech-negotiation",
    "courseId": "korean-speech",
    "label": "협상과 공동의 이익",
    "description": "양쪽이 조정할 수 있다고 밝힌 조건을 활용하세요.",
    "concept": "협상은 각자의 요구 이면에 있는 관심을 파악하고 수용 가능한 대안을 찾는 과정입니다. 일방적인 양보 강요보다 공동의 이익을 검토합니다.",
    "formula": ""
  },
  {
    "id": "korean-speech-survey",
    "courseId": "korean-speech",
    "label": "자료의 대표성과 일반화",
    "description": "누가 어떤 방식으로 응답했는지 확인하세요.",
    "concept": "표본의 대표성은 모집단의 특성을 적절히 반영하는지를 뜻합니다. 자발적 응답 자료를 모든 사람의 의견으로 일반화할 때는 선택 편향을 점검합니다.",
    "formula": ""
  },
  {
    "id": "korean-speech-revision",
    "courseId": "korean-speech",
    "label": "주장과 근거를 연결하는 고쳐쓰기",
    "description": "제시한 해결책이 모든 원인에 대응하는지 살펴보세요.",
    "concept": "주장하는 해결책이 실제 문제의 원인에 대응하는지 확인합니다. 새로운 자료를 넣을 때는 결론을 뒷받침하는지 검토합니다.",
    "formula": ""
  },
  {
    "id": "korean-language-nasalization",
    "courseId": "korean-language",
    "label": "비음화와 음운 교체",
    "description": "어느 자음이 무엇으로 바뀌었는지 비교하세요.",
    "concept": "받침 ㄱ·ㄷ·ㅂ이 뒤의 ㄴ·ㅁ 앞에서 각각 ㅇ·ㄴ·ㅁ으로 바뀌는 비음화는 음운 교체의 예입니다.",
    "formula": ""
  },
  {
    "id": "korean-language-sentence-role",
    "courseId": "korean-language",
    "label": "문장 성분과 부사어",
    "description": "동작의 주체·대상·장소를 나누어 보세요.",
    "concept": "부사어는 용언이나 문장 전체 등을 수식합니다. 동작이 이루어지는 장소를 나타내는 말도 부사어가 될 수 있습니다.",
    "formula": ""
  },
  {
    "id": "korean-language-word-class",
    "courseId": "korean-language",
    "label": "관형사와 부사",
    "description": "두 말이 각각 무엇을 꾸미는지 확인하세요.",
    "concept": "관형사는 체언을 수식하고 부사는 주로 용언 등을 수식합니다. 문장 성분과 품사를 구분하고 실제로 꾸미는 말을 확인합니다.",
    "formula": ""
  },
  {
    "id": "korean-language-media-check",
    "courseId": "korean-language",
    "label": "매체 정보의 신뢰성",
    "description": "숫자의 출처와 비교 기준을 먼저 확인하세요.",
    "concept": "매체 정보는 원자료·작성 시점·작성 주체·자료 수집 방법을 함께 확인합니다. 조회 수나 공유 횟수만으로 정확성을 판단할 수 없습니다.",
    "formula": ""
  },
  {
    "id": "english-agreement",
    "courseId": "english",
    "label": "주어와 동사의 수 일치",
    "description": "of 뒤 명사보다 문장의 중심 주어를 찾으세요.",
    "concept": "Each of + 복수 명사에서 중심 주어 each는 단수로 취급합니다. 가까이에 있는 복수 명사에 끌려 동사를 고르지 마세요.",
    "formula": ""
  },
  {
    "id": "english-notice",
    "courseId": "english",
    "label": "안내문 조건 읽기",
    "description": "optional과 must include의 차이를 확인하세요.",
    "concept": "안내문은 기한·필수 조건·선택 조건을 구분해 읽습니다. optional은 선택 사항, required는 필수 사항입니다.",
    "formula": ""
  },
  {
    "id": "korean-history-bone-rank",
    "courseId": "korean-history",
    "label": "신라의 신분제",
    "description": "골품제는 신라에서 혈통에 따라 관직 진출과 생활 범위를 제한한 신분 제도이다.",
    "concept": "골품제는 신라에서 혈통에 따라 관직 진출과 생활 범위를 제한한 신분 제도이다. 제도의 이름과 실시 국가를 함께 연결한다.",
    "formula": ""
  },
  {
    "id": "korean-history-gwangjong",
    "courseId": "korean-history",
    "label": "고려 광종의 왕권 강화",
    "description": "고려 광종은 노비안검법과 과거제 시행으로 왕권을 강화하고 새로운 인재 등용을 추진하였다.",
    "concept": "고려 광종은 노비안검법과 과거제 시행으로 왕권을 강화하고 새로운 인재 등용을 추진하였다. 노비안검법은 본래 양인이었으나 불법적으로 노비가 된 사람을 조사해 양인으로 돌리는 정책이었다.",
    "formula": ""
  },
  {
    "id": "korean-history-gabo",
    "courseId": "korean-history",
    "label": "갑오개혁과 신분제 폐지",
    "description": "1894년 갑오개혁에서는 신분제와 공사노비제를 법적으로 폐지하는 개혁이 추진되었다.",
    "concept": "1894년 갑오개혁에서는 신분제와 공사노비제를 법적으로 폐지하는 개혁이 추진되었다. 법적 폐지와 실제 사회에서 신분 관념이 완전히 사라지는 것은 구분해야 한다.",
    "formula": ""
  },
  {
    "id": "korean-history-march-first",
    "courseId": "korean-history",
    "label": "3·1 운동과 임시정부",
    "description": "1919년 3·1 운동은 전국적으로 전개된 독립운동이며 대한민국 임시정부 수립의 계기가 되었다.",
    "concept": "1919년 3·1 운동은 전국적으로 전개된 독립운동이며 대한민국 임시정부 수립의 계기가 되었다. 여러 독립운동의 연도와 선후 관계를 구분한다.",
    "formula": ""
  },
  {
    "id": "social-life-ethics-kant-dignity",
    "courseId": "social-life-ethics",
    "label": "칸트와 인간 존엄성",
    "description": "칸트는 인간을 단지 수단으로만 대하지 않고 동시에 목적으로 대할 것을 강조한다.",
    "concept": "칸트는 인간을 단지 수단으로만 대하지 않고 동시에 목적으로 대할 것을 강조한다. 좋은 결과만으로 기만이나 인간 도구화를 정당화할 수 있다고 보지 않는다.",
    "formula": ""
  },
  {
    "id": "social-life-ethics-utilitarian-choice",
    "courseId": "social-life-ethics",
    "label": "공리주의와 결과 평가",
    "description": "공리주의는 행위가 관련된 사람들의 행복과 고통에 미치는 결과를 중요하게 평가한다.",
    "concept": "공리주의는 행위가 관련된 사람들의 행복과 고통에 미치는 결과를 중요하게 평가한다. 자기 이익만을 더하는 이기주의와 구분하며, 아래 계산은 가상의 동일 척도를 전제로 한다.",
    "formula": ""
  },
  {
    "id": "social-life-ethics-rawls-veil",
    "courseId": "social-life-ethics",
    "label": "롤스의 무지의 베일",
    "description": "롤스의 원초적 입장에서는 자신의 사회적 지위나 타고난 능력 등의 우연적 조건을 모르는 무지의 베일을 가정한다.",
    "concept": "롤스의 원초적 입장에서는 자신의 사회적 지위나 타고난 능력 등의 우연적 조건을 모르는 무지의 베일을 가정한다. 공정한 정의 원칙을 선택하기 위한 사고 장치이다.",
    "formula": ""
  },
  {
    "id": "social-life-ethics-singer-sentience",
    "courseId": "social-life-ethics",
    "label": "싱어와 이익의 평등한 고려",
    "description": "싱어는 고통을 느낄 수 있는 능력에 주목하여 동물의 이익도 도덕적으로 고려해야 한다고 주장한다.",
    "concept": "싱어는 고통을 느낄 수 있는 능력에 주목하여 동물의 이익도 도덕적으로 고려해야 한다고 주장한다. 이익을 평등하게 고려한다는 것이 모든 존재를 언제나 똑같이 대우한다는 뜻은 아니다.",
    "formula": ""
  },
  {
    "id": "social-ethics-confucius-ren",
    "courseId": "social-ethics",
    "label": "공자의 인과 예",
    "description": "공자는 인(仁)을 핵심 덕목으로 삼고 예(禮)의 실천과 도덕적 수양을 강조하였다.",
    "concept": "공자는 인(仁)을 핵심 덕목으로 삼고 예(禮)의 실천과 도덕적 수양을 강조하였다. 인은 단순한 자기 이익의 확대와 구분된다.",
    "formula": ""
  },
  {
    "id": "social-ethics-mencius-four",
    "courseId": "social-ethics",
    "label": "맹자의 사단",
    "description": "맹자는 사람에게 선한 마음의 싹인 사단이 있다고 보았다.",
    "concept": "맹자는 사람에게 선한 마음의 싹인 사단이 있다고 보았다. 측은지심은 인의 단서이며 수오지심·사양지심·시비지심은 각각 의·예·지의 단서이다.",
    "formula": ""
  },
  {
    "id": "social-ethics-xunzi-education",
    "courseId": "social-ethics",
    "label": "순자의 성악설과 교화",
    "description": "순자는 욕구를 그대로 따를 때 다툼이 생길 수 있다고 보고 예와 교육을 통한 후천적 노력을 강조하였다.",
    "concept": "순자는 욕구를 그대로 따를 때 다툼이 생길 수 있다고 보고 예와 교육을 통한 후천적 노력을 강조하였다. 성악설을 선해질 수 없다는 운명론으로 이해해서는 안 된다.",
    "formula": ""
  },
  {
    "id": "social-ethics-aristotle-virtue",
    "courseId": "social-ethics",
    "label": "아리스토텔레스와 중용",
    "description": "아리스토텔레스는 도덕적 덕이 반복적인 실천과 습관을 통해 형성된다고 보았다.",
    "concept": "아리스토텔레스는 도덕적 덕이 반복적인 실천과 습관을 통해 형성된다고 보았다. 중용은 상황에 적절한 선택이며 두 수치의 산술 평균으로 환원되지 않는다.",
    "formula": ""
  },
  {
    "id": "social-korea-geography-relief",
    "courseId": "social-korea-geography",
    "label": "한반도의 지형 특성",
    "description": "한반도는 대체로 동쪽이 높고 서쪽이 낮은 지형 특성을 보인다.",
    "concept": "한반도는 대체로 동쪽이 높고 서쪽이 낮은 지형 특성을 보인다. 태백산맥과 동서 해안의 지형 차이를 함께 살핀다.",
    "formula": ""
  },
  {
    "id": "social-korea-geography-annual-range",
    "courseId": "social-korea-geography",
    "label": "기온의 연교차",
    "description": "기온의 연교차는 최난월 평균 기온에서 최한월 평균 기온을 뺀 값이다.",
    "concept": "기온의 연교차는 최난월 평균 기온에서 최한월 평균 기온을 뺀 값이다. 같은 위도라도 해양의 영향을 받는 정도와 지형 등에 따라 차이가 날 수 있다.",
    "formula": "R=T_{max}-T_{min}"
  },
  {
    "id": "social-korea-geography-river-deposition",
    "courseId": "social-korea-geography",
    "label": "하천의 침식과 퇴적",
    "description": "하천은 흐르는 과정에서 지표를 깎는 침식, 물질을 옮기는 운반, 물질을 쌓는 퇴적 작용을 한다.",
    "concept": "하천은 흐르는 과정에서 지표를 깎는 침식, 물질을 옮기는 운반, 물질을 쌓는 퇴적 작용을 한다. 범람원은 하천이 범람할 때 운반 물질이 쌓여 형성될 수 있다.",
    "formula": ""
  },
  {
    "id": "social-korea-geography-dependency",
    "courseId": "social-korea-geography",
    "label": "노년 부양비 계산",
    "description": "노년 부양비는 15~64세 인구 100명당 65세 이상 인구의 수이다.",
    "concept": "노년 부양비는 15~64세 인구 100명당 65세 이상 인구의 수이다. 전체 인구에 대한 고령 인구의 비율인 고령 인구 비율과 분모가 다르다.",
    "formula": "D_o=\\frac{P_{65+}}{P_{15-64}}\\times100"
  },
  {
    "id": "social-world-geography-mediterranean",
    "courseId": "social-world-geography",
    "label": "지중해성 기후",
    "description": "지중해성 기후는 일반적으로 여름에 건조하고 겨울에 상대적으로 강수가 많은 특징을 보인다.",
    "concept": "지중해성 기후는 일반적으로 여름에 건조하고 겨울에 상대적으로 강수가 많은 특징을 보인다. 월별 기온과 강수량의 계절적 분포를 함께 읽는다.",
    "formula": ""
  },
  {
    "id": "social-world-geography-local-time",
    "courseId": "social-world-geography",
    "label": "경도와 지역시",
    "description": "지구가 24시간에 360° 자전한다고 단순화하면 경도 15° 차이는 지역시 1시간 차이에 해당한다.",
    "concept": "지구가 24시간에 360° 자전한다고 단순화하면 경도 15° 차이는 지역시 1시간 차이에 해당한다. 동쪽 지역의 지역시가 서쪽보다 앞선다. 표준시와 서머타임은 별도로 구분한다.",
    "formula": "\\Delta t=\\frac{\\Delta\\lambda}{15^\\circ}"
  },
  {
    "id": "social-world-geography-rainforest",
    "courseId": "social-world-geography",
    "label": "열대 우림 기후와 생활",
    "description": "열대 우림 기후는 연중 높은 기온과 풍부한 강수를 특징으로 한다.",
    "concept": "열대 우림 기후는 연중 높은 기온과 풍부한 강수를 특징으로 한다. 같은 열대라도 건기가 뚜렷한 사바나 기후와 구분한다.",
    "formula": ""
  },
  {
    "id": "social-world-geography-natural-increase",
    "courseId": "social-world-geography",
    "label": "인구의 자연 증가",
    "description": "인구의 자연 증가는 출생과 사망의 차이로 파악한다.",
    "concept": "인구의 자연 증가는 출생과 사망의 차이로 파악한다. 인구 이동에 의한 사회적 증가와 구분하며, 출생률·사망률의 분모와 단위를 확인한다.",
    "formula": "r_n=b-d"
  },
  {
    "id": "social-east-history-dynasty-order",
    "courseId": "social-east-history",
    "label": "중국 왕조의 선후 관계",
    "description": "당·송·원·명의 순서를 이해하면 동아시아 교류와 전쟁의 시대를 구분하는 데 도움이 된다.",
    "concept": "당·송·원·명의 순서를 이해하면 동아시아 교류와 전쟁의 시대를 구분하는 데 도움이 된다. 서로 겹쳐 존속한 여러 정권의 존재까지 모두 부정하는 순서표는 아니다.",
    "formula": ""
  },
  {
    "id": "social-east-history-mongol-japan",
    "courseId": "social-east-history",
    "label": "원의 일본 원정",
    "description": "13세기 후반 원은 고려와 함께 일본 원정을 시도하였다.",
    "concept": "13세기 후반 원은 고려와 함께 일본 원정을 시도하였다. 1592년에 시작된 일본의 조선 침략인 임진왜란과 침략의 방향·시대가 다르다.",
    "formula": ""
  },
  {
    "id": "social-east-history-imjin",
    "courseId": "social-east-history",
    "label": "임진왜란의 국제적 성격",
    "description": "1592년 시작된 임진왜란에서는 일본이 조선을 침략했고 명이 조선을 지원하였다.",
    "concept": "1592년 시작된 임진왜란에서는 일본이 조선을 침략했고 명이 조선을 지원하였다. 관련 국가와 당시 왕조를 함께 구분한다.",
    "formula": ""
  },
  {
    "id": "social-east-history-meiji",
    "courseId": "social-east-history",
    "label": "메이지 유신과 근대화",
    "description": "1868년을 전후한 메이지 유신으로 일본의 막부 체제가 무너지고 천황 중심의 새 정부가 수립되었다.",
    "concept": "1868년을 전후한 메이지 유신으로 일본의 막부 체제가 무너지고 천황 중심의 새 정부가 수립되었다. 이후 중앙집권화와 근대적 제도 정비가 추진되었다.",
    "formula": ""
  },
  {
    "id": "social-world-history-french-rights",
    "courseId": "social-world-history",
    "label": "프랑스 혁명과 인권 선언",
    "description": "1789년 프랑스 혁명 과정에서 인간과 시민의 권리 선언이 채택되었다.",
    "concept": "1789년 프랑스 혁명 과정에서 인간과 시민의 권리 선언이 채택되었다. 선언은 자유와 권리의 평등, 국민 주권 등의 원리를 제시하였다. 당시 실제 권리 적용의 한계와 선언의 원칙은 구분한다.",
    "formula": ""
  },
  {
    "id": "social-world-history-industrial",
    "courseId": "social-world-history",
    "label": "영국 산업혁명",
    "description": "18세기 후반 영국에서 기계화와 공장제 생산이 확대되며 산업혁명이 전개되었다.",
    "concept": "18세기 후반 영국에서 기계화와 공장제 생산이 확대되며 산업혁명이 전개되었다. 증기기관의 활용은 생산과 교통의 변화에 중요한 영향을 주었다.",
    "formula": ""
  },
  {
    "id": "social-world-history-printing",
    "courseId": "social-world-history",
    "label": "근대 초기 유럽의 인쇄술",
    "description": "15세기 중엽 구텐베르크와 관련된 인쇄술의 확산은 유럽에서 서적의 제작과 지식 전달을 확대하는 데 기여하였다.",
    "concept": "15세기 중엽 구텐베르크와 관련된 인쇄술의 확산은 유럽에서 서적의 제작과 지식 전달을 확대하는 데 기여하였다. 이는 세계 최초의 금속활자 발명이라는 뜻은 아니다.",
    "formula": ""
  },
  {
    "id": "social-world-history-cold-war",
    "courseId": "social-world-history",
    "label": "냉전과 양극 체제",
    "description": "제2차 세계 대전 이후 미국과 소련을 중심으로 정치·경제·군사적 대립이 전개되었다.",
    "concept": "제2차 세계 대전 이후 미국과 소련을 중심으로 정치·경제·군사적 대립이 전개되었다. 냉전은 두 나라가 모든 시기에 직접 전면전을 벌였다는 뜻이 아니다.",
    "formula": ""
  },
  {
    "id": "social-economics-opportunity",
    "courseId": "social-economics",
    "label": "명시적 비용과 기회비용",
    "description": "기회비용(opportunity cost)은 선택 때문에 포기한 최선의 대안의 가치와 선택에 필요한 명시적 비용을 함께 고려해 구한다.",
    "concept": "기회비용(opportunity cost)은 선택 때문에 포기한 최선의 대안의 가치와 선택에 필요한 명시적 비용을 함께 고려해 구한다. 이미 회수할 수 없는 매몰비용과 구분한다.",
    "formula": ""
  },
  {
    "id": "social-economics-equilibrium",
    "courseId": "social-economics",
    "label": "시장 균형 계산",
    "description": "시장 균형에서는 수요량과 공급량이 일치한다.",
    "concept": "시장 균형에서는 수요량과 공급량이 일치한다. 수요 함수와 공급 함수를 같게 놓고 균형 가격을 구한 뒤 어느 한 식에 대입해 균형 거래량을 확인한다.",
    "formula": "Q_d=100-2P,\\quad Q_s=20+2P"
  },
  {
    "id": "social-economics-comparative",
    "courseId": "social-economics",
    "label": "비교우위와 기회비용",
    "description": "비교우위(comparative advantage)는 어떤 재화의 생산 기회비용이 상대적으로 낮은 경우이다.",
    "concept": "비교우위(comparative advantage)는 어떤 재화의 생산 기회비용이 상대적으로 낮은 경우이다. 한 단위 생산에 필요한 노동시간이 적다는 절대우위와 구분한다.",
    "formula": ""
  },
  {
    "id": "social-economics-gdp-deflator",
    "courseId": "social-economics",
    "label": "명목·실질 GDP와 물가",
    "description": "GDP 디플레이터는 명목 GDP를 실질 GDP로 나눈 뒤 100을 곱한 값이다.",
    "concept": "GDP 디플레이터는 명목 GDP를 실질 GDP로 나눈 뒤 100을 곱한 값이다. 기준연도의 지수는 100이며, 명목 변화에는 생산량과 가격 변화가 함께 반영될 수 있다.",
    "formula": "D=\\frac{GDP_{nominal}}{GDP_{real}}\\times100"
  },
  {
    "id": "social-politics-sovereignty",
    "courseId": "social-politics",
    "label": "국민 주권",
    "description": "국민 주권은 국가 권력의 정당성의 근원이 국민에게 있다는 원리이다.",
    "concept": "국민 주권은 국가 권력의 정당성의 근원이 국민에게 있다는 원리이다. 특정 개인이나 특정 가문이 본래부터 국가 권력을 독점한다는 생각과 구분한다.",
    "formula": ""
  },
  {
    "id": "social-politics-separation",
    "courseId": "social-politics",
    "label": "권력 분립과 견제",
    "description": "권력 분립은 국가 권력을 여러 기관에 나누어 맡기고 상호 견제를 통해 권력 남용을 막으려는 원리이다.",
    "concept": "권력 분립은 국가 권력을 여러 기관에 나누어 맡기고 상호 견제를 통해 권력 남용을 막으려는 원리이다. 기관 사이에 어떤 협력도 있어서는 안 된다는 뜻은 아니다.",
    "formula": ""
  },
  {
    "id": "social-politics-participation",
    "courseId": "social-politics",
    "label": "참정권의 이해",
    "description": "참정권은 국민이 국가의 정치적 의사 형성과 공무 담당 등에 참여할 수 있는 기본권이다.",
    "concept": "참정권은 국민이 국가의 정치적 의사 형성과 공무 담당 등에 참여할 수 있는 기본권이다. 선거권은 대표적인 참정권이며 사회권·자유권·청구권과 구분한다.",
    "formula": ""
  },
  {
    "id": "social-politics-proportional",
    "courseId": "social-politics",
    "label": "가상 비례 배분 계산",
    "description": "비례 배분은 주어진 비율에 따라 의석이나 자원을 나누는 방식이다.",
    "concept": "비례 배분은 주어진 비율에 따라 의석이나 자원을 나누는 방식이다. 이 문항은 실제 선거법이 아니라 문항에 명시한 단순한 가상 배분 규칙만 적용한다.",
    "formula": ""
  },
  {
    "id": "social-culture-shared-culture",
    "courseId": "social-culture",
    "label": "문화의 공유성",
    "description": "문화의 공유성은 한 사회의 구성원들이 일정한 행동 방식이나 의미를 공통으로 지니는 속성이다.",
    "concept": "문화의 공유성은 한 사회의 구성원들이 일정한 행동 방식이나 의미를 공통으로 지니는 속성이다. 문화는 학습성·축적성·변동성·전체성 등 여러 속성을 함께 가질 수 있으므로 문항의 초점을 살핀다.",
    "formula": ""
  },
  {
    "id": "social-culture-formal-socialization",
    "courseId": "social-culture",
    "label": "공식적 사회화 기관",
    "description": "사회화는 사회생활에 필요한 지식·기능·가치·규범을 배우는 과정이다.",
    "concept": "사회화는 사회생활에 필요한 지식·기능·가치·규범을 배우는 과정이다. 학교는 체계적 교육을 목적으로 설립된 대표적인 공식적 사회화 기관이다.",
    "formula": ""
  },
  {
    "id": "social-culture-sample-survey",
    "courseId": "social-culture",
    "label": "모집단과 표본",
    "description": "모집단(population)은 연구에서 알고자 하는 전체 대상이고 표본(sample)은 실제 조사에 뽑힌 일부 대상이다.",
    "concept": "모집단(population)은 연구에서 알고자 하는 전체 대상이고 표본(sample)은 실제 조사에 뽑힌 일부 대상이다. 표본의 대표성이 부족하면 전체로 일반화하기 어렵다.",
    "formula": ""
  },
  {
    "id": "social-culture-mobility",
    "courseId": "social-culture",
    "label": "세대 간 사회 이동",
    "description": "사회 이동은 개인이나 집단의 사회적 위치가 달라지는 현상이다.",
    "concept": "사회 이동은 개인이나 집단의 사회적 위치가 달라지는 현상이다. 부모와 자녀 세대의 계층을 비교한 것은 세대 간 이동이며, 같은 사람의 생애 전후를 비교한 세대 내 이동과 구분한다.",
    "formula": ""
  },
  {
    "id": "science-physics1-net-force",
    "courseId": "science-physics1",
    "label": "알짜힘과 가속도",
    "description": "힘과 질량으로 가속도의 크기를 구합니다.",
    "concept": "알짜힘(net force)은 물체에 작용하는 모든 힘의 벡터합입니다. 질량이 일정하면 알짜힘=질량×가속도이며 가속도 방향은 알짜힘 방향과 같습니다.",
    "formula": "F_{\\mathrm{net}}=ma"
  },
  {
    "id": "science-physics1-momentum",
    "courseId": "science-physics1",
    "label": "충돌과 운동량 보존",
    "description": "한 덩어리가 되는 충돌의 속도를 구합니다.",
    "concept": "충돌하는 계에 작용하는 외부 힘의 충격량을 무시할 수 있으면 계의 총운동량은 보존됩니다. 두 물체가 붙는 충돌에서는 질량의 합과 공통 속도를 사용합니다.",
    "formula": "m_1v_1+m_2v_2=(m_1+m_2)v"
  },
  {
    "id": "science-physics1-wave-speed",
    "courseId": "science-physics1",
    "label": "파동의 속력",
    "description": "진동수와 파장으로 파동의 속력을 계산합니다.",
    "concept": "파동의 속력은 진동수(frequency)와 파장(wavelength)의 곱입니다. 한 번 진동하는 동안 파형은 한 파장만큼 진행합니다.",
    "formula": "v=f\\lambda"
  },
  {
    "id": "science-physics2-circular-acceleration",
    "courseId": "science-physics2",
    "label": "등속 원운동의 구심 가속도",
    "description": "속력과 반지름으로 구심 가속도를 구합니다.",
    "concept": "등속 원운동에서는 속력은 일정하지만 속도 방향이 계속 변하므로 중심을 향한 가속도가 존재합니다. 구심 가속도 크기는 v²/r입니다.",
    "formula": "a_c=\\frac{v^2}{r}"
  },
  {
    "id": "science-physics2-capacitor-charge",
    "courseId": "science-physics2",
    "label": "축전기의 전하량",
    "description": "전기용량과 전압으로 저장된 전하량을 구합니다.",
    "concept": "전기용량(capacitance)은 전하량을 전압으로 나눈 값입니다. Q=CV이며 축전기 두 판에 저장되는 전하량의 크기는 서로 같습니다.",
    "formula": "Q=CV"
  },
  {
    "id": "science-physics2-induced-emf",
    "courseId": "science-physics2",
    "label": "전자기 유도와 자기 선속",
    "description": "자기 선속 변화율로 유도 기전력을 계산합니다.",
    "concept": "패러데이 법칙에 따르면 코일의 유도 기전력 크기는 감은 수와 한 회로당 자기 선속 변화율의 곱입니다. 렌츠 법칙의 부호는 유도 효과가 선속 변화를 방해하는 방향임을 나타냅니다.",
    "formula": "|\\mathcal{E}|=N\\frac{|\\Delta\\Phi|}{\\Delta t}"
  },
  {
    "id": "science-chemistry1-mole-mass",
    "courseId": "science-chemistry1",
    "label": "몰과 질량",
    "description": "몰 질량으로 물질의 양을 계산합니다.",
    "concept": "몰(mol)은 물질의 양을 나타내는 단위입니다. 질량을 몰 질량으로 나누면 몰수가 됩니다. 같은 질량이라도 몰 질량이 다르면 몰수는 다를 수 있습니다.",
    "formula": "n=\\frac{m}{M}"
  },
  {
    "id": "science-chemistry1-ion-electron",
    "courseId": "science-chemistry1",
    "label": "양성자 수와 이온의 전자 수",
    "description": "원자 번호와 이온 전하로 전자 수를 비교합니다.",
    "concept": "원자 번호는 양성자 수입니다. 중성 원자에서는 전자 수와 양성자 수가 같고, 양이온은 전자를 잃어 형성됩니다. 핵반응이 아니라면 이온이 되어도 양성자 수는 변하지 않습니다.",
    "formula": ""
  },
  {
    "id": "science-chemistry1-molarity",
    "courseId": "science-chemistry1",
    "label": "몰 농도",
    "description": "용질의 몰수와 용액 부피로 농도를 구합니다.",
    "concept": "몰 농도(molarity)는 용액 1L에 녹아 있는 용질의 몰수입니다. 분모는 용매만의 부피가 아니라 최종 용액의 부피입니다.",
    "formula": "c=\\frac{n}{V}"
  },
  {
    "id": "science-chemistry2-ideal-gas",
    "courseId": "science-chemistry2",
    "label": "이상 기체 상태 방정식",
    "description": "기체의 압력·부피·온도를 연결합니다.",
    "concept": "이상 기체 모델에서 PV=nRT가 성립합니다. 온도에는 절대온도 K를 사용하며, 기체 상수 R의 단위와 압력·부피의 단위를 맞추어야 합니다.",
    "formula": "PV=nRT"
  },
  {
    "id": "science-chemistry2-equilibrium-constant",
    "courseId": "science-chemistry2",
    "label": "화학 평형 상수",
    "description": "평형 농도와 반응식의 계수를 연결합니다.",
    "concept": "농도로 나타낸 평형 상수는 생성물 농도 항의 곱을 반응물 농도 항의 곱으로 나눈 식입니다. 각 지수는 균형 잡힌 반응식의 계수에서 옵니다. 평형에서도 정반응과 역반응은 계속됩니다.",
    "formula": "K_c=\\frac{[\\mathrm{NO}_2]^2}{[\\mathrm{N}_2\\mathrm{O}_4]}"
  },
  {
    "id": "science-chemistry2-hess-law",
    "courseId": "science-chemistry2",
    "label": "헤스 법칙",
    "description": "연속된 반응의 엔탈피 변화를 더합니다.",
    "concept": "엔탈피는 상태 함수입니다. 처음 상태와 최종 상태가 같다면 반응 경로와 관계없이 총 엔탈피 변화는 같습니다. 반응식을 더할 때 엔탈피 변화도 더하고, 반응식을 뒤집으면 부호를 바꿉니다.",
    "formula": "\\Delta H_{A\\to C}=\\Delta H_{A\\to B}+\\Delta H_{B\\to C}"
  },
  {
    "id": "science-biology1-mendel-cross",
    "courseId": "science-biology1",
    "label": "분리 법칙과 유전 확률",
    "description": "단일 유전자 교배에서 자손의 유전자형을 구합니다.",
    "concept": "한 유전자 자리의 두 대립유전자는 생식세포 형성 과정에서 분리됩니다. Aa 개체가 A와 a를 같은 확률로 가진 생식세포를 만들면 Aa×Aa의 자손 유전자형 비는 AA:Aa:aa=1:2:1입니다.",
    "formula": ""
  },
  {
    "id": "science-biology1-glucose-feedback",
    "courseId": "science-biology1",
    "label": "항상성과 음성 피드백",
    "description": "혈당 변화와 호르몬 반응 방향을 연결합니다.",
    "concept": "음성 피드백(negative feedback)은 변화에 대응해 그 변화를 줄이는 방향으로 조절하는 원리입니다. 정상적인 혈당 조절에서 인슐린은 혈당이 높아졌을 때 세포의 포도당 이용과 저장을 돕습니다.",
    "formula": ""
  },
  {
    "id": "science-biology1-energy-transfer",
    "courseId": "science-biology1",
    "label": "생태계 에너지 전달",
    "description": "영양 단계 사이의 전달 효율을 적용합니다.",
    "concept": "에너지는 먹이 관계를 따라 다음 영양 단계로 전달되지만 호흡 등으로 많은 부분이 열로 방출됩니다. 에너지 전달 효율을 주어진 비율로 적용할 때에는 영양 단계가 바뀔 때마다 그 비율을 곱합니다.",
    "formula": ""
  },
  {
    "id": "science-biology2-transcription",
    "courseId": "science-biology2",
    "label": "전사와 염기 상보성",
    "description": "DNA 주형 가닥에서 RNA 서열을 추론합니다.",
    "concept": "전사(transcription)에서 RNA는 DNA 주형 가닥에 상보적으로 합성되며 합성 방향은 5′→3′입니다. RNA는 티민(T) 대신 유라실(U)을 사용합니다.",
    "formula": ""
  },
  {
    "id": "science-biology2-respiration-oxygen",
    "courseId": "science-biology2",
    "label": "세포 호흡과 최종 전자 수용체",
    "description": "호흡 전자 전달계에서 산소의 역할을 이해합니다.",
    "concept": "진핵세포의 유산소 호흡에서 전자 전달계는 전자를 이동시키며 양성자 농도 차 형성에 관여합니다. 산소는 최종적으로 전자를 받아 물이 되는 최종 전자 수용체입니다.",
    "formula": ""
  },
  {
    "id": "science-biology2-hardy-weinberg",
    "courseId": "science-biology2",
    "label": "하디·바인베르크 평형",
    "description": "대립유전자 빈도로 이형 접합자 비율을 구합니다.",
    "concept": "하디·바인베르크 평형 조건에서 두 대립유전자 빈도를 p와 q라 하면 p+q=1이고, 유전자형 AA:Aa:aa의 빈도는 p²:2pq:q²입니다. 이 모형에는 무작위 교배 등 조건이 필요합니다.",
    "formula": "p^2+2pq+q^2=1"
  },
  {
    "id": "science-earth1-divergent-boundary",
    "courseId": "science-earth1",
    "label": "판 경계와 해양 지각",
    "description": "발산형 경계의 지질 현상을 구분합니다.",
    "concept": "발산형 경계(divergent boundary)는 판이 서로 멀어지는 곳입니다. 대표적인 해양의 발산 경계인 해령에서는 상승한 마그마가 식으며 새로운 해양 지각이 만들어집니다.",
    "formula": ""
  },
  {
    "id": "science-earth1-half-life",
    "courseId": "science-earth1",
    "label": "반감기와 절대 연령",
    "description": "남은 모원소 비율로 경과 시간을 계산합니다.",
    "concept": "반감기(half-life)는 방사성 모원소의 양이 절반으로 줄어드는 데 걸리는 시간입니다. 계가 닫혀 있어 모원소의 유출입이 없다는 가정에서 반감기가 n번 지났을 때 남은 비율은 (1/2)의 n제곱입니다.",
    "formula": "\\frac{N}{N_0}=\\left(\\frac12\\right)^{t/T}"
  },
  {
    "id": "science-earth1-stellar-radius",
    "courseId": "science-earth1",
    "label": "별의 광도와 반지름",
    "description": "표면 온도가 같은 별의 광도를 비교합니다.",
    "concept": "별을 흑체로 근사하면 광도는 표면적과 표면 온도의 네제곱에 비례합니다. 온도가 같은 두 별은 광도 비가 반지름 비의 제곱과 같습니다.",
    "formula": "\\frac{L_A}{L_B}=\\left(\\frac{R_A}{R_B}\\right)^2\\left(\\frac{T_A}{T_B}\\right)^4"
  },
  {
    "id": "science-earth2-stellar-parallax",
    "courseId": "science-earth2",
    "label": "연주 시차와 별의 거리",
    "description": "연주 시차의 역수로 파섹 거리를 구합니다.",
    "concept": "연주 시차(annual parallax)는 지구 공전 때문에 가까운 별의 위치가 변해 보이는 현상에서 정의하는 각입니다. p를 초각, d를 파섹으로 나타내면 d=1/p이며 먼 별일수록 연주 시차가 작습니다.",
    "formula": "d(\\mathrm{pc})=\\frac{1}{p(\\mathrm{arcsec})}"
  },
  {
    "id": "science-earth2-kepler-period",
    "courseId": "science-earth2",
    "label": "케플러 제3법칙",
    "description": "공전 궤도 크기와 주기의 비를 계산합니다.",
    "concept": "같은 중심 천체를 도는 작은 천체들의 공전 주기 제곱은 궤도 긴반지름의 세제곱에 비례합니다. 태양 주위를 도는 경우 연과 AU를 단위로 적절히 쓰면 P²=a³으로 계산할 수 있습니다.",
    "formula": "P^2=a^3"
  },
  {
    "id": "science-earth2-mineral-hardness",
    "courseId": "science-earth2",
    "label": "광물의 굳기 비교",
    "description": "긁힘 관계로 광물의 상대 굳기를 판별합니다.",
    "concept": "모스 굳기(Mohs hardness)는 광물이 서로 긁히는 관계로 정한 상대적인 순서입니다. 굳기가 큰 물질은 작은 물질에 흠집을 낼 수 있지만, 굳기 숫자의 차이가 물리적 강도의 같은 간격을 뜻하지는 않습니다.",
    "formula": ""
  },
  {
    "id": "vocation-career-feedback-communication",
    "courseId": "vocation-career",
    "label": "의사소통과 확인 피드백",
    "description": "업무 지시를 정확히 이해하는 방법을 고릅니다.",
    "concept": "직업 의사소통에서는 전달 내용뿐 아니라 상대가 같은 의미로 이해했는지 확인하는 과정이 중요합니다. 핵심 조건을 자신의 말로 요약하고 상대의 확인을 받으면 오해를 줄일 수 있습니다.",
    "formula": ""
  },
  {
    "id": "vocation-career-resource-time",
    "courseId": "vocation-career",
    "label": "자원 관리와 시간 계획",
    "description": "주어진 작업 시간의 합과 남은 시간을 구합니다.",
    "concept": "자원 관리 능력은 시간·예산·인력 등 한정된 자원을 목표에 맞게 배분하는 능력입니다. 먼저 작업별 소요량을 합산한 뒤 이용 가능한 자원과 비교해야 합니다.",
    "formula": ""
  },
  {
    "id": "vocation-career-goal-setting",
    "courseId": "vocation-career",
    "label": "실행 가능한 직업 학습 목표",
    "description": "행동·측정 기준·기한이 있는 목표를 구분합니다.",
    "concept": "실행 가능한 목표는 무엇을 할지, 어느 정도 달성할지, 언제까지 할지를 구체화합니다. 모호한 의지 표현보다 행동과 확인 가능한 기준이 있는 계획이 실행·점검에 유리합니다.",
    "formula": ""
  },
  {
    "id": "vocation-agriculture-photosynthesis-carbon",
    "courseId": "vocation-agriculture",
    "label": "작물의 광합성과 탄소 공급",
    "description": "광합성 산물의 탄소가 어디에서 오는지 이해합니다.",
    "concept": "녹색 식물은 광합성에서 빛 에너지를 이용하고 이산화탄소의 탄소를 유기물에 고정합니다. 뿌리로 흡수하는 무기 양분과 유기물의 탄소 공급원은 구분해야 합니다.",
    "formula": ""
  },
  {
    "id": "vocation-agriculture-soil-ph",
    "courseId": "vocation-agriculture",
    "label": "토양 산도와 토양 검정",
    "description": "토양 pH가 나타내는 정보를 구분합니다.",
    "concept": "토양 pH는 토양 용액의 산성·중성·염기성 정도와 관련된 지표입니다. 토양 검정에는 pH 외에도 전기전도도, 유기물, 양분 등 여러 항목이 있으므로 한 지표만으로 모든 상태를 판단하지 않습니다.",
    "formula": ""
  },
  {
    "id": "vocation-agriculture-controlled-germination",
    "courseId": "vocation-agriculture",
    "label": "종자 발아 실험의 변인 통제",
    "description": "한 요인의 영향만 비교하는 실험을 설계합니다.",
    "concept": "통제 실험에서는 알아보려는 요인만 다르게 하고 나머지 조건은 같게 합니다. 종자 종류·수·수분·산소·온도 등 여러 요인을 동시에 바꾸면 결과 차이의 원인을 하나로 특정하기 어렵습니다.",
    "formula": ""
  },
  {
    "id": "vocation-industry-ohm-law",
    "courseId": "vocation-industry",
    "label": "직류 회로와 옴의 법칙",
    "description": "전압과 저항으로 전류를 계산합니다.",
    "concept": "일정한 조건에서 옴의 법칙을 따르는 저항에는 V=IR이 성립합니다. 전류를 구할 때는 전압을 저항으로 나누고, 전압·전류·저항의 단위를 구분합니다.",
    "formula": "V=IR"
  },
  {
    "id": "vocation-industry-energy-efficiency",
    "courseId": "vocation-industry",
    "label": "기계의 에너지 효율",
    "description": "투입 에너지와 유용한 출력 에너지를 비교합니다.",
    "concept": "에너지 효율은 유용하게 사용된 출력 에너지를 투입 에너지로 나눈 비율입니다. 마찰이나 열 방출 등으로 모든 투입 에너지가 원하는 출력으로 바뀌지는 않습니다.",
    "formula": "\\eta=\\frac{E_{\\mathrm{useful}}}{E_{\\mathrm{input}}}\\times100\\%"
  },
  {
    "id": "vocation-industry-drawing-scale",
    "courseId": "vocation-industry",
    "label": "도면의 축척",
    "description": "축소 도면과 실제 길이의 비를 적용합니다.",
    "concept": "도면 축척 1:5는 도면에서의 길이 1이 실제 길이 5에 해당한다는 뜻입니다. 축척은 길이 비이므로 면적이나 부피를 구할 때는 각각 제곱·세제곱 관계를 따로 적용해야 합니다.",
    "formula": ""
  },
  {
    "id": "vocation-commerce-gross-profit",
    "courseId": "vocation-commerce",
    "label": "매출총이익 계산",
    "description": "매출액과 매출원가의 차이를 구합니다.",
    "concept": "매출총이익(gross profit)은 매출액에서 매출원가를 뺀 값입니다. 판매비·관리비 등 다른 비용을 반영한 영업이익이나 순이익과 구분합니다.",
    "formula": ""
  },
  {
    "id": "vocation-commerce-retail-channel",
    "courseId": "vocation-commerce",
    "label": "유통 경로와 소매업",
    "description": "최종 소비자를 상대하는 유통 단계를 구분합니다.",
    "concept": "유통 경로는 생산자에게서 소비자에게 상품이 이동하는 단계입니다. 도매업은 주로 재판매·사업 목적 구매자를 상대하고, 소매업은 주로 최종 소비자에게 상품을 판매합니다.",
    "formula": ""
  },
  {
    "id": "vocation-commerce-reorder-point",
    "courseId": "vocation-commerce",
    "label": "재고와 재주문점",
    "description": "조달 기간의 수요와 안전 재고를 합합니다.",
    "concept": "수요와 조달 기간을 일정하다고 가정한 단순 모형에서 재주문점은 조달 기간 동안의 예상 수요에 안전 재고를 더한 값입니다. 실제 운영에서는 수요·납기 변동 등 추가 조건을 고려해야 합니다.",
    "formula": ""
  },
  {
    "id": "vocation-marine-buoyancy",
    "courseId": "vocation-marine",
    "label": "선박과 부력",
    "description": "배제한 유체의 무게로 부력을 구합니다.",
    "concept": "아르키메데스 원리에 따르면 유체가 물체에 주는 부력은 물체가 밀어낸 유체의 무게와 같습니다. 물속에 잠긴 부피와 유체 밀도를 사용하며 물체 전체 부피와 구분합니다.",
    "formula": "F_b=\\rho gV"
  },
  {
    "id": "vocation-marine-latitude-longitude",
    "courseId": "vocation-marine",
    "label": "위도와 경도",
    "description": "해상 위치의 남북·동서 표기를 읽습니다.",
    "concept": "위도는 적도를 기준으로 북위(N)·남위(S), 경도는 본초 자오선을 기준으로 동경(E)·서경(W)으로 나타냅니다. 숫자뿐 아니라 방향 기호가 위치를 정하는 데 필요합니다.",
    "formula": ""
  },
  {
    "id": "vocation-marine-salinity-mass",
    "courseId": "vocation-marine",
    "label": "해수 염분과 질량 비",
    "description": "단위 해수 질량당 염류의 양을 계산합니다.",
    "concept": "이 문제에서는 질량 염분을 해수 1kg에 들어 있는 용존 염류의 질량(g/kg)으로 정의합니다. 이 정의는 전기전도도로 정하는 실용염분의 수치와 엄밀하게 같은 정의는 아닙니다.",
    "formula": ""
  },
  {
    "id": "vocation-development-cephalocaudal",
    "courseId": "vocation-development",
    "label": "신체 발달의 일반적 방향",
    "description": "두미 발달 경향의 의미를 구분합니다.",
    "concept": "두미 발달(cephalocaudal development)은 신체 성장과 운동 조절이 일반적으로 머리 쪽에서 몸통과 다리 쪽으로 진행하는 경향을 뜻합니다. 발달 속도에는 개인차가 있으며 이 원리만으로 특정 아동을 평가하지 않습니다.",
    "formula": ""
  },
  {
    "id": "vocation-development-fine-motor",
    "courseId": "vocation-development",
    "label": "대근육·소근육 운동",
    "description": "정교한 손 조작과 큰 신체 움직임을 구분합니다.",
    "concept": "소근육 운동(fine motor skill)은 손가락처럼 작은 근육을 이용한 정교한 조작과 관련됩니다. 대근육 운동(gross motor skill)은 몸통·팔다리의 큰 움직임과 관련되며 두 영역은 상호 관련되어 발달합니다.",
    "formula": ""
  },
  {
    "id": "vocation-development-cognitive-accommodation",
    "courseId": "vocation-development",
    "label": "동화와 조절",
    "description": "새 경험에 맞춰 인지 도식을 바꾸는 과정을 구분합니다.",
    "concept": "피아제의 인지 발달 이론에서 동화(assimilation)는 새 경험을 기존 도식으로 해석하는 것이고, 조절(accommodation)은 기존 도식을 새 경험에 맞게 수정하는 것입니다.",
    "formula": ""
  },
  {
    "id": "language-german-verb",
    "courseId": "language-german",
    "label": "인칭에 따른 동사 변화",
    "description": "독일어 현재형 동사는 주어의 인칭과 수에 맞게 어미가 바뀝니다",
    "concept": "독일어 현재형 동사는 주어의 인칭과 수에 맞게 어미가 바뀝니다. 규칙동사 lernen은 ich와 함께 lerne가 됩니다.",
    "formula": ""
  },
  {
    "id": "language-german-request",
    "courseId": "language-german",
    "label": "정중한 길 묻기",
    "description": "길을 물을 때는 목적지를 제시하는 질문과 방향·위치를 알려 주는 답을 연결합니다",
    "concept": "길을 물을 때는 목적지를 제시하는 질문과 방향·위치를 알려 주는 답을 연결합니다. 질문의 핵심 명사와 대답의 정보를 함께 확인하세요.",
    "formula": ""
  },
  {
    "id": "language-german-notice",
    "courseId": "language-german",
    "label": "운영 시간 안내 읽기",
    "description": "독일어 안내문에서 요일과 시간 범위를 대응시킵니다",
    "concept": "독일어 안내문에서 요일과 시간 범위를 대응시킵니다. bis는 시간의 끝을 나타내며 geschlossen은 문을 닫았다는 뜻입니다.",
    "formula": ""
  },
  {
    "id": "language-german-vocabulary",
    "courseId": "language-german",
    "label": "장소와 활동 어휘",
    "description": "장소 어휘는 그곳에서 하는 활동과 함께 기억하면 의미를 파악하기 쉽습니다",
    "concept": "장소 어휘는 그곳에서 하는 활동과 함께 기억하면 의미를 파악하기 쉽습니다. Bibliothek은 책을 읽거나 빌리는 도서관을 뜻합니다.",
    "formula": ""
  },
  {
    "id": "language-french-polite-order",
    "courseId": "language-french",
    "label": "정중한 주문 표현",
    "description": "프랑스어에서 Je voudrais는 원하는 것을 정중하게 요청할 때 자주 사용합니다",
    "concept": "프랑스어에서 Je voudrais는 원하는 것을 정중하게 요청할 때 자주 사용합니다. 요청 내용과 목적어를 함께 읽으세요.",
    "formula": ""
  },
  {
    "id": "language-french-plural",
    "courseId": "language-french",
    "label": "수량과 명사의 복수형",
    "description": "프랑스어 명사는 둘 이상일 때 일반적으로 복수형을 사용합니다",
    "concept": "프랑스어 명사는 둘 이상일 때 일반적으로 복수형을 사용합니다. livre의 복수형은 livres이며 단수와 복수의 표기가 다릅니다.",
    "formula": ""
  },
  {
    "id": "language-french-reading",
    "courseId": "language-french",
    "label": "짧은 일정 읽기",
    "description": "프랑스어 글에서 à 뒤의 시각과 jusqu’à 뒤의 종료 시점을 구분합니다",
    "concept": "프랑스어 글에서 à 뒤의 시각과 jusqu’à 뒤의 종료 시점을 구분합니다. 인물의 여러 활동을 시간 순서로 정리하세요.",
    "formula": ""
  },
  {
    "id": "language-french-weather",
    "courseId": "language-french",
    "label": "날씨와 물건 연결",
    "description": "날씨 표현과 그 상황에 필요한 사물을 연결합니다",
    "concept": "날씨 표현과 그 상황에 필요한 사물을 연결합니다. Il pleut는 비가 온다는 뜻이고 parapluie는 우산입니다.",
    "formula": ""
  },
  {
    "id": "language-spanish-ser",
    "courseId": "language-spanish",
    "label": "주어와 ser 동사",
    "description": "스페인어 ser 동사의 현재형은 주어에 따라 달라집니다",
    "concept": "스페인어 ser 동사의 현재형은 주어에 따라 달라집니다. yo와 함께 쓰는 형태는 soy입니다.",
    "formula": ""
  },
  {
    "id": "language-spanish-direction",
    "courseId": "language-spanish",
    "label": "위치 질문과 응답",
    "description": "Dónde는 장소를 묻는 의문사입니다",
    "concept": "Dónde는 장소를 묻는 의문사입니다. 장소 질문에는 위치나 길을 설명하는 대답을 연결하세요.",
    "formula": ""
  },
  {
    "id": "language-spanish-schedule",
    "courseId": "language-spanish",
    "label": "요일과 약속 읽기",
    "description": "스페인어의 요일과 시각을 활동에 대응시켜 읽습니다",
    "concept": "스페인어의 요일과 시각을 활동에 대응시켜 읽습니다. 전치사 a 뒤의 시각과 요일 명사를 따로 확인하세요.",
    "formula": ""
  },
  {
    "id": "language-spanish-meal",
    "courseId": "language-spanish",
    "label": "식사 어휘 구분",
    "description": "desayuno는 아침 식사를 뜻합니다",
    "concept": "desayuno는 아침 식사를 뜻합니다. 일상 어휘는 시간·활동의 문맥과 함께 확인합니다.",
    "formula": ""
  },
  {
    "id": "language-chinese-classifier",
    "courseId": "language-chinese",
    "label": "수량사와 명사",
    "description": "중국어에서 명사의 수량을 말할 때 수사와 명사 사이에 양사를 사용합니다",
    "concept": "중국어에서 명사의 수량을 말할 때 수사와 명사 사이에 양사를 사용합니다. 책을 세는 대표적인 양사는 本입니다.",
    "formula": ""
  },
  {
    "id": "language-chinese-time",
    "courseId": "language-chinese",
    "label": "시각을 묻고 답하기",
    "description": "중국어에서 几点는 몇 시인지 묻는 말이고 半은 30분을 나타냅니다",
    "concept": "중국어에서 几点는 몇 시인지 묻는 말이고 半은 30분을 나타냅니다. 六点半은 여섯 시 삼십 분입니다.",
    "formula": ""
  },
  {
    "id": "language-chinese-reading",
    "courseId": "language-chinese",
    "label": "이동 일정 읽기",
    "description": "중국어 글에서 요일·시각·동작을 서로 대응시켜 읽습니다",
    "concept": "중국어 글에서 요일·시각·동작을 서로 대응시켜 읽습니다. 去는 가다, 回家는 집으로 돌아가다라는 뜻입니다.",
    "formula": ""
  },
  {
    "id": "language-chinese-antonym",
    "courseId": "language-chinese",
    "label": "기본 형용사와 반의어",
    "description": "중국어 형용사는 반대 의미의 단어를 짝지어 익히면 뜻을 구분하기 쉽습니다",
    "concept": "중국어 형용사는 반대 의미의 단어를 짝지어 익히면 뜻을 구분하기 쉽습니다. 大는 크다, 小는 작다를 뜻합니다.",
    "formula": ""
  },
  {
    "id": "language-japanese-particle",
    "courseId": "language-japanese",
    "label": "정확한 시각과 조사 に",
    "description": "일본어에서 정확한 시각을 나타내는 말 뒤에 조사 に를 붙여 동작이 일어나는 때를 나타낼 수 있습니다",
    "concept": "일본어에서 정확한 시각을 나타내는 말 뒤에 조사 に를 붙여 동작이 일어나는 때를 나타낼 수 있습니다. 동작 장소의 で와 구분하세요.",
    "formula": ""
  },
  {
    "id": "language-japanese-direction",
    "courseId": "language-japanese",
    "label": "길 묻기에 응답하기",
    "description": "どこ는 장소를 묻는 말입니다",
    "concept": "どこ는 장소를 묻는 말입니다. 길 안내 대화에서는 목적지의 방향이나 위치를 알려 주는 응답을 고릅니다.",
    "formula": ""
  },
  {
    "id": "language-japanese-notice",
    "courseId": "language-japanese",
    "label": "휴관일 안내 읽기",
    "description": "일본어 안내문에서 開館은 개관, 休み는 쉬는 날을 나타냅니다",
    "concept": "일본어 안내문에서 開館은 개관, 休み는 쉬는 날을 나타냅니다. 요일 한자를 활동 정보와 함께 읽으세요.",
    "formula": ""
  },
  {
    "id": "language-japanese-permission",
    "courseId": "language-japanese",
    "label": "허락을 구하는 표현",
    "description": "동사의 て형 뒤에 もいいですか를 붙이면 행동을 해도 되는지 허락을 구할 수 있습니다",
    "concept": "동사의 て형 뒤에 もいいですか를 붙이면 행동을 해도 되는지 허락을 구할 수 있습니다. 요청이나 금지 표현과 구분하세요.",
    "formula": ""
  },
  {
    "id": "language-russian-verb",
    "courseId": "language-russian",
    "label": "현재형의 인칭 일치",
    "description": "러시아어 현재형 동사는 주어의 인칭과 수에 맞게 변화합니다",
    "concept": "러시아어 현재형 동사는 주어의 인칭과 수에 맞게 변화합니다. изучать는 공부하다라는 뜻이며 я와 함께 изучаю로 씁니다.",
    "formula": ""
  },
  {
    "id": "language-russian-location",
    "courseId": "language-russian",
    "label": "장소 질문과 응답",
    "description": "Где는 어디에라는 뜻으로 위치를 묻습니다",
    "concept": "Где는 어디에라는 뜻으로 위치를 묻습니다. рядом с는 ~옆에라는 뜻이므로 장소 질문과 연결할 수 있습니다.",
    "formula": ""
  },
  {
    "id": "language-russian-reading",
    "courseId": "language-russian",
    "label": "시간 안내문 읽기",
    "description": "러시아어 안내문에서 с는 시작, до는 끝나는 시점을 나타낼 수 있습니다",
    "concept": "러시아어 안내문에서 с는 시작, до는 끝나는 시점을 나타낼 수 있습니다. работает는 운영한다, закрыта는 문을 닫았다는 뜻입니다.",
    "formula": ""
  },
  {
    "id": "language-russian-vocabulary",
    "courseId": "language-russian",
    "label": "학습 활동 어휘",
    "description": "러시아어에서 грамматика는 문법을 뜻합니다",
    "concept": "러시아어에서 грамматика는 문법을 뜻합니다. 동사 повторять의 목적어가 되면 문장 안에서 грамматику 형태로 쓰일 수 있습니다.",
    "formula": ""
  },
  {
    "id": "language-arabic-demonstrative",
    "courseId": "language-arabic",
    "label": "지시사와 명사의 성",
    "description": "표준 아랍어의 가까운 대상을 가리키는 단수 지시사는 명사의 성에 맞춥니다",
    "concept": "표준 아랍어의 가까운 대상을 가리키는 단수 지시사는 명사의 성에 맞춥니다. 남성 단수 명사 كتاب에는 هذا를 사용합니다.",
    "formula": ""
  },
  {
    "id": "language-arabic-location",
    "courseId": "language-arabic",
    "label": "장소를 묻는 أين",
    "description": "أين는 어디에라는 장소 의문사입니다",
    "concept": "أين는 어디에라는 장소 의문사입니다. 위치 질문에는 장소나 방향 정보를 제공하는 대답이 어울립니다.",
    "formula": ""
  },
  {
    "id": "language-arabic-reading",
    "courseId": "language-arabic",
    "label": "요일과 활동 읽기",
    "description": "아랍어 요일 이름과 활동을 각각 대응시켜 읽습니다",
    "concept": "아랍어 요일 이름과 활동을 각각 대응시켜 읽습니다. الأحد는 일요일이고 الاثنين은 월요일입니다.",
    "formula": ""
  },
  {
    "id": "language-arabic-vocabulary",
    "courseId": "language-arabic",
    "label": "장소 명사 이해",
    "description": "아랍어 장소 명사는 그곳에서 하는 행동과 함께 익힙니다",
    "concept": "아랍어 장소 명사는 그곳에서 하는 행동과 함께 익힙니다. المكتبة는 도서관이며 읽기를 뜻하는 أقرأ와 연결해 이해할 수 있습니다.",
    "formula": ""
  },
  {
    "id": "language-vietnamese-request",
    "courseId": "language-vietnamese",
    "label": "원하는 것을 말하기",
    "description": "베트남어에서 muốn은 원하다라는 뜻입니다",
    "concept": "베트남어에서 muốn은 원하다라는 뜻입니다. Tôi muốn 뒤에 원하는 대상을 이어 말할 수 있습니다.",
    "formula": ""
  },
  {
    "id": "language-vietnamese-aspect",
    "courseId": "language-vietnamese",
    "label": "이미 일어난 행동과 đã",
    "description": "베트남어는 동사의 형태를 인칭에 따라 바꾸지 않고 시간·상황 표현으로 의미를 구체화할 수 있습니다",
    "concept": "베트남어는 동사의 형태를 인칭에 따라 바꾸지 않고 시간·상황 표현으로 의미를 구체화할 수 있습니다. đã는 이미 이루어진 행동을 나타내는 데 쓰입니다.",
    "formula": ""
  },
  {
    "id": "language-vietnamese-reading",
    "courseId": "language-vietnamese",
    "label": "요일별 활동 읽기",
    "description": "베트남어에서 thứ Hai는 월요일, thứ Tư는 수요일입니다",
    "concept": "베트남어에서 thứ Hai는 월요일, thứ Tư는 수요일입니다. 활동을 나타내는 동사와 그 활동의 요일을 함께 읽으세요.",
    "formula": ""
  },
  {
    "id": "language-vietnamese-vocabulary",
    "courseId": "language-vietnamese",
    "label": "생활 장소 어휘",
    "description": "베트남어 장소 어휘를 활동과 연결해 읽습니다",
    "concept": "베트남어 장소 어휘를 활동과 연결해 읽습니다. thư viện은 도서관이고 sách는 책입니다.",
    "formula": ""
  },
  {
    "id": "language-hanmun-character",
    "courseId": "language-hanmun",
    "label": "한자의 구성과 뜻",
    "description": "木은 나무를 뜻하고 林은 나무 木 두 개가 결합한 글자로 수풀을 뜻합니다",
    "concept": "木은 나무를 뜻하고 林은 나무 木 두 개가 결합한 글자로 수풀을 뜻합니다. 글자의 구성을 살피되 모든 한자의 뜻을 모양만으로 단정하지는 않습니다.",
    "formula": ""
  },
  {
    "id": "language-hanmun-word-order",
    "courseId": "language-hanmun",
    "label": "한문 문장의 기본 어순",
    "description": "기본적인 한문 문장은 주어·서술어·목적어 순서로 이해할 수 있습니다",
    "concept": "기본적인 한문 문장은 주어·서술어·목적어 순서로 이해할 수 있습니다. 서술어가 무엇이고 그 동작의 대상이 무엇인지 구분하세요.",
    "formula": ""
  },
  {
    "id": "language-hanmun-idiom",
    "courseId": "language-hanmun",
    "label": "성어의 의미와 학습",
    "description": "溫故知新은 이미 배운 것을 되새겨 새로운 깨달음을 얻는다는 뜻입니다",
    "concept": "溫故知新은 이미 배운 것을 되새겨 새로운 깨달음을 얻는다는 뜻입니다. 글자 하나의 일상적 뜻만으로 성어 전체를 해석하지 마세요.",
    "formula": ""
  },
  {
    "id": "language-hanmun-negation",
    "courseId": "language-hanmun",
    "label": "부정어 不의 기능",
    "description": "한문에서 不는 서술어 앞에 놓여 그 내용을 부정할 수 있습니다",
    "concept": "한문에서 不는 서술어 앞에 놓여 그 내용을 부정할 수 있습니다. 不知는 알지 못하다라는 뜻입니다.",
    "formula": ""
  }
];
const BASE_AUTHORED_QUESTIONS=[
  {
    "id": "authored-korean-common-poetic-personification",
    "courseId": "korean-common",
    "topicId": "korean-common-poetic-personification",
    "domain": "국어",
    "subject": "공통: 독서·문학",
    "topic": "시적 표현과 의인",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 시구의 표현 방법에 대한 설명으로 가장 적절한 것을 고르세요.",
    "passage": "낡은 의자 하나 / 창가에 남겨 둔 오후 / 빈자리로 빛이 앉는다.",
    "options": [
      "빛에 사람의 행동을 부여해 장면을 생동감 있게 표현했다.",
      "동일한 의문문을 반복해 대답을 요구했다.",
      "서로 모순되는 의미를 직접 결합해 역설을 만들었다.",
      "실제 소리를 그대로 흉내 내어 청각을 강조했다.",
      "비교 대상 없이 수치로 객관적인 밝기를 측정했다."
    ],
    "answerIndex": 0,
    "hint": "앉는 행동을 누가 하고 있는지 보세요.",
    "solutionSteps": [
      "핵심 표현은 빛이 앉는다는 구절입니다.",
      "앉는 행동의 주체가 사람이 아닌 빛임을 확인합니다.",
      "사물에 사람의 행동을 부여했으므로 의인적 표현입니다."
    ],
    "commonMistakes": [
      "질문 형식의 문장이나 반복되는 의문문이 없습니다.",
      "빈자리에 빛이 앉는 표현이 논리적 모순을 직접 진술한 것은 아닙니다."
    ],
    "optionAnalysis": [
      "앉는다는 사람의 행동을 빛에 부여한 의인입니다.",
      "질문 형식의 문장이나 반복되는 의문문이 없습니다.",
      "빈자리에 빛이 앉는 표현이 논리적 모순을 직접 진술한 것은 아닙니다.",
      "소리를 흉내 내는 의성어가 없습니다.",
      "빛의 밝기를 측정하는 수치가 제시되지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "공통: 독서·문학",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-common-narrator",
    "courseId": "korean-common",
    "topicId": "korean-common-narrator",
    "domain": "국어",
    "subject": "공통: 독서·문학",
    "topic": "서술자와 시점",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 글의 서술 방식으로 가장 적절한 것을 고르세요.",
    "passage": "나는 결승선을 앞두고 걸음을 멈췄다. 실패할까 두려웠지만, 여기까지 온 내 선택을 후회하고 싶지는 않았다. 나는 다시 달리기 시작했다.",
    "options": [
      "이야기의 중심인 내가 자신의 행동과 내면을 직접 서술한다.",
      "이야기 밖의 서술자가 모든 인물의 속마음을 알고 서술한다.",
      "나는 주변 인물의 행동을 관찰할 뿐 내 행동은 전혀 서술하지 않는다.",
      "서술자는 인물의 마음을 배제하고 겉으로 보이는 행동만 기록한다.",
      "여러 인물이 차례로 등장해 서로의 과거를 편지로 서술한다."
    ],
    "answerIndex": 0,
    "hint": "나가 이야기의 중심인지, 남을 지켜보는 인물인지 구분하세요.",
    "solutionSteps": [
      "서술자가 나라는 1인칭인지 확인합니다.",
      "이야기의 주요 행동과 갈등이 나에게 집중됩니다.",
      "자신의 내면도 직접 드러내므로 1인칭 주인공 서술입니다."
    ],
    "commonMistakes": [
      "이야기 밖 서술자가 아니라 이야기 안의 내가 서술합니다.",
      "내가 멈추고 다시 달리는 행동이 중심입니다."
    ],
    "optionAnalysis": [
      "나는 자신의 선택과 두려움을 이야기의 중심에서 서술합니다.",
      "이야기 밖 서술자가 아니라 이야기 안의 내가 서술합니다.",
      "내가 멈추고 다시 달리는 행동이 중심입니다.",
      "두려움과 후회에 대한 내면이 드러납니다.",
      "여러 편지나 교대 서술 구조가 없습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "공통: 독서·문학",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-speech-audience",
    "courseId": "korean-speech",
    "topicId": "korean-speech-audience",
    "domain": "국어",
    "subject": "화법과 작문",
    "topic": "청중을 고려한 발표",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 상황에서 가장 적절한 발표 전략을 고르세요.",
    "passage": "학생이 스마트폰 사용에 익숙하지 않은 지역 주민에게 도서관 전자책 이용 방법을 안내하려 한다.",
    "options": [
      "어려운 용어를 풀어 설명하고 실제 화면의 이용 순서를 시범 보인다.",
      "기술 전문가용 약어를 설명 없이 사용한다.",
      "주민의 질문은 발표 흐름을 방해하므로 받지 않는다.",
      "전자책과 관련 없는 기기 사양만 길게 나열한다.",
      "청중의 이해 여부와 상관없이 최대한 빠르게 말한다."
    ],
    "answerIndex": 0,
    "hint": "발표 목표와 청중의 배경지식을 함께 보세요.",
    "solutionSteps": [
      "발표 목표는 전자책을 실제로 이용하도록 돕는 것입니다.",
      "청중은 스마트폰 이용 경험이 적습니다.",
      "쉬운 용어와 단계별 시범이 목표와 청중 모두에 맞습니다."
    ],
    "commonMistakes": [
      "설명 없는 약어는 청중의 이해를 어렵게 합니다.",
      "질문은 이해 정도를 확인하는 데 도움이 됩니다."
    ],
    "optionAnalysis": [
      "배경지식이 적은 청중에게 쉬운 설명과 시범이 적합합니다.",
      "설명 없는 약어는 청중의 이해를 어렵게 합니다.",
      "질문은 이해 정도를 확인하는 데 도움이 됩니다.",
      "목표는 이용 안내이므로 사양 나열은 핵심에서 벗어납니다.",
      "이해 여부를 확인하며 속도를 조절해야 합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "화법과 작문",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-speech-negotiation",
    "courseId": "korean-speech",
    "topicId": "korean-speech-negotiation",
    "domain": "국어",
    "subject": "화법과 작문",
    "topic": "협상과 공동의 이익",
    "kind": "authored",
    "type": "authored",
    "statement": "두 집단의 관심을 함께 고려한 대안으로 가장 적절한 것을 고르세요.",
    "passage": "독서 모임은 교실을 빌려 토론하고 싶어 한다. 자율학습 모임은 같은 교실에서 조용히 공부하고 싶어 한다. 두 모임은 모두 이용 시간 조정이 가능하다고 밝혔다.",
    "options": [
      "서로 다른 이용 시간을 정하고 다음 이용자를 위한 정리 규칙을 합의한다.",
      "독서 모임은 앞으로 활동을 모두 중단한다.",
      "자율학습 모임의 의견은 듣지 않고 토론을 계속한다.",
      "같은 시간에 토론과 자율학습을 하되 소음 문제는 논의하지 않는다.",
      "이용 시간 조정 가능성은 무시하고 상대방의 책임만 따진다."
    ],
    "answerIndex": 0,
    "hint": "양쪽이 조정할 수 있다고 밝힌 조건을 활용하세요.",
    "solutionSteps": [
      "토론 모임의 핵심 관심은 말하며 활동할 공간입니다.",
      "자율학습 모임은 조용한 학습 공간이 필요합니다.",
      "두 집단이 시간을 조정할 수 있으므로 시간 분리가 적절합니다."
    ],
    "commonMistakes": [
      "한쪽의 활동을 전면 중단하는 일방적 대안입니다.",
      "다른 쪽의 관심을 고려하지 않습니다."
    ],
    "optionAnalysis": [
      "시간을 분리하면 토론과 조용한 학습의 관심을 함께 충족합니다.",
      "한쪽의 활동을 전면 중단하는 일방적 대안입니다.",
      "다른 쪽의 관심을 고려하지 않습니다.",
      "같은 공간의 소음이라는 갈등 원인을 해결하지 않습니다.",
      "시간 조정이라는 협상 가능성을 활용하지 못합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "화법과 작문",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-speech-survey",
    "courseId": "korean-speech",
    "topicId": "korean-speech-survey",
    "domain": "국어",
    "subject": "화법과 작문",
    "topic": "자료의 대표성과 일반화",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 자료를 글에 활용할 때 가장 적절한 태도를 고르세요.",
    "passage": "학교 도서관 이용 만족도를 조사했는데, 도서관 독서 동아리 가입자 중 자발적으로 응답한 학생 30명의 결과만 모였다.",
    "options": [
      "응답자의 특성과 모집 방식의 한계를 밝히고 전체 학생으로의 일반화를 신중히 한다.",
      "30명이 응답했으므로 전교생의 의견과 반드시 같다고 단정한다.",
      "불만족 응답은 조사 목적에 맞지 않으므로 모두 삭제한다.",
      "도서관 이용 경험이 많은 집단이라는 사실은 숨긴다.",
      "만족도와 성적의 인과관계가 입증되었다고 주장한다."
    ],
    "answerIndex": 0,
    "hint": "누가 어떤 방식으로 응답했는지 확인하세요.",
    "solutionSteps": [
      "조사 대상은 전체 학생이 아니라 독서 동아리 가입자입니다.",
      "응답도 자발적이어서 특정 성향이 더 반영될 수 있습니다.",
      "표본의 한계를 밝히고 전체 학생으로 일반화하는 데 주의합니다."
    ],
    "commonMistakes": [
      "일부 동아리 자발적 응답만으로 전교생과 동일하다고 할 수 없습니다.",
      "불만족 응답을 임의 삭제하면 결과가 왜곡됩니다."
    ],
    "optionAnalysis": [
      "모집 방식과 응답자 집단의 특성 때문에 대표성에 한계가 있습니다.",
      "일부 동아리 자발적 응답만으로 전교생과 동일하다고 할 수 없습니다.",
      "불만족 응답을 임의 삭제하면 결과가 왜곡됩니다.",
      "응답자 특성은 해석에 필요한 정보입니다.",
      "성적 변인을 조사하지도 않았고 인과관계도 검증하지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "화법과 작문",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-speech-revision",
    "courseId": "korean-speech",
    "topicId": "korean-speech-revision",
    "domain": "국어",
    "subject": "화법과 작문",
    "topic": "주장과 근거를 연결하는 고쳐쓰기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 초고를 보완할 내용으로 가장 적절한 것을 고르세요.",
    "passage": "초고: 운동장 분리배출함을 늘려야 한다. 기존 배출함은 자주 넘치고 수거 시각도 불규칙하다. 배출함을 늘리면 모든 문제가 해결될 것이다.",
    "options": [
      "배출함 추가와 함께 정기 수거 계획을 제시하고 해결 효과의 단정을 완화한다.",
      "수거가 불규칙하다는 근거는 결론과 상관없으므로 감춘다.",
      "분리배출과 무관한 운동 경기 결과를 결론의 근거로 넣는다.",
      "모든 문제라는 표현을 예외 없이 모든 문제로 더 강화한다.",
      "배출함 추가에 필요한 공간 조건은 확인하지 않도록 한다."
    ],
    "answerIndex": 0,
    "hint": "제시한 해결책이 모든 원인에 대응하는지 살펴보세요.",
    "solutionSteps": [
      "초고에 드러난 원인은 용량 부족과 수거 불규칙성입니다.",
      "배출함 추가만으로는 수거 문제를 직접 해결하지 못합니다.",
      "수거 계획을 추가하고 효과를 과장한 표현을 조정하는 것이 적절합니다."
    ],
    "commonMistakes": [
      "수거 문제는 핵심 원인이므로 검토해야 합니다.",
      "운동 경기 결과는 대안의 효과와 관련이 없습니다."
    ],
    "optionAnalysis": [
      "용량뿐 아니라 수거 불규칙성에도 대응해야 근거와 대안이 연결됩니다.",
      "수거 문제는 핵심 원인이므로 검토해야 합니다.",
      "운동 경기 결과는 대안의 효과와 관련이 없습니다.",
      "충분한 근거 없는 단정을 더 강화하면 안 됩니다.",
      "실행 조건도 해결책의 타당성에 영향을 줍니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "화법과 작문",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-language-nasalization",
    "courseId": "korean-language",
    "topicId": "korean-language-nasalization",
    "domain": "국어",
    "subject": "언어와 매체",
    "topic": "비음화와 음운 교체",
    "kind": "authored",
    "type": "authored",
    "statement": "국물의 표준 발음이 [궁물]인 현상에 대한 설명으로 옳은 것을 고르세요.",
    "passage": "국물 → [궁물]",
    "options": [
      "뒤의 ㅁ의 영향으로 받침 ㄱ이 비음 ㅇ으로 바뀌었다.",
      "받침 ㄱ과 뒤의 ㅁ이 모두 탈락했다.",
      "두 음운 ㄱ과 ㅁ이 하나의 ㄲ으로 합쳐졌다.",
      "원래 없던 ㄴ이 두 음절 사이에 첨가되었다.",
      "모음 ㅜ가 모두 ㅗ로 바뀌었다."
    ],
    "answerIndex": 0,
    "hint": "어느 자음이 무엇으로 바뀌었는지 비교하세요.",
    "solutionSteps": [
      "바뀐 소리는 첫 음절 끝의 ㄱ입니다.",
      "뒤 음절의 ㅁ은 비음이며 ㄱ을 ㅇ으로 바꾸는 환경이 됩니다.",
      "비음으로 바뀌었으므로 비음화이며 음운의 수는 유지됩니다."
    ],
    "commonMistakes": [
      "ㄱ은 ㅇ으로 바뀌고 ㅁ은 유지됩니다.",
      "하나의 된소리로 축약된 것이 아닙니다."
    ],
    "optionAnalysis": [
      "비음 ㅁ 앞에서 ㄱ이 비음 ㅇ으로 교체됩니다.",
      "ㄱ은 ㅇ으로 바뀌고 ㅁ은 유지됩니다.",
      "하나의 된소리로 축약된 것이 아닙니다.",
      "새 ㄴ이 첨가되는 현상이 아닙니다.",
      "모음 ㅜ는 그대로 유지됩니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://korean.go.kr/kornorms/m/m_regltn.do?regltn_code=0002"
    ],
    "courseName": "언어와 매체",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-language-sentence-role",
    "courseId": "korean-language",
    "topicId": "korean-language-sentence-role",
    "domain": "국어",
    "subject": "언어와 매체",
    "topic": "문장 성분과 부사어",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 문장에서 운동장에서의 문장 성분을 고르세요.",
    "passage": "민수가 운동장에서 공을 찼다.",
    "options": [
      "부사어",
      "주어",
      "목적어",
      "관형어",
      "서술어"
    ],
    "answerIndex": 0,
    "hint": "동작의 주체·대상·장소를 나누어 보세요.",
    "solutionSteps": [
      "서술어 찼다가 요구하는 행위와 대상을 확인합니다.",
      "운동장에서는 차는 동작이 이루어진 장소를 나타냅니다.",
      "용언을 수식하는 장소 표현이므로 부사어입니다."
    ],
    "commonMistakes": [
      "누가 찼는지 나타내는 주어는 민수가입니다.",
      "차는 대상인 목적어는 공을입니다."
    ],
    "optionAnalysis": [
      "운동장에서는 동작이 이루어지는 장소를 나타내며 찼다를 수식합니다.",
      "누가 찼는지 나타내는 주어는 민수가입니다.",
      "차는 대상인 목적어는 공을입니다.",
      "체언을 꾸미는 관형어가 아니라 동작의 장소를 나타냅니다.",
      "동작을 서술하는 서술어는 찼다입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "언어와 매체",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-language-word-class",
    "courseId": "korean-language",
    "topicId": "korean-language-word-class",
    "domain": "국어",
    "subject": "언어와 매체",
    "topic": "관형사와 부사",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 문장에서 새와 매우의 품사를 차례로 바르게 짝지은 것을 고르세요.",
    "passage": "나는 새 책의 표지가 매우 예쁘다고 생각했다.",
    "options": [
      "관형사, 부사",
      "명사, 조사",
      "부사, 관형사",
      "동사, 형용사",
      "조사, 대명사"
    ],
    "answerIndex": 0,
    "hint": "두 말이 각각 무엇을 꾸미는지 확인하세요.",
    "solutionSteps": [
      "새가 꾸미는 대상은 명사 책입니다.",
      "매우가 꾸미는 대상은 형용사 예쁘다입니다.",
      "따라서 새는 관형사, 매우는 부사입니다."
    ],
    "commonMistakes": [
      "새는 여기서 새라는 동물을 가리키는 명사가 아니며 매우는 조사가 아닙니다.",
      "두 품사의 순서가 뒤바뀌었습니다."
    ],
    "optionAnalysis": [
      "새는 책이라는 명사를 꾸미는 관형사이고 매우는 예쁘다의 정도를 꾸미는 부사입니다.",
      "새는 여기서 새라는 동물을 가리키는 명사가 아니며 매우는 조사가 아닙니다.",
      "두 품사의 순서가 뒤바뀌었습니다.",
      "새와 매우는 활용하는 동사나 형용사가 아닙니다.",
      "새는 조사, 매우는 대명사로 쓰이지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "언어와 매체",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-language-media-check",
    "courseId": "korean-language",
    "topicId": "korean-language-media-check",
    "domain": "국어",
    "subject": "언어와 매체",
    "topic": "매체 정보의 신뢰성",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 상황에서 정보를 검증하는 방법으로 가장 적절한 것을 고르세요.",
    "passage": "한 게시물이 출처와 조사 시점 없이 지역 도서관 이용자가 두 배 늘었다고 주장한다.",
    "options": [
      "도서관의 원자료와 조사 기간·집계 기준을 확인한다.",
      "공유 횟수가 많으면 사실로 확정한다.",
      "작성자가 자신 있게 말하면 출처는 확인하지 않는다.",
      "같은 게시물을 복사한 글만 여러 개 찾아 독립된 증거로 센다.",
      "자신의 예상과 맞는 수치이므로 그대로 인용한다."
    ],
    "answerIndex": 0,
    "hint": "숫자의 출처와 비교 기준을 먼저 확인하세요.",
    "solutionSteps": [
      "게시물에는 비교 시점과 집계 기준이 빠져 있습니다.",
      "이용자 수인지 방문 횟수인지에 따라서도 수치 의미가 다릅니다.",
      "원자료를 찾아 동일 기준의 비교인지 확인해야 합니다."
    ],
    "commonMistakes": [
      "공유량은 정보의 사실 여부를 직접 증명하지 않습니다.",
      "말투의 확신은 자료의 정확성과 별개입니다."
    ],
    "optionAnalysis": [
      "원자료와 기간·기준을 확인해야 두 배라는 비교의 타당성을 판단할 수 있습니다.",
      "공유량은 정보의 사실 여부를 직접 증명하지 않습니다.",
      "말투의 확신은 자료의 정확성과 별개입니다.",
      "동일 게시물을 복제한 글은 독립적인 자료가 아닙니다.",
      "기존 생각과 일치한다는 이유만으로 검증을 생략하면 안 됩니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "courseName": "언어와 매체",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-english-agreement",
    "courseId": "english",
    "topicId": "english-agreement",
    "domain": "영어",
    "subject": "영어",
    "topic": "주어와 동사의 수 일치",
    "kind": "authored",
    "type": "authored",
    "statement": "빈칸에 들어갈 말로 가장 적절한 것을 고르세요.",
    "passage": "Each of the students ___ a notebook.",
    "options": [
      "has",
      "have",
      "are having been",
      "were",
      "have been"
    ],
    "answerIndex": 0,
    "hint": "of 뒤 명사보다 문장의 중심 주어를 찾으세요.",
    "solutionSteps": [
      "전치사구 of the students를 제외하면 중심 주어는 Each입니다.",
      "Each는 여기서 단수 주어로 취급됩니다.",
      "노트를 가지고 있다는 현재 상태에는 has가 적절합니다."
    ],
    "commonMistakes": [
      "have는 이 문장에서 단수 주어 Each와 수가 맞지 않습니다.",
      "are having been은 이 문장에 맞는 동사 형태가 아닙니다."
    ],
    "optionAnalysis": [
      "중심 주어 Each가 단수이므로 단수 현재형 has가 알맞습니다.",
      "have는 이 문장에서 단수 주어 Each와 수가 맞지 않습니다.",
      "are having been은 이 문장에 맞는 동사 형태가 아닙니다.",
      "were는 복수 과거형이며 a notebook을 목적어로 취하는 뜻도 맞지 않습니다.",
      "have been은 단수 주어에 맞지 않고 문장 의미도 성립하지 않습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "translation": "각 학생은 공책을 한 권 가지고 있다.",
    "vocabulary": [
      [
        "each",
        "각각, 각자"
      ],
      [
        "student",
        "학생"
      ],
      [
        "notebook",
        "공책"
      ],
      [
        "have / has",
        "가지고 있다"
      ]
    ],
    "languageCode": "en",
    "courseName": "영어",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-english-notice",
    "courseId": "english",
    "topicId": "english-notice",
    "domain": "영어",
    "subject": "영어",
    "topic": "안내문 조건 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 안내문의 내용과 일치하는 것을 고르세요.",
    "passage": "Submit your reading report by 5 p.m. on Friday. Late reports will not be accepted. Illustrations are optional, but the report must include the book title and your own opinion.",
    "options": [
      "Students may submit a report without illustrations.",
      "Late reports are accepted until Sunday.",
      "The book title can be omitted.",
      "Students must include at least three illustrations.",
      "Only a summary is required; personal opinions are unnecessary."
    ],
    "answerIndex": 0,
    "hint": "optional과 must include의 차이를 확인하세요.",
    "solutionSteps": [
      "기한은 금요일 오후 5시이고 늦은 제출은 받지 않습니다.",
      "책 제목과 자신의 의견은 반드시 포함해야 합니다.",
      "그림은 선택 사항이므로 그림 없이 제출할 수 있습니다."
    ],
    "commonMistakes": [
      "늦은 보고서는 받지 않는다고 명시했습니다.",
      "책 제목은 must include로 제시된 필수 요소입니다."
    ],
    "optionAnalysis": [
      "Illustrations are optional은 그림이 선택 사항이라는 뜻입니다.",
      "늦은 보고서는 받지 않는다고 명시했습니다.",
      "책 제목은 must include로 제시된 필수 요소입니다.",
      "그림은 선택 사항이며 최소 개수 조건도 없습니다.",
      "자신의 의견은 필수 요소입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://cdn2.kice.re.kr/27dae-suneung/index.html"
    ],
    "translation": "독서 보고서를 금요일 오후 5시까지 제출하세요. 늦게 낸 보고서는 받지 않습니다. 그림은 선택 사항이지만 보고서에는 책 제목과 자신의 의견이 포함되어야 합니다.",
    "vocabulary": [
      [
        "submit",
        "제출하다"
      ],
      [
        "accept",
        "받아들이다, 접수하다"
      ],
      [
        "illustration",
        "그림, 삽화"
      ],
      [
        "optional",
        "선택 사항인"
      ],
      [
        "opinion",
        "의견"
      ]
    ],
    "languageCode": "en",
    "courseName": "영어",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-korean-history-bone-rank",
    "courseId": "korean-history",
    "topicId": "korean-history-bone-rank",
    "domain": "한국사",
    "subject": "한국사",
    "topic": "신라의 신분제",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 설명에 해당하는 제도를 운영한 국가는?",
    "options": [
      "신라",
      "고구려",
      "백제",
      "고려",
      "조선"
    ],
    "answerIndex": 0,
    "hint": "성골·진골·두품이라는 용어를 단서로 삼으세요.",
    "solutionSteps": [
      "제시된 제도는 혈통에 따라 신분을 나누는 제도이다.",
      "성골·진골·두품은 골품제의 대표적인 신분 구분이다.",
      "골품제를 운영한 국가는 신라이다."
    ],
    "commonMistakes": [
      "귀족이 존재했다는 이유만으로 모든 고대 국가를 정답으로 고르지 않는다.",
      "골품제와 조선의 양반 신분 질서를 구분한다."
    ],
    "optionAnalysis": [
      "골품제는 신라의 신분 제도이다.",
      "고구려의 관등과 귀족 질서를 신라의 골품제와 구분해야 한다.",
      "백제에도 귀족과 관등이 있었지만 제시된 골품제를 운영한 국가는 신라이다.",
      "고려는 신라 멸망 이후의 왕조로 골품제의 실시 국가가 아니다.",
      "조선의 양반 중심 신분 질서와 신라의 골품제는 구분된다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://contents.history.go.kr/front/tg/view.do?ganada=&levelId=tg_001_0570&pageUnit=10&treeId=0209"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "이 나라에서는 성골·진골과 여러 두품으로 신분을 나누었다. 개인의 신분은 관직에 오를 수 있는 범위와 일상생활에도 영향을 주었다.",
    "courseName": "한국사"
  },
  {
    "id": "authored-korean-history-gwangjong",
    "courseId": "korean-history",
    "topicId": "korean-history-gwangjong",
    "domain": "한국사",
    "subject": "한국사",
    "topic": "고려 광종의 왕권 강화",
    "kind": "authored",
    "type": "authored",
    "statement": "자료의 두 정책을 시행한 왕은?",
    "options": [
      "고려 성종",
      "조선 세종",
      "신라 법흥왕",
      "고구려 광개토 대왕",
      "고려 광종"
    ],
    "answerIndex": 4,
    "hint": "고려 초기의 개혁이라는 시대와 정책의 조합을 확인하세요.",
    "solutionSteps": [
      "첫 번째 정책은 노비안검법이다.",
      "두 번째 정책은 시험을 통해 관리를 선발하는 과거제 시행이다.",
      "두 정책을 시행한 왕은 고려 광종이다."
    ],
    "commonMistakes": [
      "왕 이름에 광이라는 글자가 있다고 광개토 대왕을 고르지 않는다.",
      "고려 성종의 유교 정치 정비와 광종의 개혁을 구분한다."
    ],
    "optionAnalysis": [
      "성종의 유교 정치 정비와 광종의 노비안검법·과거제 시행은 구분된다.",
      "세종은 조선의 왕이며 제시된 고려 초기 정책의 시행자가 아니다.",
      "법흥왕의 율령 반포·불교 공인과 관련된 설명이 아니다.",
      "정복 활동을 펼친 고구려 왕과 고려 광종을 구분해야 한다.",
      "광종은 노비안검법과 과거제를 시행하였다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://contents.history.go.kr/front/ta/view.do?levelId=ta_h71_0040_0020_0020_0020",
      "https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_20&levelId=kc_i200500"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "정책 ㉠: 불법적으로 노비가 된 사람을 조사하여 본래의 신분으로 돌린다.\n정책 ㉡: 시험을 통해 관리가 될 인재를 선발한다.",
    "courseName": "한국사"
  },
  {
    "id": "authored-korean-history-gabo",
    "courseId": "korean-history",
    "topicId": "korean-history-gabo",
    "domain": "한국사",
    "subject": "한국사",
    "topic": "갑오개혁과 신분제 폐지",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 내용이 포함된 개혁은?",
    "options": [
      "흥선 대원군의 서원 정리",
      "신라의 골품제 정비",
      "고려의 전시과 시행",
      "갑오개혁",
      "광해군의 중립 외교"
    ],
    "answerIndex": 3,
    "hint": "군국기무처와 1894년이라는 단서를 확인하세요.",
    "solutionSteps": [
      "자료는 신분에 따른 차별을 법적으로 없애려는 개혁이다.",
      "군국기무처는 1894년의 개혁을 추진한 기구이다.",
      "따라서 갑오개혁에 해당한다."
    ],
    "commonMistakes": [
      "노비안검법은 불법 노비화를 조사한 것으로 모든 신분제의 법적 폐지와 다르다.",
      "법적 신분제 폐지가 실제 신분 관념의 즉시 소멸을 뜻하지는 않는다."
    ],
    "optionAnalysis": [
      "서원 정리와 1894년의 신분제 법적 폐지는 서로 다른 정책이다.",
      "혈통에 따른 신분 질서의 정비는 제시된 신분제 폐지와 방향이 다르다.",
      "관리 등에게 토지 수조권 등을 지급한 제도와 신분제 폐지는 다르다.",
      "1894년 갑오개혁은 신분제 폐지 등의 사회 개혁을 추진하였다.",
      "대외 관계에서 실리적 대응을 모색한 정책으로 신분제 폐지 개혁이 아니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://contents.history.go.kr/front/hm/print.do?levelId=hm_133_0010"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "1894년 군국기무처는 문벌과 양반·상민의 차별을 없애고 공사노비제를 폐지하는 방향의 개혁안을 의결하였다.",
    "courseName": "한국사"
  },
  {
    "id": "authored-korean-history-march-first",
    "courseId": "korean-history",
    "topicId": "korean-history-march-first",
    "domain": "한국사",
    "subject": "한국사",
    "topic": "3·1 운동과 임시정부",
    "kind": "authored",
    "type": "authored",
    "statement": "자료에 나타난 운동은?",
    "options": [
      "6월 민주 항쟁",
      "국채 보상 운동",
      "3·1 운동",
      "갑신정변",
      "동학 농민 운동"
    ],
    "answerIndex": 2,
    "hint": "1919년과 만세 시위라는 단서를 함께 보세요.",
    "solutionSteps": [
      "1919년에 독립 선언이 발표되었다.",
      "만세 시위가 전국으로 확산되었다.",
      "대한민국 임시정부 수립에 영향을 준 이 운동은 3·1 운동이다."
    ],
    "commonMistakes": [
      "1919년과 1894년의 운동을 혼동하지 않는다.",
      "민주화 운동과 일제강점기 독립운동의 시대를 구분한다."
    ],
    "optionAnalysis": [
      "6월 민주 항쟁은 1987년 민주화 운동으로 시대가 다르다.",
      "국채 보상 운동은 1907년에 시작된 국권 수호 운동으로 제시된 운동과 다르다.",
      "1919년 독립 선언과 전국적인 만세 시위는 3·1 운동의 특징이다.",
      "갑신정변은 1884년의 정치 개혁 시도로 1919년의 만세 운동이 아니다.",
      "동학 농민 운동은 1894년에 전개되었으며 제시된 1919년 독립운동과 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://contents.history.go.kr/front/ta/view.do?levelId=ta_m52_0050_0020",
      "https://contents.history.go.kr/front/hm/view.do?levelId=hm_123_0060"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "1919년 독립 선언을 계기로 학생과 종교인뿐 아니라 다양한 계층이 만세 시위에 참여하였다. 이 운동은 대한민국 임시정부 수립에도 영향을 주었다.",
    "courseName": "한국사"
  },
  {
    "id": "authored-social-life-ethics-kant-dignity",
    "courseId": "social-life-ethics",
    "topicId": "social-life-ethics-kant-dignity",
    "domain": "사회탐구",
    "subject": "생활과 윤리",
    "topic": "칸트와 인간 존엄성",
    "kind": "authored",
    "type": "authored",
    "statement": "칸트의 입장에서 가장 적절한 판단은?",
    "options": [
      "약속의 도덕성은 발각될 가능성에 따라 결정된다.",
      "상대방을 속여 이익을 얻는 행위는 인간을 단지 수단으로만 대할 수 있다.",
      "전체 이익이 커지면 상대방의 동의는 언제나 불필요하다.",
      "도덕적 판단은 오직 나의 쾌락을 극대화하는 데 달려 있다.",
      "다른 사람을 어떤 협력의 수단으로 삼는 것도 모두 금지된다."
    ],
    "answerIndex": 1,
    "hint": "수단으로 대함과 단지 수단으로만 대함을 구분하세요.",
    "solutionSteps": [
      "칸트는 이성적 존재인 인간의 존엄성을 강조한다.",
      "기만은 상대방이 스스로 판단할 기회를 빼앗는다.",
      "따라서 이익을 위한 기만은 인간을 단지 수단으로만 대하는 문제가 있다."
    ],
    "commonMistakes": [
      "모든 협력이나 거래를 금지하는 주장으로 확대하지 않는다.",
      "좋은 결과와 도덕적 의무를 동일시하지 않는다."
    ],
    "optionAnalysis": [
      "도덕적 의무는 발각 가능성에 따라 결정되지 않는다.",
      "상대방의 이성적 판단 기회를 빼앗는 기만은 인간을 단지 수단으로 대하는 문제가 있다.",
      "결과의 이익만으로 상대방을 단지 수단으로 대하는 행위를 정당화하지 않는다.",
      "칸트의 도덕 원리는 개인 쾌락의 극대화가 아니다.",
      "칸트가 문제 삼는 것은 단지 수단으로만 대하는 것으로 모든 협력을 금지하는 것이 아니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://encykorea.aks.ac.kr/Article/E0042306"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "생활과 윤리"
  },
  {
    "id": "authored-social-life-ethics-utilitarian-choice",
    "courseId": "social-life-ethics",
    "topicId": "social-life-ethics-utilitarian-choice",
    "domain": "사회탐구",
    "subject": "생활과 윤리",
    "topic": "공리주의와 결과 평가",
    "kind": "authored",
    "type": "authored",
    "statement": "주어진 가정 아래 총행복의 합만을 비교하는 판단에 가장 적절한 것은?",
    "options": [
      "정책 B를 선택한다.",
      "정책 A를 선택한다.",
      "결과를 전혀 살피지 않고 무조건 정책 A를 선택한다.",
      "정책 담당자 한 사람의 이익만으로 선택한다.",
      "두 정책의 총행복이 같으므로 구별할 수 없다."
    ],
    "answerIndex": 0,
    "hint": "두 집단이 얻는 행복을 정책별로 더하세요.",
    "solutionSteps": [
      "가정에 따라 행복 수치를 같은 척도로 더한다.",
      "정책 A는 8+4=12, 정책 B는 9+9=18이다.",
      "총행복의 합만 비교하면 정책 B가 더 크다."
    ],
    "commonMistakes": [
      "공리주의를 정책 담당자 개인의 이익만 추구하는 이기주의로 보지 않는다.",
      "실제 윤리 판단의 복잡성을 모두 수치화했다는 주장으로 읽지 않는다."
    ],
    "optionAnalysis": [
      "B의 총행복 18이 A의 총행복 12보다 크다.",
      "두 정책의 총행복을 더하면 A가 더 작으므로 주어진 평가 기준과 다르다.",
      "결과를 비교한다는 문제의 가정과 어긋난다.",
      "관련된 모든 사람의 행복 합을 본다는 가정과 다르다.",
      "12와 18은 같지 않으므로 계산이 잘못되었다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://encykorea.aks.ac.kr/Article/E0042306"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상의 동일한 행복 척도에서 정책 A는 두 집단에 각각 8과 4, 정책 B는 각각 9와 9의 행복을 준다. 인원·기간·다른 영향은 모두 같고 추가 고통은 없다고 가정한다. 이 문항에서는 총행복의 합만 비교한다.",
    "verification": {
      "A": 12,
      "B": 18,
      "expected": "정책 B"
    },
    "courseName": "생활과 윤리"
  },
  {
    "id": "authored-social-life-ethics-rawls-veil",
    "courseId": "social-life-ethics",
    "topicId": "social-life-ethics-rawls-veil",
    "domain": "사회탐구",
    "subject": "생활과 윤리",
    "topic": "롤스의 무지의 베일",
    "kind": "authored",
    "type": "authored",
    "statement": "롤스가 무지의 베일을 가정하는 취지로 가장 적절한 것은?",
    "options": [
      "당사자들이 사회 정의에 관한 어떤 원칙도 선택하지 못하게 하기 위해서이다.",
      "부유한 사람이 자신의 부를 더 늘리는 원칙만 고르게 하기 위해서이다.",
      "모든 사람의 실제 능력이 동일하다고 주장하기 위해서이다.",
      "실제 사회에서 모든 정보를 영구히 금지하기 위해서이다.",
      "자신의 우연한 처지에 유리하도록 정의 원칙을 고르는 편파성을 줄이기 위해서이다."
    ],
    "answerIndex": 4,
    "hint": "자신이 어느 계층에 속할지 모른다는 조건을 생각하세요.",
    "solutionSteps": [
      "자신의 지위와 능력을 알면 자기에게 유리한 원칙을 고를 수 있다.",
      "무지의 베일은 이런 우연적 조건을 모르게 한다.",
      "목적은 공정한 정의 원칙의 선택을 설명하는 데 있다."
    ],
    "commonMistakes": [
      "무지의 베일을 실제 사회의 정보 금지 정책으로 읽지 않는다.",
      "자연적 능력이 현실에서 모두 같다는 주장으로 바꾸지 않는다."
    ],
    "optionAnalysis": [
      "원초적 입장은 정의 원칙을 선택하기 위한 장치이므로 선택 자체를 막는 것이 아니다.",
      "자신이 부유한지조차 모른다는 가정과 정면으로 어긋난다.",
      "능력의 차이가 없다고 단정하는 것이 아니라 자신의 구체적 조건을 모르게 하는 가정이다.",
      "현실의 모든 정보 금지가 아니라 공정성을 설명하는 사고 장치이다.",
      "자신의 계층과 능력 등을 모르게 하여 특정 처지를 위한 편파적 선택을 막으려는 가정이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ebsi.co.kr/ebs/lms/player/retrieveLmsPlayerHtml5.ebs?lecGbn=V500&lessonId=LS100030061949&sbjtId=S20240000793&sbjtapplyId=",
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "생활과 윤리"
  },
  {
    "id": "authored-social-life-ethics-singer-sentience",
    "courseId": "social-life-ethics",
    "topicId": "social-life-ethics-singer-sentience",
    "domain": "사회탐구",
    "subject": "생활과 윤리",
    "topic": "싱어와 이익의 평등한 고려",
    "kind": "authored",
    "type": "authored",
    "statement": "싱어의 입장에서 가장 적절한 설명은?",
    "options": [
      "이익의 평등한 고려는 모든 동물을 언제나 동일하게 대우한다는 뜻이다.",
      "인간의 사소한 편의는 동물의 어떤 고통보다 항상 우선한다.",
      "도덕적 고려의 범위는 오직 법적 국적에 따라 정해야 한다.",
      "종이 다르다는 이유만으로 동물의 고통을 도덕적 고려에서 배제해서는 안 된다.",
      "언어를 사용하지 못하는 존재의 고통은 언제나 무의미하다."
    ],
    "answerIndex": 3,
    "hint": "고통을 느끼는 능력과 종 차별을 연결해 보세요.",
    "solutionSteps": [
      "싱어는 고통을 느끼는 능력을 도덕적 고려의 중요한 기준으로 삼는다.",
      "동물도 고통을 느끼면 관련 이익을 고려해야 한다.",
      "따라서 종이 다르다는 이유만으로 그 고통을 배제해서는 안 된다."
    ],
    "commonMistakes": [
      "이익의 평등한 고려를 모든 상황의 동일한 대우로 바꾸지 않는다.",
      "언어 능력과 고통 감수 능력을 같은 것으로 보지 않는다."
    ],
    "optionAnalysis": [
      "관련 이익을 평등하게 고려하는 것과 획일적으로 같은 대우를 하는 것은 다르다.",
      "종만을 이유로 인간의 모든 이익을 무조건 우선하는 입장과 다르다.",
      "고통을 느낄 수 있는 능력을 중시하는 입장과 무관하다.",
      "고통을 느끼는 존재의 이익을 종만을 이유로 차별하지 말자는 취지에 부합한다.",
      "고통을 느끼는 능력을 중시하므로 언어 능력만으로 동물의 고통을 배제하지 않는다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ebsi.co.kr/ebs/lms/player/retrieveLmsPlayerHtml5.ebs?lecGbn=V500&lessonId=LS100030061949&sbjtId=S20240000793&sbjtapplyId="
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "생활과 윤리"
  },
  {
    "id": "authored-social-ethics-confucius-ren",
    "courseId": "social-ethics",
    "topicId": "social-ethics-confucius-ren",
    "domain": "사회탐구",
    "subject": "윤리와 사상",
    "topic": "공자의 인과 예",
    "kind": "authored",
    "type": "authored",
    "statement": "공자의 윤리 사상과 가장 밀접한 설명은?",
    "options": [
      "예의 실천은 어떤 상황에서도 도덕적 수양과 무관하다.",
      "인간의 도덕성은 오직 강한 형벌만으로 완성된다.",
      "인을 바탕으로 타인을 배려하고 예를 실천하며 자신을 수양한다.",
      "모든 행동은 물질적 이익만으로 평가해야 한다.",
      "타인과의 관계는 도덕적 삶과 아무 관련이 없다."
    ],
    "answerIndex": 2,
    "hint": "인과 예가 인간관계에서 어떻게 드러나는지 보세요.",
    "solutionSteps": [
      "공자의 핵심 덕목은 인이다.",
      "예의 실천은 인간관계의 도덕적 질서와 수양에 연결된다.",
      "타인을 배려하고 자신을 수양한다는 설명이 적절하다."
    ],
    "commonMistakes": [
      "공자의 사상을 개인의 물질적 이익 추구로 축소하지 않는다.",
      "예를 단순한 외형만의 규칙으로 단정하지 않는다."
    ],
    "optionAnalysis": [
      "예의 실천과 인격 수양을 분리한 설명은 적절하지 않다.",
      "공자는 덕과 예를 통한 교화를 중시하며 형벌만을 충분조건으로 보지 않는다.",
      "인과 예를 중심으로 도덕적 인격을 기른다는 공자의 입장에 부합한다.",
      "공자의 인과 예를 물질적 이익만으로 환원할 수 없다.",
      "공자의 윤리는 인간관계 속 인과 예의 실천을 중시한다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://encykorea.aks.ac.kr/Article/E0041280"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "윤리와 사상"
  },
  {
    "id": "authored-social-ethics-mencius-four",
    "courseId": "social-ethics",
    "topicId": "social-ethics-mencius-four",
    "domain": "사회탐구",
    "subject": "윤리와 사상",
    "topic": "맹자의 사단",
    "kind": "authored",
    "type": "authored",
    "statement": "맹자의 사단설에서 측은지심과 연결되는 덕목은?",
    "options": [
      "이익(利)",
      "인(仁)",
      "의(義)",
      "예(禮)",
      "지(智)"
    ],
    "answerIndex": 1,
    "hint": "타인의 고통을 안타까워하는 마음이라는 뜻을 생각하세요.",
    "solutionSteps": [
      "측은지심은 타인의 불행을 보고 안타까워하는 마음이다.",
      "맹자는 이런 마음을 선한 본성의 단서로 설명한다.",
      "측은지심에 대응하는 덕목은 인이다."
    ],
    "commonMistakes": [
      "인의예지와 네 마음의 대응 순서를 혼동하지 않는다.",
      "사단을 완성된 덕과 완전히 같은 말로 취급하지 않는다."
    ],
    "optionAnalysis": [
      "사단설은 도덕적 마음의 싹을 설명하며 측은지심을 물질적 이익에 대응시키지 않는다.",
      "타인의 불행을 안타까워하는 측은지심은 인의 단서이다.",
      "의의 단서는 부끄러워하고 미워하는 수오지심이다.",
      "예의 단서는 사양하는 마음인 사양지심이다.",
      "지의 단서는 옳고 그름을 가리는 시비지심이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://encykorea.aks.ac.kr/Article/E0018079"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "윤리와 사상"
  },
  {
    "id": "authored-social-ethics-xunzi-education",
    "courseId": "social-ethics",
    "topicId": "social-ethics-xunzi-education",
    "domain": "사회탐구",
    "subject": "윤리와 사상",
    "topic": "순자의 성악설과 교화",
    "kind": "authored",
    "type": "authored",
    "statement": "순자의 입장으로 가장 적절한 것은?",
    "options": [
      "예와 교육을 통한 후천적 노력으로 욕구를 조절하고 선한 행위를 길러야 한다.",
      "본성이 악하므로 인간은 어떤 노력으로도 선해질 수 없다.",
      "욕구는 언제나 그대로 따를수록 사회가 저절로 조화로워진다.",
      "예는 도덕적 삶과 무관하므로 모두 폐기해야 한다.",
      "교육을 받지 않아도 누구나 반드시 완성된 성인이 된다."
    ],
    "answerIndex": 0,
    "hint": "본성에 대한 설명과 수양의 가능성을 구분하세요.",
    "solutionSteps": [
      "순자는 욕구의 무절제한 추구가 다툼을 낳을 수 있다고 본다.",
      "이를 조절하는 예와 교육을 중시한다.",
      "따라서 후천적 노력으로 선한 행위를 길러야 한다는 설명이 적절하다."
    ],
    "commonMistakes": [
      "성악설을 교육 무용론이나 개선 불가능론으로 오해하지 않는다.",
      "맹자의 선한 본성 확충과 순자의 후천적 교화를 구분한다."
    ],
    "optionAnalysis": [
      "인위적 노력과 예의 교화를 중시하는 순자의 설명에 부합한다.",
      "순자는 예와 교육을 통해 교화될 수 있다고 보았으므로 개선 불가능론이 아니다.",
      "욕구를 무제한 따를 때 다툼이 생길 수 있다는 순자의 문제의식과 다르다.",
      "순자는 예를 교화와 질서 형성에 중요하게 보았다.",
      "후천적 학습과 노력을 중시하는 입장과 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://encykorea.aks.ac.kr/Article/E0029416"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "윤리와 사상"
  },
  {
    "id": "authored-social-ethics-aristotle-virtue",
    "courseId": "social-ethics",
    "topicId": "social-ethics-aristotle-virtue",
    "domain": "사회탐구",
    "subject": "윤리와 사상",
    "topic": "아리스토텔레스와 중용",
    "kind": "authored",
    "type": "authored",
    "statement": "아리스토텔레스의 덕 윤리를 설명한 것으로 가장 적절한 것은?",
    "options": [
      "중용은 모든 상황에서 두 선택의 정확한 산술 평균이다.",
      "덕은 행동을 반복하지 않아도 지식을 암기하면 언제나 완성된다.",
      "용기는 어떤 위험에도 무조건 뛰어드는 무모함과 같다.",
      "행위의 상황은 적절한 판단에 아무 영향이 없다.",
      "실천과 습관을 통해 덕을 기르고 상황에 맞게 지나침과 모자람을 피한다."
    ],
    "answerIndex": 4,
    "hint": "습관화와 중용이라는 두 핵심어를 연결하세요.",
    "solutionSteps": [
      "도덕적 덕은 올바른 행위를 반복하며 길러진다.",
      "중용은 지나침과 모자람 사이에서 상황에 알맞게 선택하는 것이다.",
      "따라서 실천과 적절한 선택을 함께 강조한 보기가 정답이다."
    ],
    "commonMistakes": [
      "중용을 중간 수치나 소극적인 타협으로만 보지 않는다.",
      "용기와 무모함을 같은 덕목으로 생각하지 않는다."
    ],
    "optionAnalysis": [
      "중용은 상황과 행위자에 적절한 것으로 단순한 산술 평균이 아니다.",
      "도덕적 덕의 형성에서 실천과 습관이 중요하므로 암기만으로 충분하지 않다.",
      "용기는 무모함과 비겁함을 구분하며 무조건적인 위험 감수와 같지 않다.",
      "상황에 적절한 행위와 선택을 고려한다는 설명과 다르다.",
      "도덕적 덕의 습관화와 상황에 적절한 중용을 함께 설명한다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://encykorea.aks.ac.kr/Article/E0042306"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "윤리와 사상"
  },
  {
    "id": "authored-social-korea-geography-relief",
    "courseId": "social-korea-geography",
    "topicId": "social-korea-geography-relief",
    "domain": "사회탐구",
    "subject": "한국지리",
    "topic": "한반도의 지형 특성",
    "kind": "authored",
    "type": "authored",
    "statement": "한반도의 일반적인 지형 특성으로 가장 적절한 것은?",
    "options": [
      "태백산맥은 한반도 서해안의 가장 낮은 평야에만 분포한다.",
      "한반도에는 산지가 전혀 없다.",
      "지형 특성은 하천의 흐름에 어떤 영향도 주지 않는다.",
      "대체로 동쪽의 고도가 높고 서쪽으로 낮아지는 경향이 있다.",
      "한반도의 모든 지역은 고도가 동일하다."
    ],
    "answerIndex": 3,
    "hint": "동쪽 산맥과 서쪽 평야의 분포를 떠올려 보세요.",
    "solutionSteps": [
      "한반도 동쪽에는 태백산맥 등 산지가 이어진다.",
      "서쪽에는 상대적으로 낮은 지형과 평야가 나타난다.",
      "따라서 대체로 동고서저라는 경향으로 정리할 수 있다."
    ],
    "commonMistakes": [
      "대체적인 지형 경향을 모든 지점에서 예외 없이 성립하는 법칙으로 읽지 않는다.",
      "산맥의 위치와 행정 구역 경계를 같은 것으로 보지 않는다."
    ],
    "optionAnalysis": [
      "태백산맥은 동쪽 산지와 관련되며 서해안 최저 평야에만 분포하지 않는다.",
      "산지가 널리 분포하므로 사실과 다르다.",
      "하천 흐름과 유역은 고도와 경사 등 지형의 영향을 받는다.",
      "동쪽 산지의 분포와 서쪽으로 낮아지는 전반적 고도 경향을 설명한다.",
      "산지·고원·평야 등이 분포하므로 모든 지역의 고도가 같지 않다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://nationalatlas.ngii.go.kr/pages/page_4039.php"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "한국지리"
  },
  {
    "id": "authored-social-korea-geography-annual-range",
    "courseId": "social-korea-geography",
    "topicId": "social-korea-geography-annual-range",
    "domain": "사회탐구",
    "subject": "한국지리",
    "topic": "기온의 연교차",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 자료에서 A와 B의 기온 연교차를 비교한 설명은?",
    "options": [
      "A의 연교차는 5℃이다.",
      "B의 연교차는 27℃이다.",
      "A의 연교차가 B보다 10℃ 크다.",
      "A의 연교차가 B보다 10℃ 작다.",
      "두 지역의 연교차는 모두 23℃이다."
    ],
    "answerIndex": 2,
    "hint": "최한월 기온이 음수이면 빼기 부호를 두 번 처리하세요.",
    "solutionSteps": [
      "연교차는 최난월 평균 기온−최한월 평균 기온이다.",
      "A는 28−(−5)=33℃, B는 25−2=23℃이다.",
      "따라서 A가 B보다 10℃ 크다."
    ],
    "commonMistakes": [
      "최난월 기온과 최한월 기온을 더하지 않는다.",
      "영하의 기온을 뺄 때 부호를 빠뜨리지 않는다."
    ],
    "optionAnalysis": [
      "최한월 기온의 절댓값만으로 연교차를 정할 수 없다.",
      "B는 두 기온을 더하는 것이 아니라 25−2로 계산해야 한다.",
      "A는 28−(−5)=33℃, B는 25−2=23℃이므로 차이는 10℃이다.",
      "계산 결과는 A 33℃, B 23℃이므로 대소 관계가 반대이다.",
      "A의 최한월 기온이 영하이므로 A의 연교차는 33℃이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://nationalatlas.ngii.go.kr/pages/page_1227.php"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상 관측 자료\nA: 최난월 평균 기온 28℃, 최한월 평균 기온 −5℃\nB: 최난월 평균 기온 25℃, 최한월 평균 기온 2℃",
    "verification": {
      "A": 33,
      "B": 23,
      "difference": 10,
      "expectedValue": 10
    },
    "courseName": "한국지리"
  },
  {
    "id": "authored-social-korea-geography-river-deposition",
    "courseId": "social-korea-geography",
    "topicId": "social-korea-geography-river-deposition",
    "domain": "사회탐구",
    "subject": "한국지리",
    "topic": "하천의 침식과 퇴적",
    "kind": "authored",
    "type": "authored",
    "statement": "자료에서 범람원 형성에 직접적으로 강조된 작용은?",
    "options": [
      "인간에 의한 모든 산지의 절단",
      "퇴적 작용",
      "화산 분출",
      "빙하의 이동",
      "지표 물질이 전혀 쌓이지 않는 순수한 용해"
    ],
    "answerIndex": 1,
    "hint": "쌓인다는 표현을 지형 작용의 이름과 연결하세요.",
    "solutionSteps": [
      "하천이 주변으로 범람하면 흐름의 조건이 달라질 수 있다.",
      "운반하던 모래와 흙이 주변에 쌓인다.",
      "이처럼 물질이 쌓이는 작용은 퇴적이다."
    ],
    "commonMistakes": [
      "하천이 만든 모든 지형을 침식 지형으로만 분류하지 않는다.",
      "운반과 퇴적을 같은 단계로 보지 않는다."
    ],
    "optionAnalysis": [
      "제시된 자료는 자연적 하천 범람과 퇴적을 설명한다.",
      "하천이 운반하던 물질이 쌓이는 과정은 퇴적이다.",
      "용암이나 화산재 분출이 제시된 과정은 아니다.",
      "빙하가 움직이며 지형을 만드는 과정이 아니다.",
      "운반 물질이 쌓였다는 자료와 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf",
      "https://nationalatlas.ngii.go.kr/"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "하천이 주변의 낮은 땅으로 넘쳤다. 물이 퍼진 뒤 하천이 운반하던 모래와 흙이 쌓였고, 이런 과정이 반복되면서 비교적 평탄한 땅이 형성되었다.",
    "courseName": "한국지리"
  },
  {
    "id": "authored-social-korea-geography-dependency",
    "courseId": "social-korea-geography",
    "topicId": "social-korea-geography-dependency",
    "domain": "사회탐구",
    "subject": "한국지리",
    "topic": "노년 부양비 계산",
    "kind": "authored",
    "type": "authored",
    "statement": "가상 지역의 노년 부양비는?",
    "options": [
      "20",
      "12",
      "16.7",
      "50",
      "500"
    ],
    "answerIndex": 0,
    "hint": "분모는 전체 인구가 아니라 15~64세 인구입니다.",
    "solutionSteps": [
      "노년 부양비의 분자는 65세 이상 인구이다.",
      "분모는 15~64세 인구이므로 1,200/6,000을 계산한다.",
      "100을 곱하면 노년 부양비는 20이다."
    ],
    "commonMistakes": [
      "고령 인구 비율과 노년 부양비의 분모를 혼동하지 않는다.",
      "비율을 백 명당 값으로 나타낼 때 100을 곱하는 것을 잊지 않는다."
    ],
    "optionAnalysis": [
      "65세 이상 1,200명을 15~64세 6,000명으로 나눈 뒤 100을 곱하면 20이다.",
      "분모를 임의로 10,000명으로 놓아서는 안 된다.",
      "1,200/7,200을 계산한 값으로 주어진 노년 부양비의 분모와 다르다.",
      "1,200/6,000×100의 계산 결과와 다르다.",
      "분자와 분모를 뒤집어 6,000/1,200×100으로 계산한 값이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상 지역의 15~64세 인구는 6,000명이고 65세 이상 인구는 1,200명이다. 노년 부양비=(65세 이상 인구/15~64세 인구)×100으로 계산한다.",
    "verification": {
      "numerator": 1200,
      "denominator": 6000,
      "expectedValue": 20
    },
    "courseName": "한국지리"
  },
  {
    "id": "authored-social-world-geography-mediterranean",
    "courseId": "social-world-geography",
    "topicId": "social-world-geography-mediterranean",
    "domain": "사회탐구",
    "subject": "세계지리",
    "topic": "지중해성 기후",
    "kind": "authored",
    "type": "authored",
    "statement": "자료의 강수 특성과 가장 가까운 기후는?",
    "options": [
      "열대 우림 기후",
      "연중 강수가 거의 없는 사막 기후",
      "연중 빙설이 지배하는 빙설 기후",
      "계절과 관계없이 매달 같은 양의 비가 내리는 기후",
      "지중해성 기후"
    ],
    "answerIndex": 4,
    "hint": "강수량이 여름보다 겨울에 많다는 점을 보세요.",
    "solutionSteps": [
      "자료는 여름이 덥고 건조하다고 설명한다.",
      "겨울은 비교적 온화하고 강수가 상대적으로 많다.",
      "이 조합은 지중해성 기후의 전형적 특징과 가깝다."
    ],
    "commonMistakes": [
      "지중해라는 지명만으로 모든 인접 지역의 기후가 완전히 같다고 단정하지 않는다.",
      "연평균 강수량만 보고 강수의 계절 분포를 무시하지 않는다."
    ],
    "optionAnalysis": [
      "열대 우림은 일반적으로 연중 강수가 풍부하여 뚜렷한 여름 건조와 다르다.",
      "자료는 겨울에 비가 상대적으로 많이 내린다고 하므로 연중 극소 강수와 다르다.",
      "여름이 덥고 겨울이 비교적 온화하다는 자료와 다르다.",
      "자료에서는 여름과 겨울의 강수량 차이가 강조된다.",
      "여름 건조와 겨울 상대적 다우라는 계절적 분포가 핵심 단서이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf",
      "https://www.nie.re.kr/nie/cmmn/file/fileDown.do?atchFileId=MFILE_0005BW807pC34Rg&fileSn=1"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상 지역에서 여름은 덥고 비가 적으며, 겨울은 비교적 온화하고 여름보다 강수가 많다.",
    "courseName": "세계지리"
  },
  {
    "id": "authored-social-world-geography-local-time",
    "courseId": "social-world-geography",
    "topicId": "social-world-geography-local-time",
    "domain": "사회탐구",
    "subject": "세계지리",
    "topic": "경도와 지역시",
    "kind": "authored",
    "type": "authored",
    "statement": "주어진 조건에서 B의 지역시는?",
    "options": [
      "10시",
      "11시",
      "14시",
      "12시",
      "8시"
    ],
    "answerIndex": 3,
    "hint": "경도 차이를 15°로 나누고 동서 방향을 확인하세요.",
    "solutionSteps": [
      "두 지점의 경도 차이는 60°−30°=30°이다.",
      "15°당 1시간이므로 시차는 2시간이다.",
      "B가 더 동쪽이므로 A의 10시보다 2시간 앞선 12시이다."
    ],
    "commonMistakes": [
      "지역시 계산을 실제 국가의 표준시 구역과 혼동하지 않는다.",
      "동쪽과 서쪽의 시간 차이 방향을 뒤집지 않는다."
    ],
    "optionAnalysis": [
      "경도 차이 30°에 따른 지역시 차이를 반영하지 않았다.",
      "30°는 1시간이 아니라 2시간 차이에 해당한다.",
      "30°에 대한 시차를 4시간으로 잘못 계산했다.",
      "B는 A보다 동쪽으로 30° 떨어져 있으므로 2시간 앞선 12시이다.",
      "동쪽 지역이 앞선다는 방향을 거꾸로 적용한 값이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "A는 동경 30°, B는 동경 60°에 있다. 경도에 따른 지역시만 사용하고 표준시·서머타임은 적용하지 않는다. A의 지역시가 10시일 때를 생각한다.",
    "verification": {
      "longitudeDifference": 30,
      "hours": 2,
      "expectedValue": 12
    },
    "courseName": "세계지리"
  },
  {
    "id": "authored-social-world-geography-rainforest",
    "courseId": "social-world-geography",
    "topicId": "social-world-geography-rainforest",
    "domain": "사회탐구",
    "subject": "세계지리",
    "topic": "열대 우림 기후와 생활",
    "kind": "authored",
    "type": "authored",
    "statement": "열대 우림 기후를 설명한 것으로 가장 적절한 것은?",
    "options": [
      "대륙 빙하가 모든 지표를 덮는다.",
      "해발 고도가 높다는 조건만으로 열대 우림 기후가 결정된다.",
      "연중 기온이 높고 강수가 풍부하여 식생이 무성하게 자랄 수 있다.",
      "겨울철 모든 달의 평균 기온이 영하 20℃ 이하이다.",
      "강수는 거의 없고 연중 건조하다."
    ],
    "answerIndex": 2,
    "hint": "연중 고온과 풍부한 강수라는 두 조건을 함께 고르세요.",
    "solutionSteps": [
      "열대 우림 기후는 기온이 연중 높다.",
      "강수도 풍부하여 생육에 필요한 수분이 공급된다.",
      "따라서 무성한 식생과 연결한 보기가 적절하다."
    ],
    "commonMistakes": [
      "열대의 모든 기후를 연중 다우라고 일반화하지 않는다.",
      "기후와 식생을 완전히 무관한 것으로 보지 않는다."
    ],
    "optionAnalysis": [
      "대륙 빙하는 열대 우림 기후의 대표적 지표 모습이 아니다.",
      "기후는 고도 하나만으로 결정되지 않으며 자료는 기온과 강수를 함께 보아야 한다.",
      "높은 기온과 풍부한 강수는 열대 우림 식생을 이해하는 핵심 조건이다.",
      "열대 우림의 연중 고온이라는 특징과 다르다.",
      "풍부한 강수와 무성한 식생이라는 특징과 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "세계지리"
  },
  {
    "id": "authored-social-world-geography-natural-increase",
    "courseId": "social-world-geography",
    "topicId": "social-world-geography-natural-increase",
    "domain": "사회탐구",
    "subject": "세계지리",
    "topic": "인구의 자연 증가",
    "kind": "authored",
    "type": "authored",
    "statement": "가상 국가의 인구 자연 증가율은?",
    "options": [
      "연 −2.5%",
      "연 2.5%",
      "연 25%",
      "연 5.5%",
      "연 1.5%"
    ],
    "answerIndex": 1,
    "hint": "출생률에서 사망률을 뺀 뒤 ‰와 %를 구분하세요.",
    "solutionSteps": [
      "자연 증가 인구는 출생 인구에서 사망 인구를 뺀 값이다.",
      "1,000명당 40−15=25명이 증가한다.",
      "이는 25‰이며 백분율로 2.5%이다."
    ],
    "commonMistakes": [
      "자연 증가와 국제 인구 이동을 합산하지 않는다.",
      "천분율(‰)과 백분율(%)을 혼동하지 않는다."
    ],
    "optionAnalysis": [
      "출생이 사망보다 많은데 부호를 반대로 처리했다.",
      "인구 1,000명당 출생 40명−사망 15명=25명이므로 25/1,000×100=2.5%이다.",
      "1,000명당 25명을 100명당 25명으로 잘못 바꾼 값이다.",
      "출생과 사망을 더한 55/1,000을 계산한 값이다.",
      "사망률만 백분율로 바꾼 값으로 자연 증가율이 아니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상 국가에서 1년 동안 인구 1,000명당 출생은 40명, 사망은 15명이다. 이 문항에서는 자연 증가만 계산하며 인구 이동은 고려하지 않는다.",
    "verification": {
      "perThousand": 25,
      "expectedValue": 2.5
    },
    "courseName": "세계지리"
  },
  {
    "id": "authored-social-east-history-dynasty-order",
    "courseId": "social-east-history",
    "topicId": "social-east-history-dynasty-order",
    "domain": "사회탐구",
    "subject": "동아시아사",
    "topic": "중국 왕조의 선후 관계",
    "kind": "authored",
    "type": "authored",
    "statement": "제시된 네 왕조의 성립 순서를 이른 것부터 바르게 배열한 것은?",
    "options": [
      "당 → 송 → 원 → 명",
      "송 → 당 → 원 → 명",
      "당 → 원 → 송 → 명",
      "명 → 원 → 송 → 당",
      "원 → 당 → 명 → 송"
    ],
    "answerIndex": 0,
    "hint": "당 다음에 송, 몽골계 왕조 원 다음에 명을 연결하세요.",
    "solutionSteps": [
      "당은 네 왕조 가운데 가장 먼저 성립했다.",
      "송은 원보다 먼저 성립하였다.",
      "명은 원 이후에 성립하였으므로 당→송→원→명이다."
    ],
    "commonMistakes": [
      "왕조의 성립 순서와 인접 정권의 모든 존속 기간이 겹치지 않는다는 주장을 혼동하지 않는다.",
      "원과 명의 순서를 바꾸지 않는다."
    ],
    "optionAnalysis": [
      "당이 먼저 성립했고 이후 송·원·명의 순서로 성립하였다.",
      "당과 송의 선후 관계가 바뀌었다.",
      "송은 원보다 먼저 성립하였다.",
      "제시된 왕조의 성립 순서를 반대로 놓았다.",
      "당은 원보다 앞서며 송도 명보다 앞서 성립하였다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "동아시아사"
  },
  {
    "id": "authored-social-east-history-mongol-japan",
    "courseId": "social-east-history",
    "topicId": "social-east-history-mongol-japan",
    "domain": "사회탐구",
    "subject": "동아시아사",
    "topic": "원의 일본 원정",
    "kind": "authored",
    "type": "authored",
    "statement": "자료의 사건은?",
    "options": [
      "임진왜란",
      "청·일 전쟁",
      "수의 고구려 침략",
      "병자호란",
      "여몽 연합군의 일본 원정"
    ],
    "answerIndex": 4,
    "hint": "13세기 후반, 원, 고려, 일본이라는 네 단서를 연결하세요.",
    "solutionSteps": [
      "제시된 중국 왕조는 몽골계 왕조인 원이다.",
      "고려와 함께 일본을 공격했다는 방향이 드러난다.",
      "따라서 여몽 연합군의 일본 원정이다."
    ],
    "commonMistakes": [
      "임진왜란과 공격의 방향을 혼동하지 않는다.",
      "원·명·청이 등장하는 시대를 구분한다."
    ],
    "optionAnalysis": [
      "임진왜란은 16세기 말 일본이 조선을 침략한 전쟁으로 시대와 방향이 다르다.",
      "청·일 전쟁은 19세기 말의 전쟁으로 원과 고려가 참여한 사건이 아니다.",
      "수와 고구려의 전쟁은 7세기이며 일본 원정이 아니다.",
      "병자호란은 17세기 청이 조선을 침략한 전쟁으로 제시된 사건과 다르다.",
      "13세기 후반 원과 고려가 일본으로 원정했다는 단서에 부합한다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf",
      "https://contents.history.go.kr/"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "13세기 후반 중국을 지배한 원은 고려와 함께 두 차례에 걸쳐 일본으로 군대를 보냈으나 일본 정복에 실패하였다.",
    "courseName": "동아시아사"
  },
  {
    "id": "authored-social-east-history-imjin",
    "courseId": "social-east-history",
    "topicId": "social-east-history-imjin",
    "domain": "사회탐구",
    "subject": "동아시아사",
    "topic": "임진왜란의 국제적 성격",
    "kind": "authored",
    "type": "authored",
    "statement": "자료의 전쟁에서 조선을 지원한 중국 왕조는?",
    "options": [
      "송",
      "원",
      "진(秦)",
      "명",
      "당"
    ],
    "answerIndex": 3,
    "hint": "전쟁이 16세기 말에 시작되었다는 점을 보세요.",
    "solutionSteps": [
      "1592년 일본의 조선 침략으로 임진왜란이 시작되었다.",
      "당시 중국의 왕조는 명이었다.",
      "명은 조선을 지원하여 일본군과 맞섰다."
    ],
    "commonMistakes": [
      "명의 지원을 원이나 당의 활동과 혼동하지 않는다.",
      "일본의 조선 침략과 원의 일본 원정을 같은 전쟁으로 보지 않는다."
    ],
    "optionAnalysis": [
      "송은 13세기에 멸망했으므로 1592년의 중국 왕조가 아니다.",
      "원은 명의 성립 이전 시기와 관련되며 1592년 조선을 지원한 왕조가 아니다.",
      "진은 기원전 중국 통일 왕조로 임진왜란 시기의 왕조가 아니다.",
      "1592년 임진왜란 당시 조선을 지원한 중국 왕조는 명이다.",
      "당은 임진왜란보다 훨씬 이전인 907년에 멸망하였다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://contents.history.go.kr/data/pdf/eh/eh_r0295_0010.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "1592년 일본군이 조선을 침략하였다. 조선의 관군과 의병이 맞섰고 중국 왕조가 지원군을 파견하면서 전쟁은 동아시아 여러 나라가 관여한 전쟁으로 전개되었다.",
    "courseName": "동아시아사"
  },
  {
    "id": "authored-social-east-history-meiji",
    "courseId": "social-east-history",
    "topicId": "social-east-history-meiji",
    "domain": "사회탐구",
    "subject": "동아시아사",
    "topic": "메이지 유신과 근대화",
    "kind": "authored",
    "type": "authored",
    "statement": "자료가 설명하는 사건은?",
    "options": [
      "신해혁명",
      "프랑스 혁명",
      "메이지 유신",
      "다이카 개신",
      "갑오개혁"
    ],
    "answerIndex": 2,
    "hint": "일본, 1868년, 막부 붕괴라는 단서를 확인하세요.",
    "solutionSteps": [
      "자료의 국가는 일본이다.",
      "1868년 무렵 막부 체제가 무너지고 새 정부가 등장했다.",
      "이 변혁은 메이지 유신이다."
    ],
    "commonMistakes": [
      "다이카 개신과 메이지 유신의 시대를 구분한다.",
      "조선·중국·일본의 근대 개혁을 같은 사건으로 묶지 않는다."
    ],
    "optionAnalysis": [
      "신해혁명은 1911년 중국의 청 왕조 붕괴와 공화정 수립에 관련된다.",
      "프랑스 혁명은 1789년에 시작되었으며 일본의 막부 붕괴가 아니다.",
      "1868년 무렵 막부 붕괴와 새 정부의 제도 개혁은 메이지 유신의 특징이다.",
      "다이카 개신은 7세기 일본의 개혁으로 19세기의 사건이 아니다.",
      "갑오개혁은 1894년 조선에서 추진된 개혁이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_40&levelId=kc_i401703"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "일본에서 1868년을 전후하여 막부 중심의 지배 체제가 무너지고 새 정부가 들어섰다. 새 정부는 중앙집권화와 근대적 제도 정비를 추진하였다.",
    "courseName": "동아시아사"
  },
  {
    "id": "authored-social-world-history-french-rights",
    "courseId": "social-world-history",
    "topicId": "social-world-history-french-rights",
    "domain": "사회탐구",
    "subject": "세계사",
    "topic": "프랑스 혁명과 인권 선언",
    "kind": "authored",
    "type": "authored",
    "statement": "1789년 인간과 시민의 권리 선언이 채택된 혁명은?",
    "options": [
      "이란 이슬람 혁명",
      "프랑스 혁명",
      "러시아 혁명",
      "중국의 신해혁명",
      "영국 명예혁명"
    ],
    "answerIndex": 1,
    "hint": "연도와 선언의 이름을 국가에 연결하세요.",
    "solutionSteps": [
      "선언이 채택된 연도는 1789년이다.",
      "선언은 자유와 권리의 평등 등을 원리로 제시했다.",
      "이 선언이 채택된 혁명은 프랑스 혁명이다."
    ],
    "commonMistakes": [
      "영국의 권리 장전과 프랑스의 인권 선언을 혼동하지 않는다.",
      "선언의 원칙이 당시 모든 사람에게 완전히 실현되었다고 확대하지 않는다."
    ],
    "optionAnalysis": [
      "이란 이슬람 혁명은 1979년의 사건으로 시대와 국가가 다르다.",
      "1789년 권리 선언은 프랑스 혁명 과정에서 채택되었다.",
      "러시아 혁명은 1917년의 사건으로 1789년 프랑스의 선언과 다르다.",
      "신해혁명은 1911년에 일어났으며 프랑스의 권리 선언과 다르다.",
      "영국 명예혁명은 1688년에 일어난 사건으로 1789년의 프랑스 혁명과 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.legifrance.gouv.fr/Droit-francais/Constitution/Declaration-des-Droits-de-l-Homme-et-du-Citoyen-de-1789"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "세계사"
  },
  {
    "id": "authored-social-world-history-industrial",
    "courseId": "social-world-history",
    "topicId": "social-world-history-industrial",
    "domain": "사회탐구",
    "subject": "세계사",
    "topic": "영국 산업혁명",
    "kind": "authored",
    "type": "authored",
    "statement": "자료가 설명하는 변화가 가장 먼저 본격화된 국가는?",
    "options": [
      "영국",
      "고대 이집트",
      "아즈텍 제국",
      "고대 메소포타미아",
      "13세기 몽골 제국"
    ],
    "answerIndex": 0,
    "hint": "18세기 후반, 증기기관, 공장제라는 단서를 함께 보세요.",
    "solutionSteps": [
      "기계화와 공장제 생산은 산업혁명의 핵심 변화이다.",
      "증기기관이 생산과 교통의 동력으로 활용되었다.",
      "이 변화가 먼저 본격화된 국가는 영국이다."
    ],
    "commonMistakes": [
      "고대의 기술 발달과 근대의 산업혁명을 같은 사건으로 보지 않는다.",
      "증기기관의 활용을 모든 산업화 변화의 유일한 원인으로 단정하지 않는다."
    ],
    "optionAnalysis": [
      "18세기 후반 기계화와 공장제 생산이 먼저 본격화된 산업혁명의 출발 국가는 영국이다.",
      "자료는 고대 농경 문명이 아니라 18세기 후반 산업화의 변화이다.",
      "아즈텍 제국은 자료의 근대 공장제 산업화와 해당 시기가 다르다.",
      "문자와 도시 문명의 형성과 근대 산업혁명은 구분해야 한다.",
      "몽골 제국의 팽창은 18세기 후반 공장제 기계 공업의 출발과 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://blog.sciencemuseum.org.uk/steaming-through-the-centuries/"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "18세기 후반 한 나라에서 기계가 생산에 널리 이용되고 공장제 생산이 확대되었다. 증기 동력의 활용은 이후 공업과 교통의 변화를 이끌었다.",
    "courseName": "세계사"
  },
  {
    "id": "authored-social-world-history-printing",
    "courseId": "social-world-history",
    "topicId": "social-world-history-printing",
    "domain": "사회탐구",
    "subject": "세계사",
    "topic": "근대 초기 유럽의 인쇄술",
    "kind": "authored",
    "type": "authored",
    "statement": "구텐베르크의 인쇄술 확산이 유럽 사회에 끼친 영향으로 가장 적절한 것은?",
    "options": [
      "전자우편이 15세기부터 보편화되었다.",
      "모든 책의 내용이 서로 완전히 같아졌다.",
      "인류가 문자를 처음 사용하게 되었다.",
      "대륙 간 항공 운송이 즉시 시작되었다.",
      "책의 제작과 지식의 확산을 촉진하였다."
    ],
    "answerIndex": 4,
    "hint": "복제 가능한 서적이 늘어나는 효과를 생각하세요.",
    "solutionSteps": [
      "인쇄술은 같은 내용을 여러 부 제작하는 데 쓰인다.",
      "서적 제작이 확대되면 지식이 전달될 통로가 늘어난다.",
      "따라서 책의 제작과 지식의 확산을 촉진했다는 설명이 적절하다."
    ],
    "commonMistakes": [
      "유럽의 인쇄술 확산을 세계 최초 금속활자 발명과 동일시하지 않는다.",
      "인쇄술과 전자 통신 기술의 시대를 혼동하지 않는다."
    ],
    "optionAnalysis": [
      "전자우편은 훨씬 뒤의 디지털 통신 기술이다.",
      "인쇄의 확산이 다양한 내용의 책 자체를 없애는 것은 아니다.",
      "문자의 사용은 구텐베르크의 인쇄술보다 훨씬 오래전부터 있었다.",
      "항공 운송은 인쇄술 확산과 다른 시대·기술의 변화이다.",
      "활자를 이용한 인쇄는 서적 제작과 정보 전달의 확대에 기여하였다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.unesco.org/en/memory-world/42-line-gutenberg-bible-printed-vellum-and-its-contemporary-documentary-background"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "세계사"
  },
  {
    "id": "authored-social-world-history-cold-war",
    "courseId": "social-world-history",
    "topicId": "social-world-history-cold-war",
    "domain": "사회탐구",
    "subject": "세계사",
    "topic": "냉전과 양극 체제",
    "kind": "authored",
    "type": "authored",
    "statement": "제2차 세계 대전 이후 냉전의 두 중심 국가 조합은?",
    "options": [
      "아테네와 스파르타",
      "수와 고구려",
      "원과 남송",
      "미국과 소련",
      "고대 이집트와 히타이트"
    ],
    "answerIndex": 3,
    "hint": "전후 자본주의 진영과 사회주의 진영의 중심을 떠올려 보세요.",
    "solutionSteps": [
      "문제의 시기는 제2차 세계 대전 이후이다.",
      "미국과 소련은 서로 다른 진영의 중심이 되었다.",
      "따라서 냉전의 중심 국가 조합은 미국과 소련이다."
    ],
    "commonMistakes": [
      "냉전의 대립을 미국과 소련 사이의 지속적인 직접 전면전으로 이해하지 않는다.",
      "다른 시대의 국제 대립을 전후 냉전과 섞지 않는다."
    ],
    "optionAnalysis": [
      "고대 그리스 폴리스의 대립으로 시대가 다르다.",
      "7세기 동아시아 전쟁과 관련된 국가로 냉전과 다르다.",
      "13세기 동아시아의 정복 전쟁과 관련된 국가들이다.",
      "전후 냉전은 미국과 소련을 중심으로 한 두 진영의 대립으로 전개되었다.",
      "고대 서아시아 국제 관계의 국가들로 전후 냉전의 중심 국가가 아니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://history.state.gov/milestones/1945-1952/kennan"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "세계사"
  },
  {
    "id": "authored-social-economics-opportunity",
    "courseId": "social-economics",
    "topicId": "social-economics-opportunity",
    "domain": "사회탐구",
    "subject": "경제",
    "topic": "명시적 비용과 기회비용",
    "kind": "authored",
    "type": "authored",
    "statement": "주어진 조건에서 강의를 선택할 때의 기회비용은?",
    "options": [
      "7,000원",
      "13,000원",
      "11,000원",
      "2,000원",
      "9,000원"
    ],
    "answerIndex": 2,
    "hint": "강의료와 포기하는 최선 대안의 순수입을 더하세요.",
    "solutionSteps": [
      "강의를 선택하면 강의료 2,000원을 지불한다.",
      "같은 시간의 아르바이트 순수입 9,000원을 포기한다.",
      "기회비용은 2,000+9,000=11,000원이다."
    ],
    "commonMistakes": [
      "현금으로 지불한 금액만 기회비용으로 보지 않는다.",
      "포기한 여러 대안의 가치를 모두 합하지 않고 최선 대안의 가치를 본다."
    ],
    "optionAnalysis": [
      "두 비용을 더해야 하는데 9,000원에서 강의료를 뺐다.",
      "자료에 제시되지 않은 비용 2,000원을 추가로 넣은 값이다.",
      "강의료 2,000원과 포기하는 아르바이트 순수입 9,000원을 합하면 11,000원이다.",
      "명시적 비용만 계산하여 포기한 아르바이트의 순수입을 누락했다.",
      "포기한 대안의 순수입만 계산하여 강의료를 누락했다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.bok.or.kr/portal/bbs/B0000216/view.do?listType=G&menuNo=200647&nttId=165601&pageIndex=1"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "한 학생은 같은 시간에 강의 수강과 아르바이트 중 하나만 선택할 수 있다. 강의료는 2,000원이다. 아르바이트를 하면 별도의 비용 없이 9,000원의 순수입을 얻는다. 다른 대안과 비용은 없다고 가정한다.",
    "verification": {
      "explicitCost": 2000,
      "forgoneNetBenefit": 9000,
      "expectedValue": 11000
    },
    "courseName": "경제"
  },
  {
    "id": "authored-social-economics-equilibrium",
    "courseId": "social-economics",
    "topicId": "social-economics-equilibrium",
    "domain": "사회탐구",
    "subject": "경제",
    "topic": "시장 균형 계산",
    "kind": "authored",
    "type": "authored",
    "statement": "주어진 시장의 균형 가격 P와 균형 거래량 Q는?",
    "options": [
      "P=60, Q=20",
      "P=20, Q=60",
      "P=10, Q=80",
      "P=20, Q=20",
      "P=40, Q=20"
    ],
    "answerIndex": 1,
    "hint": "균형에서는 Qd=Qs입니다.",
    "solutionSteps": [
      "100−2P=20+2P로 놓는다.",
      "80=4P이므로 균형 가격은 P=20이다.",
      "Q=100−2×20=60이며 공급식에서도 60이다."
    ],
    "commonMistakes": [
      "가격만 구하고 거래량 확인을 생략하지 않는다.",
      "수요량과 공급량을 더한 값을 균형 거래량으로 보지 않는다."
    ],
    "optionAnalysis": [
      "P=60을 대입하면 주어진 함수의 수요량과 공급량이 일치하지 않는다.",
      "100−2P=20+2P에서 P=20이고 Q=60이다.",
      "P=10에서 수요량 80과 공급량 40이 일치하지 않는다.",
      "균형 가격은 맞지만 수요·공급 식에 대입한 거래량은 60이다.",
      "P=40에서는 수요량 20, 공급량 100으로 일치하지 않는다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.bok.or.kr/portal/bbs/B0000216/view.do?listType=G&menuNo=200647&nttId=165601&pageIndex=1"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상 시장의 수요 함수는 Qd=100−2P, 공급 함수는 Qs=20+2P이다. P는 가격, Q는 수량이며 다른 조건은 일정하다.",
    "verification": {
      "price": 20,
      "quantity": 60,
      "expectedValue": 60
    },
    "courseName": "경제"
  },
  {
    "id": "authored-social-economics-comparative",
    "courseId": "social-economics",
    "topicId": "social-economics-comparative",
    "domain": "사회탐구",
    "subject": "경제",
    "topic": "비교우위와 기회비용",
    "kind": "authored",
    "type": "authored",
    "statement": "주어진 조건에서 각 나라가 비교우위를 가지는 재화는?",
    "options": [
      "A국은 쌀, B국은 옷",
      "A국은 옷, B국은 쌀",
      "두 나라 모두 쌀과 옷에서 비교우위가 없다.",
      "A국은 두 재화 모두 비교우위가 있고 B국은 없다.",
      "B국은 두 재화 모두 비교우위가 있고 A국은 없다."
    ],
    "answerIndex": 0,
    "hint": "쌀 1단위의 노동시간을 옷 1단위의 노동시간으로 나누세요.",
    "solutionSteps": [
      "A국에서 쌀 1단위의 기회비용은 2/4=옷 1/2단위이다.",
      "B국에서는 6/3=옷 2단위이므로 A국이 쌀 생산의 기회비용이 낮다.",
      "옷의 기회비용은 B국이 낮으므로 A국은 쌀, B국은 옷에 비교우위가 있다."
    ],
    "commonMistakes": [
      "생산 시간이 짧다는 절대우위와 비교우위를 혼동하지 않는다.",
      "기회비용의 분자와 분모를 바꾸어 읽지 않는다."
    ],
    "optionAnalysis": [
      "쌀 1단위의 기회비용은 A국 옷 1/2단위, B국 옷 2단위이므로 A국은 쌀에 비교우위가 있다. 옷은 B국이 비교우위이다.",
      "각 재화의 기회비용 비교 결과를 반대로 해석했다.",
      "노동시간 비율이 달라 재화별 기회비용에 차이가 있다.",
      "기회비용이 서로 역수이므로 주어진 두 재화 모두를 한 나라가 비교우위로 가질 수 없다.",
      "주어진 노동시간에서 A국의 쌀 생산 기회비용이 더 낮다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.bok.or.kr/portal/bbs/B0000216/view.do?listType=G&menuNo=200647&nttId=165601&pageIndex=1",
      "https://eiec.kdi.re.kr/material/conceptList.do?idx=153"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "쌀·옷 각 1단위를 생산하는 데 필요한 노동시간\nA국: 쌀 2시간, 옷 4시간\nB국: 쌀 6시간, 옷 3시간\n각 나라의 생산 기회비용은 일정하며 노동만 생산요소라고 가정한다.",
    "verification": {
      "A_rice_cost_cloth": 0.5,
      "B_rice_cost_cloth": 2,
      "A_cloth_cost_rice": 2,
      "B_cloth_cost_rice": 0.5,
      "expected": "A국은 쌀, B국은 옷"
    },
    "courseName": "경제"
  },
  {
    "id": "authored-social-economics-gdp-deflator",
    "courseId": "social-economics",
    "topicId": "social-economics-gdp-deflator",
    "domain": "사회탐구",
    "subject": "경제",
    "topic": "명목·실질 GDP와 물가",
    "kind": "authored",
    "type": "authored",
    "statement": "주어진 가상 경제의 GDP 디플레이터는?",
    "options": [
      "90.9",
      "20",
      "100",
      "220",
      "110"
    ],
    "answerIndex": 4,
    "hint": "명목/실질×100이라는 비율을 사용하세요.",
    "solutionSteps": [
      "명목 GDP는 220, 실질 GDP는 200이다.",
      "공식에 대입하면 220/200×100이다.",
      "따라서 GDP 디플레이터는 110이다."
    ],
    "commonMistakes": [
      "명목과 실질 GDP의 단순 차이를 물가 지수로 쓰지 않는다.",
      "기준연도 지수 100과 비교할 때 지수와 증가율을 구분한다."
    ],
    "optionAnalysis": [
      "실질 GDP를 명목 GDP로 나누어 분자와 분모를 뒤집은 값이다.",
      "명목과 실질 GDP의 차이를 지수 자체로 본 값이다.",
      "명목과 실질 GDP가 같을 때의 값으로 현재 자료와 다르다.",
      "명목 GDP의 수치를 지수로 그대로 사용한 값이다.",
      "220/200×100=110이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.bok.or.kr/portal/bbs/B0000216/view.do?listType=G&menuNo=200647&nttId=165601&pageIndex=1"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "같은 기준의 화폐 단위로 측정한 가상 경제의 명목 GDP는 220, 실질 GDP는 200이다. GDP 디플레이터=(명목 GDP/실질 GDP)×100으로 계산한다.",
    "verification": {
      "nominal": 220,
      "real": 200,
      "expectedValue": 110
    },
    "courseName": "경제"
  },
  {
    "id": "authored-social-politics-sovereignty",
    "courseId": "social-politics",
    "topicId": "social-politics-sovereignty",
    "domain": "사회탐구",
    "subject": "정치와 법",
    "topic": "국민 주권",
    "kind": "authored",
    "type": "authored",
    "statement": "대한민국 헌법의 국민 주권 원리에 가장 부합하는 설명은?",
    "options": [
      "행정부는 국민과 무관하게 무제한의 권력을 가진다.",
      "선거 이후에는 국민의 정치 참여가 원칙적으로 금지된다.",
      "공무원 개인의 사적 이익이 국가 권력의 최종 목적이다.",
      "국가 권력의 정당성은 국민에게서 나온다.",
      "국가 권력은 특정 가문의 혈통에 영구히 귀속된다."
    ],
    "answerIndex": 3,
    "hint": "권력의 근원이 누구인가를 묻는 원리입니다.",
    "solutionSteps": [
      "국민 주권은 주권의 귀속 주체를 국민으로 본다.",
      "국가 기관의 권한도 국민에게서 정당성을 얻는다.",
      "따라서 국가 권력의 정당성은 국민에게서 나온다는 설명이 적절하다."
    ],
    "commonMistakes": [
      "국민 주권을 특정 통치자의 사적 소유권으로 바꾸지 않는다.",
      "선거가 정치 참여의 유일한 형태라고 단정하지 않는다."
    ],
    "optionAnalysis": [
      "국민 주권과 권력 제한의 취지에 어긋난다.",
      "국민 주권이 선거 이후 모든 정치 참여를 금지한다는 뜻은 아니다.",
      "국가 권력을 국민이 아니라 공무원의 사익에 귀속시키는 설명이다.",
      "국민에게 주권이 있다는 원리는 국가 권력의 정당성의 근원을 국민에게 둔다.",
      "국민이 아니라 특정 가문의 혈통을 권력의 근원으로 삼는 설명이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.law.go.kr/lsInfoP.do?lsiSeq=61603&viewCls=engLsInfoR",
      "https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1027547733"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "정치와 법"
  },
  {
    "id": "authored-social-politics-separation",
    "courseId": "social-politics",
    "topicId": "social-politics-separation",
    "domain": "사회탐구",
    "subject": "정치와 법",
    "topic": "권력 분립과 견제",
    "kind": "authored",
    "type": "authored",
    "statement": "자료의 제도가 지향하는 원리로 가장 적절한 것은?",
    "options": [
      "국민의 기본권 보호를 원천적으로 금지",
      "모든 기관 사이의 어떠한 협력도 영구 금지",
      "권력 분립과 상호 견제",
      "한 개인에게 모든 국가 권력을 무제한 집중",
      "모든 국가 기관의 기능을 완전히 없애기"
    ],
    "answerIndex": 2,
    "hint": "권력의 집중 방지라는 목적을 보세요.",
    "solutionSteps": [
      "자료는 국가 기능을 서로 다른 기관에 나누어 맡긴다.",
      "기관 간 견제를 두어 어느 한 기관의 권력 남용을 막으려 한다.",
      "이 원리는 권력 분립과 상호 견제이다."
    ],
    "commonMistakes": [
      "권력 분립을 기관 간 모든 협력의 금지로 해석하지 않는다.",
      "기능 분담과 국가 기능의 소멸을 혼동하지 않는다."
    ],
    "optionAnalysis": [
      "권력 남용을 방지해 기본권을 보호하려는 취지와 다르다.",
      "권력 분립은 기능 분담과 견제이며 필요한 협력까지 모두 금지하지 않는다.",
      "권력을 여러 기관에 나누고 견제하게 하는 것은 권력 분립의 취지이다.",
      "여러 기관에 기능을 나누고 견제한다는 자료와 반대이다.",
      "기능을 없애는 것이 아니라 기관별로 나누어 맡기는 제도이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.law.go.kr/lsInfoP.do?lsiSeq=61603&viewCls=engLsInfoR"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "입법·행정·사법 기능을 서로 다른 국가 기관이 담당하고, 각 기관이 다른 기관의 권력 남용을 견제하도록 제도를 설계한다.",
    "courseName": "정치와 법"
  },
  {
    "id": "authored-social-politics-participation",
    "courseId": "social-politics",
    "topicId": "social-politics-participation",
    "domain": "사회탐구",
    "subject": "정치와 법",
    "topic": "참정권의 이해",
    "kind": "authored",
    "type": "authored",
    "statement": "국민이 대표자를 선출하는 선거에 참여할 권리가 가장 직접적으로 해당하는 기본권은?",
    "options": [
      "인간의 생물학적 특성 그 자체",
      "참정권",
      "교육을 받을 권리로서의 사회권",
      "재판을 청구할 권리로서의 청구권",
      "거주·이전의 자유로서의 자유권"
    ],
    "answerIndex": 1,
    "hint": "정치적 결정에 참여한다는 뜻을 기준으로 분류하세요.",
    "solutionSteps": [
      "선거권은 대표자를 선출하는 정치적 참여 권리이다.",
      "정치적 의사 형성에 참여하는 기본권은 참정권으로 분류한다.",
      "따라서 참정권이 정답이다."
    ],
    "commonMistakes": [
      "기본권을 모두 같은 유형으로 취급하지 않는다.",
      "선거에 참여할 권리와 재판으로 구제받을 권리를 구분한다."
    ],
    "optionAnalysis": [
      "기본권의 법적 유형을 묻는 문제에서 생물학적 특성은 분류 범주가 아니다.",
      "대표자 선출을 통해 정치적 의사 형성에 참여하는 선거권은 참정권이다.",
      "교육권은 사회권의 대표적 예이며 선거 참여 권리의 직접 분류와 다르다.",
      "재판 청구권과 대표자 선출에 참여하는 권리는 구분된다.",
      "거주·이전의 자유는 자유권으로 선거권과 직접 분류가 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.law.go.kr/lsInfoP.do?lsiSeq=61603&viewCls=engLsInfoR"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "정치와 법"
  },
  {
    "id": "authored-social-politics-proportional",
    "courseId": "social-politics",
    "topicId": "social-politics-proportional",
    "domain": "사회탐구",
    "subject": "정치와 법",
    "topic": "가상 비례 배분 계산",
    "kind": "authored",
    "type": "authored",
    "statement": "가상 규칙에 따라 A당과 B당이 얻는 의석 수는?",
    "options": [
      "A당 3석, B당 2석",
      "A당 2석, B당 3석",
      "A당 5석, B당 0석",
      "A당 4석, B당 1석",
      "A당 3석, B당 3석"
    ],
    "answerIndex": 0,
    "hint": "전체 의석 수에 각 정당의 득표율을 곱하세요.",
    "solutionSteps": [
      "전체 의석 수는 5석이다.",
      "A당은 5×60%=3석, B당은 5×40%=2석이다.",
      "두 정당의 합은 5석으로 전체 의석 수와 일치한다."
    ],
    "commonMistakes": [
      "이 가상 계산을 실제 한국의 비례대표 의석 배분법과 동일시하지 않는다.",
      "각 정당의 의석 합계가 전체 의석 수와 같은지 확인한다."
    ],
    "optionAnalysis": [
      "5×0.60=3, 5×0.40=2이므로 주어진 가상 규칙에 일치한다.",
      "정당별 득표 비율을 반대로 적용한 값이다.",
      "득표 1위가 모든 의석을 얻는 규칙이 아니라 득표율에 비례해 배분한다.",
      "주어진 득표율 60%와 40%에 대한 정확한 비례 배분이 아니다.",
      "전체 5석을 초과하므로 조건을 위반한다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상의 선거구에서 의석 5석을 A당과 B당의 득표율에 정확히 비례하여 나눈다. A당은 60%, B당은 40%를 득표하였다. 봉쇄 조항·지역구 의석·반올림·기타 보정은 없으며 계산 결과는 정수이다.",
    "verification": {
      "A": 3,
      "B": 2,
      "total": 5,
      "expected": "A당 3석, B당 2석"
    },
    "courseName": "정치와 법"
  },
  {
    "id": "authored-social-culture-shared-culture",
    "courseId": "social-culture",
    "topicId": "social-culture-shared-culture",
    "domain": "사회탐구",
    "subject": "사회·문화",
    "topic": "문화의 공유성",
    "kind": "authored",
    "type": "authored",
    "statement": "자료가 가장 직접적으로 강조하는 문화의 속성은?",
    "options": [
      "비문화적인 유전 형질",
      "사회 구성원과 완전히 무관한 개인만의 우연한 습관",
      "인간의 모든 행동은 학습 없이 유전된다는 속성",
      "어떤 문화 요소도 다른 요소와 관련되지 않는다는 속성",
      "공유성"
    ],
    "answerIndex": 4,
    "hint": "여러 구성원이 공통으로 이해한다는 부분에 주목하세요.",
    "solutionSteps": [
      "자료에서 같은 인사 행동을 여러 구성원이 이해한다.",
      "핵심은 행동에 부여한 의미가 사회적으로 공통이라는 점이다.",
      "문화의 공유성을 가장 직접적으로 보여 준다."
    ],
    "commonMistakes": [
      "문화의 여러 속성이 함께 나타날 수 있다는 점을 잊지 않는다.",
      "어떤 사회의 관습을 모든 사회에 똑같이 적용하지 않는다."
    ],
    "optionAnalysis": [
      "사회적으로 공유되는 인사 의미는 생물학적 유전 형질 자체가 아니다.",
      "여러 구성원이 의미를 공통으로 이해한다는 자료와 다르다.",
      "자료는 사회적 의미의 공유를 설명하며 모든 행동의 유전을 말하지 않는다.",
      "제시된 공유성과 무관하며 문화의 전체성과도 다른 주장이다.",
      "여러 구성원이 인사 행동의 의미를 공통으로 이해한다는 점이 공유성이다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "어느 사회에서는 특정한 인사 행동이 감사의 뜻으로 통한다. 이 사회의 여러 구성원은 그 행동을 보았을 때 비슷한 의미로 이해한다.",
    "courseName": "사회·문화"
  },
  {
    "id": "authored-social-culture-formal-socialization",
    "courseId": "social-culture",
    "topicId": "social-culture-formal-socialization",
    "domain": "사회탐구",
    "subject": "사회·문화",
    "topic": "공식적 사회화 기관",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 사례에서 공식적 사회화 기관으로 가장 적절한 것은?",
    "options": [
      "가족의 평소 식사 대화",
      "길에서 우연히 만난 사람과의 짧은 대화",
      "바람이나 강수와 같은 자연 현상",
      "학교",
      "친구들의 자발적인 일상 대화 모임"
    ],
    "answerIndex": 3,
    "hint": "체계적 교육을 목적으로 설립되었는지를 확인하세요.",
    "solutionSteps": [
      "사회화는 사회생활에 필요한 내용을 배우는 과정이다.",
      "학교는 교육이라는 목적 아래 체계적 교육과정을 운영한다.",
      "따라서 공식적 사회화 기관에 해당한다."
    ],
    "commonMistakes": [
      "공식적 기관만 사회화에 영향을 준다고 생각하지 않는다.",
      "친구나 가족이 사회화에 중요하다는 사실과 공식적 기관 분류를 혼동하지 않는다."
    ],
    "optionAnalysis": [
      "가족은 중요한 사회화 기관이지만 제시된 공식적 교육 기관과 구분된다.",
      "우연한 상호작용과 교육 목적으로 설립된 기관은 다르다.",
      "자연 현상은 사회적 지식과 규범을 체계적으로 가르치는 사회화 기관이 아니다.",
      "체계적 교육을 위해 설립되어 교육과정을 운영하는 학교는 공식적 사회화 기관이다.",
      "친구 집단도 사회화에 영향을 주지만 체계적 교육을 목적으로 설립된 공식적 기관의 사례와는 다르다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "courseName": "사회·문화"
  },
  {
    "id": "authored-social-culture-sample-survey",
    "courseId": "social-culture",
    "topicId": "social-culture-sample-survey",
    "domain": "사회탐구",
    "subject": "사회·문화",
    "topic": "모집단과 표본",
    "kind": "authored",
    "type": "authored",
    "statement": "자료에서 모집단과 표본을 바르게 연결한 것은?",
    "options": [
      "모집단은 오직 조사자의 친구만을 뜻한다.",
      "표본은 조사와 무관한 다른 학교의 모든 학생이다.",
      "모집단은 이 학교 전체 학생 1,000명, 표본은 조사 대상으로 뽑힌 100명이다.",
      "모집단은 뽑힌 100명, 표본은 전체 학생 1,000명이다.",
      "모집단과 표본은 언제나 완전히 같은 대상을 뜻한다."
    ],
    "answerIndex": 2,
    "hint": "알고 싶은 전체와 실제로 뽑힌 일부를 구분하세요.",
    "solutionSteps": [
      "연구 목적은 이 학교 전체 학생의 의견을 알아보는 것이다.",
      "따라서 전체 학생 1,000명이 모집단이다.",
      "실제로 조사 대상으로 뽑은 100명이 표본이다."
    ],
    "commonMistakes": [
      "표본 크기가 크다는 사실만으로 모든 표집 편향이 사라진다고 보지 않는다.",
      "모집단과 실제 응답자 또는 추출 표본을 무조건 같은 집단으로 보지 않는다."
    ],
    "optionAnalysis": [
      "자료가 알고자 하는 전체 대상은 이 학교 전체 학생이다.",
      "자료에서 실제 조사 대상으로 뽑은 학생 100명이 표본이다.",
      "알고자 하는 전체가 1,000명이고 실제로 뽑힌 일부가 100명이다.",
      "전체와 일부의 관계를 반대로 연결했다.",
      "전수조사가 아닌 표본조사에서는 전체와 뽑힌 일부를 구분한다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://mods.go.kr/board.es?act=view&bid=3246&list_no=161974&mid=a10502010000&nPage=1&ref_bid=&tag="
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "한 연구자는 학생 1,000명이 있는 학교의 전체 학생 의견을 알아보려 한다. 이 가운데 100명을 조사 대상으로 뽑아 설문한다. 이 문항에서는 뽑힌 100명이 모두 응답했다고 가정한다.",
    "courseName": "사회·문화"
  },
  {
    "id": "authored-social-culture-mobility",
    "courseId": "social-culture",
    "topicId": "social-culture-mobility",
    "domain": "사회탐구",
    "subject": "사회·문화",
    "topic": "세대 간 사회 이동",
    "kind": "authored",
    "type": "authored",
    "statement": "자료에 제시된 이동 유형을 가장 적절하게 분류한 것은?",
    "options": [
      "부모와 자녀의 계층이 같아 사회 이동이 없다.",
      "세대 간 상승 이동",
      "세대 간 하강 이동",
      "세대 내 하강 이동",
      "수평 이동만 존재한다."
    ],
    "answerIndex": 1,
    "hint": "비교 대상이 부모와 자녀인지 같은 개인인지부터 확인하세요.",
    "solutionSteps": [
      "부모와 자녀라는 서로 다른 세대를 비교한다.",
      "부모의 하층보다 자녀의 중층이 계층 위계상 높다.",
      "따라서 세대 간 상승 이동이다."
    ],
    "commonMistakes": [
      "세대 간 이동과 세대 내 이동의 비교 대상을 혼동하지 않는다.",
      "직업 이름이 달라졌다는 사실만으로 상승·하강을 단정하지 않고 제시된 계층 기준을 본다."
    ],
    "optionAnalysis": [
      "자료에서 부모는 하층, 자녀는 중층으로 서로 다르다.",
      "부모의 하층과 자녀의 중층을 비교하므로 세대 간 비교이며 위계가 높아진 상승 이동이다.",
      "부모보다 자녀의 계층이 높아졌으므로 하강이 아니다.",
      "같은 개인의 전후가 아니라 부모와 자녀를 비교했고 방향도 상승이다.",
      "하층에서 중층으로 계층 위계가 달라졌으므로 수평 이동만의 사례가 아니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf"
    ],
    "contentNote": "실제 수능 기출이 아닌 자체 구성 개념 연습입니다. 참고 출처는 교과 범위·관련 개념을 확인하는 자료이며 출제 기관의 공식 해설을 뜻하지 않습니다.",
    "passage": "가상 사회는 상층·중층·하층을 구분하며 그 위계가 명확하다. 한 가구에서 부모 세대는 하층, 성인이 된 자녀 세대는 중층에 속한다.",
    "courseName": "사회·문화"
  },
  {
    "id": "authored-science-physics1-net-force",
    "courseId": "science-physics1",
    "topicId": "science-physics1-net-force",
    "domain": "과학탐구",
    "subject": "물리학Ⅰ",
    "topic": "알짜힘과 가속도",
    "kind": "authored",
    "type": "authored",
    "statement": "질량이 3kg인 물체에 일정한 알짜힘 15N이 작용한다. 이 물체의 가속도 크기는?",
    "options": [
      "0m/s²",
      "5m/s²",
      "45m/s²",
      "3m/s²",
      "12m/s²"
    ],
    "answerIndex": 1,
    "hint": "알짜힘을 질량으로 나누세요.",
    "solutionSteps": [
      "구하려는 가속도는 뉴턴 제2법칙 F=ma로 계산합니다.",
      "a=F/m에 F=15N, m=3kg을 대입합니다.",
      "a=15/3=5m/s²입니다."
    ],
    "commonMistakes": [
      "힘의 단위 N을 가속도 단위 m/s²와 혼동하지 마세요.",
      "물체에 작용하는 개별 힘이 아니라 알짜힘을 사용합니다."
    ],
    "optionAnalysis": [
      "알짜힘이 0이 아니므로 가속도도 0이 아닙니다.",
      "a=F/m=15/3=5m/s²이므로 정답입니다.",
      "F와 m을 곱한 값입니다. 가속도는 F를 m으로 나눕니다.",
      "질량 3kg을 가속도 값으로 그대로 쓰면 안 됩니다.",
      "힘에서 질량을 뺄 수 없습니다. 두 양의 단위도 다릅니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/4-section-summary"
    ],
    "verification": {
      "parameters": {
        "forceN": 15,
        "massKg": 3
      },
      "expectedValue": 5,
      "unit": "m/s²"
    },
    "courseName": "물리학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-physics1-momentum",
    "courseId": "science-physics1",
    "topicId": "science-physics1-momentum",
    "domain": "과학탐구",
    "subject": "물리학Ⅰ",
    "topic": "충돌과 운동량 보존",
    "kind": "authored",
    "type": "authored",
    "statement": "질량 2kg인 수레가 오른쪽으로 3m/s로 움직이다가 정지한 질량 1kg인 수레와 충돌해 붙었다. 수평 방향의 외부 힘의 충격량을 무시할 때, 충돌 직후 두 수레의 속도는?",
    "options": [
      "오른쪽 1m/s",
      "오른쪽 6m/s",
      "오른쪽 3m/s",
      "왼쪽 2m/s",
      "오른쪽 2m/s"
    ],
    "answerIndex": 4,
    "hint": "붙은 뒤에는 두 질량을 더하세요.",
    "solutionSteps": [
      "오른쪽을 양의 방향으로 두면 초기 운동량은 2×3+1×0=6kg·m/s입니다.",
      "충돌 뒤 두 수레는 총질량 3kg으로 같은 속도 v로 움직입니다.",
      "운동량 보존식 6=3v에서 v=2m/s이며 방향은 오른쪽입니다."
    ],
    "commonMistakes": [
      "붙는 충돌에서 운동에너지까지 항상 보존된다고 가정하지 마세요.",
      "운동량은 방향이 있는 벡터량입니다."
    ],
    "optionAnalysis": [
      "총운동량 6을 총질량 3으로 나누면 2입니다.",
      "운동량 6kg·m/s를 속도 6m/s로 혼동했습니다.",
      "정지한 수레가 붙어 총질량이 커지므로 원래 속도를 유지하지 않습니다.",
      "전체 초기 운동량은 오른쪽이므로 최종 운동 방향도 오른쪽입니다.",
      "충돌 전 운동량 6kg·m/s를 총질량 3kg으로 나누면 오른쪽 2m/s입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/8-3-conservation-of-momentum"
    ],
    "verification": {
      "parameters": {
        "m1": 2,
        "v1": 3,
        "m2": 1,
        "v2": 0
      },
      "expectedValue": 2,
      "unit": "m/s"
    },
    "courseName": "물리학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-physics1-wave-speed",
    "courseId": "science-physics1",
    "topicId": "science-physics1-wave-speed",
    "domain": "과학탐구",
    "subject": "물리학Ⅰ",
    "topic": "파동의 속력",
    "kind": "authored",
    "type": "authored",
    "statement": "어떤 파동의 진동수는 50Hz이고 파장은 0.60m이다. 이 파동의 속력은?",
    "options": [
      "50m/s",
      "약 83.3m/s",
      "30m/s",
      "0.012m/s",
      "0.60m/s"
    ],
    "answerIndex": 2,
    "hint": "1초에 지나가는 파장의 개수를 생각하세요.",
    "solutionSteps": [
      "파동 속력의 관계식은 v=fλ입니다.",
      "진동수 50Hz와 파장 0.60m를 곱합니다.",
      "50×0.60=30이므로 속력은 30m/s입니다."
    ],
    "commonMistakes": [
      "Hz는 1초당 진동 횟수이며 m/s와 다른 단위입니다.",
      "파동 속력과 매질 입자의 진동 속도를 구분하세요."
    ],
    "optionAnalysis": [
      "진동수 50Hz를 속력으로 그대로 쓸 수 없습니다.",
      "진동수를 파장으로 나눈 값입니다. 속력은 둘을 곱합니다.",
      "v=fλ=50×0.60=30m/s입니다.",
      "파장을 진동수로 나눈 값으로, 파동의 속력 공식과 다릅니다.",
      "파장 0.60m는 길이이며 속력이 아닙니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "frequencyHz": 50,
        "wavelengthM": 0.6
      },
      "expectedValue": 30,
      "unit": "m/s"
    },
    "courseName": "물리학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-physics2-circular-acceleration",
    "courseId": "science-physics2",
    "topicId": "science-physics2-circular-acceleration",
    "domain": "과학탐구",
    "subject": "물리학Ⅱ",
    "topic": "등속 원운동의 구심 가속도",
    "kind": "authored",
    "type": "authored",
    "statement": "물체가 반지름 3m인 원을 따라 6m/s의 일정한 속력으로 움직인다. 구심 가속도의 크기는?",
    "options": [
      "2m/s²",
      "0m/s²",
      "36m/s²",
      "18m/s²",
      "12m/s²"
    ],
    "answerIndex": 4,
    "hint": "속력이 일정한 것과 속도가 일정한 것은 다릅니다.",
    "solutionSteps": [
      "등속 원운동의 가속도는 원의 중심 방향입니다.",
      "크기는 a=v²/r=6²/3으로 계산합니다.",
      "36/3=12m/s²입니다."
    ],
    "commonMistakes": [
      "등속이라는 말만 보고 가속도를 0으로 두지 마세요.",
      "v²/r에서 제곱을 빠뜨리지 마세요."
    ],
    "optionAnalysis": [
      "v/r을 계산한 값입니다. 속력을 제곱해야 합니다.",
      "속력이 일정해도 방향이 변하므로 가속도는 0이 아닙니다.",
      "v²만 구한 값이며 반지름 3m로 나누어야 합니다.",
      "속력과 반지름을 곱하면 구심 가속도가 되지 않습니다.",
      "a=v²/r=36/3=12m/s²입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/6-6-satellites-and-keplers-laws-an-argument-for-simplicity"
    ],
    "verification": {
      "parameters": {
        "speedMps": 6,
        "radiusM": 3
      },
      "expectedValue": 12,
      "unit": "m/s²"
    },
    "courseName": "물리학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-physics2-capacitor-charge",
    "courseId": "science-physics2",
    "topicId": "science-physics2-capacitor-charge",
    "domain": "과학탐구",
    "subject": "물리학Ⅱ",
    "topic": "축전기의 전하량",
    "kind": "authored",
    "type": "authored",
    "statement": "전기용량이 3μF인 축전기에 4V의 전압을 걸었다. 한쪽 판에 저장된 전하량의 크기는?",
    "options": [
      "24μC",
      "4μC",
      "0.75μC",
      "3μC",
      "12μC"
    ],
    "answerIndex": 4,
    "hint": "μF에 V를 곱하면 μC가 됩니다.",
    "solutionSteps": [
      "전하량과 전압의 관계식 Q=CV를 사용합니다.",
      "C=3μF, V=4V를 대입합니다.",
      "Q=12μC이며, 한쪽 판은 +12μC, 다른 판은 −12μC입니다."
    ],
    "commonMistakes": [
      "두 판의 전하량 크기를 더하지 마세요.",
      "전기용량 C와 전하량 Q의 기호를 구분하세요."
    ],
    "optionAnalysis": [
      "두 판의 전하량 크기를 더한 값입니다. 질문은 한쪽 판의 전하량입니다.",
      "전압의 수치를 전하량으로 그대로 쓸 수 없습니다.",
      "C/V를 계산한 값입니다. 전하량은 C와 V의 곱입니다.",
      "전기용량의 수치만 사용하고 전압을 반영하지 않았습니다.",
      "Q=CV=3μF×4V=12μC입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/19-5-capacitors-and-dielectrics"
    ],
    "verification": {
      "parameters": {
        "capacitanceMicroF": 3,
        "voltageV": 4
      },
      "expectedValue": 12,
      "unit": "μC"
    },
    "courseName": "물리학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-physics2-induced-emf",
    "courseId": "science-physics2",
    "topicId": "science-physics2-induced-emf",
    "domain": "과학탐구",
    "subject": "물리학Ⅱ",
    "topic": "전자기 유도와 자기 선속",
    "kind": "authored",
    "type": "authored",
    "statement": "100회 감은 코일에서 한 회로를 지나는 자기 선속이 0.50초 동안 0.020Wb만큼 일정한 비율로 감소했다. 코일에 생긴 유도 기전력의 크기는?",
    "options": [
      "4.0V",
      "10V",
      "1.0V",
      "0.040V",
      "2.0V"
    ],
    "answerIndex": 0,
    "hint": "감은 수를 곱한 뒤 걸린 시간으로 나누세요.",
    "solutionSteps": [
      "유도 기전력의 크기는 |ε|=N|ΔΦ|/Δt입니다.",
      "N=100, |ΔΦ|=0.020Wb, Δt=0.50s를 대입합니다.",
      "100×0.020/0.50=4.0V입니다."
    ],
    "commonMistakes": [
      "선속의 최종값이 아니라 변화량을 사용합니다.",
      "질문이 크기이므로 감소를 뜻하는 부호를 답의 음수로 옮기지 마세요."
    ],
    "optionAnalysis": [
      "|ε|=N|ΔΦ|/Δt=100×0.020/0.50=4.0V입니다.",
      "주어진 선속 변화량과 시간으로 계산한 4.0V와 다릅니다.",
      "시간으로 나누지 않고 곱한 값입니다.",
      "감은 수 100회를 곱하지 않은 값입니다.",
      "NΔΦ만 계산했고 변화에 걸린 시간으로 나누지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/23-2-faradays-law-of-induction-lenzs-law"
    ],
    "verification": {
      "parameters": {
        "turns": 100,
        "fluxChangeWb": 0.02,
        "timeS": 0.5
      },
      "expectedValue": 4,
      "unit": "V"
    },
    "courseName": "물리학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-chemistry1-mole-mass",
    "courseId": "science-chemistry1",
    "topicId": "science-chemistry1-mole-mass",
    "domain": "과학탐구",
    "subject": "화학Ⅰ",
    "topic": "몰과 질량",
    "kind": "authored",
    "type": "authored",
    "statement": "물의 몰 질량이 18g/mol일 때 물 36g의 물질의 양은?",
    "options": [
      "0.5mol",
      "2mol",
      "36mol",
      "648mol",
      "18mol"
    ],
    "answerIndex": 1,
    "hint": "질량 18g이 물 1mol에 해당합니다.",
    "solutionSteps": [
      "물질의 양은 질량을 몰 질량으로 나눕니다.",
      "36g÷18g/mol을 계산합니다.",
      "g가 약분되어 2mol이 됩니다."
    ],
    "commonMistakes": [
      "분자 1개의 질량과 1mol의 질량을 구분하세요.",
      "g와 mol은 같은 단위가 아닙니다."
    ],
    "optionAnalysis": [
      "몰 질량을 질량으로 나눈 역수 값입니다.",
      "n=m/M=36/18=2mol입니다.",
      "질량 36g을 몰수 36mol로 바꾸면 단위를 무시한 것입니다.",
      "질량과 몰 질량을 곱하지 않고 나누어야 합니다.",
      "몰 질량 18g/mol의 수치를 몰수로 쓸 수 없습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/chemistry-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "massG": 36,
        "molarMassGPerMol": 18
      },
      "expectedValue": 2,
      "unit": "mol"
    },
    "courseName": "화학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-chemistry1-ion-electron",
    "courseId": "science-chemistry1",
    "topicId": "science-chemistry1-ion-electron",
    "domain": "과학탐구",
    "subject": "화학Ⅰ",
    "topic": "양성자 수와 이온의 전자 수",
    "kind": "authored",
    "type": "authored",
    "statement": "원자 번호가 12인 마그네슘이 Mg²⁺ 이온이 되었을 때, 이 이온의 양성자 수와 전자 수를 순서대로 옳게 짝지은 것은?",
    "options": [
      "14개, 12개",
      "12개, 12개",
      "12개, 14개",
      "12개, 10개",
      "10개, 12개"
    ],
    "answerIndex": 3,
    "hint": "양전하는 전자를 잃었다는 뜻입니다.",
    "solutionSteps": [
      "원자 번호 12이므로 양성자 수는 12개입니다.",
      "2+ 전하는 중성 원자에서 전자 2개를 잃었음을 뜻합니다.",
      "전자 수는 12−2=10개이므로 12개, 10개입니다."
    ],
    "commonMistakes": [
      "이온 전하를 양성자 수의 변화로 해석하지 마세요.",
      "양이온과 음이온에서 전자 수 변화 방향이 반대입니다."
    ],
    "optionAnalysis": [
      "화학적 이온 형성에서 양성자 수는 증가하지 않습니다.",
      "전자 12개는 중성 Mg 원자의 전자 수입니다.",
      "전자 2개를 얻은 경우의 전자 수로, Mg²⁺와 반대입니다.",
      "양성자는 12개로 그대로이며 전자 2개를 잃어 전자는 10개입니다.",
      "양이온 형성은 양성자 2개가 사라지는 과정이 아닙니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/chemistry-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "atomicNumber": 12,
        "positiveCharge": 2
      },
      "expectedValue": 10,
      "unit": "electrons"
    },
    "courseName": "화학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-chemistry1-molarity",
    "courseId": "science-chemistry1",
    "topicId": "science-chemistry1-molarity",
    "domain": "과학탐구",
    "subject": "화학Ⅰ",
    "topic": "몰 농도",
    "kind": "authored",
    "type": "authored",
    "statement": "용질 0.15mol을 녹여 최종 부피가 0.50L인 용액을 만들었다. 이 용액의 몰 농도는?",
    "options": [
      "3.0mol/L",
      "0.15mol/L",
      "0.075mol/L",
      "0.30mol/L",
      "0.50mol/L"
    ],
    "answerIndex": 3,
    "hint": "최종 용액의 부피로 나누세요.",
    "solutionSteps": [
      "몰 농도 c=n/V를 사용합니다.",
      "용질 몰수는 0.15mol, 최종 용액 부피는 0.50L입니다.",
      "c=0.15/0.50=0.30mol/L입니다."
    ],
    "commonMistakes": [
      "부피를 mL로 받으면 L로 바꿉니다.",
      "용매 부피와 용액 부피를 혼동하지 마세요."
    ],
    "optionAnalysis": [
      "소수점 계산을 확인하세요. 0.15/0.50은 0.30입니다.",
      "용질 몰수만 적고 용액 부피를 반영하지 않았습니다.",
      "몰수에 부피를 곱한 값입니다. 농도는 나누어 구합니다.",
      "0.15mol÷0.50L=0.30mol/L입니다.",
      "부피 수치를 농도로 그대로 옮길 수 없습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/chemistry-2e/pages/3-3-molarity"
    ],
    "verification": {
      "parameters": {
        "soluteMol": 0.15,
        "solutionL": 0.5
      },
      "expectedValue": 0.3,
      "unit": "mol/L"
    },
    "courseName": "화학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-chemistry2-ideal-gas",
    "courseId": "science-chemistry2",
    "topicId": "science-chemistry2-ideal-gas",
    "domain": "과학탐구",
    "subject": "화학Ⅱ",
    "topic": "이상 기체 상태 방정식",
    "kind": "authored",
    "type": "authored",
    "statement": "1.0mol의 이상 기체가 300K에서 12L를 차지한다. 기체 상수 R=0.080L·atm/(mol·K)로 계산할 때 압력은?",
    "options": [
      "2.0atm",
      "0.50atm",
      "24atm",
      "12atm",
      "1.0atm"
    ],
    "answerIndex": 0,
    "hint": "300K는 이미 절대온도이므로 다시 273을 더하지 마세요.",
    "solutionSteps": [
      "상태 방정식 PV=nRT에서 P=nRT/V로 정리합니다.",
      "P=1.0×0.080×300/12를 계산합니다.",
      "분자 24를 12로 나누면 압력은 2.0atm입니다."
    ],
    "commonMistakes": [
      "R의 단위에 맞춰 L와 atm을 사용합니다.",
      "섭씨온도와 절대온도를 구분합니다."
    ],
    "optionAnalysis": [
      "P=nRT/V=1.0×0.080×300/12=2.0atm입니다.",
      "V/(nRT)를 계산한 역수 값입니다.",
      "nRT=24L·atm까지만 계산했고 부피로 나누지 않았습니다.",
      "부피 12L를 압력으로 그대로 옮긴 값입니다.",
      "몰수 1.0을 압력 값으로 그대로 쓸 수 없습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/chemistry-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "nMol": 1,
        "R": 0.08,
        "temperatureK": 300,
        "volumeL": 12
      },
      "expectedValue": 2,
      "unit": "atm"
    },
    "courseName": "화학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-chemistry2-equilibrium-constant",
    "courseId": "science-chemistry2",
    "topicId": "science-chemistry2-equilibrium-constant",
    "domain": "과학탐구",
    "subject": "화학Ⅱ",
    "topic": "화학 평형 상수",
    "kind": "authored",
    "type": "authored",
    "statement": "반응 N₂O₄(g) ⇌ 2NO₂(g)가 평형에 있다. 평형 농도가 [N₂O₄]=0.20mol/L, [NO₂]=0.40mol/L일 때 Kc=[NO₂]²/[N₂O₄]로 계산한 값은?",
    "options": [
      "5.0",
      "0.40",
      "0.50",
      "0.80",
      "2.0"
    ],
    "answerIndex": 3,
    "hint": "NO₂ 농도를 먼저 제곱하세요.",
    "solutionSteps": [
      "생성물 NO₂의 반응 계수가 2이므로 농도를 제곱합니다.",
      "Kc=0.40²/0.20=0.16/0.20입니다.",
      "계산 결과는 0.80입니다."
    ],
    "commonMistakes": [
      "반응 계수 2를 농도에 곱하는 대신 지수로 사용합니다.",
      "평형은 반응이 완전히 멈춘 상태가 아닙니다."
    ],
    "optionAnalysis": [
      "농도 식의 분자·분모와 지수를 다시 확인해야 합니다.",
      "NO₂의 농도를 그대로 적은 값으로 평형 상수 계산이 아닙니다.",
      "농도의 비를 반대로 세우거나 제곱을 빠뜨린 값입니다.",
      "0.40²/0.20=0.16/0.20=0.80입니다.",
      "0.40/0.20만 계산해 생성물 농도의 제곱을 빠뜨렸습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/chemistry-2e/pages/13-2-equilibrium-constants"
    ],
    "verification": {
      "parameters": {
        "NO2": 0.4,
        "N2O4": 0.2
      },
      "expectedValue": 0.8,
      "unit": "calculated Kc value"
    },
    "courseName": "화학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-chemistry2-hess-law",
    "courseId": "science-chemistry2",
    "topicId": "science-chemistry2-hess-law",
    "domain": "과학탐구",
    "subject": "화학Ⅱ",
    "topic": "헤스 법칙",
    "kind": "authored",
    "type": "authored",
    "statement": "같은 조건에서 A→B의 엔탈피 변화가 −30kJ, B→C의 엔탈피 변화가 −50kJ이다. 두 반응을 차례로 진행해 A→C가 될 때 엔탈피 변화는?",
    "options": [
      "−1500kJ",
      "−80kJ",
      "+80kJ",
      "+20kJ",
      "−20kJ"
    ],
    "answerIndex": 1,
    "hint": "반응식을 더할 때 엔탈피 변화도 더하세요.",
    "solutionSteps": [
      "A→B와 B→C를 더하면 중간 물질 B가 소거되어 A→C입니다.",
      "헤스 법칙에 따라 두 엔탈피 변화도 더합니다.",
      "ΔH=−30−50=−80kJ입니다."
    ],
    "commonMistakes": [
      "엔탈피 변화의 부호와 방출열의 양의 크기를 구분하세요.",
      "반응식을 뒤집지 않았으므로 임의로 부호를 바꾸지 않습니다."
    ],
    "optionAnalysis": [
      "엔탈피 변화끼리 곱하는 법칙은 없습니다.",
      "두 반응을 더하면 B가 소거되며 −30+(−50)=−80kJ입니다.",
      "80kJ는 방출된 열의 양의 크기일 수 있지만, 질문의 엔탈피 변화는 음수입니다.",
      "A→C로 가는 두 경로의 부호를 그대로 더해야 합니다.",
      "두 반응을 더하는 상황에서 엔탈피 값을 빼면 안 됩니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/chemistry-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "deltaHAB": -30,
        "deltaHBC": -50
      },
      "expectedValue": -80,
      "unit": "kJ"
    },
    "courseName": "화학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-biology1-mendel-cross",
    "courseId": "science-biology1",
    "topicId": "science-biology1-mendel-cross",
    "domain": "과학탐구",
    "subject": "생명과학Ⅰ",
    "topic": "분리 법칙과 유전 확률",
    "kind": "authored",
    "type": "authored",
    "statement": "한 유전자 자리에서 대립유전자 A와 a가 있다. Aa인 두 개체를 교배할 때 자손이 aa일 확률은? A와 a를 가진 생식세포는 같은 확률로 만들어지고 생존율 차이는 없다고 한다.",
    "options": [
      "1",
      "0",
      "1/2",
      "1/4",
      "3/4"
    ],
    "answerIndex": 3,
    "hint": "두 부모에서 a를 하나씩 받아야 합니다.",
    "solutionSteps": [
      "각 Aa 부모가 a를 가진 생식세포를 만들 확률은 1/2입니다.",
      "aa가 되려면 양쪽 부모에서 모두 a를 받아야 합니다.",
      "확률은 1/2×1/2=1/4입니다."
    ],
    "commonMistakes": [
      "Aa 유전자형과 우성 표현형을 혼동하지 마세요.",
      "표현형 비 3:1을 모든 유전자형 확률에 그대로 쓰지 않습니다."
    ],
    "optionAnalysis": [
      "두 부모가 반드시 a만 주는 것은 아닙니다.",
      "Aa 부모도 a 생식세포를 만들기 때문에 aa 자손이 가능합니다.",
      "1/2는 한 부모가 a를 줄 확률이거나 Aa 자손 확률입니다.",
      "각 부모가 a를 줄 확률 1/2를 곱하면 1/4입니다.",
      "완전 우성일 때 우성 표현형이 나타날 확률과 혼동한 값입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/biology-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "paternalARecessive": 0.5,
        "maternalARecessive": 0.5
      },
      "expectedValue": 0.25,
      "unit": "probability"
    },
    "courseName": "생명과학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-biology1-glucose-feedback",
    "courseId": "science-biology1",
    "topicId": "science-biology1-glucose-feedback",
    "domain": "과학탐구",
    "subject": "생명과학Ⅰ",
    "topic": "항상성과 음성 피드백",
    "kind": "authored",
    "type": "authored",
    "statement": "정상적인 혈당 조절에서 식사 후 혈당이 높아졌을 때 나타나는 반응으로 가장 적절한 것은?",
    "options": [
      "인슐린 분비가 감소하고 혈중 포도당 저장이 완전히 멈춘다.",
      "췌장은 혈당 변화와 관계없이 항상 같은 양의 호르몬만 분비한다.",
      "인슐린 분비가 증가하고 간의 글리코젠 합성이 촉진된다.",
      "혈당이 높을수록 그 변화를 더욱 증폭하는 조절만 일어난다.",
      "글루카곤이 증가해 간의 글리코젠 분해만 촉진된다."
    ],
    "answerIndex": 2,
    "hint": "높아진 혈당을 원래 범위로 되돌리는 반응을 고르세요.",
    "solutionSteps": [
      "식사 후 혈당 상승은 조절해야 할 변화입니다.",
      "음성 피드백은 혈당을 낮추는 방향으로 작용합니다.",
      "인슐린 분비 증가와 글리코젠 합성 촉진이 그 방향에 맞습니다."
    ],
    "commonMistakes": [
      "인슐린과 글루카곤의 작용 방향을 구분하세요.",
      "음성 피드백은 나쁜 효과가 아니라 변화를 줄이는 조절을 뜻합니다."
    ],
    "optionAnalysis": [
      "혈당이 높아졌을 때 정상적인 인슐린 분비 방향과 반대입니다.",
      "정상 조절에서는 혈당 변화에 따라 호르몬 분비가 달라집니다.",
      "높아진 혈당을 낮추는 방향의 조절로, 인슐린은 포도당 저장을 돕습니다.",
      "항상성의 음성 피드백은 변화를 증폭하는 양성 피드백과 다릅니다.",
      "글루카곤과 글리코젠 분해는 혈당을 올리는 쪽으로 작용합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/biology-2e/pages/index"
    ],
    "courseName": "생명과학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-biology1-energy-transfer",
    "courseId": "science-biology1",
    "topicId": "science-biology1-energy-transfer",
    "domain": "과학탐구",
    "subject": "생명과학Ⅰ",
    "topic": "생태계 에너지 전달",
    "kind": "authored",
    "type": "authored",
    "statement": "생태계의 생산자가 가진 에너지가 1000kJ이고, 생산자→1차 소비자→2차 소비자의 각 전달 효율이 모두 10%라고 한다. 2차 소비자에게 전달되는 에너지는?",
    "options": [
      "1kJ",
      "100kJ",
      "1000kJ",
      "10kJ",
      "200kJ"
    ],
    "answerIndex": 3,
    "hint": "영양 단계를 두 번 이동합니다.",
    "solutionSteps": [
      "생산자에서 1차 소비자로 1000×0.10=100kJ가 전달됩니다.",
      "1차 소비자에서 2차 소비자로 다시 10%가 전달됩니다.",
      "100×0.10=10kJ입니다."
    ],
    "commonMistakes": [
      "영양 단계의 이름에 있는 숫자와 곱셈 횟수를 구분하세요.",
      "문제에서 제시한 효율을 사용하며 실제 모든 생태계의 효율이 같다고 일반화하지 마세요."
    ],
    "optionAnalysis": [
      "10%를 세 번 곱한 값입니다. 문제에서는 두 단계를 이동합니다.",
      "생산자에서 1차 소비자로 전달된 에너지까지만 구한 값입니다.",
      "각 단계에서 에너지가 모두 다음 단계로 전달되는 것은 아닙니다.",
      "1000×0.10×0.10=10kJ입니다.",
      "전달 효율을 단순히 두 번 더하는 방식으로 계산하지 않습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/biology-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "producerEnergyKJ": 1000,
        "efficiencyEach": 0.1,
        "transfers": 2
      },
      "expectedValue": 10,
      "unit": "kJ"
    },
    "courseName": "생명과학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-biology2-transcription",
    "courseId": "science-biology2",
    "topicId": "science-biology2-transcription",
    "domain": "과학탐구",
    "subject": "생명과학Ⅱ",
    "topic": "전사와 염기 상보성",
    "kind": "authored",
    "type": "authored",
    "statement": "DNA 주형 가닥의 일부가 3′-TACGGA-5′이다. 이 부분에서 전사된 RNA의 염기 서열을 5′→3′ 방향으로 옳게 나타낸 것은?",
    "options": [
      "5′-UCCGUA-3′",
      "5′-AUGCCU-3′",
      "5′-UACGGA-3′",
      "5′-TACGGA-3′",
      "5′-ATGCCT-3′"
    ],
    "answerIndex": 1,
    "hint": "주형 가닥의 방향과 RNA에서 U를 쓰는 점을 함께 보세요.",
    "solutionSteps": [
      "주형 가닥은 왼쪽에서 오른쪽으로 3′→5′ 방향입니다.",
      "상보적인 RNA는 같은 지면 방향에서 5′→3′로 합성됩니다.",
      "T→A, A→U, C→G, G→C를 적용하면 5′-AUGCCU-3′입니다."
    ],
    "commonMistakes": [
      "주형 가닥과 암호화 가닥을 구분하세요.",
      "서열의 염기 종류뿐 아니라 5′·3′ 방향도 확인해야 합니다."
    ],
    "optionAnalysis": [
      "올바른 RNA 염기를 거꾸로 나열했으므로 제시한 5′→3′ 방향과 맞지 않습니다.",
      "주형의 T,A,C,G,G,A에 각각 A,U,G,C,C,U가 상보적으로 결합합니다.",
      "주형의 상보성을 적용하지 않고 T만 U로 바꾼 값입니다.",
      "주형 가닥을 그대로 옮겼고 RNA에 없는 T도 포함합니다.",
      "상보적인 DNA 서열입니다. RNA에서는 T 대신 U를 사용합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/biology-2e/pages/15-2-prokaryotic-transcription"
    ],
    "courseName": "생명과학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-biology2-respiration-oxygen",
    "courseId": "science-biology2",
    "topicId": "science-biology2-respiration-oxygen",
    "domain": "과학탐구",
    "subject": "생명과학Ⅱ",
    "topic": "세포 호흡과 최종 전자 수용체",
    "kind": "authored",
    "type": "authored",
    "statement": "진핵세포의 유산소 호흡에서 미토콘드리아 전자 전달계의 최종 전자 수용체는?",
    "options": [
      "포도당",
      "젖산",
      "산소(O₂)",
      "ATP",
      "이산화탄소(CO₂)"
    ],
    "answerIndex": 2,
    "hint": "유산소 호흡에서 산소가 소비되는 이유를 떠올리세요.",
    "solutionSteps": [
      "문제는 발효가 아니라 유산소 호흡의 전자 전달계를 묻습니다.",
      "전자는 여러 전달체를 거친 뒤 최종 수용체로 이동합니다.",
      "산소가 전자와 수소 이온을 받아 물이 되므로 정답은 산소입니다."
    ],
    "commonMistakes": [
      "산소와 이산화탄소의 역할을 바꾸어 생각하지 마세요.",
      "전자 전달계와 발효에서 전자를 받는 물질을 구분하세요."
    ],
    "optionAnalysis": [
      "포도당은 산화되어 에너지를 제공하는 물질이며 최종 전자 수용체가 아닙니다.",
      "젖산 발효의 산물과 미토콘드리아의 유산소 전자 전달계를 혼동한 보기입니다.",
      "산소가 최종적으로 전자와 수소 이온을 받아 물로 환원됩니다.",
      "ATP는 에너지 전달에 쓰이는 분자이며 최종 전자 수용체가 아닙니다.",
      "이산화탄소는 유기물 산화 과정의 생성물이며 해당 전자 전달계의 최종 전자 수용체가 아닙니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/biology-2e/pages/index"
    ],
    "courseName": "생명과학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-biology2-hardy-weinberg",
    "courseId": "science-biology2",
    "topicId": "science-biology2-hardy-weinberg",
    "domain": "과학탐구",
    "subject": "생명과학Ⅱ",
    "topic": "하디·바인베르크 평형",
    "kind": "authored",
    "type": "authored",
    "statement": "하디·바인베르크 평형을 이루는 매우 큰 집단에서 대립유전자 A의 빈도가 0.70, a의 빈도가 0.30이다. Aa 유전자형의 비율은?",
    "options": [
      "42%",
      "49%",
      "21%",
      "9%",
      "70%"
    ],
    "answerIndex": 0,
    "hint": "이형 접합자는 Aa와 aA의 두 조합을 포함합니다.",
    "solutionSteps": [
      "A의 빈도 p=0.70, a의 빈도 q=0.30입니다.",
      "평형 조건에서 Aa의 빈도는 2pq입니다.",
      "2×0.70×0.30=0.42, 즉 42%입니다."
    ],
    "commonMistakes": [
      "대립유전자 빈도와 개체의 유전자형 비율을 구분하세요.",
      "평형 조건이 제시되지 않은 모든 집단에 무조건 적용하지 마세요."
    ],
    "optionAnalysis": [
      "이형 접합자 빈도는 2pq=2×0.70×0.30=0.42입니다.",
      "p²로 계산한 AA의 비율입니다.",
      "pq만 계산한 값이며 이형 접합자의 두 조합을 반영하는 2가 빠졌습니다.",
      "q²로 계산한 aa의 비율입니다.",
      "대립유전자 A의 빈도와 Aa 유전자형의 비율은 다릅니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/biology-2e/pages/19-1-population-evolution"
    ],
    "verification": {
      "parameters": {
        "p": 0.7,
        "q": 0.3
      },
      "expectedValue": 0.42,
      "unit": "proportion"
    },
    "courseName": "생명과학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-earth1-divergent-boundary",
    "courseId": "science-earth1",
    "topicId": "science-earth1-divergent-boundary",
    "domain": "과학탐구",
    "subject": "지구과학Ⅰ",
    "topic": "판 경계와 해양 지각",
    "kind": "authored",
    "type": "authored",
    "statement": "대서양 중앙 해령처럼 두 해양판이 서로 멀어지는 경계에서 나타나는 대표적인 현상은?",
    "options": [
      "한 해양판이 다른 판 아래로 반드시 섭입한다.",
      "두 대륙판의 충돌로만 거대한 습곡 산맥이 만들어진다.",
      "판 운동이 완전히 멈추어 지질 변화가 전혀 없다.",
      "마그마가 상승해 새로운 해양 지각이 형성된다.",
      "판이 서로 스쳐 지나가기만 하며 새로운 지각 형성은 없다."
    ],
    "answerIndex": 3,
    "hint": "멀어진 틈을 새로운 지각이 채운다고 생각하세요.",
    "solutionSteps": [
      "두 판이 서로 멀어지므로 경계 유형은 발산형입니다.",
      "해령에서는 맨틀 물질의 상승과 부분 용융으로 마그마가 공급됩니다.",
      "그 마그마가 식어 새로운 해양 지각을 만들므로 첫 설명이 맞습니다."
    ],
    "commonMistakes": [
      "발산·수렴·보존 경계의 이동 방향을 구분하세요.",
      "해령에서 새로운 지각이 만들어지는 현상과 해구에서의 섭입을 혼동하지 마세요."
    ],
    "optionAnalysis": [
      "섭입은 주로 수렴형 경계의 현상입니다.",
      "대륙 충돌형 경계를 설명하는 내용이며 해양 발산 경계와 다릅니다.",
      "발산 경계는 판이 움직이고 지각이 형성되는 곳입니다.",
      "해령의 발산 경계에서 해양저 확장이 일어나며 새로운 지각이 만들어집니다.",
      "주향 이동형 경계를 설명한 보기입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://pubs.usgs.gov/gip/dynamic/understanding.html"
    ],
    "courseName": "지구과학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-earth1-half-life",
    "courseId": "science-earth1",
    "topicId": "science-earth1-half-life",
    "domain": "과학탐구",
    "subject": "지구과학Ⅰ",
    "topic": "반감기와 절대 연령",
    "kind": "authored",
    "type": "authored",
    "statement": "방사성 동위원소 X의 반감기는 3200년이다. 닫힌 계에서 X가 처음 양의 1/4로 줄었다면 경과한 시간은?",
    "options": [
      "6400년",
      "12800년",
      "800년",
      "1600년",
      "3200년"
    ],
    "answerIndex": 0,
    "hint": "1/4을 1/2의 거듭제곱으로 나타내세요.",
    "solutionSteps": [
      "모원소가 1/2이 되면 반감기 1회가 지납니다.",
      "1/4은 1/2을 두 번 곱한 비율이므로 반감기 2회입니다.",
      "경과 시간은 3200년×2=6400년입니다."
    ],
    "commonMistakes": [
      "남은 비율과 붕괴한 비율을 구분하세요.",
      "반감기마다 같은 양이 아니라 같은 비율로 감소합니다."
    ],
    "optionAnalysis": [
      "1/4=(1/2)²이므로 반감기 2회, 3200×2=6400년입니다.",
      "반감기 4회 뒤에는 1/16이 남습니다.",
      "처음 양의 비율 1/4을 반감기에 곱하면 경과 시간을 구할 수 없습니다.",
      "반감기의 절반을 계산한 값입니다. 1/4로 줄려면 반감기 2회가 필요합니다.",
      "반감기 1회 뒤에는 1/2이 남습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "halfLifeYears": 3200,
        "remainingFraction": 0.25
      },
      "expectedValue": 6400,
      "unit": "years"
    },
    "courseName": "지구과학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-earth1-stellar-radius",
    "courseId": "science-earth1",
    "topicId": "science-earth1-stellar-radius",
    "domain": "과학탐구",
    "subject": "지구과학Ⅰ",
    "topic": "별의 광도와 반지름",
    "kind": "authored",
    "type": "authored",
    "statement": "두 별 A와 B의 표면 온도가 같고, A의 광도는 B의 100배이다. 광도 L이 R²T⁴에 비례할 때 A의 반지름은 B의 몇 배인가?",
    "options": [
      "10000배",
      "1배",
      "2배",
      "10배",
      "100배"
    ],
    "answerIndex": 3,
    "hint": "온도 항이 같으므로 반지름의 제곱만 비교하세요.",
    "solutionSteps": [
      "L∝R²T⁴에서 두 별의 T가 같으므로 온도 항은 약분됩니다.",
      "L_A/L_B=(R_A/R_B)²=100입니다.",
      "양의 반지름 비는 √100=10입니다."
    ],
    "commonMistakes": [
      "겉보기 밝기와 별 자체의 광도를 구분하세요.",
      "반지름은 길이이므로 광도 비 100을 그대로 쓰지 않습니다."
    ],
    "optionAnalysis": [
      "반지름 비를 구할 때 광도 비를 제곱하지 않고 제곱근을 구합니다.",
      "온도가 같다고 해서 반지름이나 광도까지 같은 것은 아닙니다.",
      "반지름이 2배이면 같은 온도에서 광도는 4배가 됩니다.",
      "온도가 같으므로 광도 비 100은 반지름 비의 제곱입니다. 제곱근은 10입니다.",
      "광도 비를 반지름 비로 그대로 옮긴 값입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "luminosityRatio": 100,
        "temperatureRatio": 1
      },
      "expectedValue": 10,
      "unit": "radius ratio"
    },
    "courseName": "지구과학Ⅰ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-earth2-stellar-parallax",
    "courseId": "science-earth2",
    "topicId": "science-earth2-stellar-parallax",
    "domain": "과학탐구",
    "subject": "지구과학Ⅱ",
    "topic": "연주 시차와 별의 거리",
    "kind": "authored",
    "type": "authored",
    "statement": "어떤 별의 연주 시차가 0.050초각이다. 거리 d(pc)=1/p(초각) 관계를 사용할 때 이 별의 거리는?",
    "options": [
      "200pc",
      "2pc",
      "50pc",
      "20pc",
      "0.050pc"
    ],
    "answerIndex": 3,
    "hint": "주어진 시차는 연주 시차 자체이며 다시 2로 나누지 않습니다.",
    "solutionSteps": [
      "연주 시차 p=0.050초각을 확인합니다.",
      "거리 공식 d=1/p에 대입합니다.",
      "d=1/0.050=20pc입니다."
    ],
    "commonMistakes": [
      "연주 시차와 6개월 간격으로 본 전체 각변위를 구분하세요.",
      "pc와 광년은 같은 단위가 아닙니다."
    ],
    "optionAnalysis": [
      "0.050과 0.0050을 혼동한 값입니다.",
      "0.050의 역수는 2가 아니라 20입니다.",
      "시차를 0.020초각으로 잘못 읽었을 때의 값입니다.",
      "d=1/0.050=20pc입니다.",
      "시차의 수치를 거리로 그대로 옮길 수 없습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "parallaxArcsec": 0.05
      },
      "expectedValue": 20,
      "unit": "pc"
    },
    "courseName": "지구과학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-earth2-kepler-period",
    "courseId": "science-earth2",
    "topicId": "science-earth2-kepler-period",
    "domain": "과학탐구",
    "subject": "지구과학Ⅱ",
    "topic": "케플러 제3법칙",
    "kind": "authored",
    "type": "authored",
    "statement": "태양 주위를 도는 작은 행성의 공전 궤도 긴반지름이 4AU이다. P를 년, a를 AU로 나타낼 때 P²=a³이 성립한다면 이 행성의 공전 주기는?",
    "options": [
      "64년",
      "2년",
      "4년",
      "16년",
      "8년"
    ],
    "answerIndex": 4,
    "hint": "64는 주기가 아니라 주기의 제곱입니다.",
    "solutionSteps": [
      "공식 P²=a³에 a=4를 대입합니다.",
      "P²=4³=64입니다.",
      "공전 주기는 양수이므로 P=8년입니다."
    ],
    "commonMistakes": [
      "서로 다른 중심 천체를 도는 궤도에 같은 비례상수를 무조건 쓰지 마세요.",
      "타원 궤도에서는 임의의 순간 거리가 아니라 긴반지름을 사용합니다."
    ],
    "optionAnalysis": [
      "a³=64는 P²의 값입니다. 주기는 제곱근 8년입니다.",
      "긴반지름의 제곱근만 구한 값으로 케플러 제3법칙과 다릅니다.",
      "긴반지름의 수치를 주기로 그대로 옮긴 값입니다.",
      "a²을 계산한 값이며 P²=a³을 풀어야 합니다.",
      "P=√(4³)=√64=8년입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/6-6-satellites-and-keplers-laws-an-argument-for-simplicity"
    ],
    "verification": {
      "parameters": {
        "semimajorAxisAU": 4
      },
      "expectedValue": 8,
      "unit": "years"
    },
    "courseName": "지구과학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-science-earth2-mineral-hardness",
    "courseId": "science-earth2",
    "topicId": "science-earth2-mineral-hardness",
    "domain": "과학탐구",
    "subject": "지구과학Ⅱ",
    "topic": "광물의 굳기 비교",
    "kind": "authored",
    "type": "authored",
    "statement": "모스 굳기가 방해석 3, 정장석 6, 석영 7이라고 한다. 굳기가 5.5인 유리판에 대한 설명으로 옳은 것은? 더 굳은 물질이 덜 굳은 물질에 흠집을 낸다고 가정한다.",
    "options": [
      "정장석의 물리적 강도는 방해석의 정확히 2배이다.",
      "방해석만 유리판에 흠집을 낼 수 있다.",
      "정장석과 석영은 유리판에 흠집을 낼 수 있다.",
      "유리판은 석영에 흠집을 낼 수 있다.",
      "세 광물 모두 유리판에 흠집을 낼 수 없다."
    ],
    "answerIndex": 2,
    "hint": "각 광물의 수치를 유리의 5.5와 비교하세요.",
    "solutionSteps": [
      "주어진 가정에서는 굳기 숫자가 큰 물질이 작은 물질을 긁습니다.",
      "정장석 6과 석영 7은 유리 5.5보다 큽니다.",
      "따라서 두 광물 모두 유리판에 흠집을 낼 수 있습니다."
    ],
    "commonMistakes": [
      "모스 굳기는 비율 척도가 아닙니다.",
      "굳기와 깨지기 어려운 성질을 같은 뜻으로 보지 마세요."
    ],
    "optionAnalysis": [
      "모스 굳기 숫자는 상대적인 순서이지 강도의 비례 척도가 아닙니다.",
      "방해석 3은 유리 5.5보다 굳기가 작습니다.",
      "정장석 6과 석영 7은 모두 유리 5.5보다 굳기가 큽니다.",
      "유리 5.5는 석영 7보다 굳기가 작습니다.",
      "정장석과 석영의 굳기는 유리보다 큽니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://pubs.usgs.gov/gip/dynamic/understanding.html"
    ],
    "courseName": "지구과학Ⅱ",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-career-feedback-communication",
    "courseId": "vocation-career",
    "topicId": "vocation-career-feedback-communication",
    "domain": "직업탐구",
    "subject": "성공적인 직업생활",
    "topic": "의사소통과 확인 피드백",
    "kind": "authored",
    "type": "authored",
    "statement": "동료에게 받은 업무 지시의 마감 시각과 제출 형식이 불명확하다. 오해를 줄이기 위한 의사소통 방법으로 가장 적절한 것은?",
    "options": [
      "마감 시각과 제출 형식을 확인하지 않고 다른 동료의 예전 방식만 따른다.",
      "상대방의 말이 끝나기 전에 관계없는 이야기로 바꾼다.",
      "지시의 일부만 듣고 상대가 나머지도 알고 있을 것이라고 가정한다.",
      "이해한 내용을 요약해 말하고 마감 시각·제출 형식을 구체적으로 확인한다.",
      "질문하면 무능해 보이므로 개인적인 추측만으로 처리한다."
    ],
    "answerIndex": 3,
    "hint": "정확히 알고 있는 내용과 아직 불명확한 내용을 구분하세요.",
    "solutionSteps": [
      "문제의 원인은 마감 시각과 제출 형식에 대한 정보 부족입니다.",
      "추측이나 이전 관행만으로 처리하면 오해가 남습니다.",
      "핵심 내용을 요약하고 구체적인 조건을 질문해 확인하는 방식이 적절합니다."
    ],
    "commonMistakes": [
      "확인 질문을 소통 실패라고 보지 마세요.",
      "자신이 이해한 뜻과 상대가 전달한 뜻이 항상 같다고 가정하지 않습니다."
    ],
    "optionAnalysis": [
      "이전 사례가 이번 업무 조건과 같다는 근거가 없습니다.",
      "업무에 필요한 정보의 이해와 확인을 방해합니다.",
      "공유된 정보가 무엇인지 확인하는 의사소통이 필요합니다.",
      "불명확한 핵심 조건을 명료화하고 상대의 확인을 받는 피드백입니다.",
      "불명확한 조건을 확인하지 않으면 서로 다른 기준으로 일을 진행할 수 있습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "courseName": "성공적인 직업생활",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-career-resource-time",
    "courseId": "vocation-career",
    "topicId": "vocation-career-resource-time",
    "domain": "직업탐구",
    "subject": "성공적인 직업생활",
    "topic": "자원 관리와 시간 계획",
    "kind": "authored",
    "type": "authored",
    "statement": "한 주에 사용할 수 있는 업무 시간이 14시간이다. 서로 겹쳐 수행할 수 없는 작업 A, B, C에 각각 5시간, 4시간, 3시간이 필요하다. 세 작업을 모두 마쳤을 때 남는 시간은?",
    "options": [
      "2시간",
      "3시간",
      "1시간",
      "12시간",
      "9시간"
    ],
    "answerIndex": 0,
    "hint": "남는 시간=전체 시간−총 소요 시간입니다.",
    "solutionSteps": [
      "세 작업은 동시에 수행할 수 없으므로 소요 시간을 더합니다.",
      "5+4+3=12시간이 필요합니다.",
      "사용 가능 시간 14시간에서 빼면 2시간이 남습니다."
    ],
    "commonMistakes": [
      "동시 수행 여부가 제시된 조건을 확인하세요.",
      "전체 소요 시간과 남는 시간을 구분하세요."
    ],
    "optionAnalysis": [
      "총 소요 시간은 5+4+3=12시간이므로 14−12=2시간입니다.",
      "작업 C의 소요 시간과 남는 시간을 혼동했습니다.",
      "세 작업의 소요 시간을 모두 합해 다시 확인해야 합니다.",
      "12시간은 남는 시간이 아니라 전체 작업 소요 시간입니다.",
      "A만 수행한 뒤의 남는 시간이며 B와 C가 빠졌습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "verification": {
      "parameters": {
        "availableHours": 14,
        "taskHours": [
          5,
          4,
          3
        ]
      },
      "expectedValue": 2,
      "unit": "hours"
    },
    "courseName": "성공적인 직업생활",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-career-goal-setting",
    "courseId": "vocation-career",
    "topicId": "vocation-career-goal-setting",
    "domain": "직업탐구",
    "subject": "성공적인 직업생활",
    "topic": "실행 가능한 직업 학습 목표",
    "kind": "authored",
    "type": "authored",
    "statement": "직업 역량을 기르기 위한 목표 중 행동, 측정 기준, 기한을 가장 명확하게 제시한 것은?",
    "options": [
      "언젠가 보고서를 잘 쓰는 사람이 된다.",
      "다른 사람보다 무조건 뛰어나진다.",
      "시간이 남을 때만 조금씩 노력한다.",
      "다음 4주 동안 매주 보고서 작성 연습 2회를 하고, 정해 둔 점검표로 매회 결과를 확인한다.",
      "가능하면 모든 일을 완벽하게 한다."
    ],
    "answerIndex": 3,
    "hint": "무엇을·얼마나·언제까지 할지가 모두 있는지 보세요.",
    "solutionSteps": [
      "좋은 실행 목표에는 수행 행동과 확인 가능한 기준이 필요합니다.",
      "계획을 언제 점검할지 알 수 있도록 기한도 있어야 합니다.",
      "4주 동안 매주 2회 연습하고 점검한다는 목표가 세 조건을 충족합니다."
    ],
    "commonMistakes": [
      "열심히 한다는 표현만으로 측정 기준이 생기지는 않습니다.",
      "학습 목표를 타인과의 막연한 비교만으로 정하지 마세요."
    ],
    "optionAnalysis": [
      "행동량과 기한이 구체적이지 않습니다.",
      "비교 대상과 평가 기준·기한이 불분명하며 자신의 구체 행동도 없습니다.",
      "실행 시점과 측정 기준이 정해져 있지 않습니다.",
      "행동인 작성 연습, 매주 2회라는 기준, 4주라는 기한이 모두 제시되어 있습니다.",
      "완벽의 기준과 구체적인 실행 행동이 불명확합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "courseName": "성공적인 직업생활",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-agriculture-photosynthesis-carbon",
    "courseId": "vocation-agriculture",
    "topicId": "vocation-agriculture-photosynthesis-carbon",
    "domain": "직업탐구",
    "subject": "농업 기초 기술",
    "topic": "작물의 광합성과 탄소 공급",
    "kind": "authored",
    "type": "authored",
    "statement": "녹색 작물이 광합성으로 만든 탄수화물에 들어 있는 탄소의 주된 직접 공급원은?",
    "options": [
      "공기 중의 이산화탄소",
      "빛 자체",
      "물 분자의 수소",
      "뿌리 주변의 산소",
      "비료 속 모든 무기 성분"
    ],
    "answerIndex": 0,
    "hint": "에너지 공급원과 원자 공급원을 나누어 생각하세요.",
    "solutionSteps": [
      "탄수화물에 포함된 탄소 원자의 출처를 묻고 있습니다.",
      "광합성은 이산화탄소를 유기물로 고정하는 과정입니다.",
      "따라서 주된 직접 공급원은 공기 중 이산화탄소입니다."
    ],
    "commonMistakes": [
      "햇빛이 곧 유기물의 탄소 재료라고 생각하지 마세요.",
      "무기 양분의 역할과 탄소 고정의 역할을 구분하세요."
    ],
    "optionAnalysis": [
      "광합성의 탄소 고정 과정에서 이산화탄소의 탄소가 유기물에 들어갑니다.",
      "빛은 에너지 공급원이며 탄소 원자로 바뀌어 들어가는 물질 공급원은 아닙니다.",
      "수소는 탄소 원자가 아니므로 탄소의 직접 공급원이 될 수 없습니다.",
      "산소 분자는 탄소를 포함하지 않습니다.",
      "식물에 무기 양분이 필요하지만 탄수화물 탄소의 주된 직접 공급원은 이산화탄소입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis"
    ],
    "courseName": "농업 기초 기술",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-agriculture-soil-ph",
    "courseId": "vocation-agriculture",
    "topicId": "vocation-agriculture-soil-ph",
    "domain": "직업탐구",
    "subject": "농업 기초 기술",
    "topic": "토양 산도와 토양 검정",
    "kind": "authored",
    "type": "authored",
    "statement": "토양 검정 결과에서 pH 값으로 직접 파악하려는 특성은?",
    "options": [
      "수확물의 총판매액",
      "토양 용액의 산성·염기성 정도",
      "밭 전체에 존재하는 잡초의 정확한 개체 수",
      "토양의 모든 입자의 크기",
      "모든 필수 양분의 정확한 함량"
    ],
    "answerIndex": 1,
    "hint": "pH와 양분 함량·토성은 서로 다른 항목입니다.",
    "solutionSteps": [
      "토양 검정에는 산도와 양분 등 서로 다른 측정 항목이 있습니다.",
      "pH는 수소 이온의 활동도와 관련된 산성·염기성 지표입니다.",
      "따라서 토양 용액의 산성·염기성 정도가 직접적인 답입니다."
    ],
    "commonMistakes": [
      "pH 하나로 모든 토양 양분 상태를 단정하지 마세요.",
      "토양 검정 결과 없이 구체적인 개량제 투입량을 결정하는 문제로 확대하지 마세요."
    ],
    "optionAnalysis": [
      "판매액은 수확량과 가격 등 경제 자료로 계산합니다.",
      "pH는 산성·염기성 정도와 관련된 지표입니다.",
      "잡초 개체 수는 조사로 파악하며 pH만으로 직접 알 수 없습니다.",
      "입도는 토성 분석에 관련되며 pH와 다른 특성입니다.",
      "양분별 분석 항목이 필요하며 pH가 모든 양분 함량을 나타내지는 않습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=1731"
    ],
    "courseName": "농업 기초 기술",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-agriculture-controlled-germination",
    "courseId": "vocation-agriculture",
    "topicId": "vocation-agriculture-controlled-germination",
    "domain": "직업탐구",
    "subject": "농업 기초 기술",
    "topic": "종자 발아 실험의 변인 통제",
    "kind": "authored",
    "type": "authored",
    "statement": "같은 종류의 콩 종자에서 온도가 발아율에 미치는 영향을 비교하려 한다. 실험 설계로 가장 적절한 것은?",
    "options": [
      "온도와 종자 종류, 물의 양을 모두 다르게 한다.",
      "온도는 기록하지 않고 발아한 종자만 골라 발아율을 계산한다.",
      "두 집단의 온도를 같게 하고 물의 양만 다르게 한다.",
      "같은 수의 종자에 수분·산소·관찰 기간을 같게 제공하고 온도만 15℃와 25℃로 다르게 한다.",
      "한 집단만 종자를 넣고 다른 집단에는 종자를 넣지 않는다."
    ],
    "answerIndex": 3,
    "hint": "결과에 영향을 줄 수 있는 다른 조건을 같게 두세요.",
    "solutionSteps": [
      "알아보려는 독립 변인은 온도입니다.",
      "종자 종류와 수, 수분·산소, 관찰 기간 같은 조건은 같게 해야 합니다.",
      "온도만 달리한 두 집단의 전체 종자 중 발아 비율을 비교합니다."
    ],
    "commonMistakes": [
      "대조 실험에서 반드시 아무것도 제공하지 않아야 하는 것은 아닙니다.",
      "발아율의 분모는 처음 조사한 전체 종자 수입니다."
    ],
    "optionAnalysis": [
      "여러 요인이 함께 달라져 온도의 영향만 구분하기 어렵습니다.",
      "독립 변인을 확인할 수 없고 전체 종자 수를 제외해 발아율도 편향됩니다.",
      "온도가 아니라 수분의 영향을 비교하는 설계입니다.",
      "조작 변인은 온도 하나이며 나머지 주요 조건이 통제되어 있습니다.",
      "발아율을 비교할 두 종자 집단이 갖추어지지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=1731",
      "https://openstax.org/books/biology-2e/pages/index"
    ],
    "courseName": "농업 기초 기술",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-industry-ohm-law",
    "courseId": "vocation-industry",
    "topicId": "vocation-industry-ohm-law",
    "domain": "직업탐구",
    "subject": "공업 일반",
    "topic": "직류 회로와 옴의 법칙",
    "kind": "authored",
    "type": "authored",
    "statement": "옴의 법칙을 따르는 6Ω 저항에 24V의 전압을 걸었다. 저항에 흐르는 전류는?",
    "options": [
      "4A",
      "6A",
      "0.25A",
      "24A",
      "144A"
    ],
    "answerIndex": 0,
    "hint": "전압을 저항으로 나누세요.",
    "solutionSteps": [
      "옴의 법칙 V=IR을 전류 I에 대해 정리합니다.",
      "I=V/R에 24V와 6Ω을 대입합니다.",
      "24/6=4이므로 전류는 4A입니다."
    ],
    "commonMistakes": [
      "실제 모든 소자가 언제나 옴의 법칙을 따르는 것은 아닙니다.",
      "단순 계산 문제를 실제 전기 설비 작업 지침으로 해석하지 마세요."
    ],
    "optionAnalysis": [
      "I=V/R=24/6=4A입니다.",
      "저항의 수치 6Ω을 전류로 그대로 옮긴 값입니다.",
      "R/V를 계산한 역수 값입니다.",
      "전압 수치만 사용하고 저항을 반영하지 않았습니다.",
      "전압과 저항을 곱하면 전류가 되지 않습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits"
    ],
    "verification": {
      "parameters": {
        "voltageV": 24,
        "resistanceOhm": 6
      },
      "expectedValue": 4,
      "unit": "A"
    },
    "courseName": "공업 일반",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-industry-energy-efficiency",
    "courseId": "vocation-industry",
    "topicId": "vocation-industry-energy-efficiency",
    "domain": "직업탐구",
    "subject": "공업 일반",
    "topic": "기계의 에너지 효율",
    "kind": "authored",
    "type": "authored",
    "statement": "어떤 장치에 200J의 에너지를 공급했더니 유용한 기계적 일로 150J가 나왔다. 이 장치의 에너지 효율은?",
    "options": [
      "약 133%",
      "75%",
      "25%",
      "50%",
      "100%"
    ],
    "answerIndex": 1,
    "hint": "출력÷입력의 비율을 구하세요.",
    "solutionSteps": [
      "효율의 분자는 유용한 출력 에너지 150J입니다.",
      "분모는 투입 에너지 200J입니다.",
      "150/200×100=75%입니다."
    ],
    "commonMistakes": [
      "유용한 에너지의 비율과 손실 비율을 구분하세요.",
      "입력과 출력을 뒤집으면 100%를 넘는 잘못된 답이 나옵니다."
    ],
    "optionAnalysis": [
      "입력을 출력으로 나눈 역수로 계산했습니다.",
      "효율=150/200×100=75%입니다.",
      "손실 에너지 50J의 비율이지 유용한 출력의 효율이 아닙니다.",
      "출력과 입력의 차이만으로 효율을 정할 수 없습니다.",
      "모든 투입 에너지가 유용한 일로 바뀐 것은 아닙니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "inputJ": 200,
        "usefulJ": 150
      },
      "expectedValue": 75,
      "unit": "%"
    },
    "courseName": "공업 일반",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-industry-drawing-scale",
    "courseId": "vocation-industry",
    "topicId": "vocation-industry-drawing-scale",
    "domain": "직업탐구",
    "subject": "공업 일반",
    "topic": "도면의 축척",
    "kind": "authored",
    "type": "authored",
    "statement": "축척 1:5인 도면에서 어떤 부품의 길이가 24mm로 표시되어 있다. 실제 부품의 길이는?",
    "options": [
      "600mm",
      "29mm",
      "120mm",
      "24mm",
      "4.8mm"
    ],
    "answerIndex": 2,
    "hint": "도면이 실제보다 작게 그려진 경우입니다.",
    "solutionSteps": [
      "축척 1:5는 도면 길이:실제 길이=1:5입니다.",
      "실제 길이는 도면 길이의 5배입니다.",
      "24mm×5=120mm입니다."
    ],
    "commonMistakes": [
      "축척을 길이 차이로 해석하지 마세요.",
      "길이 문제에 면적 배율인 5²을 적용하지 마세요."
    ],
    "optionAnalysis": [
      "길이를 구하는데 배율 5를 제곱해 적용한 값입니다.",
      "축척은 길이에 5mm를 더한다는 뜻이 아닙니다.",
      "도면 길이 24mm에 실제 길이 배율 5를 곱하면 120mm입니다.",
      "축척 1:1인 경우와 혼동한 값입니다.",
      "축소 도면의 길이를 다시 5로 나눈 값입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "verification": {
      "parameters": {
        "drawingLengthMm": 24,
        "actualScaleFactor": 5
      },
      "expectedValue": 120,
      "unit": "mm"
    },
    "courseName": "공업 일반",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-commerce-gross-profit",
    "courseId": "vocation-commerce",
    "topicId": "vocation-commerce-gross-profit",
    "domain": "직업탐구",
    "subject": "상업 경제",
    "topic": "매출총이익 계산",
    "kind": "authored",
    "type": "authored",
    "statement": "상품 매출액이 500만원이고 해당 상품의 매출원가가 320만원이다. 매출총이익은? 매출 환입·할인 등은 없다고 한다.",
    "options": [
      "500만원",
      "180만원",
      "320만원",
      "820만원",
      "120만원"
    ],
    "answerIndex": 1,
    "hint": "다른 비용을 알 필요 없이 이 항목은 매출액과 매출원가로 계산합니다.",
    "solutionSteps": [
      "구하는 항목은 순이익이 아니라 매출총이익입니다.",
      "매출총이익 공식은 매출액−매출원가입니다.",
      "500−320=180만원입니다."
    ],
    "commonMistakes": [
      "매출액과 이익은 다릅니다.",
      "매출총이익을 기업의 최종 순이익으로 단정하지 마세요."
    ],
    "optionAnalysis": [
      "매출액 전체를 이익으로 볼 수 없습니다.",
      "매출총이익=500−320=180만원입니다.",
      "320만원은 매출원가이며 매출총이익이 아닙니다.",
      "매출액과 매출원가는 더하는 것이 아니라 빼야 합니다.",
      "매출액에서 매출원가를 정확히 빼면 180만원입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "verification": {
      "parameters": {
        "salesTenThousandWon": 500,
        "costTenThousandWon": 320
      },
      "expectedValue": 180,
      "unit": "만원"
    },
    "courseName": "상업 경제",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-commerce-retail-channel",
    "courseId": "vocation-commerce",
    "topicId": "vocation-commerce-retail-channel",
    "domain": "직업탐구",
    "subject": "상업 경제",
    "topic": "유통 경로와 소매업",
    "kind": "authored",
    "type": "authored",
    "statement": "생산자→도매상→소매상→최종 소비자의 유통 경로에서, 주로 최종 소비자에게 상품을 직접 판매하는 단계는?",
    "options": [
      "최종 소비자",
      "도매상",
      "운송 수단 자체",
      "소매상",
      "생산자만"
    ],
    "answerIndex": 3,
    "hint": "구매 목적이 재판매인지 최종 사용인지 구분하세요.",
    "solutionSteps": [
      "문제에 주어진 유통 경로의 마지막 판매 단계를 찾습니다.",
      "소매상 다음에 최종 소비자가 연결되어 있습니다.",
      "따라서 최종 소비자에게 판매하는 주체는 소매상입니다."
    ],
    "commonMistakes": [
      "거래량이 크고 작다는 점만으로 도매와 소매를 정의하지 마세요.",
      "생산자가 직접 소비자에게 파는 다른 경로와 주어진 경로를 구분하세요."
    ],
    "optionAnalysis": [
      "최종 소비자는 이 경로의 구매·사용 주체이지 판매 단계가 아닙니다.",
      "도매상은 이 경로에서 소매상에 상품을 공급하는 단계입니다.",
      "운송 수단은 상품 이동에 쓰이며 이 질문의 판매 주체가 아닙니다.",
      "소매상은 이 경로에서 최종 소비자에게 상품을 판매하는 단계입니다.",
      "주어진 경로에서는 생산자 다음에 도매상과 소매상이 있습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "courseName": "상업 경제",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-commerce-reorder-point",
    "courseId": "vocation-commerce",
    "topicId": "vocation-commerce-reorder-point",
    "domain": "직업탐구",
    "subject": "상업 경제",
    "topic": "재고와 재주문점",
    "kind": "authored",
    "type": "authored",
    "statement": "하루 수요가 일정하게 4개이고 주문 후 입고까지 3일이 걸린다. 안전 재고를 10개 유지하는 단순 모형에서 재주문점은? 재주문점=하루 수요×조달 기간+안전 재고로 계산한다.",
    "options": [
      "40개",
      "14개",
      "12개",
      "17개",
      "22개"
    ],
    "answerIndex": 4,
    "hint": "입고를 기다리는 동안 소요될 물량을 먼저 구하세요.",
    "solutionSteps": [
      "3일 동안 필요한 예상 수요는 4개/일×3일=12개입니다.",
      "입고 시점까지 남겨 둘 안전 재고 10개를 더합니다.",
      "재주문점은 12+10=22개입니다."
    ],
    "commonMistakes": [
      "재주문점과 한 번에 주문할 수량은 다른 개념입니다.",
      "문제에서 일정하다고 가정한 수요를 모든 실제 상황에 그대로 적용하지 마세요."
    ],
    "optionAnalysis": [
      "하루 수요와 안전 재고를 곱하는 식은 주어진 공식과 다릅니다.",
      "하루 수요와 안전 재고만 더해 조달 기간 3일을 반영하지 않았습니다.",
      "조달 기간의 수요 12개까지만 계산해 안전 재고가 빠졌습니다.",
      "일 수와 개 수를 단순히 모두 더하면 단위가 맞지 않습니다.",
      "4×3+10=22개입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "verification": {
      "parameters": {
        "dailyDemand": 4,
        "leadDays": 3,
        "safetyStock": 10
      },
      "expectedValue": 22,
      "unit": "개"
    },
    "courseName": "상업 경제",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-marine-buoyancy",
    "courseId": "vocation-marine",
    "topicId": "vocation-marine-buoyancy",
    "domain": "직업탐구",
    "subject": "수산·해운 산업 기초",
    "topic": "선박과 부력",
    "kind": "authored",
    "type": "authored",
    "statement": "밀도 1025kg/m³인 해수에서 물체가 밀어낸 해수의 부피가 0.020m³이다. 중력 가속도를 10m/s²로 둘 때 물체가 받는 부력의 크기는?",
    "options": [
      "20.5N",
      "200N",
      "102.5N",
      "2050N",
      "205N"
    ],
    "answerIndex": 4,
    "hint": "밀도×잠긴 부피는 질량이며 여기에 g를 곱합니다.",
    "solutionSteps": [
      "밀려난 해수의 질량은 1025×0.020=20.5kg입니다.",
      "부력은 이 해수의 무게와 같습니다.",
      "20.5×10=205N입니다."
    ],
    "commonMistakes": [
      "질량 kg과 힘 N을 구분하세요.",
      "수면 밖 부피를 포함한 전체 부피를 임의로 쓰지 마세요."
    ],
    "optionAnalysis": [
      "밀려난 해수의 질량 20.5kg까지만 계산하고 중력 가속도를 곱하지 않았습니다.",
      "해수 밀도를 1025 대신 1000kg/m³로 바꾼 계산입니다.",
      "주어진 부피와 중력 가속도로 계산한 값과 다릅니다.",
      "0.020을 0.20으로 잘못 읽었을 때 나오는 값입니다.",
      "F=ρgV=1025×10×0.020=205N입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/college-physics-2e/pages/index"
    ],
    "verification": {
      "parameters": {
        "densityKgM3": 1025,
        "gMps2": 10,
        "displacedVolumeM3": 0.02
      },
      "expectedValue": 205,
      "unit": "N"
    },
    "courseName": "수산·해운 산업 기초",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-marine-latitude-longitude",
    "courseId": "vocation-marine",
    "topicId": "vocation-marine-latitude-longitude",
    "domain": "직업탐구",
    "subject": "수산·해운 산업 기초",
    "topic": "위도와 경도",
    "kind": "authored",
    "type": "authored",
    "statement": "가상의 관측점이 위도 35°S, 경도 127°E에 있다. 이 점에 대한 설명으로 옳은 것은?",
    "options": [
      "적도와 본초 자오선의 교점에 있다.",
      "적도 남쪽, 본초 자오선 서쪽에 있다.",
      "적도 북쪽, 본초 자오선 서쪽에 있다.",
      "적도 남쪽, 본초 자오선 동쪽에 있다.",
      "적도 북쪽, 본초 자오선 동쪽에 있다."
    ],
    "answerIndex": 3,
    "hint": "S와 E 두 방향 기호를 각각 해석하세요.",
    "solutionSteps": [
      "위도 표기 35°S에서 S는 남쪽을 뜻합니다.",
      "경도 표기 127°E에서 E는 동쪽을 뜻합니다.",
      "따라서 적도 남쪽이면서 본초 자오선 동쪽입니다."
    ],
    "commonMistakes": [
      "위도와 경도의 기준선을 바꾸어 생각하지 마세요.",
      "익숙한 실제 지명에 맞춰 방향 기호를 임의로 바꾸지 않습니다."
    ],
    "optionAnalysis": [
      "두 기준선의 교점은 위도 0°, 경도 0°입니다.",
      "127°E의 E는 서쪽이 아니라 동쪽입니다.",
      "S와 E의 의미를 모두 반대로 읽었습니다.",
      "S는 남위, E는 동경을 뜻하므로 남쪽·동쪽입니다.",
      "35°S의 S를 N과 혼동한 설명입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk"
    ],
    "courseName": "수산·해운 산업 기초",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-marine-salinity-mass",
    "courseId": "vocation-marine",
    "topicId": "vocation-marine-salinity-mass",
    "domain": "직업탐구",
    "subject": "수산·해운 산업 기초",
    "topic": "해수 염분과 질량 비",
    "kind": "authored",
    "type": "authored",
    "statement": "질량 염분이 35g/kg인 균일한 해수 2.0kg에 들어 있는 용존 염류의 질량은? 질량 염분은 해수 1kg당 용존 염류의 질량으로 정의한다.",
    "options": [
      "17.5g",
      "350g",
      "35g",
      "70000g",
      "70g"
    ],
    "answerIndex": 4,
    "hint": "g/kg에 kg을 곱하면 g이 남습니다.",
    "solutionSteps": [
      "질량 염분 35g/kg는 해수 1kg에 염류 35g이 있다는 뜻입니다.",
      "해수가 2.0kg이므로 35g/kg에 2.0kg을 곱합니다.",
      "kg이 약분되어 용존 염류 질량은 70g입니다."
    ],
    "commonMistakes": [
      "해수의 전체 질량과 물만의 질량을 구분하세요.",
      "주어진 질량 염분의 정의를 다른 염분 척도와 혼동하지 마세요."
    ],
    "optionAnalysis": [
      "해수 질량을 곱하지 않고 나눈 값입니다.",
      "단위 질량당 35g을 10배 크게 계산했습니다.",
      "해수 1kg에 포함된 양이며 2.0kg을 반영하지 않았습니다.",
      "해수 질량 kg을 g으로 바꾸면서 분모 단위를 함께 바꾸지 않아 1000배 오류가 났습니다.",
      "35g/kg×2.0kg=70g입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/chemistry-2e/pages/3-3-molarity"
    ],
    "verification": {
      "parameters": {
        "massSalinityGKg": 35,
        "seawaterMassKg": 2
      },
      "expectedValue": 70,
      "unit": "g"
    },
    "courseName": "수산·해운 산업 기초",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-development-cephalocaudal",
    "courseId": "vocation-development",
    "topicId": "vocation-development-cephalocaudal",
    "domain": "직업탐구",
    "subject": "인간 발달",
    "topic": "신체 발달의 일반적 방향",
    "kind": "authored",
    "type": "authored",
    "statement": "영아가 일반적으로 머리를 가누는 조절 능력을 익힌 뒤 몸통과 다리의 조절을 발달시킨다는 설명에 가장 가까운 발달 원리는?",
    "options": [
      "발달에는 개인차가 전혀 없다는 원리",
      "모든 신체 부위가 항상 같은 날 같은 속도로 발달한다는 원리",
      "출생 후에는 운동 조절 능력이 전혀 변하지 않는다는 원리",
      "발에서 머리 쪽으로만 진행하는 발달 원리",
      "머리에서 발 쪽으로 진행하는 두미 발달 경향"
    ],
    "answerIndex": 4,
    "hint": "머리와 발 중 어느 쪽에서 시작하는지 보세요.",
    "solutionSteps": [
      "사례는 머리 조절에서 몸통·다리 조절로 진행하는 방향을 보여 줍니다.",
      "머리에서 발 쪽이라는 일반적 경향을 두미 발달이라고 합니다.",
      "일반적 경향이므로 모든 아동이 같은 속도로 진행한다는 뜻은 아닙니다."
    ],
    "commonMistakes": [
      "발달 순서의 경향과 개인별 발달 속도를 구분하세요.",
      "일반적 원리를 개별 아동의 진단 기준으로 사용하지 마세요."
    ],
    "optionAnalysis": [
      "일반적인 경향이 있어도 개인별 속도 차이는 존재합니다.",
      "부위별 순서와 발달 속도의 차이를 설명하지 못합니다.",
      "영아기의 운동 조절 능력은 발달합니다.",
      "제시된 순서와 반대 방향입니다.",
      "머리에서 아래쪽 신체 부위로 이어지는 일반적인 발달 방향을 설명합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://assets.openstax.org/oscms-prodcms/media/documents/Lifespan_Development_-_WEB.pdf",
      "https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development"
    ],
    "courseName": "인간 발달",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-development-fine-motor",
    "courseId": "vocation-development",
    "topicId": "vocation-development-fine-motor",
    "domain": "직업탐구",
    "subject": "인간 발달",
    "topic": "대근육·소근육 운동",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 중 소근육 운동 능력을 중심으로 사용하는 활동은?",
    "options": [
      "넓은 운동장을 달린다.",
      "한 발로 서서 균형을 잡는다.",
      "제자리에서 높이 뛴다.",
      "엄지와 집게손가락으로 작은 구슬을 집는다.",
      "계단을 두 발로 오르내린다."
    ],
    "answerIndex": 3,
    "hint": "손가락의 정교한 조절이 핵심인 활동을 고르세요.",
    "solutionSteps": [
      "질문은 작은 근육을 이용한 정교한 조작 활동을 묻습니다.",
      "구슬을 집는 활동은 엄지와 집게손가락의 미세한 협응이 중요합니다.",
      "달리기·뛰기·균형 잡기·계단 이동과 구분되는 소근육 활동입니다."
    ],
    "commonMistakes": [
      "활동의 어려움만으로 대근육·소근육을 나누지 마세요.",
      "대근육 운동 중에도 소근육이 전혀 쓰이지 않는다는 뜻은 아닙니다."
    ],
    "optionAnalysis": [
      "다리와 몸통 등 큰 근육을 중심으로 사용하는 대근육 운동입니다.",
      "전체 신체의 자세와 큰 근육의 균형 조절이 중심입니다.",
      "주로 다리와 몸통의 큰 움직임을 사용하는 대근육 운동입니다.",
      "손가락을 정교하게 조절하는 조작이므로 소근육 운동에 가깝습니다.",
      "다리와 몸통의 큰 움직임을 사용하는 대근육 운동이 중심입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development"
    ],
    "courseName": "인간 발달",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-vocation-development-cognitive-accommodation",
    "courseId": "vocation-development",
    "topicId": "vocation-development-cognitive-accommodation",
    "domain": "직업탐구",
    "subject": "인간 발달",
    "topic": "동화와 조절",
    "kind": "authored",
    "type": "authored",
    "statement": "아동이 처음에는 네 발 달린 동물을 모두 개라고 불렀다. 이후 고양이를 보고 차이를 배운 뒤 개와 고양이를 구분하는 새로운 도식을 만들었다. 도식을 수정한 과정에 가장 가까운 것은?",
    "options": [
      "새 경험의 정보를 모두 무시하는 과정",
      "조절",
      "조건 없는 생리적 반사",
      "관찰 대상 자체의 물리적 성장",
      "기존 도식을 전혀 바꾸지 않은 동화만"
    ],
    "answerIndex": 1,
    "hint": "기존 틀에 끼워 맞췄는지, 틀 자체를 바꿨는지 보세요.",
    "solutionSteps": [
      "처음의 도식은 네 발 달린 동물=개였습니다.",
      "새 경험을 통해 기존 구분이 불충분함을 알게 되었습니다.",
      "개와 고양이를 구분하도록 도식을 바꾼 것은 조절입니다."
    ],
    "commonMistakes": [
      "동화와 조절은 서로 관련되지만 같은 뜻은 아닙니다.",
      "인지 도식의 변화와 신체 성장의 변화를 구분하세요."
    ],
    "optionAnalysis": [
      "아동은 새 경험을 반영해 구분 기준을 바꾸었습니다.",
      "새로운 경험에 맞춰 기존 도식을 수정했으므로 조절입니다.",
      "경험을 바탕으로 분류 방식을 수정하는 인지 과정입니다.",
      "변한 것은 동물의 신체가 아니라 아동의 인지 도식입니다.",
      "사례의 마지막 단계에서는 기존 도식이 실제로 수정되었습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 개념 연습",
    "generationBasis": "교과 개념 연습",
    "verified": false,
    "sourceRefs": [
      "https://openstax.org/books/psychology-2e/pages/9-2-lifespan-theories"
    ],
    "courseName": "인간 발달",
    "contentNote": "실제 기출과 구분되는 자체 구성 기본 개념 연습입니다. 참고 출처는 과목 범위 또는 개념 확인용입니다."
  },
  {
    "id": "authored-language-german-verb",
    "courseId": "language-german",
    "topicId": "language-german-verb",
    "domain": "제2외국어/한문",
    "subject": "독일어Ⅰ",
    "topic": "인칭에 따른 동사 변화",
    "kind": "authored",
    "type": "authored",
    "statement": "빈칸에 들어갈 동사의 현재형으로 알맞은 것을 고르세요.",
    "passage": "Ich ___ Deutsch.",
    "options": [
      "lerne",
      "lernst",
      "lernt",
      "lernen",
      "lerntest"
    ],
    "answerIndex": 0,
    "hint": "Ich에 맞는 현재형 어미를 떠올려 보세요.",
    "solutionSteps": [
      "주어 Ich가 나를 뜻하는 1인칭 단수임을 확인합니다.",
      "lernen의 규칙 현재형에서 ich에 맞는 어미는 -e입니다.",
      "따라서 Ich lerne Deutsch가 되어 나는 독일어를 배운다는 뜻입니다."
    ],
    "commonMistakes": [
      "Ich와 du의 동사 어미를 혼동하지 마세요.",
      "사전에 나오는 부정형 lernen을 그대로 빈칸에 넣지 마세요."
    ],
    "optionAnalysis": [
      "ich는 1인칭 단수이므로 lernen의 현재형 lerne가 알맞습니다.",
      "lernst는 2인칭 단수 du에 맞는 형태입니다.",
      "lernt는 주로 er/sie/es 또는 ihr에 맞는 형태입니다.",
      "lernen은 부정형이거나 wir/sie/Sie에 맞는 형태여서 ich와 맞지 않습니다.",
      "lerntest는 du에 맞는 과거형으로 주어와 시제가 모두 다릅니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 나는 독일어를 배운다.",
    "vocabulary": [
      [
        "ich",
        "나"
      ],
      [
        "lernen",
        "배우다"
      ],
      [
        "Deutsch",
        "독일어"
      ]
    ],
    "languageCode": "de",
    "sourceRefs": [
      "https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "독일어Ⅰ"
  },
  {
    "id": "authored-language-german-request",
    "courseId": "language-german",
    "topicId": "language-german-request",
    "domain": "제2외국어/한문",
    "subject": "독일어Ⅰ",
    "topic": "정중한 길 묻기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 질문에 대한 응답으로 가장 적절한 것을 고르세요.",
    "passage": "A: Entschuldigung, wo ist der Bahnhof?\nB: ___",
    "options": [
      "Guten Appetit!",
      "Gehen Sie geradeaus.",
      "Ich heiße Anna.",
      "Es ist Montag.",
      "Ich bin sechzehn Jahre alt."
    ],
    "answerIndex": 1,
    "hint": "위치를 묻는 말에는 방향을 안내하는 말이 어울립니다.",
    "solutionSteps": [
      "wo ist가 어디에 있느냐는 위치 질문임을 확인합니다.",
      "Bahnhof는 기차역이므로 방향을 안내하는 대답을 찾습니다.",
      "Gehen Sie geradeaus는 곧장 가세요라는 뜻으로 질문에 답합니다."
    ],
    "commonMistakes": [
      "질문에 나오는 Bahnhof를 시각을 뜻하는 Uhr와 혼동하지 마세요.",
      "문법적으로 완성된 문장이어도 대화 목적에 맞아야 합니다."
    ],
    "optionAnalysis": [
      "맛있게 드세요라는 식사 인사로 길 묻기에 대한 답이 아닙니다.",
      "곧장 가세요라는 방향 안내이므로 역이 어디인지 묻는 질문에 적절합니다.",
      "제 이름은 안나입니다라는 자기소개여서 방향 안내가 아닙니다.",
      "월요일입니다라는 요일 정보는 역의 위치를 알려 주지 않습니다.",
      "저는 열여섯 살입니다라는 나이 정보는 질문과 맞지 않습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "A: 실례합니다. 기차역은 어디에 있나요?\nB: 곧장 가세요.",
    "vocabulary": [
      [
        "Entschuldigung",
        "실례합니다"
      ],
      [
        "wo",
        "어디"
      ],
      [
        "der Bahnhof",
        "기차역"
      ],
      [
        "geradeaus",
        "곧장"
      ]
    ],
    "languageCode": "de",
    "sourceRefs": [
      "https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "독일어Ⅰ"
  },
  {
    "id": "authored-language-german-notice",
    "courseId": "language-german",
    "topicId": "language-german-notice",
    "domain": "제2외국어/한문",
    "subject": "독일어Ⅰ",
    "topic": "운영 시간 안내 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "안내문에 따르면 토요일에는 몇 시에 문을 닫나요?",
    "passage": "Bibliothek\nMontag bis Freitag: 9–18 Uhr\nSamstag: 10–14 Uhr\nSonntag: geschlossen",
    "options": [
      "18 Uhr",
      "20 Uhr",
      "14 Uhr",
      "9 Uhr",
      "10 Uhr"
    ],
    "answerIndex": 2,
    "hint": "Samstag 줄의 뒤쪽 시간을 보세요.",
    "solutionSteps": [
      "토요일을 뜻하는 Samstag가 있는 줄을 찾습니다.",
      "10–14 Uhr에서 앞은 시작 시각, 뒤는 끝나는 시각입니다.",
      "따라서 토요일 폐관 시각은 14 Uhr입니다."
    ],
    "commonMistakes": [
      "평일 운영 시간과 토요일 운영 시간을 섞지 마세요.",
      "개관 시간 10시와 폐관 시간 14시를 구분하세요."
    ],
    "optionAnalysis": [
      "18시는 평일 폐관 시간으로 토요일과 다릅니다.",
      "20시는 안내문에 제시되어 있지 않습니다.",
      "Samstag의 운영 시간은 10–14 Uhr이므로 14시에 문을 닫습니다.",
      "9시는 월요일부터 금요일까지의 개관 시간입니다.",
      "10시는 토요일의 개관 시간이며 폐관 시간이 아닙니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "도서관\n월요일~금요일: 9~18시\n토요일: 10~14시\n일요일: 휴관",
    "vocabulary": [
      [
        "Bibliothek",
        "도서관"
      ],
      [
        "Samstag",
        "토요일"
      ],
      [
        "Sonntag",
        "일요일"
      ],
      [
        "geschlossen",
        "닫은, 휴관인"
      ]
    ],
    "languageCode": "de",
    "sourceRefs": [
      "https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "독일어Ⅰ"
  },
  {
    "id": "authored-language-german-vocabulary",
    "courseId": "language-german",
    "topicId": "language-german-vocabulary",
    "domain": "제2외국어/한문",
    "subject": "독일어Ⅰ",
    "topic": "장소와 활동 어휘",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 설명에 가장 잘 맞는 장소를 고르세요.",
    "passage": "Hier kann man Bücher lesen und ausleihen.",
    "options": [
      "Bahnhof",
      "Schwimmbad",
      "Flughafen",
      "Bibliothek",
      "Bäckerei"
    ],
    "answerIndex": 3,
    "hint": "Bücher와 ausleihen을 함께 생각해 보세요.",
    "solutionSteps": [
      "Bücher는 책들을 뜻합니다.",
      "lesen은 읽다, ausleihen은 빌리다 또는 빌려주다의 의미로 쓰입니다.",
      "책을 읽고 빌릴 수 있는 장소인 Bibliothek을 고릅니다."
    ],
    "commonMistakes": [
      "책을 파는 서점과 책을 빌리는 도서관을 구분하세요.",
      "익숙한 장소 이름을 고르기보다 활동 동사를 먼저 확인하세요."
    ],
    "optionAnalysis": [
      "Bahnhof는 기차역으로 기차를 이용하는 장소입니다.",
      "Schwimmbad는 수영장으로 수영하는 장소입니다.",
      "Flughafen은 공항으로 비행기를 이용하는 장소입니다.",
      "책을 읽고 빌리는 장소는 도서관인 Bibliothek입니다.",
      "Bäckerei는 빵집으로 빵을 사는 장소입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "여기에서는 책을 읽고 빌릴 수 있다.",
    "vocabulary": [
      [
        "Bücher",
        "책들"
      ],
      [
        "lesen",
        "읽다"
      ],
      [
        "ausleihen",
        "빌리다, 빌려주다"
      ],
      [
        "Bibliothek",
        "도서관"
      ]
    ],
    "languageCode": "de",
    "sourceRefs": [
      "https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "독일어Ⅰ"
  },
  {
    "id": "authored-language-french-polite-order",
    "courseId": "language-french",
    "topicId": "language-french-polite-order",
    "domain": "제2외국어/한문",
    "subject": "프랑스어Ⅰ",
    "topic": "정중한 주문 표현",
    "kind": "authored",
    "type": "authored",
    "statement": "빵집에서 빵 하나를 정중하게 주문하는 말로 가장 적절한 것을 고르세요.",
    "passage": "상황: 손님이 빵 하나를 주문하려고 한다.",
    "options": [
      "Je suis à la bibliothèque.",
      "Il est huit heures.",
      "J’ai quinze ans.",
      "Nous sommes mardi.",
      "Je voudrais un pain, s’il vous plaît."
    ],
    "answerIndex": 4,
    "hint": "원하는 것을 정중하게 말하는 Je voudrais를 찾으세요.",
    "solutionSteps": [
      "상황에서 필요한 발화는 주문이라는 점을 확인합니다.",
      "Je voudrais 뒤에는 원하는 대상을 놓을 수 있습니다.",
      "un pain과 s’il vous plaît가 들어간 보기가 빵 하나를 정중하게 요청합니다."
    ],
    "commonMistakes": [
      "Je suis는 나는 ~이다라는 표현으로 Je voudrais와 용법이 다릅니다.",
      "빵을 주문하는 내용이 없는 인사나 정보 전달을 고르지 마세요."
    ],
    "optionAnalysis": [
      "저는 도서관에 있습니다라는 위치 설명입니다.",
      "여덟 시입니다라는 시각 설명으로 주문이 아닙니다.",
      "저는 열다섯 살입니다라는 나이 소개입니다.",
      "오늘은 화요일입니다라는 요일 설명입니다.",
      "빵 하나를 부탁합니다라는 정중한 주문이므로 상황에 적절합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "정답 문장: 빵 하나를 부탁합니다.",
    "vocabulary": [
      [
        "Je voudrais",
        "저는 ~을 원합니다, ~을 부탁합니다"
      ],
      [
        "un pain",
        "빵 하나"
      ],
      [
        "s’il vous plaît",
        "부탁합니다"
      ]
    ],
    "languageCode": "fr",
    "sourceRefs": [
      "https://apprendre.tv5monde.com/fr/aides/grammaire"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "프랑스어Ⅰ"
  },
  {
    "id": "authored-language-french-plural",
    "courseId": "language-french",
    "topicId": "language-french-plural",
    "domain": "제2외국어/한문",
    "subject": "프랑스어Ⅰ",
    "topic": "수량과 명사의 복수형",
    "kind": "authored",
    "type": "authored",
    "statement": "빈칸에 들어갈 말로 알맞은 것을 고르세요.",
    "passage": "J’ai deux ___.",
    "options": [
      "livres",
      "livre",
      "livreses",
      "livrex",
      "livrent"
    ],
    "answerIndex": 0,
    "hint": "수량 deux에 맞는 명사의 복수형을 고르세요.",
    "solutionSteps": [
      "deux가 수량 2를 나타냄을 확인합니다.",
      "명사 livre는 이 경우 복수형에 -s를 붙입니다.",
      "J’ai deux livres는 나는 책 두 권을 가지고 있다는 뜻입니다."
    ],
    "commonMistakes": [
      "복수형 -s가 발음되지 않는 경우라도 철자에는 적어야 합니다.",
      "명사의 복수형과 동사의 어미를 혼동하지 마세요."
    ],
    "optionAnalysis": [
      "deux는 둘을 뜻하므로 명사 livre의 복수형 livres가 알맞습니다.",
      "livre는 단수형이므로 deux 뒤에서 알맞지 않습니다.",
      "livreses는 livre의 올바른 복수형이 아닙니다.",
      "livrex는 livre의 올바른 복수형이 아닙니다.",
      "livrent는 여기서 필요한 명사의 복수형이 아닙니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 나는 책 두 권을 가지고 있다.",
    "vocabulary": [
      [
        "J’ai",
        "나는 가지고 있다"
      ],
      [
        "deux",
        "둘"
      ],
      [
        "un livre",
        "책 한 권"
      ],
      [
        "des livres",
        "책들"
      ]
    ],
    "languageCode": "fr",
    "sourceRefs": [
      "https://apprendre.tv5monde.com/fr/aides/grammaire"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "프랑스어Ⅰ"
  },
  {
    "id": "authored-language-french-reading",
    "courseId": "language-french",
    "topicId": "language-french-reading",
    "domain": "제2외국어/한문",
    "subject": "프랑스어Ⅰ",
    "topic": "짧은 일정 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 글에서 Léa가 도서관에 머무르는 마지막 시각을 고르세요.",
    "passage": "Léa finit les cours à 16 heures. Ensuite, elle va à la bibliothèque. Elle y reste jusqu’à 17 h 30.",
    "options": [
      "19 h 30",
      "17 h 30",
      "16 heures",
      "15 heures",
      "18 heures"
    ],
    "answerIndex": 1,
    "hint": "jusqu’à는 ~까지라는 뜻입니다.",
    "solutionSteps": [
      "첫 문장의 16시는 수업 종료 시각임을 구분합니다.",
      "elle y reste에서 y는 앞에 나온 도서관을 가리킵니다.",
      "jusqu’à 17 h 30에 따라 도서관에 머무르는 마지막 시각은 17시 30분입니다."
    ],
    "commonMistakes": [
      "서로 다른 활동에 연결된 시간을 섞지 마세요.",
      "17 h 30을 17시 3분으로 읽지 마세요."
    ],
    "optionAnalysis": [
      "19시 30분은 글의 시각과 다릅니다.",
      "jusqu’à 17 h 30가 17시 30분까지 머문다는 뜻입니다.",
      "16시는 수업이 끝나는 시각으로 도서관 체류 종료 시각이 아닙니다.",
      "15시는 글에 제시되지 않았습니다.",
      "18시는 글에 제시되지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "레아는 16시에 수업을 마친다. 그다음 도서관에 간다. 그녀는 그곳에 17시 30분까지 머문다.",
    "vocabulary": [
      [
        "finir",
        "마치다"
      ],
      [
        "ensuite",
        "그다음"
      ],
      [
        "la bibliothèque",
        "도서관"
      ],
      [
        "jusqu’à",
        "~까지"
      ]
    ],
    "languageCode": "fr",
    "sourceRefs": [
      "https://apprendre.tv5monde.com/fr/aides/grammaire"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "프랑스어Ⅰ"
  },
  {
    "id": "authored-language-french-weather",
    "courseId": "language-french",
    "topicId": "language-french-weather",
    "domain": "제2외국어/한문",
    "subject": "프랑스어Ⅰ",
    "topic": "날씨와 물건 연결",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 상황에서 비를 피하기 위해 필요한 물건으로 가장 적절한 것을 고르세요.",
    "passage": "Il pleut. Marie veut sortir sans se mouiller.",
    "options": [
      "une clé",
      "un cahier",
      "un parapluie",
      "une fourchette",
      "un oreiller"
    ],
    "answerIndex": 2,
    "hint": "비를 막는 물건의 이름을 떠올려 보세요.",
    "solutionSteps": [
      "Il pleut에서 비가 오는 상황임을 파악합니다.",
      "sans se mouiller는 몸이 젖지 않고라는 뜻입니다.",
      "따라서 비를 막는 물건인 un parapluie가 알맞습니다."
    ],
    "commonMistakes": [
      "pleut를 맑은 날씨를 뜻하는 표현으로 오해하지 마세요.",
      "단어의 성·관사만 보지 말고 사물의 의미도 확인하세요."
    ],
    "optionAnalysis": [
      "clé는 열쇠로 비를 막는 물건이 아닙니다.",
      "cahier는 공책으로 비에 젖지 않기 위한 적절한 물건이 아닙니다.",
      "비에 젖지 않기 위해 필요한 물건은 우산인 parapluie입니다.",
      "fourchette는 포크로 비를 막는 물건이 아닙니다.",
      "oreiller는 베개로 외출할 때 비를 막는 물건이 아닙니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "비가 온다. 마리는 몸이 젖지 않고 밖에 나가고 싶어 한다.",
    "vocabulary": [
      [
        "Il pleut",
        "비가 온다"
      ],
      [
        "sortir",
        "외출하다"
      ],
      [
        "sans",
        "~없이"
      ],
      [
        "un parapluie",
        "우산 하나"
      ]
    ],
    "languageCode": "fr",
    "sourceRefs": [
      "https://apprendre.tv5monde.com/fr/aides/grammaire"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "프랑스어Ⅰ"
  },
  {
    "id": "authored-language-spanish-ser",
    "courseId": "language-spanish",
    "topicId": "language-spanish-ser",
    "domain": "제2외국어/한문",
    "subject": "스페인어Ⅰ",
    "topic": "주어와 ser 동사",
    "kind": "authored",
    "type": "authored",
    "statement": "빈칸에 들어갈 말로 가장 알맞은 것을 고르세요.",
    "passage": "Yo ___ estudiante.",
    "options": [
      "es",
      "somos",
      "son",
      "soy",
      "eres"
    ],
    "answerIndex": 3,
    "hint": "yo와 ser의 현재형을 연결해 보세요.",
    "solutionSteps": [
      "주어 Yo가 나를 뜻함을 확인합니다.",
      "ser의 현재형에서 1인칭 단수는 soy입니다.",
      "Yo soy estudiante는 나는 학생이라는 뜻입니다."
    ],
    "commonMistakes": [
      "tú에 쓰는 eres를 yo와 함께 쓰지 마세요.",
      "복수형 somos·son을 단수 주어와 연결하지 마세요."
    ],
    "optionAnalysis": [
      "es는 él/ella/usted 등에 맞는 단수 형태입니다.",
      "somos는 1인칭 복수 nosotros/nosotras에 맞는 형태입니다.",
      "son은 ellos/ellas/ustedes에 맞는 복수 형태입니다.",
      "yo는 1인칭 단수이므로 ser의 현재형 soy가 맞습니다.",
      "eres는 2인칭 단수 tú에 맞는 형태입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 나는 학생이다.",
    "vocabulary": [
      [
        "yo",
        "나"
      ],
      [
        "ser",
        "~이다"
      ],
      [
        "soy",
        "나는 ~이다"
      ],
      [
        "estudiante",
        "학생"
      ]
    ],
    "languageCode": "es",
    "sourceRefs": [
      "https://dle.rae.es/ser"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "스페인어Ⅰ"
  },
  {
    "id": "authored-language-spanish-direction",
    "courseId": "language-spanish",
    "topicId": "language-spanish-direction",
    "domain": "제2외국어/한문",
    "subject": "스페인어Ⅰ",
    "topic": "위치 질문과 응답",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 질문에 대한 응답으로 가장 적절한 것을 고르세요.",
    "passage": "A: ¿Dónde está la estación?\nB: ___",
    "options": [
      "Tengo dieciséis años.",
      "Me llamo Ana.",
      "Son las tres.",
      "Hoy es miércoles.",
      "Está al lado del banco."
    ],
    "answerIndex": 4,
    "hint": "장소를 묻는 질문에 장소 정보가 있는 답을 찾으세요.",
    "solutionSteps": [
      "Dónde가 어디라는 뜻의 장소 의문사임을 확인합니다.",
      "estación은 역이므로 위치를 안내하는 응답을 찾습니다.",
      "al lado del banco는 은행 옆에라는 뜻으로 질문에 답합니다."
    ],
    "commonMistakes": [
      "Dónde와 언제라는 뜻의 Cuándo를 혼동하지 마세요.",
      "문장 자체가 자연스러워도 질문의 정보 범주와 맞아야 합니다."
    ],
    "optionAnalysis": [
      "나는 열여섯 살입니다라는 나이 설명입니다.",
      "내 이름은 아나입니다라는 자기소개입니다.",
      "세 시입니다라는 시각 설명입니다.",
      "오늘은 수요일입니다라는 요일 설명입니다.",
      "은행 옆에 있습니다라는 위치 설명이므로 역의 위치 질문에 적절합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "A: 역은 어디에 있나요?\nB: 은행 옆에 있어요.",
    "vocabulary": [
      [
        "dónde",
        "어디"
      ],
      [
        "la estación",
        "역"
      ],
      [
        "al lado de",
        "~옆에"
      ],
      [
        "el banco",
        "은행"
      ]
    ],
    "languageCode": "es",
    "sourceRefs": [
      "https://dle.rae.es/ser"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "스페인어Ⅰ"
  },
  {
    "id": "authored-language-spanish-schedule",
    "courseId": "language-spanish",
    "topicId": "language-spanish-schedule",
    "domain": "제2외국어/한문",
    "subject": "스페인어Ⅰ",
    "topic": "요일과 약속 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 글에 따르면 회의가 있는 요일은 언제인가요?",
    "passage": "El martes hay una reunión a las cinco de la tarde. El jueves, Ana estudia en casa.",
    "options": [
      "el martes",
      "el lunes",
      "el miércoles",
      "el jueves",
      "el viernes"
    ],
    "answerIndex": 0,
    "hint": "reunión과 같은 문장에 있는 요일을 찾으세요.",
    "solutionSteps": [
      "회의를 뜻하는 reunión이 있는 문장을 찾습니다.",
      "El martes가 해당 문장의 요일입니다.",
      "martes는 화요일이므로 화요일을 고릅니다."
    ],
    "commonMistakes": [
      "화요일 martes와 수요일 miércoles를 혼동하지 마세요.",
      "목요일은 공부하는 날로 회의 날과 다릅니다."
    ],
    "optionAnalysis": [
      "첫 문장에서 회의가 화요일에 있다고 제시합니다.",
      "lunes는 월요일이며 글에 제시된 회의 요일이 아닙니다.",
      "miércoles는 수요일로 martes와 다릅니다.",
      "jueves는 아나가 집에서 공부하는 목요일입니다.",
      "viernes는 금요일이며 글에 제시되지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "화요일 오후 다섯 시에 회의가 있다. 목요일에 아나는 집에서 공부한다.",
    "vocabulary": [
      [
        "el martes",
        "화요일"
      ],
      [
        "una reunión",
        "회의 하나"
      ],
      [
        "las cinco de la tarde",
        "오후 다섯 시"
      ],
      [
        "el jueves",
        "목요일"
      ]
    ],
    "languageCode": "es",
    "sourceRefs": [
      "https://dle.rae.es/ser"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "스페인어Ⅰ"
  },
  {
    "id": "authored-language-spanish-meal",
    "courseId": "language-spanish",
    "topicId": "language-spanish-meal",
    "domain": "제2외국어/한문",
    "subject": "스페인어Ⅰ",
    "topic": "식사 어휘 구분",
    "kind": "authored",
    "type": "authored",
    "statement": "밑의 문장에서 desayuno의 뜻으로 가장 적절한 것을 고르세요.",
    "passage": "Antes de ir a la escuela, tomo el desayuno a las siete.",
    "options": [
      "숙제",
      "아침 식사",
      "저녁 식사",
      "도서관",
      "기차표"
    ],
    "answerIndex": 1,
    "hint": "아침 등교 전에 먹는 식사를 떠올려 보세요.",
    "solutionSteps": [
      "등교 전에 먹는다는 상황을 확인합니다.",
      "desayuno는 아침 식사를 가리키는 명사입니다.",
      "따라서 일곱 시에 아침 식사를 한다는 문장입니다."
    ],
    "commonMistakes": [
      "아침·점심·저녁의 식사 명칭을 구분하세요.",
      "학교 관련 문장이라는 이유만으로 숙제를 고르지 마세요."
    ],
    "optionAnalysis": [
      "숙제는 deberes 또는 tarea로 식사를 뜻하지 않습니다.",
      "desayuno는 아침에 하는 식사를 뜻하며 등교 전 7시라는 문맥과도 맞습니다.",
      "저녁 식사는 보통 cena라고 하며 desayuno와 뜻이 다릅니다.",
      "도서관은 biblioteca로 식사 어휘가 아닙니다.",
      "기차표는 billete de tren 등으로 표현하며 desayuno와 다릅니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "나는 학교에 가기 전에 일곱 시에 아침 식사를 한다.",
    "vocabulary": [
      [
        "antes de",
        "~전에"
      ],
      [
        "ir a la escuela",
        "학교에 가다"
      ],
      [
        "desayuno",
        "아침 식사"
      ],
      [
        "a las siete",
        "일곱 시에"
      ]
    ],
    "languageCode": "es",
    "sourceRefs": [
      "https://dle.rae.es/desayuno"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "스페인어Ⅰ"
  },
  {
    "id": "authored-language-chinese-classifier",
    "courseId": "language-chinese",
    "topicId": "language-chinese-classifier",
    "domain": "제2외국어/한문",
    "subject": "중국어Ⅰ",
    "topic": "수량사와 명사",
    "kind": "authored",
    "type": "authored",
    "statement": "책 두 권이라는 뜻이 되도록 빈칸에 들어갈 말을 고르세요.",
    "passage": "我有两___书。",
    "options": [
      "件",
      "只",
      "本",
      "张",
      "杯"
    ],
    "answerIndex": 2,
    "hint": "书와 자주 함께 쓰는 양사를 떠올려 보세요.",
    "solutionSteps": [
      "문장에서 세려는 명사가 书, 곧 책임을 확인합니다.",
      "책의 권수를 셀 때는 양사 本을 사용합니다.",
      "따라서 我有两本书는 나는 책 두 권을 가지고 있다는 뜻입니다."
    ],
    "commonMistakes": [
      "수사 两와 명사 书 사이의 양사를 생략하지 마세요.",
      "모든 명사에 같은 양사를 사용할 수 있는 것은 아닙니다."
    ],
    "optionAnalysis": [
      "件은 옷이나 일 등의 대상을 세는 데 쓰이며 이 문장의 책 권수와 맞지 않습니다.",
      "只는 일부 동물이나 짝을 이룬 물건의 한쪽 등을 세는 말로 이 문장의 책과 맞지 않습니다.",
      "本은 책이나 공책 등의 권수를 세는 양사입니다.",
      "张은 종이·표 등 납작한 대상을 세는 양사로 책의 권수를 세는 데 맞지 않습니다.",
      "杯는 컵에 담긴 음료의 양을 세는 말입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 나는 책 두 권을 가지고 있다.",
    "vocabulary": [
      [
        "我",
        "나"
      ],
      [
        "有",
        "가지고 있다"
      ],
      [
        "两",
        "둘"
      ],
      [
        "本",
        "책·공책의 권수를 세는 양사"
      ],
      [
        "书",
        "책"
      ]
    ],
    "languageCode": "zh",
    "sourceRefs": [
      "https://dict.revised.moe.edu.tw/dictView.jsp?ID=269&la=0&powerMode=0"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "중국어Ⅰ"
  },
  {
    "id": "authored-language-chinese-time",
    "courseId": "language-chinese",
    "topicId": "language-chinese-time",
    "domain": "제2외국어/한문",
    "subject": "중국어Ⅰ",
    "topic": "시각을 묻고 답하기",
    "kind": "authored",
    "type": "authored",
    "statement": "대화에 따르면 B가 일어나는 시각을 고르세요.",
    "passage": "A：你几点起床？\nB：我早上六点半起床。",
    "options": [
      "오전 6시",
      "오전 7시",
      "오전 7시 30분",
      "오전 6시 30분",
      "오전 5시 30분"
    ],
    "answerIndex": 3,
    "hint": "半은 반 시간인 30분입니다.",
    "solutionSteps": [
      "几点起床은 몇 시에 일어나는지를 묻습니다.",
      "답의 六点은 6시, 半은 30분입니다.",
      "따라서 B가 일어나는 시각은 6시 30분입니다."
    ],
    "commonMistakes": [
      "半을 15분으로 해석하지 마세요.",
      "六와 七의 숫자를 구분하세요."
    ],
    "optionAnalysis": [
      "半이 있으므로 정각 6시가 아닙니다.",
      "일곱 시는 七点으로 제시된 六点半과 다릅니다.",
      "七点半이어야 하며 제시된 대답은 六点半입니다.",
      "六点半은 여섯 시 삼십 분이며 起床은 잠자리에서 일어나다라는 뜻입니다.",
      "다섯 시는 五点으로 六点과 다릅니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "A: 너는 몇 시에 일어나니?\nB: 나는 아침 여섯 시 반에 일어나.",
    "vocabulary": [
      [
        "几点",
        "몇 시"
      ],
      [
        "起床",
        "잠자리에서 일어나다"
      ],
      [
        "六点",
        "여섯 시"
      ],
      [
        "半",
        "반, 30분"
      ]
    ],
    "languageCode": "zh",
    "sourceRefs": [
      "https://dict.revised.moe.edu.tw/dictView.jsp?ID=269&la=0&powerMode=0"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "중국어Ⅰ"
  },
  {
    "id": "authored-language-chinese-reading",
    "courseId": "language-chinese",
    "topicId": "language-chinese-reading",
    "domain": "제2외국어/한문",
    "subject": "중국어Ⅰ",
    "topic": "이동 일정 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 글에 따르면 小王이 집으로 돌아가는 시각을 고르세요.",
    "passage": "小王星期三下午三点去图书馆，四点回家。",
    "options": [
      "오전 3시",
      "오후 2시",
      "오후 3시",
      "오후 5시",
      "오후 4시"
    ],
    "answerIndex": 4,
    "hint": "回家 바로 앞의 시각을 찾으세요.",
    "solutionSteps": [
      "回家가 집으로 돌아가다라는 뜻임을 확인합니다.",
      "回家 앞의 四点이 귀가 시각입니다.",
      "앞에서 下午가 제시되었으므로 오후 네 시로 해석합니다."
    ],
    "commonMistakes": [
      "도서관에 가는 시각과 집으로 돌아가는 시각을 바꾸어 읽지 마세요.",
      "요일 星期三과 시각 三点은 서로 다른 정보입니다."
    ],
    "optionAnalysis": [
      "下午는 오후를 뜻하므로 오전이 아니며, 三点은 도서관에 가는 시각입니다.",
      "오후 두 시라는 정보는 지문에 없습니다.",
      "오후 세 시는 도서관에 가는 시각입니다.",
      "오후 다섯 시라는 정보는 지문에 없습니다.",
      "四点回家에서 오후 네 시에 집으로 돌아간다고 했습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "샤오왕은 수요일 오후 세 시에 도서관에 가고, 네 시에 집으로 돌아온다.",
    "vocabulary": [
      [
        "星期三",
        "수요일"
      ],
      [
        "下午",
        "오후"
      ],
      [
        "图书馆",
        "도서관"
      ],
      [
        "回家",
        "집으로 돌아가다"
      ]
    ],
    "languageCode": "zh",
    "sourceRefs": [
      "https://dict.revised.moe.edu.tw/dictView.jsp?ID=269&la=0&powerMode=0"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "중국어Ⅰ"
  },
  {
    "id": "authored-language-chinese-antonym",
    "courseId": "language-chinese",
    "topicId": "language-chinese-antonym",
    "domain": "제2외국어/한문",
    "subject": "중국어Ⅰ",
    "topic": "기본 형용사와 반의어",
    "kind": "authored",
    "type": "authored",
    "statement": "형용사 大의 반대 뜻을 가진 말을 고르세요.",
    "passage": "大",
    "options": [
      "小",
      "多",
      "好",
      "热",
      "快"
    ],
    "answerIndex": 0,
    "hint": "크다와 작다의 의미 관계를 생각하세요.",
    "solutionSteps": [
      "大의 기본 의미가 크다임을 확인합니다.",
      "반대 의미는 작다입니다.",
      "작다를 뜻하는 小가 정답입니다."
    ],
    "commonMistakes": [
      "크기와 수량이 많고 적음을 혼동하지 마세요.",
      "발음이 익숙한 단어보다 의미의 짝을 확인하세요."
    ],
    "optionAnalysis": [
      "小는 작다라는 뜻으로 크다를 뜻하는 大의 반의어입니다.",
      "多는 많다라는 수량의 의미로 大의 직접적인 반의어가 아닙니다.",
      "好는 좋다라는 뜻입니다.",
      "热는 덥다 또는 뜨겁다라는 뜻입니다.",
      "快는 빠르다라는 뜻입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "大: 크다 / 정답 小: 작다",
    "vocabulary": [
      [
        "大",
        "크다"
      ],
      [
        "小",
        "작다"
      ],
      [
        "多",
        "많다"
      ],
      [
        "热",
        "덥다, 뜨겁다"
      ]
    ],
    "languageCode": "zh",
    "sourceRefs": [
      "https://dict.revised.moe.edu.tw/dictView.jsp?ID=269&la=0&powerMode=0"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "중국어Ⅰ"
  },
  {
    "id": "authored-language-japanese-particle",
    "courseId": "language-japanese",
    "topicId": "language-japanese-particle",
    "domain": "제2외국어/한문",
    "subject": "일본어Ⅰ",
    "topic": "정확한 시각과 조사 に",
    "kind": "authored",
    "type": "authored",
    "statement": "오전 일곱 시에 일어난다는 뜻이 되도록 빈칸에 들어갈 조사를 고르세요.",
    "passage": "毎朝七時___起きます。",
    "options": [
      "と",
      "に",
      "を",
      "で",
      "が"
    ],
    "answerIndex": 1,
    "hint": "정확한 시각 뒤에 붙는 조사를 떠올려 보세요.",
    "solutionSteps": [
      "七時가 정확한 시각을 나타냄을 확인합니다.",
      "그 시각에 동작이 일어남을 나타내려면 に를 사용합니다.",
      "毎朝七時に起きます는 매일 아침 일곱 시에 일어난다는 뜻입니다."
    ],
    "commonMistakes": [
      "시간의 に와 장소의 で를 혼동하지 마세요.",
      "毎朝 자체에 조사를 붙이는 경우와 七時에 붙이는 경우를 구분하세요."
    ],
    "optionAnalysis": [
      "と는 함께하는 상대나 인용 등의 기능을 하며 이 문장의 시각 표시와 맞지 않습니다.",
      "정확한 시각 七時 뒤에서 때를 나타내는 조사 に가 알맞습니다.",
      "を는 주로 동작의 목적어 등을 나타내며 이 문장에서 시각을 나타내지 않습니다.",
      "で는 동작의 장소·수단 등에 쓰이며 제시된 정확한 시각과 맞지 않습니다.",
      "が는 주어 등을 표시하는 조사로 일어나는 시각을 나타내는 자리에 맞지 않습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 매일 아침 일곱 시에 일어난다.",
    "vocabulary": [
      [
        "毎朝",
        "매일 아침"
      ],
      [
        "七時",
        "일곱 시"
      ],
      [
        "に",
        "~에"
      ],
      [
        "起きます",
        "일어납니다"
      ]
    ],
    "languageCode": "ja",
    "sourceRefs": [
      "https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "일본어Ⅰ"
  },
  {
    "id": "authored-language-japanese-direction",
    "courseId": "language-japanese",
    "topicId": "language-japanese-direction",
    "domain": "제2외국어/한문",
    "subject": "일본어Ⅰ",
    "topic": "길 묻기에 응답하기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 질문에 대한 응답으로 가장 적절한 것을 고르세요.",
    "passage": "A：すみません。駅はどこですか。\nB：___",
    "options": [
      "りんごが好きです。",
      "今、八時です。",
      "この道をまっすぐ行ってください。",
      "私は高校生です。",
      "今日は水曜日です。"
    ],
    "answerIndex": 2,
    "hint": "まっすぐ는 똑바로라는 뜻입니다.",
    "solutionSteps": [
      "駅はどこですか가 역이 어디인지 묻는 질문임을 파악합니다.",
      "대답에는 길이나 위치 정보가 필요합니다.",
      "この道をまっすぐ行ってください가 똑바로 가라는 방향 안내입니다."
    ],
    "commonMistakes": [
      "どこ를 언제라는 뜻으로 해석하지 마세요.",
      "공손한 말투만으로 정답을 고르지 말고 내용의 연결을 확인하세요."
    ],
    "optionAnalysis": [
      "사과를 좋아합니다라는 기호 표현입니다.",
      "지금 여덟 시입니다라는 시각 정보입니다.",
      "이 길을 똑바로 가세요라는 길 안내로 역의 위치를 묻는 말에 적절합니다.",
      "저는 고등학생입니다라는 자기소개로 위치를 안내하지 않습니다.",
      "오늘은 수요일입니다라는 요일 정보입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "A: 실례합니다. 역은 어디인가요?\nB: 이 길을 똑바로 가세요.",
    "vocabulary": [
      [
        "すみません",
        "실례합니다"
      ],
      [
        "駅",
        "역"
      ],
      [
        "この道",
        "이 길"
      ],
      [
        "まっすぐ",
        "똑바로"
      ]
    ],
    "languageCode": "ja",
    "sourceRefs": [
      "https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "일본어Ⅰ"
  },
  {
    "id": "authored-language-japanese-notice",
    "courseId": "language-japanese",
    "topicId": "language-japanese-notice",
    "domain": "제2외국어/한문",
    "subject": "일본어Ⅰ",
    "topic": "휴관일 안내 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "안내문에 따르면 도서관이 쉬는 요일은 언제인가요?",
    "passage": "図書館\n開館時間：午前九時〜午後六時\n休み：木曜日",
    "options": [
      "화요일",
      "수요일",
      "금요일",
      "목요일",
      "월요일"
    ],
    "answerIndex": 3,
    "hint": "休み 옆의 요일 한자를 확인하세요.",
    "solutionSteps": [
      "쉬는 날을 뜻하는 休み가 있는 줄을 찾습니다.",
      "해당 줄의 木曜日를 확인합니다.",
      "木曜日는 목요일이므로 정답은 목요일입니다."
    ],
    "commonMistakes": [
      "木와 水의 글자 모양을 혼동하지 마세요.",
      "운영 시간의 午前·午後를 휴관 요일과 혼동하지 마세요."
    ],
    "optionAnalysis": [
      "화요일은 火曜日로 제시된 휴관일이 아닙니다.",
      "수요일은 水曜日로 木曜日와 다릅니다.",
      "금요일은 金曜日이며 안내문의 휴관일이 아닙니다.",
      "木曜日는 목요일이며 休み 옆에 제시되어 있습니다.",
      "월요일은 月曜日로 木曜日와 다릅니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "도서관\n개관 시간: 오전 아홉 시~오후 여섯 시\n휴관일: 목요일",
    "vocabulary": [
      [
        "図書館",
        "도서관"
      ],
      [
        "開館時間",
        "개관 시간"
      ],
      [
        "休み",
        "쉬는 날, 휴관"
      ],
      [
        "木曜日",
        "목요일"
      ]
    ],
    "languageCode": "ja",
    "sourceRefs": [
      "https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "일본어Ⅰ"
  },
  {
    "id": "authored-language-japanese-permission",
    "courseId": "language-japanese",
    "topicId": "language-japanese-permission",
    "domain": "제2외국어/한문",
    "subject": "일본어Ⅰ",
    "topic": "허락을 구하는 표현",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 문장의 뜻으로 가장 적절한 것을 고르세요.",
    "passage": "この本を借りてもいいですか。",
    "options": [
      "이 책을 빌리지 마세요.",
      "이 책을 어제 샀어요.",
      "이 책은 어디에 있나요?",
      "이 책을 읽을 수 없어요.",
      "이 책을 빌려도 되나요?"
    ],
    "answerIndex": 4,
    "hint": "てもいいですか는 ~해도 괜찮은가요라는 뜻입니다.",
    "solutionSteps": [
      "借りる가 빌리다라는 동사임을 확인합니다.",
      "てもいいですか가 ~해도 되나요라는 허락 표현임을 파악합니다.",
      "この本을 목적어로 연결하면 이 책을 빌려도 되나요가 됩니다."
    ],
    "commonMistakes": [
      "借りる와 사다를 뜻하는 買う를 혼동하지 마세요.",
      "허락을 묻는 표현을 상대에게 금지하는 표현으로 읽지 마세요."
    ],
    "optionAnalysis": [
      "금지 표현은 借りないでください 등으로 나타내며 제시 문장과 다릅니다.",
      "어제 샀다는 과거의 구매 내용은 문장에 없습니다.",
      "장소를 묻는 どこ가 없으며 이 문장은 허락을 묻습니다.",
      "읽을 수 없다는 가능 부정의 내용이 아닙니다.",
      "借りてもいいですか는 빌려도 괜찮은지를 묻는 허락 요청입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "이 책을 빌려도 되나요?",
    "vocabulary": [
      [
        "この本",
        "이 책"
      ],
      [
        "借りる",
        "빌리다"
      ],
      [
        "てもいいですか",
        "~해도 되나요"
      ]
    ],
    "languageCode": "ja",
    "sourceRefs": [
      "https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "일본어Ⅰ"
  },
  {
    "id": "authored-language-russian-verb",
    "courseId": "language-russian",
    "topicId": "language-russian-verb",
    "domain": "제2외국어/한문",
    "subject": "러시아어Ⅰ",
    "topic": "현재형의 인칭 일치",
    "kind": "authored",
    "type": "authored",
    "statement": "빈칸에 들어갈 현재형으로 알맞은 것을 고르세요.",
    "passage": "Я ___ русский язык.",
    "options": [
      "изучаю",
      "изучаешь",
      "изучает",
      "изучаем",
      "изучают"
    ],
    "answerIndex": 0,
    "hint": "Я에 맞는 현재형 어미를 찾으세요.",
    "solutionSteps": [
      "주어 Я가 나를 뜻하는 1인칭 단수임을 확인합니다.",
      "изучать의 현재형에서 я에 맞는 형태는 изучаю입니다.",
      "Я изучаю русский язык는 나는 러시아어를 공부한다는 뜻입니다."
    ],
    "commonMistakes": [
      "주어가 단수인지 복수인지 먼저 구분하세요.",
      "2인칭 어미 -ешь를 1인칭과 연결하지 마세요."
    ],
    "optionAnalysis": [
      "я는 1인칭 단수이므로 изучаю가 맞습니다.",
      "изучаешь는 2인칭 단수 ты에 대응합니다.",
      "изучает는 3인칭 단수 он/она/оно에 대응합니다.",
      "изучаем은 1인칭 복수 мы에 대응합니다.",
      "изучают는 3인칭 복수 они에 대응합니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 나는 러시아어를 공부한다.",
    "vocabulary": [
      [
        "я",
        "나"
      ],
      [
        "изучать",
        "공부하다"
      ],
      [
        "русский язык",
        "러시아어"
      ]
    ],
    "languageCode": "ru",
    "sourceRefs": [
      "https://catalogue.irlc.msu.ru/media-texts-catalogue/all/texts/a2/podruga-i-grammatika"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "러시아어Ⅰ"
  },
  {
    "id": "authored-language-russian-location",
    "courseId": "language-russian",
    "topicId": "language-russian-location",
    "domain": "제2외국어/한문",
    "subject": "러시아어Ⅰ",
    "topic": "장소 질문과 응답",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 질문에 대한 응답으로 가장 적절한 것을 고르세요.",
    "passage": "A: Где библиотека?\nB: ___",
    "options": [
      "Я люблю музыку.",
      "Рядом со школой.",
      "Меня зовут Анна.",
      "Мне шестнадцать лет.",
      "Сегодня вторник."
    ],
    "answerIndex": 1,
    "hint": "Рядом은 가까이, 옆에라는 뜻입니다.",
    "solutionSteps": [
      "Где가 위치를 묻는 의문사임을 확인합니다.",
      "библиотека는 도서관입니다.",
      "Рядом со школой는 학교 옆에라는 뜻이므로 질문에 답합니다."
    ],
    "commonMistakes": [
      "위치를 묻는 Где와 방향을 묻는 Куда를 구분해 익히세요.",
      "대답의 문법적 완성도뿐 아니라 정보의 종류가 맞는지도 확인하세요."
    ],
    "optionAnalysis": [
      "저는 음악을 좋아합니다라는 기호 표현입니다.",
      "학교 옆에라는 위치 설명이므로 도서관의 위치 질문에 맞습니다.",
      "제 이름은 안나입니다라는 자기소개입니다.",
      "저는 열여섯 살입니다라는 나이 정보입니다.",
      "오늘은 화요일입니다라는 요일 정보입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "A: 도서관은 어디에 있나요?\nB: 학교 옆에 있어요.",
    "vocabulary": [
      [
        "где",
        "어디에"
      ],
      [
        "библиотека",
        "도서관"
      ],
      [
        "рядом со",
        "~옆에"
      ],
      [
        "школа",
        "학교"
      ]
    ],
    "languageCode": "ru",
    "sourceRefs": [
      "https://catalogue.irlc.msu.ru/media-texts-catalogue/all/texts/a2/podruga-i-grammatika"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "러시아어Ⅰ"
  },
  {
    "id": "authored-language-russian-reading",
    "courseId": "language-russian",
    "topicId": "language-russian-reading",
    "domain": "제2외국어/한문",
    "subject": "러시아어Ⅰ",
    "topic": "시간 안내문 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "안내문에 따르면 토요일의 폐관 시각을 고르세요.",
    "passage": "Библиотека работает с понедельника по пятницу с 9 до 18 часов. В субботу — с 10 до 14 часов. В воскресенье закрыта.",
    "options": [
      "18시",
      "20시",
      "14시",
      "9시",
      "10시"
    ],
    "answerIndex": 2,
    "hint": "В субботу와 до 뒤의 시각을 보세요.",
    "solutionSteps": [
      "토요일을 나타내는 В субботу가 있는 부분을 찾습니다.",
      "с 10 до 14 часов는 10시부터 14시까지라는 뜻입니다.",
      "따라서 토요일 폐관 시각은 14시입니다."
    ],
    "commonMistakes": [
      "평일과 토요일의 운영 시간을 섞지 마세요.",
      "с 뒤의 시작 시각과 до 뒤의 종료 시각을 구분하세요."
    ],
    "optionAnalysis": [
      "18시는 평일의 폐관 시각입니다.",
      "20시라는 정보는 안내문에 없습니다.",
      "토요일인 В субботу 뒤에 до 14 часов가 있어 14시에 문을 닫습니다.",
      "9시는 평일의 개관 시각입니다.",
      "10시는 토요일의 개관 시각입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "도서관은 월요일부터 금요일까지 9시부터 18시까지 운영한다. 토요일에는 10시부터 14시까지 운영한다. 일요일에는 문을 닫는다.",
    "vocabulary": [
      [
        "работать",
        "일하다, 운영하다"
      ],
      [
        "в субботу",
        "토요일에"
      ],
      [
        "до",
        "~까지"
      ],
      [
        "закрыта",
        "닫혀 있는"
      ]
    ],
    "languageCode": "ru",
    "sourceRefs": [
      "https://catalogue.irlc.msu.ru/media-texts-catalogue/all/texts/a2/podruga-i-grammatika"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "러시아어Ⅰ"
  },
  {
    "id": "authored-language-russian-vocabulary",
    "courseId": "language-russian",
    "topicId": "language-russian-vocabulary",
    "domain": "제2외국어/한문",
    "subject": "러시아어Ⅰ",
    "topic": "학습 활동 어휘",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 문장에서 грамматику의 뜻으로 가장 적절한 것을 고르세요.",
    "passage": "После урока я повторяю грамматику.",
    "options": [
      "가격",
      "요일",
      "음식",
      "문법",
      "기차역"
    ],
    "answerIndex": 3,
    "hint": "복습하는 대상이 무엇인지 확인하세요.",
    "solutionSteps": [
      "문장에서 повторяю는 복습한다는 뜻입니다.",
      "그 목적어 грамматику는 문법을 뜻하는 грамматика의 형태입니다.",
      "전체 문장은 수업 후 나는 문법을 복습한다로 풀이합니다."
    ],
    "commonMistakes": [
      "사전의 기본형과 문장 안에서 쓰인 격변화 형태가 다를 수 있음을 확인하세요.",
      "학습을 뜻하는 동사와 그 대상을 함께 연결하세요."
    ],
    "optionAnalysis": [
      "가격은 цена로 제시된 어휘와 다릅니다.",
      "요일은 день недели로 나타내며 грамматику의 뜻이 아닙니다.",
      "음식은 еда 등으로 나타내며 문장에 제시된 학습 대상이 아닙니다.",
      "грамматика는 문법이며 이 문장에서는 동사의 목적어 형태인 грамматику로 쓰였습니다.",
      "기차역은 вокзал로 제시된 어휘와 다릅니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "수업 후 나는 문법을 복습한다.",
    "vocabulary": [
      [
        "после урока",
        "수업 후에"
      ],
      [
        "повторять",
        "복습하다, 반복하다"
      ],
      [
        "грамматика",
        "문법"
      ]
    ],
    "languageCode": "ru",
    "sourceRefs": [
      "https://catalogue.irlc.msu.ru/media-texts-catalogue/all/texts/a2/podruga-i-grammatika"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "러시아어Ⅰ"
  },
  {
    "id": "authored-language-arabic-demonstrative",
    "courseId": "language-arabic",
    "topicId": "language-arabic-demonstrative",
    "domain": "제2외국어/한문",
    "subject": "아랍어Ⅰ",
    "topic": "지시사와 명사의 성",
    "kind": "authored",
    "type": "authored",
    "statement": "이것은 책이다라는 뜻이 되도록 빈칸에 들어갈 지시사를 고르세요.",
    "passage": "___ كتاب.",
    "options": [
      "هذه",
      "هؤلاء",
      "هي",
      "نحن",
      "هذا"
    ],
    "answerIndex": 4,
    "hint": "كتاب에 맞는 남성 단수 지시사를 고르세요.",
    "solutionSteps": [
      "كتاب이 책이라는 뜻의 남성 단수 명사임을 확인합니다.",
      "가까운 남성 단수 대상을 가리키는 지시사는 هذا입니다.",
      "هذا كتاب은 이것은 책이다라는 뜻의 명사문입니다."
    ],
    "commonMistakes": [
      "문법적 성과 실제 사물의 생물학적 성별을 같은 것으로 생각하지 마세요.",
      "지시사와 인칭대명사를 구분하세요."
    ],
    "optionAnalysis": [
      "هذه는 가까운 여성 단수 대상을 가리키는 형태입니다.",
      "هؤلاء는 가까운 복수 대상을 가리키는 형태로 단수 كتاب과 맞지 않습니다.",
      "هي는 그녀 또는 그것을 뜻하는 여성 단수 인칭대명사로 요구한 지시사가 아닙니다.",
      "نحن은 우리를 뜻하는 1인칭 복수 인칭대명사입니다.",
      "هذا는 가까운 남성 단수 대상을 가리키므로 남성 단수 명사 كتاب과 맞습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 이것은 책이다.",
    "vocabulary": [
      [
        "هذا",
        "이것은, 이(남성 단수)"
      ],
      [
        "هذه",
        "이것은, 이(여성 단수)"
      ],
      [
        "كتاب",
        "책"
      ]
    ],
    "languageCode": "ar",
    "sourceRefs": [
      "https://learning.aljazeera.net/en/lessons/level/beginner"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "textDirection": "rtl",
    "courseName": "아랍어Ⅰ"
  },
  {
    "id": "authored-language-arabic-location",
    "courseId": "language-arabic",
    "topicId": "language-arabic-location",
    "domain": "제2외국어/한문",
    "subject": "아랍어Ⅰ",
    "topic": "장소를 묻는 أين",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 질문에 대한 응답으로 가장 적절한 것을 고르세요.",
    "passage": "أ: أين المكتبة؟\nب: ___",
    "options": [
      "المكتبة بجانب المدرسة.",
      "اسمي سامر.",
      "أنا طالب.",
      "اليوم الأحد.",
      "أحب القراءة."
    ],
    "answerIndex": 0,
    "hint": "بجانب은 ~옆에라는 뜻입니다.",
    "solutionSteps": [
      "أين가 장소를 묻는 의문사임을 확인합니다.",
      "المكتبة가 도서관이라는 뜻입니다.",
      "بجانب المدرسة는 학교 옆에라는 위치 정보이므로 정답입니다."
    ],
    "commonMistakes": [
      "장소 의문사 أين와 시각을 묻는 의문사를 혼동하지 마세요.",
      "질문에 나온 명사가 대답에 반복되어도 위치 정보가 있는지 확인하세요."
    ],
    "optionAnalysis": [
      "도서관은 학교 옆에 있다는 위치 설명이므로 질문에 적절합니다.",
      "내 이름은 사메르입니다라는 자기소개입니다.",
      "나는 학생입니다라는 신분 소개입니다.",
      "오늘은 일요일입니다라는 요일 정보입니다.",
      "나는 독서를 좋아합니다라는 기호 표현입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "A: 도서관은 어디에 있나요?\nB: 도서관은 학교 옆에 있어요.",
    "vocabulary": [
      [
        "أين",
        "어디에"
      ],
      [
        "المكتبة",
        "도서관"
      ],
      [
        "بجانب",
        "~옆에"
      ],
      [
        "المدرسة",
        "학교"
      ]
    ],
    "languageCode": "ar",
    "sourceRefs": [
      "https://learning.aljazeera.net/en/lessons/level/beginner"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "textDirection": "rtl",
    "courseName": "아랍어Ⅰ"
  },
  {
    "id": "authored-language-arabic-reading",
    "courseId": "language-arabic",
    "topicId": "language-arabic-reading",
    "domain": "제2외국어/한문",
    "subject": "아랍어Ⅰ",
    "topic": "요일과 활동 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 글에 따르면 사메르가 도서관에 가는 요일은 언제인가요?",
    "passage": "يذهب سامر إلى المدرسة يوم الأحد. ويذهب إلى المكتبة يوم الاثنين.",
    "options": [
      "목요일",
      "월요일",
      "일요일",
      "화요일",
      "수요일"
    ],
    "answerIndex": 1,
    "hint": "المكتبة와 같은 문장에 있는 요일을 찾으세요.",
    "solutionSteps": [
      "도서관을 뜻하는 المكتبة가 있는 문장을 찾습니다.",
      "그 문장에서 요일은 يوم الاثنين입니다.",
      "الاثنين은 월요일이므로 월요일이 정답입니다."
    ],
    "commonMistakes": [
      "학교 المدرسة와 도서관 المكتبة를 구분하세요.",
      "첫 문장과 둘째 문장의 요일을 바꾸어 연결하지 마세요."
    ],
    "optionAnalysis": [
      "목요일에 도서관에 간다는 정보는 없습니다.",
      "도서관 المكتبة와 연결된 요일은 الاثنين, 곧 월요일입니다.",
      "일요일 الأحد는 학교에 가는 날로 제시되었습니다.",
      "화요일에 도서관에 간다는 정보는 없습니다.",
      "수요일에 도서관에 간다는 정보는 없습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "사메르는 일요일에 학교에 간다. 그리고 월요일에 도서관에 간다.",
    "vocabulary": [
      [
        "يذهب",
        "그는 간다"
      ],
      [
        "إلى",
        "~로"
      ],
      [
        "الأحد",
        "일요일"
      ],
      [
        "الاثنين",
        "월요일"
      ]
    ],
    "languageCode": "ar",
    "sourceRefs": [
      "https://learning.aljazeera.net/en/lessons/level/beginner"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "textDirection": "rtl",
    "courseName": "아랍어Ⅰ"
  },
  {
    "id": "authored-language-arabic-vocabulary",
    "courseId": "language-arabic",
    "topicId": "language-arabic-vocabulary",
    "domain": "제2외국어/한문",
    "subject": "아랍어Ⅰ",
    "topic": "장소 명사 이해",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 문장에서 화자가 책을 읽는 장소를 고르세요.",
    "passage": "أنا أقرأ كتابًا في المكتبة.",
    "options": [
      "수영장",
      "식당",
      "도서관",
      "공항",
      "시장"
    ],
    "answerIndex": 2,
    "hint": "في 뒤에 나온 장소 명사를 확인하세요.",
    "solutionSteps": [
      "أقرأ كتابًا는 책을 읽는다는 뜻입니다.",
      "전치사 في 뒤의 المكتبة가 동작이 일어나는 장소입니다.",
      "따라서 장소는 도서관입니다."
    ],
    "commonMistakes": [
      "كتاب은 책이고 المكتبة는 장소를 뜻한다는 차이를 확인하세요.",
      "전치사 في 뒤의 장소 정보를 놓치지 마세요."
    ],
    "optionAnalysis": [
      "수영장을 뜻하는 말은 제시되지 않았습니다.",
      "식당 المطعم이라는 말은 제시되지 않았습니다.",
      "في المكتبة는 도서관에서라는 뜻입니다.",
      "공항을 뜻하는 المطار라는 말은 제시되지 않았습니다.",
      "시장 السوق라는 말은 제시되지 않았습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "나는 도서관에서 책을 읽는다.",
    "vocabulary": [
      [
        "أنا",
        "나"
      ],
      [
        "أقرأ",
        "나는 읽는다"
      ],
      [
        "كتاب",
        "책"
      ],
      [
        "في المكتبة",
        "도서관에서"
      ]
    ],
    "languageCode": "ar",
    "sourceRefs": [
      "https://learning.aljazeera.net/en/lessons/level/beginner"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "textDirection": "rtl",
    "courseName": "아랍어Ⅰ"
  },
  {
    "id": "authored-language-vietnamese-request",
    "courseId": "language-vietnamese",
    "topicId": "language-vietnamese-request",
    "domain": "제2외국어/한문",
    "subject": "베트남어Ⅰ",
    "topic": "원하는 것을 말하기",
    "kind": "authored",
    "type": "authored",
    "statement": "물 한 잔을 원한다는 뜻의 문장을 고르세요.",
    "passage": "카페에서 물 한 잔을 요청하려고 한다.",
    "options": [
      "Hôm nay là thứ Hai.",
      "Tôi đến từ Hàn Quốc.",
      "Tôi thích đọc sách.",
      "Tôi muốn một cốc nước.",
      "Tôi là học sinh."
    ],
    "answerIndex": 3,
    "hint": "muốn 뒤에 물 한 잔을 나타내는 말이 있는지 확인하세요.",
    "solutionSteps": [
      "원하는 것을 말하는 동사 muốn을 찾습니다.",
      "một cốc nước는 물 한 잔이라는 뜻입니다.",
      "Tôi muốn một cốc nước가 제시된 요청 내용과 일치합니다."
    ],
    "commonMistakes": [
      "원하다라는 muốn과 좋아하다라는 thích를 구분하세요.",
      "cốc의 성조·철자를 다른 단어와 혼동하지 마세요."
    ],
    "optionAnalysis": [
      "오늘은 월요일입니다라는 요일 정보입니다.",
      "나는 한국에서 왔습니다라는 출신 정보입니다.",
      "나는 책 읽기를 좋아합니다라는 기호 표현입니다.",
      "나는 물 한 잔을 원합니다라는 뜻이므로 요청 내용과 맞습니다.",
      "나는 학생입니다라는 신분 소개입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "정답 문장: 나는 물 한 잔을 원합니다.",
    "vocabulary": [
      [
        "tôi",
        "나"
      ],
      [
        "muốn",
        "원하다"
      ],
      [
        "một",
        "하나"
      ],
      [
        "một cốc nước",
        "물 한 잔"
      ]
    ],
    "languageCode": "vi",
    "sourceRefs": [
      "https://vov.vn/ko-KR/ibe-chagchag-butneun-beteunameo/51hoe-da-chua-haessseubnikka-2356804.vov"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "베트남어Ⅰ"
  },
  {
    "id": "authored-language-vietnamese-aspect",
    "courseId": "language-vietnamese",
    "topicId": "language-vietnamese-aspect",
    "domain": "제2외국어/한문",
    "subject": "베트남어Ⅰ",
    "topic": "이미 일어난 행동과 đã",
    "kind": "authored",
    "type": "authored",
    "statement": "어제 이미 도서관에 갔다는 뜻을 나타내도록 빈칸에 들어갈 말을 고르세요.",
    "passage": "Hôm qua tôi ___ đến thư viện.",
    "options": [
      "đang",
      "sẽ",
      "rất",
      "và",
      "đã"
    ],
    "answerIndex": 4,
    "hint": "완료된 행동을 나타내는 đã를 떠올려 보세요.",
    "solutionSteps": [
      "Hôm qua가 어제라는 시간 표현임을 확인합니다.",
      "문제는 행동이 이미 이루어졌음을 나타내는 말을 요구합니다.",
      "đã를 넣으면 어제 나는 도서관에 갔다라는 뜻이 됩니다."
    ],
    "commonMistakes": [
      "đã·đang·sẽ를 모두 같은 시제 표지처럼 섞어 쓰지 마세요.",
      "베트남어에서는 시간 표현만으로도 과거를 나타낼 수 있지만 이 문항은 이미 이루어짐을 나타내는 말을 묻습니다."
    ],
    "optionAnalysis": [
      "đang은 진행 중인 행동을 나타내므로 여기서 요구한 이미 이루어진 행동과 다릅니다.",
      "sẽ는 미래의 일을 나타내므로 어제 이미 갔다는 뜻과 맞지 않습니다.",
      "rất는 매우라는 정도 표현으로 이 위치에서 이미 갔다는 뜻을 만들지 않습니다.",
      "và는 그리고라는 접속 표현으로 제시된 문장에 맞지 않습니다.",
      "đã는 이미 일어난 행동을 나타내어 Hôm qua라는 어제의 상황과 맞습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "완성 문장: 어제 나는 도서관에 갔다.",
    "vocabulary": [
      [
        "hôm qua",
        "어제"
      ],
      [
        "đã",
        "이미 이루어진 행동을 나타내는 말"
      ],
      [
        "đến",
        "도착하다, 가다"
      ],
      [
        "thư viện",
        "도서관"
      ]
    ],
    "languageCode": "vi",
    "sourceRefs": [
      "https://vov.vn/ko-KR/ibe-chagchag-butneun-beteunameo/51hoe-da-chua-haessseubnikka-2356804.vov"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "베트남어Ⅰ"
  },
  {
    "id": "authored-language-vietnamese-reading",
    "courseId": "language-vietnamese",
    "topicId": "language-vietnamese-reading",
    "domain": "제2외국어/한문",
    "subject": "베트남어Ⅰ",
    "topic": "요일별 활동 읽기",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 글에 따르면 란이 베트남어를 공부하는 요일을 고르세요.",
    "passage": "Lan học tiếng Việt vào thứ Hai và thứ Tư. Thứ Sáu, Lan chơi cầu lông.",
    "options": [
      "월요일과 수요일",
      "월요일과 금요일",
      "화요일과 목요일",
      "수요일과 토요일",
      "금요일과 일요일"
    ],
    "answerIndex": 0,
    "hint": "học tiếng Việt와 연결된 두 요일을 찾으세요.",
    "solutionSteps": [
      "học tiếng Việt가 베트남어를 공부한다는 뜻임을 확인합니다.",
      "그 활동의 요일이 thứ Hai và thứ Tư입니다.",
      "각각 월요일과 수요일이므로 두 요일을 함께 고릅니다."
    ],
    "commonMistakes": [
      "베트남어 요일의 숫자 순서를 한국어 요일과 단순히 일대일로 연결하지 마세요.",
      "다른 활동인 배드민턴의 금요일을 학습일로 넣지 마세요."
    ],
    "optionAnalysis": [
      "tiếng Việt를 공부하는 날이 thứ Hai와 thứ Tư로 제시되었습니다.",
      "금요일은 배드민턴을 하는 날로 제시되었습니다.",
      "화요일과 목요일은 제시된 학습 요일이 아닙니다.",
      "토요일이라는 학습 정보는 없습니다.",
      "금요일은 배드민턴, 일요일은 글에 없는 정보입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "란은 월요일과 수요일에 베트남어를 공부한다. 금요일에 란은 배드민턴을 친다.",
    "vocabulary": [
      [
        "học tiếng Việt",
        "베트남어를 공부하다"
      ],
      [
        "thứ Hai",
        "월요일"
      ],
      [
        "thứ Tư",
        "수요일"
      ],
      [
        "thứ Sáu",
        "금요일"
      ],
      [
        "chơi cầu lông",
        "배드민턴을 치다"
      ]
    ],
    "languageCode": "vi",
    "sourceRefs": [
      "https://vov.vn/ko-KR/ibe-chagchag-butneun-beteunameo/51hoe-da-chua-haessseubnikka-2356804.vov"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "베트남어Ⅰ"
  },
  {
    "id": "authored-language-vietnamese-vocabulary",
    "courseId": "language-vietnamese",
    "topicId": "language-vietnamese-vocabulary",
    "domain": "제2외국어/한문",
    "subject": "베트남어Ⅰ",
    "topic": "생활 장소 어휘",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 설명에 가장 잘 맞는 장소를 고르세요.",
    "passage": "Ở đây, bạn có thể đọc và mượn sách.",
    "options": [
      "bệnh viện",
      "thư viện",
      "nhà ga",
      "sân bay",
      "nhà hàng"
    ],
    "answerIndex": 1,
    "hint": "읽다·빌리다·책이라는 정보를 함께 연결하세요.",
    "solutionSteps": [
      "đọc는 읽다, mượn은 빌리다라는 뜻입니다.",
      "sách는 책이므로 책을 읽고 빌리는 장소를 찾습니다.",
      "그 장소는 도서관인 thư viện입니다."
    ],
    "commonMistakes": [
      "도서관 thư viện과 병원 bệnh viện에 공통으로 viện이 있다고 같은 뜻으로 보지 마세요.",
      "책이라는 목적어와 읽고 빌리는 두 동작을 함께 확인하세요."
    ],
    "optionAnalysis": [
      "bệnh viện은 병원입니다.",
      "책을 읽고 빌릴 수 있는 도서관을 뜻합니다.",
      "nhà ga는 기차역입니다.",
      "sân bay는 공항입니다.",
      "nhà hàng은 음식점입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "여기에서 당신은 책을 읽고 빌릴 수 있다.",
    "vocabulary": [
      [
        "ở đây",
        "여기에서"
      ],
      [
        "đọc",
        "읽다"
      ],
      [
        "mượn",
        "빌리다"
      ],
      [
        "sách",
        "책"
      ],
      [
        "thư viện",
        "도서관"
      ]
    ],
    "languageCode": "vi",
    "sourceRefs": [
      "https://vov.vn/ko-KR/ibe-chagchag-butneun-beteunameo/51hoe-da-chua-haessseubnikka-2356804.vov"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "courseName": "베트남어Ⅰ"
  },
  {
    "id": "authored-language-hanmun-character",
    "courseId": "language-hanmun",
    "topicId": "language-hanmun-character",
    "domain": "제2외국어/한문",
    "subject": "한문Ⅰ",
    "topic": "한자의 구성과 뜻",
    "kind": "authored",
    "type": "authored",
    "statement": "나무 木 두 개가 결합하여 수풀을 뜻하는 한자를 고르세요.",
    "passage": "木 + 木",
    "options": [
      "信",
      "好",
      "林",
      "明",
      "休"
    ],
    "answerIndex": 2,
    "hint": "木의 개수가 두 개인 글자를 찾으세요.",
    "solutionSteps": [
      "제시된 구성 요소가 나무 木 두 개임을 확인합니다.",
      "木을 좌우로 결합한 글자는 林입니다.",
      "林은 수풀 림으로 제시된 뜻과도 일치합니다."
    ],
    "commonMistakes": [
      "木이 세 개 결합한 森과 木 두 개의 林을 구분하세요.",
      "자형의 일부가 닮았다고 같은 구성의 글자로 보지 마세요."
    ],
    "optionAnalysis": [
      "信은 亻과 言으로 이루어진 믿을 신입니다.",
      "好는 女와 子로 이루어진 좋을 호입니다.",
      "林은 木 두 개로 이루어지며 수풀 림입니다.",
      "明은 日과 月로 이루어진 밝을 명입니다.",
      "休는 사람을 나타내는 亻과 木으로 이루어진 쉴 휴입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "木: 나무 목 / 林: 수풀 림",
    "vocabulary": [
      [
        "木",
        "나무 목"
      ],
      [
        "林",
        "수풀 림"
      ],
      [
        "森",
        "수풀 삼"
      ],
      [
        "明",
        "밝을 명"
      ]
    ],
    "languageCode": "lzh",
    "sourceRefs": [
      "https://dict.revised.moe.edu.tw/dictView.jsp?ID=3634&word=%3D%E6%9E%97"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "readingLanguage": "ko",
    "courseName": "한문Ⅰ"
  },
  {
    "id": "authored-language-hanmun-word-order",
    "courseId": "language-hanmun",
    "topicId": "language-hanmun-word-order",
    "domain": "제2외국어/한문",
    "subject": "한문Ⅰ",
    "topic": "한문 문장의 기본 어순",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 자체 구성 한문 문장의 뜻으로 가장 적절한 것을 고르세요.",
    "passage": "人讀書。",
    "options": [
      "사람이 책을 쓴다.",
      "사람이 책을 버린다.",
      "책이 사람에게 말한다.",
      "사람이 책을 읽는다.",
      "책이 사람을 읽는다."
    ],
    "answerIndex": 3,
    "hint": "읽는 사람과 읽는 대상을 나누어 보세요.",
    "solutionSteps": [
      "人이 사람을 뜻하며 문장의 주어임을 확인합니다.",
      "讀은 읽다이고 書는 그 읽는 대상인 책입니다.",
      "따라서 사람이 책을 읽는다로 풀이합니다."
    ],
    "commonMistakes": [
      "한국어 어순대로 앞뒤 글자만 기계적으로 바꾸지 마세요.",
      "書는 문맥에 따라 쓰다라는 뜻도 있으나 여기에서는 讀의 목적어인 책으로 읽습니다."
    ],
    "optionAnalysis": [
      "讀은 읽다이며 쓰다라는 동사가 아닙니다.",
      "버린다는 뜻을 나타내는 글자가 제시되지 않았습니다.",
      "서술어 讀을 말하다로 바꾸고 주어도 뒤바꾸었습니다.",
      "人이 주어, 讀이 서술어, 書가 목적어이므로 사람이 책을 읽는다입니다.",
      "人과 書의 주어·목적어 관계를 뒤바꾸었습니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "사람이 책을 읽는다.",
    "vocabulary": [
      [
        "人",
        "사람 인"
      ],
      [
        "讀",
        "읽을 독"
      ],
      [
        "書",
        "글 서, 책"
      ]
    ],
    "languageCode": "lzh",
    "sourceRefs": [
      "https://dict.concised.moe.edu.tw/dictView.jsp?ID=43818&la=0&powerMode=0"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "readingLanguage": "ko",
    "courseName": "한문Ⅰ"
  },
  {
    "id": "authored-language-hanmun-idiom",
    "courseId": "language-hanmun",
    "topicId": "language-hanmun-idiom",
    "domain": "제2외국어/한문",
    "subject": "한문Ⅰ",
    "topic": "성어의 의미와 학습",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 성어의 뜻으로 가장 적절한 것을 고르세요.",
    "passage": "溫故知新",
    "options": [
      "새로운 것만 배우고 이전 것은 모두 버린다.",
      "다른 사람의 잘못을 찾아 비난한다.",
      "따뜻한 날씨가 되면 새 옷을 입는다.",
      "아는 것을 숨기고 아무 말도 하지 않는다.",
      "배운 것을 되새겨 새로운 깨달음을 얻는다."
    ],
    "answerIndex": 4,
    "hint": "옛것과 새것의 연결을 생각하세요.",
    "solutionSteps": [
      "故는 이미 배운 옛것, 新은 새로운 것을 가리킵니다.",
      "溫故는 옛 배움을 다시 익히고 되새기는 뜻입니다.",
      "전체적으로 복습을 통해 새로운 깨달음을 얻는다는 의미입니다."
    ],
    "commonMistakes": [
      "溫을 따뜻하다라는 일상적 뜻으로만 읽지 마세요.",
      "故를 사고나 잘못으로 해석하면 성어의 의미를 놓칩니다."
    ],
    "optionAnalysis": [
      "옛 배움을 되새긴다는 溫故의 의미와 반대입니다.",
      "비난이나 잘못 찾기를 뜻하는 성어가 아닙니다.",
      "溫을 기온만으로, 新을 새 옷으로 해석한 것으로 문맥상 맞지 않습니다.",
      "지식을 숨기거나 침묵한다는 뜻이 아닙니다.",
      "故를 옛것, 新을 새것으로 연결하면 기존 배움에서 새로운 앎을 얻는다는 뜻입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "온고지신: 이미 배운 것을 되새겨 새로운 깨달음을 얻음.",
    "vocabulary": [
      [
        "溫",
        "익힐 온, 따뜻할 온"
      ],
      [
        "故",
        "옛 고"
      ],
      [
        "知",
        "알 지"
      ],
      [
        "新",
        "새 신"
      ]
    ],
    "languageCode": "lzh",
    "sourceRefs": [
      "https://dict.concised.moe.edu.tw/dictView.jsp?ID=43818&la=0&powerMode=0"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "readingLanguage": "ko",
    "courseName": "한문Ⅰ"
  },
  {
    "id": "authored-language-hanmun-negation",
    "courseId": "language-hanmun",
    "topicId": "language-hanmun-negation",
    "domain": "제2외국어/한문",
    "subject": "한문Ⅰ",
    "topic": "부정어 不의 기능",
    "kind": "authored",
    "type": "authored",
    "statement": "다음 자체 구성 문장에서 不의 기능으로 가장 적절한 것을 고르세요.",
    "passage": "我不知。",
    "options": [
      "뒤의 知를 부정한다.",
      "문장의 주어 我를 나타낸다.",
      "두 대상을 나란히 연결한다.",
      "과거의 시점만을 나타낸다.",
      "질문을 끝맺는 의문 어조사이다."
    ],
    "answerIndex": 0,
    "hint": "不 뒤의 서술어 知와 연결해 보세요.",
    "solutionSteps": [
      "我는 나, 知는 알다라는 뜻임을 확인합니다.",
      "知 앞의 不가 알다라는 서술 내용을 부정합니다.",
      "문장 전체는 나는 알지 못한다로 풀이합니다."
    ],
    "commonMistakes": [
      "不를 시제 표시로 생각하지 마세요.",
      "부정의 대상이 뒤에 오는 서술어라는 점을 확인하세요."
    ],
    "optionAnalysis": [
      "不는 知 앞에서 알다를 부정하여 알지 못하다라는 뜻을 만듭니다.",
      "주어는 我이며 不가 주어를 대신하는 것은 아닙니다.",
      "연결 기능이 아니라 뒤 서술 내용을 부정하는 기능입니다.",
      "不 자체가 과거 시점을 표시하는 말은 아닙니다.",
      "이 문장의 不는 의문 어조사가 아니라 부정어입니다."
    ],
    "difficulty": "기본",
    "points": 2,
    "sourceLabel": "자체 구성 기초 언어 연습",
    "generationBasis": "기초 언어 연습",
    "verified": false,
    "translation": "나는 알지 못한다.",
    "vocabulary": [
      [
        "我",
        "나 아"
      ],
      [
        "不",
        "아니 불"
      ],
      [
        "知",
        "알 지"
      ]
    ],
    "languageCode": "lzh",
    "sourceRefs": [
      "https://dict.concised.moe.edu.tw/dictView.jsp?ID=43818&la=0&powerMode=0"
    ],
    "contentNote": "문장·지문·선택지와 해설은 학습용으로 자체 작성했습니다. 실제 수능 기출 문항이나 출제 기관의 공식 해설이 아닙니다.",
    "readingLanguage": "ko",
    "courseName": "한문Ⅰ"
  }
];
export const AUTHORED_QUESTIONS=[...BASE_AUTHORED_QUESTIONS,...APPLIED_QUESTIONS];
export const CONTENT_SOURCES=[
  {
    "title": "2027학년도 수능 공식 과목 범위",
    "url": "https://cdn2.kice.re.kr/27dae-suneung/index.html",
    "scope": "과목 범위 확인. 자체 문항의 정답 근거는 각 문항에 제시한 조건과 풀이."
  },
  {
    "title": "국립국어원 표준 발음법",
    "url": "https://korean.go.kr/kornorms/m/m_regltn.do?regltn_code=0002",
    "scope": "비음화의 기본 원리 확인."
  },
  {
    "title": "한국교육과정평가원 · 2027학년도 수능 이렇게 준비하세요(교육청 배포본)",
    "url": "https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/a9620d369e3d03ffaa7e1e2b0a069a0f.pdf",
    "scope": "교과 범위 근거: 사회탐구의 윤리·지리·역사·사회 과목 구분과 기본 개념·원리 학습 방향. 개별 자체 문항의 정답을 공식 검증했다는 뜻은 아님.",
    "kind": "curriculum",
    "relatedUrls": [
      "https://mods.go.kr/board.es?act=view&bid=3246&list_no=161974&mid=a10502010000&nPage=1&ref_bid=&tag="
    ]
  },
  {
    "title": "국사편찬위원회 우리역사넷 및 공공 역사 기록",
    "url": "https://contents.history.go.kr/front/ta/view.do?levelId=ta_h71_0040_0020_0020_0020",
    "scope": "세부 개념 근거: 고려 광종·갑오개혁·임진왜란·메이지 유신. 세계사는 아래 관련 공공 기록을 개별 문항에 연결.",
    "kind": "concept",
    "relatedUrls": [
      "https://contents.history.go.kr/front/hm/print.do?levelId=hm_133_0010",
      "https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_40&levelId=kc_i401703",
      "https://www.legifrance.gouv.fr/Droit-francais/Constitution/Declaration-des-Droits-de-l-Homme-et-du-Citoyen-de-1789",
      "https://blog.sciencemuseum.org.uk/steaming-through-the-centuries/",
      "https://www.unesco.org/en/memory-world/42-line-gutenberg-bible-printed-vellum-and-its-contemporary-documentary-background",
      "https://history.state.gov/milestones/1945-1952/kennan"
    ]
  },
  {
    "title": "한국학중앙연구원 한국민족문화대백과사전 · 윤리학 및 EBS 윤리 교육",
    "url": "https://encykorea.aks.ac.kr/Article/E0042306",
    "scope": "세부 개념 참고: 칸트·공리주의·아리스토텔레스, 공자·맹자·순자 관련 항목. EBS 강좌 목차는 롤스·싱어 등의 교과 학습 범위 참고이며 강의 내용을 복제하지 않음. 기관의 문항 감수·공식 해설을 의미하지 않음.",
    "kind": "concept",
    "relatedUrls": [
      "https://encykorea.aks.ac.kr/Article/E0041280",
      "https://encykorea.aks.ac.kr/Article/E0018079",
      "https://encykorea.aks.ac.kr/Article/E0029416",
      "https://www.ebsi.co.kr/ebs/lms/player/retrieveLmsPlayerHtml5.ebs?lecGbn=V500&lessonId=LS100030061949&sbjtId=S20240000793&sbjtapplyId="
    ]
  },
  {
    "title": "국토지리정보원 대한민국 국가지도집",
    "url": "https://nationalatlas.ngii.go.kr/pages/page_1227.php",
    "scope": "세부 개념 참고: 한반도 기후 요인·지형. 세계 기후는 교과 기본 개념으로 자체 구성했으며 관련 국립생태원 자료를 추가 참고.",
    "kind": "concept",
    "relatedUrls": [
      "https://nationalatlas.ngii.go.kr/pages/page_4039.php",
      "https://nationalatlas.ngii.go.kr/pages/page_4040.php",
      "https://www.nie.re.kr/nie/cmmn/file/fileDown.do?atchFileId=MFILE_0005BW807pC34Rg&fileSn=1"
    ],
    "retrievalNote": "검색에 수록된 공식 본문에서 확인했으나 일부 페이지 직접 열기는 검색 도구에서 오류가 발생함."
  },
  {
    "title": "한국은행 · 고등학생 경제이야기 따라잡기",
    "url": "https://www.bok.or.kr/portal/bbs/B0000216/view.do?listType=G&menuNo=200647&nttId=165601&pageIndex=1",
    "scope": "세부 개념 학습 참고: 수요·공급·기회비용 등. 모든 수치와 가상 조건은 자체 작성했고 계산은 별도로 재검산. 비교우위는 KDI 경제개념 자료를 추가 연결.",
    "kind": "concept",
    "relatedUrls": [
      "https://eiec.kdi.re.kr/material/conceptList.do?idx=153"
    ]
  },
  {
    "title": "국가법령정보센터 · 대한민국헌법",
    "url": "https://www.law.go.kr/lsInfoP.do?lsiSeq=61603&viewCls=engLsInfoR",
    "scope": "세부 개념 근거: 국민 주권·권력 분립·기본권의 기초. 선거 의석 계산은 현행 선거법 설명이 아닌 명시된 가상 규칙만 적용.",
    "kind": "concept",
    "relatedUrls": [
      "https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1027547733"
    ]
  },
  {
    "title": "OpenStax · College Physics 2e",
    "url": "https://openstax.org/books/college-physics-2e/pages/index",
    "scope": "뉴턴 법칙·운동량·원운동·전기용량·전자기 유도·회로·부력·파동 등 교과 물리 원리와 계산 관계 검토. 수치와 문항은 자체 구성.",
    "additionalUrls": [
      "https://openstax.org/books/college-physics-2e/pages/4-section-summary",
      "https://openstax.org/books/college-physics-2e/pages/8-3-conservation-of-momentum",
      "https://openstax.org/books/college-physics-2e/pages/19-5-capacitors-and-dielectrics",
      "https://openstax.org/books/college-physics-2e/pages/23-2-faradays-law-of-induction-lenzs-law",
      "https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits",
      "https://openstax.org/books/college-physics-2e/pages/6-6-satellites-and-keplers-laws-an-argument-for-simplicity"
    ]
  },
  {
    "title": "OpenStax · Chemistry 2e",
    "url": "https://openstax.org/books/chemistry-2e/pages/index",
    "scope": "물질의 양·이온·몰 농도·기체·평형·열화학 개념 검토. 기체 상수와 질량 염분 정의 등 계산 조건은 문항에 명시.",
    "additionalUrls": [
      "https://openstax.org/books/chemistry-2e/pages/3-3-molarity",
      "https://openstax.org/books/chemistry-2e/pages/13-2-equilibrium-constants"
    ]
  },
  {
    "title": "OpenStax · Biology 2e",
    "url": "https://openstax.org/books/biology-2e/pages/index",
    "scope": "분리 법칙·항상성·에너지 전달·전사·세포 호흡·유전자 빈도·광합성 원리 검토.",
    "additionalUrls": [
      "https://openstax.org/books/biology-2e/pages/19-1-population-evolution",
      "https://openstax.org/books/biology-2e/pages/15-2-prokaryotic-transcription",
      "https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis"
    ]
  },
  {
    "title": "USGS · Understanding plate motions",
    "url": "https://pubs.usgs.gov/gip/dynamic/understanding.html",
    "scope": "해령의 발산 경계와 새로운 해양 지각 형성 원리 검토. 광물 굳기 문항은 제시한 상대 비교 조건에서 추론."
  },
  {
    "title": "한국산업인력공단 NCS · 문제해결능력 학습 안내",
    "url": "https://www.ncs.go.kr/th03/TH0302View.do?fileSeq=202112311008084797E8SRnWk",
    "scope": "직업기초능력 학습 범주와 문제 해결·계획·자원 관리 관점 확인. 도면·회계·유통·재고·위치 읽기 문항은 자체 제시 조건과 일반 교과 개념으로 구성하며 법규·자격 판정 근거로 사용하지 않음."
  },
  {
    "title": "농촌진흥청 · 토양검정과 비료 적정 사용",
    "url": "https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=1731",
    "scope": "토양검정의 pH·양분 등 항목 구분 확인. 발아 문항은 실험 변인 통제 연습이며 구체 영농 처방이 아님."
  },
  {
    "title": "OpenStax · Psychology 2e, Lifespan Development",
    "url": "https://openstax.org/books/psychology-2e/pages/9-3-stages-of-development",
    "scope": "신체·운동 발달의 일반적 경향과 개인차, 대근육·소근육, 피아제 동화·조절 개념 검토. 임상 평가나 개인별 발달 진단용이 아님.",
    "additionalUrls": [
      "https://openstax.org/books/psychology-2e/pages/9-2-lifespan-theories"
    ]
  },
  {
    "title": "괴테 인스티투트 Deutsch Online A1 어휘집",
    "url": "https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18.pdf",
    "scope": "독일어 A1 기초 어휘와 의사소통 범위 참고. 문항 지문·보기는 자체 작성."
  },
  {
    "title": "TV5MONDE 프랑스어 문법 학습",
    "url": "https://apprendre.tv5monde.com/fr/aides/grammaire",
    "scope": "프랑스어 초급 문법과 생활 표현 참고. 원문 연습문제를 복제하지 않음."
  },
  {
    "title": "스페인 왕립학술원 RAE: ser",
    "url": "https://dle.rae.es/ser",
    "scope": "ser의 뜻과 활용 정보 참고."
  },
  {
    "title": "스페인 왕립학술원 RAE: desayuno",
    "url": "https://dle.rae.es/desayuno",
    "scope": "desayuno의 기초 의미 확인."
  },
  {
    "title": "대만 교육부 중편국어사전: 本",
    "url": "https://dict.revised.moe.edu.tw/dictView.jsp?ID=269&la=0&powerMode=0",
    "scope": "本이 책·공책의 수량을 세는 양사라는 설명 참고."
  },
  {
    "title": "일본국제교류기금 이로도리 문법 노트",
    "url": "https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf",
    "scope": "정확한 시간과 조사 に, 위치·허락 표현 등 초급 문법 참고."
  },
  {
    "title": "모스크바국립대학교 러시아어문화연구소 학습 자료",
    "url": "https://catalogue.irlc.msu.ru/media-texts-catalogue/all/texts/a2/podruga-i-grammatika",
    "scope": "Я изучаю русский язык 문형과 초급 독해 학습 범위 참고. 글 전체는 복제하지 않음."
  },
  {
    "title": "알자지라 아랍어 교육: Beginner",
    "url": "https://learning.aljazeera.net/en/lessons/level/beginner",
    "scope": "표준 아랍어 초급 일상 의사소통 학습 범위 참고."
  },
  {
    "title": "베트남국영방송 VOV: Đã ~ chưa 표현 학습",
    "url": "https://vov.vn/ko-KR/ibe-chagchag-butneun-beteunameo/51hoe-da-chua-haessseubnikka-2356804.vov",
    "scope": "đã의 이미 이루어진 행동 표현과 기초 요일·수량 표현 참고."
  },
  {
    "title": "대만 교육부 중편국어사전: 林",
    "url": "https://dict.revised.moe.edu.tw/dictView.jsp?ID=3634&word=%3D%E6%9E%97",
    "scope": "林의 자형과 수풀이라는 뜻 확인."
  },
  {
    "title": "대만 교육부 국어사전: 溫故知新",
    "url": "https://dict.concised.moe.edu.tw/dictView.jsp?ID=43818&la=0&powerMode=0",
    "scope": "온고지신의 고전적 의미 확인. 성어 자체는 공공영역의 고전 표현."
  }
];
