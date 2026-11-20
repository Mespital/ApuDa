"""Rebuild reviewed Korean history classifications from hash-locked official PDFs."""
import argparse
import concurrent.futures
import collections
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
REVIEW = ROOT / 'scripts/data/csat-history-type-review.json'
OUTPUT = ROOT / 'dist/gichul/data/history-type-analysis.json'

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
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                value = ''.join(s['text'] for s in line['spans']).strip()
                if value:
                    lines.append({'text': value, 'page': page_index + 1, 'box': [round(v, 2) for v in line['bbox']]})
    # The 2018 paper has a different page size and column origins. Determine
    # both question columns from the source rather than assuming a fixed scale.
    columns = [x for x, _ in collections.Counter(round(l['box'][0], 1) for l in lines if re.match(r'^\d{1,2}\s*\.', l['text'])).most_common(2)]
    markers = []
    for index, line in enumerate(lines):
        match = re.match(r'^(\d{1,2})\s*\.\s*(.*)', line['text'])
        if match and 1 <= int(match[1]) <= 20 and any(abs(line['box'][0] - x) < 2 for x in columns):
            markers.append((index, int(match[1]), line))
    found = {}
    for position, (index, number, line) in enumerate(markers):
        if number in found:
            raise ValueError(f'Duplicate question: {paper["year"]} {number}')
        end = markers[position + 1][0] if position + 1 < len(markers) else len(lines)
        segment = ' '.join(x['text'] for x in lines[index:end])
        found[number] = {**line, 'points': 3 if '[3점]' in segment else 2}
    if set(found) != set(range(1, 21)) or sum(x['points'] for x in found.values()) != 50:
        raise ValueError(f'Incomplete paper or score mismatch: {paper["year"]}')
    return found, len(doc), [round(doc[0].rect.width, 2), round(doc[0].rect.height, 2)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path, default=Path(tempfile.gettempdir()) / 'csat-history-analysis')
    args = parser.parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    review = json.loads(REVIEW.read_text())
    archive = json.loads((ROOT / 'dist/gichul/data/archive.json').read_text())
    records, papers, types = [], [], {}
    for paper, resource, path in source_pdfs(review, archive, args.cache_dir):
        found, page_count, size = extract(paper, path)
        labels = review['labels'][str(paper['year'])]
        if set(found) != {int(n) for n in labels}:
            raise ValueError(f'Review and source mismatch: {paper["year"]}')
        for number, item in found.items():
            label = labels[str(number)]
            period = review['periodDefinitions'][label['period']]['label']
            theme = review['themeDefinitions'][label['theme']]
            style = review['styleDefinitions'][label['style']]['label']
            type_id = f'korean-history-{label["period"]}-{label["theme"]}'
            types[type_id] = {'label': f'{period} · {theme["label"]}', 'unit': period, 'method': theme['method'], 'courseId': 'korean-history'}
            records.append({'id': f"official-{paper['year']}-korean-history-odd-{number:02d}", 'year': paper['year'], 'courseId': 'korean-history', 'questionNumber': number, 'typeId': type_id, 'unit': period, 'form': 'odd', 'resourceId': resource['id'], 'fileId': paper['fileId'], 'page': item['page'], 'box': item['box'], 'points': item['points'], 'questionStyle': style, 'examStructure': 'single-paper', 'basis': '발문·사료·이미지 단서의 대표 시대·주제·발문 형식 대조; 복합 문항은 대표 범주 1개'})
        papers.append({**paper, 'sourceUrl': resource['url'], 'pdfPageCount': page_count, 'pageSize': size})
    records.sort(key=lambda r: (r['year'], r['questionNumber']))
    if len(records) != 200:
        raise ValueError(f'Expected 200 placements; found {len(records)}')
    result = {'schemaVersion': 1, 'updatedAt': review['reviewedAt'], 'classificationMethod': '발문·사료·이미지 단서에 대표 시대와 주제를 부여하고 발문 형식을 별도로 표시한 학습용 분류', 'scope': {'domain': '한국사', 'years': list(range(2018, 2028)), 'expectedCount': 200, 'classifiedCount': len(records), 'form': '각 학년도 홀수형 1~20번 한 회. 합본의 짝수형은 제외.', 'courseCounts': {'korean-history': 200}, 'units': [v['label'] for v in review['periodDefinitions'].values()]}, 'types': types, 'papers': papers, 'records': records, 'limitations': ['시대 경계에 걸친 인물·단체와 복합 자료는 해당 문항이 묻는 대표 학습 시대·주제 하나로 분류합니다. 등장인물의 생몰년이나 단체 설립 연도만으로 시대를 결정하지 않습니다.', '시대·주제 분류와 발문 형식은 서로 다른 기준입니다. 발문 형식은 근거 문항에 표시하며 구성 비중은 시대·주제별로 계산합니다.', '평가원의 공식 유형 통계·난도·정답률·예측 확률이 아닙니다. 원문 배점과 학습용 유형만 제공합니다.']}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'records': len(records), 'units': len(result['scope']['units']), 'types': len(types), 'styles': len({r['questionStyle'] for r in records}), 'papers': len(papers)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
