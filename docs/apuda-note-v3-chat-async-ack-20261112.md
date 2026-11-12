# ApuDa V3 — 대화 저장 확인·순서 직렬화 (개발 Draft PR #294)

작성일: 2026-11-12 KST. 검토 성격: AI 개발·보안·접근성 사전점검. 실제 임상전문의, 환자, 보호자의 참여 감수는 수행하지 않음.

## 변경 전 위험
대화의 `addMsg()`는 화면에 메시지를 표시하고 `chat.push`를 수행한 다음 기존 동기식 `saveChat()`을 호출했다. 향후 저장소가 IndexedDB 기반 Promise로 바뀌면 **화면에 표시된 내용이 아직 저장되지 않았어도 사용자가 저장 완료로 오해**할 수 있다. 사용자 문장과 여러 AI 안내를 연속 생성할 때 비동기 쓰기가 역순으로 완료되어 최신 기록을 오래된 메시지가 덮는 문제도 예방해야 한다. `undoLast()`는 건강기록과 대화의 저장 성공을 확인하기 전에 취소 완료 알림을 표시했다.

## 구현 내용
- `saveChat(messageKey)`는 `chatWriteTail` Promise 큐를 이용해 **입력 순서대로 기록 원문 스냅샷을 저장**한다. 각 작업의 커밋이 완료된 뒤에 다음 작업을 시작한다.
- `commitChatRaw(raw)`는 현재의 `NOTE_WRITE_FENCE.write(localStorage,...)`을 호출하는 개발용 경계다. 현재 실서비스 저장 엔진을 IndexedDB로 바꾼 것이 아니다.
- 새 메시지는 즉시 화면에 나타나되 `data-chat-save="pending"` 및 `저장 중` 표시가 붙는다. 저장 확인 후 `saved`, 오류 시 `failed`로 바뀌어 **저장 여부를 명시적으로 구별**한다. 알림용 문구는 HTML 태그를 포함한 대화 원문에 저장되지 않는다.
- 저장 실패 시 `holdUnsaved('chat',JSON.stringify(chat),error)`로 사용자·안내를 포함한 당시 최신 대화 문자열을 **메모리에 보존**하고 경고를 표시한다. 해당 탭의 추가 기록 저장은 중단된다. 검토용 JSON 파일은 일반 복원 파일이 아니며 암호화되지 않은 건강정보를 담을 수 있다.
- `sendText/sendBatch`는 이미 미저장 원문이 존재하면 새로운 기록을 시작하지 않는다. 다른 탭이 대화를 수정한 것을 작업 중에 감지하면 쓰기 중단과 원문 보존을 시도한다.
- `undoLast()`는 건강기록 저장과 대화 저장을 각각 기다린 뒤에만 ‘기록 취소’ 성공 알림을 표시한다. **두 개의 독립 저장소 사이에 원자적 합의가 보장되는 것은 아니므로**, 대화 저장 실패 시 취소 완료를 주장하지 않고 검토용 원문을 남긴다.

## 실제 브라우저 자동시험
- 기존 `apuda-note-v3-full-ui-e2e.py`의 대화 반환값을 비동기 상태 객체 `{status:'saved' | 'blocked-review-required'}`에 맞춰 업데이트했다.
- 신규 `tools/tests/apuda-note-v3-chat-browser.py`: 임시 localhost에서 실제 `note/index.html` 전체를 연 다음 합성 대화만으로 **대화 2건 저장 순서, 단계별 저장 상태, HTML 원문, 강제 실패, 전체 미저장 대화 사본, 다른 탭 최신 기록 보존, 용량 오류, 기록 취소 확인 시점**을 검증한다.
- 정적 검증 `apuda-note-v3-chat-ack-audit.cjs`는 두 개의 기존 호출부의 비동기 완료 확인 상태, 저장 전후 UI, 실패 처리를 검토한다.
- 실행: `python tools/tests/apuda-note-v3-chat-browser.py` (Playwright/Chromium)와 `node tools/tests/apuda-note-v3-chat-ack-audit.cjs`.
- 새 CI 실행 완료 전에는 테스트 PASS를 주장하지 않는다. 통과 결과는 해당 SHA GitHub Actions 실행 로그에만 근거하여 업데이트한다.

