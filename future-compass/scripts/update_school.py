#!/usr/bin/env python3
"""서초고 학교 데이터 수집 (나이스 교육정보 개방포털).

- 학년·학기는 입학년도(2026)와 오늘 날짜(한국시간)로 자동 계산한다.
- 수집: 학사일정(내 학년 대상, 앞으로 60일), 쉬는 날(휴업일·공휴일·방학, 학년도 전체), 급식(이번 주~다음 주), 시간표(내 학년 전체 반, 이번 주).
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


OFF_KINDS = ('휴업일', '공휴일')
_year_rows = {}


def year_rows(today, g):
    """학년도 전체(3월~다음 해 2월) 학사일정. 한 번만 호출."""
    if 'rows' not in _year_rows:
        start = dt.date(g['school_year'], 3, 1)
        end = dt.date(g['school_year'] + 1, 2, 28)
        _year_rows['rows'] = neis('SchoolSchedule', AA_FROM_YMD=ymd(max(start, today)), AA_TO_YMD=ymd(end))
    return _year_rows['rows']


def for_my_grade(r, g):
    flags = [r.get(f) for f in GRADE_FLAG.values()]
    return r.get(GRADE_FLAG[g['grade']]) == 'Y' or all(f != 'Y' for f in flags)


def schedule(today, g):
    out = []
    limit = today + dt.timedelta(days=60)
    for r in year_rows(today, g):
        d = dt.datetime.strptime(r['AA_YMD'], '%Y%m%d').date()
        if d < today or d > limit or r.get(GRADE_FLAG[g['grade']]) != 'Y':
            continue
        name = str(r.get('EVENT_NM', '')).strip()
        if not name or name in ('토요휴업일',):
            continue
        ev = dict(date=d.isoformat(), title=name[:120])
        if str(r.get('SBTR_DD_SC_NM', '')).strip() in OFF_KINDS:
            ev['off'] = True
        out.append(ev)
    out.sort(key=lambda e: e['date'])
    return out[:40]


def closures(today, g):
    """학교가 쉬는 날(공휴일·재량휴업·방학·개교기념일 등). 학년 무관 휴업 + 내 학년 휴업."""
    out = {}
    for r in year_rows(today, g):
        kind = str(r.get('SBTR_DD_SC_NM', '')).strip()
        name = str(r.get('EVENT_NM', '')).strip()
        if kind not in OFF_KINDS or not name or name == '토요휴업일' or not for_my_grade(r, g):
            continue
        d = iso(r['AA_YMD'])
        if d >= today.isoformat():
            out.setdefault(d, dict(date=d, name=name[:40], kind=kind, source='학교'))
    return sorted(out.values(), key=lambda c: c['date'])[:200]


def special_days(today):
    """공공데이터포털 특일정보(임시공휴일 포함). DATA_GO_KR_KEY가 있을 때만."""
    key = os.environ.get('DATA_GO_KR_KEY', '').strip()
    if not key:
        return None
    out = []
    for y in (today.year, today.year + 1):
        for m in range(1, 13):
            q = urllib.parse.urlencode(dict(solYear=y, solMonth=f'{m:02d}', _type='json', numOfRows=50))
            url = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=' + key + '&' + q
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'FutureCompass-School/1.0'}), timeout=20) as res:
                body = json.loads(res.read(500_000))
            items = (((body.get('response') or {}).get('body') or {}).get('items') or {})
            items = items.get('item', []) if isinstance(items, dict) else []
            for it in ([items] if isinstance(items, dict) else items):
                if it.get('isHoliday') == 'Y':
                    d = str(it.get('locdate'))
                    out.append(dict(date=f'{d[:4]}-{d[4:6]}-{d[6:]}', name=str(it.get('dateName', '공휴일'))[:40], kind='공휴일', source='특일정보'))
    return [c for c in out if c['date'] >= today.isoformat()]


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
    for name, fn in (('schedule', lambda: schedule(today, g)), ('closures', lambda: closures(today, g)),
                     ('meals', lambda: meals(today)), ('timetable', lambda: timetable(today, g))):
        try:
            result[name] = fn()
            status[name] = 'ok'
        except Exception as e:  # 이전 값 유지
            result[name] = previous.get(name, {'classes': {}} if name == 'timetable' else [])
            status[name] = 'error: ' + type(e).__name__
    try:
        sp = special_days(today)
        if sp is not None:
            have = {c['date'] for c in result['closures']}
            result['closures'] = sorted(result['closures'] + [c for c in sp if c['date'] not in have], key=lambda c: c['date'])
            status['special_days'] = 'ok'
    except Exception as e:
        status['special_days'] = 'error: ' + type(e).__name__
    result['status'] = status
    result['secrets_seen'] = {k: os.environ.get('SEEN_' + k, '?') for k in ('NEIS', 'VPS', 'DATA')}  # 값 아님, 있음/없음만
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
