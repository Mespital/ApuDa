# ApuDa SEO·GEO·마케팅 실제 페이지 AI 사전점검

검토일: **2026-11-10 (Asia/Seoul)**
방식: 공개 페이지 브라우저 관찰 + GitHub `main` 소스 정적 점검 + 기존 자동 검사 결과
연계: 개발용 초안 PR #291 (`feat/apuda-seo-geo-marketing-skills-20261110`)
배포: **이 문서는 진단 기록이며 운영 사이트의 코드·콘텐츠·설정을 변경하지 않는다.**

## 1. 범위와 검토 상태

- 대상: `/`, `/about/`, `/news/`, `/library/faq/lung/`, `robots.txt`, `sitemap.xml`, 30암종 FAQ 생성기 및 책자 SEO 메타데이터.
- 브라우저 확인: 공개 폐암 FAQ 100문항의 제목·canonical·기본 구조·출처 링크 수, 뉴스 페이지의 실제 로딩 결과, 운영 robots/sitemap. 사용자 로그인이나 환자 데이터는 사용하지 않음.
- 검색 서비스 측면: 일부 검색 결과 요약과 최신 공개 페이지를 대조했지만, 검색 서비스의 실제 인덱스/노출/CTR 자료(Google Search Console·네이버 서치어드바이저)는 **미제공·미검증**.
- AI 사전점검만 시행. 실제 전문의 12명, 기술·디자인 6명, 공통 의료·돌봄 4명, 환자 6명, 보호자 2명의 참여·승인을 주장하지 않음. 실제 참가자 시험 0명.
- 검토 책임 역할: D05(검색·기술·품질), D06(보안/개인정보), D03(독자 언어), S02(폐암 임상 정확성은 별도 전문의 검토 필요), M03·M04(환자 안전성/약료는 범위 외).

## 2. 확인된 장점

| 항목 | 실제 확인 | 한계 |
|---|---|---|
| 운영 `robots.txt` | `User-agent: *`, `Allow: /`, 메인 및 Farm 사이트맵 위치 선언 | 크롤러별 실제 수집 실적은 모름 |
| 운영 `sitemap.xml` | 정확히 85 URL: 책자 30개, 암종별 정적 FAQ 30개, FAQ 탐색 1개 및 기타 24개; `<lastmod>`는 0개 | 사이트맵 제출·색인 성공은 보장하지 않음 |
| 폐암 FAQ | 브라우저에서 정적 HTML 문항 100개, 출처 `<a>` 링크 114개, `lang=ko`, 제목/H1/canonical/설명 확인 | 링크 114개는 114개 유일 근거를 뜻하지 않음; 링크 내용의 의학적 정확성은 별도 |
| 공개 소개 페이지 | 현재 공개 `/about/`에서 30종, FAQ 각 100문항, 무료 핵심안내라고 표시 | 일부 검색 스니펫에는 이전 12종/DM 코드 정보가 남아 있으나 현재 사이트 오류로 볼 수 없음 |
| 기존 정적 검사 | `check-seo.mjs`: 85 URL/30권/30암종/3,000 FAQ PASS; `check-faq-medical-safety.mjs`: 30암종/3,000문항 PASS | 실제 임상 승인·검색 노출 실적과 다름 |

## 3. 확인된 문제 및 개선 우선순위

