import unittest

from app.parsers import parse_lab_text, parse_symptom_text


class ParserTests(unittest.TestCase):
    def test_korean_symptom_sentence(self):
        result = parse_symptom_text(
            "오늘 손발저림이 더 심해졌고 설사를 2번 했어요. 열은 없었어요."
        )

        by_name = {
            item["symptom_name"]: item
            for item in result["symptoms"]
        }

        self.assertIn("손발저림", by_name)
        self.assertEqual(by_name["손발저림"].get("change"), "worse")
        self.assertIn("설사", by_name)
        self.assertEqual(by_name["설사"].get("count_value"), 2)
        self.assertTrue(result["fever_absent"])

    def test_common_lab_lines(self):
        result = parse_lab_text(
            "CEA 5.3 ng/mL\nHb 11.2 g/dL\nAST 35 U/L"
        )

        rows = result["labs"]
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0]["test_name"], "CEA")
        self.assertEqual(rows[0]["canonical_code"], "LAB_CEA")
        self.assertEqual(rows[1]["test_name"], "Hb")
        self.assertEqual(rows[1]["canonical_code"], "LAB_HEMOGLOBIN")
        self.assertEqual(rows[0]["value"], 5.3)
        self.assertEqual(rows[0]["unit"], "ng/mL")

    def test_lab_name_with_numbers(self):
        result = parse_lab_text(
            "CA19-9 35 U/mL\n25-OH Vitamin D 31 ng/mL"
        )

        rows = result["labs"]
        self.assertEqual(rows[0]["test_name"], "CA19-9")
        self.assertEqual(rows[0]["canonical_code"], "LAB_CA19_9")
        self.assertEqual(rows[0]["value"], 35.0)
        self.assertEqual(rows[1]["test_name"], "25-OH Vitamin D")
        self.assertEqual(rows[1]["value"], 31.0)


if __name__ == "__main__":
    unittest.main()
