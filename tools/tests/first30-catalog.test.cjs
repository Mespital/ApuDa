// Run with: node tools/tests/first30-catalog.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../..');
const site = path.join(root, 'public-site');
const manifest = JSON.parse(fs.readFileSync(path.join(site, 'assets/books/first30/manifest.json'), 'utf8'));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(site, 'assets/apuda-first30-catalog.js'), 'utf8'), context);
const catalog = context.window.ApuDaFirst30Catalog;
const legacy = new Set(['breast', 'lung', 'stomach', 'colorectal', 'thyroid', 'kidney', 'prostate', 'pancreas', 'biliary', 'liver', 'lymphoma', 'cervical']);

assert.equal(catalog.books.length, 30);
assert.equal(new Set(catalog.books.map(book => book.slug)).size, 30);
assert.equal(new Set(catalog.books.map(book => book.href)).size, 30);
for (const [index, book] of catalog.books.entries()) {
  const approved = manifest.covers.find(cover => cover.slug === book.slug);
  assert.ok(approved, `Unknown cover: ${book.slug}`);
  assert.equal(book.vol, index + 1);
  assert.equal(book.vol, approved.vol);
  assert.equal(book.name, approved.name);
  assert.equal(book.cover, approved.src);
  assert.equal(book.href, approved.book_href);
  assert.equal(book.hasMini, legacy.has(book.slug));
  assert.equal(book.hasFaq, true);
  // 2026-11-03 신규 18묶음도 100문항으로 확장됨 — 하드코딩 대신 실제 FAQ 파일과 대조
  const faqData = JSON.parse(fs.readFileSync(path.join(site, 'library/faq/data', book.slug + '.json'), 'utf8'));
  assert.equal(book.faqCount, faqData.items.length, book.slug + ': faqCount');
  assert.equal(book.faqCount, 100);
  assert.equal(catalog.get(book.slug), book);
  assert.ok(Object.isFrozen(book));
  const image = fs.readFileSync(path.join(site, book.cover.split('?')[0]));
  assert.equal(crypto.createHash('sha256').update(image).digest('hex'), approved.sha256, book.slug);
  assert.ok(fs.existsSync(path.join(site, book.href)), `Missing guide: ${book.href}`);
}
assert.equal(catalog.get('pancreatic'), catalog.get('pancreas'));
assert.equal(catalog.get(' BREAST '), catalog.get('breast'));
assert.equal(catalog.get('unknown'), null);
assert.equal(catalog.get('__proto__'), null);
assert.equal(catalog.get(''), null);
assert.ok(Object.isFrozen(catalog.books));
assert.ok(Object.isFrozen(catalog));
console.log('PASS: 30 cover/volume/name/guide identities, asset hashes, 12 supported MINI cancers, 30 FAQ cancers and correct question counts, safe unknown lookup');
