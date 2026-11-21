"""Rebuild additional CSAT subject indexes and explicitly qualified classifications."""
import argparse
import collections
import concurrent.futures
import hashlib
import io
import itertools
import json
import re
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
GROUPS = {
    'social': ('사회탐구', 'csat-extended-social-review.json', 'extended-social-type-analysis.json'),
    'science': ('과학탐구', 'csat-science-type-review.json', 'science-type-analysis.json'),
    'vocation': ('직업탐구', 'csat-vocation-type-review.json', 'vocation-type-analysis.json'),
    'languages': ('제2외국어/한문', 'csat-language-type-review.json', 'language-type-analysis.json'),
}
QUESTION = re.compile(r'^(\d{1,2})\s*\.')
SHARED = re.compile(r'[\[［【]\s*(\d{1,2})\s*[~～∼〜－–-]\s*(\d{1,2})\s*[\]］】]')


def source_pdfs(review, archive, cache):
    resources = {r['id']: r for r in archive['resources']}
    groups = {}
    for paper in review['papers']:
        groups.setdefault(paper['resourceId'], []).append(paper)

    def fetch(group):
        resource_id, papers = group
        resource = resources[resource_id]
        paths = {p['fileId']: cache / f"{p['year']}-{p['courseId']}-{p['fileId']}.pdf" for p in papers}
        if not all(path.exists() for path in paths.values()):
            raw = urllib.request.urlopen(resource['url'], timeout=90).read()
            if raw.startswith(b'PK'):
                with zipfile.ZipFile(io.BytesIO(raw)) as bundle:
                    for entry in bundle.infolist():
                        name = entry.filename
                        if not entry.flag_bits & 2048:
                            name = name.encode('cp437').decode('cp949')
                        file_id = hashlib.sha256(f'{name}|{entry.CRC}|{entry.file_size}'.encode()).hexdigest()[:24]
                        if file_id in paths:
                            paths[file_id].write_bytes(bundle.read(entry))
            elif len(papers) == 1 and papers[0]['fileId'] == 'paper':
                paths['paper'].write_bytes(raw)
        result = []
        for paper in papers:
            path = paths[paper['fileId']]
            raw = path.read_bytes()
            if not raw.startswith(b'%PDF-') or hashlib.sha256(raw).hexdigest() != paper['pdfSha256']:
                raise ValueError(f"Source changed; review required: {paper['year']} {paper['courseId']}")
            result.append((paper, resource, path))
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        return [item for group in pool.map(fetch, groups.items()) for item in group]


def extract(paper, path, domain):
    doc = fitz.open(path)
    total = 30 if domain == '제2외국어/한문' else 20
    lines, form = [], 'single'
    for page_index, page in enumerate(doc):
        text = re.sub(r'\s+', '', page.get_text())
        if '짝수형' in text:
            break
        if '홀수형' in text:
            form = 'odd'
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                value = ''.join(s['text'] for s in line['spans']).strip()
                if value:
                    lines.append({'text': value, 'page': page_index + 1, 'box': [round(v, 2) for v in line['bbox']], 'fontSize': max(s['size'] for s in line['spans'])})
    candidates = [(int(match[1]), line) for line in lines if (match := QUESTION.match(line['text'])) and 1 <= int(match[1]) <= total and line['fontSize'] >= 11.5]
    columns = [x for x, _ in collections.Counter(round(line['box'][0], 1) for _, line in candidates).most_common(8)]
    possible = []
    for pair in itertools.combinations(columns, 2):
        if not min(pair) < doc[0].rect.width / 2 < max(pair):
            continue
        markers = [(n, line) for n, line in candidates if any(abs(line['box'][0] - x) < 3 for x in pair)]
        if len(markers) == total and {n for n, _ in markers} == set(range(1, total + 1)):
            possible.append((pair, markers))
    if not possible:
        raise ValueError(f"Missing or duplicate source question: {paper['year']} {paper['courseId']}")
    pair, markers = possible[0]
    found = {}
    for number, line in sorted(markers):
        page = doc[line['page'] - 1]
        left = line['box'][0] < page.rect.width / 2
        following = [other['box'][1] for _, other in markers if other['page'] == line['page'] and (other['box'][0] < page.rect.width / 2) == left and other['box'][1] > line['box'][1] + 5]
        following += [other['box'][1] - 2 for other in lines if other['page'] == line['page'] and (other['box'][0] < page.rect.width / 2) == left and other['box'][1] > line['box'][1] + 5 and (section := SHARED.search(other['text'])) and 1 <= int(section[1]) < int(section[2]) <= total]
        rect = fitz.Rect(max(0, min(pair) - 15) if left else page.rect.width / 2, line['box'][1] - 2, page.rect.width / 2 if left else page.rect.width - 30, min(following) - 2 if following else page.rect.height - 40)
        text = re.sub(r'\s+', '', page.get_text(clip=rect))
        points = (1 if '[1점]' in text else 2) if total == 30 else (3 if '[3점]' in text else 2)
        found[number] = {'page': line['page'], 'box': line['box'], 'points': points}
    if sum(r['points'] for r in found.values()) != 50:
        raise ValueError(f"Source score mismatch: {paper['year']} {paper['courseId']}")
    return found, form, len(doc), [round(doc[0].rect.width, 2), round(doc[0].rect.height, 2)]


