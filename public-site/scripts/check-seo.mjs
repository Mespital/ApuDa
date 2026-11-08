import { readFile, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(root, path), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sitemap = await read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(urls.length === 80, 'Expected exactly 80 sitemap URLs');
assert(new Set(urls).size === urls.length, 'Sitemap has duplicate URLs');
assert(urls.every((url) => url.startsWith('https://apuda.app/')), 'Sitemap has an external URL');

const robots = await read('robots.txt');
assert(robots.includes('Sitemap: https://apuda.app/sitemap.xml'), 'Root sitemap missing from robots');
assert(robots.includes('Sitemap: https://apuda.app/farm/sitemap.xml'), 'Farm sitemap was removed');
assert(!urls.some((url) => url.includes('/nonsul/') || url.includes('/api/')), 'Private or noindex route in sitemap');

for (let n = 1; n <= 30; n++) {
  const number = String(n).padStart(2, '0');
  const url = 'https://apuda.app/library/first30/books/' + number + '.html';
  const html = await read('library/first30/books/' + number + '.html');
  assert(urls.includes(url), 'Book not in sitemap: ' + number);
  assert(html.includes('<link rel="canonical" href="' + url + '">'), 'Book canonical missing: ' + number);
  assert(html.includes('<meta name="description"'), 'Book description missing: ' + number);
  assert(html.includes('실제 전문의 검토'), 'Medical review notice removed: ' + number);
}

const faqDir = join(root, 'library/faq/data');
const files = (await readdir(faqDir)).filter((name) => name.endsWith('.json'));
assert(files.length === 30, 'Expected 30 FAQ data files');
let questions = 0;
for (const file of files) {
  const record = JSON.parse(await read('library/faq/data/' + file));
  const url = 'https://apuda.app/library/faq/' + record.slug + '/';
  const html = await read('library/faq/' + record.slug + '/index.html');
  const count = [...html.matchAll(/<li><details id="q\d+">/g)].length;
  assert(count === 100, record.slug + ' static page does not have 100 questions');
  assert(urls.includes(url), 'FAQ not in sitemap: ' + record.slug);
  assert(html.includes('<link rel="canonical" href="' + url + '">'), 'FAQ canonical missing: ' + record.slug);
  assert(html.includes('문항별 임상 검토·승인이 완료되지 않았습니다'), 'Clinical disclaimer missing: ' + record.slug);
  questions += count;
}
assert(questions === 3000, 'Expected 3,000 original FAQ items');
console.log('SEO verified: 80 URLs, 30 books, 30 static FAQ pages, 3,000 questions.');
