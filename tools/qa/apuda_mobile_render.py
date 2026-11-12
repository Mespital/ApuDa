#!/usr/bin/env python3
"""ApuDa public-page Chromium mobile audit. No patient notes or login access.

Local PR snapshot: python tools/qa/apuda_mobile_render.py --site-root public-site
Published public pages: python tools/qa/apuda_mobile_render.py --base-url https://apuda.app

CSS 200% zoom is a diagnostic stress test, not native browser zoom or WCAG certification.
"""
import argparse
import datetime as dt
import html as html_lib
import json
import os
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright

ROUTES = {
    "guide": ("/note-guide/", 3),
    "faq_breast": ("/library/faq/breast/", 100),
    "book_01": ("/library/first30/books/01.html", None),
}
WIDTHS = (320, 360, 390, 768)
FULL_WIDTHS = (320, 390)


def routes_for_scope(scope, site_root):
    """Discover all 30 book and 30 static FAQ URLs from the checked-out sitemap."""
    if scope == "sample":
        return ROUTES, WIDTHS
    if site_root is None:
        raise ValueError("Full scope only supports checked-out local public HTML")
    text = (site_root / "sitemap.xml").read_text(encoding="utf-8")
    books = re.findall(r"<loc>https://apuda\\.app/library/first30/books/(\\d{2})\\.html</loc>", text)
    faqs = re.findall(r"<loc>https://apuda\\.app/library/faq/([a-z0-9-]+)/</loc>", text)
    expected_books = [f"{i:02d}" for i in range(1, 31)]
    if sorted(books) != expected_books or len(books) != 30:
        raise ValueError(f"Sitemap must contain 30 unique ordered books (found {len(books)})")
    if len(faqs) != 30 or len(set(faqs)) != 30:
        raise ValueError(f"Sitemap must contain 30 distinct FAQ paths (found {len(faqs)})")
    full = {"guide": ROUTES["guide"]}
    full.update({f"book_{n}": (f"/library/first30/books/{n}.html", None) for n in books})
    full.update({f"faq_{slug}": (f"/library/faq/{slug}/", 100) for slug in sorted(faqs)})
    if len(full) != 61:
        raise ValueError(f"Expected exactly 61 public pages, found {len(full)}")
    return full, FULL_WIDTHS


def dimensions(page):
    return page.evaluate("""() => {
      const doc = document.documentElement;
      const body = document.body;
      const w = doc.clientWidth;
      const suspects = [];
      for (const el of body.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' ||
            style.position === 'fixed' || r.width === 0 || r.height === 0) continue;
        if (r.right > w + 2 || r.left < -2) {
          suspects.push({
            tag: el.tagName.toLowerCase(), id: el.id || '',
            className: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
            left: Math.round(r.left), right: Math.round(r.right),
            text: (el.innerText || '').trim().slice(0, 65)
          });
          if (suspects.length >= 12) break;
        }
      }
      return {clientWidth: w, htmlScrollWidth: doc.scrollWidth,
        bodyScrollWidth: body.scrollWidth,
        overflowPx: Math.max(0, doc.scrollWidth - w, body.scrollWidth - w),
        overflowElements: suspects};
    }""")


def small_targets(page):
    return page.evaluate("""() => [...new Set(document.querySelectorAll(
       'header nav a, .top nav a, .actions a, .faq summary, details > summary, .btn'))]
       .filter(el => {
         const s = getComputedStyle(el), r = el.getBoundingClientRect();
         return s.display !== 'none' && r.width > 0 && r.height > 0;
       })
       .map(el => ({
         text: (el.innerText || '').trim().slice(0, 50),
         height: Math.round(el.getBoundingClientRect().height),
         width: Math.round(el.getBoundingClientRect().width)
       }))
       .filter(el => el.height < 44).slice(0, 15)""")


