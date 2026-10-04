/* ApuDa 암환자 노트 v3.0 — 노트봇 중심 단순화 버전
 * - 저장소: localStorage['apuda_cancer_care_v1'] (기존 v2 데이터 그대로 이어 씀)
 * - 서버 전송 없음. 노트봇은 기기 안 규칙 기반으로 동작(오프라인 가능).
 * - 진단·처방·용량 판단을 하지 않는다. 위기(자해) → 응급 → 기록 → 정보 순으로 처리한다. */
'use strict';
var KEY='apuda_cancer_care_v1', CHAT_KEY='apuda_note_chat_v1', FONT_KEY='apuda_note_font';
var KB=window.NOTE_KB;
var defaultState={profile:{name:'',cancer:'',stage:'',treatment:'',goal:'',cycle:'',hospital:'',dayPhone:'',nightPhone:'',biomarkers:''},
  roadmap:[],meds:[],logs:[],questions:[],supports:[],distress:[],triage:{items:[],at:0},distressValue:0,meta:{lastBackup:''}};
function clone(o){return JSON.parse(JSON.stringify(o))}
function validBackup(d){
  if(!d||typeof d!=='object'||Array.isArray(d))return false;
  var arrs=['roadmap','meds','logs','questions','supports','distress'];
  for(var i=0;i<arrs.length;i++){if(arrs[i] in d&&!Array.isArray(d[arrs[i]]))return false}
  if('profile' in d&&(typeof d.profile!=='object'||d.profile===null||Array.isArray(d.profile)))return false;
  return true;
}
window.validBackup=validBackup;
function load(){
  try{var x=JSON.parse(localStorage.getItem(KEY));if(!x)return clone(defaultState);
    if(!validBackup(x)){localStorage.setItem(KEY+'_corrupt',localStorage.getItem(KEY));return clone(defaultState)}
    var s=Object.assign(clone(defaultState),x);s.profile=Object.assign(clone(defaultState.profile),x.profile||{});
    if(!s.triage||!Array.isArray(s.triage.items))s.triage={items:[],at:0};return s}catch(e){return clone(defaultState)}
}
var state=load();
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function $(s){return document.querySelector(s)}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function pad(n){return String(n).padStart(2,'0')}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function today(){return ymd(new Date())}
var WD=['일','월','화','수','목','금','토'];
function fmt(s){if(!s)return '-';var d=new Date(s+'T00:00:00');return (d.getMonth()+1)+'월 '+d.getDate()+'일('+WD[d.getDay()]+')'}
function dday(s){var a=new Date(today()+'T00:00:00'),b=new Date(s+'T00:00:00');var n=Math.round((b-a)/864e5);return n===0?'오늘':n===1?'내일':n===2?'모레':n>0?n+'일 후':(-n)+'일 전'}
function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('on')},1800)}
function tel(n){return 'tel:'+String(n||'').replace(/[^\d+]/g,'')}

/* ── 화면 전환 (기존 지식 링크 호환) ── */
var ALIAS={home:'today',symptoms:'log',nutrition:'log',roadmap:'plan',questions:'plan',meds:'plan',support:'log',summary:'summary',safety:'sos'};
function tab(name){
  if(name==='sos'){openSheet('sos');return}
  document.querySelectorAll('.view').forEach(function(v){v.classList.toggle('on',v.id==='v-'+name)});
  document.querySelectorAll('#tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.t===name)});
  $('#composer').style.display=name==='today'?'':'none';
  document.querySelector('main').style.paddingBottom=name==='today'?'':'calc(var(--tab) + 30px)';
  if(name==='today')setTimeout(scrollBottom,30);else scrollTo(0,0);
}
function go(n){closeSheet();var t=ALIAS[n]||n;if(n==='questions')planTab='qs';if(n==='meds')planTab='meds';if(n==='roadmap')planTab='sched';renderPlan();tab(t)}
function openModal(){openSheet('settings')}
window.go=go;window.openModal=openModal;
function openSheet(n){closeSheet();$('#sh-'+n).classList.add('open');if(n==='settings')fillProfile()}
function closeSheet(){document.querySelectorAll('.sheet').forEach(function(s){s.classList.remove('open')})}
document.querySelectorAll('#tabs button').forEach(function(b){b.onclick=function(){tab(b.dataset.t)}});

/* ── 글자 크기 ── */
function applyFont(){document.documentElement.classList.toggle('big',localStorage.getItem(FONT_KEY)==='big')}
$('#fontBtn').onclick=function(){localStorage.setItem(FONT_KEY,localStorage.getItem(FONT_KEY)==='big'?'':'big');applyFont();toast(localStorage.getItem(FONT_KEY)==='big'?'글자를 크게 했어요':'기본 글자 크기')};
applyFont();

/* ═════════ 날짜·시간 해석 ═════════ */
var WDMAP={'일':0,'월':1,'화':2,'수':3,'목':4,'금':5,'토':6};
function parseDate(t,base){
  var now=base||new Date(),d=new Date(now.getFullYear(),now.getMonth(),now.getDate()),m,used=[];
  function hit(re){var r=t.match(re);if(r)used.push(r[0]);return r}
  if((m=hit(/(20\d{2})[.\-\/년]\s*(\d{1,2})[.\-\/월]\s*(\d{1,2})일?/)))return {date:ymd(new Date(+m[1],m[2]-1,+m[3])),used:used};
  if((m=hit(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/))||(m=hit(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?=\s|$|에)/))){
    var x=new Date(now.getFullYear(),m[1]-1,+m[2]);if(x<d&&(d-x)>30*864e5)x.setFullYear(x.getFullYear()+1);return {date:ymd(x),used:used}}
  if(hit(/그저께|그제/)){d.setDate(d.getDate()-2);return {date:ymd(d),used:used}}
  if(hit(/어제/)){d.setDate(d.getDate()-1);return {date:ymd(d),used:used}}
  if(hit(/글피/)){d.setDate(d.getDate()+3);return {date:ymd(d),used:used}}
  if(hit(/모레/)){d.setDate(d.getDate()+2);return {date:ymd(d),used:used}}
  if(hit(/내일/)){d.setDate(d.getDate()+1);return {date:ymd(d),used:used}}
  if((m=hit(/(\d{1,3})\s*일\s*(?:후|뒤)/))){d.setDate(d.getDate()+(+m[1]));return {date:ymd(d),used:used}}
  if((m=hit(/(\d{1,2})\s*주\s*(?:후|뒤)/))){d.setDate(d.getDate()+7*m[1]);return {date:ymd(d),used:used}}
  if((m=hit(/(다다음\s*주|다음\s*주|담주|이번\s*주|금주)?\s*([일월화수목금토])(?:요일|욜)/))){
    var w=WDMAP[m[2]],cur=d.getDay(),diff;
    if(m[1]&&/다다음/.test(m[1])){diff=(w-cur+7)%7+14-(w>=cur?7:0)}
    else if(m[1]&&/다음|담/.test(m[1])){var mon=new Date(d);mon.setDate(d.getDate()-((cur+6)%7)+7);diff=Math.round((mon-d)/864e5)+((w+6)%7)}
    else if(m[1]){var mon2=new Date(d);mon2.setDate(d.getDate()-((cur+6)%7));diff=Math.round((mon2-d)/864e5)+((w+6)%7)}
    else{diff=(w-cur+7)%7}
    d.setDate(d.getDate()+diff);return {date:ymd(d),used:used}}
  if((m=hit(/(?:^|\s)(\d{1,2})\s*일(?![\s]*(?:후|뒤|간|째|분|치))/))&&+m[1]>=1&&+m[1]<=31){
    var y=new Date(now.getFullYear(),now.getMonth(),+m[1]);if(y<d)y.setMonth(y.getMonth()+1);return {date:ymd(y),used:used}}
  if(hit(/오늘/))return {date:ymd(d),used:used};
  return null;
}
function parseTime(t){
  var m=t.match(/(오전|오후|아침|낮|저녁|밤)?\s*(\d{1,2})\s*시\s*(?:(\d{1,2})\s*분|(반))?/)||t.match(/(?:^|\s)()(\d{1,2}):(\d{2})(?=\s|$|에)/);
  if(!m)return null;var h=+m[2],mi=m[3]?+m[3]:(m[4]?30:0);
  if(h>24||mi>59)return null;
  if(/오후|저녁|밤/.test(m[1]||'')&&h<12)h+=12;else if(!m[1]&&h>=1&&h<=6)h+=12;
  return {time:pad(h)+':'+pad(mi),used:m[0]};
}

