# ApuDa V3 미저장 기록 — Chromium 합성 브라우저 시험

일자: 2026-11-12 KST. 검토: D04/D05/D06 AI 사전점검, **실제 임상전문의·환자·보호자 감수 없음**.

## 실행 환경 / 재현 범위
- 환경: 로컬 Linux Chromium 144, Playwright 격리 브라우저 컨텍스트, HTML `set_content()`로 브라우저에서 JS/Blob 다운로드 수행.
- 실행: `python tools/tests/apuda-note-v3-unsaved-browser.py` (Python Playwright와 Chromium 설치 필요).
- 출처: PR #294의 `note-write-fence.js`, `note-unsaved-draft.js` 실코드를 불러오고, **가상 메모리 Map 저장소**에 연결한 격리형 시험실.
- 테스트 화면: `public-site/note/v3-unsaved-browser-lab.html`, 동작: `v3-unsaved-browser-lab.js`.
- 외부 인터넷/Google Drive/실제 브라우저 localStorage/IndexedDB/개인 기록: **접근 없음**.

## 실제 실행 결과
**Chromium 실브라우저 합성 테스트 13/13 PASS, 실패 0.** 
초기 메모리 비어 있음, 건강기록 충돌 경고, 최신 저장된 원문 불변, 미저장 수정 메모리 보존, Blob JSON 다운로드 발생, 파일 내용/검토 전용 형식 확인, 다운로드 후 보존 지속, 대화 충돌 경고, 최신 대화 원문 보존, 용량 오류 시 경고/원본 유지 등을 검증.

## 중요한 증거 한계
1. **실제 운영 V3 전체 앱의 DOM/이벤트 흐름을 자동 구동한 테스트가 아니다.** 사용자 입력·실제 두 창 공유 localStorage·응급 체크리스트·기기 백업/복원 버튼을 통과한 E2E라고 주장하지 않는다.
2. 이 화면의 저장소는 의도적으로 `Map`이다. `note-write-fence.js`의 두 단계 읽기/쓰기 사이에 구형 탭이 끼어드는 실제 TOCTOU 경합을 해결하지 않는다.
3. 실제 Android Chrome / iOS Safari, Service Worker 구버전 캐시, Google Drive 자동 백업과 사본 정리, 페이지 종료 시 미저장 데이터 손실 검사는 미수행(NT).
4. 검토 전용 JSON은 **암호화되지 않은 민감 건강정보를 담을 수 있어 안전한 위치에 사용자가 직접 보관**해야 한다. 다운로드 성공 확인은 파일 검증으로만 판단한다.
5. 자동 테스트와 개발 시험실을 배포 미리보기에서 실행하려면, Netlify Draft Preview 빌드 및 스크립트 로딩 여부를 별도 확인한다.

## 출시 판정
**P0 미해결, 운영 배포/병합 금지.** 구형 탭 저장을 막는 IndexedDB 트랜잭션 전환 전까지 운영 안전 승인을 내릴 수 없다. 기존 환자·논술 기록 및 실제 Google Drive 백업 무변경, Netlify 무료 요금제 유지.
