# 1분 복습 녹음 설정

1분 복습은 공부방에서 음성 원본을 녹음하고, 받아쓴 글을 일반 Chat 새 대화에 전달한 뒤, 정리와 질문을 공부방에 저장하는 흐름이다. 음성 파일은 기기 보관함에 먼저 남기며, Google 연결이 활성화되어 있으면 선택한 Drive 폴더의 과목별 하위 폴더에 저장한다.

## 파일과 저장 상태

- 과목·주제를 고르고 `1분 녹음 시작`을 누른다. 최대 60초이며, 앱을 나가거나 직접 멈춰도 받은 음성은 보관한다.
- 예: `수학_함수의-뜻_2026-10-20_07-55-46.123_KST.webm`. 실제 시작 시각의 한국시간을 사용한다. Safari 등에서 `audio/mp4`를 녹음하면 확장자는 `.m4a`다. 형식 변환이나 확장자만 바꾸는 처리는 하지 않는다.
- `기기에 보관 중`, `Drive 저장 대기`, `Drive 저장 확인됨`을 구분한다. Drive 파일 ID·이름·부모 폴더·바이트 수·파일 링크를 다시 조회해야 저장 완료로 표시한다.
- 전송 전 생성한 Drive 파일 ID를 IndexedDB에 보관한다. 응답 유실 후 재시도는 같은 ID를 먼저 조회하므로 중복 업로드를 피한다.
- 녹음 중에는 받은 조각을 기기에 보관한다. 비정상 종료 후 남은 조각은 중단된 녹음으로 표시하고 자동 업로드하지 않는다. 먼저 소리를 확인한 뒤 수동으로 저장할 수 있다. 마지막 조각을 받기 전 강제 종료된 소리는 복구를 보장하지 않는다.
- 받아쓰기는 브라우저 지원·권한·네트워크에 따라 실패할 수 있다. 이 경우 음성 원본과 받아쓴 글의 저장 여부를 별도로 확인한다. ChatGPT에서 직접 음성 입력한 소리는 이 웹앱이 가져와 보관할 수 없다.

## Google 연결 활성화에 필요한 것

ChatGPT의 Google Drive 플러그인 연결은 외부 공부방 웹앱의 OAuth 권한으로 재사용되지 않는다. 웹앱용 Google Cloud 설정이 한 번 필요하다. 비밀키나 토큰을 저장소에 커밋하지 않는다.

1. Google Cloud 프로젝트에서 **Google Drive API**, **Google Picker API**를 활성화한다. OAuth 동의 화면을 구성하고, 테스트 상태라면 사용할 Google 계정을 테스트 사용자로 등록한다.
2. OAuth 클라이언트를 **웹 애플리케이션** 유형으로 만든다. 승인된 JavaScript 원본에 `https://future.apuda.app` 및 실제로 시험할 고정 미리보기 원본을 등록한다. 와일드카드 미리보기 원본은 사용할 수 없다.
3. Picker용 브라우저 API 키를 만든다. API 제한은 Drive/Picker로, 웹 참조자 제한은 해당 앱 원본과 `https://docs.google.com/*`로 설정한다. `APP_ID`는 프로젝트 **번호**다.
4. future-compass Netlify 사이트 환경 변수에 아래 공개 설정을 넣고 배포한다. 클라이언트 시크릿·액세스 토큰·리프레시 토큰은 이 구성에 필요하지 않다.

| 환경 변수 | 값 |
|---|---|
| `GOOGLE_DRIVE_CLIENT_ID` | 웹 OAuth 클라이언트 ID |
| `GOOGLE_DRIVE_API_KEY` | 제한된 브라우저/Picker API 키 |
| `GOOGLE_DRIVE_PROJECT_NUMBER` | Google Cloud 프로젝트 번호 |

5. 공부방 `1분 말하기 → Drive 연결 · 다른 녹음 파일 → Google Drive 연결`에서 계정을 승인한다. Google Picker에서 준비한 `승준 공부방/1분 복습 녹음` 폴더를 고른다. 이 폴더에 쓸 수 있는지 확인한 뒤 과목별 하위 폴더를 생성한다.
6. 녹음이 끝나면 실제 Drive 파일을 열어 재생한다. Google 권한 취소·토큰 만료·오프라인 상태에서도 녹음이 기기에 남고, 재연결 후 중복 없이 저장되는지 확인한다.

권한은 `drive.file`만 요청한다. 다른 Drive 파일 전체를 읽는 권한은 요청하지 않는다. 토큰은 현재 페이지 메모리에만 남기므로 페이지를 다시 열거나 Google 연결이 만료되면 다시 연결해야 한다. 이미 업로드한 파일은 계속 Drive에 남는다. 백그라운드에서 무인 OAuth 갱신을 약속하지 않는다.

## 일반 Chat 연결

1분 복습 링크는 `https://chatgpt.com/`의 새 대화를 사용한다. 이 흐름에서는 사용자 지정 GPT URL과 Android 앱 강제 실행 intent를 사용하지 않는다. 짧은 요청은 전체만 URL에 포함하고, 긴 요청은 원문 전체 복사로 전달한다. 복사 성공 여부를 확인하고 실패하면 직접 복사할 요청을 표시한다.

ChatGPT의 Chat/Work 모드를 외부 링크로 강제로 선택하는 공식 방법은 확인되지 않았다. 따라서 전송 전에 ChatGPT 상단의 **Chat**을 확인하며, Work가 켜져 있으면 Chat으로 바꿔야 한다. 프롬프트의 “일반 채팅으로 답해줘”는 모드 전환을 보장하는 설정이 아니다.

ChatGPT 답은 사용자가 복사한 뒤 공부방의 붙여넣기 버튼으로 가져온다. 자동 클립보드 읽기·답변 자동 회수는 하지 않는다. 수업 내용을 아직 보내지 않은 빈 초안도 앱 전환 후 복구한다.

## 검증 명령

```bash
node future-compass/scripts/check.mjs
node future-compass/scripts/check-recording-config.mjs
CHROMIUM_PATH=/path/to/chromium node future-compass/scripts/audit-audio-vault.cjs /tmp/audio-vault-audit
AUDIO_FIXTURE=/tmp/audio-vault-audit/encoded-microphone.webm CHROMIUM_PATH=/path/to/chromium node future-compass/scripts/audit-talk-note.cjs /tmp/talk-note-audit
```

브라우저 검증은 실제 앱 렌더링과 실제 MediaRecorder 인코딩을 사용한다. Google Identity·Picker·Drive API는 가짜 응답으로 검증하며 실제 계정에 테스트 녹음을 전송하지 않는다. 실계정 OAuth 동의와 실제 Drive 파일 재생은 별도의 운영 연결 확인 단계다.

## 공식 문서

- [Chat과 Work 선택](https://learn.chatgpt.com/docs/use-chatgpt)
- [ChatGPT 음성 받아쓰기](https://learn.chatgpt.com/docs/prompting)
- [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Drive API 범위](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Google Picker 웹 통합](https://developers.google.com/workspace/drive/picker/guides/web-picker-sample)
- [Drive 업로드](https://developers.google.com/workspace/drive/api/guides/manage-uploads)
