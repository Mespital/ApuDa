# ApuDa V3 통합 저장 계약 — 기록·대화·복원·전체 삭제 (개발용)

- 기준일: **2026-11-12 KST**
- 범위: Draft PR #294 `fix/note-v3-restore-integrity-20261110`, 합성 데이터 전용 새 파일 5개. `note-app.js`, `apuda-backup.js`, `sw.js`, Netlify 운영 설정은 수정하지 않음.
- AI 사전점검 역할: D05 개발·품질, D06 개인정보·보안, D04 접근성, M03 기록 안전. 실제 30인 감수단 참가·임상승인·환자/보호자 사용성 시험 **없음**.
- 기존 결함: `node tools/tests/apuda-note-v3-cross-tab-race-diagnostic.cjs`에서 `replace`와 `recover` **2/2 `RISK_REPRODUCED`**. 본 작업으로 운영 코드가 개선됐다는 주장은 **금지**.

## 1. 설계된 통합 계약

기존 V3에는 기본 기록 `apuda_cancer_care_v1`, 채팅 `apuda_note_chat_v1`, 복원 체크포인트, Drive 백업 메타 등이 서로 다른 저장 경로에 있다. 하나의 사용자 작업에서도 오래된 탭의 쓰기가 최신 원문을 덮을 수 있다.

개발용 `v3-unified-contract-sandbox.js`는 **기록 본문, 대화, 체크포인트, 삭제 표시 및 공통 revision을 한 IndexedDB 객체 행에 저장**한다. 이 행의 수정은 단일 `readwrite` 트랜잭션으로 커밋되어, *같은 이전 revision에서 출발한 두 연결 중 하나만 성공*하도록 설계한다. `expected.note`/`expected.chat` 정확한 원문도 함께 비교한다. 비동기 지문 계산(SHA-256)은 트랜잭션 **시작 전** 완료한다.

| 작업 | 동시성 조건 | 개발 시제품의 동작 | 운영 적용 여부 |
|---|---|---|---|
| 일반 기록 저장 | 공통 revision + 기존 원문·대화 일치 | 기록 변경, 새 revision, 대화 유지 | 미적용 |
| 대화 저장 | 같은 revision + 두 원문 일치 | 대화 변경, 기록 유지, 최대 60개 대화/2 MiB 검증 | 미적용 |
| 파일/Drive 복원에 준하는 복원 | 최신 revision 및 기존 본문·대화 일치 | 기본 기록 전·후 SHA-256 + 대화 원문을 체크포인트에 함께 보관 | 미적용, 실제 Drive 호출 없음 |
| 복원 취소 | 체크포인트 지문·원문 및 최신 revision 일치 | 이전 본문·대화로 단일 트랜잭션 복구 | 미적용 |
| 전체 삭제 | 동일 revision 및 원문 | 데이터 없는 tombstone(삭제 표시)과 증가 revision을 원자적 기록 | 미적용 |
| 삭제 후 오래된 탭 저장 | 오래된 revision 또는 삭제 표시 | `conflict`/`deleted-requires-manual-new-session` | 미적용 |
| Drive 백업 계획 | revision 및 구형 탭 종료·혼재 해소·동의 여부 | **항상 `blocked`**, 자동 업로드/`prune` 권한 반환하지 않음 | 미적용 |

삭제 표식은 개인정보 필드 없이 수정번호만 보존한다. 여기서의 *단일 데이터베이스 행 삭제*는 기존 운영 V3 `localStorage` 4개 키 삭제와 동일하지 않으며, 구형 탭의 재쓰기를 막지 못한다.

## 2. 증거 수준별 시험

