# 혈액종양 6종 핵심 FAQ — 근거·작성 점검 기록

- 기준일: 2026-11-02 (Asia/Seoul)
- 버전: `20261102-corefaq-v1`
- 범위: 성인 다발성골수종·AML·ALL·CML·호지킨림프종·PCNSL, 각 20문항, 합계 120문항.
- 모드: AI 근거·임상 논리·쉬운 글 사전점검. 실제 전문의 감수·환자/보호자 시험을 실시한 기록이 아니다.
- 임상 책임: `S11 교차 검토 필요 · 혈액종양(질환별 책임자 배정 대기)`. 실제 암종별 책임자 배정 및 해당 버전의 승인 자료 없음. 다른 S01–S10/S12 임상 내용과 기존 12종 100문항 FAQ는 이 하위 작업의 수정 범위 밖이다.
- 전 문항의 실제 전문의 승인 상태는 `pending`이며, AI 작성자는 전문의·약사·간호사 등의 신분을 주장하지 않는다.
- 각 JSON이 웹 FAQ에 사용하는 원문이다. UI·영상·기존 안내서 본문·Git 커밋·운영 배포는 이 하위 작업에서 변경하지 않았다.

## 원고 구조와 검증

각 암종 20문항은 진단·검사 5, 치료 선택 5, 치료 중 관리 5, 추적·진료 준비 5로 구성했다. 답변은 직접적인 첫 문장과 2–4문장의 설명·다음 행동을 중심으로 작성했다. 영어 약어는 필요한 범위에서 풀어 썼다. 질문별 `sourceRefs`와 `scope`, 확인일·기관·URL을 연결했으며 직접 복용량·중단/시작 지시·개인 생존기간·한국 급여 단정을 넣지 않았다.

| 암종 | 파일 | 문항 | 출처 항목 | 승인 상태 |
|---|---|---:|---:|---|
| 다발성골수종 | `myeloma.json` | 20 | 7 | 전문의 검토 대기 |
| 급성골수성백혈병 | `aml.json` | 20 | 8 | 전문의 검토 대기 |
| 급성림프모구백혈병 | `all.json` | 20 | 10 | 전문의 검토 대기 |
| 만성골수성백혈병 | `cml.json` | 20 | 8 | 전문의 검토 대기 |
| 호지킨림프종 | `hodgkin.json` | 20 | 6 | 전문의 검토 대기 |
| 원발성 중추신경계 림프종 | `pcnsl.json` | 20 | 8 | 전문의 검토 대기 |

중복 URL을 합치면 **31개 공식 원문/기관 자료**다. 아래 URL은 작성 과정에서 웹 검색과 열람으로 확인했다. 원문 확인일은 발행일 또는 최신 개정일과 다르다.

## 우선 안전 점검과 한계

| 항목 | 확인한 근거와 적용 범위 | 반영·제한 |
|---|---|---|
| MGUS·SMM·활동성 골수종 | IMWG 진단 기준 + NCI 의료인 요약 | 무증상이라는 이유만으로 무조건 경과관찰한다고 쓰지 않음. SMM 고위험군의 최근 치료 연구/허가를 한국의 자동 치료 대상으로 전용하지 않음. |
| 골수종 척수압박 | UCLH NHS 뼈 건강 + NHS 골수종 증상 | 새 다리 약화·보행/대소변 조절 변화는 응급 평가. 일률적 운동·마사지·다량 음수 지시 없음. |
| AML·APL의 긴급성 | NCI AML 환자/의료인 요약 + ELN APL 원문 | ‘첫 30일’은 치료 대기 기간이 아님. APL 의심은 응급이며 환자가 ATRA 등을 직접 시작하라는 복약 지시는 없음. |
| 성인 ALL | NCI + LLS 2024 성인 ALL 원문과 공식 HTML | 소아 예후 수치 전용 없음. B/T·BCR::ABL1·CNS 예방·관해 후 치료를 구별. |
| MRD | NCI AML/골수종 의료인 요약 + LLS 성인 ALL | 음성은 검출 한계 내 미검출이며 완치·위험 0%·임의 치료 종료로 설명하지 않음. |
| CML 분류 | ELN 2025 | WHO의 만성기/급성기 재분류와 다른 체계의 가속기 표현을 구별. CML은 BCR::ABL1 융합으로 정의되는 혈액암이라고 명료화. |
| CML 분자 추적 | ELN 2025 | IS 척도는 암세포 직접 비율이 아님. MMR 기준 BCR::ABL1 IS ≤0.1%를 정확히 기재. 한 번의 경미한 수치 증가를 즉시 실패로 단정하지 않음. |
| CML TFR | ELN 2025 | 첫 만성기·충분한 치료·지속된 깊은 분자반응·정밀 PCR 추적이 가능한 선별 환자만 전문팀과 검토. 자가 중단·일괄 중단 권고 없음. |
| TKI 병용약 | ELN 2025·Blood Cancer United·NLM 다사티닙 원문 | 위산 억제제·자몽 등의 문제는 약마다 다름. 특정 약의 복용법을 모든 TKI에 동일 적용하지 않음. |
| 호지킨림프종 PET | NCI 의료인 요약 | Deauville 기준은 단계·요법에 따라 다름. PET 단독으로 완치·실패·자가 감량을 판단하지 않음. |
| PCNSL 진단·스테로이드 | EHA–ESMO 2024 원문 + Cancer Research UK | 가능하면 생검 전 스테로이드 회피, 임상 악화 예외와 이미 처방받은 약의 임의 중단 금지를 함께 표시. |
| PCNSL 첫 치료·공고 | EHA–ESMO 2024 + NCI 의료인 요약 | HD-MTX 기반 유도치료를 중심으로 기술. 체력·신장 기능·인지 기능·반응에 따른 개별 공고이식/방사선 선택. NCI 환자판의 넓은 약물 나열을 일괄 1차 표준으로 전용하지 않음. |
| PCNSL HD-MTX 보조 관리 | eviQ ID 3535 + EHA–ESMO | 신장·혈중 농도·수분·보조약·병용약 확인의 원리만 기재. eviQ의 검토기한 경과 공지를 기록했으며 구체 수액량·검사 시간·구제약 용량은 환자 FAQ에 옮기지 않음. |
| 발열·출혈 | NCI 감염·출혈 안내 | 항암 중 38°C 이상 발열/심한 오한은 해열제 전 연락. 발열을 단순 B증상으로 넘기지 않음. 멎지 않는 출혈·중증 신경/호흡 증상에 신속한 평가 안내. |

