#!/usr/bin/env python3
"""감수단/round1/*.json → 감수단/01_1차감수_보고서.md"""
import json, glob
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
R1 = ROOT / "감수단" / "round1"
out = []
out.append("# 1차 감수 보고서 — v1 MINI 원고 12종\n")
out.append("> **고지:** 이 감수는 전문의 30인·환자 36인·편집자문 3인의 역할을 반영한 **AI 검토단**의 사전 점검입니다. 실존 인물이 아니며 실제 면허 의료진·환자의 최종 감수를 대신하지 않습니다.\n")
rows, total = [], Counter()
vols = sorted(p for p in R1.glob("[0-9][0-9].json"))
for p in vols:
    d = json.loads(p.read_text(encoding="utf-8"))
    c = Counter(f["severity"] for r in d["reviews"] for f in r["findings"])
    total += c
    rows.append((d["volume"], d["cancer"], len(d["reviews"]), c["critical"], c["major"], c["minor"]))
out.append("## 집계\n")
out.append("| 권 | 암종 | 감수자 | 🔴 심각 | 🟠 중대 | 🟡 경미 |")
out.append("|---|---|---|---|---|---|")
for r in rows:
    out.append("| %s | %s | %d | %d | %d | %d |" % r)
out.append("| 합계 | | | %d | %d | %d |\n" % (total["critical"], total["major"], total["minor"]))
ed = R1 / "editorial.json"
if ed.exists():
    e = json.loads(ed.read_text(encoding="utf-8"))
    ec = Counter(f["severity"] for r in e["reviews"] for f in r["findings"])
    out.append("편집자문(E01~E03): 🔴 %d · 🟠 %d · 🟡 %d, 국어 수정 예 %d건, 용어집 %d개\n" % (ec["critical"], ec["major"], ec["minor"], len(e.get("language_fixes", [])), len(e.get("glossary", []))))
out.append("## 시리즈 공통 지적 → v2 반영\n")
out.append("| 공통 지적 | v2 반영 |")
out.append("|---|---|")
for a, b in [
    ("표지·출처의 'NCCN … 기반' 표기(저작권·버전 불일치)", "모든 권: 참고문헌 표기 + 'NCCN 비승인·독자 저작물' 고지, 버전은 2026-10-04 모니터 기준"),
    ("PDF 변환으로 깨진 표·문장, 제작 메모(Instagram·MD 작업본·쪽수)", "단일 소스(src)로 전면 재작성, 표 복원, 메모 삭제"),
    ("응급 신호가 상자 또는 본문 한쪽에만", "모든 권: 응급 상자 + 본문 목록 이중 안내, 암종별 응급 추가"),
    ("마음 돌보기·고통 선별 부재", "공통 장 신설(고통 온도계, ☎109), 무료판에도 요약 유지"),
    ("한국 실무(산정특례 30일·서류·보험·직장) 부재", "공통 장 신설, 무료판에 30초 요약 유지, 암종별 질병코드·보험 주의"),
    ("장별 질문 10개 이상", "장별 3개 이내 + 마지막 '10가지 중 3개 고르기'"),
    ("자기비난 언어(흡연·HPV·음주·B형간염)", "권별 '당신 탓이 아님' 문장, 공통 '내 탓일까?' 상자"),
    ("완화의료·임상시험을 말기·최후 수단처럼 서술", "공통 '진행·전이로 진단받았다면'·'최신 치료와 임상시험' 장"),
    ("가임력 상담 누락(대장·림프종 등)", "해당 권 72시간 체크리스트에 가임력 항목"),
]:
    out.append(f"| {a} | {b} |")
out.append("")
for p in vols:
    d = json.loads(p.read_text(encoding="utf-8"))
    out.append(f"## {d['volume']} {d['cancer']}\n")
    out.append("**우선 수정(top_fixes) — v2 원고에 반영, 누락 여부는 2차 확인 보고서에서 점검**\n")
    for i, t in enumerate(d["top_fixes"], 1):
        out.append(f"{i}. {t}")
    out.append("")
    crit = [(r["code"], f) for r in d["reviews"] for f in r["findings"] if f["severity"] == "critical"]
    if crit:
        out.append("**심각(critical) 지적**\n")
        for code, f in crit:
            out.append(f"- [{code}·{f['chapter']}] {f['issue']} → {f['suggestion']}")
        out.append("")
    needs = [n for r in d["reviews"] if r.get("perspective") == "patient" or r["code"].startswith("P") for n in r.get("paid_edition_needs", [])]
    if needs:
        out.append("<details><summary>환자 감수자가 원한 것(유료판 반영 근거)</summary>\n")
        for n in needs:
            out.append(f"- {n}")
        out.append("\n</details>\n")
(ROOT / "감수단" / "01_1차감수_보고서.md").write_text("\n".join(out) + "\n", encoding="utf-8")
print("saved; totals", dict(total))
