#!/usr/bin/env python3
"""Merge separately verified sources into the only public directory snapshot."""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse
BASE=Path(__file__).resolve().parent.parent/"data"
CODES=set(json.loads((BASE/"cancers.json").read_text(encoding="utf-8"))[i]["code"] for i in range(30))
ROLES={"diagnosis","surgery","medical_oncology","radiation","endoscopy","transplant","car_t"}
def valid(d,now):
    if not d or d.get("status")!="ACTIVE":return False
    if not (d.get("doctor_name") and d.get("hospital_name") and d.get("verified_at")):return False
    try:
        u=urlparse(d.get("profile_url") or "")
        if u.scheme!="https" or not u.hostname or u.username or u.password:return False
        date=datetime.fromisoformat(d["verified_at"].replace("Z","+00:00"))
        if date.tzinfo is None:date=date.replace(tzinfo=timezone.utc)
        age=now-date
        if age>timedelta(days=180) or age<timedelta(days=-1):return False
    except Exception:return False
    return bool(d.get("cancers")) and any(
        x.get("code") in CODES and x.get("role") in ROLES for x in d["cancers"] if isinstance(x,dict)
    )
def merge():
    now=datetime.now(timezone.utc)
    unique={}
    count_by_source={}
    for filename in ("vps-verified.json","amc-verified.json","snubh-verified.json","jbuh-verified.json","smc-verified.json"):
        source=BASE/filename
        if not source.exists():
            count_by_source[filename]=0
            continue
        payload=json.loads(source.read_text(encoding="utf-8"))
        if payload.get("schema_version")!=1 or not isinstance(payload.get("results"),list):
            raise RuntimeError(f"Invalid source snapshot: {filename}")
        count_by_source[filename]=len(payload["results"])
        for d in payload["results"]:
            if not valid(d,now):continue
            # stable profile is authoritative, and same name/hospital can be a name collision
            key=(d["hospital_name"].strip(),d["profile_url"].split("&searchHpCd=")[0])
            item={
              "doctor_name":str(d["doctor_name"])[:40],
              "hospital_name":str(d["hospital_name"])[:80],
              "region":str(d.get("region") or "")[:40],
              "department":str(d.get("department") or "")[:400],
              "specialty_text":str(d.get("specialty_text") or "")[:650],
              "profile_url":d["profile_url"],
              "verified_at":d["verified_at"],"status":"ACTIVE",
              "cancers":[{"code":x["code"],"role":x["role"]} for x in d.get("cancers",[])
                if isinstance(x,dict) and x.get("code") in CODES and x.get("role") in ROLES]
            }
            if d.get("source_url"):item["source_url"]=d["source_url"]
            if d.get("verification_method"):item["verification_method"]=d["verification_method"]
            if key not in unique:unique[key]=item
            else:
                old=unique[key]
                matches={(x["code"],x["role"]) for x in old["cancers"]}
                for x in item["cancers"]:
                    if (x["code"],x["role"]) not in matches:
                        old["cancers"].append(x)
    records=sorted(unique.values(),key=lambda d:(d["hospital_name"],d["doctor_name"],d["profile_url"]))
    result={"schema_version":1,"source":"ApuDa reviewed official medical institution directories",
            "generated_at":now.isoformat(timespec="seconds"),
            "count":len(records),"results":records}
    dst=BASE/"verified-specialists.json"
    dst.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("MERGE",count_by_source,"public_unique",len(records))
if __name__=="__main__":
    try:merge()
    except Exception as e:print("MERGE_FAILED",repr(e),file=sys.stderr);sys.exit(1)
