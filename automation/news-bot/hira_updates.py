#!/usr/bin/env python3
import json, os, re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

TZ=ZoneInfo("Asia/Seoul")
UA="ApuDaHIRAUpdates/1.1 (+https://apuda.app/news/)"
NOTICE_URL="https://www.hira.or.kr/bbsDummy.do?pgmid=HIRAA020002000100"
CRITERIA_URL="https://www.hira.or.kr/rc/insu/insuadtcrtr/InsuAdtCrtrList.do?pgmid=HIRAA030069000400"

ONCOLOGY_TERMS=[
  "항암","암","종양","백혈병","림프종","골수종","유방","폐","위암","대장","직장","간암","췌장","담도","신장","전립선",
  "자궁경부","HER2","EGFR","PD-L1","BRCA","CLDN","ALK","CAR-T","면역항암","표적치료","IDH1","복강내 온열 항암",
  "[421]","[429]","항악성종양제","종양용약","Ruxolitinib","자카비","Pembrolizumab","키트루다","Nivolumab","옵디보",
  "Trastuzumab","엔허투","Olaparib","린파자","Osimertinib","타그리소"
]
PHARMA_TERMS=["[약제]","약제","의약품","급여","약가","요양급여","고가의약품","신약","등재"]
CANDIDATE_TERMS=["[약제]","고시","급여","약제","신약","항암","암","요양급여"]

def clean(s): return re.sub(r"\s+"," ",str(s or "")).strip()

def parse_date(text):
    m=re.search(r"(20\d{2})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})",text)
    if not m:return None
    try:return datetime(int(m.group(1)),int(m.group(2)),int(m.group(3)),tzinfo=TZ)
    except:return None

def detail_id_from_row(tr):
    raw=str(tr)
    patterns=[
        r"brdBltNo[^0-9]{0,40}(\d{4,10})",
        r"fn_[A-Za-z_]*view[^0-9]{0,40}(\d{4,10})",
        r"go[A-Za-z_]*view[^0-9]{0,40}(\d{4,10})",
        r"bbsView[^0-9]{0,40}(\d{4,10})"
    ]
    for p in patterns:
        m=re.search(p,raw,re.I)
        if m:return m.group(1)
    for a in tr.select("a"):
        raw_attr=" ".join([str(a.get("href") or ""),str(a.get("onclick") or ""),str(a.attrs)])
        m=re.search(r"(?:brdBltNo|bbsView|view)[^0-9]{0,50}(\d{4,10})",raw_attr,re.I)
        if m:return m.group(1)
    return None

def detail_meta(session,url):
    if not url or url==NOTICE_URL:
        return {"attachments":[],"summary":"","detail_title":""}
    try:
        r=session.get(url,timeout=20);r.raise_for_status()
        soup=BeautifulSoup(r.text,"html.parser")
        attachments=[]
        for a in soup.select("a[href]"):
            label=clean(a.get_text(" ",strip=True) or a.get("title"))
            href=urljoin(r.url,a.get("href"))
            low=(label+" "+href).lower()
            if "/images/" in href.lower():continue
            has_file=any(ext in low for ext in [".pdf",".hwp",".hwpx",".xlsx",".xls",".doc",".docx",".zip"])
            if has_file and href.startswith("http") and href!=url and not any(x["url"]==href for x in attachments):
                parent=clean(a.parent.get_text(" ",strip=True)) if a.parent else ""
                attachments.append({"label":(parent or label or "첨부파일")[:150],"url":href})
            if len(attachments)>=6:break

        detail_title=""
        for sel in ["h1","h2","h3",".tit",".title",".view_tit"]:
            el=soup.select_one(sel)
            if el:
                t=clean(el.get_text(" ",strip=True))
                if len(t)>=8:
                    detail_title=t
                    break

        summary=""
        candidates=[]
        for sel in [".view_cont",".cont",".board_view",".bbs_view","article","p","td"]:
            for el in soup.select(sel):
                t=clean(el.get_text(" ",strip=True))
                if 50<=len(t)<=1200:
                    candidates.append(t)
        for t in candidates:
            if "보험인정기준이란" in t:continue
            if any(k.lower() in t.lower() for k in ["급여","고시","약제","항암","적용","시행","신설","변경"]):
                summary=t[:300]
                break
        return {"attachments":attachments,"summary":summary,"detail_title":detail_title}
    except Exception:
        return {"attachments":[],"summary":"","detail_title":""}

