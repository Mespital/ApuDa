# ApuDa V3·V4 통합 브랜치 — 실화면 합성 인계 안전성 점검

기준일: 2026-11-12 KST. 통합 브랜치 `integration/note-v3-v4-20261112`, Draft PR #303.

## 통합 병합 범위
- 시작점: 2026-11-12 최신 `main` 스냅샷 `58a7dc1590f02557680d90f599ea6c30e9eb1bdd`.
- 소스: Draft PR #294 (V3 기록·대화 무결성) + Draft PR #292 (V4 합성 IndexedDB 인계).
- 병합 커밋: `c69d1a4154eaf7b719e72940181f6504da19d016`, 세 개 부모(main, PR294, PR292)로 두 개발 이력을 유지.
- 두 PR의 수정 파일은 서로 겹치지 않음(53개 + 54개). 최근 main에 변경된 `public-site/note/index.html`만 텍스트 삽입 3건을 **보존 병합**하여 최신 검색 제외 안내와 새 저장 경고/대화 저장 상태를 모두 유지.
- `public-site/netlify.toml`은 최신 main 버전 그대로 유지. 운영 main과 실제 환자·학생 기록은 수정하지 않음.

## 새 교차 통합 시험
`tools/tests/apuda-note-v3-v4-integration-e2e.py`는 `127.0.0.1` 임시 localhost Origin의 실제 V3 화면(`note/index.html`)을 실행한다. 기록·대화는 모두 **가상 정보**다. V3 대화 큐에 사용자 메시지와 AI 안내 메시지를 추가하고 실제 저장 확인까지 기다린 다음 V4 합성 검증 모듈을 테스트 컨텍스트에만 동적 주입한다.

1. 실제 V3 건강기록과 대화의 **정확한 JSON 원문** 확보
2. V4 인계 가상 IndexedDB에 원문·V4 초안·SHA-256 지문을 한 번에 저장
3. 다시 실행해도 중복 기록이 생기지 않는지 확인
4. 기존 V3의 데이터와 IndexedDB 초안을 변경하지 않았는지 확인
5. 같은 Origin의 두 번째 V3 탭에서 원문을 수정한 후 재인계하면 자동 덮어쓰기 거부(`manual-conflict-review`)
6. V4 자동 활성화·Drive 업로드·사본 정리 권한의 `false` 유지
7. 임시 IndexedDB 삭제, 외부 통신/Service Worker 차단, 브라우저 JS 오류 검사

## 증거 한계 및 릴리스 차단
- 이것은 **실제 V3 DOM + V4 합성 저장 엔진을 같은 브라우저 컨텍스트에서 연결해 테스트**하는 것이며, 운영 V3 코드를 IndexedDB로 변경한 것은 아니다.
- 두 번째 V3 탭은 새 버전이고, **이미 열린 구형 V3 탭/구형 SW 캐시**는 새 보호 규칙을 무시할 수 있다.
- 원본이 인계 완료된 *후* 구형 탭이 쓰면 새로운 인계 초안은 자동으로 무효화될 수 없다. 실제 운영 이전에는 구형 탭 차단, 독립 백업 확인 및 수동 활성화 절차가 필요하다.
- 개별 데이터/기록·대화 복원/삭제 간 실운영 원자성이 보장되지 않고 Google Drive 자동 백업 및 prune 정책도 미검증이다.
- 모바일 실기기, 의료진/환자/보호자 실제 사용자 검증 미실시.

**P0 OPEN — Draft 유지, 운영 main 병합/Netlify 운영 배포 금지.** Netlify 무료 요금제 또는 실제 환자·논술 기록, Drive 백업은 변경하지 않는다.

## 테스트
- `python tools/tests/apuda-note-v3-v4-handoff-browser.py`
- `python tools/tests/apuda-note-v3-v4-integration-e2e.py`
- 기존 V3 전체 화면·복원·대화·수정 UI 회귀 테스트도 모두 통과해야 다음 단계로 진행한다.

최종 통과 건수는 각 커밋의 실제 GitHub Actions 실행 결과를 확인한 후 작성한다.

## 실측 CI 결과 (2026-11-12 KST)

테스트 커밋: `f69924c1a9f77c05750b07b8acc1b5eddd157abd`. 테스트는 Ubuntu 24.04 / Playwright Chromium / localhost / 합성 데이터로 수행했다.

- [V3 전체 화면 + 합성 비동기 포트 CI](https://github.com/Mespital/ApuDa/actions/runs/43224973874): 전체 V3 UI `84/84 PASS`, IndexedDB 비동기 포트 `21/21 PASS`, 기록 수정·삭제 `78/78 PASS`, 대화 순서·미저장 보존 `37/37 PASS`. **합계 220/220 PASS**. 대화 정적 검사도 15개 항목 통과.
- [V4 및 실제 V3→V4 교차 인계 CI](https://github.com/Mespital/ApuDa/actions/runs/43224974258): V4 원자적 합성 인계 `15/15 PASS`, 실제 V3 화면 원문·대화의 V4 합성 IndexedDB 인계 `21/21 PASS`. **합계 36/36 PASS**.
- **브라우저 검사 합계 256/256 PASS**, 별도 정적 감사 15건 통과. 이는 개발 합성 환경 검증이며 실제 환자 데이터 이전 승인이나 운영 호환성 증명이 아니다.

### 미해결 P0
실운영 V3는 `localStorage`에 기록과 대화를 독립 키로 저장한다. 이전 탭/Service Worker/Drive 자동 백업은 새 트랜잭션과 통일되어 있지 않다. 인계 이후 오래된 탭이 수정하는 것을 강제로 막지 못한다. 실제 IndexedDB 전환·구형 버전 차단·독립 백업 확인·모바일 및 환자 검증 전 **Draft에서 main으로 병합하지 않는다**.
