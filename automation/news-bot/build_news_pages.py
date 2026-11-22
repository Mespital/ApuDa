#!/usr/bin/env python3
"""ApuDa daily news briefing static pages.

Reads public-site/news/data/YYYY-MM-DD.json (written by news_bot.py) and writes
crawlable, server-rendered HTML so each day's briefing can be indexed:

  public-site/news/daily/YYYY-MM-DD/index.html   one page per report
  public-site/news/daily/index.html              archive index
  public-site/news/sitemap.xml                   news-only sitemap (listed in robots.txt)

Only ApuDa's own generated text (briefing, insight, trends) and article
metadata (title, publisher, time, link) are published. Article summaries are
excerpts of the original reports and are deliberately NOT reproduced.
Idempotent: every run re-renders all pages from the data files.
"""
import argparse
import html
import json
import re
from datetime import datetime
from pathlib import Path

ORIGIN = "https://apuda.app"
DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})\.json$")
SHARE_IMAGE = ORIGIN + "/og.jpg"

STYLE = """<style>
:root{--blue:#0B5FA5;--gold:#F5B301;--ink:#1d2733;--muted:#5d6b7a;--line:#dce8f5}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:var(--ink);background:#f6f9fc;line-height:1.7}
a{color:var(--blue)}.top{display:flex;gap:16px;justify-content:space-between;align-items:center;padding:14px 20px;background:#fff;border-bottom:1px solid var(--line);font-weight:800}
.top a{text-decoration:none}.wrap{max-width:860px;margin:0 auto;padding:20px 18px 48px}
.crumb{font-size:14px;color:var(--muted)}h1{font-size:26px;line-height:1.35;margin:10px 0 6px}
.meta{color:var(--muted);font-size:14px}.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;margin:16px 0}
.lead{font-size:17px}h2{font-size:20px;margin:28px 0 8px}ol.news{padding-left:22px}ol.news li{margin:0 0 14px}
.tags{font-size:13px;color:var(--muted)}.notice{font-size:13px;color:var(--muted);background:#fff8e6;border:1px solid #f3dc9b;border-radius:10px;padding:10px 12px}
.pager{display:flex;justify-content:space-between;gap:12px;margin-top:24px;font-weight:700}ul.days{list-style:none;padding:0}ul.days li{padding:12px 0;border-bottom:1px solid var(--line)}
footer{margin-top:32px;font-size:13px;color:var(--muted)}
</style>"""


def esc(value):
    return html.escape(str(value or ""), quote=True)


def ko_date(day):
    d = datetime.strptime(day, "%Y-%m-%d")
    return f"{d.year}년 {d.month}월 {d.day}일"


def fmt_time(value):
    try:
        d = datetime.fromisoformat(value)
        return f"{d.month}/{d.day} {d.hour:02d}:{d.minute:02d}"
    except (TypeError, ValueError):
        return ""


def first_url(item):
    urls = item.get("source_urls") or []
    if isinstance(urls, list) and urls:
        first = urls[0]
        return first.get("url") if isinstance(first, dict) else first
    return item.get("source_url") or item.get("url") or ""


def page_path(day):
    return f"/news/daily/{day}/"


def json_ld(data):
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def render_day(report, prev_day, next_day):
    day = report["report_date"]
    url = ORIGIN + page_path(day)
    title = f"{ko_date(day)} 제약·의료·항암 뉴스 브리핑 | ApuDa"
    briefing = (report.get("briefing") or "").strip()
    description = (f"{ko_date(day)} 제약·의료 뉴스 브리핑. " + briefing)[:160]
    window = report.get("collection_window") or {}
    published = window.get("end") or f"{day}T09:00:00+09:00"
    org = {"@type": "Organization", "name": "ApuDa", "url": ORIGIN + "/"}
    data = [
        {"@context": "https://schema.org", "@type": "Article", "headline": title,
         "description": description, "mainEntityOfPage": url, "inLanguage": "ko",
         "datePublished": published, "author": org, "publisher": org,
         "isAccessibleForFree": True, "articleSection": "제약·의료 뉴스 브리핑"},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ApuDa", "item": ORIGIN + "/"},
            {"@type": "ListItem", "position": 2, "name": "뉴스 브리핑", "item": ORIGIN + "/news/"},
            {"@type": "ListItem", "position": 3, "name": "지난 브리핑", "item": ORIGIN + "/news/daily/"},
            {"@type": "ListItem", "position": 4, "name": ko_date(day), "item": url}]},
    ]

    items = []
    for item in report.get("top_news") or []:
        link = first_url(item)
        name = esc(item.get("title") or item.get("canonical_issue"))
        head = f'<a href="{esc(link)}" rel="noopener" target="_blank">{name}</a>' if link else name
        pubs = ", ".join(item.get("publishers") or [])
        cats = " · ".join(item.get("category") or [])
        when = fmt_time(item.get("published_at"))
        why = (item.get("importance") or "").strip()
        items.append(f'<li><strong>{head}</strong><div class="tags">{esc(pubs)}'
                     f'{" · " + esc(when) if when else ""}{" · " + esc(cats) if cats else ""}</div>'
                     f'{f"<p>{esc(why)}</p>" if why else ""}</li>')

    trends = []
    for t in report.get("trends") or []:
        trends.append(f'<li><strong>{esc(t.get("title"))}</strong> — {esc(t.get("implication") or t.get("change"))}</li>')

    insight = (report.get("insight") or "").strip()
    prev_link = f'<a href="{page_path(prev_day)}">← {ko_date(prev_day)}</a>' if prev_day else "<span></span>"
    next_link = f'<a href="{page_path(next_day)}">{ko_date(next_day)} →</a>' if next_day else "<span></span>"
    sources = ", ".join(report.get("sources") or [])

    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article"><meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{SHARE_IMAGE}"><meta property="og:site_name" content="아프다 ApuDa">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#f1f7fc">
