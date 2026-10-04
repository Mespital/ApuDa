/* ApuDa 길잡이 — 모든 층·모든 사이트 공용 통합 도우미 (v1.0, 2026-10-04)
 * 사용: <script src="https://apuda.app/assets/apuda-bot.js" data-context="home" defer></script>
 *   data-context : home | mini | faq | drugs | biomarkers | map | note | news | about | cancercheck | checkup | support | care | pet | farm | (생략 시 경로로 자동 판단)
 *   data-launcher: "none" 이면 떠 있는 버튼을 숨김 (window.ApudaBot.open() 으로 열기)
 *   data-pos     : "left" 이면 왼쪽 아래
 * 원칙: 진단·처방하지 않음 / 위기(자해) → 응급 → 안내 순서 / 서버 전송 없음(기기 안 규칙 기반)
 */
(function(){
'use strict';
if(window.ApudaBot)return;
var BASE=(function(){try{var s=document.currentScript&&document.currentScript.src;if(s&&/^https?:/.test(s)){var u=new URL(s);if(u.host!==location.host)return u.origin}}catch(e){}return ''})();
var SCRIPT=document.currentScript||{};
var DS=(SCRIPT.dataset)||{};
function A(p){return /^https?:/.test(p)?p:BASE+p}

/* ── 사이트 지도 ── */
var SITES=[
 {id:'home',fl:'',ico:'🏢',name:'ApuDa 홈 (5층 빌딩)',url:'/',desc:'층을 눌러 필요한 서비스로 이동',kw:['홈','처음','메인','빌딩','첫화면']},
 {id:'about',fl:'',ico:'💡',name:'ApuDa 소개·사용법',url:'/about/',desc:'ApuDa.app이 무엇인지, 층별로 무엇을 하는지',kw:['소개','사용법','어떤곳','뭐하는','apuda가','아프다가','이용방법','도움말']},
 {id:'cancercheck',fl:'1F',ico:'🧭',name:'암 위험도 체크',url:'https://apuda-cancercheck.netlify.app/',ext:1,desc:'생활습관과 주요 위험요인을 3분 만에 확인',kw:['위험도','위험요인','가능성','자가진단','암일까','걸릴','예방']},
 {id:'checkup',fl:'1F',ico:'🩺',name:'건강검진 선택 항목',url:'https://apuda-check.netlify.app/',ext:1,desc:'기본검진 외 추가로 고려할 검사 정리',kw:['검진','건강검진','종합검진','선택항목','추가검사','국가검진','내시경검사']},
 {id:'library',fl:'2F',ico:'📚',name:'암 정보 서재 (12종 가이드북)',url:'/#floor-2',desc:'암종별 첫 30일 책·FAQ·완전판',kw:['서재','가이드북','책','첫30일','첫 30일','미니','웹북','도서']},
 {id:'map',fl:'2F',ico:'🗺️',name:'치료결정 지도',url:'/library/treatment-map/',desc:'왜 사람마다 치료가 다른지, 암종별 6단계',kw:['치료결정','치료지도','치료순서','치료과정','병기','어떤치료','치료방법']},
 {id:'drugs',fl:'2F',ico:'💊',name:'항암제 Drug Hub',url:'/library/drugs/',desc:'약 기전·부작용·공급상태·최근 뉴스',kw:['항암제','약정보','약이름','부작용','공급부족','품절','표적치료제','면역항암제','drug']},
 {id:'markers',fl:'2F',ico:'🧬',name:'바이오마커 Navigator',url:'/library/biomarkers/',desc:'왜 이 검사를 하는지, 결과와 치료의 연결',kw:['바이오마커','유전자검사','유전자','ngs','변이','표지자','검사결과','결과지']},
 {id:'comic',fl:'2F',ico:'🖼️',name:'4컷 만화 암 정보',url:'https://product.kyobobook.co.kr/detail/S000219012641',ext:1,desc:'검사·병기·치료를 그림으로 쉽게',kw:['만화','4컷','그림으로']},
 {id:'support',fl:'3F',ico:'🤝',name:'암 환자 지원 정보',url:'https://apuda-support.netlify.app/',ext:1,desc:'산정특례·의료비·지원제도',kw:['산정특례','의료비','지원','지원금','치료비','비용','돈','보험','재난적','본인부담','장애','복지','휴직']},
 {id:'note',fl:'4F',ico:'📘',name:'암환자 노트',url:'/note/',desc:'말하듯 쓰면 정리 · 위험 신호 안내 · 진료요약',kw:['노트','기록','일지','체온','증상기록','일정','복약','약기록','진료요약','다이어리','수첩']},
 {id:'care',fl:'4F',ico:'🩹',name:'ApuDa Care (일상 건강)',url:'/care/',desc:'일반질환·예방접종·생활 건강',kw:['케어','감기','예방접종','백신','일반질환','생활건강']},
 {id:'cafe',fl:'5F',ico:'💬',name:'ApuDa 카페 (커뮤니티)',url:'https://cafe.naver.com/2ndpart',ext:1,desc:'환자·보호자 경험 나누기',kw:['카페','커뮤니티','후기','경험','모임','소통','다른환자','이야기']},
 {id:'news',fl:'',ico:'📰',name:'오늘의 뉴스 브리핑',url:'/news/',desc:'제약·헬스케어 뉴스',kw:['뉴스','브리핑','소식','기사']},
 {id:'oncnews',fl:'',ico:'🎗️',name:'항암제·암 뉴스',url:'/news/oncology/',desc:'허가·급여·임상·바이오마커 변화',kw:['항암제뉴스','신약','허가','급여','임상','승인']},
 {id:'pet',fl:'Family',ico:'🐾',name:'ApuDa.pet',url:'/pet/',desc:'반려동물 건강',kw:['반려','강아지','고양이','펫','반려동물']},
 {id:'farm',fl:'Family',ico:'🐄',name:'ApuDa.farm',url:'/farm/',desc:'축산 동물 건강',kw:['축산','농장','소','돼지','닭','가축']},
 {id:'my',fl:'',ico:'👤',name:'My ApuDa (로그인)',url:'https://my.apuda.app/my',ext:1,desc:'ApuDa ID 개인 건강기록',kw:['로그인','회원','마이','my','내계정','가입']}
];
var SITE=Object.fromEntries(SITES.map(function(s){return [s.id,s]}));
var CANCER=[['breast','유방암',['유방']],['lung','폐암',['폐']],['stomach','위암',['위암']],['colorectal','대장암',['대장','직장암','결장암','직장']],['thyroid','갑상선암',['갑상선','갑상샘']],['kidney','신장암',['신장','콩팥','신세포']],['prostate','전립선암',['전립선']],['pancreas','췌장암',['췌장']],['biliary','담도암',['담도','담관','담낭']],['liver','간암',['간암','간세포']],['lymphoma','림프종',['림프']],['cervical','자궁경부암',['자궁경부']]];

/* ── 페이지별 설정 ── */
function detect(){
  if(DS.context)return DS.context;var p=location.pathname,h=location.host;
  if(/cancercheck/.test(h))return 'cancercheck';if(/apuda-check/.test(h))return 'checkup';if(/support/.test(h))return 'support';
  if(/^\/note/.test(p))return 'note';if(/\/library\/mini/.test(p))return 'mini';if(/\/library\/faq/.test(p))return 'faq';
  if(/\/library\/drugs/.test(p))return 'drugs';if(/\/library\/biomarkers/.test(p))return 'biomarkers';if(/treatment-map/.test(p))return 'map';
  if(/^\/news/.test(p))return 'news';if(/^\/about/.test(p))return 'about';if(/^\/care/.test(p))return 'care';if(/^\/pet/.test(p))return 'pet';if(/^\/farm/.test(p))return 'farm';
  return 'home';
}
var CTX=detect();
function curCancer(){var q=new URLSearchParams(location.search).get('cancer');return CANCER.find(function(c){return c[0]===q})}
var CONF={
 home:{t:'ApuDa 길잡이',g:'안녕하세요, <b>ApuDa 길잡이</b>예요. 지금 필요한 것을 말씀하시면 맞는 층으로 바로 안내해 드려요.',chips:[['🎗️ 내 암종 정보','암종 고르기'],['📖 진단 첫 30일 책','첫 30일 책'],['📘 체온·증상 기록','노트'],['💰 치료비 지원','치료비 지원'],['🚨 응급 증상','응급'],['💡 ApuDa 소개','ApuDa 소개']]},
 about:{t:'ApuDa 길잡이',g:'궁금한 서비스를 말씀하시면 사용법을 알려드리고 바로 데려다 드려요.',chips:[['🏢 층별 안내','전체 메뉴'],['🎗️ 내 암종 정보','암종 고르기'],['📘 노트 사용법','노트 사용법'],['💊 약 찾기','항암제']]},
 mini:{t:'무료 웹북 도우미',g:function(){var c=curCancer();return '<b>'+(c?c[1]+' ':'')+'첫 30일 웹북</b>을 보고 계세요. 왼쪽(모바일은 위) 목차로 이동하고, PDF는 상단 <b>⬇ 다운로드</b>에서 코드를 넣으면 받을 수 있어요.'},chips:[['⬇ 다운로드 방법','다운로드 방법'],['❓ 이 암 FAQ','이 암 FAQ'],['🗺️ 이 암 치료결정 지도','이 암 치료지도'],['💊 관련 항암제','이 암 약'],['📚 다른 암종 책','다른 암종 책']]},
 faq:{t:'FAQ 도우미',g:'질문을 눌러 펼쳐 보세요. 진료 때 물어볼 질문은 <b>노트에 저장</b>해 두면 진료요약에 모여요.',chips:[['📖 첫 30일 책 읽기','이 암 책'],['🗺️ 치료결정 지도','이 암 치료지도'],['📘 질문 노트에 저장','질문 저장 방법']]},
 drugs:{t:'Drug Hub 도우미',g:'<b>약 이름을 그대로</b> 써 주세요(상품명·성분명 모두 OK). 기전·부작용·공급상태·뉴스를 바로 보여드려요.',chips:[['🔎 예: 키트루다','키트루다'],['📦 공급부족 표시란?','공급부족이란'],['🧬 바이오마커 보기','바이오마커'],['📘 내 약 노트에 기록','약 기록 방법']]},
 biomarkers:{t:'바이오마커 도우미',g:'검사 이름(EGFR, HER2, PD-L1, MSI…)을 쓰시면 그 검사가 왜 필요한지와 관련 약으로 연결해 드려요.',chips:[['🔎 예: HER2','HER2'],['📄 결과지 읽는 법','결과지 읽는 법'],['🗺️ 치료결정 지도','치료결정 지도']]},
 map:{t:'치료결정 지도 도우미',g:'위쪽 표지를 눌러 암종을 바꿀 수 있어요. 오른쪽 <b>진료실 질문 3가지</b>는 노트에 저장해 진료 때 꺼내 보세요.',chips:[['🎗️ 암종 바꾸기','암종 고르기'],['💊 이 암 관련 약','이 암 약'],['📘 질문 노트에 저장','질문 저장 방법']]},
 note:{t:'ApuDa 길잡이',g:'노트 기록은 아래 입력창(노트봇)에 쓰시면 돼요. 저는 <b>다른 층·서비스로 이동</b>과 사용법을 도와드려요.',chips:[['📘 노트 사용법','노트 사용법'],['🚨 응급 판단','응급'],['🎗️ 내 암종 정보','암종 고르기'],['🏢 다른 층으로','전체 메뉴']]},
 news:{t:'뉴스 도우미',g:'뉴스에 나온 약이나 검사가 궁금하면 이름을 써 주세요. Drug Hub·바이오마커로 연결해 드려요.',chips:[['🎗️ 항암제 뉴스','항암제 뉴스'],['💊 약 찾아보기','항암제'],['🧬 검사 찾아보기','바이오마커']]},
 cancercheck:{t:'ApuDa 길잡이',g:'위험도 결과는 <b>진단이 아니에요</b>. 결과가 걱정되면 검진 항목을 확인하고 가까운 의료기관과 상의하세요.',chips:[['🩺 건강검진 선택 항목','건강검진'],['📚 암종별 정보','암종 고르기'],['🏢 ApuDa 홈','홈']]},
 checkup:{t:'ApuDa 길잡이',g:'검진 항목은 나이·가족력·생활습관에 따라 달라요. 국가검진 대상인지 먼저 확인하세요.',chips:[['🧭 암 위험도 체크','위험도'],['📚 암종별 정보','암종 고르기'],['🏢 ApuDa 홈','홈']]},
 support:{t:'ApuDa 길잡이',g:'지원제도는 자주 바뀌어요. 정확한 조건은 병원 사회사업실·건강보험공단에 확인하세요.',chips:[['📘 비용·서류 기록','노트'],['💬 다른 환자 경험','카페'],['🏢 ApuDa 홈','홈']]},
 care:{t:'ApuDa 길잡이',g:'일상 건강은 Care에서, 암 치료 기록은 <b>암환자 노트</b>에서 관리하세요.',chips:[['📘 암환자 노트','노트'],['🏢 ApuDa 홈','홈']]},
 pet:{t:'ApuDa 길잡이',g:'ApuDa 패밀리의 다른 서비스로도 이동할 수 있어요.',chips:[['🏢 ApuDa 홈','홈'],['💡 ApuDa 소개','ApuDa 소개']]},
 farm:{t:'ApuDa 길잡이',g:'ApuDa 패밀리의 다른 서비스로도 이동할 수 있어요.',chips:[['🏢 ApuDa 홈','홈'],['💡 ApuDa 소개','ApuDa 소개']]}
};
var C=CONF[CTX]||CONF.home;

/* ── 안전 ── */
var CRISIS=['죽고싶','죽고파','자살','살기싫','사라지고싶','끝내고싶','자해','없어지고싶','죽어버리','살고싶지않','살아서뭐'];
var EMERG=['숨이차','숨이막','숨쉬기','호흡곤란','피를토','토혈','의식','쓰러','경련','말이어눌','가슴이조','가슴통증','입술이파','얼굴이부','혈변','검은변','응급','119'];

/* ── 데이터 (약·바이오마커) 지연 로드 ── */
var ONC=null;
function loadOnc(){if(window.APUDA_ONC){ONC=window.APUDA_ONC;return Promise.resolve(ONC)}
  return new Promise(function(res){var s=document.createElement('script');s.src=A('/library/assets/onco-data.js');s.onload=function(){ONC=window.APUDA_ONC||null;res(ONC)};s.onerror=function(){res(null)};document.head.appendChild(s)})}
loadOnc();

/* ── 응답 만들기 ── */
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'')}
function link(url,label,primary){var ext=/^https?:/.test(url)&&url.indexOf(location.origin)!==0&&!(BASE&&url.indexOf(BASE)===0);return '<a class="'+(primary?'go p':'go')+'" href="'+esc(/^\//.test(url)?A(url):url)+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+esc(label)+(ext?' ↗':' →')+'</a>'}
function siteCard(s){return '<div class="site"><div class="si">'+s.ico+'</div><div class="sb"><b>'+(s.fl?'<em>'+s.fl+'</em> ':'')+esc(s.name)+'</b><small>'+esc(s.desc)+'</small></div>'+link(s.url,'열기')+'</div>'}
function q(label,text){return '<button class="qb" data-say="'+esc(text||label)+'">'+esc(label)+'</button>'}
function cancerCard(c){var s=c[0],n=c[1];return '<b>'+n+'</b> 관련해서 이렇게 볼 수 있어요.<div class="links">'+
  link('/library/mini/?cancer='+s,'📖 암진단 후 첫 30일 - '+n,true)+link('/library/faq/?cancer='+s,'❓ '+n+' FAQ')+link('/library/treatment-map/?cancer='+s,'🗺️ '+n+' 치료결정 지도')+link('/library/drugs/?cancer='+s,'💊 '+n+' 관련 항암제')+link('/library/biomarkers/?cancer='+s,'🧬 '+n+' 관련 바이오마커')+'</div>'}
function cancerPicker(){return '어떤 암종을 볼까요?<div class="qr">'+CANCER.map(function(c){return q(c[1])}).join('')+'</div>'}
function menu(){var groups=[['1F 확인센터',['cancercheck','checkup']],['2F 암 정보 서재',['library','map','drugs','markers','comic']],['3F 지원',['support']],['4F 치료 동행',['note','care']],['5F 커뮤니티',['cafe']],['뉴스',['news','oncnews']],['ApuDa 패밀리·계정',['pet','farm','my']],['안내',['home','about']]];
  return '<b>ApuDa 전체 메뉴</b>'+groups.map(function(g){return '<div class="grp">'+g[0]+'</div>'+g[1].map(function(id){return siteCard(SITE[id])}).join('')}).join('')}
var ABOUT='<b>ApuDa.app — 아프지만, 다행이다.</b><p>암 진단 전 위험도 확인부터 진단 첫 30일, 치료 중 기록, 비용 지원, 커뮤니티까지 <b>환자와 보호자가 다음에 할 일</b>을 한 건물 안에서 찾도록 만든 무료 서비스예요.</p><ul><li><b>1F</b> 암 위험도·건강검진</li><li><b>2F</b> 암종별 첫 30일 책·FAQ·치료결정 지도·Drug Hub·바이오마커</li><li><b>3F</b> 산정특례·의료비 지원</li><li><b>4F</b> 암환자 노트(기록·진료요약)</li><li><b>5F</b> 환자·보호자 카페</li></ul><p class="sm">모든 정보는 환자교육용이며 진단·처방을 대신하지 않아요.</p><div class="links">'+link('/about/','자세한 소개·사용법',true)+'</div>';
var NOTE_HOW='<b>암환자 노트 사용법</b><ol><li>아래 입력창에 말하듯 쓰기 — "열 37.8 통증 3점", "다음주 화 10시 항암 3차", "약: 젤로다 아침저녁 3알", "질문: 운동해도 되나요?"</li><li>잘못 저장되면 <b>↩ 되돌리기</b></li><li>위험 신호(38℃·혈변·통증 7점↑)는 바로 연락 안내가 떠요</li><li>진료 갈 땐 <b>진료요약</b> 탭을 의료진에게 보여주기</li><li>⚙︎에서 병원 번호를 넣어두면 🚨 응급 화면에서 바로 전화</li></ol><p class="sm">기록은 이 기기 안에만 저장돼요. 폰을 바꾸기 전엔 ⚙︎ → 백업 파일 받기.</p>';

function reply(raw){
  var t=String(raw||'').trim(),n=norm(t),cc=curCancer(),out=[];
  if(!t)return [{h:'무엇을 도와드릴까요?'}];
  if(CRISIS.some(function(k){return n.indexOf(k)>=0}))return [{c:'red',h:'<b>지금 많이 힘드시군요. 혼자 견디지 않으셔도 돼요.</b><p>자살예방 상담전화 <b>109</b>는 24시간 무료로 바로 연결돼요. 가까운 사람에게 "지금 같이 있어 달라"고 말해 주세요. 몸이 위급하면 119가 먼저예요.</p><div class="links"><a class="go p red" href="tel:109">📞 109 지금 전화</a><a class="go" href="tel:119">🚑 119</a></div>'}];
  var tm=t.match(/(3[89]|4[0-2])(?:\.\d)?\s*(?:도|℃)|(?:열|체온)\s*(3[89](?:\.\d)?|4[0-2](?:\.\d)?)/);
  if(EMERG.some(function(k){return n.indexOf(k)>=0})||(tm&&+(tm[2]||tm[0].match(/[\d.]+/)[0])>=38))
    out.push({c:'red',h:'<b>급한 증상일 수 있어요.</b><ul><li>38.0℃ 이상 열·심한 오한 (특히 항암 중)</li><li>숨이 몹시 참·가슴 통증·의식 저하·경련</li><li>멈추지 않는 출혈·혈변·검은 변</li></ul>해당되면 <b>치료병원에 지금 연락</b>하세요. 숨쉬기 힘들거나 의식이 처지면 119가 우선이에요. 해열제로 먼저 내리지 마세요.<div class="links"><a class="go p red" href="tel:119">🚑 119</a>'+link('/note/#sos','🚨 응급 판단 체크리스트')+'</div>'});
  /* 노트에 기록할 만한 말 */
  var noteLike=/(체온|열)\s*\d|\d\s*(도|℃)|통증\s*\d|\d\s*점|설사|구토|토했|밥\s*(반|조금|못)|식사|몸무게|체중|(질문|물어볼)\s*[:：]|^약\s*[:：]|(오전|오후)?\s*\d{1,2}\s*시.*(항암|검사|외래|진료|CT|MRI)|(다음\s*주|내일|모레|\d+\s*월\s*\d+\s*일).*(항암|검사|외래|진료|CT|MRI|채혈)/i.test(t);
  if(noteLike){
    if(CTX==='note'&&typeof window.sendText==='function'){out.push({h:'노트에 바로 기록할게요.<div class="links"><button class="go p" data-note="'+esc(t)+'">📘 노트에 기록</button></div>'})}
    else out.push({h:'이 내용은 <b>암환자 노트</b>에 기록해 두면 위험 신호 안내와 진료요약까지 자동으로 정리돼요.<div class="links">'+link('/note/?say='+encodeURIComponent(t),'📘 노트에 기록하기',true)+(/설사|구토|토했|변비|입안|저림|피곤|통증/.test(t)&&!/\d/.test(t)?link('/note/?say='+encodeURIComponent(t.replace(/심해요|심해|있어요|있어/,'')+' 어떻게 해요'),'💡 대처법 보기'):'')+'</div>'});
    return out;
  }
  if(out.length)return out;
  /* 맥락 명령 */
  var cmd={
   '암종 고르기':function(){return [{h:cancerPicker()}]},
   '첫 30일 책':function(){return [{h:'12개 암종 <b>「암진단 후 첫 30일」</b> 무료 웹북이 있어요. 암종을 고르세요.<div class="qr">'+CANCER.map(function(c){return '<a class="qb" href="'+A('/library/mini/?cancer='+c[0])+'">'+c[1]+'</a>'}).join('')+'</div><div class="links">'+link('/#floor-2','📚 2F 서재 전체 보기')+'</div>'}]},
   '다른 암종 책':function(){return cmd['첫 30일 책']()},
   '전체 메뉴':function(){return [{h:menu()}]},
   'ApuDa 소개':function(){return [{h:ABOUT}]},
   '노트 사용법':function(){return [{h:NOTE_HOW+(CTX==='note'?'':'<div class="links">'+link('/note/','📘 노트 열기',true)+'</div>')}]},
   '다운로드 방법':function(){return [{h:'<b>PDF 받는 방법</b><ol><li>웹북 상단 <b>⬇ 다운로드</b> 또는 표지 옆 <b>PDF 다운로드</b> 누르기</li><li>Instagram 구독자에게 안내된 <b>다운로드 코드</b> 입력 (대소문자 상관없어요)</li><li>권당 약 8MB라 휴대폰은 잠시 기다려 주세요</li></ol><p class="sm">웹에서 읽기는 코드 없이 무료예요. 코드는 ApuDa 인스타그램에서 확인할 수 있어요.</p>'+(CTX==='mini'?'<div class="links"><button class="go p" data-click="#downloadBtn">⬇ 다운로드 창 열기</button></div>':'')}]},
   '이 암 FAQ':function(){return cc?[{h:link('/library/faq/?cancer='+cc[0],'❓ '+cc[1]+' FAQ 열기',true)}]:[{h:cancerPicker()}]},
   '이 암 치료지도':function(){return cc?[{h:link('/library/treatment-map/?cancer='+cc[0],'🗺️ '+cc[1]+' 치료결정 지도',true)}]:[{h:link('/library/treatment-map/','🗺️ 치료결정 지도 열기',true)}]},
   '이 암 약':function(){return cc?[{h:link('/library/drugs/?cancer='+cc[0],'💊 '+cc[1]+' 관련 항암제',true)}]:[{h:link('/library/drugs/','💊 Drug Hub 열기',true)}]},
   '이 암 책':function(){return cc?[{h:link('/library/mini/?cancer='+cc[0],'📖 암진단 후 첫 30일 - '+cc[1],true)}]:cmd['첫 30일 책']()},
   '질문 저장 방법':function(){return [{h:'노트에 <b>"질문: 궁금한 내용"</b>이라고 쓰면 진료요약의 "오늘 꼭 물어볼 것"에 모여요. 아래 버튼을 누르면 바로 써 둘 수 있어요.<div class="links">'+link('/note/?say='+encodeURIComponent('질문: '),'📘 노트에 질문 쓰기',true)+'</div>'}]},
   '약 기록 방법':function(){return [{h:'노트에 <b>"약: 약이름 먹는 시간 개수"</b>로 쓰면 복용 중인 약 목록에 들어가요. 예) 약: 젤로다 아침저녁 3알<div class="links">'+link('/note/?say='+encodeURIComponent('약: '),'📘 노트에 약 기록',true)+'</div>'}]},
   '공급부족이란':function(){return [{h:'<b>공급 표시</b>는 식약처에 신고된 공급중단·부족 보고를 약 이름으로 찾아 보여주는 거예요. 빨강은 정상화 예정일이 아직 안 지난 신고, 주황은 최근 3년 내 이력이에요.<p class="sm">공급 소식이 있어도 <b>치료 일정이나 약을 임의로 바꾸지 말고</b> 치료기관에 확인하세요.</p>'}]},
   '결과지 읽는 법':function(){return [{h:'<b>검사 결과지 볼 때</b><ol><li>검사 이름(EGFR, HER2…)과 결과(양성/음성, 수치)를 그대로 적어 두기</li><li>바이오마커 페이지에서 그 검사의 "결과는 치료와 어떻게 연결되나요?" 확인</li><li>모르는 표현은 노트에 질문으로 저장해 진료 때 확인</li></ol><p class="sm">결과 해석과 치료 결정은 담당 의료진이 해요.</p>'}]},
   '응급':function(){return [{c:'red',h:'<b>지금 병원에 연락해야 하는지</b> 체크리스트로 확인해 보세요. 숨쉬기 힘들거나 의식이 처지면 바로 119.<div class="links">'+link('/note/#sos','🚨 응급 판단 열기',true)+'<a class="go red" href="tel:119">🚑 119</a></div>'}]},
   '노트':function(){return [{h:siteCard(SITE.note)}]},'치료비 지원':function(){return [{h:siteCard(SITE.support)+'<p class="sm">조건은 자주 바뀌어요. 병원 사회사업실에서 최종 확인하세요.</p>'}]},
   '홈':function(){return [{h:siteCard(SITE.home)}]},'카페':function(){return [{h:siteCard(SITE.cafe)}]},'건강검진':function(){return [{h:siteCard(SITE.checkup)}]},'위험도':function(){return [{h:siteCard(SITE.cancercheck)}]},
   '항암제 뉴스':function(){return [{h:siteCard(SITE.oncnews)}]},'항암제':function(){return [{h:siteCard(SITE.drugs)+'<p class="sm">약 이름을 바로 써 주셔도 돼요. 예) 키트루다</p>'}]},'바이오마커':function(){return [{h:siteCard(SITE.markers)}]},'치료결정 지도':function(){return [{h:siteCard(SITE.map)}]}
  };
  if(cmd[t])return cmd[t]();
  if(/소개|어떤\s*곳|뭐\s*하는|apuda\s*(가|는|란)|아프다\s*(가|는|란)/i.test(t))return cmd['ApuDa 소개']();
  if(/전체\s*메뉴|메뉴|어디로|어디\s*있|층별|사이트\s*맵|바로\s*가기/.test(t))return cmd['전체 메뉴']();
  if(/다운로드|다운|pdf|코드/i.test(t))return cmd['다운로드 방법']();
  if(/사용법|어떻게\s*(써|쓰|사용)|도움말/.test(t)){if(CTX==='note')return cmd['노트 사용법']();if(CTX==='mini')return cmd['다운로드 방법']().concat([{h:'목차를 눌러 원하는 쪽으로 이동하고, 다 읽은 뒤엔 같은 암종의 FAQ·치료결정 지도로 이어 보세요.'}]);return [{h:ABOUT}]}
  /* 약·바이오마커 */
  if(ONC){
    var hitD=ONC.DRUGS.filter(function(d){return d.match.concat([d.en]).some(function(k){k=norm(k);return k.length>=2&&n.indexOf(k)>=0})}).slice(0,3);
    var hitM=ONC.MARKERS.filter(function(m){return [m.id,m.name.split(/[\s\/·]/)[0]].some(function(k){k=norm(k);return k.length>=3&&n.indexOf(k)>=0})}).slice(0,3);
    if(hitD.length||hitM.length){var h='';
      hitD.forEach(function(d){h+='<div class="site"><div class="si">💊</div><div class="sb"><b>'+esc(d.ko)+'</b><small>'+esc((d.brand?d.brand+' · ':'')+d.moa)+'</small></div>'+link('/library/drugs/?id='+d.id,'보기')+'</div>'});
      hitM.forEach(function(m){h+='<div class="site"><div class="si">🧬</div><div class="sb"><b>'+esc(m.name)+'</b><small>'+esc(m.full)+'</small></div>'+link('/library/biomarkers/?id='+encodeURIComponent(m.id),'보기')+'</div>'});
      return [{h:h+'<p class="sm">같은 약이라도 암종·병기·검사 결과에 따라 쓰는 조건이 달라요.</p>'}]}
  }
  /* 암종 */
  var cHit=CANCER.find(function(c){return n.indexOf(norm(c[1]))>=0||c[2].some(function(k){return n.indexOf(norm(k))>=0&&(/암|종/.test(t))})});
  if(cHit)return [{h:cancerCard(cHit)}];
  /* 사이트 키워드 */
  var scored=SITES.map(function(s){var sc=0;s.kw.forEach(function(k){if(n.indexOf(norm(k))>=0)sc+=norm(k).length>=3?3:2});if(n.indexOf(norm(s.name))>=0)sc+=4;return [sc,s]}).filter(function(x){return x[0]>=2}).sort(function(a,b){return b[0]-a[0]}).slice(0,3);
  if(scored.length)return [{h:'이곳으로 안내해 드릴게요.'+scored.map(function(x){return siteCard(x[1])}).join('')}];
  /* 증상 상담 → 노트봇 지식 */
  if(/아파|아픔|메스|구역|설사|변비|입안|저려|저림|피곤|피로|탈모|머리카락|먹어야|운동|우울|불안|잠|열이/.test(t))
    return [{h:'증상별 대처 안내는 <b>암환자 노트의 노트봇</b>이 자세히 알려드려요. 아래를 누르면 그대로 물어볼게요.<div class="links">'+link('/note/?say='+encodeURIComponent(t),'📘 노트봇에게 묻기',true)+'</div><p class="sm">심하거나 갑자기 나빠지면 치료병원에 바로 연락하세요.</p>'}];
  return [{h:'제가 잘 이해하지 못했어요. 이렇게 물어보세요.<ul><li>"폐암 정보" · "키트루다" · "HER2"</li><li>"치료비 지원" · "카페" · "건강검진"</li><li>"열 37.8" (노트에 기록)</li></ul><div class="qr">'+q('🏢 전체 메뉴','전체 메뉴')+q('💡 ApuDa 소개','ApuDa 소개')+'</div>'}];
}

/* ── UI ── */
var CSS=':host{all:initial}*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif}'+
'.fab{position:fixed;z-index:2147483000;bottom:calc(18px + env(safe-area-inset-bottom));right:18px;display:flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:0 18px 0 14px;height:56px;background:linear-gradient(135deg,#246bfe,#0d4fb9);color:#fff;font-size:15px;font-weight:900;box-shadow:0 12px 28px rgba(36,107,254,.38);cursor:pointer}'+
'.fab.left{right:auto;left:18px}.fab span{font-size:22px}.fab:hover{transform:translateY(-2px)}'+
'.pn{position:fixed;z-index:2147483001;right:18px;bottom:calc(86px + env(safe-area-inset-bottom));width:min(400px,calc(100vw - 24px));height:min(640px,calc(100dvh - 120px));display:none;flex-direction:column;background:#f6f9fd;border:1px solid #dbe5f2;border-radius:24px;box-shadow:0 30px 80px rgba(8,30,60,.28);overflow:hidden;color:#14213a}'+
'.pn.left{right:auto;left:18px}.pn.on{display:flex}'+
'.hd{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;background:#fff;border-bottom:1px solid #e3eaf3}.hd i{width:36px;height:36px;border-radius:12px;background:linear-gradient(140deg,#246bfe,#5aa6ff);display:grid;place-items:center;color:#fff;font-style:normal;font-weight:900}.hd b{display:block;font-size:15px}.hd small{display:block;font-size:11px;color:#6b7a90;font-weight:700}.hd .x{margin-left:auto;border:1px solid #e3eaf3;background:#fff;border-radius:12px;width:40px;height:40px;font-size:18px;cursor:pointer;color:#14213a}.hd .m{border:1px solid #e3eaf3;background:#fff;border-radius:12px;height:40px;padding:0 10px;font-size:12px;font-weight:900;cursor:pointer;color:#14213a}'+
'.th{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:15px;line-height:1.6}'+
'.mg{max-width:92%;padding:11px 13px;border-radius:16px;word-break:keep-all;overflow-wrap:anywhere}.me{align-self:flex-end;background:#246bfe;color:#fff;border-bottom-right-radius:5px}.bt{align-self:flex-start;background:#fff;border:1px solid #e3eaf3;border-bottom-left-radius:5px}.bt.red{background:#fff1f0;border-color:#fecaca}'+
'.mg ul,.mg ol{margin:6px 0;padding-left:20px}.mg p{margin:6px 0}.sm{font-size:12.5px;color:#6b7a90}'+
'.links{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.go{display:inline-flex;align-items:center;min-height:40px;padding:0 12px;border-radius:12px;border:1px solid #cddcf2;background:#fff;color:#0d4fb9;font-size:13px;font-weight:900;text-decoration:none;cursor:pointer}.go.p{background:#246bfe;border-color:#246bfe;color:#fff}.go.red{background:#d92d20;border-color:#d92d20;color:#fff}'+
'.qr{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.qb{border:0;background:#eaf2ff;color:#0d4fb9;border-radius:999px;min-height:38px;padding:0 12px;font-size:13px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}'+
'.site{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #eef2f7}.site:first-of-type{border-top:0}.si{width:36px;height:36px;border-radius:11px;background:#eef5ff;display:grid;place-items:center;font-size:18px;flex:0 0 auto}.sb{flex:1;min-width:0}.sb b{display:block;font-size:14px;line-height:1.35}.sb em{font-style:normal;color:#246bfe;font-size:11px;font-weight:900}.sb small{display:block;font-size:12px;color:#6b7a90;line-height:1.4}.site .go{min-height:34px;padding:0 10px;font-size:12px;flex:0 0 auto}'+
'.grp{margin:12px 0 2px;font-size:11px;font-weight:900;color:#246bfe;letter-spacing:.06em}'+
'.ch{display:flex;gap:6px;overflow-x:auto;padding:8px 12px 2px;scrollbar-width:none}.ch::-webkit-scrollbar{display:none}.ch button{flex:0 0 auto;border:1px solid #dbe5f2;background:#fff;border-radius:999px;height:38px;padding:0 12px;font-size:13px;font-weight:900;color:#2c3e57;cursor:pointer}'+
'form{display:flex;gap:8px;padding:8px 12px 12px;background:#f6f9fd}form input{flex:1;min-width:0;height:48px;border:1.5px solid #cdd9ea;border-radius:14px;padding:0 14px;font-size:16px;outline:none;color:#14213a;background:#fff}form input:focus{border-color:#246bfe}form button{width:48px;height:48px;border:0;border-radius:14px;background:#246bfe;color:#fff;font-size:18px;font-weight:900;cursor:pointer}'+
'.ft{font-size:10.5px;color:#8594a8;text-align:center;padding:0 12px 10px}'+
'@media(max-width:560px){.fab{height:52px;padding:0 15px 0 12px;font-size:14px;bottom:calc(14px + env(safe-area-inset-bottom));right:14px}.fab.left{left:14px}.fab b{display:none}.fab{width:56px;height:56px;padding:0;justify-content:center}.pn,.pn.left{left:0;right:0;bottom:0;width:100%;height:100dvh;border-radius:0}}'+
'@media print{.fab,.pn{display:none!important}}';

var host=document.createElement('div');host.id='apuda-bot';var root=host.attachShadow({mode:'open'});
var left=DS.pos==='left';
root.innerHTML='<style>'+CSS+'</style>'+
 (DS.launcher==='none'?'':'<button class="fab'+(left?' left':'')+'" aria-label="ApuDa 길잡이 열기"><span>🧭</span><b>'+(CTX==='home'?'무엇을 도와드릴까요?':'길잡이')+'</b></button>')+
 '<section class="pn'+(left?' left':'')+'" role="dialog" aria-label="ApuDa 길잡이"><div class="hd"><i>A</i><div><b>'+esc(C.t)+'</b><small>ApuDa.app · 어디든 안내해 드려요</small></div><button class="m" data-say="전체 메뉴">전체 메뉴</button><button class="x" aria-label="닫기">✕</button></div>'+
 '<div class="th" aria-live="polite"></div><div class="ch">'+C.chips.map(function(c){return '<button data-say="'+esc(c[1])+'">'+esc(c[0])+'</button>'}).join('')+'</div>'+
 '<form><input placeholder="예) 폐암 정보 · 키트루다 · 치료비 지원" aria-label="길잡이에게 묻기" enterkeyhint="send"><button aria-label="보내기">↑</button></form><div class="ft">진단·처방을 대신하지 않아요 · 입력 내용은 저장·전송되지 않아요</div></section>';
var pn=root.querySelector('.pn'),th=root.querySelector('.th'),inp=root.querySelector('input'),started=false;
function add(cls,h){var d=document.createElement('div');d.className='mg '+cls;d.innerHTML=h;th.appendChild(d);th.scrollTop=th.scrollHeight;return d}
function say(text,silentUser){if(!silentUser)add('me',esc(text));var go=function(){reply(text).forEach(function(r){add('bt'+(r.c?' '+r.c:''),r.h)})};if(!ONC&&/[a-z가-힣]/i.test(text))loadOnc().then(go);else go()}
function open(text){pn.classList.add('on');if(!started){started=true;add('bt',typeof C.g==='function'?C.g():C.g)}if(text)say(text);setTimeout(function(){if(matchMedia('(min-width:561px)').matches)inp.focus()},50)}
function close(){pn.classList.remove('on')}
var fab=root.querySelector('.fab');if(fab)fab.onclick=function(){pn.classList.contains('on')?close():open()};
root.querySelector('.x').onclick=close;
root.querySelector('form').onsubmit=function(e){e.preventDefault();var v=inp.value.trim();if(!v)return;inp.value='';say(v)};
root.addEventListener('click',function(e){var b=e.target.closest('[data-say]');if(b){e.preventDefault();say(b.dataset.say);return}
  var nb=e.target.closest('[data-note]');if(nb&&window.sendText){window.sendText(nb.dataset.note);close();return}
  var cb=e.target.closest('[data-click]');if(cb){var el=document.querySelector(cb.dataset.click);if(el){close();el.click()}return}
  if(e.target.closest('a.go,a.qb')&&!/target/.test(e.target.closest('a').outerHTML))setTimeout(close,50)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
function mount(){document.body.appendChild(host)}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
window.ApudaBot={open:open,close:close,ask:function(t){open(t)},context:CTX};
})();
