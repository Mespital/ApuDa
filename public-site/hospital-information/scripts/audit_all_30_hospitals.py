#!/usr/bin/env python3
"""Audit all 30 hospital official medical-directory availability (not doctor harvesting).

Respect each official hostname's robots.txt. Treat inaccessible directories as
unverified; never publish inferred clinicians or treat robots denial as zero doctors.
"""
import concurrent.futures,json,re,sys,urllib.robotparser
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse
import requests
from bs4 import BeautifulSoup
BASE=Path(__file__).resolve().parent.parent/"data"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
def inspect(h,counts):
    root=h["official_url"]; staff=h.get("staff_url")
    info={"slug":h["slug"],"hospital_name":h["name"],"region":h["region"],
          "official_url":root,"official_staff_url":staff or None,
          "matched_doctors":counts.get(h["name"],0),"source_status":"REVIEW_REQUIRED",
          "directory_http":None,"diagnostic":None,"candidate_links":[]}
    homepage=urlparse(root)
    domain=f"{homepage.scheme}://{homepage.hostname}"
    url=staff or root
    target=urlparse(url)
    if target.scheme!="https" or not target.hostname:
        info["diagnostic"]="invalid-directory-url";return info
    checkHost=f"{target.scheme}://{target.hostname}"
    try:
        ses=requests.Session()
        ses.headers.update({"User-Agent":UA,"Accept":"text/html"})
        response=ses.get(checkHost+"/robots.txt",timeout=12,allow_redirects=False)
        if response.status_code!=200:
            info["diagnostic"]="robots-unverified-"+str(response.status_code)
            return info
        robots=urllib.robotparser.RobotFileParser()
        robots.parse(response.text.splitlines())
        if not robots.can_fetch(UA,url):
            info["source_status"]="ROBOTS_RESTRICTED"
            info["diagnostic"]="robots-disallows-directory-url"
            return info
        page=ses.get(url,timeout=15,allow_redirects=False)
        info["directory_http"]=page.status_code
        if page.status_code!=200:
            info["diagnostic"]="directory-http-"+str(page.status_code)
            return info
        soup=BeautifulSoup(page.text,"html.parser")
        title=soup.title.get_text(" ",strip=True) if soup.title else ""
        if staff:
            if len(page.content)>=1000 and ("의료진" in title or "의료진" in soup.get_text(" ",strip=True)[:7000] or "doctor" in title.lower()):
                info["source_status"]="OFFICIAL_DIRECTORY_REACHABLE"
            else: info["diagnostic"]="directory-content-unconfirmed"
        else:
            candidates=[]
            for a in soup.select("a[href]"):
                text=" ".join(a.get_text(" ",strip=True).split())
                href=urljoin(url,a.get("href",""))
                parts=urlparse(href)
                if (parts.scheme!="https" or not parts.hostname or
                    not (parts.hostname==homepage.hostname or parts.hostname.endswith("."+homepage.hostname.replace("www.","")))):
                    continue
                if re.search(r"의료진|의사\s*검색|진료과.{0,5}의료진|doctor|professor",text,re.I) or re.search(r"doctor|medicalstaff|professor|profDept",parts.path,re.I):
                    if href not in candidates:candidates.append(href)
            info["candidate_links"]=candidates[:4]
            if candidates:info["source_status"]="DIRECTORY_CANDIDATE_NEEDS_REVIEW"
            else:info["diagnostic"]="no-public-static-doctor-links-found"
    except Exception as error:
        info["diagnostic"]=type(error).__name__[:55]
    return info
def run():
    hospitals=json.loads((BASE/"hospitals.json").read_text(encoding="utf-8"))
    snapshot=json.loads((BASE/"verified-specialists.json").read_text(encoding="utf-8"))
    if len(hospitals)!=30:raise RuntimeError("expected thirty registered hospitals")
    counts={}
    for d in snapshot["results"]:
        if d.get("status")=="ACTIVE":
            name=d.get("hospital_name")
            counts[name]=counts.get(name,0)+1
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures=[pool.submit(inspect,h,counts) for h in hospitals]
        reports=[item.result(timeout=45) for item in futures]
    for item in reports:
        if item["matched_doctors"]>0:
            item["source_status"]="VERIFIED_MATCHES"
    report={"schema_version":1,"checked_at":datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "registered_hospitals":len(hospitals),
            "hospitals_with_matched_doctors":sum(bool(x["matched_doctors"]) for x in reports),
            "matched_doctors":sum(x["matched_doctors"] for x in reports),
            "hospitals":reports}
    output=BASE/"hospital-coverage.json"
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("HOSPITAL_COVERAGE_SUMMARY registered=",len(reports),"matched_sites=",report["hospitals_with_matched_doctors"],
          "matched_doctors=",report["matched_doctors"])
    for x in reports:
        print("HOSPITAL",x["slug"],x["source_status"],"doctors="+str(x["matched_doctors"]),
              "http="+str(x["directory_http"]),"note="+str(x["diagnostic"]),"candidates="+str(len(x["candidate_links"])))
if __name__=="__main__":
    try:run()
    except Exception as e:print("COVERAGE_AUDIT_FAILED",type(e).__name__,str(e),file=sys.stderr);sys.exit(1)
