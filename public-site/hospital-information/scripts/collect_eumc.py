#!/usr/bin/env python3
"""Ewha Mokdong hospital physician directory, official specialty and linked profiles."""
import argparse,json,re,sys,time,urllib.robotparser
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse,parse_qs
import requests
from bs4 import BeautifulSoup
from collect_amc import REGEX,clean,clinical_role
ROOT="https://mokdong.eumc.ac.kr"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
def doctor_card(td,source,stamp):
    label=td.select_one(".staff-data .name")
    if not label:return None
    name=clean(label.get_text(" ",strip=True))
    m=re.match(r"^([가-힣]{2,5})",name)
    if not m:return None
    name=m.group(1)
    divs=td.select(".staff-data .right .txt")
    if len(divs)<2:return None
    department=clean(divs[0].get_text(" ",strip=True)).split(",")[0].strip()
    specialty=clean(divs[1].get_text(" ",strip=True))
    if not specialty:return None
    cancer=[k for k,p in REGEX.items() if p.search(specialty)]
    if not cancer:return None
    tr=td.find_parent("tr")
    if not tr:return None
    link=tr.select_one("a.detail-btn[onclick]")
    if not link:return None
    command=link.get("onclick","")
    matched=re.search(r"drProfile\(\s*'(\d{5,9})'\s*,\s*'([A-Za-z0-9]{1,8})'\s*\)",command)
    if not matched:return None
    physician_id,dep_code=matched.groups()
    profile=f"{ROOT}/doctor/basicInfo.do?dept_cd={dep_code}&dr_sid={physician_id}"
    role=clinical_role(department,specialty)
    if any(x in department for x in ("종양내과","혈액종양내과")):role="medical_oncology"
    return physician_id,{"doctor_name":name,"hospital_name":"이대목동병원","region":"서울",
        "department":department[:200] or dep_code,"specialty_text":specialty[:650],
        "profile_url":profile,"source_url":source,"verified_at":stamp,"status":"ACTIVE",
        "verification_method":"official_schedule_explicit_specialty_profile",
        "cancers":[{"code":k,"role":role} for k in cancer]}
def collect():
    with requests.Session() as session:
        session.headers.update({"User-Agent":UA,"Accept":"text/html"})
        rb=session.get(ROOT+"/robots.txt",timeout=18,allow_redirects=False)
        if rb.status_code!=200:raise RuntimeError("Mokdong robots.txt unavailable")
        rp=urllib.robotparser.RobotFileParser();rp.parse(rb.text.splitlines())
        index=ROOT+"/medical/dept/deptList.do"
        if not rp.can_fetch(UA,index):raise RuntimeError("Mokdong official staff index disallowed")
        main=session.get(index,timeout=30,allow_redirects=False)
        if main.status_code!=200:raise RuntimeError("Mokdong medical departments index failed")
        soup=BeautifulSoup(main.text,"html.parser")
        codes={}
        for a in soup.select("a[href]"):
            link=urljoin(index,a.get("href",""))
            p=urlparse(link);q=parse_qs(p.query)
            if p.hostname!="mokdong.eumc.ac.kr" or p.path!="/medical/dept/deptScheduleInfo.do":continue
            if q.get("grp_yn")!=["N"]:continue
            code=q.get("dept_cd",[""])[0]
            if re.fullmatch(r"[A-Z]{2,5}",code):codes[code]=link
        if len(codes)<15:raise RuntimeError("Insufficient discoverable official Mokdong department links")
        stamp=datetime.now(timezone.utc).isoformat(timespec="seconds")
        coverage=[];people={}
        for i,(code,url) in enumerate(sorted(codes.items()),1):
            if not rp.can_fetch(UA,url):raise RuntimeError("Mokdong official department disallowed: "+code)
            page=session.get(url,timeout=27,allow_redirects=False)
            if page.status_code!=200:raise RuntimeError(f"Mokdong department {code} HTTP={page.status_code}")
            if urlparse(page.url).hostname!="mokdong.eumc.ac.kr":raise RuntimeError("Mokdong unexpected department host")
            doc=BeautifulSoup(page.text,"html.parser")
            cards=doc.select("td.name-view")
            found=0;checked=False
            for td in cards:
                result=doctor_card(td,url,stamp)
                if not result:continue
                doctor_id,person=result
                if not checked:
                    if not rp.can_fetch(UA,person["profile_url"]):
                        raise RuntimeError("Mokdong profile disallowed "+code)
                    p=session.get(person["profile_url"],timeout=18,allow_redirects=False)
                    if p.status_code!=200 or person["doctor_name"] not in BeautifulSoup(p.text,"html.parser").get_text(" ",strip=True):
                        raise RuntimeError("Mokdong linked profile name mismatch for "+code)
                    checked=True
                found+=1
                if doctor_id not in people:people[doctor_id]=person
                else:
                    old=people[doctor_id];seen={(x["code"],x["role"]) for x in old["cancers"]}
                    for entry in person["cancers"]:
                        if (entry["code"],entry["role"]) not in seen:old["cancers"].append(entry)
            coverage.append({"department_code":code,"cards":len(cards),"matched":found})
            print(f"MOKDONG[{i}/{len(codes)}] {code} cards={len(cards)} matched={found}",file=sys.stderr,flush=True)
            if i<len(codes):time.sleep(0.5)
        docs=sorted(people.values(),key=lambda d:(d["doctor_name"],d["profile_url"]))
        if len(docs)<15:raise RuntimeError("Too few clinically documented doctors")
        return {"schema_version":1,"source":"이대목동병원 공식 진료과 의료진 및 전문진료분야",
                "generated_at":stamp,"count":len(docs),"results":docs,"coverage":coverage}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--output",required=True);a=p.parse_args()
    try:
        data=collect()
        dst=Path(a.output);dst.parent.mkdir(parents=True,exist_ok=True)
        tmp=dst.with_suffix(".tmp");tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        tmp.replace(dst)
        print("MOKDONG_DONE",data["count"],file=sys.stderr)
    except Exception as e:
        print("MOKDONG_FAILED",type(e).__name__,str(e),file=sys.stderr);sys.exit(1)
