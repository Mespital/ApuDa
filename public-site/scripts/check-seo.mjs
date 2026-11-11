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
assert(!urls.some((url) => url.includes('/nonsul/') || url.includes('/note/') || url.includes('/note-v4/') || url.includes('/api/')),
  'Private or noindex route in sitemap');
// A <lastmod> must track a verifiable significant page update; we have no such per-URL source yet.
assert(!sitemap.includes('<lastmod>'), 'Unverified sitemap lastmod must not be invented');
const noteHtml = await read('note/index.html');
const noteGuideHtml = await read('note-guide/index.html');
const homepage = await read('index.html');
const netlify = await read('netlify.toml');
assert(/<meta name="robots" content="noindex">/.test(noteHtml), 'Patient note app needs noindex HTML fallback');
assert(urls.includes('https://apuda.app/note-guide/'), 'Public note introduction missing from sitemap');
assert(noteGuideHtml.includes('<link rel="canonical" href="https://apuda.app/note-guide/">'),
  'Public note introduction must have self canonical');
assert(noteGuideHtml.includes('<meta name="description"') &&
  noteGuideHtml.includes('href="/note/"') && !noteGuideHtml.includes('<meta name="robots" content="noindex">'),
  'Public note introduction must be discoverable with an app link and description');
assert(!/<form\b|<input\b|<textarea\b/i.test(noteGuideHtml) &&
  noteGuideHtml.includes('JSON 백업 파일은 암호화되지 않습니다') && noteGuideHtml.includes('자동 동기화되지 않습니다'),
  'Public intro must not collect patient records or omit backup privacy warnings');
assert(noteGuideHtml.includes('<a class="skip" href="#main-content">본문으로 바로가기</a>') &&
  noteGuideHtml.includes('<main class="wrap" id="main-content" tabindex="-1">') &&
  noteGuideHtml.includes('.skip{position:fixed;') &&
  noteGuideHtml.includes('.skip:focus{transform:none}') &&
  noteGuideHtml.includes('summary:focus-visible'),
  'Public intro must retain keyboard skip navigation and visible FAQ focus');
assert(noteGuideHtml.includes('.top nav a{display:inline-flex;align-items:center;min-height:44px}') &&
  noteGuideHtml.includes('.faq summary{font-weight:800;cursor:pointer;min-height:44px') &&
  noteGuideHtml.includes('.privacy a,.related a,footer a{display:inline-flex;align-items:center;min-height:44px}'),
  'Public intro must retain 44px mobile tap targets for small controls');
