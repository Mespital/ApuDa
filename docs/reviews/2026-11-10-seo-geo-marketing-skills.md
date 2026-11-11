# ApuDa 프로젝트 전용 SEO·GEO·마케팅 스킬 설치·중복·보안 검토

작성: 2026-11-10 (KST)

적용: 개발용 브랜치 `feat/apuda-seo-geo-marketing-skills-20261110`
운영 환경: **변경·배포 금지**

## 설치 방식 및 검증 범위

세 외부 프로젝트 전체 또는 설치 스크립트가 아닌 **ApuDa에 필요한 기능을 선별한 프로젝트 전용 `SKILL.md` 3개**를 설치했다. 이름은 `apuda-seo`, `apuda-geo`, `apuda-marketing`. 원본과 동일한 실행 기능 전체를 제공하는 설치가 아니라, 검토 가능한 순수 문서형 워크플로를 구현한 것이다. 자동 네트워크 전송·코드 실행·프로덕션 수정 기능은 포함하지 않았다.

| 상위 프로젝트 및 선택한 원본 기능 | 확인된 원본 SHA | 라이선스 | 적용 방식 |
|---|---|---|---|
| [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo), `seo-technical` | `6be93f45064ffbadced572b5d5c95f55fd263af0` | MIT, © 2026 agricidaniel | 기술 SEO 감사 가이드만 ApuDa 맞춤 재구성 |
| [zubair-trabzada/geo-seo-claude](https://github.com/zubair-trabzada/geo-seo-claude), `geo-citability` | `989cae01e8ebbc42a9ec798eb9e7cb423f5ec89c` | MIT, © 2026 Zubair Trabzada | AI 검색 인용 가능성 및 의료 근거 추적 워크플로 재구성 |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills), `content-strategy` | `9d6d7ce8d18eb155dc2f9762435f097e60cdad7c` | MIT, © 2025 Corey Haines | 의료 콘텐츠 기획·채널 배포 계획만 재구성 |

공식 원본의 MIT 라이선스는 각 저장소 `LICENSE`에 있으며, 원본의 프로그램 코드·설치 스크립트·전체 `SKILL.md`를 복사한 것이 아니다. 아이디어와 절차를 재구성한 프로젝트 전용 문서는 원저작물과 동일하지 않으며, 원 출처를 명확히 남긴다.

## 기존 기능과 중복 관계

| 현재 ApuDa 구현 | 중복 가능성 | 처리 |
|---|---|---|
| `public-site/scripts/build-seo.mjs` | sitemap·canonical·FAQ 정적 페이지·JSON-LD 재생성 | 중복 생성 금지, 현존 생성기 참조만 |
| `public-site/scripts/check-seo.mjs` | 85 URL/30권/30암종/3,000 FAQ 검증 | 같은 기능 새 코드로 복제 금지, 기존 검사 실행 |
| `public-site/scripts/check-faq-medical-safety.mjs` | 의료 표현 자동 검사 | 기존 검사 유지, GEO는 근거·인용성 **검토 보조**로 한정 |
| 기존 유튜브·인스타·틱톡 소개글 체계 | 채널별 카피 자동화 | 포맷·검수 지침만 제공, 게시 자동화·개인정보 연결 없음 |
| `public-site/robots.txt` | AI crawler 허용/차단 정책 변경 제안 | 읽기 전용 평가, 실제 변경 없음 |

## 보안·충돌 점검 결과

- 이번 변경에는 `.claude/skills/`의 Markdown 3개 및 본 검토 문서만 추가. 의존 패키지나 실행 스크립트 없음.
- 외부 `curl | bash`, npm/npx, pip 설치 또는 제3자 API 호출을 실행하지 않음. 스킬에서 실행하도록 요구하지도 않음.
- `.env`, 토큰, 환자 기록, 논술 기록, `public-site/note/`, `/nonsul/`, Netlify 설정, FAQ 데이터 본문, 기존 서비스 코드를 수정하지 않음.
- 원본 `claude-seo` 기능에는 `CLAUDE_PLUGIN_ROOT` 내부 실행 파일에 의존하는 항목이 있고, `geo-citability`는 Bash/Write 권한을 요구하므로 이 프로젝트에서는 해당 권한·실행기 의존 기능을 제외함.
- 마케팅 원본은 별도 product-marketing 문서를 참조할 수 있지만, 이번 문서는 ApuDa의 비식별 공개 브랜드/콘텐츠 맥락만 직접 포함하여 의존성을 제거함.
- 원본의 GEO 효과 수치·영어 단어 수 기준을 한국어 의료정보의 검증된 성능으로 간주하지 않음.

## 검증 계획

1. 스킬 3개 YAML frontmatter (`name`, `description`) 및 고유명 확인.
2. 금지된 자동 실행·외부 게시·운영 배포 문구와 새 실행 파일 유무 확인.
3. `public-site`에서 기존 SEO·의료 안전성 테스트 수행 (정적 검증, 데이터 불변).
4. 변경 파일 목록에 `.claude/skills/` 및 본 문서 외 경로가 없는지 확인.
5. 원격 개발 브랜치·초안 PR을 만들더라도 머지·운영 배포는 하지 않음.

## 기술적 한계

이 설치는 **스킬 지침의 로딩·사용 준비 상태**를 뜻한다. Search Console의 실제 검색 유입, AI 답변의 인용 실적, 콘텐츠 성과 개선을 입증하는 것은 아니다. 지표는 별도 데이터 연결·기준선 측정이 필요하다. 의료 자료의 실제 전문의 승인을 새로 얻은 것도 아니다.
