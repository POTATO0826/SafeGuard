from __future__ import annotations

import json
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, urlunparse


@dataclass(frozen=True)
class TrustedSource:
    publisher: str
    url: str
    domains: tuple[str, ...]


SOURCES = (
    TrustedSource("CertiK", "https://www.certik.com/resources/blog", ("certik.com",)),
    TrustedSource("Blockaid", "https://www.blockaid.io/blog", ("blockaid.io",)),
    TrustedSource("MetaMask Security", "https://metamask.io/news", ("metamask.io",)),
    TrustedSource("ScamSniffer", "https://drops.scamsniffer.io/", ("scamsniffer.io",)),
    TrustedSource("Chainalysis", "https://www.chainalysis.com/blog/", ("chainalysis.com",)),
    TrustedSource("CoinDesk", "https://www.coindesk.com/tag/security/", ("coindesk.com",)),
    TrustedSource("Immunefi", "https://immunefi.com/blog/security-guides/", ("immunefi.com",)),
    TrustedSource(
        "Trezor Learn",
        "https://trezor.io/learn/security-privacy",
        ("trezor.io",),
    ),
)

KEYWORDS = (
    "wallet",
    "crypto scam",
    "cryptocurrency scam",
    "phishing",
    "drainer",
    "address poisoning",
    "seed phrase",
    "recovery phrase",
    "private key",
    "token approval",
    "permit signature",
    "blind signing",
    "clear signing",
    "hardware wallet",
    "cold wallet",
    "self-custody",
    "wallet security",
    "wallet safety",
    "wallet hygiene",
    "transaction simulation",
    "malware",
    "clipboard",
    "social engineering",
    "web3 security",
    "hack",
    "exploit",
    "stolen funds",
)

CATEGORY_RULES = (
    ("poisoning", ("address poisoning", "poisoned address", "look-alike address")),
    ("drainers", ("drainer", "wallet drain", "malicious approval", "ice phishing")),
    ("phishing", ("phishing", "social engineering", "impersonat", "fake support")),
    (
        "guides",
        (
            "guide",
            "how to",
            "protect",
            "checklist",
            "safety",
            "best practice",
            "hardware wallet",
            "cold wallet",
            "clear signing",
            "token approval",
            "permit signature",
            "self-custody",
        ),
    ),
)

ROOT = Path(__file__).resolve().parent.parent
CACHE_PATH = ROOT / "backend" / "data" / "news-cache.json"
CACHE_VERSION = 3
CACHE_TTL_SECONDS = int(os.getenv("NEWS_CACHE_TTL_SECONDS", "21600"))
RETRY_SECONDS = int(os.getenv("NEWS_RETRY_SECONDS", "300"))
MAX_ARTICLES_PER_SOURCE = int(os.getenv("NEWS_ARTICLES_PER_SOURCE", "2"))
MAX_RETURNED_ARTICLES = int(os.getenv("NEWS_MAX_ARTICLES", "18"))

_lock = threading.Lock()
_articles: list[dict[str, Any]] = []
_refreshed_at: str | None = None
_refreshing = False
_last_error: str | None = None
_last_attempt_at: datetime | None = None


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalise_url(url: str) -> str:
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc.lower(), parsed.path.rstrip("/"), "", parsed.query, ""))


def _is_allowed_url(url: str, domains: tuple[str, ...]) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    hostname = parsed.hostname.lower()
    return any(hostname == domain or hostname.endswith(f".{domain}") for domain in domains)


def _is_relevant(text: str) -> bool:
    haystack = text.casefold()
    return any(keyword in haystack for keyword in KEYWORDS)


def _category_for(text: str) -> str:
    haystack = text.casefold()
    for category, terms in CATEGORY_RULES:
        if any(term in haystack for term in terms):
            return category
    return "reports"


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _summary_for(article: Any) -> str:
    metadata_summary = _clean_text(getattr(article, "meta_description", "") or "")
    text = metadata_summary or _clean_text(getattr(article, "text", "") or "")
    if len(text) <= 260:
        return text
    shortened = text[:257].rsplit(" ", 1)[0]
    return f"{shortened}…"


def _published_at(article: Any) -> datetime | None:
    value = getattr(article, "publish_date", None)
    if not isinstance(value, datetime):
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _candidate_score(url: str) -> int:
    path = urlparse(url).path.replace("-", " ").replace("_", " ").casefold()
    return sum(1 for keyword in KEYWORDS if keyword in path)


