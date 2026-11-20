export const SUBJECT_GROUPS=[
 {id:'국어',short:'국',color:'korean',description:'독서·문학과 화법·작문·언어·매체'},
 {id:'수학',short:'수',color:'math',description:'공통 수학과 확률과 통계·미적분·기하'},
 {id:'영어',short:'A',color:'english',description:'독해·어법·지문 해석과 핵심 어휘'},
 {id:'한국사',short:'史',color:'history',description:'시대 흐름과 제도·사료의 의미'},
 {id:'사회탐구',short:'사',color:'social',description:'윤리·지리·역사·경제·정치·사회'},
 {id:'과학탐구',short:'과',color:'science',description:'물리학·화학·생명과학·지구과학 Ⅰ·Ⅱ'},
 {id:'직업탐구',short:'직',color:'vocation',description:'직업생활·농업·공업·상업·해운·발달'},
 {id:'제2외국어/한문',short:'言',color:'language',description:'8개 외국어와 한문·전체 해석·어휘'}
];
const groups=[
 ['국어',[['korean-common','공통: 독서·문학'],['korean-speech','화법과 작문'],['korean-language','언어와 매체']]],
 ['수학',[['math-common','공통: 수학Ⅰ·수학Ⅱ'],['math-statistics','확률과 통계'],['math-calculus','미적분'],['math-geometry','기하']]],
 ['영어',[['english','영어']]],['한국사',[['korean-history','한국사']]],
 ['사회탐구',[['social-life-ethics','생활과 윤리'],['social-ethics','윤리와 사상'],['social-korea-geography','한국지리'],['social-world-geography','세계지리'],['social-east-history','동아시아사'],['social-world-history','세계사'],['social-economics','경제'],['social-politics','정치와 법'],['social-culture','사회·문화']]],
 ['과학탐구',[['science-physics1','물리학Ⅰ'],['science-chemistry1','화학Ⅰ'],['science-biology1','생명과학Ⅰ'],['science-earth1','지구과학Ⅰ'],['science-physics2','물리학Ⅱ'],['science-chemistry2','화학Ⅱ'],['science-biology2','생명과학Ⅱ'],['science-earth2','지구과학Ⅱ']]],
 ['직업탐구',[['vocation-career','성공적인 직업생활'],['vocation-agriculture','농업 기초 기술'],['vocation-industry','공업 일반'],['vocation-commerce','상업 경제'],['vocation-marine','수산·해운 산업 기초'],['vocation-development','인간 발달']]],
 ['제2외국어/한문',[['language-german','독일어Ⅰ'],['language-french','프랑스어Ⅰ'],['language-spanish','스페인어Ⅰ'],['language-chinese','중국어Ⅰ'],['language-japanese','일본어Ⅰ'],['language-russian','러시아어Ⅰ'],['language-arabic','아랍어Ⅰ'],['language-vietnamese','베트남어Ⅰ'],['language-hanmun','한문Ⅰ']]]
];
export const COURSES=groups.flatMap(([domain,rows])=>rows.map(([id,label])=>({id,label,domain,scopeYear:2027,common:id.endsWith('-common')})));
export const courseById=id=>COURSES.find(c=>c.id===id);
export const courseForDomain=domain=>COURSES.find(c=>c.domain===domain);
export const normalizeDomain=s=>({'언어':'국어','수리':'수학','외국어':'영어','제2외국어':'제2외국어/한문'}[s]||s);
const compact=s=>String(s).normalize('NFKC').replace(/[\s·ㆍ_()]/g,'').toLowerCase();
export function resourceMatchesCourse(resource,courseId){const c=courseById(courseId);if(!c)return true;if(normalizeDomain(resource.domain)!==c.domain)return false;if(['국어','수학','영어','한국사'].includes(c.domain))return true;const name=compact(resource.name),label=compact(c.label);if(name.includes(label))return true;if(resource.year<2027&&(/zip/i.test(resource.name)||name.includes(compact(resource.domain))))return true;return false;}
export const CATALOG_SOURCES=[
 {title:'2027학년도 수능 공식 문제·정답 과목 목록',url:'https://cdn2.kice.re.kr/27dae-suneung/index.html',scope:'영역과 탐구·제2외국어/한문 과목 목록 확인. 자체 구성 문항의 공식 해설 출처를 뜻하지 않음.'},
 {title:'2027학년도 수능 Q&A 자료집',url:'https://www.ice.go.kr/upload/ice/na/bbs_1482/2026/04/b38c68a1f07bfba215f2107e1e040910.pdf',scope:'공통·선택과목 구조와 과목 범위 확인.'}
];
