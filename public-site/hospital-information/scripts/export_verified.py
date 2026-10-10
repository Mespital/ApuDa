#!/usr/bin/env python3
"""Export only manually verified public directory fields; no pending data."""
import json
import sqlite3
import sys
import shutil
import tempfile
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse
from pathlib import Path
DB = Path("/var/lib/apuda-cancer-matcher/apuda_specialists.db")
VALID_ROLES = {"diagnosis","surgery","medical_oncology","radiation","endoscopy","transplant","car_t"}
def https_url(s):
    if not isinstance(s,str): return False
    try:
        u=urlparse(s.strip())
        return u.scheme=="https" and bool(u.hostname) and not u.username and not u.password
    except ValueError: return False
def export(db_path):
    if not db_path.is_file(): raise RuntimeError("Database file not found")
    # Avoid writes to the live WAL-backed DB or its -shm sidecar.
    # A private temporary copy allows SQLite to create shared-memory files safely.
    # Schedule runs after the DB collectors; quick_check rejects inconsistent copies.
    with tempfile.TemporaryDirectory(prefix="apuda-verified-") as temporary:
        copy=Path(temporary)/db_path.name
        shutil.copy2(db_path, copy)
        wal=Path(str(db_path)+"-wal")
        if wal.is_file():
            shutil.copy2(wal, Path(str(copy)+"-wal"))
        connection=sqlite3.connect(str(copy),timeout=20)
        connection.row_factory=sqlite3.Row
        try:
            connection.execute("PRAGMA query_only=ON")
            integrity=connection.execute("PRAGMA quick_check(1)").fetchone()[0]
            if integrity!="ok": raise RuntimeError("Temporary SQLite snapshot failed integrity check")
            n=connection.execute("SELECT COUNT(*) FROM hospitals").fetchone()[0]
            if n<1: raise RuntimeError("DB has no hospital records")
            records=connection.execute("""
                SELECT s.stable_key, s.doctor_name, s.department, s.specialty_text, s.profile_url,
                       s.verified_at, h.name AS hospital_name, h.region, h.official_url,
                       sc.cancer_code, sc.role, sc.evidence_text
                FROM specialists AS s
                JOIN hospitals AS h ON h.id=s.hospital_id AND h.active=1
                JOIN specialist_cancers AS sc ON sc.specialist_id=s.id
                WHERE s.status='ACTIVE'
                ORDER BY s.stable_key, sc.cancer_code, sc.role
            """).fetchall()
        finally: connection.close()
    doctors={}
    for item in records:
        x=dict(item)
        if not (x["doctor_name"] and x["stable_key"] and x["verified_at"] and x["evidence_text"]):
            continue
        try:
            checked = datetime.fromisoformat(str(x["verified_at"]).replace("Z","+00:00"))
            if checked.tzinfo is None: checked = checked.replace(tzinfo=timezone.utc)
            age = datetime.now(timezone.utc) - checked
            if age > timedelta(days=180) or age < timedelta(days=-1): continue
        except (ValueError, TypeError, OverflowError):
            continue
        if not https_url(x["profile_url"]): continue
        if not x["cancer_code"] or x["role"] not in VALID_ROLES: continue
        # Publish only a public official hospital domain or matching subdomain.
        # Hospital-specific domains that differ should be explicitly reviewed before approval.
        hospital_host=urlparse(x["official_url"] or "").hostname
        profile_host=urlparse(x["profile_url"]).hostname
        if not hospital_host or not profile_host: continue
        def root_host(h): return h.lower().removeprefix("www.")
        h=root_host(hospital_host);p=root_host(profile_host)
        if not (p==h or p.endswith("."+h) or h.endswith("."+p)): continue
        key=x["stable_key"]
        if key not in doctors:
            doctors[key]={"doctor_name":x["doctor_name"],"hospital_name":x["hospital_name"],
                "region":x["region"] or "", "department":x["department"] or "",
                "specialty_text":x["specialty_text"] or "", "profile_url":x["profile_url"],
                "verified_at":x["verified_at"],"status":"ACTIVE","cancers":[]}
        mapping={"code":x["cancer_code"],"role":x["role"]}
        if mapping not in doctors[key]["cancers"]:doctors[key]["cancers"].append(mapping)
    result=sorted(doctors.values(),key=lambda d:(d["hospital_name"],d["doctor_name"]))
    return {"schema_version":1,"source":"ApuDa VPS verified doctors only",
            "generated_at":datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "count":len(result),"results":result}
if __name__=="__main__":
    try:
        payload=export(Path(sys.argv[1]) if len(sys.argv)>1 else DB)
        print(json.dumps(payload,ensure_ascii=False,indent=2))
    except Exception as e:
        print("ApuDa export failed: "+str(e),file=sys.stderr)
        sys.exit(1)
