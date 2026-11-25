import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {COURSES} from '../dist/gichul/catalog.mjs';
import {TOPICS,AUTHORED_QUESTIONS,generatePractice,practiceInfo} from '../dist/gichul/engine.mjs';
import {mergeTypeData,practiceTypeId,learningTypeAnalysis} from '../dist/gichul/analysis.mjs';
import {practiceSourceSummary,practiceSourceView} from '../dist/gichul/practice-context.mjs';
import {renderPracticeView} from '../dist/gichul/practice-view.mjs';
import {emptyRecords,mergeBackup} from '../dist/gichul/records.mjs';

const names=['type-analysis','math-type-analysis','korean-type-analysis','history-type-analysis','social-type-analysis','extended-social-type-analysis','science-type-analysis','vocation-type-analysis','language-type-analysis'];
const data=mergeTypeData(...names.map(n=>JSON.parse(fs.readFileSync(new URL('../dist/gichul/data/'+n+'.json',import.meta.url)))));
const added=AUTHORED_QUESTIONS.filter(q=>q.practiceSet==='type-linked');
const baseUI={subject:'수학',courseId:'math-common',topic:'mixed',practiceMode:'applied',count:2,level:1};

test('82 original applied exercises cover all 41 current courses with full solutions and actual matching type records',()=>{
 assert.equal(added.length,82);assert.equal(new Set(added.map(q=>q.id)).size,82);
 const old=new Set(AUTHORED_QUESTIONS.filter(q=>q.practiceSet!=='type-linked').map(q=>JSON.stringify([q.statement,q.passage,q.mathLatex])));
 for(const course of COURSES){const rows=added.filter(q=>q.courseId===course.id);assert.equal(rows.length,2,course.id);assert.equal(new Set(rows.map(q=>JSON.stringify([q.statement,q.passage,q.mathLatex]))).size,2);}
 for(const q of added){
  assert.match(q.id,/^authored-extended-[a-z0-9-]+$/);assert.ok(!old.has(JSON.stringify([q.statement,q.passage,q.mathLatex])));assert.ok(TOPICS.some(t=>t.id===q.topicId&&t.courseId===q.courseId));
  assert.equal(q.kind,'authored');assert.equal(q.verified,false);assert.equal(q.options.length,5);assert.equal(new Set(q.options).size,5);assert.ok(Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<5);
  assert.ok(q.hint.length>8);assert.ok(q.solutionSteps.length>=3);assert.ok(q.commonMistakes.length>=2);assert.equal(q.optionAnalysis.length,5);assert.ok(q.optionAnalysis.every(s=>s.length>=12));
  assert.ok(q.sourceRefs.length);assert.ok(q.sourceRefs.every(u=>new URL(u).protocol==='https:'));
  const typeId=practiceTypeId(q.topicId,data);assert.ok(data.records.some(r=>r.courseId===q.courseId&&r.typeId===typeId),q.id);
  if(q.domain==='영어'||q.domain==='제2외국어/한문'){assert.ok(q.translation.length>20);assert.ok(q.vocabulary.length>=3);}
  if(q.languageCode==='ar')assert.equal(q.textDirection,'rtl');
 }
});

test('applied sessions use only registered exercises, preserve provenance and stop at finite capacity',()=>{
 const before=JSON.stringify(AUTHORED_QUESTIONS);
 for(const c of COURSES){
  const info=practiceInfo(c.id,'mixed','applied');assert.equal(info.dynamic,false);assert.equal(info.capacity,2);assert.deepEqual(info.counts,[1,2]);
  for(let seed=0;seed<5;seed++){
   const opts={courseId:c.id,practiceMode:'applied',count:20,seed:'applied-'+c.id+'-'+seed},s=generatePractice(opts);
   assert.equal(s.questions.length,2);assert.equal(s.availableCount,2);assert.equal(s.mode,'type-linked');assert.equal(s.level,2);assert.deepEqual(s.questions,generatePractice(opts).questions);
   assert.equal(new Set(s.questions.map(q=>q.originId)).size,2);
   for(const q of s.questions){const original=added.find(x=>x.id===q.originId);assert.ok(original);assert.equal(q.practiceSet,'type-linked');assert.deepEqual(q.options,original.options);assert.deepEqual(q.solutionSteps,original.solutionSteps);}
  }
 }
 assert.equal(JSON.stringify(AUTHORED_QUESTIONS),before);
 assert.throws(()=>generatePractice({courseId:'english',practiceMode:'unknown'}));
 const uncovered=TOPICS.find(t=>!added.some(q=>q.topicId===t.id));assert.ok(uncovered);assert.equal(practiceInfo(uncovered.courseId,uncovered.id,'applied').capacity,0);assert.throws(()=>generatePractice({courseId:uncovered.courseId,topicId:uncovered.id,practiceMode:'applied'}),/등록된 연습문제/);
});

