/* ApuDa 암환자 노트 v3.0 — 노트봇 중심 단순화 버전
 * - 저장소: localStorage['apuda_cancer_care_v1'] (기존 v2 데이터 그대로 이어 씀)
 * - 서버 전송 없음. 노트봇은 기기 안 규칙 기반으로 동작(오프라인 가능).
 * - 진단·처방·용량 판단을 하지 않는다. 위기(자해) → 응급 → 기록 → 정보 순으로 처리한다. */
'use strict';
var KEY='apuda_cancer_care_v1', CHAT_KEY='apuda_note_chat_v1', FONT_KEY='apuda_note_font';
var KB=window.NOTE_KB;
var defaultState={profile:{name:'',cancer:'',stage:'',treatment:'',goal:'',cycle:'',hospital:'',dayPhone:'',nightPhone:'',biomarkers:'',devices:[],rxCombo:[],rxPlan:[],rxStep:0,rxSince:''},checks:{},
  roadmap:[],meds:[],logs:[],labs:[],questions:[],supports:[],distress:[],triage:{items:[],at:0},distressValue:0,meta:{lastBackup:''}};
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
    if(!s.triage||!Array.isArray(s.triage.items))s.triage={items:[],at:0};if(!Array.isArray(s.labs))s.labs=[];if(!s.checks||typeof s.checks!=='object')s.checks={};['devices','rxCombo','rxPlan'].forEach(function(k){if(!Array.isArray(s.profile[k]))s.profile[k]=[]});return s}catch(e){return clone(defaultState)}
}
var state=load();
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function $(s){return document.querySelector(s)}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function pad(n){return String(n).padStart(2,'0')}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function today(){return ymd(new Date())}
var CHEMO_RE=/항암|키모|주사\s*치료|투약|호르몬\s*주사/;
function chemoDates(){var a=chemoDatesAll(),sn=state.profile.rxSince;return sn?a.filter(function(d){return d>=sn}):a}
function chemoDatesAll(){return state.roadmap.filter(function(r){return CHEMO_RE.test(r.title||'')&&r.date<=today()&&(r.status==='done'||r.date<=today())}).map(function(r){return r.date}).sort()}
var RXDB=window.APUDA_RX||null;
function myRx(){if(!RXDB||!state.profile.regimen)return null;var r=RXDB.byId(state.profile.regimen);if(!r)return null;
  if(r.opts){var oi=state.profile.rxOpt,o=(oi!=null)?r.opts[oi]:null;if(!o)return Object.assign({},r,{cycle:0,oral:null,_needOpt:true});return Object.assign({},r,o,{_opt:o.label})}return r}
function startsOf(rx,ds){var st=[],cur=null,dz=rx.days||[1];ds.forEach(function(x){var o=cur?dayDiff(cur,x):0;
  var same=cur&&o<rx.cycle-3&&dz.some(function(dd){return dd>1&&Math.abs(o-(dd-1))<=3});if(!cur||!same){cur=x;st.push(x)}});return st}
function setRegimen(id,stepChange){var p=state.profile;if(p.regimen!==id){var had=!!p.regimen;p.regimen=id;p.rxOpt=null;p.rxCombo=[];if(had&&stepChange)p.rxSince=today();
    if(!p.rxPlan.length||p.rxPlan.indexOf(id)<0){if(stepChange&&had){if(!p.rxPlan.length)p.rxPlan=[];p.rxPlan.push(id);p.rxStep=p.rxPlan.length-1}else{p.rxPlan=[id];p.rxStep=0}}else p.rxStep=p.rxPlan.indexOf(id)}}
function comboFrom(top,mainId){if(!top||!RXDB)return [];var o=[],cp=RXDB.COMP[mainId],inMain={};(cp?cp.c:[]).forEach(function(g){g.forEach(function(x){inMain[x]=1})});
  (top.found||[]).forEach(function(k){var cid=RXDB.COMBO[k];if(cid&&!inMain[k]&&cid!==mainId&&o.indexOf(cid)<0)o.push(cid)});return o}
function addCombos(ids){ids.forEach(function(id){if(state.profile.rxCombo.indexOf(id)<0)state.profile.rxCombo.push(id)})}
function rxCtx(){return state.profile.cancer||''}
function NS(){return RXDB?'<p class="nshort">ⓘ '+esc(RXDB.NOTICE_SHORT)+'</p>':''}
function isInj(rx){return !!(rx&&rx.type==='호르몬'&&rx.opts)}
function dayDiff(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5)}
function addDays(s,n){var d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return ymd(d)}
function chemoDay(onDate){var d=onDate||today(),last=null,rx=myRx(),lim=Math.max(35,rx&&rx.cycle?rx.cycle+14:0);chemoDates().forEach(function(x){if(x<=d)last=x});if(!last)return null;var n=dayDiff(last,d);return n<=lim?{n:n,date:last}:null}
/* 오늘이 주기의 며칠째인지: 1·8·15일처럼 여러 날 투여하는 요법은 주기 1일째 기준 */
function cday(onDate){var d=onDate||today(),c=chemoDay(d),rx=myRx();if(!c)return null;
  if(rx&&rx.cycle&&(rx.days||[1]).length>1){var st=startsOf(rx,chemoDates().filter(function(x){return x<=d}));var s0=st[st.length-1];return {n:dayDiff(s0,d),date:s0,cyc:true}}return c}
function dLbl(c){var rx=myRx();return c.cyc?'주기 '+(c.n+1)+'일째':(isInj(rx)?'주사 후 ':'항암 ')+'D+'+c.n}
function dTag(onDate){var c=cday(onDate);return c?dLbl(c):''}
function nadirOf(){var rx=myRx();return rx?rx.nadir:[7,14]}
function inNadir(onDate){var c=cday(onDate),nd=nadirOf();return !!(c&&nd&&c.n>=nd[0]&&c.n<=nd[1])}
function lastChemo(){var ds=chemoDatesAll();return ds.length?ds[ds.length-1]:''}
function cycleTxt(r){if(!r)return '';if(r.once)return '대개 1회 치료';if(r._needOpt&&r.opts)return '간격 선택 필요 ('+r.opts.map(function(o){return o.label}).join(' / ')+')';if(r._opt&&!r.oral)return r._opt;if(r.oral&&r.cycle)return r.oral.on+'일 복용 · '+r.oral.off+'일 휴약 ('+r.cycle+'일 주기)';if(!r.cycle)return '매일 또는 정해진 간격';var d=r.days||[1];return (r.cycle%7===0?(r.cycle/7)+'주':r.cycle+'일')+' 간격'+(d.length>1?' · '+d.join('·')+'일째 투여':'')}
/* 주기 계산: 같은 주기 안의 투여(1·8·15일 등)를 묶고 다음 투여 예상일을 낸다 */
function cycleInfo(){var rx=myRx(),ds=chemoDates();if(!rx||!rx.cycle||!ds.length)return null;
  var starts=startsOf(rx,ds);
  var no=0,numbered=false;starts.forEach(function(sd){var it=state.roadmap.filter(function(r){return r.date===sd&&CHEMO_RE.test(r.title||'')})[0],mm=it&&String(it.title).match(/(\d{1,2})\s*차/);if(mm){no=+mm[1];numbered=true}else no++});
  var st=starts[starts.length-1],last=ds[ds.length-1],off=dayDiff(st,last);
  var next=null,nextDay=1,nextNo=no;(rx.days||[1]).forEach(function(dd){if(next===null&&dd-1>off+1){next=addDays(st,dd-1);nextDay=dd}});
  if(next===null){next=addDays(st,rx.cycle);nextNo=no+1;nextDay=1}
  var booked=state.roadmap.filter(function(r){return r.status!=='done'&&CHEMO_RE.test(r.title||'')&&r.date>today()}).sort(function(a,b){return a.date.localeCompare(b.date)})[0];
  return {rx:rx,numbered:numbered,start:st,no:no,next:next,nextNo:nextNo,nextDay:nextDay,t:dayDiff(st,today()),booked:booked||null}}
