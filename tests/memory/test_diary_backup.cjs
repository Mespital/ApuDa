const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const htmlPath = [
  path.join(__dirname,'index.html'),
  path.join(__dirname,'../../public-site/memory/index.html')
].find(candidate=>fs.existsSync(candidate));
assert.ok(htmlPath,'ApuDa Memory HTML source found');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert.ok(scriptMatch, 'main inline script present');
new vm.Script(scriptMatch[1]);

const constants = scriptMatch[1].slice(
  scriptMatch[1].indexOf('const diaryOptionLabels ='),
  scriptMatch[1].indexOf('let entries = []')
);
const functions = scriptMatch[1].slice(
  scriptMatch[1].indexOf('function validDiaryDate(value)'),
  scriptMatch[1].indexOf("$('consult-period').addEventListener")
);
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(constants + functions, sandbox);
const validate = sandbox.validateDiaryBackup;
const date = sandbox.validDiaryDate;
const summarize = sandbox.buildConsultSummary;
const filterEntries = sandbox.filterDiaryEntries;

const item = (id, text='하루의 메모', day='2026-11-11') => ({id, date:day, text});
const data = (entries, format='apuda-memory-care-diary', version=1) => ({format,version,entries});

assert.equal(date('2024-02-29'), true, 'leap day accepted');
assert.equal(date('2023-02-29'), false, 'invalid leap day rejected');
assert.equal(date('2026-13-01'), false, 'invalid month rejected');
assert.equal(date('not-a-date'), false);
assert.equal(validate(data([item('rec-1')])).length, 1, 'valid JSON accepted');
assert.equal(validate(data([item('rec-1')], 'wrong-format')), null, 'foreign app rejected');
assert.equal(validate(data([item('rec-1')], 'apuda-memory-care-diary', 3)), null, 'future schema rejected');
assert.equal(validate(data([item('rec-1')], 'apuda-memory-care-diary', 2)).length,1, 'new v2 JSON accepted');
assert.equal(validate(data([{...item('rec-1'),sleep:'나쁨'}])),null,'v1 format cannot silently lose v2 fields');
assert.equal(validate(data([{...item('rec-1'),sleep:'나쁨',meal:'부족',medicationCheck:'확인 필요',question:'수면 변화에 관해 질문'},], 'apuda-memory-care-diary', 2)).length,1,'structured observations and clinician question preserved');
assert.equal(validate(data([{...item('rec-1'),sleep:'심각'}], 'apuda-memory-care-diary', 2)),null,'unknown observations rejected');
assert.equal(validate(data([{...item('rec-1'),question:'a'.repeat(301)}], 'apuda-memory-care-diary', 2)),null,'oversized clinician question rejected');
assert.equal(validate(data(Array.from({length:21}, (_,i) => item(`id-${i}`)))), null, '21 entries rejected');
assert.equal(validate(data([item('same'),item('same')])), null, 'duplicate IDs rejected');
assert.equal(validate(data([item('id-1','')])) ,null, 'empty note rejected');
assert.equal(validate(data([item('id-1','a'.repeat(1001))])), null, 'oversized note rejected');
assert.equal(validate(data([item('id-1','note','2026-02-30')])), null, 'invalid date rejected');
assert.equal(validate(data([{id:23,date:'2026-11-11',text:'note'}])), null, 'non-string ID rejected');
assert.equal(validate(data([{id:'rec-1',date:'2026-11-11',text:'<script>alert(1)</script>'}])).length,1,'content treated as text');

for (const id of ['diary-export','diary-export-json','diary-import','diary-import-file','diary-status','diary-backup-status','diary-import-selection','diary-list-title','text-size-label','diary-sleep','diary-meal','diary-medication','diary-question','consult-period','consult-output','consult-copy','consult-print','diary-search','diary-from','diary-to','diary-filter-reset','diary-filter-status','consult-days','consult-records','consult-question-count','consult-questions']) {
  assert.ok(html.includes(`id="${id}"`), `${id} present`);
}
assert.ok(html.includes('aria-describedby="diary-import-hint diary-import-selection"'), 'file chooser is associated with guidance and selection status');
assert.ok(html.includes("$('diary-list-title').focus();"), 'deleted button focus transfers to record heading');
assert.ok(html.includes('`${item.date} ${index + 1}번째 기록 삭제`'), 'repeated dates have distinguishable delete labels');

