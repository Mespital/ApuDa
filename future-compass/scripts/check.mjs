import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const events={};const content={innerHTML:'',scrollIntoView(){}};const storage=new Map();
let popup=null;let nextTimer=0;const timers=new Map();
const sandbox={location:{hash:""},setTimeout:(fn,ms)=>{timers.set(++nextTimer,{fn,ms});return nextTimer},clearTimeout:id=>timers.delete(id),setInterval:()=>++nextTimer,clearInterval(){},sessionStorage:{getItem:()=>null,setItem(){}},console,URL,AbortController,AbortSignal,Intl,Date,Set,Promise,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},window:{scrollY:0,scrollTo(){},addEventListener(){}},document:{body:{appendChild:node=>{popup=node}},createElement:()=>({innerHTML:"",setAttribute(){},addEventListener(){},remove(){popup=null}}),querySelector:selector=>selector==="#seungjun-cheer"?popup:content,querySelectorAll:()=>[],addEventListener:(name,fn)=>(events[name]??=[]).push(fn)},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'dist/news.json'),'utf8'))})};
vm.createContext(sandbox);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],sandbox);
for(const file of ['explore.js','shell.js','career-lab.js','news.js'])vm.runInContext(fs.readFileSync(path.join(root,'dist',file),'utf8'),sandbox);
const run=code=>vm.runInContext(code,sandbox);
assert.match(content.innerHTML,/승준이의 미래 아지트/);
for(const page of ['home','future','life','career','plan','research','explore','news']){run(`page=${JSON.stringify(page)};render()`);assert.ok(content.innerHTML.length>150);assert.doesNotMatch(content.innerHTML,/undefined/)}
run("page='explore';route='self';chosenSubjects.add('수학');chosenActivities.add('만들기');activeDomain='robots';labStep=3;render();saveProgress()");
assert.match(content.innerHTML,/기계|로봇/);assert.equal((content.innerHTML.match(/id="domain-detail"/g)||[]).length,1);
assert.ok(storage.get('future-compass-v2').includes('수학'));
run("newsData={last_success_at:new Date().toISOString(),failures:[],articles:[{title:'<img src=x onerror=1>',url:'https://openai.com/news/test',source:'OpenAI',published_at:new Date().toISOString(),category:'AI·컴퓨팅',domain:'ai'}]};page='news';render()");
assert.match(content.innerHTML,/&lt;img/);assert.doesNotMatch(content.innerHTML,/<img src=x/);
assert.equal(run("safeArticleURL('javascript:alert(1)')"),null);
assert.equal(run("safeArticleURL('https://openai.com.evil.test/')"),null);
assert.equal(run("validateNews({articles:[{title:'bad',url:'https://evil.test',published_at:'2026-10-01'}]}).articles.length"),0);
run('showCheer(true)');assert.match(popup.innerHTML,/흰둥이/);assert.ok([...timers.values()].some(t=>t.ms===7000));run('hideCheer()');assert.equal(popup,null);storage.set('compass-cheer-off','1');run('showCheer()');assert.equal(popup,null);run('showCheer(true)');assert.match(popup.innerHTML,/짱구/);run('hideCheer()');
const scenarios=[
 {topic:'robots',subjects:['정보'],activities:['만들기']},
 {topic:'business',subjects:['국어','사회·경제'],activities:['설명하기']},
 {topic:null,subjects:[],activities:[]},
 {topic:'health',subjects:['생명과학','화학'],activities:['연구하기']},
 {topic:'creative',subjects:['미술·디자인'],activities:['표현하기']},
 {topic:'education',subjects:['국어'],activities:['사람 돕기']},
 {topic:'food',subjects:['화학'],activities:['손으로 실습']},
 {topic:'energy',subjects:['물리'],activities:['분석하기']},
 {topic:'city',subjects:['사회·경제'],activities:['사회 문제 해결']},
 {topic:'security',subjects:['정보'],activities:['문제 해결']}
];
for(const input of scenarios){run(`labTopics.clear();chosenSubjects.clear();chosenActivities.clear();${input.topic?`labTopics.add('${input.topic}');`:''}${input.subjects.map(x=>`chosenSubjects.add('${x}');`).join('')}${input.activities.map(x=>`chosenActivities.add('${x}');`).join('')}labStep=3;route='self';page='explore';render()`);assert.equal(run('labRank()[0].d.id'),input.topic||'ai');assert.match(content.innerHTML,/이번 주 30분 실천/);assert.doesNotMatch(content.innerHTML,/undefined/)}
run("labTopics.clear();chosenSubjects.clear();chosenActivities.clear()");assert.equal(run('labRank()[0].d.id'),'ai');assert.equal(run('labExperts.length'),24);assert.equal(run('labUsers.length'),10);
run("labCompare.clear();labCompare.add('robots');labCompare.add('creative');labReflection.robots='<script>bad</script>';render()");assert.match(content.innerHTML,/&lt;script&gt;/);assert.equal((content.innerHTML.match(/data-lab-reflection=/g)||[]).length,2);run('labSave()');assert.ok(storage.get('compass-career-lab').includes('robots'));
for(let i=0;i<4;i++){run(`labStep=${i};render()`);assert.ok(content.innerHTML.includes('내 탐색 기록 지우기'))}
const resetButton={dataset:{},hasAttribute:key=>key==='data-lab-reset'};events.click.at(-2)({target:{closest:()=>resetButton}});assert.equal(run('labCompare.size+labTopics.size+labWork.size'),0);assert.deepEqual(JSON.parse(storage.get('compass-career-lab')).reflection,{});
console.log('PASS: 24 review perspectives, 10 scenario inputs, four steps, comparison, escaped reflection and persistence, personalized home, encouragement timing and opt-out, 8 screens, interest matching, full-width detail, saved choices, feed URL/content validation.');