function oralLbl(ci){var r=ci&&ci.rx;if(!r||!r.oral||ci.t<0||ci.t>=r.cycle)return '';return ci.t<r.oral.on?'복용 '+(ci.t+1)+'일째':'휴약 '+(ci.t-r.oral.on+1)+'일째'}
function mdTxt(s){return (+s.slice(5,7))+'월 '+(+s.slice(8))+'일'}
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
function openSheet(n){closeSheet();$('#sh-'+n).classList.add('open');if(n==='settings')fillProfile();if(n==='er')renderER()}
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
  if((m=hit(/(다음\s*달|담달)\s*(\d{1,2})\s*일/))){var nm=new Date(now.getFullYear(),now.getMonth()+1,+m[2]);return {date:ymd(nm),used:used}}
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
var PAIN_SITE=[['두통',/두통|머리\s*(가|이)?\s*(아|지끈|깨질|욱신)/],['복통',/복통|배\s*(가|가\s*살살|이)?\s*(아|쑤|뒤틀|살살|꼬)/],['명치·윗배',/명치|윗배/],['가슴',/가슴\s*(이|가)?\s*(아|통|답답|쑤)|흉통/],['허리·등',/허리|등\s*(이|가|쪽)?\s*(아|결|쑤)/],['옆구리',/옆구리/],['다리',/다리|무릎|종아리|허벅지|발목/],['팔·어깨',/어깨|팔\s*(이|가)?\s*(아|쑤)/],['뼈·관절',/뼈|관절|골반/],['목·입안',/목\s*(이|구멍)?\s*(아|따)|인후|입안\s*(이)?\s*아/],['수술 부위',/수술\s*(부위|한\s*곳|자리)|상처/],['주사·포트 부위',/포트|케모포트|주사\s*(부위|맞은\s*곳)/]];
var DOSE_RE=/(타이레놀|아세트아미노펜|해열제|진통제|이부프로펜|덱시부프로펜|부루펜|애드빌|구토약|멀미약|지사제|로페라마이드|변비약|수면제|수면유도제|안정제|소화제|위장약|마약성\s*진통제|옥시코돈|울트라셋|트라마돌|진통\s*패치)/;
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
    if(prof.treatment&&RXDB){var prs=RXDB.findSure(prof.treatment,rxCtx());if(prs.r)out.cards.push({kind:'rxInfo',id:prs.r.id,basis:prs.top.drugs});else if(prs.amb)out.cards.push({kind:'rxPick',ids:prs.list.map(function(x){return x.r.id})})}
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
    if(found){found.active='no';found.memo=[found.memo,today()+' 중단'].filter(Boolean).join(' · ');out.saved.push('약 중단 · '+found.name);out.handled=true;out.undo=true;return out}
    if(!/항암\s*\d|체온|통증\s*\d/.test(t)){out.cards.push({kind:'stopUnknown',text:t});out.handled=true;return out}}
  var isMedAdd=/^약\s*[:：]?\s*\S|약\s*추가|처방\s*(받|됐|나왔|해\s*줬|약)|\S{2,}\s*처방\s*$|먹기\s*시작|복용\s*시작|새로\s*(먹|복용)|시작했|시작\s*(함|해|해요)?\s*$|(을|를)?\s*복용\s*중/.test(t)&&!/항암\s*\d+\s*차/.test(t)&&!/항암\s*(을|를|이|도)?\s*시작|암이고|암\s*진단/.test(t);
  if(isMedAdd&&!/체온|통증|설사|구토/.test(t)){
    var body=t.replace(/^약\s*[:：]?\s*/,'').replace(/약\s*추가\s*[:：]?/,'');
    var dose=(body.match(/\d+(?:\.\d+)?\s*(?:알|정|mg|밀리그램|밀리|캡슐|포|ml|mL|cc|방울|매|개)/i)||[''])[0];
    var sch=(body.match(/(?:하루\s*\d\s*(?:번|회)|아침\s*(?:저녁|점심)?|점심|저녁|자기\s*전|취침\s*전|식후|식전|공복|\d+\s*시간\s*마다|필요할\s*때|아플\s*때)(?:\s*(?:에|마다))?/g)||[]).join(' ');
    var name=body.split(/\s|(?=\d)|아침|점심|저녁|하루|자기|취침|식후|식전|공복|처방|먹기|복용|시작|새로|을|를/)[0]||'';
    name=name.replace(/[,.:]/g,'').trim();
    if(name.length<2){out.cards.push({kind:'askMed'});out.handled=true;return out}
    var type=/진통|마약|패치|옥시|모르핀|타이레놀|트라마/.test(name)?'통증약':/구토|멀미|온단|아킨지오|에멘드/.test(name)?'구토 예방약':/스테로이드|덱사|소론도/.test(name)?'스테로이드':/항암|타그리소|렉라자|입랜스|키스칼리|버제니오|젤로다|티에스원|론서프|타목시펜|페마라|아리미덱스|자이티가|엑스탄디|얼리다|뉴베카|린파자/.test(name)?'항암·표적·호르몬제':'기타';
    state.meds.unshift({id:uid(),name:name,dose:dose,schedule:sch.trim(),purpose:'',type:type,active:'yes',memo:today()+' 시작',createdAt:Date.now()});
    var mrs=RXDB?RXDB.findSure(t,rxCtx()):{r:null};if(mrs.r&&!state.profile.regimen)out.cards.push({kind:'rxInfo',id:mrs.r.id,basis:mrs.top.drugs});
    out.saved.push('약 · '+name+(dose?' '+dose:'')+(sch?' · '+sch.trim():''));out.handled=true;out.undo=true;
    out.notes.push('복용량·시간은 처방전 그대로인지 한 번 더 확인해 주세요. 약 조절은 의료진과 상의하세요.');return out}

  /* 3.4) 항암 요법 등록·조회 */
  var rxS=RXDB?RXDB.findSure(t,rxCtx()):{r:null,list:[]},rxHit=rxS.r||(rxS.amb&&rxS.list[0]?rxS.list[0].r:null), doneRe=/(맞았|맞음|받았|받음|했어|했음|끝났|끝남|하고\s*왔|다녀왔|시작했)/;
  if(rxHit&&!doneRe.test(t)&&!/체온|열\s*\d|통증|아파|설사|구토|저림|저려|숨|먹었|식사|밥|혈압|배\s*둘레|수면|잠\s*\d|방사선\s*\d|\d+\s*(점|도|회|번)|\d+\s*\/\s*\d+/.test(t)){
    var reg=/변경|바꿨|바꿈|바뀌|전환|요법|항암\s*(은|는|제|이)|치료\s*(는|은|중)|맞고\s*있|하고\s*있|쓰고\s*있|먹고\s*있|받고\s*있|등록|(이야|예요|이에요|입니다|해요|중)\s*$/.test(t);
    var ask=/부작용|주의|관리|뭐야|뭐예요|어때|알려|언제|정보|\?/.test(t);
    if(rxS.amb){out.cards.push({kind:'rxPick',ids:rxS.list.map(function(x){return x.r.id})});out.handled=true;return out}
    if(reg&&(!ask||!state.profile.regimen)){setRegimen(rxHit.id,/변경|바꿨|바꿈|바뀌|바꾸|전환|넘어/.test(t));var cbs=comboFrom(rxS.top,rxHit.id);addCombos(cbs);out.saved.push('항암 요법 · '+rxHit.name+(cbs.length?' + '+cbs.map(function(x){return RXDB.byId(x).ko}).join(', '):''));out.undo=true;
      out.notes.push('이제 항암 받은 날을 알려 주시면 다음 항암 예상일과 시기별 주의사항을 이 요법에 맞춰 보여드려요.')}
    out.cards.push({kind:'rxInfo',id:rxHit.id,basis:rxS.top&&rxS.top.drugs});out.handled=true;return out}

  /* 3.5) 항암 받은 날 기록 */
  var injDone=rxHit&&isInj(rxHit)&&/주사/.test(t);
  if((/항암|키모/.test(t)||injDone||rxHit&&rxHit.type!=='호르몬'&&!/먹었|먹기/.test(t))&&doneRe.test(t)&&!/물어|질문|\?/.test(t)){
    if(rxS.r&&state.profile.regimen!==rxS.r.id){setRegimen(rxS.r.id);addCombos(comboFrom(rxS.top,rxS.r.id));out.saved.push('항암 요법 · '+rxS.r.name)}else if(rxS.r)addCombos(comboFrom(rxS.top,rxS.r.id));else if(rxS.amb&&!state.profile.regimen)out.cards.push({kind:'rxPick',ids:rxS.list.map(function(x){return x.r.id})});
    var cdt=(parseDate(t)||{}).date||today();if(cdt>today())cdt=today();
    var cyc=(t.match(/(\d{1,2})\s*(?:차|회차|사이클|번째)/)||[])[1];
    var ttl=(injDone?'호르몬 주사':'항암')+(cyc?' '+cyc+'차':'');
    var ex=state.roadmap.find(function(r){return r.date===cdt&&CHEMO_RE.test(r.title||'')});
    if(ex){ex.status='done';if(cyc&&!/차/.test(ex.title))ex.title=ttl}else state.roadmap.push({id:uid(),date:cdt,time:'',type:'치료',title:ttl,memo:'',status:'done',createdAt:Date.now()});
    out.saved.push((injDone?'주사 받은 날 · ':'항암 받은 날 · ')+fmt(cdt)+(cyc?' · '+cyc+'차':''));out.handled=true;out.undo=true;
    var crx=myRx(),cnd=nadirOf();
    out.notes.push('이제 오늘 탭에 "치료 후 며칠째"가 표시돼요. '+(crx?(cnd?'요법 '+crx.ko+': 대개 D+'+cnd[0]+'~'+cnd[1]+' 무렵 면역력(백혈구)이 낮아지기 쉬워요. 그 시기엔 체온을 하루 2번 재 두세요.':'요법 '+crx.ko+': 뚜렷한 백혈구 저하 시기는 없는 편이에요.')+' 어느 시기든 38.0℃ 이상이면 바로 연락하세요.':'많은 항암제는 7~14일째 면역력(백혈구)이 낮아지기 쉬워요(약마다 달라요). 그 시기엔 체온을 하루 2번 재 두세요.'));
    if(crx&&crx._needOpt)out.cards.push({kind:'askOpt'});
    var nci=cycleInfo();if(nci&&!cyc&&nci.start===cdt&&nci.numbered){var tit=state.roadmap.find(function(r){return r.date===cdt&&CHEMO_RE.test(r.title||'')});if(tit&&!/차/.test(tit.title)){tit.title='항암 '+nci.no+'차';out.saved.push('('+nci.no+'차로 정리)')}}
    if(nci)out.cards.push({kind:'nextChemo'});else if(!crx)out.cards.push({kind:'askRx'});
    if(nci&&!cyc&&!injDone&&nci.start!==cdt&&(myRx().days||[1]).length>1)out.saved.push('('+nci.no+'차 주기 '+(dayDiff(nci.start,cdt)+1)+'일째 투여)');
    return out}

  /* 3.6) 혈액검사 수치 */
  var lab={},lm,labNote='';
  function num(x){return parseFloat(String(x).replace(/,/g,''))}
  if((lm=t.match(/(?:호중구|ANC|anc)\s*(?:수치)?\s*(?:가|는|이|:)?\s*([\d,.]+)\s*(만|천)?/i))){var v=num(lm[1])*(lm[2]==='만'?10000:lm[2]==='천'?1000:1);if(v<30)v=v*1000;lab.anc=Math.round(v)}
  if((lm=t.match(/(?:백혈구|WBC|wbc)\s*(?:수치)?\s*(?:가|는|이|:)?\s*([\d,.]+)\s*(만|천)?/i))){var v2=num(lm[1])*(lm[2]==='만'?10000:lm[2]==='천'?1000:1);if(v2<100)v2=v2*1000;lab.wbc=Math.round(v2)}
  if((lm=t.match(/(?:혈소판|PLT|plt)\s*(?:수치)?\s*(?:가|는|이|:)?\s*([\d,.]+)\s*(만|천)?/i))){var v3=num(lm[1])*(lm[2]==='만'?10000:lm[2]==='천'?1000:1);if(v3<1000)v3=v3*1000;lab.plt=Math.round(v3)}
  if((lm=t.match(/(?:혈색소|헤모글로빈|Hb|HB|hb|빈혈\s*수치)\s*(?:가|는|이|:)?\s*(\d{1,2}(?:\.\d)?)/)))lab.hb=+lm[1];
  if(!Object.keys(lab).length&&/(백혈구|호중구|혈소판|혈색소|피\s*수치|혈액\s*수치)/.test(t)&&/(낮|떨어|부족|높)/.test(t)){labNote=t}
  if(Object.keys(lab).length||labNote){
    var ldt=(parseDate(t)||{}).date||today();if(ldt>today())ldt=today();
    var LB=state.labs.find(function(x){return x.date===ldt});if(!LB){LB={id:uid(),date:ldt,wbc:'',anc:'',hb:'',plt:'',note:'',createdAt:Date.now()};state.labs.push(LB)}
    var LBL={wbc:['백혈구','/µL'],anc:['호중구','/µL'],hb:['혈색소','g/dL'],plt:['혈소판','/µL']};
    Object.keys(lab).forEach(function(k){LB[k]=String(lab[k]);out.saved.push(LBL[k][0]+' '+Number(lab[k]).toLocaleString()+' '+LBL[k][1])});
    if(labNote){LB.note=[LB.note,labNote].filter(Boolean).join(' / ');out.saved.push('검사 메모 · '+labNote.slice(0,30))}
    state.labs.sort(function(a,b){return b.date.localeCompare(a.date)});
    if(ldt!==today())out.saved.push('('+fmt(ldt)+' 검사)');
    out.handled=true;out.undo=true;
    if(('anc' in lab&&lab.anc<1000)||/호중구|백혈구/.test(labNote)&&/낮|떨어|부족/.test(labNote))out.alerts.push('lowAnc');
    if('plt' in lab&&lab.plt<50000)out.alerts.push('lowPlt');
    out.notes.push('수치는 들은 그대로 기록만 해요. 의미와 치료 조정은 담당 의료진이 판단해요. 단위가 다르면 결과지 그대로 다시 적어 주세요.');
    return out}

  /* 4) 일정 */
  var pd=parseDate(t), ptm=parseTime(t);
  var schedLike=SCHED_KW.test(t)&&!/체온|열\s*\d|통증\s*\d|설사\s*\d|구토\s*\d|먹었|했어|했다|받았|다녀왔|방사선\s*\d{1,2}\s*(\/|회|번째)/.test(t);
  if(pd&&schedLike&&pd.date>=today()||(ptm&&schedLike&&!pd)){
    var date=pd?pd.date:today(), title=t;
    (pd?pd.used:[]).concat(ptm?[ptm.used]:[]).forEach(function(u){title=title.replace(u,' ')});
    title=title.replace(/(다다음\s*주|다음\s*주|담주|이번\s*주|다음\s*달|담달|이번\s*달)/g,' ').replace(/\s*(에|있어|있음|예약|잡혔어|잡힘|있다|입니다|이야|예정)\s*$/,'').replace(/^\s*(에|은|는)\s*/,'').replace(/\s+/g,' ').trim()||'병원 일정';
    var typ=/항암|방사선|수술|주사|투약|입원/.test(t)?'치료':/CT|MRI|PET|펫|검사|채혈|내시경|초음파|조직/i.test(t)?'검사':/외래|진료|상담|재진|협진/.test(t)?'진료':'일정';
    state.roadmap.push({id:uid(),date:date,time:ptm?ptm.time:'',type:typ,title:title,memo:'',status:'planned',createdAt:Date.now()});
    out.saved.push('일정 · '+fmt(date)+(ptm?' '+ptm.time:'')+' · '+title);out.handled=true;out.undo=true;
    if(typ==='치료')out.notes.push('치료 전날엔 체온과 컨디션을 기록해 두면 진료 때 도움이 돼요.');
    if(typ==='검사'&&/CT|MRI|PET|조영/i.test(t))out.notes.push('금식·조영제 주의사항이 있는지 병원 안내문을 확인하세요.');
    return out}

  /* 5) 몸 상태 기록 */
  var logDate=(pd&&pd.date<=today())?pd.date:today(), rec={}, m;
  if((m=t.match(/(3[4-9]|4[0-2])\s*도\s*([0-9])\s*부/)))rec.temp=m[1]+'.'+m[2];
  else if((m=t.match(/(?:체온|열|온도|미열)\s*(?:이|은|는|:|가)?\s*(3[4-9](?:\.\d)?|4[0-2](?:\.\d)?)/))||(m=t.match(/(3[5-9]\.\d|4[0-2]\.\d|3[5-9]|4[0-2])\s*(?:도|℃|°)/))||(m=t.match(/(?:^|\s)(3[5-9]\.\d|4[0-2]\.\d)(?![\d.]|\s*(?:kg|킬로|%|점))/i)))rec.temp=m[1];
  if((m=t.match(/(?:통증|아파|아픔|아프|통)\D{0,6}?(\d{1,2})\s*(?:점|\/\s*10)/))||(m=t.match(/(?:통증|아파|아픔|아프다|아퍼)\s*(?:이|은|는|:)?\s*(\d{1,2})(?!\s*(?:번|회|시|일|kg|차|알|정|mg))/)))if(+m[1]<=10)rec.pain=m[1];
  var noPain=/안\s*아파|통증\s*(없|0)/.test(t);if(noPain)rec.pain='0';
  var site='';PAIN_SITE.some(function(x){if(x[1].test(t)){site=x[0];return true}});
  var painWord=/아파|아픔|아프|통증|쑤시|쑤셔|결려|지끈|욱신|두통|복통/.test(t)&&!noPain&&!/진통제\s*(먹|복용)|안\s*아프/.test(t);
  if(site&&'pain' in rec&&rec.pain!=='0')rec.painSite=site;
  var painAsk=painWord&&!('pain' in rec);
  var doseName=(t.match(DOSE_RE)||[])[1]||'';if(!doseName){var dm=state.meds.find(function(x){return x.active==='yes'&&x.name&&x.name.length>=2&&t.indexOf(x.name)>=0});if(dm)doseName=dm.name}
  if(!/(먹었|먹음|복용했|복용함|붙였|드셨|드심|삼켰|맞았)/.test(t)||/밥|식사|죽|반찬|물만/.test(t))doseName='';
  if((m=t.match(/(?:체중|몸무게)\s*(?:이|은|는|:)?\s*(\d{2,3}(?:\.\d)?)/))||(m=t.match(/(\d{2,3}(?:\.\d)?)\s*(?:kg|킬로)/i)))rec.weight=m[1];
  if(!doseName&&/식사|밥|먹었|먹음|먹어|식욕|입맛|죽|물만|숟가락|숟갈|그릇|공기/.test(t)&&!/약/.test(t.replace(/약간/g,''))){
    if((m=t.match(/(\d{1,3})\s*%/)))rec.meal=String(Math.min(100,+m[1]));
    else if(/물만|아무것도\s*못|한\s*입도/.test(t))rec.meal='0';
    else if((m=t.match(/(\d{1,2}|한|두|세|네|다섯)\s*(?:숟가락|숟갈|수저|술)/))){var sp={'한':1,'두':2,'세':3,'네':4,'다섯':5}[m[1]]||+m[1];rec.meal=String(sp<=3?10:sp<=8?25:50)}
    else if(/반\s*(그릇|공기)/.test(t))rec.meal='50';
    else if(/(한|1|두|2)\s*(그릇|공기)/.test(t))rec.meal='100';
    else{for(var i=0;i<MEAL_WORDS.length;i++){if(MEAL_WORDS[i][0].test(t)){rec.meal=String(MEAL_WORDS[i][1]);break}}}
  }
  if((m=t.match(/(?:물|수분)\s*(?:을|를)?\s*(\d{3,4})\s*(?:ml|mL|cc|미리)?/)))rec.water=m[1];
  else if((m=t.match(/물\s*(\d{1,2})\s*(?:컵|잔)/)))rec.water=String(m[1]*200);
  if((m=t.match(/(\d{3,6})\s*걸음/)))rec.steps=m[1];
  if((m=t.match(/혈압\s*(?:이|은|:)?\s*(\d{2,3})\s*[\/에\-]\s*(\d{2,3})/)))rec.bp=m[1]+'/'+m[2];
  if((m=t.match(/(?:배\s*둘레|복부\s*둘레|허리\s*둘레)\s*(?:이|은|가|:)?\s*(\d{2,3}(?:\.\d)?)/)))rec.waist=m[1];
  if((m=t.match(/(?:저림|저려)\D{0,6}([0-3])\s*(?:단계|점)/)))rec.numb=m[1];
  if((m=t.match(/(?:잠|수면)\D{0,6}?(\d{1,2}(?:\.\d)?)\s*시간/)))rec.sleep=m[1];
  if((m=t.match(/방사선\s*(\d{1,2})\s*(?:\/\s*(\d{1,2})|회|번째|회차)/))){rec.rt=m[1]+(m[2]?'/'+m[2]:(state.profile.rtTotal?'/'+state.profile.rtTotal:''));if(m[2])state.profile.rtTotal=m[2]}
  var cntN={};
  if((m=t.match(/설사\D{0,4}(\d{1,2})\s*(?:번|회)/))||(m=t.match(/설사\s*(\d{1,2})(?![\d.]|\s*(?:일|시|분|%|점|kg))/))){rec.diarrhea=m[1];cntN.diarrhea=1}else if(/설사/.test(t)&&!/설사\s*(없|안)/.test(t))rec.diarrhea=rec.diarrhea||'1';
  if((m=t.match(/(?:구토|토했|토함|토)\D{0,4}(\d{1,2})\s*(?:번|회)/))||(m=t.match(/구토\s*(\d{1,2})(?![\d.]|\s*(?:일|시|분|%|점|kg))/))){rec.vomit=m[1];cntN.vomit=1}else if(/구토|토했|토함/.test(t))rec.vomit='1';
  if(/혈변|피똥|검은\s*변|변에\s*피|변에서\s*피|피\s*섞인\s*(대)?변|짜장\s*같은\s*(대)?변|(변|똥|대변)\s*(이|가|은|색이)?\s*(까맣|까매|까만|검|시커|검정|새까)|(까만|까맣고|검은|시커먼|검정|새까만)\s*(색\s*)?(대변|변|똥)/.test(t))rec.bowel='혈변·검은변';else if(/변비/.test(t))rec.bowel='변비';
  var distress=null;if((m=t.match(/(?:기분|마음|불안|우울|스트레스|힘듦|괴로움)\D{0,5}(\d{1,2})\s*점/))&&+m[1]<=10)distress=+m[1];
  var sx=[];[['오한',/오한|으슬/],['기침',/기침/],['숨참',/숨\s*차|숨이\s*차/],['입안 염증',/입안|입\s*안이|구내염/],['손발 저림',/저림|저려/],['발진',/발진|두드러기/],['부종',/부종|붓/],['피로',/피곤|피로|기운\s*없/],['메스꺼움',/메스|울렁|구역/],['어지럼',/어지/],['불면',/잠\s*(을\s*)?못|불면/],['출혈',/코피|잇몸\s*피|멍/],['식욕 저하',/입맛\s*(이)?\s*(없|떨어)|식욕\s*(이)?\s*(없|떨어)/],['탈모',/머리\s*(카락)?\s*(이|가)?\s*빠|탈모/],['우울·불안',/우울|불안|무기력/]].forEach(function(s){if(s[1].test(t))sx.push(s[0])});
  if(Object.keys(rec).length||sx.length||distress!=null||doseName||/^메모\s*[:：]?/.test(t)){
    var L=state.logs.find(function(x){return x.date===logDate});
    if(!L){L={id:uid(),date:logDate,temp:'',weight:'',pain:'',meal:'',water:'',steps:'',bowel:'',note:'',createdAt:Date.now()};state.logs.push(L)}
    var LBL2={bp:['혈압',''],waist:['배 둘레','cm'],numb:['손발 저림','단계'],sleep:['수면','시간'],rt:['방사선','회차'],temp:['체온','℃'],pain:['통증','/10'],weight:['체중','kg'],meal:['식사','%'],water:['수분','mL'],steps:['걸음',''],diarrhea:['설사','회'],vomit:['구토','회'],bowel:['배변','']};
    if(doseName){var ds2=new Date();L.note=[L.note,pad(ds2.getHours())+':'+pad(ds2.getMinutes())+' '+doseName+' 복용'].filter(Boolean).join(' / ').slice(-600);out.saved.push('복용 기록 · '+doseName+' '+pad(ds2.getHours())+':'+pad(ds2.getMinutes()));
      if(/타이레놀|아세트아미노펜|해열제|이부프로펜|부루펜|애드빌|덱시부프로펜/.test(doseName)&&!('temp' in rec))out.notes.push('열 때문에 드셨나요? 항암 중에는 해열제 먹기 전에 체온을 재서 38.0℃ 이상이면 먼저 병원에 연락하는 게 원칙이에요. 잰 체온도 함께 적어 주세요.');
      if(/진통제|마약성|옥시|패치|울트라셋|트라마돌/.test(doseName))out.notes.push('추가로 먹은 진통제 횟수는 진료 때 통증 조절의 중요한 근거가 돼요.')}
    if('pain' in rec)L.painSite=rec.painSite||'';
    Object.keys(rec).forEach(function(k){
      if(k==='painSite')return;
      if(k==='diarrhea'||k==='vomit'){var old=+L[k]||0;
        if(cntN[k]){L[k]=String(+rec[k]);if(old>0&&old!==+rec[k]&&!/총/.test(t))out.cards.push({kind:'cntAsk',k:k,old:old,n:+rec[k]})}
        else L[k]=String(old+1)}else L[k]=rec[k];
      out.saved.push(LBL2[k][0]+' '+L[k]+LBL2[k][1]+(k==='pain'&&L.painSite?' ('+L.painSite+')':''))});
    var memoTxt=t.replace(/^메모\s*[:：]?\s*/,'');
    if(sx.length||/^메모/.test(t)){var stamp=new Date();var line=pad(stamp.getHours())+':'+pad(stamp.getMinutes())+' '+memoTxt;L.note=[L.note,line].filter(Boolean).join(' / ').slice(-600);if(sx.length)out.saved.push('증상 · '+sx.join(', '));else out.saved.push('메모');}
    if(distress!=null){state.distress.unshift({id:uid(),date:logDate,score:distress});state.distressValue=distress;out.saved.push('마음 온도계 '+distress+'/10');if(distress>=7)out.alerts.push('distressHigh')}
    state.logs.sort(function(a,b){return b.date.localeCompare(a.date)});
    if(logDate!==today())out.saved.push('('+fmt(logDate)+' 기록)');
    out.handled=true;out.undo=true;
    /* 안전 판단 */
    var T=+L.temp,P=+L.pain;
    if('temp' in rec){if(T>=38){out.alerts.push('fever');if(inNadir(logDate))out.alerts.push('nadirFever')}else if(T>=37.5)out.alerts.push('lowfever')}
    if('bowel' in rec&&L.bowel==='혈변·검은변')out.alerts.push('blood');
    if('pain' in rec&&P>=7)out.alerts.push('pain7');
    if(('diarrhea' in rec||'vomit' in rec)&&(+L.diarrhea>=4||+L.vomit>=3))out.alerts.push('gi');
    if('meal' in rec&&+L.meal<=50)out.alerts.push('meal');
    if('bp' in rec){var bpp=rec.bp.split('/');if(+bpp[0]>=160||+bpp[1]>=100)out.alerts.push('bpHigh')}
    if('waist' in rec){var pw=state.logs.filter(function(x){return x.waist&&x.date<logDate&&dayDiff(x.date,logDate)<=7}).map(function(x){return +x.waist});if(pw.length&&+rec.waist-Math.min.apply(null,pw)>=3)out.alerts.push('waistUp')}
    if('numb' in rec&&+rec.numb>=2)out.alerts.push('numb2');
    if('weight' in rec){var Wn=+L.weight,prevW=state.logs.filter(function(x){return x.weight&&x.date<logDate});
      var w7=prevW.filter(function(x){return dayDiff(x.date,logDate)<=7}).map(function(x){return +x.weight}),w31=prevW.filter(function(x){return dayDiff(x.date,logDate)<=31}).map(function(x){return +x.weight});
      if((w7.length&&Math.max.apply(null,w7)-Wn>=2)||(w31.length&&(Math.max.apply(null,w31)-Wn)/Math.max.apply(null,w31)>=0.05))out.alerts.push('wloss')}
    if(painAsk)out.cards.push({kind:'painAsk',site:site});
    if(sx.length){var stp=findTopic(sx.join(' ')+' '+t);if(stp&&!stp.urgent)out.cards.push({kind:'topicLink',id:stp.id,q:stp.q||stp.title})}
    if(sx.indexOf('숨참')>=0||sx.indexOf('출혈')>=0)out.alerts.push('askSOS');
    if(sx.indexOf('오한')>=0&&!L.temp)out.alerts.push('chill');
  }
  if(!out.handled&&painAsk){out.cards.push({kind:'painAsk',site:site});out.handled=true}
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
  if(p.dayPhone)h+='<a href="'+tel(p.dayPhone)+'" class="danger">📞 평일 낮 상담 '+esc(p.dayPhone)+'</a>';
  if(p.nightPhone)h+='<a href="'+tel(p.nightPhone)+'" class="danger">🌙 밤·주말 응급실 '+esc(p.nightPhone)+'</a>';
  if(!p.dayPhone&&!p.nightPhone)h+='<button type="button" onclick="openSheet(\'settings\')">📞 치료병원 번호 등록</button>';
  h+='<a href="https://www.e-gen.or.kr/egen/search_emergency_room.do" target="_blank" rel="noopener">🏥 가까운 응급실</a>';
  return h+'<a href="tel:119">🚑 119</a>'}