| ID | 위치 | 확인 근거 | 영향/분류 | 우선 | 개발 제안 | 소유/재검 |
|---|---|---|---|---|---|---|
| NEWS-01 | `/news/` | 2026-11-10 실제 로딩된 브라우저 제목·보고일 **2026-11-01**; GitHub `public-site/news/data/latest.json`도 `2026-11-01`; `last-run.json` 생성시각 2026-11-01 18:05 KST | ‘오늘의 뉴스’ 약속과 실제 데이터 간 **9일 차이**. 신뢰·재방문·검색 최신성 문제. 의료정보 오보를 뜻하지는 않음 | **P1** | 데이터 수집→저장소 반영→배포 흐름을 분리 점검. 데이터가 24시간(정책에 따라 조정) 이상 낡으면 ‘오늘’ 배지를 자동 숨기고 마지막 갱신일·상태를 명확히 표시. 운영 게시·배포는 별도 승인 후 | D05; 실제 데이터 갱신시각·브라우저 타이틀·기사기간 자동 검사 |
| NEWS-02 | `/news/` 주요 기사 선정 | 2026-11-01자 상위 5개 중 1위 **식의약가족 테니스대회**가 ‘약가’로 분류되고, 5위가 **부고**; 브라우저 실측 | 질병·약제·정책 뉴스 탐색 목적과 일부 선정/분류 불일치. 환자 관점 신뢰 저하 | **P1** | 의료·환자 영향도 및 기사 유형 필터(행사·부고 제외), 오분류 탐지, 출처 다양성, 1차 근거 확인 단계 추가. 샘플 5개를 전체 정확도로 일반화하지 않음 | D03·D05·M04; 30일 표본에 대한 블라인드 유형/관련성 재평가 |
| GEO-01 | `/news/` | 네트워크에서 처음 내려온 HTML의 주요 본문은 ‘불러오는 중’ 텍스트이고, JavaScript 실행 후 기사 목록이 표시됨. 검색의 텍스트 보기에서도 초기 상태가 노출됨 | 일부 크롤러/AI 검색 시스템에서 핵심 뉴스의 발견·인용이 어려울 수 있음 (**성능 위험, 색인 실패 확정 아님**) | **P2** | 최신 브리핑의 날짜·요약·상위 기사와 직접 출처를 정적 HTML로 제공하거나 날짜별 읽기 전용 정적 페이지 생성. 기존 JS 인터랙션은 유지 | D05; JS 비활성 상태·Google URL 검사 도구·브라우저 재검 |
| SEO-01 | FAQ 필터 `/library/faq/?cancer=...` | `build-seo.mjs`가 클라이언트 JS로 canonical 링크를 암종별 정적 FAQ URL로 변경. Google은 HTML 소스의 canonical을 우선 권장 | 대표 URL 통합 신호의 잠재적 불확실성 | **P2** | 필터 URL과 정적 URL의 의미·중복 정도를 명시하고 서버 HTML의 canonical 또는 링크 이동 방식으로 단일화. JS로 복수 canonical 선언하지 않도록 검사 | D05; 원본 HTML/렌더링 HTML/canonical 대조 |
| GEO-02 | `/library/first30/books/*.html` | 현행 Article JSON-LD는 `headline`, `mainEntityOfPage`, `inLanguage`, `publisher`만 포함하며 실제 저자 및 `dateModified`가 없음 | 문서의 수정 시점·책임 범위에 대한 기계 판독 단서 부족. 결과 순위를 직접 예측할 수 없음 | **P2** | 실제 책임 있는 저자/기관 및 확인된 수정일만 작성·검증한 뒤 JSON-LD 보강. 임상 승인되지 않은 문서에 의사 저자를 허위 기재하지 않음 | D05·S01~S12; 구조화 데이터 검증·실제 승인 기록 대조 |
| SEO-02 | `/sitemap.xml` | 운영 사이트맵 85개 URL 모두 `<lastmod>` 없음 | 개정 문서의 변경 시점 전달 단서 미비(선택 필드) | **P3** | 내용이 실제 변경된 날짜를 소스 관리에서 정확히 추적할 수 있을 때만 `<lastmod>` 추가. 매번 빌드 시각으로 갱신 금지 | D05; 값과 실제 문서 변경 기록 대조 |
| SEO-03 | `/note/` | 공개 사이트맵에 환자 기록 앱 진입 URL 포함. `/note-v4/`, `/nonsul/`과 달리 `/note/`는 Netlify `noindex` 설정이 없음 | 노트 **앱 화면** 검색 노출 가능성. 실제 환자 기록 노출의 증거는 전혀 없음 | **P2** | 브랜드 검색으로 앱 진입을 허용할지, 전용 안내 페이지를 색인하고 앱 셸은 `noindex`할지 정책 결정. 개인 기록/로컬스토리지 접근·테스트 금지 | D05·D06; URL 인덱싱 정책·응답 헤더 확인 |
| MARKETING-01 | 외부 검색 결과 요약 | 일부 검색 요약에는 과거 12종·DM 코드가 표시되지만 2026-11-09 크롤한 실제 `/about/`은 30종 무료 안내로 수정됨 | 검색 결과의 **오래된 캐시일 가능성**. 운영 사이트의 현재 결함으로 확정하지 않음 | **모니터** | Search Console에서 URL 검사·재색인 요청 필요성 검토; 실제 사이트 문구를 과거로 되돌리지 않음 | D03·D05; 색인된 HTML/스니펫 관찰 |

## 4. 보안·기능 중복·충돌 판정

- 새 스킬은 `.claude/skills/apuda-seo`, `apuda-geo`, `apuda-marketing`의 문서형 워크플로이며 자체 크롤러·수집 프로그램·외부 자동 업로드를 포함하지 않는다.
- 현행 `build-seo.mjs`, `check-seo.mjs`, 의료 FAQ 검사, 30종 서재, Netlify 설정, 환자·논술 기록 로직을 변경하지 않았다.
- 이번 검토에서는 공개 페이지의 메타데이터와 인용 링크만 확인했으며, 로그인·백업·삭제·복구 시험은 **NT(미시험)**.
- GEO 최적화는 AI 검색 순위 보장이나 `llms.txt` 자동 도입으로 취급하지 않는다. 기존 SEO의 기술적 접근성·유용한 본문·검증 가능한 출처가 우선이다.