/* ═════════ 노트봇 해석기 ═════════ */
var CRISIS_KW=['죽고싶','죽고파','자살','살기싫','사라지고싶','끝내고싶','자해','없어지고싶','죽어버리','살고싶지않','살아서뭐','의미가없'];
var EMERG_KW=['숨이차','숨이막','숨쉬기','호흡곤란','피를토','토혈','의식','쓰러','경련','말이어눌','가슴이조','가슴통증','입술이파','얼굴이부','목이부'];
var SCHED_KW=/항암|방사선|수술|입원|퇴원|외래|진료|예약|검사|채혈|피검사|혈액검사|CT|MRI|PET|펫|내시경|초음파|조직검사|주사|투약|상담|재진|협진|병원\s*가|치료\s*\d+\s*차|\d+\s*차/i;
var CANCERS=['유방암','폐암','위암','대장암','직장암','결장암','갑상선암','신장암','전립선암','췌장암','담도암','담낭암','담관암','간암','림프종','자궁경부암','자궁내막암','난소암','방광암','식도암','두경부암','뇌종양','백혈병','다발골수종','육종','피부암','흑색종'];
var MEAL_WORDS=[[/거의\s*못|전혀\s*못|못\s*먹|안\s*먹|굶/,10],[/조금|약간|몇\s*숟가락|한\s*두\s*숟/,25],[/반(?!찬)|절반/,50],[/대부분|거의\s*다|평소보다\s*조금/,75],[/다\s*먹|전부|평소대로|평소만큼|잘\s*먹|한\s*그릇/,100]];

