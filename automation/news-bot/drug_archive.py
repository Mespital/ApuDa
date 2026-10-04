#!/usr/bin/env python3
import csv
import io
import json
import math
import os
import re
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import unquote
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

import requests

TZ = ZoneInfo("Asia/Seoul")
UA = "ApuDaDrugArchive/1.0 (+https://apuda.app/news/)"
MFDS_APPROVAL_ENDPOINT = os.getenv(
    "MFDS_APPROVAL_ENDPOINT",
    "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08/getDrugPrdtPrmsnInq08",
)
MFDS_SUPPLY_ENDPOINT = os.getenv(
    "MFDS_SUPPLY_ENDPOINT",
    "https://apis.data.go.kr/1471000/MdcinSuplyLackService03/getMdcinSuplyLackList01",
)
PAGE_SIZE = int(os.getenv("APUDA_DRUG_ARCHIVE_PAGE_SIZE", "100"))
MAX_WORKERS = max(1, min(8, int(os.getenv("APUDA_DRUG_ARCHIVE_WORKERS", "6"))))


def clean(v):
    return re.sub(r"\s+", " ", str(v or "")).strip()


def key_value(name, fallback="DATA_GO_KR_SERVICE_KEY"):
    return clean(os.getenv(name, "") or os.getenv(fallback, ""))


def decode_key(raw):
    return unquote(unquote(clean(raw)))


def response_body(data):
    if not isinstance(data, dict):
        return {}
    body = data.get("body")
    if body is None and isinstance(data.get("response"), dict):
        body = data["response"].get("body")
    return body if isinstance(body, dict) else {}


def response_items(data):
    body = response_body(data)
    items = body.get("items") or []
    if isinstance(items, dict):
        items = items.get("item", items)
    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        return []
    out = []
    for x in items:
        if isinstance(x, dict) and set(x.keys()) == {"item"}:
            nested = x.get("item")
            if isinstance(nested, list):
                out.extend(nested)
            elif isinstance(nested, dict):
                out.append(nested)
        else:
            out.append(x)
    return [x for x in out if isinstance(x, dict)]


def response_total_count(data):
    body = response_body(data)
    try:
        return int(body.get("totalCount") or body.get("total_count") or 0)
    except Exception:
        return 0


def pick(d, *keys):
    for k in keys:
        if d.get(k) not in (None, ""):
            return d.get(k)
    low = {str(k).lower(): v for k, v in d.items()}
    for k in keys:
        v = low.get(str(k).lower())
        if v not in (None, ""):
            return v
    return None


def compact_date(v):
    s = re.sub(r"[^0-9]", "", clean(v))
    return s[:8] if len(s) >= 8 else ""


def date_obj(v):
    s = compact_date(v)
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y%m%d").date()
    except Exception:
        return None


def fetch_json(endpoint, key, page_no, page_size=PAGE_SIZE):
    params = {"serviceKey": key, "pageNo": page_no, "numOfRows": page_size, "type": "json"}
    last = None
    for attempt in range(3):
        try:
            r = requests.get(endpoint, params=params, headers={"User-Agent": UA}, timeout=30)
            if r.status_code != 200:
                last = RuntimeError(f"HTTP {r.status_code}")
                time.sleep(1 + attempt)
                continue
            data = r.json()
            return data
        except Exception as e:
            last = e
            time.sleep(1 + attempt)
    raise last or RuntimeError("API request failed")


def fetch_all(endpoint, key):
    first = fetch_json(endpoint, key, 1)
    total = response_total_count(first)
    first_items = response_items(first)
    if total <= len(first_items):
        return first_items, total, []
    pages = max(1, math.ceil(total / PAGE_SIZE))
    rows = list(first_items)
    failures = []

    def work(page):
        return page, response_items(fetch_json(endpoint, key, page))

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = [ex.submit(work, p) for p in range(2, pages + 1)]
        for fut in as_completed(futures):
            try:
                page, items = fut.result()
                rows.extend(items)
            except Exception as e:
                failures.append(clean(e)[:140])

    return rows, total, failures


