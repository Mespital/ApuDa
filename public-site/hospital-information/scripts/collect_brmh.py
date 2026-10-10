#!/usr/bin/env python3
"""Boramae official oncology directory with real individual physician popup links."""
import argparse
import json
import re
import sys
import time
import urllib.robotparser
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import quote,urlparse
import requests
from bs4 import BeautifulSoup
from collect_amc import REGEX, clean, clinical_role

HOST="https://www.brmh.org"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
# Explicitly verified public clinical departments. No guessed specialty routes.
DEPARTMENTS=[
("001035000","혈액종양내과"),
("001023000","외과"),
("001011000","산부인과"),
("001010000","비뇨의학과")
]
def medical_record(node,source,stamp):
    head=node.select_one("li.doctor_top_right")
    if head is None:return None
    heading=head.select_one("p.doctor_name")
    button=head.select_one("a.btn_detail[onclick]")
    if not heading or not button:return None
    span=heading.select_one("span")
    if not span:return None
    dept=clean(span.get_text(" ",strip=True))
    raw=clean(heading.get_text(" ",strip=True))
    name=raw.replace(dept,"",1).replace("자세히 보기","").strip()
    if not re.fullmatch(r"[가-힣]{2,5}",name):return None
    text=clean(head.get_text(" ",strip=True))
    if "자세히 보기" not in text:return None
    specialty=text.split("자세히 보기",1)[1].strip()
    if not specialty:return None
    mapped=[code for code,regex in REGEX.items() if regex.search(specialty)]
    if not mapped:return None
    clicked=button.get("onclick","")
    match=re.search(r"openDoctorView\(\s*'(\d+)'\s*,\s*'(\d{9}\|\d{9})'\s*,\s*'view'\s*\)",clicked)
    if not match:return None
    physician_id,dept_code=match.groups()
    url=HOST+"/custom/popup/layer_doctor_view.do?dt_no="+physician_id+"&medi_code="+quote(dept_code,safe="")
    role=clinical_role(dept,specialty)
    return physician_id,{
       "doctor_name":name,"hospital_name":"서울특별시보라매병원","region":"서울",
       "department":dept,"specialty_text":specialty[:650],"profile_url":url,
       "source_url":source,"verification_method":"official_department_explicit_specialty_and_detail_popup",
       "verified_at":stamp,"status":"ACTIVE",
       "cancers":[{"code":code,"role":role} for code in mapped]
    }
def collect():
    session=requests.Session()
    session.headers.update({"User-Agent":UA,"Accept":"text/html"})
    robots=session.get(HOST+"/robots.txt",timeout=18,allow_redirects=False)
    if robots.status_code!=200:raise RuntimeError("Boramae robots.txt not verifiable")
    rp=urllib.robotparser.RobotFileParser();rp.parse(robots.text.splitlines())
    stamp=datetime.now(timezone.utc).isoformat(timespec="seconds")
    doctors={};coverage=[]
    for i,(code,deptname) in enumerate(DEPARTMENTS,1):
        source=HOST+"/medical/medi_doctor_info.do?mcode="+code
        if not rp.can_fetch(UA,source):raise RuntimeError("Source disallowed in robots.txt")
        r=session.get(source,timeout=28,allow_redirects=False)
        if r.status_code!=200:raise RuntimeError(f"Official Boramae HTTP {r.status_code} {source}")
        if urlparse(r.url).hostname!="www.brmh.org":raise RuntimeError("Unexpected official hospital host")
        soup=BeautifulSoup(r.text,"html.parser")
        cards=soup.select("div.doctor_info_inner")
        if not cards:raise RuntimeError("Medical list HTML changed for "+code)
        matched=0;checked_profile=False
        for card in cards:
            row=medical_record(card,source,stamp)
            if not row:continue
            staffid,doctor=row
            if not rp.can_fetch(UA,doctor["profile_url"]):
                raise RuntimeError("Physician detail URL disallowed")
            if not checked_profile:
                probe=session.get(doctor["profile_url"],timeout=18,allow_redirects=False,headers={"Referer":source})
                if probe.status_code!=200 or doctor["doctor_name"] not in BeautifulSoup(probe.text,"html.parser").get_text(" ",strip=True):
                    raise RuntimeError("Doctor detail page/name cannot be verified")
                checked_profile=True
            matched+=1
            if staffid not in doctors:doctors[staffid]=doctor
            else:
                seen={(x["code"],x["role"]) for x in doctors[staffid]["cancers"]}
                for mapped in doctor["cancers"]:
                    if (mapped["code"],mapped["role"]) not in seen:
                        doctors[staffid]["cancers"].append(mapped)
        coverage.append({"department":deptname,"code":code,"cards":len(cards),"matched":matched})
        print(f"BORAMAE[{i}/{len(DEPARTMENTS)}] dept={deptname} cards={len(cards)} verified={matched}",file=sys.stderr,flush=True)
        if i<len(DEPARTMENTS):time.sleep(1.2)
    records=sorted(doctors.values(),key=lambda d:(d["doctor_name"],d["profile_url"]))
    if len(records)<8:raise RuntimeError("Insufficient verifiable oncology clinicians")
    return {"schema_version":1,"source":"서울특별시보라매병원 공식 의료진정보",
            "generated_at":stamp,"count":len(records),"results":records,"coverage":coverage}
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--output",required=True);args=parser.parse_args()
    try:
        result=collect()
        outfile=Path(args.output);outfile.parent.mkdir(parents=True,exist_ok=True)
        tmp=outfile.with_suffix(".tmp")
        tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        tmp.replace(outfile)
        print("BORAMAE_DONE",result["count"],file=sys.stderr)
    except Exception as e:
        print("BORAMAE_FAILED",type(e).__name__,str(e),file=sys.stderr);sys.exit(1)
