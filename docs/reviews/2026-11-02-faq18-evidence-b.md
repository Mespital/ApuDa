# 신규 18암종 FAQ 중 B군 6종 작성·근거 기록

확인일: 2026-11-02 (Asia/Seoul) · 버전 `20261102-corefaq-v1`

## 범위와 검토 모드

- AI 작성·근거 사전점검이며 실제 의료인 감수 기록은 없다. 모든 파일·문항의 `clinicalApproval`은 `pending`이다. 실제 환자·보호자 시험은 미실시이며 사용성 평가는 가설 단계다.
- 기존 30개 감수 역할을 실제 참여자로 집계하지 않았다. 본 범위의 두경부종양·피부종양·육종·신경종양·원발불명암 전문분야는 추가 실제 책임자 배정 대기로 적고, 기본 S01–S12 자리를 대체했다고 주장하지 않는다.
- 대상은 성인 환자·보호자의 진단 후 첫 30일 핵심 질문이다. 각 20문항, 진단·검사 / 치료 선택 / 치료 중 관리 / 생활·추적 각 5문항으로 구성했다.
- 약물 용량·개인 처방 변경·수치로 된 개인 예후·국내 허가/급여 판정을 작성하지 않았다. 외국 응급번호 999·111은 복제하지 않고 한국 독자의 심한 응급 상황은 119로 안내했다.
- NCI PDQ는 국가기관의 문헌 근거 요약이며 정식 국내 임상지침/허가/급여 기준을 대신하지 않는다. 원문을 그대로 번역·복제하지 않고 환자의 다음 질문에 맞춰 요약했다.

## 파일·범위·자체 구조 검증

| 파일 | 암종 | 문항 | 범위와 제한 |
|---|---|---:|---|
| `public-site/library/faq/data/laryngeal.json` | 후두암 | 20 | 성인 후두암의 첫 진단·치료 준비. 후두전절제의 호흡 안내는 전절제 환자에게만 적용하며 다른 두경부 암·소아암은 별도 평가. |
| `public-site/library/faq/data/nasopharyngeal.json` | 비인두암 | 20 | 성인 비인두암, 주로 비인두 상피암의 첫 진단·치료 준비. 비강·부비동암·구인두암·후두암과 구별. |
| `public-site/library/faq/data/melanoma.json` | 악성 흑색종 | 20 | 성인 피부 흑색종 중심. 점막·안구 흑색종 및 소아의 치료는 별도 평가하며 국내 약제 허가·급여를 판정하지 않음. |
| `public-site/library/faq/data/sarcoma.json` | 연부조직육종 | 20 | 성인 연부조직육종의 첫 진단·치료 준비. 골육종·소아육종·GIST·기타 특수 아형의 치료를 이 FAQ와 동일시하지 않음. |
| `public-site/library/faq/data/brain.json` | 성인 악성 뇌종양 | 20 | 성인 원발성 악성 뇌종양 중심. 미만성교종에만 적용되는 분자·치료·MRI 설명은 문항에 한정. 소아·양성 뇌종양·뇌전이·원발성 중추신경계 림프종은 별도 자료 필요. |
| `public-site/library/faq/data/cup.json` | 원발불명암 | 20 | 성인 원발불명암(CUP)의 진단 평가·치료 준비. 병리에서 다른 특정 암 계열이나 원발 부위가 확인되면 해당 진단의 지침으로 전환하며 한국 약제 허가·급여를 판정하지 않음. |

자체 구조 검사 결과: 6개 JSON 파싱, 총 120문항 순번·질문 ID 중복 없음, 카테고리별 5문항, sourceRefs가 존재하는 HTTPS 출처에 연결됨, 임상 승인 대기 유지. 이는 임상 승인이나 사용자 시험 통과를 의미하지 않는다.

## 임상 논리·안전 점검에서 고정한 주요 주장

