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
    lead=(" ".join([a.title or "",a.description or ""])).lower()
    body=(a.body_excerpt or "").lower()
    score=0
    cats=[]
    body_hits=[]
    for k,v in cfg["priority_keywords"].items():
        kl=k.lower()
        if kl in lead:
            score += int(v)
            cats.append(k)
        elif kl in body:
            # Body-only mentions are weaker evidence of the article's main topic.
            score += max(1,round(int(v)*0.30))
            body_hits.append(k)
    for k,v in cfg["downrank_keywords"].items():
        kl=k.lower()
        if kl in lead: score += int(v)
        elif kl in body: score += round(int(v)*0.30)
    all_text=lead+" "+body
    if any(x in lead for x in ["억원","억달러","조원","환자","개월","%","hr ","os ","pfs "]): score += 4
    elif any(x in body for x in ["억원","억달러","조원","환자","개월","%","hr ","os ","pfs "]): score += 1
    a.score=score
    a.categories=list(dict.fromkeys(cats or body_hits))[:6] or ["산업"]
    return a

def _oncology_signal(text):
    t=clean_text(text).lower()
    cancer_terms=[
        "폐암","유방암","위암","대장암","췌장암","간암","담도암","전립선암","자궁경부암",
        "림프종","백혈병","다발골수종","갑상선암","신장암","난소암","난관암","일차 복막암"
    ]
    strong_terms=[
        "항암","종양","면역항암","표적치료","car-t","bite","adc","nccn",
        "egfr","alk","ros1","braf","her2","pd-l1","brca","cldn18.2"
    ]
    explicit=[k for k in cancer_terms if k in t]
    strong=[k for k in strong_terms if k in t]
    # Generic '암' alone is only accepted in treatment/diagnostic context.
    generic = ("암" in t and any(k in t for k in ["치료","신약","임상","항암","환자","진단","수술","방사선","바이오마커","가이드라인","급여","허가"]))
    return explicit,strong,generic

def oncology_meta(a, keywords):
    # Patient-facing oncology news requires an oncology signal in title/description.
    # Full-body incidental mentions (e.g. company portfolio articles) are not enough.
    lead_text=" ".join([a.title or "",a.description or ""])
    explicit,strong,generic=_oncology_signal(lead_text)
    if not (explicit or strong or generic):
        return None

    text=(" ".join([a.title,a.description,a.body_excerpt])).lower()
    lead=lead_text.lower()
    cancer_terms=["유방암","폐암","위암","대장암","갑상선암","신장암","전립선암","췌장암","담도암","간암","림프종","자궁경부암","난소암","난관암","일차 복막암","백혈병","다발골수종","방광암","요로상피암","식도암","자궁내막암","자궁체부암","두경부암","뇌종양","골수종"]
    cancers=[k for k in cancer_terms if k in lead]
    # Only use body-derived cancer type when the title/description did not identify one.
    if not cancers:
        cancers=[k for k in cancer_terms if k in text]
    biomarkers=[k.upper() for k in ["egfr","alk","ros1","braf","her2","pd-l1","brca","cldn18.2"] if k in lead]
    if not biomarkers:
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
        "patient_summary": patient_relevance_meta(a)["patient_summary"],
        "patient_relevance_score": patient_relevance_meta(a)["score"],
        "patient_relevance_labels": patient_relevance_meta(a)["labels"],
        "industry_summary": None
    }

def oncology_archive_plausible(n):
    title=clean_text(n.get("title",""))
    summary=" ".join(n.get("summary") or [])
    explicit,strong,generic=_oncology_signal(title+" "+summary)
    return bool(explicit or strong or generic)

