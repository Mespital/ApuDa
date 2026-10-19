/* Synthetic local data only. Exercises the shipped parser, forms and renderers. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../../public-site'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('note/note-app.js');
const prefix=src.slice(0,src.indexOf('/* ── 화면 전환'));
const parser=src.slice(src.indexOf('var WDMAP='),src.indexOf('/* ═════════ 대화 렌더'));
assert(parser.includes('function interpret(raw)'));
function setup(){const context={console,localStorage:{getItem(){return null},setItem(){}},setTimeout(){},clearTimeout(){}};context.window=context;context.NOTE_KB={TOPICS:[]};vm.createContext(context);
  vm.runInContext(read('assets/apuda-regimens.js')+'\n'+read('note/note-storage.js')+'\n'+read('note/note-safety.js')+'\n'+prefix+'\n'+parser,context);return context;}
function run(c,text){c.input=text;return vm.runInContext('interpret(input)',c);}
for(const text of ['호중구 800, 열 38.5','호중구 800/µL, 열 38.5','질문: 열 38.5 숨이 차요','오늘 항암 받았고 열 38.5','열 38.5 오늘 항암 받았어요']){
  const c=setup(),r=run(c,text);assert(r.alerts.includes('fever'),text);assert(c.validBackup(c.state),'shipped parser produces a valid backup: '+text);assert.equal(c.state.logs[0].temp,'38.5',text);assert.equal(c.state.logs[0].tempReadings.length,1,'one reading per input');
  if(text.startsWith('호중구'))assert.equal(c.state.labs[0].anc,'800');
  if(text.startsWith('질문')){assert.equal(c.state.questions.length,1);assert(r.cards.some(x=>x.kind==='emergency'));}
}
for(const text of ['호중구 800, 숨이 차요','질문: 숨쉬기 힘들어요','가슴이 조여요','숨이 안 차지만 가슴 통증이 있어요']){
  const c=setup(),r=run(c,text);assert(r.cards.some(x=>x.kind==='emergency'),text);}
for(const text of ['열은 없어요','숨이 안 차요','호흡곤란은 없어요','가슴 통증은 없어요','열이 38이면 어떻게 해요?','38.5도면 병원에 가나요?','예시: 열 38.5','어제 열 38.5 숨이 차요']){
  const c=setup(),r=run(c,text);assert(!r.alerts.includes('fever'),text);assert(!r.cards.some(x=>x.kind==='emergency'),text);}
for(const text of ['체온 38도5부','38도 5부','열 38.5']){const c=setup();assert(run(c,text).alerts.includes('fever'),text);}
const current=setup();assert(!run(current,'어제 38.5도, 지금 36.8도').alerts.includes('fever'));assert.equal(current.state.logs[0].temp,'36.8');
for(const text of ['체온 37.2, 지금 심한 오한','오늘 항암 받고 온몸이 덜덜 떨려요','질문: 지금 오한이 심해요']){const c=setup(),r=run(c,text);assert(r.alerts.includes('severeChill'),text);}
for(const text of ['오한은 없어요','어제 심한 오한','심한 오한이면 어떻게 하나요?','오한이 있다면 연락하나요?','예시: 지금 심한 오한']){const c=setup(),r=run(c,text);assert(!r.alerts.includes('chill')&&!r.alerts.includes('severeChill'),text);}
{const c=setup(),r=run(c,'오한은 심하지 않아요');assert(!r.alerts.includes('severeChill'));assert(r.alerts.includes('chill'));}
for(const [text,key,value,unit] of [
  ['호중구 20','anc',20,'unknown'],['호중구 20/µL','anc',20,'/µL'],['호중구 0.8 ×10³/µL','anc',800,'/µL'],
  ['백혈구 2.3 x10^3/uL','wbc',2300,'/µL'],['백혈구 2.3 ×10^9/L','wbc',2300,'/µL'],['혈소판 20만','plt',200000,'/µL'],
  ['혈소판 20','plt',20,'unknown'],['혈색소 10 g/dL','hb',10,'g/dL']]){
  const c=setup(),l=c.ApuDaNoteSafety.lab(text,key);assert.equal(l.value,value,text);assert.equal(l.unit,unit,text);
  const r=run(c,text);assert.equal(+c.state.labs[0][key],value,text);assert.equal(c.state.labs[0].units[key],unit,text);
  if(unit==='unknown')assert(!r.alerts.some(x=>x==='lowAnc'||x==='lowPlt'),'unknown units must not be used for a threshold');}
const sequence=setup();run(sequence,'열 38.5');const snapshot=JSON.stringify(sequence.state);run(sequence,'열 36.8');
assert.equal(sequence.state.logs[0].temp,'36.8');assert.deepEqual(Array.from(sequence.ApuDaNoteSafety.temps(sequence.state.logs[0])),[38.5,36.8]);
assert.equal(sequence.ApuDaNoteSafety.maxTemp(sequence.state.logs[0]),38.5);
sequence.state=JSON.parse(snapshot);assert.equal(sequence.state.logs[0].tempReadings.length,1,'undo snapshot retains the original array');
const legacy={temp:'38.5'};sequence.ApuDaNoteSafety.appendTemp(legacy,'36.8','test');assert.equal(legacy.tempReadings.length,2);assert.equal(legacy.tempReadings[0].at,null);assert.equal(legacy.tempReadings[0].legacy,true);
const r=sequence.APUDA_RX.byId('lonsurf');assert.deepEqual(Array.from({length:28},(_,i)=>i+1).filter(d=>sequence.APUDA_RX.isOralDay(r,d-1)),[1,2,3,4,5,8,9,10,11,12]);
assert.equal(sequence.APUDA_RX.isOralDay(r,5),false);assert.equal(sequence.APUDA_RX.isOralDay(r,6),false);assert.match(sequence.APUDA_RX.oralText(r),/1~5·8~12/);assert.match(sequence.APUDA_RX.oralText(r),/총 10일/);
const formSource=src.slice(src.indexOf('window.addLab=function'),src.indexOf('\nfunction renderSummary'));
assert(formSource.includes('f.countUnit.value'));
for(const [unit,value] of [['unknown','20'],['/µL','20'],['thousand','20000']]){
  const c=setup();vm.runInContext(formSource,c);c.save=()=>{};c.toast=()=>{};
  const field=value=>({value}),f={countUnit:field(unit),date:field('2026-10-18'),note:field(''),wbc:field(''),anc:field('20'),hb:field(''),plt:field('')};
  c.addLab({preventDefault(){},target:f});assert.equal(c.state.labs[0].anc,value);assert.equal(c.state.labs[0].units.anc,unit==='thousand'?'/µL':unit);
}
const renderSource=src.slice(src.indexOf('function logLine('),src.indexOf('function renderHome('));vm.runInContext(renderSource,sequence);assert(sequence.isWarn({temp:'36.8',tempReadings:[{value:'38.5'},{value:'36.8'}]}));
assert(src.includes('temps=logs.reduce'),'summary must include all measurements');assert(src.includes("최근 '+esc((logs.find"),'summary distinguishes the latest reading');
assert(!/off=!!\(/.test(src),'generic reference calendars must not hide prescribed medicines');
// Test rendered bot cards: safety information must precede the acknowledgement.
const render=setup();vm.runInContext(src.slice(src.indexOf('function callBtns('),src.indexOf('\nfunction sendText(')),render);
render.undoToken='test';
const result=run(render,'호중구 800/µL, 열 38.5');render.out=result;const parts=vm.runInContext('botHTML(out,input)',render);assert.equal(parts[0].cls,'red');assert(parts.findIndex(x=>x.html.includes('기록했어요'))>0);
// Sender URLs contain no health sentence; the handoff stores one short-lived local item.
const bot=read('assets/apuda-bot.js'),start=bot.indexOf('function noteHandoff('),end=bot.indexOf('\nfunction siteCard(');
const b={location:{origin:'https://apuda.app',href:'https://apuda.app/',assign(url){this.assigned=url}},BASE:'',URL,navigator:{},Date,sessionStorage:{setItem(k,v){this.key=k;this.value=v}},esc:v=>String(v).replace(/"/g,'&quot;'),A:p=>p};vm.createContext(b);vm.runInContext(bot.slice(start,end),b);
const html=b.link('/note/?say='+encodeURIComponent('호중구 800, 열 38.5'),'노트 기록',true);assert(html.includes('data-note-handoff'));assert(!html.includes('href='));assert(!html.includes('?say='));
b.handoff('호중구 800, 열 38.5');assert.equal(b.location.assigned,'https://apuda.app/note/?tab=today');assert.equal(JSON.parse(b.sessionStorage.value).text,'호중구 800, 열 38.5');
assert(src.includes('sessionStorage.removeItem(\'apuda_note_handoff_v1\')'));assert(src.includes('Date.now()-item.at<600000'));assert(src.includes("prefill(item.text)"));assert(!src.includes('sendText(item.text)'));
console.log('PASS: compound fever/urgent input, units, direct forms, past/negative/conditional context, all temperatures, undo preservation, exact oral days, alert order and private handoff');
