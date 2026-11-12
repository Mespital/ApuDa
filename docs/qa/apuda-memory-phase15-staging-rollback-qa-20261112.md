# ApuDa Memory 15단계 — 미분류 기록 무손실 스테이징·QA IndexedDB 롤백·개인정보 경계

**검토일:** 2026-11-12 (Asia/Seoul)  
**저장소:** Mespital/ApuDa  
**브랜치:** feat/apuda-memory-p0-20261110  
**PR:** #293 (Draft, 미병합)  
**가상 데이터 실제 브라우저 QA 진입점:** https://deploy-preview-293--apuda-total.netlify.app/memory/phase15-qa.html

**최종 판정: NO_GO.** 기존 사용자 건강정보/JSON/논술 기록에 접근하거나 기록을 이전·삭제하지 않았다. QA 코드만 개발 브랜치에 추가했다. 운영 배포·PR 병합 없음. 실제 새 기기 복원 시험은 사용자 요청대로 보류.

## 1. 이번에 반영한 파일과 범위

| 구분 | 파일 | 설명 |
|---|---|---|
| 순수 전환 사전검사 | \`public-site/memory/legacy-staging.mjs\` | 기존 돌봄 JSON V1/V2를 자동 환자 추론 없이 **미분류**로만 구성하는 새 객체 계획 |
| QA 원자적 DB | \`public-site/memory/profile-vault-idb-qa.mjs\` | \`apuda-memory-qa-vault-*\` 전용 IndexedDB 트랜잭션; QA 외 DB 이름 거부 |
| QA 브라우저 페이지 | \`public-site/memory/phase15-qa.html\` | 실제 브라우저에서 클릭해야만 가상 DB 생성·검증·삭제를 시도 |
| 순수 로직 검사 | \`tests/memory/test_legacy_staging.mjs\` | V1/V2 미분류, ID 충돌, 20건, 원본 불변성, 승인 및 신선도 |
| 트랜잭션 검사 | \`tests/memory/test_profile_vault_idb_qa.mjs\` | 가짜 IndexedDB를 사용한 성공/중복/abort/ConstraintError 롤백 |
| QA UI 회귀검사 | \`tests/memory/test_phase15_qa_ui.cjs\` | 가상 DB 버튼/13개 시나리오/비허용 호스트 제한/임시 DB 삭제 |
| 개인정보 격리 검사 | \`tests/memory/test_phase15_boundary.cjs\` | 새 모듈에 localStorage 접근이 없으며 사용자 화면에 연결되지 않았는지 정적 확인 |
| 출시 판정 강화 | \`tests/memory/test_release_readiness.cjs\` | 실험용 스테이징/QA DB/QA 페이지를 실제 돌봄일지에 연결하면 검사 실패 |

**원본 사용자 화면 \`public-site/memory/index.html\`과 기존 \`localStorage["apuda-memory-care-diary-v1"]\` 코드는 15단계에서 변경하지 않았다.** 기존 기록에 대한 자동 마이그레이션이나 원본 삭제 동작은 어느 신규 모듈에도 없다.

## 2. 무손실 계획 및 데이터 계약

1. \`prepareLegacyStaging(vault,legacyBackup)\`은 과거 JSON V1/V2를 검증하고, 모든 과거 기록을 **unassigned 배열에만** 추가할 후보를 구성한다.
2. 입력 기록을 환자 A 또는 B에 자동으로 배정하지 않는다. 이미 분류된 기록과 기존 미분류 기록을 원본 순서·내용 그대로 유지한다.
3. 전체 20건 상한, ID 중복, 날짜/메모/관찰 필드, 구형 JSON 버전 간 필드 호환성을 검사하고 **충돌 또는 초과 시 ready=false**를 반환한다.
4. 적용 함수 \`applyLegacyStaging\`은 \`confirmed === true\`, 입력 당시 원본 볼트·백업 스냅샷 일치, 재계산된 후보 내용 동일을 모두 요구한다. 반환한 새로운 객체에는 \`persisted:false\`를 명시한다.
5. 원본 기록·백업을 수정하지 않는다. 암호화·파일 검증·사용자 동의 UI·원자적 저장은 별도 후속 게이트다.

### 설계 의도: 저장 중단/복구

현재 단일 브라우저의 **QA DB**에만 다음 절차를 적용한다.

- DB 이름은 \`apuda-memory-qa-vault-[a-z0-9-]{4,70}\` 조건에 맞아야 한다. 실서비스 이름 \`apuda-memory-v2\`는 거부한다.
- \`vault\` 저장소에 \`current\` 스냅샷 1건, \`audit\` 저장소에 \`staged\` 검증 표시 1건을 **동일 readwrite 트랜잭션**으로 기록한다.
- 기록 추가 후 같은 트랜잭션 안에서 데이터를 조회·대조하고, 검증 표시도 재확인한다.
- 전체 성공은 개별 요청 \`onsuccess\`가 아닌 **트랜잭션 \`oncomplete\`** 이후 판정한다.
- \`abort\`, 중복 키 \`ConstraintError\`, 다른 기존 스냅샷·누락된 검증 마커 발견 시 트랜잭션 전부 중지. 이미 저장한 QA 스냅샷을 강제로 덮어쓰지 않는다.
- 기존 스냅샷과 검증 표시가 완전히 동일한 경우에는 재실행을 **멱등(Idempotent: 두 번 실행해도 같은 상태)** 처리한다.
- \`readQaVault\`는 QA 스냅샷·검증 표시를 읽기만 한다. 현재 돌봄일지 로컬 저장소를 절대 읽지 않는다.

**주의:** \`audit\`는 QA 검증 표시이고 실제 사용자/의료기록의 법적 감사로그(Audit Trail)가 아니다. 이 QA DB 저장 자체는 암호화되지 않은 합성 데이터만을 허용하도록 사용 방침을 정했으며, 실제 환자정보를 넣어서는 안 된다.

## 3. 테스트 결과: 확인된 것과 확인하지 못한 것

| 테스트 | 결과 | 증거 수준 |
|---|---|---|
| 과거 V1/V2 JSON → 미분류만 추가 | PASS | 순수 JS 합성 데이터 |
| 대상 A/B의 기존 기록 및 원본 순서·내용 보존 | PASS | 순수 JS 합성 데이터 |
| 동의 없는 전환·원본 변경·ID 충돌·20건 초과 차단 | PASS | 순수 JS 합성 데이터 |
| 강제 트랜잭션 중단 후 기록·표시 모두 0건 | PASS | 비동기 IndexedDB 시뮬레이터 |
| 중복 키 오류 시 기록·표시 전체 롤백 | PASS | 비동기 IndexedDB 시뮬레이터 |
| 정상 저장 후 2건 미분류 추가·검증 마커 | PASS | 비동기 IndexedDB 시뮬레이터 |
| 동일 전환 반복 시 중복 생성 없음 | PASS | 비동기 IndexedDB 시뮬레이터 |
| 다른 후보로 덮어쓰기 거부 | PASS | 비동기 IndexedDB 시뮬레이터 |
| 가상 UI 단추 실행·13개 시나리오·임시 DB 삭제 | PASS | 가상 DOM + IndexedDB 시뮬레이터 |
| 실서비스 사용자 UI의 새 모듈 미연결, QA 원점 제한 | PASS | 정적/회귀검사 |
| 실제 Chromium IndexedDB 트랜잭션 | **NT** | Chromium은 실행 가능했지만 localhost/file/data URL 접근이 \`ERR_BLOCKED_BY_ADMINISTRATOR\`로 차단 |
| Android Chrome·iPhone Safari 저장 공간·2탭·접근성 | **NT** | 실기기 확인 전 |
| 실제 사용자의 원본 JSON·새 기기 복원 | **보류** | 사용자 요청대로 실제 데이터 접근·복원 없음 |
| 실제 독립 보안/의료/환자·보호자 감수 | **NT** | 실제 참여·승인 자료 없음 |

**합성 시나리오 PASS는 실제 브라우저 IndexedDB의 원자성 테스트나 독립 보안 인증을 대신하지 않는다.**

## 4. 실제 브라우저에서 재검증하는 경로

시험 대상: https://deploy-preview-293--apuda-total.netlify.app/memory/phase15-qa.html

1. 새 브라우저 탭에서 URL을 열고, \`가상 기록 15단계 QA 실행\`을 직접 누른다.
2. 가상 샘플 1개 A 소속, 1개 미분류, 외부 V2 백업 2개를 이용해 총 13개 검사를 실행한다.
3. 검사 결과 JSON의 \`status\`, \`checks\`, \`passCount=13\`, \`cleanup="QA DB 삭제 완료"\` 여부를 확인한다.
4. **FAIL·삭제 미완료** 시 오류 메시지와 가상 QA DB 이름을 기록하고, 실제 돌봄기록은 사용하지 않는다.
5. 브라우저/OS 버전, 시험 시각, 스크린샷(실제 환자정보 없음)을 QA 기록에 남긴다. 실기기에서 검증되지 않은 사항은 출시 판단에 통과로 기재하지 않는다.

브라우저 QA 페이지가 실제 운영에 노출되지 않도록 미리보기·localhost에서만 테스트를 실행하며, \`noindex\` 태그를 사용했다. 이는 인증이나 접근통제를 대신하지 않는다. 실제 개인 기록이 있는 브라우저 탭에서 전환 기능을 사용할 수 있도록 연결하지 않았다.

## 5. 개인정보 위험과 출시 전 해결 조건

| 위험 | 이번 15단계 조치 | 남아 있는 차단 조건 |
|---|---|---|
| R02/P0 여러 사람의 기록 혼합 | 무소속 보존 강제, 대상자 A/B 원본 유지·전체 건수 검증 | 기존 UI의 저장/검색/백업/인쇄 전면 프로필화 및 실제 사용자 시험 |
| R01/P0 건강정보 평문 저장 | 실제 로컬 저장소 접근 없음, QA에는 합성 정보만 사용 | 사용자 인증·암호화 백업·기기 분실·클립보드·JSON 파일 관리·개인정보 정책 |
| R03/P1 2개 탭 동시 저장 | QA DB 단일 트랜잭션·롤백 설계 | 실 브라우저 탭 경쟁, 강제 종료, 저장 할당량 초과 검증 |
| 의료정보 해석 | 진료 질문·기간 요약은 기존 별도 로직 유지 | 진료진/보호자 실제 검증, 부분 기록임을 표시 |
| 장기 기록 제한 | 기존 20건 상한 및 원본 자동 삭제 금지 | 장기 보관(IndexedDB), 암호화, 백업·삭제·보존기간 등 정책 |

**암호화 상태를 명확히 구분:** 8단계 \`secure-archive.mjs\`의 WebCrypto 암호화 프로토타입은 존재하지만 **현재 Memory UI 및 이번 QA DB와 연결되어 있지 않다**. 현재 사용자 저장소와 기존 JSON/TXT 백업은 암호화되지 않는다. 다중 대상자 UUID 구분도 사용자 인증이나 완전한 익명화를 제공하지 않는다.

## 6. 출시 판정·후속

- \`docs/qa/apuda-memory-release-gates.json\`: 필수 조건 **15개 중 PASS 2개, PENDING/DEFERRED 13개**. **NO_GO** 유지.
- \`tests/memory/test_release_readiness.cjs --require-go\`는 NO_GO 상태에서 **종료 코드 2** 반환.
- Netlify 무료 요금제를 유지하며, Draft PR #293을 **merge하지 않고**, main/운영 배포하지 않는다.
- 기존 개인 논술 기록, 환자 건강정보, 암 FAQ/라이브러리, 기타 ApuDa 데이터는 이번 작업 범위에 포함되지 않음.

**다음 단계 제안:** 실제 Android Chrome/iOS Safari에서 QA 13개 시나리오 수행, 2탭 경합·Quota·탭 강제종료·저전력 기기 PBKDF2 성능 점검, 보호자·보안 전문가에 의한 실사용 승인, 그 이후에만 동의형 데이터 이전/롤백 설계를 운영 UI에 연결할지 결정한다.

**결론:** 15단계 격리된 미분류 무손실 스테이징과 QA용 원자적 롤백 검증 체계 구축 완료. 실제 환자정보 운영 전환·브라우저 실기기 통과·개인정보 P0 해결 여부는 **미완료**.
