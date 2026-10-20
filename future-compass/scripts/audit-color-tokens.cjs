const fs = require('fs');
const path = require('path');
// Optional visual audit; uses an installed Playwright, without changing app dependencies.
const { chromium } = require(process.env.C1_PLAYWRIGHT_MODULE || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright'));
const stage = process.argv[2] || 'before';
const widths = process.argv[3] ? process.argv[3].split(',').map(Number) : [390];
const output = process.env.C1_AUDIT_DIR || path.join(process.cwd(), 'artifacts', 'color-tokens', stage);
const auditFont = process.env.C1_AUDIT_FONT || '';
fs.mkdirSync(output, { recursive: true });
const tabs = ['today', 'week', 'school', 'grades', 'examplan', 'review', 'stats', 'settings', 'books', 'dates'];
function seed({ role, theme }) {
  const date = '2026-10-20';
  localStorage.clear();
  localStorage.setItem('fc-pin-v1', JSON.stringify({ salt: 'visual-fixture', hash: 'visual-fixture' }));
  sessionStorage.setItem('fc-unlocked-v1', '1');
  localStorage.setItem('fc-who-v1', role);
  localStorage.setItem('fc-theme-v1', theme);
  localStorage.setItem('compass-study-v1', JSON.stringify({
    table: Array.from({ length: 5 }, () => ['공통국어2', '공통수학2', '공통영어2', '통합사회2', '통합과학2', '한국사2', '체육2']),
    bags: ['교과서', '체육복과 과학 준비물', '교과서', '', ''],
    tasks: [
      { id: 'qa-math', title: '수학 문제 3개 풀기', date, subject: '수학', done: false },
      { id: 'qa-eng', title: '영어 단어 다시 보기', date, subject: '영어', done: false },
      { id: 'qa-kor', title: '국어 읽은 내용 정리', date, subject: '국어', done: true }
    ],
    dates: [
      { id: 'qa-exam', title: '수학 단원 시험', date: '2026-10-22', subject: '수학', kind: '시험', done: false },
      { id: 'qa-due', title: '과학 탐구 보고서', date: '2026-10-21', subject: '과학', kind: '수행평가', done: false },
      { id: 'qa-late', title: '사회 기사 정리', date: '2026-10-19', subject: '사회', kind: '과제', done: false }
    ],
    reviews: [
      { id: 'qa-review', title: '함수의 대칭을 설명할 수 있을까?', subject: '수학', date, note: '그래프를 직접 그려보기', done: false },
      { id: 'qa-review2', title: '세포 소기관의 역할', subject: '과학', date: '2026-10-19', note: '그림으로 다시 정리', done: false }
    ],
    sessions: { '2026-10-19': 2, [date]: 1 },
    timer: { duration: 1500, remaining: 1500, end: 0 }
  }));
  localStorage.setItem('fc_planner_v1', JSON.stringify({
    mission: '오늘 작은 일 하나 끝내기', goals: ['매일 복습 10분'],
    share: { flow: true, exams: true, review: true, questions: true, reflect: true, mission: true, grades: true },
    pri: { 'qa-math': { p: 'A', est: 25 }, 'qa-eng': { p: 'B', est: 15 }, 'qa-kor': { p: 'C', est: 10 } },
    focus: [{ date, min: 25, subject: '수학', at: Date.now() - 3600000 }],
    examDays: { '2026-10-22': ['수학', '영어'] }
  }));
  localStorage.setItem('fc_academy_v1', JSON.stringify([{ id: 'qa-academy', name: '수학 학원', subject: '수학', days: [2, 4], start: '18:00', end: '22:00', homework: '오답 3문제', addr: '서울 서초구', tel: '02-0000-0000', book: '공통수학2', progress: '유리함수' }]));
  localStorage.setItem('fc_life_v1', JSON.stringify({ items: [{ id: 'qa-life', title: '저녁 식사', icon: '🍚', days: [0, 1, 2, 3, 4, 5, 6], start: '17:00', end: '17:30' }] }));
  localStorage.setItem('fc_notes_v1', JSON.stringify([{ id: 'qa-note', date, subject: '수학', text: '함수의 대칭을 복습했다.', sum: '그래프의 대칭을 직접 설명한다.', at: Date.now() - 100000 }]));
  localStorage.setItem('fc_mom_v1', JSON.stringify({ items: [{ id: 'qa-mom', title: '학원 상담 전화', due: date, done: false }] }));
}
function measure() {
  const colors = new Set(), common = new Set(), backgrounds = new Set(), shadows = new Set(), sizes = new Set(), radii = new Set();
  const colorNodes = {}, shadowNodes = {}, contrast = [];
  let small = 0, smallTouch = 0;
  const visible = el => {
    const st = getComputedStyle(el), r = el.getBoundingClientRect();
    if (!r.width || !r.height || st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) return false;
    for (let p = el; p; p = p.parentElement) if (p.tagName === 'DETAILS' && !p.open && !p.querySelector(':scope > summary')?.contains(el)) return false;
    return true;
  };
  const nodes = [...document.querySelectorAll('body *')].filter(visible);
  const label = el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().replace(/\s+/g, '.') : ''}`;
  const hasText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
  function rgb(s) { const a = s.match(/[\d.]+/g)?.map(Number); if (a && s.startsWith('color(srgb ')) for (let i = 0; i < 3; i++) a[i] *= 255; return a && a.length >= 3 ? a : null; }
  function blend(a, b) { const alpha = a[3] ?? 1; return a.slice(0, 3).map((v, i) => v * alpha + b[i] * (1 - alpha)); }
  function background(el) {
    if (!el) return [255, 255, 255];
    const st = getComputedStyle(el);
    if (st.backgroundImage !== 'none') return null;
    const c = rgb(st.backgroundColor);
    if (c && (c[3] ?? 1) === 1) return c.slice(0, 3);
    const parent = background(el.parentElement);
    return parent && c ? blend(c, parent) : parent;
  }
  const lum = c => c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  for (const el of nodes) {
    const st = getComputedStyle(el);
    if (st.backgroundColor !== 'rgba(0, 0, 0, 0)') backgrounds.add(st.backgroundColor);
    if (st.boxShadow !== 'none') { shadows.add(st.boxShadow); (shadowNodes[st.boxShadow] ??= []).push(label(el)); }
    if (st.borderRadius !== '0px') radii.add(st.borderRadius);
    if (hasText(el)) {
      colors.add(st.color); sizes.add(st.fontSize);
      (colorNodes[st.color] ??= []).push(label(el) + ': ' + el.textContent.trim().slice(0, 45));
      if (!el.closest('.sl-sub[data-sub],.nx-map,.nx-n,.rt-legs button')) common.add(st.color);
      if (parseFloat(st.fontSize) < 12.5) small++;
      if (!el.closest('svg,.hb,.fm,.tbk-reader') && !el.disabled && !/[😀-🙏☀-⛿]/u.test(el.textContent.trim().replace(/[\p{L}\p{N}\p{P}\p{Z}\p{S}]/gu, ''))) {
        const bg = background(el), fg = rgb(st.color);
        if (bg && fg && (fg[3] ?? 1) > .99) {
          const a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          const large = parseFloat(st.fontSize) >= 24 || (parseFloat(st.fontSize) >= 18.66 && +st.fontWeight >= 700);
          if (ratio < (large ? 3 : 4.5) - .01) contrast.push({ el: label(el), text: el.textContent.trim().slice(0, 45), fg: st.color, bg, ratio: +ratio.toFixed(2) });
        }
      }
    }
    if (el.matches('button,input,select,textarea,a[href],summary,[role=button]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) smallTouch++;
    }
  }
  return { colors: colors.size, commonColors: common.size, backgrounds: backgrounds.size, shadows: shadows.size, sizes: sizes.size, radii: radii.size, small, smallTouch, height: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth + 1, colorNodes, shadowNodes, contrast };
}
module.exports = { seed, measure };
if (require.main === module) (async () => {
  const dist = process.env.C1_DIST || path.resolve(__dirname, '../dist');
  const server = require('http').createServer((req, res) => {
    if (auditFont && req.url === '/qa-font.woff2') { res.writeHead(200, { 'Content-Type': 'font/woff2' }); fs.createReadStream(auditFont).pipe(res); return; }
    const target = path.resolve(dist, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!target.startsWith(dist + '/') || !fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404); res.end(); return; }
    const type = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(target)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(target).pipe(res);
  });
  await new Promise(resolve => server.listen(8765, '127.0.0.1', resolve));
  const browser = await chromium.launch({ ...(process.env.C1_CHROMIUM ? { executablePath: process.env.C1_CHROMIUM } : {}), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'] });
  const results = [];
  for (const width of widths) for (const role of ['child', 'parent']) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1180 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:8765/') ? r.continue() : r.abort());
    await context.addInitScript(seed, { role, theme });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-20T07:30:00Z') });
    await page.goto('http://127.0.0.1:8765/study.html', { waitUntil: 'load' });
    if (auditFont) await page.addStyleTag({content:'@font-face{font-family:Pretendard;src:url(/qa-font.woff2) format("woff2");font-weight:100 900;font-style:normal;font-display:block}'});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    for (const tabName of tabs) {
      await page.evaluate(t => { tab = t; render(); scrollTo(0, 0); }, tabName);
      await page.waitForTimeout(100);
      await page.evaluate(() => document.fonts.ready);
      const data = await page.evaluate(measure);
      await page.screenshot({ path: path.join(output, `${width}-${role}-${theme}-${tabName}.png`), fullPage: true });
      results.push({ width, role, theme, tab: tabName, ...data, errors: [...new Set(errors)] });
    }
    await context.close();
  }
  fs.writeFileSync(path.join(output, 'metrics.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map(({ width, role, theme, tab, colors, commonColors, backgrounds, shadows, overflow, errors }) => ({ width, role, theme, tab, colors, commonColors, backgrounds, shadows, overflow, errors })), null, 2));
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
