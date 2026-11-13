# ApuDa 실제 V3 화면 ↔ 개발용 IndexedDB 브리지 1차 연결 (2026-11-14)

대상: Draft PR #304, 통합 브랜치 integration/apuda-note-v3-v4-20261112. **운영 코드에는 연결하지 않음.**

## 기능과 범위
- public-site/note/v3-synthetic-live-bridge.js 는 기존 V3 HTML에 포함되지 않는다. Playwright 테스트에서만 명시적으로 주입한다.
- 루프백 127.0.0.1, __APUDA_V3_SYNTHETIC_BRIDGE_OPT_IN__ 플래그, 합성 localStorage fixture sentinel, 접두사가 제한된 합성 IndexedDB 이름 등 네 겹의 조건이 없으면 동작하지 않는다.
- 실제 V3 폼이 호출하는 save() 와 대화 큐의 commitChatRaw() 를 시험 환경에서 ApuDaV3SyntheticAsyncPort.saveBundle() 로 연결하여 건강기록과 대화를 한 트랜잭션에 저장한다.
- 초기 합성 localStorage 원문은 DB에 1회만 stage하며, 이후 기존 V3 localStorage 원문을 덮어쓰지 않는다. 새로고침 시 V3 로더까지 전환하는 완전한 영속 서비스가 아니다.
- 구형 탭은 여전히 localStorage를 쓸 수 있다(P0). 브리지는 storage 이벤트를 감지해 쓰기를 중단하고 검토용 JSON을 보존하지만, 구형 탭의 쓰기 자체를 막는 것은 아니다.
- 복원, 전체 삭제, Google Drive 백업과 prune은 이 브리지에 연결되지 않는다. 실사용 데이터 사용 절대 금지.

## Chrome 테스트
도구: tools/tests/apuda-note-v3-live-bridge-browser.py (새로운 localhost Chromium 브라우저 프로필·합성 데이터 전용).
- 실제 V3 프로필 폼의 저장을 합성 IndexedDB로 보내며, 노트·대화 원문을 같은 revision에 커밋하는지 검사
- 낡은 탭의 revision 충돌 거부·미저장 입력 보존
- 구형 V3 localStorage 쓰기가 여전히 가능하다는 P0 상황 재현과 브리지의 사후 중단
- 실제 V3 노트봇 연속 메시지 2건의 IDB 순서 보존, 원본 localStorage 미변경
- 외부 네트워크·Drive·Service Worker 차단, 생성한 합성 IndexedDB 삭제

## 배포 차단
실제 V3 boot/read, write, restore, recover, delete를 IDB로 모두 옮기고 구형 탭과 SW 캐시, Drive/백업 승인 정책을 정리해야 한다. Android/iOS 실기기·환자/보호자 검증도 필요하다.
**P0 OPEN / PR #304 Draft 유지 / main 병합 및 운영 배포 금지.**