- **PASS (Node.js VM + 결정적 IDB 모의):** `node tools/tests/apuda-note-v3-unified-contract.cjs`. 원문 저장, 대화 저장, 서로 다른 탭의 동시 기록/대화 경합, 수정번호 일치, 미지 필드 보존, 오래된 복원 차단, 체크포인트와 원문 지문, 강제 abort 전체 롤백, 복원 취소, 복원 직후 대화 변경 시 이전 체크포인트 사용 차단, 전체 삭제, 삭제 후 자동 재생성 차단, 입력 검증, 타 DB 격리, Drive 자동 업로드·정리 금지.
- **브라우저 실행 예정/별도 기록:** `public-site/note/v3-unified-contract-lab.html`, `v3-unified-contract-lab.js`의 **12개 항목**. 각 실행 시 별도 합성 DB 2개 연결을 열고 완료 후 닫아서 DB 삭제 상태를 확인한다.
- **로컬 Chromium 미실행:** `node tools/tests/apuda-note-v3-unified-browser.cjs`는 환경의 Chromium 시작 단계에서 `socket() failed: Operation not permitted`로 실패. 테스트 실패가 아니라 **실기기 브라우저 검증 NT**로 표시하고, Netlify Draft Deploy Preview를 통해 별도 실행 확인이 필요하다.
- **기존 운영 결함 미해결:** `node tools/tests/apuda-note-v3-cross-tab-race-diagnostic.cjs`는 **2/2 위험 재현**.

## 3. 보안 및 데이터 생명주기 차단

1. `PREFIX='apuda-v3-synthetic-unified-'`에 맞는 IndexedDB 핸들만 받는다. 기본 환자 기록 및 논술 앱의 키를 열람하거나 변경하지 않는다.
2. 이 실험 파일은 `window.localStorage`, `sessionStorage`, 네트워크 API나 Drive API를 호출하지 않는다. 브라우저 시험 페이지도 `connect-src 'none'`이다.
3. **사용자가 구형 탭을 모두 닫았다는 증거가 없으면 운영 이전 금지.** 화면에 보이는 구형 탭을 닫아도 Service Worker나 이미 열린 다른 기기의 기존 코드 문제가 남을 수 있다.
4. Drive의 `Storage.prototype.setItem` 후킹과 7개 보관 정책 `prune()`은 **운영 구형 코드에 남는다**. 새 시제품의 Drive 차단은 기존 코드를 원격으로 중단하지 못한다.
5. 기존 V3 데이터, 복원 체크포인트, Drive 백업 목록, 채팅을 **수정 없이 원본 내보내기** 하고 무결성 대조 후에만 사용자 승인형 이전을 고려한다. 원본을 화면·로그·PR에 출력하지 않는다.

## 4. AI 사전점검 의견 및 미완료 출시 게이트

| 중요도 | 판단 | 책임 시각 | 해소/검증 기준 |
|---|---|---|---|
| P0 | **실제 운영 V3 지연 쓰기 데이터 덮어쓰기 위험 2/2 재현** | D05/D06 | 운영 저장 전 경로 W01–W14를 일관된 저장 계약으로 바꾸고, 구형 탭/오프라인 캐시 혼재 차단 검증 |
| P0 후보 | 기존 구형 Drive 후킹·자동 `prune()`과 혼재 시 백업 이력 영향 가능성 | D06 | 실제 계정 미접근 모의 재현, 자동 백업/정리 안전 게이트 검증, 사용자 수동 충돌 해결 |
| P1 | 채팅/체크포인트/삭제의 비원자성 및 복원 후 기록 분기 | D05/D06 | 브라우저·Android·iOS에서 동일 contract의 실제 입출력 및 중단·quota 예외 검증 |
| P1 | 실브라우저 합성 12건 및 접근성 테스트 | D04/D05 | 별도 격리된 브라우저에서 실행, 임시 DB 삭제 확인, 모바일 화면 검토 |

현재 검토는 **AI 기술 사전점검**만으로 점수 산출 보류(NT 존재). 실제 전문가 승인·실제 사용자 시험·의료내용 검토를 수행했다는 의미가 아니다. **Draft PR 유지 / main 병합 금지 / 운영 배포 금지 / Netlify 무료 플랜 유지 / 실환자·논술 데이터 보존.**

## 5. 수정 파일

- `public-site/note/v3-unified-contract-sandbox.js`
- `public-site/note/v3-unified-contract-lab.html`
- `public-site/note/v3-unified-contract-lab.js`
- `tools/tests/apuda-note-v3-unified-contract.cjs`
- `tools/tests/apuda-note-v3-unified-browser.cjs`
