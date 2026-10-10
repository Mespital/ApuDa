#!/usr/bin/env python3
"""Read public Samsung Medical Center cancer search results and verified profiles.

Uses only official HTML under a robots.txt-allowed URL; excludes any doctor
without explicit matching 암종 text in the site's own 진료분야 field.
"""
import argparse
import json
import re
import sys
import time
import urllib.robotparser
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import parse_qs,urljoin,urlparse
import requests
from bs4 import BeautifulSoup
from collect_amc import REGEX,clean,clinical_role

ROOT="https://www.samsunghospital.com"
PATH="/home/reservation/doctorDetailInfo.do"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
TERMS={
"STOMACH":"위암", "COLON":"대장암", "RECTAL":"직장암",
"LUNG":"폐암", "BREAST":"유방암", "LIVER":"간암",
"PANCREAS":"췌장암", "BILIARY":"담도암", "GALLBLADDER":"담낭암",
"ESOPHAGUS":"식도암", "THYROID":"갑상선암", "KIDNEY":"신장암",
"PROSTATE":"전립선암", "BLADDER":"방광암", "TESTICULAR":"고환암",
"CERVICAL":"자궁경부암", "OVARIAN":"난소암", "ENDOMETRIAL":"자궁내막암",
"HEAD_NECK":"두경부암", "ORAL":"구강암", "BRAIN":"뇌종양",
"SARCOMA":"육종", "MELANOMA":"흑색종", "LEUKEMIA":"백혈병",
"DLBCL":"DLBCL", "LYMPHOMA":"림프종", "MYELOMA":"다발골수종",
"PEDIATRIC":"소아암", "NET":"신경내분비종양", "RARE_CUP":"원발불명암"
}
def extract_card(card,source_url,stamp):
    heading=card.select_one(".card-content-title")
    area=card.select_one(".card-content-textarea")
    if not heading or not area:return None
    nameTag=heading.select_one(".text-blue")
    if not nameTag:return None
    name=clean(nameTag.get_text(" ",strip=True))
    if not re.fullmatch(r"[가-힣]{2,5}",name):return None
    nameAndDepartment=clean(heading.get_text(" ",strip=True))
    m=re.search(r"\[([^\]]{2,70})\]",nameAndDepartment)
    if not m:return None
    department=clean(m.group(1))
    detail=clean(area.get_text(" ",strip=True))
    if "[진료분야]" not in detail:return None
    specialty=detail.split("[진료분야]",1)[1].strip()
    specialty=re.sub(r"\s+\d{1,6}$","",specialty).strip()
    if not specialty:return None
    matches=[c for c,p in REGEX.items() if p.search(specialty)]
    if not matches:return None
    profile=None;staffID=None
    for a in card.select('a[href*="doctorProfile.do"]'):
        url=urljoin(ROOT,a.get("href",""))
        p=urlparse(url)
        q=parse_qs(p.query)
        n=q.get("DR_NO",[""])[0]
        if p.scheme=="https" and p.hostname=="www.samsunghospital.com" and p.path=="/home/reservation/common/doctorProfile.do" and re.fullmatch(r"\d{1,7}",n):
            profile=url;staffID=n;break
    if profile is None:return None
    role=clinical_role(department,specialty)
    return staffID,{
        "doctor_name":name,
        "hospital_name":"삼성서울병원",
        "region":"서울",
        "department":department,
        "specialty_text":specialty[:650],
        "profile_url":profile,
        "source_url":source_url,
        "verification_method":"official_keyword_search_explicit_clinical_specialty",
        "verified_at":stamp,
        "status":"ACTIVE",
        "cancers":[{"code":code,"role":role} for code in matches]
    }
def collect():
    with requests.Session() as session:
        session.headers.update({"User-Agent":UA,"Accept":"text/html"})
        policy=session.get(ROOT+"/robots.txt",timeout=20,allow_redirects=False)
        if policy.status_code!=200:raise RuntimeError("SMC robots.txt unavailable; abort")
        rp=urllib.robotparser.RobotFileParser();rp.parse(policy.text.splitlines())
        stamp=datetime.now(timezone.utc).isoformat(timespec="seconds")
        found={};coverage=[]
        for i,(code,term) in enumerate(TERMS.items(),1):
            req=requests.Request("GET",ROOT+PATH,params={"SW":term})
            url=req.prepare().url
            if not rp.can_fetch(UA,url):raise RuntimeError("SMC robots.txt disallows: "+url)
            r=session.get(url,timeout=26,allow_redirects=False)
            if r.status_code!=200:raise RuntimeError(f"SMC search HTTP={r.status_code} code={code}")
            if urlparse(r.url).hostname!="www.samsunghospital.com":
                raise RuntimeError("Offsite redirect")
            soup=BeautifulSoup(r.text,"html.parser")
            if "의료진 검색" not in clean(soup.get_text(" ",strip=True)[:3000]):
                raise RuntimeError("Not a valid SMC doctor search page")
            cards=soup.select("article.card-content")
            accepted=0
            for card in cards:
                parsed=extract_card(card,url,stamp)
                if not parsed:continue
                personID,doctor=parsed
                accepted+=1
                if personID not in found:found[personID]=doctor
                else:
                    original=found[personID]
                    seen={(x["code"],x["role"]) for x in original["cancers"]}
                    for mapped in doctor["cancers"]:
                        if (mapped["code"],mapped["role"]) not in seen:
                            original["cancers"].append(mapped)
                    if len(doctor["specialty_text"])>len(original["specialty_text"]):
                        original["specialty_text"]=doctor["specialty_text"]
            coverage.append({"cancer":code,"search_term":term,"cards":len(cards),"matched":accepted})
            print(f"SMC[{i}/{len(TERMS)}] {code} term={term} cards={len(cards)} matched={accepted}",file=sys.stderr,flush=True)
            if i<len(TERMS):time.sleep(1.05)
        result=sorted(found.values(),key=lambda x:(x["doctor_name"],x["profile_url"]))
        if len(result)<20:raise RuntimeError("Too few verified professionals; do not publish")
        if len(coverage)!=len(TERMS):raise RuntimeError("Not all searches checked")
        return {"schema_version":1,"source":"삼성서울병원 공식 의료진 검색",
          "generated_at":stamp,"count":len(result),"results":result,"coverage":coverage}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True);a=p.parse_args()
    try:
        result=collect()
        out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
        t=out.with_suffix(".tmp");t.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8");t.replace(out)
        print("SMC_DONE",result["count"],file=sys.stderr)
    except Exception as exc:
        print("SMC_COLLECTION_FAILED",type(exc).__name__,str(exc),file=sys.stderr)
        sys.exit(1)
