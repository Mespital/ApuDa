# SEO-14 — Draft PR #291 안전 분리 매니페스트

- 확인일: 2026-11-11 (KST)
- 원본: [Mespital/ApuDa Draft PR #291](https://github.com/Mespital/ApuDa/pull/291), HEAD `253d264a3b76ded1b7d14102f94d54d3b06288b1`
- 확인 시점 `main`: `890d1480822d4b2c827ce9cd9fce742fbbe95622` (실제 분리 직전에 다시 확인)
- 방법: GitHub 전체 변경 파일 72개의 경로 분류 및 핵심 파일 patch·워크플로 트리거 정적 검사. 실제 전문가/사용자 0명. ApuDa D05·D06 관점의 AI 사전검토.
- 현재 상태: **원본 PR 보존 / 신규 브랜치·PR 미생성 / main 미병합 / Netlify 프로덕션·VPS 미실행**

## 1. 파일별 분할 기준

| 그룹 | 구성 | 개수 |
|---|---|---:|
| A — SEO·노트 안내 | `public-site/library/first30/books/01.html`~`30.html` | 30 |
| A | `docs/reviews/`의 SEO 관련 감수 기록 (뉴스 감수 2건 제외) | 14 |
| A | 아래 공개 사이트 기타 9개 | 9 |
| A | `.claude/skills/apuda-{seo,geo,marketing}/SKILL.md` | 3 |
| A | `.github/workflows/apuda-seo-contrast.yml` | 1 |
| **A 소계** | SEO 전용 신규 Draft PR 후보 | **57** |
| B — 뉴스봇·VPS | `automation/news-bot/` 변경 파일 | 8 |
| B | 뉴스 페이지 HTML·CSS·JS | 3 |
| B | 뉴스 관련 감수 기록 | 2 |
| B | `.github/workflows/deploy-news-vps.yml` | 1 |
| B | `tests/news-freshness.test.cjs` | 1 |
| **B 소계** | 뉴스·VPS 전용 신규 Draft PR 후보 | **15** |
| **검증** | **57 + 15 = 72**, 중복·누락 **0** | **72** |

### A의 공개 사이트 기타 파일 9개

```text
public-site/community/index.html
public-site/index.html
public-site/library/faq/index.html
public-site/netlify.toml
public-site/note-guide/index.html
public-site/note/index.html
public-site/scripts/build-seo.mjs
public-site/scripts/check-seo.mjs
public-site/sitemap.xml
```

### B의 정확한 15개 파일

```text
.github/workflows/deploy-news-vps.yml
automation/news-bot/README.md
automation/news-bot/build_static_briefing.py
automation/news-bot/editorial_quality.py
automation/news-bot/install-vps.sh
automation/news-bot/news_bot.py
automation/news-bot/publish.sh
automation/news-bot/test_editorial_quality.py
automation/news-bot/test_static_briefing.py
docs/reviews/2026-11-10-news-p1-dev-fix.md
docs/reviews/2026-11-10-news-p2-geo-static.md
public-site/news/freshness.js
public-site/news/index.html
public-site/news/styles.css
tests/news-freshness.test.cjs
```

## 2. 동작 의존성 검증

| 관계 | 실제 patch에서 확인한 사실 | 분리 원칙 |
|---|---|---|
| 뉴스 정적 요약 생성 → 뉴스 HTML | `build_static_briefing.py`는 `APUDA_NEWS_SNAPSHOT_START/END` 마커가 없으면 실패 | `public-site/news/index.html`은 B에 포함 |
| 게시 스크립트 → 생성 스크립트 | `publish.sh`가 `build_static_briefing.py`를 실행하고 뉴스 HTML을 `git add` | 둘 모두 B |
| 생성 스크립트 → 품질 필터 | `build_static_briefing.py`가 `editorial_quality` import | 둘 모두 B |
| 뉴스 UI → 신선도 검사 | HTML은 `/news/freshness.js`와 새 CSS를 사용 | 뉴스 HTML·CSS·JS·테스트 모두 B |
| SEO 메타·사이트맵 → 책자/FAQ | `build-seo.mjs`, `check-seo.mjs`, 30권 HTML 및 sitemap이 연계 | A에 묶고 85 URL·30권·FAQ 3,000문항 재검 |
| `push main` → VPS | `deploy-news-vps.yml`이 뉴스봇/워크플로 변경에 반응하고 SSH·`rsync --delete`·cron·발행 단계 수행 | B는 VPS 운영 승인 전 **병합 금지** |

`public-site/news/index.html`의 SEO용 정적 요약도 뉴스 생성기와 결합되어 있으므로 B에 둔다. `.claude/skills`는 검색·마케팅 지침이며 VPS 뉴스봇의 직접 실행 의존 파일이 아니므로 A에 둔다.

## 3. 두 개의 Draft PR로 분리할 때의 안전 순서 (아직 실행하지 않음)

1. 원본 PR #291과 기존 브랜치를 보존한다. 원본을 닫거나 강제 푸시·리셋·파일 삭제하지 않는다.
2. **실행 직전** PR HEAD, 최신 `main`, 전체 변경 파일 목록을 다시 조회한다. 72개에서 달라지면 매니페스트를 재작성한다.
3. 로컬 사용자의 **미커밋 작업트리와 별도로** 임시 작업트리/새 브랜치를 생성한다. `main`의 최신 파일을 통째로 이전 버전으로 덮지 말고 파일별 패치를 적용하며, 충돌 시 중단한다.
4. SEO 후보 `feat/apuda-seo-site-isolated-20261111`에는 A의 **57개만** 포함한다.
5. 뉴스 후보 `feat/apuda-news-vps-isolated-20261111`에는 B의 **15개만** 포함한다. VPS 동작은 PR 생성이 아니라 `main` 병합 시 자동 시작될 수 있으므로 Draft를 유지한다.
6. 재비교에서 **A∩B=∅**, **A∪B=원본 변경 72파일**, 충돌 없는 3-way 적용 여부를 확인한다. 새 `main` 변경과 겹치면 수동 해결 전 중단한다.
7. A는 `node --check public-site/scripts/check-seo.mjs` 및 `node public-site/scripts/check-seo.mjs`와 Netlify 미리보기·모바일·비파괴 기록 시험을 수행한다.
8. B는 Python 뉴스봇 단위 테스트, `node --test tests/news-freshness.test.cjs`, 문법 검사, 가상 뉴스 JSON으로 HTML 마커/생성 결과 검증을 수행한다. 실제 VPS 접속·뉴스 발행 금지.
9. 두 신규 PR이 Netlify Deploy Preview를 추가 생성할 수 있으므로 무료 요금제 사용량과 `apuda-total`·`future-compass` 연결 영향을 먼저 확인한다.
10. `main` 브랜치 보호·필수 검사 미설정과 환자·논술 데이터 보존 미시험, 실제 임상·사용자 감수 미실시를 **NO-GO**로 유지한다. 분리 PR 생성도 운영 배포 승인이 아니다.

## 4. 검증 상태와 한계

- **PASS (정적 사전분류):** 57/15, 중복·누락 0; 뉴스 생성기와 게시 페이지의 핵심 의존성 B로 함께 배정.
- **NT:** 새 Draft PR의 CI·Netlify 미리보기, 병합 충돌 검증, Merge Queue, VPS 환경 승인 설정, 데이터 보존의 실기기 확인.
- **P1:** 현재 `main` 보호 규칙 미설정 및 뉴스봇 VPS 배포 혼재. 새 뉴스 PR의 운영 병합은 별도 명시적 승인 필요.
- **임상:** S01–S12 각 암종 책임전문의 실제 승인 없음. 환자 P01–P06/보호자 C01–C02 실제 시험 없음. 역할표 30개가 실제 30인 감수를 뜻하지 않음.

**결론:** 분리할 파일 집합은 확인했지만 분리한 코드의 런타임 독립성과 실제 병합 안전성은 아직 검증되지 않았다. 신규 브랜치·PR 생성, 기존 PR 변경, 운영 배포는 하지 않는다.

## 근거

- [PR #291 파일 변경 내역](https://github.com/Mespital/ApuDa/pull/291/files)
- [SEO-13 배포 사전승인표](./2026-11-11-seo-pr291-release-gate.md)
- [GitHub Actions SEO 검증](https://github.com/Mespital/ApuDa/actions/runs/42945186128)
- [Netlify Deploy Preview 공식 설명](https://docs.netlify.com/deploy/deploy-types/deploy-previews/)
