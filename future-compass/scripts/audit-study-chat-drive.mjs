// Real site + real HTTP handoff handler + real MediaRecorder; Drive is a local fixture.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { makeHandler } from '../netlify/lib/study-handoff-core.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), output = path.resolve(process.argv[2] || '/tmp/study-chat-drive-audit');
fs.mkdirSync(output, { recursive: true });
const rows = new Map(), drive = new Map(), calls = [], errors = [], results = [];
const store = { async get(k) { return rows.has(k) ? structuredClone(rows.get(k)) : null; }, async setJSON(k, v, o = {}) { if (o.onlyIfNew && rows.has(k)) return { modified: false }; rows.set(k, structuredClone(v)); return { modified: true }; }, async delete(k) { rows.delete(k); } };
const handler = makeHandler(() => store);
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://' + req.headers.host);
    if (u.pathname === '/.netlify/functions/study-handoff') {
      calls.push({ method: req.method, mode: u.searchParams.get('mode') });
      const bytes = []; for await (const b of req) bytes.push(b);
      const r = await handler(new Request(u.href, { method: req.method, headers: req.headers, ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Buffer.concat(bytes) }) }));
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    if (u.pathname === '/.netlify/functions/recording-config') { res.setHeader('content-type', 'application/json'); res.end('{"configured":false}'); return; }
    const f = path.resolve(root, 'dist', '.' + u.pathname);
    if (!f.startsWith(path.join(root, 'dist') + '/') || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
    res.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' })[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
  } catch (e) { errors.push(String(e)); res.writeHead(500); res.end(); }
});
const summary = '📌 핵심 정리\n- 함수는 입력에 출력 하나가 대응하는 관계다.\n🔑 꼭 알아야 할 용어\n- 정의역: 입력의 집합\n⚠️ 확인할 것\n- 공역과 치역을 교과서로 확인하기\n❓ 스스로 확인 질문\n- 함수란?\n- 출력이 하나여야 하는 이유는?\n- 함수가 아닌 예는?\n➡️ 다음 복습\n- 노트를 덮고 답하기';
const sha = b => createHash('sha256').update(b).digest('hex');
let browser, origin;
async function wait(page, fn) { for (let n = 0; n < 120; n++) { const r = await page.evaluate(fn); if (r) return r; await page.waitForTimeout(100); } throw Error('browser condition timed out: ' + fn); }
async function jobs(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('fc-chat-drive-v1') || '[]')); }
async function actor(j, isBackup = false) {
  const response = await fetch(j.url); assert.equal(response.status, 200); const m = await response.json(), files = [];
  for (const f of m.files) {
    const r = await fetch(f.url); assert.equal(r.status, 200); const bytes = Buffer.from(await r.arrayBuffer()); assert.equal(bytes.length, f.size); assert.equal(sha(bytes), f.sha256);
    if (f.role === 'audio') { assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3'); fs.writeFileSync(path.join(output, 'recording.webm'), bytes); }
    let old = [...drive.values()].find(x => x.name === f.name && x.sha256 === f.sha256);
    if (!old) { const id = 'fixture_drive_' + (drive.size + 1); old = { ...f, id, parentId: 'fixture_subject_folder', url: 'https://drive.google.com/file/d/' + id + '/view' }; drive.set(id, old); }
    files.push({ role: f.role, name: f.name, size: f.size, sha256: f.sha256, id: old.id, parentId: old.parentId, url: old.url });
  }
  if (m.reviewFile) { const id = 'fixture_review_' + (drive.size + 1), f = {role:'review',name:m.reviewFile.name,size:Buffer.byteLength(summary),sha256:sha(Buffer.from(summary)),id,parentId:'fixture_subject_folder',url:'https://drive.google.com/file/d/'+id+'/view'};drive.set(id,f);files.push(f); }
  const r = await fetch(m.receipt.url, { method: 'POST', headers: { authorization: 'Bearer ' + m.receipt.bearer, 'content-type': 'application/json' }, body: JSON.stringify({ verified: true, summary: isBackup ? '' : summary, files }) }); assert.equal(r.status, 200); assert.equal((await r.json()).ok, true); return m;
}
async function fresh({ theme = 'light', width = 390, role = 'child', share = true, queue = [] } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, reducedMotion: 'reduce', timezoneId: 'Asia/Seoul', serviceWorkers: 'block', permissions: ['microphone'] });
  await context.route('**/*', r => r.request().url().startsWith(origin + '/') ? r.continue() : r.request().isNavigationRequest() && r.request().url().startsWith('https://chatgpt.com/') ? r.fulfill({ body: 'ChatGPT navigation intercepted' }) : r.abort());
  await context.addInitScript(({ theme, role, share, queue }) => {
    if (!localStorage.getItem('cd-audit')) {
      localStorage.clear(); localStorage.setItem('cd-audit', '1'); localStorage.setItem('fc-pin-v1', '{"salt":"test","hash":"test"}'); sessionStorage.setItem('fc-unlocked-v1', '1'); localStorage.setItem('fc-who-v1', role); localStorage.setItem('fc-theme-v1', theme);
      localStorage.setItem('compass-study-v1', JSON.stringify({ table: Array.from({ length: 5 }, () => ['수학', '과학', '영어', '', '', '', '']), bags: ['', '', '', '', ''], tasks: [], dates: [], reviews: [], sessions: {}, timer: { duration: 1500, remaining: 1500, end: 0 } }));
      localStorage.setItem('fc_planner_v1', JSON.stringify({ share: { review: share } })); localStorage.setItem('fc-chat-drive-v1', JSON.stringify(queue));
      localStorage.setItem('fc_guard_v1', '{"phone":"PRIVATE_CONTACT_SENTINEL"}'); localStorage.setItem('fc_teachers_v1', '{"phone":"PRIVATE_CONTACT_SENTINEL"}');
    }
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined }); Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: s => { window.__copied = s; return window.__denyCopy ? Promise.reject(Error('denied')) : Promise.resolve(); } } }); document.execCommand = () => false;
  }, { theme, role, share, queue });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.goto(origin + '/study.html'); await page.waitForTimeout(2000); return { page, context };
}
async function note(page, recording = false) {
  await page.locator('[data-tn-open=talk]').click(); await page.locator('.tn-topic').fill('함수의 뜻'); await page.locator('.tn-local > summary').click(); await page.locator('.tn-text').fill('함수는 입력에 출력 하나가 대응하는 관계라고 배웠다. 정의역과 공역이 헷갈린다.');
  if (recording) { await page.locator('[data-av-record]').click(); await wait(page, () => document.querySelector('[data-av-record]').getAttribute('aria-pressed') === 'true'); await page.waitForTimeout(1500); }
  await page.locator('[data-tn-cloud-new]').click(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1') || '[]').some(j => j.prepared || j.error));
  return (await jobs(page)).at(-1);
}
try {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  {
    const { page, context } = await fresh(), j = await note(page, true); assert.equal(j.prepared, true);
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('fc_notes_v1')))).length, 1);
    await page.locator('[data-cd-copy]').click(); assert.match(await page.evaluate(() => window.__copied), /Google Drive MCP/); assert.match(await page.evaluate(() => window.__copied), /receipt.url/);
    const href = await page.locator('[data-cd-chat]').getAttribute('href'); assert.ok(href.startsWith('https://chatgpt.com/')); assert.ok(!href.includes('/g/'));
    const popupEvent = page.waitForEvent('popup'); await page.locator('[data-cd-chat]').click(); const popup = await popupEvent; await popup.close();
    assert.equal((await jobs(page))[0].applied, undefined); // Opening ChatGPT is not a save receipt.
    const m = await actor(j); assert.equal(m.files.length, 3); assert.ok(m.files.some(f => f.role === 'audio'));
    await page.reload(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[0].applied);
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem('fc_notes_v1'))[0]); assert.equal(n.sum, summary); assert.ok(n.audio.driveUrl.includes('drive.google.com')); assert.equal(await page.evaluate(() => state.reviews[0].note), summary.slice(0, 800));
    assert.equal((await page.evaluate(() => FC_PLANNER.get().again[JSON.parse(localStorage.getItem('fc_notes_v1'))[0].review])).length, 3);
    await wait(page, async () => { const n = JSON.parse(localStorage.getItem('fc_notes_v1'))[0]; return (await FC_AUDIO.get(n.audio.id)).uploaded; });
    await page.reload(); await page.waitForTimeout(2000); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('fc_notes_v1')).length), 1); assert.equal(await page.evaluate(() => state.reviews.length), 1);
    await page.evaluate(() => { tab = 'review'; render(); }); await page.screenshot({ path: path.join(output, '390-light-result.png'), fullPage: true });
    // A local edit while ChatGPT is working must survive until explicit apply.
    await page.locator('[data-tn-cloud]').first().click(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1')).length === 2 && JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[1].prepared);
    const second = (await jobs(page))[1];
    await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('fc_notes_v1')); a[0].sum = '내가 다시 고친 정리'; localStorage.setItem('fc_notes_v1', JSON.stringify(a)); });
    await actor(second); await page.reload(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[1].conflict);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('fc_notes_v1'))[0].sum), '내가 다시 고친 정리');
    await page.evaluate(() => { tab = 'review'; render(); }); await page.locator('[data-cd-apply]').click(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[1].applied); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('fc_notes_v1'))[0].sum), summary);
    await context.close(); results.push('recording + notes → real HTTP files → validated receipt → reload → note/review/audio links; edit conflict requires explicit apply');
  }
  {
    const { page, context } = await fresh(); let drop = true;
    await page.route('**/.netlify/functions/study-handoff?mode=create', async r => { if (drop) { await r.fetch(); drop = false; await r.abort(); } else await r.continue(); });
    const j = await note(page); assert.ok(j.error); assert.ok(!j.prepared); assert.equal(await page.locator('[data-cd-chat]').count(), 0);
    await page.locator('[data-cd-check]').click(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[0].prepared);
    const before = rows.size; await actor((await jobs(page))[0]); await page.reload(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[0].applied); assert.equal(rows.size, before + 1);
    await context.close(); results.push('lost create response recovered by per-job status without another upload');
  }
  {
    const { page, context } = await fresh(); await page.evaluate(() => { tab = 'settings'; render(); }); await page.locator('[data-cd-backup]').click(); await page.locator('[data-cd-backup-confirm]').click();
    await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[0]?.prepared); const j = (await jobs(page))[0], m = await actor(j, true);
    assert.equal(m.files.length, 1); const b = await (await fetch(m.files[0].url)).text(); assert.ok(!b.includes('PRIVATE_CONTACT_SENTINEL')); assert.equal(JSON.parse(b).app, 'future-compass-study');
    await page.reload(); await wait(page, () => JSON.parse(localStorage.getItem('fc-chat-drive-v1'))[0].applied); assert.equal(await page.evaluate(() => state.reviews.length), 0);
    await context.close(); results.push('explicit backup excludes contact/location/auth settings and preserves original restore format');
  }
  {
    const queue = [{ id: 'a'.repeat(32), ownerKey: 'b'.repeat(64), expiresAt: Date.now() + 3600000, subject: '수학', topic: '비공개' }], before = calls.length;
    const { page, context } = await fresh({ role: 'parent', share: false, queue }); await page.evaluate(() => { tab = 'review'; render(); }); assert.equal(await page.locator('.cd-panel').count(), 0); assert.equal(calls.length, before); await context.close();
    const locked = await fresh(); await locked.page.evaluate(() => { tab = 'settings'; render(); }); await locked.page.locator('[data-cd-backup]').click(); await locked.page.evaluate(() => document.documentElement.classList.add('pin-locked')); await locked.page.waitForTimeout(100); assert.equal(await locked.page.locator('.cd-dialog').getAttribute('open'), null); await locked.context.close();
    results.push('parent sharing gate and immediate close on PIN lock');
  }
  for (const theme of ['light', 'dark']) for (const width of [360, 390, 820, 1180]) {
    const { page, context } = await fresh({ theme, width }); await note(page);
    const m = await page.locator('.cd-dialog').evaluate(el => ({ overflow: el.scrollWidth > el.clientWidth + 1, short: [...el.querySelectorAll('button,a,summary')].filter(x => x.getClientRects().length && x.getBoundingClientRect().height < 43.5).length })); assert.deepEqual(m, { overflow: false, short: 0 });
    const contrast = await page.locator('.cd-dialog').evaluate(el => { const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};const s=getComputedStyle(el),a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}); assert.ok(contrast>=4.5,theme+' dialog contrast '+contrast);
    await page.locator('[data-cd-copy]').click(); await page.evaluate(() => { window.__denyCopy = true; }); await page.locator('[data-cd-copy]').click(); assert.equal(await page.locator('.cd-dialog details').getAttribute('open'), '');
    await page.screenshot({ path: path.join(output, width + '-' + theme + '-handoff.png') }); await context.close();
  }
  results.push('360/390/820/1180 × light/dark: handoff dialog, 44px controls, no horizontal overflow, complete clipboard fallback');
  assert.deepEqual(errors, []); fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ results, pageErrors: errors, jobs: [...rows.keys()].filter(k => k.startsWith('job-')).length, driveFixtureFiles: drive.size }, null, 2)); console.log(JSON.stringify({ results, pageErrors: errors, output }));
} finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
