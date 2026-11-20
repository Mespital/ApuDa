"""Rebuild reviewed math classifications. Source PDFs and extracted text stay in a temporary cache."""
import argparse
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
REVIEW = ROOT / 'scripts/data/csat-math-type-review.json'
OUTPUT = ROOT / 'dist/gichul/data/math-type-analysis.json'
COMMON_TYPES = {
    'e': 'math-exponents', 'ef': 'math-exponential-functions', 's': 'math-sequence',
    'l': 'math-limit', 'd': 'math-derivative', 'da': 'math-derivative-application',
    'i': 'math-integral', 'ia': 'math-integral-application', 't': 'math-trigonometry',
}


def source_pdfs(review, archive, cache):
    resources = {r['id']: r for r in archive['resources']}
    by_resource = {}
    for paper in review['papers']:
        by_resource.setdefault(paper['resourceId'], []).append(paper)

    def fetch(group):
        resource_id, papers = group
        resource = resources[resource_id]
        paths = {p['fileId']: cache / f"{p['year']}-{p['fileId']}.pdf" for p in papers}
        if not all(p.exists() for p in paths.values()):
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
            else:
                paths['paper'].write_bytes(raw)
        result = []
        for paper in papers:
            path = paths[paper['fileId']]
            raw = path.read_bytes()
            if not raw.startswith(b'%PDF-') or hashlib.sha256(raw).hexdigest() != paper['pdfSha256']:
                raise ValueError(f"Source changed; review required: {paper['year']} {paper['fileName']}")
            result.append((paper, resource, path))
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        return [item for group in pool.map(fetch, by_resource.items()) for item in group]


def extract(paper, path):
    doc = fitz.open(path)
    if '홀수형' not in re.sub(r'\s+', '', doc[0].get_text()):
        raise ValueError('Reviewed odd form required')
    lines = []
    default = paper.get('legacyCourseId', 'math-common')
    for page_index, page in enumerate(doc):
        text = page.get_text()
        if '짝수형' in re.sub(r'\s+', '', text):
            break
        header = re.sub(r'\s+', '', text[:130])
        course = default
        if paper['year'] >= 2022:
            course = next((c for label, c in [('확률과통계', 'math-statistics'), ('미적분', 'math-calculus'), ('기하', 'math-geometry')] if label in header), 'math-common')
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                value = ''.join(s['text'] for s in line['spans']).strip()
                if value:
                    lines.append({'text': value, 'page': page_index + 1, 'courseId': course, 'box': [round(v, 2) for v in line['bbox']]})
    markers = []
    for index, line in enumerate(lines):
        match = re.match(r'^(\d{1,2})\s*\.\s*(.*)', line['text'])
        if match and 1 <= int(match[1]) <= 30 and line['box'][0] < 600:
            markers.append((index, int(match[1]), line))
    found = {}
    for position, (index, number, line) in enumerate(markers):
        key = (line['courseId'], number)
        if key in found:
            raise ValueError(f'Duplicate question: {paper["year"]} {key}')
        end = markers[position + 1][0] if position + 1 < len(markers) else len(lines)
        score = re.search(r'\[([234])점\]', ' '.join(x['text'] for x in lines[index:end]))
        if not score:
            raise ValueError(f'Missing score: {paper["year"]} {key}')
        found[key] = {**line, 'questionNumber': number, 'points': int(score[1])}
    if len(found) != (30 if paper['year'] < 2022 else 46):
        raise ValueError(f'Incomplete paper: {paper["year"]} {len(found)}')
    return found, len(doc), [round(doc[0].rect.width, 2), round(doc[0].rect.height, 2)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path, default=Path(tempfile.gettempdir()) / 'csat-math-analysis')
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    review = json.loads(REVIEW.read_text())
    archive = json.loads((ROOT / 'dist/gichul/data/archive.json').read_text())
    records, papers, types = [], [], {}
    for paper, resource, path in source_pdfs(review, archive, args.cache_dir):
        found, page_count, size = extract(paper, path)
        expected = {(c, int(n)) for key, labels in review['labels'].items() if int(key.split('|')[0]) == paper['year'] for c in [key.split('|')[1]] for n in labels if paper['year'] >= 2022 or c == paper['legacyCourseId']}
        if set(found) != expected:
            raise ValueError(f'Review and source mismatch: {paper["year"]}')
        for (course, number), item in found.items():
            code = review['labels'][f"{paper['year']}|{course}"][str(number)]
            definition = review['typeDefinitions'][code]
            type_id = COMMON_TYPES[code] if course == 'math-common' else f'{course}-{definition["slug"]}'
            unit = definition['unit']
            if course == 'math-common':
                unit = ('수학Ⅰ · ' if code in ('e', 'ef', 's', 't') else '수학Ⅱ · ') + unit
            types[type_id] = {'label': definition['label'], 'unit': unit, 'method': definition['method'], 'courseId': course}
            records.append({'id': f"official-{paper['year']}-{course}-odd-{number:02d}", 'year': paper['year'], 'courseId': course, 'questionNumber': number, 'typeId': type_id, 'unit': unit, 'form': 'odd', 'resourceId': resource['id'], 'fileId': paper['fileId'], 'page': item['page'], 'box': item['box'], 'points': item['points'], 'examStructure': 'ga-na' if paper['year'] < 2022 else 'common-elective', 'basis': '원문 조건·수식의 대표 개념 대조; 복합 문항은 대표 유형 1개'})
        papers.append({**paper, 'sourceUrl': resource['url'], 'pdfPageCount': page_count, 'pageSize': size})
    records.sort(key=lambda r: (r['year'], r['courseId'], r['questionNumber']))
    if len(records) != 516:
        raise ValueError(f'Expected 516 unique question placements; found {len(records)}')
    result = {'schemaVersion': 1, 'updatedAt': review['reviewedAt'], 'classificationMethod': '원문 발문·조건·수식을 대조하여 대표 개념을 하나 부여한 학습용 분류', 'scope': {'domain': '수학', 'years': list(range(2018, 2028)), 'expectedCount': 516, 'classifiedCount': len(records), 'form': '홀수형 1회. 공통 22문항은 선택과목마다 중복하지 않음.', 'courseCounts': {c: sum(r['courseId'] == c for r in records) for c in sorted({r['courseId'] for r in records})}}, 'types': types, 'papers': papers, 'records': records, 'limitations': ['가·나형과 공통·선택 체계를 별도로 비교합니다. 과목별 교육과정 범위가 동일하지 않습니다.', '선택과목 전체 합계는 한 수험생의 시험 문항 수가 아닙니다.', '대표 개념 1개를 부여한 학습용 분류이며 공식 출제 통계·난도·정답률·예측 확률이 아닙니다.']}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'records': len(records), 'courseCounts': result['scope']['courseCounts'], 'papers': len(papers)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
