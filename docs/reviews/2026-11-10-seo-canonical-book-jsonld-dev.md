# ApuDa SEO-01/GEO-02 개발 브랜치 개선·검증

검토일: 2026-11-10 KST

대상: `Mespital/ApuDa`, Draft PR #291의 개발 브랜치

상태: **운영 배포·main 병합·Netlify/VPS 작업 없음**

## 1. SEO-01 FAQ Canonical 일관성

기존 `/library/faq/` 원본 HTML에는 `https://apuda.app/library/faq/` 자체 Canonical이 있었다. `build-seo.mjs`가 추가한 클라이언트 스크립트는 `?cancer=lung`과 같은 파라미터를 읽어 실행 후 Canonical을 `/library/faq/lung/`으로 바꿨다. 즉 한 문서의 초기 HTML과 렌더링 후 Canonical 값이 달랐다.

수정:

- **탐색형 FAQ 앱** `/library/faq/`는 검색·필터가 가능한 인덱스로 유지하고, HTML 원본의 대표 URL `/library/faq/`을 그대로 사용.
- 암종별 30개 **독립 정적 문서** `/library/faq/{slug}/`의 자기 참조 Canonical은 변경하지 않음.
- `?cancer=` 필터·암종 선택·질문 데이터·링크·화면 로직 수정 없음.
- 빌드 과정은 기존 `APUDA SEO CANONICAL` 스크립트를 제거하되 다시 삽입하지 않음. 같은 코드를 여러 차례 실행해도 결과가 일관되도록 구성.

근거: [Google Search Central — Canonical 권장사항](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)은 HTML 소스의 대표 URL을 명확히 하고 JavaScript가 그 값을 변경하지 않도록 권고한다. 이는 검색 랭킹 향상을 보증하는 조치가 아니다.

## 2. GEO-02 30권 책자 JSON-LD 설명 보강

기존 30권 정적 문서의 `Article` JSON-LD는 제목, 문서 주소, 한국어, ApuDa 발행기관만 담고 있었다. 변경 후에는 실제 표지·문서에서 확인할 수 있는 브랜드 출처와 문서 성격을 사용한다.

| 속성 | 수정된 값 및 검증 기준 |
| --- | --- |
| `author` | `Organization` / `ApuDa` — 브랜드 발행 자료의 조직 저작 주체. 의사 개인 저자를 생성하지 않음 |
| `publisher` | `Organization` / `ApuDa` 기존 값 유지 |
| `description` | 해당 권의 검증된 HTML 메타 설명과 동일한 본문 설명 |
| `isAccessibleForFree` | `true` — 기존 30권 무료 안내서 표시와 일치 |
| `articleSection` | `환자교육` — 문서의 명시된 교육용 목적 |
| `dateModified` / `datePublished` | **미기재** — 권별 실제 개정·발행 시점에 대한 출처 기록이 아직 없어 추정하지 않음 |
| `reviewedBy` 및 의사 `Person` 저자 | **미기재** — 전문의별 실제 승인 자료 없음 |

근거: [Google Search Central — Article 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/article). 구조화 데이터는 문서 의미 해석을 돕지만 임상 승인·검색 노출·상위 노출을 보장하지 않는다.

## 3. 파일 및 데이터 안전성

- `public-site/scripts/build-seo.mjs`의 생성 규칙만 수정.
- `public-site/scripts/check-seo.mjs`에 FAQ 단일 Canonical/30권 JSON-LD 진위 조건 검사 추가.
- 생성된 FAQ 인덱스 **1개 파일에서 Canonical 변경 스크립트 3줄 삭제**.
- 생성된 책자 **30개 파일에서 JSON-LD 메타 한 줄씩 변경**. 의학적 본문·표지·인쇄용 구조·진료 기록지는 변경하지 않음.
- 모든 원본 `public-site/library/faq/data/*.json` 파일, 사이트맵 85 URL, 환자·논술 기록, Netlify 배포·요금제 설정 변경 없음.

## 4. 개발 환경 오프라인 검사

| 검사 | 확인 결과 |
| --- | --- |
| `node public-site/scripts/build-seo.mjs` | PASS: 30권 / FAQ 30암종 / 사이트맵 85 URL |
| `node public-site/scripts/check-seo.mjs` | PASS: 30권 고유 Canonical, 30 FAQ 정적 Canonical, FAQ 3,000문항, 새 JSON-LD 검사 |
| `node public-site/scripts/check-faq-medical-safety.mjs` | PASS: 30암종 / 3,000문항 / 유효 출처 링크 3,628개 / 실제 임상 승인 별도 |
| JavaScript 구문·Git whitespace | PASS |
| Search Console, Naver, 실제 색인·검색 노출/CTR 측정 | **NT(미시험)** |
| 실제 임상전문의/환자·보호자 감수 | **NT(미시험)** |

## 5. 배포 전 별도 확인 조건

1. 검색엔진의 실제 정적 HTML 수집·대표 URL 선택은 Search Console/네이버 서치어드바이저의 URL 검사로 확인.
2. 책자별 정확한 발행일과 수정일은 편집 이력 관리 규칙과 원문 승인 기록이 확립될 때만 추가.
3. 환자·보호자 사용성 및 암종별 임상 내용은 실제 책임 있는 검토자가 평가해야 하며, 현재의 AI 사전검사를 전문의 승인으로 표시할 수 없음.
4. PR #291은 Draft로 유지. `main`/VPS/Netlify 운영 배포 금지.
