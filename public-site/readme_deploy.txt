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
