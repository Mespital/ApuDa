# 승준 공부방 · AI 학습실(StudyLab) 통합 가이드

## 목적
기존 운영 주소 `https://future.apuda.app` 아래에 새 사이트가 아닌 `/studylab.html`을 통합한다.

## 진입 경로
- 승준/보호자: `study.html` → 하단 **더보기** → **AI 학습실 · 20개 명령어**
- 기존 **복습** 화면의 **공부 명령어** 카드 → **AI 학습실** 링크
- 바로가기: `https://future.apuda.app/studylab.html`
- 복귀: 화면 상단 **← 승준 공부방**

## 보존 원칙
`study.html`, 학생 가족 PIN, 수능 기출 자료, 기존 복습·학습 기록 스키마는 변경하지 않는다. StudyLab은 자체 LocalStorage 데이터를 사용하므로 기기 간 가족 동기화 대상으로 오인하지 않는다. JSON 내보내기/가져오기를 이용한다.

## 구현
- `dist/studylab.html`: 기존 StudyLab 단일 HTML 앱, 기존 공부방 PIN 게이트 재사용
- `netlify/functions/studylab-generate.mjs`: 20개 명령어의 구조화된 생성, 서버 내 API 키, 세션 접근코드
- `netlify/functions/studylab-status.mjs`: 환경 변수 설정 유무 확인
- `dist/app-nav.js`: 아동/보호자 더보기 메뉴 연결
- `dist/study-commands.js`: 기존 20개 프롬프트 UI에서 학습실 바로가기
- `dist/sw.js`: 오프라인 화면 캐시 버전 변경
- `scripts/check-studylab.mjs`: 통합 회귀검사. Netlify build에서 자동 실행

## Netlify 연결
기존 GitHub 연결과 `future-compass/netlify.toml`이 사용되므로 새로운 Netlify 사이트를 만들지 않는다. main 병합 시 기존 Netlify Git 자동 배포를 기다리고 상태를 확인한다.

### 실제 AI 생성용 필수 설정
Netlify의 **future-compass** 프로젝트 환경 변수(Functions 범위)에 추가:
- `OPENAI_API_KEY`: OpenAI API 비밀키. 절대 GitHub·브라우저·대화에 기재 금지
- `STUDYLAB_ACCESS_CODE`: 학생/관리자만 아는 20자 이상 임의 접근코드
- `OPENAI_MODEL`(선택): 기본 `gpt-4.1-mini` 대신 사용 권한이 있는 모델 ID 지정

변수 저장 후 **재배포**해야 반영된다. 앱 **설정 → AI 연결**에서 접근코드를 입력한다. API 연결 전에도 20가지 명령어 선택·복사, 학습 예시·암기카드·퀴즈·백업은 동작한다. ChatGPT Plus 구독과 API 사용료는 별도다.

### 보안 주의
기존 가족 PIN은 **클라이언트 화면 잠금**이며 인증된 서버 계정 시스템이 아니다. AI API는 별도 접근코드가 맞아야 동작한다. 요청 빈도/IP 제한·월 사용예산 제한은 Netlify/플랫폼 또는 API 사용량 대시보드에서 별도로 운영해야 한다. 민감한 학생 개인정보·실명·연락처를 학습자료에 넣지 않는다. API는 `store:false`를 사용한다. AI 창작문제를 공식 기출로 표시하지 않는다.

## 확인
1. `cd future-compass && node scripts/check.mjs`
2. Netlify Deploy Preview에서 `studylab.html`로 이동하여 모바일 가로 스크롤·PIN 화면·더보기 메뉴·데모 퀴즈/복습/JSON 백업 확인
3. `GET /.netlify/functions/studylab-status` → `ready:false`면 키 설정 전 상태(정상)
4. 환경 변수 설정 후 `/cheatsheet` 등으로 실 AI 생성 테스트
5. 운영에 반영되었는지는 deploy commit SHA가 main의 최신 커밋과 일치하는지 확인

## 되돌리기
기존 코드/기록을 삭제하지 않는다. 문제가 생기면 해당 통합 PR의 커밋을 revert하여 새 메뉴·화면·서버 함수만 롤백한다.