function interpret(raw){
  var t=raw.trim(), n=t.replace(/\s+/g,'').toLowerCase(), out={saved:[],notes:[],alerts:[],cards:[],undo:false,handled:false};
  if(!t)return out;
  if(CRISIS_KW.some(function(k){return n.indexOf(k)>=0})){out.cards.push({kind:'crisis'});out.handled=true;return out}
  var emerg=EMERG_KW.some(function(k){return n.indexOf(k)>=0});

  /* 0) 조회형 */
  if(/^(다음\s*)?일정(이|은)?\s*(뭐|언제|알려|보여)|다음\s*일정|일정\s*(목록|보여)/.test(t)){out.cards.push({kind:'nextSched'});out.handled=true;return out}
  if(/(약\s*목록|무슨\s*약|먹는\s*약\s*(뭐|보여|알려)|약\s*보여)/.test(t)){out.cards.push({kind:'medList'});out.handled=true;return out}
  if(/^(진료\s*)?요약/.test(t)){out.cards.push({kind:'goSummary'});out.handled=true;return out}
  if(/^(최근|오늘|이번\s*주)\s*기록/.test(t)){out.cards.push({kind:'recent'});out.handled=true;return out}

  /* 1) 내 정보 */
  var pm,prof={};
  if((pm=t.match(/(야간|응급|밤|당직)\s*(?:실\s*)?(?:전화|연락처|번호)?\s*[:：은는이]?\s*([0-9][0-9\- ]{6,}[0-9])/)))prof.nightPhone=pm[2].trim();
  if((pm=t.match(/(?:병원|주간|외래|간호사실|담당)\s*(?:전화|연락처|번호)\s*[:：은는이]?\s*([0-9][0-9\- ]{6,}[0-9])/)))prof.dayPhone=pm[1].trim();
  if((pm=t.match(/(?:내\s*)?이름\s*[:：은는]?\s*([가-힣A-Za-z]{2,10})/))&&!/약/.test(pm[1]))prof.name=pm[1];
  if((pm=t.match(/(?:치료\s*)?병원\s*[:：은는]\s*([^\d,]{2,30}?)(?:\s*(?:이야|입니다|이에요|예요))?$/))||(pm=t.match(/([가-힣A-Za-z]{2,20}(?:대학교병원|대병원|병원|암센터|의료원))\s*(?:다녀|에서\s*치료|다님|다니)/)))prof.hospital=pm[1].trim();
  if(/암종|진단|병명|진단명/.test(t)||/^[가-힣]*암\s*\d?\s*기/.test(t)){var c=CANCERS.find(function(x){return t.indexOf(x)>=0});if(c)prof.cancer=c;var st=t.match(/(\d)\s*기|(\d)\s*a|(\d)\s*b|stage\s*(\d)/i);if(st&&c)prof.stage=st[0].replace(/\s+/g,'')}
  if((pm=t.match(/(?:현재\s*)?치료\s*(?:는|은|:)\s*(.{2,40})$/)))prof.treatment=pm[1].trim();
  if((pm=t.match(/알레르기\s*[:：은는]?\s*(.{2,30})$/)))prof.biomarkers=[state.profile.biomarkers,'알레르기 '+pm[1].trim()].filter(Boolean).join(', ');
  var pk=Object.keys(prof);
  if(pk.length){pk.forEach(function(k){state.profile[k]=prof[k]});
    var LBL={name:'이름',cancer:'암종',stage:'병기',hospital:'병원',dayPhone:'병원 전화',nightPhone:'야간·응급 전화',treatment:'현재 치료',biomarkers:'알레르기·기타'};
    pk.forEach(function(k){out.saved.push(LBL[k]+' · '+prof[k])});out.handled=true;out.undo=true;return out}

  /* 2) 질문 메모 */
  var qm=t.match(/^(?:(?:꼭|중요|급한)\s*)?(?:질문|물어볼\s*(?:것|거)?|궁금한\s*(?:것|거|점)|의사(?:한테|에게|선생님께)\s*물어볼\s*(?:것|거)?)\s*[:：\-]?\s*(.+)$/);
  if(qm||/(?:물어봐야|여쭤봐야|물어보기)\s*$/.test(t)){
    var qt=(qm?qm[1]:t.replace(/\s*(물어봐야|여쭤봐야|물어보기)\s*(지|해|함|겠다)?$/,'')).trim();
    var pri=/꼭|중요|반드시|급/.test(t)?'high':'mid';
    state.questions.unshift({id:uid(),question:qt,priority:pri,answer:'',createdAt:Date.now()});
    out.saved.push('질문 · '+qt.slice(0,40)+(pri==='high'?' (꼭)':''));out.handled=true;out.undo=true;return out}

  /* 3) 약 */
  var stop=/(중단|끊었|끊음|그만\s*먹|안\s*먹기로|복용\s*종료)/.test(t);
  if(stop){var found=state.meds.find(function(m){return m.active==='yes'&&m.name&&n.indexOf(m.name.replace(/\s+/g,'').toLowerCase())>=0});
    if(found){found.active='no';found.memo=[found.memo,today()+' 중단'].filter(Boolean).join(' · ');out.saved.push('약 중단 · '+found.name);out.handled=true;out.undo=true;return out}}
  var isMedAdd=/^약\s*[:：]?\s*\S|약\s*추가|처방\s*(받|됐|나왔)|먹기\s*시작|복용\s*시작|새로\s*(먹|복용)|시작했|시작\s*(함|해|해요)?\s*$|(을|를)?\s*복용\s*중/.test(t)&&!/항암\s*\d+\s*차/.test(t);
  if(isMedAdd&&!/체온|통증|설사|구토/.test(t)){
    var body=t.replace(/^약\s*[:：]?\s*/,'').replace(/약\s*추가\s*[:：]?/,'');
    var dose=(body.match(/\d+(?:\.\d+)?\s*(?:알|정|mg|밀리그램|밀리|캡슐|포|ml|mL|cc|방울|매|개)/i)||[''])[0];
    var sch=(body.match(/(?:하루\s*\d\s*(?:번|회)|아침\s*(?:저녁|점심)?|점심|저녁|자기\s*전|취침\s*전|식후|식전|공복|\d+\s*시간\s*마다|필요할\s*때|아플\s*때)(?:\s*(?:에|마다))?/g)||[]).join(' ');
    var name=body.split(/\s|(?=\d)|아침|점심|저녁|하루|자기|취침|식후|식전|공복|처방|먹기|복용|시작|새로|을|를/)[0]||'';
    name=name.replace(/[,.:]/g,'').trim();
    if(name.length<2){out.cards.push({kind:'askMed'});out.handled=true;return out}
    var type=/진통|마약|패치|옥시|모르핀|타이레놀|트라마/.test(name)?'통증약':/구토|멀미|온단|아킨지오|에멘드/.test(name)?'구토 예방약':/스테로이드|덱사|소론도/.test(name)?'스테로이드':/항암|타그리소|렉라자|입랜스|키스칼리|버제니오|젤로다|티에스원|론서프|타목시펜|페마라|아리미덱스|자이티가|엑스탄디|얼리다|뉴베카|린파자/.test(name)?'항암·표적·호르몬제':'기타';
    state.meds.unshift({id:uid(),name:name,dose:dose,schedule:sch.trim(),purpose:'',type:type,active:'yes',memo:today()+' 시작',createdAt:Date.now()});
    out.saved.push('약 · '+name+(dose?' '+dose:'')+(sch?' · '+sch.trim():''));out.handled=true;out.undo=true;
    out.notes.push('복용량·시간은 처방전 그대로인지 한 번 더 확인해 주세요. 약 조절은 의료진과 상의하세요.');return out}

  /* 4) 일정 */
  var pd=parseDate(t), ptm=parseTime(t);
  var schedLike=SCHED_KW.test(t)&&!/체온|열\s*\d|통증\s*\d|설사\s*\d|구토\s*\d|먹었|했어|했다|받았|다녀왔/.test(t);
  if(pd&&schedLike&&pd.date>=today()||(ptm&&schedLike&&!pd)){
    var date=pd?pd.date:today(), title=t;
    (pd?pd.used:[]).concat(ptm?[ptm.used]:[]).forEach(function(u){title=title.replace(u,' ')});
    title=title.replace(/(다다음\s*주|다음\s*주|담주|이번\s*주)/g,' ').replace(/\s*(에|있어|있음|예약|잡혔어|잡힘|있다|입니다|이야|예정)\s*$/,'').replace(/^\s*(에|은|는)\s*/,'').replace(/\s+/g,' ').trim()||'병원 일정';
    var typ=/항암|방사선|수술|주사|투약|입원/.test(t)?'치료':/CT|MRI|PET|펫|검사|채혈|내시경|초음파|조직/i.test(t)?'검사':/외래|진료|상담|재진|협진/.test(t)?'진료':'일정';
    state.roadmap.push({id:uid(),date:date,time:ptm?ptm.time:'',type:typ,title:title,memo:'',status:'planned',createdAt:Date.now()});
    out.saved.push('일정 · '+fmt(date)+(ptm?' '+ptm.time:'')+' · '+title);out.handled=true;out.undo=true;
    if(typ==='치료')out.notes.push('치료 전날엔 체온과 컨디션을 기록해 두면 진료 때 도움이 됩니다.');
    if(typ==='검사'&&/CT|MRI|PET|조영/i.test(t))out.notes.push('금식·조영제 주의사항이 있는지 병원 안내문을 확인하세요.');
    return out}

  /* 5) 몸 상태 기록 */
  var logDate=(pd&&pd.date<=today())?pd.date:today(), rec={}, m;
  if((m=t.match(/(?:체온|열|온도|미열)\s*(?:이|은|는|:|가)?\s*(3[4-9](?:\.\d)?|4[0-2](?:\.\d)?)/))||(m=t.match(/(3[5-9]\.\d|4[0-2]\.\d|3[5-9]|4[0-2])\s*(?:도|℃|°)/))||(m=t.match(/(?:^|\s)(3[5-9]\.\d|4[0-2]\.\d)(?![\d.]|\s*(?:kg|킬로|%|점))/i)))rec.temp=m[1];
  if((m=t.match(/(?:통증|아파|아픔|아프|통)\D{0,6}?(\d{1,2})\s*(?:점|\/\s*10)/))||(m=t.match(/(?:통증)\s*(?:이|은|는|:)?\s*(\d{1,2})(?!\s*(?:번|회|시|일|kg))/)))if(+m[1]<=10)rec.pain=m[1];
  if(/안\s*아파|통증\s*(없|0)/.test(t))rec.pain='0';
  if((m=t.match(/(?:체중|몸무게)\s*(?:이|은|는|:)?\s*(\d{2,3}(?:\.\d)?)/))||(m=t.match(/(\d{2,3}(?:\.\d)?)\s*(?:kg|킬로)/i)))rec.weight=m[1];
  if(/식사|밥|먹었|먹음|먹어|식욕|입맛|죽/.test(t)&&!/약/.test(t.replace(/약간/g,''))){
    if((m=t.match(/(\d{1,3})\s*%/)))rec.meal=String(Math.min(100,+m[1]));
    else{for(var i=0;i<MEAL_WORDS.length;i++){if(MEAL_WORDS[i][0].test(t)){rec.meal=String(MEAL_WORDS[i][1]);break}}}
  }
  if((m=t.match(/(?:물|수분)\s*(?:을|를)?\s*(\d{3,4})\s*(?:ml|mL|cc|미리)?/)))rec.water=m[1];
  else if((m=t.match(/물\s*(\d{1,2})\s*(?:컵|잔)/)))rec.water=String(m[1]*200);
  if((m=t.match(/(\d{3,6})\s*걸음/)))rec.steps=m[1];
  if((m=t.match(/설사\D{0,4}(\d{1,2})\s*(?:번|회)/)))rec.diarrhea=m[1];else if(/설사/.test(t)&&!/설사\s*(없|안)/.test(t))rec.diarrhea=rec.diarrhea||'1';
  if((m=t.match(/(?:구토|토했|토함|토)\D{0,4}(\d{1,2})\s*(?:번|회)/)))rec.vomit=m[1];else if(/구토|토했|토함/.test(t))rec.vomit='1';
  if(/혈변|검은\s*변|변에\s*피|짜장\s*같은\s*변/.test(t))rec.bowel='혈변·검은변';else if(/변비/.test(t))rec.bowel='변비';
  var distress=null;if((m=t.match(/(?:기분|마음|불안|우울|스트레스|힘듦|괴로움)\D{0,5}(\d{1,2})\s*점/))&&+m[1]<=10)distress=+m[1];
  var sx=[];[['오한',/오한|으슬/],['기침',/기침/],['숨참',/숨\s*차|숨이\s*차/],['입안 염증',/입안|입\s*안이|구내염/],['손발 저림',/저림|저려/],['발진',/발진|두드러기/],['부종',/부종|붓/],['피로',/피곤|피로|기운\s*없/],['메스꺼움',/메스|울렁|구역/],['어지럼',/어지/],['불면',/잠\s*(을\s*)?못|불면/],['출혈',/코피|잇몸\s*피|멍/]].forEach(function(s){if(s[1].test(t))sx.push(s[0])});
  if(Object.keys(rec).length||sx.length||distress!=null||/^메모\s*[:：]?/.test(t)){
    var L=state.logs.find(function(x){return x.date===logDate});
    if(!L){L={id:uid(),date:logDate,temp:'',weight:'',pain:'',meal:'',water:'',steps:'',bowel:'',note:'',createdAt:Date.now()};state.logs.push(L)}
    var LBL2={temp:['체온','℃'],pain:['통증','/10'],weight:['체중','kg'],meal:['식사','%'],water:['수분','mL'],steps:['걸음',''],diarrhea:['설사','회'],vomit:['구토','회'],bowel:['배변','']};
    Object.keys(rec).forEach(function(k){
      if(k==='diarrhea'||k==='vomit'){var cnt=new RegExp((k==='diarrhea'?'설사':'(?:구토|토)')+'\\D{0,4}\\d{1,2}\\s*(?:번|회)').test(t);L[k]=String(cnt?Math.max(+rec[k],+L[k]||0):(+L[k]||0)+1)}else L[k]=rec[k];
      out.saved.push(LBL2[k][0]+' '+L[k]+LBL2[k][1])});
    var memoTxt=t.replace(/^메모\s*[:：]?\s*/,'');
    if(sx.length||/^메모/.test(t)){var stamp=new Date();var line=pad(stamp.getHours())+':'+pad(stamp.getMinutes())+' '+memoTxt;L.note=[L.note,line].filter(Boolean).join(' / ').slice(-600);if(sx.length)out.saved.push('증상 · '+sx.join(', '));else out.saved.push('메모');}
    if(distress!=null){state.distress.unshift({id:uid(),date:logDate,score:distress});state.distressValue=distress;out.saved.push('마음 온도계 '+distress+'/10');if(distress>=7)out.alerts.push('distressHigh')}
    state.logs.sort(function(a,b){return b.date.localeCompare(a.date)});
    if(logDate!==today())out.saved.push('('+fmt(logDate)+' 기록)');
    out.handled=true;out.undo=true;
    /* 안전 판단 */
    var T=+L.temp,P=+L.pain;
    if('temp' in rec){if(T>=38)out.alerts.push('fever');else if(T>=37.5)out.alerts.push('lowfever')}
    if('bowel' in rec&&L.bowel==='혈변·검은변')out.alerts.push('blood');
    if('pain' in rec&&P>=7)out.alerts.push('pain7');
    if(('diarrhea' in rec||'vomit' in rec)&&(+L.diarrhea>=4||+L.vomit>=3))out.alerts.push('gi');
    if('meal' in rec&&+L.meal<=50)out.alerts.push('meal');
    if(sx.indexOf('숨참')>=0||sx.indexOf('출혈')>=0)out.alerts.push('askSOS');
    if(sx.indexOf('오한')>=0&&!L.temp)out.alerts.push('chill');
  }
  if(emerg){out.cards.unshift({kind:'emergency'});out.handled=true}
  if(out.handled)return out;

  /* 6) 정보 안내 */
  var topic=findTopic(t);
  if(topic){out.cards.push({kind:'topic',topic:topic});out.handled=true;return out}
  out.cards.push({kind:'fallback',text:t});return out;
}
function findTopic(text){
  var t=String(text||'').toLowerCase().replace(/\s+/g,''),best=null,bs=0;
  KB.TOPICS.forEach(function(tp){var s=0;if(t.indexOf(tp.q.replace(/\s+/g,''))>=0)s+=5;tp.kw.forEach(function(k){if(t.indexOf(k.replace(/\s+/g,'').toLowerCase())>=0)s+=k.length>=3?3:2});if(s>bs){bs=s;best=tp}});
  return bs>=2?best:null;
}