var DEV={port:{n:'케모포트',t:'케모포트(가슴 중심정맥관)',care:'포트 부위를 깨끗하고 마르게 두세요.',call:'포트 부위가 붓고 빨갛거나 아프고 고름·열이 날 때, 포트 쪽 팔·목·얼굴이 부을 때 — 바로 병원에 연락'},picc:{n:'PICC',t:'PICC(팔 중심정맥관)',care:'정해진 날 소독·관리를 받으세요. 물에 젖지 않게 하세요.',call:'팔이 붓거나 아프고 빨개질 때, 관이 빠지거나 새거나 열이 날 때 — 바로 병원에 연락'},biliary:{n:'담도 스텐트·배액관',t:'담도 스텐트·배액관',care:'교체 날짜를 기록해 두세요. 배액관은 꺾이지 않게 고정하세요.',call:'오한을 동반한 열, 눈·피부가 노래짐, 오른쪽 윗배 통증, 배액이 갑자기 줄거나 막힐 때 — 항암 시기와 상관없이 바로 응급실'},stoma:{n:'장루',t:'장루',care:'배출량과 색을 기록하고, 물을 충분히 드세요.',call:'물 같은 배출이 많아 어지럽거나 소변이 줄 때, 장루가 검붉게 변할 때, 배출이 멈추고 배가 아프며 토할 때 — 바로 병원에 연락'},urinary:{n:'요관 스텐트·신루·소변줄',t:'요관 스텐트·신루·소변줄',care:'소변 색과 양을 확인하고 물을 충분히 드세요.',call:'소변이 안 나오거나 피가 많이 섞일 때, 옆구리 통증과 열이 함께 있을 때 — 바로 병원에 연락'},feeding:{n:'영양관(위루관)',t:'영양관(위루관·비위관)',care:'주입 전후 물로 관을 씻어 주세요(병원 안내대로).',call:'관이 빠지거나 막혔을 때, 주변이 붓고 고름·열이 날 때 — 병원에 연락'}};
function devList(){return (state.profile.devices||[]).filter(function(k){return DEV[k]})}
function devFeverTxt(){var d=devList(),h='';if(d.indexOf('biliary')>=0)h+='<br><b>담도 스텐트·배액관이 있어요.</b> 담관염일 수 있으니 오한·황달이 있으면 더 기다리지 말고 응급실로 가세요.';if(d.indexOf('port')>=0||d.indexOf('picc')>=0)h+='<br>포트·관 부위가 붓거나 빨갛다면 함께 알리세요.';return h}
function routeHTML(noBtn){var lc=lastChemo(),rx=myRx(),cancerTx=rx&&(rx.type==='호르몬'||rx.once)?'암 치료':'항암 치료';return '<div class="route"><b>🧭 어디로 연락하나요?</b><ol><li><b>평일 낮</b> — 치료 병원 항암 상담 전화(외래 간호사)</li><li><b>밤·주말·공휴일</b> — 치료 병원 응급실. <b>치료 병원이 멀면(1시간 이상) 가까운 응급실</b>로 먼저 가세요.</li><li><b>숨이 많이 차거나 가슴이 아프거나 의식이 흐리면</b> — 바로 119. 어디로 가야 할지 모를 때도 119에서 응급 상담을 받을 수 있어요.</li></ol>응급실에서는 "'+cancerTx+' 중이고'+(rx?' 요법은 '+esc(rx.ko)+','+'':'')+(lc?' 마지막 치료는 '+mdTxt(lc):'')+'"이라고 먼저 말하고, 진료요약 화면을 보여 주세요.'+(noBtn?'':'<div class="acts"><a href="https://www.e-gen.or.kr/egen/search_emergency_room.do" target="_blank" rel="noopener">🏥 가까운 응급실 찾기</a><a href="tel:119">🚑 119</a></div>')+'</div>'}
var ALERT={
  fever:['red',function(){return '<b>체온이 38.0℃ 이상이에요.</b><br>항암·면역·표적치료 중이라면 밤이든 주말이든 <b>지금 치료병원에 연락</b>하세요. 해열제로 먼저 내리지 마세요.'+devFeverTxt()+routeHTML(true)+'<div class="acts"><button type="button" onclick="openSheet(\'er\')">📋 응급실에서 보여 줄 화면</button></div>'},true],
  lowAnc:['amber','<b>호중구(백혈구)가 낮다고 기록됐어요.</b> 감염에 특히 약한 시기예요. 손 씻기·사람 많은 곳 피하기, 체온은 하루 2번 이상 재고 <b>38.0℃ 이상이면 해열제 먹기 전에 바로 병원에 연락</b>하세요.',true],
  lowPlt:['amber','<b>혈소판이 낮다고 기록됐어요.</b> 멍이 잘 들고 피가 잘 날 수 있어요. 코피·잇몸 출혈이 멈추지 않거나 검은 변이 보이면 바로 연락하세요.',false],
  nadirFever:['red',function(){var rx=myRx(),c=cday();return '<b>지금은 '+(rx?esc(rx.ko)+' 후 ':'항암 후 ')+'면역력(백혈구)이 낮아지기 쉬운 시기'+(c?'('+dLbl(c)+')':'')+'예요.</b> 이 시기의 열은 특히 빨리 확인해야 해요. 기다리지 말고 지금 연락하세요.'},true],
  lowfever:['amber','37.5℃ 이상이에요. <b>1시간 뒤 같은 부위로 다시 재서</b> 알려 주세요. 오한이 있거나 38.0℃가 되면 바로 병원에 연락하세요.',false],
  blood:['red','<b>혈변·검은 변은 출혈 신호일 수 있어요.</b> 지금 치료병원이나 응급실에 연락하세요.',true],
  pain7:['red','<b>통증 7점 이상이에요.</b> 처방받은 진통제로 조절되지 않으면 지금 치료병원에 연락해 지침을 받으세요.',true],
  gi:['amber','설사·구토가 잦아요. 물도 못 마시거나 소변이 줄면 바로, 아니어도 <b>오늘 안에</b> 의료진과 상담하세요.',true],
  meal:['amber','식사량이 평소의 절반 이하예요. 하루 이상 이어지면 의료진·영양사와 상담하세요.',false],
  askSOS:['amber','숨참이나 출혈이 있다면 정도를 확인해야 해요. 응급 판단 화면을 함께 봐 주세요.',false],
  chill:['amber','오한이 있으면 <b>체온을 재서 알려 주세요.</b> 38.0℃ 이상이면 바로 병원에 연락하세요.',false],
  bpHigh:['amber','<b>혈압이 높게 기록됐어요(160/100 이상).</b> 5분 쉬고 다시 재 보세요. 계속 높거나 심한 두통·시야 이상이 있으면 병원에 연락하세요.',true],
  waistUp:['amber','<b>배 둘레가 1주 안에 3cm 넘게 늘었어요.</b> 배에 물이 차는 신호일 수 있어요. 다음 진료 전이라도 병원에 알려 주세요. 열이 함께 있으면 바로 연락하세요.',true],
  numb2:['amber','<b>손발 저림이 일상에 불편한 정도로 기록됐어요.</b> 다음 항암 전에 꼭 의료진에게 알려 주세요. 약 조절의 중요한 근거가 돼요. 걸을 때 넘어지지 않게 조심하세요.',false],
  wloss:['amber','<b>체중이 빠르게 줄고 있어요</b>(1주 2kg 또는 한 달 5% 이상). 다음 진료 전이라도 의료진·영양사에게 알려 주세요. 잘 먹는 것도 치료를 버티는 힘이에요.',false],
  distressHigh:['amber','마음 부담이 커요. 당신 잘못이 아니에요. 오늘 의료진·심리상담·의료사회복지사에게 점수를 알려 주세요. 혼자 견디기 어렵다면 <a href="tel:109">109</a>(24시간)로 전화하세요.',false]
};
function botHTML(o,raw){
  var parts=[];
  o.cards.forEach(function(c){
    if(c.kind==='crisis')parts.push({cls:'red',html:'<b>'+esc(KB.CRISIS.title)+'</b>'+KB.CRISIS.body+'<div class="acts"><a href="tel:109" class="danger">📞 109 지금 전화</a><a href="tel:119">🚑 119</a></div>'});
    if(c.kind==='emergency')parts.push({cls:'red',html:'<b>먼저 확인하세요 — 급한 증상일 수 있어요</b><ul><li>숨이 몹시 차거나 가슴이 조임</li><li>의식이 흐려지거나 말·팔다리가 어눌함, 경련</li><li>멈추지 않는 출혈, 피를 토함</li><li>얼굴·입술·목이 부음</li></ul>해당되면 <b>지금 바로</b> 연락하세요. 숨쉬기 힘들거나 의식이 처지면 119가 우선이에요.<div class="acts">'+callBtns()+'<button type="button" onclick="openSheet(\'sos\')">응급 판단 화면</button></div>'});
  });
  if(o.saved.length){
    var h='<b>기록했어요 ✓</b><div class="saved">'+o.saved.map(function(s){return '<span>'+esc(s)+'</span>'}).join('')+'</div>';
    if(o.notes.length)h+='<p class="small muted" style="margin-top:8px">'+o.notes.map(esc).join('<br>')+'</p>';
    h+='<div class="acts">'+(o.undo?'<button type="button" class="undo" onclick="undoLast(this)">↩ 되돌리기</button>':'')+'</div>';
    parts.push({cls:'',html:h});
  }
  var reds=o.alerts.filter(function(a){return ALERT[a][0]==='red'}),ambs=o.alerts.filter(function(a){return ALERT[a][0]==='amber'});
  function atx(a){var v=ALERT[a][1];return typeof v==='function'?v():v}
  if(reds.length)parts.push({cls:'red',html:reds.map(atx).join('<br><br>')+'<div class="acts">'+callBtns()+'<button type="button" onclick="tab(\'summary\')">📄 진료요약 보기</button></div><p class="nshort">ⓘ 기록한 값으로 알려 드리는 참고용 안내예요. 몸 상태가 걱정되면 수치와 상관없이 의료진에게 연락하세요.</p>'});
  if(ambs.length)parts.push({cls:'amber',html:ambs.map(atx).join('<br><br>')+(ambs.some(function(a){return ALERT[a][2]})||ambs.indexOf('askSOS')>=0?'<div class="acts">'+callBtns()+'<button type="button" onclick="openSheet(\'sos\')">응급 판단</button></div>':'')+'<p class="nshort">ⓘ 기록한 값으로 알려 드리는 참고용 안내예요. 몸 상태가 걱정되면 의료진에게 연락하세요.</p>'});
  o.cards.forEach(function(c){
    if(c.kind==='topic'){var tp=c.topic;parts.push({cls:tp.urgent?'red':'',html:'<b>'+esc(tp.q||tp.title)+'</b><div>'+tp.body+'</div><div class="acts">'+linkBtns(tp.links)+'</div>'+NS()+''})}
    if(c.kind==='fallback')parts.push({cls:'',html:'제가 정확히 이해하지 못했어요. 이렇게 써 보세요.<ul><li>열 37.8 / 통증 5점 / 밥 반 먹음</li><li>다음주 화요일 10시 항암 3차</li><li>타그리소 아침 1알 시작</li><li>질문: 운동해도 되나요?</li></ul><div class="acts"><button type="button" onclick="saveAsMemo(this)" data-t="'+esc(c.text)+'">📝 이대로 메모로 저장</button><button type="button" onclick="saveAsQ(this)" data-t="'+esc(c.text)+'">❓ 질문으로 저장</button></div>'});
    if(c.kind==='nextSched'){var up=upcoming();parts.push({cls:'',html:up.length?'<b>다가오는 일정</b><ul>'+up.slice(0,5).map(function(x){return '<li>'+fmt(x.date)+(x.time?' '+x.time:'')+' · '+esc(x.title)+' <span class="small muted">('+dday(x.date)+')</span></li>'}).join('')+'</ul>':'예정된 일정이 없어요. "10월 20일 오전 9시 CT"처럼 알려 주세요.'})}
    if(c.kind==='medList'){var act=state.meds.filter(function(m){return m.active==='yes'});parts.push({cls:'',html:act.length?'<b>복용 중인 약</b><ul>'+act.map(function(m){return '<li>'+esc(m.name)+' '+esc(m.dose||'')+(m.schedule?' · '+esc(m.schedule):'')+'</li>'}).join('')+'</ul>':'등록된 약이 없어요. "약: 타그리소 아침 1알"처럼 알려 주세요.'})}
    if(c.kind==='goSummary'){parts.push({cls:'',html:'진료요약을 열게요.<div class="acts"><button type="button" onclick="tab(\'summary\')">📄 진료요약 보기</button></div>'})}
    if(c.kind==='recent'){var l=state.logs[0];parts.push({cls:'',html:l?'<b>'+fmt(l.date)+' 기록</b><br>'+logLine(l):'아직 기록이 없어요.'})}
    if(c.kind==='cntAsk'){var nm=c.k==='diarrhea'?'설사':'구토';parts.push({cls:'',html:'오늘 '+nm+'를 이미 <b>'+c.old+'회</b> 기록해 두셨어요. 지금 <b>오늘 총 '+c.n+'회</b>로 저장했어요. 앞 기록에 더한 횟수라면 아래를 눌러 주세요.<div class="qr"><button type="button" data-s="'+nm+' 총 '+(c.old+c.n)+'회">더해서 총 '+(c.old+c.n)+'회</button><button type="button" data-s="'+nm+' 총 '+c.n+'회">총 '+c.n+'회가 맞아요</button></div>'})}
    if(c.kind==='rxPick'&&RXDB){parts.push({cls:'',html:'<b>어떤 요법인지 하나만 골라 주세요.</b><br><span class="small muted">비슷한 요법이 여러 개라 제가 정하지 않았어요. 처방전·안내문의 요법 이름과 맞는 것을 고르세요.</span><div class="acts">'+c.ids.map(function(id){var r=RXDB.byId(id);return r?'<button type="button" onclick="setRx(\''+id+'\')">'+esc(r.name)+'</button>':''}).join('')+'<button type="button" onclick="planTab=\'chemo\';rxPick=true;renderPlan();tab(\'plan\')">목록에서 고르기</button></div>'+NS()})}
    if(c.kind==='rxInfo'&&RXDB){var r=RXDB.byId(c.id);if(r){var mine=state.profile.regimen===r.id;parts.push({cls:'',html:(c.basis&&c.basis.length?'<div class="basis">이렇게 알아들었어요: '+esc(c.basis.join(' + '))+' → <b>'+esc(r.ko)+'</b></div>':'')+'<b>💉 '+esc(r.name)+'</b> <span class="small muted">'+esc(r.ko)+'</span><div class="small" style="margin:4px 0">'+esc(r.how)+'<br>주기: '+esc(cycleTxt(r))+' · 백혈구 저하 시기: '+(r.type==='호르몬'||r.once?'해당 없음':r.nadir?'D+'+r.nadir[0]+'~'+r.nadir[1]+' 무렵':'뚜렷하지 않음(열은 언제든 바로 연락)')+'</div><ul>'+r.se.slice(0,4).map(function(x){return '<li><b>'+esc(x.t)+'</b> — '+esc(x.care)+'</li>'}).join('')+'</ul>'+(r.pre?'<p class="small" style="margin:6px 0 0">📌 '+esc(r.pre)+'</p>':'')+'<div class="acts">'+(mine?'':'<button type="button" onclick="setRx(\''+r.id+'\')">✓ 내 요법으로 등록</button>')+(mine?'<button type="button" onclick="planTab=\'chemo\';rxPick=true;renderPlan();tab(\'plan\')">다른 요법 고르기</button>':'')+(mine&&r.opts?r.opts.map(function(o,i){return '<button type="button" onclick="setRxOpt('+i+')">'+(state.profile.rxOpt===i?'✓ ':'')+esc(o.label)+'</button>'}).join(''):'')+'<button type="button" onclick="planTab=\'chemo\';renderPlan();tab(\'plan\')">💉 부작용·연락 기준 전체</button></div>'+NS()})}}
    if(c.kind==='nextChemo'){var ci=cycleInfo();if(ci)parts.push({cls:'',html:'<b>📅 다음 항암 예상: '+fmt(ci.next)+'</b> <span class="small muted">('+dday(ci.next)+')</span><br>'+ci.nextNo+'차'+(ci.nextDay>1?' '+ci.nextDay+'일째 투여':'')+' · '+esc(ci.rx.ko)+' '+esc(cycleTxt(ci.rx))+' 기준<p class="small muted" style="margin:6px 0 0">입력한 날짜로 계산한 참고용 예상일이에요. 실제 날짜는 병원 예약과 의료진 안내를 따르세요. 혈액검사 결과나 컨디션에 따라 미뤄지는 건 흔한 일이고, 치료가 잘못되고 있다는 뜻이 아니에요.</p><div class="qr"><button type="button" data-s="'+mdTxt(ci.next)+' 항암 '+ci.nextNo+'차'+(ci.nextDay>1?' '+ci.nextDay+'일째':'')+' (예상)">📅 일정에 넣기</button><button type="button" data-s="다음 일정 알려줘">예약 날짜가 따로 있어요</button></div>'+NS()})}
    if(c.kind==='askOpt'){var r2=myRx();if(r2&&r2.opts)parts.push({cls:'',html:'<b>투여 간격을 골라 주세요.</b> 병원에서 안내받은 간격을 고르면 다음 예상일을 계산해 드려요.<div class="acts">'+r2.opts.map(function(o,i){return '<button type="button" onclick="setRxOpt('+i+')">'+esc(o.label)+'</button>'}).join('')+'</div>'+NS()})}
    if(c.kind==='askRx'){var opts=RXDB?RXDB.forCancer(state.profile.cancer).slice(0,6):[];parts.push({cls:'',html:'어떤 <b>항암 요법</b>인지 알려 주시면 다음 항암 예상일과 시기별 주의사항을 맞춰 드려요. 요법 이름은 처방전·안내문이나 의료진께 확인할 수 있어요.'+(opts.length?'<div class="qr">'+opts.map(function(r){return '<button type="button" data-s="내 항암 요법은 '+esc(r.ko)+'">'+esc(r.ko)+'</button>'}).join('')+'</div>':'')+'<div class="acts"><button type="button" onclick="planTab=\'chemo\';renderPlan();tab(\'plan\')">💉 목록에서 고르기</button></div>'})}
    if(c.kind==='painAsk'){parts.push({cls:'',html:'<b>'+(c.site?esc(c.site)+' ':'')+'통증이 어느 정도인가요?</b><br><span class="small muted">0 = 안 아픔 · 10 = 상상할 수 있는 가장 심한 통증</span><div class="qr">'+[0,1,2,3,4,5,6,7,8,9,10].map(function(i){return '<button type="button" data-s="통증 '+i+'점'+(c.site?' '+esc(c.site):'')+'">'+i+'</button>'}).join('')+'</div>'})}
    if(c.kind==='stopUnknown'){parts.push({cls:'',html:'복용 중인 약 목록에서 해당 약을 찾지 못했어요. 약 이름을 처방전 그대로 알려 주시거나, 이대로 메모로 남길 수 있어요.<div class="acts"><button type="button" onclick="saveAsMemo(this)" data-t="'+esc(c.text)+'">📝 메모로 저장</button><button type="button" onclick="planTab=\'meds\';renderPlan();tab(\'plan\')">💊 약 목록 보기</button></div><p class="small muted" style="margin:8px 0 0">처방약을 스스로 끊기 전에는 의료진과 상의하세요.</p>'})}
    if(c.kind==='topicLink'){parts.push({cls:'',html:'💡 관련 안내가 있어요.<div class="acts"><button type="button" onclick="showTopic(\''+esc(c.id)+'\')">'+esc(c.q)+'</button></div>'})}
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
window.showTopic=function(id){var tp=KB.TOPICS.find(function(x){return x.id===id});if(!tp)return;addMsg('bot','<b>'+esc(tp.q||tp.title)+'</b><div>'+tp.body+'</div><div class="acts">'+linkBtns(tp.links)+'</div>'+NS()+'','',true);scrollBottom()};
window.setRxOpt=function(i){state.profile.rxOpt=i;save();var r=myRx();toast((r&&r._opt?r._opt:'간격')+'으로 맞췄어요')};
window.setRx=function(id){setRegimen(id);rxPick=false;save();var r=RXDB&&RXDB.byId(id);toast((r?r.ko:'요법')+' 등록했어요')};
window.pickRx=function(){rxPick=true;renderPlan()};
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
  lab:['혈액검사 결과지의 수치를 적어 주세요.<br><span class="small muted">예) 호중구 800, 혈소판 9만, 혈색소 10.2 · 백혈구 수치 낮대</span>',[]],
  q:['진료 때 물어볼 것을 써 주세요. 진료요약에 모아 둘게요.<br><span class="small muted">예) 질문: 항암 중 운동해도 되나요? · 꼭 질문: CT 결과</span>',[]],
  sym:['어떤 증상이 걱정되세요?',KB.TOPICS.filter(function(x){return x.cat==='증상'||x.cat==='마음'}).map(function(x){return [x.q,x.q]})],
  help:null
};
document.querySelectorAll('#chips button').forEach(function(b){b.onclick=function(){
  var k=b.dataset.c;if(k==='help'){sendText('사용법');return}
  var q=QUICK[k];var html=q[0]+(q[1].length?'<div class="qr">'+q[1].map(function(x){return '<button type="button" data-s="'+esc(x[1])+'">'+esc(x[0])+'</button>'}).join('')+'</div>':'');
  addMsg('bot',html,'',false);
  if(k==='sched')prefill('');if(k==='med')prefill('약: ');if(k==='q')prefill('질문: ');if(k==='lab')prefill('');
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
function logLine(l){var a=[];if(l.bp)a.push('혈압 '+l.bp);if(l.waist)a.push('배 둘레 '+l.waist+'cm');if(l.numb!=null&&l.numb!=='')a.push('저림 '+l.numb+'단계');if(l.sleep)a.push('수면 '+l.sleep+'시간');if(l.rt)a.push('방사선 '+l.rt+'회차');if(l.temp)a.push('체온 '+l.temp+'℃');if(l.pain!==''&&l.pain!=null)a.push('통증 '+l.pain+'/10'+(l.painSite?'('+l.painSite+')':''));if(l.meal!=='')a.push('식사 '+l.meal+'%');if(l.weight)a.push('체중 '+l.weight+'kg');if(l.water)a.push('수분 '+l.water+'mL');if(+l.diarrhea)a.push('설사 '+l.diarrhea+'회');if(+l.vomit)a.push('구토 '+l.vomit+'회');if(l.bowel)a.push(l.bowel);if(l.steps)a.push(l.steps+'걸음');return esc(a.join(' · ')||'수치 없음')+(l.note?'<br><span class="small muted">'+esc(l.note)+'</span>':'')}
function isWarn(l){return +l.temp>=38||(l.pain!==''&&+l.pain>=7)||l.bowel==='혈변·검은변'||+l.diarrhea>=4||+l.vomit>=3}
function renderHome(){
  var pb=document.getElementById('phoneBar');if(pb)pb.hidden=!!(state.profile.dayPhone||state.profile.nightPhone);
  var p=state.profile,h=new Date().getHours();
  $('#hello').innerHTML=(p.name?esc(p.name)+'님, ':'')+(h<11?'좋은 아침이에요.':h<18?'오늘 하루 어떠세요?':'오늘 하루 고생 많으셨어요.')+'<br><span style="font-size:.72em;color:var(--muted);font-weight:800">오늘 몸 상태를 한 줄로 알려 주세요.</span>';
  var cd=cday(),cb=$('#chemoBar'),rx=myRx(),ci=cycleInfo(),bh='';
  var upc=upcoming().filter(function(r){return CHEMO_RE.test(r.title||'')})[0],ud=upc?dayDiff(today(),upc.date):99;
  var go='onclick="planTab=\'chemo\';renderPlan();tab(\'plan\')" role="button" tabindex="0"';
  var tlog=state.logs.find(function(x){return x.date===today()});
  if(tlog&&+tlog.temp>=38){bh='<div class="chemobar fever" role="alert"><b>🌡️ 오늘 '+esc(tlog.temp)+'℃</b><span>38.0℃ 이상이 기록됐어요. 아직 연락 전이라면 <u>해열제 먹기 전에 지금 병원에 연락</u>하세요.<details class="rt"><summary>어디로 연락하나요? 응급실에서 할 말</summary>'+routeHTML(true)+'</details><span class="acts" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'+callBtns()+'</span></span></div>'}
  else if(upc&&ud>=0&&ud<=1&&!/예상/.test(upc.title)){bh='<div class="chemobar" '+go+'><b>'+(ud===0?'오늘':'내일')+' '+(/호르몬/.test(upc.title)?'주사':'항암')+'</b><span>'+esc(upc.title)+(upc.time?' '+upc.time:'')+'<br>체온·컨디션을 기록하고 물어볼 것을 정리해 두세요. 채혈 시간도 확인하세요.</span></div>'}
  else if(cd){var nd=inNadir(),tips=RXDB?RXDB.tip(rx,cd.n):[],ol=oralLbl(ci);
    if(nd)tips=['🛡️ 몸을 지키는 기간이에요. 면역력(백혈구)이 잠시 낮아질 수 있으니 체온을 하루 2번 재 두세요. <u>38.0℃ 이상이면 해열제 먹기 전에 바로 병원에 연락</u>하세요.'];else tips=tips.map(esc);
    bh='<div class="chemobar'+(nd?' nadir':'')+'" '+go+'><b>'+dLbl(cd)+'<em class="ref">참고용</em></b><span>'+(rx?'<small style="display:block;font-weight:900;opacity:.85">'+esc(rx.ko)+(ci?' · '+ci.no+'차':'')+(ol?' · '+ol:'')+'</small>':'')+(tips.join(' ')||'마지막 항암 '+fmt(cd.date))+(ci&&!ci.booked&&!nd&&cd.n>=3?'<small style="display:block;margin-top:2px">다음 '+(isInj(rx)?'주사':'항암')+' 예상 '+fmt(ci.next)+' (참고용)</small>':'')+(rx&&rx._needOpt?'<small style="display:block;margin-top:2px">투여 간격을 고르면 다음 예상일이 나와요 →</small>':'')+'</span></div>'}
  cb.innerHTML=bh;
  renderTodo(rx,cd,ci,upc,ud);
  /* 주 1회 가벼운 제안: 백업 · 마음 온도계 */
  var nz=$('#nudge');if(nz){var nd2={};try{nd2=JSON.parse(localStorage.getItem('apuda_note_nudge')||'{}')}catch(e){}
    var gm={};try{gm=JSON.parse(localStorage.getItem('apuda_backup_meta')||'{}')}catch(e){}
    var lastB=Math.max(state.meta&&state.meta.lastBackup?Date.parse(state.meta.lastBackup):0,gm.lastBackupAt||0),wk=7*864e5,now=Date.now(),nh='';
    function snoozed(k){return nd2[k]&&now-nd2[k]<wk}
    if(state.logs.length>=3&&now-lastB>wk&&!snoozed('backup'))nh='<div class="nudge"><span>📦 '+(lastB?'마지막 백업 '+Math.floor((now-lastB)/864e5)+'일 전':'아직 백업한 적이 없어요')+'. 폰을 잃어버려도 기록이 남게 주 1회 백업해 두세요.</span><div class="row"><button class="btn soft sm" onclick="exportData();snooze(\'backup\')">백업 파일 받기</button><button class="btn line sm" onclick="snooze(\'backup\')">다음에</button></div></div>';
    else if(state.logs.length>=3&&(!state.distress[0]||dayDiff(state.distress[0].date,today())>=7)&&!snoozed('mood'))nh='<div class="nudge"><span>💭 이번 주 마음은 어떠세요? 마음 온도계를 기록해 두면 진료 때 함께 이야기할 수 있어요.</span><div class="row"><button class="btn soft sm" onclick="snooze(\'mood\');tab(\'log\');setTimeout(function(){document.getElementById(\'distress\').scrollIntoView({block:\'center\'})},60)">기록하기</button><button class="btn line sm" onclick="snooze(\'mood\')">다음에</button></div></div>';
    nz.innerHTML=nh}
  var up=upcoming()[0], tl=state.logs.find(function(x){return x.date===today()}), hq=state.questions.filter(function(q){return !q.answer}).length;
  $('#tiles').innerHTML=
   '<button class="tile" onclick="tab(\'plan\')"><small>📅 다음 일정</small><b>'+(up?dday(up.date)+' · '+esc(up.title.slice(0,14)):'없음')+'</b></button>'+
   '<button class="tile" onclick="tab(\'log\')"><small>🩺 오늘 기록</small><b'+(tl&&isWarn(tl)?' style="color:var(--red)"':'')+'>'+(tl?(tl.temp?tl.temp+'℃ ':'')+(tl.pain!==''?'통증 '+tl.pain:'')||'기록함':'아직 없음')+'</b></button>'+
   '<button class="tile" onclick="planTab=\'qs\';renderPlan();tab(\'plan\')"><small>❓ 물어볼 것</small><b>'+hq+'개</b></button>';
  var c='';if(p.dayPhone)c+='<a class="btn line" href="'+tel(p.dayPhone)+'">📞 병원 전화</a>';if(p.nightPhone)c+='<a class="btn line" href="'+tel(p.nightPhone)+'">🌙 야간·응급</a>';
  if(!p.dayPhone&&!p.nightPhone)c='<button class="btn soft" style="grid-column:1/-1" onclick="openSheet(\'settings\')">📞 병원 연락처를 먼저 등록해 두세요</button>';
  $('#callrow').innerHTML=c;
}
function chk(k){var d=state.checks[today()];return !!(d&&d[k])}
window.toggleCheck=function(k){var d=state.checks[today()]||(state.checks[today()]={});d[k]=!d[k];
  var keys=Object.keys(state.checks).sort();if(keys.length>90)keys.slice(0,keys.length-90).forEach(function(x){delete state.checks[x]});save()};
var TRK={bp:['🩺 혈압','혈압 ','예) 혈압 130/85 — 5분 쉬고 앉아서 재세요.'],waist:['📏 배 둘레','배 둘레 ','예) 배 둘레 86 — 아침, 배꼽 높이에서 같은 줄자로 재세요.'],weight:['⚖️ 체중','체중 ','예) 체중 58.5 — 아침 화장실 다녀온 뒤 재세요.'],numb:['🖐️ 손발 저림','','0 없음 · 1 가끔 저림 · 2 단추·글씨가 불편 · 3 걷기·일상이 어려움'],sleep:['😴 수면','잠 ','예) 잠 5시간 — 스테로이드를 먹는 동안 잠이 줄 수 있어요.'],rt:['☢️ 방사선 회차','방사선 ','예) 방사선 12/28 — 받은 회차/전체 회차'],mouth:['👄 입안 상태','','괜찮음 · 따끔 · 헐어서 먹기 힘듦']};
window.quickTrack=function(k){var x=TRK[k];if(!x)return;var html='<b>'+x[0]+' 기록</b><br><span class="small muted">'+esc(x[2])+'</span>';
  if(k==='numb')html+='<div class="qr">'+[0,1,2,3].map(function(i){return '<button type="button" data-s="손발 저림 '+i+'단계">'+i+'단계</button>'}).join('')+'</div>';
  if(k==='mouth')html+='<div class="qr"><button type="button" data-s="메모: 입안 괜찮음">괜찮음</button><button type="button" data-s="입안이 따끔해">따끔</button><button type="button" data-s="입안이 헐어서 먹기 힘들어">먹기 힘듦</button></div>';
  tab('today');addMsg('bot',html,'',false);if(x[1])prefill(x[1]);scrollBottom()};
function todoItems(rx,cd,ci,upc,ud){var it=[],act=state.meds.filter(function(m){return m.active==='yes'});
  if(cd||rx){it.push({k:'tempAM',t:'🌡️ 아침 체온 재기',b:'체온 '});it.push({k:'tempPM',t:'🌡️ 저녁 체온 재기',b:'체온 '})}
  var off=rx&&rx.oral&&ci&&ci.t>=rx.oral.on&&ci.t<rx.cycle;
  act.forEach(function(m){var isRx=rx&&RXDB&&RXDB.find(m.name)&&RXDB.find(m.name).id===rx.id;
    if(isRx&&off)it.push({k:'med_'+m.id,t:'💊 '+m.name+' — 쉬는 기간이에요, 오늘은 먹지 않아요',skip:true});
    else it.push({k:'med_'+m.id,t:'💊 '+m.name+(m.schedule?' · '+m.schedule:'')})});
  if(rx&&RXDB&&RXDB.PUMP.indexOf(rx.id)>=0&&cd&&cd.n<=2){it.push({k:'pump',t:'🧴 펌프 확인 — 줄 꺾임·새는지·잠금'});it.push({k:'pumpOff',t:'⏰ 펌프 제거 시간 확인하기'})}
  if(upc&&ud===1&&!/예상/.test(upc.title))it.push({k:'bag',t:'🎒 내일 가져갈 것 — 진료요약·약 봉투·질문 메모'});
  if(inNadir())it.push({k:'hand',t:'🧼 손 씻기·사람 많은 곳 피하기'});
  return it}
function renderTodo(rx,cd,ci,upc,ud){var el=$('#todo');if(!el)return;var it=todoItems(rx,cd,ci,upc,ud),tr=rx&&RXDB?RXDB.tracks(rx.id):[];
  (state.profile.devices||[]).indexOf('biliary')>=0&&tr.indexOf('weight')<0&&tr.push('weight');
  if(!it.length&&!tr.length){el.innerHTML='';return}
  var done=it.filter(function(x){return !x.skip&&chk(x.k)}).length,tot=it.filter(function(x){return !x.skip}).length;
  el.innerHTML='<div class="todo"><div class="row between"><h3>✅ 오늘 할 일</h3>'+(tot?'<span class="pill'+(done===tot?' green':'')+'">'+done+' / '+tot+'</span>':'')+'</div>'+
   it.map(function(x){return x.skip?'<div class="todo-i skip">'+esc(x.t)+'</div>':'<button type="button" class="todo-i'+(chk(x.k)?' on':'')+'" aria-pressed="'+chk(x.k)+'" onclick="toggleCheck(\''+x.k+'\')"><span class="box">'+(chk(x.k)?'✓':'')+'</span><span>'+esc(x.t)+'</span></button>'}).join('')+
   (tr.length?'<div class="trk"><span class="small muted">이 요법에서 챙기면 좋은 기록</span><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">'+tr.map(function(k){return TRK[k]?'<button class="btn soft sm" onclick="quickTrack(\''+k+'\')">'+TRK[k][0]+'</button>':''}).join('')+'</div></div>':'')+
   '<p class="nshort">ⓘ 체크는 기억을 돕는 기록이에요. 복용 방법·일정은 처방과 의료진 안내를 따르세요.</p></div>'}
var planTab='sched',rxPick=false,rxCancerSel='';
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
      '<p class="small muted" style="margin:8px 0 0">처방전·약봉투에 적힌 이름 그대로 적어 주세요. 영양제·한약도 함께 적으면 진료 때 도움이 돼요.</p></div>'+
      (stop.length?'<div class="card"><h3>중단·종료한 약</h3>'+stop.map(medItem).join('')+'</div>':'');
  }else if(planTab==='chemo'){h=renderChemo();
  }else{
    var w={high:0,mid:1,low:2},qs=state.questions.slice().sort(function(a,b){return (a.answer?1:0)-(b.answer?1:0)||w[a.priority]-w[b.priority]||b.createdAt-a.createdAt});
    h='<div class="card"><h3>진료 때 물어볼 것</h3>'+(qs.length?qs.map(qItem).join(''):'<div class="empty">아직 없어요. 떠오를 때 바로 적어 두세요.</div>')+
      '<form class="addline" onsubmit="addQ(event)"><input name="t" placeholder="예) 항암 중 운동해도 되나요?" required><button class="btn primary sm">추가</button></form></div>';
  }
  el.innerHTML=h;
}
function renderChemo(){
  if(!RXDB)return '<div class="card"><div class="empty">요법 정보를 불러오지 못했어요.</div></div>';
  var rx=myRx(),h='';
  if(!rx||rxPick){
    var nc=RXDB.normCancer(state.profile.cancer),cs=rxCancerSel||(RXDB.CANCERS.indexOf(nc)>=0?nc:'')||'폐암';
    var list=RXDB.RX.filter(function(r){return r.cancers.indexOf(cs)>=0});
    h='<div class="rxnotice" role="note">'+esc(RXDB.NOTICE)+'</div><div class="card"><h3>💉 내 항암 요법 '+(rx?'바꾸기':'등록')+'</h3><p class="small muted" style="margin:0 0 10px">등록하면 다음 항암 예상일, 주기 안 시기별 주의사항, 부작용 관리법과 연락 기준을 맞춰 보여드려요.</p>'+
      '<select id="rxCancer" onchange="rxCancerSel=this.value;renderPlan()" aria-label="암종 선택">'+RXDB.CANCERS.map(function(c){return '<option'+(c===cs?' selected':'')+'>'+c+'</option>'}).join('')+'</select>'+
      list.map(function(r){return '<div class="item"><div class="row between"><span class="pill'+(r.type==='면역'?' green':r.type==='세포독성'?' red':r.type==='호르몬'?' gray':'')+'">'+esc(r.type)+'</span><button class="btn primary sm" onclick="setRx(\''+r.id+'\')">등록</button></div><h4>'+esc(r.name)+'</h4><div class="meta">'+esc(r.ko)+' · '+esc(cycleTxt(r))+'</div></div>'}).join('')+
      (rx?'<button class="btn line sm" style="margin-top:10px" onclick="rxPick=false;renderPlan()">취소</button>':'')+
      '<p class="small muted" style="margin:10px 0 0">목록에 없으면 노트봇에 "내 항암은 ○○"처럼 써 주세요. 요법 이름은 처방전·안내문이나 의료진께 확인할 수 있어요.</p></div>';
    return h}
  var ci=cycleInfo(),cd=cday();
  h='<div class="rxnotice" role="note">'+esc(RXDB.NOTICE)+'</div>';
  h+='<div class="card"><div class="row between"><span class="pill red">내 항암 요법</span><button class="btn line sm" onclick="pickRx()">바꾸기</button></div><h3 style="margin:8px 0 2px">'+esc(rx.name)+'</h3><div class="small muted">'+esc(rx.ko)+' · '+esc(rx.type)+'</div>'+
    '<table class="kv"><tr><th>투여</th><td>'+esc(rx.how)+'</td></tr><tr><th>주기</th><td>'+esc(cycleTxt(rx))+'</td></tr><tr><th>백혈구 저하</th><td>'+(rx.type==='호르몬'||rx.once?'해당 없음 (항암제가 아니에요)':rx.nadir?'대개 D+'+rx.nadir[0]+'~'+rx.nadir[1]+' 무렵 (사람·회차마다 달라요)':'뚜렷한 시기 없음 — 특정 시기가 없을 뿐, 열은 언제든 바로 연락')+'</td></tr></table>'+
    (rx.opts?'<div class="optrow"><b>병원에서 안내받은 투여 간격</b><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">'+rx.opts.map(function(o,i){return '<button class="btn '+(state.profile.rxOpt===i?'primary':'line')+' sm" onclick="setRxOpt('+i+')" aria-pressed="'+(state.profile.rxOpt===i)+'">'+esc(o.label)+'</button>'}).join('')+'</div></div>':'')+'</div>';
  if(rx.cycle&&ci&&ci.t>=0&&ci.t<=rx.cycle+14){
    var T=rx.cycle,seg='',days=rx.days||[1];
    for(var d=0;d<T;d++){var cl=[];if(days.indexOf(d+1)>=0||rx.oral&&d<rx.oral.on)cl.push('dose');if(rx.nadir&&d>=rx.nadir[0]&&d<=rx.nadir[1])cl.push('nd');if(d===ci.t)cl.push('now');seg+='<i class="'+cl.join(' ')+'">'+(d===ci.t?'<span>오늘</span>':'')+'</i>'}
    var sum=(rx.oral?rx.oral.on+'일 복용 → '+rx.oral.off+'일 휴약':days.map(function(x){return x+'일째'}).join('·')+' 투여')+(rx.nadir?' → '+(rx.nadir[0]+1)+'~'+(rx.nadir[1]+1)+'일째 면역력 낮아지기 쉬움':'')+' → '+(T+1)+'일째 다음 주기';
    var tips=RXDB.tip(rx,cd?cd.n:ci.t);if(rx.nadir&&cd&&!(cd.n>=rx.nadir[0]&&cd.n<=rx.nadir[1]))tips=tips.concat(['특정 시기가 아니어도 38.0℃ 이상이면 언제든 바로 연락하세요.']).slice(0,3);
    h+='<div class="card"><div class="row between"><h3>이번 주기 · '+ci.no+'차</h3><span class="small muted">'+(ci.t<T?'주기 '+(ci.t+1)+'일째':'주기 지남')+'</span></div><div class="cyc" role="img" aria-label="'+esc(sum)+', 오늘은 주기 '+(ci.t+1)+'일째">'+seg+'</div><p class="cycsum">'+esc(sum)+'</p><div class="legend" style="flex-wrap:wrap;gap:4px 12px" aria-hidden="true"><span><i class="lg-dose"></i>투여·복용(진한 칸)</span><span><i class="lg-nd"></i>면역력 낮아지기 쉬움(빗금)</span><span><i class="lg-now"></i>오늘(테두리)</span></div>'+
      (tips.length?'<p style="margin:10px 0 0;font-weight:800">'+tips.map(esc).join('<br>')+'</p>':'')+
      '<div class="item" style="margin-top:8px"><h4>📅 다음 항암</h4><div class="meta">'+(ci.booked?'예약됨 · '+fmt(ci.booked.date)+(ci.booked.time?' '+ci.booked.time:'')+' · '+esc(ci.booked.title):'참고용 예상 '+fmt(ci.next)+' ('+dday(ci.next)+') · '+ci.nextNo+'차'+(ci.nextDay>1?' '+ci.nextDay+'일째':'')+'<br><button class="btn soft sm" style="margin-top:6px" onclick="addNextChemo()">일정에 넣기</button>')+'</div></div></div>';
  }else if(rx._needOpt){h+='<div class="card"><h3>이번 주기</h3><p class="small muted" style="margin:0">위에서 병원에서 안내받은 투여 간격을 고르면 주기 그림과 다음 예상일이 나와요.</p></div>'}else if(rx.cycle){h+='<div class="card"><h3>이번 주기</h3><p class="small muted" style="margin:0">항암 받은 날을 알려 주시면 주기 그림과 다음 항암 예상일이 나와요.<br>예) "오늘 항암 3차 맞았어" · "10월 1일 항암 맞았어"</p></div>'}
  var cand=[];var cp=RXDB.COMP[rx.id];(cp&&cp.o||[]).forEach(function(k){var cid=RXDB.COMBO[k];if(cid&&cid!==rx.id&&cand.indexOf(cid)<0)cand.push(cid)});state.profile.rxCombo.forEach(function(c){if(cand.indexOf(c)<0)cand.push(c)});
  if(cand.length)h+='<div class="card"><h3>함께 쓰는 약</h3><p class="small muted" style="margin:0 0 8px">같이 맞는 표적·면역 약을 고르면 그 약의 연락 기준도 함께 보여 드려요.</p><div class="row" style="flex-wrap:wrap;gap:6px">'+cand.map(function(id){var r=RXDB.byId(id),on=state.profile.rxCombo.indexOf(id)>=0;return r?'<button class="btn '+(on?'primary':'line')+' sm" aria-pressed="'+on+'" onclick="toggleCombo(\''+id+'\')">'+(on?'✓ ':'+ ')+esc(r.ko)+'</button>':''}).join('')+'</div></div>';
  var plan=state.profile.rxPlan.length?state.profile.rxPlan:[rx.id],sameC=RXDB.forCancer(state.profile.cancer||rx.cancers[0]);
  h+='<div class="card"><h3>치료 단계</h3>'+plan.map(function(id,i){var r=RXDB.byId(id);if(!r)return '';var cur=id===rx.id,past=i<plan.indexOf(rx.id);return '<div class="item"><div class="row between"><span class="pill'+(cur?' red':past?' gray':'')+'">'+(i+1)+'단계 · '+(cur?'지금':past?'지난 단계':'다음 단계')+'</span>'+(!cur&&!past?'<button class="btn soft sm" onclick="startStep('+i+')">이 단계 시작</button>':'')+'</div><h4>'+esc(r.name)+'</h4></div>'}).join('')+
    '<div class="addline" style="margin-top:8px"><select id="stepSel" aria-label="다음 단계 요법">'+sameC.filter(function(r){return plan.indexOf(r.id)<0}).map(function(r){return '<option value="'+r.id+'">'+esc(r.name)+'</option>'}).join('')+'</select><button class="btn line sm" onclick="addStep()">+ 단계 추가</button></div>'+
    '<p class="small muted" style="margin:8px 0 0">예) AC 4회 → 매주 파클리탁셀 → 허셉틴 유지. 단계를 시작하면 그날부터 새 요법으로 날짜를 계산해요.</p></div>';
  h+='<div class="card"><h3>부작용 관리와 연락 기준</h3>'+rx.se.map(function(x){return '<div class="item"><h4>'+esc(x.t)+'</h4><div class="small">'+esc(x.care)+'</div>'+(x.call?'<div class="callline">📞 '+esc(x.call)+'</div>':'')+'</div>'}).join('')+
    NS()+'<div class="item"><h4>항상 바로 연락</h4><div class="small" style="color:var(--red);font-weight:800">38.0℃ 이상 열·오한 · 숨참 · 가슴 통증 · 멈추지 않는 출혈 · 물도 못 마실 만큼 토함 · 의식 변화</div>'+routeHTML()+'</div></div>';
  state.profile.rxCombo.forEach(function(id){var r=RXDB.byId(id);if(r)h+='<div class="card"><h3>함께 쓰는 약: '+esc(r.ko)+'</h3>'+r.se.map(function(x){return '<div class="item"><h4>'+esc(x.t)+'</h4><div class="small">'+esc(x.care)+'</div>'+(x.call?'<div class="callline">📞 '+esc(x.call)+'</div>':'')+'</div>'}).join('')+(r.pre?'<p class="small" style="margin:8px 0 0">📌 '+esc(r.pre)+'</p>':'')+NS()+'</div>'});
  var dv=devList();if(dv.length)h+='<div class="card"><h3>몸에 달린 것</h3>'+dv.map(function(k){var x=DEV[k];return '<div class="item"><h4>'+esc(x.t)+'</h4><div class="small">'+esc(x.care)+'</div><div class="callline">📞 '+esc(x.call)+'</div></div>'}).join('')+NS()+'</div>';
  else h+='<p class="small muted" style="margin:0 4px 12px">케모포트·담도 스텐트·장루 등이 있다면 <a href="#" onclick="openSheet(\'settings\');return false">내 정보</a>에서 체크해 두세요. 맞는 연락 기준을 함께 보여 드려요.</p>';
  if(rx.pre)h+='<div class="card"><h3>📌 꼭 챙길 것</h3><p style="margin:0">'+esc(rx.pre)+'</p></div>';
  h+='<p class="note-foot">'+esc(RXDB.NOTICE_FULL)+' 의약품 허가정보·공개 자료를 참고해 정리했어요. · <a href="/library/regimens/">암종별 요법 전체·참고자료 보기</a></p>';
  return h}
window.toggleCombo=function(id){var a=state.profile.rxCombo,i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);save()};
window.addStep=function(){var v=$('#stepSel')&&$('#stepSel').value;if(!v)return;var p=state.profile;if(!p.rxPlan.length)p.rxPlan=[p.regimen];if(p.rxPlan.indexOf(v)<0)p.rxPlan.push(v);save();toast('단계를 추가했어요')};
window.startStep=function(i){var p=state.profile,id=p.rxPlan[i];if(!id)return;if(!confirm('이 단계를 오늘부터 시작할까요? 지난 단계 기록은 그대로 남아요.'))return;p.regimen=id;p.rxOpt=null;p.rxCombo=[];p.rxStep=i;p.rxSince=today();save();toast('새 단계를 시작했어요')};
window.addNextChemo=function(){var ci=cycleInfo();if(!ci)return;state.roadmap.push({id:uid(),date:ci.next,time:'',type:'치료',title:(isInj(ci.rx)?'호르몬 주사 ':'항암 ')+ci.nextNo+'차'+(ci.nextDay>1?' '+ci.nextDay+'일째':'')+' (예상)',memo:'병원 예약 확인 필요',status:'planned',createdAt:Date.now()});save();toast('다음 항암 예상일을 일정에 넣었어요')};
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
  $('#logList').innerHTML=a.length?a.slice(0,30).map(function(l){return '<div class="logrow"><b'+(isWarn(l)?' style="color:var(--red)"':'')+'>'+fmt(l.date)+(dTag(l.date)?'<br><span class="pill'+(inNadir(l.date)?' red':'')+'">'+dTag(l.date).replace('항암 ','')+'</span>':'')+'</b><div>'+logLine(l)+'</div><button class="btn line sm" onclick="delItem(\'logs\',\''+l.id+'\')">삭제</button></div>'}).join(''):'<div class="empty">아직 기록이 없어요. 오늘 탭에서 "열 36.8 통증 2점"처럼 써 보세요.</div>';
  $('#labList').innerHTML=labTable(state.labs.slice(0,10),true);
  var lf=document.querySelector('.labform [name=date]');if(lf&&!lf.value)lf.value=today();
  var dv=state.distress[0];$('#distress').value=dv?dv.score:state.distressValue||0;distressUI();
}
function distressUI(){var s=+$('#distress').value;$('#distressOut').textContent=s;var el=$('#distressAdvice');
  el.innerHTML=s>=7?'<span style="color:var(--red);font-weight:900">부담이 큰 상태예요. 당신 잘못이 아니에요.</span> 오늘 의료진·심리상담·의료사회복지사에게 알려 주세요. 혼자 견디기 어렵다면 <a href="tel:109">109</a>(24시간 무료).':s>=4?'<span style="color:var(--amber);font-weight:900">도움이 필요할 수 있는 수준이에요.</span> 진료 때 이 점수를 알려 주세요.':'<span class="muted">변화가 있을 때마다 기록해 두세요.</span>'}
$('#distress').addEventListener('input',distressUI);
window.saveDistress=function(){var s=+$('#distress').value;state.distress.unshift({id:uid(),date:today(),score:s});state.distressValue=s;save();toast('마음 온도계 '+s+'점 기록')};

function nf(v){return v===''||v==null?'-':(+v).toLocaleString('ko-KR')}
function labTable(arr,del){if(!arr.length)return '<div class="empty">아직 수치 기록이 없어요.</div>';
  return '<table class="labtbl"><tr><th>날짜</th><th>백혈구</th><th>호중구</th><th>혈색소</th><th>혈소판</th>'+(del?'<th></th>':'')+'</tr>'+arr.map(function(x){
    return '<tr><td style="white-space:nowrap">'+(+x.date.slice(5,7))+'/'+(+x.date.slice(8))+(dTag(x.date)?'<br><span class="small muted">'+dTag(x.date).replace('항암 ','')+'</span>':'')+'</td><td>'+nf(x.wbc)+'</td><td'+(x.anc!==''&&x.anc!=null&&+x.anc<1000?' class="lo"':'')+'>'+nf(x.anc)+'</td><td>'+(x.hb===''||x.hb==null?'-':x.hb)+'</td><td'+(x.plt!==''&&x.plt!=null&&+x.plt<50000?' class="lo"':'')+'>'+nf(x.plt)+'</td>'+(del?'<td><button class="btn line sm" aria-label="삭제" style="min-width:40px;padding:0 8px" onclick="delItem(\'labs\',\''+x.id+'\')">✕</button></td>':'')+'</tr>'+(x.note?'<tr><td colspan="'+(del?6:5)+'" class="small muted" style="text-align:left;border-top:0;padding-top:0">'+esc(x.note)+'</td></tr>':'')}).join('')+'</table>'}
window.addLab=function(e){e.preventDefault();var f=e.target;function n(v,k){v=String(v||'').replace(/,/g,'').trim();if(v==='')return '';var x=parseFloat(v);if(isNaN(x))return '';if(k==='anc'&&x<30)x*=1000;if(k==='wbc'&&x<100)x*=1000;if(k==='plt'&&x<1000)x*=1000;return k==='hb'?x:Math.round(x)}
  var r={id:uid(),date:f.date.value||today(),wbc:n(f.wbc.value,'wbc'),anc:n(f.anc.value,'anc'),hb:n(f.hb.value,'hb'),plt:n(f.plt.value,'plt'),note:f.note.value.trim()};
  if(r.wbc===''&&r.anc===''&&r.hb===''&&r.plt===''&&!r.note){toast('수치를 하나 이상 적어 주세요');return}
  state.labs.unshift(r);state.labs.sort(function(a,b){return b.date.localeCompare(a.date)});save();toast('검사 수치를 저장했어요');
  if((r.anc!==''&&r.anc<1000)||(r.plt!==''&&r.plt<50000))toast('낮은 수치예요. 발열·출혈에 특히 주의하고 병원 안내를 따르세요')};
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
  var cd=cday(),cds=chemoDates();
  var srx=myRx(),sci=cycleInfo();var sdev=devList();
  if(cds.length||srx)h+='<div class="card"><h3>💉 항암 치료</h3><table>'+(srx?'<tr><th>요법</th><td>'+esc(srx.name)+(state.profile.rxCombo.length?' + '+esc(state.profile.rxCombo.map(function(x){var r=RXDB.byId(x);return r?r.ko:''}).join(', ')):'')+' <span class="muted small">('+esc(cycleTxt(srx))+')</span></td></tr>':'')+(sdev.length?'<tr><th>몸에 달린 것</th><td>'+esc(sdev.map(function(k){return DEV[k].n}).join(', '))+'</td></tr>':'')+(sci?'<tr><th>현재 주기</th><td>'+sci.no+'차 · 시작 '+fmt(sci.start)+'</td></tr><tr><th>다음 항암</th><td>'+(sci.booked?fmt(sci.booked.date)+' (예약)':fmt(sci.next)+' (참고용 예상)')+'</td></tr>':'')+(cds.length?'<tr><th>최근 항암</th><td>'+fmt(cds[cds.length-1])+(cd?' (오늘 '+dLbl(cd)+')':'')+'</td></tr>':'')+(cds.length>1?'<tr><th>이전 항암</th><td>'+cds.slice(-4,-1).reverse().map(fmt).join(', ')+'</td></tr>':'')+'</table></div>';
  if(state.labs.length)h+='<div class="card"><h3>🩸 최근 혈액검사</h3>'+labTable(state.labs.slice(0,3),false)+'</div>';
  h+='<div class="card"><h3>🩺 최근 2주 몸 상태</h3>'+(logs.length?'<table><tr><th>체온</th><td'+(temps.some(function(v){return v>=38})?' class="warn"':'')+'>'+(temps.length?'최고 '+Math.max.apply(null,temps).toFixed(1)+'℃ · '+temps.length+'회 측정'+(temps.filter(function(v){return v>=38}).length?' · 38℃ 이상 '+temps.filter(function(v){return v>=38}).length+'회':''):'기록 없음')+'</td></tr>'+
    '<tr><th>통증</th><td'+(pains.some(function(v){return v>=7})?' class="warn"':'')+'>'+(pains.length?'평균 '+(pains.reduce(function(a,b){return a+b},0)/pains.length).toFixed(1)+' · 최고 '+Math.max.apply(null,pains)+'/10':'기록 없음')+'</td></tr>'+
    '<tr><th>식사량</th><td>'+(meals.length?'평균 '+Math.round(meals.reduce(function(a,b){return a+b},0)/meals.length)+'% (평소 대비)':'기록 없음')+'</td></tr>'+
    '<tr><th>체중</th><td>'+(ws.length?ws[ws.length-1].weight+'kg'+(wchg!==null?' (첫 기록 대비 '+(wchg>0?'+':'')+wchg+'kg)':''):'기록 없음')+'</td></tr>'+
    '<tr><th>마음 온도계</th><td'+(dv&&dv.score>=7?' class="warn"':'')+'>'+(dv?dv.score+'/10 ('+fmt(dv.date)+')':'기록 없음')+'</td></tr>'+
    (flags.length?'<tr><th>주의 기록</th><td class="warn">'+flags.map(function(l){return fmt(l.date)}).join(', ')+'</td></tr>':'')+'</table>':'<div class="empty">최근 2주 기록이 없어요.</div>')+'</div>';
  if(logs.length)h+='<div class="card"><h3>📋 날짜별 기록</h3><table>'+logs.slice(0,10).map(function(l){return '<tr><th>'+fmt(l.date)+'</th><td>'+logLine(l)+'</td></tr>'}).join('')+'</table></div>';
  h+='<div class="card"><h3>💊 복용 중인 약</h3>'+(act.length?'<table>'+act.map(function(m){var n=0;for(var i=0;i<7;i++){var d=ymd(new Date(Date.now()-i*864e5));if(state.checks[d]&&state.checks[d]['med_'+m.id])n++}return '<tr><th>'+esc(m.name)+'</th><td>'+esc([m.dose,m.schedule].filter(Boolean).join(' · ')||'-')+(n?' <span class="muted small">· 최근 7일 체크 '+n+'일</span>':'')+'</td></tr>'}).join('')+'</table>':'<div class="empty">등록된 약 없음</div>')+'</div>';
  h+='<div class="card"><h3>❓ 오늘 꼭 물어볼 것</h3>'+(qs.length?'<ol style="margin:0;padding-left:20px">'+qs.map(function(q){return '<li style="margin:4px 0">'+(q.priority==='high'?'<b>':'')+esc(q.question)+(q.priority==='high'?'</b>':'')+'</li>'}).join('')+'</ol>':'<div class="empty">적어둔 질문 없음</div>')+'</div>';
  h+='<div class="card"><h3>📅 다음 일정</h3>'+(up.length?'<table>'+up.map(function(x){return '<tr><th>'+fmt(x.date)+(x.time?' '+x.time:'')+'</th><td>'+esc(x.title)+'</td></tr>'}).join('')+'</table>':'<div class="empty">예정 일정 없음</div>')+'</div>';
  h+='<p class="note-foot">환자·보호자가 직접 기록한 내용입니다. '+(RXDB?esc(RXDB.NOTICE_SHORT):'진단·처방 판단은 의료진이 합니다.')+'</p>';
  $('#summary').innerHTML=h;
}