def run(origin, out, site_root=None, scope="sample"):
    out.mkdir(parents=True, exist_ok=True)
    if site_root is None:
        parsed = urlparse(origin)
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("HTTP(S) origin without credentials is required")
        if parsed.hostname not in ("127.0.0.1", "localhost", "apuda.app"):
            raise ValueError("Allowed origins: local server and apuda.app")
        allowed_host = parsed.hostname
    else:
        site_root = site_root.resolve()
        allowed_host = None

    pages, widths = routes_for_scope(scope, site_root)
    rows = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True, executable_path=os.environ.get("CHROMIUM_BIN") or None)
        context = browser.new_context(
            locale="ko-KR", viewport={"width": 390, "height": 844},
            device_scale_factor=1, reduced_motion="reduce",
            service_workers="block", accept_downloads=False)
        # Never request third-party domains or personal accounts, even if a page links to them.
        def local_or_public(route):
            host = urlparse(route.request.url).hostname
            return route.continue_() if allowed_host is not None and host == allowed_host else route.abort()
        context.route("**/*", local_or_public)

        for name, (path, detail_count) in pages.items():
            for width in widths:
                page = context.new_page()
                page.set_viewport_size({"width": width, "height": 844})
                row = {"page": name, "route": path, "viewport_css_px": width,
                       "source": str(site_root) if site_root else origin,
                       "http_status": None, "errors": [], "warnings": []}
                try:
                    if site_root is not None:
                        file = site_root / path.lstrip("/")
                        if path.endswith("/"):
                            file = file / "index.html"
                        html = file.read_text(encoding="utf-8")
                        stylesheets = []
                        for tag in re.findall(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*>', html, re.I):
                            match = re.search(r'href=["\']([^"\']+)["\']', tag, re.I)
                            if not match:
                                continue
                            href = html_lib.unescape(match.group(1).split("?", 1)[0].split("#", 1)[0])
                            if href.startswith(("https://", "http://", "//")):
                                row["warnings"].append("External stylesheet blocked: " + href)
                                continue
                            css_file = site_root / href.lstrip("/") if href.startswith("/") else file.parent / href
                            if not css_file.is_file():
                                row["errors"].append("Missing local stylesheet: " + href)
                            else:
                                stylesheets.append(css_file.read_text(encoding="utf-8"))
                        page.set_content(html, wait_until="domcontentloaded", timeout=15000)
                        for css in stylesheets:
                            page.add_style_tag(content=css)
                        row["http_status"] = "offline-source"
                    else:
                        url = urljoin(origin.rstrip("/") + "/", path.lstrip("/"))
                        response = page.goto(url, wait_until="domcontentloaded", timeout=15000)
                        row["http_status"] = response.status if response else None
                        if row["http_status"] != 200:
                            row["errors"].append("HTTP not 200: " + str(row["http_status"]))

                    row["title"] = page.title()
                    if not row["title"].strip():
                        row["errors"].append("Missing HTML title")
                    if page.locator('meta[name="viewport"]').count() != 1:
                        row["errors"].append("Missing or duplicate viewport meta")
                    links = page.locator('link[rel="canonical"]')
                    canonical = links.first.get_attribute("href") if links.count() else None
                    if canonical != "https://apuda.app" + path:
                        row["errors"].append("Unexpected canonical: " + str(canonical))
                    row["initial"] = dimensions(page)
                    if row["initial"]["overflowPx"] > 1:
                        row["errors"].append("Horizontal overflow on load")
                    row["small_targets_under44"] = small_targets(page)
                    if row["small_targets_under44"]:
                        row["warnings"].append("44px internal target undersized; manual review")
                    faq = page.locator("details > summary")
                    row["faq_count"] = faq.count()
                    if detail_count is not None and row["faq_count"] != detail_count:
                        row["errors"].append(f"Expected {detail_count} FAQ elements, found {row['faq_count']}")
                    if row["faq_count"] > 0:
                        faq.first.click()
                        row["faq_expanded"] = faq.first.evaluate("(el) => !!el.parentElement.open")
                        if not row["faq_expanded"]:
                            row["errors"].append("FAQ did not expand")
                        row["expanded"] = dimensions(page)
                        if row["expanded"]["overflowPx"] > 1:
                            row["errors"].append("Horizontal overflow after FAQ expansion")
                    # Keep CI artifacts modest: representative screens plus every failure.
                    if scope == "sample" or name in ROUTES or row["errors"]:
                        page.screenshot(path=str(out / f"{name}_{width}.png"), full_page=True)
                    if scope == "sample" and width in (320, 390):
                        # Diagnostic only: CSS zoom 2 is not equivalent to native 200% browser zoom.
                        page.add_style_tag(content="html { zoom: 2 !important; }")
                        row["css_zoom_200_diagnostic"] = dimensions(page)
                        page.screenshot(path=str(out / f"{name}_{width}_csszoom200.png"), full_page=True)
                except Exception as exc:
                    row["errors"].append(f"{type(exc).__name__}: {str(exc)[:260]}")
                    try:
                        page.screenshot(path=str(out / f"{name}_{width}_error.png"), full_page=True)
                    except Exception:
                        pass
                rows.append(row)
                page.close()
        context.close()
        browser.close()

    (out / "results.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [
        "# ApuDa 모바일 Chromium 검사",
        "", f"- UTC: {dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}",
        "- Source: " + (str(site_root) if site_root else origin),
        f"- {len(rows)} render conditions: {len(pages)} public pages × {list(widths)} CSS px (scope={scope})",
        "- 200% CSS zoom is diagnostic only, not real browser zoom or WCAG certification",
        "- No private /note/, /nonsul/, login, VPS, database or user records are accessed",
        "- 44px controls are logged as warnings, not test failures",
        "", "| Page | Width | HTTP | Overflow(px) | FAQ count | Expanded | Warnings | Errors |",
        "|---|---:|---|---:|---:|---|---:|---|"
    ]
    for row in rows:
        lines.append(
            f"| {row['page']} | {row['viewport_css_px']} | {row['http_status']} | "
            f"{row.get('initial', {}).get('overflowPx', '—')} | "
            f"{row.get('faq_count', '—')} | {row.get('faq_expanded', '—')} | "
            f"{len(row['warnings'])} | {'; '.join(row['errors']) or 'none'} |")
    lines += [
        "", "## Interpretation", "",
        "- Source mode injects checked-out HTML and local CSS; server headers, remote fonts, and third-party resources are not reproduced.",
        "- A zero overflow value does not prove no clipping, overlap, or accessibility barriers.",
        "- Native 200% zoom, TalkBack/VoiceOver, real-device touch and clinical content still require separate testing.",
        "- A successful CI run is not Netlify production deployment or patient-data backup verification.", ""
    ]
    (out / "REPORT.md").write_text("\n".join(lines), encoding="utf-8")
    failures = sum(bool(r["errors"]) for r in rows)
    print(f"mobile audit: {len(rows)} renders, {failures} failing; reports in {out}")
    return 1 if failures else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--site-root", type=Path)
    mode.add_argument("--base-url")
    parser.add_argument("--out", type=Path, default=Path("mobile-artifacts"))
    parser.add_argument("--scope", choices=("sample", "full"), default="sample")
    args = parser.parse_args()
    raise SystemExit(run(args.base_url or "offline-source", args.out, args.site_root, args.scope))


if __name__ == "__main__":
    main()
