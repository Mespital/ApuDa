// Keep the public source ledger current for the FAQ documents amended in the
// 2026-11-08 AI medical safety pass; do not alter actual clinical approvals.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'library/review/registry.json');
const registry = JSON.parse(await readFile(path, 'utf8'));
const changed = ['brain', 'aml', 'laryngeal', 'myeloma', 'endometrial', 'esophageal', 'hodgkin', 'ovarian', 'sarcoma'];

for (const slug of changed) {
  const faq = JSON.parse(await readFile(join(root, 'library/faq/data', slug + '.json'), 'utf8'));
  const entry = registry.cancers.find((cancer) => cancer.slug === slug);
  if (!entry || faq.items.length !== 100 || faq.clinicalApproval !== 'pending' || entry.faqApproval !== 'pending') {
    throw new Error('Unexpected FAQ/registry state for ' + slug);
  }
  entry.webRevision = faq.revision;
  entry.checkedAt = '2026-11-08';
  for (const item of faq.items) {
    if (!item.review || !Array.isArray(item.review.sourceRefs)) throw new Error('Missing item review: ' + slug);
    for (const id of item.review.sourceRefs) {
      const source = faq.sources[id];
      if (!source) throw new Error('Unknown source: ' + slug + ' / ' + id);
      if (!entry.sources[id]) entry.sources[id] = source;
    }
  }
}

registry.revision = '20261108-faq-safety-sources-v2';
registry.checkedAt = '2026-11-08';
await writeFile(path, JSON.stringify(registry, null, 2) + '\n', 'utf8');
console.log('Synced clinical source references for ' + changed.length + ' FAQ categories; approval states unchanged');