test('33 applied quantitative answers agree with independent calculations and reviewed answer choices',()=>{
 const answerKeys={
  'math-common-horizontal-coefficient':'4','math-common-partial-sums-reverse':'16','math-statistics-committee-composition':'18','math-statistics-compare-standard-scores':'118','math-calculus-tank-net-change':'32L','math-calculus-bounce-total-distance':'30m','math-geometry-perpendicular-sum':'25','math-geometry-focal-distance-transfer':'3',
  'social-korea-geography-regional-denominators':'A는 50, B는 25이며 A가 B의 2배이다.','social-world-geography-growth-components':'자연 감소 200명, 사회적 증가 700명으로 전체 500명 증가했다.','social-world-geography-midnight-local-time':'화요일 2시 30분','social-economics-trade-both-absolute':'A국은 밀, B국은 옷에 비교우위가 있으며 제시된 교환비율은 양국 모두에게 이익이 될 수 있다.','social-economics-market-shortage':'40','social-politics-valid-vote-denominator':'A 3석, B 2석, C 1석','vocation-career-dependent-schedule':'오후 5시','vocation-industry-serial-efficiency':'60%','vocation-industry-efficiency-percentage-points':'B의 효율은 A보다 15%포인트 높다.','vocation-marine-hemisphere-change':'위도는 남쪽으로 17°, 경도는 동쪽으로 10° 변했다.',
  'science-physics1-opposite-carts':'오른쪽 1m/s, 운동 에너지 감소','science-physics1-fixed-frequency-boundary':'0.40m, 40Hz','science-chemistry1-mix-then-dilute':'0.20mol/L','science-chemistry1-atoms-in-two-samples':'2','science-biology1-dominant-offspring-condition':'2/3','science-biology1-unequal-transfer-efficiency':'15%, 1.5%','science-earth1-parent-daughter-ratio':'6억 년','science-earth1-brightness-temperature-radius':'1/2배','science-physics2-isolated-capacitor-dielectric':'3V, 36μJ','science-physics2-decreasing-outward-field':'1.0V, 반시계 방향','science-chemistry2-compression-reaction-quotient':'20, 정반응','science-chemistry2-reverse-and-scale-path':'−220kJ','science-biology2-dominant-carrier-frequency':'4/7','science-earth2-six-month-displacement':'25pc','science-earth2-elliptic-apsides':'27년'
 };
 function calculate(id,p){switch(id){
  case'math-common-horizontal-coefficient':{const coefficient=6*p.tangentX-3*p.tangentX**2;return p.evaluateX**3-3*p.evaluateX**2+coefficient*p.evaluateX+2;}
  case'math-common-partial-sums-reverse':{const d=(p.S6-2*p.S3)/9,a=p.S3/3-d;return a+(p.n-1)*d;}
  case'math-statistics-committee-composition':{let count=0;for(let a=0;a<p.students;a++)for(let b=a+1;b<p.students;b++)for(let teacher=0;teacher<p.teachers;teacher++)count++;return count;}
  case'math-statistics-compare-standard-scores':return p.meanB+(p.scoreA-p.meanA)/p.sdA*p.sdB;
  case'math-calculus-tank-net-change':return p.initialL+(p.constantRate+(p.constantRate+p.linearRate*p.endMin))*p.endMin/2;
  case'math-calculus-bounce-total-distance':return p.heightM+2*Array.from({length:120},(_,n)=>p.heightM*(p.reboundRatioNumerator/p.reboundRatioDenominator)**(n+1)).reduce((a,b)=>a+b,0);
  case'math-geometry-perpendicular-sum':{const bx=-p.a[1]*p.b[1]/p.a[0];return (p.a[0]+bx)**2+(p.a[1]+p.b[1])**2;}
  case'math-geometry-focal-distance-transfer':return p.foci.map(f=>Math.hypot(p.pointP[0]-f[0],p.pointP[1]-f[1])).reduce((a,b)=>a+b,0)-p.QF1;
  case'social-korea-geography-regional-denominators':return (p.aOld/p.aWorking)/(p.bOld/p.bWorking);
  case'social-world-geography-growth-components':return p.births+p.immigration-p.deaths-p.emigration;
  case'social-world-geography-midnight-local-time':return (p.aHour+p.aMinute/60+(p.bLongitude-p.aLongitude)/p.degreesPerHour)%24;
  case'social-economics-trade-both-absolute':assert.ok(p.aWheatHours/p.aClothHours<p.tradeCloth&&p.tradeCloth<p.bWheatHours/p.bClothHours);return p.tradeCloth;
  case'social-economics-market-shortage':return p.demandIntercept+p.demandSlope*p.price-p.supplyIntercept-p.supplySlope*p.price;
  case'social-politics-valid-vote-denominator':return p.seats*p.aVotes/(p.aVotes+p.bVotes+p.cVotes);
  case'vocation-career-dependent-schedule':return p.startHour+p.aHours+p.bHours+p.cHours+p.breakHours;
  case'vocation-industry-serial-efficiency':return p.inputJ*p.stageAEfficiency*p.stageBEfficiency/p.inputJ*100;
  case'vocation-industry-efficiency-percentage-points':return 100*p.usefulJ*(1/p.bInputJ-1/p.aInputJ);
  case'vocation-marine-hemisphere-change':return p.pLatitude-p.qLatitude;
  case'science-physics1-opposite-carts':{const mass=p.massAkg+p.massBkg,v=(p.massAkg*p.velocityAmps+p.massBkg*p.velocityBmps)/mass;assert.ok(p.massAkg*p.velocityAmps**2+p.massBkg*p.velocityBmps**2>mass*v*v);return v;}
  case'science-physics1-fixed-frequency-boundary':return p.speedBmps/p.frequencyHz;
  case'science-chemistry1-mix-then-dilute':return (p.molarityA*p.volumeAL+p.molarityB*p.volumeBL)*p.aliquotL/(p.volumeAL+p.volumeBL)/p.finalVolumeL;
  case'science-chemistry1-atoms-in-two-samples':return (p.massBg/p.molarMassB*p.atomsPerMoleculeB)/(p.massAg/p.molarMassA*p.atomsPerMoleculeA);
  case'science-biology1-dominant-offspring-condition':{const children=['AA','Aa','aA','aa'].filter(g=>g.includes('A'));return children.filter(g=>g.includes('a')).length/children.length;}
  case'science-biology1-unequal-transfer-efficiency':assert.equal(100*p.secondaryConsumerKJ/p.primaryConsumerKJ,15);return 100*p.secondaryConsumerKJ/p.producerKJ;
  case'science-earth1-parent-daughter-ratio':return Math.log2((p.currentParent+p.currentDaughter)/p.currentParent)*p.halfLifeYears;
  case'science-earth1-brightness-temperature-radius':return Math.sqrt(p.apparentBrightnessRatio)*p.distanceRatio/p.temperatureRatio**2;
  case'science-physics2-isolated-capacitor-dielectric':{const charge=p.initialCapacitanceMicroF*p.initialVoltageV,voltage=charge/p.finalCapacitanceMicroF;assert.equal(charge*voltage/2,36);return voltage;}
  case'science-physics2-decreasing-outward-field':return p.turns*p.areaM2*Math.abs(p.finalFieldT-p.initialFieldT)/p.intervalS;
  case'science-chemistry2-compression-reaction-quotient':{const so2=p.initialSO2M/p.volumeFactor,o2=p.initialO2M/p.volumeFactor,so3=p.initialSO3M/p.volumeFactor,q=so3**2/(so2**2*o2),k=p.initialSO3M**2/(p.initialSO2M**2*p.initialO2M);assert.ok(q<k);return q;}
  case'science-chemistry2-reverse-and-scale-path':return (p.enthalpySecondKJ-p.enthalpyFirstKJ)*p.targetMultiplier;
  case'science-biology2-dominant-carrier-frequency':{const q=Math.sqrt(p.recessivePhenotypeFrequency);return 2*q*(1-q)/(1-p.recessivePhenotypeFrequency);}
  case'science-earth2-six-month-displacement':return 2/p.sixMonthAngularDisplacementArcsec;
  case'science-earth2-elliptic-apsides':return ((p.perihelionAU+p.aphelionAU)/2)**1.5;
  default:throw Error(id);
 }}
 const numeric=added.filter(q=>q.verification);assert.equal(numeric.length,33);
 for(const q of numeric){const id=q.id.replace('authored-extended-',''),value=calculate(id,q.verification.parameters);assert.ok(Math.abs(value-q.verification.expectedValue)<1e-7,q.id);assert.equal(q.options[q.answerIndex],answerKeys[id],q.id);}
});

