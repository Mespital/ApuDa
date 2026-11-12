# ApuDa Memory 9단계 — IndexedDB 트랜잭션·롤백 QA

작성일: 2026-11-12 (KST)
GitHub: Mespital/ApuDa, 브랜치 feat/apuda-memory-p0-20261110, PR #293

이번 변경의 파일
- public-site/memory/indexeddb-migration.mjs
- tests/memory/test_indexeddb_migration.mjs
- 이 문서

**변경하지 않은 파일·데이터:** public-site/memory/index.html, 기존 localStorage 기록, V1/V2 JSON 백업·복원 코드, 논술·FAQ 데이터. **운영 배포/PR 병합 없음.**

## 설계

- 오직 apuda-memory-qa- 접두어가 붙은 격리된 테스트 DB만 허용. 실서비스용 apuda-memory-v2 이름은 거부.
- records 저장소: ID 기본 키, 날짜 보조 인덱스.
- metadata 저장소: 검증 표시 lastMigration.
- 입력은 명시적으로 전달한 백업 JSON 객체. 현재 브라우저의 localStorage에서 직접 읽거나 자동으로 이전하지 않음.
- 사전검사: 날짜, 기록 구조, 원본 ID 중복 검사. 대상 ID와 내용 충돌 시 전체 중단.
- 원자적 readwrite 트랜잭션: 대상 조회 -> 다른 ID만 add -> 같은 트랜잭션 안에서 재조회 -> 건수/내용 검증 -> metadata 기록.
- IndexedDB 요청의 성공은 최종 커밋이 아니므로 tx.oncomplete 후에만 성공 반환. 중간 오류, 강제 abort, 중복 키 ConstraintError 발생 시 모든 해당 트랜잭션 변경 취소.
- QA용 부정 테스트 플래그는 운영 UI에 연결하지 않음. 사용자 인증, 개인정보 암호화, 클라우드 동기화 또는 장기 보관 확대 기능은 이번에 제공하지 않음.

## 회귀 검증

테스트 실행: node tests/memory/test_indexeddb_migration.mjs
문법: node --check public-site/memory/indexeddb-migration.mjs

**Node 테스트용 가짜 IndexedDB 시뮬레이터에서 PASS:**
1. QA 이외 저장소 이름 거부
2. 비어 있는 DB에 가상 기록 2개 일괄 추가
3. 커밋 후 검증 마커와 기록 확인
4. 동일 백업 재실행 시 중복 건너뛰기
5. 같은 ID/서로 다른 내용 충돌 시 쓰기 거부
6. 쓰기 큐 이후 강제 abort -> 기존 기록 유지
7. 의도적 중복 키 요청 오류 -> 트랜잭션 전체 롤백
8. 롤백 후 검증 마커 보존
9. 오류 후 정상 1건 추가
10. 원본 버전 오류/ID 중복 거부

**미검증(NT):** 실제 브라우저 IndexedDB의 트랜잭션 실행, Chromium·Android Chrome·Safari, 실기기 저장 할당량 초과, 2개 탭 경쟁·versionchange·강제 탭 종료, 실제 복원/롤백. Chromium 로컬 QA 실행 시 로컬 URL 접근이 ERR_BLOCKED_BY_ADMINISTRATOR로 차단되어 브라우저 검증을 완료하지 못했음. 테스트용 시뮬레이터를 실제 브라우저 E2E와 동일한 것으로 표현하지 않음.

## 데이터 보호 및 운영 전 체크

1. 독립된 개발 오리진에서 실 브라우저 10개 시나리오 재시험.
2. 원본 JSON 백업 실제 파일 존재/열림 확인 전 이전 금지.
3. IndexedDB 전환 전에 중복·충돌·쿼터·트랜잭션 강제 종료·브라우저 재시작·두 탭 동시 저장 시험.
4. 사전검사 및 사후 검증 완료 전까지 기존 localStorage 원본 자동 삭제·덮어쓰기 금지. 다른 기기 실제 복원은 사용자의 명시적인 추후 확인 요청까지 보류.
5. 현재 사용자 화면에 암호화 백업 또는 IndexedDB 마이그레이션이 연결되어 있지 않음. 의료진·보안 전문가 실감수 및 실제 보호자 테스트도 미진행.
6. Netlify 무료 요금제 유지, 기존 개인 논술 기록 및 나머지 ApuDa 기능 불변.
7. 실기기 검증과 명시적 운영 승인 이전에 PR 병합·운영 배포 금지.

## AI 사전점검 범위

D05 품질, D06 개인정보·보안, M03 의료정보 오인, P01~P06 환자 이해도, C01~C02 보호자 사용성 관점의 코드/문구 검토이며 실제 전문 의료진이나 30명 감수진이 참여한 것이 아니다.

## 참고 규격

MDN IndexedDB Transaction: https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
MDN Transaction Lifetime: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
MDN Abort Semantics: https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/abort
