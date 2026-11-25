import {courseById} from './catalog.mjs';
import {AUTHORED_QUESTIONS,topicsForCourse,practiceInfo} from './engine.mjs';
import {buildTypeCatalog,practiceTypeId} from './analysis.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Group by the actual analysis ID so two practice topics sharing one type do not
// double-count the same official question. This is a learning link, not a claim
// that an authored exercise was copied or directly modified from an exam item.
export function practiceSourceSummary(data={},courseId,topicId='mixed',practiceMode='applied'){
 const course=courseById(courseId);if(!course)return null;
 const topics=topicsForCourse(courseId).filter(t=>(topicId==='mixed'||t.id===topicId)&&practiceInfo(courseId,t.id,practiceMode).capacity>0),catalog=buildTypeCatalog(data),groups=new Map();
 for(const topic of topics){
  const typeId=practiceTypeId(topic.id,data),type=catalog.get(typeId);if(!type||type.courseId!==courseId)continue;
  const records=(data.records||[]).filter(r=>r.courseId===courseId&&r.typeId===typeId).sort((a,b)=>b.year-a.year||a.questionNumber-b.questionNumber);
  const group=groups.get(typeId)||{typeId,label:type.label,unit:type.unit,topicIds:[],practiceCount:0,records:[]};
  group.topicIds.push(topic.id);group.practiceCount+=AUTHORED_QUESTIONS.filter(q=>q.topicId===topic.id&&(practiceMode!=='applied'||q.practiceSet==='type-linked')).length;
  group.records=records;groups.set(typeId,group);
 }
 const rows=[...groups.values()].map(g=>{const unique=[...new Map(g.records.map(r=>[r.id,r])).values()],years=[...new Set(unique.map(r=>r.year))].sort((a,b)=>a-b);return {...g,records:unique,sourceCount:unique.length,years,example:unique[0]||null};});
 const unique=[...new Map(rows.flatMap(g=>g.records).map(r=>[r.id,r])).values()],years=[...new Set(unique.map(r=>r.year))].sort((a,b)=>a-b);
 return {courseId,courseLabel:course.label,topicId,practiceMode,groups:rows,sourceCount:unique.length,years,practiceCount:practiceInfo(courseId,topicId,practiceMode).bankCount};
}

export function practiceSourceView(summary,{compact=false}={}){
 if(!summary)return '';
 const range=summary.years.length?`${summary.years[0]}~${summary.years.at(-1)}학년도`:'';
 const rows=summary.groups.filter(g=>g.sourceCount);
 return `<section class="card practice-evidence ${compact?'compact':''}"><div class="card-label">기출 유형 연결</div><h3>${compact?'이 연습과 연결된 기출 유형':'기출에서 확인한 학습 근거'}</h3>${rows.length?`<p>${esc(summary.courseLabel)} · ${esc(range)} · 동일 유형의 공식 기출 ${summary.sourceCount}문항</p><div class="practice-source-groups">${rows.map(g=>`<article><strong>${esc(g.label)}</strong><p>${esc(g.unit)} · 기출 분류 ${g.sourceCount}문항${summary.practiceMode==='applied'?` · 응용 연습 ${g.practiceCount}문항`:''}</p><div class="document-actions"><button class="btn small" data-action="practice-analysis" data-topic="${esc(g.topicIds[0])}">유형 분석 보기</button>${g.example?`<button class="btn small" data-action="analysis-paper" data-id="${esc(g.example.id)}">${esc(g.example.year)}학년도 ${esc(g.example.questionNumber)}번 원문</button>`:''}</div></article>`).join('')}</div>`:'<p>선택한 범위에 연결된 공식 기출 유형 자료가 아직 없습니다. 연습문제와 풀이는 이용할 수 있습니다.</p>'}<p class="footnote">대표 개념을 기준으로 연결한 학습용 분류입니다. 규칙 보조 분류를 포함하며, 기출 문항 수는 다음 시험의 출제 확률이 아닙니다. 응용문제의 지문과 해설은 자체 작성했습니다.</p></section>`;
}