/* ═════════ 대화 렌더 ═════════ */
var chat=[];try{chat=JSON.parse(localStorage.getItem(CHAT_KEY)||'[]')}catch(e){chat=[]}
var lastSnapshot=null;
function saveChat(){chat=chat.slice(-60);try{localStorage.setItem(CHAT_KEY,JSON.stringify(chat))}catch(e){}}
function scrollBottom(){window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}
function linkBtns(links){return (links||[]).map(function(l){return '<button type="button" onclick="'+esc(l[1])+'">'+esc(l[0])+'</button>'}).join('')}
function callBtns(){var p=state.profile,h='';
  if(p.dayPhone)h+='<a href="'+tel(p.dayPhone)+'" class="danger">📞 병원 '+esc(p.dayPhone)+'</a>';
  if(p.nightPhone)h+='<a href="'+tel(p.nightPhone)+'" class="danger">📞 야간·응급 '+esc(p.nightPhone)+'</a>';
  if(!p.dayPhone&&!p.nightPhone)h+='<button type="button" onclick="openSheet(\'settings\')">병원 연락처 등록</button>';
  return h+'<a href="tel:119">🚑 119</a>'}
var ALERT={
  fever:['red','<b>체온이 38.0℃ 이상입니다.</b><br>항암·면역·표적치료 중이라면 밤이든 주말이든 <b>지금 치료병원에 연락</b>하세요. 해열제로 먼저 내리지 마세요.',true],
  lowfever:['amber','37.5℃ 이상입니다. <b>1시간 뒤 같은 부위로 다시 재서</b> 알려 주세요. 오한이 있거나 38.0℃가 되면 바로 병원에 연락하세요.',false],
  blood:['red','<b>혈변·검은 변은 출혈 신호일 수 있습니다.</b> 지금 치료병원이나 응급실에 연락하세요.',true],
  pain7:['red','<b>통증 7점 이상입니다.</b> 처방받은 진통제로 조절되지 않으면 지금 치료병원에 연락해 지침을 받으세요.',true],
  gi:['amber','설사·구토가 잦습니다. 물도 못 마시거나 소변이 줄면 바로, 아니어도 <b>오늘 안에</b> 의료진과 상담하세요.',true],
  meal:['amber','식사량이 평소의 절반 이하입니다. 하루 이상 이어지면 의료진·영양사와 상담하세요.',false],
  askSOS:['amber','숨참이나 출혈이 있다면 정도를 확인해야 합니다. 응급 판단 화면을 함께 봐 주세요.',false],
  chill:['amber','오한이 있으면 <b>체온을 재서 알려 주세요.</b> 38.0℃ 이상이면 바로 병원에 연락합니다.',false],
  distressHigh:['amber','마음 부담이 높습니다. 당신 잘못이 아닙니다. 오늘 의료진·심리상담·의료사회복지사에게 점수를 알려 주세요. 혼자 견디기 어렵다면 <a href="tel:109">109</a>(24시간)로 전화하세요.',false]
};
function botHTML(o,raw){
  var parts=[];
  o.cards.forEach(function(c){
    if(c.kind==='crisis')parts.push({cls:'red',html:'<b>'+esc(KB.CRISIS.title)+'</b>'+KB.CRISIS.body+'<div class="acts"><a href="tel:109" class="danger">📞 109 지금 전화</a><a href="tel:119">🚑 119</a></div>'});
    if(c.kind==='emergency')parts.push({cls:'red',html:'<b>먼저 확인하세요 — 급한 증상일 수 있어요</b><ul><li>숨이 몹시 차거나 가슴이 조임</li><li>의식이 흐려지거나 말·팔다리가 어눌함, 경련</li><li>멈추지 않는 출혈, 피를 토함</li><li>얼굴·입술·목이 부음</li></ul>해당되면 <b>지금 바로</b> 연락하세요. 숨쉬기 힘들거나 의식이 처지면 119가 우선입니다.<div class="acts">'+callBtns()+'<button type="button" onclick="openSheet(\'sos\')">응급 판단 화면</button></div>'});
  });
  if(o.saved.length){
    var h='<b>기록했어요 ✓</b><div class="saved">'+o.saved.map(function(s){return '<span>'+esc(s)+'</span>'}).join('')+'</div>';
    if(o.notes.length)h+='<p class="small muted" style="margin-top:8px">'+o.notes.map(esc).join('<br>')+'</p>';
    h+='<div class="acts">'+(o.undo?'<button type="button" class="undo" onclick="undoLast(this)">↩ 되돌리기</button>':'')+'</div>';
    parts.push({cls:'',html:h});
  }
  var reds=o.alerts.filter(function(a){return ALERT[a][0]==='red'}),ambs=o.alerts.filter(function(a){return ALERT[a][0]==='amber'});
  if(reds.length)parts.push({cls:'red',html:reds.map(function(a){return ALERT[a][1]}).join('<br><br>')+'<div class="acts">'+callBtns()+'</div>'});
  if(ambs.length)parts.push({cls:'amber',html:ambs.map(function(a){return ALERT[a][1]}).join('<br><br>')+(ambs.some(function(a){return ALERT[a][2]})||ambs.indexOf('askSOS')>=0?'<div class="acts">'+callBtns()+'<button type="button" onclick="openSheet(\'sos\')">응급 판단</button></div>':'')});
  o.cards.forEach(function(c){
    if(c.kind==='topic'){var tp=c.topic;parts.push({cls:tp.urgent?'red':'',html:'<b>'+esc(tp.q||tp.title)+'</b><div>'+tp.body+'</div><div class="acts">'+linkBtns(tp.links)+'</div><p class="small muted" style="margin:8px 0 0">일반 안내입니다. 내 상황은 담당 의료진과 확인하세요.</p>'})}
    if(c.kind==='fallback')parts.push({cls:'',html:'제가 정확히 이해하지 못했어요. 이렇게 써 보세요.<ul><li>열 37.8 / 통증 5점 / 밥 반 먹음</li><li>다음주 화요일 10시 항암 3차</li><li>타그리소 아침 1알 시작</li><li>질문: 운동해도 되나요?</li></ul><div class="acts"><button type="button" onclick="saveAsMemo(this)" data-t="'+esc(c.text)+'">📝 이대로 메모로 저장</button><button type="button" onclick="saveAsQ(this)" data-t="'+esc(c.text)+'">❓ 질문으로 저장</button></div>'});
    if(c.kind==='nextSched'){var up=upcoming();parts.push({cls:'',html:up.length?'<b>다가오는 일정</b><ul>'+up.slice(0,5).map(function(x){return '<li>'+fmt(x.date)+(x.time?' '+x.time:'')+' · '+esc(x.title)+' <span class="small muted">('+dday(x.date)+')</span></li>'}).join('')+'</ul>':'예정된 일정이 없어요. "10월 20일 오전 9시 CT"처럼 알려 주세요.'})}
    if(c.kind==='medList'){var act=state.meds.filter(function(m){return m.active==='yes'});parts.push({cls:'',html:act.length?'<b>복용 중인 약</b><ul>'+act.map(function(m){return '<li>'+esc(m.name)+' '+esc(m.dose||'')+(m.schedule?' · '+esc(m.schedule):'')+'</li>'}).join('')+'</ul>':'등록된 약이 없어요. "약: 타그리소 아침 1알"처럼 알려 주세요.'})}
    if(c.kind==='goSummary'){parts.push({cls:'',html:'진료요약을 열게요.<div class="acts"><button type="button" onclick="tab(\'summary\')">📄 진료요약 보기</button></div>'})}
    if(c.kind==='recent'){var l=state.logs[0];parts.push({cls:'',html:l?'<b>'+fmt(l.date)+' 기록</b><br>'+logLine(l):'아직 기록이 없어요.'})}
    if(c.kind==='askMed'){parts.push({cls:'',html:'약 이름을 함께 알려 주세요. 예) "약: 젤로다 아침저녁 3알" (처방전·약봉투에 적힌 이름 그대로)'})}
  });
  if(!parts.length)parts.push({cls:'',html:'알겠어요.'});
  return parts;
}
function addMsg(who,html,cls,store){
  var el=document.createElement('div');el.className='msg '+who+(cls?' '+cls:'');el.innerHTML=html;$('#thread').appendChild(el);
  if(store!==false){chat.push({w:who,h:html,c:cls||'',at:Date.now()});saveChat()}
  return el;
}
function sendText(text){
  text=String(text||'').trim();if(!text)return;
  addMsg('me',esc(text));
  var snap=JSON.stringify(state);
  var o=interpret(text);
  if(o.undo){lastSnapshot=snap;save()}
  botHTML(o,text).forEach(function(p){addMsg('bot',p.html,p.cls)});
  renderHome();scrollBottom();
}
window.sendText=sendText;
function undoLast(btn){if(!lastSnapshot){toast('되돌릴 기록이 없어요');return}state=JSON.parse(lastSnapshot);lastSnapshot=null;save();btn.closest('.msg').querySelector('b').textContent='되돌렸어요 ↩';btn.remove();toast('방금 기록을 취소했어요');chat[chat.length-1]&&saveChat()}
window.undoLast=undoLast;
function saveAsMemo(btn){sendText('메모: '+btn.dataset.t);btn.closest('.acts').remove()}
window.saveAsMemo=saveAsMemo;
window.saveAsQ=function(btn){sendText('질문: '+btn.dataset.t);btn.closest('.acts').remove()};
function prefill(s){tab('today');var i=$('#input');i.value=s;i.focus();autoGrow()}
window.prefill=prefill;window.tab=tab;window.openSheet=openSheet;window.closeSheet=closeSheet;

