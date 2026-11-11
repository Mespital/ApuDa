# ApuDa SEO-08 — 노트 공개 안내 `홈` 링크 클릭 영역 개선

- 검토·변경일: **2026-11-11 KST**
- 대상: `public-site/note-guide/index.html` / 개발 Deploy Preview `https://deploy-preview-291--apuda-total.netlify.app/note-guide/`
- 범위: `Mespital/ApuDa` **Draft PR #291** (`feat/apuda-seo-geo-marketing-skills-20261110`). 운영 사이트, `/note/` 환자 수첩, 암종별 의료 문구는 변경하지 않음.
- 감수 방식: `review-apuda`의 **AI 사전점검**, D02(디자인)·D04(접근성)·D05(개발/QA) 역할 관점. 실제 의료·디자인 전문가 및 환자·보호자 참여 **0명**. 30역할 프레임이 실제 30인의 참여를 의미하지 않음.

## 1. 배경·판단

앞선 [SEO-07 키보드·앵커 점검](2026-11-11-seo-note-keyboard-anchor-followup.md)에서 경로 표시(breadcrumb)의 `홈` 링크는 CSS 계산 크기 **약 12×44 CSS px**로 확인되었다. WCAG 2.2 AA 2.5.8은 일반적으로 **24×24 CSS px** 이상 또는 정의된 간격·인라인 등의 예외를 요구한다. 이 링크의 법정/표준 위반 여부는 예외 적용을 확인하지 않아 확정하지 않았다.

그럼에도 ApuDa의 내부 사용성 목표(중요 탐색 링크 **44×44 CSS px**)에 맞추면 저시력·손떨림·피로 등으로 작은 텍스트를 누르기 어려운 방문자에게 이득이 예상되어, 저위험 **P2 사용성 개선**으로 선택했다. 실제 환자 효과는 아직 검증되지 않은 가설이다.

## 2. 수정 사항

수정 파일 **1개**, 기존 `.crumb a` 규칙에서 `justify-content:center`와 `min-width:44px` **두 CSS 선언만 추가**했다.

```diff
-.crumb a{color:inherit;display:inline-flex;align-items:center;min-height:44px}
+.crumb a{color:inherit;display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px}
```

- 링크 텍스트·목적지(`/`)·색상·초점 윤곽선·의학/개인정보 안내 문구는 유지.
- 별도 JavaScript, 외부 패키지, 추적 스크립트, 환자 데이터 작업 없음.

## 3. 검증 결과

| 시험 | 변경 전 | 변경 후 실제 관찰 | 판정 |
|---|---|---|---|
| 일반 100% 확대 (1363 CSS px) | `홈` 폭 약 **12px**, 높이 44px | **44×44 CSS px**, `min-width:44px`, `justify-content:center` 실제 적용 | **PASS** |
| 400% 확대 (340 CSS px) | 가로 넘침 없음 | `홈` **44×44**, 경로 표시 높이 44px, 문서 폭 **337px ≤ 뷰포트 340px** | **PASS(해당 조건)** |
| 500% 확대 (272 CSS px) | 가로 넘침 없음 | `홈` **44×44**, 경로 표시 높이 44px, 문서 폭 **269px ≤ 뷰포트 272px** | **PASS(해당 조건)** |
| SEO 정적 검사 | 이전 PASS | `node public-site/scripts/check-seo.mjs` **PASS**: 85 URL, 30권 안내서, 30 FAQ 정적 페이지, 3,000문항; `/note-guide/` 공개·`/note/` noindex 유지 | **PASS** |
| `git diff --check` | 이전 PASS | 오류/공백 이슈 **0건** | **PASS** |

실제 Chromium 개발 미리보기에서 수정된 CSS와 레이아웃을 확인했고, 시험 후 확대를 **100%로 복원**했다. 단, 정확한 320 CSS px 프리셋, Android/iPhone 실제 터치, TalkBack/VoiceOver, 환자·보호자 시험은 **NT**이다. 272/340px에서 통과한 결과를 전체 WCAG 인증으로 표시하지 않는다.

## 4. 배포·승인 경계

- GitHub 개발 브랜치/Draft PR에만 반영. `main` 병합·운영 Netlify 배포·VPS 변경 **없음**.
- 배포 미리보기(Deploy Preview) 확인은 운영 배포와 구별한다. 기존 FAQ·책자·논술 기록과 실제 환자 노트 데이터는 **미수정**.
- 의료 정확성 및 모든 암종별 승인 상태는 변경 없이 **해당 분야 실제 검토 대기**. 실제 환자·보호자 검증 성공률 **산출 불가**.

## 5. 참고

- [W3C WCAG 2.2 — Target Size (Minimum), SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [W3C WCAG 2.2 — Reflow, SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- ApuDa `review-apuda` 감수 프로토콜: 44px 주요 조작 목표, 실제 참여·승인·NT 분리.
