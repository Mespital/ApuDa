# SEO-10 — 암환자 노트 색 대비 자동 회귀 검사

- 작성일: 2026-11-11 (KST)
- 대상: `public-site/scripts/check-seo.mjs` 및 정적 개발 미리보기의 `public-site/note-guide/index.html` 소스
- 작업 상태: `feat/apuda-seo-geo-marketing-skills-20261110` 개발 브랜치, Draft PR #291. `main` 미병합·운영 Netlify 미배포·VPS 미실행.
- 감수 방식: ApuDa 30개 필수 역할의 책임 범위 가운데 **D04 접근성, D05 개발·품질, D02 UI, D06 개인정보·보안** 관점의 AI 사전점검. S01–S12 암종별 임상 내용, M03–M06, P01–P06, C01–C02의 실사용/의료 승인을 새로 수행하지 않음. 실제 전문의·참가자 0명.

## 이번에 확정한 회귀 방지 규칙

기존 `seo:check`(`node public-site/scripts/check-seo.mjs`) 검사를 확장했다. 별도 의존성, 환자 입력, 네트워크 요청 또는 DOM 변경 없이 **안내 페이지의 인라인 CSS에서 실제 팔레트 값을 읽고** 명도 대비를 계산한다.

| 검증 항목 | 표본 | 실패 조건 | 기준 |
|---|---:|---|---|
| 보통 크기 텍스트 대비 | **17개 색 조합** | 하나라도 `4.5:1` 미만 | WCAG 2.2 AA SC 1.4.3 |
| 작성자가 지정한 키보드 초점 테두리 | **6개 인접 배경** | 하나라도 `3:1` 미만 | WCAG 2.2 AA SC 1.4.11 |
| 링크·FAQ 초점 테두리 일치 | 2개 선택자 | 서로 다른 CSS outline 지정 | 내부 회귀 방지 |
| 초점 테두리 두께 | 동일 CSS 규칙 | 2 CSS px 미만 또는 미해석 | 내부 목표(AA 인증 기준 아님) |
| CSS 파싱 가드 | 색상·그라데이션 | 참조 선택자·속성이 없거나 지원하지 않는 색상 형식으로 바뀜 | 안전한 실패(fail closed), 수동 검토 요청 |

**17개 텍스트 표본:** 본문, 링크(흰색/페이지), 경로, 히어로 배지(흰색/연파랑), 히어로 설명(흰색/연파랑), 주요 버튼, 카드 설명·라벨, 단계 번호·설명, 의료 안전 안내, 개인정보 안내, FAQ 답변, 바닥글.

**6개 초점 배경:** 흰색, 본문 바탕, 히어로 그라데이션 양 끝, 개인정보 안내, 의료 안전 안내. 반투명 오버레이나 실제 픽셀 전수 검사가 아님.

기존 검사에서 적용 중이던 서재 30권, 정적 FAQ 30개(3,000문항), 사이트맵 85 URL, 메타데이터/`noindex` 등 검사 로직은 유지. 색상 계산에 필요한 전용 패키지나 네트워크 서비스는 추가하지 않음.

## 재현 명령과 관찰 결과

```bash
node --check public-site/scripts/check-seo.mjs
node public-site/scripts/check-seo.mjs
git diff --check -- public-site/scripts/check-seo.mjs
```

실행 결과 (2026-11-11 개발 소스):

```text
Note guide static contrast: 17/17 text and 6/6 focus surfaces PASS (WCAG 2.2 AA thresholds).
SEO verified: 85 URLs, 30 books, 30 static FAQ pages, 3,000 questions, note intro public and app noindex.
```

`node --check` 및 해당 파일 `git diff --check`에서도 오류 없음. 이전 SEO-09의 `#9a5700` 초점 테두리와 17개 글자색은 동일하며 **색상 또는 환자 안내 문구를 수정하지 않았다.**

## 검증 범위와 한계

- 이번 회귀 검사는 **CSS에 선언된 색상값 조합**만 대상으로 한다. 색상값이 달라지면 스크립트가 대비를 다시 계산해 기준 미달을 탐지한다.
- `4.5:1`, `3:1`은 해당 WCAG 2.2 AA 성공 기준의 정적 색 대비 임계값이다. 이 두 검사 통과를 사이트 전체 WCAG AA 인증으로 해석하지 않는다.
- 실제 모바일 디스플레이·브라우저 확대·동적 UI·색각 보조·고대비 모드, TalkBack·VoiceOver 실사용, 환자·보호자 사용성 시험 및 임상 승인은 **NT(Not Tested)**.
- 기존 `seo:check` 명령에 통합되므로 **그 명령이 실행될 때마다** 이 검사가 수행된다. GitHub Actions/Netlify가 매 PR 커밋마다 이 명령을 실행하는지는 이 범위에서 별도로 증명하지 않으므로 자동 CI 강제라고 주장하지 않는다.
- PR 범위를 유지하며 원본 환자 기록, 논술 기록, FAQ 원문, VPS, 배포 설정은 변경하지 않는다.

## 근거

- [W3C WCAG 2.2 SC 1.4.3 텍스트 대비](https://www.w3.org/TR/WCAG22/#contrast-minimum)
- [W3C WCAG 2.2 SC 1.4.11 비텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)
- [SEO-09 실제 색 대비·초점 표시 선행 점검](./2026-11-11-seo-note-contrast-audit.md)

## AI 사전검토 판정

**P2 (접근성 회귀 방지) — 구현 및 정적 검증 완료.** D04·D05 관점에서 요구한 계산 자동화는 충족. D02는 향후 팔레트 변경 시 대비 재점검이 가능. D06은 환자 정보 접근·이동·삭제 로직 변화 없음. 인간 전문가 승인과 실제 사용자 과제 T01–T08은 이 검증으로 대체되지 않음.
