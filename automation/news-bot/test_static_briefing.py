"""Offline SEO/GEO tests; never uses production services or credentials."""

import json
from pathlib import Path
import tempfile
import unittest

from build_static_briefing import END, START, generate, snapshot_markup, update_html


def example_report():
    return {
        "report_date": "2026-11-10",
        "top_news": [
            {
                "title": "항암제 <script>주의</script> 신규 허가",
                "source_urls": ["https://www.bosa.co.kr/news/articleView.html?idxno=123&x=1"],
                "publishers": ["의학신문"],
            },
            {
                "title": "식의약가족 테니스대회 롯데칠성음료 우승",
                "source_urls": ["https://www.bosa.co.kr/news/another"],
            },
            {
                "title": "해당 의약품 승인 소식",
                "source_urls": ["https://evil.example/news"],
            },
            {
                "title": "환자 접근성 향상",
                "source_urls": ["javascript:alert(1)"],
            },
            {
                "title": "비정상 주소 확인",
                "source_urls": ["https://[broken-url/news"],
            },
        ],
    }


class StaticBriefingTests(unittest.TestCase):
    def test_safe_titles_domains_and_date(self):
        html = snapshot_markup(example_report())
        self.assertIn('datetime="2026-11-10"', html)
        self.assertIn('항암제 &lt;script&gt;주의&lt;/script&gt; 신규 허가', html)
        self.assertIn('idxno=123&amp;x=1', html)
        self.assertNotIn('테니스대회', html)
        self.assertNotIn('evil.example', html)
        self.assertNotIn('javascript:', html)
        self.assertNotIn('비정상 주소 확인', html)
        self.assertEqual(html.count('<li>'), 1)

    def test_only_fenced_html_changes_and_is_idempotent(self):
        html = '<header>Original</header>\n' + START + '\nold\n' + END + '\n<footer>Preserved</footer>'
        once = update_html(html, example_report())
        twice = update_html(once, example_report())
        self.assertEqual(once, twice)
        self.assertIn('<header>Original</header>', once)
        self.assertIn('<footer>Preserved</footer>', once)
        self.assertEqual(once.count(START), 1)
        self.assertEqual(once.count(END), 1)

    def test_missing_or_reversed_markers_fail_closed(self):
        with self.assertRaises(ValueError):
            update_html('No markers', example_report())
        with self.assertRaises(ValueError):
            update_html(END + START, example_report())

    def test_generate_validated_latest_and_no_duplicate_rewrites(self):
        with tempfile.TemporaryDirectory(prefix='apuda-news-geo-test-') as folder:
            root = Path(folder)
            data = root / 'public-site' / 'news' / 'data'
            data.mkdir(parents=True)
            index = data.parent / 'index.html'
            index.write_text('<h1>Preserve</h1>\n' + START + '\n' + END + '\n', encoding='utf-8')
            (data / 'latest.json').write_text(json.dumps({
                'path': '/news/data/2026-11-10.json'
            }), encoding='utf-8')
            (data / '2026-11-10.json').write_text(json.dumps(example_report()), encoding='utf-8')

            self.assertTrue(generate(root))
            rendered = index.read_text(encoding='utf-8')
            self.assertIn('datetime="2026-11-10"', rendered)
            self.assertFalse(generate(root))
            self.assertEqual(index.read_text(encoding='utf-8'), rendered)

            # Invalid latest paths must not open arbitrary files or overwrite HTML.
            (data / 'latest.json').write_text(json.dumps({
                'path': '/news/data/../../note/private.json'
            }), encoding='utf-8')
            with self.assertRaises(ValueError):
                generate(root)
            self.assertEqual(index.read_text(encoding='utf-8'), rendered)


if __name__ == '__main__':
    unittest.main()
