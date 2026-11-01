"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, Check, ChevronRight, Cloud, CloudOff, Home, Library, LifeBuoy, LoaderCircle, NotebookPen, Settings2, Target } from "lucide-react";
import { useNotebook } from "@/hooks/use-notebook";
import { Dashboard, Training } from "./overview-pages";
import { StudyPage } from "./study-page";
import { GoalsPage, RecordsPage } from "./goals-records";
import { SettingsPage, DiagnosticPage, GuidePage } from "./settings-diagnostic";
import {AccountPanel} from "@/components/account-panel";
import { Modal } from "@/components/nonsul-ui";
export function go(path:string){window.location.hash=path;}
const nav=[{id:"today",label:"오늘의 학습",short:"오늘",icon:Home},{id:"training",label:"논술 훈련실",short:"훈련",icon:Library},{id:"goals",label:"목표 대학",short:"목표 대학",icon:Target},{id:"records",label:"나의 기록",short:"기록",icon:NotebookPen}];
export default function NotebookApp(){
  const notebook=useNotebook(),{data,status,ready,conflict,resolve}=notebook;
  const [route,setRoute]=useState("today"),[toast,setToast]=useState(""),[account,setAccount]=useState(false);
  useEffect(()=>{const changed=()=>{if(window.location.hash==="#main")return;setRoute(window.location.hash.slice(1)||"today");window.scrollTo({top:0});};changed();window.addEventListener("hashchange",changed);return()=>window.removeEventListener("hashchange",changed);},[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),3500);return()=>clearTimeout(t);},[toast]);
  useEffect(()=>{if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("/nonsul/sw.js",{scope:"/nonsul/"}).catch(()=>{});},[]);
  const active=route.startsWith("lesson/")||route==="diagnostic"?"training":route,current=nav.find(n=>n.id===active)?.label??(route==="settings"?"학습 설정":"이용 안내");
  const label={loading:"기록 불러오는 중",saved:"계정에 저장됨",saving:"저장 중",local:"기기 임시저장",guest:"기기 저장",device:"이 기기에 저장됨",conflict:"기록 선택 필요"}[status],props={data,update:notebook.update,notify:setToast};
  return <div className="app-shell"><a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <aside className="sidebar"><button className="brand" onClick={()=>go("today")} aria-label="논술 루틴 홈"><span className="brand-icon"><BookOpen size={23}/></span><span>논술 루틴<small>생각을 쓰는 작은 습관</small></span></button>
      <div className="workspace"><span className="workspace-mark">S</span><div><strong>{data.profile.school||"나의 공부방"}</strong><small>고등학교 1학년 · 2029 대입</small></div><span className="status-dot"/></div><p className="nav-caption">MY WORKSPACE</p>
      <nav aria-label="주 메뉴">{nav.map(n=><button key={n.id} className={`nav-item ${active===n.id?"active":""}`} onClick={()=>go(n.id)} aria-current={active===n.id?"page":undefined}><n.icon size={19}/>{n.label}{n.id==="training"&&<span className="nav-count">12</span>}</button>)}</nav>
      <div className="sidebar-note"><span className="mini-label">하루에 한 걸음</span><p>좋은 글은<br/>다시 쓰는 데서<br/><strong>시작하니까.</strong></p><div className="note-lines"><span/><span/><span/></div></div>
      <div className="sidebar-bottom"><button className={`nav-item ${route==="guide"?"active":""}`} onClick={()=>go("guide")}><LifeBuoy size={18}/>이용 안내</button><button className={`nav-item ${route==="settings"?"active":""}`} onClick={()=>go("settings")}><Settings2 size={18}/>학습 설정</button><div className="profile-mini"><span className="avatar">{data.profile.name.slice(0,1)}</span><div><strong>{data.profile.name}</strong><small>나만의 논술 공부방</small></div><button className="icon-button" onClick={()=>go("settings")} aria-label="프로필 수정"><ChevronRight size={17}/></button></div></div>
    </aside><div className="content-shell"><header className="topbar"><div className="mobile-brand"><span className="brand-icon"><BookOpen size={20}/></span><strong>논술 루틴</strong></div><div className="breadcrumb">내 공부방 <ChevronRight size={13}/><strong>{current}</strong></div><div className="topbar-right"><span className={`save-state ${status}`} role="status">{status==="saving"||status==="loading"?<LoaderCircle size={14} className="spin"/>:status==="saved"?<Cloud size={15}/>:<CloudOff size={15}/>}<span>{label}</span></span><span className="header-divider"/><button className="icon-button" onClick={()=>go("settings")} aria-label="학습 설정 열기"><Settings2 size={18}/></button><button className="avatar small" onClick={()=>setAccount(true)} aria-label="학습 계정 관리">{data.profile.name.slice(0,1)}</button></div></header>
      <main id="main" className={`main-content ${route.startsWith("lesson/")?"study-main":""}`}>
        {status==="local"&&<div className="connection-note"><CloudOff size={17}/><span>저장을 확인해주세요. 기록을 내보내 백업하고 다시 연결할 수 있어요.</span><button onClick={notebook.retry}>다시 연결</button></div>}
        {status==="device"&&route.startsWith("lesson/")&&<div className="connection-note"><span>답안은 이 기기에 저장돼요. 기록 메뉴에서 백업할 수 있어요.</span><button onClick={()=>setAccount(true)}>계정 연결 <ArrowUpRight size={14}/></button></div>}
        {!ready?<div className="loading-card"><LoaderCircle className="spin"/>공부방을 준비하고 있어요.</div>:route==="today"?<Dashboard {...props}/>:route==="training"?<Training {...props}/>:route.startsWith("lesson/")?<StudyPage key={route} lessonId={route.split("/")[1]} {...props}/>:route==="goals"?<GoalsPage {...props}/>:route==="records"?<RecordsPage {...props}/>:route==="settings"?<SettingsPage {...props}/>:route==="diagnostic"?<DiagnosticPage {...props}/>:<GuidePage/>}
        <footer className="app-footer"><span>논술 루틴 <span className="footer-dot">·</span> 나만의 속도로, 생각은 더 깊게.</span><span><a href="/">ApuDa 홈</a> · 고1 기초 연습 v1.1</span></footer></main></div>
    <nav className="mobile-nav" aria-label="모바일 주 메뉴">{nav.map(n=><button key={n.id} className={active===n.id?"active":""} onClick={()=>go(n.id)} aria-current={active===n.id?"page":undefined}><n.icon size={21}/><span>{n.short}</span></button>)}</nav>
    {account&&<AccountPanel connected={!!notebook.accountId} close={()=>setAccount(false)}/>}
    {toast&&<div className="toast" role="status"><Check size={17}/>{toast}</div>}{conflict&&<Modal title="사용할 학습 기록을 골라주세요"><p>작성 중인 내용이 덮어써지지 않도록 사용할 기록을 골라주세요.</p><div className="conflict-options"><button className="primary" onClick={()=>resolve("local")}>이 기기의 기록 사용</button><button className="secondary" onClick={()=>resolve("remote")}>계정의 최신 기록 사용</button></div></Modal>}
  </div>;
}
