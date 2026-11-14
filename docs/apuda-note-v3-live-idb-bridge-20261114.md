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
## 실제 GitHub Actions 검증 결과 (2026-11-14 KST)

- 테스트된 코드 SHA: ba2452bf6657cd676b88f3a2bd15d44bb0c95dcc.
- V3 전체 화면 84/84, V3 비동기 포트 21/21, 수정·삭제 78/78, 대화 저장 37/37 모두 통과: https://github.com/Mespital/ApuDa/actions/runs/43522388808
- V4 인계 15/15, V3↔V4 원문 격리 15/15, 원자적 note+chat bundle 20/20, **새 실제 V3 합성 IDB 브리지 27/27** 모두 통과: https://github.com/Mespital/ApuDa/actions/runs/43522388855
- 합계 **297/297 Chromium 단언 통과**, 별도 대화 정적 검증 15/15 통과. GitHub SEO·명암비 및 두 Netlify 개발 미리보기 빌드 성공.
- 테스트 환경은 임시 127.0.0.1 주소의 Chromium 격리 프로필이며 사용자 기록·학생 데이터·Google Drive에 접속하지 않았다. 시험 종료 시 합성 IndexedDB 삭제 완료.
- **P0를 재현한 결과**: 구형 탭이 기존 localStorage를 변경하는 것은 막지 못하며, 신규 브리지는 이를 감지한 후 쓰기를 동결하는 방식이다. 구형 탭의 마지막 쓰기를 원자적으로 예방하지 못한다.
- 신규 브리지 파일은 실제 note/index.html에서 로드되지 않으며, 운영 V3의 부팅 로더/복원/삭제를 IDB로 전환하지 않았다. 다시 로드하면 기존 V3 로더는 여전히 원본 localStorage를 사용한다.
- 최신 main 변경 28개 파일을 다른 코드 경로와 겹침 없이 통합 브랜치에 반영했고, 운영 main SHA 4bd7a09a1134af88ca82863d41a5d18e9fd1f2af 는 변경하지 않았다.

**최종 상태: 통합 Draft PR #304 유지 / P0 미해결 / 운영 main 병합 및 배포 금지.**
## 2026-11-14 KST — 합성 IndexedDB 부팅 복구·복원·삭제 안전성 추가

본 개발 브리지는 실제 V3 index.html에서 로드하지 않는다. 실사용 데이터 자동 이동 기능도 없다.

- legacyBaseline: 최초 합성 건강기록·대화 원문을 IndexedDB의 불변 기준값으로 보존하고, 다음 저장에서도 그대로 유지한다. 전체 삭제 tombstone에서는 이 기준값까지 제거한다.
- install(db): 새로고침 후 기존 IndexedDB를 읽고 현재의 구형 localStorage 원문과 최초 legacyBaseline이 정확히 일치할 때만 IDB 원문을 V3 화면/이전 대화에 재구성한다. 다르면 쓰기를 멈추고 오류를 반환한다.
- 저장 요청마다 localStorage 원문의 변화를 확인한다. 다만 구형 탭이 확인 직후에 쓰는 TOCTOU 경합까지 해결되는 것은 아니다.
- restoreSynthetic / recoverSynthetic / deleteSynthetic: 개발 브리지의 합성 컨트롤러에서만 동작한다. 명시적 승인과 독립 백업 확인 플래그가 부족하면 거부한다. 해당 플래그는 **진짜 독립 백업의 존재를 검증하지 않는다**.
- 삭제는 note/chat/legacyBaseline을 null로 만들고 revision을 증가시키는 tombstone을 사용한다. 새로고침 후에도 legacy 원문을 자동으로 살리지 않고 화면을 비운 상태로 쓰기를 동결한다.
- 실제 V3의 resetAll / importData / recoverBeforeRestore는 합성 브리지 활성 시험에서만 차단한다. 나머지 우회 경로·Service Worker·Drive 처리 완료를 뜻하지 않는다.

### 새 Chrome 테스트
tools/tests/apuda-note-v3-live-bridge-browser.py에 새로고침 후 IDB 부팅 재구성, 원문 보존, 승인 없는 복원/삭제 거부, 복원 후 되돌리기, 삭제 표식 후 새로고침, 구형 저장소 변경으로 인한 재접속 실패를 추가했다. 실제 GitHub Actions 실행 결과 확인 전에는 PASS라고 표시하지 않는다.

**P0 OPEN: 운영용 이전/부팅/복원/삭제 배포 불가. PR #304 Draft 유지, main 병합·운영 배포 금지. 실제 환자/학생/Drive 기록 접근 없음.**
