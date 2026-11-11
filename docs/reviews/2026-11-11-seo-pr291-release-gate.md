# SEO-13 — ApuDa Draft PR #291 병합·배포 사전 승인표 (NO-GO)

- 기준일: 2026-11-11 (KST)
- 저장소: `Mespital/ApuDa` / PR: https://github.com/Mespital/ApuDa/pull/291
- 검토 스냅샷: 개발 브랜치 `feat/apuda-seo-geo-marketing-skills-20261110`, HEAD `c0071fd4cc2665e7df2deedf84dfd67f9d5f3bd3` (기준 이후 변경이 있으면 재검)
- 검토 모드: **ApuDa 30개 역할 기준 중 D04·D05·D06 중심의 AI 기술 사전점검**. 실제 임상의·환자·보호자 시험 0명, 임상 승인 0건.
- 현재 판정: **NO-GO / `main` 병합·Netlify 운영 배포·VPS 배포 승인 안 됨**.

## 1. 가장 중요한 차단 사유

### P1 — 하나의 PR에 공개 사이트 SEO와 실제 VPS 배포 코드가 혼재

GitHub가 제공한 PR 변경 파일 목록은 총 **71개**였다.

| 영역 | 변경 파일 수 | 주요 위험 또는 확인점 |
|---|---:|---|
| 암 진단 후 첫 30일 책자 HTML | 30 | 검색 메타데이터 변경과 원문 보존 대조 필요 |
| 뉴스봇 및 뉴스 테스트 | 9 | 뉴스 생성·발행 동작과 원본 소식 보존 검증 필요 |
| 감수 기록 | 15 | 운영 기능 직접 영향은 낮음 |
| GitHub Actions | 2 | SEO 정적 검사와 **VPS 배포 워크플로**가 함께 변경됨 |
| 기타 공개 사이트·Netlify 설정 | 12 | 노트 검색 제외, SEO, 링크, 뉴스 페이지 및 배포 설정 |
| `.claude/skills` | 3 | SEO/GEO/마케팅 지침 |

`.github/workflows/deploy-news-vps.yml`은 `push`의 `main` 이벤트와 `automation/news-bot/**` 또는 워크플로 변경 경로에 반응하도록 선언되어 있다. 실행 단계에는 **SSH 접속, `rsync --delete`, 뉴스봇 설치·cron 설정, 데이터 발행**이 존재한다. 즉 PR을 병합하면 설정에 따라 VPS 변경을 수행하는 워크플로가 시작될 수 있다. `environment: apuda-ai-vps`에 실제 승인 보호 규칙이 있는지는 확인하지 못했다. **현재는 VPS에 접속하거나 해당 워크플로를 수동 실행하지 않았다.**

권고: 뉴스봇/VPS 변경을 공개 사이트 SEO·노트 가이드 변경과 **별도 PR 및 별도 승인 단위로 분리**한다. 기존 작성자의 코드를 임의로 삭제하거나 브랜치를 강제 재작성하지 않는다. 분리 방법 및 배포 순서는 운영자 승인 후 결정한다.

### P1 — `main` 병합 보호 미설정

SEO-12 시점 GitHub 조회에서 `main`은 `protected: false`, rulesets는 `[]`였다. 정적 CI는 성공했지만 필수 상태 검사(Required Status Check)로 강제되지 않는다. `main` 상세 보호 API는 GitHub App의 403으로 접근 제한. 보호 규칙을 변경하지 않았다.

## 2. 증거 기반 출시 게이트

표기: **PASS**=지정 범위 확인, **FAIL**=확인된 조건 미충족, **NT**=시험·자료 없음. PASS는 해당 항목의 한정된 검사 범위에만 유효하다.

