# 미래 나침반 앱 운영

## 앱과 데이터
8개 화면, 미래 10개 분야, 관심 과목·활동 연결, 12주 실천계획, 공식 AI 뉴스. PWA manifest와 service worker를 포함해 지원 브라우저에서 홈 화면 설치와 저장된 화면의 오프라인 열기를 제공합니다. 관심과 체크는 각 기기의 브라우저에 저장됩니다. 계정·기기 간 동기화는 현재 없습니다. 최신 뉴스는 인터넷 연결이 필요합니다.

## 자동화
GitHub main의 future-compass가 원본입니다. Future Compass daily news and deploy가 매일 07:00 한국시간(UTC 22:00)에 공식 RSS를 수집하고 최대 30건의 news.json을 커밋합니다. 예약 실행은 지연될 수 있습니다. 공식 제목만 표시하며 분야 연결은 키워드 기반입니다. 출처별 실패는 표시하고 이전 소식을 유지합니다. 전체 수집 실패는 Actions 실패로 기록됩니다.

## Netlify
새 Netlify 프로젝트에 Mespital/ApuDa main을 연결하고 base directory를 future-compass로 설정합니다. publish는 dist, 검사는 node scripts/check.mjs입니다. Actions secrets NETLIFY_AUTH_TOKEN, FUTURE_NETLIFY_SITE_ID가 있으면 코드 변경과 뉴스 수집 후 자동 배포됩니다. 미설정 시 단계가 배포 없이 종료되고 작업 요약에 안내가 남습니다. 기존 Sites 앱은 GitHub news.json을 직접 읽어 뉴스가 재배포 없이 갱신됩니다. 화면 코드의 Sites 반영은 별도 배포가 필요합니다.

## VPS
workflow는 기존 apuda-ai-vps 환경의 VPS_HOST, VPS_USER, VPS_SSH_KEY를 재사용합니다. 전용 FUTURE_VPS_HOST/FUTURE_VPS_USER/FUTURE_VPS_SSH_KEY가 있으면 우선합니다. 연결 정보가 없으면 작업 요약에 표시합니다. 최초 호스트키 확인 방식은 기존 VPS workflow의 ssh-keyscan을 따릅니다. 확인한 SSH 호스트 공개키를 FUTURE_VPS_KNOWN_HOSTS에 저장하면 이후 키를 고정합니다.

배포 경로는 사용자의 ~/future-compass입니다. 새 release 업로드 후 current 링크를 전환하며, Docker Compose 프로젝트 future-compass가 localhost 8092 포트에서 서비스합니다. 메모리 제한 96MB, CPU 제한 0.5입니다. /health 응답을 검사합니다. 외부 공개 포트는 열지 않습니다. 기존 ApuDa AI 서비스와 별도로 동작합니다. 공개 HTTPS 주소를 붙이려면 서버 Caddy에 해당 도메인의 reverse_proxy 127.0.0.1:8092를 추가하고 DNS를 연결합니다. 이 변경은 아직 포함하지 않았습니다. 실제 VPS 연결·기동 여부는 Actions vps 작업 결과를 확인하세요.

## 설치와 갱신
앱의 “앱으로 사용” 버튼을 누릅니다. 지원 브라우저는 설치 안내를, 나머지는 홈 화면 추가 방법을 표시합니다. PWA의 새 버전은 기존 앱 창을 닫고 다시 열 때 적용됩니다. 캐시는 이 앱의 공개 탐색 자료만 저장하며 로그인 정보·외부 기사의 본문은 저장하지 않습니다.

## 실시간 동기화 + 흰둥이 똑똑 모드
- live 컨테이너(node:22-alpine, 127.0.0.1:8093, 128MB)는 VPS 배포 때 항상 같이 뜬다. 비밀값 없이 동작:
  티켓은 Netlify가 가족 기기 토큰 확인 후 ed25519로 서명(24시간), VPS는 공개키를 https://future.apuda.app/api/family(live-pub)에서 자동으로 가져온다.
- VPS로는 기록 내용이 가지 않고 '바뀐 키 이름'만 중계.
- 공개 주소: DNS `live.apuda.app` → VPS (가장 쉬움: `CNAME live → ai.apuda.app`). DNS가 이 VPS를 가리키면 배포 때 /etc/caddy/Caddyfile 끝에 블록을 추가(없을 때만, `caddy validate` 통과 시에만 reload). 권한이 없으면 직접:
  ```
  live.apuda.app {
    reverse_proxy 127.0.0.1:8093 {
      flush_interval -1
    }
  }
  ```
