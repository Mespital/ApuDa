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

## 2026-10-10 의료진 수집 확장

- 현재 공식 진료분야 일치 의료진 205명 등록 (서울아산병원 145명, 분당서울대학교병원 60명). 수치는 공식 사이트 변경에 따라 변동됩니다.
- 등록된 30개 의료기관 전체의 의료진 구축이 완료된 것은 아니며, 현재 개별 의료진 자료는 2개 병원에서 제공합니다.
- 서울아산병원: 공식 암센터 20개 페이지 / scripts/collect_amc.py / hospital-information-amc.yml (매일 07:20 KST).
- 분당서울대학교병원: 공식 진료과·센터 8개 페이지 / scripts/collect_snubh.py / hospital-information-snubh.yml (매일 07:30 KST).
- VPS 수동 검증자료: hospital-information-sync.yml (매일 07:50 KST).
- scripts/merge_verified.py 는 data/amc-verified.json, data/snubh-verified.json, data/vps-verified.json을 합쳐 data/verified-specialists.json을 생성합니다.
- 병원별 의료진 목록·진료분야·개별 프로필 링크를 공식 사이트에서 확인합니다. 암센터 소속만으로 해당 암종과 연결하지 않습니다.
- 자동 조회 전에 robots.txt 접근 규칙을 확인하고 실패하면 작업을 중지하며, 기존에 확인한 기록은 180일을 초과하면 환자 화면에서 제외합니다.
- 공식 진료분야 확인은 전문의 면허·치료성과·예약 가능 일정의 독립 인증이나 의사 추천 순위가 아닙니다.
- 진료 목적의 수술/항암/방사선/진단 분류는 검색 편의를 위한 공식 진료과 기반 분류이며, 개별 치료법 판단을 대신하지 않습니다.
- GitHub 소스 변경 후 기존 Netlify 연결로 자동 배포됩니다. 메인 Netlify 의료진 API는 검증 완료 JSON만 읽습니다.
- 나머지 28개 의료기관은 개별 사이트 접근 정책과 의사 명단·전문분야 파서를 확인해 확장할 수 있습니다.
