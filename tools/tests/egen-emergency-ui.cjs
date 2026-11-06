// UI safety / accessibility contract checks for the ApuDa emergency finder.
// Run: node tools/tests/egen-emergency-ui.cjs
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../../public-site/emergency/index.html'),'utf8');
assert(html.includes('lang="ko"'));
assert(html.includes('name="viewport"'));
assert(html.includes('href="tel:119"'));
assert(html.includes('role="status" aria-live="polite"'));
assert(html.includes('id="stage1" name="stage1" required'));
assert(html.includes('id="stage2" name="stage2"'));
assert(html.includes('href="https://www.e-gen.or.kr/"'));
assert(html.includes('rel="noopener noreferrer"'));
assert(html.includes('prefers-reduced-motion:reduce'));
assert(html.includes('focus-visible'));
assert(html.includes('api') === false || !html.includes('EGEN_API_KEY'));
assert(html.includes('/.netlify/functions/egen-emergency?'));
assert(html.includes("payload.error==='not_configured'"));
assert(html.includes("Number.isInteger(beds)&&beds>=0"));
assert(html.includes('확정') && html.includes('119'));
assert(html.includes('results.replaceChildren()'));
assert(!html.includes('.innerHTML='),'API response must never be assigned to HTML');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'all ids must be unique');
assert(html.indexOf('href="tel:119"') < html.indexOf('id="search"'),'119 action must precede routine search');
assert(html.indexOf('id="search"') < html.indexOf('id="results"'),'search must precede results');
assert.equal((html.match(/<h1\b/g)||[]).length,1);
console.log('PASS: ApuDa emergency mobile UI, 119 priority, semantic states, readable results, safe rendering, API isolation');
