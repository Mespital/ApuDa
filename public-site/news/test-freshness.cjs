/* Offline regression tests; does not fetch or modify production data. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const { status } = require('./freshness.js');

function time(value) { return Date.parse(value); }

test('same-day briefing is current after the 09:03 KST job', () => {
  assert.deepEqual(status('2026-11-01', time('2026-11-01T09:03:00+09:00')), {
    valid: true, stale: false, ageDays: 0
  });
});

test('next-day 09:30 is within one-hour publishing grace', () => {
  assert.equal(status('2026-11-01', time('2026-11-02T09:30:00+09:00')).stale, false);
  assert.equal(status('2026-11-01', time('2026-11-02T10:01:00+09:00')).stale, true);
});

test('nine-day-old archive is flagged with an accurate age', () => {
  assert.deepEqual(status('2026-11-01', time('2026-11-10T19:00:00+09:00')), {
    valid: true, stale: true, ageDays: 9
  });
});

test('unparseable/future report dates fail closed', () => {
  assert.equal(status('unknown', time('2026-11-10T19:00:00+09:00')).stale, true);
  assert.equal(status('2026-11-20', time('2026-11-10T19:00:00+09:00')).valid, false);
});

test('news UI loads the freshness guard before its inline renderer', () => {
  const html = readFileSync(__dirname + '/index.html', 'utf8');
  const guard = html.indexOf('<script src="/news/freshness.js"></script>');
  const inline = html.indexOf('<script>', guard);
  assert.ok(guard !== -1 && inline > guard);
  assert.match(html, /id="newsFreshnessNotice"[^>]*role="status"[^>]*hidden/);
  assert.match(html, /latestNewsStale/);
});

function renderOffline(reportDate, currentTime) {
  const html = readFileSync(__dirname + '/index.html', 'utf8');
  const inline = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\bload\(\);\s*$/, '');
  const elements = {};
  const doc = {
    title: '',
    getElementById(id) { return elements[id] ??= { innerHTML: '', textContent: '', hidden: true }; },
    querySelector(selector) { return elements[selector] ??= { innerHTML: '', textContent: '' }; },
    createElement() { return { innerHTML: '', get value() { return this.innerHTML; } }; }
  };
  const context = {
    document: doc,
    location: { search: '' },
    URLSearchParams,
    window: { ApuDaNewsFreshness: { status: date => status(date, currentTime) } }
  };
  vm.createContext(context);
  vm.runInContext(inline, context);
  vm.runInContext(`renderDaily({
    report_date: ${JSON.stringify(reportDate)},
    sources: ['의학신문'],
    outlet_status: [],
    trends: [],
    briefing: '검증용 브리핑',
    insight: '검증용 요약'
  })`, context);
  return { doc, elements };
}

test('stale report changes live title and displays warning', () => {
  const { doc, elements } = renderOffline('2026-11-01', time('2026-11-10T19:00:00+09:00'));
  assert.match(doc.title, /지난 뉴스 브리핑/);
  assert.match(elements['.hero h1'].textContent, /마지막 공개/);
  assert.equal(elements.newsFreshnessNotice.hidden, false);
  assert.match(elements.newsFreshnessNotice.textContent, /2026-11-01/);
  assert.match(elements['#periodTabs [data-period="today"]'].textContent, /마지막 브리핑/);
});

test('current report keeps normal today copy and hides warning', () => {
  const { elements } = renderOffline('2026-11-10', time('2026-11-10T09:10:00+09:00'));
  assert.equal(elements['.hero h1'].textContent, '오늘의 뉴스 브리핑');
  assert.equal(elements.newsFreshnessNotice.hidden, true);
  assert.equal(elements['#periodTabs [data-period="today"]'].textContent, '오늘');
});
