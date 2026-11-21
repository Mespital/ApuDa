import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ANALYSIS_COURSES,analysisLearningCourseId,mergeTypeData,officialTypeAnalysis,officialTypeRecords,learningTypeAnalysis} from '../dist/gichul/analysis.mjs';
import {analysisView} from '../dist/gichul/analysis-view.mjs';
import {COURSES} from '../dist/gichul/catalog.mjs';
import {TOPICS,generatePractice,AUTHORED_QUESTIONS} from '../dist/gichul/engine.mjs';
import {emptyRecords} from '../dist/gichul/records.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../dist/gichul/data/'+n+'.json',import.meta.url)));
const baseParts=['type-analysis','math-type-analysis','korean-type-analysis','history-type-analysis','social-type-analysis'].map(read);
const names=['extended-social-type-analysis','science-type-analysis','vocation-type-analysis','language-type-analysis'],parts=names.map(read),pasts=read('questions').problems,archive=read('archive'),data=mergeTypeData(...baseParts,...parts);
const ui={analysisMode:'official',analysisDomain:'',analysisCourse:'',analysisYear:'',analysisUnit:'',analysisType:'',analysisPage:1};
const render=(filters={},d=data)=>analysisView({data:d,pasts,authored:AUTHORED_QUESTIONS,db:emptyRecords(),ui:{...ui,...filters}});

test('all 41 current learning courses and 8 historical ranges have real source placements, without inventing absent exams',()=>{
 const all=officialTypeRecords(data,pasts);assert.equal(all.length,9302);assert.equal(new Set(all.map(r=>r.id)).size,9302);assert.equal(all.filter(r=>r.questionId).length,10);assert.equal(ANALYSIS_COURSES.length,49);
 for(const c of COURSES)assert.ok(all.some(r=>r.courseId===c.id),c.id);
 for(const [index,expected] of [1400,1600,1520,2700].entries())assert.equal(parts[index].records.length,expected);
 const domains=Object.fromEntries([...new Set(all.map(r=>r.domain))].map(d=>[d,all.filter(r=>r.domain===d).length]));
 assert.deepEqual(domains,{'영어':450,'수학':516,'국어':516,'한국사':200,'사회탐구':1800,'과학탐구':1600,'직업탐구':1520,'제2외국어/한문':2700});
 const career=all.filter(r=>r.courseId==='vocation-career');assert.equal(career.length,120);assert.ok(career.every(r=>r.year>=2022));
 for(const c of ANALYSIS_COURSES.filter(c=>c.id.startsWith('vocation-legacy-'))){const rows=all.filter(r=>r.courseId===c.id);assert.equal(rows.length,80);assert.ok(rows.every(r=>r.year>=2018&&r.year<=2021));assert.ok(analysisLearningCourseId(c.id).startsWith('vocation-'));}
});

