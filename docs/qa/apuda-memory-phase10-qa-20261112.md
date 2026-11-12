# ApuDa Memory 10단계 QA — 실제 브라우저 접근성 제약 및 Web Crypto 회귀검증

- 점검일: 2026-11-12 (Asia/Seoul)
- 저장소: Mespital/ApuDa
- 브랜치: feat/apuda-memory-p0-20261110 / PR #293
- 운영 배포/PR 병합: **없음**
- 실제 사용자 기록, JSON 복원, 논술·암 FAQ 데이터에 대한 읽기/쓰기: **없음**
- 검증 범위: 기존 8단계 암호화 백업 모듈, 9단계 IndexedDB 이전 모듈, 10단계 독립 테스트. 프로덕션 UI 기능 변경 없음.

## 1. 생성한 재실행 가능한 검증 도구

1. \`tests/memory/test_phase10_node.mjs\`: Node 22 WebCrypto로 AES-GCM 왕복, 잘못된 비밀번호, 변조 탐지, 날짜/필드 유효성 검사, 중복 ID 충돌 사전검사.
2. \`tests/memory/browser/phase10.html\`: 로컬 개발 오리진에서만 수동 실행하는 **실제 브라우저 검증 페이지**. 클릭을 누르기 전에는 IndexedDB를 생성하지 않는다. \`apuda-memory-qa-...\` 이름의 임시 DB만 열고, 가상 기록 2~3건으로 원자적 커밋·중복 재실행·ID 충돌·강제 Abort·ConstraintError 롤백·DB 재개방·Web Crypto 암복호화·비밀번호/변조 거부를 시험한다. 종료 시 생성한 QA DB를 삭제한다.
3. 기존 \`public-site/memory/indexeddb-migration.mjs\`, \`public-site/memory/secure-archive.mjs\` 코드는 이 단계에서 수정하지 않는다. ApuDa Memory 사용자 화면에도 이 QA 버튼을 노출하지 않는다.

### 실제 Chrome에서 재실행하는 방법(권한 있는 독립 개발 환경)

리포지터리 루트에서:

\`\`\`bash
python -m http.server 8765 --bind 127.0.0.1
\`\`\`

브라우저에서 다음 **로컬 경로**를 연다:

\`\`\`text
http://127.0.0.1:8765/tests/memory/browser/phase10.html
\`\`\`

'가상 데이터로 10단계 검증 시작' 클릭 → 17개 검증 결과와 암호화·복호화 시간, QA DB 삭제 확인을 읽는다. **실제 환자정보를 입력하지 말 것.** 이 파일은 Netlify 게시 폴더(public-site)가 아닌 tests 폴더에 있으며 운영 사이트에는 연결하지 않는다. 추가 확장 테스트에는 두 탭 동시성, 브라우저 강제 종료, 할당량 초과 등 별도 시나리오가 필요하다.

## 2. 이번 실행에서 확인한 사실

| 검증 | 결과 | 상세 |
|---|---|---|
| GitHub 코드 원본과 로컬 실행본 일치 | **PASS** | Git blob 해시 확인: secure-archive.mjs \`3ff8075bd724718fa09d0d08bb5aeb701c9c0103\`, indexeddb-migration.mjs \`00b032691500d996577c2eb77506a84ce4bba202\` |
| 저장소에 반영한 Node 단위 테스트 실행 | **PASS** | \`node tests/memory/test_phase10_node.mjs\`, Node v22.16.0 |
| 한국어 합성 기록 암복호화 왕복 | **PASS** | Web Crypto AES-256-GCM, PBKDF2-HMAC-SHA-256 600,000회 |
| 잘못된 암호·변조·미지원 필드·날짜·버전 거부 | **PASS** | 실패 시 민감 데이터 또는 기기 기록 쓰기 없음 |
| 이전 사전검사에서 ID 동등/내용 충돌 | **PASS** | \`planIndexedDbMigration\`, 실제 IndexedDB 쓰기 없음 |
| 암호화 속도(가상 1건, 이번 기기) | **관측** | 암호화 약 128ms, 복호화 약 128ms. 단일 샘플이며 스마트폰 성능 보장 아님 |
| Chromium 144 실행 | **PASS(브라우저 시작만)** | Headless Chrome/144.0, Playwright/Python |
| Chromium에서 HTTP/파일 오리진 열기 | **BLOCKED** | \`net::ERR_BLOCKED_BY_ADMINISTRATOR\` — localhost, file URL, 원격 미리보기 모두 제한 |
| 실제 Chromium IndexedDB의 커밋·abort·중복 키 | **NT** | 페이지 접근 불가로 검증하지 못함. 앞 단계의 Node IndexedDB는 시뮬레이터 |
| 실제 Android/iOS 및 200% 확대·TalkBack | **NT** | 실기기 접근 불가 |
| 실제 새 기기 JSON 복원 | **사용자 요청으로 보류** | 기존 데이터를 손대지 않음 |
| 외부 보안 전문가·의료진·보호자 참여 | **NT** | AI 사전점검은 실제 전문 감수 승인 아님 |

> **판정:** 실제 브라우저 IndexedDB 검증까지 마친 것으로 표시하지 않는다. DB 원자성에 대한 근거는 9단계의 시뮬레이션과 웹 표준 문서이며, 실제 Chrome 증빙은 아직 없다.

## 3. 데이터 보존 및 보안 검토

- 원래 돌봄 기록은 여전히 브라우저 localStorage 키 \`apuda-memory-care-diary-v1\`에 최대 20건. 현재 UI는 **암호화된 저장·자동 동기화·서버 백업을 제공하지 않는다.**
- \`secure-archive.mjs\`는 독립된 암호화/복호화 엔진이며 사용자용 버튼과 연결하지 않았다. 비밀번호 분실은 복구 불가능, PBKDF2 600,000회는 저사양 모바일에서 지연될 수 있음. 브라우저 비밀번호 입력·파일 내보내기 UX 및 독립 보안 검토가 선행돼야 한다.
- \`indexeddb-migration.mjs\`는 명시적으로 전달된 합성 입력만 받아 QA 접두어 DB에 쓰며 실서비스 DB에 저장하는 기능은 막혀 있다. 실제 데이터 이전·삭제 기능을 운영 UI로 제공하지 않는다.
- 현재 JSON/TXT 원본 백업은 **비암호화** 상태이므로 공용 기기·메신저·공유 폴더에 두지 않도록 주의 필요. 클립보드와 PDF도 별도 위험이다.
- 실제 브라우저의 저장 할당량(Quota), 브라우저 업데이트, 탭 경쟁, 장애로 인한 저장소 손상 가능성을 0이라고 보장하지 않는다.
- 기존 사용자의 학습/논술 기록, 영상·책자·FAQ에는 코드나 배포 변경 없음. Netlify 무료 요금제/데이터 이전 정책 변경 없음.

## 4. 운영 전 보류 게이트

1. 독립적으로 접근 가능한 실제 Chrome/Android Chrome/iOS Safari 오리진에서 \`tests/memory/browser/phase10.html\`의 결과를 실행·기록한다. 17개 항목, 실제 DB 삭제 여부, 환경·시간을 캡처한다.
2. 2개 탭의 동시 업데이트, \`versionchange\`, quota 부족, 뒤로 가기/강제 종료, 브라우저 데이터 초기화 시나리오를 별도 검증한다.
3. 8단계 암호화 엔진의 저사양 기기 성능 및 개인정보 위협 모델, 비밀번호 분실·재설정 한계를 실제 보호자에게 검토받는다.
4. 개인별 기록 저장 동의, 읽기/삭제/수정·공유, 보유기간·파기 정책을 정리한다. 신기능을 암호화된 의료기록 보관소라고 홍보하지 않는다.
5. 실제 사용자 데이터와 새 기기 복원 실험은 사용자에게서 명시적 후속 지시를 받기 전까지 보류한다.
6. 독립 보안 검토 및 사용자 명시적 승인 전 운영 병합·배포하지 않는다.

## 5. 전문가 역할별 AI 사전점검

D05(QA/회귀), D06(개인정보·보안), M03(돌봄 기록 해석), P01–P06(환자 사용성), C01–C02(보호자 사용성)의 위험 관점으로 검토했다. **실제 의료진·환자·보호자가 참여했다고 주장하지 않으며 정식 보안 인증도 수행하지 않았다.**
