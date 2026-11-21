import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ANALYSIS_COURSES,analysisCourseById,analysisLearningCourseId,mergeTypeData,officialTypeAnalysis,officialTypeRecords,learningTypeAnalysis} from '../dist/gichul/analysis.mjs';
import {analysisView} from '../dist/gichul/analysis-view.mjs';
import {TOPICS,generatePractice,AUTHORED_QUESTIONS} from '../dist/gichul/engine.mjs';
import {emptyRecords} from '../dist/gichul/records.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../dist/gichul/data/'+name+'.json',import.meta.url)));
const english=read('type-analysis'),math=read('math-type-analysis'),korean=read('korean-type-analysis'),data=mergeTypeData(english,math,korean),archive=read('archive'),pasts=read('questions').problems;
const review=JSON.parse(fs.readFileSync(new URL('../scripts/data/csat-korean-type-review.json',import.meta.url)));
const courses=['korean-legacy','korean-common','korean-speech','korean-language'];
const record=(year,courseId,questionNumber)=>korean.records.find(r=>r.year===year&&r.courseId===courseId&&r.questionNumber===questionNumber);

test('516 Korean placements cover the old single paper and current common/elective ranges with source and score checks',()=>{
 assert.equal(korean.records.length,516);assert.equal(new Set(korean.records.map(r=>r.id)).size,516);assert.equal(korean.papers.length,10);
 assert.deepEqual(korean.scope.courseCounts,{'korean-common':204,'korean-language':66,'korean-legacy':180,'korean-speech':66});
 assert.equal(Object.keys(review.typeDefinitions).length,29);assert.equal(Object.keys(korean.types).length,52);
 const units={};
 for(let year=2018;year<=2027;year++)for(const course of courses){
  const old=course==='korean-legacy',rows=korean.records.filter(r=>r.year===year&&r.courseId===course);
  if((year<2022)!==old){assert.equal(rows.length,0);continue;}
  const common=course==='korean-common',start=old||common?1:35,length=old?45:common?34:11;
  assert.deepEqual(rows.map(r=>r.questionNumber),Array.from({length},(_,i)=>start+i));
  assert.equal(rows.reduce((s,r)=>s+r.points,0),old?100:common?76:24);
  for(const r of rows){
   const paper=korean.papers.find(p=>p.resourceId===r.resourceId&&p.fileId===r.fileId),type=korean.types[r.typeId],code=review.labels[`${year}|${course}`][r.questionNumber],definition=review.typeDefinitions[code];
   assert.ok(paper);assert.match(paper.pdfSha256,/^[a-f0-9]{64}$/);assert.ok(archive.resources.some(a=>a.id===r.resourceId&&a.domain==='국어'&&a.year===year));
   assert.equal(r.form,'odd');assert.ok(type);assert.equal(type.courseId,course);assert.equal(type.unit,r.unit);assert.equal(r.typeId,`${course}-${definition.slug}`);assert.equal(analysisCourseById(course).domain,'국어');
   assert.ok(r.page>=1&&r.page<=(old?16:20)&&r.page<=paper.pdfPageCount);
   assert.ok(r.box.length===4&&r.box.every(Number.isFinite)&&r.box[0]>=0&&r.box[1]>=0&&r.box[2]>r.box[0]&&r.box[3]>r.box[1]&&r.box[2]<=paper.pageSize[0]&&r.box[3]<=paper.pageSize[1]);
   assert.match(r.fileId,/^(paper|[a-f0-9]{24})$/);assert.equal(r.examStructure,old?'single-paper':'common-elective');assert.ok([2,3].includes(r.points));
   units[r.unit]=(units[r.unit]||0)+1;
  }
 }
 assert.deepEqual(units,{'화법':30,'화법·작문 통합':46,'작문':30,'문법':50,'독서':162,'문학':162,'매체':36});
 assert.doesNotMatch(JSON.stringify(korean),/"(text|prompt|passage|path|answerIndex)"|\/workspace\//);
});

test('types follow original reading, grammar and media content rather than fixed question numbers',()=>{
 assert.equal(record(2022,'korean-language',35).typeId,'korean-language-grammar-words');
 assert.equal(record(2026,'korean-language',35).typeId,'korean-language-grammar-sounds');
 assert.equal(record(2027,'korean-language',35).typeId,'korean-language-grammar-sentence');
 assert.equal(record(2023,'korean-common',32).typeId,'korean-common-literature-expression');
 assert.equal(record(2025,'korean-common',12).typeId,'korean-common-reading-info');
 assert.equal(record(2027,'korean-common',4).typeId,'korean-common-reading-structure');
 assert.equal(record(2023,'korean-language',41).unit,'매체');assert.equal(record(2023,'korean-language',41).page,19);
 assert.equal(record(2027,'korean-language',43).typeId,'korean-language-media-language');assert.equal(record(2027,'korean-language',43).page,19);
 assert.equal(korean.records.filter(r=>r.courseId==='korean-language'&&r.typeId==='korean-language-media-language').length,6);
});

test('1,482 combined placements deduplicate common questions and retain a correct type denominator',()=>{
 const all=officialTypeRecords(data,pasts);assert.equal(all.length,1482);assert.equal(all.filter(r=>r.questionId).length,10);
 assert.equal(officialTypeRecords({...data,records:[...data.records,...data.records]},pasts).length,1482);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'국어'}).total,516);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'국어',year:2018}).total,45);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'국어',year:2027}).total,56);
 const common=officialTypeAnalysis(data,pasts,{courseId:'korean-common'});assert.equal(common.total,204);assert.equal(common.yearTotals[2021],0);assert.equal(common.yearTotals[2027],34);
 const old=officialTypeAnalysis(data,pasts,{courseId:'korean-legacy'});assert.equal(old.total,180);assert.equal(old.yearTotals[2021],45);assert.equal(old.yearTotals[2022],0);
 const selected=officialTypeAnalysis(data,pasts,{courseId:'korean-language',year:2027,typeId:'korean-language-media-language'});
 assert.equal(selected.total,11);assert.equal(selected.detail.length,1);assert.equal(selected.detail[0].questionNumber,43);
 assert.equal(selected.frequencies.find(g=>g.id==='korean-language-media-language').share,100/11);
 const failed=mergeTypeData(english,math,{_loadError:true});assert.equal(officialTypeRecords(failed,pasts).length,966);assert.equal(failed.koreanScope,null);assert.equal(failed._koreanLoadError,true);
});

