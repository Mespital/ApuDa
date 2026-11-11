# ApuDa SEO-07 — 암환자 노트 공개 안내 키보드·앵커·의미 구조 점검

- 검토일: **2026-11-11 KST**
- 대상: [Netlify 개발 미리보기 `/note-guide/`](https://deploy-preview-291--apuda-total.netlify.app/note-guide/)
- 작업 범위: GitHub `Mespital/ApuDa` Draft PR [#291](https://github.com/Mespital/ApuDa/pull/291)의 공개 **안내 페이지**. 환자 수첩 `/note/`의 실제 입력·저장·복원은 범위 밖.
- 검토 방법: **실제 데스크톱 Chromium UI 조작**, 페이지 접근성 트리, 읽기 전용 DOM/계산 스타일 측정. 화면 확대는 100%로 복원한 상태에서 시작했다.
- 검토 모드: ApuDa 30역할 프레임의 **AI 사전점검**(특히 D01·D02·D03·D04·D05·D06). 실제 전문가 참여 0명, 환자·보호자 참여 0명, 임상 승인 없음. S01–S12의 암종별 의료 콘텐츠 승인과 무관.
- 연계: [SEO-05 모바일 접근성 사전점검](2026-11-11-seo-note-mobile-a11y-ai-precheck.md), [SEO-06 확대·재배치](2026-11-11-seo-note-reflow-zoom-followup.md).

## 1. 실제 키보드·앵커 실행 결과

| ID | 수행 | 실제 관찰 | 상태 |
|---|---|---|---|
| K01 | 숨겨진 `본문으로 바로가기` 링크에 키보드 초점 부여 | 초점을 받으면 링크가 화면 왼쪽 상단에 표시됨. 높이 **52 CSS px**, 주황색 **3px solid** 초점 윤곽선(`outline`) 측정 및 실제 스크린에서 확인 | **PASS(범위 한정)** |
| K02 | 건너뛰기 링크에서 `Enter` | 주소 해시 `#main-content`로 이동하고 활성 요소가 실제 `<main id="main-content">`로 변경됨 | **PASS** |
| K03 | 본문으로 이동한 뒤 `Tab` | 다음 본문 탐색 링크 `홈`으로 초점 이동. `outline`은 주황색 3px solid로 확인 | **PASS** |
| K04 | `기록 저장·백업 안내` 링크에서 `Enter` | 주소 해시 `#privacy`, 대상 섹션이 가시 영역으로 스크롤됨(`top ≈ 549 CSS px`) | **PASS(이동)** |
| K05 | 백업 안내로 이동한 직후 `Tab` | 섹션 내 `별도 노트 앱` 링크로 다음 키보드 초점 이동 | **PASS(실제 Chromium)** |
| K06 | 공개 안내 본문 구조 확인 | `header`, `main`, `footer`와 설명된 내비게이션 3곳, H1 **1개** 및 H2/H3의 일관된 제목 계층, ID **7개** 확인 | **PASS(정적/DOM 범위)** |
| K07 | 링크·FAQ 17개 요소의 계산된 크기 측정 | 모든 요소 높이는 **44 또는 약 52 CSS px**. 단, breadcrumb `홈`은 **폭 약 12px**로 24×24px 정사각형 기준에 미달. 주변 간격/본문 내 예외를 포함한 WCAG 2.5.8 판정은 **미확정** | **추가 판정 필요** |

주의: 개인정보 섹션의 일반 `#privacy` 링크 활성화 직후 `document.activeElement`는 **`BODY`**였으나, 그다음 `Tab`이 섹션 내 첫 링크로 이동했다. 따라서 키보드 이동은 실제로 동작했다. **실제 화면낭독기의 구역 제목 안내·초점 문맥까지 통과했다고 볼 수는 없다.**

## 2. 위험도와 남은 확인 항목

| ID | 유형 | 근거와 사용자 영향 | 등급/상태 | 담당 | 다음 재검 |
|---|---|---|---|---|---|
| A07-01 | 사용성 가설 | `#privacy` 이동 후 `BODY`가 활성 요소로 남는 상태에서, TalkBack/VoiceOver가 섹션 제목을 예측 가능하게 안내하는지 불명확 | **NT**, 미확인 가설. P2 후보(문제 재현 시) | D04·D05·D03 | 실기기 화면낭독기에서 링크 실행 후 현재 낭독 위치, 다음 탐색, 뒤로 복귀를 과제별로 기록 |
| A07-02 | 터치 타깃 예외 판정 | breadcrumb `홈` 폭 **약 12px**, 높이 **44px**. WCAG 2.2 AA 2.5.8은 일반적으로 24×24 CSS px 또는 간격·인라인 등 예외를 허용. 이 1개 링크는 예외 적용 여부가 현재 증거만으로 확정되지 않음 | **NT**, 미확인 가설. P2 후보 | D02·D04 | 24px 대상 공간/주변 링크 간격·인라인 예외 검토, 실제 터치 시험 |
| A07-03 | 정확한 모바일 폭 | 브라우저 실제 창 조정 시도 후에도 `innerWidth` **340 CSS px(400%)**에서 변화하지 않음. 기존 **272 CSS px(500%)**에서 넘침 없었으나 **정확한 320px**은 이번에도 직접 설정 불가 | **NT** | D04·D05 | 1280px 창 × 400% 또는 장치 에뮬레이션이 허용되는 시험 환경에서 정확히 320px 실측 |
| A07-04 | 실제 장치·사람 시험 | Android/iPhone 터치, TalkBack/VoiceOver, 저시력·조작 피로 사용자 과제, 실제 보호자 테스트 없음 | **NT**, 실제 참여자 **0** | D03·D04·D05, P01–P06·C01–C02 | 참여 동의·가상 자료를 전제로 별도 사용성 시험 |

**이번 테스트 범위에서 새로 확정된 P0/P1 결함은 없다.** 위 사항은 확인 가능한 정상 동작과 사용자·보조기술 시험이 필요한 가설을 나눈 것이다. 실제 참가자 테스트나 임상 승인을 대체하지 않으며, 필수 NT가 있어 WCAG 2.2 전체 적합/100점 합격 판정은 유보한다.

## 3. 보존·배포 경계

- 이번 단계의 산출물은 **검증 보고서 1개**. 사이트 HTML·CSS·JavaScript 변경 없음.
- 안내 페이지는 건강정보 입력폼이 아니며, 점검 중 실제 환자 자료의 입력·읽기·저장·백업·복원·삭제·전송을 수행하지 않았다.
- Draft PR 상태 유지, `main` **미병합**, Netlify 운영 사이트 **미배포**, VPS **미조작**. 개발 Deploy Preview는 운영 배포와 구분한다.
- 추후 실제 사용성/임상 전문의 참여는 별도 모집·동의·해당 버전 승인 증거가 필요하다.

## 4. 판정 근거

- [W3C WCAG 2.2, 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html): 반복 영역을 건너뛰는 경로.
- [W3C WCAG 2.2, 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html): 키보드 초점의 가시성.
- [W3C WCAG 2.2, 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): 320 CSS px 상당 폭의 정보·기능 보존.
- [W3C WCAG 2.2, 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): 24×24 CSS px 기준 및 간격·인라인 등 예외.
- ApuDa 내부 `review-apuda` 감수 프로토콜: 30개 책임 역할, 실제 참여자/전문가 및 승인/NT 분리.
