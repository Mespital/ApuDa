#!/usr/bin/env python3
"""Fetch AMC official cancer-center physician directory (exact specialty matches only).

This only reads public pages permitted by robots.txt. Never fetches user health data.
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

ROOT="https://www.amc.seoul.kr"
BASE=ROOT+"/asan/depts/cancer/K/staffcancer.do?menuId={}"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
MENU_IDS=[3744,3745,3746,3747,3748,3750,3751,3752,3753,3754,
          3755,3756,3757,3758,3759,4977,5085,4824,5251,5353]
# Match ONLY terms found in the official clinical specialty cell, not center membership.
PATTERNS={
  "STOMACH":r"위암",
  "COLON":r"대장암|결장암",
  "RECTAL":r"직장암",
  "LUNG":r"폐암",
  "BREAST":r"유방암",
  "LIVER":r"간암|간세포암",
  "PANCREAS":r"췌장암",
  "BILIARY":r"담도암|담관암",
  "GALLBLADDER":r"담낭암",
  "ESOPHAGUS":r"식도암",
  "THYROID":r"갑상선암",
  "KIDNEY":r"신장암|신세포암",
  "PROSTATE":r"전립선암",
  "BLADDER":r"방광암",
  "TESTICULAR":r"고환암",
  "CERVICAL":r"자궁경부암",
  "OVARIAN":r"난소암",
  "ENDOMETRIAL":r"자궁내막암",
  "HEAD_NECK":r"두경부암",
  "ORAL":r"구강암|구강편평세포암",
  "BRAIN":r"뇌종양|뇌암",
  "SARCOMA":r"육종",
  "MELANOMA":r"흑색종",
  "LEUKEMIA":r"백혈병",
  "DLBCL":r"미만성.{0,8}거대.{0,8}B.?세포|DLBCL",
  "LYMPHOMA":r"림프종",
  "MYELOMA":r"골수종",
  "PEDIATRIC":r"소아암|소아종양",
  "NET":r"신경내분비.{0,3}(종양|암)",
  "RARE_CUP":r"원발.{0,5}불명암|원발부위불명암|희귀암"
}
REGEX={key:re.compile(pattern,re.I) for key,pattern in PATTERNS.items()}
def clean(t):
    return " ".join((t or "").split()).strip()
def clinical_role(dept,specialty):
    d=dept
    if "방사선종양학과" in d:return "radiation"
    if any(p in d for p in ["종양내과","혈액내과","혈액종양내과"]):return "medical_oncology"
    if any(p in d for p in ["외과","비뇨의학과","비뇨기과","산부인과","이비인후과","구강악안면외과"]):
        return "surgery"
    if "소화기내과" in d and "내시경" in specialty:return "endoscopy"
    return "diagnosis"
def host_is_amc(url):
    try:
        u=urlparse(url)
        return u.scheme=="https" and u.hostname=="www.amc.seoul.kr" and not u.username and not u.password
    except ValueError:
        return False
def card_to_record(card,source_url,at):
    info=card.select_one("div.doctor_info")
    if not info:return None
    a=info.select_one("p.doctor_name a[href]")
    if not a:return None
    name=clean(a.get_text(" ",strip=True))
    if not re.fullmatch(r"[가-힣]{2,5}",name):return None
    href=urljoin(ROOT,a.get("href",""))
    if not host_is_amc(href) or "/staffBaseInfoDetail.do" not in urlparse(href).path:return None
    q=parse_qs(urlparse(href).query)
    if not q.get("drEmpId"):return None
    fields={}
    for tr in info.select("tr"):
        cells=tr.find_all(["th","td"],recursive=False)
        if len(cells)<2:continue
        key=clean(cells[0].get_text(" ",strip=True))
        val=clean(cells[1].get_text(" ",strip=True))
        fields[key]=val
    department=fields.get("진료과","")
    specialty=fields.get("전문분야","")
    if not department or not specialty:return None
    matched=[code for code,regex in REGEX.items() if regex.search(specialty)]
    if not matched:return None
    role=clinical_role(department,specialty)
    return {
        "doctor_name":name,
        "hospital_name":"서울아산병원",
        "region":"서울",
        "department":department[:400],
        "specialty_text":specialty[:650],
        "profile_url":href,
        "verified_at":at,
        "status":"ACTIVE",
        "source_url":source_url,
        "verification_method":"official_center_directory_exact_specialty",
        "cancers":[{"code":code,"role":role} for code in matched]
    }
def collect(limit=None):
    sess=requests.Session()
    sess.headers.update({"User-Agent":UA,"Accept":"text/html"})
    robots=sess.get(ROOT+"/robots.txt",timeout=20,allow_redirects=False)
    if robots.status_code!=200:
        raise RuntimeError("Official AMC robots policy could not be verified; no publication")
    rp=urllib.robotparser.RobotFileParser()
    rp.parse(robots.text.splitlines())
    approved_at=datetime.now(timezone.utc).isoformat(timespec="seconds")
    doctors={}
    coverage=[]
    for pos,mid in enumerate(MENU_IDS[:limit] if limit else MENU_IDS,1):
        url=BASE.format(mid)
        if not rp.can_fetch(UA,url):
            raise RuntimeError("robots.txt denies "+url)
        # Do not silently follow redirects outside the approved official origin.
        r=sess.get(url,timeout=35,allow_redirects=False)
        if r.status_code!=200:
            raise RuntimeError(f"official source HTTP {r.status_code}: {url}")
        if not host_is_amc(r.url):
            raise RuntimeError("Official URL escaped approved origin: "+r.url)
        soup=BeautifulSoup(r.text,"html.parser")
        cards=soup.select("ul.serchlist_boxwrap > li")
        if len(cards)<1:
            raise RuntimeError("Official listing structure changed; no clinicians found: "+url)
        found=0; eligible=0
        for card in cards:
            info=card.select_one("p.doctor_name a[href]")
            if info:found+=1
            d=card_to_record(card,url,approved_at)
            if not d:continue
            eligible+=1
            key=d["profile_url"].split("&searchHpCd=")[0] # same id across center departments
            if key not in doctors:doctors[key]=d
            else:
                old=doctors[key]
                mappings={(x["code"],x["role"]) for x in old["cancers"]}
                for mapping in d["cancers"]:
                    if (mapping["code"],mapping["role"]) not in mappings:
                        old["cancers"].append(mapping)
                # More complete official clinical specialty, if different.
                if len(d["specialty_text"])>len(old["specialty_text"]):
                    old["specialty_text"]=d["specialty_text"]
        coverage.append({"center_menu_id":mid,"cards":len(cards),"named":found,"explicit_specialty":eligible})
        print(f"AMC[{pos}/{len(MENU_IDS[:limit] if limit else MENU_IDS)}] {mid} named={found} specialty_matched={eligible}",file=sys.stderr,flush=True)
        if pos<len(MENU_IDS[:limit] if limit else MENU_IDS):time.sleep(1.1)
    results=sorted(doctors.values(),key=lambda d:(d["doctor_name"],d["profile_url"]))
    if len(results)<(1 if limit else 15):
        raise RuntimeError("Suspiciously few explicitly matched records, refusing to publish")
    return {
        "schema_version":1,"source":"서울아산병원 공식 암병원 의료진소개",
        "generated_at":approved_at,"count":len(results),"results":results,
        "coverage":coverage
    }
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--limit",type=int,default=0)
    p.add_argument("--output",type=str,required=True)
    opt=p.parse_args()
    try:
        payload=collect(limit=opt.limit or None)
        out=Path(opt.output)
        out.parent.mkdir(parents=True,exist_ok=True)
        temp=out.with_suffix(".tmp")
        temp.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        temp.replace(out)
        print("AMC_DONE",len(payload["coverage"]),"centers",payload["count"],"unique verified clinical profiles",file=sys.stderr)
    except Exception as e:
        print("AMC_COLLECTION_FAILED:",type(e).__name__,str(e),file=sys.stderr)
        sys.exit(1)