/* 빠른 버튼 */
var QUICK={
  temp:['지금 체온은요? 숫자를 누르거나 직접 써 주세요.',['36.5','37.0','37.5','37.8','38.0','38.5'].map(function(v){return ['🌡️ '+v,'체온 '+v]})],
  pain:['통증은 몇 점인가요? (0 없음 ~ 10 상상할 수 있는 가장 심한 통증)',[0,1,2,3,4,5,6,7,8,9,10].map(function(v){return [String(v),'통증 '+v+'점']})],
  meal:['오늘 식사는 평소와 비교해 어느 정도 드셨어요?',[['거의 못 먹음','식사 거의 못 먹음'],['조금(¼)','식사 조금 먹음'],['절반','식사 반 먹음'],['대부분(¾)','식사 대부분 먹음'],['평소만큼','식사 다 먹음']]],
  sched:['일정을 말하듯 써 주세요.<br><span class="small muted">예) 다음주 화요일 오전 10시 항암 3차 · 10월 20일 CT · 모레 2시 외래</span>',[]],
  med:['약 이름과 먹는 시간을 써 주세요.<br><span class="small muted">예) 약: 젤로다 아침저녁 3알 · 진통제 중단</span>',[]],
  q:['진료 때 물어볼 것을 써 주세요. 진료요약에 모아 둘게요.<br><span class="small muted">예) 질문: 항암 중 운동해도 되나요? · 꼭 질문: CT 결과</span>',[]],
  sym:['어떤 증상이 걱정되세요?',KB.TOPICS.filter(function(x){return x.cat==='증상'||x.cat==='마음'}).map(function(x){return [x.q,x.q]})],
  help:null
};
document.querySelectorAll('#chips button').forEach(function(b){b.onclick=function(){
  var k=b.dataset.c;if(k==='help'){sendText('사용법');return}
  var q=QUICK[k];var html=q[0]+(q[1].length?'<div class="qr">'+q[1].map(function(x){return '<button type="button" data-s="'+esc(x[1])+'">'+esc(x[0])+'</button>'}).join('')+'</div>':'');
  addMsg('bot',html,'',false);
  if(k==='sched')prefill('');if(k==='med')prefill('약: ');if(k==='q')prefill('질문: ');
  scrollBottom();
}});
$('#thread').addEventListener('click',function(e){var b=e.target.closest('.qr button');if(!b)return;b.parentNode.querySelectorAll('button').forEach(function(x){x.disabled=true;x.style.opacity=x===b?1:.4});sendText(b.dataset.s)});
function autoGrow(){var i=$('#input');i.style.height='auto';i.style.height=Math.min(i.scrollHeight,120)+'px'}
$('#input').addEventListener('input',autoGrow);
$('#input').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#inbar').requestSubmit()}});
$('#inbar').addEventListener('submit',function(e){e.preventDefault();var v=$('#input').value;$('#input').value='';autoGrow();sendText(v)});
/* 음성 입력(지원 브라우저만) */
(function(){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;var mic=$('#mic');mic.hidden=false;var r=null;
  mic.onclick=function(){if(r){r.stop();return}r=new SR();r.lang='ko-KR';r.interimResults=false;mic.classList.add('rec');
    r.onresult=function(ev){var s=ev.results[0][0].transcript;$('#input').value=($('#input').value+' '+s).trim();autoGrow()};
    r.onend=function(){mic.classList.remove('rec');r=null};r.onerror=function(){mic.classList.remove('rec');r=null;toast('음성 입력을 쓸 수 없어요')};r.start()}})();

