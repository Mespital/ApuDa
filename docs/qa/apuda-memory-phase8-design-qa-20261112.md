# ApuDa Memory 8단계 — 장기 기록 저장·암호화 백업 아키텍처 및 AI 사전점검

**작성일:** 2026-11-12 (Asia/Seoul)  
**대상:** Mespital/ApuDa / `feat/apuda-memory-p0-20261110` / PR #293  
**현재 서비스:** `public-site/memory/index.html`, `localStorage["apuda-memory-care-diary-v1"]`, 최대 20건  
**프로토타입 파일:** `public-site/memory/secure-archive.mjs`  
**자동 검사:** `node tests/memory/test_secure_archive.mjs`  
**운영 배포:** 없음. **새 기기 복원 시험:** 사용자 요청에 따라 보류.

## 1. 확정 개발 범위와 비범위

- 별도 모듈로 **비밀번호 보호 암호화 JSON 백업(Encrypted Archive)** 엔진의 초기 버전을 개발했다. 병원 서버 전송, 계정·사용자 식별, 클라우드 저장, 환자 기록 접근 없이 동작한다.
- 별도 순수 함수로 **IndexedDB 이전 사전검사(Migration Preflight)**를 만들었다. 현 저장 기록과 대상 기록의 개수, 중복 ID, 다른 내용을 가진 동일 ID를 비교해 충돌 가능성을 표시한다. **실제 IndexedDB를 열거나 쓰지 않는다.**
- **기존 ApuDa Memory 화면에 암호화 백업·복호화/이전 기능을 연결하지 않았다.** 기존 비암호화 JSON/TXT 백업과 V1/V2 복원은 그대로 존재하며, 현재 백업 파일을 암호화한다고 광고할 수 없다.
- 사용자의 기존 기록, 개인 학습/논술 데이터, FAQ 등 저장소 데이터는 읽기·초기화·전환하지 않았다.

## 2. 암호화 프로토타입 형식

| 항목 | 설계 |
|---|---|
| 포맷 식별자 | `apuda-memory-encrypted-archive` |
| 버전 | 1 |
| 암호 알고리즘 | **AES-256-GCM** (대칭 인증 암호화, 무결성 태그 128bit) |
| 패스프레이즈에서 키 유도 | **PBKDF2-HMAC-SHA-256, 600,000회** |
| Salt | 매 암호화마다 암호학적 난수 16바이트 |
| IV/Nonce | 매 암호화마다 암호학적 난수 12바이트(96bit) |
| 인증 부가 데이터(AAD) | 고정 형식 도메인 문자열 `APUDA-MEMORY-ENCRYPTED-ARCHIVE-V1` |
| 입력 | 기존 돌봄 기록 JSON V1/V2, 1~20건, 각 메모 최대 1,000자, 질문 최대 300자 |
| 한도 | JSON 평문 최대 256 KiB, 암호화 envelope 최대 384 KiB |
| 비밀번호 | 12자 이상(최대 UTF-8 1,024바이트), **충분히 긴 고유 문장형 암호 권장** |
| 결과 | 암호화된 envelope JSON (암호문, salt, iv, 알고리즘·버전 메타데이터) |
| 네트워크 | API 호출·전송·로그·저장소 쓰기 없음 |
| 복구 | 비밀번호 분실 시 복호화 지원 불가. 사용자에게 사전 고지 필수 |

**참고:** OWASP의 PBKDF2-HMAC-SHA-256 600,000회 안내를 반영했으며[1], AES-GCM IV 96bit와 HTTPS 보안 컨텍스트 사용은 MDN에 근거한다[2][3]. 600,000회는 보안 강화를 위한 연산 비용으로 저사양 모바일에서 복호화가 느릴 수 있다. 실제 Android/iOS 성능 시험 전에는 사용자 서비스에 연결하지 않는다.

### 보안 경계

- 암호화 모듈 자체는 민감정보가 담긴 **별도 파일**을 암호화할 수 있지만 **현재 브라우저 localStorage, 기존 JSON/TXT 백업, 인쇄 PDF, 클립보드**를 암호화하지 않는다.
- 페이지에 실행되는 악성 스크립트(XSS)나 장치 탈취, 약한 비밀번호, 사용자 공유에 대한 만능 보호가 아니다. 보안 위협 모델, CSP(Content Security Policy), 라이브러리 의존성, 키 생성·입력 UX의 검토가 추가로 필요하다.
- 암호화 envelope의 버전·KDF 반복 횟수·필드·길이를 엄격히 확인한 뒤만 복호화한다. 암호 불일치와 GCM 변조 오류는 같은 실패 메시지로 취급한다.
- 복호화 함수는 원본 JSON **객체만 반환**한다. 저장은 자동 수행하지 않으며, 도입할 경우 사용자 명시적 확인, 중복 방지, 원본 보존이 별도 요구사항이다.

## 3. 장기 보관 후보 구조 (IndexedDB)

| 논리 객체 저장소(Object Store) | 주요 필드 | 기능 |
|---|---|---|
| `records` | `id`, `date`, `text`, `sleep`, `meal`, `medicationCheck`, `question`, `updatedAt` | 기록 ID 기본 키, 날짜 색인 |
| `metadata` | `schemaVersion`, `createdAt`, `migrationState`, `sourceCount`, `verifiedAt` | 저장 형식·마이그레이션 상태 관리 |

DB 명칭 후보: `apuda-memory-v2`. **아직 데이터베이스를 실제 생성하지 않았으며** 표는 설계안이다. IndexedDB는 브라우저의 로컬 저장 기술로 서버 비용을 늘리지 않을 수 있지만, 기기 분실·브라우저 데이터 삭제에 대비한 백업은 계속 필요하다. 이 DB가 자동 암호화되어 있다는 의미도 아니다.

