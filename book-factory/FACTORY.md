# ApuDa 책공장 운영 매뉴얼 (공장장 = Claude 예약 작업)

이 문서는 예약 작업이 **매 실행마다 처음부터 끝까지 따르는 절차**다. 실행은 무인이다. 질문하지 말고 끝까지 진행한다.

## 0. 위치
- 저장소: GitHub `Mespital/ApuDa`, **브랜치 `book-factory`** 의 `book-factory/` 폴더 (main에 커밋하지 않는다 — 사이트 배포와 분리)
- Google Drive 본부: 「ApuDa 책공장 (첫 30일 30권)」 `1i1XGW6O_c1HGmeF7lyrTkVKB_zq8jVgP`
  - 결재함(Google Doc): `1KUAvCsDzkv-NJGvPFDIIZSB8mG8vK-uBsrAiUgCvDBA`
  - 01_ChatGPT에 붙일 지시: `1jh71Nz5h59q2og4pby5z1kNhlB45hRki`
  - 02_공장 보고서: `1R7vLBniPej2QngoVcK3nLL2M1gZwVih2`
  - 09_시스템: `1zkZn7jNNBRBGTTSCke5zsd4QVFvZyo3q` (공장 키트 원본, 채팅 검수 결과 `*_검수결과*`)

## 1. 준비
1. `git clone` 후 `book-factory` 브랜치로 체크아웃(없으면 main에서 만들기).
2. `book-factory/state.json`이 없으면 **부트스트랩**: Drive 09_시스템 폴더의 파일(파일명 접두어 `kit__`, 이중 밑줄 `__`는 폴더 구분 `/`)을 내려받아 `book-factory/` 아래 같은 경로로 복원.
3. `state.json`, `standards/01_총괄작업지시서.md`, `standards/02_ChatGPT_오토파일럿.md`를 읽는다.
4. **중복 실행 잠금** (2026-11-21 16시대에 두 실행이 같은 장을 동시에 써서 추가):
   - `book-factory/RUNNING.json`이 있고 `started`가 50분 이내면 → 다른 실행이 진행 중. 작업하지 말고 `reports/daily/`에 "중복 실행 건너뜀" 한 줄 보고만 남기고 끝낸다.
   - 없거나 50분이 지났으면 → `{"started": "<UTC 시각>", "session": "<세션 id>"}`로 만들어 **즉시 커밋·push**(작업 시작 전). push가 거절되면 fetch 후 다시 판정.
   - 작업을 마치는 마지막 커밋에서 `RUNNING.json`을 지운다. 글 작업 직전과 push 직전에 `git fetch`로 원격이 앞섰는지 확인하고, 앞섰으면 원격을 따르고 이미 된 작업은 다시 하지 않는다.

## 2. 입력 수집
1. **결재함**: 결재함 문서를 텍스트로 내려받아 `[결재 기록]` 아래 줄 중 `state.json`의 `inbox.last_line` 이후 새 줄만 처리. 명령:
   - `G1|G2|G3 승인 {코드}` → 다음 단계로 진행, status=ready
   - `G1|G2 수정|반려 {코드}: 내용` → 같은 단계 재작업, 내용을 history와 다음 지시에 반영
   - `완료 {코드}` → ChatGPT 단계 끝. status=waiting, waiting_on="대표: PDF를 Claude 채팅에 올려 검수"
   - `우선 {코드}` / `보류 {코드}` → order 맨 앞 / status=hold
   - `{코드} 심화 카드로|새로 그려`, `메모: …` → 반영 후 보고서에 답
   - 해석 안 되는 줄은 보고서 「확인 필요」에 그대로 옮기고 건너뜀
2. **채팅 검수 결과**: 09_시스템 폴더에서 `inbox.last_review_time` 이후 생성된 `*_검수결과*` 파일을 읽어 해당 권의 stage/status/다음 지시에 반영.
3. 처리 후 `inbox.last_line`, `inbox.last_review_time` 갱신.

## 3. 작업 (한 실행의 작업량 상한)
`order` 순서로 훑어 status=ready인 권을 처리한다. 동시 진행 상한: Claude 글 작업 2권, ChatGPT 대기 `state.json`의 `wip_limit.chatgpt_art`(2026-11-22 대표 지시로 10). S3에 도착한 권은 상한 안에서 바로 S3 지시를 발행한다(S1 §3 캐릭터 + §4 EP 장면 + S2 편집 메모의 대사 수정 반영).

