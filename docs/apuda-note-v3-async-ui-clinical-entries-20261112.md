# ApuDa V3 — 치료 일정·복용약·혈액검사 기록의 비동기 UI 전환 (2차)

작성일: 2026-11-12 (KST). 범위: GitHub Draft PR #294 개발 전용. 의료진/환자 실사용 감수 완료 아님.

## 변경된 실제 V3 사용자 경로

`public-site/note/note-app.js`의 세 개 저장 핸들러가 `await Promise.resolve(save())` 이후에만 저장 완료 알림을 표시하도록 변경됐다.

1. **치료 일정:** `window.addSched(event)` — 날짜, 일정명, 일정 유형(치료/검사/일정) 보존.
2. **복용약:** `window.addMed(event)` — 기존 `interpret('약: ...')` 로직과 원문·메모 구조 유지, 필요 시 기존 일반 약 기록 fallback 유지.
3. **혈액검사:** `window.addLab(event)` — 백혈구(WBC), 호중구(ANC), 혈색소(Hb), 혈소판(PLT), 원 단위, `rawValues` 및 검사 메모를 이전과 동일하게 기록한다. 기존 낮은 ANC/혈소판 경고 로직은 저장 성공 뒤 표시하도록 유지한다.

`saveEntryForm()`은 세 폼에서 공유하는 작은 UI 헬퍼다. 사용자가 저장을 요청하면:
- 원본 폼의 input/select/textarea/button 전체를 일시 비활성화하고 `aria-busy="true"` 적용.
- 중복 제출, 환자정보·진료질문 저장 진행 중 재진입은 차단.
- 저장 과정이 완료되기 전에는 **성공 메시지를 절대 표시하지 않음**.
- `save()`가 동기적 오류를 발생시키거나 향후 비동기 함수가 Promise reject 또는 `{status:'conflict'}` 등을 반환하면 성공으로 처리하지 않고 원문을 임시 보관한다.
- 같은 탭에서 다른 폼 저장이 진행 중이거나, 외부 `storage` 이벤트가 들어오면 제출 당시의 `entryPendingRaw`를 보존하고 해당 탭 쓰기를 잠근다.
- 완료/실패 후 원래 disabled 상태를 복원한다. 미저장 기록은 기존 일반 백업과 호환되지 않는 별도 검토용 JSON으로만 수동 내보내기 가능하다.

## 브라우저 회귀 시험

기존 `tools/tests/apuda-note-v3-full-ui-e2e.py`에 실제 V3 일정/복용약/혈액검사 폼에 대한 비동기 완료 및 실패 경로를 추가했다. `window.save`를 실제 화면의 **가상 지연·거절 Promise**로 주입하여 (1) 커밋 전 저장 성공 메시지 없음 (2) 입력 잠금 (3) 성공 뒤 원문 변경 (4) 실패한 원문 보존·성공 안내 금지 (5) 폼 사용성 복원 (6) 상태값이 `saved`가 아닌 응답 차단 (7) 저장 대기 중 다른 탭 수정 충돌 등을 확인한다.

**주의:** 실제 V3 저장 함수 `save()`는 아직 `localStorage` 동기 저장이다. 시험의 비동기 Promise는 앞으로의 IndexedDB 통합을 대비한 주입형 검증이다. 아직 운영 쓰기 트랜잭션이나 기존 백업/Drive 시스템을 연결하지 않았다.

**P0 데이터 손실 위험 유지.** 구형 V3 탭은 개정 저장 규칙을 모르고 `localStorage` 쓰기를 계속할 수 있다. 나머지 직접 저장 호출부, 파일 복원·복원 취소·삭제·자동 Drive 백업과 캐시, 모바일 실기기 검증, 실제 환자/보호자 사용성 시험을 완료하기 전 운영 배포를 금지한다.

GitHub Actions 신규 테스트 결과는 커밋 SHA와 실제 로그로 확인한 뒤 기재한다. PR은 Draft·미병합, 운영 `main` 미변경. 기존 환자 기록·논술 기록·Google Drive 계정에 접근하지 않음.

## 실제 Chromium 검증 · 2026-11-12 KST

- [GitHub Actions Run #43154190442](https://github.com/Mespital/ApuDa/actions/runs/43154190442)
- **테스트 코드와 V3 수정 기능의 검증 SHA:** `ce5ea309574aa4875b2451b012f73ae3d8bf7dd3`.
- `RESULT 84/84 PASS; synthetic localhost full V3 UI`: 실제 V3 HTML/JS 화면에서 환자정보·진료질문·치료일정·복용약·혈액검사 폼의 저장 지연, 성공 시점, 실패 시 가상 원본 보존, 입력 활성화 복구, 저장 중 외부 변경을 검증.
- `RESULT 21/21 PASS — Chromium synthetic V3 async UI port`: 별도 IndexedDB 비동기 상태 변환과 수정번호 충돌, 복원·삭제 차단, 가상 DB 삭제 확인.
- 합계 **105개 검사 통과 / 실패 0**. Ubuntu 24.04, Playwright 1.56, 격리된 Chromium, `127.0.0.1` 로컬 웹 서버와 합성 데이터만 사용. 사용자 브라우저·Google Drive에 접근하지 않았다.
- CI 중간 실패 2건을 그대로 보관: Playwright `wait_for_function`의 인자 전달 위치 오류(테스트 오류), 검토용 JSON에서 문자열이 이스케이프돼 검색되지 않는 비교 오류(테스트 오류).
- 수정 과정에서 **복용약 파싱이 입력 원문을 정규화하여 일부 자유 입력 문구가 미저장 원문 JSON에서 빠질 가능성**을 발견했다. 이를 위해 `reviewFormSnapshot()`으로 입력 필드명·값·체크 상태를 **자동 복원 불가 검토용 사본**으로 별도 기록하게 보완하였다. 이후 동일 시나리오의 실브라우저 시험을 통과했다.

### 실제 서비스에 적용하지 않은 부분

V3 `save()`는 여전히 `localStorage`의 비원자적 원문 비교 후 쓰기이며, 테스트가 가상 Promise를 주입한 이유는 *미래의 IndexedDB 비동기 인터페이스 연결 대비*다. 자동 업로드·Drive 보관 사본 정리, 구형 탭의 이전 코드, 실사용 기록 이전, Android/iOS 실기기 및 환자/보호자 참여 시험은 미검증이다.

**출시 판정: P0 OPEN / Draft 유지 / 운영 배포·병합 금지.** 기존 환자 및 학생 학습 기록과 실제 Drive 파일에는 접근하거나 변경하지 않았다.
