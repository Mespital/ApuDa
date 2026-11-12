# ApuDa V3 — 수정·삭제 5개 경로 비동기 저장 3차 전환 및 대화 저장 감사

기준일: 2026-11-12 KST · 대상: Draft PR #294 · 개발 브랜치 전용.

## 실제 수정된 경로

`note-app.js` 내 `toggleSched(id)`, `toggleMed(id)`, `starQ(id)`, `answerQ(id,value)`, `delItem(type,id)`의 5개 저장 경로는 새 `commitNoteMutation(label,change,success)` 함수를 거친다.

- 요청 전에 현재 수정 상태를 별도 `clone(state)`에 적용하고, 검토용 **미저장 원문 JSON**을 준비한다.
- 중복 수정 방지를 위한 `noteMutationPending` 플래그를 사용한다.
- `save()` 결과가 향후 Promise로 바뀌어도 `await Promise.resolve(save())`가 **정상 완료한 후** 성공 알림을 표시한다. `false` 또는 `{status:'conflict'}`와 같은 미완료 응답은 실패로 처리한다.
- 다른 탭의 `storage` 이벤트가 발생하는 동안 수정이 진행 중이면 저장을 중단하고 시도한 수정 원문을 `ApuDaNoteUnsavedDraft`에 보관한다.
- 데이터 삭제는 `roadmap`, `meds`, `questions`, `logs`, `labs` 배열만 허용하고, 반드시 사용자 확인을 거친다. 저장 전 승인 메시지가 **삭제 완료 안내**를 의미하지 않도록 구분한다.
- 미저장 사본은 별도 검토용 JSON으로 내보내고 일반 백업 복원 경로에서 사용하지 않는다. 다운로드 파일은 암호화되지 않았다.

## 자동 회귀 시험

신규 `tools/tests/apuda-note-v3-mutations-browser.py`는 임시 localhost 웹 서버와 실 Chromium에서 **실제 V3 HTML의 수정·삭제 UI**를 조작한다. 5개 경로 각각의 지연 완료/성공/거절, 원본 JSON 유지, 승인 이후 성공 표시, 임시 사본 및 다른 탭 동시 쓰기를 검사한다. 실제 Drive 및 외부 네트워크는 브라우저에서 차단한다.

기존 `tools/tests/apuda-note-v3-full-ui-e2e.py` 84항목과 `tools/tests/apuda-note-v3-async-port-browser.py` 21항목도 같은 workflow에서 계속 실행한다. **CI 실행 전에는 새 시험을 PASS로 판단하지 않는다.**

## 대화 저장: 미전환 상태를 명시

현재 `saveChat()`는 동기식 `localStorage` writer이며 **정의 1곳과 직접 호출 2곳**이 있다.
1. `addMsg()`: 대화 DOM을 먼저 생성·표시한 다음 `chat.push(...);saveChat()`로 저장을 요청한다.
2. `undoLast()`: 대화 DOM 내용을 먼저 변경한 다음 `row.h=...;saveChat()`로 저장한다.

이 상태에서 `saveChat()`만 Promise 반환으로 바꾸면 화면과 저장 완료 확인 시점이 어긋난다. 따라서 대화 호출부는 무리하게 변경하지 않고, 우선 `tools/tests/apuda-note-v3-chat-ack-audit.cjs` 정적 회귀 검사로 **미완료 전환을 배포 차단 항목**으로 유지한다. 실제 대화 비동기 전환 시에는 사용자 메시지·봇 응답 여러 건의 순서 보장, 실패 시 화면 표시 상태, 재시도/중복 방지, 미저장 메시지 내보내기를 동시에 설계해야 한다.

## 출시 차단
- 실제 V3 저장 엔진은 **여전히 동기식 localStorage**. 이번 변경은 UI 콜백만 미래 비동기 저장에 대비한 것이다.
- 오래된 V3 탭과 구형 Service Worker가 동일 저장 계약을 사용하지 않아 TOCTOU P0 데이터 덮어쓰기 위험이 남는다.
- Google Drive 자동 업로드/사본 정리, 파일 복원·되돌리기·전체 삭제, 모바일 Android/iOS 실기기, 실제 의료진·환자·보호자 감수 미진행.
- 운영 main 병합/Netlify 운영 배포, 실제 환자·논술 기록·Drive 접근 및 변경 금지.

**Draft 유지 / P0 OPEN / NOT RELEASED.**