const selectionStart = scriptMatch[1].indexOf("$('diary-import-file').addEventListener('change', (event) => {");
const selectionEnd = scriptMatch[1].indexOf("\n      $('diary-export').addEventListener", selectionStart);
assert.ok(selectionStart > 0 && selectionEnd > selectionStart, 'selection change handler present');
const selectionHandler = scriptMatch[1].slice(selectionStart, selectionEnd);
function selectedFile(files) {
  const statuses = {'diary-backup-status':{textContent:'이전 메시지'},'diary-import-selection':{textContent:''}};
  const state = {$:id=>({addEventListener:(type,handler)=>{state.handler=handler}}),handler:null};
  state.$ = id=>statuses[id] || {addEventListener:(type,handler)=>{state.handler=handler}};
  vm.createContext(state);
  vm.runInContext(selectionHandler,state);
  state.handler({target:{files}});
  return statuses;
}
const selectedValid = selectedFile([{name:'backup.json',size:1024}]);
assert.match(selectedValid['diary-import-selection'].textContent,/아직 기록을 복원하지 않았습니다/,'file selection is not mistaken for restore');
assert.equal(selectedValid['diary-backup-status'].textContent,'','old restore result cleared on new file selection');
assert.match(selectedFile([{name:'wrong.txt',size:1024}])['diary-import-selection'].textContent,/256KB 이하/,'incorrect extension warned before restore');
assert.match(selectedFile([])['diary-import-selection'].textContent,/취소되었습니다/,'cancel selection announced');

const fontStart = scriptMatch[1].indexOf("const button = $('text-size-toggle');");
const fontEnd = scriptMatch[1].indexOf('\n      const observationForm =',fontStart);
assert.ok(fontStart > 0 && fontEnd > fontStart,'text-size handler present');
const fontLabel={textContent:'글자 크게 보기'};
let largeFont=false;
const fontButton={onClick:null,attrs:{},addEventListener:(type,handler)=>{fontButton.onClick=handler},setAttribute:(name,value)=>{fontButton.attrs[name]=value}};
const fontState={document:{documentElement:{classList:{toggle:()=>{largeFont=!largeFont;return largeFont}}}},$:id=>id==='text-size-toggle'?fontButton:fontLabel};
vm.createContext(fontState);
vm.runInContext(scriptMatch[1].slice(fontStart,fontEnd),fontState);
fontButton.onClick();
assert.equal(fontLabel.textContent,'기본 글자 크기로','large mode has reversible button name');
assert.equal(fontButton.attrs['aria-pressed'],'true');
fontButton.onClick();
assert.equal(fontLabel.textContent,'글자 크게 보기');
assert.equal(fontButton.attrs['aria-pressed'],'false');

const restoreStart = scriptMatch[1].indexOf("$('diary-import').addEventListener('click', async () => {");
const restoreEnd = scriptMatch[1].indexOf("\n      window.addEventListener('storage'", restoreStart);
assert.ok(restoreStart > 0 && restoreEnd > restoreStart, 'restore event handler present');
const restoreHandler = scriptMatch[1].slice(restoreStart, restoreEnd);
const exportStart = scriptMatch[1].indexOf("$('diary-export-json').addEventListener('click', () => {");
const exportEnd = scriptMatch[1].indexOf('\n      function validDiaryDate(value)', exportStart);
assert.ok(exportStart > 0 && exportEnd > exportStart, 'JSON export event handler present');
const exportHandler = scriptMatch[1].slice(exportStart, exportEnd);

async function scenario(current, incoming, shouldConfirm=true, options={}) {
  const backupText = options.rawText ?? JSON.stringify(incoming);
  const fileInput = {files:incoming===null?[]:[{
    name:options.name ?? 'apuda-memory-diary.json',
    size:options.size ?? backupText.length,
    text:async()=>{
      if (options.fileReadFails) throw new Error('file read failed');
      return backupText;
    }
  }],value:'selected'};
  const state = {
    backing:current.map(x=>({...x})), writes:0, confirmChoice:shouldConfirm,
    diaryStatus:{textContent:''}, backupStatus:{textContent:''}, fileInput, handler:null, storageAvailable:true,
    window:{confirm:()=>{
      if (options.afterConfirm) options.afterConfirm(state);
      return state.confirmChoice;
    }},
    $:id=>id==='diary-import-file'?state.fileInput:{addEventListener:(event,fn)=>{state.handler=fn}}
  };
  vm.createContext(state);
  vm.runInContext(`${constants}\nlet entries=[];function readEntries(){
    if (readFails) { storageAvailable=false;diaryStatus.textContent='저장소를 읽을 수 없습니다.';return; }
    entries=backing.map(x=>({...x}));storageAvailable=true;
  }\nfunction persistEntries(){
    if (persistFails) {storageAvailable=false;diaryStatus.textContent='저장 공간이 부족합니다.';return false;}
    backing=entries.map(x=>({...x}));writes++;return true;
  }\nfunction renderEntries(){}\nfunction reportBackupStatus(message){diaryStatus.textContent='';backupStatus.textContent=message;}\n${functions}\nfunction renderConsultSummary(){}\n${restoreHandler}`,Object.assign(state,{readFails:!!options.readFails,persistFails:!!options.persistFails}));
  await state.handler();
  return state;
}

