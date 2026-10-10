# ApuDa Hospital Information — 운영·검증 가이드

**운영 URL:** https://apuda.app/hospital-information/  
**코드 관리:** https://github.com/Mespital/ApuDa/tree/main/public-site/hospital-information

## 서비스 상태
- 30개 병원·30개 암종 기준 데이터를 기반으로 의료기관을 검색합니다.
- 병원 등록 자체는 해당 암종의 진료 가능 여부, 의료의 질 또는 순위를 검증한 것이 아닙니다.
- 공개 승인된 의사만 검색 가능하며, 검증 대기 상태의 의사는 절대 표시하지 않습니다.
- 공개 의료진이 0명이어도 지역별 병원 목록과 확인 가능한 공식 의료진 페이지 안내 링크를 제공합니다.

## 실제 배포 구조
- 기존 `Mespital/ApuDa`의 `public-site/`를 Netlify가 배포합니다.
- GitHub `main`의 `public-site/hospital-information/` 수정 → 기존 Netlify Git 연동으로 자동 운영 반영.
- 별도 Netlify 프로젝트 생성, 수동 ZIP 업로드 또는 VPS 프런트엔드 서버 설치가 필요 없습니다.
- `.github/workflows/hospital-information-check.yml`에서 JS 문법·의료진 공개 데이터 검증·사용자 흐름 테스트 수행.
- `.github/workflows/hospital-information-deployment.yml`에서 운영 URL, 배포 JS, 병원·암종 JSON, 의료진 스냅샷, 의료진 API를 확인합니다.
- 위 운영 점검은 매일 오전 08:15 KST에도 실행됩니다.

## 의료진 데이터 흐름
1. 기존 VPS `/var/lib/apuda-cancer-matcher/apuda_specialists.db`에서 공식 의료진 정보를 운영 관리합니다.
2. `VERIFY_REQUIRED`는 검증 대기입니다. 공개 전 `ACTIVE`, `verified_at`, 공식 HTTPS 프로필 URL, 암종/진료 역할, 근거를 모두 확인해야 합니다.
3. `.github/workflows/hospital-information-sync.yml`은 매일 오전 07:50 KST 실행됩니다.
4. 이 작업은 VPS DB와 WAL 파일을 **읽기용 임시 복사본**으로 가져와 검사합니다. 운영 DB를 변경하지 않습니다.
5. 검증된 의료진만 `data/verified-specialists.json`에 내보냅니다. 검증이 180일보다 오래되면 공개 대상에서 제외합니다.
6. 공개 JSON에는 이름·병원·진료과·전문분야·공식 프로필·검증일·암종/진료역할만 남깁니다. 검증 전 자료와 내부 근거 텍스트 전체는 공개하지 않습니다.
7. 동기화 성공 시 날짜별로 `generated_at`(마지막 확인 시각)을 반영합니다. 실패하면 기존 자료를 보존하며 오류 로그를 남깁니다.

## 웹앱과 의료진 API
- 웹앱은 `data/verified-specialists.json`을 읽으므로 VPS 또는 별도 HTTPS 백엔드의 실시간 접근이 필요하지 않습니다.
- 메인 Netlify Function `/.netlify/functions/hospital-information-matcher?cancer=LUNG`도 동일 공개 스냅샷을 읽습니다.
- Function은 데이터가 정상이고 공개 의료진이 없을 때 **HTTP 200, count=0**으로 응답합니다. 이전의 API 미설정 HTTP 503은 수정되었습니다.
- 신선도 검사는 마지막 데이터 동기화 시간과 개별 의료진 `verified_at`을 구분합니다.
- 의료진 예약이나 치료 판단은 본 앱에서 수행하지 않으며 각 병원 공식 사이트에서 확인하도록 합니다.

## 수정 위치
- 사용자 화면: `index.html`, `app.js`, `styles.css`
- 병원·암종: `data/hospitals.json`, `data/cancers.json`
- 공식 의료진 링크: `data/hospitals.json`의 `staff_url` (확인된 링크만 입력)
- VPS 검증 데이터 exporter: `scripts/export_verified.py`
- GitHub Actions: `.github/workflows/hospital-information-*.yml`
- 의료진 API Function은 `public-site/netlify/functions/hospital-information-matcher.js`와 앱 내부 `netlify/functions/hospital-information-matcher.js` 두 위치가 **같아야 합니다.**

