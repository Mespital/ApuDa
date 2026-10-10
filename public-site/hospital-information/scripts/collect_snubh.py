#!/usr/bin/env python3
"""Verify and publish SNUBH medical directory clinicians from official permitted lists."""
import json,re,sys,time,argparse,urllib.robotparser
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse,parse_qs
import requests
from bs4 import BeautifulSoup
from collect_amc import REGEX, clean
ROOT="https://www.snubh.org"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
# Official oncology disease centers and supporting specialty departments.
SOURCE_PATHS=[
    "/medical/drMedicalTeam.do?DP_CD=DCD16&DP_TP=O", # Lung cancer
    "/medical/drMedicalTeam.do?DP_CD=DCD13&DP_TP=O", # Stomach cancer
    "/medical/drMedicalTeam.do?DP_CD=DCD14&DP_TP=O", # Breast cancer
    "/medical/drMedicalTeam.do?DP_CD=DCD9&DP_TP=O",  # Urologic oncology
    "/medical/drMedicalTeam.do?DP_CD=DCD7&DP_TP=O",  # Head and neck cancer
    "/medical/drMedicalTeam.do?DP_CD=IMH&DP_TP=O",   # Medical oncology
    "/medical/drMedicalTeam.do?DP_CD=IMG&DP_TP=O",   # Gastroenterology
    "/medical/drMedicalTeam.do?DP_CD=RC&DP_TP=H",    # Pulmonary center
]
CODES={
"IMH":("혈액종양내과","medical_oncology"),
"TS":("심장혈관흉부외과","surgery"),
"GS":("외과","surgery"),
"TR":("방사선종양학과","radiation"),
"IMR":("호흡기내과","diagnosis"),
"IMG":("소화기내과","diagnosis"),
"PA":("병리과","diagnosis"),
"NM":("핵의학과","diagnosis"),
"UR":("비뇨의학과","surgery"),
"NS":("신경외과","surgery"),
"ENT":("이비인후과","surgery"),
"OS":("정형외과","surgery"),
"OG":("산부인과","surgery"),
"OL":("이비인후과","surgery"),
"PS":("성형외과","surgery"),
"DR":("영상의학과","diagnosis"),
}
def parse_card(box,source,now):
    anchor=box.select_one("a.bh_doctor_name_link[href]")
    if not anchor:return None
    text=clean(anchor.get_text(" ",strip=True))
    m=re.match(r"^([가-힣]{2,5})(?:\s|$)",text)
    if not m:return None
    name=m.group(1)
    url=urljoin(ROOT,anchor["href"])
    try:
        u=urlparse(url)
        if u.scheme!="https" or u.hostname!="www.snubh.org" or u.path!="/medical/drIntroduce.do":
            return None
        params=parse_qs(u.query)
        staff_id=params.get("sDrSid",[""])[0]
        dept_cd=params.get("sDpCdDtl",[""])[0]
        if not re.fullmatch(r"\d{5,9}",staff_id):return None
    except ValueError:return None
    specialty=""
    for dl in box.select("dl"):
        dt=dl.select_one("dt")
        if dt and "전문진료분야" in clean(dt.get_text(" ",strip=True)):
            dd=dl.select_one("dd")
            if dd:specialty=clean(dd.get_text(" ",strip=True))
            break
    if not specialty:return None
    cancer=[code for code,r in REGEX.items() if r.search(specialty)]
    if not cancer:return None
    dept,role=CODES.get(dept_cd,(dept_cd or "공식 진료과 확인","diagnosis"))
    if role=="diagnosis" and dept_cd=="IMG" and "내시경" in specialty:role="endoscopy"
    return staff_id,{
      "doctor_name":name,"hospital_name":"분당서울대학교병원","region":"경기",
      "department":dept,"specialty_text":specialty[:650],
      "profile_url":url,"verified_at":now,"status":"ACTIVE",
      "source_url":source,"verification_method":"official_team_directory_exact_specialty",
      "cancers":[{"code":code,"role":role} for code in cancer]
    }
def collect(limit=None):
    with requests.Session() as session:
        session.headers.update({"User-Agent":UA,"Accept":"text/html"})
        robots=session.get(ROOT+"/robots.txt",timeout=20,allow_redirects=False)
        if robots.status_code!=200:raise RuntimeError("SNUBH robots.txt cannot be verified")
        parser=urllib.robotparser.RobotFileParser()
        parser.parse(robots.text.splitlines())
        sources=SOURCE_PATHS[:limit] if limit else SOURCE_PATHS
        records={};coverage=[];now=datetime.now(timezone.utc).isoformat(timespec="seconds")
        for i,path in enumerate(sources,1):
            url=ROOT+path
            if not parser.can_fetch(UA,url):raise RuntimeError("SNUBH robots.txt denies "+url)
            res=session.get(url,timeout=32,allow_redirects=False)
            if res.status_code!=200:raise RuntimeError("SNUBH page status "+str(res.status_code)+" "+url)
            if urlparse(res.url).hostname!="www.snubh.org":raise RuntimeError("Unexpected official host")
            soup=BeautifulSoup(res.text,"html.parser")
            cards=soup.select(".bh_doctor_box_n")
            if not cards:raise RuntimeError("SNUBH doctor card layout changed "+url)
            added=0
            for box in cards:
                entry=parse_card(box,url,now)
                if not entry:continue
                sid,profile=entry
                added+=1
                if sid not in records:records[sid]=profile
                else:
                    old=records[sid];seen={(x["code"],x["role"]) for x in old["cancers"]}
                    for mapping in profile["cancers"]:
                        if (mapping["code"],mapping["role"]) not in seen:
                            old["cancers"].append(mapping)
                    if len(profile["specialty_text"])>len(old["specialty_text"]):
                        old["specialty_text"]=profile["specialty_text"]
            coverage.append({"url":url,"cards":len(cards),"matched":added})
            print(f"SNUBH[{i}/{len(sources)}] cards={len(cards)} matched={added}",file=sys.stderr,flush=True)
            if i<len(sources):time.sleep(1.1)
        result=sorted(records.values(),key=lambda d:(d["doctor_name"],d["profile_url"]))
        if len(result)<(1 if limit else 10):raise RuntimeError("Suspiciously few clinicians, do not publish")
        return {"schema_version":1,"source":"분당서울대학교병원 공식 진료과·센터 의료진 목록",
          "generated_at":now,"count":len(result),"results":result,"coverage":coverage}
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--limit",type=int,default=0)
    p.add_argument("--output",required=True)
    a=p.parse_args()
    try:
        result=collect(limit=a.limit or None)
        target=Path(a.output);target.parent.mkdir(parents=True,exist_ok=True)
        temp=target.with_suffix(".tmp");temp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        temp.replace(target)
        print("SNUBH_DONE",result["count"],file=sys.stderr)
    except Exception as exc:
        print("SNUBH_FAILED:",repr(exc),file=sys.stderr)
        sys.exit(1)
