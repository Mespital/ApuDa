const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const main = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert.ok(main,'Memory inline JavaScript is present');
const script = main[1];
new vm.Script(script);

function between(start,end) {
  const first=script.indexOf(start), last=script.indexOf(end,first);
  assert.ok(first>=0 && last>first,`source block ${start} found`);
  return script.slice(first,last);
}
const constants = between('const diaryOptionLabels =','let entries = []');
const filterFns = between('function validDiaryDate(value)','function serializeDiaryEntry(item)');
const renderFn = between('function clearUndo()','const today = new Date()');
const submitHandler = between("$('diary-cancel-edit').addEventListener('click'",'function downloadDiaryFile(');

function uiElement(tag='div') {
  return {
    tag, value:'',textContent:'',hidden:true,checked:false,valid:true,attrs:{},children:[],handlers:{},focused:false,
    replaceChildren(...children){this.children=children},
    append(...children){this.children.push(...children)},
    setAttribute(key,value){this.attrs[key]=value},
    addEventListener(event,fn){this.handlers[event]=fn},
    focus(){this.focused=true},
    reportValidity(){return this.valid}
  };
}

function boot(backing=[],persistFails=false) {
  const ids=['diary-form','diary-status','diary-list','diary-count','diary-filter-status',
    'diary-search','diary-from','diary-to','diary-date','diary-text','diary-question','diary-sleep',
    'diary-meal','diary-medication','diary-consent','diary-next','diary-list-title',
    'diary-edit-state','diary-edit-label','diary-cancel-edit','diary-submit','diary-undo','diary-undo-label','diary-undo-button','diary-capacity-status'];
  const elements=Object.fromEntries(ids.map(id=>[id,uiElement()]));
  Object.assign(elements['diary-date'],{value:'2026-11-11'});
  const state={
    backing:backing.map(x=>({...x})),writes:0,persistFails,summaryRefreshes:0,
    lastConfirm:'',confirmChoice:false,
    $:id=>elements[id],
    document:{createElement:tag=>uiElement(tag)},
    window:{confirm:text=>{state.lastConfirm=text;return state.confirmChoice}},
    elements
  };
  const bootstrap=`${constants}
    const localDate='2026-11-11'; let entries=[]; let storageAvailable=true;
    let editingId=null; let editingSnapshot=null; let pendingUndo=null;
    const diaryForm=$('diary-form'); const diaryStatus=$('diary-status'); const diaryList=$('diary-list');
    function readEntries(){entries=backing.map(x=>({...x}));storageAvailable=true;}
    function persistEntries(){if(persistFails){diaryStatus.textContent='저장 실패';return false;}
      backing=entries.map(x=>({...x}));writes++;return true;}
    function renderConsultSummary(){summaryRefreshes++;}
    ${filterFns}
    ${renderFn}
    ${submitHandler}`;
  vm.createContext(state);
  vm.runInContext(bootstrap,state);
  state.readEntries();
  state.renderEntries();
  return state;
}

function fillNewRecord(state,text='진료 전 가상 메모') {
  const elements=state.elements;
  elements['diary-text'].value=text;
  elements['diary-question'].value='다음 방문 때 수면을 질문할까요?';
  elements['diary-sleep'].value='나쁨';
  elements['diary-meal'].value='';
  elements['diary-medication'].value='확인 필요';
  elements['diary-consent'].checked=true;
}

const older={id:'old-1',date:'2026-11-11',text:'같은 날의 기존 기록은 반드시 보존'};
const state=boot([older]);
fillNewRecord(state);
state.elements['diary-search'].value='없는검색어';
state.elements['diary-from'].value='2026-11-09';
state.elements['diary-to'].value='2026-11-09';
state.elements['diary-form'].handlers.submit({preventDefault(){}});
assert.equal(state.writes,1,'new entry persisted once');
assert.equal(state.backing.length,2,'new record is added without removing prior entry');
assert.equal(state.backing.find(e=>e.id===older.id).text,older.text,'prior record unchanged');
assert.equal(state.backing[0].question,'다음 방문 때 수면을 질문할까요?','question carried to saved entry');
assert.equal(state.backing[0].sleep,'나쁨','structured observations preserved');
assert.equal(state.backing[0].medicationCheck,'확인 필요','medication check preserved');
assert.equal(state.elements['diary-search'].value,'','successful save resets stale text filter');
assert.equal(state.elements['diary-from'].value,'','successful save resets stale start date');
assert.equal(state.elements['diary-to'].value,'','successful save resets stale end date');
assert.equal(state.elements['diary-list'].children.length,2,'new entry now immediately appears in list');
assert.match(state.elements['diary-status'].textContent,/검색·날짜 필터를 초기화/,'filter reset transparently explained');
assert.equal(state.elements['diary-next'].hidden,false,'links to records and clinician summary revealed');
assert.equal(state.elements['diary-consent'].checked,false,'save consent reset for next record');
assert.equal(state.elements['diary-text'].value,'','note input cleared after success');
assert.equal(state.summaryRefreshes,1,'clinician summary refreshed after save');

