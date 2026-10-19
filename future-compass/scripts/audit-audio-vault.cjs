// Uses Chromium's fake microphone to encode real WebM bytes; every Google request is mocked.
// CHROMIUM_PATH=<binary> node future-compass/scripts/audit-audio-vault.cjs [output-dir]
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const output = path.resolve(process.argv[2] || '/tmp/audio-vault-audit'); fs.mkdirSync(output, { recursive: true });
const source = fs.readFileSync(path.resolve(__dirname, '../dist/audio-vault.js'));
const server = http.createServer((req, res) => {
  if (req.url === '/audio-vault.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(source); return; }
  if (req.url === '/.netlify/functions/recording-config') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ configured: true, clientId: 'audit.apps.googleusercontent.com', apiKey: 'audit-public-key', appId: '123456' })); return; }
  res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><meta charset="utf-8"><label>과목<input id="subject" value="수학"></label><label>주제<input id="topic"></label><div id="audio"></div><script src="audio-vault.js"></script><script>window.last=null;window.recorder=FC_AUDIO.mount(document.getElementById("audio"),{subject:()=>document.getElementById("subject").value,topic:()=>document.getElementById("topic").value,onRecord:r=>window.last=r});</script>');
});
let browser;
async function poll(page, fn, arg) {
  const until = Date.now() + 20000;
  do { if (await page.evaluate(fn, arg)) return; await page.waitForTimeout(50); } while (Date.now() < until);
  throw new Error('Timed out waiting for browser data');
}
async function settings(page) { if (!await page.locator('.av-settings').evaluate(el => el.open)) await page.locator('.av-settings > summary').click(); }
async function connect(page) { await settings(page); await page.locator('[data-av-connect]').click(); }

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'], serviceWorkers: 'block', timezoneId: 'Asia/Seoul' });
  let posts = 0, generated = 0, folderCreates = 0, fail = '', pickerOrigin = '', oauthScope = '', requests = [];
  const files = new Map();
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.url().startsWith(origin + '/')) { await route.continue(); return; }
    if (url.hostname !== 'www.googleapis.com') { await route.abort(); return; }
    assert.equal(request.headers().authorization, 'Bearer audit-token'); requests.push({ method: request.method(), path: url.pathname });
    const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.pathname.endsWith('/generateIds')) { await json({ ids: ['file-' + (++generated)] }); return; }
    if (url.pathname.includes('/upload/')) {
      posts++;
      const buf = request.postDataBuffer(), type = request.headers()['content-type'], boundary = type.match(/boundary=(.+)/)[1];
      const first = buf.indexOf('\r\n\r\n') + 4, mid = buf.indexOf('\r\n--' + boundary, first), meta = JSON.parse(buf.subarray(first, mid).toString());
      const audio = buf.indexOf('\r\n\r\n', mid) + 4, end = buf.indexOf('\r\n--' + boundary + '--', audio);
      assert.ok(end > audio); assert.match(meta.mimeType, /^audio\//);
      files.set(meta.id, { ...meta, size: String(end - audio), webViewLink: 'https://drive.google.com/file/d/' + meta.id + '/view' });
      if (fail === 'after') { fail = ''; await route.abort('failed'); return; }
      await json({ id: meta.id }); return;
    }
    if (url.pathname.endsWith('/files') && request.method() === 'GET') { await json({ files: [] }); return; }
    if (url.pathname.endsWith('/files') && request.method() === 'POST') {
      const body = request.postDataJSON(); assert.deepEqual(body.parents, ['root-folder']); assert.equal(body.name, '수학-공통2'); folderCreates++; await json({ id: 'subject-folder' }); return;
    }
    const id = url.pathname.split('/').at(-1);
    if (id === 'root-folder') { await json({ id, name: '1분 복습 녹음', mimeType: 'application/vnd.google-apps.folder', capabilities: { canAddChildren: true }, webViewLink: 'https://drive.google.com/drive/folders/root-folder' }); return; }
    await json(files.get(id) || { error: 'notFound' }, files.has(id) ? 200 : 404);
  });
  await context.addInitScript(() => {
    window.__denied = false;
    class View { setIncludeFolders() { return this; } setSelectFolderEnabled() { return this; } }
    class Picker {
      setAppId() { return this; } setDeveloperKey() { return this; } setOAuthToken() { return this; } setTitle() { return this; } addView() { return this; }
      setOrigin(x) { window.__pickerOrigin = x; return this; } setCallback(fn) { this.callback = fn; return this; } build() { return this; }
      setVisible() { queueMicrotask(() => this.callback({ action: 'picked', docs: [{ id: 'root-folder' }] })); }
    }
    window.google = { accounts: { oauth2: {
      hasGrantedAllScopes: () => !window.__denied,
      initTokenClient: options => { window.__scope = options.scope; return { requestAccessToken: () => options.callback(window.__denied ? { error: 'access_denied' } : { access_token: 'audit-token', expires_in: 3600 }) }; }
    } }, picker: { DocsView: View, ViewId: { FOLDERS: 'folders' }, PickerBuilder: Picker, Action: { PICKED: 'picked', CANCEL: 'cancel' } } };
    window.gapi = { load: (name, callbacks) => callbacks.callback() };
  });
  const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.clock.install({ time: new Date('2026-10-20T07:30:00Z') }); await page.goto(origin); await page.waitForTimeout(200);
  await page.locator('[data-av-record]').click(); assert.match(await page.locator('.av-box').textContent(), /주제를 먼저/);
  await page.locator('#subject').fill('수학/공통2'); await page.locator('#topic').fill('함수: 정의역?');
  await page.locator('[data-av-record]').click(); await page.waitForFunction(() => window.recorder.active()); await page.waitForTimeout(1800);
  await page.waitForFunction(() => !!window.last); const id = await page.evaluate(() => window.last.id);
  const remaining = await page.evaluate(async id => Math.max(0, 60000 - (Date.now() - (await FC_AUDIO.get(id)).at)), id); await page.clock.runFor(remaining + 1); await poll(page, async id => { const r = await FC_AUDIO.get(id); return r && !r.partial && !window.recorder.active(); }, id);
  const original = await page.evaluate(async id => { const r = await FC_AUDIO.get(id); return { name: r.name, size: r.blob.size, duration: r.duration, bytes: Array.from(new Uint8Array(await r.blob.arrayBuffer())) }; }, id);
  assert.match(original.name, /^수학-공통2_함수-정의역_2026-10-20_16-30-\d{2}\.\d{3}_KST\.webm$/); assert.equal(original.duration, 60); assert.ok(original.size > 1000); assert.deepEqual(original.bytes.slice(0, 4), [0x1a, 0x45, 0xdf, 0xa3]);
  assert.equal(posts, 0); fs.writeFileSync(path.join(output, 'encoded-microphone.webm'), Buffer.from(original.bytes));
  await page.reload(); await page.waitForTimeout(200);
  const restored = await page.evaluate(async id => { const r = await FC_AUDIO.get(id); return { name: r.name, size: r.blob.size, uploaded: !!r.uploaded }; }, id);
  assert.deepEqual(restored, { name: original.name, size: original.size, uploaded: false });
  await connect(page); await poll(page, async id => !!(await FC_AUDIO.get(id)).uploaded, id);
  assert.equal(posts, 1); assert.equal(generated, 1); assert.equal(folderCreates, 1); assert.equal(files.get('file-1').name, original.name); assert.equal(Number(files.get('file-1').size), original.size); assert.deepEqual(files.get('file-1').parents, ['subject-folder']);
  oauthScope = await page.evaluate(() => window.__scope); pickerOrigin = await page.evaluate(() => window.__pickerOrigin);
  assert.equal(oauthScope, 'https://www.googleapis.com/auth/drive.file'); assert.equal(pickerOrigin, origin);
  // Simulate a lost upload response after Drive committed the file. Retry must verify the same ID.
  await page.locator('#subject').fill('수학/공통2'); await page.locator('#topic').fill('함수의 예시'); fail = 'after';
  await page.locator('[data-av-file]').setInputFiles({ name: 'input.webm', mimeType: 'audio/webm', buffer: Buffer.from(original.bytes) });
  await poll(page, async first => { return window.last && window.last.id !== first && !!(await FC_AUDIO.get(window.last.id)).error; }, id);
  const second = await page.evaluate(() => window.last.id), beforeRetry = posts;
  await page.reload(); await page.waitForTimeout(200); await connect(page);
  await poll(page, async id => !!(await FC_AUDIO.get(id)).uploaded, second);
  assert.equal(posts, beforeRetry); assert.equal(files.size, 2); assert.equal(generated, 2);
  await page.evaluate(() => { window.__denied = true; }); await connect(page); assert.match(await page.locator('.av-drive-status').textContent(), /완료되지/);
  assert.equal((await page.evaluate(async id => (await FC_AUDIO.get(id)).blob.size, second)), original.size);
  await page.evaluate(() => { window.__getMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError')); });
  await page.locator('#topic').fill('권한 거부'); await page.locator('[data-av-record]').click(); await page.waitForFunction(() => !window.recorder.active()); assert.match(await page.locator('.av-box').textContent(), /마이크를 사용할 수 없어/);
  // A microphone permission result arriving after cancellation must release the stream.
  await page.evaluate(() => { window.__stops = 0; navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { window.__resolveMic = resolve; }); });
  await page.locator('[data-av-record]').click(); await page.evaluate(() => FC_AUDIO.stop());
  await page.evaluate(() => window.__resolveMic({ getTracks: () => [{ stop: () => { window.__stops++; } }] })); assert.equal(await page.evaluate(() => window.__stops), 1);
  assert.equal(await page.evaluate(() => Object.values(localStorage).some(x => x.includes('audit-token'))), false); assert.deepEqual(errors, []);
  const report = { verified: ['real MediaRecorder WebM encoding', '60-second stop and Korean filename/time/extension', 'IndexedDB Blob survives reload', 'per-file OAuth scope + selected folder', 'subject subfolder + exact upload byte count + metadata readback', 'lost-response/reload retry creates no duplicate file', 'OAuth and microphone denial preserve recordings', 'cancelled microphone request releases late stream', 'access token absent from localStorage'], posts, files: files.size, pageErrors: errors, limits: ['Google Identity and Drive APIs mocked; production OAuth client configuration and real account consent still required.'] };
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n'); console.log('PASS: ' + report.verified.join('\nPASS: '));
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