/* ═════════ 화면 렌더 ═════════ */
function upcoming(){return state.roadmap.filter(function(x){return x.status!=='done'&&x.date>=today()}).sort(function(a,b){return (a.date+(a.time||'')).localeCompare(b.date+(b.time||''))})}
function logLine(l){var a=[];if(l.temp)a.push('체온 '+l.temp+'℃');if(l.pain!=='')a.push('통증 '+l.pain+'/10');if(l.meal!=='')a.push('식사 '+l.meal+'%');if(l.weight)a.push('체중 '+l.weight+'kg');if(l.water)a.push('수분 '+l.water+'mL');if(+l.diarrhea)a.push('설사 '+l.diarrhea+'회');if(+l.vomit)a.push('구토 '+l.vomit+'회');if(l.bowel)a.push(l.bowel);if(l.steps)a.push(l.steps+'걸음');return esc(a.join(' · ')||'수치 없음')+(l.note?'<br><span class="small muted">'+esc(l.note)+'</span>':'')}
function isWarn(l){return +l.temp>=38||(l.pain!==''&&+l.pain>=7)||l.bowel==='혈변·검은변'||+l.diarrhea>=4||+l.vomit>=3}
function renderHome(){
  var p=state.profile,h=new Date().getHours();
  $('#hello').innerHTML=(p.name?esc(p.name)+'님, ':'')+(h<11?'좋은 아침이에요.':h<18?'오늘 하루 어떠세요?':'오늘 하루 고생 많으셨어요.')+'<br><span style="font-size:.72em;color:var(--muted);font-weight:800">오늘 몸 상태를 한 줄로 알려 주세요.</span>';
  var up=upcoming()[0], tl=state.logs.find(function(x){return x.date===today()}), hq=state.questions.filter(function(q){return !q.answer}).length;
  $('#tiles').innerHTML=
   '<button class="tile" onclick="tab(\'plan\')"><small>📅 다음 일정</small><b>'+(up?dday(up.date)+' · '+esc(up.title.slice(0,14)):'없음')+'</b></button>'+
   '<button class="tile" onclick="tab(\'log\')"><small>🩺 오늘 기록</small><b'+(tl&&isWarn(tl)?' style="color:var(--red)"':'')+'>'+(tl?(tl.temp?tl.temp+'℃ ':'')+(tl.pain!==''?'통증 '+tl.pain:'')||'기록함':'아직 없음')+'</b></button>'+
   '<button class="tile" onclick="planTab=\'qs\';renderPlan();tab(\'plan\')"><small>❓ 물어볼 것</small><b>'+hq+'개</b></button>';
  var c='';if(p.dayPhone)c+='<a class="btn line" href="'+tel(p.dayPhone)+'">📞 병원 전화</a>';if(p.nightPhone)c+='<a class="btn line" href="'+tel(p.nightPhone)+'">🌙 야간·응급</a>';
  if(!p.dayPhone&&!p.nightPhone)c='<button class="btn soft" style="grid-column:1/-1" onclick="openSheet(\'settings\')">📞 병원 연락처를 먼저 등록해 두세요</button>';
  $('#callrow').innerHTML=c;
}
var planTab='sched';
document.querySelectorAll('#planSeg button').forEach(function(b){b.onclick=function(){planTab=b.dataset.p;renderPlan()}});
function renderPlan(){
  document.querySelectorAll('#planSeg button').forEach(function(b){b.classList.toggle('on',b.dataset.p===planTab)});
  var el=$('#planBody'),h='';
  if(planTab==='sched'){
    var up=upcoming(),past=state.roadmap.filter(function(x){return x.status==='done'||x.date<today()}).sort(function(a,b){return b.date.localeCompare(a.date)});
    h='<div class="card"><h3>다가오는 일정</h3>'+(up.length?up.map(schedItem).join(''):'<div class="empty">예정된 일정이 없어요.</div>')+
      '<form class="addline three" onsubmit="addSched(event)"><input type="date" name="date" value="'+today()+'" required><input name="title" placeholder="예) 항암 3차 / CT" required><button class="btn primary sm">추가</button></form>'+
      '<p class="small muted" style="margin:8px 0 0">💬 오늘 탭에서 "모레 10시 외래"처럼 말해도 돼요.</p></div>'+
      (past.length?'<div class="card"><h3>지난 일정</h3>'+past.slice(0,20).map(schedItem).join('')+'</div>':'');
  }else if(planTab==='meds'){
    var act=state.meds.filter(function(m){return m.active==='yes'}),stop=state.meds.filter(function(m){return m.active!=='yes'});
    h='<div class="card"><h3>복용 중인 약</h3>'+(act.length?act.map(medItem).join(''):'<div class="empty">등록된 약이 없어요.</div>')+
      '<form class="addline" onsubmit="addMed(event)"><input name="t" placeholder="예) 젤로다 아침저녁 3알" required><button class="btn primary sm">추가</button></form>'+
      '<p class="small muted" style="margin:8px 0 0">처방전·약봉투에 적힌 이름 그대로 적어 주세요. 영양제·한약도 함께 적으면 진료 때 도움이 됩니다.</p></div>'+
      (stop.length?'<div class="card"><h3>중단·종료한 약</h3>'+stop.map(medItem).join('')+'</div>':'');
  }else{
    var w={high:0,mid:1,low:2},qs=state.questions.slice().sort(function(a,b){return (a.answer?1:0)-(b.answer?1:0)||w[a.priority]-w[b.priority]||b.createdAt-a.createdAt});
    h='<div class="card"><h3>진료 때 물어볼 것</h3>'+(qs.length?qs.map(qItem).join(''):'<div class="empty">아직 없어요. 떠오를 때 바로 적어 두세요.</div>')+
      '<form class="addline" onsubmit="addQ(event)"><input name="t" placeholder="예) 항암 중 운동해도 되나요?" required><button class="btn primary sm">추가</button></form></div>';
  }
  el.innerHTML=h;
}
function schedItem(x){var done=x.status==='done';return '<div class="item'+(done?' done':'')+'"><div class="row between"><span class="pill '+(done?'gray':x.type==='치료'?'red':x.type==='검사'?'amber':'')+'">'+esc(x.type||'일정')+' · '+(done?'완료':dday(x.date))+'</span><span class="row" style="gap:6px"><button class="btn soft sm" onclick="toggleSched(\''+x.id+'\')">'+(done?'되살리기':'완료')+'</button><button class="btn line sm" onclick="delItem(\'roadmap\',\''+x.id+'\')">삭제</button></span></div><h4>'+esc(x.title)+'</h4><div class="meta">'+fmt(x.date)+(x.time?' '+x.time:'')+(x.memo?' · '+esc(x.memo):'')+'</div></div>'}
function medItem(m){var on=m.active==='yes';return '<div class="item"><div class="row between"><span class="pill '+(on?'green':'gray')+'">'+esc(m.type||'약')+' · '+(on?'복용 중':'중단')+'</span><span class="row" style="gap:6px"><button class="btn soft sm" onclick="toggleMed(\''+m.id+'\')">'+(on?'중단':'다시 복용')+'</button><button class="btn line sm" onclick="delItem(\'meds\',\''+m.id+'\')">삭제</button></span></div><h4>'+esc(m.name)+' '+esc(m.dose||'')+'</h4><div class="meta">'+esc(m.schedule||'복용 시간 미입력')+(m.memo?' · '+esc(m.memo):'')+'</div></div>'}
function qItem(q){return '<div class="item'+(q.answer?' done':'')+'"><div class="row between"><span class="pill '+(q.priority==='high'?'red':q.answer?'green':'')+'">'+(q.answer?'답변 받음':q.priority==='high'?'꼭 질문':'질문')+'</span><span class="row" style="gap:6px">'+(q.priority!=='high'&&!q.answer?'<button class="btn soft sm" onclick="starQ(\''+q.id+'\')">★ 꼭</button>':'')+'<button class="btn line sm" onclick="delItem(\'questions\',\''+q.id+'\')">삭제</button></span></div><h4 style="text-decoration:none;color:inherit">'+esc(q.question)+'</h4>'+
  '<div class="addline" style="margin-top:6px"><input placeholder="들은 답변 메모" value="'+esc(q.answer||'')+'" onchange="answerQ(\''+q.id+'\',this.value)"><span></span></div></div>'}
window.addSched=function(e){e.preventDefault();var f=e.target;state.roadmap.push({id:uid(),date:f.date.value,time:'',type:/항암|방사선|수술|주사/.test(f.title.value)?'치료':/CT|MRI|PET|검사|채혈|내시경/i.test(f.title.value)?'검사':'일정',title:f.title.value.trim(),memo:'',status:'planned',createdAt:Date.now()});save();toast('일정을 추가했어요')};
window.addMed=function(e){e.preventDefault();var v=e.target.t.value.trim();var o=interpret('약: '+v);if(!o.saved.length){state.meds.unshift({id:uid(),name:v,dose:'',schedule:'',purpose:'',type:'기타',active:'yes',memo:today()+' 시작',createdAt:Date.now()})}save();toast('약을 추가했어요')};
window.addQ=function(e){e.preventDefault();state.questions.unshift({id:uid(),question:e.target.t.value.trim(),priority:'mid',answer:'',createdAt:Date.now()});save();toast('질문을 추가했어요')};
window.toggleSched=function(id){var x=state.roadmap.find(function(r){return r.id===id});if(x){x.status=x.status==='done'?'planned':'done';save()}};
window.toggleMed=function(id){var x=state.meds.find(function(r){return r.id===id});if(x){x.active=x.active==='yes'?'no':'yes';x.memo=[x.memo,today()+(x.active==='yes'?' 재개':' 중단')].filter(Boolean).join(' · ');save()}};
window.starQ=function(id){var x=state.questions.find(function(r){return r.id===id});if(x){x.priority='high';save()}};
window.answerQ=function(id,v){var x=state.questions.find(function(r){return r.id===id});if(x){x.answer=v.trim();save();toast('답변을 저장했어요')}};
window.delItem=function(type,id){if(!confirm('삭제할까요?'))return;state[type]=state[type].filter(function(x){return x.id!==id});save()};