def map_approval(x):
    return {
        "허가일": compact_date(pick(x, "ITEM_PERMIT_DATE", "itemPermitDate")),
        "품목명": clean(pick(x, "ITEM_NAME", "itemName")),
        "업체명": clean(pick(x, "ENTP_NAME", "entpName")),
        "주성분": clean(pick(x, "MAIN_ITEM_INGR", "mainItemIngr")),
        "전문/일반": clean(pick(x, "SPCLTY_PBLC", "spcltyPblc")),
        "허가구분": clean(pick(x, "CNSGN_MANUF", "cnsignManuf")),
        "희귀의약품": clean(pick(x, "RARE_DRUG_YN", "rareDrugYn")),
        "신약분류": clean(pick(x, "NEWDRUG_CLASS_NAME", "newdrugClassName")),
        "ATC코드": clean(pick(x, "ATC_CODE", "atcCode")),
        "EDI코드": clean(pick(x, "EDI_CODE", "ediCode")),
        "품목기준코드": clean(pick(x, "ITEM_SEQ", "itemSeq")),
    }


def map_supply(x):
    return {
        "신고일": compact_date(pick(x, "REPORT_DATE", "reportDate")),
        "품목명": clean(pick(x, "ITEM_NAME", "ITEM_NM", "itemName", "PRDLST_NM", "ITEMNM", "PRDUCT_NM", "PRDCT_NM")),
        "업체명": clean(pick(x, "ENTP_NAME", "ENTP_NM", "entpName", "companyName", "ENTRPS_NM", "ENTRPSNM")),
        "공급부족예상일": compact_date(pick(x, "SHORT_SUPPLY_EXPT_DATE", "SUPLY_LACK_PRDCT_DATE", "SUPPLY_LACK_EXPECT_DATE", "LACK_PREDICT_DATE", "lackPredictDate", "SUPLY_LACK_OCRN_PRDCT_DATE", "SUPLYLACKOCRNPRDCTDE")),
        "공급부족사유": clean(pick(x, "SHORT_SUPPLY_REASON", "SUPLY_LACK_RSN", "SUPPLY_LACK_REASON", "LACK_REASON", "lackReason", "SUPLY_LACK_CAUSE", "SUPLYLACKRSN")),
        "환자치료영향": clean(pick(x, "TREATMENT_INFU", "PATIENT_TRTMT_INFLU", "PATIENT_TREAT_IMPACT", "patientImpact", "PATIENT_TREATMENT_EFFECT", "PTNT_TRTMT_INFLU")),
        "정상화계획": clean(pick(x, "SUPPLY_PLAN", "SUPLY_NORMAL_PLAN", "NORMALIZATION_PLAN", "normalizationPlan", "SUPLY_NORMALIZATION_PLAN", "SUPLY_NMLZTN_PRMT_PLAN")),
        "정상화예상일": compact_date(pick(x, "SUPPLY_PLAN_DATE", "SUPLY_NORMAL_PRDCT_DATE", "NORMALIZATION_EXPECT_DATE", "normalizationExpectedDate", "SUPLY_NMLZTN_EXPECT_DATE")),
        "재고기준일": compact_date(pick(x, "INV_QTY_DATE", "STOCK_QTY_STDR_DATE", "STOCK_DATE", "stockDate", "SELF_STOCK_QTY_STDR_DATE")),
        "재고량": clean(pick(x, "INV_QTY", "STOCK_QTY", "stockQty", "SELF_STOCK_QTY")),
        "EDI코드": clean(pick(x, "EDI_CODE", "ediCode")),
    }


def dedupe(rows, keys):
    out = []
    seen = set()
    for row in rows:
        k = tuple(row.get(x, "") for x in keys)
        if k in seen:
            continue
        seen.add(k)
        out.append(row)
    return out


def period_rows(rows, date_key, days, today):
    if days == 1:
        start = today
    else:
        start = today - timedelta(days=days - 1)
    out = []
    for r in rows:
        d = date_obj(r.get(date_key))
        if d and start <= d <= today:
            out.append(r)
    return out


def display_date(v):
    s = compact_date(v)
    return f"{s[:4]}-{s[4:6]}-{s[6:8]}" if len(s) == 8 else clean(v)


def col_letter(n):
    out = ""
    while n:
        n, rem = divmod(n - 1, 26)
        out = chr(65 + rem) + out
    return out


def cell_xml(ref, value, style=0):
    text = escape(clean(value))
    style_attr = f' s="{style}"' if style else ""
    return f'<c r="{ref}" t="inlineStr"{style_attr}><is><t xml:space="preserve">{text}</t></is></c>'