/* ═════════ 응급 시트 ═════════ */
var RED=[['red-fever','체온 38.0℃ 이상 또는 심한 오한','항암치료 중에는 감염을 빠르게 확인해야 해요. 해열제로 먼저 내리지 마세요.'],['red-breath','숨이 몹시 차거나 가슴 통증, 입술이 파래짐','갑자기 생기거나 빠르게 나빠지는 경우'],['red-conscious','의식이 흐려짐 · 경련 · 갑자기 말이 어눌함','깨우기 어렵거나 혼동이 있는 경우 포함'],['red-bleed','멈추지 않는 출혈 · 피를 토함 · 혈변이나 검은 변','눌러도 계속되거나 어지럼이 함께 있는 경우'],['red-allergy','얼굴·입술·목이 붓거나 심한 알레르기 반응','숨쉬기 어렵거나 온몸 두드러기'],['red-dehydration','물을 못 마실 만큼 반복 구토 · 소변이 크게 줄어듦','심한 입마름·어지럼 등 탈수 증상'],['red-spine','갑자기 다리 힘이 빠지거나 감각 이상 · 대소변 조절 변화','새로 생긴 등·허리 통증과 함께면 더 급해요']];
var AMB=[['amber-meal','식사량이 평소 절반 이하','하루 이상 이어지거나 체중이 줄 때'],['amber-gi','설사·구토가 반복되거나 갑자기 늘어남','치료 종류에 따라 더 빨리 연락해야 할 수 있어요'],['amber-pain','처방 진통제로도 조절되지 않는 통증','새로 생기거나 점점 심해질 때'],['amber-rash','새로운 발진 · 눈이나 피부가 노래짐 · 부종 · 저림 · 시야 변화','면역·표적치료 중에는 가벼워 보여도 일찍 상담'],['amber-mouth','입안 통증으로 먹거나 마시기 어려움','입안 헐음, 하얀 막, 출혈이 있을 때']];
function chkHTML(a,lv){return a.map(function(x){return '<label class="chk"><input type="checkbox" value="'+x[0]+'" data-level="'+lv+'"'+(state.triage.items.indexOf(x[0])>=0?' checked':'')+'><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></label>'}).join('')}
function renderER(){var el=$('#erBody');if(!el)return;var p=state.profile,rx=myRx(),lc=lastChemo(),c=cday(),tl=state.logs.find(function(x){return x.date===today()}),lb=state.labs[0],act=state.meds.filter(function(m){return m.active==='yes'});
  var injOnly=rx&&(rx.type==='호르몬'||rx.once);
  var rows=[['이름',p.name||'-'],['암 종류',[p.cancer,p.stage].filter(Boolean).join(' · ')||'-'],['치료',rx?rx.name+(state.profile.rxCombo.length?' + '+state.profile.rxCombo.map(function(x){var r=RXDB.byId(x);return r?r.ko:''}).join(', '):''):(p.treatment||'-')],
    ['마지막 치료일',lc?fmt(lc)+(c?' ('+dLbl(c)+')':''):'-'],['오늘 체온',tl&&tl.temp?tl.temp+'℃':'기록 없음'],
    ['최근 혈액검사',lb?fmt(lb.date)+' · 호중구 '+(lb.anc||'-')+' · 혈소판 '+(lb.plt||'-'):'기록 없음'],
    ['복용 중인 약',act.length?act.map(function(m){return m.name}).join(', '):'-'],['알레르기·기타',p.biomarkers||'-'],
    ['몸에 달린 것',devList().map(function(k){return DEV[k].n}).join(', ')||'-'],['치료 병원',(p.hospital||'-')+(p.dayPhone?' · '+p.dayPhone:'')]];
  el.innerHTML='<div class="er-head">'+(injOnly?'암 치료 중인 환자예요':'항암 치료 중인 환자예요')+(tl&&+tl.temp>=38?'<br><span>오늘 '+esc(tl.temp)+'℃ 발열</span>':'')+'</div><table class="er-t">'+rows.map(function(r){return '<tr><th>'+r[0]+'</th><td>'+esc(r[1])+'</td></tr>'}).join('')+'</table><p class="nshort">환자·보호자가 노트에 기록한 내용이에요. 의료진 확인을 돕는 참고 자료예요.</p>'}
