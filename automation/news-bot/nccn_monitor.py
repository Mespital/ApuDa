#!/usr/bin/env python3
import json, os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TZ=ZoneInfo("Asia/Seoul")
PATIENT_URL="https://www.nccn.org/patientguidelines"
CLINICAL_URL="https://www.nccn.org/guidelines/category_1"
UPDATES_URL="https://www.nccn.org/updates"
CANCERS=["유방암","폐암","위암","대장암","갑상선암","신장암","전립선암","췌장암","담도암","간암","림프종","자궁경부암"]

def main():
    repo=Path(os.getenv("APUDA_REPO_DIR",".")).resolve()
    outdir=repo/"public-site"/"news"/"data";outdir.mkdir(parents=True,exist_ok=True)
    now=datetime.now(TZ)
    items=[]
    for cancer in CANCERS:
        items.append({
            "cancer":cancer,
            "status":"link_only_policy",
            "version":None,
            "previous_version":None,
            "updated":False,
            "checked_at":now.isoformat(),
            "patient_url":PATIENT_URL,
            "clinical_url":CLINICAL_URL,
            "updates_url":UPDATES_URL,
            "source":"NCCN",
            "note":"환자용 공식 페이지를 기본 링크로 제공하며, NCCN 가이드라인 본문·PDF·알고리즘·표·그림·변경내용을 자동 수집하거나 저장·요약·재배포하지 않습니다."
        })
    payload={
        "version":"2.0",
        "generated_at":now.isoformat(),
        "policy_mode":"link_only_patient_first",
        "patient_url":PATIENT_URL,
        "clinical_url":CLINICAL_URL,
        "updates_url":UPDATES_URL,
        "items":items,
        "copyright_policy":"NCCN 콘텐츠 재사용 권한이 별도로 확인되기 전까지 ApuDa는 환자용 공식 페이지와 전문가용 공식 페이지 링크만 제공합니다.",
        "trademark_notice":"ApuDa는 NCCN과 제휴·후원 관계가 아닙니다. NCCN 관련 명칭은 공식 자료의 출처를 식별하기 위한 용도로만 사용합니다.",
        "automation_policy":"NCCN 가이드라인 본문/PDF/알고리즘/도표를 자동 수집하거나 AI 처리하지 않습니다. 최신 버전과 변경사항은 NCCN 공식 사이트에서 확인하도록 안내합니다."
    }
    (outdir/"nccn-monitor.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    # 버전 자동수집을 중단했으므로 기존 변경이력도 정책 안내 상태로 전환한다.
    history={
        "version":"2.0",
        "generated_at":now.isoformat(),
        "items":[],
        "policy_mode":"link_only_patient_first",
        "note":"NCCN 버전 변경 자동 추적은 권리정책 확인 전까지 중단했습니다. 최신 변경사항은 NCCN 공식 업데이트 페이지에서 확인합니다.",
        "updates_url":UPDATES_URL
    }
    (outdir/"nccn-history.json").write_text(json.dumps(history,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"nccn_guides":len(items),"policy_mode":"link_only_patient_first","updates":0,"history_events":0},ensure_ascii=False))

if __name__=="__main__":main()