## 의료정보 안전 원칙
- 명단을 발견했다고 `ACTIVE`로 승인하지 않습니다.
- 공식 의료진 소개에 명시된 진료분야만 암종과 연결합니다.
- 논문 발표, 센터 소속, 특정 학회 활동만으로 해당 암종 치료 전문의라고 분류하지 않습니다.
- 의료진 순위, 치료성과 우열, 임의 추천 점수를 만들지 않습니다.
- 병원 사이트의 자동 수집이 robots.txt에 의해 제한되면 우회하지 않고 공개 페이지 링크 등 허용되는 방식으로 검증합니다.

## 2026-10-10 병원별 의료진 확대 현황 (현재 운영 검증 기준)

| 공식 의료진 제공 병원 | 현재 명단 | 자동 새로고침 |
| --- | ---: | --- |
| 서울특별시보라매병원 | 18 | 06:50 KST |
| 삼성서울병원 | 106 | 07:10 KST |
| 서울아산병원 | 145 | 07:20 KST |
| 분당서울대학교병원 | 60 | 07:30 KST |
| 전북대학교병원 | 13 | 07:40 KST |
| 총계 | **342** | 매일 GitHub → 기존 Netlify |

30개 등록 의료기관 중 5곳은 공식 개인 의료진 정보가 제공되고, 그 밖의 기관은 공식 의료진 검색/병원 링크를 제공합니다. 342명은 공식 진료분야 텍스트가 암종과 일치해 검색에 등록된 인원이며 전체 의사 명단은 아닙니다. 독립적인 전문의 자격인증·예약 가능 여부·치료 성과 순위는 아닙니다.

## 실제 운영 데이터

- `data/verified-specialists.json`: 공개 임상 진료분야를 명시한 의료진 통합 자료. 의료진 이름·공식 진료분야·개별 공식 프로필 주소·확인시각·매칭된 암종과 역할을 포함합니다.
- `data/brmh-verified.json`: 보라매병원 4개 공식 진료과, 그중 명확히 암종을 표기한 18명. `scripts/collect_brmh.py` 및 `.github/workflows/hospital-information-brmh.yml`.
- `data/smc-verified.json`: 삼성서울병원 30개 암종 키워드 검색 결과 106명. 각 검색 화면의 첫 6명 기반이므로 전체 명단은 아닙니다.
- `data/amc-verified.json`: 서울아산병원 암센터 20개 목록, 145명.
- `data/snubh-verified.json`: 분당서울대학교병원 진료과·센터 8개 목록, 60명.
- `data/jbuh-verified.json`: 전북대학교병원 3개 관련 진료과 목록, 13명.
- `data/vps-verified.json`: VPS 직접 검증 승인 명단만 포함하며 검증 대기 의사는 공개하지 않습니다.
- `scripts/merge_verified.py`: 위 병원별 자료를 공식 개인 프로필 기준으로 중복 제거해 통합 공개 명단 생성. 기존 자동수집 정보를 VPS 동기화가 덮어쓰지 않습니다.
- 자동 수집은 robots.txt 접근 정책을 먼저 검사합니다. 거부된 URL은 조회를 강행하지 않습니다.
- 의료진 개인 프로필 정보는 180일 이내 재확인이 필요하며 더 오래된 자료는 검색 화면/API에서 제외합니다.
- 공식 진료분야가 명시된 의료진만 암종과 연결합니다. 진료 목적(수술/약물/방사선/진단 등)은 공식 진료과 및 진료분야 기반의 검색 편의 분류입니다.

## 자동 검증

- `.github/workflows/hospital-information-check.yml`: 프런트엔드/데이터 계약 검증
- `.github/workflows/hospital-information-deployment.yml`: 실제 Netlify 운영 사이트·의료진 공개 JSON·검색 API 응답 확인
- 자동 갱신을 통한 의료진 데이터는 GitHub `main`의 `public-site/hospital-information`에 기록되고, 기존 Netlify Git 연동을 통해 추가 수동 업로드 없이 배포됩니다.