test('RNA reverse complements and mathematical markup keep their intended direction and commands',()=>{
 const q=added.find(q=>q.id.endsWith('science-biology2-reverse-template-direction')),complement={A:'U',T:'A',G:'C',C:'G'},rna=[...'GCTTAC'].reverse().map(b=>complement[b]).join('');
 assert.equal(q.options[q.answerIndex],`5′-${rna}-3′`);
 for(const q of added)if(q.mathLatex){assert.ok(!q.mathLatex.includes('\\\\'),q.id);assert.doesNotMatch(q.mathLatex,/[\x00-\x08\x0b-\x1f]/);}
});

test('source summaries keep course boundaries and count each official placement once across shared topics',()=>{
 for(const c of COURSES){
  const summary=practiceSourceSummary(data,c.id);assert.equal(summary.practiceCount,2);assert.ok(summary.sourceCount>0,c.id);
  const ids=new Set(summary.groups.flatMap(g=>g.records.map(r=>r.id)));assert.equal(summary.sourceCount,ids.size);
  for(const g of summary.groups){assert.ok(g.records.every(r=>r.courseId===c.id&&r.typeId===g.typeId));assert.equal(g.sourceCount,new Set(g.records.map(r=>r.id)).size);assert.equal(g.example.year,Math.max(...g.records.map(r=>r.year)));}
 }
 assert.equal(practiceSourceSummary(data,'vocation-legacy-accounting'),null);assert.equal(practiceTypeId('unknown',data),null);
 const sample=added[0],typeId=practiceTypeId(sample.topicId,data),r=data.records.find(r=>r.courseId===sample.courseId&&r.typeId===typeId),d={...data,records:[r,r,{...r,id:'unrelated-course',courseId:'not-this-course'},{...r,id:'unclassified',typeId:null}]};
 assert.equal(practiceSourceSummary(d,sample.courseId,sample.topicId).sourceCount,1);
});