의료 원문은 국제 임상근거이며 한국 식약처 허가·건강보험 급여·의료기관의 프로토콜을 증명하는 자료로 쓰지 않았다. 나라별 응급전화·운전 규정·지원제도는 외국 내용을 그대로 옮기지 않았다. 실제 환자의 처방·위험군·검사 결과를 평가한 자료가 아니다.

## 열람·출처 경로의 한계

- EHA–ESMO PCNSL의 PMC 주소는 한 번 CAPTCHA 안내가 반환되어 실제 내용 열람이 가능한 발행사 Wiley 원문을 사용했다. 2024년 7월 정오표도 확인했으며 저자 이름 철자 수정으로 임상 권고 변경은 아니었다.
- ELN ALL 2024 DOI 원문은 403으로 본문 열람이 되지 않아 그 문서를 근거 목록에 넣지 않았다. MRD는 실제 열람한 LLS 2024 성인 ALL PDF·진단 HTML로 확인했다. 해당 PDF는 독립검토자의 재열람에서 timeout이 있어 공식 치료 HTML을 추가 연결했다. HTML도 일부 후속 요청에서 403을 반환할 수 있어 PDF·NCI와 병행 연결했다.
- NICE NG234 권고는 검색 본문에서 확인했지만 직접 열람이 403이라 최종 참고문헌에는 넣지 않고, 실제 열람 가능한 NHS·UCLH의 골수종 척수압박 안내를 사용했다.
- NCI 환자판과 의료인판에서 치료 선택·분류 설명의 깊이와 갱신 시점 차이가 있어 최신 전문 권고와 교차 확인했다. 개별 원문의 모든 문장을 전부 감사했다는 주장은 하지 않는다.
- NCI의 공개 텍스트를 근거로 내용을 재구성했으며 NCI 로고·PDQ 상표·원문 이미지를 사용하지 않았다. 이는 NCI의 승인·보증 또는 공식 한국어 번역을 뜻하지 않는다.

## 실제 전문의에게 요청할 추가 검토

1. 각 질환별 첫 진단/이식/분자검사 문구가 한국 진료의 일반적인 설명에 맞는지 확인.
2. 환자 병원별 발열·출혈 연락 기준과 야간·휴일 경로를 실제 안내와 맞추기.
3. PCNSL 면역억제 관련 질환·고령/취약 환자·안구 단독 침범 등 예외 범위 재검.
4. 최신 고위험 SMM·성인 ALL 면역치료·CML TFR 등 변화가 빠른 분야의 국내 적용과 표현 재검.
5. 실제 환자·보호자가 약어, MRD/IS 수치, 응급 연락 문구를 이해하는지 사용자 시험.

점수·임상 승인·실제 참가자 성공률은 산출하지 않았다. 사용성에 대한 제안은 실제 참가자 검증 전 가설이다.

## 공식 출처 목록

1. **Primary CNS lymphoma (PCNSL)** — Blood Cancer UK
   - URL: https://bloodcancer.org.uk/understanding-blood-cancer/lymphoma/cns-lymphoma/
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: PCNSL과 전신 림프종의 2차 CNS 침범·다른 뇌종양 구별, 증상·진단·치료 후 생활과 반응
2. **Acute lymphoblastic leukemia (ALL) diagnosis** — Blood Cancer United(구 Leukemia & Lymphoma Society)
   - URL: https://bloodcancerunited.org/blood-cancer/leukemia/acute-lymphoblastic-leukemia-all/diagnosis
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 성인 ALL의 혈액·골수·면역표현형·유전자·MRD·뇌척수액 검사; 이전 LLS 주소에서 공식 이동
3. **Acute lymphoblastic leukemia (ALL) treatment** — Blood Cancer United(구 Leukemia & Lymphoma Society)
   - URL: https://bloodcancerunited.org/blood-cancer/leukemia/acute-lymphoblastic-leukemia-all/treatment
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 성인 ALL의 치료 단계·MRD·유지치료·이식 상담을 다루는 공식 HTML. 2024 환자용 PDF와 교차 연결하며 미국 허가를 한국 허가로 전용하지 않음
4. **Chronic myeloid leukemia (CML) treatment** — Blood Cancer United(구 Leukemia & Lymphoma Society)
   - URL: https://bloodcancerunited.org/blood-cancer/leukemia/chronic-myeloid-leukemia-cml/treatment
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: TKI 복약·임의 누락 및 추가 복용 방지, 음식·약물 지침, 환자별 약 선택과 장기 치료 상담. 미국 약 허가를 국내 허가로 해석하지 않음
5. **Primary central nervous system lymphomas: EHA–ESMO Clinical Practice Guideline for diagnosis, treatment and follow-up** — European Hematology Association / European Society for Medical Oncology
   - URL: https://onlinelibrary.wiley.com/doi/10.1002/hem3.89
   - 확인일: 2026-11-02 / 원문 표기일: 2024-06-04
   - 유형: `professional-clinical-guideline`
   - 사용 범위: 주로 면역기능이 보존된 성인 PCNSL: 조직 생검·가능하면 생검 전 스테로이드 회피와 임상 악화 예외, HD-MTX 기반 유도치료·개별 공고치료·신장/인지 기능·MRI 추적
6. **2025 European LeukemiaNet recommendations for the management of chronic myeloid leukemia** — European LeukemiaNet / Leukemia
   - URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC12310532/
   - 확인일: 2026-11-02 / 원문 표기일: 2025-07-11
   - 유형: `professional-clinical-recommendation`
   - 사용 범위: 성인 CML의 최신 분류·TKI 선택·국제척도 BCR::ABL1 분자반응·반응 추적·선별 환자의 치료 없는 관해·임신 계획
7. **Management of acute promyelocytic leukemia: updated recommendations from an expert panel of the European LeukemiaNet** — European LeukemiaNet / Blood
   - URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC6509567/
   - 확인일: 2026-11-02 / 원문 표기일: 2019-02-25
   - 유형: `professional-clinical-recommendation`
   - 사용 범위: APL 의심 단계부터 의료 응급으로 관리하고 진단 확정 전에도 전문팀이 응고 장애 대응·치료를 시작한다는 원칙. 환자가 직접 ATRA·수혈·기타 약을 시작하라는 지시로 옮기지 않음
