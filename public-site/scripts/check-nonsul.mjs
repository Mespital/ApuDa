import assert from 'node:assert/strict';
import {createStateHandler} from '../netlify/lib/nonsul-handler.mjs';
import {newNotebook,newEntry} from '../netlify/lib/nonsul-notebook.mjs';
import auth from '../netlify/functions/nonsul-auth.mjs';

// A small deterministic storage adapter exercises authorization and revision checks.
const rows=new Map();
const deps={load:async id=>structuredClone(rows.get(id)??null),save:async(id,revision,payload)=>{
 const previous=rows.get(id);if((previous?.revision??0)!==revision)return null;
 const row={revision:revision+1,payload:structuredClone(payload),updated_at:new Date().toISOString()};rows.set(id,row);return row;
}};
const api=id=>createStateHandler({...deps,userId:id});
const request=(method='GET',body,headers={})=>new Request('https://apuda.app/nonsul/api/state',{method,headers:{'Content-Type':'application/json',origin:'https://apuda.app',...headers},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
assert.equal((await api(null)(request())).status,401);
assert.equal((await api('student-a')(request('DELETE'))).status,405);
const initial=await (await api('student-a')(request())).json();assert.equal(initial.revision,0);
const a=newNotebook();a.entries.l01={...newEntry(),answer:'제시문 A의 중심 주장을 요약하는 시험용 답안.'};
assert.equal((await api('student-a')(request('PUT',{revision:0,data:a,userKey:'student-b'}))).status,200);
assert.equal(rows.has('student-b'),false,'Client cannot choose another user ID');
const other=await (await api('student-b')(request())).json();assert.equal(other.revision,0);assert.deepEqual(other.data.entries,{});
const b=newNotebook();b.entries.l02={...newEntry(),answer:'두 번째 사용자의 별도 답안.'};
await api('student-b')(request('PUT',{revision:0,data:b}));
assert.equal(rows.get('student-a').payload.entries.l01.answer,a.entries.l01.answer);
const updated=structuredClone(a);updated.entries.l01.answer='새로운 기기에서 먼저 저장한 답안';
assert.equal((await api('student-a')(request('PUT',{revision:1,data:updated}))).status,200);
const conflict=await api('student-a')(request('PUT',{revision:1,data:a}));assert.equal(conflict.status,409);
assert.equal((await conflict.json()).data.entries.l01.answer,updated.entries.l01.answer,'Stale writes return and preserve current data');
assert.equal((await api('student-a')(request('PUT',{revision:2,data:a},{origin:'https://elsewhere.example'}))).status,403);
for(const invalid of [null,[],{revision:-1,data:a},{revision:2,data:{...a,exam:{...a.exam,grades:{국어:'10'}}}}])assert.equal((await api('student-a')(request('PUT',JSON.stringify(invalid)))).status,400);
assert.equal((await api('student-a')(request('PUT','{'))).status,400);
assert.equal((await api('student-a')(request('PUT',' '.repeat(300001)))).status,413);
const read=await api('student-a')(request());assert.equal(read.headers.get('Cache-Control'),'no-store, private');
assert.equal((await auth(request('POST','null'))).status,400);
assert.equal((await auth(request('POST',{action:'login'},{origin:'https://elsewhere.example'}))).status,403);
console.log('PASS: authentication gate, two-user isolation, revision conflicts, validation, CSRF, payload limit, cache headers.');
