import {useCallback,useEffect,useRef,useState} from 'react';
import {newNotebook,notebookSchema,type Notebook} from '@/lib/notebook';
type Envelope={data:Notebook;revision:number;userKey:string};
export type SaveStatus='loading'|'saved'|'saving'|'local'|'guest'|'device'|'conflict';
const DEVICE='apuda-nonsul:device:v1';
function cached(key:string){try{const raw=localStorage.getItem(key);if(!raw)return null;const v=JSON.parse(raw);const parsed=notebookSchema.safeParse(v.data);return parsed.success?{...v,data:parsed.data}:null;}catch{return null;}}
const hasWork=(data:Notebook)=>Object.keys(data.entries).length>0||!!data.diagnostic||data.profile.onboarded;
export function useNotebook(){
 const [data,setData]=useState<Notebook>(newNotebook),[status,setStatus]=useState<SaveStatus>('loading'),[ready,setReady]=useState(false),[conflict,setConflict]=useState<Envelope|null>(null),[attempt,setAttempt]=useState(0),[accountId,setAccountId]=useState<string|null>(null);
 const ref=useRef(data),revision=useRef(0),user=useRef<string|null>(null),dirty=useRef(false),generation=useRef(0),pending=useRef(false),blocked=useRef(false),mounted=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|null>(null),syncRef=useRef<()=>Promise<void>>(async()=>{});
 const write=useCallback(()=>{try{localStorage.setItem(user.current?`apuda-nonsul:account:${user.current}`:DEVICE,JSON.stringify({data:ref.current,revision:revision.current,dirty:dirty.current}));return true;}catch{if(mounted.current)setStatus('local');return false;}},[]);
 const sync=useCallback(async()=>{
  if(!dirty.current||pending.current||blocked.current||!user.current)return;
  pending.current=true;const sent=generation.current;if(mounted.current)setStatus('saving');
  try{const r=await fetch('/nonsul/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:ref.current,revision:revision.current})}),v=await r.json() as {revision:number;data?:Notebook};
   if(r.status===409){blocked.current=true;setConflict({data:notebookSchema.parse(v.data),revision:v.revision,userKey:user.current});setStatus('conflict');return;}
   if(!r.ok||!Number.isInteger(v.revision))throw Error('save');revision.current=v.revision;dirty.current=sent!==generation.current;write();if(mounted.current)setStatus(dirty.current?'saving':'saved');
  }catch{if(mounted.current)setStatus('local');}
  finally{pending.current=false;if(dirty.current&&!blocked.current&&navigator.onLine&&mounted.current)timer.current=setTimeout(()=>syncRef.current(),5000);}
 },[write]);
 useEffect(()=>{syncRef.current=sync;},[sync]);
 useEffect(()=>{
  mounted.current=true;const controller=new AbortController();
  (async()=>{try{
   const r=await fetch('/nonsul/api/state',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});
   if(r.status===401||r.status===404||r.status===503)throw Error('device');
   if(!r.ok)throw Error('connect');const remote=await r.json() as Envelope;notebookSchema.parse(remote.data);if(!Number.isInteger(remote.revision)||!remote.userKey)throw Error('format');
   user.current=remote.userKey;setAccountId(remote.userKey);revision.current=remote.revision;
   const local=cached(`apuda-nonsul:account:${remote.userKey}`),device=cached(DEVICE);let next=remote.data;
   if(local?.dirty){next=local.data;dirty.current=true;if(local.revision!==remote.revision){blocked.current=true;setConflict(remote);}}
   else if(!local&&device&&hasWork(device.data)){next=device.data;dirty.current=true;blocked.current=true;setConflict(remote);}
   ref.current=next;setData(next);setStatus(blocked.current?'conflict':dirty.current?'saving':'saved');write();if(dirty.current&&!blocked.current)timer.current=setTimeout(()=>syncRef.current(),300);
  }catch{if(controller.signal.aborted)return;user.current=null;setAccountId(null);const local=cached(DEVICE);if(local){ref.current=local.data;setData(local.data);}setStatus('device');}
  finally{if(!controller.signal.aborted)setReady(true);}})();
  const online=()=>{void syncRef.current();};window.addEventListener('online',online);
  return()=>{mounted.current=false;controller.abort();window.removeEventListener('online',online);if(timer.current)clearTimeout(timer.current);};
 },[write,attempt]);
 const update=useCallback((fn:(prev:Notebook)=>Notebook)=>{const next=fn(ref.current);ref.current=next;setData(next);dirty.current=true;generation.current++;const saved=write();if(!blocked.current&&saved)setStatus(user.current?'saving':'device');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>syncRef.current(),900);},[write]);
 const resolve=useCallback((choice:'local'|'remote')=>{if(!conflict)return;revision.current=conflict.revision;blocked.current=false;if(choice==='remote'){ref.current=conflict.data;setData(conflict.data);dirty.current=false;setStatus('saved');}else{dirty.current=true;generation.current++;setStatus('saving');timer.current=setTimeout(()=>syncRef.current(),0);}setConflict(null);write();},[conflict,write]);
 return {data,update,status,ready,conflict,resolve,accountId,retry:()=>{if(user.current)void syncRef.current();else setAttempt(n=>n+1);}};
}