### 무손실 이전(Migration) 게이트

1. **원본 백업 선행:** 현재 20건 이내 localStorage JSON 내보내기, 다운로드 파일 존재·읽기 가능 확인. 민감정보 공개 서버 업로드 금지.
2. **Read-only Preflight:** 백업 JSON과 대상 레코드를 검증. `id` 중복, 날짜 오류, 허용하지 않은 속성, 같은 ID의 다른 내용은 **블로커**로 중단. 프로토타입 `planIndexedDbMigration`은 읽기·쓰기 없는 계획만 반환한다.
3. **명시적 사용자 동의:** 저장 방식과 롤백 제한을 별도 안내 후 승인을 받는다. 7단계에서 보류한 다른 기기 복원은 여기서 수행하지 않는다.
4. **원자적 트랜잭션:** 미래 구현에서 IndexedDB `readwrite` 트랜잭션으로 새 데이터만 저장하고, 하나라도 오류가 나면 전체 중단(abort). 다른 탭의 `versionchange`를 처리해야 한다.
5. **검증 단계:** 대상 ID, 건수, 날짜, 각 필드의 정규화된 내용 및 해시를 원본과 대조. 오류 시 읽기 전환·원본 삭제 금지.
6. **점진적 읽기 전환:** 기능 플래그(Feature Flag)로 내부 테스트 계정/기기에서만 IndexedDB를 우선 읽고, 문제가 생기면 localStorage로 롤백.
7. **원본 보존:** 충분한 실제 테스트와 사용자의 별도 승인 전에는 localStorage를 지우거나 자동 변환하지 않는다. 이 단계에서는 실제 이전 자체를 하지 않는다.

> **주의:** 20건에서 수백 건으로 늘리는 것은 UI·검색, 저장 할당량, 기기 성능, 데이터 보존 정책까지 영향을 준다. IndexedDB의 사용 가능 용량은 브라우저·기기별로 달라진다. “무제한 저장”이라고 홍보하지 않는다.

## 4. 개발 검증 결과

실행: `node tests/memory/test_secure_archive.mjs` (Node.js 22 WebCrypto 사용, 합성 데이터만).

| 자동 시험 | 결과 |
|---|---|
| 한국어·이모지 포함 JSON 암호화→복호화 왕복 | PASS |
| 암호문에 평문 메모 노출되지 않음 | PASS |
| 잘못된 비밀번호 복호화 거부 | PASS |
| 암호문 1글자 변조 검출(GCM) | PASS |
| 무단 KDF 반복 횟수 변경 거부 | PASS |
| 최소 비밀번호 길이 검사 | PASS |
| 잘못된 날짜·지원하지 않는 필드 입력 거부 | PASS |
| 반복 암호화 시 고유 salt/IV 생성 | PASS |
| IndexedDB 이전 사전검사에서 ID 일치 및 데이터 충돌 탐지 | PASS |
| 현재 저장소 데이터에 쓰기 없는 순수 로직 | PASS(코드 구조) |
| 저사양 Android/iPhone Web Crypto 성능 | **NT** |
| 실제 브라우저 PDF·안전한 파일 저장 | **NT** |
| 전문 보안 침투시험, 암호학 설계 독립 감수 | **NT** |
| 실제 IDB 이전·롤백, 기기 복원 | **미구현·보류** |

**NT=Not Tested(검증 미수행).** 합성 데이터 회귀 통과는 인증·취약점 점검 완료를 의미하지 않는다.

## 5. ApuDa 역할별 AI 사전점검

이번 단계는 임상 의료정보 새로 작성이 아니라 개인정보와 저장소 아키텍처 변경 설계에 해당한다. 따라서 D05(품질·회귀 테스트), D06(개인정보·보안), M03(돌봄 정보의 오해 위험), C01·C02(보호자 안내와 복구 경험) 관점이 핵심이며, 사용자의 ApuDa 감수 프레임워크를 사용한 **AI 논리 검토**로 한정된다. 실제 30명의 전문가·환자·보호자 참여 기록은 없다.

핵심 차단 조건: **실제 기록 대상으로 시험 금지**, **서버·클라우드 전송 금지**, **자동 마이그레이션 금지**, **비밀번호 분실 복구 가능하다고 홍보 금지**, **독립 보안 검토 전 사용자용 암호화 버튼 출시 금지**.

## 6. 단계 승인 판단

- [x] 8단계 독립 암호화·이전 사전검사 코드 작성
- [x] 합성 기록 자동 시험
- [x] 보존·롤백·위협 모델 문서화
- [ ] 모바일 성능 및 접근성 QA
- [ ] 실제 IndexedDB 트랜잭션·롤백 프로토타입
- [ ] UX 검증(암호 분실·파일 보관·복구 안내)
- [ ] 개인정보 보호/보안 전문가 독립 점검
- [ ] 사용자 명시 승인 후 기능 플래그 연결
- [ ] 운영 배포 승인

**현 단계 결론:** 7단계의 localStorage 20건 및 기존 JSON 복원 체계를 그대로 사용. 8단계 모듈은 코드 저장소에만 추가하여 최종 사용자 UI나 운영 기록에 영향을 주지 않는다. 따라서 “ApuDa Memory 암호화 완료” 또는 “장기 기록 이전 완료”로 표시해서는 안 된다.

## 자료

1. OWASP, Password Storage Cheat Sheet — PBKDF2-HMAC-SHA-256: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
2. MDN, AesGcmParams — 96-bit IV / unique per encryption: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
3. MDN, SubtleCrypto.encrypt() — secure context: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
4. MDN, IndexedDB `versionchange`: https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/versionchange_event
