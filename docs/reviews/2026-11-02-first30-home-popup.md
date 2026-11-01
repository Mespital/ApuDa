# 30암종 홈페이지 책장·자료 선택 팝업 반영

- 기준 브랜치: `main`, 기준 커밋 `8551765b114ae971d916eb561d090d59332b41ec`
- 범위: 홈페이지 2F 책장 12종 → 30종, 암종 검색, 자료 선택 팝업의 표지·권수·무료 안내서 연결, 기존 영상 팝업의 같은 암종 표지와 무료 안내서 연결.
- `assets/books/first30/manifest.json`과 일치하는 공용 카탈로그를 사용한다. 잘못된 암종은 유방암으로 대체하지 않는다.
- 기존 12암종의 MINI 미리보기·PDF 다운로드·FAQ·영상·추가 정보 주소를 유지한다. 나머지 18암종은 실제로 제공되는 무료 핵심안내서를 연결하며 MINI·FAQ·완전판은 준비 중으로 표시한다.
- 안내서 본문, 책 주소, PDF 파일, 검증된 표지 30개 및 표지 manifest는 변경하지 않는다.
- 데스크톱은 읽을 수 있는 표지 크기를 유지하면서 책장을 스크롤한다. 모바일은 2열이며 긴 암종명을 줄바꿈한다. 표지 비율은 3:5, `contain`으로 표지 전체를 표시한다.

## 검증

- `node tools/tests/first30-catalog.test.cjs`: 30권의 암종·권수·표지 파일·읽기 주소, 이미지 SHA-256, 12암종의 MINI/FAQ 지원 여부, 알 수 없는 암종 조회 검사 통과.
- 신규 공용 모듈, 영상 모듈 및 홈페이지 인라인 스크립트 구문 검사 통과.
- Git 트리에서 기존 12종 MINI/FAQ 데이터와 30종 무료 안내서 존재 확인.
- 브라우저 로컬 검증: 데스크톱 30종 책장 표시, 난소암 검색 1권, 기존 유방암 자료 연결 유지, 난소암의 올바른 표지·13권 연결 및 준비 중 3개 항목 확인.
- 모바일 CSS 폭 375px: 유방암 자료 팝업 확인. 320px: 원발성 중추신경계 림프종 검색·29권 팝업·무료 읽기 주소 확인. 두 폭 모두 본문과 팝업 가로 넘침 없음. 실제 휴대전화 기기 검증은 실시하지 않았다.
- 운영 검증은 GitHub main 반영 후 Netlify의 실제 HTML/JS 응답과 30종 팝업·안내서 링크를 대상으로 수행한다.

## 제공 자료 대응

| 권수 | 암종 | 표지 파일 | 무료 안내서 | MINI·FAQ·영상 |
|---|---|---|---|---|
| 01 | 유방암 | `breast.webp` | `/library/first30/books/01.html` | 기존 자료 유지 |
| 02 | 폐암 | `lung.webp` | `/library/first30/books/02.html` | 기존 자료 유지 |
| 03 | 위암 | `stomach.webp` | `/library/first30/books/03.html` | 기존 자료 유지 |
| 04 | 대장암 | `colorectal.webp` | `/library/first30/books/04.html` | 기존 자료 유지 |
| 05 | 갑상선암 | `thyroid.webp` | `/library/first30/books/05.html` | 기존 자료 유지 |
| 06 | 신장암 | `kidney.webp` | `/library/first30/books/06.html` | 기존 자료 유지 |
| 07 | 전립선암 | `prostate.webp` | `/library/first30/books/07.html` | 기존 자료 유지 |
| 08 | 췌장암 | `pancreas.webp` | `/library/first30/books/08.html` | 기존 자료 유지 |
| 09 | 담도암 | `biliary.webp` | `/library/first30/books/09.html` | 기존 자료 유지 |
| 10 | 간암 | `liver.webp` | `/library/first30/books/10.html` | 기존 자료 유지 |
| 11 | 림프종 | `lymphoma.webp` | `/library/first30/books/11.html` | 기존 자료 유지 |
| 12 | 자궁경부암 | `cervical.webp` | `/library/first30/books/12.html` | 기존 자료 유지 |
| 13 | 난소암 | `ovarian.webp` | `/library/first30/books/13.html` | 미제공·준비 중 |
| 14 | 자궁내막암 | `endometrial.webp` | `/library/first30/books/14.html` | 미제공·준비 중 |
| 15 | 식도암 | `esophageal.webp` | `/library/first30/books/15.html` | 미제공·준비 중 |
| 16 | 방광암 | `bladder.webp` | `/library/first30/books/16.html` | 미제공·준비 중 |
| 17 | 고환암 | `testicular.webp` | `/library/first30/books/17.html` | 미제공·준비 중 |
| 18 | 구강암 | `oral.webp` | `/library/first30/books/18.html` | 미제공·준비 중 |
| 19 | 후두암 | `laryngeal.webp` | `/library/first30/books/19.html` | 미제공·준비 중 |
| 20 | 비인두암 | `nasopharyngeal.webp` | `/library/first30/books/20.html` | 미제공·준비 중 |
| 21 | 악성 흑색종 | `melanoma.webp` | `/library/first30/books/21.html` | 미제공·준비 중 |
| 22 | 연부조직육종 | `sarcoma.webp` | `/library/first30/books/22.html` | 미제공·준비 중 |
| 23 | 성인 악성 뇌종양 | `brain.webp` | `/library/first30/books/23.html` | 미제공·준비 중 |
| 24 | 다발성골수종 | `myeloma.webp` | `/library/first30/books/24.html` | 미제공·준비 중 |
| 25 | 급성골수성백혈병 | `aml.webp` | `/library/first30/books/25.html` | 미제공·준비 중 |
| 26 | 급성림프모구백혈병 | `all.webp` | `/library/first30/books/26.html` | 미제공·준비 중 |
| 27 | 만성골수성백혈병 | `cml.webp` | `/library/first30/books/27.html` | 미제공·준비 중 |
| 28 | 호지킨림프종 | `hodgkin.webp` | `/library/first30/books/28.html` | 미제공·준비 중 |
| 29 | 원발성 중추신경계 림프종 | `pcnsl.webp` | `/library/first30/books/29.html` | 미제공·준비 중 |
| 30 | 원발불명암 | `cup.webp` | `/library/first30/books/30.html` | 미제공·준비 중 |

## 의학 감수 상태

이번 변경은 표지와 자료 이동 경로에 대한 기술적 점검이다. 의료 본문이나 의학적 주장은 새로 작성하지 않았다. AI 사전 점검은 실제 전문의·환자·보호자의 감수를 대체하지 않으며 기존의 “전문의 검토 대기” 상태를 유지한다. 의학 일러스트 대응 검토 기록은 `2026-11-01-first30-cover-audit.md`와 `2026-11-01-first30-cover-corrections-v2.md`를 참고한다.