| 암종·문항 | 주장·환자 의미 | 적용 한계와 근거 |
|---|---|---|
| 후두 Q6–9 | 전절제가 모든 후두암의 필수 치료는 아니며 암 조절과 음성·삼킴 기능을 함께 비교 | NCI 후두암 환자용, CUH 및 ASHA. 후두를 보존해도 기능 보존을 보장하지 않음 |
| 후두 Q9·13 | 전절제 후 원래 성대 발성 불가; 목의 영구 기공이 유일한 호흡 경로 | CUH·ASHA. 부분절제·일반 기관절개에 그대로 적용하지 않음. 독립 검토 P2 제안에 따라 Q9 표현 명확화 완료 |
| 비인두 Q2·4·16 | EBV 관련성과 드문 HPV 관련성을 구별, EBV DNA만으로 완치·재발 확정 금지 | NCI 비인두암 환자·의료인용. 조직형·진찰·영상과 함께 평가 |
| 비인두 Q6–10·17–18 | 방사선 중심의 병합치료, 청력·삼킴·구강·갑상선 추적 | NCI 비인두암 환자·의료인용, 구강합병증 환자용. 특정 약의 국내 허가·급여 단정 없음 |
| 흑색종 Q1·4–10 | 피부·안구·점막의 범위 구별, 두께·궤양·림프절을 고려, 감시림프절 양성 후 전부 절제 자동 적용 금지 | NCI 환자·의료인용. BRAF 결과만으로 치료 가능성을 보장하지 않음 |
| 흑색종 Q11·14 | 면역관문억제제 관련 장·폐·내분비 등 염증 증상 조기 연락 | NCI 장기 염증 안내. 자가면역질환·복용약을 공유하고 처방 임의 변경 금지 |
| 육종 Q3·5–10 | 전문 병리 검토, 등급/병기 구별, 계획된 생검, 절제면·기능과 추가 치료 고려 | NCI 성인 연부조직육종 환자용. 골육종·GIST·소아 육종에 요법을 그대로 적용하지 않음 |
| 뇌종양 Q1·3–5 | 원발성 악성 종양 범위, WHO 등급은 전이 병기와 다름, 미만성교종의 통합 분자진단·IDH-wildtype 교모세포종의 MGMT 예측 역할 구분 | NCI 환자용 + EANO WHO 2021 분자진단 지침(2023). 과거 통합지침의 옛 병리 용어를 현재 진단명으로 복제하지 않음 |
| 뇌종양 Q9·11–16 | 부종 완화는 항종양 효과와 구별, 첫/장시간 발작 응급, 스테로이드 임의 중단 금지, MRI 가성진행 가능 | CUH 스테로이드·NHS 뇌종양 증상·EANO 2021. 기관별 감량표와 재검 간격을 개인 처방으로 복제하지 않음 |
| CUP Q1–9·17 | 전이암 확인과 원발 미상 구별, 단서에 맞춘 검사, 특정 임상군/분자 표지에 따른 치료 가능 | NCI CUP 환자·의료인용. 무한 검사·치료 불가·모두 같은 항암치료로 단정하지 않음 |
| CUP Q12·18–20 | 완화의료 병행과 불확실성·환자 목표 정리, 단일 생존기간을 개인에게 대입하지 않음 | NCI CUP 및 완화의료. 개인 예후 숫자나 근거 없는 완치 약속 없음 |
| 공통 감염 문항 | 항암치료 중 38°C 이상 발열·심한 오한은 즉시 연락, 해열제 전 상담 | NCI Infection and Neutropenia. 각 병원이 준 발열 지침 우선, 저체온·정상 체온만으로 감염 배제하지 않음 |
| 공통 보조제 문항 | 고농도 보조제/한약 성분은 상호작용 가능, 표준치료 대체 금지 | NCI CAM·식품/보조제 상호작용. 식품 전체·한약 전체의 효과를 동일하다고 단정하지 않음 |

## 실제 열람한 출처 원장

각 URL은 작성 중 검색 결과에만 의존하지 않고 본문을 열람했다. `checkedAt`은 열람일이며 원문 최종 개정일을 임의로 만든 값이 아니다. 자료별 확인 범위는 아래와 문항의 `review.scope`에 기록했다.

