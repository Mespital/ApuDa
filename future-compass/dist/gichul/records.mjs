import {SUBJECT_GROUPS,courseById} from './catalog.mjs';
export const emptyRecords=()=>({version:1,attempts:[],questions:{},sessions:{},bookmarks:[],resources:[],notes:{},resolved:{}});
export const validId=id=>typeof id==='string'&&/^(csat-\d{4}-math-odd-\d{2}|new-\d+-\d+|authored-[a-z0-9-]+)$/.test(id);
export function mergeBackup(current,backup,past,resources){
 if(backup?.app!=='gichul-lab'||backup.schemaVersion!==1||backup.data?.version!==1)throw new Error('기출연구소 백업 파일이 아닙니다.');const d=backup.data,pmap=new Map(past.map(q=>[q.id,q])),qs={...current.questions};
 for(const [id,q] of Object.entries(d.questions||{})){
  if(!/^new-\d+-\d+$/.test(id)||q.id!==id||q.kind!=='generated'||!Number.isFinite(q.points)||q.points<0||q.points>10||!SUBJECT_GROUPS.some(g=>g.id===q.domain)||q.courseId&&courseById(q.courseId)?.domain!==q.domain||!Array.isArray(q.options)||q.options.length!==5||!q.options.every(s=>typeof s==='string'&&s.length<5000)||!Number.isInteger(q.answerIndex)||q.answerIndex<0||q.answerIndex>4)continue;
  if(!['solutionSteps','commonMistakes','optionAnalysis'].every(k=>Array.isArray(q[k])&&q[k].every(s=>typeof s==='string'&&s.length<10000)))continue;
  if(typeof q.statement!=='string'||q.statement.length>10000||q.mathLatex&&String(q.mathLatex).length>10000)continue;
  if(q.translation&&(typeof q.translation!=='string'||q.translation.length>15000||!Array.isArray(q.vocabulary)||!q.vocabulary.every(v=>Array.isArray(v)&&v.length===2&&v.every(s=>typeof s==='string'))))continue;qs[id]=q;
 }
 const known=id=>validId(id)&&(pmap.get(id)||qs[id]),attempts=new Map(current.attempts.map(a=>[a.id,a]));
 for(const a of Array.isArray(d.attempts)?d.attempts:[])if(known(a.qid)&&typeof a.id==='string'&&Number.isInteger(a.selected)&&a.selected>=0&&a.selected<5&&Number.isFinite(+new Date(a.time)))attempts.set(a.id,{...a,correct:a.selected===known(a.qid).answerIndex,assisted:!!a.assisted});
 const notes={...current.notes},resolved={...current.resolved},sessions={...current.sessions};
 for(const [id,n] of Object.entries(d.notes||{}))if(known(id)&&typeof n==='string')notes[id]=n.slice(0,10000);
 for(const [id,v] of Object.entries(d.resolved||{}))if(known(id)&&typeof v==='boolean')resolved[id]=v;
 for(const [id,s] of Object.entries(d.sessions||{}))if(/^practice-\d+$/.test(id)&&s.id===id&&Array.isArray(s.questionIds)&&s.questionIds.length<=20&&s.questionIds.every(known)&&typeof s.createdAt==='string')sessions[id]=s;
 const rids=new Set(resources.map(r=>r.id));return {version:1,questions:qs,attempts:[...attempts.values()].sort((a,b)=>a.time.localeCompare(b.time)),notes,resolved,sessions,bookmarks:[...new Set([...current.bookmarks,...(Array.isArray(d.bookmarks)?d.bookmarks:[]).filter(known)])],resources:[...new Set([...current.resources,...(Array.isArray(d.resources)?d.resources:[]).filter(id=>rids.has(id))])]};
}