def worksheet_xml(rows, columns, widths):
    nrows = max(1, len(rows) + 1)
    ncols = max(1, len(columns))
    dim = f"A1:{col_letter(ncols)}{nrows}"
    cols_xml = "".join(
        f'<col min="{i+1}" max="{i+1}" width="{widths.get(col, 16)}" customWidth="1"/>'
        for i, col in enumerate(columns)
    )
    parts = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        f'<dimension ref="{dim}"/>',
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
        f'<cols>{cols_xml}</cols>',
        '<sheetData>',
    ]
    header = "".join(cell_xml(f"{col_letter(i+1)}1", col, 1) for i, col in enumerate(columns))
    parts.append(f'<row r="1" ht="24" customHeight="1">{header}</row>')
    for ridx, row in enumerate(rows, 2):
        cells = []
        for cidx, col in enumerate(columns, 1):
            value = row.get(col, "")
            if col.endswith("일") or col in ("허가일", "신고일", "공급부족예상일", "정상화예상일", "재고기준일"):
                value = display_date(value)
            cells.append(cell_xml(f"{col_letter(cidx)}{ridx}", value))
        parts.append(f'<row r="{ridx}">{"".join(cells)}</row>')
    parts.extend([
        '</sheetData>',
        f'<autoFilter ref="{dim}"/>',
        '<sheetFormatPr defaultRowHeight="18"/>',
        '</worksheet>',
    ])
    return "".join(parts)


def write_xlsx(path, sheets):
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet_names = list(sheets.keys())
    content_types = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    ]
    for i in range(len(sheet_names)):
        content_types.append(f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
    content_types.append('</Types>')

    workbook_sheets = "".join(
        f'<sheet name="{escape(name)}" sheetId="{i+1}" r:id="rId{i+1}"/>'
        for i, name in enumerate(sheet_names)
    )
    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<sheets>{workbook_sheets}</sheets></workbook>'
    )
    rels = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    ]
    for i in range(len(sheet_names)):
        rels.append(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>')
    rels.append(f'<Relationship Id="rId{len(sheet_names)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>')
    rels.append('</Relationships>')

    root_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '</Relationships>'
    )
    styles = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="2"><font><sz val="10"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Aptos"/></font></fonts>'
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF123A5A"/><bgColor indexed="64"/></patternFill></fill></fills>'
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>'
        '</styleSheet>'
    )

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", "".join(content_types))
        z.writestr("_rels/.rels", root_rels)
        z.writestr("xl/workbook.xml", workbook_xml)
        z.writestr("xl/_rels/workbook.xml.rels", "".join(rels))
        z.writestr("xl/styles.xml", styles)
        for i, name in enumerate(sheet_names, 1):
            cfg = sheets[name]
            z.writestr(
                f"xl/worksheets/sheet{i}.xml",
                worksheet_xml(cfg["rows"], cfg["columns"], cfg["widths"]),
            )


def write_csv(path, rows, columns):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        w.writeheader()
        for row in rows:
            out = dict(row)
            for k in columns:
                if k.endswith("일") or k in ("허가일", "신고일", "공급부족예상일", "정상화예상일", "재고기준일"):
                    out[k] = display_date(out.get(k))
            w.writerow(out)