test('practice views expose finite counts, full course selection, original-source actions and safe empty data',()=>{
 for(const c of COURSES){
  const ui={...baseUI,subject:c.domain,courseId:c.id,count:20},html=renderPracticeView({ui,data});
  assert.equal(ui.count,2);assert.match(html,/기출 유형 연결 응용/);assert.match(html,/자체 응용문제 2문항/);assert.equal((html.match(/data-action="open-question"/g)||[]).length,2);assert.match(html,/data-action="practice-analysis"/);assert.match(html,/data-action="analysis-paper"/);assert.doesNotMatch(html,/undefined|NaN|Infinity/);
  const partial=renderPracticeView({ui:{...ui},data:{records:[],types:{}}});assert.match(partial,/연습문제와 풀이는 이용/);assert.equal((partial.match(/data-action="open-question"/g)||[]).length,2);
 }
 const q=added[0],summary=practiceSourceSummary(data,q.courseId,q.topicId),malicious=structuredClone(summary);malicious.groups[0].label='<script>attack</script>';
 assert.ok(practiceSourceView(malicious).includes('&lt;script&gt;attack&lt;/script&gt;'));assert.ok(!practiceSourceView(malicious).includes('<script>'));
 const html=renderPracticeView({ui:{...baseUI},data,sessions:{one:{id:'practice-1',createdAt:'2026-11-22T00:00:00Z',courseName:'<script>attack</script>',questionIds:['x'],practiceMode:'applied'}}});assert.ok(html.includes('&lt;script&gt;attack&lt;/script&gt;'));
});

test('switching practice modes or stale topics normalizes choices without creating a session',()=>{
 const c=COURSES.find(c=>c.id==='math-common'),ui={...baseUI,courseId:c.id,count:20,practiceMode:'standard'},before={};
 const standard=renderPracticeView({ui,data,sessions:before});assert.equal(ui.count,20);assert.match(standard,/수치와 식/);
 ui.practiceMode='applied';ui.topic='stale-topic';const applied=renderPracticeView({ui,data,sessions:before});assert.equal(ui.topic,'mixed');assert.equal(ui.count,2);assert.match(applied,/응용문제 2문항/);assert.deepEqual(before,{});
});

test('applied backup round trips retain direct and generated answers while repeated origins count once in analytics',()=>{
 const db=emptyRecords();
 for(const c of COURSES)for(let cycle=0;cycle<2;cycle++){
  const s=generatePractice({courseId:c.id,practiceMode:'applied',count:20,seed:'roundtrip-'+c.id+'-'+cycle});
  db.sessions[s.id]={...s,questionIds:s.questions.map(q=>q.id)};delete db.sessions[s.id].questions;
  for(const q of s.questions){db.questions[q.id]=q;db.attempts.push({id:q.id,qid:q.id,selected:q.answerIndex,time:`2026-11-22T00:0${cycle}:00Z`,assisted:false});db.notes[q.id]='조건을 다시 읽기';db.bookmarks.push(q.id);}
 }
 const source=[...AUTHORED_QUESTIONS],backup={app:'gichul-lab',schemaVersion:1,data:db},restored=mergeBackup(emptyRecords(),backup,source,[]),again=mergeBackup(restored,backup,source,[]);
 assert.equal(again.attempts.length,164);assert.equal(again.bookmarks.length,164);assert.equal(Object.keys(again.sessions).length,82);
 assert.ok(again.attempts.every(a=>a.correct));const frozen=JSON.stringify(again),own=learningTypeAnalysis(again,[],source,{},data);assert.equal(own.total,82);assert.equal(own.correct,82);assert.equal(JSON.stringify(again),frozen);
 for(const row of own.rows)assert.equal(row.typeId,practiceTypeId(again.questions[row.qid].topicId,data));
});
