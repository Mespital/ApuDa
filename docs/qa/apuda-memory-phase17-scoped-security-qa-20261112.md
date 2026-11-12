# ApuDa Memory 17단계 — 대상자별 암호화 백업 격리 및 보안 사전검토

**작성일:** 2026-11-12 (KST)
**저장소/브랜치:** Mespital/ApuDa / \`feat/apuda-memory-p0-20261110\`
**PR:** #293 (Draft, 미병합)
**개발 미리보기 QA:** https://deploy-preview-293--apuda-total.netlify.app/memory/phase17-qa.html
**운영/의료 개인정보 판정:** **NO_GO**. 실제 사용자 기록·암호·백업 사용/복원/이전/삭제 없음. 운영 PR 병합·배포 없음.

## 1. 이번에 실제 개발한 내용

| 구분 | 파일 | 결과 |
|---|---|---|
| 대상자별 암호화 엔진 | \`public-site/memory/scoped-secure-archive.mjs\` | 선택한 익명 프로필의 **전용 JSON**만 암호화하는 독립 모듈 추가 |
| 실제 브라우저 Web Crypto 수동 QA | \`public-site/memory/phase17-qa.html\` | 가상 대상 A 19건, B 1건으로 암복호화, 암호 오류, 대상 불일치, 변조 및 측정(ms) 수행 가능 |
| Node 실 암호 연산 테스트 | \`tests/memory/test_phase17_scoped_secure_archive.mjs\` | 19건 AES-GCM 왕복 및 엄격한 형식, 잘못된 암호/ID/파일 변조를 재현하는 코드 추가 |
| 안전 경계 검사 | \`tests/memory/test_phase17_security_boundary.cjs\` | 실제 Memory UI에는 미연결, 추가 정보 노출 금지, 기존 출시 차단 유지 |
| 출시 차단 회귀검사 보강 | \`tests/memory/test_release_readiness.cjs\` | 암호화 실험 모듈·QA 화면을 실제 기록함에 연결하면 정적 검사 실패 |

**기존 사용자 화면 \`public-site/memory/index.html\`은 이번 17단계에서 변경하지 않았다.** 사용자의 건강정보는 여전히 기존 \`localStorage\` 방식이므로 기기 내부 저장 정보가 암호화됐다고 주장하지 않는다. 기존 JSON V1/V2 백업과 타 암종 FAQ, 개인 논술 데이터도 변경하지 않았다.

## 2. 대상자 전용 암호화 포맷

### 내부 평문

\`profile-workflow.mjs\`의 \`exportProfileBackup(vault, A)\`가 반환하는 \`apuda-memory-scoped-backup-v1\` 만 입력으로 허용한다. 입력 백업에는 선택한 한 대상의 \`sourceProfileId\`와 \`entries\`만 있다. 다른 대상, 미분류, 과거 \`apuda-memory-care-diary\` V1/V2 형식은 이 프로토타입의 입력으로 거부된다.

### 암호화 외부 봉투(Envelope)

\`\`\`json
{
  "format": "apuda-memory-scoped-encrypted-archive",
  "version": 1,
  "kdf": "PBKDF2-HMAC-SHA-256",
  "iterations": 600000,
  "cipher": "AES-256-GCM",
  "salt": "(무작위 16바이트의 Base64)",
  "iv": "(무작위 12바이트의 Base64)",
  "ciphertext": "(인증 암호문의 Base64)"
}
\`\`\`

위 JSON은 **설명을 위한 예시이며 다운로드 가능한 유효 백업 파일이 아니다.** 평문 이름·진료 질문·프로필 ID는 외부 봉투에 들어가지 않으며, 암호문 안에만 있다. 그러나 다른 파일·기록과 결합하면 익명 UUID가 개인과 연결될 수 있고, 암호화된 파일의 존재 자체도 보안 관리 대상이다.

- 키 유도: **PBKDF2-HMAC-SHA-256, 600,000회**, 비밀번호 길이 12자 이상, 최대 UTF-8 1024바이트. 무작위 salt 128비트.
- 데이터 보호: **AES-256-GCM**, 무작위 nonce/IV 96비트, 인증 태그 128비트.
- **AAD(Additional Authenticated Data, 인증에 포함되는 부가 정보):** \`APUDA-MEMORY-SCOPED-ARCHIVE-V1\`로 지정해 기존 범용 V1/V2 암호화 백업과 포맷을 구분한다.
- 크기·형식 제한: 최대 평문 256KiB, 암호화 봉투 JSON 384KiB, 외부 객체 키·알고리즘·반복 횟수·Base64 길이 엄격 검사.
- **복호화 대상 확인:** 사용자 인터페이스에서 명시적으로 선택한 프로필 ID와 **암호문 내부** \`sourceProfileId\`가 같을 때만 데이터를 반환한다. 다른 ID는 거부하고, 데이터를 자동으로 옮기거나 저장하지 않는다.
- 암호 분실 시 서버 복구·마스터 키·클라우드 백업 기능 없음. 패스프레이즈 복구 불가능.
- 완전한 E2EE 서비스라는 표현을 사용할 수 없다. 저장 중이거나 화면/클립보드에 표시된 평문에 대한 보호는 별도다.

## 3. 테스트 결과와 검증 근거

| 시험 | 판정 | 범위 |
|---|---|---|
| 실제 JS 모듈의 암호화→복호화 요청 흐름 | **PASS** | 모의 암호화 API/인증 태그를 사용한 단위 시험 |
| 잘못된 암호·암호문 변조·선택 프로필 불일치 | **PASS** | 위와 동일한 모의 암호화 흐름 |
| 외부 봉투에 기록 내용/프로필 ID 비노출 | **PASS** | 합성 데이터·모의 암호화 |
| 새 실험 모듈이 live Memory 기록함·localStorage에 미연결 | **PASS** | GitHub 소스 경계 정적 검사 |
| 앱에 원래 20건 제한·기존 저장소 유지 | **PASS** | 기존 \`index.html\` 소스 동일성 확인 |
| 새 Node 22의 **실제** AES-GCM/PBKDF2 테스트 | **실행 증거 미확보** | Node 테스트 파일은 생성했으나 현재 환경에서 저장소 전체를 로컬에 내려받아 실행하지 못함 |
| 실제 Android Chrome Web Crypto 성능 | **NT** | 기기에서 아직 미실행 |
| 실제 iPhone Safari Web Crypto 성능 | **NT** | 기기에서 아직 미실행 |
| 외부 보안 전문가의 암호학 설계 리뷰 | **NT** | 독립 감수·인증 없음 |
| 실제 개인기록 JSON/새 기기 복원 | **DEFERRED** | 사용자의 기존 지시에 따라 보류 |

**중요한 한계:** 합성 데이터를 사용한 자체 모의 암호화 엔진의 동작은 실제 AES-GCM 구현의 통과 증거가 아니다. Android/iOS와 Node의 실제 Web Crypto 테스트가 별도로 완료되어야 한다.

## 4. 사용자 기기에서 검증 절차

**시험 URL:** https://deploy-preview-293--apuda-total.netlify.app/memory/phase17-qa.html

1. Android Chrome 또는 iPhone Safari에서 위 주소에 접속한다.
2. \`가상 기록 19건 AES-GCM QA 실행\` 버튼을 누른다. 실명이나 실제 비밀번호는 입력하지 않는다.
3. 결과 중 \`status="PASS"\`, \`count=11\`, \`encryptMs\`, \`decryptMs\`, 브라우저 버전을 확인한다.
4. PASS 결과가 없다면 에러 메시지 및 시나리오 이름만 QA로 전달한다. 실제 건강정보와 암호를 함께 전송하지 않는다.
5. 테스트 페이지는 \`localStorage\`/IndexedDB/서버 통신을 사용하지 않으며, 테스트는 페이지 메모리에서만 가상 샘플을 다룬다.

**참고:** PBKDF2 600,000회는 저사양 모바일에서 지연이 발생할 수 있으므로 사용자에게 비밀번호 입력·오류 안내·성능 표시를 충분히 제공하고 성능 허용 기준을 시험 후 확정해야 한다. 1회 실행은 성능의 안정성을 보장하지 않는다.

## 5. 실제 서비스 적용 전 보안 위험(Threat Model)

| 위험 | 현재 통제 | 남아 있는 과제 |
|---|---|---|
| 비밀번호 추측 공격 | PBKDF2 600k, 무작위 salt | 사용자 비밀번호 강도·유출 암호 검사/해당 기능의 오프라인 공격 위험 검토 |
| 암호문 변조 | AES-GCM 인증 태그, 봉투 구조 엄격 검증 | 실제 모바일 암복호화·브라우저 파일 손상 시험 |
| 다른 보호 대상자에게 복원 | 암호문 내부 소스 프로필 ID와 선택 대상 비교 | 실제 화면의 대상자 선택·백업/복원 UX, 오류 복구 검증 |
| 현재 건강정보 평문 노출 | **미해결**, 별도 프로토타입만 존재 | 로컬 저장 암호화·사용자 인증·공용기기 정책 |
| 사용자 기기 분실/브라우저 자료 삭제 | 별도 백업 도구 미연결 | 데이터 보존·파기·백업 유효성·키 분실 안내 |
| 클립보드/PDF/TXT 평문 잔존 | 기존 경고문 유지 | 데이터 다운로드/복사 경로의 별도 위협 분석·정책 |
| XSS/악성 브라우저 확장 | 별도 통제 미검증 | CSP·의존 코드 검토·외부 코드 실행 위험 최소화 |
| 실제 의료진·보호자 사용성 | AI·가상 페르소나 평가만 존재 | 독립 전문가 및 실제 사용자 시험 |

**암호화 봉투는 전송·보관용 백업의 구성 요소일 뿐이며, 환자별 접근 권한을 부여하는 인증 또는 다른 사용자와의 기기 내 데이터 격리를 제공하지 않는다.**

## 6. 출시 판정과 다음 검증

\`docs/qa/apuda-memory-release-gates.json\` 기준 **15개 차단 조건 중 PASS 2개, PENDING/DEFERRED 13개 → NO_GO**. 실기기·의료·개인정보 전문가 감수·동의·백업·실제 복원 등 필수 증거가 없다.

다음 우선순위는 **실제 Chrome/Android/iPhone Web Crypto QA, 화면낭독·큰 글자, 2탭 트랜잭션, 정책·동의·보관기간 확인**이다. 개인 데이터 복원 시험은 기존 지시에 따라 추후로 보류한다.

운영 배포·PR 병합에 대한 승인 없음. 개발 PR Draft 유지, Netlify 무료 요금제 및 기존 논술/FAQ 데이터 보존.
