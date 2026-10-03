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
AI_WORDS = re.compile(r'\b(ai|artificial intelligence|gemini|deepmind|machine learning|robot|llm|alphafold|generative|education|learning|classroom|student|study|teacher)\b', re.I)

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


def school_data(now, previous):
    key = os.environ.get('NEIS_API_KEY', '').strip()
    base = dict(name='서초고등학교', grade=1, checked_at=now.isoformat(),
                homepage='https://seocho.sen.hs.kr/', events=[])
    if not key:
        return dict(base, status='key_required', message='학교 일정 자동 수집은 NEIS_API_KEY 설정 후 시작합니다. 인증키 없는 샘플 일정은 표시하지 않습니다.')
    try:
        today = now.astimezone(dt.timezone(dt.timedelta(hours=9))).date()
        params = dict(KEY=key, Type='json', ATPT_OFCDC_SC_CODE='B10',
                      SD_SCHUL_CODE='7010087', AA_FROM_YMD=today.strftime('%Y%m%d'),
                      AA_TO_YMD=(today+dt.timedelta(days=90)).strftime('%Y%m%d'), pSize=1000)
        req = urllib.request.Request('https://open.neis.go.kr/hub/SchoolSchedule?'+urllib.parse.urlencode(params))
        with urllib.request.urlopen(req, timeout=25) as response:
            data = json.loads(response.read(2000000))
        blocks = data.get('SchoolSchedule')
        if not blocks:
            if data.get('RESULT', {}).get('CODE') == 'INFO-200':
                return dict(base, status='ok', message='현재 공개된 일정이 없습니다.', last_success_at=now.isoformat())
            raise ValueError('NEIS response')
        rows = next((b['row'] for b in blocks if 'row' in b), [])
        events = []
        for r in rows:
            if r.get('SCHUL_NM') != '서초고등학교' or r.get('ONE_GRADE_EVENT_YN') != 'Y': continue
            date = dt.datetime.strptime(r['AA_YMD'], '%Y%m%d').date().isoformat()
            events.append(dict(date=date, title=str(r.get('EVENT_NM',''))[:200]))
        return dict(base, status='ok', events=events, last_success_at=now.isoformat(),
                    message='나이스 공개 학사일정 중 1학년 대상 일정입니다. 최종 일정은 학교 공지를 확인하세요.')
    except Exception:
        old = previous.get('school', {})
        return dict(base, status='error', events=old.get('events', []),
                    last_success_at=old.get('last_success_at'),
                    message='학교 일정 수집 실패. 이전 일정은 유지하며 학교 공지 확인이 필요합니다.')

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
    result = dict(checked_at=now.isoformat(), last_success_at=now.isoformat() if successes else previous.get('last_success_at'), failures=failures, articles=articles, school=school_data(now, previous))
    temporary = dest.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    os.replace(temporary, dest)
    print(f'Official news: {len(found)} collected, {len(articles)} retained; failed sources: {", ".join(failures) or "none"}')
    if not successes: raise SystemExit(1)

if __name__ == '__main__': main()