8. **Cancer Therapy Interactions With Foods and Dietary Supplements (PDQ)–Patient Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/about-cancer/treatment/cam/patient/dietary-interactions-pdq
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 건강기능식품·허브·특정 음식과 항암제의 흡수·대사·배설 상호작용; 특정 제품의 안전성이나 국내 허가를 보장하지 않음
9. **Bleeding and Bruising (Thrombocytopenia) and Cancer Treatment** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/about-cancer/treatment/side-effects/bleeding-bruising
   - 확인일: 2026-11-02 / 원문 표기일: 2022-12-29
   - 유형: `official-patient-guidance`
   - 사용 범위: 혈소판 감소·출혈 징후, 멎지 않는 출혈·검은 변·의식 및 시각 변화의 의료진 연락, 진통제 등 약 확인
10. **Male Fertility and Cancer Treatment** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/about-cancer/treatment/side-effects/fertility-men
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 치료 전 생식력 상담·정자 보존, 항암·이식 등의 영향, 치료 긴급성에 따른 보존 시점의 개별 결정
11. **Female Fertility and Cancer Treatment** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/about-cancer/treatment/side-effects/fertility-women
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 치료 전 생식력 상담·난자/배아 보존, 항암·이식의 영향, 치료 긴급성에 따른 보존 시점의 개별 결정
12. **Infection and Neutropenia during Cancer Treatment** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/about-cancer/treatment/side-effects/infection
   - 확인일: 2026-11-02 / 원문 표기일: 2020-01-23
   - 유형: `official-patient-guidance`
   - 사용 범위: 암 치료 중 38°C 이상 발열·오한의 신속한 연락, 해열제로 감염 신호를 가리지 않기, 손 씻기·음식 위생
13. **Acute Lymphoblastic Leukemia Treatment (PDQ)–Health Professional Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/leukemia/hp/adult-all-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-evidence-summary`
   - 사용 범위: B/T 계열·면역표현형과 BCR::ABL1 검사, 표적·면역치료 및 이식 선택의 기본 원리
14. **Acute Myeloid Leukemia Treatment (PDQ)–Health Professional Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/leukemia/hp/adult-aml-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-evidence-summary`
   - 사용 범위: 염색체·유전자 위험군, 치료 강도·표적치료·동종이식 선택, MRD 포함 반응 평가와 종양용해 예방
15. **Acute Lymphoblastic Leukemia Treatment (PDQ)–Patient Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/leukemia/patient/adult-all-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 성인 ALL의 진단·빠른 진행·관해 유도·공고·중추신경계 예방과 치료 선택; 소아 예후 수치를 성인에게 전용하지 않음
16. **Acute Myeloid Leukemia Treatment (PDQ)–Patient Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/leukemia/patient/adult-aml-treatment-pdq
   - 확인일: 2026-11-02 / 원문 표기일: 2025-05-16
   - 유형: `official-patient-guidance`
   - 사용 범위: 성인 AML의 빠른 진행, 골수·혈액 진단, APL의 출혈·응고 응급성, 초기 치료·지지치료·추적
17. **Chronic Myeloid Leukemia Treatment (PDQ)–Patient Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/leukemia/patient/cml-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: CML의 진단·필라델피아 염색체·혈액/골수 검사와 표적치료·추적의 큰 흐름; 분류체계 차이는 ELN 2025로 보완
18. **Hodgkin Lymphoma Treatment (PDQ)–Health Professional Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/lymphoma/hp/adult-hodgkin-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-evidence-summary`
   - 사용 범위: 조직 진단·위험군·PET 반응과 치료 조정, 약제별 심폐·신경 독성 및 장기 영향, 재발 치료; 국제 선택지를 국내 허가·급여와 혼동하지 않음
19. **Primary Central Nervous System Lymphoma Treatment (PDQ)–Health Professional Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/lymphoma/hp/primary-cns-lymphoma-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-evidence-summary`
   - 사용 범위: 원발성과 전신 림프종의 CNS 침범 구별, HD-MTX 기반 유도치료·선별 환자의 공고이식·방사선의 인지 독성·재발 치료
