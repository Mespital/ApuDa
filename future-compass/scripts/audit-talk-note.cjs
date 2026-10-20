// Real app/browser regression audit; external requests and AI sends are blocked.
// NODE_PATH=<playwright location> CHROMIUM_PATH=<binary> node future-compass/scripts/audit-talk-note.cjs [output-dir]
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const dist = path.resolve(__dirname, '../dist'), output = path.resolve(process.argv[2] || '/tmp/one-minute-review-audit');
fs.mkdirSync(output, { recursive: true });
const summary = '## 📌 핵심 정리\n- 함수는 입력에 출력 하나가 대응하는 관계다.\n## 🔑 꼭 알아야 할 용어\n- 정의역: 입력의 집합\n## ⚠️ 확인할 것\n- 공역과 치역의 차이는 교과서로 확인하기\n## ❓ 스스로 확인 질문\n1. 함수란 무엇일까?\n2. 출력이 하나여야 하는 이유는?\n3. 함수가 아닌 관계의 예는?\n## ➡️ 다음 복습\n- 노트를 덮고 답하기';
const questions = ['함수란 무엇일까?', '출력이 하나여야 하는 이유는?', '함수가 아닌 관계의 예는?'];
const server = http.createServer((req, res) => {
  const target = path.resolve(dist, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!target.startsWith(dist + '/') || !fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' })[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
function init({ speech, role, theme }) {
  if (!localStorage.getItem('tn-audit-seeded')) {
    localStorage.clear(); localStorage.setItem('tn-audit-seeded', '1');
    localStorage.setItem('fc-pin-v1', JSON.stringify({ salt: 'audit', hash: 'audit' }));
    sessionStorage.setItem('fc-unlocked-v1', '1'); localStorage.setItem('fc-who-v1', role); localStorage.setItem('fc-theme-v1', theme);
    localStorage.setItem('compass-study-v1', JSON.stringify({ table: Array.from({ length: 5 }, () => ['수학', '과학', '영어']), tasks: [], dates: [], reviews: [], sessions: {}, timer: { duration: 1500, remaining: 1500, end: 0 } }));
    localStorage.setItem('fc_planner_v1', JSON.stringify({ share: { review: true } }));
  }
  window.__clip = { text: '', reads: 0, writes: 0, denyRead: false, denyWrite: false, legacy: false };
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: text => { window.__clip.writes++; if (window.__clip.denyWrite) return Promise.reject(new Error('denied')); window.__clip.text = text; return Promise.resolve(); },
    readText: () => { window.__clip.reads++; if (window.__clip.defer) return new Promise(resolve => { window.__clip.resolve = resolve; }); return window.__clip.denyRead ? Promise.reject(new Error('denied')) : Promise.resolve(window.__clip.text); }
  } });
  const originalCommand = document.execCommand.bind(document);
  document.execCommand = command => command === 'copy' ? window.__clip.legacy : originalCommand(command);
  window.__visible = 'visible'; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__visible });
  window.__speech = [];
  class Speech {
    constructor() { window.__speech.push(this); this.stops = 0; }
    start() { queueMicrotask(() => { if (this.onstart) this.onstart(); }); }
    stop() { this.stops++; if (this.onend) this.onend(); }
    result(parts) { if (this.onresult) this.onresult({ results: parts.map(([transcript, isFinal]) => Object.assign([{ transcript }], { isFinal })) }); }
    end() { if (this.onend) this.onend(); }
    error(error) { if (this.onerror) this.onerror({ error }); }
  }
  Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: speech ? Speech : undefined });
  Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: undefined });
}
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port, errors = [], results = [];
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'] });
  async function fresh(options = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, timezoneId: 'Asia/Seoul', reducedMotion: 'reduce', serviceWorkers: 'block', ...options.browser });
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.request().isNavigationRequest() && route.request().url().startsWith('https://chatgpt.com/') ? route.fulfill({ contentType: 'text/html', body: '<p>ChatGPT navigation intercepted for audit</p>' }) : route.abort());
    await context.addInitScript(init, { speech: !!options.speech, role: options.role || 'child', theme: options.theme || 'light' });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
    await page.clock.install({ time: new Date('2026-10-20T07:30:00Z') });
    await page.goto(origin + '/study.html'); await page.waitForTimeout(2000);
    return { context, page };
  }
  async function legacy(page) { if (await page.locator('.tn-manual').count() && !(await page.locator('.tn-manual').getAttribute('open') === '')) await page.locator('.tn-manual > summary').click(); }
  async function open(page) { await page.locator('[data-tn-open=talk]').click(); await page.locator('.tn-sheet').waitFor(); await legacy(page); }
  async function local(page) { await page.locator('.tn-local > summary').click(); }
  async function storage(page, key) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
  async function showReview(page, rid) {
    await page.evaluate(() => { tab = 'review'; render(); });
    await page.locator('[data-rc-open="' + rid + '"]').first().click();
    assert.deepEqual(await page.locator('.rc-qs li').allTextContents(), questions);
    await page.locator('[data-rc-show]').click();
    const answer = await page.locator('.rc-ans pre').textContent(); assert.match(answer, /정의역/); assert.doesNotMatch(answer, /교과서로 확인|스스로 확인|함수란 무엇/);
  }
  {
    const { context, page } = await fresh(); await open(page);
    assert.equal(await page.locator('[data-tn-mic]').count(), 0);
    // Skipping copy prepares the full request without leaving the app.
    await page.locator('[data-tn-gpt]').click();
    assert.match(await page.locator('.tn-transfer-status').textContent(), /전체를 복사/);
    const request = await page.evaluate(() => window.__clip.text); assert.match(request, /다음 메시지로 내용을 받을 때까지/);
    const popupPromise = page.waitForEvent('popup'); await page.locator('[data-tn-gpt]').click(); const popup = await popupPromise; await popup.close();
    assert.equal((await storage(page, 'fc-tn-draft')).gpt, 1);
    await page.reload(); await page.waitForTimeout(2000); await legacy(page);
    assert.equal(await page.locator('.tn-sheet').count(), 1); assert.equal(await page.locator('.tn-text').inputValue(), '');
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    assert.equal(await page.evaluate(() => window.__clip.reads), 0);
    await page.evaluate(text => { window.__clip.text = text; }, request); await page.locator('[data-tn-paste]').click();
    assert.equal(await page.locator('.tn-sum').inputValue(), '');
    await page.evaluate(text => { window.__clip.text = text; }, summary); await page.locator('[data-tn-paste]').click();
    assert.equal(await page.locator('.tn-sum').inputValue(), summary);
    await page.locator('[data-tn-save]').click();
    const notes = await storage(page, 'fc_notes_v1'), state = await storage(page, 'compass-study-v1'), plan = await storage(page, 'fc_planner_v1');
    assert.equal(notes.length, 1); assert.equal(notes[0].sum, summary); assert.equal(state.reviews.length, 1); assert.equal(notes[0].review, state.reviews[0].id);
    assert.deepEqual(plan.again[notes[0].review], ['2026-10-21', '2026-10-23', '2026-10-27']);
    assert.equal(await storage(page, 'fc-tn-draft'), null); await showReview(page, notes[0].review);
    await context.close(); results.push('empty transcript → full prompt → app handoff → reload recovery → explicit paste → note/review/dates/questions');
  }
  {
    const { context, page } = await fresh(); await open(page); await local(page);
    const text = '함수의 입력과 출력 관계를 복습한다. '.repeat(70).slice(0, 1494) + '마지막문장';
    await page.locator('.tn-text').fill(text); await page.locator('.tn-sub-other').fill('공통수학2');
    await page.locator('[data-tn-day="3"]').uncheck(); await page.locator('[data-tn-day="7"]').uncheck();
    await page.evaluate(() => localStorage.setItem('fc-gpt-url', 'https://chatgpt.com/g/g-study-test?old=yes#old'));
    await page.locator('[data-tn-copy]').click();
    assert.ok((await page.evaluate(() => window.__clip.text)).endsWith(text));
    assert.equal(await page.locator('[data-tn-gpt]').getAttribute('href'), 'https://chatgpt.com/');
    await page.evaluate(() => { window.__clip.denyWrite = true; }); await page.locator('[data-tn-copy]').click();
    assert.equal(await page.locator('.tn-request').getAttribute('open'), ''); assert.match(await page.locator('.tn-transfer-status').textContent(), /못 했어/);
    assert.ok((await page.locator('.tn-prompt').inputValue()).endsWith(text));
    await page.reload(); await page.waitForTimeout(2000); await legacy(page);
    assert.equal(await page.locator('.tn-text').inputValue(), text); assert.equal(await page.locator('.tn-sub-other').inputValue(), '공통수학2');
    assert.equal(await page.locator('[data-tn-day="3"]').isChecked(), false); assert.equal(await page.locator('[data-tn-day="7"]').isChecked(), false);
    await page.evaluate(() => { window.__clip.denyRead = true; }); await page.locator('[data-tn-paste]').click(); assert.equal(await page.locator('.tn-sum').inputValue(), '');
    await page.evaluate(() => { window.__clip.denyRead = false; window.__clip.text = '가'.repeat(2001); }); await page.locator('[data-tn-paste]').click(); assert.equal(await page.locator('.tn-sum').inputValue(), '');
    await page.locator('.tn-sum').fill('작성 중인 정리');
    await page.evaluate(() => { window.__clip.defer = true; }); await page.locator('[data-tn-paste]').click();
    await page.locator('.tn-sum').fill('새로 작성한 정리'); await page.evaluate(text => window.__clip.resolve(text), summary);
    assert.equal(await page.locator('.tn-sum').inputValue(), '새로 작성한 정리');
    // A failed write must leave the draft and both persistent lists intact.
    await page.evaluate(() => { window.__setItem = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'fc_notes_v1') throw new DOMException('quota', 'QuotaExceededError'); return window.__setItem.call(this, k, v); }; });
    await page.locator('[data-tn-save]').click(); assert.equal(await page.locator('.tn-sheet').count(), 1); assert.equal((await storage(page, 'compass-study-v1')).reviews.length, 0);
    await page.evaluate(() => { Storage.prototype.setItem = window.__setItem; }); await page.locator('[data-tn-save]').click();
    const note = (await storage(page, 'fc_notes_v1'))[0]; assert.deepEqual((await storage(page, 'fc_planner_v1')).again[note.review], ['2026-10-21']);
    await context.close(); results.push('1,500-character prompt, general Chat bypasses custom GPT, clipboard failures, manual fallback, changed-input race, selected dates, quota retry');
  }
  {
    const { context, page } = await fresh({ speech: true }); await open(page); await local(page);
    await page.locator('[data-tn-mic]').click();
    await page.evaluate(() => window.__speech.at(-1).result([['함수는', true], ['함수는 입력에 출력 하나가 대응해', true], ['예시는 예시는', false]]));
    assert.equal(await page.locator('.tn-text').inputValue(), '함수는 입력에 출력 하나가 대응해 예시는 예시는');
    await page.evaluate(() => window.__speech.at(-1).end()); await page.clock.fastForward(300);
    await page.evaluate(() => window.__speech.at(-1).result([['정의역이 헷갈렸어', true]]));
    assert.match(await page.locator('.tn-text').inputValue(), /예시는 예시는 정의역이 헷갈렸어$/);
    await page.clock.fastForward(60000); assert.equal(await page.locator('[data-tn-mic]').getAttribute('aria-pressed'), 'false'); assert.match(await page.locator('.tn-live').textContent(), /1분 끝/);
    await page.locator('[data-tn-mic]').click(); await page.evaluate(() => window.__speech.at(-1).error('not-allowed'));
    assert.match(await page.locator('.tn-live').textContent(), /마이크 권한/); assert.equal(await page.locator('.tn-text').getAttribute('readonly'), null);
    await page.locator('[data-tn-mic]').click(); await page.evaluate(() => { window.__visible = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.locator('[data-tn-mic]').getAttribute('aria-pressed'), 'false'); assert.equal(await page.evaluate(() => window.__clip.reads), 0);
    await context.close(); results.push('dictation interim/final/cumulative results, recognition restart, intentional repetition, 60-second stop, permission failure, background stop');
  }
  {
    const { context, page } = await fresh({ browser: { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36' } });
    const links = await page.evaluate(() => ({ short: SHIRO_AI.rawHref('짧은 요청'), long: SHIRO_AI.rawHref('가'.repeat(2000)), chat: SHIRO_AI.chatHref('짧은 요청') }));
    assert.match(links.short, /^intent:\/\//); assert.match(links.short, /package=com.openai.chatgpt/);
    assert.ok(decodeURIComponent(links.short).includes('q=짧은 요청')); assert.ok(!links.long.includes('?q=')); assert.ok(links.chat.startsWith('https://chatgpt.com/')); assert.ok(!links.chat.startsWith('intent:'));
    await context.close(); results.push('Android app intent and complete web fallback (long prompt uses full clipboard)');
  }
  {
    const { context, page } = await fresh(); await open(page);
    await page.locator('.tn-topic').fill('함수의 뜻');
    await page.locator('.av-settings > summary').click();
    await page.locator('[data-av-file]').setInputFiles({ name: 'voice.webm', mimeType: 'audio/webm', buffer: fs.readFileSync(process.env.AUDIO_FIXTURE || '/tmp/audio-vault-audit/encoded-microphone.webm') });
    await page.waitForFunction(() => { const d=JSON.parse(localStorage.getItem('fc-tn-draft')); return d && d.audioId; });
    await page.locator('.tn-sum').fill(summary); await page.locator('[data-tn-save]').click();
    const note=(await storage(page,'fc_notes_v1'))[0]; assert.equal(note.topic,'함수의 뜻'); assert.ok(note.audio.name.startsWith('수학_함수의-뜻_'));
    assert.ok(await page.evaluate(async id=>(await FC_AUDIO.get(id)).blob.size>0,note.audio.id));
    await page.evaluate(()=>{tab='review';render();});
    await page.locator('[data-tn-listen]').click();
    assert.equal(await page.locator('[aria-label="녹음 원본"] audio').count(),1); assert.equal(await page.locator('[aria-label="녹음 원본"] a[download]').getAttribute('download'),note.audio.name);
    await page.locator('[data-av-close]').click();
    await page.evaluate(()=>{ window.__zipFiles={}; window.JSZip=class {file(name,body){window.__zipFiles[name]=body;} generateAsync(){return Promise.resolve(new Blob(['audit zip']));} }; });
    const download=page.waitForEvent('download'); await page.locator('[data-tn-export]').click(); await download;
    const exported=await page.evaluate(()=>Object.values(window.__zipFiles).join('\n')); assert.ok(exported.includes(summary)); assert.ok(exported.includes(note.audio.name));
    await context.close(); results.push('recording import → note/audio metadata → original playback/download → summary and recording reference in Markdown export');
  }
  for (const width of [360, 390, 820, 1180]) for (const theme of ['light', 'dark']) {
    const { context, page } = await fresh({ theme, speech: true, browser: { viewport: { width, height: 844 } } }); await open(page);
    for (const expanded of [false, true]) {
      if (expanded) await local(page); else await page.locator('.av-settings > summary').click();
      const measured = await page.locator('.tn-sheet').evaluate(root => {
        const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
        const controls = [...root.querySelectorAll('button,a,summary,label:has(input[type=checkbox]),input:not([type=checkbox])')].filter(visible);
        return { overflow: root.querySelector('.tn-panel').scrollWidth > root.querySelector('.tn-panel').clientWidth, small: controls.filter(el => el.getBoundingClientRect().height < 43.9).map(el => el.textContent || el.outerHTML), tiny: [...root.querySelectorAll('*')].filter(visible).filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12.5).map(el => el.textContent) };
      });
      assert.deepEqual(measured, { overflow: false, small: [], tiny: [] }, JSON.stringify({ width, theme, expanded, measured }));
      await page.screenshot({ path: path.join(output, `${width}-${theme}-${expanded ? 'dictation' : 'chatgpt'}.png`) });
    }
    await page.locator('[data-tn-gpt]').scrollIntoViewIfNeeded(); await page.screenshot({path:path.join(output,`${width}-${theme}-handoff.png`)});
    await page.locator('[data-tn-close]').focus(); await page.keyboard.press('Shift+Tab'); assert.equal(await page.locator('[data-tn-save]').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Tab'); assert.equal(await page.locator('[data-tn-close]').evaluate(el => el === document.activeElement), true);
    await context.close();
  }
  for (const role of ['parent', 'locked']) {
    const { context, page } = await fresh({ role: role === 'locked' ? 'child' : role });
    await page.evaluate(role => { localStorage.setItem('fc-tn-draft', JSON.stringify({ kind: 'talk', at: Date.now(), text: '비공개 임시 노트', gpt: 1 })); if (role === 'locked') document.documentElement.classList.add('pin-locked'); document.dispatchEvent(new Event('visibilitychange')); }, role);
    assert.equal(await page.locator('.tn-sheet').count(), 0); await context.close();
  }
  assert.deepEqual(errors, []); results.push('16 responsive/theme states: no horizontal overflow, text ≥12.5px, controls ≥44px, focus trap; parent/locked draft guard');
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ passed: results, pageErrors: errors }, null, 2) + '\n');
  console.log('PASS: ' + results.join('\nPASS: '));
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