def patient_relevance_meta(a):
    text=(" ".join([a.title,a.description,a.body_excerpt])).lower()
    score=0
    labels=[]
    rules=[
        (["급여","약가","보험"],28,"급여·접근성","보험 적용이나 치료 접근성과 관련된 변화입니다. 실제 적용 여부는 세부 급여기준을 확인해야 합니다."),
        (["허가","식약처","mfds","fda","ema"],24,"허가","치료제의 허가 범위나 사용 가능성과 관련된 소식입니다. 국내 실제 사용은 식약처 허가사항을 확인해야 합니다."),
        (["안전성","부작용","회수","판매중지"],26,"안전성","치료 중 안전성과 관련된 정보입니다. 복용·투여 변경은 담당 의료진과 상의해야 합니다."),
        (["3상","phase 3","pfs","os","orr"],20,"임상결과","향후 치료 선택이나 표준치료 논의에 영향을 줄 수 있는 임상 결과입니다."),
        (["egfr","alk","her2","pd-l1","brca","cldn18.2","바이오마커"],20,"바이오마커","검사 결과에 따라 치료 선택이 달라질 수 있는 정밀의료 관련 정보입니다."),
        (["가이드라인","nccn","권고"],18,"가이드라인","치료 순서나 검사·선택 기준과 관련된 권고 변화입니다. 국내 허가·급여와는 별도로 확인해야 합니다."),
        (["지원","산정특례","의료비"],18,"지원제도","환자 부담이나 지원제도와 관련된 정보입니다. 대상 조건을 공식 안내에서 확인해야 합니다.")
    ]
    summary=None
    for keys,pts,label,msg in rules:
        if any(k in text for k in keys):
            score+=pts;labels.append(label)
            if summary is None: summary=msg
    if any(k in text for k in ["m&a","인수","합병","실적","주가","투자"]): score-=8
    if any(k in text for k in ["암","항암","종양"]): score+=8
    return {"score":max(score,0),"labels":list(dict.fromkeys(labels)),"patient_summary":summary or "치료와 직접 관련된 정보인지 기사 원문과 공식 자료를 함께 확인해 주세요."}

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

def clean_display_title(title):
    t=clean_text(title)
    t=re.sub(r"\s*[-|·]\s*(메디파나뉴스|데일리팜|의학신문|약사공론)\s*$","",t,flags=re.I)
    return t

def _useful_sentence(s):
    s=clean_text(s)
    if len(s)<30: return False
    bad=[
        "글자크기 설정","기사의 본문 내용은","무단전재","재배포 금지",
        "copyright","저작권자","로그인","회원가입","chatgpt 이미지"
    ]
    return not any(x.lower() in s.lower() for x in bad)

def industry_importance_text(a):
    lead=(" ".join([a.title or "",a.description or ""])).lower()
    body=(a.body_excerpt or "").lower()
    def has(text,keys): return any(k in text for k in keys)
    # Determine the article's main subject from title/description first.
    if has(lead,["급여","약가","수가","보험"]):
        return "급여·약가 변화는 환자 접근성과 의료현장 사용량, 제약사의 시장전략에 직접 영향을 줄 수 있습니다."
    if has(lead,["기술수출","라이선스","license","m&a","인수","합병","흡수합병"]):
        return "사업개발·구조개편은 파이프라인 가치와 자본 배분, 기업 경쟁구도에 직접 영향을 주는 변화입니다."
    if has(lead,["투자","공장","생산시설","생산능력","cdmo"]):
        return "생산·투자 확대는 공급망 안정성과 글로벌 사업 확장, 중장기 생산능력 경쟁과 연결됩니다."
    if has(lead,["식약처","허가","fda","ema"]):
        return "허가·규제 변화는 치료 선택지와 제품 출시 시점, 시장 경쟁구도를 바꾸는 핵심 변수입니다."
    if has(lead,["3상","phase 3","pfs","os","orr"]):
        return "주요 임상 결과는 향후 허가·가이드라인·표준치료 변화 가능성을 평가하는 근거가 됩니다."
    if has(lead,["병원","약국","의료기관"]):
        return "의료기관·약국 현장의 변화는 진료 흐름과 환자 경험, 의약품 사용 환경에 직접 영향을 줍니다."
    if has(lead,["품절","공급부족","공급"]):
        return "공급 변화는 의약품 접근성과 의료현장 재고 운영, 대체치료 준비에 영향을 줄 수 있습니다."
    # Only fall back to body text when the headline/description is not decisive.
    if has(body,["급여","약가","수가"]):
        return "기사에서 급여·약가 이슈가 함께 확인돼 시장 접근성과 환자 부담 변화를 후속 확인할 필요가 있습니다."
    if has(body,["인수","합병","투자","기술수출","라이선스"]):
        return "기사에서 사업개발·투자 변화가 함께 확인돼 기업 포트폴리오와 경쟁구도 영향을 살펴볼 필요가 있습니다."
    return "시장·정책·연구개발 흐름을 보여주는 주요 산업 이슈로 후속 정책과 사업 변화 확인이 필요합니다."