function renderLog(){
  var days=[];for(var i=13;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days.push(ymd(d))}
  var by={};state.logs.forEach(function(l){by[l.date]=l});
  var W=640,H=150,pl=30,pr=10,pt=10,pb=22,iw=W-pl-pr,ih=H-pt-pb,x=function(i){return pl+iw*i/13};
  var yT=function(v){return pt+ih*(1-(v-35.5)/(40-35.5))},yP=function(v){return pt+ih*(1-v/10)};
  var svg='<svg class="chart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="최근 14일 체온·통증 그래프">';
  svg+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yT(38)+'" y2="'+yT(38)+'" stroke="#d92d20" stroke-dasharray="4 4" stroke-width="1" opacity=".6"/><text x="2" y="'+(yT(38)+4)+'" font-size="10" fill="#d92d20">38℃</text>';
  days.forEach(function(d,i){var l=by[d];if(l&&l.meal!==''&&l.meal!=null){var mh=ih*(+l.meal/100)*.35;svg+='<rect x="'+(x(i)-7)+'" y="'+(pt+ih-mh)+'" width="14" height="'+mh+'" rx="3" fill="#8fb8f5" opacity=".55"/>'}
    if(i%2===0||i===13)svg+='<text x="'+x(i)+'" y="'+(H-6)+'" font-size="10" text-anchor="middle" fill="#7a8799">'+(+d.slice(8))+'</text>'});
  function line(key,y,col){var pts=[];days.forEach(function(d,i){var l=by[d];if(l&&l[key]!==''&&l[key]!=null&&!isNaN(+l[key]))pts.push([x(i),y(+l[key]),+l[key]])});
    if(!pts.length)return '';var s='<polyline fill="none" stroke="'+col+'" stroke-width="2.5" stroke-linejoin="round" points="'+pts.map(function(p){return p[0]+','+p[1]}).join(' ')+'"/>';
    pts.forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="#fff" stroke="'+col+'" stroke-width="2.5"/>'});return s}
  svg+=line('pain',yP,'#1467e8')+line('temp',yT,'#d92d20')+'</svg>';
  var has=days.some(function(d){return by[d]});
  $('#chart').innerHTML=has?svg:'<div class="empty">기록이 쌓이면 그래프가 그려져요.</div>';
  $('#chartNote').textContent=days[0].slice(5).replace('-','/')+' ~ 오늘';
  var a=state.logs.slice().sort(function(a,b){return b.date.localeCompare(a.date)});
  $('#logList').innerHTML=a.length?a.slice(0,30).map(function(l){return '<div class="logrow"><b'+(isWarn(l)?' style="color:var(--red)"':'')+'>'+fmt(l.date)+'</b><div>'+logLine(l)+'</div><button class="btn line sm" onclick="delItem(\'logs\',\''+l.id+'\')">삭제</button></div>'}).join(''):'<div class="empty">아직 기록이 없어요. 오늘 탭에서 "열 36.8 통증 2점"처럼 써 보세요.</div>';
  var dv=state.distress[0];$('#distress').value=dv?dv.score:state.distressValue||0;distressUI();
}
function distressUI(){var s=+$('#distress').value;$('#distressOut').textContent=s;var el=$('#distressAdvice');
  el.innerHTML=s>=7?'<span style="color:var(--red);font-weight:900">높은 부담입니다. 당신 잘못이 아니에요.</span> 오늘 의료진·심리상담·의료사회복지사에게 알려 주세요. 혼자 견디기 어렵다면 <a href="tel:109">109</a>(24시간 무료).':s>=4?'<span style="color:var(--amber);font-weight:900">도움이 필요할 수 있는 수준이에요.</span> 진료 때 이 점수를 알려 주세요.':'<span class="muted">변화가 있을 때마다 기록해 두세요.</span>'}
$('#distress').addEventListener('input',distressUI);
window.saveDistress=function(){var s=+$('#distress').value;state.distress.unshift({id:uid(),date:today(),score:s});state.distressValue=s;save();toast('마음 온도계 '+s+'점 기록')};

function renderSummary(){
  var p=state.profile,up=upcoming().slice(0,4),act=state.meds.filter(function(m){return m.active==='yes'});
  var since=new Date();since.setDate(since.getDate()-14);var s14=ymd(since);
  var logs=state.logs.filter(function(l){return l.date>=s14}).sort(function(a,b){return b.date.localeCompare(a.date)});
  var temps=logs.filter(function(l){return l.temp}).map(function(l){return +l.temp}),pains=logs.filter(function(l){return l.pain!==''}).map(function(l){return +l.pain});
  var meals=logs.filter(function(l){return l.meal!==''}).map(function(l){return +l.meal});
  var ws=state.logs.filter(function(l){return l.weight}).sort(function(a,b){return a.date.localeCompare(b.date)});
  var wchg=ws.length>=2?(+ws[ws.length-1].weight-+ws[0].weight).toFixed(1):null;
  var qs=state.questions.filter(function(q){return !q.answer}).sort(function(a,b){return (a.priority==='high'?0:1)-(b.priority==='high'?0:1)});
  var dv=state.distress[0];
  var flags=logs.filter(isWarn);
  var h='<div class="card sumhead"><div class="row between" style="align-items:flex-start"><div><div style="font-size:1.25em;font-weight:900">'+esc(p.name||'이름 미입력')+'</div><div class="muted small">'+esc([p.cancer,p.stage].filter(Boolean).join(' · ')||'암종·병기 미입력')+' · '+esc(p.treatment||'현재 치료 미입력')+'</div><div class="muted small">'+esc(p.hospital||'')+(p.biomarkers?' · '+esc(p.biomarkers):'')+'</div></div><div class="small muted" style="text-align:right">작성 '+fmt(today())+'<br>ApuDa 암환자 노트</div></div></div>';
  h+='<div class="card"><h3>🩺 최근 2주 몸 상태</h3>'+(logs.length?'<table><tr><th>체온</th><td'+(temps.some(function(v){return v>=38})?' class="warn"':'')+'>'+(temps.length?'최고 '+Math.max.apply(null,temps).toFixed(1)+'℃ · '+temps.length+'회 측정'+(temps.filter(function(v){return v>=38}).length?' · 38℃ 이상 '+temps.filter(function(v){return v>=38}).length+'회':''):'기록 없음')+'</td></tr>'+
    '<tr><th>통증</th><td'+(pains.some(function(v){return v>=7})?' class="warn"':'')+'>'+(pains.length?'평균 '+(pains.reduce(function(a,b){return a+b},0)/pains.length).toFixed(1)+' · 최고 '+Math.max.apply(null,pains)+'/10':'기록 없음')+'</td></tr>'+
    '<tr><th>식사량</th><td>'+(meals.length?'평균 '+Math.round(meals.reduce(function(a,b){return a+b},0)/meals.length)+'% (평소 대비)':'기록 없음')+'</td></tr>'+
    '<tr><th>체중</th><td>'+(ws.length?ws[ws.length-1].weight+'kg'+(wchg!==null?' (첫 기록 대비 '+(wchg>0?'+':'')+wchg+'kg)':''):'기록 없음')+'</td></tr>'+
    '<tr><th>마음 온도계</th><td'+(dv&&dv.score>=7?' class="warn"':'')+'>'+(dv?dv.score+'/10 ('+fmt(dv.date)+')':'기록 없음')+'</td></tr>'+
    (flags.length?'<tr><th>주의 기록</th><td class="warn">'+flags.map(function(l){return fmt(l.date)}).join(', ')+'</td></tr>':'')+'</table>':'<div class="empty">최근 2주 기록이 없어요.</div>')+'</div>';
  if(logs.length)h+='<div class="card"><h3>📋 날짜별 기록</h3><table>'+logs.slice(0,10).map(function(l){return '<tr><th>'+fmt(l.date)+'</th><td>'+logLine(l)+'</td></tr>'}).join('')+'</table></div>';
  h+='<div class="card"><h3>💊 복용 중인 약</h3>'+(act.length?'<table>'+act.map(function(m){return '<tr><th>'+esc(m.name)+'</th><td>'+esc([m.dose,m.schedule].filter(Boolean).join(' · ')||'-')+'</td></tr>'}).join('')+'</table>':'<div class="empty">등록된 약 없음</div>')+'</div>';
  h+='<div class="card"><h3>❓ 오늘 꼭 물어볼 것</h3>'+(qs.length?'<ol style="margin:0;padding-left:20px">'+qs.map(function(q){return '<li style="margin:4px 0">'+(q.priority==='high'?'<b>':'')+esc(q.question)+(q.priority==='high'?'</b>':'')+'</li>'}).join('')+'</ol>':'<div class="empty">적어둔 질문 없음</div>')+'</div>';
  h+='<div class="card"><h3>📅 다음 일정</h3>'+(up.length?'<table>'+up.map(function(x){return '<tr><th>'+fmt(x.date)+(x.time?' '+x.time:'')+'</th><td>'+esc(x.title)+'</td></tr>'}).join('')+'</table>':'<div class="empty">예정 일정 없음</div>')+'</div>';
  h+='<p class="note-foot">환자·보호자가 직접 기록한 내용입니다. 진단·처방 판단은 의료진이 합니다.</p>';
  $('#summary').innerHTML=h;
}

/* ═════════ 응급 시트 ═════════ */
var RED=[['red-fever','체온 38.0℃ 이상 또는 심한 오한','항암치료 중에는 감염을 빠르게 확인해야 합니다. 해열제로 먼저 내리지 마세요.'],['red-breath','숨이 몹시 차거나 가슴 통증, 입술이 파래짐','갑자기 생기거나 빠르게 나빠지는 경우'],['red-conscious','의식이 흐려짐 · 경련 · 갑자기 말이 어눌함','깨우기 어렵거나 혼동이 있는 경우 포함'],['red-bleed','멈추지 않는 출혈 · 피를 토함 · 혈변이나 검은 변','눌러도 계속되거나 어지럼이 함께 있는 경우'],['red-allergy','얼굴·입술·목이 붓거나 심한 알레르기 반응','숨쉬기 어렵거나 온몸 두드러기'],['red-dehydration','물을 못 마실 만큼 반복 구토 · 소변이 크게 줄어듦','심한 입마름·어지럼 등 탈수 증상'],['red-spine','갑자기 다리 힘이 빠지거나 감각 이상 · 대소변 조절 변화','새로 생긴 등·허리 통증과 함께면 더 급합니다']];
var AMB=[['amber-meal','식사량이 평소 절반 이하','하루 이상 이어지거나 체중이 줄 때'],['amber-gi','설사·구토가 반복되거나 갑자기 늘어남','치료 종류에 따라 더 빨리 연락해야 할 수 있어요'],['amber-pain','처방 진통제로도 조절되지 않는 통증','새로 생기거나 점점 심해질 때'],['amber-rash','새로운 발진 · 눈이나 피부가 노래짐 · 부종 · 저림 · 시야 변화','면역·표적치료 중에는 가벼워 보여도 일찍 상담'],['amber-mouth','입안 통증으로 먹거나 마시기 어려움','입안 헐음, 하얀 막, 출혈이 있을 때']];
function chkHTML(a,lv){return a.map(function(x){return '<label class="chk"><input type="checkbox" value="'+x[0]+'" data-level="'+lv+'"'+(state.triage.items.indexOf(x[0])>=0?' checked':'')+'><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></label>'}).join('')}
function renderSOS(){
  var p=state.profile,c='';
  c+=p.dayPhone?'<a class="btn red" href="'+tel(p.dayPhone)+'">📞 치료병원</a>':'<button class="btn line" onclick="openSheet(\'settings\')">병원 번호 등록</button>';
  c+=p.nightPhone?'<a class="btn red" href="'+tel(p.nightPhone)+'">🌙 야간·응급</a>':'<a class="btn line" href="https://www.e-gen.or.kr/egen/search_emergency_room.do" target="_blank" rel="noopener">🏥 가까운 응급실</a>';
  c+='<a class="btn red" href="tel:119">🚑 119</a><a class="btn line" href="tel:109">💙 109 마음 위기</a>';
  $('#sosCalls').innerHTML=c;$('#redList').innerHTML=chkHTML(RED,'red');$('#amberList').innerHTML=chkHTML(AMB,'amber');triage(true);
}
function triage(silent){
  var boxes=[].slice.call(document.querySelectorAll('#sh-sos [data-level]'));
  var items=boxes.filter(function(x){return x.checked}).map(function(x){return x.value});
  if(!silent){state.triage={items:items,at:items.length?Date.now():0};localStorage.setItem(KEY,JSON.stringify(state))}
  var red=items.filter(function(v){return v.indexOf('red')===0}).length,amb=items.length-red,el=$('#triageResult');
  if(red&&!silent)el.scrollIntoView({block:'nearest',behavior:'smooth'});if(red){el.className='result red';el.innerHTML='<b>지금 바로 치료병원 또는 응급실에 연락하세요.</b><br>혼자 운전해서 가지 말고, 숨쉬기 힘들거나 의식이 처지면 119를 부르세요. 연락할 때 체온·증상 시작 시각·마지막 치료 날짜를 함께 말하면 빠릅니다.'}
  else if(amb){el.className='result amber';el.innerHTML='<b>오늘 안에 치료병원에 상담하세요.</b><br>증상이 빠르게 나빠지면 바로 연락하거나 응급실로 가세요.'}
  else{el.className='result none';el.textContent='해당하는 항목이 없으면 기록을 이어가고, 변화가 생기면 다시 확인하세요.'}
}
$('#sh-sos').addEventListener('change',function(e){if(e.target.matches('[data-level]'))triage()});

/* ═════════ 설정 ═════════ */
function fillProfile(){var f=$('#profileForm');Object.keys(defaultState.profile).forEach(function(k){if(f[k])f[k].value=state.profile[k]||''})}
$('#profileForm').addEventListener('submit',function(e){e.preventDefault();var f=e.target;Object.keys(defaultState.profile).forEach(function(k){if(f[k])state.profile[k]=f[k].value.trim()});save();closeSheet();toast('내 정보를 저장했어요')});
window.exportData=function(){var b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='ApuDa_암환자노트_백업_'+today()+'.json';document.body.appendChild(a);a.click();a.remove();state.meta=state.meta||{};state.meta.lastBackup=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state));toast('백업 파일을 저장했어요')};
window.importData=function(inp){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);if(!validBackup(d))throw 0;if(!confirm('지금 기록을 백업 파일 내용으로 바꿀까요?'))return;localStorage.setItem(KEY,JSON.stringify(d));state=load();renderAll();closeSheet();toast('백업을 불러왔어요')}catch(e){alert('ApuDa 노트 백업 파일이 아니에요.')}};r.readAsText(f);inp.value=''};
window.resetAll=function(){if(!confirm('모든 기록을 삭제할까요? 되돌릴 수 없습니다.'))return;localStorage.removeItem(KEY);localStorage.removeItem(CHAT_KEY);state=clone(defaultState);chat=[];$('#thread').innerHTML='';renderAll();greet();closeSheet();toast('모두 삭제했어요')};

