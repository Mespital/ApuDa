#!/usr/bin/env python3
"""Collect explicitly cancer-specialized staff from official Hwasun CNUH directory."""
import argparse,json,re,sys,time,urllib.robotparser
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse,parse_qs
import requests
from bs4 import BeautifulSoup
from collect_amc import REGEX,clean,clinical_role
HOST="https://www.cnuhh.com"
INDEX="/medical/info/dept.cs?mode=doctor&pageIndex={}"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
def card_parser(card,source,timestamp):
    dl=card.select_one("div.doctor dl") or card.select_one("dl")
    if dl is None:return None
    raw=clean(dl.get_text(" ",strip=True))
    m=re.match(r"^([가-힣]{2,5})\s+(.+?)\s+전문분야\s*(.+)$",raw)
    if not m:return None
    name,department,specialty=map(clean,m.groups())
    if not department or not specialty:return None
    codes=[code for code,regex in REGEX.items() if regex.search(specialty)]
    if not codes:return None
    profile=None
    for a in card.select("a[href]"):
        if "의료진소개" not in clean(a.get_text(" ",strip=True)):continue
        link=urljoin(source,a.get("href",""))
        p=urlparse(link);q=parse_qs(p.query)
        if (p.scheme=="https" and p.hostname=="www.cnuhh.com" and
            p.path=="/medical/info/dept.cs" and q.get("act")==["view"]
            and re.fullmatch(r"[A-Z0-9]{3,12}",q.get("doctCd",[""])[0])):
            profile=link;break
    if not profile:return None
    role=clinical_role(department,specialty)
    if "혈액종양내과" in department:role="medical_oncology"
    return {"doctor_name":name,"hospital_name":"화순전남대학교병원","region":"전남",
            "department":department[:300],"specialty_text":specialty[:650],
            "profile_url":profile,"source_url":source,
            "verification_method":"official_staff_listing_explicit_specialty",
            "verified_at":timestamp,"status":"ACTIVE",
            "cancers":[{"code":code,"role":role} for code in codes]}
def collect():
    s=requests.Session();s.headers.update({"User-Agent":UA,"Accept":"text/html"})
    rb=s.get(HOST+"/robots.txt",timeout=17,allow_redirects=False)
    if rb.status_code!=200:raise RuntimeError("Hwasun robots policy unavailable")
    parser=urllib.robotparser.RobotFileParser();parser.parse(rb.text.splitlines())
    first=HOST+INDEX.format(1)
    if not parser.can_fetch(UA,first):raise RuntimeError("Hwasun staff directory disallowed by robots")
    stamp=datetime.now(timezone.utc).isoformat(timespec="seconds")
    pages=0;found={};summary=[]
    for page in range(1,25):
        url=HOST+INDEX.format(page)
        if not parser.can_fetch(UA,url):raise RuntimeError("Hwasun robots denies page "+str(page))
        res=s.get(url,timeout=26,allow_redirects=False)
        if res.status_code!=200 or urlparse(res.url).hostname!="www.cnuhh.com":
            raise RuntimeError("Official Hwasun page failed "+str(page)+" HTTP="+str(res.status_code))
        soup=BeautifulSoup(res.text,"html.parser")
        if page==1:
            markers=[]
            for a in soup.select('a[href*="pageIndex="]'):
                p=urlparse(urljoin(url,a.get("href","")));q=parse_qs(p.query)
                if q.get("act"):continue
                n=q.get("pageIndex",[""])[0]
                if n.isdigit(): markers.append(int(n))
            pages=max(markers or [1])
            if pages<5 or pages>24:raise RuntimeError("Unexpected number of staff pages: "+str(pages))
        cards=soup.select("ul.introList > li")
        if not cards:raise RuntimeError("Missing Hwasun medical staff cards at "+str(page))
        accepted=0
        for card in cards:
            d=card_parser(card,url,stamp)
            if not d:continue
            accepted+=1
            identity=(d["doctor_name"],urlparse(d["profile_url"]).query.split("&searchKeyword=")[0])
            if identity not in found:found[identity]=d
            else:
                x=found[identity];seen={(v["code"],v["role"]) for v in x["cancers"]}
                for c in d["cancers"]:
                    if (c["code"],c["role"]) not in seen:x["cancers"].append(c)
        summary.append({"page":page,"cards":len(cards),"matched":accepted})
        print(f"HWASUN[{page}/{pages}] found={accepted}/{len(cards)}",file=sys.stderr,flush=True)
        if page>=pages:break
        time.sleep(0.7)
    doctors=sorted(found.values(),key=lambda d:(d["doctor_name"],d["profile_url"]))
    if len(summary)!=pages or len(doctors)<8:
        raise RuntimeError("Unverified Hwasun collection completeness")
    return {"schema_version":1,"source":"화순전남대학교병원 공식 진료과/의료진",
            "generated_at":stamp,"count":len(doctors),"coverage":summary,"results":doctors}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True);args=p.parse_args()
    try:
        result=collect()
        path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True)
        temp=path.with_suffix(".tmp")
        temp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        temp.replace(path)
        print("HWASUN_VERIFIED",result["count"],file=sys.stderr)
    except Exception as e:
        print("HWASUN_FAILED",type(e).__name__,str(e),file=sys.stderr);sys.exit(1)
