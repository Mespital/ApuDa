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
