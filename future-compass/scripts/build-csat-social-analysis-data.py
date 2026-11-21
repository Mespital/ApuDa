"""Rebuild reviewed social-studies classifications from SHA-locked official PDFs."""
import argparse
import collections
import concurrent.futures
import hashlib
import io
import json
import re
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'scripts/data/csat-social-type-review.json'
OUTPUT = ROOT / 'dist/gichul/data/social-type-analysis.json'
COURSES = {'social-culture': '사회문화', 'social-life-ethics': '생활과윤리'}


def source_pdfs(review, archive, cache):
    resources = {r['id']: r for r in archive['resources']}
    groups = {}
    for paper in review['papers']:
        groups.setdefault(paper['resourceId'], []).append(paper)

    def fetch(group):
        resource_id, papers = group
        resource = resources[resource_id]
        # Direct files use the same fileId, "paper", in both courses.
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


def extract(paper, path):
    doc = fitz.open(path)
    header = re.sub(r'[\s·ㆍ･]', '', doc[0].get_text())
    if len(doc) != 4 or COURSES[paper['courseId']] not in header or '홀수형' in header or '짝수형' in header:
        raise ValueError(f"Expected the reviewed, single-form four-page course paper: {paper['year']} {paper['courseId']}")
    lines = []
    for page_index, page in enumerate(doc):
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                value = ''.join(span['text'] for span in line['spans']).strip()
                if value:
                    lines.append({'text': value, 'page': page_index + 1, 'box': [round(v, 2) for v in line['bbox']], 'fontSize': max(span['size'] for span in line['spans'])})
    # A numbered list inside a passage can share a question-number pattern.
    # Use the heading font and both source column origins, not text flow order.
    columns = [x for x, _ in collections.Counter(round(line['box'][0], 1) for line in lines if line['fontSize'] >= 12 and re.match(r'^\d{1,2}\s*\.', line['text'])).most_common(2)]
    markers = []
    for line in lines:
        match = re.match(r'^(\d{1,2})\s*\.', line['text'])
        if match and line['fontSize'] >= 12 and 1 <= int(match[1]) <= 20 and any(abs(line['box'][0] - x) < 2 for x in columns):
            markers.append((int(match[1]), line))
    if len(markers) != 20 or {n for n, _ in markers} != set(range(1, 21)):
        raise ValueError(f"Missing or duplicate question: {paper['year']} {paper['courseId']}")
    found = {}
    for number, line in sorted(markers):
        page = doc[line['page'] - 1]
        left = line['box'][0] < page.rect.width / 2
        below = [other['box'][1] for _, other in markers if other['page'] == line['page'] and (other['box'][0] < page.rect.width / 2) == left and other['box'][1] > line['box'][1] + 5]
        rect = fitz.Rect(max(0, min(columns) - 15) if left else page.rect.width / 2, line['box'][1] - 2, page.rect.width / 2 if left else page.rect.width - 35, min(below) - 3 if below else page.rect.height - 40)
        text = re.sub(r'\s+', '', page.get_text(clip=rect))
        found[number] = {'page': line['page'], 'box': line['box'], 'points': 3 if '[3점]' in text else 2}
    if sum(r['points'] for r in found.values()) != 50:
        raise ValueError(f"Score mismatch: {paper['year']} {paper['courseId']}")
    return found, [round(doc[0].rect.width, 2), round(doc[0].rect.height, 2)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path, default=Path(tempfile.gettempdir()) / 'csat-social-analysis')
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    review = json.loads(REVIEW.read_text())
    archive = json.loads((ROOT / 'dist/gichul/data/archive.json').read_text())
    records, papers, types = [], [], {}
    for course in review['courses'].values():
        types.update(course['types'])
    for paper, resource, path in source_pdfs(review, archive, args.cache_dir):
        found, size = extract(paper, path)
        course = review['courses'][paper['courseId']]
        labels = course['labels'][str(paper['year'])]
        if set(found) != {int(n) for n in labels}:
            raise ValueError('Review/source question mismatch')
        for number, item in found.items():
            label = labels[str(number)]
            meta = types[label['typeId']]
            if meta['courseId'] != paper['courseId'] or meta['unit'] not in course['unitOrder']:
                raise ValueError('Review course/unit mismatch')
            records.append({'id': f"official-{paper['year']}-{paper['courseId']}-single-{number:02d}", 'year': paper['year'], 'courseId': paper['courseId'], 'questionNumber': number, 'typeId': label['typeId'], 'unit': meta['unit'], 'form': 'single', 'resourceId': paper['resourceId'], 'fileId': paper['fileId'], 'page': item['page'], 'box': item['box'], 'points': item['points'], 'questionStyle': label['questionStyle'], 'examStructure': 'single-paper', 'basis': '발문·자료·선택지의 대표 학습 주제를 대조하고 발문 형식을 별도 표시; 복합 문항은 대표 주제 1개'})
        papers.append({**paper, 'sourceUrl': resource['url'], 'pdfPageCount': 4, 'pageSize': size})
    records.sort(key=lambda r: (r['year'], r['courseId'], r['questionNumber']))
    counts = dict(collections.Counter(r['courseId'] for r in records))
    if len(papers) != 20 or counts != {course_id: 200 for course_id in COURSES}:
        raise ValueError(f'Incomplete review coverage: {counts}')
    result = {'schemaVersion': 1, 'updatedAt': review['reviewedAt'], 'classificationMethod': '발문·자료·선택지를 대조한 학습용 대표 주제 분류와 별도의 발문 형식', 'scope': {'domain': '사회탐구', 'years': list(range(2018, 2028)), 'expectedCount': 400, 'classifiedCount': len(records), 'courseCounts': counts, 'unitsByCourse': {course_id: course['unitOrder'] for course_id, course in review['courses'].items()}, 'form': '과목별 단일형 시험지의 1~20번 한 회. 홀수·짝수형으로 나누지 않음.'}, 'types': types, 'papers': papers, 'records': records, 'limitations': ['사회탐구 9과목 중 사회·문화와 생활과 윤리 두 과목의 공식 기출 유형 분류입니다. 다른 과목의 분류가 완료된 것으로 표시하지 않습니다.', '단원은 서로 다른 교육과정의 기출을 탐색하기 위한 학습용 묶음이며 공식 교육과정의 동일 단원 코드로 간주하지 않습니다. 복합 문항에는 대표 주제 하나를 부여합니다.', '주제와 발문 형식은 별개입니다. 사상가나 문항 번호만으로 유형을 정하지 않으며, 같은 사상가도 문항의 쟁점에 따라 다른 주제에 배정됩니다.', '평가원의 공식 유형 통계·난도·정답률·예측 확률이 아닙니다. 원문 2·3점 배점은 난도로 해석하지 않습니다.']}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'records': len(records), 'courses': counts, 'types': len(types), 'styles': len({r['questionStyle'] for r in records}), 'papers': len(papers)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
