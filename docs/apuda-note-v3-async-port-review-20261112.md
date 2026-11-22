# V3 동기식 화면 ↔ IndexedDB 비동기 저장 인터페이스 (합성 시험 전용)

2026-11-12 KST · GitHub Draft PR #294에 한정. 실제 V3 UI에 연결되지 않음.

## 이미 검증된 구성 요소
- `v3-unified-contract-sandbox.js`: V3 본문·대화·복원·복구·삭제의 원자적 revision 검증 및 IndexedDB 트랜잭션.
- `note-unsaved-draft.js`: 충돌 시 환자 입력 원문의 메모리 임시 보존 및 수동 JSON 내보내기.
- `v3-synthetic-async-port.js`: **위 두 요소 사이의 비동기 상태 전환**을 보호하는 새 개발용 래퍼.
- `v3-async-port-lab.html/.js`: 두 DB 연결로 동일 revision 동시 갱신을 경쟁시키는 가상 데이터 브라우저 시험.
- `tools/tests/apuda-note-v3-async-port-browser.py`: Chromium 실브라우저 자동화.

## 설계된 앱 화면 연결 규칙 (현재 운영 코드 미적용)
1. 각 탭은 `initialize()` 이후 **확인된 커밋(revision/원문)**만 상태로 표시한다.
2. UI 입력은 **별도 draft**에서 조립한다. `await saveNote` 또는 `await saveChat`의 완료를 확인하기 전 '저장 완료'를 표시하지 않는다.
3. 최신 revision 충돌, 저장 용량 오류, DB 접근 실패, 강제 abort가 발생하면 `blocked-review-required` 상태로 전환하고 미저장 내용을 별도 보관한다. 자동 재시도나 오래된 상태 덮어쓰기를 하지 않는다.
4. 백업 복원 및 전체 삭제에는 사용자 승인(`userConfirmed`)과 **독립 백업 확인(`independentBackupVerified`)을 모두 요구한다.** 복원 취소도 별도 승인을 요구한다.
5. 모든 저장 결과에서 `readyForProduction`, `backupUploadAllowed`, `backupPruneAllowed`는 `false`이다. 저장소 이름에 고정 합성 접두사가 없으면 엔진은 거부한다.
6. 트랜잭션 커밋 이후에도 저장소를 다시 읽어 갱신 상태를 확인하며, 사이에 새 revision이 생기면 성공을 확정하지 않고 수동 검토로 전환한다.

## 아직 남은 차단 조건
- **V3 실제 버튼과 화면의 30개 이상 동기식 `save()` 호출을 바로 async 함수로 치환하면 안 된다.** 모든 호출자가 `await`, 오류 처리, 입력 유지, 성공 토스트 타이밍을 처리하도록 단계별 수정 필요.
- V3 구형 탭은 새로운 저장 계약을 모르며 `localStorage`에 계속 쓸 수 있으므로 원자적 전환의 안전성이 성립하지 않는다. Service Worker 캐시/Drive 백업 제거 정책 선행.
- 영구 보관/독립 백업을 검증한 실제 모바일 승인 흐름 및 환자·보호자 사용성 시험 필요.
- 새 UI port는 **별도 합성 DB만** 다루며 실사용 수첩, 논술 기록, Drive, 운영 Netlify를 읽거나 수정하지 않는다.

## 회귀 시험
기존 `.github/workflows/apuda-note-v3-full-ui.yml`에 새 Playwright 테스트를 함께 실행하도록 추가.
최종 로그에서 21개 테스트, 앞선 실제 V3 27개 테스트가 모두 통과해야 개발 브랜치의 검증으로 인정한다.

**P0 미해결 / Draft 유지 / 운영 병합·배포 금지.** AI D04/D05/D06 기술 검토에 불과하며 실제 전문가/환자 감수 완료 아님.


## 2026-11-12 KST — 실제 CI 검증 결과 및 호출부 현황

- 검증 완료한 코드 커밋: `c4c8952fcae24ecf10bb22959864d85c6733a706`.
- GitHub Actions: https://github.com/Mespital/ApuDa/actions/runs/43140105668
- **V3 실제 화면 다중 탭 회귀 시험: `27/27 PASS`.**
- **합성 IndexedDB 비동기 UI 연결 시험: `21/21 PASS`.**
- 총 **48개 검사 모두 통과**, 브라우저 오류 없이 시험용 IndexedDB 삭제 확인.
- 검증 코드는 `127.0.0.1` 로컬 웹 서버와 가상 JSON만 사용한다. 외부 네트워크·Drive·실제 환자/학생 기록에 접근하지 않았다.
- 검사 결과는 **기존 V3 호출부의 운영 연동 합격을 의미하지 않는다**. 새 어댑터는 별도의 테스트 화면에서만 사용했다.

### 실제 V3 동기식 저장 호출부 현황

최신 `public-site/note/note-app.js`를 정적 검사하면 `save()` 문자열 출현은 **25회(정의 1회 포함, 호출 24회)**이고 `saveChat()`은 **3회(정의 1회 포함, 호출 2회)**이다. 합계 **26개 직접 호출**을 조사해야 한다. `localStorage` 직접 접근, 파일 복원·복원 취소·전체 삭제, Drive 백업 후킹 및 UI 성공 메시지는 별도 조사 대상이다. 단순히 `save()`를 `async`로 바꾸기만 하면 호출자가 기다리지 않아 화면에서 성공 메시지를 먼저 띄울 수 있다.

### 운영 전환 금지 사유
1. 기존 V3 UI 콜백에서 `await`/실패 UX/변경분 보존을 순차 연결하지 않았다.
2. 기존 캐시·구형 탭은 IndexedDB의 revision 잠금을 공유하지 않는다.
3. 실제 Drive 업로드/사본 정리를 신규 트랜잭션과 연동하지 않았다.
4. 모바일 실기기 및 사람 전문가·환자 감수는 미실시다.

**P0 미해결. 운영 main 병합과 Netlify 운영 배포 금지 유지.**
