"""Rebuild source-reviewed Korean types; keep PDF text in a temporary cache only."""
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
REVIEW = ROOT / 'scripts/data/csat-korean-type-review.json'
OUTPUT = ROOT / 'dist/gichul/data/korean-type-analysis.json'


def source_pdfs(review, archive, cache):
    resources = {r['id']: r for r in archive['resources']}

    def fetch(paper):
        resource = resources[paper['resourceId']]
        path = cache / f"{paper['year']}-{paper['fileId']}.pdf"
        if not path.exists():
            raw = urllib.request.urlopen(resource['url'], timeout=90).read()
            if raw.startswith(b'PK'):
                with zipfile.ZipFile(io.BytesIO(raw)) as bundle:
                    for entry in bundle.infolist():
                        name = entry.filename
                        if not entry.flag_bits & 2048:
                            name = name.encode('cp437').decode('cp949')
                        file_id = hashlib.sha256(f'{name}|{entry.CRC}|{entry.file_size}'.encode()).hexdigest()[:24]
                        if file_id == paper['fileId']:
                            path.write_bytes(bundle.read(entry))
                            break
            elif paper['fileId'] == 'paper':
                path.write_bytes(raw)
        raw = path.read_bytes()
        if not raw.startswith(b'%PDF-') or hashlib.sha256(raw).hexdigest() != paper['pdfSha256']:
            raise ValueError(f"Source changed; review required: {paper['year']}")
        return paper, resource, path

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        return list(pool.map(fetch, review['papers']))


def extract(paper, path):
    doc = fitz.open(path)
    if '홀수형' not in re.sub(r'\s+', '', doc[0].get_text()):
        raise ValueError('Reviewed odd form required')
    lines = []
    for page_index, page in enumerate(doc):
        if '짝수형' in re.sub(r'\s+', '', page.get_text()):
            break
        course = 'korean-legacy' if paper['year'] < 2022 else 'korean-common'
        # Elective headers occur at the end of the PDF text stream on some pages.
        # Read their geometric header area, not the first characters of the stream.
        header = re.sub(r'\s+', '', page.get_text(clip=fitz.Rect(0, 80, page.rect.width, 210)))
        if paper['year'] >= 2022:
            course = next((c for label, c in [('화법과작문', 'korean-speech'), ('언어와매체', 'korean-language')] if label in header), course)
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                value = ''.join(s['text'] for s in line['spans']).strip()
                if value:
                    lines.append({'text': value, 'page': page_index + 1, 'courseId': course, 'box': [round(v, 2) for v in line['bbox']]})
    markers = []
    for index, line in enumerate(lines):
        match = re.match(r'^(\d{1,2})\s*\.\s*(.*)', line['text'])
        if not match or not 1 <= int(match[1]) <= 45 or line['box'][0] >= 600:
            continue
        number = int(match[1])
        # Numbered instructions in a media passage are not exam questions.
        if paper['year'] >= 2022 and ((line['courseId'] == 'korean-common' and number > 34) or (line['courseId'] != 'korean-common' and number < 35)):
            continue
        markers.append((index, number, line))
    found = {}
    for position, (index, number, line) in enumerate(markers):
        key = (line['courseId'], number)
        if key in found:
            raise ValueError(f'Duplicate question: {paper["year"]} {key}')
        end = markers[position + 1][0] if position + 1 < len(markers) else len(lines)
        segment = ' '.join(x['text'] for x in lines[index:end])
        found[key] = {**line, 'questionNumber': number, 'points': 3 if '[3점]' in segment else 2}
    if len(found) != (45 if paper['year'] < 2022 else 56):
        raise ValueError(f'Incomplete paper: {paper["year"]} {len(found)}')
    return found, len(doc), [round(doc[0].rect.width, 2), round(doc[0].rect.height, 2)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path, default=Path(tempfile.gettempdir()) / 'csat-korean-analysis')
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    review = json.loads(REVIEW.read_text())
    archive = json.loads((ROOT / 'dist/gichul/data/archive.json').read_text())
    records, papers, types = [], [], {}
    for paper, resource, path in source_pdfs(review, archive, args.cache_dir):
        found, page_count, size = extract(paper, path)
        expected = {(key.split('|')[1], int(n)) for key, labels in review['labels'].items() if int(key.split('|')[0]) == paper['year'] for n in labels}
        if set(found) != expected:
            raise ValueError(f'Review and source mismatch: {paper["year"]}')
        for (course, number), item in found.items():
            code = review['labels'][f"{paper['year']}|{course}"][str(number)]
            definition = review['typeDefinitions'][code]
            type_id = f'{course}-{definition["slug"]}'
            unit = definition['unit']
            types[type_id] = {'label': definition['label'], 'unit': unit, 'method': definition['method'], 'courseId': course}
            records.append({'id': f"official-{paper['year']}-{course}-odd-{number:02d}", 'year': paper['year'], 'courseId': course, 'questionNumber': number, 'typeId': type_id, 'unit': unit, 'form': 'odd', 'resourceId': resource['id'], 'fileId': paper['fileId'], 'page': item['page'], 'box': item['box'], 'points': item['points'], 'examStructure': 'single-paper' if paper['year'] < 2022 else 'common-elective', 'basis': '원문 발문·지문 묶음·선택지의 대표 평가 내용 대조; 복합 문항은 대표 유형 1개'})
        for course in {c for c, _ in found}:
            score = sum(r['points'] for r in records if r['year'] == paper['year'] and r['courseId'] == course)
            expected_score = 100 if course == 'korean-legacy' else 76 if course == 'korean-common' else 24
            if score != expected_score:
                raise ValueError(f'Score mismatch: {paper["year"]} {course} {score}')
        papers.append({**paper, 'sourceUrl': resource['url'], 'pdfPageCount': page_count, 'pageSize': size})
    records.sort(key=lambda r: (r['year'], r['courseId'], r['questionNumber']))
    if len(records) != 516:
        raise ValueError(f'Expected 516 unique question placements; found {len(records)}')
    result = {'schemaVersion': 1, 'updatedAt': review['reviewedAt'], 'classificationMethod': '원문 발문·지문 묶음·선택지를 대조하여 대표 평가 내용을 하나 부여한 학습용 분류', 'scope': {'domain': '국어', 'years': list(range(2018, 2028)), 'expectedCount': 516, 'classifiedCount': len(records), 'form': '홀수형 1회. 공통 34문항은 선택과목마다 중복하지 않음.', 'courseCounts': {c: sum(r['courseId'] == c for r in records) for c in sorted({r['courseId'] for r in records})}}, 'types': types, 'papers': papers, 'records': records, 'limitations': ['2018~2021 단일 시험과 2022~2027 공통·선택 체계를 구분합니다. 동일 문항 번호의 유형을 매년 같다고 가정하지 않습니다.', '공통 34문항과 두 선택과목 각 11문항의 합계 56문항은 한 수험생의 시험 문항 수가 아닙니다.', '대표 평가 내용 1개를 부여한 학습용 분류이며 공식 출제 통계·난도·정답률·예측 확률이 아닙니다.']}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'records': len(records), 'courseCounts': result['scope']['courseCounts'], 'types': len(types), 'papers': len(papers)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