def build(group, cache):
    domain, review_name, output_name = GROUPS[group]
    review = json.loads((ROOT / 'scripts/data' / review_name).read_text())
    archive = json.loads((ROOT / 'dist/gichul/data/archive.json').read_text())
    types = {}
    links = {}
    for course in review['courses'].values():
        types.update(course['types'])
        links.update(course.get('practiceLinks', {}))
    records, papers = [], []
    for paper, resource, path in source_pdfs(review, archive, cache):
        if paper['courseId'] == 'vocation-career' and paper['year'] < 2022:
            raise ValueError('Career course did not exist before 2022')
        if paper['courseId'].startswith('vocation-legacy-') and paper['year'] > 2021:
            raise ValueError('Historical vocational course must remain separate')
        positions_path = cache / f"positions-v1-{paper['pdfSha256']}.json"
        if positions_path.exists():
            saved = json.loads(positions_path.read_text())
            found = {int(n): item for n, item in saved['found'].items()}
            form, page_count, size = saved['form'], saved['pageCount'], saved['pageSize']
            doc = fitz.open(path)
            expected_count = 30 if domain == '제2외국어/한문' else 20
            if set(found) != set(range(1, expected_count + 1)) or sum(r['points'] for r in found.values()) != 50 or len(doc) != page_count or size != [round(doc[0].rect.width, 2), round(doc[0].rect.height, 2)]:
                raise ValueError('Invalid cached source positions')
            for item in found.values():
                box = item['box']
                if not 1 <= item['page'] <= page_count or not 0 <= box[0] < box[2] <= size[0] or not 0 <= box[1] < box[3] <= size[1]:
                    raise ValueError('Invalid cached source bounds')
        else:
            found, form, page_count, size = extract(paper, path, domain)
            positions_path.write_text(json.dumps({'found': found, 'form': form, 'pageCount': page_count, 'pageSize': size}))
        course = review['courses'][paper['courseId']]
        labels = course['labels'][str(paper['year'])]
        if set(found) != {int(n) for n in labels}:
            raise ValueError(f"Review/source mismatch: {paper['year']} {paper['courseId']}")
        for number, item in found.items():
            label = labels[str(number)]
            type_id = label.get('typeId')
            status = label.get('reviewStatus', 'needs-review')
            if type_id:
                meta = types[type_id]
                if status not in ['reviewed', 'rule-assisted'] or meta['courseId'] != paper['courseId'] or meta['unit'] not in course['unitOrder']:
                    raise ValueError('Invalid classification, status or unit')
            elif status != 'needs-review':
                raise ValueError('Unresolved questions must be explicit')
            records.append({'id': f"official-{paper['year']}-{paper['courseId']}-{form}-{number:02d}", 'year': paper['year'], 'courseId': paper['courseId'], 'questionNumber': number, 'typeId': type_id, 'unit': types[type_id]['unit'] if type_id else None, 'form': form, 'resourceId': paper['resourceId'], 'fileId': paper['fileId'], 'page': item['page'], 'box': item['box'], 'points': item['points'], 'questionStyle': label.get('questionStyle') or '추가 대조 필요', 'reviewStatus': status, 'examStructure': 'single-paper', 'basis': '원문 발문·자료·선택지의 학습 주제 분류; 검토 상태를 별도로 표시'})
        papers.append({**paper, 'sourceUrl': resource['url'], 'pdfPageCount': page_count, 'pageSize': size, 'form': form})
    records.sort(key=lambda r: (r['year'], r['courseId'], r['questionNumber']))
    expected = {'social': 1400, 'science': 1600, 'vocation': 1520, 'languages': 2700}[group]
    if len(records) != expected:
        raise ValueError(f'Incomplete subject coverage: {group}: {len(records)} != {expected}')
    keys = {(r['year'], r['courseId'], r['form'], r['questionNumber']) for r in records}
    if len(keys) != len(records):
        raise ValueError('Duplicate question placement')
    for topic, type_id in links.items():
        if type_id not in types:
            raise ValueError(f'Unknown practice mapping: {topic}')
    indexed_counts = dict(collections.Counter(r['courseId'] for r in records))
    counts = {course_id: sum(r['courseId'] == course_id and bool(r['typeId']) for r in records) for course_id in indexed_counts}
    scope = {'domain': domain, 'years': sorted({r['year'] for r in records}), 'courseCounts': counts, 'indexedCourseCounts': indexed_counts, 'courseYears': {course_id: sorted({r['year'] for r in records if r['courseId'] == course_id}) for course_id in indexed_counts}, 'unitsByCourse': {course_id: course['unitOrder'] for course_id, course in review['courses'].items()}, 'expectedCount': len(records), 'classifiedCount': sum(counts.values()), 'pendingCount': len(records) - sum(counts.values())}
    result = {'schemaVersion': 1, 'updatedAt': review['reviewedAt'], 'classificationMethod': '발문·자료의 규칙 보조 분류와 개별 원문 대조; 판단이 남은 문항은 통계에서 제외', 'scope': scope, 'types': types, 'practiceLinks': links, 'papers': papers, 'records': records, 'limitations': ['분류 방식은 문항별로 표시합니다. 규칙 보조 분류를 전 문항의 수동 검토나 평가원의 공식 분류로 간주하지 않습니다.', '단원은 교육과정 변경 전후의 학습용 묶음입니다. 과거 과목과 실제 시행 연도를 보존합니다.', '추가 대조가 필요한 문항은 원문 위치를 제공하지만 유형별 비중의 분모에서 제외합니다.', '원문 배점은 난도나 정답률이 아니며 과거 비중은 다음 시험의 출제 확률이 아닙니다.']}
    (ROOT / 'dist/gichul/data' / output_name).write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    return {'group': group, 'papers': len(papers), 'indexed': len(records), 'classified': sum(counts.values()), 'pending': scope['pendingCount'], 'types': len(types), 'practiceLinks': len(links)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--group', choices=['all', *GROUPS], default='all')
    parser.add_argument('--cache-dir', type=Path, default=Path(tempfile.gettempdir()) / 'csat-extended-analysis')
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    for group in GROUPS if args.group == 'all' else [args.group]:
        print(json.dumps(build(group, args.cache_dir), ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
