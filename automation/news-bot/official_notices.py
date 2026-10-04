#!/usr/bin/env python3
import json, re, os
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

TZ=ZoneInfo("Asia/Seoul")
UA="ApuDaOfficialNotices/1.0 (+https://apuda.app/news/)"
SOURCES=[
  {"agency":"식품의약품안전처","type":"행정예고","url":"https://www.mfds.go.kr/brd/m_209/list.do?Data_stts_gubun=C9999"},
  {"agency":"식품의약품안전처","type":"제개정고시","url":"https://www.mfds.go.kr/brd/m_207/list.do"},
  {"agency":"식품의약품안전처","type":"공지","url":"https://www.mfds.go.kr/brd/m_74/list.do?Data_stts_gubun=C9999"},
  {"agency":"식품의약품안전처","type":"안전성서한","url":"https://www.mfds.go.kr/brd/m_545/list.do"}
]
KEYWORDS=[
  "의약품","약제","항암","바이오의약품","임상","허가","품목","급여","약가",
  "안전성","회수","판매중지","공급","희귀의약품","의료제품","디지털의료"
]
ATTACH_EXT=(".pdf",".hwp",".hwpx",".xlsx",".xls",".zip",".doc",".docx")

def clean(s): return re.sub(r"\s+"," ",str(s or "")).strip()

def parse_date(text):
    m=re.search(r"(20\d{2})[.\-/년 ]\s*(\d{1,2})[.\-/월 ]\s*(\d{1,2})",text)
    if not m:return None
    try:return datetime(int(m.group(1)),int(m.group(2)),int(m.group(3)),tzinfo=TZ)
    except:return None

def categorize(title,stype):
    t=title.lower()
    if any(k in t for k in ["안전성","회수","판매중지"]): return "안전성"
    if any(k in t for k in ["허가","품목","심사","신고"]): return "허가·심사"
    if any(k in t for k in ["급여","약가","보험"]): return "급여·약가"
    if any(k in t for k in ["공급","품절"]): return "공급"
    if "행정예고" in stype:return "행정예고"
    if "고시" in stype:return "고시"
    return "공식공문"

def detail_attachments(session,url):
    try:
        r=session.get(url,timeout=15); r.raise_for_status()
        soup=BeautifulSoup(r.text,"html.parser")
        out=[];seen=set()
        for a in soup.select("a[href]"):
            href=urljoin(r.url,a.get("href"))
            label=clean(a.get_text(" ",strip=True))
            low=href.lower()
            path=low.split("?")[0]
            is_file=(
                path.endswith(ATTACH_EXT)
                or any(x in label.lower() for x in ATTACH_EXT)
                or "/down.do" in low
                or "download.do" in low
                or ("file_seq=" in low and "data_tp=" in low)
            )
            if not is_file or href in seen: continue
            # Keep only attachments from the same official MFDS host.
            if "mfds.go.kr" not in low: continue
            seen.add(href)
            pretty=label or "첨부파일"
            pretty=re.sub(r"^(다운로드|첨부파일)\s*[:：-]?\s*","",pretty,flags=re.I) or "첨부파일"
            out.append({"label":pretty[:120],"url":href})
            if len(out)>=8:break
        return out
    except Exception:return []

def collect(session,source,cutoff):
    try:
        r=session.get(source["url"],timeout=20);r.raise_for_status()
    except Exception:
        return []
    soup=BeautifulSoup(r.text,"html.parser")
    items=[];seen=set()
    for a in soup.select("a[href]"):
        title=clean(a.get_text(" ",strip=True))
        if len(title)<8:continue
        if not any(k.lower() in title.lower() for k in KEYWORDS):continue
        href=urljoin(r.url,a.get("href"))
        if href in seen:continue
        container=a.find_parent(["tr","li","div"])
        text=clean(container.get_text(" ",strip=True) if container else title)
        dt=parse_date(text)
        if dt and dt<cutoff:continue
        if not dt:continue
        seen.add(href)
        items.append({
          "agency":source["agency"],
          "document_type":source["type"],
          "category":categorize(title,source["type"]),
          "title":title,
          "published_at":dt.isoformat(),
          "url":href,
          "attachments":detail_attachments(session,href),
          "source_list_url":source["url"]
        })
        if len(items)>=12:break
    return items

def main():
    repo=Path(os.getenv("APUDA_REPO_DIR",".")).resolve()
    outdir=repo/"public-site"/"news"/"data";outdir.mkdir(parents=True,exist_ok=True)
    now=datetime.now(TZ);cutoff=now-timedelta(days=30)
    s=requests.Session();s.headers.update({"User-Agent":UA,"Accept-Language":"ko-KR,ko;q=0.9"})
    items=[]
    for src in SOURCES:items.extend(collect(s,src,cutoff))
    dedup={}
    for x in items:dedup[x["url"]]=x
    items=sorted(dedup.values(),key=lambda x:x["published_at"],reverse=True)[:40]
    payload={
      "version":"1.0",
      "generated_at":now.isoformat(),
      "window_days":30,
      "items":items,
      "sources":SOURCES,
      "note":"공식기관 원문과 첨부파일 링크를 제공하며, 문서 내용 자체는 ApuDa가 임의로 변경해 재게시하지 않습니다."
    }
    (outdir/"official-notices.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"official_notices":len(items)},ensure_ascii=False))

if __name__=="__main__":main()
