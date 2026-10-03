#!/usr/bin/env python3
import argparse, hashlib, json, re, sys, time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dtparser
from zoneinfo import ZoneInfo

UA = "ApuDaNewsBot/1.0 (+https://apuda.app/news/)"
TIME_META_KEYS = {
    ("property","article:published_time"),
    ("name","article:published_time"),
    ("name","date"),
    ("name","pubdate"),
    ("itemprop","datePublished"),
}

@dataclass
class Article:
    publisher: str
    title: str
    url: str
    published_at: str | None
    published_at_verified: bool
    description: str
    image_url: str | None
    body_excerpt: str
    score: int = 0
    categories: list[str] | None = None
    oncology: dict | None = None

def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def clean_text(s):
    return re.sub(r"\s+", " ", (s or "")).strip()

def same_allowed_domain(url, domains):
    host = urlparse(url).netloc.lower().split(":")[0]
    return any(host == d or host.endswith("." + d) for d in domains)

def discover_links(session, source, limit):
    seen = []
    for entry in source["entry_urls"]:
        try:
            r = session.get(entry, timeout=15)
            r.raise_for_status()
        except Exception:
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href]"):
            u = urljoin(r.url, a.get("href"))
            p = urlparse(u)
            if p.scheme not in ("http","https"): continue
            if not same_allowed_domain(u, source["domains"]): continue
            path = p.path.lower()
            if len(path) < 8: continue
            if any(x in path for x in ["/login","/member","/event","/company","/privacy","/terms","/ad."]): continue
            if u not in seen: seen.append(u)
            if len(seen) >= limit: break
        if len(seen) >= limit: break
    return seen

def extract_jsonld_date(soup):
    for tag in soup.select('script[type="application/ld+json"]'):
        raw = tag.string or tag.get_text()
        if not raw: continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        nodes = data if isinstance(data, list) else [data]
        expanded=[]
        for n in nodes:
            if isinstance(n,dict) and isinstance(n.get("@graph"),list): expanded += n["@graph"]
            expanded.append(n)
        for n in expanded:
            if isinstance(n,dict) and n.get("datePublished"):
                return str(n["datePublished"])
    return None

def extract_meta(soup, *, prop=None, name=None):
    if prop:
        t=soup.find("meta", attrs={"property":prop})
    else:
        t=soup.find("meta", attrs={"name":name})
    return clean_text(t.get("content")) if t and t.get("content") else ""

def extract_published(soup, tz):
    candidates=[]
    d=extract_jsonld_date(soup)
    if d: candidates.append(d)
    for attr,key in TIME_META_KEYS:
        t=soup.find("meta", attrs={attr:key})
        if t and t.get("content"): candidates.append(t.get("content"))
    for t in soup.select("time[datetime]"):
        candidates.append(t.get("datetime"))
    for raw in candidates:
        try:
            dt=dtparser.parse(raw)
            if dt.hour==0 and dt.minute==0 and "T" not in str(raw) and ":" not in str(raw):
                continue
            if dt.tzinfo is None:
                dt=dt.replace(tzinfo=tz)
            return dt.astimezone(tz)
        except Exception:
            pass
    return None

def extract_body(soup):
    for sel in ["article", ".article-body", ".article_body", ".view_cont", ".news_body", "#articleBody", ".article-view-content-div"]:
        node=soup.select_one(sel)
        if node:
            txt=clean_text(node.get_text(" ", strip=True))
            if len(txt)>=120: return txt[:1400]
    paras=[clean_text(p.get_text(" ",strip=True)) for p in soup.select("p")]
    txt=" ".join(x for x in paras if len(x)>25)
    return txt[:1400]

