"""Conservative editorial gates for ApuDa's patient-oriented news TOP list.

This module is deliberately pure Python and has no network, publishing, or
health-record access. Raw verified articles stay in the daily source archive;
only the curated TOP list excludes unmistakably non-news editorial items.
"""

import re


_NON_NEWS_HEADLINES = (
    ("obituary", re.compile(r"(?:\[?부고\]?|별세|빙부상|빙모상|장인상|장모상|시부상|시모상|발인|빈소)")),
    ("obituary", re.compile(r"(?:기자|대표|회장|교수|의원|사장|부사장).{0,14}(?:모친|부친)\s*$")),
    ("sports_event", re.compile(r"(?:테니스|골프|볼링|탁구|배드민턴|야구|축구|체육)\s*대회|친선\s*(?:경기|축구|골프)")),
    ("publicity_event", re.compile(r"홍보인\s*한자리|홍보\s*담당자.{0,10}한자리")),
)


def excluded_from_top(title):
    """Return a narrow exclusion reason, or None, using the headline only.

    Do not infer clinical importance from an article body with incidental
    keywords, and do not remove these articles from publisher/source listings.
    """
    headline = str(title or "").strip()
    for reason, pattern in _NON_NEWS_HEADLINES:
        if pattern.search(headline):
            return reason
    return None


def keyword_mentioned(keyword, text):
    """Avoid counting '약가' inside '식의약가족' as pharmaceutical pricing.

    For short Korean category nouns '약가' and '수가', require the left edge
    not to be another Hangul syllable. Longer, specific keywords retain the
    current substring matching behavior so existing classification remains.
    """
    keyword = str(keyword or "").lower()
    text = str(text or "").lower()
    if not keyword:
        return False
    if keyword in {"약가", "수가"}:
        return bool(re.search(r"(?<![가-힣])" + re.escape(keyword), text))
    return keyword in text


def curated_top_articles(articles, limit):
    """Select from an article list without changing the source archive."""
    return sorted(
        (article for article in articles if not excluded_from_top(article.title)),
        key=lambda article: (article.score, article.published_at or ""),
        reverse=True,
    )[:limit]