def collect():
    s=requests.Session();s.headers.update({"User-Agent":UA,"Accept-Language":"ko-KR,ko;q=0.9"})
    now=datetime.now(TZ);cutoff=now-timedelta(days=30)
    items=[];seen=set()

    # HIRA notice board is paginated. Scan several recent pages so month-end
    # pharmaceutical notices are not pushed off page 1 by multiple same-day notices.
    for page in range(1,5):
        url=NOTICE_URL + ("&pageIndex="+str(page) if page>1 else "")
        r=s.get(url,timeout=25);r.raise_for_status()
        soup=BeautifulSoup(r.text,"html.parser")
        rows=soup.select("table tbody tr") or soup.select("tr")
        page_had_recent=False

        for tr in rows:
            cells=[clean(x.get_text(" ",strip=True)) for x in tr.select("th,td")]
            if len(cells)<4:continue
            joined=" | ".join(cells)
            dt=parse_date(joined)
            if not dt:continue
            if dt<cutoff:continue
            page_had_recent=True

            title=cells[1] if len(cells)>1 else ""
            dept=cells[2] if len(cells)>2 else ""
            if not title or not any(k.lower() in (title+" "+dept).lower() for k in CANDIDATE_TERMS):
                continue

            bid=detail_id_from_row(tr)
            detail_url=(f"https://www.hira.or.kr/bbsDummy.do?brdBltNo={bid}&brdScnBltNo=4&pgmid=HIRAA020002000100" if bid else url)
            dedupe_key=bid or (title+"|"+dt.date().isoformat())
            if dedupe_key in seen:continue
            seen.add(dedupe_key)

            meta=detail_meta(s,detail_url)
            text=" ".join([title,dept,meta.get("summary",""),meta.get("detail_title","")])
            low=text.lower()
            is_pharma=any(k.lower() in low for k in PHARMA_TERMS)
            is_oncology=any(k.lower() in low for k in ONCOLOGY_TERMS)
            is_clinical="임상연구" in text
            is_material="치료재료" in text
            is_selective="선별급여" in text
            if not (is_pharma or is_oncology or is_clinical or is_material or is_selective):
                continue

            if is_oncology:
                category="항암 급여"
            elif "[약제]" in title or "약제" in dept or "신약" in dept:
                category="약제·급여"
            elif is_clinical:
                category="임상연구 급여"
            elif is_material:
                category="치료재료"
            elif is_selective:
                category="선별급여"
            else:
                category="건강보험 기준"

            items.append({
              "agency":"건강보험심사평가원",
              "document_type":"공식 고시·공지",
              "category":category,
              "department":dept,
              "title":title,
              "published_at":dt.isoformat(),
              "url":detail_url,
              "detail_link_verified":bool(bid),
              "attachments":meta["attachments"],
              "summary":meta["summary"],
              "oncology_related":is_oncology,
              "source_list_url":NOTICE_URL,
              "criteria_url":CRITERIA_URL
            })
            if len(items)>=60:break

        if len(items)>=60:break
        if not page_had_recent:
            break

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
      "version":"1.1",
      "generated_at":now.isoformat(),
      "window_days":30,
      "status":status,
      "items":items,
      "source":{"agency":"건강보험심사평가원","name":"공지사항·보험인정기준","url":NOTICE_URL,"criteria_url":CRITERIA_URL},
      "note":"심평원 공식 공지사항과 보험인정기준에서 약제·급여 및 항암 관련 최신 고시를 연결합니다."
    }
    if status!="ok":payload["error"]=error
    (outdir/"hira-updates.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"hira_updates":len(items),"verified_detail_links":sum(1 for x in items if x.get("detail_link_verified")),"status":status},ensure_ascii=False))

if __name__=="__main__":main()