<script type="application/ld+json">{json_ld(data)}</script>
{STYLE}</head><body>
<header class="top"><a href="/">ApuDa · 아프지만, 다행이다</a><a href="/news/">오늘의 브리핑</a></header>
<main class="wrap">
<nav class="crumb" aria-label="현재 위치"><a href="/">ApuDa</a> › <a href="/news/">뉴스 브리핑</a> › <a href="/news/daily/">지난 브리핑</a> › {ko_date(day)}</nav>
<h1>{ko_date(day)} 제약·의료·항암 뉴스 브리핑</h1>
<p class="meta">수집 기간: 전날 09:00 ~ 당일 09:00(KST) · 출처: {esc(sources)}</p>
<div class="card"><p class="lead">{esc(briefing)}</p>{f'<p>{esc(insight)}</p>' if insight else ''}</div>
<h2>주요 뉴스</h2>
<ol class="news">{''.join(items) or '<li>이 날은 원문 게시시각이 확인된 주요 기사가 없었습니다.</li>'}</ol>
{f'<h2>흐름 정리</h2><ul>{"".join(trends)}</ul>' if trends else ''}
<p class="notice">기사 제목을 누르면 언론사 원문으로 이동합니다. ApuDa는 원문 게시시각을 확인한 기사만 모아 요약하며, 기사 본문은 옮기지 않습니다. 이 브리핑은 산업·정책 동향 정보이며 개인의 진단·치료를 대신하지 않습니다.</p>
<nav class="pager" aria-label="날짜 이동">{prev_link}<a href="/news/daily/">전체 목록</a>{next_link}</nav>
<footer>© ApuDa · <a href="/news/">오늘의 브리핑</a> · <a href="/news/oncology/">항암제 뉴스</a></footer>
</main></body></html>
"""


def render_index(reports):
    url = ORIGIN + "/news/daily/"
    title = "지난 제약·의료·항암 뉴스 브리핑 모아보기 | ApuDa"
    description = "ApuDa가 매일 오전 9시 정리하는 제약·의료·항암 뉴스 브리핑의 날짜별 모음입니다. 정책·급여, 신약·임상, 항암 정밀의료 흐름을 날짜별로 확인하세요."
    rows = []
    for r in reports:
        brief = (r.get("briefing") or "").strip()
        first = re.split(r"(?<=[.다요])\s", brief, maxsplit=1)[0][:120]
        rows.append(f'<li><a href="{page_path(r["report_date"])}"><strong>{ko_date(r["report_date"])}</strong></a>'
                    f'<div class="tags">{esc(first)}</div></li>')
    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{SHARE_IMAGE}"><meta property="og:site_name" content="아프다 ApuDa">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#f1f7fc">
{STYLE}</head><body>
<header class="top"><a href="/">ApuDa · 아프지만, 다행이다</a><a href="/news/">오늘의 브리핑</a></header>
<main class="wrap">
<nav class="crumb" aria-label="현재 위치"><a href="/">ApuDa</a> › <a href="/news/">뉴스 브리핑</a> › 지난 브리핑</nav>
<h1>지난 뉴스 브리핑 모아보기</h1>
<p class="meta">매일 오전 9시(KST) 전날 9시 이후 게시된 제약·의료 기사를 확인해 정리합니다. 총 {len(reports)}일.</p>
<ul class="days">{''.join(rows)}</ul>
<footer>© ApuDa · <a href="/news/">오늘의 브리핑</a></footer>
</main></body></html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", default=".")
    args = ap.parse_args()
    site = Path(args.repo_root).resolve() / "public-site"
    data_dir = site / "news" / "data"
    out_dir = site / "news" / "daily"

    reports = []
    for f in sorted(data_dir.iterdir()):
        if not DATE_RE.match(f.name):
            continue
        try:
            r = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if r.get("report_date") == f.stem:
            reports.append(r)
    reports.sort(key=lambda r: r["report_date"])
    days = [r["report_date"] for r in reports]

    for i, r in enumerate(reports):
        prev_day = days[i - 1] if i > 0 else None
        next_day = days[i + 1] if i + 1 < len(days) else None
        target = out_dir / r["report_date"] / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(render_day(r, prev_day, next_day), encoding="utf-8")

    newest_first = list(reversed(reports))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(render_index(newest_first), encoding="utf-8")

    urls = [f"  <url><loc>{ORIGIN}/news/daily/</loc>" +
            (f"<lastmod>{days[-1]}</lastmod>" if days else "") + "</url>"]
    urls += [f"  <url><loc>{ORIGIN}{page_path(d)}</loc><lastmod>{d}</lastmod></url>" for d in reversed(days)]
    (site / "news" / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n",
        encoding="utf-8")
    print(json.dumps({"news_daily_pages": len(reports), "latest": days[-1] if days else None}))


if __name__ == "__main__":
    main()
