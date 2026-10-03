# 미래 나침반 배포

## 현재 구조
GitHub main의 future-compass/dist가 공개 배포 원본입니다. 매일 한국시간 오전 7시 GitHub Actions가 공식 RSS 원문 제목을 수집하고 news.json을 커밋합니다. 실행은 지연될 수 있으며 일부 출처 오류는 이전 소식을 유지하고 표시합니다. 기존 앱은 GitHub의 뉴스 파일을 직접 읽어 뉴스만은 재배포 없이 갱신됩니다. 화면 소스 변경은 Netlify/VPS 연결 후 자동 배포됩니다. 기존 Sites 화면 소스는 별도 배포가 필요합니다.

## Netlify 연결 (미완료)
GitHub Mespital/ApuDa의 main을 새 Netlify 프로젝트에 연결하고 Base directory를 future-compass로 설정합니다. publish 디렉터리는 dist입니다. Git 연결만으로 코드 변경 자동 배포가 됩니다. 예약 뉴스 커밋은 GITHUB_TOKEN으로 작성되어 다른 GitHub Actions를 다시 실행하지 않으므로, 위 workflow가 같은 실행에서 Netlify 배포도 수행합니다.
GitHub repository Actions secrets에 NETLIFY_AUTH_TOKEN, FUTURE_NETLIFY_SITE_ID를 추가하면 배포 단계가 활성화됩니다. 토큰을 소스나 채팅에 붙이지 않습니다. Netlify 프로젝트 공개 범위는 별도로 확인합니다.

## VPS 연결 (미완료)
전용 배포 사용자와 디렉터리를 사용합니다. Actions secrets FUTURE_VPS_HOST, FUTURE_VPS_USER, FUTURE_VPS_SSH_KEY, FUTURE_VPS_KNOWN_HOSTS(별도 경로에서 확인한 SSH 호스트 공개키)를 설정하고 repository variable FUTURE_VPS_ENABLED=true를 설정합니다. 서버 웹서비스의 document root를 배포 사용자 홈의 future-compass/current로 설정하고 HTTPS를 구성합니다. 기존 ApuDa AI 서비스를 수정하지 않습니다. 배포는 새 디렉터리에 업로드한 뒤 링크를 바꿔 적용합니다. 이전 릴리스를 남겨 되돌릴 수 있습니다. VPS는 필요할 때만 병행하며 뉴스 수집은 GitHub 한 곳에서 실행합니다.

## 운영 확인
Actions의 Future Compass daily news and deploy 실행에서 RSS 수집·커밋·선택된 배포 결과를 확인합니다. 전체 출처 수집 실패는 실행 실패로 표시됩니다. 일부분 실패는 news.json의 failures에 기록됩니다. 공개 원문 제목만 수집하며 기사 요약·취업 전망으로 가장하지 않습니다. 관심 선택과 체크는 각 브라우저 localStorage에만 저장됩니다.
