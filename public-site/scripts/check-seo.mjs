import { readFile, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(root, path), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sitemap = await read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(urls.length === 85, 'Expected exactly 85 sitemap URLs');
assert(new Set(urls).size === urls.length, 'Sitemap has duplicate URLs');
assert(urls.every((url) => url.startsWith('https://apuda.app/')), 'Sitemap has an external URL');

const robots = await read('robots.txt');
assert(robots.includes('Sitemap: https://apuda.app/sitemap.xml'), 'Root sitemap missing from robots');
assert(robots.includes('Sitemap: https://apuda.app/farm/sitemap.xml'), 'Farm sitemap was removed');
assert(!urls.some((url) => url.includes('/nonsul/') || url.includes('/api/')), 'Private or noindex route in sitemap');
for (const path of ['/community/', '/family/', '/care/', '/pet/', '/farm/']) {
  assert(urls.includes('https://apuda.app' + path), 'Family or community URL missing from sitemap: ' + path);
}
const homepage = await read('index.html');
assert(homepage.includes('"@type":"WebSite"') && homepage.includes('"alternateName"'), 'Homepage site-name structured data missing');
assert(homepage.includes('href="/community/"') && homepage.includes('href="/family/"'), 'Homepage family or community link missing');
const catalog = await read('library/first30/index.html');
const bookSlugs = new Map([...catalog.matchAll(/data-slug="([^"]+)" data-name="[^"]+" href="\/library\/first30\/books\/(\d{2})\.html"/g)]
  .map(([, slug, number]) => [number, slug]));
assert(bookSlugs.size === 30, 'Expected 30 cancer-to-book mappings');
for (const path of ['community', 'family']) {
  const html = await read(path + '/index.html');
  assert(html.includes('<link rel="canonical" href="https://apuda.app/' + path + '/">'), 'Canonical missing: ' + path);
}
const community = await read('community/index.html');
const family = await read('family/index.html');
assert(community.includes('href="https://cafe.naver.com/2ndpart"'), 'Naver cafe link missing');
for (const path of ['/care/', '/pet/', '/farm/']) {
  assert(family.includes('href="' + path + '"'), 'Family site link missing: ' + path);
}

for (let n = 1; n <= 30; n++) {
  const number = String(n).padStart(2, '0');
  const url = 'https://apuda.app/library/first30/books/' + number + '.html';
  const html = await read('library/first30/books/' + number + '.html');
  assert(urls.includes(url), 'Book not in sitemap: ' + number);
  assert(html.includes('<link rel="canonical" href="' + url + '">'), 'Book canonical missing: ' + number);
  assert(html.includes('<meta name="description"'), 'Book description missing: ' + number);
  assert(html.includes('실제 전문의 검토'), 'Medical review notice removed: ' + number);
  const slug = bookSlugs.get(number);
  assert(html.includes('class="apuda-faq-shortcut" href="/library/faq/' + slug + '/"'),
    'Related FAQ shortcut missing or mismatched: ' + number);
  assert(html.includes('.site-nav,.site-review{display:none!important}'),
    'Print/PDF navigation hiding changed: ' + number);
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
console.log('SEO verified: 85 URLs, 30 books, 30 static FAQ pages, 3,000 questions, brand and family pages.');
