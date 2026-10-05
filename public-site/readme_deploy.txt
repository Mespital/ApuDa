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
- 다운로드: 코드 apuda1000 입력 시에만 PDF 저장
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

[2026-10-04 3차 — 통합 길잡이 + 소개 페이지]
- /assets/apuda-bot.js : 모든 페이지 공용 "ApuDa 길잡이" (Shadow DOM, 외부 의존성 없음)
  페이지별 모드: home·about·mini·faq·drugs·biomarkers·map·note·news (경로로 자동 판단)
  기능: 전체 메뉴/층별 이동, 암종→책·FAQ·지도·약·검사 연결, 약·바이오마커 이름 인식,
        체온·증상·일정 문장 → 암환자 노트로 바로 기록(/note/?say=), 위기(109)·응급(119) 최우선
- /about/ : ApuDa.app 소개 · 층별 안내 · 사용법 · FAQ
- 외부 사이트(1F 위험도·건강검진, 3F 지원, care/pet/farm)에도 아래 한 줄을 </body> 앞에 넣으면 같은 길잡이가 뜸:
  <script src="https://apuda.app/assets/apuda-bot.js" data-context="cancercheck" defer></script>
  data-context 값: cancercheck | checkup | support | care | pet | farm

[2026-10-04 4차 — 1층 외 외부 사이트 길잡이]
- netlify/edge-functions/apuda-bot-inject.js : /care/*, /pet/*, /farm/*, /support/* 로 열리는 외부 앱 HTML의
  </body> 앞에 길잡이를 자동 삽입(원본 사이트 수정 불필요, 실패 시 원본 그대로 전달)
- 3F 지원 정보: /support/* → apuda-support.netlify.app 프록시 추가, 홈·소개의 3F 링크를 /support/ 로 변경
- 길잡이 맞춤 모드: 3F 지원(산정특례·의료비 지원·서류·상담처), Care(치료 중 예방접종·열), pet(반려동물 응급 신호),
  farm(가축 이상·전염병 의심 신고 1588-9060)
- 5F 네이버 카페, 2F 교보문고(4컷 만화)는 외부 플랫폼이라 삽입 불가

[2026-10-04 5차 — 1층 길잡이]
- /risk/* → apuda-cancercheck.netlify.app, /checkup/* → apuda-check.netlify.app 프록시 + 길잡이 자동 삽입
- 홈·소개·길잡이의 1F 링크를 /risk/, /checkup/ 로 변경
- 맞춤 모드: 위험도(결과 해석·가족력·생활습관), 건강검진(국가암검진 대상·추가 검사 고르는 법·바로 진료 신호)

[2026-10-05 — 첫 30일 웹북 미리보기 전환]
- library/mini/data/*.json: 본문을 앞 1/3(7쪽)만 남김(웹 데이터 자체를 줄여 전체 노출 방지),
  preview_count·pdf_pages·faq(질문 목록 사전 추출) 필드 추가 — FAQ 페이지는 faq 필드 사용
- 웹북 끝에 "책 전체를 무료로 받는 방법" 4단계: @apuda.app 팔로우 → 이벤트 게시물 "30일" 댓글
  → DM 코드(최대 24시간) → 2F 서재에서 다운로드·코드 입력. 인스타 열기/코드 입력 버튼 포함
- 홈 책 팝업·소개 페이지·길잡이 문구를 "미리보기 + 코드로 전체 PDF"로 통일
- 원본 전체 텍스트가 다시 필요하면 git 이력(이 커밋 이전)의 data/*.json 사용

[2026-10-05] 암환자 노트 v3.3 — 감수 2단계 핵심
- "오늘 항암 3차 맞았어" → 항암 완료 일정 저장, 홈에 "항암 D+N" 표시
- D+7~14(백혈구 낮아지기 쉬운 시기): 홈 빨간 안내 + 38.0℃ 기록 시 강화 경고(nadirFever)
- 혈액검사 수치(백혈구·호중구·혈색소·혈소판) 노트봇/기록 탭 입력, 낮은 수치 표시, 진료요약에 최근 3회
- 기록·검사 행에 D+N 태그, 🩸 검사 수치 칩 추가, SW 캐시 v3.3.0
