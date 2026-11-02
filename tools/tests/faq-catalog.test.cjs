// Run with: node tools/tests/faq-catalog.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../..');
const site = path.join(root, 'public-site');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(site, 'assets/apuda-first30-catalog.js'), 'utf8'), context);
const books = context.window.ApuDaFirst30Catalog.books;
const registry = JSON.parse(fs.readFileSync(path.join(site, 'library/review/registry.json'), 'utf8'));
const evidenceLedger = JSON.parse(fs.readFileSync(path.join(root, 'docs/reviews/2026-11-02-faq18-independent-ledger.json'), 'utf8'));
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
const ids = new Set();
let total = 0, core = 0;
assert.equal(books.length, 30);
assert.equal(registry.cancers.length, 30);
assert.equal(new Set(registry.cancers.map(item => item.slug)).size, 30);
for (const book of books) {
  assert.equal(book.hasFaq, true);
  const data = JSON.parse(fs.readFileSync(path.join(site, 'library/faq/data', book.slug + '.json'), 'utf8'));
  const review = registry.cancers.find(item => item.slug === book.slug);
  assert.equal(data.slug, book.slug);
  assert.equal(data.items.length, book.faqCount);
  assert.equal(review.faqItems, data.items.length);
  assert.equal(review.faqApproval, 'pending');
  assert.equal(review.participantTesting, 'not-conducted');
  assert.equal(review.guideHref, book.href);
  assert.equal(review.miniAvailable, book.hasMini);
  assert.equal(review.videoAvailable, book.hasMini);
  assert.equal(new Set(data.items.map(item => item.q)).size, data.items.length, book.slug + ': repeated question');
  for (const [index, item] of data.items.entries()) {
    assert.equal(item.n, index + 1);
    assert.equal(typeof item.q, 'string');
    assert.equal(typeof item.a, 'string');
    assert.ok(item.q.trim().length >= 8 && item.a.trim().length >= 40);
    assert.ok(!ids.has(item.review.id), 'Repeated review ID: ' + item.review.id);
    ids.add(item.review.id);
    assert.equal(item.review.clinicalApproval, 'pending');
    if (!book.hasMini) {
      assert.ok(['diagnosis', 'treatment', 'care', 'followup'].includes(item.category));
      assert.ok(item.review.sourceRefs.length > 0, book.slug + ':' + item.n + ': missing evidence');
      assert.equal(item.review.aiCheck, 'independent-ai-reviewed');
      for (const id of item.review.sourceRefs) {
        const source = data.sources[id];
        assert.ok(source, book.slug + ':' + item.n + ': unresolved source ' + id);
        assert.equal(new URL(source.url).protocol, 'https:');
        assert.equal(source.checkedAt, '2026-11-02');
        assert.ok(source.title && source.scope && source.organization);
      }
    }
  }
  if (!book.hasMini) {
    core += data.items.length;
    assert.equal(data.name, book.name);
    assert.equal(data.clinicalApproval, 'pending');
    assert.equal(data.aiReview.status, 'completed');
    assert.equal(data.aiReview.independent, true);
    const payload = { slug: data.slug, name: data.name, items: data.items.map(item => ({ n: item.n, q: item.q, a: item.a, category: item.category, sourceRefs: item.review.sourceRefs, scope: item.review.scope })), sources: data.sources, questionsForVisit: data.questionsForVisit };
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(stable(payload))).digest('hex'), data.aiReview.contentSha256, book.slug + ': content changed after review');
    assert.equal(data.aiReview.reviewedDraftSha256, evidenceLedger.reviewedFiles.find(item => item.slug === book.slug).file_sha256);
    assert.equal(data.questionsForVisit.length, 5);
    assert.equal(review.coreFaq, true);
    assert.equal(review.checkedAt, data.updated);
    assert.deepEqual(review.targetedItems, data.items.map(item => item.n));
    assert.deepEqual(review.sources, data.sources);
  } else {
    assert.equal(review.checkedAt, '2026-10-19');
    assert.ok(review.targetedItems.length < data.items.length);
  }
  total += data.items.length;
}
assert.equal(core, 360);
assert.equal(total, 1560);
console.log('PASS: 30 FAQ identities, 360 source-linked independently AI-reviewed new questions, 1,200 legacy questions, honest clinical status and resource availability');
