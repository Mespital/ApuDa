import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ANALYSIS_COURSES,analysisCourseById,mergeTypeData,officialTypeAnalysis,officialTypeRecords,learningTypeAnalysis} from '../dist/gichul/analysis.mjs';
import {analysisView} from '../dist/gichul/analysis-view.mjs';
import {generatePractice,AUTHORED_QUESTIONS} from '../dist/gichul/engine.mjs';
import {emptyRecords} from '../dist/gichul/records.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../dist/gichul/data/'+name+'.json',import.meta.url)));
const english=read('type-analysis'),math=read('math-type-analysis'),data=mergeTypeData(english,math),archive=read('archive'),pasts=read('questions').problems;
const courses=['math-common','math-statistics','math-calculus','math-geometry','math-legacy-ga','math-legacy-na'];
const record=(year,courseId,questionNumber)=>math.records.find(r=>r.year===year&&r.courseId===courseId&&r.questionNumber===questionNumber);

test('516 math placements have complete odd-form ranges, source positions and exam score totals for both structures',()=>{
 assert.equal(math.records.length,516);assert.equal(new Set(math.records.map(r=>r.id)).size,516);assert.equal(math.papers.length,14);
 assert.deepEqual(math.scope.courseCounts,{'math-calculus':48,'math-common':132,'math-geometry':48,'math-legacy-ga':120,'math-legacy-na':120,'math-statistics':48});
 for(let year=2018;year<=2027;year++)for(const course of courses){
  const old=course.startsWith('math-legacy-'),rows=math.records.filter(r=>r.year===year&&r.courseId===course);
  if((year<2022)!==old){assert.equal(rows.length,0);continue;}
  const start=old||course==='math-common'?1:23,length=old?30:course==='math-common'?22:8;
  assert.deepEqual(rows.map(r=>r.questionNumber),Array.from({length},(_,i)=>start+i));
  assert.equal(rows.reduce((s,r)=>s+r.points,0),old?100:course==='math-common'?74:26);
  for(const r of rows){
   const paper=math.papers.find(p=>p.resourceId===r.resourceId&&p.fileId===r.fileId),type=math.types[r.typeId];
   assert.ok(paper);assert.match(paper.pdfSha256,/^[a-f0-9]{64}$/);assert.ok(archive.resources.some(a=>a.id===r.resourceId&&a.domain==='수학'&&a.year===year));
   assert.equal(r.form,'odd');assert.ok(type);assert.equal(type.courseId,course);assert.equal(type.unit,r.unit);assert.equal(analysisCourseById(course).domain,'수학');
   assert.ok(r.page>=1&&r.page<=(old?12:20)&&r.page<=paper.pdfPageCount);
   assert.ok(r.box.length===4&&r.box.every(Number.isFinite)&&r.box[0]>=0&&r.box[1]>=0&&r.box[2]>r.box[0]&&r.box[3]>r.box[1]&&r.box[2]<=paper.pageSize[0]&&r.box[3]<=paper.pageSize[1]);
   assert.match(r.fileId,/^(paper|[a-f0-9]{24})$/);assert.equal(r.examStructure,old?'ga-na':'common-elective');
  }
 }
 assert.doesNotMatch(JSON.stringify(math),/"(text|prompt|passage|path|answerIndex)"|\/workspace\//);
});

test('representative concepts follow the original question, including historical changes at the same question number',()=>{
 assert.equal(record(2018,'math-legacy-ga',1).typeId,'math-legacy-ga-vectors');
 assert.equal(record(2021,'math-legacy-ga',1).typeId,'math-legacy-ga-exponents');
 assert.equal(record(2023,'math-common',2).typeId,'math-limit');
 assert.equal(record(2027,'math-common',2).typeId,'math-derivative');
 assert.equal(record(2025,'math-common',16).typeId,'math-exponential-functions');
 assert.equal(record(2026,'math-common',16).typeId,'math-sequence');
 assert.equal(record(2027,'math-calculus',27).typeId,'math-calculus-differentiation');
 assert.equal(record(2027,'math-geometry',27).typeId,'math-geometry-space');
 assert.equal(record(2027,'math-statistics',27).typeId,'math-statistics-estimation');
});

test('966 combined placements preserve original evidence and attach the 10 existing solvers without counting them twice',()=>{
 const all=officialTypeRecords(data,pasts);assert.equal(all.length,966);assert.equal(all.filter(r=>r.questionId).length,10);
 const q=all.find(r=>r.year===2023&&r.courseId==='math-common'&&r.questionNumber===2);assert.equal(q.typeId,'math-limit');assert.ok(q.resourceId&&q.questionId&&q.box);assert.equal(q.id,record(2023,'math-common',2).id);
 assert.equal(officialTypeRecords({...data,records:[...data.records,...data.records]},pasts).length,966);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'수학'}).total,516);
 const selected=officialTypeAnalysis(data,pasts,{domain:'수학',courseId:'math-statistics',year:2027,typeId:'math-statistics-estimation'});
 assert.equal(selected.total,8);assert.equal(selected.detail.length,1);assert.equal(selected.detail[0].questionNumber,27);
 assert.equal(selected.frequencies.find(g=>g.id==='math-statistics-estimation').share,12.5);
 const ga=officialTypeAnalysis(data,pasts,{courseId:'math-legacy-ga'});assert.equal(ga.total,120);assert.equal(ga.yearTotals[2021],30);assert.equal(ga.yearTotals[2022],0);
 const common=officialTypeAnalysis(data,pasts,{courseId:'math-common'});assert.equal(common.total,132);assert.equal(common.yearTotals[2021],0);assert.equal(common.yearTotals[2022],22);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'수학',year:2027}).total,46);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'수학',year:2018}).total,60);
 const fallback=mergeTypeData(english,{records:[],types:{},_loadError:true});assert.equal(officialTypeRecords(fallback,pasts).length,460);assert.equal(fallback.mathScope,null);assert.equal(fallback._mathLoadError,true);
});

