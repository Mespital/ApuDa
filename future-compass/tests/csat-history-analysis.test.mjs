import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mergeTypeData,officialTypeAnalysis,officialTypeRecords,learningTypeAnalysis} from '../dist/gichul/analysis.mjs';
import {analysisView} from '../dist/gichul/analysis-view.mjs';
import {TOPICS,generatePractice,AUTHORED_QUESTIONS} from '../dist/gichul/engine.mjs';
import {emptyRecords} from '../dist/gichul/records.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/gichul/data/'+n+'.json',import.meta.url)));
const english=read('type-analysis'),math=read('math-type-analysis'),korean=read('korean-type-analysis'),history=read('history-type-analysis'),archive=read('archive'),pasts=read('questions').problems,data=mergeTypeData(english,math,korean,history);
const review=JSON.parse(fs.readFileSync(new URL('../scripts/data/csat-history-type-review.json',import.meta.url)));
const record=(year,n)=>history.records.find(r=>r.year===year&&r.questionNumber===n);

test('history has 20 unique odd-form questions and 50 points in each of 10 years, with valid original source positions',()=>{
 assert.equal(history.records.length,200);assert.equal(new Set(history.records.map(r=>r.id)).size,200);assert.equal(history.papers.length,10);assert.equal(Object.keys(history.types).length,23);
 assert.deepEqual(history.scope.courseCounts,{'korean-history':200});assert.equal(history.scope.units.length,7);
 for(let year=2018;year<=2027;year++){
  const rows=history.records.filter(r=>r.year===year);assert.deepEqual(rows.map(r=>r.questionNumber),Array.from({length:20},(_,i)=>i+1));assert.equal(rows.reduce((s,r)=>s+r.points,0),50);
  for(const r of rows){
   const p=history.papers.find(p=>p.resourceId===r.resourceId&&p.fileId===r.fileId),t=history.types[r.typeId],label=review.labels[year][r.questionNumber];
   assert.ok(p);assert.match(p.pdfSha256,/^[a-f0-9]{64}$/);assert.ok(archive.resources.some(a=>a.id===r.resourceId&&a.year===year&&a.domain==='한국사'));
   assert.equal(r.courseId,'korean-history');assert.equal(r.form,'odd');assert.equal(r.examStructure,'single-paper');assert.ok([2,3].includes(r.points));assert.ok(r.page>=1&&r.page<=4&&r.page<=p.pdfPageCount);
   assert.equal(r.typeId,`korean-history-${label.period}-${label.theme}`);assert.equal(t.unit,r.unit);assert.equal(r.questionStyle,review.styleDefinitions[label.style].label);
   assert.ok(r.box.length===4&&r.box.every(Number.isFinite)&&r.box[0]>=0&&r.box[1]>=0&&r.box[2]>r.box[0]&&r.box[3]>r.box[1]&&r.box[2]<=p.pageSize[0]&&r.box[3]<=p.pageSize[1]);
  }
 }
 assert.equal(history.papers.find(p=>p.year===2018).pageSize[0],771);assert.equal(record(2025,19).box[0],436.56);assert.equal(record(2025,19).page,4);assert.equal(record(2027,17).page,4);
 assert.equal(new Set(history.records.map(r=>r.questionStyle)).size,8);assert.doesNotMatch(JSON.stringify(history),/"(text|prompt|passage|path|answerIndex|image)"|\/workspace\//);
});

test('periods, topics and prompt forms follow the original content, including reordered historical questions',()=>{
 assert.equal(record(2018,2).unit,'고대');assert.equal(record(2023,2).unit,'고려');assert.equal(record(2025,2).unit,'고려');assert.equal(record(2027,2).unit,'고대');
 assert.equal(record(2020,7).questionStyle,'지도·지역 자료 해석');assert.equal(record(2021,1).questionStyle,'유물·유적 해석');assert.equal(record(2027,17).questionStyle,'원인·결과·영향');
 assert.equal(record(2018,19).typeId,'korean-history-modern-formation');assert.equal(record(2023,19).typeId,'korean-history-modern-democracy');assert.equal(record(2026,19).questionStyle,'탐구 주제·활동 선택');
 assert.equal(record(2026,9).typeId,'korean-history-opening-reform');assert.equal(record(2027,12).typeId,'korean-history-colonial-movement');
});

test('1,682 combined placements retain source evidence and correct history/year/unit/type denominators',()=>{
 const all=officialTypeRecords(data,pasts);assert.equal(all.length,1682);assert.equal(all.filter(r=>r.questionId).length,10);assert.equal(officialTypeRecords({...data,records:[...data.records,...history.records]},pasts).length,1682);
 assert.equal(officialTypeAnalysis(data,pasts,{domain:'한국사'}).total,200);assert.equal(officialTypeAnalysis(data,pasts,{courseId:'korean-history',year:2027}).total,20);
 const modern=officialTypeAnalysis(data,pasts,{courseId:'korean-history',unit:'현대'});assert.equal(modern.total,35);assert.equal(modern.yearTotals[2027],4);
 const selected=officialTypeAnalysis(data,pasts,{courseId:'korean-history',year:2027,typeId:'korean-history-modern-democracy'});assert.equal(selected.total,20);assert.equal(selected.detail.length,1);assert.equal(selected.detail[0].questionNumber,17);assert.equal(selected.frequencies.find(g=>g.id==='korean-history-modern-democracy').share,5);
 const missing=mergeTypeData(english,math,korean,{_loadError:true});assert.equal(officialTypeRecords(missing,pasts).length,1482);assert.equal(missing.historyScope,null);assert.equal(missing._historyLoadError,true);
});

test('four existing history practice topics share the reviewed types and units without changing saved records',()=>{
 const db=emptyRecords(),topics=TOPICS.filter(t=>t.courseId==='korean-history');assert.equal(topics.length,4);
 for(const t of topics){const q=generatePractice({courseId:t.courseId,topicId:t.id,count:1,seed:'history-analysis-'+t.id}).questions[0];db.questions[q.id]=q;db.attempts.push({qid:q.id,selected:(q.answerIndex+1)%5,time:'2026-11-21T01:00:00Z',assisted:false},{qid:q.id,selected:q.answerIndex,time:'2026-11-21T02:00:00Z',assisted:true});}
 const before=JSON.stringify(db),own=learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{domain:'한국사'},data);assert.equal(own.total,4);assert.equal(own.wrong,4);assert.equal(own.assistedExcluded,4);
 for(const r of own.rows){assert.ok(history.types[r.typeId]);assert.equal(r.unit,history.types[r.typeId].unit);}
 assert.equal(learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{courseId:'korean-history',unit:'고려'},data).total,1);assert.equal(JSON.stringify(db),before);
});