def parse_article(session, source, url, tz):
    try:
        r=session.get(url,timeout=15,allow_redirects=True)
        r.raise_for_status()
    except Exception:
        return None
    if not same_allowed_domain(r.url,source["domains"]): return None
    soup=BeautifulSoup(r.text,"html.parser")
    title=extract_meta(soup,prop="og:title") or clean_text(soup.title.get_text() if soup.title else "")
    if len(title)<8: return None
    published=extract_published(soup,tz)
    desc=extract_meta(soup,prop="og:description") or extract_meta(soup,name="description")
    image=extract_meta(soup,prop="og:image") or None
    body=extract_body(soup)
    return Article(source["publisher"],title,r.url,published.isoformat() if published else None,bool(published),desc,image,body)

def score_article(a, cfg):
    text=(" ".join([a.title,a.description,a.body_excerpt])).lower()
    score=0
    cats=[]
    for k,v in cfg["priority_keywords"].items():
        if k.lower() in text:
            score += int(v)
            cats.append(k)
    for k,v in cfg["downrank_keywords"].items():
        if k.lower() in text: score += int(v)
    if any(x in text for x in ["억원","억달러","조원","환자","개월","%","hr ","os ","pfs "]): score += 4
    a.score=score
    a.categories=list(dict.fromkeys(cats))[:6] or ["산업"]
    return a

def oncology_meta(a, keywords):
    text=(" ".join([a.title,a.description,a.body_excerpt])).lower()
    hits=[k for k in keywords if k.lower() in text]
    if not hits: return None
    cancers=[k for k in ["유방암","폐암","위암","대장암","갑상선암","신장암","전립선암","췌장암","담도암","간암","림프종","자궁경부암","난소암","난관암","일차 복막암","백혈병","다발골수종"] if k in text]
    biomarkers=[k.upper() for k in ["egfr","alk","ros1","braf","her2","pd-l1","brca","cldn18.2"] if k in text]
    return {
        "is_oncology": True,
        "cancer_types": cancers,
        "drug_generic": [],
        "drug_brand": [],
        "targets": [],
        "mechanism": [k.upper() for k in ["adc","car-t","bite"] if k in text],
        "biomarkers": biomarkers,
        "trial_name": None,
        "phase": "3" if ("3상" in text or "phase 3" in text) else ("2" if ("2상" in text or "phase 2" in text) else None),
        "line_of_therapy": None,
        "endpoints": {"orr":None,"pfs":None,"os":None,"hr":None,"grade3plus_ae":None},
        "approval_status": "허가 관련" if "허가" in text else None,
        "reimbursement_status": "급여 관련" if "급여" in text else None,
        "patient_summary": None,
        "industry_summary": None
    }

def norm_title(s):
    s=re.sub(r"[^0-9a-zA-Z가-힣 ]"," ",s.lower())
    return set(x for x in s.split() if len(x)>1)

def similarity(a,b):
    aa,bb=norm_title(a),norm_title(b)
    if not aa or not bb:return 0
    return len(aa&bb)/len(aa|bb)

def dedupe(items):
    groups=[]
    for a in sorted(items,key=lambda x:x.score,reverse=True):
        hit=None
        for g in groups:
            if similarity(a.title,g[0].title)>=0.48:
                hit=g;break
        if hit: hit.append(a)
        else: groups.append([a])
    out=[]
    for g in groups:
        lead=max(g,key=lambda x:x.score)
        pubs=list(dict.fromkeys(x.publisher for x in g))
        urls=list(dict.fromkeys(x.url for x in g))
        source_links=[]
        seen_links=set()
        for x in g:
            key=(x.publisher,x.url)
            if key in seen_links: continue
            seen_links.add(key)
            source_links.append({"publisher":x.publisher,"url":x.url})
        lead.publisher=" · ".join(pubs)
        lead._all_urls=urls
        lead._source_links=source_links
        out.append(lead)
    return out