test('12 Korean practice topics use the reviewed type units, exclude assisted attempts and leave saved records intact',()=>{
 const db=emptyRecords(),topics=TOPICS.filter(t=>courses.includes(t.courseId));assert.equal(topics.length,12);
 for(const topic of topics){
  const q=generatePractice({courseId:topic.courseId,topicId:topic.id,count:1,seed:'korean-analysis-'+topic.id}).questions[0];
  db.questions[q.id]=q;db.attempts.push({qid:q.id,selected:(q.answerIndex+1)%5,time:'2026-11-21T01:00:00Z',assisted:false});
  db.attempts.push({qid:q.id,selected:q.answerIndex,time:'2026-11-21T02:00:00Z',assisted:true});
 }
 const before=JSON.stringify(db),own=learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{domain:'국어'},data);
 assert.equal(own.total,12);assert.equal(own.wrong,12);assert.equal(own.assistedExcluded,12);
 for(const row of own.rows){assert.ok(korean.types[row.typeId]);assert.equal(row.unit,korean.types[row.typeId].unit);}
 const grammar=learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{courseId:'korean-language',unit:'문법'},data);assert.equal(grammar.total,3);
 assert.equal(JSON.stringify(db),before);
});

test('all 49 analysis scopes render safely, identify pending subjects and preserve historical Korean archive targets',()=>{
 const db=emptyRecords(),base={analysisMode:'official',analysisDomain:'국어',analysisCourse:'korean-common',analysisYear:'',analysisUnit:'',analysisType:'',analysisPage:1};
 assert.equal(ANALYSIS_COURSES.length,49);
 for(const c of ANALYSIS_COURSES)for(const mode of ['official','learning']){
  const html=analysisView({data,pasts,authored:AUTHORED_QUESTIONS,db,ui:{...base,analysisMode:mode,analysisDomain:c.domain,analysisCourse:c.id}});
  assert.doesNotMatch(html,/undefined|NaN|Infinity/);
 }
 const render=(ui=base,d=data)=>analysisView({data:d,pasts,authored:AUTHORED_QUESTIONS,db,ui});
 const common=render();assert.match(common,/204문항/);assert.match(common,/국어 516문항/);assert.match(common,/1482/);assert.match(common,/선택과목마다 같은 공통 문항을 반복 집계하지 않습니다/);assert.match(common,/56문항은 한 수험생의 시험 문항 수가 아닙니다/);
 const legacy=render({...base,analysisCourse:'korean-legacy'});assert.match(legacy,/180문항/);assert.match(legacy,/data-action="course-archive" data-course="korean-common"/);
 assert.equal(analysisLearningCourseId('korean-legacy'),'korean-common');assert.equal(analysisLearningCourseId('math-legacy-ga'),'math-common');
 assert.match(render({...base,analysisCourse:'korean-language'}),/공통 34문항은 이 선택과목의 분모에 포함하지 않습니다/);
 assert.match(render({...base,analysisCourse:'korean-common',analysisYear:'2018'}),/이 범위에 분류된 공식 기출 문항이 없습니다/);
 const failed=render(base,mergeTypeData(english,math,{_loadError:true}));assert.match(failed,/국어 유형 자료를 불러오지 못했습니다/);assert.doesNotMatch(failed,/국어 516문항|총 204문항/);
 assert.match(render({...base,analysisDomain:'과학탐구',analysisCourse:'science-physics1'}),/아직 추가 중입니다/);
});
