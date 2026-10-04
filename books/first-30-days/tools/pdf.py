#!/usr/bin/env python3
"""무료판(또는 완전판) MD → A5 인쇄용 HTML → PDF.

사용: python3 tools/pdf.py              # 무료판 12종
      python3 tools/pdf.py paid         # 완전판 12종
      python3 tools/pdf.py free 12      # 무료판 12권만
필요: pip install markdown, Chromium(CHROME 환경변수 또는 /opt/pw-browsers/chromium),
      한글 글꼴 파일(FONT 환경변수, 기본: Noto Sans KR 가변 글꼴 경로)
"""
import os
import re
import subprocess
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium")
FONT = os.environ.get("FONT", "")

CSS = """
@font-face { font-family: 'ApuDaKR'; src: url('%(font)s'); font-weight: 100 900; }
@page { size: 148mm 210mm; margin: 15mm 14mm 16mm 14mm;
  @bottom-center { content: counter(page); font-size: 8pt; color: #888; } }
* { box-sizing: border-box; }
html { font-family: 'ApuDaKR', 'Noto Sans KR', 'Noto Sans CJK KR', sans-serif; color: #333;
  font-size: 9.6pt; line-height: 1.72; word-break: keep-all; overflow-wrap: anywhere; }
h1 { color: #0B5FA5; font-size: 17pt; line-height: 1.35; margin: 0 0 4mm; break-before: page; }
h1:first-of-type { break-before: avoid; font-size: 22pt; margin-top: 8mm; }
h2 { color: #0B5FA5; font-size: 13pt; margin: 7mm 0 2.5mm; padding-bottom: 1mm;
  border-bottom: 1.2pt solid #0B5FA5; break-after: avoid; }
h3 { color: #0B5FA5; font-size: 11pt; margin: 5mm 0 2mm; break-after: avoid; }
p { margin: 0 0 2.2mm; }
ul, ol { margin: 0 0 2.5mm; padding-left: 5mm; }
li { margin: 0.6mm 0; }
blockquote { margin: 3mm 0; padding: 2.5mm 3.5mm; background: #F0F6FB;
  border-left: 3pt solid #0B5FA5; border-radius: 1.5mm; break-inside: avoid; }
blockquote p:last-child, blockquote ul:last-child { margin-bottom: 0; }
blockquote.emergency { background: #FDF1EA; border-left-color: #C25A17; }
blockquote.teaser { background: #FFF8E1; border-left-color: #F5B301; font-size: 8.8pt; }
table { width: 100%%; border-collapse: collapse; margin: 2.5mm 0 3.5mm; font-size: 8.6pt;
  break-inside: auto; }
tr { break-inside: avoid; }
th { background: #0B5FA5; color: #fff; font-weight: 700; text-align: left; padding: 1.4mm 1.8mm; }
td { border-bottom: 0.5pt solid #C9D9E8; padding: 1.4mm 1.8mm; vertical-align: top; }
tr:nth-child(even) td { background: #F7FAFD; }
code, pre { font-family: inherit; }
pre { background: #F4F4F4; padding: 2.5mm; border-radius: 1.5mm; font-size: 8.4pt;
  white-space: pre-wrap; break-inside: avoid; }
hr { border: 0; border-top: 0.6pt solid #C9D9E8; margin: 5mm 0; }
strong { color: #1a1a1a; }
.cover { text-align: left; }
.sig { position: running(sig); }
"""


LIST_RE = re.compile(r"^(\s*)([-*]|\d+\.)\s")


def normalize(md_text: str) -> str:
    """python-markdown은 목록·표 앞에 빈 줄이 있어야 인식하므로, 원고 형식을 그대로 둔 채 빈 줄을 보충한다."""
    out = []
    for line in md_text.split("\n"):
        prev = out[-1] if out else ""
        quoted = line.startswith(">")
        core = line[1:].lstrip() if quoted else line
        prev_core = (prev[1:].lstrip() if prev.startswith(">") else prev)
        starts_block = bool(LIST_RE.match(core)) or core.startswith("|")
        prev_is_same = bool(LIST_RE.match(prev_core)) or prev_core.startswith("|")
        if starts_block and prev_core.strip() and not prev_is_same and (quoted == prev.startswith(">")):
            out.append(">" if quoted else "")
        out.append(line)
    return "\n".join(out)


def to_html(md_text: str, title: str, font_url: str) -> str:
    body = markdown.markdown(normalize(md_text), extensions=["tables", "sane_lists"])
    # 응급 상자·안내 상자에 클래스 붙이기
    body = re.sub(r"<blockquote>\s*<p><strong>⚠", '<blockquote class="emergency"><p><strong>⚠', body)
    body = re.sub(r"<blockquote>\s*<p>📘", '<blockquote class="teaser"><p>📘', body)
    css = CSS % {"font": font_url}
    return f"""<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>{title}</title><style>{css}</style></head><body>{body}</body></html>"""


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "free"
    only = sys.argv[2] if len(sys.argv) > 2 else None
    src_dir = ROOT / ("무료판" if mode == "free" else "유료판")
    out_dir = ROOT / "pdf" / ("무료판" if mode == "free" else "유료판")
    out_dir.mkdir(parents=True, exist_ok=True)
    font = Path(FONT) if FONT else None
    font_url = font.resolve().as_uri() if font and font.exists() else ""
    files = sorted(src_dir.glob("[0-9][0-9]_*.md"))
    if only:
        files = [f for f in files if f.name.startswith(only.zfill(2))]
    for md in files:
        html_path = out_dir / (md.stem + ".html")
        pdf_path = out_dir / (md.stem + ".pdf")
        title = md.stem.replace("_", " ")
        html_path.write_text(to_html(md.read_text(encoding="utf-8"), title, font_url), encoding="utf-8")
        subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
                        "--no-pdf-header-footer", f"--print-to-pdf={pdf_path}",
                        html_path.resolve().as_uri()],
                       check=True, capture_output=True, timeout=180)
        html_path.unlink()
        print(f"{pdf_path.relative_to(ROOT)} ({pdf_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
