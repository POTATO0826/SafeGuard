import unittest

from news_service import _category_for, _is_allowed_url, _is_relevant, _normalise_url


class NewsServiceTests(unittest.TestCase):
    def test_only_allows_https_or_http_on_trusted_domain(self) -> None:
        self.assertTrue(_is_allowed_url("https://news.certik.com/report", ("certik.com",)))
        self.assertFalse(_is_allowed_url("https://certik.com.example.org/report", ("certik.com",)))
        self.assertFalse(_is_allowed_url("file:///etc/passwd", ("certik.com",)))

    def test_classifies_wallet_threats(self) -> None:
        self.assertEqual(_category_for("New address poisoning campaign"), "poisoning")
        self.assertEqual(_category_for("Wallet drainer steals tokens"), "drainers")
        self.assertEqual(_category_for("Phishing campaign targets users"), "phishing")
        self.assertEqual(_category_for("Hardware wallet safety checklist"), "guides")

    def test_relevance_and_url_normalisation(self) -> None:
        self.assertTrue(_is_relevant("How a crypto wallet drainer works"))
        self.assertTrue(_is_relevant("Best practices for clear signing"))
        self.assertFalse(_is_relevant("Local football scores"))
        self.assertEqual(
            _normalise_url("https://Example.com/story/#section"),
            "https://example.com/story",
        )


if __name__ == "__main__":
    unittest.main()