def article_to_news(a, rank=None):
    pubs=[x.strip() for x in a.publisher.split(" · ")]
    pts=[]
    if a.description: pts.append(a.description[:170])
    if a.body_excerpt:
        sentences=re.split(r"(?<=[.!?다])\s+",a.body_excerpt)
        for s in sentences:
            s=clean_text(s)
            if len(s)>35 and s not in pts:
                pts.append(s[:180])
            if len(pts)>=3: break
    return {
        "rank": rank,
        "canonical_issue": a.title,
        "title": a.title,
        "category": a.categories or ["산업"],
        "publishers": pubs,
        "published_at": a.published_at,
        "published_at_verified": a.published_at_verified,
        "summary": pts[:3] or [a.title],
        "importance": "산업 중요도 규칙 기반 자동 선별 기사입니다. 편집 분석 문구는 후속 AI 검수 단계에서 보강합니다.",
        "source_urls": getattr(a,"_all_urls",[a.url]),
        "source_links": getattr(a,"_source_links",[{"publisher":a.publisher,"url":a.url}]),
        "thumbnail_url": a.image_url,
        "score": a.score,
        "oncology": a.oncology
    }

def freshness_label(published_at, end, tz):
    try:
        dt=dtparser.parse(published_at).astimezone(tz)
    except Exception:
        return "30d", 30
    days=max(0,(end.date()-dt.date()).days)
    if days==0: return "today",days
    if days<=7: return "7d",days
    return "30d",days

def load_existing_oncology(outdir, cutoff, end, tz):
    items=[]
    archive_path=outdir/"oncology-30d.json"
    if archive_path.exists():
        try:
            prev=load_json(archive_path)
            items.extend(prev.get("items",[]))
        except Exception:
            pass
    # Rebuild from any dated daily JSON already stored in the repo.
    for p in sorted(outdir.glob("20??-??-??.json")):
        try:
            daily=load_json(p)
        except Exception:
            continue
        for n in daily.get("top_news",[]):
            if (n.get("oncology") or {}).get("is_oncology") and n.get("published_at_verified") and n.get("published_at"):
                try:
                    dt=dtparser.parse(n["published_at"]).astimezone(tz)
                except Exception:
                    continue
                if cutoff < dt < end:
                    items.append(n)
    return items

def make_oncology_archive(merged, outdir, end, tz, days=30):
    cutoff=end-timedelta(days=days)
    candidates=load_existing_oncology(outdir,cutoff,end,tz)
    for a in merged:
        if a.oncology and a.oncology.get("is_oncology") and a.published_at_verified and a.published_at:
            candidates.append(article_to_news(a))
    dedup={}
    for n in candidates:
        if not n.get("published_at_verified") or not n.get("published_at"): continue
        try:
            dt=dtparser.parse(n["published_at"]).astimezone(tz)
        except Exception:
            continue
        if not (cutoff < dt < end): continue
        urls=n.get("source_urls") or []
        key=(urls[0] if urls else clean_text(n.get("title","")).lower())
        cur=dedup.get(key)
        if cur is None or int(n.get("score") or 0)>int(cur.get("score") or 0):
            dedup[key]=n
    items=list(dedup.values())
    for n in items:
        fresh,age=freshness_label(n["published_at"],end,tz)
        n["freshness"]=fresh
        n["age_days"]=age
    items.sort(key=lambda n:(n.get("published_at") or "",int(n.get("score") or 0)),reverse=True)
    return {
        "version":"1.0",
        "generated_at":datetime.now(tz).isoformat(),
        "window":{"start":cutoff.isoformat(),"end":end.isoformat(),"days":days,"timezone":"Asia/Seoul"},
        "cancer_types":["유방암","폐암","위암","대장암","갑상선암","신장암","전립선암","췌장암","담도암","간암","림프종","자궁경부암"],
        "items":items
    }

