# ApuDa 합성 수첩: 복원·삭제 전 JSON 파일 왕복 검증 (2026-11-16)

대상: 통합 Draft PR #304, 경로 public-site/note/v3-synthetic-live-bridge.js 및 실제 Chromium 브라우저 회귀시험.
범위는 오직 127.0.0.1 가상 데이터와 합성 IndexedDB이다. 운영 V3 index.html에는 로드되지 않는다.

## 기존 약점
이전 restoreSynthetic / recoverSynthetic / deleteSynthetic 메서드는 userConfirmed/independentBackupVerified라는 단순 불리언 승인 플래그만으로 실행할 수 있었다. 플래그만으로 백업 파일의 존재, 파일 내용의 온전함, 현재 기록과의 일치, 파일의 독립적 영구 보관을 증명할 수 없다.

## 새 개발용 파일 검증 절차
1. downloadSyntheticBackup(): 확인된 IndexedDB 수정번호(revision)의 정확한 V3 note/chat 문자열과 수정번호를 담은 비암호화 JSON 파일을 명시적으로 내려받는다. reviewOnly=true, readyForProduction=false를 기록한다.
2. 내용은 SHA-256 지문으로 보호한다. 이는 무결성 검사이며 디지털 서명, 위변조 공격자에 대한 인증, 외부 저장소 보존 증거는 아니다.
3. verifySyntheticBackupFile(File): 별도로 선택한 JSON File 객체를 재파싱하고 포맷·파일 크기·필수 필드·note/chat 유효성·SHA-256을 검사한다. 현재 IndexedDB snapshot과 정확히 동일한 revision, 원문을 갖는지 IDB를 다시 읽어서 확인한다.
4. 검증 후 생성된 일회성 세션 토큰을 가진 경우에만 restore/recover/delete를 허용한다. 기존 명시적 승인 플래그는 여전히 요구한다. 각 작업 성공 후 토큰은 소진된다.
5. 잘못된 파일, 손상된 SHA, 오래된 revision, 구형 탭 localStorage 변경, 신규 저장 성공은 토큰을 무효화한다. 삭제 표식(tombstone) 이후 새 파일의 생성을 금지한다.

## 실제 파일 왕복 시뮬레이션
tools/tests/apuda-note-v3-live-bridge-browser.py는 실제 V3 HTML에 브라우저 테스트용 버튼과 파일 선택 입력을 임시 부착한다. Playwright expect_download()로 JSON 내려받기 이벤트를 확인해 별도 임시 디렉터리에 저장하고, set_input_files()로 같은 파일을 다시 선택하여 검증한다. 의도적으로 수정한 JSON, 이전 revision 백업, 재사용된 승인 파일, 백업 없는 삭제도 시험한다.
이것은 **실제 파일 다운로드·재선택·내용 확인의 개발용 리허설**이지만, 사용자가 파일 앱이나 별도의 기기에 독립 백업을 영구 저장했는지 증명하지 않는다.

## 남은 P0
- 운영 V3 앱은 localStorage에 기록을 쓰고 구형 탭은 새 계약을 모른다. 이 로컬 루프백 브리지는 운영 화면의 복원·삭제를 변경하지 않는다.
- 브라우저/기기의 데이터 소실에 대비한 독립 저장매체·백업 파일 존재 보증, 서비스 워커 캐시, 구형 탭 차단, Google Drive 정책, 모바일 실기기 테스트가 필요하다.
- 건강 정보가 들어갈 수 있는 다운로드 JSON은 **비암호화**이다. 환자의 진짜 기록으로 이 테스트를 하지 않는다.
- 실제 의사/환자/보호자 검증도 수행하지 않았다.

**P0 미해결 / Draft PR #304 유지 / main 병합 및 운영 배포 금지**.

실제 CI 결과는 해당 SHA의 GitHub Actions 완료 로그로 확인 후 별도 추가한다.