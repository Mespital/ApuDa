# ApuDa Hospital Information

암 진료 기관 및 검증된 의료진 정보 검색용 독립 Netlify 웹앱.

## 운영 구성
- **원본 코드:** `Mespital/ApuDa` 저장소의 `public-site/hospital-information/`
- **기존 ApuDa 주소 목표:** `https://apuda.app/hospital-information/` (기존 apuda.app Netlify 배포가 `public-site/`를 publish할 때)
- **독립 Netlify 앱:** 같은 GitHub 저장소에서 **Base directory**를 `public-site/hospital-information`으로 설정하고 **Publish directory**는 `.` (base 기준), Build command는 빈칸. 기존 메인 사이트와 별도의 Netlify 프로젝트로 배포할 수 있음.
- **데이터:** 의료기관 30곳과 암종 30개는 `data/*.json` 정적 파일. 공개 가능한 검증 의료진은 Netlify Function을 통해 VPS의 FastAPI `GET /v1/specialists`를 실시간 조회.
- **비공개:** SQLite DB, 수집 로그, 의료진 검증 대기 기록은 VPS에서만 관리. GitHub 및 Netlify에 업로드하지 말 것.

## Netlify 지속 배포 (수동 1회 연결 필요)
1. Netlify > Add new project > Import an existing project > GitHub 선택.
2. `Mespital/ApuDa` 저장소 선택.
3. Branch `main`; Base directory `public-site/hospital-information`; Publish directory `.`; Build command 없음.
4. Deploy. 이후 GitHub main 브랜치의 이 디렉터리 변경이 Netlify 자동 배포됨.
5. 별도 Netlify 앱용 도메인은 Netlify가 실제로 발급한 이름을 확인해 사용. `apuda.app/hospital-information/`은 기존 메인 Netlify 사이트가 GitHub의 `public-site/`를 배포하는 경우 동일 파일로 제공되며, 그렇지 않으면 메인 사이트 배포 설정을 별도로 수정해야 함.

## 의료진 데이터 연결
- 초기 상태에서 의료진 API는 의도적으로 미연결이다. UI는 검증되지 않은 의료진을 표시하지 않는다.
- VPS의 `/opt/apuda-cancer-matcher` API는 현재 `127.0.0.1:4890`에 바인딩되어 있어 Netlify 서버에서 직접 접근할 수 없다.
- DNS에 전용 서브도메인(예: `hospital-api.apuda.app`)을 설정하고 TLS 역프록시로 **필요한 읽기 전용 API만** 공개한다. `server/Caddyfile.example` 참조. 기존 Caddy 설정을 확인하고 충돌이 없게 추가할 것.
- Netlify 사이트 > Site configuration > Environment variables에 `APUDA_HOSPITAL_API_URL=https://hospital-api.apuda.app` 설정 후 재배포.
- 메인 apuda.app 사이트에서도 의료진 기능을 사용할 경우 해당 메인 사이트 Netlify 환경변수에도 동일하게 설정해야 한다.
- `public-site/netlify/functions/hospital-information-matcher.js`와 이 폴더의 동일한 함수가 각각 메인 사이트와 독립 사이트의 API 요청을 처리한다. 수정 시 두 파일을 동기화할 것.
- FastAPI에서는 `status='ACTIVE'`이고 암종 연결 테이블에 매핑된 의료진만 반환된다. 현재 검증 대기 2명은 공개되지 않는다.

## 유지 관리
- 병원·암종 목록: `data/hospitals.json`, `data/cancers.json` 수정 → GitHub commit → Netlify 자동 배포
- UI: `index.html`, `styles.css`, `app.js`
- Netlify 함수: `netlify/functions/hospital-information-matcher.js` (메인 사이트 복제본 동기화)
- 의료진 원본 갱신: VPS의 기존 systemd 스케줄, 수집기, 수동 검증 → ACTIVE 변경 후 API 응답에 반영 (GitHub에 개인정보/DB 업로드 불필요).
- CI: `.github/workflows/hospital-information-check.yml`에서 JavaScript 문법 및 등록 건수 검사.

## 의료정보 안전 원칙
공식 출처와 진료 분야를 검증하고 공개 승인한 의료진만 표시한다. 치료 성적, 우열 순위, 인증되지 않은 추천 정보는 표시하지 않는다. 링크 및 공식 진료분야는 주기적으로 재검증한다.
