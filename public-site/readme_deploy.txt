ApuDa Total Netlify 배포본

배포:
- 이 ZIP 파일을 Netlify 수동 배포에 그대로 업로드합니다.
- index.html 이 ZIP 최상위(root)에 있습니다.

적용 내용:
- 메인 ApuDa 건물 랜딩 페이지 유지
- 우측 4층 높이에 ApuDa.Family 간판 추가
- 데스크톱: 건물 우측에 기둥으로 이어진 작은 간판
- 모바일: 우측 하단 고정 간판
- 간판 클릭 시 ApuDa.Family 팝업 오픈
- 팝업에서 ApuDa.care / ApuDa.pet / ApuDa.farm 링크와 간단 설명 제공
- Netlify 프록시 연결: /pet/* → apuda-pet.netlify.app
- Netlify 프록시 연결: /farm/* → apuda-farm.netlify.app
- Netlify 프록시 연결: /care/* → apudacare.netlify.app
- 4F 상세 패널의 "암 치료 동행 열기" 링크도 /care/ 로 연결되도록 수정
- 층 클릭 시 기존 우측 상세 패널 및 링크 기능 유지
- 영상 전환은 크로스페이드 방식

[2026-10-04 업데이트 — 2F 암종별 가이드북]
- 깨져 있던 표지 스프라이트(apuda-mini-series-sprite.webp) 제거 → 암종별 개별 표지 12종으로 교체
  assets/books/{slug}.webp (카드용) / {slug}-hq.jpg (고해상도)
- 2F 패널: "암종별 가이드북" 4열 그리드(태블릿 4열·모바일 3/2열), 표지 + 암종명 + MINI·FAQ·완전판 태그, NEW/인기 배지
- 표지 클릭 팝업: 표지·Vol·1줄 소개 + 3버튼
  1) 암진단 후 첫 30일 - {암종}  [웹에서 보기] [다운로드]
  2) {암종} FAQ
  3) 암진단 후 첫 30일 완전판 - {암종}
- 무료 MINI 웹북(/library/mini/?cancer={slug}): 코드 없이 웹 열람
- 다운로드: 코드 ApuDa1000 입력 시에만 PDF 저장
  PDF는 library/mini/pdf/{slug}.bin 에 AES-256-GCM 암호화 상태로 저장 → 코드 없이는 파일을 직접 받아도 열 수 없음
  PDF 구성: 표지 1p + 본문 21p (A4)
- /#floor-2 로 접속하면 2층 패널 자동 오픈 (웹북·FAQ의 "2F 서재로" 버튼)
- 테스트용 png(testcrop_*, building_check, mobile_comp_test) 제거
- 코드 변경 시: PDF 재암호화 필요 (index.html 해시 + .bin 재생성)

[2026-10-04 2차 업데이트]
- 2F 데스크톱: 패널을 화면 가득(96vw) 확장, 12권이 스크롤 없이 화면 크기에 맞춰 최대 크기로 자동 배치(보통 6×2)
  태블릿 3열 / 모바일 2열
- 완전판 버튼: 표지 썸네일 + "준비중입니다" 표기(링크 없음)
- 신규 페이지 3종 (2F "더 깊게 이해하기" 및 책 팝업에서 연결)
  /library/treatment-map/  치료결정 지도 — 12암종 6단계 결정 흐름, 치료 축, 진료실 질문, 관련 바이오마커·약물
  /library/drugs/          항암제 Drug Hub — 84개 약물·요법, 검색/암종/유형 필터, 상세(기전·암종·바이오마커·부작용·환자에게 의미)
                           공급상태: /news/downloads/mfds-drug-supply-issues.csv 실시간 매칭
                           최근 뉴스: /news/data 의 oncology-30d·period-highlights·최신 일자 데이터 실시간 매칭
  /library/biomarkers/     바이오마커 Navigator — 28개 지표, 검사방법→이유→결과해석→관련 약물→뉴스
- 콘텐츠 원본: /library/assets/onco-data.js (약물·바이오마커·치료지도 수정은 이 파일만 고치면 됨)
- 국내 허가·급여 여부는 단정하지 않고 의약품안전나라·심평원 확인 안내로 처리
