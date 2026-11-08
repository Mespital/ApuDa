// Apply the patient-facing, non-misleading notice policy to the 30 printable
// first-30-day guides. Keeps the guides, emergency boxes and print layout intact.
// The originals are recoverable from Git history; run before build-seo.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const guideDir = join(root, 'library/first30/books');

const replacements = [
  [
    '이 안내서는 공식 자료를 참고한 AI 사전점검본으로, 실제 전문의 검토와 환자 참여 검증이 완료되지 않았습니다. 개별 진단·치료는 담당 의료진과 상의하세요.',
    '이 안내서는 출처를 첨부한 환자교육용 참고정보입니다. 진단·치료·약물 변경은 담당 의료진과 상의하세요. <a href="/library/review/">자료 출처·검토 범위</a>',
  ],
  [
    '2026-10-30 · 무료 배포용 AI 사전검토본<br>실제 암종별 전문의 최종 승인 및 환자 사용성 시험은 아직 완료되지 않았습니다.',
    '2026-10-30 · 무료 배포용 환자교육 참고자료<br>진료 질문과 기록을 돕는 자료이며 진료를 대신하지 않습니다.',
  ],
  [
    '미국 NCI 등 공식 자료를 2026-10-30에 AI 사전 대조했습니다. 한국 내 허가·급여는 별도 확인 필요합니다. 실제 의료진 승인·환자 시험이 완료된 책이 아니며, 개인 진료를 대체하지 않습니다.',
    '미국 NCI 등 자료를 2026-10-30에 참고했습니다. 자료의 범위·최신성과 국내 허가·급여는 진료팀과 확인하세요. 환자교육용 참고자료로서 개인의 진료·처방을 대신하지 않습니다.',
  ],
];

let changed = 0;
for (let n = 1; n <= 30; n++) {
  const file = join(guideDir, `${String(n).padStart(2, '0')}.html`);
  let html = await readFile(file, 'utf8');
  const original = html;
  for (const [before, after] of replacements) {
    const matches = html.split(before).length - 1;
    if (matches === 1) html = html.replace(before, after);
    else if (matches !== 0 || !html.includes(after)) {
      throw new Error(`Unexpected guide notice count in ${file}: ${matches}`);
    }
  }
  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed++;
  }
}

console.log(`Normalized first-30-day notices in ${changed}/30 guides`);
