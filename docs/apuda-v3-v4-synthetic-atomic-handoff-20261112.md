# ApuDa V3→V4 합성 인계 어댑터 — 원본 보존·원자적 초안

기준: 2026-11-12 KST. 개발 PR #292 전용. 운영 배포/병합 승인 없음.

## 목적
현행 V3는 동기식 `localStorage` 기반이고 V4 체험 화면은 `sessionStorage` 기반이다.
두 구현을 그대로 연결하면 서로 다른 저장소 간 원자적 이동을 보장할 수 없으며,
구형 탭과 Drive 자동백업은 새 구조를 모르므로 동시 수정 위험이 남는다.

개발 모듈 `v3-v4-synthetic-handoff.js`는 실제 키를 읽지 않는 **원문 인계 실습용**이다.
합성 출처 객체가 제공한 V3 건강기록 JSON 문자열과 채팅 JSON 문자열을 검증하고,
기존 `ApuDaV4MigrationRehearsal.prepare/verify`로 V4 변환 **초안**을 만든다.
그 후 합성 IndexedDB의 **단일 readwrite 트랜잭션**에 V3 원문/대화/V4 초안/지문을 동시에 기록한다.
전환 직전과 직후 원문을 재검사해 어느 시점이든 변경되면 충돌로 보고한다.

## 안전한 차단 조건
- DB 이름은 반드시 `apuda-v4-synthetic-handoff-` 접두사, 키 `synthetic-only`.
- 입력 공급 객체는 `apuda.synthetic.v3.source` 유형이어야 한다.
- 새 V4 초안은 `readyForProduction:false`, `allowActivation:false`이며 자동 가져오기·원본 정리·Drive 업로드·Drive 정리는 모두 불허.
- 기존 인계 초안과 다른 원문을 제출하면 **덮어쓰지 않고 수동 충돌 검토**.
- 인계 중 변경이 발견되면 기존 초안도 **활성화하지 않음**.
- 트랜잭션 중 강제 중단은 전체 롤백, 유효하지 않은 V3 JSON/채팅 거부.
- 이 모듈은 V3 앱 `note-app.js`나 V4 실제 체험판 `app.js`에 로드되지 않는다. 실사용 기록과 Google Drive 백업에 접근하지 않는다.

## 검증
- 분리된 실브라우저 시험 페이지: `/note-v4/v3-v4-handoff-lab.html`.
- 자동화: `python tools/tests/apuda-note-v3-v4-handoff-browser.py`.
- GitHub Actions: `.github/workflows/apuda-v3-v4-handoff.yml`, Ubuntu 24.04/Playwright 1.56/Chromium.
- 15개 시나리오: 초기 보관, 정확한 건강기록·대화 원문, SHA-256, 자동 전환/Drive 금지, 중복 제출, 원문 불일치, 원본 불변, 인계 직전/직후 변경, 트랜잭션 abort, 손상된 기록·대화 거부, 다른 DB 거부, 가상 DB 3개 삭제.

**중요:** 테스트가 통과하더라도 실운영 V3와 V4의 원자적 전환이나 구형 탭 동기화를 보장하지 않는다. 실제 V3 사용자 저장소/Drive/모바일 기기를 테스트하지 않으며, 환자·보호자/임상전문의 감수는 미진행. P0(구형 탭 덮어쓰기) 유지.

**Do not merge or deploy.**

## 2026-11-12 KST 실제 Chrome 검증 결과

- GitHub Actions: https://github.com/Mespital/ApuDa/actions/runs/43138277002
- 최초 커밋: `3c3b9ebd275e64cd9b4c40a92a1d1cf6c3755668`
- 테스트 환경: Ubuntu 24.04 / Python 3.12 / Playwright 1.56 / Chromium, 임시 localhost Origin, 외부 네트워크 차단, Service Worker 비활성화.
- **실측 결과: `RESULT 15/15 PASS`, 실패 0.** GitHub Actions의 실제 작업 로그에서 15개 항목을 모두 확인했다.
- 검증한 V3 본문·대화는 모두 **합성 데이터**이고, 임시 IndexedDB 3개를 전부 삭제했다.
- 이번 테스트는 **V3 실사용 앱의 저장 함수 호출을 검증하지 않는다**. 가상 데이터의 shadow stage에 대한 동작 테스트이며 실제 환자 원문/Google Drive로 접속하지 않았다.
- 브라우저가 새 초안의 `readyForProduction`을 영구 `false`로 유지하는 것과 실제 구형 탭 쓰기를 차단하는 것은 다르다. 구형 탭은 이 모듈을 몰라 변경할 수 있으며, 완료 직후 구형 탭이 수정하면 새 단계는 이를 원자적으로 감시할 방법이 없다.

**출시 판정: P0 미해결 / 운영 반영 불허 / Draft 유지.**
