# ApuDa SEO-04 — 암환자 노트 공개 소개 페이지 (개발 전용)

작성일: 2026-11-10 (KST)  
브랜치: `feat/apuda-seo-geo-marketing-skills-20261110` / Draft PR #291  
범위: 정적 소개 페이지·탐색 링크·사이트맵·SEO 회귀 검사. **운영 배포 없음.**

## 목표

기존 환자 기록 앱 `/note/`에는 SEO-03에서 `noindex`를 적용했다. 치료 중인 환자가 검색에서 실제 앱 화면과 개인 기록 입력 영역에 곧바로 진입하는 것보다, 공개 안내를 먼저 읽을 수 있도록 **검색 가능한 정적 페이지 `/note-guide/`**를 마련한다.

`/note-guide/`는 `/note/`와 중복된 화면이나 두 번째 기록 저장소가 아니다. 비로그인 안내/사용법/주의사항 페이지이며 실제 개인 데이터를 입력받지 않는다.

## 적용 변경

1. `public-site/note-guide/index.html` 신규: 제목·설명·자체 canonical·OpenGraph·BreadcrumbList 구조화데이터, 모바일 대응 CSS, 정적 기능 설명과 수첩 열기 링크.
2. 환자 대상 정보를 포함: 체온·증상·복약·검사·일정·진료 질문·진료요약. 노트봇은 **규칙 기반 기록 보조**이며 진단·처방 기능이 아님을 명시.
3. 저장/백업 경계의 사실 확인: 로컬 브라우저 저장, Google Drive 앱 전용 백업은 사용자 선택, 로그인만으로 다중 기기 자동 동기화되지 않음. 내보낸 JSON **백업 파일이 암호화되지 않음**과 복원/보관 주의사항 표시.
4. `public-site/index.html`의 4층 노트 서비스 항목에 이용 안내 링크 추가. 기존 **노트 앱 실행 링크는 보존**.
5. `public-site/community/index.html`에 정적 내부 링크 추가해 JavaScript 실행 없이 안내를 발견할 수 있도록 함.
6. `build-seo.mjs`의 사이트맵에 `/note-guide/` 추가, `sitemap.xml` 재생성. **85개 공개 URL**, `/note/`는 제외. 근거 없는 `<lastmod>`는 계속 생략.
7. `check-seo.mjs`에 소개 페이지 canonical·사이트맵 등록·개인정보 입력 폼 부재·백업 설명·제3자 스크립트 부재·BreadcrumbList 일치 검사 추가.

## 환자 안전 및 보안 경계

- 소개 페이지에는 수집용 폼·쿠키 분석 SDK·외부 JavaScript를 추가하지 않았다. 구조화데이터는 정적 JSON-LD 한 개다.
- `/note/index.html`, `note-app.js`, `note-storage.js`, `apuda-backup.js`, 개인 기록 및 Google Drive 백업 데이터는 이번 작업에서 **수정·읽기·전송하지 않았다**.
- 이 소개 페이지는 노트 사용·검색 노출 정책을 설명한다. **개인정보 보안 감사, 의료기기 검증, 실제 임상감수 완료를 의미하지 않는다.**
- 환자 수첩의 전반적인 검색 유입은 공개 소개 페이지에서 확보하도록 설계한 것이며, 실제 검색 순위·트래픽 향상은 검증하거나 보장하지 않았다.

## 검증 및 배포 상태

- Node 사이트맵 생성 및 정적 SEO 검사: **85 URL / 30권 / FAQ 30개·3,000문항 PASS**.
- FAQ 의료 안전 자동 검사: 출처 링크 **3,628건 검사 PASS**. 개별 인용이 없는 항목 6개는 기존 추적 사항이며 실제 임상의 승인으로 간주하지 않음.
- Node 스크립트 문법과 `git diff --check`: PASS.
- 헤드리스 Chromium 시각 점검은 실행 환경의 브라우저 소켓 권한 제한으로 시작되지 않았다. **모바일 레이아웃의 실제 렌더링 검증은 미완료**이며, 향후 허용된 미리보기 환경에서 확인해야 한다.
- Netlify 운영 사이트 배포·운영 브랜치 병합·VPS 접속·기록 변경: **실행하지 않음**. PR의 자동 Deploy Preview는 운영 배포와 구별한다.

## 출처 및 UX 원칙

- Google Search Central, [사람에게 유용한 신뢰 가능한 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- Google Search Central, [canonical 지정](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- 기존 수첩 공개 소스의 저장/백업 고지: `public-site/note/index.html`, `note-app.js`, `apuda-backup.js`.