## 배포 차단 조건 (P0)
V3 건강기록과 대화는 여전히 각각 `localStorage`의 독립 키를 사용한다. 진짜 IndexedDB 원자적 기록·대화·복원·삭제 계약을 실서비스에서 연결한 것이 아니고, 구형 탭과 Service Worker 구버전은 새 큐 규칙을 전혀 모른다. Google Drive 자동 업로드/사본 정리, 다른 기기, 복원 파일, Android/iOS Safari 실기기, 사용자 경험 검증이 아직 필요하다.

**운영 main 병합·Netlify 운영 배포·실제 환자 기록·학생 논술 기록·실제 Google Drive 백업 접근·변경은 금지. 두 PR 모두 Draft 유지.**

## 2026-11-12 KST — 실제 Chromium CI 실행 증거

- **검증된 코드 SHA:** `1c3dde37388c6904c6fa90ec760ec08f9f1429e5` (직전 코드 변경 SHA `108470f5ea54333d9177f633cdfd2892a015b1e0`, 이후 테스트 클릭 경로만 수정).
- **GitHub Actions 실행:** https://github.com/Mespital/ApuDa/actions/runs/43161016038
- **V3 전체 화면 기존 회귀:** `RESULT 84/84 PASS`.
- **IndexedDB 합성 비동기 포트:** `RESULT 21/21 PASS`.
- **실제 V3 수정·삭제 UI:** `RESULT 78/78 PASS`.
- **신규 실제 V3 대화 저장 UI:** `RESULT 37/37 PASS`.
- **총 브라우저 검사 220/220 통과, 오류 0건**. 별도 대화 저장 정적 감사 15개 검사 통과.
- 테스트 환경: Ubuntu 24.04 + Playwright Chromium, 신규 임시 localhost Origin, 가상 건강기록·채팅만 사용, 외부 네트워크/Drive 요청 및 Service Worker 차단.
- 최초 대화 테스트는 **33항목까지 통과 후 기록 취소 버튼이 숨겨진 탭에 있어 클릭 실패**했다. 실사용 UI의 노트봇 탭(`tab('today')`)으로 전환한 뒤 재실행하여 37/37을 확인했다. 이 중간 실패는 앱 저장 오류라고 단정하지 않았으며 CI 이력으로 남았다.

### 배포를 막는 안전성 한계

- **대화 큐는 화면 내 요청 순서만 보장**한다. 새 코드를 실행하지 않는 구형 탭은 `localStorage`를 동시에 수정할 수 있으며 원자적 저장 계약을 따르지 않는다.
- `undoLast()`는 건강기록 저장과 대화 저장을 *각각* 확인하지만, **서로 다른 두 키의 단일 트랜잭션이 아니다.** 첫 번째 저장이 완료된 후 두 번째 저장이 실패하면 상태 불일치 가능성이 있어 성공 안내를 내리지 않고 검토용 사본을 보존해야 한다.
- 브라우저 메모리의 미저장 사본은 페이지 종료 시 사라질 수 있다. 다운로드한 JSON은 암호화되지 않으며, 파일이 정상 보관됐는지 사용자가 확인해야 한다.
- 실제 Android Chrome / iOS Safari, 과거 Service Worker 캐시, Google Drive 자동 백업·사본 정리, 기존 사용자 데이터 이전과 사람 사용자 검증은 미실시.

**최종 판정: P0 유지, Draft PR 미병합, Netlify 운영 배포 금지.** 실제 환자·학생 논술 기록 및 Google Drive 개인 파일에는 접근하거나 변경하지 않았다.