(async()=>{
  const prior = item('rec-1','원래 기록');

  // The JSON generated by the actual export handler must pass the actual restore validator.
  const enriched = {...item('rec-2','새로 복원'), sleep:'나쁨',meal:'부족',medicationCheck:'문의 사항 있음',question:'수면 검사가 필요한가요?'};
  const exporter = {
    entries:[prior,enriched], storageAvailable:true,
    diaryStatus:{textContent:''}, handler:null, exported:null,
    localDate:'2026-11-11',
    readEntries(){},
    reportBackupStatus:message=>{exporter.lastMessage=message},
    downloadDiaryFile:(content,filename,mime)=>{exporter.exported={content,filename,mime}},
    $:()=>({addEventListener:(event,fn)=>{exporter.handler=fn}})
  };
  vm.createContext(exporter);
  vm.runInContext(constants + functions + exportHandler,exporter);
  exporter.handler();
  assert.equal(exporter.exported.filename,'apuda-memory-diary-2026-11-11.json');
  assert.equal(exporter.exported.mime,'application/json;charset=utf-8');
  const roundTripBackup = JSON.parse(exporter.exported.content);
  assert.equal(roundTripBackup.version,2,'new backup is v2 and avoids silent downgrade');
  assert.equal(roundTripBackup.entries[1].question,'수면 검사가 필요한가요?','question survives export');
  assert.equal(validate(roundTripBackup).length,2,'actual exported JSON accepted by validator');
  const restored = await scenario([],roundTripBackup);
  assert.equal(restored.backing.length,2,'roundtrip restores both records');
  assert.equal(restored.backing.find(x=>x.id==='rec-2').sleep,'나쁨','structured field survives restore');
  assert.equal(restored.backing.find(x=>x.id==='rec-2').medicationCheck,'문의 사항 있음','medication check survives restore');
  const duplicateRoundTrip = await scenario(restored.backing,roundTripBackup);
  assert.equal(duplicateRoundTrip.writes,0,'same backup twice is idempotent');

  const merged = await scenario([prior],data([item('rec-1','백업의 다른 내용'),item('rec-2','새로 복원')]));
  assert.equal(merged.writes,1,'merge persisted once');
  assert.equal(merged.backing.length,2,'only one new record merged');
  assert.equal(merged.backing.find(x=>x.id==='rec-1').text,'원래 기록','existing record never overwritten');
  assert.match(merged.backupStatus.textContent,/중복 1건/,'duplicates explicitly reported next to import button');
  assert.equal(merged.diaryStatus.textContent,'','no duplicate screen-reader announcements from both regions');

  const maxed = await scenario(Array.from({length:19},(_,i)=>item(`old-${i}`)),data([item('new-1'),item('new-2')]));
  assert.equal(maxed.writes,0,'all-or-nothing on capacity limit');
  assert.equal(maxed.backing.length,19,'all original records retained');

  const invalid = await scenario([prior],data([item('rec-2','bad date','2026-02-30')]));
  assert.equal(invalid.writes,0,'invalid import never writes');
  assert.equal(invalid.backing[0].text,'원래 기록','original preserved after invalid import');

  const canceled = await scenario([prior],data([item('rec-2')]),false);
  assert.equal(canceled.writes,0,'cancel never writes');

  const missing = await scenario([prior],null);
  assert.equal(missing.writes,0,'missing file never writes');
  assert.match(missing.backupStatus.textContent,/먼저 JSON 백업 파일/,'local feedback visible');

  for (const [name, options] of [
    ['wrong extension',{name:'notes.txt'}],
    ['empty file',{size:0}],
    ['over 256KB',{size:256*1024+1}],
    ['unreadable file',{fileReadFails:true}],
    ['invalid JSON text',{rawText:'not json'}],
    ['unavailable storage',{readFails:true}],
    ['storage quota failure',{persistFails:true}]
  ]) {
    const attempted = await scenario([prior],data([item('rec-2')]),true,options);
    assert.equal(attempted.writes,0,`${name} never writes`);
    assert.equal(attempted.backing[0].text,'원래 기록',`${name} leaves existing record intact`);
    assert.ok(attempted.backupStatus.textContent,`${name} reports visible error`);
  }

  const concurrentCapacity = await scenario(
    Array.from({length:18},(_,i)=>item(`old-${i}`)),
    data([item('new-1'),item('new-2')]),true,
    {afterConfirm:state=>state.backing.unshift(item('other-tab','다른 탭 기록'))}
  );
  assert.equal(concurrentCapacity.writes,0,'second capacity check blocks newly-full storage');
  assert.equal(concurrentCapacity.backing.length,19,'concurrent entry remains unchanged');

  const concurrentDuplicate = await scenario(
    [prior],data([item('new-1'),item('new-2')]),true,
    {afterConfirm:state=>state.backing.unshift(item('new-1','다른 탭 기록'))}
  );
  assert.equal(concurrentDuplicate.writes,1,'changed storage rechecked before merge');
  assert.equal(concurrentDuplicate.backing.length,3);
  assert.equal(concurrentDuplicate.backing.find(x=>x.id==='new-1').text,'다른 탭 기록','other-tab version never overwritten');

  const exporterFailure = {...exporter,handler:null,exported:null,lastMessage:'',
    downloadDiaryFile:()=>{throw new Error('download blocked')}};
  exporterFailure.$ = ()=>({addEventListener:(event,fn)=>{exporterFailure.handler=fn}});
  exporterFailure.reportBackupStatus = message=>{exporterFailure.lastMessage=message};
  vm.createContext(exporterFailure);
  vm.runInContext(constants + functions + exportHandler,exporterFailure);
  exporterFailure.handler();
  assert.match(exporterFailure.lastMessage,/JSON 다운로드를 시작하지 못했습니다/,'download errors reported without false success');

  // 7/30-day report counts saved observations only; missing days are never treated as normal.
  const summaries = [
    {...item('today','오늘','2026-11-11'),sleep:'나쁨',meal:'부족',question:'진료 질문'},
    {...item('yesterday','어제','2026-11-10'),sleep:'좋음'},
    {...item('eight-days','지난주','2026-11-04'),meal:'보통'},
    {...item('future','미래','2026-11-12'),sleep:'나쁨'},
    {...item('old','오래전','2026-10-10'),sleep:'나쁨'}
  ];
  const seven = summarize(summaries,7,'2026-11-11');
  assert.match(seven,/2026-11-05 ~ 2026-11-11 \(7일\)/);
  assert.match(seven,/저장된 기록 2건/);
  assert.match(seven,/수면 관찰: 2건 기록/);
  assert.doesNotMatch(seven,/지난주|미래|오래전/,'outside period excluded');
  assert.match(seven,/기록이 없는 날짜의 상태는 알 수 없습니다/,'missing dates not interpreted');
  const thirty = summarize(summaries,30,'2026-11-11');
  assert.match(thirty,/2026-10-13 ~ 2026-11-11 \(30일\)/);
  assert.match(thirty,/저장된 기록 3건/);
  assert.match(thirty,/지난주/);
  assert.doesNotMatch(thirty,/미래|오래전/);
  assert.match(seven,/기록된 날짜 2일/,'distinct recording days calculated');
  assert.match(seven,/먼저 물어볼 질문[\s\S]*진료 질문/,'clinician questions surfaced near top');

  const searchable = [
    {...item('rec-sleep','오늘 잠을 설쳤음','2026-11-11'),sleep:'나쁨',question:'밤중 각성을 상담하고 싶음'},
    {...item('rec-meal','식사 메모','2026-11-08'),meal:'부족'},
    {...item('rec-plain','병원 방문','2026-11-03')}
  ];
  const originalSnapshot = JSON.stringify(searchable);
  assert.equal(filterEntries(searchable,'밤중','','').length,1,'search includes clinician question');
  assert.equal(filterEntries(searchable,'수면','','').length,1,'field-name search does not match records with missing observations');
  assert.equal(filterEntries(searchable,'식사','','').length,1,'search includes structured meal observations');
  assert.equal(filterEntries(searchable,'오늘 각성','','').length,1,'multiple words combined AND');
  assert.equal(filterEntries(searchable,'병원','','').length,1,'memo search');
  assert.equal(filterEntries(searchable,'','2026-11-08','2026-11-11').length,2,'date bounds inclusive');
  assert.equal(filterEntries(searchable,'','2026-11-08','2026-11-08').length,1,'same day valid');
  assert.equal(filterEntries(searchable,'','2026-11-12','').length,0,'open-ended start filter');
  assert.equal(filterEntries(searchable,'','2026-11-12','2026-11-01'),null,'reversed dates rejected');
  assert.equal(filterEntries(searchable,'','2026-02-30',''),null,'invalid date rejected');
  assert.equal(JSON.stringify(searchable),originalSnapshot,'search never mutates underlying records');
  assert.match(html,/위 기록 검색·날짜 필터와 관계없이/,'summary independent of list filters');

  console.log('PASS: legacy/v2 backup, safe merge, date/word/field search, nonmutation, 7/30-day summaries, questions, quota/errors, font/accessibility checks');
})().catch(error=>{console.error(error);process.exitCode=1});