function renderAll(){renderHome();renderPlan();renderLog();renderSummary();renderSOS()}

/* ═════════ 시작 ═════════ */
function greet(){
  var p=state.profile,first=!state.logs.length&&!state.roadmap.length&&!state.meds.length;
  var h=first?'<b>안녕하세요, ApuDa 노트봇이에요.</b><br>말하듯이 쓰면 제가 정리해 둘게요.<ul><li>"열 37.8, 통증 3점"</li><li>"다음주 화요일 10시 항암 3차"</li><li>"약: 젤로다 아침저녁 3알"</li><li>"질문: 항암 중 운동해도 되나요?"</li></ul>먼저 <b>병원 연락처</b>를 알려 주시면 급할 때 바로 전화 버튼을 보여드려요.<div class="acts"><button type="button" onclick="prefill(\'병원 전화 \')">📞 병원 전화 등록</button><button type="button" onclick="openSheet(\'settings\')">내 정보 한 번에 입력</button></div>'
    :'<b>'+(p.name?esc(p.name)+'님, ':'')+'오늘 상태를 알려 주세요.</b><div class="qr">'+[['🌡️ 체온','temp'],['😣 통증','pain'],['🍚 식사','meal']].map(function(x){return '<button type="button" onclick="document.querySelector(\'#chips [data-c='+x[1]+']\').click()">'+x[0]+'</button>'}).join('')+'</div>';
  addMsg('bot',h,'',false);
}
(function init(){
  chat.slice(-30).forEach(function(m){var el=addMsg(m.w,m.h,m.c,false);el.querySelectorAll('.undo,.qr button').forEach(function(b){b.remove()})});
  if(chat.length){var sep=document.createElement('div');sep.className='small muted';sep.style.textAlign='center';sep.textContent='— 이전 대화 —';$('#thread').appendChild(sep)}
  renderAll();greet();
  var q=new URLSearchParams(location.search);if(q.get('tab'))tab(q.get('tab'));
  var say=q.get('say');if(say!==null){history.replaceState(null,'',location.pathname+location.hash);if(/[:：]\s*$/.test(say)||say.trim().length<3)prefill(say);else setTimeout(function(){sendText(say)},120)}
  if(location.hash==='#sos')openSheet('sos');
  setTimeout(function(){window.scrollTo(0,document.body.scrollHeight)},60);
})();
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){})});
  var hadCtrl=!!navigator.serviceWorker.controller,reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(!hadCtrl||reloaded)return;reloaded=true;location.reload()});
}
