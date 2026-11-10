# ApuDa 환자 수첩 V4 확장 데이터 모델 설계 초안

- 작성 기준: 2026-11-10, 한국시간
- 변경 범위: V3 원본을 손실 없이 표현하기 위한 **별도 메모리 내 데이터 모델**
- 구현: `public-site/note-v4/v4-extended-draft.js`
- 시험: `tools/tests/apuda-note-v4-extended-draft.cjs` (가상 환자 자료만 사용)
- 상태: **개발·AI 기술 사전점검 완료, 실서비스 이전·기록 저장·승인 아님**

## 핵심 결정

운영 V3 기록을 기존 V4 체험판의 `records[]`·`questions[]`로 직접 변환하지 않는다. 현 V4 체험판의 체온 단일값, 질문 3개 제한, 200자 메모, 식사 4개 범주는 V3의 여러 시각 체온·질문 객체·자유 메모·식사 백분율을 전부 담지 못한다.

새 구조는 원본 아카이브(Archive: 원문 보관본)와 읽기용 정규화 뷰(View: 보기 편하게 재배열한 데이터)를 **함께** 가진다. 아직 저장을 하지 않고, 원문과 뷰를 다시 계산해 대조할 수 있어야 한다.

## 구조 계약

| 필드 | 형태 | 보존 원칙 |
|---|---|---|
| `format` | `apuda.note.v4.extended-draft` | 운영 V4 저장 형식과 구별 |
| `schemaVersion` | `1` | 초안 포맷 버전(운영 스키마 버전 아님) |
| `status` | `proposal-not-imported` | 아직 이전하지 않았다는 상태 |
| `readyForProduction` | `false` | 운영 출시 가능 표시 금지 |
| `canWriteToV4` | `false` | 실제 저장 권한 없음 |
| `sourceArchive` | V3 원문·SHA-256·바이트 수·감사 결과 | 원본 JSON을 UTF-8 바이트 단위로 보존 |
| `view.profile` | V3 기본정보 복제 | 진단명·병원·요법·기타 원문 유지 |
| `view.days[]` | V3 `logs[]`와 1:1 대응 | 같은 날짜의 서로 다른 기록도 합치지 않음 |
| `view.questions[]` | V3 질문 객체 전량 | 3개 제한·답변/우선순위 삭제 금지 |
| `view.medications[]` | 약 기록 | 복용량·일정 임의 수정 금지 |
| `view.laboratoryResults[]` | 혈액검사 등 | 값과 단위, 특히 `unknown` 그대로 보존 |
| `view.appointmentsAndCarePlan[]` | 예약·치료계획 | 실제 예약과 참고 일정을 임의 병합 금지 |
| `view.support`, `distress`, `medicationChecks`, `emergencyChecks`, `metadata` | 원본 복제 | 정서·돌봄·체크·메타정보 유지 |
| `view.extensions` | 기타 최상위 필드 | 정의되지 않은 필드를 버리지 않음 |

`view.days[]`의 각 기록에는 `sourceIndex`(원래 배열 순서), `legacyId`, `date`, `author`와 다음 항목을 함께 둔다.

- `temperature`: 최근값과 최고값을 별도로 표시하고, `readings[]`에 측정 당시 원래 값·시각을 모두 보존한다. 별도의 V3 `temp` 필드에 측정 시각이 없으면 시각을 만들어 넣지 않는다.
- `pain.rawScore`: 문자열 `"0"`과 빈 문자열 `""`의 차이를 유지한다.
- `meal.rawPercent`: `"0"`부터 `"100"`까지 기존 백분율 원문을 보존하고 `mappedCategory:null`로 자동 범주화를 금지한다.
- `note`: 길이 제한 없이 V3 전체 원문을 유지한다.
- `authorStatus`: 작성자가 없으면 `unverified`, 표시용 `author:null`로 처리한다.
- `sourceRecord`: 미정의 필드까지 기록 하나 전체를 복제하여 보관한다.

## 검증 API 및 차단

```js
const draft = await ApuDaV4ExtendedDraft.build(explicitSyntheticV3JSON);
const result = await ApuDaV4ExtendedDraft.verify(draft);
const originalText = await ApuDaV4ExtendedDraft.originalJSON(draft);
// result.valid === true
// result.canWriteToV4 === false
```

1. `build`: 명시적으로 전달된 V3 JSON/백업만 받아 기존 검증기와 SHA-256 검사를 통과한 경우 메모리 내 초안을 구성한다.
2. `verify`: 원문 지문·크기·감사 목록을 검증하고 뷰를 원문에서 **다시 계산**해 비교한다. 질문 삭제, 최고 체온 변경, 원본 바이트 변조 등은 실패한다.
3. `originalJSON`: 검증에 성공한 원본 텍스트만 반환한다. 원본에 공백·줄바꿈이 있더라도 그대로 유지한다.
4. 입력 최대 크기는 기존 V3 백업 제한인 **16MiB**를 따른다.
5. 현재 어떤 화면에서도 이 모듈을 자동 로드하지 않으며, 저장소·외부 API·구글 드라이브를 사용하지 않는다.

## 미해결 차단 조건

| 우선순위 | 남은 작업 | 담당 검토 관점 |
|---|---|---|
| P0 | 실제 기록을 자동 변환하지 않는 사용자 동의·취소·되돌리기 설계 | D05·D06 |
| P0 | 기존 기록 교체 전 독립 백업과 복원 가능성·원본 해시 검증 | D05·D06 |
| P0 | V4 운영 UI와 저장소가 이 확장 구조를 완전히 수용하도록 개발·검증 | D01·D05 |
| P1 | 복수 체온·질문 무제한·길이 긴 메모·작성자 미확인 화면 검증 | D03·D04·M03 |
| P1 | 검사 단위 미상·약력·처방/예약 구분 표시 검토 | M03·M04 |
| NT | Android/iOS 실기기, 브라우저 종료·용량 초과, 개인정보 영향평가 | D05·D06 |
| NT | 실제 환자 6명·보호자 2명 시험 | P01–P06·C01–C02 |

실제 전문의 12명(S01–S12) 및 기타 감수 인력의 참여·승인 증거는 현재 없다. 이번 작업은 기술 영역의 AI 사전점검이며, 개별 암종 의료 내용 승인이나 앱 전체 100점 평가로 확장할 수 없다.

### 범위 밖 보호

- V3 운영 키 `apuda_cancer_care_v1` 및 별도 채팅 키 `apuda_note_chat_v1`은 변경·조회하지 않는다. 후자는 V3 본문 백업에 포함되지 않을 수 있어 별도 이전 범위 확정이 필요하다.
- 자녀 논술 기록과 `public-site/nonsul/`은 변경하지 않는다.
- Netlify 요금제·배포 설정·운영 `main` 브랜치는 변경하지 않는다.
- **SHA-256은 암호화가 아니다.** 실제 건강정보 원문을 담은 객체를 로깅·원격 전송·평문 자동 저장해서는 안 된다.

## 다음 개발 단계

확장 모델을 운영 저장소에 연결하지 않은 상태로, 먼저 읽기 전용 렌더러와 가상 자료 기반의 320px/200% 확대·키보드·화면낭독기 검증을 마친다. 이후 사용자 승인형 백업/복원·정합성 비교·롤백(되돌리기) 절차를 별도 브랜치에서 구현하고, 운영 배포는 검증 자료와 명시적 승인 후 판단한다.
