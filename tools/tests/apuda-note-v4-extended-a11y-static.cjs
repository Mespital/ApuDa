/* Source-only accessibility checks. Not a substitute for real WCAG testing. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../../public-site/note-v4');
const html=fs.readFileSync(path.join(base,'extended-preview.html'),'utf8');
const css=fs.readFileSync(path.join(base,'extended-preview.css'),'utf8');
const rgb=(hex)=>hex.replace('#','').match(/../g).map((x)=>parseInt(x,16)/255);
const luminance=(hex)=>rgb(hex).map((v)=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4)
  .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
assert.match(html,/<html lang="ko">/);
assert.match(html,/name="viewport"/);
assert.match(html,/class="skip" href="#main"/);
assert.match(html,/role="status" aria-live="polite"/);
assert.match(html,/<main id="main"/);
assert.match(html,/<button id="load"/);
assert.match(html,/<button id="clear"/);
assert.match(css,/\.skip:focus\{/);
assert.match(css,/button:focus-visible,a:focus-visible\{/);
assert.match(css,/min-height:48px/);
assert.match(css,/@media\(max-width:680px\)/);
assert.match(css,/@media\(max-width:360px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/overflow-wrap:anywhere/);
for(const [foreground,background,name] of [
  ['#2358eb','#f7f9fc','accent on page'],['#5d6d80','#ffffff','muted on white'],
  ['#21304d','#f7f9fc','main text on page'],['#74520a','#fff8eb','notice on pale yellow'],
  ['#173b9a','#eaf0ff','status on pale blue'],['#ffffff','#2358eb','white on primary button']
]){
  assert.ok(ratio(foreground,background)>=4.5,`${name} has insufficient measured contrast: ${ratio(foreground,background).toFixed(2)}`);
}
console.log('PASS: static Korean semantics, skip link, live status, focus/tap targets, responsive/reduced-motion rules, six text color pair contrast ratios >=4.5:1; real-device WCAG review still NT');