test('316 new official papers retain complete ranges, 50-point totals, original filenames, hashes and valid page positions',()=>{
 assert.equal(parts.reduce((n,d)=>n+d.papers.length,0),316);
 for(const d of parts){
  assert.equal(d.scope.expectedCount,d.records.length);assert.equal(d.scope.classifiedCount,d.records.filter(r=>r.typeId).length);assert.equal(d.scope.pendingCount,d.records.filter(r=>!r.typeId).length);
  for(const p of d.papers){
   const rows=d.records.filter(r=>r.year===p.year&&r.courseId===p.courseId),total=p.courseId.startsWith('language-')?30:20;
   assert.equal(rows.length,total);assert.deepEqual(rows.map(r=>r.questionNumber),Array.from({length:total},(_,i)=>i+1));assert.equal(rows.reduce((n,r)=>n+r.points,0),50);
   assert.equal(p.pdfPageCount,4);assert.match(p.pdfSha256,/^[a-f0-9]{64}$/);assert.ok(p.fileName);assert.ok(archive.resources.some(r=>r.id===p.resourceId&&r.year===p.year&&r.domain===d.scope.domain));
   for(const r of rows){
    assert.equal(r.form,'single');assert.equal(r.resourceId,p.resourceId);assert.equal(r.fileId,p.fileId);assert.ok(r.page>=1&&r.page<=p.pdfPageCount);assert.ok((total===30?[1,2]:[2,3]).includes(r.points));
    assert.ok(r.box.length===4&&r.box.every(Number.isFinite)&&r.box[0]>=0&&r.box[1]>=0&&r.box[2]>r.box[0]&&r.box[3]>r.box[1]&&r.box[2]<=p.pageSize[0]&&r.box[3]<=p.pageSize[1]);
    if(r.typeId){const t=d.types[r.typeId];assert.ok(t);assert.equal(t.courseId,r.courseId);assert.equal(t.unit,r.unit);assert.ok(d.scope.unitsByCourse[r.courseId].includes(r.unit));assert.ok(['reviewed','rule-assisted'].includes(r.reviewStatus));}
    else{assert.equal(r.unit,null);assert.equal(r.reviewStatus,'needs-review');}
   }
  }
  assert.doesNotMatch(JSON.stringify(d),/"(text|prompt|passage|path|columnText|sharedPrompt|answerIndex|image)"|\/workspace\//);
 }
 const agriculture=parts[2].records.find(r=>r.courseId==='vocation-agriculture'&&r.year===2027&&r.questionNumber===11);assert.equal(agriculture.box[0],90.18);assert.equal(agriculture.page,3);assert.equal(agriculture.points,3);
 assert.match(parts[3].papers.find(p=>p.courseId==='language-russian'&&p.year===2022).fileName,/러시아Ⅰ/);
});

test('unresolved source placements remain available but never enter type-frequency numerators or denominators',()=>{
 const original=data.records.find(r=>r.courseId==='science-physics1'&&r.typeId),changed={...data,records:data.records.map(r=>r.id===original.id?{...r,typeId:null,unit:null,reviewStatus:'needs-review'}:r)};
 const filters={courseId:original.courseId,year:original.year},before=officialTypeAnalysis(data,pasts,filters),after=officialTypeAnalysis(changed,pasts,filters);
 assert.equal(after.total,before.total-1);assert.equal(after.sourceAll.length,9302);assert.equal(after.pending.length,before.pending.length+1);assert.ok(after.pending.some(r=>r.id===original.id));assert.ok(!after.rows.some(r=>r.id===original.id));assert.equal(after.frequencies.reduce((n,g)=>n+g.count,0),after.total);
 const chosen=after.frequencies[0],narrow=officialTypeAnalysis(changed,pasts,{...filters,typeId:chosen.id});assert.equal(narrow.total,after.total);assert.equal(narrow.detail.length,chosen.count);assert.equal(chosen.share,100*chosen.count/after.total);
 const html=render({analysisDomain:'과학탐구',analysisCourse:original.courseId,analysisYear:String(original.year)},changed);assert.match(html,/추가 검토 대상/);assert.ok(html.includes(`data-id="${original.id}"`));assert.match(html,/비중 계산에 포함하지 않으며/);
 const all=officialTypeAnalysis(data,pasts);assert.equal(all.all.length+all.pending.length,9302);assert.equal(all.frequencies.reduce((n,g)=>n+g.count,0),all.total);
});

test('failed additional datasets do not erase existing analysis or claim unavailable subject coverage',()=>{
 const failed=mergeTypeData(...baseParts,parts[0],{_loadError:true,scope:{domain:'과학탐구'}},parts[2],parts[3]);
 assert.equal(officialTypeRecords(failed,pasts).length,7702);assert.ok(failed._extensionLoadErrors.includes('과학탐구'));assert.equal(officialTypeAnalysis(failed,pasts,{courseId:'science-physics1'}).total,0);
 const html=render({analysisDomain:'과학탐구',analysisCourse:'science-physics1'},failed);assert.match(html,/과학탐구 추가 유형 자료를 불러오지 못했습니다/);assert.doesNotMatch(html,/물리학Ⅰ · 2018~2027학년도 공식 원문 200문항 중/);
 const social=officialTypeAnalysis(failed,pasts,{courseId:'social-culture'});assert.equal(social.total,200);
});

test('new practice links share valid course types and units, exclude assisted attempts and never mutate saved records',()=>{
 const links=data.practiceLinks;assert.ok(Object.keys(links).length>=30);const db=emptyRecords();
 for(const [topicId,typeId] of Object.entries(links)){
  const t=TOPICS.find(t=>t.id===topicId);assert.ok(t,topicId);assert.equal(data.types[typeId].courseId,t.courseId);
  const q=generatePractice({courseId:t.courseId,topicId:t.id,count:1,seed:'extended-analysis-'+t.id}).questions[0];db.questions[q.id]=q;db.attempts.push({qid:q.id,selected:(q.answerIndex+1)%5,time:'2026-11-21T01:00:00Z',assisted:false},{qid:q.id,selected:q.answerIndex,time:'2026-11-21T02:00:00Z',assisted:true});
 }
 const before=JSON.stringify(db),own=learningTypeAnalysis(db,pasts,AUTHORED_QUESTIONS,{},data);assert.equal(own.total,Object.keys(links).length);assert.equal(own.wrong,own.total);assert.equal(own.assistedExcluded,own.total);
 for(const r of own.rows){assert.ok(data.types[r.typeId]);assert.equal(r.unit,data.types[r.typeId].unit);}
 assert.equal(JSON.stringify(db),before);
});

test('all 49 ranges render with explicit review status, ordered units and a bounded global comparison',()=>{
 for(const c of ANALYSIS_COURSES){const html=render({analysisDomain:c.domain,analysisCourse:c.id});assert.doesNotMatch(html,/undefined|NaN|Infinity/);if(data.expansionScope.indexedCourseCounts[c.id]){assert.match(html,/공식 원문/);assert.match(html,/발문·자료의 규칙 보조 분류/);const options=html.match(/aria-label="분석 단원">([\s\S]*?)<\/select>/)[1];let previous=-1;for(const unit of data.expansionScope.unitsByCourse[c.id]){const at=options.indexOf(`value="${unit}"`);assert.ok(at>previous,`${c.id}: ${unit}`);previous=at;}}}
 const html=render();assert.match(html,/전체 원문 색인 9302문항/);assert.match(html,/과거 시험 8개 범위/);assert.ok((html.match(/data-action="analysis-type"/g)||[]).length<=40);
 assert.doesNotMatch(render({analysisDomain:'사회탐구',analysisCourse:'social-economics'}),/사회탐구 9과목 중 사회·문화와 생활과 윤리 각 200문항/);
});
