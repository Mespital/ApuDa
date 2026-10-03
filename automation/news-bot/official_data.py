#!/usr/bin/env python3
import json, os, re
from urllib.parse import unquote, quote
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

TZ = ZoneInfo("Asia/Seoul")
UA = "ApuDaOfficialData/1.0 (+https://apuda.app/news/)"

MFDS_APPROVAL_ENDPOINT = os.getenv(
    "MFDS_APPROVAL_ENDPOINT",
    "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnInq07"
)

CANCERS = ["유방암","폐암","위암","대장암","갑상선암","신장암","전립선암","췌장암","담도암","간암","림프종","자궁경부암"]

def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def clean(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()

def response_items(data):
    if not isinstance(data, dict): return []
    body = data.get("body")
    if body is None and isinstance(data.get("response"), dict):
        body = data["response"].get("body")
    if not isinstance(body, dict): return []
    items = body.get("items") or []
    if isinstance(items, dict):
        if "item" in items: items = items["item"]
        else: items = [items]
    if isinstance(items, dict): items = [items]
    return items if isinstance(items, list) else []

def fetch_official_web(session, src):
    url = src["official_url"] if src["id"] == "ncc_living_guide" else src["portal_url"]
    result = {
        "id": src["id"],
        "agency": src["agency"],
        "name": src["name"],
        "source_url": url,
        "status": "unavailable",
        "checked_at": datetime.now(TZ).isoformat(),
        "latest_year": None,
        "note": None
    }
    try:
        r = session.get(url, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        text = clean(soup.get_text(" ", strip=True))
        years = [int(y) for y in re.findall(r"20\d{2}", text)]
        plausible = [y for y in years if 2000 <= y <= datetime.now(TZ).year]
        if src["id"] == "ncc_cancer_stats":
            stat_years=[int(y) for y in re.findall(r"(20\d{2})년\s*순위",text)]
            result["latest_year"] = max(stat_years) if stat_years else (max(plausible) if plausible else None)
        else:
            result["latest_year"] = None
        result["page_title"] = clean(soup.title.get_text() if soup.title else src["name"])
        result["status"] = "ok"
        if src["id"] == "ncc_cancer_stats":
            rows=[]
            for tr in soup.select("tr"):
                cells=[clean(x.get_text(" ",strip=True)) for x in tr.select("th,td")]
                joined=" | ".join(cells)
                if any(c.replace("암","") in joined or c in joined for c in CANCERS):
                    if cells: rows.append(cells)
            result["matched_rows"] = rows[:30]
            result["note"] = "국가암정보센터 공식 통계 페이지 원문을 기준으로 연결합니다. 수치는 원문 표를 우선 확인합니다."
        else:
            result["note"] = "국가암정보센터 원문을 직접 연결하며, ApuDa에서는 원문을 변형 복제하지 않습니다."
    except Exception as e:
        result["error"] = clean(e)[:180]
    return result

def _redact_secrets(value, key_candidates):
    text=clean(value)
    variants=[]
    for k in key_candidates:
        if not k: continue
        for v in (k,unquote(k),unquote(unquote(k)),quote(k,safe=""),quote(unquote(k),safe="")):
            if v and v not in variants:
                variants.append(v)
    for v in sorted(variants,key=len,reverse=True):
        text=text.replace(v,"***")
    text=re.sub(r"(serviceKey=)[^&\s]+",r"\1***",text,flags=re.I)
    return text

def _safe_gateway_message(resp, key_candidates):
    code=None
    message=None
    error_name=None
    try:
        data=resp.json()
        header=(data.get("header")
                or (data.get("response") or {}).get("header")
                or (data.get("OpenAPI_ServiceResponse") or {}).get("cmmMsgHeader")
                or {})
        code=header.get("resultCode") or header.get("returnReasonCode") or data.get("resultCode")
        message=header.get("resultMsg") or header.get("returnAuthMsg") or data.get("resultMsg") or data.get("message")
        error_name=header.get("errMsg")
    except Exception:
        pass
    if not code:
        m=re.search(r"<(?:resultCode|returnReasonCode)>([^<]+)</",resp.text,re.I)
        if m: code=clean(m.group(1))
    if not message:
        m=re.search(r"<(?:resultMsg|returnAuthMsg|message)>([^<]+)</",resp.text,re.I)
        if m: message=clean(m.group(1))
    if not error_name:
        m=re.search(r"<errMsg>([^<]+)</",resp.text,re.I)
        if m: error_name=clean(m.group(1))
    return clean(code),clean(message),clean(error_name)

def _service_key_candidates(key):
    raw=clean(key)
    vals=[]
    for v in (unquote(unquote(raw)),unquote(raw),raw):
        if v and v not in vals:
            vals.append(v)
    return vals

def fetch_mfds_approval(session, key):
    result = {
        "id": "mfds_drug_approval",
        "agency": "식품의약품안전처",
        "name": "의약품 제품 허가정보",
        "source_url": "https://www.data.go.kr/data/15095677/openapi.do",
        "status": "key_required" if not key else "error",
        "checked_at": datetime.now(TZ).isoformat(),
        "records": []
    }
    if not key:
        result["note"] = "DATA_GO_KR_SERVICE_KEY 등록 후 식약처 공식 OpenAPI가 자동 연결됩니다."
        return result

    candidates=_service_key_candidates(key)
    last_diag={}
    for idx,candidate in enumerate(candidates,1):
        try:
            r = session.get(MFDS_APPROVAL_ENDPOINT, params={
                "serviceKey": candidate,
                "pageNo": 1,
                "numOfRows": 30,
                "type": "json"
            }, timeout=25)

            if r.status_code != 200:
                code,msg,error_name=_safe_gateway_message(r,candidates)
                last_diag={
                    "http_status":r.status_code,
                    "gateway_code":code,
                    "gateway_message":msg,
                    "gateway_error":error_name,
                    "key_variant_attempt":idx
                }
                if r.status_code in (401,403):
                    continue
                r.raise_for_status()

            try:
                data = r.json()
            except Exception:
                code,msg,error_name=_safe_gateway_message(r,candidates)
                last_diag={
                    "http_status":r.status_code,
                    "gateway_code":code,
                    "gateway_message":msg,
                    "gateway_error":error_name,
                    "key_variant_attempt":idx
                }
                continue

            header=data.get("header") or (data.get("response") or {}).get("header") or {}
            result_code=str(header.get("resultCode") or data.get("resultCode") or "")
            result_msg=clean(header.get("resultMsg") or data.get("resultMsg") or "")
            if result_code and result_code not in ("00","0"):
                last_diag={
                    "http_status":r.status_code,
                    "gateway_code":result_code,
                    "gateway_message":result_msg,
                    "key_variant_attempt":idx
                }
                continue

            items = response_items(data)
            rows=[]
            for x in items:
                if not isinstance(x, dict): continue
                rows.append({
                    "item_seq": x.get("ITEM_SEQ"),
                    "item_name": x.get("ITEM_NAME"),
                    "company": x.get("ENTP_NAME"),
                    "main_ingredient": x.get("MAIN_ITEM_INGR"),
                    "permit_date": x.get("ITEM_PERMIT_DATE"),
                    "rare_drug_yn": x.get("RARE_DRUG_YN"),
                    "newdrug_class_name": x.get("NEWDRUG_CLASS_NAME"),
                    "atc_code": x.get("ATC_CODE"),
                    "edi_code": x.get("EDI_CODE")
                })
            rows.sort(key=lambda x: str(x.get("permit_date") or ""), reverse=True)
            result["records"] = rows[:30]
            result["status"] = "ok"
            result["http_status"] = r.status_code
            result["key_variant_used"] = idx
            result["note"] = "식약처 공식 의약품 허가 OpenAPI 연결 상태입니다. 허가 상세 확인은 품목기준코드 기준으로 후속 조회합니다."
            return result
        except Exception as e:
            last_diag={"exception":_redact_secrets(e,candidates)[:240],"key_variant_attempt":idx}

    result.update(last_diag)
    code=clean(last_diag.get("gateway_code"))
    error_name=clean(last_diag.get("gateway_error"))
    message=clean(last_diag.get("gateway_message"))
    result["error_code"]=code or None
    result["error_name"]=error_name or None
    result["error_message"]=message or None
    result.pop("exception",None)
    result.pop("gateway_error",None)
    result.pop("gateway_message",None)
    result.pop("gateway_code",None)
    if code in ("20","30","31") or "SERVICE_" in error_name:
        result["status"]="auth_error"
    elif last_diag.get("http_status")==403:
        result["status"]="forbidden"
    else:
        result["status"]="error"
    if code=="30" or error_name=="SERVICE_KEY_IS_NOT_REGISTERED_ERROR":
        result["note"]="공공데이터포털에서 이 활용신청에 연결된 서비스키를 다시 확인해야 합니다. 현재 GitHub Secret은 전달되고 있지만 API 게이트웨이가 해당 키를 등록된 키로 인정하지 않고 있습니다."
    elif code=="20":
        result["note"]="해당 API의 활용신청·승인 또는 접근 권한을 확인해야 합니다."
    elif code=="31":
        result["note"]="공공데이터 인증키 사용기한이 만료되었습니다. 이용기간 연장 또는 새 키가 필요합니다."
    else:
        result["note"]="식약처 API 연결을 다시 확인하고 있습니다. 공식 원문 링크는 계속 이용할 수 있습니다."
    return result

def static_api_source(src, key):
    return {
        "id": src["id"],
        "agency": src["agency"],
        "name": src["name"],
        "source_url": src["portal_url"],
        "status": "key_available" if key else "key_required",
        "checked_at": datetime.now(TZ).isoformat(),
        "note": "공공데이터 인증키가 등록되어 있습니다. 해당 API 활용신청 승인 후 실제 조회 연결을 검증합니다." if key else "공공데이터포털 활용신청 및 인증키 등록이 필요합니다."
    }

def main():
    here = Path(__file__).resolve().parent
    repo = Path(os.getenv("APUDA_REPO_DIR", ".")).resolve()
    registry = load_json(here / "official_sources.json")
    key = os.getenv("DATA_GO_KR_SERVICE_KEY", "").strip()

    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9"})

    results=[]
    for src in registry["sources"]:
        if src["id"] == "mfds_drug_approval":
            results.append(fetch_mfds_approval(s,key))
        elif src["kind"] == "official_web":
            results.append(fetch_official_web(s,src))
        else:
            results.append(static_api_source(src,key))

    status_counts={}
    for item in results:
        status_counts[item.get("status","unknown")]=status_counts.get(item.get("status","unknown"),0)+1
    out={
        "version":"1.1",
        "generated_at":datetime.now(TZ).isoformat(),
        "service_key_connected":bool(key),
        "source_health":{"total":len(results),"status_counts":status_counts},
        "sources":results,
        "usage_policy":{
            "clinical_decision":"공식 자료는 근거 확인용이며 개인의 진단·치료 결정을 대체하지 않습니다.",
            "source_priority":["식품의약품안전처","건강보험심사평가원","국립암센터 국가암정보센터","보건복지부·질병관리청 등 공식기관"],
            "display_rule":"공식 출처·기준일·원문 링크를 함께 표시하고, 기사 요약과 공식 사실을 분리합니다."
        }
    }
    outdir=repo/"public-site"/"news"/"data"
    outdir.mkdir(parents=True,exist_ok=True)
    (outdir/"official-data.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
    mfds = next((x for x in results if x.get("id")=="mfds_drug_approval"), {})
    print(json.dumps({
        "official_sources":len(results),
        "service_key_connected":bool(key),
        "mfds_approval_status":mfds.get("status"),
        "mfds_approval_records":len(mfds.get("records") or []),
        "mfds_http_status":mfds.get("http_status"),
        "mfds_error_code":mfds.get("error_code"),
        "mfds_error_name":mfds.get("error_name"),
        "mfds_error_message":mfds.get("error_message"),
        "mfds_key_variant_used":mfds.get("key_variant_used") or mfds.get("key_variant_attempt")
    },ensure_ascii=False))

if __name__ == "__main__":
    main()
