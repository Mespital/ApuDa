#!/usr/bin/env python3
"""ApuDa 「암 진단 첫 30일」 원고 빌드: 소스 1개 → 유료 완전판 + 무료 MINI판.

소스 문법 (src/NN_*.src.md):
  <!-- INCLUDE: common/파일.md -->              공통 장 삽입 ({{변수}} 치환)
  <!-- VARS: 키=값 | 키=값 -->                   이 권의 치환 변수 (파일 맨 앞)
  <!-- PAID:START | 무료판 안내 문구 -->          여기부터 PAID:END까지 유료판에만
  <!-- PAID:END -->
  <!-- FREE:START --> ... <!-- FREE:END -->       무료판에만 (구독자 안내 등)
  <!-- PAID-TEASERS -->                           무료판에서 '완전판에 더 있는 것' 목록 자리

사용: python3 tools/build.py            # 전체 빌드
      python3 tools/build.py 12         # 12권만
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT_PAID = ROOT / "유료판"
OUT_FREE = ROOT / "무료판"

INCLUDE_RE = re.compile(r"<!--\s*INCLUDE:\s*(\S+)\s*-->")
VARS_RE = re.compile(r"<!--\s*VARS:\s*(.*?)\s*-->", re.S)
PAID_RE = re.compile(r"<!--\s*PAID:START\s*(?:\|\s*(.*?))?\s*-->(.*?)<!--\s*PAID:END\s*-->", re.S)
FREE_RE = re.compile(r"<!--\s*FREE:START\s*-->(.*?)<!--\s*FREE:END\s*-->", re.S)
TEASER_SLOT = "<!-- PAID-TEASERS -->"
COMMENT_RE = re.compile(r"<!--.*?-->\n?", re.S)


def parse_vars(text):
    m = VARS_RE.search(text)
    if not m:
        return {}, text
    pairs = {}
    for part in m.group(1).split("|"):
        if "=" in part:
            k, v = part.split("=", 1)
            pairs[k.strip()] = v.strip()
    return pairs, text[: m.start()] + text[m.end():]


def expand(text, variables, depth=0):
    if depth > 5:
        raise RuntimeError("INCLUDE nesting too deep")

    def repl(m):
        path = SRC / m.group(1)
        if not path.exists():
            raise FileNotFoundError(path)
        return expand(path.read_text(encoding="utf-8"), variables, depth + 1)

    text = INCLUDE_RE.sub(repl, text)
    for k, v in variables.items():
        text = text.replace("{{" + k + "}}", v)
    return text


def check_markers(name, text):
    starts = len(re.findall(r"<!--\s*PAID:START", text))
    ends = len(re.findall(r"<!--\s*PAID:END", text))
    if starts != ends:
        raise SystemExit(f"[{name}] PAID:START {starts}개 / PAID:END {ends}개 — 짝이 맞지 않습니다")
    left = re.findall(r"\{\{[^}]+\}\}", text)
    if left:
        raise SystemExit(f"[{name}] 치환되지 않은 변수: {sorted(set(left))}")


def tidy(text):
    text = COMMENT_RE.sub("", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def build_paid(text):
    text = FREE_RE.sub("", text)
    text = PAID_RE.sub(lambda m: m.group(2), text)
    text = text.replace(TEASER_SLOT, "")
    return tidy(text)


TEASER_PREFIX = "> 📘 **완전판에서 이어집니다** — "


def merge_teasers(text):
    """연달아 붙은 안내 상자(사이에 빈 줄·주석만 있는 경우)를 한 상자로 합친다."""
    out, run = [], []

    def flush():
        if len(run) == 1:
            out.append(TEASER_PREFIX + run[0])
        elif run:
            out.append("> 📘 **완전판에서 이어집니다**")
            out.extend(f"> - {t}" for t in run)
        if run:
            out.append("")
        run.clear()

    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.startswith(TEASER_PREFIX):
            run.append(stripped[len(TEASER_PREFIX):])
        elif run and (not stripped or COMMENT_RE.fullmatch(stripped + "\n") or stripped.startswith("<!--")):
            continue
        else:
            flush()
            out.append(line)
    flush()
    return "\n".join(out)


def build_free(text):
    teasers = []

    def cut(m):
        note = (m.group(1) or "").strip()
        if note:
            teasers.append(note)
            return f"\n> 📘 **완전판에서 이어집니다** — {note}\n"
        return ""

    text = PAID_RE.sub(cut, text)
    text = merge_teasers(text)
    text = FREE_RE.sub(lambda m: m.group(1), text)
    if TEASER_SLOT in text:
        seen, items = set(), []
        for t in teasers:
            if t not in seen:
                seen.add(t)
                items.append(f"- {t}")
        text = text.replace(TEASER_SLOT, "\n".join(items))
    return tidy(text)


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    OUT_PAID.mkdir(exist_ok=True)
    OUT_FREE.mkdir(exist_ok=True)
    srcs = sorted(SRC.glob("[0-9][0-9]_*.src.md"))
    if only:
        srcs = [p for p in srcs if p.name.startswith(only.zfill(2))]
    if not srcs:
        raise SystemExit("빌드할 소스가 없습니다")
    for path in srcs:
        raw = path.read_text(encoding="utf-8")
        variables, raw = parse_vars(raw)
        full = expand(raw, variables)
        check_markers(path.name, full)
        stem = path.name.replace(".src.md", "")
        paid = build_paid(full)
        free = build_free(full)
        (OUT_PAID / f"{stem}_완전판.md").write_text(paid, encoding="utf-8")
        (OUT_FREE / f"{stem}_MINI.md").write_text(free, encoding="utf-8")
        print(f"{stem}: 완전판 {len(paid):,}자 · 무료판 {len(free):,}자 ({len(free) / len(paid):.0%})")


if __name__ == "__main__":
    main()
