# ApuDa VoxCPM VPS 설정

접속 주소: **https://ai.apuda.app/voice/**

원고를 입력하고 목소리를 선택하면 문장별로 음성을 생성한 뒤 하나의 WAV 파일로 합칩니다. 완성 음성은 브라우저에서 듣거나 내려받을 수 있습니다.

## 운영 구성

| 항목 | 설정 |
|---|---|
| 모델 | VoxCPM2, 한국어 지원 |
| 실행 방식 | llama.cpp-omni C++ CPU / GGUF |
| 모델 파일 | BaseLM Q8_0 + Acoustic F16, 합계 3,552,406,272바이트(약 3.31GiB) |
| CPU 제한 | 1.5코어, 런타임 스레드 2개 |
| RAM 제한 | 4.5GiB, RAM+swap 합계 5GiB |
| 작업 | 동시 생성 1건, 실행·대기 합계 최대 3건 |
| 원고 | 최대 800자, 문장당 최대 80자로 분할 |
| 출력 | 48kHz / 모노 / PCM16 WAV |
| 보관 | 완성 파일 7일, 생성 성공·실패 시 원고 본문 제거 |
| 서비스 경로 | `/srv/apuda-voxcpm` |
| 내부 포트 | `127.0.0.1:8818` |
| 공개 경로 | 기존 Caddy의 `ai.apuda.app`에 `/voice/` 경로 추가 |

CPU 서버에서의 생성 시간은 원고 길이와 다른 서버 작업에 따라 달라집니다. GPU 기준 속도를 CPU 성능으로 환산하지 않았습니다. 메모리 여유가 4,300MiB 미만이면 생성 순서를 유지하며 기다립니다. 각 문장의 최대 생성 시간은 15분입니다. 모델은 생성용 하위 프로세스가 끝나면 메모리에서 내려갑니다.

## 사용법

1. `https://ai.apuda.app/voice/`에 접속합니다.
2. 접속 코드에 기존 ApuDa AI API 키를 입력합니다. 키는 브라우저 저장소에 보관하지 않습니다.
3. 원고를 넣고 기본 / 차분한 남성 / 따뜻한 여성 목소리 중 하나를 선택합니다.
4. **음성 만들기**를 누릅니다. 생성 완료 후 재생 또는 **음성 내려받기**를 선택합니다.

내 목소리 샘플 기능은 3~20초, 16kHz, 모노, PCM16 WAV 파일을 받습니다. 목소리 설계 결과는 생성마다 달라질 수 있습니다. 긴 원고에서 목소리 일관성이 중요하면 같은 본인 녹음 샘플을 사용해 비교합니다. 의료용어·약 이름·숫자의 발음과 문장 누락 여부는 완성 음성을 들어 확인합니다.

## 배포

`.github/workflows/deploy-voxcpm-vps.yml`은 `feature/apuda-voxcpm-vps`의 서비스 변경 시 실행됩니다. 기존 `apuda-ai-vps` 환경의 `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`를 사용합니다. SSH 포트는 기본 22이며 `VPS_SSH_PORT`를 설정하면 해당 포트를 사용합니다. `VPS_KNOWN_HOSTS`가 있으면 고정한 호스트 키를 사용하고, 없으면 기존 배포와 같은 초기 호스트 키 등록 방식을 사용합니다.

GitHub runner에서 CPU 이미지를 빌드하고 VPS로 전송합니다. VPS는 해시가 고정된 모델 2개를 다운로드하고 각각 SHA-256을 검증합니다. 설치 시 기존 AI 서비스의 `/srv/apuda-ai/.env`에서 API 키를 서버 내부에서 읽어 사용합니다. 비밀번호·개인키·API 키를 코드나 로그에 출력하지 않습니다.

수동 설치는 저장소의 이 디렉터리를 `/srv/apuda-voxcpm`에 복사한 후 실행합니다.

```bash
cd /srv/apuda-voxcpm
sudo bash install.sh
sudo python3 smoke_test.py
```

## 상태 확인과 중지

```bash
cd /srv/apuda-voxcpm
docker compose -f compose.yml ps
curl -fsS http://127.0.0.1:8818/health
docker compose -f compose.yml stop
```

Caddy를 수정하기 전에 후보 설정을 검증하고 `/etc/caddy/Caddyfile.before-voxcpm-*.bak`에 이전 설정을 보관합니다. reload 실패 시 원래 설정으로 되돌립니다. 서비스 중지는 음성 컨테이너만 대상으로 하며 모델·음성 파일은 보존합니다.

## 검증 범위

- 단위 및 HTTP 검증: 인증 없는 생성·다운로드 차단, 문장 분할과 숫자 보존, 대기열 상한, 음성 합치기, 오류 상태, 원고 제거, 샘플 WAV 형식, Caddy 변경 보존·재실행.
- VPS 배포 검증: SSH 접속, 모델 다운로드 해시, 컨테이너 상태, 실제 한국어 원고의 WAV 생성·형식·무음 검사, 인증된 다운로드, 공개 HTTPS 경로, 기존 AI `/health`.
- 한국어 발음과 목소리의 자연스러움은 자동 WAV 검사로 판정하지 않습니다.

## 고정한 소스

- 공식 모델: https://github.com/OpenBMB/VoxCPM
- CPU 엔진: https://github.com/tc-mb/llama.cpp-omni — commit `88bd37eb671f67cf8d747140ed100231756e0bc3`
- GGUF 변환본: https://huggingface.co/DennisHuang648/VoxCPM2-GGUF — revision `169f64d8b98bbaab1761e4ca3a83e6af653456cc`

모델과 코드의 원래 라이선스를 준수합니다. 컨테이너에는 CPU 엔진의 LICENSE를 포함합니다.
