#!/usr/bin/env python3
import json,re,sys,os
from pathlib import Path

repo=Path(os.getenv("APUDA_REPO_DIR",Path.cwd())).resolve()
data=repo/"public-site"/"news"/"data"
errors=[]
warnings=[]

def load(name,required=True):
    p=data/name
    if not p.exists():
        if required: errors.append(f"missing {name}")
        return {}
    try:return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        errors.append(f"invalid json {name}: {e}")
        return {}

latest=load("latest.json")
latest_path=str(latest.get("path") or "")
if latest_path:
    target=repo/"public-site"/latest_path.lstrip("/")
    if not target.exists(): errors.append(f"latest target missing: {latest_path}")
else:
    errors.append("latest.json has no path")

official=load("official-data.json")
serialized=json.dumps(official,ensure_ascii=False)
if re.search(r"serviceKey=[^*&\s]+",serialized,re.I):
    errors.append("official-data.json appears to contain an unredacted serviceKey")
if "gateway_body" in serialized:
    errors.append("official-data.json must not publish raw gateway_body")
sources=official.get("sources") or []
if len(sources)<4: warnings.append("official source registry has fewer than 4 sources")

nccn=load("nccn-monitor.json")
nitems=nccn.get("items") or []
cancers=[x.get("cancer") for x in nitems]
if len(nitems)!=12: errors.append(f"NCCN monitor expected 12 cancers, got {len(nitems)}")
if len(set(cancers))!=len(cancers): errors.append("NCCN monitor has duplicate cancer entries")
for x in nitems:
    urls=[
        str(x.get("patient_url") or ""),
        str(x.get("clinical_url") or ""),
        str(x.get("updates_url") or "")
    ]
    present=[u for u in urls if u]
    if not present:
        errors.append(f"NCCN official link missing for {x.get('cancer')}")
    for u in present:
        if not u.startswith("https://www.nccn.org/"):
            errors.append(f"NCCN non-official URL for {x.get('cancer')}: {u}")
if nccn.get("policy_mode")=="link_only_patient_first":
    if not str(nccn.get("patient_url") or "").startswith("https://www.nccn.org/"):
        errors.append("NCCN patient-first policy has no official patient URL")


hira=load("hira-updates.json",required=False)
for x in hira.get("items") or []:
    u=str(x.get("url") or "")
    if "#none" in u: errors.append(f"HIRA item still uses #none: {x.get('title')}")
    if u and "hira.or.kr" not in u: errors.append(f"HIRA item non-official URL: {u}")
    for a in x.get("attachments") or []:
        au=str(a.get("url") or "").lower()
        if "/images/isms" in au or "iso27001" in au:
            errors.append(f"HIRA unrelated certificate attachment: {au}")

notices=load("official-notices.json",required=False)
for x in notices.get("items") or []:
    u=str(x.get("url") or "")
    if u and "mfds.go.kr" not in u:
        errors.append(f"MFDS notice non-official URL: {u}")

archive=load("drug-archive.json",required=False)
if archive:
    for section in ("approval","supply"):
        item=archive.get(section) or {}
        for key in ("xlsx","csv"):
            u=str((item.get("downloads") or {}).get(key) or "")
            if u:
                target=repo/"public-site"/u.lstrip("/")
                if not target.exists():
                    errors.append(f"drug archive download missing: {u}")
        periods=item.get("periods") or {}
        for p in ("today","7d","30d"):
            if p not in periods:
                errors.append(f"drug archive period missing: {section}.{p}")

onc=load("oncology-30d.json",required=False)
for x in onc.get("items") or []:
    if not (x.get("oncology") or {}).get("is_oncology"):
        warnings.append(f"oncology archive non-oncology item: {x.get('title')}")
    urls=x.get("source_urls") or []
    if not urls: warnings.append(f"oncology item has no source URL: {x.get('title')}")

print(json.dumps({
    "status":"ok" if not errors else "failed",
    "errors":errors,
    "warnings":warnings[:20],
    "checks":{
        "official_sources":len(sources),
        "nccn_guides":len(nitems),
        "hira_items":len(hira.get("items") or []),
        "mfds_notices":len(notices.get("items") or []),
        "oncology_items":len(onc.get("items") or []),
        "drug_approval_exported":(archive.get("approval") or {}).get("exported_count",0) if archive else 0,
        "drug_supply_exported":(archive.get("supply") or {}).get("exported_count",0) if archive else 0
    }
},ensure_ascii=False,indent=2))
if errors: sys.exit(1)