| ID | 기관·제목 | 실제 URL | 확인 범위 | 도구 열람 ref |
|---|---|---|---|---|
| `asha-laryngectomy` | American Speech-Language-Hearing Association · Communication After Total Laryngectomy | https://www.asha.org/practice-portal/clinical-topics/head-and-neck-cancer/communication-after-total-laryngectomy/ | 후두전절제 후 음성 보철·전기후두·식도발성·보완대체 의사소통과 개별 재활 | `turn58view0` |
| `cuh-steroids` | Cambridge University Hospitals NHS Foundation Trust · Living with a brain tumour: Taking steroids | https://www.cuh.nhs.uk/patient-information/living-with-a-brain-tumour-taking-steroids/ | 종양 주변 부종 완화와 항종양 치료의 구별·스테로이드 임의 중단 위험. 이 기관의 구체 감량표는 일반화하지 않음 | `turn19view4` |
| `cuh-stoma` | Cambridge University Hospitals NHS Foundation Trust · Caring for a laryngeal stoma and voice prosthesis after a laryngectomy | https://www.cuh.nhs.uk/patient-information/caring-for-a-laryngeal-stoma-and-voice-prosthesis-after-a-laryngectomy/ | 후두전절제 후 영구 기공을 통한 호흡·의사소통·기공 관리·응급 호흡 경로 | `turn10view6` |
| `eano-glioma` | European Association of Neuro-Oncology; Nature Reviews Clinical Oncology (2021) · EANO guidelines on the diagnosis and treatment of diffuse gliomas of adulthood | https://pmc.ncbi.nlm.nih.gov/articles/PMC7904519/ | 미만성교종의 안전한 수술·생검·발작 약의 적응증·MRI 해석과 가성진행·재활. 현 분류 설명은 2023 분자진단 지침과 교차 확인 | `turn28view0` |
| `eano-molecular` | European Association of Neuro-Oncology; Neuro-Oncology (2023) · Molecular diagnostic tools for the WHO 2021 classification of gliomas, glioneuronal and neuronal tumors; an EANO guideline | https://pmc.ncbi.nlm.nih.gov/articles/PMC10547522/ | WHO CNS5의 조직·분자 통합진단, 미만성교종의 IDH·1p/19q 및 교모세포종 MGMT 검사 역할 | `turn25view0` |
| `nci-brain` | National Cancer Institute · Adult Central Nervous System Tumors Treatment (PDQ®)–Patient Version | https://www.cancer.gov/types/brain/patient/adult-brain-treatment-pdq | 성인 원발성 중추신경계 종양과 전이성 종양의 구별·영상·조직검사·치료·지지요법 | `turn10view4` |
| `nci-cam` | National Cancer Institute · Complementary and Alternative Medicine | https://www.cancer.gov/about-cancer/treatment/cam | 특정 식품·보조제가 암을 치료·재발 예방한다는 근거 부재와 표준치료 대체 금지 | `turn50view1` |
| `nci-cup` | National Cancer Institute · Carcinoma of Unknown Primary Treatment (PDQ®)–Patient Version | https://www.cancer.gov/types/unknown-primary/patient/unknown-primary-treatment-pdq | 원발부위 미상 암의 정의·조직검사·검사 선택·치료 결정 및 원발부위 확인 후 변화 | `turn10view5` |
| `nci-cup-hp` | National Cancer Institute · Cancer of Unknown Primary (CUP) Treatment (PDQ®)–Health Professional Version | https://www.cancer.gov/types/unknown-primary/hp/unknown-primary-treatment-pdq | 병리·분자검사와 치료 가능한 특정 임상군·국소치료 및 전신치료. 미국 허가를 한국 허가·급여로 해석하지 않음 | `turn19view0` |
| `nci-immune-inflammation` | National Cancer Institute · Organ-Related Inflammation and Immunotherapy | https://www.cancer.gov/about-cancer/treatment/side-effects/organ-inflammation | 면역관문억제제 관련 폐·장·내분비 등 염증 증상과 조기 의료진 연락 | `turn19view6` |
| `nci-infection` | National Cancer Institute · Infection and Neutropenia during Cancer Treatment | https://www.cancer.gov/about-cancer/treatment/side-effects/infection | 암 치료 중 38°C 이상 발열·오한 등 감염 신호와 즉시 연락, 해열제 복용 전 상담 | `turn19view1` |
| `nci-laryngeal` | National Cancer Institute · Laryngeal Cancer Treatment (PDQ®)–Patient Version | https://www.cancer.gov/types/head-and-neck/patient/adult/laryngeal-treatment-pdq | 후두의 부위·진단·병기·치료 선택·금연·추적관리 | `turn10view0` |
| `nci-melanoma` | National Cancer Institute · Melanoma Treatment (PDQ®)–Patient Version | https://www.cancer.gov/types/skin/patient/melanoma-treatment-pdq | 흑색종의 범위·두께·궤양·림프절과 병기·수술·전신치료·추적 | `turn10view2` |
| `nci-melanoma-hp` | National Cancer Institute · Melanoma Treatment (PDQ®)–Health Professional Version | https://www.cancer.gov/types/skin/hp/melanoma-treatment-pdq | 피부와 안구 흑색종의 차이·감시림프절·절제·고위험군 치료·BRAF 관련 치료 | `turn30view0` |
| `nci-mouth` | National Cancer Institute · Oral Complications of Cancer Therapies (PDQ®)–Patient Version | https://www.cancer.gov/about-cancer/treatment/side-effects/mouth-throat/oral-complications-pdq | 두경부 치료 전 치과 점검·구강건조·삼킴 곤란·영양·흡인 위험·재활 | `turn10view7` |
| `nci-nasopharyngeal` | National Cancer Institute · Nasopharyngeal Cancer Treatment (PDQ®)–Patient Version | https://www.cancer.gov/types/head-and-neck/patient/adult/nasopharyngeal-treatment-pdq | 비인두암 범위·EBV와 HPV의 차이·조직검사·병기·방사선 및 전신치료 | `turn10view1` |
| `nci-npc-hp` | National Cancer Institute · Nasopharyngeal Carcinoma Treatment (PDQ®)–Health Professional Version | https://www.cancer.gov/types/head-and-neck/hp/adult/nasopharyngeal-treatment-pdq?redirect=true | 비인두암의 EBV 관련성·치료 후 청력·삼킴·갑상선 기능 등 추적 항목 | `turn25view5` |
| `nci-pain` | National Cancer Institute · Cancer Pain (PDQ®)–Patient Version | https://www.cancer.gov/about-cancer/treatment/side-effects/pain/pain-pdq | 개별 통증 평가·기록·의료진과 관리 계획 수립 | `turn25view4` |
| `nci-palliative` | National Cancer Institute · Palliative Care in Cancer | https://www.cancer.gov/about-cancer/advanced-cancer/care-choices/palliative-care-fact-sheet | 진단 단계부터 항암치료와 함께 제공할 수 있는 증상·심리·가족 지지 | `turn25view3` |
| `nci-sarcoma` | National Cancer Institute · Soft Tissue Sarcoma Treatment (PDQ®)–Patient Version | https://www.cancer.gov/types/soft-tissue-sarcoma/patient/adult-soft-tissue-treatment-pdq | 성인 연부조직육종의 아형·계획된 생검·병리 재검·등급과 병기·국소 및 전신치료 | `turn10view3` |
| `nci-supplements` | National Cancer Institute · Cancer Therapy Interactions With Foods and Dietary Supplements (PDQ®)–Patient Version | https://www.cancer.gov/about-cancer/treatment/cam/patient/dietary-interactions-pdq | 건강보조제·한약 성분·식품 농축물과 항암제 상호작용 가능성, 약 목록 공유 | `turn19view5` |
| `nhs-brain-urgent` | NHS · Symptoms of a malignant brain tumour (brain cancer) | https://www.nhs.uk/conditions/malignant-brain-tumour/symptoms/ | 첫 발작·장시간 발작·갑작스럽고 극심한 두통·의식 저하 등 즉시 평가; 영국 응급번호를 한국에 옮기지 않음 | `turn19view2` |
| `nhs-breathlessness` | NHS · Shortness of breath | https://www.nhs.uk/symptoms/shortness-of-breath/ | 심한 호흡곤란·흉부 압박·갑작스러운 혼돈 등 즉시 평가가 필요한 호흡 관련 증상. 영국 응급번호를 한국에 그대로 적용하지 않음 | `turn68view0` |
| `nhs-melanoma` | NHS · What is melanoma skin cancer? | https://www.nhs.uk/conditions/melanoma-skin-cancer/what-is-melanoma-skin-cancer/ | 피부 흑색종과 자외선 노출·피부 보호; 모든 흑색종의 원인을 자외선으로 단정하지 않음 | `turn25view2` |
| `nhs-melanoma-symptoms` | NHS · Symptoms of melanoma skin cancer | https://www.nhs.uk/conditions/melanoma-skin-cancer/symptoms/ | 새 점·변하는 점·손발바닥·손발톱의 변화와 진료 필요 | `turn50view0` |

