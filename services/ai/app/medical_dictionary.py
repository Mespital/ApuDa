from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class LabTerm:
    canonical_code: str
    display_name: str
    aliases: tuple[str, ...]


LAB_TERMS: tuple[LabTerm, ...] = (
    LabTerm("LAB_WBC", "WBC", ("WBC", "백혈구", "WHITEBLOODCELL", "WHITEBLOODCELLS")),
    LabTerm("LAB_RBC", "RBC", ("RBC", "적혈구", "REDBLOODCELL", "REDBLOODCELLS")),
    LabTerm("LAB_HEMOGLOBIN", "Hb", ("HB", "HGB", "HEMOGLOBIN", "헤모글로빈", "혈색소")),
    LabTerm("LAB_HEMATOCRIT", "Hct", ("HCT", "HEMATOCRIT", "적혈구용적률")),
    LabTerm("LAB_PLATELET", "Platelet", ("PLT", "PLATELET", "PLATELETS", "혈소판")),
    LabTerm("LAB_ANC", "ANC", ("ANC", "ABSOLUTENEUTROPHILCOUNT", "절대호중구수")),
    LabTerm("LAB_AST", "AST", ("AST", "GOT", "SGOT")),
    LabTerm("LAB_ALT", "ALT", ("ALT", "GPT", "SGPT")),
    LabTerm("LAB_ALP", "ALP", ("ALP", "ALKALINEPHOSPHATASE", "알칼리인산분해효소")),
    LabTerm("LAB_GGT", "GGT", ("GGT", "GAMMAGT", "ΓGT", "감마지티피", "감마GPT")),
    LabTerm("LAB_TOTAL_BILIRUBIN", "Total bilirubin", ("TBIL", "TOTALBILIRUBIN", "총빌리루빈")),
    LabTerm("LAB_ALBUMIN", "Albumin", ("ALBUMIN", "ALB", "알부민")),
    LabTerm("LAB_CREATININE", "Creatinine", ("CREATININE", "CREA", "CR", "크레아티닌")),
    LabTerm("LAB_EGFR", "eGFR", ("EGFR", "ESTIMATEDGFR", "사구체여과율")),
    LabTerm("LAB_BUN", "BUN", ("BUN", "BLOODUREANITROGEN", "혈중요소질소")),
    LabTerm("LAB_SODIUM", "Sodium", ("NA", "SODIUM", "나트륨")),
    LabTerm("LAB_POTASSIUM", "Potassium", ("K", "POTASSIUM", "칼륨")),
    LabTerm("LAB_GLUCOSE", "Glucose", ("GLUCOSE", "GLU", "혈당", "포도당")),
    LabTerm("LAB_HBA1C", "HbA1c", ("HBA1C", "A1C", "당화혈색소")),
    LabTerm("LAB_TOTAL_CHOLESTEROL", "Total cholesterol", ("TC", "TOTALCHOLESTEROL", "총콜레스테롤")),
    LabTerm("LAB_LDL", "LDL-C", ("LDL", "LDLC", "LDLCHOLESTEROL", "저밀도콜레스테롤")),
    LabTerm("LAB_HDL", "HDL-C", ("HDL", "HDLC", "HDLCHOLESTEROL", "고밀도콜레스테롤")),
    LabTerm("LAB_TRIGLYCERIDE", "Triglyceride", ("TG", "TRIGLYCERIDE", "TRIGLYCERIDES", "중성지방")),
    LabTerm("LAB_CRP", "CRP", ("CRP", "CREACTIVEPROTEIN", "C반응단백")),
    LabTerm("LAB_HSCRP", "hs-CRP", ("HSCRP", "HIGH SENSITIVITYCRP", "고감도CRP")),
    LabTerm("LAB_CEA", "CEA", ("CEA", "CARCINOEMBRYONICANTIGEN", "암태아성항원")),
    LabTerm("LAB_CA19_9", "CA19-9", ("CA199", "CA19-9", "CA19.9")),
    LabTerm("LAB_AFP", "AFP", ("AFP", "ALPHAFETOPROTEIN", "알파태아단백")),
    LabTerm("LAB_PSA", "PSA", ("PSA", "PROSTATESPECIFICANTIGEN", "전립선특이항원")),
    LabTerm("LAB_CA125", "CA-125", ("CA125", "CA-125")),
    LabTerm("LAB_CA15_3", "CA15-3", ("CA153", "CA15-3", "CA15.3")),
)


def _key(value: str) -> str:
    value = value.upper().strip()
    value = value.replace("Α", "A")
    return re.sub(r"[^A-Z0-9가-힣Γ]+", "", value)


_ALIAS_MAP: dict[str, LabTerm] = {}
for term in LAB_TERMS:
    for alias in term.aliases:
        _ALIAS_MAP[_key(alias)] = term


def normalize_lab_name(raw_name: str) -> dict[str, str | None]:
    term = _ALIAS_MAP.get(_key(raw_name))
    if not term:
        return {
            "canonical_code": None,
            "display_name": raw_name.strip(),
        }

    return {
        "canonical_code": term.canonical_code,
        "display_name": term.display_name,
    }
