// Build SEO-friendly, static reading pages from existing ApuDa content.
// Run from any directory: node public-site/scripts/build-seo.mjs
// The original FAQ JSON, interactive reader, and patient records are untouched.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://apuda.app';
const faqDir = join(root, 'library/faq');
const booksDir = join(root, 'library/first30/books');
const escapeHtml = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const jsonLd = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const canonical = (path) => origin + path;

const catalog = await readFile(join(root, 'library/first30/index.html'), 'utf8');
const catalogMatches = [...catalog.matchAll(/data-slug="([^"]+)" data-name="([^"]+)" href="\/library\/first30\/books\/(\d{2})\.html"/g)];
if (catalogMatches.length !== 30) throw new Error('Expected exactly 30 book entries');
const books = new Map(catalogMatches.map(([, slug, name, number]) => [slug, { name, number }]));

// "all" is the disease slug for acute lymphoblastic leukemia (ALL), not a combined feed.
const dataFiles = (await readdir(join(faqDir, 'data'))).filter((name) => name.endsWith('.json')).sort();
if (dataFiles.length !== 30) throw new Error('Expected exactly 30 cancer FAQ data files');
const records = [];
for (const file of dataFiles) {
  const record = JSON.parse(await readFile(join(faqDir, 'data', file), 'utf8'));
  if (!books.has(record.slug)) throw new Error('FAQ slug missing in catalog: ' + record.slug);
  if (!Array.isArray(record.items) || record.items.length !== 100) throw new Error('Expected 100 questions for ' + record.slug);
  records.push(record);
}
const nav = records.map((r) => '<a href="/library/faq/' + encodeURIComponent(r.slug) + '/">' + escapeHtml(r.name) + '</a>').join('');