const luminance = (hex) => {
  const rgb = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
  const [r, g, b] = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
const surfaceColor = noteGuideHtml.match(/:root\{[^}]*background:(#[0-9a-f]{6})/i)?.[1];
const breadcrumbColor = noteGuideHtml.match(/\.crumb\{[^}]*color:(#[0-9a-f]{6})/i)?.[1];
const footerColor = noteGuideHtml.match(/footer\{[^}]*color:(#[0-9a-f]{6})/i)?.[1];
assert(surfaceColor && breadcrumbColor && footerColor &&
  contrast(breadcrumbColor, surfaceColor) >= 4.5 && contrast(footerColor, surfaceColor) >= 4.5,
  'Public intro small secondary text must retain WCAG 4.5:1 contrast');

// SEO-10: fail closed if a documented foreground, surface, or focus token changes.
// Static palette check, not a claim of full WCAG/browser/assistive-technology conformance.
const noteCss = noteGuideHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert(noteCss, 'Public intro inline stylesheet missing');
const cssRules = [...noteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, block]) => ({
  selectors: selectors.split(',').map((selector) => selector.trim()),
  declarations: new Map(block.split(';').map((entry) => {
    const colon = entry.indexOf(':');
    return colon < 0 ? [] : [entry.slice(0, colon).trim(), entry.slice(colon + 1).trim()];
  }).filter((entry) => entry.length === 2)),
}));
const declaration = (selector, property) => {
  const matched = cssRules.filter((rule) => rule.selectors.includes(selector) && rule.declarations.has(property));
  assert(matched.length > 0, `Note guide CSS ${selector} ${property} missing`);
  return matched.at(-1).declarations.get(property);
};
const cssHex = (value) => {
  assert(/^#(?:[0-9a-f]{6}|[0-9a-f]{3})$/i.test(value), `Unsupported CSS color: ${value}`);
  const color = value.toLowerCase();
  return color.length === 4 ? '#' + [...color.slice(1)].map((digit) => digit + digit).join('') : color;
};
const token = (selector, property = 'color') => cssHex(declaration(selector, property));
const gradient = declaration('.hero', 'background');
assert(gradient.startsWith('linear-gradient('), 'Note guide hero gradient needs manual contrast review');
const heroColors = gradient.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)?.map(cssHex);
assert(heroColors?.length === 2, 'Note guide gradient endpoints need manual contrast review');
const [heroLight, heroDark] = heroColors;
const white = token('.top', 'background');
const page = token(':root', 'background');
const pageText = token(':root');
const textPairs = [
  ['body', pageText, page],
  ['link on white', token('a'), white],
  ['link on page', token('a'), page],
  ['breadcrumb', token('.crumb'), page],
  ['eyebrow on white', token('.eyebrow'), heroLight],
  ['eyebrow on blue', token('.eyebrow'), heroDark],
  ['hero lead on white', token('.lead'), heroLight],
  ['hero lead on blue', token('.lead'), heroDark],
  ['primary button', token('.btn.primary'), token('.btn.primary', 'background')],
  ['card description', token('.card p'), token('.card', 'background')],
  ['card label', token('.tag'), token('.card', 'background')],
  ['step number', token('.steps li:before'), token('.steps li:before', 'background')],
  ['step description', token('.steps p'), token('.steps li', 'background')],
  ['medical notice', token('.notice p'), token('.notice', 'background')],
  ['privacy text', pageText, token('.privacy', 'background')],
  ['FAQ answer', token('.faq p'), token('.faq details', 'background')],
  ['footer', token('footer'), page],
];
const textFailures = textPairs.filter(([, foreground, background]) => contrast(foreground, background) < 4.5);
assert(textFailures.length === 0,
  'Note guide WCAG AA text contrast < 4.5:1: ' + textFailures.map(([name, foreground, background]) =>
    `${name} ${contrast(foreground, background).toFixed(2)}:1`).join(', '));
const outline = declaration('a:focus-visible', 'outline');
assert(declaration('summary:focus-visible', 'outline') === outline,
  'Note guide links and FAQ need the same visible focus indicator');
const focusMatch = outline.match(/^(\d+(?:\.\d+)?)px solid (#[0-9a-f]{3,6})$/i);
assert(focusMatch && Number(focusMatch[1]) >= 2, 'Note guide focus outline needs manual review');
const focusColor = cssHex(focusMatch[2]);
const focusSurfaces = [white, page, heroLight, heroDark, token('.privacy', 'background'), token('.notice', 'background')];
const focusFailures = focusSurfaces.filter((background) => contrast(focusColor, background) < 3);
assert(focusFailures.length === 0,
  'Note guide WCAG AA non-text focus contrast < 3:1 on: ' + focusFailures.join(', '));
// Self-check the thresholds, so accidentally inverted comparisons fail this script.
assert(contrast('#efad48', '#ffffff') < 3 && contrast('#a8cdf0', '#ffffff') < 4.5,
  'Note guide contrast regression guard sanity check failed');
const noteGuideScripts = [...noteGuideHtml.matchAll(/<script\b[^>]*>/g)].map((match) => match[0]);
assert(noteGuideScripts.length === 1 && noteGuideScripts[0] === '<script type="application/ld+json">',
  'Public intro must remain static and free of third-party tracking scripts');
const noteGuideJsonLd = JSON.parse(noteGuideHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert(noteGuideJsonLd['@type'] === 'BreadcrumbList' &&
  noteGuideJsonLd.itemListElement[1].item === 'https://apuda.app/note-guide/',
  'Public intro breadcrumb structured data must match canonical');
assert(homepage.includes("'암환자 노트 사용법','/note-guide/'"), 'Homepage note introduction link missing');
const communityHtml = await read('community/index.html');
assert(communityHtml.includes('href="/note-guide/"'), 'Static community page must link to note intro');
assert(/for = "\/note\/"\s+\[headers\.values\]\s+X-Robots-Tag = "noindex"/.test(netlify),
  'Patient note clean URL must send noindex header');
assert(/for = "\/note\/index\.html"\s+\[headers\.values\]\s+Cache-Control = "no-cache"\s+X-Robots-Tag = "noindex"/.test(netlify),
  'Patient note explicit index.html needs noindex without losing cache policy');
for (const path of ['/community/', '/family/', '/care/', '/pet/', '/farm/']) {
  assert(urls.includes('https://apuda.app' + path), 'Family or community URL missing from sitemap: ' + path);
}
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
  const articleMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(articleMatch, 'Book Article JSON-LD missing: ' + number);
  const article = JSON.parse(articleMatch[1]);
  const metaDescription = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  const htmlEscaped = String(article.description ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  assert(article['@type'] === 'Article' && article.mainEntityOfPage === url,
    'Book JSON-LD article identity mismatch: ' + number);
  assert(article.author?.['@type'] === 'Organization' && article.author.name === 'ApuDa' &&
    article.publisher?.name === 'ApuDa', 'Book JSON-LD organization attribution mismatch: ' + number);
  assert(article.description && article.isAccessibleForFree === true &&
    article.articleSection === '환자교육', 'Book JSON-LD patient guide attributes missing: ' + number);
  assert(metaDescription === htmlEscaped,
    'Book JSON-LD description differs from the visible SEO description: ' + number);
  assert(!article.datePublished && !article.dateModified && !article.reviewedBy,
    'Book JSON-LD must not invent unverified dates or clinical reviewers: ' + number);
  assert(html.includes('출처를 첨부한 환자교육용 참고정보'), 'Medical reference notice removed: ' + number);
  const slug = bookSlugs.get(number);
  assert(html.includes('class="apuda-faq-shortcut" href="/library/faq/' + slug + '/"'),
    'Related FAQ shortcut missing or mismatched: ' + number);
  assert(html.includes('.site-nav,.site-review{display:none!important}'),
    'Print/PDF navigation hiding changed: ' + number);
}

const faqDir = join(root, 'library/faq/data');
const faqIndex = await read('library/faq/index.html');
const faqIndexCanonicals = [...faqIndex.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
assert(faqIndexCanonicals.length === 1 && faqIndexCanonicals[0][1] === 'https://apuda.app/library/faq/',
  'Interactive FAQ index must retain one server-delivered self canonical');
assert(!faqIndex.includes('APUDA SEO CANONICAL') && !faqIndex.includes('link[rel=canonical]'),
  'Interactive FAQ index must not rewrite canonical using JavaScript');
const files = (await readdir(faqDir)).filter((name) => name.endsWith('.json'));
assert(files.length === 30, 'Expected 30 FAQ data files');
let questions = 0;
const faqTitles = new Set();
const faqDescriptions = new Set();
for (const file of files) {
  const record = JSON.parse(await read('library/faq/data/' + file));
  const url = 'https://apuda.app/library/faq/' + record.slug + '/';
  const html = await read('library/faq/' + record.slug + '/index.html');
  const count = [...html.matchAll(/<li><details id="q\d+">/g)].length;
  assert(count === 100, record.slug + ' static page does not have 100 questions');
  assert(urls.includes(url), 'FAQ not in sitemap: ' + record.slug);
  assert(html.includes('<link rel="canonical" href="' + url + '">'), 'FAQ canonical missing: ' + record.slug);
  assert(html.includes('출처를 첨부한 환자교육용 참고정보'), 'Patient reference notice missing: ' + record.slug);
  assert(html.includes('자료 출처·검토 범위'), 'Evidence/transparency link missing: ' + record.slug);
  assert(!html.includes('전문의 문항별 검토: 대기 중'), 'Draft status label still shown: ' + record.slug);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)">/)?.[1];
  const ogDescription = html.match(/<meta property="og:description" content="([^"]+)">/)?.[1];
  assert(title?.startsWith(record.name + ' ') && title.includes('FAQ 100문항'), 'FAQ title not specific: ' + record.slug);
  assert(description?.startsWith(record.name + ' ') && description.length >= 85 && description.length <= 220,
    'FAQ description missing or too short/long: ' + record.slug);
  assert(title === ogTitle && description === ogDescription, 'FAQ social metadata inconsistent: ' + record.slug);
  assert(!faqTitles.has(title) && !faqDescriptions.has(description), 'Duplicate FAQ SEO metadata: ' + record.slug);
  faqTitles.add(title);
  faqDescriptions.add(description);
  questions += count;
}
assert(questions === 3000, 'Expected 3,000 original FAQ items');
console.log(`Note guide static contrast: ${textPairs.length}/${textPairs.length} text and ${focusSurfaces.length}/${focusSurfaces.length} focus surfaces PASS (WCAG 2.2 AA thresholds).`);
console.log('SEO verified: 85 URLs, 30 books, 30 static FAQ pages, 3,000 questions, note intro public and app noindex.');
