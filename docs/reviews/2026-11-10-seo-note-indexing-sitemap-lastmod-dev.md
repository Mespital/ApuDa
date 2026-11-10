# ApuDa SEO-03 — 환자 수첩 검색 노출 및 사이트맵 수정일 개발 검토

검토일: 2026-11-10 (KST)  
범위: `public-site/note/`의 **정적 앱 화면**과 루트 사이트맵 생성기, Netlify 정적 응답 헤더.  
상태: **Draft PR의 개발 변경만**. 운영 배포·기록 마이그레이션·Netlify 설정 적용 없음.

## 확인된 사실

1. `/note/`는 환자가 체온·증상·복약·진료 질문을 입력하는 **실사용 앱 화면**이다. `note-app.js`는 `localStorage`를 사용하고 `apuda-backup.js`에는 사용자가 선택하는 Google Drive 앱 데이터 백업 기능이 있다. 이 검토는 해당 로직이나 실제 환자 기록을 읽거나 변경하지 않았다.
2. 기존 `/note/`에는 `noindex`가 없고, 루트 `sitemap.xml`에 `https://apuda.app/note/`가 포함되어 있었다. 이는 앱 *진입 화면*의 검색 노출 가능성이지, 사용자 개인 기록이 검색엔진에 노출되었다는 증거는 아니다.
3. 가상 체험판 `/note-v4/`와 논술 기록 경로 `/nonsul/`에는 별도 `noindex` 정책이 이미 있었다. 이들 경로와 저장/복구/Google 로그인 관련 코드는 변경하지 않았다.
4. 루트 사이트맵 생성기에는 URL별 **검증된 콘텐츠 최종 수정시각**이 없고, 기존 XML에도 `<lastmod>`가 없다. 이는 임의로 배포일이나 빌드 시각을 날짜로 사용하는 것보다 정확하다.

## 개발 변경

- 실사용 앱 화면 `/note/index.html`에 `<meta name="robots" content="noindex">` 추가.
- `netlify.toml`의 `/note/` 및 `/note/index.html` 정적 응답에 `X-Robots-Tag: noindex` 추가. 기존 `/note/index.html`의 `Cache-Control: no-cache`는 보존.
- 생성기와 결과물 `sitemap.xml`에서 `/note/` 제거. 총 URL **85 → 84**. 정적 안내서 **30**개, 정적 FAQ **30**개, 질문 **3,000**개는 보존.
- SEO 검사기에 앱 경로가 사이트맵에 섞이지 않는지, HTML·헤더에 `noindex`가 있는지, 검증되지 않은 `<lastmod>`를 넣지 않았는지를 확인하는 회귀 검증 추가.
- 검색엔진이 `noindex`를 읽도록 `robots.txt`의 `Allow: /`를 유지. `Disallow: /note/`를 추가하지 않음.

## 한계와 운영 승인 전 확인사항

- **`noindex`는 비공개 접근 통제나 암호화가 아니다.** 실제 개인 기록은 인증·전송·저장·백업 보안의 별도 검토 대상이다. 이번 작업은 검색 결과에 실사용 *앱 화면*이 표시되지 않도록 하는 SEO 조치다.
- 이 변경을 운영에 적용하면 **`/note/` 자체의 검색 유입은 감소하거나 사라질 수 있다.** 장기적으로는 검색용 공개 소개 페이지(예: `/note-guide/`)와 민감 정보를 입력하는 앱 경로를 분리하는 것이 바람직하다. 이 공개 소개 페이지는 이번 PR에 새로 만들지 않았다.
- Netlify 헤더 설정은 Netlify가 직접 제공하는 정적 파일에 유효하며, 이번에는 운영 HTTP 응답을 검증하거나 배포하지 않았다.
- Google은 `<lastmod>`가 **유의미한 본문·구조화데이터·링크 변경 시각과 일치**할 때 사용한다. Git 커밋 시각, 배포 시각, 현재 시각을 아무 근거 없이 모든 URL에 일괄 기입하지 않는다. 추후 URL별 콘텐츠 버전 데이터가 확보되면 정확한 일부 URL에만 추가한다.
- 실제 인덱스 상태·검색 결과 제거 여부는 운영 반영 뒤 Search Console URL 검사로 별도 확인이 필요하다.

## 근거 문서

- Google Search Central, [Robots meta tag 및 X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- Google Search Central, [noindex로 검색 색인 제외](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- Google Search Central, [사이트맵 빌드 및 lastmod 정확성](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- Google Search Central, [신뢰할 수 없는 lastmod를 생략할 수 있는 이유](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping)
- Netlify, [정적 파일 응답 헤더 설정](https://docs.netlify.com/manage/routing/headers/)

## 배포 금지

이 작업의 완료 기준은 **Draft PR의 소스·정적 검사 통과**다. `main` 병합, 운영 Netlify 빌드, VPS 실행, 사용자 기록 수정 또는 실서비스 색인 제거를 실행하지 않는다.
