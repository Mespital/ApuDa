# SEO-11 — GitHub Draft PR의 SEO·노트 색 대비 자동검사

- 작성일: 2026-11-11 (KST)
- 대상: `.github/workflows/apuda-seo-contrast.yml`, `public-site/scripts/check-seo.mjs`
- 범위: `Mespital/ApuDa`의 개발 브랜치 `feat/apuda-seo-geo-marketing-skills-20261110`, Draft PR #291
- 배포 상태: `main` 미병합, 운영 Netlify 배포·VPS 작업 없음

## 구현

`main`을 대상으로 하는 `pull_request` 중 `public-site/**` 또는 이 검사 워크플로 파일을 변경한 PR에서 GitHub Actions가 정적 검사 작업을 실행한다. 문서만 변경한 커밋에는 경로 필터에 따라 실행되지 않을 수 있다.

| 항목 | 설정 |
|---|---|
| 워크플로 | `ApuDa SEO and note contrast` |
| 작업 | `Static SEO and contrast` (`ubuntu-latest`) |
| Node.js | 22 (`actions/setup-node@v4`) |
| 소스 체크아웃 | `actions/checkout@v4`, `persist-credentials: false` |
| GitHub 토큰 권한 | `contents: read`만 부여 |
| 시간 제한 | 5분 |
| 문법 검사 | `node --check public-site/scripts/check-seo.mjs` |
| 본 검사 | `node public-site/scripts/check-seo.mjs` |

배포 명령, 서버 접속, 비밀값 사용, 환자 데이터 읽기·쓰기, 문서 삭제 작업은 없다. **단, PR CI를 추가한 것 자체가 저장소의 브랜치 보호 또는 필수 상태 검사(required check)를 설정하지는 않는다.** 이를 강제하려면 GitHub 저장소 관리자 권한으로 별도 설정해야 한다.

## 실제 실행 증거

- 변경 커밋: [`50d6c0c3f2b9a2e17ee638896194d3fa4a0d3b30`](https://github.com/Mespital/ApuDa/commit/50d6c0c3f2b9a2e17ee638896194d3fa4a0d3b30)
- GitHub Actions 실행: [Run #42943177427](https://github.com/Mespital/ApuDa/actions/runs/42943177427)
- 트리거: `pull_request`; 완료 상태: **`success`** (2026-11-11 UTC 02:02:31 기준)
- 실제 작업 `Static SEO and contrast`: **`completed / success`**
- `Checkout PR merge snapshot`, `Use Node.js 22`, `Check JavaScript syntax`, `Verify SEO, FAQ counts, and note-guide contrast`: **각 단계 `success`**

검사 스크립트에서 확인한 정적 소스 범위:

| 점검 대상 | 결과 |
|---|---:|
| 노트 안내 화면의 글자 대비 | 17/17 통과 (보통 글자 4.5:1) |
| 지정된 초점 표시 대비 | 6/6 통과 (3:1) |
| 사이트맵 URL | 85개 |
| 안내서 | 30권 |
| 정적 FAQ 페이지 | 30개 |
| 암종별 FAQ | 총 3,000문항 |

위 수치는 스크립트의 **정적 회귀 검사 범위**이지 모든 화면의 WCAG 2.2 AA 인증이나 FAQ의 임상적 타당성 인증이 아니다. 모바일 실기기, 스크린리더, 환자·보호자 사용성 시험은 별도 필요하다.

## ApuDa 감수 역할별 AI 사전점검

- **D04 접근성:** 4.5:1/3:1 임계값 검사와 PR 실행 경로 확인. 정적 색 선언 외 실제 렌더링은 NT(Not Tested).
- **D05 개발·품질:** 문법 및 SEO 스크립트가 실제 GitHub 러너에서 성공, 실패 시 잡이 실패하도록 연결됨.
- **D06 개인정보·보안:** 최소 권한 `contents: read`, 체크아웃 인증정보 비영속화, 비밀값 및 운영 시스템 접근 없음.
- **D02 UI:** 현재 팔레트 회귀 확인 가능. 시각적 외관이나 치료 경험 개선 여부는 별도 검토 필요.
- **S01–S12 임상 책임자 등:** 의료내용 개정·임상감수를 이 변경에 포함하지 않음. 실제 전문의·사용자 참가자 **0명**, 임상 승인 **미실시**.

**판정: P2 개발 품질 — PR 자동검사 연결 및 실운영 러너 통과 확인.** 환자·논술 원본 데이터, 안내서 본문 및 FAQ 데이터는 이 작업에서 변경하지 않았다. Draft PR은 그대로 유지한다.

## 참고

- [GitHub Actions `pull_request` 이벤트 및 경로 필터](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)
- [GitHub Actions 워크플로 문법과 최소 권한](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)
- [SEO-10 정적 대비 검사 기록](./2026-11-11-seo-note-contrast-regression.md)
