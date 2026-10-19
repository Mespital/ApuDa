const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../public-site/assets/apuda-floor-transition.js'),'utf8');
function setup({quiet=false,reduced=false,mobile=false}={}){
  const timelines=[];function node(){const classes=new Set();return {attrs:{},dataset:{},style:{},clientWidth:1000,clientHeight:700,offsetLeft:0,offsetTop:0,setAttribute(k,v){this.attrs[k]=v;},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)}};}
  const body=node(),frame=node(),panel=node(),options={frame,panel,spot:node(),sweep:node(),guide:node(),hint:node(),footer:node(),controls:[node(),node()]};
  const c={document:{body},innerWidth:1300,innerHeight:900,matchMedia:q=>({matches:q.includes('reduced-motion')?reduced:mobile}),ApuDaPreferences:{isQuiet:()=>quiet},gsap:{killTweensOf(){},set(target,props){(Array.isArray(target)?target:[target]).filter(Boolean).forEach(n=>Object.assign(n.style,props));},timeline(config={}){const callbacks=[],tl={killed:false,to(n,p){if(p.onStart)callbacks.push(p.onStart);if(p.onComplete)callbacks.push(p.onComplete);return this;},fromTo(n,a,b){return this.to(n,b);},kill(){this.killed=true;},flush(){callbacks.forEach(f=>f());if(config.onComplete)config.onComplete();}};timelines.push(tl);return tl;}}};c.window=c;vm.createContext(c);vm.runInContext(source,c);
  return {api:c.ApuDaFloorTransition.mount(options),frame,panel,body,timelines};
}
for(const mobile of [false,true])for(const mode of ['quiet','reduced','normal']){
  const s=setup({quiet:mode==='quiet',reduced:mode==='reduced',mobile});
  for(let floor=1;floor<=5;floor++){
    let revealed=0,completed=0,closed=0;
    s.api.open({room:{x:30,y:floor*10,w:38,h:12},first:true,onReveal(){revealed++;},onComplete(){completed++;}});
    if(mode==='normal')s.timelines.at(-1).flush();
    assert.equal(s.panel.inert,false,`${mode} ${floor}F`);assert.equal(s.panel.attrs['aria-hidden'],'false');assert(s.panel.classList.contains('live'));assert.equal(s.frame.dataset.floorTransition,'open');assert.equal(revealed,1);assert.equal(completed,1);
    s.api.close({onComplete(){closed++;}});if(mode==='normal')s.timelines.at(-1).flush();
    assert.equal(s.panel.inert,true);assert.equal(s.panel.attrs['aria-hidden'],'true');assert.equal(s.frame.dataset.floorTransition,'idle');assert.equal(closed,1);
  }
}
const race=setup();let oldReveal=0;race.api.open({room:{x:10,y:20,w:30,h:10},onReveal(){oldReveal++;}});const old=race.timelines.at(-1);race.api.close({});old.flush();assert.equal(oldReveal,0);assert.equal(race.panel.inert,true);
console.log('PASS: all five floors open/close accessibly in quiet, reduced and normal modes on both layout branches; interrupted callbacks cannot reopen a closed panel');
