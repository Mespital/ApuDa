// Regression checks for the Netlify Edge Function used by 5F industry news.
// Run: node public-site/scripts/test-news-access.mjs (Node 22+).
import assert from 'node:assert/strict';
import handler from '../netlify/edge-functions/news-access.js';

const config = {
  APUDA_NEWS_PIN: '7392', // test fixture: not the production PIN
  APUDA_NEWS_SESSION_SECRET: 'test-only-session-secret-longer-than-thirty-two-characters'
};
globalThis.Netlify = { env: { get: key => config[key] } };
let publicRequests = 0;
const context = { next: () => { publicRequests++; return new Response('PUBLIC_NEWS'); } };
const request = (path, init = {}, host='https://apuda.app') =>
  handler(new Request(host + path, init), context);
const submit = (value, headers={}, host='https://apuda.app', next='/news/') =>
  request('/news/unlock', {
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded',...headers},
    body:new URLSearchParams({pin:value,next}).toString()
  },host);

let response = await request('/news/');
assert.equal(response.status,200);
assert.match(await response.text(), /비밀번호/);

response = await submit('0000',{'origin':'https://apuda.app','sec-fetch-site':'same-origin'});
assert.equal(response.status,401);

response = await submit('7392',{'origin':'https://apuda.app','sec-fetch-site':'same-origin'},'https://apuda-total.netlify.app','/news/?date=2026-11-20');
assert.equal(response.status,303,'Same-origin browser submissions must work behind Netlify proxy host');
assert.equal(response.headers.get('location'),'/news/?date=2026-11-20','Redirect must stay on custom domain');
assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
const cookie = response.headers.get('set-cookie').split(';')[0];
response = await request('/news/?date=2026-11-20',{headers:{cookie}});
assert.equal(await response.text(),'PUBLIC_NEWS');

response = await submit('7392',{'origin':'https://apuda.app'},'https://apuda-total.netlify.app');
assert.equal(response.status,303,'Legacy browsers without Fetch Metadata must work on the canonical domain');

response = await submit('7392',{'origin':'https://attacker.example','sec-fetch-site':'cross-site'});
assert.equal(response.status,403,'Cross-site form submissions must be rejected');
response = await submit('7392',{'origin':'https://attacker.example'});
assert.equal(response.status,403,'Unknown-origin legacy browser submissions must be rejected');
response = await submit('7392',{'origin':'https://apuda.app','sec-fetch-site':'same-site'});
assert.equal(response.status,403,'Same-site but cross-origin submissions must be rejected');

response = await request('/news/oncology/');
assert.equal(await response.text(),'PUBLIC_NEWS','Public oncology remains accessible');
response = await request('/news/data/latest.json');
assert.equal(await response.text(),'PUBLIC_NEWS','Shared oncology data remains accessible');

config.APUDA_NEWS_SESSION_SECRET = '';
response = await request('/news/');
assert.equal(response.status,503,'Missing secret must fail closed');

assert.equal(publicRequests,3);
console.log('PASS 5F news: PIN, proxy-host login, relative redirect, signed session, cross-site protection, public oncology, fail-closed');
