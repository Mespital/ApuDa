/* DOM boundary tests; actual YouTube playback is checked separately on the deployed site. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../public-site'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),settle=()=>new Promise(r=>setImmediate(r));
function setup({api=true,failResources=false,deferredResources=false}={}){
  const events={},documentEvents={},players=[],fetches=[],queue=[],historyEvents=[];let doc;
  class Element{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset={};this.style={};this.hidden=false;this.inert=false;this.handlers={};this.textContent='';const classes=new Set();this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:x=>{if(classes.has(x)){classes.delete(x);return false}classes.add(x);return true}};}
    appendChild(e){e.parentNode=this;this.children.push(e);return e;}
    replaceChildren(...nodes){this.children.forEach(n=>n.parentNode=null);this.children=[];nodes.forEach(n=>this.appendChild(n));}
    setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]||null;}
    addEventListener(k,f){(this.handlers[k]||(this.handlers[k]=[])).push(f);}fire(k,e={}){(this.handlers[k]||[]).forEach(f=>f(Object.assign({target:this},e)));}
    get isConnected(){return this===doc.body||this===doc.head||!!(this.parentNode&&this.parentNode.isConnected);}
    remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}}
    focus(){doc.activeElement=this;}getClientRects(){return this.hidden?[]:[{}];}
    closest(s){return s==='[hidden]'?(this.hidden?this:this.parentNode&&this.parentNode.closest(s)):null;}
    querySelectorAll(selector){return flat(this).slice(1).filter(n=>selector==='iframe'?n.tagName==='IFRAME':['BUTTON','SELECT','A','IFRAME','SUMMARY'].includes(n.tagName));}
  }
  function flat(n){return [n,...n.children.flatMap(flat)];}
  doc={createElement:t=>new Element(t),documentElement:{style:{overflow:'auto'}},addEventListener(k,f){documentEvents[k]=f;},querySelectorAll(s){return doc.body.querySelectorAll(s);}};doc.body=new Element('body');doc.head=new Element('head');
  const background=new Element('main'),oldInert=new Element('aside'),opener=new Element('button');oldInert.inert=true;background.appendChild(opener);doc.body.appendChild(background);doc.body.appendChild(oldInert);doc.activeElement=opener;
  const history={state:{floor:2},states:[{floor:2}],index:0,pushState(s){this.states=this.states.slice(0,this.index+1);this.states.push(s);this.index++;this.state=s;},replaceState(s){this.states[this.index]=s;this.state=s;},back(){this.index--;this.state=this.states[this.index];historyEvents.push('back');events.popstate({state:this.state});},forward(){this.index++;this.state=this.states[this.index];events.popstate({state:this.state});}};
  const c={document:doc,history,location:{origin:'https://apuda.app',href:'https://apuda.app/#floor-2'},console,URL,CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}},addEventListener(k,f){events[k]=f},dispatchEvent(e){(events[e.type]||(()=>{}))(e)},fetch(url){fetches.push(url);if(failResources)return Promise.reject(Error('offline'));const result={ok:true,json:()=>Promise.resolve(url.includes('/mini/')?{edition:'test',faq:['진료 때 물어볼 질문']}:{updated:'test',items:[1,2,3].map(n=>({q:'질문 '+n,a:'답변 '+n}))})};return deferredResources?new Promise(resolve=>queue.push(()=>resolve(result))):Promise.resolve(result);}};c.window=c;
  if(api)c.YT={Player:function(iframe,options){this.iframe=iframe;this.options=options;this.destroy=()=>{this.destroyed=true;iframe.remove();};players.push(this);}};
  vm.createContext(c);vm.runInContext(read('assets/apuda-cancer-videos.js')+'\n'+read('assets/apuda-video-dialog.js'),c);
  return {c,doc,events,documentEvents,players,fetches,queue,history,background,oldInert,opener,flat:()=>flat(doc.body),byId:id=>flat(doc.body).find(n=>n.id===id),class:cls=>flat(doc.body).find(n=>(n.className||'').split(' ').includes(cls))};
}
(async()=>{
  const s=setup(),api=s.c.ApuDaVideoDialog,catalog=s.c.ApuDaCancerVideos;
  assert.equal(Object.keys(catalog.catalog).length,12);assert.equal(Object.values(catalog.catalog).flat().length,13);
  assert.equal(api.open('invalid'),false);assert.equal(s.fetches.length,0);
  for(const slug of Object.keys(catalog.catalog)){
    assert(api.open(slug));await settle();const iframe=s.byId('apudaVideoFrame');assert(iframe.src.startsWith('https://www.youtube-nocookie.com/embed/'+catalog.items(slug)[0].id+'?'));assert(iframe.src.includes('playsinline=1'));assert.equal(s.doc.querySelectorAll('iframe').length,1);
    assert(s.class('avd-book').children[1].children.some(n=>n.tagName==='H3'&&n.textContent.includes(api.names[slug])));
    assert(s.class('avd-faq').children.length===3);assert(!catalog.html(slug).includes('target="_blank"'));assert(catalog.html(slug).includes('/watch/?cancer='+slug));
  }
  assert.equal(s.background.inert,true);assert.equal(s.oldInert.inert,true);assert.equal(s.doc.documentElement.style.overflow,'hidden');
  api.open('breast');await settle();const select=s.byId('avdCancer');select.value='lung';select.fire('change');await settle();assert(s.byId('apudaVideoFrame').src.includes('/embed/RkS8stwpToo?'),'changing cancer chooses the valid default video');
  api.open('lymphoma','C-U62IjZgXQ');await settle();assert(s.byId('apudaVideoFrame').src.includes('C-U62IjZgXQ'));assert.equal(s.class('avd-choices').children.length,2);
  const expand=s.class('avd-expand');expand.fire('click');assert.equal(expand.getAttribute('aria-pressed'),'true');expand.fire('click');assert.equal(expand.getAttribute('aria-pressed'),'false');
  s.players.at(-1).options.events.onError({data:150});assert.equal(s.class('avd-fallback').hidden,false);
  const sessionTitle=s.byId('avdTitle').textContent;api.close();assert.equal(s.doc.querySelectorAll('iframe').length,0);assert.equal(s.byId('apudaVideoDialog'),undefined);assert.equal(s.background.inert,false);assert.equal(s.oldInert.inert,true);assert.equal(s.doc.activeElement,s.opener);assert.equal(s.doc.documentElement.style.overflow,'auto');assert.equal(s.history.state.floor,2);assert(s.players.every(p=>p.destroyed));
  s.history.forward();await settle();assert.equal(s.byId('avdTitle').textContent,sessionTitle);s.history.back();assert.equal(s.byId('apudaVideoDialog'),undefined,'Back closes the popup');
  const offline=setup({failResources:true});offline.c.ApuDaVideoDialog.open('breast');await settle();await settle();assert(offline.class('avd-faq').children[0].textContent.includes('FAQ 전체 보기'));assert(offline.class('avd-book'),'book links remain available');offline.c.ApuDaVideoDialog.close();
  const race=setup({deferredResources:true});race.c.ApuDaVideoDialog.open('breast');race.c.ApuDaVideoDialog.open('lung');race.queue.forEach(resolve=>resolve());await settle();await settle();assert(race.byId('avdTitle').textContent.includes('폐암'));assert(race.class('avd-book').children[1].children.some(n=>n.tagName==='H3'&&n.textContent.includes('폐암')));race.c.ApuDaVideoDialog.close();
  const late=setup({api:false});late.c.ApuDaVideoDialog.open('breast');late.c.ApuDaVideoDialog.close();let created=0;late.c.YT={Player:function(){created++}};late.c.onYouTubeIframeAPIReady();await settle();assert.equal(created,0,'late iframe API must not recreate a closed player');
  console.log('PASS: 12 cancers / 13 IDs, same-site links, one portrait iframe, cancer switching, below-video resources, enlarge, restricted/offline states, background inert/focus restore, Back/Forward and late-response cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
