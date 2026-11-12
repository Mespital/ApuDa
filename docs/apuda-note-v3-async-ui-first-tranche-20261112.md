# V3 실제 화면 저장 콜백 비동기화 — 1차 환자정보·진료 질문

2026-11-12 KST · Draft PR #294 개발 검증 전용. 운영 main/Netlify 배포 금지.

## 기존 문제
동기식 V3 `save()`는 저장 성공 뒤 즉시 화면을 갱신하는데, 향후 IndexedDB `Promise` 저장으로 바꾸면 기존 `save();closeSheet();toast('저장')` 호출부는 커밋 완료 전에 성공 메시지를 표시하고 설정 창을 닫는다. 저장이 실패한 상황에서도 입력 중인 환자정보나 질문을 사용자가 다시 확인해야 한다.

## 적용한 변경
- 실사용 소스 `public-site/note/note-app.js`의 **환자정보 설정 폼 submit** 및 **진료 질문 추가 addQ(event)** 두 호출부를 `async` 함수로 변경. `await Promise.resolve(save())` 후 **실제 저장 확인이 끝나야** 성공 알림을 표시한다.
- 저장 요청 중에는 해당 폼의 입력 컨트롤 및 버튼을 비활성화하고, `aria-busy=true`로 알린다. 완료/실패 시 기존 disabled 상태를 복원한다. 중복 제출 방지 플래그도 적용.
- 실패 시 설정 창을 닫지 않고, 미저장 JSON을 기존 `ApuDaNoteUnsavedDraft`에 기록해 별도 다운로드하도록 안내한다. 현재 `save()`의 자체 실패 처리와 중복 캡처하지 않는다.
- 저장 요청 중 다른 탭에서 `storage` 이벤트가 발생하면 **제출 중인 프로필 원문** 또는 **질문이 반영된 상태**를 보존하고 추가 저장을 차단한다.
- 기존 V3 `save()` 구현과 `localStorage`, 복원/삭제, Drive 자동 백업은 이번 변경에서 **그대로 유지**한다. 이미 검증된 환자기록/논술 기록에 대한 자동 이동은 없다.

## 검증 구조
`tools/tests/apuda-note-v3-full-ui-e2e.py`에 실제 V3 HTML의 설정 폼·동적 질문 폼을 Playwright Chromium으로 구동하는 테스트를 추가. 합성 브라우저 Origin에서 `window.save`만 **지연/거절되는 Promise 형태로 바꿔** 입력 잠금, 커밋 이전 저장 성공 안내 부재, 성공 뒤 안내, 실패 뒤 원본 보존 및 사용자가 다시 시도할 수 있는 폼 유지를 검증한다. 다른 기능은 기존 27건 회귀 검사를 계속 유지한다.

실제 CI 완료 결과는 해당 SHA의 GitHub Actions 로그로 별도 확인한다. **새로운 비동기 UI 동작은 실사용 IndexedDB에 아직 연결되지 않았다.**

## 출시 차단 (P0)
V3 `localStorage`의 비원자적 비교/쓰기, 오래된 탭·Service Worker 캐시, 원본 백업·복구의 원자적 전환, 나머지 24개 호출부, 실제 Android/iOS 사용자 시험, Drive 자동 업로드/prune 검증이 남는다. 새 코드의 환자정보·질문 경로만 비동기 실행 완료를 기다릴 준비가 된 것이다.

**Draft 유지, PR 병합/운영 배포 금지. AI 기술 사전점검일 뿐 전문가 감수·환자 참여 시험 완료가 아니다.**

## 2026-11-12 KST — 실브라우저 CI 검증 결과

검증된 코드 SHA: `858cf6e84d5a8bd384b9436830887f9c7f696743`.  
GitHub Actions 실행: https://github.com/Mespital/ApuDa/actions/runs/43144842020

- **실제 V3 `index.html` 전체 화면:** `RESULT 52/52 PASS` (초기 27건 + 새 비동기 환자정보·질문 흐름 및 대기 중 두 탭 경합 시험).
- **격리형 IndexedDB 비동기 포트:** `RESULT 21/21 PASS`.
- 합계 **73개 자동검사 통과, 0건 실패**. Chromium은 Ubuntu 24.04 / Python Playwright 1.56에서 실행했다.
- 테스트는 가상 환자/대화 기록을 localhost만 사용하는 새 브라우저 프로필에 넣고, 외부 네트워크/Google Drive를 차단한 상태에서 실행했다.
- 실운영 화면의 기본 저장은 여전히 `save()` → V3 `localStorage`이다. 테스트에서 `window.save`를 인위적으로 지연/거절하는 Promise로 바꾸었지만, 이는 **실제 IndexedDB 쓰기 통합 시험이 아니다**.
- 저장 대기 중 다른 탭이 수정하면 보류된 프로필 입력 원문을 메모리 임시 사본에 기록하고, 해당 탭의 저장 성공 표시 없이 쓰기를 거절함을 실브라우저에서 검증했다.
- 입력 동결 및 접근성: 제출 중 `aria-busy` 적용, 입력·버튼 잠금, 성공/실패 후 원래 상태 복원 확인.
- GitHub Actions 결과는 회귀 시험 기준일 뿐이며, P0(구형 탭과 `localStorage` TOCTOU)을 해제하지 않는다.

**출시 판정: Draft·미병합 유지 / 운영 배포 금지.** 실제 환자/논술 기록 및 Google Drive를 읽거나 수정하지 않았고, 의료진·환자 참여 감수도 수행하지 않았다.
