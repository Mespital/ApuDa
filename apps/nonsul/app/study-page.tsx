"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, ChevronDown, Clock3, Lightbulb, Pause, Play, RotateCcw, Send } from "lucide-react";
import { go } from "./notebook-app";
import { getLesson } from "@/lib/lessons";
import { charCount, checklistFeedback, newEntry, type Entry } from "@/lib/notebook";
import { EmptyState, SkillBadge, type PageProps } from "@/components/nonsul-ui";
export function StudyPage({lessonId,...props}:PageProps&{lessonId:string}){
  const lesson=getLesson(lessonId);return lesson?<StudyWorkspace key={lessonId} lesson={lesson} {...props}/>:<EmptyState icon={<BookOpen/>} heading="문제를 찾지 못했어요" description="훈련실에서 다른 문제를 선택해주세요." action={<button className="primary" onClick={()=>go("training")}>훈련실로</button>}/>;
}
function StudyWorkspace({lesson,data,update,notify}:PageProps&{lesson:NonNullable<ReturnType<typeof getLesson>>}){
  const fallback=useRef(newEntry()),entry=data.entries[lesson.id]??fallback.current;
  const [mode,setMode]=useState<"write"|"feedback"|"compare">(entry.history.length?"feedback":"write"),[hints,setHints]=useState(0),[running,setRunning]=useState(false),[seconds,setSeconds]=useState(entry.seconds),[mobilePane,setMobilePane]=useState("read");
  const elapsed=useRef(entry.seconds),answerRef=useRef<HTMLTextAreaElement>(null);
  const patch=(changes:Partial<Entry>)=>update(p=>({...p,entries:{...p.entries,[lesson.id]:{...(p.entries[lesson.id]??newEntry()),...changes,updatedAt:new Date().toISOString()}}}));
  useEffect(()=>{
    if(!running)return;const t=setInterval(()=>{if(document.visibilityState!=="visible")return;elapsed.current++;setSeconds(elapsed.current);if(elapsed.current%15===0)update(p=>({...p,entries:{...p.entries,[lesson.id]:{...(p.entries[lesson.id]??newEntry()),seconds:elapsed.current,updatedAt:new Date().toISOString()}}}));},1000);
    return()=>{clearInterval(t);update(p=>({...p,entries:{...p.entries,[lesson.id]:{...(p.entries[lesson.id]??newEntry()),seconds:elapsed.current,updatedAt:new Date().toISOString()}}}));};
  },[running,lesson.id,update]);
  const total=(data.profile.examMode?5:lesson.minutes)*60,remaining=Math.max(total-seconds,0),clock=`${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;
  const last=entry.history.at(-1),feedback=last?checklistFeedback(lesson,last.answer):null;
  function submit(){
    if(charCount(entry.answer.trim())<20){notify("먼저 자신의 생각을 20자 이상 써보세요.");return;}
    if(last?.answer===entry.answer.trim()){notify("지난 답안에서 고칠 문장을 찾아 수정해보세요.");return;}
    if(entry.history.length>=60){notify("이 문제의 저장 한도에 도달했어요. 다른 문제로 연습을 이어가세요.");return;}
    const at=new Date().toISOString();patch({history:[...entry.history,{answer:entry.answer.trim(),at,kind:last?"rewrite":"initial"}],seconds});setMode("feedback");setRunning(false);notify(last?"다시 쓴 답안을 기록했어요.":"첫 답안을 완성했어요. 이제 함께 다듬어봐요.");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function rewrite(){setMode("write");setMobilePane("write");setTimeout(()=>answerRef.current?.focus(),0);}
  return <>
    <button className="back-link" onClick={()=>go("training")}><ArrowLeft size={16}/>훈련실로 돌아가기</button>
    <div className="study-heading"><div><div className="study-tags"><SkillBadge skill={lesson.skill}/><span>{lesson.topic}</span><span>연습 {lesson.id.slice(1)}</span></div><h1>{lesson.title}</h1><p>{lesson.subtitle}</p></div><div className="timer"><Clock3 size={17}/><span>{clock}</span><button className="icon-button" onClick={()=>setRunning(!running)} aria-label={running?"타이머 일시정지":"타이머 시작"}>{running?<Pause size={16}/>:<Play size={16}/>}</button></div></div>
    <div className="study-flow"><span className={mode==="write"?"active":"done"}>01 읽고 생각하기</span><ChevronDown size={14}/><span className={mode==="write"?"active":"done"}>02 직접 쓰기</span><ChevronDown size={14}/><button className={mode==="feedback"?"active":""} disabled={!last} onClick={()=>setMode("feedback")}>03 피드백 확인</button><ChevronDown size={14}/><button className={mode==="compare"?"active":""} disabled={entry.history.length<2} onClick={()=>setMode("compare")}>04 다시 쓴 기록</button></div>
    {mode==="write"?<>
      <section className="question-card"><span className="mini-label">오늘의 질문</span><h2>{lesson.prompt}</h2><p>{lesson.min}~{lesson.max}자 · 공백 포함, 줄바꿈 제외 · 자체 제작 연습 문제</p></section>
      <div className="mobile-pane-tabs"><button className={mobilePane==="read"?"active":""} onClick={()=>setMobilePane("read")}>제시문 읽기</button><button className={mobilePane==="write"?"active":""} onClick={()=>setMobilePane("write")}>나의 답안 쓰기</button></div>
      <div className="study-columns"><div className={`reading-column ${mobilePane==="read"?"mobile-show":""}`}>
        <section className="card passage-card"><div className="card-title"><h2><BookOpen size={18}/>제시문 읽기</h2><span className="soft-label">차근차근 읽어보세요</span></div>{lesson.passages.map(p=><article key={p.label} className="passage"><span className="passage-label">제시문 {p.label}</span><p>{p.text}</p></article>)}</section>
        <section className="hint-card"><div><Lightbulb size={18}/><strong>생각이 막혔다면</strong><button className="text-button" disabled={hints>=3} onClick={()=>setHints(n=>n+1)}>{hints>=3?"힌트 모두 확인":"힌트 보기"} {hints}/3</button></div>{hints>0?<ol>{lesson.hints.slice(0,hints).map(h=><li key={h}>{h}</li>)}</ol>:<p>답을 쓰기 전에 생각할 질문을 하나씩 열어보세요.</p>}</section>
        <button className="primary mobile-write-start" onClick={()=>setMobilePane("write")}>이제 답안 써보기<ArrowRight size={16}/></button>
      </div><div className={`writing-column ${mobilePane==="write"?"mobile-show":""}`}>
        <section className="card outline-card"><div className="card-title"><h2>생각의 뼈대 만들기</h2><span className="soft-label">선택 · 한 문장씩</span></div>{lesson.outline.map((q,i)=><label key={q}><span><b>{i+1}</b>{q}</span><input maxLength={1000} aria-label={`개요 ${i+1}`} placeholder="핵심어 또는 짧은 문장으로 적어보세요" value={entry.outline[i]} onChange={e=>{const outline=[...entry.outline];outline[i]=e.target.value;patch({outline});}}/></label>)}</section>
        <section className="card answer-card"><div className="card-title"><h2>{last?"다시 쓰는 나의 답안":"나의 첫 답안"}</h2><span className="soft-label">자동저장</span></div><label htmlFor="answer" className="sr-only">나의 답안</label><textarea id="answer" ref={answerRef} maxLength={6000} value={entry.answer} onChange={e=>patch({answer:e.target.value})} placeholder="완벽하지 않아도 괜찮아요. 나의 말로 첫 문장을 시작해보세요."/><div className="answer-bottom"><span className={charCount(entry.answer)>lesson.max?"over-limit":""}><strong>{charCount(entry.answer)}</strong> / {lesson.min}~{lesson.max}자</span><span>초안과 수정본을 따로 보관해요</span></div><button className="primary full" onClick={submit} disabled={charCount(entry.answer.trim())<20}><Send size={16}/>{last?"수정본 저장하고 점검하기":"답안 제출하고 점검하기"}</button></section>
        {last&&<details className="previous-draft"><summary>지난 답안 확인하기</summary><p>{last.answer}</p></details>}
      </div></div>
    </>:mode==="feedback"&&feedback&&last?<>
      <section className="feedback-intro"><span className="stat-icon green"><CheckCheck size={24}/></span><div><h2>{last.kind==="rewrite"?"다시 쓰는 경험이 쌓였어요.":"생각을 끝까지 꺼내 썼어요."}</h2><p>문항별 체크리스트로 확인했어요. 표현의 유무와 분량을 자동 점검하며, 글의 의미와 논리는 직접 살펴봐요.</p></div><span className="badge neutral">기준표 피드백</span></section>
      <div className="feedback-layout"><div><section className="card feedback-tips"><div className="card-title"><h2>이번에는 두 가지만 다듬어요</h2><RotateCcw size={18}/></div>{feedback.tips.map((t,i)=><div key={t} className="numbered-tip"><span>0{i+1}</span><p>{t}</p></div>)}<button className="primary" onClick={rewrite}>피드백 반영해 다시 쓰기<ArrowRight size={16}/></button></section>
        <section className="card evidence-card"><h2>답안과 제시문 연결하기</h2>{feedback.checks.map(c=><div className="evidence-item" key={c.label}><div><strong>{c.label}</strong><span className={`badge ${c.found?"positive":"neutral"}`}>{c.found?"관련 표현 확인":"직접 확인해보세요"}</span></div>{c.sentence&&<p className="student-quote">나의 문장 · “{c.sentence}”</p>}<blockquote><span>제시문 {c.passage}</span>“{c.quote}”</blockquote><small>표현이 있다는 사실과 근거를 정확히 설명했다는 것은 구분해 살펴봐요.</small></div>)}</section>
      </div><div><section className="card checklist-card"><h2>마지막은 내가 확인해요</h2>{["문제에서 요구한 행동을 했어요","제시문 근거와 주장을 연결했어요","근거를 넘어선 단정을 살폈어요","분량과 문장 표현을 확인했어요"].map((s,i)=><label key={s}><input type="checkbox" checked={entry.checklist[i]} onChange={e=>{const checklist=[...entry.checklist];checklist[i]=e.target.checked;patch({checklist});}}/><span>{s}</span></label>)}<div className="length-check"><span>제출한 답안의 분량</span><strong>{feedback.chars}자</strong><small>{feedback.inRange?"연습 분량 범위에 들어왔어요.":`권장 분량 ${lesson.min}~${lesson.max}자`}</small></div></section>
        <section className="card submitted-answer"><h2>제출한 나의 답안</h2><p>{last.answer}</p></section>
        {entry.history.length>=2?<button className="secondary full" onClick={()=>setMode("compare")}><CheckCheck size={17}/>초안·수정본 비교하기</button>:<p className="muted-note">한 번 다시 쓰면 초안·수정본 비교와 예시 답안이 열려요.</p>}
      </div></div>
    </>:<section className="comparison"><div className="section-heading"><div><h2>내 생각은 어떻게 달라졌을까요?</h2><p>원래의 문장과 마지막 수정본을 나란히 읽어보세요.</p></div><button className="secondary" onClick={rewrite}>한 번 더 다듬기<ArrowRight size={16}/></button></div><div className="comparison-grid">{[entry.history[0],entry.history.at(-1)].map((h,i)=><section className="card" key={i}><span className={`badge ${i?"positive":"neutral"}`}>{i?"마지막 수정본":"처음 쓴 답안"}</span><p>{h?.answer}</p><small>{charCount(h?.answer??"")}자</small></section>)}</div><details className="card example-answer"><summary>다시 쓴 뒤, 예시 답안과 비교하기</summary><p>{lesson.example}</p><small>자체 제작 학습 예시 · 유일한 정답이 아니라 비교해볼 수 있는 답안이에요.</small></details><button className="primary" onClick={()=>go("records")}>나의 기록 보기<ArrowRight size={16}/></button></section>}
  </>;
}
