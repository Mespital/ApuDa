#!/usr/bin/env python3
"""Ajou University Hospital public doctor-directory matcher, official specialty only."""
import argparse,json,re,sys,time,urllib.robotparser
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse,parse_qs
import requests
from bs4 import BeautifulSoup
from collect_amc import REGEX,clean,clinical_role
ROOT="https://hosp.ajoumc.or.kr"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
RELEVANT=("종양","외과","호흡기","소화기","신경","비뇨","방사선","소아청소년",
          "유방","산부인과","이비인후","피부과","혈액","갑상선","암")
def parse_card(card,source,stamp):
    info=card.select_one(".x_doc_info")
    if info is None:return None
    heading=info.select_one("p.tit")
    if heading is None:return None
    title=clean(heading.get_text(" ",strip=True))
    m=re.search(r"([가-힣]{2,5})$",title)
    if not m:return None
    name=m.group(1);dept=title[:m.start()].strip()
    if not dept:return None
    specialty=""
    for dl in info.select("dl"):
        dt=dl.select_one("dt")
        if dt and "전문분야" in clean(dt.get_text(" ",strip=True)):
            dd=dl.select_one("dd")
            if dd:specialty=clean(dd.get_text(" ",strip=True))
            break
    if not specialty:return None
    cancers=[c for c,reg in REGEX.items() if reg.search(specialty)]
    if not cancers:return None
    detail=None;number=None
    for a in info.select("a[href]"):
        href=a.get("href","")
        matched=re.search(r"openDoctorView\(\s*'(\d{1,5})'\s*,\s*'(\d{1,7})'\s*\)",href)
        if matched:
            deptNo,profNo=matched.groups()
            detail=f"{ROOT}/doctor/profViewPop.do?deptNo={deptNo}&profNo={profNo}"
            number=profNo
            break
    if not detail:return None
    role=clinical_role(dept,specialty)
    if "종양혈액내과" in dept:role="medical_oncology"
    return number,{
       "doctor_name":name,"hospital_name":"아주대학교병원","region":"경기",
       "department":dept[:220],"specialty_text":specialty[:650],
       "profile_url":detail,"verified_at":stamp,"status":"ACTIVE",
       "source_url":source,
       "verification_method":"official_department_explicit_specialty_and_individual_profile",
       "cancers":[{"code":code,"role":role} for code in cancers]
    }
def collect():
    s=requests.Session();s.headers.update({"User-Agent":UA,"Accept":"text/html"})
    rb=s.get(ROOT+"/robots.txt",timeout=20,allow_redirects=False)
    if rb.status_code!=200:raise RuntimeError("Ajou robots.txt not verifiable")
    rp=urllib.robotparser.RobotFileParser();rp.parse(rb.text.splitlines())
    directory=ROOT+"/doctor/profDeptList.do"
    if not rp.can_fetch(UA,directory):raise RuntimeError("Ajou medical directory disallowed")
    res=s.get(directory,timeout=25,allow_redirects=False)
    if res.status_code!=200:raise RuntimeError("Ajou department index unavailable")
    soup=BeautifulSoup(res.text,"html.parser")
    deptNo=set()
    names={}
    for a in soup.select("a[href]"):
        name=clean(a.get_text(" ",strip=True))
        link=urljoin(directory,a.get("href",""))
        p=urlparse(link);q=parse_qs(p.query)
        if p.hostname!="hosp.ajoumc.or.kr" or p.path!="/dept/deptView.do":continue
        n=q.get("deptNo",[""])[0]
        if re.fullmatch(r"\d{1,4}",n) and any(v in name for v in RELEVANT):
            deptNo.add(n);names[n]=name
    if len(deptNo)<12:
        raise RuntimeError("Ajou department selector unexpectedly missing")
    pages=[("암센터",ROOT+"/doctor/profCancerList.do?deptNo=116")]
    for number in sorted(deptNo,key=int):
        pages.append((names[number],ROOT+"/doctor/profDeptList.do?deptNo="+number))
    results={};coverage=[];stamp=datetime.now(timezone.utc).isoformat(timespec="seconds")
    for i,(label,url) in enumerate(pages,1):
        if not rp.can_fetch(UA,url):raise RuntimeError("Ajou robots policy denies "+url)
        response=s.get(url,timeout=28,allow_redirects=False)
        if response.status_code!=200:raise RuntimeError("Ajou clinical list HTTP "+str(response.status_code)+" "+url)
        if urlparse(response.url).hostname!="hosp.ajoumc.or.kr":raise RuntimeError("Ajou source redirect changed")
        dom=BeautifulSoup(response.text,"html.parser")
        cards=dom.select("li.doc_blk")
        if not cards:
            raise RuntimeError("Ajou doctor list missing for "+label)
        matched=0;checked=False
        for card in cards:
            entry=parse_card(card,url,stamp)
            if not entry:continue
            profNo,doc=entry
            if not checked:
                if not rp.can_fetch(UA,doc["profile_url"]):raise RuntimeError("Ajou profile disallowed")
                detail=s.get(doc["profile_url"],timeout=22,allow_redirects=False)
                if detail.status_code!=200 or doc["doctor_name"] not in BeautifulSoup(detail.text,"html.parser").get_text(" ",strip=True):
                    raise RuntimeError("Ajou profile name could not be independently confirmed")
                checked=True
            matched+=1
            if profNo not in results:results[profNo]=doc
            else:
                prev=results[profNo];seen={(x["code"],x["role"]) for x in prev["cancers"]}
                for mapped in doc["cancers"]:
                    if (mapped["code"],mapped["role"]) not in seen:prev["cancers"].append(mapped)
                if len(doc["specialty_text"])>len(prev["specialty_text"]):
                    prev["specialty_text"]=doc["specialty_text"]
        coverage.append({"source":label,"cards":len(cards),"matched":matched})
        print(f"AJOU[{i}/{len(pages)}] {label} cards={len(cards)} matched={matched}",file=sys.stderr,flush=True)
        if i<len(pages):time.sleep(0.6)
    people=sorted(results.values(),key=lambda x:(x["doctor_name"],x["profile_url"]))
    if len(people)<18:raise RuntimeError("Insufficient fully reviewed Ajou doctors; reject")
    return {"schema_version":1,"source":"아주대학교병원 공식 진료과 의료진 소개",
        "generated_at":stamp,"count":len(people),"coverage":coverage,"results":people}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True);args=p.parse_args()
    try:
        records=collect()
        out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
        temporary=out.with_suffix(".tmp")
        temporary.write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        temporary.replace(out)
        print("AJOU_VERIFIED",records["count"],file=sys.stderr)
    except Exception as e:
        print("AJOU_FAILED",type(e).__name__,str(e),file=sys.stderr);sys.exit(1)