def main():
    repo = Path(os.getenv("APUDA_REPO_DIR", ".")).resolve()
    data_dir = repo / "public-site" / "news" / "data"
    dl_dir = repo / "public-site" / "news" / "downloads"
    data_dir.mkdir(parents=True, exist_ok=True)
    dl_dir.mkdir(parents=True, exist_ok=True)

    today = datetime.now(TZ).date()
    approval_key = decode_key(key_value("MFDS_APPROVAL_SERVICE_KEY"))
    supply_key = decode_key(key_value("MFDS_SUPPLY_SERVICE_KEY"))

    if not approval_key or not supply_key:
        raise SystemExit("MFDS approval/supply service keys are required for full drug archive export")

    approval_raw, approval_total, approval_failures = fetch_all(MFDS_APPROVAL_ENDPOINT, approval_key)
    supply_raw, supply_total, supply_failures = fetch_all(MFDS_SUPPLY_ENDPOINT, supply_key)

    approvals = dedupe([map_approval(x) for x in approval_raw], ["품목기준코드", "품목명", "허가일"])
    approvals = [x for x in approvals if x.get("품목명")]
    approvals.sort(key=lambda x: (compact_date(x.get("허가일")), x.get("품목명", "")), reverse=True)

    supplies = dedupe([map_supply(x) for x in supply_raw], ["품목명", "업체명", "신고일"])
    supplies = [x for x in supplies if x.get("품목명")]
    supplies.sort(key=lambda x: (compact_date(x.get("신고일")), x.get("품목명", "")), reverse=True)

    a1 = period_rows(approvals, "허가일", 1, today)
    a7 = period_rows(approvals, "허가일", 7, today)
    a30 = period_rows(approvals, "허가일", 30, today)
    s1 = period_rows(supplies, "신고일", 1, today)
    s7 = period_rows(supplies, "신고일", 7, today)
    s30 = period_rows(supplies, "신고일", 30, today)

    approval_cols = ["허가일", "품목명", "업체명", "주성분", "전문/일반", "허가구분", "희귀의약품", "신약분류", "ATC코드", "EDI코드", "품목기준코드"]
    supply_cols = ["신고일", "품목명", "업체명", "공급부족예상일", "공급부족사유", "환자치료영향", "정상화계획", "정상화예상일", "재고기준일", "재고량", "EDI코드"]

    approval_widths = {"허가일": 12, "품목명": 34, "업체명": 24, "주성분": 42, "전문/일반": 12, "허가구분": 14, "희귀의약품": 12, "신약분류": 20, "ATC코드": 14, "EDI코드": 14, "품목기준코드": 14}
    supply_widths = {"신고일": 12, "품목명": 34, "업체명": 24, "공급부족예상일": 15, "공급부족사유": 44, "환자치료영향": 54, "정상화계획": 54, "정상화예상일": 15, "재고기준일": 13, "재고량": 12, "EDI코드": 14}

    approval_xlsx = dl_dir / "mfds-drug-approvals.xlsx"
    supply_xlsx = dl_dir / "mfds-drug-supply-issues.xlsx"
    approval_csv = dl_dir / "mfds-drug-approvals.csv"
    supply_csv = dl_dir / "mfds-drug-supply-issues.csv"

    write_xlsx(approval_xlsx, {
        "오늘 허가": {"rows": a1, "columns": approval_cols, "widths": approval_widths},
        "최근 7일": {"rows": a7, "columns": approval_cols, "widths": approval_widths},
        "최근 30일": {"rows": a30, "columns": approval_cols, "widths": approval_widths},
        "전체 허가": {"rows": approvals, "columns": approval_cols, "widths": approval_widths},
    })
    write_xlsx(supply_xlsx, {
        "오늘 신고": {"rows": s1, "columns": supply_cols, "widths": supply_widths},
        "최근 7일": {"rows": s7, "columns": supply_cols, "widths": supply_widths},
        "최근 30일": {"rows": s30, "columns": supply_cols, "widths": supply_widths},
        "전체 공급이슈": {"rows": supplies, "columns": supply_cols, "widths": supply_widths},
    })
    write_csv(approval_csv, approvals, approval_cols)
    write_csv(supply_csv, supplies, supply_cols)

    payload = {
        "version": "1.0",
        "generated_at": datetime.now(TZ).isoformat(),
        "approval": {
            "total_count_api": approval_total,
            "exported_count": len(approvals),
            "fetch_failures": len(approval_failures),
            "downloads": {
                "xlsx": "/news/downloads/mfds-drug-approvals.xlsx",
                "csv": "/news/downloads/mfds-drug-approvals.csv",
            },
            "periods": {
                "today": {"count": len(a1), "items": a1[:120]},
                "7d": {"count": len(a7), "items": a7[:240]},
                "30d": {"count": len(a30), "items": a30[:360]},
            },
        },
        "supply": {
            "total_count_api": supply_total,
            "exported_count": len(supplies),
            "fetch_failures": len(supply_failures),
            "downloads": {
                "xlsx": "/news/downloads/mfds-drug-supply-issues.xlsx",
                "csv": "/news/downloads/mfds-drug-supply-issues.csv",
            },
            "periods": {
                "today": {"count": len(s1), "items": s1[:120]},
                "7d": {"count": len(s7), "items": s7[:240]},
                "30d": {"count": len(s30), "items": s30[:360]},
            },
        },
        "source": "식품의약품안전처 공공데이터",
        "notice": "공식 데이터 원문을 보기 쉽게 재배열한 자료이며, 의학적 판단이나 치료 변경을 지시하지 않습니다.",
    }
    (data_dir / "drug-archive.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "approval_exported": len(approvals),
        "approval_today": len(a1),
        "approval_7d": len(a7),
        "approval_30d": len(a30),
        "supply_exported": len(supplies),
        "supply_today": len(s1),
        "supply_7d": len(s7),
        "supply_30d": len(s30),
        "approval_fetch_failures": len(approval_failures),
        "supply_fetch_failures": len(supply_failures),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
