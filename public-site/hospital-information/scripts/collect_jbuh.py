#!/usr/bin/env python3
"""Export oncology clinicians from JBUH public departmental medical teams.

Only collects pages allowed by robots.txt, with a direct official profile and
an explicit cancer diagnosis in the official 전문분야 cell.
"""
import argparse
import json
import re
import sys
import time
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs
import requests
from bs4 import BeautifulSoup
from collect_amc import REGEX, clean, clinical_role

HOST="https://www.jbuh.co.kr"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
# Verified hospital department IDs. Expand only after checking each official page.
DEPARTMENTS=("IMHO","IMPM","RT")
LIST_PATH="/prog/mdcl/main/sub01_01_01/viewStf.do?mdclCd={}"
def record(card,source,now):
    name_node=card.select_one(".dl-name")
    box=card.select_one(".dl-text-box")
    if name_node is None or box is None:
        return None
    name=clean(name_node.get_text(" ",strip=True))
    if not re.fullmatch(r"[가-힣]{2,5}",name):
        return None
    whole=clean(box.get_text(" ",strip=True))
    if "전문분야" not in whole:
        return None
    lead,_,tail=whole.partition("전문분야")
    specialty=clean(tail.split("외래진료일정")[0].split("진료특이사항")[0])
    department=clean(lead.replace(name,"",1))
    if not department or not specialty:
        return None
    cancer_codes=[code for code,pattern in REGEX.items() if pattern.search(specialty)]
    if not cancer_codes:
        return None
    profile=None
    for anchor in card.select('a[href*="mdclStfEmplNo="]'):
        href=urljoin(HOST,anchor.get("href",""))
        parsed=urlparse(href)
        query=parse_qs(parsed.query)
        if (parsed.scheme=="https" and parsed.hostname=="www.jbuh.co.kr"
            and parsed.path.startswith("/prog/mdclStf/")
            and re.fullmatch(r"\d{3,10}",query.get("mdclStfEmplNo",[""])[0])):
            profile=href
            break
    if not profile:
        return None
    role=clinical_role(department,specialty)
    if "혈액종양내과" in department:role="medical_oncology"
    if "방사선종양학과" in department:role="radiation"
    return {
      "doctor_name":name,"hospital_name":"전북대학교병원","region":"전북",
      "department":department[:400],"specialty_text":specialty[:650],
      "profile_url":profile,"verified_at":now,"status":"ACTIVE",
      "source_url":source,"verification_method":"official_department_explicit_specialty",
      "cancers":[{"code":c,"role":role} for c in cancer_codes]
    }
def collect():
    session=requests.Session()
    session.headers.update({"User-Agent":UA,"Accept":"text/html"})
    robots=session.get(HOST+"/robots.txt",timeout=18,allow_redirects=False)
    if robots.status_code!=200:raise RuntimeError("robots.txt inaccessible")
    rp=urllib.robotparser.RobotFileParser()
    rp.parse(robots.text.splitlines())
    generated=datetime.now(timezone.utc).isoformat(timespec="seconds")
    found={}
    coverage=[]
    for i,code in enumerate(DEPARTMENTS,1):
        url=HOST+LIST_PATH.format(code)
        if not rp.can_fetch(UA,url):raise RuntimeError("robots.txt disallows "+url)
        res=session.get(url,timeout=25,allow_redirects=False)
        if res.status_code!=200:raise RuntimeError(f"JBUH HTTP {res.status_code} for {code}")
        if urlparse(res.url).hostname!="www.jbuh.co.kr":
            raise RuntimeError("Off-domain redirect")
        soup=BeautifulSoup(res.text,"html.parser")
        blocks=soup.select(".doctor-list .dl-item")
        if not blocks:raise RuntimeError("Medical team HTML changed: "+code)
        matched=0
        for block in blocks:
            d=record(block,url,generated)
            if not d:continue
            matched+=1
            # Profile ID rather than name: different clinicians may share a name.
            key=parse_qs(urlparse(d["profile_url"]).query).get("mdclStfEmplNo",[""])[0]
            if key not in found:found[key]=d
            else:
                existing=found[key]
                seen={(x["code"],x["role"]) for x in existing["cancers"]}
                for link in d["cancers"]:
                    if (link["code"],link["role"]) not in seen:
                        existing["cancers"].append(link)
        print(f"JBUH[{i}/{len(DEPARTMENTS)}] {code} cards={len(blocks)} specialty_matched={matched}",file=sys.stderr,flush=True)
        coverage.append({"department":code,"cards":len(blocks),"matched":matched})
        if i<len(DEPARTMENTS):time.sleep(1.2)
    doctors=sorted(found.values(),key=lambda x:(x["doctor_name"],x["profile_url"]))
    if len(doctors)<5:raise RuntimeError("Unexpectedly few oncology profiles; refusing publication")
    return {"schema_version":1,"source":"전북대학교병원 공식 진료과 의료진 소개",
      "generated_at":generated,"count":len(doctors),"results":doctors,"coverage":coverage}
if __name__=="__main__":
    args=argparse.ArgumentParser()
    args.add_argument("--output",required=True)
    opt=args.parse_args()
    try:
        data=collect()
        destination=Path(opt.output)
        destination.parent.mkdir(parents=True,exist_ok=True)
        temp=destination.with_suffix(".tmp")
        temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        temp.replace(destination)
        print("JBUH_DONE",data["count"],file=sys.stderr)
    except Exception as e:
        print("JBUH_FAILED",type(e).__name__,str(e),file=sys.stderr)
        sys.exit(1)
