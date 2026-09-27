import re
from typing import Any

SYMPTOM_ALIASES = {
    "손발저림": ["손발저림", "손발 저림", "저려", "저림"],
    "설사": ["설사"],
    "구토": ["구토", "토했", "토함"],
    "메스꺼움": ["메스꺼움", "울렁", "구역"],
    "피로": ["피로", "기운이 없", "기운없"],
    "통증": ["통증", "아파", "아픔"],
    "식욕저하": ["식욕이 없", "입맛이 없", "식욕저하"],
    "발열": ["열이 나", "발열", "열 있음"],
    "호흡곤란": ["숨이 차", "호흡곤란", "숨차"],
}

def parse_symptom_text(text: str) -> dict[str, Any]:
    normalized = " ".join(text.strip().split())
    items: list[dict[str, Any]] = []

    for canonical, aliases in SYMPTOM_ALIASES.items():
        if any(alias in normalized for alias in aliases):
            item: dict[str, Any] = {"symptom_name": canonical, "present": True}

            if any(word in normalized for word in ["심해", "악화", "더 아파"]):
                item["change"] = "worse"
            elif any(word in normalized for word in ["나아", "호전", "덜 아파"]):
                item["change"] = "better"

            if canonical == "설사":
                match = re.search(r"설사[^0-9]{0,8}(\d+)\s*번", normalized)
                if match:
                    item["count_value"] = int(match.group(1))

            items.append(item)

    fever_absent = any(token in normalized for token in ["열은 없", "열 없음", "발열 없음"])
    return {
        "symptoms": items,
        "fever_absent": fever_absent,
        "needs_user_confirmation": True,
    }

LAB_LINE = re.compile(
    r"(?P<name>[A-Za-z][A-Za-z0-9+\-./ ]{0,30}|[가-힣]{2,20})\s*[:=]?\s*"
    r"(?P<value>-?\d+(?:\.\d+)?)\s*"
    r"(?P<unit>[A-Za-z%µμ/^0-9.]+(?:/[A-Za-z0-9µμ^]+)?)?"
)

def parse_lab_text(text: str) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for line in text.splitlines():
        match = LAB_LINE.search(line.strip())
        if not match:
            continue
        rows.append({
            "test_name": match.group("name").strip(),
            "value": float(match.group("value")),
            "unit": (match.group("unit") or "").strip() or None,
        })

    return {"labs": rows, "needs_user_confirmation": True}