test('history view shows ordered periods, prompt-form evidence, practice links and honest loading failures',()=>{
 const base={analysisMode:'official',analysisDomain:'한국사',analysisCourse:'korean-history',analysisYear:'2027',analysisUnit:'',analysisType:'',analysisPage:1},db=emptyRecords();
 const render=(ui=base,d=data)=>analysisView({data:d,pasts,authored:AUTHORED_QUESTIONS,db,ui});
 const html=render();assert.match(html,/1682/);assert.match(html,/한국사 200문항/);assert.match(html,/총 200문항/);assert.match(html,/원문 2·3점 배점을 난도로 해석하지 않습니다/);assert.match(html,/발문 형식 · 원인·결과·영향/);assert.doesNotMatch(html,/undefined|NaN|Infinity/);
 const unitOptions=html.match(/aria-label="분석 단원">([\s\S]*?)<\/select>/)[1];let previous=-1;for(const unit of history.scope.units){const at=unitOptions.indexOf(`value="${unit}"`);assert.ok(at>previous);previous=at;}
 assert.match(render({...base,analysisYear:'',analysisType:'korean-history-goryeo-state'}),/연결된 기초 유형 연습/);
 const failed=render(base,mergeTypeData(english,math,korean,{_loadError:true}));assert.match(failed,/한국사 유형 자료를 불러오지 못했습니다/);assert.doesNotMatch(failed,/총 200문항|한국사 200문항/);
 assert.match(render({...base,analysisMode:'learning'}),/아직 이 범위의 채점 기록이 없습니다/);
});