def article_to_news(a, rank=None):
    pubs=[x.strip() for x in a.publisher.split(" · ")]
    pts=[]
    if a.description and _useful_sentence(a.description):
        pts.append(clean_text(a.description)[:170])
    if a.body_excerpt:
        sentences=re.split(r"(?<=[.!?다])\s+",a.body_excerpt)
        for s in sentences:
            s=clean_text(s)
            if _useful_sentence(s) and s not in pts:
                pts.append(s[:180])
            if len(pts)>=3: break
    display_title=clean_display_title(a.title)
    return {
        "rank": rank,
        "canonical_issue": a.title,
        "title": display_title,
        "category": a.categories or ["산업"],
        "publishers": pubs,
        "published_at": a.published_at,
        "published_at_verified": a.published_at_verified,
        "summary": pts[:3] or [display_title],
        "importance": industry_importance_text(a),
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
    items=[n for n in dedup.values() if oncology_archive_plausible(n)]
    for n in items:
        fresh,age=freshness_label(n["published_at"],end,tz)
        n["freshness"]=fresh
        n["age_days"]=age
    items.sort(key=lambda n:(int((n.get("oncology") or {}).get("patient_relevance_score") or 0),n.get("published_at") or "",int(n.get("score") or 0)),reverse=True)
    return {
        "version":"1.0",
        "generated_at":datetime.now(tz).isoformat(),
        "window":{"start":cutoff.isoformat(),"end":end.isoformat(),"days":days,"timezone":"Asia/Seoul"},
        "cancer_types":["유방암","폐암","위암","대장암","갑상선암","신장암","전립선암","췌장암","담도암","간암","림프종","자궁경부암"],
        "items":items
    }

def make_report(items,cfg,start,end):
    top=sorted(items,key=lambda x:(x.score,x.published_at or ""),reverse=True)[:cfg["top_n"]]
    top_news=[article_to_news(a,rank=i) for i,a in enumerate(top,1)]
    trends=derive_period_trends(top_news,4) if top_news else []

    if top_news:
        lead=top_news[0]
        briefing=f"{lead['title']}가 오늘 가장 중요한 이슈로 부각됐습니다."
        if len(top_news)>=2:
            briefing+=f" 이어 {top_news[1]['title']}도 주요 변화로 확인됐습니다."
        if trends:
            names=" · ".join(t["title"] for t in trends[:2])
            briefing+=f" 전체적으로는 {names} 흐름이 두드러집니다."
    else:
        briefing="수집구간 내 게시시각이 확인된 주요 산업 이슈가 제한적이었습니다."

    outlet_status=[]
    for s in cfg["sources"]:
        arr=[a for a in items if s["publisher"] in a.publisher]
        outlet_status.append({
            "publisher":s["publisher"],
            "homepage_url":(s.get("entry_urls") or [""])[0],
            "items":[{
                "title":clean_display_title(a.title),
                "published_at":a.published_at,
                "verified":a.published_at_verified,
                "source_url":getattr(a,"_all_urls",[a.url])[0] if getattr(a,"_all_urls",[a.url]) else a.url
            } for a in arr[:8]]
        })

    if trends:
        insight=trends[0]["implication"]
        if len(trends)>1:
            insight+=f" 동시에 {trends[1]['title']} 흐름도 함께 확인돼 단일 이슈보다 복합적인 산업 변화로 보는 것이 적절합니다."
    else:
        insight="개별 기사보다 정책·허가·급여·임상·투자 흐름이 실제 시장과 환자 접근성에 미치는 영향을 함께 확인할 필요가 있습니다."

    return {
        "version":"1.2",
        "report_date":end.strftime("%Y-%m-%d"),
        "collection_window":{"start":start.isoformat(),"end":end.isoformat(),"timezone":"Asia/Seoul"},
        "sources":[s["publisher"] for s in cfg["sources"]],
        "briefing":briefing,
        "top_news":top_news,
        "trends":trends,
        "outlet_status":outlet_status,
        "insight":insight,
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

def derive_period_trends(items, limit=4):
    themes=[
        ("정책·급여",["정책","급여","약가","수가","식약처","복지부","질병청","규제"],"제도 변화가 시장 접근성과 현장 운영에 직접 영향을 주는 흐름"),
        ("신약·임상",["허가","임상","3상","2상","신약","fda","ema","mfds"],"허가·임상 성과가 치료 선택지와 경쟁구도를 바꾸는 흐름"),
        ("투자·사업개발",["기술수출","라이선스","license","m&a","인수","합병","투자","r&d"],"자본과 파이프라인 확보 경쟁이 사업전략의 핵심이 되는 흐름"),
        ("의료현장",["병원","약국","의료기관"],"병원·약국의 운영 변화가 환자 경험과 전달체계에 반영되는 흐름"),
        ("공급·유통",["품절","공급","유통"],"의약품 공급 안정성과 유통 대응이 현장 리스크로 부각되는 흐름"),
        ("디지털헬스",["ai","디지털헬스","플랫폼","비대면"],"AI·플랫폼 기반 의료서비스가 제도와 사업모델 변화로 이어지는 흐름"),
        ("항암·정밀의료",["항암","암","종양","egfr","her2","pd-l1","brca","adc","car-t","bite"],"바이오마커·기전 중심 정밀의료 경쟁이 치료전략을 세분화하는 흐름")
    ]
    scored=[]
    for title,keywords,implication in themes:
        count=0
        weight=0
        examples=[]
        for n in items:
            text=(" ".join([n.get("title","")," ".join(n.get("category") or [])," ".join(n.get("summary") or [])])).lower()
            oncology=(n.get("oncology") or {}).get("is_oncology")
            hit=any(k.lower() in text for k in keywords) or (title=="항암·정밀의료" and oncology)
            if hit:
                count+=1
                weight+=int(n.get("score") or 0)+max(0,6-int(n.get("rank") or 6))
                if len(examples)<2 and n.get("title"): examples.append(n["title"])
        if count:
            scored.append({
                "title":title,
                "count":count,
                "change":f"{count}건의 주요 이슈에서 반복적으로 확인",
                "implication":implication,
                "examples":examples,
                "_weight":weight
            })
    scored.sort(key=lambda x:(x["count"],x["_weight"]),reverse=True)
    for x in scored: x.pop("_weight",None)
    return scored[:limit]

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
    week=select(7,5)
    month=select(30,6)
    return {
        "version":"1.1",
        "generated_at":datetime.now(tz).isoformat(),
        "as_of":end.isoformat(),
        "periods":{
            "today":{"label":"오늘","description":"전일 09:00 초과 ~ 당일 09:00 미만","items":today,"trends":derive_period_trends(today,4)},
            "week":{"label":"최근 7일","description":"최근 7일 핵심 이슈","items":week,"trends":derive_period_trends(week,4)},
            "month":{"label":"최근 30일","description":"최근 30일 핵심 이슈","items":month,"trends":derive_period_trends(month,5)}
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