20. **Hodgkin Lymphoma Treatment (PDQ)–Patient Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/lymphoma/patient/adult-hodgkin-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 성인 호지킨림프종 아형·조직검사·병기·B증상, 치료 선택·반응·추적의 큰 흐름
21. **Primary CNS Lymphoma Treatment (PDQ)–Patient Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/lymphoma/patient/primary-cns-lymphoma-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: PCNSL의 질환 범위·신경 증상·눈과 뇌척수액 평가·추적. 치료 선택의 구체적 우선순위는 전문 지침과 교차 확인
22. **Plasma Cell Neoplasms (Including Multiple Myeloma) Treatment (PDQ)–Health Professional Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/myeloma/hp/myeloma-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-evidence-summary`
   - 사용 범위: 진단과 위험군, 치료 필요성, 전신치료·자가이식·유지치료·반응 평가; 개인 처방이나 한국 급여 정보가 아님
23. **Plasma Cell Neoplasms (Including Multiple Myeloma) Treatment (PDQ)–Patient Version** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/types/myeloma/patient/myeloma-treatment-pdq
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 형질세포 질환·M단백·골수/혈액/소변 검사, 치료 단계·지지치료·추적의 큰 흐름
24. **Primary central nervous system lymphoma (PCNSL)** — Cancer Research UK
   - URL: https://www.cancerresearchuk.org/about-cancer/brain-tumours/types/lymphoma-brain
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 생검·스테로이드 시점·약물 기반 치료와 공고, 운전 및 일상·추적 상담. 영국 운전 규정을 한국에 전용하지 않음
25. **Management of high-dose methotrexate toxicity — ID 3535** — Cancer Institute NSW / eviQ
   - URL: https://www.eviq.org.au/clinical-resources/side-effect-and-toxicity-management/prophylaxis-and-treatment/3535-management-of-high-dose-methotrexate-toxicity
   - 확인일: 2026-11-02
   - 유형: `official-clinical-safety-resource`
   - 사용 범위: HD-MTX의 신장·혈중 농도 감시, 수분·구제요법 및 병용약 확인 원리만 사용. 문서의 2024 보완과 검토기한 경과 안내를 확인했으며 구체적 용량·시간·수액량·중단 지시는 환자 FAQ에 옮기지 않음
26. **Acute Lymphoblastic Leukemia in Adults — Revised 2024** — Leukemia & Lymphoma Society
   - URL: https://www.lls.org/sites/default/files/2024-05/PS33_AdultALL_2024_FINAL.pdf
   - 확인일: 2026-11-02
   - 유형: `official-patient-booklet`
   - 사용 범위: 성인·청년 ALL의 MRD 검출 한계, 다단계 치료와 유지치료, 종양용해 감시·지지치료·장기 추적. 약 허가·급여는 별도 확인
27. **Dasatinib — MedlinePlus Drug Information** — 미국 국립의학도서관(NLM) / American Society of Health-System Pharmacists
   - URL: https://www.medlineplus.gov/druginfo/meds/a607063.html
   - 확인일: 2026-11-02 / 원문 표기일: 2025-02-15
   - 유형: `official-patient-guidance`
   - 사용 범위: 다사티닙의 위산 억제제·제산제·자몽 및 병용약 확인, 임의 중단·추가 복용 방지의 구체적 예. 모든 TKI의 복용법을 동일하게 적용하지 않음
28. **IMWG Criteria for the Diagnosis of Multiple Myeloma** — International Myeloma Foundation / International Myeloma Working Group
   - URL: https://www.myeloma.org/international-myeloma-working-group-imwg-criteria-diagnosis-multiple-myeloma
   - 확인일: 2026-11-02
   - 유형: `professional-consensus-criteria`
   - 사용 범위: MGUS·무증상 골수종·활동성 골수종 구별과 CRAB/골수종 정의 생체표지자; 증상이 없어도 치료가 필요할 수 있다는 예외
29. **Symptoms of myeloma** — 영국 국민보건서비스(NHS)
   - URL: https://www.nhs.uk/conditions/myeloma/symptoms/
   - 확인일: 2026-11-02 / 원문 표기일: 2025-05-13
   - 유형: `official-patient-guidance`
   - 사용 범위: 갑작스러운 보행 장애·사지 감각 저하·배뇨배변 조절 이상·혼란의 응급 평가. 영국 연락번호를 한국 번호로 그대로 옮기지 않음
30. **Myeloma and bone health** — University College London Hospitals NHS Foundation Trust
   - URL: https://www.uclh.nhs.uk/patients-and-visitors/patient-information-pages/myeloma-and-bone-health
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 골수종 뼈 약화·골절·고칼슘혈증·척수압박, 뼈와 척추 보호를 위한 개별 치료·활동 상담

31. **NCI Dictionary of Cancer Terms — tumor lysis syndrome** — 미국 국립암연구소(NCI)
   - URL: https://www.cancer.gov/publications/dictionaries/cancer-terms/def/tumor-lysis-syndrome
   - 확인일: 2026-11-02
   - 유형: `official-patient-guidance`
   - 사용 범위: 빠른 혈액암 등의 치료 후 종양 세포 내용물 유출·혈액 화학 변화와 신장·심장·간 손상의 개념. 개별 예방약·수액량·치료 지시는 포함하지 않음

## 문항별 주장–근거 대응표

### 다발성골수종

| 문항 | 환자 질문 | 근거 ID | 대조 범위 |
|---:|---|---|---|
| 1 | 다발성골수종은 뼈암인가요, 혈액암인가요? | nci-myeloma-patient | 형질세포 혈액암과 뼈 병변의 관계·다른 암의 골전이와 구별 |
| 2 | MGUS나 무증상 골수종도 바로 항암치료를 하나요? | imwg-diagnosis, nci-myeloma-hp | MGUS·SMM·활동성 골수종 구별; 무증상=치료 불필요라는 단정 방지 |
| 3 | 골수검사와 혈액·소변검사를 함께 하는 이유는 무엇인가요? | nci-myeloma-hp, imwg-diagnosis | 진단용 골수·단백 검사와 장기 손상 평가의 상호 보완 |
| 4 | CRAB이나 SLiM이라는 말은 무엇인가요? | imwg-diagnosis | 장기 손상과 골수종 정의 생체표지자의 개념; 자가진단용 수치표 제공하지 않음 |
| 5 | 골수종 병기는 일반적인 암의 1~4기와 같은가요? | nci-myeloma-hp | 골수종의 병기·위험군과 개인 예후의 한계 |
| 6 | 첫 치료는 보통 어떤 순서로 진행되나요? | nci-myeloma-patient, nci-myeloma-hp | 유도·공고·유지치료의 큰 흐름과 개인별 차이 |
| 7 | 나이가 많으면 조혈모세포이식을 받을 수 없나요? | nci-myeloma-hp | 자가이식의 원리와 생물학적 적합성 평가; 연령만으로 일괄 배제하지 않음 |
| 8 | 증상이 좋아졌는데 유지치료를 계속하는 이유는 무엇인가요? | nci-myeloma-hp | 유지치료 목적과 반응·독성에 따른 개별 조정 |
| 9 | 뼈 통증은 항암치료만으로 관리하나요? | uclh-myeloma-bone, nci-myeloma-patient | 뼈 손상의 지지치료와 국소치료; 갑작스러운 통증의 신속한 평가 |
| 10 | 외국에서 소개된 새 약이 모두 제 치료에 가능한가요? | nci-myeloma-hp | 치료 차수·환자 조건과 국제 근거의 국내 적용 한계 |
| 11 | 허리 통증에 다리 힘 저하나 대소변 변화가 생기면 기다려도 되나요? | uclh-myeloma-bone, nhs-myeloma-symptoms | 골수종 관련 척수압박의 신경학적 응급 신호; 한국 응급 경로로 안내 |
| 12 | 물을 많이 마시면 신장 문제를 막을 수 있나요? | nci-myeloma-hp, nci-myeloma-patient | 골수종 관련 신장 손상·고칼슘혈증과 개별 수분 관리; 일률적 다량 음수 지시 금지 |
| 13 | 치료 중 열이 나면 해열제를 먹고 지켜봐도 되나요? | nci-infection, nci-myeloma-hp | 감염 위험·38°C 발열·오한·해열제 전 연락과 중증 증상 대응 |
| 14 | 한약이나 뼈에 좋다는 보충제를 함께 먹어도 되나요? | nci-interactions, nci-myeloma-hp | 보충제 상호작용과 신장·칼슘 상태에 따른 확인; 모든 제품의 독성 단정하지 않음 |
| 15 | 뼈가 약한데 운동을 해도 되나요? | uclh-myeloma-bone | 골수종 뼈 손상·골절 위험에 맞춘 활동 상담; 통증 악화 시 평가 |
| 16 | M단백이 줄면 완치되었다는 뜻인가요? | nci-myeloma-hp | 반응 평가 지표의 종합 해석과 M단백 단독 판단의 한계 |
| 17 | 미세잔존질환 검사에서 음성이면 추적을 끝내도 되나요? | nci-myeloma-hp | MRD 평가의 검출 한계와 지속 추적; 음성=완치 또는 임의 중단 아님 |
| 18 | 감염 예방 주사나 약을 누구나 똑같이 받나요? | nci-myeloma-hp, nci-infection | 골수종의 감염 예방 선택지와 환자별 차이; 일률적 약·접종 처방 금지 |
| 19 | 재발하면 처음 썼던 약은 다시 쓸 수 없나요? | nci-myeloma-hp, nci-myeloma-patient | 재발 치료에서 이전 노출·반응·독성·재사용 가능성의 개별 평가 |
| 20 | 첫 진료에서 가장 먼저 확인할 것은 무엇인가요? | nci-myeloma-hp, imwg-diagnosis, nci-infection | 첫 진단의 검사·치료 결정·안전 연락 준비를 원자료에서 종합 |

### 급성골수성백혈병

| 문항 | 환자 질문 | 근거 ID | 대조 범위 |
|---:|---|---|---|
| 1 | AML 진단을 받았는데 검사하며 한 달 정도 기다려도 되나요? | nci-aml-patient, eln-apl-emergency | AML의 빠른 진행과 APL 응급성; 안내서 제목으로 치료 지연 오해하지 않기 |
| 2 | 혈액검사만으로 AML을 확진할 수 있나요? | nci-aml-patient, nci-aml-hp | 혈액·골수·세포 및 유전 검사에 의한 확진과 단일 혈구 수치의 한계 |
| 3 | APL은 다른 AML과 무엇이 다른가요? | nci-aml-patient, nci-aml-hp, eln-apl-emergency | PML::RARA·APL의 아형별 치료와 의심 단계 출혈 응급성 |
| 4 | 유전자검사 결과를 치료 전에 확인하는 이유는 무엇인가요? | nci-aml-hp | AML의 분자·염색체 검사와 위험군·치료 선택; 검사 대기가 필수 응급 치료 지연을 뜻하지 않음 |
| 5 | AML도 1기부터 4기까지 나누나요? | nci-aml-patient, nci-aml-hp | AML 위험군·질환 상태 분류와 고형암 병기의 차이 |
| 6 | 첫 치료의 목표는 무엇인가요? | nci-aml-patient, nci-aml-hp | 관해 유도와 후속 치료·지지치료의 목표 및 평가 |
| 7 | 나이가 많거나 체력이 약하면 치료를 못 받나요? | nci-aml-hp | 치료 강도별 선택과 적합성·독성 평가; 고령=무치료 또는 저강도=무위험이라는 단정 방지 |
| 8 | 관해가 되었는데 공고치료를 왜 더 하나요? | nci-aml-hp, nci-aml-patient | 관해 후 공고치료의 목적과 위험·MRD·환자 상태에 따른 선택 |
| 9 | 조혈모세포이식은 모든 AML 환자가 받나요? | nci-aml-hp | 동종이식의 선택적 적용·위험과 이득·공여자 평가 |
| 10 | 치료 전에 임신·출산 계획을 이야기해도 되나요? | nci-fertility-men, nci-fertility-women, nci-aml-patient | 치료 전 생식력 상담과 급성백혈병 치료 긴급성의 균형 |
| 11 | 항암치료 중 38°C 이상 열이 나면 어떻게 하나요? | nci-infection | 38°C 발열·오한·해열제 전 연락과 중증 감염 증상 |
| 12 | 멍이나 코피가 생기면 어느 정도까지 알려야 하나요? | nci-bleeding, nci-aml-patient, eln-apl-emergency | 혈소판·응고 이상 관련 출혈 연락 기준과 APL의 고위험 맥락 |
| 13 | 수혈과 감염 예방약도 백혈병 치료의 일부인가요? | nci-aml-patient, nci-aml-hp | AML 지지치료의 수혈·감염 예방 및 치료; 개별 필요성 |
| 14 | 치료 초기에 신장 기능과 전해질 검사를 자주 하는 이유는 무엇인가요? | nci-aml-hp | 치료 초기 종양용해 위험과 신장·전해질 감시; 자가 수분·약 조정 지시하지 않음 |
| 15 | 한약·비타민이나 평소 먹던 약은 계속 복용해도 되나요? | nci-interactions, nci-bleeding | 약·보충제 상호작용과 출혈 위험 약물 검토; 임의 중단·추가 방지 |
| 16 | 관해와 완치는 같은 말인가요? | nci-aml-hp | 관해 기준·재발 가능성과 완치의 구별 |
| 17 | 미세잔존질환(MRD) 음성은 어떤 의미인가요? | nci-aml-hp | MRD의 방법·시점·검출 한계와 후속 치료 의사결정 |
| 18 | 퇴원 후 바로 일상생활을 해도 되나요? | nci-infection, nci-bleeding, nci-aml-patient | 외래 추적과 잔여 감염·출혈 위험에 맞춘 일상 복귀 |
| 19 | 두 번째 의견을 듣거나 임상시험을 상담해도 되나요? | nci-aml-patient, nci-aml-hp | 두 번째 의견·임상시험 상담과 급성 질환의 치료 지연 방지 |
| 20 | 환자와 보호자가 첫 달에 기록할 것은 무엇인가요? | nci-aml-hp, nci-infection, nci-bleeding | 치료·반응·증상 기록의 실용적 종합; 긴급 연락 우선 |

### 급성림프모구백혈병

| 문항 | 환자 질문 | 근거 ID | 대조 범위 |
|---:|---|---|---|
| 1 | 성인 ALL은 소아 백혈병과 같은 치료·예후로 보면 되나요? | nci-all-patient, lls-adult-all-2024 | 성인 범위와 소아 자료·예후의 부적절한 일반화 방지 |
| 2 | B세포형과 T세포형은 어떻게 구분하나요? | bcu-all-diagnosis, nci-all-hp | B/T 계열 및 면역표현형에 따른 성인 ALL 아형 구분 |
| 3 | 필라델피아 염색체나 BCR::ABL1은 왜 확인하나요? | nci-all-hp, bcu-all-diagnosis | BCR::ABL1/Ph 양성 여부가 치료 선택에 미치는 의미; 양성=단일 처방 아님 |
| 4 | ALL에도 1기부터 4기까지 병기가 있나요? | nci-all-patient, bcu-all-diagnosis | ALL의 고형암 병기 부재와 질환 상태·위험 평가 |
| 5 | 왜 허리에서 뇌척수액을 검사하나요? | bcu-all-diagnosis, nci-all-patient | CNS 검사·척수강 내 치료의 목적과 시술 전 출혈 위험 고려 |
| 6 | ALL 치료는 왜 여러 단계로 나뉘나요? | lls-adult-all-2024, nci-all-patient, bcu-all-treatment | 성인 ALL의 다단계 치료 목적과 프로토콜별 차이 |
| 7 | 뇌 검사에 이상이 없어도 중추신경계 예방치료를 하나요? | nci-all-patient, bcu-all-diagnosis | CNS 예방치료의 목적과 방법; 일률적 뇌 방사선 오해 방지 |
| 8 | 표적치료나 면역치료가 있으면 항암치료를 안 해도 되나요? | nci-all-patient, nci-all-hp, bcu-all-treatment | 바이오마커·치료 단계에 따른 표적·면역치료의 역할; 단일약으로 항암 일괄 대체한다는 단정 방지 |
| 9 | 성인 ALL이면 반드시 동종이식을 하나요? | lls-adult-all-2024, nci-all-hp, bcu-all-treatment | MRD·위험군·적합성에 따른 동종이식의 선택적 적용 |
| 10 | 치료가 급한데 생식력 보존을 상담할 시간이 있나요? | nci-fertility-men, nci-fertility-women, nci-all-patient | 치료 전 생식력 상담과 ALL의 치료 긴급성 |
| 11 | 열이나 오한이 있으면 어느 때 연락하나요? | nci-infection | 호중구 감소 관련 감염·38°C 발열·오한과 해열제 전 연락 |
| 12 | 치료 초기에 종양용해증후군을 감시하는 이유는 무엇인가요? | lls-adult-all-2024, nci-tumor-lysis | ALL 치료 초기 TLS의 기전·장기 위험·의료진의 예방 및 감시 |
| 13 | 구강 출혈이나 멍이 늘면 어떻게 해야 하나요? | nci-bleeding | 혈소판 감소 관련 출혈 연락 기준과 약물 확인 |
| 14 | 집에서 감염을 줄이려면 무조건 모든 음식을 제한하나요? | nci-infection | 손 위생·충분한 가열·안전한 보관과 환자별 음식 지침; 일률적 식품 배제 금지 |
| 15 | 먹는 유지치료약은 몸이 괜찮으면 쉬어도 되나요? | lls-adult-all-2024, bcu-all-treatment | 유지치료의 필요성과 복약 문제 발생 시 의료진 확인; 개인별 용량 지시하지 않음 |
| 16 | 관해가 되었다는 말은 어떤 검사 결과를 뜻하나요? | nci-all-patient, lls-adult-all-2024, bcu-all-treatment | 성인 ALL 관해와 완치·혈구 정상화의 구별 |
| 17 | 미세잔존질환(MRD) 음성이면 백혈병 세포가 0개인가요? | lls-adult-all-2024, bcu-all-diagnosis, bcu-all-treatment | MRD 검사 방법·검출 한계와 음성 후 치료·추적의 필요 |
| 18 | 첫 치료 뒤 MRD가 남으면 바로 치료 실패인가요? | lls-adult-all-2024, bcu-all-treatment | MRD 양성의 시점·검사 해석과 후속 치료 검토; 환자별 확정 실패 판정 아님 |
| 19 | 치료가 끝난 뒤에도 장기 추적이 필요한가요? | lls-adult-all-2024, nci-all-patient, bcu-all-treatment | 성인 ALL의 재발·치료 후 영향에 대한 장기 추적 |
| 20 | 첫 달에 가족과 어떤 정보를 함께 정리하면 좋을까요? | bcu-all-diagnosis, lls-adult-all-2024, nci-infection | 성인 ALL 진료 준비 항목의 실용적 종합; 환자의 의사결정 존중 |

### 만성골수성백혈병

| 문항 | 환자 질문 | 근거 ID | 대조 범위 |
|---:|---|---|---|
| 1 | CML은 급성백혈병과 어떻게 다른가요? | nci-cml-patient, eln-cml-2025 | BCR::ABL1 관련 CML과 급성백혈병의 구별·만성=무치료 오해 방지 |
| 2 | BCR::ABL1 양성이면 자녀에게 유전되나요? | nci-cml-patient, eln-cml-2025 | 후천적 필라델피아 염색체 변화와 가족 유전의 구별 |
| 3 | 혈액검사와 골수검사를 함께 하는 이유는 무엇인가요? | eln-cml-2025, nci-cml-patient | 초기 골수·염색체·분자 진단과 후속 추적의 기준 확보 |
| 4 | 만성기·가속기·급성기라는 말은 어떻게 이해하나요? | eln-cml-2025 | WHO의 이분법 재분류와 다른 분류체계·가속기 용어의 차이 |
| 5 | 정상 백혈구 수가 되면 CML이 없어진 건가요? | eln-cml-2025 | 혈액학적 반응과 분자반응의 구별·치료 및 PCR 추적 필요 |
| 6 | 먹는 표적치료제 TKI는 어떤 역할을 하나요? | eln-cml-2025, bcu-cml-treatment | TKI의 표적·치료 역할과 약제별 차이·복약 원칙 |
| 7 | 여러 TKI 중 어떤 약을 고르는 기준은 무엇인가요? | eln-cml-2025, bcu-cml-treatment | 동반질환·개인 목표·위험을 고려한 TKI 선택; 최신약 우월성 일반화 금지 |
| 8 | 약을 한 번 빠뜨렸거나 먹고 토하면 두 배로 먹나요? | bcu-cml-treatment, medlineplus-dasatinib | TKI의 추가 복용·임의 누락 방지와 환자별 복약 확인 |
| 9 | 부작용이 있으면 약을 쉬어도 되나요? | eln-cml-2025, bcu-cml-treatment | TKI 독성 관리와 의료진에 의한 조정·임의 누락 방지 |
| 10 | CML은 조혈모세포이식을 바로 받아야 하나요? | eln-cml-2025, nci-cml-patient | TKI 중심 치료와 진행·저항성에 따른 선택적 동종이식 |
| 11 | TKI 복용 중 새로 숨이 차거나 가슴이 아프면 어떻게 하나요? | eln-cml-2025 | TKI별 심폐·혈관 이상 가능성과 원인 감별·중증 증상의 응급 평가 |
| 12 | CML 치료 중에도 발열·감염에 주의해야 하나요? | nci-infection, eln-cml-2025 | 치료 관련 혈구 감소·감염 위험과 발열·오한 연락 기준 |
| 13 | 자몽·건강기능식품·위장약도 확인해야 하나요? | bcu-cml-treatment, nci-interactions, eln-cml-2025, medlineplus-dasatinib | TKI별 음식·보충제·병용약 상호작용과 약제별 복용 조건 |
| 14 | 임신을 계획하거나 임신 가능성이 생기면 어떻게 하나요? | eln-cml-2025, nci-fertility-men, nci-fertility-women | 성별·치료 반응에 따른 임신 계획과 즉시 전문 진료 연계; 일괄 임의 중단 지시하지 않음 |
| 15 | 첫 달에 왜 혈액검사·장기 기능 검사를 자주 하나요? | eln-cml-2025 | 초기 혈구·장기 기능 및 TKI별 동반질환·독성 감시 |
| 16 | BCR::ABL1 PCR 결과의 퍼센트는 암세포 비율인가요? | eln-cml-2025 | 국제척도 BCR::ABL1 분자량의 의미와 암세포 직접 비율과의 구별 |
| 17 | 주요분자반응(MMR)은 무슨 뜻인가요? | eln-cml-2025 | BCR::ABL1 IS ≤0.1% MMR 정의·완치/중단과의 구별 |
| 18 | PCR 수치가 한 번 조금 오르면 약이 안 듣는 건가요? | eln-cml-2025 | 분자반응 변동의 추세·개인 상황별 해석과 저항성 추가 평가 |
| 19 | 언젠가 TKI를 끊고 지내는 것이 가능한가요? | eln-cml-2025 | 선별된 첫 만성기 환자의 TFR·지속 DMR·정밀 추적·재시작 계획 필수 |
| 20 | 장기 치료를 위해 어떤 기록을 남기면 좋을까요? | eln-cml-2025, bcu-cml-treatment | 복약·분자 추적·환자 목표에 맞춘 장기 진료 준비 |

### 호지킨림프종

| 문항 | 환자 질문 | 근거 ID | 대조 범위 |
|---:|---|---|---|
| 1 | 호지킨림프종과 비호지킨림프종은 같은 병인가요? | nci-hodgkin-patient, nci-hodgkin-hp | 호지킨·비호지킨 구별과 호지킨 아형별 진단·치료 차이 |
| 2 | 멍울 검사에 조직을 충분히 떼어 내야 하는 이유는 무엇인가요? | nci-hodgkin-patient, nci-hodgkin-hp | 충분한 조직·절제 생검 선호와 진단 불확실성에 따른 추가 평가 |
| 3 | B증상은 무엇이며 치료 중 열과 어떻게 구분하나요? | nci-hodgkin-hp, nci-infection | B증상의 정의·다른 원인 감별; 치료 중 발열을 질환 증상으로 단정하지 않기 |
| 4 | 호지킨림프종 4기는 무조건 말기라는 뜻인가요? | nci-hodgkin-patient, nci-hodgkin-hp | 림프종 병기와 완치 지향 치료의 관계; 병기만으로 개인 예후·말기 확정하지 않음 |
| 5 | 치료 전에 PET-CT와 심장·폐 검사를 하는 이유는 무엇인가요? | nci-hodgkin-hp | 초기 범위·반응 기준선 및 약제별 장기 기능 평가 |
| 6 | 첫 치료는 보통 어떤 방식으로 하나요? | nci-hodgkin-patient, nci-hodgkin-hp | 아형·병기·위험군·환자 상태에 따른 복합 치료 선택 |
| 7 | 항암치료 뒤 방사선치료도 반드시 받아야 하나요? | nci-hodgkin-hp | 반응·위험군에 따른 방사선 선택과 재발 위험·장기 독성의 균형 |
| 8 | 중간 PET-CT가 좋아지면 약을 줄여도 되나요? | nci-hodgkin-hp | 중간 PET에 따른 요법별 반응 적응 치료; 자가 감량·중단 방지 |
| 9 | 치료 전에 생식력 보존을 상담해야 하나요? | nci-fertility-men, nci-fertility-women, nci-hodgkin-hp | 치료 전 생식력 상담과 요법·방사선·이식별 영향, 시점의 개별 판단 |
| 10 | 처음부터 조혈모세포이식을 준비해야 하나요? | nci-hodgkin-patient, nci-hodgkin-hp | 초기 치료와 재발·불응성 치료에서 조혈모세포이식의 위치 |
| 11 | 치료 중 열이나 심한 오한이 나면 어떻게 하나요? | nci-infection, nci-hodgkin-hp | 항암 중 감염 발열·오한과 B증상 혼동 방지·중증 증상 대응 |
| 12 | 새로 마른기침이나 숨참이 생기면 지켜봐도 되나요? | nci-hodgkin-hp, nci-infection | 호흡기 증상과 일부 치료약의 폐 독성·감염 감별; 응급 악화 시 대응 |
| 13 | 손발 저림은 참아야 하는 부작용인가요? | nci-hodgkin-hp | 일부 치료약의 말초신경 독성과 조기 보고·의료진에 의한 치료 조정 |
| 14 | 중심정맥관 주변이 붉거나 아프면 어떻게 하나요? | nci-infection | 카테터 관련 국소 감염 징후와 연락·교육된 관리 방법 |
| 15 | 건강식품이나 한약을 함께 먹어도 되나요? | nci-interactions | 식품·농축 보충제·허브와 항암치료 상호작용 및 제품별 확인 |
| 16 | PET-CT의 도빌 점수는 제가 직접 해석해도 되나요? | nci-hodgkin-hp | Deauville 반응 평가의 요법·시점별 차이와 PET 단독 판단의 한계 |
| 17 | 관해 뒤에는 매번 PET-CT를 찍어야 하나요? | nci-hodgkin-hp | 관해 후 추적의 개별화와 반복 PET의 위양성·방사선 노출 |
| 18 | 치료를 마치고 오래 지나도 추적이 필요한 이유는 무엇인가요? | nci-hodgkin-hp, nci-fertility-men, nci-fertility-women | 치료 종류에 따른 장기 영향·이차암 및 생식력 추적; 일률적 검진 일정 제시하지 않음 |
| 19 | 새 멍울이나 야간 발한이 생기면 재발인가요? | nci-hodgkin-patient, nci-hodgkin-hp | 재발 의심 증상의 비특이성·진찰·필요시 재생검 |
| 20 | 첫 달에 환자와 보호자가 함께 준비할 것은 무엇인가요? | nci-hodgkin-hp, nci-infection, nci-fertility-men, nci-fertility-women | 초기 호지킨림프종 진료 준비와 안전·생식력 상담의 종합 |

### 원발성 중추신경계 림프종

| 문항 | 환자 질문 | 근거 ID | 대조 범위 |
|---:|---|---|---|
| 1 | 뇌에 생겼는데 왜 혈액암이라고 하나요? | nci-pcnsl-hp, bcuuk-pcnsl | PCNSL의 림프종 기원·질환 범위와 다른 뇌종양·2차 CNS 침범 구별 |
| 2 | MRI에서 림프종이 의심되면 확진된 것인가요? | eha-esmo-pcnsl-2024 | 조영 MRI와 조직 생검 중심 확진·영상 감별 및 생검 불가능 시 예외 |
| 3 | 조직검사 전에 스테로이드를 조심하는 이유는 무엇인가요? | eha-esmo-pcnsl-2024, cruk-pcnsl | 가능하면 생검 전 스테로이드 회피·진단 영향·임상 악화 예외; 임의 중단 금지 |
| 4 | 뇌 병변인데 전신 PET-CT나 다른 검사는 왜 하나요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | 전신 질환 배제에 의한 PCNSL/SCNSL 구별과 치료계획 |
| 5 | 눈 검사나 뇌척수액 검사가 필요한가요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | 안과·CSF 평가와 요추천자 금기·안전 조건의 개별 판단 |
| 6 | PCNSL의 첫 약물치료에서 메토트렉세이트가 중요한가요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | HD-MTX 기반 유도치료의 위치와 신장·체력 등에 따른 적합성·조합 차이 |
| 7 | 뇌종양을 크게 떼어 내는 수술부터 하지 않나요? | eha-esmo-pcnsl-2024, cruk-pcnsl | 일반적인 생검·약물 중심 접근과 급성 뇌압 상승 등 선택적 수술 예외 |
| 8 | 영상에서 좋아졌는데 공고치료를 더 하는 이유는 무엇인가요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | 유도 후 공고치료 목적과 자가이식·방사선 등 선택의 개인화 |
| 9 | 나이가 많으면 고용량 치료나 이식은 모두 불가능한가요? | eha-esmo-pcnsl-2024 | 생물학적 적합성·동반질환·동적 이식 적합성 평가; 연령 단독 배제 금지 |
| 10 | 눈에도 림프종이 있으면 치료가 달라지나요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | 눈 침범 평가·전신/국소치료와 신경계 추적의 연계 |
| 11 | 치료 중 열이나 오한이 나면 어떻게 하나요? | nci-infection, nci-pcnsl-patient | 치료 중 감염 위험·발열·오한과 해열제 전 연락·중증 증상 평가 |
| 12 | 갑자기 말을 못 하거나 마비·경련이 생기면 기다려도 되나요? | nci-pcnsl-patient, eha-esmo-pcnsl-2024 | 새 급성 신경학적 증상의 원인 불확실성과 신속한 응급 평가 |
| 13 | HD-MTX 치료 때 신장 검사와 약물 농도를 자주 확인하나요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp, eviq-hdmtx-toxicity | HD-MTX 신장 기능·배설·보조관리의 중요성; 정확한 용량·수액량 지시하지 않음 |
| 14 | 평소 약이나 건강기능식품도 치료팀에 알려야 하나요? | nci-interactions, eha-esmo-pcnsl-2024, eviq-hdmtx-toxicity | 병용약·보충제 검토와 HD-MTX 신장 상태·스테로이드 등 임의 변경 방지 |
| 15 | 기억력이나 성격이 달라지면 가족은 어떻게 도와야 하나요? | nci-pcnsl-patient, eha-esmo-pcnsl-2024 | 인지·행동 변화와 신경인지 기능 평가·재활 및 급성 변화 감별 |
| 16 | 치료 반응은 MRI 하나로만 판단하나요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | MRI와 임상·스테로이드·침범 부위의 종합 반응 평가 |
| 17 | PCNSL은 일반 림프종처럼 1~4기로 이해하면 되나요? | nci-pcnsl-patient, nci-pcnsl-hp, eha-esmo-pcnsl-2024 | PCNSL 범위·전신 배제 평가와 일반 병기표의 부적절한 전용 방지 |
| 18 | 전뇌방사선치료는 모든 환자가 받아야 하나요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | WBRT의 선택적 적용과 신경인지 독성·대안·개인 요인 |
| 19 | 재발하면 처음 치료를 다시 하거나 새 표적약을 쓰나요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp | 재발 시 이전 반응·기간·적합성에 따른 선택과 국내 허가·급여의 구별 |
| 20 | 첫 달에 어떤 내용을 우선 확인하고 기록하나요? | eha-esmo-pcnsl-2024, nci-pcnsl-hp, nci-infection | PCNSL 초기 진단·치료·반응 평가와 인지·가족 지원·안전 연락 준비의 종합 |

## 작성자 사전점검 동결 기록

동결 시각: 2026-11-02T10:59:32.029266+09:00. 6개 JSON 120문항의 순번·중복 질문·카테고리·참조 키·전문의 승인 대기 상태를 확인했다. 별도 AI 독립 검토자의 용어 명료화 제안(M단백, CML 정의) 및 ALL HTML/TLS 원문 보강을 반영했다. 실제 임상 승인으로 전환하지 않았다.

| 파일 | 문항 | SHA-256 |
|---|---:|---|
| `myeloma.json` | 20 | `c84ed2da041af5a6049c856812ca646433f50757dd42c2ac2abad69bf96b7d06` |
| `aml.json` | 20 | `3fb9b06d6d50edb7e48dc5e623771c78bf88adb3b08591315a5badf7c91bc505` |
| `all.json` | 20 | `767592f6235d903ae4667a2bd68302bbe864a8619a6307195eae8e03de833c63` |
| `cml.json` | 20 | `19286440395c6332c1345ea2e76e1f05b7fdd2fdfc438ed14d37c030a48a74a1` |
| `hodgkin.json` | 20 | `6dd6c321d24af7d2ff438f7a87a5b64afcee657b48ef9e5f5888eefa6cd9ab49` |
| `pcnsl.json` | 20 | `49d75777611a464086777ce07615f0960520e120fbf7d27eb6b41fe5c23fe2cb` |
