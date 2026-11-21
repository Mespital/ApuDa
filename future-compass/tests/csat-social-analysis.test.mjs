import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mergeTypeData,officialTypeAnalysis,officialTypeRecords,learningTypeAnalysis} from '../dist/gichul/analysis.mjs';
import {analysisView} from '../dist/gichul/analysis-view.mjs';
import {TOPICS,generatePractice,AUTHORED_QUESTIONS} from '../dist/gichul/engine.mjs';
import {emptyRecords} from '../dist/gichul/records.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/gichul/data/'+n+'.json',import.meta.url)));
const english=read('type-analysis'),math=read('math-type-analysis'),korean=read('korean-type-analysis'),history=read('history-type-analysis'),social=read('social-type-analysis'),archive=read('archive'),pasts=read('questions').problems;
const data=mergeTypeData(english,math,korean,history,social),courses=['social-culture','social-life-ethics'];
const record=(course,year,n)=>social.records.find(r=>r.courseId===course&&r.year===year&&r.questionNumber===n);

test('social studies has 20 unique single-form questions and 50 points per year and course, with four-page source evidence',()=>{
 assert.equal(social.records.length,400);assert.equal(new Set(social.records.map(r=>r.id)).size,400);assert.equal(social.papers.length,20);assert.equal(Object.keys(social.types).length,48);
 assert.deepEqual(social.scope.courseCounts,{'social-culture':200,'social-life-ethics':200});assert.equal(social.scope.unitsByCourse['social-culture'].length,5);assert.equal(social.scope.unitsByCourse['social-life-ethics'].length,6);
 for(const course of courses)for(let year=2018;year<=2027;year++){
  const rows=social.records.filter(r=>r.courseId===course&&r.year===year),paper=social.papers.find(p=>p.courseId===course&&p.year===year);
  assert.deepEqual(rows.map(r=>r.questionNumber),Array.from({length:20},(_,i)=>i+1));assert.equal(rows.reduce((s,r)=>s+r.points,0),50);
  assert.equal(paper.pdfPageCount,4);assert.match(paper.pdfSha256,/^[a-f0-9]{64}$/);assert.ok(archive.resources.some(a=>a.id===paper.resourceId&&a.year===year&&a.domain==='사회탐구'));
  assert.match(paper.fileId,year===2027?/^paper$/:/^[a-f0-9]{24}$/);
  for(const r of rows){
   const t=social.types[r.typeId];assert.equal(r.form,'single');assert.equal(r.examStructure,'single-paper');assert.equal(r.resourceId,paper.resourceId);assert.equal(r.fileId,paper.fileId);assert.equal(r.courseId,t.courseId);assert.equal(r.unit,t.unit);assert.ok(social.scope.unitsByCourse[course].includes(t.unit));assert.ok(r.questionStyle&&t.method);
   assert.ok(r.page>=1&&r.page<=4);assert.ok([2,3].includes(r.points));assert.ok(r.box.length===4&&r.box.every(Number.isFinite)&&r.box[0]>=0&&r.box[1]>=0&&r.box[2]>r.box[0]&&r.box[3]>r.box[1]&&r.box[2]<=paper.pageSize[0]&&r.box[3]<=paper.pageSize[1]);
  }
 }
 assert.equal(social.papers.find(p=>p.year===2018).pageSize[0],771);assert.equal(record('social-culture',2027,20).page,4);
 assert.equal(record('social-life-ethics',2018,1).fileId,'20bf52b304dd4e504315e4b5');assert.equal(record('social-culture',2018,1).fileId,'42a3d1ecd939bbcb6fde3d63');assert.notEqual(social.papers.find(p=>p.year===2027&&p.courseId===courses[0]).pdfSha256,social.papers.find(p=>p.year===2027&&p.courseId===courses[1]).pdfSha256);
 assert.doesNotMatch(JSON.stringify(social),/"(text|prompt|passage|path|answerIndex|image)"|\/workspace\//);
});

test('social classifications follow the question content rather than a fixed question-number or thinker map',()=>{
 assert.equal(record('social-culture',2018,3).typeId,'social-culture-deviance');assert.equal(record('social-culture',2020,3).typeId,'social-culture-socialization');assert.equal(record('social-culture',2022,3).typeId,'social-culture-perspectives');assert.equal(record('social-culture',2027,3).typeId,'social-culture-organization');
 assert.equal(record('social-culture',2018,15).typeId,'social-culture-data-reading');assert.equal(record('social-culture',2023,16).typeId,'social-culture-culture-properties');assert.equal(record('social-culture',2025,6).typeId,'social-culture-culture-types');assert.equal(record('social-culture',2027,11).typeId,'social-culture-global-information');
 assert.equal(record('social-culture',2027,5).questionStyle,'연구 설계·가설 검증');assert.equal(record('social-culture',2027,20).questionStyle,'표·수치 자료 해석');
 assert.equal(record('social-life-ethics',2022,11).typeId,'social-life-ethics-bio-medical');assert.equal(record('social-life-ethics',2024,5).typeId,'social-life-ethics-information-ethics');assert.equal(record('social-life-ethics',2025,7).typeId,'social-life-ethics-science-responsibility');assert.equal(record('social-life-ethics',2026,6).typeId,'social-life-ethics-life-death');assert.equal(record('social-life-ethics',2027,9).typeId,'social-life-ethics-work-ethics');
 assert.equal(record('social-life-ethics',2027,6).typeId,'social-life-ethics-global-aid');assert.equal(record('social-life-ethics',2027,8).typeId,'social-life-ethics-animal-rights');assert.equal(record('social-life-ethics',2027,11).typeId,'social-life-ethics-environmental-ethics');
});

test('2,082 combined placements preserve source evidence, deduplication and social course/year/unit denominators',()=>{
 const all=officialTypeRecords(data,pasts);assert.equal(all.length,2082);assert.equal(all.filter(r=>r.questionId).length,10);assert.equal(officialTypeRecords({...data,records:[...data.records,...social.records]},pasts).length,2082);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'사회탐구'}).total,400);assert.equal(officialTypeAnalysis(data,pasts,{courseId:'social-culture'}).total,200);assert.equal(officialTypeAnalysis(data,pasts,{domain:'사회탐구',year:2027}).total,40);
 const modern=officialTypeAnalysis(data,pasts,{courseId:'social-culture',unit:'현대 사회의 변동'});assert.equal(modern.total,32);assert.equal(modern.yearTotals[2027],4);
 const selected=officialTypeAnalysis(data,pasts,{courseId:'social-life-ethics',year:2027,typeId:'social-life-ethics-moral-theories'});assert.equal(selected.total,20);assert.equal(selected.detail.length,3);assert.equal(selected.frequencies.find(g=>g.id==='social-life-ethics-moral-theories').share,15);
 assert.equal(officialTypeAnalysis(data,pasts,{courseId:'social-economics'}).total,0);
 const missing=mergeTypeData(english,math,korean,history,{_loadError:true});assert.equal(officialTypeRecords(missing,pasts).length,1682);assert.equal(missing.socialScope,null);assert.equal(missing._socialLoadError,true);
});

