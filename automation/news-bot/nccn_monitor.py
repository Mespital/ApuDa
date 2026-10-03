#!/usr/bin/env python3
import json,re,hashlib,os
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo
import requests
from bs4 import BeautifulSoup

TZ=ZoneInfo("Asia/Seoul")
UA="ApuDaNCCNMonitor/1.0 (+https://apuda.app/news/)"
CATEGORY_URL="https://www.nccn.org/guidelines/category_1"
GUIDES=[
 ("유방암",["breast cancer","breast"]),
 ("폐암",["non-small cell lung cancer","small cell lung cancer","lung cancer"]),
 ("위암",["gastric cancer","stomach cancer"]),
 ("대장암",["colon cancer","rectal cancer","colorectal cancer"]),
 ("갑상선암",["thyroid carcinoma","thyroid cancer"]),
 ("신장암",["kidney cancer","renal cell carcinoma"]),
 ("전립선암",["prostate cancer"]),
 ("췌장암",["pancreatic adenocarcinoma","pancreatic cancer"]),
 ("담도암",["biliary tract cancers","biliary tract cancer"]),
 ("간암",["hepatocellular carcinoma","liver cancer"]),
 ("림프종",["b-cell lymphomas","t-cell lymphomas","lymphoma"]),
 ("자궁경부암",["cervical cancer"])
]

def clean(s):return re.sub(r"\s+"," ",str(s or "")).strip()
def version_of(text):
    pats=[r"Version\s*[:#]?\s*(\d+\.\d{4})",r"v(?:ersion)?\s*(\d+\.\d{4})"]
    for p in pats:
        m=re.search(p,text,re.I)
        if m:return m.group(1)
    return None

def discover(session):
    r=session.get(CATEGORY_URL,timeout=25);r.raise_for_status()
    soup=BeautifulSoup(r.text,"html.parser")
    anchors=[]
    for a in soup.select("a[href]"):
        txt=clean(a.get_text(" ",strip=True))
        href=urljoin(r.url,a.get("href"))
        if txt:anchors.append((txt,href))
    return anchors

def find_link(anchors,aliases):
    for txt,href in anchors:
        low=txt.lower()
        if any(a in low for a in aliases): return txt,href
    return None,None

def fetch_detail(session,url):
    r=session.get(url,timeout=25);r.raise_for_status()
    soup=BeautifulSoup(r.text,"html.parser")
    text=clean(soup.get_text(" ",strip=True))
    ver=version_of(text)
    public_meta=" ".join([clean(soup.title.get_text() if soup.title else ""),ver or "",url])
    return ver,hashlib.sha256(public_meta.encode()).hexdigest()[:16]

def main():
    repo=Path(os.getenv("APUDA_REPO_DIR",".")).resolve()
    outdir=repo/"public-site"/"news"/"data";outdir.mkdir(parents=True,exist_ok=True)
    prev_path=outdir/"nccn-monitor.json"
    prev={}
    if prev_path.exists():
        try:
            p=json.loads(prev_path.read_text(encoding="utf-8"))
            prev={x.get("cancer"):x for x in p.get("items",[])}
        except Exception:pass
    s=requests.Session();s.headers.update({"User-Agent":UA,"Accept-Language":"en-US,en;q=0.9"})
    now=datetime.now(TZ);items=[]
    try:anchors=discover(s);category_ok=True
    except Exception:anchors=[];category_ok=False
    for cancer,aliases in GUIDES:
        label,url=find_link(anchors,aliases)
        item={"cancer":cancer,"status":"not_found","version":None,"previous_version":prev.get(cancer,{}).get("version"),"updated":False,"checked_at":now.isoformat(),"official_url":url or CATEGORY_URL,"source":"NCCN","note":"공개 페이지의 버전 메타데이터만 확인하며 가이드라인 본문은 저장·재배포하지 않습니다."}
        if url:
            try:
                ver,h=fetch_detail(s,url)
                item["version"]=ver;item["metadata_hash"]=h
                item["status"]="ok" if ver else "version_not_exposed"
                pv=item["previous_version"]
                item["updated"]=bool(ver and pv and ver!=pv)
            except Exception:
                item["status"]="unavailable"
        elif not category_ok:
            item["status"]="category_unavailable"
        items.append(item)
    payload={"version":"1.0","generated_at":now.isoformat(),"category_url":CATEGORY_URL,"items":items,"copyright_policy":"NCCN 원문/PDF/알고리즘을 복제하지 않고 공개 버전 정보와 공식 링크만 모니터링합니다."}
    prev_path.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"nccn_guides":len(items),"updates":sum(1 for x in items if x["updated"])},ensure_ascii=False))

if __name__=="__main__":main()
