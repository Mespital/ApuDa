#!/usr/bin/env python3
"""서초고 학교 데이터 수집 (나이스 교육정보 개방포털).

- 학년·학기는 입학년도(2026)와 오늘 날짜(한국시간)로 자동 계산한다.
- 수집: 학사일정(내 학년 대상, 앞으로 60일), 급식(이번 주~다음 주), 시간표(내 학년 전체 반, 이번 주).
- NEIS_API_KEY가 없으면 인증키 없이 호출한다. 이 경우 나이스가 샘플 건수만 돌려줄 수 있어
  일부만 보일 수 있다(추정). 키를 GitHub Secrets에 넣으면 전체가 수집된다.
- 실패한 항목은 이전 값을 유지한다. 결과: dist/school.json
"""
import datetime as dt
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'dist/school.json'
SCHOOL = dict(name='서초고등학교', short='서초고', entry_year=2026, atpt='B10', code='7010087',
              homepage='https://seocho.sen.hs.kr/')
KST = dt.timezone(dt.timedelta(hours=9))


def grade_info(today):
    school_year = today.year if today.month >= 3 else today.year - 1
    raw = school_year - SCHOOL['entry_year'] + 1
    grade = min(3, max(1, raw))
    sem = 1 if 3 <= today.month <= 7 else 2
    return dict(school_year=school_year, grade=grade, raw_grade=raw, semester=sem,
                phase='before' if raw < 1 else 'graduated' if raw > 3 else 'school')


def neis(service, **params):
    key = os.environ.get('NEIS_API_KEY', '').strip()
    q = dict(Type='json', ATPT_OFCDC_SC_CODE=SCHOOL['atpt'], SD_SCHUL_CODE=SCHOOL['code'], pIndex=1, pSize=1000)
    q.update(params)
    if key:
        q['KEY'] = key
    req = urllib.request.Request('https://open.neis.go.kr/hub/' + service + '?' + urllib.parse.urlencode(q),
                                 headers={'User-Agent': 'FutureCompass-School/1.0'})
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.loads(res.read(3_000_000))
    blocks = data.get(service)
    if not blocks:
        code = data.get('RESULT', {}).get('CODE')
        if code == 'INFO-200':
            return []
        raise ValueError(f'{service}: {code}')
    return next((b['row'] for b in blocks if 'row' in b), [])


def ymd(d):
    return d.strftime('%Y%m%d')


def iso(s):
    return dt.datetime.strptime(s, '%Y%m%d').date().isoformat()


GRADE_FLAG = {1: 'ONE_GRADE_EVENT_YN', 2: 'TW_GRADE_EVENT_YN', 3: 'THREE_GRADE_EVENT_YN'}


def schedule(today, g):
    rows = neis('SchoolSchedule', AA_FROM_YMD=ymd(today), AA_TO_YMD=ymd(today + dt.timedelta(days=60)))
    out = []
    for r in rows:
        if r.get(GRADE_FLAG[g['grade']]) != 'Y':
            continue
        name = str(r.get('EVENT_NM', '')).strip()
        if not name or name in ('토요휴업일',):
            continue
        out.append(dict(date=iso(r['AA_YMD']), title=name[:120]))
    out.sort(key=lambda e: e['date'])
    return out[:40]


def clean_dish(text):
    text = re.sub(r'<br\s*/?>', '\n', str(text or ''))
    items = []
    for line in text.split('\n'):
        line = re.sub(r'\([0-9.\s]+\)', '', line).strip()   # 알레르기 번호 제거
        line = re.sub(r'\s+', ' ', line)
        if line:
            items.append(line[:40])
    return items[:12]


def meals(today):
    start = today - dt.timedelta(days=today.weekday())
    rows = neis('mealServiceDietInfo', MLSV_FROM_YMD=ymd(start), MLSV_TO_YMD=ymd(start + dt.timedelta(days=11)))
    out = []
    for r in rows:
        out.append(dict(date=iso(r['MLSV_YMD']), kind=str(r.get('MMEAL_SC_NM', '중식')), dishes=clean_dish(r.get('DDISH_NM')),
                        kcal=str(r.get('CAL_INFO', '')).strip()[:20]))
    out.sort(key=lambda m: (m['date'], m['kind']))
    return out[:30]


def timetable(today, g):
    start = today - dt.timedelta(days=today.weekday())
    if today.weekday() >= 5:              # 주말이면 다음 주
        start += dt.timedelta(days=7)
    rows = neis('hisTimetable', AY=str(g['school_year']), SEM=str(g['semester']), GRADE=str(g['grade']),
                TI_FROM_YMD=ymd(start), TI_TO_YMD=ymd(start + dt.timedelta(days=4)))
    classes = {}
    for r in rows:
        cls = str(r.get('CLASS_NM', '')).strip()
        if not cls:
            continue
        day = iso(r['ALL_TI_YMD'])
        try:
            period = int(r.get('PERIO'))
        except (TypeError, ValueError):
            continue
        subject = str(r.get('ITRT_CNTNT', '')).strip().lstrip('-').strip()[:30]
        classes.setdefault(cls, {}).setdefault(day, {})[period] = subject
    out = {}
    for cls, days in classes.items():
        out[cls] = {d: [days[d].get(p, '') for p in range(1, max(days[d]) + 1)] for d in sorted(days)}
    return dict(week_start=start.isoformat(), classes=dict(sorted(out.items(), key=lambda kv: (len(kv[0]), kv[0]))))


def main():
    now = dt.datetime.now(dt.timezone.utc)
    today = now.astimezone(KST).date()
    g = grade_info(today)
    previous = json.loads(DEST.read_text()) if DEST.exists() else {}
    keyed = bool(os.environ.get('NEIS_API_KEY', '').strip())
    result = dict(school=SCHOOL, checked_at=now.isoformat(), keyed=keyed, **g)
    status = {}
    for name, fn in (('schedule', lambda: schedule(today, g)), ('meals', lambda: meals(today)),
                     ('timetable', lambda: timetable(today, g))):
        try:
            result[name] = fn()
            status[name] = 'ok'
        except Exception as e:  # 이전 값 유지
            result[name] = previous.get(name, [] if name != 'timetable' else {'classes': {}})
            status[name] = 'error: ' + type(e).__name__
    result['status'] = status
    if any(v == 'ok' for v in status.values()):
        result['last_success_at'] = now.isoformat()
    else:
        result['last_success_at'] = previous.get('last_success_at')
    tmp = DEST.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    os.replace(tmp, DEST)
    print(f"School data grade {g['grade']}-{g['semester']} keyed={keyed} status={status}")


if __name__ == '__main__':
    main()
