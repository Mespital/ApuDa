#!/usr/bin/env python3
import json, os, re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

TZ=ZoneInfo("Asia/Seoul")
UA="ApuDaHIRAUpdates/1.0 (+https://apuda.app/news/)"
LIST_URL="https://www.hira.or.kr/rc/insu/insuadtcrtr/InsuAdtCrtrList.do?pgmid=HIRAA030069000400"

ONCOLOGY_TERMS=[
  "항암","암","종양","백혈병","림프종","골수종","유방","폐","위","대장","직장","간","췌장","담도","신장","전립선",
  "자궁경부","HER2","EGFR","PD-L1","BRCA","CLDN","ALK","CAR-T","면역항암","표적치료"
]
PHARMA_TERMS=["약제","의약품","급여","약가","요양급여","고가의약품"]

def clean(s): return re.sub(r"\s+"," ",str(s or "")).strip()

def parse_date(text):
    m=re.search(r"(20\d{2})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})",text)
    if not m:return None
    try:return datetime(int(m.group(1)),int(m.group(2)),int(m.group(3)),tzinfo=TZ)
    except:return None

def detail_meta(session,url):
    try:
        r=session.get(url,timeout=20);r.raise_for_status()
        soup=BeautifulSoup(r.text,"html.parser")
        text=clean(soup.get_text(" ",strip=True))
        attachments=[]
        for a in soup.select("a[href]"):
            label=clean(a.get_text(" ",strip=True) or a.get("title"))
            href=urljoin(r.url,a.get("href"))
            low=(label+" "+href).lower()
            if any(x in low for x in [".pdf",".hwp",".hwpx",".xlsx",".xls","첨부파일","download"]):
                if href.startswith("http") and href!=url and not any(x["url"]==href for x in attachments):
                    attachments.append({"label":label or "첨부파일","url":href})
            if len(attachments)>=6:break
        summary=""
        for p in soup.select("p, .cont, .view_cont, td"):
            t=clean(p.get_text(" ",strip=True))
            if 45<=len(t)<=600 and any(k in t for k in ["급여","고시","약제","항암","적용","시행"]):
                summary=t[:260]
                break
        return {"attachments":attachments,"summary":summary}
    except Exception:
        return {"attachments":[],"summary":""}

def collect():
    s=requests.Session();s.headers.update({"User-Agent":UA,"Accept-Language":"ko-KR,ko;q=0.9"})
    now=datetime.now(TZ);cutoff=now-timedelta(days=30)
    r=s.get(LIST_URL,timeout=25);r.raise_for_status()
    soup=BeautifulSoup(r.text,"html.parser")
    items=[];seen=set()

    rows=soup.select("table tbody tr") or soup.select("tr")
    for tr in rows:
        cells=[clean(x.get_text(" ",strip=True)) for x in tr.select("th,td")]
        joined=" | ".join(cells)
        dt=parse_date(joined)
        if not dt or dt<cutoff:continue
        link=None
        for a in tr.select("a[href]"):
            txt=clean(a.get_text(" ",strip=True))
            if txt:
                link=(txt,urljoin(r.url,a.get("href")))
                if "bbsView" in link[1] or "InsuAdtCrtr" in link[1]:break
        if not link:continue
        title,url=link
        if url in seen:continue
        is_pharma=any(k.lower() in joined.lower() for k in PHARMA_TERMS)
        is_oncology=any(k.lower() in joined.lower() for k in ONCOLOGY_TERMS)
        if not (is_pharma or is_oncology):continue
        seen.add(url)
        meta=detail_meta(s,url)
        related=cells[1] if len(cells)>1 else ""
        classification=cells[0] if cells else "고시"
        items.append({
          "agency":"건강보험심사평가원",
          "document_type":"보험인정기준",
          "category":"항암 급여" if is_oncology else "급여·약제",
          "classification":classification,
          "related_basis":related,
          "title":title,
          "published_at":dt.isoformat(),
          "url":url,
          "attachments":meta["attachments"],
          "summary":meta["summary"],
          "oncology_related":is_oncology,
          "source_list_url":LIST_URL
        })
        if len(items)>=40:break
    items.sort(key=lambda x:x["published_at"],reverse=True)
    return items

def main():
    repo=Path(os.getenv("APUDA_REPO_DIR",".")).resolve()
    outdir=repo/"public-site"/"news"/"data";outdir.mkdir(parents=True,exist_ok=True)
    now=datetime.now(TZ)
    try:
        items=collect();status="ok"
    except Exception as e:
        items=[];status="error";error=clean(e)[:220]
    payload={
      "version":"1.0",
      "generated_at":now.isoformat(),
      "window_days":30,
      "status":status,
      "items":items,
      "source":{"agency":"건강보험심사평가원","name":"보험인정기준","url":LIST_URL},
      "note":"심평원 공식 보험인정기준에서 약제·급여 및 항암 관련 최신 고시를 연결합니다."
    }
    if status!="ok":payload["error"]=error
    (outdir/"hira-updates.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"hira_updates":len(items),"status":status},ensure_ascii=False))

if __name__=="__main__":main()