- Netlify는 기본으로 https://live.apuda.app/health 를 5분마다 확인해 살아 있을 때만 앱에 알려준다(다른 주소면 `FC_LIVE_URL`, 끄려면 `FC_LIVE_OFF=1`). 죽어 있으면 앱은 20초 확인 방식으로 동작.
- 흰둥이 똑똑 모드 AI 키(둘 중 하나): GitHub 환경 `apuda-ai-vps` 비밀값 `ANTHROPIC_API_KEY`(VPS에서 응답) 또는 Netlify 환경변수 `ANTHROPIC_API_KEY`. 모델은 `FC_CHAT_MODEL`(기본 claude-haiku-4-5).
- ChatGPT로 쓰기: GitHub 환경 `apuda-ai-vps` 비밀값 `OPENAI_API_KEY` (또는 Netlify 환경변수 `OPENAI_API_KEY`). 둘 다 있으면 Claude 먼저·실패 시 ChatGPT. ChatGPT를 먼저 쓰려면 변수 `FC_CHAT_PROVIDER=openai`, 모델은 `FC_OPENAI_MODEL`(기본 gpt-4o-mini).
- 공부 자료 근거 답변: ⚙️ 설정 → 흰둥이 → 📚 공부 자료(텍스트·.txt·.md·.pdf). VPS `live-data/docs.json`에 저장(최대 6MB). 질문과 맞는 자료 조각 → 없으면 관련 내 노트 → 개념 질문이면 한국어 위키백과 요약을 근거로 답하고 출처 표시. 위키 검색 끄기: `FC_WEB_SEARCH=off`.

## 🎙️ 1분 녹음 자동 처리 (받아쓰기 · 정리 · Google Drive)
흐름: 공부방 녹음 끝 → live `/voice` → `stt`(faster-whisper small, CPU) 받아쓰기 → 흰둥이 AI(Ollama 등) 정리 → `rclone` 으로 Drive `승준 공부방/1분 복습 녹음/<과목>/` 에 녹음·받아쓰기·복습정리 3개 저장 → 공부방이 결과를 받아 노트·복습에 반영.
- 기기 원본 녹음은 그대로 남는다. 서버는 처리 후 소리 데이터를 지우고 결과 JSON만 48시간 보관(`live-data/voice/`).
- 48시간은 작업 시작 기준이다. 조회 시 만료 결과를 반환하지 않으며 1분 주기 정리로 새 녹음 없이도 만료 JSON을 지운다. Drive 사본·기기 원본은 이 만료와 별개다.
- 재시작 때 미완료 작업은 `interrupted`가 된다. 녹음 원본은 서버 JSON에 넣지 않는다. 공부방의 **기기 원본으로 다시 처리**로 같은 ID·원문 지문을 재전송하면 저장된 처리 단계부터 이어간다. 소스가 다른 재전송은 거절한다.
- rclone은 같은 경로의 기존 파일을 먼저 확인한다. 이름·크기·MD5가 같은 파일은 중복 쓰지 않으며, 다르면 덮어쓰지 않고 실패를 알린다. 업로드 후 실제 원격 파일과 부모 폴더를 재조회한다.
- VPS 파일 결과에는 원격 ID·폴더 ID·이름·크기·MD5와 원본 SHA-256이 포함된다. 프런트·VPS를 같은 버전으로 배포해야 한다. 이전 VPS 결과에 검증 정보가 없으면 완료로 표시하지 않고 재처리를 안내한다.
- 서버가 꺼져 있거나 `voice` 서비스가 없으면 앱은 자동으로 ChatGPT 전달 흐름으로 돌아간다.
- `stt`·`rclone` 은 외부 포트가 없고 live 컨테이너만 부른다.

### 처음 한 번 (VPS)
1. 배포 폴더 확인: `ls -d ~/future-compass /root/future-compass /home/*/future-compass 2>/dev/null`
2. PC 터미널에서 터널을 열고 접속: `ssh -L 53682:127.0.0.1:53682 root@<VPS IP>`
3. 그 접속 안에서 (배포 폴더로 이동 후):
   ```bash
   mkdir -p rclone stt-models
   docker run --rm -it --network host -v "$PWD/rclone:/config/rclone" rclone/rclone:1.68.2 config
   ```
   `n`(새 연결) → 이름 `gdrive` → 저장소 `drive` → client_id·secret 비움 → scope `1`(drive) → 나머지 기본값 → "Use web browser" `y` → 화면에 나온 `http://127.0.0.1:53682/...` 주소를 **PC 브라우저**에서 열고 Google 로그인·허용 → Shared Drive `n` → `y`(저장) → `q`
4. 켜기:
   ```bash
   touch voice.on
   docker compose -p future-compass -f compose.yaml --profile voice up -d --build stt rclone
   docker compose -p future-compass -f compose.yaml up -d --force-recreate live
   sleep 60; curl -s http://127.0.0.1:8093/health
   ```
   `"voice":{"stt":true,"drive":true,...}` 이면 끝. 받아쓰기 모델(약 500MB)은 처음 켤 때 내려받아 1~3분 걸린다(그동안 `stt:false`).
- 이후 배포 때마다 `voice.on` 이 있으면 stt·rclone 도 같이 갱신된다.
- 끄기: `rm voice.on; docker compose -p future-compass -f compose.yaml --profile voice stop stt rclone`
- Drive 연결 해제: Google 계정 → 보안 → 타사 액세스에서 rclone 삭제, `rclone/rclone.conf` 삭제.