function renderSOS(){
  var p=state.profile,c='';
  c+=p.dayPhone?'<a class="btn red" href="'+tel(p.dayPhone)+'">📞 치료병원</a>':'<button class="btn line" onclick="openSheet(\'settings\')">병원 번호 등록</button>';
  c+=p.nightPhone?'<a class="btn red" href="'+tel(p.nightPhone)+'">🌙 야간·응급</a>':'<a class="btn line" href="https://www.e-gen.or.kr/egen/search_emergency_room.do" target="_blank" rel="noopener">🏥 가까운 응급실</a>';
  c+='<a class="btn red" href="tel:119">🚑 119</a><a class="btn line" href="tel:109">💙 109 마음 위기</a>';
  c+='<button class="btn line" style="grid-column:1/-1" onclick="openSheet(\'er\')">📋 응급실에서 보여 줄 화면</button>';
  $('#sosCalls').innerHTML=c+routeHTML(true);$('#redList').innerHTML=chkHTML(RED,'red');$('#amberList').innerHTML=chkHTML(AMB,'amber');triage(true);
}
function triage(silent){
  var boxes=[].slice.call(document.querySelectorAll('#sh-sos [data-level]'));
  var items=boxes.filter(function(x){return x.checked}).map(function(x){return x.value});
  if(!silent){state.triage={items:items,at:items.length?Date.now():0};localStorage.setItem(KEY,JSON.stringify(state))}
  var red=items.filter(function(v){return v.indexOf('red')===0}).length,amb=items.length-red,el=$('#triageResult');
  if(red&&!silent)el.scrollIntoView({block:'nearest',behavior:'smooth'});if(red){el.className='result red';el.innerHTML='<b>지금 바로 치료병원 또는 응급실에 연락하세요.</b><br>혼자 운전해서 가지 말고, 숨쉬기 힘들거나 의식이 처지면 119를 부르세요. 연락할 때 체온·증상 시작 시각·마지막 치료 날짜를 함께 말하면 빨라요.'}
  else if(amb){el.className='result amber';el.innerHTML='<b>오늘 안에 치료병원에 상담하세요.</b><br>증상이 빠르게 나빠지면 바로 연락하거나 응급실로 가세요.'}
  else{el.className='result none';el.textContent='해당하는 항목이 없으면 기록을 이어가고, 변화가 생기면 다시 확인하세요.'}
}
$('#sh-sos').addEventListener('change',function(e){if(e.target.matches('[data-level]'))triage()});