| 단계 | 담당 | 이번 실행에서 할 일 | 산출물 (book-factory/volumes/{NN}{코드}/) |
|---|---|---|---|
| S1 | Claude | 권별 지시서 1권 완성: 목차 6부·장 목록, EP20 주제·삽입 위치, **EP별 4컷 칸 장면 설명**, FAQ 100 질문 목록, 캐릭터 고정 블록 | `S1_지시서.md` → stage=G1, waiting_on=대표 |
| S2 | Claude | 본문 원고 최대 6장 (골든샘플 3장 먼저) | `S2_원고_vX.md` (장 추가) — 30장 다 차면 S3 |
| S3 | ChatGPT | 지시 블록 생성: 오토파일럿 [B]+[C] + 캐릭터 고정 + EP 장면 설명 | `S3_ChatGPT지시.md` + Drive 01 폴더에 같은 내용 Google Doc |
| S4 | Claude | apuda-review-team 감수 1회 → 심각·중대 반영 v+0.1 | `S4_감수보고서.md`, 원고 갱신 → stage=G2 |
| S5 | Claude | FAQ100·용어·워크북·부록 중 1블록 | `S5_*.md` |
| S6 | ChatGPT | 조판 지시 블록 (LC v23 구조, 원본 재출력 규칙, 자동 점검 9항목) | `S6_ChatGPT지시.md` + Drive 01 |
| S7_fix | ChatGPT | 검수 결과의 수정 지시를 블록으로 | `S7_ChatGPT지시.md` + Drive 01 |

- ChatGPT 단계에 들어간 권은 status=waiting, waiting_on="대표: Drive 01의 {파일명}을 ChatGPT에 붙여넣고 '계속'".
- 기존 원고가 있는 권(③~⑫, ⑬⑭㉖㉗)은 S1에서 기존 자료 위치를 저장소·Drive에서 찾아 재사용한다. 못 찾으면 「확인 필요」에 적고 새로 설계.

## 4. 팔로업
- 대표 대기 48시간 초과 → 보고서 맨 위 「밀린 결재」.
- ChatGPT 대기 72시간 초과 → 「ChatGPT 재촉」: 그 채팅에 보낼 한 줄 재개 문구 제공.
- 30권 전체 진행률(단계별 권수)과 이번 주 완료 예상을 매 보고서에 표시.

## 5. 보고·저장
1. 보고서: `book-factory/reports/daily/YYYY-MM-DD_HHMM.md` + Drive 02 폴더에 같은 내용 Google Doc(제목 `YYYY-MM-DD HH시 책공장 보고`).
   구성: ① 대표 할 일(번호 매김, 각 1줄, 링크) ② 이번 실행에서 한 일 ③ 30권 진행표 ④ 밀린 결재·확인 필요
2. `state.json` 갱신(각 권 history에 이벤트 추가, updated 시각).
3. 커밋 작성자 `ApuDa <opdivo@gmail.com>`, 메시지 `책공장 YYYY-MM-DD HH: 요약`, `book-factory` 브랜치에 push (충돌 시 fetch 후 rebase).
4. **마지막 응답**(푸시 알림으로 감): 첫 줄 `[책공장] 대표 할 일 N건`, 이어서 할 일 목록만 짧게, 한국어 반말.

## 6. 하드룰
- 의학: 근거 없는 수치·효능 주장, 진단·처방 단정 금지, 추정은 "추정". 발열 38.0°C, 약 용량 미기재. 실제 전문의 서면감수 전임을 판권에 표기.
- `book-factory/` 밖의 파일, main 브랜치, 자동발행 파이프라인(텔레그램·인스타·유튜브)의 cron·토큰은 건드리지 않는다.
- 외부 발송·게시·결제 없음. Drive에는 새 파일 생성만 하고 기존 파일 삭제·덮어쓰기 안 함.
- 한 실행에서 못 끝낸 일은 state에 남기고 다음 실행으로 넘긴다. 실패해도 보고서는 남긴다.
