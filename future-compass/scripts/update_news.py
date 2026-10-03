#!/usr/bin/env python3
"""Collect official AI RSS titles. Atomic updates, deduplication and dated fallback."""
import datetime as dt
import email.utils
import json
import os
from pathlib import Path
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FEEDS = [('Google', 'https://blog.google/rss/'), ('OpenAI', 'https://openai.com/news/rss.xml')]
HOSTS = {'openai.com', 'blog.google', 'deepmind.google', 'www.anthropic.com'}
AI_WORDS = re.compile(r'\b(ai|artificial intelligence|gemini|deepmind|machine learning|robot|llm|alphafold|generative)\b', re.I)

def classify(title):
    low = title.lower()
    if any(w in low for w in ('privacy', 'private', 'security', 'safety', 'secure')): return '안전·보안', 'security'
    if any(w in low for w in ('robot', 'device', 'pixel', 'wearable')): return '로봇·기기', 'robots'
    if any(w in low for w in ('education', 'learning', 'classroom', 'student')): return '교육·생활', 'education'
    if any(w in low for w in ('weather', 'climate', 'science', 'alphafold', 'energy')): return '과학·환경', 'energy'
    return 'AI·컴퓨팅', 'ai'

def parse_feed(raw, source, now):
    root = ET.fromstring(raw)
    result = []
    for item in list(root.findall('.//item')) + list(root.findall('.//{http://www.w3.org/2005/Atom}entry')):
        def value(name):
            el = item.find(name)
            if el is None: el = item.find('{http://www.w3.org/2005/Atom}' + name)
            return (el.text or '').strip() if el is not None else ''
        title, url = value('title'), value('link')
        if not url:
            links = item.findall('{http://www.w3.org/2005/Atom}link')
            url = next((el.get('href','') for el in links if el.get('rel','alternate')=='alternate'), '')
        try:
            u = urllib.parse.urlparse(url)
            if u.scheme != 'https' or u.hostname not in HOSTS: continue
            timestamp = value('pubDate') or value('published') or value('updated')
            try: published = email.utils.parsedate_to_datetime(timestamp)
            except (ValueError, TypeError): published = dt.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            if published.tzinfo is None: published = published.replace(tzinfo=dt.timezone.utc)
            if published > now + dt.timedelta(minutes=10) or published < now - dt.timedelta(days=45): continue
        except (ValueError, TypeError): continue
        if not title or (source == 'Google' and not AI_WORDS.search(title + ' ' + url)): continue
        category, domain = classify(title)
        result.append(dict(title=title[:350], url=url, source=source, published_at=published.isoformat(), category=category, domain=domain))
    return result

def main():
    dest = ROOT / 'dist/news.json'
    previous = json.loads(dest.read_text()) if dest.exists() else {'articles': []}
    now = dt.datetime.now(dt.timezone.utc)
    found, failures, successes = [], [], 0
    for source, url in FEEDS:
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'FutureCompass-RSS/1.0'})
            with urllib.request.urlopen(req, timeout=25) as response: raw = response.read(2_000_001)
            if len(raw) > 2_000_000: raise ValueError('feed size')
            found.extend(parse_feed(raw, source, now))
            successes += 1
        except Exception:
            failures.append(source)
    # Retain prior verified entries if a feed fails. Date ordering makes stale items visible.
    unique = {a['url']: a for a in previous.get('articles', [])}
    unique.update({a['url']: a for a in found})
    articles = sorted(unique.values(), key=lambda a:a['published_at'], reverse=True)[:30]
    result = dict(checked_at=now.isoformat(), last_success_at=now.isoformat() if successes else previous.get('last_success_at'), failures=failures, articles=articles)
    temporary = dest.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    os.replace(temporary, dest)
    print(f'Official news: {len(found)} collected, {len(articles)} retained; failed sources: {", ".join(failures) or "none"}')
    if not successes: raise SystemExit(1)

if __name__ == '__main__': main()