// A deletion of a same-day record must identify its note before the irreversible action.
const newestButton=state.elements['diary-list'].children[0].children.at(-1).children.find(c=>c.tag==='button' && c.textContent==='이 기록 삭제');
assert.ok(newestButton.attrs['aria-label'].includes('진료 전 가상 메모'),'delete button names actual note');
const sameDateOldButton=state.elements['diary-list'].children[1].children.at(-1).children.find(c=>c.tag==='button' && c.textContent==='이 기록 삭제');
assert.notEqual(newestButton.attrs['aria-label'],sameDateOldButton.attrs['aria-label'],'two same-date delete controls remain distinguishable');
state.confirmChoice=false;
newestButton.handlers.click();
assert.match(state.lastConfirm,/날짜: 2026-11-11/,'delete confirmation contains date');
assert.match(state.lastConfirm,/메모: 진료 전 가상 메모/,'delete confirmation contains note excerpt');
assert.match(state.lastConfirm,/JSON 백업/,'delete confirmation warns about recovery');
assert.equal(state.writes,1,'cancelled deletion does not write');
state.confirmChoice=true;
newestButton.handlers.click();
assert.equal(state.writes,2,'confirmed deletion writes once');
assert.equal(state.backing.length,1,'only selected record removed');
assert.equal(state.backing[0].text,older.text,'other record preserved on deletion');
assert.equal(state.elements['diary-next'].hidden,true,'save next links hidden after deletion');
assert.equal(state.elements['diary-list-title'].focused,true,'focus returns to records after deletion');
assert.equal(state.elements['diary-undo'].hidden,false,'delete undo available in active page');
state.elements['diary-undo-button'].handlers.click();
assert.equal(state.backing.length,2,'last deletion can be undone');
assert.equal(state.backing.find(e=>e.id===older.id).text,older.text,'original restored and unrelated record intact');
assert.equal(state.elements['diary-undo'].hidden,true,'undo cleared after successful restore');
assert.match(state.elements['diary-status'].textContent,/1건을 삭제했습니다/,'delete confirms count');

const full=boot(Array.from({length:20},(_,i)=>({id:`old-${i}`,date:'2026-11-10',text:'기존 기록'})));
fillNewRecord(full);
full.elements['diary-search'].value='원래 조건';
full.elements['diary-form'].handlers.submit({preventDefault(){}});
assert.equal(full.writes,0,'20-entry cap rejects new submission without write');
assert.equal(full.backing.length,20,'full storage is preserved');
assert.equal(full.elements['diary-search'].value,'원래 조건','failed submit preserves user filter');
assert.equal(full.elements['diary-next'].hidden,true,'no success links on rejected submit');

const failed=boot([older],true);
fillNewRecord(failed);
failed.elements['diary-search'].value='찾던기록';
failed.elements['diary-form'].handlers.submit({preventDefault(){}});
assert.equal(failed.writes,0,'storage write failure does not claim saved record');
assert.equal(failed.backing.length,1,'storage failure keeps prior record');
assert.equal(failed.elements['diary-search'].value,'찾던기록','storage failure preserves filters');
assert.equal(failed.elements['diary-next'].hidden,true,'failed write exposes no success links');

assert.match(html,/aria-label="진료 준비를 위한 3단계"/,'on-page caregiver step navigation present');
for (const id of ['diary-date','diary-list-title','consult-summary']) {
  assert.ok(html.includes(`href="#${id}"`),`${id} is linked in guided flow`);
}
assert.match(html,/id="diary-next"[^>]*hidden/,'post-save navigation hidden until actual successful save');
assert.match(html,/id="diary-undo"[^>]*hidden/,'undo panel initially hidden');
assert.match(html,/id="diary-cancel-edit" hidden/,'edit cancel initially hidden');
assert.match(html,/기록 수정은 새 건수를 차지하지 않습니다/,'capacity guidance is explicit');
assert.match(html,/\.diary-next\[hidden\]\{display:none\}/,'hidden next links not visible by CSS override');


const modify=boot([{...older}]);
const editButton=modify.elements['diary-list'].children[0].children.at(-1).children.find(c=>c.textContent==='이 기록 수정');
editButton.handlers.click();
assert.equal(modify.elements['diary-text'].value,older.text,'edit pre-fills original memo');
assert.equal(modify.elements['diary-submit'].textContent,'이 기록 수정 저장','submit button indicates edit mode');
assert.equal(modify.elements['diary-consent'].checked,false,'edit requires renewed explicit consent');
modify.elements['diary-text'].value='수정한 가상 메모';
modify.elements['diary-consent'].checked=true;
modify.elements['diary-form'].handlers.submit({preventDefault(){}});
assert.equal(modify.backing.length,1,'edit keeps the entry count');
assert.equal(modify.backing[0].id,older.id,'edit keeps original stable id');
assert.equal(modify.backing[0].text,'수정한 가상 메모','updated memo saved');
assert.equal(modify.elements['diary-undo'].hidden,false,'edit undo offered');
modify.elements['diary-undo-button'].handlers.click();
assert.equal(modify.backing[0].text,older.text,'undo edit restores previous content');
assert.equal(modify.elements['diary-undo'].hidden,true,'undo is single-use');

const stale=boot([{...older}]);
stale.elements['diary-list'].children[0].children.at(-1).children.find(c=>c.textContent==='이 기록 수정').handlers.click();
stale.backing[0].text='다른 탭의 변경';
stale.elements['diary-text'].value='이전 입력으로 덮어쓰기';
stale.elements['diary-consent'].checked=true;
stale.elements['diary-form'].handlers.submit({preventDefault(){}});
assert.equal(stale.backing[0].text,'다른 탭의 변경','stale edit never overwrites concurrent change');
assert.equal(stale.writes,0,'stale edit blocked before persistence');
assert.match(stale.elements['diary-status'].textContent,/덮어쓰지 않았습니다/);

console.log('PASS: synthetic diary submit, filter-reset visibility, post-save navigation, same-day delete confirmation/cancel, cap, storage failure, nonmutation');