function sourceLinks(item, record) {
  const refs = Array.isArray(item.review?.sourceRefs) ? item.review.sourceRefs : [];
  const links = refs.map((id) => record.sources?.[id])
    .filter((src) => src && /^https?:\/\//i.test(src.url ?? ''))
    .slice(0, 4).map((src) => '<a href="' + escapeHtml(src.url) + '" rel="noopener noreferrer" target="_blank">' +
      escapeHtml(src.title) + '</a>');
  return links.length ? '<div class="sources"><b>참고 자료</b>' + links.join(' · ') + '</div>' : '';
}

function faqPage(record) {
  const book = books.get(record.slug);
  const url = canonical('/library/faq/' + record.slug + '/');
  const title = record.name + ' FAQ 100문항 | 증상·검사·치료·생활 | ApuDa';
  const description = record.name + ' 환자와 보호자를 위한 질문 100개. 증상·검사·치료와 부작용, 생활·진료 준비를 한곳에서 확인하세요. 실제 의료진의 최종 검토 전 참고용 자료입니다.';
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ApuDa', item: origin + '/' },
      { '@type': 'ListItem', position: 2, name: '암 진단 첫 30일', item: origin + '/library/first30/' },
      { '@type': 'ListItem', position: 3, name: record.name + ' FAQ', item: url },
    ] };
  const questions = record.items.map((item) => {
    const reviewed = item.review?.clinicalApproval === 'approved';
    return '<li><details id="q' + Number(item.n) + '"><summary>' + escapeHtml(item.q) + '</summary>' +
      '<div class="answer"><p>' + escapeHtml(item.a) + '</p>' + sourceLinks(item, record) +
      '<small>' + (reviewed ? '전문의 검토 상태: 승인 기록 있음' : '전문의 문항별 검토: 대기 중') +
      ' · 구체적인 치료 결정은 담당 의료진과 상의하세요.</small></div></details></li>';
  }).join('\n');
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${url}">
<meta name="theme-color" content="#f1f7fc">
<script type="application/ld+json">${jsonLd(breadcrumb)}</script>
<style>
:root{color-scheme:light;font-family:system-ui,"Noto Sans KR","Malgun Gothic",sans-serif;color:#193a4d}
*{box-sizing:border-box}body{margin:0;background:#f1f7fa;line-height:1.7}
a{color:#086c86}a:focus-visible,summary:focus-visible{outline:3px solid #e3aa27;outline-offset:3px}
.top{padding:16px max(18px,calc((100vw - 980px)/2));background:#0f3a53;color:#fff;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
.top a{color:#fff;font-weight:750;text-decoration:none}.wrap{max-width:980px;margin:auto;padding:26px 18px 70px}
.crumb{font-size:14px;color:#527086}.hero{padding:28px;background:white;border-radius:18px;border:1px solid #d8e6ee}
h1{font-size:clamp(27px,4.4vw,42px);line-height:1.25;margin:8px 0 12px}h2{font-size:21px}
.lead{margin:0;color:#49677c}.notice{margin-top:17px;border-left:5px solid #d6a33d;background:#fff8e7;padding:12px 15px;font-size:14px}
.nav{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.nav a{font-size:13px;text-decoration:none;padding:5px 10px;background:#fff;border:1px solid #d4e6ed;border-radius:20px}
ol{list-style:none;padding:0;display:grid;gap:10px}li{margin:0}details{background:#fff;border:1px solid #d9e8ef;border-radius:12px;overflow:hidden}
summary{cursor:pointer;padding:17px 18px;font-weight:740;line-height:1.5;min-height:48px}
.answer{padding:0 18px 19px;border-top:1px solid #e9f0f4}.answer p{white-space:pre-line}
.sources{color:#536d7b;font-size:13px;margin:12px 0}.sources a{display:inline-block;margin:4px 6px 4px 0}
small{display:block;font-size:12px;color:#627884}footer{padding-top:30px;color:#536d7b;font-size:13px}
@media(max-width:600px){.wrap{padding:14px 12px 50px}.hero{padding:18px}summary{padding:14px}}
</style></head><body>
<header class="top"><a href="/">ApuDa · 아프지만, 다행이다</a><a href="/library/first30/">암종별 안내서 30권</a></header>
<main class="wrap"><div class="hero">
<nav class="crumb" aria-label="현재 위치"><a href="/">ApuDa</a> › <a href="/library/first30/">암 진단 첫 30일</a> › ${escapeHtml(record.name)} FAQ</nav>
<h1>${escapeHtml(record.name)} FAQ 100문항</h1>
<p class="lead">환자·보호자가 자주 묻는 질문을 정리했습니다. 필요한 항목을 눌러 읽어보세요.</p>
<div class="notice">이 자료는 AI 사전검토를 거친 환자교육용 참고자료이며 실제 전문의의 문항별 임상 검토·승인이 완료되지 않았습니다. 국내 허가·급여 기준과 개인 상태에 따라 달라질 수 있으므로, 진단·치료·약물 변경은 반드시 담당 의료진과 상의하세요.</div>
<p><a href="/library/faq/?cancer=${encodeURIComponent(record.slug)}">검색·주제별 필터가 있는 FAQ 화면으로 이동</a> ·
<a href="/library/first30/books/${book.number}.html">${escapeHtml(record.name)} 첫 30일 무료 안내서</a></p>
</div><nav class="nav" aria-label="다른 암종 FAQ">${nav}</nav>
<h2>질문과 답변</h2><ol>${questions}</ol>
<footer>마지막 자료 업데이트: ${escapeHtml(record.updated ?? '미확인')} · <a href="/library/review/?cancer=${encodeURIComponent(record.slug)}">자료 검토 상태</a><p>© ApuDa · 이 정보는 의료진의 진단·처방을 대신하지 않습니다.</p></footer>
</main></body></html>`;
}

// Generate a self-contained static HTML version of each interactive FAQ.
for (const record of records) {
  const output = join(faqDir, record.slug, 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, faqPage(record), 'utf8');
}

// Make those static pages discoverable through ordinary HTML links, while
// preserving the existing searchable/interactive FAQ application.
const indexPath = join(faqDir, 'index.html');
let faqIndex = await readFile(indexPath, 'utf8');
faqIndex = faqIndex.replace(/<!-- APUDA SEO FAQ LINKS START -->[\s\S]*?<!-- APUDA SEO FAQ LINKS END -->\s*/g, '');
faqIndex = faqIndex.replace(/<!-- APUDA SEO CANONICAL START -->[\s\S]*?<!-- APUDA SEO CANONICAL END -->\s*/g, '');
const canonicalScript = '<!-- APUDA SEO CANONICAL START -->\n<script>' +
  '(function(){const slug=new URLSearchParams(location.search).get("cancer");' +
  'if(' + JSON.stringify(records.map((r) => r.slug)) + '.includes(slug))' +
  'document.querySelector("link[rel=canonical]").href="https://apuda.app/library/faq/"+slug+"/";' +
  '})();</script>\n<!-- APUDA SEO CANONICAL END -->\n';
faqIndex = faqIndex.replace('</head>', canonicalScript + '</head>');
const staticNav = '<!-- APUDA SEO FAQ LINKS START -->\n' +
  '<details class="sec" style="padding:16px;border:1px solid #dce8f5;border-radius:14px;background:#fff">' +
  '<summary style="cursor:pointer;font-weight:850">암종별 FAQ 30종 전체 보기</summary>' +
  '<nav aria-label="암종별 FAQ 읽기" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
  nav + '</nav></details>\n<!-- APUDA SEO FAQ LINKS END -->\n';
if (!faqIndex.includes('</main>')) throw new Error('FAQ index missing </main>');
faqIndex = faqIndex.replace('</main>', staticNav + '</main>');
await writeFile(indexPath, faqIndex, 'utf8');

// Annotate the existing 30 printable book pages without changing their content.
const markerStart = '<!-- APUDA SEO START -->';
const markerEnd = '<!-- APUDA SEO END -->';
for (const [slug, book] of books) {
  const file = join(booksDir, book.number + '.html');
  let html = await readFile(file, 'utf8');
  html = html.replace(/<!-- APUDA SEO START -->[\s\S]*?<!-- APUDA SEO END -->\s*/g, '');
  const title = book.name + ' 진단 후 첫 30일 | 검사·치료 준비·진료 질문 | ApuDa';
  const focusMatch = html.match(/지금 가장 중요한 한 가지<\/h3><p>([^<]+)<\/p>/);
  const focus = focusMatch ? focusMatch[1].trim() : '';
  const description = (book.name + ' 진단 후 첫 30일 무료 안내서. ' + focus +
    ' 검사·치료 준비와 진료 질문을 정리한 환자·보호자용 자료입니다.').slice(0, 175);
  const url = canonical('/library/first30/books/' + book.number + '.html');
  const data = { '@context': 'https://schema.org', '@type': 'Article', headline: title,
    mainEntityOfPage: url, inLanguage: 'ko', publisher: { '@type': 'Organization', name: 'ApuDa', url: origin + '/' } };
  const tags = markerStart + '\n' +
    '<meta name="description" content="' + escapeHtml(description) + '">\n' +
    '<link rel="canonical" href="' + url + '">\n' +
    '<meta property="og:type" content="article"><meta property="og:title" content="' + escapeHtml(title) + '">\n' +
    '<meta property="og:description" content="' + escapeHtml(description) + '"><meta property="og:url" content="' + url + '">\n' +
    '<script type="application/ld+json">' + jsonLd(data) + '</script>\n' + markerEnd;
  if (!html.match(/<title>[\s\S]*?<\/title>/)) throw new Error('Missing title in ' + file);
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(title) + '</title>\n' + tags);
  await writeFile(file, html, 'utf8');
}

// Restrict the sitemap to publicly accessible content. Private/account endpoints
// and /nonsul/ (which has X-Robots-Tag: noindex) are intentionally excluded.
const paths = [
  '/', '/about/', '/community/', '/family/', '/care/', '/pet/', '/farm/',
  '/risk/', '/checkup/', '/emergency/', '/hospital-information/',
  '/library/first30/', '/library/faq/', '/library/review/',
  '/library/mini/', '/library/treatment-map/', '/library/drugs/',
  '/library/biomarkers/', '/library/regimens/', '/support/', '/support/v4/',
  '/news/', '/news/oncology/', '/note/', '/watch/',
  ...[...books.values()].map((b) => '/library/first30/books/' + b.number + '.html'),
  ...records.map((r) => '/library/faq/' + r.slug + '/'),
];
if (new Set(paths).size !== paths.length) throw new Error('Duplicate URLs in sitemap');
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  paths.map((p) => '  <url><loc>' + canonical(p) + '</loc></url>').join('\n') +
  '\n</urlset>\n';
await writeFile(join(root, 'sitemap.xml'), xml, 'utf8');
console.log('SEO: ' + books.size + ' books, ' + records.length + ' FAQ pages, ' + paths.length + ' sitemap URLs');
