# SEO-12 — `main` 필수 상태 검사 준비도와 병합 보호 사전점검

- 검토일: 2026-11-11 (KST)
- 대상: 공개 GitHub 저장소 `Mespital/ApuDa`, `main` 브랜치, 개발 브랜치 `feat/apuda-seo-geo-marketing-skills-20261110`, Draft PR #291
- 방식: GitHub REST API 응답·GitHub Actions 실실행 결과·워크플로 정적 점검에 기반한 **AI 기술 사전검토**
- 참여: 실제 전문가 0명, 실제 환자·보호자 0명, 임상 승인 0건 (감수팀 D05 개발·품질 및 D06 보안·운영 관점 중심)

## 가장 중요한 확인 사실

| 항목 | 관찰 | 해석 |
|---|---|---|
| `GET /branches/main` | `protected: false`, `protection.enabled: false`, `required_status_checks.enforcement_level: off`, `contexts: []`, `checks: []` | `main`의 브랜치 보호 및 필수 검사 강제가 관찰되지 않음 |
| `GET /rulesets?includes_parents=true` | 빈 배열 `[]` | 조회 가능한 저장소/상속 규칙 집합이 없음 |
| `GET /branches/main/protection` | HTTP 403 `Resource not accessible by integration` | 연결 권한으로 상세 보호 설정 조회 불가. 위 두 읽기 결과와 구분 |
| 기존 SEO-11 워크플로 | `pull_request`의 `paths` 필터 지정 | 이를 required check로 직접 선택하면 무관한 파일만 바뀐 PR에서 Pending이 지속할 위험 |
| Draft PR #291 | `draft: true`, `merged: false` | 이 작업에서는 병합·운영 배포하지 않음 |

**운영상 주요 위험(P1·품질 게이트):** 현재 SEO 검사 결과가 자동으로 나오더라도 `main`의 병합 필수 조건이 아니다. 이 관찰은 실제 잘못된 코드가 병합되었다는 증거는 아니며, 병합 차단 장치가 구성되지 않은 상태를 뜻한다.

## 개발 브랜치에서 수행한 안전한 보완

`.github/workflows/apuda-seo-contrast.yml`의 `pull_request` 대상 `main` 조건은 유지하고 `paths` 필터를 제거했다. 따라서 **문서만 바뀌는 PR도** 같은 이름의 정적 검사를 보고할 수 있다. 이후 Merge Queue 도입에 대비해 `merge_group` 이벤트를 추가했으나 실제 대기열을 만들거나 켜지는 않았다.

불변 조건:

- `permissions: contents: read`(최소 권한)
- Node.js 22, `actions/checkout@v4`의 `persist-credentials: false`
- 5분 제한, JavaScript 문법검사 및 `public-site/scripts/check-seo.mjs`만 실행
- Netlify 배포, VPS 접속, 환자 기록·논술 기록 접근·변경, GitHub secrets 사용 없음

**실행 검증:** 변경 커밋 [`327c8bdafd9c2c60429c3f779a82f8eed3aa586d`](https://github.com/Mespital/ApuDa/commit/327c8bdafd9c2c60429c3f779a82f8eed3aa586d)에서 [GitHub Actions 실행 #42944027518](https://github.com/Mespital/ApuDa/actions/runs/42944027518)은 `pull_request / completed / success`였다. 로컬 YAML 파싱·트리거 검사와 정적 SEO 검사도 통과했다: 텍스트 대비 17/17, 초점 표시 6/6, 사이트맵 85 URL, 안내서 30권, FAQ 30페이지·3,000문항.

이 워크플로의 변경은 **필수 검사 지정 자체가 아니다.** `main` 보호 설정은 업데이트하지 않았으며, 자동 검사만으로 병합 강제가 시작되지는 않는다.

## 다음 관리자가 승인해야 할 작업 (현재 미실시)

1. GitHub `Settings → Branches` 또는 `Settings → Rules → Rulesets`에서 `main` 대상 규칙을 신설할지 결정한다.
2. 필수 상태 검사에 정확히 **`Static SEO and contrast`** 작업을 지정한다. 다른 앱에서 같은 이름을 쓰지 않도록 상태 출처도 확인한다.
3. 필요 시 승인된 PR 리뷰, 선형 이력, 대기열, 관리자 예외 정책 등은 별도로 설계한다. 봇을 포함한 자동 병합·직접 푸시 영향 평가가 선행되어야 한다.
4. 설정 후 *실제* 필수 검사 실패 사례에서 병합 차단 여부와 복구 경로를 시험한다. 프로덕션 데이터·`main`을 대상으로 위험한 시험을 하지 않는다.

## 남아 있는 미검증 항목

- 브랜치 보호 상세 설정 조회: **NT — GitHub App의 403 권한 제한**. 현재 `main`의 `protected: false` 및 rulesets 조회로 미설정 상태를 교차 확인했으나 관리자 화면은 확인하지 못함.
- Merge Queue 이벤트: **NT — 대기열을 실제 가동하지 않음**.
- 문서 전용 커밋의 새 자동검사: 이 기록의 최초 작성 시점에는 **별도 실행 결과 미확인**. PR Actions의 후속 실행으로 확인할 것.
- 필수 검사 실패 시 병합 차단: **NT — 보호 규칙을 설정하지 않아 시험하지 않음**.
- 전체 WCAG 적합성·임상 콘텐츠 정확성·환자 사용자 시험: **범위 외**. 30인 역할표와 실제 참여를 혼동하지 않음.

## 판정과 우선순위

- **P1: `main` 보호 규칙 및 필수 검사 미설정** — 저장소 관리자 승인 후 별도 단계에서 처리.
- **P2: 경로 필터로 인한 필수 검사 미실행 가능성** — 개발 브랜치의 워크플로 수정 및 실제 PR 실행 통과.
- AI 전체 서비스 점수: **산정하지 않음** (임상·실기기·사용성 필수 항목 NT).
- 운영 상태: **Draft PR 유지, `main` 미병합, Netlify 프로덕션 미배포, VPS 미접근**.

## 공식 근거

- [GitHub Docs — Troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [GitHub Docs — Status checks](https://docs.github.com/en/pull-requests/reference/status-checks)
- [GitHub Docs — Merge queue and `merge_group`](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
- [SEO-11 자동검사 증거](./2026-11-11-seo-note-contrast-pr-ci.md)
