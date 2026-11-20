import {TOPICS,inferTopic} from './engine.mjs';
import {COURSES,courseById} from './catalog.mjs';
export const ANALYSIS_COURSES=[...COURSES,{id:'korean-legacy',label:'국어 전체 · 2018~2021',domain:'국어',legacy:true},{id:'math-legacy-ga',label:'수학 가형 · 2018~2021',domain:'수학',legacy:true},{id:'math-legacy-na',label:'수학 나형 · 2018~2021',domain:'수학',legacy:true}];
export const analysisCourseById=id=>ANALYSIS_COURSES.find(c=>c.id===id);
export function analysisLearningCourseId(id){const c=analysisCourseById(id);return c?.legacy?(c.domain==='국어'?'korean-common':'math-common'):c?.id||'english';}
export function mergeTypeData(english={},math={},korean={},history={}){return {...english,records:[...(english.records||[]),...(math.records||[]),...(korean.records||[]),...(history.records||[])],types:{...(english.types||{}),...(math.types||{}),...(korean.types||{}),...(history.types||{})},papers:[...(english.papers||[]),...(math.papers||[]),...(korean.papers||[]),...(history.papers||[])],mathScope:math.scope||null,koreanScope:korean.scope||null,historyScope:history.scope||null,_mathLoadError:!!math._loadError,_koreanLoadError:!!korean._loadError,_historyLoadError:!!history._loadError};}
const englishPractice={'english-main':'en-read-main','english-blank':'en-read-blank','english-agreement':'en-read-grammar','english-notice':'en-read-notice'};
const mathPractice={'probability':'math-statistics-probability','math-statistics-combinations':'math-statistics-counting','math-statistics-binomial':'math-statistics-binomial','math-statistics-normal':'math-statistics-normal','math-calculus-exponential':'math-calculus-differentiation','math-calculus-integral':'math-calculus-integration','math-calculus-geometric':'math-calculus-series','math-geometry-dot':'math-geometry-vectors','math-geometry-parabola':'math-geometry-conics','math-geometry-ellipse':'math-geometry-conics'};
const koreanPractice={'korean-main':'korean-common-reading-info','korean-infer':'korean-common-reading-reasoning','korean-common-poetic-personification':'korean-common-literature-expression','korean-common-narrator':'korean-common-literature-expression','korean-speech-audience':'korean-speech-speech-strategy','korean-speech-negotiation':'korean-speech-integrated-context','korean-speech-survey':'korean-speech-writing-plan','korean-speech-revision':'korean-speech-integrated-revision','korean-language-nasalization':'korean-language-grammar-sounds','korean-language-sentence-role':'korean-language-grammar-sentence','korean-language-word-class':'korean-language-grammar-words','korean-language-media-check':'korean-language-media-interpretation'};
const historyPractice={'korean-history-bone-rank':'korean-history-ancient-state','korean-history-gwangjong':'korean-history-goryeo-state','korean-history-gabo':'korean-history-opening-reform','korean-history-march-first':'korean-history-colonial-movement'};
const methods={'국어':'표현·문장·지문 근거 대조','수학':'조건을 식으로 바꾸고 계산','영어':'문맥·구조·어휘 대조','한국사':'사료 단서와 시대 맥락 연결','사회탐구':'개념·관점·자료 비교','과학탐구':'모형·조건·수량 관계 적용','직업탐구':'업무 상황과 적용 기준 확인','제2외국어/한문':'문법·어휘·상황의 의미 대조'};
function topicUnit(t){
 const id=t.id;
 if(t.courseId==='korean-common')return /poetic|narrator/.test(id)?'문학':'독서';
 if(t.courseId==='korean-speech')return '화법·작문';
 if(t.courseId==='korean-language')return /media/.test(id)?'매체':'국어 문법';
 if(id==='exponents')return '수학Ⅰ · 지수와 로그';if(id==='sequence')return '수학Ⅰ · 수열';if(id==='derivative')return '수학Ⅱ · 미분';if(id==='limit')return '수학Ⅱ · 극한';
 if(t.courseId==='math-statistics')return /normal|binomial/.test(id)?'확률과 통계 · 확률분포':'확률과 통계 · 경우의 수·확률';
 if(t.courseId==='math-calculus')return /integral/.test(id)?'미적분 · 적분':/geometric/.test(id)?'미적분 · 급수':'미적분 · 미분';
 if(t.courseId==='math-geometry')return /dot/.test(id)?'기하 · 벡터':'기하 · 이차곡선';
 if(t.courseId==='english')return '독해';
 if(t.courseId==='korean-history')return /bone/.test(id)?'고대':/gwangjong/.test(id)?'중세':/gabo/.test(id)?'근대':'일제강점기';
 if(/^science-physics/.test(id))return /wave/.test(id)?'파동':/capacitor|induced/.test(id)?'전기·자기':'역학';
 if(/^science-chemistry/.test(id))return /equilibrium/.test(id)?'화학 평형':/hess/.test(id)?'반응열':'물질의 양·구조';
 if(/^science-biology/.test(id))return /mendel|hardy|transcription/.test(id)?'유전':/glucose/.test(id)?'항상성':/energy/.test(id)?'생태계':'세포 호흡';
 if(/^science-earth/.test(id))return /stellar|kepler/.test(id)?'천체':'지질';
 return t.label;
}
function topicType(t){return {id:englishPractice[t.id]||mathPractice[t.id]||koreanPractice[t.id]||historyPractice[t.id]||(['exponents','derivative','limit','sequence'].includes(t.id)?'math-'+t.id:'topic-'+t.id),label:t.label,unit:topicUnit(t),courseId:t.courseId,method:methods[courseById(t.courseId)?.domain]||'개념과 조건 대조',practiceTopicId:t.id,concept:t.concept};}
export function buildTypeCatalog(data={}){
 const types=new Map(Object.entries(data.types||{}).map(([id,m])=>[id,{...m,id,courseId:m.courseId||'english'}]));
 for(const t of TOPICS){const m=topicType(t),old=types.get(m.id);types.set(m.id,old?{...m,...old,practiceTopicId:t.id,concept:t.concept}:m)}
 return types;
}
export function officialTypeRecords(data,pasts){
 const key=r=>[r.year,r.courseId,r.form,r.questionNumber].join('|'),unique=new Map();
 for(const r of data?.records||[])unique.set(key(r),{...r,sourceKind:'source-classification',domain:analysisCourseById(r.courseId)?.domain});
 for(const q of pasts||[]){const topic=TOPICS.find(t=>t.id===inferTopic(q));if(!topic)continue;const m=topicType(topic),r={id:q.id,questionId:q.id,year:q.year,courseId:topic.courseId,domain:q.domain,questionNumber:q.questionNumber,typeId:m.id,unit:m.unit,form:'odd',sourceKind:'verified-solver',basis:'공식 문제·정답 대조 표본'},old=unique.get(key(r));unique.set(key(r),old?{...old,questionId:q.id}:r)}
 return [...unique.values()];
}
const selected=(r,f)=> (!f.domain||r.domain===f.domain)&&(!f.courseId||r.courseId===f.courseId)&&(!f.year||r.year===Number(f.year))&&(!f.unit||r.unit===f.unit);
export function officialTypeAnalysis(data,pasts,filters={}){
 const types=buildTypeCatalog(data),all=officialTypeRecords(data,pasts),rows=all.filter(r=>selected(r,filters)),groups=new Map();
 for(const r of rows){const meta=types.get(r.typeId)||{id:r.typeId,label:'미분류',unit:r.unit},g=groups.get(r.typeId)||{...meta,count:0,years:{}};g.count++;g.years[r.year]=(g.years[r.year]||0)+1;groups.set(r.typeId,g)}
 const frequencies=[...groups.values()].map(g=>({...g,share:rows.length?100*g.count/rows.length:0})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'ko'));
 const years=[...new Set(all.map(r=>r.year))].sort((a,b)=>a-b),yearTotals=Object.fromEntries(years.map(y=>[y,rows.filter(r=>r.year===y).length])),detail=rows.filter(r=>!filters.typeId||r.typeId===filters.typeId).sort((a,b)=>b.year-a.year||a.questionNumber-b.questionNumber);
 const counts=Object.fromEntries([...new Set(all.map(r=>r.courseId))].map(id=>[id,all.filter(r=>r.courseId===id).length]));
 return {types,all,rows,frequencies,detail,years,yearTotals,counts,total:rows.length,yearCount:new Set(rows.map(r=>r.year)).size};
}
export function learningTypeAnalysis(db,pasts,authored,filters={},data={}){
 const qmap=new Map([...(pasts||[]),...(authored||[]),...Object.values(db.questions||{})].map(q=>[q.id,q])),types=buildTypeCatalog(data),latest=new Map();
 const attempts=[...(db.attempts||[])].filter(a=>!a.assisted&&Number.isInteger(a.selected)&&a.selected>=0&&a.selected<5&&Number.isFinite(Date.parse(a.time))).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
 for(const a of attempts){const q=qmap.get(a.qid);if(!q)continue;const t=TOPICS.find(t=>t.id===inferTopic(q));if(!t)continue;const basic=topicType(t),m=types.get(basic.id)||basic,domain=courseById(t.courseId)?.domain,r={id:q.originId||q.id,qid:q.id,courseId:t.courseId,domain,typeId:m.id,unit:m.unit,correct:a.selected===q.answerIndex,unresolved:a.selected!==q.answerIndex&&!db.resolved?.[q.id],time:a.time,sourceKind:q.kind==='past'?'기출':q.originId||q.kind==='authored'?'자체 개념':'유형 변형'};latest.set(r.id,r)}
 const rows=[...latest.values()].filter(r=>selected(r,filters)&&(!filters.typeId||r.typeId===filters.typeId)),groups=new Map();
 for(const r of rows){const meta=types.get(r.typeId),g=groups.get(r.typeId)||{...meta,count:0,correct:0,wrong:0,unresolved:0,qids:[],sourceCounts:{}};g.count++;g.correct+=Number(r.correct);g.wrong+=Number(!r.correct);g.unresolved+=Number(r.unresolved);g.qids.push(r.qid);g.sourceCounts[r.sourceKind]=(g.sourceCounts[r.sourceKind]||0)+1;groups.set(r.typeId,g)}
 const frequencies=[...groups.values()].map(g=>({...g,wrongRate:g.count?100*g.wrong/g.count:null,accuracy:g.count?100*g.correct/g.count:null,smallSample:g.count<3})).sort((a,b)=>b.unresolved-a.unresolved||b.wrong-a.wrong||b.count-a.count);
 const total=rows.length,correct=rows.filter(r=>r.correct).length;return {types,rows,frequencies,total,correct,wrong:total-correct,accuracy:total?100*correct/total:null,unresolved:rows.filter(r=>r.unresolved).length,assistedExcluded:(db.attempts||[]).filter(a=>a.assisted).length};
}