def _parse_candidate(candidate: Any, source: TrustedSource) -> dict[str, Any] | None:
    url = _normalise_url(getattr(candidate, "url", ""))
    if not _is_allowed_url(url, source.domains):
        return None

    candidate.download()
    candidate.parse()

    title = _clean_text(getattr(candidate, "title", "") or "")
    summary = _summary_for(candidate)
    searchable = f"{title} {summary} {_clean_text(getattr(candidate, 'text', '') or '')[:1500]}"
    if not title or not summary or not _is_relevant(searchable):
        return None

    published = _published_at(candidate)
    return {
        "publisher": source.publisher,
        "title": title,
        "date": published.strftime("%b %Y") if published else "Recent",
        "publishedAt": published.isoformat() if published else None,
        "summary": summary,
        "category": _category_for(searchable),
        "url": url,
    }


def _scrape_source(source: TrustedSource) -> list[dict[str, Any]]:
    import newspaper

    config = newspaper.Config()
    config.browser_user_agent = "SafeGuardNewsBot/1.0 (+local curated security feed)"
    config.request_timeout = 12
    config.number_threads = 2
    config.memoize_articles = False

    paper = newspaper.build(source.url, config=config)
    candidates = [article for article in paper.articles if _is_allowed_url(article.url, source.domains)]
    candidates.sort(key=lambda article: _candidate_score(article.url), reverse=True)

    results: list[dict[str, Any]] = []
    for candidate in candidates[: MAX_ARTICLES_PER_SOURCE * 3]:
        if len(results) >= MAX_ARTICLES_PER_SOURCE:
            break
        try:
            parsed = _parse_candidate(candidate, source)
            if parsed:
                results.append(parsed)
        except Exception:
            # One publisher page should never prevent other articles from loading.
            continue
    return results


def scrape_news() -> list[dict[str, Any]]:
    collected: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(_scrape_source, source): source for source in SOURCES}
        for future in as_completed(futures):
            try:
                collected.extend(future.result())
            except Exception:
                continue

    deduplicated: dict[str, dict[str, Any]] = {}
    for article in collected:
        deduplicated.setdefault(article["url"], article)

    articles = list(deduplicated.values())
    articles.sort(key=lambda item: item.get("publishedAt") or "", reverse=True)
    return articles[:MAX_RETURNED_ARTICLES]


def _load_cache() -> None:
    global _articles, _refreshed_at
    if not CACHE_PATH.exists():
        return
    try:
        payload = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        articles = payload.get("articles", [])
        refreshed_at = payload.get("refreshedAt")
        if (
            payload.get("version") == CACHE_VERSION
            and isinstance(articles, list)
            and isinstance(refreshed_at, str)
        ):
            _articles = articles
            _refreshed_at = refreshed_at
    except (OSError, ValueError, TypeError):
        pass


def _cache_is_fresh() -> bool:
    if not _refreshed_at:
        return False
    try:
        refreshed = datetime.fromisoformat(_refreshed_at)
        return (_utc_now() - refreshed).total_seconds() < CACHE_TTL_SECONDS
    except ValueError:
        return False


def _write_cache(articles: list[dict[str, Any]], refreshed_at: str) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = CACHE_PATH.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(
            {"version": CACHE_VERSION, "articles": articles, "refreshedAt": refreshed_at},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    temporary.replace(CACHE_PATH)


def _refresh() -> None:
    global _articles, _refreshed_at, _refreshing, _last_error
    try:
        articles = scrape_news()
        if not articles:
            raise RuntimeError("No relevant articles were returned by the trusted sources")
        refreshed_at = _utc_now().isoformat()
        _write_cache(articles, refreshed_at)
        with _lock:
            _articles = articles
            _refreshed_at = refreshed_at
            _last_error = None
    except Exception as exc:
        with _lock:
            _last_error = str(exc)
    finally:
        with _lock:
            _refreshing = False


def start_refresh_if_needed(*, force: bool = False) -> bool:
    global _last_attempt_at, _refreshing
    with _lock:
        retry_blocked = (
            _last_attempt_at is not None
            and (_utc_now() - _last_attempt_at).total_seconds() < RETRY_SECONDS
        )
        if _refreshing or (not force and (_cache_is_fresh() or retry_blocked)):
            return False
        _refreshing = True
        _last_attempt_at = _utc_now()
    threading.Thread(target=_refresh, name="news-refresh", daemon=True).start()
    return True


def get_snapshot() -> dict[str, Any]:
    with _lock:
        return {
            "articles": list(_articles),
            "refreshedAt": _refreshed_at,
            "refreshing": _refreshing,
            "source": "newspaper4k",
            "error": _last_error if not _articles else None,
        }


_load_cache()
