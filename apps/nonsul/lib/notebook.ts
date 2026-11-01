import { z } from "zod";
import type { Lesson } from "./lessons";
const revisionSchema=z.object({answer:z.string().max(6000),at:z.string().datetime(),kind:z.enum(["initial","rewrite"])});
const entrySchema=z.object({answer:z.string().max(6000),outline:z.array(z.string().max(1000)).length(3),history:z.array(revisionSchema).max(60),seconds:z.number().int().min(0).max(1000000),updatedAt:z.string().datetime(),checklist:z.array(z.boolean()).length(4)});
const goalSchema=z.object({id:z.string().max(80),name:z.string().min(1).max(40),department:z.string().max(60),year:z.number().int().min(2028).max(2040),url:z.string().max(500).refine(v=>{try{return new URL(v).protocol==="https:"}catch{return false}})});
export const notebookSchema=z.object({
  version:z.literal(1),
  profile:z.object({name:z.string().trim().min(1).max(20),school:z.string().max(30),major:z.string().max(60),examMode:z.boolean(),shareSummary:z.boolean(),onboarded:z.boolean()}),
  entries:z.record(z.string().regex(/^l(?:0[1-9]|1[0-2])$/),entrySchema),
  goals:z.array(goalSchema).max(4),
  exam:z.object({name:z.string().max(60),grades:z.record(z.string().max(20),z.string().regex(/^(?:[1-9])?$/)),target:z.number().int().min(2).max(18),subjects:z.array(z.enum(["국어","수학","영어","통합사회","통합과학","한국사"])).max(6)}),
  diagnostic:z.object({choices:z.array(z.number().int().min(-1).max(2)).length(3),answer:z.string().max(2000),at:z.string().datetime()}).nullable(),
});
export type Notebook=z.infer<typeof notebookSchema>;
export type Entry=Notebook["entries"][string];
export const subjects=["국어","수학","영어","통합사회","통합과학","한국사"] as const;
export function newNotebook():Notebook{return {version:1,profile:{name:"학습자",school:"서초고",major:"",examMode:false,shareSummary:false,onboarded:false},entries:{},goals:[{id:"hufs",name:"한국외국어대학교",department:"경영 계열 관심",year:2029,url:"https://www.hufs.ac.kr/"},{id:"gachon",name:"가천대학교",department:"경영 계열 관심",year:2029,url:"https://admission.gachon.ac.kr/"}],exam:{name:"",grades:Object.fromEntries(subjects.map(s=>[s,""])),target:4,subjects:["국어","영어","통합사회","통합과학"]},diagnostic:null};}
export function newEntry():Entry{return {answer:"",outline:["","",""],history:[],seconds:0,updatedAt:new Date().toISOString(),checklist:[false,false,false,false]};}
export const charCount=(text:string)=>[...text.replace(/\r?\n/g,"")].length;
export const dateKey=(value:string|Date=new Date())=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
export function weekStart(now=new Date()){const day=dateKey(now);const d=new Date(`${day}T00:00:00+09:00`);const weekday=new Date(`${day}T12:00:00Z`).getUTCDay();return new Date(d.getTime()-((weekday+6)%7)*86400000);}
export function weekStats(data:Notebook,now=new Date()){
  const start=weekStart(now).getTime(),end=start+7*86400000;
  const revisions=Object.values(data.entries).flatMap(e=>e.history).filter(h=>{const t=Date.parse(h.at);return t>=start&&t<end});
  return {sessions:revisions.length,rewrites:revisions.filter(h=>h.kind==="rewrite").length,days:new Set(revisions.map(h=>dateKey(h.at)))};
}
export function personalScenario(exam:Notebook["exam"]){
  const valid=[...new Set(exam.subjects)].map(s=>({subject:s,grade:Number(exam.grades[s])})).filter(x=>Number.isInteger(x.grade)&&x.grade>=1&&x.grade<=9).sort((a,b)=>a.grade-b.grade);
  if(valid.length<2)return {status:"missing" as const,chosen:valid,sum:null};
  const chosen=valid.slice(0,2),sum=chosen[0].grade+chosen[1].grade;
  return {status:sum<=exam.target?"met" as const:"unmet" as const,chosen,sum};
}
export function checklistFeedback(lesson:Lesson,answer:string){
  const chars=charCount(answer),sentences=answer.split(/(?<=[.!?。])\s*|\n+/).filter(Boolean);
  const checks=lesson.concepts.map(c=>{const word=c.words.find(w=>answer.includes(w));return {...c,found:!!word,word:word??null,sentence:word?(sentences.find(s=>s.includes(word))??answer).slice(0,250):null};});
  const inRange=chars>=lesson.min&&chars<=lesson.max,tips:string[]=[];
  if(!inRange)tips.push(chars<lesson.min?`현재 ${chars}자예요. 제시문 근거를 설명하는 문장을 더해 ${lesson.min}~${lesson.max}자로 다듬어보세요.`:`현재 ${chars}자예요. 반복되는 설명을 줄여 ${lesson.min}~${lesson.max}자로 다듬어보세요.`);
  for(const c of checks.filter(c=>!c.found))tips.push(`‘${c.label}’ 항목과 관련된 표현을 찾지 못했어요. 제시문 ${c.passage}의 근거를 자신의 말로 연결했는지 확인해보세요.`);
  if(/모든|무조건|언제나|반드시.*좋/.test(answer))tips.push("‘모든·무조건·언제나’ 같은 단정이 제시문의 범위를 넘는지 확인하고 조건을 붙여보세요.");
  if(tips.length<2)tips.push(lesson.question);
  if(tips.length<2)tips.push("근거를 인용한 다음, 그 근거가 나의 결론을 뒷받침하는 이유를 한 문장으로 설명해보세요.");
  return {chars,inRange,checks,tips:tips.slice(0,2),found:checks.filter(c=>c.found).length};
}
export const diagnosticQuestions=[
 {skill:"요약",passage:"학교 도서관은 전자책을 도입해 접근성을 높였다. 동시에 종이책을 선호하는 학생들을 위해 인쇄 도서도 유지했다. 다양한 이용 방식이 함께 제공될 때 더 많은 학생이 독서에 참여할 수 있다.",question:"중심 주장을 가장 잘 요약한 문장은?",options:["전자책은 종이책보다 언제나 좋다.","다양한 이용 방식을 함께 제공하면 독서 참여를 넓힐 수 있다.","도서관은 전자책만 제공해야 한다."],correct:1,explanation:"전자책 도입과 종이책 유지는 모두 다양한 이용 방식을 보장한다는 중심 주장을 뒷받침해요."},
 {skill:"비교",passage:"A는 평가 기준을 모두에게 똑같이 적용해야 공정하다고 말한다. B는 출발 조건이 다른 사람에게 필요한 지원을 제공해야 실제 기회가 공정해진다고 말한다.",question:"두 관점의 차이를 가장 정확하게 설명한 것은?",options:["A는 공통 규칙을, B는 실제 참여 기회를 강조한다.","A는 공정함을 원하지만 B는 원하지 않는다.","A와 B는 어떤 점에서도 차이가 없다."],correct:0,explanation:"서로 다른 비교 기준을 밝혀야 해요. B도 공정함을 추구하며 출발 조건을 함께 살펴요."},
 {skill:"자료해석",passage:"가상 조사에서 참여 비율이 40%에서 50%로 높아졌다.",question:"변화에 대한 정확한 설명은?",options:["10%p 상승했고, 처음 비율 대비 25% 증가했다.","10%p 상승했으므로 상대 증가율도 10%다.","50%p 상승했다."],correct:0,explanation:"차이는 50−40=10%p이고, 상대 증가율은 (50−40)÷40×100=25%예요."}
];
