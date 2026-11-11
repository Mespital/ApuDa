#!/usr/bin/env python3
"""Idempotent, read-from-daily-data SEO fallback for /news/ (no network).

Run only in a news-publishing checkout after daily JSON is generated.
The fenced HTML is the only part of index.html that this script may change.
"""

import argparse
from datetime import date
from html import escape
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlparse

from editorial_quality import excluded_from_top

START = "<!-- APUDA_NEWS_SNAPSHOT_START -->"
END = "<!-- APUDA_NEWS_SNAPSHOT_END -->"
DAILY_PATH = re.compile(r"^/news/data/(20\d{2}-\d{2}-\d{2})\.json$")
PUBLISHER_DOMAINS = (
    "dailypharm.com", "bosa.co.kr", "medipana.com", "kpanews.co.kr"
)


def safe_article_url(article):
    """Use a recognized HTTPS publication domain, never scraped arbitrary HTML."""
    candidates = article.get("source_urls") or []
    if not candidates:
        candidates = [v.get("url") for v in (article.get("source_links") or []) if isinstance(v, dict)]
    for candidate in candidates:
        if not isinstance(candidate, str):
            continue
        try:
            parsed = urlparse(candidate)
        except ValueError:
            continue
        host = (parsed.hostname or "").lower()
        if (parsed.scheme == "https" and parsed.username is None
                and parsed.password is None
                and any(host == domain or host.endswith("." + domain) for domain in PUBLISHER_DOMAINS)):
            return candidate
    return None


def snapshot_markup(report):
    report_date = str(report.get("report_date") or "")
    date.fromisoformat(report_date)
    rows = []
    for article in report.get("top_news") or []:
        if not isinstance(article, dict):
            continue
        title = str(article.get("title") or "").strip()
        if not title or excluded_from_top(title):
            continue
        url = safe_article_url(article)
        if not url:
            continue
        publishers = article.get("publishers") or []
        source = str(publishers[0]) if publishers else "원문"
        rows.append(
            '    <li><a href="' + escape(url, quote=True)
            + '" target="_blank" rel="noopener noreferrer">'
            + escape(title) + '</a> <small>' + escape(source) + '</small></li>'
        )
        if len(rows) == 5:
            break

    lines = [
        '  <h2 id="staticNewsHeading">마지막 공개 뉴스 브리핑</h2>',
        '  <p>보고일 <time datetime="' + report_date + '">' + report_date
        + '</time> 기준 자료입니다. 최신 기사가 아닐 수 있으므로 변경된 치료·정책 정보는 원문과 의료진을 통해 확인해 주세요.</p>',
    ]
    if rows:
        lines += ['  <ol>', *rows, '  </ol>']
    else:
        lines.append('  <p>이 보고일에 확인된 주요 원문 링크가 없습니다.</p>')
    lines.append('  <a class="archive-link" href="/news/?date=' + report_date
                 + '">해당 날짜 브리핑 보기</a>')
    return "\n".join(lines)


def update_html(index_html, report):
    if index_html.count(START) != 1 or index_html.count(END) != 1:
        raise ValueError("Exactly one static snapshot marker pair is required")
    before, tail = index_html.split(START, 1)
    _, after = tail.split(END, 1)
    if before.count(END) or after.count(START):
        raise ValueError("Static snapshot markers out of order")
    return before + START + "\n" + snapshot_markup(report) + "\n" + END + after


def generate(repo_root):
    root = Path(repo_root).resolve()
    data_dir = root / "public-site" / "news" / "data"
    latest = json.loads((data_dir / "latest.json").read_text(encoding="utf-8"))
    match = DAILY_PATH.fullmatch(str(latest.get("path") or ""))
    if not match:
        raise ValueError("Invalid latest.json daily path")
    daily_path = data_dir / (match.group(1) + ".json")
    report = json.loads(daily_path.read_text(encoding="utf-8"))
    if report.get("report_date") != match.group(1):
        raise ValueError("Report date does not match latest.json path")

    html_path = root / "public-site" / "news" / "index.html"
    current = html_path.read_text(encoding="utf-8")
    updated = update_html(current, report)
    if current == updated:
        return False

    # Atomic replacement avoids leaving a truncated public HTML document.
    old_mode = html_path.stat().st_mode & 0o777
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=html_path.parent,
                                         prefix=".news-snapshot-", delete=False) as out:
            temp_path = Path(out.name)
            out.write(updated)
        os.chmod(temp_path, old_mode)
        os.replace(temp_path, html_path)
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
    return True


def main():
    parser = argparse.ArgumentParser(description="Refresh ApuDa static news snapshot")
    parser.add_argument("--repo-root", required=True)
    args = parser.parse_args()
    print("Static briefing changed:" if generate(args.repo_root) else "Static briefing unchanged")


if __name__ == "__main__":
    main()