test('math personal analysis uses the same type and unit as official analysis while retaining saved records',()=>{
 const db=emptyRecords(),q=generatePractice({courseId:'math-statistics',topicId:'math-statistics-combinations',count:1,seed:'math-analysis'}).questions[0];
 db.questions[q.id]=q;db.attempts=[{qid:q.id,selected:(q.answerIndex+1)%5,time:'2026-11-21T01:00:00Z',assisted:false}];
 const before=JSON.stringify(db),type=data.types['math-statistics-counting'];
 const own=learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{domain:'수학',courseId:'math-statistics',unit:type.unit,typeId:'math-statistics-counting'},data);
 assert.equal(own.total,1);assert.equal(own.wrong,1);assert.equal(own.frequencies[0].courseId,'math-statistics');assert.equal(own.rows[0].unit,type.unit);assert.equal(own.frequencies[0].smallSample,true);assert.equal(JSON.stringify(db),before);
});

test('analysis views label historical and elective scopes, handle absent types, and expose no fabricated completeness after load failure',()=>{
 const db=emptyRecords(),base={analysisMode:'official',analysisDomain:'수학',analysisCourse:'math-common',analysisYear:'',analysisUnit:'',analysisType:'',analysisPage:1};
 for(const c of ANALYSIS_COURSES)for(const mode of ['official','learning']){
  const html=analysisView({data,pasts,authored:AUTHORED_QUESTIONS,db,ui:{...base,analysisMode:mode,analysisDomain:c.domain,analysisCourse:c.id}});
  assert.doesNotMatch(html,/undefined|NaN|Infinity/);if(mode==='official'&&c.id==='math-common'){assert.match(html,/132/);assert.match(html,/선택과목마다 같은 공통 문항을 반복 집계하지 않습니다/);}
 }
 const render=(ui=base,d=data)=>analysisView({data:d,pasts,authored:AUTHORED_QUESTIONS,db,ui});
 assert.match(render(),/수학 516문항/);assert.match(render(),/한 수험생의 시험 문항 수가 아닙니다/);
 const legacy=render({...base,analysisCourse:'math-legacy-na'});assert.match(legacy,/수학 나형 · 2018~2021/);assert.match(legacy,/120문항/);
 const absent=render({...base,analysisYear:'2018'});assert.match(absent,/이 범위에 분류된 공식 기출 문항이 없습니다/);
 const absentType=render({...base,analysisCourse:'math-statistics',analysisYear:'2022',analysisType:'math-statistics-normal'});assert.match(absentType,/선택한 학년도·단원에 이 유형의 문항이 없습니다/);
 const failed=render(base,mergeTypeData(english,{_loadError:true}));assert.match(failed,/수학 유형 자료를 불러오지 못했습니다/);assert.match(failed,/10문항 표본/);assert.doesNotMatch(failed,/수학 516문항/);
});