## 5. 30인 감수 프레임워크 적용 상태

| 역할 | 담당 암종 | 이 감사에서의 임상 검토 | 실제 책임전문의 승인 |
|---|---|---|---|
| S01 | 유방암 | SEO 메타/샘플 구조만 점검, 임상 내용 NT | 증거 없음·대기 |
| S02 | 폐암 | FAQ 100문항과 출처 링크 수 관찰, 임상 내용 NT | 증거 없음·대기 |
| S03 | 위암 | 범위 밖 | 증거 없음·대기 |
| S04 | 대장암 | 범위 밖 | 증거 없음·대기 |
| S05 | 갑상선암 | 범위 밖 | 증거 없음·대기 |
| S06 | 신장암 | 범위 밖 | 증거 없음·대기 |
| S07 | 전립선암 | 범위 밖 | 증거 없음·대기 |
| S08 | 췌장암 | 범위 밖 | 증거 없음·대기 |
| S09 | 담도암 | 범위 밖 | 증거 없음·대기 |
| S10 | 간암 | 범위 밖 | 증거 없음·대기 |
| S11 | 림프종 | 범위 밖 | 증거 없음·대기 |
| S12 | 자궁경부암 | 범위 밖 | 증거 없음·대기 |

공통 M03–M06, 디자인·기술 D01–D06, 환자 P01–P06, 보호자 C01–C02 역할을 검토 관점으로만 사용했으며 실제 30명 참여가 아니다. 필수 임상·사용자 과제 T01–T08은 NT이므로 **전체 100점 평가·합격 판정을 산출하지 않는다**.

## 6. 권고 작업 순서(운영 배포 미승인)

1. **NEWS-01/02 P1**: 수집·게시 타임스탬프 불일치와 뉴스 유형 분류 원인 진단 → 격리된 테스트 데이터로 회귀 검사.
2. **GEO-01 P2**: 뉴스 정적 요약 및 날짜별 고정 링크 설계 → 검색 엔진과 일반 브라우저 모두 본문 접근 가능성 테스트.
3. **SEO-01/GEO-02/SEO-03 P2**: canonical, JSON-LD, 환자 노트 색인 정책을 각각 별도 변경으로 검토.
4. **SEO-02 P3**: 정확한 변경일 추적이 구현될 때만 `lastmod` 적용.
5. Google Search Console·네이버 서치어드바이저 등 실제 데이터가 연결되면 기준선(색인 URL·클릭·노출·CTR·순위) 측정 후 효과를 평가.

## 7. 근거 목록

### 2026-11-10 공개 사이트 실제 관찰

- `https://apuda.app/library/faq/lung/` — 제목, canonical, 100개 `details`, 114개 출처 링크, 최종 자료 업데이트 2026-11-06.
- `https://apuda.app/news/` — JS 초기 로딩 상태와 브라우저 완성 상태 비교, 최종 보고일 2026-11-01, 상위 기사 선정 내용.
- `https://apuda.app/robots.txt` — 공개 정책과 사이트맵 주소.
- `https://apuda.app/sitemap.xml` — 총 85 `<url>`, `<lastmod>` 0, 암종별 FAQ 페이지 30개와 책자 30개.
- `https://apuda.app/about/` — 실제 공개 본문 기준 30암종 무료 안내.

### 저장소 소스 및 공식 기술 문서

- GitHub `main` 기준: `public-site/scripts/build-seo.mjs`, `public-site/netlify.toml`, `public-site/news/data/latest.json`, `public-site/news/data/last-run.json`, `public-site/about/index.html`.
- Google Search Central, [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) — HTML 초기 본문과 JS 렌더링 차이.
- Google Search Central, [Canonical URL best practices](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) — 원본 HTML canonical 권장.
- Google Search Central, [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) — 작성자·수정일 기계 판독.
- Google Search Central, [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — `<lastmod>`의 정확성 요구.
- Google Search Central, [AI Search features guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — 기존 SEO 원칙 우선.

**이 문서는 SEO/GEO 기술·편집 진단이다.** 임상 내용이 정확한지, 의약품 허가·급여가 최신인지, 검색 순위가 실제 개선되는지, 실제 환자가 쉽게 이용하는지는 별도의 전문의 승인·데이터 접근·사용성 시험이 필요하다.