test('eight existing social practice topics join reviewed types while parent analytics leave saved records unchanged',()=>{
 const db=emptyRecords(),topics=TOPICS.filter(t=>courses.includes(t.courseId));assert.equal(topics.length,8);
 for(const t of topics){const q=generatePractice({courseId:t.courseId,topicId:t.id,count:1,seed:'social-analysis-'+t.id}).questions[0];db.questions[q.id]=q;db.attempts.push({qid:q.id,selected:(q.answerIndex+1)%5,time:'2026-11-21T01:00:00Z',assisted:false},{qid:q.id,selected:q.answerIndex,time:'2026-11-21T02:00:00Z',assisted:true});}
 const before=JSON.stringify(db),own=learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{domain:'사회탐구'},data);assert.equal(own.total,8);assert.equal(own.wrong,8);assert.equal(own.assistedExcluded,8);
 for(const r of own.rows){assert.ok(social.types[r.typeId]);assert.equal(r.unit,social.types[r.typeId].unit);}
 assert.equal(learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{courseId:'social-life-ethics',unit:'사회와 정의의 윤리'},data).total,1);assert.equal(JSON.stringify(db),before);
});

test('social view shows ordered units, source forms, partial coverage, practice and honest empty/failure states',()=>{
 const base={analysisMode:'official',analysisDomain:'사회탐구',analysisCourse:'social-culture',analysisYear:'2027',analysisUnit:'',analysisType:'',analysisPage:1},db=emptyRecords();
 const render=(ui=base,d=data)=>analysisView({data:d,pasts,authored:AUTHORED_QUESTIONS,db,ui});
 for(const course of courses){
  const html=render({...base,analysisCourse:course});assert.match(html,/2082/);assert.match(html,/총 200문항/);assert.match(html,/사회탐구 9과목 중/);assert.match(html,/단일형 시험지 1~20번/);assert.match(html,/발문 형식/);assert.match(html,/원문 2·3점 배점을 난도로 해석하지 않습니다/);assert.doesNotMatch(html,/undefined|NaN|Infinity/);
  const options=html.match(/aria-label="분석 단원">([\s\S]*?)<\/select>/)[1];let previous=-1;for(const unit of social.scope.unitsByCourse[course]){const at=options.indexOf(`value="${unit}"`);assert.ok(at>previous);previous=at;}
 }
 assert.match(render({...base,analysisType:'social-culture-mobility'}),/연결된 기초 유형 연습/);assert.match(render({...base,analysisCourse:'social-life-ethics',analysisType:'social-life-ethics-animal-rights'}),/연결된 기초 유형 연습/);
 const failed=render(base,mergeTypeData(english,math,korean,history,{_loadError:true}));assert.match(failed,/1682/);assert.match(failed,/사회·문화·생활과 윤리 유형 자료를 불러오지 못했습니다/);assert.doesNotMatch(failed,/사회·문화는 2018~2027학년도|생활과 윤리는 2018~2027학년도|사회탐구 400문항/);
 assert.match(render({...base,analysisCourse:'social-economics'}),/이 범위에 분류된 공식 기출 문항이 없습니다/);assert.match(render({...base,analysisMode:'learning'}),/아직 이 범위의 채점 기록이 없습니다/);
});
