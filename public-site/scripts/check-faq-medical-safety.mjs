// Prevent regressions to FAQ medical safety fixes and public review transparency.
// Passing this mechanical test is NOT an actual specialist's clinical approval.
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(root, path), 'utf8');
const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};

const dataDir = 'library/faq/data';
// all.json means acute lymphoblastic leukemia (ALL), one of the 30 cancers.
const files = (await readdir(join(root, dataDir))).filter((name) => name.endsWith('.json')).sort();
assert(files.length === 30, `Expected 30 cancer FAQ datasets, received ${files.length}`);

const faqs = new Map();
let questionCount = 0;
let noIndividualSourceCount = 0;
let sourceLinks = 0;
for (const file of files) {
  const faq = JSON.parse(await read(join(dataDir, file)));
  const slug = file.replace(/\.json$/, '');
  assert(faq.slug === slug, `${slug}: mismatched slug`);
  assert(faq.items?.length === 100, `${slug}: expected 100 questions`);
  // Twelve legacy datasets have no document-level approval field; none claims approval.
  assert(faq.clinicalApproval === undefined || faq.clinicalApproval === 'pending', `${slug}: unverified clinical approval change`);
  assert(faq.sources && typeof faq.sources === 'object', `${slug}: missing sources`);
  faqs.set(slug, faq);
  const numbers = new Set();
  for (const item of faq.items) {
    assert(Number.isInteger(item.n) && item.n >= 1 && item.n <= 100, `${slug}: invalid question number`);
    assert(!numbers.has(item.n), `${slug}: repeated question ${item.n}`);
    numbers.add(item.n);
    assert(item.q?.trim() && item.a?.trim(), `${slug} #${item.n}: missing question or answer`);
    assert(item.review?.clinicalApproval === 'pending', `${slug} #${item.n}: unverified clinical approval change`);
    assert(Array.isArray(item.review.sourceRefs), `${slug} #${item.n}: missing sourceRefs array`);
    if (!item.review.sourceRefs.length) noIndividualSourceCount++;
    for (const ref of item.review.sourceRefs) {
      assert(faq.sources[ref], `${slug} #${item.n}: unresolved source ${ref}`);
      sourceLinks++;
    }
    questionCount++;
  }
  const staticFaq = await read(`library/faq/${slug}/index.html`);
  assert(staticFaq.includes('환자교육용 참고정보'), `${slug}: static FAQ patient notice missing`);
  assert(staticFaq.includes('자료 출처·검토 범위'), `${slug}: static FAQ source transparency link missing`);
  assert(!/검토 대기|AI 초안|전문의 감수 완료/.test(staticFaq), `${slug}: stale visible review badge`);
}
assert(questionCount === 3000, `FAQ question count mismatch: ${questionCount}`);
assert(noIndividualSourceCount <= 6, `Missing per-item source refs increased: ${noIndividualSourceCount}`);

// Check medical high-risk amendments by stable question ID and safety-critical wording.
const cases = [
  ['brain', 40, ['테모졸로마이드', '관계없이 폐포자충폐렴(PJP) 예방약']],
  ['aml', 30, ['WHO', '모양이 비정상적이라는 사실만으로 AML-MR을 확정하지 않습니다']],
  ['laryngeal', 71, ['즉시 119', '목 기공으로만 호흡']],
  ['laryngeal', 72, ['당일', '즉시 119']],
  ['myeloma', 75, ['ICANS', '지체 없이 119']],
  ['aml', 84, ['MMR', '일률적으로 접촉을 제한할 필요는 없습니다']],
  ['endometrial', 56, ['3~6개월마다', 'MRI는 초기 평가']],
  ['esophageal', 23, ['실제로 침범', '2cm 이내']],
  ['hodgkin', 43, ['2026년 3월 20일', '국내 허가·보험 급여']],
  ['ovarian', 75, ['전체 생존기간', '정기 CT 검사 자체의 효과']],
  ['ovarian', 78, ['KRAS 변이', '신속승인']],
  ['sarcoma', 39, ['독소루비신', '단독요법']],
  ['sarcoma', 56, ['포상연부육종(ASPS)', '모든 연부조직육종에 면역항암제가 표준인 것은 아니에요']],
];
for (const [slug, number, needles] of cases) {
  const item = faqs.get(slug).items.find((entry) => entry.n === number);
  assert(item, `${slug} #${number}: changed question not found`);
  for (const needle of needles) assert(item.a.includes(needle), `${slug} #${number}: lost clinical correction '${needle}'`);
  assert(item.review.version === '20261108-medical-safety-ai-pass-v2', `${slug} #${number}: safety review version regressed`);
  assert(item.review.sourceRefs.length >= 1, `${slug} #${number}: no supporting sources`);
}
const bcg = faqs.get('bladder').items.find((entry) => entry.n === 37);
assert(bcg?.a.includes('38.0℃') && !bcg.a.includes('38.5'), 'Bladder BCG fever threshold regressed');

for (let number = 1; number <= 30; number++) {
  const name = String(number).padStart(2, '0');
  const book = await read(`library/first30/books/${name}.html`);
  assert(book.includes('환자교육용 참고정보') && book.includes('자료 출처·검토 범위'), `Book ${name}: notice or transparency link missing`);
  assert(book.includes('119'), `Book ${name}: emergency instructions missing`);
  assert(!/검토 대기|AI 초안|전문의 감수 완료/.test(book), `Book ${name}: stale review badge`);
}
const registry = JSON.parse(await read('library/review/registry.json'));
assert(registry.cancers.length === 30, 'Clinical review registry missing cancer categories');
assert(registry.humanApproval !== 'completed', 'Clinical review registry inaccurately shows approval');
for (const cancer of registry.cancers) {
  assert(cancer.faqApproval === 'pending', `${cancer.slug}: unverified FAQ clinical approval`);
}
const landing = await read('library/faq/index.html');
assert(landing.includes('38.0℃') && landing.includes('119'), 'FAQ landing emergency instructions missing');
assert(!/검토 대기|AI 초안|전문의 감수 완료/.test(landing), 'FAQ landing review badge regression');
console.log(`FAQ safety checks passed: ${files.length} cancers, ${questionCount} questions, ${sourceLinks} valid source links, ${noIndividualSourceCount} no individual citation, ${cases.length} amended items, 30 books; actual clinical approvals remain pending.`);
