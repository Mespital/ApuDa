# ApuDa Memory 16단계 — 동시 연결·용량 오류·암호화 성능·개인정보 보호 QA

**검토일:** 2026-11-12 (Asia/Seoul)  
**저장소:** Mespital/ApuDa  
**작업 브랜치:** \`feat/apuda-memory-p0-20261110\`  
**PR:** #293 (Draft, 미병합)  
**브라우저 QA:** https://deploy-preview-293--apuda-total.netlify.app/memory/phase16-qa.html  
**출시 판정:** **NO_GO**, 개발 미리보기 전용

이 단계는 **테스트용 가상 기록만** 사용한다. 실제 돌봄 기록, 개인 논술 기록, FAQ/사이트 데이터의 이전·복원·삭제·암호화 전환·운영 배포를 수행하지 않는다. 실제 사용자의 원본 JSON 및 새 기기 복원 시험은 기존 요청대로 보류.

## 1. 변경 사항

| 파일 | 개발 내용 | 서비스 화면 영향 |
|---|---|---|
| \`public-site/memory/profile-vault-idb-qa.mjs\` | 검증 표시 전체 비교, 결과 미생성 시 fail-closed 처리, **QA 전용** \`injectQuotaAbort\` 주입 | 기존 Memory 화면에 미연결 |
| \`public-site/memory/phase16-qa.html\` | 실제 브라우저에서 테스트 버튼으로 QA DB 연결 두 개의 동시 쓰기·백업 암복호화 시간을 확인 | 개발 미리보기·localhost에서만 QA 실행 |
| \`tests/memory/test_phase16_race_and_quota.mjs\` | 트랜잭션 직렬화를 재현하는 비동기 가상 DB로 25차례 경쟁·오류 롤백 자동검사 | 가상 데이터 |
| \`tests/memory/test_profile_vault_idb_qa.mjs\` | 용량 부족 오류 주입·부분 변조된 감사 마커를 거부하는 회귀검사 | 가상 데이터 |
| \`tests/memory/test_phase16_qa_ui.cjs\` | QA 화면 15개 항목·개발 미리보기 접근 제한·DB 삭제에 대한 모의 DOM/암호화 테스트 | 가상 데이터·모의 암호화 |
| \`tests/memory/test_phase16_crypto_benchmark.mjs\` | **Node 22용 20건 합성 기록**의 AES-GCM·PBKDF2 암복호화 3회 성능 측정 테스트 추가 | 가상 데이터, 별도 실행 필요 |
| \`tests/memory/test_phase16_boundary.cjs\` | 테스트 코드 격리·평문 저장 위험·출시 차단 게이트 검사 | 실제 기록 접근 없음 |
| \`tests/memory/test_release_readiness.cjs\` | 16단계 QA가 사용자용 Memory 화면에 연결되지 않았는지 고정 검사 | 기존 배포 판정 NO_GO 유지 |

기존 사용자용 \`public-site/memory/index.html\`에는 변경이 없다. \`localStorage["apuda-memory-care-diary-v1"]\`와 20건 제한, 기존 JSON V1/V2 백업·복원은 그대로 유지한다.

## 2. 기술 검증 상세

### 2-1. 동일 DB의 두 연결 경쟁 (Simulated concurrency)

기존 QA DB는 **\`apuda-memory-qa-vault-*\` 접두어**의 격리 데이터베이스만 허용한다.

- 합성 원본: A 프로필 소속 1건, 미분류 1건. B 프로필은 0건.
- 서로 다른 후보 백업 2개로 **동일 QA DB에 열린 두 연결**에서 전환을 동시에 요청한다.
- \`readwrite\` 트랜잭션을 직렬화해 재현하는 테스트 환경에서 25차례 검사.
- 매 차례 기대: **1개만 완전 커밋, 다른 1개는 충돌로 거부**; 최종 미분류 2건, 분류된 A 1건, B 0건; 사후 검증 마커 정상; 재실행 시 중복 없음.
- 기존 원본 객체의 문자열/필드/순서 불변을 별도 확인.

**확인 결과: 25회 PASS(비동기 IndexedDB 시뮬레이터).** 이는 **두 개의 실제 Android/iPhone 탭 실행이 아니다**. 실제 브라우저의 2탭 경쟁·잠금·강제 종료는 NT(Not Tested).

### 2-2. 저장 공간 부족 (QuotaExceededError)

- 실제 기기 저장 공간을 의도적으로 채우거나 개인 기록을 삭제하는 방식은 사용하지 않는다.
- \`injectQuotaAbort:true\`는 QA 테스트 경로에서만 **이름이 QuotaExceededError인 오류**를 발생시키고 트랜잭션을 취소한다.
- QA 시뮬레이션에서 스냅샷과 검증 마커가 모두 저장되지 않으며 기존 데이터는 보존됨을 확인.
- **실제 브라우저 QuotaExceededError/캐시 삭제·스토리지 압박 재현은 NT.**
- 브라우저 페이지는 가능한 경우 \`navigator.storage.estimate()\`로 **대략적 할당량 메타데이터만 조회**한다. 실제 개인 기록의 내용을 읽지 않으며, 이 수치는 실사용 가능 용량의 보장이 아니다.

### 2-3. 감사 검증표시 전체 비교

기존의 \`marker.verified === true\` 하나만 확인하는 재실행 허용보다 보수적으로 **소스 기록 건수·미분류/분류 건수·타입·전체 값**을 비교하도록 개선했다.

- 실제 저장 스냅샷은 동일하지만 마커의 \`sourceCount\` 값이 달라진 경우 재실행을 **거부**한다.
- 테스트 후 마커를 복구하고 원래 상태를 재확인한다.
- 실제 의료기록의 법적 감사로그나 무결성 보증은 아니다. 같은 브라우저에 접근 가능한 악성 코드까지 보호하는 기능이 아니다.

### 2-4. 암호화 백업과 성능

- 사용되는 **별도 실험 모듈**: \`secure-archive.mjs\`.
- **AES-256-GCM** 인증 암호화, **PBKDF2-HMAC-SHA-256 600,000회** 키 유도, 128비트 태그.
- 16단계 브라우저 QA는 가상 기록 **20건**을 암호화 → 복호화하고, 소요시간(ms)을 표시하며 잘못된 암호와 변조를 거부하는지 확인하도록 작성했다.
- \`test_phase16_crypto_benchmark.mjs\`도 Node 22에서 20건·3회 성능 분포를 측정하도록 추가했지만, 이 16단계 작업 중에는 해당 테스트의 실제 Node 실행 수치를 확보하지 않았다.
- **모의 UI 테스트의 암호화 동작은 Web Crypto를 대체하는 가짜 구현**이다. 따라서 UI 자동검사 PASS나 모의 실행 시간이 실제 AES-GCM 성공/기기 성능을 의미하지 않는다.
- 이전 10단계의 **Node Web Crypto 단일 가상 기록 시험**은 통과했으나, 실기기 20건 성능은 여전히 NT.
- 비밀번호 분실 복구 불가, 백업 파일 보호, 악성 확장·XSS, 클립보드/인쇄물 잔존 위험은 별도 평가 대상이다.

## 3. 검증 결과 표

| 항목 | 결과 | 방법/정확한 범위 |
|---|---|---|
| 25회 2연결 경쟁 처리 | PASS | 직렬화된 IndexedDB 가상 스케줄러 |
| 한 후보만 최종 저장·반대 후보 혼입 없음 | PASS | 위 시뮬레이션 |
| 강제 Abort 및 QuotaExceededError 주입 후 전체 롤백 | PASS | 합성 오류 주입 |
| 마커 내용 변조 시 멱등성 재실행 거부 | PASS | 기존 Phase15 가상 DB 회귀 확장 |
| 브라우저 진단 화면 15항목 | PASS(모의) | 가상 DOM + 가상 DB + **가짜 암호화 모듈** |
| 미리보기 이외 호스트에서 실행 금지·임시 DB 삭제 | PASS(모의) | 가상 DOM/DB 확인 |
| QA 코드의 원본 기록 미접근·기존 화면 격리 | PASS | 소스/정적 검증 |
| 실제 Chromium 144의 로컬 QA 페이지 실행 | **BLOCKED** | 접근이 \`ERR_BLOCKED_BY_ADMINISTRATOR\`로 차단 |
| 실제 Android Chrome의 IndexedDB/암호화 성능 | **NT** | 기기 접근 없음 |
| 실제 iPhone Safari의 IndexedDB/암호화 성능 | **NT** | 기기 접근 없음 |
| 실제 2개 탭 경합, 저장 공간 초과, 강제 종료 | **NT** | 실브라우저 미실행 |
| Node 22 20건·3회 새 벤치마크 | **추가됨/실행 증거 미확보** | 테스트 파일은 GitHub에 존재 |
| 실제 사용자 원본 JSON/새 기기 복원 | **DEFERRED** | 기존 사용자 요청대로 보류 |
| 독립 의료진·보안 전문가·환자/보호자 실사용 검토 | **NT** | AI·가상 코드 검토만 존재 |

**원칙:** 자동검사 수가 늘었다는 이유로 기기 검증이나 외부 보안 인증이 완료된 것으로 간주하지 않는다.

## 4. 사용자 실기기 시험 절차

대상: **https://deploy-preview-293--apuda-total.netlify.app/memory/phase16-qa.html** (실제 개인정보 없음, 가상 기록만 사용)

1. Android Chrome 또는 iPhone Safari에서 위 QA 주소를 직접 연다. QA 페이지에서 실제 이름·진료 내용을 입력하지 않는다.
2. “가상 기록 QA 실행 (동시 저장·암호화)” 버튼을 누른다.
3. 결과의 \`status="PASS"\`, \`passCount=15\`, \`cleanup="QA 임시 데이터베이스 삭제 완료"\`를 확인한다. 동시에 \`encryptMs\`, \`decryptMs\` 및 브라우저 버전을 기록한다.
4. **FAIL**, 멈춤, \`cleanup\` 미완료 시 해당 결과만 QA 보고서에 전달한다. 기존 돌봄 기록의 삭제/초기화/복원으로 해결하려고 하지 않는다.
5. 결과를 기록할 때 기기 모델·OS/브라우저 버전·시험 시각·정확한 실패 단계·민감정보 없는 스크린샷을 포함한다. 2개 독립 탭 경쟁·실제 Quota·강제 종료는 이 단추 하나로 검증되는 항목이 아니므로 별도 시험표로 유지한다.

## 5. 실제 운영 출시 전 필수 항목

**현재 NO_GO의 주요 이유**

- **R01/P0** 개인정보 보호: 실제 Memory 브라우저 기록은 암호화되지 않은 localStorage이며, JSON/TXT/PDF/클립보드 개인정보 잔존 위험이 여전히 존재한다.
- **R02/P0** 보호 대상자 혼합: 프로필 분리 기능은 QA 전용이고 실제 사용자 기록함은 대상자별 격리가 구현되지 않았다.
- **R03/P1** 다중 탭: 25회 QA 시뮬레이션은 통과했지만 실제 Chrome/Safari 동시 저장은 아직 검증 전.
- **복구**: 실제 사용자 기록의 새 기기 복원/마이그레이션을 이번 단계에서 실행하지 않았다.
- **모바일 접근성·사용성**: 큰 글자, TalkBack/VoiceOver, PDF 인쇄·클립보드 실패의 실기기 시험이 남아 있다.
- **보안·임상 검토**: 독립 보안 전문가·실제 보호자·의료전문가 참여 이력 없음.

\`docs/qa/apuda-memory-release-gates.json\`은 현재 기준 **15개 차단 조건 중 PASS 2개, PENDING/DEFERRED 13개 → 출시 NO_GO**. \`tests/memory/test_release_readiness.cjs --require-go\`는 미승인 상태에서 종료 코드 2를 반환하도록 유지한다.

**계속 보류:** PR #293 main 병합, Netlify 운영 배포, 실환자 기록 이전·복원, 암호화 저장 기능의 실서비스 노출. Netlify 무료 요금제·기존 논술 기록·FAQ에 영향 없음.

## 6. 코드·QA 증거

- QA 기기 진단: \`public-site/memory/phase16-qa.html\`
- IDB QA 모듈: \`public-site/memory/profile-vault-idb-qa.mjs\`
- 25회 경쟁 시뮬레이터: \`tests/memory/test_phase16_race_and_quota.mjs\`
- 15항목 UI 회귀: \`tests/memory/test_phase16_qa_ui.cjs\`
- 합성 20건 Node 암호화 벤치마크: \`tests/memory/test_phase16_crypto_benchmark.mjs\`
- 테스트/운영 경계 검사: \`tests/memory/test_phase16_boundary.cjs\`
- PR: https://github.com/Mespital/ApuDa/pull/293

**단계 결론:** 16단계 테스트 도구 및 QA 안전성 개선 완료. 실제 모바일 환경에서 IndexedDB 원자성·데이터 손실 방지·AES 성능을 인증한 것은 아니며, **출시 NO_GO 유지**.