## 남은 검토와 제한

- 실제 해당 암종 전문의와 약사·간호사·언어/삼킴재활·신경재활 등 검토자는 미배정/검토 대기다. AI 독립 점검 결과는 부모 작업의 최종 보고서에서 별도로 통합한다.
- 의학적 오류가 확인되면 P0/P1으로 수정·재검하며, 이 자체 구조 검사로 의료 안전성 합격 점수나 감수 완료를 선언하지 않는다.
- 현재 범위에 병기별 세부 약물 선택·용량·국내 허가·보험 급여·생존율·실기기 사용자 연구가 포함되지 않는다. 불필요한 구체화를 피하고 담당 의료진 질문으로 연결했다.
- 작성 중 확인한 P2: 후두전절제 후 음성 소실을 완곡하게 표현한 Q9를 명확히 수정했고, ASHA 전문학회 자료를 추가했다. 육종 Q13 질문은 “폐 전이 때문인가요?”로 다듬었다.
- 기존 12암종 1,200문항·MINI/PDF·표지·영상·UI/배포 파일은 이 작성 담당자가 변경하지 않았다.

- 독립 검토 P2 추가 수정: brain Q5의 MGMT 예측 표지 적용 범위를 IDH 변이가 없는 교모세포종으로 한정했다. EANO 분자진단 지침 PMC10547522 근거와 일치하도록 수정 후 문장·scope를 재확인했다.
