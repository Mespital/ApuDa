import {courseById} from './catalog.mjs';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),id=params.get('id'),requested=params.get('file');
const api='/.netlify/functions/csat-papers',source=id?`${api}?id=${encodeURIComponent(id)}`:null;
let pdf,task,page=1,zoom=1,sequence=0,loading=false,metadata;
const status=(s,error=false)=>{$('status').textContent=s;$('status').classList.toggle('error',error)};
const controls=()=>{const enabled=!!pdf&&!loading;for(const id of ['previous','next','page-number','zoom-out','zoom-in','fit'])$(id).disabled=!enabled;$('previous').disabled=!enabled||page<=1;$('next').disabled=!enabled||page>=pdf.numPages;$('page-number').value=page;$('page-number').max=pdf?.numPages||1;$('page-total').textContent='/ '+(pdf?.numPages||'—')};
async function draw(){
 if(!pdf)return;const token=++sequence;loading=true;controls();
 try{
  if(task){task.cancel();try{await task.promise}catch{}}
  const sheet=await pdf.getPage(page);if(token!==sequence)return;const natural=sheet.getViewport({scale:1}),available=Math.max(280,$('paper-stage').clientWidth-(innerWidth<550?12:36)),scale=Math.min(3,available/natural.width)*zoom,view=sheet.getViewport({scale}),ratio=Math.min(devicePixelRatio||1,2,Math.sqrt(16000000/(view.width*view.height))),canvas=$('paper-canvas');
  canvas.width=Math.floor(view.width*ratio);canvas.height=Math.floor(view.height*ratio);canvas.style.width=view.width+'px';canvas.style.height=view.height+'px';canvas.hidden=false;canvas.setAttribute('aria-label',`${metadata.resource.year}학년도 ${metadata.resource.domain} 시험문제 ${page}쪽`);
  task=sheet.render({canvasContext:canvas.getContext('2d'),viewport:view,transform:ratio===1?null:[ratio,0,0,ratio,0,0]});await task.promise;if(token!==sequence)return;
  const text=await sheet.getTextContent();if(token!==sequence)return;$('paper-text').textContent=text.items.map(x=>x.str).join(' ');status(`${page} / ${pdf.numPages}쪽 · 문제의 지문·선택지·도표를 확인하세요.`);
 }catch(err){if(token===sequence&&err?.name!=='RenderingCancelledException')status('시험지 화면을 그리지 못했습니다. 평가원 원문 링크를 이용해 주세요.',true)}finally{if(token===sequence){loading=false;controls()}}
}
async function openFile(file){
 const token=++sequence;loading=true;if(task)task.cancel();const old=pdf;pdf=null;controls();if(old)await old.destroy();$('paper-canvas').hidden=true;$('paper-text').textContent='';status('시험문제 전체를 불러오는 중입니다. 묶음 자료는 잠시 걸릴 수 있습니다.');
 try{
  const response=await fetch(`${source}&file=${encodeURIComponent(file)}`);if(!response.ok){const d=await response.json();throw Error(d.error)}
  const bytes=new Uint8Array(await response.arrayBuffer());if(token!==sequence)return;
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdfjs/pdf.worker.min.js',import.meta.url).href;
  const loaded=await window.pdfjsLib.getDocument({data:bytes,isEvalSupported:false,enableXfa:false,useSystemFonts:true}).promise;if(token!==sequence){await loaded.destroy();return}pdf=loaded;
  page=1;zoom=1;loading=false;await draw();
 }catch(err){if(token===sequence){loading=false;status(/[가-힣]/.test(err.message||'')?err.message:'시험지를 불러오지 못했습니다. 원문 링크를 이용해 주세요.',true);controls()}}
}
$('paper-file').addEventListener('change',e=>openFile(e.target.value));$('previous').addEventListener('click',()=>{if(page>1){page--;draw()}});$('next').addEventListener('click',()=>{if(pdf&&page<pdf.numPages){page++;draw()}});$('page-number').addEventListener('change',e=>{if(pdf){page=Math.max(1,Math.min(pdf.numPages,Number(e.target.value)||1));draw()}});$('zoom-in').addEventListener('click',()=>{zoom=Math.min(2.5,zoom+.25);draw()});$('zoom-out').addEventListener('click',()=>{zoom=Math.max(.5,zoom-.25);draw()});$('fit').addEventListener('click',()=>{zoom=1;draw()});let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(pdf)draw()},180)});
try{
 if(!source)throw Error('기출 보관함에서 시험문제를 선택해 주세요.');
 const catalog=await fetch('./data/archive.json').then(r=>r.json()),known=catalog.resources.find(r=>r.id===id);if(!known)throw Error('등록된 공식 시험문제를 선택해 주세요.');$('paper-title').textContent=`${known.year}학년도 · ${known.domain} · ${known.type==='answer'?'정답표':'시험문제'}`;const knownURL=new URL(known.url);if(knownURL.protocol==='https:'&&['www.suneung.re.kr','cdn2.kice.re.kr'].includes(knownURL.hostname)){$('official-link').href=knownURL.href;$('official-link').hidden=false}
 const response=await fetch(source);metadata=await response.json();if(!response.ok)throw Error(metadata.error||'시험지 목록을 불러오지 못했습니다.');
 const r=metadata.resource;document.title=`${r.year}학년도 ${r.domain} 시험문제`;$('paper-title').textContent=`${r.year}학년도 · ${r.domain} · ${r.type==='answer'?'정답표':'시험문제'}`;const original=new URL(r.officialUrl);if(original.protocol==='https:'&&['www.suneung.re.kr','cdn2.kice.re.kr'].includes(original.hostname)){$('official-link').href=original.href;$('official-link').hidden=false}
 for(const file of metadata.files){const option=document.createElement('option');option.value=file.id;option.textContent=file.name;$('paper-file').appendChild(option)}$('file-picker').hidden=metadata.files.length<2;
 const course=courseById(params.get('course')),compact=s=>s.normalize('NFKC').toLowerCase().replace(/물리학/g,'물리').replace(/[\s_.·()]/g,'');const selected=metadata.files.find(f=>f.id===requested)||(course&&metadata.files.find(f=>compact(f.name).includes(compact(course.label))))||metadata.files[0];$('paper-file').value=selected.id;await openFile(selected.id);
}catch(err){status(err.message||'시험지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',true)}