/* ═════════ 설정 ═════════ */
function fillProfile(){var f=$('#profileForm');Object.keys(defaultState.profile).forEach(function(k){if(f[k]&&!Array.isArray(defaultState.profile[k]))f[k].value=state.profile[k]||''});[].forEach.call(f.querySelectorAll('[name=dev]'),function(b){b.checked=(state.profile.devices||[]).indexOf(b.value)>=0})}
$('#profileForm').addEventListener('submit',function(e){e.preventDefault();var f=e.target;Object.keys(defaultState.profile).forEach(function(k){if(f[k]&&!Array.isArray(defaultState.profile[k])&&typeof f[k].value==='string')state.profile[k]=f[k].value.trim()});state.profile.devices=[].filter.call(f.querySelectorAll('[name=dev]'),function(b){return b.checked}).map(function(b){return b.value});save();closeSheet();toast('내 정보를 저장했어요')});
window.snooze=function(k){var o={};try{o=JSON.parse(localStorage.getItem('apuda_note_nudge')||'{}')}catch(e){}o[k]=Date.now();try{localStorage.setItem('apuda_note_nudge',JSON.stringify(o))}catch(e){}renderHome()};
window.exportData=function(){var b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='ApuDa_암환자노트_백업_'+today()+'.json';document.body.appendChild(a);a.click();a.remove();state.meta=state.meta||{};state.meta.lastBackup=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state));toast('백업 파일을 저장했어요');renderHome()};
window.importData=function(inp){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);if(!validBackup(d))throw 0;if(!confirm('지금 기록을 백업 파일 내용으로 바꿀까요?'))return;localStorage.setItem(KEY,JSON.stringify(d));state=load();renderAll();closeSheet();toast('백업을 불러왔어요')}catch(e){alert('ApuDa 노트 백업 파일이 아니에요.')}};r.readAsText(f);inp.value=''};
window.resetAll=function(){if(!confirm('모든 기록을 삭제할까요? 되돌릴 수 없어요.'))return;localStorage.removeItem(KEY);localStorage.removeItem(CHAT_KEY);state=clone(defaultState);chat=[];$('#thread').innerHTML='';renderAll();greet();closeSheet();toast('모두 삭제했어요')};

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
