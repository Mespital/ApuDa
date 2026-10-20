# 공부방 → ChatGPT → Google Drive

## 사용 흐름

1. `1분 말하기` 또는 노트 사진에서 내용을 만들고 **노트 저장 · 채팅·Drive로 보내기**를 누른다. 기존 노트는 복습 탭의 **채팅·Drive로 보내기**를 사용한다.
2. 노트와 복습 날짜를 기기에 먼저 저장한 다음, 원문 Markdown·원본 JSON·녹음 또는 사진을 전달용 보관함에 올린다. 합계 3MB, 접근 기한 24시간이다.
3. 준비 창에서 요청 전체를 복사하고 일반 Chat을 열어 보낸다. 파일을 다시 찾아 첨부할 필요 없이 ChatGPT가 전달 URL에서 내려받는다. 외부 링크로 Chat/Work를 강제로 선택하는 공식 방법은 확인되지 않았으므로 실제 모드는 ChatGPT에서 확인한다.
4. ChatGPT는 현재 계정에 연결된 Google Drive MCP로 `승준 공부방/1분 복습 녹음/과목`을 찾아 원본을 저장한다. 새 복습 정리도 별도 `_복습정리.md` 파일로 남긴다. 원본 형식과 `과목_주제_한국시간_KST` 이름을 유지한다.
5. 업로드 후 각 Drive 파일의 ID·이름·바이트 수·부모 폴더·실제 링크를 조회한다. 확인이 끝나면 전달 자료에 포함된 결과 수신 주소로 정리와 파일 정보를 보낸다.
6. 공부방을 다시 열거나 **저장 결과 확인**을 누르면 정리와 링크가 노트 및 복습에 반영된다. 기존 내일·3일·7일 일정과 원문은 보존한다. 전달 후 과목·주제·원문·정리를 수정했다면 먼저 받은 결과를 보고 **정리 반영하기**를 선택한다. 지운 노트는 다시 만들지 않는다.

설정·복습 탭의 **학습 기록을 채팅·Drive로 보내기**는 시간표·할 일·시험·복습·질문·단원·학습 메모를 복원 가능한 JSON으로 보관한다. 가족 비밀번호, 가족 연결 토큰, Google 토큰, 연락처·위치·프로필 설정은 해당 내보내기 목록에 포함하지 않는다. 녹음·사진 바이너리는 각 노트에서 따로 전달한다. 백업 보관은 공부방 전체를 Drive와 실시간 양방향 동기화한다는 의미가 아니다.

## 연결과 배포

이 경로는 Google Cloud 프로젝트나 웹앱용 Google OAuth 클라이언트 없이, **채팅이 이미 가진 Drive MCP 권한**으로 저장한다. 웹앱이 ChatGPT의 OAuth 토큰을 가져오는 방식이 아니다. 추가 OpenAI API 호출도 없다. 기존 `@netlify/blobs` 및 Netlify Functions를 사용하므로 배포 환경의 Blobs 사용 권한·할당량이 필요하다.

`study-handoff.mjs`와 `study-handoff-cleanup.mjs`를 포함한 Git 배포가 필요하다. 예약 정리는 운영 배포에서 매시 17분(UTC)에 실행한다. SDK가 Functions에 주입된 Netlify 자격 증명을 사용하며 별도 토큰을 소스에 넣지 않는다. 실제 배포에서 보관함 접근에 실패하면 503으로 실패를 표시한다.

기존 `audio-vault.js`의 웹앱 직접 Drive 업로드는 선택 기능으로 남긴다. 그 경로만 `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_API_KEY`, `GOOGLE_DRIVE_PROJECT_NUMBER` 및 Google 최초 승인이 필요하다. 두 경로의 완료 상태를 혼동하지 않는다.

## 전달 계약

`POST /.netlify/functions/study-handoff?mode=create`는 같은 Origin의 multipart만 받는다. `packet`에는 버전·32자리 hex ID·256bit ownerKey·선별한 source를 넣고 `audio`, `photo`, `backup` 바이너리를 첨부한다. Google/가족 토큰을 packet에 넣지 않는다. 클라이언트가 ID와 ownerKey를 먼저 기기에 저장하므로 응답 유실 후 상태를 조회할 수 있다. 같은 ID로 다른 자료를 덮어쓰면 409다.

서버는 ownerKey로부터 서로 다른 읽기·결과 제출 키를 도출한다. 원본 및 상태는 역할별 키 없이는 읽을 수 없다. 전달 URL은 그 자료만 24시간 읽을 수 있는 비밀 링크다. 계정 인증이나 전체 Drive 권한이 아니며, 받는 사람도 자료를 볼 수 있으므로 사용자가 ChatGPT에 전달하는 자료라는 점을 UI에 표시한다. 결과 제출 키도 그 작업에만 사용한다.

- GET 기본: source·files(크기/SHA-256/다운로드 URL)·reviewFile·destination·receipt 반환. ownerKey·원본 바이너리·보관함 관리 권한은 반환하지 않는다.
- GET `mode=file&file=역할`: 정확한 원본 바이트 반환. JSON/다운로드 응답은 private/no-store, no-referrer, noindex다. 서비스 워커는 이 경로를 캐시하지 않는다.
- GET `mode=status`: owner Bearer로 그 작업의 결과만 조회.
- POST `mode=result`: report Bearer와 JSON. 모든 원본의 role/name/size/sha256, 실제 Drive id/parentId/url 및 `verified:true`가 필요하다. 노트는 summary(최대 2,000자), summary를 정확히 UTF-8 인코딩한 review 파일과 그 해시도 필요하다. 서버는 값의 일치와 Drive URL 형식을 검증하지만 Google에 독립적으로 재인증해 확인하지는 않는다. 실제 업로드 확인은 요청을 수행한 ChatGPT의 MCP 조회가 담당한다.
- DELETE: owner Bearer로 이 사이트의 전달 자료와 결과만 삭제. 기기 원본·Drive 파일을 지우지 않는다.

저장 결과 없는 ChatGPT 이동·복사·전달 자료 준비는 Drive 저장 완료가 아니다. 동일 결과 재전송은 허용하고 다른 결과 덮어쓰기는 409다. 읽기 기한이 지나면 권한이 있어도 원본을 반환하지 않는다. 예약 정리는 만료 작업·고아 결과를 최대 500건씩 정리한다. 개인 사용 규모를 넘으면 별도 큐/인증 및 청소 커서가 필요하다.

ChatGPT에 HTTP 파일 다운로드·결과 POST 도구 또는 Drive 쓰기 권한이 없으면 해당 단계를 수행할 수 없다. 이 경우 완료로 답하지 않도록 전달 요청에 명시한다. 사용자의 로그인이나 도구 권한이 없는데 백그라운드 저장이 되는 것처럼 표시하지 않는다.

## 검증

```bash
node future-compass/scripts/check.mjs
node future-compass/scripts/check-study-handoff.mjs
CHROMIUM_PATH=/path/to/chromium node future-compass/scripts/audit-study-chat-drive.mjs /tmp/chat-drive-audit
```

브라우저 검증은 실제 앱·HTTP 처리기·Chromium MediaRecorder를 쓰며 Drive는 로컬 fixture다. 실제 계정에 대한 MCP 저장과 배포 보관함 확인은 별도 운영 검증으로 구분한다.

공식 근거: [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), [Functions 설정](https://docs.netlify.com/build/functions/api/), [예약 함수](https://docs.netlify.com/build/functions/scheduled-functions/), [ChatGPT 연결 도구](https://learn.chatgpt.com/docs/use-chatgpt).