def make_report(items,cfg,start,end):
    top=sorted(items,key=lambda x:(x.score,x.published_at or ""),reverse=True)[:cfg["top_n"]]
    def summary_points(a):
        pts=[]
        if a.description: pts.append(a.description[:170])
        if a.body_excerpt:
            sentences=re.split(r"(?<=[.!?다])\s+",a.body_excerpt)
            for s in sentences:
                s=clean_text(s)
                if len(s)>35 and s not in pts:
                    pts.append(s[:180])
                if len(pts)>=3: break
        return pts[:3] or [a.title]
    top_news=[]
    for i,a in enumerate(top,1):
        item=article_to_news(a,rank=i)
        top_news.append(item)
    lead_titles=[x["title"] for x in top_news[:3]]
    briefing=" · ".join(lead_titles) if lead_titles else "수집구간 내 게시시각 검증 주요 기사가 없습니다."
    outlet_status=[]
    for s in cfg["sources"]:
        arr=[a for a in items if s["publisher"] in a.publisher]
        outlet_status.append({"publisher":s["publisher"],"homepage_url":(s.get("entry_urls") or [""])[0],"items":[{"title":a.title,"published_at":a.published_at,"verified":a.published_at_verified,"source_url":getattr(a,"_all_urls",[a.url])[0] if getattr(a,"_all_urls",[a.url]) else a.url} for a in arr[:8]]})
    return {
        "version":"1.1",
        "report_date":end.strftime("%Y-%m-%d"),
        "collection_window":{"start":start.isoformat(),"end":end.isoformat(),"timezone":"Asia/Seoul"},
        "sources":[s["publisher"] for s in cfg["sources"]],
        "briefing":briefing,
        "top_news":top_news,
        "trends":[],
        "outlet_status":outlet_status,
        "insight":"자동 수집·시간검증·중복통합 단계가 완료된 데이터입니다. 게시 전 분석 문구 QA를 권장합니다.",
        "infographic":{"image_path":None,"generated_at":None,"template_version":"news-card-v1"}
    }

def _news_key(n):
    links=n.get("source_urls") or []
    if links: return links[0]
    return clean_text(n.get("canonical_issue") or n.get("title") or "").lower()

def _news_date(n,tz):
    raw=n.get("published_at")
    if raw:
        try: return dtparser.parse(raw).astimezone(tz)
        except Exception: pass
    return None