| Gate | 조건 | 현재 | 근거 또는 배포 전 조치 | 담당 관점 |
|---|---|---|---|---|
| G01 | PR 변경 범위가 승인 단위로 분리됨 | **FAIL** | SEO 사이트와 VPS 뉴스봇이 동시 포함 | D05/D06·운영자 |
| G02 | `main` 병합 규칙과 필수 검사가 설정됨 | **FAIL** | protected false; 운영자 GitHub 관리자 조치 필요 | D05/D06 |
| G03 | SEO/대비 정적 CI 성공 | **PASS** | [Actions #42944219233](https://github.com/Mespital/ApuDa/actions/runs/42944219233): `success`; 글자 17/17, 초점 6/6 | D04/D05 |
| G04 | 서재·FAQ 수량과 사이트맵 정적 검증 | **PASS** | 30권·FAQ 30페이지/3,000문항·사이트맵 85 URL; 의학 내용 승인과 별도 | D05 |
| G05 | Netlify Deploy Preview 빌드 상태 | **PASS** | GitHub commit status상 `apuda-total` 및 `future-compass` preview 각각 `success`; 기능 체험을 뜻하지 않음 | D05 |
| G06 | 30권 본문/링크/암종 일치 수동 대조 | **NT** | 정적 수량 검사만으로 내용 불변·전문성 입증 불가 | S01–S12 해당 범위·D05 |
| G07 | 노트·논술 저장 데이터 **비파괴 검증** | **NT** | 저장 매체·복원·백업·기존 기록 보존을 가상 데이터로 격리 검증해야 함 | D06/D05 |
| G08 | 모바일·키보드·화면낭독기·팝업 사용성 | **NT** | 320 CSS px/200% 확대, Android/iOS, 키보드·스크린리더 실기기 확인 필요 | D04/D02 |
| G09 | 새 뉴스봇/VPS 단계별 시험 및 독립 승인 | **NT** | VPS 실행 금지 상태 유지; 임상 소식·자동 발행 실패 복구 방침 필요 | D05/D06·운영자 |
| G10 | 운영 배포 전 최종 승인 기록 | **NT** | 운영자가 PR 범위·기준 SHA·대상 Netlify 사이트·VPS 여부를 명시적으로 승인해야 함 | 운영자 |
| G11 | 복구 대상과 시나리오 확정 | **NT** | 마지막 정상 Netlify 배포 ID/퍼머링크, 데이터 백업/복원 책임자, VPS 롤백을 각각 문서화 | D05/D06 |

**최종 판정:** G01·G02가 FAIL이고 G06–G11이 NT이므로 **병합·운영 배포 불가 판정 유지**. 이는 PR에 실제 의료 오류가 있다는 판정이 아니라 승인 절차와 검증 범위가 충분하지 않다는 의미다. ApuDa 전체 100점 총점·임상 인증·실사용자 성공률은 산출하지 않는다.

## 3. 단계별 안전한 병합·배포 승인 순서 (실행하지 않은 절차)

1. **범위 고정:** 최종 PR SHA, 변경 파일 목록, `main`의 최신 SHA, Netlify 사이트별 production branch 및 auto-publish 설정을 확인한다. PR이 1커밋이라도 추가되면 해당 게이트를 재평가한다.
2. **업무 분리:** SEO·노트 안내 사이트 변경과 뉴스봇·VPS 변경을 별도 승인 단위로 구분한다. 30권 책자·FAQ 데이터, 논술 기록, 환자 노트 변경 가능성이 있는 파일도 목록과 영향도를 명시한다.
3. **정적·기능 검증:** SEO CI 외에도 뉴스봇 단위 테스트, 수동 링크 확인, 가상 환자 데이터로 노트 저장·백업·복원·삭제의 비파괴 시험, 논술 기록 보존 확인을 각각 수행한다. 실제 기록에 복원 실험 금지.
4. **의료·사용성 검토:** 의료 문구·FAQ·책자에 실질적인 변경이 있다면 각 암종 책임전문의 S01–S12가 자기 범위를 승인한다. 30개 역할 중 실제 참가자가 없는 상태를 승인 완료로 표시하지 않는다. 모바일 및 보조공학 실사용 확인과 구분한다.
5. **배포 미리보기:** 실제 PR SHA에 연결된 Netlify Deploy Preview에서 공개/비공개 경로, 30권·FAQ, 노트 사용법, 모바일 및 링크를 점검한다. `future-compass` 등 동일 저장소 연결 사이트에 예상치 못한 배포 영향이 없는지 확인한다. `success` 빌드 표시만으로 합격 처리하지 않는다.
6. **데이터·복구 준비:** 기존 논술 데이터의 저장 위치와 환자 기록의 로컬/원격 저장 범위를 먼저 확인한다. 필요한 경우 허가된 안전한 백업·복구 방식과 복원 담당자를 정한다. 기록을 외부로 복사하거나 본 작업에서 열람하지 않는다.
7. **운영자 승인:** 대상 PR/범위/SHA, Netlify 대상 사이트, VPS 배포 허용 여부, 유지할 무료 요금제, 점검자, 작업 시간, 롤백 조건을 한 번에 명시하여 승인받는다. **일반적인 “계속”은 운영 배포나 VPS 접속 승인으로 간주하지 않는다.**
8. **승인 후에만 실제 반영:** GitHub merge와 Netlify production publish는 연결 설정에 따라 자동 동작할 수 있다. 뉴스봇 `push main` 워크플로도 별도의 자동 실행 가능성이 있으므로 필요한 보호 장치·승인을 먼저 검증한다.
9. **사후 점검:** 게시 직후 및 5분·15분·60분에 주요 페이지·책자·FAQ 접근, 오류·개인정보 노출, 기록 유지(테스트 계정만), 외부 연계 실패를 점검한다. 이상 시 신규 배포·VPS 작업을 멈추고 승인된 복구 절차를 수행한다.

## 4. 복구(Rollback)의 정확한 범위

Netlify는 성공했던 과거 배포를 선택해 `Publish Deploy`로 다시 게시할 수 있다. **그러나 이것은 정적 사이트 파일의 이전 버전을 게시하는 조치**이며, 브라우저 로컬 저장소·외부 DB·VPS cron·환자 기록·논술 기록을 같은 시점으로 되돌린다는 뜻이 아니다. Netlify Database 사용 시에도 이전 사이트 배포 재게시만으로 DB가 자동 복구되지 않음을 공식 문서가 명시한다.

또한 Git 연동 자동 게시가 켜져 있으면 **다음 Git 기반 production 배포가 이전 버전 게시를 덮어쓸 수 있다.** 운영자가 실제 프로덕션 배포 ID와 자동 게시 잠금 여부를 확인한 뒤 복구해야 한다. 본 단계에서는 복구 버튼을 누르거나 데이터 복원을 실행하지 않았다.

## 5. 운영자 승인 기록 양식 (현재 비어 있음)

| 승인 변수 | 기록할 값 | 현재 |
|---|---|---|
| 승인할 PR 및 정확한 커밋 | PR 번호와 40자리 HEAD SHA | **미승인** |
| 승인 구성요소 | SEO 사이트 / 노트 안내 / 책자 / 뉴스봇 / VPS (각각) | **미승인** |
| 운영 Netlify 사이트·브랜치 | 정확한 프로젝트 ID·생산 브랜치 | **미확인** |
| 환자·논술 데이터 보존 검증 | 데이터 저장 위치, 백업 책임자, 테스트 보고 | **미실시** |
| 의료 콘텐츠 책임 검토 | 해당 S01–S12 범위·버전·실제 승인 증거 | **미제공** |
| 최종 GO/NO-GO, 승인자, 시간 | 승인 기록 | **NO-GO** |

## 6. ApuDa 감수 및 책임 구분

- 기술/접근성/보안 영역은 D04·D05·D06 관점의 **AI 사전점검**, 실제 전문 검토는 수행하지 않았다.
- S01–S12 암종별 책임전문의, M03–M06 공통 의료·돌봄, D01–D03 UI·사용성, P01–P06 환자, C01–C02 보호자의 실제 평가·승인은 이 보고서에 포함되지 않았다. 역할 수는 30개지만 **실제 참여자 0명**.
- 정적 검사 성공은 임상 정확성·WCAG 2.2 인증·서비스 전체 데이터 안전성·Netlify 운영 배포 승인을 의미하지 않는다.

## 7. 근거

- [GitHub PR #291 — 변경 파일 및 상태](https://github.com/Mespital/ApuDa/pull/291/files)
- [GitHub Actions — 정적 검사 성공](https://github.com/Mespital/ApuDa/actions/runs/42944219233)
- [SEO-12 보호 설정·필수 검사 준비도](./2026-11-11-seo-required-check-readiness.md)
- [Netlify Docs — Deploy Previews](https://docs.netlify.com/deploy/deploy-types/deploy-previews/)
- [Netlify Docs — Rollbacks](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/)
- [Netlify Docs — Database backup and recovery](https://docs.netlify.com/build/data-and-storage/netlify-database/backup-and-recovery/)
- [GitHub Docs — Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
