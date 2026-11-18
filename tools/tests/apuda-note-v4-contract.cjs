/* Synthetic-only compatibility preflight: no browser storage, network, or migration. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const site=path.resolve(__dirname,'../../public-site');
const read=(file)=>fs.readFileSync(path.join(site,file),'utf8');
const context={crypto:webcrypto,TextEncoder};context.window=context;vm.createContext(context);
vm.runInContext(read('note/note-storage.js'),context);
vm.runInContext(read('note-v4/v3-compat-audit.js'),context);

const synthetic={
  profile:{name:'가상환자',cancer:'유방암',hospital:'가상병원',devices:[],rxCombo:[],rxPlan:[]},
  logs:[
    {id:'one',date:'2026-11-10',temp:'36.8',tempReadings:[{value:'37.2',at:'2026-11-10T07:00:00Z'},{value:'36.8',at:'2026-11-10T12:00:00Z'}],pain:'0',meal:'0',note:'가상 증상 메모',weight:'58.4',unmappedLogField:'보존 필요'},
    {id:'two',date:'2026-11-09',temp:'',pain:'',meal:'',note:''}
  ],
  roadmap:[{date:'2026-11-15',title:'가상 외래',status:'planned'}],meds:[{name:'가상약'}],
  labs:[{date:'2026-11-09',anc:5000,units:{anc:'unknown'}}],
  questions:['첫째','둘째','셋째','넷째'].map((question)=>({question,priority:'high'})),
  supports:[],distress:[],checks:{'2026-11-10':{med_123:true}},triage:{items:['red-fever'],at:123},meta:{},unknownTopField:'보존 필요'
};
const before=JSON.stringify(synthetic),audit=context.ApuDaV3Compatibility.inspect(synthetic);
const issue=(code)=>audit.issues.find((x)=>x.code===code);
assert.equal(audit.mode,'read-only-compatibility-audit');
assert.equal(audit.migrationReady,false);
assert.equal(JSON.stringify(synthetic),before,'original V3 object must remain unchanged');
assert.equal(audit.days[0].latestTemperature,36.8,'last temperature remains 36.8');
assert.equal(audit.days[0].maximumTemperature,37.2,'the earlier high reading remains 37.2');
assert.equal(audit.days[0].temperatureReadingCount,2);
assert.equal(audit.days[0].pain,0,'pain zero is a real measurement, not missing');
assert.equal(audit.days[0].mealPercent,0,'zero percent is not treated as missing');
assert.equal(audit.days[1].pain,null,'missing pain remains unknown, not zero');
assert.equal(audit.days[1].latestTemperature,null);
assert.equal(audit.counts.questionsBeyondV4Limit,1);
['MULTIPLE_TEMPERATURES','MEAL_PERCENT_SCALE','UNSTRUCTURED_SYMPTOMS','OTHER_DAILY_FIELDS','UNKNOWN_DAILY_FIELDS','AUTHOR_NOT_RECORDED','QUESTIONS_OVER_THREE','UNSUPPORTED_PROFILE','UNSUPPORTED_MEDICATIONS','UNSUPPORTED_LAB_RESULTS','UNSUPPORTED_CARE_TIMELINE','UNSUPPORTED_UNKNOWN_TOP_LEVEL'].forEach((code)=>assert.ok(issue(code),'missing compatibility blocker: '+code));
assert.equal(issue('QUESTIONS_OVER_THREE').priority,'P0');
assert.equal(context.ApuDaV3Compatibility.inspect(context.ApuDaNoteStorage.envelope(synthetic)).counts.logs,2,'V3 backup envelope must be accepted');
assert.throws(()=>context.ApuDaV3Compatibility.inspect({foo:1}),/invalid-backup/);
assert.equal(JSON.stringify(audit).includes('가상환자'),false,'audit report must not include patient name');
assert.ok(audit.outsideBackupScope.includes('apuda_note_chat_v1'),'separate legacy chat history requires an independent audit');
const demo=read('note-v4/app.js'),preflight=read('note-v4/v3-compat-audit.js');
assert.match(demo,/sessionStorage\.getItem\(DEMO_KEY\)/);
assert.doesNotMatch(demo,/\blocalStorage\./,'V4 demo must not read or write production localStorage');
assert.doesNotMatch(preflight,/\b(?:localStorage|sessionStorage)\b/,'preflight must not access browser storage');
assert.doesNotMatch(read('note-v4/index.html'),/v3-compat-audit\.js/,'audit must not be loaded by the demo UI');
console.log('PASS: V3/V4 read-only contract; multi-readings latest/max; 0 vs unknown; question overflow; unsupported data ledger; no production storage access');