def build_period_highlights(outdir,end,tz):
    cutoff30=end-timedelta(days=30)
    all_items=[]
    for p in sorted(outdir.glob("20??-??-??.json"),reverse=True):
        try:
            d=load_json(p)
        except Exception:
            continue
        report_date=d.get("report_date") or p.stem
        for n in d.get("top_news",[]):
            item=dict(n)
            item["report_date"]=report_date
            dt=_news_date(item,tz)
            if dt and cutoff30 < dt < end:
                all_items.append(item)

    def select(days,limit):
        cutoff=end-timedelta(days=days)
        best={}
        for n in all_items:
            dt=_news_date(n,tz)
            if not dt or not (cutoff < dt < end): continue
            key=_news_key(n)
            age=max(0,(end.date()-dt.date()).days)
            score=int(n.get("score") or 0)
            rank=int(n.get("rank") or 99)
            period_score=score + max(0,6-rank)*12 + max(0,days-age)
            cur=best.get(key)
            if cur is None or period_score>cur["_period_score"]:
                item=dict(n)
                item["_period_score"]=period_score
                best[key]=item
        items=sorted(best.values(),key=lambda n:(n["_period_score"],n.get("published_at") or ""),reverse=True)[:limit]
        for i,n in enumerate(items,1):
            n.pop("_period_score",None)
            n["period_rank"]=i
        return items

    today_path=outdir/f"{end.strftime('%Y-%m-%d')}.json"
    today=[]
    if today_path.exists():
        try:
            today=load_json(today_path).get("top_news",[])[:5]
        except Exception:
            today=[]
    return {
        "version":"1.0",
        "generated_at":datetime.now(tz).isoformat(),
        "as_of":end.isoformat(),
        "periods":{
            "today":{"label":"오늘","description":"전일 09:00 초과 ~ 당일 09:00 미만","items":today},
            "week":{"label":"최근 7일","description":"최근 7일 핵심 이슈","items":select(7,5)},
            "month":{"label":"최근 30일","description":"최근 30일 핵심 이슈","items":select(30,6)}
        }
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--repo-root",default=".")
    ap.add_argument("--config",default=None)
    ap.add_argument("--now",default=None,help="ISO datetime override for test")
    args=ap.parse_args()
    root=Path(args.repo_root).resolve()
    here=Path(__file__).resolve().parent
    cfg=load_json(args.config or here/"config.json")
    tz=ZoneInfo(cfg["timezone"])
    now=dtparser.parse(args.now).astimezone(tz) if args.now else datetime.now(tz)
    end=now.replace(hour=cfg["window"]["end_hour"],minute=0,second=0,microsecond=0)
    if now<end: end-=timedelta(days=1)
    start=(end-timedelta(days=1)).replace(hour=cfg["window"]["start_hour"])
    session=requests.Session();session.headers.update({"User-Agent":UA,"Accept-Language":"ko-KR,ko;q=0.9,en;q=0.6"})
    kept=[]
    stats={}
    for source in cfg["sources"]:
        links=discover_links(session,source,cfg["max_candidates_per_source"])
        ok=0
        for u in links:
            a=parse_article(session,source,u,tz)
            if not a or not a.published_at_verified: continue
            dt=dtparser.parse(a.published_at).astimezone(tz)
            if not (dt>start and dt<end): continue
            score_article(a,cfg)
            a.oncology=oncology_meta(a,cfg["oncology_keywords"])
            kept.append(a);ok+=1
            time.sleep(.08)
        stats[source["publisher"]]={"candidates":len(links),"in_window_verified":ok}
    merged=dedupe(kept)
    report=make_report(merged,cfg,start,end)
    outdir=root/"public-site"/"news"/"data"
    outdir.mkdir(parents=True,exist_ok=True)
    date=report["report_date"]
    (outdir/f"{date}.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    (outdir/"latest.json").write_text(json.dumps({"latest":date,"path":f"/news/data/{date}.json"},ensure_ascii=False,indent=2),encoding="utf-8")
    oncology_archive=make_oncology_archive(merged,outdir,end,tz,days=30)
    (outdir/"oncology-30d.json").write_text(json.dumps(oncology_archive,ensure_ascii=False,indent=2),encoding="utf-8")
    archive_items=[]
    for p in sorted(outdir.glob("20??-??-??.json"),reverse=True):
        try:
            d=load_json(p)
            top_titles=[n.get("title","") for n in d.get("top_news",[])[:2] if n.get("title")]
            archive_items.append({"date":d.get("report_date") or p.stem,"title":" · ".join(top_titles) or "ApuDa 오늘의 뉴스 브리핑","path":f"/news/data/{p.name}"})
        except Exception:
            pass
    (outdir/"archive-index.json").write_text(json.dumps({"generated_at":datetime.now(tz).isoformat(),"items":archive_items[:60]},ensure_ascii=False,indent=2),encoding="utf-8")
    period_highlights=build_period_highlights(outdir,end,tz)
    (outdir/"period-highlights.json").write_text(json.dumps(period_highlights,ensure_ascii=False,indent=2),encoding="utf-8")
    runlog={"generated_at":datetime.now(tz).isoformat(),"window":{"start":start.isoformat(),"end":end.isoformat()},"sources":stats,"merged_count":len(merged),"top_count":len(report["top_news"]),"oncology_30d_count":len(oncology_archive["items"]),"week_highlight_count":len(period_highlights["periods"]["week"]["items"]),"month_highlight_count":len(period_highlights["periods"]["month"]["items"])}
    (outdir/"last-run.json").write_text(json.dumps(runlog,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(runlog,ensure_ascii=False))

if __name__=="__main__":
    main()
