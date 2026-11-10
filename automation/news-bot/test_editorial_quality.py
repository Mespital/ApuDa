"""Offline regression tests for patient-relevant TOP editorial guards."""

import unittest
from types import SimpleNamespace

from editorial_quality import curated_top_articles, excluded_from_top, keyword_mentioned


class EditorialQualityTest(unittest.TestCase):
    def test_actual_2026_11_01_false_positive(self):
        title = "식의약가족 테니스대회 롯데칠성음료 우승"
        self.assertFalse(keyword_mentioned("약가", title))
        self.assertEqual(excluded_from_top(title), "sports_event")

    def test_obituary_not_in_top(self):
        self.assertEqual(excluded_from_top("최봉영 메디소비자뉴스 기자 모친"), "obituary")
        self.assertEqual(excluded_from_top("[부고] 의약업계 관계자 별세"), "obituary")

    def test_non_patient_publicity_event(self):
        self.assertEqual(excluded_from_top("보건의료단체 홍보인 한자리… 소통·협력 다져"), "publicity_event")

    def test_relevant_policy_is_retained(self):
        self.assertTrue(keyword_mentioned("약가", "정부 약가 인하 논의"))
        self.assertTrue(keyword_mentioned("수가", "병원 수가 조정"))
        self.assertFalse(keyword_mentioned("수가", "환자수가 늘었다"))
        self.assertIsNone(excluded_from_top("식약처 항암제 허가 확대 발표"))
        self.assertIsNone(excluded_from_top("환자 치료 개선을 위한 의학 학술대회 임상결과 발표"))

    def test_curated_top_does_not_mutate_raw_article_archive(self):
        articles = [
            SimpleNamespace(title="식의약가족 테니스대회 롯데칠성음료 우승", score=51, published_at="2026-11-01"),
            SimpleNamespace(title="식약처 항암제 허가 확대 발표", score=42, published_at="2026-11-01"),
            SimpleNamespace(title="최봉영 메디소비자뉴스 기자 모친", score=12, published_at="2026-11-01"),
            SimpleNamespace(title="의료기관 항암 치료 개선", score=20, published_at="2026-11-01"),
        ]
        before = tuple(articles)
        selected = curated_top_articles(articles, 5)
        self.assertEqual([article.title for article in selected], [
            "식약처 항암제 허가 확대 발표", "의료기관 항암 치료 개선"
        ])
        self.assertEqual(tuple(articles), before)


if __name__ == "__main__":
    unittest.main()
