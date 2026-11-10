# ApuDa V3 → V4 원자적 이전 합성 검증 — AI 사전점검

- 작성일: 2026-11-11 (KST)
- 대상: Draft PR #292 (`feat/note-v4-sandbox-checkpoint-20261110`)에서만 보이는 개발용 시험 페이지.
- 목적: 기존 V3의 **정확한 원본 UTF-8 문자 시퀀스**(원문 JSON 문자열), SHA-256 지문, V4 읽기 전용 확장 초안을 하나의 IndexedDB 트랜잭션에서 유지할 수 있는지 검증.
- 실제 환자·보호자·학습 기록: **읽기, 변경, 자동 이전, 삭제, 전송 모두 없음**. `main` 병합·운영 배포 없음.

## 구현 파일

- `public-site/note-v4/migration-atomic-lab.html`: noindex, `connect-src 'none'`, 자가 시험 결과만 표시.
- `public-site/note-v4/migration-atomic-lab.js`: 합성 V3 백업을 `ApuDaV4MigrationRehearsal.prepare/verify`에 명시적으로 전달. 실사용 데이터 키를 모르는 실행별 임의 이름의 IndexedDB에 보관하고 시험 종료 후 DB 삭제 요청.
- `tools/tests/apuda-note-v4-migration-atomic-mock.cjs`: 기존 변환기 및 신규 시험 페이지의 실제 JS를 VM에서 실행하고 합성 `IndexedDB` 트랜잭션 모의 구현으로 8개 시나리오 재현. **실제 브라우저 IndexedDB 시험을 대체하지 못함.**
- 기존 `note-storage.js`는 백업형식 검증기 역할만 함. 기존 데이터로의 직접 접근은 테스트 페이지에 없음.

## 검증 현황

- `node --check public-site/note-v4/migration-atomic-lab.js`: **PASS**.
- `node tools/tests/apuda-note-v4-migration-rehearsal.cjs`: **PASS** (기존 V3/V4 메모리 리허설).
- `node tools/tests/apuda-note-v4-migration-atomic-mock.cjs`: **8/8 PASS**, 하지만 **모의 IndexedDB**라 실제 브라우저의 트랜잭션 내구성·경합을 증명하지 않음.
- Netlify Deploy Preview URL `https://deploy-preview-292--apuda-total.netlify.app/note-v4/migration-atomic-lab.html`: 페이지 렌더링과 시험 버튼 확인. **실제 브라우저의 8개 테스트 실행은 미완료** (시험 종료 시 생성한 임시 DB 자동 삭제를 수행하므로 별도 UI 확인 절차 필요).

## 검증 조건 8건

1. 원문 CRLF·한글·이모지와 질문 4건 보존, V4 전환 승인 플래그 `false`.
2. 원문·SHA-256·V4 초안이 같은 `readwrite` 트랜잭션으로 저장됨.
3. 같은 요청을 중복 수행하면 저장된 리비전이 증가하지 않는 **멱등성(idempotency)**.
4. 두 개의 연결에서 같은 리비전을 기준으로 서로 다른 초안을 동시에 저장하면 성공 1·충돌 1.
5. 구형 리비전의 재이전을 거부하고 최신 기록 보존.
6. 변조된 V3 원문을 SHA-256 검증으로 사전 거부.
7. IndexedDB `put` 직후 강제 `abort()`된 트랜잭션은 원문과 초안 모두 롤백.
8. 실패 후 정상 재시도, 외부 합성 V3 원천 불변, 미지 필드 보존.

주의: 이것은 **읽기 전용 V4 제안서의 원자적 저장 시험**이지, 실제 환자 수첩으로 사용 가능한 V4 레코드 또는 데이터 이관 기능이 아니다. SHA-256은 우연한 변경 탐지용이며 비밀키가 없는 해시만으로 악의적인 재계산·조작을 막는 인증 기능은 제공하지 않는다. `originalRaw` 문자열의 UTF-8 인코딩 내용은 검증하지만 원본 파일의 BOM 또는 파일시스템 메타데이터 보존까지 검증하지 않는다.

## ApuDa 감수 체계상 판단 (AI 사전점검만 실시)

- **D05 개발·품질:** 단일 저장소 `readwrite` 직렬화, revision 비교, 트랜잭션 abort, 중복 요청 테스트를 통과해야 한다.
- **D06 개인정보·보안:** 실제 저장 키/계정/서버에 접근하지 않음. 브라우저에서 합성 데이터를 만들며 외부 전송 금지. 임시 DB 삭제 결과 별도 확인.
- **D04 접근성:** 버튼의 48px 터치 높이, `role=status` + `aria-live=polite`, 명확한 통과/실패 텍스트. 모바일 스크린리더 실기기 점검은 아직 필요.
- 임상·사용자 실제 감수 참여 및 승인은 **없음**. 30인 프레임워크의 역할별 AI 사전점검이며 전문가 실감수 완료로 표기하지 않는다.

## 운영 전 필수 미해결 차단 조건 (P0)

1. V3의 `localStorage`에는 실제 다중 창 저장·복구 간 경합 재현 사례가 있음 (Draft PR #294 진단). 새 V4 시제품은 V3 실행 경로에 연결되지 않아 위험을 해소하지 못함.
2. 모든 저장·복원·삭제 경로를 원자적 규약으로 통일하고, **기존 V3 탭과 새 V4 탭이 함께 열린 상태**의 변경을 차단하거나 조정할 프로토콜 검증.
3. 사용자 동의 기반 V3 전체 키·관련 보조 기록 백업, 출처별 버전/데이터 무결성 확인, 복구 시나리오, 오프라인 및 강제 종료·저장공간 부족·브라우저 정책 점검.
4. 기존 V3 원본 자동 삭제 금지. 실제 데이터 전환·운영 배포·PR 병합은 별도 승인 전까지 중단.

기술 1차 근거: [W3C Indexed Database API 3.0](https://www.w3.org/TR/IndexedDB/).
