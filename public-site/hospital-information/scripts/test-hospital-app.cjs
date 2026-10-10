"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const hospitals=JSON.parse(fs.readFileSync(path.join(root,"data/hospitals.json"),"utf8"));
const cancers=JSON.parse(fs.readFileSync(path.join(root,"data/cancers.json"),"utf8"));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,"HTML IDs must be unique");
class FakeElement {
  constructor(tag) {
    this.tagName=tag||"div";this.children=[];this.textContent="";this.value="";
    this.hidden=false;this.listeners={};this.attributes={};this.tabIndex=0;this.scrolled=false;
    this.classList={toggle(){},add(){},remove(){}};
  }
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(type,handler){this.listeners[type]=handler;}
  focus(){this.focused=true;}
  scrollIntoView(){this.scrolled=true;}
  reset(){for(const id of ["cancerSelect","regionSelect","roleSelect","hospitalQuery"])elements[id].value="";}
}
const elements=Object.fromEntries(ids.map(id=>[id,new FakeElement()]));
elements.searchNote.hidden=true;
function get(id){if(!elements[id])throw Error("Unknown element id "+id);return elements[id];}
const now=new Date().toISOString();
const publicDoctor={doctor_name:"시험 검증 의료진",hospital_name:"서울아산병원",
  region:"서울",department:"외과",specialty_text:"폐암",status:"ACTIVE",
  profile_url:"https://www.amc.seoul.kr/asan/staff/detail.do?id=1",
  verified_at:now,cancers:[{code:"LUNG",role:"surgery"}]};
const pendingDoctor={...publicDoctor,doctor_name:"미검증 의료진",status:"VERIFY_REQUIRED"};
function mockFetch(url){
  let result;
  if(url.endsWith("/hospitals.json"))result=hospitals;
  else if(url.endsWith("/cancers.json"))result=cancers;
  else if(url.endsWith("/verified-specialists.json"))result={
    count:2,generated_at:now,results:[publicDoctor,pendingDoctor]
  };
  else throw Error("Unexpected fetch "+url);
  return Promise.resolve({ok:true,json:()=>Promise.resolve(result)});
}
vm.runInNewContext(app,{
  document:{getElementById:get,createElement:tag=>new FakeElement(tag)},
  window:{matchMedia:()=>({matches:true})},fetch:mockFetch,URL,Date,console
},{filename:"app.js"});
async function run(){
  for(let i=0;i<15;i++)await new Promise(r=>setImmediate(r));
  assert.equal(get("hospitalList").children.length,30,"Render 30 hospitals before filtering");
  assert.equal(get("verifiedMetric").textContent,1,"Do not count pending physicians");
  assert.match(get("syncStatus").textContent,/마지막 자동 동기화/);
  get("cancerSelect").value="LUNG";
  get("filters").listeners.submit({preventDefault(){}});
  assert.equal(get("doctorPanel").hidden,false,"Render clinician when approved");
  assert.equal(get("doctorList").children.length,1);
  assert.equal(get("resultsArea").scrolled,true,"Mobile scrolls to results");
  get("roleSelect").value="radiation";
  get("filters").listeners.submit({preventDefault(){}});
  assert.equal(get("hospitalPanel").hidden,false,"Show hospital fallback when no approved role matches");
  assert.equal(get("hospitalList").children.length,30);
  get("regionSelect").value="서울";
  get("filters").listeners.submit({preventDefault(){}});
  assert.equal(get("hospitalList").children.length,hospitals.filter(h=>h.region==="서울").length);
  get("tabDoctors").listeners.click();
  assert.ok(get("officialFallback").children.length>0,"Official clinic links rendered");
  get("tabDoctors").listeners.keydown({key:"ArrowLeft",preventDefault(){}});
  assert.equal(get("hospitalPanel").hidden,false,"Keyboard tab navigation works");
  get("resetButton").listeners.click();
  assert.equal(get("hospitalList").children.length,30);
  get("hospitalQuery").value="시험 검증 의료진";
  get("filters").listeners.submit({preventDefault(){}});
  assert.equal(get("doctorPanel").hidden,false,"Doctor name query works without selecting cancer");
  assert.equal(get("doctorList").children.length,1,"Only reviewed doctor appears in name search");
  get("resetButton").listeners.click();
  const fn=require(path.join(root,"netlify/functions/hospital-information-matcher.js"));
  const original=global.fetch;
  global.fetch=async()=>({ok:true,json:async()=>({count:2,generated_at:now,results:[publicDoctor,pendingDoctor]})});
  try{
    const matched=await fn.handler({httpMethod:"GET",queryStringParameters:{cancer:"LUNG",role:"surgery"}});
    assert.equal(matched.statusCode,200);
    assert.equal(JSON.parse(matched.body).count,1);
    const noMatch=await fn.handler({httpMethod:"GET",queryStringParameters:{cancer:"LUNG",role:"radiation"}});
    assert.equal(JSON.parse(noMatch.body).count,0);
    const invalid=await fn.handler({httpMethod:"GET",queryStringParameters:{cancer:"../x"}});
    assert.equal(invalid.statusCode,400);
  }finally{global.fetch=original;}
  console.log("PASS: hospital search, mobile fallback, verified-only filtering, date, API and tabs.");
}
run().catch(e=>{console.error(e);process.exitCode=1;});
