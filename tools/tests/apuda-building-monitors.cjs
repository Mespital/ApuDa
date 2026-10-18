const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require('path').resolve(__dirname,'../../public-site/assets/apuda-building-monitors.js'),'utf8');
const catalogSource=fs.readFileSync(require('path').resolve(__dirname,'../../public-site/assets/apuda-cancer-videos.js'),'utf8');
const settle=()=>new Promise(r=>setImmediate(r));
function setup({quiet=false,lowData=false,deferred=false,fallback=false}={}){
  const draws=[],plays=[],callbacks=new Map(),cancelled=[],queries=[],events={};let next=0;
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={};this.dataset={};this.currentTime=0;this.readyState=4;this.paused=true;this.pauseCount=0;
      const classes=new Set();this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};
      if(tag==='video'&&!fallback){this.requestVideoFrameCallback=f=>{const id=++next;callbacks.set(id,f);return id;};this.cancelVideoFrameCallback=id=>{cancelled.push(id);callbacks.delete(id);};}
    }
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]||null;}
    appendChild(e){this.children.push(e);return e;}addEventListener(k,f){this[k+'Handler']=f;}
    querySelector(selector){return this.children.find(e=>(e.attrs.class||e.className||'').split(' ').includes(selector.slice(1)))||null;}
    getContext(){return {fillRect(){},drawImage(...args){draws.push(args);}};}
    set src(v){this.attrs.src=v;}get src(){return this.attrs.src;}load(){}
    pause(){this.paused=true;this.pauseCount++;}
    play(){this.paused=false;let resolve,reject;const p=new Promise((r,j)=>{resolve=r;reject=j;});plays.push({resolve,reject});if(!deferred)resolve();return p;}
  }
  const frame=new Element('frame');Object.assign(frame,{clientWidth:390,clientHeight:390*941/775});
  const document={hidden:false,createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)};
  const window={addEventListener:(k,f)=>events[k]=f,requestAnimationFrame:f=>{const id=++next;callbacks.set(id,f);return id;},cancelAnimationFrame:id=>{cancelled.push(id);callbacks.delete(id);}};
  const ctx={window,document,navigator:{connection:{saveData:lowData}},matchMedia:q=>{const m={matches:q.includes('reduced-motion')?quiet:true,addEventListener(_,f){this.change=f;}};queries.push({q,m});return m;},Promise,isFinite};
  vm.runInNewContext(catalogSource,ctx);vm.runInNewContext(source,ctx);
  const api=window.ApuDaBuildingMonitors.mount({frame});
  const flat=e=>[e,...e.children.flatMap(flat)];
  const video=frame.children.find(e=>e.tag==='video'),links=frame.children.filter(e=>e.tag==='a');
  return {api,frame,document,video,links,draws,plays,callbacks,cancelled,queries,flat:()=>flat(frame),
    tick(time){const [id,fn]=callbacks.entries().next().value;callbacks.delete(id);fn(time);}};
}
(async()=>{
  const s=setup();assert.equal(s.video.src,undefined);assert.equal(s.links.length,5);
  assert.equal(s.flat().filter(e=>e.tag==='canvas').length,5);
  assert.equal(s.frame.children.filter(e=>e.tag==='video').length,1,'One decoder supplies five screens');
  assert.equal(s.links[0].href,'/watch/?cancer=breast');
  s.api.resume();await settle();assert.equal(s.callbacks.size,1);s.tick(100);
  assert.equal(s.draws.length,5);assert.deepEqual(s.draws.map(a=>a[1]),[0,320,640,960,1280]);
  assert.equal(s.frame.dataset.monitorFrames,'1');assert(s.frame.classList.contains('monitor-playing'));
  s.video.currentTime=2.2;s.tick(200);assert.equal(s.links[0].href,'/watch/?cancer=lung');
  assert(s.links[0].attrs['aria-label'].includes('폐암'));
  const oldCallback=[...s.callbacks.values()][0];s.api.suspend();assert.equal(s.callbacks.size,0);assert.equal(s.video.paused,true);
  s.api.resume();await settle();const currentCallback=[...s.callbacks.values()][0];oldCallback(300);
  assert.equal([...s.callbacks.values()][0],currentCallback,'Stale drawing callbacks cannot disturb a resumed loop');
  s.document.hidden=true;s.tick(400);assert.equal(s.callbacks.size,0,'Do not redraw in a hidden tab');
  for(const options of [{quiet:true},{lowData:true}]){const q=setup(options);q.api.resume();await settle();assert.equal(q.video.src,undefined);assert.equal(q.callbacks.size,0);}
  const denied=setup({deferred:true});denied.api.resume();denied.plays[0].reject(new Error('NotAllowedError'));await settle();
  assert.equal(denied.frame.dataset.buildingMonitors,'still');assert.equal(denied.callbacks.size,0);
  const race=setup({deferred:true});race.api.resume();race.api.suspend();race.api.resume();const pauseCount=race.video.pauseCount;
  race.plays[1].resolve();await settle();race.plays[0].resolve();await settle();
  assert.equal(race.video.pauseCount,pauseCount);assert.equal(race.callbacks.size,1);
  const fallback=setup({fallback:true});fallback.api.resume();await settle();fallback.tick(100);assert.equal(fallback.draws.length,5);fallback.api.suspend();assert.equal(fallback.callbacks.size,0);
  console.log('PASS: five masked monitor canvases, one decoder, exact video links, paused drawing, stale callbacks, autoplay failure, reduced motion, data saver and RAF fallback');
})().catch(e=>{console.error(e);process.exitCode=1;});
